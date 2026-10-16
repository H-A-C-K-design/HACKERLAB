import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { createCourseOrder, verifyPaymentSignature } from '../../services/razorpay.service';
import { createSignedPlaybackUrl } from '../../services/storage.service';
import { createLiveKitToken } from '../../services/livekit.service';
import { sendPaymentReceiptEmail } from '../../services/email.service';
import { logAuditAction } from '../../utils/audit';
import { config } from '../../config';
import { CourseLevel } from '@prisma/client';

// ── Validation Schemas ────────────────────────────────────────────────────
const updateStudentProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  interests: z.array(z.string()).optional(),
});

const createOrderSchema = z.object({
  courseId: z.string().uuid(),
});

const verifyOrderSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

const progressSchema = z.object({
  watchedSec: z.number().int().min(0),
  completed: z.boolean().optional(),
});

const refundRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10, 'Please provide a descriptive reason for your refund request'),
});

// ── Controllers ───────────────────────────────────────────────────────────
export async function updateProfile(req: Request, res: Response) {
  const data = updateStudentProfileSchema.parse(req.body);
  const userId = req.user!.id;

  const updated = await prisma.$transaction(async (tx) => {
    if (data.fullName || data.avatarUrl || data.phone) {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: data.fullName || undefined,
          avatarUrl: data.avatarUrl || undefined,
          phone: data.phone || undefined,
        },
      });
    }

    return await tx.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        experienceLevel: (data.experienceLevel as CourseLevel) || 'BEGINNER',
        interests: data.interests || [],
      },
      update: {
        experienceLevel: (data.experienceLevel as CourseLevel) || undefined,
        interests: data.interests || undefined,
      },
    });
  });

  return res.json({ success: true, profile: updated });
}

export async function createOrder(req: Request, res: Response) {
  const { courseId } = createOrderSchema.parse(req.body);
  const studentId = req.user!.id;

  // Check if student already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  if (existingEnrollment && !existingEnrollment.revokedAt) {
    return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacherProfile: {
        include: {
          bankAccounts: { where: { isActive: true } },
        },
      },
    },
  });

  if (!course || course.status !== 'PUBLISHED') {
    return res.status(404).json({ success: false, message: 'Course is not available for purchase.' });
  }

  // Handle Free Course (price 0)
  if (course.priceInPaise === 0) {
    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      create: {
        studentId,
        courseId,
        source: 'FREE',
      },
      update: {
        revokedAt: null,
      },
    });

    await logAuditAction({
      actorUserId: studentId,
      action: 'COURSE_ENROLLED_FREE',
      entityType: 'Enrollment',
      entityId: enrollment.id,
      metadata: { courseId },
      ip: req.ip,
    });

    return res.json({
      success: true,
      free: true,
      message: 'Enrolled in free course successfully!',
      enrollment,
    });
  }

  // Paid course calculation
  const grossPaise = course.priceInPaise;
  const commissionPercent = config.PLATFORM_COMMISSION_PERCENT;
  const platformFeePaise = Math.round((grossPaise * commissionPercent) / 100);
  const teacherSharePaise = grossPaise - platformFeePaise;

  const teacherLinkedAccount = course.teacherProfile.bankAccounts[0]?.razorpayLinkedAccountId;

  const razorpayOrder = await createCourseOrder({
    amountInPaise: grossPaise,
    receipt: `rcpt_${crypto.randomUUID().slice(0, 12)}`,
    notes: {
      courseId,
      studentId,
      teacherProfileId: course.teacherProfileId,
    },
    teacherLinkedAccountId: teacherLinkedAccount,
    teacherSharePaise,
  });

  // Store Order record in database
  const order = await prisma.order.create({
    data: {
      studentId,
      courseId,
      razorpayOrderId: razorpayOrder.id,
      amountInPaise: grossPaise,
      currency: 'INR',
      status: 'CREATED',
    },
  });

  return res.json({
    success: true,
    free: false,
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: grossPaise,
    key: config.RAZORPAY_KEY_ID,
    courseTitle: course.title,
  });
}

export async function verifyOrder(req: Request, res: Response) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyOrderSchema.parse(req.body);

  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
    include: {
      course: {
        include: {
          teacherProfile: true,
        },
      },
      student: true,
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const commissionPercent = config.PLATFORM_COMMISSION_PERCENT;
  const platformFeePaise = Math.round((order.amountInPaise * commissionPercent) / 100);
  const teacherNetPaise = order.amountInPaise - platformFeePaise;

  // Use database transaction for idempotent enrollment and ledger creation
  const result = await prisma.$transaction(async (tx) => {
    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        razorpayPaymentId,
      },
    });

    // Idempotent Enrollment
    const enrollment = await tx.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: order.studentId,
          courseId: order.courseId,
        },
      },
      create: {
        studentId: order.studentId,
        courseId: order.courseId,
        source: 'PAID',
      },
      update: {
        revokedAt: null,
      },
    });

    // Write Ledger Entry if not already written
    const existingLedger = await tx.ledgerEntry.findFirst({
      where: { orderId: order.id, type: 'PAYMENT' },
    });

    let ledger = existingLedger;
    if (!existingLedger) {
      ledger = await tx.ledgerEntry.create({
        data: {
          orderId: order.id,
          teacherProfileId: order.course.teacherProfileId,
          grossInPaise: order.amountInPaise,
          platformFeeInPaise: platformFeePaise,
          teacherNetInPaise: teacherNetPaise,
          type: 'PAYMENT',
          status: 'SETTLED',
          razorpayPaymentId,
        },
      });
    }

    return { updatedOrder, enrollment, ledger };
  });

  // Send transactional payment receipt email
  await sendPaymentReceiptEmail(
    order.student.email,
    order.student.fullName,
    order.course.title,
    order.amountInPaise,
    razorpayPaymentId
  );

  await logAuditAction({
    actorUserId: order.studentId,
    action: 'COURSE_PURCHASE_VERIFIED',
    entityType: 'Order',
    entityId: order.id,
    metadata: {
      paymentId: razorpayPaymentId,
      amountPaise: order.amountInPaise,
    },
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: 'Payment verified and enrollment confirmed!',
    enrollmentId: result.enrollment.id,
  });
}

export async function getEnrollments(req: Request, res: Response) {
  const studentId = req.user!.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        include: {
          teacherProfile: {
            include: {
              user: { select: { fullName: true } },
            },
          },
          modules: {
            include: {
              lessons: { select: { id: true, durationSec: true } },
            },
          },
        },
      },
      progress: true,
    },
  });

  const formatted = enrollments.map((enr) => {
    const totalLessons = enr.course.modules.flatMap((m) => m.lessons).length;
    const completedLessons = enr.progress.filter((p) => p.completedAt).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      id: enr.id,
      courseId: enr.course.id,
      title: enr.course.title,
      slug: enr.course.slug,
      thumbnailKey: enr.course.thumbnailKey,
      instructor: enr.course.teacherProfile.user.fullName,
      level: enr.course.level,
      totalLessons,
      completedLessons,
      progressPercent,
      enrolledAt: enr.createdAt,
    };
  });

  return res.json({ enrollments: formatted });
}

export async function getCoursePlayer(req: Request, res: Response) {
  const id = req.params.id as string;
  const studentId = req.user!.id;

  // Strict rule: student must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: id } },
    include: { progress: true },
  });

  if (!enrollment || enrollment.revokedAt) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You must be actively enrolled in this course to watch lessons.',
    });
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacherProfile: {
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found.' });
  }

  // Generate short-lived signed URLs (15 min TTL) for lessons
  const modulesWithSignedUrls = await Promise.all(
    course.modules.map(async (mod) => {
      const lessonsWithUrls = await Promise.all(
        mod.lessons.map(async (lesson) => {
          let signedUrl = null;
          if (lesson.videoKey) {
            signedUrl = await createSignedPlaybackUrl(lesson.videoKey);
          }
          const progress = enrollment.progress.find((p) => p.lessonId === lesson.id);

          return {
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            type: lesson.type,
            durationSec: lesson.durationSec,
            signedUrl,
            completed: Boolean(progress?.completedAt),
            watchedSec: progress?.watchedSec || 0,
          };
        })
      );

      return {
        id: mod.id,
        title: mod.title,
        order: mod.order,
        lessons: lessonsWithUrls,
      };
    })
  );

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.teacherProfile.user.fullName,
      modules: modulesWithSignedUrls,
    },
    // Dynamic watermark payload for student anti-piracy protection
    watermark: {
      text: `${req.user!.fullName} (${req.user!.email})`,
      userId: req.user!.id,
    },
  });
}

export async function updateLessonProgress(req: Request, res: Response) {
  const id = req.params.id as string;
  const { watchedSec, completed } = progressSchema.parse(req.body);
  const studentId = req.user!.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { module: true },
  });

  if (!lesson) {
    return res.status(404).json({ success: false, message: 'Lesson not found.' });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId: lesson.module.courseId,
      },
    },
  });

  if (!enrollment || enrollment.revokedAt) {
    return res.status(403).json({ success: false, message: 'Not enrolled in this course.' });
  }

  const record = await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId: lesson.id,
      watchedSec,
      completedAt: completed ? new Date() : null,
    },
    update: {
      watchedSec,
      completedAt: completed ? new Date() : undefined,
    },
  });

  return res.json({ success: true, progress: record });
}

export async function getLiveClasses(req: Request, res: Response) {
  const studentId = req.user!.id;

  // Student can only see live classes for enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, revokedAt: null },
    select: { courseId: true },
  });

  const courseIds = enrollments.map((e) => e.courseId);

  const classes = await prisma.liveClass.findMany({
    where: {
      courseId: { in: courseIds },
      status: { in: ['SCHEDULED', 'LIVE'] },
    },
    orderBy: { scheduledStart: 'asc' },
    include: {
      course: {
        select: {
          title: true,
          teacherProfile: {
            select: { user: { select: { fullName: true } } },
          },
        },
      },
    },
  });

  return res.json({ liveClasses: classes });
}

export async function getLiveClassToken(req: Request, res: Response) {
  const id = req.params.id as string;
  const studentId = req.user!.id;

  const liveClass = await prisma.liveClass.findUnique({
    where: { id },
  });

  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found.' });
  }

  // Enrollment check
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId: liveClass.courseId,
      },
    },
  });

  if (!enrollment || enrollment.revokedAt) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You must be enrolled in this course to join the live session.',
    });
  }

  // Record Attendance join
  await prisma.liveAttendance.create({
    data: {
      liveClassId: liveClass.id,
      studentId,
      joinedAt: new Date(),
    },
  });

  // Generate subscriber token (TTL 2 hours)
  const token = await createLiveKitToken({
    roomName: liveClass.livekitRoomName,
    participantIdentity: `student_${studentId}`,
    participantName: req.user!.fullName,
    isTeacher: false,
  });

  return res.json({
    success: true,
    token,
    roomName: liveClass.livekitRoomName,
    livekitUrl: config.LIVEKIT_URL,
  });
}

export async function requestRefund(req: Request, res: Response) {
  const { orderId, reason } = refundRequestSchema.parse(req.body);
  const studentId = req.user!.id;

  const order = await prisma.order.findFirst({
    where: { id: orderId, studentId, status: 'PAID' },
    include: {
      course: {
        include: {
          modules: { include: { lessons: true } },
          liveClasses: true,
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Eligible paid order not found.' });
  }

  // Rule 1: Must be within 7 days of purchase
  const daysSincePurchase = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePurchase > 7) {
    return res.status(400).json({
      success: false,
      message: 'Refund requests must be submitted within 7 days of purchase.',
    });
  }

  // Rule 2: Less than 20% of recordings watched
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: order.courseId } },
    include: { progress: true },
  });

  const totalLessons = order.course.modules.flatMap((m) => m.lessons).length;
  const completedLessons = enrollment?.progress.filter((p) => p.completedAt).length || 0;
  const watchedRatio = totalLessons > 0 ? completedLessons / totalLessons : 0;

  if (watchedRatio >= 0.2) {
    return res.status(400).json({
      success: false,
      message: 'Refund policy violation: More than 20% of the course content has already been completed.',
    });
  }

  // Rule 3: No live session has been attended
  const liveClassIds = order.course.liveClasses.map((lc) => lc.id);
  const attendanceCount = await prisma.liveAttendance.count({
    where: {
      studentId,
      liveClassId: { in: liveClassIds },
    },
  });

  if (attendanceCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Refund policy violation: You have already attended one or more live interactive classes.',
    });
  }

  const refund = await prisma.refundRequest.create({
    data: {
      orderId: order.id,
      reason,
      status: 'PENDING',
    },
  });

  await logAuditAction({
    actorUserId: studentId,
    action: 'REFUND_REQUESTED',
    entityType: 'RefundRequest',
    entityId: refund.id,
    metadata: { orderId: order.id, reason },
    ip: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Your refund request has been received and will be reviewed by the platform operator.',
    refundId: refund.id,
  });
}

export async function getPayments(req: Request, res: Response) {
  const studentId = req.user!.id;

  const orders = await prisma.order.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { title: true } },
      refundRequest: true,
    },
  });

  return res.json({ orders });
}
