// src/views/GoldQuestPlayView.tsx
// หน้าจอเล่นเกมตอบคำถามล่าทองคำฝั่งนักเรียน (Student Gold Quest Play Screen)
// ออกแบบมาเพื่อมือถือโดยเฉพาะ (Mobile-First):
// 1. ตอบคำถาม 4 ตัวเลือก (ปุ่มสัมผัสขนาดใหญ่ Thumb-friendly > 48px)
// 2. เมื่อตอบถูก จะได้เปิดหีบสมบัติปริศนา 3 กล่อง (รับทองคำ, คูณ 2, ขโมยทอง, หรือสลับทองคำกับเพื่อน)
// 3. ซิงค์สถานะเรียลไทม์กับจอครูผ่าน goldQuestService และ BroadcastChannel

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Coins,
  Flame,
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  goldQuestService,
  type GoldQuestRoomState,
  type GoldQuestStudent,
  type GoldQuestQuestion,
} from '../services/goldQuestService';
import { soundFX } from '../services/soundFXEngine';
import { DEFAULT_SAMPLE_QUESTIONS } from '../services/onlineQuizService';

// ประเภทผลลัพธ์จากหีบสมบัติปริศนา
type MysteryChestOutcome =
  | { type: 'GOLD'; amount: number; title: string; subtitle: string; icon: string }
  | { type: 'MULTIPLIER'; multiplier: number; title: string; subtitle: string; icon: string }
  | { type: 'STEAL'; percent: number; title: string; subtitle: string; icon: string }
  | { type: 'SWAP'; title: string; subtitle: string; icon: string }
  | { type: 'BOMB'; percent: number; title: string; subtitle: string; icon: string };

const CHEST_OUTCOMES_POOL: MysteryChestOutcome[] = [
  { type: 'GOLD', amount: 50, title: '+50 ทองคำ', subtitle: 'เหรียญทองกระสอบเล็ก', icon: '💰' },
  { type: 'GOLD', amount: 100, title: '+100 ทองคำ', subtitle: 'หีบทองคำโบราณ', icon: '💰' },
  { type: 'GOLD', amount: 200, title: '+200 ทองคำ', subtitle: 'สมบัติของราชาโจรสลัด', icon: '💎' },
  { type: 'GOLD', amount: 350, title: '+350 ทองคำ', subtitle: 'แจ็กพอตมหาสมบัติแตก!', icon: '✨' },
  { type: 'MULTIPLIER', multiplier: 2, title: 'x2 เท่าตัว!', subtitle: 'ทวีคูณทองคำที่มีอยู่สองเท่า', icon: '🌟' },
  { type: 'STEAL', percent: 25, title: 'จิ้งจอกนักล้วง (ขโมย 25%)', subtitle: 'เลือกขโมยทองจากเพื่อน 1 คน', icon: '🦊' },
  { type: 'SWAP', title: 'สายฟ้าสลับร่าง (สลับทอง)', subtitle: 'สลับกระเป๋าทองกับเพื่อนคนใดก็ได้', icon: '⚡' },
  { type: 'BOMB', percent: 15, title: 'ระเบิดกับดัก!', subtitle: 'สะดุดระเบิด เสียทองคำ 15%', icon: '💣' },
];

export const GoldQuestPlayView: React.FC = () => {
  // ดึงข้อมูลห้องและนักเรียนจาก URL params หรือ sessionStorage
  const [playerInfo] = useState<{
    studentId: string;
    name: string;
    avatar: string;
    roomId: string;
    pin: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room') || '';
    const pinFromUrl = params.get('pin') || '';
    const studentIdFromUrl = params.get('studentId') || '';

    // ตรวจสอบจาก sessionStorage
    const stored = sessionStorage.getItem('gold_quest_player');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (pinFromUrl && parsed.pin === pinFromUrl) return parsed;
        if (!pinFromUrl && parsed.pin) return parsed;
      } catch {
        // ignore
      }
    }

    if (pinFromUrl) {
      return {
        studentId: studentIdFromUrl || `std_${Date.now()}`,
        name: params.get('name') || 'ผู้เล่น',
        avatar: params.get('avatar') || '⚔️',
        roomId: roomFromUrl || 'default-room',
        pin: pinFromUrl,
      };
    }
    return null;
  });

  // สถานะห้องสอบสด
  const [room, setRoom] = useState<GoldQuestRoomState | null>(() => {
    if (!playerInfo?.pin) return null;
    return goldQuestService.findRoom(playerInfo.roomId, playerInfo.pin) || null;
  });

  // ตัวแปรควบคุมเกมเพลย์
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // สถานะหน้าเปิดหีบสมบัติ
  const [gamePhase, setGamePhase] = useState<'QUESTION' | 'CHEST' | 'RESULT' | 'FINISHED'>('QUESTION');
  const [selectedChestIndex, setSelectedChestIndex] = useState<number | null>(null);
  const [chestOutcome, setChestOutcome] = useState<MysteryChestOutcome | null>(null);
  const [showTargetPicker, setShowTargetPicker] = useState<boolean>(false);

  // ซิงค์สถานะห้องจาก Service และฟังการเปลี่ยนแปลงเรียลไทม์
  useEffect(() => {
    if (!playerInfo?.pin) return;

    // ถ้ายังไม่เจอห้อง ให้ลองหาอีกรอบ
    const existing = goldQuestService.findRoom(playerInfo.roomId, playerInfo.pin);
    if (existing) setRoom(existing);

    const unsubscribe = goldQuestService.subscribe((updatedRoom) => {
      if (updatedRoom.pin === playerInfo.pin || updatedRoom.roomId === playerInfo.roomId) {
        setRoom(updatedRoom);
        if (updatedRoom.status === 'ended' || !updatedRoom.isActive) {
          setGamePhase('FINISHED');
        }
      }
    });

    return () => unsubscribe();
  }, [playerInfo]);

  // คำถามทั้งหมด
  const questions: GoldQuestQuestion[] = useMemo(() => {
    if (room && room.questions && room.questions.length > 0) {
      return room.questions;
    }
    return DEFAULT_SAMPLE_QUESTIONS.map((q) => ({
      id: q.id,
      prompt: q.questionText,
      options: q.options.map((o) => o.text),
      correctIndex: q.options.findIndex((o) => o.key === q.correctAnswer),
      category: 'แบบทดสอบภาษาญี่ปุ่น',
    }));
  }, [room]);

  const currentQuestion = questions[currentQIndex] || questions[0];

  // ข้อมูลนักเรียนคนปัจจุบัน
  const myStudent: GoldQuestStudent | undefined = useMemo(() => {
    if (!room || !playerInfo) return undefined;
    return room.students.find(
      (s) => s.id === playerInfo.studentId || s.name.trim().toLowerCase() === playerInfo.name.trim().toLowerCase()
    );
  }, [room, playerInfo]);

  // อันดับในห้องปัจจุบัน
  const currentRank = useMemo(() => {
    if (!room || !myStudent) return 1;
    const sorted = [...room.students].sort((a, b) => b.gold - a.gold);
    const index = sorted.findIndex((s) => s.id === myStudent.id);
    return index >= 0 ? index + 1 : 1;
  }, [room, myStudent]);

  // เพื่อนคนอื่นๆ ในห้อง สำหรับเลือกเป็นเป้าหมายขโมยหรือสลับทอง
  const otherClassmates = useMemo(() => {
    if (!room || !myStudent) return [];
    return room.students.filter((s) => s.id !== myStudent.id);
  }, [room, myStudent]);

  // เสียงเอฟเฟกต์
  const playSfx = useCallback((type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle') => {
    try {
      if (type === 'tick') soundFX.playTick();
      if (type === 'coin') soundFX.playCoin();
      if (type === 'fanfare') soundFX.playFanfare();
      if (type === 'buzzer') soundFX.playBuzzer();
      if (type === 'whistle') soundFX.playWhistle();
    } catch {
      // ignore
    }
  }, []);

  // เมื่อนักเรียนแตะเลือกตัวเลือกคำตอบ
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted || !currentQuestion || !playerInfo) return;

    setSelectedOptionIndex(idx);
    setIsAnswerSubmitted(true);

    const isCorrect = idx === currentQuestion.correctIndex;
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      playSfx('coin');
      // รอให้เห็นตัวเลือกสีเขียวสั้นๆ แล้วพาไปหน้าเปิดหีบสมบัติ
      setTimeout(() => {
        setGamePhase('CHEST');
        setSelectedChestIndex(null);
        setChestOutcome(null);
      }, 700);
    } else {
      playSfx('buzzer');
      // ตอบผิด: บันทึกลงระบบทันที
      goldQuestService.submitAnswer({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        studentId: myStudent?.id || playerInfo.studentId,
        isCorrect: false,
      });

      // รอ 1.5 วินาทีแล้วไปข้อถัดไป
      setTimeout(() => {
        moveToNextQuestion();
      }, 1500);
    }
  };

  // แตะเปิดหีบสมบัติปริศนา (เลือก 1 ใน 3 ใบ)
  const handleOpenChest = (chestIdx: number) => {
    if (selectedChestIndex !== null || !playerInfo) return;

    setSelectedChestIndex(chestIdx);
    playSfx('fanfare');

    // สุ่มผลลัพธ์จาก Pool
    const randomOutcome =
      CHEST_OUTCOMES_POOL[Math.floor(Math.random() * CHEST_OUTCOMES_POOL.length)];
    setChestOutcome(randomOutcome);

    // ประมวลผลผลลัพธ์
    if (randomOutcome.type === 'GOLD') {
      const delta = randomOutcome.amount;
      goldQuestService.submitAnswer({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        studentId: myStudent?.id || playerInfo.studentId,
        isCorrect: true,
        goldDelta: delta,
        chestLog: `🎁 ${playerInfo.name} เปิดหีบสมบัติ ได้รับ +${delta} ทองคำ!`,
      });
      setGamePhase('RESULT');
    } else if (randomOutcome.type === 'MULTIPLIER') {
      const currentGold = myStudent?.gold || 0;
      const delta = currentGold > 0 ? currentGold : 100;
      goldQuestService.submitAnswer({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        studentId: myStudent?.id || playerInfo.studentId,
        isCorrect: true,
        goldDelta: delta,
        chestLog: `🌟 ${playerInfo.name} ได้รับบัฟ x2 ทองคำ! (+${delta} G)`,
      });
      setGamePhase('RESULT');
    } else if (randomOutcome.type === 'BOMB') {
      const currentGold = myStudent?.gold || 0;
      const lost = Math.max(20, Math.floor(currentGold * (randomOutcome.percent / 100)));
      goldQuestService.submitAnswer({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        studentId: myStudent?.id || playerInfo.studentId,
        isCorrect: true,
        goldDelta: -lost,
        chestLog: `💣 ${playerInfo.name} สะดุดกับดักระเบิด เสีย ${lost} ทองคำ!`,
      });
      setGamePhase('RESULT');
    } else if (randomOutcome.type === 'STEAL' || randomOutcome.type === 'SWAP') {
      // หากมีเพื่อนในห้อง ให้เปิดหน้าจอเลือกเป้าหมาย
      if (otherClassmates.length > 0) {
        setShowTargetPicker(true);
      } else {
        // หากไม่มีเพื่อน ให้แปลงเป็นทองคำธรรมดาแทน
        const delta = 150;
        goldQuestService.submitAnswer({
          roomId: playerInfo.roomId,
          pin: playerInfo.pin,
          studentId: myStudent?.id || playerInfo.studentId,
          isCorrect: true,
          goldDelta: delta,
          chestLog: `✨ ${playerInfo.name} เปิดหีบลับ ได้รับ ${delta} ทองคำ!`,
        });
        setGamePhase('RESULT');
      }
    }
  };

  // แตะเลือกเป้าหมายที่จะขโมยทอง หรือสลับทอง
  const handleSelectTargetStudent = (target: GoldQuestStudent) => {
    if (!playerInfo || !chestOutcome) return;

    if (chestOutcome.type === 'STEAL') {
      const stealAmount = Math.max(25, Math.floor((target.gold || 0) * 0.25));
      goldQuestService.stealOrSwap({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        actorId: myStudent?.id || playerInfo.studentId,
        targetId: target.id,
        effectType: 'STEAL',
        amount: stealAmount,
      });
    } else if (chestOutcome.type === 'SWAP') {
      goldQuestService.stealOrSwap({
        roomId: playerInfo.roomId,
        pin: playerInfo.pin,
        actorId: myStudent?.id || playerInfo.studentId,
        targetId: target.id,
        effectType: 'SWAP',
      });
    }

    setShowTargetPicker(false);
    setGamePhase('RESULT');
  };

  // ไปข้อต่อไป
  const moveToNextQuestion = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
      setIsAnswerCorrect(null);
      setSelectedChestIndex(null);
      setChestOutcome(null);
      setGamePhase('QUESTION');
    } else {
      setGamePhase('FINISHED');
      playSfx('fanfare');
    }
  };

  // หากไม่มีข้อมูลผู้เล่น
  if (!playerInfo) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <Coins className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">ไม่พบข้อมูลการเข้าห้องสอบ</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          กรุณาสแกน QR Code หรือกรอกรหัส PIN 6 หลักเพื่อเข้าสู่ห้องสอบอีกครั้ง
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/live-classroom/gold-quest/join';
            }
          }}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer"
        >
          ไปยังหน้าใส่รหัส PIN
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden select-none font-sans">
      {/* Background Ambience Aura */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      {/* 1. STICKY TOP STATUS BAR (Avatar, Name, Gold Coins, Streak, Rank) */}
      <header className="relative z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left: Player Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0">
            {myStudent?.avatar || playerInfo.avatar || '⚔️'}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-white block truncate max-w-[130px] sm:max-w-[200px]">
              {myStudent?.name || playerInfo.name}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                PIN: {playerInfo.pin}
              </span>
              <span className="text-amber-400 font-bold">อันดับ #{currentRank}</span>
            </div>
          </div>
        </div>

        {/* Right: Gold Counter & Streak Flame */}
        <div className="flex items-center gap-2">
          {/* Streak Flame */}
          {(myStudent?.streak || 0) > 1 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-xl text-xs font-black text-amber-300">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{myStudent?.streak}</span>
            </div>
          )}

          {/* Gold Counter */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-300 font-black text-sm shadow-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{(myStudent?.gold || 0).toLocaleString()} G</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA BASED ON GAME PHASE */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-lg w-full mx-auto p-4 sm:p-6 overflow-y-auto">
        {/* ========================================================= */}
        {/* PHASE 1: QUESTION PHASE (ตอบคำถาม 4 ตัวเลือก) */}
        {/* ========================================================= */}
        {gamePhase === 'QUESTION' && (
          <div className="space-y-4 my-auto">
            {/* Question Progress & Category */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider">
                ข้อที่ {currentQIndex + 1} จาก {questions.length}
              </span>
              <span>{currentQuestion?.category || 'ตะลุยข้อสอบ'}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Card Prompt */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-center min-h-[120px] flex items-center justify-center">
              <h2 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
                {currentQuestion?.prompt}
              </h2>
            </div>

            {/* 4 Large Touch Option Buttons (A, B, C, D) */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {currentQuestion?.options.map((optionText, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                const isSelected = selectedOptionIndex === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;

                let buttonStyle =
                  'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200 active:scale-[0.98]';

                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    buttonStyle =
                      'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-500/50';
                  } else if (isSelected && !isCorrectOption) {
                    buttonStyle =
                      'bg-rose-600/20 border-rose-500 text-rose-200 shadow-lg shadow-rose-600/20 ring-2 ring-rose-500/50';
                  } else {
                    buttonStyle = 'opacity-40 bg-slate-900 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition font-bold text-sm sm:text-base cursor-pointer min-h-[58px] ${buttonStyle}`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-xs font-black text-amber-400 shrink-0">
                      {label}
                    </span>
                    <span className="flex-1 leading-snug">{optionText}</span>
                    {isAnswerSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback Message */}
            {isAnswerSubmitted && !isAnswerCorrect && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs sm:text-sm text-center font-bold animate-in fade-in">
                ตอบผิด! ไม่ได้รับสิทธิ์เปิดหีบสมบัติ กำลังไปข้อต่อไป...
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: CHEST SELECTION (เลือกหีบสมบัติปริศนา 3 ใบ) */}
        {/* ========================================================= */}
        {gamePhase === 'CHEST' && (
          <div className="space-y-6 my-auto text-center animate-in fade-in">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                ✓ ตอบถูกยอดเยี่ยม!
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                เลือกหีบสมบัติปริศนา 1 กล่อง!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ลุ้นรับทองคำ, คูณสอง, ขโมยทองจากเพื่อน หรือสลับกระเป๋าทอง
              </p>
            </div>

            {/* 3 Mysterious Bouncing Chests */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4">
              {[0, 1, 2].map((chestIdx) => (
                <button
                  key={chestIdx}
                  onClick={() => handleOpenChest(chestIdx)}
                  className="group bg-gradient-to-b from-slate-900 to-slate-900/80 hover:from-amber-950/40 hover:to-slate-900 border-2 border-slate-800 hover:border-amber-500/60 rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-xl cursor-pointer"
                >
                  <div className="text-5xl sm:text-6xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform drop-shadow-md">
                    📦
                  </div>
                  <span className="text-xs font-black text-amber-300 group-hover:text-amber-200">
                    หีบที่ {chestIdx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2.5: TARGET PICKER MODAL (เลือกขโมยหรือสลับทอง) */}
        {/* ========================================================= */}
        {showTargetPicker && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="text-center">
                <span className="text-3xl">{chestOutcome?.icon}</span>
                <h3 className="text-lg font-black text-white mt-1">
                  {chestOutcome?.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  แตะเลือกเพื่อนในห้องที่คุณต้องการใช้สกิล
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {otherClassmates.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => handleSelectTargetStudent(target)}
                    className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-between transition cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{target.avatar || '⚔️'}</span>
                      <span className="font-bold text-xs sm:text-sm text-slate-200 truncate">
                        {target.name}
                      </span>
                    </div>
                    <span className="font-black text-xs text-amber-400">
                      {target.gold.toLocaleString()} G
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2.8: REVEAL OUTCOME RESULT (ผลลัพธ์จากการเปิดหีบ) */}
        {/* ========================================================= */}
        {gamePhase === 'RESULT' && chestOutcome && (
          <div className="space-y-6 my-auto text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl shadow-xl shadow-amber-500/20">
              {chestOutcome.icon}
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                MYSTERY CHEST
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                {chestOutcome.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {chestOutcome.subtitle}
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-around">
              <div>
                <span className="text-[11px] text-slate-400 block">ทองคำปัจจุบัน</span>
                <span className="text-lg font-black text-amber-300">
                  {(myStudent?.gold || 0).toLocaleString()} G
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block">อันดับในห้อง</span>
                <span className="text-lg font-black text-amber-300">
                  #{currentRank}
                </span>
              </div>
            </div>

            <button
              onClick={moveToNextQuestion}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <span>คำถามข้อต่อไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: FINISHED ARENA (จบการแข่งขัน) */}
        {/* ========================================================= */}
        {gamePhase === 'FINISHED' && (
          <div className="space-y-6 my-auto text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
              <Trophy className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                ARENA COMPLETED
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                สิ้นสุดการแข่งขัน Gold Quest!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                สรุปผลคะแนนและทองคำที่สะสมได้ของคุณ
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">อันดับสุดท้ายในห้อง</span>
                <span className="text-lg font-black text-amber-300">
                  อันดับ #{currentRank}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">ทองคำที่สะสมได้</span>
                <span className="text-lg font-black text-amber-400">
                  {(myStudent?.gold || 0).toLocaleString()} G
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">ตอบถูกทั้งหมด</span>
                <span className="text-sm font-bold text-emerald-400">
                  {myStudent?.correctCount || 0} / {questions.length} ข้อ
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition cursor-pointer"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default GoldQuestPlayView;
