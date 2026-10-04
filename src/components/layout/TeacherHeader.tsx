import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Bell,
  ChevronDown,
  Menu,
  Check,
  Minus,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import {
  teacherCopilotService,
  type CrossViewNavigationPayload,
  type UrgentTriageItem,
} from '../../services/teacherCopilotService';
import { getSchoolSettings } from '../../config/schoolRoles';

interface TeacherHeaderProps {
  title: string;
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  termLabel?: string;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
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
  onDeepNavigate,
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
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [urgentItems, setUrgentItems] = useState<UrgentTriageItem[]>(() =>
    teacherCopilotService.getUrgentTriageQueue()
  );
  const [bellFeedback, setBellFeedback] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const refreshCopilot = () => {
    setUrgentItems(teacherCopilotService.getUrgentTriageQueue());
  };

  useEffect(() => {
    const handler = () => refreshCopilot();
    window.addEventListener('kp-copilot-updated', handler);
    return () => window.removeEventListener('kp-copilot-updated', handler);
  }, []);

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
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unresolvedItems = urgentItems.filter((i) => !i.isResolved);

  const handleQuickResolve = (itemId: string) => {
    const res = teacherCopilotService.resolveUrgentItem(itemId);
    setBellFeedback(res.summaryMessage);
    refreshCopilot();
    setTimeout(() => setBellFeedback(null), 3500);
  };

  const schoolSettings = getSchoolSettings();

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20 select-none">
      {/* Left: Mobile Logo, Hamburger Menu (Mobile), Back Arrow, and Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img
          src={schoolSettings.logoUrl}
          alt={schoolSettings.nameTh}
          className="w-7 h-7 object-contain rounded-lg lg:hidden shrink-0 shadow-2xs"
        />

        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden px-2.5 py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold"
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
        <div className="flex flex-col min-w-0">
          <h1 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight truncate">
            {title}
          </h1>
          <span className="text-[11px] text-slate-500 font-medium truncate hidden sm:inline">
            ครูปัญจพล เกษรัตน์ | กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ
          </span>
        </div>
      </div>

      {/* Right Actions matching Image 1 */}
      <div className="flex items-center gap-2 sm:gap-3 text-slate-600 shrink-0">
        {/* 1. Term Selector Dropdown matching Image 1 */}
        <div className="hidden sm:flex items-center text-xs">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#0C6D5B]" />
            <span className="truncate">{termLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* 2. Quick Search Box matching Image 1 */}
        <div
          onClick={onOpenSearch}
          className="relative hidden md:flex items-center cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none group-hover:text-slate-600 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="ค้นหา..."
            onClick={onOpenSearch}
            className="w-36 lg:w-44 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 text-xs text-slate-800 placeholder-slate-400 cursor-pointer focus:outline-hidden transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
          title="ค้นหา"
        >
          <Search className="w-3.5 h-3.5 text-[#0C6D5B]" />
        </button>

        {/* 3. Compact Font Size Button - Just "T" placed beside Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsFontDropdownOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isFontDropdownOpen
                ? 'bg-[#0C6D5B] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 hover:text-slate-900'
            }`}
            title="ปรับขนาดตัวอักษร"
            aria-label="ปรับขนาดตัวอักษร"
          >
            <span className="font-extrabold text-sm leading-none font-serif">T</span>
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
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
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
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
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    title="เพิ่มขนาด"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Interactive Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => {
              refreshCopilot();
              setIsBellOpen((prev) => !prev);
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer relative ${
              isBellOpen
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:text-slate-900'
            }`}
            title="ศูนย์งานด่วนของครู"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="w-4 h-4 text-[#0C6D5B]" />
            {unresolvedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
                {unresolvedItems.length}
              </span>
            )}
          </button>

          {isBellOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    ศูนย์จัดการงานด่วนของครู (1-Click Triage)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เรียงตามความสำคัญที่ต้องรีบทำตอนนี้
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                  ค้าง {unresolvedItems.length} งาน
                </span>
              </div>

              {bellFeedback && (
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{bellFeedback}</span>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
                {urgentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      item.isResolved
                        ? 'bg-slate-50/70 border-slate-200/70 text-slate-400'
                        : item.level === 'CRITICAL'
                        ? 'bg-rose-50/50 border-rose-200 text-slate-800'
                        : item.level === 'URGENT'
                        ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isResolved
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : item.level === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : item.level === 'URGENT'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {item.isResolved ? '✓ เรียบร้อยแล้ว' : item.levelLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {item.timeTag}
                      </span>
                    </div>

                    <div
                      className={`font-bold ${
                        item.isResolved ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {item.isResolved ? item.resolvedMessage : item.subtitle}
                    </div>

                    {!item.isResolved && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickResolve(item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {item.quickActionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsBellOpen(false);
                            onDeepNavigate?.(item.targetPayload);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{item.navigateLabel}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. User Profile Avatar Dropdown matching Image 1 */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
              alt="ครูปัญจพล เกษรัตน์"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:flex flex-col text-left leading-none">
            <span className="text-xs font-bold text-slate-900">
              ปัญจพล เกษรัตน์
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">ครู</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
};

