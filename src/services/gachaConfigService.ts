// src/services/gachaConfigService.ts
// ตั้งค่าระบบกาชาโดยแอดมิน (คีย์เดียวขนาดเล็ก: kp_gacha_admin_config_v1)
// - ซิงค์ผ่าน cloudDataService แบบ delta (คีย์ขึ้นต้น kp_) จึงไม่เปลืองแบนด์วิดท์
// - ห้ามเก็บข้อมูลนักเรียนในคีย์นี้ (ข้อมูลรายคนอยู่ที่ kp_gacha_state:<studentId>)

import type { GachaRarity } from '../config/gachaStarTable';
import type { WeeklyQuizQuestion } from '../config/weeklyQuizBank';

export const GACHA_CONFIG_STORAGE_KEY = 'kp_gacha_admin_config_v1';
export const GACHA_CONFIG_UPDATED_EVENT = 'kp_gacha_config_updated';

export const RARITY_ORDER: GachaRarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
];

export interface GachaAdminConfig {
  version: 1;
  updatedAt: string;
  /** เปิด/ปิดระบบกาชาทั้งหมด (ปิด = สุ่มไม่ได้ แต่ดูคลังคู่หูได้) */
  enabled: boolean;
  /** อัตราการสุ่มเป็นเปอร์เซ็นต์ ผลรวมต้องเท่ากับ 100 */
  rates: Record<GachaRarity, number>;
  /** จำนวนครั้งที่สุ่มแล้วการันตี Epic ขึ้นไป */
  pityMax: number;
  /** ตั๋วสุ่มเริ่มต้นของนักเรียนใหม่ */
  starterTickets: number;
  /** เหรียญเริ่มต้นของนักเรียนใหม่ */
  starterCoins: number;
  /** คู่หูเริ่มต้นของนักเรียนใหม่ */
  starterBuddyId: string;
  /** เศษดาวที่ได้เมื่อสุ่มได้คู่หูซ้ำ */
  shardsOnDuplicate: Record<GachaRarity, number>;
  /** เศษดาวที่ใช้อัปเกรดดาว: [1→2, 2→3, 3→4, 4→5] */
  starUpgradeCosts: Record<GachaRarity, [number, number, number, number]>;
  /** เศษดาวที่ใช้แลกปลดล็อกคู่หูโดยตรง */
  unlockCostShards: Record<GachaRarity, number>;
  shop: {
    shardsPerTicket: number;
    coinsPerTicket: number;
    foodPriceCoins: number;
    snackPriceCoins: number;
    quizHintPriceCoins: number;
    streakShieldPriceCoins: number;
  };
  rewards: {
    /** เช็คชื่อมาเรียนกี่วันในสัปดาห์ (จ–ศ) จึงรับตั๋วได้ */
    attendanceDaysRequired: number;
    attendanceTickets: number;
    /** ตั๋วต่อชิ้นงานที่ส่งแล้ว */
    submissionTickets: number;
    /** ตั๋วเมื่อตอบถูกทุกข้อในควิซรายสัปดาห์ */
    quizPerfectTickets: number;
    /** เพดานตั๋วฟรีที่รับจากภารกิจได้ต่อสัปดาห์ (0 = ไม่จำกัด) */
    weeklyFreeTicketCap: number;
  };
  quiz: {
    baseXpPerWeek: number;
    baseCoinsPerWeek: number;
    /** เปอร์เซ็นต์ของรางวัลเต็มตามจำนวนข้อที่ถูก index = จำนวนข้อถูก (0–3) */
    rewardPercentByCorrect: [number, number, number, number];
    /** แก้โจทย์รายข้อ (key = id เช่น w01-q1) */
    questionOverrides: Record<string, WeeklyQuizQuestion>;
  };
}

export const DEFAULT_GACHA_CONFIG: GachaAdminConfig = {
  version: 1,
  updatedAt: '',
  enabled: true,
  rates: {
    COMMON: 40,
    UNCOMMON: 35,
    RARE: 18,
    EPIC: 5,
    LEGENDARY: 1.8,
    MYTHIC: 0.2,
  },
  pityMax: 80,
  starterTickets: 3,
  starterCoins: 0,
  starterBuddyId: 'buddy-c1',
  shardsOnDuplicate: {
    COMMON: 5,
    UNCOMMON: 15,
    RARE: 50,
    EPIC: 150,
    LEGENDARY: 500,
    MYTHIC: 2000,
  },
  starUpgradeCosts: {
    COMMON: [15, 30, 60, 120],
    UNCOMMON: [30, 60, 120, 240],
    RARE: [75, 150, 300, 600],
    EPIC: [200, 400, 800, 1500],
    LEGENDARY: [500, 1000, 2000, 4000],
    MYTHIC: [1000, 2000, 4000, 8000],
  },
  unlockCostShards: {
    COMMON: 60,
    UNCOMMON: 150,
    RARE: 300,
    EPIC: 800,
    LEGENDARY: 2000,
    MYTHIC: 10000,
  },
  shop: {
    shardsPerTicket: 50,
    coinsPerTicket: 200,
    foodPriceCoins: 50,
    snackPriceCoins: 80,
    quizHintPriceCoins: 150,
    streakShieldPriceCoins: 300,
  },
  rewards: {
    attendanceDaysRequired: 5,
    attendanceTickets: 1,
    submissionTickets: 1,
    quizPerfectTickets: 1,
    weeklyFreeTicketCap: 5,
  },
  quiz: {
    baseXpPerWeek: 100,
    baseCoinsPerWeek: 50,
    rewardPercentByCorrect: [10, 35, 65, 100],
    questionOverrides: {},
  },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** รวมค่าที่เก็บไว้กับค่าเริ่มต้น เพื่อให้ฟิลด์ที่เพิ่มใหม่ในอนาคตไม่ทำให้พัง */
const mergeConfig = (stored: Partial<GachaAdminConfig>): GachaAdminConfig => {
  const base = clone(DEFAULT_GACHA_CONFIG);
  return {
    ...base,
    ...stored,
    version: 1,
    rates: { ...base.rates, ...(stored.rates || {}) },
    shardsOnDuplicate: { ...base.shardsOnDuplicate, ...(stored.shardsOnDuplicate || {}) },
    starUpgradeCosts: { ...base.starUpgradeCosts, ...(stored.starUpgradeCosts || {}) },
    unlockCostShards: { ...base.unlockCostShards, ...(stored.unlockCostShards || {}) },
    shop: { ...base.shop, ...(stored.shop || {}) },
    rewards: { ...base.rewards, ...(stored.rewards || {}) },
    quiz: {
      ...base.quiz,
      ...(stored.quiz || {}),
      questionOverrides: { ...(stored.quiz?.questionOverrides || {}) },
    },
  };
};

export const validateGachaConfig = (cfg: GachaAdminConfig): string[] => {
  const errors: string[] = [];
  const sum = RARITY_ORDER.reduce((s, r) => s + num(cfg.rates[r], 0), 0);
  if (Math.abs(sum - 100) > 0.0001) {
    errors.push(`ผลรวมอัตราการสุ่มต้องเท่ากับ 100% (ตอนนี้ ${sum.toFixed(3)}%)`);
  }
  if (RARITY_ORDER.some((r) => cfg.rates[r] < 0)) errors.push('อัตราการสุ่มต้องไม่ติดลบ');
  if (!Number.isInteger(cfg.pityMax) || cfg.pityMax < 1) errors.push('จำนวนโรลการันตีต้องเป็นจำนวนเต็มตั้งแต่ 1');
  if (cfg.starterTickets < 0 || cfg.starterCoins < 0) errors.push('ตั๋วและเหรียญเริ่มต้นต้องไม่ติดลบ');
  if (cfg.shop.shardsPerTicket < 1 || cfg.shop.coinsPerTicket < 1) errors.push('ราคาแลกตั๋วต้องมากกว่า 0');
  if (cfg.rewards.attendanceDaysRequired < 1 || cfg.rewards.attendanceDaysRequired > 5) {
    errors.push('จำนวนวันเช็คชื่อที่ต้องมาเรียนต้องอยู่ระหว่าง 1–5 วัน');
  }
  const pct = cfg.quiz.rewardPercentByCorrect;
  if (pct.length !== 4 || pct.some((p) => p < 0 || p > 100)) {
    errors.push('เปอร์เซ็นต์รางวัลควิซต้องอยู่ระหว่าง 0–100');
  }
  return errors;
};

export const gachaConfigService = {
  getConfig(): GachaAdminConfig {
    if (typeof localStorage === 'undefined') return clone(DEFAULT_GACHA_CONFIG);
    try {
      const raw = localStorage.getItem(GACHA_CONFIG_STORAGE_KEY);
      if (raw) return mergeConfig(JSON.parse(raw));
    } catch {
      // ใช้ค่าเริ่มต้นเมื่อข้อมูลเสียหาย
    }
    return clone(DEFAULT_GACHA_CONFIG);
  },

  /** บันทึกการตั้งค่า (คืนรายการข้อผิดพลาด ถ้ามี = ไม่บันทึก) */
  saveConfig(cfg: GachaAdminConfig): { ok: boolean; errors: string[] } {
    const errors = validateGachaConfig(cfg);
    if (errors.length > 0) return { ok: false, errors };
    const toSave: GachaAdminConfig = { ...cfg, version: 1, updatedAt: new Date().toISOString() };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GACHA_CONFIG_STORAGE_KEY, JSON.stringify(toSave));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GACHA_CONFIG_UPDATED_EVENT, { detail: toSave }));
    }
    return { ok: true, errors: [] };
  },

  resetToDefault(): GachaAdminConfig {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(GACHA_CONFIG_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GACHA_CONFIG_UPDATED_EVENT, { detail: null }));
    }
    return clone(DEFAULT_GACHA_CONFIG);
  },

  resetToDefaults(): GachaAdminConfig {
    return this.resetToDefault();
  },
};
