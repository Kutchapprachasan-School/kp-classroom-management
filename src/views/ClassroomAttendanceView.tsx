// src/views/ClassroomAttendanceView.tsx
// หน้าเช็คชื่อเข้าเรียน (Classroom Attendance View)
// ตามแนวทางการออกแบบ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// ตรงตามภาพต้นแบบ media_1791315379363.jpg ทั้ง Desktop 2 คอลัมน์ และ Mobile First (2 หน้าจอ: เช็คชื่อ + ปฏิทินย้อนหลัง)
// ปฏิบัติตาม 4 Integrity Locks และจำกัดสิทธิ์เฉพาะห้องที่สอนเท่านั้น

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Award,
  Sparkles,
  Calendar,
  BookOpen,
  Users,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Printer,
  Download,
  Info,
  CalendarDays,
  Smartphone,
  Monitor,
  Shield,
  BarChart3,
  Edit3,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
  type MorningAssemblyRecord,
  type AssemblyCalendarDayInfo,
  type ClassroomTermStatsSummary,
  JAPANESE_M31_STUDENTS,
} from '../services/attendanceCorrelationService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';

export interface ClassroomAttendanceViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

// ข้อมูลรายวิชาและห้องเรียนที่ครูนายปัญจพล เกษรัตน์ สอนจริง (เฉพาะห้องที่สอน)
export interface TeacherCourseOption {
  code: string;
  name: string;
  shortSubject: string;
  room: string;
  roomLabel: string;
}

export const TEACHER_COURSES: TeacherCourseOption[] = [
  {
    code: 'ญ31201',
    name: 'ภาษาญี่ปุ่น ม.3/1',
    shortSubject: 'ภาษาญี่ปุ่น',
    room: 'room-3-1',
    roomLabel: 'ม.3/1 (ห้องประจำชั้น)',
  },
  {
    code: 'ญ33201',
    name: 'ภาษาญี่ปุ่น 3 ม.3/2',
    shortSubject: 'ภาษาญี่ปุ่น 3',
    room: 'room-3-2',
    roomLabel: 'ม.3/2',
  },
  {
    code: 'ญ21202',
    name: 'ภาษาญี่ปุ่นเบื้องต้น ม.1/1',
    shortSubject: 'ภาษาญี่ปุ่นเบื้องต้น',
    room: 'room-1-1',
    roomLabel: 'ม.1/1',
  },
  {
    code: 'ก23901',
    name: 'กิจกรรมชุมนุมภาษาญี่ปุ่น ม.3/1',
    shortSubject: 'ชุมนุมภาษาญี่ปุ่น',
    room: 'room-3-1',
    roomLabel: 'ม.3/1 (ห้องประจำชั้น)',
  },
];

// รายการห้องเรียนที่สอน (ดึงเฉพาะห้องที่มีวิชาสอน)
export const TAUGHT_CLASSROOMS = [
  { id: 'room-3-1', label: 'ม.3/1 (ห้องประจำชั้น)' },
  { id: 'room-3-2', label: 'ม.3/2' },
  { id: 'room-1-1', label: 'ม.1/1' },
];

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const ClassroomAttendanceView: React.FC<ClassroomAttendanceViewProps> = ({
  onDeepNavigate: _onDeepNavigate,
}) => {
  // Course, Room, Date state
  const [selectedCourse, setSelectedCourse] = useState<string>('ญ31201');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('room-3-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-02');
  const [selectedPeriod] = useState<number>(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data Records
  const [periodRecords, setPeriodRecords] = useState<PeriodAttendanceRecord[]>([]);
  const [_morningRecords, setMorningRecords] = useState<MorningAssemblyRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calendar Widget State
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(10);
  const [monthCalendarDays, setMonthCalendarDays] = useState<AssemblyCalendarDayInfo[]>([]);

  // Mobile Mode State
  // 'LIST' = หน้าเช็คชื่อ (Mobile Screen 1), 'CALENDAR' = หน้าปฏิทินย้อนหลัง (Mobile Screen 2)
  const [mobileScreen, setMobileScreen] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Stats Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [classroomStats, setClassroomStats] = useState<ClassroomTermStatsSummary | null>(null);
  const [statsSearch, setStatsSearch] = useState<string>('');
  const [statsFilter, setStatsFilter] = useState<'ALL' | 'PASS' | 'RISK'>('ALL');

  // Quick Action Sheet for Mobile Status Change
  const [activeStudentForSheet, setActiveStudentForSheet] = useState<PeriodAttendanceRecord | null>(null);

  // Load Period Records and Calendar Info
  const loadData = () => {
    let pRecords = attendanceCorrelationService.getPeriodRecords(
      selectedCourse,
      selectedClassroom,
      selectedDate,
      selectedPeriod
    );

    // If records are empty for today or selected date, generate fallback records from baseline
    if (pRecords.length === 0) {
      if (selectedCourse === 'ญ31201' && selectedClassroom === 'room-3-1') {
        const seeded: PeriodAttendanceRecord[] = JAPANESE_M31_STUDENTS.map((stu) => ({
          id: `per-${selectedDate.replace(/-/g, '')}-jp1-${stu.code}`,
          date: selectedDate,
          classroomId: selectedClassroom,
          courseCode: selectedCourse,
          courseName: 'ภาษาญี่ปุ่น',
          periodNo: selectedPeriod,
          studentId: stu.id,
          studentCode: stu.code,
          studentName: stu.name,
          status: selectedDate === '2026-10-02' ? stu.defaultStatus : 'PRESENT',
          source: 'MANUAL',
          isOverridden: false,
          correlationNote: selectedDate === '2026-10-02' && stu.defaultNote !== '-' ? stu.defaultNote : undefined,
          markedAt: `${selectedDate}T07:50:00.000Z`,
        }));
        attendanceCorrelationService.savePeriodRecords(seeded);
        pRecords = seeded;
      }
    }

    const mRecords = attendanceCorrelationService.getMorningRecords(
      selectedClassroom,
      selectedDate
    );
    setPeriodRecords(pRecords);
    setMorningRecords(mRecords);

    // Load monthly calendar statuses
    const monthDays = attendanceCorrelationService.getPeriodCalendarMonthStatus(
      selectedCourse,
      selectedClassroom,
      calendarYear,
      calendarMonth,
      '2026-10-02'
    );
    setMonthCalendarDays(monthDays);
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedClassroom, selectedDate, selectedPeriod, calendarYear, calendarMonth]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync course and room selection
  const handleCourseChange = (newCourseCode: string) => {
    setSelectedCourse(newCourseCode);
    const matched = TEACHER_COURSES.find((c) => c.code === newCourseCode);
    if (matched) {
      setSelectedClassroom(matched.room);
    }
  };

  const handleClassroomChange = (newRoomId: string) => {
    setSelectedClassroom(newRoomId);
    const validCourse = TEACHER_COURSES.find((c) => c.room === newRoomId);
    if (validCourse) {
      setSelectedCourse(validCourse.code);
    }
  };

  // Status Change Handler
  const handleStatusChange = (
    studentCode: string,
    studentName: string,
    newStatus: AttendanceStatusCode
  ) => {
    const existing = periodRecords.find((r) => r.studentCode === studentCode);

    if (existing && (existing.source === 'SYSTEM_CORRELATION' || existing.isOverridden)) {
      // Use Lock 1 Override Shield
      attendanceCorrelationService.overridePeriodRecord({
        id: existing.id,
        newStatus,
        overrideBy: 'ครูปัญจพล เกษรัตน์',
        overrideReason: `ครูปรับสถานะเป็น ${getStatusLabel(newStatus)} ด้วยตนเอง`,
      });
    } else {
      attendanceCorrelationService.markPeriodRecord({
        classroomId: selectedClassroom,
        courseCode: selectedCourse,
        courseName: TEACHER_COURSES.find((c) => c.code === selectedCourse)?.shortSubject || 'ภาษาญี่ปุ่น',
        periodNo: selectedPeriod,
        date: selectedDate,
        studentCode,
        studentName,
        status: newStatus,
        source: 'MANUAL',
      });
    }

    loadData();
    showToast(`อัปเดตสถานะของ ${studentName} เป็น "${getStatusLabel(newStatus)}" เรียบร้อย`);
  };

  // Cycle status on tap (มา -> สาย -> ขาด -> ลา -> มา)
  const handleCycleStatus = (rec: PeriodAttendanceRecord) => {
    const order: AttendanceStatusCode[] = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'];
    const currentIndex = order.indexOf(rec.status);
    const nextStatus = order[(currentIndex + 1) % order.length];
    handleStatusChange(rec.studentCode, rec.studentName, nextStatus);
  };

  // Batch mark all students present
  const handleBatchMarkAllPresent = () => {
    const updated = periodRecords.map((r) => ({
      ...r,
      status: 'PRESENT' as AttendanceStatusCode,
      source: 'MANUAL' as const,
      markedAt: new Date().toISOString(),
    }));
    attendanceCorrelationService.savePeriodRecords(updated);
    loadData();
    showToast('✓ เช็คชื่อนักเรียนทั้งห้องเป็น "มา" ครบทุกคนเรียบร้อย');
  };

  // Trigger correlation engine (Lock 2 Truancy & Lock 3 Late Promotion)
  const handleRunCorrelation = () => {
    const result = attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    loadData();
    if (result.changes.length > 0) {
      showToast(
        `ประมวลผล 4 Locks: โดดเรียน ${result.totalTruanciesDetected} คน, ปรับสาย ${result.totalLatePromotions} คน`
      );
    } else {
      showToast('ระบบตรวจสอบแล้ว ข้อมูลสอดคล้องสมบูรณ์');
    }
  };

  // Open Classroom Cumulative Stats Modal
  const handleOpenStatsModal = () => {
    const cumulative = attendanceCorrelationService.getCourseCumulativeStats(
      selectedCourse,
      selectedClassroom
    );
    setClassroomStats(cumulative);
    setIsStatsModalOpen(true);
  };

  // Format status labels
  const getStatusLabel = (status: AttendanceStatusCode) => {
    switch (status) {
      case 'PRESENT':
        return 'มา';
      case 'LATE':
        return 'สาย';
      case 'ABSENT':
        return 'ขาด';
      case 'LEAVE':
        return 'ลา';
      case 'ACTIVITY':
        return 'กิจกรรม';
      case 'TRUANCY':
        return 'โดดเรียน';
      default:
        return status;
    }
  };

  // Metrics KPI calculations
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;

    for (const r of periodRecords) {
      if (r.status === 'PRESENT' || r.status === 'ACTIVITY') present++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'ABSENT' || r.status === 'TRUANCY') absent++;
      else if (r.status === 'LEAVE') leave++;
    }

    const total = periodRecords.length > 0 ? periodRecords.length : 28;
    const presentRate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 85.7;
    const lateRate = total > 0 ? Number(((late / total) * 100).toFixed(1)) : 7.1;
    const absentRate = total > 0 ? Number(((absent / total) * 100).toFixed(1)) : 3.6;
    const leaveRate = total > 0 ? Number(((leave / total) * 100).toFixed(1)) : 3.6;

    return {
      total,
      present,
      late,
      absent,
      leave,
      presentRate,
      lateRate,
      absentRate,
      leaveRate,
    };
  }, [periodRecords]);

  // Filtered student records
  const filteredRecords = useMemo(() => {
    return periodRecords.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery);
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periodRecords, searchQuery, statusFilter]);

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Handle Date Selection from Mini-Calendar
  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    showToast(`โหลดข้อมูลการเช็คชื่อวันที่ ${formatDateThai(dateStr)}`);
    if (mobileScreen === 'CALENDAR') {
      setMobileScreen('LIST');
    }
  };

  const formatDateThai = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const thaiYear = Number(y) + 543;
    const monthName = THAI_MONTHS[Number(m) - 1] || '';
    return `${Number(d)} ${monthName} ${thaiYear}`;
  };

  const selectedDayInfo = useMemo(() => {
    return monthCalendarDays.find((d) => d.date === selectedDate);
  }, [monthCalendarDays, selectedDate]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-20 select-none font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (Hero Header) - ตรงตามภาพ media_1791315379363.jpg */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#D9EAFE] via-[#E8F2FE] to-[#FDF4FF] border border-blue-100/80 shadow-xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 z-10">
          {/* Hero Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#163A66] tracking-tight">
                เช็คชื่อเข้าเรียน
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>เฉพาะห้องที่สอน</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              เลือกห้องและวิชาที่สอน เพื่อเช็คชื่อ นร. ในวันนี้
            </p>
          </div>
        </div>

        {/* Hero Top Action Buttons & Mobile Preview Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {/* Mobile Preview Toggle for Teachers on Desktop */}
          <button
            type="button"
            onClick={() => setIsMobilePreview((prev) => !prev)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isMobilePreview
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
            }`}
            title="สลับโหมดจำลองมือถือ เพื่อทดสอบการใช้งานบนสมาร์ทโฟน"
          >
            {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            <span>{isMobilePreview ? 'มุมมองเดสก์ท็อป' : 'จำลองมุมมองมือถือ'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunCorrelation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="รันระบบ 4 Integrity Locks ตรวจสอบความสอดคล้อง"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ตรวจความสอดคล้อง</span>
          </button>

          <button
            type="button"
            onClick={handleBatchMarkAllPresent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>✓ มาครบทุกคน</span>
          </button>
        </div>

        {/* Hero Anime School Mascot Illustration Background Accent */}
        <div className="absolute right-0 bottom-0 top-0 w-80 pointer-events-none opacity-20 md:opacity-40 flex items-end justify-end">
          <img
            src="/images/banners/mascot-teacher.png"
            alt="Mascot"
            className="h-full object-contain object-bottom"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Selectors Bar (รายวิชาที่สอน • ห้องเรียน • วันที่ • ปุ่มเช็คชื่อวันนี้) - ตรงตามภาพ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
          {/* 1. รายวิชาที่สอน (Course Selector - ล็อกเฉพาะวิชาที่สอน) */}
          <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 hover:border-blue-300 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-slate-500 block leading-tight">
                รายวิชาที่สอน
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden cursor-pointer truncate"
              >
                {TEACHER_COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. ห้องเรียน (Classroom Selector - ล็อกเฉพาะห้องที่สอน) */}
          <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 hover:border-blue-300 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-slate-500 block leading-tight">
                ห้องเรียน
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden cursor-pointer truncate"
              >
                {TAUGHT_CLASSROOMS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. วันที่ (Date Picker with Quick Today chip) */}
          <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 hover:border-blue-300 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500 block leading-tight">
                  วันที่
                </label>
                {selectedDate !== '2026-10-02' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-10-02')}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    กลับสู่วันนี้
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Action Button: เช็คชื่อวันนี้ */}
          <div className="w-full">
            <button
              type="button"
              onClick={handleBatchMarkAllPresent}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>✓ เช็คชื่อวันนี้</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards - ตรงตามตัวเลขและสีใน media_1791315379363.jpg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* ทั้งหมด */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">ทั้งหมด</div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {stats.total} คน
            </div>
          </div>
        </div>

        {/* มา */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">มา</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.present} คน
              </span>
              <span className="text-xs font-bold text-emerald-600">
                ({stats.presentRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* สาย */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">สาย</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.late} คน
              </span>
              <span className="text-xs font-bold text-amber-600">
                ({stats.lateRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* ขาด */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">ขาด</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.absent} คน
              </span>
              <span className="text-xs font-bold text-rose-600">
                ({stats.absentRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* ลา */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">ลา</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.leave} คน
              </span>
              <span className="text-xs font-bold text-purple-600">
                ({stats.leaveRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: RESPONSIVE CONTENT (DESKTOP 2 COLUMNS vs MOBILE MODE)           */}
      {/* ========================================================================= */}

      {/* ========================================================= */}
      {/* 1. DESKTOP 2-COLUMN VIEW (เมื่อไม่ใช่โหมดจำลองมือถือ)      */}
      {/* ========================================================= */}
      {!isMobilePreview && (
        <div className="hidden lg:grid grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Student Table (Col 8) */}
          <div className="col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Card Header & Controls */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>รายชื่อนักเรียน ม.3/1 (ภาษาญี่ปุ่น)</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      ประจำวันที่ {formatDateThai(selectedDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อหรือรหัส..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-40"
                    />
                  </div>

                  {/* Status filter pill */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                    {[
                      { key: 'ALL', label: 'ทั้งหมด' },
                      { key: 'PRESENT', label: 'มา' },
                      { key: 'LATE', label: 'สาย' },
                      { key: 'ABSENT', label: 'ขาด' },
                      { key: 'LEAVE', label: 'ลา' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === tab.key
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenStatsModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>จัดการกลุ่ม</span>
                  </button>
                </div>
              </div>

              {/* Desktop Table (6 Columns: #, ชื่อ-นามสกุล, สถานะวันนี้, เวลาเช็ค, หมายเหตุ, ⋮) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4 w-28 text-center">สถานะวันนี้</th>
                      <th className="py-3 px-4 w-28 text-center">เวลาเช็ค</th>
                      <th className="py-3 px-4">หมายเหตุ</th>
                      <th className="py-3 px-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRecords.map((stu, index) => {
                      const seedData = JAPANESE_M31_STUDENTS.find((s) => s.code === stu.studentCode);
                      const checkTime = seedData ? seedData.defaultTime : '07:45 น.';
                      const note = seedData ? seedData.defaultNote : '-';

                      return (
                        <tr
                          key={stu.studentCode}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="py-3 px-4 text-center text-slate-400 font-semibold">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${stu.studentCode}`}
                                alt={stu.studentName}
                                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 object-cover"
                              />
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                  {stu.studentName}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  ภาษาญี่ปุ่น ม.3/1 • {stu.studentCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {/* Status Pill Button - Click to cycle status */}
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(stu)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                stu.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100'
                                  : stu.status === 'LATE'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/90 hover:bg-amber-100'
                                  : stu.status === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/90 hover:bg-rose-100'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200/90 hover:bg-purple-100'
                              }`}
                              title="คลิกเพื่อสลับสถานะ (มา -> สาย -> ขาด -> ลา)"
                            >
                              {stu.status === 'PRESENT' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              {stu.status === 'LATE' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {stu.status === 'ABSENT' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              {stu.status === 'LEAVE' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
                              <span>{getStatusLabel(stu.status)}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 font-medium">
                            {stu.status === 'ABSENT' ? '-' : checkTime}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {note}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400">
                            <button
                              type="button"
                              onClick={() => setActiveStudentForSheet(stu)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Alert / Tip Box - ตรงตาม media_1791315379363.jpg */}
            <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                <div className="font-bold text-blue-900 mb-0.5">การเช็คชื่อวันนี้</div>
                ระบบจะเปิดให้เช็คชื่อได้เฉพาะห้องที่คุณสอนเท่านั้น หากต้องการดูประวัติการเช็คชื่อย้อนหลัง สามารถคลิกที่ปฏิทินเพื่อเลือกวันที่ต้องการได้
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Mini-Calendar & Statistics Widget (Col 4) */}
          <div className="col-span-4 space-y-4">
            {/* Widget 1: ปฏิทินเช็คชื่อ (Mini-Calendar) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">ปฏิทินเช็คชื่อ</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    {THAI_MONTHS[calendarMonth - 1]} {calendarYear + 543}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers (จ. อ. พ. พฤ. ศ. ส. อา.) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Day Cells (เขียว = เช็คแล้ว, แดง = ยังไม่เช็ค, น้ำเงินเข้ม = วันนี้) */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {/* Offset for Monday start */}
                {Array.from({ length: (new Date(calendarYear, calendarMonth - 1, 1).getDay() + 6) % 7 }).map(
                  (_, i) => (
                    <div key={`offset-${i}`} className="h-8" />
                  )
                )}

                {monthCalendarDays.map((day) => {
                  const isSelected = day.date === selectedDate;
                  const isChecked = day.isChecked;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => handleSelectCalendarDate(day.date)}
                      className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                          : isChecked
                          ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200'
                          : day.isPastOrToday && day.isWeekday
                          ? 'bg-rose-100/90 text-rose-700 hover:bg-rose-200'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={`${day.date} • ${isChecked ? 'เช็คแล้ว' : 'ยังไม่เช็ค'}`}
                    >
                      <span>{day.dayOfMonth}</span>
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>เช็คแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>ยังไม่เช็ค</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>วันนี้</span>
                </div>
              </div>
            </div>

            {/* Widget 2: สถิติการเข้าเรียน (ห้อง ม.3/1) - Radial Donut Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    สถิติการเข้าเรียน (ห้อง ม.3/1)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenStatsModal}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  ดูรายละเอียด
                </button>
              </div>

              {/* Donut Chart & Breakdown */}
              <div className="flex items-center justify-around gap-4 pt-2">
                {/* Circular SVG Donut */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Green Segment (85.7%) */}
                    <path
                      className="text-emerald-500"
                      strokeDasharray="85.7, 100"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">
                      85.7%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      มาเรียน
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>มา {stats.present} คน (85.7%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>สาย {stats.late} คน (7.1%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>ขาด {stats.absent} คน (3.6%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>ลา {stats.leave} คน (3.6%)</span>
                  </div>
                </div>
              </div>

              {/* Primary Button to Open Classroom Cumulative Stats */}
              <button
                type="button"
                onClick={handleOpenStatsModal}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>📊 ดูสถิติรวมทั้งห้อง</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE FIRST VIEW (แสดงบนหน้าจอมือถือ หรือเมื่อเปิดจำลองมุมมองมือถือ)     */}
      {/* ========================================================================= */}
      {(isMobilePreview || typeof window !== 'undefined') && (
        <div className={`space-y-4 ${isMobilePreview ? 'max-w-md mx-auto border-4 border-slate-300 rounded-3xl p-4 bg-slate-50 shadow-2xl' : 'lg:hidden'}`}>
          {/* Mobile Top App Bar */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileScreen('LIST')}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">
                {mobileScreen === 'LIST' ? 'เช็คชื่อเข้าเรียน' : 'ปฏิทินเช็คชื่อ'}
              </h2>
            </div>

            {/* Toggle between Screen 1 (Check List) and Screen 2 (Calendar) */}
            <button
              type="button"
              onClick={() => setMobileScreen(mobileScreen === 'LIST' ? 'CALENDAR' : 'LIST')}
              className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>{mobileScreen === 'LIST' ? 'ปฏิทิน' : 'รายชื่อ'}</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* MOBILE SCREEN 1: รายการเช็คชื่อนักเรียน (No horizontal scroll) */}
          {/* ========================================================= */}
          {mobileScreen === 'LIST' && (
            <div className="space-y-3.5">
              {/* Selectors Stack on Mobile */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
                <select
                  value={selectedClassroom}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {TAUGHT_CLASSROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      👥 {r.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {TEACHER_COURSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      📖 {c.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-10-02')}
                    className="px-2.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold"
                  >
                    วันนี้
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBatchMarkAllPresent}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ เช็คชื่อวันนี้ (มาครบทุกคน)</span>
                </button>
              </div>

              {/* Mini KPI Bar on Mobile */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs font-bold">
                <div className="text-slate-700">👥 {stats.total} คน</div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    มา {stats.present}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    สาย {stats.late}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    ขาด {stats.absent}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    ลา {stats.leave}
                  </span>
                </div>
              </div>

              {/* Search Bar on Mobile */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหานักเรียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Vertical Student List - ไม่มีสไลด์ซ้ายขวา ปุ่มแตะใหญ่ นิ้วโป้งกดง่าย */}
              <div className="space-y-2">
                {filteredRecords.map((stu) => {
                  const seedData = JAPANESE_M31_STUDENTS.find((s) => s.code === stu.studentCode);
                  const checkTime = seedData ? seedData.defaultTime : '07:45 น.';
                  const note = seedData ? seedData.defaultNote : '-';

                  return (
                    <div
                      key={stu.studentCode}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${stu.studentCode}`}
                          alt={stu.studentName}
                          className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {stu.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {stu.status === 'ABSENT'
                              ? `ขาด • ${note}`
                              : `${getStatusLabel(stu.status)} ${checkTime}`}
                          </div>
                        </div>
                      </div>

                      {/* Large Tap Status Pill Button (Min Height 44px) */}
                      <button
                        type="button"
                        onClick={() => handleCycleStatus(stu)}
                        className={`min-h-[44px] min-w-[76px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs cursor-pointer ${
                          stu.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300'
                            : stu.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border-2 border-amber-300'
                            : stu.status === 'ABSENT'
                            ? 'bg-rose-50 text-rose-700 border-2 border-rose-300'
                            : 'bg-purple-50 text-purple-700 border-2 border-purple-300'
                        }`}
                        title="แตะเพื่อสลับสถานะ"
                      >
                        {stu.status === 'PRESENT' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        {stu.status === 'LATE' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {stu.status === 'ABSENT' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {stu.status === 'LEAVE' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
                        <span>{getStatusLabel(stu.status)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Mobile Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenStatsModal}
                  className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>📊 ดูสถิติรวมทั้งห้อง</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MOBILE SCREEN 2: ปฏิทินเช็คชื่อ (Mini-Calendar / Retroactive Mode) */}
          {/* ========================================================= */}
          {mobileScreen === 'CALENDAR' && (
            <div className="space-y-4">
              {/* Full Calendar Card on Mobile */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="text-sm font-extrabold text-slate-900">
                    {THAI_MONTHS[calendarMonth - 1]} {calendarYear + 543}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
                  {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {Array.from({ length: (new Date(calendarYear, calendarMonth - 1, 1).getDay() + 6) % 7 }).map(
                    (_, i) => (
                      <div key={`mob-offset-${i}`} className="h-9" />
                    )
                  )}

                  {monthCalendarDays.map((day) => {
                    const isSelected = day.date === selectedDate;
                    const isChecked = day.isChecked;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => handleSelectCalendarDate(day.date)}
                        className={`h-9 w-9 mx-auto rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                            : isChecked
                            ? 'bg-emerald-100/90 text-emerald-800'
                            : day.isPastOrToday && day.isWeekday
                            ? 'bg-rose-100/90 text-rose-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {day.dayOfMonth}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend on Mobile */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>เช็คแล้ว</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>ยังไม่เช็ค</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>วันนี้</span>
                  </div>
                </div>
              </div>

              {/* Day Details Card on Mobile */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ข้อมูลวันที่ {formatDateThai(selectedDate)}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedDayInfo?.isChecked
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {selectedDayInfo?.isChecked ? 'เช็คแล้ว' : 'ยังไม่เช็ค'}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-600">
                  สรุปการเข้าเรียน (ห้อง ม.3/1)
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                    <div className="text-sm font-extrabold">24</div>
                    <div className="text-[10px] text-emerald-600">มา (85.7%)</div>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                    <div className="text-sm font-extrabold">2</div>
                    <div className="text-[10px] text-amber-600">สาย (7.1%)</div>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                    <div className="text-sm font-extrabold">1</div>
                    <div className="text-[10px] text-rose-600">ขาด (3.6%)</div>
                  </div>
                  <div className="p-2 bg-purple-50 text-purple-800 rounded-xl border border-purple-200">
                    <div className="text-sm font-extrabold">1</div>
                    <div className="text-[10px] text-purple-600">ลา (3.6%)</div>
                  </div>
                </div>

                {/* Retroactive action prompt */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>เลือกดูย้อนหลัง</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    คลิกวันที่ในปฏิทินเพื่อดูรายละเอียด หรือบันทึกการเช็คชื่อย้อนหลัง
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileScreen('LIST')}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    ✏️ เปิดเช็คชื่อ / แก้ไขวันที่นี้
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM FEATURE HIGHLIGHTS & CALLIGRAPHY QUOTE - ตรงตามภาพ                 */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid grid-cols-4 gap-4 pt-4 border-t border-slate-200/60">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">ใช้งานง่ายบนมือถือ</div>
            <div className="text-[11px] text-slate-500 font-medium">
              ออกแบบให้ใช้งานสะดวก ไม่ต้องสไลด์ซ้าย-ขวา
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">เช็คย้อนหลังได้</div>
            <div className="text-[11px] text-slate-500 font-medium">
              ผ่านปฏิทินที่แสดงสถานะชัดเจน
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">ดูสถิติครบถ้วน</div>
            <div className="text-[11px] text-slate-500 font-medium">
              รู้การมา สาย ขาด ลา ของแต่ละคนและทั้งห้อง
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">เฉพาะห้องที่สอน</div>
            <div className="text-[11px] text-slate-500 font-medium">
              ป้องกันการเช็คผิดห้อง เพิ่มความแม่นยำ
            </div>
          </div>
        </div>
      </div>

      {/* Calligraphy Quote Banner - ตรงตามภาพ */}
      <div className="text-center py-4 text-blue-800/80 text-sm font-semibold italic">
        “ เช็คชื่อ ง่ายขึ้น เพื่อการดูแลนักเรียนที่ดียิ่งขึ้น ”
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CLASSROOM TERM CUMULATIVE STATS (สถิติรวมทั้งห้อง คำนวณรายคน)     */}
      {/* ========================================================================= */}
      {isStatsModalOpen && classroomStats && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                    สถิติการเข้าเรียนสะสมตลอดภาคเรียน : ม.3/1
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    วิชาภาษาญี่ปุ่น (ญ31201) • รวม {classroomStats.totalAssemblyDays} วันที่สอน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & KPI Summary Cards */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">จำนวนนักเรียน</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {classroomStats.totalStudents} คน
                  </div>
                </div>
                <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200/80">
                  <div className="text-xs text-emerald-700 font-semibold">มาเรียนเฉลี่ย</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">
                    {classroomStats.averageRate}%
                  </div>
                </div>
                <div className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-200/80">
                  <div className="text-xs text-blue-700 font-semibold">ผ่านเกณฑ์ 80% (SAR)</div>
                  <div className="text-xl font-extrabold text-blue-800 mt-1">
                    {classroomStats.students.filter((s) => s.attendanceRate >= 80).length} คน
                  </div>
                </div>
                <div className="bg-rose-50/70 rounded-2xl p-3.5 border border-rose-200/80">
                  <div className="text-xs text-rose-700 font-semibold">กลุ่มเสี่ยง มส.</div>
                  <div className="text-xl font-extrabold text-rose-800 mt-1">
                    {classroomStats.students.filter((s) => s.attendanceRate < 80).length} คน
                  </div>
                </div>
              </div>

              {/* Modal Search & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อหรือรหัส นร...."
                    value={statsSearch}
                    onChange={(e) => setStatsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStatsFilter('ALL')}
                    className={`px-3 py-1 rounded-lg ${statsFilter === 'ALL' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsFilter('PASS')}
                    className={`px-3 py-1 rounded-lg ${statsFilter === 'PASS' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    ผ่านเกณฑ์
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsFilter('RISK')}
                    className={`px-3 py-1 rounded-lg ${statsFilter === 'RISK' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    กลุ่มเสี่ยง
                  </button>
                </div>
              </div>

              {/* Cumulative Table per Student */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center">#</th>
                      <th className="py-2.5 px-3">รหัส นร.</th>
                      <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">มาทัน</th>
                      <th className="py-2.5 px-3 text-center text-amber-700">สาย</th>
                      <th className="py-2.5 px-3 text-center text-rose-700">ขาด</th>
                      <th className="py-2.5 px-3 text-center text-purple-700">ลา</th>
                      <th className="py-2.5 px-3 text-center">รวมเวลาเรียน</th>
                      <th className="py-2.5 px-3 text-center">ร้อยละ (%)</th>
                      <th className="py-2.5 px-3 text-center">สถานะ SAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {classroomStats.students
                      .filter((s) => {
                        const mSearch = s.studentName.includes(statsSearch) || s.studentCode.includes(statsSearch);
                        const mFilter =
                          statsFilter === 'ALL' ||
                          (statsFilter === 'PASS' && s.attendanceRate >= 80) ||
                          (statsFilter === 'RISK' && s.attendanceRate < 80);
                        return mSearch && mFilter;
                      })
                      .map((stu, i) => (
                        <tr key={stu.studentCode} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{stu.studentCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{stu.studentName}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{stu.presentDays}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-600">{stu.lateDays}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-rose-600">{stu.absentDays}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-600">{stu.leaveDays}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {stu.earnedDays} / {stu.totalDays} วัน
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-extrabold text-blue-700">{stu.attendanceRate}%</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {stu.attendanceRate >= 80 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ มีสิทธิ์สอบ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ⚠️ เสี่ยง มส.
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast('เตรียมพิมพ์เอกสารสถิติ SAR...')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์รายงาน SAR</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('ส่งออกไฟล์ Excel เรียบร้อย')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออก Excel</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Action Sheet for Mobile Single Row Tap */}
      {activeStudentForSheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-end justify-center p-3 sm:hidden animate-fade-in">
          <div className="bg-white rounded-3xl w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {activeStudentForSheet.studentName}
                </h4>
                <p className="text-xs text-slate-500">เลือกสถานะการเข้าเรียน</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStudentForSheet(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'PRESENT', label: '✓ มาเรียน', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                { key: 'LATE', label: '⏰ มาสาย', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
                { key: 'ABSENT', label: '✕ ขาดเรียน', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
                { key: 'LEAVE', label: '📄 ลาป่วย/กิจ', bg: 'bg-purple-50 text-purple-800 border-purple-300' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    handleStatusChange(
                      activeStudentForSheet.studentCode,
                      activeStudentForSheet.studentName,
                      opt.key as AttendanceStatusCode
                    );
                    setActiveStudentForSheet(null);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border-2 text-center transition-transform active:scale-95 ${opt.bg}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
