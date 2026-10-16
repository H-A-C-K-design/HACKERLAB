import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Radio,
  Video,
  Users,
  TrendingUp,
  CreditCard,
  Crown,
  UserCheck,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const teacherProfile = user?.teacherProfile;
  const isApproved = teacherProfile?.status === 'APPROVED';
  const isPending = teacherProfile?.status === 'PENDING_APPROVAL';
  const isSuspended = teacherProfile?.status === 'SUSPENDED';

  const navItems = [
    { label: 'Overview', path: '/teacher', icon: LayoutDashboard },
    { label: 'Courses', path: '/teacher/courses', icon: BookOpen },
    { label: 'Live Classes', path: '/teacher/live', icon: Radio },
    { label: 'Recordings', path: '/teacher/recordings', icon: Video },
    { label: 'Students', path: '/teacher/students', icon: Users },
    { label: 'Earnings', path: '/teacher/earnings', icon: TrendingUp },
    { label: 'Payouts', path: '/teacher/payouts', icon: CreditCard },
    { label: 'Subscription', path: '/teacher/subscription', icon: Crown },
    { label: 'Profile', path: '/teacher/profile', icon: UserCheck },
    { label: 'Settings', path: '/teacher/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col md:flex-row text-slate-200">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-cyan-400/15 bg-[#111827]">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-white text-sm">CyberForge Instructor</span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#111827] border-r border-cyan-400/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 p-[1px]">
              <div className="w-full h-full bg-[#0A0F1C] rounded-[7px] flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white block">
                CYBER<span className="text-cyan-400">FORGE</span>
              </span>
              <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider">
                Instructor Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_-4px_rgba(34,211,238,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer and Sign out */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {user?.fullName?.charAt(0) || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Status Notification Banners */}
        {isPending && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-6 py-3 flex items-center gap-3 text-amber-200 text-xs">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Profile Pending Approval:</strong> Your instructor credentials are being reviewed by our platform operators via CLI. You can prepare courses in draft mode, but publishing and going live will unlock once approved.
            </span>
          </div>
        )}

        {isSuspended && (
          <div className="bg-rose-950/90 border-b border-rose-500/50 px-6 py-3 flex items-center gap-3 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Instructor Account Suspended:</strong> Your published courses have been hidden and live classes cancelled due to subscription lapse or policy review. Contact support@cyberforge.academy to restore access.
            </span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
