import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatIST } from '../../lib/formatters';
import {
  Compass,
  PlayCircle,
  Radio,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle,
  Shield,
} from 'lucide-react';

export const StudentHome: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ enrollments: any[] }>('/api/student/enrollments'),
      api.get<{ liveClasses: any[] }>('/api/student/live-classes'),
    ])
      .then(([enrRes, liveRes]) => {
        setEnrollments(enrRes.enrollments || []);
        setLiveClasses(liveRes.liveClasses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const nextCourse = enrollments[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="cyber-card p-6 bg-gradient-to-r from-[#111827] via-[#151E32] to-[#111827] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome Back, <span className="text-cyan-400">{user?.fullName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your course progress, attend live masterclasses, and solve defensive security labs.
          </p>
        </div>

        <Link to="/student/explore" className="cyber-btn-primary text-xs px-4 py-2 font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Explore More Courses</span>
        </Link>
      </div>

      {/* Continue Learning Card */}
      {nextCourse ? (
        <div className="cyber-card p-6 border-cyan-400/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block mb-1">
                CONTINUE LEARNING
              </span>
              <h2 className="text-xl font-bold text-white">{nextCourse.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Instructor: {nextCourse.instructor} • Level: {nextCourse.level}
              </p>
            </div>

            <Link
              to={`/student/courses/${nextCourse.courseId}/learn`}
              className="cyber-btn-primary text-xs px-5 py-2.5 font-bold shadow-md shadow-cyan-400/20"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Course</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Course Completion</span>
              <span className="text-cyan-400 font-bold">{nextCourse.progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${nextCourse.progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="cyber-card p-8 text-center">
          <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No active enrollments yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse our course catalog to enroll in offensive & defensive security bootcamps.
          </p>
          <Link to="/student/explore" className="cyber-btn-outline text-xs mt-4">
            Browse Curriculum
          </Link>
        </div>
      )}

      {/* Two Column Layout: Upcoming Live Classes & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Classes Card */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Enrolled Live Classes</span>
            </h3>
            <Link to="/student/live" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          {liveClasses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No live sessions scheduled for your enrolled courses this week.
            </p>
          ) : (
            <div className="space-y-3">
              {liveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="p-3.5 rounded-lg bg-[#0E1524] border border-cyan-400/15 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{lc.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatIST(lc.scheduledStart)}
                    </p>
                  </div>
                  <Link
                    to={`/student/live/${lc.id}/room`}
                    className="cyber-btn-primary text-[11px] px-3.5 py-1.5 font-bold bg-rose-500 hover:bg-rose-400 text-white"
                  >
                    Join Class
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Platform Announcements */}
        <div className="cyber-card p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Platform Announcements</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <div className="flex items-center justify-between font-mono text-[11px] text-teal-400 mb-1">
                <span>NEW CTF CHALLENGES ADDED</span>
                <span>Oct 2026</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                OWASP API Security Top 10 sandboxes are now live across all Web Pentesting curriculum modules.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400 mb-1">
                <span>DYNAMIC WATERMARKING RELEASE</span>
                <span>Oct 2026</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Anti-piracy visual watermarks now protect all signed video streaming playback across desktop and mobile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
