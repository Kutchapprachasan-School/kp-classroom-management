// src/services/gachaService.ts
// ระบบสุ่มคู่หูนักเรียน (Buddy Gacha System) — เก็บสถานะแยกตามรหัสนักเรียน
// คีย์ข้อมูลรายคน: kp_gacha_state:<studentId>  (ซิงค์เฉพาะคีย์ที่เปลี่ยน ผ่าน cloudDataService)
// อัตราสุ่ม/การันตี/ราคาร้านค้า อ่านจาก gachaConfigService (แอดมินปรับได้) ไม่ฮาร์ดโค้ด
// ห้ามใส่ค่าจำลอง: นักเรียนใหม่เริ่มจากค่าที่แอดมินตั้งไว้เท่านั้น

import {
  MAX_BUDDY_STARS,
  getBuddyStarTier,
  type GachaRarity,
} from '../config/gachaStarTable';
import { gachaConfigService } from './gachaConfigService';

export type { GachaRarity };

export interface GachaBuddy {
  id: string;
  name: string;
  rarity: GachaRarity;
  title: string;
  skillName: string;
  skillDesc: string;
  element: 'WIND' | 'EARTH' | 'WATER' | 'FIRE' | 'LIGHT' | 'AETHER';
  accentColor: string;
  badgeBg: string;
  borderClass: string;
  avatarSeed: string;
  quote: string;
  roleDescription: string;
  chibiDetails: {
    hairColor: string;
    eyeColor: string;
    accessory: string;
    gender: 'boy' | 'girl';
  };
}

export interface GachaPullResult {
  buddy: GachaBuddy;
  isNew: boolean;
  isPity: boolean;
  shardsGained: number;
}

export interface InventoryItems {
  food: number;
  snack: number;
  quizHint: number;
  streakShield: number;
}

export interface BuddySkillUsage {
  /** วันจันทร์ของสัปดาห์ที่ใช้สิทธิ์ (YYYY-MM-DD) เปลี่ยนสัปดาห์ = รีเซ็ตสิทธิ์รายสัปดาห์ */
  weekKey: string;
  hintsUsed: number;
  shieldsUsed: number;
  totalCheerCount: number;
  lastCheerTimestamp?: string;
}

export interface WeeklyQuizResult {
  week: number;
  correct: number;
  total: number;
  answers: number[];
  percent: number;
  xpEarned: number;
  coinsEarned: number;
  ticketsEarned: number;
  shardsEarned: number;
  hintsUsed: number;
  completedAt: string;
}

export interface GachaState {
  studentId: string;
  tickets: number;
  pityCount: number;
  pityMax: number;
  totalPulls: number;
  unlockedBuddyIds: string[];
  /** ระดับดาวของคู่หูแต่ละตัวที่ครอบครอง (1–5) */
  buddyStars: Record<string, number>;
  activeBuddyId: string;
  starShards: number;
  coins: number;
  hunger: number;
  happiness: number;
  inventory: InventoryItems;
  /** รหัสภารกิจ/รางวัลที่กดรับแล้ว (กันรับซ้ำ) */
  claimedQuestIds: string[];
  /** จำนวนตั๋วฟรีที่รับจากภารกิจแล้วในแต่ละสัปดาห์ (key = วันจันทร์ของสัปดาห์) */
  freeTicketsByWeek: Record<string, number>;
  /** วันที่กดรับตั๋วฟรีประจำวันล่าสุด (YYYY-MM-DD) เพื่อจำกัดให้กดได้วันละ 1 ใบ */
  lastFreeTicketClaimDate?: string;
  skillUsage: BuddySkillUsage;
  weeklyQuiz: Record<number, WeeklyQuizResult>;
  pullHistory: Array<{
    buddyId: string;
    timestamp: string;
    rarity: GachaRarity;
  }>;
  updatedAt: string;
}

export const GACHA_STATE_KEY_PREFIX = 'kp_gacha_state:';
export const BUDDY_CHANGED_EVENT = 'kp_buddy_changed';
const AUTH_USER_STORAGE_KEY = 'cls_current_auth_user';
export const PREVIEW_STUDENT_ID = 'preview';

/** อัตราสุ่มปัจจุบันเป็นสัดส่วน (0–1) จากค่าที่แอดมินตั้งไว้ */
export const getGachaRates = (): Record<GachaRarity, number> => {
  const { rates } = gachaConfigService.getConfig();
  return {
    COMMON: rates.COMMON / 100,
    UNCOMMON: rates.UNCOMMON / 100,
    RARE: rates.RARE / 100,
    EPIC: rates.EPIC / 100,
    LEGENDARY: rates.LEGENDARY / 100,
    MYTHIC: rates.MYTHIC / 100,
  };
};

// 22 Buddies exact according to media_1791176349397.jpg
export const ALL_BUDDIES: GachaBuddy[] = [
  // 1. Common (40.0%) - 4 characters
  {
    id: 'buddy-c1',
    name: 'น้องโอม',
    rarity: 'COMMON',
    title: 'หนุ่มน้อยมาดนิ่ง รอบคอบ',
    skillName: 'เตือนงานตรงเวลา',
    skillDesc: 'แจ้งเตือนก่อนกำหนดส่งงาน 3 ชั่วโมง ได้รับแต้ม XP +5',
    element: 'EARTH',
    accentColor: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300 hover:border-slate-400',
    avatarSeed: 'ohm',
    quote: 'งานวันนี้ ทำเสร็จทันที สบายใจที่สุดครับ',
    roleDescription: 'มีหลายแบบ สลับใช้งานได้บ่อย',
    chibiDetails: { hairColor: '#1E293B', eyeColor: '#334155', accessory: 'กระเป๋าสะพายคู่ใจ', gender: 'boy' },
  },
  {
    id: 'buddy-c2',
    name: 'น้องแป้ง',
    rarity: 'COMMON',
    title: 'สาวแว่นนักอ่าน รักการเรียน',
    skillName: 'อ่านเร็วจำแม่น',
    skillDesc: 'ทบทวนใบงานและบทสรุปไวขึ้น เพิ่มคะแนนแบบฝึกหัด +5%',
    element: 'EARTH',
    accentColor: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300 hover:border-slate-400',
    avatarSeed: 'pang',
    quote: 'หนังสือเล่มนี้มีทริกดีๆ มาอ่านด้วยกันนะ',
    roleDescription: 'มีหลายแบบ สลับใช้งานได้บ่อย',
    chibiDetails: { hairColor: '#854D0E', eyeColor: '#78350F', accessory: 'แว่นตากลมและสมุดโน้ต', gender: 'girl' },
  },
  {
    id: 'buddy-c3',
    name: 'น้องซัน',
    rarity: 'COMMON',
    title: 'หนุ่มน้อยหูฟัง เมโลดี้สดใส',
    skillName: 'เสียงดนตรีผ่อนคลาย',
    skillDesc: 'ลดความเมื่อยล้าจากการทำการบ้าน เพิ่มความผ่อนคลาย +10',
    element: 'WIND',
    accentColor: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300 hover:border-slate-400',
    avatarSeed: 'sun',
    quote: 'เปิดเพลงเบาๆ แล้วเริ่มทำโจทย์ข้อต่อไปกัน!',
    roleDescription: 'มีหลายแบบ สลับใช้งานได้บ่อย',
    chibiDetails: { hairColor: '#FDE047', eyeColor: '#1E3A8A', accessory: 'หูฟังบลูทูธสีน้ำเงิน', gender: 'boy' },
  },
  {
    id: 'buddy-c4',
    name: 'น้องมายด์',
    rarity: 'COMMON',
    title: 'สาวน้อยผมยาว สุภาพเรียบร้อย',
    skillName: 'ตรวจทานละเอียด',
    skillDesc: 'เพิ่มความถูกต้องในการตอบแบบทดสอบย่อย 1 ข้อ',
    element: 'WATER',
    accentColor: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300 hover:border-slate-400',
    avatarSeed: 'mind',
    quote: 'อย่าลืมเช็คชื่อและเลขที่ก่อนส่งใบงานนะคะ',
    roleDescription: 'มีหลายแบบ สลับใช้งานได้บ่อย',
    chibiDetails: { hairColor: '#0F172A', eyeColor: '#38BDF8', accessory: 'กิ๊บติดผมลายดาว', gender: 'girl' },
  },

  // 2. Uncommon (35.0%) - 4 characters
  {
    id: 'buddy-u1',
    name: 'น้องพิมพ์',
    rarity: 'UNCOMMON',
    title: 'สาวหมวกแก๊ป พลังล้นเหลือ',
    skillName: 'พลังกิจกรรมโรงเรียน',
    skillDesc: 'รับโบนัส XP กิจกรรมโรงเรียนเพิ่มขึ้น +10%',
    element: 'EARTH',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    borderClass: 'border-emerald-300 hover:border-emerald-400',
    avatarSeed: 'pim',
    quote: 'กิจกรรมวันนี้สนุกแน่นอน ลุยกันเต็มที่!',
    roleDescription: 'ความสามารถพิเศษเริ่มชัดเจน',
    chibiDetails: { hairColor: '#78350F', eyeColor: '#059669', accessory: 'หมวกแก๊ปสีเขียวครีม', gender: 'girl' },
  },
  {
    id: 'buddy-u2',
    name: 'น้องต้น',
    rarity: 'UNCOMMON',
    title: 'หนุ่มแว่นตรรกะ ตัวแทนวิชาการ',
    skillName: 'ตรรกะคณิตคำนวณ',
    skillDesc: 'เพิ่มโอกาสตอบโจทย์การคำนวณถูกต้องและรับแต้มโบนัส',
    element: 'WIND',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    borderClass: 'border-emerald-300 hover:border-emerald-400',
    avatarSeed: 'ton',
    quote: 'ทุกปัญหามีสมการที่แก้ได้ ค่อยๆ คิดทีละสเต็ปนะ',
    roleDescription: 'ความสามารถพิเศษเริ่มชัดเจน',
    chibiDetails: { hairColor: '#1E293B', eyeColor: '#0D9488', accessory: 'แว่นตาสี่เหลี่ยมและปากกา', gender: 'boy' },
  },
  {
    id: 'buddy-u3',
    name: 'น้องเจน',
    rarity: 'UNCOMMON',
    title: 'สาวหูฟังหูแมว นักท่องไซเบอร์',
    skillName: 'เชื่อมต่อดิจิทัล',
    skillDesc: 'ส่งงานผ่านคลาวด์ R2 / Canva ได้รับคะแนนพิเศษ +15 XP',
    element: 'AETHER',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    borderClass: 'border-emerald-300 hover:border-emerald-400',
    avatarSeed: 'jane',
    quote: 'อัปโหลดงานขึ้นระบบแล้ว ง่ายและรวดเร็วสุดๆ เนี้ยว!',
    roleDescription: 'ความสามารถพิเศษเริ่มชัดเจน',
    chibiDetails: { hairColor: '#1E293B', eyeColor: '#10B981', accessory: 'หูฟังหูแมวไฟนีออนเขียว', gender: 'girl' },
  },
  {
    id: 'buddy-u4',
    name: 'น้องพีค',
    rarity: 'UNCOMMON',
    title: 'หนุ่มมาดกวน สมาธิเต็มร้อย',
    skillName: 'โฟกัสเสียงใส',
    skillDesc: 'เพิ่มสมาธิในชั่วโมงเรียน ไม่หลุดโฟกัสตลอดคาบ',
    element: 'WATER',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    borderClass: 'border-emerald-300 hover:border-emerald-400',
    avatarSeed: 'peak',
    quote: 'คาบนี้ครูสอนดีมาก ฟังเพลินจนหมดคาบเลย',
    roleDescription: 'ความสามารถพิเศษเริ่มชัดเจน',
    chibiDetails: { hairColor: '#0F172A', eyeColor: '#0284C7', accessory: 'หูฟังครอบหัวสีขาวฟ้า', gender: 'boy' },
  },

  // 3. Rare (18.0%) - 4 characters
  {
    id: 'buddy-r1',
    name: 'น้องคิน',
    rarity: 'RARE',
    title: 'หนุ่มผมขาว เยือกเย็นดั่งสายลมหนาว',
    skillName: 'ลมหายใจเยือกเย็น',
    skillDesc: 'ลดความประหม่าในการสอบ ช่วยให้ทำข้อสอบได้อย่างมั่นใจ',
    element: 'WIND',
    accentColor: '#3B82F6',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
    borderClass: 'border-blue-300 hover:border-blue-400',
    avatarSeed: 'kin',
    quote: 'หายใจเข้าลึกๆ ความรู้ที่คุณสะสมมาพร้อมเสมอ',
    roleDescription: 'สกิลเฉพาะตัวช่วยเสริมการเรียน',
    chibiDetails: { hairColor: '#E2E8F0', eyeColor: '#3B82F6', accessory: 'ผ้าพันคอสีฟ้าคราม', gender: 'boy' },
  },
  {
    id: 'buddy-r2',
    name: 'น้องโนจิ',
    rarity: 'RARE',
    title: 'สาวทวินเทลสีชมพู มิตรภาพเบ่งบาน',
    skillName: 'รอยยิ้มประสานใจ',
    skillDesc: 'เพิ่มคะแนนจิตพิสัยและความร่วมมือในการทำงานกลุ่ม +15%',
    element: 'LIGHT',
    accentColor: '#3B82F6',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
    borderClass: 'border-blue-300 hover:border-blue-400',
    avatarSeed: 'noji',
    quote: 'จับมือร่วมมือกัน ไม่มีอะไรที่พวกเราทำไม่ได้!',
    roleDescription: 'สกิลเฉพาะตัวช่วยเสริมการเรียน',
    chibiDetails: { hairColor: '#F472B6', eyeColor: '#DB2777', accessory: 'โบว์ผูกผมสีชมพูหวาน', gender: 'girl' },
  },
  {
    id: 'buddy-r3',
    name: 'น้องฟ้า',
    rarity: 'RARE',
    title: 'สาวน้อยผมน้ำทะเล ศิลปินรุ่นเยาว์',
    skillName: 'จินตนาการสีคราม',
    skillDesc: 'เพิ่มคะแนนผลงานสร้างสรรค์ วาดภาพ และออกแบบ +15%',
    element: 'WATER',
    accentColor: '#3B82F6',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
    borderClass: 'border-blue-300 hover:border-blue-400',
    avatarSeed: 'fah',
    quote: 'ภาพวาดคือภาษาของหัวใจ ระบายความฝันลงไปเลย',
    roleDescription: 'สกิลเฉพาะตัวช่วยเสริมการเรียน',
    chibiDetails: { hairColor: '#1E3A8A', eyeColor: '#60A5FA', accessory: 'จานสีและพู่กันวิเศษ', gender: 'girl' },
  },
  {
    id: 'buddy-r4',
    name: 'น้องเบส',
    rarity: 'RARE',
    title: 'หนุ่มหมวกเบสบอล นักสำรวจห้องสมุด',
    skillName: 'ขุมทรัพย์ความรู้',
    skillDesc: 'อ่านหนังสือครบ 1 เล่ม รับโบนัสแต้ม XP x1.2',
    element: 'EARTH',
    accentColor: '#3B82F6',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
    borderClass: 'border-blue-300 hover:border-blue-400',
    avatarSeed: 'bass',
    quote: 'เจอข้อมูลน่าสนใจในห้องสมุด เดี๋ยวผมสรุปให้นะ!',
    roleDescription: 'สกิลเฉพาะตัวช่วยเสริมการเรียน',
    chibiDetails: { hairColor: '#78350F', eyeColor: '#2563EB', accessory: 'หมวกแก๊ปสีน้ำเงินและแว่น', gender: 'boy' },
  },

  // 4. Epic (5.0%) - 4 characters
  {
    id: 'buddy-e1',
    name: 'น้องลิน',
    rarity: 'EPIC',
    title: 'สาวทวินเทลทมิฬ มนต์ตราแห่งความเพียร',
    skillName: 'มนตราทวิราตรี',
    skillDesc: 'ได้รับบัฟ XP x1.2 ตลอดทั้งวัน เมื่อทำแบบฝึกหัดต่อเนื่อง 3 วัน',
    element: 'AETHER',
    accentColor: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
    borderClass: 'border-purple-300 hover:border-purple-400 shadow-purple-100',
    avatarSeed: 'lin',
    quote: 'ความเพียรพยายามจะส่องแสงเจิดจ้าที่สุดในความมืดมน',
    roleDescription: 'สกิลพิเศษและเอฟเฟกต์โดดเด่น',
    chibiDetails: { hairColor: '#1E1B4B', eyeColor: '#A855F7', accessory: 'ริบบิ้นม่วงและคทาดวงดาว', gender: 'girl' },
  },
  {
    id: 'buddy-e2',
    name: 'น้องเซน',
    rarity: 'EPIC',
    title: 'หนุ่มผมเงิน นักดาบแห่งวินัย',
    skillName: 'เกราะพิทักษ์เดดไลน์',
    skillDesc: 'ป้องกันการหักคะแนนส่งงานสาย 1 ครั้งต่อสัปดาห์โดยอัตโนมัติ',
    element: 'WIND',
    accentColor: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
    borderClass: 'border-purple-300 hover:border-purple-400 shadow-purple-100',
    avatarSeed: 'zen',
    quote: 'วินัยที่เข้มแข็ง คือดาบที่ฟันฝ่าทุกอุปสรรคให้ผ่านพ้น',
    roleDescription: 'สกิลพิเศษและเอฟเฟกต์โดดเด่น',
    chibiDetails: { hairColor: '#CBD5E1', eyeColor: '#6366F1', accessory: 'เข็มกลัดดาบเงินวินัย', gender: 'boy' },
  },
  {
    id: 'buddy-e3',
    name: 'น้องมิ้น',
    rarity: 'EPIC',
    title: 'สาวหูแมวสีทอง สัญชาตญาณมหัศจรรย์',
    skillName: 'สัญชาตญาณเนโกะ',
    skillDesc: 'เพิ่มโอกาสสุ่มได้รับโบนัส XP สองเท่าเมื่อทำควิซสำเร็จ',
    element: 'LIGHT',
    accentColor: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
    borderClass: 'border-purple-300 hover:border-purple-400 shadow-purple-100',
    avatarSeed: 'mint',
    quote: 'สัมผัสที่หกของฉันบอกว่า ข้อนี้ถูกต้องแน่นอน เหมียว~',
    roleDescription: 'สกิลพิเศษและเอฟเฟกต์โดดเด่น',
    chibiDetails: { hairColor: '#FDE047', eyeColor: '#7C3AED', accessory: 'หูแมวขนนุ่มสีทองและกระดิ่ง', gender: 'girl' },
  },
  {
    id: 'buddy-e4',
    name: 'น้องคิว',
    rarity: 'EPIC',
    title: 'หนุ่มออร่ามรกต ผู้ฟื้นฟูพลังงาน',
    skillName: 'พลังงานสีเขียวฟื้นฟู',
    skillDesc: 'ฟื้นฟูกำลังใจและพลังของคู่หูบัดดี้เต็ม 100% ทันทีที่ส่งการบ้าน',
    element: 'EARTH',
    accentColor: '#8B5CF6',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
    borderClass: 'border-purple-300 hover:border-purple-400 shadow-purple-100',
    avatarSeed: 'q',
    quote: 'ไม่ต้องห่วงเรื่องพลังงาน ผมจะคอยชาร์จแบตให้คุณเสมอ',
    roleDescription: 'สกิลพิเศษและเอฟเฟกต์โดดเด่น',
    chibiDetails: { hairColor: '#064E3B', eyeColor: '#10B981', accessory: 'อัญมณีมรกตเรืองแสง', gender: 'boy' },
  },

  // 5. Legendary (1.8%) - 4 characters
  {
    id: 'buddy-l1',
    name: 'น้องวาเลน',
    rarity: 'LEGENDARY',
    title: 'เจ้าหญิงผมเพลิง เพลิงแห่งความมุ่งมั่น',
    skillName: 'เพลิงมุ่งมั่นดวงดาว',
    skillDesc: 'รับโบนัสคะแนน XP x1.5 ทุกวิชา และปลดล็อกออร่าประกายไฟสีแดง',
    element: 'FIRE',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400 hover:border-amber-500 shadow-amber-100 ring-1 ring-amber-300',
    avatarSeed: 'valen',
    quote: 'ความฝันอันยิ่งใหญ่ ต้องแลกมาด้วยหัวใจที่ไม่เคยยอมแพ้!',
    roleDescription: 'หายากมาก พร้อมสกิลระดับสูง',
    chibiDetails: { hairColor: '#DC2626', eyeColor: '#B45309', accessory: 'มงกุฎทับทิมเพลิงดาว', gender: 'girl' },
  },
  {
    id: 'buddy-l2',
    name: 'น้องเรย์',
    rarity: 'LEGENDARY',
    title: 'จอมเวทสีคราม ประกายแสงปัญญา',
    skillName: 'ประกายแสงแห่งปัญญา',
    skillDesc: 'เพิ่มคะแนนสอบย่อย +1 แต้มอัตโนมัติ และกระจายบัฟให้เพื่อนในห้อง +5%',
    element: 'LIGHT',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400 hover:border-amber-500 shadow-amber-100 ring-1 ring-amber-300',
    avatarSeed: 'ray',
    quote: 'เมื่อปัญญาเปิดกว้าง หนทางสู่ความสำเร็จก็ไร้ขีดจำกัด',
    roleDescription: 'หายากมาก พร้อมสกิลระดับสูง',
    chibiDetails: { hairColor: '#93C5FD', eyeColor: '#1D4ED8', accessory: 'คทาคริสตัลสีฟ้าสวรรค์', gender: 'boy' },
  },
  {
    id: 'buddy-l3',
    name: 'น้องอามิ',
    rarity: 'LEGENDARY',
    title: 'มิโกะแห่งความเมตตา พรศักดิ์สิทธิ์',
    skillName: 'สรวงสวรรค์ความเมตตา',
    skillDesc: 'ได้รับคำชมเชยพิเศษและแต้มจิตอาสา +20 XP ทุกสัปดาห์',
    element: 'AETHER',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400 hover:border-amber-500 shadow-amber-100 ring-1 ring-amber-300',
    avatarSeed: 'ami',
    quote: 'การให้และการช่วยเหลือ คือคุณค่าที่งดงามที่สุดของการเรียนรู้',
    roleDescription: 'หายากมาก พร้อมสกิลระดับสูง',
    chibiDetails: { hairColor: '#172554', eyeColor: '#D97706', accessory: 'ริบบิ้นทองและกระดิ่งศาลเจ้า', gender: 'girl' },
  },
  {
    id: 'buddy-l4',
    name: 'น้องไทเกอร์',
    rarity: 'LEGENDARY',
    title: 'พยัคฆ์ทองคำ ผู้นำแห่งชัยชนะ',
    skillName: 'พยัคฆ์ผู้นำชัย',
    skillDesc: 'โบนัสคะแนนกิจกรรมกลุ่ม x1.5 และปลดล็อกฉายา "ผู้นำห้องเรียนยอดเยี่ยม"',
    element: 'EARTH',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400 hover:border-amber-500 shadow-amber-100 ring-1 ring-amber-300',
    avatarSeed: 'tiger',
    quote: 'ก้าวไปข้างหน้าด้วยความมั่นใจ ชัยชนะเป็นของพวกเรา!',
    roleDescription: 'หายากมาก พร้อมสกิลระดับสูง',
    chibiDetails: { hairColor: '#FBBF24', eyeColor: '#78350F', accessory: 'หูเสือทองและเสื้อฮู้ดลายพยัคฆ์', gender: 'boy' },
  },

  // 6. Mythic (0.2%) - 2 characters
  {
    id: 'buddy-m1',
    name: 'น้องเซเรน',
    rarity: 'MYTHIC',
    title: 'เทพธิดาแห่งรุ่งอรุณ แสงสว่างนิรันดร์',
    skillName: 'ปาฏิหาริย์แห่งรุ่งอรุณ',
    skillDesc: 'การันตีผลประเมินคุณลักษณะระดับ 3 (ดีเยี่ยม), โบนัส XP x2.0 ทุกกิจกรรม และเอฟเฟกต์ละอองแสงสีรุ้ง!',
    element: 'LIGHT',
    accentColor: '#EC4899',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-300',
    borderClass: 'border-rose-400 hover:border-rose-500 shadow-rose-200 ring-2 ring-rose-400 animate-pulse',
    avatarSeed: 'seren',
    quote: 'ขอให้แสงสว่างแห่งรุ่งอรุณ นำพาปัญญาและความสุขมาสู่เธอชั่วนิรันดร์',
    roleDescription: 'ตำนานที่มีเพียงไม่กี่คน',
    chibiDetails: { hairColor: '#FFF1F2', eyeColor: '#E11D48', accessory: 'ปีกแสงเทพธิดาและริบบิ้นแดงชาด', gender: 'girl' },
  },
  {
    id: 'buddy-m2',
    name: 'น้องไนท์',
    rarity: 'MYTHIC',
    title: 'ดาราแห่งอนันตกาล ผู้ครอบครองมิติกาลเวลา',
    skillName: 'ดาราแห่งอนันตกาล',
    skillDesc: 'ปลดล็อกบัฟทุกวิชาพร้อมกัน, กำลังใจคู่หูบัดดี้คงที่ 100%, และอัญเชิญวงเวทแห่งปัญญา!',
    element: 'AETHER',
    accentColor: '#EC4899',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-300',
    borderClass: 'border-rose-400 hover:border-rose-500 shadow-rose-200 ring-2 ring-rose-400 animate-pulse',
    avatarSeed: 'knight',
    quote: 'ความรู้ไร้จุดสิ้นสุด ดั่งดวงดาวนับล้านในห้วงอวกาศที่รอการค้นพบ',
    roleDescription: 'ตำนานที่มีเพียงไม่กี่คน',
    chibiDetails: { hairColor: '#1E1B4B', eyeColor: '#38BDF8', accessory: 'มงกุฎดวงดาวและผ้าคลุมกลุ่มดาว', gender: 'girl' },
  },
];

export interface ApplyFreeTicketResult {
  allowed: number;
  status: 'SUCCESS' | 'DAILY_LIMIT_REACHED' | 'WEEKLY_CAP_REACHED';
  claimedThisWeek: number;
  cap: number;
  message: string;
}

const nowIso = (): string => new Date().toISOString();

const toDateKey = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** วันที่ปัจจุบันในรูป YYYY-MM-DD (เขตเวลา Asia/Bangkok) */
export const getBangkokTodayKey = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/** วันจันทร์ของสัปดาห์ (เขตเวลา Asia/Bangkok) ในรูป YYYY-MM-DD */
export const getWeekKey = (date: Date = new Date()): string => {
  const bangkokDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // YYYY-MM-DD
  const [y, m, d] = bangkokDate.split('-').map((n) => parseInt(n, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + diffToMonday);
  return toDateKey(utc);
};

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const emptyInventory = (): InventoryItems => ({ food: 0, snack: 0, quizHint: 0, streakShield: 0 });

export const getBuddyStarsFromState = (state: GachaState, buddyId: string): number => {
  if (!state.unlockedBuddyIds.includes(buddyId)) return 0;
  return clamp(state.buddyStars[buddyId] || 1, 1, MAX_BUDDY_STARS);
};

const buildInitialState = (studentId: string): GachaState => {
  const cfg = gachaConfigService.getConfig();
  const starter = ALL_BUDDIES.some((b) => b.id === cfg.starterBuddyId)
    ? cfg.starterBuddyId
    : ALL_BUDDIES[0].id;
  return {
    studentId,
    tickets: cfg.starterTickets,
    pityCount: 0,
    pityMax: cfg.pityMax,
    totalPulls: 0,
    unlockedBuddyIds: [starter],
    buddyStars: { [starter]: 1 },
    activeBuddyId: starter,
    starShards: 0,
    coins: cfg.starterCoins,
    hunger: 100,
    happiness: 100,
    inventory: emptyInventory(),
    claimedQuestIds: [],
    freeTicketsByWeek: {},
    skillUsage: {
      weekKey: getWeekKey(),
      hintsUsed: 0,
      shieldsUsed: 0,
      totalCheerCount: 0,
    },
    weeklyQuiz: {},
    pullHistory: [],
    updatedAt: '',
  };
};

/** เติมฟิลด์ที่ขาดและปรับค่าตามสัปดาห์/คอนฟิกปัจจุบัน (ไม่เขียนลงที่เก็บ) */
const normalizeState = (raw: Partial<GachaState>, studentId: string): GachaState => {
  const base = buildInitialState(studentId);
  const cfg = gachaConfigService.getConfig();
  const unlocked =
    Array.isArray(raw.unlockedBuddyIds) && raw.unlockedBuddyIds.length > 0
      ? raw.unlockedBuddyIds.filter((id) => ALL_BUDDIES.some((b) => b.id === id))
      : base.unlockedBuddyIds;
  const stars: Record<string, number> = {};
  unlocked.forEach((id) => {
    stars[id] = clamp(raw.buddyStars?.[id] || 1, 1, MAX_BUDDY_STARS);
  });
  const active = unlocked.includes(raw.activeBuddyId || '') ? (raw.activeBuddyId as string) : unlocked[0];

  const currentWeek = getWeekKey();
  const usage: BuddySkillUsage =
    raw.skillUsage && raw.skillUsage.weekKey === currentWeek
      ? { ...base.skillUsage, ...raw.skillUsage }
      : {
          ...base.skillUsage,
          weekKey: currentWeek,
          totalCheerCount: raw.skillUsage?.totalCheerCount || 0,
          lastCheerTimestamp: raw.skillUsage?.lastCheerTimestamp,
        };

  const state: GachaState = {
    ...base,
    ...raw,
    studentId,
    pityMax: cfg.pityMax,
    unlockedBuddyIds: unlocked,
    buddyStars: stars,
    activeBuddyId: active,
    inventory: { ...emptyInventory(), ...(raw.inventory || {}) },
    claimedQuestIds: Array.isArray(raw.claimedQuestIds) ? raw.claimedQuestIds : [],
    freeTicketsByWeek: { ...(raw.freeTicketsByWeek || {}) },
    lastFreeTicketClaimDate: raw.lastFreeTicketClaimDate || undefined,
    skillUsage: usage,
    weeklyQuiz: { ...(raw.weeklyQuiz || {}) },
    pullHistory: Array.isArray(raw.pullHistory) ? raw.pullHistory : [],
  };
  state.tickets = Math.max(0, Math.floor(state.tickets || 0));
  state.starShards = Math.max(0, Math.floor(state.starShards || 0));
  state.coins = Math.max(0, Math.floor(state.coins || 0));
  state.hunger = clamp(state.hunger ?? 100, 0, 100);
  state.happiness = clamp(state.happiness ?? 100, 0, 100);
  const floor = getBuddyStarTier(active, stars[active] || 1).moodFloor || 0;
  if (floor > 0) state.happiness = Math.max(state.happiness, floor);
  return state;
};

export const gachaService = {
  /** ตัวสุ่มเลข 0–1 (เปลี่ยนได้เพื่อทดสอบ) */
  rng: (() => Math.random()) as () => number,

  /** รหัสนักเรียนที่ล็อกอินอยู่ (ถ้าไม่ใช่นักเรียน เช่น แอดมินพรีวิว จะใช้บัญชี preview แยกต่างหาก) */
  getCurrentStudentId(): string {
    if (typeof localStorage === 'undefined') return PREVIEW_STUDENT_ID;
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (raw) {
        const user = JSON.parse(raw) as { id?: string; role?: string };
        if (user?.role === 'STUDENT' && user.id) return user.id;
      }
    } catch {
      // ใช้บัญชี preview
    }
    return PREVIEW_STUDENT_ID;
  },

  stateKey(studentId: string): string {
    return `${GACHA_STATE_KEY_PREFIX}${studentId}`;
  },

  /** อ่านสถานะกาชาของนักเรียน (ยังไม่เคยเล่น = ค่าเริ่มต้นตามที่แอดมินตั้ง และยังไม่เขียนลงที่เก็บ) */
  getState(studentId?: string): GachaState {
    const targetStudentId = studentId || this.getCurrentStudentId();
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.stateKey(targetStudentId));
        if (raw) return normalizeState(JSON.parse(raw), targetStudentId);
      } catch {
        // ข้อมูลเสียหาย → เริ่มใหม่
      }
    }
    return buildInitialState(targetStudentId);
  },

  hasStoredState(studentId: string): boolean {
    return typeof localStorage !== 'undefined' && localStorage.getItem(this.stateKey(studentId)) !== null;
  },

  saveState(state: GachaState): void {
    const toSave: GachaState = { ...state, updatedAt: nowIso() };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.stateKey(state.studentId), JSON.stringify(toSave));
    }
    if (typeof window !== 'undefined' && state.studentId === this.getCurrentStudentId()) {
      window.dispatchEvent(new CustomEvent(BUDDY_CHANGED_EVENT, { detail: toSave }));
    }
  },

  removeState(studentId: string): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.stateKey(studentId));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BUDDY_CHANGED_EVENT, { detail: null }));
    }
  },

  /** รหัสนักเรียนทั้งหมดที่มีข้อมูลกาชาในเครื่องนี้ */
  listStoredStudentIds(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GACHA_STATE_KEY_PREFIX)) {
        ids.push(key.slice(GACHA_STATE_KEY_PREFIX.length));
      }
    }
    return ids;
  },

  getAllBuddies(): GachaBuddy[] {
    return ALL_BUDDIES;
  },

  getBuddyById(id: string): GachaBuddy | undefined {
    return ALL_BUDDIES.find((b) => b.id === id);
  },

  getActiveBuddy(studentId?: string): GachaBuddy {
    const state = this.getState(studentId);
    return ALL_BUDDIES.find((b) => b.id === state.activeBuddyId) || ALL_BUDDIES[0];
  },

  /** ระดับดาวของคู่หู (0 = ยังไม่ปลดล็อก) */
  getBuddyStars(buddyId: string, studentId?: string): number {
    return getBuddyStarsFromState(this.getState(studentId), buddyId);
  },

  /** สวมใส่คู่หู — ทำได้เฉพาะตัวที่ปลดล็อกแล้วเท่านั้น */
  setActiveBuddy(buddyId: string, studentId?: string): boolean {
    const buddy = ALL_BUDDIES.find((b) => b.id === buddyId);
    if (!buddy) return false;
    const state = this.getState(studentId);
    if (!state.unlockedBuddyIds.includes(buddyId)) return false;
    state.activeBuddyId = buddyId;
    this.saveState(state);
    return true;
  },

  addTickets(amount: number, studentId?: string): number {
    const state = this.getState(studentId);
    state.tickets = Math.max(0, state.tickets + Math.floor(amount));
    this.saveState(state);
    return state.tickets;
  },

  addCoins(amount: number, studentId?: string): number {
    const state = this.getState(studentId);
    state.coins = Math.max(0, state.coins + Math.floor(amount));
    this.saveState(state);
    return state.coins;
  },

  pickRarity(isPity: boolean): GachaRarity {
    if (isPity) {
      const roll = this.rng();
      if (roll < 0.75) return 'EPIC';
      if (roll < 0.95) return 'LEGENDARY';
      return 'MYTHIC';
    }
    const rates = getGachaRates();
    const roll = this.rng();
    let cumulative = 0;
    const descending: GachaRarity[] = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
    for (const rarity of descending) {
      cumulative += rates[rarity];
      if (roll < cumulative) return rarity;
    }
    return 'COMMON';
  },

  /** สุ่มหลายครั้งในคราวเดียว (อ่าน-เขียนสถานะครั้งเดียว) */
  pullMany(count: number, studentId?: string): GachaPullResult[] | { error: string } {
    const cfg = gachaConfigService.getConfig();
    if (!cfg.enabled) return { error: 'ระบบกาชาปิดใช้งานชั่วคราว' };
    const state = this.getState(studentId);
    if (state.tickets < count) {
      return { error: count === 1 ? 'ตั๋วสุ่มไม่เพียงพอ' : `ตั๋วสุ่มไม่เพียงพอ (ต้องการ ${count} ใบ)` };
    }

    const results: GachaPullResult[] = [];
    for (let i = 0; i < count; i++) {
      state.tickets -= 1;
      state.pityCount += 1;
      state.totalPulls += 1;

      const isPity = state.pityCount >= cfg.pityMax;
      const rarity = this.pickRarity(isPity);
      if (isPity || rarity === 'EPIC' || rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
        state.pityCount = 0;
      }

      const pool = ALL_BUDDIES.filter((b) => b.rarity === rarity);
      const buddy = pool[Math.min(pool.length - 1, Math.floor(this.rng() * pool.length))];
      const isNew = !state.unlockedBuddyIds.includes(buddy.id);
      let shardsGained = 0;
      if (isNew) {
        state.unlockedBuddyIds.push(buddy.id);
        state.buddyStars[buddy.id] = 1;
      } else {
        shardsGained = cfg.shardsOnDuplicate[buddy.rarity];
        state.starShards += shardsGained;
      }

      state.pullHistory.unshift({
        buddyId: buddy.id,
        timestamp: nowIso(),
        rarity: buddy.rarity,
      });
      if (state.pullHistory.length > 50) state.pullHistory.pop();

      results.push({ buddy, isNew, isPity, shardsGained });
    }

    this.saveState(state);
    return results;
  },

  pullOne(studentId?: string): GachaPullResult | { error: string } {
    const res = this.pullMany(1, studentId);
    return 'error' in res ? res : res[0];
  },

  pullTen(studentId?: string): GachaPullResult[] | { error: string } {
    return this.pullMany(10, studentId);
  },

  resetPity(studentId?: string): void {
    const state = this.getState(studentId);
    state.pityCount = 0;
    this.saveState(state);
  },

  // ===================== ระบบดาว & เศษดาว =====================

  /** เศษดาวที่ต้องใช้อัปเกรดจากดาวปัจจุบันไปดาวถัดไป (null = ดาวเต็มแล้วหรือยังไม่มีคู่หู) */
  getStarUpgradeCost(buddyId: string, studentId?: string): number | null {
    const buddy = this.getBuddyById(buddyId);
    const stars = this.getBuddyStars(buddyId, studentId);
    if (!buddy || stars < 1 || stars >= MAX_BUDDY_STARS) return null;
    return gachaConfigService.getConfig().starUpgradeCosts[buddy.rarity][stars - 1];
  },

  upgradeBuddyStar(
    buddyId: string,
    studentId?: string
  ): { ok: true; stars: number; spent: number } | { ok: false; error: string } {
    const buddy = this.getBuddyById(buddyId);
    if (!buddy) return { ok: false, error: 'ไม่พบคู่หูที่ระบุ' };
    const state = this.getState(studentId);
    if (!state.unlockedBuddyIds.includes(buddyId)) return { ok: false, error: 'ยังไม่ได้ปลดล็อกคู่หูตัวนี้' };
    const stars = getBuddyStarsFromState(state, buddyId);
    if (stars >= MAX_BUDDY_STARS) return { ok: false, error: 'คู่หูตัวนี้ถึงระดับสูงสุด 5★ แล้ว' };
    const cost = gachaConfigService.getConfig().starUpgradeCosts[buddy.rarity][stars - 1];
    if (state.starShards < cost) {
      return { ok: false, error: `เศษดาวไม่เพียงพอ (ต้องการ ${cost} มี ${state.starShards})` };
    }
    state.starShards -= cost;
    state.buddyStars[buddyId] = stars + 1;
    this.saveState(state);
    return { ok: true, stars: stars + 1, spent: cost };
  },

  getUnlockCost(buddyId: string): number | null {
    const buddy = this.getBuddyById(buddyId);
    return buddy ? gachaConfigService.getConfig().unlockCostShards[buddy.rarity] : null;
  },

  unlockBuddyWithShards(
    buddyId: string,
    studentId?: string
  ): { ok: true; spent: number } | { ok: false; error: string } {
    const buddy = this.getBuddyById(buddyId);
    if (!buddy) return { ok: false, error: 'ไม่พบคู่หูที่ระบุ' };
    const state = this.getState(studentId);
    if (state.unlockedBuddyIds.includes(buddyId)) return { ok: false, error: 'มีคู่หูตัวนี้อยู่แล้ว' };
    const cost = gachaConfigService.getConfig().unlockCostShards[buddy.rarity];
    if (state.starShards < cost) {
      return { ok: false, error: `เศษดาวไม่เพียงพอ (ต้องการ ${cost} มี ${state.starShards})` };
    }
    state.starShards -= cost;
    state.unlockedBuddyIds.push(buddyId);
    state.buddyStars[buddyId] = 1;
    this.saveState(state);
    return { ok: true, spent: cost };
  },

  // ===================== ร้านค้า & ไอเทม =====================

  exchangeShardsForTickets(
    count: number,
    studentId?: string
  ): { ok: true; spent: number } | { ok: false; error: string } {
    const n = Math.floor(count);
    if (n < 1) return { ok: false, error: 'จำนวนไม่ถูกต้อง' };
    const state = this.getState(studentId);
    const cost = gachaConfigService.getConfig().shop.shardsPerTicket * n;
    if (state.starShards < cost) return { ok: false, error: `เศษดาวไม่เพียงพอ (ต้องการ ${cost})` };
    state.starShards -= cost;
    state.tickets += n;
    this.saveState(state);
    return { ok: true, spent: cost };
  },

  buyTicketsWithCoins(
    count: number,
    studentId?: string
  ): { ok: true; spent: number } | { ok: false; error: string } {
    const n = Math.floor(count);
    if (n < 1) return { ok: false, error: 'จำนวนไม่ถูกต้อง' };
    const state = this.getState(studentId);
    const cost = gachaConfigService.getConfig().shop.coinsPerTicket * n;
    if (state.coins < cost) return { ok: false, error: `เหรียญไม่เพียงพอ (ต้องการ ${cost})` };
    state.coins -= cost;
    state.tickets += n;
    this.saveState(state);
    return { ok: true, spent: cost };
  },

  getItemPrice(kind: keyof InventoryItems): number {
    const shop = gachaConfigService.getConfig().shop;
    switch (kind) {
      case 'food':
        return shop.foodPriceCoins;
      case 'snack':
        return shop.snackPriceCoins;
      case 'quizHint':
        return shop.quizHintPriceCoins;
      default:
        return shop.streakShieldPriceCoins;
    }
  },

  buyItem(
    kind: keyof InventoryItems,
    studentId?: string
  ): { ok: true; spent: number } | { ok: false; error: string } {
    const state = this.getState(studentId);
    const price = this.getItemPrice(kind);
    if (state.coins < price) return { ok: false, error: `เหรียญไม่เพียงพอ (ต้องการ ${price})` };
    state.coins -= price;
    state.inventory[kind] += 1;
    this.saveState(state);
    return { ok: true, spent: price };
  },

  /**
   * เพิ่มตั๋วฟรีประจำวันตามเพดานรายสัปดาห์ (กดได้วันละ 1 ใบ ไม่ใช่วันเดียว 5 ใบ, เพดานสูงสุด 5 ใบ/สัปดาห์)
   * คืนผลลัพธ์พร้อมสถานะและข้อความแจ้งเตือนที่ชัดเจน
   */
  applyFreeTickets(state: GachaState, _amount: number = 1): ApplyFreeTicketResult {
    const cap = gachaConfigService.getConfig().rewards.weeklyFreeTicketCap ?? 5;
    const week = getWeekKey();
    const today = getBangkokTodayKey();
    const used = state.freeTicketsByWeek[week] || 0;

    // 1. ตรวจสอบเพดานรายวัน (วันละ 1 ใบ ไม่ใช่วันเดียว 5 ใบ)
    if (state.lastFreeTicketClaimDate === today) {
      return {
        allowed: 0,
        status: 'DAILY_LIMIT_REACHED',
        claimedThisWeek: used,
        cap,
        message: 'วันนี้คุณรับตั๋วฟรีไปแล้ว (รับได้วันละ 1 ใบ พรุ่งนี้มารับใหม่นะครับ)',
      };
    }

    // 2. ตรวจสอบเพดานรายสัปดาห์ (ไม่เกิน 5 ใบต่อสัปดาห์)
    if (cap > 0 && used >= cap) {
      return {
        allowed: 0,
        status: 'WEEKLY_CAP_REACHED',
        claimedThisWeek: used,
        cap,
        message: `สัปดาห์นี้คุณรับตั๋วฟรีครบเพดานแล้ว (${cap} ใบ / สัปดาห์)`,
      };
    }

    // 3. รับตั๋วฟรีสำเร็จ 1 ใบ
    state.tickets += 1;
    state.freeTicketsByWeek[week] = used + 1;
    state.lastFreeTicketClaimDate = today;

    const weeks = Object.keys(state.freeTicketsByWeek).sort();
    while (weeks.length > 8) delete state.freeTicketsByWeek[weeks.shift() as string];

    return {
      allowed: 1,
      status: 'SUCCESS',
      claimedThisWeek: used + 1,
      cap,
      message: `รับตั๋วฟรีประจำวันสำเร็จ! (+1 ใบ) • สัปดาห์นี้รับแล้ว ${used + 1}/${cap} ใบ`,
    };
  },

  /** ใช้ไอเทมดูแลคู่หู: อาหาร +25 ความอิ่ม, ขนม +20 ความสุข */
  useCareItem(
    kind: 'food' | 'snack',
    studentId?: string
  ): { ok: true; hunger: number; happiness: number } | { ok: false; error: string } {
    const state = this.getState(studentId);
    if (state.inventory[kind] < 1) return { ok: false, error: 'ไม่มีไอเทมนี้ในกระเป๋า' };
    state.inventory[kind] -= 1;
    if (kind === 'food') state.hunger = clamp(state.hunger + 25, 0, 100);
    else state.happiness = clamp(state.happiness + 20, 0, 100);
    this.saveState(state);
    return { ok: true, hunger: state.hunger, happiness: state.happiness };
  },
};
