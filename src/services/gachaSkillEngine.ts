// src/services/gachaSkillEngine.ts
// เครื่องยนต์คำนวณสกิลคู่หูนักเรียน (Active Buddy Skill Engine)
// ค่าสกิลทั้งหมดอ่านจากตารางดาว (config/gachaStarTable.ts) ตามระดับดาว 1★–5★ ที่นักเรียนอัปเกรดไว้จริง
// สิทธิ์ใช้งานรายสัปดาห์ (ตัดช้อยส์ / โล่สถิติ) เก็บในสถานะกาชารายนักเรียน และรีเซ็ตทุกสัปดาห์อัตโนมัติ

import { gachaService, getBuddyStarsFromState, type GachaBuddy, type GachaRarity } from './gachaService';
import { getBuddyStarTier, type BuddyStarTier } from '../config/gachaStarTable';

export interface ActiveBuddyBuffs {
  buddy: GachaBuddy;
  rarity: GachaRarity;
  stars: number;
  tier: BuddyStarTier;
  xpMultiplier: number;
  coinMultiplier: number;
  streakShieldActive: boolean;
  streakShieldCharges: number;
  quizHintAvailable: boolean;
  quizHintCharges: number;
  homeworkGraceHours: number;
  activeEffectsLabels: string[];
}

export interface BuddySkillState {
  remainingQuizHints: number;
  remainingStreakShields: number;
  lastCheerTimestamp?: string;
  totalCheerCount: number;
}

export const BUDDY_SKILL_ACTIVATED_EVENT = 'kp_buddy_skill_activated';
/** ลูบหัวให้รางวัลได้อีกครั้งเมื่อพ้นระยะเวลานี้ (นาที) เพื่อกันการปั๊มเหรียญ */
export const CHEER_COOLDOWN_MINUTES = 30;

const toMultiplier = (percent: number): number => Math.round((1 + percent / 100) * 1000) / 1000;

export const gachaSkillEngine = {
  /** สิทธิ์ที่เหลือของสัปดาห์นี้ (โควตาตามดาว + ไอเทมในกระเป๋า) */
  getSkillState(studentId?: string): BuddySkillState {
    const state = gachaService.getState(studentId);
    const buddyId = state.activeBuddyId;
    const tier = getBuddyStarTier(buddyId, getBuddyStarsFromState(state, buddyId));
    return {
      remainingQuizHints: Math.max(0, tier.hints - state.skillUsage.hintsUsed) + state.inventory.quizHint,
      remainingStreakShields:
        Math.max(0, tier.shields - state.skillUsage.shieldsUsed) + state.inventory.streakShield,
      lastCheerTimestamp: state.skillUsage.lastCheerTimestamp,
      totalCheerCount: state.skillUsage.totalCheerCount,
    };
  },

  /** คำนวณบัฟของคู่หูตัวที่ระบุ ตามระดับดาวที่นักเรียนมีอยู่ (ไม่มี = ใช้ 1★) */
  getBuffsForBuddy(buddy: GachaBuddy, studentId?: string): ActiveBuddyBuffs {
    const state = gachaService.getState(studentId);
    const stars = Math.max(1, getBuddyStarsFromState(state, buddy.id));
    const tier = getBuddyStarTier(buddy.id, stars);
    const skill = this.getSkillState(studentId);

    const hasHints = tier.hints > 0 || state.inventory.quizHint > 0;
    const hasShields = tier.shields > 0 || state.inventory.streakShield > 0;
    const isActive = buddy.id === state.activeBuddyId;
    const hintsLeft = isActive
      ? skill.remainingQuizHints
      : tier.hints + state.inventory.quizHint;
    const shieldsLeft = isActive
      ? skill.remainingStreakShields
      : tier.shields + state.inventory.streakShield;

    const labels: string[] = [`⚡ XP โบนัส +${tier.xp}%`];
    if (tier.coin > 0) labels.push(`🪙 เหรียญภารกิจ +${tier.coin}%`);
    if (tier.graceHours > 0) labels.push(`⏳ ส่งงานช้าได้ ${tier.graceHours} ชม.`);
    if (tier.hints > 0) labels.push(`💡 ตัวช่วยตัดช้อยส์ควิซ (${hintsLeft} ครั้ง)`);
    if (tier.shields > 0) labels.push(`🛡️ โล่รักษาสถิติเข้าเรียน (${shieldsLeft} ชิ้น)`);
    if (tier.perfectXpBonus) labels.push(`🎯 ควิซเต็ม XP เพิ่ม +${tier.perfectXpBonus}%`);
    if (tier.quizDoubleXpChance) labels.push(`🎲 โอกาส XP ควิซคูณสอง ${tier.quizDoubleXpChance}%`);
    if (tier.freeQuizCorrect) labels.push(`✨ นับถูกฟรีในควิซ +${tier.freeQuizCorrect} ข้อ`);
    if (tier.shardsOnPerfect) labels.push(`💎 ควิซเต็มรับเศษดาว +${tier.shardsOnPerfect}`);
    if (tier.ticketEveryFourQuizzes) labels.push('🎟️ ทำควิซครบทุก 4 ครั้ง รับตั๋วสุ่ม +1');
    if (tier.moodFloor) labels.push(`💖 ความสุขคู่หูไม่ต่ำกว่า ${tier.moodFloor}%`);

    return {
      buddy,
      rarity: buddy.rarity,
      stars,
      tier,
      xpMultiplier: toMultiplier(tier.xp),
      coinMultiplier: toMultiplier(tier.coin),
      streakShieldActive: hasShields && shieldsLeft > 0,
      streakShieldCharges: shieldsLeft,
      quizHintAvailable: hasHints && hintsLeft > 0,
      quizHintCharges: hintsLeft,
      homeworkGraceHours: tier.graceHours,
      activeEffectsLabels: labels,
    };
  },

  /** บัฟของคู่หูที่สวมใส่อยู่ */
  getActiveBuffs(studentId?: string): ActiveBuddyBuffs {
    return this.getBuffsForBuddy(gachaService.getActiveBuddy(studentId), studentId);
  },

  calculateEarnedXp(baseXp: number, studentId?: string): number {
    return Math.round(baseXp * this.getActiveBuffs(studentId).xpMultiplier);
  },

  calculateEarnedCoins(baseCoins: number, studentId?: string): number {
    return Math.round(baseCoins * this.getActiveBuffs(studentId).coinMultiplier);
  },

  /** ใช้สิทธิ์ตัดช้อยส์ 50:50 (ใช้โควตารายสัปดาห์ก่อน แล้วจึงใช้ไอเทมในกระเป๋า) */
  consumeQuizHint(studentId?: string): boolean {
    const state = gachaService.getState(studentId);
    const tier = getBuddyStarTier(state.activeBuddyId, getBuddyStarsFromState(state, state.activeBuddyId));
    if (state.skillUsage.hintsUsed < tier.hints) {
      state.skillUsage.hintsUsed += 1;
    } else if (state.inventory.quizHint > 0) {
      state.inventory.quizHint -= 1;
    } else {
      return false;
    }
    gachaService.saveState(state);
    this.notify(state.studentId);
    return true;
  },

  /** ใช้โล่รักษาสถิติการเข้าเรียน */
  consumeStreakShield(studentId?: string): boolean {
    const state = gachaService.getState(studentId);
    const tier = getBuddyStarTier(state.activeBuddyId, getBuddyStarsFromState(state, state.activeBuddyId));
    if (state.skillUsage.shieldsUsed < tier.shields) {
      state.skillUsage.shieldsUsed += 1;
    } else if (state.inventory.streakShield > 0) {
      state.inventory.streakShield -= 1;
    } else {
      return false;
    }
    gachaService.saveState(state);
    this.notify(state.studentId);
    return true;
  },

  /** ปฏิสัมพันธ์ลูบหัว/ทักทายคู่หู — ได้รับความสุขและเหรียญจริง มีระยะพักป้องกันการปั๊มเหรียญ */
  interactWithBuddy(studentId?: string): {
    success: boolean;
    happinessGained: number;
    coinsGained: number;
    quote: string;
    message: string;
  } {
    const state = gachaService.getState(studentId);
    const buddy = gachaService.getBuddyById(state.activeBuddyId) || gachaService.getAllBuddies()[0];
    const tier = getBuddyStarTier(buddy.id, getBuddyStarsFromState(state, buddy.id));
    const quote = buddy.quote || 'สู้ๆ ไปด้วยกันนะครับ!';

    const last = state.skillUsage.lastCheerTimestamp ? Date.parse(state.skillUsage.lastCheerTimestamp) : NaN;
    if (Number.isFinite(last)) {
      const waitMs = CHEER_COOLDOWN_MINUTES * 60 * 1000 - (Date.now() - last);
      if (waitMs > 0) {
        const mins = Math.ceil(waitMs / 60000);
        return {
          success: false,
          happinessGained: 0,
          coinsGained: 0,
          quote,
          message: `"${buddy.name}" ยังอิ่มใจอยู่ ลองมาลูบหัวอีกครั้งในอีก ${mins} นาที`,
        };
      }
    }

    const happinessGained = tier.cheerHappiness ?? 15;
    const coinsGained = Math.round((tier.cheerCoins ?? 15) * toMultiplier(tier.coin));
    state.happiness = Math.min(100, state.happiness + happinessGained);
    state.coins += coinsGained;
    state.skillUsage.totalCheerCount += 1;
    state.skillUsage.lastCheerTimestamp = new Date().toISOString();
    gachaService.saveState(state);
    this.notify(state.studentId);

    return {
      success: true,
      happinessGained,
      coinsGained,
      quote,
      message: `คุณได้พูดคุยกับ "${buddy.name}" ได้รับความสุข +${happinessGained}% และเหรียญ +${coinsGained}`,
    };
  },

  notify(studentId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BUDDY_SKILL_ACTIVATED_EVENT, { detail: this.getSkillState(studentId) }));
    }
  },
};
