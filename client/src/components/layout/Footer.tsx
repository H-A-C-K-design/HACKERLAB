import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Terminal, ArrowRight } from 'lucide-react';
import { GetStartedModal } from '../ui/GetStartedModal';

export const Footer: React.FC = () => {
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-cyan-400/15 bg-[#070B14] text-slate-400 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Col 1: Brand & Mission */}
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 p-[1px]">
                  <div className="w-full h-full bg-[#0A0F1C] rounded-[7px] flex items-center justify-center text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <span className="font-extrabold text-base tracking-wider text-white">
                  CYBER<span className="text-cyan-400">FORGE</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                The premier live ethical hacking and offensive-defensive cybersecurity academy. Connecting verified elite instructors with passionate defenders worldwide.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Defensive & Authorized Education Only</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/courses" className="hover:text-cyan-400 transition-colors">Course Catalog</Link></li>
                <li><Link to="/register/teacher" className="hover:text-cyan-400 transition-colors">Become an Instructor</Link></li>
                <li><Link to="/about" className="hover:text-cyan-400 transition-colors">Why CyberForge</Link></li>
                <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Col 3: Legal Pages */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal & Policies</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Use</Link></li>
                <li><Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-cyan-400 transition-colors">Refund Policy (7-Day)</Link></li>
                <li><Link to="/terms#acceptable-use" className="hover:text-cyan-400 transition-colors">Acceptable Use Policy</Link></li>
              </ul>
            </div>

            {/* Col 4: Call to action */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">Get Started Today</h4>
              <p className="text-xs text-slate-400">
                Start your cybersecurity journey today or apply as an instructor.
              </p>
              <button
                onClick={() => setGetStartedOpen(true)}
                className="cyber-btn-primary w-full text-xs py-2.5"
              >
                <span>Join CyberForge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} CyberForge Academy. All rights reserved.</p>
            <p className="text-center sm:text-right text-[11px] max-w-lg">
              Disclaimer: All cybersecurity methodologies, labs, and exercises taught on CyberForge Academy are strictly for authorized testing, defensive auditing, and lawful educational purposes.
            </p>
          </div>
        </div>
      </footer>

      <GetStartedModal isOpen={getStartedOpen} onClose={() => setGetStartedOpen(false)} />
    </>
  );
};
