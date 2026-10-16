import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const authLimiter = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: config.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many order requests. Please try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailResendLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 1, // 1 per 60 seconds as required in Section 4
  message: {
    success: false,
    message: 'Please wait at least 60 seconds before requesting another verification email.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
