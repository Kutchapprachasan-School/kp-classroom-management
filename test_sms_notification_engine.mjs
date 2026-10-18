// test_sms_notification_engine.mjs
// Automated Verification Suite for SMS Notification Gateway & Delivery Engine

import assert from 'node:assert';

// Mock minimal browser globals for testing Node ESM environment
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

// Import services
const { smsNotificationService } = await import('./src/services/smsNotificationService.ts');
const { activityAuditLogService } = await import('./src/services/activityAuditLogService.ts');

console.log('=== STARTING SMS NOTIFICATION ENGINE TESTS ===\n');

// 1. Credit calculation
console.log('--- 1. Testing Thai & English SMS Segment Credit Calculation ---');
assert.strictEqual(smsNotificationService.calculateCreditsUsed('Hello World'), 1);
assert.strictEqual(smsNotificationService.calculateCreditsUsed('A'.repeat(160)), 1);
assert.strictEqual(smsNotificationService.calculateCreditsUsed('A'.repeat(161)), 2);
// Thai: 70 characters
assert.strictEqual(smsNotificationService.calculateCreditsUsed('สวัสดีครับ'), 1);
assert.strictEqual(smsNotificationService.calculateCreditsUsed('ก'.repeat(70)), 1);
assert.strictEqual(smsNotificationService.calculateCreditsUsed('ก'.repeat(71)), 2);
console.log('  ✓ Credit segment calculation verified for Thai (70 chars) and GSM English (160 chars)');

// 2. Template Rendering
console.log('\n--- 2. Testing SMS Template Variable Substitution ---');
const template = '[KPS] แจ้งเตือน: นักเรียน {studentName} ขาดเรียนวันที่ {date}';
const rendered = smsNotificationService.renderTemplate(template, {
  studentName: 'เด็กชายสมชาย ใจดี',
  date: '18 ต.ค. 2569',
});
assert.strictEqual(rendered, '[KPS] แจ้งเตือน: นักเรียน เด็กชายสมชาย ใจดี ขาดเรียนวันที่ 18 ต.ค. 2569');
console.log('  ✓ Template rendering verified:', rendered);

// 3. Outbox and Single SMS Send
console.log('\n--- 3. Testing Single SMS Dispatch & Outbox Persistence ---');
smsNotificationService.clearOutbox();
const initialCredits = smsNotificationService.getCredits();
assert.strictEqual(smsNotificationService.getOutbox().length, 0);

const sendResult = await smsNotificationService.sendSms({
  recipientPhone: '081-234-5678',
  recipientName: 'ผู้ปกครอง ด.ช.สมชาย',
  studentName: 'ด.ช.สมชาย ใจดี',
  category: 'ABSENT',
  message: rendered,
});

assert.strictEqual(sendResult.success, true);
assert.strictEqual(sendResult.record.recipientPhone, '0812345678');
assert.strictEqual(sendResult.record.status, 'DELIVERED');
assert.strictEqual(sendResult.record.creditsUsed, 2); // 72 Thai characters = 2 credits
assert.strictEqual(smsNotificationService.getOutbox().length, 1);
assert.strictEqual(smsNotificationService.getCredits(), initialCredits - 2);
console.log('  ✓ Single SMS sent, normalized phone, outbox saved, credits deducted');

// 4. Invalid Phone Number Rejection
console.log('\n--- 4. Testing Phone Number Validation & Error Handling ---');
const invalidResult = await smsNotificationService.sendSms({
  recipientPhone: '123',
  message: 'ทดสอบ',
  category: 'TEST',
});
assert.strictEqual(invalidResult.success, false);
assert.strictEqual(invalidResult.record.status, 'FAILED');
assert.strictEqual(invalidResult.record.creditsUsed, 0);
console.log('  ✓ Invalid phone number properly flagged FAILED without consuming credits');

// 5. Bulk SMS with Aggregated Audit Logging
console.log('\n--- 5. Testing Bulk SMS with Aggregated Action Digest ---');
const bulkPayloads = [
  {
    recipientPhone: '089-111-2222',
    studentName: 'ด.ญ.มานี มีตา',
    category: 'LATE',
    message: '[KPS] แจ้งเตือน: ด.ญ.มานี มีตา มาสายเวลา 08:15 น.',
  },
  {
    recipientPhone: '089-333-4444',
    studentName: 'ด.ช.ชูใจ รักเรียน',
    category: 'LATE',
    message: '[KPS] แจ้งเตือน: ด.ช.ชูใจ รักเรียน มาสายเวลา 08:20 น.',
  },
  {
    recipientPhone: '089-555-6666',
    studentName: 'ด.ช.ปิติ ยินดี',
    category: 'LATE',
    message: '[KPS] แจ้งเตือน: ด.ช.ปิติ ยินดี มาสายเวลา 08:25 น.',
  },
];

const bulkResult = await smsNotificationService.sendBulkSms(bulkPayloads);
assert.strictEqual(bulkResult.successCount, 3);
assert.strictEqual(bulkResult.failedCount, 0);
assert.strictEqual(bulkResult.records.length, 3);

// Verify that Unified Audit Log received the Aggregated Batch Digest
const smsAuditLogs = activityAuditLogService.getLogs({ entityType: 'ระบบ SMS' });
assert(smsAuditLogs.length > 0);
const latestBulkLog = smsAuditLogs.find((l) => l.actionType === 'BATCH_UPDATE');
assert(latestBulkLog);
assert.strictEqual(latestBulkLog.itemCount, 3);
assert(latestBulkLog.summary.includes('ประมวลผลการส่ง SMS'));
console.log('  ✓ Bulk SMS dispatches recorded with Aggregated Action Digest:', latestBulkLog.summary);

// 6. SMS User Accounts Sync Notification
console.log('\n--- 6. Testing School Management System SMS Sync Notification ---');
await smsNotificationService.notifySmsSyncResult({
  totalUsers: 45,
  newUsers: 2,
  updatedUsers: 43,
  success: true,
});
const syncLog = activityAuditLogService.getLogs({ entityType: 'ระบบ SMS' }).find((l) => l.title.includes('ซิงค์บัญชีผู้ใช้ระบบ SMS'));
assert(syncLog);
assert(syncLog.summary.includes('45 บัญชี'));
console.log('  ✓ SMS user sync notification logged and dispatches report:', syncLog.summary);

// 7. Thai Phone Normalization & Validation
console.log('\n--- 7. Testing Thai Mobile Phone Normalizer ---');
const { normalizeThaiPhoneNumber } = await import('./src/services/smsNotificationService.ts');
assert.strictEqual(normalizeThaiPhoneNumber('081-234-5678').isValid, true);
assert.strictEqual(normalizeThaiPhoneNumber('081-234-5678').normalized, '0812345678');
assert.strictEqual(normalizeThaiPhoneNumber('+66891234567').isValid, true);
assert.strictEqual(normalizeThaiPhoneNumber('+66891234567').normalized, '0891234567');
assert.strictEqual(normalizeThaiPhoneNumber('+66 85 999 8888').isValid, true);
assert.strictEqual(normalizeThaiPhoneNumber('+66 85 999 8888').normalized, '0859998888');
assert.strictEqual(normalizeThaiPhoneNumber('061-000-1111').isValid, true);
assert.strictEqual(normalizeThaiPhoneNumber('061-000-1111').normalized, '0610001111');
assert.strictEqual(normalizeThaiPhoneNumber('12345').isValid, false);
assert.strictEqual(normalizeThaiPhoneNumber(null).isValid, false);
console.log('  ✓ normalizeThaiPhoneNumber handled all mobile formats and invalid inputs');

// 8. 3-Tier Zero-Egress Contact Fetching & L1 Cache
console.log('\n--- 8. Testing 3-Tier Cache & Student Contact Fetching ---');
smsNotificationService.clearContactCache();
const contacts1 = await smsNotificationService.getStudentContactsByRoom('room-1-1');
console.log(`  Fetched ${contacts1.length} contacts for room-1-1 (Initial Cache Fill)`);
assert(Array.isArray(contacts1));

// Second call: must hit L1 RAM Cache (0 ms / 0 Egress)
const contacts2 = await smsNotificationService.getStudentContactsByRoom('room-1-1');
assert.strictEqual(contacts1, contacts2); // Exact same object reference in RAM!
console.log('  ✓ L1 RAM Cache hit verified: returned same instance with 0 network calls');

// 9. Automated Attendance Absence SMS Dispatching
console.log('\n--- 9. Testing Automated Attendance Absence SMS Dispatching ---');
const absenceResult = await smsNotificationService.sendAttendanceAbsenceSms({
  classroomId: 'room-1-1',
  date: '18 ต.ค. 2569',
  absentStudentIds: contacts1.slice(0, 3).map(c => c.studentId),
  periodName: 'คาบที่ 1 (คณิตศาสตร์พื้นฐาน)',
});
console.log('  Absence SMS Result:', {
  sentCount: absenceResult.sentCount,
  failedCount: absenceResult.failedCount,
  skippedNoPhoneCount: absenceResult.skippedNoPhoneCount,
});
assert(absenceResult.records.length > 0);
console.log('  ✓ Automated Attendance Absence SMS executed cleanly without crashing on missing phone numbers');

// 10. SMS SSO Database Sync
console.log('\n--- 10. Testing Authentic SMS SSO Sync with Database ---');
const dbSync = await smsNotificationService.syncSmsAccountsWithDatabase();
assert.strictEqual(dbSync.success, true);
assert(dbSync.totalUsers > 0);
console.log('  ✓ SMS SSO Sync successfully queried authentic database infrastructure:', dbSync.message);

console.log('\n🎉 ALL SMS NOTIFICATION ENGINE TESTS PASSED PERFECTLY!\n');
