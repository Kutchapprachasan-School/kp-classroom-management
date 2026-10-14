import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileCalendarScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
}

const WEEKDAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const TeacherMobileCalendarScreen: React.FC<TeacherMobileCalendarScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [selectedDay, setSelectedDay] = useState(24);
  const monthName = 'กันยายน 2569';

  // September 2569 calendar cells (Starts on Tuesday = index 2)
  // August 31 days (last Sunday/Monday = 30, 31)
  const days = [
    { num: 30, isCurrentMonth: false },
    { num: 31, isCurrentMonth: false },
    { num: 1, isCurrentMonth: true },
    { num: 2, isCurrentMonth: true },
    { num: 3, isCurrentMonth: true },
    { num: 4, isCurrentMonth: true },
    { num: 5, isCurrentMonth: true },
    { num: 6, isCurrentMonth: true },
    { num: 7, isCurrentMonth: true },
    { num: 8, isCurrentMonth: true },
    { num: 9, isCurrentMonth: true },
    { num: 10, isCurrentMonth: true },
    { num: 11, isCurrentMonth: true },
    { num: 12, isCurrentMonth: true },
    { num: 13, isCurrentMonth: true },
    { num: 14, isCurrentMonth: true },
    { num: 15, isCurrentMonth: true },
    { num: 16, isCurrentMonth: true },
    { num: 17, isCurrentMonth: true },
    { num: 18, isCurrentMonth: true },
    { num: 19, isCurrentMonth: true },
    { num: 20, isCurrentMonth: true },
    { num: 21, isCurrentMonth: true },
    { num: 22, isCurrentMonth: true },
    { num: 23, isCurrentMonth: true },
    { num: 24, isCurrentMonth: true }, // Highlighted Day in Mockup
    { num: 25, isCurrentMonth: true },
    { num: 26, isCurrentMonth: true },
    { num: 27, isCurrentMonth: true },
    { num: 28, isCurrentMonth: true },
    { num: 29, isCurrentMonth: true },
    { num: 30, isCurrentMonth: true },
    { num: 1, isCurrentMonth: false },
    { num: 2, isCurrentMonth: false },
    { num: 3, isCurrentMonth: false },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 font-sans select-none text-slate-800">
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('home');
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          ปฏิทินการสอน / กิจกรรม
        </h1>
      </div>

      {/* 2. Calendar Month Card matching Screen 6 */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Month Selector */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800">
            {monthName}
          </span>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w} className="text-[11px] font-bold text-slate-400 py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {days.map((d, idx) => {
            const isSelected = d.isCurrentMonth && d.num === selectedDay;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (d.isCurrentMonth) setSelectedDay(d.num);
                }}
                className={`h-9 w-full rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : d.isCurrentMonth
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-300'
                }`}
              >
                {d.num}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Tasks Section matching Screen 6 */}
      <div className="space-y-2.5">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 px-1">
          วันนี้ {selectedDay} ก.ย. 2569
        </h3>

        {/* Task 1: ตรวจงาน ม.3/1 */}
        <div
          onClick={() => onNavigate('mobile-class-submissions')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-purple-700">
                ตรวจงาน ม.3/1
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                ญ31201 หน่วยที่ 5 • เวลา 15:30 - 16:30
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Task 2: ส่งคะแนน ม.6/1 */}
        <div
          onClick={() => onNavigate('mobile-room-scores')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                ส่งคะแนน ม.6/1
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                ญ21202 บทที่ 1 • เวลา 16:30 - 17:30
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Task 3: มอบหมายงาน ม.3/2 */}
        <div
          onClick={() => onNavigate('mobile-create-assignment')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700">
                มอบหมายงาน ม.3/2
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                ญ33201 หน่วยที่ 2 • เวลา 19:00
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </div>
  );
};
