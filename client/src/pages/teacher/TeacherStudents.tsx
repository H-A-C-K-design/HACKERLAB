import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Users, Search, CheckCircle, Clock } from 'lucide-react';

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<{ students: any[] }>('/api/teacher/students')
      .then((res) => setStudents(res.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Enrolled Students</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor student completion rates and course participation. Per privacy guidelines, student emails are protected.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students or course..."
            className="cyber-input text-xs pl-9"
          />
        </div>
      </div>

      <div className="cyber-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student roster...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            No enrolled students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1524] text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Enrolled Course</th>
                  <th className="p-4">Completion Progress</th>
                  <th className="p-4">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((s) => (
                  <tr key={s.enrollmentId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-400/40 flex items-center justify-center font-bold text-teal-400 text-xs">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-white block">{s.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Email Hidden (Privacy Rule)</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{s.courseTitle}</td>
                    <td className="p-4">
                      <div className="w-48">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-cyan-400">{s.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
