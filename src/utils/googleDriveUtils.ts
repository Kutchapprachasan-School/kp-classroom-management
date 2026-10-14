// src/utils/googleDriveUtils.ts
// Google Drive URL Allowlist Validator & Folder Template Generator
// ออกแบบตามหลัก Forensic Architecture Rev. 3:
// 1. ตรวจสอบเฉพาะ Protocol https: และ Hostname Allowlist แบบตรงตัว (drive.google.com, docs.google.com)
// 2. ป้องกัน Phishing / Lookalike Subdomains และห้ามทำ fetch ฝั่งเซิร์ฟเวอร์ (Zero SSRF)
// 3. แยกความถูกต้องของไวยากรณ์ (Format Valid) ออกจากสิทธิ์การเข้าถึงจริง (Permission Unverified) อย่างชัดเจน
// 4. แนะนำนโยบายสิทธิ์ 2 ระดับตามมาตรฐาน PDPA: โดเมนโรงเรียน (@kutchap.ac.th) vs ทุกคนที่มีลิงก์

export interface GoogleDriveValidationResult {
  isValidFormat: boolean;
  domain: 'google.com' | 'invalid';
  resourceType: 'FOLDER' | 'FILE' | 'DOC' | 'UNKNOWN';
  resourceId?: string;
  normalizedUrl?: string;
  permissionStatus: 'UNVERIFIED_FORMAT_OK' | 'INVALID_FORMAT';
  permissionWarningNotice: string;
  suggestedPolicies: Array<{
    id: 'SCHOOL_DOMAIN' | 'ANYONE_VIEWER';
    label: string;
    description: string;
    isRecommendedForPii: boolean;
  }>;
}

export interface RecommendedFolderTemplate {
  schoolName: string;
  termYear: string;
  subjectCode: string;
  assignmentTitle: string;
  fullPathString: string;
  folderName: string;
  copyableText: string;
}

const ALLOWED_HOSTNAMES = ['drive.google.com', 'docs.google.com'] as const;

/**
 * ตรวจสอบความถูกต้องของ URL Google Drive แบบเข้มงวด ป้องกัน Phishing และระบุชนิดทรัพยากร
 */
export function validateGoogleDriveUrl(rawUrl: string): GoogleDriveValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValidFormat: false,
      domain: 'invalid',
      resourceType: 'UNKNOWN',
      permissionStatus: 'INVALID_FORMAT',
      permissionWarningNotice: 'กรุณาระบุ URL ของ Google Drive สำหรับส่งงาน',
      suggestedPolicies: [],
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      isValidFormat: false,
      domain: 'invalid',
      resourceType: 'UNKNOWN',
      permissionStatus: 'INVALID_FORMAT',
      permissionWarningNotice: 'รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)',
      suggestedPolicies: [],
    };
  }

  // 1. ป้องกันโปรโตคอลที่ไม่ปลอดภัย (ต้องเป็น https: เท่านั้น)
  if (parsed.protocol !== 'https:') {
    return {
      isValidFormat: false,
      domain: 'invalid',
      resourceType: 'UNKNOWN',
      permissionStatus: 'INVALID_FORMAT',
      permissionWarningNotice: 'ต้องใช้โปรโตคอลความปลอดภัย https:// เท่านั้น',
      suggestedPolicies: [],
    };
  }

  // 2. Strict Exact Hostname Allowlist (ป้องกัน drive.google.com.attacker.com)
  const hostname = parsed.hostname.toLowerCase();
  const isAllowedHost = ALLOWED_HOSTNAMES.some((h) => hostname === h);

  if (!isAllowedHost) {
    return {
      isValidFormat: false,
      domain: 'invalid',
      resourceType: 'UNKNOWN',
      permissionStatus: 'INVALID_FORMAT',
      permissionWarningNotice:
        'อนุญาตเฉพาะลิงก์จาก drive.google.com หรือ docs.google.com เท่านั้น ไม่อนุญาตเว็บไซต์ภายนอก',
      suggestedPolicies: [],
    };
  }

  // 3. วิเคราะห์ Resource Type และสกัด Resource ID
  let resourceType: 'FOLDER' | 'FILE' | 'DOC' | 'UNKNOWN' = 'UNKNOWN';
  let resourceId: string | undefined;

  const pathname = parsed.pathname;

  if (pathname.includes('/drive/folders/')) {
    resourceType = 'FOLDER';
    resourceId = pathname.split('/drive/folders/')[1]?.split(/[/?#]/)[0];
  } else if (pathname.includes('/file/d/')) {
    resourceType = 'FILE';
    resourceId = pathname.split('/file/d/')[1]?.split(/[/?#]/)[0];
  } else if (
    pathname.includes('/document/d/') ||
    pathname.includes('/presentation/d/') ||
    pathname.includes('/spreadsheets/d/')
  ) {
    resourceType = 'DOC';
    resourceId = pathname.split('/d/')[1]?.split(/[/?#]/)[0];
  }

  // ตรวจสอบความถูกต้องของ Resource ID (Alphanumeric, ขีดกลาง, อันเดอร์สกอร์ ความยาวขั้นต่ำ 20 ตัวอักษร)
  if (!resourceId || !/^[a-zA-Z0-9_-]{20,}$/.test(resourceId)) {
    return {
      isValidFormat: false,
      domain: 'google.com',
      resourceType,
      permissionStatus: 'INVALID_FORMAT',
      permissionWarningNotice:
        'ไม่พบรหัสโฟลเดอร์หรือไฟล์ Google Drive ที่ถูกต้องใน URL (รหัสต้องมีความยาวอย่างน้อย 20 ตัวอักษร)',
      suggestedPolicies: [],
    };
  }

  const normalizedUrl = `${parsed.origin}${parsed.pathname}`;

  return {
    isValidFormat: true,
    domain: 'google.com',
    resourceType,
    resourceId,
    normalizedUrl,
    permissionStatus: 'UNVERIFIED_FORMAT_OK',
    permissionWarningNotice:
      '✅ รูปแบบลิงก์ถูกต้อง (ระบบตรวจเฉพาะรูปแบบ ยังไม่ได้ยืนยันสิทธิ์การเข้าถึงจริง กรุณาตั้งค่าแชร์ให้คุณครูเปิดดูได้)',
    suggestedPolicies: [
      {
        id: 'SCHOOL_DOMAIN',
        label: 'แชร์เฉพาะบัญชีโรงเรียน (@kutchap.ac.th)',
        description:
          'แนะนำสำหรับผลงานที่มีภาพหรือข้อมูลส่วนบุคคลของนักเรียน เพื่อความปลอดภัยตามมาตรฐาน PDPA',
        isRecommendedForPii: true,
      },
      {
        id: 'ANYONE_VIEWER',
        label: 'ทุกคนที่มีลิงก์มีสิทธิ์ดู (Viewer)',
        description:
          'สำหรับกรณีใช้บัญชี Gmail ส่วนตัวในการส่งงาน คุณครูจะสามารถคลิกเปิดตรวจได้ทันทีโดยไม่ต้องร้องขอสิทธิ์',
        isRecommendedForPii: false,
      },
    ],
  };
}

export interface FolderPathOptions {
  schoolName?: string;
  termYear?: string;
  subjectCode?: string;
  assignmentTitle?: string;
}

/**
 * สร้างคำแนะนำโครงสร้างโฟลเดอร์สำหรับคัดลอก (Copyable Folder Path Template)
 * รองรับทั้งแบบส่ง Object หรือแบบแยก Parameter
 * รูปแบบ: [ชื่อโรงเรียน]/[ปีการศึกษา_เทอม]/[รหัสวิชา_ชื่องาน]
 */
export function generateRecommendedFolderPath(
  optionsOrSchoolName?: string | FolderPathOptions,
  termYear?: string,
  subjectCode?: string,
  assignmentTitle?: string
): RecommendedFolderTemplate {
  let sName = 'โรงเรียนกุดจับประชาสรรค์';
  let tYear = '2569_1';
  let sCode = 'ศ23101';
  let aTitle = 'ชิ้นงาน';

  if (typeof optionsOrSchoolName === 'object' && optionsOrSchoolName !== null) {
    if (optionsOrSchoolName.schoolName) sName = optionsOrSchoolName.schoolName;
    if (optionsOrSchoolName.termYear) tYear = optionsOrSchoolName.termYear;
    if (optionsOrSchoolName.subjectCode) sCode = optionsOrSchoolName.subjectCode;
    if (optionsOrSchoolName.assignmentTitle) aTitle = optionsOrSchoolName.assignmentTitle;
  } else if (typeof optionsOrSchoolName === 'string') {
    sName = optionsOrSchoolName;
    if (termYear) tYear = termYear;
    if (subjectCode) sCode = subjectCode;
    if (assignmentTitle) aTitle = assignmentTitle;
  }

  const cleanTerm = tYear.replace('/', '_');
  const cleanFolder = `${sCode}_${aTitle.replace(/[\\/:*?"<>|]/g, '_')}`;
  const fullPathString = `${sName}/${cleanTerm}/${cleanFolder}`;

  return {
    schoolName: sName,
    termYear: tYear,
    subjectCode: sCode,
    assignmentTitle: aTitle,
    fullPathString,
    folderName: cleanFolder,
    copyableText: fullPathString,
  };
}

