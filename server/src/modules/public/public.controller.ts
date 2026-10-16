import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { CourseLevel } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export async function getPublicCourses(req: Request, res: Response) {
  const {
    category,
    level,
    search,
    minPrice,
    maxPrice,
    language,
    page = '1',
    limit = '12',
  } = req.query;

  const take = Math.min(Number(limit) || 12, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: any = {
    status: 'PUBLISHED',
  };

  if (category && typeof category === 'string' && category !== 'ALL') {
    where.category = { equals: category, mode: 'insensitive' };
  }

  if (level && typeof level === 'string' && level !== 'ALL') {
    where.level = level as CourseLevel;
  }

  if (language && typeof language === 'string' && language !== 'ALL') {
    where.language = { equals: language, mode: 'insensitive' };
  }

  if (search && typeof search === 'string') {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceInPaise = {};
    if (minPrice !== undefined) where.priceInPaise.gte = Number(minPrice) * 100;
    if (maxPrice !== undefined) where.priceInPaise.lte = Number(maxPrice) * 100;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        category: true,
        language: true,
        priceInPaise: true,
        thumbnailKey: true,
        createdAt: true,
        teacherProfile: {
          select: {
            id: true,
            status: true,
            headline: true,
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return res.json({
    courses,
    pagination: {
      total,
      page: Number(page) || 1,
      totalPages: Math.ceil(total / take),
      hasMore: skip + take < total,
    },
  });
}

export async function getPublicCourseBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      teacherProfile: {
        select: {
          id: true,
          status: true,
          headline: true,
          bio: true,
          city: true,
          country: true,
          languages: true,
          experienceYears: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          specializations: true,
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              type: true,
              durationSec: true,
              visibility: true,
            },
          },
        },
      },
      liveClasses: {
        where: {
          status: { in: ['SCHEDULED', 'LIVE'] },
          scheduledStart: { gte: new Date() },
        },
        orderBy: { scheduledStart: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          scheduledStart: true,
          durationMin: true,
          status: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course || (course.status !== 'PUBLISHED' && req.query.preview !== 'true')) {
    return res.status(404).json({ success: false, message: 'Course not found or is currently private.' });
  }

  return res.json({ course });
}

export async function getPublicTeacherById(req: Request, res: Response) {
  const id = req.params.id as string;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
      qualifications: {
        where: { verified: true },
        select: {
          id: true,
          title: true,
          organization: true,
          year: true,
        },
      },
      courses: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          title: true,
          level: true,
          priceInPaise: true,
          thumbnailKey: true,
          category: true,
        },
      },
    },
  });

  // Only approved teachers are publicly viewable as per Section 11
  if (!teacher || teacher.status !== 'APPROVED') {
    return res.status(404).json({ success: false, message: 'Teacher profile not found or not yet approved.' });
  }

  return res.json({ teacher });
}

export async function streamMedia(req: Request, res: Response) {
  const { key } = req.query;
  // Serve fallback demo video or audio if local test
  const demoPath = path.resolve(__dirname, '../../../../client/public/INTRODUCTION OF CYBER SECURITY.mp4');
  if (fs.existsSync(demoPath)) {
    return res.sendFile(demoPath);
  }
  return res.status(404).json({ message: 'Media not found' });
}
