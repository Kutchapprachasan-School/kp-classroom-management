// src/components/live-classroom/LiveClassroomHeader.tsx
// แถบควบคุมด้านบนสำหรับครูผู้สอน: เลือกห้องเรียน, เช็คยอดเข้าเรียน, สถานะออฟไลน์/ออนไลน์,
// ตัวนับเหรียญ/ตั๋วในคาบ, สวิตช์เสียง, โหมดฉายจอโปรเจกเตอร์, และปุ่มสลับ 4 แท็บย่อย

import React from 'react';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ClipboardList,
  Dices,
  Timer,
  Users,
  Trophy,
  CheckCircle2,
  Ticket,
} from 'lucide-react';

export type SubTab = 'picker' | 'timer' | 'groups' | 'rewards';

export interface LiveClassroomHeaderProps {
  classrooms: { id: string; name: string; subject: string }[];
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
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold">เครื่องมือตอนสอน</span>
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
                ห้อง {cls.name} — {cls.subject}
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
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
          {/* Quick Lucky Draw Button */}
          <button
            onClick={onOpenLuckyDraw}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition active:scale-95"
            title="เปิดวงล้อจับรางวัลตั๋วสุ่มท้ายคาบ"
          >
            <Ticket className="w-4 h-4" />
            <span>หมุนวงล้อตั๋วสุ่ม ({sessionTickets} 🎟️)</span>
          </button>

          {/* Session Ledger Counter */}
          <button
            onClick={() => onChangeTab('rewards')}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition ${
              isProjectorMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-[#F7FAFF] hover:bg-blue-50 border-[#E6EEF7] text-[#163A66]'
            }`}
            title="ดูประวัติการแจกรางวัลในคาบนี้ (แท็บ 4)"
          >
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">แจกในคาบ:</span>
            <span className="font-bold text-amber-500">🪙 {sessionCoins}</span>
            <span className="text-slate-400">|</span>
            <span className="font-bold text-pink-500">🎟️ {sessionTickets}</span>
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
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
                <Minimize2 className="w-4 h-4" />
                <span>ย่อหน้าจอ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-blue-500" />
                <span>โหมดฉายจอใหญ่</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-tool Navigation (4 Tabs) */}
      <nav
        className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-4 border-t ${
          isProjectorMode ? 'border-slate-800' : 'border-[#E6EEF7]'
        }`}
      >
        {[
          { id: 'picker', label: '🎯 สุ่มชื่อนักเรียน', icon: Dices },
          { id: 'timer', label: '⏱️ ตอบคำถามสด', icon: Timer },
          { id: 'groups', label: '👥 แบ่งกลุ่มกิจกรรม', icon: Users },
          { id: 'rewards', label: '🏆 บอร์ดรางวัล', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as SubTab)}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                  : isProjectorMode
                  ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'bg-[#F7FAFF] text-[#6B7C93] hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
