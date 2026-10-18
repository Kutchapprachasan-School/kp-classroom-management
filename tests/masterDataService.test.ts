import { describe, it, expect, beforeEach } from 'vitest';
import { masterDataService } from '../src/services/masterDataService.ts';
import { localCacheDb, type CachedStudent, type CachedClassroom } from '../src/services/localCacheDb.ts';

describe('masterDataService & localCacheDb - 3-Tier Cache & Delta Sync Verification', () => {
  beforeEach(async () => {
    await masterDataService.clearAll();
  });

  describe('1. localCacheDb Store & Fallback Operations', () => {
    it('stores and retrieves classrooms with proper sorting', async () => {
      const mockRooms: CachedClassroom[] = [
        { id: 'room-1-2', name: 'ม.1/2', gradeLevel: 1, roomNumber: 2 },
        { id: 'room-1-1', name: 'ม.1/1', gradeLevel: 1, roomNumber: 1 },
      ];

      await localCacheDb.putClassrooms(mockRooms);
      const retrieved = await localCacheDb.getAllClassrooms();

      expect(retrieved.length).toBe(2);
      expect(retrieved[0].id).toBe('room-1-1');
      expect(retrieved[1].id).toBe('room-1-2');
    });

    it('stores and retrieves students by classroomId indexed by seat number', async () => {
      const mockStudents: CachedStudent[] = [
        {
          id: 'stu-102',
          studentCode: '102',
          code: '102',
          number: 2,
          no: 2,
          prefix: 'ด.ช.',
          title: 'ด.ช.',
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          name: 'ด.ช. สมชาย ใจดี',
          classroomId: 'room-1-1',
          status: 'ACTIVE',
          gender: 'MALE',
          avatarUrl: null,
        },
        {
          id: 'stu-101',
          studentCode: '101',
          code: '101',
          number: 1,
          no: 1,
          prefix: 'ด.ญ.',
          title: 'ด.ญ.',
          firstName: 'สมหญิง',
          lastName: 'รักเรียน',
          name: 'ด.ญ. สมหญิง รักเรียน',
          classroomId: 'room-1-1',
          status: 'ACTIVE',
          gender: 'FEMALE',
          avatarUrl: null,
        },
        {
          id: 'stu-201',
          studentCode: '201',
          code: '201',
          number: 1,
          no: 1,
          prefix: 'นาย',
          title: 'นาย',
          firstName: 'ก้อง',
          lastName: 'เก่ง',
          name: 'นาย ก้อง เก่ง',
          classroomId: 'room-2-1',
          status: 'ACTIVE',
          gender: 'MALE',
          avatarUrl: null,
        },
      ];

      await localCacheDb.putStudents(mockStudents);
      const room1Students = await localCacheDb.getStudentsByClassroom('room-1-1');

      expect(room1Students.length).toBe(2);
      expect(room1Students[0].id).toBe('stu-101');
      expect(room1Students[0].number).toBe(1);
      expect(room1Students[1].id).toBe('stu-102');
      expect(room1Students[1].number).toBe(2);

      const room2Students = await localCacheDb.getStudentsByClassroom('room-2-1');
      expect(room2Students.length).toBe(1);
      expect(room2Students[0].id).toBe('stu-201');
    });

    it('stores and tracks sync metadata watermarks', async () => {
      const meta = {
        scopeKey: 'students_room-1-1',
        lastSyncedIso: '2026-10-18T10:00:00.000Z',
        lastCheckedMs: Date.now(),
      };

      await localCacheDb.setSyncMeta(meta);
      const fetched = await localCacheDb.getSyncMeta('students_room-1-1');

      expect(fetched).not.toBeNull();
      expect(fetched?.lastSyncedIso).toBe('2026-10-18T10:00:00.000Z');
      expect(fetched?.scopeKey).toBe('students_room-1-1');
    });
  });

  describe('2. masterDataService 3-Tier Cache Performance', () => {
    it('serves repeated requests from L1 RAM cache without network overhead', async () => {
      // First fetch (fetches from Neon / DB)
      const firstFetch = await masterDataService.getStudentsByRoom('room-1-2');
      expect(firstFetch.length).toBeGreaterThan(0);

      // Verify synchronous L1 RAM Cache retrieval
      const syncL1 = masterDataService.getCachedStudentsSync('room-1-2');
      expect(syncL1).not.toBeNull();
      expect(syncL1?.length).toBe(firstFetch.length);

      // Second fetch should return immediately from L1 RAM
      const t0 = performance.now();
      const secondFetch = await masterDataService.getStudentsByRoom('room-1-2');
      const duration = performance.now() - t0;

      expect(secondFetch).toBe(firstFetch); // Exact memory reference from L1 cache
      expect(duration).toBeLessThan(10); // Under 10ms (typically <0.1ms)
    });

    it('invalidates room cache when invalidateRoom is called', async () => {
      await masterDataService.getStudentsByRoom('room-1-2');
      expect(masterDataService.getCachedStudentsSync('room-1-2')).not.toBeNull();

      masterDataService.invalidateRoom('room-1-2');
      expect(masterDataService.getCachedStudentsSync('room-1-2')).toBeNull();
    });

    it('records watermark metadata for delta queries', async () => {
      await masterDataService.getStudentsByRoom('room-1-2', true);
      const meta = await localCacheDb.getSyncMeta('students_room-1-2');

      expect(meta).not.toBeNull();
      expect(meta?.scopeKey).toBe('students_room-1-2');
      expect(meta?.lastSyncedIso).toBeDefined();
      expect(new Date(meta!.lastSyncedIso).getTime()).toBeGreaterThan(0);
    });
  });
});
