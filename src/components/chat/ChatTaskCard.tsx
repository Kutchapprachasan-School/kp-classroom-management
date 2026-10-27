// src/components/chat/ChatTaskCard.tsx
import React from 'react';
import Task2Regular from '@mingcute/react/core-regular/task-2';
import CheckCircleFilled from '@mingcute/react/core-filled/check-circle';
import TimeRegular from '@mingcute/react/core-regular/time';
import AwardRegular from '@mingcute/react/core-regular/award';
import ArrowRightRegular from '@mingcute/react/core-regular/arrow-right';
import type { ChatActionPayload } from '../../lib/chatIndexedDb';

interface ChatTaskCardProps {
  title: string;
  payload: ChatActionPayload | null;
  isSubmitted?: boolean;
  onOpenTaskSubmission?: (taskId?: string) => void;
}

export const ChatTaskCard: React.FC<ChatTaskCardProps> = ({
  title,
  payload,
  isSubmitted = false,
  onOpenTaskSubmission,
}) => {
  const dueDateMs = payload?.dueDate ? new Date(payload.dueDate).getTime() : null;
  const isOverdue = dueDateMs !== null && dueDateMs < Date.now() && !isSubmitted;

  const formattedDueDate = payload?.dueDate
    ? new Date(payload.dueDate).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'ไม่ระบุวันครบกำหนด';

  // กรณีที่ 1: ส่งงานเรียบร้อยแล้ว หรือหมดเวลาส่งแล้ว -> ลดน้ำหนักสายตา (Muted Visual Weight)
  if (isSubmitted || isOverdue) {
    return (
      <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-3.5 opacity-85 transition">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                isSubmitted
                  ? 'bg-emerald-100/80 text-emerald-600'
                  : 'bg-slate-200/70 text-slate-500'
              }`}
            >
              {isSubmitted ? (
                <CheckCircleFilled className="h-4 w-4" />
              ) : (
                <TimeRegular className="h-4 w-4" />
              )}
            </span>
            <div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isSubmitted
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {isSubmitted ? 'ส่งงานเรียบร้อยแล้ว' : 'ครบกำหนดส่งแล้ว'}
              </span>
              <p className="mt-1 text-xs font-medium text-slate-600 line-through decoration-slate-400/70">
                {title}
              </p>
            </div>
          </div>

          {payload?.maxScore && (
            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {payload.maxScore} คะแนน
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">กำหนดส่ง: {formattedDueDate}</p>
      </div>
    );
  }

  // กรณีที่ 2: งานมอบหมายที่ยังเปิดรับส่งอยู่ -> ใช้ Visual Priority สูงสุด (Pastel Anime Highlight)
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/80 p-4 shadow-xs transition hover:border-indigo-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xs">
            <Task2Regular className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                งานมอบหมาย • รอส่ง
              </span>
              {payload?.courseCode && (
                <span className="rounded-full bg-indigo-100/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {payload.courseCode}
                </span>
              )}
            </div>
            <h4 className="mt-1 text-sm font-bold text-slate-800">{title}</h4>
          </div>
        </div>

        {payload?.maxScore && (
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-xs font-bold text-amber-700">
            <AwardRegular className="h-4 w-4" />
            <span>{payload.maxScore} คะแนน</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100/80 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <TimeRegular className="h-4 w-4" />
          <span>กำหนดส่ง: {formattedDueDate}</span>
        </div>

        <button
          type="button"
          onClick={() => onOpenTaskSubmission?.(payload?.taskId)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:from-indigo-600 hover:to-sky-600 active:scale-95 cursor-pointer"
        >
          <span>ส่งงาน / ดูรายละเอียด</span>
          <ArrowRightRegular className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
