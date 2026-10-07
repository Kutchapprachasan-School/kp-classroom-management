import React from 'react';
import { Settings, Sparkles, Heart } from 'lucide-react';

interface SettingsHeroBannerProps {
  schoolName?: string;
}

export const SettingsHeroBanner: React.FC<SettingsHeroBannerProps> = ({
  schoolName: _schoolName = 'โรงเรียนคำยางพิทยา',
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-blue-100 bg-gradient-to-r from-[#EBF5FF] via-[#F4F9FF] to-[#E9F3FE] p-5 sm:p-6 shadow-xs select-none">
      {/* Background Campus Illustration Accent */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Large Gear Icon & Title */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border-2 border-white">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8 animate-spin-slow" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#163A66] tracking-tight">
                ตั้งค่า
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/80 text-blue-800 border border-blue-200">
                System Settings
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#6B7C93]">
              จัดการข้อมูลและการตั้งค่าระบบของคุณ
            </p>
          </div>
        </div>

        {/* Right Side: Anime High School Girl & Cute Speech Bubble */}
        <div className="flex items-center justify-end gap-3 shrink-0 self-end md:self-center">
          {/* Speech Bubble */}
          <div className="relative bg-white/95 backdrop-blur-xs border border-blue-200/80 text-[#163A66] px-3.5 py-2 rounded-2xl shadow-xs text-xs font-bold flex items-center gap-1.5 animate-bounce-subtle">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>การตั้งค่าที่ถูกต้อง ช่วยให้การทำงานง่ายขึ้นนะคะ</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
            {/* Speech triangle pointing right */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-l-6 border-l-white" />
          </div>

          {/* Anime Student Avatar Circle */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-b from-blue-100 to-sky-200 shrink-0">
            <img
              src="/images/banners/student-avatar-girl.png"
              alt="Mascot Student"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to cute svg representation if image is missing
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            {/* Fallback decorative sparkles */}
            <div className="absolute inset-0 flex items-center justify-center text-xl pointer-events-none">
              ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
