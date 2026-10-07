// src/components/layout/PageHeroBanner.tsx
// แบนเนอร์หัวหน้าเว็บดีไซน์ Pastel Anime Education Dashboard (ตามภาพที่ 2 media_1791345472357.png)
// ข้อความด้านซ้ายจะเปลี่ยนตามแต่ละหน้า ส่วนภาพพื้นหลัง/การจัดวางดึงจาก teacherBannerService
// รองรับการปรับความโปร่งแสง, การขยับตำแหน่ง (Pan X/Y), ซูม, และแสดงผลแบบ Responsive ทั้ง PC และ Mobile

import React, { useState, useEffect } from 'react';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';

export interface PageHeroBannerProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
  badgeText?: string;
  quoteText?: string;
  className?: string;
  actions?: React.ReactNode;
  onOpenBannerSettings?: () => void;
  isAdmin?: boolean;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  title,
  subtitle,
  icon,
  iconBgClass = 'bg-blue-600 text-white',
  badgeText,
  quoteText,
  className = '',
  actions,
  onOpenBannerSettings,
  isAdmin = false,
}) => {
  const [heroBanner, setHeroBanner] = useState<TeacherBannerItem>(() =>
    teacherBannerService.getEffectiveBanner('hero')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setHeroBanner(teacherBannerService.getEffectiveBanner('hero'));
    };
    window.addEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
  }, []);

  const imageUrl = heroBanner.customUrl || heroBanner.defaultUrl;
  const opacity = (heroBanner.opacity ?? 100) / 100;
  const posX = heroBanner.positionX ?? 0;
  const posY = heroBanner.positionY ?? 0;
  const scale = (heroBanner.scale ?? 100) / 100;
  const activeQuote = quoteText || heroBanner.quoteText || '“การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น นะคะ ♡”';
  const showQuote = heroBanner.showQuote !== false;

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl border border-[#E6EEF7] bg-white shadow-2xs overflow-hidden select-none transition-all ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Background Graphic with Adjustable Pan, Zoom & Opacity      */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={imageUrl}
          alt="School Hero Banner"
          style={{
            opacity,
            transform: `translate(${posX}%, ${posY}%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="w-full h-full object-cover object-right md:object-center transition-all duration-300"
        />

        {/* Soft Left Gradient Overlay to guarantee text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent sm:to-white/10" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Banner Foreground Content                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 py-5 sm:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-h-[110px] sm:min-h-[135px]">
        {/* Left: Icon + Title & Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-4 max-w-xl">
          {icon && (
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${iconBgClass} flex items-center justify-center shrink-0 shadow-md shadow-blue-500/15 border border-white/60`}
            >
              {icon}
            </div>
          )}

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              {badgeText && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Cute Anime Quote Bubble & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {showQuote && activeQuote && (
            <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/85 backdrop-blur-xs border border-pink-100 shadow-2xs text-[#163A66] text-xs font-bold transition-transform hover:scale-102">
              <span className="text-pink-500">🌸</span>
              <span className="italic">{activeQuote}</span>
            </div>
          )}

          {actions}

          {/* Quick Admin Edit Button */}
          {isAdmin && onOpenBannerSettings && (
            <button
              type="button"
              onClick={onOpenBannerSettings}
              className="px-2.5 py-1 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white text-[11px] font-bold shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
              title="ปรับแต่งภาพแบนเนอร์และตำแหน่ง (Admin)"
            >
              ⚙️ ปรับแต่งภาพ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
