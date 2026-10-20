// src/config/gachaStarTable.ts
// ตารางการพัฒนาสกิลคู่หู 1★ → 5★ (กติกาเกม ไม่ใช่ข้อมูลผู้ใช้)
// ทุกค่าในตารางนี้ถูกใช้งานจริงโดย gachaSkillEngine / weeklyQuizService

export type GachaRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC';

export const MAX_BUDDY_STARS = 5;

export interface BuddyStarTier {
  /** โบนัส XP เป็นเปอร์เซ็นต์ (เช่น 25 = x1.25) */
  xp: number;
  /** โบนัสเหรียญเป็นเปอร์เซ็นต์ */
  coin: number;
  /** ขยายเวลาส่งงานโดยไม่ถูกหักคะแนนสาย (ชั่วโมง) */
  graceHours: number;
  /** สิทธิ์ตัดช้อยส์ 50:50 ต่อสัปดาห์ */
  hints: number;
  /** โล่รักษาสถิติเข้าเรียนต่อสัปดาห์ */
  shields: number;
  /** โบนัส XP ควิซเพิ่มเติม (%) เมื่อตอบถูกทุกข้อ */
  perfectXpBonus?: number;
  /** โอกาส (%) ที่ XP ควิซรายสัปดาห์จะคูณสอง */
  quizDoubleXpChance?: number;
  /** จำนวนข้อที่นับว่าถูกฟรีในควิซรายสัปดาห์ */
  freeQuizCorrect?: number;
  /** เศษดาวโบนัสเมื่อตอบถูกทุกข้อ */
  shardsOnPerfect?: number;
  /** ได้ตั๋วสุ่มเพิ่ม 1 ใบ ทุกครั้งที่ทำควิซรายสัปดาห์ครบ 4 ครั้ง */
  ticketEveryFourQuizzes?: boolean;
  /** ค่าความสุขขั้นต่ำที่คู่หูจะไม่ลดต่ำกว่า */
  moodFloor?: number;
  /** เหรียญฐานเมื่อลูบหัว (ก่อนคูณโบนัสเหรียญ) */
  cheerCoins?: number;
  /** ความสุขที่ได้รับเมื่อลูบหัว */
  cheerHappiness?: number;
}

type Extra = Partial<
  Omit<BuddyStarTier, 'xp' | 'coin' | 'graceHours' | 'hints' | 'shields'>
>;

const t = (
  xp: number,
  coin: number,
  graceHours: number,
  hints: number,
  shields: number,
  extra: Extra = {}
): BuddyStarTier => ({ xp, coin, graceHours, hints, shields, ...extra });

export const BUDDY_STAR_TABLE: Record<string, BuddyStarTier[]> = {
  // ===== COMMON =====
  'buddy-c1': [t(5, 0, 0, 0, 0), t(8, 5, 0, 0, 0), t(11, 5, 6, 0, 0), t(15, 10, 12, 0, 0), t(20, 10, 18, 0, 0)],
  'buddy-c2': [t(5, 0, 0, 0, 0), t(8, 0, 0, 1, 0), t(12, 0, 0, 2, 0), t(16, 10, 0, 2, 0), t(22, 10, 0, 3, 0)],
  'buddy-c3': [
    t(5, 0, 0, 0, 0, { cheerHappiness: 15, cheerCoins: 15 }),
    t(8, 0, 0, 0, 0, { cheerHappiness: 20, cheerCoins: 20 }),
    t(11, 0, 0, 0, 0, { cheerHappiness: 20, cheerCoins: 20 }),
    t(15, 0, 0, 0, 0, { cheerHappiness: 20, cheerCoins: 30 }),
    t(20, 0, 0, 0, 0, { cheerHappiness: 20, cheerCoins: 40, moodFloor: 50 }),
  ],
  'buddy-c4': [t(5, 0, 0, 0, 0), t(8, 0, 0, 1, 0), t(12, 10, 0, 1, 0), t(16, 10, 0, 2, 0), t(20, 20, 0, 3, 0)],
  // ===== UNCOMMON =====
  'buddy-u1': [t(10, 5, 0, 0, 0), t(14, 10, 0, 0, 0), t(18, 10, 0, 0, 1), t(23, 15, 0, 0, 1), t(30, 25, 0, 0, 2)],
  'buddy-u2': [
    t(10, 0, 0, 1, 0),
    t(14, 0, 0, 2, 0),
    t(18, 0, 0, 2, 0, { perfectXpBonus: 10 }),
    t(23, 0, 0, 3, 0, { perfectXpBonus: 10 }),
    t(30, 0, 0, 4, 0, { perfectXpBonus: 20 }),
  ],
  'buddy-u3': [t(10, 0, 0, 0, 0), t(14, 0, 6, 0, 0), t(18, 0, 12, 0, 0), t(23, 15, 18, 0, 0), t(30, 25, 24, 0, 0)],
  'buddy-u4': [t(10, 5, 0, 0, 0), t(14, 10, 0, 0, 0), t(18, 10, 0, 0, 1), t(23, 20, 0, 0, 1), t(30, 25, 0, 0, 2)],
  // ===== RARE =====
  'buddy-r1': [t(15, 10, 0, 2, 0), t(20, 15, 12, 2, 0), t(26, 15, 12, 3, 0), t(33, 25, 18, 3, 0), t(42, 35, 18, 4, 0)],
  'buddy-r2': [t(15, 15, 0, 0, 0), t(20, 20, 0, 0, 1), t(26, 25, 12, 0, 1), t(33, 30, 12, 0, 2), t(42, 40, 12, 0, 3)],
  'buddy-r3': [t(15, 10, 12, 0, 0), t(20, 15, 18, 0, 0), t(26, 20, 18, 2, 0), t(33, 28, 24, 2, 0), t(42, 35, 36, 2, 0)],
  'buddy-r4': [
    t(20, 10, 0, 2, 0),
    t(25, 15, 0, 3, 0),
    t(32, 20, 0, 3, 0, { perfectXpBonus: 15 }),
    t(40, 25, 0, 4, 0, { perfectXpBonus: 15 }),
    t(50, 35, 0, 5, 0, { perfectXpBonus: 15 }),
  ],
  // ===== EPIC =====
  'buddy-e1': [t(25, 20, 24, 2, 0), t(32, 25, 24, 3, 0), t(40, 30, 24, 3, 1), t(50, 38, 36, 4, 1), t(65, 50, 48, 5, 1)],
  'buddy-e2': [t(25, 20, 24, 0, 1), t(32, 25, 36, 0, 2), t(40, 30, 48, 2, 2), t(50, 38, 48, 3, 3), t(65, 50, 72, 3, 4)],
  'buddy-e3': [
    t(25, 25, 0, 3, 0),
    t(32, 32, 0, 3, 0, { quizDoubleXpChance: 20 }),
    t(40, 40, 0, 4, 0, { quizDoubleXpChance: 20 }),
    t(50, 50, 0, 4, 0, { quizDoubleXpChance: 35 }),
    t(65, 65, 0, 5, 0, { quizDoubleXpChance: 35, shardsOnPerfect: 5 }),
  ],
  'buddy-e4': [
    t(25, 20, 0, 0, 0),
    t(32, 26, 0, 0, 2),
    t(40, 34, 0, 3, 2),
    t(50, 42, 36, 3, 2),
    t(65, 55, 36, 4, 3, { moodFloor: 100 }),
  ],
  // ===== LEGENDARY =====
  'buddy-l1': [t(35, 30, 36, 3, 2), t(45, 38, 36, 4, 2), t(58, 48, 48, 4, 3), t(72, 60, 48, 5, 3), t(90, 75, 60, 6, 4)],
  'buddy-l2': [
    t(35, 30, 0, 4, 0, { freeQuizCorrect: 1 }),
    t(45, 38, 0, 5, 0, { freeQuizCorrect: 1 }),
    t(58, 48, 48, 5, 2, { freeQuizCorrect: 1 }),
    t(72, 60, 48, 6, 2, { freeQuizCorrect: 1 }),
    t(90, 75, 48, 8, 2, { freeQuizCorrect: 2 }),
  ],
  'buddy-l3': [
    t(35, 35, 36, 0, 3),
    t(45, 45, 36, 3, 3),
    t(58, 55, 36, 3, 4),
    t(72, 68, 48, 4, 4),
    t(90, 85, 48, 4, 5, { ticketEveryFourQuizzes: true }),
  ],
  'buddy-l4': [t(35, 35, 36, 3, 2), t(45, 45, 36, 3, 3), t(58, 55, 48, 4, 3), t(72, 68, 48, 5, 4), t(90, 85, 48, 6, 5)],
  // ===== MYTHIC =====
  'buddy-m1': [t(50, 40, 48, 5, 3), t(70, 55, 48, 6, 4), t(95, 70, 60, 7, 4), t(120, 85, 60, 8, 5), t(150, 100, 72, 10, 6)],
  'buddy-m2': [
    t(50, 40, 0, 5, 3, { moodFloor: 100 }),
    t(70, 55, 0, 6, 4, { moodFloor: 100 }),
    t(95, 70, 60, 8, 4, { moodFloor: 100 }),
    t(120, 85, 60, 9, 5, { moodFloor: 100 }),
    t(150, 100, 60, 10, 6, { moodFloor: 100 }),
  ],
};

/** อ่านค่าสกิลของคู่หูตามระดับดาว (1–5) */
export const getBuddyStarTier = (buddyId: string, stars: number): BuddyStarTier => {
  const rows = BUDDY_STAR_TABLE[buddyId];
  const idx = Math.min(MAX_BUDDY_STARS, Math.max(1, Math.floor(stars || 1))) - 1;
  if (!rows) return t(0, 0, 0, 0, 0);
  return rows[idx];
};
