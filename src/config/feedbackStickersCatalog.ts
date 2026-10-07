// ============================================================================
// Multi-Strand Feedback Stickers Catalog for Teachers (แคตตาล็อคสติกเกอร์คำติชม 1-Tap)
// ออกแบบตามระบบ Pastel Anime Education Dashboard:
// 1. แคตตาล็อคจัดหมวดหมู่ตามกลุ่มสาระการเรียนรู้ (รายวิชาเอก) + หมวดทั่วไป/วินัย
// 2. ตรวจจับกลุ่มสาระอัตโนมัติ (Auto-detect) จากรหัสวิชาและชื่อวิชา
// 3. จดจำหมวดหมู่ที่ครูเลือกไว้เป็นค่าเริ่มต้น (Teacher Preferred Strand) ใน localStorage
// 4. รองรับการเพิ่มสติกเกอร์คำติชมส่วนตัวของครู (Custom Stickers) จัดเก็บใน localStorage
// ============================================================================

export type FeedbackStrandId =
  | 'GENERAL'
  | 'MATH'
  | 'SCIENCE'
  | 'THAI'
  | 'FOREIGN_LANG'
  | 'SOCIAL'
  | 'PE_HEALTH'
  | 'ART_MUSIC'
  | 'CAREER';

export interface FeedbackStrandCategory {
  id: FeedbackStrandId;
  name: string;
  shortName: string;
  strandName: string;
  iconSymbol: string;
  badgeClass: string;
  activePillClass: string;
  defaultStickers: string[];
}

export const FEEDBACK_STRAND_CATALOG: FeedbackStrandCategory[] = [
  {
    id: 'GENERAL',
    name: 'ทั่วไป & วินัยการส่งงาน',
    shortName: 'ทั่วไป',
    strandName: 'งานทั่วไป / วินัยและความรับผิดชอบ',
    iconSymbol: '🌟',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    activePillClass: 'bg-blue-600 text-white',
    defaultStickers: [
      '🌟 ยอดเยี่ยมมาก ผลงานสมบูรณ์แบบ',
      '⏰ ส่งงานตรงเวลา มีความรับผิดชอบสูง',
      '👍 ตอบคำถามครบถ้วนสมบูรณ์ตามเกณฑ์',
      '✍️ ลายมือเรียบร้อย อ่านง่าย เป็นระเบียบ',
      '💡 มีความคิดริเริ่มสร้างสรรค์ยอดเยี่ยม',
      '🔍 ควรตรวจทานคำตอบก่อนส่งอีกครั้ง',
      '📝 ปรับปรุงความละเอียดของงานเพิ่มเติม',
      '⚡ ส่งงานล่าช้า ขอให้รักษาเวลาในงานถัดไป',
      '👏 พัฒนาการดีขึ้นอย่างเห็นได้ชัด',
    ],
  },
  {
    id: 'MATH',
    name: 'คณิตศาสตร์',
    shortName: 'คณิต',
    strandName: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    iconSymbol: '📐',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activePillClass: 'bg-indigo-600 text-white',
    defaultStickers: [
      '📐 แสดงวิธีทำละเอียดเป็นขั้นตอนชัดเจน',
      '🔢 คำนวณตัวเลขได้ถูกต้องแม่นยำ',
      '⚠️ ระวังเครื่องหมายบวกลบ / การย้ายข้าง',
      '📏 ตรวจสอบทศนิยมและเศษส่วนเพิ่มเติม',
      '🎯 สรุปคำตอบสุดท้ายพร้อมระบุหน่วยชัดเจน',
      '💡 เลือกใช้สูตรและทฤษฎีบทได้เหมาะสม',
      '📊 วาดกราฟ/รูปทรงเรขาคณิตได้ถูกต้อง',
      '🔍 ทบทวนขั้นตอนการพิสูจน์อีกครั้ง',
    ],
  },
  {
    id: 'SCIENCE',
    name: 'วิทยาศาสตร์ & เทคโนโลยี',
    shortName: 'วิทย์-คอม',
    strandName: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    iconSymbol: '🔬',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    activePillClass: 'bg-teal-600 text-white',
    defaultStickers: [
      '🔬 สรุปผลการทดลองสอดคล้องกับสมมติฐาน',
      '📊 บันทึกตารางข้อมูลและการสังเกตได้ละเอียด',
      '💡 เชื่อมโยงหลักการทางวิทยาศาสตร์ได้ถูกต้อง',
      '💻 เขียนโค้ดทำงานถูกต้อง Clean Code',
      '⚙️ ระบุตัวแปรต้น ตัวแปรตาม ตัวแปรควบคุมครบถ้วน',
      '🧪 ออกแบบการทดลองได้รัดกุมและปลอดภัย',
      '🤖 ประยุกต์ใช้เทคโนโลยีได้อย่างสร้างสรรค์',
      '🔍 เพิ่มการอภิปรายผลข้อผิดพลาดของการทดลอง',
    ],
  },
  {
    id: 'THAI',
    name: 'ภาษาไทย',
    shortName: 'ภาษาไทย',
    strandName: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
    iconSymbol: '✍️',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    activePillClass: 'bg-orange-600 text-white',
    defaultStickers: [
      '✍️ ลายมือสวยงาม คัดตัวบรรจงมีหัว',
      '📖 สะกดคำถูกต้องตามพจนานุกรม',
      '📜 การใช้สำนวนโวหารสละสลวย น่าอ่าน',
      '⚠️ ตรวจสอบวรรณยุกต์และการใช้คำซ้ำ',
      '📑 สรุปใจความสำคัญและจับประเด็นได้ดี',
      '🎭 ตีความบทประพันธ์และวิเคราะห์คุณค่าลึกซึ้ง',
      '📝 ควรเว้นวรรคตอนและจัดย่อหน้าให้เป็นระเบียบ',
      '💡 เลือกใช้ระดับภาษาเหมาะสมกับบริบท',
    ],
  },
  {
    id: 'FOREIGN_LANG',
    name: 'ภาษาต่างประเทศ',
    shortName: 'ภาษาต่างประเทศ',
    strandName: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (อังกฤษ / ญี่ปุ่น / จีน)',
    iconSymbol: '🌸',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activePillClass: 'bg-rose-600 text-white',
    defaultStickers: [
      '🌟 Good job! Grammar and vocabulary accurate',
      '🗣️ Natural expression & fluent sentences',
      '🌸 ตัวอักษรฮิรางานะ/คาตาคานะ เขียนถูกต้องสวยงาม',
      '🏮 ลำดับขีดคันจิ/อักษรจีน ถูกต้องและเป็นระเบียบ',
      '⚠️ Watch out for tense & subject-verb agreement',
      '📖 Enrich your vocabulary with varied synonyms',
      '🎯 ตอบคำถาม Reading Comprehension ได้ตรงจุด',
      '👏 Great effort in pronunciation and speaking',
    ],
  },
  {
    id: 'SOCIAL',
    name: 'สังคมศึกษา & ประวัติศาสตร์',
    shortName: 'สังคมศึกษา',
    strandName: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
    iconSymbol: '🌍',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activePillClass: 'bg-emerald-600 text-white',
    defaultStickers: [
      '🌍 วิเคราะห์บริบททางประวัติศาสตร์ได้รอบด้าน',
      '⚖️ เชื่อมโยงหลักธรรมกับการดำเนินชีวิตได้ดี',
      '🏛️ เข้าใจหน้าที่พลเมืองและกฎหมายอย่างถูกต้อง',
      '🗺️ อ่านและตีความแผนที่/ภูมิสารสนเทศได้แม่นยำ',
      '📰 มีมุมมองที่น่าสนใจในการวิเคราะห์ประเด็นข่าว',
      '💡 แสดงความคิดเห็นอย่างมีเหตุผลและสร้างสรรค์',
      '🔍 ควรเพิ่มหลักฐานอ้างอิงประกอบข้อคิดเห็น',
    ],
  },
  {
    id: 'PE_HEALTH',
    name: 'สุขศึกษา & พลศึกษา',
    shortName: 'สุข-พละ',
    strandName: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    iconSymbol: '⚽',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    activePillClass: 'bg-amber-600 text-white',
    defaultStickers: [
      '🏃 ปฏิบัติทักษะการเคลื่อนไหวได้ถูกต้องคล่องแคล่ว',
      '🤝 มีน้ำใจนักกีฬาและเคารพกฎกติกาสากล',
      '🥗 วิเคราะห์หลักโภชนาการและการดูแลสุขภาพได้ดี',
      '⚠️ ระมัดระวังเรื่องความปลอดภัยในการออกกำลังกาย',
      '💪 ร่างกายแข็งแรง มีความมุ่งมั่นและอดทน',
      '🚑 มีความรู้การปฐมพยาบาลเบื้องต้นถูกต้อง',
    ],
  },
  {
    id: 'ART_MUSIC',
    name: 'ศิลปะ ดนตรี & นาฏศิลป์',
    shortName: 'ศิลปะ-ดนตรี',
    strandName: 'กลุ่มสาระการเรียนรู้ศิลปะ (ทัศนศิลป์ ดนตรี นาฏศิลป์)',
    iconSymbol: '🎨',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    activePillClass: 'bg-purple-600 text-white',
    defaultStickers: [
      '🎨 ระบายสีแสงเงาและทัศนธาตุสมบูรณ์',
      '✨ สัดส่วนองค์ประกอบศิลป์ (Composition) โดดเด่น',
      '🌟 ลายเส้นคมชัด มีเอกลักษณ์เฉพาะตัว',
      '🎵 ปฏิบัติเครื่องดนตรี/ขับร้องตรงจังหวะและทำนอง',
      '🎶 อ่านโน้ตดนตรีและเคาะจังหวะได้แม่นยำ',
      '💃 ท่ารำอ่อนช้อย ถูกต้องตามแบบแผนนาฏศิลป์',
      '📝 ปรับปรุงการลงน้ำหนักมือและการตัดเส้น',
    ],
  },
  {
    id: 'CAREER',
    name: 'การงานอาชีพ & เกษตร',
    shortName: 'การงาน',
    strandName: 'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    iconSymbol: '🌱',
    badgeClass: 'bg-lime-50 text-lime-700 border-lime-200',
    activePillClass: 'bg-lime-600 text-white',
    defaultStickers: [
      '🛠️ ปฏิบัติงานตามขั้นตอนกระบวนการอย่างปลอดภัย',
      '🌱 ผลงานประณีต แข็งแรง ใช้งานได้จริง',
      '💡 วางแผนประหยัดวัสดุและรักษาสิ่งแวดล้อม',
      '💼 มีแนวคิดการต่อยอดเป็นธุรกิจหรืออาชีพได้ดี',
      '🧹 ดูแลรักษาและจัดเก็บเครื่องมืออย่างเรียบร้อย',
      '🍳 จัดจานสวยงามและถูกหลักสุขอนามัย',
    ],
  },
];

// LocalStorage Keys
export const STORAGE_KEYS = {
  PREFERRED_STRAND: 'kp_teacher_feedback_preferred_strand',
  CUSTOM_STICKERS: 'kp_custom_feedback_stickers',
};

// Node/SSR In-Memory Fallbacks
let memoryPreferredStrand: FeedbackStrandId | null = null;
let memoryCustomStickers: Record<string, string[]> = {};

/**
 * Intelligent strand auto-detection from course code or subject title
 */
export function detectFeedbackStrand(
  courseCode?: string,
  subjectName?: string
): FeedbackStrandId {
  const code = (courseCode || '').trim();
  const name = (subjectName || '').trim();
  const combined = `${code} ${name}`.toLowerCase();

  // 1. Specific Keywords
  if (
    combined.includes('ญี่ปุ่น') ||
    combined.includes('japanese') ||
    combined.includes('อังกฤษ') ||
    combined.includes('english') ||
    combined.includes('จีน') ||
    combined.includes('chinese') ||
    combined.includes('เกาหลี') ||
    combined.includes('ฝรั่งเศส')
  ) {
    return 'FOREIGN_LANG';
  }

  if (
    combined.includes('ศิลปะ') ||
    combined.includes('ทัศนศิลป์') ||
    combined.includes('ดนตรี') ||
    combined.includes('นาฏศิลป์') ||
    combined.includes('วาด')
  ) {
    return 'ART_MUSIC';
  }

  if (
    combined.includes('คณิต') ||
    combined.includes('math') ||
    combined.includes('แคลคูลัส') ||
    combined.includes('เรขาคณิต')
  ) {
    return 'MATH';
  }

  if (
    combined.includes('วิทย์') ||
    combined.includes('ฟิสิกส์') ||
    combined.includes('เคมี') ||
    combined.includes('ชีว') ||
    combined.includes('คอมพิวเตอร์') ||
    combined.includes('เทคโนโลยี') ||
    combined.includes('วิทยาการคำนวณ') ||
    combined.includes('โค้ด')
  ) {
    return 'SCIENCE';
  }

  if (
    combined.includes('ภาษาไทย') ||
    combined.includes('วรรณคดี') ||
    combined.includes('คัดลายมือ') ||
    combined.includes('เรียงความ')
  ) {
    return 'THAI';
  }

  if (
    combined.includes('สังคม') ||
    combined.includes('ประวัติศาสตร์') ||
    combined.includes('หน้าที่พลเมือง') ||
    combined.includes('ภูมิศาสตร์') ||
    combined.includes('ศาสนา')
  ) {
    return 'SOCIAL';
  }

  if (
    combined.includes('สุขศึกษา') ||
    combined.includes('พลศึกษา') ||
    combined.includes('พละ') ||
    combined.includes('กีฬา') ||
    combined.includes('กรีฑา') ||
    combined.includes('ว่ายน้ำ')
  ) {
    return 'PE_HEALTH';
  }

  if (
    combined.includes('การงาน') ||
    combined.includes('เกษตร') ||
    combined.includes('คหกรรม') ||
    combined.includes('ช่าง') ||
    combined.includes('ธุรกิจ')
  ) {
    return 'CAREER';
  }

  // 2. Thai MoE Initial Code Letter Detection
  if (code.length > 0) {
    const firstChar = code.charAt(0);
    switch (firstChar) {
      case 'ญ':
      case 'อ':
      case 'จ':
      case 'ฝ':
        return 'FOREIGN_LANG';
      case 'ศ':
        return 'ART_MUSIC';
      case 'ค':
        return 'MATH';
      case 'ว':
        return 'SCIENCE';
      case 'ท':
        return 'THAI';
      case 'ส':
        return 'SOCIAL';
      case 'พ':
        return 'PE_HEALTH';
      case 'ง':
        return 'CAREER';
      default:
        break;
    }
  }

  return 'GENERAL';
}

/**
 * Get category by ID
 */
export function getCategoryById(strandId: string): FeedbackStrandCategory {
  const found = FEEDBACK_STRAND_CATALOG.find((c) => c.id === strandId);
  return found || FEEDBACK_STRAND_CATALOG[0];
}

/**
 * Retrieve teacher's preferred strand from storage
 */
export function getTeacherPreferredStrand(): FeedbackStrandId | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PREFERRED_STRAND);
      if (val && FEEDBACK_STRAND_CATALOG.some((c) => c.id === val)) {
        return val as FeedbackStrandId;
      }
    } catch {
      // Fallback
    }
  }
  return memoryPreferredStrand;
}

/**
 * Save teacher's preferred strand to storage
 */
export function setTeacherPreferredStrand(strandId: FeedbackStrandId): void {
  memoryPreferredStrand = strandId;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_STRAND, strandId);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Get all custom feedback stickers recorded by teachers
 */
export function getCustomFeedbackStickers(strandId?: string): string[] {
  let map: Record<string, string[]> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_STICKERS);
      if (raw) {
        map = JSON.parse(raw);
      }
    } catch {
      map = memoryCustomStickers;
    }
  } else {
    map = memoryCustomStickers;
  }

  if (strandId) {
    return Array.isArray(map[strandId]) ? map[strandId] : [];
  }
  return Object.values(map).flat();
}

/**
 * Add a teacher's custom sticker to a specific strand
 */
export function addCustomFeedbackSticker(strandId: string, stickerText: string): string[] {
  const trimmed = stickerText.trim();
  if (!trimmed) return getCustomFeedbackStickers(strandId);

  let map: Record<string, string[]> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_STICKERS);
      if (raw) map = JSON.parse(raw);
    } catch {
      map = { ...memoryCustomStickers };
    }
  } else {
    map = { ...memoryCustomStickers };
  }

  const existing = Array.isArray(map[strandId]) ? map[strandId] : [];
  if (!existing.includes(trimmed)) {
    existing.push(trimmed);
  }
  map[strandId] = existing;

  memoryCustomStickers = map;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_STICKERS, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  return existing;
}

/**
 * Remove a custom sticker
 */
export function removeCustomFeedbackSticker(strandId: string, stickerText: string): string[] {
  let map: Record<string, string[]> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_STICKERS);
      if (raw) map = JSON.parse(raw);
    } catch {
      map = { ...memoryCustomStickers };
    }
  } else {
    map = { ...memoryCustomStickers };
  }

  const existing = Array.isArray(map[strandId]) ? map[strandId] : [];
  const updated = existing.filter((s) => s !== stickerText);
  map[strandId] = updated;

  memoryCustomStickers = map;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_STICKERS, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  return updated;
}

/**
 * Get all stickers (default + custom) for a given strand category
 */
export function getAllStickersForStrand(strandId: string): string[] {
  const cat = getCategoryById(strandId);
  const custom = getCustomFeedbackStickers(strandId);
  return [...cat.defaultStickers, ...custom];
}

export const FEEDBACK_STICKERS_BY_STRAND: Record<string, { id: string; name: string; stickers: string[] }> = {
  visual_arts: {
    id: 'visual_arts',
    name: 'ทัศนศิลป์',
    stickers: [
      '🎨 องค์ประกอบศิลป์สวยงามลงตัว',
      '🖌️ การลงสีและไล่น้ำหนักยอดเยี่ยม',
      '✨ มีความคิดสร้างสรรค์ที่เป็นเอกลักษณ์',
      '📐 สัดส่วนและโครงสร้างแม่นยำ',
      '🌟 ผลงานประณีตเรียบร้อยมาก',
    ],
  },
  music_drama: {
    id: 'music_drama',
    name: 'ดนตรี-นาฏศิลป์',
    stickers: [
      '🎵 จังหวะและทำนองแม่นยำ',
      '🎭 ถ่ายทอดอารมณ์และลีลาได้ดีเยี่ยม',
      '👏 ทักษะการปฏิบัติคล่องแคล่ว',
      '🎼 มีความเข้าใจทฤษฎีดนตรีอย่างลึกซึ้ง',
    ],
  },
  foreign_languages: {
    id: 'foreign_languages',
    name: 'ภาษาต่างประเทศ',
    stickers: [
      '🗣️ สำเนียงและการออกเสียงชัดเจน',
      '📖 ไวยากรณ์ถูกต้องเหมาะสมตามบริบท',
      '✍️ คลังคำศัพท์หลากหลายและตรงประเด็น',
      '🎌 สื่อสารได้เป็นธรรมชาติและมั่นใจ',
    ],
  },
  thai: {
    id: 'thai',
    name: 'ภาษาไทย',
    stickers: [
      '✍️ ลายมือสวยงาม สะกดคำถูกต้องแม่นยำ',
      '📜 การใช้ภาษาไพเราะและสละสลวย',
      '💡 สรุปใจความสำคัญได้ครบถ้วน',
      '📖 การอ่านออกเสียงถูกต้องตามอักขรวิธี',
    ],
  },
  mathematics: {
    id: 'mathematics',
    name: 'คณิตศาสตร์',
    stickers: [
      '📐 แสดงวิธีทำละเอียดเป็นขั้นตอน',
      '🔢 คำนวณคำตอบถูกต้องแม่นยำ',
      '💡 ประยุกต์ใช้สูตรและทฤษฎีได้ยอดเยี่ยม',
      '🔍 เหตุผลและตรรกะทางคณิตศาสตร์ชัดเจน',
    ],
  },
  science_technology: {
    id: 'science_technology',
    name: 'วิทยาศาสตร์และเทคโนโลยี',
    stickers: [
      '🔬 บันทึกผลการทดลองละเอียดและถูกต้อง',
      '💻 เขียนโค้ดเป็นระเบียบ ทำงานได้สมบูรณ์',
      '🧪 คิดวิเคราะห์ตามกระบวนการวิทยาศาสตร์ได้ดี',
      '📊 สรุปและอภิปรายผลได้มีหลักการ',
    ],
  },
  social_studies: {
    id: 'social_studies',
    name: 'สังคมศึกษาฯ',
    stickers: [
      '🌍 วิเคราะห์ข้อมูลประวัติศาสตร์และสังคมได้ลึกซึ้ง',
      '🤝 มีจิตสาธารณะและความเข้าใจคุณธรรมจริยธรรม',
      '🗺️ เชื่อมโยงบริบทภูมิศาสตร์กับชีวิตประจำวันได้ดี',
      '⚖️ มีวิจารณญาณและเหตุผลทางสังคมศาสตร์',
    ],
  },
  health_pe: {
    id: 'health_pe',
    name: 'สุขศึกษาและพลศึกษา',
    stickers: [
      '🏃 มีทักษะการเคลื่อนไหวและสมรรถภาพยอดเยี่ยม',
      '⚽ เล่นตามกติกาและมีน้ำใจนักกีฬา',
      '🍎 มีความรู้ความเข้าใจด้านสุขอนามัยที่ดี',
      '💪 มีวินัยและความพร้อมในการปฏิบัติ',
    ],
  },
  career_vocational: {
    id: 'career_vocational',
    name: 'การงานอาชีพ',
    stickers: [
      '🛠️ ทักษะการปฏิบัติงานคล่องแคล่วและปลอดภัย',
      '💼 วางแผนและดำเนินงานอย่างเป็นขั้นตอน',
      '✨ ผลงานชิ้นงานประณีตและนำไปใช้ได้จริง',
      '🌱 มีจิตสำนึกในการใช้ทรัพยากรอย่างคุ้มค่า',
    ],
  },
  general: {
    id: 'general',
    name: 'ทั่วไป & วินัยการส่งงาน',
    stickers: [
      '🌟 ยอดเยี่ยมมาก ผลงานสมบูรณ์แบบ',
      '⏰ ส่งงานตรงเวลา มีความรับผิดชอบสูง',
      '👍 ตอบคำถามครบถ้วนสมบูรณ์ตามเกณฑ์',
      '✍️ ลายมือเรียบร้อย อ่านง่าย เป็นระเบียบ',
    ],
  },
};

