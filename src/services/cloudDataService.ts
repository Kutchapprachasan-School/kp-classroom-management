// src/services/cloudDataService.ts
// Centralized Cloud Persistence & Cross-Device Sync Engine
// Backed by remote Supabase PostgreSQL (public.kps_cloud_store)
// Ensures data is NEVER locked to a single device's localStorage.

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CloudStoreRecord<T = unknown> {
  key: string;
  data: T;
  updated_at: string;
}

export interface CloudSyncState {
  isInitialized: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingSyncCount: number;
  syncError: string | null;
}

class CloudDataService {
  private syncState: CloudSyncState = {
    isInitialized: false,
    isOnline: true,
    lastSyncedAt: null,
    pendingSyncCount: 0,
    syncError: null,
  };

  private inMemoryCache = new Map<string, any>();
  private pendingWriteQueue = new Map<string, { data: any; timer: any }>();
  private isHydratingFromCloud = false;
  private realtimeChannel: any = null;
  private stateChangeListeners = new Set<(state: CloudSyncState) => void>();

  private inMemoryTimestamps = new Map<string, string>();

  private getLocalTimestamps(): Record<string, string> {
    const mem: Record<string, string> = {};
    this.inMemoryTimestamps.forEach((v, k) => {
      mem[k] = v;
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('kps_cloud_timestamps_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...mem, ...parsed };
        }
      } catch {
        // ignore
      }
    }
    return mem;
  }

  private setLocalTimestamp(key: string, timestamp: string) {
    this.inMemoryTimestamps.set(key, timestamp);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const current = this.getLocalTimestamps();
        current[key] = timestamp;
        this.isHydratingFromCloud = true;
        window.localStorage.setItem('kps_cloud_timestamps_v1', JSON.stringify(current));
      } catch {
        // ignore
      } finally {
        this.isHydratingFromCloud = false;
      }
    }
  }

  // Keys that belong strictly to the local browser/device session and must NEVER be synced to Supabase kps_cloud_store
  // (Prevents session bleed where refreshing on Device B overwrites auth session with Device A!)
  private static readonly LOCAL_SESSION_KEYS = new Set([
    'cls_current_auth_user',
    'cms_affairs_active_role_v1',
    'kp_teacher_sidebar_open',
    'kp_student_sidebar_open',
    'kps_cloud_timestamps_v1',
    'kp_hide_completed_periods',
    'kp_teacher_font_scale',
    'kp_teacher_custom_font_px',
    'kp_pwa_install_dismissed_v1',
  ]);

  // Filter to determine which keys should be automatically mirrored to Supabase
  private isAppStorageKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    // Exclude device-local session keys, internal telemetry, supabase tokens
    if (
      CloudDataService.LOCAL_SESSION_KEYS.has(key) ||
      key.startsWith('kp_sub_file_') || // Large local binary caches stay in R2, never uploaded to Postgres!
      key.startsWith('sb-') ||
      key.startsWith('supabase.') ||
      key.startsWith('__') ||
      key.startsWith('loglevel') ||
      key.includes('test') ||
      /^cls_students_ม\.\s*\d+\/\d+$/.test(key) // Exclude duplicate Thai room aliases (canonical cls_students_room- is already synced)
    ) {
      return false;
    }

    // Include all school, student, classroom, attendance, assignment, and app data keys
    return (
      key.startsWith('kp_') ||
      key.startsWith('kps_') ||
      key.startsWith('cls_') ||
      key.startsWith('cms_') ||
      key.startsWith('sms_') ||
      key.includes('school') ||
      key.includes('student') ||
      key.includes('classroom') ||
      key.includes('setting') ||
      key.includes('roster') ||
      key.includes('attendance') ||
      key.includes('assignment') ||
      key.includes('grade') ||
      key.includes('score') ||
      key.includes('calendar') ||
      key.includes('message') ||
      key.includes('lesson') ||
      key.includes('exam') ||
      key.includes('schedule') ||
      key.includes('banner')
    );
  }

  public getSyncState(): CloudSyncState {
    return { ...this.syncState };
  }

  public onSyncStateChange(listener: (state: CloudSyncState) => void): () => void {
    this.stateChangeListeners.add(listener);
    listener(this.getSyncState());
    return () => this.stateChangeListeners.delete(listener);
  }

  private notifyStateChange() {
    const current = this.getSyncState();
    this.stateChangeListeners.forEach((fn) => {
      try {
        fn(current);
      } catch (err) {
        console.error('[CloudDataService] Listener error:', err);
      }
    });
  }

  /**
   * Fetch a single key from Supabase cloud store
   */
  public async fetchCloudKey<T = unknown>(key: string, fallback?: T): Promise<T | null> {
    if (!this.isAppStorageKey(key)) {
      return this.inMemoryCache.get(key) ?? fallback ?? null;
    }

    if (!isSupabaseConfigured) {
      return this.inMemoryCache.get(key) ?? fallback ?? null;
    }

    try {
      // 1. Check local timestamp and local storage/memory cache first
      const localTimestamps = this.getLocalTimestamps();
      const localTs = localTimestamps[key] || this.inMemoryTimestamps.get(key);
      const cachedVal =
        this.inMemoryCache.get(key) ??
        (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null);

      if (localTs && cachedVal !== null && cachedVal !== undefined) {
        // Delta check: fetch only lightweight updated_at (~30 bytes)
        const { data: metaData, error: metaErr } = await supabase
          .from('kps_cloud_store')
          .select('key, updated_at')
          .eq('key', key)
          .maybeSingle();

        if (!metaErr && metaData && metaData.updated_at === localTs) {
          // Record is identical! Zero payload egress.
          try {
            return typeof cachedVal === 'string' ? JSON.parse(cachedVal) : (cachedVal as T);
          } catch {
            return cachedVal as T;
          }
        }
      }

      // 2. Fetch full payload only when missing or updated remotely
      const { data, error } = await supabase
        .from('kps_cloud_store')
        .select('key, data, updated_at')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.warn(`[CloudDataService] Error fetching key '${key}':`, error.message);
        return this.inMemoryCache.get(key) ?? fallback ?? null;
      }

      if (data && data.data !== undefined) {
        this.inMemoryCache.set(key, data.data);
        if (data.updated_at) {
          this.setLocalTimestamp(key, data.updated_at);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            this.isHydratingFromCloud = true;
            window.localStorage.setItem(key, typeof data.data === 'string' ? data.data : JSON.stringify(data.data));
          } catch {
            // ignore quota
          } finally {
            this.isHydratingFromCloud = false;
          }
        }
        return data.data as T;
      }

      return fallback ?? null;
    } catch (err) {
      console.warn(`[CloudDataService] Exception fetching key '${key}':`, err);
      return this.inMemoryCache.get(key) ?? fallback ?? null;
    }
  }

  /**
   * Save a key directly to remote Supabase cloud store
   */
  public async saveCloudKey<T = unknown>(key: string, data: T): Promise<T> {
    this.inMemoryCache.set(key, data);

    // Save locally as immediate fast cache
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this.isHydratingFromCloud = true;
        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        window.localStorage.setItem(key, serialized);
      } catch {
        // ignore quota
      } finally {
        this.isHydratingFromCloud = false;
      }
    }

    if (!isSupabaseConfigured || !this.isAppStorageKey(key)) {
      return data;
    }

    const nowIso = new Date().toISOString();
    try {
      this.syncState.pendingSyncCount++;
      this.notifyStateChange();

      const upsertPromise = supabase
        .from('kps_cloud_store')
        .upsert({
          key,
          data,
          updated_at: nowIso,
        });

      const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ error: { message: 'Cloud sync timeout (10s)' } }), 10000)
      );

      const { error } = (await Promise.race([upsertPromise, timeoutPromise])) as any;

      if (error) {
        console.warn(`[CloudDataService] Cloud upsert error for '${key}':`, error.message);
        this.syncState.syncError = error.message;
      } else {
        this.syncState.syncError = null;
        this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
        this.setLocalTimestamp(key, nowIso);
      }
    } catch (err: any) {
      console.warn(`[CloudDataService] Exception upserting '${key}':`, err);
      this.syncState.syncError = err?.message || String(err);
    } finally {
      this.syncState.pendingSyncCount = Math.max(0, this.syncState.pendingSyncCount - 1);
      this.notifyStateChange();
    }

    return data;
  }

  /**
   * Fetch cloud keys using Delta Sync (Avoids downloading full payloads when unchanged)
   * Cuts Supabase PostgREST Egress by up to 99% on repeated page loads!
   */
  public async fetchAllCloudData(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    if (!isSupabaseConfigured) {
      return result;
    }

    try {
      // 1. Fetch lightweight metadata (key, updated_at) only (~2 KB total)
      const { data: remoteKeys, error: metaErr } = await supabase
        .from('kps_cloud_store')
        .select('key, updated_at');

      if (metaErr) {
        console.warn('[CloudDataService] Error loading cloud metadata:', metaErr.message);
        this.syncState.syncError = metaErr.message;
        return result;
      }

      if (Array.isArray(remoteKeys)) {
        const localTimestamps = this.getLocalTimestamps();
        const hasLocalKey = (k: string) => {
          if (this.inMemoryCache.has(k)) return true;
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(k) !== null;
          }
          return false;
        };

        // Determine which keys are missing locally or have been updated remotely
        const dirtyKeys: string[] = [];
        for (const r of remoteKeys) {
          if (!r || !r.key || !this.isAppStorageKey(r.key)) continue;
          const localTime = localTimestamps[r.key];
          const isMissing = !hasLocalKey(r.key);
          const isStale = !localTime || localTime !== r.updated_at;
          if (isMissing || isStale) {
            dirtyKeys.push(r.key);
          }
        }

        // If local data is fully up to date, populate result from local storage/cache with 0 extra egress!
        if (dirtyKeys.length === 0) {
          console.log(`[CloudDataService] Delta sync: All ${remoteKeys.length} cloud records are up-to-date locally (0 payload bytes downloaded)!`);
          for (const r of remoteKeys) {
            if (!this.isAppStorageKey(r.key)) continue;
            const val = this.inMemoryCache.get(r.key) ?? (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(r.key) : null);
            if (val !== null && val !== undefined) {
              try {
                result[r.key] = typeof val === 'string' ? JSON.parse(val) : val;
              } catch {
                result[r.key] = val;
              }
            }
          }
          this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
          this.syncState.isOnline = true;
          this.syncState.syncError = null;
          this.notifyStateChange();
          return result;
        }

        // Only fetch the dirty/missing keys from Supabase
        console.log(`[CloudDataService] Delta sync: Fetching ${dirtyKeys.length}/${remoteKeys.length} updated or missing keys...`);
        const { data: dirtyData, error: dataErr } = await supabase
          .from('kps_cloud_store')
          .select('key, data, updated_at')
          .in('key', dirtyKeys);

        if (dataErr) {
          console.warn('[CloudDataService] Error fetching dirty cloud keys:', dataErr.message);
          this.syncState.syncError = dataErr.message;
          return result;
        }

        if (Array.isArray(dirtyData)) {
          this.isHydratingFromCloud = true;
          const updatedTimestamps = { ...localTimestamps };

          for (const item of dirtyData) {
            if (item && item.key && this.isAppStorageKey(item.key)) {
              result[item.key] = item.data;
              this.inMemoryCache.set(item.key, item.data);
              this.inMemoryTimestamps.set(item.key, item.updated_at);
              updatedTimestamps[item.key] = item.updated_at;

              if (typeof window !== 'undefined' && window.localStorage) {
                try {
                  const serialized =
                    typeof item.data === 'string' ? item.data : JSON.stringify(item.data);
                  window.localStorage.setItem(item.key, serialized);
                } catch {
                  // ignore quota
                }
              }
            }
          }

          // Also populate untouched keys from local cache so caller gets complete data map
          for (const r of remoteKeys) {
            if (this.isAppStorageKey(r.key) && !result[r.key]) {
              const val = this.inMemoryCache.get(r.key) ?? (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(r.key) : null);
              if (val !== null && val !== undefined) {
                try {
                  result[r.key] = typeof val === 'string' ? JSON.parse(val) : val;
                } catch {
                  result[r.key] = val;
                }
              }
            }
          }

          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem('kps_cloud_timestamps_v1', JSON.stringify(updatedTimestamps));
            } catch {
              // ignore
            }
          }

          this.isHydratingFromCloud = false;
          this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
          this.syncState.isOnline = true;
          this.syncState.syncError = null;
          this.notifyStateChange();

          console.log(`[CloudDataService] Successfully hydrated ${dirtyData.length} changed records from Supabase Cloud!`);
        }
      }
    } catch (err: any) {
      this.isHydratingFromCloud = false;
      console.warn('[CloudDataService] Exception in fetchAllCloudData:', err);
      this.syncState.syncError = err?.message || String(err);
    }

    return result;
  }

  /**
   * Initialize Global Cloud Sync
   * 1. Hydrates all existing cloud keys from Supabase
   * 2. Sets up automatic background syncing for all localStorage writes
   * 3. Subscribes to Supabase Realtime for instant multi-device updates
   */
  public async initializeCloudSync(): Promise<void> {
    if (this.syncState.isInitialized) return;
    this.syncState.isInitialized = true;

    console.log('[CloudDataService] Initializing Cloud Sync Engine...');

    // 0. Purge any leaked device-local session keys from remote kps_cloud_store to prevent cross-device session bleeding
    if (isSupabaseConfigured) {
      supabase
        .from('kps_cloud_store')
        .delete()
        .in('key', Array.from(CloudDataService.LOCAL_SESSION_KEYS))
        .then(() => {})
        .catch(() => {});
    }

    // 1. Pull all data from Supabase Cloud Store
    await this.fetchAllCloudData();

    // 2. Wrap window.localStorage so NO data is ever stuck solely on local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      this.hookLocalStorageAutoCloudSync();
    }

    // 3. Connect Supabase Realtime channel for multi-device sync
    if (isSupabaseConfigured) {
      this.setupRealtimeSubscription();
    }

    // 4. Dispatch initial sync event so all UI components update their states
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kps-cloud-synced', { detail: { timestamp: Date.now() } }));
    }
  }

  /**
   * Hooks window.localStorage to automatically mirror every write to Supabase
   */
  private hookLocalStorageAutoCloudSync() {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    const originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);

    window.localStorage.setItem = (key: string, value: string) => {
      // Perform normal local write
      originalSetItem(key, value);

      // If this is an application key and not an internal hydration, queue cloud push
      if (!this.isHydratingFromCloud && this.isAppStorageKey(key)) {
        this.queueDebouncedCloudWrite(key, value);
      }
    };

    window.localStorage.removeItem = (key: string) => {
      originalRemoveItem(key);

      if (!this.isHydratingFromCloud && this.isAppStorageKey(key) && isSupabaseConfigured) {
        supabase
          .from('kps_cloud_store')
          .delete()
          .eq('key', key)
          .then(({ error }) => {
            if (error) console.warn(`[CloudDataService] Delete key '${key}' error:`, error.message);
          });
      }
    };
  }

  /**
   * Debounces rapid writes to Supabase (e.g. while typing), guaranteeing cloud persistence
   */
  private queueDebouncedCloudWrite(key: string, rawValue: string) {
    // Skip if unchanged from current in-memory cache to prevent redundant Egress
    const cached = this.inMemoryCache.get(key);
    if (cached !== undefined) {
      try {
        const cachedStr = typeof cached === 'string' ? cached : JSON.stringify(cached);
        if (cachedStr === rawValue) {
          return; // Identical, avoid redundant egress
        }
      } catch {
        // ignore
      }
    }

    let parsedData: any = rawValue;
    try {
      parsedData = JSON.parse(rawValue);
    } catch {
      parsedData = rawValue;
    }

    // Clear existing timer if any
    const existing = this.pendingWriteQueue.get(key);
    if (existing) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(async () => {
      this.pendingWriteQueue.delete(key);
      try {
        await this.saveCloudKey(key, parsedData);
      } catch (err) {
        console.warn(`[CloudDataService] Debounced sync failed for '${key}':`, err);
      }
    }, 1200); // 1200ms debounce to batch rapid updates

    this.pendingWriteQueue.set(key, { data: parsedData, timer });
  }

  /**
   * Listens for Realtime updates from other devices using Supabase
   */
  private setupRealtimeSubscription() {
    try {
      this.realtimeChannel = supabase
        .channel('kps-cloud-store-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kps_cloud_store' },
          (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              if (newRecord && newRecord.key && this.isAppStorageKey(newRecord.key)) {
                const key = newRecord.key;
                const data = newRecord.data;

                // Update timestamp tracking
                if (newRecord.updated_at) {
                  this.setLocalTimestamp(key, newRecord.updated_at);
                }

                // Suppress self-echo if local cache already has identical data
                const cached = this.inMemoryCache.get(key);
                if (cached !== undefined) {
                  try {
                    const cachedStr = typeof cached === 'string' ? cached : JSON.stringify(cached);
                    const incomingStr = typeof data === 'string' ? data : JSON.stringify(data);
                    if (cachedStr === incomingStr) {
                      return;
                    }
                  } catch {
                    // ignore
                  }
                }

                // Update in-memory & localStorage without trigger loop
                this.inMemoryCache.set(key, data);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    this.isHydratingFromCloud = true;
                    window.localStorage.setItem(
                      key,
                      typeof data === 'string' ? data : JSON.stringify(data)
                    );
                  } catch {
                    // ignore
                  } finally {
                    this.isHydratingFromCloud = false;
                  }
                }

                // Notify UI components
                this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
                this.notifyStateChange();

                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('kps-cloud-key-updated', {
                      detail: { key, data, timestamp: newRecord.updated_at },
                    })
                  );
                }
              }
            } else if (eventType === 'DELETE') {
              if (oldRecord && oldRecord.key && this.isAppStorageKey(oldRecord.key)) {
                this.inMemoryCache.delete(oldRecord.key);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    this.isHydratingFromCloud = true;
                    window.localStorage.removeItem(oldRecord.key);
                  } finally {
                    this.isHydratingFromCloud = false;
                  }
                }
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CloudDataService] Multi-device Realtime Sync active!');
          }
        });
    } catch (err) {
      console.warn('[CloudDataService] Realtime subscription error:', err);
    }
  }

  public getRealtimeChannel() {
    return this.realtimeChannel;
  }

  public disconnectRealtime() {
    if (this.realtimeChannel && isSupabaseConfigured) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const cloudDataService = new CloudDataService();
