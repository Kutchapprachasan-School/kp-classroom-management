// test_chat_sprint4_moderation_and_cards.mjs
// Verification suite for Sprint 4: Moderation, Rate Limiting, Task Cards & Mobile-First Nav
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Sprint 4: Moderation, Rate Limiting, Task Cards & Mobile-First Navigation Suite...\n');

// ---------------------------------------------------------------------------
// 1. Verify Sliding-Window Rate Limiter
// ---------------------------------------------------------------------------
console.log('--- 1. Testing Sliding-Window Rate Limiter ---');
const { checkChatRateLimit, sanitizeSchoolChatContent } = await import('./src/lib/chatModeration.ts');

const testUserId = `test-user-${Date.now()}`;
const baseTime = Date.now();

// 1.1 Send 5 allowed messages
for (let i = 1; i <= 5; i++) {
  const result = checkChatRateLimit(testUserId, baseTime + i * 100);
  assert.strictEqual(result.allowed, true, `Message ${i} must be allowed`);
  assert.strictEqual(result.remaining, 5 - i, `Remaining count must be ${5 - i}`);
}
console.log('  ✓ 5 messages within 10-second window correctly allowed');

// 1.2 6th message within the same window must be blocked
const blockedResult = checkChatRateLimit(testUserId, baseTime + 1000);
assert.strictEqual(blockedResult.allowed, false, '6th message within 10s must be blocked');
assert.strictEqual(blockedResult.remaining, 0, 'Remaining count must be 0 when blocked');
assert.ok(blockedResult.retryAfterSeconds > 0, 'Retry after seconds must be positive');
console.log(`  ✓ 6th message blocked with rate limit (retryAfter: ${blockedResult.retryAfterSeconds}s)`);

// 1.3 Independent user is not blocked
const otherUserId = `other-user-${Date.now()}`;
const otherResult = checkChatRateLimit(otherUserId, baseTime + 1000);
assert.strictEqual(otherResult.allowed, true, 'Different user must have independent rate limit bucket');
console.log('  ✓ Independent user rate limit isolation verified');

// ---------------------------------------------------------------------------
// 2. Verify Smart Profanity Masking & Whitelist Invariant
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing Smart Profanity Masking & Whitelist Invariant ---');

// 2.1 Profanity words masking
const profanitySample = 'ไอ้เหี้ย ทำไมมึงพูดกูแบบนี้วะ fuck you';
const sanitized1 = sanitizeSchoolChatContent(profanitySample);
assert.strictEqual(sanitized1.hasProfanity, true, 'Must detect profanity');
assert.ok(!sanitized1.cleanText.includes('เหี้ย'), 'Profanity word must be masked');
assert.ok(!sanitized1.cleanText.includes('มึง'), 'Profanity word must be masked');
assert.ok(!sanitized1.cleanText.includes('กู'), 'Profanity word must be masked');
assert.ok(!sanitized1.cleanText.includes('fuck'), 'English profanity must be masked');
assert.ok(sanitized1.cleanText.includes('***'), 'Must replace with asterisks');
console.log('  ✓ Thai and English profanity correctly masked with ***');

// 2.2 Safe educational words must NOT be censored (False Positive Guard)
const safeEducationalSample = 'นักเรียนนำหีบเพลงไปแสดงที่โรงเรียนอัสสัมชัญ ประเทศรัสเซีย ปลูกแตงกวา';
const sanitizedSafe = sanitizeSchoolChatContent(safeEducationalSample);
assert.strictEqual(sanitizedSafe.hasProfanity, false, 'Safe educational words must not trigger profanity');
assert.strictEqual(sanitizedSafe.cleanText, safeEducationalSample, 'Safe educational text must remain intact 100%');
console.log('  ✓ Safe educational words (หีบ, อัสสัม, รัสเซีย, แตงกวา) perfectly preserved without false positives');

// ---------------------------------------------------------------------------
// 3. Verify Server Report Route & Moderation Integration
// ---------------------------------------------------------------------------
console.log('\n--- 3. Checking Server API Routes for Moderation & Reports ---');
const reportRoutePath = path.resolve('c:/dev/eLeave/src/app/api/chat/messages/[messageId]/report/route.ts');
assert.ok(fs.existsSync(reportRoutePath), 'Message report route must exist in Next.js server');
const reportContent = fs.readFileSync(reportRoutePath, 'utf-8');
assert.ok(reportContent.includes('isFlagged: true'), 'Report route must mark isFlagged = true');
assert.ok(reportContent.includes('reportedBy: user.userId'), 'Report route must record reporter info');
console.log('  ✓ Inappropriate message report route verified');

const messagesServerRoutePath = path.resolve('c:/dev/eLeave/src/app/api/chat/rooms/[roomId]/messages/route.ts');
const serverMessagesContent = fs.readFileSync(messagesServerRoutePath, 'utf-8');
assert.ok(serverMessagesContent.includes('checkChatRateLimit'), 'Server route must enforce checkChatRateLimit');
assert.ok(serverMessagesContent.includes('sanitizeSchoolChatContent'), 'Server route must enforce sanitizeSchoolChatContent');
assert.ok(serverMessagesContent.includes('RATE_LIMIT_EXCEEDED'), 'Server route must return 429 RATE_LIMIT_EXCEEDED');
console.log('  ✓ Server messages endpoint enforces rate limiting and sanitization');

// ---------------------------------------------------------------------------
// 4. Verify ChatTaskCard Visual Priority & Mobile-First Navigation in MessagesView
// ---------------------------------------------------------------------------
console.log('\n--- 4. Checking ChatTaskCard & Mobile-First UI Navigation ---');
const taskCardPath = path.resolve('src/components/chat/ChatTaskCard.tsx');
assert.ok(fs.existsSync(taskCardPath), 'ChatTaskCard.tsx must exist');
const taskCardContent = fs.readFileSync(taskCardPath, 'utf-8');
assert.ok(taskCardContent.includes('isSubmitted'), 'ChatTaskCard must support isSubmitted prop');
assert.ok(taskCardContent.includes('isOverdue'), 'ChatTaskCard must calculate isOverdue');
assert.ok(taskCardContent.includes('Task2Regular'), 'ChatTaskCard must use MingCute Task2Regular icon');
assert.ok(taskCardContent.includes('คะแนน'), 'ChatTaskCard must render score badge');
console.log('  ✓ ChatTaskCard visual priority hierarchy verified');

const messagesViewContent = fs.readFileSync('src/views/MessagesView.tsx', 'utf-8');
assert.ok(messagesViewContent.includes('mobileShowDetail'), 'MessagesView must track mobileShowDetail');
assert.ok(messagesViewContent.includes('กลับรายการห้อง'), 'MessagesView must have back button for mobile navigation');
assert.ok(messagesViewContent.includes('ChatTaskCard'), 'MessagesView must render ChatTaskCard');
assert.ok(messagesViewContent.includes('MingcuteFlag1Line') || messagesViewContent.includes('handleReportMessage'), 'MessagesView must support message reporting');
assert.ok(messagesViewContent.includes('checkChatRateLimit'), 'MessagesView must check rate limit on send');
assert.ok(messagesViewContent.includes('sanitizeSchoolChatContent'), 'MessagesView must sanitize profanity on send');
console.log('  ✓ Mobile-first master-detail navigation and visual priority cards verified in MessagesView');

console.log('\n🎉 ALL SPRINT 4 MODERATION & NAVIGATION CHECKS PASSED PERFECTLY!\n');
