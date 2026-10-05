import React from 'react';
import type { GachaBuddy, GachaRarity } from '../../services/gachaService';

interface ChibiBuddyAvatarProps {
  buddy: GachaBuddy;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showBadge?: boolean;
  isUnlocked?: boolean;
  isAnimated?: boolean;
  onClick?: () => void;
}

export const ChibiBuddyAvatar: React.FC<ChibiBuddyAvatarProps> = ({
  buddy,
  size = 'md',
  showName = true,
  showBadge = false,
  isUnlocked = true,
  isAnimated = false,
  onClick,
}) => {
  const sizeMap = {
    sm: { container: 'w-12 h-12', avatar: 48, text: 'text-[10px]' },
    md: { container: 'w-16 h-16', avatar: 64, text: 'text-xs' },
    lg: { container: 'w-24 h-24', avatar: 96, text: 'text-sm' },
    xl: { container: 'w-32 h-32', avatar: 128, text: 'text-base font-bold' },
  };

  const { hairColor, eyeColor, gender } = buddy.chibiDetails;

  const rarityGlow: Record<GachaRarity, string> = {
    COMMON: 'shadow-sm border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100',
    UNCOMMON: 'shadow-sm border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/60 ring-1 ring-emerald-200',
    RARE: 'shadow-md border-blue-300 bg-gradient-to-b from-blue-50 to-indigo-100/60 ring-1 ring-blue-300',
    EPIC: 'shadow-md border-purple-300 bg-gradient-to-b from-purple-50 to-fuchsia-100/60 ring-2 ring-purple-400',
    LEGENDARY: 'shadow-lg border-amber-300 bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-100/70 ring-2 ring-amber-400',
    MYTHIC: 'shadow-xl border-rose-300 bg-gradient-to-b from-rose-50 via-pink-100 to-indigo-100 ring-2 ring-rose-400 animate-pulse',
  };

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
          isAnimated ? 'hover:scale-105 hover:-translate-y-0.5' : ''
        } ${!isUnlocked ? 'grayscale opacity-60' : ''}`}
      >
        {/* Soft background aura for high rarities */}
        {buddy.rarity === 'LEGENDARY' && (
          <div className="absolute inset-0 bg-radial from-amber-300/30 to-transparent pointer-events-none" />
        )}
        {buddy.rarity === 'MYTHIC' && (
          <div className="absolute inset-0 bg-radial from-pink-400/40 via-purple-300/20 to-transparent pointer-events-none animate-spin-slow" />
        )}

        {/* Chibi SVG Character Illustration */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform transition-transform group-hover:scale-110"
        >
          <defs>
            {/* Skin gradient */}
            <linearGradient id={`skin-${buddy.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF1E6" />
              <stop offset="100%" stopColor="#FED7AA" />
            </linearGradient>

            {/* Hair gradient */}
            <linearGradient id={`hair-${buddy.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hairColor} />
              <stop offset="100%" stopColor={hairColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Body & Uniform */}
          <path
            d="M32 75 Q25 90 20 95 L80 95 Q75 90 68 75 Z"
            fill="#1E293B"
          />
          {/* White School Collar / Tie */}
          <polygon points="50,75 42,65 58,65" fill="#FFFFFF" />
          <polygon
            points="50,72 47,88 50,92 53,88"
            fill={buddy.accentColor || '#3B82F6'}
          />

          {/* Head */}
          <circle cx="50" cy="50" r="28" fill={`url(#skin-${buddy.id})`} />

          {/* Ears */}
          <circle cx="23" cy="52" r="5" fill="#FDBA74" />
          <circle cx="77" cy="52" r="5" fill="#FDBA74" />

          {/* Hair back (if long) */}
          {gender === 'girl' && (
            <path
              d="M24 45 Q15 65 20 85 Q30 75 35 60 L65 60 Q70 75 80 85 Q85 65 76 45 Z"
              fill={`url(#hair-${buddy.id})`}
              opacity="0.9"
            />
          )}

          {/* Eyes (Cute anime shine) */}
          <ellipse cx="40" cy="53" rx="4.5" ry="6" fill={eyeColor} />
          <ellipse cx="60" cy="53" rx="4.5" ry="6" fill={eyeColor} />
          {/* Eye sparkles */}
          <circle cx="39" cy="51" r="1.8" fill="#FFFFFF" />
          <circle cx="41.5" cy="55" r="0.9" fill="#FFFFFF" />
          <circle cx="59" cy="51" r="1.8" fill="#FFFFFF" />
          <circle cx="61.5" cy="55" r="0.9" fill="#FFFFFF" />

          {/* Blush */}
          <ellipse cx="32" cy="58" rx="3.5" ry="2" fill="#F43F5E" opacity="0.35" />
          <ellipse cx="68" cy="58" rx="3.5" ry="2" fill="#F43F5E" opacity="0.35" />

          {/* Cute Smile */}
          <path
            d="M46 60 Q50 63 54 60"
            stroke="#991B1B"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Front Hair Bangs */}
          <path
            d="M22 45 Q30 22 50 22 Q70 22 78 45 Q70 38 60 38 Q50 42 45 38 Q35 38 22 45 Z"
            fill={`url(#hair-${buddy.id})`}
          />
          <path
            d="M42 35 Q48 45 40 48 Q44 40 50 36"
            fill={`url(#hair-${buddy.id})`}
          />
          <path
            d="M58 35 Q52 45 60 48 Q56 40 50 36"
            fill={`url(#hair-${buddy.id})`}
          />

          {/* Distinct Hair Accessories / Features */}
          {buddy.id === 'buddy-c2' && (
            /* แว่นตา น้องแป้ง */
            <g stroke="#78350F" strokeWidth="1.6" fill="none">
              <circle cx="40" cy="53" r="7" />
              <circle cx="60" cy="53" r="7" />
              <line x1="47" y1="53" x2="53" y2="53" />
            </g>
          )}

          {buddy.id === 'buddy-u2' && (
            /* แว่นตาสี่เหลี่ยม น้องต้น */
            <g stroke="#0F172A" strokeWidth="1.6" fill="none">
              <rect x="33" y="47" width="14" height="12" rx="2" />
              <rect x="53" y="47" width="14" height="12" rx="2" />
              <line x1="47" y1="53" x2="53" y2="53" />
            </g>
          )}

          {buddy.id === 'buddy-c3' && (
            /* หูฟัง น้องซัน */
            <g fill="#2563EB">
              <rect x="18" y="44" width="7" height="16" rx="3" />
              <rect x="75" y="44" width="7" height="16" rx="3" />
              <path d="M22 44 Q50 20 78 44" stroke="#1E293B" strokeWidth="3" fill="none" />
            </g>
          )}

          {buddy.id === 'buddy-u3' && (
            /* หูฟังแมว น้องเจน */
            <g>
              <polygon points="28,26 36,12 42,24" fill="#10B981" />
              <polygon points="31,24 36,15 39,23" fill="#D1FAE5" />
              <polygon points="72,26 64,12 58,24" fill="#10B981" />
              <polygon points="69,24 64,15 61,23" fill="#D1FAE5" />
            </g>
          )}

          {buddy.id === 'buddy-r2' && (
            /* โบว์ชมพู น้องโนจิ */
            <g fill="#EC4899">
              <polygon points="26,30 18,20 28,22" />
              <polygon points="26,30 18,40 28,38" />
              <circle cx="26" cy="30" r="3" fill="#F472B6" />
              <polygon points="74,30 82,20 72,22" />
              <polygon points="74,30 82,40 72,38" />
              <circle cx="74" cy="30" r="3" fill="#F472B6" />
            </g>
          )}

          {buddy.id === 'buddy-e3' && (
            /* หูแมวทอง น้องมิ้น */
            <g fill="#EAB308">
              <polygon points="26,26 32,10 40,24" />
              <polygon points="29,23 33,13 38,22" fill="#FEF08A" />
              <polygon points="74,26 68,10 60,24" />
              <polygon points="71,23 67,13 62,22" fill="#FEF08A" />
            </g>
          )}

          {buddy.id === 'buddy-l1' && (
            /* มงกุฎไฟ น้องวาเลน */
            <g fill="#EF4444">
              <polygon points="42,20 50,8 58,20 64,14 62,24 38,24 36,14" fill="#DC2626" />
              <circle cx="50" cy="18" r="2.5" fill="#FEF08A" />
            </g>
          )}

          {buddy.id === 'buddy-m1' && (
            /* ปีกแสงเทพธิดา น้องเซเรน */
            <g fill="#F43F5E">
              <polygon points="20,35 10,20 24,25" fill="#FECDD3" />
              <polygon points="80,35 90,20 76,25" fill="#FECDD3" />
              <circle cx="50" cy="16" r="3.5" fill="#FFE4E6" stroke="#FB7185" strokeWidth="1" />
            </g>
          )}

          {buddy.id === 'buddy-m2' && (
            /* ออร่าดวงดาว น้องไนท์ */
            <g fill="#60A5FA">
              <circle cx="50" cy="15" r="2" fill="#93C5FD" />
              <polygon points="50,11 52,15 56,15 53,18 54,22 50,19 46,22 47,18 44,15 48,15" fill="#FDE047" />
            </g>
          )}
        </svg>

        {/* Locked Overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[11px] font-bold">
            🔒
          </div>
        )}
      </div>

      {/* Name Label */}
      {showName && (
        <span
          className={`mt-1.5 font-bold text-slate-800 text-center truncate max-w-[84px] leading-tight ${sizeMap[size].text}`}
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
