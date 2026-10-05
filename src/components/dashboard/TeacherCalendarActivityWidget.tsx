// src/components/dashboard/TeacherCalendarActivityWidget.tsx
// วิดเจ็ตปฏิทินการสอน / กิจกรรม ตามภาพต้นแบบ Mockup Image 1

import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Clock,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherCalendarActivityWidgetProps {
  onNavigateToCalendar?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherCalendarActivityWidget: React.FC<
  TeacherCalendarActivityWidgetProps
> = ({ onNavigateToCalendar, onDeepNavigate }) => {
  const [selectedDay, setSelectedDay] = useState<number>(2);

  // ข้อมูลปฏิทินเดือนตุลาคม 2569 (ตรงตาม Mockup Image 1)
  const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  // ตารางวันเดือนตุลาคม 2569 (วันพฤหัสบดีที่ 1 ต.ค. 2569)
  // วันที่ 2 ตุลาคม วงกลมสีน้ำเงิน active
  const calendarCells = [
    { day: 27, currentMonth: false },
    { day: 28, currentMonth: false },
    { day: 29, currentMonth: false },
    { day: 30, currentMonth: false },
    { day: 1, currentMonth: true },
    { day: 2, currentMonth: true, isToday: true, dot: 'blue' },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true, dot: 'green' },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true },
    { day: 12, currentMonth: true },
    { day: 13, currentMonth: true },
    { day: 14, currentMonth: true, dot: 'blue' },
    { day: 15, currentMonth: true },
    { day: 16, currentMonth: true, dot: 'red' },
    { day: 17, currentMonth: true },
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
    { day: 22, currentMonth: true, dot: 'red' },
    { day: 23, currentMonth: true },
    { day: 24, currentMonth: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
  ];

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDay(day);
  };

  const handleViewAll = () => {
    if (onNavigateToCalendar) {
      onNavigateToCalendar();
      return;
    }
    onDeepNavigate?.({
      view: 'timetable',
      highlightBanner: 'ปฏิทินการสอนและกิจกรรมทั้งหมด',
    });
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
            ปฏิทินการสอน / กิจกรรม
          </h2>
        </div>
        <button
          type="button"
          onClick={handleViewAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body: Two columns (Left: Mini Month, Right: Today Summary) */}
      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Left: Mini Month Calendar (~68%) */}
        <div className="sm:col-span-8 pr-0 sm:pr-2">
          {/* Month Navigator */}
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">
              ตุลาคม 2569
            </span>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {weekdays.map((wd, i) => (
              <span
                key={wd}
                className={`text-[10px] sm:text-[11px] font-bold py-0.5 ${
                  i === 0 ? 'text-rose-500' : i === 6 ? 'text-purple-500' : 'text-slate-400'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.currentMonth && cell.day === selectedDay;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(cell.day, cell.currentMonth)}
                  disabled={!cell.currentMonth}
                  className={`relative h-6 sm:h-7 flex flex-col items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    !cell.currentMonth
                      ? 'text-slate-300 cursor-default'
                      : isSelected
                      ? 'bg-blue-600 text-white font-extrabold shadow-xs cursor-pointer'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <span className="leading-none">{cell.day}</span>
                  {cell.dot && !isSelected && (
                    <span
                      className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                        cell.dot === 'blue'
                          ? 'bg-blue-500'
                          : cell.dot === 'green'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Today Summary Panel (~32%) */}
        <div className="sm:col-span-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-3 flex flex-col justify-center space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>วันนี้</span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-600 leading-none">
                5
              </span>
              <span className="text-xs font-bold text-slate-700">คาบเรียน</span>
            </div>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>0 งานที่ต้องส่ง</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>2 การบ้าน/ใบงาน</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>3 กิจกรรม/อื่นๆ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
