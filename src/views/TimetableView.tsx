import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  Users,
  AlertCircle,
  ClipboardList,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  CheckSquare,
  AlertTriangle,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';

import {
  type TimetableColorTheme,
  type TimetableMatrixSlot,
  type TaskWidgetItem,
  type CalendarEventItem,
  type WeekDayInfo,
  type ComputedWeekInfo,
  computeWeekInfo,
  PERIOD_DEFINITIONS,
  INITIAL_MATRIX_SLOTS,
} from '../utils/timetableDateUtils';

export type {
  TimetableColorTheme,
  TimetableMatrixSlot,
  TaskWidgetItem,
  CalendarEventItem,
  WeekDayInfo,
  ComputedWeekInfo,
};
export { computeWeekInfo, PERIOD_DEFINITIONS, INITIAL_MATRIX_SLOTS };

interface TimetableViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
  onNavigateToAssignments?: () => void;
  onNavigateToCalendar?: () => void;
}

const INITIAL_TASKS: TaskWidgetItem[] = [
  {
    id: 'task-1',
    title: 'ส่งคะแนนกลางภาค (ม.3)',
    dueDate: 'ภายใน 10 ต.ค. 2569',
    priority: 'URGENT',
    priorityLabel: 'ด่วน',
    iconType: 'red',
  },
  {
    id: 'task-2',
    title: 'ตรวจข้อสอบปลายภาค (ม.3)',
    dueDate: 'ภายใน 5 ต.ค. 2569',
    priority: 'NORMAL',
    priorityLabel: 'ปกติ',
    iconType: 'green',
  },
  {
    id: 'task-3',
    title: 'บันทึกคะแนนกลางภาค (ม.3)',
    dueDate: 'ภายใน 10 ต.ค. 2569',
    priority: 'NORMAL',
    priorityLabel: 'ปกติ',
    iconType: 'purple',
  },
];

const INITIAL_EVENTS: CalendarEventItem[] = [
  {
    id: 'event-1',
    title: 'กิจกรรมวันภาษาอังกฤษ (2 ต.ค. 2569)',
    time: 'เริ่ม 08:30 น.',
    bulletColor: 'amber',
  },
  {
    id: 'event-2',
    title: 'แข่งขันกีฬา - การแข่งขันม.ต้น',
    time: '1 ต.ค. 2569 10:15 น.',
    bulletColor: 'blue',
  },
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  onDeepNavigate,
  onNavigateToAssignments,
  onNavigateToCalendar,
}) => {
  // ------------------------------------------
  // State
  // ------------------------------------------
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [matrixSlots, setMatrixSlots] =
    useState<TimetableMatrixSlot[]>(INITIAL_MATRIX_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState<TimetableMatrixSlot | null>(
    null
  );
  const [activeSummaryTab, setActiveSummaryTab] = useState<'WEEK' | 'MONTH'>(
    'WEEK'
  );
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>(
    'ALL'
  );
  const [mobileDay, setMobileDay] = useState<string>('พฤหัสบดี');
  const [mobileViewMode, setMobileViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modals state
  const [isDetailSummaryModalOpen, setIsDetailSummaryModalOpen] =
    useState<boolean>(false);
  const [selectedTaskDetail, setSelectedTaskDetail] =
    useState<TaskWidgetItem | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] =
    useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Student Roll-Call State inside Modal
  const studentsList = [
    { no: 1, code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์' },
    { no: 2, code: '45102', name: 'ด.ช. ทัตธน คำฝั้น' },
    { no: 3, code: '45105', name: 'ด.ญ. กมลชนก เลิศวิไล' },
    { no: 4, code: '45109', name: 'ด.ช. ณัฐวุฒิ สายทอง' },
    { no: 5, code: '45112', name: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์' },
    { no: 6, code: '45115', name: 'ด.ช. อัศวิน วนเกษตรกุล' },
    { no: 7, code: '45118', name: 'ด.ญ. อคิราห์ วิรากร' },
  ];

  const buildInitialAttendance = (): Record<
    number,
    'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  > => {
    const initial: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(
        stu.name,
        stu.code
      );
      initial[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    return initial;
  };

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>
  >(buildInitialAttendance);
  const [overrideConfirmConflicts, setOverrideConfirmConflicts] = useState<
    Array<{ no: number; name: string; leaveReason: string; chosenStatus: string }>
  >([]);

  // Dynamically computed week information for current weekOffset
  const weekInfo = useMemo(() => computeWeekInfo(weekOffset), [weekOffset]);

  // ------------------------------------------
  // Calculated Counts (Reactive to Teacher Roll-Call)
  // Baseline matching Mockup:
  // - ยังไม่ได้เช็ค (สัปดาห์นี้): 2 รายการ
  // - ยังไม่ได้เช็ค (เดือนนี้): 5 รายการ
  // - เช็คแล้ว (สัปดาห์นี้): 8 รายการ
  // ------------------------------------------
  const initiallyUncheckedIds = useMemo(
    () =>
      new Set(
        INITIAL_MATRIX_SLOTS.filter(
          (s) => !s.isFreePeriod && !s.isConducted && s.category !== 'free'
        ).map((s) => s.id)
      ),
    []
  );

  // Number of slots that the teacher has newly marked as conducted in this session
  const newlyConductedCount = useMemo(() => {
    return matrixSlots.filter(
      (s) => initiallyUncheckedIds.has(s.id) && s.isConducted
    ).length;
  }, [matrixSlots, initiallyUncheckedIds]);

  // Reactive counts reflecting user actions while starting exactly at the mockup values (2 and 8)
  const uncheckedWeekCount = Math.max(0, 2 - newlyConductedCount);
  const uncheckedMonthCount = Math.max(0, 5 - newlyConductedCount);
  const checkedWeekCount = 8 + newlyConductedCount;

  // Active list of pending slots (for modal and filtering)
  const pendingWeekSlots = matrixSlots.filter(
    (s) => !s.isFreePeriod && !s.isConducted && s.category !== 'free'
  );

  // ------------------------------------------
  // Actions
  // ------------------------------------------
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenSlot = (slot: TimetableMatrixSlot) => {
    if (slot.isFreePeriod) {
      showToast('คาบนี้เป็นคาบว่าง ไม่มีภาระงานสอน');
      return;
    }
    setAttendanceRecords(buildInitialAttendance());
    setOverrideConfirmConflicts([]);
    setSelectedSlot(slot);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(
        stu.name,
        stu.code
      );
      updated[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    setAttendanceRecords(updated);
    setOverrideConfirmConflicts([]);
  };

  const handleSaveAttendance = () => {
    if (!selectedSlot) return;

    const statusLabelMap = {
      PRESENT: 'มาเรียน',
      ABSENT: 'ขาดเรียน',
      LATE: 'มาสาย',
      LEAVE: 'ลา',
    };
    const conflicts: Array<{
      no: number;
      name: string;
      leaveReason: string;
      chosenStatus: string;
    }> = [];

    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(
        stu.name,
        stu.code
      );
      const chosen = attendanceRecords[stu.no] || 'PRESENT';
      if (morning.hasApprovedLeave && chosen !== 'LEAVE') {
        conflicts.push({
          no: stu.no,
          name: stu.name,
          leaveReason: morning.leaveReason || 'อนุมัติใบลาแล้ว',
          chosenStatus: statusLabelMap[chosen],
        });
      }
    }

    if (conflicts.length > 0) {
      setOverrideConfirmConflicts(conflicts);
      return;
    }

    // Mark slot as conducted
    setMatrixSlots((prev) =>
      prev.map((s) => (s.id === selectedSlot.id ? { ...s, isConducted: true } : s))
    );
    setSelectedSlot(null);
    showToast(
      `บันทึกการเช็คชื่อ ${selectedSlot.subjectCode} (${selectedSlot.room}) สำเร็จแล้ว`
    );
  };

  const handleTaskClick = (task: TaskWidgetItem) => {
    setSelectedTaskDetail(task);
  };

  const handleCompleteTask = (_taskId: string) => {
    setSelectedTaskDetail(null);
    showToast('ดำเนินการและอัปเดตสถานะงานเรียบร้อยแล้ว');
  };

  // Helper to get slot for a cell
  const getSlot = (day: string, period: number) => {
    return matrixSlots.find((s) => s.day === day && s.period === period);
  };

  // Color card styling based on theme
  const getSlotStyle = (
    theme: TimetableColorTheme,
    _isConducted?: boolean,
    _isToday?: boolean
  ) => {
    switch (theme) {
      case 'pink':
        return 'bg-[#FDF2F8] border-[#FCE7F3] hover:border-pink-300 text-[#831843]';
      case 'teal':
        return 'bg-[#F0FDFA] border-[#CCFBF1] hover:border-teal-300 text-[#134E4A]';
      case 'purple':
        return 'bg-[#FAF5FF] border-[#F3E8FF] hover:border-purple-300 text-[#581C87]';
      case 'green':
        return 'bg-[#F0FDF4] border-[#DCFCE7] hover:border-emerald-300 text-[#14532D]';
      case 'blue':
        return 'bg-[#EFF6FF] border-[#DBEAFE] hover:border-blue-300 text-[#1E3A8A]';
      case 'amber':
        return 'bg-[#FFFBEB] border-[#FEF3C7] hover:border-amber-300 text-[#78350F]';
      case 'free':
        return 'bg-blue-50/40 border-blue-100/70 text-slate-400 hover:border-blue-200';
      default:
        return 'bg-white border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* ========================================================
          1. PAGE HEADER matching Mockup
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              ตารางสอน / ภาระงานวันนี้
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              ตรวจสอบรายวิชาที่สอน และงานที่ต้องดำเนินการในวันนี้
            </p>
          </div>
        </div>

        {/* Unified Week Selector Toolbar matching Mockup Image */}
        <div className="flex items-center p-1 rounded-2xl border border-slate-200/90 bg-white shadow-2xs self-start md:self-auto gap-1">
          {/* Previous Week */}
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="w-8 h-8 rounded-xl hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
            title="สัปดาห์ก่อนหน้า"
            aria-label="สัปดาห์ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Date range pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/40 text-xs font-semibold text-slate-800 border border-blue-100/60">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="whitespace-nowrap">{weekInfo.dateRangeLabel}</span>
          </div>

          {/* Week number pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200/60">
            <CalendarDays className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="whitespace-nowrap">{`สัปดาห์ที่ ${weekInfo.weekNumber}`}</span>
          </div>

          {/* Next Week */}
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="w-8 h-8 rounded-xl hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
            title="สัปดาห์ถัดไป"
            aria-label="สัปดาห์ถัดไป"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TOP 3 ATTENDANCE STATUS CARDS matching Mockup
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: ยังไม่ได้เช็ค (สัปดาห์นี้) */}
        <div
          onClick={() => {
            setFilterMode((prev) => (prev === 'UNCHECKED' ? 'ALL' : 'UNCHECKED'));
            showToast(
              filterMode === 'UNCHECKED'
                ? 'แสดงคาบเรียนทั้งหมด'
                : 'กรองแสดงเฉพาะคาบที่ยังไม่ได้เช็ค'
            );
          }}
          className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
            filterMode === 'UNCHECKED'
              ? 'bg-[#FEE2E2] border-rose-300 shadow-xs ring-2 ring-rose-300'
              : 'bg-[#FEF2F2] border-[#FEE2E2] hover:border-rose-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-rose-600 block">
                ยังไม่ได้เช็ค (สัปดาห์นี้)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600">
                  {uncheckedWeekCount}
                </span>
                <span className="text-xs font-semibold text-rose-600">รายการ</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

        {/* Card 2: ยังไม่ได้เช็ค (เดือนนี้) */}
        <div
          onClick={() => {
            setActiveSummaryTab('MONTH');
            setIsDetailSummaryModalOpen(true);
          }}
          className="p-4 sm:p-4.5 rounded-2xl border bg-[#FFFBEB] border-[#FEF3C7] hover:border-amber-200 shadow-2xs transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-amber-700 block">
                ยังไม่ได้เช็ค (เดือนนี้)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
                  {uncheckedMonthCount}
                </span>
                <span className="text-xs font-semibold text-amber-700">รายการ</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

        {/* Card 3: เช็คแล้ว (สัปดาห์นี้) */}
        <div
          onClick={() => {
            setFilterMode((prev) => (prev === 'CHECKED' ? 'ALL' : 'CHECKED'));
          }}
          className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
            filterMode === 'CHECKED'
              ? 'bg-[#DCFCE7] border-emerald-300 shadow-xs ring-2 ring-emerald-300'
              : 'bg-[#F0FDF4] border-[#DCFCE7] hover:border-emerald-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-emerald-700 block">
                เช็คแล้ว (สัปดาห์นี้)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                  {checkedWeekCount}
                </span>
                <span className="text-xs font-semibold text-emerald-700">รายการ</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailSummaryModalOpen(true);
            }}
            className="px-3 py-1 rounded-full text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 shadow-2xs transition-colors shrink-0 flex items-center gap-0.5"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ========================================================
          3. MAIN SECTION: Timetable Matrix (Left) + 3 Widgets (Right)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* ----------------------------------------------------
            LEFT 8-COLS: Weekly Timetable Matrix Table
            ---------------------------------------------------- */}
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4 overflow-hidden">
          {/* Mobile Day Selector Tabs (< md) with View Switcher */}
          <div className="flex md:hidden flex-col gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">เลือกวันแสดงผล:</div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('CARDS')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    mobileViewMode === 'CARDS'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 inline mr-1" />
                  รายวัน
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewMode('TABLE')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    mobileViewMode === 'TABLE'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
                  ตารางรวม
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {weekInfo.days.map((d) => {
                const isSelected = mobileDay === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setMobileDay(d.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : d.isToday
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.key} {d.isToday && '(วันนี้)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Dedicated Day Cards View (< md when mode is CARDS) */}
          <div className={`md:hidden ${mobileViewMode === 'CARDS' ? 'block' : 'hidden'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  ตารางสอนวัน{mobileDay}{' '}
                  {weekInfo.days.find((d) => d.key === mobileDay)?.dateLabel}
                </span>
              </span>
              {weekInfo.days.find((d) => d.key === mobileDay)?.isToday && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                  วันนี้
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {PERIOD_DEFINITIONS.map((periodDef) => {
                const slot = getSlot(mobileDay, periodDef.period);
                if (!slot) {
                  return (
                    <div
                      key={periodDef.period}
                      className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400"
                    >
                      <span className="font-semibold">
                        คาบที่ {periodDef.period} ({periodDef.timeRange})
                      </span>
                      <span>— ไม่มีคาบสอน —</span>
                    </div>
                  );
                }

                if (slot.isFreePeriod) {
                  return (
                    <div
                      key={periodDef.period}
                      className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-600">
                          คาบที่ {periodDef.period} ({periodDef.timeRange})
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">คาบว่าง</div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        คาบว่าง
                      </span>
                    </div>
                  );
                }

                const cardStyle = getSlotStyle(slot.colorTheme, slot.isConducted);

                return (
                  <div
                    key={periodDef.period}
                    onClick={() => handleOpenSlot(slot)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${cardStyle} hover:shadow-xs`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-semibold opacity-70">
                          คาบที่ {periodDef.period} • {periodDef.timeRange}
                        </div>
                        <div className="font-extrabold text-xs sm:text-sm mt-0.5">
                          {slot.subjectCode} {slot.room}
                        </div>
                        {slot.subjectName && (
                          <div className="text-xs font-medium opacity-85 mt-0.5">
                            {slot.subjectName}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {slot.isConducted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>เช็คแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ยังไม่เช็ค</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Matrix Table with Horizontal Scroll (Desktop always, Mobile when in TABLE mode) */}
          <div
            className={`overflow-x-auto -mx-4 sm:mx-0 ${
              mobileViewMode === 'CARDS' ? 'hidden md:block' : 'block'
            }`}
          >
            <table className="w-full text-center text-xs border-collapse min-w-[700px]">
              <thead>
                <tr>
                  {/* Column 1: Time / Day */}
                  <th className="py-3 px-3 w-28 text-left text-slate-500 font-bold border-b border-slate-200 align-middle">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>เวลา / วัน</span>
                    </div>
                  </th>

                  {/* Columns 2-6: Days */}
                  {weekInfo.days.map((dayObj) => {
                    if (dayObj.isToday) {
                      // ACTIVE THURSDAY HEADER: SOLID BRIGHT BLUE WITH ROUNDED TOP CORNERS
                      return (
                        <th
                          key={dayObj.key}
                          className="py-3 px-2 bg-blue-600 text-white font-bold rounded-t-xl min-w-[120px] shadow-xs"
                        >
                          <div className="text-xs sm:text-sm font-extrabold tracking-wide">
                            {dayObj.key}
                          </div>
                          <div className="text-[11px] text-blue-100 font-normal mt-0.5">
                            {dayObj.dateLabel}
                          </div>
                        </th>
                      );
                    }

                    return (
                      <th
                        key={dayObj.key}
                        className="py-3 px-2 text-slate-700 font-bold border-b border-slate-200 min-w-[110px]"
                      >
                        <div className="text-xs sm:text-sm font-bold text-slate-800">
                          {dayObj.key}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {dayObj.dateLabel}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {PERIOD_DEFINITIONS.map((periodDef, pIndex) => {
                  const isLastPeriod = pIndex === PERIOD_DEFINITIONS.length - 1;

                  return (
                    <tr key={periodDef.period} className="transition-colors">
                      {/* Time cell */}
                      <td className="py-3.5 px-3 text-left font-medium text-slate-500 align-middle bg-slate-50/40">
                        <div className="font-bold text-[11px] text-slate-700">
                          {periodDef.timeRange}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          ({periodDef.label})
                        </div>
                      </td>

                      {/* Day cells */}
                      {weekInfo.days.map((dayObj) => {
                        const slot = getSlot(dayObj.key, periodDef.period);
                        const isToday = dayObj.isToday;

                        // Highlight filter matching
                        const isDimmed =
                          filterMode === 'UNCHECKED'
                            ? slot && slot.isConducted
                            : filterMode === 'CHECKED'
                            ? slot && !slot.isConducted && !slot.isFreePeriod
                            : false;

                        // Active Thursday column enclosure
                        const columnHighlightClass = isToday
                          ? `bg-blue-50/20 border-x border-blue-200/60 ${
                              isLastPeriod ? 'rounded-b-xl border-b' : ''
                            }`
                          : '';

                        if (!slot) {
                          return (
                            <td
                              key={dayObj.key}
                              className={`p-2 align-middle text-slate-300 font-medium ${columnHighlightClass}`}
                            >
                              —
                            </td>
                          );
                        }

                        // Free period slot
                        if (slot.isFreePeriod) {
                          return (
                            <td
                              key={dayObj.key}
                              className={`p-1.5 align-middle ${columnHighlightClass}`}
                            >
                              <div className="p-2.5 rounded-xl border border-blue-100/70 bg-blue-50/40 text-center text-slate-400 min-h-[72px] flex flex-col justify-center items-center">
                                <span className="text-[11px] font-bold text-slate-500">
                                  คาบว่าง
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  —
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // Subject period card
                        const cardStyle = getSlotStyle(
                          slot.colorTheme,
                          slot.isConducted,
                          isToday
                        );

                        return (
                          <td
                            key={dayObj.key}
                            onClick={() => handleOpenSlot(slot)}
                            className={`p-1.5 align-middle cursor-pointer group ${columnHighlightClass}`}
                          >
                            <div
                              className={`p-2.5 rounded-xl border text-left transition-all relative min-h-[76px] flex flex-col justify-between ${cardStyle} ${
                                isDimmed
                                  ? 'opacity-30'
                                  : 'hover:shadow-xs group-hover:-translate-y-0.5'
                              } ${
                                isToday && !slot.isConducted
                                  ? 'ring-1 ring-amber-300/80 shadow-2xs'
                                  : ''
                              }`}
                            >
                              {/* Line 1: Code and Room */}
                              <div className="flex items-start gap-1 font-extrabold text-[11px] leading-tight">
                                <BookOpen className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
                                <span className="truncate">
                                  {slot.subjectCode} {slot.room}
                                </span>
                              </div>

                              {/* Line 2: Subject title if present */}
                              {slot.subjectName && (
                                <div className="text-[10px] font-medium opacity-80 truncate mt-0.5 pl-4">
                                  {slot.subjectName}
                                </div>
                              )}

                              {/* Line 3: Attendance Badge */}
                              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                {slot.isConducted ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50/80 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>เช็คแล้ว</span>
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                                    <span className="w-3 h-3 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                      !
                                    </span>
                                    <span>ยังไม่เช็ค</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------------------------------------------------
            RIGHT 4-COLS: 3 Widgets matching Mockup
            ---------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-4">
          {/* ========================================================
              WIDGET 1: สรุปการเช็คในช่วงนี้
              ======================================================== */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 select-none">
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                สรุปการเช็คในช่วงนี้
              </h2>
            </div>

            {/* Tabs: [สัปดาห์นี้] [เดือนนี้] */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setActiveSummaryTab('WEEK')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeSummaryTab === 'WEEK'
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                สัปดาห์นี้
              </button>
              <button
                type="button"
                onClick={() => setActiveSummaryTab('MONTH')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeSummaryTab === 'MONTH'
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เดือนนี้
              </button>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 pt-1 text-xs">
              {activeSummaryTab === 'WEEK' ? (
                <>
                  {/* Item 1: ยังไม่ได้เช็ค (สัปดาห์นี้) */}
                  <div
                    onClick={() => setFilterMode('UNCHECKED')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-rose-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-rose-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>ยังไม่ได้เช็ค (สัปดาห์นี้)</span>
                    </div>
                    <span className="font-extrabold text-rose-600">
                      {`${uncheckedWeekCount} รายการ`}
                    </span>
                  </div>

                  {/* Item 2: ยังไม่ได้เช็ค (เดือนนี้) */}
                  <div
                    onClick={() => {
                      setActiveSummaryTab('MONTH');
                      setIsDetailSummaryModalOpen(true);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span>ยังไม่ได้เช็ค (เดือนนี้)</span>
                    </div>
                    <span className="font-extrabold text-amber-600">
                      {`${uncheckedMonthCount} รายการ`}
                    </span>
                  </div>

                  {/* Item 3: เช็คแล้ว (สัปดาห์นี้) */}
                  <div
                    onClick={() => setFilterMode('CHECKED')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>เช็คแล้ว (สัปดาห์นี้)</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">
                      {`${checkedWeekCount} รายการ`}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Month Tab Breakdown */}
                  <div
                    onClick={() => {
                      setActiveSummaryTab('MONTH');
                      setIsDetailSummaryModalOpen(true);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span>ยังไม่ได้เช็ค (เดือนนี้)</span>
                    </div>
                    <span className="font-extrabold text-amber-600">
                      {uncheckedMonthCount} รายการ
                    </span>
                  </div>

                  <div
                    onClick={() => setIsDetailSummaryModalOpen(true)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>เช็คแล้ว (เดือนนี้)</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">32 รายการ</span>
                  </div>

                  <div
                    onClick={() => setIsDetailSummaryModalOpen(true)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <span>รวมคาบสอนทั้งหมด (เดือนนี้)</span>
                    </div>
                    <span className="font-extrabold text-blue-700">37 รายการ</span>
                  </div>
                </>
              )}
            </div>

            {/* Action Button: ดูรายละเอียดทั้งหมด */}
            <button
              type="button"
              onClick={() => setIsDetailSummaryModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer mt-1"
            >
              ดูรายละเอียดทั้งหมด
            </button>
          </div>

          {/* ========================================================
              WIDGET 2: งานที่ต้องทำวันนี้
              ======================================================== */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 select-none">
            {/* Header with Red Badge 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                  งานที่ต้องทำวันนี้
                </h2>
              </div>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow-2xs">
                3
              </span>
            </div>

            {/* Task list matching Mockup */}
            <div className="space-y-2.5 pt-1">
              {INITIAL_TASKS.map((task) => {
                const iconBg =
                  task.iconType === 'red'
                    ? 'bg-rose-100 text-rose-600'
                    : task.iconType === 'green'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-purple-100 text-purple-600';

                const IconComp =
                  task.iconType === 'red'
                    ? FileText
                    : task.iconType === 'green'
                    ? FileCheck2
                    : FileSpreadsheet;

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {task.dueDate}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        task.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {task.priorityLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Link: ดูทั้งหมด > */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToAssignments) {
                  onNavigateToAssignments();
                } else {
                  onDeepNavigate?.({
                    view: 'assignments',
                    highlightBanner: 'งานและภาระงานครูทั้งหมด',
                  });
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold block w-full text-center pt-1 transition-colors cursor-pointer"
            >
              ดูทั้งหมด &gt;
            </button>
          </div>

          {/* ========================================================
              WIDGET 3: ปฏิทินกิจกรรมใกล้ตัว
              ======================================================== */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 select-none">
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                ปฏิทินกิจกรรมใกล้ตัว
              </h2>
            </div>

            {/* Event list matching Mockup */}
            <div className="space-y-3 pt-1 text-xs">
              {INITIAL_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                      event.bulletColor === 'amber' ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      {event.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button: ดูปฏิทินทั้งหมด */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToCalendar) {
                  onNavigateToCalendar();
                } else {
                  setIsCalendarModalOpen(true);
                }
              }}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>ดูปฏิทินทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          TOAST NOTIFICATION
          ======================================================== */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          MODAL 1: ROLL-CALL INTERFACE (เช็คชื่อเข้าชั้นเรียน)
          ======================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>
                    เช็คชื่อเข้าชั้นเรียน: {selectedSlot.subjectCode}{' '}
                    {selectedSlot.room && `(${selectedSlot.room})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  วัน{selectedSlot.day} คาบที่ {selectedSlot.period} •{' '}
                  {selectedSlot.timeRange} • ซิงค์ผลแถวเสาธง & ใบลาอัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary info and 1-click all present */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>
                  จำนวนนักเรียน {studentsList.length} คน (ดึงสถานะลาจากระบบอัตโนมัติ)
                </span>
              </span>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                ✓ มาครบทุกคน (คงสถานะผู้ที่ลา)
              </button>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="w-12 text-center py-2.5">เลขที่</th>
                    <th className="py-2.5">ชื่อ - นามสกุล (รหัส)</th>
                    <th className="py-2.5">ผลเช็คชื่อเสาธง & ใบลา</th>
                    <th className="text-right py-2.5 pr-3">เช็คเวลาเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsList.map((stu) => {
                    const currentStatus = attendanceRecords[stu.no] || 'PRESENT';
                    const morning =
                      studentAffairsCouncilService.getMorningStatusForStudent(
                        stu.name,
                        stu.code
                      );
                    const isOverridingLeave =
                      morning.hasApprovedLeave && currentStatus !== 'LEAVE';

                    return (
                      <tr
                        key={stu.no}
                        className={
                          isOverridingLeave
                            ? 'bg-amber-50/70'
                            : morning.hasApprovedLeave
                            ? 'bg-blue-50/40'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="text-center font-bold tabular-nums py-2.5">
                          {stu.no}
                        </td>
                        <td className="whitespace-nowrap py-2.5">
                          <span className="font-bold text-slate-900">
                            {stu.name}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({stu.code})
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                morning.hasApprovedLeave
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : morning.assemblyStatus === 'LATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : morning.assemblyStatus === 'ABSENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>เสาธง: {morning.assemblyLabel}</span>
                            </span>
                            {isOverridingLeave && (
                              <span className="text-[10px] font-bold text-amber-800">
                                ⚠️ เปลี่ยนจาก &quot;ลา&quot;
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right whitespace-nowrap py-2.5 pr-3">
                          <div className="inline-flex items-center justify-end gap-1">
                            {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map(
                              (status) => {
                                const isSelected = currentStatus === status;
                                const labelMap = {
                                  PRESENT: 'มา',
                                  ABSENT: 'ขาด',
                                  LATE: 'สาย',
                                  LEAVE: 'ลา',
                                };
                                const colorMap = {
                                  PRESENT: isSelected
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  ABSENT: isSelected
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  LATE: isSelected
                                    ? 'bg-amber-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  LEAVE: isSelected
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                };

                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                      setAttendanceRecords({
                                        ...attendanceRecords,
                                        [stu.no]: status,
                                      });
                                      setOverrideConfirmConflicts([]);
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${colorMap[status]}`}
                                  >
                                    {labelMap[status]}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Conflict Warning Dialog */}
            {overrideConfirmConflicts.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-300 space-y-2.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    แจ้งเตือน: พบนักเรียนที่แจ้งลาแล้วถูกเปลี่ยนสถานะ ({overrideConfirmConflicts.length} คน)
                  </span>
                </div>
                <ul className="space-y-1 text-amber-800 pl-5 list-disc">
                  {overrideConfirmConflicts.map((c) => (
                    <li key={c.no}>
                      <span className="font-bold">{c.name}</span> — แจ้ง{' '}
                      <span className="underline">{c.leaveReason}</span> แต่ถูกเปลี่ยนเป็นสถานะ{' '}
                      <span className="font-bold text-rose-700">
                        &quot;{c.chosenStatus}&quot;
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const reverted = { ...attendanceRecords };
                      for (const c of overrideConfirmConflicts) {
                        reverted[c.no] = 'LEAVE';
                      }
                      setAttendanceRecords(reverted);
                      setOverrideConfirmConflicts([]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 cursor-pointer"
                  >
                    คืนค่าเป็น &quot;ลา&quot; ตามใบลา
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideConfirmConflicts([]);
                      setMatrixSlots((prev) =>
                        prev.map((s) =>
                          s.id === selectedSlot.id ? { ...s, isConducted: true } : s
                        )
                      );
                      setSelectedSlot(null);
                      showToast(
                        'ยืนยันการเปลี่ยนสถานะและบันทึกการเช็คชื่อเข้าชั้นเรียนเรียบร้อยแล้ว'
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer"
                  >
                    ยืนยันการบันทึกตามที่เปลี่ยน
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                บันทึกการเช็คชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ATTENDANCE DETAILED BREAKDOWN MODAL
          ======================================================== */}
      {isDetailSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  สรุปรายละเอียดการเช็คชื่อเข้าชั้นเรียน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailSummaryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Cards: Mathematically Consistent (Checked + Unchecked = Total) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] text-blue-600 font-semibold">
                  คาบสอนทั้งหมด
                </div>
                <div className="text-xl font-extrabold text-blue-900 mt-1">
                  {checkedWeekCount + uncheckedWeekCount}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[11px] text-emerald-600 font-semibold">
                  เช็คชื่อแล้ว
                </div>
                <div className="text-xl font-extrabold text-emerald-900 mt-1">
                  {checkedWeekCount}
                </div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="text-[11px] text-rose-600 font-semibold">
                  ยังไม่ได้เช็ค
                </div>
                <div className="text-xl font-extrabold text-rose-900 mt-1">
                  {uncheckedWeekCount}
                </div>
              </div>
            </div>

            {/* List of pending classes */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700">
                รายการคาบสอนที่รอการเช็คชื่อ ({pendingWeekSlots.length} รายการ):
              </div>
              {pendingWeekSlots.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl text-center text-xs text-emerald-700 font-semibold">
                  ✓ เช็คชื่อครบทุกคาบสอนในสัปดาห์นี้แล้ว
                </div>
              ) : (
                pendingWeekSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        วัน{slot.day} คาบที่ {slot.period} ({slot.timeRange})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {slot.subjectCode} {slot.room} • {slot.subjectName || 'กิจกรรม'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailSummaryModalOpen(false);
                        handleOpenSlot(slot);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      เช็คชื่อทันที
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailSummaryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: TASK DETAIL MODAL
          ======================================================== */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  รายละเอียดงานที่ต้องทำ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">ชื่องาน:</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                  {selectedTaskDetail.title}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 text-[11px]">กำหนดส่ง:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {selectedTaskDetail.dueDate}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">ความเร่งด่วน:</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTaskDetail.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {selectedTaskDetail.priorityLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                งานนี้เชื่อมโยงกับระบบประเมินผลและการส่งเกรด SGS
                สามารถดำเนินการตรวจหรือบันทึกคะแนนเพื่ออัปเดตระบบแบบเรียลไทม์
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => handleCompleteTask(selectedTaskDetail.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                ทำเครื่องหมายว่าเสร็จแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CALENDAR MODAL
          ======================================================== */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  ปฏิทินกิจกรรมโรงเรียน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-slate-800">
                    กิจกรรมวันภาษาอังกฤษ (2 ต.ค. 2569)
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    เวลา 08:30 - 15:30 น. • หอประชุมใหญ่
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-slate-800">
                    แข่งขันกีฬา - การแข่งขันม.ต้น
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    1 ต.ค. 2569 เวลา 10:15 น. • สนามกีฬาโรงเรียน
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-slate-800">
                    ส่งคะแนนเก็บกลางภาคเรียนที่ 1/2569
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    ภายใน 10 ต.ค. 2569 • ผ่านระบบ SGS
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
