// src/services/r2StorageService.ts
// Cloudflare R2 Object Storage Client for Student Submissions & School Documents
// Follows Pillar 6: R2-Only Storage for All Assets & Documents

import { uploadToR2WithProgress, type UploadProgressInfo } from './cloudDataService';

export type { UploadProgressInfo };

let runtimeConfig: { workerUrl?: string; publicUrl?: string; uploadSecret?: string } = {};

const getEnvObj = (): Record<string, any> => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
    return (globalThis as any).process.env;
  }
  return {};
};

export interface R2UploadResult {
  success: boolean;
  key: string;
  url: string;
  sizeKb?: number;
  error?: string;
}

export const r2StorageService = {
  configure(config: { workerUrl?: string; publicUrl?: string; uploadSecret?: string }) {
    runtimeConfig = { ...runtimeConfig, ...config };
  },

  resetConfig() {
    runtimeConfig = {};
  },

  getWorkerUrl(): string {
    if (runtimeConfig.workerUrl !== undefined) {
      return runtimeConfig.workerUrl.trim().replace(/\/+$/, '');
    }
    const env = getEnvObj();
    const val =
      env.VITE_R2_WORKER_URL ||
      (typeof process !== 'undefined' && process.env?.VITE_R2_WORKER_URL) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_worker_url')) ||
      'https://kps-r2-storage.kps-school.workers.dev';
    return String(val).trim().replace(/\/+$/, '');
  },

  getPublicUrl(): string {
    if (runtimeConfig.publicUrl !== undefined) {
      return runtimeConfig.publicUrl.trim().replace(/\/+$/, '');
    }
    const env = getEnvObj();
    const pub =
      env.VITE_R2_PUBLIC_URL ||
      (typeof process !== 'undefined' && process.env?.VITE_R2_PUBLIC_URL) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_public_url')) ||
      '';
    if (pub && String(pub).trim()) {
      return String(pub).trim().replace(/\/+$/, '');
    }
    return this.getWorkerUrl();
  },

  getUploadSecret(): string {
    if (runtimeConfig.uploadSecret !== undefined) {
      return runtimeConfig.uploadSecret.trim();
    }
    const env = getEnvObj();
    const val =
      env.VITE_R2_UPLOAD_SECRET ||
      (typeof process !== 'undefined' && process.env?.VITE_R2_UPLOAD_SECRET) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('kp_r2_upload_secret')) ||
      'KP_school';
    return String(val).trim();
  },

  isConfigured(): boolean {
    return Boolean(this.getWorkerUrl() && this.getUploadSecret());
  },

  /**
   * ถอดรหัส URL / R2 Key ที่อาจถูก encode ซ้ำซ้อน (%25E0%25B8...) ให้กลับมาเป็น UTF-8 Object Key ที่สะอาดเสมอ
   */
  normalizeObjectKey(rawUrlOrKey: string): string {
    if (!rawUrlOrKey) return '';
    let cleaned = rawUrlOrKey
      .trim()
      .replace(/^r2:\/\//i, '')
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^\/+/, '');

    // ถอดรหัสซ้ำสูงสุด 4 รอบ เพื่อแก้ปัญหา Double/Triple URL Encoding (%25E0%25B8... -> ภาษาไทยปกติ)
    for (let i = 0; i < 4; i++) {
      if (!/%[0-9A-Fa-f]{2}/.test(cleaned)) break;
      try {
        const decoded = decodeURIComponent(cleaned);
        if (decoded === cleaned) break;
        cleaned = decoded;
      } catch {
        try {
          const decodedUri = decodeURI(cleaned);
          if (decodedUri === cleaned) break;
          cleaned = decodedUri;
        } catch {
          break;
        }
      }
    }

    return cleaned.replace(/^\/+/, '');
  },

  /**
   * เข้ารหัส Object Key สำหรับใช้ใน HTTP URL เพียง 1 ครั้งอย่างปลอดภัย (รองรับภาษาไทย ช่องว่าง และอักขระ # ?)
   */
  encodeObjectKeyForUrl(rawKey: string): string {
    const normalized = this.normalizeObjectKey(rawKey);
    if (!normalized) return '';
    return encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F');
  },

  /**
   * ตรวจสอบว่า URL หรือ Key นี้เป็นไฟล์บน Cloudflare R2 / Local File (data:, blob:) หรือไม่
   * เพื่อแยกออกจากลิงก์ภายนอก เช่น Canva, Google Drive, YouTube, Figma
   */
  isR2OrLocalFileUrl(rawUrlOrKey?: string): boolean {
    if (!rawUrlOrKey || typeof rawUrlOrKey !== 'string') return false;
    const trimmed = rawUrlOrKey.trim();
    if (!trimmed) return false;

    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('r2://') ||
      trimmed.startsWith('kp-classroom-submissions/')
    ) {
      return true;
    }

    const lower = trimmed.toLowerCase();
    // ลิงก์แพลตฟอร์มภายนอกที่รู้จักชัดเจน ไม่ใช่ไฟล์ R2
    if (
      lower.includes('canva.com') ||
      lower.includes('drive.google.com') ||
      lower.includes('docs.google.com') ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('figma.com') ||
      lower.includes('loom.com') ||
      lower.includes('padlet.com') ||
      lower.includes('kahoot.it') ||
      lower.includes('tiktok.com') ||
      lower.includes('vimeo.com')
    ) {
      return false;
    }

    const workerBase = this.getWorkerUrl().toLowerCase();
    const publicBase = this.getPublicUrl().toLowerCase();
    if (
      (workerBase && lower.startsWith(workerBase)) ||
      (publicBase && lower.startsWith(publicBase)) ||
      lower.includes('kps-r2-storage') ||
      lower.includes('workers.dev/kp-classroom-submissions') ||
      lower.includes('storage.kps.ac.th') ||
      lower.includes('/kp-classroom-submissions/')
    ) {
      return true;
    }

    // กรณีเป็น Direct File URL ที่ลงท้ายด้วยนามสกุลไฟล์งาน
    return /\.(webp|jpg|jpeg|png|gif|svg|bmp|avif|heic|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|mp4|webm|mov|mp3|wav|m4a|ogg)(\?.*|#.*)?$/i.test(
      lower
    );
  },

  /**
   * สร้าง Canonical R2 Key สำหรับจัดเก็บผลงานนักเรียน
   * โครงสร้าง: kp-classroom-submissions/{term}/{room}/{assignmentId}/{studentCode}_{fileName}
   */
  buildSubmissionKey(params: {
    term?: string;
    classroom?: string;
    assignmentId: string;
    studentCode: string;
    fileName: string;
  }): string {
    const term = this.normalizeObjectKey(params.term || '1/2569').replace(/\//g, '-');
    const room = this.normalizeObjectKey(params.classroom || 'all')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\//g, '-');
    const cleanAsg = params.assignmentId.trim();
    const cleanStu = params.studentCode.trim();
    const rawFile = this.normalizeObjectKey(params.fileName || `work_${cleanStu}.webp`)
      .trim()
      .replace(/\.(png|jpg|jpeg|bmp|heic|heif)$/i, '.webp');
    const cleanFileWithoutStu = rawFile.startsWith(`${cleanStu}_`)
      ? rawFile.slice(cleanStu.length + 1)
      : rawFile;

    return `kp-classroom-submissions/${term}/${room}/${cleanAsg}/${cleanStu}_${cleanFileWithoutStu}`;
  },

  /**
   * แปลง Data URL (Base64) เป็น Blob สำรองก่อนอัปโหลด
   */
  dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64Data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return {
      blob: new Blob([array], { type: contentType }),
      contentType,
    };
  },

  /**
   * อัปโหลดไฟล์ Binary (Blob, File หรือ Base64 Data URL) ขึ้น Cloudflare R2 ผ่าน Worker
   */
  async uploadFile(
    key: string,
    body: Blob | File | string,
    contentTypeOverride?: string
  ): Promise<R2UploadResult> {
    const workerUrl = this.getWorkerUrl();
    const uploadSecret = this.getUploadSecret();

    if (!workerUrl || !uploadSecret) {
      console.warn('[R2StorageService] R2 Worker or Upload Secret not configured. Check .env variables.');
      return {
        success: false,
        key,
        url: '',
        error: 'R2 Worker not configured',
      };
    }

    try {
      let uploadPayload: Blob | File;
      let finalContentType = contentTypeOverride || 'application/octet-stream';

      if (typeof body === 'string') {
        if (body.startsWith('data:')) {
          const parsed = this.dataUrlToBlob(body);
          uploadPayload = parsed.blob;
          finalContentType = contentTypeOverride || parsed.contentType;
        } else {
          uploadPayload = new Blob([body], { type: finalContentType });
        }
      } else {
        uploadPayload = body;
        if (!contentTypeOverride && body.type) {
          finalContentType = body.type;
        }
      }

      const cleanKey = this.normalizeObjectKey(key);
      const encodedKey = this.encodeObjectKeyForUrl(cleanKey);
      const targetEndpoint = `${workerUrl}/${encodedKey}`;

      const response = await fetch(targetEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': finalContentType,
          'X-Custom-Auth-Key': uploadSecret,
        },
        body: uploadPayload,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Upload failed');
        console.error('[R2StorageService] Upload to R2 failed:', response.status, errorText);
        return {
          success: false,
          key: cleanKey,
          url: '',
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const publicBase = this.getPublicUrl();
      const publicUrl = `${publicBase}/${encodedKey}`;
      const sizeKb = Math.round(uploadPayload.size / 1024);

      return {
        success: true,
        key: cleanKey,
        url: publicUrl,
        sizeKb,
      };
    } catch (err: any) {
      console.error('[R2StorageService] Network error uploading to R2:', err);
      return {
        success: false,
        key,
        url: '',
        error: err.message || 'Network error',
      };
    }
  },

  /**
   * อัปโหลดไฟล์ Binary พร้อม Callback ความคืบหน้า (Upload Progress 0-100%)
   */
  async uploadFileWithProgress(
    key: string,
    body: Blob | File | string,
    onProgress?: (info: UploadProgressInfo) => void
  ): Promise<R2UploadResult> {
    try {
      let uploadPayload: Blob | File;
      if (typeof body === 'string') {
        if (body.startsWith('data:')) {
          uploadPayload = this.dataUrlToBlob(body).blob;
        } else {
          uploadPayload = new Blob([body], { type: 'application/octet-stream' });
        }
      } else {
        uploadPayload = body;
      }

      const cleanKey = this.normalizeObjectKey(key);
      const publicUrl = await uploadToR2WithProgress(cleanKey, uploadPayload, onProgress);
      const sizeKb = Math.round(uploadPayload.size / 1024);

      return {
        success: true,
        key: cleanKey,
        url: publicUrl,
        sizeKb,
      };
    } catch (err: any) {
      console.error('[R2StorageService] Progress upload failed:', err);
      return {
        success: false,
        key,
        url: '',
        error: err.message || 'Upload failed',
      };
    }
  },

  /**
   * ลบไฟล์ออกจาก Cloudflare R2
   */
  async deleteFile(key: string): Promise<boolean> {
    const workerUrl = this.getWorkerUrl();
    const uploadSecret = this.getUploadSecret();
    if (!workerUrl || !uploadSecret) return false;

    try {
      const encodedKey = this.encodeObjectKeyForUrl(key);
      const res = await fetch(`${workerUrl}/${encodedKey}`, {
        method: 'DELETE',
        headers: {
          'X-Custom-Auth-Key': uploadSecret,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * แปลง Path R2 ให้อยู่ในรูป Public URL ที่เปิดดูได้จริง
   * รองรับการซ่อมแซม URL ที่ถูก Double-Encode (%25E0%25B8...) อัตโนมัติ
   */
  resolvePublicViewUrl(rawUrlOrKey?: string): string | undefined {
    if (!rawUrlOrKey) return undefined;
    const trimmed = rawUrlOrKey.trim();
    if (!trimmed) return undefined;

    // ถ้าเป็น Data URL หรือ Blob อยู่แล้ว
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    const publicBase = this.getPublicUrl() || 'https://storage.kps.ac.th';
    const workerBase = this.getWorkerUrl();
    const activeBase = publicBase || workerBase;

    const isR2Target =
      trimmed.startsWith('r2://') ||
      trimmed.startsWith('kp-classroom-submissions/') ||
      (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ||
      trimmed.includes('kps-r2-storage') ||
      trimmed.includes('workers.dev/kp-classroom-submissions') ||
      trimmed.includes('/kp-classroom-submissions/') ||
      trimmed.includes('storage.kps.ac.th');

    if (isR2Target) {
      const normalizedKey = this.normalizeObjectKey(trimmed);
      if (!normalizedKey) return undefined;
      const baseToUse =
        trimmed.includes('storage.kps.ac.th') && workerBase && !workerBase.includes('storage.kps.ac.th')
          ? workerBase
          : activeBase;
      return `${baseToUse}/${this.encodeObjectKeyForUrl(normalizedKey)}`;
    }

    return trimmed;
  },
};
