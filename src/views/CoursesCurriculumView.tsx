import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked,
  Plus,
  Layers,
  Edit3,
  Trash2,
  Copy,
  FileText,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  X,
  FileSpreadsheet,
  Folder,
  UploadCloud,
  ChevronDown,
  Calendar,
  RotateCcw,
  Archive,
  Check,
} from 'lucide-react';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import {
  coursesCurriculumService,
  calculatePeriodsPerWeek,
  type CourseCurriculumRecord,
  type MediaType,
  type TrashMediaItem,
} from '../services/coursesCurriculumService';
import { classroomService } from '../services/classroomService';
import type { ClassroomRosterItem } from '../types/viewModels';

export const CoursesCurriculumView: React.FC = () => {
  const [courses, setCourses] = useState<CourseCurriculumRecord[]>(() =>
    coursesCurriculumService.getCourses()
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Supabase real classrooms state
  const [allClassrooms, setAllClassrooms] = useState<ClassroomRosterItem[]>([]);
  useEffect(() => {
    classroomService.getAll().then((rooms) => {
      setAllClassrooms(rooms);
    });
  }, []);

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Sync state on external update
  const refreshCourses = () => {
    const updated = coursesCurriculumService.getCourses();
    setCourses([...updated]);
    if (!updated.some((c) => c.id === selectedCourseId) && updated[0]) {
      setSelectedCourseId(updated[0].id);
    }
  };

  useEffect(() => {
    const handler = () => refreshCourses();
    window.addEventListener('kp-courses-curriculum-updated', handler);
    return () => window.removeEventListener('kp-courses-curriculum-updated', handler);
  }, [selectedCourseId]);

  // Trash Bin State & Sync
  const [trashItems, setTrashItems] = useState<TrashMediaItem[]>(() =>
    coursesCurriculumService.getTrashMediaItems()
  );
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{
    unitId: string;
    mediaId: string;
    title: string;
  } | null>(null);

  const refreshTrash = () => {
    setTrashItems(coursesCurriculumService.getTrashMediaItems());
  };

  useEffect(() => {
    const handler = () => refreshTrash();
    window.addEventListener('kp-curriculum-trash-updated', handler);
    return () => window.removeEventListener('kp-curriculum-trash-updated', handler);
  }, []);

  // Modal States
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isCopyYearModalOpen, setIsCopyYearModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [targetUnitIdForMedia, setTargetUnitIdForMedia] = useState<string>('');

  // Course Form State (Interactive Room Chips, No Comma Text)
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    strand: 'กลุ่มสาระการเรียนรู้ศิลปะ',
    level: 'ม.3',
    credits: 1.5,
    periodsPerWeek: 3,
    academicYear: '2569',
    term: '1',
    assignedClassrooms: ['ม.3/1', 'ม.3/2'] as string[],
  });
  const [roomFilterTab, setRoomFilterTab] = useState<string>('ALL');

  // Unit Form State
  const [unitForm, setUnitForm] = useState({
    unitNo: 1,
    title: '',
    description: '',
    sgsRef: 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1)',
    maxScore: 15,
    weekStart: 1,
    weekEnd: 4,
  });

  // Media Form State
  const [mediaForm, setMediaForm] = useState({
    title: '',
    mediaType: 'DOCUMENT' as MediaType,
    fileUrl: '',
    fileSize: '2.5 MB',
    fileType: 'PDF',
    isPublishedToStudents: true,
  });

  // Collapsible accordion state for units
  const [collapsedUnitIds, setCollapsedUnitIds] = useState<Record<string, boolean>>({});

  const toggleCollapseUnit = (unitId: string) => {
    setCollapsedUnitIds((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const handleExpandAllUnits = () => {
    setCollapsedUnitIds({});
  };

  const handleCollapseAllUnits = () => {
    if (!selectedCourse) return;
    const allCollapsed: Record<string, boolean> = {};
    selectedCourse.units.forEach((u) => {
      allCollapsed[u.id] = true;
    });
    setCollapsedUnitIds(allCollapsed);
  };

  // Term / Academic Year Filter for courses
  const [termFilter, setTermFilter] = useState<string>('ALL');

  const availableTerms = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      set.add(`${c.term}/${c.academicYear}`);
    });
    return Array.from(set).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (termFilter === 'ALL') return courses;
    return courses.filter((c) => `${c.term}/${c.academicYear}` === termFilter);
  }, [courses, termFilter]);

  // Copy Academic Year Form State
  const [copyYearForm, setCopyYearForm] = useState({
    copyScope: 'CURRENT_COURSE' as 'CURRENT_COURSE' | 'ALL_COURSES',
    fromTerm: '1',
    fromYear: '2569',
    toTerm: '1',
    toYear: '2570',
  });

  // Handlers for Room Selection Chips
  const toggleRoomSelection = (roomName: string) => {
    setCourseForm((prev) => {
      const exists = prev.assignedClassrooms.includes(roomName);
      const nextRooms = exists
        ? prev.assignedClassrooms.filter((r) => r !== roomName)
        : [...prev.assignedClassrooms, roomName];
      const { periodsPerRoom } = calculatePeriodsPerWeek(prev.credits, nextRooms.length);
      return {
        ...prev,
        assignedClassrooms: nextRooms,
        periodsPerWeek: periodsPerRoom,
      };
    });
  };

  const selectAllRoomsOfLevel = (levelPrefix: string) => {
    const targetRooms = allClassrooms
      .filter((c) => c.name.startsWith(levelPrefix) || c.level.startsWith(levelPrefix))
      .map((c) => c.name);
    if (targetRooms.length === 0) return;

    setCourseForm((prev) => {
      const allSelected = targetRooms.every((r) => prev.assignedClassrooms.includes(r));
      const nextRooms = allSelected
        ? prev.assignedClassrooms.filter((r) => !targetRooms.includes(r))
        : Array.from(new Set([...prev.assignedClassrooms, ...targetRooms]));
      const { periodsPerRoom } = calculatePeriodsPerWeek(prev.credits, nextRooms.length);
      return {
        ...prev,
        assignedClassrooms: nextRooms,
        periodsPerWeek: periodsPerRoom,
      };
    });
  };

  // Handlers for Course CRUD
  const handleOpenAddCourse = () => {
    const defaultLevel = 'ม.3';
    const defaultRooms = allClassrooms
      .filter((c) => c.name.startsWith('ม.3'))
      .map((c) => c.name);
    const initialRooms = defaultRooms.length > 0 ? defaultRooms.slice(0, 2) : ['ม.3/1', 'ม.3/2'];
    const { periodsPerRoom } = calculatePeriodsPerWeek(1.5, initialRooms.length);
    setCourseForm({
      code: '',
      name: '',
      strand: 'กลุ่มสาระการเรียนรู้ศิลปะ',
      level: defaultLevel,
      credits: 1.5,
      periodsPerWeek: periodsPerRoom,
      academicYear: '2569',
      term: '1',
      assignedClassrooms: initialRooms,
    });
    setRoomFilterTab('ม.3');
    setIsAddCourseModalOpen(true);
  };

  const handleSaveAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) return;
    if (courseForm.assignedClassrooms.length === 0) {
      alert('กรุณาเลือกห้องเรียนที่สอนอย่างน้อย 1 ห้อง');
      return;
    }

    const { periodsPerRoom } = calculatePeriodsPerWeek(
      courseForm.credits,
      courseForm.assignedClassrooms.length
    );

    const created = coursesCurriculumService.createCourse({
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      strand: courseForm.strand,
      level: courseForm.level,
      credits: Number(courseForm.credits),
      periodsPerWeek: periodsPerRoom,
      academicYear: courseForm.academicYear,
      term: courseForm.term,
      assignedClassrooms: courseForm.assignedClassrooms,
      units: [],
    });

    setIsAddCourseModalOpen(false);
    setSelectedCourseId(created.id);
    refreshCourses();
    showToast(`✓ เพิ่มรายวิชา ${created.code} ${created.name} เรียบร้อยแล้ว (ลงตารางสอนได้ทันที)`);
  };

  const handleOpenEditCourse = () => {
    if (!selectedCourse) return;
    setCourseForm({
      code: selectedCourse.code,
      name: selectedCourse.name,
      strand: selectedCourse.strand,
      level: selectedCourse.level,
      credits: selectedCourse.credits,
      periodsPerWeek: selectedCourse.periodsPerWeek,
      academicYear: selectedCourse.academicYear,
      term: selectedCourse.term,
      assignedClassrooms: [...selectedCourse.assignedClassrooms],
    });
    setRoomFilterTab(selectedCourse.level || 'ALL');
    setIsEditCourseModalOpen(true);
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (courseForm.assignedClassrooms.length === 0) {
      alert('กรุณาเลือกห้องเรียนที่สอนอย่างน้อย 1 ห้อง');
      return;
    }

    const { periodsPerRoom } = calculatePeriodsPerWeek(
      courseForm.credits,
      courseForm.assignedClassrooms.length
    );

    coursesCurriculumService.updateCourse(selectedCourse.id, {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      strand: courseForm.strand,
      level: courseForm.level,
      credits: Number(courseForm.credits),
      periodsPerWeek: periodsPerRoom,
      academicYear: courseForm.academicYear,
      term: courseForm.term,
      assignedClassrooms: courseForm.assignedClassrooms,
    });

    setIsEditCourseModalOpen(false);
    refreshCourses();
    showToast(`✓ ปรับปรุงข้อมูลรายวิชา ${courseForm.code} เรียบร้อยแล้ว`);
  };

  const handleDeleteCourse = (id: string, code: string) => {
    if (confirm(`คุณต้องการลบรายวิชา ${code} และแผนการสอนทั้งหมดใช่หรือไม่?`)) {
      coursesCurriculumService.deleteCourse(id);
      refreshCourses();
      showToast(`✓ ลบรายวิชา ${code} เรียบร้อยแล้ว`);
    }
  };

  // Handlers for Unit CRUD
  const handleOpenAddUnit = () => {
    if (!selectedCourse) return;
    const nextUnitNo = selectedCourse.units.length + 1;
    setUnitForm({
      unitNo: nextUnitNo,
      title: `หน่วยที่ ${nextUnitNo}: `,
      description: '',
      sgsRef: `คะแนนเก็บก่อนกลางภาค (หน่วยที่ ${nextUnitNo})`,
      maxScore: 15,
      weekStart: (nextUnitNo - 1) * 3 + 1,
      weekEnd: nextUnitNo * 3,
    });
    setIsAddUnitModalOpen(true);
  };

  const handleSaveAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !unitForm.title) return;

    coursesCurriculumService.addUnit(selectedCourse.id, {
      unitNo: Number(unitForm.unitNo),
      title: unitForm.title.trim(),
      description: unitForm.description.trim(),
      sgsRef: unitForm.sgsRef.trim(),
      maxScore: Number(unitForm.maxScore),
      weekStart: Number(unitForm.weekStart),
      weekEnd: Number(unitForm.weekEnd),
    });

    setIsAddUnitModalOpen(false);
    refreshCourses();
    showToast(`✓ เพิ่มหน่วยการเรียนรู้ ${unitForm.title} สำเร็จ`);
  };

  const handleDeleteUnit = (unitId: string, title: string) => {
    if (!selectedCourse) return;
    if (confirm(`คุณต้องการลบ ${title} ใช่หรือไม่?`)) {
      coursesCurriculumService.deleteUnit(selectedCourse.id, unitId);
      refreshCourses();
      showToast(`✓ ลบหน่วยการเรียนรู้เรียบร้อยแล้ว`);
    }
  };

  // Handlers for Media CRUD
  const handleOpenAddMedia = (unitId: string) => {
    setTargetUnitIdForMedia(unitId);
    setMediaForm({
      title: '',
      mediaType: 'DOCUMENT',
      fileUrl: '',
      fileSize: '2.5 MB',
      fileType: 'PDF',
      isPublishedToStudents: true,
    });
    setIsAddMediaModalOpen(true);
  };

  const handleSaveAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !targetUnitIdForMedia || !mediaForm.title) return;

    coursesCurriculumService.addMediaItem(selectedCourse.id, targetUnitIdForMedia, {
      title: mediaForm.title.trim(),
      mediaType: mediaForm.mediaType,
      fileUrl: mediaForm.fileUrl.trim() || undefined,
      fileSize: mediaForm.fileSize,
      fileType: mediaForm.fileType,
      isPublishedToStudents: mediaForm.isPublishedToStudents,
      allowedClassrooms: selectedCourse.assignedClassrooms,
    });

    setIsAddMediaModalOpen(false);
    refreshCourses();
    showToast(`✓ เพิ่มสื่อการสอน "${mediaForm.title}" ในหน่วยการเรียนรู้แล้ว`);
  };

  // Trash and Soft-Delete Media Handlers
  const handleRequestDeleteMedia = (unitId: string, mediaId: string, title: string) => {
    setMediaToDelete({ unitId, mediaId, title });
  };

  const handleConfirmDeleteMedia = () => {
    if (!selectedCourse || !mediaToDelete) return;
    const ok = coursesCurriculumService.softDeleteMediaItem(
      selectedCourse.id,
      mediaToDelete.unitId,
      mediaToDelete.mediaId
    );
    if (ok) {
      refreshCourses();
      refreshTrash();
      showToast(`✓ ย้าย "${mediaToDelete.title}" ไปไว้ในถังขยะเรียบร้อยแล้ว (กู้คืนได้ทุกเวลา)`);
    }
    setMediaToDelete(null);
  };

  const handleRestoreMedia = (trashId: string, title: string) => {
    const ok = coursesCurriculumService.restoreMediaItem(trashId);
    if (ok) {
      refreshCourses();
      refreshTrash();
      showToast(`✓ กู้คืนไฟล์ "${title}" กลับเข้าสู่หน่วยการเรียนรู้เดิมเรียบร้อยแล้ว`);
    }
  };

  const handlePermanentDeleteMedia = (trashId: string, title: string) => {
    if (confirm(`คุณต้องการลบถาวร "${title}" ใช่หรือไม่? (ไม่สามารถกู้คืนได้อีก)`)) {
      coursesCurriculumService.permanentDeleteMediaItem(trashId);
      refreshTrash();
      showToast(`✓ ลบไฟล์ออกจากถังขยะถาวรเรียบร้อยแล้ว`);
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('คุณต้องการล้างถังขยะทั้งหมดใช่หรือไม่? ไฟล์ทั้งหมดจะถูกลบถาวร')) {
      coursesCurriculumService.emptyTrash();
      refreshTrash();
      showToast('✓ ล้างถังขยะเรียบร้อยแล้ว');
    }
  };

  // Handler for Copy Curriculum Across Years / Terms
  const handleExecuteCopyYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (copyYearForm.copyScope === 'CURRENT_COURSE' && selectedCourse) {
      const cloned = coursesCurriculumService.copyCourseToNewTerm(
        selectedCourse.id,
        copyYearForm.toYear,
        copyYearForm.toTerm
      );
      setIsCopyYearModalOpen(false);
      refreshCourses();
      setSelectedCourseId(cloned.id);
      showToast(
        `✓ คัดลอกแผนการสอน ${cloned.code} ไปยังภาคเรียนที่ ${copyYearForm.toTerm}/${copyYearForm.toYear} เรียบร้อยแล้ว (แผนเดิม 100% ยังคงปลอดภัย)`
      );
    } else {
      const result = coursesCurriculumService.copyCurriculumToAcademicYear(
        copyYearForm.fromYear,
        copyYearForm.toYear,
        copyYearForm.toTerm
      );
      setIsCopyYearModalOpen(false);
      refreshCourses();
      showToast(
        `✓ คัดลอกแผนการสอนสำเร็จ! นำเข้า ${result.copiedCount} รายวิชาไปยังปีการศึกษา ${copyYearForm.toYear} (แผนเดิมยังคงอยู่ครบ 100%)`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Master PageHeroBanner (2-Line Strictly) */}
      <PageHeroBanner
        title="หลักสูตร / แผนการสอน (Curriculum & Lesson Plans)"
        subtitle="จัดการโครงสร้างรายวิชา หน่วยการเรียนรู้ สื่อการสอน และคัดลอกแผนข้ามปีการศึกษา"
        icon={<BookMarked className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="Curriculum"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTrashModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 hover:border-rose-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="ดูสื่อการสอนที่ลบไปแล้ว และกู้คืนกลับมา"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>ถังขยะสื่อ</span>
              {trashItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-extrabold">
                  {trashItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCopyYearModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="ใช้แผนการสอนและโครงสร้างคะแนนเดิมเมื่อเปลี่ยนปีการศึกษาใหม่"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>ใช้แผนเดิมข้ามปีการศึกษา</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddCourse}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มรายวิชาใหม่</span>
            </button>
          </div>
        }
      />

      {/* 2. Main Grid: Course selector (Left 4) + Selected Course Details & Units (Right 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course Cards List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 shrink-0">
              <Folder className="w-4 h-4 text-blue-600" />
              <span>รายวิชาที่สอน ({filteredCourses.length})</span>
            </h2>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">ทุกเทอม</option>
                {availableTerms.map((term) => (
                  <option key={term} value={term}>
                    เทอม {term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredCourses.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/90 text-xs text-slate-400">
                ไม่พบรายวิชาในภาคเรียนที่เลือก
              </div>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = selectedCourse?.id === course.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-sm ring-1 ring-blue-300/60'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                          {course.code}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                          {course.term}/{course.academicYear}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {course.credits} นก. • {course.periodsPerWeek} คาบ
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug mt-1">
                      {course.name}
                    </h3>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[11px] text-slate-500">
                      <span className="truncate max-w-[170px]">
                        {course.strand}
                      </span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        {course.assignedClassrooms.join(', ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Course Structure & Unit Media CRUD (8 cols) */}
        {selectedCourse ? (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
            {/* Course Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {selectedCourse.code} • ภาคเรียนที่ {selectedCourse.term}/{selectedCourse.academicYear}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ห้องที่สอน: {selectedCourse.assignedClassrooms.join(', ')}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {selectedCourse.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  นักเรียนในห้อง {selectedCourse.assignedClassrooms.join(', ')} สามารถเข้าถึงสื่อการสอนและใบงานในรายวิชานี้ได้โดยตรง
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleOpenEditCourse}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="แก้ไขข้อมูลรายวิชา"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(selectedCourse.id, selectedCourse.code)}
                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="ลบรายวิชานี้"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddUnit}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มหน่วยการเรียนรู้</span>
                </button>
              </div>
            </div>

            {/* Units & Media Accordion Cards */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span>หน่วยการเรียนรู้และสื่อประกอบการสอน ({selectedCourse.units.length} หน่วย)</span>
                  <span className="text-slate-400 font-medium hidden sm:inline">• สัดส่วนคะแนนรวม ปพ.5 / SGS</span>
                </div>
                {selectedCourse.units.length > 0 && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleExpandAllUnits}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      ขยายทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAllUnits}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      พับเก็บทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {selectedCourse.units.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">ยังไม่มีหน่วยการเรียนรู้ในรายวิชานี้</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    คลิก "+ เพิ่มหน่วยการเรียนรู้" เพื่อกำหนดสัดส่วนคะแนนและเพิ่มสื่อการสอน
                  </p>
                </div>
              ) : (
                selectedCourse.units.map((unit) => {
                  const isCollapsed = Boolean(collapsedUnitIds[unit.id]);
                  return (
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 hover:border-slate-300 transition-all"
                    >
                      {/* Unit Header with Toggle Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                        <div
                          className="flex-1 cursor-pointer select-none"
                          onClick={() => toggleCollapseUnit(unit.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapseUnit(unit.id);
                              }}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                              title={isCollapsed ? 'คลิกเพื่อขยาย' : 'คลิกเพื่อพับเก็บ'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isCollapsed ? '-rotate-90 text-slate-400' : 'text-blue-600'
                                }`}
                              />
                            </button>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                              สัปดาห์ที่ {unit.weekStart || 1} - {unit.weekEnd || 4}
                            </span>
                            <span className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors">
                              {unit.title}
                            </span>
                            {isCollapsed && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-semibold">
                                📁 {unit.mediaItems.length} ไฟล์/สื่อ
                              </span>
                            )}
                          </div>
                          {unit.description && (
                            <p className="text-xs text-slate-500 mt-1 ml-7 leading-snug">
                              {unit.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-blue-700 block">
                              {unit.maxScore} คะแนน
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {unit.sgsRef}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAddMedia(unit.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            title="เพิ่มสื่อ ใบงาน หรือแบบทดสอบ"
                          >
                            <Plus className="w-3 h-3 text-blue-600" />
                            <span>+ สื่อ/ใบงาน</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(unit.id, unit.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบหน่วยนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Unit Media Items List (Collapsible Accordion Content) */}
                      {!isCollapsed && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                          <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                            <span>สื่อการสอน ใบงาน และการสอบเก็บคะแนน ({unit.mediaItems.length} รายการ)</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              • เปิดให้นักเรียนเข้าถึง
                            </span>
                          </div>

                          {unit.mediaItems.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-100">
                              ยังไม่มีไฟล์หรือสื่อในหน่วยนี้ คลิก "+ สื่อ/ใบงาน" เพื่อเพิ่มเอกสารการสอน
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {unit.mediaItems.map((media) => (
                                <div
                                  key={media.id}
                                  className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        media.mediaType === 'EXAM_QUIZ'
                                          ? 'bg-purple-100 text-purple-700'
                                          : media.mediaType === 'WORKSHEET'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {media.mediaType === 'EXAM_QUIZ' ? (
                                        <Sparkles className="w-3.5 h-3.5" />
                                      ) : media.mediaType === 'WORKSHEET' ? (
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                      ) : (
                                        <FileText className="w-3.5 h-3.5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800 truncate">
                                          {media.title}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 uppercase">
                                          {media.fileType || media.mediaType}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {media.fileSize && <span>{media.fileSize} • </span>}
                                        <span>สร้างเมื่อ {media.createdAt}</span>
                                        {media.linkedExamId && (
                                          <span className="text-purple-600 font-semibold ml-1">
                                            • ลิงก์ระบบสอบออนไลน์
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {media.fileUrl && (
                                      <a
                                        href={media.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="เปิดดูไฟล์"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRequestDeleteMedia(unit.id, media.id, media.title)}
                                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="ย้ายสื่อนี้ไปถังขยะ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: เพิ่มรายวิชาใหม่                                           */}
      {/* ==================================================================== */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">เพิ่มรายวิชาใหม่ในหลักสูตร</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">รหัสวิชา (Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ศ23101"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ระดับชั้น:</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                    <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                    <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                    <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                    <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                    <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อรายวิชา (Name):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ศิลปะ 3 (ทัศนศิลป์)"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">กลุ่มสาระการเรียนรู้:</label>
                <select
                  value={courseForm.strand}
                  onChange={(e) => setCourseForm({ ...courseForm, strand: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="กลุ่มสาระการเรียนรู้ศิลปะ">กลุ่มสาระการเรียนรู้ศิลปะ</option>
                  <option value="กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ">กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ</option>
                  <option value="กลุ่มสาระการเรียนรู้ภาษาไทย">กลุ่มสาระการเรียนรู้ภาษาไทย</option>
                  <option value="กลุ่มสาระการเรียนรู้คณิตศาสตร์">กลุ่มสาระการเรียนรู้คณิตศาสตร์</option>
                  <option value="กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี">กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</option>
                  <option value="กลุ่มสาระการเรียนรู้สังคมศึกษาฯ">กลุ่มสาระการเรียนรู้สังคมศึกษาฯ</option>
                  <option value="กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา">กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา</option>
                  <option value="กลุ่มสาระการเรียนรู้การงานอาชีพ">กลุ่มสาระการเรียนรู้การงานอาชีพ</option>
                </select>
              </div>

              {/* Credits & Period Calculation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หน่วยกิต (Credits):</label>
                  <select
                    value={courseForm.credits}
                    onChange={(e) => {
                      const newCredits = parseFloat(e.target.value) || 1.0;
                      const { periodsPerRoom } = calculatePeriodsPerWeek(
                        newCredits,
                        courseForm.assignedClassrooms.length
                      );
                      setCourseForm({
                        ...courseForm,
                        credits: newCredits,
                        periodsPerWeek: periodsPerRoom,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="0.5">0.5 หน่วยกิต (1 คาบ/ห้อง)</option>
                    <option value="1.0">1.0 หน่วยกิต (2 คาบ/ห้อง)</option>
                    <option value="1.5">1.5 หน่วยกิต (3 คาบ/ห้อง)</option>
                    <option value="2.0">2.0 หน่วยกิต (4 คาบ/ห้อง)</option>
                    <option value="2.5">2.5 หน่วยกิต (5 คาบ/ห้อง)</option>
                    <option value="3.0">3.0 หน่วยกิต (6 คาบ/ห้อง)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คาบเรียนต่อสัปดาห์ / ห้อง:</label>
                  <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-extrabold text-blue-700 flex items-center justify-between">
                    <span>{calculatePeriodsPerWeek(courseForm.credits).periodsPerRoom} คาบ/สัปดาห์</span>
                    <span className="text-[10px] text-slate-400 font-medium">คำนวณอัตโนมัติ</span>
                  </div>
                </div>
              </div>

              {/* Real Room Selection from Supabase (Zero Comma Text) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>ห้องเรียนที่สอน (เลือกจากห้องที่เปิดจริงในระบบ):</span>
                  </label>
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    เลือกแล้ว {courseForm.assignedClassrooms.length} ห้อง
                  </span>
                </div>

                {/* Level Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {['ALL', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRoomFilterTab(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        roomFilterTab === lvl
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl === 'ALL' ? 'ทุกระดับ' : lvl}
                    </button>
                  ))}
                  {roomFilterTab !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => selectAllRoomsOfLevel(roomFilterTab)}
                      className="text-[10px] font-bold text-blue-600 hover:underline px-2 cursor-pointer ml-auto whitespace-nowrap"
                    >
                      เลือก/ยกเลิก ทั้ง {roomFilterTab}
                    </button>
                  )}
                </div>

                {/* Room Chips Grid */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                  {allClassrooms.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      กำลังโหลดรายชื่อห้องเรียนจากระบบ...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {allClassrooms
                        .filter(
                          (c) => roomFilterTab === 'ALL' || c.name.startsWith(roomFilterTab) || c.level.startsWith(roomFilterTab)
                        )
                        .map((c) => {
                          const isSelected = courseForm.assignedClassrooms.includes(c.name);
                          return (
                            <button
                              key={c.id || c.name}
                              type="button"
                              onClick={() => toggleRoomSelection(c.name)}
                              className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300/40'
                                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-blue-50/50 hover:border-blue-300'
                              }`}
                            >
                              <span>{c.name}</span>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Total Teaching Load Indicator */}
                <div className="p-2.5 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between text-xs font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>ภาระการสอนรวมทั้งหมด:</span>
                  </div>
                  <div className="text-sm font-black text-blue-700">
                    {calculatePeriodsPerWeek(courseForm.credits, courseForm.assignedClassrooms.length).totalPeriodsPerWeek} คาบ / สัปดาห์
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      ({calculatePeriodsPerWeek(courseForm.credits).periodsPerRoom} คาบ × {Math.max(1, courseForm.assignedClassrooms.length)} ห้อง)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  บันทึกรายวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: แก้ไขรายวิชา                                               */}
      {/* ==================================================================== */}
      {isEditCourseModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">แก้ไขข้อมูลรายวิชา {selectedCourse.code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCourseModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อรายวิชา:</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Credits & Period Calculation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หน่วยกิต (Credits):</label>
                  <select
                    value={courseForm.credits}
                    onChange={(e) => {
                      const newCredits = parseFloat(e.target.value) || 1.0;
                      const { periodsPerRoom } = calculatePeriodsPerWeek(
                        newCredits,
                        courseForm.assignedClassrooms.length
                      );
                      setCourseForm({
                        ...courseForm,
                        credits: newCredits,
                        periodsPerWeek: periodsPerRoom,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="0.5">0.5 หน่วยกิต (1 คาบ/ห้อง)</option>
                    <option value="1.0">1.0 หน่วยกิต (2 คาบ/ห้อง)</option>
                    <option value="1.5">1.5 หน่วยกิต (3 คาบ/ห้อง)</option>
                    <option value="2.0">2.0 หน่วยกิต (4 คาบ/ห้อง)</option>
                    <option value="2.5">2.5 หน่วยกิต (5 คาบ/ห้อง)</option>
                    <option value="3.0">3.0 หน่วยกิต (6 คาบ/ห้อง)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คาบเรียนต่อสัปดาห์ / ห้อง:</label>
                  <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-extrabold text-blue-700 flex items-center justify-between">
                    <span>{calculatePeriodsPerWeek(courseForm.credits).periodsPerRoom} คาบ/สัปดาห์</span>
                    <span className="text-[10px] text-slate-400 font-medium">คำนวณอัตโนมัติ</span>
                  </div>
                </div>
              </div>

              {/* Real Room Selection from Supabase (Zero Comma Text) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>ห้องเรียนที่สอน (เลือกจากห้องที่เปิดจริงในระบบ):</span>
                  </label>
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    เลือกแล้ว {courseForm.assignedClassrooms.length} ห้อง
                  </span>
                </div>

                {/* Level Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {['ALL', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRoomFilterTab(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        roomFilterTab === lvl
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl === 'ALL' ? 'ทุกระดับ' : lvl}
                    </button>
                  ))}
                  {roomFilterTab !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => selectAllRoomsOfLevel(roomFilterTab)}
                      className="text-[10px] font-bold text-blue-600 hover:underline px-2 cursor-pointer ml-auto whitespace-nowrap"
                    >
                      เลือก/ยกเลิก ทั้ง {roomFilterTab}
                    </button>
                  )}
                </div>

                {/* Room Chips Grid */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                  {allClassrooms.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      กำลังโหลดรายชื่อห้องเรียนจากระบบ...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {allClassrooms
                        .filter(
                          (c) => roomFilterTab === 'ALL' || c.name.startsWith(roomFilterTab) || c.level.startsWith(roomFilterTab)
                        )
                        .map((c) => {
                          const isSelected = courseForm.assignedClassrooms.includes(c.name);
                          return (
                            <button
                              key={c.id || c.name}
                              type="button"
                              onClick={() => toggleRoomSelection(c.name)}
                              className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300/40'
                                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-blue-50/50 hover:border-blue-300'
                              }`}
                            >
                              <span>{c.name}</span>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Total Teaching Load Indicator */}
                <div className="p-2.5 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between text-xs font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>ภาระการสอนรวมทั้งหมด:</span>
                  </div>
                  <div className="text-sm font-black text-blue-700">
                    {calculatePeriodsPerWeek(courseForm.credits, courseForm.assignedClassrooms.length).totalPeriodsPerWeek} คาบ / สัปดาห์
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      ({calculatePeriodsPerWeek(courseForm.credits).periodsPerRoom} คาบ × {Math.max(1, courseForm.assignedClassrooms.length)} ห้อง)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: เพิ่มหน่วยการเรียนรู้                                         */}
      {/* ==================================================================== */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">เพิ่มหน่วยการเรียนรู้ใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddUnit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อหน่วยการเรียนรู้:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หน่วยที่ 2: การจัดองค์ประกอบศิลป์"
                  value={unitForm.title}
                  onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">คำอธิบายสาระการเรียนรู้:</label>
                <textarea
                  rows={2}
                  placeholder="อธิบายเนื้อหาและจุดประสงค์การเรียนรู้ย่อๆ..."
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คอลัมน์ระบบ SGS / ปพ.5:</label>
                  <input
                    type="text"
                    required
                    value={unitForm.sgsRef}
                    onChange={(e) => setUnitForm({ ...unitForm, sgsRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">สัดส่วนคะแนนเต็ม (Max Score):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={unitForm.maxScore}
                    onChange={(e) => setUnitForm({ ...unitForm, maxScore: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-blue-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">สัปดาห์ที่เริ่มสอน:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={unitForm.weekStart}
                    onChange={(e) => setUnitForm({ ...unitForm, weekStart: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">สัปดาห์สิ้นสุด:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={unitForm.weekEnd}
                    onChange={(e) => setUnitForm({ ...unitForm, weekEnd: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  บันทึกหน่วยเรียนรู้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: เพิ่มสื่อการสอน / ใบงาน / การสอบ                            */}
      {/* ==================================================================== */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">เพิ่มสื่อการสอนหรือใบงานประจำหน่วย</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMediaModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddMedia} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ประเภทสื่อการสอน:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaForm({ ...mediaForm, mediaType: 'DOCUMENT', fileType: 'PDF' })}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      mediaForm.mediaType === 'DOCUMENT'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📄 เอกสาร/PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaForm({ ...mediaForm, mediaType: 'WORKSHEET', fileType: 'DOCX' })}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      mediaForm.mediaType === 'WORKSHEET'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📝 ใบงาน/การบ้าน
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaForm({ ...mediaForm, mediaType: 'EXAM_QUIZ', fileType: 'QUIZ' })}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      mediaForm.mediaType === 'EXAM_QUIZ'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ สอบเก็บคะแนน
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อสื่อการสอน / ชื่องาน:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สไลด์บรรยายบทที่ 1, ใบงานทัศนธาตุ"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ลิงก์ไฟล์หรือเอกสารออนไลน์ (URL):</label>
                <input
                  type="url"
                  placeholder="https://... หรือปล่อยว่างเพื่อจำลองไฟล์ในระบบ"
                  value={mediaForm.fileUrl}
                  onChange={(e) => setMediaForm({ ...mediaForm, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="publishCheck"
                  checked={mediaForm.isPublishedToStudents}
                  onChange={(e) => setMediaForm({ ...mediaForm, isPublishedToStudents: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="publishCheck" className="font-semibold text-slate-700 cursor-pointer">
                  เปิดให้นักเรียนในห้องที่สอนสามารถมองเห็นและดาวน์โหลดได้
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMediaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  เพิ่มสื่อการสอน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: ใช้แผนการสอนเดิมเมื่อเปลี่ยนปีการศึกษา (Copy Curriculum)     */}
      {/* ==================================================================== */}
      {isCopyYearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  คัดลอกแผนการสอนข้ามภาคเรียน / ปีการศึกษา
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyYearModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>สะดวก รวดเร็ว ปรับแก้เพียงเล็กน้อยได้ทันที</span>
              </span>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                คัดลอกจากเทอมเดิม (เช่น 1/2569) ไปเป็นเทอมใหม่ (เช่น 1/2570) โดยที่แผนเก่าและงานของนักเรียนรุ่นเดิมยังคงถูกเก็บรักษาไว้ 100% เพื่อให้นักเรียนกลับมาดู แก้งาน หรือส่งงานย้อนหลังได้ตลอดเวลา
              </p>
            </div>

            <form onSubmit={handleExecuteCopyYear} className="space-y-4 text-xs">
              {/* Scope Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">ขอบเขตที่ต้องการคัดลอก:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      copyYearForm.copyScope === 'CURRENT_COURSE'
                        ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="copyScope"
                      checked={copyYearForm.copyScope === 'CURRENT_COURSE'}
                      onChange={() => setCopyYearForm({ ...copyYearForm, copyScope: 'CURRENT_COURSE' })}
                      className="text-indigo-600"
                    />
                    <span className="truncate">
                      เฉพาะวิชา: {selectedCourse ? selectedCourse.code : 'วิชาที่เลือก'}
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      copyYearForm.copyScope === 'ALL_COURSES'
                        ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="copyScope"
                      checked={copyYearForm.copyScope === 'ALL_COURSES'}
                      onChange={() => setCopyYearForm({ ...copyYearForm, copyScope: 'ALL_COURSES' })}
                      className="text-indigo-600"
                    />
                    <span>ทุกรายวิชาที่สอน</span>
                  </label>
                </div>
              </div>

              {/* Source Term / Year */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คัดลอกจากภาคเรียนเดิม:</label>
                  <select
                    value={copyYearForm.fromTerm}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, fromTerm: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ปีการศึกษาเดิม:</label>
                  <select
                    value={copyYearForm.fromYear}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, fromYear: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="2569">2569</option>
                    <option value="2568">2568</option>
                  </select>
                </div>
              </div>

              {/* Target Term / Year */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-200">
                <div>
                  <label className="font-bold text-blue-900 block mb-1">ไปยังภาคเรียนเป้าหมาย:</label>
                  <select
                    value={copyYearForm.toTerm}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, toTerm: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-blue-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-blue-900 block mb-1">ปีการศึกษาเป้าหมาย:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 2570"
                    value={copyYearForm.toYear}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, toYear: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-blue-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>การันตีความปลอดภัยของข้อมูลประวัติ (Data Retention)</span>
                </div>
                <p>
                  แผนการสอนเดิมของเทอม {copyYearForm.fromTerm}/{copyYearForm.fromYear} จะไม่ถูกลบหรือเขียนทับ นักเรียนรุ่นที่เคยเรียนยังคงสามารถเข้าถึงสื่อการสอนและส่งงานย้อนหลังได้ตามปกติ
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCopyYearModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  คัดลอกโครงสร้างแผนทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: ยืนยันการลบสื่อการสอน (ย้ายไปถังขยะ)                             */}
      {/* ==================================================================== */}
      {mediaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">ย้ายสื่อการสอนไปถังขยะ?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  ไฟล์จะไม่สูญหาย และสามารถกู้คืนกลับมาได้ตลอดเวลา
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700">ชื่อไฟล์ / สื่อ:</span>
              <p className="font-extrabold text-slate-900 truncate">{mediaToDelete.title}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMediaToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMedia}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ย้ายไปถังขยะ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 7: ถังขยะสื่อการสอน (Trash / Recycle Bin Modal)                    */}
      {/* ==================================================================== */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <Archive className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    ถังขยะสื่อการสอน ({trashItems.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    รายการไฟล์และสื่อที่ถูกลบ สามารถกดกู้คืนกลับไปยังรายวิชาเดิมได้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrashModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {trashItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-400 space-y-2">
                  <Archive className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">ถังขยะว่างเปล่า</p>
                  <p>ไม่มีสื่อการสอนที่ถูกลบค้างไว้</p>
                </div>
              ) : (
                trashItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 uppercase">
                          {item.fileType || item.mediaType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span className="text-blue-600 font-semibold">{item.originalCourseCode}</span>
                        <span> • {item.originalUnitTitle}</span>
                        <span> • ลบเมื่อ {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('th-TH') : '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreMedia(item.id, item.title)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="กู้คืนไฟล์นี้กลับสู่หน่วยเดิม"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>กู้คืน</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteMedia(item.id, item.title)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold border border-slate-200 transition-colors cursor-pointer"
                        title="ลบถาวร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {trashItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ล้างถังขยะทั้งหมด</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setIsTrashModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
