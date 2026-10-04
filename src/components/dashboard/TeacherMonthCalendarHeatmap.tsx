import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface TeacherMonthCalendarHeatmapProps {
  onActionClick?: (payload: any) => void;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAY_HEADERS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const TeacherMonthCalendarHeatmap: React.FC<
  TeacherMonthCalendarHeatmapProps
> = () => {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [monthIndex, setMonthIndex] = useState<number>(8); // กันยายน (September) by default to match image, or configurable
  const year = 2568;

  // 35 Calendar cells matching September 2568
  // Aug 31 (Sun), Sep 1 (Mon - active), Sep 2, Sep 3 (red dot), ..., Oct 4 (Sat)
  const calendarCells = [
    { num: 31, isCurrent: false },
    { num: 1, isCurrent: true, isSelected: true },
    { num: 2, isCurrent: true },
    { num: 3, isCurrent: true, dot: 'red' },
    { num: 4, isCurrent: true },
    { num: 5, isCurrent: true },
    { num: 6, isCurrent: true },
    { num: 7, isCurrent: true },
    { num: 8, isCurrent: true },
    { num: 9, isCurrent: true },
    { num: 10, isCurrent: true },
    { num: 11, isCurrent: true },
    { num: 12, isCurrent: true },
    { num: 13, isCurrent: true },
    { num: 14, isCurrent: true },
    { num: 15, isCurrent: true },
    { num: 16, isCurrent: true },
    { num: 17, isCurrent: true, dot: 'red' },
    { num: 18, isCurrent: true },
    { num: 19, isCurrent: true },
    { num: 20, isCurrent: true },
    { num: 21, isCurrent: true },
    { num: 22, isCurrent: true },
    { num: 23, isCurrent: true },
    { num: 24, isCurrent: true, dot: 'purple' },
    { num: 25, isCurrent: true },
    { num: 26, isCurrent: true },
    { num: 27, isCurrent: true },
    { num: 28, isCurrent: true },
    { num: 29, isCurrent: true },
    { num: 30, isCurrent: true },
    { num: 1, isCurrent: false },
    { num: 2, isCurrent: false },
    { num: 3, isCurrent: false },
    { num: 4, isCurrent: false },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* 1. Header: Icon + Title */}
      <div className="flex items-center gap-2 pb-2">
        <CalendarIcon className="w-5 h-5 text-[#0C6D5B]" />
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          ปฏิทินงาน & ตารางสอน
        </h2>
      </div>

      {/* 2. Month Navigator */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">
          {THAI_MONTHS[monthIndex]} {year}
        </span>
        <button
          type="button"
          onClick={() => setMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* 4. Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs">
        {calendarCells.map((c, i) => {
          const isSelected = c.isCurrent && c.num === selectedDayNum;
          return (
            <div key={i} className="flex flex-col items-center justify-center py-1">
              <button
                type="button"
                onClick={() => c.isCurrent && setSelectedDayNum(c.num)}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                  !c.isCurrent
                    ? 'text-slate-300 cursor-default'
                    : isSelected
                    ? 'bg-[#0C6D5B] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                {c.num}
              </button>
              {/* Dot indicator under day */}
              <div className="h-1.5 flex items-center justify-center mt-0.5">
                {c.dot === 'red' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
                {c.dot === 'purple' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Section: งานสำคัญวันนี้ */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">งานสำคัญวันนี้</h3>

        <div className="space-y-3 text-xs">
          {/* Item 1: ประชุมครูประจำกลุ่มสาระ */}
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
            <div>
              <div className="font-bold text-slate-800">ประชุมครูประจำกลุ่มสาระ</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>10:30 - 11:00</span>
              </div>
              <div className="text-[11px] text-slate-500">ห้องประชุมเล็ก</div>
            </div>
          </div>

          {/* Item 2: ส่งคะแนนกลางภาค (ม.3) */}
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
            <div>
              <div className="font-bold text-slate-800">ส่งคะแนนกลางภาค (ม.3)</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>15:30</span>
              </div>
              <div className="text-[11px] text-slate-500">ห้องพักครู</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Section: หมายเหตุ */}
      <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>หมายเหตุ</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          เตรียมเอกสารกิจกรรมวันภาษาอังกฤษ พรุ่งนี้ (2 ก.ย. 2568)
        </p>
      </div>
    </div>
  );
};
