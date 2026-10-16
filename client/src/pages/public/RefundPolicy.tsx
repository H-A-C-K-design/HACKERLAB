import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Badge variant="cyan">SATISFACTION GUARANTEE</Badge>
        <h1 className="text-3xl font-extrabold text-white mt-2 mb-8">
          Student Course Refund Policy
        </h1>

        <div className="cyber-card p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            At CyberForge Academy, we want every student to be satisfied with the quality and technical depth of our ethical hacking curriculum. We provide a transparent 7-day refund window with clear, objective criteria.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-400/30">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Eligible for Refund</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• Request submitted within <strong>7 days</strong> of purchase.</li>
                <li>• Less than <strong>20%</strong> of course recordings watched.</li>
                <li>• <strong>No live sessions</strong> attended for that course.</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-400/30">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Ineligible for Refund</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• Request made after 7 days from purchase.</li>
                <li>• 20% or more course content already completed.</li>
                <li>• Any live interactive session was attended.</li>
              </ul>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">How to Submit a Refund Request</h2>
            <p>
              Enrolled students can navigate directly to the <strong>Payments</strong> tab in their Student Dashboard, locate the purchase, and click "Request Refund" providing a brief explanation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">Review & Settlement Process</h2>
            <p>
              Refund requests are audited by the platform operator. Upon approval, funds are reversed via Razorpay to the original payment method, the enrollment is revoked, and a corresponding adjustment is registered in the instructor ledger.
            </p>
          </section>

          <p className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            For assistance with refunds, please email support@cyberforge.academy.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
