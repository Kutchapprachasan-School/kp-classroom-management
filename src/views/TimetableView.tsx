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
  Download,
  Upload,
  ArrowRightLeft,
  FolderMinus,
  Sparkles,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';
import { AddEditTimetableSlotModal } from '../components/timetable/AddEditTimetableSlotModal';
import { AssignWaitingSlotModal } from '../components/timetable/AssignWaitingSlotModal';
import {
  getSubjectIcon,
  renderSubjectIconBadge,
  type SubjectIconConfig,
} from '../config/subjectIcons';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import type { SchoolUserRole } from '../config/schoolRoles';
import {
  bellScheduleService,
  BELL_SCHEDULE_UPDATED_EVENT,
  type SchoolBellScheduleConfig,
} from '../services/bellScheduleService';
import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
  type AcademicTermRecord,
  type DayOfWeek,
} from '../services/academicCalendarService';
import { coursesCurriculumService } from '../services/coursesCurriculumService';
import { teacherCourseAssignmentService } from '../services/teacherCourseAssignmentService';
import { studentService } from '../services/studentService';
import { classroomService } from '../services/classroomService';
import {
  calendarEventStorageService,
  getMatrixStorageKey,
} from '../services/calendarEventStorageService';
import { authService } from '../services/authService';
import { attendanceCorrelationService } from '../services/attendanceCorrelationService';
import { attendanceService } from '../services/attendanceService';

import {
  type TimetableColorTheme,
  type TimetableMatrixSlot,
  type TaskWidgetItem,
  type CalendarEventItem,
  type WeekDayInfo,
  type ComputedWeekInfo,
  computeWeekInfo,
  getBangkokDayName,
  getBangkokNow,
  getBangkokTodayString,
  formatThaiDateShort,
} from '../utils/timetableDateUtils';

export type {
  TimetableColorTheme,
  TimetableMatrixSlot,
  TaskWidgetItem,
  CalendarEventItem,
  WeekDayInfo,
  ComputedWeekInfo,
};

interface TimetableViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
  onNavigateToAssignments?: () => void;
  onNavigateToCalendar?: () => void;
  activeRole?: SchoolUserRole;
}

const loadSavedMatrixSlots = (teacherId?: string): TimetableMatrixSlot[] => {
  return calendarEventStorageService.loadMatrixSlots(teacherId);
};

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  onDeepNavigate,
}) => {
  const currentUser = authService.getCurrentUser();
  const currentTeacherId = currentUser?.id;
  const currentTeacherName = currentUser?.name;

  // ------------------------------------------
  // Core States (ตารางสอนแยกรายบุคคล - ของใครของมัน)
  // ------------------------------------------
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [matrixSlots, setMatrixSlots] = useState<TimetableMatrixSlot[]>(() =>
    loadSavedMatrixSlots(currentTeacherId)
  );

  const [activeTerm, setActiveTerm] = useState<AcademicTermRecord | null>(() =>
    academicCalendarService.getActiveTerm()
  );

  useEffect(() => {
    const handleCalendarUpdate = () => {
      setActiveTerm(academicCalendarService.getActiveTerm());
    };
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    return () => {
      window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    };
  }, []);

  // คำนวณ Waiting Pool โดยตรงจากหลักสูตรที่ครูท่านนี้ลงทะเบียนไว้เท่านั้น
  const unassignedSlots = useMemo(() => {
    return coursesCurriculumService.getCurriculumWaitingPoolSlots(
      matrixSlots,
      activeTerm ? String(activeTerm.year) : undefined,
      activeTerm ? String(activeTerm.semesterNo) : undefined,
      currentUser?.role !== 'ADMIN' ? (currentTeacherId || currentTeacherName) : undefined
    );
  }, [matrixSlots, activeTerm, currentTeacherId, currentTeacherName, currentUser]);

  const [selectedSlot, setSelectedSlot] = useState<TimetableMatrixSlot | null>(null);
  const [assignWaitingSlotTarget, setAssignWaitingSlotTarget] = useState<TimetableMatrixSlot | null>(null);

  // View Mode: 'DAY' (รายวัน), 'WEEK' (รายสัปดาห์), 'MONTH' (รายเดือน)
  const [viewModeTab, setViewModeTab] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [selectedDayTab, setSelectedDayTab] = useState<string>(() =>
    calendarEventStorageService.getTodayDayKey()
  );
  const [calendarDate, setCalendarDate] = useState<Date>(() => getBangkokNow());
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
      const newConfig = custom.detail || bellScheduleService.getConfig();
      setBellConfig(newConfig);
      setMatrixSlots((prev) => {
        const synced = bellScheduleService.syncMatrixSlotsWithBellSchedule(prev, newConfig);
        const sanitized = coursesCurriculumService.sanitizeMatrixSlotsWithCurriculum(synced);
        if (typeof window !== 'undefined' && window.localStorage) {
          const scopedKey = getMatrixStorageKey(currentTeacherId);
          window.localStorage.setItem(scopedKey, JSON.stringify(sanitized));
          window.dispatchEvent(new CustomEvent('kp_matrix_slots_updated', { detail: sanitized }));
        }
        return sanitized;
      });
    };
    window.addEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    return () => {
      window.removeEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    };
  }, [currentTeacherId]);

  // ซิงค์การเปลี่ยนแปลงคาบสอนจากหน้าอื่น (เช่น การเช็คชื่อจากหน้าหลัก) แบบเรียลไทม์
  useEffect(() => {
    const handleSlotsSync = (e: Event) => {
      const custom = e as CustomEvent<TimetableMatrixSlot[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setMatrixSlots(custom.detail);
      } else {
        setMatrixSlots(loadSavedMatrixSlots(currentTeacherId));
      }
    };
    window.addEventListener('kp_matrix_slots_updated', handleSlotsSync);
    window.addEventListener('storage', handleSlotsSync);
    return () => {
      window.removeEventListener('kp_matrix_slots_updated', handleSlotsSync);
      window.removeEventListener('storage', handleSlotsSync);
    };
  }, [currentTeacherId]);

  const saveMatrixSlotsWithDispatch = (updated: TimetableMatrixSlot[]) => {
    const stamped = updated.map((s) => ({
      ...s,
      teacherId: s.teacherId || currentTeacherId,
      teacherName: s.teacherName || currentTeacherName,
    }));
    setMatrixSlots(stamped);
    if (typeof window !== 'undefined' && window.localStorage) {
      const scopedKey = getMatrixStorageKey(currentTeacherId);
      window.localStorage.setItem(scopedKey, JSON.stringify(stamped));
      window.dispatchEvent(new CustomEvent('kp_matrix_slots_updated', { detail: stamped }));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const activeTimelineRows = useMemo(() => {
    return bellScheduleService.generateBellScheduleTimeline(bellConfig).filter(
      (t) => t.type === 'PERIOD' || t.type === 'LUNCH'
    );
  }, [bellConfig]);

  const teachingPeriods = useMemo(() => {
    return activeTimelineRows.filter((r) => r.type === 'PERIOD' && r.periodNumber !== undefined);
  }, [activeTimelineRows]);

  const activePeriods = useMemo(() => {
    return activeTimelineRows.map((t) => ({
      id: t.id,
      period: t.periodNumber,
      timeRange: t.timeRange,
      label: t.label,
      isLunch: t.isLunch,
      type: t.type,
    }));
  }, [activeTimelineRows]);

  // Modals state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedSlotDateIso, setSelectedSlotDateIso] = useState<string>('');
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState<number>(0);
  const [, setIsDetailSummaryModalOpen] = useState<boolean>(false);
  const [, setOverrideConfirmConflicts] = useState<
    Array<{ no: number; name: string; leaveReason: string; chosenStatus: string }>
  >([]);

  // Sync attendance updates from other views or local operations
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      setAttendanceRefreshKey((k) => k + 1);
    };
    window.addEventListener('kp_period_attendance_updated', handleAttendanceUpdate);
    window.addEventListener('storage', handleAttendanceUpdate);
    return () => {
      window.removeEventListener('kp_period_attendance_updated', handleAttendanceUpdate);
      window.removeEventListener('storage', handleAttendanceUpdate);
    };
  }, []);

  // Dynamic Student Roll-Call State inside Modal from studentService
  const studentsList = useMemo(() => {
    if (!selectedSlot?.room) return [];
    const cleanRoom = selectedSlot.room.split('•')[0].replace(/ห้อง/g, '').trim();
    const allRooms = classroomService.getClassroomsSync();
    const matched = allRooms.find(
      (r) => r.name === cleanRoom || r.roomNumber === cleanRoom || r.id === cleanRoom
    );
    const roomId = matched?.id || (cleanRoom ? `room-${cleanRoom.replace(/[^0-9-]/g, '')}` : '');
    const loaded = studentService.getStudents(roomId);
    if (loaded && loaded.length > 0) {
      return loaded.map((s, idx) => ({
        id: s.id,
        no: s.no || idx + 1,
        code: s.code,
        name: s.name,
      }));
    }
    return [];
  }, [selectedSlot]);

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>
  >({});

  useEffect(() => {
    if (studentsList.length > 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
      for (const stu of studentsList) {
        const morning = studentAffairsCouncilService.getMorningStatusForStudent(stu.name, stu.code);
        const stuKey = stu.code || stu.id || String(stu.no);
        initial[stuKey] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
      }
      setAttendanceRecords(initial);
    } else {
      setAttendanceRecords({});
    }
  }, [studentsList]);

  void onDeepNavigate;

  const weekInfo = useMemo(() => computeWeekInfo(weekOffset, activeTerm), [weekOffset, activeTerm]);

  const todayDayKey = getBangkokDayName();
  const todayTeachingSlots = useMemo(() => {
    return matrixSlots.filter(
      (s) => s.day === todayDayKey && !s.isFreePeriod && !s.isLunchSlot && s.subjectCode && s.subjectCode.trim() !== ''
    );
  }, [matrixSlots, todayDayKey]);

  const todayTotalPeriods = todayTeachingSlots.length;
  const todayCheckedCount = useMemo(() => {
    const todayIso = getBangkokTodayString();
    return todayTeachingSlots.filter((s) =>
      attendanceCorrelationService.hasPeriodAttendance(s.subjectCode, s.room, todayIso, s.period)
    ).length;
  }, [todayTeachingSlots, attendanceRefreshKey]);
  const todayUncheckedCount = Math.max(0, todayTotalPeriods - todayCheckedCount);
  const checkedPercent = todayTotalPeriods > 0 ? Math.round((todayCheckedCount / todayTotalPeriods) * 100) : 0;
  const uncheckedPercent = todayTotalPeriods > 0 ? Math.round((todayUncheckedCount / todayTotalPeriods) * 100) : 0;

  const pendingAssignmentsCount = useMemo(() => {
    try {
      return teacherCourseAssignmentService.getGradingQueue().filter((q) => q.status === 'PENDING_REVIEW').length;
    } catch {
      return 0;
    }
  }, []);

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
  const getSlotStatus = (
    slot: TimetableMatrixSlot,
    targetDateIso?: string
  ): 'CHECKED' | 'UNCHECKED' | 'FUTURE' | 'LUNCH' => {
    if (slot.status === 'LUNCH' || slot.isLunchSlot || slot.subjectCode === 'พักกลางวัน') {
      return 'LUNCH';
    }
    if (slot.isFreePeriod || slot.category === 'free' || !slot.subjectCode) {
      return 'FUTURE';
    }

    const effectiveDate = targetDateIso || getBangkokTodayString();
    const todayIso = getBangkokTodayString();
    const currentPeriod = bellScheduleService.getCurrentPeriodNumber();

    // 1. ตรวจสอบการเช็คชื่อจริงใน attendanceCorrelationService ประจำวันและคาบนั้น
    const isChecked = attendanceCorrelationService.hasPeriodAttendance(
      slot.subjectCode,
      slot.room,
      effectiveDate,
      slot.period
    );

    if (isChecked) {
      return 'CHECKED';
    }

    // 2. วันที่ผ่านมาแล้ว ยังไม่เช็คชื่อ -> สีแดงเข้ม (UNCHECKED)
    if (effectiveDate < todayIso) {
      return 'UNCHECKED';
    }

    // 3. วันนี้
    if (effectiveDate === todayIso) {
      return slot.period <= currentPeriod ? 'UNCHECKED' : 'FUTURE';
    }

    // 4. วันในอนาคต (สัปดาห์ที่ 2 เป็นต้นไป หรือวันข้างหน้า) -> สีเทาอ่อน (FUTURE)
    return 'FUTURE';
  };

  const getSlotBoxStyle = (
    slot: TimetableMatrixSlot,
    isLunchRow?: boolean,
    targetDateIso?: string
  ) => {
    if (isLunchRow || slot.status === 'LUNCH') {
      return 'bg-amber-50/70 border-amber-200 text-amber-900';
    }
    if (slot.isFreePeriod || slot.category === 'free' || !slot.subjectCode) {
      return 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:bg-blue-50/30';
    }
    const status = getSlotStatus(slot, targetDateIso);
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
            const room = cols[5] || '';

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

        saveMatrixSlotsWithDispatch(newMatrix);
        showToast(`นำเข้าคาบสอนจากไฟล์เรียบร้อย (${importedCount} คาบ)`);
      } catch {
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบรูปแบบไฟล์ CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ------------------------------------------
  // Interactive Slot Management: Add, Delete, Unassign, Move
  // ------------------------------------------
  const handleOpenSlot = (slot: TimetableMatrixSlot, targetDateIso?: string) => {
    if (slot.isFreePeriod || slot.category === 'free' || slot.status === 'LUNCH') {
      return;
    }
    setOverrideConfirmConflicts([]);
    setSelectedSlot(slot);
    setSelectedSlotDateIso(targetDateIso || getBangkokTodayString());
  };

  const handleOpenFreeSlot = (day: string, period: number) => {
    setEditingSlot({
      day: day as TimetableMatrixSlot['day'],
      period,
      room: '',
      colorTheme: 'blue',
      isFreePeriod: false,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveSlot = (slotToSave: TimetableMatrixSlot) => {
    // ตรวจสอบโควตาตามหน่วยกิตก่อนบันทึก (1.5 หน่วยกิต = 3 คาบ/ห้อง, 1.0 หน่วยกิต = 2 คาบ/ห้อง)
    if (!slotToSave.isFreePeriod && slotToSave.subjectCode) {
      const quotaCheck = coursesCurriculumService.canAssignPeriod(
        matrixSlots,
        slotToSave.subjectCode,
        slotToSave.room,
        slotToSave.id,
        activeTerm ? String(activeTerm.year) : undefined,
        activeTerm ? String(activeTerm.semesterNo) : undefined
      );
      if (!quotaCheck.allowed) {
        showToast(quotaCheck.reason || 'วิชานี้ลงครบโควตาตามหน่วยกิตแล้ว ไม่สามารถลงเกินได้');
        return;
      }
    }

    const dynamicTime = bellScheduleService.getTimeRangeForPeriod(slotToSave.period);
    const finalizedSlot: TimetableMatrixSlot = {
      ...slotToSave,
      timeRange: dynamicTime || slotToSave.timeRange || `คาบที่ ${slotToSave.period}`,
      isLunchSlot: false,
    };

    const existingIdx = matrixSlots.findIndex(
      (s) => s.id === finalizedSlot.id || (s.day === finalizedSlot.day && s.period === finalizedSlot.period)
    );
    let updated: TimetableMatrixSlot[];
    if (existingIdx >= 0) {
      updated = [...matrixSlots];
      updated[existingIdx] = finalizedSlot;
    } else {
      updated = [...matrixSlots, finalizedSlot];
    }
    const synced = bellScheduleService.syncMatrixSlotsWithBellSchedule(updated);
    const sanitized = coursesCurriculumService.sanitizeMatrixSlotsWithCurriculum(synced);
    saveMatrixSlotsWithDispatch(sanitized);
    showToast(`บันทึกรายวิชา ${finalizedSlot.subjectCode} (${finalizedSlot.day} คาบที่ ${finalizedSlot.period}) สำเร็จ`);
  };

  const handleDeleteSlot = (slotId: string) => {
    const updated = matrixSlots.map((s) =>
      s.id === slotId ? { ...s, isFreePeriod: true, category: 'free' as const, subjectCode: '', subjectName: '' } : s
    );
    saveMatrixSlotsWithDispatch(updated);
    showToast('ลบรายวิชาออกจากตารางสอนเรียบร้อย');
  };

  // เอาคาบออกเพื่อรอลงคาบสอน (Unassign to Waiting Pool)
  const handleUnassignSlot = (slot: TimetableMatrixSlot) => {
    const updated = matrixSlots.map((s) =>
      s.id === slot.id
        ? { ...s, isFreePeriod: true, category: 'free' as const, subjectCode: '', subjectName: '' }
        : s
    );
    saveMatrixSlotsWithDispatch(updated);
    setSelectedSlot(null);
    showToast(`นำคาบ ${slot.subjectCode} (${slot.room}) ออกไปพักไว้ที่ "คาบรอลงตาราง" เรียบร้อย`);
  };

  // ย้ายคาบสอน (Move / Swap Slot)
  const handleExecuteMoveSlot = () => {
    if (!moveSlotTarget) return;

    const sourceDay = moveSlotTarget.day;
    const sourcePeriod = moveSlotTarget.period;
    const sourceTimeRange = bellScheduleService.getTimeRangeForPeriod(sourcePeriod);
    const targetTimeRange = bellScheduleService.getTimeRangeForPeriod(targetMovePeriod);

    const targetExisting = matrixSlots.find(
      (s) => s.day === targetMoveDay && s.period === targetMovePeriod
    );

    const updated = matrixSlots.map((s) => {
      if (s.day === sourceDay && s.period === sourcePeriod) {
        // แทนที่ตำแหน่งเดิมด้วย target slot หรือกลายเป็น free
        if (targetExisting && !targetExisting.isFreePeriod && targetExisting.subjectCode) {
          return {
            ...targetExisting,
            day: sourceDay,
            period: sourcePeriod,
            timeRange: sourceTimeRange || targetExisting.timeRange,
          };
        }
        return {
          ...s,
          isFreePeriod: true,
          category: 'free' as const,
          subjectCode: '',
          subjectName: '',
          timeRange: sourceTimeRange || s.timeRange,
        };
      }
      if (s.day === targetMoveDay && s.period === targetMovePeriod) {
        return {
          ...moveSlotTarget,
          day: targetMoveDay as any,
          period: targetMovePeriod,
          timeRange: targetTimeRange || moveSlotTarget.timeRange,
        };
      }
      return s;
    });

    const synced = bellScheduleService.syncMatrixSlotsWithBellSchedule(updated);
    saveMatrixSlotsWithDispatch(synced);

    showToast(
      `ย้ายคาบ ${moveSlotTarget.subjectCode} จากวัน${sourceDay} คาบที่ ${sourcePeriod} ไปวัน${targetMoveDay} คาบที่ ${targetMovePeriod} สำเร็จ`
    );
    setMoveSlotTarget(null);
    setSelectedSlot(null);
  };

  // กำหนดคาบจาก Waiting Pool ลงตาราง พร้อมห้องเรียนและโลโก้ที่ปรับแต่ง
  const handleAssignWaitingSlot = (
    waitingSlot: TimetableMatrixSlot,
    targetDay: string,
    targetPeriod: number,
    targetRoom?: string,
    targetIcon?: SubjectIconConfig,
    targetTimeRange?: string
  ) => {
    const finalRoom = targetRoom?.trim() || waitingSlot.room;
    const quotaCheck = coursesCurriculumService.canAssignPeriod(
      matrixSlots,
      waitingSlot.subjectCode,
      finalRoom,
      undefined,
      activeTerm ? String(activeTerm.year) : undefined,
      activeTerm ? String(activeTerm.semesterNo) : undefined
    );
    if (!quotaCheck.allowed) {
      showToast(quotaCheck.reason || 'วิชานี้ลงครบโควตาตามหน่วยกิตแล้ว ไม่สามารถลงเกินได้');
      return;
    }

    const periodTimeRange =
      targetTimeRange ||
      bellScheduleService.getTimeRangeForPeriod(targetPeriod) ||
      `คาบที่ ${targetPeriod}`;

    const updatedSlot: TimetableMatrixSlot = {
      ...waitingSlot,
      id: `slot-${targetDay}-${targetPeriod}`,
      day: targetDay as any,
      period: targetPeriod,
      timeRange: periodTimeRange,
      room: finalRoom,
      subjectIcon: targetIcon?.id || waitingSlot.subjectIcon,
      isFreePeriod: false,
      isLunchSlot: false,
      status: 'UNCHECKED',
    };
    handleSaveSlot(updatedSlot);
    setAssignWaitingSlotTarget(null);
  };


  const handleMarkAllPresent = () => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(stu.name, stu.code);
      const stuKey = stu.code || stu.id || String(stu.no);
      updated[stuKey] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    setAttendanceRecords(updated);
    setOverrideConfirmConflicts([]);
  };

  const handleSaveAttendance = () => {
    if (!selectedSlot) return;
    const targetDate = selectedSlotDateIso || getBangkokTodayString();
    const cleanRoom = selectedSlot.room.split('•')[0].replace(/ห้อง/g, '').trim();

    if (studentsList.length > 0) {
      const recordsToSave = studentsList.map((stu, stuIdx) => {
        const stuKey = stu.code || stu.id || `stu-${stu.no}-${stuIdx}`;
        const chosenStatus = attendanceRecords[stuKey] || 'PRESENT';
        return {
          id: `period_${targetDate}_${selectedSlot.period}_${stu.id || stu.code}`,
          date: targetDate,
          classroomId: cleanRoom,
          courseCode: selectedSlot.subjectCode,
          courseName: selectedSlot.subjectName || selectedSlot.subjectCode,
          periodNo: selectedSlot.period,
          studentId: stu.id,
          studentCode: stu.code,
          studentName: stu.name,
          status: chosenStatus as any,
          source: 'MANUAL' as const,
          isOverridden: false,
          markedAt: new Date().toISOString(),
        };
      });

      attendanceCorrelationService.savePeriodRecords(recordsToSave);

      void attendanceService.markWholeClassroom({
        studentIds: studentsList.map((s) => s.id),
        classroomId: cleanRoom,
        date: targetDate,
        period: selectedSlot.period,
        status: 'PRESENT',
        recordedBy: currentTeacherId || 'TEACHER',
      });
    }

    setAttendanceRefreshKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent('kp_period_attendance_updated'));
    window.dispatchEvent(new Event('storage'));

    showToast(`บันทึกการเช็คชื่อวิชา ${selectedSlot.subjectCode} (${selectedSlot.room}) ประจำวันที่ ${formatThaiDateShort(targetDate)} เรียบร้อย`);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          1. TOP HERO BANNER (2 บรรทัด กระชับ ชัดเจน)
          ======================================================== */}
      <PageHeroBanner
        title="ตารางสอน (Teacher Timetable)"
        subtitle="ตรวจสอบรายวิชาที่สอนในแต่ละวัน และจัดการคาบเรียนอย่างเป็นระบบ"
        icon={<Calendar className="w-7 h-7 text-blue-600" />}
        quoteText="การจัดสรรเวลาอย่างมีคุณค่า เพื่อการเรียนรู้ที่มีประสิทธิภาพ"
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
            {checkedPercent}%
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
            {uncheckedPercent}%
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
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Active Term Pill */}
          <button
            type="button"
            onClick={() => onDeepNavigate ? onDeepNavigate({ view: 'settings' }) : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
            title="คลิกเพื่อไปที่ตั้งค่าปีการศึกษา & ภาคเรียน"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ภาคเรียนที่ {activeTerm ? `${activeTerm.semesterNo}/${activeTerm.year}` : '1/2569'}</span>
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
              if (periodDef.isLunch) {
                return (
                  <div
                    key={periodDef.id || `lunch-${periodDef.timeRange}`}
                    className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍴</span>
                      <div>
                        <div>{periodDef.label}</div>
                        <div className="text-[11px] font-normal text-amber-800">{periodDef.timeRange}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[10px]">
                      พัก
                    </span>
                  </div>
                );
              }

              const pNum = periodDef.period || 1;
              const slot = getSlot(selectedDayTab, pNum);
              const dayObj = weekInfo.days.find((d) => d.key === selectedDayTab);
              const targetDateIso = dayObj?.isoDate || getBangkokTodayString();

              if (!slot || slot.isFreePeriod || !slot.subjectCode) {
                return (
                  <div
                    key={periodDef.id || `period-${pNum}`}
                    onClick={() => handleOpenFreeSlot(selectedDayTab, pNum)}
                    className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-colors cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                      <span>{periodDef.label}</span>
                      <span>{periodDef.timeRange}</span>
                    </div>
                    <div className="text-center text-xs font-bold text-slate-400 py-3">
                      + คลิกเพื่อเพิ่มวิชาสอน
                    </div>
                  </div>
                );
              }

              const boxStyle = getSlotBoxStyle(slot, false, targetDateIso);
              const status = getSlotStatus(slot, targetDateIso);

              return (
                <div
                  key={periodDef.id || `period-${pNum}`}
                  onClick={() => handleOpenSlot(slot, targetDateIso)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${boxStyle}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5">
                        {renderSubjectIconBadge(
                          getSubjectIcon(slot.subjectIcon || slot.subjectCode, slot.subjectName),
                          'sm'
                        )}
                      </div>
                      <div>
                        <div className="text-xs opacity-80 font-bold">
                          {periodDef.label} ({periodDef.timeRange})
                        </div>
                        <div className="text-base font-black truncate mt-0.5">
                          {slot.subjectCode} {slot.subjectName && `• ${slot.subjectName}`}
                        </div>
                        <div className="text-xs opacity-90 font-semibold mt-0.5">
                          {slot.room}
                        </div>
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
                    const isToday = dayObj.isToday;
                    return (
                      <th
                        key={dayObj.key}
                        className={`py-3 px-2 min-w-[130px] ${
                          isToday ? 'bg-blue-50/40 text-blue-900 font-black' : 'text-slate-700 font-bold'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{dayObj.key}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {dayObj.dateLabel}
                          </span>
                          {isToday && (
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
                  if (periodDef.isLunch) {
                    return (
                      <tr key={periodDef.id || `lunch-${periodDef.timeRange}`} className="transition-colors">
                        {/* Time Column */}
                        <td className="py-3.5 px-3 text-left font-bold text-slate-600 text-xs align-middle bg-slate-50/40">
                          <div>{periodDef.timeRange}</div>
                          <div className="text-[10px] text-slate-400 font-medium">({periodDef.label})</div>
                        </td>

                        {/* Lunch Slot */}
                        <td
                          colSpan={weekInfo.days.length}
                          className="p-2 align-middle bg-amber-50/50 text-center"
                        >
                          <div className="py-2.5 px-4 rounded-xl border border-amber-200/80 bg-white shadow-2xs inline-flex items-center gap-2 text-xs font-bold text-amber-900">
                            <span>🍴</span>
                            <span>{periodDef.label} ({periodDef.timeRange})</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const pNum = periodDef.period || 1;

                  return (
                    <tr key={periodDef.id || `period-${pNum}`} className="transition-colors">
                      {/* Time Column */}
                      <td className="py-3.5 px-3 text-left font-bold text-slate-600 text-xs align-middle bg-slate-50/40">
                        <div>{periodDef.timeRange}</div>
                        <div className="text-[10px] text-slate-400 font-medium">({periodDef.label})</div>
                      </td>

                      {/* Mon - Fri Period Slots */}
                      {weekInfo.days.map((dayObj) => {
                        const slot = getSlot(dayObj.key, pNum);
                        const isToday = dayObj.isToday;
                        const targetDateIso = dayObj.isoDate;
                        const colBg = isToday ? 'bg-blue-50/20' : '';

                        if (!slot || slot.isFreePeriod || !slot.subjectCode) {
                          return (
                            <td
                              key={dayObj.key}
                              onClick={() => handleOpenFreeSlot(dayObj.key, pNum)}
                              className={`p-1.5 align-middle cursor-pointer group ${colBg}`}
                              title="คลิกเพื่อเพิ่มรายวิชาในคาบนี้"
                            >
                              <div className="h-28 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 hover:bg-blue-50/40 hover:border-blue-300 transition-colors flex items-center justify-center text-slate-300 group-hover:text-blue-500 text-xs font-bold">
                                + เพิ่มวิชา
                              </div>
                            </td>
                          );
                        }

                        const boxStyle = getSlotBoxStyle(slot, false, targetDateIso);
                        const status = getSlotStatus(slot, targetDateIso);

                        return (
                          <td
                            key={dayObj.key}
                            onClick={() => handleOpenSlot(slot, targetDateIso)}
                            className={`p-1.5 align-middle cursor-pointer group ${colBg}`}
                          >
                            <div
                              className={`h-28 w-full p-2.5 rounded-2xl border flex flex-col justify-between text-left transition-all hover:scale-101 hover:shadow-md ${boxStyle}`}
                            >
                              {/* Top: Code & Room */}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <div className="shrink-0 scale-75 origin-left">
                                    {renderSubjectIconBadge(
                                      getSubjectIcon(slot.subjectIcon || slot.subjectCode, slot.subjectName),
                                      'sm'
                                    )}
                                  </div>
                                  <div className="font-black text-sm tracking-tight truncate">
                                    {slot.subjectCode}
                                  </div>
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
                    }
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards for Week View */}
        {mobileViewMode === 'CARDS' && (
          <div className="block md:hidden space-y-3">
            {weekInfo.days.map((dayObj) => {
              const dayTeaching = matrixSlots.filter(
                (s) =>
                  s.day === dayObj.key &&
                  !s.isFreePeriod &&
                  s.category !== 'free' &&
                  !s.isLunchSlot &&
                  s.status !== 'LUNCH' &&
                  Boolean(s.subjectCode) &&
                  s.subjectCode !== 'พักกลางวัน'
              );
              const isToday = dayObj.isToday;
              const targetDateIso = dayObj.isoDate;

              return (
                <div
                  key={dayObj.key}
                  className={`p-3.5 rounded-2xl border ${
                    isToday ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">วัน{dayObj.key}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({dayObj.dateLabel})</span>
                    </div>
                    {isToday && (
                      <span className="text-[9px] bg-blue-600 text-white px-2 py-0.2 rounded-full font-bold">
                        วันนี้
                      </span>
                    )}
                  </div>

                  {dayTeaching.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2.5 text-center font-medium">
                      ไม่มีคาบสอนในวันนี้
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayTeaching.map((slot) => {
                        const status = getSlotStatus(slot, targetDateIso);
                        const boxStyle = getSlotBoxStyle(slot, false, targetDateIso);
                        const dynamicTime = bellScheduleService.getTimeRangeForPeriod(slot.period) || slot.timeRange;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => handleOpenSlot(slot, targetDateIso)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${boxStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="shrink-0">
                                {renderSubjectIconBadge(
                                  getSubjectIcon(slot.subjectIcon || slot.subjectCode, slot.subjectName),
                                  'sm'
                                )}
                              </div>
                              <div>
                                <div className="text-[11px] opacity-80 font-bold">
                                  คาบที่ {slot.period} ({dynamicTime})
                                </div>
                                <div className="font-black text-xs truncate">
                                  {slot.subjectCode} {slot.subjectName && `• ${slot.subjectName}`}
                                </div>
                                <div className="text-[11px] opacity-90 font-medium">
                                  {slot.room}
                                </div>
                              </div>
                            </div>
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
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* 4.3 VIEW: MONTH (รายเดือน) */}
      {viewModeTab === 'MONTH' && (() => {
        const bangkokNow = getBangkokNow();
        const calYear = calendarDate.getFullYear();
        const calMonth = calendarDate.getMonth(); // 0 - 11
        const thaiMonthTitle = `ปฏิทินตารางสอนรายเดือน (${THAI_MONTH_NAMES[calMonth]} ${calYear + 543})`;

        const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

        const isCurrentMonth =
          calYear === bangkokNow.getFullYear() && calMonth === bangkokNow.getMonth();
        const todayDateNum = bangkokNow.getDate();

        return (
          <div className="w-full bg-white rounded-3xl border border-[#E6EEF7] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {thaiMonthTitle}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(getBangkokNow())}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((w) => (
                <div key={w} className="font-bold text-slate-500 py-1 bg-slate-50 rounded-xl">
                  {w}
                </div>
              ))}

              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - firstDayOfWeek + 1;
                const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                const colIndex = i % 7;
                const thisDateIso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isInActiveTerm = academicCalendarService.isDateInActiveTerm(thisDateIso);
                const holidays = academicCalendarService.getHolidays().filter((h) => h.isActive);
                const holidayMatch = holidays.find(
                  (h) => academicCalendarService.parseThaiDateToIso(h.date) === thisDateIso
                );
                const isHoliday = Boolean(holidayMatch);
                const isWeekendDay = colIndex === 0 || colIndex === 6;
                const isSchoolDay = !isWeekendDay && isValid;
                const isTermBreak = isSchoolDay && !isInActiveTerm;

                if (!isValid) {
                  return <div key={i} className="h-22 bg-slate-50/30 rounded-2xl border border-slate-100/50" />;
                }

                const isToday = isCurrentMonth && dayNum === todayDateNum;
                const isPast = isCurrentMonth
                  ? dayNum < todayDateNum
                  : new Date(calYear, calMonth, dayNum) < new Date(bangkokNow.getFullYear(), bangkokNow.getMonth(), todayDateNum);
                const isFuture = isCurrentMonth
                  ? dayNum > todayDateNum
                  : new Date(calYear, calMonth, dayNum) > new Date(bangkokNow.getFullYear(), bangkokNow.getMonth(), todayDateNum);

                // Determine Day of Week Name
                const WEEKDAY_KEYS = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', ''];
                const dayKey = isSchoolDay && !isTermBreak && !isHoliday ? WEEKDAY_KEYS[colIndex] : '';
                const scheduledSlots = dayKey
                  ? matrixSlots.filter(
                      (s) =>
                        s.day === dayKey &&
                        !s.isFreePeriod &&
                        s.category !== 'free' &&
                        !s.isLunchSlot &&
                        s.status !== 'LUNCH' &&
                        Boolean(s.subjectCode) &&
                        s.subjectCode !== 'พักกลางวัน'
                    )
                  : [];
                const classCount = scheduledSlots.length;
                const hasClasses = classCount > 0;

                // ตรวจสอบจากประวัติการเช็คชื่อจริงใน attendanceCorrelationService
                const dateRecords = attendanceCorrelationService
                  .getAllPeriodRecords()
                  .filter((r) => r.date === thisDateIso);
                const isAllChecked =
                  hasClasses && dateRecords.length > 0;

                // Visual styling logic: Green = checked, Red = unchecked past, Amber = term break
                let cellBorderBg = 'border-slate-100 bg-slate-50/60 opacity-60';
                if (isToday) {
                  cellBorderBg = 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-300';
                } else if (isTermBreak) {
                  cellBorderBg = 'border-amber-200/70 bg-amber-50/40 hover:bg-amber-100/50';
                } else if (isHoliday) {
                  cellBorderBg = 'border-rose-200/70 bg-rose-50/40';
                } else if (isSchoolDay) {
                  if (hasClasses) {
                    if (isPast) {
                      cellBorderBg = isAllChecked
                        ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                        : 'border-rose-300 bg-rose-50/40 hover:bg-rose-50';
                    } else if (isFuture) {
                      cellBorderBg = 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60';
                    }
                  } else {
                    cellBorderBg = 'border-slate-100 bg-white hover:bg-slate-50/50';
                  }
                }

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (isSchoolDay && dayKey) {
                        setSelectedDayTab(dayKey as DayOfWeek);
                        setViewModeTab('DAY');
                      }
                    }}
                    className={`h-22 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSchoolDay && dayKey ? 'cursor-pointer hover:shadow-xs' : ''
                    } ${cellBorderBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black ${
                          isToday ? 'text-blue-700 font-extrabold' : 'text-slate-700'
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

                    {isTermBreak ? (
                      <div className="space-y-1">
                        <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded-md">
                          ช่วงปิดเทอม
                        </span>
                      </div>
                    ) : isHoliday ? (
                      <div className="space-y-1">
                        <span
                          className="inline-block text-[9px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-1.5 py-0.2 rounded-md truncate max-w-full"
                          title={holidayMatch?.name || 'วันหยุดพิเศษ'}
                        >
                          {holidayMatch?.name || 'วันหยุดพิเศษ'}
                        </span>
                      </div>
                    ) : isSchoolDay ? (
                      hasClasses ? (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-700">
                            สอน {classCount} คาบ
                          </div>
                          {isPast ? (
                            isAllChecked ? (
                              <span className="inline-block text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.2 rounded-md">
                                ✓ เช็คแล้ว
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-extrabold text-rose-800 bg-rose-100/90 border border-rose-300 px-1.5 py-0.2 rounded-md">
                                ⚠️ ยังไม่เช็ค
                              </span>
                            )
                          ) : isToday ? (
                            isAllChecked ? (
                              <span className="inline-block text-[9px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-md">
                                ✓ เช็คแล้ว
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md">
                                ⚠️ รอเช็คชื่อ
                              </span>
                            )
                          ) : (
                            <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-200/80 border border-slate-300 px-1.5 py-0.2 rounded-md">
                              รอสอน
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          ไม่มีคาบสอน
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400">วันหยุด</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 scale-90">
                    {renderSubjectIconBadge(
                      getSubjectIcon(slot.subjectIcon || slot.subjectCode, slot.subjectName),
                      'sm'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900">{slot.subjectCode}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {slot.room}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium truncate max-w-[170px] mt-0.5">
                      {slot.subjectName || slot.room}
                    </div>
                    <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                      {slot.totalPeriods || `${slot.credits} หน่วยกิต`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAssignWaitingSlotTarget(slot)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1 shrink-0"
                >
                  <span>+ ลงตาราง</span>
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
                    {selectedSlot.day} • {formatThaiDateShort(selectedSlotDateIso || getBangkokTodayString())} • {selectedSlot.timeRange || bellScheduleService.getTimeRangeForPeriod(selectedSlot.period)}
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
              {studentsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">
                  ยังไม่มีรายชื่อนักเรียนในห้องนี้ (สามารถเพิ่มนักเรียนได้ที่เมนู 'นักเรียน')
                </div>
              ) : (
                studentsList.map((stu, stuIdx) => {
                  const stuKey = stu.code || stu.id || `stu-${stu.no}-${stuIdx}`;
                  const currentStatus = attendanceRecords[stuKey] || 'PRESENT';
                  return (
                    <div
                      key={stuKey}
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
                              setAttendanceRecords((prev) => ({ ...prev, [stuKey]: st }))
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
                })
              )}
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
                  {teachingPeriods.map((p) => (
                    <option key={p.periodNumber} value={p.periodNumber}>
                      {p.label} ({p.timeRange})
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
        matrixSlots={matrixSlots}
        maxPeriods={teachingPeriods.length}
      />

      {/* ========================================================
          MODAL 4: ASSIGN WAITING SLOT MODAL
          ======================================================== */}
      <AssignWaitingSlotModal
        isOpen={Boolean(assignWaitingSlotTarget)}
        onClose={() => setAssignWaitingSlotTarget(null)}
        waitingSlot={assignWaitingSlotTarget}
        matrixSlots={matrixSlots}
        onAssignSlot={handleAssignWaitingSlot}
        maxPeriods={teachingPeriods.length}
      />
    </div>
  );
};

