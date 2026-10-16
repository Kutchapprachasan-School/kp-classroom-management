// src/components/dashboard/TeacherHomeHeroBanner.tsx
// แบนเนอร์พิเศษเฉพาะหน้าแรก (Home / Overview Dashboard)
// แยกต่างหากจาก PageHeroBanner ของหน้าอื่นๆ ตามคำขอของผู้ใช้

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import Home1Regular from '@mingcute/react/core-regular/home-1';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';
import { getSchoolSettings } from '../../config/schoolRoles';

export interface TeacherHomeHeroBannerProps {
  currentSubjectName?: string;
  selectedClassroom?: string;
  selectedSubjectCode?: string;
  teacherName?: string;
  onOpenAdminModal?: () => void;
  isAdmin?: boolean;
}

export const TeacherHomeHeroBanner: React.FC<TeacherHomeHeroBannerProps> = ({
  currentSubjectName,
  selectedClassroom,
  selectedSubjectCode,
  teacherName = 'ครูผู้สอน',
  onOpenAdminModal,
  isAdmin = false,
}) => {
  const [banner, setBanner] = useState<TeacherBannerItem>(() =>
    teacherBannerService.getEffectiveBanner('hero')
  );
  const [schoolSettings] = useState(() => getSchoolSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setBanner(teacherBannerService.getEffectiveBanner('hero'));
    };
    window.addEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
  }, []);

  const imageUrl = banner.customUrl || banner.defaultUrl || '/images/teacher/hero_banner_anime.png';
  const opacity = (banner.opacity ?? 100) / 100;
  const posX = banner.positionX ?? 0;
  const posY = banner.positionY ?? 0;
  const scale = (banner.scale ?? 100) / 100;

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E2EDF9] shadow-[0_2px_12px_rgba(40,90,140,0.04)] bg-gradient-to-r from-[#F0F6FF] via-[#F4F9FD] to-[#EBF3FE] select-none transition-all">
      {/* Background Anime Artwork with soft fader */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden flex justify-end items-center z-0">
        <img
          src={imageUrl}
          alt="Home Hero Banner"
          style={{
            opacity,
            transform: `translate(${posX}%, ${posY}%) scale(${scale})`,
            transformOrigin: 'right center',
          }}
          className="h-full w-full object-cover object-right"
          onError={(e) => {
            if (e.currentTarget.src !== '/images/teacher/hero_banner_anime.png') {
              e.currentTarget.src = '/images/teacher/hero_banner_anime.png';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0F6FF] via-[#F0F6FF]/75 to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 md:px-7 py-3.5 sm:py-4.5 gap-3.5">
        {/* Left: School Welcome & Teacher Identity */}
        <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div className="w-13 h-13 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-full bg-[#EBF3FE] border border-[#BFDBFE]/80 flex items-center justify-center shrink-0 shadow-2xs text-blue-600">
            <Home1Regular className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#163A66] tracking-tight leading-tight">
                ยินดีต้อนรับสู่ระบบจัดการชั้นเรียน
              </h1>
              {selectedClassroom && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ห้อง {selectedClassroom}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#6B7C93] font-normal sm:font-medium mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
              {schoolSettings.nameTh || 'โรงเรียนกุดจับประชาสรรค์'} • {teacherName} •{' '}
              {currentSubjectName
                ? `รายวิชา ${selectedSubjectCode || ''} ${currentSubjectName}`
                : 'จัดการการเรียนการสอนและคะแนน ปพ.5'}
            </p>
          </div>
        </div>

        {/* Right: Floating Quote Bubble */}
        <div className="hidden md:flex items-center shrink-0 pr-1">
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-blue-100/90 shadow-[0_4px_16px_rgba(40,90,140,0.06)] px-4 sm:px-5 py-2.5 sm:py-3 max-w-xs text-center select-none">
            <p className="text-xs sm:text-[13px] font-semibold text-[#163A66] leading-snug flex items-center justify-center gap-1.5">
              <span>“การศึกษา คือการเปิดโลกให้กับนักเรียน”</span>
              <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#6B7C93] font-medium mt-0.5">
              สอนด้วยใจ ให้โอกาสทุกคนเติบโต
            </p>
          </div>
        </div>

        {/* Admin Quick Trigger */}
        {isAdmin && onOpenAdminModal && (
          <button
            type="button"
            onClick={onOpenAdminModal}
            className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs transition-colors cursor-pointer border border-white/20 flex items-center gap-1"
            title="ปรับแต่งภาพแบนเนอร์ (Admin)"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>ปรับแต่ง</span>
          </button>
        )}
      </div>
    </div>
  );
};
