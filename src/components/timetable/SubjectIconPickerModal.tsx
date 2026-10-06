// src/components/timetable/SubjectIconPickerModal.tsx
// หน้าต่างเลือกไอคอนรายวิชา (Subject Icon Picker Modal)
// สไตล์ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// รองรับครบทุกกลุ่มสาระการเรียนรู้ และรายวิชาเฉพาะทาง (ฟิสิกส์, เคมี, ชีวะ, ญี่ปุ่น, จีน, เกาหลี ฯลฯ)

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  ALL_SUBJECT_ICONS,
  type SubjectIconConfig,
  renderSubjectIconBadge,
} from '../../config/subjectIcons';

export interface SubjectIconPickerModalProps {
  isOpen: boolean;
  selectedIconId?: string;
  onSelectIcon: (icon: SubjectIconConfig) => void;
  onClose: () => void;
  suggestedSubjectName?: string;
}

const STRAND_CATEGORIES = [
  'ทั้งหมด',
  'ภาษาต่างประเทศ',
  'วิทยาศาสตร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'ภาษาไทย',
  'สังคมศึกษา',
  'ศิลปะ',
  'สุขศึกษาและพลศึกษา',
  'การงานอาชีพ',
  'กิจกรรมพัฒนาผู้เรียน',
];

export const SubjectIconPickerModal: React.FC<SubjectIconPickerModalProps> = ({
  isOpen,
  selectedIconId,
  onSelectIcon,
  onClose,
  suggestedSubjectName,
}) => {
  const [selectedStrand, setSelectedStrand] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIcon, setActiveIcon] = useState<SubjectIconConfig>(() => {
    return (
      ALL_SUBJECT_ICONS.find((i) => i.id === selectedIconId) ||
      ALL_SUBJECT_ICONS[0]
    );
  });

  // Filtered icons
  const filteredIcons = useMemo(() => {
    return ALL_SUBJECT_ICONS.filter((icon) => {
      const matchStrand =
        selectedStrand === 'ทั้งหมด' ||
        icon.strand.includes(selectedStrand) ||
        (selectedStrand === 'วิทยาศาสตร์และเทคโนโลยี' &&
          (icon.strand.includes('วิทยาศาสตร์') || icon.strand.includes('เทคโนโลยี')));

      const matchSearch =
        !searchQuery ||
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStrand && matchSearch;
    });
  }, [selectedStrand, searchQuery]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectIcon(activeIcon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-linear-to-r from-blue-50/60 via-white to-sky-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                เลือกไอคอนหน้ารายวิชา (Subject Icon Library)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                เลือกไอคอนวงกลมที่ตรงกับกลุ่มสาระและรายวิชา เพื่อแสดงในตารางสอนและระบบจัดการเรียนรู้
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

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 sm:px-6 border-b border-slate-100 space-y-3 bg-slate-50/50">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อวิชา เช่น ฟิสิกส์, เคมี, ญี่ปุ่น, จีน, คณิต, คอมพิวเตอร์..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Strand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STRAND_CATEGORIES.map((cat) => {
              const isActive = selectedStrand === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedStrand(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Icon Live Preview Card */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="shrink-0 scale-110">
                {renderSubjectIconBadge(activeIcon, 'lg')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 truncate">
                    {activeIcon.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-blue-700 border border-blue-200 shrink-0">
                    {activeIcon.strand}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {activeIcon.description || `กลุ่มสาระ ${activeIcon.strand}`}
                </p>
              </div>
            </div>

            {suggestedSubjectName && (
              <div className="hidden sm:block text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  สำหรับรายวิชา
                </span>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[140px] block">
                  {suggestedSubjectName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 max-h-[380px]">
          {filteredIcons.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">ไม่พบไอคอนที่ตรงกับคำค้นหา "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStrand('ทั้งหมด');
                }}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                ดูไอคอนทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredIcons.map((icon) => {
                const isSelected = activeIcon.id === icon.id;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setActiveIcon(icon)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400/40 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Circular Icon */}
                    <div className="group-hover:scale-105 transition-transform">
                      {renderSubjectIconBadge(icon, 'md')}
                    </div>

                    {/* Name & Strand */}
                    <div className="text-center w-full min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {icon.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {icon.strand}
                      </div>
                    </div>

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span>ไอคอนที่เลือก:</span>
            <span className="font-bold text-slate-800">{activeIcon.name}</span>
            <span className="text-[11px] text-slate-400">({activeIcon.symbol})</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>✓ ใช้ไอคอนนี้</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
