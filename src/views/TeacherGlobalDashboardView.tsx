import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import {
  teacherCalendarTodoService,
  type DailyTodoItem,
} from '../services/teacherCalendarTodoService';
import { TeacherDailyTodoList } from '../components/dashboard/TeacherDailyTodoList';
import { TeacherMonthCalendarHeatmap } from '../components/dashboard/TeacherMonthCalendarHeatmap';
import { TeacherUpcomingMilestones } from '../components/dashboard/TeacherUpcomingMilestones';
import {
  PaperRegisterLedger,
  type PaperLedgerMode,
} from '../components/teacher/PaperRegisterLedger';

interface TeacherGlobalDashboardViewProps {
  onNavigateToClass?: (classId: string) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToReadiness?: () => void;
  onNavigateToAcademicYear?: () => void;
  onNavigateToCourses?: () => void;
  onNavigateToMorningAssembly?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherGlobalDashboardView: React.FC<
  TeacherGlobalDashboardViewProps
> = ({
  onDeepNavigate,
}) => {
  const [todos, setTodos] = useState<DailyTodoItem[]>(() =>
    teacherCalendarTodoService.getTodayTodos()
  );
  const [isFullLedgerModalOpen, setIsFullLedgerModalOpen] = useState(false);
  const [ledgerInitialMode, setLedgerInitialMode] =
    useState<PaperLedgerMode>('HOMEWORK_CHECK');

  useEffect(() => {
    const handleUpdate = () => {
      setTodos([...teacherCalendarTodoService.getTodayTodos()]);
    };
    window.addEventListener('kp-todo-updated', handleUpdate);
    return () => window.removeEventListener('kp-todo-updated', handleUpdate);
  }, []);

  const handleToggleTodo = (id: string) => {
    teacherCalendarTodoService.toggleTodoComplete(id);
    setTodos([...teacherCalendarTodoService.getTodayTodos()]);
  };

  const handleActionClick = (payload: CrossViewNavigationPayload) => {
    onDeepNavigate?.(payload);
  };

  const completedCount = todos.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = todos.length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 select-none">
      {/* 1. Header สรุปภาพรวมประจำวัน */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold">
              ศูนย์ปฏิบัติการครูรายวัน
            </span>
            <span className="text-xs text-slate-300">
              พฤหัสบดีที่ 8 ตุลาคม 2569 • ภาคเรียนที่ 1/2569
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold mt-1 text-white tracking-tight">
            ยินดีต้อนรับสู่ระบบจัดการชั้นเรียน โรงเรียนกุดจับประชาสรรค์
          </h1>
          <p className="text-xs text-teal-100/80 mt-0.5">
            วันนี้คุณครูทำงานสำเร็จไปแล้ว {completedCount} จาก {totalCount} งาน
            {completedCount === totalCount ? ' (ครบถ้วนสมบูรณ์แล้วยอดเยี่ยมมากครับ!)' : ' • มีงานที่ต้องดำเนินการต่อ'}
          </p>
        </div>

        {/* ปุ่มลัดเปิดสมุด ปพ.5 แบบเต็ม (กระดาษ) เผื่อต้องการตรวจภาพรวมทั้งห้อง */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLedgerInitialMode('HOMEWORK_CHECK');
              setIsFullLedgerModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-300" />
            <span>เปิดสมุด ปพ.5 แบบกระดาษ</span>
          </button>
        </div>
      </div>

      {/* 2. Grid สองคอลัมน์: To-Do List ฝั่งซ้าย และ ปฏิทินตรวจงานค้าง ฝั่งขวา */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* To-Do List (7 คอลัมน์) */}
        <div className="lg:col-span-7">
          <TeacherDailyTodoList
            todos={todos}
            onActionClick={handleActionClick}
            onToggleTodo={handleToggleTodo}
          />
        </div>

        {/* ปฏิทินตรวจงานค้าง (5 คอลัมน์) */}
        <div className="lg:col-span-5">
          <TeacherMonthCalendarHeatmap onActionClick={handleActionClick} />
        </div>
      </div>

      {/* 3. แถบงานสำคัญที่กำลังจะมาถึง (สัปดาห์นี้ / เดือนนี้ / เทอมนี้) */}
      <TeacherUpcomingMilestones onActionClick={handleActionClick} />

      {/* Modal เปิดสมุด ปพ.5 แบบกระดาษ (เมื่อต้องการเห็นภาพรวมกว้างๆ ทั้งห้องแบบเดิม) */}
      {isFullLedgerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  สมุด ปพ.5 แบบกระดาษ (ภาพรวมทั้งห้อง)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFullLedgerModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <PaperRegisterLedger
                initialMode={ledgerInitialMode}
                onModeChange={setLedgerInitialMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
