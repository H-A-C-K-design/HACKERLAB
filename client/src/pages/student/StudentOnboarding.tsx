import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { GraduationCap, ArrowRight, Shield, CheckCircle } from 'lucide-react';

export const StudentOnboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [experienceLevel, setExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [interests, setInterests] = useState<string[]>(['Web Pentesting', 'Network Security']);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const interestOptions = [
    'Web Pentesting',
    'Network Security',
    'Red Teaming',
    'CTF',
    'Malware Analysis',
    'Cloud Security',
    'API Security',
  ];

  const toggleInterest = (opt: string) => {
    if (interests.includes(opt)) {
      setInterests(interests.filter((i) => i !== opt));
    } else {
      setInterests([...interests, opt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put('/api/student/profile', {
        experienceLevel,
        interests,
        phone: phone || undefined,
      });

      await refreshUser();
      navigate('/student');
    } catch (err: any) {
      alert(err.message || 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full cyber-card p-8 border-teal-400/25">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-teal-950 border border-teal-400/40 flex items-center justify-center text-teal-400 mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <Badge variant="teal">STUDENT PREFERENCES</Badge>
          <h1 className="text-2xl font-bold text-white mt-2">Welcome, {user?.fullName}!</h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize your learning track so instructors can tailor course challenges to your level.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="cyber-label">Your Experience Level</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setExperienceLevel(lvl)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    experienceLevel === lvl
                      ? 'bg-teal-950 border-teal-400 text-teal-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="cyber-label">Topics of Interest</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {interestOptions.map((opt) => {
                const selected = interests.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleInterest(opt)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors ${
                      selected
                        ? 'bg-teal-950 border-teal-400 text-teal-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="cyber-label">Phone Number (optional, for SMS alerts)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="cyber-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="cyber-btn-primary bg-teal-400 hover:bg-teal-300 w-full py-3 text-xs font-bold mt-2"
          >
            {submitting ? 'Saving Track...' : 'Enter Student Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
