import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { formatINR, formatDuration, formatIST } from '../../lib/formatters';
import { openRazorpayModal } from '../../lib/razorpay';
import {
  Shield,
  CheckCircle,
  PlayCircle,
  Radio,
  Clock,
  BookOpen,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<{ course: any }>(`/api/public/courses/${slug}`)
      .then((res) => {
        setCourse(res.course);
        // Default open first module
        if (res.course?.modules?.[0]?.id) {
          setOpenModules({ [res.course.modules[0].id]: true });
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Course not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      alert('Instructors cannot enroll in courses. Please log in with a student account.');
      return;
    }

    try {
      setEnrolling(true);
      setErrorMsg('');

      const orderData = await api.post<any>('/api/student/orders', {
        courseId: course.id,
      });

      // Free Course Direct Enrollment
      if (orderData.free) {
        navigate(`/student/courses/${course.id}/learn`);
        return;
      }

      // Paid Course Razorpay Modal Flow
      await openRazorpayModal({
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'CyberForge Academy',
        description: course.title,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        handler: async (res) => {
          try {
            await api.post('/api/student/orders/verify', {
              razorpayOrderId: res.razorpay_order_id || orderData.razorpayOrderId,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
            navigate(`/student/courses/${course.id}/learn`);
          } catch (verifyErr: any) {
            setErrorMsg(verifyErr.message || 'Payment verification failed.');
          }
        },
      });
    } catch (err: any) {
      if (err.message !== 'Payment was cancelled by the user.') {
        setErrorMsg(err.message || 'Could not initiate enrollment.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-between text-white">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-20">
          <h2 className="text-2xl font-bold">Course Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">{errorMsg || 'The requested course does not exist.'}</p>
          <Link to="/courses" className="cyber-btn-primary mt-6 text-xs">
            Return to Courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const teacher = course.teacherProfile;
  const isApprovedTeacher = teacher?.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="border-b border-cyan-400/15 bg-gradient-to-b from-[#111827] to-[#0A0F1C] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={course.level === 'BEGINNER' ? 'teal' : course.level === 'INTERMEDIATE' ? 'cyan' : 'purple'}>
                  {course.level}
                </Badge>
                <span className="text-xs font-mono text-cyan-400">{course.category}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">{course.language}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {course.description}
              </p>

              {/* Instructor snippet */}
              <div className="pt-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-400">
                  {teacher?.user?.fullName?.charAt(0) || 'I'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">
                      {teacher?.user?.fullName}
                    </span>
                    {isApprovedTeacher && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                        <CheckCircle className="w-3.5 h-3.5 fill-cyan-400 text-[#0A0F1C]" />
                        <span>Verified Instructor</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{teacher?.headline || 'Offensive Security Researcher'}</p>
                </div>
              </div>
            </div>

            {/* Sticky Enrollment Card */}
            <div className="cyber-card p-6 border-cyan-400/30 shadow-lg shadow-cyan-950/40">
              <div className="text-center pb-6 border-b border-slate-800">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Course Price</p>
                <p className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">
                  {formatINR(course.priceInPaise, true)}
                </p>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="cyber-btn-primary w-full py-3 text-sm font-bold shadow-md shadow-cyan-400/20"
                >
                  {enrolling ? 'Initiating Checkout...' : course.priceInPaise === 0 ? 'Enroll for Free' : 'Enroll Now'}
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  7-Day Refund Policy • Instant LiveKit Class & Video Access
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-cyan-400" /> Recorded Lessons</span>
                  <span className="font-mono text-slate-400">{course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} lessons</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-teal-400" /> Live Interactive Labs</span>
                  <span className="font-mono text-slate-400">{course.liveClasses?.length || 0} scheduled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan-400" /> Ethical Certification</span>
                  <span className="font-mono text-slate-400">Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Syllabus and Instructor Bio */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Syllabus */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Course Syllabus & Modules</span>
              </h2>

              <div className="space-y-3">
                {course.modules?.map((mod: any) => {
                  const isOpen = Boolean(openModules[mod.id]);
                  return (
                    <div key={mod.id} className="cyber-card overflow-hidden">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full p-4 flex items-center justify-between bg-[#151E32] hover:bg-[#1A2640] transition-colors text-left"
                      >
                        <span className="font-semibold text-sm text-white">
                          {mod.title}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{mod.lessons?.length || 0} lessons</span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 border-t border-slate-800 space-y-2 bg-[#0E1524]">
                          {mod.lessons?.map((lesson: any) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-slate-800/40 text-xs text-slate-300"
                            >
                              <div className="flex items-center gap-2.5">
                                <PlayCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>{lesson.title}</span>
                              </div>
                              <span className="font-mono text-slate-400 text-[11px]">
                                {formatDuration(lesson.durationSec)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prerequisites */}
            {course.prerequisites?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Prerequisites</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {course.prerequisites.map((p: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Instructor Profile Bio */}
          <div>
            <div className="cyber-card p-6">
              <h3 className="text-base font-bold text-white mb-4">About the Instructor</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-400 text-lg">
                  {teacher?.user?.fullName?.charAt(0) || 'I'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{teacher?.user?.fullName}</h4>
                  <p className="text-xs text-slate-400">{teacher?.headline || 'Offensive Security Researcher'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {teacher?.bio || 'Experienced cybersecurity professional leading authorized penetration tests and security assessments.'}
              </p>

              {teacher?.experienceYears && (
                <div className="text-xs text-slate-400 mb-2">
                  <span>Experience: </span>
                  <strong className="text-slate-200">{teacher.experienceYears} years</strong>
                </div>
              )}

              {teacher?.languages?.length > 0 && (
                <div className="text-xs text-slate-400 mb-4">
                  <span>Languages: </span>
                  <strong className="text-slate-200">{teacher.languages.join(', ')}</strong>
                </div>
              )}

              {isApprovedTeacher && teacher?.id && (
                <Link
                  to={`/teachers/${teacher.id}`}
                  className="cyber-btn-outline w-full text-xs py-2 justify-center"
                >
                  View Full Instructor Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
