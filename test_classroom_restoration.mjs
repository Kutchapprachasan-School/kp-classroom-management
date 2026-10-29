import assert from 'node:assert';
import { classroomService, getLocalClassrooms, INITIAL_SEED_CLASSROOMS } from './src/services/classroomService.ts';
import { getAllAvailableClassroomLabels } from './src/services/teacherCourseAssignmentService.ts';

console.log('🧪 Starting Classroom Roster Restoration & Sync Test Suite...\n');

// 1. Verify INITIAL_SEED_CLASSROOMS has all 36 active classrooms
console.log('--- 1. Checking INITIAL_SEED_CLASSROOMS ---');
assert.strictEqual(
  INITIAL_SEED_CLASSROOMS.length,
  36,
  `INITIAL_SEED_CLASSROOMS must have all 36 active classrooms, got: ${INITIAL_SEED_CLASSROOMS.length}`
);

const expectedRooms = [
  'ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6', 'ม.1/8',
  'ม.2/1', 'ม.2/2', 'ม.2/3', 'ม.2/4', 'ม.2/5', 'ม.2/6',
  'ม.3/1', 'ม.3/2', 'ม.3/3', 'ม.3/4', 'ม.3/5', 'ม.3/6',
  'ม.4/1', 'ม.4/2', 'ม.4/3', 'ม.4/4', 'ม.4/5',
  'ม.5/1', 'ม.5/2', 'ม.5/3', 'ม.5/4', 'ม.5/5', 'ม.5/6',
  'ม.6/1', 'ม.6/2', 'ม.6/3', 'ม.6/4', 'ม.6/5', 'ม.6/6',
];

const seedNames = new Set(INITIAL_SEED_CLASSROOMS.map((c) => c.name));
expectedRooms.forEach((r) => {
  assert(seedNames.has(r), `Missing room ${r} in INITIAL_SEED_CLASSROOMS`);
});
console.log('  ✓ Verified INITIAL_SEED_CLASSROOMS contains all 36 active classrooms');

// 2. Verify getLocalClassrooms self-healing logic with legacy 12 rooms in localStorage
console.log('\n--- 2. Testing getLocalClassrooms Cache Self-Healing ---');
// Mock localStorage with legacy 12 rooms
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, val),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Simulate legacy 12 rooms in localStorage
const legacy12Rooms = INITIAL_SEED_CLASSROOMS.slice(0, 12);
mockStorage.set('cls_classrooms_data', JSON.stringify(legacy12Rooms));
assert.strictEqual(JSON.parse(mockStorage.get('cls_classrooms_data')).length, 12);

// getLocalClassrooms must detect the incomplete 12 rooms and auto-merge all 36 rooms
const healed = getLocalClassrooms();
assert.strictEqual(
  healed.length,
  36,
  `getLocalClassrooms must heal legacy cache from 12 to 36 rooms, got: ${healed.length}`
);
assert.strictEqual(
  JSON.parse(mockStorage.get('cls_classrooms_data')).length,
  36,
  'localStorage must be updated with all 36 classrooms'
);
console.log('  ✓ Verified getLocalClassrooms auto-healed legacy 12 rooms into full 36 rooms');

// 3. Verify teacherCourseAssignmentService.getAllAvailableClassroomLabels
console.log('\n--- 3. Testing getAllAvailableClassroomLabels ---');
const availableLabels = getAllAvailableClassroomLabels();
assert(availableLabels.includes('ม.5/4'), 'Must include ม.5/4');
assert(availableLabels.includes('ม.2/6'), 'Must include ม.2/6');
assert(availableLabels.includes('ม.6/6'), 'Must include ม.6/6');
assert.strictEqual(availableLabels.length, 36, `Expected 36 labels, got: ${availableLabels.length}`);
console.log(`  ✓ Verified getAllAvailableClassroomLabels returns all 36 active classrooms`);

// 4. Verify classroomService.getAll() returns 36 classrooms
console.log('\n--- 4. Testing classroomService.getAll() ---');
const allRooms = await classroomService.getAll(true);
assert.strictEqual(allRooms.length, 36, `classroomService.getAll() must return 36 rooms, got: ${allRooms.length}`);
console.log(`  ✓ Verified classroomService.getAll() returns 36 classrooms`);

console.log('\n======================================================');
console.log('🎉 ALL 36 CLASSROOMS RESTORATION CHECKS PASSED!');
console.log('======================================================');
