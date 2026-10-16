import React, { useState, useRef, useEffect, useMemo } from 'react';
import Calendar2Regular from '@mingcute/react/core-regular/calendar-2';
import LeftSmallRegular from '@mingcute/react/core-regular/left-small';
import RightSmallRegular from '@mingcute/react/core-regular/right-small';

export interface ThaiMiniDatePickerProps {
  label?: string;
  value: string; // e.g. "15 พ.ค. 2569" or "2026-05-15"
  onChange: (thaiDate: string, isoDate: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  defaultYear?: number; // e.g. 2569
  defaultMonth?: number; // 1-12
}

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTH_SHORT_MAP: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
  'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
  'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
};

/**
 * แปลงข้อความวันที่ไทย (เช่น '15 พ.ค. 2569') เป็นข้อมูล { day, month, year, yearCe }
 */
export function parseThaiDateString(raw: string): { day: number; month: number; yearBe: number; yearCe: number } | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // กรณีเป็น ISO '2026-05-15'
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const yearCe = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return { day, month, yearBe: yearCe + 543, yearCe };
  }

  // กรณีเป็นข้อความไทย '15 พ.ค. 2569' หรือ '15 พฤษภาคม 2569'
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10) || 1;
    let month = 1;
    const mStr = parts[1];
    if (THAI_MONTH_SHORT_MAP[mStr]) {
      month = THAI_MONTH_SHORT_MAP[mStr];
    } else {
      const idx = THAI_MONTHS_FULL.indexOf(mStr);
      if (idx >= 0) month = idx + 1;
    }
    const rawYear = parseInt(parts[2], 10) || 2569;
    const yearBe = rawYear < 2400 ? rawYear + 543 : rawYear;
    const yearCe = yearBe - 543;
    return { day, month, yearBe, yearCe };
  }

  return null;
}

/**
 * ฟอร์แมตเป็นสตริงวันที่ไทยมาตรฐาน '15 พ.ค. 2569'
 */
export function formatThaiDate(day: number, month: number, yearBe: number): string {
  const mShort = THAI_MONTHS_SHORT[month - 1] || 'พ.ค.';
  return `${day} ${mShort} ${yearBe}`;
}

/**
 * ฟอร์แมตเป็น ISO Date '2026-05-15'
 */
export function formatIsoDate(day: number, month: number, yearCe: number): string {
  const dStr = String(day).padStart(2, '0');
  const mStr = String(month).padStart(2, '0');
  return `${yearCe}-${mStr}-${dStr}`;
}

export const ThaiMiniDatePicker: React.FC<ThaiMiniDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'เลือกวันที่...',
  helperText,
  required = false,
  className = '',
  defaultYear = 2569,
  defaultMonth = 5,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // แกะค่าวันที่ปัจจุบัน
  const parsedValue = useMemo(() => parseThaiDateString(value), [value]);

  // วันนี้ในระบบ พ.ศ.
  const todayInfo = useMemo(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      yearCe: now.getFullYear(),
      yearBe: now.getFullYear() + 543,
    };
  }, []);

  // สถานะมุมมองปฏิทิน (เดือน 1-12, ปี พ.ศ.)
  const [viewMonth, setViewMonth] = useState<number>(() => parsedValue?.month || defaultMonth);
  const [viewYearBe, setViewYearBe] = useState<number>(() => parsedValue?.yearBe || defaultYear);

  // ซิงค์มุมมองเมื่อค่า value เปลี่ยนจากภายนอก
  useEffect(() => {
    if (parsedValue) {
      setViewMonth(parsedValue.month);
      setViewYearBe(parsedValue.yearBe);
    }
  }, [value]);

  // ปิดปฏิทินเมื่อคลิกด้านนอก หรือกด Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewYearCe = viewYearBe - 543;

  // คำนวณวันแรกของเดือนและจำนวนวันในเดือน
  const calendarDays = useMemo(() => {
    // new Date(year, monthIndex, 1) -> 0 = Sun, 1 = Mon, ..., 6 = Sat
    const firstDayOfWeek = new Date(viewYearCe, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYearCe, viewMonth, 0).getDate();
    return { firstDayOfWeek, daysInMonth };
  }, [viewYearCe, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYearBe((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYearBe((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const thaiStr = formatThaiDate(day, viewMonth, viewYearBe);
    const isoStr = formatIsoDate(day, viewMonth, viewYearCe);
    onChange(thaiStr, isoStr);
    setIsOpen(false);
  };

  // Quick preset handlers
  const handleQuickPreset = (presetDay: number, presetMonth: number, presetYearBe: number) => {
    setViewMonth(presetMonth);
    setViewYearBe(presetYearBe);
    const thaiStr = formatThaiDate(presetDay, presetMonth, presetYearBe);
    const isoStr = formatIsoDate(presetDay, presetMonth, presetYearBe - 543);
    onChange(thaiStr, isoStr);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-slate-700 block mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input Display Button */}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label ? `${label}: ${value || placeholder}` : `เลือกวันที่: ${value || placeholder}`}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          isOpen
            ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100 shadow-2xs'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar2Regular className="w-4 h-4 text-blue-600 shrink-0" />
          <span
            className={`text-xs font-semibold truncate ${
              value ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            {value || placeholder}
          </span>
        </div>
        <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 shrink-0">
          ปฏิทิน
        </span>
      </button>

      {helperText && <p className="text-[10px] text-slate-400 mt-0.5">{helperText}</p>}

      {/* Mini Calendar Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="ปฏิทินเลือกวันที่"
          className="absolute left-0 max-sm:left-1/2 max-sm:-translate-x-1/2 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_rgba(40,90,140,0.14)] p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header: Month & Year Selector with Navigation */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <LeftSmallRegular className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-blue-500 cursor-pointer"
              >
                {THAI_MONTHS_SHORT.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Dropdown (พ.ศ.) */}
              <select
                value={viewYearBe}
                onChange={(e) => setViewYearBe(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-blue-500 cursor-pointer"
              >
                {Array.from({ length: 15 }, (_, i) => defaultYear - 4 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <RightSmallRegular className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (อา - ส) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-500">
            <div className="text-rose-500">อา</div>
            <div>จ</div>
            <div>อ</div>
            <div>พ</div>
            <div className="text-blue-600">พฤ</div>
            <div>ศ</div>
            <div>ส</div>
          </div>

          {/* Days Grid (7 Columns) */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: calendarDays.firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-7 w-full" />
            ))}

            {/* Month Days 1 to N */}
            {Array.from({ length: calendarDays.daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected =
                parsedValue &&
                parsedValue.day === day &&
                parsedValue.month === viewMonth &&
                parsedValue.yearBe === viewYearBe;
              const isToday =
                todayInfo.day === day &&
                todayInfo.month === viewMonth &&
                todayInfo.yearBe === viewYearBe;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  aria-label={`${day} ${THAI_MONTHS_FULL[viewMonth - 1]} พ.ศ. ${viewYearBe}${isSelected ? ' (เลือกอยู่)' : ''}${isToday ? ' (วันนี้)' : ''}`}
                  className={`relative h-7 w-full rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer font-semibold ${
                    isSelected
                      ? 'bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-300'
                      : isToday
                      ? 'text-blue-700 font-bold bg-blue-50/70 hover:bg-blue-100 ring-1 ring-blue-300'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Preset Buttons for Academic Terms */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 block">ทางลัดกำหนดการ:</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickPreset(15, 5, viewYearBe)}
                className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                เปิดเทอม 1 (15 พ.ค.)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(10, 10, viewYearBe)}
                className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                ปิดเทอม 1 (10 ต.ค.)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(1, 11, viewYearBe)}
                className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                เปิดเทอม 2 (1 พ.ย.)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(15, 3, viewYearBe + 1)}
                className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                ปิดเทอม 2 (15 มี.ค.)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
