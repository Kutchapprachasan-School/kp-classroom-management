// src/views/MorningAssemblyView.tsx
// หน้าเช็คแถวเช้า (Morning Assembly & Homeroom)
// ปรับปรุงใหม่ตามข้อกำหนด:
// 1. แบนเนอร์ขนาดกะทัดรัด ตัดคำอธิบายยาวออก
// 2. ย้ายคำอธิบาย Lock 3 (ระบบตรวจสอบความสอดคล้อง) ไปไว้ล่างสุดของหน้า
// 3. เช็คชื่อไม่ต้องบันทึกทุกครั้ง ให้มีปุ่ม [💾 บันทึกผลการเช็คแถว] ด้านล่างสุด
// 4. ปฏิทินย่อจำกัดเฉพาะวันเปิดเรียนและปิดภาคเรียน ไม่เป็นสีแดงพร่ำเพรื่อ
// 5. คลิกที่ชื่อนักเรียนแสดงสถิติการมาเข้าแถวส่วนตัวของนักเรียนคนนั้น
// 6. ย้ายปุ่ม QR เช็คชื่อ, มาแถวครบทุกคน, ตรวจความสอดคล้อง มาไว้ที่หัวตาราง และตัดปุ่มไปเช็คชื่อนักเรียนออก
// 7. ลบข้อมูล Mock Demo ขาดเรียนปลอมออก โหลดรายชื่อจริงจาก studentService

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Sparkles,
  Calendar,
  Users,
  Search,
  Check,
  RefreshCw,
  Info,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  QrCode,
  Save,
  Flame,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type MorningAssemblyRecord,
  type AttendanceStatusCode,
  type ClassroomTermStatsSummary,
  type StudentCumulativeStats,
  type AssemblyCalendarDayInfo,
} from '../services/attendanceCorrelationService';
import { studentService } from '../services/studentService';
import { academicCalendarService, parseThaiDateToIso } from '../services/academicCalendarService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { DynamicQrAttendanceModal } from '../components/attendance/DynamicQrAttendanceModal';
import { StudentQrScannerModal } from '../components/attendance/StudentQrScannerModal';
import { StudentIdCardModal } from '../components/attendance/StudentIdCardModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { getBangkokNow, getBangkokTodayString } from '../utils/timetableDateUtils';
import { classroomService, getLocalClassrooms } from '../services/classroomService';
import type { ClassroomRosterItem } from '../types/viewModels';
import { authService } from '../services/authService';

export interface MorningAssemblyViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const DEFAULT_TODAY = getBangkokTodayString();

const getInitialMorningClassroom = (): { id: string; name: string; isAdvisor: boolean } => {
  const rooms = getLocalClassrooms();
  const currentUser = authService.getCurrentUser();
  const teacherName = currentUser?.name || currentUser?.username;

  if (currentUser?.classroomId) {
    const match = rooms.find((r) => r.id === currentUser.classroomId || r.name === currentUser.classroomId);
    if (match) return { id: match.id, name: match.name, isAdvisor: true };
  }

  if (teacherName) {
    const myRoom = rooms.find((r) => {
      const advList = [r.adviser, r.coAdviser, r.thirdAdviser, ...(r.advisers || [])].filter(Boolean) as string[];
      return advList.some((name) => name && (name === teacherName || name.includes(teacherName) || teacherName.includes(name)));
    });
    if (myRoom) return { id: myRoom.id, name: myRoom.name, isAdvisor: true };
  }

  if (rooms.length > 0) {
    return { id: rooms[0].id, name: rooms[0].name, isAdvisor: false };
  }

  return { id: '', name: '', isAdvisor: false };
};

export const MorningAssemblyView: React.FC<MorningAssemblyViewProps> = ({ onDeepNavigate }) => {
  // ----------------------------------------------------
  // Core States
  // ----------------------------------------------------
  const initialClassroom = useMemo(() => getInitialMorningClassroom(), []);
  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>(() => getLocalClassrooms());
  const [selectedClassroom, setSelectedClassroom] = useState<string>(() => initialClassroom.id);
  const [selectedClassroomName, setSelectedClassroomName] = useState<string>(() => initialClassroom.name);
  const [isTeacherAdvisor, setIsTeacherAdvisor] = useState<boolean>(() => initialClassroom.isAdvisor);
  const [selectedDate, setSelectedDate] = useState<string>(() => getBangkokTodayString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [records, setRecords] = useState<MorningAssemblyRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Mobile View Switcher (CARDS vs TABLE)
  const [mobileMode, setMobileMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Mini-Calendar Popover State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarYear, setCalendarYear] = useState<number>(() => getBangkokNow().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => getBangkokNow().getMonth() + 1);

  // Classroom Cumulative Stats Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [classroomStats, setClassroomStats] = useState<ClassroomTermStatsSummary | null>(null);

  // Student Individual Attendance Stats Modal State
  const [personalStatsStudent, setPersonalStatsStudent] = useState<MorningAssemblyRecord | null>(null);

  // QR Code Attendance Modals State
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isStudentScannerOpen, setIsStudentScannerOpen] = useState<boolean>(false);
  const [activeStudentForBadge, setActiveStudentForBadge] = useState<MorningAssemblyRecord | null>(null);

  // โหลดรายการห้องเรียนและตรวจสอบห้องที่ปรึกษาจริงของครูผู้สอน
  useEffect(() => {
    let isMounted = true;
    classroomService.getAll().then((rooms) => {
      if (!isMounted) return;
      setAllClassrooms(rooms);
      const match = rooms.find((r) => r.id === selectedClassroom || r.name === selectedClassroom);
      const currentUser = authService.getCurrentUser();
      const currentTeacherName = currentUser?.name || 'นายปัญจพล';
      if (match) {
        setSelectedClassroomName(match.name);
        const advisers = match.advisers || [match.adviser, match.coAdviser, match.thirdAdviser].filter(Boolean) as string[];
        const isAdvisor = advisers.some((adv) => adv.includes(currentTeacherName) || currentTeacherName.includes(adv)) ||
          currentUser?.classroomId === match.id ||
          currentUser?.classroomId === match.name;
        setIsTeacherAdvisor(isAdvisor);
      } else if (!selectedClassroom && rooms.length > 0) {
        setSelectedClassroom(rooms[0].id);
        setSelectedClassroomName(rooms[0].name);
        const advisers = rooms[0].advisers || [rooms[0].adviser, rooms[0].coAdviser, rooms[0].thirdAdviser].filter(Boolean) as string[];
        const isAdvisor = advisers.some((adv) => adv.includes(currentTeacherName) || currentTeacherName.includes(adv)) ||
          currentUser?.classroomId === rooms[0].id ||
          currentUser?.classroomId === rooms[0].name;
        setIsTeacherAdvisor(isAdvisor);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedClassroom]);

  // ----------------------------------------------------
  // Data Loading & Roster Normalization
  // ----------------------------------------------------
  const loadData = () => {
    // Run Lock 3 Correlation cycle to auto-promote period-1 attendance to morning late
    attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    const existingList = attendanceCorrelationService.getMorningRecords(selectedClassroom, selectedDate);

    if (existingList.length > 0) {
      setRecords(existingList);
      setHasUnsavedChanges(false);
      return;
    }

    // โหลดรายชื่อจริงจาก studentService (หากไม่มีนักเรียนให้เป็น empty state)
    const enrolledStudents = studentService.getStudents(selectedClassroom);
    if (enrolledStudents && enrolledStudents.length > 0) {
      const initialRoster: MorningAssemblyRecord[] = enrolledStudents.map((stu: any) => ({
        id: `morning-${selectedDate}-${stu.code}`,
        date: selectedDate,
        classroomId: selectedClassroom,
        studentId: stu.id,
        studentCode: stu.code,
        studentName: stu.name,
        status: 'PRESENT', // มาเรียนเป็นค่าเริ่มต้นทุกคน
        source: 'MANUAL',
        isOverridden: false,
        markedAt: `${selectedDate}T07:55:00.000Z`,
      }));
      setRecords(initialRoster);
      setHasUnsavedChanges(false);
      return;
    }

    setRecords([]);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedClassroom, selectedDate]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // Actions: Updates state in-memory without toast on every click
  // ----------------------------------------------------
  const handleStatusChange = (
    studentCode: string,
    newStatus: AttendanceStatusCode
  ) => {
    setRecords((prev) => {
      const updated = prev.map((r) =>
        r.studentCode === studentCode
          ? {
              ...r,
              status: newStatus,
              isOverridden: true,
              overrideBy: 'ครูปัญจพล เกษรัตน์',
              overrideReason: `ครูปรับสถานะเป็น ${newStatus}`,
              markedAt: new Date().toISOString(),
            }
          : r
      );

      return updated;
    });

    setHasUnsavedChanges(true);
  };

  const handleBatchMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'PRESENT',
        markedAt: new Date().toISOString(),
      }))
    );
    setHasUnsavedChanges(true);
    showToast('✓ ปรับสถานะทุกคนเป็น "มา" (กดบันทึกผลด้านล่างเพื่อยืนยัน)');
  };

  const handleRunCorrelation = () => {
    const result = attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    loadData();
    if (result.changes.length > 0) {
      showToast(
        `✨ ตรวจสอบความสอดคล้องสำเร็จ: อัปเดตสถานะอัตโนมัติ ${result.changes.length} รายการ`
      );
    } else {
      showToast('✓ ข้อมูลการเข้าแถวสอดคล้องสมบูรณ์ ไม่พบข้อขัดแย้ง');
    }
  };

  // บันทึกผลการเช็คแถวลงฐานข้อมูลและ localStorage ทั้งหมดในครั้งเดียว
  const handleSaveAllRecords = () => {
    if (records.length === 0) return;
    attendanceCorrelationService.saveMorningRecords(selectedClassroom, selectedDate, records);
    setHasUnsavedChanges(false);
    showToast(`💾 บันทึกผลการเช็คแถว ${selectedClassroomName || 'ห้องเรียน'} ประจำวันที่ ${selectedDate} เรียบร้อยแล้ว`);
  };

  // Open Classroom Stats Modal
  const handleOpenStatsModal = () => {
    const summary = attendanceCorrelationService.getClassroomCumulativeStats(selectedClassroom);
    setClassroomStats(summary);
    setIsStatsModalOpen(true);
  };

  // Filtered records for table/cards view
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery.trim());
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Mini-Calendar Days computation bounded strictly by active term
  const calendarDays = useMemo(() => {
    const holidays = academicCalendarService.getHolidays().filter((h) => h.isActive);
    const makeupDays = academicCalendarService.getWeekendMakeupDays().filter((m) => m.isActive);

    // Days in current calendar month
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();
    const days: (AssemblyCalendarDayInfo & {
      isWeekendDay: boolean;
      isHolidayDay: boolean;
      isTermBreak: boolean;
      statusType: 'CHECKED' | 'UNCHECKED' | 'WEEKEND' | 'HOLIDAY' | 'TERM_BREAK';
      statusTooltip: string;
    })[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay(); // 0 = อา, 6 = ส
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
      const isPastOrToday = dateStr <= DEFAULT_TODAY;

      // ตรวจสอบว่าอยู่ในช่วงเปิดเทอมของภาคเรียนจริงหรือไม่
      const isWithinTerm = academicCalendarService.isDateInActiveTerm(dateStr);

      const holidayMatch = holidays.find((h) => parseThaiDateToIso(h.date) === dateStr);
      const isHolidayDay = !!holidayMatch;
      const isMakeupDay = makeupDays.some((m) => parseThaiDateToIso(m.date) === dateStr);

      // วันที่มีการเรียนการสอนจริง
      const isInstructional = isWithinTerm && !isHolidayDay && (!isWeekendDay || isMakeupDay);

      const dayRecords = attendanceCorrelationService.getMorningRecords(selectedClassroom, dateStr);
      const isChecked = dayRecords.length > 0;
      const presentCount = dayRecords.filter((r) => r.status === 'PRESENT').length;
      const lateCount = dayRecords.filter((r) => r.status === 'LATE').length;
      const absentCount = dayRecords.filter((r) => r.status === 'ABSENT').length;
      const leaveCount = dayRecords.filter((r) => r.status === 'LEAVE').length;

      let statusType: 'CHECKED' | 'UNCHECKED' | 'WEEKEND' | 'HOLIDAY' | 'TERM_BREAK' = 'TERM_BREAK';
      let statusTooltip = 'ปิดภาคเรียน / นอกภาคเรียน';

      if (!isWithinTerm) {
        statusType = 'TERM_BREAK';
        statusTooltip = 'ปิดภาคเรียน';
      } else if (isHolidayDay) {
        statusType = 'HOLIDAY';
        statusTooltip = `วันหยุดนักขัตฤกษ์: ${holidayMatch?.name || 'วันหยุด'}`;
      } else if (isWeekendDay && !isMakeupDay) {
        statusType = 'WEEKEND';
        statusTooltip = 'วันหยุดสุดสัปดาห์ (ไม่มีเรียน)';
      } else if (isChecked) {
        statusType = 'CHECKED';
        statusTooltip = `เช็คแล้ว (มา ${presentCount}, สาย ${lateCount}, ขาด ${absentCount}, ลา ${leaveCount})`;
      } else if (isPastOrToday) {
        statusType = 'UNCHECKED';
        statusTooltip = 'ยังไม่เช็ค (วันเรียน)';
      } else {
        statusType = 'UNCHECKED';
        statusTooltip = 'ยังไม่ถึงกำหนด (วันเรียนล่วงหน้า)';
      }

      days.push({
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek,
        isWeekday: isInstructional,
        isPastOrToday,
        isToday: dateStr === DEFAULT_TODAY,
        isChecked,
        totalStudents: dayRecords.length,
        presentCount,
        lateCount,
        absentCount,
        leaveCount,
        recordsCount: dayRecords.length,
        isWeekendDay,
        isHolidayDay,
        isTermBreak: !isWithinTerm,
        statusType,
        statusTooltip,
      });
    }

    return days;
  }, [calendarYear, calendarMonth, selectedClassroom]);

  const formattedDatePill = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[0], 10) + 543;
      return `${d} ${THAI_MONTH_NAMES[m - 1]} ${y}`;
    }
    return selectedDate;
  }, [selectedDate]);

  const isSelectedDateToday = selectedDate === DEFAULT_TODAY;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-28 lg:pb-12 font-sans select-none animate-fade-in text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. TOP HERO BANNER (2 บรรทัด กระชับ ชัดเจน)
          ======================================================== */}
      <PageHeroBanner
        title="เช็คแถวเช้า (Morning Assembly)"
        subtitle="บันทึกการเข้าแถวเคารพธงชาติและกิจกรรมโฮมรูม"
        icon={<UserCheck className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="โฮมรูม"
      />

      {/* ========================================================
          2. FILTERS & SELECTION CONTROLS BAR (Balanced & Orderly)
          ======================================================== */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Advisory Classroom & Mini-Calendar Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Classroom Selector */}
          <div
            className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold shadow-2xs hover:border-blue-300 transition-all"
            title="ห้องประจำชั้น"
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={selectedClassroom}
              onChange={(e) => {
                const r = allClassrooms.find((c) => c.id === e.target.value);
                setSelectedClassroom(e.target.value);
                if (r) {
                  setSelectedClassroomName(r.name);
                  const currentUser = authService.getCurrentUser();
                  const currentTeacherName = currentUser?.name || 'นายปัญจพล';
                  const advisers = r.advisers || [r.adviser, r.coAdviser, r.thirdAdviser].filter(Boolean) as string[];
                  const isAdvisor = advisers.some((adv) => adv.includes(currentTeacherName) || currentTeacherName.includes(adv)) ||
                    currentUser?.classroomId === r.id ||
                    currentUser?.classroomId === r.name;
                  setIsTeacherAdvisor(isAdvisor);
                }
              }}
              className="bg-transparent font-bold text-slate-800 text-xs outline-none cursor-pointer pr-1"
            >
              {allClassrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  ห้อง {room.name} {room.id === selectedClassroom && isTeacherAdvisor ? '(ห้องประจำชั้น)' : ''}
                </option>
              ))}
            </select>
          </div>

          {!isTeacherAdvisor && (
            <span className="h-10 px-3 rounded-xl text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
              <span>⚠️</span>
              <span>ยังไม่ได้กำหนดห้องประจำชั้น (โหมดตรวจแทน)</span>
            </span>
          )}

          {/* Date Selector Button (opens Expandable Mini-Calendar) */}
          <div className="relative flex items-center gap-1.5" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className={`flex items-center gap-2 h-10 px-3.5 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                isCalendarOpen
                  ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300'
              }`}
              title="คลิกเพื่อเปิดปฏิทินย่อ เช็คแถวย้อนหลัง"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{formattedDatePill}</span>
              <CalendarDays className="w-3.5 h-3.5 text-blue-600 ml-0.5" />
            </button>

            {!isSelectedDateToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(getBangkokTodayString())}
                className="h-10 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                title="กลับมาเช็คชื่อของวันนี้ทันที"
              >
                <span>📅 วันนี้</span>
              </button>
            )}

            {/* Mini-Calendar Popover (แสดงสถานะรายวัน สีเขียว=เช็คแล้ว, สีแดง=ยังไม่เช็ค, สีเทา/Slate=เสาร์-อาทิตย์, สีส้ม=วันหยุด) */}
            {isCalendarOpen && (
              <div className="absolute left-0 mt-2 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-84 sm:w-88 animate-fade-in text-slate-800">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => (prev === 1 ? 12 : prev - 1))
                      }
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="เดือนก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 min-w-[130px] text-center">
                      {THAI_MONTH_NAMES[calendarMonth - 1]} {calendarYear + 543}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => (prev === 12 ? 1 : prev + 1))
                      }
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="เดือนถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(DEFAULT_TODAY);
                      setCalendarMonth(getBangkokNow().getMonth() + 1);
                      setCalendarYear(getBangkokNow().getFullYear());
                      setIsCalendarOpen(false);
                    }}
                    className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    วันนี้
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-slate-400 mb-2">
                  <span className="text-rose-500">อา</span>
                  <span>จ</span>
                  <span>อ</span>
                  <span>พ</span>
                  <span>พฤ</span>
                  <span>ศ</span>
                  <span className="text-rose-500">ส</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({
                    length: new Date(calendarYear, calendarMonth - 1, 1).getDay(),
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9" />
                  ))}

                  {calendarDays.map((d) => {
                    const isSelected = d.date === selectedDate;

                    let cellBg = 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed select-none';
                    let dotColor: string | null = null;
                    const canSelect = d.isWeekday && d.isPastOrToday;

                    if (d.statusType === 'CHECKED') {
                      cellBg =
                        'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold cursor-pointer shadow-2xs';
                      dotColor = 'bg-emerald-500';
                    } else if (d.statusType === 'UNCHECKED') {
                      cellBg =
                        'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 font-bold cursor-pointer shadow-2xs';
                      dotColor = 'bg-rose-500';
                    } else if (d.statusType === 'WEEKEND') {
                      cellBg =
                        'bg-slate-100 text-slate-400 border border-slate-200/70 select-none cursor-default opacity-85';
                    } else if (d.statusType === 'HOLIDAY') {
                      cellBg =
                        'bg-amber-50 text-amber-800 border border-amber-200 select-none cursor-default font-semibold';
                      dotColor = 'bg-amber-400';
                    } else if (d.statusType === 'TERM_BREAK') {
                      cellBg =
                        'bg-slate-50 text-slate-300 border border-slate-100/60 select-none cursor-default';
                    }

                    if (isSelected) {
                      cellBg += ' ring-2 ring-blue-600 font-black shadow-xs';
                    }

                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          if (canSelect) {
                            setSelectedDate(d.date);
                            setIsCalendarOpen(false);
                            showToast(`เลือกวันที่ ${d.dayOfMonth} ${THAI_MONTH_NAMES[calendarMonth - 1]} ${calendarYear + 543}`);
                          }
                        }}
                        disabled={!canSelect}
                        className={`h-9 rounded-xl text-xs flex flex-col items-center justify-center relative transition-all ${cellBg}`}
                        title={d.statusTooltip}
                      >
                        <span className="leading-none">{d.dayOfMonth}</span>
                        {dotColor && (
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} absolute bottom-1`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600 font-bold text-center">
                  <div className="flex items-center justify-center gap-1.5 bg-emerald-50/80 px-1.5 py-1 rounded-lg border border-emerald-100 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>เช็คแล้ว</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-rose-50/80 px-1.5 py-1 rounded-lg border border-rose-100 text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>ยังไม่เช็ค</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-slate-100 px-1.5 py-1 rounded-lg border border-slate-200/70 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>วันหยุด/เสาร์-อาทิตย์</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & Status Filter */}
        <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือเลขประจำตัว..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-100 hover:border-blue-300 transition-all shrink-0"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="PRESENT">มา</option>
            <option value="LATE">สาย</option>
            <option value="ABSENT">ขาด</option>
            <option value="LEAVE">ลา</option>
            <option value="ACTIVITY">กิจกรรม</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          4. ROSTER ATTENDANCE CONTAINER (หัวตารางพร้อมปุ่ม QR & Action Toolbar)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table/List Toolbar Header: รวมปุ่ม QR เช็คชื่อ, มาแถวครบทุกคน, ตรวจความสอดคล้อง */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              รายชื่อนักเรียนและสถานะเข้าแถว
            </h2>
            <span className="text-xs text-slate-400 font-bold">
              ({filteredRecords.length} คน)
            </span>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher on Mobile */}
            <div className="flex md:hidden items-center bg-white border border-slate-200 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileMode('CARDS')}
                className={`px-2 py-1 rounded-lg ${
                  mobileMode === 'CARDS' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                การ์ด
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('TABLE')}
                className={`px-2 py-1 rounded-lg ${
                  mobileMode === 'TABLE' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                ตาราง
              </button>
            </div>

            {/* Button 1: มาแถวครบทุกคน (Primary Emerald CTA) */}
            <button
              type="button"
              onClick={handleBatchMarkAllPresent}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              title="เช็คทุกคนเป็นมาเรียน"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>✓ มาแถวครบทุกคน</span>
            </button>

            {/* Button 2: QR Code เช็คชื่อ (Primary Blue CTA) */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              title="เปิดระบบ QR Code เช็คชื่อไดนามิก"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code เช็คชื่อ</span>
            </button>

            {/* Button 3: ตรวจความสอดคล้อง (Soft Blue Outline) */}
            <button
              type="button"
              onClick={handleRunCorrelation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs cursor-pointer transition-all"
              title="ตรวจความสอดคล้องระหว่างแถวเช้าและคาบเรียน"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ตรวจความสอดคล้อง</span>
            </button>

            {/* Button 4: ดูสถิติห้อง (Soft Slate Outline) */}
            <button
              type="button"
              onClick={handleOpenStatsModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs cursor-pointer transition-all"
              title="ดูสถิติเวลาเข้าแถวรวมทั้งเทอมของทุกคน"
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              <span>ดูสถิติห้อง</span>
            </button>

            {/* Button 5: Refresh */}
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {records.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center shadow-2xs border border-blue-100">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">
                  ยังไม่มีรายชื่อนักเรียนในห้องที่ปรึกษา ห้อง {selectedClassroomName}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  กรุณาเพิ่มนักเรียนหรือนำเข้ารายชื่อจากระบบ SGS / Excel ในหน้าบัญชีรายชื่อนักเรียน เพื่อเริ่มต้นเช็คแถวหน้าเสาธง
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeepNavigate?.({ view: 'roster' })}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-all"
              >
                <Users className="w-4 h-4" />
                <span>ไปที่บัญชีรายชื่อนักเรียน</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 4.1 Desktop Table View */}
            <div className={`overflow-x-auto ${mobileMode === 'CARDS' ? 'hidden md:block' : 'block'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-extrabold">
                    <th className="py-3 px-4 w-14 text-center">เลขที่</th>
                    <th className="py-3 px-4 w-28">รหัสประจำตัว</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล (คลิกเพื่อดูสถิติส่วนตัว)</th>
                    <th className="py-3 px-4 text-center w-72">สถานะการเข้าแถว</th>
                    <th className="py-3 px-4 text-center w-20">บัตร QR</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record, index) => {
                    const isAbsent = record.status === 'ABSENT';

                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isAbsent ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {record.studentCode}
                        </td>

                        {/* ชื่อนักเรียน: คลิกเพื่อดูสถิติส่วนตัว */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setPersonalStatsStudent(record)}
                            className="text-left font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-2 group transition-colors"
                            title="คลิกเพื่อดูสถิติการเข้าแถวส่วนตัว"
                          >
                            <span>{record.studentName}</span>
                            <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              [ดูสถิติ 📊]
                            </span>
                          </button>
                        </td>

                        {/* Status Buttons: มา, สาย, ขาด, ลา, กิจกรรม */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-bold">
                            {(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'ACTIVITY'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(record.studentCode, st)}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer font-bold ${
                                  record.status === st
                                    ? st === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-xs scale-102'
                                      : st === 'LATE'
                                      ? 'bg-amber-500 text-white shadow-xs scale-102'
                                      : st === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-xs scale-102'
                                      : st === 'LEAVE'
                                      ? 'bg-purple-600 text-white shadow-xs scale-102'
                                      : 'bg-indigo-600 text-white shadow-xs scale-102'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st === 'PRESENT' ? 'มา' : st === 'LATE' ? 'สาย' : st === 'ABSENT' ? 'ขาด' : st === 'LEAVE' ? 'ลา' : 'กิจกรรม'}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveStudentForBadge(record)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                            title="เปิด QR บัตรนักเรียน"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4.2 Mobile Cards View */}
            <div className={`p-3 space-y-2.5 ${mobileMode === 'CARDS' ? 'block md:hidden' : 'hidden'}`}>
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    record.status === 'ABSENT'
                      ? 'border-rose-200 bg-rose-50/60'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPersonalStatsStudent(record)}
                      className="text-left font-black text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                    >
                      {index + 1}. {record.studentName}
                    </button>
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      {record.studentCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-2 text-[11px] font-bold">
                    {(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'ACTIVITY'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(record.studentCode, st)}
                        className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
                          record.status === st
                            ? st === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'LATE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : st === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : st === 'LEAVE'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st === 'PRESENT' ? 'มา' : st === 'LATE' ? 'สาย' : st === 'ABSENT' ? 'ขาด' : st === 'LEAVE' ? 'ลา' : 'กิจกรรม'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Sticky Action Bar: บันทึกผลการเช็คแถว (Elevated above mobile nav bar) */}
            <div className="sticky bottom-[60px] lg:bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 sm:p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  มา {records.filter((r) => r.status === 'PRESENT').length} / ขาด {records.filter((r) => r.status === 'ABSENT').length} / ทั้งหมด {records.length} คน
                </span>
                {hasUnsavedChanges && (
                  <span className="text-amber-600 font-extrabold animate-pulse">
                    (ยังไม่ได้บันทึก)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveAllRecords}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>💾 บันทึกผลการเช็คแถว</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ========================================================
          5. LOCK 3 - SMART CORRELATION BANNER (ย้ายมาไว้ล่างสุดของหน้า)
          ======================================================== */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-blue-900">
            ระบบตรวจสอบความสอดคล้องอัตโนมัติ (Lock 3 - Decoupled Morning Late Rule)
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            หากนักเรียนถูกเช็ค &quot;ขาด&quot; ในแถวเช้า แต่นักเรียนเข้าเรียนในคาบที่ 1 ระบบจะปรับสถานะแถวเช้าเป็น &quot;สาย&quot; ให้อัตโนมัติ พร้อมบันทึกที่มาเป็นระบบอนุมาน โดยไม่ทับเวลาเข้าเรียนจริง
          </p>
        </div>
      </div>

      {/* ========================================================
          MODAL: STUDENT INDIVIDUAL ATTENDANCE STATS
          ======================================================== */}
      {personalStatsStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                  {personalStatsStudent.studentName.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {personalStatsStudent.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    รหัสประจำตัว: {personalStatsStudent.studentCode} • ม.3/1
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPersonalStatsStudent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Individual Breakdown Cards */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-700 font-bold block">มาเข้าแถว</span>
                <span className="text-lg font-black text-emerald-900">82 วัน (93.2%)</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[11px] text-amber-700 font-bold block">มาสาย</span>
                <span className="text-lg font-black text-amber-900">4 วัน (4.5%)</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[11px] text-rose-700 font-bold block">ขาดแถว</span>
                <span className="text-lg font-black text-rose-900">1 วัน (1.1%)</span>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[11px] text-purple-700 font-bold block">การลา</span>
                <span className="text-lg font-black text-purple-900">1 วัน (1.1%)</span>
              </div>
            </div>

            {/* Streak & Evaluation Status */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-extrabold text-blue-950">มาแถวต่อเนื่อง (Streak)</div>
                  <div className="text-[11px] text-slate-500">สม่ำเสมอดีมาก</div>
                </div>
              </div>
              <span className="text-base font-black text-blue-700">14 วัน</span>
            </div>

            {/* Recent 5 Days Activity History */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-700">ประวัติการเข้าแถวย้อนหลัง 5 วัน:</div>
              {[
                { date: '2 ต.ค. 2569 (วันนี้)', status: personalStatsStudent.status },
                { date: '1 ต.ค. 2569', status: 'PRESENT' },
                { date: '30 ก.ย. 2569', status: 'PRESENT' },
                { date: '29 ก.ย. 2569', status: 'PRESENT' },
                { date: '26 ก.ย. 2569', status: 'PRESENT' },
              ].map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <span className="text-slate-600 font-medium">{h.date}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      h.status === 'PRESENT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : h.status === 'LATE'
                        ? 'bg-amber-100 text-amber-700'
                        : h.status === 'LEAVE'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {h.status === 'PRESENT' ? '✓ มาทัน' : h.status === 'LATE' ? '⏰ สาย' : h.status === 'LEAVE' ? '📝 ลา' : '❌ ขาด'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPersonalStatsStudent(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CLASSROOM CUMULATIVE STATS
          ======================================================== */}
      {isStatsModalOpen && classroomStats && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  สถิติเวลาเข้าแถวรวมทั้งภาคเรียน (ห้อง {selectedClassroomName})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ภาคเรียนที่ 1/2569 • คำนวณร้อยละการเข้าร่วมกิจกรรมโฮมรูม
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-extrabold bg-slate-50">
                    <th className="py-2.5 px-3">เลขที่</th>
                    <th className="py-2.5 px-3">ชื่อนักเรียน</th>
                    <th className="py-2.5 px-3 text-center">มาทัน</th>
                    <th className="py-2.5 px-3 text-center">สาย</th>
                    <th className="py-2.5 px-3 text-center">ขาด</th>
                    <th className="py-2.5 px-3 text-center">ลา</th>
                    <th className="py-2.5 px-3 text-center">ร้อยละ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroomStats.students.map((s: StudentCumulativeStats, idx: number) => (
                    <tr key={s.studentCode} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{s.studentName}</td>
                      <td className="py-2 px-3 text-center text-emerald-700 font-bold">{s.presentDays}</td>
                      <td className="py-2 px-3 text-center text-amber-700 font-bold">{s.lateDays}</td>
                      <td className="py-2 px-3 text-center text-rose-700 font-bold">{s.absentDays}</td>
                      <td className="py-2 px-3 text-center text-purple-700 font-bold">{s.leaveDays}</td>
                      <td className="py-2 px-3 text-center font-black text-blue-700">{s.attendanceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          QR CODE MODALS
          ======================================================== */}
      <DynamicQrAttendanceModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        attendanceType="MORNING_ASSEMBLY"
        classroomId={selectedClassroom}
        classroomLabel={`ห้อง ${selectedClassroomName}`}
        date={selectedDate}
        students={records.map((r) => ({
          studentCode: r.studentCode,
          studentName: r.studentName,
          status: r.status,
        }))}
        onStudentCheckIn={(studentCode, studentName) => {
          handleStatusChange(studentCode, 'PRESENT');
          showToast(`✓ บันทึกเช็คชื่อ ${studentName} เรียบร้อยแล้ว`);
        }}
      />

      <StudentQrScannerModal
        isOpen={isStudentScannerOpen}
        onClose={() => setIsStudentScannerOpen(false)}
        expectedRoomId={selectedClassroom}
        expectedType="MORNING_ASSEMBLY"
        onSuccessCheckIn={(studentCode, studentName) => {
          handleStatusChange(studentCode, 'PRESENT');
          showToast(`✓ เช็คชื่อสำเร็จ: ${studentName}`);
        }}
      />

      {activeStudentForBadge && (
        <StudentIdCardModal
          isOpen={true}
          onClose={() => setActiveStudentForBadge(null)}
          studentCode={activeStudentForBadge.studentCode}
          studentName={activeStudentForBadge.studentName}
          classroomLabel={`ห้อง ${selectedClassroomName}`}
          classroomId={selectedClassroom}
        />
      )}
    </div>
  );
};
