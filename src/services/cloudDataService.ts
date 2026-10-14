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

  // Filter to determine which keys should be automatically mirrored to Supabase
  private isAppStorageKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    // Exclude internal browser / telemetry / debug flags
    if (
      key.startsWith('__') ||
      key.startsWith('loglevel') ||
      key.includes('test') ||
      key === 'kp_teacher_sidebar_open' ||
      key === 'kp_student_sidebar_open'
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
    if (!isSupabaseConfigured) {
      return this.inMemoryCache.get(key) ?? fallback ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('kps_cloud_store')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.warn(`[CloudDataService] Error fetching key '${key}':`, error.message);
        return this.inMemoryCache.get(key) ?? fallback ?? null;
      }

      if (data && data.data !== undefined) {
        this.inMemoryCache.set(key, data.data);
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

    if (!isSupabaseConfigured) {
      return data;
    }

    try {
      this.syncState.pendingSyncCount++;
      this.notifyStateChange();

      const { error } = await supabase
        .from('kps_cloud_store')
        .upsert({
          key,
          data,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn(`[CloudDataService] Cloud upsert error for '${key}':`, error.message);
        this.syncState.syncError = error.message;
      } else {
        this.syncState.syncError = null;
        this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
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
   * Fetch all cloud keys from Supabase and hydrate local environment
   * (Ensures Device B gets ALL data from Device A!)
   */
  public async fetchAllCloudData(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    if (!isSupabaseConfigured) {
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('kps_cloud_store')
        .select('*');

      if (error) {
        console.warn('[CloudDataService] Error loading all cloud data:', error.message);
        this.syncState.syncError = error.message;
        return result;
      }

      if (Array.isArray(data)) {
        this.isHydratingFromCloud = true;
        for (const item of data) {
          if (item && item.key) {
            result[item.key] = item.data;
            this.inMemoryCache.set(item.key, item.data);

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
        this.isHydratingFromCloud = false;

        this.syncState.lastSyncedAt = new Date().toLocaleTimeString('th-TH');
        this.syncState.isOnline = true;
        this.syncState.syncError = null;
        this.notifyStateChange();

        console.log(`[CloudDataService] Successfully hydrated ${data.length} records from Supabase Cloud!`);
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
    }, 200);

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
              if (newRecord && newRecord.key) {
                const key = newRecord.key;
                const data = newRecord.data;

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
              if (oldRecord && oldRecord.key) {
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
