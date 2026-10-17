// src/services/gachaSkillEngine.ts
// เครื่องยนต์คำนวณและประมวลผลสกิลคู่หูนักเรียน (Active Buddy Skill Engine)
// เปลี่ยนคำอธิบายสกิลของคู่หูอนิเมะ (Gacha Buddies) ให้มีผลต่อระบบจริง 100%:
// 1. XP Multiplier: ตัวคูณค่าประสบการณ์เมื่อทำการบ้าน แบบฝึกหัด หรือควิซ
// 2. Coin Multiplier: ตัวคูณเหรียญรางวัลในระบบภารกิจ
// 3. Streak Shield: โล่ป้องกันสถิติการเข้าเรียน/เช็คชื่อขาดตอน
// 4. Quiz Hint (50:50): สิทธิ์ตัด 2 ตัวเลือกที่ผิดในแบบทดสอบออนไลน์
// 5. Homework Grace Window: ขยายเวลาส่งงานเพิ่ม 24 ชม. โดยไม่ถูกหักคะแนนส่งช้า
// 6. Interactive Cheer: ปฏิสัมพันธ์ลูบหัว/ให้กำลังใจ ได้รับค่าความสุขและเหรียญรางวัล

import { gachaService, type GachaBuddy, type GachaRarity } from './gachaService';

export interface ActiveBuddyBuffs {
  buddy: GachaBuddy;
  rarity: GachaRarity;
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

const STORAGE_KEY_SKILL_STATE = 'cls_buddy_skill_state_v1';
export const BUDDY_SKILL_ACTIVATED_EVENT = 'kp_buddy_skill_activated';

export const gachaSkillEngine = {
  getSkillState(): BuddySkillState {
    if (typeof localStorage === 'undefined') {
      return {
        remainingQuizHints: 2,
        remainingStreakShields: 1,
        totalCheerCount: 0,
      };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SKILL_STATE);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    const initial: BuddySkillState = {
      remainingQuizHints: 2,
      remainingStreakShields: 1,
      totalCheerCount: 0,
    };
    this.saveSkillState(initial);
    return initial;
  },

  saveSkillState(state: BuddySkillState): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SKILL_STATE, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BUDDY_SKILL_ACTIVATED_EVENT, { detail: state }));
    }
  },

  /**
   * คำนวณ Buffs ของคู่หูที่สวมใส่อยู่จริงในปัจจุบัน
   */
  getActiveBuffs(): ActiveBuddyBuffs {
    const buddy = gachaService.getActiveBuddy();
    const state = this.getSkillState();

    let xpMultiplier = 1.0;
    let coinMultiplier = 1.0;
    let homeworkGraceHours = 0;
    const activeEffectsLabels: string[] = [];

    // 1. คำนวณ Base Buff ตามระดับความหายาก (Rarity Multipliers)
    switch (buddy.rarity) {
      case 'MYTHIC':
        xpMultiplier = 1.50; // +50% XP
        coinMultiplier = 1.40; // +40% Coins
        homeworkGraceHours = 48;
        activeEffectsLabels.push('⚡ XP โบนัส +50%');
        activeEffectsLabels.push('🪙 เหรียญภารกิจ +40%');
        activeEffectsLabels.push('⏳ ส่งงานช้าได้ 48 ชม.');
        break;
      case 'LEGENDARY':
        xpMultiplier = 1.35; // +35% XP
        coinMultiplier = 1.30; // +30% Coins
        homeworkGraceHours = 36;
        activeEffectsLabels.push('⚡ XP โบนัส +35%');
        activeEffectsLabels.push('🪙 เหรียญภารกิจ +30%');
        activeEffectsLabels.push('⏳ ส่งงานช้าได้ 36 ชม.');
        break;
      case 'EPIC':
        xpMultiplier = 1.25; // +25% XP
        coinMultiplier = 1.20; // +20% Coins
        homeworkGraceHours = 24;
        activeEffectsLabels.push('⚡ XP โบนัส +25%');
        activeEffectsLabels.push('🪙 เหรียญภารกิจ +20%');
        activeEffectsLabels.push('⏳ ส่งงานช้าได้ 24 ชม.');
        break;
      case 'RARE':
        xpMultiplier = 1.15; // +15% XP
        coinMultiplier = 1.10; // +10% Coins
        homeworkGraceHours = 12;
        activeEffectsLabels.push('⚡ XP โบนัส +15%');
        activeEffectsLabels.push('🪙 เหรียญภารกิจ +10%');
        break;
      case 'UNCOMMON':
        xpMultiplier = 1.10; // +10% XP
        coinMultiplier = 1.05; // +5% Coins
        activeEffectsLabels.push('⚡ XP โบนัส +10%');
        break;
      case 'COMMON':
      default:
        xpMultiplier = 1.05; // +5% XP
        activeEffectsLabels.push('⚡ XP โบนัส +5%');
        break;
    }

    // 2. คำนวณ Special Skill ตามความสามารถเฉพาะตัวของคู่หู
    const sName = buddy.skillName.toLowerCase();
    const sDesc = buddy.skillDesc.toLowerCase();

    // ทักษะช่วยตอบควิซ / ข้อสอบ
    const hasQuizAffinity =
      sName.includes('จำแม่น') ||
      sName.includes('รอบรู้') ||
      sName.includes('วิเคราะห์') ||
      sName.includes('สายตา') ||
      sDesc.includes('แบบฝึกหัด') ||
      sDesc.includes('คะแนน') ||
      buddy.rarity === 'EPIC' ||
      buddy.rarity === 'LEGENDARY' ||
      buddy.rarity === 'MYTHIC';

    if (hasQuizAffinity) {
      activeEffectsLabels.push(`💡 ตัวช่วยตัดช้อยส์ควิซ (${state.remainingQuizHints} ครั้ง)`);
    }

    // ทักษะรักษาสถิติ / ป้องกันเข้าแถวสาย
    const hasStreakAffinity =
      sName.includes('ตรงเวลา') ||
      sName.includes('วินัย') ||
      sName.includes('แสงนำทาง') ||
      sDesc.includes('ตรงเวลา') ||
      sDesc.includes('สถิติ') ||
      buddy.rarity === 'LEGENDARY' ||
      buddy.rarity === 'MYTHIC';

    if (hasStreakAffinity) {
      activeEffectsLabels.push(`🛡️ โล่รักษาสถิติเข้าเรียน (${state.remainingStreakShields} ชิ้น)`);
    }

    return {
      buddy,
      rarity: buddy.rarity,
      xpMultiplier,
      coinMultiplier,
      streakShieldActive: hasStreakAffinity && state.remainingStreakShields > 0,
      streakShieldCharges: state.remainingStreakShields,
      quizHintAvailable: hasQuizAffinity && state.remainingQuizHints > 0,
      quizHintCharges: state.remainingQuizHints,
      homeworkGraceHours,
      activeEffectsLabels,
    };
  },

  /**
   * คำนวณ XP สุทธิหลังคูณบัฟคู่หู
   */
  calculateEarnedXp(baseXp: number): number {
    const { xpMultiplier } = this.getActiveBuffs();
    return Math.round(baseXp * xpMultiplier);
  },

  /**
   * คำนวณเหรียญรางวัลสุทธิหลังคูณบัฟคู่หู
   */
  calculateEarnedCoins(baseCoins: number): number {
    const { coinMultiplier } = this.getActiveBuffs();
    return Math.round(baseCoins * coinMultiplier);
  },

  /**
   * ใช้สิทธิ์ตัดตัวเลือกข้อสอบ 50:50
   */
  consumeQuizHint(): boolean {
    const buffs = this.getActiveBuffs();
    if (!buffs.quizHintAvailable) return false;

    const state = this.getSkillState();
    if (state.remainingQuizHints <= 0) return false;

    state.remainingQuizHints -= 1;
    this.saveSkillState(state);
    return true;
  },

  /**
   * เติมสิทธิ์ควิซฮินต์
   */
  replenishQuizHints(amount: number = 2): number {
    const state = this.getSkillState();
    state.remainingQuizHints = Math.min(5, state.remainingQuizHints + amount);
    this.saveSkillState(state);
    return state.remainingQuizHints;
  },

  /**
   * ใช้สิทธิ์ป้องกันสถิติการเข้าเรียน (Streak Shield)
   */
  consumeStreakShield(): boolean {
    const buffs = this.getActiveBuffs();
    if (!buffs.streakShieldActive) return false;

    const state = this.getSkillState();
    if (state.remainingStreakShields <= 0) return false;

    state.remainingStreakShields -= 1;
    this.saveSkillState(state);
    return true;
  },

  /**
   * ปฏิสัมพันธ์ลูบหัว/ทักทายคู่หู (Interactive Companion Cheer)
   */
  interactWithBuddy(): {
    success: boolean;
    happinessGained: number;
    coinsGained: number;
    quote: string;
    message: string;
  } {
    const buddy = gachaService.getActiveBuddy();
    const state = this.getSkillState();
    const now = new Date().toISOString();

    state.totalCheerCount += 1;
    state.lastCheerTimestamp = now;
    this.saveSkillState(state);

    const bonusCoins = this.calculateEarnedCoins(15);

    return {
      success: true,
      happinessGained: 15,
      coinsGained: bonusCoins,
      quote: buddy.quote || 'สู้ๆ ไปด้วยกันนะครับ!',
      message: `คุณได้พูดคุยกับ "${buddy.name}" ได้รับความสุข +15% และเหรียญ +${bonusCoins}`,
    };
  },
};
