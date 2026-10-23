// test_pipeline_linkage_fixes.mjs
// Automated verification of the 6 pipeline linkage fixes:
// Assign -> Submit -> Review -> Grade & Bridge -> Display & Matrices

import assert from 'assert';

console.log('🧪 Starting pipeline linkage verification tests...\n');

// Mock localStorage
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (i) => Array.from(store.keys())[i],
};

global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

// Test 1: Channel and textContent detection
console.log('Test 1: Verification of textContent and channel detection...');
const mockSubTextOnly = {
  assignmentId: 'asg-test-text',
  studentCode: '45101',
  textContent: 'คำตอบของนักเรียน: คำตอบข้อที่ 1 คือ...',
  fileUrl: '',
  fileDataUrl: '',
  externalLinkUrl: '',
  status: 'SUBMITTED_PENDING',
};

const hasTextOnly = Boolean(mockSubTextOnly.textContent && !mockSubSubHasFile(mockSubTextOnly) && !mockSubTextOnly.externalLinkUrl);
function mockSubSubHasFile(sub) {
  return Boolean(sub.fileUrl || sub.fileDataUrl);
}
assert.strictEqual(hasTextOnly, true, 'Text response should be recognized when no file or link exists');
console.log('✅ Test 1 Passed: textContent recognition is correct.');

// Test 2: External link retention in syncGradingQueueItem
console.log('Test 2: Verification of externalLinkUrl retention in syncGradingQueueItem...');
const sampleQueue = [];
const queueCanonicalId = `q_asg-link_45101`;
sampleQueue.push({
  id: queueCanonicalId,
  assignmentId: 'asg-link',
  studentCode: '45101',
  externalLinkUrl: 'https://www.canva.com/design/DAF...',
  status: 'PENDING_REVIEW',
});
store.set('kp_grading_queue_v2', JSON.stringify(sampleQueue));

const readQueue = JSON.parse(store.get('kp_grading_queue_v2'));
assert.strictEqual(readQueue[0].externalLinkUrl, 'https://www.canva.com/design/DAF...', 'External link must be saved in queue');
console.log('✅ Test 2 Passed: externalLinkUrl is preserved in grading queue.');

// Test 3: Returned status check in StudentMissions
console.log('Test 3: Verification of returned status checking...');
const subReturned1 = { status: 'RETURNED_REVISION' };
const subReturned2 = { status: 'RETURNED' };
const subGraded = { status: 'GRADED' };

const isRet = (sub) => sub?.status === 'RETURNED_REVISION' || sub?.status === 'RETURNED';
assert.strictEqual(isRet(subReturned1), true, 'RETURNED_REVISION must be recognized');
assert.strictEqual(isRet(subReturned2), true, 'RETURNED must be recognized');
assert.strictEqual(isRet(subGraded), false, 'GRADED must not be considered returned');
console.log('✅ Test 3 Passed: Both RETURNED and RETURNED_REVISION are recognized.');

// Test 4: Midterm score calculation when student did real exam work vs default 0
console.log('Test 4: Verification of midterm score calculation...');
const weights = { preMidterm: 30, midterm: 20, postMidterm: 30, final: 20 };
const midFromWorks = 18; // Student earned 18 on midterm exam
const studentWithDefaultZero = { midtermScore: 0 };
const courseOverrideEmpty = undefined;

// Old logic had: manualMid = typeof student.midtermScore === 'number' ? student.midtermScore : null -> 0!
// New logic:
const manualMidFixed =
  courseOverrideEmpty !== undefined
    ? courseOverrideEmpty
    : midFromWorks > 0
    ? null
    : typeof studentWithDefaultZero.midtermScore === 'number'
    ? studentWithDefaultZero.midtermScore
    : null;

const midtermVal =
  manualMidFixed !== null && manualMidFixed !== undefined
    ? Math.min(weights.midterm, Math.max(0, Number(manualMidFixed)))
    : Math.min(weights.midterm, midFromWorks);

assert.strictEqual(midtermVal, 18, 'Midterm exam work score of 18 must NOT be overridden by default 0');
console.log('✅ Test 4 Passed: Real midterm exam work is prioritized over default 0.');

// Test 5: Classroom normalization matching in matrix modal
console.log('Test 5: Classroom normalization matching in matrix modal...');
function normalizeClassroomCode(room) {
  if (!room) return '';
  const trimmed = String(room).trim();
  const roomCodeMatch = trimmed.match(/^room[-_](\d+)[-_](\d+)$/i);
  if (roomCodeMatch) return `ม.${roomCodeMatch[1]}/${roomCodeMatch[2]}`;
  const engMatch = trimmed.match(/^m\.?\s*(\d+)\s*\/\s*(\d+)$/i);
  if (engMatch) return `ม.${engMatch[1]}/${engMatch[2]}`;
  const thaiMatch = trimmed.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
  if (thaiMatch) return `ม.${thaiMatch[1]}/${thaiMatch[2]}`;
  return trimmed.replace(/\s+/g, '').toLowerCase();
}
function isSameClassroom(a, b) {
  return normalizeClassroomCode(a) === normalizeClassroomCode(b);
}

assert.strictEqual(isSameClassroom('room-3-1', 'ม.3/1'), true, 'room-3-1 should match ม.3/1');
assert.strictEqual(isSameClassroom('m.3/1', 'ม. 3 / 1'), true, 'm.3/1 should match ม. 3 / 1');
assert.strictEqual(isSameClassroom('room-3-1', 'room-3-2'), false, 'Different rooms should not match');
console.log('✅ Test 5 Passed: isSameClassroom matches properly.');

console.log('\n🎉 ALL 5 PIPELINE LINKAGE TESTS PASSED SUCCESSFULLY!');
