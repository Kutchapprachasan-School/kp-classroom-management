import React from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { gachaService, type GachaBuddy } from '../../services/gachaService';
import { ChibiBuddyAvatar } from './ChibiBuddyAvatar';

interface AdventureHeroCardProps {
  onGoToMissions: () => void;
  activeBuddy?: GachaBuddy;
}

export const AdventureHeroCard: React.FC<AdventureHeroCardProps> = ({
  onGoToMissions,
  activeBuddy,
}) => {
  const currentBuddy = activeBuddy || gachaService.getActiveBuddy();

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/40 border border-emerald-200/90 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Left: Active Anime Buddy in clean white tile with Rarity Tag */}
      <div className="relative shrink-0 flex flex-col items-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/95 rounded-2xl border-2 border-emerald-200/90 flex items-center justify-center shadow-md relative overflow-hidden p-2">
          <ChibiBuddyAvatar
            buddy={currentBuddy}
            size="lg"
            showName={false}
            isAnimated={true}
          />
        </div>
        <span
          className={`-mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs tracking-wider z-10 ${currentBuddy.badgeBg}`}
        >
          {currentBuddy.rarity}
        </span>
      </div>

      {/* Right: Buddy Speech, Adventure Text & Action Button */}
      <div className="flex-1 text-center sm:text-left space-y-2 relative z-10 min-w-0">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 tracking-wide bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>คู่หูบัดดี้: {currentBuddy.name} พร้อมลุยเคียงข้างคุณ!</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 border border-emerald-200 text-teal-800">
            Lv. 2
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
          มี 1 ภารกิจ รอคุณลงมือ
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
          เลือกสักหนึ่งงาน แล้วเริ่มจากก้าวเล็ก ๆ {currentBuddy.name} พร้อมมอบบัฟและเติบโตไปด้วยกัน
        </p>

        {/* Active Skill Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 border border-emerald-200 text-[11px] font-semibold text-emerald-900 shadow-2xs max-w-full">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
          <span className="truncate">
            ✦ บัฟทำงาน: {currentBuddy.skillName} ({currentBuddy.skillDesc})
          </span>
        </div>

        <div className="pt-1.5">
          <button
            onClick={onGoToMissions}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C6D5B] hover:bg-[#095748] text-white text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <span>ไปทำภารกิจ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
