import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { Mail, MessageSquare, Shield, Clock } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@cyberforge.academy';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge variant="cyan">SUPPORT & INQUIRIES</Badge>
          <h1 className="text-3xl font-extrabold text-white mt-3">
            Contact CyberForge Academy
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Have questions about student enrollments, instructor onboarding, or technical assistance?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="cyber-card p-5">
              <Mail className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Email Us Directly</h4>
              <p className="text-xs text-slate-400 mt-1">Direct support channel for platform inquiries.</p>
              <a href={`mailto:${supportEmail}`} className="text-xs font-mono text-cyan-400 mt-2 block hover:underline">
                {supportEmail}
              </a>
            </div>

            <div className="cyber-card p-5">
              <Clock className="w-5 h-5 text-teal-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Response Time</h4>
              <p className="text-xs text-slate-400 mt-1">Our support team reviews inquiries within 24 hours (Monday to Friday, IST).</p>
            </div>
          </div>

          <div className="md:col-span-2 cyber-card p-6">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Message Dispatched</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Thank you for reaching out. A CyberForge representative will respond to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="cyber-label">Your Full Name</label>
                  <input required type="text" placeholder="Rahul Sharma" className="cyber-input" />
                </div>

                <div>
                  <label className="cyber-label">Email Address</label>
                  <input required type="email" placeholder="rahul@example.com" className="cyber-input" />
                </div>

                <div>
                  <label className="cyber-label">Subject</label>
                  <input required type="text" placeholder="Question regarding instructor onboarding" className="cyber-input" />
                </div>

                <div>
                  <label className="cyber-label">Message</label>
                  <textarea required rows={4} placeholder="Describe your inquiry in detail..." className="cyber-input resize-none" />
                </div>

                <button type="submit" className="cyber-btn-primary w-full text-xs py-3 font-bold">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
