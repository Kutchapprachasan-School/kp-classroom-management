// src/config/subjectIcons.ts
// Comprehensive Subject Icon System & Multi-Strand Icon Configuration
// Supports Pastel Anime Education Dashboard UI & Intelligent MoE Subject Code Detection

import React from 'react';

export interface SubjectIconConfig {
  id: string;
  name: string;
  strand: string;
  symbol: string;
  iconType: 'text' | 'lucide';
  lucideIconName?: string;
  bgClass: string;
  textClass: string;
  textColorClass?: string;
  colorClass?: string;
  borderClass?: string;
  description?: string;
}

export const ALL_SUBJECT_ICONS: SubjectIconConfig[] = [
  // 1. ภาษาญี่ปุ่น
  {
    id: 'japanese',
    name: 'ภาษาญี่ปุ่น',
    strand: 'ภาษาต่างประเทศ',
    symbol: 'あ',
    iconType: 'text',
    bgClass: 'bg-rose-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-rose-400',
    description: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาญี่ปุ่น)',
  },
  // 2. ภาษาจีน
  {
    id: 'chinese',
    name: 'ภาษาจีน',
    strand: 'ภาษาต่างประเทศ',
    symbol: '中',
    iconType: 'text',
    bgClass: 'bg-amber-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-amber-500',
    description: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาจีน)',
  },
  // 3. ภาษาเกาหลี
  {
    id: 'korean',
    name: 'ภาษาเกาหลี',
    strand: 'ภาษาต่างประเทศ',
    symbol: '한',
    iconType: 'text',
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-blue-400',
    description: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาเกาหลี)',
  },
  // 4. ภาษาอังกฤษ
  {
    id: 'english',
    name: 'ภาษาอังกฤษ',
    strand: 'ภาษาต่างประเทศ',
    symbol: 'EN',
    iconType: 'text',
    bgClass: 'bg-indigo-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-indigo-400',
    description: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาอังกฤษ)',
  },
  // 5. ภาษาฝรั่งเศส
  {
    id: 'french',
    name: 'ภาษาฝรั่งเศส',
    strand: 'ภาษาต่างประเทศ',
    symbol: 'FR',
    iconType: 'text',
    bgClass: 'bg-violet-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-violet-400',
    description: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาฝรั่งเศส)',
  },
  // 6. ภาษาไทย
  {
    id: 'thai',
    name: 'ภาษาไทย',
    strand: 'ภาษาไทย',
    symbol: 'ก',
    iconType: 'text',
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-orange-400',
    description: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
  },
  // 7. คณิตศาสตร์
  {
    id: 'math',
    name: 'คณิตศาสตร์',
    strand: 'คณิตศาสตร์',
    symbol: '∑',
    iconType: 'text',
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-blue-400',
    description: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
  },
  // 8. ฟิสิกส์
  {
    id: 'physics',
    name: 'ฟิสิกส์',
    strand: 'วิทยาศาสตร์และเทคโนโลยี',
    symbol: '⚡',
    iconType: 'text',
    lucideIconName: 'Zap',
    bgClass: 'bg-amber-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-amber-400',
    description: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (ฟิสิกส์)',
  },
  // 9. เคมี
  {
    id: 'chemistry',
    name: 'เคมี',
    strand: 'วิทยาศาสตร์และเทคโนโลยี',
    symbol: '🧪',
    iconType: 'text',
    lucideIconName: 'FlaskConical',
    bgClass: 'bg-teal-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-teal-400',
    description: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (เคมี)',
  },
  // 10. ชีววิทยา
  {
    id: 'biology',
    name: 'ชีววิทยา',
    strand: 'วิทยาศาสตร์และเทคโนโลยี',
    symbol: '🧬',
    iconType: 'text',
    lucideIconName: 'Dna',
    bgClass: 'bg-emerald-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-emerald-400',
    description: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (ชีววิทยา)',
  },
  // 11. วิทยาศาสตร์ทั่วไป
  {
    id: 'science',
    name: 'วิทยาศาสตร์ทั่วไป',
    strand: 'วิทยาศาสตร์และเทคโนโลยี',
    symbol: '🔬',
    iconType: 'text',
    lucideIconName: 'Microscope',
    bgClass: 'bg-sky-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-sky-400',
    description: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาศาสตร์ทั่วไป)',
  },
  // 12. คอมพิวเตอร์/เทคโนโลยี
  {
    id: 'computing',
    name: 'คอมพิวเตอร์/เทคโนโลยี',
    strand: 'วิทยาศาสตร์และเทคโนโลยี',
    symbol: '💻',
    iconType: 'text',
    lucideIconName: 'Laptop',
    bgClass: 'bg-cyan-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-cyan-400',
    description: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณและเทคโนโลยี)',
  },
  // 13. สังคมศึกษา
  {
    id: 'social',
    name: 'สังคมศึกษา',
    strand: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    symbol: '🌍',
    iconType: 'text',
    lucideIconName: 'Globe',
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-emerald-500',
    description: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
  },
  // 14. ประวัติศาสตร์
  {
    id: 'history',
    name: 'ประวัติศาสตร์',
    strand: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    symbol: '🏛️',
    iconType: 'text',
    lucideIconName: 'Landmark',
    bgClass: 'bg-amber-700',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-amber-600',
    description: 'กลุ่มสาระการเรียนรู้สังคมศึกษา (ประวัติศาสตร์)',
  },
  // 15. สุขศึกษา/พลศึกษา
  {
    id: 'pe',
    name: 'สุขศึกษา/พลศึกษา',
    strand: 'สุขศึกษาและพลศึกษา',
    symbol: '⚽',
    iconType: 'text',
    lucideIconName: 'Activity',
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-orange-400',
    description: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
  },
  // 16. ทัศนศิลป์/ศิลปะ
  {
    id: 'art',
    name: 'ทัศนศิลป์/ศิลปะ',
    strand: 'ศิลปะ',
    symbol: '🎨',
    iconType: 'text',
    lucideIconName: 'Palette',
    bgClass: 'bg-pink-500',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-pink-400',
    description: 'กลุ่มสาระการเรียนรู้ศิลปะ (ทัศนศิลป์)',
  },
  // 17. ดนตรี/นาฏศิลป์
  {
    id: 'music',
    name: 'ดนตรี/นาฏศิลป์',
    strand: 'ศิลปะ',
    symbol: '🎵',
    iconType: 'text',
    lucideIconName: 'Music',
    bgClass: 'bg-purple-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-purple-400',
    description: 'กลุ่มสาระการเรียนรู้ศิลปะ (ดนตรีและนาฏศิลป์)',
  },
  // 18. การงานอาชีพ/เกษตร
  {
    id: 'vocational',
    name: 'การงานอาชีพ/เกษตร',
    strand: 'การงานอาชีพ',
    symbol: '🌱',
    iconType: 'text',
    lucideIconName: 'Sprout',
    bgClass: 'bg-lime-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-lime-500',
    description: 'กลุ่มสาระการเรียนรู้การงานอาชีพ',
  },
  // 19. กิจกรรมแนะแนว
  {
    id: 'guidance',
    name: 'กิจกรรมแนะแนว',
    strand: 'กิจกรรมพัฒนาผู้เรียน',
    symbol: '🧭',
    iconType: 'text',
    lucideIconName: 'Compass',
    bgClass: 'bg-teal-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-teal-500',
    description: 'กิจกรรมพัฒนาผู้เรียน (แนะแนว)',
  },
  // 20. ลูกเสือ/เนตรนารี
  {
    id: 'scout',
    name: 'ลูกเสือ/เนตรนารี',
    strand: 'กิจกรรมพัฒนาผู้เรียน',
    symbol: '⚜️',
    iconType: 'text',
    lucideIconName: 'Shield',
    bgClass: 'bg-yellow-600',
    textClass: 'text-white',
    textColorClass: 'text-white',
    colorClass: 'text-white',
    borderClass: 'border-yellow-500',
    description: 'กิจกรรมพัฒนาผู้เรียน (ลูกเสือ/เนตรนารี/ยุวกาชาด)',
  },
];

export const DEFAULT_SUBJECT_ICON: SubjectIconConfig = {
  id: 'general',
  name: 'รายวิชาทั่วไป',
  strand: 'ทั่วไป',
  symbol: '📚',
  iconType: 'text',
  lucideIconName: 'BookOpen',
  bgClass: 'bg-slate-600',
  textClass: 'text-white',
  textColorClass: 'text-white',
  colorClass: 'text-white',
  borderClass: 'border-slate-500',
  description: 'รายวิชาทั่วไปหรือยังไม่ระบุกลุ่มสาระ',
};

function findIcon(id: string): SubjectIconConfig {
  const icon = ALL_SUBJECT_ICONS.find((i) => i.id === id);
  return icon || DEFAULT_SUBJECT_ICON;
}

/**
 * Intelligently detects and returns the appropriate SubjectIconConfig by analyzing:
 * 1. Direct ID match
 * 2. Specific keywords in subject name/code (e.g. Physics, Chemistry, Biology, Computing, etc.)
 * 3. Thai Ministry of Education standard subject code prefixes (ญ, จ, ฝ, อ, ท, ค, ว, ส, พ, ศ, ง, ก)
 * 4. Fallback to DEFAULT_SUBJECT_ICON
 */
export function getSubjectIcon(codeOrName: string = '', subjectName?: string): SubjectIconConfig {
  const codeStr = (codeOrName || '').trim();
  const nameStr = (subjectName || '').trim();
  const combined = `${codeStr} ${nameStr}`.trim().toLowerCase();

  if (!combined) {
    return DEFAULT_SUBJECT_ICON;
  }

  // 1. Direct ID match
  const byId = ALL_SUBJECT_ICONS.find((item) => item.id.toLowerCase() === codeStr.toLowerCase());
  if (byId) return byId;

  // 2. High-priority keyword matching (Specific subjects within broader strands)
  // Science Strand specific sub-disciplines
  if (combined.includes('เคมี') || combined.includes('chemistry')) {
    return findIcon('chemistry');
  }
  if (combined.includes('ฟิสิกส์') || combined.includes('physics')) {
    return findIcon('physics');
  }
  if (combined.includes('ชีวะ') || combined.includes('ชีววิทยา') || combined.includes('biology')) {
    return findIcon('biology');
  }
  if (
    combined.includes('คอม') ||
    combined.includes('เทคโนโลยี') ||
    combined.includes('วิทยาการคำนวณ') ||
    combined.includes('คอมพิวเตอร์') ||
    combined.includes('computing') ||
    combined.includes('coding') ||
    combined.includes('เขียนโปรแกรม') ||
    combined.includes('ict')
  ) {
    return findIcon('computing');
  }

  // Social Strand specific sub-disciplines
  if (combined.includes('ประวัติศาสตร์') || combined.includes('history')) {
    return findIcon('history');
  }

  // Arts Strand specific sub-disciplines
  if (combined.includes('ดนตรี') || combined.includes('นาฏศิลป์') || combined.includes('music')) {
    return findIcon('music');
  }

  // Learner Development Activities specific
  if (
    combined.includes('ลูกเสือ') ||
    combined.includes('เนตรนารี') ||
    combined.includes('ยุวกาชาด') ||
    combined.includes('scout')
  ) {
    return findIcon('scout');
  }
  if (combined.includes('แนะแนว') || combined.includes('guidance')) {
    return findIcon('guidance');
  }

  // Foreign Languages specific keywords
  if (combined.includes('ญี่ปุ่น') || combined.includes('japanese') || combined.includes('nihongo')) {
    return findIcon('japanese');
  }
  if (combined.includes('จีน') || combined.includes('chinese')) {
    return findIcon('chinese');
  }
  if (combined.includes('เกาหลี') || combined.includes('korean')) {
    return findIcon('korean');
  }
  if (combined.includes('ฝรั่งเศส') || combined.includes('french')) {
    return findIcon('french');
  }
  if (combined.includes('อังกฤษ') || combined.includes('english')) {
    return findIcon('english');
  }

  // Other Core Strands keywords
  if (combined.includes('ไทย') || combined.includes('วรรณคดี') || combined.includes('หลักภาษา')) {
    return findIcon('thai');
  }
  if (
    combined.includes('คณิต') ||
    combined.includes('math') ||
    combined.includes('พีชคณิต') ||
    combined.includes('เรขาคณิต')
  ) {
    return findIcon('math');
  }
  if (
    combined.includes('พลศึกษา') ||
    combined.includes('สุขศึกษา') ||
    combined.includes('กีฬา') ||
    combined.includes('พละ')
  ) {
    return findIcon('pe');
  }
  if (
    combined.includes('ทัศนศิลป์') ||
    combined.includes('ศิลปะ') ||
    combined.includes('วาดภาพ') ||
    combined.includes('art')
  ) {
    return findIcon('art');
  }
  if (
    combined.includes('การงาน') ||
    combined.includes('เกษตร') ||
    combined.includes('ช่าง') ||
    combined.includes('คหกรรม') ||
    combined.includes('งานบ้าน')
  ) {
    return findIcon('vocational');
  }
  if (
    combined.includes('สังคม') ||
    combined.includes('ภูมิศาสตร์') ||
    combined.includes('หน้าที่พลเมือง') ||
    combined.includes('ศาสนา')
  ) {
    return findIcon('social');
  }
  if (combined.includes('วิทยาศาสตร์') || combined.includes('วิทย์') || combined.includes('science')) {
    return findIcon('science');
  }

  // 3. Thai Ministry of Education Subject Code Initial Prefix Check
  // MoE standard code format: [Prefix Char][Level Digits e.g. 21, 31][Type Digit 1=Base, 2=Additional][Course No]
  // Extract initial Thai letter from codeStr
  const codeMatch = codeStr.match(/^([ก-ฮa-zA-Z])/);
  if (codeMatch) {
    const prefix = codeMatch[1].toUpperCase();
    switch (prefix) {
      case 'ญ':
        return findIcon('japanese');
      case 'จ':
        return findIcon('chinese');
      case 'ฝ':
        return findIcon('french');
      case 'อ':
        return findIcon('english');
      case 'ท':
        return findIcon('thai');
      case 'ค':
        return findIcon('math');
      case 'ว':
        return findIcon('science');
      case 'ส':
        return findIcon('social');
      case 'พ':
        return findIcon('pe');
      case 'ศ':
        return findIcon('art');
      case 'ง':
        return findIcon('vocational');
      case 'ก':
        return findIcon('guidance');
    }
  }

  // 4. Fallback default
  return DEFAULT_SUBJECT_ICON;
}

export type SubjectBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export function getSubjectBadgeClasses(
  icon: SubjectIconConfig,
  size: SubjectBadgeSize = 'md'
): string {
  const sizeMap: Record<SubjectBadgeSize, string> = {
    xs: 'w-5 h-5 text-[10px] rounded',
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  };

  const borderPart = icon.borderClass ? `border ${icon.borderClass}` : '';
  return `inline-flex items-center justify-center font-bold font-prompt shadow-xs select-none transition-transform ${icon.bgClass} ${icon.textClass} ${borderPart} ${sizeMap[size] || sizeMap.md}`.trim();
}

export interface SubjectBadgeRenderProps {
  className: string;
  symbol: string;
  title: string;
  bgClass: string;
  textClass: string;
  borderClass?: string;
  name: string;
  strand: string;
}

export function getSubjectBadgeProps(
  icon: SubjectIconConfig,
  size: SubjectBadgeSize = 'md'
): SubjectBadgeRenderProps {
  return {
    className: getSubjectBadgeClasses(icon, size),
    symbol: icon.symbol,
    title: `${icon.name} (${icon.strand})`,
    bgClass: icon.bgClass,
    textClass: icon.textClass,
    borderClass: icon.borderClass,
    name: icon.name,
    strand: icon.strand,
  };
}

export function renderSubjectIconBadge(
  icon: SubjectIconConfig,
  size: SubjectBadgeSize = 'md'
): React.ReactElement {
  const classes = getSubjectBadgeClasses(icon, size);
  return React.createElement(
    'span',
    {
      className: classes,
      title: `${icon.name} (${icon.strand})`,
      'aria-label': icon.name,
      'data-subject-id': icon.id,
      'data-symbol': icon.symbol,
    },
    icon.symbol
  );
}

export const SubjectIconBadge: React.FC<{
  icon: SubjectIconConfig;
  size?: SubjectBadgeSize;
  className?: string;
}> = ({ icon, size = 'md', className = '' }) => {
  const baseClasses = getSubjectBadgeClasses(icon, size);
  return React.createElement(
    'span',
    {
      className: `${baseClasses} ${className}`.trim(),
      title: `${icon.name} (${icon.strand})`,
      'aria-label': icon.name,
      'data-subject-id': icon.id,
      'data-symbol': icon.symbol,
    },
    icon.symbol
  );
};
