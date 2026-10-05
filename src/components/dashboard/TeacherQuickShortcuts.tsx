// src/components/dashboard/TeacherQuickShortcuts.tsx
// ทางลัดสำหรับครู 4 ปุ่ม ตามภาพต้นแบบ Mockup Image 1

import React from 'react';
import { BookOpen, Users, ClipboardCheck, CloudUpload, BookmarkCheck } from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherQuickShortcutsProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
  onNavigateToLessons?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToGrading?: () => void;
  onNavigateToFiles?: () => void;
}

export const TeacherQuickShortcuts: React.FC<TeacherQuickShortcutsProps> = ({
  onDeepNavigate,
  onNavigateToLessons,
  onNavigateToAttendance,
  onNavigateToGrading,
  onNavigateToFiles,
}) => {
  const shortcuts = [
    {
      id: 'lesson-plan',
      label: 'สร้างแผนการสอน',
      icon: BookOpen,
      bgColor: 'bg-purple-100 text-purple-600',
      action: () => {
        if (onNavigateToLessons) onNavigateToLessons();
        else
          onDeepNavigate?.({
            view: 'class-overview',
            highlightBanner: 'สร้างแผนการสอนใหม่',
          });
      },
    },
    {
      id: 'attendance',
      label: 'เช็คชื่อนักเรียน',
      icon: Users,
      bgColor: 'bg-teal-100 text-teal-600',
      action: () => {
        if (onNavigateToAttendance) onNavigateToAttendance();
        else
          onDeepNavigate?.({
            view: 'class-overview',
            classSubTab: 'attendance',
            highlightBanner: 'เช็คชื่อนักเรียนประจำคาบ',
          });
      },
    },
    {
      id: 'grading',
      label: 'ให้คะแนน',
      icon: ClipboardCheck,
      bgColor: 'bg-amber-100 text-amber-600',
      action: () => {
        if (onNavigateToGrading) onNavigateToGrading();
        else
          onDeepNavigate?.({
            view: 'class-overview',
            classSubTab: 'assignments',
            highlightBanner: 'บันทึกคะแนนเก็บและภาระงาน',
          });
      },
    },
    {
      id: 'upload-files',
      label: 'อัปโหลดสื่อ/ไฟล์',
      icon: CloudUpload,
      bgColor: 'bg-blue-100 text-blue-600',
      action: () => {
        if (onNavigateToFiles) onNavigateToFiles();
        else
          onDeepNavigate?.({
            view: 'settings',
            highlightBanner: 'พื้นที่จัดเก็บสื่อการสอน R2',
          });
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Header bar: Blue gradient title */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white px-4 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2">
        <BookmarkCheck className="w-4 h-4 text-white" />
        <h2 className="font-extrabold text-sm sm:text-base leading-tight">
          ทางลัดสำหรับครู
        </h2>
      </div>

      {/* 4 Shortcut Action Tiles */}
      <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {shortcuts.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100/90 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all cursor-pointer group shadow-2xs"
            >
              <div
                className={`w-11 h-11 rounded-2xl ${item.bgColor} flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform`}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center leading-tight group-hover:text-blue-700 transition-colors">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
