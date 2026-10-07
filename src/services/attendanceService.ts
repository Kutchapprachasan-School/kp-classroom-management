import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { timetableScheduleData } from '../data/mockData.ts';
import type { TimetableSlot } from '../types/viewModels.ts';
import { RollCallBatchSchema, type RollCallBatchInput } from './types.ts';
import {
  attendanceCorrelationService,
  normalizeClassroomId,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
} from './attendanceCorrelationService.ts';

export interface AttendanceRecordItem {
  id: string;
  scheduleId: string;
  classroomId: string;
  enrollmentId: string;
  schoolDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  updatedAt: string;
}

const STORAGE_KEY_TIMETABLE = 'cls_timetable_data';
const STORAGE_KEY_ATTENDANCE = 'cls_attendance_records';

const memoryStore = new Map<string, string>();
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, val: string) => {
      memoryStore.set(key, val);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  };
};

const getLocalTimetable = (): TimetableSlot[] => {
  const raw = getStorage().getItem(STORAGE_KEY_TIMETABLE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return timetableScheduleData;
};

const saveLocalTimetable = (items: TimetableSlot[]) => {
  getStorage().setItem(STORAGE_KEY_TIMETABLE, JSON.stringify(items));
};

const getLocalAttendance = (): AttendanceRecordItem[] => {
  const raw = getStorage().getItem(STORAGE_KEY_ATTENDANCE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalAttendance = (items: AttendanceRecordItem[]) => {
  getStorage().setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(items));
};

export const attendanceService = {
  // READ: Get weekly timetable schedule
  async getTimetable(): Promise<TimetableSlot[]> {
    if (isSupabaseConfigured) {
      logDbOperation('SELECT * FROM TimetableSlot ORDER BY day, period');
      const { data, error } = await supabase
        .from('TimetableSlot')
        .select('*')
        .order('period', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as TimetableSlot[];
      }
    }
    return getLocalTimetable();
  },

  // UPDATE: Update a timetable slot
  async updateSlot(day: string, period: number, updates: Partial<TimetableSlot>): Promise<void> {
    const list = getLocalTimetable();
    const idx = list.findIndex((t) => t.day === day && t.period === period);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveLocalTimetable(list);
    }
    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE TimetableSlot WHERE day=${day} AND period=${period}`, updates);
      await supabase.from('TimetableSlot').update(updates).match({ day, period });
    }
  },

  // READ: Get attendance records for a classroom and date (bridged to attendanceCorrelationService)
  async getByDate(classroomId: string, date: string): Promise<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>> {
    // 1. Primary: read from canonical attendanceCorrelationService
    const correlationRecords = attendanceCorrelationService.getPeriodRecordsByDateAndRoom(classroomId, date);
    if (correlationRecords.length > 0) {
      const result: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
      for (const item of correlationRecords) {
        const mappedStatus =
          item.status === 'ACTIVITY' ? 'PRESENT' : item.status === 'TRUANCY' ? 'ABSENT' : item.status;
        result[item.studentId] = mappedStatus as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
      }
      return result;
    }

    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM AttendanceRecord WHERE classroomId = ${classroomId} AND schoolDate = ${date}`);
      const { data, error } = await supabase
        .from('AttendanceRecord')
        .select('*')
        .eq('classroomId', classroomId)
        .eq('schoolDate', date);

      if (!error && data && data.length > 0) {
        const result: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
        for (const item of data) {
          result[item.enrollmentId] = item.status;
        }
        return result;
      }
    }

    const all = getLocalAttendance();
    const filtered = all.filter((a) => a.classroomId === classroomId && a.schoolDate === date);
    const result: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const item of filtered) {
      result[item.enrollmentId] = item.status;
    }
    return result;
  },

  // CREATE / BATCH SAVE: Save roll call records for a class session (bridged to attendanceCorrelationService)
  async saveRollCall(input: RollCallBatchInput): Promise<number> {
    const validated = RollCallBatchSchema.parse(input);
    const now = new Date().toISOString();
    const normRoom = normalizeClassroomId(validated.classroomId);

    // 1. Delegate to attendanceCorrelationService with 4 Integrity Locks
    const periodRecords: PeriodAttendanceRecord[] = validated.records.map((rec) => ({
      id: `per-${validated.schoolDate.replace(/-/g, '')}-p1-${rec.enrollmentId}`,
      date: validated.schoolDate,
      classroomId: normRoom,
      courseCode: 'ศ23101',
      courseName: 'วิชาเรียน',
      periodNo: 1,
      studentId: rec.enrollmentId,
      studentCode: rec.enrollmentId.replace('stu-', '4510'),
      studentName: `นักเรียน ${rec.enrollmentId}`,
      status: rec.status as AttendanceStatusCode,
      source: 'MANUAL',
      isOverridden: false,
      markedAt: now,
    }));

    attendanceCorrelationService.savePeriodRecords(periodRecords);
    attendanceCorrelationService.runCorrelation(normRoom, validated.schoolDate);

    // 2. Also keep local legacy cache in sync
    const all = getLocalAttendance();
    let savedCount = 0;
    for (const rec of validated.records) {
      const idx = all.findIndex(
        (a) =>
          a.classroomId === validated.classroomId &&
          a.schoolDate === validated.schoolDate &&
          a.enrollmentId === rec.enrollmentId
      );

      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          status: rec.status,
          updatedAt: now,
        };
      } else {
        all.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          scheduleId: validated.scheduleId,
          classroomId: validated.classroomId,
          enrollmentId: rec.enrollmentId,
          schoolDate: validated.schoolDate,
          status: rec.status,
          updatedAt: now,
        });
      }
      savedCount++;
    }
    saveLocalAttendance(all);

    if (isSupabaseConfigured) {
      logDbOperation('UPSERT AttendanceRecords batch', { count: savedCount });
      const upsertRows = validated.records.map((r) => ({
        scheduleId: validated.scheduleId,
        classroomId: validated.classroomId,
        enrollmentId: r.enrollmentId,
        schoolDate: validated.schoolDate,
        status: r.status,
        updatedAt: now,
      }));
      await supabase.from('AttendanceRecord').upsert(upsertRows);
    }

    return savedCount;
  },

  // QUICK ROLLCALL: Check all present
  async markAllPresent(scheduleId: string, classroomId: string, schoolDate: string, studentIds: string[]): Promise<number> {
    return this.saveRollCall({
      scheduleId,
      classroomId,
      schoolDate,
      records: studentIds.map((id) => ({ enrollmentId: id, status: 'PRESENT' })),
    });
  },

  // SUMMARY: Get attendance percentage for a classroom (bridged to attendanceCorrelationService)
  async getSummary(classroomId: string): Promise<{ total: number; presentRate: number; absentRate: number }> {
    try {
      const stats = attendanceCorrelationService.getClassroomCumulativeStats(classroomId);
      if (stats.totalStudents > 0) {
        return {
          total: stats.totalStudents,
          presentRate: Math.round(stats.averageRate),
          absentRate: Math.round(100 - stats.averageRate),
        };
      }
    } catch {
      // fallback
    }

    const all = getLocalAttendance().filter((a) => a.classroomId === classroomId);
    if (all.length === 0) return { total: 0, presentRate: 100, absentRate: 0 };

    const present = all.filter((a) => a.status === 'PRESENT').length;
    const absent = all.filter((a) => a.status === 'ABSENT').length;
    const rate = Math.round((present / all.length) * 100);
    const absRate = Math.round((absent / all.length) * 100);

    return { total: all.length, presentRate: rate, absentRate: absRate };
  },
};
