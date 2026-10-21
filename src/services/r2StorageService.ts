// src/services/r2StorageService.ts
// Cloudflare R2 Object Storage Client for Student Submissions & School Documents
// Follows Pillar 6: R2-Only Storage for All Assets & Documents

const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : typeof globalThis !== 'undefined' && (globalThis as any).process?.env
    ? (globalThis as any).process.env
    : {};

export interface R2UploadResult {
  success: boolean;
  key: string;
  url: string;
  sizeKb?: number;
  error?: string;
}

export const r2StorageService = {
  getWorkerUrl(): string {
    const val = env.VITE_R2_WORKER_URL || '';
    return val.trim().replace(/\/+$/, '');
  },

  getPublicUrl(): string {
    const pub = env.VITE_R2_PUBLIC_URL || '';
    if (pub && pub.trim()) {
      return pub.trim().replace(/\/+$/, '');
    }
    return this.getWorkerUrl();
  },

  getUploadSecret(): string {
    return (env.VITE_R2_UPLOAD_SECRET || '').trim();
  },

  isConfigured(): boolean {
    return Boolean(this.getWorkerUrl() && this.getUploadSecret());
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
    const term = (params.term || '1/2569').replace('/', '-');
    const room = (params.classroom || 'all').toLowerCase().replace(/\s+/g, '').replace('/', '-');
    const cleanAsg = params.assignmentId.trim();
    const cleanStu = params.studentCode.trim();
    const cleanFile = params.fileName.trim().replace(/\.(jpg|jpeg|png|heic)$/i, '.webp');

    return `kp-classroom-submissions/${term}/${room}/${cleanAsg}/${cleanStu}_${cleanFile}`;
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

      const cleanKey = key.startsWith('/') ? key.slice(1) : key;
      const targetEndpoint = `${workerUrl}/${encodeURI(cleanKey)}`;

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
      const publicUrl = `${publicBase}/${encodeURI(cleanKey)}`;
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
   * ลบไฟล์ออกจาก Cloudflare R2
   */
  async deleteFile(key: string): Promise<boolean> {
    const workerUrl = this.getWorkerUrl();
    const uploadSecret = this.getUploadSecret();
    if (!workerUrl || !uploadSecret) return false;

    try {
      const cleanKey = key.startsWith('/') ? key.slice(1) : key;
      const res = await fetch(`${workerUrl}/${encodeURI(cleanKey)}`, {
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
   * รองรับ:
   * - r2://kp-classroom-submissions/...
   * - https://storage.kps.ac.th/... (เชื่อมผ่าน Worker หากยังไม่ได้ผูกโดเมน)
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

    // แปลง r2://kp-classroom-submissions/... เป็น https://...
    if (trimmed.startsWith('r2://')) {
      const keyWithoutScheme = trimmed.replace(/^r2:\/\//, '');
      return `${activeBase}/${encodeURI(keyWithoutScheme)}`;
    }

    // กรณีเป็นโดเมน storage.kps.ac.th แต่ยังไม่ได้ผูก DNS จริง
    if (trimmed.includes('storage.kps.ac.th')) {
      if (workerBase && !workerBase.includes('storage.kps.ac.th')) {
        // เปลี่ยนมาใช้ worker url ชั่วคราวเพื่อให้เปิดดูได้ทันที
        const path = trimmed.replace(/^https?:\/\/storage\.kps\.ac\.th\/?/, '');
        return `${workerBase}/${encodeURI(path)}`;
      }
      return trimmed;
    }

    return trimmed;
  },
};
