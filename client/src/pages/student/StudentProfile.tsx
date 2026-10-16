import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { User, CheckCircle, AlertCircle } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [interests, setInterests] = useState<string[]>(['Web Pentesting']);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.studentProfile) {
      setExperienceLevel(user.studentProfile.experienceLevel || 'BEGINNER');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');

    try {
      await api.put('/api/student/profile', {
        fullName,
        phone,
        experienceLevel,
        interests,
      });

      setMessage('Profile updated successfully!');
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update student profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Student Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details and skill levels.
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

      <div className="cyber-card p-6 border-teal-400/25">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="cyber-label">Full Name</label>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">Registered Email</label>
            <input
              disabled
              type="email"
              value={user?.email || ''}
              className="cyber-input bg-slate-900 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="cyber-label">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="cyber-input text-xs"
            />
          </div>

          <div>
            <label className="cyber-label">Current Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as any)}
              className="cyber-input text-xs"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="cyber-btn-primary bg-teal-400 hover:bg-teal-300 text-xs px-6 py-2.5 font-bold"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
