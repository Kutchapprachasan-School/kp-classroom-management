// src/config/appVersion.ts
// Smart Versioning & Zero-Egress Auto Cache-Bust Engine
// Ensures clients automatically invalidate stale JS/HTML bundles when new versions deploy
// while strictly preserving login session and Neon database timestamps (Zero extra database egress!)

export const APP_VERSION = '2.6.0';
export const APP_RELEASE_DATE = '2026-10-31';
export const APP_RELEASE_TITLE = 'KP Classroom Management v2.6.0';
export const APP_VERSION_STORAGE_KEY = 'kp_app_version';
export const APP_VERSION_UPDATED_AT_KEY = 'kp_app_version_updated_at';

export interface AppVersionInfo {
  version: string;
  releaseDate: string;
  releaseTitle: string;
  isStale: boolean;
  lastUpdated?: string;
}

/**
 * ตรวจสอบสถานะเวอร์ชันปัจจุบันของเครื่องผู้ใช้เทียบกับเวอร์ชันของโค้ดล่าสุด
 */
export function getAppVersionInfo(): AppVersionInfo {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      version: APP_VERSION,
      releaseDate: APP_RELEASE_DATE,
      releaseTitle: APP_RELEASE_TITLE,
      isStale: false,
    };
  }

  const saved = window.localStorage.getItem(APP_VERSION_STORAGE_KEY);
  const lastUpdated = window.localStorage.getItem(APP_VERSION_UPDATED_AT_KEY) || undefined;
  const isStale = Boolean(saved && saved !== APP_VERSION);

  return {
    version: APP_VERSION,
    releaseDate: APP_RELEASE_DATE,
    releaseTitle: APP_RELEASE_TITLE,
    isStale,
    lastUpdated,
  };
}

/**
 * สั่งล้างแคชไฟล์เว็บ (Asset Cache) และ Service Worker โดยคง Session และ Database Timestamps ไว้ 100%
 * เป็นไปตามกฎ Zero-Egress Optimization (ไม่แตะต้อง kps_cloud_timestamps_v1 และ cls_current_auth_user)
 */
export async function performSmartAssetCacheBust(options?: { forceReload?: boolean }): Promise<void> {
  console.log(`[SmartCacheBust] Invalidation triggered for version ${APP_VERSION}...`);

  // 1. ล้าง CacheStorage ของเบราว์เซอร์และ Service Worker
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      console.log(`[SmartCacheBust] Cleared ${cacheNames.length} CacheStorage entries.`);
    } catch (e) {
      console.warn('[SmartCacheBust] CacheStorage clear error:', e);
    }
  }

  // 2. สั่งให้อัปเดต Service Worker (ถ้ามี)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    } catch (e) {
      console.warn('[SmartCacheBust] Service worker update error:', e);
    }
  }

  // 3. บันทึกเลขเวอร์ชันใหม่ลงใน LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
      window.localStorage.setItem(APP_VERSION_UPDATED_AT_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('[SmartCacheBust] Storage version save error:', e);
    }
  }

  // 4. บังคับโหลดหน้าใหม่ดึง Asset ล่าสุดจาก CDN/Server
  if (options?.forceReload !== false && typeof window !== 'undefined') {
    // ป้องกัน hash caching โดยการใส่ query param บังคับ
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.replace(`${cleanUrl}?v=${APP_VERSION}_${Date.now()}`);
  }
}

/**
 * ฟังก์ชันสำหรับรันอัตโนมัติใน main.tsx เมื่อเปิดแอป
 * - หากเป็นเครื่องที่เคยใช้งานเวอร์ชันเดิมอยู่ จะล้างแคชโค้ดเก่าและรีโหลดเป็นเวอร์ชันล่าสุดให้ทันที
 * - หากเป็นผู้ใช้ใหม่ (เพิ่งเปิดครั้งแรก) จะบันทึกเวอร์ชันและทำงานต่อโดยไม่ต้องรีโหลดซ้ำ
 */
export function initVersionGuard(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    const saved = window.localStorage.getItem(APP_VERSION_STORAGE_KEY);
    
    // ผู้ใช้ใหม่เพิ่งเปิดครั้งแรก -> บันทึกเวอร์ชันและไปต่อทันที
    if (!saved) {
      window.localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
      window.localStorage.setItem(APP_VERSION_UPDATED_AT_KEY, new Date().toISOString());
      return false;
    }

    // ผู้ใช้เดิมที่มีเวอร์ชันเก่าไม่ตรงกับ APP_VERSION -> สั่งล้างแคช Asset และรีโหลดทันที
    if (saved !== APP_VERSION) {
      console.log(`[VersionGuard] Version mismatch: client has '${saved}', server is '${APP_VERSION}'. Performing auto cache-bust...`);
      performSmartAssetCacheBust({ forceReload: true });
      return true;
    }
  } catch (err) {
    console.warn('[VersionGuard] Initialization check error:', err);
  }

  return false;
}
