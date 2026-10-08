// src/components/dashboard/TeacherWeeklyTasksWidget.tsx
// วิดเจ็ตงานที่ต้องทำ (สัปดาห์นี้) ดึงข้อมูลอ้างอิงจากปฏิทินกิจกรรมโรงเรียน
// รองรับการซิงค์แบบเรียลไทม์ และแสดงสถานะด่วน/ปกติชัดเจน

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';
import type { CalendarEventItem } from '../../views/AcademicTermsView';
import { authService } from '../../services/authService';

const CALENDAR_EVENTS_STORAGE_KEY = 'kp_school_calendar_events_v2';

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'URGENT' | 'NORMAL';
  priorityLabel: string;
  iconBgColor: string;
  iconColor: string;
}

const DEFAULT_FALLBACK_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'จัดทำแผนการจัดการเรียนรู้ (ม.3/1)',
    dueDate: 'ส่งภายใน 3 ต.ค. 2569',
    priority: 'URGENT',
    priorityLabel: 'ด่วน',
    iconBgColor: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    id: 't-2',
    title: 'ตรวจข้อสอบปลายภาค (ม.3)',
    dueDate: 'ส่งภายใน 5 ต.ค. 2569',
    priority: 'NORMAL',
    priorityLabel: 'ปกติ',
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 't-3',
    title: 'บันทึกคะแนนกลางภาค (ม.3)',
    dueDate: 'ส่งภายใน 10 ต.ค. 2569',
    priority: 'NORMAL',
    priorityLabel: 'ปกติ',
    iconBgColor: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
];

interface TeacherWeeklyTasksWidgetProps {
  onNavigateToTasks?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherWeeklyTasksWidget: React.FC<TeacherWeeklyTasksWidgetProps> = ({
  onNavigateToTasks,
  onSelectTask,
  onDeepNavigate,
}) => {
  // โหลดรายการกิจกรรมจาก LocalStorage
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleEventsUpdate = () => {
      try {
        const raw = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
        if (raw) setCalendarEvents(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener('kps-academic-calendar-updated', handleEventsUpdate);
    window.addEventListener('storage', handleEventsUpdate);
    return () => {
      window.removeEventListener('kps-academic-calendar-updated', handleEventsUpdate);
      window.removeEventListener('storage', handleEventsUpdate);
    };
  }, []);

  // แปลงปฏิทินกิจกรรมเป็นงานที่ต้องทำในสัปดาห์นี้
  const displayTasks = useMemo(() => {
    const user = authService.getCurrentUser();
    const currentUserId = user?.id || 'u-1';

    // กรองกิจกรรมเฉพาะที่ครูมีสิทธิ์เห็น และเป็นงานที่เกี่ยวข้อง (ส่งงาน, ประชุม, ภาระงาน)
    const filtered = calendarEvents.filter((ev) => {
      const target = (ev as any).targetRole || (ev as any).targetAudience || 'ALL';
      if (target === 'STUDENT') return false;
      if (target === 'PERSONAL') {
        return (ev as any).createdBy === currentUserId || (ev as any).assignedUsers?.includes(currentUserId);
      }
      if (target === 'CUSTOM') {
        return (ev as any).assignedUsers?.includes(currentUserId);
      }
      return true;
    });

    // เรียงตามความเร่งด่วน หรือวันที่ใกล้เคียง
    const mapped: TaskItem[] = filtered.slice(0, 3).map((ev) => {
      const isUrgent =
        ev.colorType === 'ORANGE' ||
        ev.category === 'SUBMISSION' ||
        ev.title.includes('ส่ง') ||
        ev.title.includes('ด่วน');

      return {
        id: ev.id,
        title: ev.title,
        dueDate: ev.fullDateLabel || `วันที่ ${ev.day} ต.ค. 2569`,
        priority: isUrgent ? 'URGENT' : 'NORMAL',
        priorityLabel: isUrgent ? 'ด่วน' : 'ปกติ',
        iconBgColor:
          ev.colorType === 'ORANGE'
            ? 'bg-amber-100'
            : ev.colorType === 'GREEN'
            ? 'bg-emerald-100'
            : ev.colorType === 'RED'
            ? 'bg-rose-100'
            : 'bg-blue-100',
        iconColor:
          ev.colorType === 'ORANGE'
            ? 'text-amber-700'
            : ev.colorType === 'GREEN'
            ? 'text-emerald-700'
            : ev.colorType === 'RED'
            ? 'text-rose-700'
            : 'text-blue-700',
      };
    });

    if (mapped.length >= 3) {
      return mapped.slice(0, 3);
    }

    // ถ้ามีน้อยกว่า 3 รายการ ให้นำ fallback tasks มาเติมให้ครบ 3 เพื่อความสมบูรณ์ของ UI
    const combined = [...mapped];
    for (const fb of DEFAULT_FALLBACK_TASKS) {
      if (combined.length >= 3) break;
      if (!combined.some((item) => item.title === fb.title)) {
        combined.push(fb);
      }
    }
    return combined.slice(0, 3);
  }, [calendarEvents]);

  const handleViewAll = () => {
    if (onNavigateToTasks) {
      onNavigateToTasks();
      return;
    }
    onDeepNavigate?.({
      view: 'assignments',
      assignmentQuickFilter: 'PENDING_REVIEW',
      highlightBanner: 'งานและภาระงานที่ต้องทำทั้งหมด',
    });
  };

  const handleTaskClick = (item: TaskItem) => {
    if (onSelectTask) {
      onSelectTask(item);
      return;
    }
    onDeepNavigate?.({
      view: 'academic-year',
      highlightBanner: item.title,
    });
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
            งานที่ต้องทำ (อ้างอิงจากปฏิทิน)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleViewAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="p-2 sm:p-3 space-y-2">
        {displayTasks.map((item) => (
          <div
            key={item.id}
            onClick={() => handleTaskClick(item)}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 border border-slate-100/60 transition-colors cursor-pointer group"
          >
            {/* Left: Icon + Title & DueDate */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl ${item.iconBgColor} ${item.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug truncate group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {item.dueDate}
                </p>
              </div>
            </div>

            {/* Right: Priority Pill */}
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-2 ${
                item.priority === 'URGENT'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-sky-50 text-sky-600 border border-sky-200'
              }`}
            >
              {item.priorityLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
