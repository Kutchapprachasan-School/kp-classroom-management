import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { timetableScheduleData } from '../data/mockData';
import type { TimetableSlot } from '../types/viewModels';
import { RollCallBatchSchema, type RollCallBatchInput } from './types';

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

const getLocalTimetable = (): TimetableSlot[] => {
  const raw = localStorage.getItem(STORAGE_KEY_TIMETABLE);
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
  localStorage.setItem(STORAGE_KEY_TIMETABLE, JSON.stringify(items));
};

const getLocalAttendance = (): AttendanceRecordItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [
    { id: 'att-1', scheduleId: 'sched-1', classroomId: 'room-3-1', enrollmentId: 'stu-1', schoolDate: '2026-08-20', status: 'PRESENT', updatedAt: '2026-08-20T08:45:00Z' },
    { id: 'att-2', scheduleId: 'sched-1', classroomId: 'room-3-1', enrollmentId: 'stu-2', schoolDate: '2026-08-20', status: 'PRESENT', updatedAt: '2026-08-20T08:45:00Z' },
    { id: 'att-3', scheduleId: 'sched-1', classroomId: 'room-3-1', enrollmentId: 'stu-7', schoolDate: '2026-08-20', status: 'ABSENT', updatedAt: '2026-08-20T08:45:00Z' },
    { id: 'att-4', scheduleId: 'sched-1', classroomId: 'room-3-1', enrollmentId: 'stu-10', schoolDate: '2026-08-20', status: 'ABSENT', updatedAt: '2026-08-20T08:45:00Z' },
    { id: 'att-5', scheduleId: 'sched-1', classroomId: 'room-3-1', enrollmentId: 'stu-12', schoolDate: '2026-08-20', status: 'LATE', updatedAt: '2026-08-20T08:50:00Z' },
  ];
};

const saveLocalAttendance = (items: AttendanceRecordItem[]) => {
  localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(items));
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

  // READ: Get attendance records for a classroom and date
  async getByDate(classroomId: string, date: string): Promise<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>> {
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

  // CREATE / BATCH SAVE: Save roll call records for a class session
  async saveRollCall(input: RollCallBatchInput): Promise<number> {
    const validated = RollCallBatchSchema.parse(input);
    const all = getLocalAttendance();
    const now = new Date().toISOString();

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

  // SUMMARY: Get attendance percentage for a classroom
  async getSummary(classroomId: string): Promise<{ total: number; presentRate: number; absentRate: number }> {
    const all = getLocalAttendance().filter((a) => a.classroomId === classroomId);
    if (all.length === 0) return { total: 0, presentRate: 100, absentRate: 0 };

    const present = all.filter((a) => a.status === 'PRESENT').length;
    const absent = all.filter((a) => a.status === 'ABSENT').length;
    const rate = Math.round((present / all.length) * 100);
    const absRate = Math.round((absent / all.length) * 100);

    return { total: all.length, presentRate: rate, absentRate: absRate };
  },
};
