import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting Advisor & Assignment Progress Label Verification Suite...\n');

// 1. Check AssignmentManagementView.tsx
console.log('--- 1. Checking AssignmentManagementView.tsx ---');
const assignView = fs.readFileSync('src/views/AssignmentManagementView.tsx', 'utf8');

assert(!assignView.includes('<span>ส่งคะแนนแล้ว</span>'), 'Must NOT hardcode "ส่งคะแนนแล้ว"');
assert(assignView.includes("item.pendingReviewCount > 0\n                                  ? 'ส่งงานแล้ว'"), 'Must show "ส่งงานแล้ว" when pending');
assert(assignView.includes('(รอตรวจ {item.pendingReviewCount})'), 'Must show pending count in progress indicator');
assert(assignView.includes("item.pendingReviewCount > 0\n                                    ? 'bg-[#3B82F6]'"), 'Must NOT show green bar when items are pending review');
console.log('  ✓ Verified Assignment Progress Label and Bar Color logic');

// 2. Check SettingsBackupView.tsx
console.log('\n--- 2. Checking SettingsBackupView.tsx ---');
const settingsView = fs.readFileSync('src/views/SettingsBackupView.tsx', 'utf8');

assert(!settingsView.includes('ครูภาสภูมิ เรืองปราชญ์'), 'Must NOT contain hardcoded mock teachers');
assert(!settingsView.includes('ครูวิภาดา สมบูรณ์'), 'Must NOT contain hardcoded mock teachers');
assert(settingsView.includes('classroomService.getTeacherAccounts()'), 'Must fetch real teachers via classroomService.getTeacherAccounts()');
assert(settingsView.includes('availableTeachersList'), 'Must use dynamic availableTeachersList for dropdown options');
console.log('  ✓ Verified Zero-Mock compliance and real teacher account fetching in Settings');

// 3. Check StudentProfileView.tsx
console.log('\n--- 3. Checking StudentProfileView.tsx ---');
const studentProfile = fs.readFileSync('src/components/student/StudentProfileView.tsx', 'utf8');

assert(studentProfile.includes('matchedRoom?.adviser'), 'Must read matchedRoom.adviser');
console.log('  ✓ Verified student profile reads real matchedRoom.adviser');

console.log('\n======================================================');
console.log('🎉 ALL ADVISOR & PROGRESS CHECKS PASSED!');
console.log('======================================================');
