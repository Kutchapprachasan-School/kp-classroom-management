import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { gachaService, type GachaBuddy } from '../../services/gachaService';
import { ChibiBuddyAvatar } from './ChibiBuddyAvatar';

interface CompanionCardProps {
  name?: string;
  title?: string;
  level?: number;
  currentXp?: number;
  nextLevelXp?: number;
  activeBuddy?: GachaBuddy;
  onChangeCompanion?: () => void;
  onOpenGacha?: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  name = 'โมจิ',
  title = 'จิ้งจอกใบไม้ · เติบโตไปด้วยกัน',
  level = 1,
  currentXp = 650,
  nextLevelXp = 1000,
  activeBuddy,
  onChangeCompanion,
  onOpenGacha,
}) => {
  const currentBuddy = activeBuddy || gachaService.getActiveBuddy();
  const displayName = currentBuddy?.name || name;
  const displayTitle = currentBuddy?.title || title;
  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm text-center space-y-4 relative overflow-hidden">
      {/* Soft header background */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
            คู่หูการเรียนรู้
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${currentBuddy.badgeBg}`}>
          {currentBuddy.rarity}
        </span>
      </div>

      {/* Mascot Preview Box with Chibi Avatar */}
      <div className="w-24 h-24 mx-auto bg-gradient-to-b from-slate-50 to-indigo-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-center p-2 shadow-2xs">
        <ChibiBuddyAvatar
          buddy={currentBuddy}
          size="md"
          showName={false}
          isAnimated={true}
        />
      </div>

      {/* Name & Title */}
      <div>
        <div className="flex items-center justify-center gap-1.5">
          <h4 className="font-black text-slate-900 text-base">{displayName}</h4>
          <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-bold border border-teal-200">
            Lv. {level}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{displayTitle}</p>
        <div className="mt-2 text-[11px] text-purple-700 font-semibold bg-purple-50/80 px-2.5 py-1 rounded-xl border border-purple-100 line-clamp-1">
          ✦ {currentBuddy.skillName}: {currentBuddy.skillDesc}
        </div>
      </div>

      {/* Level & XP Progress Bar */}
      <div className="space-y-1.5 text-left pt-1">
        <div className="flex justify-between text-xs text-slate-600 font-bold">
          <span>ความผูกพัน</span>
          <span className="tabular-nums">
            {currentXp} / {nextLevelXp} XP
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-gradient-to-r from-teal-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(xpPercent, 2)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons: Change Companion & Open Gacha */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onChangeCompanion}
          className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>สลับคู่หู</span>
        </button>

        <button
          onClick={onOpenGacha || onChangeCompanion}
          className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>สุ่มกาชา</span>
        </button>
      </div>
    </div>
  );
};
