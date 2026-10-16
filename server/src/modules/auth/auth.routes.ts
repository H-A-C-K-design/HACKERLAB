import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.controller';
import { authLimiter, emailResendLimiter } from '../../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/resend-verification', emailResendLimiter, resendVerificationEmail);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', logout);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.get('/me', getMe);
