import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../lib/formatters';
import { Search, BookOpen, ArrowRight } from 'lucide-react';

export const StudentExplore: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    let query = '/api/public/courses?limit=20';
    if (category !== 'ALL') query += `&category=${encodeURIComponent(category)}`;
    if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

    api
      .get<{ courses: any[] }>(query)
      .then((res) => setCourses(res.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [category, search]);

  const categories = [
    'ALL',
    'Web Pentesting',
    'Network Security',
    'Red Teaming',
    'CTF',
    'Malware Analysis',
    'Cloud Security',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Explore Courses</h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse vetted curriculum created by approved offensive & defensive cybersecurity instructors.
        </p>
      </div>

      {/* Filter bar */}
      <div className="cyber-card p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vulnerability, tool, or topic..."
            className="cyber-input text-xs pl-9"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="cyber-input text-xs w-full sm:w-44"
        >
          {categories.map((c) => (
            <option key={c} value={c} className="bg-[#111827]">
              {c === 'ALL' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="cyber-card h-56 animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="cyber-card p-12 text-center text-xs text-slate-400">
          No courses match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="cyber-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant={course.level === 'BEGINNER' ? 'teal' : 'cyan'} size="sm">
                    {course.level}
                  </Badge>
                  <span className="text-xs font-mono text-cyan-400">
                    {formatINR(course.priceInPaise, true)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white hover:text-cyan-400 transition-colors line-clamp-2">
                  <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate">
                  Instructor: <strong>{course.teacherProfile?.user?.fullName}</strong>
                </span>
                <Link
                  to={`/courses/${course.slug}`}
                  className="cyber-btn-outline text-xs px-3 py-1 font-semibold"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
