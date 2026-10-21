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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
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
  ClipboardCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
  type AssemblyCalendarDayInfo,
  type ClassroomTermStatsSummary,
} from '../services/attendanceCorrelationService';
import { studentService } from '../services/studentService';
import { coursesCurriculumService, type CourseCurriculumRecord } from '../services/coursesCurriculumService';
import { classroomService } from '../services/classroomService';
import type { ClassroomRosterItem } from '../types/viewModels';
import { getBangkokTodayString, getBangkokNow, computeTeachingWeekForDate } from '../utils/timetableDateUtils';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import { DynamicQrAttendanceModal } from '../components/attendance/DynamicQrAttendanceModal';
import { StudentQrScannerModal } from '../components/attendance/StudentQrScannerModal';
import { StudentIdCardModal } from '../components/attendance/StudentIdCardModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { authService } from '../services/authService';
import { academicCalendarService } from '../services/academicCalendarService';

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

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const parseStudentNameParts = (fullName: string): { title: string; name: string } => {
  if (!fullName) return { title: '-', name: '-' };
  const trimmed = fullName.trim();
  const match = trimmed.match(/^(นางสาว|น\.ส\.|เด็กหญิง|ด\.ญ\.|เด็กชาย|ด\.ช\.|นาย|นาง)\s*(.*)$/);
  if (match) {
    return { title: match[1], name: match[2].trim() };
  }
  return { title: '-', name: trimmed };
};

export const ClassroomAttendanceView: React.FC<ClassroomAttendanceViewProps> = ({
  onDeepNavigate,
}) => {
  const currentUser = authService.getCurrentUser();
  const effectiveTeacher =
    currentUser?.role !== 'ADMIN' ? (currentUser?.id || currentUser?.name) : undefined;

  // Curriculum & Classrooms live state - กรองเฉพาะวิชาของครูท่านนี้ (ของใครของมัน)
  const [curriculumCourses, setCurriculumCourses] = useState<CourseCurriculumRecord[]>(() =>
    coursesCurriculumService.getCourses(undefined, undefined, effectiveTeacher)
  );
  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>(() =>
    classroomService.getClassroomsSync()
  );

  useEffect(() => {
    const handleCurriculumSync = () => {
      setCurriculumCourses(
        coursesCurriculumService.getCourses(undefined, undefined, effectiveTeacher)
      );
    };
    const handleClassroomSync = () => {
      setAllClassrooms(classroomService.getClassroomsSync());
    };
    window.addEventListener('kp-courses-curriculum-updated', handleCurriculumSync);
    window.addEventListener('kps-data-sync-event', handleClassroomSync);
    return () => {
      window.removeEventListener('kp-courses-curriculum-updated', handleCurriculumSync);
      window.removeEventListener('kps-data-sync-event', handleClassroomSync);
    };
  }, [effectiveTeacher]);

  const availableCourseOptions: TeacherCourseOption[] = useMemo(() => {
    if (!curriculumCourses || curriculumCourses.length === 0) {
      return [];
    }
    return curriculumCourses.map((c, idx) => {
      const primaryRoomName = c.assignedClassrooms?.[0] || '';
      const matchedRoom = allClassrooms.find(
        (r: ClassroomRosterItem) => r.name === primaryRoomName || r.roomNumber === primaryRoomName || r.id === primaryRoomName
      );
      const roomId = matchedRoom?.id || (primaryRoomName ? `room-${primaryRoomName.replace(/[^0-9-]/g, '')}` : '');
      return {
        code: c.code,
        name: `${c.code} ${c.name}`,
        shortSubject: c.name,
        room: roomId,
        roomLabel: primaryRoomName || 'ยังไม่กำหนดห้องเรียน',
        period: (idx % 6) + 1,
      };
    });
  }, [curriculumCourses, allClassrooms]);

  // Course, Room, Date state
  const todayBangkok = getBangkokTodayString();
  const nowBangkok = getBangkokNow();
  const [selectedCourse, setSelectedCourse] = useState<string>(() => availableCourseOptions[0]?.code || '');
  const [selectedClassroom, setSelectedClassroom] = useState<string>(() => availableCourseOptions[0]?.room || '');
  const [selectedDate, setSelectedDate] = useState<string>(todayBangkok);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // Auto-select valid course and classroom when availableCourseOptions updates
  useEffect(() => {
    if (availableCourseOptions.length > 0) {
      if (!selectedCourse || !availableCourseOptions.some((c) => c.code === selectedCourse)) {
        setSelectedCourse(availableCourseOptions[0].code);
        setSelectedClassroom(availableCourseOptions[0].room);
      }
    }
  }, [availableCourseOptions, selectedCourse]);

  // Available classrooms dynamically filtered based on selected curriculum course
  const availableClassroomOptions = useMemo(() => {
    const activeCurriculum = curriculumCourses.find((c) => c.code === selectedCourse);
    const currentUser = authService.getCurrentUser();
    const currentTeacherName = currentUser?.name?.trim() || '';

    if (activeCurriculum && activeCurriculum.assignedClassrooms && activeCurriculum.assignedClassrooms.length > 0) {
      return activeCurriculum.assignedClassrooms.map((roomName) => {
        const found = allClassrooms.find(
          (c: ClassroomRosterItem) => c.name === roomName || c.roomNumber === roomName || c.id === roomName
        );
        const advisers = found?.advisers || [found?.adviser, found?.coAdviser, found?.thirdAdviser].filter(Boolean) as string[];
        const isAdvisory = Boolean(
          (currentTeacherName && advisers.some((adv) => adv && (adv.includes(currentTeacherName) || currentTeacherName.includes(adv)))) ||
          (currentUser?.classroomId && (currentUser.classroomId === found?.id || currentUser.classroomId === found?.name))
        );
        return {
          id: found?.id || `room-${roomName.replace(/[^0-9-]/g, '')}`,
          label: `${roomName}${isAdvisory ? ' (ห้องประจำชั้น)' : ''}`,
        };
      });
    }

    // Fallback: If no assignedClassrooms or empty, return all real classrooms from allClassrooms
    if (allClassrooms && allClassrooms.length > 0) {
      return allClassrooms.map((c: ClassroomRosterItem) => {
        const advisers = c.advisers || [c.adviser, c.coAdviser, c.thirdAdviser].filter(Boolean) as string[];
        const isAdvisory = Boolean(
          (currentTeacherName && advisers.some((adv) => adv && (adv.includes(currentTeacherName) || currentTeacherName.includes(adv)))) ||
          (currentUser?.classroomId && (currentUser.classroomId === c.id || currentUser.classroomId === c.name))
        );
        return {
          id: c.id,
          label: `${c.name || c.roomNumber || c.id}${isAdvisory ? ' (ห้องประจำชั้น)' : ''}`,
        };
      });
    }

    return [];
  }, [selectedCourse, curriculumCourses, allClassrooms]);

  // Keep selected classroom valid when course changes
  useEffect(() => {
    if (availableClassroomOptions.length > 0) {
      if (!selectedClassroom || !availableClassroomOptions.some((r) => r.id === selectedClassroom)) {
        setSelectedClassroom(availableClassroomOptions[0].id);
      }
    } else {
      setSelectedClassroom('');
    }
  }, [availableClassroomOptions, selectedClassroom]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data Records & Save State
  const [periodRecords, setPeriodRecords] = useState<PeriodAttendanceRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isPeriodSavedInStorage, setIsPeriodSavedInStorage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calendar Widget State
  const [calendarYear, setCalendarYear] = useState<number>(nowBangkok.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(nowBangkok.getMonth() + 1);
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

  const currentCourse = useMemo(() => {
    const fromCurriculum = curriculumCourses.find((c) => c.code === selectedCourse);
    const matchedClassroom = availableClassroomOptions.find((r) => r.id === selectedClassroom);
    const fromAvailable = availableCourseOptions.find((c) => c.code === selectedCourse);

    const roomLabel =
      matchedClassroom?.label ||
      allClassrooms.find((c) => c.id === selectedClassroom)?.name ||
      selectedClassroom ||
      'ห้องเรียน';

    if (fromCurriculum) {
      return {
        code: fromCurriculum.code,
        name: `${fromCurriculum.code} ${fromCurriculum.name}`,
        shortSubject: fromCurriculum.name,
        room: selectedClassroom,
        roomLabel,
        period: fromAvailable?.period || selectedPeriod || 1,
      };
    }
    if (fromAvailable) {
      return {
        ...fromAvailable,
        room: selectedClassroom,
        roomLabel,
      };
    }
    return {
      code: selectedCourse || '',
      name: selectedCourse ? `${selectedCourse}` : 'ไม่มีรายวิชา',
      shortSubject: 'รายวิชา',
      room: selectedClassroom,
      roomLabel,
      period: selectedPeriod || 1,
    };
  }, [availableCourseOptions, curriculumCourses, selectedCourse, selectedClassroom, availableClassroomOptions, allClassrooms, selectedPeriod]);

  const activeTerm = useMemo(() => academicCalendarService.getActiveTerm(), []);
  const teachingWeekInfo = useMemo(() => {
    return computeTeachingWeekForDate(selectedDate, activeTerm);
  }, [selectedDate, activeTerm]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // Load Period Records and Calendar Info
  // ----------------------------------------------------
  const loadData = useCallback(() => {
    if (!selectedCourse || !selectedClassroom) {
      setPeriodRecords([]);
      setHasUnsavedChanges(false);
      setIsPeriodSavedInStorage(false);
      setMonthCalendarDays([]);
      return;
    }

    const savedFromStorage = attendanceCorrelationService.getPeriodRecords(
      selectedCourse,
      selectedClassroom,
      selectedDate,
      selectedPeriod
    );

    const isSaved = savedFromStorage.length > 0;
    setIsPeriodSavedInStorage(isSaved);

    let pRecords = savedFromStorage;

    // If records are empty in storage, load actual enrolled students from studentService
    if (pRecords.length === 0) {
      const enrolledStudents = studentService.getStudents(selectedClassroom).sort((a, b) => Number(a.no || 999) - Number(b.no || 999));
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
      todayBangkok
    );
    setMonthCalendarDays(monthDays);
  }, [
    selectedCourse,
    selectedClassroom,
    selectedDate,
    selectedPeriod,
    currentCourse?.shortSubject,
    calendarYear,
    calendarMonth,
    todayBangkok,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle course dropdown change
  const handleCourseChange = (courseCode: string) => {
    setSelectedCourse(courseCode);
    const currCourse = curriculumCourses.find((c) => c.code === courseCode);
    if (currCourse && currCourse.assignedClassrooms && currCourse.assignedClassrooms.length > 0) {
      const firstRoomName = currCourse.assignedClassrooms[0];
      const found = allClassrooms.find(
        (c: ClassroomRosterItem) => c.name === firstRoomName || c.roomNumber === firstRoomName || c.id === firstRoomName
      );
      setSelectedClassroom(found?.id || `room-${firstRoomName.replace(/[^0-9-]/g, '')}`);
    } else if (allClassrooms && allClassrooms.length > 0) {
      setSelectedClassroom(allClassrooms[0].id);
    } else {
      const course = availableCourseOptions.find((c) => c.code === courseCode);
      if (course) {
        setSelectedClassroom(course.room);
        setSelectedPeriod(course.period);
      }
    }
  };

  // Handle classroom dropdown change
  const handleClassroomChange = (roomId: string) => {
    setSelectedClassroom(roomId);
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
              overrideBy: authService.getCurrentUser()?.name || 'ครูผู้สอน',
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
    setIsPeriodSavedInStorage(true);

    // อัปเดตสถานะปฏิทินทันที
    const monthDays = attendanceCorrelationService.getPeriodCalendarMonthStatus(
      selectedCourse,
      selectedClassroom,
      calendarYear,
      calendarMonth,
      todayBangkok
    );
    setMonthCalendarDays(monthDays);

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

  // ลบนักเรียนคนเดียวออกจากระบบและการเช็คชื่อ
  const handleDeleteStudent = async (student: PeriodAttendanceRecord) => {
    const confirmDelete = window.confirm(
      `คุณต้องการลบข้อมูลของ "${student.studentName}" (รหัส ${student.studentCode}) ออกจากระบบและประวัติการเช็คชื่อทั้งหมดใช่หรือไม่?\n\nข้อมูลนักเรียนคนนี้จะถูกลบออกจากห้องเรียนและการเช็คชื่ออย่างสมบูรณ์`
    );
    if (!confirmDelete) return;

    // 1. ล้างประวัติการเช็คชื่อทั้งหมด (ทั้งคาบเรียนและแถวเช้า)
    attendanceCorrelationService.deleteStudentAttendance(
      student.studentCode || student.studentId,
      selectedClassroom
    );

    // 2. ลบออกจากบัญชีรายชื่อนักเรียน
    try {
      await studentService.delete(selectedClassroom, student.studentId || student.studentCode);
    } catch (err) {
      console.warn('Could not delete from studentService:', err);
    }

    // 3. อัปเดต state และบันทึก
    const updated = periodRecords.filter((r) => r.studentCode !== student.studentCode);
    setPeriodRecords(updated);
    attendanceCorrelationService.savePeriodRecords(updated);
    showToast(`🗑️ ลบข้อมูล "${student.studentName}" ออกจากระบบและประวัติการเช็คชื่อเรียบร้อยแล้ว`);
  };

  // ซิงค์รายชื่อปัจจุบันและกวาดล้างข้อมูลตกค้าง (Orphan Records)
  const handleSyncEnrolledRoster = () => {
    const enrolled = studentService.getStudents(selectedClassroom);
    if (!enrolled || enrolled.length === 0) {
      showToast('⚠️ ไม่พบรายชื่อนักเรียนที่ลงทะเบียนในห้องนี้');
      return;
    }

    const validCodes = enrolled.map((s) => s.code);
    const purged = attendanceCorrelationService.purgeOrphanClassroomRecords(selectedClassroom, validCodes);

    const enrolledMap = new Map(enrolled.map((s) => [s.code, s]));
    const updatedRecords: PeriodAttendanceRecord[] = [];

    // คงรายการที่มีอยู่จริงในห้อง
    for (const r of periodRecords) {
      if (enrolledMap.has(r.studentCode)) {
        updatedRecords.push(r);
        enrolledMap.delete(r.studentCode);
      }
    }

    // เพิ่มนักเรียนใหม่ที่ยังไม่มีในรายการ
    for (const [code, stu] of enrolledMap.entries()) {
      updatedRecords.push({
        id: `per-${selectedDate.replace(/-/g, '')}-${selectedCourse}-${code}`,
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
      });
    }

    attendanceCorrelationService.savePeriodRecords(updatedRecords);
    setPeriodRecords(updatedRecords);
    showToast(`🔄 ซิงค์รายชื่อปัจจุบันสำเร็จ (ล้างข้อมูลตกค้าง ${purged.removedPeriod} รายการ)`);
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
    return periodRecords
      .filter((rec) => {
        const matchSearch =
          searchQuery.trim() === '' ||
          rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.studentCode.includes(searchQuery.trim());

        const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const seatA = Number((a as any).seatNo ?? studentService.findStudentByCode(a.studentCode)?.student.no ?? 999);
        const seatB = Number((b as any).seatNo ?? studentService.findStudentByCode(b.studentCode)?.student.no ?? 999);
        return seatA - seatB;
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
    const enrolledStudents = studentService.getStudents(selectedClassroom);
    const summary = attendanceCorrelationService.getCourseCumulativeStats(
      selectedCourse,
      selectedClassroom,
      enrolledStudents && enrolledStudents.length > 0
        ? enrolledStudents.map((s) => ({ code: s.code, name: s.name }))
        : undefined
    );
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
        badgeClass="bg-blue-50 text-blue-700 border-blue-200"
        title="เช็คชื่อเข้าเรียน (Classroom Attendance)"
        subtitle={`บันทึกการเข้าเรียนรายคาบ วิชา ${currentCourse.name} ห้อง ${currentCourse.roomLabel}`}
        icon={<ClipboardCheck className="w-7 h-7 text-blue-600" />}
        quoteText="การตรงต่อเวลา คือระเบียบวินัยแรกสู่ความสำเร็จ"
      />

      {availableCourseOptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">ยังไม่มีรายวิชาที่สอนในระบบ</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-md">
            กรุณาเพิ่มรายวิชาที่สอนและกำหนดห้องเรียนในเมนู 'หลักสูตร / รายวิชา' เพื่อเริ่มต้นเช็คชื่อนักเรียน
          </p>
          <button
            type="button"
            onClick={() => onDeepNavigate?.({ view: 'settings' })}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>ไปที่การตั้งค่าหลักสูตร / รายวิชา</span>
          </button>
        </div>
      ) : (
        <>
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
                รายวิชาที่สอน (จากหลักสูตร)
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden cursor-pointer truncate"
              >
                {availableCourseOptions.map((c) => (
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
                ห้องเรียน (ตามหลักสูตร)
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => handleClassroomChange(e.target.value)}
                disabled={availableClassroomOptions.length === 0}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden cursor-pointer truncate disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {availableClassroomOptions.length === 0 ? (
                  <option value="">(ยังไม่ได้กำหนดห้องเรียน)</option>
                ) : (
                  availableClassroomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))
                )}
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
                  วันที่ (Asia/Bangkok)
                </label>
                {selectedDate !== todayBangkok && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayBangkok)}
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

      {/* Notice Banner when Selected Date is Outside Active Term (School Break) */}
      {!academicCalendarService.isDateInActiveTerm(selectedDate) && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between gap-3 text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">🏖️</span>
            <span>
              วันที่เลือก ({formatDateThai(selectedDate)}) อยู่นอกช่วงเปิดภาคเรียน: ระบบจะไม่นำสถิติการเช็คชื่อของวันนี้ไปคำนวณรวมในเกณฑ์เวลาเรียน 80% หรือสถิติสะสม
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-200/70 text-amber-950 text-[11px] shrink-0 font-extrabold">
            ช่วงปิดเทอม
          </span>
        </div>
      )}



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
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isPeriodSavedInStorage
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPeriodSavedInStorage ? '✓ บันทึกผลแล้ว' : 'รอเช็คชื่อ'}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                      <span>ประจำวันที่ {formatDateThai(selectedDate)} (คาบที่ {selectedPeriod})</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        สัปดาห์ที่ {teachingWeekInfo.weekNumber} / 20 ({teachingWeekInfo.termLabel})
                      </span>
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

                  <button
                    type="button"
                    onClick={handleSyncEnrolledRoster}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                    title="ซิงค์รายชื่อปัจจุบันและล้างข้อมูลนักเรียนที่ถูกลบไปแล้ว (Orphan Records)"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>ซิงค์รายชื่อปัจจุบัน</span>
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
                    <th className="py-3 px-2 w-12 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {availableClassroomOptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
                        <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-1">
                            ยังไม่ได้กำหนดห้องเรียนสำหรับวิชานี้
                          </h3>
                          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            กรุณากำหนดห้องเรียนที่สอนในเมนู 'หลักสูตร / รายวิชา' ก่อนทำการเช็คชื่อ
                          </p>
                          <button
                            type="button"
                            onClick={() => onDeepNavigate?.({ view: 'settings' })}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>ไปกำหนดห้องเรียนในหลักสูตร</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
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
                              ? 'bg-rose-50/70 hover:bg-rose-50 border-b border-rose-100 ring-1 ring-inset ring-rose-200/60'
                              : 'hover:bg-blue-50/30'
                          }`}
                        >
                          {/* เลขที่ */}
                          <td className="py-3 px-3 text-center text-slate-500 font-bold">
                            {(stu as any).seatNo ?? studentService.findStudentByCode(stu.studentCode)?.student.no ?? index + 1}
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                โดดเรียน
                              </button>
                            </div>
                          </td>

                          {/* จัดการ: ลบนักเรียนคนเดียว */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(stu)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบนักเรียนคนนี้ออกจากระบบ/การเช็คชื่อ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
              {availableClassroomOptions.length === 0 ? (
                <div className="text-center py-8 text-xs text-amber-700 font-medium">
                  ยังไม่ได้กำหนดห้องเรียนสำหรับวิชานี้ (กรุณากำหนดในหลักสูตร)
                </div>
              ) : filteredRecords.length === 0 ? (
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
                            {(stu as any).seatNo ?? studentService.findStudentByCode(stu.studentCode)?.student.no ?? index + 1}
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            {stu.studentCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(stu)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบนักเรียนคนนี้ออกจากระบบ/การเช็คชื่อ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold pb-1">
              <span className="text-purple-600 font-extrabold">อา</span>
              <span className="text-slate-400">จ</span>
              <span className="text-slate-400">อ</span>
              <span className="text-slate-400">พ</span>
              <span className="text-slate-400">พฤ</span>
              <span className="text-slate-400">ศ</span>
              <span className="text-purple-600 font-extrabold">ส</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Padding offset for the first day of the month */}
              {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }).map((_, i) => (
                <div key={`empty-cal-pad-${i}`} className="h-8 w-8 mx-auto" />
              ))}
              {monthCalendarDays.map((day) => {
                const isSelected = day.date === selectedDate;
                const isChecked = day.isChecked;
                const isWeekend = day.isWeekend ?? (day.dayOfWeek === 0 || day.dayOfWeek === 6);
                const isHoliday =
                  day.isHoliday ||
                  (calendarMonth === 10 && (day.dayOfMonth === 13 || day.dayOfMonth === 23));

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleSelectCalendarDate(day.date)}
                    title={
                      isHoliday
                        ? `วันหยุด: ${day.holidayName || (day.dayOfMonth === 13 ? 'วันนวมินทรมหาราช' : 'วันปิยมหาราช')}`
                        : isWeekend
                        ? 'วันหยุดสุดสัปดาห์ (เสาร์-อาทิตย์)'
                        : day.isTermBreak
                        ? 'ช่วงปิดเทอม (นอกภาคเรียน)'
                        : isChecked
                        ? 'สอนแล้ว (บันทึกเวลาเรียนแล้ว)'
                        : 'ยังไม่ได้เช็คชื่อ'
                    }
                    className={`h-8 w-8 mx-auto rounded-full text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                        : isChecked
                        ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 font-bold'
                        : day.isTermBreak
                        ? 'text-slate-400 bg-slate-100/70 border border-slate-200/60 hover:bg-slate-200/60 font-semibold'
                        : isHoliday
                        ? 'bg-purple-100 text-purple-800 font-black border border-purple-200 hover:bg-purple-200'
                        : isWeekend
                        ? 'bg-purple-50/80 text-purple-600 border border-purple-100 hover:bg-purple-100 font-semibold'
                        : day.isPastOrToday && day.isWeekday
                        ? 'bg-rose-100/90 text-rose-700 border border-rose-300 hover:bg-rose-200 font-black'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {day.dayOfMonth}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>สอนแล้ว</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>วันที่เลือก</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>ยังไม่เช็ค</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400 shrink-0" />
                <span>ช่วงปิดเทอม</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-300 border border-purple-400 shrink-0" />
                <span>วันหยุด / เสาร์-อาทิตย์</span>
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
                <span>มีการแก้ไขที่ยังไม่ได้บันทึก (กดปุ่มบันทึกด้านขวา)</span>
              </span>
            ) : isPeriodSavedInStorage ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกผลการเช็คชื่อเรียบร้อยแล้ว</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>ยังไม่ได้เช็คชื่อในคาบนี้ (กดบันทึกเพื่อยืนยัน)</span>
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
                hasUnsavedChanges || !isPeriodSavedInStorage
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ring-2 ring-blue-300 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isPeriodSavedInStorage && !hasUnsavedChanges
                  ? '✓ บันทึกผลแล้ว (กดเพื่อบันทึกซ้ำ)'
                  : '💾 บันทึกผลการเช็คชื่อเข้าเรียน'}
              </span>
            </button>
          </div>
        </div>
      </div>
        </>
      )}

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
                    {classroomStats.totalAssemblyDays === 0 ? '-' : `${classroomStats.averageRate}%`}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-semibold">เกณฑ์มีสิทธิ์สอบ (80%)</div>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">
                    {classroomStats.totalAssemblyDays === 0
                      ? 'รอเช็คชื่อ'
                      : classroomStats.averageRate >= 80
                      ? 'ผ่านเกณฑ์'
                      : 'เฝ้าระวัง'}
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
                          {stu.totalDays === 0 ? '-' : `${stu.attendanceRate}%`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {stu.totalDays === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              ยังไม่ได้เช็คชื่อ
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                stu.attendanceRate >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {stu.attendanceRate >= 80 ? 'มีสิทธิ์สอบ' : 'เสี่ยง มส.'}
                            </span>
                          )}
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

            {/* กล่องแสดงสถานะประจำคาบนี้ */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                !isPeriodSavedInStorage && !hasUnsavedChanges
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-blue-50/60 border-blue-100 text-blue-900'
              }`}
            >
              <div>
                <div className="text-[11px] text-slate-500 font-bold">
                  สถานะคาบนี้ (วันที่ {formatDateThai(selectedDate)} คาบที่ {selectedPeriod})
                </div>
                <div className="text-sm font-extrabold mt-0.5 flex items-center gap-1.5">
                  {!isPeriodSavedInStorage && !hasUnsavedChanges ? (
                    <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg text-xs font-bold">
                      รอเช็คชื่อ (ยังไม่ได้บันทึกผล)
                    </span>
                  ) : (
                    <>
                      <span
                        className={
                          personalStatsStudent.status === 'PRESENT'
                            ? 'text-emerald-700'
                            : personalStatsStudent.status === 'LATE'
                            ? 'text-amber-700'
                            : personalStatsStudent.status === 'ABSENT'
                            ? 'text-rose-700'
                            : personalStatsStudent.status === 'LEAVE'
                            ? 'text-purple-700'
                            : personalStatsStudent.status === 'ACTIVITY'
                            ? 'text-sky-700'
                            : 'text-red-800'
                        }
                      >
                        {personalStatsStudent.status === 'PRESENT' && 'มาเรียน'}
                        {personalStatsStudent.status === 'LATE' && 'มาสาย'}
                        {personalStatsStudent.status === 'ABSENT' && 'ขาดเรียน'}
                        {personalStatsStudent.status === 'LEAVE' && 'ลา'}
                        {personalStatsStudent.status === 'ACTIVITY' && 'กิจกรรม'}
                        {personalStatsStudent.status === 'TRUANCY' && 'โดดเรียน'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {isPeriodSavedInStorage && !hasUnsavedChanges
                          ? '(บันทึกแล้ว)'
                          : '(ยังไม่ได้กดบันทึก)'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-800 font-bold shrink-0">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>วิชา {selectedCourse}</span>
              </div>
            </div>

            {/* สถิติเวลาเรียนจริงตามเกณฑ์ 80% (Zero Mock) */}
            {(() => {
              const summary = attendanceCorrelationService.calculateAttendance80Rule(
                personalStatsStudent.studentCode,
                selectedCourse
              );
              const hasRecords = summary.totalScheduledPeriods > 0;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {/* การ์ด 1: ร้อยละเวลาเรียน & สิทธิ์สอบ */}
                    <div
                      className={`p-2.5 rounded-xl border ${
                        !hasRecords
                          ? 'bg-slate-50 text-slate-700 border-slate-200'
                          : summary.isEligibleForExam
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-100'
                      }`}
                    >
                      <div className="font-bold text-sm">
                        {hasRecords ? `${summary.attendanceRate}%` : '-'}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          !hasRecords
                            ? 'text-slate-500'
                            : summary.isEligibleForExam
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {!hasRecords
                          ? 'ยังไม่มีการเช็คชื่อ'
                          : summary.isEligibleForExam
                          ? 'สิทธิ์สอบ (ผ่านเกณฑ์ 80%)'
                          : 'เสี่ยง มส. (ต่ำกว่า 80%)'}
                      </div>
                    </div>

                    {/* การ์ด 2: คาบเรียนที่บันทึกแล้วทั้งหมด */}
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200">
                      <div className="font-bold text-sm">
                        {summary.totalScheduledPeriods} คาบ
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        เวลาเรียนที่บันทึก
                      </div>
                    </div>

                    {/* การ์ด 3: มาเรียนจริง */}
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
                      <div className="font-bold text-sm">
                        {summary.earnedPeriods} คาบ
                      </div>
                      <div className="text-[10px] text-purple-600 font-medium">
                        มาเรียนจริง (สะสม)
                      </div>
                    </div>
                  </div>

                  {/* สรุปแจกแจงสถานะสะสมรายบุคคล */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-700">สถิติสะสมวิชานี้:</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-emerald-700 font-bold">มา {summary.presentCount}</span>
                      <span>•</span>
                      <span className="text-amber-700 font-bold">สาย {summary.lateCount}</span>
                      <span>•</span>
                      <span className="text-purple-700 font-bold">ลา {summary.leaveCount}</span>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">ขาด {summary.absentCount}</span>
                      <span>•</span>
                      <span className="text-sky-700 font-bold">กิจกรรม {summary.activityCount}</span>
                      {summary.truancyCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-700 font-extrabold">
                            โดด {summary.truancyCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
