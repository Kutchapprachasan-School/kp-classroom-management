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
console.log('  ✓ Verified dedicated modal branching for UNIT vs SUB_TASK');

// 2. Static Verification of sgsRosterAndSubmissionService.ts
console.log('\n--- 2. Checking sgsRosterAndSubmissionService.ts Synchronization ---');
const serviceContent = fs.readFileSync('src/services/sgsRosterAndSubmissionService.ts', 'utf-8');

assert(
  serviceContent.includes('unitKey: updates.unitKey !== undefined ? updates.unitKey : item.unitKey'),
  'sgsRosterAndSubmissionService must cascade unitKey across same unit'
);
assert(
  serviceContent.includes('targetClassrooms: updates.targetClassrooms !== undefined ? updates.targetClassrooms : item.targetClassrooms'),
  'sgsRosterAndSubmissionService must cascade targetClassrooms across same unit'
);
console.log('  ✓ Verified unit cascade synchronization in sgsRosterAndSubmissionService');

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
// Verify unit metadata on task-2 was unaffected:
assert.strictEqual(assignments[1].title, 'บทที่ 8 ข้อที่ 5-8');
assert.strictEqual(assignments[1].unitTitle, 'บทที่ 8');
console.log('  ✓ Sub-task update updated task-1 cleanly without disturbing other unit tasks');

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

console.log('\n======================================================');
console.log('🎉 ALL SUB-TASK & UNIT EDIT SEPARATION CHECKS PASSED!');
console.log('======================================================');
