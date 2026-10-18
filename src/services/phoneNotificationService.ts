// src/services/phoneNotificationService.ts
// Native Phone / System Notification Service (Web Push & Device Notifications)

export interface PhoneNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  url?: string;
  data?: Record<string, any>;
}

const STORAGE_KEY_PHONE_NOTI_ENABLED = 'kps_phone_notification_enabled_v1';
export const PHONE_NOTI_SYNC_EVENT = 'kps-phone-notification-sync';

class PhoneNotificationService {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  isPhoneNotificationEnabled(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY_PHONE_NOTI_ENABLED);
    if (stored === null) {
      // Default enabled if permission already granted
      return this.getPermissionState() === 'granted';
    }
    return stored === 'true';
  }

  setPhoneNotificationEnabled(enabled: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PHONE_NOTI_ENABLED, enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent(PHONE_NOTI_SYNC_EVENT, { detail: { enabled } }));
    }
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.setPhoneNotificationEnabled(true);
        // Ensure Service Worker is registered
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch (swErr) {
            console.warn('[PhoneNotification] Service Worker registration warning:', swErr);
          }
        }
      } else {
        this.setPhoneNotificationEnabled(false);
      }
      return result;
    } catch (err) {
      console.error('[PhoneNotification] Request permission error:', err);
      return this.getPermissionState();
    }
  }

  /**
   * ส่งการแจ้งเตือนตรงไปยังระบบของเครื่องโทรศัพท์ (System / Native Notification)
   * จะแสดงบนแถบ Notification Bar, Status Bar และ Lock Screen ของมือถือ
   */
  async sendNativeNotification(payload: PhoneNotificationPayload): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;
    if (!this.isPhoneNotificationEnabled()) return false;

    const icon = payload.icon || '/pwa-192x192.png';
    const badge = payload.badge || '/pwa-192x192.png';
    const vibrate = payload.vibrate || [200, 100, 200];
    const tag = payload.tag || `kps-${Date.now()}`;
    const url = payload.url || '/';

    // 1. ลองส่งผ่าน Service Worker (แนะนำที่สุดสำหรับมือถือ Android / iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, {
            body: payload.body,
            icon,
            badge,
            vibrate,
            tag,
            renotify: true,
            data: { url, ...payload.data },
          } as any);
          return true;
        }
      } catch (swErr) {
        console.warn('[PhoneNotification] Service Worker notification failed, falling back to window.Notification:', swErr);
      }
    }

    // 2. Fallback: window.Notification constructor
    try {
      const noti = new Notification(payload.title, {
        body: payload.body,
        icon,
        badge,
        tag,
        data: { url, ...payload.data },
      });
      noti.onclick = () => {
        window.focus();
        noti.close();
      };
      return true;
    } catch (err) {
      console.warn('[PhoneNotification] Fallback notification failed:', err);
      return false;
    }
  }

  /**
   * ทดสอบส่งการแจ้งเตือนเข้าเครื่องโทรศัพท์ทันที เพื่อให้ผู้ใช้ตรวจสอบ
   */
  async testNativeNotification(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับ Web Notification API',
      };
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'ยังไม่ได้รับอนุญาตการแจ้งเตือน กรุณากดอนุญาตการแจ้งเตือนในการตั้งค่าของเบราว์เซอร์หรือมือถือ',
        };
      }
    }

    const sent = await this.sendNativeNotification({
      title: '🔔 โรงเรียนกุดจับประชาสรรค์',
      body: 'ทดสอบส่งการแจ้งเตือนระดับเครื่องโทรศัพท์สำเร็จ! ระบบพร้อมแจ้งเตือนงาน การเช็คชื่อ และประวัติข้อมูลแล้ว',
      tag: 'kps-test-push',
      vibrate: [200, 100, 200, 100, 300],
      url: '/',
    });

    return {
      success: sent,
      message: sent
        ? 'ส่งการแจ้งเตือนเข้าเครื่องโทรศัพท์เรียบร้อยแล้ว กรุณาดูที่แถบแจ้งเตือนด้านบนหรือหน้าจอล็อก'
        : 'ไม่สามารถแสดงการแจ้งเตือนได้ กรุณาตรวจสอบการอนุญาตในโทรศัพท์',
    };
  }
}

export const phoneNotificationService = new PhoneNotificationService();
