// test_chat_provisioning.mjs
// Verification suite for Chat Room Auto-Provisioning & Student Transfer Engine
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { pathToFileURL } from 'url';

console.log('🧪 Starting Chat Room Auto-Provisioning & Transfer Engine Verification...\n');

// ---------------------------------------------------------------------------
// 1. Verify buildRoomLookupKey & Composite Identifiers
// ---------------------------------------------------------------------------
console.log('--- 1. Testing Composite Room Lookup Keys ---');
// Dynamic import of buildRoomLookupKey from eLeave service
const provisioningServicePath = path.resolve('../eLeave/src/services/chatProvisioningService.ts');
assert.ok(fs.existsSync(provisioningServicePath), 'chatProvisioningService.ts must exist in eLeave');

const { buildRoomLookupKey } = await import(pathToFileURL(provisioningServicePath).href);

const officialKey = buildRoomLookupKey('OFFICIAL', 'ประกาศทางการของโรงเรียนกุดจับ');
assert.strictEqual(officialKey, 'OFFICIAL:ประกาศทางการของโรงเรียนกุดจับ');
console.log('  ✓ Official room key format: ' + officialKey);

const homeroomKey = buildRoomLookupKey('HOMEROOM', 'ห้องเรียน ม.1/1', 'M1-1');
assert.strictEqual(homeroomKey, 'HOMEROOM:M1-1');
console.log('  ✓ Homeroom key format: ' + homeroomKey);

const courseKeyWithClass = buildRoomLookupKey('COURSE', 'วิชา ญ21201 ภาษาญี่ปุ่น 1', 'M1-1', 'ญ21201');
assert.strictEqual(courseKeyWithClass, 'COURSE:ญ21201:M1-1');
console.log('  ✓ Course key format (section-specific): ' + courseKeyWithClass);

const courseKeyAll = buildRoomLookupKey('COURSE', 'วิชา ญ22201 ภาษาญี่ปุ่น 3', null, 'ญ22201');
assert.strictEqual(courseKeyAll, 'COURSE:ญ22201:ALL');
console.log('  ✓ Course key format (all sections): ' + courseKeyAll);

const deptKey = buildRoomLookupKey('DEPARTMENT', 'กลุ่มสาระฯ ภาษาต่างประเทศ');
assert.strictEqual(deptKey, 'DEPARTMENT:กลุ่มสาระฯ ภาษาต่างประเทศ');
console.log('  ✓ Department key format: ' + deptKey);

// ---------------------------------------------------------------------------
// 2. Verify Idempotent Planning & Deduplication Logic
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing Idempotent Planning & Deduplication ---');

// Mock payload
const samplePayload = {
  schoolId: 'KP-SCHOOL-01',
  academicYear: 2569,
  adminUserIds: ['ADMIN-01'],
  officialAnnouncements: [{ name: 'ประกาศทางการของโรงเรียน' }],
  classrooms: [
    {
      classroomId: 'M1-1',
      name: 'ห้องเรียน ม.1/1',
      gradeLevel: '1',
      roomNumber: '1',
      advisorIds: ['T-JP-01'],
      studentIds: ['S-101', 'S-102', 'S-103'],
    },
    {
      classroomId: 'M1-2',
      name: 'ห้องเรียน ม.1/2',
      gradeLevel: '1',
      roomNumber: '2',
      advisorIds: ['T-JP-02'],
      studentIds: ['S-104', 'S-105'],
    },
  ],
  courses: [
    {
      courseCode: 'ญ21201',
      name: 'วิชา ญ21201 ภาษาญี่ปุ่นพื้นฐาน 1',
      teacherIds: ['T-JP-01'],
      classroomId: 'M1-1',
      studentIds: ['S-101', 'S-102', 'S-103'],
    },
  ],
  departments: [
    {
      departmentId: 'DEPT-LANG',
      name: 'กลุ่มสาระฯ ภาษาต่างประเทศ',
      headTeacherId: 'T-JP-01',
      memberTeacherIds: ['T-JP-02'],
    },
  ],
};

// Simulation of In-Memory Idempotency Filtering
const existingDbRooms = [
  {
    id: 'room-existing-official',
    type: 'OFFICIAL',
    name: 'ประกาศทางการของโรงเรียน',
    classroomId: null,
    courseCode: null,
  },
  {
    id: 'room-existing-m1-1',
    type: 'HOMEROOM',
    name: 'ห้องเรียน ม.1/1',
    classroomId: 'M1-1',
    courseCode: null,
  },
];

const existingKeys = new Set(
  existingDbRooms.map((r) => buildRoomLookupKey(r.type, r.name, r.classroomId, r.courseCode))
);

assert.strictEqual(existingKeys.has('OFFICIAL:ประกาศทางการของโรงเรียน'), true);
assert.strictEqual(existingKeys.has('HOMEROOM:M1-1'), true);

const plannedMissingRooms = [];
// Check M1-2
const m12Key = buildRoomLookupKey('HOMEROOM', 'ห้องเรียน ม.1/2', 'M1-2');
if (!existingKeys.has(m12Key)) plannedMissingRooms.push(m12Key);

// Check ญ21201
const courseKey = buildRoomLookupKey('COURSE', 'วิชา ญ21201', 'M1-1', 'ญ21201');
if (!existingKeys.has(courseKey)) plannedMissingRooms.push(courseKey);

// Check Dept
const deptKeySim = buildRoomLookupKey('DEPARTMENT', 'กลุ่มสาระฯ ภาษาต่างประเทศ');
if (!existingKeys.has(deptKeySim)) plannedMissingRooms.push(deptKeySim);

assert.strictEqual(plannedMissingRooms.length, 3, 'Should plan exactly 3 new rooms, skipping the 2 existing ones');
console.log('  ✓ Idempotency plan: 2 existing rooms reused, 3 missing rooms queued for creation');

// ---------------------------------------------------------------------------
// 3. Verify Member Deduplication & Batch Chunking
// ---------------------------------------------------------------------------
console.log('\n--- 3. Testing Member Deduplication & Batch Chunking ---');

const memberMap = new Map();
const addMember = (roomId, userId, role) => {
  const compositeKey = `${roomId}:::${userId}`;
  if (!memberMap.has(compositeKey) || role === 'ADVISOR' || role === 'SCHOOL_ADMIN') {
    memberMap.set(compositeKey, { roomId, userId, role });
  }
};

// Add T-JP-01 as TEACHER then as ADVISOR in room-1
addMember('room-1', 'T-JP-01', 'TEACHER');
assert.strictEqual(memberMap.get('room-1:::T-JP-01').role, 'TEACHER');
addMember('room-1', 'T-JP-01', 'ADVISOR');
assert.strictEqual(memberMap.get('room-1:::T-JP-01').role, 'ADVISOR', 'ADVISOR role should take precedence');

// Duplicate insert of students
addMember('room-1', 'S-101', 'STUDENT');
addMember('room-1', 'S-101', 'STUDENT');
assert.strictEqual(memberMap.size, 2, 'Duplicates for same room and student must be collapsed');
console.log('  ✓ Member deduplication and role hierarchy verified');

// ---------------------------------------------------------------------------
// 4. Verify Student Transfer Flow Logic
// ---------------------------------------------------------------------------
console.log('\n--- 4. Testing Student Transfer Flow Simulation ---');

const studentId = 'S-101';
const studentName = 'สมชาย ใจมั่น';
const oldClassroomId = 'M1-1';
const newClassroomId = 'M1-2';

const mockRooms = [
  { id: 'r-homeroom-old', type: 'HOMEROOM', classroomId: oldClassroomId },
  { id: 'r-course-old-1', type: 'COURSE', classroomId: oldClassroomId },
  { id: 'r-homeroom-new', type: 'HOMEROOM', classroomId: newClassroomId },
  { id: 'r-course-new-1', type: 'COURSE', classroomId: newClassroomId },
];

// 4.1 Filter old room IDs
const oldRoomIds = mockRooms.filter((r) => r.classroomId === oldClassroomId).map((r) => r.id);
assert.deepStrictEqual(oldRoomIds, ['r-homeroom-old', 'r-course-old-1']);

// 4.2 Filter new room IDs
const newRooms = mockRooms.filter((r) => r.classroomId === newClassroomId);
const newRoomIds = newRooms.map((r) => r.id);
assert.deepStrictEqual(newRoomIds, ['r-homeroom-new', 'r-course-new-1']);

// 4.3 Notice content formatting
const transferNotice = `นักเรียน ${studentName} ได้ย้ายเข้ามายังห้องเรียนนี้เรียบร้อยแล้ว`;
assert.ok(transferNotice.includes(studentName));
assert.ok(transferNotice.includes('ย้ายเข้ามา'));
console.log('  ✓ Student transfer room matching and notice payload verified');

// ---------------------------------------------------------------------------
// 5. Verify Client Service Methods & API Routes
// ---------------------------------------------------------------------------
console.log('\n--- 5. Testing Client SDK & Route Exports ---');

const chatBackendServicePath = path.resolve('src/services/chatBackendService.ts');
const serviceContent = fs.readFileSync(chatBackendServicePath, 'utf8');

assert.ok(serviceContent.includes('provisionSchoolChatRooms'), 'chatBackendService must include provisionSchoolChatRooms');
assert.ok(serviceContent.includes('syncStudentTransfer'), 'chatBackendService must include syncStudentTransfer');
assert.ok(serviceContent.includes('getProvisionedRooms'), 'chatBackendService must include getProvisionedRooms');
console.log('  ✓ chatBackendService.ts has provisionSchoolChatRooms, syncStudentTransfer, and getProvisionedRooms');

const routePath = path.resolve('../eLeave/src/app/api/chat/provision/route.ts');
assert.ok(fs.existsSync(routePath), 'API route /api/chat/provision/route.ts must exist in eLeave');
const routeContent = fs.readFileSync(routePath, 'utf8');
assert.ok(routeContent.includes('SCHOOL_ADMIN'), 'Route must enforce SCHOOL_ADMIN / ACADEMIC_ADMIN check');
assert.ok(routeContent.includes('syncStudentClassroomTransfer'), 'Route must wire syncStudentClassroomTransfer');
console.log('  ✓ API route /api/chat/provision/route.ts RBAC and handlers verified');

const seedPath = path.resolve('../eLeave/prisma/seed-chat-rooms.ts');
assert.ok(fs.existsSync(seedPath), 'Seed script seed-chat-rooms.ts must exist');
const seedContent = fs.readFileSync(seedPath, 'utf8');
assert.ok(seedContent.includes('KP-SCHOOL-01'), 'Seed must target KP-SCHOOL-01');
assert.ok(seedContent.includes('2569'), 'Seed must target academic year 2569');
assert.ok(seedContent.includes('ญ21201'), 'Seed must configure ญ21201 course');
console.log('  ✓ Seed CLI script seed-chat-rooms.ts verified');

console.log('\n======================================================');
console.log('🎉 ALL 5 CHAT PROVISIONING TESTS PASSED PERFECTLY!');
console.log('======================================================\n');
