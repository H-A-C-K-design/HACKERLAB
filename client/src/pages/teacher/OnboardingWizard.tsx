import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { openRazorpayModal } from '../../lib/razorpay';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  Award,
  CreditCard,
  Crown,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Shield,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Step 1: Profile State ──────────────────────────────────────────────
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [languages, setLanguages] = useState('English, Hindi');
  const [experienceYears, setExperienceYears] = useState(5);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // ── Step 2: Qualifications State ───────────────────────────────────────
  const [specializations, setSpecializations] = useState<string[]>([
    'Web Pentesting',
    'Network Security',
  ]);
  const [qualifications, setQualifications] = useState<any[]>([
    { title: 'Certified Ethical Hacker (CEH)', organization: 'EC-Council', year: 2022, certificateKey: 'cert_ceh_demo.pdf' },
  ]);
  const [newQualTitle, setNewQualTitle] = useState('');
  const [newQualOrg, setNewQualOrg] = useState('');
  const [newQualYear, setNewQualYear] = useState(2023);

  // ── Step 3: Bank Account State ─────────────────────────────────────────
  const [accountHolderName, setAccountHolderName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankConfigured, setBankConfigured] = useState(false);

  // ── Step 4: Subscription State ─────────────────────────────────────────
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);

  const specOptions = [
    'Web Pentesting',
    'Network Security',
    'Red Teaming',
    'CTF',
    'Malware Analysis',
    'Cloud Security',
    'API Hacking',
    'Reverse Engineering',
  ];

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        specializations,
      });

      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQualification = async () => {
    if (!newQualTitle || !newQualOrg) {
      setErrorMsg('Please specify qualification title and issuing organization.');
      return;
    }

    try {
      setErrorMsg('');
      const res = await api.post<any>('/api/teacher/qualifications', {
        title: newQualTitle,
        organization: newQualOrg,
        year: Number(newQualYear),
        certificateKey: `cert_${Date.now()}.pdf`,
      });

      setQualifications([...qualifications, res.qualification]);
      setNewQualTitle('');
      setNewQualOrg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save qualification.');
    }
  };

  const handleRemoveQualification = async (index: number) => {
    const qual = qualifications[index];
    if (qual.id) {
      await api.delete(`/api/teacher/qualifications/${qual.id}`).catch(() => {});
    }
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const handleStep2Submit = () => {
    if (qualifications.length === 0) {
      setErrorMsg('At least one qualification or security certification is required.');
      return;
    }
    setErrorMsg('');
    setCurrentStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (accountNumber !== confirmAccountNumber) {
      setErrorMsg('Bank account numbers do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/teacher/bank-account', {
        accountHolderName,
        panNumber: panNumber.toUpperCase(),
        accountNumber,
        confirmAccountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        upiId: upiId || undefined,
      });

      setBankConfigured(true);
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not verify and link bank account.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Subscribe = async () => {
    setSubscribing(true);
    setErrorMsg('');

    try {
      const checkoutData = await api.post<any>('/api/teacher/subscription/checkout');

      await openRazorpayModal({
        key: checkoutData.key,
        subscription_id: checkoutData.subscriptionId,
        name: 'CyberForge Academy',
        description: 'Teacher Platform Subscription (Rs 400/month)',
        prefill: {
          name: user?.fullName,
          email: user?.email,
        },
        handler: async (res) => {
          setSubscriptionPaid(true);
          await refreshUser();
          setTimeout(() => navigate('/teacher'), 2000);
        },
      });
    } catch (err: any) {
      if (err.message !== 'Payment was cancelled by the user.') {
        setErrorMsg(err.message || 'Could not start subscription checkout.');
      }
    } finally {
      setSubscribing(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="cyan">INSTRUCTOR SETUP</Badge>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Teacher Onboarding Wizard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete the 4 steps below to start scheduling live classes and uploading cybersecurity courses.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: 'Profile', icon: User },
            { num: 2, label: 'Qualifications', icon: Award },
            { num: 3, label: 'Bank Account', icon: CreditCard },
            { num: 4, label: 'Subscription', icon: Crown },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-400/20'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#111827]/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Icon className="w-4 h-4" />}
                  <span className="text-xs font-bold font-mono">STEP {s.num}</span>
                </div>
                <span className="text-[11px] block truncate">{s.label}</span>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: Profile ────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="cyber-card p-8 border-cyan-400/25">
            <h2 className="text-xl font-bold text-white mb-2">Step 1: Instructor Profile</h2>
            <p className="text-xs text-slate-400 mb-6">
              This information will be displayed to students on your public instructor card and course pages.
            </p>

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="cyber-label">Professional Headline</label>
                <input
                  required
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Lead Penetration Tester & Cloud Security Architect"
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="cyber-label">Bio (Max 1000 characters)</label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detail your cybersecurity background, key audit engagements, and teaching focus..."
                  className="cyber-input resize-none"
                />
                <span className="text-[10px] text-slate-500 block text-right mt-1">
                  {bio.length}/1000 characters
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="cyber-label">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="cyber-input"
                  />
                </div>
                <div>
                  <label className="cyber-label">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="cyber-input"
                  />
                </div>
                <div>
                  <label className="cyber-label">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="cyber-input"
                  />
                </div>
              </div>

              <div>
                <label className="cyber-label">Languages (comma-separated)</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="English, Hindi"
                  className="cyber-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="cyber-label">LinkedIn URL (optional)</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="cyber-input text-xs"
                  />
                </div>
                <div>
                  <label className="cyber-label">GitHub URL (optional)</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="cyber-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="cyber-label">Core Specialization Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {specOptions.map((spec) => {
                    const isSelected = specializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialization(spec)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="cyber-btn-primary text-xs px-6 py-3"
                >
                  <span>Proceed to Step 2</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 2: Qualifications ─────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="cyber-card p-8 border-cyan-400/25">
            <h2 className="text-xl font-bold text-white mb-2">Step 2: Qualifications & Certifications</h2>
            <p className="text-xs text-slate-400 mb-6">
              Submit your cybersecurity certifications (CEH, OSCP, CISSP, AWS Security, etc.). At least one entry is required for operator vetting.
            </p>

            <div className="space-y-4 mb-6">
              {qualifications.map((q, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-[#0E1524] border border-cyan-400/15 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{q.title}</h4>
                    <p className="text-xs text-slate-400">{q.organization} • {q.year}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQualification(idx)}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new qualification form */}
            <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Add New Credential</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Offensive Security Certified Professional (OSCP)"
                  value={newQualTitle}
                  onChange={(e) => setNewQualTitle(e.target.value)}
                  className="cyber-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Issuing Org (e.g. OffSec)"
                  value={newQualOrg}
                  onChange={(e) => setNewQualOrg(e.target.value)}
                  className="cyber-input text-xs"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={newQualYear}
                  onChange={(e) => setNewQualYear(Number(e.target.value))}
                  className="cyber-input text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleAddQualification}
                className="cyber-btn-outline text-xs px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Credential</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="cyber-btn-ghost text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Submit}
                className="cyber-btn-primary text-xs px-6 py-3"
              >
                <span>Proceed to Step 3</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Bank Account ───────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="cyber-card p-8 border-cyan-400/25">
            <h2 className="text-xl font-bold text-white mb-2">Step 3: Bank Account for Payouts</h2>
            <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-400/30 text-xs text-cyan-200 mb-6">
              <strong>Notice:</strong> Payouts are transferred exclusively to this linked account via Razorpay Route. Make sure the Account Holder Name matches your PAN name. We never store raw bank account numbers in our database.
            </div>

            <form onSubmit={handleStep3Submit} className="space-y-4">
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
                  className="cyber-input font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="cyber-label">Bank Account Number</label>
                  <input
                    required
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="••••••••••••"
                    className="cyber-input font-mono"
                  />
                </div>
                <div>
                  <label className="cyber-label">Confirm Account Number</label>
                  <input
                    required
                    type="text"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter bank account number"
                    className="cyber-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="cyber-label">IFSC Code</label>
                  <input
                    required
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="cyber-input font-mono uppercase"
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

              <div>
                <label className="cyber-label">UPI ID (optional)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="vance@okhdfcbank"
                  className="cyber-input font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="cyber-btn-ghost text-xs"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="cyber-btn-primary text-xs px-6 py-3 font-bold"
                >
                  {loading ? 'Creating Linked Route Account...' : 'Save & Proceed to Subscription'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 4: Subscription ───────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="cyber-card p-8 border-cyan-400/25 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto mb-4">
              <Crown className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Step 4: Platform Subscription</h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
              CyberForge Academy charges a flat <strong>Rs 400 per month</strong> subscription to teach, host low-latency LiveKit rooms, and store recordings. You retain 100% of your course fees (minus gateway transfer charges).
            </p>

            {subscriptionPaid ? (
              <div className="p-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-3 mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold">Subscription Activated!</h3>
                <p className="text-xs text-slate-300">
                  Your instructor profile is now <strong>PENDING_APPROVAL</strong>. Once approved via CLI operator review, your live streaming and publishing permissions will activate. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto cyber-card p-6 border-cyan-400/30 mb-8 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-sm font-semibold text-white">Monthly Instructor Plan</span>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400">Rs 400 <span className="text-xs text-slate-400">/ mo</span></span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 text-left">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Unlimited LiveKit live classroom broadcasts</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Up to 4 GB recording uploads to Cloudflare R2</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Automatic weekly payouts via Razorpay Route</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Cancel anytime from your profile settings</li>
                </ul>

                <button
                  type="button"
                  onClick={handleStep4Subscribe}
                  disabled={subscribing}
                  className="cyber-btn-primary w-full py-3 text-xs font-bold shadow-lg shadow-cyan-400/20"
                >
                  {subscribing ? 'Initializing Checkout...' : 'Pay Rs 400 & Activate Subscription'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
