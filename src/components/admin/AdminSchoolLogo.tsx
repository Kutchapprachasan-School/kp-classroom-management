import React from 'react';

interface AdminSchoolLogoProps {
  className?: string;
  size?: number;
}

export const AdminSchoolLogo: React.FC<AdminSchoolLogoProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div
      className={`shrink-0 flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="50" y1="20" x2="50" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="20" y1="10" x2="80" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="ribbonGrad" x1="10" y1="85" x2="90" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>

        {/* Crown/Flame Top ornament */}
        <path
          d="M50 4 C54 12 60 15 62 20 C57 19 54 22 50 25 C46 22 43 19 38 20 C40 15 46 12 50 4 Z"
          fill="url(#goldGrad)"
        />
        <circle cx="50" cy="14" r="2.5" fill="#FEF08A" />

        {/* Main Royal Shield */}
        <path
          d="M26 23 C42 22 50 18 50 18 C50 18 58 22 74 23 C76 45 74 68 50 86 C26 68 24 45 26 23 Z"
          fill="url(#shieldGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="3"
        />

        {/* Inner Shield Border */}
        <path
          d="M30 27 C42 26 50 22 50 22 C50 22 58 26 70 27 C71 44 69 64 50 79 C31 64 29 44 30 27 Z"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Center Torch / Lotus / Knowledge Book */}
        <path
          d="M38 52 C42 48 48 49 50 54 C52 49 58 48 62 52 C61 58 55 60 50 63 C45 60 39 58 38 52 Z"
          fill="#FEF08A"
        />
        <path
          d="M50 34 L54 44 L46 44 Z"
          fill="#F59E0B"
        />
        <circle cx="50" cy="40" r="3.5" fill="#EF4444" />

        {/* Thai character insignia "ศ.ว." */}
        <text
          x="50"
          y="71"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="9.5"
          fontWeight="bold"
          fontFamily="'Prompt', sans-serif"
          letterSpacing="0.5"
        >
          ศ.ว.
        </text>

        {/* Bottom Banner Ribbon */}
        <path
          d="M16 86 L30 80 L32 90 L18 96 Z"
          fill="url(#ribbonGrad)"
        />
        <path
          d="M84 86 L70 80 L68 90 L82 96 Z"
          fill="url(#ribbonGrad)"
        />
        <path
          d="M24 84 C38 92 62 92 76 84 L76 95 C62 103 38 103 24 95 Z"
          fill="url(#ribbonGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="1.2"
        />
        <path
          d="M32 90 C42 94 58 94 68 90"
          stroke="#FEF08A"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    </div>
  );
};
