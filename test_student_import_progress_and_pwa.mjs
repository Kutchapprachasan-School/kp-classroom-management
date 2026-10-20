import assert from 'node:assert';

console.log('🧪 Starting Student Import Progress & PWA Install Guard Test Suite...\n');

// ============================================================================
// Test 1: Batch Import Progress & Percentage Mathematics
// ============================================================================
console.log('--- 1. Testing Batch Import Progress Mathematics ---');

function simulateBatchProgress(totalItems, chunkSize = 15) {
  const steps = [];
  let processed = 0;

  if (totalItems === 0) {
    return [{ current: 0, total: 0, percentage: 100 }];
  }

  for (let i = 0; i < totalItems; i += chunkSize) {
    const chunkCount = Math.min(chunkSize, totalItems - i);
    processed += chunkCount;
    const current = Math.min(processed, totalItems);
    const percentage = Math.min(100, Math.round((processed / totalItems) * 100));
    steps.push({ current, total: totalItems, percentage });
  }
  return steps;
}

// Case 1A: Single room with 38 students (typical classroom size)
const roomSteps = simulateBatchProgress(38, 15);
assert.strictEqual(roomSteps.length, 3, '38 students chunked by 15 should produce 3 progress events');
assert.strictEqual(roomSteps[0].current, 15);
assert.strictEqual(roomSteps[0].percentage, 39); // 15/38 = 39.47% -> 39%
assert.strictEqual(roomSteps[1].current, 30);
assert.strictEqual(roomSteps[1].percentage, 79); // 30/38 = 78.9% -> 79%
assert.strictEqual(roomSteps[2].current, 38);
assert.strictEqual(roomSteps[2].percentage, 100);
console.log('  ✓ 38-student room progress stepped cleanly: 39% -> 79% -> 100%');

// Case 1B: Exact multiple of chunk size (e.g. 30 students)
const exactSteps = simulateBatchProgress(30, 15);
assert.strictEqual(exactSteps.length, 2);
assert.strictEqual(exactSteps[0].percentage, 50);
assert.strictEqual(exactSteps[1].percentage, 100);
console.log('  ✓ Exact multiple (30 students) produced clean 50% -> 100%');

// Case 1C: Small class (e.g. M.4/3 with 12 students < 15 chunk size)
const smallSteps = simulateBatchProgress(12, 15);
assert.strictEqual(smallSteps.length, 1);
assert.strictEqual(smallSteps[0].current, 12);
assert.strictEqual(smallSteps[0].percentage, 100);
console.log('  ✓ Small class (12 students) resolved immediately to 100% in 1 batch');

// Case 1D: Large school import (988 students)
const schoolSteps = simulateBatchProgress(988, 15);
assert.strictEqual(schoolSteps.length, Math.ceil(988 / 15));
assert.strictEqual(schoolSteps[schoolSteps.length - 1].percentage, 100);
assert.strictEqual(schoolSteps[schoolSteps.length - 1].current, 988);
console.log(`  ✓ Whole-school roster (988 students) stepped through ${schoolSteps.length} micro-batches to 100%`);


// ============================================================================
// Test 2: Accidental Close Guard Simulation (beforeunload handler)
// ============================================================================
console.log('\n--- 2. Testing Accidental Close Guard (beforeunload) ---');

function createBeforeUnloadGuard(isImportingRef) {
  return function handleBeforeUnload(event) {
    if (isImportingRef.current) {
      event.preventDefault();
      event.returnValue = 'กำลังนำเข้าข้อมูลนักเรียน กรุณารอให้ระบบประมวลผลเสร็จสิ้นก่อนปิดหน้านี้';
      return event.returnValue;
    }
    return undefined;
  };
}

const state = { current: false };
const guard = createBeforeUnloadGuard(state);

// When idle: should NOT block navigation
const idleEvent = { preventDefaultCalled: false, preventDefault() { this.preventDefaultCalled = true; }, returnValue: '' };
const idleResult = guard(idleEvent);
assert.strictEqual(idleResult, undefined, 'Idle guard should not block window exit');
assert.strictEqual(idleEvent.preventDefaultCalled, false);
console.log('  ✓ Window unload allowed when import is idle');

// When importing: MUST block navigation and prompt user
state.current = true;
const importingEvent = { preventDefaultCalled: false, preventDefault() { this.preventDefaultCalled = true; }, returnValue: '' };
const importingResult = guard(importingEvent);
assert.strictEqual(importingEvent.preventDefaultCalled, true, 'Importing guard must call preventDefault()');
assert.strictEqual(typeof importingResult, 'string');
assert.strictEqual(importingResult.includes('กำลังนำเข้า'), true);
console.log('  ✓ Window unload blocked with warning message while importing is in progress');


// ============================================================================
// Test 3: PWA Standalone Mode Detection Logic
// ============================================================================
console.log('\n--- 3. Testing PWA Standalone Mode Detection ---');

function checkPwaStandalone(mockEnv) {
  const isMatchMediaStandalone = mockEnv.matchMediaResult ?? false;
  const isNavigatorStandalone = mockEnv.navigatorStandalone ?? false;
  const isReferrerAndroidApp = mockEnv.referrer?.includes('android-app://') ?? false;

  return Boolean(isMatchMediaStandalone || isNavigatorStandalone || isReferrerAndroidApp);
}

assert.strictEqual(
  checkPwaStandalone({ matchMediaResult: true }),
  true,
  'matchMedia (display-mode: standalone) must detect installed PWA'
);
assert.strictEqual(
  checkPwaStandalone({ navigatorStandalone: true }),
  true,
  'iOS navigator.standalone === true must detect installed PWA'
);
assert.strictEqual(
  checkPwaStandalone({ referrer: 'android-app://com.android.chrome/' }),
  true,
  'Android TWA/PWA referrer must detect installed PWA'
);
assert.strictEqual(
  checkPwaStandalone({ matchMediaResult: false, navigatorStandalone: false, referrer: 'https://google.com' }),
  false,
  'Regular browser tab must NOT be detected as standalone'
);
console.log('  ✓ Standalone detection accurately isolates installed apps vs browser tabs');


// ============================================================================
// Test 4: PWA Dismissal Cooldown (24-Hour Suppress Guard)
// ============================================================================
console.log('\n--- 4. Testing PWA 24-Hour Dismissal Cooldown ---');

const DISMISS_KEY = 'kps_pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

function isPwaPromptSuppressed(storageMock, now = Date.now()) {
  const dismissedUntil = storageMock.getItem(DISMISS_KEY);
  if (!dismissedUntil) return false;
  const expiry = parseInt(dismissedUntil, 10);
  return now < expiry;
}

const mockStorage = {
  data: {},
  getItem(k) { return this.data[k] ?? null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; }
};

// Initially not suppressed
assert.strictEqual(isPwaPromptSuppressed(mockStorage), false, 'New user must see PWA banner');

// User dismisses banner
const baseTime = 1700000000000;
mockStorage.setItem(DISMISS_KEY, baseTime + DISMISS_DURATION_MS);

// Check 1 hour later (still within cooldown)
assert.strictEqual(
  isPwaPromptSuppressed(mockStorage, baseTime + 3600 * 1000),
  true,
  'Within 24 hours of dismissal, prompt must be suppressed'
);

// Check 25 hours later (cooldown expired)
assert.strictEqual(
  isPwaPromptSuppressed(mockStorage, baseTime + 25 * 3600 * 1000),
  false,
  'After 24 hours, prompt should re-eligible'
);
console.log('  ✓ 24-hour dismissal cooldown logic verified');


// ============================================================================
// Test 5: iOS Safari User-Agent Detection
// ============================================================================
console.log('\n--- 5. Testing iOS Safari User-Agent Detection ---');

function isIosDevice(userAgent, hasMSStream = false) {
  const ua = userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !hasMSStream;
}

assert.strictEqual(
  isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'),
  true,
  'iPhone Safari correctly detected'
);
assert.strictEqual(
  isIosDevice('Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'),
  true,
  'iPad Safari correctly detected'
);
assert.strictEqual(
  isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'),
  false,
  'Android Chrome correctly NOT detected as iOS'
);
assert.strictEqual(
  isIosDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'),
  false,
  'Desktop Windows correctly NOT detected as iOS'
);
console.log('  ✓ iOS detection correctly differentiates iOS devices from Android and Desktop');

// ============================================================================
// Test 6: SGS Import Room Mismatch Adaptation & Single-Room Count Isolation
// ============================================================================
console.log('\n--- 6. Testing SGS Import Room Mismatch Adaptation & Count Isolation ---');

// Simulated dry-run data matching user screenshot
const mockDetectedRooms = ['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6'];
const mockRoomCounts = {
  'ม.1/1': 35,
  'ม.1/2': 35,
  'ม.1/3': 30,
  'ม.1/4': 35,
  'ม.1/5': 35,
  'ม.1/6': 34,
};
const _totalStudents = Object.values(mockRoomCounts).reduce((a, b) => a + b, 0); // 204

const mockRows = [];
for (const room of mockDetectedRooms) {
  for (let i = 1; i <= mockRoomCounts[room]; i++) {
    mockRows.push({
      studentCode: `code-${room}-${i}`,
      fullName: `นักเรียน ${room} เลขที่ ${i}`,
      classroom: room,
      selectedAction: 'IMPORT',
    });
  }
}

// 6A. Mismatch Adaptation: User was on ม.3/1, but file contains ม.1
const targetClassroomFromProp = 'ม.3/1';
function computeEffectiveTargetClassroom(detectedRooms, targetClassroom) {
  if (detectedRooms && detectedRooms.length > 0) {
    if (detectedRooms.includes(targetClassroom)) {
      return targetClassroom;
    }
    return detectedRooms[0];
  }
  return targetClassroom;
}

const effectiveTarget = computeEffectiveTargetClassroom(mockDetectedRooms, targetClassroomFromProp);
assert.strictEqual(
  effectiveTarget,
  'ม.1/1',
  'When file is M.1 but current room is M.3/1, effective target must smartly adapt to M.1/1, not stay M.3/1'
);
console.log('  ✓ Mismatch file grade correctly adapts target room to M.1/1 instead of M.3/1');

// 6B. Room Pill Selection: User clicks ม.1/1 pill
function computeActiveRoom(selectedRoomFilter, effectiveTargetRoom) {
  if (selectedRoomFilter && selectedRoomFilter !== 'ALL') {
    return selectedRoomFilter;
  }
  return effectiveTargetRoom;
}

const activeRoomPillSelected = computeActiveRoom('ม.1/1', effectiveTarget);
assert.strictEqual(activeRoomPillSelected, 'ม.1/1');

// 6C. Count Isolation: MULTI_ROOM vs TARGET_ONLY
function computeImportCounts(rows, importMode, activeRoomName, effectiveTargetRoom) {
  const allCount = rows.filter(r => r.selectedAction === 'IMPORT').length;
  const singleRoomCount = rows.filter(
    r => (r.classroom || effectiveTargetRoom) === activeRoomName && r.selectedAction === 'IMPORT'
  ).length;

  return {
    allCount,
    singleRoomCount,
    activeCount: importMode === 'MULTI_ROOM' ? allCount : singleRoomCount,
  };
}

// In MULTI_ROOM mode:
const multiRoomCounts = computeImportCounts(mockRows, 'MULTI_ROOM', 'ม.1/1', effectiveTarget);
assert.strictEqual(multiRoomCounts.activeCount, 204, 'Multi-room mode imports all 204 students');

// In TARGET_ONLY mode (or when room pill is clicked):
const targetOnlyCounts = computeImportCounts(mockRows, 'TARGET_ONLY', 'ม.1/1', effectiveTarget);
assert.strictEqual(
  targetOnlyCounts.activeCount,
  35,
  'Target-only mode for M.1/1 must import strictly 35 students, NEVER 204 students'
);
console.log('  ✓ TARGET_ONLY mode accurately isolates import count to 35 students (not 204 all rooms)');

// 6D. Button text validation
function getButtonLabel(importMode, isMultiRoomFile, detectedRoomsCount, activeCount, activeRoomName) {
  if (importMode === 'MULTI_ROOM' && isMultiRoomFile) {
    return `⚡ นำเข้าแยก ${detectedRoomsCount} ห้อง (${activeCount} คน)`;
  }
  return `ยืนยันนำเข้าห้อง ${activeRoomName} (${activeCount} คน)`;
}

const multiRoomButton = getButtonLabel('MULTI_ROOM', true, 6, multiRoomCounts.activeCount, 'ม.1/1');
assert.strictEqual(multiRoomButton, '⚡ นำเข้าแยก 6 ห้อง (204 คน)');

const singleRoomButton = getButtonLabel('TARGET_ONLY', true, 6, targetOnlyCounts.activeCount, 'ม.1/1');
assert.strictEqual(singleRoomButton, 'ยืนยันนำเข้าห้อง ม.1/1 (35 คน)');
assert.ok(!singleRoomButton.includes('ม.3/1'), 'Button must NOT mention M.3/1');
assert.ok(!singleRoomButton.includes('204'), 'Single room button must NOT show 204');
console.log('  ✓ Button label dynamically and accurately renders "ยืนยันนำเข้าห้อง ม.1/1 (35 คน)"');

// 6E. Candidate Rows Filtering in handleConfirmImport
function filterCandidateRows(rows, importMode, isMultiRoomFile, activeRoomName, effectiveTargetRoom) {
  if (importMode === 'TARGET_ONLY' && isMultiRoomFile) {
    return rows.filter((r) => (r.classroom || effectiveTargetRoom) === activeRoomName);
  }
  return rows;
}

const confirmedTargetOnly = filterCandidateRows(mockRows, 'TARGET_ONLY', true, 'ม.1/1', effectiveTarget);
assert.strictEqual(confirmedTargetOnly.length, 35, 'Must only import 35 candidate rows for M.1/1');
assert.ok(confirmedTargetOnly.every(r => r.classroom === 'ม.1/1'), 'All imported rows must belong to M.1/1');
console.log('  ✓ handleConfirmImport candidate filter strictly prevents leaking other rooms into M.1/1');

console.log('\n🎉 ALL STUDENT IMPORT PROGRESS & PWA TESTS PASSED PERFECTLY!\n');
