// src/components/dashboard/TeacherHeroBanner.tsx
// แบนเนอร์หลักด้านบนของหน้าครู (Hero Banner) ตามภาพต้นแบบ Mockup Image 1 & Image 2
// ปรับแต่งได้เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin: ACADEMIC_ADMIN)

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface TeacherHeroBannerProps {
  activeRole?: SchoolUserRole;
  onOpenAdminModal?: () => void;
}

export const TeacherHeroBanner: React.FC<TeacherHeroBannerProps> = ({
  activeRole,
  onOpenAdminModal,
}) => {
  const [banner, setBanner] = useState<TeacherBannerItem>(() =>
    teacherBannerService.getEffectiveBanner('hero')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setBanner(teacherBannerService.getEffectiveBanner('hero'));
    };
    window.addEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
  }, []);

  const isAdmin = teacherBannerService.canManageBanners(activeRole);
  const imageUrl = banner.customUrl || banner.defaultUrl;

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-blue-100 group select-none transition-all">
      {/* Background Graphic / Banner Image */}
      <div className="relative w-full aspect-[4.2/1] sm:aspect-[4.5/1] min-h-[96px] sm:min-h-[120px] md:min-h-[140px] max-h-[220px] bg-gradient-to-r from-sky-100 via-blue-50 to-sky-200">
        <img
          src={imageUrl}
          alt={banner.name}
          className="w-full h-full object-cover object-center"
        />

        {/* Hero Quote and Subtitle Typography Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/65 via-slate-900/35 to-transparent flex flex-col justify-center px-4 sm:px-8 text-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 backdrop-blur-xs text-blue-200 border border-blue-300/30 text-[10px] sm:text-xs font-bold w-fit mb-1.5">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>คำคมสร้างแรงบันดาลใจ</span>
          </div>
          <h2 className="text-sm sm:text-lg md:text-xl font-black drop-shadow-md tracking-tight leading-snug">
            {banner.quoteText || '“การศึกษาคือการลงทุน ที่คุ้มค่าที่สุดในชีวิต”'}
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-blue-100 font-medium drop-shadow-sm mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
            {banner.subText || 'ร่วมสร้างโอกาส พัฒนาผู้เรียน สู่อนาคตที่มั่นคงและยั่งยืน'}
          </p>
        </div>
      </div>

      {/* Admin Quick Customization Badge (Visible ONLY to ACADEMIC_ADMIN) */}
      {isAdmin && onOpenAdminModal && (
        <button
          type="button"
          onClick={onOpenAdminModal}
          className="absolute top-2.5 right-2.5 z-10 opacity-75 hover:opacity-100 transition-opacity bg-slate-900/80 hover:bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-xs cursor-pointer border border-white/20"
          title="ปรับแต่งแบนเนอร์หลัก (เฉพาะแอดมิน)"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden sm:inline">ปรับแต่ง Hero Banner</span>
          <span className="sm:hidden">แบนเนอร์</span>
        </button>
      )}
    </div>
  );
};
