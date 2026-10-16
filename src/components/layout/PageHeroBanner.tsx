// src/components/layout/PageHeroBanner.tsx
// แบนเนอร์หัวหน้าเว็บมาตรฐานสำหรับทุกหน้า (Master Page Hero Banner)
// ถอดแบบตามภาพต้นแบบ media_1792130640567_d132e6db.png แบบเหมือนเป๊ะ 100%
//
// โครงสร้างมาตรฐานตาม Design System:
// 1. ซ้าย: วงกลมไอคอนสีฟ้าพาสเทล + ชื่อหน้าตัวหนาคมชัด (#163A66) + คำอธิบายรอง (#6B7C93) วางบนพื้นผิวแบนเนอร์โดยตรง
// 2. กลาง-ขวา: ภาพประกอบโรงเรียน นักเรียนอนิเมะ และดอกซากุระ ไล่ระดับแสงอย่างนุ่มนวล
// 3. ขวาสุด: การ์ดคำคมสีขาวโค้งมน (Quote Bubble) พร้อมไอคอนหัวใจสีฟ้า 💙
// 4. แบนเนอร์หน้าแรก (Home) แยกออกไปใช้ TeacherHomeHeroBanner ต่างหาก

import React, { useState, useEffect } from 'react';
import { Heart, GraduationCap, Sparkles } from 'lucide-react';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';

export interface PageHeroBannerProps {
  /** ชื่อหัวข้อหน้าเว็บหลัก */
  title: string;
  /** คำอธิบายวัตถุประสงค์ของหน้านี้ (สั้น กระชับ 1 บรรทัด) */
  subtitle: string;
  /** ไอคอนประจำหน้า (เช่น MingCute หรือ Lucide Icon) */
  icon?: React.ReactNode;
  /** คลาสสีพื้นหลังของไอคอน (ค่าเริ่มต้น: bg-[#EBF3FE] text-blue-600) */
  iconBgClass?: string;
  /** ป้ายกำกับเล็กข้างชื่อ เช่น 'ม.3/1', 'โฮมรูม', 'SAR' */
  badgeText?: string;
  /** คลาสสีของป้ายกำกับ */
  badgeClass?: string;
  /** ข้อความแท็ก/Bullets ใต้คำอธิบาย (เผื่อมี) */
  tagText?: string;
  /** รายการแท็กแบบอาร์เรย์ */
  tags?: string[];
  /** ข้อความคำคมหรือสโลแกนประจำหน้า */
  quoteLines?: string[];
  /** ข้อความคำคมเดี่ยว */
  quoteText?: string;
  /** ปุ่มคำสั่ง Action เพิ่มเติม (หากจำเป็น) */
  actions?: React.ReactNode;
  /** คลาส Tailwind เพิ่มเติมสำหรับคอนเทนเนอร์หลัก */
  className?: string;
  /** ฟังก์ชันเปิดการตั้งค่าแบนเนอร์ (สำหรับ Admin) */
  onOpenBannerSettings?: () => void;
  /** ระบุว่าผู้ใช้เป็นแอดมินหรือไม่ */
  isAdmin?: boolean;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  title,
  subtitle,
  icon,
  iconBgClass,
  badgeText,
  badgeClass = 'bg-blue-50 text-blue-700 border-blue-200',
  quoteLines,
  quoteText,
  actions,
  className = '',
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

  const imageUrl = heroBanner.customUrl || heroBanner.defaultUrl || '/images/teacher/hero_banner_anime.png';
  const opacity = (heroBanner.opacity ?? 100) / 100;
  const posX = heroBanner.positionX ?? 0;
  const posY = heroBanner.positionY ?? 0;
  const scale = (heroBanner.scale ?? 100) / 100;

  // จัดการข้อความคำคมฝั่งขวา
  let displayQuote = 'การศึกษา คือการเปิดโลกให้กับนักเรียน';
  if (quoteText) {
    displayQuote = quoteText.replace(/^[“"']|[”"']$/g, '').trim();
  } else if (quoteLines && quoteLines.length > 0) {
    displayQuote = quoteLines.join(' ').replace(/^[“"']|[”"']$/g, '').trim();
  } else if (heroBanner.quoteText) {
    displayQuote = heroBanner.quoteText.replace(/^[“"']|[”"']$/g, '').trim();
  }

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E2EDF9] shadow-[0_2px_12px_rgba(40,90,140,0.04)] bg-gradient-to-r from-[#F0F6FF] via-[#F4F9FD] to-[#EBF3FE] select-none transition-all ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Background Anime Artwork (School + Anime Student + Sakura) */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden flex justify-end items-center z-0">
        <img
          src={imageUrl}
          alt={title}
          style={{
            opacity,
            transform: `translate(${posX}%, ${posY}%) scale(${scale})`,
            transformOrigin: 'right center',
          }}
          className="h-full w-full object-cover object-right transition-all duration-300"
          onError={(e) => {
            if (e.currentTarget.src !== '/images/teacher/hero_banner_anime.png') {
              e.currentTarget.src = '/images/teacher/hero_banner_anime.png';
            }
          }}
        />
        {/* Soft pastel fader gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0F6FF] via-[#F0F6FF]/75 to-transparent pointer-events-none" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Banner Foreground Content (Clean & Matching Mockup)       */}
      {/* ------------------------------------------------------------- */}
      <div className="relative min-h-[105px] sm:min-h-[116px] md:min-h-[120px] flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 md:px-7 py-3.5 sm:py-4 z-10 gap-3.5">
        {/* Left Section: Circular Icon Badge + Title + Subtitle directly on canvas */}
        <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div
            className={`w-13 h-13 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-full ${
              iconBgClass || 'bg-[#EBF3FE] text-blue-600'
            } border border-[#BFDBFE]/80 flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {icon ? (
              React.isValidElement(icon) ? (
                React.cloneElement(icon as React.ReactElement<any>, {
                  className: `${(icon as React.ReactElement<any>).props.className || 'w-7 h-7 sm:w-8 sm:h-8'} shrink-0`,
                })
              ) : (
                icon
              )
            ) : (
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#163A66] tracking-tight leading-tight">
                {title}
              </h1>
              {badgeText && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${badgeClass}`}
                >
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B7C93] font-normal sm:font-medium mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Crisp White Floating Quote Bubble Card with Blue Heart */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}

          <div className="hidden md:flex items-center shrink-0 pr-1">
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-blue-100/90 shadow-[0_4px_16px_rgba(40,90,140,0.06)] px-4 sm:px-5 py-2.5 sm:py-3 max-w-xs text-center select-none">
              <p className="text-xs sm:text-[13px] font-semibold text-[#163A66] leading-snug flex items-center justify-center gap-1.5">
                <span>“{displayQuote}”</span>
                <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0 inline" />
              </p>
            </div>
          </div>

          {/* Admin Banner Quick Settings Trigger */}
          {isAdmin && onOpenBannerSettings && (
            <button
              type="button"
              onClick={onOpenBannerSettings}
              className="px-2.5 py-1 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs transition-colors cursor-pointer border border-white/20 flex items-center gap-1"
              title="ปรับแต่งภาพแบนเนอร์ (Admin)"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>แบนเนอร์</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
