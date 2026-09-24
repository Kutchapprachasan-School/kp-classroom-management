import React from 'react';
import { Sparkles, LogOut } from 'lucide-react';

interface StudentHeaderProps {
  onExit: () => void;
  totalXp?: number;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExit,
  totalXp = 0,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>ห้องเรียนของฉัน</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">พื้นที่ของฉัน</span>
      </div>

      {/* Right: Term, XP Badge, Exit */}
      <div className="flex items-center gap-4 text-xs font-medium">
        <span className="text-slate-500">ภาคเรียนที่ 1 / 2569</span>

        {/* XP Star Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{totalXp} XP</span>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
          title="กลับสู่มุมมองครู"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออก</span>
        </button>
      </div>
    </header>
  );
};
