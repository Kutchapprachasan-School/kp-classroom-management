/**
 * Universal Service Adapter Layer
 *
 * Implements dual-mode resilience between remote Supabase PostgreSQL and offline
 * LocalStorage / In-Memory cache, ensuring zero UI crashes, timeout protection,
 * and reactive synchronization across all school management modules.
 *
 * Design System: Pastel Anime Education Dashboard
 */

import { supabase as defaultSupabase, isSupabaseConfigured as defaultIsConfigured, logDbOperation } from './supabase';

// ----------------------------------------------------
// Core Interfaces
// ----------------------------------------------------
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  new?: T;
  old?: T;
}

export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

export interface UniversalAdapterConfig<T = any> {
  tableName: string;
  storageKey: string;
  defaultData?: T[] | (() => T[]);
  idField?: keyof T | ((item: T) => string);
  remoteIdCol?: string;
  timeoutMs?: number;
  domain?: 'attendance' | 'grading' | 'exams' | 'lesson_plans' | 'messaging' | 'academic';
  toRemote?: (item: T) => any;
  fromRemote?: (raw: any) => T;
  client?: any;
  forceOffline?: boolean;
}

export interface UniversalAdapter<T> {
  getAll(filter?: ((item: T) => boolean) | Partial<Record<keyof T, any>>): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  upsert(item: T, options?: { expectedVersion?: number }): Promise<T>;
  delete(id: string): Promise<boolean>;
  subscribe(callback: (payload: RealtimePayload<T>) => void): () => void;
  getMode(): 'supabase' | 'fallback';
  isOnline(): boolean;
  clearLocalCache(): void;
  getStorageKey(): string;
  getTableName(): string;
}

// ----------------------------------------------------
// In-Memory Storage Driver (Headless Node & SSR)
// ----------------------------------------------------
const globalMemoryStore = new Map<string, string>();

export const getStorageDriver = (): StorageDriver => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const testKey = '__adapter_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch {
      // Fallback if localStorage is disabled or throws QuotaExceeded
    }
  }

  return {
    getItem: (key: string): string | null => globalMemoryStore.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      globalMemoryStore.set(key, String(value));
    },
    removeItem: (key: string): void => {
      globalMemoryStore.delete(key);
    },
    clear: (): void => {
      globalMemoryStore.clear();
    },
  };
};

export const clearMemoryStore = (): void => globalMemoryStore.clear();
export const getMemoryStore = (): Map<string, string> => globalMemoryStore;

export const readStorage = <T>(key: string, fallback: T): T => {
  const driver = getStorageDriver();
  const raw = driver.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeStorage = <T>(key: string, value: T): void => {
  const driver = getStorageDriver();
  try {
    driver.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[UniversalAdapter] Failed to serialize data for key '${key}':`, err);
  }
};

export const removeStorage = (key: string): void => {
  getStorageDriver().removeItem(key);
};

// ----------------------------------------------------
// Testing Mode & Mock Injection
// ----------------------------------------------------
let globalTestMode: 'auto' | 'offline' | 'online' = 'auto';
let globalMockClient: any = null;

export const setAdapterTestMode = (
  mode: 'auto' | 'offline' | 'online',
  mockClient?: any
): void => {
  globalTestMode = mode;
  globalMockClient = mockClient ?? null;
};

export const resetAllAdapters = (): void => {
  globalTestMode = 'auto';
  globalMockClient = null;
  clearMemoryStore();
};

// ----------------------------------------------------
// Timeout Guard
// ----------------------------------------------------
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number = 2500,
  opName: string = 'remote query'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[UniversalAdapter] ${opName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

// ----------------------------------------------------
// Helper: Primary Key Resolution
// ----------------------------------------------------
const resolveId = <T>(item: T, idField?: keyof T | ((item: T) => string)): string => {
  if (typeof idField === 'function') {
    return idField(item);
  }
  if (idField && (item as any)[idField] !== undefined) {
    return String((item as any)[idField]);
  }
  const anyItem = item as any;
  if (anyItem.id !== undefined && anyItem.id !== null) return String(anyItem.id);
  if (anyItem.studentCode !== undefined) return String(anyItem.studentCode);
  if (anyItem.code !== undefined) return String(anyItem.code);
  return '';
};

// ----------------------------------------------------
// Factory: createUniversalAdapter
// ----------------------------------------------------
export function createUniversalAdapter<T>(config: UniversalAdapterConfig<T>): UniversalAdapter<T> {
  const {
    tableName,
    storageKey,
    defaultData,
    idField,
    remoteIdCol = 'id',
    timeoutMs = 2500,
    toRemote,
    fromRemote,
  } = config;

  const localSubscribers = new Set<(payload: RealtimePayload<T>) => void>();

  // Circuit breaker state
  let failureCount = 0;
  let lastFailureTime = 0;
  const CIRCUIT_COOLDOWN_MS = 15000;

  const isCircuitOpen = (): boolean => {
    if (failureCount >= 2) {
      if (Date.now() - lastFailureTime < CIRCUIT_COOLDOWN_MS) {
        return true;
      }
      // Cooldown passed, allow trial request
      failureCount = 1;
    }
    return false;
  };

  const recordSuccess = () => {
    failureCount = 0;
  };

  const recordFailure = (err: unknown) => {
    failureCount++;
    lastFailureTime = Date.now();
    console.warn(`[UniversalAdapter:${tableName}] Remote failure (fallback to local):`, (err as any)?.message || err);
  };

  const getClient = () => {
    if (globalMockClient) return globalMockClient;
    if (config.client) return config.client;
    return defaultSupabase;
  };

  const shouldQueryRemote = (): boolean => {
    if (globalTestMode === 'offline') return false;
    if (config.forceOffline) return false;
    if (globalTestMode === 'online') return true;
    if (!defaultIsConfigured && !config.client && !globalMockClient) return false;
    if (isCircuitOpen()) return false;
    return true;
  };

  // Local storage cache accessors
  const getLocalItems = (): T[] => {
    const raw = getStorageDriver().getItem(storageKey);
    if (raw === null && defaultData !== undefined) {
      const initial = typeof defaultData === 'function' ? defaultData() : defaultData;
      writeStorage(storageKey, initial);
      return initial;
    }
    return readStorage<T[]>(storageKey, []);
  };

  const setLocalItems = (items: T[]): void => {
    writeStorage(storageKey, items);
  };

  const notifySubscribers = (payload: RealtimePayload<T>) => {
    for (const sub of localSubscribers) {
      try {
        sub(payload);
      } catch (err) {
        console.warn(`[UniversalAdapter:${tableName}] Subscriber error:`, err);
      }
    }
  };

  return {
    async getAll(filter?: ((item: T) => boolean) | Partial<Record<keyof T, any>>): Promise<T[]> {
      if (shouldQueryRemote()) {
        try {
          const client = getClient();
          logDbOperation(`SELECT * FROM ${tableName}`);
          const { data, error } = await withTimeout(
            client.from(tableName).select('*'),
            timeoutMs,
            `SELECT * FROM ${tableName}`
          );

          if (!error && Array.isArray(data)) {
            recordSuccess();
            const transformed = fromRemote ? data.map(fromRemote) : (data as T[]);
            setLocalItems(transformed);
            if (typeof filter === 'function') {
              return transformed.filter(filter);
            }
            if (filter && typeof filter === 'object') {
              return transformed.filter((item) =>
                Object.entries(filter).every(([k, v]) => (item as any)[k] === v)
              );
            }
            return transformed;
          } else if (error) {
            recordFailure(error);
          }
        } catch (err) {
          recordFailure(err);
        }
      }

      // Local fallback
      const local = getLocalItems();
      if (typeof filter === 'function') {
        return local.filter(filter);
      }
      if (filter && typeof filter === 'object') {
        return local.filter((item) =>
          Object.entries(filter).every(([k, v]) => (item as any)[k] === v)
        );
      }
      return local;
    },

    async getById(id: string): Promise<T | null> {
      if (shouldQueryRemote()) {
        try {
          const client = getClient();
          logDbOperation(`SELECT FROM ${tableName} WHERE ${remoteIdCol} = ${id}`);
          const { data, error } = await withTimeout(
            client.from(tableName).select('*').eq(remoteIdCol, id).maybeSingle(),
            timeoutMs,
            `SELECT FROM ${tableName} WHERE ${remoteIdCol} = ${id}`
          );

          if (!error && data) {
            recordSuccess();
            const item = fromRemote ? fromRemote(data) : (data as T);
            // Update local item in cache
            const all = getLocalItems();
            const idx = all.findIndex((x) => resolveId(x, idField) === id);
            if (idx >= 0) all[idx] = item;
            else all.push(item);
            setLocalItems(all);
            return item;
          } else if (error) {
            recordFailure(error);
          }
        } catch (err) {
          recordFailure(err);
        }
      }

      // Local fallback
      const all = getLocalItems();
      const match = all.find((x) => resolveId(x, idField) === id);
      return match ?? null;
    },

    async upsert(item: T, options?: { expectedVersion?: number }): Promise<T> {
      const id = resolveId(item, idField);
      const all = getLocalItems();
      const existingIdx = all.findIndex((x) => resolveId(x, idField) === id);
      const existing = existingIdx >= 0 ? all[existingIdx] : undefined;

      // Optimistic concurrency control (OCC)
      if (options?.expectedVersion !== undefined && existing) {
        const curVer = (existing as any).version;
        if (typeof curVer === 'number' && curVer !== options.expectedVersion) {
          throw new Error(
            `[UniversalAdapter:${tableName}] Concurrency conflict: Version mismatch. Expected ${options.expectedVersion}, found ${curVer}`
          );
        }
      }

      // Auto-increment version if version field exists
      if (typeof (item as any).version === 'number') {
        (item as any).version = ((existing as any)?.version ?? 0) + 1;
      }

      // 1. Optimistic local persistence
      if (existingIdx >= 0) {
        all[existingIdx] = item;
      } else {
        all.push(item);
      }
      setLocalItems(all);

      // 2. Local subscriber notification
      notifySubscribers({
        eventType: existing ? 'UPDATE' : 'INSERT',
        new: item,
        old: existing,
      });

      // 3. Remote synchronization
      if (shouldQueryRemote()) {
        try {
          const client = getClient();
          const payload = toRemote ? toRemote(item) : item;
          logDbOperation(`UPSERT INTO ${tableName}`, payload);
          const { data, error } = await withTimeout(
            client.from(tableName).upsert(payload).select().maybeSingle(),
            timeoutMs,
            `UPSERT INTO ${tableName}`
          );

          if (!error) {
            recordSuccess();
            if (data) {
              const remoteReturned = fromRemote ? fromRemote(data) : (data as T);
              // Update with server enriched data (e.g. server-side timestamps)
              const cur = getLocalItems();
              const idx = cur.findIndex((x) => resolveId(x, idField) === id);
              if (idx >= 0) {
                cur[idx] = remoteReturned;
                setLocalItems(cur);
              }
              return remoteReturned;
            }
          } else {
            recordFailure(error);
          }
        } catch (err) {
          recordFailure(err);
        }
      }

      return item;
    },

    async delete(id: string): Promise<boolean> {
      // 1. Local deletion
      const all = getLocalItems();
      const existing = all.find((x) => resolveId(x, idField) === id);
      const filtered = all.filter((x) => resolveId(x, idField) !== id);
      setLocalItems(filtered);

      // 2. Notify subscribers
      if (existing) {
        notifySubscribers({
          eventType: 'DELETE',
          old: existing,
        });
      }

      // 3. Remote deletion
      if (shouldQueryRemote()) {
        try {
          const client = getClient();
          logDbOperation(`DELETE FROM ${tableName} WHERE ${remoteIdCol} = ${id}`);
          const { error } = await withTimeout(
            client.from(tableName).delete().eq(remoteIdCol, id),
            timeoutMs,
            `DELETE FROM ${tableName} WHERE ${remoteIdCol} = ${id}`
          );

          if (!error) {
            recordSuccess();
          } else {
            recordFailure(error);
          }
        } catch (err) {
          recordFailure(err);
        }
      }

      return true;
    },

    subscribe(callback: (payload: RealtimePayload<T>) => void): () => void {
      localSubscribers.add(callback);

      let channel: any = null;
      if (shouldQueryRemote()) {
        try {
          const client = getClient();
          if (client && typeof client.channel === 'function') {
            const channelName = `sync_${tableName}_${Math.random().toString(36).slice(2, 8)}`;
            channel = client
              .channel(channelName)
              .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload: any) => {
                const transformedNew = payload.new
                  ? fromRemote
                    ? fromRemote(payload.new)
                    : (payload.new as T)
                  : undefined;
                const transformedOld = payload.old
                  ? fromRemote
                    ? fromRemote(payload.old)
                    : (payload.old as T)
                  : undefined;

                // Sync incoming remote changes into local cache
                if (transformedNew) {
                  const items = getLocalItems();
                  const targetId = resolveId(transformedNew, idField);
                  const idx = items.findIndex((x) => resolveId(x, idField) === targetId);
                  if (idx >= 0) items[idx] = transformedNew;
                  else items.push(transformedNew);
                  setLocalItems(items);
                } else if (payload.eventType === 'DELETE' && transformedOld) {
                  const targetId = resolveId(transformedOld, idField);
                  setLocalItems(getLocalItems().filter((x) => resolveId(x, idField) !== targetId));
                }

                callback({
                  eventType: payload.eventType,
                  new: transformedNew,
                  old: transformedOld,
                });
              })
              .subscribe();
          }
        } catch (err) {
          console.warn(`[UniversalAdapter:${tableName}] Failed to create realtime channel:`, err);
        }
      }

      return () => {
        localSubscribers.delete(callback);
        if (channel) {
          try {
            const client = getClient();
            client.removeChannel(channel);
          } catch {}
        }
      };
    },

    getMode(): 'supabase' | 'fallback' {
      return shouldQueryRemote() ? 'supabase' : 'fallback';
    },

    isOnline(): boolean {
      return shouldQueryRemote() && !isCircuitOpen();
    },

    clearLocalCache(): void {
      getStorageDriver().removeItem(storageKey);
    },

    getStorageKey(): string {
      return storageKey;
    },

    getTableName(): string {
      return tableName;
    },
  };
}
