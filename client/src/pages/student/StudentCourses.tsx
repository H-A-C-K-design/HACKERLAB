import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, PlayCircle, Clock } from 'lucide-react';

export const StudentCourses: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ enrollments: any[] }>('/api/student/enrollments')
      .then((res) => setEnrollments(res.enrollments || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Enrolled Courses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your active course recordings, syllabus modules, and lesson progress.
          </p>
        </div>

        <Link to="/student/explore" className="cyber-btn-outline text-xs px-4 py-2">
          Explore More Courses
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 cyber-card animate-pulse"></div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="cyber-card p-12 text-center max-w-md mx-auto my-8">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No enrolled courses yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse our catalog and enroll in practical ethical hacking classes.
          </p>
          <Link to="/student/explore" className="cyber-btn-primary text-xs mt-4">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr) => (
            <div
              key={enr.id}
              className="cyber-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={enr.level === 'BEGINNER' ? 'teal' : 'cyan'} size="sm">
                    {enr.level}
                  </Badge>
                  <span className="text-xs text-slate-400">Instructor: {enr.instructor}</span>
                </div>

                <h3 className="text-base font-bold text-white hover:text-cyan-400 transition-colors">
                  <Link to={`/student/courses/${enr.courseId}/learn`}>{enr.title}</Link>
                </h3>

                <div className="w-full max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Progress: {enr.completedLessons} of {enr.totalLessons} lessons completed</span>
                    <span className="text-cyan-400 font-bold">{enr.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${enr.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  to={`/student/courses/${enr.courseId}/learn`}
                  className="cyber-btn-primary text-xs px-4 py-2 font-bold"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Resume Learning</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
