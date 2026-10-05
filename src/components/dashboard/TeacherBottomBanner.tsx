// src/components/dashboard/TeacherBottomBanner.tsx
// แบนเนอร์ล่างของหน้าครู (Bottom Banner) ตามภาพต้นแบบ Mockup Image 1
// ปรับแต่งได้เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin: ACADEMIC_ADMIN)

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface TeacherBottomBannerProps {
  activeRole?: SchoolUserRole;
  onOpenAdminModal?: () => void;
}

export const TeacherBottomBanner: React.FC<TeacherBottomBannerProps> = ({
  activeRole,
  onOpenAdminModal,
}) => {
  const [banner, setBanner] = useState<TeacherBannerItem>(() =>
    teacherBannerService.getEffectiveBanner('bottom')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setBanner(teacherBannerService.getEffectiveBanner('bottom'));
    };
    window.addEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
  }, []);

  const isAdmin = teacherBannerService.canManageBanners(activeRole);
  const imageUrl = banner.customUrl || banner.defaultUrl;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-blue-100 group select-none transition-all">
      <div className="relative w-full aspect-[8/1] min-h-[50px] sm:min-h-[64px] max-h-[96px] bg-gradient-to-r from-sky-50 via-blue-50 to-pink-50">
        <img
          src={imageUrl}
          alt={banner.name}
          className="w-full h-full object-cover object-center"
        />

        {banner.customUrl && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/20 to-transparent flex flex-col justify-center px-4 sm:px-6 text-white">
            <h3 className="text-xs sm:text-sm md:text-base font-bold drop-shadow-sm leading-tight">
              {banner.quoteText || '“ภาษา...คือกุญแจสู่โลกกว้าง”'}
            </h3>
            {banner.subText && (
              <p className="text-[10px] sm:text-xs text-blue-100 font-medium drop-shadow-2xs mt-0.5">
                {banner.subText}
              </p>
            )}
          </div>
        )}
      </div>

      {isAdmin && onOpenAdminModal && (
        <button
          type="button"
          onClick={onOpenAdminModal}
          className="absolute top-1.5 right-1.5 z-10 opacity-70 hover:opacity-100 transition-opacity bg-slate-900/80 hover:bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md flex items-center gap-1 backdrop-blur-xs cursor-pointer border border-white/20"
          title="ปรับแต่งแบนเนอร์ล่าง (เฉพาะแอดมิน)"
        >
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span className="hidden sm:inline">ปรับแต่งแบนเนอร์ล่าง</span>
        </button>
      )}
    </div>
  );
};
