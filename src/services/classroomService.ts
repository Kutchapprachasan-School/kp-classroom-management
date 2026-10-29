import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import type { ClassroomRosterItem } from '../types/viewModels';
import { ClassroomCreateSchema, type ClassroomCreateInput } from './types.ts';
import { studentService, getAlternateRoomKey, registerClassroomNames, formatClassroomLabel } from './studentService.ts';
import { activityAuditLogService } from './activityAuditLogService.ts';

const STORAGE_KEY = 'cls_classrooms_data';
const DELETED_ROOMS_KEY = 'cls_deleted_classrooms_set';

export const getDeletedRoomsSet = (): Set<string> => {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(DELETED_ROOMS_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {
      // ignore
    }
  }
  return new Set();
};

export const saveDeletedRoomsSet = (set: Set<string>) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
};

// Helper to get local persisted classrooms
export const getLocalClassrooms = (): ClassroomRosterItem[] => {
  const deletedSet = getDeletedRoomsSet();
  const isGhostRoom = (c: { id?: string; name?: string }) =>
    c.name === 'ม.1/8' || c.name === 'ม.6/6' || c.id === 'room-1-8' || c.id === 'room-6-6';

  let result: ClassroomRosterItem[] = INITIAL_SEED_CLASSROOMS;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_SEED_CLASSROOMS.length) {
          result = parsed.filter((c: any) => !isGhostRoom(c));
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored cache is incomplete (e.g. legacy 12 rooms), merge in missing classrooms from authoritative list
          const cleanParsed = parsed.filter((c: any) => !isGhostRoom(c));
          const existingIds = new Set(cleanParsed.map((p: any) => p.id || p.name));
          const existingNames = new Set(cleanParsed.map((p: any) => p.name));
          const merged = [...cleanParsed];
          INITIAL_SEED_CLASSROOMS.forEach((seed) => {
            if (!existingIds.has(seed.id) && !existingNames.has(seed.name)) {
              merged.push(seed);
            }
          });
          result = merged;
          saveLocalClassrooms(merged);
        } else {
          saveLocalClassrooms(INITIAL_SEED_CLASSROOMS);
        }
      } catch {
        // fallback
      }
    } else {
      saveLocalClassrooms(INITIAL_SEED_CLASSROOMS);
    }
  }
  const mappedResult = result
    .filter((c) => !deletedSet.has(c.id) && !deletedSet.has(c.name) && !isGhostRoom(c))
    .map((c) => {
      const advisers = c.advisers || [c.adviser, c.coAdviser, c.thirdAdviser].filter(Boolean) as string[];
      let studentCount = c.studentCount || 0;
      try {
        const byId = studentService.getStudents(c.id).length;
        const byName = studentService.getStudents(c.name).length;
        // หากมีจำนวนนักเรียนจากฐานข้อมูลหลัก (> 0) ห้ามใช้ตัวเลขจาก local cache ที่อาจบวมทับโดยเด็ดขาด
        if (studentCount === 0) {
          studentCount = byId > 0 && byName > 0 ? Math.min(byId, byName) : Math.max(byId, byName);
        }
      } catch {
        // ignore
      }
      return {
        ...c,
        advisers,
        studentCount,
      };
    });
  registerClassroomNames(mappedResult);
  return mappedResult;
};

const saveLocalClassrooms = (items: ClassroomRosterItem[]) => {
  const cleaned = items.filter(
    (c) => c.name !== 'ม.1/8' && c.name !== 'ม.6/6' && c.id !== 'room-1-8' && c.id !== 'room-6-6'
  );
  cachedClassrooms = cleaned;
  cachedClassroomsTimestamp = Date.now();
  registerClassroomNames(cleaned);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }
};

export interface TeacherAccountItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  position?: string;
  subjectGroup?: string;
}

export const DEFAULT_TEACHER_ACCOUNTS: TeacherAccountItem[] = [];

export const INITIAL_SEED_CLASSROOMS: ClassroomRosterItem[] = [
  // มัธยมศึกษาปีที่ 1 (6 ห้อง: ม.1/1 - ม.1/6)
  { id: 'room-1-1', name: 'ม.1/1', level: 'ม.1', roomNumber: 'ม.1/1', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-1-2', name: 'ม.1/2', level: 'ม.1', roomNumber: 'ม.1/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-1-3', name: 'ม.1/3', level: 'ม.1', roomNumber: 'ม.1/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 30 },
  { id: 'room-1-4', name: 'ม.1/4', level: 'ม.1', roomNumber: 'ม.1/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-1-5', name: 'ม.1/5', level: 'ม.1', roomNumber: 'ม.1/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-1-6', name: 'ม.1/6', level: 'ม.1', roomNumber: 'ม.1/6', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 34 },

  // มัธยมศึกษาปีที่ 2 (6 ห้อง)
  { id: 'room-2-1', name: 'ม.2/1', level: 'ม.2', roomNumber: 'ม.2/1', adviser: 'นายปัญจพล เกษรัตน์', studentCount: 32 },
  { id: 'room-2-2', name: 'ม.2/2', level: 'ม.2', roomNumber: 'ม.2/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 38 },
  { id: 'room-2-3', name: 'ม.2/3', level: 'ม.2', roomNumber: 'ม.2/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 37 },
  { id: 'room-2-4', name: 'ม.2/4', level: 'ม.2', roomNumber: 'ม.2/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 40 },
  { id: 'room-2-5', name: 'ม.2/5', level: 'ม.2', roomNumber: 'ม.2/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 40 },
  { id: 'room-2-6', name: 'ม.2/6', level: 'ม.2', roomNumber: 'ม.2/6', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 38 },

  // มัธยมศึกษาปีที่ 3 (6 ห้อง)
  { id: 'room-3-1', name: 'ม.3/1', level: 'ม.3', roomNumber: 'ม.3/1', adviser: 'นายปัญจพล เกษรัตน์', studentCount: 35 },
  { id: 'room-3-2', name: 'ม.3/2', level: 'ม.3', roomNumber: 'ม.3/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-3-3', name: 'ม.3/3', level: 'ม.3', roomNumber: 'ม.3/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 35 },
  { id: 'room-3-4', name: 'ม.3/4', level: 'ม.3', roomNumber: 'ม.3/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 39 },
  { id: 'room-3-5', name: 'ม.3/5', level: 'ม.3', roomNumber: 'ม.3/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 36 },
  { id: 'room-3-6', name: 'ม.3/6', level: 'ม.3', roomNumber: 'ม.3/6', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 32 },

  // มัธยมศึกษาปีที่ 4 (5 ห้อง)
  { id: 'room-4-1', name: 'ม.4/1', level: 'ม.4', roomNumber: 'ม.4/1', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 30 },
  { id: 'room-4-2', name: 'ม.4/2', level: 'ม.4', roomNumber: 'ม.4/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 26 },
  { id: 'room-4-3', name: 'ม.4/3', level: 'ม.4', roomNumber: 'ม.4/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 22 },
  { id: 'room-4-4', name: 'ม.4/4', level: 'ม.4', roomNumber: 'ม.4/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 42 },
  { id: 'room-4-5', name: 'ม.4/5', level: 'ม.4', roomNumber: 'ม.4/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 31 },

  // มัธยมศึกษาปีที่ 5 (6 ห้อง)
  { id: 'room-5-1', name: 'ม.5/1', level: 'ม.5', roomNumber: 'ม.5/1', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 30 },
  { id: 'room-5-2', name: 'ม.5/2', level: 'ม.5', roomNumber: 'ม.5/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 32 },
  { id: 'room-5-3', name: 'ม.5/3', level: 'ม.5', roomNumber: 'ม.5/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 33 },
  { id: 'room-5-4', name: 'ม.5/4', level: 'ม.5', roomNumber: 'ม.5/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 29 },
  { id: 'room-5-5', name: 'ม.5/5', level: 'ม.5', roomNumber: 'ม.5/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 22 },
  { id: 'room-5-6', name: 'ม.5/6', level: 'ม.5', roomNumber: 'ม.5/6', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 29 },

  // มัธยมศึกษาปีที่ 6 (5 ห้อง: ม.6/1 - ม.6/5)
  { id: 'room-6-1', name: 'ม.6/1', level: 'ม.6', roomNumber: 'ม.6/1', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 30 },
  { id: 'room-6-2', name: 'ม.6/2', level: 'ม.6', roomNumber: 'ม.6/2', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 33 },
  { id: 'room-6-3', name: 'ม.6/3', level: 'ม.6', roomNumber: 'ม.6/3', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 19 },
  { id: 'room-6-4', name: 'ม.6/4', level: 'ม.6', roomNumber: 'ม.6/4', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 21 },
  { id: 'room-6-5', name: 'ม.6/5', level: 'ม.6', roomNumber: 'ม.6/5', adviser: 'ยังไม่ระบุครูที่ปรึกษา', studentCount: 23 },
];

const TEACHERS_CACHE_KEY = 'kp_teacher_accounts_cache';

let cachedClassrooms: ClassroomRosterItem[] | null = null;
let cachedClassroomsTimestamp = 0;
let cachedTeachers: TeacherAccountItem[] | null = null;
let cachedTeachersTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60s in-memory TTL to eliminate repetitive network roundtrips across views

export function invalidateClassroomCache() {
  cachedClassrooms = null;
  cachedClassroomsTimestamp = 0;
  cachedTeachers = null;
  cachedTeachersTimestamp = 0;
}

export const classroomService = {
  // READ: List all real teacher accounts directly from Supabase User table
  async getTeacherAccounts(forceRefresh?: boolean): Promise<TeacherAccountItem[]> {
    if (!forceRefresh && cachedTeachers && Date.now() - cachedTeachersTimestamp < CACHE_TTL_MS) {
      return cachedTeachers;
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, name, username, email, role, position, subjectGroup')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const teachers: TeacherAccountItem[] = data.filter((u: any) =>
            u.role === 'TEACHER' ||
            u.role === 'ADMIN' ||
            u.position?.includes('ครู') ||
            u.position?.includes('ผู้อำนวยการ') ||
            u.position?.includes('รองผู้') ||
            u.subjectGroup
          );
          if (teachers.length > 0) {
            cachedTeachers = teachers;
            cachedTeachersTimestamp = Date.now();
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify(teachers));
            }
            return teachers;
          }
        }
      } catch (err) {
        console.warn('Error fetching teacher accounts from Supabase:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(TEACHERS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedTeachers = parsed;
            cachedTeachersTimestamp = Date.now();
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }

    return [];
  },
  // READ: List all classrooms directly from Supabase (Zero Mock Data)
  async getAll(forceRefresh?: boolean): Promise<ClassroomRosterItem[]> {
    if (!forceRefresh && cachedClassrooms && Date.now() - cachedClassroomsTimestamp < CACHE_TTL_MS) {
      return cachedClassrooms;
    }
    const deletedSet = getDeletedRoomsSet();
    const storedFpKey = 'cls_classrooms_fp';
    const localItems = getLocalClassrooms();

    if (isSupabaseConfigured) {
      logDbOperation('SELECT selective FROM classrooms WHERE status = ACTIVE');
      try {
        // Lightweight fingerprint check: only fetch count and max(updated_at)
        const storedFp = typeof localStorage !== 'undefined' ? localStorage.getItem(storedFpKey) : null;
        if (!forceRefresh && localItems.length >= 34 && storedFp) {
          const { data: fpData, error: fpErr } = await supabase
            .from('classrooms')
            .select('count(*) as count, max(updated_at) as max_updated_at')
            .eq('status', 'ACTIVE')
            .single();

          if (!fpErr && fpData) {
            const currentFp = `${fpData.count}::${fpData.max_updated_at}`;
            if (storedFp === currentFp && localItems.length >= Number(fpData.count)) {
              cachedClassrooms = localItems;
              cachedClassroomsTimestamp = Date.now();
              return localItems;
            }
          }
        }

        const { data, error } = await supabase
          .from('classrooms')
          .select('id, name, level, grade_level, room_number, adviser, status, student_count, updated_at')
          .eq('status', 'ACTIVE')
          .order('grade_level', { ascending: true })
          .order('room_number', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ClassroomRosterItem[] = data
            .filter(
              (item) =>
                !deletedSet.has(item.id) &&
                !deletedSet.has(item.name) &&
                item.name !== 'ม.1/8' &&
                item.name !== 'ม.6/6' &&
                item.id !== 'room-1-8' &&
                item.id !== 'room-6-6'
            )
            .map((item) => {
              const adviser = item.adviser || 'ยังไม่ได้กำหนด';
              const coAdviser = item.co_adviser || item.coAdviser || undefined;
              const thirdAdviser = item.third_adviser || item.thirdAdviser || undefined;
              const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];
              let studentCount = Number(item.student_count || 0);
              if (studentCount === 0) {
                try {
                  const byId = studentService.getStudents(item.id).length;
                  const byName = studentService.getStudents(item.name).length;
                  const realCount = byId > 0 && byName > 0 ? Math.min(byId, byName) : Math.max(byId, byName);
                  if (realCount > 0) {
                    studentCount = realCount;
                  }
                } catch {
                  // ignore
                }
              }
              return {
                id: item.id,
                name: item.name,
                level: item.level || `ม.${item.grade_level || 1}`,
                roomNumber: item.name,
                adviser,
                coAdviser,
                thirdAdviser,
                advisers,
                studentCount,
              };
            });
          cachedClassrooms = mapped;
          cachedClassroomsTimestamp = Date.now();
          saveLocalClassrooms(mapped);

          // Update fingerprint
          if (typeof localStorage !== 'undefined') {
            const maxUpdated = data.reduce((max: string, item: any) => (item.updated_at > max ? item.updated_at : max), '');
            localStorage.setItem(storedFpKey, `${data.length}::${maxUpdated}`);
          }

          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching classrooms view from Supabase:', err);
      }

      // Fallback directly to ClassRoom table if view is unavailable
      try {
        const { data: tData, error: tErr } = await supabase
          .from('ClassRoom')
          .select('id, name, gradeLevel, roomNumber, adviser, status')
          .eq('status', 'ACTIVE')
          .order('gradeLevel', { ascending: true })
          .order('roomNumber', { ascending: true });

        if (!tErr && tData && tData.length > 0) {
          const mapped: ClassroomRosterItem[] = tData
            .filter(
              (item) =>
                !deletedSet.has(item.id) &&
                !deletedSet.has(item.name) &&
                item.name !== 'ม.1/8' &&
                item.name !== 'ม.6/6' &&
                item.id !== 'room-1-8' &&
                item.id !== 'room-6-6'
            )
            .map((item) => {
              const adviser = item.adviser || 'ยังไม่ได้กำหนด';
              const coAdviser = item.coAdviser || undefined;
              const thirdAdviser = item.thirdAdviser || undefined;
              const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];
              let studentCount = 0;
              try {
                const byId = studentService.getStudents(item.id).length;
                const byName = studentService.getStudents(item.name).length;
                studentCount = Math.max(byId, byName);
              } catch {
                // ignore
              }
              return {
                id: item.id,
                name: item.name,
                level: `ม.${item.gradeLevel || 1}`,
                roomNumber: item.name,
                adviser,
                coAdviser,
                thirdAdviser,
                advisers,
                studentCount,
              };
            });
          cachedClassrooms = mapped;
          cachedClassroomsTimestamp = Date.now();
          saveLocalClassrooms(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching ClassRoom table from Supabase:', err);
      }
    }

    return getLocalClassrooms();
  },

  // READ: List all classrooms (alias for getClassrooms)
  async getClassrooms(): Promise<ClassroomRosterItem[]> {
    return this.getAll();
  },

  // READ: List all classrooms synchronously from local storage / cache
  getClassroomsSync(): ClassroomRosterItem[] {
    return getLocalClassrooms();
  },

  // RESOLVER: แปลง Classroom ID หรือ Key (เช่น room-1791986991422 หรือ room-3-1) เป็นชื่อห้องภาษาไทย (เช่น ม.3/1)
  resolveClassroomName(idOrName?: string): string {
    if (!idOrName) return 'ม.1/1';
    const clean = idOrName.trim();
    const rooms = this.getClassroomsSync();
    const found = rooms.find((r) => r.id === clean || r.name === clean || r.roomNumber === clean);
    if (found?.name) return formatClassroomLabel(found.name);
    return formatClassroomLabel(clean);
  },

  // READ: Get single classroom
  async getById(id: string): Promise<ClassroomRosterItem | undefined> {
    const list = await this.getAll();
    return list.find((c) => c.id === id || c.name === id);
  },

  // Find advisory classroom for teacher (checks adviser, coAdviser, thirdAdviser)
  async getTeacherAdvisoryClassroom(teacherNameOrId?: string | null): Promise<ClassroomRosterItem | null> {
    if (!teacherNameOrId || !teacherNameOrId.trim()) return null;
    const cleanQuery = teacherNameOrId.trim();
    const all = await this.getAll();
    for (const room of all) {
      const list = [room.adviser, room.coAdviser, room.thirdAdviser, ...(room.advisers || [])].filter(Boolean) as string[];
      for (const adv of list) {
        if (!adv || adv === 'ยังไม่ได้กำหนด') continue;
        if (adv === cleanQuery || adv.includes(cleanQuery) || cleanQuery.includes(adv)) {
          return room;
        }
      }
    }
    return null;
  },

  // CREATE: Add new classroom in Supabase
  // Check if a classroom is in the deleted/trash state
  isClassroomDeleted(nameOrId: string): boolean {
    if (!nameOrId || !nameOrId.trim()) return false;
    const clean = nameOrId.trim();
    const deletedSet = getDeletedRoomsSet();
    if (deletedSet.has(clean)) return true;
    const seedMatch = INITIAL_SEED_CLASSROOMS.find((s) => s.name === clean || s.id === clean);
    if (seedMatch && (deletedSet.has(seedMatch.id) || deletedSet.has(seedMatch.name))) return true;
    const altRoomId = `room-${clean.replace('ม.', '').replace('/', '-')}`;
    if (deletedSet.has(altRoomId)) return true;
    if (typeof localStorage !== 'undefined') {
      try {
        const trashKey = 'cls_trash_data';
        const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
        if (Array.isArray(trash) && trash.some((t: any) => (t.name === clean || t.id === clean) && t.entityType === 'ชั้นเรียน')) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  },

  // RESTORE: Restore classroom from trash / deleted state
  async restore(nameOrId: string): Promise<ClassroomRosterItem | null> {
    const deletedSet = getDeletedRoomsSet();
    let targetName = nameOrId.trim();
    deletedSet.delete(nameOrId);
    deletedSet.delete(targetName);

    const seedMatch = INITIAL_SEED_CLASSROOMS.find((s) => s.id === nameOrId || s.name === targetName);
    if (seedMatch) {
      targetName = seedMatch.name;
      deletedSet.delete(seedMatch.id);
      deletedSet.delete(seedMatch.name);
    }
    const altRoomId = `room-${targetName.replace('ม.', '').replace('/', '-')}`;
    deletedSet.delete(altRoomId);
    saveDeletedRoomsSet(deletedSet);

    // Remove from cls_trash_data
    let originalData: ClassroomRosterItem | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const trashKey = 'cls_trash_data';
        const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
        if (Array.isArray(trash)) {
          const found = trash.find((t: any) => (t.name === targetName || t.id === nameOrId) && t.entityType === 'ชั้นเรียน');
          if (found && found.originalData) {
            originalData = found.originalData;
          }
          const filtered = trash.filter((t: any) => t.name !== targetName && t.id !== nameOrId);
          localStorage.setItem(trashKey, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    }

    let restoredRoom: ClassroomRosterItem;
    if (originalData) {
      restoredRoom = originalData;
    } else if (seedMatch) {
      restoredRoom = { ...seedMatch };
    } else {
      const levelMatch = targetName.match(/ม\.?\s*(\d+)/);
      const level = levelMatch ? `ม.${levelMatch[1]}` : 'ม.1';
      restoredRoom = {
        id: altRoomId,
        name: targetName,
        level,
        roomNumber: targetName,
        adviser: 'ยังไม่ได้กำหนด',
        studentCount: 0,
      };
    }

    const current = getLocalClassrooms();
    const existingIndex = current.findIndex((c) => c.id === restoredRoom.id || c.name === restoredRoom.name);
    if (existingIndex !== -1) {
      current[existingIndex] = restoredRoom;
      saveLocalClassrooms(current);
    } else {
      saveLocalClassrooms([...current, restoredRoom]);
    }

    // Invalidate cache and fingerprint
    invalidateClassroomCache();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cls_classrooms_fp');
    }

    // Restore archived students if present
    if (originalData && (originalData as any).archivedStudents) {
      const archived = (originalData as any).archivedStudents;
      if (Array.isArray(archived) && archived.length > 0) {
        studentService.saveLocalStudents(restoredRoom.id, archived);
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('ClassRoom')
          .update({ status: 'ACTIVE', updatedAt: new Date().toISOString() })
          .eq('name', restoredRoom.name);
      } catch (err) {
        console.warn('Failed to reactivate ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_RESTORED', classroom: restoredRoom }
      }));
      window.dispatchEvent(new CustomEvent('kps-students-updated', { detail: { classroomId: restoredRoom.id } }));
    } catch {
      // safe SSR
    }

    activityAuditLogService.recordLog({
      actionType: 'RESTORE',
      entityType: 'ชั้นเรียน',
      title: `กู้คืนห้องเรียน "${restoredRoom.name}"`,
      summary: `กู้คืนห้องเรียน "${restoredRoom.name}" สำเร็จ พร้อมคืนสภาพนักเรียนเดิมเรียบร้อย`,
      itemCount: 1,
      targetId: restoredRoom.id,
      targetScope: restoredRoom.name,
      actor: 'ผู้ดูแลระบบวิชาการ',
    }).catch(() => {});

    return restoredRoom;
  },

  // CREATE: Add new classroom (or reactivate if previously deleted)
  async create(input: ClassroomCreateInput): Promise<ClassroomRosterItem> {
    const validated = ClassroomCreateSchema.parse(input);
    const newId = `room-${Date.now()}`;

    // Comprehensively remove from deleted blacklist (name, altId, and seedId)
    const deletedSet = getDeletedRoomsSet();
    let modified = false;
    if (deletedSet.has(validated.name)) {
      deletedSet.delete(validated.name);
      modified = true;
    }
    const seedMatch = INITIAL_SEED_CLASSROOMS.find((s) => s.name === validated.name);
    if (seedMatch && deletedSet.has(seedMatch.id)) {
      deletedSet.delete(seedMatch.id);
      modified = true;
    }
    const altRoomId = `room-${validated.name.replace('ม.', '').replace('/', '-')}`;
    if (deletedSet.has(altRoomId)) {
      deletedSet.delete(altRoomId);
      modified = true;
    }
    if (modified) {
      saveDeletedRoomsSet(deletedSet);
    }

    // Clean up trash data
    if (typeof localStorage !== 'undefined') {
      try {
        const trashKey = 'cls_trash_data';
        const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
        if (Array.isArray(trash)) {
          const filtered = trash.filter((t: any) => t.name !== validated.name || t.entityType !== 'ชั้นเรียน');
          localStorage.setItem(trashKey, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    }

    // Extract grade level and room number from name (e.g. "ม.1/3" -> grade 1, room 3)
    let gradeLevel = 1;
    let roomNumber = 1;
    const match = validated.name.match(/ม\.?\s*(\d+)\s*\/\s*(\d+)/);
    if (match) {
      gradeLevel = parseInt(match[1], 10);
      roomNumber = parseInt(match[2], 10);
    } else {
      const levelMatch = validated.level.match(/\d+/);
      if (levelMatch) gradeLevel = parseInt(levelMatch[0], 10);
    }

    const adviser = validated.adviser || 'ยังไม่ได้กำหนด';
    const coAdviser = validated.coAdviser;
    const thirdAdviser = validated.thirdAdviser;
    const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];

    const newClassroom: ClassroomRosterItem = {
      id: seedMatch ? seedMatch.id : newId,
      name: validated.name,
      level: validated.level,
      roomNumber: validated.name,
      adviser,
      coAdviser,
      thirdAdviser,
      advisers,
      studentCount: 0,
    };

    if (isSupabaseConfigured) {
      logDbOperation('UPSERT INTO ClassRoom', newClassroom);
      try {
        // Check if room with this name already exists in Supabase (even INACTIVE)
        const { data: existingRoom } = await supabase
          .from('ClassRoom')
          .select('id, name')
          .eq('name', newClassroom.name)
          .maybeSingle();

        if (existingRoom) {
          await supabase.from('ClassRoom').update({
            gradeLevel,
            roomNumber,
            adviser: newClassroom.adviser,
            status: 'ACTIVE',
            updatedAt: new Date().toISOString(),
          }).eq('id', existingRoom.id);
          newClassroom.id = existingRoom.id;
        } else {
          await supabase.from('ClassRoom').insert({
            id: newClassroom.id,
            name: newClassroom.name,
            gradeLevel,
            roomNumber,
            adviser: newClassroom.adviser,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to create/reactivate ClassRoom in Supabase:', err);
      }
    }

    const current = getLocalClassrooms();
    const existingIndex = current.findIndex((c) => c.id === newClassroom.id || c.name === newClassroom.name);
    let updated: ClassroomRosterItem[];
    if (existingIndex !== -1) {
      current[existingIndex] = newClassroom;
      updated = [...current];
    } else {
      updated = [...current, newClassroom];
    }
    saveLocalClassrooms(updated);

    // Invalidate cache and fingerprint
    invalidateClassroomCache();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cls_classrooms_fp');
    }

    // If room was previously deleted and had archived students in trash, restore them
    if (typeof localStorage !== 'undefined') {
      try {
        const trashKey = 'cls_trash_data';
        const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
        if (Array.isArray(trash)) {
          const found = trash.find((t: any) => (t.name === validated.name || t.id === newClassroom.id) && t.entityType === 'ชั้นเรียน');
          if (found && found.originalData?.archivedStudents) {
            const archived = found.originalData.archivedStudents;
            if (Array.isArray(archived) && archived.length > 0) {
              studentService.saveLocalStudents(newClassroom.id, archived);
            }
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_CREATED', classroom: newClassroom }
      }));
      window.dispatchEvent(new CustomEvent('kps-students-updated', { detail: { classroomId: newClassroom.id } }));
    } catch {
      // safe SSR
    }

    return newClassroom;
  },

  // UPDATE: Edit classroom details (Name, Advisers, etc.)
  async update(id: string, updates: Partial<ClassroomRosterItem>): Promise<ClassroomRosterItem> {
    const current = getLocalClassrooms();
    const index = current.findIndex((c) => c.id === id || c.name === id);
    const existing = index !== -1 ? current[index] : null;

    const adviser = updates.adviser !== undefined ? updates.adviser : (existing?.adviser || 'ยังไม่ได้กำหนด');
    const coAdviser = updates.coAdviser !== undefined ? updates.coAdviser : existing?.coAdviser;
    const thirdAdviser = updates.thirdAdviser !== undefined ? updates.thirdAdviser : existing?.thirdAdviser;
    const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];

    const updatedItem: ClassroomRosterItem = {
      id,
      name: updates.name || existing?.name || id,
      level: updates.level || existing?.level || 'ม.1',
      roomNumber: updates.name || existing?.roomNumber || id,
      adviser,
      coAdviser,
      thirdAdviser,
      advisers,
      studentCount: updates.studentCount !== undefined ? updates.studentCount : (existing?.studentCount || 0),
    };

    if (index !== -1) {
      current[index] = updatedItem;
      saveLocalClassrooms(current);
    }

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE ClassRoom WHERE id = ${id}`, updates);
      try {
        const payload: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
        if (updates.name) payload.name = updates.name;
        if (updates.adviser !== undefined) payload.adviser = updates.adviser;

        await supabase.from('ClassRoom').update(payload).or(`id.eq.${id},name.eq.${existing?.name || id}`);
      } catch (err) {
        console.error('Failed to update ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_UPDATED', classroomId: id, updates }
      }));
    } catch {
      // safe SSR
    }

    return updatedItem;
  },

  // UPDATE ADVISERS: Set up to 3 advisors
  async updateAdvisers(
    id: string,
    adviser: string,
    coAdviser?: string,
    thirdAdviser?: string
  ): Promise<ClassroomRosterItem> {
    return this.update(id, { adviser, coAdviser, thirdAdviser });
  },

  // UPSERT: If room already exists, update advisors. If not, create new classroom.
  async upsertClassrooms(
    items: Array<{
      name: string;
      level?: string;
      adviser?: string;
      coAdviser?: string;
      thirdAdviser?: string;
      studentCount?: number;
    }>
  ): Promise<{ updatedCount: number; createdCount: number }> {
    const current = await this.getAll();
    let updatedCount = 0;
    let createdCount = 0;

    for (const item of items) {
      const cleanName = item.name.trim();
      if (!cleanName) continue;
      const existing = current.find((c) => c.name === cleanName || c.roomNumber === cleanName);
      if (existing) {
        await this.update(existing.id, {
          adviser: item.adviser?.trim() || existing.adviser,
          coAdviser: item.coAdviser?.trim() !== undefined ? item.coAdviser.trim() : existing.coAdviser,
          thirdAdviser: item.thirdAdviser?.trim() !== undefined ? item.thirdAdviser.trim() : existing.thirdAdviser,
        });
        updatedCount++;
      } else {
        await this.create({
          name: cleanName,
          level: item.level || 'ม.1',
          adviser: item.adviser?.trim() || 'ยังไม่ได้กำหนด',
          coAdviser: item.coAdviser?.trim(),
          thirdAdviser: item.thirdAdviser?.trim(),
        });
        createdCount++;
      }
    }

    return { updatedCount, createdCount };
  },

  // DELETE: Soft delete classroom (mark status = INACTIVE / DELETED in Supabase & blacklist locally)
  async delete(id: string): Promise<boolean> {
    const current = getLocalClassrooms();
    const target = current.find((c) => c.id === id || c.name === id);
    const targetName = target?.name || id;

    // Record into deleted blacklist so it NEVER resurfaces unless explicitly recreated/restored
    const deletedSet = getDeletedRoomsSet();
    deletedSet.add(id);
    if (target?.name) deletedSet.add(target.name);
    saveDeletedRoomsSet(deletedSet);

    // Invalidate classroom cache and fingerprint so queries immediately reflect deletion
    invalidateClassroomCache();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cls_classrooms_fp');
    }

    // Filter out from local active
    const filtered = current.filter((c) => c.id !== id && c.name !== id && c.name !== targetName);
    saveLocalClassrooms(filtered);

    // Clean up active student records for this room and archive them into originalData
    const byId = studentService.getStudents(id);
    const byName = target?.name ? studentService.getStudents(target.name) : [];
    const altKey = getAlternateRoomKey(id) || (target?.name ? getAlternateRoomKey(target.name) : null);
    const byAlt = altKey ? studentService.getStudents(altKey) : [];
    const studentsToArchive = byId.length > 0 ? byId : byName.length > 0 ? byName : byAlt;

    // Record into trash
    if (typeof localStorage !== 'undefined') {
      const trashKey = 'cls_trash_data';
      const trashItems = JSON.parse(localStorage.getItem(trashKey) || '[]');
      trashItems.unshift({
        id: `del-${Date.now()}`,
        entityType: 'ชั้นเรียน',
        name: targetName,
        deletedAt: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
        deletedBy: 'ผู้ดูแลระบบวิชาการ',
        daysRemaining: 30,
        originalData: {
          ...(target || { id, name: targetName }),
          archivedStudents: studentsToArchive,
        },
      });
      localStorage.setItem(trashKey, JSON.stringify(trashItems));

      // Remove from active storage so student count and student roster do NOT show orphan students
      localStorage.removeItem(`cls_students_${id}`);
      if (target?.name) localStorage.removeItem(`cls_students_${target.name}`);
      if (altKey) localStorage.removeItem(`cls_students_${altKey}`);
    }

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE ClassRoom SET status = INACTIVE WHERE id = ${id}`);
      try {
        await supabase
          .from('ClassRoom')
          .update({ status: 'INACTIVE', updatedAt: new Date().toISOString() })
          .or(`id.eq.${id},name.eq.${targetName}`);
      } catch (err) {
        console.error('Failed to soft-delete ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_DELETED', classroomId: id, classroomName: targetName }
      }));
      window.dispatchEvent(new CustomEvent('kps-students-updated', { detail: { classroomId: id } }));
    } catch {
      // safe SSR
    }

    activityAuditLogService.logDelete(
      'ชั้นเรียน',
      `ลบห้องเรียน "${targetName}"`,
      `ลบห้องเรียน "${targetName}" และจัดเก็บนักเรียน ${studentsToArchive.length} คนเข้าถังขยะ`,
      studentsToArchive.length + 1,
      'ผู้ดูแลระบบวิชาการ',
      { classroomId: id, studentCount: studentsToArchive.length }
    ).catch(() => {});

    return true;
  },
};
