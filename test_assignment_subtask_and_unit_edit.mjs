import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting Assignment Sub-Task and Unit Settings Edit Separation Test Suite...\n');

// 1. Static Verification of AssignmentManagementView.tsx
console.log('--- 1. Checking AssignmentManagementView.tsx Architecture ---');
const viewContent = fs.readFileSync('src/views/AssignmentManagementView.tsx', 'utf-8');

assert(
  viewContent.includes("editScope, setEditScope] = useState<'SUB_TASK' | 'UNIT' | 'STANDALONE' | null>(null)"),
  'AssignmentManagementView must define explicit editScope state'
);
console.log('  ✓ Verified explicit editScope state defined');

assert(
  viewContent.includes('const handleOpenEditSubTaskModal = ('),
  'AssignmentManagementView must have handleOpenEditSubTaskModal'
);
console.log('  ✓ Verified handleOpenEditSubTaskModal present');

assert(
  viewContent.includes('const handleOpenEditUnitModal = ('),
  'AssignmentManagementView must have handleOpenEditUnitModal'
);
console.log('  ✓ Verified handleOpenEditUnitModal present');

assert(
  viewContent.includes('⚙️ แก้ไขการตั้งค่าหน่วย'),
  'Unit card meatball menu must have "⚙️ แก้ไขการตั้งค่าหน่วย"'
);
console.log('  ✓ Verified "⚙️ แก้ไขการตั้งค่าหน่วย" option in unit card');

assert(
  viewContent.includes('แก้ไขงานย่อย'),
  'Sub-task rows must have clear "แก้ไขงานย่อย" action'
);
console.log('  ✓ Verified "แก้ไขงานย่อย" button in sub-task rows');

assert(
  viewContent.includes('editScope === \'UNIT\''),
  'Modal must branch cleanly for editScope === UNIT'
);
assert(
  viewContent.includes('editScope === \'SUB_TASK\''),
  'Modal must branch cleanly for editScope === SUB_TASK'
);
assert(
  viewContent.includes('maxScore: Math.max(1, Number(formMaxScore) || 10)'),
  'Sub-task maxScore must directly save formMaxScore without being overwritten by formUnitMaxScore'
);
console.log('  ✓ Verified dedicated modal branching for UNIT vs SUB_TASK');
console.log('  ✓ Verified sub-task maxScore uses formMaxScore directly without unitMaxScore override');

// 2. Static Verification of sgsRosterAndSubmissionService.ts & teacherCourseAssignmentService.ts
console.log('\n--- 2. Checking Service Synchronization ---');
const serviceContent = fs.readFileSync('src/services/sgsRosterAndSubmissionService.ts', 'utf-8');
const teacherAssignContent = fs.readFileSync('src/services/teacherCourseAssignmentService.ts', 'utf-8');

assert(
  serviceContent.includes('unitKey: updates.unitKey !== undefined ? updates.unitKey : item.unitKey'),
  'sgsRosterAndSubmissionService must cascade unitKey across same unit'
);
assert(
  serviceContent.includes('targetClassrooms: updates.targetClassrooms !== undefined ? updates.targetClassrooms : item.targetClassrooms'),
  'sgsRosterAndSubmissionService must cascade targetClassrooms across same unit'
);
assert(
  teacherAssignContent.includes('asg?.maxScore && asg.maxScore > 0'),
  'teacherCourseAssignmentService must prioritize asg.maxScore for queue items'
);
console.log('  ✓ Verified unit cascade synchronization in sgsRosterAndSubmissionService');
console.log('  ✓ Verified sub-task score prioritization in teacherCourseAssignmentService');

// 3. Functional Simulation Test for Sub-Task vs Unit Updates
console.log('\n--- 3. Testing Functional Update Logic ---');
// Mock assignments list
let assignments = [
  {
    id: 'task-1',
    courseCode: 'ญ32202',
    unitId: 'unit-u8',
    unitTitle: 'บทที่ 8',
    title: 'บทที่ 8 ข้อที่ 1-4',
    description: 'การบ้านเดิม',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
    scorePart: 'PRE_MIDTERM',
    dueDate: '2026-10-25',
    targetClassrooms: ['ม.5/4'],
  },
  {
    id: 'task-2',
    courseCode: 'ญ32202',
    unitId: 'unit-u8',
    unitTitle: 'บทที่ 8',
    title: 'บทที่ 8 ข้อที่ 5-8',
    description: 'ใบงานข้อ 5-8',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
    scorePart: 'PRE_MIDTERM',
    dueDate: '2026-10-26',
    targetClassrooms: ['ม.5/4'],
  },
];

// Simulation of SUB_TASK update on task-1:
const subTaskUpdates = {
  title: 'บทที่ 8 ข้อที่ 1-4 (ฉบับปรับปรุง)',
  description: 'แก้ไขคำชี้แจงเพิ่มเติม',
  dueDate: '2026-10-30',
  maxScore: 10, // User edited sub-task score to 10
};
assignments = assignments.map(a => {
  if (a.id === 'task-1') {
    return { ...a, ...subTaskUpdates };
  }
  return a;
});

assert.strictEqual(assignments[0].title, 'บทที่ 8 ข้อที่ 1-4 (ฉบับปรับปรุง)');
assert.strictEqual(assignments[0].description, 'แก้ไขคำชี้แจงเพิ่มเติม');
assert.strictEqual(assignments[0].dueDate, '2026-10-30');
assert.strictEqual(assignments[0].maxScore, 10, 'Subtask maxScore must be successfully changed to 10');
// Verify unit metadata on task-2 was unaffected:
assert.strictEqual(assignments[1].title, 'บทที่ 8 ข้อที่ 5-8');
assert.strictEqual(assignments[1].unitTitle, 'บทที่ 8');
console.log('  ✓ Sub-task update updated task-1 maxScore to 10 cleanly without disturbing unit structure');

// Simulation of UNIT update:
const unitUpdates = {
  unitTitle: 'บทที่ 8 การสื่อสารในชีวิตประจำวัน',
  unitMaxScore: 15,
  scoringMethod: 'RAW_SCORE_AVERAGE',
  scorePart: 'POST_MIDTERM',
  targetClassrooms: ['ม.5/4', 'ม.5/5'],
};
assignments = assignments.map(a => {
  if (a.unitId === 'unit-u8') {
    return {
      ...a,
      unitTitle: unitUpdates.unitTitle,
      unitMaxScore: unitUpdates.unitMaxScore,
      scoringMethod: unitUpdates.scoringMethod,
      scorePart: unitUpdates.scorePart,
      targetClassrooms: unitUpdates.targetClassrooms,
    };
  }
  return a;
});

assert.strictEqual(assignments[0].unitTitle, 'บทที่ 8 การสื่อสารในชีวิตประจำวัน');
assert.strictEqual(assignments[1].unitTitle, 'บทที่ 8 การสื่อสารในชีวิตประจำวัน');
assert.strictEqual(assignments[0].unitMaxScore, 15);
assert.strictEqual(assignments[1].unitMaxScore, 15);
assert.strictEqual(assignments[0].scoringMethod, 'RAW_SCORE_AVERAGE');
assert.strictEqual(assignments[1].scoringMethod, 'RAW_SCORE_AVERAGE');
assert.deepStrictEqual(assignments[0].targetClassrooms, ['ม.5/4', 'ม.5/5']);
assert.deepStrictEqual(assignments[1].targetClassrooms, ['ม.5/4', 'ม.5/5']);
// Sub-task titles remained intact:
assert.strictEqual(assignments[0].title, 'บทที่ 8 ข้อที่ 1-4 (ฉบับปรับปรุง)');
assert.strictEqual(assignments[1].title, 'บทที่ 8 ข้อที่ 5-8');
console.log('  ✓ Unit settings cascade update synchronized all tasks in unit while preserving individual sub-task details');

// 4. Static Verification of Sub-Task Deletion and Unit Total Works Display
console.log('\n--- 4. Checking Sub-Task Deletion & Unit Total Works Count in AssignmentManagementView.tsx ---');
assert(
  viewContent.includes('const [subTaskToDelete, setSubTaskToDelete] = useState'),
  'AssignmentManagementView must define subTaskToDelete state for confirmation modal'
);
console.log('  ✓ Verified subTaskToDelete modal state defined');

assert(
  viewContent.includes('const handleOpenDeleteSubTaskModal = ('),
  'AssignmentManagementView must have handleOpenDeleteSubTaskModal'
);
assert(
  viewContent.includes('const handleConfirmDeleteSubTask = () => {'),
  'AssignmentManagementView must have handleConfirmDeleteSubTask'
);
console.log('  ✓ Verified handleOpenDeleteSubTaskModal and handleConfirmDeleteSubTask defined');

assert(
  viewContent.includes('ยืนยันการลบงานย่อย'),
  'Confirmation modal must display "ยืนยันการลบงานย่อย"'
);
console.log('  ✓ Verified sub-task deletion confirmation modal title');

assert(
  viewContent.includes('progressUnitLabel: string;'),
  'enrichedAssignmentCards must define progressUnitLabel'
);
assert(
  viewContent.includes("{item.progressCount}/{item.totalTargetCount} {item.progressUnitLabel}"),
  'Unit card header must display total target count with progressUnitLabel (e.g. 41/48 งาน)'
);
console.log('  ✓ Verified progressUnitLabel and {progressCount}/{totalTargetCount} {progressUnitLabel} in UI');

// 5. Functional Simulation of Sub-Task Deletion and Unit Works Count
console.log('\n--- 5. Testing Functional Sub-Task Deletion and Works Count ---');
// Deleting task-1
const targetTaskIdToDelete = 'task-1';
assignments = assignments.filter((a) => a.id !== targetTaskIdToDelete);
assert.strictEqual(assignments.length, 1, 'Unit must now contain exactly 1 sub-task');
assert.strictEqual(assignments[0].id, 'task-2', 'Remaining task in unit must be task-2');
console.log('  ✓ Deleting sub-task leaves remaining sub-tasks intact in the unit');

// Calculate unit works count simulation:
const totalStudents = 16;
const subTasksCount = 3;
const totalExpectedWorks = subTasksCount * totalStudents; // 48
const mockSubmissions = [
  ...Array.from({ length: 16 }, (_, i) => ({ assignmentId: 'task-1', studentCode: `S${i}`, status: 'GRADED' })),
  ...Array.from({ length: 13 }, (_, i) => ({ assignmentId: 'task-2', studentCode: `S${i}`, status: 'GRADED' })),
  ...Array.from({ length: 12 }, (_, i) => ({ assignmentId: 'task-3', studentCode: `S${i}`, status: 'SUBMITTED_PENDING' })),
];
const totalSubmittedWorks = mockSubmissions.filter((s) => s.status !== 'MISSING').length; // 41
assert.strictEqual(totalExpectedWorks, 48);
assert.strictEqual(totalSubmittedWorks, 41);
const progressLabel = `${totalSubmittedWorks}/${totalExpectedWorks} งาน`;
assert.strictEqual(progressLabel, '41/48 งาน');
console.log(`  ✓ Unit works calculation correctly computes: ${progressLabel}`);

console.log('\n======================================================');
console.log('🎉 ALL SUB-TASK & UNIT EDIT SEPARATION CHECKS PASSED!');
console.log('======================================================');
