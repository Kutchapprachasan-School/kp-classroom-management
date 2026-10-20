import React from 'react';
import {
  Home,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  BarChart2,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileHomeScreenProps {
  onNavigate: (view: TeacherViewKey) => void;
  teacherName?: string;
  department?: string;
  avatarUrl?: string;
}

export const TeacherMobileHomeScreen: React.FC<TeacherMobileHomeScreenProps> = ({
  onNavigate,
  teacherName = 'ครูผู้สอน',
  department = 'ครู',
  avatarUrl = '/images/teacher/teacher_avatar.png',
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 font-sans select-none text-slate-800">

      {/* 2. HERO BANNER: สวัสดีครับ + ครูปัญจพล + ภาพโรงเรียนและอนิเมะ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 p-4 shadow-sm text-white">
        {/* Background School Illustration */}
        <div
          className="absolute inset-0 bg-cover bg-right opacity-30 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('/images/teacher/hero_banner.png')` }}
        />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-extrabold text-blue-50 mb-1">
              สวัสดีครับ
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
              alt="Anime Teacher Mascot"
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = avatarUrl;
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. FOUR QUICK STAT CARDS (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Card 1: ทั้งหมด 5 ห้องเรียน */}
        <button
          type="button"
          onClick={() => onNavigate('classrooms')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ทั้งหมด</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            5 ห้องเรียน
          </div>
        </button>

        {/* Card 2: งานที่ต้องตรวจ 12 รายการ */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-grading-list')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-rose-300 transition-all cursor-pointer relative group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              1
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-500">งานที่ต้องตรวจ</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            12 รายการ
          </div>
        </button>

        {/* Card 3: ยังไม่ส่งคะแนน 2 รายการ */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-room-scores')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ยังไม่ส่งคะแนน</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            2 รายการ
          </div>
        </button>

        {/* Card 4: ครบกำหนดวันนี้ 3 รายการ */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-calendar')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs text-left hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-500">ครบกำหนดวันนี้</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            3 รายการ
          </div>
        </button>
      </div>

      {/* 4. SECTION: งานที่ต้องดำเนินการด่วน */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
            งานที่ต้องดำเนินการด่วน
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('mobile-grading-list')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 1: ตรวจงานนักเรียน */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-grading-list')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                ตรวจงานนักเรียน
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                มี 12 รายการที่ต้องตรวจ
              </p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0">
            12
          </span>
        </button>

        {/* Card 2: ส่งคะแนน */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-room-scores')}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                ส่งคะแนน
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                มี 2 ห้องเรียนที่ยังไม่ส่งคะแนน
              </p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0">
            2
          </span>
        </button>

        {/* Card 3: มอบหมายงาน */}
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
                มอบหมายงาน
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                มี 3 งานที่ยังไม่ได้มอบหมาย
              </p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0">
            3
          </span>
        </button>
      </div>
    </div>
  );
};
