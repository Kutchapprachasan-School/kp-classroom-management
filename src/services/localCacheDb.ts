// src/services/localCacheDb.ts
// Zero-dependency IndexedDB wrapper for KP Classroom Management
// Features:
// 1. Browser-native IndexedDB for persistent L2 offline storage
// 2. Optimized index 'by_classroom' for sub-millisecond student roster lookups
// 3. Graceful in-memory fallback when executed in Node.js / SSR / Unit Test environments
// 4. Dedicated Sync Metadata store to preserve Watermark timestamps

export interface CachedClassroom {
  id: string; // เช่น 'room-1-1'
  name: string; // เช่น 'ม.1/1'
  gradeLevel: number | string;
  roomNumber: number;
  adviser?: string;
  studentCount?: number;
  academicYearId?: string;
  updatedAt?: string;
}

export interface CachedStudent {
  id: string; // เช่น 'stu-16001'
  studentCode: string;
  code: string; // alias for studentCode
  number: number; // เลขที่ (seat_no / rollNumber)
  no: number; // alias for number
  prefix: string; // คำนำหน้า เช่น 'ด.ช.', 'ด.ญ.', 'นาย', 'น.ส.'
  title: string; // alias for prefix
  firstName: string;
  lastName: string;
  name: string; // ชื่อเต็ม
  classroomId: string; // เช่น 'room-1-1'
  status: string; // 'ACTIVE' | 'NORMAL' | 'AT_RISK'
  gender: 'MALE' | 'FEMALE';
  avatarUrl: string | null;
  parentPhone?: string | null;
  parentName?: string | null;
  attendance?: string;
  score?: number;
  updatedAt?: string;
}

export interface SyncMeta {
  scopeKey: string; // เช่น 'classrooms_all' หรือ 'students_room-1-1'
  lastSyncedIso: string; // เวลาล่าสุดของแถวข้อมูลใน Supabase/Neon (ใช้ทำ Delta Query)
  lastCheckedMs: number; // เวลาเครื่องที่เช็คล่าสุด (ใช้ทำ TTL Cooldown)
}

const DB_NAME = 'kp_classroom_master_cache_v1';
const DB_VERSION = 1;

const STORE_CLASSROOMS = 'classrooms';
const STORE_STUDENTS = 'students';
const STORE_SYNC_META = 'sync_meta';

// In-Memory Fallback Stores for non-browser environments (e.g. Node.js unit tests)
const memoryFallback = {
  classrooms: new Map<string, CachedClassroom>(),
  students: new Map<string, CachedStudent>(),
  syncMeta: new Map<string, SyncMeta>(),
};

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openCacheDb(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Store เก็บห้องเรียน
        if (!db.objectStoreNames.contains(STORE_CLASSROOMS)) {
          db.createObjectStore(STORE_CLASSROOMS, { keyPath: 'id' });
        }

        // 2. Store เก็บนักเรียน พร้อม Index ค้นหาตามห้องเรียน (classroomId)
        if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
          const studentStore = db.createObjectStore(STORE_STUDENTS, { keyPath: 'id' });
          studentStore.createIndex('by_classroom', 'classroomId', { unique: false });
        }

        // 3. Store เก็บเวลาซิงค์ล่าสุด (Watermark)
        if (!db.objectStoreNames.contains(STORE_SYNC_META)) {
          db.createObjectStore(STORE_SYNC_META, { keyPath: 'scopeKey' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

export const localCacheDb = {
  // --- จัดการ Sync Metadata ---
  async getSyncMeta(scopeKey: string): Promise<SyncMeta | null> {
    if (!isIndexedDBAvailable()) {
      return memoryFallback.syncMeta.get(scopeKey) || null;
    }

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_META, 'readonly');
        const req = tx.objectStore(STORE_SYNC_META).get(scopeKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryFallback.syncMeta.get(scopeKey) || null;
    }
  },

  async setSyncMeta(meta: SyncMeta): Promise<void> {
    memoryFallback.syncMeta.set(meta.scopeKey, meta);

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_META, 'readwrite');
        tx.objectStore(STORE_SYNC_META).put(meta);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory fallback updated
    }
  },

  // --- จัดการข้อมูลห้องเรียน (Classroom) ---
  async getAllClassrooms(): Promise<CachedClassroom[]> {
    if (!isIndexedDBAvailable()) {
      const list = Array.from(memoryFallback.classrooms.values());
      list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return list;
    }

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CLASSROOMS, 'readonly');
        const req = tx.objectStore(STORE_CLASSROOMS).getAll();
        req.onsuccess = () => {
          const list = (req.result as CachedClassroom[]) || [];
          list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = Array.from(memoryFallback.classrooms.values());
      list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return list;
    }
  },

  async putClassrooms(classrooms: CachedClassroom[]): Promise<void> {
    if (!classrooms || classrooms.length === 0) return;

    for (const room of classrooms) {
      memoryFallback.classrooms.set(room.id, room);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CLASSROOMS, 'readwrite');
        const store = tx.objectStore(STORE_CLASSROOMS);
        for (const room of classrooms) {
          store.put(room);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory fallback updated
    }
  },

  // --- จัดการข้อมูลนักเรียนรายห้อง (Student) ---
  async getStudentsByClassroom(classroomId: string): Promise<CachedStudent[]> {
    if (!classroomId) return [];

    if (!isIndexedDBAvailable()) {
      const list = Array.from(memoryFallback.students.values()).filter(
        (s) => s.classroomId === classroomId && s.status !== 'INACTIVE' && s.status !== 'DELETED'
      );
      list.sort((a, b) => (a.number || a.no) - (b.number || b.no));
      return list;
    }

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_STUDENTS, 'readonly');
        const index = tx.objectStore(STORE_STUDENTS).index('by_classroom');
        const req = index.getAll(IDBKeyRange.only(classroomId));

        req.onsuccess = () => {
          const students = ((req.result as CachedStudent[]) || []).filter(
            (s) => s.status !== 'INACTIVE' && s.status !== 'DELETED'
          );
          // เรียงตามเลขที่ในห้องเสมอ
          students.sort((a, b) => (a.number || a.no) - (b.number || b.no));
          resolve(students);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = Array.from(memoryFallback.students.values()).filter(
        (s) => s.classroomId === classroomId && s.status !== 'INACTIVE' && s.status !== 'DELETED'
      );
      list.sort((a, b) => (a.number || a.no) - (b.number || b.no));
      return list;
    }
  },

  async putStudents(students: CachedStudent[]): Promise<void> {
    if (!students || students.length === 0) return;

    for (const std of students) {
      memoryFallback.students.set(std.id, std);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_STUDENTS, 'readwrite');
        const store = tx.objectStore(STORE_STUDENTS);
        for (const std of students) {
          store.put(std);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory fallback updated
    }
  },

  async pruneStudentsByClassroom(classroomId: string, validIds: Set<string>): Promise<void> {
    if (!classroomId) return;

    for (const [id, s] of memoryFallback.students.entries()) {
      if (s.classroomId === classroomId && !validIds.has(id)) {
        memoryFallback.students.delete(id);
      }
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_STUDENTS, 'readwrite');
        const store = tx.objectStore(STORE_STUDENTS);
        const index = store.index('by_classroom');
        const req = index.getAll(IDBKeyRange.only(classroomId));
        req.onsuccess = () => {
          const list = (req.result as CachedStudent[]) || [];
          for (const item of list) {
            if (!validIds.has(item.id)) {
              store.delete(item.id);
            }
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory fallback updated
    }
  },

  // ล้างแคชทั้งหมด
  async clearAll(): Promise<void> {
    memoryFallback.classrooms.clear();
    memoryFallback.students.clear();
    memoryFallback.syncMeta.clear();

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openCacheDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(
          [STORE_CLASSROOMS, STORE_STUDENTS, STORE_SYNC_META],
          'readwrite'
        );
        tx.objectStore(STORE_CLASSROOMS).clear();
        tx.objectStore(STORE_STUDENTS).clear();
        tx.objectStore(STORE_SYNC_META).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
  },
};
