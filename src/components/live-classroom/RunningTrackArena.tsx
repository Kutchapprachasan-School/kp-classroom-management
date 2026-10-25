// src/components/live-classroom/RunningTrackArena.tsx
// สนามวิ่งแข่งสุ่มชื่อนักเรียน (Running Track Arena) 60 FPS HTML5 Canvas + Web Speech TTS + Victory Podium
// ได้รับแรงบันดาลใจจาก Online-Stopwatch World Games Running ปรับปรุงสู่สไตล์ Pastel Anime Education Dashboard
// ปฏิบัติตาม Strict Zero-Mock Policy ดึงนักเรียนจริง 100%

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Refresh1Regular from '@mingcute/react/core-regular/refresh-1';
import Coin2Regular from '@mingcute/react/core-regular/coin-2';
import TicketRegular from '@mingcute/react/core-regular/ticket';
import { Trophy, Play, RotateCcw } from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import {
  prepareRaceContestants,
  updateContestantsFrame,
  type RaceContestant,
} from '../../utils/racePhysicsEngine';
import { tts, type JapanesePraise } from '../../utils/speechTTS';

export interface RunningTrackArenaProps {
  students: LiveStudent[];
  onWinnerConfirmed: (winner: LiveStudent) => void;
  onAwardCoin: (studentId: string, amount: number) => void;
  onAwardTicket: (studentId: string, amount: number) => void;
  isProjectorMode: boolean;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle', freq?: number) => void;
  ttsEnabled?: boolean;
  selectedPraise?: JapanesePraise;
  onRaceStateChange?: (isRunning: boolean) => void;
}

export type RaceSpeed = 'fast' | 'normal' | 'dramatic';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export const RunningTrackArena: React.FC<RunningTrackArenaProps> = ({
  students,
  onWinnerConfirmed,
  onAwardCoin,
  onAwardTicket,
  isProjectorMode,
  onPlaySound,
  ttsEnabled = true,
  selectedPraise = 'sugoi',
  onRaceStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // การตั้งค่าการแข่งขัน
  const [laneCount, setLaneCount] = useState<number>(() => Math.min(6, Math.max(4, students.length)));
  const [raceSpeed, setRaceSpeed] = useState<RaceSpeed>('normal');
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [raceFinished, setRaceFinished] = useState<boolean>(false);
  const [showPodium, setShowPodium] = useState<boolean>(false);

  // รายชื่อผู้เข้าแข่งขันในฮีตปัจจุบัน
  const [contestants, setContestants] = useState<RaceContestant[]>([]);
  const [champion, setChampion] = useState<RaceContestant | null>(null);
  const [finishers, setFinishers] = useState<RaceContestant[]>([]);

  // รางวัลที่กดมอบใน Podium (ป้องกันการกดซ้ำ)
  const [awardedRewards, setAwardedRewards] = useState<Record<string, { coin: number; ticket: number }>>({});

  // Animation Frame & Timers Ref
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const ribbonBrokenRef = useRef<boolean>(false);
  const footstepTimerRef = useRef<number>(0);
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const raceDurationMs = useMemo(() => {
    switch (raceSpeed) {
      case 'fast':
        return 3800; // 3.8 วินาที
      case 'normal':
        return 5800; // 5.8 วินาที
      case 'dramatic':
        return 8200; // 8.2 วินาที
    }
  }, [raceSpeed]);

  // ล้าง Timeout ของ TTS ทั้งหมดเมื่อ Unmount
  const clearAllTTSTimeouts = useCallback(() => {
    ttsTimeoutRef.current.forEach(clearTimeout);
    ttsTimeoutRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTTSTimeouts();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [clearAllTTSTimeouts]);

  // สุ่มจัดฮีตใหม่เมื่อจำนวนนักเรียนเปลี่ยน หรือครูกดสุ่มฮีตใหม่
  const handleSetupNewHeat = useCallback(() => {
    if (isRacing || students.length === 0) return;

    clearAllTTSTimeouts();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const effectiveLanes = Math.min(laneCount, students.length);
    const { contestants: newContestants } = prepareRaceContestants(
      students,
      effectiveLanes,
      raceDurationMs
    );

    setContestants(newContestants);
    setChampion(null);
    setFinishers([]);
    setIsRacing(false);
    setRaceFinished(false);
    setShowPodium(false);
    setAwardedRewards({});
    ribbonBrokenRef.current = false;
    confettiRef.current = [];
    startTimeRef.current = null;
    onRaceStateChange?.(false);
  }, [isRacing, students, laneCount, raceDurationMs, clearAllTTSTimeouts, onRaceStateChange]);

  // สุ่มฮีตครั้งแรกเมื่อโหลดคอมโพเนนต์
  useEffect(() => {
    if (contestants.length === 0 && students.length > 0) {
      handleSetupNewHeat();
    }
  }, [contestants.length, students.length, handleSetupNewHeat]);

  // ฟังก์ชันสร้างอนุภาค Confetti ฉลองชัย
  const spawnConfetti = (centerX: number, centerY: number) => {
    const particles: ConfettiParticle[] = [];
    const colors = ['#38BDF8', '#FB7185', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#F59E0B'];
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 7,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1.0,
      });
    }
    confettiRef.current = particles;
  };

  // เริ่มการแข่งขัน (Start Race)
  const handleStartRace = useCallback(() => {
    if (isRacing || contestants.length === 0) return;

    clearAllTTSTimeouts();
    setIsRacing(true);
    setRaceFinished(false);
    setShowPodium(false);
    setFinishers([]);
    ribbonBrokenRef.current = false;
    confettiRef.current = [];
    startTimeRef.current = null;
    footstepTimerRef.current = 0;
    onRaceStateChange?.(true);

    // เสียงนกหวีดปล่อยตัว
    onPlaySound?.('whistle');
  }, [isRacing, contestants.length, clearAllTTSTimeouts, onRaceStateChange, onPlaySound]);

  // วาดฉากลู่วิ่งและตัวละคร Chibi บน Canvas (60 FPS Engine)
  const drawArena = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      currentContestants: RaceContestant[],
      runCycle: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      const numLanes = currentContestants.length;
      if (numLanes === 0) return;

      const trackMarginTop = 32;
      const trackMarginBottom = 24;
      const trackHeight = height - trackMarginTop - trackMarginBottom;
      const laneHeight = trackHeight / numLanes;

      // พิกัดจุดสตาร์ตและเส้นชัย
      const startX = 85;
      const finishX = width - 110;
      const totalTrackDist = finishX - startX;

      // 1. วาดพื้นหลังสนามหญ้าและลู่วิ่ง
      for (let i = 0; i < numLanes; i++) {
        const laneY = trackMarginTop + i * laneHeight;
        const c = currentContestants[i];

        // สีพื้นของลู่วิ่งสลับเฉดพาสเทลนุ่มนวล
        ctx.fillStyle = i % 2 === 0 ? '#F8FAFC' : '#F1F5F9';
        if (isProjectorMode) {
          ctx.fillStyle = i % 2 === 0 ? '#1E293B' : '#0F172A';
        }
        ctx.fillRect(0, laneY, width, laneHeight);

        // ไฮไลต์ลู่วิ่งของแต่ละคนด้วยสีประจำเลนอ่อนๆ
        ctx.fillStyle = c.palette.soft;
        if (isProjectorMode) {
          ctx.fillStyle = `${c.palette.base}22`;
        }
        ctx.fillRect(startX - 20, laneY + 2, totalTrackDist + 40, laneHeight - 4);

        // เส้นแบ่งลู่วิ่ง
        ctx.strokeStyle = isProjectorMode ? '#334155' : '#E2E8F0';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(width, laneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // หมายเลขเลนด้านซ้ายสุด
        ctx.fillStyle = c.palette.base;
        ctx.beginPath();
        ctx.arc(42, laneY + laneHeight / 2, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Prompt, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, 42, laneY + laneHeight / 2);
      }

      // เส้นขอบล่างสุดของสนาม
      ctx.strokeStyle = isProjectorMode ? '#334155' : '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, trackMarginTop + trackHeight);
      ctx.lineTo(width, trackMarginTop + trackHeight);
      ctx.stroke();

      // 2. เส้นสตาร์ต (Start Line)
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, trackMarginTop);
      ctx.lineTo(startX, trackMarginTop + trackHeight);
      ctx.stroke();

      // 3. เส้นชัยตารางหมากรุก (Checkered Finish Line)
      const checkerSize = 8;
      const numRows = Math.floor(trackHeight / checkerSize);
      for (let r = 0; r < numRows; r++) {
        for (let col = 0; col < 2; col++) {
          const isBlack = (r + col) % 2 === 0;
          ctx.fillStyle = isBlack ? '#1E293B' : '#FFFFFF';
          ctx.fillRect(finishX + col * checkerSize, trackMarginTop + r * checkerSize, checkerSize, checkerSize);
        }
      }

      // ป้าย FINISH เหนือเส้นชัย
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 12px Prompt, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH 🏁', finishX + checkerSize, trackMarginTop - 12);

      // 4. ริบบิ้นเส้นชัยสีแดง (Finish Ribbon)
      if (!ribbonBrokenRef.current) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(finishX + 8, trackMarginTop);
        ctx.lineTo(finishX + 8, trackMarginTop + trackHeight);
        ctx.stroke();
      }

      // 5. วาดตัวละครนักวิ่ง Chibi แต่ละคน
      currentContestants.forEach((c) => {
        const laneCenterY = trackMarginTop + c.laneIndex * laneHeight + laneHeight / 2;
        const runnerX = startX + c.currentProgress * totalTrackDist;

        // บันทึกสถานะ Canvas เพื่อวาด Chibi
        ctx.save();
        ctx.translate(runnerX, laneCenterY);

        // ฝุ่นความเร็วเมื่อกำลังวิ่ง
        if (isRacing && !c.hasCrossedFinish) {
          const dustOffset = Math.sin(runCycle * 14 + c.laneIndex) * 3;
          ctx.fillStyle = isProjectorMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(148, 163, 184, 0.35)';
          ctx.beginPath();
          ctx.arc(-24 + dustOffset, 12, 5, 0, Math.PI * 2);
          ctx.arc(-32 + dustOffset, 10, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // ก้าวกระโดดของตัวละคร (Bobbing Animation)
        const bobY = isRacing && !c.hasCrossedFinish ? Math.abs(Math.sin(runCycle * 16 + c.laneIndex)) * -5 : 0;
        ctx.translate(0, bobY);

        // ขาซ้ายและขวาขยับสลับกัน
        const legSwing = isRacing && !c.hasCrossedFinish ? Math.sin(runCycle * 16 + c.laneIndex) * 8 : 0;

        // ขาซ้าย
        ctx.strokeStyle = c.palette.base;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-2, 10);
        ctx.lineTo(-4 - legSwing, 18);
        ctx.stroke();

        // ขาขวา
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.lineTo(6 + legSwing, 18);
        ctx.stroke();

        // ลำตัว (เสื้อทีมสีพาสเทล)
        ctx.fillStyle = c.palette.base;
        ctx.beginPath();
        ctx.roundRect(-10, -2, 20, 14, 5);
        ctx.fill();

        // แขนแกว่ง
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(-12 + legSwing, 8);
        ctx.moveTo(8, 2);
        ctx.lineTo(12 - legSwing, 8);
        ctx.stroke();

        // ศีรษะ Chibi กลมมนน่ารัก
        ctx.fillStyle = '#FED7AA'; // ผิวขาวอมชมพู
        ctx.beginPath();
        ctx.arc(0, -12, 12, 0, Math.PI * 2);
        ctx.fill();

        // ทรงผม Chibi สีน้ำตาลเข้ม
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, -16, 12, Math.PI, 0, false);
        ctx.fill();

        // ผ้าโพกหัว Hachimaki สีขาวคาดหน้าผาก
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-12, -16, 24, 4);

        // โบว์ผ้าโพกหัวปลิวไสวข้างหลัง
        const ribbonWave = isRacing ? Math.sin(runCycle * 12 + c.laneIndex) * 4 : 0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, -14);
        ctx.quadraticCurveTo(-18, -16 + ribbonWave, -22, -12 + ribbonWave);
        ctx.stroke();

        // จุดสีแดงตรงกลางผ้าโพกหัว (ธงนำชัย)
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(0, -14, 2, 0, Math.PI * 2);
        ctx.fill();

        // ดวงตากลมโตมุ่งมั่น
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(4, -12, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // รอยยิ้ม
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(4, -9, 2.5, 0, Math.PI, false);
        ctx.stroke();

        // แก้มอมชมพู
        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.arc(5, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // ป้ายชื่อนักเรียนลอยอยู่เหนือศีรษะ (Pastel Name Tag)
        const nameText = `${c.number ? `[#${c.number}] ` : ''}${c.name}`;
        ctx.font = 'bold 12px Prompt, sans-serif';
        const textWidth = ctx.measureText(nameText).width;
        const tagPadding = 8;
        const tagW = textWidth + tagPadding * 2;
        const tagH = 20;

        // กล่องป้ายชื่อ
        ctx.fillStyle = isProjectorMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = c.palette.base;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tagW / 2, -44, tagW, tagH, 6);
        ctx.fill();
        ctx.stroke();

        // ข้อความชื่อนักเรียน
        ctx.fillStyle = isProjectorMode ? '#F8FAFC' : c.palette.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, 0, -34);

        // ป้ายอันดับเมื่อเข้าเส้นชัยแล้ว
        if (c.finishRank) {
          const medal = c.finishRank === 1 ? '🥇' : c.finishRank === 2 ? '🥈' : c.finishRank === 3 ? '🥉' : `${c.finishRank}`;
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(medal, tagW / 2 + 10, -34);
        }

        ctx.restore();
      });

      // 6. วาด Confetti ฉลองชัย
      if (confettiRef.current.length > 0) {
        confettiRef.current.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
      }
    },
    [isProjectorMode, isRacing]
  );

  // Main Animation Loop (60 FPS)
  useEffect(() => {
    let active = true;

    const tick = (timestamp: number) => {
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // จัดการ DPR Scaling สำหรับจอ Retina/4K Projector
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      if (isRacing) {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsedMs = timestamp - startTimeRef.current;

        // เล่นเสียงฝีเท้าเบาๆ เป็นจังหวะ
        if (timestamp - footstepTimerRef.current > 140) {
          onPlaySound?.('tick', 320 + Math.random() * 80);
          footstepTimerRef.current = timestamp;
        }

        // คำนวณเฟรมฟิสิกส์
        const { updatedContestants, newFinishers, allFinished } = updateContestantsFrame(
          contestants,
          elapsedMs
        );

        // ตรวจสอบคนเข้าเส้นชัยใหม่
        if (newFinishers.length > 0) {
          newFinishers.forEach((finisher) => {
            // เมื่อผู้ชนะแตะเส้นชัยเป็นคนแรก
            if (finisher.isWinner && !ribbonBrokenRef.current) {
              ribbonBrokenRef.current = true;
              spawnConfetti(rect.width - 110, rect.height / 2);
              onPlaySound?.('fanfare');
              setChampion(finisher);
              onWinnerConfirmed(finisher.studentRef);

              // 🔊 อ่านชื่อภาษาไทยและตามด้วยคำชมภาษาญี่ปุ่น (TTS)
              if (ttsEnabled) {
                tts.speakStudentName(finisher.number, finisher.name, true);
                const praiseTimer = setTimeout(() => {
                  tts.speakJapanesePraise(selectedPraise, true);
                }, 1200);
                ttsTimeoutRef.current.push(praiseTimer);
              }
            }
          });

          setFinishers((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = newFinishers.filter((f) => !existingIds.has(f.id));
            const combined = [...prev, ...fresh];
            // กำหนด rank ตามลำดับที่แตะเส้นชัย
            return combined.map((item, idx) => ({ ...item, finishRank: idx + 1 }));
          });
        }

        setContestants(updatedContestants);

        // อัปเดต Confetti
        if (confettiRef.current.length > 0) {
          confettiRef.current = confettiRef.current
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.15, // แรงโน้มถ่วง
              rotation: p.rotation + p.rotationSpeed,
              opacity: p.opacity - 0.007,
            }))
            .filter((p) => p.opacity > 0);
        }

        // เมื่อทุกคนเข้าเส้นชัยเสร็จสิ้น
        if (allFinished) {
          setIsRacing(false);
          setRaceFinished(true);
          onRaceStateChange?.(false);
          // แสดงโพเดียมหลังจากนั้น 600ms
          const podiumTimer = setTimeout(() => {
            setShowPodium(true);
          }, 600);
          ttsTimeoutRef.current.push(podiumTimer);
        }
      }

      // วาดเฟรมปัจจุบัน
      drawArena(ctx, displayWidth, displayHeight, contestants, timestamp / 1000);

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isRacing,
    contestants,
    drawArena,
    onPlaySound,
    onWinnerConfirmed,
    ttsEnabled,
    selectedPraise,
    onRaceStateChange,
  ]);

  // ฟังก์ชันมอบเหรียญด่วนใน Podium
  const handleAwardPodiumCoin = (c: RaceContestant, amount: number = 1) => {
    onAwardCoin(c.id, amount);
    onPlaySound?.('coin');
    setAwardedRewards((prev) => {
      const current = prev[c.id] || { coin: 0, ticket: 0 };
      return {
        ...prev,
        [c.id]: { ...current, coin: current.coin + amount },
      };
    });
  };

  // ฟังก์ชันมอบตั๋วด่วนใน Podium
  const handleAwardPodiumTicket = (c: RaceContestant, amount: number = 1) => {
    onAwardTicket(c.id, amount);
    onPlaySound?.('coin');
    setAwardedRewards((prev) => {
      const current = prev[c.id] || { coin: 0, ticket: 0 };
      return {
        ...prev,
        [c.id]: { ...current, ticket: current.ticket + amount },
      };
    });
  };

  // ดึง Top 3 ผู้เข้าเส้นชัย
  const topThree = useMemo(() => {
    const sorted = [...finishers].sort((a, b) => (a.finishRank || 99) - (b.finishRank || 99));
    return sorted.slice(0, 3);
  }, [finishers]);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col gap-4 transition-all duration-300 ${
        isProjectorMode ? 'text-white' : 'text-[#163A66]'
      }`}
    >
      {/* Race Top Controller Bar */}
      <div
        className={`rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* จำนวนเลนวิ่ง (Lane Selector) */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'}>
              จำนวนลู่วิ่ง:
            </span>
            <select
              value={laneCount}
              onChange={(e) => {
                const count = Number(e.target.value);
                setLaneCount(count);
              }}
              disabled={isRacing}
              className={`rounded-xl px-2.5 py-1.5 font-bold text-xs transition border ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              {[4, 5, 6, 8, 10].map((num) => (
                <option key={num} value={num} disabled={students.length < num}>
                  {num} เลน {students.length < num ? `(มีนักเรียน ${students.length} คน)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* ความเร็วการวิ่ง */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'}>
              ระยะเวลาแข่ง:
            </span>
            <select
              value={raceSpeed}
              onChange={(e) => setRaceSpeed(e.target.value as RaceSpeed)}
              disabled={isRacing}
              className={`rounded-xl px-2.5 py-1.5 font-bold text-xs transition border ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              <option value="fast">⚡ เร็ว (3.8 วิ)</option>
              <option value="normal">🏃 ปกติ (5.8 วิ)</option>
              <option value="dramatic">🎭 ลุ้นระทึก (8.2 วิ)</option>
            </select>
          </div>

          {/* สุ่มฮีตใหม่ */}
          <button
            onClick={handleSetupNewHeat}
            disabled={isRacing || students.length === 0}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
              isProjectorMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-[#F7FAFF] hover:bg-blue-50 border-[#E2E8F0] text-[#163A66]'
            }`}
          >
            <Refresh1Regular className="w-3.5 h-3.5 text-blue-500" />
            <span>สุ่มฮีตผู้เข้าแข่งใหม่</span>
          </button>
        </div>

        {/* ปุ่มปล่อยตัววิ่งแข่ง (Primary Action CTA) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartRace}
            disabled={isRacing || contestants.length === 0}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95 ${
              isRacing
                ? 'bg-slate-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <Play className={`w-4 h-4 fill-current ${isRacing ? 'animate-pulse' : ''}`} />
            <span>{isRacing ? 'กำลังวิ่งแข่งชิงชัย! 🏃💨' : 'ปล่อยตัวนักวิ่ง (Spacebar)'}</span>
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Track Container */}
      <div
        className={`w-full rounded-2xl overflow-hidden border relative transition-all ${
          isProjectorMode
            ? 'bg-slate-950 border-slate-800 shadow-2xl'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-[380px] md:h-[460px] block cursor-pointer select-none"
          onClick={() => {
            if (!isRacing && !raceFinished) {
              handleStartRace();
            }
          }}
        />

        {/* ผู้ชนะประกาศตัวกลางจอระหว่างเข้าเส้นชัย */}
        {champion && !showPodium && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border-2 border-amber-400 rounded-2xl px-6 py-2.5 shadow-2xl flex items-center gap-3 animate-bounce">
            <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                เข้าเส้นชัยอันดับ 1 (แชมเปียน)!
              </p>
              <h4 className="text-lg font-black text-[#163A66] dark:text-white">
                {champion.number ? `เลขที่ ${champion.number} ` : ''}
                {champion.name}
              </h4>
            </div>
          </div>
        )}
      </div>

      {/* Victory Podium Modal / Overlay */}
      {showPodium && champion && (
        <div
          className={`rounded-2xl p-5 border shadow-xl transition-all animate-in fade-in zoom-in-95 duration-300 ${
            isProjectorMode
              ? 'bg-slate-900/95 border-slate-700'
              : 'bg-gradient-to-b from-blue-50/60 to-white border-blue-200/80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b pb-3.5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-[#163A66] dark:text-white">
                  ผลการแข่งขันวิ่งแข่งชิงแชมป์ประจำคาบ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  มอบเหรียญรางวัลและตั๋วสุ่มพิเศษให้กับนักเรียนได้ทันที
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSetupNewHeat}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>แข่งรอบใหม่ (ฮีตถัดไป)</span>
              </button>
            </div>
          </div>

          {/* การ์ดอันดับ Podium 1st, 2nd, 3rd */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((c, idx) => {
              const rank = c.finishRank || idx + 1;
              const isChamp = rank === 1;
              const rewardsGiven = awardedRewards[c.id] || { coin: 0, ticket: 0 };

              return (
                <div
                  key={c.id}
                  className={`rounded-2xl p-4 border relative flex flex-col justify-between transition-all ${
                    isChamp
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg ring-2 ring-amber-400/40 md:-translate-y-2'
                      : rank === 2
                      ? 'border-slate-300 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700'
                      : 'border-amber-700/30 bg-amber-900/5 dark:bg-slate-800/40 dark:border-slate-700'
                  }`}
                >
                  {/* Badge อันดับ */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        isChamp
                          ? 'bg-amber-400 text-amber-900 shadow-sm'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {rank === 1 ? '🥇 อันดับ 1 ชนะเลิศ' : rank === 2 ? '🥈 อันดับ 2 รองชนะเลิศ' : '🥉 อันดับ 3'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ลู่ที่ {c.laneIndex + 1}
                    </span>
                  </div>

                  {/* ข้อมูลนักเรียน */}
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-blue-500">
                      {c.studentCode ? `รหัส ${c.studentCode}` : ''}{' '}
                      {c.number ? `• เลขที่ ${c.number}` : ''}
                    </p>
                    <h4 className="text-base font-bold text-[#163A66] dark:text-white leading-tight">
                      {c.name}
                    </h4>
                  </div>

                  {/* ปุ่มมอบรางวัลด่วน (+1🪙, +1🎟️) */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAwardPodiumCoin(c, 1)}
                        className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                      >
                        <Coin2Regular className="w-3.5 h-3.5" />
                        <span>+1 🪙</span>
                      </button>
                      <button
                        onClick={() => handleAwardPodiumTicket(c, 1)}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                      >
                        <TicketRegular className="w-3.5 h-3.5" />
                        <span>+1 🎟️</span>
                      </button>
                    </div>

                    {(rewardsGiven.coin > 0 || rewardsGiven.ticket > 0) && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ได้รับ: +{rewardsGiven.coin}🪙 {rewardsGiven.ticket > 0 ? `+${rewardsGiven.ticket}🎟️` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
