import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts & Guards
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { StudentLayout } from '../components/layout/StudentLayout';

// Public Pages
import { Home } from '../pages/public/Home';
import { Courses } from '../pages/public/Courses';
import { CourseDetail } from '../pages/public/CourseDetail';
import { TeacherDetail } from '../pages/public/TeacherDetail';
import { About } from '../pages/public/About';
import { Contact } from '../pages/public/Contact';
import { Terms } from '../pages/public/Terms';
import { Privacy } from '../pages/public/Privacy';
import { RefundPolicy } from '../pages/public/RefundPolicy';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { RegisterTeacher } from '../pages/auth/RegisterTeacher';
import { RegisterStudent } from '../pages/auth/RegisterStudent';
import { VerifyEmail } from '../pages/auth/VerifyEmail';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Teacher Pages
import { OnboardingWizard } from '../pages/teacher/OnboardingWizard';
import { TeacherOverview } from '../pages/teacher/TeacherOverview';
import { TeacherCourses } from '../pages/teacher/TeacherCourses';
import { TeacherLive } from '../pages/teacher/TeacherLive';
import { TeacherLiveRoom } from '../pages/teacher/TeacherLiveRoom';
import { TeacherRecordings } from '../pages/teacher/TeacherRecordings';
import { TeacherStudents } from '../pages/teacher/TeacherStudents';
import { TeacherEarnings } from '../pages/teacher/TeacherEarnings';
import { TeacherPayouts } from '../pages/teacher/TeacherPayouts';
import { TeacherSubscription } from '../pages/teacher/TeacherSubscription';
import { TeacherProfile } from '../pages/teacher/TeacherProfile';
import { TeacherSettings } from '../pages/teacher/TeacherSettings';

// Student Pages
import { StudentOnboarding } from '../pages/student/StudentOnboarding';
import { StudentHome } from '../pages/student/StudentHome';
import { StudentExplore } from '../pages/student/StudentExplore';
import { StudentCourses } from '../pages/student/StudentCourses';
import { StudentPlayer } from '../pages/student/StudentPlayer';
import { StudentLive } from '../pages/student/StudentLive';
import { StudentLiveRoom } from '../pages/student/StudentLiveRoom';
import { StudentPayments } from '../pages/student/StudentPayments';
import { StudentProfile } from '../pages/student/StudentProfile';
import { StudentSettings } from '../pages/student/StudentSettings';

export const router = createBrowserRouter([
  // ── Public Routes ────────────────────────────────────────────────────────
  { path: '/', element: <Home /> },
  { path: '/courses', element: <Courses /> },
  { path: '/courses/:slug', element: <CourseDetail /> },
  { path: '/teachers/:id', element: <TeacherDetail /> },
  { path: '/about', element: <About /> },
  { path: '/contact', element: <Contact /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/refund-policy', element: <RefundPolicy /> },

  // ── Auth Routes ──────────────────────────────────────────────────────────
  { path: '/login', element: <Login /> },
  { path: '/register/teacher', element: <RegisterTeacher /> },
  { path: '/register/student', element: <RegisterStudent /> },
  { path: '/verify-email', element: <VerifyEmail /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // ── Teacher Routes (Guarded) ─────────────────────────────────────────────
  {
    path: '/teacher/onboarding',
    element: (
      <RequireAuth>
        <RequireRole allowedRole="TEACHER">
          <OnboardingWizard />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: '/teacher',
    element: (
      <RequireAuth>
        <RequireRole allowedRole="TEACHER">
          <TeacherLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <TeacherOverview /> },
      { path: 'courses', element: <TeacherCourses /> },
      { path: 'live', element: <TeacherLive /> },
      { path: 'live/:id/room', element: <TeacherLiveRoom /> },
      { path: 'recordings', element: <TeacherRecordings /> },
      { path: 'students', element: <TeacherStudents /> },
      { path: 'earnings', element: <TeacherEarnings /> },
      { path: 'payouts', element: <TeacherPayouts /> },
      { path: 'subscription', element: <TeacherSubscription /> },
      { path: 'profile', element: <TeacherProfile /> },
      { path: 'settings', element: <TeacherSettings /> },
    ],
  },

  // ── Student Routes (Guarded) ─────────────────────────────────────────────
  {
    path: '/student/onboarding',
    element: (
      <RequireAuth>
        <RequireRole allowedRole="STUDENT">
          <StudentOnboarding />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: '/student',
    element: (
      <RequireAuth>
        <RequireRole allowedRole="STUDENT">
          <StudentLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <StudentHome /> },
      { path: 'explore', element: <StudentExplore /> },
      { path: 'courses', element: <StudentCourses /> },
      { path: 'courses/:id/learn', element: <StudentPlayer /> },
      { path: 'live', element: <StudentLive /> },
      { path: 'live/:id/room', element: <StudentLiveRoom /> },
      { path: 'payments', element: <StudentPayments /> },
      { path: 'profile', element: <StudentProfile /> },
      { path: 'settings', element: <StudentSettings /> },
    ],
  },

  // Catch all unknown routes
  { path: '*', element: <Navigate to="/" replace /> },
]);
