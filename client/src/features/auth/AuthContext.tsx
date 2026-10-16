import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../../lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'TEACHER' | 'STUDENT';
  emailVerified: boolean;
  avatarUrl?: string | null;
  teacherProfile?: {
    id: string;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';
    headline?: string;
    subscription?: {
      status: string;
      currentPeriodEnd?: string;
      graceUntil?: string;
    };
  };
  studentProfile?: {
    id: string;
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const data = await api.get<{ user: User | null }>('/api/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User }>('/api/auth/login', { email, password });
    // After login, fetch fresh /me with profiles
    const fullUser = await refreshUser();
    return fullUser || res.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
