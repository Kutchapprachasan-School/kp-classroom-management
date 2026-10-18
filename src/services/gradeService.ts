// src/services/gradeService.ts
// Production-Ready Grade Architecture:
// Local-First (IndexedDB kp_classroom_grade_v2) + Dirty-Cell Outbox (score_outbox) + Zero-Egress Upsert
// Features:
// 1. Cell-Level Granularity: Individual student scores keyed by `${studentId}_${assignmentId}`
// 2. Debounce 1.2s: Automatically batches dirty cell edits into single upsert payload
// 3. Concurrency-Safe Flush: Optimistic concurrency check (updatedAt) prevents overwriting rapid edits
// 4. Batch IndexedDB I/O: Single transaction writes (putScoresBatch) prevent browser freezing
// 5. Boot & Lifecycle Recovery: Flushes orphaned outbox on load, online, and visibilitychange
// 6. Clock-Skew Guard: 2-minute safety window for delta queries prevents missed updates
// 7. OBEC/สพฐ. Compliant Grading: Accumulates raw weights and flags missing midterm/final exams as 'ร'
// 8. Zero-Egress Upsert: Upserts directly via ON CONFLICT without .select() returning 0 bytes egress

import { supabase } from '../lib/supabase.ts';

export interface AssessmentColumn {
  id: string;
  courseId: string;
  classroomId?: string | null;
  academicYear?: number;
  semester?: number;
  title: string;
  maxScore: number;
  weight: number;
  category: 'HW' | 'MIDTERM' | 'FINAL' | 'OTHER';
  updatedAt: string;
}


export interface StudentScore {
  id: string; // `${studentId}_${assignmentId}`
  studentId: string;
  assignmentId: string;
  score: number | null;
  updatedAt: string; // ISO Timestamp ของเซลล์นี้
}

export interface GradeSyncMeta {
  scopeKey: string;
  lastSyncedIso: string;
  lastCheckedMs: number;
}

// ============================================================================
// ส่วนที่ 1: จัดการ IndexedDB สำหรับคะแนน (Cache + Dirty Cell Outbox)
// ============================================================================
const DB_NAME = 'kp_classroom_grade_v2';
const DB_VERSION = 2;

const STORE_COLUMNS = 'assessment_columns';
const STORE_SCORES = 'student_scores';
const STORE_OUTBOX = 'score_outbox';
const STORE_META = 'grade_sync_meta';

// In-Memory Fallback Stores for non-browser environments (e.g. Node.js unit tests)
const memoryGradeFallback = {
  columns: new Map<string, AssessmentColumn>(),
  scores: new Map<string, StudentScore>(),
  outbox: new Map<string, StudentScore>(),
  meta: new Map<string, GradeSyncMeta>(),
};

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openGradeDb(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_COLUMNS)) {
          const store = db.createObjectStore(STORE_COLUMNS, { keyPath: 'id' });
          store.createIndex('by_course', 'courseId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SCORES)) {
          const store = db.createObjectStore(STORE_SCORES, { keyPath: 'id' });
          store.createIndex('by_student', 'studentId', { unique: false });
          store.createIndex('by_assignment', 'assignmentId', { unique: false });
        } else {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          const store = tx?.objectStore(STORE_SCORES);
          if (store && !store.indexNames.contains('by_assignment')) {
            store.createIndex('by_assignment', 'assignmentId', { unique: false });
          }
        }

        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
        }

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

export const localGradeDb = {
  async getColumns(courseId: string): Promise<AssessmentColumn[]> {
    if (!isIndexedDBAvailable()) {
      return Array.from(memoryGradeFallback.columns.values()).filter(
        (col) => col.courseId === courseId
      );
    }

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_COLUMNS, 'readonly');
        const index = tx.objectStore(STORE_COLUMNS).index('by_course');
        const req = index.getAll(IDBKeyRange.only(courseId));
        req.onsuccess = () => resolve((req.result as AssessmentColumn[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(memoryGradeFallback.columns.values()).filter(
        (col) => col.courseId === courseId
      );
    }
  },

  async putColumns(columns: AssessmentColumn[]): Promise<void> {
    if (columns.length === 0) return;

    for (const col of columns) {
      memoryGradeFallback.columns.set(col.id, col);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_COLUMNS, 'readwrite');
        const store = tx.objectStore(STORE_COLUMNS);
        for (const col of columns) store.put(col);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  // ✅ ใช้ Index 'by_assignment' ดึงเฉพาะคะแนนในรายวิชานี้ภายใน 1 Transaction (ไม่ดึงทั้ง DB)
  async getScoresByCourse(assignmentIds: string[]): Promise<StudentScore[]> {
    if (assignmentIds.length === 0) return [];

    if (!isIndexedDBAvailable()) {
      const idSet = new Set(assignmentIds);
      return Array.from(memoryGradeFallback.scores.values()).filter((s) =>
        idSet.has(s.assignmentId)
      );
    }

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCORES, 'readonly');
        const index = tx.objectStore(STORE_SCORES).index('by_assignment');
        const results: StudentScore[] = [];

        for (const assignmentId of assignmentIds) {
          const req = index.getAll(IDBKeyRange.only(assignmentId));
          req.onsuccess = () => {
            if (req.result) results.push(...(req.result as StudentScore[]));
          };
        }

        tx.oncomplete = () => resolve(results);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const idSet = new Set(assignmentIds);
      return Array.from(memoryGradeFallback.scores.values()).filter((s) =>
        idSet.has(s.assignmentId)
      );
    }
  },

  // ✅ บันทึกคะแนนจาก Server หลายร้อยช่องรวดเดียวใน 1 Transaction (ป้องกันเบราว์เซอร์ค้าง)
  async putScoresBatch(scores: StudentScore[]): Promise<void> {
    if (scores.length === 0) return;

    for (const s of scores) {
      memoryGradeFallback.scores.set(s.id, s);
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCORES, 'readwrite');
        const store = tx.objectStore(STORE_SCORES);
        for (const s of scores) {
          store.put(s);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async stageDirtyScore(scoreRecord: StudentScore): Promise<void> {
    memoryGradeFallback.scores.set(scoreRecord.id, scoreRecord);
    memoryGradeFallback.outbox.set(scoreRecord.id, scoreRecord);

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_SCORES, STORE_OUTBOX], 'readwrite');
        tx.objectStore(STORE_SCORES).put(scoreRecord);
        tx.objectStore(STORE_OUTBOX).put(scoreRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async getAllOutbox(): Promise<StudentScore[]> {
    if (!isIndexedDBAvailable()) {
      return Array.from(memoryGradeFallback.outbox.values());
    }

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const req = tx.objectStore(STORE_OUTBOX).getAll();
        req.onsuccess = () => resolve((req.result as StudentScore[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(memoryGradeFallback.outbox.values());
    }
  },

  // ✅ ป้องกัน Race Condition: ลบออกจาก Outbox เฉพาะเมื่อ updatedAt ตรงกับชุดที่เพิ่งซิงค์สำเร็จเท่านั้น!
  async removeSyncedOutbox(syncedBatch: StudentScore[]): Promise<void> {
    if (syncedBatch.length === 0) return;

    for (const syncedItem of syncedBatch) {
      const current = memoryGradeFallback.outbox.get(syncedItem.id);
      if (current && current.updatedAt === syncedItem.updatedAt) {
        memoryGradeFallback.outbox.delete(syncedItem.id);
      }
    }

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);

        for (const syncedItem of syncedBatch) {
          const getReq = store.get(syncedItem.id);
          getReq.onsuccess = () => {
            const currentInOutbox = getReq.result as StudentScore | undefined;
            // ลบเฉพาะกรณีที่ครูไม่ได้พิมพ์แก้ซ้ำระหว่างที่กำลังส่งข้อมูลขึ้น Server
            if (currentInOutbox && currentInOutbox.updatedAt === syncedItem.updatedAt) {
              store.delete(syncedItem.id);
            }
          };
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  },

  async getSyncMeta(scopeKey: string): Promise<GradeSyncMeta | null> {
    if (!isIndexedDBAvailable()) {
      return memoryGradeFallback.meta.get(scopeKey) || null;
    }

    try {
      const db = await openGradeDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readonly');
        const req = tx.objectStore(STORE_META).get(scopeKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryGradeFallback.meta.get(scopeKey) || null;
    }
  },

  async setSyncMeta(meta: GradeSyncMeta): Promise<void> {
    memoryGradeFallback.meta.set(meta.scopeKey, meta);

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openGradeDb();
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
};

// ============================================================================
// ส่วนที่ 2: เซอร์วิสจัดการคะแนนและ Debounce 1.2 วินาที (Concurrency-Safe)
// ============================================================================
const DEBOUNCE_DELAY_MS = 1200;
const CLOCK_SKEW_BUFFER_MS = 120_000; // เผื่อเวลาเครื่องครูคลาดเคลื่อน 2 นาที

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
let hasPendingReFlush = false; // ✅ Flag สำหรับสั่งซิงค์ซ้ำหากมีการพิมพ์ระหว่างกำลัง Flush

const COLUMN_COLUMNS =
  'id, courseId, classroomId, academicYear, semester, title, maxScore, weight, category, updatedAt';
const SCORE_COLUMNS = 'id, studentId, assignmentId, score, updatedAt';

export const gradeService = {
  /**
   * 1. ดึงโครงสร้างช่องเก็บคะแนนและคะแนนทั้งหมดของรายวิชา (พร้อม Delta Sync & Boot Flush)
   */
  async getCourseGradingData(courseId: string, forceRefresh = false) {
    // ✅ พยายามเคลียร์คิวที่อาจค้างจากการปิดแท็บครั้งก่อนทันที
    void this.flushOutbox();

    const scopeKey = `course_grades_${courseId}`;
    const [cachedColumns, syncMeta] = await Promise.all([
      localGradeDb.getColumns(courseId),
      localGradeDb.getSyncMeta(scopeKey),
    ]);

    const assignmentIds = cachedColumns.map((c) => c.id);
    const cachedScores = await localGradeDb.getScoresByCourse(assignmentIds);

    const now = Date.now();
    // Safety check for Node.js vs Browser navigator.onLine
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine !== undefined ? navigator.onLine : true;

    if (!isOnline || (!forceRefresh && cachedColumns.length > 0 && syncMeta && now - syncMeta.lastCheckedMs < 300_000)) {
      return { columns: cachedColumns, scores: new Map(cachedScores.map((s) => [s.id, s])) };
    }

    try {
      const { data: remoteColumns, error: colError } = await supabase
        .from('AssessmentColumn')
        .select(COLUMN_COLUMNS)
        .eq('courseId', courseId);

      if (colError) throw colError;
      if (remoteColumns) {
        await localGradeDb.putColumns(remoteColumns as AssessmentColumn[]);
      }

      const activeColumns = (remoteColumns && remoteColumns.length > 0) ? (remoteColumns as AssessmentColumn[]) : cachedColumns;
      const activeIds = activeColumns.map((c) => c.id);

      if (activeIds.length === 0) {
        return { columns: [], scores: new Map<string, StudentScore>() };
      }

      let scoreQuery = supabase.from('StudentScore').select(SCORE_COLUMNS).in('assignmentId', activeIds);
      if (cachedScores.length > 0 && syncMeta?.lastSyncedIso) {
        // ✅ ถอยเวลาเผื่อ Clock Skew 2 นาที ป้องกันการตกหล่นของข้อมูล
        const safeSinceIso = new Date(new Date(syncMeta.lastSyncedIso).getTime() - CLOCK_SKEW_BUFFER_MS).toISOString();
        scoreQuery = scoreQuery.gt('updatedAt', safeSinceIso);
      }

      const { data: deltaScores, error: scoreError } = await scoreQuery;
      if (scoreError) throw scoreError;

      if (deltaScores && deltaScores.length > 0) {
        const pendingOutbox = await localGradeDb.getAllOutbox();
        const pendingIds = new Set(pendingOutbox.map((p) => p.id));
        const safeScores = (deltaScores as StudentScore[]).filter((s) => !pendingIds.has(s.id));

        // ✅ บันทึกรวดเดียวใน 1 Transaction
        await localGradeDb.putScoresBatch(safeScores);
      }

      await localGradeDb.setSyncMeta({
        scopeKey,
        lastSyncedIso: new Date().toISOString(),
        lastCheckedMs: now,
      });

      const finalScores = await localGradeDb.getScoresByCourse(activeIds);
      return {
        columns: activeColumns as AssessmentColumn[],
        scores: new Map(finalScores.map((s) => [s.id, s])),
      };
    } catch (err) {
      console.warn('⚠️ โหลดคะแนนออนไลน์ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน:', err);
      return {
        columns: cachedColumns,
        scores: new Map(cachedScores.map((s) => [s.id, s])),
      };
    }
  },

  /**
   * 2. เมื่อครูกดพิมพ์แก้คะแนนในช่องใดช่องหนึ่ง (Dirty Cell)
   */
  async updateStudentScore(studentId: string, assignmentId: string, scoreValue: number | null): Promise<StudentScore> {
    const recordId = `${studentId}_${assignmentId}`;
    const record: StudentScore = {
      id: recordId,
      studentId,
      assignmentId,
      score: scoreValue,
      updatedAt: new Date().toISOString(),
    };

    await localGradeDb.stageDirtyScore(record);
    this.scheduleDebouncedFlush();

    return record;
  },

  scheduleDebouncedFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void this.flushOutbox();
    }, DEBOUNCE_DELAY_MS);
  },

  /**
   * 3. ส่งข้อมูลช่องคะแนนที่ค้างใน Outbox ขึ้น Supabase (Concurrency-Safe + Zero Egress)
   */
  async flushOutbox(): Promise<void> {
    if (isFlushing) {
      // ✅ หากกำลังส่งอยู่แล้วครูพิมพ์เพิ่ม ให้ตั้ง Flag รอส่งซ้ำทันทีที่รอบนี้จบ
      hasPendingReFlush = true;
      return;
    }
    // Only pause flush when explicitly known to be offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const pending = await localGradeDb.getAllOutbox();
    if (pending.length === 0) return;

    isFlushing = true;
    hasPendingReFlush = false;

    try {
      const BATCH_SIZE = 100;
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);

        const { error } = await supabase.from('StudentScore').upsert(batch, {
          onConflict: 'studentId,assignmentId',
          ignoreDuplicates: false,
        });

        if (error) throw error;

        // ✅ ลบเฉพาะแถวที่ updatedAt ยังตรงกับชุดที่เพิ่งส่งผ่าน
        await localGradeDb.removeSyncedOutbox(batch);
      }
    } catch (err) {
      console.warn('⚠️ ซิงค์คะแนนไม่สำเร็จ รอส่งให้อัตโนมัติรอบถัดไป:', err);
    } finally {
      isFlushing = false;
      // ✅ ถ้ามีคะแนนใหม่เข้ามาแทรกระหว่างที่กำลัง Flush ให้รันอีกรอบทันที
      if (hasPendingReFlush) {
        hasPendingReFlush = false;
        this.scheduleDebouncedFlush();
      }
    }
  },

  /**
   * 4. คำนวณคะแนนรวมและตัดเกรด (รองรับเกณฑ์ สพฐ. 8 ระดับ + เช็คติด 'ร' กรณีขาดสอบกลางภาค/ปลายภาค)
   */
  calculateFinalGrade(
    studentId: string,
    columns: AssessmentColumn[],
    scoresMap: Map<string, StudentScore>
  ): { totalScore: number; grade: string; isIncomplete: boolean } {
    let totalWeightedScore = 0;
    let totalDefinedWeight = 0;
    let isMissingKeyExam = false;

    for (const col of columns) {
      const recordKey = `${studentId}_${col.id}`;
      const scoreRec = scoresMap.get(recordKey);
      const rawScore = scoreRec?.score;

      // เช็คว่าขาดสอบกลางภาคหรือปลายภาคหรือไม่ (ถ้ายังเป็น null/undefined ให้ขึ้นสถานะติด 'ร')
      if ((col.category === 'MIDTERM' || col.category === 'FINAL') && (rawScore === null || rawScore === undefined)) {
        isMissingKeyExam = true;
      }

      const score = rawScore ?? 0;

      if (col.maxScore > 0) {
        const normalized = (score / col.maxScore) * col.weight;
        totalWeightedScore += normalized;
        totalDefinedWeight += col.weight;
      }
    }

    // ✅ ใช้คะแนนสะสมตามน้ำหนักจริง (ถ้าครูตั้งน้ำหนักรวมเกิน 100 ค่อยปรับสเกลลงมาเป็น 100)
    const finalScore =
      totalDefinedWeight > 100
        ? (totalWeightedScore / totalDefinedWeight) * 100
        : totalWeightedScore;

    if (isMissingKeyExam) {
      return { totalScore: Number(finalScore.toFixed(2)), grade: 'ร', isIncomplete: true };
    }

    let grade = '0';
    if (finalScore >= 80) grade = '4';
    else if (finalScore >= 75) grade = '3.5';
    else if (finalScore >= 70) grade = '3';
    else if (finalScore >= 65) grade = '2.5';
    else if (finalScore >= 60) grade = '2';
    else if (finalScore >= 55) grade = '1.5';
    else if (finalScore >= 50) grade = '1';
    else grade = '0';

    return { totalScore: Number(finalScore.toFixed(2)), grade, isIncomplete: false };
  },

  // Helper for test cleanup
  _resetMemoryStoreForTesting() {
    memoryGradeFallback.columns.clear();
    memoryGradeFallback.scores.clear();
    memoryGradeFallback.outbox.clear();
    memoryGradeFallback.meta.clear();
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    isFlushing = false;
    hasPendingReFlush = false;
  },
};

// ✅ ผูก Lifecycle Listeners อัตโนมัติ (ทำงานเฉพาะฝั่ง Browser)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void gradeService.flushOutbox();
  });
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void gradeService.flushOutbox();
      }
    });
  }
}
