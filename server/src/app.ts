import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

import { authRouter } from './modules/auth/auth.routes';
import { publicRouter } from './modules/public/public.routes';
import { teacherRouter } from './modules/teacher/teacher.routes';
import { studentRouter } from './modules/student/student.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';

export const app = express();
app.disable('x-powered-by');

if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// ── Security Headers ───────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com'],
        connectSrc: ["'self'", 'https://api.razorpay.com', config.LIVEKIT_URL],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS Configuration ────────────────────────────────────────────────────
const allowedOrigins = [
  config.APP_URL,
  config.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// ── Request Parsing ───────────────────────────────────────────────────────
// Keep raw body on request object for verifying Razorpay webhook signatures
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Authentication Middleware ─────────────────────────────────────────────
app.use(authenticateToken);

// ── Healthcheck ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CyberForge Academy API',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/student', studentRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/uploads', uploadsRouter);

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);
