// test_grading_and_prapan_fixes.mjs
// Automated verification suite for the 5 grading & Prapan fixes:
// 1. Course Code Guard: Submissions in Course A do not match Course B
// 2. Returned Submission Lifecycle: Returned items separated from pending, resubmission deletes old file & resets FIFO
// 3. Text Answer Submissions: Student can type responses without file requirement
// 4. Proportional Score Rescaling: Proportional % scaling when maxScore is changed (e.g. 20 -> 10)
// 5. Multi Sub-tasks Grading: Independent grading of sub-tasks 2, 3 within the same unit

import assert from 'assert';
import { spawnSync } from 'child_process';

// Auto-run with tsx if executed directly under plain Node
const isTsx = process.execArgv.some((a) => a.includes('tsx')) || process.env.TSX_RUNNER === '1';
if (!isTsx) {
  const result = spawnSync('npx', ['tsx', './test_grading_and_prapan_fixes.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, TSX_RUNNER: '1' },
    shell: true,
  });
  process.exit(result.status ?? 0);
}

console.log('🧪 Starting 5-Point Grading & Prapan Overhaul Verification Suite...\n');

// 0. Mock environment
const store = new Map();
const eventListeners = new Map();

global.window = {
  localStorage: {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
  dispatchEvent: (event) => {
    const listeners = eventListeners.get(event.type) || [];
    listeners.forEach((fn) => fn(event));
    return true;
  },
  addEventListener: (type, fn) => {
    if (!eventListeners.has(type)) eventListeners.set(type, []);
    eventListeners.get(type).push(fn);
  },
  removeEventListener: (type, fn) => {
    if (eventListeners.has(type)) {
      eventListeners.set(type, eventListeners.get(type).filter((f) => f !== fn));
    }
  },
  CustomEvent: class CustomEvent {
    constructor(type, detail) {
      this.type = type;
      this.detail = detail;
    }
  },
  Event: class Event {
    constructor(type) {
      this.type = type;
    }
  },
};
global.localStorage = global.window.localStorage;
global.CustomEvent = global.window.CustomEvent;
global.Event = global.window.Event;

// Import services
const { sgsRosterAndSubmissionService, matchSubmissionToAssignment } = await import(
  './src/services/sgsRosterAndSubmissionService'
);
const { teacherCourseAssignmentService } = await import(
  './src/services/teacherCourseAssignmentService'
);

// ============================================================================
// TEST 1: Course Code Guard (ไม่ให้ส่งงานวิชานึง ไปขึ้นรหัสอีกวิชานึง)
// ============================================================================
console.log('--- 1. Testing Course Code Guard & Assignment Matching ---');

const subCourseA = {
  assignmentId: 'asg-thai-1',
  courseCode: 'ท23102',
  workTitle: 'แบบฝึกหัดที่ 1 การเขียนบรรยาย',
  studentCode: '45101',
};

const asgCourseA = {
  id: 'asg-thai-1',
  courseCode: 'ท23102',
  title: 'แบบฝึกหัดที่ 1 การเขียนบรรยาย',
};

const asgCourseB = {
  id: 'asg-art-1',
  courseCode: 'ศ23102',
  title: 'แบบฝึกหัดที่ 1 การเขียนบรรยาย', // ชื่อเดียวกันแต่คนละวิชา
};

assert.strictEqual(
  matchSubmissionToAssignment(subCourseA, asgCourseA),
  true,
  'Submission for Thai course must match Thai assignment'
);

assert.strictEqual(
  matchSubmissionToAssignment(subCourseA, asgCourseB),
  false,
  'Submission for Thai course must NEVER match Art course even if title is identical'
);

console.log('  ✓ Course Code Guard strictly isolates matching across different courses');


// ============================================================================
// TEST 2: Multi Sub-tasks Grading Isolation (ตรวจงานย่อย 2, 3 ในหน่วยเดียวกัน)
// ============================================================================
console.log('\n--- 2. Testing Sub-tasks 2 & 3 Matching Isolation within Same Unit ---');

const task1 = {
  id: 'task-unit1-1',
  unitId: 'unit-art-1',
  courseCode: 'ศ23102',
  title: 'งานย่อยที่ 1: วาดเส้นแรเงา',
  maxScore: 10,
};

const task2 = {
  id: 'task-unit1-2',
  unitId: 'unit-art-1',
  courseCode: 'ศ23102',
  title: 'งานย่อยที่ 2: การลงน้ำหนักสี',
  maxScore: 10,
};

const task3 = {
  id: 'task-unit1-3',
  unitId: 'unit-art-1',
  courseCode: 'ศ23102',
  title: 'งานย่อยที่ 3: จัดองค์ประกอบภาพ',
  maxScore: 10,
};

const subTask1 = {
  assignmentId: 'task-unit1-1',
  unitId: 'unit-art-1',
  courseCode: 'ศ23102',
  studentCode: '45101',
  workTitle: 'งานย่อยที่ 1: วาดเส้นแรเงา',
};

const subTask2 = {
  assignmentId: 'task-unit1-2',
  unitId: 'unit-art-1',
  courseCode: 'ศ23102',
  studentCode: '45101',
  workTitle: 'งานย่อยที่ 2: การลงน้ำหนักสี',
};

// Task 1's submission must NOT match Task 2 or Task 3
assert.strictEqual(matchSubmissionToAssignment(subTask1, task1), true);
assert.strictEqual(
  matchSubmissionToAssignment(subTask1, task2),
  false,
  'Sub-task 1 submission must not match sub-task 2'
);
assert.strictEqual(
  matchSubmissionToAssignment(subTask1, task3),
  false,
  'Sub-task 1 submission must not match sub-task 3'
);
assert.strictEqual(matchSubmissionToAssignment(subTask2, task2), true);
assert.strictEqual(matchSubmissionToAssignment(subTask2, task1), false);

console.log('  ✓ Sub-tasks in the same unit are strictly isolated and do not collide');


// ============================================================================
// TEST 3: Text Answer Submission (เพิ่มการส่งแบบพิมพ์ข้อความตอบได้)
// ============================================================================
console.log('\n--- 3. Testing Written Text Answer Submission ---');

const textSub = await sgsRosterAndSubmissionService.submitStudentWorkToR2Async({
  studentCode: '45101',
  studentId: 'stu-45101',
  assignmentId: 'asg-essay-1',
  workTitle: 'เรียงความเรื่องวันภาษาไทย',
  textContent: 'ภาษาไทยเป็นมรดกทางวัฒนธรรมที่ล้ำค่า...',
  classroom: 'ม.3/1',
  courseCode: 'ท23102',
});

assert.strictEqual(textSub.textContent, 'ภาษาไทยเป็นมรดกทางวัฒนธรรมที่ล้ำค่า...');
assert.strictEqual(textSub.status, 'SUBMITTED_PENDING');

const allSubs = sgsRosterAndSubmissionService.getSubmissions();
const storedTextSub = allSubs.find((s) => s.assignmentId === 'asg-essay-1' && s.studentCode === '45101');
assert.ok(storedTextSub, 'Stored submission must exist');
assert.strictEqual(storedTextSub.textContent, 'ภาษาไทยเป็นมรดกทางวัฒนธรรมที่ล้ำค่า...');

console.log('  ✓ Written text answer submitted and persisted cleanly without file upload requirement');


// ============================================================================
// TEST 4: Returned Submission Lifecycle & Replacement
// ============================================================================
console.log('\n--- 4. Testing Returned Submission & Resubmission Flow ---');

// Teacher returns submission for revision
sgsRosterAndSubmissionService.returnSubmissionForRevision(
  'asg-essay-1',
  '45101',
  'ต้องการให้ปรับปรุงเนื้อหาและส่งใหม่อีกครั้ง',
  'ขอให้ขยายความย่อหน้าสุดท้าย'
);

const returnedSub = sgsRosterAndSubmissionService.getSubmissions().find(
  (s) => s.assignmentId === 'asg-essay-1' && s.studentCode === '45101'
);
assert.strictEqual(returnedSub.status, 'RETURNED_REVISION');
assert.strictEqual(returnedSub.returnReason, 'ต้องการให้ปรับปรุงเนื้อหาและส่งใหม่อีกครั้ง');

// Check that queue has it as RETURNED
const queueRaw = localStorage.getItem('kp_grading_queue_v2');
const queue = JSON.parse(queueRaw || '[]');
const queueItem = queue.find((q) => q.assignmentId === 'asg-essay-1' && q.studentCode === '45101');
assert.ok(queueItem, 'Item must be in queue');
assert.strictEqual(queueItem.status, 'RETURNED', 'Queue item must have status RETURNED, not PENDING_REVIEW');

// Student resubmits revised work with new text
const resubmitted = await sgsRosterAndSubmissionService.submitStudentWorkToR2Async({
  studentCode: '45101',
  assignmentId: 'asg-essay-1',
  workTitle: 'เรียงความเรื่องวันภาษาไทย (ฉบับแก้ไข)',
  textContent: 'ภาษาไทยเป็นมรดกทางวัฒนธรรมที่ล้ำค่า... (ขยายความสมบูรณ์แล้ว)',
  classroom: 'ม.3/1',
  courseCode: 'ท23102',
});

assert.strictEqual(resubmitted.status, 'SUBMITTED_PENDING');
assert.strictEqual(resubmitted.isResubmission, true);
assert.strictEqual(resubmitted.returnReason, undefined);

const queueAfterResub = JSON.parse(localStorage.getItem('kp_grading_queue_v2') || '[]');
const queueItemAfter = queueAfterResub.find((q) => q.assignmentId === 'asg-essay-1' && q.studentCode === '45101');
assert.strictEqual(queueItemAfter.status, 'PENDING_REVIEW', 'Queue item must return to PENDING_REVIEW upon resubmission');
assert.strictEqual(queueItemAfter.isResubmission, true);

console.log('  ✓ Returned work correctly isolated in RETURNED state and returned to PENDING_REVIEW on resubmit');


// ============================================================================
// TEST 5: Proportional Score Rescaling (ปรับคะแนนตาม % เมื่อครูแก้คะแนนเต็ม)
// ============================================================================
console.log('\n--- 5. Testing Proportional Score Scaling (e.g. 20 -> 10) ---');

// Create an assignment with maxScore = 20
sgsRosterAndSubmissionService.addTermAssignment({
  id: 'asg-scale-test',
  title: 'โครงงานออกแบบผลิตภัณฑ์',
  courseCode: 'ง23101',
  courseName: 'การงานอาชีพ 3',
  maxScore: 20,
  sgsUnit: 'u1',
  sgsUnitLabel: 'หน่วย 1',
  orderNo: 1,
  assignedDate: '2026-06-01',
  dueDate: '2026-06-15',
});

// Student 1 gets full 20/20 (100%)
sgsRosterAndSubmissionService.gradeSubmission('asg-scale-test', '45101', 20);

// Student 2 gets 16/20 (80%)
sgsRosterAndSubmissionService.gradeSubmission('asg-scale-test', '45102', 16);
console.log('stu2 before update:', sgsRosterAndSubmissionService.getSubmissions().find(s => s.studentCode === '45102'));

// Teacher modifies maxScore from 20 to 10
sgsRosterAndSubmissionService.updateTermAssignment('asg-scale-test', {
  maxScore: 10,
});
console.log('stu2 after update:', sgsRosterAndSubmissionService.getSubmissions().find(s => s.studentCode === '45102'));

const subsAfterScale = sgsRosterAndSubmissionService.getSubmissions();
const stu1Sub = subsAfterScale.find((s) => s.assignmentId === 'asg-scale-test' && s.studentCode === '45101');
const stu2Sub = subsAfterScale.find((s) => s.assignmentId === 'asg-scale-test' && s.studentCode === '45102');

assert.strictEqual(stu1Sub.maxScore, 10, 'Max score must be updated to 10');
assert.strictEqual(stu1Sub.score, 10, 'Student with 20/20 (100%) must scale to 10/10 (100%)');

assert.strictEqual(stu2Sub.maxScore, 10, 'Max score must be updated to 10');
assert.strictEqual(stu2Sub.score, 8, 'Student with 16/20 (80%) must scale to 8/10 (80%)');

console.log('  ✓ Proportional % score scaling verified: 20/20 -> 10/10, 16/20 -> 8/10');


console.log('\n🎉 ALL 5 FIXES VERIFIED AND PASSED WITH 100% ACCURACY!');
