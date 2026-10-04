import React from 'react';
import { Calendar, GraduationCap, Users, FileText } from 'lucide-react';

interface TeacherOverviewStatCardsProps {
  periodsTodayCount?: number;
  totalStudentsCount?: number;
  pendingGradingCount?: number;
  termLabel?: string;
}

export const TeacherOverviewStatCards: React.FC<TeacherOverviewStatCardsProps> = ({
  periodsTodayCount = 4,
  totalStudentsCount = 120,
  pendingGradingCount = 2,
  termLabel = 'ภาคเรียนที่ 1/2569',
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. วันนี้ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#E6F4F1] text-[#0C6D5B] flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">วันนี้</div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
            พฤหัสบดีที่ 8 ตุลาคม 2569
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{termLabel}</div>
        </div>
      </div>

      {/* 2. คาบสอนวันนี้ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#E6F8F2] text-[#0C8050] flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">
            {periodsTodayCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">คาบสอนวันนี้</div>
        </div>
      </div>

      {/* 3. นักเรียนทั้งหมด */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#EBF3FE] text-[#1D63D8] flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">
            {totalStudentsCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            นักเรียนทั้งหมด <span className="text-[11px] text-slate-400">(ม.1-ม.6)</span>
          </div>
        </div>
      </div>

      {/* 4. งานที่ต้องตรวจ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] text-[#D97706] flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">
            {pendingGradingCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">งานที่ต้องตรวจ</div>
        </div>
      </div>
    </div>
  );
};
