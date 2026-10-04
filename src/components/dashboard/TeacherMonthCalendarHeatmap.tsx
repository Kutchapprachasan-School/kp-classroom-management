import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  teacherCalendarTodoService,
  type CalendarDayStatus,
  type DayTaskDetail,
} from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherMonthCalendarHeatmapProps {
  onActionClick: (payload: CrossViewNavigationPayload) => void;
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
> = ({ onActionClick }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 8)); // October 2026
  const [selectedDay, setSelectedDay] = useState<CalendarDayStatus | null>(null);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const days = teacherCalendarTodoService.getMonthDays(year, monthIndex);

  // Stats for this month
  const missedDaysCount = days.filter((d) => d.isCurrentMonth && d.status === 'MISSED').length;
  const completedDaysCount = days.filter((d) => d.isCurrentMonth && d.status === 'COMPLETED').length;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
    setSelectedDay(null);
  };

  const handleSelectDay = (day: CalendarDayStatus) => {
    if (!day.isCurrentMonth) return;
    setSelectedDay(day);
  };

  const handleResolveMissed = (dateString: string, task: DayTaskDetail) => {
    teacherCalendarTodoService.resolveMissedDate(dateString);
    onActionClick(task.targetPayload);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Month Navigation Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              ปฏิทินงาน & ตรวจสอบงานค้าง
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจจับวันที่ลืมเช็คชื่อ หรือบันทึกคะแนนไม่ครบอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[90px] text-center">
            {THAI_MONTHS[monthIndex]} {year + 543}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Status Strip */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> ครบถ้วน ({completedDaysCount} วัน)
          </span>
          {missedDaysCount > 0 ? (
            <span className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" /> มีงานลืม/ค้าง ({missedDaysCount} วัน)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> ไม่มีงานค้าง
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> วันนี้
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-slate-400">
          {WEEKDAY_HEADERS.map((h, i) => (
            <div
              key={h}
              className={`py-1 ${i === 0 || i === 6 ? 'text-rose-400' : 'text-slate-500'}`}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isSelected = selectedDay?.dateString === day.dateString;
            const isMissed = day.status === 'MISSED';
            const isCompleted = day.status === 'COMPLETED';
            const isToday = day.isToday;

            return (
              <button
                key={`${day.dateString}-${idx}`}
                type="button"
                disabled={!day.isCurrentMonth}
                onClick={() => handleSelectDay(day)}
                className={`aspect-square p-1 rounded-xl text-xs font-semibold relative transition-all flex flex-col items-center justify-between border cursor-pointer ${
                  !day.isCurrentMonth
                    ? 'border-transparent text-slate-300 bg-transparent cursor-default'
                    : isSelected
                    ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/50 shadow-xs'
                    : isToday
                    ? 'border-amber-400 bg-amber-50/60 font-bold text-amber-950'
                    : isMissed
                    ? 'border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-950 font-bold shadow-2xs'
                    : isCompleted
                    ? 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-950'
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {/* Date Number */}
                <span className="text-[11px] leading-none mt-0.5">{day.dayNumber}</span>

                {/* Status Dot / Indicator */}
                <div className="mb-0.5">
                  {day.isCurrentMonth && (
                    <>
                      {isMissed && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 block ring-2 ring-rose-200" />
                      )}
                      {isCompleted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                      )}
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 block animate-ping" />
                      )}
                      {day.holidayName && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 block" />
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Drawer / Panel */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100">
        {selectedDay ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  รายละเอียดวันที่ {selectedDay.dayNumber} {THAI_MONTHS[monthIndex]} {year + 543}
                </span>
                {selectedDay.status === 'MISSED' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    มีงานค้าง
                  </span>
                )}
                {selectedDay.status === 'COMPLETED' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    เรียบร้อยแล้ว
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                ปิด
              </button>
            </div>

            {selectedDay.tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                {selectedDay.holidayName
                  ? `วันหยุด: ${selectedDay.holidayName}`
                  : selectedDay.isWeekend
                  ? 'วันหยุดสุดสัปดาห์ (ไม่มีคาบสอน)'
                  : 'ไม่มีบันทึกงานในวันดังกล่าว'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDay.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      task.status === 'MISSED'
                        ? 'bg-white border-rose-200 text-rose-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.time}</span>
                        <span>•</span>
                        <span>{task.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {task.note || task.statusLabel}
                      </p>
                    </div>

                    {task.status === 'MISSED' ? (
                      <button
                        type="button"
                        onClick={() => handleResolveMissed(selectedDay.dateString, task)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <span>บันทึกย้อนหลัง</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {task.statusLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>แตะวันที่บนปฏิทินเพื่อดูบันทึกงาน หรือตรวจสอบงานที่ลืมเช็คชื่อ</span>
          </div>
        )}
      </div>
    </div>
  );
};
