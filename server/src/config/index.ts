import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  TRUST_PROXY: z.string().transform((val) => val === '1' || val === 'true').default('0'),

  DATABASE_URL: z.string().default('postgresql://cyberforge:cyberforge_password@localhost:5432/cyberforge_academy?schema=public'),

  JWT_ACCESS_SECRET: z.string().min(32).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  JWT_REFRESH_SECRET: z.string().min(32).default('fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  FIELD_ENCRYPTION_KEY: z.string().default('dGhpcy1pcy1hLTMyLWJ5dGUtc2VjcmV0LWtleS12YWx1ZQ=='),

  RESEND_API_KEY: z.string().default('re_mock_key'),
  EMAIL_FROM: z.string().default('CyberForge Academy <no-reply@mail.cyberforge.academy>'),
  EMAIL_REPLY_TO: z.string().default('support@cyberforge.academy'),

  RAZORPAY_KEY_ID: z.string().default('rzp_test_cyberforge123'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_secret_cyberforge123'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_webhook_secret_cyberforge123'),
  RAZORPAY_TEACHER_PLAN_ID: z.string().default('plan_cyberforge_teacher_monthly'),
  TEACHER_MONTHLY_FEE_PAISE: z.string().transform(Number).default('40000'),
  PLATFORM_COMMISSION_PERCENT: z.string().transform(Number).default('0'),
  PAYOUT_DELAY_DAYS: z.string().transform(Number).default('7'),
  SUBSCRIPTION_GRACE_DAYS: z.string().transform(Number).default('3'),

  LIVEKIT_URL: z.string().default('wss://live.cyberforge.academy'),
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),

  R2_ACCOUNT_ID: z.string().default('mock_r2_account'),
  R2_ACCESS_KEY_ID: z.string().default('mock_r2_key'),
  R2_SECRET_ACCESS_KEY: z.string().default('mock_r2_secret'),
  R2_BUCKET_PUBLIC_ASSETS: z.string().default('cf-public'),
  R2_BUCKET_PRIVATE: z.string().default('cf-private'),
  R2_SIGNED_URL_TTL_SECONDS: z.string().transform(Number).default('900'),

  AUTH_RATE_LIMIT_WINDOW_MIN: z.string().transform(Number).default('15'),
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const config = parsed.data;
export type Config = typeof config;
