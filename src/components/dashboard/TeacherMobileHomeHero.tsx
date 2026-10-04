import React from 'react';
import { ClipboardList } from 'lucide-react';

interface TeacherMobileHomeHeroProps {
  teacherName?: string;
  department?: string;
  pendingCount?: number;
  totalTasksCount?: number;
}

export const TeacherMobileHomeHero: React.FC<TeacherMobileHomeHeroProps> = ({
  teacherName = 'ปัญจพล เกษรัตน์',
  department = 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
  pendingCount = 4,
  totalTasksCount = 12,
}) => {
  return (
    <div className="space-y-3.5 select-none">
      {/* 1. Greeting Hero Banner matching Screen 1 in Mockup */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-slate-50 border border-teal-100/60 p-4 shadow-2xs">
        {/* Subtle school illustration backdrop */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-15 pointer-events-none flex items-end justify-end">
          <svg viewBox="0 0 200 120" className="w-full h-full fill-teal-800">
            <path d="M10 100 L40 60 L70 100 Z M60 100 L90 50 L120 100 Z M110 100 L140 40 L170 100 Z M0 110 L200 110 L200 120 L0 120 Z" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500">สวัสดีครับ</div>
            <h1 className="text-lg font-black text-slate-900 leading-tight truncate">
              {teacherName}
            </h1>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
              ครู {department}
            </p>
          </div>

          <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-teal-100">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
              alt={teacherName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. Green Card: งานที่ต้องทำวันนี้ (จากทั้งหมด 12 รายการ) [4 รายการ] matching Screen 1 */}
      <div className="bg-[#0C6D5B] rounded-2xl p-4 text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-white truncate">
              งานที่ต้องทำวันนี้
            </div>
            <div className="text-[11px] text-teal-100 font-medium truncate mt-0.5">
              จากทั้งหมด {totalTasksCount} รายการ
            </div>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-white text-[#0C6D5B] text-xs font-black shadow-xs shrink-0">
          {pendingCount} รายการ
        </span>
      </div>
    </div>
  );
};
