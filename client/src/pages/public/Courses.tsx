import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/formatters';
import { Search, Filter, BookOpen, ArrowRight } from 'lucide-react';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [level, setLevel] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    let query = `/api/public/courses?limit=24`;
    if (category !== 'ALL') query += `&category=${encodeURIComponent(category)}`;
    if (level !== 'ALL') query += `&level=${encodeURIComponent(level)}`;
    if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

    api
      .get<{ courses: any[] }>(query)
      .then((res) => setCourses(res.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [category, level, search]);

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
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="cyan">COURSE CATALOG</Badge>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Explore Cybersecurity Curriculum
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose from comprehensive offensive security bootcamps and hands-on defensive labs.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="cyber-card p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vulnerability, tool, or topic (e.g. SQLi, Nmap, Kali)..."
              className="cyber-input pl-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Category dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="cyber-input text-xs w-full md:w-44"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#111827]">
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            {/* Level dropdown */}
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="cyber-input text-xs w-full md:w-36"
            >
              <option value="ALL" className="bg-[#111827]">All Levels</option>
              <option value="BEGINNER" className="bg-[#111827]">Beginner</option>
              <option value="INTERMEDIATE" className="bg-[#111827]">Intermediate</option>
              <option value="ADVANCED" className="bg-[#111827]">Advanced</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cyber-card p-6 h-64 animate-pulse bg-slate-900/50"></div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="cyber-card p-12 text-center max-w-md mx-auto my-12">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No courses match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or reset category filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('ALL');
                setLevel('ALL');
              }}
              className="cyber-btn-outline text-xs mt-5"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
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
        )}
      </main>

      <Footer />
    </div>
  );
};
