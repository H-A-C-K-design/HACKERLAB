import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatIST } from '../../lib/formatters';
import { CreditCard, Download, RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';

export const StudentPayments: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPayments = () => {
    setLoading(true);
    api
      .get<{ orders: any[] }>('/api/student/payments')
      .then((res) => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenRefund = (order: any) => {
    setSelectedOrder(order);
    setRefundReason('');
    setErrorMsg('');
    setMessage('');
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmittingRefund(true);
    setErrorMsg('');

    try {
      await api.post('/api/student/refunds', {
        orderId: selectedOrder.id,
        reason: refundReason,
      });

      setMessage('Refund request submitted successfully and is pending operator review.');
      setRefundModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Refund request could not be processed.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Receipts & Orders</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your course purchase history, access payment identifiers, and submit eligible refund requests.
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

      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Transaction History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading purchase records...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            No purchase records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1524] text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.map((o) => {
                  const hasRefund = Boolean(o.refundRequest);
                  const isPaid = o.status === 'PAID';
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-sans text-white font-semibold">
                        {o.course?.title || 'Course'}
                      </td>
                      <td className="p-4 font-bold text-cyan-300">
                        {formatINR(o.amountInPaise, true)}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {o.razorpayPaymentId || o.razorpayOrderId}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            o.status === 'PAID'
                              ? 'success'
                              : o.status === 'REFUNDED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {o.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {hasRefund ? (
                          <span className="text-[11px] font-mono text-amber-400">
                            Refund: {o.refundRequest.status}
                          </span>
                        ) : isPaid && o.amountInPaise > 0 ? (
                          <button
                            onClick={() => handleOpenRefund(o)}
                            className="text-[11px] font-sans text-rose-400 hover:underline flex items-center gap-1"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span>Request Refund</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Request Modal */}
      <Modal isOpen={refundModalOpen} onClose={() => setRefundModalOpen(false)} title="Submit Refund Request">
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-400/20 text-xs text-slate-300 space-y-1">
            <p><strong>Course:</strong> {selectedOrder?.course?.title}</p>
            <p><strong>Amount:</strong> {selectedOrder && formatINR(selectedOrder.amountInPaise, true)}</p>
            <p className="text-cyan-300 text-[11px] pt-1">
              Policy check: Must be within 7 days of purchase, with less than 20% of recorded lessons watched, and zero live sessions attended.
            </p>
          </div>

          <div>
            <label className="cyber-label">Reason for Refund</label>
            <textarea
              required
              rows={4}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Explain why you are requesting a refund for this course..."
              className="cyber-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRefundModalOpen(false)}
              className="cyber-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRefund || !refundReason.trim()}
              className="cyber-btn-primary text-xs px-6 py-2.5 font-bold"
            >
              {submittingRefund ? 'Submitting Request...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
