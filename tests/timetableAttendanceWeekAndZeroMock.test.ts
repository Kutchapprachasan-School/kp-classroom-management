import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Polyfill localStorage & window for Node test environment
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => { store.set(key, String(value)); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (i: number) => Array.from(store.keys())[i] || null,
};
(globalThis as any).localStorage = localStorageMock;
(globalThis as any).window = {
  localStorage: localStorageMock,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { computeWeekInfo, INITIAL_MATRIX_SLOTS, type TimetableMatrixSlot } from '../src/utils/timetableDateUtils';
import { attendanceCorrelationService } from '../src/services/attendanceCorrelationService';
import { academicCalendarService } from '../src/services/academicCalendarService';
import { calendarEventStorageService, MATRIX_STORAGE_KEY } from '../src/services/calendarEventStorageService';

describe('Timetable Attendance Status Week-Separation & Zero Mock Verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Simulate Tuesday of Week 1 in Term 2 (20 Oct 2026)
    vi.setSystemTime(new Date('2026-10-20T10:00:00'));

    // Clear test storage
    store.clear();

    const config = academicCalendarService.getConfig();
    const updatedTerms = config.terms.map((t) => ({
      ...t,
      isActive: t.year === 2569 && t.semesterNo === 2,
      startDate: '19 ต.ค. 2569',
      endDate: '26 มี.ค. 2570',
    }));
    academicCalendarService.saveConfig({ terms: updatedTerms });
  });

  afterEach(() => {
    vi.useRealTimers();
    store.clear();
  });

  it('1. computeWeekInfo attaches valid isoDate to every day in weekInfo.days', () => {
    const term = academicCalendarService.getActiveTerm();
    const week1 = computeWeekInfo(0, term);
    expect(week1.weekNumber).toBe(1);
    expect(week1.days).toHaveLength(5);
    expect(week1.days[0].key).toBe('จันทร์');
    expect(week1.days[0].isoDate).toBe('2026-10-19');
    expect(week1.days[1].key).toBe('อังคาร');
    expect(week1.days[1].isoDate).toBe('2026-10-20');
    expect(week1.days[4].key).toBe('ศุกร์');
    expect(week1.days[4].isoDate).toBe('2026-10-23');

    // Week 2
    const week2 = computeWeekInfo(1, term);
    expect(week2.weekNumber).toBe(2);
    expect(week2.days[0].isoDate).toBe('2026-10-26');
    expect(week2.days[1].isoDate).toBe('2026-10-27');
    expect(week2.days[4].isoDate).toBe('2026-10-30');
  });

  it('2. INITIAL_MATRIX_SLOTS does not have hardcoded CHECKED or isConducted: true status', () => {
    const teachingSlots = INITIAL_MATRIX_SLOTS.filter(
      (s) => !s.isFreePeriod && !s.isLunchSlot && s.status !== 'LUNCH'
    );
    const checkedSlots = teachingSlots.filter((s) => s.status === 'CHECKED' || s.isConducted === true);
    expect(checkedSlots).toHaveLength(0);
  });

  it('3. In Week 2, an unchecked slot on future date evaluates to FUTURE, NOT CHECKED or UNCHECKED', () => {
    const term = academicCalendarService.getActiveTerm();
    const week2 = computeWeekInfo(1, term);
    const mondayWeek2Iso = week2.days[0].isoDate; // 2026-10-26 (Future date relative to 2026-10-20)

    const testSlot: TimetableMatrixSlot = {
      id: 'slot-mon-1',
      day: 'จันทร์',
      period: 1,
      subjectCode: 'ศ23101',
      subjectName: 'ศิลปะ 3',
      room: 'ม.3/1 • ห้อง 324',
      isFreePeriod: false,
    };

    const hasAttendance = attendanceCorrelationService.hasPeriodAttendance(
      testSlot.subjectCode,
      testSlot.room,
      mondayWeek2Iso,
      testSlot.period
    );
    expect(hasAttendance).toBe(false);

    // Dynamic slot status calculation check
    const todayIso = '2026-10-20';
    let status: string;
    if (hasAttendance) {
      status = 'CHECKED';
    } else if (mondayWeek2Iso < todayIso) {
      status = 'UNCHECKED';
    } else if (mondayWeek2Iso === todayIso) {
      status = 'UNCHECKED';
    } else {
      status = 'FUTURE';
    }

    expect(status).toBe('FUTURE');
  });

  it('4. When attendance is saved for Week 2 (2026-10-26), ONLY Week 2 turns CHECKED; Week 3 remains FUTURE', () => {
    const term = academicCalendarService.getActiveTerm();
    const week2 = computeWeekInfo(1, term);
    const week3 = computeWeekInfo(2, term);

    const week2MonIso = week2.days[0].isoDate; // 2026-10-26
    const week3MonIso = week3.days[0].isoDate; // 2026-11-02

    const testSlot: TimetableMatrixSlot = {
      id: 'slot-mon-1',
      day: 'จันทร์',
      period: 1,
      subjectCode: 'ศ23101',
      subjectName: 'ศิลปะ 3',
      room: 'ม.3/1 • ห้อง 324',
      isFreePeriod: false,
    };

    // Save attendance specifically for Week 2 Monday
    attendanceCorrelationService.savePeriodRecords([
      {
        id: `period_${week2MonIso}_1_stu-1`,
        date: week2MonIso,
        classroomId: 'room-3-1',
        courseCode: 'ศ23101',
        courseName: 'ศิลปะ 3',
        periodNo: 1,
        studentId: 'stu-1',
        studentCode: '45101',
        studentName: 'เด็กชาย ก',
        status: 'PRESENT',
        source: 'MANUAL',
        isOverridden: false,
        markedAt: new Date().toISOString(),
      },
    ]);

    // Check Week 2 Monday: MUST be true (CHECKED)
    const isWeek2Checked = attendanceCorrelationService.hasPeriodAttendance(
      testSlot.subjectCode,
      testSlot.room,
      week2MonIso,
      testSlot.period
    );
    expect(isWeek2Checked).toBe(true);

    // Check Week 3 Monday: MUST be false (FUTURE, NOT green!)
    const isWeek3Checked = attendanceCorrelationService.hasPeriodAttendance(
      testSlot.subjectCode,
      testSlot.room,
      week3MonIso,
      testSlot.period
    );
    expect(isWeek3Checked).toBe(false);
  });

  it('5. loadMatrixSlotsForRoom returns empty or real slots only, adhering to Zero Mock Policy', () => {
    // Save teacher timetable with 1 Japanese class for ม.6/3 on Friday period 2
    const teacherSlots: TimetableMatrixSlot[] = [
      {
        id: 'slot-fri-2',
        day: 'ศุกร์',
        period: 2,
        subjectCode: 'ญ30206',
        subjectName: 'ญี่ปุ่น 6',
        room: 'ม.6/3',
        isFreePeriod: false,
      },
      {
        id: 'slot-mon-1',
        day: 'จันทร์',
        period: 1,
        subjectCode: 'ศ23101',
        subjectName: 'ศิลปะ 3',
        room: 'ม.3/1',
        isFreePeriod: false,
      },
    ];
    store.set(MATRIX_STORAGE_KEY, JSON.stringify(teacherSlots));

    const roomSlotsM63 = calendarEventStorageService.loadMatrixSlotsForRoom('ม.6/3');
    expect(roomSlotsM63).toHaveLength(1);
    expect(roomSlotsM63[0].subjectCode).toBe('ญ30206');
    expect(roomSlotsM63[0].period).toBe(2);
    expect(roomSlotsM63[0].day).toBe('ศุกร์');

    // On Monday Period 1, there is NO scheduled class for ม.6/3
    const monP1 = roomSlotsM63.find((s) => s.day === 'จันทร์' && s.period === 1);
    expect(monP1).toBeUndefined(); // Zero Mock: MUST be undefined / free period, never duplicate ญ30206
  });
});
