import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { Lock, ShieldCheck } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Badge variant="cyan">DATA PRIVACY</Badge>
        <h1 className="text-3xl font-extrabold text-white mt-2 mb-8">
          Privacy & Security Policy
        </h1>

        <div className="cyber-card p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-lg bg-teal-950/40 border border-teal-400/30 flex items-start gap-3 text-teal-200">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-1">Zero Plaintext Financial Storage Guarantee</strong>
              CyberForge Academy never stores card numbers or full bank account numbers in our database. All linked payout routing is tokenized via Razorpay Route, and only masked values (e.g., "XXXX1234") are retained for user reference.
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide directly during registration (full name, email address, role selection) and teacher onboarding (qualifications, identity tokens, professional bio). Passwords are cryptographically salted and hashed using Argon2id.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Session and Authentication Cookies</h2>
            <p>
              We utilize httpOnly, Secure, SameSite=Lax cookies to maintain authenticated sessions with short-lived access tokens and rotating refresh tokens. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Video Playback & Dynamic Watermarking</h2>
            <p>
              To protect instructor intellectual property from unauthorized redistribution, course playback incorporates a dynamic visual watermark embedding the viewer's registered name and email address.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Student Anonymity Towards Instructors</h2>
            <p>
              Instructor course rosters show enrolled student names and completion percentages. Student email addresses remain private and hidden from instructors unless both parties actively participate in a live interactive room.
            </p>
          </section>

          <p className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Last updated: October 2026. Data controller: CyberForge Academy.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
