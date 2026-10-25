// src/components/live-classroom/RandomPickerSubTab.tsx
// แท็บที่ 1: สุ่มชื่อนักเรียน (Slot Reel & Card Flip) พร้อมระบบตัดชื่อคนซ้ำ, ให้รางวัลด่วน (+1🪙, +3🪙, +1🎟️),
// จับเวลาจริงแม่นยำระดับมิลลิวินาที (1.5s / 3.0s / 5.0s เป๊ะ) และไอคอนสไตล์ Pastel Anime

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import RandomRegular from '@mingcute/react/core-regular/random';
import Refresh1Regular from '@mingcute/react/core-regular/refresh-1';
import Coin2Regular from '@mingcute/react/core-regular/coin-2';
import TicketRegular from '@mingcute/react/core-regular/ticket';
import CheckCircleRegular from '@mingcute/react/core-regular/check-circle';
import CloseRegular from '@mingcute/react/core-regular/close';
import { Crown, SkipForward } from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import { tts, type JapanesePraise } from '../../utils/speechTTS';

export type SpinSpeed = 'fast' | 'normal' | 'dramatic';

export interface RandomPickerSubTabProps {
  students: LiveStudent[];
  classroomId?: string;
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
  classroomId,
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
  const [spinSpeed, setSpinSpeed] = useState<SpinSpeed>('normal');
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [cardDeck, setCardDeck] = useState<LiveStudent[]>([]);
  const [flippedStudentId, setFlippedStudentId] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [selectedPraise, setSelectedPraise] = useState<JapanesePraise>('sugoi');

  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelSpinTimers = useCallback(() => {
    spinTimersRef.current.forEach(clearTimeout);
    spinTimersRef.current = [];
    setIsSpinning(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelSpinTimers();
    };
  }, [cancelSpinTimers]);

  const presentStudents = useMemo(() => students.filter((s) => s.present), [students]);

  // กองรายชื่อที่พร้อมให้สุ่ม (ไม่ซ้ำคนที่ถูกเลือกไปแล้วในคาบนี้)
  const availablePool = useMemo(() => {
    return getAvailablePool(students, pickedIds, noRepeat);
  }, [students, pickedIds, noRepeat]);

  // รีเซ็ตกองสุ่มและสำรับการ์ดเมื่อห้องเรียนเปลี่ยน
  useEffect(() => {
    cancelSpinTimers();
    setPickedIds([]);
    setSelectedStudent(null);
    setRollingStudent(null);
    setFlippedStudentId(null);
    setCardDeck([]);
  }, [classroomId, cancelSpinTimers, setSelectedStudent, setRollingStudent]);

  // เตรียมสำรับการ์ด 8 ใบเมื่อเปิดโหมดการ์ด หรือเมื่อสำรับการ์ดหมด
  useEffect(() => {
    if (pickerMode === 'card' && cardDeck.length === 0 && availablePool.length > 0) {
      setCardDeck(availablePool.slice(0, 8));
    }
  }, [pickerMode, cardDeck.length, availablePool]);

  const dealNewCardDeck = () => {
    setFlippedStudentId(null);
    setCardDeck(availablePool.slice(0, 8));
    onPlaySound?.('tick', 600);
  };

  const handleRandomPick = useCallback(() => {
    if (isSpinning || availablePool.length === 0) return;

    cancelSpinTimers();
    setIsSpinning(true);
    setFlippedStudentId(null);

    const winner = availablePool[Math.floor(Math.random() * availablePool.length)];

    // ระยะเวลาจริงระดับมิลลิวินาที 100% ตรงตามที่ครูเลือก (1.5s / 3.0s / 5.0s เป๊ะ ไม่เกินแน่นอน)
    const targetDurationMs = {
      fast: 1500,     // 1.5 วินาที
      normal: 3000,   // 3.0 วินาที
      dramatic: 5000, // 5.0 วินาที
    }[spinSpeed];

    const totalTicks = {
      fast: 14,
      normal: 22,
      dramatic: 30,
    }[spinSpeed];

    // ทยอยสุ่มเปลี่ยนชื่อแบบ Quadratic Deceleration Curve
    for (let i = 1; i < totalTicks; i++) {
      const progress = i / totalTicks;
      const scheduledTime = Math.pow(progress, 1.9) * targetDurationMs;
      const timer = setTimeout(() => {
        const randomPreview = presentStudents[Math.floor(Math.random() * presentStudents.length)];
        setRollingStudent(randomPreview);
        onPlaySound?.('tick', 450 + i * 15);
      }, scheduledTime);
      spinTimersRef.current.push(timer);
    }

    // Tick สุดท้ายหยุดที่เป้าหมายเวลาจริงเป๊ะ (1.5s, 3.0s, 5.0s) พร้อมประกาศผู้ชนะและเสียงดนตรี
    const finalTimer = setTimeout(() => {
      setRollingStudent(winner);
      setSelectedStudent(winner);
      if (noRepeat) {
        setPickedIds((prev) => (prev.includes(winner.id) ? prev : [...prev, winner.id]));
      }
      setIsSpinning(false);
      onPlaySound?.('fanfare');

      // 🔊 อ่านชื่อภาษาไทยและพูดคำชมภาษาญี่ปุ่นอัตโนมัติ
      if (ttsEnabled) {
        tts.speakStudentName(winner.number, winner.name, true);
        const praiseTimer = setTimeout(() => {
          tts.speakJapanesePraise(selectedPraise, true);
        }, 1200);
        spinTimersRef.current.push(praiseTimer);
      }
    }, targetDurationMs);
    spinTimersRef.current.push(finalTimer);
  }, [
    isSpinning,
    availablePool,
    presentStudents,
    spinSpeed,
    noRepeat,
    ttsEnabled,
    selectedPraise,
    cancelSpinTimers,
    setRollingStudent,
    setSelectedStudent,
    onPlaySound,
  ]);

  // Hotkey สำหรับกด Spacebar สุ่มชื่อในโหมด Slot Reel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && pickerMode === 'slot') {
        e.preventDefault();
        handleRandomPick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pickerMode, handleRandomPick]);

  const handleSkipStudent = () => {
    if (!selectedStudent) return;
    setPickedIds((prev) => restoreSkippedStudent(prev, selectedStudent.id));
    if (flippedStudentId === selectedStudent.id) {
      setFlippedStudentId(null);
    }
    setSelectedStudent(null);
    setRollingStudent(null);
  };

  const handleResetPool = () => {
    setPickedIds([]);
    setSelectedStudent(null);
    setRollingStudent(null);
    setFlippedStudentId(null);
    setCardDeck([]);
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

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
              }`}
            >
              เวลาการสุ่ม:
            </span>
            <select
              value={spinSpeed}
              onChange={(e) => setSpinSpeed(e.target.value as SpinSpeed)}
              disabled={isSpinning}
              className={`rounded-xl px-3 py-1.5 font-semibold text-xs transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              <option value="fast">⚡ ด่วน (1.5 วินาที)</option>
              <option value="normal">🎲 ปกติ (3.0 วินาที)</option>
              <option value="dramatic">🎭 ลุ้นระทึก (5.0 วินาที)</option>
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
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold border transition ${
            isProjectorMode
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-[#F7FAFF] hover:bg-slate-100 border-[#E6EEF7] text-[#6B7C93]'
          }`}
        >
          <Refresh1Regular className="w-4 h-4 text-slate-400" />
          <span>รีเซ็ตรายชื่อสุ่ม</span>
        </button>
      </div>

      {/* TTS Speech & Japanese Praise Control Bar */}
      <div
        className={`rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-[#F7FAFF] border-[#E6EEF7]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3.5">
          {/* TTS Enable Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span
              className={`font-bold flex items-center gap-1.5 ${
                isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
              }`}
            >
              <span>🗣️ อ่านชื่อนักเรียนอัตโนมัติ (TTS)</span>
            </span>
          </label>

          {/* Japanese Praise Selector */}
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
              }`}
            >
              คำชมภาษาญี่ปุ่น:
            </span>
            <select
              value={selectedPraise}
              onChange={(e) => setSelectedPraise(e.target.value as JapanesePraise)}
              className={`rounded-xl px-3 py-1 font-bold text-xs border transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-amber-300'
                  : 'bg-white border-[#BFDBFE] text-indigo-700'
              }`}
            >
              <option value="sugoi">🌸 Sugoi! (すごい - ยอดเยี่ยม!)</option>
              <option value="yatta">🎉 Yatta! (やった - สำเร็จแล้ว!)</option>
              <option value="excellent">⭐ Subarashii! (すばらしい - วิเศษมาก!)</option>
            </select>
          </div>
        </div>

        {/* Test Speech Button */}
        <button
          type="button"
          onClick={() => {
            const sampleStudent = presentStudents[0] || { number: 1, name: 'สมชาย ใจดี' };
            tts.speakStudentName(sampleStudent.number || 1, sampleStudent.name, true);
            const praiseTimer = setTimeout(() => {
              tts.speakJapanesePraise(selectedPraise, true);
            }, 1200);
            spinTimersRef.current.push(praiseTimer);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition active:scale-95"
          title="ทดลองกดฟังเสียงอ่านชื่อและคำชมภาษาญี่ปุ่น"
        >
          <span>🔊 ทดสอบเสียงพูด</span>
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
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center mx-auto text-blue-500 shadow-sm">
              <RandomRegular className="w-8 h-8" />
            </div>
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
                <div className="py-8 space-y-3 text-slate-400">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200/80 flex items-center justify-center mx-auto text-blue-500 shadow-sm">
                    <RandomRegular className="w-8 h-8" />
                  </div>
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
              className="mt-8 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-lg px-9 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition transform active:scale-95"
            >
              <RandomRegular className="w-6 h-6" />
              <span>
                {isSpinning
                  ? 'กำลังหมุนสุ่ม...'
                  : availablePool.length === 0
                  ? 'สุ่มครบทุกคนแล้ว! (กดรีเซ็ตด้านบน)'
                  : 'สุ่มชื่อนักเรียน (Spacebar)'}
              </span>
            </button>
          </>
        ) : (
          /* Card Flip Grid Mode (Stable Card Deck to prevent hopping/switching bug) */
          <div className="w-full max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <p
                className={`font-semibold text-sm ${
                  isProjectorMode ? 'text-slate-300' : 'text-[#163A66]'
                }`}
              >
                คลิกเปิดการ์ด 1 ใบเพื่อสุ่มตัวแทนนักเรียน (เหลือกองสุ่ม {availablePool.length} คน)
              </p>
              {availablePool.length > 0 && (
                <button
                  onClick={dealNewCardDeck}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition active:scale-95 ${
                    isProjectorMode
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-300'
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                  }`}
                >
                  <RandomRegular className="w-3.5 h-3.5" />
                  <span>แจกการ์ดชุดใหม่ (8 ใบ)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cardDeck.map((st, idx) => {
                const isFlipped = flippedStudentId === st.id;
                const isPickedInPast = pickedIds.includes(st.id) && !isFlipped;
                return (
                  <button
                    key={st.id}
                    disabled={isPickedInPast}
                    onClick={() => {
                      setFlippedStudentId(st.id);
                      setSelectedStudent(st);
                      setRollingStudent(st);
                      if (noRepeat) {
                        setPickedIds((prev) => (prev.includes(st.id) ? prev : [...prev, st.id]));
                      }
                      onPlaySound?.('fanfare');

                      if (ttsEnabled) {
                        tts.speakStudentName(st.number, st.name, true);
                        const praiseTimer = setTimeout(() => {
                          tts.speakJapanesePraise(selectedPraise, true);
                        }, 1200);
                        spinTimersRef.current.push(praiseTimer);
                      }
                    }}
                    className={`h-36 rounded-2xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 ${
                      isFlipped
                        ? 'border-amber-400 bg-blue-900 text-white scale-105 shadow-xl'
                        : isPickedInPast
                        ? 'opacity-35 border-slate-700 bg-slate-800/40 cursor-not-allowed'
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
                        <span className="text-[11px] text-emerald-400 font-bold mt-1">
                          ✓ ผู้ได้รับเลือก
                        </span>
                      </>
                    ) : isPickedInPast ? (
                      <>
                        <CheckCircleRegular className="w-7 h-7 text-slate-400 mb-1" />
                        <span className="font-bold text-xs text-slate-400">
                          เปิดแล้ว
                        </span>
                      </>
                    ) : (
                      <>
                        <SparklesRegular className="w-8 h-8 text-blue-500 mb-2" />
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
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-300 text-amber-600 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <Coin2Regular className="w-4 h-4 text-amber-500" />
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
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            <Coin2Regular className="w-4 h-4" />
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
            className="flex items-center gap-1.5 bg-pink-500/15 hover:bg-pink-500/25 disabled:opacity-40 border border-pink-300 text-pink-600 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <TicketRegular className="w-4 h-4 text-pink-500" />
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
                  <CloseRegular className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <CheckCircleRegular className="w-3.5 h-3.5 text-emerald-500" />
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
