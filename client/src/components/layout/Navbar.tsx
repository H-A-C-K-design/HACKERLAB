import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { GetStartedModal } from '../ui/GetStartedModal';
import { Shield, Menu, X, User, ChevronRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'About', path: '/about' },
    { label: 'For Teachers', path: '/register/teacher' },
    { label: 'Contact', path: '/contact' },
  ];

  const dashboardPath = user?.role === 'TEACHER' ? '/teacher' : '/student';

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 p-[1px] shadow-sm shadow-cyan-400/30">
              <div className="w-full h-full bg-[#0A0F1C] rounded-[7px] flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">
              CYBER<span className="text-cyan-400">FORGE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-400/10'
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/40'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to={dashboardPath}
                className="cyber-btn-outline text-xs px-3.5 py-1.5"
              >
                <User className="w-4 h-4" />
                <span>Dashboard ({user.role})</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setGetStartedOpen(true)}
                  className="cyber-btn-primary text-xs px-4 py-2"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0A0F1C]/95 px-4 pt-3 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="cyber-btn-outline w-full justify-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center text-sm font-medium text-slate-300 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGetStartedOpen(true);
                    }}
                    className="cyber-btn-primary w-full justify-center"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Required Get Started Modal */}
      <GetStartedModal isOpen={getStartedOpen} onClose={() => setGetStartedOpen(false)} />
    </>
  );
};
