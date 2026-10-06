// src/components/layout/TeacherHeader.tsx
// ส่วนหัวแถบด้านบนของหน้าครู (Header Bar) ตามภาพต้นแบบ Mockup Image 1 (Desktop) และ Image 2 (Mobile First)

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  PanelLeft,
  Check,
  Minus,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  teacherCopilotService,
  type CrossViewNavigationPayload,
  type UrgentTriageItem,
} from '../../services/teacherCopilotService';
import {
  getSchoolSettings,
  type SchoolUserRole,
} from '../../config/schoolRoles';

interface TeacherHeaderProps {
  title?: string;
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  termLabel?: string;
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
  onLogout?: () => void;
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
  onOpenSearch,
  onOpenMobileMenu,
  isSidebarOpen = true,
  onToggleSidebar,
  termLabel = 'ภาคเรียนที่ 1 / 2569',
  activeRole = 'TEACHER_GENERAL',
  onChangeRole,
  onLogout,
  onDeepNavigate,
}) => {
  const schoolSettings = getSchoolSettings();

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [urgentItems, setUrgentItems] = useState<UrgentTriageItem[]>(() =>
    teacherCopilotService.getUrgentTriageQueue()
  );
  const [bellFeedback, setBellFeedback] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickResolve = (itemId: string) => {
    const res = teacherCopilotService.resolveUrgentItem(itemId);
    setBellFeedback(res.summaryMessage);
    refreshCopilot();
    setTimeout(() => setBellFeedback(null), 3500);
  };

  // Bell Dropdown Component
  const bellDropdownContent = isBellOpen && (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <div className="text-xs font-bold text-slate-900">
            ศูนย์แจ้งเตือนและภาระงานครู
          </div>
          <div className="text-[11px] text-slate-500">
            เรียงตามความสำคัญที่ต้องดำเนินการ
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
          3 รายการ
        </span>
      </div>

      {bellFeedback && (
        <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>{bellFeedback}</span>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
        {urgentItems.slice(0, 3).map((item) => (
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
                    : 'bg-blue-600 text-white'
                }`}
              >
                {item.isResolved ? '✓ เรียบร้อย' : item.levelLabel}
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
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
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
  );

  // Profile Dropdown Content
  const profileDropdownContent = isProfileOpen && (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 space-y-2.5 text-xs text-slate-700">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-11 h-11 rounded-full overflow-hidden border border-blue-200 shrink-0 bg-blue-50">
          <img
            src="/images/teacher/teacher_avatar.png"
            alt="นายปัญจพล เกษรัตน์"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-slate-900 text-sm truncate">
            นายปัญจพล เกษรัตน์
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
            กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeRole === 'ACADEMIC_ADMIN'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {activeRole === 'ACADEMIC_ADMIN'
                ? '⭐ ผู้บริหาร / แอดมิน (Admin)'
                : 'ครูผู้สอน (Teacher)'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Switcher Option */}
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 block">
          สิทธิ์การใช้งาน (RBAC Mode)
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              onChangeRole?.('TEACHER_GENERAL');
              setIsProfileOpen(false);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer ${
              activeRole === 'TEACHER_GENERAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ครูทั่วไป
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeRole?.('ACADEMIC_ADMIN');
              setIsProfileOpen(false);
              onDeepNavigate?.({ view: 'admin-dashboard' });
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer ${
              activeRole === 'ACADEMIC_ADMIN'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ผู้บริหาร (Admin)
          </button>
        </div>
      </div>

      <div className="space-y-0.5 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setIsProfileOpen(false);
            onDeepNavigate?.({ view: 'settings' });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-500 shrink-0" />
          <span>การตั้งค่าระบบและแบนเนอร์</span>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span>ออกจากระบบ</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 select-none font-sans">
      {/* ========================================================
          1. MOBILE TOP HEADER (< 1024px) - Aligned to Reference Image 2 Screen 1
          ======================================================== */}
      <div className="flex lg:hidden items-center justify-between w-full">
        {/* Left: Mobile Sidebar Toggle + School Logo + School Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {(onToggleSidebar || onOpenMobileMenu) && (
            <button
              type="button"
              onClick={onToggleSidebar || onOpenMobileMenu}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              title="เปิดเมนูข้าง"
              aria-label="เปิดเมนูข้าง"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
            <img
              src="/images/teacher/school_logo.png"
              alt={schoolSettings.nameTh}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = schoolSettings.logoUrl;
              }}
            />
          </div>

          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight block truncate">
              {schoolSettings.nameTh}
            </span>
          </div>
        </div>

        {/* Right: Search + Bell + Profile Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            title="ค้นหา"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => {
                refreshCopilot();
                setIsBellOpen((prev) => !prev);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isBellOpen
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
              title="การแจ้งเตือน"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
                3
              </span>
            </button>
            {bellDropdownContent}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs cursor-pointer"
              title="โปรไฟล์และสลับบทบาท"
            >
              <img
                src="/images/teacher/teacher_avatar.png"
                alt="ครูปัญจพล"
                className="w-full h-full object-cover"
              />
            </button>
            {profileDropdownContent}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. DESKTOP HEADER (>= 1024px) - Exactly matching Reference Image 1
          ======================================================== */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Left: Mobile Toggle & Teacher Info exactly matching Image 1 */}
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer mr-1"
              title="สลับการแสดงผลเมนูข้าง (Ctrl+B)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Teacher Avatar & Identity Pill exactly matching Image 1 */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border-2 border-blue-100 shadow-2xs bg-blue-50 flex items-center justify-center">
              <img
                src="/images/teacher/teacher_avatar.png"
                alt="นายปัญจพล เกษรัตน์"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                }}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug truncate">
                นายปัญจพล เกษรัตน์
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                ครู | กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาญี่ปุ่น)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date & Term Box, Search Box, Font, Bell, Profile Avatar matching Image 1 */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-600 shrink-0">
          {/* 2.1 Date & Term Card matching Image 1 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-100/90 bg-blue-50/50 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800">
                วันพฤหัสบดีที่ 2 ตุลาคม 2569
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {termLabel}
              </span>
            </div>
          </div>

          {/* 2.2 Search Box matching Image 1 (rounded-full pill) */}
          <div
            onClick={onOpenSearch}
            className="relative flex items-center cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none group-hover:text-blue-600 transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="ค้นหา..."
              onClick={onOpenSearch}
              className="w-36 md:w-44 pl-9 pr-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-100/80 hover:bg-slate-100 text-xs text-slate-800 placeholder-slate-400 cursor-pointer focus:outline-hidden transition-colors"
            />
          </div>

          {/* 2.3 Font Scale Control Button (Discreet "T") */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFontDropdownOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isFontDropdownOpen
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
              }`}
              title="ปรับขนาดตัวอักษร"
              aria-label="ปรับขนาดตัวอักษร"
            >
              <span className="font-extrabold text-xs leading-none">T</span>
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
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active ? (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {opt.key === 'custom' ? `${customFontPx}px` : `${opt.px}px`}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="mt-1 pt-2 px-2.5 pb-1.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold">กำหนดเอง</span>
                    <span className="font-bold text-blue-700 tabular-nums">
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
                      className="flex-1 accent-blue-600 cursor-pointer"
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

          {/* 2.4 Notification Bell with Red Badge "3" matching Image 1 */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => {
                refreshCopilot();
                setIsBellOpen((prev) => !prev);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isBellOpen
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 hover:text-slate-900'
              }`}
              title="การแจ้งเตือนและงานด่วน"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
                3
              </span>
            </button>
            {bellDropdownContent}
          </div>

          {/* 2.5 Profile Avatar Dropdown matching Image 1 ("ครูปัญจพล" + chevron) */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                <img
                  src="/images/teacher/teacher_avatar.png"
                  alt="ครูปัญจพล"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                  }}
                />
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-slate-800">
                  ครูปัญจพล
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {profileDropdownContent}
          </div>
        </div>
      </div>
    </header>
  );
};
