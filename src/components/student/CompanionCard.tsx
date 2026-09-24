import React from 'react';
import { PixelPet } from '../common/PixelPet';

interface CompanionCardProps {
  name?: string;
  title?: string;
  level?: number;
  currentXp?: number;
  nextLevelXp?: number;
  onChangeCompanion?: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  name = 'โมจิ',
  title = 'จิ้งจอกใบไม้ · เติบโตไปด้วยกัน',
  level = 1,
  currentXp = 0,
  nextLevelXp = 100,
  onChangeCompanion,
}) => {
  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card text-center space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
          คู่ของฉัน
        </h3>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[11px] font-semibold">
          Lv. {level}
        </span>
      </div>

      {/* Mascot Preview Box */}
      <div className="w-28 h-28 mx-auto bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-center p-3">
        <PixelPet size={84} />
      </div>

      {/* Name & Title */}
      <div>
        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{name}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{title}</p>
      </div>

      {/* Level & XP Progress Bar */}
      <div className="space-y-1.5 text-left">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>เลเวล {level}</span>
          <span>
            {currentXp} / {nextLevelXp} XP
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(xpPercent, 2)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 text-center pt-0.5">
          อีก {nextLevelXp - currentXp} XP จะถึงเลเวล {level + 1}
        </p>
      </div>

      {/* Change Companion Button */}
      <button
        onClick={onChangeCompanion}
        className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
      >
        เปลี่ยนคู่หู
      </button>
    </div>
  );
};
