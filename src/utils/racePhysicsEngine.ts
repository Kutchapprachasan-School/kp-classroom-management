// src/utils/racePhysicsEngine.ts
// ฟิสิกส์การวิ่งแบบ Harmonic Perturbation สำหรับสนามแข่ง RunningTrackArena
// สร้างความตื่นเต้นด้วยการแซงสลับตำแหน่งผู้นำ แต่การันตีผู้ชนะแตะเส้นชัยอันดับ 1 เสมอ 100% โดยไม่เกิดการเสมอกัน (Tie)

import type { LiveStudent } from '../services/liveClassroomService';

export interface LanePalette {
  base: string;
  soft: string;
  border: string;
  text: string;
  label: string;
}

export const RACE_LANE_PALETTES: LanePalette[] = [
  { base: '#38BDF8', soft: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', label: 'ลู่ 1 ฟ้าสดใส' },
  { base: '#FB7185', soft: '#FFF1F2', border: '#FECDD3', text: '#BE123C', label: 'ลู่ 2 คอรัลพิงก์' },
  { base: '#34D399', soft: '#ECFDF5', border: '#A7F3D0', text: '#047857', label: 'ลู่ 3 เขียวมินต์' },
  { base: '#FBBF24', soft: '#FFFBEB', border: '#FDE68A', text: '#B45309', label: 'ลู่ 4 เหลืองอำพัน' },
  { base: '#A78BFA', soft: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', label: 'ลู่ 5 ม่วงลาเวนเดอร์' },
  { base: '#F472B6', soft: '#FDF2F8', border: '#FBCFE8', text: '#BE185D', label: 'ลู่ 6 ชมพูซากุระ' },
  { base: '#22D3EE', soft: '#ECFEFF', border: '#A5F3FC', text: '#0E7490', label: 'ลู่ 7 ฟ้าไซแอน' },
  { base: '#FB923C', soft: '#FFF7ED', border: '#FED7AA', text: '#C2410C', label: 'ลู่ 8 ส้มแทนเจอรีน' },
  { base: '#A3E635', soft: '#F7FEE7', border: '#D9F99D', text: '#4D7C0F', label: 'ลู่ 9 เขียวมะนาว' },
  { base: '#818CF8', soft: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', label: 'ลู่ 10 ครามสดใส' },
];

export interface RaceContestant {
  id: string;
  name: string;
  number?: number;
  studentCode?: string;
  avatarUrl?: string;
  laneIndex: number;
  palette: LanePalette;
  studentRef: LiveStudent;
  targetFinishMs: number;
  perturbation: {
    A1: number;
    A2: number;
    phi: number;
  };
  currentProgress: number; // 0.0 ถึง 1.0
  prevProgress: number;
  finishRank?: number; // 1 = Champion, 2 = 2nd, etc.
  hasCrossedFinish: boolean;
  isWinner: boolean;
}

/**
 * คำนวณระยะก้าวหน้า progress จากเวลา u \in [0, 1] ด้วย Harmonic Wave
 * ที่จุด u = 0 และ u = 1 พจน์คลื่นไซน์ทั้งหมดจะกลายเป็น 0 ทำให้เริ่มต้นที่จุดสตาร์ตและเข้าเส้นชัยตรงเป๊ะ
 */
export function calculateHarmonicProgress(
  u: number,
  prevProgress: number,
  A1: number,
  A2: number,
  phi: number
): number {
  const clampedU = Math.min(1, Math.max(0, u));
  if (clampedU <= 0) return 0;
  if (clampedU >= 1) return 1;

  // คลื่นสร้างความลุ้นระทึก: A1 * sin(pi * u) * sin(2*pi*u + phi) + A2 * sin(2*pi*u) * (1 - u)
  // ที่ u=0: sin(0) = 0 -> offset = 0
  // ที่ u=1: sin(pi) = 0 และ (1 - 1) = 0 -> offset = 0
  const offset =
    A1 * Math.sin(Math.PI * clampedU) * Math.sin(2 * Math.PI * clampedU + phi) +
    A2 * Math.sin(2 * Math.PI * clampedU) * (1 - clampedU);

  const raw = clampedU + offset;
  // ไม่ให้นักวิ่งถอยหลัง (Monotonic Forward Motion)
  return Math.min(1, Math.max(prevProgress, raw));
}

/**
 * สุ่มตัวแทนเข้าแข่งขันสำหรับฮีตนี้ (ตามจำนวนเลนที่เลือก) และกำหนดผู้ชนะล่วงหน้าอย่างยุติธรรม
 */
export function prepareRaceContestants(
  pool: LiveStudent[],
  laneCount: number,
  baseDurationMs: number = 6000
): { contestants: RaceContestant[]; winner: LiveStudent } {
  if (pool.length === 0) {
    throw new Error('Cannot prepare race contestants from an empty student pool');
  }

  // 1. สุ่มเลือกนักเรียนตามจำนวนเลน โดยไม่ซ้ำคน (Fisher-Yates Shuffle)
  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
  }

  const selectedCount = Math.min(laneCount, shuffledPool.length);
  const contestantsSelection = shuffledPool.slice(0, selectedCount);

  // 2. สุ่มเลือกผู้ชนะในฮีตนี้ 1 คนอย่างยุติธรรม
  const winnerIndex = Math.floor(Math.random() * contestantsSelection.length);
  const winnerStudent = contestantsSelection[winnerIndex];

  // 3. กำหนดลำดับเข้าเส้นชัยที่แน่นอน (Finishing Order) โดยไม่มีทางเสมอ
  // ผู้ชนะ = อันดับ 1 (baseDurationMs)
  // คนอื่นๆ จัดอันดับ 2, 3, ... N และบวกเวลาห่างกันอย่างน้อย 160-240ms
  const otherIndices = contestantsSelection
    .map((_, idx) => idx)
    .filter((idx) => idx !== winnerIndex);

  // สลับลำดับคนอื่นๆ
  for (let i = otherIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherIndices[i], otherIndices[j]] = [otherIndices[j], otherIndices[i]];
  }

  const finishTimes: number[] = new Array(contestantsSelection.length);
  finishTimes[winnerIndex] = baseDurationMs;

  let currentStaggerMs = baseDurationMs + 240;
  otherIndices.forEach((cIdx) => {
    // บวกเวลาห่างแบบมี jitter เล็กน้อย แต่รับประกันว่ามากกว่าคนก่อนหน้าเสมอ
    const jitter = Math.floor(Math.random() * 80);
    finishTimes[cIdx] = currentStaggerMs + jitter;
    currentStaggerMs += 200 + jitter;
  });

  // 4. สร้าง Contestant Objects พร้อม Harmonic Perturbation Parameters
  const contestants: RaceContestant[] = contestantsSelection.map((st, idx) => {
    const isWinner = idx === winnerIndex;
    const palette = RACE_LANE_PALETTES[idx % RACE_LANE_PALETTES.length];

    // ผู้ชนะจะมีแอมพลิจูดเร่งแซงช่วงท้าย
    const A1 = isWinner ? 0.12 + Math.random() * 0.05 : 0.08 + Math.random() * 0.08;
    const A2 = isWinner ? 0.08 + Math.random() * 0.04 : 0.06 + Math.random() * 0.06;
    const phi = Math.random() * Math.PI * 2;

    return {
      id: st.id,
      name: st.name,
      number: st.number,
      studentCode: st.studentCode,
      avatarUrl: st.avatarUrl,
      laneIndex: idx,
      palette,
      studentRef: st,
      targetFinishMs: finishTimes[idx],
      perturbation: { A1, A2, phi },
      currentProgress: 0,
      prevProgress: 0,
      hasCrossedFinish: false,
      isWinner,
    };
  });

  return { contestants, winner: winnerStudent };
}

/**
 * คำนวณความคืบหน้าของนักวิ่งทุกคนในแต่ละเฟรม (Frame Tick)
 */
export function updateContestantsFrame(
  contestants: RaceContestant[],
  elapsedMs: number
): {
  updatedContestants: RaceContestant[];
  newFinishers: RaceContestant[];
  allFinished: boolean;
} {
  const newFinishers: RaceContestant[] = [];

  const updatedContestants = contestants.map((c) => {
    if (c.hasCrossedFinish) {
      return c;
    }

    const u = Math.min(1, elapsedMs / c.targetFinishMs);
    const progress = calculateHarmonicProgress(
      u,
      c.prevProgress,
      c.perturbation.A1,
      c.perturbation.A2,
      c.perturbation.phi
    );

    const hasCrossed = progress >= 1.0;
    const updated: RaceContestant = {
      ...c,
      prevProgress: progress,
      currentProgress: progress,
      hasCrossedFinish: hasCrossed,
    };

    if (hasCrossed && !c.hasCrossedFinish) {
      newFinishers.push(updated);
    }

    return updated;
  });

  const allFinished = updatedContestants.every((c) => c.hasCrossedFinish);

  return { updatedContestants, newFinishers, allFinished };
}
