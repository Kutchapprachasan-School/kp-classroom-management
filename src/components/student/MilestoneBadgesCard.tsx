import React from 'react';
import { Star, Flame, Trophy } from 'lucide-react';

export const MilestoneBadgesCard: React.FC = () => {
  const badges = [
    {
      title: 'ก้าวแรก',
      progress: '0/1 ครั้ง',
      icon: Star,
      completed: false,
    },
    {
      title: 'นักลงมือ',
      progress: '0/3 ครั้ง',
      icon: Flame,
      completed: false,
    },
    {
      title: 'ไม่หยุดพัฒนา',
      progress: '0/5 ครั้ง',
      icon: Trophy,
      completed: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
      <h3 className="font-semibold text-slate-800 text-xs sm:text-sm mb-4">
        ก้าวเล็ก ๆ ที่สำเร็จ
      </h3>

      <div className="grid grid-cols-3 gap-2 text-center">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex flex-col items-center justify-between min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                {badge.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {badge.progress}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
