import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { hashToken, generateSecureToken } from '../utils/crypto';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string) {
  const isProd = config.NODE_ENV === 'production';
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  if (config.COOKIE_DOMAIN && config.COOKIE_DOMAIN !== 'localhost') {
    cookieOptions.domain = config.COOKIE_DOMAIN;
  }

  // Access token cookie (15m)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  if (refreshToken) {
    // Refresh token cookie (30d)
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}

export function clearAuthCookies(res: Response) {
  const isProd = config.NODE_ENV === 'production';
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  if (config.COOKIE_DOMAIN && config.COOKIE_DOMAIN !== 'localhost') {
    cookieOptions.domain = config.COOKIE_DOMAIN;
  }

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET) as any;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          emailVerified: decoded.emailVerified,
          fullName: decoded.fullName || '',
        };
        return next();
      } catch (err: any) {
        // Access token expired, attempt refresh token rotation below
      }
    }

    // Attempt refresh token flow
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      req.user = null;
      return next();
    }

    const hashed = hashToken(refreshToken);
    const storedSession = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });

    if (!storedSession || storedSession.revokedAt || storedSession.expiresAt < new Date()) {
      req.user = null;
      clearAuthCookies(res);
      return next();
    }

    // Token is valid: Rotate refresh token and issue new access token
    const newRawRefreshToken = generateSecureToken(40);
    const newHashed = hashToken(newRawRefreshToken);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedSession.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedSession.userId,
          tokenHash: newHashed,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userAgent: req.headers['user-agent'] || null,
          ip: req.ip || null,
        },
      }),
    ]);

    const user = storedSession.user;
    const newAccessToken = jwt.sign(
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

    setAuthCookies(res, newAccessToken, newRawRefreshToken);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
    };

    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }
  next();
}
