import { Router } from 'express';
import {
  getOverview,
  updateProfile,
  addQualification,
  deleteQualification,
  updateBankAccount,
  createSubscriptionCheckout,
  cancelSubscription,
  getCourses,
  createCourse,
  updateCourse,
  publishCourse,
  unpublishCourse,
  getLiveClasses,
  scheduleLiveClass,
  startLiveClass,
  endLiveClass,
  presignUpload,
  getEarnings,
  getPayouts,
  getStudents,
} from './teacher.controller';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail';

export const teacherRouter = Router();

// Apply auth & teacher role check to ALL teacher routes
teacherRouter.use(requireAuth, requireRole('TEACHER'));

// Step 1: Profile onboarding & updates
teacherRouter.get('/overview', requireVerifiedEmail, getOverview);
teacherRouter.put('/profile', updateProfile);

// Step 2: Qualifications
teacherRouter.post('/qualifications', addQualification);
teacherRouter.delete('/qualifications/:id', deleteQualification);

// Step 3: Bank Account (Razorpay Route)
teacherRouter.put('/bank-account', updateBankAccount);

// Step 4: Subscription
teacherRouter.post('/subscription/checkout', createSubscriptionCheckout);
teacherRouter.post('/subscription/cancel', requireVerifiedEmail, cancelSubscription);

// Courses management
teacherRouter.get('/courses', requireVerifiedEmail, getCourses);
teacherRouter.post('/courses', requireVerifiedEmail, createCourse);
teacherRouter.put('/courses/:id', requireVerifiedEmail, updateCourse);
teacherRouter.post('/courses/:id/publish', requireVerifiedEmail, publishCourse);
teacherRouter.post('/courses/:id/unpublish', requireVerifiedEmail, unpublishCourse);

// Live Classes
teacherRouter.get('/live-classes', requireVerifiedEmail, getLiveClasses);
teacherRouter.post('/live-classes', requireVerifiedEmail, scheduleLiveClass);
teacherRouter.post('/live-classes/:id/start', requireVerifiedEmail, startLiveClass);
teacherRouter.post('/live-classes/:id/end', requireVerifiedEmail, endLiveClass);

// Uploads (presigned URLs for R2)
teacherRouter.post('/uploads/presign', presignUpload);

// Finances & Students
teacherRouter.get('/earnings', requireVerifiedEmail, getEarnings);
teacherRouter.get('/payouts', requireVerifiedEmail, getPayouts);
teacherRouter.get('/students', requireVerifiedEmail, getStudents);
