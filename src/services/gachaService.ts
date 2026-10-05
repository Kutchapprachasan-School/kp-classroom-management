// src/services/gachaService.ts
// ระบบสุ่มคู่หูนักเรียน (Buddy Gacha System)
// อัตราการสุ่มตรงตามกฏ 100%:
// Common: 40.0%, Uncommon: 35.0%, Rare: 18.0%, Epic: 5.0%, Legendary: 1.8%, Mythic: 0.2%
// ระบบการันตี Pity System: สุ่มครบ 80 ครั้ง การันตี Epic หรือ Legendary แน่นอน

export type GachaRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC';

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

export interface GachaState {
  tickets: number;
  pityCount: number;
  pityMax: number;
  totalPulls: number;
  unlockedBuddyIds: string[];
  activeBuddyId: string;
  starShards: number;
  pullHistory: Array<{
    buddyId: string;
    timestamp: string;
    rarity: GachaRarity;
  }>;
}

const STORAGE_KEY = 'cls_buddy_gacha_v1';

export const GACHA_RATES: Record<GachaRarity, number> = {
  COMMON: 0.40,     // 40.0%
  UNCOMMON: 0.35,   // 35.0%
  RARE: 0.18,       // 18.0%
  EPIC: 0.05,       // 5.0%
  LEGENDARY: 0.018, // 1.8%
  MYTHIC: 0.002,    // 0.2%
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

export const gachaService = {
  getState(): GachaState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const initial: GachaState = {
      tickets: 12, // Initial 12 tickets as in mockup
      pityCount: 32, // Initial 32 / 80 as in mockup
      pityMax: 80,
      totalPulls: 32,
      unlockedBuddyIds: ['buddy-c1', 'buddy-c2', 'buddy-u1'],
      activeBuddyId: 'buddy-u1',
      starShards: 150,
      pullHistory: [],
    };
    this.saveState(initial);
    return initial;
  },

  saveState(state: GachaState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  getAllBuddies(): GachaBuddy[] {
    return ALL_BUDDIES;
  },

  getBuddyById(id: string): GachaBuddy | undefined {
    return ALL_BUDDIES.find((b) => b.id === id);
  },

  getActiveBuddy(): GachaBuddy {
    const state = this.getState();
    return (
      ALL_BUDDIES.find((b) => b.id === state.activeBuddyId) || ALL_BUDDIES[0]
    );
  },

  setActiveBuddy(buddyId: string): boolean {
    const state = this.getState();
    if (!state.unlockedBuddyIds.includes(buddyId)) return false;
    state.activeBuddyId = buddyId;
    this.saveState(state);
    return true;
  },

  addTickets(amount: number): number {
    const state = this.getState();
    state.tickets += amount;
    this.saveState(state);
    return state.tickets;
  },

  // Perform single pull
  pullOne(): GachaPullResult | { error: string } {
    const state = this.getState();
    if (state.tickets < 1) {
      return { error: 'ตั๋วสุ่มไม่เพียงพอ' };
    }

    state.tickets -= 1;
    state.pityCount += 1;
    state.totalPulls += 1;

    let selectedRarity: GachaRarity;
    let isPity = false;

    // Check Pity Rule: At 80 pulls, guaranteed Epic or Legendary!
    if (state.pityCount >= state.pityMax) {
      isPity = true;
      state.pityCount = 0; // Reset pity
      const roll = Math.random();
      if (roll < 0.75) {
        selectedRarity = 'EPIC';
      } else if (roll < 0.95) {
        selectedRarity = 'LEGENDARY';
      } else {
        selectedRarity = 'MYTHIC';
      }
    } else {
      // Standard Probability Check (Exact 100% Rule)
      const roll = Math.random(); // 0.000 to 1.000
      let cumulative = 0;

      cumulative += GACHA_RATES.MYTHIC; // 0.002
      if (roll < cumulative) {
        selectedRarity = 'MYTHIC';
        state.pityCount = 0; // Reset pity on jackpot
      } else {
        cumulative += GACHA_RATES.LEGENDARY; // + 0.018 = 0.020
        if (roll < cumulative) {
          selectedRarity = 'LEGENDARY';
          state.pityCount = 0; // Reset pity on jackpot
        } else {
          cumulative += GACHA_RATES.EPIC; // + 0.050 = 0.070
          if (roll < cumulative) {
            selectedRarity = 'EPIC';
            state.pityCount = 0; // Reset pity on jackpot
          } else {
            cumulative += GACHA_RATES.RARE; // + 0.180 = 0.250
            if (roll < cumulative) {
              selectedRarity = 'RARE';
            } else {
              cumulative += GACHA_RATES.UNCOMMON; // + 0.350 = 0.600
              if (roll < cumulative) {
                selectedRarity = 'UNCOMMON';
              } else {
                selectedRarity = 'COMMON'; // remaining 0.400 (40%)
              }
            }
          }
        }
      }
    }

    // Pick random buddy of that rarity
    const matchingBuddies = ALL_BUDDIES.filter((b) => b.rarity === selectedRarity);
    const buddy = matchingBuddies[Math.floor(Math.random() * matchingBuddies.length)];

    const isNew = !state.unlockedBuddyIds.includes(buddy.id);
    let shardsGained = 0;

    if (isNew) {
      state.unlockedBuddyIds.push(buddy.id);
    } else {
      // Duplicate gives Star Shards
      const shardMap: Record<GachaRarity, number> = {
        COMMON: 5,
        UNCOMMON: 15,
        RARE: 50,
        EPIC: 150,
        LEGENDARY: 500,
        MYTHIC: 2000,
      };
      shardsGained = shardMap[buddy.rarity];
      state.starShards += shardsGained;
    }

    state.pullHistory.unshift({
      buddyId: buddy.id,
      timestamp: new Date().toLocaleTimeString('th-TH'),
      rarity: buddy.rarity,
    });
    if (state.pullHistory.length > 50) {
      state.pullHistory.pop();
    }

    this.saveState(state);

    return {
      buddy,
      isNew,
      isPity,
      shardsGained,
    };
  },

  // Perform 10-pull
  pullTen(): GachaPullResult[] | { error: string } {
    const state = this.getState();
    if (state.tickets < 10) {
      return { error: 'ตั๋วสุ่มไม่เพียงพอ (ต้องการ 10 ใบ)' };
    }

    const results: GachaPullResult[] = [];
    for (let i = 0; i < 10; i++) {
      const res = this.pullOne();
      if ('error' in res) break;
      results.push(res);
    }

    return results;
  },

  resetPity(): void {
    const state = this.getState();
    state.pityCount = 0;
    this.saveState(state);
  },
};
