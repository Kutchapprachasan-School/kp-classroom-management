// tests/liveClassroomEcosystem.test.ts
// Automated Tests สำหรับตรวจสอบความถูกต้องของ Live Classroom Ecosystem ทั้งหมด

import assert from 'node:assert/strict';
import { soundFX } from '../src/services/soundFXEngine';
import {
  calculateStudentTierMap,
  getThailandTodayRange,
  liveClassroomService,
  detectStudentGender,
  type LiveStudent,
} from '../src/services/liveClassroomService';
import { tts, formatStudentNameForSpeech } from '../src/utils/speechTTS';
import {
  generateBalancedGroups,
  buildWeightedWheelSegments,
  pickWeightedWheelWinner,
} from '../src/utils/liveClassroomAlgorithms';
import {
  getAvailablePool,
  restoreSkippedStudent,
} from '../src/components/live-classroom/RandomPickerSubTab';
import { formatTimerMMSS } from '../src/components/live-classroom/LiveTimerSubTab';
import { swapStudentsBetweenGroups } from '../src/components/live-classroom/GroupGeneratorSubTab';
import {
  calculateTopEarners,
  formatRewardTimeThai,
} from '../src/components/live-classroom/RewardBoardSubTab';
import { describeArcSlice } from '../src/components/live-classroom/LuckyTicketDrawModal';
import {
  calculateHarmonicProgress,
  prepareRaceContestants,
} from '../src/utils/racePhysicsEngine';
import { inferGradeLevelFromCourseCode } from '../src/services/coursesCurriculumService';

async function runTests() {
  console.log('🧪 Running Live Classroom Ecosystem Tests...');

  // 1. ทดสอบ SoundFXEngine ใน Node Environment (SSR/Headless Fallback)
  soundFX.setMuted(false);
  assert.doesNotThrow(() => {
    soundFX.playTick(600, 0.03);
    soundFX.playCoin();
    soundFX.playFanfare();
    soundFX.playBuzzer();
    soundFX.playWhistle();
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

  // 4.1 ทดสอบการคละชาย-หญิง (Balance Gender) และการแยกเพศจากคำนำหน้าชื่อไทย
  assert.equal(detectStudentGender('เด็กชายสมศักดิ์ รักดี'), 'MALE');
  assert.equal(detectStudentGender('ด.ช. เก่งกาจ'), 'MALE');
  assert.equal(detectStudentGender('นายกิตติศักดิ์'), 'MALE');
  assert.equal(detectStudentGender('เด็กหญิงกานดา สดใส'), 'FEMALE');
  assert.equal(detectStudentGender('ด.ญ. สุพัตรา'), 'FEMALE');
  assert.equal(detectStudentGender('นางสาวพิมพ์ชนก'), 'FEMALE');

  const mixedGenderRoster: LiveStudent[] = [
    { ...sampleRoster[0], id: 'b1', name: 'ด.ช. ก', gender: 'MALE', present: true },
    { ...sampleRoster[1], id: 'b2', name: 'ด.ช. ข', gender: 'MALE', present: true },
    { ...sampleRoster[2], id: 'b3', name: 'ด.ช. ค', gender: 'MALE', present: true },
    { ...sampleRoster[3], id: 'b4', name: 'ด.ช. ง', gender: 'MALE', present: true },
    { ...sampleRoster[4], id: 'g1', name: 'ด.ญ. จ', gender: 'FEMALE', present: true },
    { ...sampleRoster[5], id: 'g2', name: 'ด.ญ. ฉ', gender: 'FEMALE', present: true },
    { ...sampleRoster[6], id: 'g3', name: 'ด.ญ. ช', gender: 'FEMALE', present: true },
    { ...sampleRoster[7], id: 'g4', name: 'ด.ญ. ซ', gender: 'FEMALE', present: true },
  ];

  const genderBalancedGroups = generateBalancedGroups({
    students: mixedGenderRoster,
    mode: 'byGroupCount',
    targetValue: 2,
    strategy: 'balanced',
    autoLeader: false,
    balanceGender: true,
  });
  assert.equal(genderBalancedGroups.length, 2);
  genderBalancedGroups.forEach((g) => {
    const maleCount = g.members.filter((m) => m.gender === 'MALE').length;
    const femaleCount = g.members.filter((m) => m.gender === 'FEMALE').length;
    assert.equal(maleCount, 2, 'Each group must have 2 boys');
    assert.equal(femaleCount, 2, 'Each group must have 2 girls');
  });

  // 4.2 ทดสอบการเอานักเรียนที่ไม่มาเรียนออก (excludeAbsent: true vs false)
  const rosterWithAbsents: LiveStudent[] = [
    { ...mixedGenderRoster[0], id: 'st-p1', present: true },
    { ...mixedGenderRoster[1], id: 'st-p2', present: true },
    { ...mixedGenderRoster[2], id: 'st-a1', present: false },
    { ...mixedGenderRoster[3], id: 'st-a2', present: false },
  ];
  const excludedGroups = generateBalancedGroups({
    students: rosterWithAbsents,
    mode: 'byGroupCount',
    targetValue: 2,
    strategy: 'random',
    autoLeader: false,
    excludeAbsent: true,
  });
  assert.equal(excludedGroups.reduce((acc, g) => acc + g.members.length, 0), 2, 'Must only include 2 present students');

  const includedGroups = generateBalancedGroups({
    students: rosterWithAbsents,
    mode: 'byGroupCount',
    targetValue: 2,
    strategy: 'random',
    autoLeader: false,
    excludeAbsent: false,
  });
  assert.equal(includedGroups.reduce((acc, g) => acc + g.members.length, 0), 4, 'Must include all 4 students when excludeAbsent is false');

  // 4.3 ทดสอบการแยกขอบเขต Group Preset ตามครูผู้สอนและรายวิชา
  const key1 = liveClassroomService.getGroupPresetStorageKey('room-1-1', 'teacher-A', 'Math');
  const key2 = liveClassroomService.getGroupPresetStorageKey('room-1-1', 'teacher-B', 'Science');
  assert.notEqual(key1, key2, 'Preset keys for different teachers and subjects must never collide');

  // 4.4 ทดสอบระบบจัดเก็บชุดคำศัพท์ (Word Decks) แยกครูผู้สอนและรายวิชา
  const deckKeyTeacher1 = liveClassroomService.getWordDeckStorageKey('room-1-1', 'teacher-1', 'English');
  const deckKeyTeacher2 = liveClassroomService.getWordDeckStorageKey('room-1-1', 'teacher-2', 'Science');
  assert.notEqual(deckKeyTeacher1, deckKeyTeacher2, 'Word deck keys for different teachers and subjects must be isolated');

  const sampleWords = ['Photosynthesis', 'Chloroplast', 'Mitochondria', '  Mitochondria  ', ' '];
  const savedDeck = liveClassroomService.saveWordDeck(
    'room-1-1',
    'ชีววิทยา Unit 1',
    sampleWords,
    'teacher-1',
    'ครูสมศรี',
    'Biology'
  );
  assert.equal(savedDeck.name, 'ชีววิทยา Unit 1');
  assert.deepEqual(savedDeck.words, ['Photosynthesis', 'Chloroplast', 'Mitochondria'], 'Must trim and deduplicate words');

  // 4.5 ทดสอบ SpeechTTSEngine ในสภาพแวดล้อม Headless/Node (Safe fallback ปราศจาก Error)
  assert.doesNotThrow(() => {
    tts.speakStudentName(5, 'เด็กชายสมหมาย', true);
    tts.speakJapanesePraise('sugoi', true);
    tts.speakJapanesePraise('yatta', true);
    tts.speakJapanesePraise('excellent', true);
    tts.speakText('Photosynthesis', 'en-US', true);
    tts.stop();
  }, 'SpeechTTSEngine should safely execute in headless environment without crashing');

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

  // 6. ทดสอบ Pure Function ของ RandomPicker (getAvailablePool & restoreSkippedStudent)
  const poolA = getAvailablePool(sampleRoster, ['std-1', 'std-2'], true);
  assert.equal(poolA.length, 8, 'Pool should exclude picked students when noRepeat is true');
  assert.ok(!poolA.some((s) => s.id === 'std-1' || s.id === 'std-2'));

  const poolB = getAvailablePool(sampleRoster, ['std-1', 'std-2'], false);
  assert.equal(poolB.length, 10, 'Pool should include all present students when noRepeat is false');

  const restoredIds = restoreSkippedStudent(['std-1', 'std-2', 'std-3'], 'std-2');
  assert.deepEqual(restoredIds, ['std-1', 'std-3'], 'restoreSkippedStudent should remove skipped student ID');

  // 7. ทดสอบ Pure Function ของ LiveTimer (formatTimerMMSS)
  assert.equal(formatTimerMMSS(125), '02:05');
  assert.equal(formatTimerMMSS(5), '00:05');
  assert.equal(formatTimerMMSS(0), '00:00');
  assert.equal(formatTimerMMSS(-10), '00:00');

  // 8. ทดสอบ Pure Function ของ GroupGenerator (swapStudentsBetweenGroups พร้อมสืบทอดตำแหน่งหัวหน้ากลุ่ม)
  groups[0].leaderId = groups[0].members[0].id; // ตั้งคนแรกของกลุ่ม 1 เป็นหัวหน้า
  const swappedGroups = swapStudentsBetweenGroups(groups, groups[0].members[0].id, groups[1].members[0].id);
  assert.equal(swappedGroups[0].members[0].id, groups[1].members[0].id);
  assert.equal(swappedGroups[1].members[0].id, groups[0].members[0].id);
  assert.equal(swappedGroups[0].leaderId, groups[1].members[0].id, 'ตำแหน่งหัวหน้ากลุ่มต้องสืบทอดสู่สมาชิกใหม่ที่สลับเข้ามาแทน');

  // 9. ทดสอบ Pure Function ของ RewardBoard (calculateTopEarners)
  const earnersRoster: LiveStudent[] = [
    { ...sampleRoster[0], id: 's-1', sessionCoins: 2, sessionTickets: 0 }, // score = 4
    { ...sampleRoster[1], id: 's-2', sessionCoins: 1, sessionTickets: 2 }, // score = 2 + 6 = 8
    { ...sampleRoster[2], id: 's-3', sessionCoins: 5, sessionTickets: 1 }, // score = 10 + 3 = 13
    { ...sampleRoster[3], id: 's-4', sessionCoins: 0, sessionTickets: 0 }, // 0
  ];
  const topEarners = calculateTopEarners(earnersRoster, 2);
  assert.equal(topEarners.length, 2);
  assert.equal(topEarners[0].id, 's-3');
  assert.equal(topEarners[1].id, 's-2');

  // 10. ทดสอบ Pure Function ของ LuckyTicketDrawModal (describeArcSlice)
  const arcPath = describeArcSlice(180, 180, 174, 0, 90);
  assert.ok(arcPath.startsWith('M 180 180 L'));
  assert.ok(arcPath.endsWith('Z'));

  // 11. ทดสอบ Pure Function ของ RewardBoard (formatRewardTimeThai)
  const timeFormatted = formatRewardTimeThai('2026-10-24T06:30:00.000Z');
  assert.ok(typeof timeFormatted === 'string');
  assert.ok(timeFormatted.includes(':'), 'รูปแบบเวลาต้องมีเครื่องหมายทวิภาค (:)');

  // 12. ทดสอบ Running Race Physics Engine & Heat Slicer
  assert.equal(calculateHarmonicProgress(0, 0, 0.1, 0.05, 1), 0);
  assert.equal(calculateHarmonicProgress(1, 0.9, 0.1, 0.05, 1), 1);
  const raceHeat = prepareRaceContestants(sampleRoster, 4, 5000);
  assert.equal(raceHeat.contestants.length, 4);
  assert.ok(raceHeat.winner);
  assert.equal(raceHeat.contestants.find((c) => c.isWinner)?.id, raceHeat.winner.id);

  // 13. ทดสอบการอนุมานระดับชั้นจากรหัสวิชา (inferGradeLevelFromCourseCode) ตามมาตรฐานกระทรวงฯ
  assert.equal(inferGradeLevelFromCourseCode('ญ21202'), 'ม.1', 'ญ21202 ต้องเป็นชั้น ม.1');
  assert.equal(inferGradeLevelFromCourseCode('ศ22101'), 'ม.2', 'ศ22101 ต้องเป็นชั้น ม.2');
  assert.equal(inferGradeLevelFromCourseCode('ว23101'), 'ม.3', 'ว23101 ต้องเป็นชั้น ม.3');
  assert.equal(inferGradeLevelFromCourseCode('ญ31202'), 'ม.4', 'ญ31202 ต้องเป็นชั้น ม.4');
  assert.equal(inferGradeLevelFromCourseCode('ญ32202'), 'ม.5', 'ญ32202 ต้องเป็นชั้น ม.5');
  assert.equal(inferGradeLevelFromCourseCode('ส30206'), 'ม.6', 'ส30206 ต้องเป็นชั้น ม.6');
  assert.equal(inferGradeLevelFromCourseCode('ญ30206'), 'ม.6', 'ญ30206 ต้องเป็นชั้น ม.6');
  assert.equal(inferGradeLevelFromCourseCode('ญ33202'), 'ม.6', 'ญ33202 ต้องเป็นชั้น ม.6');
  assert.equal(inferGradeLevelFromCourseCode(''), null);

  // 14. ทดสอบการแปลงคำนำหน้าชื่อย่อภาษาไทยสำหรับ TTS (formatStudentNameForSpeech)
  assert.equal(formatStudentNameForSpeech('ด.ช.ปรเมศวร์ รัตนวารี'), 'เด็กชายปรเมศวร์ รัตนวารี');
  assert.equal(formatStudentNameForSpeech('ด.ช. ปรเมศวร์ รัตนวารี'), 'เด็กชายปรเมศวร์ รัตนวารี');
  assert.equal(formatStudentNameForSpeech('ด.ช ปรเมศวร์ รัตนวารี'), 'เด็กชายปรเมศวร์ รัตนวารี');
  assert.equal(formatStudentNameForSpeech('ด.ญ.กัญญารัตน์ สดใส'), 'เด็กหญิงกัญญารัตน์ สดใส');
  assert.equal(formatStudentNameForSpeech('ด.ญ. กัญญารัตน์ สดใส'), 'เด็กหญิงกัญญารัตน์ สดใส');
  assert.equal(formatStudentNameForSpeech('ด.ญ กัญญารัตน์ สดใส'), 'เด็กหญิงกัญญารัตน์ สดใส');
  assert.equal(formatStudentNameForSpeech('น.ส.วิภาดา ดวงดี'), 'นางสาววิภาดา ดวงดี');
  assert.equal(formatStudentNameForSpeech('น.ส. วิภาดา ดวงดี'), 'นางสาววิภาดา ดวงดี');
  assert.equal(formatStudentNameForSpeech('น.ส วิภาดา ดวงดี'), 'นางสาววิภาดา ดวงดี');
  assert.equal(formatStudentNameForSpeech('นายเอกพล ขยันยิ่ง'), 'นายเอกพล ขยันยิ่ง');
  assert.equal(formatStudentNameForSpeech('เด็กชายธนดล'), 'เด็กชายธนดล');

  console.log('✅ All Live Classroom Ecosystem tests passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
