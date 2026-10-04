import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import {
  teacherCalendarTodoService,
  type DailyTodoItem,
} from '../services/teacherCalendarTodoService';
import { TeacherOverviewStatCards } from '../components/dashboard/TeacherOverviewStatCards';
import { TeacherDailyTodoList } from '../components/dashboard/TeacherDailyTodoList';
import { TeacherMonthCalendarHeatmap } from '../components/dashboard/TeacherMonthCalendarHeatmap';
import { TeacherMobileHomeHero } from '../components/dashboard/TeacherMobileHomeHero';
import { TeacherTaskDetailModal } from '../components/dashboard/TeacherTaskDetailModal';
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
> = ({ onDeepNavigate }) => {
  const [todos, setTodos] = useState<DailyTodoItem[]>(() =>
    teacherCalendarTodoService.getTodayTodos()
  );
  const [selectedTaskForModal, setSelectedTaskForModal] =
    useState<DailyTodoItem | null>(null);
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

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 select-none">
      {/* 1. Mobile Greeting Hero Banner (เฉพาะบนมือถือ < 768px ตรงตาม Screen 1) */}
      <div className="md:hidden">
        <TeacherMobileHomeHero
          teacherName="ปัญจพล เกษรัตน์"
          department="กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ"
          pendingCount={todos.filter((t) => t.status !== 'COMPLETED').length}
          totalTasksCount={12}
        />
      </div>

      {/* 2. แถว 4 การ์ดสถิติด้านบน (แสดงบน Tablet และ Desktop 768px ขึ้นไป ตรงตาม Mockup) */}
      <div className="hidden md:block">
        <TeacherOverviewStatCards
          periodsTodayCount={4}
          totalStudentsCount={120}
          pendingGradingCount={2}
          termLabel="ภาคเรียนที่ 1/2569"
        />
      </div>

      {/* 3. สองคอลัมน์หลัก: To-Do List (ซ้าย ~68%) และ ปฏิทินงาน & ตารางสอน (ขวา ~32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ฝั่งซ้าย: สิ่งที่ต้องทำวันนี้ (To-Do List) */}
        <div className="lg:col-span-8">
          <TeacherDailyTodoList
            todos={todos}
            onActionClick={handleActionClick}
            onToggleTodo={handleToggleTodo}
            onSelectTask={(task) => setSelectedTaskForModal(task)}
          />
        </div>

        {/* ฝั่งขวา: ปฏิทินงาน & ตารางสอน (แสดงตลอดบน Tablet/Desktop) */}
        <div className="lg:col-span-4">
          <TeacherMonthCalendarHeatmap onActionClick={handleActionClick} />
        </div>
      </div>

      {/* Task Detail Modal / Bottom Sheet (ตรงตาม Screen 2 เมื่อกดรายการงาน) */}
      <TeacherTaskDetailModal
        task={selectedTaskForModal}
        isOpen={Boolean(selectedTaskForModal)}
        onClose={() => setSelectedTaskForModal(null)}
        onActionClick={handleActionClick}
      />

      {/* Floating or bottom trigger for full paper ledger if teacher wants complete view */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => {
            setLedgerInitialMode('HOMEWORK_CHECK');
            setIsFullLedgerModalOpen(true);
          }}
          className="text-xs text-slate-500 hover:text-[#0C6D5B] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#0C6D5B]" />
          <span>เปิดสมุด ปพ.5 แบบเต็ม (กระดาษ)</span>
        </button>
      </div>

      {/* Modal เปิดสมุด ปพ.5 แบบกระดาษ */}
      {isFullLedgerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0C6D5B]" />
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
