import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  Users,
  AlertCircle,
  ClipboardList,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  LayoutGrid,
  ListFilter,
  Plus,
  Edit3,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';
import { getSubjectIcon, renderSubjectIconBadge } from '../config/subjectIcons';
import { AddEditTimetableSlotModal } from '../components/timetable/AddEditTimetableSlotModal';
import {
  bellScheduleService,
  BELL_SCHEDULE_UPDATED_EVENT,
  type SchoolBellScheduleConfig,
} from '../services/bellScheduleService';

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

const MATRIX_STORAGE_KEY = 'kp_teacher_matrix_slots';

const loadSavedMatrixSlots = (): TimetableMatrixSlot[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(MATRIX_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return INITIAL_MATRIX_SLOTS;
};

export const TimetableView: React.FC<TimetableViewProps> = () => {
  // ------------------------------------------
  // State
  // ------------------------------------------
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [matrixSlots, setMatrixSlots] = useState<TimetableMatrixSlot[]>(loadSavedMatrixSlots);
  const [selectedSlot, setSelectedSlot] = useState<TimetableMatrixSlot | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>('ALL');
  const [mobileDay, setMobileDay] = useState<string>('พฤหัสบดี');
  const [mobileViewMode, setMobileViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Add / Edit Timetable Slot Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableMatrixSlot> | null>(null);

  // School Bell Schedule Settings (Dynamic Period Times & Lunch Mode)
  const [bellConfig, setBellConfig] = useState<SchoolBellScheduleConfig>(() =>
    bellScheduleService.getConfig()
  );

  useEffect(() => {
    const handleBellUpdate = (e: Event) => {
      const custom = e as CustomEvent<SchoolBellScheduleConfig>;
      if (custom.detail) {
        setBellConfig(custom.detail);
      }
    };
    window.addEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    return () => {
      window.removeEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    };
  }, []);

  // Compute active teaching periods and lunch slot from bellScheduleService
  const activePeriods = useMemo(() => {
    const timeline = bellScheduleService.getTimeline();
    const teachingList = timeline
      .filter((t) => t.type === 'PERIOD' || (t.type === 'LUNCH' && t.periodNumber !== undefined))
      .map((t) => ({
        period: t.periodNumber || 1,
        timeRange: t.timeRange,
        label: t.label,
        isLunch: t.isLunch,
      }));
    return teachingList.length > 0 ? teachingList : PERIOD_DEFINITIONS;
  }, [bellConfig]);

  const lunchBreakItem = useMemo(() => {
    const timeline = bellScheduleService.getTimeline();
    return timeline.find((t) => t.type === 'LUNCH' && t.periodNumber === undefined) || null;
  }, [bellConfig]);

  // Modals state
  const [isDetailSummaryModalOpen, setIsDetailSummaryModalOpen] = useState<boolean>(false);
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
    if (slot.isFreePeriod || slot.category === 'free') {
      setEditingSlot({
        day: slot.day,
        period: slot.period,
        room: 'ม.3/1',
        colorTheme: 'blue',
        isFreePeriod: false,
      });
      setIsAddEditModalOpen(true);
      return;
    }
    setAttendanceRecords(buildInitialAttendance());
    setOverrideConfirmConflicts([]);
    setSelectedSlot(slot);
  };

  const handleOpenFreeSlot = (day: string, period: number) => {
    setEditingSlot({
      day: day as TimetableMatrixSlot['day'],
      period,
      room: 'ม.3/1',
      colorTheme: 'blue',
      isFreePeriod: false,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveSlot = (slotToSave: TimetableMatrixSlot) => {
    setMatrixSlots((prev) => {
      const existingIdx = prev.findIndex(
        (s) => s.id === slotToSave.id || (s.day === slotToSave.day && s.period === slotToSave.period)
      );
      let updated: TimetableMatrixSlot[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = slotToSave;
      } else {
        updated = [...prev, slotToSave];
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    showToast(`บันทึกรายวิชา ${slotToSave.subjectCode} (${slotToSave.day} คาบที่ ${slotToSave.period}) สำเร็จ`);
  };

  const handleDeleteSlot = (slotId: string) => {
    setMatrixSlots((prev) => {
      const updated = prev.map((s) =>
        s.id === slotId ? { ...s, isFreePeriod: true, category: 'free' as const } : s
      );
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    showToast('ลบรายวิชาออกจากตารางสอนเรียบร้อย');
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

        {/* Right Controls: Add Subject & Week Selector Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Add Subject to Timetable Button */}
          <button
            type="button"
            onClick={() => {
              setEditingSlot(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ เพิ่มรายวิชาในตารางสอน</span>
          </button>

          {/* Unified Week Selector Toolbar matching 20-Week Term Boundary */}
          <div className="flex items-center p-1 rounded-2xl border border-slate-200/90 bg-white shadow-2xs gap-1">
            {/* Previous Week */}
            <button
              type="button"
              onClick={() => weekInfo.canPrev && setWeekOffset((prev) => prev - 1)}
              disabled={!weekInfo.canPrev}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                weekInfo.canPrev
                  ? 'hover:bg-blue-50 text-blue-600 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-50'
              }`}
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

            {/* 20-Week number pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200/60">
              <CalendarDays className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="whitespace-nowrap">{`สัปดาห์ที่ ${weekInfo.weekNumber} / 20 สัปดาห์`}</span>
            </div>

            {/* Next Week */}
            <button
              type="button"
              onClick={() => weekInfo.canNext && setWeekOffset((prev) => prev + 1)}
              disabled={!weekInfo.canNext}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                weekInfo.canNext
                  ? 'hover:bg-blue-50 text-blue-600 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-50'
              }`}
              title="สัปดาห์ถัดไป"
              aria-label="สัปดาห์ถัดไป"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
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
          3. MAIN SECTION: Full Timetable Matrix (100% Width)
          ======================================================== */}
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4 overflow-hidden">
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
            {activePeriods.map((periodDef) => {
              const slot = getSlot(mobileDay, periodDef.period);
              const showLunchBeforeThis =
                lunchBreakItem && periodDef.period === bellConfig.lunchBreakSlot + 1;

              return (
                <React.Fragment key={periodDef.period}>
                  {showLunchBeforeThis && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 flex items-center justify-between text-xs font-bold shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <span>🍽️</span>
                        <span>{lunchBreakItem.label} ({lunchBreakItem.timeRange})</span>
                      </span>
                      <span className="text-[10px] text-amber-600 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                        พักกลางวัน
                      </span>
                    </div>
                  )}

                  {!slot || slot.isFreePeriod || slot.category === 'free' ? (
                    <div
                      key={periodDef.period}
                      onClick={() => handleOpenFreeSlot(mobileDay, periodDef.period)}
                      className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between text-xs text-slate-400 select-none cursor-pointer group"
                    >
                      <span className="font-semibold text-slate-600 group-hover:text-blue-600">
                        {periodDef.label} ({periodDef.timeRange})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>คาบว่าง • คลิกเพื่อเพิ่มวิชา</span>
                      </span>
                    </div>
                  ) : (
                    <div
                      key={periodDef.period}
                      onClick={() => handleOpenSlot(slot)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${getSlotStyle(
                        slot.colorTheme,
                        slot.isConducted
                      )} hover:shadow-xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold opacity-70">
                              {periodDef.label} • {periodDef.timeRange}
                            </span>
                            <span className="shrink-0">
                              {renderSubjectIconBadge(
                                getSubjectIcon(slot.subjectCode, slot.subjectName),
                                'xs'
                              )}
                            </span>
                          </div>
                          <div className="font-extrabold text-sm truncate">
                            {slot.subjectCode} • {slot.room ? (slot.room.startsWith('ม.') ? `${slot.room} • ห้อง 324` : `ม.3/1 • ห้อง ${slot.room}`) : 'ม.3/1 • ห้อง 324'}
                          </div>
                          <div className="line-clamp-2 text-xs font-bold text-slate-800 leading-snug">
                            {slot.subjectName || slot.subjectCode}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100/60">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {slot.room ? (slot.room.startsWith('ม.') ? slot.room : 'ม.3/1') : 'ม.3/1'}
                        </span>
                        {slot.isConducted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>✓ เช็คแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                              !
                            </span>
                            <span>! ยังไม่เช็ค</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
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
          <table className="w-full text-center text-xs border-collapse min-w-[750px]">
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
                        className="py-3 px-2 bg-blue-600 text-white font-bold rounded-t-xl min-w-[130px] shadow-xs"
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
                      className="py-3 px-2 text-slate-700 font-bold border-b border-slate-200 min-w-[120px]"
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
              {activePeriods.map((periodDef, pIndex) => {
                const isLastPeriod = pIndex === activePeriods.length - 1;
                const showLunchBeforeThis =
                  lunchBreakItem !== null &&
                  bellConfig.lunchBreakMode === 'SKIPPED_BREAK_SLOT' &&
                  periodDef.period === bellConfig.lunchBreakSlot + 1;

                return (
                  <React.Fragment key={periodDef.period}>
                    {/* Mode B: Insert skipped lunch break row if applicable */}
                    {showLunchBeforeThis && (
                      <tr className="bg-amber-50/60 border-y border-amber-200/80">
                        <td className="py-2.5 px-3 text-left font-bold text-amber-900 align-middle">
                          <div className="text-[11px] font-bold">{lunchBreakItem.timeRange}</div>
                          <div className="text-[10px] text-amber-700 font-medium">พักกลางวัน</div>
                        </td>
                        <td colSpan={weekInfo.days.length} className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-100/80 border border-amber-300/80 rounded-full text-xs font-bold text-amber-900 shadow-2xs">
                            <span>🍱 พักรับประทานอาหารกลางวัน ({lunchBreakItem.timeRange})</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="transition-colors">
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

                        if (!slot || slot.isFreePeriod || slot.category === 'free') {
                          return (
                            <td
                              key={dayObj.key}
                              onClick={() => handleOpenFreeSlot(dayObj.key, periodDef.period)}
                              className={`p-1.5 align-middle cursor-pointer group ${columnHighlightClass}`}
                              title="คลิกเพื่อเพิ่มรายวิชาในคาบนี้"
                            >
                              <div className="h-32 min-h-[128px] w-full bg-slate-50/60 border border-dashed border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/40 rounded-xl flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 text-xs transition-all select-none">
                                <span className="font-semibold text-slate-500 group-hover:text-blue-600 flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>คาบว่าง</span>
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover:text-blue-500 mt-0.5">
                                  คลิกเพื่อเพิ่มวิชา
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
                        const subjectIcon = getSubjectIcon(slot.subjectCode, slot.subjectName);

                        return (
                          <td
                            key={dayObj.key}
                            onClick={() => handleOpenSlot(slot)}
                            className={`p-1.5 align-middle cursor-pointer group ${columnHighlightClass}`}
                          >
                            <div
                              className={`h-32 min-h-[128px] w-full p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all ${cardStyle} ${
                                isDimmed
                                  ? 'opacity-30'
                                  : 'hover:shadow-xs group-hover:-translate-y-0.5'
                              } ${
                                isToday && !slot.isConducted
                                  ? 'ring-1 ring-amber-300/80 shadow-2xs'
                                  : ''
                              }`}
                            >
                              {/* 1. Top row: Course code + Subject Icon badge */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-extrabold text-xs tracking-tight truncate">
                                  {slot.subjectCode}
                                </span>
                                <span className="shrink-0">
                                  {renderSubjectIconBadge(subjectIcon, 'xs')}
                                </span>
                              </div>

                              {/* 2. Course name: 2 lines */}
                              <div className="line-clamp-2 text-xs font-bold text-slate-800 leading-snug">
                                {slot.subjectName || slot.subjectCode}
                              </div>

                              {/* 3. Classroom & Room */}
                              <div className="text-[11px] text-slate-500 font-medium truncate">
                                {slot.room
                                  ? (slot.room.startsWith('ม.') ? `${slot.room} • ห้อง 324` : `ม.3/1 • ห้อง ${slot.room}`)
                                  : 'ม.3/1 • ห้อง 324'}
                              </div>

                              {/* 4. Status badge */}
                              <div className="flex items-center justify-start">
                                {slot.isConducted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>✓ เช็คแล้ว</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                      !
                                    </span>
                                    <span>! ยังไม่เช็ค</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const toEdit = { ...selectedSlot };
                  setSelectedSlot(null);
                  setEditingSlot(toEdit);
                  setIsAddEditModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                title="แก้ไขข้อมูลวิชาหรือเปลี่ยนไอคอน"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>✏️ แก้ไขวิชา / เปลี่ยนไอคอน</span>
              </button>
              <div className="flex items-center gap-2 self-end sm:self-auto">
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
          MODAL 3: ADD / EDIT TIMETABLE SLOT MODAL
          ======================================================== */}
      <AddEditTimetableSlotModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingSlot(null);
        }}
        onSaveSlot={handleSaveSlot}
        onDeleteSlot={handleDeleteSlot}
        initialSlot={editingSlot}
        maxPeriods={activePeriods.length}
      />
    </div>
  );
};
