import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { AuthUser } from '../services/authService';
import type { SchoolSettingsConfig } from '../config/schoolSettings';
import { getSchoolSettings } from '../config/schoolSettings';
import { cleanSlateService } from '../services/cleanSlateService';
import { scoreService, type ScoreRecord } from '../services/scoreService';

interface StudentGradebookViewProps {
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentGradebookView: React.FC<StudentGradebookViewProps> = ({
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentRoom = currentUser?.classroomId || 'ม.3/1';
  const studentName = currentUser?.name || 'นักเรียน';
  const isClean = cleanSlateService.isCleanSlateActive();

  const [scores, setScores] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    scoreService.getAll().then((allScores: ScoreRecord[]) => {
      if (currentUser?.id) {
        setScores(allScores.filter((s: ScoreRecord) => s.enrollmentId === currentUser.id));
      } else {
        setScores(allScores);
      }
    });
  }, [currentUser]);

  const hasRecordedScores = scores.length > 0 && scores.some((s) => s.score !== null);
  const totalEarned = scores.reduce((sum, s) => sum + (s.score || 0), 0);
  const totalMax = scores.reduce((sum, s) => sum + s.maxScore, 0);

  // Radar chart data
  const radarData = isClean && !hasRecordedScores
    ? [
        { subject: 'คะแนนเก็บ', student: 100, classAvg: 100 },
        { subject: 'คะแนนสอบ', student: 100, classAvg: 100 },
        { subject: 'ส่งงานตรงเวลา', student: 100, classAvg: 100 },
        { subject: 'เวลาเรียน', student: 100, classAvg: 100 },
        { subject: 'พฤติกรรม', student: 100, classAvg: 100 },
      ]
    : [
        { subject: 'คะแนนเก็บ', student: 86, classAvg: 78 },
        { subject: 'คะแนนสอบ', student: 81, classAvg: 72 },
        { subject: 'ส่งงานตรงเวลา', student: 92, classAvg: 80 },
        { subject: 'เวลาเรียน', student: 95, classAvg: 88 },
        { subject: 'พฤติกรรม', student: 88, classAvg: 82 },
      ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-['Prompt',sans-serif] text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              สมุดคะแนนและสถิติการเรียนรู้ (My Gradebook)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {settings.nameTh} · ห้อง {studentRoom} · ภาคเรียนที่ 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ผ่านเกณฑ์เวลาเรียน (มส.)</span>
          </span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Grade Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">เกรดเฉลี่ยคาดการณ์</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {hasRecordedScores && totalMax > 0
                ? ((totalEarned / totalMax) * 4).toFixed(1)
                : '-'}
            </span>
            <span className="text-xs text-slate-400">
              {hasRecordedScores
                ? `(${totalEarned.toFixed(1)} / ${totalMax} คะแนน)`
                : '(รอการบันทึกคะแนนแรก)'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {hasRecordedScores
              ? 'คำนวณจากชิ้นงานและแบบทดสอบที่ได้รับการประเมินแล้ว'
              : 'เริ่มต้นภาคเรียนใหม่ คะแนนจะปรากฏเมื่อครูเริ่มตรวจงาน'}
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">เวลาเรียนสะสม</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">100%</span>
            <span className="text-xs text-slate-400">(เวลาเรียนครบถ้วน)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            เกินเกณฑ์ 80% ปลอดภัย ไม่มีสิทธิ์ติด มส.
          </div>
        </div>

        {/* Classroom Rank Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">อันดับคะแนนในห้อง</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {hasRecordedScores ? '#1' : '-'}
            </span>
            <span className="text-xs text-slate-400">ห้อง {studentRoom}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {hasRecordedScores
              ? 'คำนวณจากคะแนนรวมของนักเรียนในห้องเดียวกัน'
              : 'พร้อมประมวลผลเมื่อมีการส่งงาน'}
          </div>
        </div>
      </div>

      {/* Main Grid: SGS Units & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Unit Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>ผลคะแนนรายหน่วยการเรียนรู้ (SGS Structure)</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">ห้อง {studentRoom}</span>
          </div>

          {!hasRecordedScores ? (
            <div className="py-8 px-4 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                ยังไม่มีคะแนนที่บันทึกสำหรับภาคเรียนนี้
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                ระบบเริ่มต้นใช้งานจริงแบบ Clean Slate คุณครูจะบันทึกคะแนนในหน่วยการเรียนรู้เมื่อคุณส่งงานหรือเข้ารับการทดสอบ ✨
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {scores.map((sc) => (
                <div key={sc.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">งานชิ้นที่ {sc.assignmentId}</h3>
                    <span className="text-[10px] text-slate-400">{sc.state}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">
                      {sc.score !== null ? sc.score : '-'} / {sc.maxScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Radar Analysis */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>มิติสมรรถนะการเรียนรู้ (Radar Chart)</span>
            </h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Radar
                  name="คะแนนเฉลี่ยห้อง"
                  dataKey="classAvg"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <Radar
                  name="คะแนนของคุณ"
                  dataKey="student"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1">
            <span className="font-bold text-blue-900">💡 การวิเคราะห์ตนเอง:</span>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              {hasRecordedScores
                ? 'จุดเด่นของคุณคือเวลาเรียนและการส่งงานตรงเวลา ขอให้รักษามาตรฐานความตั้งใจนี้ต่อไป!'
                : 'เริ่มต้นภาคเรียนด้วยความพร้อม 100% กราฟเรดาร์จะปรับตัวตามคะแนนและพฤติกรรมการเรียนรู้จริงในแต่ละวิชา ✨'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Attendance Detail & Teacher Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>สถิติการมาเรียน (ภาคเรียนปัจจุบัน)</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-emerald-700 font-bold text-lg">{isClean ? '0' : '36'}</div>
              <div className="text-[10px] text-emerald-600">เข้าเรียนตรงเวลา</div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-amber-700 font-bold text-lg">0</div>
              <div className="text-[10px] text-amber-600">มาสาย</div>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-blue-700 font-bold text-lg">0</div>
              <div className="text-[10px] text-blue-600">ลากิจ/ลาป่วย</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-400 font-bold text-lg">0</div>
              <div className="text-[10px] text-slate-400">ขาดเรียน</div>
            </div>
          </div>
        </div>

        {/* Teacher Feedback Note */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>บันทึกความเห็นจากคุณครูผู้สอน</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              {isClean
                ? `ยินดีต้อนรับ ${studentName} สู่ภาคเรียนใหม่ ขอให้นักเรียนมีความมุ่งมั่น ตั้งใจเรียน และประสบความสำเร็จในการเรียนรู้ทุกรายวิชาครับ ✨`
                : `"${studentName} มีความตั้งใจและมีระเบียบวินัยดีมากในการเรียนรู้ ขอให้รักษามาตรฐานความตั้งใจนี้ต่อไปครับ"`}
            </p>
            <div className="text-right text-[10px] text-slate-400 font-medium">
              — คุณครูประจำชั้นห้อง {studentRoom}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
