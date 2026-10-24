// src/components/live-classroom/RandomPickerSubTab.tsx
// แท็บที่ 1: สุ่มชื่อนักเรียน (Slot Reel & Card Flip) พร้อมระบบตัดชื่อคนซ้ำ, ให้รางวัลด่วน (+1🪙, +3🪙, +1🎟️),
// และแถบจัดการสถานะการมาเรียนด่วนแบบ Optimistic UI

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dices,
  RotateCcw,
  Crown,
  Sparkles,
  Coins,
  Ticket,
  SkipForward,
  CheckCircle2,
  UserX,
} from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';

export interface RandomPickerSubTabProps {
  students: LiveStudent[];
  isProjectorMode: boolean;
  selectedStudent: LiveStudent | null;
  setSelectedStudent: (student: LiveStudent | null) => void;
  rollingStudent: LiveStudent | null;
  setRollingStudent: (student: LiveStudent | null) => void;
  onGiveReward: (
    studentIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  onToggleAttendance: (studentId: string) => Promise<void>;
  syncingAttendanceIds: string[];
}

export function getAvailablePool(
  students: LiveStudent[],
  pickedIds: string[],
  noRepeat: boolean
): LiveStudent[] {
  const presentStudents = students.filter((s) => s.present);
  if (!noRepeat) return presentStudents;
  return presentStudents.filter((s) => !pickedIds.includes(s.id));
}

export function restoreSkippedStudent(pickedIds: string[], studentId: string): string[] {
  return pickedIds.filter((id) => id !== studentId);
}

export const RandomPickerSubTab: React.FC<RandomPickerSubTabProps> = ({
  students,
  isProjectorMode,
  selectedStudent,
  setSelectedStudent,
  rollingStudent,
  setRollingStudent,
  onGiveReward,
  onPlaySound,
  onToggleAttendance,
  syncingAttendanceIds,
}) => {
  const [pickerMode, setPickerMode] = useState<'slot' | 'card'>('slot');
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);

  const presentStudents = useMemo(() => students.filter((s) => s.present), [students]);

  // กองรายชื่อที่พร้อมให้สุ่ม (ไม่ซ้ำคนที่ถูกเลือกไปแล้วในคาบนี้)
  const availablePool = useMemo(() => {
    return getAvailablePool(students, pickedIds, noRepeat);
  }, [students, pickedIds, noRepeat]);

  const handleRandomPick = useCallback(() => {
    if (isSpinning || availablePool.length === 0) return;

    setIsSpinning(true);
    setFlippedCardIndex(null);

    const winner = availablePool[Math.floor(Math.random() * availablePool.length)];
    let steps = 0;
    const totalSteps = 22;

    const runStep = () => {
      steps++;
      const randomPreview = presentStudents[Math.floor(Math.random() * presentStudents.length)];
      setRollingStudent(randomPreview);
      onPlaySound?.('tick', 450 + steps * 15);

      if (steps < totalSteps) {
        const delay = 40 + Math.pow(steps, 1.65) * 2.5;
        setTimeout(runStep, delay);
      } else {
        setRollingStudent(winner);
        setSelectedStudent(winner);
        if (noRepeat) {
          setPickedIds((prev) => (prev.includes(winner.id) ? prev : [...prev, winner.id]));
        }
        setIsSpinning(false);
        onPlaySound?.('fanfare');
      }
    };

    runStep();
  }, [isSpinning, availablePool, presentStudents, noRepeat, setRollingStudent, setSelectedStudent, onPlaySound]);

  const handleSkipStudent = () => {
    if (!selectedStudent) return;
    setPickedIds((prev) => restoreSkippedStudent(prev, selectedStudent.id));
    setSelectedStudent(null);
    setRollingStudent(null);
  };

  const handleResetPool = () => {
    setPickedIds([]);
    setSelectedStudent(null);
    setRollingStudent(null);
    setFlippedCardIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Top Filter Controls Bar */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border border-slate-800'
            : 'bg-white border border-[#E6EEF7]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
              }`}
            >
              โหมดแสดงผล:
            </span>
            <select
              value={pickerMode}
              onChange={(e) => setPickerMode(e.target.value as 'slot' | 'card')}
              className={`rounded-xl px-3 py-1.5 font-semibold text-xs transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              <option value="slot">🎰 สล็อตแมชชีน (Slot Reel)</option>
              <option value="card">🃏 สุ่มเปิดการ์ด (Card Flip)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span
              className={`text-xs font-semibold ${
                isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
              }`}
            >
              ไม่สุ่มซ้ำในคาบนี้ (เหลือ{' '}
              <strong className="text-blue-500 font-extrabold">{availablePool.length}</strong>/
              {presentStudents.length} คน)
            </span>
          </label>
        </div>

        <button
          onClick={handleResetPool}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition ${
            isProjectorMode
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-[#F7FAFF] hover:bg-slate-100 border-[#E6EEF7] text-[#6B7C93]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ตรายชื่อสุ่ม</span>
        </button>
      </div>

      {/* Center Stage: Slot Reel or Card Flip */}
      <div
        className={`flex-1 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px] border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        {presentStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Dices className="w-16 h-16 mx-auto opacity-30 text-blue-500" />
            <h3 className="text-xl font-bold text-[#163A66]">ไม่พบนักเรียนที่มีสถานะมาเรียน</h3>
            <p className="text-xs text-slate-400">
              กรุณาเช็กสถานะการมาเรียนในแถบด้านล่าง หรือเลือกห้องเรียนที่มีนักเรียนค่ะ
            </p>
          </div>
        ) : pickerMode === 'slot' ? (
          <>
            {/* Slot Display Box */}
            <div
              className={`w-full max-w-2xl rounded-3xl border-2 p-10 text-center transition-all duration-300 ${
                isSpinning
                  ? 'border-blue-500/60 shadow-2xl scale-[1.01]'
                  : selectedStudent
                  ? 'border-amber-400 shadow-2xl scale-[1.02] bg-gradient-to-b from-amber-500/10 to-blue-500/10'
                  : isProjectorMode
                  ? 'border-slate-800 bg-slate-900/80'
                  : 'border-[#BFDBFE] bg-[#F7FAFF]'
              }`}
            >
              {rollingStudent ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-500 px-4 py-1 rounded-full text-sm font-bold">
                    <Crown className="w-4 h-4" />
                    <span>รหัสนักเรียน {rollingStudent.studentCode}</span>
                  </div>
                  <h2
                    className={`font-black tracking-tight transition-all ${
                      isProjectorMode ? 'text-white' : 'text-[#163A66]'
                    } ${isProjectorMode ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`}
                  >
                    {rollingStudent.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-600">
                    สถานะ: มาเรียน • (🪙 {rollingStudent.sessionCoins} | 🎟️{' '}
                    {rollingStudent.sessionTickets})
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-2 text-slate-400">
                  <Dices className="w-16 h-16 mx-auto opacity-30 text-blue-500" />
                  <p
                    className={`text-2xl font-bold ${
                      isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
                    }`}
                  >
                    พร้อมสุ่มรายชื่อผู้โชคดี
                  </p>
                  <p className="text-xs text-slate-400">
                    กดปุ่มด้านล่าง หรือกด Spacebar เพื่อเริ่มหมุนสล็อต
                  </p>
                </div>
              )}
            </div>

            {/* Spin Trigger Button */}
            <button
              onClick={handleRandomPick}
              disabled={isSpinning || availablePool.length === 0}
              className="mt-8 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-lg px-9 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition transform active:scale-95"
            >
              <Dices className="w-6 h-6" />
              <span>
                {isSpinning
                  ? 'กำลังหมุนสุ่ม...'
                  : availablePool.length === 0
                  ? 'สุ่มครบทุกคนแล้ว! (กดรีเซ็ตด้านบน)'
                  : '🎲 สุ่มชื่อนักเรียน (Spacebar)'}
              </span>
            </button>
          </>
        ) : (
          /* Card Flip Grid Mode */
          <div className="w-full max-w-4xl">
            <p
              className={`text-center mb-6 font-semibold text-sm ${
                isProjectorMode ? 'text-slate-300' : 'text-[#163A66]'
              }`}
            >
              คลิกเปิดการ์ด 1 ใบเพื่อสุ่มตัวแทนนักเรียน (เหลือ {availablePool.length} ใบ)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availablePool.slice(0, 8).map((st, idx) => {
                const isFlipped = flippedCardIndex === idx;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setFlippedCardIndex(idx);
                      setSelectedStudent(st);
                      setRollingStudent(st);
                      if (noRepeat) {
                        setPickedIds((prev) => (prev.includes(st.id) ? prev : [...prev, st.id]));
                      }
                      onPlaySound?.('fanfare');
                    }}
                    className={`h-36 rounded-2xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 ${
                      isFlipped
                        ? 'border-amber-400 bg-blue-900 text-white scale-105 shadow-xl'
                        : isProjectorMode
                        ? 'border-slate-700 bg-slate-800/80 hover:border-blue-400 hover:-translate-y-1'
                        : 'border-[#E6EEF7] bg-[#F7FAFF] hover:border-blue-400 hover:-translate-y-1'
                    }`}
                  >
                    {isFlipped ? (
                      <>
                        <span className="text-xs font-bold text-amber-300">
                          #{st.studentCode}
                        </span>
                        <span className="font-bold text-sm mt-1 text-center line-clamp-2">
                          {st.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-8 h-8 text-blue-500 mb-2" />
                        <span
                          className={`font-bold text-xs ${
                            isProjectorMode ? 'text-slate-300' : 'text-[#163A66]'
                          }`}
                        >
                          การ์ดใบที่ {idx + 1}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instant Action Dock */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${
              isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
            }`}
          >
            ให้รางวัลด่วน:
          </span>
          {selectedStudent ? (
            <span className="text-xs font-bold text-amber-500">
              ({selectedStudent.name})
            </span>
          ) : (
            <span className="text-xs text-slate-400">(สุ่มชื่อก่อนเพื่อให้รางวัล)</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            disabled={!selectedStudent || isSpinning}
            onClick={() =>
              selectedStudent &&
              onGiveReward(
                [selectedStudent.id],
                'coin',
                1,
                `${selectedStudent.name} ตอบคำถาม`
              )
            }
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-amber-500 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <Coins className="w-4 h-4" />
            <span>+1 เหรียญ</span>
          </button>

          <button
            disabled={!selectedStudent || isSpinning}
            onClick={() =>
              selectedStudent &&
              onGiveReward(
                [selectedStudent.id],
                'coin',
                3,
                `${selectedStudent.name} ตอบคำถามยอดเยี่ยม`
              )
            }
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <Coins className="w-4 h-4" />
            <span>+3 เหรียญ</span>
          </button>

          <button
            disabled={!selectedStudent || isSpinning}
            onClick={() =>
              selectedStudent &&
              onGiveReward(
                [selectedStudent.id],
                'ticket',
                1,
                `${selectedStudent.name} ได้ตั๋วสุ่มรางวัล`
              )
            }
            className="flex items-center gap-1.5 bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-40 border border-pink-500/40 text-pink-500 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <Ticket className="w-4 h-4" />
            <span>+1 ตั๋วสุ่ม</span>
          </button>

          <button
            disabled={!selectedStudent || isSpinning}
            onClick={handleSkipStudent}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isProjectorMode
                ? 'bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border-slate-200 text-[#163A66]'
            }`}
          >
            <SkipForward className="w-4 h-4" />
            <span>ข้าม / ไม่อยู่</span>
          </button>
        </div>
      </div>

      {/* Attendance Quick Fallback Accordion */}
      <details
        className={`rounded-2xl p-3 text-xs border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-[#E6EEF7]'
        }`}
      >
        <summary className="cursor-pointer font-semibold text-[#163A66] hover:text-blue-600 flex items-center justify-between">
          <span>⚙️ จัดการรายชื่อนักเรียนที่มาเรียนในคาบนี้ด่วน (คลิกเพื่อสลับ มาเรียน / ขาดเรียน)</span>
          <span className="text-emerald-600 font-bold">
            มาเรียน {presentStudents.length}/{students.length} คน
          </span>
        </summary>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {students.map((st) => {
            const isSyncing = syncingAttendanceIds.includes(st.id);
            return (
              <button
                key={st.id}
                disabled={isSyncing}
                onClick={() => onToggleAttendance(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                  st.present
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through hover:border-slate-300'
                } ${isSyncing ? 'opacity-60 cursor-wait' : ''}`}
              >
                {isSyncing ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : !st.present ? (
                  <UserX className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
};
