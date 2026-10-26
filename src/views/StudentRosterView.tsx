// src/views/StudentRosterView.tsx
// หน้ารายชื่อนักเรียน (Student Roster View)
// ปรับแต่งให้ตรงตามภาพต้นแบบ Mockup media_1791487080981_2916112d.jpg 100%
// ทั้ง Header แบนเนอร์, 4 Stat KPI cards, ชุดฟิลเตอร์, ตารางนักเรียน, ป้ายสถานะ และปุ่ม [👤 โปรไฟล์], [📊 ผลการเรียน], [⋯]
// พร้อมโหมดมือถือแปลงเป็น Stacked Cards และปุ่ม Sticky CTA ด้านล่าง

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  UserPlus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  X,
  CheckCircle2,
  BarChart2,
  User,
  MoreHorizontal,
  ArrowLeft,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Upload,
  Sparkles,
  KeyRound,
  Printer,
  Copy,
  Hash,
} from 'lucide-react';
import { classroomService } from '../services/classroomService';
import { studentService, getAlternateRoomKey, type StudentRecord } from '../services/studentService';
import { messagingService, STUDENT_TRANSFERRED_EVENT } from '../services/messagingService';
import { attendanceCorrelationService, type MorningAssemblyRecord } from '../services/attendanceCorrelationService';
import type { ClassroomRosterItem, AtRiskStudent } from '../types/viewModels';
import type { SchoolUserRole } from '../config/schoolRoles';
import { getGradeLevelTheme } from '../utils/gradeLevelTheme';
import { SgsRosterImportModal } from '../components/sgs/SgsRosterImportModal';
import { SgsScoreExportModal } from '../components/sgs/SgsScoreExportModal';
import { activityAuditLogService } from '../services/activityAuditLogService';
import type { SgsParsedRow } from '../services/sgsImportExportService';
import { authService } from '../services/authService';
import { getM1SgsStudentInfo, isGrade1SgsStudentCode } from '../config/m1SgsLookup';
import { Pagination, type PageSizeOption } from '../components/common/Pagination';

interface StudentRosterViewProps {
  initialClassroomId?: string;
  onSelectStudent?: (student: AtRiskStudent) => void;
  onBackToClassrooms?: () => void;
  activeRole?: SchoolUserRole;
}

type SortOption = 'name-asc' | 'no-asc' | 'gender-male-first' | 'gender-female-first' | 'score-desc';
type StatusFilter = 'ALL' | 'NORMAL' | 'ABSENT' | 'LEAVE';
type GenderFilter = 'ALL' | 'MALE' | 'FEMALE';
type StudyGroupFilter = 'ALL' | 'GROUP_A' | 'GROUP_B';

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  initialClassroomId,
  onSelectStudent,
  onBackToClassrooms,
  activeRole = 'TEACHER_GENERAL',
}) => {
  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomRosterItem | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [originalStudentsOrder, setOriginalStudentsOrder] = useState<StudentRecord[]>([]);
  const [hasUnsavedReorder, setHasUnsavedReorder] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('no-asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [studyGroupFilter, setStudyGroupFilter] = useState<StudyGroupFilter>('ALL');

  // Dropdown open states
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Checkbox selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Pagination state (รองรับ 10, 20, 30, 50, ทั้งหมด) - ตั้งค่าเริ่มต้นเป็น 'ALL' เพื่อแสดงนักเรียนทั้งห้องครบถ้วน 1..N ทันที
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>('ALL');

  // Modals state
  const [gradeModalStudent, setGradeModalStudent] = useState<StudentRecord | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    title: 'ด.ช.',
    firstName: '',
    lastName: '',
    code: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
  });

  const [isDeleteStudentOpen, setIsDeleteStudentOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState<StudentRecord | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [transferReasonText, setTransferReasonText] = useState<string>('');

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScoreExportModalOpen, setIsScoreExportModalOpen] = useState(false);
  const [newStudentNo, setNewStudentNo] = useState<number>(1);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'MALE' | 'FEMALE'>('MALE');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    activeRole === 'ACADEMIC_ADMIN' ||
    activeRole === 'STUDENT_AFFAIRS' ||
    (activeRole as string) === 'ADMIN' ||
    (activeRole as string) === 'DIRECTOR';

  const isFullAccess = isAdmin;

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นครูที่ปรึกษาประจำห้องนี้หรือไม่ (หรือเป็นแอดมิน)
  const isHomeroomAdvisor = useMemo(() => {
    if (!currentUser || !selectedClass) return false;
    if (isAdmin) return true; // แอดมินจัดการได้ทุกห้อง
    const cName = (currentUser.name || '').trim().toLowerCase();

    if (selectedClass.adviser && cName && selectedClass.adviser.toLowerCase().includes(cName)) return true;
    if (selectedClass.coAdviser && cName && selectedClass.coAdviser.toLowerCase().includes(cName)) return true;
    if (selectedClass.thirdAdviser && cName && selectedClass.thirdAdviser.toLowerCase().includes(cName)) return true;
    if (Array.isArray(selectedClass.advisers) && selectedClass.advisers.some((a) => a.toLowerCase().includes(cName))) return true;

    if (currentUser.classroomId && (currentUser.classroomId === selectedClass.id || currentUser.classroomId === selectedClass.roomNumber)) return true;

    return false;
  }, [currentUser, selectedClass, isAdmin]);

  const canResetPassword = isAdmin || isHomeroomAdvisor;

  // Password Reset Modals
  const [resettingStudent, setResettingStudent] = useState<StudentRecord | null>(null);
  const [isResetSingleModalOpen, setIsResetSingleModalOpen] = useState(false);
  const [isResettingSingle, setIsResettingSingle] = useState(false);

  const [isResetClassModalOpen, setIsResetClassModalOpen] = useState(false);
  const [isResettingClass, setIsResettingClass] = useState(false);

  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipCopied, setSlipCopied] = useState(false);

  // Refs for clicking outside dropdowns
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (classDropdownRef.current && !classDropdownRef.current.contains(target)) {
        setIsClassDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(target)) {
        setIsGenderDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setIsStatusDropdownOpen(false);
      }
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(target)) {
        setIsGroupDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setIsSortDropdownOpen(false);
      }
      if (!target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Load All Classrooms
  const loadClassrooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const cls = await classroomService.getAll();
      setAllClassrooms(cls);
      if (cls.length > 0) {
        if (initialClassroomId) {
          const match = cls.find((c) => c.id === initialClassroomId || c.name === initialClassroomId);
          setSelectedClass(match || cls[0]);
        } else {
          const currentUser = authService.getCurrentUser();
          const preferred = (currentUser?.classroomId && cls.find((c) => c.id === currentUser.classroomId || c.name === currentUser.classroomId)) || cls[0];
          setSelectedClass((prev) => prev || preferred);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialClassroomId]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  // 2. Load Students for selected classroom
  const loadStudents = useCallback(async (classroomId: string, fallbackName?: string) => {
    setIsLoading(true);
    try {
      let list = await studentService.getByClassroom(classroomId);
      if ((!list || list.length === 0) && fallbackName && fallbackName !== classroomId) {
        list = await studentService.getByClassroom(fallbackName);
      }
      const sorted = (list || []).sort((a, b) => Number(a.no ?? 999) - Number(b.no ?? 999));
      setStudents(sorted);
      setOriginalStudentsOrder(sorted);
      setHasUnsavedReorder(false);
      setNewStudentNo((sorted.length || 0) + 1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass.id, selectedClass.name || selectedClass.roomNumber);
    }
  }, [selectedClass, loadStudents]);

  // Sync when student transferred event fires
  useEffect(() => {
    const handleTransferred = () => {
      loadClassrooms();
      if (selectedClass) {
        loadStudents(selectedClass.id);
      }
    };
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
    return () => window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
  }, [loadClassrooms, selectedClass, loadStudents]);

  // Map each student to attendance state: 'NORMAL' (มาเรียนปกติ) | 'ABSENT' (ขาดเรียน) | 'LEAVE' (ลาเรียน) | 'UNCHECKED' (ยังไม่เช็คชื่อ)
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, 'NORMAL' | 'ABSENT' | 'LEAVE' | 'UNCHECKED'>();
    const today = new Date().toISOString().split('T')[0];
    const morningRecords = selectedClass?.id
      ? attendanceCorrelationService.getMorningRecordsByDateAndRoom(today, selectedClass.id)
      : [];
    const morningMap = new Map(morningRecords.map((r: MorningAssemblyRecord) => [r.studentCode, r.status]));

    students.forEach((s) => {
      const code = s.code || s.studentCode || '';
      const morningStatus = morningMap.get(code);
      if (morningStatus === 'ABSENT' || (s.status === 'AT_RISK' && morningStatus)) {
        map.set(s.id, 'ABSENT');
      } else if (morningStatus === 'LEAVE') {
        map.set(s.id, 'LEAVE');
      } else if (morningStatus === 'PRESENT' || morningStatus === 'LATE' || morningStatus === 'ACTIVITY') {
        map.set(s.id, 'NORMAL');
      } else {
        map.set(s.id, 'UNCHECKED');
      }
    });
    return map;
  }, [students, selectedClass?.id]);

  const totalCount = students.length;

  // Filter & Sort Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.no.toString().includes(q) ||
          (selectedClass?.name || '').toLowerCase().includes(q)
        );
      })
      .filter((s) => {
        if (genderFilter === 'ALL') return true;
        return s.gender === genderFilter;
      })
      .filter((s) => {
        if (statusFilter === 'ALL') return true;
        const currentAtt = studentAttendanceMap.get(s.id);
        return currentAtt === statusFilter;
      })
      .filter((_s) => {
        if (studyGroupFilter === 'ALL') return true;
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'th');
        if (sortOption === 'no-asc') return Number(a.no || 999) - Number(b.no || 999);
        if (sortOption === 'gender-male-first') {
          if (a.gender === 'MALE' && b.gender !== 'MALE') return -1;
          if (a.gender !== 'MALE' && b.gender === 'MALE') return 1;
          return Number(a.no || 999) - Number(b.no || 999);
        }
        if (sortOption === 'gender-female-first') {
          if (a.gender === 'FEMALE' && b.gender !== 'FEMALE') return -1;
          if (a.gender !== 'FEMALE' && b.gender === 'FEMALE') return 1;
          return Number(a.no || 999) - Number(b.no || 999);
        }
        if (sortOption === 'score-desc') return b.score - a.score;
        return Number(a.no || 999) - Number(b.no || 999);
      });
  }, [students, searchTerm, genderFilter, statusFilter, studyGroupFilter, sortOption, studentAttendanceMap, selectedClass]);

  // Paginated Students
  const effectivePageSize = pageSize === 'ALL' ? filteredStudents.length || 1 : (pageSize as number);
  const paginatedStudents = useMemo(() => {
    if (pageSize === 'ALL') return filteredStudents;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredStudents.slice(start, start + effectivePageSize);
  }, [filteredStudents, currentPage, pageSize, effectivePageSize]);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reordering handlers
  const handleMoveStudentUp = (indexInPaginated: number) => {
    const actualIndex = (currentPage - 1) * effectivePageSize + indexInPaginated;
    if (actualIndex <= 0) return;
    const reordered = [...students];
    const temp = reordered[actualIndex - 1];
    reordered[actualIndex - 1] = reordered[actualIndex];
    reordered[actualIndex] = temp;
    const updated = reordered.map((s, idx) => ({ ...s, no: idx + 1 }));
    setStudents(updated);
    setHasUnsavedReorder(true);
  };

  const handleMoveStudentDown = (indexInPaginated: number) => {
    const actualIndex = (currentPage - 1) * effectivePageSize + indexInPaginated;
    if (actualIndex >= students.length - 1) return;
    const reordered = [...students];
    const temp = reordered[actualIndex + 1];
    reordered[actualIndex + 1] = reordered[actualIndex];
    reordered[actualIndex] = temp;
    const updated = reordered.map((s, idx) => ({ ...s, no: idx + 1 }));
    setStudents(updated);
    setHasUnsavedReorder(true);
  };

  const handleSaveReorder = async () => {
    if (!selectedClass) return;
    setIsSavingReorder(true);
    try {
      const studentIds = students.map((s) => s.id);
      const reordered = await studentService.reorderStudents(selectedClass.id, studentIds);
      setOriginalStudentsOrder(reordered);
      setStudents(reordered);
      setHasUnsavedReorder(false);
      setIsReorderMode(false);
      setToastMessage('บันทึกการจัดเรียงลำดับเลขที่นักเรียนเรียบร้อย');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกลำดับเลขที่');
    } finally {
      setIsSavingReorder(false);
    }
  };

  const handleAutoNormalizeRollNumbers = async () => {
    if (!selectedClass || students.length === 0) return;
    setIsSavingReorder(true);
    try {
      const studentIds = students.map((s) => s.id);
      const reordered = await studentService.reorderStudents(selectedClass.id, studentIds);
      setStudents(reordered);
      setOriginalStudentsOrder(reordered);
      setHasUnsavedReorder(false);
      setIsReorderMode(false);
      setToastMessage(`✓ จัดเรียงเลขที่ใหม่ 1 ถึง ${reordered.length} สำเร็จเรียบร้อย`);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการจัดเรียงเลขที่');
    } finally {
      setIsSavingReorder(false);
    }
  };

  const handleCancelReorder = () => {
    setStudents(originalStudentsOrder);
    setHasUnsavedReorder(false);
    setIsReorderMode(false);
  };

  // Open Radar Chart profile modal
  const handleOpenRadarProfile = (stu: StudentRecord) => {
    const atRiskItem: AtRiskStudent = {
      enrollmentId: stu.id,
      studentNo: stu.no,
      name: stu.name,
      tags: [
        {
          text: stu.status === 'AT_RISK' ? 'กลุ่มเสี่ยง' : 'ปกติ',
          type: stu.status === 'AT_RISK' ? 'danger' : 'info',
        },
      ],
      attendanceRatio: stu.attendance || '0/0',
      totalScore: stu.score || 0,
    };
    onSelectStudent?.(atRiskItem);
  };

  // Open Edit Personal Info Modal
  const handleOpenEditStudentModal = (stu: StudentRecord) => {
    setEditingStudent(stu);
    let title = 'ด.ช.';
    let firstName = stu.name;
    let lastName = '';
    const nameParts = stu.name.trim().split(/\s+/);
    if (nameParts[0].startsWith('ด.ช.') || nameParts[0].startsWith('ด.ญ.') || nameParts[0].startsWith('นาย') || nameParts[0].startsWith('นางสาว')) {
      title = nameParts[0].slice(0, 4);
      firstName = nameParts[0].slice(4) || (nameParts[1] || '');
      lastName = nameParts.slice(2).join(' ') || (nameParts.length > 1 ? nameParts[1] : '');
    } else {
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ');
    }
    setEditStudentForm({
      title,
      firstName,
      lastName,
      code: stu.code,
      gender: stu.gender || 'MALE',
    });
    setIsEditStudentOpen(true);
    setOpenActionMenuId(null);
  };

  // Submit Edit Student
  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !selectedClass) return;
    const fullName = `${editStudentForm.title} ${editStudentForm.firstName.trim()} ${editStudentForm.lastName.trim()}`.trim();
    try {
      await studentService.updateStudentPersonalInfo(selectedClass.id, editingStudent.id, {
        name: fullName,
        code: editStudentForm.code.trim(),
        gender: editStudentForm.gender,
      });
      setIsEditStudentOpen(false);
      setToastMessage(`แก้ไขข้อมูลของ ${fullName} เรียบร้อยแล้ว`);
      loadStudents(selectedClass.id);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    }
  };

  // Open Transfer Modal
  const handleOpenTransferModal = (stu: StudentRecord) => {
    setTransferringStudent(stu);
    const otherRooms = allClassrooms.filter((c) => c.id !== selectedClass?.id);
    setTargetRoomId(otherRooms[0]?.id || '');
    setTransferReasonText('ปรับย้ายห้องเรียนตามแผนการเรียน');
    setIsTransferModalOpen(true);
    setOpenActionMenuId(null);
  };

  // Submit Transfer
  const handleConfirmTransfer = async () => {
    if (!transferringStudent || !targetRoomId || !selectedClass) return;
    const targetRoom = allClassrooms.find((c) => c.id === targetRoomId);
    if (!targetRoom) return;

    try {
      messagingService.executeStudentTransfer({
        studentCode: transferringStudent.code || transferringStudent.id,
        fromClassroomId: selectedClass.id,
        toClassroomId: targetRoom.id,
        transferReason: transferReasonText || 'ปรับย้ายห้องเรียนตามแผนการเรียน',
      });
      setIsTransferModalOpen(false);
      setToastMessage(`ย้าย ${transferringStudent.name} ไปยังห้อง ${targetRoom.name} สำเร็จ`);
      loadStudents(selectedClass.id);
      loadClassrooms();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการย้ายห้องเรียน');
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deletingStudent || !selectedClass) return;
    try {
      await studentService.delete(selectedClass.id, deletingStudent.id);
      setIsDeleteStudentOpen(false);
      setToastMessage(`ลบนักเรียน ${deletingStudent.name} และส่งเข้าถังขยะเรียบร้อย`);
      loadStudents(selectedClass.id);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบนักเรียน');
    }
  };

  // รีเซ็ตรหัสผ่านนักเรียนรายบุคคล (เป็นรหัสประจำตัว 5 หลัก)
  const handleConfirmResetSingle = async () => {
    if (!resettingStudent) return;
    setIsResettingSingle(true);
    try {
      await authService.resetStudentPasswordByAdvisor(resettingStudent.code, currentUser?.name);
      setToastMessage(
        `✓ รีเซ็ตรหัสผ่านของ "${resettingStudent.name}" เป็นรหัสเริ่มต้น 5 หลัก (${resettingStudent.code}) เรียบร้อยแล้ว`
      );
      setIsResetSingleModalOpen(false);
      setResettingStudent(null);
      if (selectedClass) loadStudents(selectedClass.id);
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsResettingSingle(false);
    }
  };

  // รีเซ็ตรหัสผ่านนักเรียนทั้งห้องเรียน (เป็นรหัสประจำตัว 5 หลักของแต่ละคน)
  const handleConfirmResetClass = async () => {
    if (!selectedClass) return;
    setIsResettingClass(true);
    try {
      const res = await authService.resetClassroomPasswords(selectedClass.id, currentUser?.name);
      setToastMessage(
        `✓ รีเซ็ตรหัสผ่านนักเรียนทั้งห้อง ${selectedClass.name} จำนวน ${res.count} คน เป็นรหัสเริ่มต้น 5 หลักเรียบร้อยแล้ว`
      );
      setIsResetClassModalOpen(false);
      loadStudents(selectedClass.id);
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่านห้อง');
    } finally {
      setIsResettingClass(false);
    }
  };

  // Add new student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName.trim() || !newStudentCode.trim()) return;
    try {
      await studentService.create(selectedClass.id, {
        studentNo: newStudentNo,
        studentCode: newStudentCode.trim(),
        name: newStudentName.trim(),
        gender: newStudentGender,
        status: 'NORMAL',
      });
      setIsAddStudentOpen(false);
      setNewStudentName('');
      setNewStudentCode('');
      setToastMessage(`เพิ่มนักเรียน ${newStudentName} เรียบร้อยแล้ว`);
      loadStudents(selectedClass.id);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน');
    }
  };

  // ตรวจจับนักเรียนชั้น ม.1 ที่ค้างอยู่ในห้อง ม.3/1 จากการนำเข้าครั้งก่อน
  const misplacedM1Students = useMemo(() => {
    if (!selectedClass) return [];
    const isRoom31 = selectedClass.id === 'room-3-1' || selectedClass.name === 'ม.3/1';
    if (!isRoom31) return [];
    return students.filter((s) => isGrade1SgsStudentCode(s.code));
  }, [selectedClass, students]);

  // ฟังก์ชันย้ายนักเรียน ม.1 ทั้งหมด 204 คน กลับเข้าห้อง ม.1/1 - ม.1/6 อัตโนมัติ (1 คลิก)
  const handleFixMisplacedM1Students = async () => {
    if (!selectedClass || misplacedM1Students.length === 0) return;
    setIsLoading(true);
    try {
      // 1. Group misplaced students by their true room from M1_SGS_STUDENT_LOOKUP
      const byRoom = new Map<string, Array<{ student: StudentRecord; seatNo: number; trueRoom: string }>>();
      for (const st of misplacedM1Students) {
        const info = getM1SgsStudentInfo(st.code);
        if (!info) continue;
        const trueRoom = info.room;
        const seatNo = info.seatNo || st.no;
        if (!byRoom.has(trueRoom)) byRoom.set(trueRoom, []);
        byRoom.get(trueRoom)!.push({ student: st, seatNo, trueRoom });
      }

      // 2. Ensure each M1 classroom exists and import students
      const allRooms = await classroomService.getAll();
      for (const [roomName, list] of byRoom.entries()) {
        let room = allRooms.find(
          (c) => c.name === roomName || c.roomNumber === roomName || c.id === roomName
        );
        if (!room) {
          const levelMatch = roomName.match(/ม\.?\s*(\d+)/);
          const level = levelMatch ? `ม.${levelMatch[1]}` : 'ม.1';
          room = await classroomService.create({
            name: roomName,
            level,
            adviser: 'ยังไม่ได้กำหนด',
          });
        }
        const targetRoomId = room.id;
        const studentsToSave: Array<Omit<StudentRecord, 'id'>> = list.map((item) => ({
          no: item.seatNo,
          code: item.student.code,
          name: item.student.name,
          attendance: item.student.attendance || '0/0',
          score: item.student.score || 0,
          status: item.student.status || 'NORMAL',
          gender: item.student.gender,
          classroomId: targetRoomId,
        }));
        await studentService.batchImport(targetRoomId, studentsToSave);
      }

      // 3. Remove misplaced students from room-3-1
      const misplacedIds = new Set(misplacedM1Students.map((s) => s.id));
      const remainingStudents = students.filter((s) => !misplacedIds.has(s.id));

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`cls_students_${selectedClass.id}`, JSON.stringify(remainingStudents));
        const altKey = getAlternateRoomKey(selectedClass.id);
        if (altKey) {
          localStorage.setItem(`cls_students_${altKey}`, JSON.stringify(remainingStudents));
        }
      }

      await classroomService.getAll();
      await loadStudents(selectedClass.id);
      setToastMessage(
        `✓ แยกและย้ายนักเรียน ม.1 ทั้ง ${misplacedM1Students.length} คน เข้าห้อง ม.1/1 - ม.1/6 สำเร็จเรียบร้อย!`
      );
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: any) {
      console.error('Error relocating M1 students:', err);
      alert('เกิดข้อผิดพลาดในการย้ายนักเรียน: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // นำเข้ารายชื่อนักเรียนจาก SGS & Smart Parser ที่ผ่านการตรวจสอบ Dry-Run แล้ว พร้อม Progress Bar รายงานความคืบหน้า
  const handleSgsImportConfirmed = async (
    confirmedRows: SgsParsedRow[],
    onProgress?: (update: { current: number; total: number; percentage: number; currentStudentName?: string; roomName?: string }) => void
  ) => {
    if (!selectedClass || confirmedRows.length === 0) return;

    try {
      // Group confirmed rows by their actual detected classroom
      const rowsByRoom = new Map<string, SgsParsedRow[]>();
      for (const row of confirmedRows) {
        const roomName = row.classroom || selectedClass.name || 'ม.1/1';
        if (!rowsByRoom.has(roomName)) rowsByRoom.set(roomName, []);
        rowsByRoom.get(roomName)!.push(row);
      }

      const allRooms = await classroomService.getAll();
      const totalStudents = confirmedRows.length;
      let processedStudents = 0;

      for (const [roomName, rows] of rowsByRoom.entries()) {
        let room = allRooms.find(
          (c) => c.name === roomName || c.roomNumber === roomName || c.id === roomName
        );
        if (!room) {
          const levelMatch = roomName.match(/ม\.?\s*(\d+)/);
          const level = levelMatch ? `ม.${levelMatch[1]}` : 'ม.1';
          room = await classroomService.create({
            name: roomName,
            level,
            adviser: 'ยังไม่ได้กำหนด',
          });
        }

        const targetRoomId = room.id;
        const currentInRoom = studentService.getStudents(targetRoomId);

        // 1. Separate UPDATE_SEAT rows vs NEW / TRANSFER rows
        const updateSeatRows = rows.filter((r) => r.selectedAction === 'UPDATE_SEAT');
        const newOrTransferRows = rows.filter(
          (r) => r.selectedAction === 'IMPORT' || r.selectedAction === 'TRANSFER_ROOM'
        );

        // Update seat numbers for existing students while strictly preserving scores, attendance, and all historical data
        if (updateSeatRows.length > 0) {
          const seatUpdateMap = new Map<string, number>();
          updateSeatRows.forEach((r) => {
            const seat = r.parsedSeatNo ?? (r.rawSeatNo ? parseInt(r.rawSeatNo, 10) : null);
            if (seat !== null && !isNaN(seat)) {
              seatUpdateMap.set(r.studentCode.trim(), seat);
            }
          });

          const updatedCurrent = currentInRoom.map((stu) => {
            const codeKey = (stu.code || stu.studentCode || '').trim();
            const newSeat = seatUpdateMap.get(codeKey);
            if (newSeat !== undefined) {
              return { ...stu, no: newSeat };
            }
            return stu;
          }).sort((a, b) => a.no - b.no);

          studentService.saveLocalStudents(targetRoomId, updatedCurrent);

          activityAuditLogService.recordLog({
            actionType: 'BATCH_UPDATE',
            entityType: 'นักเรียน',
            title: `ปรับเลขที่นักเรียนตาม SGS ห้อง ${roomName}`,
            summary: `ปรับปรุงเลขที่นักเรียนตามไฟล์ SGS สำเร็จ ${updateSeatRows.length} คน ในห้อง ${roomName} (รักษาคะแนนและประวัติเดิม 100%)`,
            itemCount: updateSeatRows.length,
            targetScope: roomName,
            actor: 'ครูผู้สอน',
          }).catch(() => {});

          processedStudents += updateSeatRows.length;
          onProgress?.({
            current: Math.min(processedStudents, totalStudents),
            total: totalStudents,
            percentage: Math.min(100, Math.round((processedStudents / totalStudents) * 100)),
            currentStudentName: updateSeatRows[updateSeatRows.length - 1]?.fullName,
            roomName,
          });
        }

        // Import new or transferred students with progress reporting
        if (newOrTransferRows.length > 0) {
          const studentsToImport: Array<Omit<StudentRecord, 'id'>> = newOrTransferRows.map((r) => ({
            no: r.parsedSeatNo ?? r.rowIndex,
            code: r.studentCode,
            name: r.fullName,
            attendance: '0/0',
            score: 0,
            status: 'NORMAL',
            gender: r.gender,
            classroomId: targetRoomId,
          }));

          const initialProcessed = processedStudents;
          await studentService.batchImport(targetRoomId, studentsToImport, {
            term: 2,
            academicYear: 2569,
            roomName,
            onProgress: (p) => {
              const currentOverall = initialProcessed + p.current;
              onProgress?.({
                current: Math.min(currentOverall, totalStudents),
                total: totalStudents,
                percentage: Math.min(100, Math.round((currentOverall / totalStudents) * 100)),
                currentStudentName: p.currentStudentName,
                roomName,
              });
            },
          });

          processedStudents += newOrTransferRows.length;
        }
      }

      await classroomService.getAll();
      await loadStudents(selectedClass.id);
      setIsImportModalOpen(false);

      if (rowsByRoom.size > 1) {
        setToastMessage(
          `✓ นำเข้ารายชื่อ/ปรับเลขที่นักเรียน ${confirmedRows.length} คน แยกเข้า ${rowsByRoom.size} ห้อง (${Array.from(rowsByRoom.keys()).join(', ')}) สำเร็จเรียบร้อย (รักษาคะแนนเดิม 100%)`
        );
      } else {
        const singleRoomName = Array.from(rowsByRoom.keys())[0];
        setToastMessage(
          `✓ นำเข้ารายชื่อ/ปรับเลขที่นักเรียน ${confirmedRows.length} คน ในห้อง ${singleRoomName} สำเร็จ (รักษาคะแนนเดิม 100%)`
        );
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Import error:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายชื่อนักเรียน');
    }
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 animate-fade-in font-sans text-slate-800 select-none">
      {/* ========================================================
          1. HEADER HERO BANNER (ตามภาพ Mockup ซ้ายบน)
         ======================================================== */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
        {/* Left: Icon Badge + Title + Subtitle */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                จัดการนักเรียน / นักเรียน
              </h1>
              {onBackToClassrooms && (
                <button
                  type="button"
                  onClick={onBackToClassrooms}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="กลับสู่หน้ารวมห้องเรียน"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>หน้ารวมห้องเรียน</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              ดูข้อมูลนักเรียนในห้องที่ปรึกษา และห้องที่สอนของคุณ
            </p>
          </div>
        </div>

        {/* Right: Soft Blue Info Card with Mascot */}
        <div className="relative flex items-center gap-3 bg-blue-50/80 border border-blue-200/60 rounded-2xl p-3 sm:px-4 sm:py-2.5 z-10 max-w-md">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-[11px] sm:text-xs text-blue-900 font-medium leading-relaxed">
            <span className="font-bold">ข้อมูลนักเรียนจัดการโดยผู้ดูแลระบบ</span>
            <br />
            ครูสามารถดู/ใช้งานได้เท่านั้น
          </div>
          {/* Mascot Illustration */}
          <div className="shrink-0 -my-2 -mr-1 hidden sm:block">
            <img
              src="/images/banners/student-avatar-girl.png"
              alt="Student mascot"
              className="w-14 h-14 object-contain filter drop-shadow-xs"
              onError={(e) => {
                // Safe fallback if image is missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Soft background glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-50/40 to-transparent pointer-events-none" />
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1-Click Repair Banner for Misplaced Grade 1 Students */}
      {misplacedM1Students.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                ตรวจพบนักเรียนชั้น ม.1 จำนวน {misplacedM1Students.length} คน อยู่ในห้อง {selectedClass?.name || 'ม.3/1'}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                  จากการนำเข้าครั้งก่อน
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                ระบบตรวจพบข้อมูลห้องและเลขที่จริงจาก SGS (ม.1/1 - ม.1/6) พร้อมที่จะแยกนักเรียนเข้าห้องที่ถูกต้องให้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFixMisplacedM1Students}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>🚀 แยกนักเรียนเข้าห้อง ม.1/1 - ม.1/6 ทันที (1 คลิก)</span>
          </button>
        </div>
      )}



      {/* ========================================================
          3. FILTER AND CONTROLS BAR (ตามภาพ Mockup แถวที่ 3)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Group: Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. ปุ่ม ทั้งหมด (Solid Blue Button) */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setGenderFilter('ALL');
                setStudyGroupFilter('ALL');
                setSearchTerm('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>ทั้งหมด</span>
            </button>

            {/* 2. Dropdown ห้องเรียน (เช่น ม.3/1) */}
            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                {selectedClass ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-extrabold text-xs ${
                      getGradeLevelTheme(selectedClass.name).pillBg
                    } ${getGradeLevelTheme(selectedClass.name).pillText} ${
                      getGradeLevelTheme(selectedClass.name).pillBorder
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getGradeLevelTheme(selectedClass.name).dotColor
                      }`}
                    />
                    <span>{selectedClass.name}</span>
                  </span>
                ) : (
                  <span>ม.3/1</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isClassDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 space-y-1 max-h-64 overflow-y-auto animate-scale-up">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">
                    เลือกห้องเรียน
                  </div>
                  {allClassrooms.map((c) => {
                    const theme = getGradeLevelTheme(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClass(c);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left font-semibold transition-colors cursor-pointer ${
                          selectedClass?.id === c.id
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
                          <span className="font-bold">{c.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.studentCount || 0} คน
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Dropdown เพศ */}
            <div className="relative" ref={genderDropdownRef}>
              <button
                type="button"
                onClick={() => setIsGenderDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <span>
                  {genderFilter === 'ALL'
                    ? 'เพศ'
                    : genderFilter === 'MALE'
                    ? 'ชาย'
                    : 'หญิง'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isGenderDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-up">
                  <button
                    type="button"
                    onClick={() => {
                      setGenderFilter('ALL');
                      setIsGenderDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    เพศทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGenderFilter('MALE');
                      setIsGenderDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    เฉพาะชาย
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGenderFilter('FEMALE');
                      setIsGenderDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    เฉพาะหญิง
                  </button>
                </div>
              )}
            </div>

            {/* 4. Dropdown สถานะ */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <span>
                  {statusFilter === 'ALL'
                    ? 'สถานะ'
                    : statusFilter === 'NORMAL'
                    ? 'ปกติ'
                    : statusFilter === 'ABSENT'
                    ? 'ขาดเรียน'
                    : 'ลาเรียน'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-up">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    สถานะทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('NORMAL');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-emerald-700 font-semibold cursor-pointer"
                  >
                    ปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ABSENT');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-rose-700 font-semibold cursor-pointer"
                  >
                    ขาดเรียน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('LEAVE');
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-purple-700 font-semibold cursor-pointer"
                  >
                    ลาเรียน
                  </button>
                </div>
              )}
            </div>

            {/* 5. Dropdown กลุ่มเรียน */}
            <div className="relative" ref={groupDropdownRef}>
              <button
                type="button"
                onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <span>กลุ่มเรียน</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isGroupDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-up">
                  <button
                    type="button"
                    onClick={() => {
                      setStudyGroupFilter('ALL');
                      setIsGroupDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    กลุ่มเรียนทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudyGroupFilter('GROUP_A');
                      setIsGroupDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    กลุ่ม 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudyGroupFilter('GROUP_B');
                      setIsGroupDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    กลุ่ม 2
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Group: Search Box + Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อนักเรียน / เลขที่ / ห้อง"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  เรียง:{' '}
                  {sortOption === 'name-asc'
                    ? 'ชื่อ ก-ฮ'
                    : sortOption === 'no-asc'
                    ? 'เลขที่'
                    : sortOption === 'gender-male-first'
                    ? 'ชาย ➔ หญิง'
                    : sortOption === 'gender-female-first'
                    ? 'หญิง ➔ ชาย'
                    : 'คะแนน'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-up">
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('name-asc');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    เรียงตามชื่อ ก-ฮ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('no-asc');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    เรียงตามเลขที่ (1 ➔ มาก)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('gender-male-first');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    ชาย ➔ หญิง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption('gender-female-first');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    หญิง ➔ ชาย
                  </button>
                </div>
              )}
            </div>

            {/* Reorder Mode Button & Actions */}
            {(isFullAccess || canResetPassword) && (
              <div className="flex items-center gap-1.5">
                {!isReorderMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsReorderMode(true)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      title="สลับลำดับเลขที่นักเรียน"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                      จัดเลขที่
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoNormalizeRollNumbers}
                      disabled={isSavingReorder}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                      title="จัดเรียงเลขที่นักเรียนใหม่ 1 ถึง N อัตโนมัติ แก้ปัญหาเลขที่ซ้ำซ้อน"
                    >
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      <span>🔢 จัดเรียงเลขที่ใหม่ (1..N)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveReorder}
                      disabled={isSavingReorder}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingReorder ? 'กำลังบันทึก...' : 'บันทึกเลขที่'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelReorder}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                      title="ยกเลิกการจัดเลขที่"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="นำเข้ารายชื่อนักเรียนจาก SGS หรือ Excel พร้อมระบบตรวจสอบ Dry-Run"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>นำเข้า Excel/SGS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsScoreExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="ส่งออกคะแนนไปยังระบบ SGS (Reverse Sync)"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ส่งคะแนนไป SGS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  title="เพิ่มนักเรียนใหม่ในห้องนี้"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>เพิ่มนักเรียน</span>
                </button>

                {canResetPassword && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsResetClassModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      title={isAdmin ? "รีเซ็ตรหัสผ่านนักเรียนทั้งห้อง (สิทธิ์แอดมิน)" : "รีเซ็ตรหัสผ่านนักเรียนทั้งห้อง (ครูที่ปรึกษา)"}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>รีเซ็ตรหัสผ่านห้อง</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSlipCopied(false);
                        setIsSlipModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      title="พิมพ์ใบรหัสผ่านเริ่มต้นสำหรับแจกนักเรียน"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>ใบรหัสผ่าน</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unsaved Reorder Alert */}
        {hasUnsavedReorder && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between animate-fade-in">
            <span className="font-semibold">
              ⚠️ มีการปรับเปลี่ยนลำดับเลขที่นักเรียนชั่วคราว อย่าลืมกด "บันทึกเลขที่" เพื่อยืนยัน
            </span>
            <button
              type="button"
              onClick={handleSaveReorder}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-2xs cursor-pointer"
            >
              บันทึกทันที
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          4. STUDENT LIST (DESKTOP TABLE & MOBILE STACKED CARDS)
         ======================================================== */}
      {/* DESKTOP TABLE VIEW */}
      <div
        className={`hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs relative transition-all ${
          openActionMenuId ? 'z-30 overflow-visible' : 'overflow-visible'
        } min-h-[240px]`}
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10 text-center rounded-tl-2xl">
                <input
                  type="checkbox"
                  checked={
                    filteredStudents.length > 0 &&
                    selectedStudentIds.length === filteredStudents.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {isReorderMode && <th className="py-3.5 px-2 w-20 text-center">สลับ</th>}
              <th className="py-3.5 px-4 w-16 text-center">ลำดับ</th>
              <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
              <th className="py-3.5 px-4 w-28">ชั้น/ห้อง</th>
              <th className="py-3.5 px-4 w-20 text-center">เลขที่</th>
              <th className="py-3.5 px-4 w-32">สถานะ</th>
              <th className="py-3.5 px-4 w-56 text-right rounded-tr-2xl">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={isReorderMode ? 8 : 7} className="py-16 text-center text-slate-400">
                  {isLoading ? 'กำลังโหลดข้อมูลนักเรียน...' : 'ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก'}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((stu, index) => {
                const attStatus = studentAttendanceMap.get(stu.id) || 'NORMAL';
                const isSelected = selectedStudentIds.includes(stu.id);
                const isDropup =
                  paginatedStudents.length >= 4 && index >= paginatedStudents.length - 2;

                return (
                  <tr
                    key={stu.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/30' : ''
                    } relative ${openActionMenuId === stu.id ? 'z-40' : 'z-0'}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(stu.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Reorder Buttons (If Active) */}
                    {isReorderMode && (
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStudentUp(index)}
                            disabled={currentPage === 1 && index === 0}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStudentDown(index)}
                            disabled={index === paginatedStudents.length - 1}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* ลำดับ */}
                    <td className="py-3 px-4 text-center font-mono text-slate-500 font-semibold">
                      {(currentPage - 1) * effectivePageSize + index + 1}
                    </td>

                    {/* ชื่อ-นามสกุล + Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {stu.avatarUrl ? (
                            <img
                              src={stu.avatarUrl}
                              alt={stu.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xs">
                              {stu.gender === 'FEMALE' ? '👧' : '👦'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">
                            {stu.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            เลขประจำตัว {stu.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ชั้น/ห้อง */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {selectedClass ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-xs ${
                            getGradeLevelTheme(selectedClass.name).pillBg
                          } ${getGradeLevelTheme(selectedClass.name).pillText} ${
                            getGradeLevelTheme(selectedClass.name).pillBorder
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              getGradeLevelTheme(selectedClass.name).dotColor
                            }`}
                          />
                          <span>{selectedClass.name}</span>
                        </span>
                      ) : (
                        'ม.3/1'
                      )}
                    </td>

                    {/* เลขที่ */}
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {stu.no}
                    </td>

                    {/* สถานะ */}
                    <td className="py-3 px-4">
                      {attStatus === 'NORMAL' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          <User className="w-3 h-3" />
                          <span>ปกติ</span>
                        </span>
                      )}
                      {attStatus === 'ABSENT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ขาดเรียน</span>
                        </span>
                      )}
                      {attStatus === 'LEAVE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>ลาเรียน</span>
                        </span>
                      )}
                      {attStatus === 'UNCHECKED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>ยังไม่เช็คชื่อ</span>
                        </span>
                      )}
                    </td>

                    {/* การดำเนินการ: [👤 โปรไฟล์], [📊 ผลการเรียน], [⋯] */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. ปุ่ม โปรไฟล์ (Blue soft outline) */}
                        <button
                          type="button"
                          onClick={() => handleOpenRadarProfile(stu)}
                          className="px-2.5 py-1.5 bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/80 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="ดูโปรไฟล์และ Radar Chart"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>โปรไฟล์</span>
                        </button>

                        {/* 2. ปุ่ม ผลการเรียน (Purple soft outline) */}
                        <button
                          type="button"
                          onClick={() => setGradeModalStudent(stu)}
                          className="px-2.5 py-1.5 bg-purple-50/80 hover:bg-purple-100 text-purple-600 border border-purple-200/80 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="ดูผลสัมฤทธิ์ทางการเรียน"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>ผลการเรียน</span>
                        </button>

                        {/* 3. ปุ่ม Action Menu [...] */}
                        <div className="relative action-menu-container">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId((prev) =>
                                prev === stu.id ? null : stu.id
                              )
                            }
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              openActionMenuId === stu.id
                                ? 'bg-blue-100 text-blue-700 shadow-2xs'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title="ตัวเลือกเพิ่มเติม"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openActionMenuId === stu.id && (
                            <div
                              className={`absolute right-0 ${
                                isDropup ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-52 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-[70] p-1.5 space-y-1 text-xs animate-scale-up ring-1 ring-slate-900/5`}
                            >
                              {isFullAccess && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStudentModal(stu)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-left cursor-pointer font-medium"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>แก้ไขข้อมูลส่วนตัว</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenTransferModal(stu)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-left cursor-pointer font-medium"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>ย้ายห้องเรียน</span>
                              </button>
                              {canResetPassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResettingStudent(stu);
                                    setIsResetSingleModalOpen(true);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-amber-700 text-left cursor-pointer font-medium"
                                  title="รีเซ็ตรหัสผ่านกลับเป็นรหัสประจำตัว 5 หลัก"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                  <span>รีเซ็ตรหัสผ่าน (5 หลัก)</span>
                                </button>
                              )}
                              {isFullAccess && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingStudent(stu);
                                    setIsDeleteStudentOpen(true);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 text-left cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>ลบออกจากห้อง</span>
                                </button>
                              )}
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

      {/* MOBILE STACKED CARDS VIEW (ตรงตามภาพ Mockup บนมือถือ) */}
      <div className="md:hidden space-y-3">
        {paginatedStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            {isLoading ? 'กำลังโหลดข้อมูลนักเรียน...' : 'ไม่พบข้อมูลนักเรียน'}
          </div>
        ) : (
          paginatedStudents.map((stu) => {
            const attStatus = studentAttendanceMap.get(stu.id) || 'NORMAL';
            return (
              <div
                key={stu.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 relative"
              >
                {/* Top: Avatar + Name + Status */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {stu.avatarUrl ? (
                        <img
                          src={stu.avatarUrl}
                          alt={stu.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-sm">
                          {stu.gender === 'FEMALE' ? '👧' : '👦'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{stu.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        เลขประจำตัว {stu.code}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {selectedClass?.name || 'ม.3/1'} • เลขที่ {stu.no}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {attStatus === 'NORMAL' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                        <User className="w-3 h-3" />
                        <span>ปกติ</span>
                      </span>
                    )}
                    {attStatus === 'ABSENT' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>ขาดเรียน</span>
                      </span>
                    )}
                    {attStatus === 'LEAVE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                        <Clock className="w-3 h-3" />
                        <span>ลาเรียน</span>
                      </span>
                    )}
                    {attStatus === 'UNCHECKED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium text-xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>ยังไม่เช็ค</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenRadarProfile(stu)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>โปรไฟล์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradeModalStudent(stu)}
                    className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>ผลการเรียน</span>
                  </button>

                  <div className="relative action-menu-container">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenActionMenuId((prev) =>
                          prev === stu.id ? null : stu.id
                        )
                      }
                      className={`p-2 border rounded-xl transition-all cursor-pointer ${
                        openActionMenuId === stu.id
                          ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="ตัวเลือกเพิ่มเติม"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openActionMenuId === stu.id && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-[70] p-1.5 space-y-1 text-xs animate-scale-up ring-1 ring-slate-900/5">
                        {isFullAccess && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditStudentModal(stu)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-left cursor-pointer font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>แก้ไขข้อมูลส่วนตัว</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenTransferModal(stu)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-left cursor-pointer font-medium"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>ย้ายห้องเรียน</span>
                        </button>
                        {canResetPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              setResettingStudent(stu);
                              setIsResetSingleModalOpen(true);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-amber-700 text-left cursor-pointer font-medium"
                            title="รีเซ็ตรหัสผ่านกลับเป็นรหัสประจำตัว 5 หลัก"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>รีเซ็ตรหัสผ่าน (5 หลัก)</span>
                          </button>
                        )}
                        {isFullAccess && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingStudent(stu);
                              setIsDeleteStudentOpen(true);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 text-left cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบออกจากห้อง</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          5. PAGINATION (UI การแบ่งหน้ารองรับขนาดต่อหน้า & Smart Ellipsis)
         ======================================================== */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredStudents.length}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 30, 50, 'ALL']}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => setPageSize(size)}
        itemUnit="คน"
      />

      {/* ========================================================
          6. MOBILE STICKY BOTTOM ACTION BAR (ตามภาพ Mockup ขวา)
         ======================================================== */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
            setGenderFilter('ALL');
          }}
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Users className="w-5 h-5" />
          <span>ดูทั้งหมด ({totalCount} คน)</span>
        </button>
      </div>

      {/* ========================================================
          7. MODALS
         ======================================================== */}
      {/* 7.1 Academic Grades Modal */}
      {gradeModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ผลการเรียน: {gradeModalStudent.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    เลขประจำตัว {gradeModalStudent.code} • ห้อง {selectedClass?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGradeModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between">
                <span className="font-semibold text-purple-900">คะแนนสะสมเฉลี่ย (GPA)</span>
                <span className="text-lg font-black text-purple-700">
                  {gradeModalStudent.score >= 80 ? '4.00' :
                   gradeModalStudent.score >= 75 ? '3.50' :
                   gradeModalStudent.score >= 70 ? '3.00' :
                   gradeModalStudent.score >= 65 ? '2.50' :
                   gradeModalStudent.score >= 60 ? '2.00' :
                   gradeModalStudent.score >= 55 ? '1.50' :
                   gradeModalStudent.score >= 50 ? '1.00' :
                   gradeModalStudent.score > 0 ? '0.00' : '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">คะแนนเก็บระหว่างภาค</span>
                <span className="text-base font-bold text-slate-900">
                  {gradeModalStudent.score} / 100
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">สถานะผลการเรียน</span>
                <span className={`font-bold ${gradeModalStudent.score >= 50 ? 'text-emerald-600' : gradeModalStudent.score > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {gradeModalStudent.score >= 50 ? 'ผ่านเกณฑ์มาตรฐาน' : gradeModalStudent.score > 0 ? 'ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)' : 'รอประเมิน'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setGradeModalStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.3 Edit Student Personal Info Modal */}
      {isEditStudentOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลส่วนตัวนักเรียน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">คำนำหน้า</label>
                <select
                  value={editStudentForm.title}
                  onChange={(e) =>
                    setEditStudentForm({ ...editStudentForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="ด.ช.">ด.ช.</option>
                  <option value="ด.ญ.">ด.ญ.</option>
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={editStudentForm.firstName}
                    onChange={(e) =>
                      setEditStudentForm({ ...editStudentForm, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={editStudentForm.lastName}
                    onChange={(e) =>
                      setEditStudentForm({ ...editStudentForm, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">เลขประจำตัวนักเรียน</label>
                <input
                  type="text"
                  value={editStudentForm.code}
                  onChange={(e) =>
                    setEditStudentForm({ ...editStudentForm, code: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStudentOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7.4 Transfer Student Modal */}
      {isTransferModalOpen && transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">ย้ายห้องเรียน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs">
              <p className="font-bold text-purple-900">{transferringStudent.name}</p>
              <p className="text-purple-700 mt-0.5">
                จากห้องเดิม: <span className="font-bold">{selectedClass?.name}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เลือกห้องเรียนปลายทาง
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  {allClassrooms
                    .filter((c) => c.id !== selectedClass?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) - ครูที่ปรึกษา: {c.adviser}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">เหตุผลในการย้ายห้อง</label>
                <textarea
                  value={transferReasonText}
                  onChange={(e) => setTransferReasonText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
                <p className="font-bold">✨ ระบบจะซิงค์ข้อมูลอัตโนมัติ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>ย้ายออกจากกลุ่มแชทห้องเดิม เข้ากลุ่มแชทห้องใหม่ทันที</li>
                  <li>ภาระงานและคะแนนเก็บทุกอย่างยังคงติดตัวนักเรียนเหมือนเดิม</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ยืนยันการย้ายห้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.5 Delete Student Modal */}
      {isDeleteStudentOpen && deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ลบ {deletingStudent.name} ออกจากห้อง?
              </h3>
              <p className="text-xs text-slate-500">
                ข้อมูลนักเรียนจะยังคงอยู่ในระบบ (ถังขยะ) จนกว่าจะจำหน่ายออกจากโรงเรียนอย่างเป็นทางการ
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteStudentOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.6 Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  เพิ่มนักเรียนใหม่ (ห้อง {selectedClass?.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">เลขที่</label>
                  <input
                    type="number"
                    min={1}
                    value={newStudentNo}
                    onChange={(e) => setNewStudentNo(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">เพศ</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="MALE">ชาย</option>
                    <option value="FEMALE">หญิง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">เลขประจำตัวนักเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น 45101"
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น ด.ช. สมศักดิ์ ใจดี"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกนักเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: นำเข้ารายชื่อนักเรียนจาก SGS / Excel (Smart Parser + Dry Run Preview) */}
      {isImportModalOpen && selectedClass && (
        <SgsRosterImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          targetClassroom={selectedClass.name}
          existingStudents={students.map((s) => ({
            id: s.id,
            studentCode: s.code,
            name: s.name,
            classroomId: selectedClass.name,
            sgsSeatNo: s.no
          }))}
          onImportComplete={handleSgsImportConfirmed}
        />
      )}

      {/* Modal: ส่งออกคะแนนไปยัง SGS (Reverse Sync) */}
      {selectedClass && (
        <SgsScoreExportModal
          isOpen={isScoreExportModalOpen}
          onClose={() => setIsScoreExportModalOpen(false)}
          courseCode="กป21101"
          courseName="การงานอาชีพ"
          classroom={selectedClass.name}
          roster={students.map((s, idx) => ({
            sgsRowIndex: idx + 1,
            sgsSeatNo: s.no,
            studentCode: s.code,
            studentName: s.name,
            unit1Score: Math.round(s.score * 0.4),
            unit2Score: Math.round(s.score * 0.3),
            midtermScore: 16,
            finalScore: 24,
            totalScore: s.score || 80
          }))}
        />
      )}

      {/* Modal: รีเซ็ตรหัสผ่านนักเรียนรายบุคคล */}
      {isResetSingleModalOpen && resettingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">รีเซ็ตรหัสผ่านนักเรียน</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetSingleModalOpen(false);
                  setResettingStudent(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-amber-200 overflow-hidden bg-amber-50 flex items-center justify-center">
                  <img
                    src={resettingStudent.avatarUrl || '/images/banners/student-avatar.png'}
                    alt={resettingStudent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{resettingStudent.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    เลขประจำตัว: {resettingStudent.code} (เลขที่ {resettingStudent.no})
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <span>🔑 รหัสผ่านเริ่มต้นใหม่:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-950 font-extrabold text-sm">
                    {resettingStudent.code}
                  </span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  เมื่อยืนยัน รหัสผ่านจะถูกรีเซ็ตกลับเป็นรหัสประจำตัว 5 หลัก นักเรียนสามารถใช้เข้าสู่ระบบและไปตั้งรหัสผ่านใหม่ได้ทันที
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetSingleModalOpen(false);
                    setResettingStudent(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isResettingSingle}
                  onClick={handleConfirmResetSingle}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isResettingSingle ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: รีเซ็ตรหัสผ่านนักเรียนทั้งห้องเรียน */}
      {isResetClassModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">รีเซ็ตรหัสผ่านห้อง {selectedClass.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetClassModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <p className="font-bold text-sm">
                  ⚠️ ยืนยันการรีเซ็ตรหัสผ่านนักเรียนทั้งห้อง ({students.length} คน)
                </p>
                <p className="text-amber-800 leading-relaxed">
                  รหัสผ่านของนักเรียนทุกคนในห้อง <strong>{selectedClass.name}</strong> จะถูกรีเซ็ตกลับเป็น <strong>รหัสประจำตัว 5 หลักของแต่ละคน</strong> (เช่น 15171)
                </p>
                <p className="text-[11px] text-amber-700">
                  {isAdmin ? 'ดำเนินการโดยสิทธิ์: ผู้ดูแลระบบ (Admin)' : `ดำเนินการโดยครูที่ปรึกษา: ${currentUser?.name || selectedClass.adviser}`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetClassModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isResettingClass}
                  onClick={handleConfirmResetClass}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isResettingClass ? 'กำลังรีเซ็ต...' : `รีเซ็ตทั้ง ${students.length} คน`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: พิมพ์ / ดูใบรหัสผ่านเริ่มต้นนักเรียน (Slip) */}
      {isSlipModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ใบรหัสผ่านเริ่มต้นนักเรียน (ห้อง {selectedClass.name} • {students.length} คน)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-800 font-sans">คำแนะนำสำหรับครูที่ปรึกษา:</p>
                <p className="text-[11px] text-slate-600 font-sans">
                  สามารถคัดลอกหรือสั่งพิมพ์ตารางรหัสผ่านเริ่มต้น (รหัส 5 หลัก) เพื่อแจกให้นักเรียนในห้องใช้เข้าสู่ระบบครั้งแรกได้ทันที
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-sans font-bold">
                    <tr>
                      <th className="py-2 px-3 w-16 text-center">เลขที่</th>
                      <th className="py-2 px-3">เลขประจำตัว</th>
                      <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                      <th className="py-2 px-3 text-center">รหัสผ่านเริ่มต้น</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-bold text-slate-600">{s.no}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{s.code}</td>
                        <td className="py-2 px-3 font-sans text-slate-800">{s.name}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold font-mono">
                            {s.code}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  const slipText = authService.generateStudentCredentialSlip(students);
                  navigator.clipboard.writeText(slipText);
                  setSlipCopied(true);
                  setTimeout(() => setSlipCopied(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{slipCopied ? 'คัดลอกเรียบร้อยแล้ว ✓' : 'คัดลอกข้อความ Slip'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>สั่งพิมพ์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
