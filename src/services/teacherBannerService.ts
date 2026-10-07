// src/services/teacherBannerService.ts
// บริการจัดการแบนเนอร์หน้าครู 3 ส่วน (Teacher Dashboard 3-Part Banners)
// ข้อกำหนดความปลอดภัย: ปรับแต่งได้เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin: ACADEMIC_ADMIN) เท่านั้น

import type { SchoolUserRole } from '../config/schoolRoles';

export type TeacherBannerKey = 'sidebar' | 'hero' | 'bottom';

export interface TeacherBannerItem {
  id: TeacherBannerKey;
  name: string;
  locationLabel: string;
  dimensionGuide: string;
  defaultUrl: string;
  customUrl: string | null;
  quoteText?: string;
  subText?: string;
  targetLink?: string;
  opacity?: number;        // ความโปร่งแสง 20-100% (ค่าเริ่มต้น 100)
  positionX?: number;      // เลื่อนตำแหน่งแนวนอน -50 ถึง +50% (ค่าเริ่มต้น 0)
  positionY?: number;      // เลื่อนตำแหน่งแนวตั้ง -50 ถึง +50% (ค่าเริ่มต้น 0)
  scale?: number;          // ย่อ/ขยายสัดส่วน 80 ถึง 150% (ค่าเริ่มต้น 100)
  showQuote?: boolean;     // แสดงบอลลูนคำพูดคำคม (ค่าเริ่มต้น true)
  updatedAt?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'kps_teacher_banners_v1';
export const TEACHER_BANNERS_EVENT = 'kps-teacher-banners-updated';

export const DEFAULT_TEACHER_BANNERS: Record<TeacherBannerKey, TeacherBannerItem> = {
  sidebar: {
    id: 'sidebar',
    name: 'แบนเนอร์เมนูข้าง (Sidebar Banner)',
    locationLabel: 'ด้านล่างเมนูนำทางฝั่งซ้าย (Sidebar Card)',
    dimensionGuide: 'แนะนำขนาด 300 × 200 px (สัดส่วน ~1.5:1)',
    defaultUrl: '/images/teacher/sidebar_banner.png',
    customUrl: null,
    quoteText: 'สอนภาษาญี่ปุ่น',
    subText: 'เรียนรู้ เข้าใจ ใช้ได้จริง',
    opacity: 100,
    positionX: 0,
    positionY: 0,
    scale: 100,
    showQuote: true,
    updatedAt: '2 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ผู้ดูแลระบบฝ่ายวิชาการ',
  },
  hero: {
    id: 'hero',
    name: 'แบนเนอร์หลักด้านบน (Hero Banner)',
    locationLabel: 'ส่วนบนกึ่งกลางหน้าแดชบอร์ดของครู (Main Hero)',
    dimensionGuide: 'ขนาดมาตรฐานที่แนะนำ: 1200 × 260 px (สัดส่วน ~4.6:1)',
    defaultUrl: '/images/teacher/hero_banner_anime.png',
    customUrl: null,
    quoteText: '“การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น นะคะ ♡”',
    subText: 'ร่วมสร้างอนาคตที่ดีกว่าไปด้วยกัน',
    opacity: 100,
    positionX: 0,
    positionY: 0,
    scale: 100,
    showQuote: true,
    updatedAt: '2 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ผู้ดูแลระบบฝ่ายวิชาการ',
  },
  bottom: {
    id: 'bottom',
    name: 'แบนเนอร์แนวนอนด้านล่าง (Bottom Banner)',
    locationLabel: 'ด้านล่างตารางสอนวันนี้ (Inspirational Bottom Banner)',
    dimensionGuide: 'แนะนำขนาด 1100 × 140 px หรือ 1200 × 160 px (สัดส่วน ~8:1)',
    defaultUrl: '/images/teacher/bottom_banner.png',
    customUrl: null,
    quoteText: '“ ภาษา...คือกุญแจสู่โลกกว้าง ”',
    subText: 'สอนวันนี้ เพื่ออนาคตที่ดีกว่าของพวกเขา',
    opacity: 100,
    positionX: 0,
    positionY: 0,
    scale: 100,
    showQuote: true,
    updatedAt: '2 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ผู้ดูแลระบบฝ่ายวิชาการ',
  },
};

export const teacherBannerService = {
  /**
   * ตรวจสอบสิทธิ์ว่าผู้ใช้งานสามารถอัปโหลดหรือแก้ไขแบนเนอร์ได้หรือไม่
   * ต้องเป็นแอดมินฝ่ายวิชาการ (ACADEMIC_ADMIN) หรือ ADMIN เท่านั้น
   */
  canManageBanners(role?: SchoolUserRole | string): boolean {
    return role === 'ACADEMIC_ADMIN' || role === 'ADMIN';
  },

  /**
   * ดึงข้อมูลแบนเนอร์ทั้ง 3 ส่วน
   */
  getBanners(): Record<TeacherBannerKey, TeacherBannerItem> {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_TEACHER_BANNERS };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_TEACHER_BANNERS };
      const parsed = JSON.parse(raw) as Partial<Record<TeacherBannerKey, TeacherBannerItem>>;
      return {
        sidebar: { ...DEFAULT_TEACHER_BANNERS.sidebar, ...(parsed.sidebar || {}) },
        hero: { ...DEFAULT_TEACHER_BANNERS.hero, ...(parsed.hero || {}) },
        bottom: { ...DEFAULT_TEACHER_BANNERS.bottom, ...(parsed.bottom || {}) },
      };
    } catch {
      return { ...DEFAULT_TEACHER_BANNERS };
    }
  },

  /**
   * ดึงแบนเนอร์เฉพาะส่วน พร้อม fallback url
   */
  getEffectiveBannerUrl(key: TeacherBannerKey): string {
    const banners = this.getBanners();
    const item = banners[key];
    return item?.customUrl?.trim() || item?.defaultUrl || DEFAULT_TEACHER_BANNERS[key].defaultUrl;
  },

  /**
   * ดึงข้อมูล item แบนเนอร์ฉบับพร้อมใช้งาน
   */
  getEffectiveBanner(key: TeacherBannerKey): TeacherBannerItem {
    const banners = this.getBanners();
    const item = banners[key] || DEFAULT_TEACHER_BANNERS[key];
    return {
      ...item,
      customUrl: item.customUrl?.trim() || null,
    };
  },

  /**
   * บันทึกหรืออัปโหลดแบนเนอร์ใหม่ (จำกัดสิทธิ์เฉพาะ ACADEMIC_ADMIN / ADMIN เท่านั้น)
   */
  updateBanner(
    key: TeacherBannerKey,
    updates: Partial<TeacherBannerItem>,
    role?: SchoolUserRole | string,
    uploaderName: string = 'ผู้ดูแลระบบฝ่ายวิชาการ'
  ): { success: boolean; message: string; data?: TeacherBannerItem } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้นที่สามารถอัปโหลดแบนเนอร์ได้',
      };
    }

    const current = this.getBanners();
    const target = current[key] || DEFAULT_TEACHER_BANNERS[key];

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} • ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

    const updatedItem: TeacherBannerItem = {
      ...target,
      ...updates,
      updatedAt: formattedDate,
      updatedBy: uploaderName,
    };

    current[key] = updatedItem;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(TEACHER_BANNERS_EVENT, { detail: current }));
      } catch (err) {
        console.error('Failed to save teacher banner to localStorage:', err);
        return {
          success: false,
          message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล (ขนาดไฟล์ภาพอาจใหญ่เกินขีดจำกัดเบราว์เซอร์)',
        };
      }
    }

    return {
      success: true,
      message: `อัปเดต ${updatedItem.name} เรียบร้อยแล้ว`,
      data: updatedItem,
    };
  },

  /**
   * รีเซ็ตแบนเนอร์ 1 จุดกลับเป็นรูปภาพเริ่มต้น (เฉพาะ Admin)
   */
  resetBanner(
    key: TeacherBannerKey,
    role?: SchoolUserRole | string
  ): { success: boolean; message: string } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้น',
      };
    }

    const current = this.getBanners();
    current[key] = { ...DEFAULT_TEACHER_BANNERS[key] };

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(TEACHER_BANNERS_EVENT, { detail: current }));
      } catch (err) {
        console.error('Failed to reset teacher banner:', err);
      }
    }

    return {
      success: true,
      message: `คืนค่าเริ่มต้นของ ${DEFAULT_TEACHER_BANNERS[key].name} เรียบร้อยแล้ว`,
    };
  },

  /**
   * คืนค่าเริ่มต้นแบนเนอร์ทั้งหมดทั้ง 3 จุด (เฉพาะ Admin)
   */
  resetAllBanners(role?: SchoolUserRole | string): { success: boolean; message: string } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้น',
      };
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(
          new CustomEvent(TEACHER_BANNERS_EVENT, { detail: DEFAULT_TEACHER_BANNERS })
        );
      } catch (err) {
        console.error('Failed to reset all teacher banners:', err);
      }
    }

    return {
      success: true,
      message: 'คืนค่าแบนเนอร์เริ่มต้นครบทั้ง 3 ส่วนเรียบร้อยแล้ว',
    };
  },

  /**
   * บีบอัดรูปภาพก่อนบันทึกลง Base64 ป้องกัน LocalStorage เกินขีดจำกัด
   */
  async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 400,
    quality: number = 0.85
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อบีบอัดได้'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  },
};
