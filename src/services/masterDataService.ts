// src/services/masterDataService.ts
// Production-Ready Master Data Service: 3-Tier Cache + Watermark Delta Sync
// Features:
// 1. L1 RAM Cache (0 ms / 0 Egress)
// 2. L2 IndexedDB Cache (0 Egress across browser restarts)
// 3. L3 Watermark Delta Sync (gt('updated_at', watermark) - only fetches changed rows)
// 4. Singleflight Deduplication (merges concurrent queries)
// 5. Strict Column Projections (Zero Egress waste, never SELECT *)
// 6. Minimal Mutation Returns (No redundant .select() on mutations)
// 7. Strict Zero Mock Policy (Returns authentic DB data or empty arrays)

import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import {
  localCacheDb,
  type CachedClassroom,
  type CachedStudent,
} from './localCacheDb.ts';

// Cooldown TTL: ตรวจสอบการอัปเดตข้อมูลนักเรียนและห้องเรียนจาก Server ทุก 12 ชั่วโมง
const MASTER_DATA_TTL_MS = 12 * 60 * 60 * 1000;

// L1 Memory Cache (RAM)
const memoryClassrooms: { data: CachedClassroom[] | null } = { data: null };
const memoryStudentsByRoom = new Map<string, CachedStudent[]>();

// Singleflight Request Map ป้องกันหลาย Component ยิงซ้ำพร้อมกัน
const inFlightRequests = new Map<string, Promise<any>>();

// Whitelisted Column Projections
const CLASSROOM_COLUMNS = 'id, name, gradeLevel, roomNumber, adviser, status, updatedAt';
const STUDENT_VIEW_COLUMNS =
  'id, studentCode, code, name, title, first_name, last_name, gender, status, classroom_id, seat_no, parent_phone, parent_name, updated_at';

export function resolveRoomCandidates(classroomId: string): string[] {
  const set = new Set<string>();
  const trimmed = (classroomId || '').trim();
  if (!trimmed) return [];
  set.add(trimmed);

  const mThai = trimmed.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
  const normalizedThai = mThai ? `ม.${mThai[1]}/${mThai[2]}` : null;
  if (mThai) {
    set.add(`room-${mThai[1]}-${mThai[2]}`);
    set.add(`ม.${mThai[1]}/${mThai[2]}`);
  }
  const mRoom = trimmed.match(/^room-(\d+)-(\d+)$/);
  if (mRoom) {
    set.add(`ม.${mRoom[1]}/${mRoom[2]}`);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('cls_classrooms_data');
      if (raw) {
        const rooms = JSON.parse(raw);
        if (Array.isArray(rooms)) {
          for (const r of rooms) {
            const rName = (r.name || '').trim();
            const rId = (r.id || '').trim();
            const rNum = (r.roomNumber ? String(r.roomNumber) : '').trim();
            const rThai = rName.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
            const rNorm = rThai ? `ม.${rThai[1]}/${rThai[2]}` : rName;

            const isMatch =
              rId === trimmed ||
              rName === trimmed ||
              rNum === trimmed ||
              (normalizedThai && (rName === normalizedThai || rNorm === normalizedThai)) ||
              (rName && rName.replace(/\s+/g, '') === trimmed.replace(/\s+/g, ''));

            if (isMatch) {
              if (rId) set.add(rId);
              if (rName) set.add(rName);
              if (rNum) set.add(rNum);
              if (rNorm) set.add(rNorm);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return Array.from(set);
}

function mapStudentViewToCached(s: any, fallbackRoomId: string): CachedStudent {
  const gender: 'MALE' | 'FEMALE' = s.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
  const seatNo = Number(s.seat_no || 0);
  const studentCode = String(s.studentCode || s.code || s.id || '').replace(/^stu-/, '');
  const prefix = s.title || (gender === 'FEMALE' ? 'ด.ญ.' : 'ด.ช.');

  return {
    id: s.id || `stu-${studentCode}`,
    studentCode,
    code: studentCode,
    number: seatNo,
    no: seatNo,
    prefix,
    title: prefix,
    firstName: s.first_name || '',
    lastName: s.last_name || '',
    name: s.name || `${prefix} ${s.first_name || ''} ${s.last_name || ''}`.trim(),
    classroomId: s.classroom_id || fallbackRoomId,
    status: s.status || 'ACTIVE',
    gender,
    avatarUrl: gender === 'FEMALE' ? '/images/banners/student-avatar-girl.png' : '/images/banners/student-avatar.png',
    parentPhone: s.parent_phone || s.parentPhone || null,
    parentName: s.parent_name || s.parentName || null,
    attendance: '0/0',
    score: 0,
    updatedAt: s.updated_at ? new Date(s.updated_at).toISOString() : new Date().toISOString(),
  };
}

export const masterDataService = {
  /**
   * 1. ดึงรายชื่อห้องเรียนทั้งหมด (Classroom)
   * - L1 RAM Cache: 0 ms / 0 Byte
   * - L2 IndexedDB: 0 Byte
   * - L3 Delta Sync: ดึงเฉพาะห้องที่ updatedAt > lastSyncedIso
   */
  async getClassrooms(forceRefresh = false): Promise<CachedClassroom[]> {
    if (!forceRefresh && memoryClassrooms.data && memoryClassrooms.data.length > 0) {
      return memoryClassrooms.data;
    }

    const scopeKey = 'classrooms_all';
    const existingFlight = inFlightRequests.get(scopeKey);
    if (existingFlight) return existingFlight;

    const task = (async (): Promise<CachedClassroom[]> => {
      try {
        const [cachedList, syncMeta] = await Promise.all([
          localCacheDb.getAllClassrooms(),
          localCacheDb.getSyncMeta(scopeKey),
        ]);

        const now = Date.now();
        const isCacheFresh =
          !forceRefresh &&
          cachedList.length > 0 &&
          syncMeta &&
          now - syncMeta.lastCheckedMs < MASTER_DATA_TTL_MS;

        if (isCacheFresh) {
          memoryClassrooms.data = cachedList;
          return cachedList;
        }

        if (!isSupabaseConfigured) {
          memoryClassrooms.data = cachedList;
          return cachedList;
        }

        let query = supabase
          .from('ClassRoom')
          .select(CLASSROOM_COLUMNS)
          .order('id', { ascending: true });

        if (cachedList.length > 0 && syncMeta?.lastSyncedIso) {
          query = query.gt('updatedAt', syncMeta.lastSyncedIso);
        }

        const { data: deltaRows, error } = await query;
        if (error) throw error;

        let latestIso = syncMeta?.lastSyncedIso || new Date(0).toISOString();
        if (deltaRows && Array.isArray(deltaRows) && deltaRows.length > 0) {
          const mappedRooms: CachedClassroom[] = deltaRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            gradeLevel: r.gradeLevel,
            roomNumber: r.roomNumber,
            adviser: r.adviser,
            status: r.status,
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          }));

          await localCacheDb.putClassrooms(mappedRooms);

          for (const room of mappedRooms) {
            if (room.updatedAt && room.updatedAt > latestIso) {
              latestIso = room.updatedAt;
            }
          }
        }

        await localCacheDb.setSyncMeta({
          scopeKey,
          lastSyncedIso: latestIso === new Date(0).toISOString() ? new Date().toISOString() : latestIso,
          lastCheckedMs: now,
        });

        const finalClassrooms =
          deltaRows && deltaRows.length > 0
            ? await localCacheDb.getAllClassrooms()
            : cachedList;

        memoryClassrooms.data = finalClassrooms;
        return finalClassrooms;
      } catch (err) {
        console.warn('[masterDataService] ดึงข้อมูล Classroom จากเซิร์ฟเวอร์ไม่สำเร็จ ใช้ข้อมูลออฟไลน์:', err);
        const fallback = await localCacheDb.getAllClassrooms();
        memoryClassrooms.data = fallback;
        return fallback;
      } finally {
        inFlightRequests.delete(scopeKey);
      }
    })();

    inFlightRequests.set(scopeKey, task);
    return task;
  },

  /**
   * 2. ดึงรายชื่อนักเรียนตามห้องเรียน (Scoped Sync)
   * - ดึงเฉพาะห้องที่เปิดดูจริง
   * - L1 RAM Cache: 0 ms / 0 Byte
   * - L2 IndexedDB: 0 Byte
   * - L3 Delta Sync: ดึงเฉพาะนักเรียนที่ updated_at > lastSyncedIso
   */
  async getStudentsByRoom(
    classroomId: string,
    forceRefresh = false
  ): Promise<CachedStudent[]> {
    if (!classroomId) return [];

    const candidates = resolveRoomCandidates(classroomId);

    if (!forceRefresh) {
      for (const c of candidates) {
        if (memoryStudentsByRoom.has(c)) {
          const found = memoryStudentsByRoom.get(c)!;
          if (found && found.length > 0) return found;
        }
      }
    }

    const scopeKey = `students_${classroomId}`;
    const existingFlight = inFlightRequests.get(scopeKey);
    if (existingFlight) return existingFlight;

    const task = (async (): Promise<CachedStudent[]> => {
      try {
        let cachedStudents: CachedStudent[] = [];
        for (const c of candidates) {
          const list = await localCacheDb.getStudentsByClassroom(c);
          if (list && list.length > 0) {
            cachedStudents = list;
            break;
          }
        }
        const syncMeta = await localCacheDb.getSyncMeta(scopeKey);

        const now = Date.now();
        const isCacheFresh =
          !forceRefresh &&
          cachedStudents.length > 0 &&
          syncMeta &&
          now - syncMeta.lastCheckedMs < MASTER_DATA_TTL_MS;

        if (isCacheFresh) {
          cachedStudents.sort((a, b) => Number(a.no ?? a.number ?? 999) - Number(b.no ?? b.number ?? 999));
          for (const c of candidates) {
            memoryStudentsByRoom.set(c, cachedStudents);
          }
          return cachedStudents;
        }

        if (!isSupabaseConfigured) {
          cachedStudents.sort((a, b) => Number(a.no ?? a.number ?? 999) - Number(b.no ?? b.number ?? 999));
          for (const c of candidates) {
            memoryStudentsByRoom.set(c, cachedStudents);
          }
          return cachedStudents;
        }

        // L3 Delta Sync จาก Supabase/Neon View 'students' โดยค้นหาครอบคลุมทุกรหัสแทนกัน (UUID, room-X-Y, ชื่อภาษาไทย)
        let query = supabase
          .from('students')
          .select(STUDENT_VIEW_COLUMNS)
          .in('classroom_id', candidates);

        if (cachedStudents.length > 0 && syncMeta?.lastSyncedIso) {
          query = query.gt('updated_at', syncMeta.lastSyncedIso);
        }

        const { data: deltaStudents, error } = await query;
        if (error) throw error;

        let latestIso = syncMeta?.lastSyncedIso || new Date(0).toISOString();
        if (deltaStudents && Array.isArray(deltaStudents) && deltaStudents.length > 0) {
          const sanitized: CachedStudent[] = deltaStudents.map((s: any) =>
            mapStudentViewToCached(s, classroomId)
          );

          await localCacheDb.putStudents(sanitized);

          for (const std of sanitized) {
            if (std.updatedAt && std.updatedAt > latestIso) {
              latestIso = std.updatedAt;
            }
          }
        }

        await localCacheDb.setSyncMeta({
          scopeKey,
          lastSyncedIso: latestIso === new Date(0).toISOString() ? new Date().toISOString() : latestIso,
          lastCheckedMs: now,
        });

        let finalStudents: CachedStudent[] = [];
        if (deltaStudents && deltaStudents.length > 0) {
          for (const c of candidates) {
            const list = await localCacheDb.getStudentsByClassroom(c);
            if (list && list.length > 0) {
              finalStudents = list;
              break;
            }
          }
          if (finalStudents.length === 0) {
            finalStudents = deltaStudents.map((s: any) => mapStudentViewToCached(s, classroomId));
          }
        } else {
          finalStudents = cachedStudents;
        }

        finalStudents.sort((a, b) => Number(a.no ?? a.number ?? 999) - Number(b.no ?? b.number ?? 999));
        for (const c of candidates) {
          memoryStudentsByRoom.set(c, finalStudents);
        }
        return finalStudents;
      } catch (err) {
        console.warn(`[masterDataService] โหลดนักเรียนห้อง ${classroomId} จากเซิร์ฟเวอร์ไม่สำเร็จ ใช้ข้อมูลออฟไลน์:`, err);
        let fallback: CachedStudent[] = [];
        for (const c of candidates) {
          const list = await localCacheDb.getStudentsByClassroom(c);
          if (list && list.length > 0) {
            fallback = list;
            break;
          }
        }
        fallback.sort((a, b) => Number(a.no ?? a.number ?? 999) - Number(b.no ?? b.number ?? 999));
        for (const c of candidates) {
          memoryStudentsByRoom.set(c, fallback);
        }
        return fallback;
      } finally {
        inFlightRequests.delete(scopeKey);
      }
    })();

    inFlightRequests.set(scopeKey, task);
    return task;
  },

  /**
   * 3. บันทึกหรือแก้ไขข้อมูลนักเรียน (Optimistic UI + Minimal Return)
   * - ไม่ต่อท้าย .select() เพื่อลด Egress
   */
  async upsertStudent(student: CachedStudent): Promise<void> {
    const nowIso = new Date().toISOString();
    const recordToSave: CachedStudent = {
      ...student,
      avatarUrl: student.avatarUrl?.startsWith('data:image') ? null : student.avatarUrl,
      updatedAt: nowIso,
    };

    // 1. บันทึกลง IndexedDB และ L1 Memory ทันที
    await localCacheDb.putStudents([recordToSave]);
    const updatedRoomList = await localCacheDb.getStudentsByClassroom(student.classroomId);
    memoryStudentsByRoom.set(student.classroomId, updatedRoomList);

    // 2. บันทึกขึ้น Supabase / Neon
    if (isSupabaseConfigured) {
      // 2.1 ตาราง Student
      await supabase.from('Student').upsert(
        {
          id: recordToSave.id,
          studentCode: recordToSave.studentCode,
          title: recordToSave.prefix || recordToSave.title,
          firstName: recordToSave.firstName,
          lastName: recordToSave.lastName,
          gender: recordToSave.gender,
          status: recordToSave.status || 'ACTIVE',
          updatedAt: nowIso,
        },
        { onConflict: 'id' }
      );

      // 2.2 ตาราง StudentEnrollment
      const enrollmentId = `enr-2569-1-${recordToSave.studentCode}`;
      await supabase.from('StudentEnrollment').upsert(
        {
          id: enrollmentId,
          studentId: recordToSave.id,
          academicYear: 2569,
          term: 1,
          classRoomId: recordToSave.classroomId,
          rollNumber: recordToSave.number || recordToSave.no,
          status: 'ENROLLED',
          updatedAt: nowIso,
        },
        { onConflict: 'id' }
      );
    }
  },

  /**
   * 4. ดึงข้อมูลล่วงหน้าเฉพาะห้องที่ครูท่านนั้นสอน (Batch Preload ตอนล็อกอิน)
   */
  async preloadAssignedRooms(assignedRoomIds: string[]): Promise<void> {
    if (!assignedRoomIds || assignedRoomIds.length === 0 || !isSupabaseConfigured) return;

    const roomsToFetch: string[] = [];
    for (const roomId of assignedRoomIds) {
      const meta = await localCacheDb.getSyncMeta(`students_${roomId}`);
      if (!meta) roomsToFetch.push(roomId);
    }

    if (roomsToFetch.length === 0) return;

    const { data, error } = await supabase
      .from('students')
      .select(STUDENT_VIEW_COLUMNS)
      .in('classroom_id', roomsToFetch);

    if (error || !data || !Array.isArray(data)) return;

    const sanitized: CachedStudent[] = data.map((s: any) =>
      mapStudentViewToCached(s, s.classroom_id)
    );

    await localCacheDb.putStudents(sanitized);
    const now = Date.now();
    const nowIso = new Date().toISOString();

    for (const roomId of roomsToFetch) {
      await localCacheDb.setSyncMeta({
        scopeKey: `students_${roomId}`,
        lastSyncedIso: nowIso,
        lastCheckedMs: now,
      });
      const roomList = await localCacheDb.getStudentsByClassroom(roomId);
      memoryStudentsByRoom.set(roomId, roomList);
    }
  },

  /**
   * 5. ดึงข้อมูลนักเรียนจาก L1 Memory Cache แบบ Synchronous (ถ้ามี)
   */
  getCachedStudentsSync(classroomId: string): CachedStudent[] | null {
    return memoryStudentsByRoom.get(classroomId) || null;
  },

  /**
   * 6. ล้างแคชเฉพาะห้อง (เมื่อมีการเพิ่ม/ลบ/แก้ไขนักเรียน)
   */
  invalidateRoom(classroomId: string): void {
    memoryStudentsByRoom.delete(classroomId);
  },

  /**
   * 7. ล้างแคชทั้งหมด
   */
  async clearAll(): Promise<void> {
    memoryClassrooms.data = null;
    memoryStudentsByRoom.clear();
    await localCacheDb.clearAll();
  },
};
