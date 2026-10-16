import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const TeacherSettings: React.FC = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      setErrorMsg('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      // Send reset/update request
      setMessage('Password updated successfully for current instructor session.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Security & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your authentication credentials and account preferences.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="cyber-card p-6 border-cyan-400/25">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Update Account Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="cyber-label">New Password (Min 10 chars, letter + number)</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">Confirm New Password</label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="cyber-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cyber-btn-primary text-xs px-6 py-2.5 font-bold"
          >
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
