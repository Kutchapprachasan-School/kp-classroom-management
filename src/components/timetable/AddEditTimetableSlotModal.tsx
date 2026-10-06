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
} from 'lucide-react';
import type { TimetableMatrixSlot, TimetableColorTheme } from '../../utils/timetableDateUtils';
import {
  getSubjectIcon,
  renderSubjectIconBadge,
  type SubjectIconConfig,
} from '../../config/subjectIcons';
import { SubjectIconPickerModal } from './SubjectIconPickerModal';

export interface AddEditTimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSlot: (slot: TimetableMatrixSlot) => void;
  onDeleteSlot?: (slotId: string) => void;
  initialSlot?: Partial<TimetableMatrixSlot> | null;
  dayOptions?: string[];
  maxPeriods?: number;
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
}) => {
  const isEditing = Boolean(initialSlot?.id && !initialSlot?.isFreePeriod);

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
    if (initialSlot) {
      setDay(initialSlot.day || 'จันทร์');
      setPeriod(initialSlot.period || 1);
      setSubjectCode(initialSlot.subjectCode || '');
      setSubjectName(initialSlot.subjectName || '');
      setClassroom(initialSlot.room?.startsWith('ม.') ? initialSlot.room : 'ม.3/1');
      setRoom(initialSlot.room?.includes('ห้อง') ? initialSlot.room.replace(/.*ห้อง\s*/, '') : '324');
      setColorTheme(initialSlot.colorTheme || 'blue');

      if (initialSlot.subjectCode) {
        const detected = getSubjectIcon(initialSlot.subjectCode, initialSlot.subjectName);
        setSelectedIcon(detected);
        setIsManualIconSet(false);
      } else {
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

  if (!isOpen) return null;

  const currentIcon = selectedIcon || getSubjectIcon(subjectCode, subjectName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim()) {
      alert('กรุณากรอกรหัสวิชา');
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

            {/* Subject Code & Name */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ญ31201, ว30221, ค21101, ท21101"
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
                  placeholder="เช่น ภาษาญี่ปุ่น 1, เคมี 1, ฟิสิกส์ 2, ดนตรีปฏิบัติ"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Classroom & Room */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชั้น / ห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ม.3/1"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
