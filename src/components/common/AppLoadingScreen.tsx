import React, { useState } from 'react';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import { getSchoolSettings } from '../../config/schoolRoles';

interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = 'กำลังเตรียมข้อมูลห้องเรียนและระบบการสอน...',
  subMessage = 'โรงเรียนกุดจับประชาสรรค์ • ระบบบริหารจัดการชั้นเรียน',
}) => {
  const schoolSettings = getSchoolSettings();
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [hasLogoError, setHasLogoError] = useState(false);

  // ดึงโลโก้ทางการจากข้อมูลโรงเรียน (ถ้ายังไม่โหลด หรือโหลดไม่ติด จะไม่แสดงขึ้นมาเด็ดขาด)
  const logoUrl = schoolSettings.logoUrl?.trim() || '';
  const canShowLogo = Boolean(logoUrl) && !hasLogoError;

  return (
    <div
      role="status"
      aria-label="กำลังโหลดระบบ"
      className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-[#F7FAFF] overflow-hidden select-none font-sans px-4 animate-fade-in"
    >
      {/* Decorative Soft Pastel Glow Blobs (Anime Aesthetic) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none animate-pulse" />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-100/40 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDelay: '1s' }}
      />

      {/* Main Glassmorphic Pastel Card */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[360px] p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E6EEF7] shadow-[0_8px_32px_rgba(40,90,140,0.08)] text-center transition-all duration-300">
        {/* แสดงเฉพาะเมื่อโลโก้โรงเรียนโหลดเสร็จสมบูรณ์แล้วเท่านั้น (ถ้ายังไม่โหลด ไม่เอาขึ้น) */}
        {canShowLogo && (
          <div
            className={`relative mb-5 flex items-center justify-center transition-all duration-500 ease-out ${
              isLogoLoaded
                ? 'opacity-100 scale-100 max-h-32'
                : 'opacity-0 scale-90 max-h-0 pointer-events-none overflow-hidden mb-0'
            }`}
          >
            <div
              className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-md animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-white to-blue-50/50 border border-blue-100/80 p-2 shadow-[0_4px_16px_rgba(59,130,246,0.12)] flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl}
                alt={schoolSettings.nameTh}
                className="w-full h-full object-contain drop-shadow-xs"
                onLoad={() => setIsLogoLoaded(true)}
                onError={() => {
                  setHasLogoError(true);
                  setIsLogoLoaded(false);
                }}
              />
            </div>
            {/* Cute anime sparkles pill */}
            <span className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
              <SparklesRegular className="w-3 h-3 text-amber-300" />
              <span>KPS</span>
            </span>
          </div>
        )}

        {/* School Name & System Title */}
        <h1 className="text-lg sm:text-xl font-bold text-[#163A66] tracking-tight">
          {schoolSettings.nameTh || 'โรงเรียนกุดจับประชาสรรค์'}
        </h1>
        <p className="text-xs font-semibold text-blue-600 mt-0.5">
          {schoolSettings.classroomSystemTitle || 'ระบบจัดการชั้นเรียน'}
        </p>

        {/* Shimmering Animated Pastel Progress Bar */}
        <div className="w-full mt-6 mb-3">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 animate-[shimmer_1.6s_infinite_linear]"
              style={{
                width: '100%',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>

        {/* Loading Message & Bouncing Dots */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B7C93] font-medium mt-1">
          <span>{message}</span>
          <span className="inline-flex gap-0.5 items-center">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 font-normal truncate max-w-[280px]">
          {subMessage}
        </p>
      </div>

      {/* Subtle bottom footer copyright */}
      <div className="absolute bottom-5 text-center text-[11px] text-slate-400/90 font-medium">
        Kutchapprachasan School Management • 2569
      </div>
    </div>
  );
};

export default AppLoadingScreen;
