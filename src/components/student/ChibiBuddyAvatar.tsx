import React from 'react';
import type { GachaBuddy, GachaRarity } from '../../services/gachaService';

interface ChibiBuddyAvatarProps {
  buddy: GachaBuddy;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showBadge?: boolean;
  isUnlocked?: boolean;
  showLock?: boolean;
  isAnimated?: boolean;
  onClick?: () => void;
}

export const ChibiBuddyAvatar: React.FC<ChibiBuddyAvatarProps> = ({
  buddy,
  size = 'md',
  showName = true,
  showBadge = false,
  isUnlocked = true,
  showLock = false,
  isAnimated = false,
  onClick,
}) => {
  const sizeMap = {
    sm: { container: 'w-14 h-14 sm:w-16 sm:h-16', text: 'text-[11px] sm:text-xs' },
    md: { container: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-xs sm:text-sm' },
    lg: { container: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-sm sm:text-base' },
    xl: { container: 'w-32 h-32 sm:w-36 sm:h-36', text: 'text-base font-bold' },
  };

  const rarityGlow: Record<GachaRarity, string> = {
    COMMON: 'shadow-2xs border-slate-200 bg-white hover:border-slate-300',
    UNCOMMON: 'shadow-2xs border-emerald-200 bg-white hover:border-emerald-300',
    RARE: 'shadow-2xs border-blue-200 bg-white hover:border-blue-300',
    EPIC: 'shadow-2xs border-purple-200 bg-white hover:border-purple-300',
    LEGENDARY: 'shadow-xs border-amber-300 bg-white hover:border-amber-400',
    MYTHIC: 'shadow-xs border-rose-300 bg-white hover:border-rose-400',
  };

  const isActuallyLocked = showLock && !isUnlocked;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center select-none group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`relative ${sizeMap[size].container} rounded-2xl border-2 flex items-center justify-center transition-all duration-300 overflow-hidden ${
          rarityGlow[buddy.rarity]
        } ${
          isAnimated ? 'hover:scale-105 hover:-translate-y-0.5 hover:shadow-md' : ''
        } ${isActuallyLocked ? 'grayscale opacity-60' : ''}`}
      >
        {/* Soft background aura for high rarities */}
        {buddy.rarity === 'LEGENDARY' && (
          <div className="absolute inset-0 bg-radial from-amber-300/20 to-transparent pointer-events-none" />
        )}
        {buddy.rarity === 'MYTHIC' && (
          <div className="absolute inset-0 bg-radial from-rose-400/25 via-pink-300/10 to-transparent pointer-events-none" />
        )}

        {/* Real Chibi Anime Character Artwork */}
        <img
          src={`/images/buddies/${buddy.id}.png`}
          alt={buddy.name}
          className="w-full h-full object-cover rounded-xl transform transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            // Fallback decorative styling if needed
            (e.target as HTMLElement).style.opacity = '0.8';
          }}
        />

        {/* Optional Locked Overlay (Only if explicitly enabled) */}
        {isActuallyLocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[11px] font-bold">
            🔒
          </div>
        )}
      </div>

      {/* Name Label */}
      {showName && (
        <span
          className={`mt-1 font-bold text-slate-800 text-center truncate max-w-[80px] leading-tight ${sizeMap[size].text}`}
        >
          {buddy.name}
        </span>
      )}

      {/* Rarity Pill Badge */}
      {showBadge && (
        <span
          className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold mt-0.5 ${buddy.badgeBg}`}
        >
          {buddy.rarity}
        </span>
      )}
    </div>
  );
};
