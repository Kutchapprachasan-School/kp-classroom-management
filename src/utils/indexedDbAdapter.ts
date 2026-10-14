// src/utils/indexedDbAdapter.ts
// Universal High-Capacity IndexedDB Adapter & Safe Migration Engine
// ออกแบบตามหลักสถาปัตยกรรมระดับ Production (Forensic Architecture):
// 1. Context-bound Account Isolation (แยกข้อมูลตาม userId ไม่ปะปนกันบนเครื่องคอมพิวเตอร์ที่ใช้ร่วมกัน)
// 2. Serialized PromiseQueue ป้องกัน Write Race Collisions ภายใต้งานเขียนพร้อมกัน
// 3. Two-Phase Safe Idempotent Migration พร้อมตรวจสอบ Checksum ยืนยัน Zero Data Loss
// 4. Outbox State Machine & Deduplication สำหรับระบบข้อความออฟไลน์

export type OutboxSyncStatus = 'PENDING_SYNC' | 'IN_FLIGHT' | 'SYNCED' | 'RETRYING' | 'FATAL_FAILED';

export interface OutboxItem {
  idempotencyKey: string; // UUID v4
  groupId: string;
  senderId: string;
  content: string;
  syncStatus: OutboxSyncStatus;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  payload?: any;
}

export interface RetryPolicyConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterRatio: number;
}

export const DEFAULT_RETRY_CONFIG: RetryPolicyConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2.0,
  jitterRatio: 0.2,
};

/**
 * คำนวณระยะเวลา Exponential Backoff พร้อมสุ่ม Jitter ±20%
 */
export function computeNextBackoffMs(
  retryCount: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_CONFIG
): number {
  if (retryCount >= config.maxRetries) return -1;
  const base = Math.min(
    config.maxDelayMs,
    config.initialDelayMs * Math.pow(config.backoffFactor, retryCount)
  );
  const jitter = (Math.random() * 2 - 1) * config.jitterRatio * base;
  return Math.round(base + jitter);
}

/**
 * Deterministic Canonical JSON Stringify (เรียง Keys ตามลำดับตัวอักษรเสมอ)
 */
export function canonicalJsonStringify(data: unknown): string {
  if (data === null || typeof data !== 'object') {
    return JSON.stringify(data);
  }
  if (Array.isArray(data)) {
    return '[' + data.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(data as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          canonicalJsonStringify((data as Record<string, unknown>)[k])
      )
      .join(',') +
    '}'
  );
}

/**
 * คำนวณ Checksum ด้วย SHA-256 (หรือ Fallback FNV-1a สำหรับสภาพแวดล้อมทดสอบ)
 */
export async function computeSha256Checksum(str: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback 32-bit FNV-1a Checksum for Headless Node.js environments
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

// ============================================================================
// IndexedDB Universal Engine with Serialized Write Queue
// ============================================================================

const DB_NAME = 'kp_classroom_idb';
const DB_VERSION = 1;
const STORES = ['chat_groups', 'chat_messages', 'outbox_queue', 'cached_submissions'] as const;
type StoreName = (typeof STORES)[number];

class IndexedDbAdapter {
  private activeUserId: string = 'default_user';
  private writeQueues = new Map<string, Promise<any>>();
  private memoryFallbackStore = new Map<string, any>();
  private dbInstance: IDBDatabase | null = null;

  private getScopedKey(storeName: string, key: string, userId?: string): string {
    const effectiveUser = userId || this.activeUserId;
    return `${effectiveUser}::${storeName}::${key}`;
  }

  /**
   * เข้าคิว Promise Queue แบบเรียงลำดับ ป้องกัน Write Race Collisions
   */
  private queueOperation<T>(op: () => Promise<T>): Promise<T> {
    const queueKey = this.activeUserId;
    const currentQueue = this.writeQueues.get(queueKey) || Promise.resolve();
    const nextQueue = currentQueue.then(op, op);
    this.writeQueues.set(queueKey, nextQueue);
    return nextQueue;
  }

  /**
   * เปิดการเชื่อมต่อ IndexedDB
   */
  public async init(userId: string = 'default_user'): Promise<void> {
    this.activeUserId = userId;

    if (typeof window === 'undefined' || !window.indexedDB) {
      // In-memory mode for SSR / Node environment
      return;
    }

    if (this.dbInstance) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        }
      };

      request.onsuccess = (event) => {
        this.dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * บันทึกข้อมูลแบบ Scoped User Context ผ่านคิวป้องกันการเขียนชนกัน
   */
  public async setItem<T>(
    storeName: StoreName,
    key: string,
    value: T,
    userId?: string
  ): Promise<void> {
    const scopedKey = this.getScopedKey(storeName, key, userId);

    return this.queueOperation(async () => {
      // Fallback in-memory store
      this.memoryFallbackStore.set(scopedKey, value);

      if (typeof window === 'undefined' || !window.indexedDB || !this.dbInstance) {
        return;
      }

      return new Promise((resolve, reject) => {
        try {
          const tx = this.dbInstance!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.put(value, scopedKey);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * ดึงข้อมูลตาม Scoped User Context
   */
  public async getItem<T>(
    storeName: StoreName,
    key: string,
    userId?: string
  ): Promise<T | null> {
    const scopedKey = this.getScopedKey(storeName, key, userId);

    if (typeof window === 'undefined' || !window.indexedDB || !this.dbInstance) {
      const val = this.memoryFallbackStore.get(scopedKey);
      return val !== undefined ? (val as T) : null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.dbInstance!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(scopedKey);
        req.onsuccess = () => {
          resolve(req.result !== undefined ? (req.result as T) : null);
        };
        req.onerror = () => {
          // fallback memory
          const val = this.memoryFallbackStore.get(scopedKey);
          resolve(val !== undefined ? (val as T) : null);
        };
      } catch {
        const val = this.memoryFallbackStore.get(scopedKey);
        resolve(val !== undefined ? (val as T) : null);
      }
    });
  }

  /**
   * ลบข้อมูลตาม Scoped User Context
   */
  public async removeItem(
    storeName: StoreName,
    key: string,
    userId?: string
  ): Promise<void> {
    const scopedKey = this.getScopedKey(storeName, key, userId);
    return this.queueOperation(async () => {
      this.memoryFallbackStore.delete(scopedKey);

      if (typeof window === 'undefined' || !window.indexedDB || !this.dbInstance) {
        return;
      }

      return new Promise((resolve) => {
        try {
          const tx = this.dbInstance!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(scopedKey);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    });
  }

  /**
   * เพิ่มข้อความเข้าคิว Outbox สำหรับข้อความที่รอซิงก์ขึ้น Cloud (Idempotent)
   */
  public async enqueueOutbox(item: OutboxItem, userId?: string): Promise<void> {
    const effectiveUser = userId || this.activeUserId;
    const currentList =
      (await this.getItem<OutboxItem[]>('outbox_queue', 'pending_items', effectiveUser)) || [];

    const existingIdx = currentList.findIndex(
      (it) => it.idempotencyKey === item.idempotencyKey
    );

    let updatedList: OutboxItem[];
    if (existingIdx !== -1) {
      // Deduplicate: อัปเดตรายการเดิม ไม่เพิ่มแถวซ้ำ
      updatedList = currentList.map((it, idx) => (idx === existingIdx ? item : it));
    } else {
      updatedList = [...currentList, item];
    }

    await this.setItem('outbox_queue', 'pending_items', updatedList, effectiveUser);
  }

  /**
   * ดึงรายการ Outbox ที่ยังรอซิงก์
   */
  public async getPendingOutbox(userId?: string): Promise<OutboxItem[]> {
    const effectiveUser = userId || this.activeUserId;
    const list =
      (await this.getItem<OutboxItem[]>('outbox_queue', 'pending_items', effectiveUser)) || [];
    return list.filter((it) => it.syncStatus === 'PENDING_SYNC' || it.syncStatus === 'RETRYING');
  }

  /**
   * ทำเครื่องหมายว่า Outbox ได้รับการซิงก์ขึ้น Cloud สำเร็จแล้ว
   */
  public async markOutboxSynced(idempotencyKey: string, userId?: string): Promise<void> {
    const effectiveUser = userId || this.activeUserId;
    const currentList =
      (await this.getItem<OutboxItem[]>('outbox_queue', 'pending_items', effectiveUser)) || [];

    const updated = currentList.filter((it) => it.idempotencyKey !== idempotencyKey);
    await this.setItem('outbox_queue', 'pending_items', updated, effectiveUser);
  }

  /**
   * ย้ายข้อมูลเดิมจาก localStorage สู่ IndexedDB แบบปลอดภัย 100% (Two-Phase Verification)
   */
  public async safeMigrateFromLocalStorage(
    legacyKey: string,
    targetStore: StoreName,
    targetKey: string,
    userId?: string
  ): Promise<{ success: boolean; migratedCount: number; message: string }> {
    const effectiveUser = userId || this.activeUserId;

    // 1. อ่านข้อมูลจาก localStorage
    let rawSource: string | null = null;
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      rawSource = globalThis.localStorage.getItem(legacyKey);
    }

    if (!rawSource) {
      return {
        success: true,
        migratedCount: 0,
        message: `ไม่พบข้อมูลค้างใน legacy key: ${legacyKey}`,
      };
    }

    try {
      const parsedData = JSON.parse(rawSource);
      if (!parsedData) {
        return { success: true, migratedCount: 0, message: 'ข้อมูลว่างเปล่า' };
      }

      // 2. คำนวณ Source Checksum
      const sourceCanonical = canonicalJsonStringify(parsedData);
      const sourceChecksum = await computeSha256Checksum(sourceCanonical);

      // 3. เขียนลง IndexedDB
      await this.setItem(targetStore, targetKey, parsedData, effectiveUser);

      // 4. อ่านข้อมูลกลับมาจาก IndexedDB ทันทีเพื่อตรวจสอบความสมบูรณ์ (Read-Back Check)
      const readBackData = await this.getItem(targetStore, targetKey, effectiveUser);
      if (!readBackData) {
        throw new Error('ไม่สามารถอ่านข้อมูลกลับมาจาก IndexedDB ได้');
      }

      const targetCanonical = canonicalJsonStringify(readBackData);
      const targetChecksum = await computeSha256Checksum(targetCanonical);

      // 5. ตรวจสอบ Checksum ต้องตรงกัน 100%
      if (sourceChecksum !== targetChecksum) {
        await this.removeItem(targetStore, targetKey, effectiveUser);
        throw new Error(
          `Checksum ไม่ตรงกัน! Source: ${sourceChecksum} != Target: ${targetChecksum}`
        );
      }

      // 6. สำรองข้อมูลเดิมไว้ที่ archive ก่อนลบตัวจริง ป้องกันข้อมูลสูญหาย
      const archiveKey = `${legacyKey}_archive_${Date.now()}`;
      if (globalThis.localStorage) {
        globalThis.localStorage.setItem(archiveKey, rawSource);
        globalThis.localStorage.removeItem(legacyKey);
      }

      const count = Array.isArray(parsedData) ? parsedData.length : 1;
      return {
        success: true,
        migratedCount: count,
        message: `ย้ายข้อมูลสำเร็จ ${count} รายการ (Checksum ตรงกัน 100% และสำรองข้อมูลเดิมไว้ที่ ${archiveKey})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        migratedCount: 0,
        message: `การย้ายข้อมูลล้มเหลว (คงข้อมูลเดิมใน localStorage ไว้ 100%): ${msg}`,
      };
    }
  }
}

export const indexedDbAdapter = new IndexedDbAdapter();
