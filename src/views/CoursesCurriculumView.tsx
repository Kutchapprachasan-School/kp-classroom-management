import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import {
  coursesCurriculumService,
  type CourseCurriculumRecord,
  type MediaType,
} from '../services/coursesCurriculumService';

export const CoursesCurriculumView: React.FC = () => {
  const [courses, setCourses] = useState<CourseCurriculumRecord[]>(() =>
    coursesCurriculumService.getCourses()
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

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

  // Modal States
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isCopyYearModalOpen, setIsCopyYearModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [targetUnitIdForMedia, setTargetUnitIdForMedia] = useState<string>('');

  // Course Form State
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    strand: 'กลุ่มสาระการเรียนรู้ศิลปะ',
    level: 'ม.3',
    credits: 1.5,
    periodsPerWeek: 3,
    academicYear: '2569',
    term: '1',
    classroomsText: 'ม.3/1, ม.3/2',
  });

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

  // Copy Academic Year Form State
  const [copyYearForm, setCopyYearForm] = useState({
    fromYear: '2569',
    toYear: '2570',
    targetTerm: '1',
  });

  // Handlers for Course CRUD
  const handleOpenAddCourse = () => {
    setCourseForm({
      code: '',
      name: '',
      strand: 'กลุ่มสาระการเรียนรู้ศิลปะ',
      level: 'ม.3',
      credits: 1.5,
      periodsPerWeek: 3,
      academicYear: '2569',
      term: '1',
      classroomsText: 'ม.3/1, ม.3/2',
    });
    setIsAddCourseModalOpen(true);
  };

  const handleSaveAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) return;

    const classrooms = courseForm.classroomsText
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const created = coursesCurriculumService.createCourse({
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      strand: courseForm.strand,
      level: courseForm.level,
      credits: Number(courseForm.credits),
      periodsPerWeek: Number(courseForm.periodsPerWeek),
      academicYear: courseForm.academicYear,
      term: courseForm.term,
      assignedClassrooms: classrooms.length > 0 ? classrooms : ['ม.3/1'],
      units: [],
    });

    setIsAddCourseModalOpen(false);
    setSelectedCourseId(created.id);
    refreshCourses();
    showToast(`✓ เพิ่มรายวิชา ${created.code} ${created.name} เรียบร้อยแล้ว`);
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
      classroomsText: selectedCourse.assignedClassrooms.join(', '),
    });
    setIsEditCourseModalOpen(true);
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const classrooms = courseForm.classroomsText
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    coursesCurriculumService.updateCourse(selectedCourse.id, {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      strand: courseForm.strand,
      level: courseForm.level,
      credits: Number(courseForm.credits),
      periodsPerWeek: Number(courseForm.periodsPerWeek),
      academicYear: courseForm.academicYear,
      term: courseForm.term,
      assignedClassrooms: classrooms,
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

  const handleDeleteMedia = (unitId: string, mediaId: string) => {
    if (!selectedCourse) return;
    coursesCurriculumService.deleteMediaItem(selectedCourse.id, unitId, mediaId);
    refreshCourses();
    showToast(`✓ ลบสื่อการสอนเรียบร้อยแล้ว`);
  };

  // Handler for Copy Curriculum Across Years
  const handleExecuteCopyYear = (e: React.FormEvent) => {
    e.preventDefault();
    const result = coursesCurriculumService.copyCurriculumToAcademicYear(
      copyYearForm.fromYear,
      copyYearForm.toYear,
      copyYearForm.targetTerm
    );

    setIsCopyYearModalOpen(false);
    refreshCourses();
    showToast(
      `✓ คัดลอกแผนการสอนสำเร็จ! นำเข้า ${result.copiedCount} รายวิชาไปยังปีการศึกษา ${copyYearForm.toYear}`
    );
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
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              <span>รายวิชาที่รับผิดชอบ ({courses.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">ปี 2569</span>
          </div>

          <div className="space-y-2.5">
            {courses.map((course) => {
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
                    <span className="font-extrabold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {course.credits} หน่วยกิต • {course.periodsPerWeek} คาบ/สัปดาห์
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
            })}
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
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>หน่วยการเรียนรู้และสื่อประกอบการสอน ({selectedCourse.units.length} หน่วย)</span>
                <span className="text-slate-400 font-medium">สัดส่วนคะแนนรวม ปพ.5 / SGS</span>
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
                selectedCourse.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5 hover:border-slate-300 transition-all"
                  >
                    {/* Unit Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                            สัปดาห์ที่ {unit.weekStart || 1} - {unit.weekEnd || 4}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {unit.title}
                          </span>
                        </div>
                        {unit.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                            {unit.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
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

                    {/* Unit Media Items List */}
                    <div className="space-y-2">
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
                                  onClick={() => handleDeleteMedia(unit.id, media.id)}
                                  className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="ลบสื่อนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หน่วยกิต (Credits):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="4.0"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">จำนวนคาบ/สัปดาห์:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={courseForm.periodsPerWeek}
                    onChange={(e) => setCourseForm({ ...courseForm, periodsPerWeek: parseInt(e.target.value, 10) || 2 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ห้องเรียนที่สอน (คั่นด้วยจุลภาค):</label>
                <input
                  type="text"
                  placeholder="เช่น ม.3/1, ม.3/2, ม.3/8"
                  value={courseForm.classroomsText}
                  onChange={(e) => setCourseForm({ ...courseForm, classroomsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  กำหนดห้องเรียนเพื่อให้นักเรียนในห้องเหล่านี้เข้าถึงสื่อและส่งงานได้
                </span>
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">ห้องเรียนที่สอน (คั่นด้วยจุลภาค):</label>
                <input
                  type="text"
                  value={courseForm.classroomsText}
                  onChange={(e) => setCourseForm({ ...courseForm, classroomsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                />
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
                  คัดลอกแผนการสอนข้ามปีการศึกษา
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
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>สะดวก รวดเร็ว ไม่ต้องพิมพ์ใหม่ทุกปี</span>
              </span>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                ระบบจะคัดลอกโครงสร้างรายวิชา หน่วยการเรียนรู้ สัดส่วนคะแนนเต็ม และสื่อการสอนทั้งหมดไปยังปีการศึกษาใหม่ให้โดยอัตโนมัติ
              </p>
            </div>

            <form onSubmit={handleExecuteCopyYear} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คัดลอกจากปีการศึกษาเดิม:</label>
                  <select
                    value={copyYearForm.fromYear}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, fromYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="2569">ปีการศึกษา 2569</option>
                    <option value="2568">ปีการศึกษา 2568</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ไปยังปีการศึกษาใหม่:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 2570"
                    value={copyYearForm.toYear}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, toYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-indigo-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ภาคเรียนเป้าหมาย:</label>
                <select
                  value={copyYearForm.targetTerm}
                  onChange={(e) => setCopyYearForm({ ...copyYearForm, targetTerm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
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
    </div>
  );
};
