import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { Shield, Lock, Terminal, Cpu, CheckCircle } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center">
          <Badge variant="cyan">MISSION & ETHOS</Badge>
          <h1 className="text-4xl font-extrabold text-white mt-3">
            Democratizing Practical Cybersecurity Education
          </h1>
          <p className="text-sm text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
            CyberForge Academy was created to bridge the critical gap between academic theoretical computer science and active offensive-defensive cybersecurity operations.
          </p>
        </div>

        <div className="cyber-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>Our Strict Ethical Stance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In modern information security, defenders must understand offensive tradecraft in order to build resilient architectures. However, all techniques taught on CyberForge Academy are strictly bounded to authorized testing environments, capture-the-flag (CTF) challenges, and defensive engineering.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every teacher declares adherence to our Acceptable Use Policy, and each curriculum is reviewed to ensure it serves lawful and defensive educational goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="cyber-card p-6">
            <h3 className="text-base font-bold text-white mb-2">Live WebRTC Classrooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time low-latency video streaming powered by LiveKit lets students shadow instructors as they configure firewalls, identify race conditions, and audit smart contracts.
            </p>
          </div>
          <div className="cyber-card p-6">
            <h3 className="text-base font-bold text-white mb-2">Fair Teacher Monetization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We empower instructors with a flat Rs 400 monthly subscription instead of heavy commission cuts. Payouts are settled automatically to verified bank accounts.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
