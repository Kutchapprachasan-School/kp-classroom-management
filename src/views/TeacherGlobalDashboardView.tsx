import React, { useState } from 'react';
import {
  UserCheck,
  Users,
  FileSpreadsheet,
  PenTool,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import {
  PaperRegisterLedger,
  type PaperLedgerMode,
} from '../components/teacher/PaperRegisterLedger';

interface TeacherGlobalDashboardViewProps {
  onNavigateToClass: (classId: string) => void;
  onNavigateToAttendance: () => void;
  onNavigateToReadiness: () => void;
  onNavigateToAcademicYear?: () => void;
  onNavigateToCourses?: () => void;
  onNavigateToMorningAssembly?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherGlobalDashboardView: React.FC<
  TeacherGlobalDashboardViewProps
> = ({
  onNavigateToReadiness,
  onDeepNavigate,
}) => {
  const [dashboardLedgerMode, setDashboardLedgerMode] =
    useState<PaperLedgerMode>('HOMEWORK_CHECK');

  return (
    <div className="max-w-6xl mx-auto space-y-3 pb-20 select-none">
      {/* 1. ปุ่มไอคอนลัด 6 งานหลัก (ไม่มีกล่องคำอธิบายรกตา กดไอคอนแล้วทำงานได้ทันที) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => setDashboardLedgerMode('MORNING_ASSEMBLY')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
            dashboardLedgerMode === 'MORNING_ASSEMBLY'
              ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              dashboardLedgerMode === 'MORNING_ASSEMBLY'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">เช็คแถวเช้า</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardLedgerMode('CLASS_ATTENDANCE')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
            dashboardLedgerMode === 'CLASS_ATTENDANCE'
              ? 'bg-[#1967D2] text-white border-blue-700 ring-2 ring-blue-400'
              : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              dashboardLedgerMode === 'CLASS_ATTENDANCE'
                ? 'bg-blue-800 text-white'
                : 'bg-[#1967D2] text-white'
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">เช็คชื่อสอน</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardLedgerMode('HOMEWORK_CHECK')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
            dashboardLedgerMode === 'HOMEWORK_CHECK'
              ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400'
              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-950'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              dashboardLedgerMode === 'HOMEWORK_CHECK'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">ตรวจการบ้าน</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardLedgerMode('SCORE_GRADEBOOK')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
            dashboardLedgerMode === 'SCORE_GRADEBOOK'
              ? 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400'
              : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-950'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              dashboardLedgerMode === 'SCORE_GRADEBOOK'
                ? 'bg-teal-800 text-white'
                : 'bg-teal-600 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">ลงคะแนน ปพ.5</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onDeepNavigate?.({
              view: 'home-visit',
            });
          }}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">เยี่ยมบ้าน</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToReadiness}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">ส่งเกรด SGS</span>
        </button>
      </div>

      {/* 2. สมุด ปพ.5 แบบกระดาษ (เห็นภาพรวมกว้างๆ ทั้งห้อง สลับ เช็คแถว / เช็คชื่อเรียน / ตรวจการบ้าน / ลงคะแนน ได้ในแผ่นเดียว) */}
      <PaperRegisterLedger
        initialMode={dashboardLedgerMode}
        onModeChange={setDashboardLedgerMode}
      />
    </div>
  );
};
