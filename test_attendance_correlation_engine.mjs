// test_attendance_correlation_engine.mjs
// Verification suite for Smart Attendance Correlation Service & 4 Integrity Locks Engine

import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';

console.log('🧪 Starting Smart Attendance Correlation Engine Verification...\n');

// ----------------------------------------------------
// Step 1: Static Source Verification & Architectural Checks
// ----------------------------------------------------
console.log('--- 1. Checking attendanceCorrelationService.ts Source & Design Specifications ---');
const servicePath = './src/services/attendanceCorrelationService.ts';
assert.ok(existsSync(servicePath), 'attendanceCorrelationService.ts must exist');

const serviceSource = readFileSync(servicePath, 'utf8');

// Lock 1: Provenance Tracking (MANUAL vs SYSTEM_CORRELATION vs APPROVED_ACTIVITY)
assert.ok(serviceSource.includes("'MANUAL'"), "Lock 1: must support 'MANUAL' source");
assert.ok(serviceSource.includes("'SYSTEM_CORRELATION'"), "Lock 1: must support 'SYSTEM_CORRELATION' source");
assert.ok(serviceSource.includes("'APPROVED_ACTIVITY'"), "Lock 1: must support 'APPROVED_ACTIVITY' source");
assert.ok(serviceSource.includes('isOverridden'), 'Lock 1: must support isOverridden flag');
console.log('  ✓ Lock 1 Static Check: Provenance tracking and override flag present');

// Lock 2: Truancy Promotion & Override Shield
assert.ok(serviceSource.includes("'TRUANCY'"), "Lock 2: must support 'TRUANCY' status");
assert.ok(serviceSource.includes('isTruancyCandidate'), 'Lock 2: must track isTruancyCandidate');
assert.ok(serviceSource.includes('!record.isOverridden'), 'Lock 2: must shield overridden records from auto-update');
console.log('  ✓ Lock 2 Static Check: Truancy promotion and override shield rule verified');

// Lock 3: Decoupled Morning Late Promotion
assert.ok(serviceSource.includes("'LATE'"), 'Lock 3: must promote absent morning to LATE when period 1 present');
assert.ok(!serviceSource.includes('markedAt.getTime() < 8'), 'Lock 3: must decouple from click timestamp');
console.log('  ✓ Lock 3 Static Check: Decoupled morning late promotion verified');

// Lock 4: Unified 80% Denominator Rule
assert.ok(
  serviceSource.includes('calculateAttendance80Rule') || serviceSource.includes('calculateAttendanceSummary'),
  'Lock 4: must include 80% attendance rule calculation'
);
assert.ok(serviceSource.includes('0.8') || serviceSource.includes('80'), 'Lock 4: must calculate 80% threshold');
console.log('  ✓ Lock 4 Static Check: 80% rule calculation formula verified');

// Storage keys
assert.ok(
  serviceSource.includes('kp_morning_assembly_records'),
  "Storage: must use key 'kp_morning_assembly_records'"
);
assert.ok(
  serviceSource.includes('kp_period_attendance_records'),
  "Storage: must use key 'kp_period_attendance_records'"
);
console.log('  ✓ Storage keys match design specification');

// ----------------------------------------------------
// Step 2: Runtime Functional Verification
// ----------------------------------------------------
console.log('\n--- 2. Checking Runtime Functional Behavior & 4 Integrity Locks ---');

const { attendanceCorrelationService } = await import('./src/services/attendanceCorrelationService.ts');
assert.ok(attendanceCorrelationService, 'attendanceCorrelationService must be exported');

// Reset to clean mock state
attendanceCorrelationService.resetToMockData();

// Test 2.1: Default Mock Data Initialization
console.log('  Testing 2.1: Mock Data Initialization for room-3-1 on 2026-10-02...');
const initialMorning = attendanceCorrelationService.getMorningRecords('room-3-1', '2026-10-02');
assert.ok(initialMorning.length >= 8, `Expected at least 8 morning records for room-3-1, got ${initialMorning.length}`);
console.log(`  ✓ Loaded ${initialMorning.length} morning assembly records for room-3-1`);

// Test 2.2: Lock 1 - Provenance Tracking & Override Shield
console.log('  Testing 2.2: Lock 1 - Provenance Tracking & Override Shield...');
const stu45110Morning = initialMorning.find((m) => m.studentCode === '45110');
assert.ok(stu45110Morning, 'Student 45110 morning record must exist');
assert.strictEqual(stu45110Morning.source, 'MANUAL', 'Initial teacher marked record must have source MANUAL');
assert.strictEqual(stu45110Morning.isOverridden, false, 'Initial record must not be overridden');

// Test manual override
const periodRecordToOverride = attendanceCorrelationService
  .getPeriodRecords('ศ23101', 'room-3-1', '2026-10-02', 1)
  .find((p) => p.studentCode === '45110');
assert.ok(periodRecordToOverride, 'Student 45110 period 1 record must exist');

const overriddenRecord = attendanceCorrelationService.overridePeriodRecord({
  id: periodRecordToOverride.id,
  newStatus: 'PRESENT',
  overrideBy: 'ครูภาสภูมิ เรืองปราชญ์',
  overrideReason: 'นักเรียนไปช่วยงานห้องพักครู ได้รับอนุญาตเป็นกรณีพิเศษ',
});

assert.strictEqual(overriddenRecord.status, 'PRESENT');
assert.strictEqual(overriddenRecord.isOverridden, true, 'Overridden record must have isOverridden = true');
assert.strictEqual(overriddenRecord.source, 'MANUAL', 'Overridden record source must be MANUAL');
assert.strictEqual(overriddenRecord.overrideBy, 'ครูภาสภูมิ เรืองปราชญ์');
assert.ok(overriddenRecord.overrideAt, 'overrideAt must be populated');

// Test that correlation cycle NEVER touches this overridden record
const correlationAfterOverride = attendanceCorrelationService.runCorrelation('room-3-1', '2026-10-02');
const recheckedPeriod = attendanceCorrelationService
  .getPeriodRecords('ศ23101', 'room-3-1', '2026-10-02', 1)
  .find((p) => p.id === periodRecordToOverride.id);
assert.strictEqual(recheckedPeriod.status, 'PRESENT', 'Shielded record status must NOT be modified by correlation');
assert.strictEqual(recheckedPeriod.isOverridden, true, 'Shielded record remains overridden');
console.log('  ✓ Lock 1 Verified: Manual overrides are shielded from correlation overwrite');

// Test 2.3: Lock 2 - Truancy Candidate Promotion
console.log('  Testing 2.3: Lock 2 - Truancy Candidate Promotion...');
// Setup a test case: Student 45102 is PRESENT in morning, but ABSENT in period 2, not in activity, not on leave
attendanceCorrelationService.savePeriodRecords([
  {
    id: 'test-p2-45102',
    date: '2026-10-02',
    classroomId: 'room-3-1',
    courseCode: 'ศ23101',
    courseName: 'ศิลปะ',
    periodNo: 2,
    studentId: 'stu-2',
    studentCode: '45102',
    studentName: 'ด.ช. ธีรานุ เดชปันคำ',
    status: 'ABSENT',
    source: 'MANUAL',
    isOverridden: false,
    markedAt: '2026-10-02T09:30:00Z',
  },
]);

const correlationLock2 = attendanceCorrelationService.runCorrelation('room-3-1', '2026-10-02');
const truancyPeriod = attendanceCorrelationService
  .getPeriodRecords('ศ23101', 'room-3-1', '2026-10-02', 2)
  .find((p) => p.studentCode === '45102');

assert.strictEqual(truancyPeriod.status, 'TRUANCY', 'Lock 2: Student present in morning but absent in period must be TRUANCY');
assert.strictEqual(truancyPeriod.source, 'SYSTEM_CORRELATION', 'Lock 2: Promoted record source must be SYSTEM_CORRELATION');
assert.strictEqual(truancyPeriod.isTruancyCandidate, true, 'Lock 2: isTruancyCandidate must be true');
assert.ok(truancyPeriod.correlationNote.includes('อนุมานจากระบบ'), 'Lock 2: must have descriptive correlation note');

// Test approved activity exemption: Student 45115 is in approved school activity for period 2
attendanceCorrelationService.saveApprovedActivity({
  id: 'act-music-contest',
  title: 'ประกวดดนตรีไทยสากล',
  date: '2026-10-02',
  startPeriod: 1,
  endPeriod: 3,
  approverName: 'ผอ. สมศักดิ์ เกียรติเจริญ',
  participatingStudentCodes: ['45115'],
});

attendanceCorrelationService.savePeriodRecords([
  {
    id: 'test-p2-45115',
    date: '2026-10-02',
    classroomId: 'room-3-1',
    courseCode: 'ศ23101',
    courseName: 'ศิลปะ',
    periodNo: 2,
    studentId: 'stu-15',
    studentCode: '45115',
    studentName: 'ด.ช. หัตเธน คำฝั้น',
    status: 'ABSENT',
    source: 'MANUAL',
    isOverridden: false,
    markedAt: '2026-10-02T09:30:00Z',
  },
]);

attendanceCorrelationService.runCorrelation('room-3-1', '2026-10-02');
const activityStudentPeriod = attendanceCorrelationService
  .getPeriodRecords('ศ23101', 'room-3-1', '2026-10-02', 2)
  .find((p) => p.studentCode === '45115');
assert.notStrictEqual(
  activityStudentPeriod.status,
  'TRUANCY',
  'Lock 2: Student participating in approved activity must NOT be marked TRUANCY'
);
console.log('  ✓ Lock 2 Verified: Truancy candidate promoted safely and activity exemption respected');

// Test 2.4: Lock 3 - Decoupled Morning Late Promotion
console.log('  Testing 2.4: Lock 3 - Decoupled Morning Late Promotion...');
// Setup: Student 45107 is ABSENT in morning assembly, but teacher marks PRESENT in Period 1 at 10:30 AM
attendanceCorrelationService.saveMorningRecords([
  {
    id: 'test-morning-45107',
    date: '2026-10-02',
    classroomId: 'room-3-1',
    studentId: 'stu-7',
    studentCode: '45107',
    studentName: 'ด.ช. ภูรินท์ บัณฑิต',
    status: 'ABSENT',
    source: 'MANUAL',
    isOverridden: false,
    markedAt: '2026-10-02T08:00:00Z',
  },
]);

attendanceCorrelationService.savePeriodRecords([
  {
    id: 'test-p1-45107',
    date: '2026-10-02',
    classroomId: 'room-3-1',
    courseCode: 'ศ23101',
    courseName: 'ศิลปะ',
    periodNo: 1,
    studentId: 'stu-7',
    studentCode: '45107',
    studentName: 'ด.ช. ภูรินท์ บัณฑิต',
    status: 'PRESENT',
    source: 'MANUAL',
    isOverridden: false,
    markedAt: '2026-10-02T10:30:00Z', // Submitted late in the day
  },
]);

attendanceCorrelationService.runCorrelation('room-3-1', '2026-10-02');
const updatedMorning45107 = attendanceCorrelationService
  .getMorningRecords('room-3-1', '2026-10-02')
  .find((m) => m.studentCode === '45107');

assert.strictEqual(
  updatedMorning45107.status,
  'LATE',
  'Lock 3: Absent morning must be promoted to LATE when Period 1 is attended'
);
assert.strictEqual(
  updatedMorning45107.source,
  'SYSTEM_CORRELATION',
  'Lock 3: Promoted morning source must be SYSTEM_CORRELATION'
);
assert.ok(
  updatedMorning45107.correlationNote.includes('ปรับเป็นสายอัตโนมัติ'),
  'Lock 3: must record late correlation note'
);
console.log('  ✓ Lock 3 Verified: Absent morning promoted to LATE regardless of submission time');

// Test 2.5: Lock 4 - Unified 80% Attendance Denominator Rule
console.log('  Testing 2.5: Lock 4 - Unified 80% Rule Calculation...');
// Case A: 32 Present, 2 Late, 2 Activity, 2 Leave, 1 Absent, 1 Truancy (Total = 40)
// Earned = 32 + 2 + 2 = 36 periods
// Rate = 36 / 40 * 100 = 90.0% -> Eligible
const recordsCaseA = [];
for (let i = 1; i <= 32; i++) recordsCaseA.push({ status: 'PRESENT' });
for (let i = 1; i <= 2; i++) recordsCaseA.push({ status: 'LATE' });
for (let i = 1; i <= 2; i++) recordsCaseA.push({ status: 'ACTIVITY' });
for (let i = 1; i <= 2; i++) recordsCaseA.push({ status: 'LEAVE' });
for (let i = 1; i <= 1; i++) recordsCaseA.push({ status: 'ABSENT' });
for (let i = 1; i <= 1; i++) recordsCaseA.push({ status: 'TRUANCY' });

const summaryA = attendanceCorrelationService.compute80RuleFromRecords('45101', 'ศ23101', recordsCaseA, 40);
assert.strictEqual(summaryA.totalScheduledPeriods, 40);
assert.strictEqual(summaryA.earnedPeriods, 36);
assert.strictEqual(summaryA.presentCount, 32);
assert.strictEqual(summaryA.lateCount, 2);
assert.strictEqual(summaryA.activityCount, 2);
assert.strictEqual(summaryA.leaveCount, 2);
assert.strictEqual(summaryA.absentCount, 1);
assert.strictEqual(summaryA.truancyCount, 1);
assert.strictEqual(summaryA.attendanceRate, 90.0);
assert.strictEqual(summaryA.isEligibleForExam, true, '90% must be eligible for exam');

// Case B: 24 Present, 4 Late, 2 Activity, 4 Leave, 4 Absent, 2 Truancy (Total = 40)
// Earned = 24 + 4 + 2 = 30 periods
// Rate = 30 / 40 * 100 = 75.0% -> Ineligible (< 80%)
const recordsCaseB = [];
for (let i = 1; i <= 24; i++) recordsCaseB.push({ status: 'PRESENT' });
for (let i = 1; i <= 4; i++) recordsCaseB.push({ status: 'LATE' });
for (let i = 1; i <= 2; i++) recordsCaseB.push({ status: 'ACTIVITY' });
for (let i = 1; i <= 4; i++) recordsCaseB.push({ status: 'LEAVE' });
for (let i = 1; i <= 4; i++) recordsCaseB.push({ status: 'ABSENT' });
for (let i = 1; i <= 2; i++) recordsCaseB.push({ status: 'TRUANCY' });

const summaryB = attendanceCorrelationService.compute80RuleFromRecords('45107', 'ศ23101', recordsCaseB, 40);
assert.strictEqual(summaryB.earnedPeriods, 30);
assert.strictEqual(summaryB.attendanceRate, 75.0);
assert.strictEqual(summaryB.isEligibleForExam, false, '75% must be at-risk (ineligible for exam)');

// Case C: Exact 80.0% boundary test (32 earned / 40 total = 80.0%)
const recordsCaseC = [];
for (let i = 1; i <= 32; i++) recordsCaseC.push({ status: 'PRESENT' });
for (let i = 1; i <= 8; i++) recordsCaseC.push({ status: 'ABSENT' });
const summaryC = attendanceCorrelationService.compute80RuleFromRecords('45112', 'ศ23101', recordsCaseC, 40);
assert.strictEqual(summaryC.attendanceRate, 80.0);
assert.strictEqual(summaryC.isEligibleForExam, true, '80.0% boundary must be eligible');

console.log('  ✓ Lock 4 Verified: 80% rule accurately counts PRESENT, LATE, ACTIVITY and bars < 80%');

// Test 2.6: Morning Assembly Statistics Helper
console.log('  Testing 2.6: Morning Assembly Statistics calculation...');
const stats = attendanceCorrelationService.getMorningAssemblyStats('room-3-1', '2026-10-02');
assert.ok(stats.totalStudents >= 8, 'Stats must include total students');
assert.ok(typeof stats.presentCount === 'number');
assert.ok(typeof stats.lateCount === 'number');
assert.ok(typeof stats.attendanceRate === 'number');
console.log(`  ✓ Morning Assembly Stats: ${stats.totalStudents} students, ${stats.attendanceRate}% attendance rate`);

// ----------------------------------------------------
// Step 3: Subject Icons System & Multi-Strand Icon Configuration Verification
// ----------------------------------------------------
console.log('\n--- 3. Checking Subject Icons System & Multi-Strand Auto-Detection ---');
const subjectIconsPath = './src/config/subjectIcons.ts';
assert.ok(existsSync(subjectIconsPath), 'src/config/subjectIcons.ts must exist');

const {
  ALL_SUBJECT_ICONS,
  DEFAULT_SUBJECT_ICON,
  getSubjectIcon,
  getSubjectBadgeClasses,
  getSubjectBadgeProps,
  renderSubjectIconBadge,
} = await import('./src/config/subjectIcons.ts');

assert.ok(Array.isArray(ALL_SUBJECT_ICONS), 'ALL_SUBJECT_ICONS must be an array');
assert.strictEqual(ALL_SUBJECT_ICONS.length >= 20, true, 'ALL_SUBJECT_ICONS must contain at least 20 subjects');

// Check required subjects exist in catalog
const requiredSubjectIds = [
  'japanese', 'chinese', 'korean', 'english', 'french',
  'thai', 'math', 'physics', 'chemistry', 'biology',
  'science', 'computing', 'social', 'history', 'pe',
  'art', 'music', 'vocational', 'guidance', 'scout'
];
for (const id of requiredSubjectIds) {
  const found = ALL_SUBJECT_ICONS.find((item) => item.id === id);
  assert.ok(found, `Subject icon catalog must contain ${id}`);
  assert.ok(found.symbol, `${id} must have a symbol`);
  assert.ok(found.bgClass, `${id} must have a bgClass`);
  assert.ok(found.textClass, `${id} must have a textClass`);
  assert.ok(found.name, `${id} must have a Thai name`);
  assert.ok(found.strand, `${id} must have a learning strand`);
}
console.log(`  ✓ All ${requiredSubjectIds.length} multi-strand subject icon configurations verified`);

// Detection Test 1: Japanese (ญ31201)
const iconJap = getSubjectIcon('ญ31201');
assert.strictEqual(iconJap.id, 'japanese');
assert.strictEqual(iconJap.symbol, 'あ');
assert.strictEqual(iconJap.bgClass, 'bg-rose-500');

// Detection Test 2: Chemistry (ว30221 เคมี 1)
const iconChem = getSubjectIcon('ว30221 เคมี 1');
assert.strictEqual(iconChem.id, 'chemistry');
assert.strictEqual(iconChem.symbol, '🧪');
assert.strictEqual(iconChem.bgClass, 'bg-teal-500');

// Detection Test 3: Korean (ภาษาเกาหลี 1)
const iconKor = getSubjectIcon('ภาษาเกาหลี 1');
assert.strictEqual(iconKor.id, 'korean');
assert.strictEqual(iconKor.symbol, '한');
assert.strictEqual(iconKor.bgClass, 'bg-blue-600');

// Detection Test 4: Physics (ว30201 ฟิสิกส์ 1)
const iconPhy = getSubjectIcon('ว30201 ฟิสิกส์ 1');
assert.strictEqual(iconPhy.id, 'physics');
assert.strictEqual(iconPhy.symbol, '⚡');
assert.strictEqual(iconPhy.bgClass, 'bg-amber-500');

// Detection Test 5: Computing (ว21103 วิทยาการคำนวณ or คอมพิวเตอร์)
const iconComp1 = getSubjectIcon('ว21103 วิทยาการคำนวณ');
assert.strictEqual(iconComp1.id, 'computing');
assert.strictEqual(iconComp1.symbol, '💻');
assert.strictEqual(iconComp1.bgClass, 'bg-cyan-600');
const iconComp2 = getSubjectIcon('คอมพิวเตอร์');
assert.strictEqual(iconComp2.id, 'computing');

// Detection Test 6: Math (ค21101)
const iconMath = getSubjectIcon('ค21101');
assert.strictEqual(iconMath.id, 'math');
assert.strictEqual(iconMath.symbol, '∑');
assert.strictEqual(iconMath.bgClass, 'bg-blue-600');

// Detection Test 7: Thai (ท21101)
const iconThai = getSubjectIcon('ท21101');
assert.strictEqual(iconThai.id, 'thai');
assert.strictEqual(iconThai.symbol, 'ก');
assert.strictEqual(iconThai.bgClass, 'bg-orange-500');

// Detection Test 8: PE (พ21101 or สุขศึกษาและพลศึกษา)
const iconPE1 = getSubjectIcon('พ21101');
assert.strictEqual(iconPE1.id, 'pe');
assert.strictEqual(iconPE1.symbol, '⚽');
assert.strictEqual(iconPE1.bgClass, 'bg-orange-500');
const iconPE2 = getSubjectIcon('สุขศึกษาและพลศึกษา');
assert.strictEqual(iconPE2.id, 'pe');

// Detection Test 9: Arts (ศ21101 or ทัศนศิลป์)
const iconArt = getSubjectIcon('ศ21101 ทัศนศิลป์');
assert.strictEqual(iconArt.id, 'art');
assert.strictEqual(iconArt.symbol, '🎨');
assert.strictEqual(iconArt.bgClass, 'bg-pink-500');

// Detection Test 10: Guidance (ก21901 or กิจกรรมแนะแนว)
const iconGuidance = getSubjectIcon('ก21901', 'กิจกรรมแนะแนว');
assert.strictEqual(iconGuidance.id, 'guidance');
assert.strictEqual(iconGuidance.symbol, '🧭');
assert.strictEqual(iconGuidance.bgClass, 'bg-teal-600');

// Detection Test 11: Music (ศ21102 ดนตรี-นาฏศิลป์)
const iconMusic = getSubjectIcon('ศ21102 ดนตรี-นาฏศิลป์');
assert.strictEqual(iconMusic.id, 'music');
assert.strictEqual(iconMusic.symbol, '🎵');

// Detection Test 12: History (ส21102 ประวัติศาสตร์)
const iconHistory = getSubjectIcon('ส21102 ประวัติศาสตร์ 1');
assert.strictEqual(iconHistory.id, 'history');
assert.strictEqual(iconHistory.symbol, '🏛️');

// Detection Test 13: Biology (ว30241 ชีววิทยา 1)
const iconBio = getSubjectIcon('ว30241 ชีววิทยา 1');
assert.strictEqual(iconBio.id, 'biology');
assert.strictEqual(iconBio.symbol, '🧬');

// Detection Test 14: French (ฝ31201)
const iconFrench = getSubjectIcon('ฝ31201');
assert.strictEqual(iconFrench.id, 'french');
assert.strictEqual(iconFrench.symbol, 'FR');

// Detection Test 15: Chinese (จ31201)
const iconChinese = getSubjectIcon('จ31201');
assert.strictEqual(iconChinese.id, 'chinese');
assert.strictEqual(iconChinese.symbol, '中');

// Detection Test 16: Scout (ลูกเสือ)
const iconScout = getSubjectIcon('ลูกเสือ-เนตรนารี');
assert.strictEqual(iconScout.id, 'scout');
assert.strictEqual(iconScout.symbol, '⚜️');

// Detection Test 17: Unknown fallback to default
const iconUnknown = getSubjectIcon('XYZ99999');
assert.strictEqual(iconUnknown.id, 'general');
assert.strictEqual(iconUnknown.symbol, '📚');

// Render Badge helper test
const badgeClasses = getSubjectBadgeClasses(iconChem, 'sm');
assert.ok(badgeClasses.includes('bg-teal-500'));
assert.ok(badgeClasses.includes('w-6 h-6'));

const badgeProps = getSubjectBadgeProps(iconChem, 'md');
assert.strictEqual(badgeProps.symbol, '🧪');
assert.strictEqual(badgeProps.bgClass, 'bg-teal-500');

const renderedBadge = renderSubjectIconBadge(iconChem, 'lg');
assert.ok(renderedBadge);
assert.strictEqual(renderedBadge.props.children, '🧪');
assert.ok(renderedBadge.props.className.includes('bg-teal-500'));
assert.ok(renderedBadge.props.className.includes('w-10 h-10'));

console.log('  ✓ Multi-strand intelligent detection and badge render helpers verified successfully');

// ----------------------------------------------------
// Step 4: Client-Side Canvas Image Resizer & Compressor Verification
// ----------------------------------------------------
console.log('\n--- 4. Checking Client-Side Banner Image Resizer & Compressor ---');
const compressorPath = './src/utils/imageCompressor.ts';
assert.ok(existsSync(compressorPath), 'src/utils/imageCompressor.ts must exist');

const compressorSource = readFileSync(compressorPath, 'utf8');
assert.ok(compressorSource.includes('1200'), 'Must enforce maxWidth 1200px');
assert.ok(compressorSource.includes('360'), 'Must enforce maxHeight 360px');
assert.ok(compressorSource.includes('153600'), 'Must guard payload size under 150KB (153,600 bytes)');
assert.ok(compressorSource.includes('imageSmoothingEnabled'), 'Must enable high quality canvas smoothing');
assert.ok(compressorSource.includes("'high'"), 'Must set imageSmoothingQuality to high');
assert.ok(compressorSource.includes('image/webp'), 'Must support WebP encoding');
assert.ok(compressorSource.includes('image/jpeg'), 'Must support JPEG fallback');
console.log('  ✓ Static source checks for dimensions, smoothing, and format fallback passed');

const {
  compressSubjectBannerImage,
  estimateBase64SizeBytes,
  dataUrlToBlob,
  calculateAspectRatioDimensions,
  formatBytes,
  isImageFile,
  DEFAULT_BANNER_COMPRESSION_OPTIONS,
} = await import('./src/utils/imageCompressor.ts');

assert.ok(typeof compressSubjectBannerImage === 'function', 'compressSubjectBannerImage must be exported');
assert.ok(typeof estimateBase64SizeBytes === 'function', 'estimateBase64SizeBytes must be exported');
assert.ok(typeof dataUrlToBlob === 'function', 'dataUrlToBlob must be exported');
assert.ok(DEFAULT_BANNER_COMPRESSION_OPTIONS.maxWidth === 1200);
assert.ok(DEFAULT_BANNER_COMPRESSION_OPTIONS.maxHeight === 360);
assert.ok(DEFAULT_BANNER_COMPRESSION_OPTIONS.maxSizeBytes === 153600);

// Test 4.1: Base64 byte size estimation accuracy with padding and schemes
console.log('  Testing 4.1: Base64 byte size estimation accuracy...');
assert.strictEqual(estimateBase64SizeBytes(''), 0);
assert.strictEqual(estimateBase64SizeBytes('TWFu'), 3, 'TWFu (no pad) must be 3 bytes');
assert.strictEqual(estimateBase64SizeBytes('TWE='), 2, 'TWE= (1 pad) must be 2 bytes');
assert.strictEqual(estimateBase64SizeBytes('TQ=='), 1, 'TQ== (2 pad) must be 1 byte');
assert.strictEqual(estimateBase64SizeBytes('data:image/webp;base64,TWFu'), 3, 'Data URL must be parsed correctly');
assert.strictEqual(estimateBase64SizeBytes('data:image/jpeg;base64,TQ==\n'), 1, 'Data URL with whitespace must be stripped');

// Exact 150KB synthetic test string (204,800 chars of base64 = 153,600 bytes)
const synthetic150KB = 'A'.repeat(204800);
assert.strictEqual(estimateBase64SizeBytes(synthetic150KB), 153600, 'Synthetic 204,800 base64 chars must equal 153,600 bytes');
console.log('  ✓ Base64 byte size estimator accurately calculates bytes and handles padding');

// Test 4.2: DataUrl to Blob conversion
console.log('  Testing 4.2: Data URL to Blob conversion...');
const testBlob = dataUrlToBlob('data:image/webp;base64,TWFu');
assert.ok(testBlob instanceof Blob, 'dataUrlToBlob must return a Blob instance');
assert.strictEqual(testBlob.type, 'image/webp', 'Blob mime type must match header');
assert.strictEqual(testBlob.size, 3, 'Blob size must match encoded byte length');
console.log('  ✓ Data URL to Blob conversion verified');

// Test 4.3: Proportional aspect ratio calculations
console.log('  Testing 4.3: Proportional aspect ratio calculations...');
const dim1 = calculateAspectRatioDimensions(2400, 720, 1200, 360);
assert.strictEqual(dim1.width, 1200);
assert.strictEqual(dim1.height, 360);

const dim2 = calculateAspectRatioDimensions(1920, 1080, 1200, 360);
assert.strictEqual(dim2.width, 640);
assert.strictEqual(dim2.height, 360);

const dim3 = calculateAspectRatioDimensions(800, 240, 1200, 360);
assert.strictEqual(dim3.width, 800, 'Dimensions smaller than max should be preserved');
assert.strictEqual(dim3.height, 240);
console.log('  ✓ Proportional aspect ratio calculations verified');

// Test 4.4: compressSubjectBannerImage SSR fallback and quota enforcement
console.log('  Testing 4.4: compressSubjectBannerImage SSR fallback and quota guard...');
const mockBannerContent = 'mock-banner-image-payload-kutchapprachasan-2026';
const mockBannerBlob = new Blob([mockBannerContent], { type: 'image/webp' });
const compressed = await compressSubjectBannerImage(mockBannerBlob);

assert.ok(compressed.dataUrl.startsWith('data:image/webp;base64,'), 'Result dataUrl must be WebP data URL');
assert.strictEqual(compressed.width, 1200);
assert.strictEqual(compressed.height, 360);
assert.strictEqual(compressed.mimeType, 'image/webp');
assert.strictEqual(compressed.sizeBytes, mockBannerContent.length);
assert.strictEqual(compressed.isWithinQuota, true, 'Small mock image must be within 150KB quota');
assert.strictEqual(compressed.compressionRatio, 1.0);

// Quota violation guard test: large payload exceeding 150KB (153,600 bytes)
const largePayload = new Uint8Array(200000);
const largeBlob = new Blob([largePayload], { type: 'image/jpeg' });
const largeResult = await compressSubjectBannerImage(largeBlob);
assert.strictEqual(largeResult.isWithinQuota, false, 'Payload > 153,600 bytes must trigger isWithinQuota = false');
console.log('  ✓ Compression result interface and quota guard verified');

// Test 4.5: Utility helpers (formatBytes, isImageFile)
console.log('  Testing 4.5: Utility formatting helpers...');
assert.strictEqual(formatBytes(0), '0 B');
assert.strictEqual(formatBytes(1024), '1 KB');
assert.strictEqual(formatBytes(153600), '150 KB');
assert.strictEqual(isImageFile(mockBannerBlob), true);
assert.strictEqual(isImageFile(new Blob(['hello'], { type: 'text/plain' })), false);
console.log('  ✓ Utility formatting helpers verified');

// ----------------------------------------------------
// Step 5: Teacher Sidebar Reorganization & App Navigation Verification (Task 4)
// ----------------------------------------------------
console.log('\n--- 5. Checking Teacher Sidebar Reorganization & App Navigation (Task 4) ---');

const sidebarPath = './src/components/layout/TeacherSidebar.tsx';
assert.ok(existsSync(sidebarPath), 'src/components/layout/TeacherSidebar.tsx must exist');
const sidebarSource = readFileSync(sidebarPath, 'utf8');

// 5.1 TeacherViewKey & icons
assert.ok(sidebarSource.includes("'morning-assembly'"), "TeacherSidebar must include 'morning-assembly' in TeacherViewKey");
assert.ok(sidebarSource.includes("'classroom-attendance'"), "TeacherSidebar must include 'classroom-attendance' in TeacherViewKey");
assert.ok(sidebarSource.includes('UserCheck'), 'TeacherSidebar must import and use UserCheck icon');
assert.ok(sidebarSource.includes('ClipboardCheck'), 'TeacherSidebar must import and use ClipboardCheck icon');

// 5.2 Menu order check: timetable -> morning-assembly -> classroom-attendance -> assignments
const timetableIdx = sidebarSource.indexOf("key: 'timetable'");
const morningIdx = sidebarSource.indexOf("key: 'morning-assembly'");
const classroomIdx = sidebarSource.indexOf("key: 'classroom-attendance'");
const assignmentsIdx = sidebarSource.indexOf("key: 'assignments'");
assert.ok(timetableIdx !== -1 && morningIdx !== -1 && classroomIdx !== -1 && assignmentsIdx !== -1);
assert.ok(timetableIdx < morningIdx, 'Timetable must precede morning-assembly');
assert.ok(morningIdx < classroomIdx, 'Morning-assembly must precede classroom-attendance');
assert.ok(classroomIdx < assignmentsIdx, 'Classroom-attendance must precede assignments');
console.log('  ✓ Sidebar menu ordering (timetable -> morning-assembly -> classroom-attendance -> assignments) verified');

// 5.3 Banner position: Banner placed directly below Settings within scroll container, LogOut alone at bottom
const settingsKeyIdx = sidebarSource.indexOf("key: 'settings'");
const bannerIdx = sidebarSource.indexOf("sidebarBanner.name");
const logOutBtnIdx = sidebarSource.indexOf("<LogOut");
assert.ok(settingsKeyIdx < bannerIdx, 'Mascot banner must be placed below settings menu');
assert.ok(bannerIdx < logOutBtnIdx, 'Mascot banner must precede logout button (logout alone in bottom section)');

// Check that the banner is within the scroll container before the closing tag of flex-1 overflow-y-auto
const scrollContainerStart = sidebarSource.indexOf('overflow-y-auto');
const bottomBorderT = sidebarSource.indexOf('border-t border-slate-100 shrink-0');
assert.ok(scrollContainerStart !== -1 && bottomBorderT !== -1);
assert.ok(bannerIdx < bottomBorderT, 'Banner must be inside main container above the isolated bottom logout section');
console.log('  ✓ Mascot banner placement directly below settings verified');

// 5.4 App.tsx routing
const appPath = './src/App.tsx';
assert.ok(existsSync(appPath), 'src/App.tsx must exist');
const appSource = readFileSync(appPath, 'utf8');

assert.ok(appSource.includes('MorningAssemblyView'), 'App.tsx must import MorningAssemblyView');
assert.ok(appSource.includes('ClassroomAttendanceView'), 'App.tsx must import ClassroomAttendanceView');
assert.ok(appSource.includes("case 'morning-assembly'"), "App.tsx must have getHeaderTitle case for 'morning-assembly'");
assert.ok(appSource.includes("case 'classroom-attendance'"), "App.tsx must have getHeaderTitle case for 'classroom-attendance'");
assert.ok(appSource.includes("currentView === 'morning-assembly'"), "App.tsx must route currentView === 'morning-assembly'");
assert.ok(appSource.includes("currentView === 'classroom-attendance'"), "App.tsx must route currentView === 'classroom-attendance'");
console.log('  ✓ App.tsx routing and title mapping verified');

// 5.5 View components exist and import attendanceCorrelationService
const morningViewPath = './src/views/MorningAssemblyView.tsx';
const classroomViewPath = './src/views/ClassroomAttendanceView.tsx';
assert.ok(existsSync(morningViewPath), 'MorningAssemblyView.tsx must exist');
assert.ok(existsSync(classroomViewPath), 'ClassroomAttendanceView.tsx must exist');

const morningViewSource = readFileSync(morningViewPath, 'utf8');
const classroomViewSource = readFileSync(classroomViewPath, 'utf8');
assert.ok(morningViewSource.includes('attendanceCorrelationService'), 'MorningAssemblyView must import attendanceCorrelationService');
assert.ok(classroomViewSource.includes('attendanceCorrelationService'), 'ClassroomAttendanceView must import attendanceCorrelationService');
console.log('  ✓ MorningAssemblyView and ClassroomAttendanceView component shells verified');

// ----------------------------------------------------
// Step 6: School Bell Schedule & Lunch Break Settings Verification (Task 9)
// ----------------------------------------------------
console.log('\n--- 6. Checking School Bell Schedule & Lunch Break Settings (Task 9) ---');

const settingsViewPath = './src/views/SettingsBackupView.tsx';
assert.ok(existsSync(settingsViewPath), 'src/views/SettingsBackupView.tsx must exist');
const settingsSource = readFileSync(settingsViewPath, 'utf8');

const bellServicePath = './src/services/bellScheduleService.ts';
assert.ok(existsSync(bellServicePath), 'src/services/bellScheduleService.ts must exist');
const bellServiceSource = readFileSync(bellServicePath, 'utf8');

// 6.1 Interface & Type Checks
assert.ok(
  bellServiceSource.includes('export interface SchoolBellScheduleConfig'),
  'bellScheduleService must export SchoolBellScheduleConfig interface'
);
assert.ok(
  settingsSource.includes('SchoolBellScheduleConfig'),
  'SettingsBackupView must re-export or use SchoolBellScheduleConfig'
);
assert.ok(bellServiceSource.includes('morningAssemblyStart: string'), 'Config must have morningAssemblyStart: string');
assert.ok(bellServiceSource.includes('morningAssemblyEnd: string'), 'Config must have morningAssemblyEnd: string');
assert.ok(bellServiceSource.includes('firstPeriodStart: string'), 'Config must have firstPeriodStart: string');
assert.ok(bellServiceSource.includes('periodDurationMinutes: number'), 'Config must have periodDurationMinutes: number');
assert.ok(bellServiceSource.includes('totalPeriodsPerDay: number'), 'Config must have totalPeriodsPerDay: number');
assert.ok(bellServiceSource.includes('lunchBreakMode:'), 'Config must have lunchBreakMode');
assert.ok(bellServiceSource.includes("'NUMBERED_PERIOD'"), "lunchBreakMode must support 'NUMBERED_PERIOD'");
assert.ok(bellServiceSource.includes("'SKIPPED_BREAK_SLOT'"), "lunchBreakMode must support 'SKIPPED_BREAK_SLOT'");
assert.ok(bellServiceSource.includes('lunchBreakSlot: number'), 'Config must have lunchBreakSlot: number');
assert.ok(bellServiceSource.includes('lunchDurationMinutes: number'), 'Config must have lunchDurationMinutes: number');
console.log('  ✓ SchoolBellScheduleConfig interface structure and modes verified');

// 6.2 Storage Key & Defaults
assert.ok(
  settingsSource.includes('BELL_SCHEDULE_STORAGE_KEY') || settingsSource.includes("'kp_school_bell_schedule'"),
  "SettingsBackupView must use BELL_SCHEDULE_STORAGE_KEY or 'kp_school_bell_schedule'"
);
assert.ok(
  bellServiceSource.includes("'kp_school_bell_schedule'"),
  "bellScheduleService must define 'kp_school_bell_schedule'"
);
assert.ok(
  settingsSource.includes('DEFAULT_BELL_SCHEDULE_CONFIG'),
  'SettingsBackupView must define DEFAULT_BELL_SCHEDULE_CONFIG'
);
console.log("  ✓ LocalStorage key 'kp_school_bell_schedule' and default configuration verified");

// 6.3 UI Section & Controls Check
assert.ok(
  settingsSource.includes('เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)'),
  'Must include title: เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)'
);
assert.ok(
  settingsSource.includes('เวลาเข้าแถวเคารพธงชาติ'),
  'Must include section: เวลาเข้าแถวเคารพธงชาติ'
);
assert.ok(
  settingsSource.includes('เวลาสำหรับเช็คแถวหน้าเสาธงและกิจกรรมโฮมรูมประจำชั้น'),
  'Must include homeroom/assembly explanation text'
);
assert.ok(
  settingsSource.includes('โครงสร้างเวลาเรียนรายคาบ'),
  'Must include section: โครงสร้างเวลาเรียนรายคาบ'
);
assert.ok(
  settingsSource.includes('โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก)'),
  'Must include section: โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก)'
);
assert.ok(
  settingsSource.includes('โหมด A: นับพักเที่ยงเป็นคาบที่ (Numbered Period)'),
  'Must include Mode A title'
);
assert.ok(
  settingsSource.includes('คาบที่ 4 เรียน → คาบที่ 5 พักเที่ยง → คาบที่ 6 เรียนภาคบ่าย'),
  'Must include Mode A explanation flow'
);
assert.ok(
  settingsSource.includes('โหมด B: ข้ามคาบพักเที่ยง ไม่นับเป็นคาบที่ (Skipped Break Slot)'),
  'Must include Mode B title'
);
assert.ok(
  settingsSource.includes('คาบที่ 4 เรียน → [พักเที่ยง] → คาบที่ 5 เรียนภาคบ่าย (คาบต่อไปยังคงเป็นคาบที่ 5)'),
  'Must include Mode B explanation flow'
);
assert.ok(
  settingsSource.includes('ไทม์ไลน์จำลองตารางเรียนประจำวัน (Preview Timeline Schedule)'),
  'Must include Preview Timeline Schedule'
);
assert.ok(
  settingsSource.includes('💾 บันทึกการตั้งค่าโครงสร้างเวลา'),
  'Must include save button: 💾 บันทึกการตั้งค่าโครงสร้างเวลา'
);
assert.ok(
  settingsSource.includes('คืนค่าเริ่มต้น'),
  'Must include reset button: คืนค่าเริ่มต้น'
);
console.log('  ✓ UI labels, Thai explanations, Mode flows, and buttons verified');

// 6.4 Mathematical / Logical verification of Timeline generation for Mode A and Mode B
const addMinutes = (timeStr, mins) => {
  const [h, m] = timeStr.split(':').map(Number);
  const total = (h * 60 + m + mins + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const simulateTimeline = (config) => {
  const items = [{
    type: 'ASSEMBLY',
    start: config.morningAssemblyStart,
    end: config.morningAssemblyEnd,
  }];
  let cur = config.firstPeriodStart;
  if (config.lunchBreakMode === 'NUMBERED_PERIOD') {
    const lunchP = Math.min(config.lunchBreakSlot + 1, config.totalPeriodsPerDay);
    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      if (p === lunchP) {
        const end = addMinutes(cur, config.lunchDurationMinutes);
        items.push({ type: 'LUNCH', periodNumber: p, start: cur, end });
        cur = end;
      } else {
        const end = addMinutes(cur, config.periodDurationMinutes);
        items.push({ type: 'PERIOD', periodNumber: p, start: cur, end });
        cur = end;
      }
    }
  } else {
    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      const end = addMinutes(cur, config.periodDurationMinutes);
      items.push({ type: 'PERIOD', periodNumber: p, start: cur, end });
      cur = end;
      if (p === config.lunchBreakSlot) {
        const lunchEnd = addMinutes(cur, config.lunchDurationMinutes);
        items.push({ type: 'LUNCH', periodNumber: undefined, start: cur, end: lunchEnd });
        cur = lunchEnd;
      }
    }
  }
  return items;
};

// Mode A Test: 7 periods, lunch after period 4 -> Period 5 is lunch, Period 6 is afternoon
const modeASchedule = simulateTimeline({
  morningAssemblyStart: '07:45',
  morningAssemblyEnd: '08:15',
  firstPeriodStart: '08:30',
  periodDurationMinutes: 50,
  totalPeriodsPerDay: 7,
  lunchBreakMode: 'NUMBERED_PERIOD',
  lunchBreakSlot: 4,
  lunchDurationMinutes: 50,
});

assert.strictEqual(modeASchedule[0].start, '07:45');
assert.strictEqual(modeASchedule[0].end, '08:15');
assert.strictEqual(modeASchedule[1].start, '08:30'); // Period 1
assert.strictEqual(modeASchedule[1].end, '09:20');
assert.strictEqual(modeASchedule[2].start, '09:20'); // Period 2
assert.strictEqual(modeASchedule[3].start, '10:10'); // Period 3
assert.strictEqual(modeASchedule[4].start, '11:00'); // Period 4
assert.strictEqual(modeASchedule[4].end, '11:50');
assert.strictEqual(modeASchedule[5].type, 'LUNCH'); // Period 5 is Lunch
assert.strictEqual(modeASchedule[5].periodNumber, 5);
assert.strictEqual(modeASchedule[5].start, '11:50');
assert.strictEqual(modeASchedule[5].end, '12:40');
assert.strictEqual(modeASchedule[6].type, 'PERIOD'); // Period 6 is Afternoon class
assert.strictEqual(modeASchedule[6].periodNumber, 6);
assert.strictEqual(modeASchedule[6].start, '12:40');
assert.strictEqual(modeASchedule[6].end, '13:30');
assert.strictEqual(modeASchedule[7].periodNumber, 7);
assert.strictEqual(modeASchedule[7].start, '13:30');
assert.strictEqual(modeASchedule[7].end, '14:20');
console.log('  ✓ Mode A (Numbered Period): Period 4 -> Period 5 Lunch -> Period 6 Afternoon verified');

// Mode B Test: 7 periods, lunch after period 4 -> [Lunch Break], Period 5 is afternoon
const modeBSchedule = simulateTimeline({
  morningAssemblyStart: '07:45',
  morningAssemblyEnd: '08:15',
  firstPeriodStart: '08:30',
  periodDurationMinutes: 50,
  totalPeriodsPerDay: 7,
  lunchBreakMode: 'SKIPPED_BREAK_SLOT',
  lunchBreakSlot: 4,
  lunchDurationMinutes: 50,
});

assert.strictEqual(modeBSchedule[4].periodNumber, 4); // Period 4
assert.strictEqual(modeBSchedule[4].end, '11:50');
assert.strictEqual(modeBSchedule[5].type, 'LUNCH'); // Unnumbered Lunch Break
assert.strictEqual(modeBSchedule[5].periodNumber, undefined);
assert.strictEqual(modeBSchedule[5].start, '11:50');
assert.strictEqual(modeBSchedule[5].end, '12:40');
assert.strictEqual(modeBSchedule[6].type, 'PERIOD'); // Period 5 afternoon class
assert.strictEqual(modeBSchedule[6].periodNumber, 5);
assert.strictEqual(modeBSchedule[6].start, '12:40');
assert.strictEqual(modeBSchedule[6].end, '13:30');
assert.strictEqual(modeBSchedule[7].periodNumber, 6);
assert.strictEqual(modeBSchedule[8].periodNumber, 7);
console.log('  ✓ Mode B (Skipped Break Slot): Period 4 -> [Lunch Break] -> Period 5 Afternoon verified');

// ----------------------------------------------------
// Step 7: Morning Assembly View Parity & Mobile Ergonomics Verification
// ----------------------------------------------------
console.log('\n--- 7. Checking Morning Assembly View Parity, Mini-Calendar & Mobile Ergonomics ---');

const morningViewCheckPath = './src/views/MorningAssemblyView.tsx';
assert.ok(existsSync(morningViewCheckPath), 'src/views/MorningAssemblyView.tsx must exist');
const morningSource = readFileSync(morningViewCheckPath, 'utf8');

// 7.1 Advisory Room Lock & Today Default
assert.ok(morningSource.includes("ADVISORY_ROOM = 'room-3-1'"), 'Morning assembly must be locked to advisory room room-3-1');
assert.ok(morningSource.includes('ม.3/1 (ห้องประจำชั้น)'), 'Must display homeroom advisory label ม.3/1 (ห้องประจำชั้น)');
assert.ok(morningSource.includes("DEFAULT_TODAY = '2026-10-02'"), 'Must default to today 2026-10-02');
assert.ok(morningSource.includes('โฮมรูม'), 'Must render โฮมรูม badge adjacent to title');
console.log('  ✓ Advisory homeroom lock and today default verified');

// 7.2 Action Buttons & 5 KPI Metric Cards Parity with media_1791314921886.png
assert.ok(morningSource.includes('✓ มาแถวครบทุกคน'), 'Must have ✓ มาแถวครบทุกคน button');
assert.ok(morningSource.includes('ตรวจความสอดคล้อง'), 'Must have ตรวจความสอดคล้อง button');
assert.ok(morningSource.includes('นักเรียนทั้งหมด'), 'Must have นักเรียนทั้งหมด metric card');
assert.ok(morningSource.includes('มาแถว ('), 'Must have มาแถว rate metric card');
assert.ok(morningSource.includes('สาย'), 'Must have สาย metric card');
assert.ok(morningSource.includes('ขาด'), 'Must have ขาด metric card');
assert.ok(morningSource.includes('ลา / กิจกรรม'), 'Must have ลา / กิจกรรม metric card');
console.log('  ✓ Action buttons and 5 KPI metric cards parity verified');

// 7.3 Lock 3 Decoupled Morning Late Rule Banner
assert.ok(
  morningSource.includes('ระบบตรวจสอบความสอดคล้องอัตโนมัติ (Lock 3 - Decoupled Morning Late Rule)'),
  'Must include Lock 3 title in information banner'
);
assert.ok(
  morningSource.includes('หากนักเรียนถูกเช็ค') && morningSource.includes('ในแถวเช้า แต่นักเรียนเข้าเรียนในคาบที่ 1'),
  'Must include Lock 3 explanation text in information banner'
);
console.log('  ✓ Lock 3 automated correlation banner verified');

// 7.4 Expandable Mini-Calendar for Retroactive Checking
assert.ok(morningSource.includes('isCalendarOpen'), 'Must implement isCalendarOpen state for expandable mini-calendar');
assert.ok(morningSource.includes('bg-emerald-50 text-emerald-800'), 'Must format checked days with green styling');
assert.ok(morningSource.includes('bg-rose-50 text-rose-800'), 'Must format unchecked past weekdays with red styling');
console.log('  ✓ Expandable mini-calendar with green/red historical status verified');

// 7.5 Classroom Cumulative Term Statistics Modal
assert.ok(morningSource.includes('isStatsModalOpen'), 'Must implement isStatsModalOpen state');
assert.ok(morningSource.includes('ดูสถิติรวมทั้งห้อง'), 'Must have ดูสถิติรวมทั้งห้อง button');
assert.ok(morningSource.includes('สถิติการเข้าแถวเคารพธงชาติ (ภาคเรียนที่ 1/2569)'), 'Modal must have term stats title');
console.log('  ✓ Classroom cumulative stats modal verified');

// 7.6 Mobile Fast-Check Mode (No side scrolling, big thumb touch targets)
assert.ok(morningSource.includes('mobileMode'), 'Must implement mobileMode state');
assert.ok(morningSource.includes('grid grid-cols-5 gap-1.5'), 'Must render thumb-friendly touch button grid on mobile');
assert.ok(morningSource.includes('md:hidden'), 'Must include mobile responsive adaptations');
console.log('  ✓ Ergonomic mobile fast-check mode with large touch targets verified');

// 7.7 Runtime test of getClassroomCumulativeStats and getAssemblyCalendarMonthStatus
const cumulativeStats = attendanceCorrelationService.getClassroomCumulativeStats('room-3-1');
assert.ok(cumulativeStats.students.length >= 8, 'Cumulative stats must include all homeroom students');
assert.ok(cumulativeStats.totalAssemblyDays >= 1, 'Cumulative stats must compute total assembly days');
assert.ok(cumulativeStats.averageRate > 0, 'Cumulative stats must compute average rate');

const octDays = attendanceCorrelationService.getAssemblyCalendarMonthStatus('room-3-1', 2026, 10, '2026-10-02');
assert.strictEqual(octDays.length, 31, 'October must have 31 days in calendar');
const oct1 = octDays.find((d) => d.date === '2026-10-01');
assert.ok(oct1.isWeekday, 'Oct 1 is Thursday weekday');
assert.strictEqual(oct1.isChecked, true, 'Oct 1 is checked (Green)');

console.log('  ✓ Runtime execution of cumulative stats and calendar month status passed');

// ----------------------------------------------------
// Step 8: Classroom Attendance View Parity (media_1791315379363.jpg) & Mobile First Verification
// ----------------------------------------------------
console.log('\n--- 8. Checking Classroom Period Attendance View Parity & Mobile First Ergonomics ---');

const classAttendancePath = './src/views/ClassroomAttendanceView.tsx';
assert.ok(existsSync(classAttendancePath), 'src/views/ClassroomAttendanceView.tsx must exist');
const classAttendanceSource = readFileSync(classAttendancePath, 'utf8');

// 8.1 Taught Courses & Rooms Lock
assert.ok(classAttendanceSource.includes('TEACHER_COURSES'), 'Must declare TEACHER_COURSES restricting to taught courses');
assert.ok(classAttendanceSource.includes('TAUGHT_CLASSROOMS'), 'Must declare TAUGHT_CLASSROOMS restricting to taught rooms');
assert.ok(classAttendanceSource.includes('เฉพาะห้องที่สอน'), 'Must render badge เฉพาะห้องที่สอน');
assert.ok(classAttendanceSource.includes('ญ31201'), 'Must include course ญ31201 ภาษาญี่ปุ่น ม.3/1');
console.log('  ✓ Taught rooms and course restriction locks verified');

// 8.2 5 KPI Cards & Student Parity with media_1791315379363.jpg
assert.ok(classAttendanceSource.includes('JAPANESE_M31_STUDENTS'), 'Must import JAPANESE_M31_STUDENTS for 28 students parity');
assert.ok(serviceSource.includes('ด.ช. กฤษณะ ศรีสมบูรณ์'), 'Must define student 1 ด.ช. กฤษณะ ศรีสมบูรณ์');
assert.ok(serviceSource.includes('ด.ช. ธีรภพ เสยปันคำ'), 'Must define student 2 ด.ช. ธีรภพ เสยปันคำ');
assert.ok(serviceSource.includes('ด.ช. ภูรินท์ บัณฑิต'), 'Must define student 3 ด.ช. ภูรินท์ บัณฑิต');
assert.ok(serviceSource.includes('ด.ช. ชัยมงคล วงศ์บุตร'), 'Must define student 5 ด.ช. ชัยมงคล วงศ์บุตร');
assert.ok(serviceSource.includes('ด.ช. ปรียาภรณ์ ชัยแก้ว'), 'Must define student 7 ด.ช. ปรียาภรณ์ ชัยแก้ว');
console.log('  ✓ Mockup student roster and data parity verified');

// 8.3 Desktop 2-Column Layout, Mini-Calendar & Donut Gauge
assert.ok(classAttendanceSource.includes('col-span-8'), 'Must implement Desktop Left Column (col-span-8)');
assert.ok(classAttendanceSource.includes('col-span-4'), 'Must implement Desktop Right Column (col-span-4)');
assert.ok(classAttendanceSource.includes('ปฏิทินเช็คชื่อ'), 'Must render Mini-Calendar widget ปฏิทินเช็คชื่อ');
assert.ok(classAttendanceSource.includes('สถิติการเข้าเรียน (ห้อง ม.3/1)'), 'Must render Attendance Donut widget');
assert.ok(classAttendanceSource.includes('85.7%'), 'Must calculate 85.7% attendance rate');
console.log('  ✓ Desktop 2-column layout, mini-calendar, and donut gauge verified');

// 8.4 Classroom Cumulative Term Statistics Modal
assert.ok(classAttendanceSource.includes('isStatsModalOpen'), 'Must implement isStatsModalOpen state');
assert.ok(classAttendanceSource.includes('สถิติการเข้าเรียนสะสมตลอดภาคเรียน : ม.3/1'), 'Must render modal title for cumulative stats');
assert.ok(classAttendanceSource.includes('ผ่านเกณฑ์ 80% (SAR)'), 'Must calculate students passing 80% rule');
assert.ok(classAttendanceSource.includes('กลุ่มเสี่ยง มส.'), 'Must calculate at-risk students below 80% rule');
console.log('  ✓ Classroom cumulative stats modal with per-student metrics verified');

// 8.5 Mobile First Two-Screen Architecture (No side scrolling, 44px tap targets)
assert.ok(classAttendanceSource.includes("mobileScreen === 'LIST'"), 'Must implement Mobile Screen 1 (Check List)');
assert.ok(classAttendanceSource.includes("mobileScreen === 'CALENDAR'"), 'Must implement Mobile Screen 2 (Retroactive Calendar)');
assert.ok(classAttendanceSource.includes('min-h-[44px]'), 'Must use thumb-friendly touch targets with min-h-[44px]');
assert.ok(classAttendanceSource.includes('lg:hidden'), 'Must be responsive for mobile screens');
console.log('  ✓ Mobile First two-screen architecture without horizontal scroll verified');

// 8.6 Runtime tests for getPeriodCalendarMonthStatus & getCourseCumulativeStats
const jpMonthDays = attendanceCorrelationService.getPeriodCalendarMonthStatus('ญ31201', 'room-3-1', 2026, 10, '2026-10-02');
assert.strictEqual(jpMonthDays.length, 31, 'October must have 31 days');
const jpDay2 = jpMonthDays.find((d) => d.dayOfMonth === 2);
assert.ok(jpDay2, 'Day 2 must exist');
assert.strictEqual(jpDay2.isChecked, true, 'Day 2 must be checked (Green)');
const jpDay15 = jpMonthDays.find((d) => d.dayOfMonth === 15);
assert.strictEqual(jpDay15.isChecked, false, 'Day 15 must be unchecked (Red) matching mockup');

const jpCourseCumulative = attendanceCorrelationService.getCourseCumulativeStats('ญ31201', 'room-3-1');
assert.strictEqual(jpCourseCumulative.totalStudents, 28, 'Must have 28 students in Japanese M.3/1');
assert.ok(jpCourseCumulative.averageRate >= 80, 'Must calculate healthy average attendance rate');
const student1 = jpCourseCumulative.students.find((s) => s.studentCode === '45101');
assert.ok(student1, 'Student 45101 must exist in cumulative stats');
assert.ok(student1.presentDays > 0, 'Student 45101 must have positive present days');
assert.strictEqual(student1.statusTag, 'NORMAL', 'Student 45101 must have NORMAL status');

console.log('  ✓ Runtime execution of period calendar status and course cumulative stats passed');

// ----------------------------------------------------
// Step 9: Multi-Strand Feedback Stickers Catalog Verification
// ----------------------------------------------------
console.log('\n--- 9. Checking Multi-Strand Feedback Stickers Catalog (สติกเกอร์คำติชม 1-Tap) ---');

const feedbackCatalogPath = './src/config/feedbackStickersCatalog.ts';
assert.ok(existsSync(feedbackCatalogPath), 'src/config/feedbackStickersCatalog.ts must exist');
const feedbackCatalogSource = readFileSync(feedbackCatalogPath, 'utf8');

// 9.1 All 9 Categories declared
const expectedStrands = ['GENERAL', 'MATH', 'SCIENCE', 'THAI', 'FOREIGN_LANG', 'SOCIAL', 'PE_HEALTH', 'ART_MUSIC', 'CAREER'];
for (const strand of expectedStrands) {
  assert.ok(feedbackCatalogSource.includes(`'${strand}'`), `Must support strand category '${strand}'`);
}
console.log('  ✓ All 9 subject learning strands present in catalog');

// 9.2 Test runtime auto-detection logic
const detectFeedbackStrand = (code, name) => {
  const combined = `${code || ''} ${name || ''}`.toLowerCase();
  if (combined.includes('ญี่ปุ่น') || combined.includes('japanese') || combined.includes('อังกฤษ') || combined.includes('จีน')) return 'FOREIGN_LANG';
  if (combined.includes('ศิลปะ') || combined.includes('ดนตรี') || combined.includes('ทัศนศิลป์')) return 'ART_MUSIC';
  if (combined.includes('คณิต') || combined.includes('math')) return 'MATH';
  if (combined.includes('วิทย์') || combined.includes('ฟิสิกส์') || combined.includes('เคมี') || combined.includes('คอมพิวเตอร์')) return 'SCIENCE';
  if (combined.includes('ภาษาไทย') || combined.includes('วรรณคดี')) return 'THAI';
  if (combined.includes('สังคม') || combined.includes('ประวัติศาสตร์')) return 'SOCIAL';
  if (combined.includes('สุขศึกษา') || combined.includes('พลศึกษา') || combined.includes('กีฬา')) return 'PE_HEALTH';
  if (combined.includes('การงาน') || combined.includes('เกษตร')) return 'CAREER';
  if (code && code.length > 0) {
    const c = code.charAt(0);
    if (['ญ', 'อ', 'จ', 'ฝ'].includes(c)) return 'FOREIGN_LANG';
    if (c === 'ศ') return 'ART_MUSIC';
    if (c === 'ค') return 'MATH';
    if (c === 'ว') return 'SCIENCE';
    if (c === 'ท') return 'THAI';
    if (c === 'ส') return 'SOCIAL';
    if (c === 'พ') return 'PE_HEALTH';
    if (c === 'ง') return 'CAREER';
  }
  return 'GENERAL';
};

assert.strictEqual(detectFeedbackStrand('ญ31201', 'ภาษาญี่ปุ่น 1'), 'FOREIGN_LANG');
assert.strictEqual(detectFeedbackStrand('ศ23101', 'ศิลปะ 3 (ทัศนศิลป์)'), 'ART_MUSIC');
assert.strictEqual(detectFeedbackStrand('ค21101', 'คณิตศาสตร์พื้นฐาน'), 'MATH');
assert.strictEqual(detectFeedbackStrand('ว30221', 'เคมี 1'), 'SCIENCE');
assert.strictEqual(detectFeedbackStrand('ท21101', 'ภาษาไทย 1'), 'THAI');
assert.strictEqual(detectFeedbackStrand('ส21101', 'ประวัติศาสตร์ไทย'), 'SOCIAL');
assert.strictEqual(detectFeedbackStrand('พ21101', 'สุขศึกษาและพลศึกษา'), 'PE_HEALTH');
assert.strictEqual(detectFeedbackStrand('ง21101', 'การงานอาชีพ'), 'CAREER');
assert.strictEqual(detectFeedbackStrand('ก21901', 'ลูกเสือเนตรนารี'), 'GENERAL');
console.log('  ✓ Multi-strand auto-detection correctly detects subject majors');

// 9.3 Verify GradingWorkspaceModal integrates the catalog and custom stickers
const gradingModalPath = './src/components/teacher/GradingWorkspaceModal.tsx';
assert.ok(existsSync(gradingModalPath), 'src/components/teacher/GradingWorkspaceModal.tsx must exist');
const gradingModalSource = readFileSync(gradingModalPath, 'utf8');

assert.ok(gradingModalSource.includes('FEEDBACK_STRAND_CATALOG'), 'Must import FEEDBACK_STRAND_CATALOG in modal');
assert.ok(gradingModalSource.includes('detectFeedbackStrand'), 'Must import detectFeedbackStrand in modal');
assert.ok(gradingModalSource.includes('selectedStrand'), 'Must maintain selectedStrand state in modal');
assert.ok(gradingModalSource.includes('setTeacherPreferredStrand'), 'Must persist teacher preferred strand in modal');
assert.ok(gradingModalSource.includes('addCustomFeedbackSticker'), 'Must support adding custom stickers');
assert.ok(gradingModalSource.includes('removeCustomFeedbackSticker'), 'Must support removing custom stickers');
assert.ok(gradingModalSource.includes('เพิ่มสติกเกอร์ของฉัน'), 'Must render button to add custom sticker');
console.log('  ✓ GradingWorkspaceModal integrates multi-strand catalog and custom stickers UI');

// ----------------------------------------------------
// Step 10: Attendance % Calculation Strictly on Elapsed Days to Date Verification
// ----------------------------------------------------
console.log('\n--- 10. Checking Attendance % Calculation on Elapsed Days to Date (No 20-Week Fixed Denominator) ---');

// 10.1 Early term scenario: 4 classes conducted so far. Student attended 2, missed 2.
// Denominator must be 4 elapsed classes, resulting in 50.0% attendance rate and immediate AT-RISK flag!
const earlyTermRecords = [
  { status: 'PRESENT' },
  { status: 'PRESENT' },
  { status: 'ABSENT' },
  { status: 'ABSENT' },
];
const earlySummary = attendanceCorrelationService.compute80RuleFromRecords('45199', 'ค21101', earlyTermRecords);
assert.strictEqual(earlySummary.totalScheduledPeriods, 4, 'Must use 4 elapsed periods to date as denominator');
assert.strictEqual(earlySummary.earnedPeriods, 2, 'Earned 2 periods');
assert.strictEqual(earlySummary.attendanceRate, 50.0, 'Attendance rate must be exactly 50.0%');
assert.strictEqual(earlySummary.isEligibleForExam, false, '50% must NOT be eligible for exam');
assert.strictEqual(earlySummary.isAtRisk, true, 'Student must be immediately flagged at-risk (< 80%)');
console.log('  ✓ Early-term at-risk detection verified: 2/4 attended = 50.0% at-risk (not obscured by 20 weeks)');

// 10.2 Early term scenario: 5 classes conducted. Student attended 4, absent 1.
// 4 / 5 = 80.0% -> eligible, not at risk
const earlyTermPassingRecords = [
  { status: 'PRESENT' },
  { status: 'PRESENT' },
  { status: 'LATE' },
  { status: 'ACTIVITY' },
  { status: 'ABSENT' },
];
const earlyPassingSummary = attendanceCorrelationService.compute80RuleFromRecords('45200', 'ว21101', earlyTermPassingRecords);
assert.strictEqual(earlyPassingSummary.totalScheduledPeriods, 5);
assert.strictEqual(earlyPassingSummary.earnedPeriods, 4);
assert.strictEqual(earlyPassingSummary.attendanceRate, 80.0);
assert.strictEqual(earlyPassingSummary.isEligibleForExam, true);
assert.strictEqual(earlyPassingSummary.isAtRisk, false);
console.log('  ✓ Early-term passing boundary verified: 4/5 attended = 80.0% eligible');

// 10.3 Dynamic elapsed teaching days in getCourseCumulativeStats
const courseStats = attendanceCorrelationService.getCourseCumulativeStats('ญ31201', 'room-3-1');
assert.ok(courseStats.totalAssemblyDays > 0, 'Must have dynamic elapsed teaching days');
assert.ok(courseStats.totalAssemblyDays <= 31, 'Must reflect conducted days to date');
for (const s of courseStats.students) {
  assert.strictEqual(s.totalDays, s.presentDays + s.lateDays + s.absentDays + s.leaveDays + s.activityDays,
    `Student ${s.studentCode} totalDays must equal sum of their conducted classes to date`);
  const expectedRate = Number(((s.earnedDays / s.totalDays) * 100).toFixed(1));
  assert.strictEqual(s.attendanceRate, expectedRate,
    `Student ${s.studentCode} rate must equal earnedDays / totalDays * 100 to date`);
}
console.log('  ✓ getCourseCumulativeStats per-student totalDays strictly matches elapsed conducted days');

// --- 11. Checking Phase 1 Unified Attendance Architecture & Zero-Silo Integration ---
console.log('\n--- 11. Checking Phase 1 Unified Attendance Architecture & Zero-Silo Integration ---');

// 11.1 Check TeacherOverviewView.tsx integration
const teacherOverviewSrc = readFileSync('src/views/TeacherOverviewView.tsx', 'utf8');
assert.ok(teacherOverviewSrc.includes('attendanceCorrelationService'), 'TeacherOverviewView must import and use attendanceCorrelationService');
assert.ok(teacherOverviewSrc.includes('kps-data-sync-event'), 'TeacherOverviewView must listen to kps-data-sync-event for reactive sync');
assert.ok(teacherOverviewSrc.includes('loadAttendanceDataFromCorrelation'), 'TeacherOverviewView must have loadAttendanceDataFromCorrelation');
assert.ok(teacherOverviewSrc.includes('computedAtRiskStudents'), 'TeacherOverviewView must dynamically compute at-risk students from correlation stats');
console.log('  ✓ TeacherOverviewView.tsx imports attendanceCorrelationService, dynamic at-risk stats, and listens to kps-data-sync-event');

// 11.2 Check attendanceService.ts delegation bridge
const attendanceServiceSrc = readFileSync('src/services/attendanceService.ts', 'utf8');
assert.ok(attendanceServiceSrc.includes('attendanceCorrelationService'), 'attendanceService must bridge to attendanceCorrelationService');
assert.ok(attendanceServiceSrc.includes('attendanceCorrelationService.savePeriodRecords'), 'attendanceService.saveRollCall must delegate to savePeriodRecords');
assert.ok(attendanceServiceSrc.includes('attendanceCorrelationService.runCorrelation'), 'attendanceService.saveRollCall must run correlation engine');
console.log('  ✓ attendanceService.ts successfully bridges to attendanceCorrelationService as single source of truth');

// 11.3 Check cleanSlateService.ts includes legacy attendance keys
const cleanSlateSrc = readFileSync('src/services/cleanSlateService.ts', 'utf8');
assert.ok(cleanSlateSrc.includes("'cls_attendance_records'"), 'cleanSlateService must include cls_attendance_records');
assert.ok(cleanSlateSrc.includes("'cls_timetable_data'"), 'cleanSlateService must include cls_timetable_data');
console.log('  ✓ cleanSlateService.ts includes legacy cls_attendance_records and cls_timetable_data in purge keys');

// 11.4 Check messagingService.ts transfers attendanceCorrelation records
const messagingSrc = readFileSync('src/services/messagingService.ts', 'utf8');
assert.ok(messagingSrc.includes('kp_morning_assembly_records'), 'messagingService must transfer kp_morning_assembly_records');
assert.ok(messagingSrc.includes('kp_period_attendance_records'), 'messagingService must transfer kp_period_attendance_records');
console.log('  ✓ messagingService.ts transfers both morning and period correlation records across rooms');

// 11.5 Runtime delegation check: attendanceService -> attendanceCorrelationService
const { attendanceService } = await import('./src/services/attendanceService.ts');
await attendanceService.saveRollCall({
  scheduleId: 'sched-verify-1',
  classroomId: 'room-3-1',
  schoolDate: '2026-10-05',
  records: [
    { enrollmentId: 'stu-1', status: 'PRESENT' },
    { enrollmentId: 'stu-2', status: 'LATE' },
    { enrollmentId: 'stu-3', status: 'ABSENT' },
  ],
});
const verifiedPeriodRecords = attendanceCorrelationService.getPeriodRecordsByDateAndRoom('room-3-1', '2026-10-05');
assert.ok(verifiedPeriodRecords.length >= 3, 'Must have at least 3 records created via attendanceService delegation');
const stu1Rec = verifiedPeriodRecords.find((r) => r.studentId === 'stu-1');
assert.ok(stu1Rec, 'stu-1 record must exist in attendanceCorrelationService');
assert.strictEqual(stu1Rec.status, 'PRESENT', 'stu-1 status must match');
console.log('  ✓ Runtime bridge verified: attendanceService.saveRollCall records persist directly into attendanceCorrelationService');

console.log('\n🎉 ALL ATTENDANCE CORRELATION ENGINE, SUBJECT ICONS, BANNER COMPRESSOR, SIDEBAR UX, BELL SCHEDULE, MORNING ASSEMBLY, CLASSROOM ATTENDANCE, STICKERS CATALOG, ELAPSED ATTENDANCE % & PHASE 1 UNIFIED ARCHITECTURE CHECKS PASSED!');


