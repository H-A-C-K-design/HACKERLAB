import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatDuration } from '../../lib/formatters';
import {
  PlayCircle,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';

export const StudentPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [courseData, setCourseData] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active lesson state
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api
      .get<{ course: any; watermark: any }>(`/api/student/courses/${id}/player`)
      .then((res) => {
        setCourseData(res.course);
        setWatermark(res.watermark);

        // Pick first lesson by default
        const firstLesson = res.course.modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          setActiveLesson(firstLesson);
        }

        // Open first module
        if (res.course.modules?.[0]?.id) {
          setOpenModules({ [res.course.modules[0].id]: true });
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not load course player.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    try {
      await api.post(`/api/student/lessons/${activeLesson.id}/progress`, {
        watchedSec: activeLesson.durationSec || 60,
        completed: true,
      });

      // Update state
      setActiveLesson((prev: any) => ({ ...prev, completed: true }));
      // Also update in courseData
      setCourseData((prev: any) => {
        if (!prev) return prev;
        const newModules = prev.modules.map((m: any) => ({
          ...m,
          lessons: m.lessons.map((l: any) =>
            l.id === activeLesson.id ? { ...l, completed: true } : l
          ),
        }));
        return { ...prev, modules: newModules };
      });
    } catch (err: any) {
      alert(err.message || 'Could not record progress.');
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-xs text-cyan-400">RETRIEVING ENCRYPTED VIDEO STREAMS...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="cyber-card p-12 text-center max-w-md mx-auto my-12">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-rose-300 mt-2">{errorMsg}</p>
        <Link to="/student/courses" className="cyber-btn-outline text-xs mt-6">
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Link to="/student/courses" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Courses</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-semibold text-white truncate max-w-md">
            {courseData?.title}
          </span>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Instructor: {courseData?.instructor}
        </span>
      </div>

      {/* Main Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Video Player and Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-[12px] border border-cyan-400/20 overflow-hidden relative aspect-video flex items-center justify-center shadow-2xl">
            {activeLesson?.signedUrl ? (
              <video
                key={activeLesson.id}
                src={activeLesson.signedUrl}
                controls
                controlsList="nodownload" // Disables standard browser download action per spec
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8 space-y-2 text-slate-400">
                <PlayCircle className="w-12 h-12 text-cyan-400 mx-auto opacity-50" />
                <p className="text-xs font-mono">Demo recording video stream ready</p>
                <p className="text-[11px] text-slate-500">Select any lesson from the curriculum</p>
              </div>
            )}

            {/* Anti-Piracy Dynamic Watermark Overlay */}
            {watermark?.text && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300/80 border border-cyan-400/20 pointer-events-none select-none">
                🔒 {watermark.text}
              </div>
            )}
          </div>

          {/* Lesson Header & Mark Complete */}
          <div className="cyber-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={activeLesson?.completed ? 'success' : 'cyan'} size="sm">
                  {activeLesson?.completed ? 'Completed' : 'In Progress'}
                </Badge>
                <span className="text-xs font-mono text-slate-400">
                  {formatDuration(activeLesson?.durationSec)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">{activeLesson?.title}</h2>
            </div>

            <button
              onClick={handleMarkComplete}
              className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeLesson?.completed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/40'
                  : 'cyber-btn-primary'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{activeLesson?.completed ? 'Lesson Completed' : 'Mark Lesson Complete'}</span>
            </button>
          </div>

          {/* Notes Panel */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Study Notes Panel</span>
            </h3>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down vulnerability notes, attack payloads, or commands here..."
              className="cyber-input text-xs font-mono resize-none"
            />
            <p className="text-[10px] text-slate-500 text-right mt-1 font-mono">
              Saved automatically in session
            </p>
          </div>
        </div>

        {/* Right Column: Syllabus Accordion Sidebar */}
        <div className="cyber-card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Course Curriculum</span>
          </h3>

          <div className="space-y-2">
            {courseData?.modules?.map((mod: any) => {
              const isOpen = Boolean(openModules[mod.id]);
              return (
                <div key={mod.id} className="rounded-lg border border-slate-800 overflow-hidden bg-[#0E1524]">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-xs font-semibold text-white">{mod.title}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-slate-800/60 border-t border-slate-800/80 bg-[#0A0F1C]">
                      {mod.lessons?.map((l: any) => {
                        const isCurrent = activeLesson?.id === l.id;
                        return (
                          <button
                            key={l.id}
                            onClick={() => handleSelectLesson(l)}
                            className={`w-full p-2.5 flex items-center justify-between text-left text-xs transition-colors ${
                              isCurrent
                                ? 'bg-cyan-950/60 text-cyan-300 font-bold border-l-2 border-cyan-400'
                                : 'text-slate-300 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {l.completed ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="truncate">{l.title}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                              {formatDuration(l.durationSec)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
