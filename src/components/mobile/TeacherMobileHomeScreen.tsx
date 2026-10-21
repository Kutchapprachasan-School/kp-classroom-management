import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Calendar,
  CheckCircle2,
  FileText,
  BarChart2,
  ClipboardList,
  ChevronRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import { authService } from '../../services/authService';
import { getLocalClassrooms } from '../../services/classroomService';
import { teacherCourseAssignmentService } from '../../services/teacherCourseAssignmentService';
import { sgsRosterAndSubmissionService } from '../../services/sgsRosterAndSubmissionService';
import { academicCalendarService } from '../../services/academicCalendarService';
import { getBangkokTodayString } from '../../utils/timetableDateUtils';

interface TeacherMobileHomeScreenProps {
  onNavigate: (view: TeacherViewKey) => void;
  teacherName?: string;
  department?: string;
  avatarUrl?: string;
}

export const TeacherMobileHomeScreen: React.FC<TeacherMobileHomeScreenProps> = ({
  onNavigate,
  teacherName: propTeacherName,
  department: propDepartment,
  avatarUrl: propAvatarUrl,
}) => {
  const currentUser = authService.getCurrentUser();
  const teacherName = propTeacherName || currentUser?.name || 'ครูผู้สอน';
  const department =
    propDepartment ||
    currentUser?.subjectGroup ||
    currentUser?.position ||
    (currentUser?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'กลุ่มสาระการเรียนรู้');
  const avatarUrl =
    propAvatarUrl || currentUser?.avatarUrl || '/images/teacher/teacher_avatar.png';

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleSync = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('kp-sgs-roster-updated', handleSync);
    window.addEventListener('kp-submissions-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('kp-sgs-roster-updated', handleSync);
      window.removeEventListener('kp-submissions-sync', handleSync);
    };
  }, []);

  // 1. Real Classrooms Count
  const classroomCount = useMemo(() => {
    try {
      return getLocalClassrooms().length;
    } catch {
      return 0;
    }
  }, [refreshTrigger]);

  // 2. Real Grading Queue & Pending Count
  const { pendingGradingCount, gradedCount } = useMemo(() => {
    try {
      const queue = teacherCourseAssignmentService.getGradingQueue();
      const pending = queue.filter((item) => item.status !== 'GRADED').length;
      const graded = queue.filter((item) => item.status === 'GRADED').length;
      return {
        pendingGradingCount: pending,
        gradedCount: graded,
      };
    } catch {
      return { pendingGradingCount: 0, gradedCount: 0 };
    }
  }, [refreshTrigger]);

  // 3. Real Total Term Assignments Assigned
  const totalAssignmentsCount = useMemo(() => {
    try {
      return sgsRosterAndSubmissionService.getTermAssignments().length;
    } catch {
      return 0;
    }
  }, [refreshTrigger]);

  // 4. Current Term Info
  const currentTermLabel = useMemo(() => {
    try {
      const active = academicCalendarService.getActiveTerm();
      if (active) return `${active.termName}/${active.year}`;
    } catch {
      // fallback
    }
    return 'ภาคเรียนปัจจุบัน';
  }, []);

  const todayStr = useMemo(() => getBangkokTodayString(), []);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 font-sans select-none text-slate-800">
      {/* 1. HERO BANNER: สวัสดีครับ + ชื่อครู + รูปภาพ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 p-4 shadow-sm text-white">
        <div
          className="absolute inset-0 bg-cover bg-right opacity-25 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('/images/teacher/hero_banner.png')` }}
        />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-extrabold text-blue-50 mb-1">
              สวัสดีครับ • {currentTermLabel}
            </span>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
              {teacherName}
            </h2>
            <p className="text-[11px] text-blue-100 font-medium truncate mt-0.5">
              {department}
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative -mr-1">
            <img
              src="/images/teacher/lesson_hero_teacher.png"
              alt="Mascot"
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = avatarUrl;
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. FOUR QUICK STAT CARDS (2x2 Grid) - Real Dynamic Numbers */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Card 1: ห้องเรียนทั้งหมด */}
        <button
          type="button"
          onClick={() => onNavigate('classrooms')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ห้องเรียนที่สอน</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            {classroomCount} ห้องเรียน
          </div>
        </button>

        {/* Card 2: งานที่ต้องตรวจ */}
        <button
          type="button"
          onClick={() => onNavigate('grading-queue')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-rose-300 transition-all cursor-pointer relative group"
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                pendingGradingCount > 0
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            {pendingGradingCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {pendingGradingCount}
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold text-slate-500">งานที่ต้องตรวจ</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            {pendingGradingCount} รายการ
          </div>
        </button>

        {/* Card 3: ตรวจเสร็จแล้ว */}
        <button
          type="button"
          onClick={() => onNavigate('grading-queue')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ตรวจเสร็จแล้ว</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            {gradedCount} ชิ้นงาน
          </div>
        </button>

        {/* Card 4: ชิ้นงานในเทอมนี้ */}
        <button
          type="button"
          onClick={() => onNavigate('assignments')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ชิ้นงานในเทอมนี้</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            {totalAssignmentsCount} งาน
          </div>
        </button>
      </div>

      {/* 3. SECTION: งานที่ต้องดำเนินการ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
            งานที่ต้องดำเนินการ
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('grading-queue')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>ดูคิวตรวจงาน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action 1: คิวตรวจงานนักเรียน */}
        <button
          type="button"
          onClick={() => onNavigate('grading-queue')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                pendingGradingCount > 0
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                คิวตรวจงานนักเรียน
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {pendingGradingCount > 0
                  ? `มี ${pendingGradingCount} รายการที่รอดำเนินการตรวจ`
                  : 'ตรวจครบทุกรายการที่ส่งเข้ามาแล้ว'}
              </p>
            </div>
          </div>
          {pendingGradingCount > 0 ? (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0">
              {pendingGradingCount}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>เรียบร้อย</span>
            </span>
          )}
        </button>

        {/* Action 2: ผลการเรียน ปพ.5 (Score Matrix) */}
        <button
          type="button"
          onClick={() => onNavigate('score-matrix')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                ผลการเรียน ปพ.5 (Score Matrix)
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                ตรวจสอบและตัดเกรด 4 ช่วงคะแนนตามระเบียบ สพฐ.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Action 3: มอบหมายงานใหม่ */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-create-assignment')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                มอบหมายงานใหม่
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                สั่งใบงาน การบ้าน หรือแบบทดสอบลง ปพ.5
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Action 4: เช็คชื่อเวลาเรียน */}
        <button
          type="button"
          onClick={() => onNavigate('classroom-attendance')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                เช็คชื่อเข้าเรียน / กิจกรรมโฮมรูม
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                บันทึกเวลาเรียน ประจำวันที่ {todayStr}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </div>
  );
};
