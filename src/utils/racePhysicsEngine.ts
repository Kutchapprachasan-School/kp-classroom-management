// src/utils/racePhysicsEngine.ts
// ระบบฟิสิกส์พิกัดโลกเสมือน 2,400px และกล้องติดตาม 3 ระยะ (Running Race 2.0 Engine)
// รองรับ Virtual 100m Track, Distance Markers, Dynamic Camera Lerp และแก้ปัญหาเสมอกัน (No Tie Bug)

import type { LiveStudent } from '../services/liveClassroomService';

export const WORLD_TRACK_LENGTH = 2400; // ความยาวโลกเสมือนทั้งหมด (px)
export const START_WORLD_X = 150;       // จุดปล่อยตัว (Starting Blocks)
export const FINISH_WORLD_X = 2250;     // เส้นชัย 100m (ระยะวิ่งสุทธิ 2,100 px)
export const MIN_LANE_HEIGHT_PX = 54;   // ความสูงขั้นต่ำต่อลู่บนมือถือ (>= 50px)
export const PROJECTOR_LANE_HEIGHT_PX = 66;
export const STADIUM_HEADER_HEIGHT_PX = 38;

export interface DistanceMarker {
  meters: number;
  label: string;
  worldX: number;
}

/**
 * สร้างพิกัดเสาบอกระยะทางทุกๆ 10 เมตร (0m, 10m, 20m ... 100m FINISH)
 */
export function getTrackDistanceMarkers(): DistanceMarker[] {
  const markers: DistanceMarker[] = [];
  const sprintDistance = FINISH_WORLD_X - START_WORLD_X; // 2,100 px

  for (let m = 0; m <= 100; m += 10) {
    const ratio = m / 100;
    markers.push({
      meters: m,
      label: m === 0 ? 'START' : m === 100 ? '100m FINISH' : `${m}m`,
      worldX: Math.round(START_WORLD_X + ratio * sprintDistance),
    });
  }
  return markers;
}

/**
 * คำนวณสัดส่วนการวิ่ง (0.0 ถึง 1.045) พร้อมคลื่นเร่งแซง (Harmonic Micro-Bursts)
 * รับประกันว่าที่ t = 0 ทุกคนอยู่ที่จุดสตาร์ต (0) และแตะเส้นชัย (1.0) ตามเวลาเป้าหมายอย่างแม่นยำ
 */
export function computeRunnerProgress(
  elapsedMs: number,
  targetFinishMs: number,
  burstAmp1: number,
  burstAmp2: number,
  phaseOffset: number
): number {
  if (elapsedMs <= 0) return 0;
  const u = Math.min(1, Math.max(0, elapsedMs / targetFinishMs));

  if (u >= 1) {
    // วิ่งทะลุเส้นชัยไปชะลอตัวในโซน Run-off ด้านหลังเส้นชัยเล็กน้อย
    const extraTimeRatio = Math.min(1, (elapsedMs - targetFinishMs) / 600);
    return 1 + extraTimeRatio * 0.045;
  }

  const wave1 = burstAmp1 * Math.sin(2 * Math.PI * u + phaseOffset) * (1 - u);
  const wave2 = burstAmp2 * Math.sin(4 * Math.PI * u) * u * (1 - u);
  return Math.max(0, Math.min(0.998, u + wave1 + wave2));
}

/**
 * แปลงสัดส่วนการวิ่ง (Progress) เป็นพิกัด X ในโลกเสมือน (Virtual World X)
 */
export function computeRunnerWorldX(
  progress: number,
  startX: number = START_WORLD_X,
  finishX: number = FINISH_WORLD_X
): number {
  return startX + progress * (finishX - startX);
}

/**
 * คำนวณระยะทางเมตรปัจจุบัน (0m - 100m) สำหรับแสดงบน HUD
 */
export function computeCurrentMeters(worldX: number): number {
  const ratio = (worldX - START_WORLD_X) / (FINISH_WORLD_X - START_WORLD_X);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

/**
 * ระบบกล้องติดตามอัจฉริยะ 3 ระยะ (3-Phase Smooth Camera Lerp)
 * - ระยะที่ 1 (Start 0-12%): กล้องเกาะจุดสตาร์ตเพื่อดูจังหวะออกตัวจากบล็อก
 * - ระยะที่ 2 (Mid-Sprint 12-88%): กล้องจัดให้ผู้นำอยู่บริเวณ 45% ของความกว้างหน้าจอ
 * - ระยะที่ 3 (Final Dash 88-100%): กล้องล็อกขอบขวาของสนามเพื่อให้เห็นเส้นชัยและริบบิ้นชัดเจน
 */
export function computeNextCameraX(
  currentCameraX: number,
  leaderWorldX: number,
  viewportWidth: number,
  worldLength: number = WORLD_TRACK_LENGTH,
  lerpFactor: number = 0.14
): number {
  const maxCameraX = Math.max(0, worldLength - viewportWidth);

  // ช่วงออกตัว (ยังไม่พ้น 75px แรกในโลกเสมือน) ให้ตรึงกล้องใกล้จุดสตาร์ตชั่วคราว
  if (leaderWorldX <= START_WORLD_X + 75) {
    const nextCam = currentCameraX + (0 - currentCameraX) * lerpFactor;
    return Math.abs(nextCam) < 0.5 ? 0 : nextCam;
  }

  // จัดตำแหน่งให้กลุ่มผู้นำอยู่ราวๆ 45% ของหน้าจอ เพื่อให้เห็นทั้งคนที่ไล่กวดด้านหลังและลู่ข้างหน้า
  const rawTargetX = leaderWorldX - viewportWidth * 0.45;
  const clampedTargetX = Math.max(0, Math.min(maxCameraX, rawTargetX));

  const nextCam = currentCameraX + (clampedTargetX - currentCameraX) * lerpFactor;
  return Math.abs(clampedTargetX - nextCam) < 0.5 ? clampedTargetX : nextCam;
}

/**
 * แปลงพิกัดโลกเสมือน (World X) เป็นพิกัดวาดบนหน้าจอ (Screen X)
 */
export function worldToScreenX(worldX: number, cameraX: number): number {
  return worldX - cameraX;
}

// ==========================================
// BACKWARD COMPATIBILITY HELPERS
// ==========================================

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

  const offset =
    A1 * Math.sin(Math.PI * clampedU) * Math.sin(2 * Math.PI * clampedU + phi) +
    A2 * Math.sin(2 * Math.PI * clampedU) * (1 - clampedU);

  const raw = clampedU + offset;
  return Math.min(1, Math.max(prevProgress, raw));
}

export function prepareRaceContestants(
  pool: LiveStudent[],
  laneCount: number,
  baseDurationMs: number = 6000
) {
  if (pool.length === 0) {
    throw new Error('Cannot prepare race contestants from an empty student pool');
  }

  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
  }

  const selectedCount = Math.min(laneCount, shuffledPool.length);
  const contestantsSelection = shuffledPool.slice(0, selectedCount);
  const winnerIndex = Math.floor(Math.random() * contestantsSelection.length);
  const winnerStudent = contestantsSelection[winnerIndex];

  const finishTimes: number[] = new Array(contestantsSelection.length);
  finishTimes[winnerIndex] = baseDurationMs;

  let currentStaggerMs = baseDurationMs + 240;
  contestantsSelection.forEach((_, idx) => {
    if (idx !== winnerIndex) {
      finishTimes[idx] = currentStaggerMs;
      currentStaggerMs += 200;
    }
  });

  const contestants = contestantsSelection.map((st, idx) => ({
    id: st.id,
    name: st.name,
    number: st.number,
    studentCode: st.studentCode,
    laneIndex: idx,
    palette: RACE_LANE_PALETTES[idx % RACE_LANE_PALETTES.length],
    studentRef: st,
    targetFinishMs: finishTimes[idx],
    isWinner: idx === winnerIndex,
  }));

  return { contestants, winner: winnerStudent };
}
