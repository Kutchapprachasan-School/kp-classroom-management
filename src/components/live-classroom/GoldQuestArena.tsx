// src/components/live-classroom/GoldQuestArena.tsx
// สมรภูมิตะลุยคำถามล่าทองคำแบบเรียลไทม์ (Gold Quest Live Arena)
// ออกแบบสำหรับคุณครูฉายขึ้นจอโปรเจกเตอร์ในห้องเรียน (Projector View)
// พร้อมกระดานผู้นำเรียลไทม์ (Real-time Leaderboard), บันทึกเหตุการณ์ขโมย/เปิดหีบสด (Live Event Feed),
// และระบบแจกเหรียญ/ตั๋วรางวัลเข้าบัญชีนักเรียนจริง (Strict Zero Mock Data)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QrCode,
  Trophy,
  Coins,
  Flame,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Gift,
  Zap,
  Swords,
  Crown,
  Medal,
  Copy,
  Check,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { RoomQRCodeModal } from '../exam/RoomQRCodeModal';
import {
  goldQuestService,
  type GoldQuestRoomState,
  type GoldQuestQuestion,
} from '../../services/goldQuestService';
import { soundFX } from '../../services/soundFXEngine';
import type { LiveStudent } from '../../services/liveClassroomService';
import { DEFAULT_SAMPLE_QUESTIONS } from '../../services/onlineQuizService';

export interface GoldQuestArenaProps {
  roomId: string;
  initialPin?: string;
  examTitle?: string;
  classroomId?: string;
  classroomName?: string;
  students?: LiveStudent[];
  questions?: GoldQuestQuestion[];
  isProjectorMode?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleProjector?: () => void;
  onClose?: () => void;
  onAwardSessionRewards?: (awards: { studentId: string; coins: number; tickets: number }[]) => void;
}

export const GoldQuestArena: React.FC<GoldQuestArenaProps> = ({
  roomId,
  initialPin,
  examTitle = 'สอบเก็บคะแนนภาษาญี่ปุ่น (Gold Quest Arena)',
  classroomId = '',
  classroomName = 'ห้องเรียน',
  students = [],
  questions: propQuestions,
  isProjectorMode: initialProjectorMode = false,
  soundEnabled: initialSoundEnabled = true,
  onToggleSound,
  onToggleProjector,
  onClose,
  onAwardSessionRewards,
}) => {
  // ควบคุมสถานะโปรเจกเตอร์และเสียงภายในคอมโพเนนต์
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(initialProjectorMode);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(initialSoundEnabled);

  // ควบคุม Modal แสดง QR Code / PIN 6 หลัก
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCopiedPin, setIsCopiedPin] = useState<boolean>(false);

  // ข้อมูลคำถามสำหรับห้องสอบ (ใช้คำถามจาก props หรือชุดคำถามภาษาญี่ปุ่นมาตรฐาน)
  const roomQuestions: GoldQuestQuestion[] = useMemo(() => {
    if (propQuestions && propQuestions.length > 0) return propQuestions;
    return DEFAULT_SAMPLE_QUESTIONS.map((q) => ({
      id: q.id,
      prompt: q.questionText,
      options: q.options.map((o) => o.text),
      correctIndex: q.options.findIndex((o) => o.key === q.correctAnswer),
      category: 'แบบทดสอบภาษาญี่ปุ่น',
    }));
  }, [propQuestions]);

  // ตัวแทนรายชื่อนักเรียนจริงในห้อง
  const authenticInitialStudents = useMemo(() => {
    return students.map((st) => ({
      id: st.id,
      name: st.name,
      studentId: st.studentCode || (st.number ? String(st.number) : undefined),
      avatar: '⚔️',
      gold: 0,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      isJoined: false,
    }));
  }, [students]);

  // สถานะห้องสอบสด (ดึงและซิงค์จาก goldQuestService)
  const [roomState, setRoomState] = useState<GoldQuestRoomState>(() => {
    const existing = goldQuestService.findRoom(roomId, initialPin);
    if (existing && existing.isActive) {
      return existing;
    }
    return goldQuestService.startRoom({
      roomId,
      pin: initialPin,
      classroomId,
      examTitle,
      students: authenticInitialStudents,
      questions: roomQuestions,
    });
  });

  const roomPinCode = roomState.pin;

  // Real-time Subscription ฟังการอัปเดตของห้องสอบข้ามแท็บ
  useEffect(() => {
    const unsubscribe = goldQuestService.subscribe((updatedRoom) => {
      if (updatedRoom.roomId === roomId || updatedRoom.pin === roomPinCode) {
        setRoomState(updatedRoom);
      }
    });
    return () => unsubscribe();
  }, [roomId, roomPinCode]);

  // เสียงเอฟเฟกต์
  const playSfx = useCallback(
    (type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle') => {
      if (!isSoundOn) return;
      if (type === 'tick') soundFX.playTick();
      if (type === 'coin') soundFX.playCoin();
      if (type === 'fanfare') soundFX.playFanfare();
      if (type === 'buzzer') soundFX.playBuzzer();
      if (type === 'whistle') soundFX.playWhistle();
    },
    [isSoundOn]
  );

  // คัดลอกรหัส PIN
  const handleCopyPin = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(roomPinCode);
      setIsCopiedPin(true);
      playSfx('tick');
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  // จัดเรียงนักเรียนตามคะแนนทองคำ (Leaderboard Ranking)
  const rankedStudents = useMemo(() => {
    return [...roomState.students].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return (b.correctCount || 0) - (a.correctCount || 0);
    });
  }, [roomState.students]);

  // สถิติรวมในสนาม
  const joinedCount = useMemo(
    () => roomState.students.filter((s) => s.isJoined).length,
    [roomState.students]
  );
  const totalGoldInArena = useMemo(
    () => roomState.students.reduce((sum, s) => sum + (s.gold || 0), 0),
    [roomState.students]
  );

  // ผู้เล่น 3 อันดับแรก
  const top1 = rankedStudents[0];
  const top2 = rankedStudents[1];
  const top3 = rankedStudents[2];
  const remainingRanks = rankedStudents.slice(3);

  // สถานะการจบการสอบ
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isRewardsAwarded, setIsRewardsAwarded] = useState<boolean>(false);

  // จบการแข่งขัน
  const handleEndArena = () => {
    goldQuestService.endRoom(roomId, roomPinCode);
    setShowEndConfirmModal(false);
    setIsGameOverModalOpen(true);
    playSfx('fanfare');
  };

  // มอบรางวัลเหรียญ/ตั๋วจริงเข้ากระเป๋าในคาบ
  const handleAwardClassRewards = () => {
    if (!onAwardSessionRewards || isRewardsAwarded) return;

    // คำนวณรางวัลตามอันดับ:
    // อันดับ 1: 30 Coins + 2 Tickets
    // อันดับ 2: 20 Coins + 1 Ticket
    // อันดับ 3: 15 Coins + 1 Ticket
    // อันดับ 4-10: 10 Coins
    // ผู้เข้าร่วมทุกคน: 5 Coins
    const awards = rankedStudents.map((st, idx) => {
      let coins = 5;
      let tickets = 0;
      if (idx === 0) {
        coins = 30;
        tickets = 2;
      } else if (idx === 1) {
        coins = 20;
        tickets = 1;
      } else if (idx === 2) {
        coins = 15;
        tickets = 1;
      } else if (idx < 10) {
        coins = 10;
        tickets = 0;
      }
      return {
        studentId: st.id,
        coins,
        tickets,
      };
    });

    onAwardSessionRewards(awards);
    setIsRewardsAwarded(true);
    playSfx('coin');
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-none font-sans overflow-x-hidden ${
        isProjectorMode ? 'text-lg' : 'text-base'
      }`}
    >
      {/* Background Ambience Aura */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px]" />
      </div>

      {/* 1. TOP HEADER NAVIGATION & STATS BAR */}
      <header className="relative z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Room Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Coins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wide text-amber-300 text-sm sm:text-base flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400 inline" />
                {examTitle}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {classroomName} • คำถาม {roomQuestions.length} ข้อ • โหมดตะลุยหีบสมบัติ
            </p>
          </div>
        </div>

        {/* Center: PIN Badge & QR Code Launcher Button */}
        <div className="flex items-center gap-2.5">
          {/* 6-Digit PIN Display Box */}
          <div
            onClick={handleCopyPin}
            title="คลิกเพื่อคัดลอกรหัส PIN"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-xl cursor-pointer transition shadow-sm group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PIN
            </span>
            <span className="font-mono font-black text-lg sm:text-xl tracking-widest text-amber-400 group-hover:scale-105 transition-transform">
              {roomPinCode}
            </span>
            {isCopiedPin ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400 group-hover:text-amber-300" />
            )}
          </div>

          {/* Big Action: QR Code / PIN Modal Launcher */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-indigo-200" />
            <span>📷 แสดง QR Code / PIN (6 หลัก)</span>
          </button>
        </div>

        {/* Right: Controls & End Arena Button */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setIsSoundOn(!isSoundOn);
              onToggleSound?.();
            }}
            title={isSoundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Projector Mode Toggle */}
          <button
            onClick={() => {
              setIsProjectorMode(!isProjectorMode);
              onToggleProjector?.();
            }}
            title="สลับโหมดจอโปรเจกเตอร์"
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isProjectorMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* End Arena Button */}
          <button
            onClick={() => setShowEndConfirmModal(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>🏁 จบการแข่งขัน</span>
          </button>

          {/* Exit / Close Component Button */}
          {onClose && (
            <button
              onClick={onClose}
              title="ย้อนกลับ / ปิดหน้าต่าง"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. STATS OVERVIEW RIBBON */}
      <div className="relative z-10 bg-slate-900/60 border-b border-slate-800/60 px-4 py-2 sm:px-6 flex items-center justify-between text-xs sm:text-sm text-slate-300">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>เข้าห้องสอบแล้ว:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              {joinedCount} / {roomState.students.length} คน
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>ทองคำรวมในสนาม:</span>
            <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {totalGoldInArena.toLocaleString()} G
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>นักเรียนสามารถสแกน QR Code เพื่อเปิดหีบสมบัติและสลับทองคำได้ตลอดเวลา</span>
        </div>
      </div>

      {/* 3. MAIN ARENA BODY (LEADERBOARD & LIVE ACTIVITY FEED) */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
        {/* LEFT / CENTER COLUMN: PODIUM & LEADERBOARD (8 Cols on Desktop) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* TOP 3 PODIUM SECTION */}
          <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                บัลลังก์เจ้าแห่งทองคำ (Top 3)
              </h2>
              <span className="text-xs text-slate-400">อัปเดตแบบเรียลไทม์ 60 FPS</span>
            </div>

            {/* Podium Columns Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-4 pb-2">
              {/* 2nd Place (Silver) */}
              <div className="flex flex-col items-center">
                {top2 ? (
                  <div className="w-full flex flex-col items-center group">
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-slate-500/20 border-2 border-slate-300">
                        {top2.avatar || '🧙‍♂️'}
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                        2
                      </span>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-200 text-center truncate max-w-full px-1">
                      {top2.name}
                    </span>
                    <div className="flex items-center gap-1 text-slate-300 font-extrabold text-xs sm:text-sm mt-0.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{top2.gold.toLocaleString()} G</span>
                    </div>
                    {top2.streak > 1 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full mt-1 border border-amber-500/20">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {top2.streak} streak
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-500">
                    รอผู้ท้าชิง
                  </div>
                )}
                {/* Silver Pedestal Bar */}
                <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t-2 border-slate-400 mt-2 flex items-center justify-center font-black text-slate-400 text-sm sm:text-base">
                  อันดับ 2
                </div>
              </div>

              {/* 1st Place (Gold Champion) */}
              <div className="flex flex-col items-center">
                {top1 ? (
                  <div className="w-full flex flex-col items-center group scale-105 sm:scale-110">
                    <div className="relative mb-2">
                      <Crown className="w-6 h-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-amber-500/30 border-3 border-amber-200">
                        {top1.avatar || '⚔️'}
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-amber-100">
                        1
                      </span>
                    </div>
                    <span className="font-black text-sm sm:text-base text-amber-200 text-center truncate max-w-full px-1">
                      {top1.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-amber-300 font-black text-sm sm:text-base mt-0.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>{top1.gold.toLocaleString()} G</span>
                    </div>
                    {top1.streak > 1 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-full mt-1 border border-amber-400/40">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {top1.streak} streak 🔥
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-500">
                    รอผู้ท้าชิง
                  </div>
                )}
                {/* Gold Pedestal Bar */}
                <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-amber-950/90 to-amber-600/50 rounded-t-2xl border-t-4 border-amber-300 mt-2 flex flex-col items-center justify-center font-black text-amber-300 text-base sm:text-lg shadow-lg shadow-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-300 mb-0.5" />
                  แชมป์อันดับ 1
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="flex flex-col items-center">
                {top3 ? (
                  <div className="w-full flex flex-col items-center group">
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-amber-900/30 border-2 border-amber-600">
                        {top3.avatar || '🥷'}
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow">
                        3
                      </span>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-200 text-center truncate max-w-full px-1">
                      {top3.name}
                    </span>
                    <div className="flex items-center gap-1 text-slate-300 font-extrabold text-xs sm:text-sm mt-0.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{top3.gold.toLocaleString()} G</span>
                    </div>
                    {top3.streak > 1 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full mt-1 border border-amber-500/20">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {top3.streak} streak
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-500">
                    รอผู้ท้าชิง
                  </div>
                )}
                {/* Bronze Pedestal Bar */}
                <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-900 to-amber-950/80 rounded-t-2xl border-t-2 border-amber-600 mt-2 flex items-center justify-center font-black text-amber-500 text-sm sm:text-base">
                  อันดับ 3
                </div>
              </div>
            </div>
          </div>

          {/* REMAINING RANKS (อันดับ 4 ลงไป) */}
          <div className="bg-slate-900/60 rounded-3xl p-5 border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Medal className="w-4 h-4 text-indigo-400" />
              อันดับผู้เข้าร่วมการแข่งขันทั้งหมด ({roomState.students.length} คน)
            </h3>

            {remainingRanks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                ยังไม่มีผู้เล่นในอันดับถัดไป
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {remainingRanks.map((st, idx) => {
                  const rankNumber = idx + 4;
                  const goldPercent =
                    top1 && top1.gold > 0 ? Math.min(100, Math.round((st.gold / top1.gold) * 100)) : 0;

                  return (
                    <div
                      key={st.id}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-2xl p-3 flex items-center gap-3 transition shadow-sm"
                    >
                      <span className="w-6 text-center font-black text-sm text-slate-400">
                        #{rankNumber}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center text-xl shrink-0">
                        {st.avatar || '⚔️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                            {st.name}
                          </span>
                          <span className="font-black text-xs sm:text-sm text-amber-300 shrink-0">
                            {st.gold.toLocaleString()} G
                          </span>
                        </div>
                        {/* Gold Progress Relative to 1st */}
                        <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                            style={{ width: `${goldPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE ACTIVITY LOG STREAM (4 Cols on Desktop) */}
        <section className="lg:col-span-4 bg-slate-900/80 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col h-full min-h-[460px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              บันทึกเหตุการณ์สด (Live Feed)
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[560px]">
            {roomState.logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                ยังไม่มีเหตุการณ์ รอผู้เล่นเปิดหีบสมบัติ...
              </div>
            ) : (
              roomState.logs.map((log) => {
                let badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';
                let icon = <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;

                if (log.type === 'steal') {
                  badgeStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                  icon = <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
                } else if (log.type === 'chest') {
                  badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  icon = <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
                } else if (log.type === 'join') {
                  badgeStyle = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
                  icon = <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
                }

                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-xs sm:text-[13px] flex items-start gap-2.5 transition animate-in fade-in slide-in-from-top-1 ${badgeStyle}`}
                  >
                    {icon}
                    <div className="flex-1 leading-snug">
                      <p className="font-semibold">{log.message}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* 4. MODAL: ยืนยันการจบการสอบ */}
      {showEndConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">ต้องการจบการแข่งขันหรือไม่?</h3>
              <p className="text-xs text-slate-400 mt-1">
                เมื่อกดจบการสอบ นักเรียนทุกคนจะไม่สามารถส่งคำตอบหรือเปิดหีบเพิ่มได้
                และระบบจะแสดงตารางสรุปผลผู้ชนะ
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEndArena}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                ยืนยันจบการแข่งขัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: สรุปผลชัยชนะ (Game Over Victory Modal & Award Rewards) */}
      {isGameOverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-5 relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-amber-500/30">
              <Trophy className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                VICTORY CELEBRATION
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                ประกาศผลการแข่งขัน Gold Quest!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ขอแสดงความยินดีกับผู้ล่าทองคำยอดเยี่ยมประจำคาบเรียน
              </p>
            </div>

            {/* Top 3 Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2">
              {/* 2nd */}
              <div className="bg-slate-800/80 border border-slate-600/60 rounded-2xl p-3">
                <span className="text-xl">🥈</span>
                <p className="font-bold text-xs text-slate-200 truncate mt-1">
                  {top2?.name || '-'}
                </p>
                <p className="font-black text-xs text-amber-300 mt-0.5">
                  {top2 ? `${top2.gold.toLocaleString()} G` : '0 G'}
                </p>
              </div>

              {/* 1st */}
              <div className="bg-amber-500/20 border-2 border-amber-400 rounded-2xl p-3 scale-105 shadow-lg shadow-amber-500/20">
                <span className="text-2xl">👑</span>
                <p className="font-black text-xs sm:text-sm text-amber-200 truncate mt-1">
                  {top1?.name || '-'}
                </p>
                <p className="font-black text-sm text-amber-300 mt-0.5">
                  {top1 ? `${top1.gold.toLocaleString()} G` : '0 G'}
                </p>
              </div>

              {/* 3rd */}
              <div className="bg-slate-800/80 border border-amber-800/60 rounded-2xl p-3">
                <span className="text-xl">🥉</span>
                <p className="font-bold text-xs text-slate-200 truncate mt-1">
                  {top3?.name || '-'}
                </p>
                <p className="font-black text-xs text-amber-300 mt-0.5">
                  {top3 ? `${top3.gold.toLocaleString()} G` : '0 G'}
                </p>
              </div>
            </div>

            {/* Action Buttons: Award Classroom Rewards or Close */}
            <div className="space-y-2.5 pt-2">
              {onAwardSessionRewards && (
                <button
                  onClick={handleAwardClassRewards}
                  disabled={isRewardsAwarded}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    isRewardsAwarded
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
                  }`}
                >
                  <Coins className="w-5 h-5" />
                  <span>
                    {isRewardsAwarded
                      ? '✓ มอบเหรียญ/ตั๋วรางวัลเข้าบัญชีในคาบแล้ว'
                      : '🪙 มอบเหรียญ/ตั๋วรางวัลเข้าบัญชีจริงของห้อง'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsGameOverModalOpen(false);
                  onClose?.();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                ปิดหน้าต่าง / กลับสู่ห้องเรียน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: แสดง QR Code และรหัส PIN 6 หลัก (ฉายจอโปรเจกเตอร์) */}
      <RoomQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomId={roomId}
        roomPin={roomPinCode}
        examTitle={examTitle}
        studentCount={roomState.students.length}
        onPlaySound={playSfx}
      />
    </div>
  );
};

export default GoldQuestArena;
