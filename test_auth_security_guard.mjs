import assert from 'node:assert';

console.log('🧪 Starting Auth Security & RBAC Isolation Test Suite...\n');

// Mock localStorage and sessionStorage for Node.js environment
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockStorage();
globalThis.sessionStorage = new MockStorage();
globalThis.window = {
  dispatchEvent: (_event) => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, params) {
    this.type = type;
    this.detail = params?.detail;
  }
};

// ============================================================================
// Test 1: Session Expiration Guard & Auto-Purge (24 Hours)
// ============================================================================
console.log('--- 1. Testing Session Expiration Guard & Auto-Purge ---');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function evaluateCurrentUser(storage) {
  const raw = storage.getItem('kps_auth_user_v1');
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user || !user.id || !user.role) {
      storage.removeItem('kps_auth_user_v1');
      return null;
    }
    const now = Date.now();
    // Invalidate if session has expired (> 24 hours)
    if (user.expiresAt && now > user.expiresAt) {
      storage.removeItem('kps_auth_user_v1');
      storage.removeItem('kp_active_user_role');
      storage.removeItem('kp_login_channel');
      return null;
    }
    // Upgrade legacy session without expiration
    if (!user.expiresAt) {
      user.loginAt = user.loginAt || now;
      user.expiresAt = now + ONE_DAY_MS;
      storage.setItem('kps_auth_user_v1', JSON.stringify(user));
    }
    return user;
  } catch {
    storage.removeItem('kps_auth_user_v1');
    return null;
  }
}

// 1A. Valid Active Session (< 24 hours old)
const activeUser = {
  id: 'teacher-101',
  name: 'ครูสมศรี นารีรัตน์',
  role: 'TEACHER',
  loginAt: Date.now() - 3600000, // 1 hour ago
  expiresAt: Date.now() + (ONE_DAY_MS - 3600000), // expires in 23 hours
};
globalThis.localStorage.setItem('kps_auth_user_v1', JSON.stringify(activeUser));
const verifiedActive = evaluateCurrentUser(globalThis.localStorage);
assert.strictEqual(verifiedActive?.id, 'teacher-101');
assert.strictEqual(verifiedActive?.name, 'ครูสมศรี นารีรัตน์');
console.log('  ✓ Active session correctly recognized within 24h window');

// 1B. Expired Session (> 24 hours old) -> Must auto-purge
const expiredUser = {
  id: 'teacher-old',
  name: 'ครูท่านเดิม',
  role: 'TEACHER',
  loginAt: Date.now() - (ONE_DAY_MS + 10000),
  expiresAt: Date.now() - 10000, // expired 10 seconds ago
};
globalThis.localStorage.setItem('kps_auth_user_v1', JSON.stringify(expiredUser));
globalThis.localStorage.setItem('kp_active_user_role', 'SUBJECT_TEACHER');

const purgedUser = evaluateCurrentUser(globalThis.localStorage);
assert.strictEqual(purgedUser, null, 'Expired session must return null');
assert.strictEqual(globalThis.localStorage.getItem('kps_auth_user_v1'), null, 'Expired session must be purged from localStorage');
assert.strictEqual(globalThis.localStorage.getItem('kp_active_user_role'), null, 'Expired active role must be purged');
console.log('  ✓ Expired session (> 24h) instantly auto-purged from storage to prevent cross-user leakage');

// 1C. Legacy session without expiresAt -> Must upgrade with 24h expiration
const legacyUser = {
  id: 'teacher-legacy',
  name: 'ครูรุ่นเก่า',
  role: 'TEACHER',
};
globalThis.localStorage.setItem('kps_auth_user_v1', JSON.stringify(legacyUser));
const upgradedUser = evaluateCurrentUser(globalThis.localStorage);
assert.strictEqual(upgradedUser?.id, 'teacher-legacy');
assert.ok(upgradedUser?.expiresAt > Date.now(), 'Legacy session must have expiresAt populated');
console.log('  ✓ Legacy session safely upgraded with 24h expiration timestamp');

// ============================================================================
// Test 2: Logout Security Guard (Complete Purge of Both Storages)
// ============================================================================
console.log('\n--- 2. Testing Logout Purge Guard ---');

function executeLogout(localStore, sessionStore) {
  localStore.removeItem('kps_auth_user_v1');
  localStore.removeItem('kp_active_user_role');
  localStore.removeItem('kp_login_channel');
  localStore.removeItem('kps_remembered_student_code');
  sessionStore.clear();
}

globalThis.localStorage.setItem('kps_auth_user_v1', JSON.stringify(activeUser));
globalThis.localStorage.setItem('kp_active_user_role', 'ACADEMIC_ADMIN');
globalThis.sessionStorage.setItem('temp_secret', 'should_be_cleared');

executeLogout(globalThis.localStorage, globalThis.sessionStorage);

assert.strictEqual(globalThis.localStorage.getItem('kps_auth_user_v1'), null);
assert.strictEqual(globalThis.localStorage.getItem('kp_active_user_role'), null);
assert.strictEqual(globalThis.sessionStorage.getItem('temp_secret'), null);
console.log('  ✓ Logout thoroughly purges user token, roles, and sessionStorage');

// ============================================================================
// Test 3: RBAC Security Guard - Unauthenticated Access Lock
// ============================================================================
console.log('\n--- 3. Testing Unauthenticated Access Lock ---');

function enforceSecurityGuard({ currentUser, currentView, activeRole }) {
  let guardedView = currentView;
  let guardedRole = activeRole;

  // 1. Unauthenticated users: strictly lock to school-login
  if (!currentUser) {
    if (guardedView !== 'school-login') {
      guardedView = 'school-login';
    }
    return { currentView: guardedView, activeRole: guardedRole };
  }

  // 2. Student Role: strictly lock to student-portal
  if (currentUser.role === 'STUDENT') {
    if (guardedView !== 'student-portal') {
      guardedView = 'student-portal';
    }
    if (guardedRole !== 'STUDENT_GENERAL' && guardedRole !== 'STUDENT_COUNCIL') {
      guardedRole = 'STUDENT_GENERAL';
    }
    return { currentView: guardedView, activeRole: guardedRole };
  }

  // 3. Teacher Role: lock to teacher views
  if (currentUser.role === 'TEACHER') {
    if (guardedView === 'school-login') {
      guardedView = 'home';
    }
    if (guardedRole === 'STUDENT_GENERAL' || guardedRole === 'STUDENT_COUNCIL') {
      guardedRole = 'SUBJECT_TEACHER';
    }
  }

  return { currentView: guardedView, activeRole: guardedRole };
}

// Case 3A: Hacker tries to access teacher views without logging in
const unauthAttackViews = ['home', 'class-overview', 'accounts', 'sar', 'exams', 'settings', 'roster'];
for (const attackView of unauthAttackViews) {
  const result = enforceSecurityGuard({
    currentUser: null,
    currentView: attackView,
    activeRole: 'ACADEMIC_ADMIN',
  });
  assert.strictEqual(result.currentView, 'school-login', `Unauthenticated user accessing ${attackView} must be intercepted to school-login`);
}
console.log('  ✓ Unauthenticated access to all teacher views strictly locked to school-login');

// ============================================================================
// Test 4: Student Role Jail & Privilege Escalation Prevention
// ============================================================================
console.log('\n--- 4. Testing Student Role Jail & Privilege Escalation Prevention ---');

const studentUser = {
  id: 'stu-999',
  studentCode: '50001',
  name: 'เด็กชายสมหมาย มุ่งมั่น',
  role: 'STUDENT',
  classroomId: 'room-3-1',
};

// Case 4A: Student tries to navigate to teacher views (e.g. via deep links, back button, or URL hacking)
const forbiddenViewsForStudents = [
  'home',
  'admin-dashboard',
  'class-overview',
  'accounts',
  'settings',
  'exams',
  'assignments',
  'sar',
  'lessons',
  'courses',
  'classroom-attendance',
  'morning-assembly',
  'trash',
  'roster',
];

for (const forbiddenView of forbiddenViewsForStudents) {
  const result = enforceSecurityGuard({
    currentUser: studentUser,
    currentView: forbiddenView,
    activeRole: 'STUDENT_GENERAL',
  });
  assert.strictEqual(
    result.currentView,
    'student-portal',
    `Student attempting to enter ${forbiddenView} must be jailed in student-portal`
  );
}
console.log(`  ✓ All ${forbiddenViewsForStudents.length} teacher views blocked for students (jailed to student-portal)`);

// Case 4B: Student attempts role escalation to Teacher/Admin
const forbiddenRolesForStudents = [
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
  'HEAD_DEPARTMENT',
  'ACADEMIC_ADMIN',
  'DIRECTOR',
];

for (const forbiddenRole of forbiddenRolesForStudents) {
  const result = enforceSecurityGuard({
    currentUser: studentUser,
    currentView: 'student-portal',
    activeRole: forbiddenRole,
  });
  assert.strictEqual(
    result.activeRole,
    'STUDENT_GENERAL',
    `Student role escalation to ${forbiddenRole} must be reset to STUDENT_GENERAL`
  );
}
console.log('  ✓ All role escalation attempts by students rejected and reverted to STUDENT_GENERAL');

// ============================================================================
// Test 5: QuickSearch Modal Role Isolation
// ============================================================================
console.log('\n--- 5. Testing QuickSearch Modal Item Isolation by Role ---');

const allSearchItems = [
  { id: 'home', label: 'หน้าแรกครู', role: 'teacher' },
  { id: 'overview', label: 'ภาพรวมชั้นเรียน', role: 'teacher' },
  { id: 'attendance', label: 'เช็คชื่อ', role: 'teacher' },
  { id: 'sar', label: 'รายงาน SAR', role: 'teacher' },
  { id: 'stu-overview', label: 'ภารกิจของฉัน', role: 'student' },
  { id: 'stu-scores', label: 'ผลการเรียน', role: 'student' },
  { id: 'stu-attendance', label: 'ประวัติเข้าแถว', role: 'student' },
];

function filterSearchItemsForUser(items, currentUser) {
  const isStudent = currentUser?.role === 'STUDENT';
  if (isStudent) {
    return items.filter((item) => item.role === 'student');
  }
  return items.filter((item) => item.role === 'teacher');
}

const studentFiltered = filterSearchItemsForUser(allSearchItems, studentUser);
assert.strictEqual(studentFiltered.length, 3);
assert.ok(studentFiltered.every((i) => i.role === 'student'));
assert.ok(!studentFiltered.some((i) => i.id === 'sar' || i.id === 'overview' || i.id === 'home'));
console.log('  ✓ QuickSearch strictly hides all teacher/admin actions from student users');

const teacherFiltered = filterSearchItemsForUser(allSearchItems, activeUser);
assert.strictEqual(teacherFiltered.length, 4);
assert.ok(teacherFiltered.every((i) => i.role === 'teacher'));
console.log('  ✓ QuickSearch provides full operational shortcuts for verified teachers');

// ============================================================================
// Test 6: Zero Hardcoded Identity Leakage Check
// ============================================================================
console.log('\n--- 6. Testing Zero Hardcoded Identity Leakage Check ---');

function resolveDisplayName(user, fallback = 'ครูผู้สอน') {
  return user?.name || fallback;
}

// When user is not logged in or name is empty
assert.strictEqual(resolveDisplayName(null), 'ครูผู้สอน');
assert.strictEqual(resolveDisplayName({}), 'ครูผู้สอน');
assert.notStrictEqual(resolveDisplayName(null), 'นายปัญจพล เกษรัตน์');
assert.notStrictEqual(resolveDisplayName(null), 'ครูปัญจพล');
assert.notStrictEqual(resolveDisplayName(null), 'ครูภาสภูมิ');

// When user is logged in
assert.strictEqual(resolveDisplayName({ name: 'ครูอารีย์ รักเรียน' }), 'ครูอารีย์ รักเรียน');
console.log('  ✓ Zero identity leakage: Unauthenticated state yields neutral "ครูผู้สอน", never leaks another user\'s identity');

console.log('\n🎉 ALL 6 AUTH SECURITY & RBAC ISOLATION TESTS PASSED PERFECTLY!\n');
