// src/services/calendarEventStorageService.ts
// Single Source of Truth สำหรับปฏิทินกิจกรรมโรงเรียนและการเชื่อมโยงตารางสอนรายวัน
// ซิงค์ข้อมูลระหว่าง หน้าหลัก (Home Dashboard), ปฏิทินกิจกรรม (AcademicTermsView), และตารางสอน (TimetableView)

import {
  academicCalendarService,
  type SpecialHolidayRecord,
  type WeekendMakeupDayRecord,
} from './academicCalendarService';
import { cleanSlateService } from './cleanSlateService';
import {
  INITIAL_MATRIX_SLOTS,
  type TimetableMatrixSlot,
} from '../utils/timetableDateUtils';

export const CALENDAR_EVENTS_STORAGE_KEY = 'kp_school_calendar_events_v2';
export const MATRIX_STORAGE_KEY = 'kp_teacher_matrix_slots';
export const MATRIX_SLOTS_UPDATED_EVENT = 'kp_matrix_slots_updated';

export type CalendarLegendColor = 'BLUE' | 'ORANGE' | 'GREEN' | 'RED' | 'PURPLE';

export interface CalendarEventItem {
  id: string;
  day: number; // 1 - 31
  month: number; // 1 - 12
  year: number; // 2569
  endDay?: number;
  endMonth?: number;
  endYear?: number;
  fullDateLabel?: string;
  time?: string;
  isAllDay?: boolean;
  title: string;
  category: 'MEETING' | 'SUBMISSION' | 'ACADEMIC' | 'STUDENT' | 'OTHER' | 'EXAM';
  colorType: CalendarLegendColor;
  targetRole: 'TEACHER' | 'STUDENT' | 'ALL' | 'PERSONAL' | 'CUSTOM';
  createdBy?: string;
  assignedNames?: string;
  location?: string;
  description?: string;
}

// ข้อมูลกิจกรรมปฏิทินการศึกษาโรงเรียนตามปฏิทินจริง (Mockup Parity 2569)
export const INITIAL_OCTOBER_EVENTS: CalendarEventItem[] = [
  // 1 ต.ค.
  {
    id: 'oct-1a',
    day: 1,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพุธที่ 1 ตุลาคม 2569',
    time: '08:00',
    title: 'ประชุมครูประจำเดือน',
    category: 'MEETING',
    colorType: 'BLUE',
    targetRole: 'TEACHER',
    location: 'ห้องประชุมใหญ่',
    description: 'ประชุมชี้แจงภาระงานประจำเดือนและเตรียมความพร้อมสอบกลางภาค',
  },
  {
    id: 'oct-1b',
    day: 1,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพุธที่ 1 ตุลาคม 2569',
    time: '13:00',
    title: 'ส่งรายงานผลการสอน',
    category: 'ACADEMIC',
    colorType: 'GREEN',
    targetRole: 'TEACHER',
    location: 'กลุ่มบริหารวิชาการ',
    description: 'ส่งรายงานบันทึกหลังสอนและสถิติการเข้าเรียนประจำเดือน',
  },
  // 2 ต.ค. (วันปัจจุบัน - Anchor Today)
  {
    id: 'oct-2a',
    day: 2,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 2 ตุลาคม 2569',
    time: '08:30',
    title: 'ประชุมฝ่ายวิชาการ',
    category: 'OTHER',
    colorType: 'PURPLE',
    targetRole: 'TEACHER',
    location: 'ห้องประชุมโรงเรียน',
    description: 'ประชุมคณะทำงานขับเคลื่อนผลสัมฤทธิ์ทางการเรียนและการประเมิน SAR',
  },
  {
    id: 'oct-2b',
    day: 2,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 2 ตุลาคม 2569',
    time: '10:00',
    title: 'กิจกรรมวันครู',
    category: 'SUBMISSION',
    colorType: 'ORANGE',
    targetRole: 'TEACHER',
    location: 'หอประชุมศุภชลาศัย',
    description: 'พิธีมอบรางวัลครูดีเด่นและกิจกรรมสานสัมพันธ์คณะครู',
  },
  {
    id: 'oct-2c',
    day: 2,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 2 ตุลาคม 2569',
    time: '15:00',
    title: 'ส่งคะแนนกลางภาค',
    category: 'ACADEMIC',
    colorType: 'GREEN',
    targetRole: 'TEACHER',
    location: 'ระบบออนไลน์ SGS',
    description: 'บันทึกคะแนนเก็บระหว่างภาคและคะแนนสอบกลางภาคลงระบบ SGS',
  },
  // 3 ต.ค.
  {
    id: 'oct-3',
    day: 3,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันศุกร์ที่ 3 ตุลาคม 2569',
    title: 'กิจกรรมค่ายภาษา (นักเรียน ม.1-ม.3)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'สนามกีฬา',
    description: 'กิจกรรมเข้าค่ายเสริมทักษะภาษาต่างประเทศเพื่อการสื่อสาร',
  },
  // 4 ต.ค.
  {
    id: 'oct-4',
    day: 4,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันเสาร์ที่ 4 ตุลาคม 2569',
    title: 'การแข่งขันกีฬาสี (นักเรียน)',
    category: 'STUDENT',
    colorType: 'BLUE',
    targetRole: 'STUDENT',
    location: 'สนามกีฬา',
    description: 'การแข่งขันกีฬาภายในรอบชิงชนะเลิศและพิธีปิดการแข่งขัน',
  },
  // 5 ต.ค.
  {
    id: 'oct-5',
    day: 5,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันอาทิตย์ที่ 5 ตุลาคม 2569',
    time: '09:00',
    title: 'รับสมัครนักเรียน (รอบเพิ่มเติม)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'ห้องประชุม 1',
  },
  // 6 ต.ค.
  {
    id: 'oct-6',
    day: 6,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันจันทร์ที่ 6 ตุลาคม 2569',
    time: '16:00',
    title: 'ส่งข้อสอบกลางภาค (ครูผู้สอน)',
    category: 'OTHER',
    colorType: 'PURPLE',
    targetRole: 'TEACHER',
    location: 'กลุ่มสาระฯ',
  },
  // 7 ต.ค.
  {
    id: 'oct-7',
    day: 7,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันอังคารที่ 7 ตุลาคม 2569',
    time: '09:00',
    title: 'อบรมการใช้สื่อดิจิทัล (ครู)',
    category: 'ACADEMIC',
    colorType: 'GREEN',
    targetRole: 'TEACHER',
    location: 'ห้องปฏิบัติการคอมพิวเตอร์ 1',
  },
  // 8 ต.ค.
  {
    id: 'oct-8',
    day: 8,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพุธที่ 8 ตุลาคม 2569',
    time: '13:30',
    title: 'ประชุมคณะกรรมการสถานศึกษา',
    category: 'MEETING',
    colorType: 'BLUE',
    targetRole: 'TEACHER',
    location: 'ห้องประชุมใหญ่',
  },
  // 9 ต.ค.
  {
    id: 'oct-9',
    day: 9,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 9 ตุลาคม 2569',
    title: 'วันหยุด (วันคล้ายวันสวรรคตฯ)',
    category: 'SUBMISSION',
    colorType: 'ORANGE',
    targetRole: 'ALL',
    location: 'วันหยุดราชการ',
    isAllDay: true,
  },
  // 10 ต.ค.
  {
    id: 'oct-10',
    day: 10,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันศุกร์ที่ 10 ตุลาคม 2569',
    title: 'กิจกรรมจิตอาสา (นักเรียน)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'บริเวณโรงเรียน',
  },
  // 13 ต.ค.
  {
    id: 'oct-13',
    day: 13,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันจันทร์ที่ 13 ตุลาคม 2569',
    title: 'วันนวมินทรมหาราช',
    category: 'OTHER',
    colorType: 'PURPLE',
    targetRole: 'ALL',
    location: 'วันหยุดราชการ',
    isAllDay: true,
    description: 'วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร',
  },
  // 15 ต.ค.
  {
    id: 'oct-15',
    day: 15,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพุธที่ 15 ตุลาคม 2569',
    title: 'ประชุมกลุ่มสาระฯ (ภาษาต่างประเทศ)',
    category: 'MEETING',
    colorType: 'BLUE',
    targetRole: 'TEACHER',
    location: 'ห้องกลุ่มสาระฯ',
  },
  // 16 ต.ค.
  {
    id: 'oct-16',
    day: 16,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 16 ตุลาคม 2569',
    title: 'กำหนดส่งคะแนนปลายภาค (ครูผู้สอน)',
    category: 'OTHER',
    colorType: 'PURPLE',
    targetRole: 'TEACHER',
    location: 'ระบบ SGS',
  },
  // 17 ต.ค.
  {
    id: 'oct-17',
    day: 17,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันศุกร์ที่ 17 ตุลาคม 2569',
    title: 'กิจกรรมสัปดาห์ห้องสมุด (นักเรียน)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'ห้องสมุดเฉลิมพระเกียรติ',
  },
  // 19 ต.ค.
  {
    id: 'oct-19',
    day: 19,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันอาทิตย์ที่ 19 ตุลาคม 2569',
    title: 'ทัศนศึกษา (นักเรียน ม.4-ม.6)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'จังหวัดใกล้เคียง',
  },
  // 21 ต.ค.
  {
    id: 'oct-21',
    day: 21,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันอังคารที่ 21 ตุลาคม 2569',
    title: 'กำหนดส่งเอกสารประเมินผล (ครู)',
    category: 'SUBMISSION',
    colorType: 'ORANGE',
    targetRole: 'TEACHER',
    location: 'ห้องวิชาการ',
  },
  // 23 ต.ค.
  {
    id: 'oct-23',
    day: 23,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 23 ตุลาคม 2569',
    title: 'วันปิยมหาราช',
    category: 'OTHER',
    colorType: 'PURPLE',
    targetRole: 'ALL',
    location: 'วันหยุดราชการ',
    isAllDay: true,
  },
  // 27 ต.ค.
  {
    id: 'oct-27',
    day: 27,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันจันทร์ที่ 27 ตุลาคม 2569',
    title: 'ส่งแผนการจัดการเรียนรู้ (ครู)',
    category: 'MEETING',
    colorType: 'BLUE',
    targetRole: 'TEACHER',
    location: 'กลุ่มสาระการเรียนรู้',
  },
  // 30 ต.ค.
  {
    id: 'oct-30',
    day: 30,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันพฤหัสบดีที่ 30 ตุลาคม 2569',
    title: 'กิจกรรมกีฬาภายใน (นักเรียน)',
    category: 'STUDENT',
    colorType: 'RED',
    targetRole: 'STUDENT',
    location: 'สนามกีฬาใหญ่',
  },
  // 31 ต.ค.
  {
    id: 'oct-31',
    day: 31,
    month: 10,
    year: 2569,
    fullDateLabel: 'วันศุกร์ที่ 31 ตุลาคม 2569',
    title: 'สรุปผลการเรียน (ครู)',
    category: 'SUBMISSION',
    colorType: 'ORANGE',
    targetRole: 'TEACHER',
    location: 'งานวัดและประเมินผล',
  },
];

// Helper แปลงวันจากสตริง เช่น '13 ต.ค. 2569'
export const parseThaiDateString = (
  dateStr: string
): { day: number; month: number; year: number } => {
  const monthMap: Record<string, number> = {
    'ม.ค.': 1, 'มกราคม': 1,
    'ก.พ.': 2, 'กุมภาพันธ์': 2,
    'มี.ค.': 3, 'มีนาคม': 3,
    'เม.ย.': 4, 'เมษายน': 4,
    'พ.ค.': 5, 'พฤษภาคม': 5,
    'มิ.ย.': 6, 'มิถุนายน': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7,
    'ส.ค.': 8, 'สิงหาคม': 8,
    'ก.ย.': 9, 'กันยายน': 9,
    'ต.ค.': 10, 'ตุลาคม': 10,
    'พ.ย.': 11, 'พฤศจิกายน': 11,
    'ธ.ค.': 12, 'ธันวาคม': 12,
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10) || 1;
    const month = monthMap[parts[1]] || 10;
    const year = parseInt(parts[2], 10) || 2569;
    return { day, month, year };
  }
  return { day: 1, month: 10, year: 2569 };
};

export const convertHolidayToCalendarEvent = (
  holiday: SpecialHolidayRecord
): CalendarEventItem => {
  const { day, month, year } = parseThaiDateString(holiday.date);
  return {
    id: `holiday-${holiday.id}`,
    day,
    month,
    year,
    fullDateLabel: `วันที่ ${day} ${holiday.date}`,
    title: holiday.name.startsWith('วัน') ? holiday.name : `วันหยุด: ${holiday.name}`,
    category: 'OTHER',
    colorType: holiday.type === 'GOVERNMENT' ? 'PURPLE' : 'ORANGE',
    targetRole: 'ALL',
    isAllDay: true,
    location: holiday.typeLabel || 'วันหยุดราชการ / โรงเรียน',
    description: holiday.note || 'วันหยุดตามปฏิทินการศึกษา ซิงค์กับระบบการลา',
  };
};

export const convertMakeupDayToCalendarEvent = (
  makeup: WeekendMakeupDayRecord
): CalendarEventItem => {
  const { day, month, year } = parseThaiDateString(makeup.date);
  return {
    id: `makeup-${makeup.id}`,
    day,
    month,
    year,
    fullDateLabel: `วันที่ ${day} ${makeup.date}`,
    title: makeup.title,
    category: 'ACADEMIC',
    colorType: 'GREEN',
    targetRole: 'ALL',
    isAllDay: false,
    time: `08:30 - 15:30 (${makeup.periodCount} คาบ)`,
    location: makeup.targetClasses,
    description: makeup.reason,
  };
};

export const calendarEventStorageService = {
  // อ่านกิจกรรมทั้งหมด: User-Defined + วันหยุดพิเศษ + วันเรียนพิเศษ
  loadAllEvents(): CalendarEventItem[] {
    if (typeof window === 'undefined') {
      return INITIAL_OCTOBER_EVENTS;
    }

    let userEvents: CalendarEventItem[] = [];
    try {
      const raw = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          userEvents = parsed;
        }
      }
    } catch {
      // ignore
    }

    // หากยังไม่มีข้อมูลใน localStorage ให้บันทึกค่าเริ่มต้น (ไม่เป็น mock ว่างเปล่า)
    if (userEvents.length === 0 && !cleanSlateService.isCleanSlateActive()) {
      userEvents = INITIAL_OCTOBER_EVENTS;
      try {
        localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_OCTOBER_EVENTS));
      } catch {}
    }

    // ดึงวันหยุดและวันเรียนชดเชยจาก academicCalendarService (Single Source of Truth)
    let holidayEvents: CalendarEventItem[] = [];
    try {
      const holidays = academicCalendarService.getHolidays().filter((h) => h.isActive);
      const makeups = academicCalendarService.getWeekendMakeupDays().filter((m) => m.isActive);
      holidayEvents = [
        ...holidays.map(convertHolidayToCalendarEvent),
        ...makeups.map(convertMakeupDayToCalendarEvent),
      ];
    } catch {}

    const holidayIds = new Set(holidayEvents.map((h) => h.id));
    const filteredUserEvents = userEvents.filter((u) => !holidayIds.has(u.id));

    return [...holidayEvents, ...filteredUserEvents];
  },

  // บันทึกกิจกรรมผู้ใช้และแจ้งเตือน Event ไปยังทุกคอมโพเนนต์
  saveUserEvents(events: CalendarEventItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(events));
      window.dispatchEvent(new CustomEvent('kps-academic-calendar-updated', { detail: events }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  },

  // ดึงวันปัจจุบันของสัปดาห์ในระบบโรงเรียน (ค่ามาตรฐานคือ 'พฤหัสบดี' วันที่ 2 ต.ค. 2569)
  getTodayDayKey(): 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' {
    const dayMap: Record<number, 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์'> = {
      1: 'จันทร์',
      2: 'อังคาร',
      3: 'พุธ',
      4: 'พฤหัสบดี',
      5: 'ศุกร์',
    };
    const jsDay = new Date().getDay();
    // หากเป็นวันจันทร์-ศุกร์ให้ใช้วันจริง หากเป็นเสาร์-อาทิตย์ให้ใช้ค่าฐานของระบบคือพฤหัสบดี
    return dayMap[jsDay] || 'พฤหัสบดี';
  },

  // อ่าน Matrix Slots ทั้งหมดจาก LocalStorage (ซิงค์ตรงกับหน้าตารางสอน TimetableView)
  loadMatrixSlots(): TimetableMatrixSlot[] {
    if (typeof window === 'undefined') {
      return INITIAL_MATRIX_SLOTS;
    }
    try {
      const raw = localStorage.getItem(MATRIX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_MATRIX_SLOTS;
  },

  // คำนวณจำนวนคาบสอนจริงของวันนี้จาก Matrix Slots (ตัดคาบว่าง, คาบพักเที่ยงออก)
  getTodayTeachingPeriodsCount(dayKey?: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์'): number {
    const targetDay = dayKey || this.getTodayDayKey();
    const matrix = this.loadMatrixSlots();
    const todayTeachingSlots = matrix.filter(
      (s) =>
        s.day === targetDay &&
        !s.isFreePeriod &&
        s.category !== 'free' &&
        !!s.subjectCode &&
        s.status !== 'LUNCH' &&
        !s.isLunchSlot
    );
    return todayTeachingSlots.length;
  },

  // ดึงรายการคาบสอนจริงของวันนี้จาก Matrix Slots
  getTodayTeachingSlots(dayKey?: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์'): TimetableMatrixSlot[] {
    const targetDay = dayKey || this.getTodayDayKey();
    const matrix = this.loadMatrixSlots();
    return matrix
      .filter(
        (s) =>
          s.day === targetDay &&
          !s.isFreePeriod &&
          s.category !== 'free' &&
          !!s.subjectCode &&
          s.status !== 'LUNCH' &&
          !s.isLunchSlot
      )
      .sort((a, b) => a.period - b.period);
  },

  // บันทึกสถานะการเช็คชื่อของคาบสอนลงใน Matrix Slots และกระจาย Event ซิงค์
  markMatrixSlotChecked(day: string, period: number): void {
    if (typeof window === 'undefined') return;
    const current = this.loadMatrixSlots();
    const updated = current.map((s) => {
      if (s.day === day && s.period === period) {
        return { ...s, status: 'CHECKED' as const, isConducted: true };
      }
      return s;
    });
    try {
      localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(MATRIX_SLOTS_UPDATED_EVENT, { detail: updated }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  },
};
