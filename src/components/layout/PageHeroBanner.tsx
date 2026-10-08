// src/components/layout/PageHeroBanner.tsx
// แบนเนอร์หัวหน้าเว็บมาตรฐานสำหรับทุกหน้า (Master Page Hero Banner)
// ตามภาพต้นแบบ media_1791433581154_fc64a813.png
// โครงสร้างมาตรฐานเดียวกันทุกหน้า:
// 1. ซ้าย: ไอคอนประจำหน้าในกล่องมนสีฟ้า + ชื่อหน้าตัวหนาคมชัด + คำอธิบายรอง + แถบ Bullets/Tags ด้านล่าง
// 2. ขวา-กลาง: คำคมหรือสโลแกนประจำหน้าแบบจัดวาง 3 บรรทัดพร้อมเครื่องบินกระดาษ ✈
// 3. ขวา: ภาพประกอบโรงเรียนและนักเรียนอนิเมะ (hero_banner.png) พร้อมเลเยอร์ไล่เฉดสีฟ้าพาสเทลโปร่งสบายตา
// 4. รองรับปุ่มการทำงานหลัก (Actions) และการปรับแต่งภาพแบนเนอร์ของแอดมิน

import React, { useState, useEffect } from 'react';
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
  /** คลาสสีพื้นหลังของไอคอน (ค่าเริ่มต้น: bg-blue-600 text-white) */
  iconBgClass?: string;
  /** ป้ายกำกับเล็กข้างชื่อ เช่น 'ม.3/1', 'โฮมรูม', 'SAR' */
  badgeText?: string;
  /** คลาสสีของป้ายกำกับ */
  badgeClass?: string;
  /** ข้อความแท็ก/Bullets ใต้คำอธิบาย เช่น 'สอบเก็บคะแนน • สอบกลางภาค • สอบปลายภาค' */
  tagText?: string;
  /** รายการแท็กแบบอาร์เรย์ (จะถูกเชื่อมด้วย ' • ' อัตโนมัติ) */
  tags?: string[];
  /** ไอคอนนำหน้าแท็ก (ค่าเริ่มต้น: ⏱) */
  tagIcon?: string | React.ReactNode;
  /** ข้อความคำคมหรือสโลแกนประจำหน้า (แสดง 2-3 บรรทัด) */
  quoteLines?: string[];
  /** ข้อความคำคมเดี่ยว (กรณีไม่ได้แยกบรรทัด) */
  quoteText?: string;
  /** ปุ่มคำสั่ง Action หรือ Dropdown เพิ่มเติม */
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
  iconBgClass = 'bg-blue-600 text-white',
  badgeText,
  badgeClass = 'bg-blue-100 text-blue-800 border-blue-200',
  tagText,
  tags,
  tagIcon = '⏱',
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

  const imageUrl = heroBanner.customUrl || heroBanner.defaultUrl || '/images/teacher/hero_banner.png';
  const opacity = (heroBanner.opacity ?? 100) / 100;
  const posX = heroBanner.positionX ?? 0;
  const posY = heroBanner.positionY ?? 0;
  const scale = (heroBanner.scale ?? 100) / 100;

  // จัดการข้อความแท็ก Bullets
  const combinedTagText = tagText || (tags && tags.length > 0 ? tags.join(' • ') : null);

  // จัดการคำคม (Quote)
  let activeQuoteLines: string[] = [];
  if (quoteLines && quoteLines.length > 0) {
    activeQuoteLines = quoteLines;
  } else if (quoteText) {
    activeQuoteLines = quoteText
      .replace(/^[“"']|[”"']$/g, '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (heroBanner.quoteText) {
    activeQuoteLines = heroBanner.quoteText
      .replace(/^[“"']|[”"']$/g, '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-blue-100/90 shadow-xs bg-sky-100 select-none transition-all ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Background Artwork & Pastel Gradient Fader                 */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={imageUrl}
          alt={title}
          style={{
            opacity,
            transform: `translate(${posX}%, ${posY}%) scale(${scale})`,
            transformOrigin: 'right center',
          }}
          className="w-full h-full object-cover object-right transition-all duration-300"
          onError={(e) => {
            if (e.currentTarget.src !== '/images/teacher/hero_banner.png') {
              e.currentTarget.src = '/images/teacher/hero_banner.png';
            }
          }}
        />
        {/* Soft Left Gradient Overlay รับประกันว่าข้อความและปุ่มอ่านง่าย ชัดเจน 100% */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-sky-50/80 sm:via-sky-50/70 to-transparent" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Banner Foreground Content                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="relative min-h-[110px] sm:min-h-[130px] flex flex-col md:flex-row md:items-center justify-between px-5 sm:px-8 py-4 sm:py-5 z-10 gap-4">
        {/* Left Section: Icon + Title & Subtitle + Tags */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3 sm:gap-3.5">
            {icon && (
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${iconBgClass} flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 border border-white/60`}
              >
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {title}
                </h1>
                {badgeText && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${badgeClass}`}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 leading-snug">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Bullets / Feature Tags Row under Subtitle */}
          {combinedTagText && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pl-14 flex-wrap">
              <span className="text-slate-400 shrink-0">{tagIcon}</span>
              <span className="leading-snug">{combinedTagText}</span>
            </div>
          )}
        </div>

        {/* Right Section: Stylized Thai Quote & Action Buttons */}
        <div className="flex items-center gap-4 self-end md:self-center shrink-0">
          {/* Stylized Thai Quote (ตรงตามภาพ media_1791433581154_fc64a813.png) */}
          {activeQuoteLines.length > 0 && (
            <div className="hidden md:flex flex-col items-end text-right pr-2 lg:pr-10 select-none">
              {activeQuoteLines.map((line, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === activeQuoteLines.length - 1;
                return (
                  <p
                    key={idx}
                    className="text-xs sm:text-sm font-bold text-slate-800 drop-shadow-xs flex items-center gap-1.5 justify-end leading-relaxed"
                  >
                    {isFirst && <span className="text-blue-900 font-black">“ </span>}
                    <span>{line}</span>
                    {isLast && (
                      <>
                        <span className="text-blue-900 font-black"> ”</span>
                        <span className="text-blue-500 font-normal">✈</span>
                      </>
                    )}
                  </p>
                );
              })}
            </div>
          )}

          {/* Actions (Buttons / Filters / Switchers) */}
          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}

          {/* Admin Banner Settings Quick Trigger */}
          {isAdmin && onOpenBannerSettings && (
            <button
              type="button"
              onClick={onOpenBannerSettings}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold shadow-xs backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
              title="ปรับแต่งภาพแบนเนอร์และตำแหน่ง (Admin)"
            >
              ⚙️ แบนเนอร์
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
