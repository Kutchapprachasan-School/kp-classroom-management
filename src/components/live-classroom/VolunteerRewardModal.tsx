// src/components/live-classroom/VolunteerRewardModal.tsx
// หน้าต่างให้รางวัลนักเรียนกรณีอาสาตอบคำถามเองในหน้า Live สอน
// ให้น้ำหนักกับความกล้าแสดงออก มอบเหรียญ (+1🪙, +3🪙) หรือตั๋วสุ่มรางวัล (+1🎟️) ได้ทันที

import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Coins, Ticket, Check, Volume2 } from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import { tts } from '../../utils/speechTTS';

export interface VolunteerRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: LiveStudent[];
  isProjectorMode: boolean;
  onGiveReward: (
    studentIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle', freq?: number) => void;
  onOpenLuckyDraw?: (studentId: string) => void;
}

export const VolunteerRewardModal: React.FC<VolunteerRewardModalProps> = ({
  isOpen,
  onClose,
  students,
  isProjectorMode,
  onGiveReward,
  onPlaySound,
  onOpenLuckyDraw,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentRewardedId, setRecentRewardedId] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  const presentStudents = useMemo(() => {
    return students.filter((s) => s.present);
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return presentStudents;
    const q = searchQuery.toLowerCase().trim();
    return presentStudents.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchNum = String(s.number) === q || String(s.number).padStart(2, '0') === q;
      const matchCode = s.studentCode.includes(q);
      return matchName || matchNum || matchCode;
    });
  }, [presentStudents, searchQuery]);

  if (!isOpen) return null;

  const handleReward = (
    student: LiveStudent,
    type: 'coin' | 'ticket',
    amount: number,
    label: string
  ) => {
    onPlaySound?.(type === 'coin' ? 'coin' : 'fanfare');
    onGiveReward(
      [student.id],
      type,
      amount,
      `🙋‍♂️ ${student.name} อาสาตอบคำถาม (${label})`
    );
    setRecentRewardedId(student.id);

    if (ttsEnabled) {
      tts.speakStudentName(student.number, student.name, true);
      setTimeout(() => {
        tts.speakJapanesePraise('sugoi', true);
      }, 1000);
    }

    setTimeout(() => {
      setRecentRewardedId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div
        className={`w-full max-w-2xl rounded-3xl border flex flex-col max-h-[90vh] shadow-2xl overflow-hidden transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-[#E6EEF7] text-[#163A66]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isProjectorMode
              ? 'bg-slate-800/80 border-slate-700'
              : 'bg-gradient-to-r from-blue-50/90 via-white to-amber-50/70 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs text-lg">
              🙋‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  นักเรียนอาสาตอบคำถาม (Volunteer Reward)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  +ความกล้าแสดงออก
                </span>
              </div>
              <p className="text-xs text-[#6B7C93] mt-0.5">
                เลือกนักเรียนที่ยกมืออาสาตอบในคาบเรียน แล้วกดมอบเหรียญหรือตั๋วสุ่มรางวัลได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & TTS Switch */}
        <div
          className={`p-3.5 sm:px-5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isProjectorMode ? 'bg-slate-800/40 border-slate-800' : 'bg-[#F7FAFF] border-slate-100'
          }`}
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์เลขที่ (เช่น 1, 15) หรือชื่อนักเรียน..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3B82F6] border ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-[#163A66]'
              }`}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#6B7C93]">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <Volume2 className="w-3.5 h-3.5 text-blue-500" />
            <span>อ่านชื่อ & กล่าวชม (TTS)</span>
          </label>
        </div>

        {/* Student List Grid */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {searchQuery ? `ไม่พบนักเรียนที่ค้นหา "${searchQuery}"` : 'ไม่พบนักเรียนที่มาเรียนในคาบนี้'}
            </div>
          ) : (
            filteredStudents.map((st) => {
              const isRecent = recentRewardedId === st.id;
              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isRecent
                      ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-400/30'
                      : isProjectorMode
                      ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  {/* Student Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                        isProjectorMode
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-blue-50 text-[#3B82F6] border border-blue-200/60'
                      }`}
                    >
                      {st.number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm truncate">{st.name}</span>
                        {isRecent && (
                          <span className="px-2 py-0.2 rounded-md bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>ได้รับรางวัลแล้ว</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B7C93] mt-0.5">
                        <span>#{st.studentCode}</span>
                        <span>•</span>
                        <span className="text-amber-500 font-semibold">{st.sessionCoins} 🪙</span>
                        <span>•</span>
                        <span className="text-pink-500 font-semibold">{st.sessionTickets} 🎟️</span>
                      </div>
                    </div>
                  </div>

                  {/* Reward Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleReward(st, 'coin', 1, '+1 เหรียญ')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title="มอบ 1 เหรียญให้อาสาตอบ"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>+1 🪙</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReward(st, 'coin', 3, '+3 เหรียญยอดเยี่ยม')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="มอบ 3 เหรียญให้อาสาตอบยอดเยี่ยม"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-900" />
                      <span>+3 🪙 ยอดเยี่ยม</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReward(st, 'ticket', 1, '+1 ตั๋วสุ่มรางวัล')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title="มอบ 1 ตั๋วสุ่มรางวัลให้อาสาตอบ"
                    >
                      <Ticket className="w-3.5 h-3.5 text-pink-500" />
                      <span>+1 🎟️ ตั๋วสุ่ม</span>
                    </button>

                    {onOpenLuckyDraw && (st.sessionTickets > 0 || st.totalTickets > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLuckyDraw(st.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="หมุนวงล้อ Lucky Draw ทันที"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>หมุนรางวัล</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isProjectorMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <span className="text-[#6B7C93]">
            นักเรียนที่มาเรียนทั้งหมด: <strong className="text-[#163A66]">{presentStudents.length} คน</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-white cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
