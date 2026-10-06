// src/utils/imageCompressor.ts
// Client-Side Canvas Image Resizer & Compressor for Teacher Custom Subject Banners
// Enforces: Max width 1200px, Max height 360px, WebP/JPEG encoding, Payload < 150KB (153,600 bytes)

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeBytes: number;
  initialQuality: number;
  minQuality: number;
  qualityStep: number;
  mimeType: string;
  fallbackMimeType: string;
}

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
  mimeType: string;
  compressionRatio: number;
  isWithinQuota: boolean;
}

export const DEFAULT_BANNER_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 360,
  maxSizeBytes: 153600, // 150 KB (150 * 1024 bytes)
  initialQuality: 0.85,
  minQuality: 0.70,
  qualityStep: 0.05,
  mimeType: 'image/webp',
  fallbackMimeType: 'image/jpeg',
};

interface NodeBufferLike {
  toString(encoding?: string): string;
  length: number;
}

interface NodeBufferConstructor {
  from(data: unknown, encoding?: string): NodeBufferLike;
}

function getNodeBuffer(): NodeBufferConstructor | undefined {
  return (globalThis as unknown as { Buffer?: NodeBufferConstructor }).Buffer;
}

/**
 * Estimates binary byte size from a base64 string or data URL.
 * Accounts for data URL prefixes, whitespace, and padding characters ('=').
 */
export function estimateBase64SizeBytes(base64String: string): number {
  if (!base64String || typeof base64String !== 'string') {
    return 0;
  }

  // Strip Data URL scheme if present (e.g., "data:image/webp;base64,....")
  const commaIndex = base64String.indexOf(',');
  const rawBase64 = commaIndex !== -1 ? base64String.slice(commaIndex + 1) : base64String;

  // Remove whitespace and newlines
  const sanitized = rawBase64.replace(/\s+/g, '');
  if (!sanitized) {
    return 0;
  }

  const len = sanitized.length;
  let padding = 0;
  if (sanitized.endsWith('==')) {
    padding = 2;
  } else if (sanitized.endsWith('=')) {
    padding = 1;
  }

  return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/**
 * Converts a data URL into a Blob instance.
 * Safe across browser and Node/SSR environments.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return new Blob([], { type: 'application/octet-stream' });
  }

  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const data = parts[1] || '';

  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
  const isBase64 = header.includes(';base64');

  if (typeof atob !== 'undefined' && typeof window !== 'undefined') {
    const byteString = isBase64 ? atob(data) : decodeURIComponent(data);
    const len = byteString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  const nodeBuffer = getNodeBuffer();
  if (nodeBuffer) {
    const buffer = isBase64
      ? nodeBuffer.from(data, 'base64')
      : nodeBuffer.from(decodeURIComponent(data), 'utf-8');
    return new Blob([buffer as unknown as BlobPart], { type: mimeType });
  }

  if (typeof atob !== 'undefined') {
    const byteString = isBase64 ? atob(data) : decodeURIComponent(data);
    const len = byteString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  return new Blob([data], { type: mimeType });
}

/**
 * Calculates proportional aspect ratio dimensions constrained to maxWidth and maxHeight.
 */
export function calculateAspectRatioDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth = 1200,
  maxHeight = 360
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  let width = origWidth;
  let height = origHeight;

  if (origWidth > maxWidth || (maxHeight > 0 && origHeight > maxHeight)) {
    const widthRatio = maxWidth / origWidth;
    const heightRatio = maxHeight > 0 ? maxHeight / origHeight : widthRatio;
    const scale = Math.min(widthRatio, heightRatio);
    width = Math.max(1, Math.round(origWidth * scale));
    height = Math.max(1, Math.round(origHeight * scale));
  }

  return { width, height };
}

/**
 * Formats byte size into human readable string (e.g., 142.5 KB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'B'}`;
}

/**
 * Validates if the file is an image MIME type.
 */
export function isImageFile(file: File | Blob): boolean {
  if (!file) return false;
  return Boolean(file.type && file.type.startsWith('image/'));
}

/**
 * Client-side canvas image compressor for teacher custom subject banners.
 * Automatically downscales to max 1200x360 maintaining aspect ratio,
 * applies high-clarity canvas smoothing, and compresses to WebP/JPEG under 150KB.
 */
export async function compressSubjectBannerImage(
  file: File | Blob,
  options?: Partial<CompressionOptions>
): Promise<CompressedImageResult> {
  const opts: CompressionOptions = {
    ...DEFAULT_BANNER_COMPRESSION_OPTIONS,
    ...options,
  };

  // Node.js / SSR Environment fallback
  if (typeof document === 'undefined') {
    let dataUrl = 'data:image/webp;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    let sizeBytes = 43;
    let origSize = (file as Blob)?.size || 43;
    const width = opts.maxWidth;
    const height = opts.maxHeight;

    if (file && typeof file === 'object') {
      if ('size' in file && typeof file.size === 'number' && file.size > 0) {
        origSize = file.size;
      }
      if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
        try {
          const ab = await file.arrayBuffer();
          const nodeBuffer = getNodeBuffer();
          if (nodeBuffer) {
            const buf = nodeBuffer.from(ab);
            const base64 = buf.toString('base64');
            const mime = opts.mimeType || (file as Blob).type || 'image/webp';
            dataUrl = `data:${mime};base64,${base64}`;
            sizeBytes = buf.length;
          } else {
            sizeBytes = ab.byteLength;
          }
        } catch {
          // Fallback default
        }
      }
    }

    const compressionRatio = origSize > 0 ? Number((sizeBytes / origSize).toFixed(4)) : 1.0;
    const isWithinQuota = sizeBytes <= opts.maxSizeBytes;

    return {
      dataUrl,
      sizeBytes,
      width,
      height,
      mimeType: opts.mimeType,
      compressionRatio,
      isWithinQuota,
    };
  }

  // Browser Canvas Environment
  let objectUrl: string | null = null;
  const img = new Image();

  try {
    objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพสำหรับบีบอัดได้ (Invalid image source)'));
      img.src = objectUrl!;
    });
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const origWidth = img.naturalWidth || img.width || opts.maxWidth;
  const origHeight = img.naturalHeight || img.height || opts.maxHeight;
  const { width: targetWidth, height: targetHeight } = calculateAspectRatioDimensions(
    origWidth,
    origHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถเข้าถึง Canvas 2D Rendering Context ได้');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let chosenMime = opts.mimeType;
  let quality = opts.initialQuality;
  let dataUrl = canvas.toDataURL(chosenMime, quality);

  // WebP fallback check: If WebP is unsupported, browser produces image/png
  if (chosenMime === 'image/webp' && !dataUrl.startsWith('data:image/webp')) {
    chosenMime = opts.fallbackMimeType || 'image/jpeg';
    dataUrl = canvas.toDataURL(chosenMime, quality);
  }

  let sizeBytes = estimateBase64SizeBytes(dataUrl);

  // Compression loop: Reduce quality until within quota or minQuality reached
  while (sizeBytes > opts.maxSizeBytes && quality > opts.minQuality) {
    quality = Math.max(opts.minQuality, Number((quality - opts.qualityStep).toFixed(2)));
    const nextDataUrl = canvas.toDataURL(chosenMime, quality);
    const nextSize = estimateBase64SizeBytes(nextDataUrl);
    dataUrl = nextDataUrl;
    sizeBytes = nextSize;
    if (quality <= opts.minQuality) break;
  }

  // Downscale loop: If still over quota at minQuality, gently reduce dimensions
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let downscaleAttempts = 0;

  while (sizeBytes > opts.maxSizeBytes && downscaleAttempts < 3 && currentWidth > 320 && currentHeight > 96) {
    downscaleAttempts++;
    currentWidth = Math.round(currentWidth * 0.85);
    currentHeight = Math.round(currentHeight * 0.85);

    canvas.width = currentWidth;
    canvas.height = currentHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    dataUrl = canvas.toDataURL(chosenMime, opts.minQuality);
    sizeBytes = estimateBase64SizeBytes(dataUrl);
  }

  const origSize = (file as Blob).size || sizeBytes || 1;
  const compressionRatio = Number((sizeBytes / origSize).toFixed(4));
  const isWithinQuota = sizeBytes <= opts.maxSizeBytes;

  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const finalMime = mimeMatch ? mimeMatch[1] : chosenMime;

  return {
    dataUrl,
    sizeBytes,
    width: canvas.width,
    height: canvas.height,
    mimeType: finalMime,
    compressionRatio,
    isWithinQuota,
  };
}
