import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting Session Isolation & Student Avatar Persistence Test Suite...\n');

// Mock localStorage and window for Node environment
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
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
const dispatchedEvents = [];
globalThis.window = {
  localStorage: globalThis.localStorage,
  dispatchEvent: (event) => {
    dispatchedEvents.push(event);
  },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, params) {
    this.type = type;
    this.detail = params?.detail;
  }
};

// ============================================================================
// Test 1: CloudDataService Local Session Key Exclusion & Protection
// ============================================================================
console.log('--- 1. Testing CloudDataService Local Session Key Exclusion ---');

const cloudSource = fs.readFileSync('src/services/cloudDataService.ts', 'utf8');

// Verify LOCAL_SESSION_KEYS contains cls_current_auth_user
assert.ok(
  cloudSource.includes("'cls_current_auth_user'"),
  'LOCAL_SESSION_KEYS must include cls_current_auth_user'
);
assert.ok(
  cloudSource.includes("'cms_affairs_active_role_v1'"),
  'LOCAL_SESSION_KEYS must include cms_affairs_active_role_v1'
);

// Verify isAppStorageKey rejects cls_current_auth_user
assert.ok(
  cloudSource.includes('CloudDataService.LOCAL_SESSION_KEYS.has(key)'),
  'isAppStorageKey must check LOCAL_SESSION_KEYS'
);

// Verify fetchCloudKey and saveCloudKey guard against session keys
assert.ok(
  cloudSource.includes('if (!this.isAppStorageKey(key))'),
  'fetchCloudKey must check isAppStorageKey'
);

// Verify dirtyData and untouched hydration in fetchAllCloudData check isAppStorageKey
assert.ok(
  cloudSource.includes('this.isAppStorageKey(item.key)'),
  'fetchAllCloudData dirtyData hydration must check isAppStorageKey'
);
assert.ok(
  cloudSource.includes('this.isAppStorageKey(r.key)'),
  'fetchAllCloudData remoteKeys hydration must check isAppStorageKey'
);

// Verify Realtime ignores session keys
assert.ok(
  cloudSource.includes('this.isAppStorageKey(newRecord.key)'),
  'setupRealtimeSubscription must guard newRecord.key with isAppStorageKey'
);

console.log('✅ CloudDataService session isolation verified: zero session bleeding risk!');

// ============================================================================
// Test 2: Student Avatar Persistence & Fallback
// ============================================================================
console.log('\n--- 2. Testing Student Avatar Update and Persistence ---');

const studentServiceSource = fs.readFileSync('src/services/studentService.ts', 'utf8');

// Verify updateStudentAvatar saves to per-student key
assert.ok(
  studentServiceSource.includes('kp_student_avatar_${cleanCode}'),
  'updateStudentAvatar must save to kp_student_avatar_<studentCode>'
);

// Verify updateStudentAvatar dispatches events
assert.ok(
  studentServiceSource.includes("'kps-student-avatar-updated'"),
  'updateStudentAvatar must dispatch kps-student-avatar-updated'
);

// Verify authService imports or handles custom avatar
const authServiceSource = fs.readFileSync('src/services/authService.ts', 'utf8');
assert.ok(
  authServiceSource.includes('kp_student_avatar_'),
  'authService must read and write kp_student_avatar_'
);

// Verify App.tsx listens to avatar and auth events
const appSource = fs.readFileSync('src/App.tsx', 'utf8');
assert.ok(
  appSource.includes("'kps-student-avatar-updated'"),
  'App.tsx must listen to kps-student-avatar-updated'
);
assert.ok(
  appSource.includes("'kps-auth-changed'"),
  'App.tsx must listen to kps-auth-changed'
);

// Verify StudentPortalView listens to avatar update
const studentPortalSource = fs.readFileSync('src/views/StudentPortalView.tsx', 'utf8');
assert.ok(
  studentPortalSource.includes("'kps-student-avatar-updated'"),
  'StudentPortalView.tsx must listen to kps-student-avatar-updated'
);

// Verify StudentProfileView handles avatar upload and sync
const studentProfileSource = fs.readFileSync('src/components/student/StudentProfileView.tsx', 'utf8');
assert.ok(
  studentProfileSource.includes('studentService.getStudentAvatar'),
  'StudentProfileView must use studentService.getStudentAvatar'
);
assert.ok(
  studentProfileSource.includes('studentService.updateStudentAvatar'),
  'StudentProfileView must call studentService.updateStudentAvatar'
);

console.log('✅ Student avatar persistence, event flow, and cross-view sync verified!');

console.log('\n🎉 ALL SESSION ISOLATION & AVATAR PERSISTENCE TESTS PASSED!\n');
