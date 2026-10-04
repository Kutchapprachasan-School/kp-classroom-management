import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
} from 'lucide-react';
import type { DailyTodoItem } from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherCalendarMobileViewProps {
  todos: DailyTodoItem[];
  onSelectTask: (task: DailyTodoItem) => void;
  onActionClick?: (payload: CrossViewNavigationPayload) => void;
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

const WEEKDAY_HEADERS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const TeacherCalendarMobileView: React.FC<TeacherCalendarMobileViewProps> = ({
  todos,
  onSelectTask,
}) => {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(14);
  const [monthIndex, setMonthIndex] = useState<number>(4); // พฤษภาคม 2569 by default matching mockup Screen 3
  const year = 2569;

  // 35 Calendar cells matching Screen 3 (May 2569)
  const calendarCells = [
    { num: 30, isCurrent: false },
    { num: 1, isCurrent: true },
    { num: 2, isCurrent: true },
    { num: 3, isCurrent: true },
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
    { num: 14, isCurrent: true, isSelected: true },
    { num: 15, isCurrent: true, dot: 'red' },
    { num: 16, isCurrent: true },
    { num: 17, isCurrent: true },
    { num: 18, isCurrent: true },
    { num: 19, isCurrent: true },
    { num: 20, isCurrent: true },
    { num: 21, isCurrent: true },
    { num: 22, isCurrent: true },
    { num: 23, isCurrent: true },
    { num: 24, isCurrent: true },
    { num: 25, isCurrent: true },
    { num: 26, isCurrent: true },
    { num: 27, isCurrent: true },
    { num: 28, isCurrent: true },
    { num: 29, isCurrent: true },
    { num: 30, isCurrent: true, dot: 'red' },
    { num: 31, isCurrent: true },
    { num: 1, isCurrent: false },
    { num: 2, isCurrent: false },
    { num: 3, isCurrent: false },
  ];

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* Top Header matching Screen 3 */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900">ปฏิทินงาน</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ดูตารางงานรายวัน / รายสัปดาห์ วางแผนได้ง่าย
          </p>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
        {/* Month Picker */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-extrabold text-slate-900">
            {THAI_MONTHS[monthIndex]} {year}
          </span>

          <button
            type="button"
            onClick={() => setMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500">
          {WEEKDAY_HEADERS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {calendarCells.map((c, i) => {
            const isSelected = c.isCurrent && c.num === selectedDayNum;
            return (
              <div key={i} className="flex flex-col items-center justify-center py-1">
                <button
                  type="button"
                  onClick={() => c.isCurrent && setSelectedDayNum(c.num)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    !c.isCurrent
                      ? 'text-slate-300'
                      : isSelected
                      ? 'bg-[#0C6D5B] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c.num}
                </button>
                <div className="h-1 flex items-center justify-center mt-0.5">
                  {c.dot === 'red' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: งานวันนี้ (4) matching Screen 3 */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">
            งานวันนี้ ({todos.length})
          </h2>
          <span className="text-xs text-[#0C6D5B] font-bold">
            {selectedDayNum} {THAI_MONTHS[monthIndex]}
          </span>
        </div>

        <div className="space-y-2.5">
          {todos.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#0C6D5B]/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#0C6D5B] truncate">
                    {task.time}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#E6F4F1] text-[#0C6D5B] text-[10px] font-bold">
                    {task.classroom}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-800 truncate">
                  {task.title}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
