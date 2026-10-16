import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Shield, Lock, Mail, User, GraduationCap, AlertCircle } from 'lucide-react';

export const RegisterStudent: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 10) {
      setErrorMessage('Password must be at least 10 characters long.');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service and Ethical Use Agreement.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        fullName,
        email,
        password,
        confirmPassword,
        role: 'STUDENT', // Role derived from route
        termsAccepted,
      });

      navigate('/verify-email', { state: { email } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 p-[1px]">
            <div className="w-full h-full bg-[#0A0F1C] rounded-[7px] flex items-center justify-center text-teal-400">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-wider text-white">
            CYBER<span className="text-teal-400">FORGE</span>
          </span>
        </Link>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Student Registration
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Learn ethical hacking, master live capture-the-flag exercises, and build verifiable skills.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="cyber-card p-8 border-teal-400/25">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="cyber-label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="cyber-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="cyber-label">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="cyber-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="cyber-label">Password (Min 10 characters, 1 letter, 1 number)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="cyber-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="cyber-label">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="cyber-input pl-9"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded bg-[#0A0F1C] border-teal-400/30 text-teal-400 focus:ring-teal-400"
                />
                <span className="text-xs text-slate-300 leading-normal">
                  I accept the <Link to="/terms" target="_blank" className="text-teal-400 underline">Terms of Use</Link>, <Link to="/privacy" target="_blank" className="text-teal-400 underline">Privacy Policy</Link>, and agree to use all concepts learned exclusively for authorized educational defense.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn-primary bg-teal-400 hover:bg-teal-300 w-full py-3 text-xs font-bold mt-4"
            >
              {loading ? 'Creating Student Account...' : 'Register as Student'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-4 ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
