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

console.log('\n🎉 ALL ATTENDANCE CORRELATION ENGINE UNIT CHECKS PASSED!');
