import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Bell,
  ChevronDown,
  Menu,
  Type,
  Check,
  Minus,
  Plus,
} from 'lucide-react';

interface TeacherHeaderProps {
  title: string;
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  termLabel?: string;
}

type FontScaleMode = 'small' | 'normal' | 'large' | 'xlarge' | 'custom';

const FONT_SCALE_OPTIONS: {
  key: FontScaleMode;
  label: string;
  shortLabel: string;
  px: number;
}[] = [
  { key: 'small', label: 'ก- เล็ก (กระชับ)', shortLabel: 'ก- เล็ก', px: 14.5 },
  { key: 'normal', label: 'ก ปกติ (มาตรฐาน)', shortLabel: 'ก ปกติ', px: 16 },
  { key: 'large', label: 'ก+ ใหญ่ (สบายตา)', shortLabel: 'ก+ ใหญ่', px: 18 },
  { key: 'xlarge', label: 'ก++ ใหญ่พิเศษ', shortLabel: 'ก++ ใหญ่พิเศษ', px: 20 },
  { key: 'custom', label: 'ตั้งค่าขนาดเอง...', shortLabel: 'ตั้งค่าเอง', px: 17 },
];

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
      if (saved && ['small', 'normal', 'large', 'xlarge', 'custom'].includes(saved)) {
        return saved;
      }
    }
    return 'large';
  });

  const [customFontPx, setCustomFontPx] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedPx = Number(window.localStorage.getItem('kp_teacher_custom_font_px'));
      if (!Number.isNaN(savedPx) && savedPx >= 13 && savedPx <= 22) {
        return savedPx;
      }
    }
    return 17.5;
  });

  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-scale', fontScale);

    if (fontScale === 'custom') {
      root.style.fontSize = `${customFontPx}px`;
    } else {
      root.style.removeProperty('font-size');
    }

    try {
      window.localStorage.setItem('kp_teacher_font_scale', fontScale);
      window.localStorage.setItem('kp_teacher_custom_font_px', String(customFontPx));
    } catch {
      // ignore storage errors
    }
  }, [fontScale, customFontPx]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption =
    FONT_SCALE_OPTIONS.find((o) => o.key === fontScale) || FONT_SCALE_OPTIONS[2];

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
            title="ย้อนกลับ"
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
        {/* Compact Font Size Dropdown (5 Options + Custom Slider saved to localStorage) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsFontDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-bold transition-colors"
            title="ปรับขนาดตัวอักษร"
          >
            <Type className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>
              {fontScale === 'custom'
                ? `ขนาด ${customFontPx}px`
                : currentOption.shortLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          </button>

          {isFontDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">
                ขนาดตัวอักษร (บันทึกอัตโนมัติ)
              </div>

              {FONT_SCALE_OPTIONS.map((opt) => {
                const active = fontScale === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setFontScale(opt.key);
                      if (opt.key !== 'custom') {
                        setIsFontDropdownOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      active
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active ? (
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    ) : (
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {opt.key === 'custom' ? `${customFontPx}px` : `${opt.px}px`}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom Font Size Controls */}
              <div className="mt-1 pt-2 px-2.5 pb-1.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">กำหนดเอง</span>
                  <span className="font-bold text-teal-700 tabular-nums">
                    {customFontPx} px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFontScale('custom');
                      setCustomFontPx((p) => Math.max(13, Number((p - 0.5).toFixed(1))));
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title="ลดขนาด"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min={13}
                    max={22}
                    step={0.5}
                    value={customFontPx}
                    onChange={(e) => {
                      setFontScale('custom');
                      setCustomFontPx(Number(e.target.value));
                    }}
                    className="flex-1 accent-teal-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFontScale('custom');
                      setCustomFontPx((p) => Math.min(22, Number((p + 0.5).toFixed(1))));
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title="เพิ่มขนาด"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          title="ค้นหาชื่อนักเรียน หรือ รายวิชา"
        >
          <Search className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">ค้นหา</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="แจ้งเตือน"
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
