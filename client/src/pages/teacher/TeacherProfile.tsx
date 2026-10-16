import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { User, CreditCard, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [languages, setLanguages] = useState('English, Hindi');
  const [experienceYears, setExperienceYears] = useState(5);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bank update modal state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankUpdating, setBankUpdating] = useState(false);

  useEffect(() => {
    api
      .get<any>('/api/teacher/overview')
      .then((res) => {
        const prof = res.profile;
        if (prof) {
          setHeadline(prof.headline || '');
          setBio(prof.bio || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');

    try {
      await api.put('/api/teacher/profile', {
        headline,
        bio,
        city,
        country,
        languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
        experienceYears: Number(experienceYears),
        websiteUrl: websiteUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
      });

      setMessage('Instructor profile updated successfully!');
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber !== confirmAccountNumber) {
      setErrorMsg('Bank account numbers do not match.');
      return;
    }

    setBankUpdating(true);
    setErrorMsg('');

    try {
      await api.put('/api/teacher/bank-account', {
        accountHolderName,
        panNumber: panNumber.toUpperCase(),
        accountNumber,
        confirmAccountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
      });

      setMessage('Payout bank account updated and verified on Razorpay Route.');
      setBankModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update bank account.');
    } finally {
      setBankUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Instructor Profile & Payout Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Update your public profile, qualifications, and linked payout bank account.
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

      {/* Profile Form */}
      <div className="cyber-card p-6 border-cyan-400/25">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Public Profile Details</span>
        </h2>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="cyber-label">Professional Headline</label>
            <input
              required
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">Bio (Max 1000 chars)</label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="cyber-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="cyber-label">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="cyber-input"
              />
            </div>
            <div>
              <label className="cyber-label">Years of Experience</label>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="cyber-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="cyber-btn-primary text-xs px-6 py-2.5 font-bold"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Masked Bank Details Card */}
      <div className="cyber-card p-6 border-cyan-400/25">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Linked Payout Bank Account</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Settlements are securely sent here via Razorpay Route.
            </p>
          </div>

          <button
            onClick={() => setBankModalOpen(true)}
            className="cyber-btn-outline text-xs px-3.5 py-1.5"
          >
            Update Bank Details
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Account Number</span>
            <span className="text-white font-bold">XXXX4321 (Masked)</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">PAN Number</span>
            <span className="text-white font-bold">XXXXXX234F</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Security Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active Route
            </span>
          </div>
        </div>
      </div>

      {/* Update Bank Modal */}
      <Modal isOpen={bankModalOpen} onClose={() => setBankModalOpen(false)} title="Update Payout Bank Account">
        <form onSubmit={handleBankUpdate} className="space-y-4">
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-400/30 text-xs text-cyan-200">
            Replacing your bank account creates a new Razorpay Route linked account. Old records are deactivated.
          </div>

          <div>
            <label className="cyber-label">Account Holder Name (Matches PAN)</label>
            <input
              required
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Alex Vance"
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">PAN Number</label>
            <input
              required
              type="text"
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              className="cyber-input uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="cyber-label">Account Number</label>
              <input
                required
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="cyber-input font-mono"
              />
            </div>
            <div>
              <label className="cyber-label">Confirm Number</label>
              <input
                required
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value)}
                className="cyber-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="cyber-label">IFSC Code</label>
              <input
                required
                type="text"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="cyber-input uppercase font-mono"
              />
            </div>
            <div>
              <label className="cyber-label">Bank Name</label>
              <input
                required
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC Bank"
                className="cyber-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={() => setBankModalOpen(false)} className="cyber-btn-ghost text-xs">
              Cancel
            </button>
            <button type="submit" disabled={bankUpdating} className="cyber-btn-primary text-xs px-6 py-2.5 font-bold">
              {bankUpdating ? 'Updating Route...' : 'Save Bank Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
