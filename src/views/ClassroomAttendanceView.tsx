// src/views/ClassroomAttendanceView.tsx
// หน้าเช็คชื่อนักเรียน (Classroom Attendance View)
// ตามแนวทางการออกแบบ Pastel Anime Education Dashboard (Prompt typography, #3B82F6, #163A66, #10B981)
// ปฏิบัติตาม 4 Integrity Locks และจำกัดสิทธิ์เฉพาะห้องที่สอนเท่านั้น
// ปรับปรุงใหม่ตามคำสั่งของผู้ใช้:
// 1. ตารางมี 6 ปุ่มสถานะเคียงกัน (มา, สาย, ขาด, ลา, กิจกรรม, โดดเรียน) กดยกเลิก/เปลี่ยนสถานะได้ใน 1 แตะ
// 2. คอลัมน์: เลขที่, รหัสประจำตัว, คำนำหน้า, ชื่อ-สกุล (ไฮไลต์ชื่อสีแดง/ชมพูเมื่อขาดหรือโดดเรียน)
// 3. เอาเวลาเช็คชื่อและหมายเหตุออกเพื่อความสะอาดตา
// 4. ปุ่ม [📱 QR Code เช็คชื่อ], [✓ มาครบทุกคน], [✨ ตรวจความสอดคล้อง] ย้ายมาไว้ตรงหัวตาราง
// 5. เอาปุ่ม "ไปเช็คแถวเช้า" และ "จำลองมือถือ" ออก
// 6. เอาแถบการ์ด 4 ใบด้านล่างและคำคมออก
// 7. บันทึกผลผ่านปุ่ม [💾 บันทึกผลการเช็คชื่อ] ด้านล่างสุดครั้งเดียว พร้อมป้ายแจ้งเตือนเมื่อยังไม่ได้บันทึก

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
  X,
  CalendarDays,
  QrCode,
  Save,
  AlertTriangle,
  Flame,
  CheckCheck,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
  type AssemblyCalendarDayInfo,
  type ClassroomTermStatsSummary,
} from '../services/attendanceCorrelationService';
import { studentService } from '../services/studentService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { DynamicQrAttendanceModal } from '../components/attendance/DynamicQrAttendanceModal';
import { StudentQrScannerModal } from '../components/attendance/StudentQrScannerModal';
import { StudentIdCardModal } from '../components/attendance/StudentIdCardModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

export interface ClassroomAttendanceViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

// ข้อมูลรายวิชาและห้องเรียนที่ครูสอนจริง (รูปแบบ [รหัสวิชา] [ชื่อวิชา])
export interface TeacherCourseOption {
  code: string;
  name: string;
  shortSubject: string;
  room: string;
  roomLabel: string;
  period: number;
}

export const TEACHER_COURSES: TeacherCourseOption[] = [
  {
    code: 'ญ31201',
    name: 'ญ31201 ภาษาญี่ปุ่น 1',
    shortSubject: 'ภาษาญี่ปุ่น 1',
    room: 'room-3-1',
    roomLabel: 'ม.3/1 (ห้องประจำชั้น)',
    period: 1,
  },
  {
    code: 'ญ33201',
    name: 'ญ33201 ภาษาญี่ปุ่น 3',
    shortSubject: 'ภาษาญี่ปุ่น 3',
    room: 'room-3-2',
    roomLabel: 'ม.3/2',
    period: 2,
  },
  {
    code: 'ญ21202',
    name: 'ญ21202 ภาษาญี่ปุ่นเบื้องต้น',
    shortSubject: 'ภาษาญี่ปุ่นเบื้องต้น',
    room: 'room-1-1',
    roomLabel: 'ม.1/1',
    period: 3,
  },
  {
    code: 'ก23901',
    name: 'ก23901 กิจกรรมชุมนุมภาษาญี่ปุ่น',
    shortSubject: 'ชุมนุมภาษาญี่ปุ่น',
    room: 'room-3-1',
    roomLabel: 'ม.3/1 (ห้องประจำชั้น)',
    period: 6,
  },
];

export const TAUGHT_CLASSROOMS = [
  { id: 'room-3-1', label: 'ม.3/1 (ห้องประจำชั้น)' },
  { id: 'room-3-2', label: 'ม.3/2' },
  { id: 'room-1-1', label: 'ม.1/1' },
];

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const parseStudentNameParts = (fullName: string): { title: string; name: string } => {
  const match = fullName.match(/^(ด\.ช\.|ด\.ญ\.|นาย|น\.ส\.)\s*(.*)$/);
  if (match) {
    return { title: match[1], name: match[2] };
  }
  return { title: '-', name: fullName };
};

export const ClassroomAttendanceView: React.FC<ClassroomAttendanceViewProps> = ({
  onDeepNavigate,
}) => {
  // Course, Room, Date state
  const [selectedCourse, setSelectedCourse] = useState<string>('ญ31201');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('room-3-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-02');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data Records & Save State
  const [periodRecords, setPeriodRecords] = useState<PeriodAttendanceRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calendar Widget State
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(10);
  const [monthCalendarDays, setMonthCalendarDays] = useState<AssemblyCalendarDayInfo[]>([]);

  // Mobile Screen Mode ('LIST' = หน้ารายชื่อ, 'CALENDAR' = ปฏิทินย้อนหลัง)
  const [mobileScreen, setMobileScreen] = useState<'LIST' | 'CALENDAR'>('LIST');

  // Stats Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [classroomStats, setClassroomStats] = useState<ClassroomTermStatsSummary | null>(null);

  // Individual Student Attendance Details Modal
  const [personalStatsStudent, setPersonalStatsStudent] = useState<PeriodAttendanceRecord | null>(null);

  // QR Code Attendance Modals State
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isStudentScannerOpen, setIsStudentScannerOpen] = useState<boolean>(false);
  const [activeStudentForBadge, setActiveStudentForBadge] = useState<PeriodAttendanceRecord | null>(null);

  const currentCourse = useMemo(
    () => TEACHER_COURSES.find((c) => c.code === selectedCourse) || TEACHER_COURSES[0],
    [selectedCourse]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // Load Period Records and Calendar Info
  // ----------------------------------------------------
  const loadData = () => {
    let pRecords = attendanceCorrelationService.getPeriodRecords(
      selectedCourse,
      selectedClassroom,
      selectedDate,
      selectedPeriod
    );

    // If records are empty in storage, load actual enrolled students from studentService
    if (pRecords.length === 0) {
      const enrolledStudents = studentService.getStudents(selectedClassroom);
      if (enrolledStudents && enrolledStudents.length > 0) {
        const seeded: PeriodAttendanceRecord[] = enrolledStudents.map((stu) => ({
          id: `per-${selectedDate.replace(/-/g, '')}-${selectedCourse}-${stu.code}`,
          date: selectedDate,
          classroomId: selectedClassroom,
          courseCode: selectedCourse,
          courseName: currentCourse?.shortSubject || 'รายวิชา',
          periodNo: selectedPeriod,
          studentId: stu.id,
          studentCode: stu.code,
          studentName: stu.name,
          status: 'PRESENT',
          source: 'MANUAL',
          isOverridden: false,
          markedAt: `${selectedDate}T08:30:00.000Z`,
        }));
        pRecords = seeded;
      }
    }

    setPeriodRecords(pRecords);
    setHasUnsavedChanges(false);

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
  }, [selectedCourse, selectedClassroom, selectedDate, selectedPeriod]);

  // Handle course dropdown change
  const handleCourseChange = (courseCode: string) => {
    const course = TEACHER_COURSES.find((c) => c.code === courseCode);
    if (course) {
      setSelectedCourse(course.code);
      setSelectedClassroom(course.room);
      setSelectedPeriod(course.period);
    }
  };

  // Handle classroom dropdown change
  const handleClassroomChange = (roomId: string) => {
    setSelectedClassroom(roomId);
    const matchedCourse = TEACHER_COURSES.find((c) => c.room === roomId);
    if (matchedCourse) {
      setSelectedCourse(matchedCourse.code);
      setSelectedPeriod(matchedCourse.period);
    }
  };

  // ----------------------------------------------------
  // In-Memory Status Marking Actions
  // ----------------------------------------------------
  const handleStatusChange = (studentCode: string, newStatus: AttendanceStatusCode) => {
    setPeriodRecords((prev) =>
      prev.map((r) =>
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
      )
    );
    setHasUnsavedChanges(true);
  };

  // Batch mark all present
  const handleBatchMarkAllPresent = () => {
    setPeriodRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'PRESENT',
        markedAt: new Date().toISOString(),
      }))
    );
    setHasUnsavedChanges(true);
    showToast('✓ ปรับสถานะนักเรียนทุกคนเป็น "มาเรียน" เรียบร้อย (กดบันทึกเพื่อยืนยัน)');
  };

  // Save all records at once (Bottom Save Button)
  const handleSaveAttendance = () => {
    if (periodRecords.length === 0) {
      showToast('⚠️ ไม่พบข้อมูลนักเรียนสำหรับบันทึก');
      return;
    }

    attendanceCorrelationService.savePeriodRecords(periodRecords);
    setHasUnsavedChanges(false);
    showToast(
      `💾 บันทึกผลการเช็คชื่อวิชา ${selectedCourse} (${periodRecords.length} คน) ประจำวันที่ ${selectedDate} เรียบร้อยแล้ว`
    );
  };

  // Run 4 Integrity Locks Correlation
  const handleRunCorrelation = () => {
    const res = attendanceCorrelationService.runCorrelation(
      selectedClassroom,
      selectedDate
    );

    loadData();

    if (res.changes.length > 0) {
      showToast(
        `✨ ระบบตรวจความสอดคล้องพบ ${res.changes.length} รายการ (ปรับโดดเรียน ${res.totalTruanciesDetected} คน, สาย ${res.totalLatePromotions} คน)`
      );
    } else {
      showToast('✓ ตรวจสอบแล้ว ข้อมูลการเข้าแถวและคาบเรียนสอดคล้องกันอย่างสมบูรณ์');
    }
  };

  // Stats computation for header cards
  const stats = useMemo(() => {
    const total = periodRecords.length;
    const present = periodRecords.filter((r) => r.status === 'PRESENT').length;
    const late = periodRecords.filter((r) => r.status === 'LATE').length;
    const absent = periodRecords.filter((r) => r.status === 'ABSENT').length;
    const leave = periodRecords.filter((r) => r.status === 'LEAVE').length;
    const activity = periodRecords.filter((r) => r.status === 'ACTIVITY').length;
    const truancy = periodRecords.filter((r) => r.status === 'TRUANCY').length;

    const presentRate = total > 0 ? Math.round(((present + late + activity) / total) * 100) : 100;
    const lateRate = total > 0 ? Math.round((late / total) * 100) : 0;
    const absentRate = total > 0 ? Math.round(((absent + truancy) / total) * 100) : 0;
    const leaveRate = total > 0 ? Math.round((leave / total) * 100) : 0;

    return {
      total,
      present,
      late,
      absent,
      leave,
      activity,
      truancy,
      presentRate,
      lateRate,
      absentRate,
      leaveRate,
    };
  }, [periodRecords]);

  // Filtered Records based on Search and Tab
  const filteredRecords = useMemo(() => {
    return periodRecords.filter((rec) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery.trim());

      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periodRecords, searchQuery, statusFilter]);

  const formatDateThai = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[0], 10) + 543;
      return `${day} ${THAI_MONTHS[month - 1]} ${year}`;
    }
    return dateStr;
  };

  const selectedDayInfo = useMemo(() => {
    return monthCalendarDays.find((d) => d.date === selectedDate);
  }, [monthCalendarDays, selectedDate]);

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

  const handleSelectCalendarDate = (date: string) => {
    setSelectedDate(date);
    if (mobileScreen === 'CALENDAR') {
      setMobileScreen('LIST');
    }
  };

  // Open Classroom Term Stats Modal
  const handleOpenStatsModal = () => {
    const summary = attendanceCorrelationService.getClassroomCumulativeStats(selectedClassroom);
    setClassroomStats(summary);
    setIsStatsModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-32 lg:pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/90 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-slide-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO BANNER: สไตล์ Pastel Anime Education Dashboard                       */}
      {/* ========================================================================= */}
      <PageHeroBanner
        badgeText={`คาบที่ ${selectedPeriod}`}
        badgeClass="bg-emerald-600 text-white"
        title="เช็คชื่อเข้าเรียน (Classroom Attendance)"
        subtitle={`บันทึกการเข้าเรียนรายคาบ วิชา ${currentCourse.name} ห้อง ${currentCourse.roomLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
              คาบที่ {selectedPeriod}
            </span>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* CONTROLS BAR: เลือกรายวิชา • ห้องเรียน • วันที่ • เช็คชื่อวันนี้          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
          {/* 1. รายวิชาที่สอน (Course Selector: [รหัสวิชา] [ชื่อวิชา]) */}
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

          {/* 2. ห้องเรียน (Classroom Selector) */}
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

          {/* 3. วันที่ (Date Picker) */}
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
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
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

          {/* 4. Action Button: เช็คชื่อทุกคนมาเรียนทันที */}
          <div className="w-full">
            <button
              type="button"
              onClick={handleBatchMarkAllPresent}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>✓ มาครบทุกคนวันนี้</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 KPI METRIC CARDS                                                        */}
      {/* ========================================================================= */}
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

        {/* มา + กิจกรรม */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">มา / กิจกรรม</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.present + stats.activity} คน
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

        {/* ขาด + โดดเรียน */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">ขาด / โดดเรียน</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                {stats.absent + stats.truancy} คน
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
      {/* MOBILE SCREEN MODE TABS (LIST vs CALENDAR)                                */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setMobileScreen('LIST')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mobileScreen === 'LIST'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          📋 รายชื่อเช็คชื่อ ({filteredRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileScreen('CALENDAR')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mobileScreen === 'CALENDAR'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          📅 ปฏิทินย้อนหลัง
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: TABLE & MINI CALENDAR                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Student Roll Call List (Col 8 on Desktop)    */}
        {/* ========================================================= */}
        <div
          className={`space-y-4 ${
            mobileScreen === 'CALENDAR' ? 'hidden lg:block' : 'block'
          } lg:col-span-8`}
        >
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header Toolbar: Controls, QR Button, Correlation, Batch Present */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentCourse.name}</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      ประจำวันที่ {formatDateThai(selectedDate)} (คาบที่ {selectedPeriod})
                    </p>
                  </div>
                </div>

                {/* Toolbar Buttons: QR Code, Batch Present, Integrity Locks */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="เปิด QR Code สำหรับนักเรียนสแกน หรือครูสแกนบัตรนักเรียน"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code เช็คชื่อ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchMarkAllPresent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>มาครบทุกคน</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRunCorrelation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="รันระบบ 4 Integrity Locks ตรวจสอบความสอดคล้องกับการเข้าแถว"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ตรวจความสอดคล้อง</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenStatsModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>ดูสถิติรวม</span>
                  </button>
                </div>
              </div>

              {/* Search & Status Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Search input */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อหรือรหัส..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status filter tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold overflow-x-auto">
                  {[
                    { key: 'ALL', label: 'ทั้งหมด' },
                    { key: 'PRESENT', label: 'มา' },
                    { key: 'LATE', label: 'สาย' },
                    { key: 'ABSENT', label: 'ขาด' },
                    { key: 'LEAVE', label: 'ลา' },
                    { key: 'ACTIVITY', label: 'กิจกรรม' },
                    { key: 'TRUANCY', label: 'โดดเรียน' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === tab.key
                          ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">เลขที่</th>
                    <th className="py-3 px-3 w-24 text-center">รหัสประจำตัว</th>
                    <th className="py-3 px-3 w-20 text-center">คำนำหน้า</th>
                    <th className="py-3 px-4">ชื่อ - สกุลนักเรียน</th>
                    <th className="py-3 px-4 text-center">การเช็คชื่อ (แตะเพื่อบันทึก)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center">
                        <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                            <Users className="w-7 h-7" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-1">
                            ยังไม่มีรายชื่อนักเรียนในห้องเรียนนี้
                          </h3>
                          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            สามารถจัดการและเพิ่มรายชื่อนักเรียน หรือนำเข้าไฟล์ Excel ได้ที่ระบบบัญชีรายชื่อนักเรียน
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              onDeepNavigate?.({ view: 'roster', classroomId: selectedClassroom })
                            }
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Users className="w-4 h-4" />
                            <span>ไปที่บัญชีรายชื่อนักเรียน</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((stu, index) => {
                      const { title, name } = parseStudentNameParts(stu.studentName);
                      const isAlert = stu.status === 'ABSENT' || stu.status === 'TRUANCY';

                      return (
                        <tr
                          key={stu.studentCode}
                          className={`transition-colors group ${
                            isAlert
                              ? 'bg-rose-50/50 hover:bg-rose-50 border-l-4 border-l-rose-500'
                              : 'hover:bg-blue-50/30'
                          }`}
                        >
                          {/* เลขที่ */}
                          <td className="py-3 px-3 text-center text-slate-500 font-bold">
                            {index + 1}
                          </td>

                          {/* รหัสประจำตัว */}
                          <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px] font-semibold">
                            {stu.studentCode}
                          </td>

                          {/* คำนำหน้า */}
                          <td className="py-3 px-3 text-center text-slate-500 font-medium">
                            {title}
                          </td>

                          {/* ชื่อ - สกุล (คลิกเพื่อดูสถิติรายบุคคล) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setPersonalStatsStudent(stu)}
                                className={`text-left font-bold transition-colors cursor-pointer hover:underline ${
                                  isAlert
                                    ? 'text-rose-700 font-extrabold'
                                    : 'text-slate-900 group-hover:text-blue-700'
                                }`}
                                title="คลิกเพื่อดูสถิติการเข้าเรียนส่วนตัว"
                              >
                                {name}
                              </button>
                              {stu.status === 'TRUANCY' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                                  โดดเรียน
                                </span>
                              )}
                              {stu.status === 'ABSENT' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                  ขาดเรียน
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6 ปุ่มสถานะเคียงกัน (มา, สาย, ขาด, ลา, กิจกรรม, โดดเรียน) */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'PRESENT')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                มา
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'LATE')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'LATE'
                                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                สาย
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'ABSENT')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                                }`}
                              >
                                ขาด
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'LEAVE')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'LEAVE'
                                    ? 'bg-purple-600 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                                }`}
                              >
                                ลา
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'ACTIVITY')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'ACTIVITY'
                                    ? 'bg-sky-600 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
                                }`}
                              >
                                กิจกรรม
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stu.studentCode, 'TRUANCY')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  stu.status === 'TRUANCY'
                                    ? 'bg-red-800 text-white shadow-xs scale-105'
                                    : 'text-slate-600 hover:text-red-900 hover:bg-red-50'
                                }`}
                              >
                                โดดเรียน
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (แปลงตารางเป็น Card บนมือถือ) */}
            <div className="sm:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  ไม่พบรายชื่อนักเรียนในห้องนี้
                </div>
              ) : (
                filteredRecords.map((stu, index) => {
                  const { title, name } = parseStudentNameParts(stu.studentName);
                  const isAlert = stu.status === 'ABSENT' || stu.status === 'TRUANCY';

                  return (
                    <div
                      key={stu.studentCode}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAlert
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPersonalStatsStudent(stu)}
                            className={`text-xs font-bold cursor-pointer ${
                              isAlert ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            {title} {name}
                          </button>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {stu.studentCode}
                        </span>
                      </div>

                      {/* 6 Rapid Buttons Grid on Mobile */}
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'PRESENT')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          มา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'LATE')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'LATE'
                              ? 'bg-amber-500 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          สาย
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'ABSENT')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'ABSENT'
                              ? 'bg-rose-600 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          ขาด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'LEAVE')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'LEAVE'
                              ? 'bg-purple-600 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          ลา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'ACTIVITY')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'ACTIVITY'
                              ? 'bg-sky-600 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          กิจ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.studentCode, 'TRUANCY')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            stu.status === 'TRUANCY'
                              ? 'bg-red-800 text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          โดด
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Mini Calendar Widget (Col 4 on Desktop)     */}
        {/* ========================================================= */}
        <div
          className={`space-y-4 ${
            mobileScreen === 'LIST' ? 'hidden lg:block' : 'block'
          } lg:col-span-4`}
        >
          {/* Mini Calendar Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  ปฏิทินการสอน ({THAI_MONTHS[calendarMonth - 1]} {calendarYear + 543})
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid (อา - ส) */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 pb-1">
              <span>อา</span>
              <span>จ</span>
              <span>อ</span>
              <span>พ</span>
              <span>พฤ</span>
              <span>ศ</span>
              <span>ส</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCalendarDays.map((day) => {
                const isSelected = day.date === selectedDate;
                const isChecked = day.isChecked;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleSelectCalendarDate(day.date)}
                    className={`h-8 w-8 mx-auto rounded-full text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                        : isChecked
                        ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200'
                        : day.isPastOrToday && day.isWeekday
                        ? 'bg-rose-100/90 text-rose-700 hover:bg-rose-200'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {day.dayOfMonth}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>สอนแล้ว</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>ยังไม่เช็ค</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>เลือกอยู่</span>
              </div>
            </div>
          </div>

          {/* Selected Date Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                สรุปวันที่ {formatDateThai(selectedDate)}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedDayInfo?.isChecked
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {selectedDayInfo?.isChecked ? 'บันทึกแล้ว' : 'ยังไม่บันทึก'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                <div className="text-sm font-extrabold">{stats.present + stats.activity}</div>
                <div className="text-[10px] text-emerald-600">มา</div>
              </div>
              <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                <div className="text-sm font-extrabold">{stats.late}</div>
                <div className="text-[10px] text-amber-600">สาย</div>
              </div>
              <div className="p-2 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                <div className="text-sm font-extrabold">{stats.absent}</div>
                <div className="text-[10px] text-rose-600">ขาด</div>
              </div>
              <div className="p-2 bg-purple-50 text-purple-800 rounded-xl border border-purple-200">
                <div className="text-sm font-extrabold">{stats.leave}</div>
                <div className="text-[10px] text-purple-600">ลา</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM SAVE ACTION BAR                                             */}
      {/* ========================================================================= */}
      <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>มีการแก้ไขที่ยังไม่ได้บันทึก</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>ข้อมูลบันทึกล่าสุดเรียบร้อย</span>
              </span>
            )}
            <span className="hidden md:inline text-slate-400">
              • วิชา {selectedCourse} • ห้อง {currentCourse.roomLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveAttendance}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ring-2 ring-blue-300 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>💾 บันทึกผลการเช็คชื่อเข้าเรียน</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CLASSROOM TERM CUMULATIVE STATS                                    */}
      {/* ========================================================================= */}
      {isStatsModalOpen && classroomStats && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                    สถิติการเข้าเรียนสะสมตลอดภาคเรียน ({currentCourse.name})
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    ห้อง {currentCourse.roomLabel} • รวม {classroomStats.totalAssemblyDays} คาบที่สอนจริง
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

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">จำนวนนักเรียน</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {classroomStats.totalStudents} คน
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">คาบสอนทั้งหมด</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">
                    {classroomStats.totalAssemblyDays} คาบ
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">อัตรามาเรียนเฉลี่ย</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {classroomStats.averageRate}%
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">เกณฑ์มีสิทธิ์สอบ (80%)</div>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">
                    {classroomStats.averageRate >= 80 ? 'ผ่านเกณฑ์' : 'เฝ้าระวัง'}
                  </div>
                </div>
              </div>

              {/* Table of student attendance */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center">#</th>
                      <th className="py-2.5 px-3">ชื่อ - สกุลนักเรียน</th>
                      <th className="py-2.5 px-3 text-center">มาเรียน</th>
                      <th className="py-2.5 px-3 text-center">สาย</th>
                      <th className="py-2.5 px-3 text-center">ขาด</th>
                      <th className="py-2.5 px-3 text-center">ลา</th>
                      <th className="py-2.5 px-3 text-center">ร้อยละเวลาเรียน</th>
                      <th className="py-2.5 px-3 text-center">สถานะสิทธิ์สอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {classroomStats.students.map((stu, idx) => (
                      <tr key={stu.studentCode} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {stu.studentName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                          {stu.presentDays}
                        </td>
                        <td className="py-2.5 px-3 text-center text-amber-700 font-bold">
                          {stu.lateDays}
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-700 font-bold">
                          {stu.absentDays}
                        </td>
                        <td className="py-2.5 px-3 text-center text-purple-700 font-bold">
                          {stu.leaveDays}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-700">
                          {stu.attendanceRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stu.attendanceRate >= 80
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {stu.attendanceRate >= 80 ? 'มีสิทธิ์สอบ' : 'เสี่ยง มส.'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INDIVIDUAL STUDENT ATTENDANCE STATS                                */}
      {/* ========================================================================= */}
      {personalStatsStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  สถิติเวลาเรียนรายบุคคล
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {personalStatsStudent.studentName} ({personalStatsStudent.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPersonalStatsStudent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-700 font-bold">สถานะวันนี้</div>
                <div className="text-sm font-extrabold text-blue-900">
                  {personalStatsStudent.status === 'PRESENT' && 'มาเรียน'}
                  {personalStatsStudent.status === 'LATE' && 'มาสาย'}
                  {personalStatsStudent.status === 'ABSENT' && 'ขาดเรียน'}
                  {personalStatsStudent.status === 'LEAVE' && 'ลา'}
                  {personalStatsStudent.status === 'ACTIVITY' && 'กิจกรรม'}
                  {personalStatsStudent.status === 'TRUANCY' && 'โดดเรียน'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-800 font-bold">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>วิชา {selectedCourse}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                <div className="font-bold text-sm">92%</div>
                <div className="text-[10px] text-emerald-600">สิทธิ์สอบ (ผ่าน)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200">
                <div className="font-bold text-sm">36 คาบ</div>
                <div className="text-[10px] text-slate-500">เวลาเรียนทั้งหมด</div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
                <div className="font-bold text-sm">33 คาบ</div>
                <div className="text-[10px] text-purple-600">มาเรียนจริง</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPersonalStatsStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Attendance Modal */}
      <DynamicQrAttendanceModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        attendanceType="CLASSROOM_PERIOD"
        classroomId={selectedClassroom}
        classroomLabel={currentCourse.roomLabel}
        courseCode={selectedCourse}
        courseName={currentCourse.name}
        periodNo={selectedPeriod}
        date={selectedDate}
        students={periodRecords.map((r) => ({
          studentCode: r.studentCode,
          studentName: r.studentName,
          status: r.status,
        }))}
        onStudentCheckIn={(studentCode: string) => {
          handleStatusChange(studentCode, 'PRESENT');
          showToast(`✓ บันทึกการเข้าเรียนของรหัส ${studentCode} สำเร็จ`);
        }}
      />

      {/* Student QR Scanner Modal */}
      <StudentQrScannerModal
        isOpen={isStudentScannerOpen}
        onClose={() => setIsStudentScannerOpen(false)}
        expectedRoomId={selectedClassroom}
        expectedType="CLASSROOM_PERIOD"
        expectedCourseCode={selectedCourse}
        onSuccessCheckIn={(studentCode: string, studentName: string) => {
          handleStatusChange(studentCode, 'PRESENT');
          showToast(`✓ บันทึกเวลาเข้าเรียนของ ${studentName} เรียบร้อยแล้ว`);
        }}
      />

      {/* Student ID Card Modal */}
      {activeStudentForBadge && (
        <StudentIdCardModal
          isOpen={Boolean(activeStudentForBadge)}
          onClose={() => setActiveStudentForBadge(null)}
          studentCode={activeStudentForBadge.studentCode}
          studentName={activeStudentForBadge.studentName}
          classroomId={selectedClassroom}
          classroomLabel={currentCourse.roomLabel}
        />
      )}
    </div>
  );
};
