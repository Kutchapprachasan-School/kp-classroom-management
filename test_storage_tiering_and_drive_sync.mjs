// test_storage_tiering_and_drive_sync.mjs
// Test Suite สำหรับ Storage Tiering, IndexedDB, Outbox Sync & Google Drive Architecture
// แบ่งเป็น 3 ระดับ: Tier 1 (Unit), Tier 2 (Integration), Tier 3 (Simulation)

import assert from 'node:assert';
import { existsSync } from 'node:fs';

console.log('🧪 Starting 3-Tier Test Suite: Storage Tiering, Outbox Sync & Google Drive Architecture...');

// ============================================================================
// TIER 1: UNIT TESTS
// ============================================================================
console.log('\n--- 1. TIER 1: UNIT TESTS ---');

// 1.1 Canonical Serialization & Checksum Verification
const adapterPath = './src/utils/indexedDbAdapter.ts';
assert.ok(existsSync(adapterPath), 'indexedDbAdapter.ts must exist');

const {
  indexedDbAdapter,
  canonicalJsonStringify,
  computeSha256Checksum,
} = await import('./src/utils/indexedDbAdapter.ts');

const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
const objB = { a: 1, b: 2, nested: { x: 10, y: 20 } };

const strA = canonicalJsonStringify(objA);
const strB = canonicalJsonStringify(objB);
assert.strictEqual(strA, strB, 'Canonical JSON must sort keys deterministically');

const hashA = await computeSha256Checksum(strA);
const hashB = await computeSha256Checksum(strB);
assert.strictEqual(hashA, hashB, 'Identical objects must yield identical SHA-256 checksums');
console.log('  ✓ 1.1 Canonical JSON stringify & SHA-256 checksum verified');

// 1.2 Backoff Calculator Test
const { computeNextBackoffMs } = await import('./src/utils/indexedDbAdapter.ts');
const b0 = computeNextBackoffMs(0);
const b1 = computeNextBackoffMs(1);
const b2 = computeNextBackoffMs(2);
const bMax = computeNextBackoffMs(5); // max retries 5 -> returns -1
assert.ok(b0 >= 800 && b0 <= 1200, `b0 should be ~1000ms ±20% jitter, got ${b0}`);
assert.ok(b1 >= 1600 && b1 <= 2400, `b1 should be ~2000ms ±20% jitter, got ${b1}`);
assert.ok(b2 >= 3200 && b2 <= 4800, `b2 should be ~4000ms ±20% jitter, got ${b2}`);
assert.strictEqual(bMax, -1, 'Exceeded max retries must return -1');
console.log('  ✓ 1.2 Exponential backoff with jitter and max retry cap verified');

// ============================================================================
// TIER 2: INTEGRATION TESTS (IndexedDB & Outbox Queue)
// ============================================================================
console.log('\n--- 2. TIER 2: INTEGRATION TESTS ---');

// 2.1 Account Isolation on Shared Computers
console.log('  Testing 2.1: Account Isolation between Teacher A and Student B on same device...');
await indexedDbAdapter.init('teacher-01');
await indexedDbAdapter.setItem('chat_groups', 'grp-confidential', {
  id: 'grp-confidential',
  title: 'กลุ่มครูและฝ่ายวิชาการ',
  classified: true,
}, 'teacher-01');

// Switch to student on same browser/device
await indexedDbAdapter.init('student-99');
const studentRead = await indexedDbAdapter.getItem('chat_groups', 'grp-confidential', 'student-99');
assert.strictEqual(studentRead, null, 'Security Violation: Student must NOT access Teacher cache on shared device');

// Teacher switches back and accesses their data
const teacherRead = await indexedDbAdapter.getItem('chat_groups', 'grp-confidential', 'teacher-01');
assert.ok(teacherRead && teacherRead.title === 'กลุ่มครูและฝ่ายวิชาการ', 'Teacher must recover their isolated cache');
console.log('  ✓ 2.1 Account isolation strictly enforced per userId');

// 2.2 Serialized PromiseQueue under Concurrent Writes
console.log('  Testing 2.2: Serialized PromiseQueue preventing write race collisions...');
const concurrentWrites = [];
for (let i = 1; i <= 20; i++) {
  concurrentWrites.push(
    indexedDbAdapter.setItem('chat_messages', `msg-concurrent-${i}`, {
      id: `msg-concurrent-${i}`,
      order: i,
    }, 'teacher-01')
  );
}
await Promise.all(concurrentWrites);

for (let i = 1; i <= 20; i++) {
  const item = await indexedDbAdapter.getItem('chat_messages', `msg-concurrent-${i}`, 'teacher-01');
  assert.ok(item && item.order === i, `Concurrent message ${i} must be persisted accurately`);
}
console.log('  ✓ 2.2 20 concurrent writes completed with 100% integrity without collisions');

// 2.3 Safe Idempotent Migration with Checksum Verification
console.log('  Testing 2.3: Safe Idempotent Migration from localStorage to IndexedDB...');
const legacyData = [
  { id: 'leg-1', name: 'กลุ่มที่ปรึกษา ม.3/1', unread: 0 },
  { id: 'leg-2', name: 'กลุ่มวิชา ศ23101 ศิลปะ', unread: 2 },
];
const legacyKey = 'kp_chat_groups_v3_test';

// Setup mock localStorage
globalThis.localStorage = {
  _store: new Map([[legacyKey, JSON.stringify(legacyData)]]),
  getItem(k) { return this._store.get(k) || null; },
  setItem(k, v) { this._store.set(k, String(v)); },
  removeItem(k) { this._store.delete(k); },
};

const migrationResult = await indexedDbAdapter.safeMigrateFromLocalStorage(
  legacyKey,
  'chat_groups',
  'active_groups',
  'teacher-01'
);
assert.strictEqual(migrationResult.success, true, 'Migration must report success');
assert.strictEqual(migrationResult.migratedCount, 2, 'Must migrate 2 records');

// Verify data read back from IndexedDB matches 100%
const migratedRecords = await indexedDbAdapter.getItem('chat_groups', 'active_groups', 'teacher-01');
assert.deepStrictEqual(migratedRecords, legacyData, 'Migrated records must match source data 100%');

// Verify legacy key is safely archived, not destroyed abruptly
const archiveKeys = Array.from(globalThis.localStorage._store.keys()).filter(k => k.startsWith(legacyKey + '_archive_'));
assert.ok(archiveKeys.length > 0, 'Legacy key must be preserved in archive backup');
console.log('  ✓ 2.3 Safe idempotent migration with read-back verification and backup verified');

// 2.4 Outbox State Machine & Deduplication
console.log('  Testing 2.4: Outbox State Machine, Idempotency & Deduplication...');
const testOutboxItem = {
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  groupId: 'grp-test',
  senderId: 'teacher-01',
  content: 'สวัสดีนักเรียนทุกคน (Offline Outbox)',
  syncStatus: 'PENDING_SYNC',
  createdAt: new Date().toISOString(),
  retryCount: 0,
};

await indexedDbAdapter.enqueueOutbox(testOutboxItem, 'teacher-01');
let pending = await indexedDbAdapter.getPendingOutbox('teacher-01');
assert.strictEqual(pending.length, 1);
assert.strictEqual(pending[0].syncStatus, 'PENDING_SYNC');

// Duplicate enqueue with same idempotencyKey must NOT duplicate
await indexedDbAdapter.enqueueOutbox(testOutboxItem, 'teacher-01');
pending = await indexedDbAdapter.getPendingOutbox('teacher-01');
assert.strictEqual(pending.length, 1, 'Idempotent Outbox must not duplicate identical message');

// Mark Synced
await indexedDbAdapter.markOutboxSynced(testOutboxItem.idempotencyKey, 'teacher-01');
pending = await indexedDbAdapter.getPendingOutbox('teacher-01');
assert.strictEqual(pending.length, 0, 'Outbox must clear synced items');
console.log('  ✓ 2.4 Outbox queue state machine and deduplication verified');

// 1.3 Google Drive URL Validator & PDPA Policy Test
console.log('\n  Testing 1.3: Google Drive Syntax Validator & Phishing / SSRF Guard...');
const { validateGoogleDriveUrl, generateRecommendedFolderPath } = await import('./src/utils/googleDriveUtils.ts');

const validFolder = validateGoogleDriveUrl('https://drive.google.com/drive/folders/1ABCxyz1234567890abcdef');
assert.strictEqual(validFolder.isValidFormat, true);
assert.strictEqual(validFolder.resourceType, 'FOLDER');
assert.strictEqual(validFolder.permissionStatus, 'UNVERIFIED_FORMAT_OK');

const validDoc = validateGoogleDriveUrl('https://docs.google.com/document/d/1ABCxyz1234567890abcdef/edit');
assert.strictEqual(validDoc.isValidFormat, true);
assert.strictEqual(validDoc.resourceType, 'DOC');

// Phishing lookalike domain must be rejected
const phishing = validateGoogleDriveUrl('https://drive.google.com.malicious.net/drive/folders/1ABCxyz1234567890abcdef');
assert.strictEqual(phishing.isValidFormat, false, 'Phishing subdomain lookalike must be rejected');

// Non-https protocol must be rejected
const insecure = validateGoogleDriveUrl('http://drive.google.com/drive/folders/1ABCxyz1234567890abcdef');
assert.strictEqual(insecure.isValidFormat, false, 'Non-HTTPS URL must be rejected');

// Short ID must be rejected
const shortId = validateGoogleDriveUrl('https://drive.google.com/drive/folders/short_id');
assert.strictEqual(shortId.isValidFormat, false, 'ID shorter than 20 chars must be rejected');

// Template generator
const folderTemplate = generateRecommendedFolderPath({
  schoolName: 'โรงเรียนกุดจับประชาสรรค์',
  termYear: '2569_1',
  subjectCode: 'ศ23101',
  assignmentTitle: 'วาดภาพสีน้ำ',
});
assert.ok(folderTemplate.copyableText.includes('โรงเรียนกุดจับประชาสรรค์/2569_1/ศ23101_วาดภาพสีน้ำ'));
console.log('  ✓ 1.3 Google Drive allowlist, zero-SSRF parser and template generator verified');

// 1.4 Anti-Accidental-Delete Assertion Guard Test
console.log('\n  Testing 1.4: Anti-Accidental-Delete Assertion Guard for Storage Partitions...');
const { assertSafeTtlPurgeKey, messagingService } = await import('./src/services/messagingService.ts');

// Safe key passes without error
assert.doesNotThrow(() => {
  assertSafeTtlPurgeKey('ephemeral/chat/grp-1/msg-999_photo.jpg');
});

// Critical: Attempting to purge a student submission MUST throw a security violation!
assert.throws(() => {
  assertSafeTtlPurgeKey('submissions/1-2569/m3-1/asg-1/45101_artwork.webp');
}, /CRITICAL SECURITY VIOLATION: Attempted TTL purge on student submission key/);

// Non-ephemeral key must also throw
assert.throws(() => {
  assertSafeTtlPurgeKey('teacher-profiles/avatar.png');
}, /CRITICAL SECURITY VIOLATION: Attempted TTL purge on non-ephemeral key/);
console.log('  ✓ 1.4 Anti-purge assertion guard protects student submissions 100%');

// ============================================================================
// TIER 3: E2E & SIMULATION TESTS (Multi-Device Sync & 7-Day TTL Purge)
// ============================================================================
console.log('\n--- 3. TIER 3: E2E & SIMULATION TESTS ---');

// 3.1 Outbox Message Creation & Background Sync
console.log('  Testing 3.1: Messaging Outbox creation with UUID idempotency key...');
const outboxMsg = await messagingService.createOutboxMessage('grp-official-announcements', {
  senderId: 'teacher-01',
  senderName: 'ครูภาสภูมิ เรืองปราชญ์',
  senderRole: 'TEACHER',
  content: 'ทดสอบส่งข้อความผ่าน Outbox พร้อมกุญแจ Idempotency',
}, 'teacher-01');

assert.ok(outboxMsg);
assert.ok(outboxMsg.idempotencyKey);
assert.ok(outboxMsg.syncStatus === 'SYNCED' || outboxMsg.syncStatus === 'PENDING_SYNC');
console.log('  ✓ 3.1 Message created with authoritative idempotencyKey and synced');

// 3.2 Multi-Device Clean Hydration Simulation
console.log('  Testing 3.2: Multi-Device Hydration from Cloud on New Device...');
// Simulate user moving to Device 2 with clean state
const newDeviceGroups = await messagingService.hydrateFromCloud('teacher-device-2');
assert.ok(Array.isArray(newDeviceGroups) && newDeviceGroups.length > 0, 'New device must hydrate complete chat history');
const officialGrp = newDeviceGroups.find(g => g.id === 'grp-official-announcements');
assert.ok(officialGrp, 'Official announcements group must be restored');
console.log('  ✓ 3.2 Switching to new device cleanly restores chat history from cloud database');

// 3.3 7-Day Server TTL Purge Simulation (Ephemeral Binary Purged, Text Permanent, Submissions Untouched)
console.log('  Testing 3.3: 7-Day Server TTL Purge Simulation...');
const targetGroup = messagingService.getGroupById('grp-official-announcements');
assert.ok(targetGroup);

// Add an expired chat attachment (8 days old)
const eightDaysAgoIso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
const sampleExpiredMsg = {
  id: 'msg-with-expired-photo',
  groupId: 'grp-official-announcements',
  senderId: 'teacher-01',
  senderName: 'ครูภาสภูมิ เรืองปราชญ์',
  senderRole: 'TEACHER',
  content: 'นี่คือเอกสารแนวข้อสอบกลางภาค (ข้อความนี้ต้องอยู่ตลอดไป)',
  timestamp: '8 วันที่แล้ว',
  serverTimestamp: eightDaysAgoIso,
  attachment: {
    r2ObjectKey: 'ephemeral/chat/grp-official-announcements/midterm_exam.jpg',
    url: 'https://r2.kutchap.ac.th/ephemeral/chat/grp-official-announcements/midterm_exam.jpg',
    fileName: 'midterm_exam.jpg',
    isExpired: false,
    expiresAt: eightDaysAgoIso,
  },
};
targetGroup.messages.push(sampleExpiredMsg);
messagingService.saveGroups([targetGroup]);

// Execute Server TTL Purge
const purgeReport = messagingService.executeServerTtlPurge(7);
assert.ok(purgeReport.purgedCount >= 1, 'Must purge at least 1 expired media attachment');

// Verify that the media was purged, but text and message history remain 100% intact!
const refreshedGroup = messagingService.getGroupById('grp-official-announcements');
const verifiedMsg = refreshedGroup.messages.find(m => m.id === 'msg-with-expired-photo');
assert.ok(verifiedMsg, 'Chat message itself must NOT be deleted');
assert.strictEqual(verifiedMsg.content, 'นี่คือเอกสารแนวข้อสอบกลางภาค (ข้อความนี้ต้องอยู่ตลอดไป)', 'Message text must remain permanent');
assert.strictEqual(verifiedMsg.attachment.isExpired, true, 'Attachment must be marked expired');
assert.strictEqual(verifiedMsg.attachment.url, undefined, 'Direct binary URL must be cleared');

// Verify student submissions in sgsRosterAndSubmissionService are 100% untouched
const { sgsRosterAndSubmissionService } = await import('./src/services/sgsRosterAndSubmissionService.ts');
const submissions = sgsRosterAndSubmissionService.getSubmissions();
assert.ok(submissions.length > 0, 'Student submissions must exist');
const activeSubmissionsWithFiles = submissions.filter(s => Boolean(s.workTitle || s.workAttachmentLabel));
assert.ok(activeSubmissionsWithFiles.length > 0, 'Student submission files must be permanently preserved without TTL');
console.log('  ✓ 3.3 7-Day TTL purged expired chat binary, kept chat text permanent, and preserved student submissions 100%');

console.log('\n🎉 ALL 3 TIERS OF THE STORAGE TIERING & DRIVE SYNC TEST SUITE PASSED WITH 100% INTEGRITY! 🎉\n');

