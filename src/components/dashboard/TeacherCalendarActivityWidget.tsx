// src/components/dashboard/TeacherCalendarActivityWidget.tsx
// วิดเจ็ตปฏิทินการสอน / กิจกรรม แสดงวันตามจริง ซิงค์กับปฏิทินโรงเรียน
// เมื่อคลิกวันที่ที่มีกิจกรรม จะเปิดหน้าต่าง Pop-up แสดงรายละเอียดกิจกรรมของวันนั้นทันที

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Clock,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';
import { authService } from '../../services/authService';
import {
  calendarEventStorageService,
  MATRIX_SLOTS_UPDATED_EVENT,
  type CalendarEventItem,
} from '../../services/calendarEventStorageService';
import { ACADEMIC_CALENDAR_EVENT } from '../../services/academicCalendarService';

const THAI_MONTHS_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

interface TeacherCalendarActivityWidgetProps {
  onNavigateToCalendar?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherCalendarActivityWidget: React.FC<
  TeacherCalendarActivityWidgetProps
> = ({ onNavigateToCalendar, onDeepNavigate }) => {
  // วันที่ปัจจุบันสำหรับระบบ: 2 ตุลาคม 2569 (2026-10-02)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 1 - 12
  const [selectedDay, setSelectedDay] = useState<number>(2);

  // Pop-up modal กิจกรรมประจำวันที่ถูกเลือก
  const [activeModalDate, setActiveModalDate] = useState<{
    day: number;
    month: number;
    year: number;
    events: CalendarEventItem[];
  } | null>(null);

  // โหลดรายการกิจกรรมทั้งหมดจาก Single Source of Truth จริง
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(() =>
    calendarEventStorageService.loadAllEvents()
  );

  // จำนวนคาบสอนจริงของวันนี้จากตารางสอน (เชื่อมโยงอัตโนมัติ ไม่ใช่ mock data)
  const [todayPeriodsCount, setTodayPeriodsCount] = useState<number>(() =>
    calendarEventStorageService.getTodayTeachingPeriodsCount()
  );

  useEffect(() => {
    const handleEventsUpdate = () => {
      setCalendarEvents(calendarEventStorageService.loadAllEvents());
    };
    window.addEventListener('kps-academic-calendar-updated', handleEventsUpdate);
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleEventsUpdate);
    window.addEventListener('storage', handleEventsUpdate);
    return () => {
      window.removeEventListener('kps-academic-calendar-updated', handleEventsUpdate);
      window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleEventsUpdate);
      window.removeEventListener('storage', handleEventsUpdate);
    };
  }, []);

  // ซิงค์จำนวนคาบสอนของวันนี้แบบเรียลไทม์เมื่อมีการเปลี่ยนแปลงในตารางสอน
  useEffect(() => {
    const handleTimetableUpdate = () => {
      setTodayPeriodsCount(calendarEventStorageService.getTodayTeachingPeriodsCount());
    };
    window.addEventListener(MATRIX_SLOTS_UPDATED_EVENT, handleTimetableUpdate);
    window.addEventListener('storage', handleTimetableUpdate);
    return () => {
      window.removeEventListener(MATRIX_SLOTS_UPDATED_EVENT, handleTimetableUpdate);
      window.removeEventListener('storage', handleTimetableUpdate);
    };
  }, []);

  // กรองกิจกรรมตามสิทธิ์ของผู้ใช้งาน (ทุกคน, เฉพาะครู, เฉพาะตัวเอง, หรือคนที่กำหนด)
  const visibleEvents = useMemo(() => {
    const user = authService.getCurrentUser();
    const currentUserId = user?.id || 'u-1';

    return calendarEvents.filter((ev) => {
      const target = (ev as any).targetRole || (ev as any).targetAudience || 'ALL';
      if (target === 'ALL' || target === 'TEACHER') return true;
      if (target === 'PERSONAL') {
        return (ev as any).createdBy === currentUserId || (ev as any).assignedUsers?.includes(currentUserId);
      }
      if (target === 'CUSTOM') {
        return (ev as any).assignedUsers?.includes(currentUserId);
      }
      return true;
    });
  }, [calendarEvents]);

  // คำนวณตารางวันตามจริงในเดือนและปีที่เลือก (เกรกอเรียน -> พ.ศ.)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = อา., 1 = จ.
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const cells: {
      day: number;
      currentMonth: boolean;
      isToday: boolean;
      eventCount: number;
      dotColor?: 'blue' | 'green' | 'red' | 'purple';
      events: CalendarEventItem[];
    }[] = [];

    // เติมวันของเดือนก่อนหน้า
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        currentMonth: false,
        isToday: false,
        eventCount: 0,
        events: [],
      });
    }

    // เติมวันของเดือนปัจจุบัน
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = currentYear === 2026 && currentMonth === 10 && d === 2;
      const dayEvents = visibleEvents.filter((ev) => {
        const evMonth = ev.month || 10;
        const evYear = ev.year > 2500 ? ev.year - 543 : ev.year;
        const matchesSingle = ev.day === d && evMonth === currentMonth && evYear === currentYear;
        // กรณีเป็นช่วงหลายวัน
        const isRange = ev.endDay && d >= ev.day && d <= ev.endDay && evMonth === currentMonth;
        return matchesSingle || isRange;
      });

      let dotColor: 'blue' | 'green' | 'red' | 'purple' | undefined = undefined;
      if (dayEvents.length > 0) {
        const firstCategory = dayEvents[0].category;
        if (firstCategory === 'EXAM' || firstCategory === 'SUBMISSION') dotColor = 'red';
        else if (firstCategory === 'MEETING') dotColor = 'blue';
        else if (firstCategory === 'ACADEMIC') dotColor = 'green';
        else dotColor = 'purple';
      }

      cells.push({
        day: d,
        currentMonth: true,
        isToday,
        eventCount: dayEvents.length,
        dotColor,
        events: dayEvents,
      });
    }

    // เติมวันของเดือนถัดไปให้ครบสัปดาห์
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let nextD = 1; nextD <= remaining; nextD++) {
        cells.push({
          day: nextD,
          currentMonth: false,
          isToday: false,
          eventCount: 0,
          events: [],
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, visibleEvents]);

  // สรุปจำนวนกิจกรรมตามวันที่เลือก (ค่าเริ่มต้น: วันนี้ 2 ต.ค. 2569)
  const selectedDayEvents = useMemo(() => {
    const targetDay = selectedDay || 2;
    return visibleEvents.filter((ev) => {
      const evMonth = ev.month || 10;
      const evYear = ev.year > 2500 ? ev.year - 543 : ev.year;
      const matchesSingle = ev.day === targetDay && evMonth === currentMonth && evYear === currentYear;
      const isRange = ev.endDay && targetDay >= ev.day && targetDay <= ev.endDay && evMonth === currentMonth;
      return matchesSingle || isRange;
    });
  }, [visibleEvents, selectedDay, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayClick = (cell: (typeof calendarCells)[0]) => {
    if (!cell.currentMonth) return;
    setSelectedDay(cell.day);

    // หากวันนั้นมีกิจกรรม ให้แสดง pop-up modal รายละเอียดกิจกรรมทันที
    if (cell.events.length > 0) {
      setActiveModalDate({
        day: cell.day,
        month: currentMonth,
        year: currentYear + 543,
        events: cell.events,
      });
    }
  };

  const handleViewAll = () => {
    if (onNavigateToCalendar) {
      onNavigateToCalendar();
      return;
    }
    onDeepNavigate?.({
      view: 'academic-year',
      highlightBanner: 'ปฏิทินกิจกรรมโรงเรียน',
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
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">
              {THAI_MONTHS_NAMES[currentMonth - 1]} {currentYear + 543}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {WEEKDAYS.map((wd, i) => (
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

          {/* Calendar Grid (วันตามจริง + จุดกิจกรรม) */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.currentMonth && cell.day === selectedDay;
              const hasEvents = cell.eventCount > 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(cell)}
                  disabled={!cell.currentMonth}
                  className={`relative h-6 sm:h-7 flex flex-col items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    !cell.currentMonth
                      ? 'text-slate-300 cursor-default'
                      : isSelected
                      ? 'bg-blue-600 text-white font-extrabold shadow-xs cursor-pointer'
                      : cell.isToday
                      ? 'border-2 border-blue-500 text-blue-700 font-extrabold cursor-pointer hover:bg-blue-50'
                      : hasEvents
                      ? 'text-slate-900 font-bold hover:bg-blue-50 cursor-pointer'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                  title={
                    cell.currentMonth && hasEvents
                      ? `วันที่ ${cell.day}: มี ${cell.eventCount} กิจกรรม (คลิกเพื่อดูรายละเอียด)`
                      : undefined
                  }
                >
                  <span className="leading-none">{cell.day}</span>
                  {/* Indicator Dot สำหรับวันที่มีกิจกรรม */}
                  {hasEvents && !isSelected && (
                    <span
                      className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
                        cell.dotColor === 'red'
                          ? 'bg-rose-500'
                          : cell.dotColor === 'green'
                          ? 'bg-emerald-500'
                          : cell.dotColor === 'purple'
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
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
            <span>
              {selectedDay === 2 && currentMonth === 10 && currentYear === 2026
                ? 'วันนี้'
                : `วันที่ ${selectedDay} ${THAI_MONTHS_NAMES[currentMonth - 1]}`}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-600 leading-none">
                {todayPeriodsCount}
              </span>
              <span className="text-xs font-bold text-slate-700">คาบเรียน</span>
            </div>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>{selectedDayEvents.filter((e) => e.category === 'MEETING').length} งานประชุม</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{selectedDayEvents.filter((e) => e.category === 'SUBMISSION' || e.category === 'ACADEMIC').length} งานส่ง/วิชาการ</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>{selectedDayEvents.filter((e) => e.category === 'STUDENT' || e.category === 'OTHER').length} กิจกรรมนักเรียน</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          POP-UP MODAL: แสดงรายละเอียดกิจกรรมในวันที่คลิก
          ======================================================== */}
      {activeModalDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-sky-50 to-white border-b border-blue-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    กิจกรรมวันที่ {activeModalDate.day} {THAI_MONTHS_NAMES[activeModalDate.month - 1]} {activeModalDate.year}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    มี {activeModalDate.events.length} กิจกรรมในวันนี้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDate(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Event List */}
            <div className="p-4 sm:p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {activeModalDate.events.map((ev, i) => (
                <div
                  key={ev.id || i}
                  className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {ev.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0">
                      {ev.category === 'MEETING'
                        ? 'ประชุม/อบรม'
                        : ev.category === 'SUBMISSION'
                        ? 'กำหนดส่งงาน'
                        : ev.category === 'EXAM'
                        ? 'การสอบ'
                        : ev.category === 'STUDENT'
                        ? 'กิจกรรม นร.'
                        : 'วิชาการ'}
                    </span>
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {ev.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                    {ev.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{ev.time}</span>
                      </div>
                    )}
                    {ev.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ev.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>
                        {ev.targetRole === 'TEACHER'
                          ? 'สำหรับครู'
                          : ev.targetRole === 'STUDENT'
                          ? 'สำหรับนักเรียน'
                          : 'ทุกคนในโรงเรียน'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalDate(null);
                  handleViewAll();
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>เปิดดูในปฏิทินเต็ม</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveModalDate(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
