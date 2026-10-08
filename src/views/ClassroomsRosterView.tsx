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
  Check,
  CheckCircle2,
  Layers,
  UserPlus,
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Edit2,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { classroomService } from '../services/classroomService';
import { studentService, type StudentRecord } from '../services/studentService';
import { authService } from '../services/authService';
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
  | 'no-asc'
  | 'gender-male-first'
  | 'gender-female-first'
  | 'score-desc'
  | 'name-asc';

type ViewMode = 'CLASSROOMS_TABLE' | 'STUDENT_ROSTER';

export const ClassroomsRosterView: React.FC<ClassroomsRosterViewProps> = ({
  onSelectStudent,
  onSelectClassroom,
  activeRole = 'TEACHER_GENERAL',
  onChangeRole: _onChangeRole,
}) => {
  // Navigation Mode: Classrooms Table first vs Student Roster drilldown
  const [viewMode, setViewMode] = useState<ViewMode>('CLASSROOMS_TABLE');

  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomRosterItem | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [originalStudentsOrder, setOriginalStudentsOrder] = useState<StudentRecord[]>([]);
  const [hasUnsavedReorder, setHasUnsavedReorder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classroomSearchTerm, setClassroomSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('no-asc');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NORMAL' | 'AT_RISK'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');

  // Dropdown menus
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassroomOpen, setIsAddClassroomOpen] = useState(false);
  const [isEditClassroomOpen, setIsEditClassroomOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<ClassroomRosterItem | null>(null);
  const [isDeleteClassroomOpen, setIsDeleteClassroomOpen] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState<ClassroomRosterItem | null>(null);

  // Student Edit Personal Info Modal
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    title: 'ด.ช.',
    firstName: '',
    lastName: '',
    code: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
  });

  // Soft Delete Student Modal
  const [isDeleteStudentOpen, setIsDeleteStudentOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState<StudentRecord | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [transferReasonText, setTransferReasonText] = useState<string>('');
  const [transferSuccessNotice, setTransferSuccessNotice] = useState<string | null>(null);

  // Add student form state
  const [newStudentNo, setNewStudentNo] = useState<number>(1);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'MALE' | 'FEMALE'>('MALE');

  // Add/Edit classroom form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('ม.1');
  const [newAdviser, setNewAdviser] = useState(
    () => authService.getCurrentUser()?.name || 'ครูประจำชั้น'
  );

  const classDropdownRef = useRef<HTMLDivElement>(null);

  const isFullAccess =
    activeRole === 'ACADEMIC_ADMIN' ||
    activeRole === 'STUDENT_AFFAIRS' ||
    activeRole === 'STUDENT_COUNCIL' ||
    (activeRole as string) === 'ADMIN' ||
    (activeRole as string) === 'DIRECTOR';

  // โหลดรายการห้องเรียนทั้งหมดจาก Supabase (Zero Mock Data)
  const loadClassrooms = async () => {
    setIsLoading(true);
    try {
      const cls = await classroomService.getAll();
      setAllClassrooms(cls);
      if (!selectedClass && cls.length > 0) {
        const defaultRoom = cls.find((c) => c.name === 'ม.3/1' || c.roomNumber === 'ม.3/1') || cls[0];
        setSelectedClass(defaultRoom);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // โหลดรายชื่อนักเรียนเมื่อเลือกห้องเรียน
  const loadStudentsForClass = async (classId: string) => {
    setIsLoading(true);
    try {
      const stuList = await studentService.getByClassroom(classId);
      setStudents(stuList);
      setOriginalStudentsOrder(stuList);
      setHasUnsavedReorder(false);
      setNewStudentNo(stuList.length + 1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass.id);
    }
  }, [selectedClass?.id]);

  // ซิงค์รายชื่อนักเรียนเมื่อมีการย้ายห้องเรียน (STUDENT_TRANSFERRED_EVENT)
  useEffect(() => {
    const handleTransferred = () => {
      loadClassrooms();
      if (selectedClass) {
        loadStudentsForClass(selectedClass.id);
      }
    };
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
    return () => window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
  }, [selectedClass?.id]);

  // ปิด Action menu เมื่อคลิกนอกเมนู
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenuId && !(e.target as HTMLElement).closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
      if (
        isClassDropdownOpen &&
        classDropdownRef.current &&
        !classDropdownRef.current.contains(e.target as HTMLElement)
      ) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenuId, isClassDropdownOpen]);

  // Handler สลับเข้าสู่หน้ารายชื่อนักเรียนในห้องนั้น
  const handleDrilldownToClassroom = (classroom: ClassroomRosterItem) => {
    setSelectedClass(classroom);
    setViewMode('STUDENT_ROSTER');
    onSelectClassroom(classroom.id);
  };

  // Handler กลับสู่หน้ารวมห้องเรียน
  const handleBackToClassroomsTable = () => {
    if (hasUnsavedReorder) {
      if (!window.confirm('คุณมีรายการจัดลำดับเลขที่ที่ยังไม่ได้บันทึก ต้องการยกเลิกและกลับไปหน้ารวมห้องเรียนหรือไม่?')) {
        return;
      }
      setHasUnsavedReorder(false);
      setStudents(originalStudentsOrder);
    }
    setViewMode('CLASSROOMS_TABLE');
    loadClassrooms();
  };

  // จัดการเลื่อนนักเรียนขึ้น (Move Up)
  const handleMoveStudentUp = (index: number) => {
    if (index <= 0) return;
    const reordered = [...students];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;

    // อัปเดตเลขที่ชั่วคราว
    const updated = reordered.map((s, idx) => ({ ...s, no: idx + 1 }));
    setStudents(updated);
    setHasUnsavedReorder(true);
  };

  // จัดการเลื่อนนักเรียนลง (Move Down)
  const handleMoveStudentDown = (index: number) => {
    if (index >= students.length - 1) return;
    const reordered = [...students];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;

    // อัปเดตเลขที่ชั่วคราว
    const updated = reordered.map((s, idx) => ({ ...s, no: idx + 1 }));
    setStudents(updated);
    setHasUnsavedReorder(true);
  };

  // บันทึกการจัดลำดับเลขที่นักเรียน (Save Reorder Confirmation)
  const handleSaveReorder = async () => {
    if (!selectedClass) return;
    setIsSavingReorder(true);
    try {
      const studentIds = students.map((s) => s.id);
      const reordered = await studentService.reorderStudents(selectedClass.id, studentIds);
      setStudents(reordered);
      setOriginalStudentsOrder(reordered);
      setHasUnsavedReorder(false);
      setTransferSuccessNotice(`บันทึกการจัดเรียงเลขที่นักเรียนห้อง ${selectedClass.name} เรียบร้อยแล้ว`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error saving reorder:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกลำดับเลขที่');
    } finally {
      setIsSavingReorder(false);
    }
  };

  // ยกเลิกการจัดลำดับเลขที่นักเรียน
  const handleCancelReorder = () => {
    setStudents(originalStudentsOrder);
    setHasUnsavedReorder(false);
  };

  // เปิด Modal แก้ไขข้อมูลส่วนตัวนักเรียน
  const handleOpenEditStudent = (stu: StudentRecord) => {
    setEditingStudent(stu);
    const parts = (stu.name || '').trim().split(/\s+/);
    let title = 'ด.ช.';
    let firstName = parts[0] || '';
    let lastName = parts.slice(1).join(' ') || '';

    if (parts[0]?.startsWith('ด.ช.') || parts[0]?.startsWith('เด็กชาย')) {
      title = 'ด.ช.';
      firstName = parts[0].replace(/^(ด\.ช\.|เด็กชาย)/, '') || parts[1] || '';
      lastName = parts.slice(parts[0].replace(/^(ด\.ช\.|เด็กชาย)/, '') ? 1 : 2).join(' ');
    } else if (parts[0]?.startsWith('ด.ญ.') || parts[0]?.startsWith('เด็กหญิง')) {
      title = 'ด.ญ.';
      firstName = parts[0].replace(/^(ด\.ญ\.|เด็กหญิง)/, '') || parts[1] || '';
      lastName = parts.slice(parts[0].replace(/^(ด\.ญ\.|เด็กหญิง)/, '') ? 1 : 2).join(' ');
    } else if (parts[0]?.startsWith('นาย')) {
      title = 'นาย';
      firstName = parts[0].replace(/^นาย/, '') || parts[1] || '';
      lastName = parts.slice(parts[0].replace(/^นาย/, '') ? 1 : 2).join(' ');
    } else if (parts[0]?.startsWith('นางสาว') || parts[0]?.startsWith('น.ส.')) {
      title = 'นางสาว';
      firstName = parts[0].replace(/^(นางสาว|น\.ส\.)/, '') || parts[1] || '';
      lastName = parts.slice(parts[0].replace(/^(นางสาว|น\.ส\.)/, '') ? 1 : 2).join(' ');
    }

    setEditStudentForm({
      title,
      firstName,
      lastName,
      code: stu.code || stu.studentCode || '',
      gender: stu.gender || (title === 'ด.ญ.' || title === 'นางสาว' ? 'FEMALE' : 'MALE'),
    });
    setIsEditStudentOpen(true);
    setOpenActionMenuId(null);
  };

  // บันทึกการแก้ไขข้อมูลส่วนตัวนักเรียน
  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !editingStudent) return;
    try {
      const fullName = `${editStudentForm.title} ${editStudentForm.firstName} ${editStudentForm.lastName}`.trim();
      const updated = await studentService.updateStudentPersonalInfo(selectedClass.id, editingStudent.id, {
        title: editStudentForm.title,
        firstName: editStudentForm.firstName,
        lastName: editStudentForm.lastName,
        name: fullName,
        code: editStudentForm.code,
        gender: editStudentForm.gender,
      });

      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setOriginalStudentsOrder((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setIsEditStudentOpen(false);
      setEditingStudent(null);
      setTransferSuccessNotice(`แก้ไขข้อมูลนักเรียน "${fullName}" สำเร็จ`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error updating student info:', err);
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูลนักเรียน');
    }
  };

  // ยืนยัน Soft Delete นักเรียน
  const handleConfirmDeleteStudent = async () => {
    if (!selectedClass || !deletingStudent) return;
    try {
      await studentService.delete(selectedClass.id, deletingStudent.id);
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      setOriginalStudentsOrder((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      setIsDeleteStudentOpen(false);
      setDeletingStudent(null);
      setTransferSuccessNotice(`ระงับสถานะนักเรียน "${deletingStudent.name}" และเก็บรักษาข้อมูลประวัติไว้เรียบร้อยแล้ว`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('เกิดข้อผิดพลาดในการลบนักเรียน');
    }
  };

  // สร้างนักเรียนใหม่
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName || !newStudentCode) return;

    try {
      const created = await studentService.create(selectedClass.id, {
        studentNo: newStudentNo,
        studentCode: newStudentCode.trim(),
        name: newStudentName.trim(),
        status: 'NORMAL',
      });

      setStudents((prev) => [...prev, created].sort((a, b) => a.no - b.no));
      setOriginalStudentsOrder((prev) => [...prev, created].sort((a, b) => a.no - b.no));
      setIsAddStudentOpen(false);
      setNewStudentName('');
      setNewStudentCode('');
      setNewStudentGender('MALE');
      setTransferSuccessNotice(`เพิ่มนักเรียน "${created.name}" ในห้อง ${selectedClass.name} สำเร็จ`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error creating student:', err);
      alert('เกิดข้อผิดพลาดในการเพิ่มนักเรียน');
    }
  };

  // สร้างห้องเรียนใหม่
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    try {
      const created = await classroomService.create({
        name: newClassName.trim(),
        level: newClassLevel,
        subjectCode: 'ศ23101',
        subjectName: 'ศิลปะ',
        adviser: newAdviser.trim(),
        termId: 'term-1-2569',
      });

      setAllClassrooms((prev) => [...prev, created]);
      setIsAddClassroomOpen(false);
      setNewClassName('');
      setTransferSuccessNotice(`สร้างห้องเรียน "${created.name}" (ครูที่ปรึกษา: ${created.adviser}) สำเร็จ`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error creating classroom:', err);
      alert('เกิดข้อผิดพลาดในการสร้างห้องเรียน');
    }
  };

  // บันทึกการแก้ไขห้องเรียน / กำหนดครูที่ปรึกษา
  const handleSaveEditClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;

    try {
      const updated = await classroomService.update(editingClassroom.id, {
        name: editingClassroom.name,
        adviser: editingClassroom.adviser,
      });

      setAllClassrooms((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      if (selectedClass?.id === updated.id) {
        setSelectedClass((prev) => (prev ? { ...prev, ...updated } : updated));
      }
      setIsEditClassroomOpen(false);
      setEditingClassroom(null);
      setTransferSuccessNotice(`อัปเดตข้อมูลห้องเรียน "${updated.name}" เรียบร้อยแล้ว`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error updating classroom:', err);
      alert('เกิดข้อผิดพลาดในการแก้ไขห้องเรียน');
    }
  };

  // ยืนยันการลบห้องเรียน (Soft delete)
  const handleConfirmDeleteClassroom = async () => {
    if (!deletingClassroom) return;
    try {
      await classroomService.delete(deletingClassroom.id);
      setAllClassrooms((prev) => prev.filter((c) => c.id !== deletingClassroom.id));
      setIsDeleteClassroomOpen(false);
      setDeletingClassroom(null);
      setTransferSuccessNotice(`ลบห้องเรียน "${deletingClassroom.name}" ออกจากระบบเรียบร้อยแล้ว`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error deleting classroom:', err);
      alert('เกิดข้อผิดพลาดในการลบห้องเรียน');
    }
  };

  // นำเข้ารายชื่อ Excel/SGS
  const handleBatchImport = async () => {
    if (!selectedClass) return;
    try {
      const mockBatch = [
        { no: students.length + 1, code: `45${Date.now().toString().slice(-3)}1`, name: 'ด.ช. ธนพล มณีโชติ', attendance: '8/8', score: 85, status: 'NORMAL' as const },
        { no: students.length + 2, code: `45${Date.now().toString().slice(-3)}2`, name: 'ด.ญ. นลินทิพย์ วงศ์ใหญ่', attendance: '8/8', score: 92, status: 'NORMAL' as const },
      ];
      await studentService.batchImport(selectedClass.id, mockBatch);
      await loadStudentsForClass(selectedClass.id);
      setIsImportModalOpen(false);
      setTransferSuccessNotice(`นำเข้ารายชื่อนักเรียนในห้อง ${selectedClass.name} สำเร็จ`);
      setTimeout(() => setTransferSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Import error:', err);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    }
  };

  // ย้ายห้องเรียน
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !targetRoomId || !selectedClass) return;

    const targetClass = allClassrooms.find((c) => c.id === targetRoomId);
    if (!targetClass) return;

    try {
      messagingService.executeStudentTransfer({
        studentCode: transferringStudent.code || transferringStudent.id,
        fromClassroomId: selectedClass.id,
        toClassroomId: targetClass.id,
        transferReason: transferReasonText || 'ย้ายตามคำร้องขอ',
      });

      setIsTransferModalOpen(false);
      setTransferringStudent(null);
      setTransferSuccessNotice(`ย้าย ${transferringStudent.name} ไปยังห้อง ${targetClass.name} เรียบร้อยแล้ว`);
      setTimeout(() => setTransferSuccessNotice(null), 4000);
      loadStudentsForClass(selectedClass.id);
    } catch (err) {
      console.error('Transfer error:', err);
      alert('เกิดข้อผิดพลาดในการย้ายห้องเรียน');
    }
  };

  // กรองรายชื่อนักเรียน
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          s.name.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.no.toString().includes(term)
        );
      })
      .filter((s) => {
        if (filterStatus === 'ALL') return true;
        return s.status === filterStatus;
      })
      .filter((s) => {
        if (genderFilter === 'ALL') return true;
        return s.gender === genderFilter;
      })
      .sort((a, b) => {
        if (sortOption === 'no-asc') return a.no - b.no;
        if (sortOption === 'gender-male-first') {
          if (a.gender === 'MALE' && b.gender !== 'MALE') return -1;
          if (a.gender !== 'MALE' && b.gender === 'MALE') return 1;
          return a.no - b.no;
        }
        if (sortOption === 'gender-female-first') {
          if (a.gender === 'FEMALE' && b.gender !== 'FEMALE') return -1;
          if (a.gender !== 'FEMALE' && b.gender === 'FEMALE') return 1;
          return a.no - b.no;
        }
        if (sortOption === 'score-desc') return b.score - a.score;
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'th');
        return a.no - b.no;
      });
  }, [students, searchTerm, filterStatus, genderFilter, sortOption]);

  // กรองห้องเรียน
  const filteredClassrooms = useMemo(() => {
    return allClassrooms.filter((c) => {
      if (!classroomSearchTerm) return true;
      const term = classroomSearchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.level.toLowerCase().includes(term) ||
        (c.adviser || '').toLowerCase().includes(term)
      );
    });
  }, [allClassrooms, classroomSearchTerm]);

  const totalStudentsAcrossSchool = useMemo(() => {
    return allClassrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  }, [allClassrooms]);

  const assignedAdvisersCount = useMemo(() => {
    return allClassrooms.filter((c) => c.adviser && c.adviser !== 'ยังไม่ได้กำหนด').length;
  }, [allClassrooms]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Page Hero Banner */}
      <PageHeroBanner
        title="ห้องเรียน / รายชื่อนักเรียน"
        subtitle={
          viewMode === 'CLASSROOMS_TABLE'
            ? 'การจัดการโครงสร้างห้องเรียน ครูที่ปรึกษา และบัญชีรายชื่อนักเรียน (ระบบฐานข้อมูลกลาง)'
            : `บัญชีรายชื่อนักเรียน ห้อง ${selectedClass?.name || 'ม.3/1'} (ครูที่ปรึกษา: ${selectedClass?.adviser || 'ยังไม่ได้กำหนด'})`
        }
        icon={<GraduationCap className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText={viewMode === 'CLASSROOMS_TABLE' ? `${allClassrooms.length} ห้องเรียน` : selectedClass?.name || 'ม.3/1'}
        actions={
          viewMode === 'CLASSROOMS_TABLE' ? (
            isFullAccess && (
              <button
                type="button"
                onClick={() => setIsAddClassroomOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มห้องเรียน</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToClassroomsTable}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>หน้ารวมห้องเรียน</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ เพิ่มนักเรียน</span>
              </button>
            </div>
          )
        }
      />

      {/* Transfer / Action Notice Banner */}
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

      {/* ========================================================
          TIER 1: CLASSROOMS MANAGEMENT TABLE (หน้ารวมห้องเรียน)
         ======================================================== */}
      {viewMode === 'CLASSROOMS_TABLE' && (
        <div className="space-y-6">
          {/* 3 Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">ห้องเรียนทั้งหมด</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{allClassrooms.length} ห้อง</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">นักเรียนรวมในระบบ</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalStudentsAcrossSchool} คน</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">กำหนดครูที่ปรึกษาแล้ว</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{assignedAdvisersCount} / {allClassrooms.length} ห้อง</p>
              </div>
            </div>
          </div>

          {/* Classrooms Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>ตารางการจัดการห้องเรียน</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ฐานข้อมูล Supabase
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลิกที่ปุ่ม "จัดการนักเรียน" ของแต่ละห้อง เพื่อดูและปรับปรุงรายชื่อนักเรียน
                </p>
              </div>

              {/* Classroom search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาห้องเรียน ระดับชั้น หรือครูที่ปรึกษา..."
                  value={classroomSearchTerm}
                  onChange={(e) => setClassroomSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-14 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-32">ห้องเรียน</th>
                    <th className="py-3 px-4 w-36">ระดับชั้น</th>
                    <th className="py-3 px-4">ครูที่ปรึกษาประจำห้อง</th>
                    <th className="py-3 px-4 w-28 text-center">จำนวนนักเรียน</th>
                    <th className="py-3 px-4 w-44 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClassrooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {isLoading ? 'กำลังโหลดข้อมูลห้องเรียนจาก Supabase...' : 'ไม่พบข้อมูลห้องเรียน'}
                      </td>
                    </tr>
                  ) : (
                    filteredClassrooms.map((room, idx) => (
                      <tr
                        key={room.id}
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                        onClick={() => handleDrilldownToClassroom(room)}
                      >
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs">
                            {room.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {room.level}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{room.adviser || 'ยังไม่ได้กำหนด'}</span>
                            {isFullAccess && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClassroom(room);
                                  setIsEditClassroomOpen(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                                title="แก้ไขครูที่ปรึกษา"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                            {room.studentCount || 0} คน
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDrilldownToClassroom(room)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>จัดการนักเรียน</span>
                            </button>

                            {isFullAccess && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClassroom(room);
                                    setIsEditClassroomOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                  title="แก้ไขห้องเรียน"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingClassroom(room);
                                    setIsDeleteClassroomOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="ลบห้องเรียน"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TIER 2: CLASSROOM STUDENT ROSTER (จัดการนักเรียนในห้อง)
         ======================================================== */}
      {viewMode === 'STUDENT_ROSTER' && selectedClass && (
        <div className="space-y-5">
          {/* Unsaved Reorder Alert Banner (สำคัญมาก: ป้องกันการเผลอกดสลับเลขที่) */}
          {hasUnsavedReorder && (
            <div className="sticky top-2 z-30 bg-amber-50 border-2 border-amber-300 text-amber-900 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-bounce-subtle">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-xs sm:text-sm">
                    มีการปรับเปลี่ยนลำดับเลขที่นักเรียน (ยังไม่ได้บันทึกข้อมูล)
                  </p>
                  <p className="text-[11px] text-amber-700">
                    โปรดตรวจสอบลำดับเลขที่ใหม่ จากนั้นคลิกปุ่ม "บันทึกการจัดลำดับเลขที่" เพื่ออัปเดตลงฐานข้อมูล
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCancelReorder}
                  disabled={isSavingReorder}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveReorder}
                  disabled={isSavingReorder}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-800/20 transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingReorder ? 'กำลังบันทึก...' : 'บันทึกการจัดลำดับเลขที่'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Roster Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToClassroomsTable}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                  title="กลับไปหน้ารวมห้องเรียน"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      บัญชีรายชื่อนักเรียน : {selectedClass.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedClass.adviser}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    รวม {students.length} คน • คลิกที่ปุ่มลูกศร ▲ / ▼ เพื่อสลับลำดับเลขที่นักเรียน
                  </p>
                </div>
              </div>

              {/* Action Buttons & Dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Switch Classroom Dropdown */}
                <div className="relative" ref={classDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>เปลี่ยนห้อง: {selectedClass.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isClassDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
                      <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">
                        เลือกห้องเรียนอื่น
                      </div>
                      {allClassrooms.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClass(c);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                            selectedClass.id === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-slate-400">{c.studentCount || 0} คน</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>นำเข้า Excel/SGS</span>
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ เลขที่ หรือรหัสประจำตัว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value="NORMAL">ปกติ</option>
                  <option value="AT_RISK">กลุ่มเสี่ยง</option>
                </select>

                {/* Gender filter */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="ALL">เพศทั้งหมด</option>
                  <option value="MALE">เฉพาะชาย</option>
                  <option value="FEMALE">เฉพาะหญิง</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="no-asc">เรียงตามเลขที่ (1 ➔ มาก)</option>
                  <option value="gender-male-first">ชาย ➔ หญิง</option>
                  <option value="gender-female-first">หญิง ➔ ชาย</option>
                  <option value="name-asc">เรียงตามชื่อ ก-ฮ</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-28 text-center">สลับเลขที่</th>
                    <th className="py-3 px-4 w-16 text-center">เลขที่</th>
                    <th className="py-3 px-4 w-28">รหัสนักเรียน</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4 w-24 text-center">เพศ</th>
                    <th className="py-3 px-4 w-28 text-center">สถานะ</th>
                    <th className="py-3 px-4 w-40 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {isLoading ? 'กำลังโหลดข้อมูลนักเรียน...' : 'ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu, index) => (
                      <tr key={stu.id} className="hover:bg-blue-50/20 transition-colors">
                        {/* Up / Down Controls (สลับเลขที่ ป้องกันการเผลอกดผิด) */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStudentUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                                index === 0
                                  ? 'opacity-30 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-600 active:scale-95'
                              }`}
                              title="เลื่อนขึ้น 1 ลำดับ"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStudentDown(index)}
                              disabled={index === filteredStudents.length - 1}
                              className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                                index === filteredStudents.length - 1
                                  ? 'opacity-30 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-600 active:scale-95'
                              }`}
                              title="เลื่อนลง 1 ลำดับ"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* เลขที่ */}
                        <td className="py-2.5 px-4 text-center font-extrabold text-blue-700">
                          {stu.no}
                        </td>

                        {/* รหัสนักเรียน */}
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-600">
                          {stu.code || stu.studentCode}
                        </td>

                        {/* ชื่อ - นามสกุล */}
                        <td className="py-2.5 px-4">
                          <div
                            onClick={() =>
                              onSelectStudent({
                                enrollmentId: stu.id,
                                studentNo: stu.no,
                                name: stu.name,
                                tags: [
                                  {
                                    text: stu.status === 'AT_RISK' ? 'กลุ่มเสี่ยง' : 'ปกติ',
                                    type: stu.status === 'AT_RISK' ? 'danger' : 'info',
                                  },
                                ],
                                attendanceRatio: stu.attendance || '8/8',
                                totalScore: stu.score || 80,
                              })
                            }
                            className="flex items-center gap-2.5 cursor-pointer group/name hover:text-blue-600 transition-colors"
                            title="คลิกที่ชื่อนักเรียนเพื่อดู Radar Chart 5 มิติ"
                          >
                            <img
                              src={
                                stu.gender === 'FEMALE'
                                  ? '/images/banners/student-avatar-girl.png'
                                  : '/images/banners/student-avatar.png'
                              }
                              alt={stu.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/banners/student-avatar.png';
                              }}
                            />
                            <span className="font-bold text-slate-900 group-hover/name:text-blue-600 group-hover/name:underline underline-offset-2 transition-colors">
                              {stu.name}
                            </span>
                          </div>
                        </td>

                        {/* เพศ */}
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stu.gender === 'FEMALE'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {stu.gender === 'FEMALE' ? 'หญิง' : 'ชาย'}
                          </span>
                        </td>

                        {/* สถานะ */}
                        <td className="py-2.5 px-4 text-center">
                          {stu.status === 'AT_RISK' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              <span>กลุ่มเสี่ยง</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>ปกติ</span>
                            </span>
                          )}
                        </td>

                        {/* การจัดการ (แก้ไขข้อมูลส่วนตัว, ย้ายห้อง, ลบ) */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(stu)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                              title="แก้ไขข้อมูลส่วนตัว (ชื่อ-สกุล/รหัส)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTransferringStudent(stu);
                                setTargetRoomId(allClassrooms.find((c) => c.id !== selectedClass.id)?.id || '');
                                setIsTransferModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                              title="ย้ายห้องเรียน (ซิงค์กลุ่มแชท)"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingStudent(stu);
                                setIsDeleteStudentOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="ลบออกจากห้อง (ระงับสถานะ)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: แก้ไขข้อมูลส่วนตัวนักเรียน (Admin can edit student details) */}
      {isEditStudentOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveEditStudent}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>แก้ไขข้อมูลส่วนตัวนักเรียน</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditStudentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={editStudentForm.title}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, title: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.ญ.">ด.ญ.</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.firstName}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">นามสกุล</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.lastName}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสประจำตัว (5 หลัก)</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.code}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={editStudentForm.gender}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value as any })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="MALE">ชาย</option>
                    <option value="FEMALE">หญิง</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditStudentOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: ยืนยันการลบนักเรียน (Soft Delete Preservation) */}
      {isDeleteStudentOpen && deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>ยืนยันการลบนักเรียน</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteStudentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                คุณต้องการนำนักเรียน <strong className="text-slate-900">{deletingStudent.name}</strong> (รหัส {deletingStudent.code}) ออกจากห้องเรียนนี้ใช่หรือไม่?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">🛡️ ระบบบันทึกข้อมูลแบบ Soft Delete:</p>
                <p>
                  ข้อมูลส่วนตัว คะแนนสะสม และประวัติการเข้าเรียนยังคงถูกเก็บรักษาไว้อย่างปลอดภัยในระบบจนกว่าจะมีการจำหน่ายออกจากระบบหรือลาออกอย่างเป็นทางการ
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteStudentOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">รหัสประจำตัว (5 หลัก)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 45127"
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล (พร้อมคำนำหน้า)</label>
                  <input
                    type="text"
                    required
                    placeholder="ด.ช. กฤษณะ ศรีสมบูรณ์"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="MALE">ชาย</option>
                    <option value="FEMALE">หญิง</option>
                  </select>
                </div>
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

      {/* Modal: เพิ่มห้องเรียนใหม่ */}
      {isAddClassroomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateClassroom}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">เพิ่มห้องเรียนใหม่</h3>
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
                  placeholder="เช่น ม.1/3 หรือ ม.3/5"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ระดับชั้น</label>
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none bg-white"
                >
                  <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                  <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                  <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                  <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                  <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                  <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ครูที่ปรึกษาประจำห้อง</label>
                <input
                  type="text"
                  placeholder="เช่น ครูสมชาย ใจดี"
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

      {/* Modal: แก้ไขห้องเรียน & ครูที่ปรึกษา */}
      {isEditClassroomOpen && editingClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveEditClassroom}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>แก้ไขห้องเรียน & ครูที่ปรึกษา</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditClassroomOpen(false)}
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
                  value={editingClassroom.name}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ครูที่ปรึกษาประจำห้อง</label>
                <input
                  type="text"
                  required
                  value={editingClassroom.adviser}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, adviser: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditClassroomOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: ยืนยันการลบห้องเรียน */}
      {isDeleteClassroomOpen && deletingClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>ยืนยันการลบห้องเรียน</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteClassroomOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              คุณต้องการลบห้องเรียน <strong className="text-slate-900">{deletingClassroom.name}</strong> ออกจากระบบใช่หรือไม่?
              ข้อมูลประวัติเดิมจะถูกเก็บไว้ในถังขยะ สามารถกู้คืนได้ภายใน 30 วัน
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteClassroomOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClassroom}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: นำเข้า Excel/SGS */}
      {isImportModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>นำเข้ารายชื่อนักเรียนจาก Excel / SGS ({selectedClass.name})</span>
              </h3>
              <button
                type="button"
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
                ลากไฟล์ Excel (.xlsx, .csv) มาวางที่นี่ (คลิกเพื่อทดสอบนำเข้า)
              </p>
              <p className="text-[11px] text-slate-400">
                รองรับโครงสร้างคอลัมน์ระบบ SGS สพฐ. (เลขที่, รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล)
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              💡 ระบบจะซิงค์ข้อมูลลงฐานข้อมูล Supabase และอัปเดตความเชื่อมโยงกับห้องเรียนทันที
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เริ่มการนำเข้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ย้ายห้องเรียน & ซิงค์กลุ่มแชท */}
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
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                #{transferringStudent.no}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{transferringStudent.name}</div>
                <div className="text-xs text-slate-500 font-mono">
                  รหัส {transferringStudent.code || transferringStudent.studentCode} • ห้องเดิม: {selectedClass?.name || 'ม.3/1'}
                </div>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
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
                    .filter((c) => !selectedClass || c.id !== selectedClass.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - ครูที่ปรึกษา: {c.adviser}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เหตุผลการย้ายห้องเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น ปรับแผนการเรียน หรือคำร้องขอย้ายห้องจากผู้ปกครอง"
                  value={transferReasonText}
                  onChange={(e) => setTransferReasonText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>รับประกันความคงอยู่ของข้อมูล (Data Preservation):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1">
                  <li>ซิงค์กลุ่มแชทอัตโนมัติ: ย้ายออกจากกลุ่มเดิมและเข้ากลุ่มใหม่ทันที</li>
                  <li>คะแนนและประวัติคงอยู่ 100%: คะแนนเก็บ เวลาเรียน และชิ้นงานจะติดตัวไปกับนักเรียน</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>ยืนยันการย้ายห้องเรียน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
