import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  ListFilter,
  BarChart2,
  ChevronDown,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';
import { AddEditTimetableSlotModal } from '../components/timetable/AddEditTimetableSlotModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { AdminTeacherBannerModal } from '../components/teacher/AdminTeacherBannerModal';
import type { SchoolUserRole } from '../config/schoolRoles';
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
  activeRole?: SchoolUserRole;
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

export const TimetableView: React.FC<TimetableViewProps> = ({
  onDeepNavigate,
  onNavigateToAssignments,
  onNavigateToCalendar,
  activeRole = 'ACADEMIC_ADMIN',
}) => {
  // ------------------------------------------
  // State
  // ------------------------------------------
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [matrixSlots, setMatrixSlots] = useState<TimetableMatrixSlot[]>(loadSavedMatrixSlots);
  const [selectedSlot, setSelectedSlot] = useState<TimetableMatrixSlot | null>(null);
  const [viewModeTab, setViewModeTab] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [mobileDay, setMobileDay] = useState<string>('พฤหัสบดี');
  const [mobileViewMode, setMobileViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Add / Edit Timetable Slot Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableMatrixSlot> | null>(null);

  // Admin Banner Studio Modal
  const [isBannerStudioOpen, setIsBannerStudioOpen] = useState<boolean>(false);

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
  // Today's Stats matching Mockup Image 1
  // - วันนี้สอน: 6 คาบ
  // - เช็คชื่อแล้ว: 3 คาบ (50% ˅)
  // - ยังไม่เช็คชื่อ: 3 คาบ (50% >)
  // - งานที่ต้องตรวจ: 8 งาน
  // ------------------------------------------
  const todayDayKey = 'พฤหัสบดี';
  const todaySlots = useMemo(() => {
    return matrixSlots.filter((s) => s.day === todayDayKey);
  }, [matrixSlots]);

  const todayTotalPeriods = 6;
  const todayCheckedCount = useMemo(() => {
    return todaySlots.filter((s) => s.status === 'CHECKED' || s.isConducted).length;
  }, [todaySlots]);

  const todayUncheckedCount = Math.max(0, todayTotalPeriods - todayCheckedCount);
  const pendingAssignmentsCount = 8;

  // ------------------------------------------
  // Actions
  // ------------------------------------------
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenSlot = (slot: TimetableMatrixSlot) => {
    if (slot.isFreePeriod || slot.category === 'free' || slot.status === 'LUNCH') {
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
      prev.map((s) =>
        s.id === selectedSlot.id
          ? { ...s, isConducted: true, status: 'CHECKED' as const }
          : s
      )
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

  // Color card styling matching Mockup Image 1
  const getCardStyle = (
    colorTheme: TimetableColorTheme,
    status?: 'CHECKED' | 'UNCHECKED' | 'TEACHING' | 'LUNCH',
    isLunchSlot?: boolean
  ) => {
    if (isLunchSlot || status === 'LUNCH') {
      return 'bg-amber-50/60 border-amber-200/70 text-amber-900';
    }

    switch (colorTheme) {
      case 'blue':
        return 'bg-[#EBF3FF] border-[#D0E2FF] hover:border-blue-300 text-[#1E3A8A]';
      case 'teal':
        return 'bg-[#E6F9F5] border-[#BCEEE4] hover:border-teal-300 text-[#0D5F54]';
      case 'green':
        return 'bg-[#EDF9EE] border-[#C8EECB] hover:border-emerald-300 text-[#166534]';
      case 'amber':
        return 'bg-[#FFF6E5] border-[#FFE4B5] hover:border-amber-300 text-[#92400E]';
      case 'purple':
        return 'bg-[#F3E8FF] border-[#E2CEFC] hover:border-purple-300 text-[#6B21A8]';
      case 'pink':
        return 'bg-[#FDF0F5] border-[#FBD2E3] hover:border-pink-300 text-[#9D174D]';
      case 'free':
        return 'bg-slate-50 border-slate-200 text-slate-500';
      default:
        return 'bg-white border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* ========================================================
          1. TOP HERO BANNER (ตามภาพที่ 2 media_1791345472357.png)
          ======================================================== */}
      <PageHeroBanner
        title="ตารางสอน"
        subtitle="จัดสรรเวลาและคาบสอนเพื่อให้นักเรียนทุกคนพัฒนาได้อย่างเต็มที่"
        icon={<Calendar className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="ม.3/1"
        quoteText="“การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น นะคะ ♡”"
        isAdmin={activeRole === 'ACADEMIC_ADMIN'}
        onOpenBannerSettings={() => setIsBannerStudioOpen(true)}
      />

      {/* ========================================================
          2. 4 METRIC KPI CARDS + 1 ACTION CARD (ตามภาพที่ 1)
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: วันนี้สอน */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">วันนี้สอน</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {todayTotalPeriods} คาบ
            </span>
          </div>
        </div>

        {/* Card 2: เช็คชื่อแล้ว */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">เช็คชื่อแล้ว</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {todayCheckedCount} คาบ
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
            50% <ChevronDown className="w-3 h-3 stroke-[3]" />
          </span>
        </div>

        {/* Card 3: ยังไม่เช็คชื่อ */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">ยังไม่เช็คชื่อ</span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 leading-tight">
                {todayUncheckedCount} คาบ
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 flex items-center gap-0.5">
            50% <ChevronRight className="w-3 h-3 stroke-[3]" />
          </span>
        </div>

        {/* Card 4: งานที่ต้องตรวจ */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">งานที่ต้องตรวจ</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {pendingAssignmentsCount} งาน
            </span>
          </div>
        </div>

        {/* Card 5: Action Card: ดูสถิติรายวิชา > */}
        <div
          onClick={() => setIsDetailSummaryModalOpen(true)}
          className="col-span-2 sm:col-span-1 bg-[#EAF5FF] hover:bg-[#DCEEFF] border border-[#CDE5FF] rounded-2xl p-4 shadow-2xs flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-blue-950 block">
                ดูสถิติรายวิชา
              </span>
              <span className="text-[11px] text-blue-700 font-medium">สถิติและ SAR</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>

      {/* ========================================================
          3. DATE TOOLBAR, VIEW MODE SWITCHER & LEGEND (ตามภาพที่ 1)
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-2xl border border-[#E6EEF7] p-3 sm:p-4 shadow-2xs">
        {/* Left: Date Navigation (< [ 📅 พฤหัสบดีที่ 2 ตุลาคม 2569 ] >) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => weekInfo.canPrev && setWeekOffset((prev) => prev - 1)}
            disabled={!weekInfo.canPrev}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 transition-colors ${
              weekInfo.canPrev
                ? 'hover:bg-blue-50 text-blue-600 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>พฤหัสบดีที่ 2 ตุลาคม 2569</span>
          </div>

          <button
            type="button"
            onClick={() => weekInfo.canNext && setWeekOffset((prev) => prev + 1)}
            disabled={!weekInfo.canNext}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 transition-colors ${
              weekInfo.canNext
                ? 'hover:bg-blue-50 text-blue-600 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="ถัดไป"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Center: View Mode Tabs [วันนี้] [สัปดาห์] [เดือน] */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewModeTab('TODAY')}
            className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'TODAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => setViewModeTab('WEEK')}
            className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'WEEK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สัปดาห์
          </button>
          <button
            type="button"
            onClick={() => setViewModeTab('MONTH')}
            className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'MONTH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เดือน
          </button>
        </div>

        {/* Right: Legend Dots (🟢 เช็คแล้ว, 🔴 ยังไม่เช็ค, 🟡 กำลังสอน, ⚪ พัก) */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <span>เช็คแล้ว</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
            <span>ยังไม่เช็ค</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs" />
            <span>กำลังสอน</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-2xs" />
            <span>พัก</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. TIMETABLE MATRIX TABLE (ตามภาพที่ 1 media_1791345402048.jpg)
          ======================================================== */}
      <div className="w-full bg-white rounded-3xl border border-[#E6EEF7] p-4 sm:p-6 shadow-2xs space-y-4 overflow-hidden">
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
              <span>ตารางสอนวัน{mobileDay}</span>
            </span>
            {mobileDay === 'พฤหัสบดี' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                วันนี้
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {activePeriods.map((periodDef) => {
              const slot = getSlot(mobileDay, periodDef.period);

              if (periodDef.period === 5 || slot?.status === 'LUNCH') {
                return (
                  <div
                    key={periodDef.period}
                    className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-bold shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🍴</span>
                      <span>พักกลางวัน (11:50 - 12:40)</span>
                    </span>
                    <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      พัก
                    </span>
                  </div>
                );
              }

              if (!slot) return null;

              const cardStyle = getCardStyle(slot.colorTheme, slot.status);
              return (
                <div
                  key={periodDef.period}
                  onClick={() => handleOpenSlot(slot)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${cardStyle} hover:shadow-xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold opacity-70">
                        <span>{periodDef.label} • {periodDef.timeRange}</span>
                        <span>{slot.room}</span>
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 truncate">
                        {slot.subjectCode} {slot.subjectName && `(${slot.subjectName})`}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <span className="text-xs text-slate-500 font-medium">{slot.room}</span>
                    {slot.status === 'CHECKED' || slot.isConducted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>เช็คแล้ว</span>
                      </span>
                    ) : slot.status === 'TEACHING' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>กำลังสอน</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>ยังไม่เช็ค</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Desktop Matrix Table matching Mockup Image 1 */}
        <div
          className={`overflow-x-auto -mx-4 sm:mx-0 ${
            mobileViewMode === 'CARDS' ? 'hidden md:block' : 'block'
          }`}
        >
          <table className="w-full text-center text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-[#E6EEF7]">
                {/* Column 1: เวลา / วัน */}
                <th className="py-3.5 px-3 w-28 text-left text-slate-600 font-extrabold text-xs">
                  เวลา / วัน
                </th>

                {/* Columns 2-6: จันทร์ - ศุกร์ */}
                {weekInfo.days.map((dayObj) => {
                  if (dayObj.key === 'พฤหัสบดี') {
                    // Highlighted Thursday Column in Mockup: Blue Pill Header
                    return (
                      <th key={dayObj.key} className="py-2.5 px-2 min-w-[130px]">
                        <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                          {dayObj.key}
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={dayObj.key}
                      className="py-3.5 px-2 text-slate-700 font-bold text-xs min-w-[120px]"
                    >
                      {dayObj.key}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6EEF7]/80">
              {activePeriods.map((periodDef) => {
                const isLunchRow = periodDef.period === 5;

                return (
                  <tr key={periodDef.period} className="transition-colors">
                    {/* Time cell on left */}
                    <td className="py-3.5 px-3 text-left font-bold text-slate-600 text-xs align-middle bg-slate-50/30">
                      <div>{periodDef.timeRange}</div>
                      <div className="text-[10px] text-slate-400 font-medium">({periodDef.label})</div>
                    </td>

                    {/* Lunch Row: Spans across days */}
                    {isLunchRow ? (
                      <td
                        colSpan={weekInfo.days.length}
                        className="p-2 align-middle bg-amber-50/50 text-center"
                      >
                        <div className="py-2.5 px-4 rounded-xl border border-amber-200/80 bg-white shadow-2xs inline-flex items-center gap-2 text-xs font-bold text-amber-900">
                          <span>🍴</span>
                          <span>พักกลางวัน (11:50 - 12:40)</span>
                        </div>
                      </td>
                    ) : (
                      /* Regular 5 Days Cells */
                      weekInfo.days.map((dayObj) => {
                        const slot = getSlot(dayObj.key, periodDef.period);
                        const isThursday = dayObj.key === 'พฤหัสบดี';

                        // Soft Blue column highlight for Thursday as shown in Mockup
                        const colHighlight = isThursday ? 'bg-blue-50/30' : '';

                        if (!slot) {
                          return (
                            <td
                              key={dayObj.key}
                              onClick={() => handleOpenFreeSlot(dayObj.key, periodDef.period)}
                              className={`p-1.5 align-middle cursor-pointer group ${colHighlight}`}
                              title="คลิกเพื่อเพิ่มรายวิชาในคาบนี้"
                            >
                              <div className="h-28 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 hover:bg-blue-50/40 hover:border-blue-300 transition-colors flex items-center justify-center text-slate-300 group-hover:text-blue-500 text-xs">
                                + เพิ่มวิชา
                              </div>
                            </td>
                          );
                        }

                        const cardStyle = getCardStyle(slot.colorTheme, slot.status);
                        return (
                          <td
                            key={dayObj.key}
                            onClick={() => handleOpenSlot(slot)}
                            className={`p-1.5 align-middle cursor-pointer group ${colHighlight}`}
                          >
                            <div
                              className={`h-28 w-full p-3 rounded-2xl border flex flex-col justify-between text-left transition-all ${cardStyle} hover:shadow-xs group-hover:-translate-y-0.5`}
                            >
                              {/* Top row: Subject code in bold */}
                              <div className="font-black text-sm tracking-tight text-slate-900 truncate">
                                {slot.subjectCode}
                              </div>

                              {/* Middle: Room */}
                              <div className="text-[11px] text-slate-600 font-semibold truncate">
                                {slot.room}
                              </div>

                              {/* Bottom: Status Pill matching Mockup Image 1 */}
                              <div className="flex items-center justify-start pt-1">
                                {slot.status === 'CHECKED' || slot.isConducted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span>เช็คแล้ว</span>
                                  </span>
                                ) : slot.status === 'TEACHING' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                    <span>กำลังสอน</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                    <span>ยังไม่เช็ค</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Toolbar right under table (ตามภาพที่ 1) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => showToast('เลือกดูตารางสอนย้อนหลัง')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>เลือกดูตารางย้อนหลัง</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToCalendar) onNavigateToCalendar();
              else showToast('เปิดดูปฏิทินกิจกรรมโรงเรียน');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            <span>ดูปฏิทิน</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          5. "เครื่องมือด่วน" (QUICK TOOLS SECTION) (ตามภาพที่ 1)
          ======================================================== */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>⚡ เครื่องมือด่วน</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: คะแนนเก็บ */}
          <div
            onClick={() => {
              if (onDeepNavigate) onDeepNavigate({ view: 'exams' });
              else showToast('เปิดหน้าคะแนนเก็บและบันทึกคะแนน');
            }}
            className="bg-white hover:bg-blue-50/40 rounded-2xl border border-[#E6EEF7] hover:border-blue-200 p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                📝
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                  คะแนนเก็บ
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  บันทึกและจัดการคะแนนเก็บ
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-blue-600 text-xs font-bold pt-2">
              <span>เข้าสู่เมนู →</span>
            </div>
          </div>

          {/* Card 2: งาน / แบบฝึกหัด */}
          <div
            onClick={() => {
              if (onNavigateToAssignments) onNavigateToAssignments();
              else if (onDeepNavigate) onDeepNavigate({ view: 'assignments' });
              else showToast('เปิดหน้างานและแบบฝึกหัด');
            }}
            className="bg-white hover:bg-purple-50/40 rounded-2xl border border-[#E6EEF7] hover:border-purple-200 p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                📚
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                  งาน / แบบฝึกหัด
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  ตรวจและมอบหมายงาน
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-purple-600 text-xs font-bold pt-2">
              <span>เข้าสู่เมนู →</span>
            </div>
          </div>

          {/* Card 3: เช็คชื่อ / สถิติ */}
          <div
            onClick={() => {
              if (onDeepNavigate) onDeepNavigate({ view: 'classroom-attendance' });
              else showToast('เปิดหน้าเช็คชื่อนักเรียนและสรุปสถิติ');
            }}
            className="bg-white hover:bg-emerald-50/40 rounded-2xl border border-[#E6EEF7] hover:border-emerald-200 p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                ✅
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  เช็คชื่อ / สถิติ
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  สรุปเวลาเรียนและสถิติ
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-emerald-600 text-xs font-bold pt-2">
              <span>เข้าสู่เมนู →</span>
            </div>
          </div>

          {/* Card 4: ตั้งค่าการสอน */}
          <div
            onClick={() => {
              if (onDeepNavigate) onDeepNavigate({ view: 'settings' });
              else showToast('เปิดหน้าตั้งค่าการสอนและโครงสร้างคาบเรียน');
            }}
            className="bg-white hover:bg-amber-50/40 rounded-2xl border border-[#E6EEF7] hover:border-amber-200 p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                ⚙️
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                  ตั้งค่าการสอน
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  จัดการคาบเรียนและวิชา
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-amber-600 text-xs font-bold pt-2">
              <span>เข้าสู่เมนู →</span>
            </div>
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
                <p className="text-xs text-slate-500 mt-0.5">
                  วัน{selectedSlot.day} คาบที่ {selectedSlot.period} • {selectedSlot.subjectName || selectedSlot.subjectCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100">
              <span className="text-xs font-semibold text-blue-900">
                นักเรียนในห้อง ({studentsList.length} คน)
              </span>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>มาเรียนทุกคน</span>
              </button>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {studentsList.map((stu) => {
                const currentStatus = attendanceRecords[stu.no] || 'PRESENT';
                const morningStatus = studentAffairsCouncilService.getMorningStatusForStudent(
                  stu.name,
                  stu.code
                );

                return (
                  <div
                    key={stu.no}
                    className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 text-slate-400 font-bold text-center">
                        {stu.no}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {stu.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>รหัส {stu.code}</span>
                          {morningStatus.hasApprovedLeave && (
                            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              ☀️ เช้า: {morningStatus.leaveReason || 'อนุมัติใบลา'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(
                        [
                          { key: 'PRESENT', label: 'มา', color: 'emerald' },
                          { key: 'LATE', label: 'สาย', color: 'amber' },
                          { key: 'LEAVE', label: 'ลา', color: 'blue' },
                          { key: 'ABSENT', label: 'ขาด', color: 'rose' },
                        ] as const
                      ).map((st) => {
                        const isSelected = currentStatus === st.key;
                        const colorMap = {
                          emerald: isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                          amber: isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                          blue: isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                          rose: isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
                        };

                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() =>
                              setAttendanceRecords((prev) => ({
                                ...prev,
                                [stu.no]: st.key,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              colorMap[st.color]
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conflict Warnings */}
            {overrideConfirmConflicts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>พบความขัดแย้งกับใบลาที่ได้รับอนุมัติ ({overrideConfirmConflicts.length} รายการ):</span>
                </div>
                <ul className="space-y-1 text-amber-800 list-disc list-inside text-[11px]">
                  {overrideConfirmConflicts.map((c) => (
                    <li key={c.no}>
                      {c.name}: มีใบลา ({c.leaveReason}) แต่คุณเลือก &quot;{c.chosenStatus}&quot;
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixSlots((prev) =>
                        prev.map((s) =>
                          s.id === selectedSlot.id
                            ? { ...s, isConducted: true, status: 'CHECKED' as const }
                            : s
                        )
                      );
                      setSelectedSlot(null);
                      showToast('ยืนยันและบันทึกการเช็คชื่อเข้าชั้นเรียนเรียบร้อย');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer"
                  >
                    ยืนยันการบันทึกตามที่เลือก
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
                  สรุปรายละเอียดการเช็คชื่อและสถิติรายวิชา
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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] text-blue-600 font-semibold">คาบสอนวันนี้</div>
                <div className="text-xl font-extrabold text-blue-900 mt-1">
                  {todayTotalPeriods}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[11px] text-emerald-600 font-semibold">เช็คชื่อแล้ว</div>
                <div className="text-xl font-extrabold text-emerald-900 mt-1">
                  {todayCheckedCount}
                </div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="text-[11px] text-rose-600 font-semibold">ยังไม่เช็ค</div>
                <div className="text-xl font-extrabold text-rose-900 mt-1">
                  {todayUncheckedCount}
                </div>
              </div>
            </div>

            {/* List of Today's slots */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700">
                รายการคาบสอนประจำวัน{todayDayKey} ({todaySlots.length} รายการ):
              </div>
              {todaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      คาบที่ {slot.period} ({slot.timeRange}) • {slot.subjectCode} ({slot.room})
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {slot.subjectName || slot.subjectCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.status === 'CHECKED' || slot.isConducted ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        ✓ เช็คแล้ว
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailSummaryModalOpen(false);
                          handleOpenSlot(slot);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
                      >
                        เช็คชื่อทันที
                      </button>
                    )}
                  </div>
                </div>
              ))}
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

      {/* ========================================================
          MODAL 4: ADMIN TEACHER BANNER STUDIO MODAL
          ======================================================== */}
      <AdminTeacherBannerModal
        isOpen={isBannerStudioOpen}
        onClose={() => setIsBannerStudioOpen(false)}
        activeRole={activeRole}
        initialBannerKey="hero"
      />
    </div>
  );
};
