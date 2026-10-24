// src/components/live-classroom/LiveTimerSubTab.tsx
// แท็บที่ 2: นาฬิกาจับเวลากิจกรรมฉายจอใหญ่ พร้อมหลอดสถานะสี และโหมดท้าดวลตอบคำถาม (Quick Versus Arena)

import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Swords,
  Trophy,
  Shuffle,
} from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';

export interface LiveTimerSubTabProps {
  students: LiveStudent[];
  isProjectorMode: boolean;
  challengers: LiveStudent[];
  setChallengers: React.Dispatch<React.SetStateAction<LiveStudent[]>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  onGiveReward: (
    studentIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
}

export function formatTimerMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const LiveTimerSubTab: React.FC<LiveTimerSubTabProps> = ({
  students,
  isProjectorMode,
  challengers,
  setChallengers,
  isTimerRunning,
  setIsTimerRunning,
  onGiveReward,
  onPlaySound,
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(120);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
  const [versusCount, setVersusCount] = useState<number>(2);
  const [awardedChallengerId, setAwardedChallengerId] = useState<string | null>(null);

  const presentStudents = students.filter((s) => s.present);

  // นาฬิกานับถอยหลัง (Interval Effect ปราศจาก Side-effect ซ้อนใน State Updater)
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        if (prev <= 11) {
          onPlaySound?.('tick', 880);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, onPlaySound]);

  // เมื่อเวลาหมด (แตะ 0 ขณะที่กำลังจับเวลา) ให้หยุดและส่งเสียงกริ่งหมดเวลา Buzzer
  useEffect(() => {
    if (isTimerRunning && remainingSeconds === 0) {
      setIsTimerRunning(false);
      onPlaySound?.('buzzer');
    }
  }, [isTimerRunning, remainingSeconds, onPlaySound, setIsTimerRunning]);

  const addTimerSeconds = (sec: number) => {
    setTotalSeconds((prev) => Math.max(prev + sec, remainingSeconds + sec));
    setRemainingSeconds((prev) => prev + sec);
  };

  const resetTimer = (newSec = totalSeconds) => {
    setIsTimerRunning(false);
    setTotalSeconds(newSec);
    setRemainingSeconds(newSec);
  };

  const handleToggleTimer = () => {
    if (!isTimerRunning && remainingSeconds <= 0) {
      const resetSec = totalSeconds > 0 ? totalSeconds : 120;
      setTotalSeconds(resetSec);
      setRemainingSeconds(resetSec);
      setIsTimerRunning(true);
      return;
    }
    setIsTimerRunning((prev) => !prev);
  };

  const pickChallengers = useCallback(() => {
    if (presentStudents.length < versusCount) return;
    const shuffled = [...presentStudents].sort(() => Math.random() - 0.5);
    setChallengers(shuffled.slice(0, versusCount));
    setAwardedChallengerId(null);
    onPlaySound?.('fanfare');
  }, [presentStudents, versusCount, onPlaySound, setChallengers]);

  const timerProgressPercent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Projector Countdown Timer */}
      <div
        className={`rounded-3xl p-8 flex flex-col justify-between border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-lg font-bold flex items-center gap-2 ${
              isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
            }`}
          >
            <Timer className="w-5 h-5 text-blue-500" />
            <span>นาฬิกาจับเวลากิจกรรม</span>
          </h3>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
            กด Spacebar เพื่อ เริ่ม/พัก
          </span>
        </div>

        {/* Giant Digits */}
        <div className="my-8 text-center">
          <div
            className={`font-mono font-black tracking-wider transition-colors ${
              isProjectorMode ? 'text-8xl md:text-9xl' : 'text-7xl md:text-8xl'
            } ${
              remainingSeconds <= 10 && remainingSeconds > 0
                ? 'text-rose-500 animate-pulse'
                : remainingSeconds <= totalSeconds * 0.3
                ? 'text-amber-500'
                : 'text-emerald-500'
            }`}
          >
            {formatTimerMMSS(remainingSeconds)}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-6">
            <div
              className={`h-full transition-all duration-500 ${
                remainingSeconds <= 10
                  ? 'bg-rose-500'
                  : remainingSeconds <= totalSeconds * 0.3
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${timerProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Time Presets & Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: '+30 วินาที', sec: 30 },
              { label: '+1 นาที', sec: 60 },
              { label: '+3 นาที', sec: 180 },
              { label: '+5 นาที', sec: 300 },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => addTimerSeconds(btn.sec)}
                className={`border text-xs font-semibold px-3.5 py-1.5 rounded-xl transition ${
                  isProjectorMode
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-[#F7FAFF] hover:bg-blue-50 border-[#E6EEF7] text-[#163A66]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 font-bold px-7 py-3 rounded-2xl text-base transition shadow-md ${
                isTimerRunning
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 font-black shadow-amber-400/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>พักเวลา</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>เริ่มจับเวลา</span>
                </>
              )}
            </button>

            <button
              onClick={() => resetTimer(120)}
              className={`flex items-center gap-2 font-bold px-5 py-3 rounded-2xl text-base border transition ${
                isProjectorMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-[#E6EEF7] text-[#163A66]'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              <span>รีเซ็ต (02:00)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Quick Versus Arena */}
      <div
        className={`rounded-3xl p-8 flex flex-col justify-between border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            className={`text-lg font-bold flex items-center gap-2 ${
              isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
            }`}
          >
            <Swords className="w-5 h-5 text-amber-500" />
            <span>โหมดท้าดวลตอบคำถาม (Quick Versus)</span>
          </h3>

          <select
            value={versusCount}
            onChange={(e) => setVersusCount(Number(e.target.value))}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              isProjectorMode
                ? 'bg-slate-800 border border-slate-700 text-slate-100'
                : 'bg-[#F7FAFF] border border-[#E2E8F0] text-[#163A66]'
            }`}
          >
            <option value={2}>ดวลคู่ (2 คน)</option>
            <option value={3}>ดวล 3 คน</option>
            <option value={4}>ดวล 4 คน</option>
          </select>
        </div>

        {/* Challengers Arena */}
        <div className="my-6 flex-1 flex items-center justify-center">
          {challengers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {challengers.map((ch, idx) => (
                <div
                  key={ch.id}
                  className={`border-2 rounded-2xl p-5 flex flex-col items-center justify-between text-center gap-3 transition-all ${
                    isProjectorMode
                      ? 'bg-slate-800/90 border-slate-700'
                      : 'bg-[#F7FAFF] border-[#BFDBFE]'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-0.5 rounded-full">
                    ผู้ท้าชิง {idx + 1} • #{ch.studentCode}
                  </span>
                  <h4
                    className={`text-xl font-black ${
                      isProjectorMode ? 'text-white' : 'text-[#163A66]'
                    }`}
                  >
                    {ch.name}
                  </h4>
                  <button
                    disabled={awardedChallengerId === ch.id}
                    onClick={() => {
                      if (awardedChallengerId === ch.id) return;
                      setAwardedChallengerId(ch.id);
                      onPlaySound?.('fanfare');
                      onGiveReward(
                        [ch.id],
                        'coin',
                        2,
                        `${ch.name} ชนะการดวลตอบคำถาม`
                      );
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 font-extrabold py-2 px-3 rounded-xl text-xs transition active:scale-95 shadow-md ${
                      awardedChallengerId === ch.id
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-amber-400 hover:bg-amber-300 text-amber-950 font-black'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>
                      {awardedChallengerId === ch.id ? 'ได้รับรางวัลแล้ว (+2 🪙)' : 'ชนะดวล (+2 🪙)'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 space-y-2">
              <Swords className="w-14 h-14 mx-auto opacity-30 text-amber-500" />
              <p
                className={`text-base font-semibold ${
                  isProjectorMode ? 'text-slate-300' : 'text-[#163A66]'
                }`}
              >
                ยังไม่ได้สุ่มคู่ท้าดวลขึ้นเวที
              </p>
              <p className="text-xs text-slate-400">
                กดปุ่มด้านล่างเพื่อสุ่มตัวแทนนักเรียนขึ้นมาแข่งตอบคำถาม
              </p>
            </div>
          )}
        </div>

        <button
          onClick={pickChallengers}
          disabled={presentStudents.length < versusCount}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 transition active:scale-95"
        >
          <Shuffle className="w-5 h-5" />
          <span>สุ่มคู่ท้าดวลใหม่ ({versusCount} คน)</span>
        </button>
      </div>
    </div>
  );
};
