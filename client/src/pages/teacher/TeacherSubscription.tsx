import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { openRazorpayModal } from '../../lib/razorpay';
import { Badge } from '../../components/ui/Badge';
import { formatIST } from '../../lib/formatters';
import { Crown, CheckCircle, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

export const TeacherSubscription: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sub = user?.teacherProfile?.subscription;
  const status = sub?.status || 'inactive';
  const isActive = ['active', 'authenticated'].includes(status);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your monthly subscription? Your courses will be hidden after the grace period expires.')) {
      return;
    }

    setCancelling(true);
    setErrorMsg('');
    setMessage('');

    try {
      await api.post('/api/teacher/subscription/cancel');
      setMessage('Subscription cancelled successfully. A 3-day grace period is now active.');
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setSubscribing(true);
    setErrorMsg('');
    setMessage('');

    try {
      const checkout = await api.post<any>('/api/teacher/subscription/checkout');

      await openRazorpayModal({
        key: checkout.key,
        subscription_id: checkout.subscriptionId,
        name: 'CyberForge Academy',
        description: 'Teacher Platform Subscription (Rs 400/month)',
        prefill: {
          name: user?.fullName,
          email: user?.email,
        },
        handler: async () => {
          setMessage('Subscription reactivated successfully!');
          await refreshUser();
        },
      });
    } catch (err: any) {
      if (err.message !== 'Payment was cancelled by the user.') {
        setErrorMsg(err.message || 'Could not initiate subscription checkout.');
      }
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Subscription</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your monthly instructor membership (Rs 400/mo) to unlock course publishing and live streaming.
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
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Subscription Card */}
      <div className="cyber-card p-6 border-cyan-400/25">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Instructor Pro Plan</h3>
                <Badge
                  variant={isActive ? 'success' : status === 'created' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Rs 400.00 / Month</p>
            </div>
          </div>

          <div>
            {isActive ? (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="cyber-btn-outline text-xs px-4 py-2 text-rose-400 border-rose-400/40 hover:bg-rose-950/30"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                disabled={subscribing}
                className="cyber-btn-primary text-xs px-5 py-2 font-bold"
              >
                {subscribing ? 'Loading Checkout...' : 'Activate Subscription (Rs 400)'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block mb-1">Billing Cycle</span>
            <p className="font-semibold text-white">Monthly recurring (40,000 paise)</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Current Period End / Renewal</span>
            <p className="font-mono text-cyan-300">
              {sub?.currentPeriodEnd ? formatIST(sub.currentPeriodEnd) : 'Not Active'}
            </p>
          </div>
          {sub?.graceUntil && (
            <div className="sm:col-span-2 p-3 rounded bg-amber-950/50 border border-amber-500/40 text-amber-200">
              <strong>Grace Period Active:</strong> Your subscription grace window expires on{' '}
              <span className="font-mono">{formatIST(sub.graceUntil)}</span>. Please renew to keep courses published.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
