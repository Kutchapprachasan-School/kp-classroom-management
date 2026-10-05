// src/components/dashboard/TeacherWeeklyTasksWidget.tsx
// วิดเจ็ตงานที่ต้องทำ (สัปดาห์นี้) 3 รายการ ตามภาพต้นแบบ Mockup Image 1

import React from 'react';
import {
  CheckSquare,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'URGENT' | 'NORMAL';
  priorityLabel: string;
  iconBgColor: string;
  iconColor: string;
}

const WEEKLY_TASKS_MOCK: TaskItem[] = [
  {
    id: 't-1',
    title: 'จัดทำแผนการจัดการเรียนรู้ (ม.3/1)',
    dueDate: 'ส่งภายใน 3 ต.ค. 2569',
    priority: 'URGENT',
    priorityLabel: 'ด่วน',
    iconBgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
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
    iconBgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
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
      view: 'assignments',
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
            งานที่ต้องทำ (สัปดาห์นี้)
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
        {WEEKLY_TASKS_MOCK.map((item) => (
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
