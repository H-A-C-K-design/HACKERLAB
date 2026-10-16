import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRole: 'TEACHER' | 'STUDENT';
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm text-cyan-400 tracking-wider">VERIFYING PERMISSIONS...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to correct dashboard on role mismatch
  if (user.role !== allowedRole) {
    const targetDashboard = user.role === 'TEACHER' ? '/teacher' : '/student';
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};
