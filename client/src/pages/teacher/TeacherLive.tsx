import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatIST } from '../../lib/formatters';
import {
  Radio,
  Plus,
  Clock,
  Users,
  Video,
  Play,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const TeacherLive: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const fetchLiveClasses = () => {
    setLoading(true);
    Promise.all([
      api.get<{ liveClasses: any[] }>('/api/teacher/live-classes'),
      api.get<{ courses: any[] }>('/api/teacher/courses'),
    ])
      .then(([liveRes, coursesRes]) => {
        setClasses(liveRes.liveClasses || []);
        setCourses(coursesRes.courses || []);
        if (coursesRes.courses?.[0]?.id) {
          setSelectedCourseId(coursesRes.courses[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/api/teacher/live-classes', {
        courseId: selectedCourseId,
        title,
        scheduledStart: new Date(scheduledStart).toISOString(),
        durationMin: Number(durationMin),
        maxParticipants: Number(maxParticipants),
      });

      setSuccessMsg('Live session scheduled successfully!');
      setModalOpen(false);
      setTitle('');
      fetchLiveClasses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not schedule live session.');
    } finally {
      setSubmitting(false);
    }
  };

  const isGoLiveActive = (scheduledStartStr: string) => {
    const scheduled = new Date(scheduledStartStr).getTime();
    const now = Date.now();
    const tenMinEarly = 10 * 60 * 1000;
    return now >= scheduled - tenMinEarly;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Classes & Broadcasting</h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule live classrooms, stream via WebRTC, and interact with students in real time.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="cyber-btn-primary text-xs px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
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

      {/* Classes list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 cyber-card animate-pulse"></div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="cyber-card p-12 text-center max-w-md mx-auto my-8">
          <Radio className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No live classes scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">
            Host live interactive labs for enrolled students with instant Q&A.
          </p>
          <button onClick={() => setModalOpen(true)} className="cyber-btn-primary text-xs mt-5">
            Schedule First Class
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((lc) => {
            const active = isGoLiveActive(lc.scheduledStart);
            return (
              <div
                key={lc.id}
                className="cyber-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        lc.status === 'LIVE'
                          ? 'danger'
                          : lc.status === 'SCHEDULED'
                          ? 'cyan'
                          : 'slate'
                      }
                      size="sm"
                      dot={lc.status === 'LIVE'}
                    >
                      {lc.status}
                    </Badge>
                    <span className="text-xs font-mono text-cyan-400">{lc.course?.title}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{lc.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {formatIST(lc.scheduledStart)}
                    </span>
                    <span>Duration: {lc.durationMin} mins</span>
                    <span>Capacity: {lc.maxParticipants} students</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {lc.status === 'ENDED' ? (
                    <span className="text-xs font-mono text-slate-500">Session Completed</span>
                  ) : active || lc.status === 'LIVE' ? (
                    <Link
                      to={`/teacher/live/${lc.id}/room`}
                      className="cyber-btn-primary text-xs px-5 py-2 font-bold shadow-md shadow-rose-500/20 bg-rose-500 hover:bg-rose-400 text-white"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>{lc.status === 'LIVE' ? 'Enter Live Room' : 'Go Live Now'}</span>
                    </Link>
                  ) : (
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Unlocks 10 min before start
                      </span>
                      <button disabled className="cyber-btn-outline text-xs px-4 py-1.5 opacity-50 cursor-not-allowed mt-1">
                        Go Live (Locked)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Live Class Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Live Class">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="cyber-label">Target Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="cyber-input text-xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111827]">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="cyber-label">Class Session Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Live CTF Lab: Exploiting Broken Object Level Auth"
              className="cyber-input"
            />
          </div>

          <div>
            <label className="cyber-label">Start Date & Time (IST)</label>
            <input
              required
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="cyber-input font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cyber-label">Duration (Minutes)</label>
              <input
                type="number"
                min={15}
                max={300}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="cyber-input font-mono"
              />
            </div>
            <div>
              <label className="cyber-label">Max Participants</label>
              <input
                type="number"
                min={5}
                max={500}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="cyber-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="cyber-btn-ghost text-xs">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="cyber-btn-primary text-xs px-6 py-2.5 font-bold">
              {submitting ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
