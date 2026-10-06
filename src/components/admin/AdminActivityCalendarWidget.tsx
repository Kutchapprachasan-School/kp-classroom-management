import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminActivityCalendarWidgetProps {
  onViewAll?: () => void;
  onSelectDate?: (day: number) => void;
}

export const AdminActivityCalendarWidget: React.FC<AdminActivityCalendarWidgetProps> = ({
  onViewAll,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState('สิงหาคม 2568');
  const [selectedDay, setSelectedDay] = useState<number>(25);

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // August 2568: starts on Friday (5 blank cells for Sun-Thu: 0, 1, 2, 3, 4)
  const offsetDays = 5;
  const totalDays = 31;

  // Highlighted event days
  const eventDays: Record<number, { label: string; color: string }> = {
    12: { label: 'วันแม่แห่งชาติ', color: 'bg-sky-500 text-white' },
    25: { label: 'ปิดภาคเรียน', color: 'bg-blue-600 text-white font-bold shadow-xs' },
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          ปฏิทินกิจกรรม
        </h3>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Month Switcher */}
      <div className="flex items-center justify-between my-2.5 px-2">
        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => prev.includes('สิงหาคม') ? 'กรกฎาคม 2568' : 'สิงหาคม 2568')}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs sm:text-[13px] font-bold text-slate-800">
          {currentMonth}
        </span>

        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => prev.includes('สิงหาคม') ? 'กันยายน 2568' : 'สิงหาคม 2568')}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-100">
        {daysOfWeek.map((day, idx) => (
          <div
            key={day}
            className={idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-purple-400' : ''}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
        {/* Leading empty spaces */}
        {Array.from({ length: offsetDays }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}

        {/* Days 1 to 31 */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const event = eventDays[day];
          const isSelected = selectedDay === day;

          return (
            <div key={`day-${day}`} className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  onSelectDate?.(day);
                }}
                className={`h-7 w-7 rounded-full text-[11px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                  event
                    ? event.color
                    : isSelected
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={event ? `${day} ส.ค.: ${event.label}` : `${day} ส.ค.`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
