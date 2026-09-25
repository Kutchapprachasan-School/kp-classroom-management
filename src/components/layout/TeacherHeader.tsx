import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Bell,
  ChevronDown,
  Menu,
  Type,
} from 'lucide-react';

interface TeacherHeaderProps {
  title: string;
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  termLabel?: string;
}

type FontScaleMode = 'normal' | 'large' | 'xlarge';

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  title,
  onBack,
  onOpenSearch,
  onOpenMobileMenu,
  termLabel = 'ภาคเรียนที่ 1/2569',
}) => {
  const [fontScale, setFontScale] = useState<FontScaleMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kp_teacher_font_scale') as FontScaleMode | null;
      return saved || 'large';
    }
    return 'large';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    try {
      window.localStorage.setItem('kp_teacher_font_scale', fontScale);
    } catch {
      // ignore storage errors
    }
  }, [fontScale]);

  const cycleFontScale = () => {
    setFontScale((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20 select-none">
      {/* Left: Hamburger Menu (Mobile), Back Arrow, and Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden px-2.5 py-1.5 -ml-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold"
            aria-label="เปิดเมนูหลัก"
          >
            <Menu className="w-4 h-4" />
            <span>เมนู</span>
          </button>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 -ml-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
            title="ย้อนกลับหน้าก่อนหน้า"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ย้อนกลับ</span>
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-600 shrink-0">
        {/* Senior Teacher Font Size Switcher (ก ปกติ / ก+ ตัวใหญ่ / ก++ ใหญ่พิเศษ) */}
        <div className="flex items-center bg-teal-50/80 border border-teal-200 rounded-xl p-0.5">
          <button
            onClick={() => setFontScale('normal')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
              fontScale === 'normal'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-800 hover:bg-teal-100/70'
            }`}
            title="ขนาดตัวอักษรปกติ"
          >
            ก ปกติ
          </button>
          <button
            onClick={() => setFontScale('large')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              fontScale === 'large'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-800 hover:bg-teal-100/70'
            }`}
            title="ขนาดตัวอักษรใหญ่ สบายตา (แนะนำสำหรับครู)"
          >
            ก+ ตัวใหญ่
          </button>
          <button
            onClick={() => setFontScale('xlarge')}
            className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              fontScale === 'xlarge'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-800 hover:bg-teal-100/70'
            }`}
            title="ขนาดตัวอักษรใหญ่พิเศษ"
          >
            ก++ ใหญ่พิเศษ
          </button>
          <button
            onClick={cycleFontScale}
            className="sm:hidden px-2 py-1 rounded-lg text-xs font-bold text-teal-800"
            title="สลับขนาดตัวอักษร"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Search Button (Plain Thai without ⌘K jargon) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          title="ค้นหาชื่อนักเรียน หรือ รายวิชา"
        >
          <Search className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">ค้นหาชื่อนักเรียน / วิชา</span>
          <span className="md:hidden">ค้นหา</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="แจ้งเตือนใบลาและงานค้าง"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
            6
          </span>
        </div>

        {/* Term Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs">
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold transition-colors">
            <span className="truncate">{termLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
