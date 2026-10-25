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
    let payloadToSave: any = data;

    try {
      this.syncState.pendingSyncCount++;
      this.notifyStateChange();

      // Anti-clobbering merge for multi-device submission & grading queues
      if (
        (key === 'kp_work_submissions_v2' || key === 'kp_grading_queue_v2') &&
        Array.isArray(data)
      ) {
        try {
          const { data: remoteRow } = await supabase
            .from('kps_cloud_store')
            .select('data')
            .eq('key', key)
            .maybeSingle();

          if (remoteRow && Array.isArray(remoteRow.data) && remoteRow.data.length > 0) {
            let activeAsgIds: Set<string> | null = null;
            try {
              const rawAsgs =
                this.inMemoryCache.get('kp_term_assignments_v2') ??
                (typeof window !== 'undefined' ? window.localStorage?.getItem('kp_term_assignments_v2') : null);
              const parsedAsgs = typeof rawAsgs === 'string' ? JSON.parse(rawAsgs) : rawAsgs;
              if (Array.isArray(parsedAsgs) && parsedAsgs.length > 0) {
                activeAsgIds = new Set<string>();
                parsedAsgs.forEach((a: any) => {
                  if (a?.id) activeAsgIds!.add(String(a.id));
                  if (a?.unitId) activeAsgIds!.add(String(a.unitId));
                });
              }
            } catch {
              // ignore
            }

            const mergedMap = new Map<string, any>();
            for (const rem of remoteRow.data) {
              if (!rem || !rem.studentCode) continue;
              if (activeAsgIds && rem.assignmentId && !activeAsgIds.has(String(rem.assignmentId))) {
                continue;
              }
              const pKey = `${rem.assignmentId || ''}_${String(rem.studentCode).trim()}`;
              mergedMap.set(pKey, rem);
            }

            for (const loc of data as any[]) {
              if (!loc || !loc.studentCode) continue;
              const pKey = `${loc.assignmentId || ''}_${String(loc.studentCode).trim()}`;
              const prev = mergedMap.get(pKey);
              if (prev) {
                mergedMap.set(pKey, {
                  ...prev,
                  ...loc,
                  id: loc.id || prev.id,
                  classroom: loc.classroom || prev.classroom,
                  studentName: loc.studentName || prev.studentName,
                  courseCode: loc.courseCode || prev.courseCode,
                  subjectCode: loc.subjectCode || prev.subjectCode,
                  fileUrl: loc.fileUrl || prev.fileUrl,
                  filePreviewUrl: loc.filePreviewUrl || prev.filePreviewUrl || loc.fileUrl || prev.fileUrl,
                  r2ObjectKey: loc.r2ObjectKey || prev.r2ObjectKey,
                  externalLinkUrl: loc.externalLinkUrl || prev.externalLinkUrl,
                  textContent: loc.textContent || prev.textContent,
                });
              } else {
                mergedMap.set(pKey, loc);
              }
            }

            payloadToSave = Array.from(mergedMap.values());
            this.inMemoryCache.set(key, payloadToSave);
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                this.isHydratingFromCloud = true;
                window.localStorage.setItem(key, JSON.stringify(payloadToSave));
              } finally {
                this.isHydratingFromCloud = false;
              }
            }
          }
        } catch {
          // fallback to local data if remote fetch fails
        }
      }

      const upsertPromise = supabase
        .from('kps_cloud_store')
        .upsert({
          key,
          data: payloadToSave,
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

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  category?: 'image' | 'document' | 'media' | 'archive';
}

// ตั้งค่าขนาดไฟล์สูงสุดที่อนุญาต (Client-side & Server-side Safeguard)
export const MAX_IMAGE_SIZE_MB = 15;
export const MAX_DOC_SIZE_MB = 25;
export const MAX_MEDIA_SIZE_MB = 50;

// นามสกุลและ MIME Type ที่อนุญาตสำหรับงานนักเรียน (รองรับทุกประเภทไฟล์การเรียนการสอน)
export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.heic',
  '.heif',
  '.bmp',
  '.avif',
];

export const ALLOWED_DOC_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.txt',
  '.csv',
  '.rtf',
  '.md',
  '.json',
  '.xml',
  '.html',
  '.py',
  '.js',
  '.ts',
  '.c',
  '.cpp',
  '.java',
  '.ipynb',
];

export const ALLOWED_MEDIA_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
];

export const ALLOWED_ARCHIVE_EXTENSIONS = [
  '.zip',
  '.rar',
  '.7z',
  '.psd',
  '.ai',
  '.eps',
];

const BLOCKED_EXECUTABLE_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.msi',
  '.scr',
  '.vbs',
  '.ps1',
  '.sh',
  '.com',
  '.dll',
  '.apk',
];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/html',
  'application/json',
  'application/rtf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/octet-stream',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
];

/**
 * ทำความสะอาดชื่อไฟล์ ลบช่องว่างและอักขระพิเศษ แต่เก็บภาษาไทย ตัวเลข และจุดนามสกุลไฟล์ไว้
 */
export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : '';
  const baseName = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;

  // แทนที่ช่องว่างด้วย _ และลบอักขระพิเศษที่อาจทำให้ URL มีปัญหา
  const cleanBase = baseName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9ก-๙_\-]/g, '');

  return `${cleanBase || 'submission'}${ext}`;
}

export interface ImageCompressionOptions {
  maxWidthOrHeight?: number; // ความกว้างหรือสูงสูงสุด (ค่าเริ่มต้น 1920px เหมาะสำหรับตรวจใบงาน)
  quality?: number;          // คุณภาพ 0.1 - 1.0 (ค่าเริ่มต้น 0.82 คมชัดและไฟล์เล็ก)
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

/**
 * บีบอัดรูปภาพและแปลงเป็นไฟล์ .webp อัตโนมัติด้วย HTML5 Canvas ฝั่ง Frontend
 * ช่วยลดขนาดไฟล์ภาพถ่าย 4-8 MB เหลือเพียง ~150-400 KB โดยที่ตัวหนังสือยังคมชัด
 * หากไม่ใช่ไฟล์รูปภาพทั่วไป (เช่น PDF, Word, GIF, SVG) จะคืนค่าไฟล์เดิมกลับไปทันที
 */
export async function compressImageToWebP(
  inputFile: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const maxDimension = options.maxWidthOrHeight ?? 1920;
  const quality = options.quality ?? 0.82;

  // 1. ตรวจสอบสภาพแวดล้อมและประเภทไฟล์ (ข้าม GIF และ SVG เพื่อรักษา Animation / Vector)
  const lowerName = inputFile.name.toLowerCase();
  const isAnimatedOrVector =
    lowerName.endsWith('.gif') ||
    lowerName.endsWith('.svg') ||
    inputFile.type === 'image/gif' ||
    inputFile.type === 'image/svg+xml';
  const isImageMime = inputFile.type.startsWith('image/') && !isAnimatedOrVector;
  const isImageExt =
    !isAnimatedOrVector && ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (typeof window === 'undefined' || typeof document === 'undefined' || (!isImageMime && !isImageExt)) {
    return {
      file: inputFile,
      originalSize: inputFile.size,
      compressedSize: inputFile.size,
      wasCompressed: false,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(inputFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // 2. คำนวณสัดส่วนภาพใหม่หากด้านใดด้านหนึ่งเกิน 1920px (รักษาสัดส่วนภาพเดิม)
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // 3. วาดภาพลงบน Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          file: inputFile,
          originalSize: inputFile.size,
          compressedSize: inputFile.size,
          wasCompressed: false,
        });
        return;
      }

      // เติมพื้นหลังสีขาวเผื่อกรณีนักเรียนส่งไฟล์ PNG พื้นหลังโปร่งใส
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // 4. แปลง Canvas เป็น Blob ชนิด image/webp
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file: inputFile,
              originalSize: inputFile.size,
              compressedSize: inputFile.size,
              wasCompressed: false,
            });
            return;
          }

          // เปลี่ยนนามสกุลไฟล์เดิมเป็น .webp
          const lastDot = inputFile.name.lastIndexOf('.');
          const baseName = lastDot !== -1 ? inputFile.name.slice(0, lastDot) : inputFile.name;
          const webpFileName = `${baseName}.webp`;

          const compressedFile = new File([blob], webpFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          // กรณีไฟล์ที่ย่อแล้วมีขนาดเล็กลงจริง ให้ใช้ไฟล์ WebP ที่ย่อแล้ว
          const isSmaller = compressedFile.size < inputFile.size;
          const finalFile = isSmaller ? compressedFile : inputFile;

          resolve({
            file: finalFile,
            originalSize: inputFile.size,
            compressedSize: finalFile.size,
            wasCompressed: isSmaller,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file: inputFile,
        originalSize: inputFile.size,
        compressedSize: inputFile.size,
        wasCompressed: false,
      });
    };

    img.src = objectUrl;
  });
}

/**
 * ตรวจสอบความถูกต้องของไฟล์งานนักเรียนก่อนอัปโหลดขึ้น R2
 */
export function validateSubmissionFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'กรุณาเลือกไฟล์ที่ต้องการส่ง' };
  }

  // 1. ตรวจสอบไฟล์เสียหรือไฟล์ว่าง (0 Bytes)
  if (file.size === 0) {
    return { valid: false, error: 'ไฟล์ที่เลือกไม่มีข้อมูล (ขนาด 0 KB) กรุณาเลือกไฟล์ใหม่' };
  }

  // 2. ดึงนามสกุลไฟล์มาตรวจสอบ
  const lastDot = file.name.lastIndexOf('.');
  const ext = lastDot !== -1 ? file.name.slice(lastDot).toLowerCase() : '';

  if (BLOCKED_EXECUTABLE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `ไม่อนุญาตให้อัปโหลดไฟล์โปรแกรมหรือสคริปต์นามสกุล "${ext}" เพื่อความปลอดภัยของระบบ`,
    };
  }

  const isImageExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) || file.type.startsWith('image/');
  const isDocExt = ALLOWED_DOC_EXTENSIONS.includes(ext) || file.type === 'application/pdf' || file.type.startsWith('text/');
  const isMediaExt = ALLOWED_MEDIA_EXTENSIONS.includes(ext) || file.type.startsWith('video/') || file.type.startsWith('audio/');
  const isArchiveExt = ALLOWED_ARCHIVE_EXTENSIONS.includes(ext);

  if (!isImageExt && !isDocExt && !isMediaExt && !isArchiveExt) {
    return {
      valid: false,
      error: `ไม่รองรับไฟล์นามสกุล "${ext || 'ไม่ทราบชนิด'}" (รองรับรูปภาพ, PDF, Word, Excel, PowerPoint, วิดีโอ, เสียง และ ZIP)`,
    };
  }

  // 3. ตรวจสอบ MIME Type ป้องกันการเปลี่ยนนามสกุลไฟล์หลอก (เช่น เอาไฟล์ .exe มาเปลี่ยนชื่อเป็น .jpg)
  if (
    file.type &&
    (file.type.includes('x-msdownload') ||
      file.type.includes('x-executable') ||
      file.type.includes('x-dosexec'))
  ) {
    return {
      valid: false,
      error: `รูปแบบข้อมูลของไฟล์ (${file.type}) ไม่ปลอดภัย`,
    };
  }

  // 4. ตรวจสอบขนาดไฟล์ตามประเภท
  const fileSizeMB = file.size / (1024 * 1024);

  if (isImageExt && fileSizeMB > MAX_IMAGE_SIZE_MB) {
    return {
      valid: false,
      error: `ไฟล์รูปภาพมีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)} MB) กรุณาใช้รูปภาพขนาดไม่เกิน ${MAX_IMAGE_SIZE_MB} MB`,
    };
  }

  if (isDocExt && fileSizeMB > MAX_DOC_SIZE_MB) {
    return {
      valid: false,
      error: `ไฟล์เอกสารมีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)} MB) กรุณาใช้ไฟล์ขนาดไม่เกิน ${MAX_DOC_SIZE_MB} MB`,
    };
  }

  if ((isMediaExt || isArchiveExt) && fileSizeMB > MAX_MEDIA_SIZE_MB) {
    return {
      valid: false,
      error: `ไฟล์สื่อ/แฟ้มบีบอัดมีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)} MB) กรุณาใช้ไฟล์ขนาดไม่เกิน ${MAX_MEDIA_SIZE_MB} MB หรือแนบเป็นลิงก์ Google Drive แทน`,
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFileName(file.name),
    category: isImageExt
      ? 'image'
      : isMediaExt
        ? 'media'
        : isArchiveExt
          ? 'archive'
          : 'document',
  };
}

export interface UploadProgressInfo {
  percent: number;      // เปอร์เซ็นต์ 0 - 100
  loadedBytes: number;  // จำนวนไบต์ที่ส่งไปแล้ว
  totalBytes: number;   // ขนาดไฟล์ทั้งหมด
}

/**
 * อัปโหลดไฟล์เดียวขึ้น Cloudflare R2 พร้อมติดตามเปอร์เซ็นต์แบบเรียลไทม์ (XMLHttpRequest)
 */
export function uploadToR2WithProgress(
  r2Key: string,
  file: File | Blob,
  onProgress?: (info: UploadProgressInfo) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const workerUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_WORKER_URL) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_worker_url')) ||
      'https://kps-r2-storage.kps-school.workers.dev'
    )?.replace(/\/+$/, '');

    const publicUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_PUBLIC_URL) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_public_url')) ||
      workerUrl
    )?.replace(/\/+$/, '');

    const uploadSecret = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_UPLOAD_SECRET) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_upload_secret')) ||
      'KP_school'
    );

    if (!workerUrl || !uploadSecret) {
      reject(new Error('ยังไม่ได้ตั้งค่า VITE_R2_WORKER_URL หรือ VITE_R2_UPLOAD_SECRET'));
      return;
    }

    let cleanKey = r2Key
      .trim()
      .replace(/^r2:\/\//i, '')
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^\/+/, '');

    // ป้องกันการ Encode ซ้ำซ้อน (%25E0%25B8...)
    for (let i = 0; i < 4; i++) {
      if (!/%[0-9A-Fa-f]{2}/.test(cleanKey)) break;
      try {
        const dec = decodeURIComponent(cleanKey);
        if (dec === cleanKey) break;
        cleanKey = dec;
      } catch {
        break;
      }
    }

    const encodedKey = encodeURI(cleanKey).replace(/#/g, '%23').replace(/\?/g, '%3F');

    // รองรับสภาพแวดล้อม Node/Test ที่ไม่มี XMLHttpRequest
    if (typeof XMLHttpRequest === 'undefined') {
      fetch(`${workerUrl}/${encodedKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Custom-Auth-Key': uploadSecret,
        },
        body: file,
      })
        .then(async (res) => {
          if (res.ok) {
            if (onProgress) {
              onProgress({ percent: 100, loadedBytes: file.size, totalBytes: file.size });
            }
            resolve(`${publicUrl}/${encodedKey}`);
          } else {
            reject(new Error(`อัปโหลดไม่สำเร็จ (รหัส ${res.status}): ${await res.text()}`));
          }
        })
        .catch(() => reject(new Error('การเชื่อมต่อขัดข้อง กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง')));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${workerUrl}/${encodedKey}`, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-Custom-Auth-Key', uploadSecret);

    // ดักจับความคืบหน้าขณะส่งข้อมูลขาขึ้น (Upload)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress({
          percent,
          loadedBytes: event.loaded,
          totalBytes: event.total,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // คืนค่าลิงก์จริงสำหรับให้ครูเปิดดูข้ามเครื่อง
        resolve(`${publicUrl}/${encodedKey}`);
      } else {
        reject(new Error(`อัปโหลดไม่สำเร็จ (รหัส ${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('การเชื่อมต่อขัดข้อง กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง'));
    };

    xhr.send(file);
  });
}

/**
 * กรณีนักเรียนแนบหลายไฟล์ในงานเดียว คำนวณเปอร์เซ็นต์รวมทุกไฟล์
 */
export async function uploadMultipleFilesWithProgress(
  items: { r2Key: string; file: File | Blob }[],
  onTotalProgress?: (percent: number, currentFileIndex: number, totalFiles: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  const totalFiles = items.length;

  for (let i = 0; i < totalFiles; i++) {
    const { r2Key, file } = items[i];
    const url = await uploadToR2WithProgress(r2Key, file, ({ percent }) => {
      if (onTotalProgress) {
        // คำนวณเปอร์เซ็นต์เฉลี่ยรวมทุกไฟล์
        const overallPercent = Math.round((i * 100 + percent) / totalFiles);
        onTotalProgress(overallPercent, i + 1, totalFiles);
      }
    });
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}

