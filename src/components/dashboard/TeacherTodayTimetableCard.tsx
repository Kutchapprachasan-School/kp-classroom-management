// src/components/dashboard/TeacherTodayTimetableCard.tsx
// การ์ดตารางสอนวันนี้ (รวมเข้าแถวเช้า คาบ 0 + คาบ 1-5) ตามภาพต้นแบบ Mockup Image 1 & Image 2

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  UserCheck,
  Star,
  MapPin,
  Users,
  Sun,
  Check,
  Eye,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';
import {
  bellScheduleService,
  BELL_SCHEDULE_UPDATED_EVENT,
  type SchoolBellScheduleConfig,
} from '../../services/bellScheduleService';
import type { AuthUser } from '../../services/authService';
import {
  calendarEventStorageService,
  MATRIX_SLOTS_UPDATED_EVENT,
} from '../../services/calendarEventStorageService';
import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
} from '../../services/academicCalendarService';
import { getSubjectIcon } from '../../config/subjectIcons';
import {
  formatThaiDateFull,
  getBangkokNow,
  type TimetableMatrixSlot,
} from '../../utils/timetableDateUtils';
import { classroomService } from '../../services/classroomService';
import { formatClassroomLabel } from '../../services/studentService';
import type { ClassroomRosterItem } from '../../types/viewModels';

export interface TodayPeriodItem {
  periodNumber: number;
  timeRange: string;
  iconType: 'hiragana' | 'nihon' | 'torii' | 'activity' | 'morning';
  iconBgColor: string;
  subjectTitle: string;
  courseCode?: string;
  credits?: string;
  totalPeriods?: string;
  subType?: string;
  classroom: string;
  isMorningAssembly?: boolean;
  hasGradingButton?: boolean;
  isCompleted?: boolean;
}

interface TeacherTodayTimetableCardProps {
  onNavigateToFullTimetable?: () => void;
  onCheckAttendance?: (period: TodayPeriodItem) => void;
  onGradeScores?: (period: TodayPeriodItem) => void;
  onViewPeriodDetail?: (period: TodayPeriodItem) => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
  currentUser?: AuthUser | null;
}

export const TeacherTodayTimetableCard: React.FC<TeacherTodayTimetableCardProps> = ({
  onNavigateToFullTimetable,
  onCheckAttendance,
  onGradeScores,
  onViewPeriodDetail,
  onDeepNavigate,
  currentUser,
}) => {
  const [bellConfig, setBellConfig] = useState<SchoolBellScheduleConfig>(() =>
    bellScheduleService.getConfig()
  );

  // เชื่อมโยงข้อมูลตารางสอนจริงจากหน้าตารางสอน โดยแยกตามครูผู้สอน (ของใครของมัน)
  const [matrixSlots, setMatrixSlots] = useState<TimetableMatrixSlot[]>(() =>
    calendarEventStorageService.loadMatrixSlots(currentUser?.id)
  );

  const [calendarVersion, setCalendarVersion] = useState(0);
  useEffect(() => {
    const handleCalendarChange = () => setCalendarVersion((v) => v + 1);
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
    return () => window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
  }, []);

  const todayDate = useMemo(() => getBangkokNow(), [calendarVersion]);
  const todayIso = useMemo(() => {
    return `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  }, [todayDate]);

  const inActiveTerm = useMemo(() => {
    return academicCalendarService.isDateInActiveTerm(todayIso);
  }, [todayIso, calendarVersion]);

  const isInstructional = useMemo(() => {
    return academicCalendarService.isInstructionalDay(todayIso);
  }, [todayIso, calendarVersion]);

  const activeTerm = useMemo(() => {
    return academicCalendarService.getActiveTerm();
  }, [calendarVersion]);

  const allTerms = useMemo(() => {
    return academicCalendarService.getTerms();
  }, [calendarVersion]);

  const nextTerm = useMemo(() => {
    return allTerms.find((t) => t.id !== activeTerm?.id && !t.isArchived);
  }, [allTerms, activeTerm]);

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

  // ติดตามการเปลี่ยนแปลงคาบสอนจากหน้าตารางสอนแบบ Real-time
  useEffect(() => {
    const handleSlotsUpdate = (e: Event) => {
      const custom = e as CustomEvent<TimetableMatrixSlot[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setMatrixSlots(custom.detail);
      } else {
        setMatrixSlots(calendarEventStorageService.loadMatrixSlots(currentUser?.id));
      }
    };
    window.addEventListener(MATRIX_SLOTS_UPDATED_EVENT, handleSlotsUpdate);
    window.addEventListener('storage', handleSlotsUpdate);
    return () => {
      window.removeEventListener(MATRIX_SLOTS_UPDATED_EVENT, handleSlotsUpdate);
      window.removeEventListener('storage', handleSlotsUpdate);
    };
  }, [currentUser?.id]);

  const todayDayKey = useMemo(() => calendarEventStorageService.getTodayDayKey(), []);

  // ติดตามคาบที่ดำเนินการเช็คชื่อเรียบร้อยแล้ว
  const [completedPeriods, setCompletedPeriods] = useState<number[]>([0]);

  // ซิงค์สถานะ checked จาก matrixSlots เข้า completedPeriods
  useEffect(() => {
    const checkedFromMatrix = matrixSlots
      .filter((s) => s.day === todayDayKey && (s.status === 'CHECKED' || s.isConducted))
      .map((s) => s.period);
    if (checkedFromMatrix.length > 0) {
      setCompletedPeriods((prev) => Array.from(new Set([...prev, ...checkedFromMatrix])));
    }
  }, [matrixSlots, todayDayKey]);

  // ดึงห้องที่ปรึกษาจริงของครูผู้สอนเพื่อไม่ให้ fallback ม.3/1 หากไม่มีห้องประจำชั้น
  const [teacherAdvisoryRoom, setTeacherAdvisoryRoom] = useState<ClassroomRosterItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    classroomService
      .getTeacherAdvisoryClassroom(currentUser?.name || currentUser?.username)
      .then((room) => {
        if (isMounted) {
          setTeacherAdvisoryRoom(room);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // คำนวณรายการคาบสอนวันนี้จาก matrixSlots จริง โดยแยกเฉพาะของครูที่ล็อกอิน
  const periodsList = useMemo<TodayPeriodItem[]>(() => {
    // 1. ถ้าอยู่นอกช่วงเปิดเทอม หรือเป็นวันหยุด ไม่แสดงคาบสอนและไม่ต้องเช็คชื่อ
    if (!inActiveTerm || !isInstructional) {
      return [];
    }

    // คาบที่ 0: กิจกรรมเข้าแถวเคารพธงชาติ & โฮมรูม (แสดงเฉพาะกรณีครูมีห้องที่ปรึกษาจริง)
    const rawAdvisory = teacherAdvisoryRoom?.name || currentUser?.classroomName || currentUser?.classroomId;
    const effectiveAdvisoryRoom = rawAdvisory ? formatClassroomLabel(rawAdvisory) : undefined;
    const period0: TodayPeriodItem | null = effectiveAdvisoryRoom
      ? {
          periodNumber: 0,
          timeRange: `${bellConfig.morningAssemblyStart} - ${bellConfig.morningAssemblyEnd}`,
          iconType: 'morning',
          iconBgColor: 'bg-sky-500',
          subjectTitle: `เช็คแถวเช้า & โฮมรูม (${effectiveAdvisoryRoom})`,
          courseCode: 'โฮมรูม',
          classroom: `ห้อง ${effectiveAdvisoryRoom} (ห้องประจำชั้น)`,
          isMorningAssembly: true,
          hasGradingButton: false,
          isCompleted: completedPeriods.includes(0),
        }
      : null;

    // คาบการสอนจริงจาก matrixSlots ในวันปัจจุบัน เฉพาะของครูผู้สอนท่านนี้
    const currentUserId = currentUser?.id;
    const dayTeachingSlots = matrixSlots
      .filter(
        (s) =>
          s.day === todayDayKey &&
          !s.isFreePeriod &&
          s.category !== 'free' &&
          !!s.subjectCode &&
          s.status !== 'LUNCH' &&
          !s.isLunchSlot &&
          (!s.teacherId || !currentUserId || s.teacherId === currentUserId)
      )
      .sort((a, b) => a.period - b.period);

    // หากยังไม่มีคาบสอนจริงถูกบันทึกในตาราง ให้ fallback ไปที่คาบ 0 (ถ้ามี)
    if (dayTeachingSlots.length === 0) {
      return period0 ? [period0] : [];
    }

    const teachingItems: TodayPeriodItem[] = dayTeachingSlots.map((s) => {
      const iconConfig = getSubjectIcon(s.subjectCode, s.subjectName);

      let iconType: TodayPeriodItem['iconType'] = 'nihon';
      if (s.subjectCode.startsWith('ญ') || s.subjectName.includes('ญี่ปุ่น')) {
        iconType = s.period % 2 === 0 ? 'hiragana' : 'nihon';
      } else if (
        s.category === 'activity' ||
        s.subjectCode.startsWith('ก') ||
        s.subjectName.includes('แนะแนว') ||
        s.subjectName.includes('กิจกรรม')
      ) {
        iconType = 'activity';
      } else {
        iconType = 'hiragana';
      }

      const isCompleted = s.status === 'CHECKED' || s.isConducted === true || completedPeriods.includes(s.period);

      return {
        periodNumber: s.period,
        timeRange: s.timeRange || `คาบที่ ${s.period}`,
        iconType,
        iconBgColor: iconConfig.bgClass.startsWith('bg-[')
          ? iconConfig.bgClass
          : iconConfig.id === 'japanese'
          ? 'bg-[#EF4444]'
          : iconConfig.bgClass,
        subjectTitle: s.subjectName || s.subjectCode,
        courseCode: s.subjectCode,
        credits: s.credits || '1.0 หน่วยกิต',
        totalPeriods: s.totalPeriods || '40 คาบ',
        subType: s.category === 'activity' ? 'กิจกรรมพัฒนาผู้เรียน' : undefined,
        classroom: s.room
          ? s.room.startsWith('ม.') || s.room.startsWith('ห้อง')
            ? s.room
            : `ห้อง ${s.room}`
          : 'ห้องเรียน',
        isMorningAssembly: false,
        hasGradingButton: s.category !== 'activity',
        isCompleted,
      };
    });

    return period0 ? [period0, ...teachingItems] : teachingItems;
  }, [matrixSlots, todayDayKey, bellConfig, teacherAdvisoryRoom, currentUser, completedPeriods]);

  // ตั้งค่าเริ่มต้น: ซ่อนคาบที่เสร็จแล้วเป็นค่าเริ่มต้น และบันทึกสถานะลง localStorage
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kp_hide_completed_periods');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true; // default เป็นซ่อนคาบที่เสร็จแล้วตามคำสั่งผู้ใช้
  });

  const handleToggleHideCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('kp_hide_completed_periods', String(next));
      }
      return next;
    });
  };

  // ค้นหาคาบถัดไปที่ต้องทำ (คาบแรกที่ยังไม่ได้เช็คชื่อ)
  const nextActionPeriodNumber = periodsList.find(
    (p) => !(p.isCompleted || completedPeriods.includes(p.periodNumber))
  )?.periodNumber ?? null;

  const toggleComplete = (periodNumber: number) => {
    const isNowCompleted = !completedPeriods.includes(periodNumber);
    setCompletedPeriods((prev) =>
      prev.includes(periodNumber)
        ? prev.filter((p) => p !== periodNumber)
        : [...prev, periodNumber]
    );

    if (periodNumber > 0 && isNowCompleted) {
      calendarEventStorageService.markMatrixSlotChecked(todayDayKey, periodNumber);
    }
  };

  const handleCheckIn = (period: TodayPeriodItem) => {
    // บันทึกสถานะว่าเช็คชื่อแล้ว
    if (!completedPeriods.includes(period.periodNumber)) {
      setCompletedPeriods((prev) => [...prev, period.periodNumber]);
    }

    // ซิงค์สถานะเข้าสู่ Matrix Slots ของตารางสอนจริง
    if (period.periodNumber > 0) {
      calendarEventStorageService.markMatrixSlotChecked(todayDayKey, period.periodNumber);
    }

    if (onCheckAttendance) {
      onCheckAttendance(period);
      return;
    }

    // หากเป็นคาบ 0 (เช็คแถวเช้า) ให้นำทางไปยัง morning-assembly
    if (period.isMorningAssembly || period.periodNumber === 0) {
      onDeepNavigate?.({
        view: 'morning-assembly',
        highlightBanner: 'เช็คแถวเช้า & โฮมรูม (ม.3/1)',
      });
      return;
    }

    // สำหรับคาบวิชาเรียนปกติ (คาบ 1 ขึ้นไป) ให้นำทางไปยัง classroom-attendance
    onDeepNavigate?.({
      view: 'classroom-attendance',
      classSubTab: 'attendance',
      highlightBanner: `เช็คชื่อคาบที่ ${period.periodNumber}: ${period.subjectTitle}`,
    });
  };

  const handleScore = (period: TodayPeriodItem) => {
    if (onGradeScores) {
      onGradeScores(period);
      return;
    }
    onDeepNavigate?.({
      view: 'class-overview',
      classSubTab: 'assignments',
      highlightBanner: `บันทึกคะแนน: ${period.subjectTitle}`,
    });
  };

  const handleDetail = (period: TodayPeriodItem) => {
    if (onViewPeriodDetail) {
      onViewPeriodDetail(period);
      return;
    }
    onDeepNavigate?.({
      view: 'timetable',
      highlightBanner: `ตารางสอน: ${period.subjectTitle}`,
    });
  };

  // กรองคาบเรียนตามปุ่มสลับ ซ่อนคาบที่เสร็จแล้ว
  const displayedPeriods = periodsList.filter((period) => {
    const isCompleted = period.isCompleted || completedPeriods.includes(period.periodNumber);
    if (hideCompleted && isCompleted) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Card Header matching Image 1 & Image 2 */}
      <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight hidden sm:block">
                ตารางสอนวันนี้
              </h2>
              <h2 className="font-extrabold text-slate-800 text-sm leading-tight sm:hidden">
                {formatThaiDateFull(new Date())}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {formatThaiDateFull(new Date())}{' '}
              {!inActiveTerm
                ? '• อยู่ในช่วงปิดภาคเรียน'
                : !isInstructional
                ? '• วันหยุด (ไม่มีการเรียนการสอน)'
                : `(${Math.max(0, periodsList.length - (teacherAdvisoryRoom ? 1 : 0))} คาบสอน)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle Button: ซ่อนคาบที่เสร็จแล้ว / แสดงทุกคาบ (แสดงเฉพาะเมื่อมีคาบสอน) */}
          {inActiveTerm && isInstructional && (
            <button
              type="button"
              onClick={handleToggleHideCompleted}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hideCompleted
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/70'
              }`}
              title={hideCompleted ? 'แสดงทุกคาบ' : 'ซ่อนคาบที่เสร็จแล้ว'}
            >
              {hideCompleted ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>👁️ แสดงทุกคาบ</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ ซ่อนคาบที่เสร็จแล้ว</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToFullTimetable}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>ดูตารางสอนทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Period Rows matching Image 1 & Design Specs */}
      <div className="divide-y divide-slate-50 p-2 sm:p-4 space-y-2.5 sm:space-y-3">
        {!inActiveTerm ? (
          <div className="p-8 text-center bg-gradient-to-b from-amber-50/60 to-orange-50/40 rounded-2xl border border-amber-200/70 space-y-3.5 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shadow-xs">
              🏖️
            </div>
            <div className="space-y-1">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/70 text-amber-900 border border-amber-300">
                ช่วงปิดภาคเรียน
              </span>
              <h4 className="font-extrabold text-slate-800 text-base sm:text-lg">
                อยู่ในช่วงปิดภาคเรียน ({activeTerm?.termName || 'ภาคเรียน'} ปีการศึกษา {activeTerm?.year || 2569})
              </h4>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                ขณะนี้อยู่นอกช่วงเวลาเปิดเรียน ระบบไม่นำวันนี้มาคำนวณสถิติเวลาเรียน และไม่มีการแจ้งเตือนให้เช็คชื่อเข้าเรียน
              </p>
            </div>
            {nextTerm && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-700 shadow-2xs">
                <span>📅 กำหนดการเปิด{nextTerm.termName}/{nextTerm.year}:</span>
                <span className="text-blue-600 font-extrabold">{nextTerm.startDate}</span>
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() =>
                  onDeepNavigate?.({
                    view: 'settings',
                    highlightBanner: 'ตั้งค่าวันเปิด-ปิดเทอม',
                  })
                }
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>⚙️ ตั้งค่าวันเปิด-ปิดภาคเรียน</span>
              </button>
            </div>
          </div>
        ) : !isInstructional ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-2xs">
              🌿
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
              วันนี้เป็นวันหยุด (ไม่มีคาบเรียนและการเช็คชื่อ)
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              วันหยุดราชการหรือวันหยุดสุดสัปดาห์ ระบบจะไม่แจ้งเตือนการเช็คชื่อเข้าเรียน
            </p>
          </div>
        ) : displayedPeriods.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
              เช็คชื่อครบทุกคาบแล้ววันนี้
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              ซ่อนคาบที่เสร็จสิ้นแล้วทั้งหมดตามการตั้งค่าของคุณครู
            </p>
            <button
              type="button"
              onClick={() => setHideCompleted(false)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>👁️ แสดงทุกคาบ ({periodsList.length} คาบ)</span>
            </button>
          </div>
        ) : (
          displayedPeriods.map((period) => {
            const isCompleted = period.isCompleted || completedPeriods.includes(period.periodNumber);
            const isNextAction = period.periodNumber === nextActionPeriodNumber;

            let rowStyle = 'border border-slate-100 bg-white hover:bg-slate-50/80 shadow-2xs';
            if (isNextAction) {
              rowStyle = 'border-2 border-blue-500 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white shadow-md shadow-blue-500/10 ring-2 ring-blue-400/20';
            } else if (isCompleted) {
              rowStyle = 'border border-slate-100 bg-slate-50/50 opacity-80 hover:opacity-100 transition-opacity';
            }

            return (
              <div
                key={period.periodNumber}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl transition-all gap-3 ${rowStyle}`}
              >
                {/* Left: Circle checkmark in front + Time Badge + Icon + Subject Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Status Circle in front of time block matching Image 2 */}
                  <div
                    className="shrink-0 flex items-center justify-center cursor-pointer"
                    onClick={() => toggleComplete(period.periodNumber)}
                    title={isCompleted ? 'เช็คแล้ว (คลิกเพื่อสลับ)' : 'ยังไม่ได้เช็ค (คลิกเพื่อทำเครื่องหมาย)'}
                  >
                    {isCompleted ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-slate-300 bg-white hover:border-blue-400 transition-colors" />
                    )}
                  </div>

                  {/* Time Block matching Image 1 & 2 */}
                  <div
                    className={`w-24 sm:w-28 py-1.5 px-2 rounded-xl text-center shrink-0 flex flex-col justify-center ${
                      isNextAction
                        ? 'bg-blue-100/90 border border-blue-300'
                        : 'bg-slate-50 border border-slate-200/80'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">
                      {period.timeRange}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {period.periodNumber === 0 ? 'เข้าแถวเช้า' : `คาบที่ ${period.periodNumber}`}
                    </span>
                  </div>

                  {/* Morning / Japanese / Activity Circular Icon */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${period.iconBgColor} text-white flex items-center justify-center shrink-0 shadow-2xs font-extrabold select-none`}
                  >
                    {period.iconType === 'morning' && (
                      <Sun className="w-5 h-5 text-amber-100 fill-amber-100" />
                    )}
                    {period.iconType === 'hiragana' && (
                      <span className="text-base sm:text-lg leading-none font-bold">あ</span>
                    )}
                    {period.iconType === 'nihon' && (
                      <span className="text-xs leading-none font-black tracking-tighter">日本</span>
                    )}
                    {period.iconType === 'torii' && (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M2 5h20v2H2V5zm2 3h16v1.5H4V8zm2 2.5h2v9.5H6v-9.5zm10 0h2v9.5h-2v-9.5z" />
                      </svg>
                    )}
                    {period.iconType === 'activity' && <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </div>

                  {/* Subject Title & Details */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate">
                        {period.subjectTitle}
                      </h3>
                      {isNextAction && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0 shadow-2xs animate-pulse">
                          📌 กำลังเรียน / คาบถัดไป
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5 font-medium">
                      {period.courseCode && (
                        <span>รหัสวิชา {period.courseCode}</span>
                      )}
                      {period.credits && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{period.credits}</span>
                        </>
                      )}
                      {period.totalPeriods && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{period.totalPeriods}</span>
                        </>
                      )}
                      {period.subType && <span>{period.subType}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{period.classroom}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons ([เช็คชื่อ] ตามภาพที่ 1 - สีเขียวเด่น 10% Pop, [ให้คะแนน], [รายละเอียด >]) */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0 flex-wrap pl-[100px] sm:pl-0">
                  {/* ปุ่มเช็คชื่อเข้มขึ้นดังภาพที่ 1 ให้ชัดเจนว่าเป็น 10% Accent Pop */}
                  <button
                    type="button"
                    onClick={() => handleCheckIn(period)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                      isNextAction
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/30 scale-102'
                        : isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                    title={period.isMorningAssembly || period.periodNumber === 0 ? 'เช็คแถวเช้า & โฮมรูม' : 'เช็คชื่อเข้าเรียน'}
                  >
                    <UserCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>{period.isMorningAssembly || period.periodNumber === 0 ? 'เช็คแถว' : 'เช็คชื่อ'}</span>
                  </button>

                  {/* Grade button if applicable */}
                  {period.hasGradingButton && (
                    <button
                      type="button"
                      onClick={() => handleScore(period)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="บันทึกคะแนน"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>ให้คะแนน</span>
                    </button>
                  )}

                  {/* Details link */}
                  <button
                    type="button"
                    onClick={() => handleDetail(period)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 transition-colors cursor-pointer flex items-center gap-0.5"
                  >
                    <span>รายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
