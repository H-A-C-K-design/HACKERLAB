import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { hashPassword, verifyPassword, hashToken, generateSecureToken } from '../../utils/crypto';
import { setAuthCookies, clearAuthCookies } from '../../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/email.service';
import { logAuditAction } from '../../utils/audit';
import { config } from '../../config';

// ── Validation Schemas ────────────────────────────────────────────────────
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['TEACHER', 'STUDENT']),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms of Service to register' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ── Controllers ───────────────────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role as Role,
        emailVerified: false,
      },
    });

    if (data.role === 'TEACHER') {
      await tx.teacherProfile.create({
        data: {
          userId: newUser.id,
          status: 'DRAFT',
        },
      });
    } else {
      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
        },
      });
    }

    return newUser;
  });

  // Create verification token (24 hours)
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email, user.fullName, rawToken);

  await logAuditAction({
    actorUserId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    metadata: { role: user.role, email: user.email },
    ip: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    email: user.email,
    role: user.role,
  });
}

export async function verifyEmail(req: Request, res: Response) {
  const token = (req.body.token || req.query.token) as string;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Verification token is required.' });
  }

  const tokenHash = hashToken(token);
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Verification link is invalid or has expired. Please request a new one.',
    });
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    }),
  ]);

  const user = tokenRecord.user;

  // Issue tokens and log the user in immediately
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: true,
      fullName: user.fullName,
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = generateSecureToken(40);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || null,
    },
  });

  setAuthCookies(res, accessToken, rawRefreshToken);

  await logAuditAction({
    actorUserId: user.id,
    action: 'EMAIL_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: 'Email verified successfully!',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      emailVerified: true,
    },
  });
}

export async function resendVerificationEmail(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || user.emailVerified) {
    // Generic response to prevent enumeration
    return res.json({
      success: true,
      message: 'If an unverified account exists with that email, a verification link has been sent.',
    });
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, user.fullName, rawToken);

  return res.json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Account Lockout check (5 failed attempts within 15 min locks for 15 min)
  if (user && user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked due to repeated failed login attempts. Please try again later.',
    });
  }

  if (!user) {
    // Generic error message
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, data.password);

  if (!isPasswordValid) {
    const failedCount = user.failedLoginCount + 1;
    let lockedUntil: Date | null = null;

    if (failedCount >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failedCount,
        lockedUntil,
      },
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // Reset failed login counter on success
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = generateSecureToken(40);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || null,
    },
  });

  setAuthCookies(res, accessToken, rawRefreshToken);

  await logAuditAction({
    actorUserId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  clearAuthCookies(res);

  if (req.user) {
    await logAuditAction({
      actorUserId: req.user.id,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      ip: req.ip,
    });
  }

  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return the exact same response to prevent account enumeration
  const genericResponse = {
    success: true,
    message: 'If an account matches that email address, instructions to reset your password have been sent.',
  };

  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  });

  await sendPasswordResetEmail(user.email, user.fullName, rawToken);

  return res.json(genericResponse);
}

export async function resetPassword(req: Request, res: Response) {
  const data = resetPasswordSchema.parse(req.body);
  const tokenHash = hashToken(data.token);

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Password reset link is invalid or has expired.',
    });
  }

  const newHash = await hashPassword(data.password);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash: newHash, failedLoginCount: 0, lockedUntil: null },
    }),
    // Revoke all existing sessions for security
    prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logAuditAction({
    actorUserId: tokenRecord.userId,
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: tokenRecord.userId,
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: 'Your password has been reset successfully. Please log in with your new password.',
  });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return res.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      emailVerified: true,
      avatarUrl: true,
      teacherProfile: {
        select: {
          id: true,
          status: true,
          headline: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              graceUntil: true,
            },
          },
        },
      },
      studentProfile: {
        select: {
          id: true,
          experienceLevel: true,
        },
      },
    },
  });

  return res.json({ user });
}
