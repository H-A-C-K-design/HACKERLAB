import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
  getPublicTeacherById,
  streamMedia,
} from './public.controller';

export const publicRouter = Router();

publicRouter.get('/courses', getPublicCourses);
publicRouter.get('/courses/:slug', getPublicCourseBySlug);
publicRouter.get('/teachers/:id', getPublicTeacherById);
publicRouter.get('/media/stream', streamMedia);
