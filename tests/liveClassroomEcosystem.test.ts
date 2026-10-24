// tests/liveClassroomEcosystem.test.ts
// Automated Tests สำหรับตรวจสอบความถูกต้องของ Live Classroom Ecosystem ทั้งหมด

import assert from 'node:assert/strict';
import { soundFX } from '../src/services/soundFXEngine';
import {
  calculateStudentTierMap,
  getThailandTodayRange,
  type LiveStudent,
} from '../src/services/liveClassroomService';
import {
  generateBalancedGroups,
  buildWeightedWheelSegments,
  pickWeightedWheelWinner,
} from '../src/utils/liveClassroomAlgorithms';

async function runTests() {
  console.log('🧪 Running Live Classroom Ecosystem Tests...');

  // 1. ทดสอบ SoundFXEngine ใน Node Environment (SSR/Headless Fallback)
  soundFX.setMuted(false);
  assert.doesNotThrow(() => {
    soundFX.playTick(600, 0.03);
    soundFX.playCoin();
    soundFX.playFanfare();
    soundFX.playBuzzer();
  }, 'SoundFXEngine should safely execute without crashing in headless environment');

  // 2. ทดสอบการคำนวณขอบเขตวันตามเวลาประเทศไทย (UTC+7)
  const sampleDate = new Date('2026-10-24T03:05:00.000Z'); // 10:05 น. เวลาไทย
  const range = getThailandTodayRange(sampleDate);
  assert.equal(range.dateKey, '2026-10-24');
  assert.equal(range.startOfDayUTC.toISOString(), '2026-10-23T17:00:00.000Z');

  // 3. ทดสอบ Auto-Tier Percentile (33% High, 34% Mid, 33% Low) และกรณีคะแนนเป็น 0 ทั้งห้อง
  const zeroStudents = [
    { id: 's1', totalCoins: 0, totalTickets: 0 },
    { id: 's2', totalCoins: 0, totalTickets: 0 },
    { id: 's3', totalCoins: 0, totalTickets: 0 },
  ];
  const zeroTierMap = calculateStudentTierMap(zeroStudents);
  assert.equal(zeroTierMap['s1'], 'high');
  assert.equal(zeroTierMap['s2'], 'mid');
  assert.equal(zeroTierMap['s3'], 'low');

  const scoredStudents = [
    { id: 'top', totalCoins: 20, totalTickets: 5 }, // score = 35
    { id: 'mid', totalCoins: 10, totalTickets: 0 }, // score = 10
    { id: 'low', totalCoins: 1, totalTickets: 0 },  // score = 1
  ];
  const scoredTierMap = calculateStudentTierMap(scoredStudents);
  assert.equal(scoredTierMap['top'], 'high');
  assert.equal(scoredTierMap['mid'], 'mid');
  assert.equal(scoredTierMap['low'], 'low');

  // 4. ทดสอบการแบ่งกลุ่มสมดุลและการเกลี่ยเศษ
  const sampleRoster: LiveStudent[] = Array.from({ length: 10 }, (_, i) => ({
    id: `std-${i + 1}`,
    studentCode: `690${i + 1}`,
    name: `นักเรียนคนที่ ${i + 1}`,
    present: true,
    totalCoins: i * 2,
    totalTickets: i % 3,
    sessionCoins: 0,
    sessionTickets: i % 2 === 0 ? 3 : 1,
    tier: (['high', 'mid', 'low'] as const)[i % 3],
  }));

  const groups = generateBalancedGroups({
    students: sampleRoster,
    mode: 'byGroupCount',
    targetValue: 3,
    strategy: 'balanced',
    autoLeader: true,
  });
  assert.equal(groups.length, 3);
  const sizes = groups.map((g) => g.members.length).sort();
  assert.deepEqual(sizes, [3, 3, 4], '10 students in 3 groups must distribute as 3, 3, 4');
  assert.ok(groups.every((g) => g.leaderId !== null), 'Every group must have an auto-assigned leader');

  // 5. ทดสอบการคำนวณสัดส่วนวงล้อตั๋วสุ่ม (ตั๋ว 3 ใบ ต้องมีขนาดมุมเป็น 3 เท่าของตั๋ว 1 ใบ)
  const twoStudents: LiveStudent[] = [
    { ...sampleRoster[0], id: 'std-A', sessionTickets: 3, present: true },
    { ...sampleRoster[1], id: 'std-B', sessionTickets: 1, present: true },
  ];
  const segments = buildWeightedWheelSegments(twoStudents, 'session');
  assert.equal(segments.length, 2);
  const spanA = segments[0].endAngle - segments[0].startAngle;
  const spanB = segments[1].endAngle - segments[1].startAngle;
  assert.equal(spanA, 270, 'Student with 3/4 tickets must occupy 270 degrees');
  assert.equal(spanB, 90, 'Student with 1/4 tickets must occupy 90 degrees');

  const spinResult = pickWeightedWheelWinner(segments, 0);
  assert.ok(spinResult !== null);
  assert.ok(spinResult.nextRotationDeg >= 360 * 6);

  console.log('✅ All Live Classroom Ecosystem tests passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
