import React from 'react';
import { Sparkles, Quote } from 'lucide-react';
import { getSchoolSettings } from '../../config/schoolRoles';

interface AdminHeroBannerProps {
  schoolName?: string;
  quote?: string;
}

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({
  schoolName = getSchoolSettings().nameTh,
  quote = 'การศึกษา คือ รากฐาน ของอนาคตที่มั่นคง',
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#EEF4FF] via-[#F8FAFF] to-[#E8F2FE] border border-blue-100 shadow-[0_2px_12px_rgba(37,99,235,0.04)] select-none">
      {/* Background Decorative Graphic / Photo on Right */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 overflow-hidden pointer-events-none opacity-85 sm:opacity-90">
        <div className="absolute inset-0 bg-gradient-to-r from-[#EEF4FF] sm:from-[#EEF4FF] via-transparent to-transparent z-10" />
        <img
          src="/images/admin/hero_building.png"
          alt={`${schoolName} อาคารเรียน`}
          className="w-full h-full object-cover object-center sm:object-right"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <div className="relative z-20 px-4 sm:px-7 py-5 sm:py-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Welcoming Title & Subtitle */}
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] sm:text-[11px] font-bold shadow-xs">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>ยินดีต้อนรับ</span>
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            ยินดีต้อนรับสู่ระบบบริหารจัดการโรงเรียน
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {schoolName} ระบบครบวงจร เพื่อการบริหารที่ดีกว่า
          </p>
        </div>

        {/* Right Side: Quote Pill matching Image */}
        <div className="self-end lg:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.06)] text-slate-700 text-xs sm:text-[13px] font-medium">
            <Quote className="w-3.5 h-3.5 text-blue-500 shrink-0 rotate-180" />
            <span className="italic">"{quote}"</span>
          </div>
        </div>
      </div>
    </div>
  );
};
