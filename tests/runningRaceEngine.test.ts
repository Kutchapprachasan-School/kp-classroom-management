// tests/runningRaceEngine.test.ts
// Unit Tests สำหรับฟิสิกส์การวิ่งแข่ง (Dynamic Suspense Physics & Heat Slicer)

import assert from 'node:assert/strict';
import {
  calculateHarmonicProgress,
  prepareRaceContestants,
  updateContestantsFrame,
  RACE_LANE_PALETTES,
} from '../src/utils/racePhysicsEngine';
import type { LiveStudent } from '../src/services/liveClassroomService';

function runRaceEngineTests() {
  console.log('🏃💨 Running Race Physics Engine Tests...');

  // 1. ตรวจสอบ Boundary Conditions ของสมการ Harmonic Perturbation
  // ที่ u = 0 ต้องได้ progress = 0
  const startProgress = calculateHarmonicProgress(0, 0, 0.15, 0.08, 1.2);
  assert.equal(startProgress, 0, 'Progress at u=0 must strictly be 0');

  // ที่ u = 1 ต้องได้ progress = 1
  const endProgress = calculateHarmonicProgress(1, 0.95, 0.15, 0.08, 1.2);
  assert.equal(endProgress, 1, 'Progress at u=1 must strictly be 1');

  // 2. ตรวจสอบ Monotonic Forward Motion (นักวิ่งต้องไม่ถอยหลัง)
  let lastProgress = 0;
  for (let ms = 0; ms <= 6000; ms += 50) {
    const u = ms / 6000;
    const progress = calculateHarmonicProgress(u, lastProgress, 0.14, 0.09, 2.5);
    assert.ok(
      progress >= lastProgress,
      `Progress must be monotonic: got ${progress} < ${lastProgress} at ms=${ms}`
    );
    lastProgress = progress;
  }
  assert.equal(lastProgress, 1.0, 'Runner must reach exactly 1.0 at finish');

  // 3. ตรวจสอบ Strict Zero-Mock Policy & Heat Slicer สำหรับห้องเรียนขนาด 35-45 คน
  const mockPool: LiveStudent[] = Array.from({ length: 40 }, (_, idx) => ({
    id: `student-${idx + 1}`,
    studentCode: `ST${1000 + idx}`,
    name: `นักเรียนคนที่ ${idx + 1}`,
    number: idx + 1,
    present: true,
    sessionCoins: 0,
    sessionTickets: 0,
    totalCoins: 10,
    totalTickets: 2,
    gender: idx % 2 === 0 ? 'M' : 'F',
  }));

  const laneCount = 6;
  const baseDuration = 5000;
  const { contestants, winner } = prepareRaceContestants(mockPool, laneCount, baseDuration);

  // ต้องได้ผู้เข้าแข่งขัน 6 คนตามจำนวนเลน
  assert.equal(contestants.length, 6, 'Must prepare exactly 6 contestants for 6 lanes');

  // ผู้เข้าแข่งขันทุกคนต้องมาจาก pool จริง ห้ามสร้างชื่อปลอมขึ้นมาเอง
  const poolIds = new Set(mockPool.map((s) => s.id));
  contestants.forEach((c) => {
    assert.ok(poolIds.has(c.id), `Contestant ${c.name} must exist in actual student pool`);
    assert.ok(c.laneIndex >= 0 && c.laneIndex < 6, 'Lane index must be within range');
  });

  // ห้ามมีนักเรียนซ้ำกันในฮีตเดียวกัน
  const uniqueContestantIds = new Set(contestants.map((c) => c.id));
  assert.equal(
    uniqueContestantIds.size,
    6,
    'All contestants in the same heat must be unique students'
  );

  // 4. ตรวจสอบการันตีผู้ชนะ (Deterministic Winner Precedence)
  const winnerContestant = contestants.find((c) => c.isWinner);
  assert.ok(winnerContestant, 'There must be exactly one winner designated');
  assert.equal(winnerContestant.id, winner.id, 'Winner contestant must match returned winner');
  assert.equal(
    winnerContestant.targetFinishMs,
    baseDuration,
    'Winner finish time must equal baseDurationMs'
  );

  // ผู้ชนะต้องแตะเส้นชัยเร็วกว่าคนอื่นทุกคน (No Tie)
  contestants.forEach((c) => {
    if (!c.isWinner) {
      assert.ok(
        c.targetFinishMs > winnerContestant.targetFinishMs,
        `Contestant ${c.name} (${c.targetFinishMs}ms) must finish strictly after winner (${winnerContestant.targetFinishMs}ms)`
      );
      // ตรวจสอบระยะห่างขั้นต่ำ (อย่างน้อย 160ms) เพื่อไม่ให้เกิด Photo-finish Tie
      const gap = c.targetFinishMs - winnerContestant.targetFinishMs;
      assert.ok(gap >= 160, `Finish time gap (${gap}ms) must be at least 160ms to prevent tie`);
    }
  });

  // 5. ตรวจสอบการจำลอง Frame Tick จนจบการแข่งขัน
  let currentContestants = contestants;
  let winnerCrossedAt: number | null = null;
  let allFinishedAt: number | null = null;

  for (let elapsed = 0; elapsed <= 8000; elapsed += 16.6) {
    const { updatedContestants, newFinishers, allFinished } = updateContestantsFrame(
      currentContestants,
      elapsed
    );
    currentContestants = updatedContestants;

    if (newFinishers.some((c) => c.isWinner) && winnerCrossedAt === null) {
      winnerCrossedAt = elapsed;
    }

    if (allFinished && allFinishedAt === null) {
      allFinishedAt = elapsed;
      break;
    }
  }

  assert.ok(winnerCrossedAt !== null, 'Winner must cross the finish line');
  // ผู้ชนะควรเข้าเส้นชัยใกล้เคียงกับ 5000ms (+-100ms)
  assert.ok(
    winnerCrossedAt! >= 4900 && winnerCrossedAt! <= 5100,
    `Winner crossed at ${winnerCrossedAt}ms, expected close to 5000ms`
  );
  assert.ok(allFinishedAt !== null, 'All runners must eventually finish the race');
  assert.ok(allFinishedAt! > winnerCrossedAt!, 'All runners must finish after winner');

  // 6. ตรวจสอบ Color Palettes 10 เฉดสีพาสเทล
  assert.equal(RACE_LANE_PALETTES.length, 10, 'Must have 10 soft pastel lane palettes');

  console.log('✅ All Running Race Physics Engine Tests Passed Successfully!\n');
}

runRaceEngineTests();
