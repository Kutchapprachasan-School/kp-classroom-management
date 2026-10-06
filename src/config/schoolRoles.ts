export type SchoolUserRole =
  | 'TEACHER_GENERAL'
  | 'STUDENT_AFFAIRS'
  | 'ACADEMIC_ADMIN'
  | 'STUDENT_GENERAL'
  | 'STUDENT_COUNCIL';

export interface SchoolRoleProfile {
  role: SchoolUserRole;
  shortLabel: string;
  title: string;
  badgeText: string;
  badgeColor: string;
  userName: string;
  userPosition: string;
  emailOrCode: string;
  department: string;
  defaultView: string;
  description: string;
  keyPermissions: string[];
  restrictedNote: string;
}

export type SchoolFontFamily =
  | 'Sarabun'
  | 'Prompt'
  | 'Kanit'
  | 'Noto Sans Thai'
  | 'IBM Plex Sans Thai';

export type MorningToClassSyncMode = 'AUTO_PREFILL' | 'MANUAL_FRESH';

export interface SchoolBrandingSettings {
  classroomSystemTitle: string;
  nameTh: string;
  nameEn: string;
  shortCode: string;
  districtProvince: string;
  affiliation: string;
  domain: string;
  academicTerm: string;
  logoUrl: string;
  smsSystemName: string;
  smsApiUrl: string;
  smsLastSyncedAt: string;
  fontFamily: SchoolFontFamily;
  baseFontSizePx: number;
  morningToClassSyncMode: MorningToClassSyncMode;
  motto?: string;
  vision?: string;
  mission?: string;
  postalCode?: string;
  phoneNumber?: string;
}

export interface SmsUserAccount {
  id: string;
  smsId: string;
  username: string;
  loginAliases: string[];
  passwordOrPin: string;
  fullName: string;
  role: SchoolUserRole;
  departmentOrClass: string;
  positionTitle: string;
  smsGroup: 'PERSONNEL' | 'STUDENT';
  smsSynced: boolean;
}

// โลโก้ตราประจำโรงเรียนกุดจับประชาสรรค์ (ตรงตามหน้า School Management System: คบเพลิงเปลวไฟสีแดง รัศมีสีทอง อักษรย่อ กป และริบบิ้นสีฟ้า)
export const DEFAULT_KUTCHAP_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <defs>
    <linearGradient id="rayGold" x1="30" y1="15" x2="130" y2="125" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="55%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="flameRed" x1="80" y1="22" x2="80" y2="68" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="60%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
    <linearGradient id="ribbonBlue" x1="25" y1="115" x2="135" y2="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#0369A1"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <!-- รัศมีสีทองรอบคบเพลิง -->
  <path d="M80 14 L84 32 L93 17 L91 35 L105 23 L97 40 L114 33 L102 47 L120 46 L104 56 L121 60 L104 65 L118 75 L100 75 L110 89 L94 83 L40 89 L50 89 L60 75 L42 75 L56 65 L39 60 L56 56 L40 46 L58 47 L46 33 L63 40 L55 23 L69 35 L67 17 L76 32 Z" fill="url(#rayGold)"/>
  <!-- เปลวเพลิงสีแดงตรงกลาง -->
  <path d="M80 24 C90 36 93 48 86 58 C83 62 77 62 74 58 C67 48 70 36 80 24 Z" fill="url(#flameRed)"/>
  <path d="M80 34 C85 42 86 50 82 56 C80 58 78 56 80 34 Z" fill="#FCA5A5" opacity="0.6"/>
  <!-- ด้ามคบเพลิงและวงกลมตรา กป -->
  <path d="M75 58 L85 58 L83 74 L77 74 Z" fill="#B45309"/>
  <circle cx="80" cy="96" r="24" fill="#FEFCE8" stroke="url(#rayGold)" stroke-width="4.5"/>
  <circle cx="80" cy="96" r="19" fill="#FFFFFF" stroke="#FDE047" stroke-width="1.2"/>
  <!-- อักษร กป สีน้ำเงินเข้ม -->
  <text x="80" y="103" text-anchor="middle" fill="#1E293B" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="-0.5">คยพ</text>
  <!-- ริบบิ้นสีฟ้าด้านล่าง -->
  <path d="M26 118 L44 112 L48 126 L32 132 Z" fill="#0EA5E9"/>
  <path d="M134 118 L116 112 L112 126 L128 132 Z" fill="#0EA5E9"/>
  <path d="M38 116 C58 126 102 126 122 116 L126 130 C102 140 58 140 34 130 Z" fill="url(#ribbonBlue)" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="80" y="130" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="700" font-size="8.5">โรงเรียนคำยางพิทยา</text>
</svg>
`)}`;

export const KUTCHAP_SCHOOL_INFO: SchoolBrandingSettings = {
  classroomSystemTitle: 'ระบบจัดการชั้นเรียน',
  nameTh: 'โรงเรียนคำยางพิทยา',
  nameEn: 'Khamyang Pittaya School',
  shortCode: 'ค.ย.พ. • สพม.อุดรธานี',
  districtProvince: 'ต.นาสูง อ.วังสามหมอ จ.อุดรธานี',
  affiliation: 'School Management System',
  domain: 'khamyang.ac.th',
  academicTerm: 'ภาคเรียนที่ 1/2569',
  logoUrl: DEFAULT_KUTCHAP_LOGO_SVG,
  smsSystemName: 'School Management System',
  smsApiUrl: 'https://sms.khamyang.ac.th/api/v1/auth-sync',
  smsLastSyncedAt: '30 ก.ย. 2569 • 11:05 น.',
  fontFamily: 'Prompt',
  baseFontSizePx: 15,
  morningToClassSyncMode: 'AUTO_PREFILL',
  motto: 'ร่วมสร้างโอกาส พัฒนาผู้เรียน สู่อนาคตที่ดีกว่า',
  vision: 'มุ่งมั่นพัฒนาผู้เรียนให้มีความรู้ คู่คุณธรรม ก้าวทันเทคโนโลยี มีทักษะในศตวรรษที่ 21',
  mission: 'ส่งเสริมการจัดการเรียนรู้เชิงรุก (Active Learning) พัฒนาระบบดิจิทัลเพื่อการศึกษา และสร้างเสริมสุขภาวะที่ดีของผู้เรียน',
  postalCode: '41280',
  phoneNumber: '042-298-123',
};

const SCHOOL_SETTINGS_STORAGE_KEY = 'kps_school_branding_settings_v1';
const SMS_USERS_STORAGE_KEY = 'kps_sms_unified_users_v1';

export function clampFontSize11To20(val: number | undefined): number {
  const numeric = typeof val === 'number' && !Number.isNaN(val) ? val : 15;
  return Math.min(20, Math.max(11, Math.round(numeric)));
}

export function applySchoolBrandingAndTypography(settings?: SchoolBrandingSettings): void {
  if (typeof document === 'undefined') return;
  const current = settings || getSchoolSettings();
  const clampedPx = clampFontSize11To20(current.baseFontSizePx);
  const font = current.fontFamily || 'Prompt';

  // Ensure Google Fonts stylesheet for Thai fonts is loaded
  const fontLinkId = 'kps-google-fonts-thai';
  if (!document.getElementById(fontLinkId)) {
    const link = document.createElement('link');
    link.id = fontLinkId;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Kanit:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  document.documentElement.style.setProperty(
    '--kps-font-family',
    `'${font}', -apple-system, BlinkMacSystemFont, sans-serif`
  );
  document.documentElement.style.setProperty('--kps-base-font-size', `${clampedPx}px`);
  document.title = `${current.classroomSystemTitle} — ${current.nameTh}`;
}

export function getSchoolSettings(): SchoolBrandingSettings {
  if (typeof window === 'undefined') return KUTCHAP_SCHOOL_INFO;
  try {
    const raw = window.localStorage.getItem(SCHOOL_SETTINGS_STORAGE_KEY);
    if (!raw) return KUTCHAP_SCHOOL_INFO;
    const parsed = JSON.parse(raw) as Partial<SchoolBrandingSettings>;
    return {
      ...KUTCHAP_SCHOOL_INFO,
      ...parsed,
      logoUrl: parsed.logoUrl?.trim() ? parsed.logoUrl : DEFAULT_KUTCHAP_LOGO_SVG,
      baseFontSizePx: clampFontSize11To20(parsed.baseFontSizePx),
      fontFamily: parsed.fontFamily || 'Prompt',
      morningToClassSyncMode: parsed.morningToClassSyncMode || 'AUTO_PREFILL',
    };
  } catch {
    return KUTCHAP_SCHOOL_INFO;
  }
}

export function saveSchoolSettings(next: Partial<SchoolBrandingSettings>): SchoolBrandingSettings {
  const merged: SchoolBrandingSettings = {
    ...getSchoolSettings(),
    ...next,
  };
  if (!merged.logoUrl?.trim()) {
    merged.logoUrl = DEFAULT_KUTCHAP_LOGO_SVG;
  }
  merged.baseFontSizePx = clampFontSize11To20(merged.baseFontSizePx);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    applySchoolBrandingAndTypography(merged);
    window.dispatchEvent(new Event('kps-school-settings-updated'));
  }
  return merged;
}

export function resetSchoolSettingsToDefault(): SchoolBrandingSettings {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SCHOOL_SETTINGS_STORAGE_KEY);
    applySchoolBrandingAndTypography(KUTCHAP_SCHOOL_INFO);
    window.dispatchEvent(new Event('kps-school-settings-updated'));
  }
  return KUTCHAP_SCHOOL_INFO;
}

export const DEFAULT_SMS_USERS: SmsUserAccount[] = [
  {
    id: 'u-1',
    smsId: 'KPS-T104',
    username: 'passapoom.r@kutchap.ac.th',
    loginAliases: ['passapoom.r@kutchap.ac.th', 'passapoom.r', 'KPS-T104', 'T104', 'ครูภาสภูมิ'],
    passwordOrPin: '123456',
    fullName: 'ครูภาสภูมิ เรืองปราชญ์',
    role: 'TEACHER_GENERAL',
    departmentOrClass: 'กลุ่มสาระการเรียนรู้ศิลปะ (ที่ปรึกษา ม.3/1)',
    positionTitle: 'ครูชำนาญการ • ครูประจำวิชา & ครูที่ปรึกษา',
    smsGroup: 'PERSONNEL',
    smsSynced: true,
  },
  {
    id: 'u-2',
    smsId: 'KPS-A201',
    username: 'wiphada.s@kutchap.ac.th',
    loginAliases: ['wiphada.s@kutchap.ac.th', 'wiphada.s', 'KPS-A201', 'A201', 'ครูวิภาดา'],
    passwordOrPin: '123456',
    fullName: 'ครูวิภาดา สมบูรณ์',
    role: 'STUDENT_AFFAIRS',
    departmentOrClass: 'กลุ่มบริหารงานกิจการนักเรียน • รร.กุดจับประชาสรรค์',
    positionTitle: 'หัวหน้างานกิจการนักเรียน & ระบบดูแลช่วยเหลือนักเรียน',
    smsGroup: 'PERSONNEL',
    smsSynced: true,
  },
  {
    id: 'u-3',
    smsId: 'KPS-M001',
    username: 'ekkachai.m@kutchap.ac.th',
    loginAliases: ['ekkachai.m@kutchap.ac.th', 'ekkachai.m', 'KPS-M001', 'M001', 'admin', 'ครูเอกชัย', 'นายสมชาย', 'สมชาย', 'somchai'],
    passwordOrPin: '123456',
    fullName: 'นายสมชาย ใจดี',
    role: 'ACADEMIC_ADMIN',
    departmentOrClass: 'ฝ่ายบริหารโรงเรียนศึกษาวิทยา',
    positionTitle: 'ผู้อำนวยการโรงเรียน • ผู้บริหารและผู้ดูแลระบบ',
    smsGroup: 'PERSONNEL',
    smsSynced: true,
  },
  {
    id: 'u-4',
    smsId: '45102',
    username: '45102',
    loginAliases: ['45102', '45102@kutchap.ac.th', 'STD-45102', 'ทัตธน'],
    passwordOrPin: '2510',
    fullName: 'ด.ช. ทัตธน คำฝั้น',
    role: 'STUDENT_GENERAL',
    departmentOrClass: 'ชั้นมัธยมศึกษาปีที่ 3/1 • เลขที่ 15',
    positionTitle: 'นักเรียนชั้นมัธยมศึกษาปีที่ 3/1',
    smsGroup: 'STUDENT',
    smsSynced: true,
  },
  {
    id: 'u-5',
    smsId: '42018',
    username: '42018',
    loginAliases: ['42018', '42018@kutchap.ac.th', 'STD-42018', 'พิมพ์ชนก'],
    passwordOrPin: '2510',
    fullName: 'น.ส. พิมพ์ชนก วงศ์สวัสดิ์',
    role: 'STUDENT_COUNCIL',
    departmentOrClass: 'คณะกรรมการสภานักเรียน • ชั้น ม.5/1',
    positionTitle: 'ประธานสภานักเรียน โรงเรียนกุดจับประชาสรรค์',
    smsGroup: 'STUDENT',
    smsSynced: true,
  },
  {
    id: 'u-6',
    smsId: '45101',
    username: '45101',
    loginAliases: ['45101', '45101@kutchap.ac.th', 'STD-45101', 'กันต์ริศย์'],
    passwordOrPin: '2510',
    fullName: 'ด.ช. กันต์ริศย์ ทวีเศรษฐกร',
    role: 'STUDENT_GENERAL',
    departmentOrClass: 'ชั้นมัธยมศึกษาปีที่ 2/1 • เลขที่ 1',
    positionTitle: 'นักเรียนชั้นมัธยมศึกษาปีที่ 2/1',
    smsGroup: 'STUDENT',
    smsSynced: true,
  },
];

export function getSmsUsers(): SmsUserAccount[] {
  if (typeof window === 'undefined') return DEFAULT_SMS_USERS;
  try {
    const raw = window.localStorage.getItem(SMS_USERS_STORAGE_KEY);
    if (!raw) return DEFAULT_SMS_USERS;
    const parsed = JSON.parse(raw) as SmsUserAccount[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SMS_USERS;
  } catch {
    return DEFAULT_SMS_USERS;
  }
}

export function saveSmsUsers(users: SmsUserAccount[]): SmsUserAccount[] {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SMS_USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('kps-sms-users-updated'));
  }
  return users;
}

/**
 * ตรวจสอบชื่อผู้ใช้งานจากฐานข้อมูล School Management System (SMS) แบบรวมศูนย์ (Unified Login)
 * ไม่ต้องแยกหน้าล็อกอินระหว่างครูกับนักเรียน ระบบจะดึง Role และแยกสิทธิ์การมองเห็นแต่ละหน้าให้อัตโนมัติ
 */
export function authenticateSmsUnifiedUser(inputUsername: string): SmsUserAccount {
  const clean = inputUsername.trim().toLowerCase();
  const allUsers = getSmsUsers();

  // 1. ค้นหาตรงกับ username, smsId หรือ loginAliases ในฐานข้อมูล SMS
  const matched = allUsers.find(
    (u) =>
      u.username.toLowerCase() === clean ||
      u.smsId.toLowerCase() === clean ||
      u.loginAliases.some((alias) => alias.toLowerCase() === clean) ||
      u.fullName.toLowerCase().includes(clean)
  );
  if (matched) return matched;

  // 2. กรณีกรอกรหัสตัวเลขล้วน (รหัสประจำตัวนักเรียน 5 หลักในระบบ SMS)
  if (/^\d{4,6}$/.test(clean)) {
    const isCouncil = clean === '42018' || clean.startsWith('42');
    return {
      id: `sms-std-${clean}`,
      smsId: clean,
      username: clean,
      loginAliases: [clean],
      passwordOrPin: '2510',
      fullName: isCouncil
        ? `น.ส. พิมพ์ชนก วงศ์สวัสดิ์ (รหัส ${clean})`
        : `ด.ช. ทัตธน คำฝั้น (รหัส ${clean})`,
      role: isCouncil ? 'STUDENT_COUNCIL' : 'STUDENT_GENERAL',
      departmentOrClass: isCouncil ? 'คณะกรรมการสภานักเรียน • ม.5/1' : 'นักเรียนชั้น ม.3/1',
      positionTitle: isCouncil ? 'กรรมการสภานักเรียน' : 'นักเรียนทั่วไป',
      smsGroup: 'STUDENT',
      smsSynced: true,
    };
  }

  // 3. กรณีกรอกคำที่มี admin / academic / วิชาการ
  if (clean.includes('admin') || clean.includes('ekkachai') || clean.includes('วิชาการ')) {
    return allUsers.find((u) => u.role === 'ACADEMIC_ADMIN') || DEFAULT_SMS_USERS[2];
  }

  // 4. กรณีกรอกคำที่มี affairs / wiphada / กิจการ
  if (clean.includes('wiphada') || clean.includes('affairs') || clean.includes('กิจการ')) {
    return allUsers.find((u) => u.role === 'STUDENT_AFFAIRS') || DEFAULT_SMS_USERS[1];
  }

  // 5. ค่าเริ่มต้นสำหรับบัญชีบุคลากร/ครูในระบบ SMS
  return allUsers.find((u) => u.role === 'TEACHER_GENERAL') || DEFAULT_SMS_USERS[0];
}

export const SCHOOL_ROLE_PROFILES: Record<SchoolUserRole, SchoolRoleProfile> = {
  TEACHER_GENERAL: {
    role: 'TEACHER_GENERAL',
    shortLabel: 'ครูผู้สอนทั่วไป',
    title: 'ครูผู้ใช้งานทั่วไป (ครูประจำวิชา / ครูที่ปรึกษา)',
    badgeText: 'ครูผู้สอน & ที่ปรึกษา ม.3/1',
    badgeColor: 'bg-teal-600 text-white',
    userName: 'ครูภาสภูมิ เรืองปราชญ์',
    userPosition: 'ครูชำนาญการ • กลุ่มสาระฯ ศิลปะ (ที่ปรึกษา ม.3/1)',
    emailOrCode: 'passapoom.r@kutchap.ac.th',
    department: 'กลุ่มสาระการเรียนรู้ศิลปะ • รร.กุดจับประชาสรรค์',
    defaultView: 'home',
    description:
      'เน้นงานสอนรายคาบ เช็คชื่อแถวเช้าห้องที่ปรึกษา สั่งงาน/ตรวจงาน R2 & Canva บันทึกเยี่ยมบ้าน นร.01 และส่งเกรด ปพ.5 ของวิชาตนเอง',
    keyPermissions: [
      'เช็คชื่อแถวเช้า (07:45 น.) และรับทราบใบลาเฉพาะห้องที่ปรึกษา (ม.3/1)',
      'เข้าสอนรายคาบ บันทึกเวลาเรียน และกรอกคะแนน ปพ.5 เฉพาะรายวิชาที่ตนเองสอน',
      'สั่งงาน/ตรวจการบ้าน (อัปโหลดรูป/PDF ขึ้น R2 หรือลิงก์ Canva) และล้างไฟล์ R2 เฉพาะวิชาตนเอง',
      'บันทึกการเยี่ยมบ้าน (นร.01) และประเมิน SDQ ห้องที่ปรึกษา',
      'ตรวจความพร้อมก่อนส่งเกรด (ติด ร / มส.) เฉพาะวิชาที่รับผิดชอบ',
    ],
    restrictedNote:
      'ซ่อนเมนูตั้งค่าปีการศึกษาทั้งโรงเรียน, ซ่อนการจัดการบัญชีผู้ใช้ทั้งหมด และซ่อนการล้างไฟล์ R2 ของครูท่านอื่น',
  },
  STUDENT_AFFAIRS: {
    role: 'STUDENT_AFFAIRS',
    shortLabel: 'ฝ่ายกิจการนักเรียน',
    title: 'กลุ่มบริหารงานกิจการนักเรียน (ครูเวร / ปกครอง / แนะแนว)',
    badgeText: 'ฝ่ายกิจการนักเรียน',
    badgeColor: 'bg-amber-600 text-white',
    userName: 'ครูวิภาดา สมบูรณ์',
    userPosition: 'หัวหน้างานกิจการนักเรียน & ระบบดูแลช่วยเหลือนักเรียน',
    emailOrCode: 'wiphada.s@kutchap.ac.th',
    department: 'กลุ่มบริหารงานกิจการนักเรียน • รร.กุดจับประชาสรรค์',
    defaultView: 'student-affairs',
    description:
      'กำกับดูแลการเช็คชื่อหน้าเสาธงทั้งโรงเรียน (07:45 น.) อนุมัติใบลาออนไลน์ ตัด/เพิ่มคะแนนความประพฤติ ระบบเยี่ยมบ้าน กสศ. (CCT) และที่ปรึกษาสภานักเรียน',
    keyPermissions: [
      'เช็คชื่อแถวตอนเช้า (07:45 น.) ภาพรวมทุกสายชั้น ม.1–ม.6 และอนุมัติใบลาออนไลน์จากผู้ปกครอง',
      'บันทึกคะแนนความประพฤติ วินัย การมาสาย และแจ้งเตือนผู้ปกครองผ่าน LINE Official',
      'ติดตามความคืบหน้าการเยี่ยมบ้าน นร.01 & คัดกรอง SDQ ระดับโรงเรียน เพื่อส่งออกไฟล์เข้าเว็บ กสศ. (CCT)',
      'กำกับดูแลกิจกรรมสภานักเรียน การเลือกตั้งออนไลน์ (E-Voting) และอนุมัติงบ/โครงการสภานักเรียน',
      'ดูทะเบียนประวัติและข้อมูลติดต่อผู้ปกครองนักเรียนทุกคนในโรงเรียนกุดจับประชาสรรค์',
    ],
    restrictedNote:
      'ไม่สามารถแก้ไขคะแนนสอบ/เกรด ปพ.5 ของรายวิชาที่ไม่ได้สอน และไม่สามารถลบข้อมูลระบบวิชาการ',
  },
  ACADEMIC_ADMIN: {
    role: 'ACADEMIC_ADMIN',
    shortLabel: 'ผู้บริหาร / แอดมิน',
    title: 'ผู้บริหารโรงเรียน & ผู้ดูแลระบบ (School Executive & Admin)',
    badgeText: 'ผู้บริหาร & Admin',
    badgeColor: 'bg-indigo-600 text-white',
    userName: 'นายสมชาย ใจดี',
    userPosition: 'ผู้อำนวยการโรงเรียน • ผู้บริหารและผู้ดูแลระบบ',
    emailOrCode: 'somchai.j@suksawittaya.ac.th',
    department: 'ฝ่ายบริหารโรงเรียนศึกษาวิทยา',
    defaultView: 'admin-dashboard',
    description:
      'แดชบอร์ดผู้บริหารโรงเรียนศึกษาวิทยา กำกับติดตามผลการเรียน การเข้าเรียน ประเมินบุคลากร งบประมาณการเงิน งานซ่อมบำรุง และ AI ผู้ช่วยผู้บริหาร',
    keyPermissions: [
      'เข้าถึงแดชบอร์ดผู้บริหารระดับโรงเรียน (Executive School Management Dashboard)',
      'ตรวจสอบและกำกับติดตามผลสัมฤทธิ์ทางการเรียน สรุปเกรดเฉลี่ย (GPA) ทุกระดับชั้น และส่งออก SGS',
      'กำกับสถิติการเข้าเรียนของนักเรียนและการประเมินผลการปฏิบัติงานของบุคลากรรายบุคคล',
      'บริหารจัดการงบประมาณ การเงิน พัสดุ งานอาคารสถานที่ และระบบสารบรรณโรงเรียน',
      'เข้าถึงโซนตั้งค่าระบบทั้งหมด: จัดการบัญชีผู้ใช้ สิทธิ์ 5 บทบาท สำรองข้อมูล และเชื่อมต่อ API',
    ],
    restrictedNote: 'เข้าถึงได้ทุกเมนูปฏิบัติงานระดับผู้บริหารและโซนการตั้งค่าระบบทั้งหมด (Super Admin & Executive)',
  },
  STUDENT_GENERAL: {
    role: 'STUDENT_GENERAL',
    shortLabel: 'นักเรียนทั่วไป',
    title: 'นักเรียนทั่วไป (โรงเรียนกุดจับประชาสรรค์)',
    badgeText: 'นักเรียน ม.3/1',
    badgeColor: 'bg-emerald-600 text-white',
    userName: 'ด.ช. ทัตธน คำฝั้น',
    userPosition: 'นักเรียนชั้นมัธยมศึกษาปีที่ 3/1 • เลขที่ 15',
    emailOrCode: '45102',
    department: 'ชั้นมัธยมศึกษาปีที่ 3/1 • รร.กุดจับประชาสรรค์',
    defaultView: 'student-portal',
    description:
      'ส่งการบ้าน/ชิ้นงาน (อัปโหลดรูป/PDF ขึ้น R2 หรือแนบลิงก์ Canva) ตรวจสอบคะแนน/เวลาเรียน ยื่นใบลา กรอกข้อมูลเยี่ยมบ้าน กสศ. และลงคะแนนเลือกตั้งสภานักเรียน',
    keyPermissions: [
      'ดูภารกิจการบ้านและส่งงานรายวิชา (เลือกรูป/PDF อัปโหลดขึ้น R2 หรือส่งลิงก์ Canva / ลิงก์วิดีโอ)',
      'ตรวจสอบสมุดพกออนไลน์ เวลาเรียน 80% คะแนนเก็บ และงานค้างที่ต้องซ่อม (ร / มส.)',
      'ยื่นใบลาป่วย/ลากิจออนไลน์ และตรวจสอบคะแนนความประพฤติของตนเอง',
      'ปักหมุดพิกัดบ้าน ถ่ายรูปบ้าน และกรอกข้อมูลพื้นฐาน นร.01 (กสศ.)',
      'ใช้สิทธิ์ลงคะแนนเลือกตั้งประธานสภานักเรียน (1 คน 1 สิทธิ์) และส่งข้อเสนอแนะถึงสภานักเรียน',
    ],
    restrictedNote: 'เข้าถึงได้เฉพาะพอร์ทัลนักเรียนของตนเอง ไม่สามารถดูคะแนนเพื่อนหรือเข้าโหมดสภานักเรียนส่วนกลาง',
  },
  STUDENT_COUNCIL: {
    role: 'STUDENT_COUNCIL',
    shortLabel: 'สภานักเรียน',
    title: 'คณะกรรมการสภานักเรียน (โรงเรียนกุดจับประชาสรรค์)',
    badgeText: 'กรรมการสภานักเรียน',
    badgeColor: 'bg-purple-600 text-white',
    userName: 'น.ส. พิมพ์ชนก วงศ์สวัสดิ์',
    userPosition: 'ประธานสภานักเรียน • ชั้นมัธยมศึกษาปีที่ 5/1',
    emailOrCode: '42018',
    department: 'คณะกรรมการสภานักเรียน • รร.กุดจับประชาสรรค์',
    defaultView: 'student-portal',
    description:
      'ใช้งานพอร์ทัลนักเรียนได้ครบทุกเมนู พร้อมสิทธิ์พิเศษ "โซนปฏิบัติงานคณะกรรมการสภานักเรียน" สำหรับช่วยครูเวรตรวจแถวเช้า จัดการเลือกตั้ง และรับเรื่องร้องเรียนเพื่อนนักเรียน',
    keyPermissions: [
      'สิทธิ์พื้นฐานของนักเรียนครบทุกประการ (ส่งงาน R2/Canva, ดูสมุดพก, ยื่นใบลา, เยี่ยมบ้าน)',
      'เข้าถึง "โซนคณะกรรมการสภานักเรียน" แยกเฉพาะใน Sidebar พอร์ทัลนักเรียน',
      'ร่วมบันทึกสถิติแถวตอนเช้า (07:45 น.) รายห้อง และบันทึกกิจกรรมจิตอาสา/ความดี',
      'รับเรื่องร้องเรียน/ข้อเสนอแนะจากเพื่อนนักเรียน สรุปผลโหวต และอัปเดตสถานะการดำเนินการของสภาฯ',
      'บริหารแคมเปญเลือกตั้งสภานักเรียนและประกาศข่าวสารกิจกรรมโรงเรียนกุดจับประชาสรรค์',
    ],
    restrictedNote: 'จำกัดเฉพาะงานสภานักเรียนและกิจกรรมนักเรียน ไม่สามารถเข้าถึงคะแนนสอบ ปพ.5 หรือข้อมูลลับของครู',
  },
};
