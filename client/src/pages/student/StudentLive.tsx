import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { formatIST } from '../../lib/formatters';
import { Radio, Clock, Shield } from 'lucide-react';

export const StudentLive: React.FC = () => {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ liveClasses: any[] }>('/api/student/live-classes')
      .then((res) => setLiveClasses(res.liveClasses || []))
      .catch(() => setLiveClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const isJoinActive = (scheduledStartStr: string) => {
    const scheduled = new Date(scheduledStartStr).getTime();
    const now = Date.now();
    const tenMinEarly = 10 * 60 * 1000;
    return now >= scheduled - tenMinEarly;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Interactive Classrooms</h1>
        <p className="text-xs text-slate-400 mt-1">
          Attend live stream lab sessions with instructors for your enrolled courses.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 cyber-card animate-pulse"></div>
          ))}
        </div>
      ) : liveClasses.length === 0 ? (
        <div className="cyber-card p-12 text-center max-w-md mx-auto my-8">
          <Radio className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No upcoming live classes</h3>
          <p className="text-xs text-slate-400 mt-1">
            When instructors schedule live CTFs or lab sessions for your enrolled courses, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {liveClasses.map((lc) => {
            const canJoin = isJoinActive(lc.scheduledStart) || lc.status === 'LIVE';
            return (
              <div
                key={lc.id}
                className="cyber-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={lc.status === 'LIVE' ? 'danger' : 'cyan'} size="sm" dot={lc.status === 'LIVE'}>
                      {lc.status}
                    </Badge>
                    <span className="text-xs font-mono text-cyan-400">{lc.course?.title}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{lc.title}</h3>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatIST(lc.scheduledStart)}
                    </span>
                    <span>Instructor: {lc.course?.teacherProfile?.user?.fullName}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {canJoin ? (
                    <Link
                      to={`/student/live/${lc.id}/room`}
                      className="cyber-btn-primary text-xs px-5 py-2 font-bold bg-rose-500 hover:bg-rose-400 text-white"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Join Live Classroom</span>
                    </Link>
                  ) : (
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Unlocks 10 min prior
                      </span>
                      <button disabled className="cyber-btn-outline text-xs px-4 py-1.5 opacity-50 cursor-not-allowed mt-1">
                        Locked
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
