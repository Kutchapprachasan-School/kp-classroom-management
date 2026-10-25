// src/components/live-classroom/RunningTrackArena.tsx
// สนามวิ่งแข่งสุ่มชื่อนักเรียน 2.0 (Running Track Arena 2.0: Dynamic Camera & No-Overlap Layout)
// แยก Left Roster Column (HTML) กับ 2,400px Side-Scrolling Track Canvas (60 FPS) อย่างสมบูรณ์แบบ
// ปลอดป้ายชื่อทับซ้อน 100%, ฉากเลื่อนตามกล้อง 3 ระยะ, และรองรับทั้งจอมือถือและโปรเจกเตอร์

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Flag,
  Play,
  RotateCcw,
  Trophy,
  Coins,
  Ticket,
  Sparkles,
  Users,
  Timer,
  SkipForward,
  Gauge,
} from 'lucide-react';
import {
  WORLD_TRACK_LENGTH,
  START_WORLD_X,
  FINISH_WORLD_X,
  MIN_LANE_HEIGHT_PX,
  PROJECTOR_LANE_HEIGHT_PX,
  STADIUM_HEADER_HEIGHT_PX,
  getTrackDistanceMarkers,
  computeRunnerProgress,
  computeRunnerWorldX,
  computeCurrentMeters,
  computeNextCameraX,
  worldToScreenX,
} from '../../utils/racePhysicsEngine';
import type { LiveStudent } from '../../services/liveClassroomService';
import { tts, type JapanesePraise } from '../../utils/speechTTS';

// ==========================================
// 1. TYPES & STRICT ZERO-MOCK INTERFACES
// ==========================================
export interface RaceCandidate {
  id: string;
  number?: number;
  label: string;
  subLabel?: string;
  coins?: number;
  rawStudent?: LiveStudent;
}

interface RunnerInstance {
  candidate: RaceCandidate;
  laneIndex: number;
  laneColor: string;
  accentColor: string;
  borderColor: string;
  rankTarget: number;
  targetFinishMs: number;
  phaseOffset: number;
  burstAmp1: number;
  burstAmp2: number;
  progress: number;
  worldX: number;
  finished: boolean;
  finishTimestampMs: number | null;
  currentRank: number;
}

interface ConfettiParticle {
  worldX: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export interface RunningTrackArenaProps {
  students?: LiveStudent[];
  candidates?: RaceCandidate[];
  isProjectorMode?: boolean;
  soundEnabled?: boolean;
  ttsEnabled?: boolean;
  selectedPraise?: JapanesePraise;
  onWinnerConfirmed?: (winner: LiveStudent, podium?: LiveStudent[]) => void;
  onAwardCoin?: (studentId: string, amount: number) => void;
  onAwardTicket?: (studentId: string, amount: number) => void;
  onGiveReward?: (
    targetIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onSkipWinner?: (winnerId: string) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle', freq?: number) => void;
  onRaceStateChange?: (isRunning: boolean) => void;
}

const PASTEL_LANES = [
  { bg: '#FDF2F8', track: '#FCE7F3', border: '#F472B6', accent: '#DB2777', name: 'Sakura' },
  { bg: '#F0F9FF', track: '#E0F2FE', border: '#38BDF8', accent: '#0284C7', name: 'Sora' },
  { bg: '#ECFDF5', track: '#D1FAE5', border: '#34D399', accent: '#059669', name: 'Matcha' },
  { bg: '#F5F3FF', track: '#EDE9FE', border: '#A78BFA', accent: '#7C3AED', name: 'Fuji' },
  { bg: '#FFFBEB', track: '#FEF3C7', border: '#FBBF24', accent: '#D97706', name: 'Yuzu' },
  { bg: '#FFF1F2', track: '#FFE4E6', border: '#FB7185', accent: '#E11D48', name: 'Momo' },
  { bg: '#ECFEFF', track: '#CFFAFE', border: '#22D3EE', accent: '#0891B2', name: 'Ramune' },
  { bg: '#F7FEE7', track: '#ECFCCB', border: '#A3E635', accent: '#65A30D', name: 'Melon' },
  { bg: '#FAF5FF', track: '#F3E8FF', border: '#C084FC', accent: '#9333EA', name: 'Sumire' },
  { bg: '#FFF7ED', track: '#FFEDD5', border: '#FB923C', accent: '#EA580C', name: 'Mikan' },
];

const DISTANCE_MARKERS = getTrackDistanceMarkers();

// ==========================================
// 2. CRYPTOGRAPHIC FAIR SHUFFLE
// ==========================================
function cryptoShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const randomBuffer = new Uint32Array(arr.length);
    window.crypto.getRandomValues(randomBuffer);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomBuffer[i] % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } else {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

// ==========================================
// 3. WEB AUDIO API RACE SYNTHESIZER (0 BYTE)
// ==========================================
class RaceAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playStartWhistle() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();

    lfo.frequency.setValueAtTime(42, now);
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(osc.frequency);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2750, now);

    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    mainGain.gain.setValueAtTime(0.22, now + 0.35);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(mainGain);
    mainGain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.5);
    osc.stop(now + 0.5);
  }

  playFootstep(pitchOffset = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + pitchOffset, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.045);

    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const start = ctx.currentTime + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  }

  cleanup() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

const raceAudio = new RaceAudioSynthesizer();

// ==========================================
// 4. MAIN COMPONENT: RunningTrackArena 2.0
// ==========================================
export const RunningTrackArena: React.FC<RunningTrackArenaProps> = ({
  students,
  candidates,
  isProjectorMode = false,
  soundEnabled = true,
  ttsEnabled = true,
  selectedPraise = 'sugoi',
  onWinnerConfirmed,
  onAwardCoin,
  onAwardTicket,
  onGiveReward,
  onSkipWinner,
  onPlaySound,
  onRaceStateChange,
}) => {
  // แปลง candidates ให้รองรับทั้ง prop candidates และ prop students (Strict Zero-Mock)
  const rawCandidates: RaceCandidate[] = useMemo(() => {
    if (candidates && candidates.length > 0) return candidates;
    if (students && students.length > 0) {
      return students.map((st) => ({
        id: st.id,
        number: st.number,
        label: st.name,
        subLabel: st.studentCode,
        coins: st.sessionCoins,
        rawStudent: st,
      }));
    }
    return [];
  }, [candidates, students]);

  const [maxLanes, setMaxLanes] = useState<number>(() =>
    Math.min(8, Math.max(4, rawCandidates.length || 6))
  );
  const [raceDurationSec, setRaceDurationSec] = useState<number>(6);
  const [raceStatus, setRaceStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [podium, setPodium] = useState<RunnerInstance[]>([]);
  const [liveRanksById, setLiveRanksById] = useState<Record<string, number>>({});
  const [leaderMeters, setLeaderMeters] = useState<number>(0);
  const [liveLeaderName, setLiveLeaderName] = useState<string>('');
  const [heatSeed, setHeatSeed] = useState<number>(0);
  const [awardedRewards, setAwardedRewards] = useState<Record<string, { coin: number; ticket: number }>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runnersRef = useRef<RunnerInstance[]>([]);
  const cameraXRef = useRef<number>(0);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const lastStepSoundTimeRef = useRef<number>(0);
  const lastUiSyncTimeRef = useRef<number>(0);
  const ribbonBrokenRef = useRef<boolean>(false);
  const ttsTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ความสูงต่อลู่วิ่งแบบบังคับขั้นต่ำ >= 54px เพื่อไม่ให้ตัวละครอึดอัดบนมือถือ
  const laneHeightPx = isProjectorMode ? PROJECTOR_LANE_HEIGHT_PX : MIN_LANE_HEIGHT_PX;

  // คัดกรองผู้เข้าแข่งขันลงลู่ (Fisher-Yates Shuffle)
  const activeLaneCandidates = useMemo(() => {
    if (rawCandidates.length === 0) return [];
    const shuffled = cryptoShuffle(rawCandidates);
    return shuffled.slice(0, Math.min(maxLanes, shuffled.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCandidates, maxLanes, heatSeed]);

  const totalCanvasHeight =
    STADIUM_HEADER_HEIGHT_PX + Math.max(1, activeLaneCandidates.length) * laneHeightPx;

  // ล้าง TTS Timeouts ทั้งหมด
  const clearAllTTSTimeouts = useCallback(() => {
    ttsTimeoutsRef.current.forEach(clearTimeout);
    ttsTimeoutsRef.current = [];
  }, []);

  // สร้างข้อมูลนักวิ่งเริ่มต้นในพิกัดโลกเสมือน
  const initializeRunners = useCallback(
    (laneItems: RaceCandidate[], durationSec: number): RunnerInstance[] => {
      const ranks = cryptoShuffle(
        Array.from({ length: laneItems.length }, (_, index) => index + 1)
      );
      const baseDurationMs = durationSec * 1000;

      return laneItems.map((candidate, idx) => {
        const assignedRank = ranks[idx];
        const palette = PASTEL_LANES[idx % PASTEL_LANES.length];
        const rankDelayMs = (assignedRank - 1) * 165 + (idx % 3) * 16;

        const direction = idx % 2 === 0 ? 1 : -1;
        const burstAmp1 = direction * (0.068 + (idx % 3) * 0.024);
        const burstAmp2 = -direction * (0.058 + ((idx + 1) % 3) * 0.019);

        return {
          candidate,
          laneIndex: idx,
          laneColor: palette.track,
          accentColor: palette.accent,
          borderColor: palette.border,
          rankTarget: assignedRank,
          targetFinishMs: baseDurationMs + rankDelayMs,
          phaseOffset: idx * 0.85,
          burstAmp1,
          burstAmp2,
          progress: 0,
          worldX: START_WORLD_X,
          finished: false,
          finishTimestampMs: null,
          currentRank: idx + 1,
        };
      });
    },
    []
  );

  // สร้างพลุ Confetti แตกกระจายที่เส้นชัยเมื่ออันดับ 1 วิ่งชนริบบิ้น
  const spawnFinishConfetti = useCallback((canvasHeight: number) => {
    const particles: ConfettiParticle[] = [];
    const colors = ['#F472B6', '#38BDF8', '#34D399', '#FBBF24', '#A78BFA', '#FB7185'];
    for (let i = 0; i < 55; i++) {
      particles.push({
        worldX: FINISH_WORLD_X + (Math.random() - 0.3) * 35,
        y: STADIUM_HEADER_HEIGHT_PX + Math.random() * (canvasHeight - STADIUM_HEADER_HEIGHT_PX),
        vx: (Math.random() - 0.2) * 6.5,
        vy: (Math.random() - 0.85) * 7.5,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 5,
        alpha: 1,
      });
    }
    confettiRef.current = particles;
  }, []);

  // ==========================================
  // 5. SIDE-SCROLLING PARALLAX CANVAS RENDERER
  // ==========================================
  const renderTrackFrame = useCallback(
    (elapsedMs: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const rect = canvas.getBoundingClientRect();
      const viewportW = Math.max(200, rect.width);
      const viewportH = totalCanvasHeight;

      if (
        canvas.width !== Math.floor(viewportW * dpr) ||
        canvas.height !== Math.floor(viewportH * dpr)
      ) {
        canvas.width = Math.floor(viewportW * dpr);
        canvas.height = Math.floor(viewportH * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, viewportW, viewportH);

      const runners = runnersRef.current;
      const cameraX = cameraXRef.current;

      // --------------------------------------------------
      // A. วาดแถบขอบสนามด้านบน + ป้ายบอกระยะ 10m..100m ที่เลื่อนตามกล้อง
      // --------------------------------------------------
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, viewportW, STADIUM_HEADER_HEIGHT_PX);

      // ลายอัฒจันทร์ Parallax ด้านบน (เลื่อนช้ากว่ากล้อง 0.5 เท่าเพื่อสร้างมิติลึก)
      const parallaxOffset = (cameraX * 0.5) % 80;
      ctx.fillStyle = '#1E293B';
      for (let x = -parallaxOffset; x < viewportW; x += 80) {
        ctx.fillRect(x, 0, 40, 6);
      }

      // วาดป้ายระยะทางทุกๆ 10m (START, 10m, 20m ... 100m FINISH)
      ctx.font = 'bold 11px Prompt, sans-serif';
      ctx.textBaseline = 'middle';
      DISTANCE_MARKERS.forEach((marker) => {
        const sx = worldToScreenX(marker.worldX, cameraX);
        if (sx < -80 || sx > viewportW + 80) return;

        const isMajor = marker.meters === 0 || marker.meters === 50 || marker.meters === 100;
        const badgeW = marker.meters === 100 ? 86 : marker.meters === 0 ? 54 : 38;

        ctx.fillStyle =
          marker.meters === 100
            ? '#E11D48'
            : marker.meters === 0
            ? '#4F46E5'
            : isMajor
            ? '#0284C7'
            : '#334155';

        ctx.beginPath();
        ctx.roundRect(sx - badgeW / 2, 8, badgeW, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, sx, 19);
      });

      // --------------------------------------------------
      // B. วาดพื้นลู่วิ่งพาสเทลและเส้น Texture เลื่อนถอยหลัง
      // --------------------------------------------------
      runners.forEach((_, idx) => {
        const palette = PASTEL_LANES[idx % PASTEL_LANES.length];
        const yTop = STADIUM_HEADER_HEIGHT_PX + idx * laneHeightPx;

        // พื้นลู่พาสเทล
        ctx.fillStyle = palette.track;
        ctx.fillRect(0, yTop, viewportW, laneHeightPx);

        // แถบสีเข้มสลับทุกๆ 70px ในพิกัดโลก เพื่อให้ตาเห็นความเร็วพื้นลู่วิ่งเลื่อนถอยหลังชัดเจน!
        const stripeStep = 70;
        const firstStripeWorldX = Math.floor(cameraX / stripeStep) * stripeStep;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.028)';
        for (
          let wx = firstStripeWorldX;
          wx < cameraX + viewportW + stripeStep;
          wx += stripeStep * 2
        ) {
          const sx = worldToScreenX(wx, cameraX);
          ctx.fillRect(sx, yTop, stripeStep, laneHeightPx);
        }

        // เส้นแบ่งลู่สีขาวคมชัด
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, yTop + laneHeightPx);
        ctx.lineTo(viewportW, yTop + laneHeightPx);
        ctx.stroke();

        // บล็อกปล่อยตัว (Starting Blocks) ที่จุดสตาร์ต (X = 150px)
        const startScreenX = worldToScreenX(START_WORLD_X, cameraX);
        if (startScreenX > -40 && startScreenX < viewportW + 40) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(
            startScreenX - 24,
            yTop + laneHeightPx * 0.35,
            14,
            laneHeightPx * 0.3,
            3
          );
          ctx.fill();
        }
      });

      // --------------------------------------------------
      // C. วาดเส้นชอล์กบอกระยะทุก 10m พาดผ่านลู่วิ่ง
      // --------------------------------------------------
      DISTANCE_MARKERS.forEach((marker) => {
        const sx = worldToScreenX(marker.worldX, cameraX);
        if (sx < -20 || sx > viewportW + 20) return;

        if (marker.meters === 0) {
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(sx, STADIUM_HEADER_HEIGHT_PX);
          ctx.lineTo(sx, viewportH);
          ctx.stroke();
        } else if (marker.meters < 100) {
          ctx.strokeStyle =
            marker.meters === 50 ? 'rgba(2, 132, 199, 0.35)' : 'rgba(15, 23, 42, 0.14)';
          ctx.lineWidth = marker.meters === 50 ? 2 : 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(sx, STADIUM_HEADER_HEIGHT_PX);
          ctx.lineTo(sx, viewportH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // --------------------------------------------------
      // D. วาดเส้นชัยตารางหมากรุก & ริบบิ้นสีแดงชมพูที่ระยะ 100m (WorldX = 2250)
      // --------------------------------------------------
      const finishScreenX = worldToScreenX(FINISH_WORLD_X, cameraX);
      if (finishScreenX > -60 && finishScreenX < viewportW + 60) {
        const checkerSize = 9;
        for (let y = STADIUM_HEADER_HEIGHT_PX; y < viewportH; y += checkerSize) {
          const row = Math.floor((y - STADIUM_HEADER_HEIGHT_PX) / checkerSize);
          ctx.fillStyle = row % 2 === 0 ? '#0F172A' : '#FFFFFF';
          ctx.fillRect(finishScreenX - checkerSize, y, checkerSize, checkerSize);
          ctx.fillStyle = row % 2 === 0 ? '#FFFFFF' : '#0F172A';
          ctx.fillRect(finishScreenX, y, checkerSize, checkerSize);
        }

        // ริบบิ้นเส้นชัย (ถ้ายังไม่ถูกชนขาด)
        if (!ribbonBrokenRef.current) {
          ctx.strokeStyle = '#E11D48';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(finishScreenX + 2, STADIUM_HEADER_HEIGHT_PX);
          ctx.lineTo(finishScreenX + 2, viewportH);
          ctx.stroke();
        }
      }

      // --------------------------------------------------
      // E. วาดตัวละคร Chibi คาดผ้า Hachimaki (ปลอดป้ายชื่อทับซ้อน 100%!)
      // --------------------------------------------------
      runners.forEach((runner, idx) => {
        const palette = PASTEL_LANES[idx % PASTEL_LANES.length];
        const yCenter = STADIUM_HEADER_HEIGHT_PX + idx * laneHeightPx + laneHeightPx / 2;
        const runnerScreenX = worldToScreenX(runner.worldX, cameraX);

        if (runnerScreenX < -60 || runnerScreenX > viewportW + 60) return;

        const isMoving = elapsedMs > 0 && !runner.finished;
        const stridePhase = isMoving ? elapsedMs * 0.025 + runner.phaseOffset : 0;
        const bounceY = isMoving ? Math.abs(Math.sin(stridePhase)) * -5 : 0;
        const avatarRadius = Math.min(17, Math.max(13, laneHeightPx * 0.25));

        // 1. เส้นสปีดลม (Speed Streaks) & ฝุ่นควันใต้เท้า
        if (isMoving) {
          ctx.strokeStyle = runner.currentRank === 1 ? '#F59E0B' : palette.border;
          ctx.lineWidth = runner.currentRank === 1 ? 2.2 : 1.5;
          for (let s = -1; s <= 1; s++) {
            const streakLen = runner.currentRank === 1 ? 24 : 14;
            ctx.beginPath();
            ctx.moveTo(runnerScreenX - avatarRadius - 5, yCenter + s * 6 + bounceY);
            ctx.lineTo(runnerScreenX - avatarRadius - 5 - streakLen, yCenter + s * 6 + bounceY);
            ctx.stroke();
          }

          const dustOffset = (elapsedMs * 0.18 + idx * 17) % 22;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(
            runnerScreenX - avatarRadius - dustOffset,
            yCenter + avatarRadius * 0.75 - dustOffset * 0.2,
            3.5 - dustOffset * 0.12,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // 2. เงาพื้นใต้เท้านักวิ่ง
        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
          runnerScreenX,
          yCenter + avatarRadius * 0.95,
          avatarRadius * 0.8,
          4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 3. ขาวิ่งสลับซ้าย-ขวา
        const legSwing = Math.sin(stridePhase) * 7.5;
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(runnerScreenX, yCenter + bounceY + 2);
        ctx.lineTo(runnerScreenX + legSwing, yCenter + avatarRadius * 0.92);
        ctx.moveTo(runnerScreenX, yCenter + bounceY + 2);
        ctx.lineTo(runnerScreenX - legSwing, yCenter + avatarRadius * 0.92);
        ctx.stroke();

        // 4. เสื้อวิ่งพละสีประจำลู่
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.roundRect(
          runnerScreenX - avatarRadius * 0.6,
          yCenter - avatarRadius * 0.18 + bounceY,
          avatarRadius * 1.2,
          avatarRadius * 0.88,
          5
        );
        ctx.fill();

        // แขนแกว่งสลับขา
        const armSwing = -legSwing * 0.75;
        ctx.strokeStyle = '#FFE4C4';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(runnerScreenX, yCenter + bounceY);
        ctx.lineTo(runnerScreenX + armSwing, yCenter + avatarRadius * 0.45 + bounceY);
        ctx.stroke();

        // 5. ศีรษะ Chibi
        const headX = runnerScreenX + 2;
        const headY = yCenter - avatarRadius * 0.48 + bounceY;
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(headX, headY, avatarRadius * 0.74, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 6. ผ้าโพกหัว Hachimaki พร้อมชายผ้าปลิวไสวด้านหลัง
        ctx.fillStyle = palette.accent;
        ctx.fillRect(
          headX - avatarRadius * 0.74,
          headY - avatarRadius * 0.38,
          avatarRadius * 1.48,
          4.5
        );
        ctx.beginPath();
        ctx.moveTo(headX - avatarRadius * 0.74, headY - avatarRadius * 0.25);
        ctx.lineTo(
          headX - avatarRadius * 1.45,
          headY - avatarRadius * 0.4 + Math.sin(stridePhase * 1.3) * 4
        );
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 7. ดวงตาอนิเมะมุ่งมั่น + แก้มชมพูพาสเทล
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(headX + avatarRadius * 0.32, headY + 1, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.arc(headX + avatarRadius * 0.18, headY + 4, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 8. ป้ายเบอร์เสื้อจิ๋วด้านหลังตัวละคร (ขนาดเพียง 15px ไม่เกะกะ ไม่บังลู่อื่น)
        const miniBadgeText =
          runner.candidate.number !== undefined
            ? `#${runner.candidate.number}`
            : `L${idx + 1}`;
        ctx.font = 'bold 9.5px sans-serif';
        const tagW = ctx.measureText(miniBadgeText).width + 8;
        const tagX = runnerScreenX - avatarRadius - tagW - 3;
        const tagY = yCenter - 7 + bounceY;

        ctx.fillStyle =
          runner.currentRank === 1 ? '#FACC15' : 'rgba(15, 23, 42, 0.78)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, 15, 4);
        ctx.fill();

        ctx.fillStyle = runner.currentRank === 1 ? '#0F172A' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(miniBadgeText, tagX + tagW / 2, tagY + 8);

        // วาดมงกุฎทองจิ๋ว 👑 เฉพาะคนที่เป็นผู้นำอันดับ 1
        if (runner.currentRank === 1 && elapsedMs > 0) {
          ctx.font = '12px sans-serif';
          ctx.fillText('👑', headX, headY - avatarRadius * 0.95);
        }
      });

      // --------------------------------------------------
      // F. วาดพลุ Confetti ฉลองที่เส้นชัย
      // --------------------------------------------------
      if (confettiRef.current.length > 0) {
        confettiRef.current.forEach((pt) => {
          pt.worldX += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.18;
          pt.alpha = Math.max(0, pt.alpha - 0.012);

          const sx = worldToScreenX(pt.worldX, cameraX);
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.fillRect(sx, pt.y, pt.size, pt.size * 0.7);
          ctx.restore();
        });
      }

      ctx.restore();
    },
    [laneHeightPx, totalCanvasHeight]
  );

  // เตรียมลู่วิ่งเมื่อเปลี่ยนรายการผู้เข้าแข่งขันหรือความยาวเวลา
  useEffect(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    clearAllTTSTimeouts();
    setRaceStatus('idle');
    setPodium([]);
    setLeaderMeters(0);
    setLiveLeaderName('');
    cameraXRef.current = 0;
    confettiRef.current = [];
    ribbonBrokenRef.current = false;
    onRaceStateChange?.(false);

    const initialRunners = initializeRunners(activeLaneCandidates, raceDurationSec);
    runnersRef.current = initialRunners;

    const initialRanks: Record<string, number> = {};
    initialRunners.forEach((r, idx) => {
      initialRanks[r.candidate.id] = idx + 1;
    });
    setLiveRanksById(initialRanks);

    renderTrackFrame(0);
  }, [
    activeLaneCandidates,
    raceDurationSec,
    initializeRunners,
    renderTrackFrame,
    clearAllTTSTimeouts,
    onRaceStateChange,
  ]);

  // วาดซ้ำเมื่อขนาดหน้าจอเปลี่ยน
  useEffect(() => {
    const handleResize = () => renderTrackFrame(0);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderTrackFrame]);

  // Cleanup ป้องกัน Memory Leak
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      clearAllTTSTimeouts();
      raceAudio.cleanup();
    };
  }, [clearAllTTSTimeouts]);

  // ==========================================
  // 6. START 60 FPS RACE & CAMERA TRACKING LOOP
  // ==========================================
  const startRace = useCallback(() => {
    if (activeLaneCandidates.length < 2 || raceStatus === 'running') return;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    clearAllTTSTimeouts();
    runnersRef.current = initializeRunners(activeLaneCandidates, raceDurationSec);
    cameraXRef.current = 0;
    confettiRef.current = [];
    ribbonBrokenRef.current = false;
    setPodium([]);
    setLeaderMeters(0);
    setRaceStatus('running');
    onRaceStateChange?.(true);

    if (soundEnabled) {
      if (onPlaySound) onPlaySound('whistle');
      else raceAudio.playStartWhistle();
    }

    raceStartTimeRef.current = performance.now();
    lastStepSoundTimeRef.current = performance.now();
    lastUiSyncTimeRef.current = performance.now();

    const stepLoop = (now: number) => {
      const elapsedMs = now - raceStartTimeRef.current;

      if (soundEnabled && now - lastStepSoundTimeRef.current > 125) {
        if (onPlaySound) onPlaySound('tick', 320 + Math.random() * 80);
        else raceAudio.playFootstep((elapsedMs % 40) - 20);
        lastStepSoundTimeRef.current = now;
      }

      let allFinished = true;
      let maxLeaderWorldX = START_WORLD_X;

      runnersRef.current.forEach((runner) => {
        const progress = computeRunnerProgress(
          elapsedMs,
          runner.targetFinishMs,
          runner.burstAmp1,
          runner.burstAmp2,
          runner.phaseOffset
        );

        runner.progress = progress;
        runner.worldX = computeRunnerWorldX(progress);

        if (runner.worldX > maxLeaderWorldX) {
          maxLeaderWorldX = runner.worldX;
        }

        if (elapsedMs >= runner.targetFinishMs) {
          if (!runner.finished) {
            runner.finished = true;
            runner.finishTimestampMs = elapsedMs + runner.rankTarget * 0.001;

            if (!ribbonBrokenRef.current && runner.rankTarget === 1) {
              ribbonBrokenRef.current = true;
              spawnFinishConfetti(totalCanvasHeight);
              if (soundEnabled) {
                if (onPlaySound) onPlaySound('fanfare');
                else raceAudio.playVictoryFanfare();
              }

              // 🔊 Web Speech API อ่านชื่อภาษาไทยและตามด้วยคำชมภาษาญี่ปุ่น
              if (ttsEnabled) {
                tts.speakStudentName(runner.candidate.number, runner.candidate.label, true);
                const praiseTimer = setTimeout(() => {
                  tts.speakJapanesePraise(selectedPraise, true);
                }, 1200);
                ttsTimeoutsRef.current.push(praiseTimer);
              }
            }
          }
        } else {
          allFinished = false;
        }
      });

      // จัดลำดับผู้นำแบบ Real-time
      const sortedByProgress = [...runnersRef.current].sort((a, b) => {
        if (a.finished && b.finished) {
          return (a.finishTimestampMs || 0) - (b.finishTimestampMs || 0);
        }
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.worldX - a.worldX;
      });

      sortedByProgress.forEach((r, idx) => {
        r.currentRank = idx + 1;
      });

      // อัปเดตกล้อง 3 ระยะ (Smooth Camera Lerp ตามตำแหน่งผู้นำ)
      const viewportW = canvasRef.current?.getBoundingClientRect().width || 600;
      cameraXRef.current = computeNextCameraX(
        cameraXRef.current,
        maxLeaderWorldX,
        viewportW,
        WORLD_TRACK_LENGTH,
        0.15
      );

      // ซิงค์อันดับและระยะทางเมตรไปที่ Left Roster Column ทุกๆ 100ms
      if (now - lastUiSyncTimeRef.current > 100 || allFinished) {
        const rankMap: Record<string, number> = {};
        sortedByProgress.forEach((r) => {
          rankMap[r.candidate.id] = r.currentRank;
        });
        setLiveRanksById(rankMap);
        setLeaderMeters(computeCurrentMeters(maxLeaderWorldX));
        if (sortedByProgress[0]) {
          setLiveLeaderName(sortedByProgress[0].candidate.label);
        }
        lastUiSyncTimeRef.current = now;
      }

      renderTrackFrame(elapsedMs);

      if (!allFinished) {
        rafIdRef.current = requestAnimationFrame(stepLoop);
      } else {
        setRaceStatus('finished');
        setLeaderMeters(100);
        onRaceStateChange?.(false);
        const finalTop3 = sortedByProgress.slice(0, 3);
        setPodium(finalTop3);

        if (onWinnerConfirmed && finalTop3[0]) {
          const winnerCandidate = finalTop3[0].candidate;
          const winnerStudent: LiveStudent = winnerCandidate.rawStudent || {
            id: winnerCandidate.id,
            name: winnerCandidate.label,
            number: winnerCandidate.number,
            studentCode: winnerCandidate.subLabel || '',
            present: true,
            sessionCoins: winnerCandidate.coins || 0,
            sessionTickets: 0,
            totalCoins: 0,
            totalTickets: 0,
            tier: 'mid',
          };
          const podiumStudents: LiveStudent[] = finalTop3.map(
            (p) =>
              p.candidate.rawStudent || {
                id: p.candidate.id,
                name: p.candidate.label,
                number: p.candidate.number,
                studentCode: p.candidate.subLabel || '',
                present: true,
                sessionCoins: p.candidate.coins || 0,
                sessionTickets: 0,
                totalCoins: 0,
                totalTickets: 0,
                tier: 'mid',
              }
          );
          onWinnerConfirmed(winnerStudent, podiumStudents);
        }
      }
    };

    rafIdRef.current = requestAnimationFrame(stepLoop);
  }, [
    activeLaneCandidates,
    raceStatus,
    raceDurationSec,
    soundEnabled,
    onPlaySound,
    ttsEnabled,
    selectedPraise,
    initializeRunners,
    spawnFinishConfetti,
    totalCanvasHeight,
    renderTrackFrame,
    onRaceStateChange,
    onWinnerConfirmed,
    clearAllTTSTimeouts,
  ]);

  // Spacebar Hotkey
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
      if (e.code === 'Space' && raceStatus !== 'running') {
        e.preventDefault();
        startRace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceStatus, startRace]);

  // มอบเหรียญด่วน
  const handleAwardCoin = (c: RaceCandidate, amount: number) => {
    if (onAwardCoin) onAwardCoin(c.id, amount);
    if (onGiveReward) {
      onGiveReward([c.id], 'coin', amount, `${c.label} ชนะวิ่งแข่ง 100m`);
    }
    if (onPlaySound) onPlaySound('coin');
    else raceAudio.playFootstep();

    setAwardedRewards((prev) => {
      const current = prev[c.id] || { coin: 0, ticket: 0 };
      return {
        ...prev,
        [c.id]: { ...current, coin: current.coin + amount },
      };
    });
  };

  // มอบตั๋วด่วน
  const handleAwardTicket = (c: RaceCandidate, amount: number) => {
    if (onAwardTicket) onAwardTicket(c.id, amount);
    if (onGiveReward) {
      onGiveReward([c.id], 'ticket', amount, `${c.label} ได้ตั๋วสุ่มจากสนามวิ่งแข่ง`);
    }
    if (onPlaySound) onPlaySound('coin');
    else raceAudio.playFootstep();

    setAwardedRewards((prev) => {
      const current = prev[c.id] || { coin: 0, ticket: 0 };
      return {
        ...prev,
        [c.id]: { ...current, ticket: current.ticket + amount },
      };
    });
  };

  if (rawCandidates.length < 2) {
    return (
      <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
        <Flag className="w-14 h-14 mx-auto text-pink-400 opacity-50" />
        <h3 className="text-xl font-bold text-slate-200">
          ต้องมีรายชื่อในกองสุ่มอย่างน้อย 2 รายการเพื่อจัดวิ่งแข่ง
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          ระบบดึงเฉพาะรายชื่อนักเรียนที่มีสถานะมาเรียนจริงและยังไม่ถูกสุ่มซ้ำในคาบนี้ค่ะ (กดปุ่ม &ldquo;รีเซ็ตรายชื่อทั้งหมด&rdquo; ด้านบนเพื่อเริ่มรอบใหม่)
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ====================================================
          1. แถบควบคุมสนามวิ่ง & มาตรวัดระยะทาง 100 เมตร
         ==================================================== */}
      <div
        className={`rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" />
            <span
              className={`font-semibold text-xs ${
                isProjectorMode ? 'text-slate-300' : 'text-[#6B7C93]'
              }`}
            >
              จำนวนลู่:
            </span>
            <select
              value={maxLanes}
              disabled={raceStatus === 'running'}
              onChange={(e) => setMaxLanes(Number(e.target.value))}
              className={`rounded-xl px-2.5 py-1 font-bold text-xs border transition ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-pink-300'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-pink-600'
              }`}
            >
              {[4, 6, 8, 10].map((num) => (
                <option key={num} value={num} disabled={rawCandidates.length < num}>
                  {num} ลู่ {rawCandidates.length < num ? `(มีนักเรียน ${rawCandidates.length} คน)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-sky-500" />
            <span
              className={`font-semibold text-xs ${
                isProjectorMode ? 'text-slate-300' : 'text-[#6B7C93]'
              }`}
            >
              เวลาวิ่ง:
            </span>
            <select
              value={raceDurationSec}
              disabled={raceStatus === 'running'}
              onChange={(e) => setRaceDurationSec(Number(e.target.value))}
              className={`rounded-xl px-2.5 py-1 font-bold text-xs border transition ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-sky-300'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-sky-600'
              }`}
            >
              <option value={4}>4 วินาที (ด่วน)</option>
              <option value={6}>6 วินาที (ปกติ)</option>
              <option value={8}>8 วินาที (ลุ้นระทึก)</option>
            </select>
          </div>
        </div>

        {/* มาตรวัดระยะทาง 100m แบบสด */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>ระยะทาง: {leaderMeters}m / 100m</span>
          </div>

          {raceStatus === 'running' && liveLeaderName && (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full font-bold text-xs animate-pulse">
              👑 ผู้นำ: {liveLeaderName}
            </span>
          )}
        </div>
      </div>

      {/* ====================================================
          2. โครงสร้างเลย์เอาต์ใหม่ NO-OVERLAP SPLIT ARENA
             ซ้าย: Fixed Roster Column | ขวา: Scrolling 2,400px Canvas
         ==================================================== */}
      <div className="w-full rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl bg-slate-950">
        <div className="flex w-full max-h-[620px] overflow-y-auto">
          {/* ฝั่งซ้าย: Left Roster Column (ปลอดการทับซ้อนกับตัวละคร 100%) */}
          <div className="w-[36%] min-w-[130px] max-w-[240px] sm:w-[210px] md:w-[235px] shrink-0 bg-slate-900 border-r-2 border-slate-800 select-none z-10">
            {/* หัวตารางฝั่งซ้าย ล็อกความสูงเท่ากับ STADIUM_HEADER_HEIGHT_PX (38px) */}
            <div
              style={{ height: `${STADIUM_HEADER_HEIGHT_PX}px` }}
              className="px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider"
            >
              <span>ลู่ / นักเรียน</span>
              <span>อันดับ</span>
            </div>

            {/* รายชื่อนักเรียนแต่ละลู่ ล็อกความสูงเท่ากับ laneHeightPx (54px / 66px) */}
            {activeLaneCandidates.map((cand, idx) => {
              const palette = PASTEL_LANES[idx % PASTEL_LANES.length];
              const liveRank = liveRanksById[cand.id] ?? idx + 1;
              const isFirst = liveRank === 1 && raceStatus !== 'idle';

              return (
                <div
                  key={cand.id}
                  style={{ height: `${laneHeightPx}px` }}
                  className={`px-2.5 border-b border-slate-800/90 flex items-center justify-between gap-1.5 transition-colors ${
                    isFirst ? 'bg-amber-500/15' : 'bg-slate-900/95'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: palette.accent }}
                      className="w-6 h-6 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {cand.number !== undefined ? `#${cand.number} ` : ''}
                        {cand.label}
                      </p>
                      {cand.coins !== undefined && (
                        <p className="text-[10px] text-amber-400 font-semibold leading-none mt-0.5">
                          🪙 {cand.coins}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      liveRank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : liveRank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : liveRank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {liveRank === 1 ? '👑 1' : `#${liveRank}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ฝั่งขวา: Side-Scrolling 100m Track Canvas */}
          <div className="flex-1 min-w-0 relative bg-slate-950">
            <canvas
              ref={canvasRef}
              style={{ height: `${totalCanvasHeight}px` }}
              className="w-full block"
            />
          </div>
        </div>
      </div>

      {/* ====================================================
          3. ปุ่มปล่อยตัวนักวิ่งและสลับฮีตใหม่
         ==================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={startRace}
          disabled={raceStatus === 'running'}
          className="flex items-center gap-2.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-sky-500 hover:from-pink-400 hover:to-sky-400 disabled:opacity-50 text-white font-extrabold text-base md:text-lg px-8 md:px-9 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/25 transition transform active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>
            {raceStatus === 'running'
              ? `กำลังสปรินต์ (${leaderMeters}m / 100m)...`
              : '🔫 เป่านกหวีดปล่อยตัว 100 เมตร! (Spacebar)'}
          </span>
        </button>

        <button
          onClick={() => setHeatSeed((prev) => prev + 1)}
          disabled={raceStatus === 'running'}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 font-bold px-5 py-3.5 rounded-2xl transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>สลับตัวแทนลงลู่ใหม่</span>
        </button>
      </div>

      {/* ====================================================
          4. แท่นรับรางวัล VICTORY PODIUM (🥇 1st, 🥈 2nd, 🥉 3rd)
         ==================================================== */}
      {raceStatus === 'finished' && podium.length > 0 && (
        <div className="bg-gradient-to-b from-indigo-950/90 to-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  ผลการแข่งขัน 100 เมตร (Victory Podium)
                </h3>
                <p className="text-xs text-slate-400">
                  มอบเหรียญหรือตั๋วสุ่มให้แชมป์ประจำฮีต หรือแจกรางวัลครบทั้ง Top 3 ได้ในคลิกเดียวค่ะ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  podium.forEach((p) => handleAwardCoin(p.candidate, 1));
                }}
                className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>แจก +1 เหรียญ ให้ Top 3 ทุกคน</span>
              </button>

              {onSkipWinner && (
                <button
                  onClick={() => onSkipWinner(podium[0].candidate.id)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>ข้ามแชมป์ (ไม่อยู่ในห้อง)</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podium.map((runner, idx) => {
              const medal =
                idx === 0 ? '🥇 อันดับ 1 (แชมป์)' : idx === 1 ? '🥈 อันดับ 2' : '🥉 อันดับ 3';
              const cardStyle =
                idx === 0
                  ? 'border-amber-400 bg-amber-500/10'
                  : idx === 1
                  ? 'border-slate-400 bg-slate-800/70'
                  : 'border-amber-700 bg-slate-900/80';
              const rewardsGiven = awardedRewards[runner.candidate.id] || { coin: 0, ticket: 0 };

              return (
                <div
                  key={runner.candidate.id}
                  className={`border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 ${cardStyle}`}
                >
                  <div>
                    <span className="text-xs font-extrabold text-amber-300">
                      {medal} • ลู่ที่ {runner.laneIndex + 1}
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">
                      {runner.candidate.number !== undefined
                        ? `เลขที่ ${runner.candidate.number} • `
                        : ''}
                      {runner.candidate.label}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() =>
                          handleAwardCoin(runner.candidate, idx === 0 ? 2 : 1)
                        }
                        className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs transition active:scale-95"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>+{idx === 0 ? 2 : 1} เหรียญ</span>
                      </button>

                      <button
                        onClick={() => handleAwardTicket(runner.candidate, 1)}
                        className="flex-1 flex items-center justify-center gap-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 font-bold py-2 px-3 rounded-xl text-xs transition active:scale-95"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>+1 ตั๋วสุ่ม</span>
                      </button>
                    </div>

                    {(rewardsGiven.coin > 0 || rewardsGiven.ticket > 0) && (
                      <span className="text-[11px] font-bold text-emerald-400 shrink-0">
                        ได้รับ: +{rewardsGiven.coin} เหรียญ
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

export default RunningTrackArena;
