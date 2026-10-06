// src/utils/timetableDateUtils.ts
// Date calculation helpers and constants for Teacher Timetable

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
  dayDate: string;
  period: number;
  timeRange: string;
  subjectCode: string;
  room: string;
  subjectName: string;
  isConducted: boolean;
  isFreePeriod?: boolean;
  colorTheme: TimetableColorTheme;
  category: 'subject' | 'activity' | 'meeting' | 'free';
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
  dateRangeLabel: string;
  days: WeekDayInfo[];
}

export const computeWeekInfo = (offset: number): ComputedWeekInfo => {
  // Base anchor Monday: 29 Sep 2026 (2569 BE)
  // Base Thursday (Today): 2 Oct 2026 (2569 BE)
  const baseMonday = new Date(2026, 8, 29); // 0-indexed month 8 = September
  const startMonday = new Date(baseMonday);
  startMonday.setDate(baseMonday.getDate() + offset * 7);

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
      isToday: offset === 0 && key === 'พฤหัสบดี',
    };
  });

  return {
    weekNumber: 29 + offset,
    dateRangeLabel: `${formatThaiDate(startMonday)} – ${formatThaiDate(endSunday)}`,
    days,
  };
};

export const PERIOD_DEFINITIONS = [
  { period: 1, timeRange: '07:45 - 08:30', label: 'คาบ 1' },
  { period: 2, timeRange: '08:30 - 09:20', label: 'คาบ 2' },
  { period: 3, timeRange: '09:20 - 10:10', label: 'คาบ 3' },
  { period: 4, timeRange: '11:10 - 12:00', label: 'คาบ 4' },
  { period: 5, timeRange: '14:00 - 15:30', label: 'คาบ 5' },
  { period: 6, timeRange: '15:30 - 16:30', label: 'คาบ 6' },
];

export const INITIAL_MATRIX_SLOTS: TimetableMatrixSlot[] = [
  // Period 1 (07:45 - 08:30)
  {
    id: 'slot-mon-1',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 1,
    timeRange: '07:45 - 08:30',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-tue-1',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 1,
    timeRange: '07:45 - 08:30',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-wed-1',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 1,
    timeRange: '07:45 - 08:30',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-thu-1',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 1,
    timeRange: '07:45 - 08:30',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },

  // Period 2 (08:30 - 09:20)
  {
    id: 'slot-mon-2',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 2,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-tue-2',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 2,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-wed-2',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 2,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },
  {
    id: 'slot-thu-2',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 2,
    timeRange: '08:30 - 09:20',
    subjectCode: 'ญ31201',
    room: 'ม.4/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'pink',
    category: 'subject',
  },

  // Period 3 (09:20 - 10:10)
  {
    id: 'slot-mon-3',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 3,
    timeRange: '09:20 - 10:10',
    subjectCode: 'กิจกรรมพัฒนาผู้เรียน',
    room: 'ม.3',
    subjectName: '',
    isConducted: true,
    colorTheme: 'teal',
    category: 'activity',
  },
  {
    id: 'slot-tue-3',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 3,
    timeRange: '09:20 - 10:10',
    subjectCode: 'แนะแนว',
    room: 'ม.3',
    subjectName: '',
    isConducted: true,
    colorTheme: 'purple',
    category: 'activity',
  },
  {
    id: 'slot-wed-3',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 3,
    timeRange: '09:20 - 10:10',
    subjectCode: 'ญ33201',
    room: 'ม.6/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'green',
    category: 'subject',
  },
  {
    id: 'slot-thu-3',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 3,
    timeRange: '09:20 - 10:10',
    subjectCode: 'คาบว่าง',
    room: '',
    subjectName: '',
    isConducted: false,
    isFreePeriod: true,
    colorTheme: 'free',
    category: 'free',
  },

  // Period 4 (11:10 - 12:00)
  {
    id: 'slot-mon-4',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 4,
    timeRange: '11:10 - 12:00',
    subjectCode: 'ญ33201',
    room: 'ม.6/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: true,
    colorTheme: 'green',
    category: 'subject',
  },
  {
    id: 'slot-tue-4',
    day: 'อังคาร',
    dayDate: '30 ก.ย. 2569',
    period: 4,
    timeRange: '11:10 - 12:00',
    subjectCode: 'ญ22201',
    room: 'ม.2/1',
    subjectName: 'ภาษาญี่ปุ่นพื้นฐาน',
    isConducted: true,
    colorTheme: 'blue',
    category: 'subject',
  },
  {
    id: 'slot-wed-4',
    day: 'พุธ',
    dayDate: '1 ต.ค. 2569',
    period: 4,
    timeRange: '11:10 - 12:00',
    subjectCode: 'กิจกรรมพัฒนาผู้เรียน',
    room: 'ม.6',
    subjectName: '',
    isConducted: true,
    colorTheme: 'purple',
    category: 'activity',
  },
  {
    id: 'slot-thu-4',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 4,
    timeRange: '11:10 - 12:00',
    subjectCode: 'ญ33201',
    room: 'ม.6/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: false,
    colorTheme: 'purple',
    category: 'subject',
  },

  // Period 5 (14:00 - 15:30)
  {
    id: 'slot-mon-5',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 5,
    timeRange: '14:00 - 15:30',
    subjectCode: 'ญ21202',
    room: 'ม.1/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: false,
    colorTheme: 'amber',
    category: 'subject',
  },
  {
    id: 'slot-thu-5',
    day: 'พฤหัสบดี',
    dayDate: '2 ต.ค. 2569',
    period: 5,
    timeRange: '14:00 - 15:30',
    subjectCode: 'ญ21202',
    room: 'ม.1/1',
    subjectName: 'ภาษาญี่ปุ่น',
    isConducted: false,
    colorTheme: 'blue',
    category: 'subject',
  },

  // Period 6 (15:30 - 16:30)
  {
    id: 'slot-mon-6',
    day: 'จันทร์',
    dayDate: '29 ก.ย. 2569',
    period: 6,
    timeRange: '15:30 - 16:30',
    subjectCode: 'PLC / ประชุม',
    room: '',
    subjectName: '',
    isConducted: true,
    colorTheme: 'blue',
    category: 'meeting',
  },
];
