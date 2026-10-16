import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatINR, formatIST } from '../../lib/formatters';
import {
  BookOpen,
  Users,
  TrendingUp,
  Radio,
  Clock,
  ArrowRight,
  Shield,
  Plus,
} from 'lucide-react';

export const TeacherOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>('/api/teacher/overview')
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 cyber-card"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 cyber-card"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalCourses: 0,
    totalStudents: 0,
    netEarningsPaise: 0,
    salesCount: 0,
  };
  const profile = data?.profile;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="cyber-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#151E32] to-[#111827]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
            <Badge
              variant={
                profile?.status === 'APPROVED'
                  ? 'success'
                  : profile?.status === 'PENDING_APPROVAL'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {profile?.status || 'DRAFT'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Subscription:{' '}
            <strong className="text-cyan-300 font-mono capitalize">
              {profile?.subscriptionStatus || 'inactive'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/courses" className="cyber-btn-primary text-xs px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </Link>
          <Link to="/teacher/live" className="cyber-btn-outline text-xs px-4 py-2">
            <Radio className="w-4 h-4" />
            <span>Live Classes</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Courses</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.totalCourses}
          </p>
        </div>

        <div className="cyber-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Enrolled Students</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.totalStudents}
          </p>
        </div>

        <div className="cyber-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Net Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-2">
            {formatINR(metrics.netEarningsPaise, true)}
          </p>
        </div>

        <div className="cyber-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Course Sales</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.salesCount}
          </p>
        </div>
      </div>

      {/* Two Column Section: Next Live Class & Recent Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Live Class */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Upcoming Live Sessions</span>
            </h3>
            <Link to="/teacher/live" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          {data?.nextLiveClasses?.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No live classes scheduled for this week.
              <div className="mt-3">
                <Link to="/teacher/live" className="cyber-btn-outline text-xs px-3 py-1.5">
                  Schedule Class
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.nextLiveClasses?.map((lc: any) => (
                <div key={lc.id} className="p-3.5 rounded-lg bg-[#0E1524] border border-cyan-400/15 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{lc.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatIST(lc.scheduledStart)} • {lc.durationMin} mins
                    </p>
                  </div>
                  <Link
                    to={`/teacher/live/${lc.id}/room`}
                    className="cyber-btn-primary text-[11px] px-3 py-1 font-bold"
                  >
                    Go Live
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Recent Student Enrollments</span>
            </h3>
            <Link to="/teacher/students" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          {data?.recentEnrollments?.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent enrollments to show.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentEnrollments?.map((enr: any) => (
                <div key={enr.id} className="p-3 rounded-lg bg-[#0E1524] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block">{enr.student.fullName}</strong>
                    <span className="text-slate-400 text-[11px]">{enr.course.title}</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatINR(enr.course.priceInPaise, true)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
