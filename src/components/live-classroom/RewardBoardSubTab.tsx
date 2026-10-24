// src/components/live-classroom/RewardBoardSubTab.tsx
// แท็บที่ 4: กระดานดาวเด่นประจำคาบ (Top 8 Earners), ประวัติการแจกรางวัล (Session Log)
// พร้อมปุ่ม Undo และแสดงสถานะซิงค์, ปุ่มแจกโบนัสทั้งห้อง, และปุ่มเปิดหมุนวงล้อตั๋วสุ่ม

import React from 'react';
import {
  Trophy,
  ClipboardList,
  PartyPopper,
  Ticket,
  Undo2,
} from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import type { RewardBatch } from '../../hooks/useOptimisticRewards';

export interface RewardBoardSubTabProps {
  students: LiveStudent[];
  ledger: RewardBatch[];
  sessionTotalTickets: number;
  isProjectorMode: boolean;
  onOpenLuckyDraw: () => void;
  onUndo: (batch: RewardBatch) => void;
  onGiveClassBonus: () => void;
}

export function calculateTopEarners(students: LiveStudent[], limit = 8): LiveStudent[] {
  return [...students]
    .filter((s) => s.sessionCoins > 0 || s.sessionTickets > 0)
    .sort(
      (a, b) =>
        b.sessionCoins * 2 +
        b.sessionTickets * 3 -
        (a.sessionCoins * 2 + a.sessionTickets * 3)
    )
    .slice(0, limit);
}

export function formatRewardTimeThai(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(11, 16);
    return d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString.slice(11, 16);
  }
}

export const RewardBoardSubTab: React.FC<RewardBoardSubTabProps> = ({
  students,
  ledger,
  sessionTotalTickets,
  isProjectorMode,
  onOpenLuckyDraw,
  onUndo,
  onGiveClassBonus,
}) => {
  const presentStudents = students.filter((s) => s.present);

  // คำนวณอันดับดาวเด่นในคาบนี้ (เหรียญ * 2 + ตั๋ว * 3)
  const topEarners = calculateTopEarners(students, 8);

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Earners in Session */}
        <div
          className={`rounded-3xl p-6 flex flex-col border transition-colors ${
            isProjectorMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-[#E6EEF7] shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
              <Trophy className="w-5 h-5" />
              <span>ดาวเด่นประจำคาบนี้ (Top Earners)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              คำนวณจากกิจกรรมในคาบเรียน
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[380px]">
            {topEarners.length > 0 ? (
              topEarners.map((st, idx) => (
                <div
                  key={st.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition ${
                    isProjectorMode
                      ? 'bg-slate-800/70 border-slate-700/70'
                      : 'bg-[#F7FAFF] border-[#E6EEF7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 font-black'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800 font-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : isProjectorMode
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-white text-[#163A66] border'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p
                        className={`font-bold text-sm ${
                          isProjectorMode ? 'text-slate-100' : 'text-[#163A66]'
                        }`}
                      >
                        {st.name}
                      </p>
                      <p className="text-[11px] text-slate-400">#{st.studentCode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 font-bold text-xs">
                    <span className="text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      +{st.sessionCoins} 🪙
                    </span>
                    <span className="text-pink-500 bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/20">
                      +{st.sessionTickets} 🎟️
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <Trophy className="w-12 h-12 mb-2 opacity-25 text-amber-500" />
                <p className="text-sm font-semibold">ยังไม่มีผู้ได้รับเหรียญหรือตั๋วในคาบนี้</p>
                <p className="text-xs text-slate-400 mt-1">
                  เริ่มสุ่มชื่อหรือแข่งขันตอบคำถามเพื่อให้คะแนนนักเรียนค่ะ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Session Log with Undo & Sync Status */}
        <div
          className={`rounded-3xl p-6 flex flex-col border transition-colors ${
            isProjectorMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-[#E6EEF7] shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${
                isProjectorMode ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>ประวัติการแจกรางวัล (Session Log)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              รวม {ledger.filter((l) => !l.isRevoked).length} รายการ
            </span>
          </div>

          {ledger.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[380px]">
              {ledger.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs transition ${
                    item.isRevoked
                      ? 'opacity-40 line-through bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : isProjectorMode
                      ? 'bg-slate-800/60 border-slate-800'
                      : 'bg-[#F7FAFF] border-[#E6EEF7]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">
                      [{formatRewardTimeThai(item.createdAt)}]
                    </span>
                    <span
                      className={`font-semibold ${
                        isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
                      }`}
                    >
                      {item.description}
                    </span>
                    <span className="font-bold text-amber-500">
                      (+{item.amount} {item.rewardType === 'coin' ? '🪙' : '🎟️'})
                    </span>

                    {/* Status Badge */}
                    {item.syncStatus === 'syncing' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-500 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full font-medium">
                        ⏳ กำลังบันทึก...
                      </span>
                    )}
                    {item.syncStatus === 'queued' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full font-medium">
                        📡 รอเน็ต (เก็บในคิว)
                      </span>
                    )}
                    {item.syncStatus === 'synced' && !item.isRevoked && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-medium">
                        ✓ ซิงค์แล้ว
                      </span>
                    )}
                  </div>

                  {!item.isRevoked ? (
                    <button
                      disabled={item.syncStatus === 'syncing'}
                      onClick={() => onUndo(item)}
                      className="flex items-center gap-1 text-[11px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 font-semibold px-2.5 py-1 rounded-xl transition disabled:opacity-40"
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>Undo</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">ยกเลิกแล้ว</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <ClipboardList className="w-12 h-12 mb-2 opacity-25 text-blue-500" />
              <p className="text-sm font-semibold">ยังไม่มีประวัติการแจกรางวัลในคาบนี้</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar: Lucky Draw & Class Bonus */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isProjectorMode
            ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-500/30'
            : 'bg-gradient-to-r from-blue-50 via-white to-pink-50 border-[#BFDBFE]'
        }`}
      >
        <div className="flex items-center gap-3">
          <PartyPopper className="w-6 h-6 text-amber-500" />
          <div>
            <h4
              className={`font-bold text-sm ${
                isProjectorMode ? 'text-slate-100' : 'text-[#163A66]'
              }`}
            >
              กิจกรรมและโบนัสท้ายคาบ
            </h4>
            <p className="text-xs text-slate-400">
              หมุนวงล้อลุ้นรางวัลใหญ่จากตั๋วสุ่ม หรือแจกเหรียญโบนัสให้นักเรียนทุกคนที่มาเรียน ({presentStudents.length} คน)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenLuckyDraw}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-pink-500/25 transition active:scale-95"
          >
            <Ticket className="w-4 h-4" />
            <span>🎰 หมุนวงล้อตั๋วสุ่ม ({sessionTotalTickets} 🎟️)</span>
          </button>

          <button
            onClick={onGiveClassBonus}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md shadow-amber-400/20 transition active:scale-95"
          >
            <PartyPopper className="w-4 h-4" />
            <span>แจกโบนัสทั้งห้อง (+1 🪙 ทุกคนที่มาเรียน)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
