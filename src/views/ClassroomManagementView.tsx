// src/views/ClassroomManagementView.tsx
// หน้าจัดการห้องเรียน (Classroom Management View)
// ออกแบบตาม Master Design System: Pastel Anime Education Dashboard
// รองรับ: การแยกสีสายชั้น (ม.1 - ม.6), ดึงรายชื่อครูที่ปรึกษาจาก Supabase User table จริง

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { classroomService, type TeacherAccountItem } from '../services/classroomService';
import type { ClassroomRosterItem } from '../types/viewModels';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import {
  getGradeLevelTheme,
  GRADE_LEVEL_LIST,
  GRADE_LEVEL_THEMES,
} from '../utils/gradeLevelTheme';

interface ClassroomManagementViewProps {
  onManageStudents: (classroom: ClassroomRosterItem) => void;
  activeRole?: SchoolUserRole;
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
  const [activeClassroom, setActiveClassroom] = useState<ClassroomRosterItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('ม.1');
  const [formAdviser, setFormAdviser] = useState('');
  const [formTeacherSearch, setFormTeacherSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    loadData();
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
    return classrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0);
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
        const matchesAdviser = (c.adviser || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLevel && !matchesAdviser) return false;
      }
      return true;
    });
  }, [classrooms, selectedGradeTab, searchTerm]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormLevel(selectedGradeTab !== 'ALL' ? selectedGradeTab : 'ม.1');
    setFormAdviser(teacherAccounts[0]?.name || 'ยังไม่ได้กำหนด');
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
      setToastMessage(`ลบห้องเรียน ${activeClassroom.name} และย้ายไปยังถังขยะเรียบร้อย`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบห้องเรียน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header Hero Banner */}
      <PageHeroBanner
        title="จัดการห้องเรียน"
        subtitle="โครงสร้างชั้นเรียน ระดับสายชั้น และกำหนดครูที่ปรึกษาประจำห้อง (ระบบฐานข้อมูลกลาง)"
        icon={<Building className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText={`${classrooms.length} ห้องเรียน`}
        actions={
          isFullAccess && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มห้องเรียน</span>
            </button>
          )
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

        {/* Table Content */}
        <div className="overflow-x-auto">
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

                      {/* 4. ครูที่ปรึกษา */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              room.adviser && room.adviser !== 'ยังไม่ได้กำหนด'
                                ? 'text-slate-800 font-medium'
                                : 'text-slate-400 italic'
                            }
                          >
                            {room.adviser || 'ยังไม่ได้กำหนด'}
                          </span>
                          {isFullAccess && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(room)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity cursor-pointer"
                              title="แก้ไขครูที่ปรึกษา"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 5. จำนวนนักเรียน */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {room.studentCount || 0} คน
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
                                title="แก้ไขห้องเรียน"
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
      </div>

      {/* ========================================================
          MODAL: ADD CLASSROOM (เพิ่มห้องเรียน)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
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

              {/* Adviser dropdown from real accounts */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ครูที่ปรึกษาประจำห้อง (ดึงจากบัญชีครูจริง)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อครู หรือกลุ่มสาระ..."
                    value={formTeacherSearch}
                    onChange={(e) => setFormTeacherSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={formAdviser}
                    onChange={(e) => setFormAdviser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold cursor-pointer max-h-40"
                  >
                    <option value="ยังไม่ได้กำหนด">-- ยังไม่ได้กำหนดครูที่ปรึกษา --</option>
                    {filteredTeacherAccounts.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : t.position ? `(${t.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * ดึงข้อมูลตรงจากฐานข้อมูลบุคลากรของโรงเรียนกุดจับประชาสรรค์
                </p>
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
          MODAL: EDIT CLASSROOM (แก้ไขห้องเรียน)
         ======================================================== */}
      {isEditModalOpen && activeClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลห้องเรียน</h3>
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ครูที่ปรึกษาประจำห้อง (ดึงจากบัญชีครูจริง)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อครู หรือกลุ่มสาระ..."
                    value={formTeacherSearch}
                    onChange={(e) => setFormTeacherSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={formAdviser}
                    onChange={(e) => setFormAdviser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  >
                    <option value="ยังไม่ได้กำหนด">-- ยังไม่ได้กำหนดครูที่ปรึกษา --</option>
                    {filteredTeacherAccounts.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.subjectGroup ? `(${t.subjectGroup})` : t.position ? `(${t.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
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
                ระบบจะย้ายห้องเรียนนี้ไปยังถังขยะ สามารถกู้คืนได้ภายใน 30 วัน
                และข้อมูลนักเรียนจะยังคงปลอดภัยในระบบ
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
