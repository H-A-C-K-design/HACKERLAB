import { Router } from 'express';
import {
  updateProfile,
  createOrder,
  verifyOrder,
  getEnrollments,
  getCoursePlayer,
  updateLessonProgress,
  getLiveClasses,
  getLiveClassToken,
  requestRefund,
  getPayments,
} from './student.controller';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail';
import { paymentLimiter } from '../../middleware/rateLimit';

export const studentRouter = Router();

// Apply auth & student role check to ALL student routes
studentRouter.use(requireAuth, requireRole('STUDENT'));

// Profile
studentRouter.put('/profile', updateProfile);

// Orders & Payments
studentRouter.post('/orders', requireVerifiedEmail, paymentLimiter, createOrder);
studentRouter.post('/orders/verify', requireVerifiedEmail, verifyOrder);
studentRouter.get('/payments', requireVerifiedEmail, getPayments);
studentRouter.post('/refunds', requireVerifiedEmail, requestRefund);

// Learning & Enrollments
studentRouter.get('/enrollments', requireVerifiedEmail, getEnrollments);
studentRouter.get('/courses/:id/player', requireVerifiedEmail, getCoursePlayer);
studentRouter.post('/lessons/:id/progress', requireVerifiedEmail, updateLessonProgress);

// Live Classes
studentRouter.get('/live-classes', requireVerifiedEmail, getLiveClasses);
studentRouter.post('/live-classes/:id/token', requireVerifiedEmail, getLiveClassToken);
