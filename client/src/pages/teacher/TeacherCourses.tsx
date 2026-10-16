import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatINR } from '../../lib/formatters';
import {
  BookOpen,
  Plus,
  Play,
  CheckCircle,
  Eye,
  AlertCircle,
  Shield,
  Trash2,
} from 'lucide-react';

export const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [category, setCategory] = useState('Web Pentesting');
  const [priceInRupees, setPriceInRupees] = useState(1999);
  const [ethicalCheck, setEthicalCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    api
      .get<{ courses: any[] }>('/api/teacher/courses')
      .then((res) => setCourses(res.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethicalCheck) {
      setErrorMsg('You must check the ethical security declaration.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/api/teacher/courses', {
        title,
        slug,
        description,
        level,
        category,
        language: 'English',
        priceInPaise: Number(priceInRupees) * 100,
        prerequisites: ['Basic computer science literacy'],
        ethicalCheck: true,
      });

      setSuccessMsg('Course draft created successfully!');
      setModalOpen(false);
      // Reset form
      setTitle('');
      setSlug('');
      setDescription('');
      setEthicalCheck(false);
      fetchCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (courseId: string) => {
    try {
      setErrorMsg('');
      await api.post(`/api/teacher/courses/${courseId}/publish`);
      setSuccessMsg('Course published to public catalog!');
      fetchCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot publish course. Active subscription and approved profile required.');
    }
  };

  const handleUnpublish = async (courseId: string) => {
    try {
      await api.post(`/api/teacher/courses/${courseId}/unpublish`);
      fetchCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot unpublish course.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build, publish, and manage your cybersecurity curriculum.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="cyber-btn-primary text-xs px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 cyber-card animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="cyber-card p-12 text-center max-w-md mx-auto my-8">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No courses created yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Create your first course draft to start adding syllabus modules and lessons.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="cyber-btn-primary text-xs mt-5"
          >
            Create First Course
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="cyber-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      course.status === 'PUBLISHED'
                        ? 'success'
                        : course.status === 'DRAFT'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {course.status}
                  </Badge>
                  <span className="text-xs font-mono text-cyan-400">{course.category}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{course.level}</span>
                </div>

                <h3 className="text-base font-bold text-white">{course.title}</h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Price: <strong className="text-cyan-300">{formatINR(course.priceInPaise, true)}</strong></span>
                  <span>Modules: {course._count?.modules || 0}</span>
                  <span>Students: {course._count?.enrollments || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/courses/${course.slug}`}
                  target="_blank"
                  className="cyber-btn-ghost text-xs px-3 py-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                {course.status === 'PUBLISHED' ? (
                  <button
                    onClick={() => handleUnpublish(course.id)}
                    className="cyber-btn-outline text-xs px-3.5 py-1.5 text-amber-400 border-amber-400/40"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish(course.id)}
                    className="cyber-btn-primary text-xs px-3.5 py-1.5"
                  >
                    Publish Course
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Course" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="cyber-label">Course Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Advanced Windows Privilege Escalation"
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">Course Slug (Unique URL identifier)</label>
            <input
              required
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="advanced-windows-privilege-escalation"
              className="cyber-input font-mono text-xs"
            />
          </div>

          <div>
            <label className="cyber-label">Course Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the course curriculum, target audience, and defensive applications..."
              className="cyber-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="cyber-label">Skill Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="cyber-input text-xs"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label className="cyber-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="cyber-input text-xs"
              >
                <option value="Web Pentesting">Web Pentesting</option>
                <option value="Network Security">Network Security</option>
                <option value="Red Teaming">Red Teaming</option>
                <option value="CTF">CTF</option>
                <option value="Malware Analysis">Malware Analysis</option>
                <option value="Cloud Security">Cloud Security</option>
              </select>
            </div>

            <div>
              <label className="cyber-label">Price (INR, 0 for Free)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={priceInRupees}
                onChange={(e) => setPriceInRupees(Number(e.target.value))}
                className="cyber-input font-mono"
              />
            </div>
          </div>

          {/* Acceptable Use Policy Checkbox per spec */}
          <div className="p-3.5 rounded-lg bg-[#0E1524] border border-cyan-400/20">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={ethicalCheck}
                onChange={(e) => setEthicalCheck(e.target.checked)}
                className="mt-1 rounded bg-[#0A0F1C] border-cyan-400 text-cyan-400"
              />
              <span className="text-xs text-slate-300 leading-normal">
                <strong>Ethical Use Declaration:</strong> I declare that all course content is strictly for authorized and ethical cybersecurity education, defensive auditing, and lawful research.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="cyber-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn-primary text-xs px-6 py-2.5 font-bold"
            >
              {submitting ? 'Creating Course...' : 'Create Course Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
