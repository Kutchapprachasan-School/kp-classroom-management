// src/components/chat/ChatAttachmentCard.tsx
import React, { useState } from 'react';
import type { ChatAttachmentMeta } from '../../lib/chatIndexedDb';

interface ChatAttachmentCardProps {
  attachment: ChatAttachmentMeta | any;
}

export const ChatAttachmentCard: React.FC<ChatAttachmentCardProps> = ({ attachment }) => {
  const [loadFailed, setLoadFailed] = useState(false);

  if (!attachment) return null;

  const isExpiredByTime =
    attachment.isExpired ||
    (attachment.expiresAt ? new Date(attachment.expiresAt).getTime() <= Date.now() : false);
  const showExpiredNotice = isExpiredByTime || loadFailed;

  // กรณีไฟล์หมดอายุเกิน 7 วัน หรือ R2 ลบไฟล์ไปแล้ว (404 Not Found)
  if (showExpiredNotice) {
    return (
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-800">
        <span className="text-base" role="img" aria-label="expired">
          🕒
        </span>
        <div>
          <p className="font-medium">ไฟล์แนบหมดอายุตามนโยบายจัดเก็บ 7 วัน</p>
          <p className="text-[11px] text-amber-700/80">
            ชื่อไฟล์เดิม: {attachment.fileName || 'ไฟล์แนบ'} (ข้อความสนทนายังคงเก็บรักษาไว้ตามปกติ)
          </p>
        </div>
      </div>
    );
  }

  const isImage =
    attachment.mimeType?.startsWith('image/') ||
    attachment.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  // กรณีเป็นรูปภาพ (.webp / .jpg / .png)
  if (isImage) {
    return (
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.fileName || 'รูปภาพ'}
            loading="lazy"
            onError={() => setLoadFailed(true)}
            className="max-h-72 w-auto max-w-full object-contain transition hover:opacity-95"
          />
        </a>
      </div>
    );
  }

  // กรณีเป็นไฟล์เอกสาร PDF หรืออื่นๆ
  const fileSizeKb = attachment.sizeBytes
    ? Math.max(1, Math.round(attachment.sizeBytes / 1024))
    : attachment.fileSizeKb || 1;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/90 px-3.5 py-2.5 text-xs text-slate-700 shadow-xs transition hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <div className="flex items-center gap-2.5 truncate">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 font-semibold text-rose-600 text-xs">
          {attachment.mimeType === 'application/pdf' || attachment.fileName?.endsWith('.pdf')
            ? 'PDF'
            : 'FILE'}
        </span>
        <div className="truncate">
          <p className="truncate font-medium text-slate-800">{attachment.fileName || 'เอกสารแนบ'}</p>
          <p className="text-[11px] text-slate-500">
            ขนาด {fileSizeKb} KB • ลบอัตโนมัติใน 7 วัน
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-600 text-xs">
        เปิดดู
      </span>
    </a>
  );
};
