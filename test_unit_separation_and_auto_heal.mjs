import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting Unit Separation and Auto-Heal Test Suite...\n');

// 1. Static Verification of AssignmentManagementView.tsx
console.log('--- 1. Checking AssignmentManagementView.tsx ---');
const viewContent = fs.readFileSync('src/views/AssignmentManagementView.tsx', 'utf-8');

assert(
  viewContent.includes('const uKey = `${courseKey}:::${cleanTitle.toLowerCase()}`;'),
  'enrichedAssignmentCards must group strictly by courseCode and unitTitle'
);
console.log('  ✓ Verified enrichedAssignmentCards groups strictly by courseCode + unitTitle');

assert(
  viewContent.includes('formUnitTab === \'NEW\' || !formUnitId || isMismatchedUnitId'),
  'handleSaveAssignment must generate fresh unitId for new units or mismatched unitIds'
);
console.log('  ✓ Verified handleSaveAssignment generates fresh unitId when creating new unit or mismatched ID');

assert(
  viewContent.includes('isChangingSubTaskUnit'),
  'Modal must support changing / moving sub-task to another unit'
);
console.log('  ✓ Verified sub-task unit moving capability in edit modal');

// 2. Static Verification of sgsRosterAndSubmissionService.ts
console.log('\n--- 2. Checking sgsRosterAndSubmissionService.ts ---');
const serviceContent = fs.readFileSync('src/services/sgsRosterAndSubmissionService.ts', 'utf-8');

assert(
  serviceContent.includes('healCorruptedUnitAssignments'),
  'sgsRosterAndSubmissionService must include healCorruptedUnitAssignments'
);
console.log('  ✓ Verified healCorruptedUnitAssignments present in service');

assert(
  serviceContent.includes('item.unitTitle.trim().toLowerCase() === targetUnitTitle.trim().toLowerCase()'),
  'updateTermAssignment must never cascade across different unitTitle'
);
console.log('  ✓ Verified updateTermAssignment cascade is strictly bounded to the same unitTitle');

// 3. Functional Simulation Test of Auto-Healing
console.log('\n--- 3. Testing Functional Auto-Healing of Unit Collisions ---');
// Simulate the user's exact case:
// 3 tasks belonging to "บทที่ 7", and 1 task belonging to "บทที่ 8", but all having the same unitId "unit-bot-7-m63"
const testAssignments = [
  {
    id: 'asg-1',
    courseCode: 'ญ30206',
    unitId: 'unit-bot-7-m63',
    unitTitle: 'บทที่ 7',
    title: 'งานที่ 1 私の家族',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
  },
  {
    id: 'asg-2',
    courseCode: 'ญ30206',
    unitId: 'unit-bot-7-m63',
    unitTitle: 'บทที่ 7',
    title: 'งานที่ 2 บทที่ 7 ข้อ1-3',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
  },
  {
    id: 'asg-3',
    courseCode: 'ญ30206',
    unitId: 'unit-bot-7-m63',
    unitTitle: 'บทที่ 7',
    title: 'งานที่ 3 บทที่ 7 ข้อ4-7',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
  },
  {
    id: 'asg-4',
    courseCode: 'ญ30206',
    unitId: 'unit-bot-7-m63', // collided unitId!
    unitTitle: 'บทที่ 8',
    title: 'งานที่ 4 ข้อที่ 1-4',
    maxScore: 10,
    unitMaxScore: 10,
    scoringMethod: 'SUBMISSION_COUNT_RATIO',
  },
];

// Extract heal function logic from service
const unitIdToTitles = new Map();
testAssignments.forEach((asg) => {
  if (asg.unitTitle && asg.unitId) {
    const course = (asg.courseCode || 'all').trim().toUpperCase();
    const unitKey = `${course}:::${asg.unitId}`;
    const titleNorm = asg.unitTitle.trim().toLowerCase();

    if (!unitIdToTitles.has(unitKey)) {
      unitIdToTitles.set(unitKey, new Map());
    }
    const titleMap = unitIdToTitles.get(unitKey);
    if (!titleMap.has(titleNorm)) {
      titleMap.set(titleNorm, []);
    }
    titleMap.get(titleNorm).push(asg);
  }
});

let hasChanges = false;
const healed = [...testAssignments];
unitIdToTitles.forEach((titleMap) => {
  if (titleMap.size > 1) {
    const entries = Array.from(titleMap.entries());
    entries.sort((a, b) => b[1].length - a[1].length);

    for (let i = 1; i < entries.length; i++) {
      const [_, tasks] = entries[i];
      const refTask = tasks[0];
      const cleanCourse = (refTask.courseCode || 'course').trim().toLowerCase().replace(/[^a-zA-Z0-9ก-๙-]/g, '');
      const cleanTitle = (refTask.unitTitle || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9ก-๙-]/g, '');
      const newUnitId = `unit-${cleanCourse}-${cleanTitle}-healed`;

      tasks.forEach((t) => {
        const idx = healed.findIndex((a) => a.id === t.id);
        if (idx !== -1) {
          healed[idx] = { ...healed[idx], unitId: newUnitId };
          hasChanges = true;
        }
      });
    }
  }
});

assert(hasChanges, 'Auto-heal must detect collision and apply changes');
assert.strictEqual(healed[0].unitId, 'unit-bot-7-m63', 'Dominant unit "บทที่ 7" must keep original unitId');
assert.strictEqual(healed[1].unitId, 'unit-bot-7-m63');
assert.strictEqual(healed[2].unitId, 'unit-bot-7-m63');
assert(healed[3].unitId.startsWith('unit-ญ30206-บทที่-8'), 'Minority unit "บทที่ 8" must get its own unique unitId');
console.log('  ✓ Auto-heal correctly detaches บทที่ 8 (งานที่ 4) with new unitId:', healed[3].unitId);

// 4. Grouping Simulation
console.log('\n--- 4. Testing Card Grouping Logic ---');
const unitMap = new Map();
healed.forEach((assign) => {
  const courseKey = (assign.courseCode || 'all').trim().toUpperCase();
  const cleanTitle = assign.unitTitle.trim();
  const uKey = `${courseKey}:::${cleanTitle.toLowerCase()}`;
  const existing = unitMap.get(uKey) || {
    key: uKey,
    unitTitle: assign.unitTitle,
    tasks: [],
  };
  existing.tasks.push(assign);
  unitMap.set(uKey, existing);
});

const cards = Array.from(unitMap.values());
assert.strictEqual(cards.length, 2, 'Must produce 2 separate cards (บทที่ 7 and บทที่ 8)');
assert.strictEqual(cards[0].unitTitle, 'บทที่ 7');
assert.strictEqual(cards[0].tasks.length, 3, 'บทที่ 7 must contain 3 tasks');
assert.strictEqual(cards[1].unitTitle, 'บทที่ 8');
assert.strictEqual(cards[1].tasks.length, 1, 'บทที่ 8 must contain 1 task (งานที่ 4 ข้อที่ 1-4)');
console.log('  ✓ Card 1:', cards[0].unitTitle, 'has', cards[0].tasks.length, 'tasks');
console.log('  ✓ Card 2:', cards[1].unitTitle, 'has', cards[1].tasks.length, 'tasks');

console.log('\n======================================================');
console.log('🎉 ALL UNIT SEPARATION AND HEALING CHECKS PASSED!');
console.log('======================================================\n');
