import React from 'react';

interface JiuMeowProps {
  size?: number;
  className?: string;
  mood?: 'happy' | 'sparkle' | 'eating' | 'sleeping';
}

export const JiuMeowMascot: React.FC<JiuMeowProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className="drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id="jmBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>

          <linearGradient id="jmBlueAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="jmEyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          <linearGradient id="jmCheekGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </linearGradient>

          <filter id="jmGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Soft Aura/Shadow under body */}
        <ellipse cx="80" cy="148" rx="46" ry="9" fill="#0284C7" opacity="0.18" />

        {/* Tail (Curled fluff with blue tip) */}
        <path
          d="M118 120 C138 126 150 108 142 90 C136 78 122 84 126 96 C129 104 122 114 112 118 Z"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M136 82 C144 86 142 98 132 98 C124 94 128 84 136 82 Z"
          fill="url(#jmBlueAccent)"
        />

        {/* Left Ear */}
        <path
          d="M42 62 C34 40 40 22 56 16 C68 28 72 44 68 64 Z"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2.5"
        />
        {/* Left Inner Ear (Blue Gradient) */}
        <path
          d="M46 54 C40 38 46 26 54 22 C62 30 64 42 62 56 Z"
          fill="url(#jmBlueAccent)"
        />
        {/* Ear fluff */}
        <path
          d="M48 48 C44 44 48 40 52 42"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Ear */}
        <path
          d="M118 62 C126 40 120 22 104 16 C92 28 88 44 92 64 Z"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2.5"
        />
        {/* Right Inner Ear (Blue Gradient) */}
        <path
          d="M114 54 C120 38 114 26 106 22 C98 30 96 42 98 56 Z"
          fill="url(#jmBlueAccent)"
        />
        {/* Ear fluff */}
        <path
          d="M112 48 C116 44 112 40 108 42"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main Body (Plump round chibi cat body) */}
        <ellipse
          cx="80"
          cy="120"
          rx="44"
          ry="30"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2.5"
        />

        {/* Paws (Front 2 Little white paws with pink pads) */}
        <ellipse cx="64" cy="142" rx="11" ry="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
        <ellipse cx="96" cy="142" rx="11" ry="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />

        {/* Head Shape */}
        <circle
          cx="80"
          cy="74"
          r="45"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2.5"
        />

        {/* Blue Forehead Diamond / Crown Crest */}
        <path
          d="M80 38 L86 48 L80 58 L74 48 Z"
          fill="url(#jmBlueAccent)"
          filter="url(#jmGlow)"
        />
        <circle cx="80" cy="48" r="2.5" fill="#FFFFFF" />

        {/* Side Cheeks fluff */}
        <path
          d="M36 78 C30 76 28 84 34 88 C30 90 34 96 40 94"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2"
        />
        <path
          d="M124 78 C130 76 132 84 126 88 C130 90 126 96 120 94"
          fill="url(#jmBodyGrad)"
          stroke="#93C5FD"
          strokeWidth="2"
        />

        {/* Cute Pink Blushing Cheeks */}
        <ellipse cx="52" cy="85" rx="8" ry="5" fill="url(#jmCheekGrad)" />
        <ellipse cx="108" cy="85" rx="8" ry="5" fill="url(#jmCheekGrad)" />

        {/* Big Sparkling Anime Eyes */}
        {mood === 'sleeping' ? (
          <>
            <path
              d="M52 76 Q60 84 68 76"
              stroke="#1E3A8A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M92 76 Q100 84 108 76"
              stroke="#1E3A8A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <ellipse cx="60" cy="74" rx="10" ry="13" fill="url(#jmEyeGrad)" />
            {/* Pupil depth */}
            <ellipse cx="60" cy="72" rx="7" ry="10" fill="#0F172A" />
            {/* Big sparkle */}
            <circle cx="57" cy="68" r="4.2" fill="#FFFFFF" />
            {/* Bottom sparkle */}
            <circle cx="63" cy="78" r="2" fill="#93C5FD" />
            <circle cx="64" cy="81" r="1.2" fill="#FFFFFF" />

            {/* Right Eye */}
            <ellipse cx="100" cy="74" rx="10" ry="13" fill="url(#jmEyeGrad)" />
            {/* Pupil depth */}
            <ellipse cx="100" cy="72" rx="7" ry="10" fill="#0F172A" />
            {/* Big sparkle */}
            <circle cx="97" cy="68" r="4.2" fill="#FFFFFF" />
            {/* Bottom sparkle */}
            <circle cx="103" cy="78" r="2" fill="#93C5FD" />
            <circle cx="104" cy="81" r="1.2" fill="#FFFFFF" />
          </>
        )}

        {/* Small Cute Pink Nose */}
        <polygon points="80,81 77,84 83,84" fill="#F43F5E" />

        {/* Cat Smile Mouth (ω shape) */}
        <path
          d="M74 85 Q77 89 80 86 Q83 89 86 85"
          stroke="#1E293B"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Collar & Bell */}
        <path
          d="M54 108 Q80 116 106 108"
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Golden Bell / Jewel */}
        <circle cx="80" cy="114" r="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="80" cy="115" r="1.8" fill="#78350F" />
        <line x1="80" y1="117" x2="80" y2="120" stroke="#78350F" strokeWidth="1.2" />

        {/* Whiskers */}
        <line x1="38" y1="80" x2="26" y2="78" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="37" y1="84" x2="24" y2="85" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="122" y1="80" x2="134" y2="78" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="123" y1="84" x2="136" y2="85" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />

        {/* Sparkles around (if sparkle mood) */}
        {mood === 'sparkle' && (
          <>
            <path
              d="M24 40 L28 48 L36 52 L28 56 L24 64 L20 56 L12 52 L20 48 Z"
              fill="#FDE047"
              filter="url(#jmGlow)"
            />
            <path
              d="M136 34 L139 40 L145 43 L139 46 L136 52 L133 46 L127 43 L133 40 Z"
              fill="#67E8F9"
              filter="url(#jmGlow)"
            />
          </>
        )}
      </svg>
    </div>
  );
};

export const AnimeStudentHero: React.FC<{ size?: number; className?: string }> = ({
  size = 140,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg viewBox="0 0 140 140" width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="ashSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF1EB" />
            <stop offset="100%" stopColor="#FDE2D6" />
          </linearGradient>
          <linearGradient id="ashHair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="ashEye" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Neck */}
        <rect x="63" y="80" width="14" height="18" fill="url(#ashSkin)" />

        {/* School Uniform Shirt Collar */}
        <polygon points="44,98 70,128 50,135 34,106" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <polygon points="96,98 70,128 90,135 106,106" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <polygon points="60,98 70,118 80,98 70,92" fill="#0284C7" />
        {/* Backpack Straps */}
        <rect x="36" y="104" width="8" height="32" rx="4" fill="#1E293B" />
        <rect x="96" y="104" width="8" height="32" rx="4" fill="#1E293B" />

        {/* Head Contour */}
        <path
          d="M46 54 C46 36 60 22 70 22 C80 22 94 36 94 54 C94 74 82 86 70 86 C58 86 46 74 46 54 Z"
          fill="url(#ashSkin)"
        />

        {/* Ears */}
        <circle cx="44" cy="58" r="7" fill="url(#ashSkin)" />
        <circle cx="96" cy="58" r="7" fill="url(#ashSkin)" />

        {/* Eyes (Anime boy style) */}
        <ellipse cx="58" cy="56" rx="5" ry="7" fill="url(#ashEye)" />
        <ellipse cx="82" cy="56" rx="5" ry="7" fill="url(#ashEye)" />
        <circle cx="56" cy="53" r="2.2" fill="#FFFFFF" />
        <circle cx="80" cy="53" r="2.2" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M52 46 Q58 43 64 47" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M76 47 Q82 43 88 46" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Nose & Smile */}
        <polygon points="70,62 68,66 72,66" fill="#F87171" opacity="0.6" />
        <path d="M64 71 Q70 76 76 71" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Anime Hair (Layered Spikes) */}
        <path
          d="M40 50 C36 34 46 16 70 14 C94 16 104 34 100 50 C94 40 88 38 84 42 C82 34 74 30 70 34 C64 30 58 34 56 42 C52 38 46 40 40 50 Z"
          fill="url(#ashHair)"
        />
        {/* Hair Bangs Forehead */}
        <polygon points="50,38 56,52 62,40" fill="url(#ashHair)" />
        <polygon points="60,38 68,54 74,40" fill="url(#ashHair)" />
        <polygon points="72,40 78,52 86,38" fill="url(#ashHair)" />
        <polygon points="84,40 92,50 96,42" fill="url(#ashHair)" />
      </svg>
    </div>
  );
};
