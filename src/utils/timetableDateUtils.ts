// src/utils/timetableDateUtils.ts
// Date calculation helpers and constants for Teacher Timetable matching Mockup Parity

import { academicCalendarService } from '../services/academicCalendarService.ts';

export type TimetableColorTheme =
  | 'pink'
  | 'teal'
  | 'purple'
  | 'green'
  | 'blue'
  | 'amber'
  | 'free';

export interface TimetableMatrixSlot {
  id: string;
  day: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์';
  dayDate?: string;
  period: number;
  timeRange?: string;
  subjectCode: string;
  room: string;
  subjectName: string;
  isConducted?: boolean;
  isFreePeriod?: boolean;
  isLunchSlot?: boolean;
  status?: 'CHECKED' | 'UNCHECKED' | 'TEACHING' | 'LUNCH';
  colorTheme?: TimetableColorTheme;
  category?: 'subject' | 'activity' | 'meeting' | 'free';
  credits?: string;
  totalPeriods?: string;
  subType?: string;
  subjectIcon?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface TaskWidgetItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'URGENT' | 'NORMAL';
  priorityLabel: 'ด่วน' | 'ปกติ';
  iconType: 'red' | 'green' | 'purple';
}

export interface CalendarEventItem {
  id: string;
  title: string;
  time: string;
  bulletColor: 'amber' | 'blue';
}

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export interface WeekDayInfo {
  key: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์';
  dateLabel: string;
  isToday: boolean;
}

export interface ComputedWeekInfo {
  weekNumber: number;
  totalWeeks: number;
  dateRangeLabel: string;
  days: WeekDayInfo[];
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Bangkok Timezone (Asia/Bangkok, UTC+7) Helpers
 */
export const BANGKOK_TIMEZONE = 'Asia/Bangkok';

export const getBangkokNow = (): Date => {
  const now = new Date();
  const bangkokStr = now.toLocaleString('en-US', { timeZone: BANGKOK_TIMEZONE });
  return new Date(bangkokStr);
};

export const getBangkokTodayString = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

export const getBangkokDayName = (): 'อาทิตย์' | 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' | 'เสาร์' => {
  const dayNames: ('อาทิตย์' | 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' | 'เสาร์')[] = [
    'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
  ];
  const bDate = getBangkokNow();
  return dayNames[bDate.getDay()];
};

export const formatThaiDateFull = (dateStrOrObj?: string | Date): string => {
  const d = dateStrOrObj ? (typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj) : new Date();
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: BANGKOK_TIMEZONE,
    dateStyle: 'full',
  }).format(d);
};

export const formatThaiDateShort = (dateStrOrObj?: string | Date): string => {
  const d = dateStrOrObj ? (typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj) : new Date();
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: BANGKOK_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const computeWeekInfo = (
  offset: number = 0,
  activeTermParam?: { startDate: string; semesterNo?: number; termName?: string } | null,
  referenceDateParam?: Date | string
): ComputedWeekInfo => {
  const totalWeeks = 20;

  // อ่านภาคเรียนปัจจุบันจากพารามิเตอร์หรือ academicCalendarService
  const term = activeTermParam ?? academicCalendarService.getActiveTerm();
  const startIso = term ? academicCalendarService.parseThaiDateToIso(term.startDate) : '';

  let termStartMonday: Date;
  if (startIso && /^\d{4}-\d{2}-\d{2}$/.test(startIso)) {
    const [sYear, sMonth, sDay] = startIso.split('-').map(Number);
    const startDate = new Date(sYear, sMonth - 1, sDay);
    const dayOfW = startDate.getDay(); // 0 = Sun, 1 = Mon
    const diffToMon = (dayOfW === 0 ? -6 : 1) - dayOfW;
    termStartMonday = new Date(startDate);
    termStartMonday.setDate(startDate.getDate() + diffToMon);
    termStartMonday.setHours(0, 0, 0, 0);
  } else {
    // Fallback: 19 ต.ค. 2569
    termStartMonday = new Date(2026, 9, 19);
  }

  // วันอ้างอิงในเขตเวลาไทย (Bangkok)
  let refDate: Date;
  if (referenceDateParam) {
    if (typeof referenceDateParam === 'string') {
      const iso = academicCalendarService.parseThaiDateToIso(referenceDateParam);
      if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split('-').map(Number);
        refDate = new Date(y, m - 1, d);
      } else {
        refDate = new Date(referenceDateParam);
      }
    } else {
      refDate = new Date(referenceDateParam);
    }
  } else {
    refDate = getBangkokNow();
  }
  refDate.setHours(0, 0, 0, 0);

  const todayBangkok = getBangkokNow();
  todayBangkok.setHours(0, 0, 0, 0);

  // คำนวณสัปดาห์ปัจจุบันของภาคเรียน
  const diffDays = Math.floor(
    (refDate.getTime() - termStartMonday.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentWeek = diffDays < 0 ? 1 : Math.floor(diffDays / 7) + 1;
  const clampedCurrentWeek = Math.min(totalWeeks, Math.max(1, currentWeek));

  // สัปดาห์เป้าหมายหลังบวก offset
  const weekNumber = Math.min(totalWeeks, Math.max(1, clampedCurrentWeek + offset));
  const effectiveOffsetWeeks = weekNumber - 1;

  // วันจันทร์และวันอาทิตย์ของสัปดาห์เป้าหมาย
  const startMonday = new Date(termStartMonday);
  startMonday.setDate(termStartMonday.getDate() + effectiveOffsetWeeks * 7);

  const endSunday = new Date(startMonday);
  endSunday.setDate(startMonday.getDate() + 6);

  const formatThaiDate = (d: Date) => {
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const dayKeys: ('จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์')[] = [
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
  ];

  const days: WeekDayInfo[] = dayKeys.map((key, i) => {
    const cur = new Date(startMonday);
    cur.setDate(startMonday.getDate() + i);
    const isToday =
      cur.getFullYear() === todayBangkok.getFullYear() &&
      cur.getMonth() === todayBangkok.getMonth() &&
      cur.getDate() === todayBangkok.getDate();

    return {
      key,
      dateLabel: formatThaiDate(cur),
      isToday,
    };
  });

  return {
    weekNumber,
    totalWeeks,
    dateRangeLabel: `${formatThaiDate(startMonday)} – ${formatThaiDate(endSunday)}`,
    days,
    canPrev: weekNumber > 1,
    canNext: weekNumber < totalWeeks,
  };
};

export interface TeachingWeekInfo {
  weekNumber: number;
  totalWeeks: number;
  isInTerm: boolean;
  termLabel: string;
  startDateLabel: string;
  endDateLabel: string;
}

/**
 * คำนวณสัปดาห์ที่สอน (Teaching Week 1-20) สำหรับวันที่ระบุอิงตามวันเปิดภาคเรียน
 */
export const computeTeachingWeekForDate = (
  dateStrOrObj?: string | Date,
  activeTermParam?: { startDate: string; endDate?: string; semesterNo?: number; termName?: string; year?: number } | null
): TeachingWeekInfo => {
  const totalWeeks = 20;
  const term = activeTermParam ?? academicCalendarService.getActiveTerm();
  const startIso = term ? academicCalendarService.parseThaiDateToIso(term.startDate) : '';

  let termStartMonday: Date;
  if (startIso && /^\d{4}-\d{2}-\d{2}$/.test(startIso)) {
    const [sYear, sMonth, sDay] = startIso.split('-').map(Number);
    const startDate = new Date(sYear, sMonth - 1, sDay);
    const dayOfW = startDate.getDay(); // 0 = Sun, 1 = Mon
    const diffToMon = (dayOfW === 0 ? -6 : 1) - dayOfW;
    termStartMonday = new Date(startDate);
    termStartMonday.setDate(startDate.getDate() + diffToMon);
    termStartMonday.setHours(0, 0, 0, 0);
  } else {
    termStartMonday = new Date(2026, 9, 19);
    termStartMonday.setHours(0, 0, 0, 0);
  }

  let targetDate: Date;
  if (dateStrOrObj) {
    if (typeof dateStrOrObj === 'string') {
      const iso = academicCalendarService.parseThaiDateToIso(dateStrOrObj);
      if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      } else {
        targetDate = new Date(dateStrOrObj);
      }
    } else {
      targetDate = new Date(dateStrOrObj);
    }
  } else {
    targetDate = getBangkokNow();
  }
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (targetDate.getTime() - termStartMonday.getTime()) / (1000 * 60 * 60 * 24)
  );

  const rawWeek = diffDays < 0 ? 1 : Math.floor(diffDays / 7) + 1;
  const weekNumber = Math.min(totalWeeks, Math.max(1, rawWeek));

  const termLabel = term
    ? `${term.termName || 'ภาคเรียน'}/${term.year || ''}`.replace(/\/$/, '')
    : 'ภาคเรียนปัจจุบัน';
  const isInTerm = diffDays >= 0 && rawWeek <= totalWeeks;

  return {
    weekNumber,
    totalWeeks,
    isInTerm,
    termLabel,
    startDateLabel: term?.startDate || '',
    endDateLabel: term?.endDate || '',
  };
};

export const PERIOD_DEFINITIONS = [
  { period: 1, timeRange: '08:30 - 09:20', label: 'คาบ 1' },
  { period: 2, timeRange: '09:20 - 10:10', label: 'คาบ 2' },
  { period: 3, timeRange: '10:10 - 11:00', label: 'คาบ 3' },
  { period: 4, timeRange: '11:00 - 11:50', label: 'คาบ 4' },
  { period: 5, timeRange: '11:50 - 12:40', label: 'คาบ 5 (พักกลางวัน)', isLunch: true },
  { period: 6, timeRange: '12:40 - 13:30', label: 'คาบ 6' },
];

export const INITIAL_MATRIX_SLOTS: TimetableMatrixSlot[] = [
  // ==========================================
  // คาบ 1 (08:30 - 09:20)
  // ==========================================
  {
    id: 'slot-mon-1',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ศ23101',
    room: 'ม.3/1 • ห้อง 324',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-tue-1',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ศ23101',
    room: 'ม.3/1 • ห้อง 324',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-wed-1',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ศ23101',
    room: 'ม.3/1 • ห้อง 324',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-thu-1',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.3/1 • ห้อง 324',
    subjectName: 'ภาษาญี่ปุ่น 1',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'blue',
    category: 'subject',
    credits: '1.0',
    totalPeriods: '2 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-fri-1',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.3/1 • ห้อง 324',
    subjectName: 'ภาษาญี่ปุ่น 1',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'blue',
    category: 'subject',
    credits: '1.0',
    totalPeriods: '2 คาบ/ห้อง',
    isFreePeriod: false,
  },

  // ==========================================
  // คาบ 2 (09:20 - 10:10)
  // ==========================================
  {
    id: 'slot-mon-2',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'ศ23101',
    room: 'ม.3/2 • ห้อง 325',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-tue-2',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'ศ23101',
    room: 'ม.3/2 • ห้อง 325',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-wed-2',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-thu-2',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'ญ31201',
    room: 'ม.3/2 • ห้อง 325',
    subjectName: 'ภาษาญี่ปุ่น 1',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'blue',
    category: 'subject',
    credits: '1.0',
    totalPeriods: '2 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-fri-2',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },

  // ==========================================
  // คาบ 3 (10:10 - 11:00)
  // ==========================================
  {
    id: 'slot-mon-3',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: 'ศ23101',
    room: 'ม.3/8 • ห้อง 326',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
    credits: '1.5',
    totalPeriods: '3 คาบ/ห้อง',
    isFreePeriod: false,
  },
  {
    id: 'slot-tue-3',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-wed-3',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-thu-3',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-fri-3',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },

  // ==========================================
  // คาบ 4 (11:00 - 11:50)
  // ==========================================
  {
    id: 'slot-mon-4',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-tue-4',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-wed-4',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-thu-4',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-fri-4',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },

  // ==========================================
  // คาบ 5 (11:50 - 12:40) พักกลางวันทุกวัน
  // ==========================================
  {
    id: 'slot-mon-5',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 5,
    timeRange: '11:50 - 12:40',
    subjectCode: 'พักกลางวัน',
    room: 'โรงอาหาร',
    subjectName: 'พักรับประทานอาหารกลางวัน',
    isConducted: true,
    status: 'LUNCH',
    colorTheme: 'free',
    category: 'free',
    isLunchSlot: true,
  },
  {
    id: 'slot-tue-5',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 5,
    timeRange: '11:50 - 12:40',
    subjectCode: 'พักกลางวัน',
    room: 'โรงอาหาร',
    subjectName: 'พักรับประทานอาหารกลางวัน',
    isConducted: true,
    status: 'LUNCH',
    colorTheme: 'free',
    category: 'free',
    isLunchSlot: true,
  },
  {
    id: 'slot-wed-5',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 5,
    timeRange: '11:50 - 12:40',
    subjectCode: 'พักกลางวัน',
    room: 'โรงอาหาร',
    subjectName: 'พักรับประทานอาหารกลางวัน',
    isConducted: true,
    status: 'LUNCH',
    colorTheme: 'free',
    category: 'free',
    isLunchSlot: true,
  },
  {
    id: 'slot-thu-5',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 5,
    timeRange: '11:50 - 12:40',
    subjectCode: 'พักกลางวัน',
    room: 'โรงอาหาร',
    subjectName: 'พักรับประทานอาหารกลางวัน',
    isConducted: true,
    status: 'LUNCH',
    colorTheme: 'free',
    category: 'free',
    isLunchSlot: true,
  },
  {
    id: 'slot-fri-5',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 5,
    timeRange: '11:50 - 12:40',
    subjectCode: 'พักกลางวัน',
    room: 'โรงอาหาร',
    subjectName: 'พักรับประทานอาหารกลางวัน',
    isConducted: true,
    status: 'LUNCH',
    colorTheme: 'free',
    category: 'free',
    isLunchSlot: true,
  },

  // ==========================================
  // คาบ 6 (12:40 - 13:30)
  // ==========================================
  {
    id: 'slot-mon-6',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-tue-6',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-wed-6',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-thu-6',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
  {
    id: 'slot-fri-6',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: '',
    room: '',
    subjectName: '',
    isConducted: false,
    colorTheme: 'free',
    category: 'free',
    isFreePeriod: true,
  },
];

