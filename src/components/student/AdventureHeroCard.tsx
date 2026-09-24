import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PixelPet } from '../common/PixelPet';

interface AdventureHeroCardProps {
  onGoToMissions: () => void;
}

export const AdventureHeroCard: React.FC<AdventureHeroCardProps> = ({
  onGoToMissions,
}) => {
  return (
    <div className="bg-[#e2f7e7] border border-[#c4ebd0] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
      {/* Left: Pixel Art Mascot in clean white tile */}
      <div className="w-24 h-24 bg-white/90 rounded-2xl border border-white flex items-center justify-center shadow-xs shrink-0">
        <PixelPet size={72} />
      </div>

      {/* Right: Adventure Text & Action Button */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <span className="text-xs font-semibold text-emerald-800 tracking-wide">
          พร้อมออกผจญภัยแล้ว!
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">
          มี 1 ภารกิจ รอคุณลงมือ
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
          เลือกสักหนึ่งงาน แล้วเริ่มจากก้าวเล็ก ๆ คู่หูของคุณพร้อมเติบโตไปด้วยกัน
        </p>

        <div className="pt-2">
          <button
            onClick={onGoToMissions}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e3c88] hover:bg-[#0b3272] text-white text-xs font-medium rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <span>ไปทำภารกิจ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
