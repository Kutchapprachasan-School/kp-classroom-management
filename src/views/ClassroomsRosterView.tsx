import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Plus,
  Search,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  X,
  Users,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Filter,
  Check,
  CheckCircle2,
  Lightbulb,
  BarChart2,
  Layers,
  UserPlus,
  Bell,
  User,
  ArrowRightLeft,
  KeyRound,
} from 'lucide-react';
import { classroomService } from '../services/classroomService';
import { classroomsListData } from '../data/mockData';
import { studentService, defaultStudents, type StudentRecord } from '../services/studentService';
import { authService } from '../services/authService';
import { trashService } from '../services/trashService';
import { messagingService, STUDENT_TRANSFERRED_EVENT } from '../services/messagingService';
import type { ClassroomRosterItem, AtRiskStudent } from '../types/viewModels';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

interface ClassroomsRosterViewProps {
  onSelectStudent: (student: AtRiskStudent) => void;
  onSelectClassroom: (classroomId: string) => void;
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
}

type SortOption =
  | 'gender-male-first'
  | 'gender-female-first'
  | 'no-asc'
  | 'score-desc'
  | 'name-asc';

export const ClassroomsRosterView: React.FC<ClassroomsRosterViewProps> = ({
  onSelectStudent,
  onSelectClassroom,
  activeRole = 'TEACHER_GENERAL',
  onChangeRole: _onChangeRole,
}) => {
  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>(classroomsListData);
  const [selectedClass, setSelectedClass] = useState<ClassroomRosterItem | null>(
    () => classroomsListData.find((c) => c.roomNumber === 'ม.3/1') || classroomsListData[0] || null
  );
  const [students, setStudents] = useState<StudentRecord[]>(defaultStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('gender-male-first');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NORMAL' | 'AT_RISK'>('ALL');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Dropdown menus
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassroomOpen, setIsAddClassroomOpen] = useState(false);

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState<StudentRecord | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('room-1-2');
  const [transferReasonText, setTransferReasonText] = useState<string>('');
  const [transferSuccessNotice, setTransferSuccessNotice] = useState<string | null>(null);

  // Add student form state
  const [newStudentNo, setNewStudentNo] = useState<number>(27);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Add classroom form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('ม.3');
  const [newSubjectCode, setNewSubjectCode] = useState('ศ23101');
  const [newSubjectName, setNewSubjectName] = useState('ศิลปะ');
  const [newAdviser, setNewAdviser] = useState(
    () => authService.getCurrentUser()?.name || 'ครูที่ปรึกษา'
  );

  const classDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // สิทธิ์การเข้าถึงข้อมูลตามบทบาท:
  // - ครูทั่วไป (TEACHER_GENERAL): แสดงเฉพาะห้องที่ปรึกษา และห้องที่สอนเท่านั้น
  // - ครูกิจการ (STUDENT_AFFAIRS / STUDENT_COUNCIL), ผอ. (ACADEMIC_ADMIN / DIRECTOR), แอดมิน (ADMIN): ดูได้ทุกคน ทุกห้อง
  const isFullAccess =
    activeRole === 'ACADEMIC_ADMIN' ||
    activeRole === 'STUDENT_AFFAIRS' ||
    activeRole === 'STUDENT_COUNCIL' ||
    (activeRole as string) === 'ADMIN' ||
    (activeRole as string) === 'DIRECTOR';

  // โหลดรายการห้องเรียนทั้งหมด
  const loadClassrooms = async () => {
    setIsLoading(true);
    try {
      const cls = await classroomService.getAll();
      setAllClassrooms(cls);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // กรองห้องเรียนตามสิทธิ์ผู้ใช้งาน
  const allowedClassrooms = useMemo(() => {
    if (isFullAccess) {
      return allClassrooms;
    }
    // ครูทั่วไป (ครูภาสภูมิ): ห้องที่ปรึกษา ม.3/1 และห้องที่สอน (ม.1/8, ม.2/8, ม.3/1, ม.3/2, ม.3/8)
    const advisoryRooms = ['room-3-1', 'ม.3/1'];
    const teachingRooms = [
      'room-1-8',
      'room-2-8',
      'room-3-2',
      'room-3-5',
      'room-3-6',
      'room-3-7',
      'room-3-8',
      'ม.1/8',
      'ม.2/8',
      'ม.3/2',
      'ม.3/5',
      'ม.3/6',
      'ม.3/7',
      'ม.3/8',
    ];

    return allClassrooms.filter(
      (c) =>
        advisoryRooms.includes(c.id) ||
        advisoryRooms.includes(c.roomNumber) ||
        teachingRooms.includes(c.id) ||
        teachingRooms.includes(c.roomNumber) ||
        c.adviser.includes('ครูภาสภูมิ')
    );
  }, [allClassrooms, isFullAccess]);

  // ตั้งค่าห้องเรียนเริ่มต้นเมื่อสิทธิ์หรือข้อมูลเปลี่ยน
  useEffect(() => {
    if (allowedClassrooms.length > 0) {
      if (!selectedClass || !allowedClassrooms.some((c) => c.id === selectedClass.id)) {
        // ให้ความสำคัญกับห้อง ม.3/1 (ห้องที่ปรึกษา) เป็นค่าเริ่มต้น
        const defaultClass =
          allowedClassrooms.find((c) => c.roomNumber === 'ม.3/1' || c.name.includes('3/1')) ||
          allowedClassrooms[0];
        setSelectedClass(defaultClass);
      }
    }
  }, [allowedClassrooms, selectedClass]);

  // โหลดรายชื่อนักเรียนเมื่อเปลี่ยนห้องเรียน
  useEffect(() => {
    if (selectedClass) {
      setIsLoading(true);
      studentService
        .getByClassroom(selectedClass.id)
        .then((stuList) => {
          setStudents(stuList);
          setNewStudentNo(stuList.length + 1);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedClass]);

  // ซิงค์รายชื่อนักเรียนและจำนวนนักเรียนในห้องเมื่อมีการย้ายห้องเรียน (STUDENT_TRANSFERRED_EVENT)
  useEffect(() => {
    const handleTransferred = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        const { fromClassroomId, toClassroomId, fromClassroomName, toClassroomName } =
          customEvent.detail;
        setAllClassrooms((prev) =>
          prev.map((c) => {
            if (
              c.id === fromClassroomId ||
              c.roomNumber === fromClassroomName ||
              c.name === fromClassroomName
            ) {
              return { ...c, studentCount: Math.max(0, c.studentCount - 1) };
            }
            if (
              c.id === toClassroomId ||
              c.roomNumber === toClassroomName ||
              c.name === toClassroomName
            ) {
              return { ...c, studentCount: c.studentCount + 1 };
            }
            return c;
          })
        );
      }
      if (selectedClass) {
        studentService.getByClassroom(selectedClass.id).then((stuList) => {
          setStudents(stuList);
          setNewStudentNo(stuList.length + 1);
        });
      }
    };
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
    return () => {
      window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
    };
  }, [selectedClass]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClassDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
      if (openActionMenuId && !(event.target as HTMLElement).closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenuId]);

  // ตัวช่วยระบุเพศจากคำนำหน้าชื่อ
  const isMaleStudent = (stu: StudentRecord) => {
    if (stu.gender) return stu.gender === 'MALE';
    return stu.name.startsWith('ด.ช.') || stu.name.startsWith('นาย');
  };

  // จัดเรียงและกรองนักเรียน
  const filteredAndSortedStudents = useMemo(() => {
    let result = students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.includes(searchTerm) ||
        s.no.toString() === searchTerm;

      const matchFilter =
        filterStatus === 'ALL' ? true : s.status === filterStatus;

      return matchSearch && matchFilter;
    });

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'gender-male-first': {
          const aMale = isMaleStudent(a);
          const bMale = isMaleStudent(b);
          if (aMale && !bMale) return -1;
          if (!aMale && bMale) return 1;
          return a.no - b.no;
        }
        case 'gender-female-first': {
          const aMale = isMaleStudent(a);
          const bMale = isMaleStudent(b);
          if (!aMale && bMale) return -1;
          if (aMale && !bMale) return 1;
          return a.no - b.no;
        }
        case 'no-asc':
          return a.no - b.no;
        case 'score-desc':
          return b.score - a.score;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'th');
        default:
          return a.no - b.no;
      }
    });

    return result;
  }, [students, searchTerm, filterStatus, sortOption]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!newStudentName || !newStudentCode) {
      alert('กรุณากรอกรหัสนักเรียนและชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    try {
      await studentService.create(selectedClass.id, {
        studentNo: Number(newStudentNo),
        studentCode: newStudentCode,
        name: newStudentName,
        status: 'NORMAL',
      });
      const updated = await studentService.getByClassroom(selectedClass.id);
      setStudents(updated);
      setIsAddStudentOpen(false);
      setNewStudentCode('');
      setNewStudentName('');
      alert(`เพิ่มนักเรียน "${newStudentName}" ในห้อง ${selectedClass.name} เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน';
      alert(errorMsg);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) {
      alert('กรุณาระบุชื่อชั้นเรียน เช่น ม.3/5');
      return;
    }

    try {
      const created = await classroomService.create({
        name: newClassName,
        level: newClassLevel,
        subjectCode: newSubjectCode,
        subjectName: newSubjectName,
        adviser: newAdviser,
        termId: 'term-1-2569',
      });
      await loadClassrooms();
      setSelectedClass(created);
      setIsAddClassroomOpen(false);
      setNewClassName('');
      alert(`เพิ่มห้องเรียน "${created.name}" เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างห้องเรียน';
      alert(errorMsg);
    }
  };

  const handleDeleteStudent = async (stu: StudentRecord) => {
    if (!selectedClass) return;
    if (
      confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบ "${stu.name}" ออกจากห้องเรียน? รายการจะถูกย้ายไปที่ถังขยะและกู้คืนได้ภายใน 30 วัน`
      )
    ) {
      await studentService.delete(selectedClass.id, stu.id);
      await trashService.moveToTrash(stu.id, 'นักเรียน', stu.name);
      const updated = await studentService.getByClassroom(selectedClass.id);
      setStudents(updated);
      setOpenActionMenuId(null);
      alert(`ย้าย "${stu.name}" ไปยังถังขยะเรียบร้อยแล้ว`);
    }
  };

  const handleBatchImport = async () => {
    if (!selectedClass) return;
    const batch = [
      {
        no: 27,
        code: '45127',
        name: 'ด.ช. พัทธดนย์ ศรีวิชัย',
        attendance: '8/8',
        score: 80,
        status: 'NORMAL' as const,
      },
      {
        no: 28,
        code: '45128',
        name: 'ด.ญ. กานต์พิชชา ใจมั่น',
        attendance: '8/8',
        score: 85,
        status: 'NORMAL' as const,
      },
      {
        no: 29,
        code: '45129',
        name: 'ด.ญ. ธัญญาภรณ์ แก้วอินทร์',
        attendance: '8/8',
        score: 90,
        status: 'NORMAL' as const,
      },
    ];
    await studentService.batchImport(selectedClass.id, batch);
    const updated = await studentService.getByClassroom(selectedClass.id);
    setStudents(updated);
    setIsImportModalOpen(false);
    alert(`นำเข้าบัญชีรายชื่อนักเรียนจาก SGS Excel สำเร็จ จำนวน ${batch.length} คน!`);
  };

  const handleOpenRadar = (stu: StudentRecord) => {
    onSelectStudent({
      enrollmentId: stu.id,
      studentNo: stu.no,
      name: stu.name,
      tags:
        stu.status === 'AT_RISK'
          ? [{ text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' }]
          : [],
      attendanceRatio: stu.attendance,
      totalScore: stu.score,
    });
  };

  const handleResetPassword = async (stu: StudentRecord) => {
    if (
      window.confirm(
        `ต้องการรีเซ็ตรหัสผ่านของ ${stu.name} (รหัส ${stu.code}) ใช่หรือไม่?\nรหัสผ่านจะถูกคืนค่ากลับเป็นรหัสนักเรียน 5 หลัก (${stu.code}) เพื่อให้นักเรียนเข้าสู่ระบบใหม่ได้ทันที`
      )
    ) {
      try {
        await authService.resetStudentPasswordByAdvisor(stu.code, 'ครูที่ปรึกษา');
        alert(`✓ รีเซ็ตรหัสผ่านของ ${stu.name} เป็นรหัส 5 หลัก (${stu.code}) เรียบร้อยแล้ว`);
      } catch (err: any) {
        alert(err.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
      }
    }
  };

  const handleOpenTransferModal = (stu: StudentRecord) => {
    setTransferringStudent(stu);
    const currentId = selectedClass?.id || stu.classroomId || 'room-3-1';
    if (currentId === 'room-1-1' || currentId === 'ม.1/1') {
      setTargetRoomId('room-1-2');
    } else if (currentId === 'room-1-2' || currentId === 'ม.1/2') {
      setTargetRoomId('room-1-1');
    } else if (currentId === 'room-3-1' || currentId === 'ม.3/1') {
      setTargetRoomId('room-3-2');
    } else {
      const other = allClassrooms.find((c) => c.id !== currentId);
      setTargetRoomId(other ? other.id : 'room-1-2');
    }
    setTransferReasonText('');
    setIsTransferModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleExecuteTransferInRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !targetRoomId) return;

    try {
      const fromId = selectedClass?.id || transferringStudent.classroomId || 'room-3-1';
      const studentCode = transferringStudent.code || transferringStudent.studentCode || '';
      const res = messagingService.executeStudentTransfer({
        studentCode,
        fromClassroomId: fromId,
        toClassroomId: targetRoomId,
        transferReason: transferReasonText.trim() || undefined,
        actorLabel: 'ครูผู้สอน / แอดมินวิชาการ',
      });

      setAllClassrooms((prev) =>
        prev.map((c) => {
          if (c.id === res.fromClassroomId) {
            return { ...c, studentCount: Math.max(0, c.studentCount - 1) };
          }
          if (c.id === res.toClassroomId) {
            return { ...c, studentCount: c.studentCount + 1 };
          }
          return c;
        })
      );

      if (selectedClass) {
        studentService.getByClassroom(selectedClass.id).then((stuList) => {
          setStudents(stuList);
          setNewStudentNo(stuList.length + 1);
        });
      }

      setTransferSuccessNotice(res.message);
      setIsTransferModalOpen(false);
      setTransferringStudent(null);

      setTimeout(() => {
        setTransferSuccessNotice(null);
      }, 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการย้ายห้องเรียน';
      alert(msg);
    }
  };

  // หมวดหมู่ห้องเรียนสำหรับ Dropdown
  const advisoryClass = allowedClassrooms.find(
    (c) => c.roomNumber === 'ม.3/1' || c.adviser.includes('ครูภาสภูมิ')
  );
  const teachingClasses = allowedClassrooms.filter(
    (c) => c.id !== advisoryClass?.id
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Master PageHeroBanner (2-Line Strictly) */}
      <PageHeroBanner
        title="ห้องเรียน / บัญชีรายชื่อนักเรียน"
        subtitle="จัดการข้อมูลนักเรียนในรายวิชาของคุณได้อย่างง่ายดาย"
        icon={<Users className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText={selectedClass?.roomNumber || 'ม.3/1'}
        actions={
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มนักเรียน</span>
          </button>
        }
      />

      {/* Transfer Success Notice Banner */}
      {transferSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{transferSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setTransferSuccessNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Roster Card ตรงตามภาพ Reference Image 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header & Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Left: Icon + Title + Room Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  บัญชีรายชื่อนักเรียน
                </h2>
                {(selectedClass?.roomNumber || 'ม.3/1') === 'ม.3/1' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ห้องที่ปรึกษา
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ห้อง {selectedClass?.roomNumber || 'ม.3/1'} • รวม {students.length} คน • คลิกที่ชื่อนักเรียนเพื่อดู Radar Chart 5 มิติ
              </p>
            </div>
          </div>

          {/* Header Right: Controls (Dropdown เลือกห้อง, ค้นหา, เรียง, แสดงตัวกรอง) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Single Consolidated Classroom Dropdown */}
            <div className="flex items-center gap-1.5">
              <div className="relative" ref={classDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="เลือกชั้น/ห้องเรียน"
                >
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="max-w-[140px] truncate">
                    ห้อง {selectedClass?.roomNumber || 'ม.3/1'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                </button>

                {isClassDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        เลือกชั้น / ห้องเรียน
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isFullAccess
                          ? '👑 สิทธิ์ ผอ./Admin/กิจการ: ดูได้ทุกห้อง'
                          : '🔒 ครูทั่วไป: แสดงเฉพาะห้องที่ปรึกษาและที่สอน'}
                      </span>
                    </div>
                    {isFullAccess && (
                      <button
                        onClick={() => {
                          setIsClassDropdownOpen(false);
                          setIsAddClassroomOpen(true);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มห้อง</span>
                      </button>
                    )}
                  </div>

                  {/* Group 1: ห้องที่ปรึกษา */}
                  {advisoryClass && (
                    <div className="px-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        ⭐ ห้องครูที่ปรึกษา (Homeroom)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClass(advisoryClass);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          selectedClass?.id === advisoryClass.id
                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>{advisoryClass.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {advisoryClass.studentCount || students.length} คน
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Group 2: ห้องที่สอน หรือ ห้องทั้งหมดในโรงเรียน */}
                  <div className="px-2 pt-1 max-h-56 overflow-y-auto space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {isFullAccess ? '🏫 ห้องเรียนทั้งหมดในโรงเรียน' : '📚 ห้องที่สอน (Teaching Classes)'}
                    </span>
                    {teachingClasses.map((cls) => {
                      const isSelected = selectedClass?.id === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClass(cls);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <div>
                              <span className="block">{cls.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                ครูประจำชั้น: {cls.adviser}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {cls.studentCount || 30} คน
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {selectedClass && (
              <button
                type="button"
                onClick={() => onSelectClassroom(selectedClass.id)}
                className="px-2 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="เปิดแดชบอร์ดห้องเรียนนี้"
              >
                <span className="hidden sm:inline">เปิดห้องนี้</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

            {/* ช่องค้นหา "ค้นหาชื่อ เลขที่ หรือรหัส..." ตรงตามภาพ Reference Image 1 */}
            <div className="relative w-44 sm:w-56 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ เลขที่ หรือรหัส..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown เรียง ชาย ➔ หญิง ˇ ตรงตามภาพ Reference Image 1 */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>
                  {sortOption === 'gender-male-first' && 'เรียง ชาย ➔ หญิง'}
                  {sortOption === 'gender-female-first' && 'เรียง หญิง ➔ ชาย'}
                  {sortOption === 'no-asc' && 'เรียงตามเลขที่'}
                  {sortOption === 'score-desc' && 'เรียงตามคะแนนรวม'}
                  {sortOption === 'name-asc' && 'เรียงตามชื่อ (ก-ฮ)'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('gender-male-first');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      sortOption === 'gender-male-first'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เรียง ชาย ➔ หญิง</span>
                    {sortOption === 'gender-male-first' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('gender-female-first');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      sortOption === 'gender-female-first'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เรียง หญิง ➔ ชาย</span>
                    {sortOption === 'gender-female-first' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('no-asc');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      sortOption === 'no-asc'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เรียงตามเลขที่</span>
                    {sortOption === 'no-asc' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('score-desc');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      sortOption === 'score-desc'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>คะแนนรวม (มาก ➔ น้อย)</span>
                    {sortOption === 'score-desc' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('name-asc');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      sortOption === 'name-asc'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เรียงตามชื่อ (ก ➔ ฮ)</span>
                    {sortOption === 'name-asc' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* ปุ่ม "แสดงตัวกรอง" ตรงตามภาพ Reference Image 1 */}
            <button
              type="button"
              onClick={() => setShowFilterBar((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                showFilterBar || filterStatus !== 'ALL'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>แสดงตัวกรอง</span>
              {filterStatus !== 'ALL' && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Bar (เมื่อกดแสดงตัวกรอง) */}
        {showFilterBar && (
          <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2 animate-fade-in text-xs">
            <span className="text-slate-500 font-semibold text-[11px] mr-1">สถานะนักเรียน:</span>
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('NORMAL')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                filterStatus === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ปกติ ({students.filter((s) => s.status === 'NORMAL').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('AT_RISK')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                filterStatus === 'AT_RISK'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              กลุ่มเสี่ยง ({students.filter((s) => s.status === 'AT_RISK').length})
            </button>
          </div>
        )}

        {/* Student Table ตรงตามภาพ Reference Image 1 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/40">
                <th className="py-3 px-4 w-14 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-3 px-4 min-w-[220px]">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4 w-32">การเข้าเรียน</th>
                <th className="py-3 px-4 w-28 text-center">คะแนนรวม</th>
                <th className="py-3 px-4 w-28 text-center">สถานะ</th>
                <th className="py-3 px-4 w-32 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดรายชื่อนักเรียน...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3 px-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-2xs border border-blue-100">
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-800">
                          ยังไม่มีรายชื่อนักเรียนในห้อง {selectedClass?.name || 'ม.3/1'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          เริ่มต้นปีการศึกษาด้วยการเพิ่มนักเรียนรายบุคคล หรือนำเข้าไฟล์ Excel / SGS ของ สพฐ. เพื่อเริ่มต้นการจัดการชั้นเรียนและบันทึกข้อมูล
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddStudentOpen(true)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ เพิ่มนักเรียน</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>📥 นำเข้ารายชื่อ Excel/SGS</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((stu) => {
                  const isMale = isMaleStudent(stu);
                  const avatar =
                    stu.avatarUrl ||
                    (isMale
                      ? '/images/banners/student-avatar.png'
                      : '/images/banners/student-avatar-girl.png');

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ลำดับ (เลขที่) */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                        {stu.no}
                      </td>

                      {/* รหัสนักเรียน */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-400">
                        {stu.code}
                      </td>

                      {/* ชื่อ-นามสกุล พร้อมรูป avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={avatar}
                            alt={stu.name}
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenRadar(stu)}
                            className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-left cursor-pointer"
                            title="คลิกเพื่อดู Radar Chart 5 มิติ"
                          >
                            {stu.name}
                          </button>
                        </div>
                      </td>

                      {/* การเข้าเรียน (👤 8/8) ตรงตามภาพ Reference Image 1 */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{stu.attendance}</span>
                        </span>
                      </td>

                      {/* คะแนนรวม (ตัวเลขสีน้ำเงินเข้ม) */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-blue-600 text-sm">
                        {stu.score % 1 === 0 ? stu.score : stu.score.toFixed(1)}
                      </td>

                      {/* สถานะ (🔔 ปกติ / ⚠️ กลุ่มเสี่ยง) ตรงตามภาพ Reference Image 1 */}
                      <td className="py-3.5 px-4 text-center">
                        {stu.status === 'AT_RISK' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/90 rounded-full font-bold text-[11px]">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>กลุ่มเสี่ยง</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/90 rounded-full font-bold text-[11px]">
                            <Bell className="w-3 h-3 text-emerald-600" />
                            <span>ปกติ</span>
                          </span>
                        )}
                      </td>

                      {/* การจัดการ (ดูรายละเอียด > และ ⋮) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRadar(stu)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            <span>ดูรายละเอียด</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {/* ⋮ Action Menu Dropdown */}
                          <div className="relative action-menu-container">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(
                                  openActionMenuId === stu.id ? null : stu.id
                                )
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="ตัวเลือกเพิ่มเติม"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === stu.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenRadar(stu);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer"
                                >
                                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Radar Chart 5 มิติ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenTransferModal(stu);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 text-left cursor-pointer"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>ย้ายห้องเรียน (ซิงค์กลุ่มแชท)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleResetPassword(stu);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 text-left cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                  <span>รีเซ็ตรหัสผ่าน (5 หลัก)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteStudent(stu);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>ย้ายไปถังขยะ</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Bottom Callout Card พร้อมภาพภูเขาไฟฟูจิและดอกซากุระ ตรงตามภาพ Reference Image 1 */}
      <div className="relative rounded-2xl overflow-hidden border border-sky-100 shadow-sm bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-pink-50/40 p-4 sm:p-5 flex items-center justify-between gap-4">
        {/* Background Mount Fuji Sakura Art */}
        <div className="absolute right-0 top-0 bottom-0 h-full w-1/3 sm:w-1/2 pointer-events-none opacity-40 md:opacity-60 overflow-hidden flex justify-end">
          <img
            src="/images/teacher/bottom_banner.png"
            alt="Fuji Sakura Banner"
            className="h-full object-cover object-right"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            คลิกที่ชื่อนักเรียนเพื่อดูข้อมูลผลการเรียน และ Radar Chart 5 มิติ ได้ทันที
          </p>
        </div>
      </div>

      {/* Modal: เพิ่มนักเรียนใหม่ */}
      {isAddStudentOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateStudent}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                เพิ่มนักเรียนในห้อง {selectedClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขที่</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newStudentNo}
                  onChange={(e) => setNewStudentNo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสประจำตัวนักเรียน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 45127"
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  required
                  placeholder="ด.ช. / ด.ญ. ชื่อ สกุล"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                บันทึกนักเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: สร้างห้องเรียนใหม่ */}
      {isAddClassroomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateClassroom}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">สร้างห้องเรียนใหม่</h3>
              <button
                type="button"
                onClick={() => setIsAddClassroomOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มัธยมศึกษาปีที่ 3/5 หรือ ม.3/5"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระดับชั้น</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none bg-white"
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    required
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชา</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ครูประจำชั้น / ที่ปรึกษา
                </label>
                <input
                  type="text"
                  value={newAdviser}
                  onChange={(e) => setNewAdviser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddClassroomOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                บันทึกห้องเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: นำเข้า Excel / SGS */}
      {isImportModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>นำเข้ารายชื่อนักเรียนจาก Excel / SGS ({selectedClass.name})</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              onClick={handleBatchImport}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                ลากไฟล์ Excel (.xlsx, .csv) มาวางที่นี่ (คลิกเพื่อทดสอบ)
              </p>
              <p className="text-[11px] text-slate-400">
                รองรับโครงสร้างคอลัมน์ระบบ SGS สพฐ. (เลขที่, รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล)
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              💡 ระบบจะทำการตรวจสอบรหัสนักเรียนซ้ำในโรงเรียน และป้องกันการบันทึกข้ามห้องด้วย Composite Key อัตโนมัติ
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBatchImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เริ่มการนำเข้า (3 รายการทดสอบ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ย้ายห้องเรียน & ซิงค์กลุ่มแชทอัตโนมัติ */}
      {isTransferModalOpen && transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <span>ย้ายห้องเรียน & ซิงค์กลุ่มแชทอัตโนมัติ</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferringStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ข้อมูลนักเรียน */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                #{transferringStudent.no}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">
                  {transferringStudent.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  รหัส {transferringStudent.code || transferringStudent.studentCode || ''} • ห้องเดิม: {selectedClass?.roomNumber || transferringStudent.classroomId || 'ม.3/1'}
                </div>
              </div>
            </div>

            <form onSubmit={handleExecuteTransferInRoster} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกห้องเรียนปลายทาง (ใหม่) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                >
                  {allClassrooms
                    .filter((c) => c.id !== (selectedClass?.id || transferringStudent.classroomId || ''))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.roomNumber}) - {c.adviser}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผลการย้ายห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ปรับแผนการเรียน หรือคำร้องขอย้ายห้องจากผู้ปกครอง"
                  value={transferReasonText}
                  onChange={(e) => setTransferReasonText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* ข้อมูลความคงอยู่ของคะแนนและประวัติ (Data Preservation) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>รับประกันความคงอยู่ของข้อมูล (Data Preservation):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1">
                  <li>
                    <strong>ซิงค์กลุ่มแชทอัตโนมัติ:</strong> ย้ายออกจากกลุ่มแชทครูที่ปรึกษา/ประจำวิชาเดิม และเข้ากลุ่มห้องใหม่ทันที
                  </li>
                  <li>
                    <strong>คะแนนและงานที่ส่งคงอยู่ 100%:</strong> คะแนนเก็บ, ไฟล์งาน, ประวัติเวลาเรียน และแต้ม XP จะไม่สูญหาย
                  </li>
                  <li>
                    <strong>Audit Log ในกลุ่มแชท:</strong> มีการแจ้งเตือนบันทึกการย้ายในกลุ่มแชทอย่างโปร่งใส
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferringStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>ยืนยันการย้ายห้องเรียน & ซิงค์กลุ่มแชท</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
