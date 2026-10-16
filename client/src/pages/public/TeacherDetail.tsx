import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/formatters';
import { CheckCircle, Award, BookOpen, Globe, Linkedin, Github } from 'lucide-react';

export const TeacherDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ teacher: any }>(`/api/public/teachers/${id}`)
      .then((res) => setTeacher(res.teacher))
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-between text-white">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-20">
          <h2 className="text-2xl font-bold">Instructor Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">The instructor profile is private or awaiting administrative approval.</p>
          <Link to="/courses" className="cyber-btn-primary mt-6 text-xs">
            Browse Courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <div className="cyber-card p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 font-bold text-3xl shadow-lg shadow-cyan-400/20">
              {teacher.user?.fullName?.charAt(0) || 'I'}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {teacher.user?.fullName}
                </h1>
                <Badge variant="cyan" size="sm">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Verified CyberForge Instructor
                </Badge>
              </div>

              <p className="text-sm font-mono text-cyan-300">{teacher.headline}</p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{teacher.bio}</p>

              {/* Specialization Tags */}
              {teacher.specializations?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {teacher.specializations.map((spec: string, idx: number) => (
                    <span key={idx} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      #{spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications */}
        {teacher.qualifications?.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-400" />
              <span>Verified Qualifications & Certifications</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacher.qualifications.map((q: any) => (
                <div key={q.id} className="cyber-card p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{q.title}</h4>
                    <p className="text-xs text-slate-400">{q.organization} • {q.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Courses */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Courses by {teacher.user?.fullName}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {teacher.courses?.map((c: any) => (
              <div key={c.id} className="cyber-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={c.level === 'BEGINNER' ? 'teal' : 'cyan'} size="sm">{c.level}</Badge>
                    <span className="text-xs font-mono text-cyan-400">{formatINR(c.priceInPaise, true)}</span>
                  </div>
                  <h4 className="font-bold text-base text-white hover:text-cyan-400 transition-colors">
                    <Link to={`/courses/${c.slug}`}>{c.title}</Link>
                  </h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <Link to={`/courses/${c.slug}`} className="cyber-btn-outline text-xs px-3 py-1.5">
                    View Course &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
