import { Router } from 'express';
import { handleRazorpayWebhook, handleResendWebhook } from './webhooks.controller';

export const webhooksRouter = Router();

webhooksRouter.post('/razorpay', handleRazorpayWebhook);
webhooksRouter.post('/resend', handleResendWebhook);
