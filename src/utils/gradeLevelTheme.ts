// src/utils/gradeLevelTheme.ts
// กำหนดธีมสีสายชั้น (ม.1 ถึง ม.6) ตาม Master Design System: Pastel Anime Education Dashboard
// สีพาสเทล นุ่มนวล สบายตา ช่วยให้ครูและผู้บริหารแยกแยะสายชั้นได้อย่างรวดเร็ว

export interface GradeLevelTheme {
  levelKey: string;     // 'ม.1' | 'ม.2' | 'ม.3' | 'ม.4' | 'ม.5' | 'ม.6' | 'OTHER'
  label: string;        // 'มัธยมศึกษาปีที่ 1'
  shortLabel: string;   // 'ม.1'
  pillBg: string;       // e.g. 'bg-sky-50'
  pillText: string;     // e.g. 'text-sky-700'
  pillBorder: string;   // e.g. 'border-sky-200'
  chipBg: string;       // e.g. 'bg-sky-100'
  chipText: string;     // e.g. 'text-sky-800'
  badgeBg: string;      // e.g. 'bg-sky-500'
  badgeText: string;    // e.g. 'text-white'
  activeTabClass: string; // e.g. 'bg-sky-600 text-white shadow-xs'
  hoverTabClass: string;  // e.g. 'hover:bg-sky-50 hover:text-sky-700'
  dotColor: string;     // e.g. 'bg-sky-500'
}

export const GRADE_LEVEL_THEMES: Record<string, GradeLevelTheme> = {
  'ม.1': {
    levelKey: 'ม.1',
    label: 'มัธยมศึกษาปีที่ 1',
    shortLabel: 'ม.1',
    pillBg: 'bg-sky-50',
    pillText: 'text-sky-700',
    pillBorder: 'border-sky-200',
    chipBg: 'bg-sky-100',
    chipText: 'text-sky-800',
    badgeBg: 'bg-sky-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-sky-600 text-white shadow-xs border-sky-600',
    hoverTabClass: 'hover:bg-sky-50 hover:text-sky-700',
    dotColor: 'bg-sky-500',
  },
  'ม.2': {
    levelKey: 'ม.2',
    label: 'มัธยมศึกษาปีที่ 2',
    shortLabel: 'ม.2',
    pillBg: 'bg-emerald-50',
    pillText: 'text-emerald-700',
    pillBorder: 'border-emerald-200',
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-800',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-emerald-600 text-white shadow-xs border-emerald-600',
    hoverTabClass: 'hover:bg-emerald-50 hover:text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  'ม.3': {
    levelKey: 'ม.3',
    label: 'มัธยมศึกษาปีที่ 3',
    shortLabel: 'ม.3',
    pillBg: 'bg-indigo-50',
    pillText: 'text-indigo-700',
    pillBorder: 'border-indigo-200',
    chipBg: 'bg-indigo-100',
    chipText: 'text-indigo-800',
    badgeBg: 'bg-indigo-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-indigo-600 text-white shadow-xs border-indigo-600',
    hoverTabClass: 'hover:bg-indigo-50 hover:text-indigo-700',
    dotColor: 'bg-indigo-500',
  },
  'ม.4': {
    levelKey: 'ม.4',
    label: 'มัธยมศึกษาปีที่ 4',
    shortLabel: 'ม.4',
    pillBg: 'bg-amber-50',
    pillText: 'text-amber-800',
    pillBorder: 'border-amber-200',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-900',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-amber-600 text-white shadow-xs border-amber-600',
    hoverTabClass: 'hover:bg-amber-50 hover:text-amber-800',
    dotColor: 'bg-amber-500',
  },
  'ม.5': {
    levelKey: 'ม.5',
    label: 'มัธยมศึกษาปีที่ 5',
    shortLabel: 'ม.5',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-700',
    pillBorder: 'border-rose-200',
    chipBg: 'bg-rose-100',
    chipText: 'text-rose-800',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-rose-600 text-white shadow-xs border-rose-600',
    hoverTabClass: 'hover:bg-rose-50 hover:text-rose-700',
    dotColor: 'bg-rose-500',
  },
  'ม.6': {
    levelKey: 'ม.6',
    label: 'มัธยมศึกษาปีที่ 6',
    shortLabel: 'ม.6',
    pillBg: 'bg-purple-50',
    pillText: 'text-purple-700',
    pillBorder: 'border-purple-200',
    chipBg: 'bg-purple-100',
    chipText: 'text-purple-800',
    badgeBg: 'bg-purple-500',
    badgeText: 'text-white',
    activeTabClass: 'bg-purple-600 text-white shadow-xs border-purple-600',
    hoverTabClass: 'hover:bg-purple-50 hover:text-purple-700',
    dotColor: 'bg-purple-500',
  },
};

const DEFAULT_THEME: GradeLevelTheme = {
  levelKey: 'OTHER',
  label: 'ระดับชั้นอื่นๆ',
  shortLabel: 'อื่นๆ',
  pillBg: 'bg-slate-50',
  pillText: 'text-slate-700',
  pillBorder: 'border-slate-200',
  chipBg: 'bg-slate-100',
  chipText: 'text-slate-800',
  badgeBg: 'bg-slate-500',
  badgeText: 'text-white',
  activeTabClass: 'bg-slate-700 text-white shadow-xs border-slate-700',
  hoverTabClass: 'hover:bg-slate-50 hover:text-slate-700',
  dotColor: 'bg-slate-500',
};

/**
 * ดึงธีมสีตามระดับชั้นหรือชื่อห้อง (เช่น 'ม.1/1', 'ม.3', '3', 'มัธยมศึกษาปีที่ 2')
 */
export function getGradeLevelTheme(levelOrRoom?: string | null): GradeLevelTheme {
  if (!levelOrRoom) return DEFAULT_THEME;
  const str = levelOrRoom.trim();

  // ตรวจสอบ ม.1 ถึง ม.6
  for (let i = 1; i <= 6; i++) {
    const key = `ม.${i}`;
    if (str.startsWith(key) || str.includes(`ม.${i}`) || str.includes(`มัธยมศึกษาปีที่ ${i}`)) {
      return GRADE_LEVEL_THEMES[key];
    }
    // ตัวเลขโดดๆ เช่น level: '1', '2'
    if (str === String(i) || str === `grade-${i}`) {
      return GRADE_LEVEL_THEMES[key];
    }
  }

  return DEFAULT_THEME;
}

export const GRADE_LEVEL_LIST: string[] = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
