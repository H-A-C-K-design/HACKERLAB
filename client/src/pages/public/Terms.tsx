import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { Shield, AlertCircle } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Badge variant="cyan">LEGAL AGREEMENT</Badge>
        <h1 className="text-3xl font-extrabold text-white mt-2 mb-8">
          Terms of Use & Acceptable Use Policy
        </h1>

        <div className="cyber-card p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-lg bg-cyan-950/40 border border-cyan-400/30 flex items-start gap-3 text-cyan-200">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-1">Ethical Cybersecurity Education Clause</strong>
              By registering on CyberForge Academy as an instructor or student, you represent and warrant that any tools, techniques, or security concepts learned or published are strictly for defensive security, authorized auditing, and lawful educational sandboxes.
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Platform Scope & Purpose</h2>
            <p>
              CyberForge Academy operates as an online learning platform connecting independent cybersecurity instructors with students. Instructors publish educational videos and stream live interactive sessions. CyberForge Academy does not provide penetration testing services directly to third parties.
            </p>
          </section>

          <section id="acceptable-use" className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Acceptable Use Policy (AUP)</h2>
            <p>
              Users shall not use techniques learned on CyberForge Academy to access, disrupt, damage, or compromise any digital system, network, or server without explicit, written, and authorized consent from the system owner. Any breach results in immediate and permanent account termination, forfeiture of course access, and potential reporting to law enforcement authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Instructor Platform Subscription & Content</h2>
            <p>
              Instructors pay a monthly platform subscription of Rs 400. Instructors retain intellectual property rights to their original instructional content. By publishing courses, instructors grant CyberForge Academy a license to stream and store content on encrypted infrastructure (Cloudflare R2 and LiveKit) for enrolled students.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Student Enrollments and Access</h2>
            <p>
              Student enrollments are personal and non-transferable. Video content is dynamically watermarked with student identification to deter unauthorized distribution. Recording, ripping, or redistributing course content is strictly prohibited.
            </p>
          </section>

          <p className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Last updated: October 2026. For questions regarding these terms, contact support@cyberforge.academy.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
