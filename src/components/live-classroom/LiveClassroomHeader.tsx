// src/components/live-classroom/LiveClassroomHeader.tsx
// แถบควบคุมด้านบนสำหรับครูผู้สอน: เลือกห้องเรียน, เช็คยอดเข้าเรียน, สถานะออฟไลน์/ออนไลน์,
// ตัวนับเหรียญ/ตั๋วในคาบ, สวิตช์เสียง, โหมดฉายจอโปรเจกเตอร์, และปุ่มสลับ 4 แท็บย่อยสไตล์ Pastel Anime

import React from 'react';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import RandomRegular from '@mingcute/react/core-regular/random';
import TimeRegular from '@mingcute/react/core-regular/time';
import GroupRegular from '@mingcute/react/core-regular/group';
import TrophyRegular from '@mingcute/react/core-regular/trophy';
import TicketRegular from '@mingcute/react/core-regular/ticket';
import Coin2Regular from '@mingcute/react/core-regular/coin-2';
import CheckCircleRegular from '@mingcute/react/core-regular/check-circle';
import FullscreenRegular from '@mingcute/react/core-regular/fullscreen';
import FullscreenExitRegular from '@mingcute/react/core-regular/fullscreen-exit';
import VolumeRegular from '@mingcute/react/core-regular/volume';
import VolumeMuteRegular from '@mingcute/react/core-regular/volume-mute';
import Book2Regular from '@mingcute/react/core-regular/book-2';
import { Coins } from 'lucide-react';

export type SubTab = 'picker' | 'words' | 'timer' | 'groups' | 'rewards';

export interface LiveClassroomHeaderProps {
  classrooms: { id: string; name: string; subject: string; studentCount?: number }[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  presentCount: number;
  totalCount: number;
  sessionCoins: number;
  sessionTickets: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isProjectorMode: boolean;
  onToggleProjector: () => void;
  activeTab: SubTab;
  onChangeTab: (tab: SubTab) => void;
  isOnline: boolean;
  pendingQueueCount: number;
  isFlushingQueue: boolean;
  onFlushQueue: () => void;
  onOpenLuckyDraw: () => void;
  onOpenGoldQuestArena?: () => void;
}

export const LiveClassroomHeader: React.FC<LiveClassroomHeaderProps> = ({
  classrooms,
  selectedClassId,
  onSelectClassId,
  presentCount,
  totalCount,
  sessionCoins,
  sessionTickets,
  soundEnabled,
  onToggleSound,
  isProjectorMode,
  onToggleProjector,
  activeTab,
  onChangeTab,
  isOnline,
  pendingQueueCount,
  isFlushingQueue,
  onFlushQueue,
  onOpenLuckyDraw,
  onOpenGoldQuestArena,
}) => {
  return (
    <header
      className={`rounded-2xl p-4 shadow-lg transition-colors duration-300 ${
        isProjectorMode
          ? 'bg-slate-900/95 border border-slate-800 backdrop-blur-md'
          : 'bg-white border border-[#E6EEF7] shadow-sm'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand Badge & Classroom Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              isProjectorMode
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                : 'bg-blue-50 border border-blue-200 text-[#163A66]'
            }`}
          >
            <SparklesRegular className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold flex items-center gap-1.5">
              <span>สอน</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            </span>
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className={`font-semibold rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isProjectorMode
                ? 'bg-slate-800 border border-slate-700 text-slate-100'
                : 'bg-[#F7FAFF] border border-[#BFDBFE] text-[#163A66]'
            }`}
          >
            {classrooms.map((cls) => (
              <option key={cls.id} value={cls.id}>
                ห้อง {cls.name}{cls.studentCount !== undefined ? ` (${cls.studentCount} คน)` : ''} — {cls.subject}
              </option>
            ))}
          </select>

          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
              isProjectorMode
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircleRegular className="w-4 h-4 text-emerald-500" />
            มาเรียน {presentCount}/{totalCount} คน
          </span>

          {/* Offline Queue Badge & Manual Flush */}
          {(!isOnline || pendingQueueCount > 0) && (
            <button
              onClick={onFlushQueue}
              disabled={!isOnline || isFlushingQueue}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
                !isOnline
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
              }`}
              title="คลิกเพื่อสั่งซิงค์คะแนนในคิวออฟไลน์ทันที"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  !isOnline ? 'bg-amber-400 animate-ping' : 'bg-blue-400 animate-spin'
                }`}
              />
              <span>
                {!isOnline
                  ? `โหมดออฟไลน์ (รอซิงค์ ${pendingQueueCount} รายการ)`
                  : isFlushingQueue
                  ? `กำลังซิงค์คิว (${pendingQueueCount})...`
                  : `ค้างในคิว ${pendingQueueCount} (กดเพื่อซิงค์)`}
              </span>
            </button>
          )}
        </div>

        {/* Right: Projector Controls & Session Summary */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gold Quest Live Arena Launcher Button */}
          {onOpenGoldQuestArena && (
            <button
              onClick={onOpenGoldQuestArena}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
              title="เปิดสนามสอบสด Gold Quest Arena (ฉายโปรเจกเตอร์ + สแกน QR Code)"
            >
              <Coins className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Gold Quest Arena 🏆</span>
            </button>
          )}

          {/* Quick Lucky Draw Button */}
          <button
            onClick={onOpenLuckyDraw}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition active:scale-95"
            title="เปิดวงล้อจับรางวัลตั๋วสุ่มท้ายคาบ"
          >
            <TicketRegular className="w-4 h-4" />
            <span>หมุนวงล้อตั๋วสุ่ม ({sessionTickets} 🎟️)</span>
          </button>

          {/* Session Ledger Counter */}
          <button
            onClick={() => onChangeTab('rewards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition ${
              isProjectorMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-[#F7FAFF] hover:bg-blue-50 border-[#E6EEF7] text-[#163A66]'
            }`}
            title="ดูประวัติการแจกรางวัลในคาบนี้ (แท็บ 4)"
          >
            <Coin2Regular className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">แจกในคาบ:</span>
            <span className="font-bold text-amber-500">{sessionCoins} 🪙</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-pink-500">{sessionTickets} 🎟️</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              soundEnabled
                ? isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : isProjectorMode
                ? 'bg-rose-950/40 border-rose-800/50 text-rose-400'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
            title="เปิด/ปิดเสียงเอฟเฟกต์ (คีย์ลัด M)"
          >
            {soundEnabled ? (
              <VolumeRegular className="w-4 h-4 text-emerald-500" />
            ) : (
              <VolumeMuteRegular className="w-4 h-4 text-rose-500" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'เสียงเปิด' : 'ปิดเสียง'}</span>
          </button>

          {/* Projector Fullscreen Toggle */}
          <button
            onClick={onToggleProjector}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              isProjectorMode
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white border-[#E6EEF7] text-[#163A66] hover:bg-slate-50'
            }`}
            title="โหมดฉายจอใหญ่เต็มจอ (คีย์ลัด F)"
          >
            {isProjectorMode ? (
              <>
                <FullscreenExitRegular className="w-4 h-4" />
                <span>ย่อหน้าจอ</span>
              </>
            ) : (
              <>
                <FullscreenRegular className="w-4 h-4 text-blue-500" />
                <span>โหมดฉายจอใหญ่</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-tool Navigation (5 Tabs) */}
      <nav
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-4 pt-4 border-t ${
          isProjectorMode ? 'border-slate-800' : 'border-[#E6EEF7]'
        }`}
      >
        {[
          { id: 'picker', label: 'สุ่มชื่อนักเรียน', icon: RandomRegular },
          { id: 'words', label: 'สุ่มคำศัพท์ / ข้อความ', icon: Book2Regular },
          { id: 'timer', label: 'ตอบคำถามสด', icon: TimeRegular },
          { id: 'groups', label: 'แบ่งกลุ่มกิจกรรม', icon: GroupRegular },
          { id: 'rewards', label: 'บอร์ดรางวัล', icon: TrophyRegular },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as SubTab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                  : isProjectorMode
                  ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'bg-[#F7FAFF] text-[#6B7C93] hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
