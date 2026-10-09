// src/components/timetable/AddEditTimetableSlotModal.tsx
// หน้าต่างเพิ่ม / แก้ไขรายวิชาในตารางสอน (Add / Edit Timetable Slot Modal)
// สไตล์ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// รองรับการเลือกและตรวจจับไอคอนรายวิชาอัตโนมัติจากทุกกลุ่มสาระการเรียนรู้

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import type { TimetableMatrixSlot, TimetableColorTheme } from '../../utils/timetableDateUtils';
import {
  getSubjectIcon,
  renderSubjectIconBadge,
  type SubjectIconConfig,
} from '../../config/subjectIcons';
import { SubjectIconPickerModal } from './SubjectIconPickerModal';
import {
  coursesCurriculumService,
  calculatePeriodsPerWeek,
  type CourseCurriculumRecord,
} from '../../services/coursesCurriculumService';

export interface AddEditTimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSlot: (slot: TimetableMatrixSlot) => void;
  onDeleteSlot?: (slotId: string) => void;
  initialSlot?: Partial<TimetableMatrixSlot> | null;
  dayOptions?: string[];
  maxPeriods?: number;
  matrixSlots?: TimetableMatrixSlot[];
}

const DEFAULT_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

const COLOR_THEMES: Array<{ key: TimetableColorTheme; label: string; bgClass: string }> = [
  { key: 'blue', label: 'ฟ้า', bgClass: 'bg-blue-500' },
  { key: 'green', label: 'เขียว', bgClass: 'bg-emerald-500' },
  { key: 'pink', label: 'ชมพู', bgClass: 'bg-pink-500' },
  { key: 'purple', label: 'ม่วง', bgClass: 'bg-purple-500' },
  { key: 'amber', label: 'ส้ม', bgClass: 'bg-amber-500' },
  { key: 'teal', label: 'มิ้นต์', bgClass: 'bg-teal-500' },
];

export const AddEditTimetableSlotModal: React.FC<AddEditTimetableSlotModalProps> = ({
  isOpen,
  onClose,
  onSaveSlot,
  onDeleteSlot,
  initialSlot,
  dayOptions = DEFAULT_DAYS,
  maxPeriods = 7,
  matrixSlots = [],
}) => {
  const isEditing = Boolean(initialSlot?.id && !initialSlot?.isFreePeriod);


  // Curriculum Master Catalog State
  const [catalogCourses, setCatalogCourses] = useState<CourseCurriculumRecord[]>(() =>
    coursesCurriculumService.getCourses()
  );
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<string>('');

  // Form State
  const [day, setDay] = useState<TimetableMatrixSlot['day']>('จันทร์');
  const [period, setPeriod] = useState<number>(1);
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [classroom, setClassroom] = useState<string>('ม.3/1');
  const [room, setRoom] = useState<string>('324');
  const [colorTheme, setColorTheme] = useState<TimetableColorTheme>('blue');

  // Custom Icon State
  const [selectedIcon, setSelectedIcon] = useState<SubjectIconConfig | null>(null);
  const [isManualIconSet, setIsManualIconSet] = useState<boolean>(false);
  const [isIconPickerModalOpen, setIsIconPickerModalOpen] = useState<boolean>(false);

  // Synchronize when initialSlot changes
  useEffect(() => {
    const list = coursesCurriculumService.getCourses();
    setCatalogCourses(list);

    if (initialSlot) {
      setDay(initialSlot.day || 'จันทร์');
      setPeriod(initialSlot.period || 1);
      setSubjectCode(initialSlot.subjectCode || '');
      setSubjectName(initialSlot.subjectName || '');
      setClassroom(initialSlot.room?.startsWith('ม.') ? initialSlot.room.split('•')[0].trim() : 'ม.3/1');
      setRoom(initialSlot.room?.includes('ห้อง') ? initialSlot.room.replace(/.*ห้อง\s*/, '') : '324');
      setColorTheme(initialSlot.colorTheme || 'blue');

      if (initialSlot.subjectCode) {
        const match = list.find((c) => c.code === initialSlot.subjectCode);
        if (match) {
          setSelectedCatalogCourseId(match.id);
        } else {
          setSelectedCatalogCourseId('');
        }
        const detected = getSubjectIcon(initialSlot.subjectCode, initialSlot.subjectName);
        setSelectedIcon(detected);
        setIsManualIconSet(false);
      } else {
        setSelectedCatalogCourseId('');
        setSelectedIcon(null);
        setIsManualIconSet(false);
      }
    } else {
      setDay('จันทร์');
      setPeriod(1);
      setSubjectCode('');
      setSubjectName('');
      setClassroom('ม.3/1');
      setRoom('324');
      setColorTheme('blue');
      setSelectedCatalogCourseId('');
      setSelectedIcon(null);
      setIsManualIconSet(false);
    }
  }, [initialSlot, isOpen]);

  // Auto-detect icon when teacher types, unless manually selected
  useEffect(() => {
    if (!isManualIconSet && (subjectCode || subjectName)) {
      const detected = getSubjectIcon(subjectCode, subjectName);
      setSelectedIcon(detected);
    }
  }, [subjectCode, subjectName, isManualIconSet]);

  // คำนวณการตรวจสอบโควตาตามหน่วยกิต (Credit Quota Check)
  const quotaCheck = React.useMemo(() => {
    if (!subjectCode.trim()) return null;
    return coursesCurriculumService.canAssignPeriod(
      matrixSlots,
      subjectCode.trim(),
      classroom,
      initialSlot?.id
    );
  }, [subjectCode, classroom, matrixSlots, initialSlot?.id]);

  if (!isOpen) return null;

  const currentIcon = selectedIcon || getSubjectIcon(subjectCode, subjectName);

  const selectedCourseFromCatalog = catalogCourses.find(
    (c) => c.id === selectedCatalogCourseId || c.code === subjectCode
  );

  const handleSelectCatalogCourse = (courseId: string) => {
    setSelectedCatalogCourseId(courseId);
    if (!courseId) return;
    const course = catalogCourses.find((c) => c.id === courseId);
    if (!course) return;

    setSubjectCode(course.code);
    setSubjectName(course.name);

    if (course.assignedClassrooms && course.assignedClassrooms.length > 0) {
      if (!course.assignedClassrooms.includes(classroom)) {
        setClassroom(course.assignedClassrooms[0]);
      }
    }

    const detected = getSubjectIcon(course.code, course.name);
    setSelectedIcon(detected);
    setIsManualIconSet(false);
  };


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim()) {
      alert('กรุณากรอกรหัสวิชา');
      return;
    }

    if (quotaCheck && !quotaCheck.allowed) {
      alert(quotaCheck.reason || 'วิชานี้ลงครบโควตาตามหน่วยกิตแล้ว ไม่สามารถลงเกินได้');
      return;
    }

    const slotId = initialSlot?.id || `slot-${day}-${period}-${Date.now()}`;
    const fullRoomString = `${classroom} • ห้อง ${room || '324'}`;

    const newSlot: TimetableMatrixSlot = {
      id: slotId,
      day,
      dayDate: initialSlot?.dayDate || '',
      period,
      timeRange: initialSlot?.timeRange || `คาบที่ ${period}`,
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim() || subjectCode.trim(),
      room: fullRoomString,
      colorTheme,
      isConducted: initialSlot?.isConducted || false,
      category: 'subject',
      isFreePeriod: false,
    };

    onSaveSlot(newSlot);
    onClose();
  };

  const handleDelete = () => {
    if (!initialSlot?.id) return;
    if (window.confirm(`ต้องการลบรายวิชา ${subjectCode} ในวัน${day} คาบที่ ${period} หรือไม่?`)) {
      onDeleteSlot?.(initialSlot.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans select-none">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-linear-to-r from-blue-50/70 via-white to-sky-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                {isEditing ? <BookOpen className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {isEditing ? 'แก้ไขรายวิชาในตารางสอน' : 'เพิ่มรายวิชาในตารางสอน'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  กำหนดรหัสวิชา ชื่อวิชา ห้องเรียน และไอคอนแสดงผลประจำรายวิชา
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Day & Period Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>วันสอน</span>
                </label>
                <div className="relative">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as TimetableMatrixSlot['day'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        วัน{d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>คาบที่</span>
                </label>
                <div className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        คาบที่ {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 1. Pick Subject from Catalog (Primary Flow) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>เลือกวิชาจากหลักสูตร (Master Catalog) <span className="text-rose-500">*</span></span>
                </label>
                {selectedCourseFromCatalog && (
                  <span className="text-[10px] font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    {selectedCourseFromCatalog.credits} หน่วยกิต ({calculatePeriodsPerWeek(selectedCourseFromCatalog.credits).periodsPerRoom} คาบ/ห้อง)
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  value={selectedCatalogCourseId}
                  onChange={(e) => handleSelectCatalogCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">-- เลือกรหัสวิชาที่สอนจากหลักสูตร --</option>
                  {catalogCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} : {c.name} ({c.credits} นก. • {c.assignedClassrooms.join(', ')})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  {catalogCourses.length > 0
                    ? `มี ${catalogCourses.length} รายวิชาในหลักสูตรที่ลงทะเบียนไว้`
                    : 'ยังไม่มีรายวิชาในหลักสูตร'}
                </span>
                <span className="text-blue-600 font-bold">
                  (สร้างรายวิชาได้ที่หน้าหลักสูตร/แผนการสอน)
                </span>
              </div>
            </div>

            {/* Subject Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ญ31201, ว30221"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อรายวิชา
                </label>
                <input
                  type="text"
                  placeholder="เช่น ภาษาญี่ปุ่น 1"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Classroom & Room (Constrained to Course's Assigned Classrooms) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>ชั้น / ห้องเรียน</span>
                  {selectedCourseFromCatalog && selectedCourseFromCatalog.assignedClassrooms.length > 0 && (
                    <span className="text-[10px] text-blue-600 font-bold">
                      (เฉพาะห้องที่เปิดสอน)
                    </span>
                  )}
                </label>
                {selectedCourseFromCatalog && selectedCourseFromCatalog.assignedClassrooms.length > 0 ? (
                  <div className="relative">
                    <select
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      {selectedCourseFromCatalog.assignedClassrooms.map((rm) => (
                        <option key={rm} value={rm}>
                          ห้อง {rm}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="เช่น ม.3/1"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>ห้องเรียนประจำ / ตึก</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ห้อง 324"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Period Quota & Schedule Calculation Info */}
            {selectedCourseFromCatalog && (
              <div className="p-3 rounded-2xl bg-linear-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ภาระการสอนตามหลักสูตร:</span>
                  </span>
                  <span className="text-blue-700 font-black">
                    {calculatePeriodsPerWeek(selectedCourseFromCatalog.credits).periodsPerRoom} คาบ / ห้อง ในห้อง {classroom}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  ห้องที่เปิดสอน: {selectedCourseFromCatalog.assignedClassrooms.join(', ')} • ภาระการสอนรวม {calculatePeriodsPerWeek(selectedCourseFromCatalog.credits, selectedCourseFromCatalog.assignedClassrooms.length).totalPeriodsPerWeek} คาบ/สัปดาห์
                </p>
              </div>
            )}

            {/* Quota Exceeded Warning */}
            {quotaCheck && !quotaCheck.allowed && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ไม่สามารถลงคาบเรียนนี้ได้ (เกินโควตาตามหน่วยกิต)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {quotaCheck.reason}
                </p>
              </div>
            )}

            {/* Quota Allowed Indicator */}
            {quotaCheck && quotaCheck.allowed && quotaCheck.course && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-800 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>โควตาคาบสอนห้อง {classroom}:</span>
                </span>
                <span className="font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  ลงแล้ว {quotaCheck.currentCount} / สูงสุด {quotaCheck.maxPeriods} คาบ ({quotaCheck.course.credits} หน่วยกิต)
                </span>
              </div>
            )}


            {/* Subject Icon Selector Card */}
            <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>ไอคอนประจำวิชา</span>
                  {isManualIconSet ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      เลือกเอง
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      ตรวจจับอัตโนมัติ
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setIsIconPickerModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>เลือกไอคอนอื่น</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Preview of circular icon */}
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-100/80 shadow-2xs">
                <div className="shrink-0 scale-105">
                  {renderSubjectIconBadge(currentIcon, 'md')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {currentIcon.name} ({currentIcon.symbol})
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    {currentIcon.strand}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Theme Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                โทนสีการ์ดในตาราง
              </label>
              <div className="flex items-center gap-2">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = colorTheme === theme.key;
                  return (
                    <button
                      key={theme.key}
                      type="button"
                      onClick={() => setColorTheme(theme.key)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-300/40 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${theme.bgClass}`} />
                      <span className="text-[11px]">{theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit / Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {isEditing && onDeleteSlot ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบรายวิชา</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={Boolean(quotaCheck && !quotaCheck.allowed)}
                  className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                    quotaCheck && !quotaCheck.allowed
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                  title={quotaCheck && !quotaCheck.allowed ? quotaCheck.reason : undefined}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มลงตารางสอน'}</span>
                </button>

              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal: Subject Icon Picker */}
      <SubjectIconPickerModal
        isOpen={isIconPickerModalOpen}
        selectedIconId={currentIcon.id}
        suggestedSubjectName={subjectName || subjectCode}
        onSelectIcon={(icon) => {
          setSelectedIcon(icon);
          setIsManualIconSet(true);
        }}
        onClose={() => setIsIconPickerModalOpen(false)}
      />
    </>
  );
};
