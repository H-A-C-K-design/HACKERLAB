import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { Mail, CheckCircle, AlertCircle, RefreshCw, Shield, ArrowRight } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const registeredEmail = (location.state as any)?.email || user?.email || '';

  const [token, setToken] = useState(tokenFromUrl || '');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenFromUrl && !success && !verifying) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (tokenToUse?: string) => {
    const t = tokenToUse || token;
    if (!t) {
      setErrorMsg('Please enter or paste your verification token.');
      return;
    }

    setVerifying(true);
    setErrorMsg('');

    try {
      await api.post('/api/auth/verify-email', { token: t });
      setSuccess(true);
      const updatedUser = await refreshUser();

      setTimeout(() => {
        if (updatedUser?.role === 'TEACHER') {
          navigate('/teacher/onboarding');
        } else {
          navigate('/student/onboarding');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification link is invalid or has expired.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) {
      setErrorMsg('Please sign in or register to resend verification link.');
      return;
    }

    try {
      setResendMessage('');
      setErrorMsg('');
      await api.post('/api/auth/resend-verification', { email: registeredEmail });
      setResendMessage('A fresh verification link has been dispatched to your email.');
      setResendCooldown(60); // 60s cooldown per spec
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-cyan-400" />
          <span className="font-extrabold text-xl tracking-wider text-white">
            CYBER<span className="text-cyan-400">FORGE</span>
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-card p-8 text-center border-cyan-400/30">
          {success ? (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
              <p className="text-xs text-slate-300">
                Your email has been confirmed. Redirecting to your onboarding setup...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto">
                <Mail className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  We sent a confirmation email to{' '}
                  <strong className="text-cyan-300 font-mono">
                    {registeredEmail || 'your email address'}
                  </strong>
                  . Click the link in the email or paste your token below to access your dashboard.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {resendMessage && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                  {resendMessage}
                </div>
              )}

              <div className="space-y-3 text-left">
                <label className="cyber-label">Verification Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from email link..."
                  className="cyber-input font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={verifying || !token}
                  className="cyber-btn-primary w-full py-2.5 text-xs font-bold"
                >
                  {verifying ? 'Confirming Token...' : 'Verify Email Address'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
