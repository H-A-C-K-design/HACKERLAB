import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Video, Upload, CheckCircle, Clock, Film, AlertCircle } from 'lucide-react';

export const TeacherRecordings: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    api
      .get<{ courses: any[] }>('/api/teacher/courses')
      .then((res) => {
        setCourses(res.courses || []);
        if (res.courses?.[0]?.id) {
          setSelectedCourseId(res.courses[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !lessonTitle) {
      setErrorMsg('Please select an MP4 video file and specify a lesson title.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Get presigned R2 upload URL from backend
      const presign = await api.post<any>('/api/teacher/uploads/presign', {
        prefix: `courses/${selectedCourseId}`,
        extension: 'mp4',
        contentType: 'video/mp4',
      });

      // 2. Upload file directly to R2
      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/mp4' },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Direct R2 video upload failed');
      }

      setSuccessMsg('Video uploaded to Cloudflare R2 successfully and linked to course!');
      setLessonTitle('');
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Video upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Course Video Recordings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload pre-recorded MP4 lessons to Cloudflare R2 or manage auto-generated recordings from live classrooms.
        </p>
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

      {/* Upload Box */}
      <div className="cyber-card p-6 border-cyan-400/25">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Upload Lesson Video to Cloudflare R2</span>
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="cyber-label">Lesson Title</label>
              <input
                required
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. 2.1 Reversing ELF Binaries with Ghidra"
                className="cyber-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="cyber-label">Select MP4 Video (Max 4 GB)</label>
            <input
              required
              type="file"
              accept="video/mp4"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="cyber-input text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="cyber-btn-primary text-xs px-6 py-2.5 font-bold"
            >
              {uploading ? 'Uploading to R2...' : 'Upload Video to R2'}
            </button>
          </div>
        </form>
      </div>

      {/* Recordings Summary */}
      <div className="cyber-card p-6">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Film className="w-4 h-4 text-teal-400" />
          <span>Storage & Cloudflare R2 Policy</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          All videos are stored in private Cloudflare R2 buckets. Students cannot download raw MP4 files directly; streams are secured through 15-minute signed playback URLs that require verified course enrollment checks and embed dynamic student watermarks.
        </p>
      </div>
    </div>
  );
};
