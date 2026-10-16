import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Shield, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
    } finally {
      setLoading(false);
      setSubmitted(true); // Always true for account enumeration protection
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6">
          <Shield className="w-8 h-8 text-cyan-400" />
          <span className="font-extrabold text-xl tracking-wider text-white">
            CYBER<span className="text-cyan-400">FORGE</span>
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-card p-8 border-cyan-400/25">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Reset Instructions Dispatched</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                If an account matches <strong className="text-cyan-300">{email}</strong>, a secure password reset link has been sent. The link expires in 30 minutes.
              </p>
              <div className="pt-4 border-t border-slate-800">
                <Link to="/login" className="cyber-btn-outline w-full text-xs py-2.5 justify-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address and we'll send you a recovery link.
                </p>
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
                    placeholder="operator@domain.com"
                    className="cyber-input pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cyber-btn-primary w-full py-3 text-xs font-bold"
              >
                {loading ? 'Sending Recovery Link...' : 'Send Recovery Link'}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
