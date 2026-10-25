import { r2StorageService } from '../services/r2StorageService';
import { sgsRosterAndSubmissionService } from '../services/sgsRosterAndSubmissionService';

export type FilePreviewCategory =
  | 'IMAGE'
  | 'PDF'
  | 'OFFICE'
  | 'VIDEO'
  | 'AUDIO'
  | 'TEXT'
  | 'ARCHIVE'
  | 'NONE';

export type ExternalPlatformType =
  | 'CANVA'
  | 'GOOGLE_DRIVE'
  | 'GOOGLE_DOCS'
  | 'YOUTUBE'
  | 'FIGMA'
  | 'LOOM'
  | 'OTHER';

export interface ExternalLinkPreviewInfo {
  url: string;
  platform: ExternalPlatformType;
  platformLabel: string;
  iconEmoji: string;
  embedUrl?: string;
  canEmbed: boolean;
  isGoogleDriveFolder?: boolean;
  hostname: string;
}

export interface ResolvedSubmissionMedia {
  effectiveFileUrl?: string;
  effectiveLinkUrl?: string;
  inferredFileName: string;
  fileExtension: string;
  fileCategory: FilePreviewCategory;
  externalLinkInfo: ExternalLinkPreviewInfo | null;
  hasFile: boolean;
  hasLink: boolean;
  hasText: boolean;
}

/**
 * แยกแยะนามสกุลไฟล์จากชื่อไฟล์หรือ URL
 */
export function extractFileExtension(fileNameOrUrl?: string): string {
  if (!fileNameOrUrl) return '';
  const clean = fileNameOrUrl.split('?')[0].split('#')[0].trim();
  if (clean.startsWith('data:')) {
    const mime = clean.slice(5).split(';')[0].toLowerCase();
    if (mime === 'application/pdf') return '.pdf';
    if (mime.startsWith('image/')) return `.${mime.replace('image/', '').replace('svg+xml', 'svg')}`;
    if (mime.startsWith('video/')) return `.${mime.replace('video/', '')}`;
    if (mime.startsWith('audio/')) return `.${mime.replace('audio/', '')}`;
    if (mime.startsWith('text/')) return '.txt';
    return '';
  }
  const lastSlash = clean.lastIndexOf('/');
  const lastSegment = lastSlash !== -1 ? clean.slice(lastSlash + 1) : clean;
  const lastDot = lastSegment.lastIndexOf('.');
  if (lastDot === -1) return '';
  return lastSegment.slice(lastDot).toLowerCase();
}

/**
 * ตรวจจับหมวดหมู่ของไฟล์เพื่อเลือกตัวแสดงผล (Previewer) ที่เหมาะสมที่สุด
 */
export function detectFileCategory(
  fileUrl?: string,
  fileName?: string,
  channelOrTypeHint?: string
): FilePreviewCategory {
  if (!fileUrl) return 'NONE';

  if (fileUrl.startsWith('data:image/')) return 'IMAGE';
  if (fileUrl.startsWith('data:application/pdf')) return 'PDF';
  if (fileUrl.startsWith('data:video/')) return 'VIDEO';
  if (fileUrl.startsWith('data:audio/')) return 'AUDIO';
  if (fileUrl.startsWith('data:text/')) return 'TEXT';

  const extFromName = extractFileExtension(fileName);
  const extFromUrl = extractFileExtension(fileUrl);
  const ext = extFromName || extFromUrl;

  if (
    ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.avif', '.heic', '.heif', '.ico'].includes(
      ext
    )
  ) {
    return 'IMAGE';
  }

  if (ext === '.pdf') {
    return 'PDF';
  }

  if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'].includes(ext)) {
    return 'OFFICE';
  }

  if (['.mp4', '.webm', '.mov', '.m4v', '.ogv'].includes(ext)) {
    return 'VIDEO';
  }

  if (['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(ext)) {
    return 'AUDIO';
  }

  if (
    ['.txt', '.csv', '.json', '.md', '.xml', '.html', '.rtf', '.py', '.js', '.ts', '.c', '.cpp', '.java'].includes(
      ext
    )
  ) {
    return 'TEXT';
  }

  if (['.zip', '.rar', '.7z', '.psd', '.ai', '.eps', '.ipynb'].includes(ext)) {
    return 'ARCHIVE';
  }

  if (channelOrTypeHint === 'PDF' || channelOrTypeHint === 'PDF_UPLOAD') return 'PDF';
  if (channelOrTypeHint === 'IMAGE' || channelOrTypeHint === 'IMAGE_UPLOAD') return 'IMAGE';

  // หากเป็น URL บน R2 ที่ไม่มีนามสกุลชัดเจน ให้ลองแสดงเป็น IMAGE ก่อน
  return 'IMAGE';
}

/**
 * สร้าง URL สำหรับแสดงผลไฟล์เอกสาร Office (.docx, .xlsx, .pptx) บนเว็บโดยไม่ต้องดาวน์โหลด
 */
export function getOfficeViewerUrls(fileUrl: string): {
  officeEmbedUrl: string;
  googleEmbedUrl: string;
} {
  const encoded = encodeURIComponent(fileUrl);
  return {
    officeEmbedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`,
    googleEmbedUrl: `https://docs.google.com/gview?url=${encoded}&embedded=true`,
  };
}

/**
 * แปลงลิงก์ภายนอก (YouTube, Google Drive, Google Docs/Sheets/Slides, Canva, Figma, Loom ฯลฯ)
 * ให้เป็นข้อมูลพร้อม Embed URL สำหรับเปิดตรวจในหน้าต่าง Preview ได้ทันที
 */
export function parseExternalLinkInfo(
  rawUrl?: string,
  platformHint?: string
): ExternalLinkPreviewInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
    trimmed = `https://${trimmed}`;
  }

  let hostname = 'เว็บไซต์ภายนอก';
  try {
    hostname = new URL(trimmed).hostname.replace(/^www\./i, '');
  } catch {
    // ignore invalid URL parse
  }

  const lower = trimmed.toLowerCase();

  // 1. YouTube (youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...)
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || platformHint === 'YOUTUBE') {
    let videoId = '';
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
    const shortsMatch = trimmed.match(/youtube\.com\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{6,})/i);
    if (shortMatch) videoId = shortMatch[1];
    else if (watchMatch) videoId = watchMatch[1];
    else if (shortsMatch) videoId = shortsMatch[1];

    return {
      url: trimmed,
      platform: 'YOUTUBE',
      platformLabel: 'YouTube Video',
      iconEmoji: '🎬',
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
      canEmbed: Boolean(videoId),
      hostname,
    };
  }

  // 2. Google Docs / Sheets / Slides
  if (lower.includes('docs.google.com') || platformHint === 'GOOGLE_DOCS') {
    const docMatch = trimmed.match(
      /docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([a-zA-Z0-9_-]+)/i
    );
    if (docMatch) {
      const docType = docMatch[1].toLowerCase();
      const docId = docMatch[2];
      const typeLabel =
        docType === 'spreadsheets'
          ? 'Google Sheets'
          : docType === 'presentation'
            ? 'Google Slides'
            : docType === 'forms'
              ? 'Google Forms'
              : 'Google Docs';
      const embedUrl =
        docType === 'forms'
          ? `https://docs.google.com/forms/d/${docId}/viewform?embedded=true`
          : `https://docs.google.com/${docType}/d/${docId}/preview`;
      return {
        url: trimmed,
        platform: 'GOOGLE_DOCS',
        platformLabel: typeLabel,
        iconEmoji: '📄',
        embedUrl,
        canEmbed: true,
        hostname,
      };
    }
  }

  // 3. Google Drive (File or Folder)
  if (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com') ||
    platformHint === 'GOOGLE_DRIVE'
  ) {
    const fileMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/i);

    if (folderMatch) {
      const folderId = folderMatch[1];
      return {
        url: trimmed,
        platform: 'GOOGLE_DRIVE',
        platformLabel: 'โฟลเดอร์ Google Drive',
        iconEmoji: '📁',
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
        canEmbed: true,
        isGoogleDriveFolder: true,
        hostname,
      };
    }

    if (fileMatch) {
      const fileId = fileMatch[1];
      return {
        url: trimmed,
        platform: 'GOOGLE_DRIVE',
        platformLabel: 'ไฟล์บน Google Drive',
        iconEmoji: '📁',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        canEmbed: true,
        isGoogleDriveFolder: false,
        hostname,
      };
    }

    return {
      url: trimmed,
      platform: 'GOOGLE_DRIVE',
      platformLabel: 'Google Drive',
      iconEmoji: '📁',
      canEmbed: false,
      isGoogleDriveFolder: true,
      hostname,
    };
  }

  // 4. Canva
  if (lower.includes('canva.com') || platformHint === 'CANVA') {
    const designMatch = trimmed.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/i);
    let embedUrl: string | undefined;
    if (designMatch) {
      const designId = designMatch[1];
      const tokenOrView = designMatch[2] && designMatch[2] !== 'edit' ? designMatch[2] : 'view';
      embedUrl = `https://www.canva.com/design/${designId}/${tokenOrView}/view?embed`;
    }
    return {
      url: trimmed,
      platform: 'CANVA',
      platformLabel: 'Canva Design',
      iconEmoji: '🎨',
      embedUrl,
      canEmbed: Boolean(embedUrl),
      hostname,
    };
  }

  // 5. Figma
  if (lower.includes('figma.com') || platformHint === 'FIGMA') {
    return {
      url: trimmed,
      platform: 'FIGMA',
      platformLabel: 'Figma Design',
      iconEmoji: '✨',
      embedUrl: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(trimmed)}`,
      canEmbed: true,
      hostname,
    };
  }

  // 6. Loom
  if (lower.includes('loom.com')) {
    const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
    return {
      url: trimmed,
      platform: 'LOOM',
      platformLabel: 'Loom Video',
      iconEmoji: '🎥',
      embedUrl: loomMatch ? `https://www.loom.com/embed/${loomMatch[1]}` : undefined,
      canEmbed: Boolean(loomMatch),
      hostname,
    };
  }

  // 7. Generic Web Link
  return {
    url: trimmed,
    platform: 'OTHER',
    platformLabel: hostname || 'ลิงก์เว็บไซต์ภายนอก',
    iconEmoji: '🔗',
    embedUrl: trimmed,
    canEmbed: false,
    hostname,
  };
}

/**
 * รวมศูนย์การค้นหาและแยกแยะไฟล์ R2 + ลิงก์ภายนอก + ข้อความคำตอบของนักเรียน
 */
export function resolveSubmissionMedia(params: {
  url?: string;
  fileUrl?: string;
  fileDataUrl?: string;
  filePreviewUrl?: string;
  r2ObjectKey?: string;
  externalLinkUrl?: string;
  assignmentId?: string;
  studentCode?: string;
  fileName?: string;
  textContent?: string;
  typeHint?: string;
  platformHint?: string;
  localOverrideUrl?: string | null;
}): ResolvedSubmissionMedia {
  // 1. ค้นหาข้อมูลจากฐานข้อมูล Submission หากมี assignmentId และ studentCode
  const matchedSub =
    params.assignmentId && params.studentCode
      ? sgsRosterAndSubmissionService
          .getSubmissions()
          .find(
            (s) =>
              s.assignmentId === params.assignmentId &&
              s.studentCode === params.studentCode
          )
      : undefined;

  const candidateRawUrls = [
    params.localOverrideUrl || undefined,
    params.fileUrl,
    params.filePreviewUrl,
    params.fileDataUrl,
    params.r2ObjectKey,
    matchedSub?.fileUrl,
    matchedSub?.fileDataUrl,
    matchedSub?.r2ObjectKey,
    params.url,
  ].filter(Boolean) as string[];

  let effectiveFileUrl: string | undefined;
  let detectedExternalFromUrl: string | undefined;

  for (const raw of candidateRawUrls) {
    if (r2StorageService.isR2OrLocalFileUrl(raw)) {
      const resolved = r2StorageService.resolvePublicViewUrl(raw);
      if (
        resolved &&
        !resolved.startsWith('r2://') &&
        !resolved.includes('storage.kps.ac.th')
      ) {
        effectiveFileUrl = resolved;
        break;
      }
    } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
      if (!detectedExternalFromUrl) {
        detectedExternalFromUrl = raw;
      }
    }
  }

  // Fallback ค้นหาใน Local Cache (kp_sub_file_*)
  if (!effectiveFileUrl && (params.assignmentId || params.studentCode || params.fileName)) {
    const cached = sgsRosterAndSubmissionService.getSubmissionFileUrl(
      params.assignmentId,
      params.studentCode,
      params.fileName
    );
    if (cached && r2StorageService.isR2OrLocalFileUrl(cached)) {
      effectiveFileUrl = r2StorageService.resolvePublicViewUrl(cached) || cached;
    } else if (cached && (cached.startsWith('http://') || cached.startsWith('https://'))) {
      if (!detectedExternalFromUrl) detectedExternalFromUrl = cached;
    }
  }

  const effectiveLinkUrl =
    params.externalLinkUrl?.trim() ||
    matchedSub?.externalLinkUrl?.trim() ||
    detectedExternalFromUrl ||
    undefined;

  const rawInferredName =
    params.fileName ||
    (matchedSub?.workAttachmentLabel
      ? matchedSub.workAttachmentLabel.replace(/^☁️\s*R2:\s*/i, '').split(' (')[0].split(' + ')[0].trim()
      : undefined) ||
    (effectiveFileUrl && !effectiveFileUrl.startsWith('data:')
      ? decodeURIComponent(effectiveFileUrl.split('/').pop()?.split('?')[0] || '')
      : undefined) ||
    'ไฟล์ผลงานนักเรียน';

  const fileExtension = extractFileExtension(rawInferredName) || extractFileExtension(effectiveFileUrl);
  const fileCategory = detectFileCategory(effectiveFileUrl, rawInferredName, params.typeHint);
  const externalLinkInfo = parseExternalLinkInfo(effectiveLinkUrl, params.platformHint);
  const resolvedText = params.textContent ?? matchedSub?.textContent ?? '';

  return {
    effectiveFileUrl,
    effectiveLinkUrl,
    inferredFileName: rawInferredName,
    fileExtension,
    fileCategory,
    externalLinkInfo,
    hasFile: Boolean(effectiveFileUrl && fileCategory !== 'NONE'),
    hasLink: Boolean(externalLinkInfo),
    hasText: Boolean(resolvedText && resolvedText.trim().length > 0),
  };
}
