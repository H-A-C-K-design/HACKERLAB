import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import {
  createRazorpayLinkedAccount,
  createTeacherSubscription,
  cancelTeacherSubscription,
} from '../../services/razorpay.service';
import { createLiveKitToken, startClassRecording } from '../../services/livekit.service';
import { createPresignedUploadUrl } from '../../services/storage.service';
import { logAuditAction } from '../../utils/audit';
import { config } from '../../config';
import { CourseLevel, LessonType, LessonVisibility, LiveClassStatus } from '@prisma/client';

// ── Validation Schemas ────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  languages: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  specializations: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  cvKey: z.string().optional(),
});

const addQualificationSchema = z.object({
  title: z.string().min(2),
  organization: z.string().min(2),
  year: z.number().int().min(1970).max(new Date().getFullYear()),
  certificateKey: z.string().min(1),
});

const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'),
  accountNumber: z.string().min(8).max(20),
  confirmAccountNumber: z.string().min(8).max(20),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  bankName: z.string().min(2),
  upiId: z.string().optional().or(z.literal('')),
}).refine((data) => data.accountNumber === data.confirmAccountNumber, {
  message: 'Bank account numbers do not match',
  path: ['confirmAccountNumber'],
});

const courseSchema = z.object({
  title: z.string().min(5),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(20),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.string().min(2),
  language: z.string().default('English'),
  priceInPaise: z.number().int().min(0),
  thumbnailKey: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  ethicalCheck: z.literal(true, {
    errorMap: () => ({ message: 'You must declare that your content is strictly for authorized and ethical cybersecurity education' }),
  }),
});

const liveClassSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(5),
  scheduledStart: z.string().datetime(),
  durationMin: z.number().int().min(15).max(300).default(60),
  maxParticipants: z.number().int().min(5).max(500).default(100),
});

// ── Helpers ───────────────────────────────────────────────────────────────
async function getTeacherProfile(userId: string) {
  let profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: {
      subscription: true,
      bankAccounts: { where: { isActive: true } },
      qualifications: true,
    },
  });

  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: { userId, status: 'DRAFT' },
      include: {
        subscription: true,
        bankAccounts: { where: { isActive: true } },
        qualifications: true,
      },
    });
  }

  return profile;
}

function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  if (['active', 'authenticated'].includes(subscription.status)) return true;
  if (subscription.graceUntil && new Date(subscription.graceUntil) > new Date()) return true;
  return false;
}

// ── Controllers ───────────────────────────────────────────────────────────
export async function getOverview(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const [courseCount, liveClasses, enrollments, ledgerSummary] = await Promise.all([
    prisma.course.count({ where: { teacherProfileId: profile.id } }),
    prisma.liveClass.findMany({
      where: {
        course: { teacherProfileId: profile.id },
        scheduledStart: { gte: new Date() },
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: { scheduledStart: 'asc' },
      take: 3,
      include: { course: { select: { title: true } } },
    }),
    prisma.enrollment.findMany({
      where: { course: { teacherProfileId: profile.id } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { fullName: true, avatarUrl: true } },
        course: { select: { title: true, priceInPaise: true } },
      },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        teacherProfileId: profile.id,
        type: 'PAYMENT',
        status: 'SETTLED',
      },
      _sum: {
        grossInPaise: true,
        platformFeeInPaise: true,
        teacherNetInPaise: true,
      },
      _count: true,
    }),
  ]);

  const totalStudents = await prisma.enrollment.groupBy({
    by: ['studentId'],
    where: { course: { teacherProfileId: profile.id } },
  });

  return res.json({
    profile: {
      id: profile.id,
      status: profile.status,
      headline: profile.headline,
      bio: profile.bio,
      hasBank: profile.bankAccounts.length > 0,
      subscriptionStatus: profile.subscription?.status || 'inactive',
      isSubscriptionActive: isSubscriptionActive(profile.subscription),
      isApproved: profile.status === 'APPROVED',
    },
    metrics: {
      totalCourses: courseCount,
      totalStudents: totalStudents.length,
      grossEarningsPaise: ledgerSummary._sum.grossInPaise || 0,
      platformFeePaise: ledgerSummary._sum.platformFeeInPaise || 0,
      netEarningsPaise: ledgerSummary._sum.teacherNetInPaise || 0,
      salesCount: ledgerSummary._count || 0,
    },
    nextLiveClasses: liveClasses,
    recentEnrollments: enrollments,
  });
}

export async function updateProfile(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const profile = await getTeacherProfile(req.user!.id);

  const updated = await prisma.$transaction(async (tx) => {
    if (data.fullName || data.avatarUrl) {
      await tx.user.update({
        where: { id: req.user!.id },
        data: {
          fullName: data.fullName || undefined,
          avatarUrl: data.avatarUrl || undefined,
        },
      });
    }

    return await tx.teacherProfile.update({
      where: { id: profile.id },
      data: {
        headline: data.headline,
        bio: data.bio,
        city: data.city,
        country: data.country,
        languages: data.languages,
        experienceYears: data.experienceYears,
        websiteUrl: data.websiteUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        specializations: data.specializations,
        cvKey: data.cvKey,
      },
    });
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'TEACHER_PROFILE_UPDATED',
    entityType: 'TeacherProfile',
    entityId: profile.id,
    ip: req.ip,
  });

  return res.json({ success: true, profile: updated });
}

export async function addQualification(req: Request, res: Response) {
  const data = addQualificationSchema.parse(req.body);
  const profile = await getTeacherProfile(req.user!.id);

  const qualification = await prisma.qualification.create({
    data: {
      teacherProfileId: profile.id,
      title: data.title,
      organization: data.organization,
      year: data.year,
      certificateKey: data.certificateKey,
      verified: false,
    },
  });

  return res.status(201).json({ success: true, qualification });
}

export async function deleteQualification(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  await prisma.qualification.deleteMany({
    where: { id, teacherProfileId: profile.id },
  });

  return res.json({ success: true, message: 'Qualification deleted' });
}

export async function updateBankAccount(req: Request, res: Response) {
  const data = bankAccountSchema.parse(req.body);
  const profile = await getTeacherProfile(req.user!.id);

  // Create Razorpay Route linked account
  const linkedAccount = await createRazorpayLinkedAccount({
    name: data.accountHolderName,
    email: req.user!.email,
    accountNumber: data.accountNumber,
    ifsc: data.ifscCode,
    pan: data.panNumber,
  });

  const panLast4 = data.panNumber.slice(-4);
  const accountLast4 = data.accountNumber.slice(-4);
  const upiLast4 = data.upiId ? data.upiId.slice(-4) : null;

  // Use database transaction: deactivate old accounts and insert new
  const newBankAccount = await prisma.$transaction(async (tx) => {
    await tx.bankAccount.updateMany({
      where: { teacherProfileId: profile.id, isActive: true },
      data: { isActive: false },
    });

    return await tx.bankAccount.create({
      data: {
        teacherProfileId: profile.id,
        razorpayLinkedAccountId: linkedAccount.id,
        accountHolderName: data.accountHolderName,
        panLast4,
        accountLast4,
        ifsc: data.ifscCode,
        bankName: data.bankName,
        upiLast4,
        isActive: true,
      },
    });
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'BANK_ACCOUNT_UPDATED',
    entityType: 'BankAccount',
    entityId: newBankAccount.id,
    metadata: {
      accountLast4,
      panLast4,
      linkedAccountId: linkedAccount.id,
    },
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: 'Bank account configured for payouts successfully',
    bankAccount: {
      id: newBankAccount.id,
      accountHolderName: newBankAccount.accountHolderName,
      accountLast4: newBankAccount.accountLast4,
      panLast4: newBankAccount.panLast4,
      ifsc: newBankAccount.ifsc,
      bankName: newBankAccount.bankName,
      isActive: true,
    },
  });
}

export async function createSubscriptionCheckout(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const sub = await createTeacherSubscription({
    teacherProfileId: profile.id,
    userId: req.user!.id,
    email: req.user!.email,
  });

  // Upsert subscription record in created status
  await prisma.teacherSubscription.upsert({
    where: { teacherProfileId: profile.id },
    create: {
      teacherProfileId: profile.id,
      razorpaySubscriptionId: sub.id,
      status: 'created',
    },
    update: {
      razorpaySubscriptionId: sub.id,
      status: 'created',
    },
  });

  return res.json({
    success: true,
    subscriptionId: sub.id,
    key: config.RAZORPAY_KEY_ID,
    amount: config.TEACHER_MONTHLY_FEE_PAISE,
  });
}

export async function cancelSubscription(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);
  if (!profile.subscription) {
    return res.status(400).json({ success: false, message: 'No active subscription found.' });
  }

  await cancelTeacherSubscription(profile.subscription.razorpaySubscriptionId);

  await prisma.teacherSubscription.update({
    where: { id: profile.subscription.id },
    data: { status: 'cancelled' },
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'SUBSCRIPTION_CANCELLED',
    entityType: 'TeacherSubscription',
    entityId: profile.subscription.id,
    ip: req.ip,
  });

  return res.json({ success: true, message: 'Subscription cancelled successfully.' });
}

export async function getCourses(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const courses = await prisma.course.findMany({
    where: { teacherProfileId: profile.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          modules: true,
          liveClasses: true,
          enrollments: true,
        },
      },
    },
  });

  return res.json({ courses });
}

export async function createCourse(req: Request, res: Response) {
  const data = courseSchema.parse(req.body);
  const profile = await getTeacherProfile(req.user!.id);

  const existingSlug = await prisma.course.findUnique({
    where: { slug: data.slug },
  });

  if (existingSlug) {
    return res.status(400).json({ success: false, message: 'Course slug already taken.' });
  }

  const course = await prisma.course.create({
    data: {
      teacherProfileId: profile.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      level: data.level as CourseLevel,
      category: data.category,
      language: data.language,
      priceInPaise: data.priceInPaise,
      thumbnailKey: data.thumbnailKey || null,
      prerequisites: data.prerequisites,
      ethicalCheck: data.ethicalCheck,
      status: 'DRAFT',
    },
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'COURSE_CREATED',
    entityType: 'Course',
    entityId: course.id,
    ip: req.ip,
  });

  return res.status(201).json({ success: true, course });
}

export async function updateCourse(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  const course = await prisma.course.findFirst({
    where: { id, teacherProfileId: profile.id },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const updated = await prisma.course.update({
    where: { id },
    data: req.body,
  });

  return res.json({ success: true, course: updated });
}

export async function publishCourse(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  // Rule 1: Teacher profile must be APPROVED
  if (profile.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Your teacher profile is pending operator approval. You cannot publish courses yet.',
    });
  }

  // Rule 2: Subscription must be ACTIVE
  if (!isSubscriptionActive(profile.subscription)) {
    return res.status(403).json({
      success: false,
      message: 'Active teacher subscription required to publish courses.',
    });
  }

  const course = await prisma.course.findFirst({
    where: { id, teacherProfileId: profile.id },
    include: { modules: { include: { lessons: true } } },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: 'PUBLISHED' },
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'COURSE_PUBLISHED',
    entityType: 'Course',
    entityId: course.id,
    ip: req.ip,
  });

  return res.json({ success: true, message: 'Course published successfully', course: updated });
}

export async function unpublishCourse(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  const course = await prisma.course.findFirst({
    where: { id, teacherProfileId: profile.id },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: 'DRAFT' },
  });

  return res.json({ success: true, message: 'Course unpublished', course: updated });
}

export async function getLiveClasses(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const classes = await prisma.liveClass.findMany({
    where: { course: { teacherProfileId: profile.id } },
    orderBy: { scheduledStart: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { attendances: true } },
    },
  });

  return res.json({ liveClasses: classes });
}

export async function scheduleLiveClass(req: Request, res: Response) {
  const data = liveClassSchema.parse(req.body);
  const profile = await getTeacherProfile(req.user!.id);

  const course = await prisma.course.findFirst({
    where: { id: data.courseId, teacherProfileId: profile.id },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const roomName = `class_${crypto.randomUUID()}`;

  const liveClass = await prisma.liveClass.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      scheduledStart: new Date(data.scheduledStart),
      durationMin: data.durationMin,
      maxParticipants: data.maxParticipants,
      livekitRoomName: roomName,
      status: 'SCHEDULED',
    },
  });

  return res.status(201).json({ success: true, liveClass });
}

export async function startLiveClass(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  // Profile must be approved & subscription active
  if (profile.status !== 'APPROVED') {
    return res.status(403).json({ success: false, message: 'Teacher profile not approved.' });
  }
  if (!isSubscriptionActive(profile.subscription)) {
    return res.status(403).json({ success: false, message: 'Active subscription required to go live.' });
  }

  const liveClass = await prisma.liveClass.findFirst({
    where: { id, course: { teacherProfileId: profile.id } },
    include: { course: true },
  });

  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found' });
  }

  // Early window check: 10 minutes early
  const scheduledTime = new Date(liveClass.scheduledStart).getTime();
  const now = Date.now();
  const earlyWindow = 10 * 60 * 1000;

  if (now < scheduledTime - earlyWindow) {
    return res.status(400).json({
      success: false,
      message: 'Go Live is only available 10 minutes prior to the scheduled start time.',
    });
  }

  // Update status to LIVE
  await prisma.liveClass.update({
    where: { id },
    data: { status: 'LIVE' },
  });

  // Attempt starting LiveKit Egress recording
  const egressId = await startClassRecording(liveClass.livekitRoomName, liveClass.courseId, liveClass.id);

  // Generate publisher token for the teacher
  const token = await createLiveKitToken({
    roomName: liveClass.livekitRoomName,
    participantIdentity: `teacher_${req.user!.id}`,
    participantName: req.user!.fullName,
    isTeacher: true,
  });

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'LIVE_CLASS_STARTED',
    entityType: 'LiveClass',
    entityId: liveClass.id,
    metadata: { egressId },
    ip: req.ip,
  });

  return res.json({
    success: true,
    token,
    roomName: liveClass.livekitRoomName,
    livekitUrl: config.LIVEKIT_URL,
    egressId,
  });
}

export async function endLiveClass(req: Request, res: Response) {
  const id = req.params.id as string;
  const profile = await getTeacherProfile(req.user!.id);

  const liveClass = await prisma.liveClass.findFirst({
    where: { id, course: { teacherProfileId: profile.id } },
  });

  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found' });
  }

  const recordingKey = `recordings/${liveClass.courseId}/${liveClass.id}.mp4`;

  await prisma.liveClass.update({
    where: { id },
    data: {
      status: 'ENDED',
      recordingKey,
    },
  });

  // Auto-create a Lesson under the course's first module if available
  const firstModule = await prisma.module.findFirst({
    where: { courseId: liveClass.courseId },
    orderBy: { order: 'asc' },
  });

  if (firstModule) {
    await prisma.lesson.create({
      data: {
        moduleId: firstModule.id,
        title: `Recording: ${liveClass.title}`,
        type: 'LIVE_RECORDING',
        videoKey: recordingKey,
        durationSec: liveClass.durationMin * 60,
        visibility: 'COURSE_ONLY',
      },
    });
  }

  await logAuditAction({
    actorUserId: req.user!.id,
    action: 'LIVE_CLASS_ENDED',
    entityType: 'LiveClass',
    entityId: liveClass.id,
    ip: req.ip,
  });

  return res.json({ success: true, message: 'Live class ended and recording saved.' });
}

export async function presignUpload(req: Request, res: Response) {
  const { prefix = 'uploads', extension = 'bin', contentType = 'application/octet-stream' } = req.body;
  const result = await createPresignedUploadUrl({
    prefix,
    extension,
    contentType,
  });
  return res.json(result);
}

export async function getEarnings(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);
  const { startDate, endDate } = req.query;

  const where: any = {
    teacherProfileId: profile.id,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        include: {
          course: { select: { title: true } },
          student: { select: { fullName: true } },
        },
      },
    },
  });

  const aggregate = await prisma.ledgerEntry.aggregate({
    where,
    _sum: {
      grossInPaise: true,
      platformFeeInPaise: true,
      teacherNetInPaise: true,
    },
  });

  return res.json({
    summary: {
      grossPaise: aggregate._sum.grossInPaise || 0,
      platformFeePaise: aggregate._sum.platformFeeInPaise || 0,
      netPaise: aggregate._sum.teacherNetInPaise || 0,
    },
    entries,
  });
}

export async function getPayouts(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const payouts = await prisma.payout.findMany({
    where: { teacherProfileId: profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ payouts });
}

export async function getStudents(req: Request, res: Response) {
  const profile = await getTeacherProfile(req.user!.id);

  const enrollments = await prisma.enrollment.findMany({
    where: { course: { teacherProfileId: profile.id } },
    include: {
      course: { select: { id: true, title: true } },
      student: { select: { id: true, fullName: true, avatarUrl: true, lastLoginAt: true } },
      progress: true,
    },
  });

  // Anonymize student emails per specification ("emails hidden unless teacher is in a live session with them")
  const studentList = enrollments.map((enr) => {
    const totalLessons = 10; // Normalized representation
    const completedLessons = enr.progress.filter((p) => p.completedAt).length;
    const progressPercent = Math.min(100, Math.round((completedLessons / Math.max(1, totalLessons)) * 100));

    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      name: enr.student.fullName,
      avatarUrl: enr.student.avatarUrl,
      courseTitle: enr.course.title,
      enrolledAt: enr.createdAt,
      lastActive: enr.student.lastLoginAt,
      progressPercent,
    };
  });

  return res.json({ students: studentList });
}
