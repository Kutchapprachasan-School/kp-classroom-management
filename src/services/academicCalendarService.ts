// src/services/academicCalendarService.ts
// บริการจัดการปีการศึกษา, ภาคเรียน, วันเปิด-ปิดเทอม, วันหยุดพิเศษ, และวันมาเรียนพิเศษ (เสาร์-อาทิตย์)
// ข้อมูลถูกย้ายมาอยู่ที่ส่วน "ตั้งค่า" (Settings) ตามมาตรฐานโรงเรียน

import { getSchoolSettings, saveSchoolSettings } from '../config/schoolRoles';

export type HolidayType = 'GOVERNMENT' | 'SCHOOL_SPECIAL' | 'BRIDGE_DAY' | 'RELIGIOUS';
export type DayOfWeek = 'SATURDAY' | 'SUNDAY';

export interface AcademicTermRecord {
  id: string;
  year: number; // e.g. 2569
  termName: string; // e.g. 'ภาคเรียนที่ 1'
  semesterNo: 1 | 2;
  startDate: string; // e.g. '15 พ.ค. 2569'
  endDate: string; // e.g. '10 ต.ค. 2569'
  isActive: boolean;
  isArchived: boolean;
  studentCount: number;
  classCount: number;
  note?: string;
}

export interface SpecialHolidayRecord {
  id: string;
  name: string;
  date: string; // e.g. '12 ส.ค. 2569'
  type: HolidayType;
  typeLabel: string;
  note?: string;
  isActive: boolean;
}

export interface WeekendMakeupDayRecord {
  id: string;
  title: string;
  date: string; // e.g. '19 ส.ค. 2569'
  dayOfWeek: DayOfWeek;
  reason: string;
  targetClasses: string; // e.g. 'ทุกระดับชั้น (ม.1 - ม.6)'
  substituteForDate?: string; // e.g. 'ชดเชยวันหยุดกิจกรรม 14 ส.ค.'
  periodCount: number;
  isActive: boolean;
}

export interface AcademicCalendarConfig {
  terms: AcademicTermRecord[];
  holidays: SpecialHolidayRecord[];
  weekendMakeupDays: WeekendMakeupDayRecord[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

const STORAGE_KEY_CALENDAR_CONFIG = 'kp_academic_calendar_settings_v2';
export const ACADEMIC_CALENDAR_EVENT = 'kps-academic-calendar-updated';

const DEFAULT_TERMS: AcademicTermRecord[] = [
  {
    id: 't-2569-1',
    year: 2569,
    termName: 'ภาคเรียนที่ 1',
    semesterNo: 1,
    startDate: '15 พ.ค. 2569',
    endDate: '10 ต.ค. 2569',
    isActive: true,
    isArchived: false,
    studentCount: 525,
    classCount: 12,
    note: 'ภาคเรียนปัจจุบัน กำลังเปิดการเรียนการสอน',
  },
  {
    id: 't-2568-2',
    year: 2568,
    termName: 'ภาคเรียนที่ 2',
    semesterNo: 2,
    startDate: '1 พ.ย. 2568',
    endDate: '15 มี.ค. 2569',
    isActive: false,
    isArchived: true,
    studentCount: 518,
    classCount: 12,
    note: 'จัดเก็บประวัติผลการเรียนและคะแนน SGS แล้ว',
  },
  {
    id: 't-2568-1',
    year: 2568,
    termName: 'ภาคเรียนที่ 1',
    semesterNo: 1,
    startDate: '15 พ.ค. 2568',
    endDate: '30 ก.ย. 2568',
    isActive: false,
    isArchived: true,
    studentCount: 520,
    classCount: 12,
    note: 'จัดเก็บประวัติผลการเรียนแล้ว',
  },
];

const DEFAULT_HOLIDAYS: SpecialHolidayRecord[] = [
  {
    id: 'hol-1',
    name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    date: '28 ก.ค. 2569',
    type: 'GOVERNMENT',
    typeLabel: 'วันหยุดราชการ',
    note: 'วันหยุดราชการประจำปี',
    isActive: true,
  },
  {
    id: 'hol-2',
    name: 'วันแม่แห่งชาติ',
    date: '12 ส.ค. 2569',
    type: 'GOVERNMENT',
    typeLabel: 'วันหยุดราชการ',
    note: 'วันหยุดราชการและวันแม่แห่งชาติ',
    isActive: true,
  },
  {
    id: 'hol-3',
    name: 'วันหยุดพิเศษประจำโรงเรียน - วันพัฒนาครูและบุคลากร',
    date: '4 ก.ย. 2569',
    type: 'SCHOOL_SPECIAL',
    typeLabel: 'วันหยุดกรณีพิเศษโรงเรียน',
    note: 'โรงเรียนปิดทำการเรียนการสอนเนื่องจากการประชุมสัมมนาครูประจำภาคเรียน',
    isActive: true,
  },
  {
    id: 'hol-4',
    name: 'วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราชฯ',
    date: '13 ต.ค. 2569',
    type: 'GOVERNMENT',
    typeLabel: 'วันหยุดราชการ',
    note: 'วันนวมินทรมหาราช',
    isActive: true,
  },
  {
    id: 'hol-5',
    name: 'วันปิยมหาราช',
    date: '23 ต.ค. 2569',
    type: 'GOVERNMENT',
    typeLabel: 'วันหยุดราชการ',
    note: 'วันหยุดราชการประจำปี',
    isActive: true,
  },
];

const DEFAULT_WEEKEND_MAKEUP_DAYS: WeekendMakeupDayRecord[] = [
  {
    id: 'wm-1',
    title: 'เรียนชดเชยวันเสาร์ (ชดเชยวันหยุดพัฒนาบุคลากร 4 ก.ย.)',
    date: '19 ก.ย. 2569',
    dayOfWeek: 'SATURDAY',
    reason: 'เรียนชดเชยตามตารางวันศุกร์เพื่อให้นักเรียนมีชั่วโมงเรียนครบตามเกณฑ์ สพฐ.',
    targetClasses: 'ทุกระดับชั้น (ม.1 - ม.6)',
    substituteForDate: '4 ก.ย. 2569',
    periodCount: 7,
    isActive: true,
  },
  {
    id: 'wm-2',
    title: 'ค่ายติวเข้มยกระดับผลสัมฤทธิ์ O-NET / TGAT-TPAT (เสาร์-อาทิตย์)',
    date: '26 ก.ย. 2569',
    dayOfWeek: 'SATURDAY',
    reason: 'เสริมทักษะทางวิชาการและการเตรียมความพร้อมสอบระดับชาติ',
    targetClasses: 'เฉพาะระดับชั้น ม.3 และ ม.6',
    substituteForDate: 'กิจกรรมยกระดับผลสัมฤทธิ์ สพฐ.',
    periodCount: 6,
    isActive: true,
  },
  {
    id: 'wm-3',
    title: 'กิจกรรมค่ายดนตรีและศิลปะสร้างสรรค์สัญจร (วันเสาร์)',
    date: '3 ต.ค. 2569',
    dayOfWeek: 'SATURDAY',
    reason: 'ฝึกซ้อมการแสดงดนตรีและจัดทำผลงานศิลปะเพื่อเตรียมส่งประกวด',
    targetClasses: 'นักเรียนห้อง ม.3/1 และกลุ่มสาระการเรียนรู้ศิลปะ',
    substituteForDate: 'กิจกรรมเสริมหลักสูตร',
    periodCount: 5,
    isActive: true,
  },
];

export const academicCalendarService = {
  // อ่านการตั้งค่าทั้งหมด
  getConfig(): AcademicCalendarConfig {
    if (typeof window === 'undefined') {
      return {
        terms: DEFAULT_TERMS,
        holidays: DEFAULT_HOLIDAYS,
        weekendMakeupDays: DEFAULT_WEEKEND_MAKEUP_DAYS,
        lastUpdatedBy: 'ฝ่ายบริหารวิชาการ',
        lastUpdatedAt: '30 ก.ย. 2569',
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CALENDAR_CONFIG);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          terms: parsed.terms || DEFAULT_TERMS,
          holidays: parsed.holidays || DEFAULT_HOLIDAYS,
          weekendMakeupDays: parsed.weekendMakeupDays || DEFAULT_WEEKEND_MAKEUP_DAYS,
          lastUpdatedBy: parsed.lastUpdatedBy || 'ฝ่ายบริหารวิชาการ',
          lastUpdatedAt: parsed.lastUpdatedAt || '30 ก.ย. 2569',
        };
      }
    } catch {
      // fallback
    }

    return {
      terms: DEFAULT_TERMS,
      holidays: DEFAULT_HOLIDAYS,
      weekendMakeupDays: DEFAULT_WEEKEND_MAKEUP_DAYS,
      lastUpdatedBy: 'ฝ่ายบริหารวิชาการ',
      lastUpdatedAt: '30 ก.ย. 2569',
    };
  },

  // บันทึกการตั้งค่าทั้งหมดลง LocalStorage และแจ้งเตือน Event
  saveConfig(
    config: Partial<AcademicCalendarConfig>,
    updatedBy = 'ฝ่ายบริหารวิชาการ'
  ): AcademicCalendarConfig {
    const current = this.getConfig();
    const next: AcademicCalendarConfig = {
      ...current,
      ...config,
      lastUpdatedBy: updatedBy,
      lastUpdatedAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CALENDAR_CONFIG, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(ACADEMIC_CALENDAR_EVENT, { detail: next }));
    }

    return next;
  },

  // ===================== ภาคเรียน & ปีการศึกษา =====================

  getTerms(): AcademicTermRecord[] {
    return this.getConfig().terms;
  },

  getActiveTerm(): AcademicTermRecord {
    const terms = this.getTerms();
    return terms.find((t) => t.isActive) || terms[0] || DEFAULT_TERMS[0];
  },

  // สลับภาคเรียนปัจจุบัน (Sync ไปยัง School Branding Settings ด้วย)
  setActiveTerm(termId: string, updatedBy = 'แอดมินฝ่ายวิชาการ'): AcademicTermRecord | null {
    const terms = this.getTerms();
    const target = terms.find((t) => t.id === termId);
    if (!target) return null;

    const nextTerms = terms.map((t) => ({
      ...t,
      isActive: t.id === termId,
      isArchived: t.id !== termId && t.isArchived,
    }));

    this.saveConfig({ terms: nextTerms }, updatedBy);

    // ซิงค์ชื่อภาคเรียนเข้ากับ School Branding Settings
    const activeLabel = `${target.termName}/${target.year}`;
    const schoolSettings = getSchoolSettings();
    if (schoolSettings.academicTerm !== activeLabel) {
      saveSchoolSettings({ academicTerm: activeLabel });
    }

    return target;
  },

  // สร้างปีการศึกษา/ภาคเรียนใหม่
  createTerm(
    payload: {
      year: number;
      semesterNo: 1 | 2;
      startDate: string;
      endDate: string;
      note?: string;
    },
    updatedBy = 'แอดมินฝ่ายวิชาการ'
  ): AcademicTermRecord {
    const terms = this.getTerms();
    const newTerm: AcademicTermRecord = {
      id: `t-${payload.year}-${payload.semesterNo}-${Date.now()}`,
      year: payload.year,
      termName: `ภาคเรียนที่ ${payload.semesterNo}`,
      semesterNo: payload.semesterNo,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isActive: false,
      isArchived: false,
      studentCount: 525,
      classCount: 12,
      note: payload.note || 'สร้างขึ้นใหม่โดยฝ่ายวิชาการ',
    };

    const nextTerms = [newTerm, ...terms];
    this.saveConfig({ terms: nextTerms }, updatedBy);
    return newTerm;
  },

  updateTerm(
    id: string,
    updates: Partial<AcademicTermRecord>,
    updatedBy = 'แอดมินฝ่ายวิชาการ'
  ): AcademicTermRecord | null {
    const terms = this.getTerms();
    const index = terms.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updated = { ...terms[index], ...updates };
    terms[index] = updated;

    this.saveConfig({ terms }, updatedBy);

    if (updated.isActive) {
      const activeLabel = `${updated.termName}/${updated.year}`;
      saveSchoolSettings({ academicTerm: activeLabel });
    }

    return updated;
  },

  deleteTerm(id: string, updatedBy = 'แอดมินฝ่ายวิชาการ'): boolean {
    const terms = this.getTerms();
    const target = terms.find((t) => t.id === id);
    if (!target || target.isActive) {
      // ไม่อนุญาตให้ลบภาคเรียนที่กำลัง Active
      return false;
    }

    const nextTerms = terms.filter((t) => t.id !== id);
    this.saveConfig({ terms: nextTerms }, updatedBy);
    return true;
  },

  // ===================== วันหยุดพิเศษ =====================

  getHolidays(): SpecialHolidayRecord[] {
    return this.getConfig().holidays;
  },

  addHoliday(
    payload: {
      name: string;
      date: string;
      type: HolidayType;
      note?: string;
    },
    updatedBy = 'แอดมินฝ่ายวิชาการ'
  ): SpecialHolidayRecord {
    const typeLabelMap: Record<HolidayType, string> = {
      GOVERNMENT: 'วันหยุดราชการ',
      SCHOOL_SPECIAL: 'วันหยุดกรณีพิเศษโรงเรียน',
      BRIDGE_DAY: 'วันหยุดชดเชย/กรณีพิเศษ',
      RELIGIOUS: 'วันสำคัญทางศาสนา',
    };

    const newHoliday: SpecialHolidayRecord = {
      id: `hol-${Date.now()}`,
      name: payload.name,
      date: payload.date,
      type: payload.type,
      typeLabel: typeLabelMap[payload.type] || 'วันหยุดพิเศษ',
      note: payload.note,
      isActive: true,
    };

    const holidays = [newHoliday, ...this.getHolidays()];
    this.saveConfig({ holidays }, updatedBy);
    return newHoliday;
  },

  toggleHoliday(id: string, updatedBy = 'แอดมินฝ่ายวิชาการ'): SpecialHolidayRecord | null {
    const holidays = this.getHolidays().map((h) =>
      h.id === id ? { ...h, isActive: !h.isActive } : h
    );
    this.saveConfig({ holidays }, updatedBy);
    return holidays.find((h) => h.id === id) || null;
  },

  deleteHoliday(id: string, updatedBy = 'แอดมินฝ่ายวิชาการ'): boolean {
    const current = this.getHolidays();
    const filtered = current.filter((h) => h.id !== id);
    if (filtered.length === current.length) return false;
    this.saveConfig({ holidays: filtered }, updatedBy);
    return true;
  },

  // ===================== วันมาเรียนพิเศษ (เสาร์-อาทิตย์) =====================

  getWeekendMakeupDays(): WeekendMakeupDayRecord[] {
    return this.getConfig().weekendMakeupDays;
  },

  addWeekendMakeupDay(
    payload: {
      title: string;
      date: string;
      dayOfWeek: DayOfWeek;
      reason: string;
      targetClasses: string;
      substituteForDate?: string;
      periodCount?: number;
    },
    updatedBy = 'แอดมินฝ่ายวิชาการ'
  ): WeekendMakeupDayRecord {
    const newDay: WeekendMakeupDayRecord = {
      id: `wm-${Date.now()}`,
      title: payload.title,
      date: payload.date,
      dayOfWeek: payload.dayOfWeek,
      reason: payload.reason,
      targetClasses: payload.targetClasses,
      substituteForDate: payload.substituteForDate,
      periodCount: payload.periodCount || 6,
      isActive: true,
    };

    const weekendMakeupDays = [newDay, ...this.getWeekendMakeupDays()];
    this.saveConfig({ weekendMakeupDays }, updatedBy);
    return newDay;
  },

  toggleWeekendMakeupDay(
    id: string,
    updatedBy = 'แอดมินฝ่ายวิชาการ'
  ): WeekendMakeupDayRecord | null {
    const days = this.getWeekendMakeupDays().map((d) =>
      d.id === id ? { ...d, isActive: !d.isActive } : d
    );
    this.saveConfig({ weekendMakeupDays: days }, updatedBy);
    return days.find((d) => d.id === id) || null;
  },

  deleteWeekendMakeupDay(id: string, updatedBy = 'แอดมินฝ่ายวิชาการ'): boolean {
    const current = this.getWeekendMakeupDays();
    const filtered = current.filter((d) => d.id !== id);
    if (filtered.length === current.length) return false;
    this.saveConfig({ weekendMakeupDays: filtered }, updatedBy);
    return true;
  },
};
