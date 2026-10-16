// src/views/ClassroomManagementView.tsx
// หน้าจัดการห้องเรียน (Classroom Management View)
// ออกแบบตาม Master Design System: Pastel Anime Education Dashboard
// รองรับ: การแยกสีสายชั้น (ม.1 - ม.6), ดึงรายชื่อครูที่ปรึกษาจาก Supabase User table จริง
// รองรับ: ครูที่ปรึกษาสูงสุด 3 คน (หลัก, ร่วม 1, ร่วม 2), ส่งออก CSV และนำเข้า CSV พร้อมระบบตรวจสอบ Fuzzy Match

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Building,
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  Sparkles,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { classroomService, type TeacherAccountItem } from '../services/classroomService';
import { studentService } from '../services/studentService';
import type { ClassroomRosterItem } from '../types/viewModels';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import {
  getGradeLevelTheme,
  GRADE_LEVEL_LIST,
  GRADE_LEVEL_THEMES,
} from '../utils/gradeLevelTheme';
import {
  matchTeacherWithDatabase,
  normalizeWhitespace,
  type TeacherMatchResult,
} from '../utils/fuzzyNameMatcher';

interface ClassroomManagementViewProps {
  onManageStudents: (classroom: ClassroomRosterItem) => void;
  activeRole?: SchoolUserRole;
}

export interface ImportPreviewRow {
  roomName: string;
  level: string;
  adv1: string;
  adv1Match: TeacherMatchResult;
  adv2: string;
  adv2Match: TeacherMatchResult;
  adv3: string;
  adv3Match: TeacherMatchResult;
  isExisting: boolean;
}

export const ClassroomManagementView: React.FC<ClassroomManagementViewProps> = ({
  onManageStudents,
  activeRole = 'TEACHER_GENERAL',
}) => {
  const [classrooms, setClassrooms] = useState<ClassroomRosterItem[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<TeacherAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeTab, setSelectedGradeTab] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeClassroom, setActiveClassroom] = useState<ClassroomRosterItem | null>(null);

  // Form states (Up to 3 Homeroom Advisors)
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('ม.1');
  const [formAdviser, setFormAdviser] = useState('');
  const [formCoAdviser, setFormCoAdviser] = useState('');
  const [formThirdAdviser, setFormThirdAdviser] = useState('');
  const [formTeacherSearch, setFormTeacherSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [importRawText, setImportRawText] = useState('');
  const [importPreviewRows, setImportPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFullAccess =
    activeRole === 'ACADEMIC_ADMIN' ||
    activeRole === 'STUDENT_AFFAIRS' ||
    (activeRole as string) === 'ADMIN' ||
    (activeRole as string) === 'DIRECTOR';

  // Load classrooms and real teacher accounts
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clsList, teachers] = await Promise.all([
        classroomService.getAll(),
        classroomService.getTeacherAccounts(),
      ]);
      setClassrooms(clsList);
      setTeacherAccounts(teachers);
    } catch (err) {
      console.error('Error loading classroom data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to obtain actual enrolled student count for a room
  const getRoomStudentCount = (room: ClassroomRosterItem): number => {
    try {
      const byId = studentService.getStudents(room.id);
      if (byId && byId.length > 0) return byId.length;
      const byName = studentService.getStudents(room.name);
      if (byName && byName.length > 0) return byName.length;
    } catch {
      // ignore
    }
    return room.studentCount || 0;
  };

  useEffect(() => {
    loadData();
    const handleStudentsUpdated = () => {
      loadData();
    };
    window.addEventListener('kps-students-updated', handleStudentsUpdated);
    window.addEventListener('kps-data-sync-event', handleStudentsUpdated);
    window.addEventListener('storage', handleStudentsUpdated);
    return () => {
      window.removeEventListener('kps-students-updated', handleStudentsUpdated);
      window.removeEventListener('kps-data-sync-event', handleStudentsUpdated);
      window.removeEventListener('storage', handleStudentsUpdated);
    };
  }, []);

  // Filtered teacher accounts for select dropdown
  const filteredTeacherAccounts = useMemo(() => {
    if (!formTeacherSearch.trim()) return teacherAccounts;
    const q = formTeacherSearch.toLowerCase();
    return teacherAccounts.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subjectGroup && t.subjectGroup.toLowerCase().includes(q)) ||
        (t.position && t.position.toLowerCase().includes(q))
    );
  }, [teacherAccounts, formTeacherSearch]);

  // Statistics
  const totalStudents = useMemo(() => {
    return classrooms.reduce((acc, c) => acc + getRoomStudentCount(c), 0);
  }, [classrooms]);

  const assignedAdvisersCount = useMemo(() => {
    return classrooms.filter(
      (c) => c.adviser && c.adviser !== 'ยังไม่ได้กำหนด' && c.adviser.trim() !== ''
    ).length;
  }, [classrooms]);

  // Count per grade level
  const gradeLevelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    GRADE_LEVEL_LIST.forEach((g) => {
      counts[g] = classrooms.filter((c) => {
        const theme = getGradeLevelTheme(c.name || c.level);
        return theme.levelKey === g;
      }).length;
    });
    return counts;
  }, [classrooms]);

  // Filtered Classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      // Grade tab filter
      if (selectedGradeTab !== 'ALL') {
        const theme = getGradeLevelTheme(c.name || c.level);
        if (theme.levelKey !== selectedGradeTab) return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLevel = c.level.toLowerCase().includes(q);
        const matchesAdviser1 = (c.adviser || '').toLowerCase().includes(q);
        const matchesAdviser2 = (c.coAdviser || '').toLowerCase().includes(q);
        const matchesAdviser3 = (c.thirdAdviser || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLevel && !matchesAdviser1 && !matchesAdviser2 && !matchesAdviser3) return false;
      }
      return true;
    });
  }, [classrooms, selectedGradeTab, searchTerm]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormLevel(selectedGradeTab !== 'ALL' ? selectedGradeTab : 'ม.1');
    setFormAdviser(teacherAccounts[0]?.name || 'ยังไม่ได้กำหนด');
    setFormCoAdviser('');
    setFormThirdAdviser('');
    setFormTeacherSearch('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (room: ClassroomRosterItem) => {
    setActiveClassroom(room);
    setFormName(room.name);
    setFormLevel(room.level || getGradeLevelTheme(room.name).shortLabel);
    setFormAdviser(room.adviser || '');
    setFormCoAdviser(room.coAdviser || '');
    setFormThirdAdviser(room.thirdAdviser || '');
    setFormTeacherSearch('');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (room: ClassroomRosterItem) => {
    setActiveClassroom(room);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Classroom
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('กรุณาระบุชื่อห้องเรียน เช่น ม.1/4');
      return;
    }
    setIsSubmitting(true);
    try {
      await classroomService.create({
        name: formName.trim(),
        level: formLevel,
        adviser: formAdviser.trim() || 'ยังไม่ได้กำหนด',
        coAdviser: formCoAdviser.trim() || undefined,
        thirdAdviser: formThirdAdviser.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setToastMessage(`เพิ่มห้องเรียน ${formName} เรียบร้อยแล้ว`);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการสร้างห้องเรียน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Classroom
  const handleUpdateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassroom) return;
    if (!formName.trim()) {
      setFormError('กรุณาระบุชื่อห้องเรียน');
      return;
    }
    setIsSubmitting(true);
    try {
      await classroomService.update(activeClassroom.id, {
        name: formName.trim(),
        level: formLevel,
        adviser: formAdviser.trim() || 'ยังไม่ได้กำหนด',
        coAdviser: formCoAdviser.trim() || undefined,
        thirdAdviser: formThirdAdviser.trim() || undefined,
      });
      setIsEditModalOpen(false);
      setToastMessage(`แก้ไขข้อมูลห้องเรียน ${formName} สำเร็จ`);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Classroom
  const handleDeleteClassroom = async () => {
    if (!activeClassroom) return;
    setIsSubmitting(true);
    try {
      await classroomService.delete(activeClassroom.id);
      setIsDeleteModalOpen(false);
      setToastMessage(`ลบห้องเรียน ${activeClassroom.name} เรียบร้อยแล้ว`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบห้องเรียน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV with UTF-8 BOM
  const handleExportCsv = () => {
    const headers = [
      'ห้องเรียน',
      'ระดับชั้น',
      'ครูที่ปรึกษาคนที่ 1 (หลัก)',
      'ครูที่ปรึกษาคนที่ 2 (ร่วม)',
      'ครูที่ปรึกษาคนที่ 3 (ร่วม)',
      'จำนวนนักเรียน',
    ];

    const rows = classrooms.map((c) => [
      `"${c.name || ''}"`,
      `"${c.level || ''}"`,
      `"${c.adviser || ''}"`,
      `"${c.coAdviser || ''}"`,
      `"${c.thirdAdviser || ''}"`,
      getRoomStudentCount(c),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายชื่อห้องเรียนและครูที่ปรึกษา_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('✓ ส่งออกไฟล์ CSV รายชื่อห้องและครูที่ปรึกษาเรียบร้อยแล้ว');
  };

  // Parse CSV for Import with Fuzzy Match
  const handleParseCsvText = (text: string) => {
    setImportRawText(text);
    if (!text.trim()) {
      setImportPreviewRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: ImportPreviewRow[] = [];

    // Check if line 1 is header
    const firstLineLower = lines[0].toLowerCase();
    const startIndex =
      firstLineLower.includes('ห้อง') ||
      firstLineLower.includes('ระดับ') ||
      firstLineLower.includes('room') ||
      firstLineLower.includes('class')
        ? 1
        : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[,;\t]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length === 0 || !parts[0]) continue;

      const roomName = normalizeWhitespace(parts[0]);
      if (!roomName) continue;

      // Extract grade level e.g. ม.1/3 -> ม.1
      let level = 'ม.1';
      const levelMatch = roomName.match(/ม\.?\s*(\d+)/);
      if (levelMatch) {
        level = `ม.${levelMatch[1]}`;
      } else if (parts[1] && parts[1].startsWith('ม.')) {
        level = parts[1];
      }

      let adv1 = '';
      let adv2 = '';
      let adv3 = '';

      if (parts[1] && (parts[1].startsWith('ม.') || parts[1].includes('ชั้น'))) {
        adv1 = parts[2] || '';
        adv2 = parts[3] || '';
        adv3 = parts[4] || '';
      } else {
        adv1 = parts[1] || '';
        adv2 = parts[2] || '';
        adv3 = parts[3] || '';
      }

      const adv1Match = matchTeacherWithDatabase(adv1, teacherAccounts);
      const adv2Match = matchTeacherWithDatabase(adv2, teacherAccounts);
      const adv3Match = matchTeacherWithDatabase(adv3, teacherAccounts);

      const isExisting = classrooms.some(
        (c) => normalizeWhitespace(c.name) === roomName || normalizeWhitespace(c.id) === roomName
      );

      parsed.push({
        roomName,
        level,
        adv1,
        adv1Match,
        adv2,
        adv2Match,
        adv3,
        adv3Match,
        isExisting,
      });
    }

    setImportPreviewRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) handleParseCsvText(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    if (importPreviewRows.length === 0) return;
    setIsImporting(true);
    try {
      const itemsToUpsert = importPreviewRows.map((r) => {
        // Use matched teacher name if available, otherwise raw input
        const finalAdv1 = r.adv1Match.matchedTeacher?.name || r.adv1.trim() || 'ยังไม่ได้กำหนด';
        const finalAdv2 = r.adv2Match.matchedTeacher?.name || r.adv2.trim() || undefined;
        const finalAdv3 = r.adv3Match.matchedTeacher?.name || r.adv3.trim() || undefined;

        return {
          name: r.roomName,
          level: r.level,
          adviser: finalAdv1,
          coAdviser: finalAdv2,
          thirdAdviser: finalAdv3,
        };
      });

      await classroomService.upsertClassrooms(itemsToUpsert);
      setIsImportModalOpen(false);
      setToastMessage(
        `✓ นำเข้าข้อมูลสำเร็จ ${importPreviewRows.length} ห้องเรียน (อัปเดตห้องเดิมและเพิ่มห้องใหม่เรียบร้อย)`
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header Hero Banner */}
      <PageHeroBanner
        title="จัดการห้องเรียน"
        subtitle="โครงสร้างชั้นเรียน ระดับสายชั้น และกำหนดครูที่ปรึกษาประจำห้อง สูงสุด 3 คน (ระบบฐานข้อมูลกลาง)"
        icon={<Building className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText={`${classrooms.length} ห้องเรียน`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="ส่งออกรายชื่อห้องเรียนและครูที่ปรึกษาเป็นไฟล์ CSV"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>ส่งออก CSV</span>
            </button>

            {isFullAccess && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(true);
                    setImportRawText('');
                    setImportPreviewRows([]);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  title="นำเข้ารายชื่อห้องเรียนและครูที่ปรึกษา พร้อมตรวจสอบชื่อในฐานข้อมูล"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>นำเข้า CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มห้องเรียน</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Toast Alert */}
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

      {/* 2. 3 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">ห้องเรียนทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{classrooms.length} ห้อง</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">นักเรียนรวมในระบบ</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalStudents} คน</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">กำหนดครูที่ปรึกษาแล้ว</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {assignedAdvisersCount} / {classrooms.length} ห้อง
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grade Level Color Tabs (สายชั้น ม.1 - ม.6) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedGradeTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              selectedGradeTab === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด ({classrooms.length})
          </button>

          {GRADE_LEVEL_LIST.map((grade) => {
            const theme = GRADE_LEVEL_THEMES[grade];
            const isSelected = selectedGradeTab === grade;
            const count = gradeLevelCounts[grade] || 0;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGradeTab(grade)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? theme.activeTabClass
                    : `${theme.pillBg} ${theme.pillText} ${theme.pillBorder} ${theme.hoverTabClass}`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dotColor}`} />
                <span>{grade}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : `${theme.chipBg} ${theme.chipText}`
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Classrooms Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>ตารางการจัดการห้องเรียน</span>
              {selectedGradeTab !== 'ALL' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${GRADE_LEVEL_THEMES[selectedGradeTab]?.pillBg} ${GRADE_LEVEL_THEMES[selectedGradeTab]?.pillText} ${GRADE_LEVEL_THEMES[selectedGradeTab]?.pillBorder}`}
                >
                  สายชั้น {selectedGradeTab}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่ปุ่ม <strong className="text-blue-600">"จัดการนักเรียน"</strong> เพื่อเปิดหน้ารายชื่อนักเรียนในห้องนั้น
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาห้องเรียน ระดับชั้น ครูที่ปรึกษา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-32">ห้องเรียน</th>
                <th className="py-3 px-4 w-40">ระดับชั้น</th>
                <th className="py-3 px-4">ครูที่ปรึกษาประจำห้อง</th>
                <th className="py-3 px-4 w-28 text-center">จำนวนนักเรียน</th>
                <th className="py-3 px-4 w-52 text-right">การจัดการ</th>
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
                filteredClassrooms.map((room, idx) => {
                  const theme = getGradeLevelTheme(room.name || room.level);
                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-medium">
                        {idx + 1}
                      </td>

                      {/* 2. ห้องเรียน (Color coded by grade) */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold text-xs shadow-2xs ${theme.pillBg} ${theme.pillText} ${theme.pillBorder}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
                          <span>{room.name}</span>
                        </span>
                      </td>

                      {/* 3. ระดับชั้น */}
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${theme.chipBg} ${theme.chipText}`}
                        >
                          {theme.label}
                        </span>
                      </td>

                      {/* 4. ครูที่ปรึกษา (สูงสุด 3 คน) */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            {/* ครูที่ปรึกษาคนที่ 1 (หลัก) */}
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                หลัก
                              </span>
                              <span
                                className={
                                  room.adviser && room.adviser !== 'ยังไม่ได้กำหนด'
                                    ? 'text-slate-800 font-semibold'
                                    : 'text-slate-400 italic'
                                }
                              >
                                {room.adviser || 'ยังไม่ได้กำหนด'}
                              </span>
                            </div>

                            {/* ครูที่ปรึกษาคนที่ 2 (ร่วม) */}
                            {room.coAdviser && room.coAdviser !== 'ยังไม่ได้กำหนด' && room.coAdviser.trim() !== '' && (
                              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  ร่วม 1
                                </span>
                                <span>{room.coAdviser}</span>
                              </div>
                            )}

                            {/* ครูที่ปรึกษาคนที่ 3 (ร่วม) */}
                            {room.thirdAdviser && room.thirdAdviser !== 'ยังไม่ได้กำหนด' && room.thirdAdviser.trim() !== '' && (
                              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  ร่วม 2
                                </span>
                                <span>{room.thirdAdviser}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. จำนวนนักเรียน */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {getRoomStudentCount(room)} คน
                        </span>
                      </td>

                      {/* 6. การจัดการ */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* ปุ่ม จัดการนักเรียน (Primary Action) */}
                          <button
                            type="button"
                            onClick={() => onManageStudents(room)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 whitespace-nowrap"
                            title={`จัดการรายชื่อนักเรียนห้อง ${room.name}`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>จัดการนักเรียน</span>
                          </button>

                          {isFullAccess && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(room)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                title="แก้ไขข้อมูลห้องเรียนและครูที่ปรึกษา"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(room)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="ลบห้องเรียน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (No horizontal scrolling on phones) */}
        <div className="md:hidden p-4 space-y-3 bg-slate-50/50">
          {filteredClassrooms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              {isLoading ? 'กำลังโหลดข้อมูลห้องเรียน...' : 'ไม่พบข้อมูลห้องเรียน'}
            </div>
          ) : (
            filteredClassrooms.map((room) => {
              const theme = getGradeLevelTheme(room.name || room.level);
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
                >
                  {/* Card Header: Room Name + Level Tag + Student Count */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-extrabold text-sm shadow-2xs ${theme.pillBg} ${theme.pillText} ${theme.pillBorder}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.dotColor}`} />
                      <span>{room.name}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${theme.chipBg} ${theme.chipText}`}
                      >
                        {theme.shortLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {getRoomStudentCount(room)} คน
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Advisors (Up to 3) */}
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex-1 truncate">
                        <span className="text-slate-400 text-[11px]">ที่ปรึกษาหลัก: </span>
                        <span className="font-semibold text-slate-800">
                          {room.adviser || 'ยังไม่ได้กำหนด'}
                        </span>
                      </div>
                    </div>
                    {room.coAdviser && room.coAdviser !== 'ยังไม่ได้กำหนด' && room.coAdviser.trim() !== '' && (
                      <div className="flex items-center gap-2 pl-6 text-[11px] text-slate-600">
                        <span className="text-slate-400">ร่วม 1: </span>
                        <span className="font-medium text-slate-700">{room.coAdviser}</span>
                      </div>
                    )}
                    {room.thirdAdviser && room.thirdAdviser !== 'ยังไม่ได้กำหนด' && room.thirdAdviser.trim() !== '' && (
                      <div className="flex items-center gap-2 pl-6 text-[11px] text-slate-600">
                        <span className="text-slate-400">ร่วม 2: </span>
                        <span className="font-medium text-slate-700">{room.thirdAdviser}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Primary Button (min-height 44px) + Admin Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onManageStudents(room)}
                      className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      title={`จัดการรายชื่อนักเรียนห้อง ${room.name}`}
                    >
                      <Users className="w-4 h-4" />
                      <span>จัดการนักเรียน</span>
                    </button>

                    {isFullAccess && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(room)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="แก้ไขห้องเรียน"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(room)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="ลบห้องเรียน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: ADD CLASSROOM (เพิ่มห้องเรียน - รองรับ 3 ครูที่ปรึกษา)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">เพิ่มห้องเรียนใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClassroom} className="space-y-4 text-xs">
              {formName.trim().length > 0 && classroomService.isClassroomDeleted(formName.trim()) && (
                <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      ⚠️ ห้องเรียน <strong>"{formName.trim()}"</strong> เคยถูกลบและอยู่ในถังขยะ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await classroomService.restore(formName.trim());
                        setIsAddModalOpen(false);
                        setToastMessage(`กู้คืนห้องเรียน ${formName.trim()} กลับสู่ระบบเรียบร้อยแล้ว`);
                        await loadData();
                      } catch (err: any) {
                        setFormError(err.message || 'ไม่สามารถกู้คืนได้');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>กู้คืนห้องเรียนนี้ทันที</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ชื่อห้องเรียน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ม.1/4, ม.3/2, ม.6/1"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ระดับชั้น</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  >
                    {GRADE_LEVEL_LIST.map((g) => (
                      <option key={g} value={g}>
                        {GRADE_LEVEL_THEMES[g]?.label || g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ค้นหาครู */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ค้นหาบัญชีครู (ดึงจากฐานข้อมูลจริง)
                </label>
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อครู หรือกลุ่มสาระเพื่อกรองตัวเลือก..."
                  value={formTeacherSearch}
                  onChange={(e) => setFormTeacherSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ครูที่ปรึกษาคนที่ 1 (หลัก) */}
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-1">
                <label className="block text-slate-800 font-bold">
                  ครูที่ปรึกษาคนที่ 1 (หลัก) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formAdviser}
                  onChange={(e) => setFormAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="ยังไม่ได้กำหนด">-- ยังไม่ได้กำหนดครูที่ปรึกษา --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : t.position ? `(${t.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ครูที่ปรึกษาคนที่ 2 (ร่วม) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-slate-700 font-bold">
                  ครูที่ปรึกษาคนที่ 2 (ร่วม) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <select
                  value={formCoAdviser}
                  onChange={(e) => setFormCoAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- ไม่มีครูที่ปรึกษาร่วมคนที่ 2 --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ครูที่ปรึกษาคนที่ 3 (ร่วม) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-slate-700 font-bold">
                  ครูที่ปรึกษาคนที่ 3 (ร่วม) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <select
                  value={formThirdAdviser}
                  onChange={(e) => setFormThirdAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- ไม่มีครูที่ปรึกษาร่วมคนที่ 3 --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกห้องเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT CLASSROOM (แก้ไขห้องเรียน - รองรับ 3 ครูที่ปรึกษา)
         ======================================================== */}
      {isEditModalOpen && activeClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  แก้ไขข้อมูลห้องเรียน {activeClassroom.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateClassroom} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ชื่อห้องเรียน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ระดับชั้น</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  >
                    {GRADE_LEVEL_LIST.map((g) => (
                      <option key={g} value={g}>
                        {GRADE_LEVEL_THEMES[g]?.label || g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ค้นหาครู */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ค้นหาบัญชีครู (ดึงจากฐานข้อมูลจริง)
                </label>
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อครู หรือกลุ่มสาระเพื่อกรองตัวเลือก..."
                  value={formTeacherSearch}
                  onChange={(e) => setFormTeacherSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ครูที่ปรึกษาคนที่ 1 (หลัก) */}
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-1">
                <label className="block text-slate-800 font-bold">
                  ครูที่ปรึกษาคนที่ 1 (หลัก) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formAdviser}
                  onChange={(e) => setFormAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="ยังไม่ได้กำหนด">-- ยังไม่ได้กำหนดครูที่ปรึกษา --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : t.position ? `(${t.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ครูที่ปรึกษาคนที่ 2 (ร่วม) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-slate-700 font-bold">
                  ครูที่ปรึกษาคนที่ 2 (ร่วม) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <select
                  value={formCoAdviser}
                  onChange={(e) => setFormCoAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- ไม่มีครูที่ปรึกษาร่วมคนที่ 2 --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ครูที่ปรึกษาคนที่ 3 (ร่วม) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-slate-700 font-bold">
                  ครูที่ปรึกษาคนที่ 3 (ร่วม) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <select
                  value={formThirdAdviser}
                  onChange={(e) => setFormThirdAdviser(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- ไม่มีครูที่ปรึกษาร่วมคนที่ 3 --</option>
                  {filteredTeacherAccounts.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: IMPORT CSV WITH FUZZY NAME VERIFICATION
         ======================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-4xl w-full p-6 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    นำเข้ารายชื่อห้องเรียนและครูที่ปรึกษา (CSV / ข้อความ)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ระบบจะตรวจสอบชื่อครูกับฐานข้อมูลอัตโนมัติ (แก้ไขเว้นวรรคและจับคู่ชื่อใกล้เคียง) • หากห้องมีอยู่แล้วจะเปลี่ยนเฉพาะครูที่ปรึกษาโดยไม่สร้างห้องซ้ำ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Controls: File upload or paste text */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700">
                  วางข้อความ CSV หรืออัปโหลดไฟล์ (.csv, .txt):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เลือกไฟล์จากเครื่อง...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sample =
                        'ห้องเรียน,ระดับชั้น,ครูที่ปรึกษา 1,ครูที่ปรึกษา 2,ครูที่ปรึกษา 3\n' +
                        'ม.1/1,ม.1,นายภาสภูมิ เรืองปราชญ์,นางวิภาดา จิตดี,\n' +
                        'ม.1/2,ม.1,ครูสมชาย  สุขใจ,นางสาวรัตนา สว่างศรี,\n' +
                        'ม.3/1,ม.3,นายปัญจพล กาญจนโภคิน,นายภาสภูมิ เรืองปราชญ์,\n' +
                        'ม.3/2,ม.3,นายธนากรณ์ โสภณ,,,';
                      handleParseCsvText(sample);
                    }}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    โหลดตัวอย่าง
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={importRawText}
                onChange={(e) => handleParseCsvText(e.target.value)}
                placeholder="รูปแบบ: ห้องเรียน, ระดับชั้น, ครูที่ปรึกษาคนที่ 1, ครูที่ปรึกษาคนที่ 2, ครูที่ปรึกษาคนที่ 3&#10;ตัวอย่าง:&#10;ม.1/1, ม.1, นายภาสภูมิ เรืองปราชญ์, นางสมศรี เจริญดี,&#10;ม.1/2, ม.1, นายวิชัย บุญมา,,"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Verification Preview Table */}
            {importPreviewRows.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>ตารางตรวจสอบก่อนนำเข้า ({importPreviewRows.length} รายการ)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    * สีเขียว = ตรงฐานข้อมูล • สีส้ม = ชื่อใกล้เคียงแนะนำ • สีฟ้า = ห้องใหม่
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3 w-24">ห้องเรียน</th>
                        <th className="py-2 px-3">ที่ปรึกษา 1 (หลัก)</th>
                        <th className="py-2 px-3">ที่ปรึกษา 2 (ร่วม)</th>
                        <th className="py-2 px-3">ที่ปรึกษา 3 (ร่วม)</th>
                        <th className="py-2 px-3 w-28 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewRows.map((row, idx) => {
                        const renderMatchBadge = (m: TeacherMatchResult, raw: string) => {
                          if (!raw || raw.trim() === '-' || raw === 'ยังไม่ได้กำหนด') {
                            return <span className="text-slate-400 italic text-[11px]">-</span>;
                          }
                          if (m.matchType === 'EXACT') {
                            return (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-800">{m.matchedTeacher?.name || raw}</span>
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ ตรง
                                </span>
                              </div>
                            );
                          }
                          if (m.matchType === 'FUZZY_SUGGESTED' && m.matchedTeacher) {
                            return (
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-amber-800">{m.matchedTeacher.name}</span>
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    แนะนำ
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400">เดิม: "{raw}"</div>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <span className="text-slate-700">{raw}</span>
                              <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                                ไม่พบ
                              </span>
                            </div>
                          );
                        };

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {row.roomName}
                            </td>
                            <td className="py-2 px-3">
                              {renderMatchBadge(row.adv1Match, row.adv1)}
                            </td>
                            <td className="py-2 px-3">
                              {renderMatchBadge(row.adv2Match, row.adv2)}
                            </td>
                            <td className="py-2 px-3">
                              {renderMatchBadge(row.adv3Match, row.adv3)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.isExisting ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  อัปเดตห้องเดิม
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  + เพิ่มห้องใหม่
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {importPreviewRows.length > 0 && (
                  <span>
                    พร้อมนำเข้า: <strong>{importPreviewRows.length}</strong> ห้อง (
                    {importPreviewRows.filter((r) => r.isExisting).length} อัปเดต,{' '}
                    {importPreviewRows.filter((r) => !r.isExisting).length} สร้างใหม่)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={importPreviewRows.length === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังนำเข้า...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ยืนยันนำเข้าข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DELETE CLASSROOM (ยืนยันการลบห้องเรียน)
         ======================================================== */}
      {isDeleteModalOpen && activeClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบห้องเรียน {activeClassroom.name}?
              </h3>
              <p className="text-xs text-slate-500">
                ระบบจะลบห้องเรียนนี้และย้ายไปยังถังขยะ และป้องกันไม่ให้ห้องเรียนนี้คืนค่ากลับมา
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteClassroom}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบห้องเรียน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
