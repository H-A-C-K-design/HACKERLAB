import { Server as SocketIOServer, Socket } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';

interface SocketUser {
  userId: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  fullName: string;
}

export function setupLiveSockets(io: SocketIOServer) {
  const liveNamespace = io.of('/live');

  // Authenticated handshake using cookies
  liveNamespace.use(async (socket: Socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error: Missing cookies'));
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;

      if (!token) {
        return next(new Error('Authentication error: No access token'));
      }

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as any;
      (socket as any).user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName,
      };

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  liveNamespace.on('connection', (socket: Socket) => {
    const user: SocketUser = (socket as any).user;

    socket.on('join_class', async ({ classId }: { classId: string }) => {
      try {
        const liveClass = await prisma.liveClass.findUnique({
          where: { id: classId },
          include: { course: { include: { teacherProfile: true } } },
        });

        if (!liveClass) {
          return socket.emit('error', { message: 'Live class not found' });
        }

        const isTeacherOwner =
          user.role === 'TEACHER' && liveClass.course.teacherProfile.userId === user.userId;

        let isEnrolledStudent = false;
        if (user.role === 'STUDENT') {
          const enrollment = await prisma.enrollment.findUnique({
            where: {
              studentId_courseId: {
                studentId: user.userId,
                courseId: liveClass.courseId,
              },
            },
          });
          isEnrolledStudent = Boolean(enrollment && !enrollment.revokedAt);
        }

        // Validate user is teacher or enrolled student
        if (!isTeacherOwner && !isEnrolledStudent) {
          return socket.emit('error', { message: 'Unauthorized: You are not enrolled in this course.' });
        }

        socket.join(classId);

        // Record attendance if student
        let attendanceId: string | null = null;
        if (user.role === 'STUDENT') {
          const att = await prisma.liveAttendance.create({
            data: {
              liveClassId: classId,
              studentId: user.userId,
              joinedAt: new Date(),
            },
          });
          attendanceId = att.id;
          (socket as any).attendanceId = attendanceId;
        }

        // Broadcast participant joined
        liveNamespace.to(classId).emit('participant_joined', {
          userId: user.userId,
          fullName: user.fullName,
          role: user.role,
          timestamp: new Date().toISOString(),
        });

        // Store classId on socket for disconnect cleanup
        (socket as any).classId = classId;
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Chat messaging
    socket.on('send_message', ({ classId, message }: { classId: string; message: string }) => {
      if (!message || !message.trim()) return;

      const payload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.userId,
        senderName: user.fullName,
        role: user.role,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      liveNamespace.to(classId).emit('new_message', payload);
    });

    // Student Hand Raise
    socket.on('raise_hand', ({ classId }: { classId: string }) => {
      liveNamespace.to(classId).emit('hand_raised', {
        userId: user.userId,
        fullName: user.fullName,
        timestamp: new Date().toISOString(),
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const classId = (socket as any).classId;
      const attendanceId = (socket as any).attendanceId;

      if (attendanceId) {
        try {
          await prisma.liveAttendance.update({
            where: { id: attendanceId },
            data: { leftAt: new Date() },
          });
        } catch {
          // ignore
        }
      }

      if (classId) {
        liveNamespace.to(classId).emit('participant_left', {
          userId: user.userId,
          fullName: user.fullName,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
}
