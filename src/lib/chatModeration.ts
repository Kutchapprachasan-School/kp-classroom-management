// src/lib/chatModeration.ts

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAX_MESSAGES_PER_WINDOW = 5;
const WINDOW_DURATION_MS = 10 * 1000; // 10 วินาที

// เก็บประวัติเวลาที่ส่งข้อความล่าสุดรายบุคคล (Sliding Window)
const userMessageTimestamps = new Map<string, number[]>();

/**
 * ตรวจสอบ Rate Limit: สูงสุดไม่เกิน 5 ข้อความ ต่อ 10 วินาที ต่อผู้ใช้
 */
export function checkChatRateLimit(userId: string, nowMs = Date.now()): RateLimitCheckResult {
  const history = userMessageTimestamps.get(userId) || [];
  const windowStart = nowMs - WINDOW_DURATION_MS;

  // กรองเฉพาะเวลาที่อยู่ในช่วง 10 วินาทีล่าสุด
  const recentTimestamps = history.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    const oldestInWindow = recentTimestamps[0];
    const retryAfterMs = Math.max(1000, oldestInWindow + WINDOW_DURATION_MS - nowMs);
    userMessageTimestamps.set(userId, recentTimestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  recentTimestamps.push(nowMs);
  userMessageTimestamps.set(userId, recentTimestamps);

  return {
    allowed: true,
    remaining: MAX_MESSAGES_PER_WINDOW - recentTimestamps.length,
    retryAfterSeconds: 0,
  };
}

// คำศัพท์ปกติในบทเรียนที่มีตัวสะกดซ้อนกับคำไม่สุภาพ (ป้องกัน False Positive)
const SAFE_EDUCATIONAL_WORDS = [
  'หีบ',
  'ห่วงโซ่',
  'รัสเซีย',
  'อัสสัม',
  'วิสัชนา',
  'หัสดี',
  'กษัตริย์',
  'สัจจะ',
  'แตงกวา',
  'กวาง',
];

// รายการคำไม่เหมาะสมในบริบทสถานศึกษา
const PROFANITY_PATTERNS: RegExp[] = [
  /กู/g,
  /มึง/g,
  /ควย/g,
  /เย็ด/g,
  /เหี้ย/g,
  /สัส/g,
  /ชาติชั่ว/g,
  /ระยำ/g,
  /ตอแหล/g,
  /ส้นตีน/g,
  /\b(fuck|shit|bitch|asshole|dick|bastard)\b/gi,
];

/**
 * กรองและแปลงคำหยาบคายเป็น *** โดยไม่กระทบคำศัพท์วิชาการปกติ
 */
export function sanitizeSchoolChatContent(rawText: string): {
  cleanText: string;
  hasProfanity: boolean;
} {
  if (!rawText) {
    return { cleanText: '', hasProfanity: false };
  }

  // 1. พักคำศัพท์ปกติไว้ชั่วคราวด้วย Placeholder
  let workingText = rawText;
  const placeholders: { token: string; word: string }[] = [];

  SAFE_EDUCATIONAL_WORDS.forEach((safeWord, idx) => {
    if (workingText.includes(safeWord)) {
      const token = `__KP_SAFE_${idx}__`;
      placeholders.push({ token, word: safeWord });
      workingText = workingText.split(safeWord).join(token);
    }
  });

  // 2. ตรวจสอบและแทนที่คำไม่สุภาพด้วย ***
  let hasProfanity = false;
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(workingText)) {
      hasProfanity = true;
      workingText = workingText.replace(pattern, '***');
    }
  }

  // 3. คืนค่าคำศัพท์ปกติกลับเข้าประโยค
  for (const item of placeholders) {
    workingText = workingText.split(item.token).join(item.word);
  }

  return {
    cleanText: workingText,
    hasProfanity,
  };
}
