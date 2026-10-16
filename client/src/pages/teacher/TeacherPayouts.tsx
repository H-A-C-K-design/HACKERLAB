import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatINR, formatIST } from '../../lib/formatters';
import { CreditCard, CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';

export const TeacherPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ payouts: any[] }>('/api/teacher/payouts')
      .then((res) => setPayouts(res.payouts || []))
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bank Payouts & Settlements</h1>
        <p className="text-xs text-slate-400 mt-1">
          Settlement transfers automatically released to your linked bank account on a 7-day schedule via Razorpay Route.
        </p>
      </div>

      <div className="cyber-card p-5 border-cyan-400/20 bg-gradient-to-r from-[#111827] to-[#151E32]">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <strong className="text-white block font-semibold">Settlement Schedule: Weekly on Hold Delay (7 Days)</strong>
            <span className="text-slate-400">
              When a student purchases your course, funds are held in escrow for 7 days to honor the refund guarantee, and then settled automatically to your registered bank account.
            </span>
          </div>
        </div>
      </div>

      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Transfer History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading payout records...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            No payouts processed yet. Once course sales pass the 7-day delay period, payouts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1524] text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Transfer Reference</th>
                  <th className="p-4">Settled Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-[11px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-cyan-300">{p.razorpayTransferId}</td>
                    <td className="p-4 text-white font-bold">{formatINR(p.amountInPaise, true)}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          p.status === 'PROCESSED'
                            ? 'success'
                            : p.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-[11px] text-slate-400">
                      {p.processedAt ? formatIST(p.processedAt) : 'Pending Release'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
