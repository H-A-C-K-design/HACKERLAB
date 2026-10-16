import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Modal } from './Modal';
import { Shield, GraduationCap, ArrowRight, UserCheck } from 'lucide-react';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSelectRole = (role: 'teacher' | 'student') => {
    onClose();
    navigate(`/register/${role}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join CyberForge Academy" maxWidth="max-w-xl">
      <p className="text-sm text-slate-300 mb-6">
        Select your journey on CyberForge Academy. Connect with premier ethical hacking instructors or share your defensive security expertise.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Teacher Option */}
        <button
          onClick={() => handleSelectRole('teacher')}
          className="group text-left p-5 rounded-[12px] bg-[#151E32] border border-cyan-400/20 hover:border-cyan-400 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)] transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              I am a Teacher
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Teach live classes and upload courses. Monthly subscription applies (Rs 400/mo).
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Register as Teacher</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Student Option */}
        <button
          onClick={() => handleSelectRole('student')}
          className="group text-left p-5 rounded-[12px] bg-[#151E32] border border-teal-400/20 hover:border-teal-400 hover:shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-teal-950/80 border border-teal-400/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
              I am a Student
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Learn ethical hacking from verified instructors with real-world sandboxes.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
            <span>Register as Student</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center text-sm text-slate-400">
        <span>Already have an account? </span>
        <Link
          to="/login"
          onClick={onClose}
          className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded"
        >
          Sign in
        </Link>
      </div>
    </Modal>
  );
};
