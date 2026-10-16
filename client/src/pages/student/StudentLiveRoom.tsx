import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../features/auth/AuthContext';
import {
  Radio,
  PhoneOff,
  Hand,
  MessageSquare,
  Send,
  Users,
  Shield,
  Clock,
} from 'lucide-react';

export const StudentLiveRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);

  // Chat & Presence State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [handRaised, setHandRaised] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!id) return;

    // Get student LiveKit access token
    api
      .post<any>(`/api/student/live-classes/${id}/token`)
      .then((data) => {
        setRoomInfo(data);
        initSocket();
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not join live classroom.');
      })
      .finally(() => setLoading(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const initSocket = () => {
    const socket = io('/live', { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join_class', { classId: id });

    socket.on('participant_joined', (p) => {
      setParticipantCount((prev) => prev + 1);
    });

    socket.on('participant_left', () => {
      setParticipantCount((prev) => Math.max(1, prev - 1));
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      classId: id,
      message: inputText.trim(),
    });

    setInputText('');
  };

  const handleRaiseHand = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('raise_hand', { classId: id });
    setHandRaised(true);
    setTimeout(() => setHandRaised(false), 5000);
  };

  const handleLeave = () => {
    navigate('/student/live');
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm text-rose-400">CONNECTING TO LIVE WEBRTC STREAM...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="cyber-card p-12 text-center max-w-lg mx-auto my-12">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-rose-300 mt-2">{errorMsg}</p>
        <Link to="/student/live" className="cyber-btn-outline text-xs mt-6">
          Back to Live Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Stream Viewer */}
      <div className="flex-1 flex flex-col cyber-card p-4 overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              STUDENT VIEWER • {roomInfo?.roomName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Users className="w-4 h-4" />
              <span>{participantCount} In Session</span>
            </span>
          </div>
        </div>

        {/* Video Canvas / Stream Window */}
        <div className="flex-1 bg-black rounded-lg my-3 relative overflow-hidden flex items-center justify-center border border-slate-800">
          <div className="text-center p-8 space-y-2 text-slate-400">
            <Radio className="w-14 h-14 text-rose-500 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-white">Live Classroom Broadcast Active</h3>
            <p className="text-xs font-mono text-slate-400">Low-latency WebRTC audio & screen stream</p>
          </div>

          {/* Dynamic Anti-Piracy Watermark on live feed */}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[11px] font-mono text-cyan-400 border border-cyan-400/20 select-none">
            {user?.fullName} ({user?.email})
          </div>
        </div>

        {/* Student Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleRaiseHand}
            disabled={handRaised}
            className={`px-4 py-2.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${
              handRaised
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'cyber-btn-outline'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>{handRaised ? 'Hand Raised for Question' : 'Raise Hand'}</span>
          </button>

          <button
            onClick={handleLeave}
            className="px-5 py-2.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Class</span>
          </button>
        </div>
      </div>

      {/* Classroom Chat */}
      <div className="w-full lg:w-80 cyber-card flex flex-col h-96 lg:h-auto overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Classroom Chat</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Live</span>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
          {messages.map((m) => (
            <div key={m.id} className="p-2.5 rounded-lg bg-slate-800/60">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-[11px] ${m.role === 'TEACHER' ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {m.senderName} {m.role === 'TEACHER' && '(Instructor)'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed break-words">{m.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask question in chat..."
            className="cyber-input text-xs py-2 flex-1"
          />
          <button type="submit" className="p-2 rounded-lg bg-cyan-400 text-[#0A0F1C] hover:bg-cyan-300">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
