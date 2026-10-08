// src/utils/timetableDateUtils.ts
// Date calculation helpers and constants for Teacher Timetable matching Mockup Parity

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

export const computeWeekInfo = (offset: number): ComputedWeekInfo => {
  // Base semester instructional duration is 20 weeks
  // Anchor current week at week 16
  const baseWeek = 16;
  const totalWeeks = 20;
  const weekNumber = Math.min(totalWeeks, Math.max(1, baseWeek + offset));
  const effectiveOffset = weekNumber - baseWeek;

  // Base anchor Monday: 29 Sep 2026 (2569 BE) - corresponds to week 16
  // Base Thursday (Today): 2 Oct 2026 (2569 BE)
  const baseMonday = new Date(2026, 8, 29); // 0-indexed month 8 = September
  const startMonday = new Date(baseMonday);
  startMonday.setDate(baseMonday.getDate() + effectiveOffset * 7);

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
    return {
      key,
      dateLabel: formatThaiDate(cur),
      isToday: effectiveOffset === 0 && key === 'พฤหัสบดี',
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
    subjectCode: 'คณิต',
    room: 'ม.3/1',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-tue-1',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'วิทย์',
    room: 'ม.3/2',
    subjectName: 'วิทยาศาสตร์กายภาพ',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'teal',
    category: 'subject',
  },
  {
    id: 'slot-wed-1',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'อังกฤษ',
    room: 'ม.3/3',
    subjectName: 'ภาษาอังกฤษเพื่อการสื่อสาร',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'purple',
    category: 'subject',
  },
  {
    id: 'slot-thu-1',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'คณิต',
    room: 'ม.3/4',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-fri-1',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 1,
    timeRange: '08:30 - 09:20',
    subjectCode: 'อังกฤษ',
    room: 'ม.3/5',
    subjectName: 'ภาษาอังกฤษ',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'purple',
    category: 'subject',
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
    subjectCode: 'วิทย์',
    room: 'ม.3/1',
    subjectName: 'วิทยาศาสตร์กายภาพ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'teal',
    category: 'subject',
  },
  {
    id: 'slot-tue-2',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'สังคม',
    room: 'ม.3/2',
    subjectName: 'สังคมศึกษา ศาสนาฯ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'green',
    category: 'subject',
  },
  {
    id: 'slot-wed-2',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'คณิต',
    room: 'ม.3/4',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-thu-2',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'ไทย',
    room: 'ม.3/3',
    subjectName: 'ภาษาไทย วรรณคดี',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-fri-2',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 2,
    timeRange: '09:20 - 10:10',
    subjectCode: 'วิทย์',
    room: 'ม.3/5',
    subjectName: 'วิทยาศาสตร์',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'teal',
    category: 'subject',
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
    subjectCode: 'ไทย',
    room: 'ม.3/1',
    subjectName: 'ภาษาไทยเพื่อการสื่อสาร',
    isConducted: false,
    status: 'TEACHING',
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-tue-3',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: 'คณิต',
    room: 'ม.3/2',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-wed-3',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: 'สังคม',
    room: 'ม.3/4',
    subjectName: 'สังคมศึกษา',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'green',
    category: 'subject',
  },
  {
    id: 'slot-thu-3',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: 'วิทย์',
    room: 'ม.3/2',
    subjectName: 'วิทยาศาสตร์กายภาพ',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'teal',
    category: 'subject',
  },
  {
    id: 'slot-fri-3',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 3,
    timeRange: '10:10 - 11:00',
    subjectCode: 'อังกฤษ',
    room: 'ม.3/5',
    subjectName: 'ภาษาอังกฤษ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'purple',
    category: 'subject',
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
    subjectCode: 'ประวัติศาสตร์',
    room: 'ม.3/1',
    subjectName: 'ประวัติศาสตร์ชาติไทย',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-tue-4',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: 'อังกฤษ',
    room: 'ม.3/3',
    subjectName: 'ภาษาอังกฤษ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'purple',
    category: 'subject',
  },
  {
    id: 'slot-wed-4',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: 'ไทย',
    room: 'ม.3/2',
    subjectName: 'ภาษาไทย',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-thu-4',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: 'แนะแนว',
    room: 'ม.3/4',
    subjectName: 'กิจกรรมแนะแนวชีวิต',
    isConducted: false,
    status: 'TEACHING',
    colorTheme: 'teal',
    category: 'activity',
  },
  {
    id: 'slot-fri-4',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 4,
    timeRange: '11:00 - 11:50',
    subjectCode: 'คณิต',
    room: 'ม.3/5',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'blue',
    category: 'subject',
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
    subjectCode: 'แนะแนว',
    room: 'ม.3/1',
    subjectName: 'กิจกรรมแนะแนว',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'teal',
    category: 'activity',
  },
  {
    id: 'slot-tue-6',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: 'ศิลปะ',
    room: 'ม.3/2',
    subjectName: 'ทัศนศิลป์และการวาดภาพ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-wed-6',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: 'พละ',
    room: 'ม.3/4',
    subjectName: 'พลศึกษาและสุขศึกษา',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-thu-6',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: 'คณิต',
    room: 'ม.3/5',
    subjectName: 'คณิตศาสตร์พื้นฐาน',
    isConducted: false,
    status: 'UNCHECKED',
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-fri-6',
    day: 'ศุกร์',
    dayDate: '3 ต.ค. 2569',
    period: 6,
    timeRange: '12:40 - 13:30',
    subjectCode: 'วิทย์',
    room: 'ม.3/1',
    subjectName: 'วิทยาศาสตร์กายภาพ',
    isConducted: true,
    status: 'CHECKED',
    colorTheme: 'teal',
    category: 'subject',
  },
];
