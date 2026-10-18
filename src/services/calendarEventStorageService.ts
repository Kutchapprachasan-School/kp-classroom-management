// src/services/calendarEventStorageService.ts
// Single Source of Truth สำหรับปฏิทินกิจกรรมโรงเรียนและการเชื่อมโยงตารางสอนรายวัน
// ซิงค์ข้อมูลระหว่าง หน้าหลัก (Home Dashboard), ปฏิทินกิจกรรม (AcademicTermsView), และตารางสอน (TimetableView)

import {
  academicCalendarService,
  type SpecialHolidayRecord,
  type WeekendMakeupDayRecord,
} from './academicCalendarService.ts';
import { cleanSlateService } from './cleanSlateService';
import { bellScheduleService } from './bellScheduleService';
import {
  INITIAL_MATRIX_SLOTS,
  getBangkokNow,
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
export const INITIAL_OCTOBER_EVENTS: CalendarEventItem[] = [];

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
  const cleanDate = holiday.date.startsWith('วันที่') ? holiday.date : `วันที่ ${holiday.date}`;
  return {
    id: `holiday-${holiday.id}`,
    day,
    month,
    year,
    fullDateLabel: cleanDate,
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
  const cleanDate = makeup.date.startsWith('วันที่') ? makeup.date : `วันที่ ${makeup.date}`;
  return {
    id: `makeup-${makeup.id}`,
    day,
    month,
    year,
    fullDateLabel: cleanDate,
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
      return [];
    }

    let userEvents: CalendarEventItem[] = [];
    try {
      const raw = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // กรองข้อมูล mock เก่าที่มีรหัสขึ้นต้นด้วย oct- ออกให้หมด 100%
          userEvents = parsed.filter((e) => !e.id?.startsWith('oct-'));
          if (userEvents.length !== parsed.length) {
            localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(userEvents));
          }
        }
      }
    } catch {
      // ignore
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

  // ดึงวันปัจจุบันของสัปดาห์ในระบบโรงเรียนตาม Time Zone Asia/Bangkok
  getTodayDayKey(): 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' {
    const dayMap: Record<number, 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์'> = {
      1: 'จันทร์',
      2: 'อังคาร',
      3: 'พุธ',
      4: 'พฤหัสบดี',
      5: 'ศุกร์',
    };
    const bDate = getBangkokNow();
    const jsDay = bDate.getDay();
    // หากเป็นวันจันทร์-ศุกร์ให้ใช้วันจริง หากเป็นเสาร์-อาทิตย์ให้ใช้ค่าวันศุกร์เพื่อแสดงผลตารางสอน
    return dayMap[jsDay] || 'ศุกร์';
  },

  // อ่าน Matrix Slots ทั้งหมดจาก LocalStorage (ซิงค์ตรงกับหน้าตารางสอน TimetableView)
  loadMatrixSlots(): TimetableMatrixSlot[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(MATRIX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return bellScheduleService.syncMatrixSlotsWithBellSchedule(parsed);
        }
      }
    } catch {}
    const initial = cleanSlateService.isCleanSlateActive() ? [] : INITIAL_MATRIX_SLOTS;
    return bellScheduleService.syncMatrixSlotsWithBellSchedule(initial);
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
        s.subjectCode !== 'พักกลางวัน' &&
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
          s.subjectCode !== 'พักกลางวัน' &&
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
