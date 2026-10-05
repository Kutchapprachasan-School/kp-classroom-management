// src/components/dashboard/TeacherMobileHomeHero.tsx
// ส่วนหัวทักทายคุณครูบนหน้าจอมือถือ (Mobile First) ตามภาพต้นแบบ Mockup Image 2

import React from 'react';

interface TeacherMobileHomeHeroProps {
  teacherName?: string;
  department?: string;
  avatarUrl?: string;
}

export const TeacherMobileHomeHero: React.FC<TeacherMobileHomeHeroProps> = ({
  teacherName = 'นายปัญจพล เกษรัตน์',
  department = 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาญี่ปุ่น)',
  avatarUrl = '/images/teacher/teacher_avatar.png',
}) => {
  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-white border border-blue-100/70 p-3.5 sm:p-4 shadow-2xs select-none">
      <div className="flex items-center gap-3">
        {/* Anime Teacher Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-blue-100 flex items-center justify-center">
          <img
            src={avatarUrl}
            alt={teacherName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
            }}
          />
        </div>

        {/* Teacher Info matching Image 2 */}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-blue-600 leading-tight">
            สวัสดีครับ
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug truncate">
            {teacherName}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5 font-medium">
            ครู | {department}
          </p>
        </div>
      </div>
    </div>
  );
};
