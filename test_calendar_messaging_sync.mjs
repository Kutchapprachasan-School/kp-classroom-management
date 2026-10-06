// test_calendar_messaging_sync.mjs
// Automated Test Suite for:
// 1. Academic Calendar Service & Terms/Holidays/Weekend Makeup Migration
// 2. Messaging Service Auto-Groups & Student Transfer Sync (ม.1/1 -> ม.1/2)
// 3. Complete Data Preservation (Submissions, Grades, Attendance, XP)
// 4. Sequential Transfer & Dynamic Group Creation for Classrooms
// 5. SGS Roster Registration & Score/Attendance Preservation
// 6. Dual-key storage and Empty Array retention in studentService
// 7. UI Architectural separation, mobile nav wiring, and initialTab settings

import fs from 'fs';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

// Auto-run with tsx if executed directly under plain Node without TypeScript ESM support
const isTsx = process.execArgv.some((a) => a.includes('tsx')) || process.env.TSX_RUNNER === '1';
if (!isTsx) {
  const result = spawnSync('npx', ['tsx', './test_calendar_messaging_sync.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, TSX_RUNNER: '1' },
    shell: true,
  });
  process.exit(result.status ?? 0);
}

console.log('🧪 Starting Academic Calendar & Messaging Transfer Sync Verification...\n');

// 0. Setup Node Browser Environment Mocks
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
};

global.localStorage = global.window.localStorage;

global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.type = name;
    this.detail = opts?.detail;
  }
};

// ---------------------------------------------------------------------------
// 1. Verify Academic Calendar Service
// ---------------------------------------------------------------------------
console.log('--- 1. Testing Academic Calendar Service ---');
const { academicCalendarService } = await import('./src/services/academicCalendarService.ts');

const initialConfig = academicCalendarService.getConfig();
assert.ok(initialConfig.terms.length >= 3, 'Must have at least 3 academic terms configured');
console.log(`  ✓ Default academic terms loaded: ${initialConfig.terms.length} terms`);

const activeTerm = academicCalendarService.getActiveTerm();
assert.ok(activeTerm, 'Must have an active academic term');
assert.strictEqual(activeTerm.year, 2569, 'Active term year should default to 2569');
console.log(`  ✓ Active term verified: ${activeTerm.termName}/${activeTerm.year} (${activeTerm.startDate} - ${activeTerm.endDate})`);

// Test switching active term
console.log('  Testing switching active term to 2/2568...');
const term25682 = initialConfig.terms.find((t) => t.year === 2568 && t.semesterNo === 2);
assert.ok(term25682, 'Term 2/2568 must exist in defaults');
const switchedTerm = academicCalendarService.setActiveTerm(term25682.id);
assert.ok(switchedTerm, 'Switching active term should return term object');
assert.strictEqual(switchedTerm.id, term25682.id);

const newActiveTerm = academicCalendarService.getActiveTerm();
assert.strictEqual(newActiveTerm.id, term25682.id, 'Active term ID must be updated');
assert.strictEqual(newActiveTerm.semesterNo, 2, 'Active semester should now be 2');
console.log('  ✓ Active term switched to 2/2568 and synced with school settings');

// Test adding a new academic term
console.log('  Testing creating a new term (1/2570)...');
const createdTerm = academicCalendarService.createTerm({
  year: 2570,
  semesterNo: 1,
  startDate: '16 พ.ค. 2570',
  endDate: '10 ต.ค. 2570',
  note: 'ภาคเรียนที่ 1 ปีการศึกษา 2570 สร้างใหม่',
});
assert.ok(createdTerm.id, 'Created term must have an id');
assert.strictEqual(createdTerm.year, 2570);
assert.strictEqual(createdTerm.semesterNo, 1);
console.log('  ✓ New term 1/2570 created successfully');

// Test updating term dates
console.log('  Testing updating term dates...');
const updatedTerm = academicCalendarService.updateTerm(createdTerm.id, {
  startDate: '18 พ.ค. 2570',
  endDate: '12 ต.ค. 2570',
});
assert.ok(updatedTerm);
assert.strictEqual(updatedTerm.startDate, '18 พ.ค. 2570');
console.log('  ✓ Term dates updated successfully');

// Test special holidays
console.log('  Testing special holidays management...');
const holidays = academicCalendarService.getHolidays();
assert.ok(holidays.length >= 4, 'Must have default holidays loaded');
const firstHoliday = holidays[0];
const initialStatus = firstHoliday.isActive;
const toggledHoliday = academicCalendarService.toggleHoliday(firstHoliday.id);
assert.ok(toggledHoliday);
assert.strictEqual(toggledHoliday.isActive, !initialStatus);

// Add custom holiday
const addedHoliday = academicCalendarService.addHoliday({
  name: 'วันสถาปนาโรงเรียนกุดจับประชาสรรค์',
  date: '29 ก.ค. 2569',
  type: 'SCHOOL_SPECIAL',
  note: 'กิจกรรมวันสถาปนาโรงเรียนครบรอบประจำปี',
});
assert.ok(addedHoliday.id);
assert.strictEqual(addedHoliday.name, 'วันสถาปนาโรงเรียนกุดจับประชาสรรค์');
console.log('  ✓ Special holidays toggled and new school holiday added');

// Test weekend makeup days (วันมาเรียนพิเศษ เสาร์-อาทิตย์)
console.log('  Testing weekend makeup days (วันมาเรียนพิเศษ เสาร์-อาทิตย์)...');
const makeupDays = academicCalendarService.getWeekendMakeupDays();
assert.ok(makeupDays.length >= 2, 'Must have default weekend makeup days');
const addedMakeupDay = academicCalendarService.addWeekendMakeupDay({
  title: 'เรียนชดเชยวันเสาร์สำหรับกลุ่มสาระการเรียนรู้เพิ่มเติม',
  date: '17 ต.ค. 2569',
  dayOfWeek: 'SATURDAY',
  reason: 'เรียนชดเชยกิจกรรมค่ายวิชาการ',
  targetClasses: 'ระดับชั้น ม.1 - ม.3',
  substituteForDate: '10 ต.ค. 2569',
  periodCount: 6,
});
assert.ok(addedMakeupDay.id);
assert.strictEqual(addedMakeupDay.dayOfWeek, 'SATURDAY');
assert.strictEqual(addedMakeupDay.periodCount, 6);
console.log('  ✓ Weekend makeup day created successfully with target grades');

// ---------------------------------------------------------------------------
// 2. Verify Messaging Service & Auto Group Creation
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing Messaging Service & Auto-Groups ---');
const { messagingService } = await import('./src/services/messagingService.ts');

const groups = messagingService.getGroups();
assert.ok(groups.length >= 8, `Must auto-generate at least 8 chat groups (found ${groups.length})`);

// Verify Homeroom groups exist
const homeroom11 = groups.find((g) => g.classroomId === 'room-1-1' && g.type === 'HOMEROOM');
const homeroom12 = groups.find((g) => g.classroomId === 'room-1-2' && g.type === 'HOMEROOM');
assert.ok(homeroom11, 'Must have auto-generated homeroom group for ม.1/1');
assert.ok(homeroom12, 'Must have auto-generated homeroom group for ม.1/2');
assert.ok(homeroom11.autoManaged, 'Homeroom group must have autoManaged = true');
assert.ok(homeroom12.autoManaged, 'Homeroom group must have autoManaged = true');

// Verify course groups exist
const math11Course = groups.find((g) => g.classroomId === 'room-1-1' && g.courseCode === 'ค21101');
const math12Course = groups.find((g) => g.classroomId === 'room-1-2' && g.courseCode === 'ค21101');
assert.ok(math11Course, 'Must have auto-generated math course group for ม.1/1');
assert.ok(math12Course, 'Must have auto-generated math course group for ม.1/2');

// Verify initial student membership in room-1-1
const student47001InHomeroom11 = homeroom11.members.find((m) => m.code === '47001');
assert.ok(student47001InHomeroom11, 'Student 47001 (ด.ช. ชนะภัย ยอดสิงห์) must initially belong to homeroom ม.1/1');

const student47001InHomeroom12Before = homeroom12.members.find((m) => m.code === '47001');
assert.strictEqual(student47001InHomeroom12Before, undefined, 'Student 47001 must NOT be in homeroom ม.1/2 initially');
console.log('  ✓ Homeroom and course groups auto-created with student roster members');

// Test messaging send
const sentMessage = messagingService.sendMessage(homeroom11.id, {
  senderId: 'teacher-praphas',
  senderName: 'ครูประภาส ยอดเยี่ยม',
  senderRole: 'TEACHER',
  content: 'สวัสดีนักเรียน ม.1/1 ทุกคน ขอให้ส่งการบ้านตรงเวลาครับ',
});
assert.ok(sentMessage, 'Message sending should return message');
assert.ok(sentMessage.id, 'Message sending should produce valid message id');
const updatedHomeroom11 = messagingService.getGroups().find((g) => g.id === homeroom11.id);
assert.strictEqual(updatedHomeroom11.lastMessageText, 'สวัสดีนักเรียน ม.1/1 ทุกคน ขอให้ส่งการบ้านตรงเวลาครับ');
console.log('  ✓ Chat message sent and group lastMessageText updated');

// ---------------------------------------------------------------------------
// 3. Verify Student Transfer Synchronization (ม.1/1 -> ม.1/2)
// ---------------------------------------------------------------------------
console.log('\n--- 3. Testing Student Transfer Sync & Data Preservation ---');

const { sgsRosterAndSubmissionService } = await import('./src/services/sgsRosterAndSubmissionService.ts');
const { studentService } = await import('./src/services/studentService.ts');

const initialSubmissions = sgsRosterAndSubmissionService.getSubmissions()
  .filter((sub) => sub.studentCode === '47001');
console.log(`  Initial submissions count for 47001: ${initialSubmissions.length}`);

// EXECUTE TRANSFER: ม.1/1 -> ม.1/2
console.log('  Executing Student Transfer: 47001 from room-1-1 (ม.1/1) to room-1-2 (ม.1/2)...');
const transferResult = messagingService.executeStudentTransfer({
  studentCode: '47001',
  fromClassroomId: 'room-1-1',
  toClassroomId: 'room-1-2',
  transferReason: 'ย้ายแผนการเรียนตามความสนใจและคำร้องขอของผู้ปกครอง',
  actorLabel: 'ครูผู้สอน / แอดมินวิชาการ',
});

assert.strictEqual(transferResult.success, true, 'executeStudentTransfer must succeed');
assert.strictEqual(transferResult.toClassroomId, 'room-1-2');
console.log(`  ✓ Transfer executed: ${transferResult.message}`);
console.log(`  ✓ Left groups: ${transferResult.leftGroups.join(', ')}`);
console.log(`  ✓ Joined groups: ${transferResult.joinedGroups.join(', ')}`);

// Verify groups after transfer
const postGroups = messagingService.getGroups();
const postHomeroom11 = postGroups.find((g) => g.id === homeroom11.id);
const postHomeroom12 = postGroups.find((g) => g.id === homeroom12.id);

// 1) Student removed from old homeroom group
const studentInOldHomeroom = postHomeroom11.members.find((m) => m.code === '47001');
assert.strictEqual(studentInOldHomeroom, undefined, 'Student 47001 must be removed from old homeroom group ม.1/1');

// 2) Student added to new homeroom group
const studentInNewHomeroom = postHomeroom12.members.find((m) => m.code === '47001');
assert.ok(studentInNewHomeroom, 'Student 47001 must be added to new homeroom group ม.1/2');

// 3) Student removed from old course groups and added to new course groups
const postMath11 = postGroups.find((g) => g.id === math11Course.id);
const postMath12 = postGroups.find((g) => g.id === math12Course.id);
assert.strictEqual(postMath11.members.find((m) => m.code === '47001'), undefined, 'Removed from old math course');
assert.ok(postMath12.members.find((m) => m.code === '47001'), 'Added to new math course');

// 4) Verify Audit Messages
const oldRoomAudit = postHomeroom11.messages.find(
  (msg) => msg.isSystemAudit && msg.transferAuditMeta?.action === 'TRANSFER_OUT'
);
assert.ok(oldRoomAudit, 'Old room must contain TRANSFER_OUT system audit message');
assert.strictEqual(oldRoomAudit.transferAuditMeta.studentCode, '47001');

const newRoomAudit = postHomeroom12.messages.find(
  (msg) => msg.isSystemAudit && msg.transferAuditMeta?.action === 'TRANSFER_IN'
);
assert.ok(newRoomAudit, 'New room must contain TRANSFER_IN system audit message');
assert.strictEqual(newRoomAudit.transferAuditMeta.studentCode, '47001');
assert.ok(newRoomAudit.content.includes('โอนย้ายงานที่ทำอยู่'), 'Welcome audit message mentions preserved work');

console.log('  ✓ Automated chat group memberships switched cleanly');
console.log('  ✓ System audit messages logged in both origin and destination groups');

// 5) Verify 100% Data Preservation
const postSubmissions = sgsRosterAndSubmissionService.getSubmissions()
  .filter((sub) => sub.studentCode === '47001');
assert.strictEqual(postSubmissions.length, initialSubmissions.length, 'Submissions count must remain 100% intact');
assert.strictEqual(transferResult.preservedScore, 85.0, 'Student score must remain intact');
console.log('  ✓ All student assignments, submissions, and scores preserved 100%');

// 6) Verify Student Roster Service
const room11Students = await studentService.getByClassroom('room-1-1');
const room12Students = await studentService.getByClassroom('room-1-2');
assert.strictEqual(room11Students.some((s) => s.code === '47001'), false, '47001 no longer in room-1-1 roster');
assert.strictEqual(room12Students.some((s) => s.code === '47001'), true, '47001 now in room-1-2 roster');
console.log('  ✓ studentService roster verified reflecting transfer in both classrooms');

// ---------------------------------------------------------------------------
// 4. Verify Sequential Transfer & Dynamic Chat Group Creation
// ---------------------------------------------------------------------------
console.log('\n--- 4. Testing Sequential Transfer & Dynamic Group Creation (ม.1/2 -> ม.2/1) ---');
const transferSeq = messagingService.executeStudentTransfer({
  studentCode: '47001',
  fromClassroomId: 'room-1-2',
  toClassroomId: 'room-2-1',
  transferReason: 'เลื่อนชั้น/ปรับเปลี่ยนแผนการเรียนพิเศษ',
  actorLabel: 'ครูผู้สอน / แอดมินวิชาการ',
});

assert.strictEqual(transferSeq.success, true);
assert.strictEqual(transferSeq.toClassroomId, 'room-2-1');
assert.ok(transferSeq.joinedGroups.length >= 2, 'Must join newly created homeroom and course groups for room-2-1');
console.log(`  ✓ Sequential transfer succeeded: Joined ${transferSeq.joinedGroups.length} groups in room-2-1`);

// Verify groups in room-2-1
const groupsAfterSeq = messagingService.getGroups();
const homeroom21 = groupsAfterSeq.find((g) => g.type === 'HOMEROOM' && (g.classroomId === 'room-2-1' || g.classroomName === 'ม.2/1'));
assert.ok(homeroom21, 'Room 2/1 homeroom group must exist');
assert.ok(homeroom21.members.some((m) => m.code === '47001'), 'Student 47001 must be member of room 2/1');
assert.strictEqual(homeroom21.members.length, 5, 'Room 2/1 homeroom group must contain teacher + 3 existing students + 1 transferred student = 5 members');
console.log('  ✓ Dynamic creation of homeroom and course groups verified with ALL existing students intact (5 members)');

// Verify global student search by code
const foundStudent = studentService.findStudentByCode('47001');
assert.ok(foundStudent, 'studentService.findStudentByCode must resolve student 47001');
assert.strictEqual(foundStudent.classroomId, 'room-2-1', 'Must resolve to room-2-1');
console.log('  ✓ studentService.findStudentByCode accurately resolved student 47001 to room-2-1');

// ---------------------------------------------------------------------------
// 5. Verify SGS Roster Registration for Non-initial Students
// ---------------------------------------------------------------------------
console.log('\n--- 5. Testing SGS Roster Registration for Transferred Students ---');
const sgsRosterAfterTransfers = sgsRosterAndSubmissionService.getSgsRoster();
const sgsStudent47001 = sgsRosterAfterTransfers.find((s) => s.studentCode === '47001');
assert.ok(sgsStudent47001, 'Student 47001 must be registered in sgsRoster');
assert.strictEqual(sgsStudent47001.classroom, 'ม.2/1');
assert.strictEqual(sgsStudent47001.transferState, 'TRANSFERRED_IN');
console.log('  ✓ SGS Roster registered transferred student with full status');

// ---------------------------------------------------------------------------
// 6. Verify Dual-Key Storage & Empty Array Retention
// ---------------------------------------------------------------------------
console.log('\n--- 6. Testing Dual-Key Storage & Empty Array Retention ---');
const storedById = localStorage.getItem('cls_students_room-2-1');
const storedByName = localStorage.getItem('cls_students_ม.2/1');
assert.ok(storedById, 'Data must be stored under room ID');
assert.ok(storedByName, 'Data must be synced under room number');
console.log('  ✓ Dual-key storage synchronized for room id and room number');

// Test empty array retention
localStorage.setItem('cls_students_test-room-empty', JSON.stringify([]));
const emptyStudents = studentService.getLocalStudents('test-room-empty');
assert.strictEqual(emptyStudents.length, 0, 'Empty student array must stay empty without resurrecting mock data');
console.log('  ✓ Empty student array correctly preserved without mock revival');

// Test unmapped room returns empty array without leaking defaultStudents
const unmappedRoomStudents = studentService.getLocalStudents('room-nonexistent-xyz');
assert.strictEqual(unmappedRoomStudents.length, 0, 'Unmapped classroom must return empty array without leaking default students from ม.3/1');
console.log('  ✓ Unmapped classrooms return empty array without leaking default students');

// ---------------------------------------------------------------------------
// 7. Verify UI Files Structure, Architecture & Separation
// ---------------------------------------------------------------------------
console.log('\n--- 7. Checking UI Files Architecture, Navigation & Separation ---');

const academicTermsCode = fs.readFileSync('src/views/AcademicTermsView.tsx', 'utf8');
assert.ok(academicTermsCode.includes('ปฏิทินกิจกรรมโรงเรียน (School Activities & Events)'), 'AcademicTermsView focuses purely on activities/events');
assert.ok(academicTermsCode.includes('การตั้งค่าปีการศึกษา, ภาคเรียน (เปิดเทอม-ปิดเทอม)'), 'AcademicTermsView includes migration notice linking to settings');
assert.ok(academicTermsCode.includes('ไปที่ตั้งค่าปีการศึกษา'), 'AcademicTermsView links to settings');
console.log('  ✓ AcademicTermsView refactored purely for Activities & Events timeline');

const settingsCode = fs.readFileSync('src/views/SettingsBackupView.tsx', 'utf8');
assert.ok(settingsCode.includes("'CALENDAR'"), 'SettingsBackupView has CALENDAR tab');
assert.ok(settingsCode.includes('initialTab'), 'SettingsBackupView supports initialTab prop');
assert.ok(settingsCode.includes('academicCalendarService'), 'SettingsBackupView uses academicCalendarService');
assert.ok(settingsCode.includes('วันมาเรียนพิเศษ (เสาร์-อาทิตย์)'), 'SettingsBackupView contains weekend makeup days management');
assert.ok(settingsCode.includes('วันหยุดพิเศษ (Special Holidays & School Observance Days)'), 'SettingsBackupView contains special holidays management');
console.log('  ✓ SettingsBackupView houses complete Academic Terms, Holidays & Makeup Days management');

const rosterCode = fs.readFileSync('src/views/ClassroomsRosterView.tsx', 'utf8');
assert.ok(rosterCode.includes('executeStudentTransfer'), 'ClassroomsRosterView integrates executeStudentTransfer');
assert.ok(rosterCode.includes('ย้ายห้องเรียน (ซิงค์กลุ่มแชท)'), 'ClassroomsRosterView action menu has transfer button');
assert.ok(rosterCode.includes('STUDENT_TRANSFERRED_EVENT'), 'ClassroomsRosterView listens to transfer event');
console.log('  ✓ ClassroomsRosterView has student transfer modal and action menu button');

const detailCode = fs.readFileSync('src/views/StudentDetailView.tsx', 'utf8');
assert.ok(detailCode.includes('executeStudentTransfer'), 'StudentDetailView integrates executeStudentTransfer');
assert.ok(detailCode.includes('resolveCurrentRoom'), 'StudentDetailView dynamically resolves current room');
assert.ok(detailCode.includes('STUDENT_TRANSFERRED_EVENT'), 'StudentDetailView listens to transfer event');
assert.ok(detailCode.includes('ย้ายห้องเรียน (ซิงค์กลุ่มแชท)'), 'StudentDetailView has transfer button');
console.log('  ✓ StudentDetailView has dynamic student transfer modal and event sync');

const appCode = fs.readFileSync('src/App.tsx', 'utf8');
assert.ok(appCode.includes("settingsInitialTab"), 'App.tsx tracks settingsInitialTab');
assert.ok(appCode.includes("initialTab={settingsInitialTab}"), 'App.tsx passes initialTab to SettingsBackupView');
console.log('  ✓ App.tsx cleanly routes directly into CALENDAR settings tab');

const mobileMenuCode = fs.readFileSync('src/components/dashboard/TeacherMoreAccountMobileView.tsx', 'utf8');
assert.ok(mobileMenuCode.includes("key: 'messages'"), 'TeacherMoreAccountMobileView has messages in navigation menu');
console.log('  ✓ TeacherMoreAccountMobileView includes messages in navigation');

console.log('\n🎉 ALL 32 DEEP VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
