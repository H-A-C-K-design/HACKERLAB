import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/ui/GetStartedModal';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatINR, formatIST } from '../../lib/formatters';
import {
  Shield,
  Terminal,
  Radio,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Cpu,
  Lock,
  Flame,
  Users,
  ChevronDown,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    api
      .get<{ courses: any[] }>('/api/public/courses?limit=4')
      .then((data) => {
        setFeaturedCourses(data.courses || []);
      })
      .catch(() => {
        // Fallback demo courses if API still spinning up
        setFeaturedCourses([
          {
            id: 'demo-1',
            slug: 'hands-on-web-penetration-testing',
            title: 'Hands-on Web Application Penetration Testing',
            description: 'Master OWASP Top 10 vulnerabilities, SQL injection, XSS, SSRF, and modern API security in safe ethical sandboxes.',
            level: 'INTERMEDIATE',
            category: 'Web Pentesting',
            priceInPaise: 299900,
            teacherProfile: { user: { fullName: 'Alex Vance, CISSP' } },
            _count: { enrollments: 142, modules: 4 },
          },
          {
            id: 'demo-2',
            slug: 'fundamentals-of-ethical-hacking-and-defense',
            title: 'Fundamentals of Ethical Hacking & Defensive Security',
            description: 'Complete beginner-friendly bootcamp covering Kali Linux tools, network reconnaissance, and security defense.',
            level: 'BEGINNER',
            category: 'Network Security',
            priceInPaise: 0,
            teacherProfile: { user: { fullName: 'Sarah Lin' } },
            _count: { enrollments: 320, modules: 3 },
          },
        ]);
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  const faqs = [
    {
      q: 'Is learning ethical hacking on CyberForge legal?',
      a: 'Yes, 100%. All labs, demonstrations, and courses on CyberForge Academy are strictly bounded to authorized sandboxes and defensive security practices. Our Acceptable Use Policy strictly forbids any unauthorized penetration testing.',
    },
    {
      q: 'How does live class streaming work?',
      a: 'Instructors broadcast low-latency WebRTC streams powered by LiveKit directly in their browser. Enrolled students join the live room, engage in interactive chat, and raise hands for real-time Q&A. Every live session is automatically recorded and archived.',
    },
    {
      q: 'How do teacher payouts and platform commissions work?',
      a: 'Teachers pay a transparent flat subscription of Rs 400 per month. Student payments are processed securely via Razorpay and transferred directly to the instructor’s linked bank account after the scheduled 7-day holding window.',
    },
    {
      q: 'What is the course refund policy?',
      a: 'Students may request a refund within 7 days of purchase, provided that less than 20% of the recorded lessons have been watched and no live interactive session has been attended.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 overflow-hidden border-b border-cyan-400/10">
        {/* Subtle background cybersecurity grid and glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,211,238,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 text-xs font-mono mb-8 shadow-sm shadow-cyan-400/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NEXT-GEN CYBERSECURITY & ETHICAL HACKING ACADEMY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            Forge Your Career in <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
              Ethical Hacking & Defense
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect directly with verified security researchers and industry red-teamers. Join live interactive classes, solve real-world sandboxes, and build verifiable skills.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setGetStartedOpen(true)}
              className="cyber-btn-primary w-full sm:w-auto text-sm px-8 py-3.5"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/courses"
              className="cyber-btn-outline w-full sm:w-auto text-sm px-8 py-3.5"
            >
              <Terminal className="w-4 h-4" />
              <span>Explore Courses</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 pt-10 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Authorized & Ethical</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400">&lt; 150ms</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Live WebRTC Classrooms</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">Rs 400</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Flat Instructor Plan</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400">Verified</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Manual CLI Approval</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Why CyberForge ────────────────────────────────────────────── */}
      <section className="py-20 border-b border-cyan-400/10 bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="cyan">WHY CYBERFORGE</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Built Specifically for Real-World Security Training
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Traditional courses rely on passive slides. CyberForge combines active live stream labs with permanent recording access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="cyber-card p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-5">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Interactive Classrooms</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Zero-lag WebRTC rooms powered by LiveKit. Watch instructors exploit vulnerabilities in real-time, ask questions via live chat, and raise hands for direct voice interaction.
              </p>
            </div>

            <div className="cyber-card p-6">
              <div className="w-12 h-12 rounded-lg bg-teal-950 border border-teal-400/30 flex items-center justify-center text-teal-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Vetted & Approved Instructors</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Every teacher must submit professional credentials, certifications (OSCP, CISSP, CEH), and pass an administrative vetting process via our secure CLI operations before publishing.
              </p>
            </div>

            <div className="cyber-card p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Anti-Piracy Protected Playback</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Lesson videos are securely stored in Cloudflare R2 and served exclusively via short-lived signed URLs with dynamic enrolled student watermarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Featured Courses ─────────────────────────────────────────── */}
      <section className="py-20 border-b border-cyan-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="teal">FEATURED CURRICULUM</Badge>
              <h2 className="text-3xl font-bold text-white mt-2">
                Popular Cybersecurity Bootcamps
              </h2>
            </div>
            <Link to="/courses" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5">
              <span>View All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <div key={course.id} className="cyber-card flex flex-col justify-between overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={course.level === 'BEGINNER' ? 'teal' : course.level === 'INTERMEDIATE' ? 'cyan' : 'purple'} size="sm">
                      {course.level}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">{course.category}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white hover:text-cyan-400 transition-colors line-clamp-2">
                    <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">Instructor: <strong className="text-slate-200">{course.teacherProfile?.user?.fullName || 'CyberForge Mentor'}</strong></span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#0E1524] border-t border-cyan-400/10 flex items-center justify-between">
                  <span className="text-base font-extrabold font-mono text-cyan-400">
                    {formatINR(course.priceInPaise, true)}
                  </span>
                  <Link
                    to={`/courses/${course.slug}`}
                    className="cyber-btn-outline text-xs px-3.5 py-1.5"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Live Schedule Preview ─────────────────────────────────────── */}
      <section className="py-20 border-b border-cyan-400/10 bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cyber-card p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-[#111827] via-[#151E32] to-[#111827]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                <span>LIVE LAB SCHEDULE PREVIEW</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Interactive Weekend CTFs & Red Teaming Masterclasses
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                Live interactive workshops run throughout the week in IST timezone. Watch instructors break down real-world vulnerabilities and test student submissions on the fly.
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={() => setGetStartedOpen(true)}
                  className="cyber-btn-primary text-xs px-5 py-2.5"
                >
                  Join Live Classes
                </button>
                <Link to="/courses" className="text-xs font-medium text-slate-300 hover:text-cyan-400">
                  Browse Schedule &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Teacher CTA ──────────────────────────────────────────────── */}
      <section className="py-20 border-b border-cyan-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge variant="teal">FOR EXPERIENCED SECURITY RESEARCHERS</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Teach on CyberForge Academy
          </h2>
          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
            Host live interactive workshops, publish pre-recorded masterclasses, and keep 100% of your course earnings (subject only to payment gateway charges). Flat <strong>Rs 400 / month</strong> platform subscription with direct bank settlements via Razorpay Route.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register/teacher"
              className="cyber-btn-primary w-full sm:w-auto text-sm px-8 py-3.5"
            >
              Apply as Instructor (Rs 400/mo)
            </Link>
            <Link
              to="/about"
              className="cyber-btn-ghost w-full sm:w-auto text-sm px-6 py-3.5"
            >
              Learn More About Payouts
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ Section ──────────────────────────────────────────────── */}
      <section className="py-20 border-b border-cyan-400/10 bg-[#070B14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="slate">FREQUENTLY ASKED QUESTIONS</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="cyber-card p-5">
                <h4 className="text-base font-bold text-white flex items-center justify-between">
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <GetStartedModal isOpen={getStartedOpen} onClose={() => setGetStartedOpen(false)} />
    </div>
  );
};
