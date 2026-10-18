// src/services/attendanceService.ts
// Production-Ready Attendance Architecture:
// Local-First + Dirty-Row Debounce (1.2s) + Persistent Offline Sync Queue (attendance_outbox)
// Features:
// 1. Dirty-Row Tracking: Only modified rows are sent (typically <300 Bytes per check-in)
// 2. Debounce 1.2s: Batches fast clicks into a single HTTP request
// 3. Persistent Outbox Queue (IndexedDB): Preserves records during disconnects or tab close
// 4. Zero-Egress Upsert: Uses ON CONFLICT without .select() returning 0 bytes egress
// 5. In-Memory Fallback: Fully compatible with Node.js and Vitest test runners
// 6. Backward Compatible: Retains timetable & legacy roll-call API bridges

import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import type { TimetableSlot } from '../types/viewModels.ts';
import { RollCallBatchSchema, type RollCallBatchInput } from './types.ts';
import {
  attendanceCorrelationService,
  normalizeClassroomId,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
} from './attendanceCorrelationService.ts';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'ACTIVITY';

export interface AttendanceRecord {
  id: string; // รูปแบบบังคับ: `${studentId}_${date}_${period}`
  studentId: string;
  classroomId: string; // เช่น 'room-1-1'
  date: string; // 'YYYY-MM-DD' เช่น '2026-10-19'
  period: number; // 0 = โฮมรูมเช้า, 1..8 = คาบเรียน
  courseId?: string | null;
  status: AttendanceStatus;
  remark?: string | null;
  recordedBy: string; // ID ของครูผู้เช็คชื่อ
  updatedAt: string; // ISO Timestamp
}

export interface AttendanceSyncMeta {
  scopeKey: string; // `${classroomId}_${date}_${period}`
  lastSyncedIso: string; // เวลา updatedAt ล่าสุดที่ดึงมาจาก Supabase/Neon
  lastCheckedMs: number; // เวลาเครื่องครูที่เช็คล่าสุด
}

// ============================================================================
// ส่วนที่ 1: จัดการฐานข้อมูล IndexedDB ในเครื่องครู (Cache + Offline Outbox Queue)
// ============================================================================
const DB_NAME = 'kp_classroom_attendance_v1';
const DB_VERSION = 1;

const STORE_RECORDS = 'attendance_records'; // เก็บข้อมูลเช็คชื่อสำหรับแสดงผลหน้าเว็บทันที
const STORE_OUTBOX = 'attendance_outbox'; // เก็บเฉพาะแถวที่รอส่งขึ้น Supabase (Dirty Rows)
const STORE_META = 'attendance_sync_meta'; // เก็บเวลาซิงค์ล่าสุด (Watermark)

// In-Memory Fallback Stores for non-browser environments (e.g. Node.js unit tests)
const memoryAttendanceFallback = {
  records: new Map<string, AttendanceRecord>(),
  outbox: new Map<string, AttendanceRecord>(),
  meta: new Map<string, AttendanceSyncMeta>(),
};

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openAttendanceDb(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. ตารางเก็บข้อมูลเช็คชื่อในเครื่อง พร้อม Index ค้นหาตาม [ห้อง + วันที่ + คาบ]
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const store = db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
          store.createIndex('by_room_date_period', ['classroomId', 'date', 'period'], {
            unique: false,
          });
        }

        // 2. ตารางคิวรอส่งข้อมูล (Outbox Queue) ใช้ id เดียวกัน ถ้าครูติ๊กซ้ำคนเดิมจะทับคิวเดิมทันที
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
        }

        // 3. ตารางเก็บเวลาซิงค์ล่าสุด
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'scopeKey' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

export const localAttendanceDb = {
  async getRecordsBySlot(
    classroomId: string,
    date: string,
    period: number
  ): Promise<AttendanceRecord[]> {
    if (!isIndexedDBAvailable()) {
      return Array.from(memoryAttendanceFallback.records.values()).filter(
        (r) => r.classroomId === classroomId && r.date === date && r.period === period
      );
    }

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, 'readonly');
        const index = tx.objectStore(STORE_RECORDS).index('by_room_date_period');
        const req = index.getAll(IDBKeyRange.only([classroomId, date, period]));
        req.onsuccess = () => resolve((req.result as AttendanceRecord[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(memoryAttendanceFallback.records.values()).filter(
        (r) => r.classroomId === classroomId && r.date === date && r.period === period
      );
    }
  },

  async putRecords(records: AttendanceRecord[]): Promise<void> {
    if (records.length === 0) return;

    for (const rec of records) {
      memoryAttendanceFallback.records.set(rec.id, rec);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, 'readwrite');
        const store = tx.objectStore(STORE_RECORDS);
        for (const rec of records) {
          store.put(rec);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  // บันทึกลงทั้งตารางแสดงผล และตารางคิวรอส่ง (Atomic Transaction ในเครื่องครู)
  async stageDirtyRecords(records: AttendanceRecord[]): Promise<void> {
    if (records.length === 0) return;

    for (const rec of records) {
      memoryAttendanceFallback.records.set(rec.id, rec);
      memoryAttendanceFallback.outbox.set(rec.id, rec);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_RECORDS, STORE_OUTBOX], 'readwrite');
        const recordStore = tx.objectStore(STORE_RECORDS);
        const outboxStore = tx.objectStore(STORE_OUTBOX);

        for (const rec of records) {
          recordStore.put(rec);
          outboxStore.put(rec);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async getAllOutboxRecords(): Promise<AttendanceRecord[]> {
    if (!isIndexedDBAvailable()) {
      return Array.from(memoryAttendanceFallback.outbox.values());
    }

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const req = tx.objectStore(STORE_OUTBOX).getAll();
        req.onsuccess = () => resolve((req.result as AttendanceRecord[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(memoryAttendanceFallback.outbox.values());
    }
  },

  async removeOutboxRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    for (const id of ids) {
      memoryAttendanceFallback.outbox.delete(id);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        for (const id of ids) {
          store.delete(id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async getSyncMeta(scopeKey: string): Promise<AttendanceSyncMeta | null> {
    if (!isIndexedDBAvailable()) {
      return memoryAttendanceFallback.meta.get(scopeKey) || null;
    }

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readonly');
        const req = tx.objectStore(STORE_META).get(scopeKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryAttendanceFallback.meta.get(scopeKey) || null;
    }
  },

  async setSyncMeta(meta: AttendanceSyncMeta): Promise<void> {
    memoryAttendanceFallback.meta.set(meta.scopeKey, meta);

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readwrite');
        tx.objectStore(STORE_META).put(meta);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async clearAll(): Promise<void> {
    memoryAttendanceFallback.records.clear();
    memoryAttendanceFallback.outbox.clear();
    memoryAttendanceFallback.meta.clear();

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openAttendanceDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(
          [STORE_RECORDS, STORE_OUTBOX, STORE_META],
          'readwrite'
        );
        tx.objectStore(STORE_RECORDS).clear();
        tx.objectStore(STORE_OUTBOX).clear();
        tx.objectStore(STORE_META).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
  },
};

// ============================================================================
// ส่วนที่ 2: กลไก Debounce 1.2 วินาที + ระบบดึงข้อมูลประหยัด Egress
// ============================================================================
const DEBOUNCE_DELAY_MS = 1200; // รอรวมคำสั่ง 1.2 วินาที
const SLOT_CACHE_TTL_MS = 5 * 60 * 1000; // ถ้าเปิดหน้าเดิมซ้ำภายใน 5 นาที ไม่ต้องถาม Server ซ้ำ

// Whitelisted Columns
const ATTENDANCE_COLUMNS =
  'id, studentId, classroomId, date, period, courseId, status, remark, recordedBy, updatedAt';

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

// แจ้งเตือนสถานะซิงค์
export type SyncStatusListener = (status: {
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastError?: string | null;
}) => void;

const statusListeners = new Set<SyncStatusListener>();

async function notifyStatusListeners(lastError: string | null = null) {
  try {
    const outbox = await localAttendanceDb.getAllOutboxRecords();
    const isOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;
    const payload = {
      pendingCount: outbox.length,
      isSyncing: isFlushing,
      isOnline,
      lastError,
    };
    statusListeners.forEach((listener) => listener(payload));
  } catch {
    // ignore
  }
}

// Legacy Local Storage Keys (For backward compatibility)
const STORAGE_KEY_TIMETABLE = 'cls_timetable_data';

export interface AttendanceRecordItem {
  id: string;
  scheduleId: string;
  classroomId: string;
  enrollmentId: string;
  schoolDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  updatedAt: string;
}

const memoryTimetableStore = new Map<string, string>();
const getLegacyStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryTimetableStore.get(key) ?? null,
    setItem: (key: string, val: string) => memoryTimetableStore.set(key, val),
    removeItem: (key: string) => memoryTimetableStore.delete(key),
  };
};

export const attendanceService = {
  /**
   * สร้าง ID มาตรฐานสำหรับแถวการเช็คชื่อ
   */
  buildRecordId(studentId: string, date: string, period: number): string {
    return `${studentId}_${date}_${period}`;
  },

  /**
   * 1. ดึงข้อมูลการเช็คชื่อของห้อง วันที่ และคาบเรียนที่เลือก
   * - อ่านจาก IndexedDB ก่อนเสมอ
   * - ยิง Delta Query (gt('updatedAt', ...)) เฉพาะแถวที่เปลี่ยน
   */
  async getAttendanceBySlot(
    classroomId: string,
    date: string,
    period: number = 0,
    forceRefresh: boolean = false
  ): Promise<Map<string, AttendanceRecord>> {
    const scopeKey = `${classroomId}_${date}_${period}`;
    const [cachedRecords, syncMeta] = await Promise.all([
      localAttendanceDb.getRecordsBySlot(classroomId, date, period),
      localAttendanceDb.getSyncMeta(scopeKey),
    ]);

    const now = Date.now();
    const isOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

    // ถ้าออฟไลน์ หรือแคชเพิ่งเช็คไปไม่เกิน 5 นาที ให้คืนค่าจากเครื่องทันที (Egress = 0 Byte!)
    if (
      !isOnline ||
      (!forceRefresh &&
        cachedRecords.length > 0 &&
        syncMeta &&
        now - syncMeta.lastCheckedMs < SLOT_CACHE_TTL_MS)
    ) {
      return new Map(cachedRecords.map((r) => [r.studentId, r]));
    }

    if (!isSupabaseConfigured) {
      return new Map(cachedRecords.map((r) => [r.studentId, r]));
    }

    try {
      let query = supabase
        .from('Attendance')
        .select(ATTENDANCE_COLUMNS)
        .eq('classroomId', classroomId)
        .eq('date', date)
        .eq('period', period);

      // Delta Sync: ถ้าในเครื่องมีข้อมูลอยู่แล้ว ให้ดึงเฉพาะแถวที่เปลี่ยนหลังเวลาซิงค์ล่าสุด
      if (cachedRecords.length > 0 && syncMeta?.lastSyncedIso) {
        query = query.gt('updatedAt', syncMeta.lastSyncedIso);
      }

      const { data: deltaRows, error } = await query;
      if (error) throw error;

      let latestIso = syncMeta?.lastSyncedIso || new Date(0).toISOString();

      if (deltaRows && Array.isArray(deltaRows) && deltaRows.length > 0) {
        // ตรวจสอบว่ามีแถวไหนที่กำลังแก้ค้างอยู่ใน Outbox หรือไม่
        const pendingOutbox = await localAttendanceDb.getAllOutboxRecords();
        const pendingIds = new Set(pendingOutbox.map((item) => item.id));

        const safeRowsToMerge = (deltaRows as AttendanceRecord[]).filter(
          (row) => !pendingIds.has(row.id)
        );

        await localAttendanceDb.putRecords(safeRowsToMerge);

        for (const row of deltaRows) {
          if (row.updatedAt && row.updatedAt > latestIso) {
            latestIso = row.updatedAt;
          }
        }
      }

      await localAttendanceDb.setSyncMeta({
        scopeKey,
        lastSyncedIso:
          latestIso === new Date(0).toISOString() ? new Date().toISOString() : latestIso,
        lastCheckedMs: now,
      });

      const finalList =
        deltaRows && deltaRows.length > 0
          ? await localAttendanceDb.getRecordsBySlot(classroomId, date, period)
          : cachedRecords;

      return new Map(finalList.map((r) => [r.studentId, r]));
    } catch (err) {
      console.warn('⚠️ [attendanceService] ดึงข้อมูลเช็คชื่อออนไลน์ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน:', err);
      return new Map(cachedRecords.map((r) => [r.studentId, r]));
    }
  },

  /**
   * 2. เมื่อครูกดติ๊กสถานะนักเรียน 1 คน
   * - เซฟลง IndexedDB ทันที (หน้าเว็บเปลี่ยนสถานะใน 1 ms)
   * - หน่วงเวลา 1.2 วินาที เพื่อรวบส่งเป็น Batch เดียว
   */
  async markStudentAttendance(params: {
    studentId: string;
    classroomId: string;
    date: string;
    period?: number;
    courseId?: string | null;
    status: AttendanceStatus;
    remark?: string | null;
    recordedBy: string;
  }): Promise<AttendanceRecord> {
    const period = params.period ?? 0;
    const record: AttendanceRecord = {
      id: this.buildRecordId(params.studentId, params.date, period),
      studentId: params.studentId,
      classroomId: params.classroomId,
      date: params.date,
      period,
      courseId: params.courseId ?? null,
      status: params.status,
      remark: params.remark ?? null,
      recordedBy: params.recordedBy,
      updatedAt: new Date().toISOString(),
    };

    // 1. บันทึกลง IndexedDB และคิว Outbox ทันที
    await localAttendanceDb.stageDirtyRecords([record]);
    await notifyStatusListeners();

    // 2. หน่วงเวลา 1.2 วินาที เผื่อครูติ๊กคนถัดไปต่อเนื่อง
    this.scheduleDebouncedFlush();

    return record;
  },

  /**
   * 3. กรณีครูกดปุ่ม "มาเรียนทั้งหมด (Check All Present)" ทั้งห้อง
   * - คัดกรองเฉพาะคนที่สถานะเปลี่ยนจริง (Dirty Check)
   */
  async markWholeClassroom(params: {
    studentIds: string[];
    classroomId: string;
    date: string;
    period?: number;
    courseId?: string | null;
    status: AttendanceStatus;
    recordedBy: string;
  }): Promise<void> {
    const period = params.period ?? 0;
    const existingList = await localAttendanceDb.getRecordsBySlot(
      params.classroomId,
      params.date,
      period
    );
    const existingMap = new Map(existingList.map((r) => [r.studentId, r]));

    const nowIso = new Date().toISOString();
    const dirtyRecords: AttendanceRecord[] = [];

    for (const studentId of params.studentIds) {
      const current = existingMap.get(studentId);
      if (current && current.status === params.status) continue;

      dirtyRecords.push({
        id: this.buildRecordId(studentId, params.date, period),
        studentId,
        classroomId: params.classroomId,
        date: params.date,
        period,
        courseId: params.courseId ?? null,
        status: params.status,
        remark: current?.remark ?? null,
        recordedBy: params.recordedBy,
        updatedAt: nowIso,
      });
    }

    if (dirtyRecords.length === 0) return;

    await localAttendanceDb.stageDirtyRecords(dirtyRecords);
    await notifyStatusListeners();
    this.scheduleDebouncedFlush();
  },

  /**
   * ตั้งเวลาหน่วง 1.2 วินาทีก่อนส่งขึ้น Server
   */
  scheduleDebouncedFlush(): void {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void this.flushOutboxQueue();
    }, DEBOUNCE_DELAY_MS);
  },

  /**
   * 4. ส่งข้อมูลที่ค้างใน Outbox ขึ้น Supabase/Neon แบบ Batch Upsert (Minimal Return = 0 Egress)
   */
  async flushOutboxQueue(): Promise<void> {
    if (isFlushing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await notifyStatusListeners('ออฟไลน์: บันทึกไว้ในเครื่องแล้ว รอเชื่อมต่ออินเทอร์เน็ต');
      return;
    }

    const pendingRecords = await localAttendanceDb.getAllOutboxRecords();
    if (pendingRecords.length === 0) return;

    isFlushing = true;
    await notifyStatusListeners();

    try {
      const BATCH_SIZE = 100;
      for (let i = 0; i < pendingRecords.length; i += BATCH_SIZE) {
        const batch = pendingRecords.slice(i, i + BATCH_SIZE);

        if (isSupabaseConfigured) {
          const { error } = await supabase.from('Attendance').upsert(batch, {
            onConflict: 'studentId,date,period',
            ignoreDuplicates: false,
          });

          if (error) throw error;
        }

        const syncedIds = batch.map((r) => r.id);
        await localAttendanceDb.removeOutboxRecords(syncedIds);
      }

      isFlushing = false;
      await notifyStatusListeners(null);
    } catch (err: any) {
      isFlushing = false;
      console.warn('⚠️ [attendanceService] ยังส่งข้อมูลเช็คชื่อขึ้น Server ไม่สำเร็จ เก็บไว้ใน Outbox:', err);
      await notifyStatusListeners(err?.message || 'การเชื่อมต่อขัดข้อง ระบบจะส่งให้อัตโนมัติเมื่อออนไลน์');
    }
  },

  /**
   * 5. ดักจับเมื่ออินเทอร์เน็ตกลับมาออนไลน์ หรือพับหน้าจอ
   */
  initAutoSyncListeners(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      console.log('🌐 อินเทอร์เน็ตกลับมาออนไลน์ กำลังซิงค์ข้อมูลเช็คชื่อที่ค้างไว้...');
      void this.flushOutboxQueue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        void this.flushOutboxQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    void this.flushOutboxQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  },

  /**
   * สำหรับให้ UI นำไปแสดงสถานะการซิงค์
   */
  subscribeSyncStatus(listener: SyncStatusListener): () => void {
    statusListeners.add(listener);
    void notifyStatusListeners();
    return () => {
      statusListeners.delete(listener);
    };
  },

  /**
   * ล้างแคชทั้งหมด (สำหรับ Test Suite หรือ Logout)
   */
  async clearAll(): Promise<void> {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    isFlushing = false;
    await localAttendanceDb.clearAll();
    statusListeners.clear();
  },

  // ============================================================================
  // ส่วนที่ 3: Legacy API Bridges (เพื่อความเข้ากันได้แบบ Backward-Compatible)
  // ============================================================================
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
    const raw = getLegacyStorage().getItem(STORAGE_KEY_TIMETABLE);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  },

  async updateSlot(day: string, period: number, updates: Partial<TimetableSlot>): Promise<void> {
    const list = await this.getTimetable();
    const idx = list.findIndex((t) => t.day === day && t.period === period);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      getLegacyStorage().setItem(STORAGE_KEY_TIMETABLE, JSON.stringify(list));
    }
    if (isSupabaseConfigured) {
      await supabase.from('TimetableSlot').update(updates).match({ day, period });
    }
  },

  async getByDate(classroomId: string, date: string): Promise<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>> {
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

    const slotMap = await this.getAttendanceBySlot(classroomId, date, 0);
    if (slotMap.size > 0) {
      const result: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
      slotMap.forEach((rec, stdId) => {
        const mapped = rec.status === 'ACTIVITY' ? 'PRESENT' : rec.status;
        result[stdId] = mapped as any;
      });
      return result;
    }

    return {};
  },

  async saveRollCall(input: RollCallBatchInput): Promise<number> {
    const validated = RollCallBatchSchema.parse(input);
    const now = new Date().toISOString();
    const normRoom = normalizeClassroomId(validated.classroomId);

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

    // Stage into persistent outbox queue
    const modernRecords: AttendanceRecord[] = validated.records.map((rec) => ({
      id: this.buildRecordId(rec.enrollmentId, validated.schoolDate, 1),
      studentId: rec.enrollmentId,
      classroomId: normRoom,
      date: validated.schoolDate,
      period: 1,
      status: (rec.status as AttendanceStatus) || 'PRESENT',
      recordedBy: 'teacher',
      updatedAt: now,
    }));

    await localAttendanceDb.stageDirtyRecords(modernRecords);
    this.scheduleDebouncedFlush();

    return modernRecords.length;
  },

  async markAllPresent(scheduleId: string, classroomId: string, schoolDate: string, studentIds: string[]): Promise<number> {
    return this.saveRollCall({
      scheduleId,
      classroomId,
      schoolDate,
      records: studentIds.map((id) => ({ enrollmentId: id, status: 'PRESENT' })),
    });
  },

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
    return { total: 0, presentRate: 100, absentRate: 0 };
  },
};
