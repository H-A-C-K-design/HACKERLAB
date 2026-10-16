import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  Send,
  Shield,
  Hand,
} from 'lucide-react';

export const TeacherLiveRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);

  // Controls state
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // Chat & Presence State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [handsRaised, setHandsRaised] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!id) return;

    // Start live session on backend (gets token and sets status LIVE)
    api
      .post<any>(`/api/teacher/live-classes/${id}/start`)
      .then((data) => {
        setRoomInfo(data);
        initLocalMedia();
        initSocket();
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not start live broadcast.');
      })
      .finally(() => setLoading(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const initLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Webcam or mic not available in current environment:', e);
    }
  };

  const initSocket = () => {
    const socket = io('/live', { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join_class', { classId: id });

    socket.on('participant_joined', (p) => {
      setParticipantCount((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          senderName: 'SYSTEM',
          message: `${p.fullName} joined the session`,
          system: true,
        },
      ]);
    });

    socket.on('participant_left', (p) => {
      setParticipantCount((prev) => Math.max(1, prev - 1));
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('hand_raised', (data) => {
      setHandsRaised((prev) => [...prev, data]);
      setMessages((prev) => [
        ...prev,
        {
          id: `hand_${Date.now()}`,
          senderName: 'SYSTEM',
          message: `✋ ${data.fullName} raised their hand for a question`,
          system: true,
        },
      ]);
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

  const handleEndClass = async () => {
    if (!confirm('Are you sure you want to end this live session? A recording will be saved.')) {
      return;
    }

    try {
      await api.post(`/api/teacher/live-classes/${id}/end`);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      navigate('/teacher/live');
    } catch (err: any) {
      alert(err.message || 'Could not end live class.');
    }
  };

  const toggleCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => (track.enabled = !cameraOn));
      setCameraOn(!cameraOn);
    }
  };

  const toggleMic = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => (track.enabled = !micOn));
      setMicOn(!micOn);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm text-rose-400">CONNECTING TO LIVEKIT BROADCAST ROOM...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="cyber-card p-12 text-center max-w-lg mx-auto my-12">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Broadcast Failed to Launch</h2>
        <p className="text-xs text-rose-300 mt-2">{errorMsg}</p>
        <Link to="/teacher/live" className="cyber-btn-outline text-xs mt-6">
          Back to Live Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Video Stage & Controls */}
      <div className="flex-1 flex flex-col cyber-card p-4 overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              LIVE BROADCAST • {roomInfo?.roomName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Users className="w-4 h-4" />
              <span>{participantCount} In Session</span>
            </span>
            <span className="text-rose-400 font-bold">REC ● EGRESS</span>
          </div>
        </div>

        {/* Video Screen */}
        <div className="flex-1 bg-black rounded-lg my-3 relative overflow-hidden flex items-center justify-center border border-slate-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {!cameraOn && (
            <div className="absolute inset-0 bg-[#0A0F1C] flex flex-col items-center justify-center text-slate-400">
              <VideoOff className="w-12 h-12 mb-2 text-slate-600" />
              <p className="text-xs font-mono">Camera Paused</p>
            </div>
          )}

          {/* Dynamic Teacher Watermark */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[11px] font-mono text-cyan-400 border border-cyan-400/20">
            Instructor Stream (Host)
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                micOn
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span>{micOn ? 'Mute Mic' : 'Unmute'}</span>
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                cameraOn
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300'
              }`}
            >
              {cameraOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              <span>{cameraOn ? 'Stop Video' : 'Start Video'}</span>
            </button>
          </div>

          <button
            onClick={handleEndClass}
            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Session & Save Recording</span>
          </button>
        </div>
      </div>

      {/* Real-time Interactive Chat & Presence Panel */}
      <div className="w-full lg:w-80 cyber-card flex flex-col h-96 lg:h-auto overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Classroom Chat</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Socket.IO /live</span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
          {messages.map((m) => {
            if (m.system) {
              return (
                <div key={m.id} className="text-[11px] font-mono text-cyan-400/80 text-center py-1">
                  {m.message}
                </div>
              );
            }
            const isMe = m.role === 'TEACHER';
            return (
              <div key={m.id} className={`p-2.5 rounded-lg ${isMe ? 'bg-cyan-950/40 border border-cyan-400/20' : 'bg-slate-800/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-[11px] ${isMe ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {m.senderName} {isMe && '(Host)'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed break-words">{m.message}</p>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        <form onSubmit={sendMessage} className="p-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to students..."
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
