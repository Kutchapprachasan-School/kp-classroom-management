// src/views/TimetableView.tsx
// หน้าตารางสอน (Timetable)
// ปรับปรุงใหม่ตามข้อกำหนด:
// 1. ชื่อหน้า: "ตารางสอน"
// 2. ส่งออกและนำเข้าตารางสอนแบบ Excel / CSV
// 3. สีคาบสอนสถานะเดียวกันทั้งหมด:
//    - เช็คแล้ว: กล่องสีเขียวเข้ม (bg-emerald-600 text-white)
//    - ยังไม่เช็ค: กล่องสีแดงเข้ม (bg-rose-600 text-white)
//    - ยังไม่ถึงวันเช็ค: กล่องสีเทาอ่อน (bg-slate-100 text-slate-800)
// 4. สลับมุมมอง: รายวัน, รายสัปดาห์, รายเดือน
// 5. ปลดการแก้ไขแบนเนอร์ออกจากหน้านี้ (ใช้แบนเนอร์กลางส่วนกลาง)
// 6. การจัดการคาบสอน: เพิ่ม, ลด, ย้ายคาบสอน, และเอาคาบออกเพื่อรอลงคาบสอน (Waiting Pool)

import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
  ChevronDown,
  Download,
  Upload,
  ArrowRightLeft,
  FolderMinus,
  Sparkles,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';
import { AddEditTimetableSlotModal } from '../components/timetable/AddEditTimetableSlotModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
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
const UNASSIGNED_STORAGE_KEY = 'kp_unassigned_matrix_slots';

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

const loadUnassignedSlots = (): TimetableMatrixSlot[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(UNASSIGNED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const DAY_ORDER: Record<string, number> = {
  'จันทร์': 1,
  'อังคาร': 2,
  'พุธ': 3,
  'พฤหัสบดี': 4,
  'ศุกร์': 5,
};

export const TimetableView: React.FC<TimetableViewProps> = ({
  onDeepNavigate,
}) => {
  // ------------------------------------------
  // Core States
  // ------------------------------------------
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [matrixSlots, setMatrixSlots] = useState<TimetableMatrixSlot[]>(loadSavedMatrixSlots);
  const [unassignedSlots, setUnassignedSlots] = useState<TimetableMatrixSlot[]>(loadUnassignedSlots);
  const [selectedSlot, setSelectedSlot] = useState<TimetableMatrixSlot | null>(null);

  // View Mode: 'DAY' (รายวัน), 'WEEK' (รายสัปดาห์), 'MONTH' (รายเดือน)
  const [viewModeTab, setViewModeTab] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [selectedDayTab, setSelectedDayTab] = useState<string>('พฤหัสบดี');
  const [mobileViewMode, setMobileViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Add / Edit Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableMatrixSlot> | null>(null);

  // Move / Swap Slot Modal State
  const [moveSlotTarget, setMoveSlotTarget] = useState<TimetableMatrixSlot | null>(null);
  const [targetMoveDay, setTargetMoveDay] = useState<string>('ศุกร์');
  const [targetMovePeriod, setTargetMovePeriod] = useState<number>(1);

  // Bell Schedule Config
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [, setIsDetailSummaryModalOpen] = useState<boolean>(false);
  const [, setOverrideConfirmConflicts] = useState<
    Array<{ no: number; name: string; leaveReason: string; chosenStatus: string }>
  >([]);

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

  const buildInitialAttendance = (): Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> => {
    const initial: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(stu.name, stu.code);
      initial[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    return initial;
  };

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>
  >(buildInitialAttendance);

  void onDeepNavigate;

  const weekInfo = useMemo(() => computeWeekInfo(weekOffset), [weekOffset]);

  const todayDayKey = 'พฤหัสบดี';
  const todaySlots = useMemo(() => {
    return matrixSlots.filter((s) => s.day === todayDayKey && !s.isFreePeriod && s.subjectCode);
  }, [matrixSlots]);

  const todayTotalPeriods = 6;
  const todayCheckedCount = useMemo(() => {
    return todaySlots.filter((s) => s.status === 'CHECKED' || s.isConducted).length;
  }, [todaySlots]);
  const todayUncheckedCount = Math.max(0, todayTotalPeriods - todayCheckedCount);
  const pendingAssignmentsCount = 8;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ------------------------------------------
  // Slot Status & Uniform Color Tokens Rule:
  // - เช็คแล้ว: กล่องสีเขียวเข้ม (bg-emerald-600 text-white)
  // - ยังไม่เช็ค: กล่องสีแดงเข้ม (bg-rose-600 text-white)
  // - ยังไม่ถึงวันเช็ค: กล่องสีเทาอ่อน (bg-slate-100 text-slate-800)
  // ------------------------------------------
  const getSlotStatus = (slot: TimetableMatrixSlot): 'CHECKED' | 'UNCHECKED' | 'FUTURE' | 'LUNCH' => {
    if (slot.status === 'LUNCH' || slot.isLunchSlot || slot.period === 5) {
      return 'LUNCH';
    }
    if (slot.isFreePeriod || slot.category === 'free' || !slot.subjectCode) {
      return 'FUTURE';
    }
    if (slot.status === 'CHECKED' || slot.isConducted) {
      return 'CHECKED';
    }
    const dayIdx = DAY_ORDER[slot.day] || 1;
    const todayIdx = 4; // พฤหัสบดี
    const currentPeriod = 2;

    if (dayIdx < todayIdx) {
      return 'UNCHECKED'; // วันที่ผ่านมาแล้ว ยังไม่เช็ค -> สีแดงเข้ม
    }
    if (dayIdx === todayIdx) {
      return slot.period <= currentPeriod ? 'UNCHECKED' : 'FUTURE';
    }
    return 'FUTURE'; // ยังไม่ถึงวันเช็ค -> สีเทาอ่อน
  };

  const getSlotBoxStyle = (slot: TimetableMatrixSlot, isLunchRow?: boolean) => {
    if (isLunchRow || slot.status === 'LUNCH') {
      return 'bg-amber-50/70 border-amber-200 text-amber-900';
    }
    if (slot.isFreePeriod || slot.category === 'free' || !slot.subjectCode) {
      return 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:bg-blue-50/30';
    }
    const status = getSlotStatus(slot);
    switch (status) {
      case 'CHECKED':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm';
      case 'UNCHECKED':
        return 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm';
      case 'FUTURE':
      default:
        return 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200/90 shadow-2xs';
    }
  };

  const getSlot = (dayName: string, periodNumber: number): TimetableMatrixSlot | undefined => {
    return matrixSlots.find((s) => s.day === dayName && s.period === periodNumber);
  };

  // ------------------------------------------
  // Excel / CSV Export & Import Handlers
  // ------------------------------------------
  const handleExportCsv = () => {
    const headers = ['วัน', 'คาบที่', 'เวลา', 'รหัสวิชา', 'ชื่อวิชา', 'ห้องเรียน', 'สถานะ'];
    const rows = matrixSlots
      .filter((s) => !s.isFreePeriod && s.subjectCode)
      .map((s) => [
        s.day,
        s.period,
        `"${s.timeRange || ''}"`,
        `"${s.subjectCode || ''}"`,
        `"${s.subjectName || ''}"`,
        `"${s.room || ''}"`,
        s.status || 'UNCHECKED',
      ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ตารางสอน_โรงเรียนกุดจับประชาสรรค์_สัปดาห์ที่_${weekInfo.weekNumber}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกตารางสอนเป็นไฟล์ CSV เรียบร้อย');
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) throw new Error('ไฟล์ว่าง');

        const newMatrix = [...matrixSlots];
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 4) {
            const day = cols[0] as TimetableMatrixSlot['day'];
            const period = parseInt(cols[1], 10);
            const subjectCode = cols[3];
            const subjectName = cols[4] || subjectCode;
            const room = cols[5] || 'ม.3/1';

            if (day && !isNaN(period) && subjectCode) {
              const idx = newMatrix.findIndex((s) => s.day === day && s.period === period);
              const newSlot: TimetableMatrixSlot = {
                id: `slot-imp-${day}-${period}`,
                day,
                period,
                subjectCode,
                subjectName,
                room,
                colorTheme: 'blue',
                status: 'UNCHECKED',
                isFreePeriod: false,
              };
              if (idx >= 0) {
                newMatrix[idx] = newSlot;
              } else {
                newMatrix.push(newSlot);
              }
              importedCount++;
            }
          }
        }

        setMatrixSlots(newMatrix);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(newMatrix));
        }
        showToast(`นำเข้าคาบสอนจากไฟล์เรียบร้อย (${importedCount} คาบ)`);
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบรูปแบบไฟล์ CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ------------------------------------------
  // Interactive Slot Management: Add, Delete, Unassign, Move
  // ------------------------------------------
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
        s.id === slotId ? { ...s, isFreePeriod: true, category: 'free' as const, subjectCode: '', subjectName: '' } : s
      );
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    showToast('ลบรายวิชาออกจากตารางสอนเรียบร้อย');
  };

  // เอาคาบออกเพื่อรอลงคาบสอน (Unassign to Waiting Pool)
  const handleUnassignSlot = (slot: TimetableMatrixSlot) => {
    setUnassignedSlots((prev) => {
      const updated = [...prev.filter((s) => s.id !== slot.id), slot];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNASSIGNED_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setMatrixSlots((prev) => {
      const updated = prev.map((s) =>
        s.id === slot.id
          ? { ...s, isFreePeriod: true, category: 'free' as const, subjectCode: '', subjectName: '' }
          : s
      );
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setSelectedSlot(null);
    showToast(`นำคาบ ${slot.subjectCode} ออกไปพักไว้ที่ "คาบรอลงตาราง" เรียบร้อย`);
  };

  // ย้ายคาบสอน (Move / Swap Slot)
  const handleExecuteMoveSlot = () => {
    if (!moveSlotTarget) return;

    const sourceDay = moveSlotTarget.day;
    const sourcePeriod = moveSlotTarget.period;

    const targetExisting = matrixSlots.find(
      (s) => s.day === targetMoveDay && s.period === targetMovePeriod
    );

    setMatrixSlots((prev) => {
      const updated = prev.map((s) => {
        if (s.day === sourceDay && s.period === sourcePeriod) {
          // แทนที่ตำแหน่งเดิมด้วย target slot หรือกลายเป็น free
          if (targetExisting && !targetExisting.isFreePeriod && targetExisting.subjectCode) {
            return {
              ...targetExisting,
              day: sourceDay,
              period: sourcePeriod,
            };
          }
          return {
            ...s,
            isFreePeriod: true,
            category: 'free' as const,
            subjectCode: '',
            subjectName: '',
          };
        }
        if (s.day === targetMoveDay && s.period === targetMovePeriod) {
          return {
            ...moveSlotTarget,
            day: targetMoveDay as any,
            period: targetMovePeriod,
          };
        }
        return s;
      });

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    showToast(
      `ย้ายคาบ ${moveSlotTarget.subjectCode} จากวัน${sourceDay} คาบที่ ${sourcePeriod} ไปวัน${targetMoveDay} คาบที่ ${targetMovePeriod} สำเร็จ`
    );
    setMoveSlotTarget(null);
    setSelectedSlot(null);
  };

  // กำหนดคาบจาก Waiting Pool ลงตาราง
  const handleAssignWaitingSlot = (waitingSlot: TimetableMatrixSlot, targetDay: string, targetPeriod: number) => {
    const updatedSlot: TimetableMatrixSlot = {
      ...waitingSlot,
      day: targetDay as any,
      period: targetPeriod,
      isFreePeriod: false,
    };
    handleSaveSlot(updatedSlot);

    setUnassignedSlots((prev) => {
      const filtered = prev.filter((s) => s.id !== waitingSlot.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNASSIGNED_STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    });
    showToast(`ลงคาบ ${waitingSlot.subjectCode} ในวัน${targetDay} คาบที่ ${targetPeriod} เรียบร้อย`);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(stu.name, stu.code);
      updated[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    setAttendanceRecords(updated);
    setOverrideConfirmConflicts([]);
  };

  const handleSaveAttendance = () => {
    if (!selectedSlot) return;
    const updatedSlots = matrixSlots.map((s) =>
      s.id === selectedSlot.id ? { ...s, status: 'CHECKED' as const, isConducted: true } : s
    );
    setMatrixSlots(updatedSlots);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updatedSlots));
    }
    showToast(`บันทึกการเช็คชื่อวิชา ${selectedSlot.subjectCode} (${selectedSlot.room}) เรียบร้อย`);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          1. TOP HERO BANNER (แบนเนอร์กลาง ปลดปุ่มแก้ไขส่วนตัวออก)
          ======================================================== */}
      <PageHeroBanner
        title="ตารางสอน"
        subtitle="จัดสรรเวลาและคาบสอน เพื่อให้นักเรียนทุกคนพัฒนาได้อย่างเต็มที่"
        icon={<Calendar className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="ม.3/1"
        tagText="⏱️ คาบ 1 - คาบ 8 • วันจันทร์ - ศุกร์ • ภาคเรียนที่ 1/2569"
        quoteLines={[
          'การตั้งใจทำทุกครั้ง',
          'ช่วยให้เราก้าวหน้าขึ้น',
          'เยาวชนพร้อมสู่อนาคต',
        ]}
      />

      {/* ========================================================
          2. KPI SUMMARY METRIC CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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

        <div
          onClick={() => setIsDetailSummaryModalOpen(true)}
          className="col-span-2 sm:col-span-1 bg-[#EAF5FF] hover:bg-[#DCEEFF] border border-[#CDE5FF] rounded-2xl p-4 shadow-2xs flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-blue-950 block">ดูสถิติรายวิชา</span>
              <span className="text-[11px] font-bold text-blue-600">วิเคราะห์ผล & SAR →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CONTROLS TOOLBAR: Week Selector, View Mode Tabs, Excel Import/Export
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6EEF7] p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Week / Term Selector */}
        <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs font-bold text-blue-950">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <span>สัปดาห์ที่ {weekInfo.weekNumber} / 20 ({weekInfo.dateRangeLabel})</span>
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

        {/* Center: View Switcher (รายวัน, รายสัปดาห์, รายเดือน) */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewModeTab('DAY')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'DAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายวัน
          </button>
          <button
            type="button"
            onClick={() => setViewModeTab('WEEK')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'WEEK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายสัปดาห์
          </button>
          <button
            type="button"
            onClick={() => setViewModeTab('MONTH')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewModeTab === 'MONTH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายเดือน
          </button>
        </div>

        {/* Right: Excel Import / Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            title="ส่งออกตารางสอนเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>ส่งออก Excel</span>
          </button>

          <label
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            title="นำเข้าตารางสอนจากไฟล์ CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>นำเข้า Excel</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportCsv}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Legend Dots (3 Uniform Status Colors: เขียวเข้ม, แดงเข้ม, เทาอ่อน) */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-xs" />
            <span>เช็คแล้ว (กล่องเขียวเข้ม)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 shadow-xs" />
            <span>ยังไม่เช็ค (กล่องแดงเข้ม)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 shadow-xs" />
            <span>ยังไม่ถึงวันเช็ค (กล่องเทาอ่อน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-300 shadow-xs" />
            <span>พักเที่ยง</span>
          </div>
        </div>

        {unassignedSlots.length > 0 && (
          <div className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            <FolderMinus className="w-3.5 h-3.5" />
            <span>มี {unassignedSlots.length} คาบรอลงตาราง</span>
          </div>
        )}
      </div>

      {/* ========================================================
          4. MAIN VIEW CONTAINER (DAY / WEEK / MONTH)
          ======================================================== */}
      {/* 4.1 VIEW: DAY (รายวัน) */}
      {viewModeTab === 'DAY' && (
        <div className="w-full bg-white rounded-3xl border border-[#E6EEF7] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                ตารางสอนประจำวัน{selectedDayTab}
              </h2>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1.5">
              {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayTab(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDayTab === day
                      ? 'bg-blue-600 text-white shadow-xs'
                      : day === todayDayKey
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day} {day === todayDayKey && '(วันนี้)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activePeriods.map((periodDef) => {
              const slot = getSlot(selectedDayTab, periodDef.period);
              const isLunch = periodDef.period === 5;

              if (isLunch) {
                return (
                  <div
                    key={periodDef.period}
                    className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍴</span>
                      <div>
                        <div>พักกลางวัน</div>
                        <div className="text-[11px] font-normal text-amber-800">11:50 - 12:40</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[10px]">
                      พัก
                    </span>
                  </div>
                );
              }

              if (!slot || slot.isFreePeriod || !slot.subjectCode) {
                return (
                  <div
                    key={periodDef.period}
                    onClick={() => handleOpenFreeSlot(selectedDayTab, periodDef.period)}
                    className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-colors cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                      <span>คาบที่ {periodDef.period}</span>
                      <span>{periodDef.timeRange}</span>
                    </div>
                    <div className="text-center text-xs font-bold text-slate-400 py-3">
                      + คลิกเพื่อเพิ่มวิชาสอน
                    </div>
                  </div>
                );
              }

              const boxStyle = getSlotBoxStyle(slot);
              const status = getSlotStatus(slot);

              return (
                <div
                  key={periodDef.period}
                  onClick={() => handleOpenSlot(slot)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${boxStyle}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs opacity-80 font-bold">
                        คาบที่ {slot.period} ({periodDef.timeRange})
                      </div>
                      <div className="text-base font-black truncate mt-1">
                        {slot.subjectCode} {slot.subjectName && `• ${slot.subjectName}`}
                      </div>
                      <div className="text-xs opacity-90 font-semibold mt-0.5">
                        {slot.room}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        status === 'CHECKED'
                          ? 'bg-white/20 text-white border border-white/30'
                          : status === 'UNCHECKED'
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {status === 'CHECKED' ? '✓ เช็คแล้ว' : status === 'UNCHECKED' ? '⚠️ ยังไม่เช็ค' : 'รอเช็ค'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
                    <span className="opacity-80">คลิกเพื่อจัดการ / เช็คชื่อ</span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-bold text-[11px]"
                    >
                      เช็คชื่อ →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4.2 VIEW: WEEK (รายสัปดาห์ - ตารางรวม 5 วัน) */}
      {viewModeTab === 'WEEK' && (
        <div className="w-full bg-white rounded-3xl border border-[#E6EEF7] p-4 sm:p-6 shadow-2xs space-y-4 overflow-hidden">
          {/* Mobile view switch */}
          <div className="flex md:hidden items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">สลับโหมดมือถือ:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMobileViewMode('CARDS')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  mobileViewMode === 'CARDS' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                การ์ด
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('TABLE')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  mobileViewMode === 'TABLE' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                ตารางเต็ม
              </button>
            </div>
          </div>

          <div
            className={`overflow-x-auto -mx-4 sm:mx-0 ${
              mobileViewMode === 'CARDS' ? 'hidden md:block' : 'block'
            }`}
          >
            <table className="w-full text-center text-xs border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[#E6EEF7]">
                  <th className="py-3.5 px-3 w-28 text-left text-slate-600 font-extrabold text-xs">
                    เวลา / วัน
                  </th>
                  {weekInfo.days.map((dayObj) => {
                    const isThursday = dayObj.key === 'พฤหัสบดี';
                    return (
                      <th
                        key={dayObj.key}
                        className={`py-3 px-2 min-w-[130px] ${
                          isThursday ? 'bg-blue-50/40 text-blue-900 font-black' : 'text-slate-700 font-bold'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{dayObj.key}</span>
                          {isThursday && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.2 rounded-full font-bold mt-0.5">
                              วันนี้
                            </span>
                          )}
                        </div>
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
                      {/* Time Column */}
                      <td className="py-3.5 px-3 text-left font-bold text-slate-600 text-xs align-middle bg-slate-50/40">
                        <div>{periodDef.timeRange}</div>
                        <div className="text-[10px] text-slate-400 font-medium">({periodDef.label})</div>
                      </td>

                      {/* Lunch Slot */}
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
                        /* Mon - Fri Period Slots */
                        weekInfo.days.map((dayObj) => {
                          const slot = getSlot(dayObj.key, periodDef.period);
                          const isThursday = dayObj.key === 'พฤหัสบดี';
                          const colBg = isThursday ? 'bg-blue-50/20' : '';

                          if (!slot || slot.isFreePeriod || !slot.subjectCode) {
                            return (
                              <td
                                key={dayObj.key}
                                onClick={() => handleOpenFreeSlot(dayObj.key, periodDef.period)}
                                className={`p-1.5 align-middle cursor-pointer group ${colBg}`}
                                title="คลิกเพื่อเพิ่มรายวิชาในคาบนี้"
                              >
                                <div className="h-28 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 hover:bg-blue-50/40 hover:border-blue-300 transition-colors flex items-center justify-center text-slate-300 group-hover:text-blue-500 text-xs font-bold">
                                  + เพิ่มวิชา
                                </div>
                              </td>
                            );
                          }

                          const boxStyle = getSlotBoxStyle(slot);
                          const status = getSlotStatus(slot);

                          return (
                            <td
                              key={dayObj.key}
                              onClick={() => handleOpenSlot(slot)}
                              className={`p-1.5 align-middle cursor-pointer group ${colBg}`}
                            >
                              <div
                                className={`h-28 w-full p-2.5 rounded-2xl border flex flex-col justify-between text-left transition-all hover:scale-101 hover:shadow-md ${boxStyle}`}
                              >
                                {/* Top: Code & Room */}
                                <div>
                                  <div className="font-black text-sm tracking-tight truncate">
                                    {slot.subjectCode}
                                  </div>
                                  <div className="text-[11px] font-semibold opacity-90 truncate">
                                    {slot.room}
                                  </div>
                                </div>

                                {/* Subject Name */}
                                <div className="text-[11px] font-medium opacity-85 truncate">
                                  {slot.subjectName || slot.subjectCode}
                                </div>

                                {/* Bottom Badge */}
                                <div className="pt-1 flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      status === 'CHECKED'
                                        ? 'bg-white/20 text-white'
                                        : status === 'UNCHECKED'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {status === 'CHECKED' ? '✓ เช็คแล้ว' : status === 'UNCHECKED' ? '⚠️ ยังไม่เช็ค' : 'รอเช็ค'}
                                  </span>
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
        </div>
      )}

      {/* 4.3 VIEW: MONTH (รายเดือน) */}
      {viewModeTab === 'MONTH' && (
        <div className="w-full bg-white rounded-3xl border border-[#E6EEF7] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                ปฏิทินตารางสอนรายเดือน (ตุลาคม 2569)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              แสดงสถิติจำนวนคาบสอนและการเช็คชื่อตลอดทั้งเดือน
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((w) => (
              <div key={w} className="font-bold text-slate-500 py-1 bg-slate-50 rounded-xl">
                {w}
              </div>
            ))}

            {/* October 2026 Sample Day Cells */}
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 3; // 1 Oct is Thursday (index 4)
              const isValid = dayNum >= 1 && dayNum <= 31;
              const isSchoolDay = i % 7 >= 1 && i % 7 <= 5 && isValid;
              const isToday = dayNum === 2;
              const isPast = dayNum < 2 && isValid;

              if (!isValid) {
                return <div key={i} className="h-20 bg-slate-50/30 rounded-xl" />;
              }

              return (
                <div
                  key={i}
                  className={`h-22 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : isSchoolDay
                      ? 'border-slate-200 bg-white hover:border-blue-300'
                      : 'border-slate-100 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isToday ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                        วันนี้
                      </span>
                    )}
                  </div>

                  {isSchoolDay ? (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-700">สอน 6 คาบ</div>
                      {isPast ? (
                        <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                          ✓ เช็คครบ
                        </span>
                      ) : isToday ? (
                        <span className="inline-block text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                          กำลังสอน (3/6)
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                          รอสอน
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">วันหยุด</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          5. UNASSIGNED WAITING POOL (คาบที่รอจัดตาราง)
          ======================================================== */}
      {unassignedSlots.length > 0 && (
        <div className="w-full bg-amber-50/60 rounded-3xl border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderMinus className="w-4 h-4 text-amber-700" />
              <h3 className="font-extrabold text-amber-950 text-sm sm:text-base">
                คาบที่รอจัดตาราง (Waiting Pool) - {unassignedSlots.length} รายการ
              </h3>
            </div>
            <span className="text-xs text-amber-800">
              คลิกที่คาบเพื่อเลือกลงตารางสอนในคาบว่าง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {unassignedSlots.map((slot) => (
              <div
                key={slot.id}
                className="p-3 bg-white rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-black text-slate-900">{slot.subjectCode}</div>
                  <div className="text-[11px] text-slate-500 truncate">{slot.subjectName || slot.room}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetDay = prompt('เลือกวันที่ต้องการลง (จันทร์, อังคาร, พุธ, พฤหัสบดี, ศุกร์):', 'พฤหัสบดี');
                    const targetPeriodStr = prompt('เลือกคาบที่ (1 - 8):', '3');
                    if (targetDay && targetPeriodStr) {
                      handleAssignWaitingSlot(slot, targetDay, parseInt(targetPeriodStr, 10));
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  + ลงตาราง
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: ATTENDANCE ROLL-CALL & SLOT ACTIONS
          ======================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white">
                    คาบที่ {selectedSlot.period}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {selectedSlot.day} • {selectedSlot.timeRange || '08:30 - 09:20'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {selectedSlot.subjectCode} : {selectedSlot.subjectName || 'รายวิชา'}
                </h2>
                <p className="text-xs text-slate-500">
                  ห้อง {selectedSlot.room} • นักเรียนทั้งหมด {studentsList.length} คน
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slot Management Actions (ย้ายคาบ, เอาคาบออกเพื่อรอลงตาราง) */}
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs flex-wrap">
              <span className="font-bold text-slate-700">การจัดการคาบ:</span>
              <button
                type="button"
                onClick={() => {
                  setMoveSlotTarget(selectedSlot);
                  setTargetMoveDay(selectedSlot.day === 'ศุกร์' ? 'จันทร์' : 'ศุกร์');
                  setTargetMovePeriod(selectedSlot.period);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-blue-700 font-bold cursor-pointer transition-colors shadow-2xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>ย้ายคาบสอน</span>
              </button>

              <button
                type="button"
                onClick={() => handleUnassignSlot(selectedSlot)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 font-bold cursor-pointer transition-colors shadow-2xs"
              >
                <FolderMinus className="w-3.5 h-3.5" />
                <span>เอาคาบออกเพื่อรอลงตาราง</span>
              </button>
            </div>

            {/* Quick Roll-Call Toolbar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">รายชื่อนักเรียน:</span>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                ✓✓ มาครบทุกคน
              </button>
            </div>

            {/* Students List with Status Radio */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {studentsList.map((stu) => {
                const currentStatus = attendanceRecords[stu.no] || 'PRESENT';
                return (
                  <div
                    key={stu.no}
                    className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{stu.no}. {stu.name}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">({stu.code})</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      {(['PRESENT', 'LATE', 'LEAVE', 'ABSENT'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            setAttendanceRecords((prev) => ({ ...prev, [stu.no]: st }))
                          }
                          className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                            currentStatus === st
                              ? st === 'PRESENT'
                                ? 'bg-emerald-600 text-white'
                                : st === 'LATE'
                                ? 'bg-amber-500 text-white'
                                : st === 'LEAVE'
                                ? 'bg-blue-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {st === 'PRESENT' ? 'มา' : st === 'LATE' ? 'สาย' : st === 'LEAVE' ? 'ลา' : 'ขาด'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Save Button */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md cursor-pointer transition-colors"
              >
                💾 บันทึกการเช็คชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: MOVE / SWAP SLOT MODAL
          ======================================================== */}
      {moveSlotTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ย้ายคาบสอน: {moveSlotTarget.subjectCode}
                </h3>
                <p className="text-xs text-slate-500">
                  ปัจจุบัน: วัน{moveSlotTarget.day} คาบที่ {moveSlotTarget.period}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoveSlotTarget(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ย้ายไปวัน:</label>
                <select
                  value={targetMoveDay}
                  onChange={(e) => setTargetMoveDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'].map((d) => (
                    <option key={d} value={d}>
                      วัน{d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ย้ายไปคาบที่:</label>
                <select
                  value={targetMovePeriod}
                  onChange={(e) => setTargetMovePeriod(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>
                      คาบที่ {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMoveSlotTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteMoveSlot}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                ยืนยันการย้ายคาบ
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
