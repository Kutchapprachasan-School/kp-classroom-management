// src/components/dashboard/TeacherAnnouncementsWidget.tsx
// วิดเจ็ตข่าวสาร / ประกาศ เชื่อมต่อกับระบบประกาศจริง (Zero Mock Data)

import React, { useMemo } from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';
import { messagingService } from '../../services/messagingService.ts';

interface AnnouncementItem {
  id: string;
  dotColor: string;
  title: string;
  timestamp: string;
}

interface TeacherAnnouncementsWidgetProps {
  onViewAll?: () => void;
}

export const TeacherAnnouncementsWidget: React.FC<TeacherAnnouncementsWidgetProps> = ({
  onViewAll,
}) => {
  // ดึงประกาศจริงจากกลุ่มประชาสัมพันธ์ทางการของโรงเรียน
  const announcements = useMemo<AnnouncementItem[]>(() => {
    try {
      const officialGroup = messagingService.getGroupById('grp-official-announcements');
      if (officialGroup && officialGroup.messages) {
        return officialGroup.messages
          .filter((m) => !m.isSystemAudit)
          .slice(-3)
          .reverse()
          .map((m, idx) => ({
            id: m.id,
            dotColor: idx === 0 ? 'bg-amber-500' : 'bg-blue-500',
            title: m.content.length > 65 ? `${m.content.slice(0, 65)}...` : m.content,
            timestamp: m.timestamp,
          }));
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

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

      {/* List or Empty State */}
      <div className="p-3 sm:p-4">
        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${item.dotColor} shrink-0 mt-1.5 ring-4 ring-slate-50`}
                />
                <div className="min-w-0 flex-1">
                  <h3
                    onClick={onViewAll}
                    className="font-bold text-slate-800 text-xs sm:text-sm leading-snug hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {item.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 flex flex-col items-center justify-center">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-1.5">
              <Megaphone className="w-4 h-4 text-blue-500" />
            </div>
            <p className="font-bold text-slate-700 text-xs sm:text-sm">ไม่มีข่าวสารหรือประกาศใหม่</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ประกาศทางการของโรงเรียนจะแสดงที่นี่</p>
          </div>
        )}
      </div>
    </div>
  );
};
