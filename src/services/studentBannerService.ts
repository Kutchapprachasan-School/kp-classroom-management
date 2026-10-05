// src/services/studentBannerService.ts
// บริการจัดการแบนเนอร์หน้านักเรียน 3 ส่วน (Student Dashboard 3-Part Banners)
// ข้อกำหนดความปลอดภัย: ปรับแต่งได้เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin: ACADEMIC_ADMIN) เท่านั้น

import type { SchoolUserRole } from '../config/schoolRoles';

export type StudentBannerKey = 'sidebar' | 'hero' | 'bottom';

export interface StudentBannerItem {
  id: StudentBannerKey;
  name: string;
  locationLabel: string;
  dimensionGuide: string;
  defaultUrl: string;
  customUrl: string | null;
  quoteText?: string;
  subText?: string;
  targetLink?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'kps_student_banners_v1';
export const STUDENT_BANNERS_EVENT = 'kps-student-banners-updated';

export const DEFAULT_STUDENT_BANNERS: Record<StudentBannerKey, StudentBannerItem> = {
  sidebar: {
    id: 'sidebar',
    name: 'แบนเนอร์เมนูด้านข้าง (Sidebar)',
    locationLabel: 'ด้านล่างเมนูนำทางฝั่งซ้าย (Sidebar Card)',
    dimensionGuide: 'แนะนำขนาด 320 × 270 px (สัดส่วน ~1.2:1)',
    defaultUrl: '/images/banners/sidebar-banner.png',
    customUrl: null,
    quoteText: 'สู้ๆ นะ! ทุกก้าวของเธอ มีความหมาย เราเชื่อในตัวเธอ',
    subText: 'กำลังใจจากคุณครูและโรงเรียน',
    updatedAt: '1 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ระบบจัดการชั้นเรียน',
  },
  hero: {
    id: 'hero',
    name: 'แบนเนอร์หลักด้านบน (Hero Banner)',
    locationLabel: 'ส่วนหัวกึ่งกลางหน้าแรกของนักเรียน (Main Hero)',
    dimensionGuide: 'แนะนำขนาด 1112 × 272 px หรือ 1200 × 300 px (สัดส่วน ~4:1)',
    defaultUrl: '/images/banners/hero-banner.png',
    customUrl: null,
    quoteText: '“ เรียนรู้วันนี้ เพื่ออนาคตที่ดีกว่า ”',
    subText: 'สร้างทักษะ สร้างโอกาส สู่โลกกว้าง',
    updatedAt: '1 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ระบบจัดการชั้นเรียน',
  },
  bottom: {
    id: 'bottom',
    name: 'แบนเนอร์มุมขวาล่าง (Right Bottom Banner)',
    locationLabel: 'ด้านล่างคอลัมน์ขวา ใต้เมนูด่วน (Motivational Quote)',
    dimensionGuide: 'แนะนำขนาด 520 × 116 px หรือ 600 × 130 px (สัดส่วน ~4.5:1)',
    defaultUrl: '/images/banners/bottom-banner.png',
    customUrl: null,
    quoteText: '“ ค่อยๆ ก้าวไป แล้วเธอจะเก่งขึ้นในทุกๆ วัน ”',
    subText: 'ข้อคิดและพลังบวกประจำวัน',
    updatedAt: '1 ต.ค. 2569 • ค่าเริ่มต้นจากระบบ',
    updatedBy: 'ระบบจัดการชั้นเรียน',
  },
};

export const studentBannerService = {
  /**
   * ตรวจสอบสิทธิ์ว่าผู้ใช้งานสามารถอัปโหลดหรือแก้ไขแบนเนอร์ได้หรือไม่
   * ต้องเป็นแอดมินฝ่ายวิชาการ (ACADEMIC_ADMIN) เท่านั้น
   */
  canManageBanners(role?: SchoolUserRole | string): boolean {
    return role === 'ACADEMIC_ADMIN';
  },

  /**
   * ดึงข้อมูลแบนเนอร์ทั้ง 3 ส่วน
   */
  getBanners(): Record<StudentBannerKey, StudentBannerItem> {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_STUDENT_BANNERS };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STUDENT_BANNERS };
      const parsed = JSON.parse(raw) as Partial<Record<StudentBannerKey, StudentBannerItem>>;
      return {
        sidebar: { ...DEFAULT_STUDENT_BANNERS.sidebar, ...(parsed.sidebar || {}) },
        hero: { ...DEFAULT_STUDENT_BANNERS.hero, ...(parsed.hero || {}) },
        bottom: { ...DEFAULT_STUDENT_BANNERS.bottom, ...(parsed.bottom || {}) },
      };
    } catch {
      return { ...DEFAULT_STUDENT_BANNERS };
    }
  },

  /**
   * ดึงแบนเนอร์เฉพาะส่วน พร้อม fallback url
   */
  getEffectiveBannerUrl(key: StudentBannerKey): string {
    const banners = this.getBanners();
    const item = banners[key];
    return item?.customUrl?.trim() || item?.defaultUrl || DEFAULT_STUDENT_BANNERS[key].defaultUrl;
  },

  /**
   * บันทึกหรืออัปโหลดแบนเนอร์ใหม่ (จำกัดสิทธิ์เฉพาะ ACADEMIC_ADMIN เท่านั้น)
   */
  updateBanner(
    key: StudentBannerKey,
    updates: Partial<StudentBannerItem>,
    role?: SchoolUserRole | string,
    uploaderName: string = 'ผู้ดูแลระบบฝ่ายวิชาการ'
  ): { success: boolean; message: string; data?: StudentBannerItem } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้นที่สามารถอัปโหลดแบนเนอร์ได้',
      };
    }

    const current = this.getBanners();
    const target = current[key] || DEFAULT_STUDENT_BANNERS[key];

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} • ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

    const updatedItem: StudentBannerItem = {
      ...target,
      ...updates,
      updatedAt: formattedDate,
      updatedBy: uploaderName,
    };

    current[key] = updatedItem;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(STUDENT_BANNERS_EVENT, { detail: current }));
      } catch (err) {
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
    key: StudentBannerKey,
    role?: SchoolUserRole | string
  ): { success: boolean; message: string } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้นที่สามารถรีเซ็ตแบนเนอร์ได้',
      };
    }

    const current = this.getBanners();
    current[key] = {
      ...DEFAULT_STUDENT_BANNERS[key],
      customUrl: null,
      updatedAt: 'รีเซ็ตเป็นค่าเริ่มต้นแล้ว',
      updatedBy: 'Admin',
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent(STUDENT_BANNERS_EVENT, { detail: current }));
    }

    return {
      success: true,
      message: `รีเซ็ต ${DEFAULT_STUDENT_BANNERS[key].name} กลับสู่ค่าเริ่มต้นแล้ว`,
    };
  },

  /**
   * รีเซ็ตแบนเนอร์ทั้งหมด 3 ส่วน (เฉพาะ Admin)
   */
  resetAllBanners(role?: SchoolUserRole | string): { success: boolean; message: string } {
    if (!this.canManageBanners(role)) {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้น',
      };
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent(STUDENT_BANNERS_EVENT, { detail: DEFAULT_STUDENT_BANNERS })
      );
    }

    return {
      success: true,
      message: 'รีเซ็ตแบนเนอร์ทั้ง 3 ส่วนกลับสู่ภาพเริ่มต้นเรียบร้อยแล้ว',
    };
  },

  /**
   * ฟังก์ชันช่วยบีบอัดภาพก่อนเก็บใน localStorage ป้องกัน quota exceeded
   */
  compressImage(file: File, maxWidth: number = 1200, maxHeight: number = 400, quality: number = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // คำนวณสัดส่วน
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
