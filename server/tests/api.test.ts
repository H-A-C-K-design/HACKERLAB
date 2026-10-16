import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('Integration Tests: Role-Based Access Control and Public API', () => {
  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/teacher/overview should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/teacher/overview');
    expect(res.status).toBe(401);
  });

  it('GET /api/student/enrollments should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/student/enrollments');
    expect(res.status).toBe(401);
  });

  it('Student calling teacher endpoints should receive 403 Forbidden', async () => {
    const studentToken = jwt.sign(
      {
        userId: 'student-test-uuid',
        email: 'student@example.com',
        role: 'STUDENT',
        emailVerified: true,
        fullName: 'Test Student',
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/teacher/overview')
      .set('Cookie', [`accessToken=${studentToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('Teacher calling student endpoints should receive 403 Forbidden', async () => {
    const teacherToken = jwt.sign(
      {
        userId: 'teacher-test-uuid',
        email: 'teacher@example.com',
        role: 'TEACHER',
        emailVerified: true,
        fullName: 'Test Teacher',
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/student/enrollments')
      .set('Cookie', [`accessToken=${teacherToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('Unverified user should receive 403 EMAIL_NOT_VERIFIED on protected dashboard actions', async () => {
    const unverifiedToken = jwt.sign(
      {
        userId: 'unverified-test-uuid',
        email: 'unverified@example.com',
        role: 'STUDENT',
        emailVerified: false,
        fullName: 'Unverified Student',
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/student/enrollments')
      .set('Cookie', [`accessToken=${unverifiedToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('POST /api/webhooks/razorpay without signature should return 400', async () => {
    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .send({ event: 'payment.captured' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid webhook signature');
  });
});
