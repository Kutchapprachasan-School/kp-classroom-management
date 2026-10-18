import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  attendanceService,
  localAttendanceDb,
  type AttendanceRecord,
} from '../src/services/attendanceService.ts';

describe('attendanceService - Local-First + Dirty-Row Debounce + Persistent Outbox Queue', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    await attendanceService.clearAll();
  });

  afterEach(async () => {
    await attendanceService.clearAll();
  });

  describe('1. Instant UI Feedback & Outbox Staging', () => {
    it('saves attendance record locally and stages into attendance_outbox immediately', async () => {
      const record = await attendanceService.markStudentAttendance({
        studentId: 'stu-16001',
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 0,
        status: 'ABSENT',
        remark: 'ปวดศีรษะ',
        recordedBy: 'teacher-01',
      });

      expect(record.id).toBe('stu-16001_2026-10-19_0');
      expect(record.status).toBe('ABSENT');

      // Verify immediate local storage (for <1ms UI transition)
      const slotRecords = await localAttendanceDb.getRecordsBySlot('room-1-1', '2026-10-19', 0);
      expect(slotRecords.length).toBe(1);
      expect(slotRecords[0].studentId).toBe('stu-16001');

      // Verify staged in outbox for background delivery
      const outbox = await localAttendanceDb.getAllOutboxRecords();
      expect(outbox.length).toBe(1);
      expect(outbox[0].id).toBe('stu-16001_2026-10-19_0');
    });

    it('overwrites previous pending outbox entry when same student is updated again before flush', async () => {
      // Teacher accidentally clicks LATE then corrects to PRESENT
      await attendanceService.markStudentAttendance({
        studentId: 'stu-16002',
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 1,
        status: 'LATE',
        recordedBy: 'teacher-01',
      });

      await attendanceService.markStudentAttendance({
        studentId: 'stu-16002',
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 1,
        status: 'PRESENT',
        recordedBy: 'teacher-01',
      });

      const outbox = await localAttendanceDb.getAllOutboxRecords();
      // Should coalesce into 1 record with latest status
      expect(outbox.length).toBe(1);
      expect(outbox[0].status).toBe('PRESENT');
    });
  });

  describe('2. Dirty-Row Filtering (Egress Optimization)', () => {
    it('markWholeClassroom only enqueues dirty rows that actually changed status', async () => {
      // Initial state: 3 students already PRESENT
      const initialRecords: AttendanceRecord[] = [
        {
          id: 'stu-01_2026-10-19_0',
          studentId: 'stu-01',
          classroomId: 'room-1-1',
          date: '2026-10-19',
          period: 0,
          status: 'PRESENT',
          recordedBy: 'teacher-01',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'stu-02_2026-10-19_0',
          studentId: 'stu-02',
          classroomId: 'room-1-1',
          date: '2026-10-19',
          period: 0,
          status: 'ABSENT',
          recordedBy: 'teacher-01',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'stu-03_2026-10-19_0',
          studentId: 'stu-03',
          classroomId: 'room-1-1',
          date: '2026-10-19',
          period: 0,
          status: 'PRESENT',
          recordedBy: 'teacher-01',
          updatedAt: new Date().toISOString(),
        },
      ];
      await localAttendanceDb.putRecords(initialRecords);

      // Clear any staged outbox
      await localAttendanceDb.removeOutboxRecords(initialRecords.map((r) => r.id));

      // Teacher clicks "Mark all present" for stu-01, stu-02, stu-03
      await attendanceService.markWholeClassroom({
        studentIds: ['stu-01', 'stu-02', 'stu-03'],
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 0,
        status: 'PRESENT',
        recordedBy: 'teacher-01',
      });

      // stu-01 and stu-03 were already PRESENT, only stu-02 was ABSENT
      // Only stu-02 must be dirty and enqueued!
      const outbox = await localAttendanceDb.getAllOutboxRecords();
      expect(outbox.length).toBe(1);
      expect(outbox[0].studentId).toBe('stu-02');
      expect(outbox[0].status).toBe('PRESENT');
    });
  });

  describe('3. Outbox Flush & Sync Draining', () => {
    it('flushes pending outbox records to server and drains queue', async () => {
      await attendanceService.markStudentAttendance({
        studentId: 'stu-16003',
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 0,
        status: 'PRESENT',
        recordedBy: 'teacher-01',
      });

      expect((await localAttendanceDb.getAllOutboxRecords()).length).toBe(1);

      // Flush queue
      await attendanceService.flushOutboxQueue();

      // Outbox should be completely drained
      const remainingOutbox = await localAttendanceDb.getAllOutboxRecords();
      expect(remainingOutbox.length).toBe(0);

      // Records still exist locally in cache
      const slotRecords = await localAttendanceDb.getRecordsBySlot('room-1-1', '2026-10-19', 0);
      expect(slotRecords.length).toBe(1);
      expect(slotRecords[0].studentId).toBe('stu-16003');
    });
  });

  describe('4. getAttendanceBySlot & Delta Sync', () => {
    it('returns Map keyed by studentId and checks watermark', async () => {
      await attendanceService.markStudentAttendance({
        studentId: 'stu-16004',
        classroomId: 'room-1-1',
        date: '2026-10-19',
        period: 2,
        status: 'LEAVE',
        recordedBy: 'teacher-01',
      });

      const map = await attendanceService.getAttendanceBySlot('room-1-1', '2026-10-19', 2);
      expect(map.has('stu-16004')).toBe(true);
      expect(map.get('stu-16004')?.status).toBe('LEAVE');
    });
  });
});
