// src/components/dashboard/TeacherAnnouncementsWidget.tsx
// วิดเจ็ตข่าวสาร / ประกาศ ตามภาพต้นแบบ Mockup Image 1

import React from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  dotColor: string;
  title: string;
  timestamp: string;
}

const ANNOUNCEMENTS_MOCK: AnnouncementItem[] = [
  {
    id: 'a-1',
    dotColor: 'bg-amber-500',
    title: 'ประกาศ : กิจกรรมวันภาษาอังกฤษ (2 ต.ค. 2569)',
    timestamp: 'เมื่อวานนี้ 16:30',
  },
  {
    id: 'a-2',
    dotColor: 'bg-blue-500',
    title: 'แจ้งนักเรียน : การส่งงานภาษาญี่ปุ่น',
    timestamp: '1 ต.ค. 2569 10:15',
  },
];

interface TeacherAnnouncementsWidgetProps {
  onViewAll?: () => void;
}

export const TeacherAnnouncementsWidget: React.FC<TeacherAnnouncementsWidgetProps> = ({
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
            ข่าวสาร / ประกาศ
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="p-3 sm:p-4 space-y-3">
        {ANNOUNCEMENTS_MOCK.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${item.dotColor} shrink-0 mt-1.5 ring-4 ring-slate-50`}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug hover:text-blue-600 transition-colors cursor-pointer">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
