// src/services/r2ChatAttachmentService.ts
import type { ChatAttachmentMeta } from '../lib/chatIndexedDb';
import { assertSafeTtlPurgeKey, type CurrentChatUserContext } from './messagingService';

export interface UploadAttachmentOptions {
  file: File;
  roomId: string;
  currentUser: CurrentChatUserContext;
  onProgress?: (percent: number, stage: 'COMPRESSING' | 'UPLOADING') => void;
}

const MAX_IMAGE_DIMENSION = 1200;
const WEBP_QUALITY = 0.82;

/**
 * บีบอัดไฟล์รูปภาพให้ด้านยาวสุดไม่เกิน 1200px และแปลงเป็นฟอร์แมต WebP
 */
export async function compressImageToWebP(file: File): Promise<File> {
  // หากเป็นไฟล์ PDF หรือไม่ใช่รูปภาพ ไม่ต้องบีบอัด
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // คำนวณสัดส่วนภาพให้ด้านที่ยาวที่สุดไม่เกิน 1200px
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // ปรับคุณภาพการย่อภาพให้คมชัดสำหรับอ่านตัวหนังสือบนกระดานหรือใบงาน
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพเพื่อบีบอัดได้'));
    };

    img.src = objectUrl;
  });
}

/**
 * บีบอัดไฟล์ + ขอ Presigned URL + อัปโหลดขึ้น Cloudflare R2 พร้อมรายงานความคืบหน้า 0-100%
 */
export async function uploadChatAttachmentWithProgress(
  options: UploadAttachmentOptions
): Promise<ChatAttachmentMeta> {
  const { file, roomId, currentUser, onProgress } = options;

  // 1. บีบอัดรูปภาพเป็น WebP (รายงานความคืบหน้าช่วง 0-15%)
  onProgress?.(5, 'COMPRESSING');
  const processedFile = file.type.startsWith('image/')
    ? await compressImageToWebP(file)
    : file;
  onProgress?.(15, 'COMPRESSING');

  // 2. ขอ Presigned PUT URL จาก Server API
  const presignRes = await fetch('/api/chat/attachments/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': currentUser.userId,
      'x-user-name': encodeURIComponent(currentUser.userName),
      'x-user-role': currentUser.role,
      'x-school-id': currentUser.schoolId,
    },
    body: JSON.stringify({
      roomId,
      fileName: processedFile.name,
      mimeType: processedFile.type,
      sizeBytes: processedFile.size,
    }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || `ไม่สามารถสร้างลิงก์อัปโหลดไฟล์ได้ (${presignRes.status})`);
  }

  const presignData: {
    uploadUrl: string;
    publicUrl: string;
    r2Key: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    expiresAt: string;
  } = await presignRes.json();

  // ตรวจสอบ Safety Guard ฝั่งไคลเอนต์ซ้ำอีกครั้ง
  assertSafeTtlPurgeKey(presignData.r2Key);

  // 3. อัปโหลดไฟล์ขึ้น Cloudflare R2 โดยตรงด้วย XMLHttpRequest เพื่อจับ Progress Event
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignData.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', processedFile.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // แปลงสัดส่วนการอัปโหลดเป็นช่วง 15% - 100%
        const uploadRatio = event.loaded / event.total;
        const totalPercent = Math.min(100, Math.round(15 + uploadRatio * 85));
        onProgress(totalPercent, 'UPLOADING');
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100, 'UPLOADING');
        resolve();
      } else {
        reject(new Error(`อัปโหลดไฟล์ไปยัง R2 ไม่สำเร็จ (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('เกิดข้อผิดพลาดเครือข่ายขณะอัปโหลดไฟล์ไปยัง Cloudflare R2'));
    xhr.send(processedFile);
  });

  return {
    r2Key: presignData.r2Key,
    url: presignData.publicUrl,
    fileName: presignData.fileName,
    mimeType: presignData.mimeType,
    sizeBytes: presignData.sizeBytes,
    expiresAt: presignData.expiresAt,
    isExpired: false,
  };
}
