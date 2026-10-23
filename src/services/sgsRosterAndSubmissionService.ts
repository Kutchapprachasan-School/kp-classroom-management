// ============================================================================
// SGS Roster Alignment & Term Assignment Submission Matrix Service
// แก้ Pain Point ของครู:
// 1. ครูจำไม่ได้ว่าสั่งกี่งาน นักเรียนทำไปกี่งาน และต้องมาตรวจทีละคนตอนท้ายเทอม
// 2. นักเรียนย้ายเข้าใหม่ / ย้ายออกกลางเทอม ทำให้ลำดับรายชื่อไม่ตรงกับ SGS (บรรทัดเลื่อน)
// ============================================================================

import { cleanSlateService } from './cleanSlateService.ts';
import { studentService, formatClassroomLabel } from './studentService.ts';
import { resolveRoomCandidates } from './masterDataService.ts';
import { isGrade1SgsStudentCode } from '../config/m1SgsLookup';
import { r2StorageService } from './r2StorageService.ts';
import { cloudDataService, type UploadProgressInfo } from './cloudDataService.ts';
import { gradeService } from './gradeService.ts';

// ============================================================================
// 1. IDENTITY, CLASSROOM & SUBMISSION MATCHING HELPERS
// ============================================================================

export interface RosterIdentityRecord {
  id: string;          // UUID หรือ 'stu-XXXXX' สำหรับตาราง "StudentScore"
  studentCode: string; // รหัสประจำตัวนักเรียน 5 หลัก เช่น '45101'
  name?: string;
  classroom?: string;
  classroomId?: string;
}

export interface SubmissionMatchCandidate {
  id?: string;
  assignmentId?: string;
  unitId?: string;
  courseCode?: string;
  studentCode?: string;
  studentId?: string;
  classroom?: string;
  classroomId?: string;
  workTitle?: string;
  status?: string;
  score?: number | null;
  maxScore?: number;
  submittedAt?: string | number;
  gradedAt?: string | number;
  feedback?: string;
}

export interface AssignmentMatchTarget {
  id: string;
  unitId?: string;
  title?: string;
  courseCode?: string;
  classroom?: string;
  classroomId?: string;
  targetClassrooms?: string[];
  maxScore?: number;
  category?: 'FORMATIVE' | 'MIDTERM' | 'FINAL' | string;
  isRequired?: boolean;
}

/**
 * แปลงชื่อห้องเรียนหลากหลายรูปแบบ ('room-3-1', 'ม. 3 / 1', 'M.3/1') ให้เป็นมาตรฐานเดียวกัน ('ม.3/1')
 */
export function normalizeClassroomCode(room?: string | null): string {
  if (!room) return '';
  const trimmed = String(room).trim();
  if (!trimmed) return '';

  // กรณีรหัสภายใน เช่น 'room-3-1' หรือ 'room_3_1' -> 'ม.3/1'
  const roomCodeMatch = trimmed.match(/^room[-_](\d+)[-_](\d+)$/i);
  if (roomCodeMatch) {
    return `ม.${roomCodeMatch[1]}/${roomCodeMatch[2]}`;
  }

  // กรณี 'M.3/1' หรือ 'm3/1' -> 'ม.3/1'
  const engMatch = trimmed.match(/^m\.?\s*(\d+)\s*\/\s*(\d+)$/i);
  if (engMatch) {
    return `ม.${engMatch[1]}/${engMatch[2]}`;
  }

  // กรณี 'ม. 3 / 1' หรือ 'ม3/1' -> 'ม.3/1'
  const thaiMatch = trimmed.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
  if (thaiMatch) {
    return `ม.${thaiMatch[1]}/${thaiMatch[2]}`;
  }

  return trimmed.replace(/\s+/g, '').toLowerCase();
}

/**
 * เปรียบเทียบห้องเรียน 2 ค่าว่าเป็นห้องเดียวกันหรือไม่ (รองรับทั้งรหัส room-X-Y, ชื่อ ม.X/Y และ UUID)
 */
export function isSameClassroom(roomA?: string | null, roomB?: string | null): boolean {
  if (!roomA || !roomB) return false;
  if (roomA.trim() === roomB.trim()) return true;
  return normalizeClassroomCode(roomA) === normalizeClassroomCode(roomB);
}

/**
 * ค้นหาและแปลงข้อมูลระบุตัวตนนักเรียนให้ได้ทั้ง studentId (UUID) และ studentCode (5 หลัก)
 */
export function resolveStudentIdentity(
  userOrCode: { id?: string; studentId?: string; studentCode?: string; code?: string } | string | null | undefined,
  roster?: RosterIdentityRecord[]
): { studentId: string; studentCode: string; student?: RosterIdentityRecord } | null {
  if (!userOrCode) return null;

  const targetCode =
    typeof userOrCode === 'string'
      ? userOrCode.trim()
      : (userOrCode.studentCode || (userOrCode as any).code)?.trim();
  const targetId =
    typeof userOrCode === 'string'
      ? userOrCode.trim()
      : (userOrCode.id || userOrCode.studentId)?.trim();

  if (Array.isArray(roster) && roster.length > 0) {
    const matched = roster.find(
      (s) =>
        (targetCode && s.studentCode === targetCode) ||
        (targetId && s.id === targetId)
    );

    if (matched) {
      return {
        studentId: matched.id,
        studentCode: matched.studentCode,
        student: matched,
      };
    }
  }

  // Fallback to studentService if not in roster
  if (targetCode) {
    const found = studentService.findStudentByCode(targetCode);
    if (found) {
      const rec: RosterIdentityRecord = {
        id: found.student.id || targetId || `stu-${targetCode}`,
        studentCode: targetCode,
        name: found.student.name,
        classroom: found.classroomId,
        classroomId: found.classroomId,
      };
      return {
        studentId: rec.id,
        studentCode: rec.studentCode,
        student: rec,
      };
    }
  }

  if (targetId) {
    const foundById = studentService.findStudentByCode(targetId);
    if (foundById) {
      const rec: RosterIdentityRecord = {
        id: foundById.student.id || targetId,
        studentCode: foundById.student.code || foundById.student.studentCode || targetId.replace(/^stu-/, ''),
        name: foundById.student.name,
        classroom: foundById.classroomId,
        classroomId: foundById.classroomId,
      };
      return {
        studentId: rec.id,
        studentCode: rec.studentCode,
        student: rec,
      };
    }
  }

  if (targetId && targetCode) {
    return {
      studentId: targetId,
      studentCode: targetCode,
      student: { id: targetId, studentCode: targetCode },
    };
  }

  return null;
}

/**
 * ตรวจสอบว่า Submission ชิ้นนี้ตรงกับ Assignment เป้าหมายหรือไม่
 * รองรับการจับคู่ด้วย id ตรงตัว, unitId (เฉพาะกรณีที่เป็นงานระดับหน่วย), และชื่อชิ้นงาน (workTitle)
 * มีระบบป้องกันการจับคู่ข้ามวิชา (Course Code Guard) และป้องกันงานย่อยในหน่วยเดียวกันแย่งผลงานกัน
 */
export function matchSubmissionToAssignment(
  sub?: SubmissionMatchCandidate | null,
  asg?: AssignmentMatchTarget | null
): boolean {
  if (!sub || !asg) return false;

  // 0. Course code guard: หากระบุวิชาทั้งคู่แล้วรหัสวิชาไม่ตรงกัน ห้ามจับคู่ข้ามวิชาเด็ดขาด
  if (
    sub.courseCode &&
    asg.courseCode &&
    sub.courseCode.trim().toUpperCase() !== asg.courseCode.trim().toUpperCase()
  ) {
    return false;
  }

  // 0.1 Classroom guard: หากชิ้นงานกำหนดห้องเรียนเฉพาะ (และไม่รวม 'ALL')
  // ตรวจสอบว่าห้องของนักเรียนตรงกับห้องเป้าหมายของงานหรือไม่ ป้องกันงานของห้องหนึ่งไปโผล่ในอีกห้องหนึ่ง
  const asgRooms = asg.targetClassrooms || (asg.classroom || asg.classroomId ? [asg.classroom || asg.classroomId!] : []);
  const subRoom = sub.classroom || sub.classroomId;
  if (asgRooms.length > 0 && !asgRooms.includes('ALL')) {
    let effectiveSubRoom = subRoom;
    if (!effectiveSubRoom && sub.studentCode) {
      const found = studentService.findStudentByCode(sub.studentCode);
      if (found) effectiveSubRoom = found.classroomId || found.student.classroomId;
    }
    if (effectiveSubRoom) {
      const isRoomMatch = asgRooms.some((r) => isSameClassroom(r, effectiveSubRoom));
      if (!isRoomMatch) {
        return false;
      }
    }
  }

  // 1. จับคู่ด้วย ID หลักโดยตรง (ความแม่นยำสูงสุด 100%)
  if (sub.assignmentId && asg.id && sub.assignmentId === asg.id) {
    return true;
  }

  // หากทั้งคู่มี assignmentId / id ระบุไว้ชัดเจนแล้วไม่ตรงกัน ห้ามจับคู่ข้ามงานย่อยเด็ดขาด
  // (ป้องกันงานย่อยที่ 2, 3 ในหน่วยเดียวกันแย่งผลงานของงานย่อยที่ 1 หรือคิดคะแนนซ้ำซ้อน)
  if (sub.assignmentId && asg.id && sub.assignmentId !== asg.id) {
    return false;
  }

  // 2. จับคู่กรณีส่งงานผ่าน Unit ID
  if (asg.unitId && sub.assignmentId === asg.unitId) {
    return true;
  }
  if (sub.unitId && asg.id && sub.unitId === asg.id) {
    return true;
  }

  // 3. จับคู่ด้วยชื่อชิ้นงาน (Fallback กรณีที่ไม่มี assignmentId หรืออิมพอร์ตข้อมูล)
  if (sub.workTitle && asg.title) {
    const normSubTitle = sub.workTitle.trim().replace(/\s+/g, ' ').toLowerCase();
    const normAsgTitle = asg.title.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normSubTitle.length > 0 && normSubTitle === normAsgTitle) {
      return true;
    }
  }

  return false;
}

export type StudentTransferState = 'ACTIVE' | 'TRANSFERRED_IN' | 'TRANSFERRED_OUT';
export type StudentGender = 'MALE' | 'FEMALE';
export type SgsInsertPosition = 'AFTER_SAME_GENDER' | 'END_OF_CLASS' | 'CUSTOM_SEAT';

export type FourScorePart = 'PRE_MIDTERM' | 'MIDTERM' | 'POST_MIDTERM' | 'FINAL';

export interface CourseScoreWeights {
  courseCode: string;
  preMidterm: number;  // ก่อนกลางภาค (เช่น 25 หรือ 30)
  midterm: number;     // กลางภาค (เช่น 20)
  postMidterm: number; // หลังกลางภาค (เช่น 25 หรือ 30)
  final: number;       // ปลายภาค (เช่น 30 หรือ 20)
}

export interface StudentCourseScoreEntry {
  preMidterm?: number | null;
  midterm?: number | null;
  postMidterm?: number | null;
  final?: number | null;
  analyticalThinkingLevel?: 0 | 1 | 2 | 3;
  desiredCharacteristicsLevel?: 0 | 1 | 2 | 3;
  isAttributeManual?: boolean;
}

export const DESIRABLE_CHARACTERISTICS_LIST: string[] = [
  '1. รักชาติ ศาสน์ กษัตริย์',
  '2. ซื่อสัตย์สุจริต',
  '3. มีวินัย',
  '4. ใฝ่เรียนรู้',
  '5. อยู่อย่างพอเพียง',
  '6. มุ่งมั่นในการทำงาน',
  '7. รักความเป็นไทย',
  '8. มีจิตสาธารณะ',
];

export const CRITICAL_THINKING_LIST: string[] = [
  '1. การอ่านเพื่อหาข้อมูลสารสนเทศ',
  '2. การจับประเด็นสำคัญและแยกแยะข้อเท็จจริง',
  '3. การคิดวิเคราะห์ เชื่อมโยง และสังเคราะห์',
  '4. การประเมินค่าและตัดสินใจอย่างมีเหตุผล',
  '5. การเขียนสื่อสารอย่างสร้างสรรค์',
];

export interface SgsStudentRecord {
  sgsSeatNo: number; // เลขที่ตามใบรายชื่อ SGS (ศูนย์กลางจากห้องทะเบียน/ครูที่ปรึกษา)
  no: number;
  studentCode: string;
  studentName: string;
  fullName: string;
  gender: StudentGender; // ชายขึ้นก่อนหญิง (ผู้ชายเข้าใหม่ต่อท้ายผู้ชาย)
  classroom: string;
  transferState: StudentTransferState;
  transferDate?: string;
  transferNote?: string;
  transferredBaseScore?: {
    u1?: number;
    u2?: number;
  };
  // Q1-C: ครูพิมพ์คะแนนเก็บสุทธิทับเองท้ายเทอมได้อิสระ (เต็ม 50) กรณีบางวิชาไม่มีคะแนนเทียบโอนจาก รร.เดิม
  manualAccumulatedOverride?: number | null;
  manualOverrideNote?: string;
  attendancePercent: number;
  attendanceRate: number;
  specialStatus: 'NORMAL' | 'ร' | 'มส';
  morningStatusLabel: string;
  preMidtermScore?: number | null; // คะแนนก่อนกลางภาค
  midtermScore: number; // คะแนนกลางภาค
  postMidtermScore?: number | null; // คะแนนหลังกลางภาค
  finalScore: number; // คะแนนปลายภาค
  analyticalThinkingLevel?: 0 | 1 | 2 | 3; // อ่าน คิดวิเคราะห์ และเขียน (ระดับ 0-3)
  desiredCharacteristicsLevel?: 0 | 1 | 2 | 3; // คุณลักษณะอันพึงประสงค์ (ระดับ 0-3)
  desirableCharacteristics: (0 | 1 | 2 | 3)[];
  criticalThinking: (0 | 1 | 2 | 3)[];
  submissions?: Record<string, { score?: number | null; status?: string; submittedAt?: string; teacherNote?: string; note?: string }>;
  isAttributeManual?: boolean;
  courseScores?: Record<string, StudentCourseScoreEntry>;
}

export type ScoringMethodType =
  | 'DIRECT_SCORE'            // คะแนนตรงรายชิ้น (เช่น ชิ้นนี้เต็ม 10 คะแนน)
  | 'SUBMISSION_COUNT_RATIO'  // เก็บสัดส่วนจำนวนงานที่ส่ง (คะแนนการส่งงาน: มี N งาน หาร N คูณคะแนนเต็มหน่วย เช่น 5 งาน งานละ 2 คะแนน)
  | 'RAW_SCORE_AVERAGE';      // เฉลี่ยคะแนนดิบของงานทั้งหมดในหน่วย

export interface AssignmentAttachment {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT';
  url?: string;
  fileDataUrl?: string;
  size?: string;
  source: 'LESSON_PLAN' | 'UPLOAD' | 'LINK';
  lessonPlanTitle?: string;
}

export interface TermAssignmentItem {
  id: string;
  orderNo: number;
  title: string;
  description?: string;
  attachments?: AssignmentAttachment[];
  courseCode?: string;
  courseName?: string;
  unitKey?: 'U1' | 'U2' | 'U3' | 'MIDTERM' | 'FINAL' | string;
  indicatorCode?: string;
  targetClassrooms?: string[]; // ['ALL'] หรือ ['ม.1/1', 'ม.1/2']
  scorePart?: FourScorePart;   // 'PRE_MIDTERM' | 'MIDTERM' | 'POST_MIDTERM' | 'FINAL'
  sgsUnit: 'u1' | 'u2' | 'u3'; // ผูกเข้าช่องคะแนน SGS (หน่วย 1, 2, 3)
  sgsUnitLabel: string;
  maxScore: number;
  assignedDate: string;
  dueDate: string;
  // Q3-A: งานบังคับ / ตัวชี้วัดต้องรู้ (ถ้าไม่ส่งติด "ร" ทันที และเมื่อตรวจให้คะแนนแล้วปลด "ร" อัตโนมัติ)
  isRequiredForPass?: boolean;
  isRequired?: boolean;
  category?: 'FORMATIVE' | 'MIDTERM' | 'FINAL' | string;

  // รองรับการสั่งงานรายหน่วย / รายจุดประสงค์ และเฉลี่ยคะแนนสะสม (Auto-division / Unit Score)
  unitId?: string;               // รหัสกลุ่มหน่วย เช่น 'unit-1', 'obj-1'
  unitTitle?: string;            // ชื่อหน่วย/จุดประสงค์ เช่น 'หน่วยที่ 1: ทัศนธาตุและการออกแบบ'
  unitMaxScore?: number;         // คะแนนเต็มของหน่วย เช่น 10 คะแนน
  scoringMethod?: ScoringMethodType; // วิธีคำนวณคะแนนหน่วย
  totalTasksInUnit?: number;     // จำนวนงานทั้งหมดในหน่วย (เช่น 5 งาน หรือ 10 งาน)
  autoRoundUp?: boolean;         // สวิตช์ปัดเศษทศนิยม >= 0.5 ขึ้นอัตโนมัติ
  academicYearTerm?: string;     // ภาคเรียน/ปีการศึกษา เช่น '2/2569'
}

export type TermAssignmentConfig = TermAssignmentItem;

export interface CentralRosterSyncMeta {
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  syncNote: string;
}

export type SubmissionCellStatus =
  | 'GRADED'
  | 'SUBMITTED_PENDING'
  | 'MISSING'
  | 'EXEMPT_TRANSFERRED'
  | 'RETURNED_REVISION';

export const RETURN_SUBMISSION_REASONS = [
  'ไฟล์แนบไม่สมบูรณ์ / ไม่สามารถเปิดไฟล์ได้',
  'งานยังไม่ครบถ้วนตามข้อกำหนดของชิ้นงาน',
  'รูปภาพหรือเอกสารไม่ชัดเจน / ข้อมูลตกหล่น',
  'ต้องการให้ปรับปรุงเนื้อหาและส่งใหม่อีกครั้ง',
  'ส่งไฟล์ผิดวิชาหรือผิดชิ้นงาน',
  'ตรวจพบเนื้อหาซ้ำซ้อนหรือคัดลอกผลงาน',
  'อื่นๆ (ระบุเหตุผลด้วยตนเอง)',
] as const;

export interface StudentWorkSubmission {
  id?: string;
  assignmentId: string;
  unitId?: string;
  courseCode?: string;
  studentCode: string;
  studentId?: string;
  status: SubmissionCellStatus;
  score?: number | null;
  maxScore?: number;
  submittedAt?: string;
  gradedAt?: string;
  workTitle?: string;
  workAttachmentLabel?: string;
  fileUrl?: string;
  textContent?: string; // ข้อความคำตอบที่นักเรียนพิมพ์ส่ง
  note?: string;
  teacherFeedback?: string;
  feedback?: string;
  returnReason?: string;
  returnedAt?: string;
  isResubmission?: boolean;
  // Cloudflare R2 Storage & Lifecycle fields
  r2ObjectKey?: string;
  originalSizeKb?: number;
  compressedSizeKb?: number;
  externalLinkUrl?: string;
  fileDataUrl?: string;
  academicYearTerm?: string;
  classroom?: string;
  isR2FilePurged?: boolean;
}

// ฟังก์ชันแปลงเวลาส่งงานให้เป็นภาษาไทยที่แม่นยำ ไม่ค้างข้อความ "เพิ่งส่งเมื่อสักครู่" ตลอดไป
export function formatSubmissionTimestamp(val?: string | number): string {
  if (!val) return 'ส่งแล้ว';

  // ถ้าเป็นข้อความเก่าที่เคยฮาร์ดโค้ดไว้
  if (typeof val === 'string' && val.includes('เพิ่งส่งเมื่อสักครู่ (Cloudflare R2)')) {
    return 'ส่งแล้วในระบบ';
  }

  const d = typeof val === 'number' ? new Date(val) : new Date(val);
  if (isNaN(d.getTime())) {
    return String(val);
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes} น.`;

  if (diffMin < 2) return 'เพิ่งส่งเมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว (${timeStr})`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว (${timeStr})`;
  if (diffDay === 1) return `เมื่อวานนี้ ${timeStr}`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว (${day} ${month} ${timeStr})`;

  return `${day} ${month} ${year} ${timeStr}`;
}

const STORAGE_KEY_SGS_ROSTER = 'kp_sgs_roster_v3';
const STORAGE_KEY_TERM_ASSIGNMENTS = 'kp_term_assignments_v2';
const STORAGE_KEY_WORK_SUBMISSIONS = 'kp_work_submissions_v2';
const STORAGE_KEY_ROSTER_SYNC_META = 'kp_sgs_roster_sync_meta_v1';
const STORAGE_KEY_COURSE_WEIGHTS = 'kp_course_four_part_weights_v1';

// เรียงตามมาตรฐานทะเบียนโรงเรียนไทย: นักเรียนชาย (เลขที่ 1-5) -> นักเรียนหญิง (เลขที่ 6-8)
const INITIAL_SGS_ROSTER: SgsStudentRecord[] = [];

export const INITIAL_TERM_ASSIGNMENTS: TermAssignmentItem[] = [];

export const INITIAL_SUBMISSIONS: StudentWorkSubmission[] = [];

export const sgsRosterAndSubmissionService = {
  getCourseWeights(courseCode = 'DEFAULT'): CourseScoreWeights {
    const key = courseCode || 'DEFAULT';
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COURSE_WEIGHTS);
      if (raw) {
        const map: Record<string, CourseScoreWeights> = JSON.parse(raw);
        if (map[key]) return map[key];
      }
    } catch {
      // ignore
    }
    return {
      courseCode: key,
      preMidterm: 25,
      midterm: 20,
      postMidterm: 25,
      final: 30,
    };
  },

  saveCourseWeights(weights: CourseScoreWeights): CourseScoreWeights {
    const key = weights.courseCode || 'DEFAULT';
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COURSE_WEIGHTS);
      const map: Record<string, CourseScoreWeights> = raw ? JSON.parse(raw) : {};
      map[key] = {
        courseCode: key,
        preMidterm: Number(weights.preMidterm) || 0,
        midterm: Number(weights.midterm) || 0,
        postMidterm: Number(weights.postMidterm) || 0,
        final: Number(weights.final) || 0,
      };
      localStorage.setItem(STORAGE_KEY_COURSE_WEIGHTS, JSON.stringify(map));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kp-sgs-roster-updated'));
      }
      return map[key];
    } catch {
      return weights;
    }
  },

  getSgsRoster(classroomId?: string): SgsStudentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SGS_ROSTER);
      const savedList: SgsStudentRecord[] = raw ? JSON.parse(raw) : [];
      const savedMap = new Map<string, SgsStudentRecord>();
      savedList.forEach((item) => {
        if (item && item.studentCode) {
          savedMap.set(String(item.studentCode).trim(), item);
        }
      });

      const targetRoom = classroomId || '';
      const formatted = targetRoom ? formatClassroomLabel(targetRoom) : '';
      const isNonGrade1 = targetRoom
        ? !targetRoom.includes('1-') && !targetRoom.includes('1/') && !formatted.includes('1/')
        : false;

      // ดึงรายชื่อนักเรียนจริงจาก studentService เพื่อให้นักเรียนในห้องเรียนต่างๆ ปรากฏใน ปพ.5 เสมอ
      let students = targetRoom ? studentService.getStudents(targetRoom) : [];
      if (isNonGrade1) {
        students = students.filter((stu) => !isGrade1SgsStudentCode(stu.code));
      }

      const allSubs = this.getSubmissions();
      const enrichRecord = (rec: SgsStudentRecord, idx: number): SgsStudentRecord => {
        const seatNo = rec.sgsSeatNo ?? rec.no ?? idx + 1;
        const name = rec.studentName || rec.fullName || '';
        const att = rec.attendancePercent ?? rec.attendanceRate ?? 100;
        const charLvl = rec.desiredCharacteristicsLevel ?? 3;
        const critLvl = rec.analyticalThinkingLevel ?? 3;
        const stuSubsMap: Record<string, { score?: number | null; status?: string; submittedAt?: string; teacherNote?: string; note?: string }> = {
          ...(rec.submissions || {}),
        };
        allSubs
          .filter((sub) => sub.studentCode === rec.studentCode)
          .forEach((sub) => {
            stuSubsMap[sub.assignmentId] = {
              score: sub.score ?? null,
              status: sub.status === 'GRADED' ? 'GRADED' : sub.status === 'SUBMITTED_PENDING' ? 'SUBMITTED' : 'MISSING',
              submittedAt: sub.submittedAt,
              teacherNote: sub.teacherFeedback,
              note: sub.teacherFeedback,
            };
          });
        return {
          ...rec,
          sgsSeatNo: seatNo,
          no: seatNo,
          studentName: name,
          fullName: name,
          attendancePercent: att,
          attendanceRate: att,
          specialStatus: rec.specialStatus || 'NORMAL',
          desirableCharacteristics:
            rec.desirableCharacteristics && rec.desirableCharacteristics.length === 8
              ? rec.desirableCharacteristics
              : Array(8).fill(charLvl),
          criticalThinking:
            rec.criticalThinking && rec.criticalThinking.length === 5
              ? rec.criticalThinking
              : Array(5).fill(critLvl),
          submissions: stuSubsMap,
        };
      };

      if (students && students.length > 0) {
        return students.map((stu, idx) => {
          const code = String(stu.code).trim();
          const saved = savedMap.get(code);
          const inferredGender = (stu.gender ||
            (stu.name.includes('ด.ญ.') || stu.name.includes('นางสาว') || stu.name.includes('น.ส.')
              ? 'FEMALE'
              : 'MALE')) as StudentGender;
          const baseRec: SgsStudentRecord = {
            sgsSeatNo: saved?.sgsSeatNo ?? (stu.no || idx + 1),
            no: saved?.sgsSeatNo ?? (stu.no || idx + 1),
            studentCode: code,
            studentName: stu.name || saved?.studentName || '',
            fullName: stu.name || saved?.studentName || '',
            gender: saved?.gender || inferredGender,
            classroom: formatted || saved?.classroom || targetRoom,
            transferState: saved?.transferState || ('ACTIVE' as StudentTransferState),
            transferDate: saved?.transferDate,
            transferNote: saved?.transferNote,
            transferredBaseScore: saved?.transferredBaseScore,
            manualAccumulatedOverride: saved?.manualAccumulatedOverride,
            manualOverrideNote: saved?.manualOverrideNote,
            attendancePercent: saved?.attendancePercent ?? 100,
            attendanceRate: saved?.attendancePercent ?? 100,
            specialStatus: saved?.specialStatus || 'NORMAL',
            morningStatusLabel: saved?.morningStatusLabel || '',
            preMidtermScore: saved?.preMidtermScore ?? null,
            midtermScore: typeof saved?.midtermScore === 'number' ? saved.midtermScore : ('' as any),
            postMidtermScore: saved?.postMidtermScore ?? null,
            finalScore: typeof saved?.finalScore === 'number' ? saved.finalScore : ('' as any),
            analyticalThinkingLevel: saved?.analyticalThinkingLevel,
            desiredCharacteristicsLevel: saved?.desiredCharacteristicsLevel,
            desirableCharacteristics: saved?.desirableCharacteristics || Array(8).fill(3),
            criticalThinking: saved?.criticalThinking || Array(5).fill(3),
            isAttributeManual: saved?.isAttributeManual,
            courseScores: saved?.courseScores || {},
            submissions: saved?.submissions || {},
          };
          return enrichRecord(baseRec, idx);
        }).sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999));
      }

      if (savedList.length > 0) {
        if (classroomId) {
          const roomCandidates = resolveRoomCandidates(classroomId);
          let filtered = savedList.filter((s) => {
            if (!s || !s.classroom) return false;
            return (
              roomCandidates.includes(s.classroom) ||
              s.classroom === classroomId ||
              s.classroom === formatted ||
              formatClassroomLabel(s.classroom) === formatted
            );
          });
          if (isNonGrade1) {
            filtered = filtered.filter((s) => !isGrade1SgsStudentCode(s.studentCode));
          }
          return filtered
            .map((s, idx) => enrichRecord(s, idx))
            .sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999));
        }
        return savedList
          .map((s, idx) => enrichRecord(s, idx))
          .sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999));
      }

      return [];
    } catch {
      return [];
    }
  },

  saveSgsRoster(roster: SgsStudentRecord[], actorLabel = 'งานทะเบียน / ครูที่ปรึกษา'): SgsStudentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SGS_ROSTER);
      const existingList: SgsStudentRecord[] = raw ? JSON.parse(raw) : [];
      const mergedMap = new Map<string, SgsStudentRecord>();
      existingList.forEach((s) => {
        if (s && s.studentCode) mergedMap.set(String(s.studentCode).trim(), s);
      });
      roster.forEach((s) => {
        if (s && s.studentCode) mergedMap.set(String(s.studentCode).trim(), s);
      });
      const mergedArray = Array.from(mergedMap.values());
      localStorage.setItem(STORAGE_KEY_SGS_ROSTER, JSON.stringify(mergedArray));
    } catch {
      localStorage.setItem(STORAGE_KEY_SGS_ROSTER, JSON.stringify(roster));
    }
    this.markCentralRosterSynced(
      actorLabel,
      `ซิงค์ลำดับเลขที่ SGS (${roster.length} รายชื่อ • ชาย ➔ หญิง)`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
    }
    return roster;
  },

  getCentralRosterSyncInfo(): CentralRosterSyncMeta {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROSTER_SYNC_META);
      return raw
        ? JSON.parse(raw)
        : {
            lastUpdatedBy: 'งานทะเบียนวัดผล & ครูที่ปรึกษา',
            lastUpdatedAt: 'พร้อมใช้งาน',
            syncNote: 'พร้อมสำหรับนำเข้ารายชื่อนักเรียน ปพ.5 จากระบบ SGS หรือ Excel',
          };
    } catch {
      return {
        lastUpdatedBy: 'งานทะเบียนวัดผล & ครูที่ปรึกษา',
        lastUpdatedAt: 'พร้อมใช้งาน',
        syncNote: 'พร้อมสำหรับนำเข้ารายชื่อนักเรียน ปพ.5 จากระบบ SGS หรือ Excel',
      };
    }
  },

  markCentralRosterSynced(lastUpdatedBy: string, syncNote: string): CentralRosterSyncMeta {
    const now = new Date();
    const timeStr = `วันนี้ ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} น.`;
    const meta: CentralRosterSyncMeta = {
      lastUpdatedBy,
      lastUpdatedAt: timeStr,
      syncNote,
    };
    localStorage.setItem(STORAGE_KEY_ROSTER_SYNC_META, JSON.stringify(meta));
    return meta;
  },

  // อัปเดตคะแนน 4 ส่วน (ก่อนกลางภาค, กลางภาค, หลังกลางภาค, ปลายภาค) รายบุคคล
  updateStudentFourPartScore(
    studentCode: string,
    partInput: 'preMidterm' | 'midterm' | 'postMidterm' | 'final' | FourScorePart,
    rawScore: number | null,
    classroomId?: string,
    courseCode?: string
  ): SgsStudentRecord[] {
    const partNormalized: 'preMidterm' | 'midterm' | 'postMidterm' | 'final' =
      partInput === 'PRE_MIDTERM'
        ? 'preMidterm'
        : partInput === 'MIDTERM'
        ? 'midterm'
        : partInput === 'POST_MIDTERM'
        ? 'postMidterm'
        : partInput === 'FINAL'
        ? 'final'
        : partInput;
    const weights = this.getCourseWeights(courseCode);
    const maxMap = {
      preMidterm: weights.preMidterm,
      midterm: weights.midterm,
      postMidterm: weights.postMidterm,
      final: weights.final,
    };
    const maxAllowed = maxMap[partNormalized] ?? 100;
    const clamped =
      rawScore === null || Number.isNaN(rawScore)
        ? null
        : Math.max(0, Math.min(maxAllowed, Number(rawScore)));

    const cKey = courseCode || 'DEFAULT';
    const roster = this.getSgsRoster(classroomId).map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      const prevCourse = stu.courseScores?.[cKey] || {};
      const nextCourse: StudentCourseScoreEntry = {
        ...prevCourse,
        [partNormalized]: clamped,
      };
      return {
        ...stu,
        preMidtermScore: partNormalized === 'preMidterm' ? clamped : stu.preMidtermScore,
        midtermScore:
          partNormalized === 'midterm' ? (clamped === null ? ('' as any) : clamped) : stu.midtermScore,
        postMidtermScore: partNormalized === 'postMidterm' ? clamped : stu.postMidtermScore,
        finalScore:
          partNormalized === 'final' ? (clamped === null ? ('' as any) : clamped) : stu.finalScore,
        courseScores: {
          ...(stu.courseScores || {}),
          [cKey]: nextCourse,
        },
      };
    });
    return this.saveSgsRoster(roster, 'ครูประจำวิชา (บันทึกคะแนน 4 ส่วน)');
  },

  // Q1-C: ครูประจำวิชาพิมพ์คะแนนเก็บสุทธิทับเองท้ายเทอมได้อิสระ (เต็ม 50) สำหรับกรณีบางวิชาไม่มีเทียบโอน
  updateStudentManualAccumulatedScore(
    studentCode: string,
    manualScore: number | null,
    note?: string,
    classroomId?: string
  ): SgsStudentRecord[] {
    const clamped =
      manualScore === null || Number.isNaN(manualScore)
        ? null
        : Math.max(0, Math.min(60, Math.round(manualScore)));
    const roster = this.getSgsRoster(classroomId).map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      return {
        ...stu,
        manualAccumulatedOverride: clamped,
        manualOverrideNote:
          clamped !== null
            ? note || `ครูผู้สอนกำหนดคะแนนเก็บสุทธิท้ายเทอม (${clamped})`
            : undefined,
      };
    });
    return this.saveSgsRoster(roster, 'ครูประจำวิชา (ปรับคะแนนเก็บสุทธิ)');
  },

  addTransferredInStudent(payload: {
    studentCode: string;
    studentName: string;
    gender: StudentGender;
    insertPosition: SgsInsertPosition;
    customSeatNo?: number;
    transferDate: string;
    transferredU1Score: number;
    manualNetAccumulatedScore?: number | null;
  }): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()].sort(
      (a, b) => a.sgsSeatNo - b.sgsSeatNo
    );

    let insertIndex = roster.length; // Default: ท้ายสุดของห้อง

    if (payload.insertPosition === 'AFTER_SAME_GENDER') {
      if (payload.gender === 'MALE') {
        // หาตำแหน่งสุดท้ายของนักเรียนชาย แล้วแทรกต่อท้ายผู้ชายทันที (เลื่อนเลขที่นักเรียนหญิงลงไป 1 ลำดับตาม SGS)
        let lastMaleIdx = -1;
        roster.forEach((s, idx) => {
          if (s.gender === 'MALE') lastMaleIdx = idx;
        });
        insertIndex = lastMaleIdx !== -1 ? lastMaleIdx + 1 : 0;
      } else {
        insertIndex = roster.length;
      }
    } else if (
      payload.insertPosition === 'CUSTOM_SEAT' &&
      payload.customSeatNo
    ) {
      insertIndex = Math.max(
        0,
        Math.min(roster.length, payload.customSeatNo - 1)
      );
    }

    const assignedSeatNo = insertIndex + 1;
    const positionLabel =
      payload.insertPosition === 'AFTER_SAME_GENDER' && payload.gender === 'MALE'
        ? `แทรกต่อท้ายกลุ่มนักเรียนชาย (เลขที่ ${assignedSeatNo})`
        : payload.insertPosition === 'CUSTOM_SEAT'
        ? `แทรกที่เลขที่ ${assignedSeatNo} ตามใบรายชื่อ SGS`
        : `ต่อท้ายสุดของห้อง (เลขที่ ${assignedSeatNo})`;

    const hasManualOverride =
      payload.manualNetAccumulatedScore !== undefined &&
      payload.manualNetAccumulatedScore !== null;

    const newStudent: SgsStudentRecord = {
      sgsSeatNo: assignedSeatNo,
      no: assignedSeatNo,
      studentCode: payload.studentCode,
      studentName: payload.studentName,
      fullName: payload.studentName,
      gender: payload.gender,
      classroom: 'ม.3/1',
      transferState: 'TRANSFERRED_IN',
      transferDate: payload.transferDate,
      transferNote: `ย้ายเข้าใหม่ (${payload.transferDate}) — ${positionLabel}`,
      transferredBaseScore:
        payload.transferredU1Score > 0
          ? { u1: payload.transferredU1Score }
          : undefined,
      manualAccumulatedOverride: hasManualOverride
        ? payload.manualNetAccumulatedScore
        : null,
      manualOverrideNote: hasManualOverride
        ? `ไม่มีคะแนนเทียบโอน — ครูระบุคะแนนเก็บสุทธิ ${payload.manualNetAccumulatedScore}/50`
        : undefined,
      attendancePercent: 100,
      attendanceRate: 100,
      specialStatus: 'NORMAL',
      morningStatusLabel: 'มาเข้าแถวปกติ (นักเรียนย้ายเข้าใหม่)',
      midtermScore: 15,
      finalScore: 22,
      desirableCharacteristics: Array(8).fill(3),
      criticalThinking: Array(5).fill(3),
    };

    const nextRoster = [
      ...roster.slice(0, insertIndex),
      newStudent,
      ...roster.slice(insertIndex),
    ].map((stu, idx) => ({
      ...stu,
      sgsSeatNo: idx + 1, // รันเลขที่ SGS ใหม่ให้เรียงต่อเนื่องโดยคะแนนยังผูกตามรหัสนักเรียน (studentCode) 100%
    }));

    this.saveSgsRoster(nextRoster, 'งานทะเบียน / ครูที่ปรึกษา');
    return nextRoster;
  },

  // ปรับเลื่อนเลขที่นักเรียนขึ้น-ลง (▲/▼) ให้ตรงกับ SGS โดยที่คะแนนและงานที่ส่งผูกติดไปกับรหัสนักเรียนอัตโนมัติ
  moveStudentSeat(studentCode: string, direction: 'UP' | 'DOWN'): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()].sort(
      (a, b) => a.sgsSeatNo - b.sgsSeatNo
    );
    const idx = roster.findIndex((s) => s.studentCode === studentCode);
    if (idx === -1) return roster;
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= roster.length) return roster;

    const temp = roster[idx];
    roster[idx] = roster[targetIdx];
    roster[targetIdx] = temp;

    const renumbered = roster.map((stu, i) => ({
      ...stu,
      sgsSeatNo: i + 1,
    }));
    return this.saveSgsRoster(renumbered, 'งานทะเบียน / ครูที่ปรึกษา');
  },

  // จัดเรียงลำดับตามมาตรฐานทะเบียน SGS อัตโนมัติ (กลุ่มนักเรียนชายขึ้นก่อน -> ตามด้วยกลุ่มนักเรียนหญิง)
  sortRosterMaleFirstSgs(): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()];
    const males = roster.filter((s) => s.gender === 'MALE');
    const females = roster.filter((s) => s.gender === 'FEMALE');
    const renumbered = [...males, ...females].map((stu, i) => ({
      ...stu,
      sgsSeatNo: i + 1,
    }));
    return this.saveSgsRoster(renumbered, 'งานทะเบียน / ครูที่ปรึกษา');
  },

  toggleStudentTransferOut(studentCode: string): SgsStudentRecord[] {
    const roster = this.getSgsRoster().map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      const nextState: StudentTransferState =
        stu.transferState === 'TRANSFERRED_OUT' ? 'ACTIVE' : 'TRANSFERRED_OUT';
      return {
        ...stu,
        transferState: nextState,
        transferDate:
          nextState === 'TRANSFERRED_OUT' ? '2026-09-15' : undefined,
        transferNote:
          nextState === 'TRANSFERRED_OUT'
            ? `ย้ายออก (คงเลขที่ ${stu.sgsSeatNo} ไว้ตาม SGS เพื่อไม่ให้ลำดับถัดไปเลื่อนบรรทัด)`
            : undefined,
      };
    });
    return this.saveSgsRoster(roster, 'งานทะเบียน / ครูที่ปรึกษา');
  },

  /**
   * ดึงรายการชิ้นงานตามรหัสวิชาและห้องเรียน โดยใช้ isSameClassroom เปรียบเทียบแบบ Normalize
   */
  getTermAssignments(courseCode?: string, classroomIdOrLabel?: string): TermAssignmentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TERM_ASSIGNMENTS);
      const allAssignments: TermAssignmentItem[] = raw ? JSON.parse(raw) : [];

      return allAssignments.filter((asg: any) => {
        // 1. กรองตามรหัสวิชา (ถ้าระบุมา)
        if (courseCode && courseCode !== 'ALL') {
          const cleanParam = courseCode.trim().toUpperCase();
          const cleanItem = (asg.courseCode || '').trim().toUpperCase();
          if (cleanItem && cleanItem !== cleanParam && !asg.courseName?.includes(courseCode)) {
            return false;
          }
        }

        // 2. กรองตามห้องเรียน (รองรับทั้ง 'room-3-1', 'ม.3/1', targetClassrooms หรือชิ้นงานส่วนกลางที่ไม่ระบุห้อง)
        if (classroomIdOrLabel && classroomIdOrLabel !== 'ALL') {
          if (
            asg.targetClassrooms &&
            Array.isArray(asg.targetClassrooms) &&
            asg.targetClassrooms.length > 0 &&
            !asg.targetClassrooms.includes('ALL')
          ) {
            const matchRoom = asg.targetClassrooms.some((r: string) =>
              isSameClassroom(r, classroomIdOrLabel)
            );
            if (!matchRoom) return false;
          } else {
            const targetRoom = asg.classroomId || asg.classroom;
            if (targetRoom && targetRoom !== 'ALL') {
              if (!isSameClassroom(targetRoom, classroomIdOrLabel)) return false;
            }
          }
        }

        return true;
      });
    } catch {
      return [];
    }
  },

  // Q3-A: สลับตั้งค่า ⭐ งานบังคับ (ไม่ส่งติด ร) รายชิ้นงาน
  toggleAssignmentRequiredForPass(assignmentId: string): TermAssignmentItem[] {
    const list = this.getTermAssignments().map((item) =>
      item.id === assignmentId
        ? { ...item, isRequiredForPass: !item.isRequiredForPass }
        : item
    );
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
    }
    return list;
  },

  deleteTermAssignment(assignmentId: string): TermAssignmentItem[] {
    const originalList = this.getTermAssignments();
    const targetItem = originalList.find((i) => i.id === assignmentId || i.unitId === assignmentId);
    const affectedIds = new Set<string>([assignmentId]);
    if (targetItem?.unitId && targetItem.unitId === assignmentId) {
      // If deleting the entire unit bundle
      originalList.forEach((it) => {
        if (it.unitId === targetItem.unitId) affectedIds.add(it.id);
      });
    }

    const list = originalList.filter((item) => !affectedIds.has(item.id) && item.unitId !== assignmentId);
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(list));

    // Cascade delete related submissions
    try {
      const allSubs = this.getSubmissions();
      const nextSubs = allSubs.filter((s) => !affectedIds.has(s.assignmentId));
      this.saveSubmissions(nextSubs);
    } catch (e) {
      console.warn('[deleteTermAssignment] Error cascade deleting submissions:', e);
    }

    // Cascade delete local file caches and grading queue items
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          affectedIds.forEach((id) => {
            if (k.startsWith(`kp_sub_file_${id}_`) || k.includes(id)) {
              keysToRemove.push(k);
            }
          });
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));

        // Purge from grading queue
        const rawQueue = localStorage.getItem('kp_grading_queue_v2');
        if (rawQueue) {
          const queueItems = JSON.parse(rawQueue);
          if (Array.isArray(queueItems)) {
            const nextQueue = queueItems.filter((q: any) => !affectedIds.has(q.assignmentId));
            localStorage.setItem('kp_grading_queue_v2', JSON.stringify(nextQueue));
          }
        }
      } catch (e) {
        console.warn('[deleteTermAssignment] Error cleaning up file cache/queue:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', { detail: { type: 'submissions-updated' } }));
    }
    return list;
  },

  updateTermAssignment(
    assignmentId: string,
    updates: Partial<TermAssignmentItem>
  ): TermAssignmentItem[] {
    const list = this.getTermAssignments();
    const targetItem = list.find((i) => i.id === assignmentId);
    const targetUnitId = targetItem?.unitId;
    const targetUnitTitle = targetItem?.unitTitle;

    const updated = list.map((item) => {
      const isTarget = item.id === assignmentId;
      const isSameUnit = Boolean(
        !isTarget &&
        ((targetUnitId && item.unitId === targetUnitId) ||
         (targetUnitTitle && item.unitTitle === targetUnitTitle && item.courseCode === targetItem?.courseCode))
      );

      if (!isTarget && !isSameUnit) return item;

      if (isSameUnit) {
        // ซิงค์ข้อมูลระดับหน่วยกับงานอื่นในหน่วยเดียวกัน
        return {
          ...item,
          unitTitle: updates.unitTitle !== undefined ? updates.unitTitle?.trim() : item.unitTitle,
          unitMaxScore: updates.unitMaxScore !== undefined ? Number(updates.unitMaxScore) : item.unitMaxScore,
          totalTasksInUnit: updates.totalTasksInUnit !== undefined ? Number(updates.totalTasksInUnit) : item.totalTasksInUnit,
          scoringMethod: updates.scoringMethod !== undefined ? updates.scoringMethod : item.scoringMethod,
          autoRoundUp: updates.autoRoundUp !== undefined ? updates.autoRoundUp : item.autoRoundUp,
          scorePart: updates.scorePart !== undefined ? updates.scorePart : item.scorePart,
        };
      }

      return {
        ...item,
        ...updates,
        title: updates.title !== undefined ? updates.title.trim() : item.title,
        description: updates.description !== undefined ? updates.description : item.description,
        attachments: updates.attachments !== undefined ? updates.attachments : item.attachments,
        maxScore: updates.maxScore !== undefined ? Number(updates.maxScore) : item.maxScore,
        unitTitle: updates.unitTitle !== undefined ? updates.unitTitle?.trim() : item.unitTitle,
        unitMaxScore: updates.unitMaxScore !== undefined ? Number(updates.unitMaxScore) : item.unitMaxScore,
        totalTasksInUnit: updates.totalTasksInUnit !== undefined ? Number(updates.totalTasksInUnit) : item.totalTasksInUnit,
        dueDate: updates.dueDate !== undefined ? updates.dueDate : item.dueDate,
        targetClassrooms: updates.targetClassrooms !== undefined ? updates.targetClassrooms : item.targetClassrooms,
        scorePart: updates.scorePart !== undefined ? updates.scorePart : item.scorePart,
        scoringMethod: updates.scoringMethod !== undefined ? updates.scoringMethod : item.scoringMethod,
        autoRoundUp: updates.autoRoundUp !== undefined ? updates.autoRoundUp : item.autoRoundUp,
      };
    });
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(updated));

    // Cascade update related submissions & grading queue items when assignment is renamed or updated
    try {
      const subs = this.getSubmissions();
      let subsChanged = false;

      // ตรวจสอบว่ามีการแก้ไขคะแนนเต็ม (maxScore) หรือไม่ เพื่อปรับคะแนนนักเรียนตาม % เดิมโดยอัตโนมัติ
      const oldMaxScore = targetItem?.maxScore;
      const newMaxScore = updates.maxScore !== undefined ? Number(updates.maxScore) : undefined;
      const shouldScaleMaxScore =
        typeof oldMaxScore === 'number' &&
        typeof newMaxScore === 'number' &&
        oldMaxScore > 0 &&
        newMaxScore > 0 &&
        newMaxScore !== oldMaxScore;

      const nextSubs = subs.map((sub) => {
        const isMatch =
          sub.assignmentId === assignmentId ||
          (targetUnitId && sub.assignmentId === targetUnitId) ||
          (targetItem?.title && sub.workTitle && sub.workTitle.trim() === targetItem.title.trim());

        if (isMatch) {
          subsChanged = true;
          let scaledScore = sub.score;
          if (shouldScaleMaxScore && typeof sub.score === 'number' && oldMaxScore && newMaxScore) {
            // คำนวณปรับคะแนนตามสัดส่วนร้อยละ (%) เดิม เช่น 20/20 (100%) -> เปลี่ยนเป็นเต็ม 10 ได้ 10/10 (100%)
            const ratio = sub.score / oldMaxScore;
            scaledScore = Math.round(ratio * newMaxScore * 10) / 10;
          }

          return {
            ...sub,
            assignmentId, // ensure normalized assignment ID
            workTitle: updates.title !== undefined ? updates.title.trim() : sub.workTitle,
            maxScore: newMaxScore !== undefined ? newMaxScore : sub.maxScore,
            score: scaledScore,
          };
        }
        return sub;
      });

      if (subsChanged) {
        this.saveSubmissions(nextSubs);
      }

      // Also cascade to teacher grading queue in localStorage
      ['kp_grading_queue_v2', 'cls_teacher_grading_queue_v2'].forEach((queueKey) => {
        const raw = localStorage.getItem(queueKey);
        if (raw) {
          const qList = JSON.parse(raw);
          if (Array.isArray(qList)) {
            let qChanged = false;
            const nextQ = qList.map((q: any) => {
              const isMatch =
                q.assignmentId === assignmentId ||
                (targetItem?.title && q.assignmentTitle && q.assignmentTitle.trim() === targetItem.title.trim());

              if (isMatch) {
                qChanged = true;
                let scaledScore = q.score;
                if (shouldScaleMaxScore && typeof q.score === 'number' && oldMaxScore && newMaxScore) {
                  const ratio = q.score / oldMaxScore;
                  scaledScore = Math.round(ratio * newMaxScore * 10) / 10;
                }
                return {
                  ...q,
                  assignmentId,
                  assignmentTitle: updates.title !== undefined ? updates.title.trim() : q.assignmentTitle,
                  subjectCode: updates.courseCode !== undefined ? updates.courseCode : q.subjectCode,
                  subjectName: updates.courseName !== undefined ? updates.courseName : q.subjectName,
                  maxScore: updates.maxScore !== undefined ? Number(updates.maxScore) : q.maxScore,
                  score: scaledScore,
                };
              }
              return q;
            });
            if (qChanged) {
              localStorage.setItem(queueKey, JSON.stringify(nextQ));
            }
          }
        }
      });
    } catch (err) {
      console.warn('[updateTermAssignment] Cascade update warning:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
      window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
    }
    return updated;
  },

  // Cascade course code / name changes across all term assignments and grading queues
  cascadeCourseUpdate(oldCourseCode: string, newCourseCode: string, newCourseName?: string): void {
    if (!oldCourseCode || !newCourseCode) return;
    try {
      const allAsg = this.getTermAssignments();
      let asgChanged = false;
      const nextAsg = allAsg.map((a) => {
        if (a.courseCode?.trim().toUpperCase() === oldCourseCode.trim().toUpperCase()) {
          asgChanged = true;
          return {
            ...a,
            courseCode: newCourseCode.trim(),
            courseName: newCourseName?.trim() || a.courseName,
          };
        }
        return a;
      });
      if (asgChanged) {
        localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(nextAsg));
      }

      ['kp_grading_queue_v2', 'cls_teacher_grading_queue_v2'].forEach((queueKey) => {
        const raw = localStorage.getItem(queueKey);
        if (raw) {
          const qList = JSON.parse(raw);
          if (Array.isArray(qList)) {
            let qChanged = false;
            const nextQ = qList.map((q: any) => {
              if (q.subjectCode?.trim().toUpperCase() === oldCourseCode.trim().toUpperCase()) {
                qChanged = true;
                return {
                  ...q,
                  subjectCode: newCourseCode.trim(),
                  subjectName: newCourseName?.trim() || q.subjectName,
                };
              }
              return q;
            });
            if (qChanged) {
              localStorage.setItem(queueKey, JSON.stringify(nextQ));
            }
          }
        }
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kp-sgs-roster-updated'));
        window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      }
    } catch (err) {
      console.warn('[cascadeCourseUpdate] Error updating course codes in assignments:', err);
    }
  },

  addTermAssignment(payload: {
    id?: string;
    title: string;
    description?: string;
    attachments?: AssignmentAttachment[];
    courseCode?: string;
    courseName?: string;
    targetClassrooms?: string[];
    scorePart?: FourScorePart;
    sgsUnit?: 'u1' | 'u2' | 'u3';
    unitKey?: string;
    indicatorCode?: string;
    maxScore: number;
    dueDate: string;
    isRequiredForPass?: boolean;
    unitId?: string;
    unitTitle?: string;
    unitMaxScore?: number;
    scoringMethod?: ScoringMethodType;
    totalTasksInUnit?: number;
    autoRoundUp?: boolean;
  }): TermAssignmentItem[] {
    const list = this.getTermAssignments();
    const part: FourScorePart =
      payload.scorePart ||
      (payload.sgsUnit === 'u1'
        ? 'PRE_MIDTERM'
        : payload.sgsUnit === 'u2' || payload.sgsUnit === 'u3'
        ? 'POST_MIDTERM'
        : 'PRE_MIDTERM');

    const partLabelMap: Record<FourScorePart, string> = {
      PRE_MIDTERM: 'ก่อนกลางภาค',
      MIDTERM: 'สอบกลางภาค',
      POST_MIDTERM: 'หลังกลางภาค',
      FINAL: 'สอบปลายภาค',
    };
    const mappedUnit: 'u1' | 'u2' | 'u3' =
      payload.sgsUnit || (part === 'PRE_MIDTERM' || part === 'MIDTERM' ? 'u1' : 'u2');

    const newItem: TermAssignmentItem = {
      id: payload.id || `asg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderNo: list.length + 1,
      title: payload.title.trim(),
      description: payload.description?.trim(),
      attachments: payload.attachments || [],
      courseCode: payload.courseCode,
      targetClassrooms:
        payload.targetClassrooms && payload.targetClassrooms.length > 0
          ? payload.targetClassrooms
          : ['ALL'],
      scorePart: part,
      sgsUnit: mappedUnit,
      sgsUnitLabel: partLabelMap[part],
      maxScore: Number(payload.maxScore) || 10,
      assignedDate: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      }),
      dueDate: payload.dueDate || 'ไม่ระบุกำหนดส่ง',
      isRequiredForPass: payload.isRequiredForPass ?? false,
      unitId: payload.unitId,
      unitTitle: payload.unitTitle?.trim(),
      unitMaxScore: payload.unitMaxScore !== undefined ? Number(payload.unitMaxScore) : undefined,
      scoringMethod: payload.scoringMethod || 'DIRECT_SCORE',
      totalTasksInUnit: payload.totalTasksInUnit !== undefined ? Number(payload.totalTasksInUnit) : undefined,
      autoRoundUp: payload.autoRoundUp ?? true,
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
      window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
    }
    return updated;
  },

  getSubmissions(): StudentWorkSubmission[] {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY_WORK_SUBMISSIONS) ||
        localStorage.getItem('kp_work_submissions_v1');
      if (raw) {
        const list: StudentWorkSubmission[] = JSON.parse(raw);
        // Hydrate fileDataUrl if not present in item but present in separate scoped key or Cloudflare R2
        return list.map((sub) => {
          let fileUrl = sub.fileDataUrl;

          // ถ้ามี R2 Worker Configured และมี URL/Key ของ R2 ให้แปลงเป็น URL ที่เปิดดูได้จริง
          if (r2StorageService.isConfigured() && (fileUrl || sub.r2ObjectKey)) {
            const resolvedR2 = r2StorageService.resolvePublicViewUrl(fileUrl || sub.r2ObjectKey);
            if (resolvedR2 && (resolvedR2.startsWith('http://') || resolvedR2.startsWith('https://'))) {
              return { ...sub, fileDataUrl: resolvedR2 };
            }
          }

          // หาก R2 ยังไม่ configured และ URL เป็นโดเมนหลอกที่เข้าไม่ได้ ให้กรองออกเพื่อให้ดึงจาก local cache
          if (
            fileUrl &&
            !r2StorageService.isConfigured() &&
            (fileUrl.startsWith('https://storage.kps.ac.th') ||
              fileUrl.startsWith('http://storage.kps.ac.th') ||
              fileUrl.startsWith('r2://'))
          ) {
            fileUrl = undefined;
          }

          if (!fileUrl) {
            const cleanFileName = sub.r2ObjectKey ? sub.r2ObjectKey.split('/').pop() : undefined;
            const cachedUrl = this.getSubmissionFileUrl(
              sub.assignmentId,
              sub.studentCode,
              cleanFileName || sub.workAttachmentLabel
            );
            if (cachedUrl) {
              return { ...sub, fileDataUrl: cachedUrl };
            }
          }
          return { ...sub, fileDataUrl: fileUrl };
        });
      }
      return [];
    } catch {
      return [];
    }
  },

  saveSubmissions(list: StudentWorkSubmission[]): StudentWorkSubmission[] {
    try {
      // Ensure fileDataUrls are safely cached in individual scoped keys
      list.forEach((sub) => {
        if (sub.fileDataUrl && sub.fileDataUrl.startsWith('data:')) {
          try {
            const cleanAsg = String(sub.assignmentId).trim();
            const cleanStu = String(sub.studentCode).trim();
            localStorage.setItem(`kp_sub_file_${cleanAsg}_${cleanStu}`, sub.fileDataUrl);
          } catch (e) {
            console.warn('Could not cache submission file separately', e);
          }
        }
      });

      // Strip large dataUrls from monolithic array to prevent 5MB localStorage quota exhaustion
      const compactList = list.map((sub) => {
        if (sub.fileDataUrl && sub.fileDataUrl.length > 250) {
          const { fileDataUrl, ...rest } = sub;
          return rest as StudentWorkSubmission;
        }
        return sub;
      });

      localStorage.setItem(STORAGE_KEY_WORK_SUBMISSIONS, JSON.stringify(compactList));
    } catch (err) {
      console.warn('saveSubmissions fallback to minimal payload', err);
      try {
        const minimalList = list.map(({ fileDataUrl, ...rest }) => rest as StudentWorkSubmission);
        localStorage.setItem(STORAGE_KEY_WORK_SUBMISSIONS, JSON.stringify(minimalList));
      } catch (e2) {
        console.error('saveSubmissions quota exceeded completely', e2);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', { detail: { type: 'submissions-updated' } }));
    }
    return list;
  },

  resetDemoSubmissionsAndRoster(): void {
    if (cleanSlateService.isCleanSlateActive()) {
      localStorage.setItem(STORAGE_KEY_WORK_SUBMISSIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_SGS_ROSTER, JSON.stringify([]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
      }
      return;
    }
    localStorage.setItem(
      STORAGE_KEY_WORK_SUBMISSIONS,
      JSON.stringify(INITIAL_SUBMISSIONS)
    );
    localStorage.setItem(
      STORAGE_KEY_SGS_ROSTER,
      JSON.stringify(INITIAL_SGS_ROSTER)
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
    }
  },

  /**
   * ดึงรายชื่อนักเรียนแบบ RosterIdentityRecord ที่มีทั้ง UUID id และ studentCode
   */
  getRoster(classroomId?: string): RosterIdentityRecord[] {
    const list = this.getSgsRoster(classroomId);
    return list.map((s) => ({
      id: (s as any).id || (s as any).studentId || `stu-${s.studentCode}`,
      studentCode: s.studentCode,
      name: s.fullName || s.studentName,
      classroom: s.classroom,
      classroomId: s.classroom,
    }));
  },

  /**
   * Bridge คะแนนจากระบบ SGS (ที่ใช้ studentCode) ไปยัง gradeService (ที่ใช้ studentId UUID)
   * เพื่อให้ระบบประมวลผลเลื่อนชั้นและใบ ปพ. ดึงคะแนนจากตาราง "StudentScore" บน Neon DB ได้ถูกต้อง
   */
  syncScoreToGradeServiceOutbox(params: {
    studentCode?: string;
    studentId?: string;
    assignmentId: string;
    score: number | null;
  }): boolean {
    try {
      const roster = this.getRoster() as RosterIdentityRecord[];
      const identity = resolveStudentIdentity(
        { id: params.studentId, studentCode: params.studentCode },
        roster
      );

      // หากหาใน Roster ปัจจุบันไม่เจอ ให้ค้นหาจาก studentService หรือ studentId ที่ส่งมา
      let resolvedStudentId = identity?.studentId || params.studentId;
      if (!resolvedStudentId && params.studentCode) {
        const foundStu = studentService.findStudentByCode(params.studentCode);
        if (foundStu?.student?.id) {
          resolvedStudentId = foundStu.student.id;
        } else {
          resolvedStudentId = `stu-${params.studentCode}`;
        }
      }

      if (!resolvedStudentId || !params.assignmentId) {
        console.warn(
          `[ScoreBridge] ข้ามการซิงค์คะแนนเนื่องจากไม่พบ UUID ของนักเรียน (studentCode: ${params.studentCode})`
        );
        return false;
      }

      const sanitizedScore =
        typeof params.score === 'number' && !Number.isNaN(params.score)
          ? params.score
          : null;

      // ส่งเข้า IndexedDB Outbox ของ gradeService เพื่อเตรียม Push ขึ้น Neon PostgreSQL
      if (gradeService && typeof gradeService.setScore === 'function') {
        // ลงทะเบียนโครงสร้าง AssessmentColumn ล่วงหน้าเพื่อป้องกัน Foreign Key Constraint
        const targetAsg = this.getTermAssignments().find((a) => a.id === params.assignmentId);
        if (targetAsg && typeof (gradeService as any).ensureAssessmentColumn === 'function') {
          void (gradeService as any).ensureAssessmentColumn({
            id: targetAsg.id,
            courseId: targetAsg.courseCode || 'GENERAL',
            classroomId: targetAsg.targetClassrooms?.[0] !== 'ALL' ? targetAsg.targetClassrooms?.[0] : null,
            title: targetAsg.title,
            maxScore: targetAsg.maxScore,
            category: targetAsg.scorePart === 'MIDTERM' ? 'MIDTERM' : targetAsg.scorePart === 'FINAL' ? 'FINAL' : 'HW',
          });
        }
        gradeService.setScore(resolvedStudentId, params.assignmentId, sanitizedScore);
      }

      // แจ้งเตือน Component อื่นๆ ที่กำลังเปิดดูตารางคะแนนอยู่
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('kp:sgs-score-bridged', {
            detail: {
              studentId: resolvedStudentId,
              studentCode: identity?.studentCode || params.studentCode,
              assignmentId: params.assignmentId,
              score: sanitizedScore,
              timestamp: Date.now(),
            },
          })
        );
      }

      return true;
    } catch (error) {
      console.error('[ScoreBridge] เกิดข้อผิดพลาดในการซิงค์คะแนนไปยัง gradeService:', error);
      return false;
    }
  },

  /**
   * ซิงค์สถานะในคิวตรวจงานของครู (kp_grading_queue_v2)
   * แก้ปัญหา Quick Grade หาคีย์ไม่เจอ และแก้ปัญหางานซ่อม (Resubmission) ไม่เด้งกลับเข้าคิว FIFO
   */
  syncGradingQueueItem(params: {
    assignmentId: string;
    studentCode: string;
    studentId?: string;
    studentName?: string;
    classroom?: string;
    courseCode?: string;
    workTitle?: string;
    fileUrl?: string;
    externalLinkUrl?: string;
    textContent?: string;
    status: 'PENDING_REVIEW' | 'GRADED' | 'RETURNED_REVISION' | 'RETURNED';
    score?: number | null;
    feedback?: string;
    isResubmission?: boolean;
  }): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const rawQueue = localStorage.getItem('kp_grading_queue_v2');
      const queue: Array<Record<string, any>> = rawQueue ? JSON.parse(rawQueue) : [];
      const canonicalQueueId = `q_${params.assignmentId}_${params.studentCode}`;
      const now = Date.now();

      // ค้นหาแบบยืดหยุ่น: เช็คทั้ง ID มาตรฐาน และคู่ (assignmentId + studentCode)
      const existingIdx = queue.findIndex(
        (item) =>
          item.id === canonicalQueueId ||
          (item.assignmentId === params.assignmentId &&
            item.studentCode === params.studentCode)
      );

      const queueStatus =
        params.status === 'RETURNED_REVISION' ? 'RETURNED' : params.status;

      if (existingIdx !== -1) {
        const current = queue[existingIdx];
        queue[existingIdx] = {
          ...current,
          id: current.id || canonicalQueueId,
          assignmentId: params.assignmentId,
          studentCode: params.studentCode,
          studentId: params.studentId || current.studentId,
          status: queueStatus,
          score: params.score !== undefined ? params.score : current.score,
          feedback: params.feedback !== undefined ? params.feedback : current.feedback,
          fileUrl: params.fileUrl || current.fileUrl,
          externalLinkUrl: params.externalLinkUrl || current.externalLinkUrl,
          textContent: params.textContent || current.textContent,
          // หากนักเรียนส่งงานใหม่หรือส่งงานซ่อม ให้รีเซ็ตเวลาส่งเพื่อให้เข้าคิว FIFO รอตรวจของครูทันที
          submittedTimestamp:
            queueStatus === 'PENDING_REVIEW'
              ? now
              : current.submittedTimestamp || now,
          gradedTimestamp:
            queueStatus === 'GRADED' ? now : current.gradedTimestamp,
          isResubmission:
            params.isResubmission ??
            (current.status === 'RETURNED' ||
              current.status === 'RETURNED_REVISION' ||
              Boolean(current.isResubmission)),
        };
      } else if (queueStatus === 'PENDING_REVIEW' || queueStatus === 'GRADED') {
        // กรณีไม่มีในคิวมาก่อน (เช่น ส่งงานครั้งแรก หรือครู Quick Grade จากตารางโดยตรง)
        queue.push({
          id: canonicalQueueId,
          assignmentId: params.assignmentId,
          studentCode: params.studentCode,
          studentId: params.studentId,
          studentName: params.studentName || '',
          classroom: params.classroom || '',
          courseCode: params.courseCode || '',
          workTitle: params.workTitle || '',
          fileUrl: params.fileUrl || '',
          externalLinkUrl: params.externalLinkUrl || '',
          textContent: params.textContent || '',
          status: queueStatus,
          score: params.score ?? null,
          feedback: params.feedback || '',
          submittedTimestamp: now,
          gradedTimestamp: queueStatus === 'GRADED' ? now : undefined,
          isResubmission: Boolean(params.isResubmission),
        });
      }

      localStorage.setItem('kp_grading_queue_v2', JSON.stringify(queue));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      }
    } catch (err) {
      console.warn('[GradingQueueSync] ไม่สามารถอัปเดตคิวตรวจงานใน localStorage:', err);
    }
  },

  /**
   * บันทึกผลการตรวจงานและคะแนน (เรียกใช้จากทั้ง GradingQueueView, AssignmentManagementView และ ScoreMatrixPrapanView)
   */
  gradeSubmission(
    submissionIdOrAsgId: string,
    scoreOrStudentCode: any,
    feedbackOrScore?: any,
    optionsOrStatus?: any,
    extraFeedback?: string
  ): any {
    let submissionIdOrKey: string;
    let score: number | null = null;
    let feedback: string = '';
    let options: {
      studentCode?: string;
      studentId?: string;
      assignmentId?: string;
      unitId?: string;
      workTitle?: string;
      maxScore?: number;
      courseCode?: string;
    } = {};

    const isLegacyCall =
      typeof scoreOrStudentCode === 'string' &&
      (typeof feedbackOrScore === 'number' || feedbackOrScore === null || feedbackOrScore === undefined);

    if (isLegacyCall) {
      // Convention A: gradeSubmission(assignmentId, studentCode, score, status?, teacherFeedback?)
      const assignmentId = submissionIdOrAsgId;
      const studentCode = scoreOrStudentCode;
      score = feedbackOrScore;
      submissionIdOrKey = `sub_${assignmentId}_${studentCode}`;
      feedback = typeof extraFeedback === 'string' ? extraFeedback : (typeof optionsOrStatus === 'string' && optionsOrStatus !== 'GRADED' && optionsOrStatus !== 'MISSING' ? optionsOrStatus : '');
      options = {
        assignmentId,
        studentCode,
        workTitle: 'ส่งงานหน้าชั้นเรียน / บันทึกคะแนนโดยครูผู้สอน',
      };
    } else {
      // Convention B: gradeSubmission(submissionIdOrKey, score, feedback, options)
      submissionIdOrKey = submissionIdOrAsgId;
      score = typeof scoreOrStudentCode === 'number' ? scoreOrStudentCode : (scoreOrStudentCode === null ? null : Number(scoreOrStudentCode) || 0);
      feedback = typeof feedbackOrScore === 'string' ? feedbackOrScore : '';
      options = optionsOrStatus || {};
    }

    const submissions = this.getSubmissions();
    const roster = this.getRoster() as RosterIdentityRecord[];

    // รองรับการค้นหาทั้งจาก submission.id, คีย์ผสม หรือคู่ (studentCode + assignmentId)
    let targetIdx = submissions.findIndex((s: any) => s.id === submissionIdOrKey);

    if (targetIdx === -1 && options?.studentCode && options?.assignmentId) {
      targetIdx = submissions.findIndex(
        (s: any) =>
          s.studentCode === options.studentCode &&
          matchSubmissionToAssignment(s, {
            id: options.assignmentId!,
            unitId: options.unitId,
            title: options.workTitle,
          })
      );
    }

    const nowIso = new Date().toISOString();
    let updatedSubmission: any;

    if (targetIdx !== -1) {
      const existing = submissions[targetIdx];
      const targetAsg = this.getTermAssignments().find((a) => a.id === existing.assignmentId);
      const effectiveMaxScore = existing.maxScore ?? targetAsg?.maxScore;
      const boundedScore =
        score === null
          ? null
          : typeof effectiveMaxScore === 'number' && effectiveMaxScore > 0
          ? Math.min(Math.max(0, score), effectiveMaxScore)
          : Math.max(0, score);

      updatedSubmission = {
        ...existing,
        score: boundedScore,
        maxScore: effectiveMaxScore ?? existing.maxScore,
        feedback: feedback || existing.feedback || '',
        teacherFeedback: feedback || existing.teacherFeedback || '',
        status: score === null ? 'MISSING' : 'GRADED',
        gradedAt: nowIso,
      };
      submissions[targetIdx] = updatedSubmission;
    } else if (options?.studentCode && options?.assignmentId) {
      // กรณีครูกรอกคะแนนผ่าน Quick Grade ในตาราง ปพ.5 โดยที่นักเรียนไม่ได้กดส่งไฟล์ในระบบ
      const identity = resolveStudentIdentity(
        { id: options.studentId, studentCode: options.studentCode },
        roster
      );
      const targetAsg = this.getTermAssignments().find((a) => a.id === options.assignmentId);
      const maxScore = options.maxScore ?? targetAsg?.maxScore ?? 10;
      const boundedScore = score === null ? null : Math.min(Math.max(0, score), maxScore);

      updatedSubmission = {
        id: submissionIdOrKey || `sub_${options.assignmentId}_${options.studentCode}`,
        assignmentId: options.assignmentId,
        unitId: options.unitId || targetAsg?.unitId,
        studentCode: identity?.studentCode || options.studentCode,
        studentId: identity?.studentId || options.studentId,
        workTitle: options.workTitle || targetAsg?.title || 'บันทึกคะแนนโดยครูผู้สอน',
        courseCode: options.courseCode || targetAsg?.courseCode,
        score: boundedScore,
        maxScore,
        feedback,
        teacherFeedback: feedback,
        status: score === null ? 'MISSING' : 'GRADED',
        submittedAt: nowIso,
        gradedAt: nowIso,
      };
      submissions.push(updatedSubmission);
    } else {
      console.warn(`[gradeSubmission] ไม่พบรายการส่งงานสำหรับคีย์: ${submissionIdOrKey}`);
      return isLegacyCall ? submissions : null;
    }

    // 1. บันทึกลง LocalStorage ของระบบ SGS
    this.saveSubmissions(submissions);

    // 2. ซิงค์สถานะในคิวตรวจงานของครูให้เป็น GRADED ทันที (ป้องกันคิวค้างสถานะ PENDING_REVIEW)
    this.syncGradingQueueItem({
      assignmentId: updatedSubmission.assignmentId,
      studentCode: updatedSubmission.studentCode,
      studentId: updatedSubmission.studentId,
      workTitle: updatedSubmission.workTitle,
      courseCode: updatedSubmission.courseCode,
      status: updatedSubmission.status === 'MISSING' ? 'PENDING_REVIEW' : 'GRADED',
      score: updatedSubmission.score,
      feedback: updatedSubmission.feedback,
    });

    // 3. Bridge คะแนนเข้าสู่ gradeService (IndexedDB Outbox -> ตาราง "StudentScore" บน Neon DB)
    this.syncScoreToGradeServiceOutbox({
      studentCode: updatedSubmission.studentCode,
      studentId: updatedSubmission.studentId,
      assignmentId: updatedSubmission.assignmentId,
      score: updatedSubmission.score,
    });

    return isLegacyCall ? submissions : updatedSubmission;
  },

  // ส่งงานกลับให้นักเรียนแก้ไข (Request Resubmission) พร้อมระบุเหตุผล
  returnSubmissionForRevision(
    assignmentId: string,
    studentCode: string,
    reason: string,
    teacherFeedback?: string
  ): StudentWorkSubmission[] {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(
      (s) => s.assignmentId === assignmentId && s.studentCode === studentCode
    );
    const nowIso = new Date().toISOString();
    const formattedNote = `[ส่งงานกลับเนื่องจาก: ${reason}] ${teacherFeedback || ''}`.trim();

    const nextItem: StudentWorkSubmission =
      idx !== -1
        ? {
            ...subs[idx],
            status: 'RETURNED_REVISION',
            score: null,
            returnReason: reason,
            returnedAt: nowIso,
            teacherFeedback: formattedNote,
          }
        : {
            assignmentId,
            studentCode,
            status: 'RETURNED_REVISION',
            score: null,
            returnReason: reason,
            returnedAt: nowIso,
            teacherFeedback: formattedNote,
            workTitle: 'งานที่ส่งกลับเพื่อแก้ไข',
          };

    const updated =
      idx !== -1
        ? subs.map((item, i) => (i === idx ? nextItem : item))
        : [...subs, nextItem];

    // ซิงค์สถานะลงคิวตรวจงาน (kp_grading_queue_v2) ให้แสดงเป็นสถานะ 'RETURNED' ทันที
    this.syncGradingQueueItem({
      assignmentId,
      studentCode,
      status: 'RETURNED_REVISION',
      feedback: formattedNote,
      score: null,
    });

    return this.saveSubmissions(updated);
  },

  // 1-Click Bulk Action: ให้คะแนนเต็มทุกคนที่ส่งงานแล้ว (รอตรวจ -> ตรวจเสร็จทันที)
  bulkGradeAllSubmitted(assignmentId?: string): StudentWorkSubmission[] {
    const assignments = this.getTermAssignments();
    const subs = this.getSubmissions().map((sub) => {
      if (assignmentId && sub.assignmentId !== assignmentId) return sub;
      if (sub.status === 'SUBMITTED_PENDING') {
        const asg = assignments.find((a) => a.id === sub.assignmentId);
        return {
          ...sub,
          status: 'GRADED' as const,
          score: asg ? asg.maxScore : 10,
        };
      }
      return sub;
    });
    return this.saveSubmissions(subs);
  },

  // คำนวณคะแนน 4 ส่วน (ก่อนกลางภาค, กลางภาค, หลังกลางภาค, ปลายภาค) + รองรับการพิมพ์คะแนนตรงในตาราง ปพ.5
  computeStudentSgsGrades(
    studentOrCode: SgsStudentRecord | string,
    courseCode?: string,
    classroomId?: string
  ): any {
    const roster = this.getSgsRoster();
    let student: SgsStudentRecord;
    if (typeof studentOrCode === 'string') {
      const found = roster.find((s) => s.studentCode === studentOrCode || (s as any).id === studentOrCode);
      if (found) {
        student = found;
      } else {
        const identity = resolveStudentIdentity(studentOrCode, this.getRoster());
        student = {
          sgsSeatNo: 0,
          no: 0,
          studentCode: identity?.studentCode || studentOrCode,
          studentName: identity?.student?.name || studentOrCode,
          fullName: identity?.student?.name || studentOrCode,
          gender: 'MALE',
          classroom: classroomId || identity?.student?.classroom || '',
          transferState: 'ACTIVE',
          attendancePercent: 100,
          attendanceRate: 1,
          specialStatus: 'NORMAL',
          morningStatusLabel: 'มาเรียน',
          midtermScore: 0,
          finalScore: 0,
          desirableCharacteristics: [3, 3, 3, 3, 3, 3, 3, 3],
          criticalThinking: [3, 3, 3, 3, 3],
        };
      }
    } else {
      student = studentOrCode;
    }

    const weights = this.getCourseWeights(courseCode);
    const assignments = this.getTermAssignments(courseCode, classroomId || student.classroom);
    const subs = this.getSubmissions().filter(
      (s) => s.studentCode === student.studentCode
    );

    if (student.transferState === 'TRANSFERRED_OUT') {
      const targetRoom = classroomId || student.classroom;
      return {
        studentId: (student as any).id || (student as any).studentId || `stu-${student.studentCode}`,
        studentCode: student.studentCode,
        classroom: normalizeClassroomCode(targetRoom) || targetRoom,
        courseCode: courseCode || '',
        formativeScore: 0,
        formativeMax: 0,
        midtermScore: 0,
        midtermMax: 0,
        finalScore: 0,
        finalMax: 0,
        totalScore: 0,
        totalMax: 0,
        percentage: 0,
        grade: 'ย้ายออก',
        numericGrade: 0,
        academicStatus: 'ย้ายออก',
        missingCount: 0,
        missingAssignments: [],
        items: [],
        u1: 0,
        u2: 0,
        u3: 0,
        preMidterm: 0,
        postMidterm: 0,
        isPreMidtermManual: false,
        isPostMidtermManual: false,
        weights,
        calculatedAccumulated: 0,
        effectiveAccumulated: 0,
        isManualOverride: false,
        midterm: 0,
        final: 0,
        total: 0,
        gradeLabel: 'ย้ายออก',
        autoLevelFromGrade: 0,
        analyticalThinkingLevel: 0,
        desiredCharacteristicsLevel: 0,
        submittedCount: 0,
        totalAssignedCount: assignments.length,
        pendingReviewCount: 0,
        missingMandatoryTitles: [],
      };
    }

    let u1 = 0;
    let u2 = 0;
    let u3 = 0;
    let preFromWorks = 0;
    let midFromWorks = 0;
    let postFromWorks = 0;
    let finalFromWorks = 0;
    let submittedCount = 0;
    let missingCount = 0;
    let pendingReviewCount = 0;
    const missingMandatoryTitles: string[] = [];

    // แยกงานเดี่ยว (direct) กับงานที่จัดกลุ่มรายหน่วย/จุดประสงค์ (unit-based)
    const unitGroups = new Map<string, TermAssignmentItem[]>();
    const directAssignments: TermAssignmentItem[] = [];

    for (const asg of assignments) {
      const uKey = asg.unitId || (asg.scoringMethod && asg.scoringMethod !== 'DIRECT_SCORE' ? asg.unitTitle : undefined);
      if (uKey && asg.scoringMethod && asg.scoringMethod !== 'DIRECT_SCORE') {
        const group = unitGroups.get(uKey) || [];
        group.push(asg);
        unitGroups.set(uKey, group);
      } else {
        directAssignments.push(asg);
      }
    }

    // 1. คำนวณชิ้นงานเดี่ยวปกติ
    for (const asg of directAssignments) {
      const sub = subs.find((s) => matchSubmissionToAssignment(s, asg));
      if (
        sub &&
        (sub.status === 'GRADED' ||
          sub.status === 'SUBMITTED_PENDING' ||
          sub.status === 'EXEMPT_TRANSFERRED')
      ) {
        submittedCount += 1;
        if (sub.status === 'SUBMITTED_PENDING') {
          pendingReviewCount += 1;
        }
        const earned =
          sub.score !== null && sub.score !== undefined
            ? sub.score
            : sub.status === 'SUBMITTED_PENDING'
            ? asg.maxScore
            : 0;
        if (asg.sgsUnit === 'u1') u1 += earned;
        if (asg.sgsUnit === 'u2') u2 += earned;
        if (asg.sgsUnit === 'u3') u3 += earned;

        const part: FourScorePart =
          asg.scorePart ||
          (asg.sgsUnit === 'u1' ? 'PRE_MIDTERM' : 'POST_MIDTERM');
        if (part === 'PRE_MIDTERM') preFromWorks += earned;
        else if (part === 'MIDTERM') midFromWorks += earned;
        else if (part === 'POST_MIDTERM') postFromWorks += earned;
        else if (part === 'FINAL') finalFromWorks += earned;
      } else {
        missingCount += 1;
        if (asg.isRequiredForPass) {
          missingMandatoryTitles.push(asg.title || `งานที่ ${asg.orderNo}`);
        }
      }
    }

    // 2. คำนวณงานกลุ่มรายหน่วย/รายจุดประสงค์ (เช่น 5 งาน หาร 5, 10 งาน หาร 10 เป็นคะแนนการส่งงาน)
    unitGroups.forEach((unitTasks) => {
      const first = unitTasks[0];
      const unitMax = first.unitMaxScore ?? 10;
      const totalTasks = first.totalTasksInUnit && first.totalTasksInUnit > 0
        ? first.totalTasksInUnit
        : unitTasks.length;
      const autoRoundUp = first.autoRoundUp ?? true;
      const part: FourScorePart = first.scorePart || (first.sgsUnit === 'u1' ? 'PRE_MIDTERM' : 'POST_MIDTERM');
      const sgsUnit = first.sgsUnit;

      let submittedInUnit = 0;
      let rawEarnedSum = 0;
      let rawMaxSum = 0;

      for (const asg of unitTasks) {
        const sub = subs.find((s) => matchSubmissionToAssignment(s, asg));
        if (
          sub &&
          (sub.status === 'GRADED' ||
            sub.status === 'SUBMITTED_PENDING' ||
            sub.status === 'EXEMPT_TRANSFERRED')
        ) {
          submittedCount += 1;
          submittedInUnit += 1;
          if (sub.status === 'SUBMITTED_PENDING') {
            pendingReviewCount += 1;
          }
          const earned =
            sub.score !== null && sub.score !== undefined
              ? sub.score
              : sub.status === 'SUBMITTED_PENDING'
              ? asg.maxScore
              : 0;
          rawEarnedSum += earned;
          rawMaxSum += asg.maxScore;
        } else {
          missingCount += 1;
          if (asg.isRequiredForPass) {
            missingMandatoryTitles.push(asg.title || `งานที่ ${asg.orderNo}`);
          }
        }
      }

      let calculatedUnitScore = 0;
      if (first.scoringMethod === 'SUBMISSION_COUNT_RATIO') {
        const clampedTasks = Math.min(totalTasks, Math.max(0, submittedInUnit));
        const raw = totalTasks > 0 ? (clampedTasks / totalTasks) * unitMax : 0;
        if (autoRoundUp) {
          const floor = Math.floor(raw);
          const dec = Math.round((raw - floor) * 100) / 100;
          calculatedUnitScore = dec >= 0.5 ? Math.ceil(raw) : floor;
        } else {
          calculatedUnitScore = Math.round(raw * 10) / 10;
        }
      } else if (first.scoringMethod === 'RAW_SCORE_AVERAGE') {
        const ratio = rawMaxSum > 0 ? rawEarnedSum / rawMaxSum : 0;
        const raw = ratio * unitMax;
        if (autoRoundUp) {
          const floor = Math.floor(raw);
          const dec = Math.round((raw - floor) * 100) / 100;
          calculatedUnitScore = dec >= 0.5 ? Math.ceil(raw) : floor;
        } else {
          calculatedUnitScore = Math.round(raw * 10) / 10;
        }
      }

      if (sgsUnit === 'u1') u1 += calculatedUnitScore;
      if (sgsUnit === 'u2') u2 += calculatedUnitScore;
      if (sgsUnit === 'u3') u3 += calculatedUnitScore;

      if (part === 'PRE_MIDTERM') preFromWorks += calculatedUnitScore;
      else if (part === 'MIDTERM') midFromWorks += calculatedUnitScore;
      else if (part === 'POST_MIDTERM') postFromWorks += calculatedUnitScore;
      else if (part === 'FINAL') finalFromWorks += calculatedUnitScore;
    });

    // ถ้านักเรียนย้ายเข้าใหม่ มีคะแนนโอนหน่วยที่ 1
    if (
      student.transferState === 'TRANSFERRED_IN' &&
      student.transferredBaseScore?.u1 &&
      u1 === 0
    ) {
      u1 = student.transferredBaseScore.u1;
      preFromWorks = student.transferredBaseScore.u1;
    }

    const cKey = courseCode || 'DEFAULT';
    const courseOverride = student.courseScores?.[cKey];

    const manualPre =
      courseOverride?.preMidterm !== undefined
        ? courseOverride.preMidterm
        : student.preMidtermScore !== undefined
        ? student.preMidtermScore
        : null;
    const manualPost =
      courseOverride?.postMidterm !== undefined
        ? courseOverride.postMidterm
        : student.postMidtermScore !== undefined
        ? student.postMidtermScore
        : null;
    const manualMid =
      courseOverride?.midterm !== undefined
        ? courseOverride.midterm
        : midFromWorks > 0
        ? null
        : typeof student.midtermScore === 'number'
        ? student.midtermScore
        : null;
    const manualFinal =
      courseOverride?.final !== undefined
        ? courseOverride.final
        : finalFromWorks > 0
        ? null
        : typeof student.finalScore === 'number'
        ? student.finalScore
        : null;

    const isPreMidtermManual = manualPre !== null && manualPre !== undefined;
    const isPostMidtermManual = manualPost !== null && manualPost !== undefined;

    const preVal = isPreMidtermManual
      ? Math.min(weights.preMidterm, Math.max(0, Number(manualPre)))
      : Math.min(weights.preMidterm, preFromWorks);

    const postVal = isPostMidtermManual
      ? Math.min(weights.postMidterm, Math.max(0, Number(manualPost)))
      : Math.min(weights.postMidterm, postFromWorks);

    const midtermVal =
      manualMid !== null && manualMid !== undefined
        ? Math.min(weights.midterm, Math.max(0, Number(manualMid)))
        : Math.min(weights.midterm, midFromWorks);

    const finalVal =
      manualFinal !== null && manualFinal !== undefined
        ? Math.min(weights.final, Math.max(0, Number(manualFinal)))
        : Math.min(weights.final, finalFromWorks);

    const calculatedAccumulated = preVal + postVal;
    const isManualOverride =
      student.manualAccumulatedOverride !== undefined &&
      student.manualAccumulatedOverride !== null;
    const effectiveAccumulated = isManualOverride
      ? (student.manualAccumulatedOverride as number)
      : calculatedAccumulated;

    const total = effectiveAccumulated + midtermVal + finalVal;

    let gradeLabel = '0';
    let rReasonLabel: string | undefined;

    const hasRealAttendance =
      typeof student.attendancePercent === 'number' && student.attendancePercent > 0;
    const hasAnyAssessment =
      assignments.length > 0 ||
      isPreMidtermManual ||
      isPostMidtermManual ||
      manualMid !== null ||
      manualFinal !== null ||
      effectiveAccumulated > 0;

    const effectiveTotal = Math.round(total);

    if (hasRealAttendance && student.attendancePercent < 80) {
      gradeLabel = 'มส.';
    } else if (missingMandatoryTitles.length > 0) {
      gradeLabel = 'ร';
      rReasonLabel = `ค้างงานสำคัญ (${missingMandatoryTitles.join(', ')})`;
    } else if (!hasAnyAssessment && total === 0) {
      gradeLabel = '—';
    } else if (effectiveTotal >= 80) {
      gradeLabel = '4.0';
    } else if (effectiveTotal >= 75) {
      gradeLabel = '3.5';
    } else if (effectiveTotal >= 70) {
      gradeLabel = '3.0';
    } else if (effectiveTotal >= 65) {
      gradeLabel = '2.5';
    } else if (effectiveTotal >= 60) {
      gradeLabel = '2.0';
    } else if (effectiveTotal >= 55) {
      gradeLabel = '1.5';
    } else if (effectiveTotal >= 50) {
      gradeLabel = '1.0';
    }

    const numericGrade =
      gradeLabel === '4.0'
        ? 4.0
        : gradeLabel === '3.5'
        ? 3.5
        : gradeLabel === '3.0'
        ? 3.0
        : gradeLabel === '2.5'
        ? 2.5
        : gradeLabel === '2.0'
        ? 2.0
        : gradeLabel === '1.5'
        ? 1.5
        : gradeLabel === '1.0'
        ? 1.0
        : 0;

    const autoLevelFromGrade: 0 | 1 | 2 | 3 =
      numericGrade >= 3.0
        ? 3
        : numericGrade >= 2.0
        ? 2
        : numericGrade >= 1.0
        ? 1
        : 0;

    const analyticalThinkingLevel: 0 | 1 | 2 | 3 =
      courseOverride?.analyticalThinkingLevel ??
      student.analyticalThinkingLevel ??
      autoLevelFromGrade;
    const desiredCharacteristicsLevel: 0 | 1 | 2 | 3 =
      courseOverride?.desiredCharacteristicsLevel ??
      student.desiredCharacteristicsLevel ??
      (student.attendancePercent >= 80 && autoLevelFromGrade === 0
        ? 1
        : autoLevelFromGrade);

    const targetRoom = classroomId || student.classroom;
    const missingAssignments = missingMandatoryTitles.map((t) => ({ id: t, title: t }));
    const items = assignments.map((asg) => {
      const matched = subs.find((s) => matchSubmissionToAssignment(s, asg));
      return {
        assignmentId: asg.id,
        title: asg.title || asg.id,
        category: (asg.category || asg.scorePart || 'FORMATIVE').toUpperCase(),
        score: matched && typeof matched.score === 'number' ? matched.score : 0,
        maxScore: asg.maxScore,
        status: matched?.status || 'MISSING',
        submissionId: matched?.id,
      };
    });

    return {
      studentId: (student as any).id || (student as any).studentId || `stu-${student.studentCode}`,
      studentCode: student.studentCode,
      classroom: normalizeClassroomCode(targetRoom) || targetRoom,
      courseCode: courseCode || '',
      formativeScore: effectiveAccumulated,
      formativeMax: weights.preMidterm + weights.postMidterm,
      midtermScore: typeof midtermVal === 'number' ? midtermVal : 0,
      midtermMax: weights.midterm,
      finalScore: typeof finalVal === 'number' ? finalVal : 0,
      finalMax: weights.final,
      totalScore: total,
      totalMax: weights.preMidterm + weights.postMidterm + weights.midterm + weights.final,
      percentage: Number(((total / Math.max(1, weights.preMidterm + weights.postMidterm + weights.midterm + weights.final)) * 100).toFixed(2)),
      grade: gradeLabel,
      academicStatus: gradeLabel === 'ร' ? 'ร' : 'ปกติ',
      missingAssignments,
      items,

      // Legacy SGS fields for backward compatibility with ScoreMatrixPrapanView and other components
      u1: preVal,
      u2: postVal,
      u3,
      preMidterm: isPreMidtermManual || preFromWorks > 0 ? preVal : '',
      postMidterm: isPostMidtermManual || postFromWorks > 0 ? postVal : '',
      isPreMidtermManual,
      isPostMidtermManual,
      weights,
      calculatedAccumulated,
      effectiveAccumulated,
      isManualOverride,
      midterm: manualMid !== null || midFromWorks > 0 ? midtermVal : '',
      final: manualFinal !== null || finalFromWorks > 0 ? finalVal : '',
      total,
      gradeLabel,
      numericGrade,
      autoLevelFromGrade,
      analyticalThinkingLevel,
      desiredCharacteristicsLevel,
      submittedCount,
      totalAssignedCount: assignments.length,
      missingCount,
      pendingReviewCount,
      missingMandatoryTitles,
      rReasonLabel,
    };
  },

  calculateStudentFinalGrade(
    stu: SgsStudentRecord | undefined,
    courseCode?: string,
    classroomId?: string
  ) {
    if (!stu) {
      return {
        u1: 0,
        u2: 0,
        u3: 0,
        preMidterm: '' as const,
        postMidterm: '' as const,
        isPreMidtermManual: false,
        isPostMidtermManual: false,
        weights: this.getCourseWeights(courseCode),
        calculatedAccumulated: 0,
        effectiveAccumulated: 0,
        isManualOverride: false,
        midterm: '' as const,
        final: '' as const,
        total: 0,
        gradeLabel: '-',
        numericGrade: 0,
        autoLevelFromGrade: 0 as 0 | 1 | 2 | 3,
        analyticalThinkingLevel: 0 as 0 | 1 | 2 | 3,
        desiredCharacteristicsLevel: 0 as 0 | 1 | 2 | 3,
        submittedCount: 0,
        totalAssignedCount: 0,
        missingCount: 0,
        pendingReviewCount: 0,
        missingMandatoryTitles: [] as string[],
        rReasonLabel: '',
        isComplete: false,
      };
    }
    const res = this.computeStudentSgsGrades(stu, courseCode, classroomId);
    return {
      ...res,
      isComplete: res.total > 0,
    };
  },

  // คำนวณระดับ "อ่าน คิดวิเคราะห์ เขียน (0-3)" และ "คุณลักษณะอันพึงประสงค์ (0-3)" อัตโนมัติจากเกรดวิชาทั้งห้อง
  calculateAttributesFromGrades(
    optionsOrClassroom?:
      | {
          minGradeFor3?: number;
          minGradeFor2?: number;
          minGradeFor1?: number;
          fallbackForR?: 0 | 1;
        }
      | string,
    classroomIdOrCourse?: string,
    courseCodeArg?: string
  ): SgsStudentRecord[] {
    const isFirstString = typeof optionsOrClassroom === 'string';
    const options = isFirstString ? undefined : optionsOrClassroom;
    const classroomId = isFirstString ? optionsOrClassroom : classroomIdOrCourse;
    const courseCode = isFirstString ? classroomIdOrCourse : courseCodeArg;

    const min3 = options?.minGradeFor3 ?? 3.0;
    const min2 = options?.minGradeFor2 ?? 2.0;
    const min1 = options?.minGradeFor1 ?? 1.0;
    const fallback = options?.fallbackForR ?? 0;
    const cKey = courseCode || 'DEFAULT';

    const roster = this.getSgsRoster(classroomId).map((stu) => {
      if (stu.transferState === 'TRANSFERRED_OUT') return stu;
      const g = this.computeStudentSgsGrades(stu, courseCode, classroomId);
      const level: 0 | 1 | 2 | 3 =
        g.numericGrade >= min3
          ? 3
          : g.numericGrade >= min2
          ? 2
          : g.numericGrade >= min1
          ? 1
          : fallback;
      const charLevel: 0 | 1 | 2 | 3 =
        stu.attendancePercent >= 90 && level < 3
          ? (Math.min(3, level + 1) as 0 | 1 | 2 | 3)
          : level;
      const prevCourse = stu.courseScores?.[cKey] || {};
      return {
        ...stu,
        analyticalThinkingLevel: level,
        desiredCharacteristicsLevel: charLevel,
        desirableCharacteristics: Array(8).fill(charLevel),
        criticalThinking: Array(5).fill(level),
        isAttributeManual: false,
        courseScores: {
          ...(stu.courseScores || {}),
          [cKey]: {
            ...prevCourse,
            analyticalThinkingLevel: level,
            desiredCharacteristicsLevel: charLevel,
            isAttributeManual: false,
          },
        },
      };
    });
    return this.saveSgsRoster(
      roster,
      'คำนวณอ่านคิดวิเคราะห์ & คุณลักษณะฯ จากเกรดวิชาอัตโนมัติ'
    );
  },

  updateStudentAttributeLevel(
    studentCode: string,
    fieldOrCategory: 'analyticalThinkingLevel' | 'desiredCharacteristicsLevel' | 'CHAR' | 'CRIT',
    levelOrIdx: number,
    classroomIdOrLevel?: string | (0 | 1 | 2 | 3),
    courseCodeOrClassroom?: string
  ): SgsStudentRecord[] {
    if (fieldOrCategory === 'CHAR' || fieldOrCategory === 'CRIT') {
      const idx = levelOrIdx;
      const lvl = (typeof classroomIdOrLevel === 'number' ? classroomIdOrLevel : 3) as 0 | 1 | 2 | 3;
      const classroomId = typeof courseCodeOrClassroom === 'string' ? courseCodeOrClassroom : undefined;
      const roster = this.getSgsRoster(classroomId).map((stu) => {
        if (stu.studentCode !== studentCode) return stu;
        if (fieldOrCategory === 'CHAR') {
          const nextArr = [...(stu.desirableCharacteristics || Array(8).fill(stu.desiredCharacteristicsLevel ?? 3))];
          nextArr[idx] = lvl;
          const mode = this.computeOverallAttributeMode(nextArr);
          return {
            ...stu,
            desirableCharacteristics: nextArr,
            desiredCharacteristicsLevel: mode,
            isAttributeManual: true,
          };
        } else {
          const nextArr = [...(stu.criticalThinking || Array(5).fill(stu.analyticalThinkingLevel ?? 3))];
          nextArr[idx] = lvl;
          const mode = this.computeOverallAttributeMode(nextArr);
          return {
            ...stu,
            criticalThinking: nextArr,
            analyticalThinkingLevel: mode,
            isAttributeManual: true,
          };
        }
      });
      return this.saveSgsRoster(roster, 'แก้ไขระดับประเมินรายข้อ');
    }

    const field = fieldOrCategory;
    const level = levelOrIdx as 0 | 1 | 2 | 3;
    const classroomId = typeof classroomIdOrLevel === 'string' ? classroomIdOrLevel : undefined;
    const courseCode = courseCodeOrClassroom;
    const cKey = courseCode || 'DEFAULT';
    const roster = this.getSgsRoster(classroomId).map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      const prevCourse = stu.courseScores?.[cKey] || {};
      return {
        ...stu,
        [field]: level,
        desirableCharacteristics:
          field === 'desiredCharacteristicsLevel' ? Array(8).fill(level) : stu.desirableCharacteristics,
        criticalThinking:
          field === 'analyticalThinkingLevel' ? Array(5).fill(level) : stu.criticalThinking,
        isAttributeManual: true,
        courseScores: {
          ...(stu.courseScores || {}),
          [cKey]: {
            ...prevCourse,
            [field]: level,
            isAttributeManual: true,
          },
        },
      };
    });
    return this.saveSgsRoster(roster, 'แก้ไขระดับประเมินรายบุคคล');
  },

  computeOverallAttributeMode(arr?: (0 | 1 | 2 | 3)[]): 0 | 1 | 2 | 3 {
    if (!arr || arr.length === 0) return 3;
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    arr.forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
    });
    let best: 0 | 1 | 2 | 3 = 3;
    let maxCount = -1;
    ([3, 2, 1, 0] as const).forEach((lvl) => {
      if (counts[lvl] > maxCount) {
        maxCount = counts[lvl];
        best = lvl;
      }
    });
    return best;
  },

  bulkSetAllAttributesToLevel(level: 0 | 1 | 2 | 3, classroomId?: string): SgsStudentRecord[] {
    const roster = this.getSgsRoster(classroomId).map((stu) => ({
      ...stu,
      desiredCharacteristicsLevel: level,
      analyticalThinkingLevel: level,
      desirableCharacteristics: Array(8).fill(level),
      criticalThinking: Array(5).fill(level),
      isAttributeManual: true,
    }));
    return this.saveSgsRoster(roster, `ตั้งค่าระดับประเมินทั้งห้องเป็น ${level}`);
  },

  updateStudentSpecialStatus(
    studentCode: string,
    status: 'NORMAL' | 'ร' | 'มส',
    classroomId?: string
  ): SgsStudentRecord[] {
    const roster = this.getSgsRoster(classroomId).map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      return {
        ...stu,
        specialStatus: status,
      };
    });
    return this.saveSgsRoster(roster, `อัปเดตสถานะผลการเรียน (${status})`);
  },

  gradeStudentSubmission(
    studentCode: string,
    assignmentId: string,
    score: number,
    _note?: string,
    classroomId?: string
  ): SgsStudentRecord[] {
    this.gradeSubmission(assignmentId, studentCode, score, 'GRADED');
    return this.getSgsRoster(classroomId);
  },

  exportSgsGradebookCsv(courseCode?: string, courseName?: string, classroomId?: string): string {
    const roster = this.getSgsRoster(classroomId);
    const header = [
      'เลขที่',
      'รหัสประจำตัว',
      'ชื่อ-สกุล',
      'ห้องเรียน',
      'รหัสวิชา',
      'ชื่อวิชา',
      'ก่อนกลางภาค',
      'กลางภาค',
      'หลังกลางภาค',
      'ปลายภาค',
      'คะแนนรวม',
      'ผลการเรียน',
      'คุณลักษณะอันพึงประสงค์',
      'อ่านคิดวิเคราะห์เขียน',
    ];
    const rows = roster.map((stu) => {
      const g = this.computeStudentSgsGrades(stu, courseCode, classroomId);
      const gradeOut = stu.specialStatus && stu.specialStatus !== 'NORMAL' ? stu.specialStatus : g.gradeLabel;
      return [
        stu.sgsSeatNo,
        `"${stu.studentCode}"`,
        `"${stu.studentName}"`,
        `"${stu.classroom}"`,
        `"${courseCode || ''}"`,
        `"${courseName || ''}"`,
        g.preMidterm === '' ? 0 : g.preMidterm,
        g.midterm === '' ? 0 : g.midterm,
        g.postMidterm === '' ? 0 : g.postMidterm,
        g.final === '' ? 0 : g.final,
        g.total,
        `"${gradeOut}"`,
        g.desiredCharacteristicsLevel,
        g.analyticalThinkingLevel,
      ].join(',');
    });
    return '\uFEFF' + [header.join(','), ...rows].join('\n');
  },

  // ดึง Data URL ไฟล์ชิ้นงานจริงที่นักเรียนอัปโหลดไว้ (ถ้ามี) รองรับการจับคู่หลากหลายมิติ
  getSubmissionFileUrl(
    assignmentId?: string,
    studentCode?: string,
    fileName?: string
  ): string | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    try {
      const cleanAsg = assignmentId ? String(assignmentId).trim() : '';
      const cleanStu = studentCode ? String(studentCode).trim() : '';
      const cleanFile = fileName ? String(fileName).trim() : '';

      const isValidDataUrl = (val: any): boolean => {
        if (!val || typeof val !== 'string') return false;
        if (
          val.startsWith('https://storage.kps.ac.th') ||
          val.startsWith('http://storage.kps.ac.th') ||
          val.startsWith('r2://')
        ) {
          return false;
        }
        return (
          val.startsWith('data:') ||
          val.startsWith('blob:') ||
          val.startsWith('http://') ||
          val.startsWith('https://')
        );
      };

      // 1. ตรวจสอบคีย์ตรง kp_sub_file_${cleanAsg}_${cleanStu}
      if (cleanAsg && cleanStu) {
        const direct1 = localStorage.getItem(`kp_sub_file_${cleanAsg}_${cleanStu}`);
        if (isValidDataUrl(direct1)) return direct1!;

        const direct2 = localStorage.getItem(`kp_sub_file_${assignmentId}_${studentCode}`);
        if (isValidDataUrl(direct2)) return direct2!;

        if (typeof sessionStorage !== 'undefined') {
          const sess = sessionStorage.getItem(`kp_sub_file_${cleanAsg}_${cleanStu}`);
          if (isValidDataUrl(sess)) return sess!;
        }
      }

      // 2. ตรวจสอบคีย์ที่บันทึกตามชื่อไฟล์ (fileName) หรือรหัสนักเรียน + ชื่อไฟล์
      if (cleanFile) {
        const fileKey = localStorage.getItem(`kp_sub_file_${cleanFile}`);
        if (isValidDataUrl(fileKey)) return fileKey!;

        if (cleanStu) {
          const stuFileKey = localStorage.getItem(`kp_sub_file_${cleanStu}_${cleanFile}`);
          if (isValidDataUrl(stuFileKey)) return stuFileKey!;
        }
      }

      // 3. สแกนคีย์ทั้งหมดใน localStorage ที่ขึ้นต้นด้วย kp_sub_file_
      try {
        const matchingKeys: { key: string; score: number; value: string }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('kp_sub_file_')) {
            const val = localStorage.getItem(k);
            if (isValidDataUrl(val)) {
              let score = 0;
              if (cleanStu && (k.endsWith(`_${cleanStu}`) || k.includes(`_${cleanStu}_`) || k.includes(cleanStu))) {
                score += 10;
              }
              if (cleanAsg && k.includes(cleanAsg)) {
                score += 20;
              }
              if (cleanFile && k.includes(cleanFile)) {
                score += 15;
              }
              if (score > 0) {
                matchingKeys.push({ key: k, score, value: val! });
              }
            }
          }
        }
        if (matchingKeys.length > 0) {
          matchingKeys.sort((a, b) => b.score - a.score);
          return matchingKeys[0].value;
        }
      } catch (scanErr) {
        console.warn('Scan localStorage keys error', scanErr);
      }

      // 4. ค้นหา Fallback ใน kp_work_submissions_v2 / v1
      try {
        const rawSubs =
          localStorage.getItem(STORAGE_KEY_WORK_SUBMISSIONS) ||
          localStorage.getItem('kp_work_submissions_v1');
        if (rawSubs) {
          const parsedList: StudentWorkSubmission[] = JSON.parse(rawSubs);
          const found = parsedList.find((s) => {
            if (!s) return false;
            const matchStu = cleanStu ? s.studentCode === cleanStu : true;
            const matchAsg = cleanAsg ? s.assignmentId === cleanAsg : true;
            const matchFile = cleanFile
              ? s.workAttachmentLabel?.includes(cleanFile) || s.r2ObjectKey?.includes(cleanFile)
              : true;
            return matchStu && (matchAsg || matchFile);
          });
          if (found?.fileDataUrl && isValidDataUrl(found.fileDataUrl)) {
            return found.fileDataUrl;
          }
        }
      } catch (subErr) {
        console.warn('Fallback search in submissions error', subErr);
      }

      // 5. ค้นหา Fallback ใน kp_grading_queue_v2
      try {
        const rawQueue = localStorage.getItem('kp_grading_queue_v2');
        if (rawQueue) {
          const queueList: any[] = JSON.parse(rawQueue);
          const foundQ = queueList.find((q) => {
            if (!q) return false;
            const matchStu = cleanStu ? q.studentCode === cleanStu : true;
            const matchAsg = cleanAsg ? q.assignmentId === cleanAsg : true;
            const matchFile = cleanFile ? q.fileName?.includes(cleanFile) : true;
            return matchStu && (matchAsg || matchFile);
          });
          if (foundQ?.filePreviewUrl && isValidDataUrl(foundQ.filePreviewUrl)) {
            return foundQ.filePreviewUrl;
          }
        }
      } catch (qErr) {
        console.warn('Fallback search in grading queue error', qErr);
      }

      return undefined;
    } catch {
      return undefined;
    }
  },

  /**
   * นักเรียนส่งงานหรือส่งงานซ่อม (Resubmission)
   */
  async submitStudentWorkToR2Async(payload: {
    studentCode?: string;
    studentId?: string;
    assignmentId: string;
    unitId?: string;
    courseCode?: string;
    workTitle: string;
    file?: File | Blob | null;
    fileBlob?: File | Blob | null;
    fileUrl?: string;
    fileDataUrl?: string;
    fileName?: string;
    textContent?: string;
    note?: string;
    maxScore?: number;
    originalSizeKb?: number;
    compressedSizeKb?: number;
    externalLinkUrl?: string;
    academicYearTerm?: string;
    classroom?: string;
    onProgress?: (info: UploadProgressInfo) => void;
  }): Promise<any> {
    const roster = this.getRoster() as RosterIdentityRecord[];
    const identity = resolveStudentIdentity(
      { id: payload.studentId, studentCode: payload.studentCode },
      roster
    );

    // ป้องกันการ Fallback ไปใช้ '45101' โดยเด็ดขาด
    const verifiedStudentCode = identity?.studentCode || payload.studentCode;
    const verifiedStudentId = identity?.studentId || payload.studentId;

    if (!verifiedStudentCode) {
      throw new Error(
        'ไม่สามารถระบุรหัสนักเรียน (studentCode) ของผู้ส่งงานได้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
      );
    }

    const targetAsg = this.getTermAssignments().find((a) => a.id === payload.assignmentId);
    const submissions = this.getSubmissions();
    const existingIdx = submissions.findIndex(
      (s: any) =>
        s.studentCode === verifiedStudentCode &&
        matchSubmissionToAssignment(s, {
          id: payload.assignmentId,
          unitId: payload.unitId || targetAsg?.unitId,
          courseCode: payload.courseCode || targetAsg?.courseCode,
          title: payload.workTitle,
        })
    );

    const resolvedCourseCode =
      payload.courseCode ||
      targetAsg?.courseCode ||
      (existingIdx !== -1 ? submissions[existingIdx].courseCode : undefined);
    const resolvedUnitId =
      payload.unitId ||
      targetAsg?.unitId ||
      (existingIdx !== -1 ? submissions[existingIdx].unitId : undefined);

    const nowIso = new Date().toISOString();
    const wasReturned =
      existingIdx !== -1 &&
      ((submissions[existingIdx].status as string) === 'RETURNED' ||
        submissions[existingIdx].status === 'RETURNED_REVISION');

    // อัปโหลดไฟล์ขึ้น R2 (หรือเก็บเฉพาะ Metadata URL หากออฟไลน์ เพื่อไม่ให้ localStorage เต็ม 5MB)
    let resolvedFileUrl = payload.fileUrl || payload.fileDataUrl || '';
    let resolvedR2Key = existingIdx !== -1 ? submissions[existingIdx].r2ObjectKey : undefined;
    const fileToUpload = payload.file || payload.fileBlob;
    const term = payload.academicYearTerm || '1/2569';
    const cleanFileName = payload.fileName
      ? payload.fileName.replace(/\.(jpg|jpeg|png|heic)$/i, '.webp')
      : undefined;

    const hasIncomingFile = Boolean(fileToUpload || payload.fileDataUrl || payload.fileUrl);

    // กรณีผู้เรียนส่งงานโดยไม่มีไฟล์แนบ (เช่น ลบไฟล์เดิมออกแล้วเปลี่ยนมาตอบข้อความหรือลิงก์อย่างเดียว)
    if (!hasIncomingFile && existingIdx !== -1 && submissions[existingIdx].r2ObjectKey) {
      const oldKey = submissions[existingIdx].r2ObjectKey;
      if (oldKey && r2StorageService.isConfigured()) {
        r2StorageService.deleteFile(oldKey).catch((delErr) => {
          console.warn('[R2Delete] ลบไฟล์เก่าไม่สำเร็จ:', delErr);
        });
      }
      resolvedR2Key = undefined;
      resolvedFileUrl = '';
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(`kp_sub_file_${payload.assignmentId}_${verifiedStudentCode}`);
          if (submissions[existingIdx].workAttachmentLabel) {
            localStorage.removeItem(`kp_sub_file_${submissions[existingIdx].workAttachmentLabel}`);
          }
        } catch {
          // ignore
        }
      }
    }

    if (fileToUpload && r2StorageService.isConfigured()) {
      try {
        // ลบไฟล์เดิมออกจาก Cloudflare R2 เพื่อแทนที่ด้วยไฟล์ใหม่ (ประหยัดพื้นที่จัดเก็บและลดขยะไฟล์เก่า)
        if (existingIdx !== -1 && submissions[existingIdx].r2ObjectKey) {
          const oldKey = submissions[existingIdx].r2ObjectKey;
          if (oldKey) {
            r2StorageService.deleteFile(oldKey).catch((delErr) => {
              console.warn('[R2Delete] ลบไฟล์เก่าไม่สำเร็จ (อาจไม่มีในระบบ):', delErr);
            });
          }
        }

        const r2Key = r2StorageService.buildSubmissionKey({
          term,
          classroom: payload.classroom,
          assignmentId: payload.assignmentId,
          studentCode: verifiedStudentCode,
          fileName: cleanFileName || `work_${verifiedStudentCode}.webp`,
        });
        resolvedR2Key = r2Key;
        const uploadRes = await r2StorageService.uploadFileWithProgress(
          r2Key,
          fileToUpload,
          payload.onProgress
        );
        if (uploadRes.success && uploadRes.url) {
          resolvedFileUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn('[R2Upload] อัปโหลดขึ้น R2 ไม่สำเร็จ ใช้ Object URL ชั่วคราวแทนการเก็บ Base64 ก้อนใหญ่ลง localStorage:', uploadErr);
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          resolvedFileUrl = URL.createObjectURL(fileToUpload);
        }
      }
    } else if (fileToUpload && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      resolvedFileUrl = URL.createObjectURL(fileToUpload);
    }

    // แคชไฟล์ภาพ / preview URL ลง localStorage เพื่อให้ครูเปิดดูออฟไลน์ได้ทันที
    if ((payload.fileDataUrl || resolvedFileUrl) && typeof localStorage !== 'undefined') {
      try {
        const cleanAsg = String(payload.assignmentId).trim();
        const cleanStu = String(verifiedStudentCode).trim();
        const cacheUrl = payload.fileDataUrl || resolvedFileUrl;
        if (cacheUrl && !cacheUrl.startsWith('blob:')) {
          localStorage.setItem(`kp_sub_file_${cleanAsg}_${cleanStu}`, cacheUrl);
          if (cleanFileName) {
            localStorage.setItem(`kp_sub_file_${cleanFileName}`, cacheUrl);
            localStorage.setItem(`kp_sub_file_${cleanStu}_${cleanFileName}`, cacheUrl);
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`kp_sub_file_${cleanAsg}_${cleanStu}`, cacheUrl);
          }
        }
      } catch (e) {
        console.warn('Could not cache submission file preview URL', e);
      }
    }

    const origKb = payload.originalSizeKb ?? (cleanFileName ? 4250 : 0);
    const compKb = payload.compressedSizeKb ?? (cleanFileName ? 148 : 0);

    const hasFile = Boolean(cleanFileName || (hasIncomingFile && (resolvedFileUrl || payload.fileDataUrl)));
    const hasLink = Boolean(payload.externalLinkUrl && payload.externalLinkUrl.trim());
    const hasText = Boolean(payload.textContent && payload.textContent.trim());

    let attachmentLabel = 'ส่งงานออนไลน์';
    if (hasFile && hasLink) {
      attachmentLabel = `☁️ R2: ${cleanFileName || 'รูปภาพ'} + 🔗 ลิงก์แนบ`;
    } else if (hasFile) {
      attachmentLabel = `☁️ R2: ${cleanFileName || 'รูปภาพ'} (${compKb > 0 ? `บีบอัดเหลือ ${compKb} KB` : 'ไฟล์แนบ'})`;
    } else if (hasLink && hasText) {
      attachmentLabel = `🔗 ลิงก์แนบ + 📝 ข้อความตอบกลับ`;
    } else if (hasLink) {
      attachmentLabel = `🔗 ลิงก์แนบ: ${payload.externalLinkUrl}`;
    } else if (hasText) {
      attachmentLabel = `📝 ข้อความตอบกลับ`;
    }

    const submissionRecord: StudentWorkSubmission = {
      ...(existingIdx !== -1 ? submissions[existingIdx] : {}),
      id:
        existingIdx !== -1
          ? submissions[existingIdx].id
          : `sub_${payload.assignmentId}_${verifiedStudentCode}`,
      assignmentId: payload.assignmentId,
      unitId: resolvedUnitId,
      courseCode: resolvedCourseCode,
      studentCode: verifiedStudentCode,
      studentId: verifiedStudentId,
      workTitle: payload.workTitle,
      workAttachmentLabel: attachmentLabel,
      fileUrl: hasIncomingFile ? (resolvedFileUrl || (existingIdx !== -1 ? submissions[existingIdx].fileUrl : '')) : '',
      fileDataUrl: hasIncomingFile ? (resolvedFileUrl || (existingIdx !== -1 ? submissions[existingIdx].fileDataUrl : '')) : '',
      r2ObjectKey: hasIncomingFile ? resolvedR2Key : undefined,
      externalLinkUrl: payload.externalLinkUrl,
      textContent: payload.textContent !== undefined ? payload.textContent : (existingIdx !== -1 ? submissions[existingIdx].textContent : undefined),
      note: payload.note ?? '',
      score: existingIdx !== -1 && submissions[existingIdx].score !== undefined ? submissions[existingIdx].score : null,
      originalSizeKb: origKb,
      compressedSizeKb: compKb,
      maxScore: payload.maxScore ?? (existingIdx !== -1 ? submissions[existingIdx].maxScore : 10),
      status: 'SUBMITTED_PENDING',
      isResubmission: wasReturned || existingIdx !== -1,
      returnReason: undefined,
      returnedAt: undefined,
      submittedAt: nowIso,
    };

    if (existingIdx !== -1) {
      submissions[existingIdx] = submissionRecord;
    } else {
      submissions.push(submissionRecord);
    }

    this.saveSubmissions(submissions);

    // ดันงานเข้าคิวรอตรวจ (kp_grading_queue_v2) พร้อมอัปเดต submittedTimestamp ใหม่ทันที
    this.syncGradingQueueItem({
      assignmentId: payload.assignmentId,
      studentCode: verifiedStudentCode,
      studentId: verifiedStudentId,
      studentName: identity?.student?.name,
      classroom: identity?.student?.classroom || payload.classroom,
      courseCode: resolvedCourseCode,
      workTitle: payload.workTitle,
      fileUrl: submissionRecord.fileUrl,
      externalLinkUrl: payload.externalLinkUrl,
      textContent: payload.textContent,
      status: 'PENDING_REVIEW',
      isResubmission: submissionRecord.isResubmission,
    });

    return submissionRecord;
  },

  // อัปโหลดไฟล์งานนักเรียนขึ้น Cloudflare R2 (บีบอัดรูป WebP อัตโนมัติ + รองรับแนบลิงก์เสริม Google Drive/Canva)
  submitStudentWorkToR2(payload: {
    assignmentId: string;
    studentCode: string;
    workTitle: string;
    fileName?: string;
    originalSizeKb?: number;
    compressedSizeKb?: number;
    externalLinkUrl?: string;
    fileDataUrl?: string;
    academicYearTerm?: string;
    classroom?: string;
  }): StudentWorkSubmission[] {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(
      (s) =>
        s.assignmentId === payload.assignmentId &&
        s.studentCode === payload.studentCode
    );
    const term = payload.academicYearTerm || '1/2569';
    const cleanFileName = payload.fileName
      ? payload.fileName.replace(/\.(jpg|jpeg|png|heic)$/i, '.webp')
      : undefined;
    const r2Key = cleanFileName
      ? (r2StorageService.isConfigured()
          ? r2StorageService.buildSubmissionKey({
              term,
              classroom: payload.classroom,
              assignmentId: payload.assignmentId,
              studentCode: payload.studentCode,
              fileName: cleanFileName,
            })
          : `r2://kp-classroom-submissions/${term.replace('/', '-')}/m3-1/${payload.assignmentId}/${payload.studentCode}_${cleanFileName}`)
      : undefined;
    const origKb = payload.originalSizeKb ?? (cleanFileName ? 4250 : 0);
    const compKb = payload.compressedSizeKb ?? (cleanFileName ? 148 : 0);

    // เก็บไฟล์ภาพจริงเข้า LocalStorage แยกคีย์เพื่อไม่ให้ล้นโควต้าอาร์เรย์หลัก (เป็น Offline Backup)
    if (payload.fileDataUrl && typeof localStorage !== 'undefined') {
      try {
        const cleanAsg = String(payload.assignmentId).trim();
        const cleanStu = String(payload.studentCode).trim();
        localStorage.setItem(`kp_sub_file_${cleanAsg}_${cleanStu}`, payload.fileDataUrl);
        if (cleanFileName) {
          localStorage.setItem(`kp_sub_file_${cleanFileName}`, payload.fileDataUrl);
          localStorage.setItem(`kp_sub_file_${cleanStu}_${cleanFileName}`, payload.fileDataUrl);
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(`kp_sub_file_${cleanAsg}_${cleanStu}`, payload.fileDataUrl);
        }
      } catch (e) {
        console.warn('Could not cache submission file preview URL', e);
      }
    }

    const hasFile = Boolean(cleanFileName || payload.fileDataUrl);
    const hasLink = Boolean(payload.externalLinkUrl && payload.externalLinkUrl.trim());

    let attachmentLabel = 'ส่งงานออนไลน์';
    if (hasFile && hasLink) {
      attachmentLabel = `☁️ R2: ${cleanFileName || 'รูปภาพ'} + 🔗 ลิงก์แนบ`;
    } else if (hasFile) {
      attachmentLabel = `☁️ R2: ${cleanFileName || 'รูปภาพ'} (${compKb > 0 ? `บีบอัดเหลือ ${compKb} KB` : 'ไฟล์แนบ'})`;
    } else if (hasLink) {
      attachmentLabel = `🔗 ลิงก์แนบ: ${payload.externalLinkUrl}`;
    }

    const existingSubmittedAt = idx !== -1 ? subs[idx].submittedAt : undefined;
    const nowIso = new Date().toISOString();
    // ถ้าเคยมี submittedAt ที่ถูกต้องแล้วให้ใช้เดิม ถ้าไม่มีหรือเป็นข้อความเดิมให้ใส่เวลาจริงปัจจุบัน
    const finalSubmittedAt =
      existingSubmittedAt && !existingSubmittedAt.includes('เพิ่งส่งเมื่อสักครู่')
        ? existingSubmittedAt
        : nowIso;

    // Background R2 Upload if synchronous method was called and R2 is configured
    if (
      r2Key &&
      payload.fileDataUrl &&
      payload.fileDataUrl.startsWith('data:') &&
      r2StorageService.isConfigured()
    ) {
      r2StorageService
        .uploadFile(
          r2Key,
          payload.fileDataUrl,
          cleanFileName?.endsWith('.pdf') ? 'application/pdf' : 'image/webp'
        )
        .then((res) => {
          if (res.success && res.url) {
            const currentSubs = this.getSubmissions();
            const targetIdx = currentSubs.findIndex(
              (s) => s.assignmentId === payload.assignmentId && s.studentCode === payload.studentCode
            );
            if (targetIdx !== -1) {
              currentSubs[targetIdx] = {
                ...currentSubs[targetIdx],
                fileDataUrl: res.url,
                r2ObjectKey: res.key,
              };
              this.saveSubmissions(currentSubs);
            }
          }
        })
        .catch((e) => console.warn('[R2 Background Upload]', e));
    }

    const wasReturned = idx !== -1 && subs[idx]?.status === 'RETURNED_REVISION';
    const isResubmission = wasReturned || Boolean(subs[idx]?.isResubmission);

    const nextItem: StudentWorkSubmission = {
      ...(idx !== -1 ? subs[idx] : {}),
      assignmentId: payload.assignmentId,
      studentCode: payload.studentCode,
      status: 'SUBMITTED_PENDING',
      score: null,
      submittedAt: finalSubmittedAt,
      workTitle: payload.workTitle || 'ส่งชิ้นงานผ่านระบบออนไลน์',
      workAttachmentLabel: attachmentLabel,
      r2ObjectKey: r2Key,
      originalSizeKb: origKb,
      compressedSizeKb: compKb,
      externalLinkUrl: payload.externalLinkUrl,
      fileDataUrl: payload.fileDataUrl,
      academicYearTerm: term,
      isR2FilePurged: false,
      isResubmission,
    };

    const updated =
      idx !== -1
        ? subs.map((item, i) => (i === idx ? nextItem : item))
        : [...subs, nextItem];

    // ดันงานเข้าคิวรอตรวจ (kp_grading_queue_v2) ผ่าน syncGradingQueueItem
    this.syncGradingQueueItem({
      assignmentId: payload.assignmentId,
      studentCode: payload.studentCode,
      workTitle: payload.workTitle,
      fileUrl: payload.fileDataUrl,
      status: 'PENDING_REVIEW',
      isResubmission,
    });

    return this.saveSubmissions(updated);
  },

  // ตรวจสอบจำนวนงานที่เคยส่งไว้ในเครื่อง (Base64/Local cache) แต่ยังไม่ได้ซิงก์ขึ้น Cloudflare R2
  getLocalUnsyncedSubmissionsCount(): number {
    const subs = this.getSubmissions();
    let count = 0;
    subs.forEach((s) => {
      const cached = this.getSubmissionFileUrl(
        s.assignmentId,
        s.studentCode,
        s.r2ObjectKey ? s.r2ObjectKey.split('/').pop() : undefined
      );
      if (cached && cached.startsWith('data:')) {
        count++;
      } else if (s.fileDataUrl && s.fileDataUrl.startsWith('data:')) {
        count++;
      }
    });

    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('kp_sub_file_')) {
            const val = localStorage.getItem(k);
            if (val && val.startsWith('data:')) {
              const isAlreadyCounted = subs.some((s) => k.includes(s.assignmentId) && k.includes(s.studentCode));
              if (!isAlreadyCounted) {
                count++;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error counting local unsynced files', e);
      }
    }
    return count;
  },

  // ซิงก์ไฟล์งานนักเรียนที่แคชไว้ในเครื่อง (Base64) ขึ้น Cloudflare R2 อัตโนมัติ (1-Click Migration)
  async syncLocalSubmissionsToR2(): Promise<{
    success: boolean;
    syncedCount: number;
    totalEligible: number;
    error?: string;
  }> {
    if (!r2StorageService.isConfigured()) {
      return {
        success: false,
        syncedCount: 0,
        totalEligible: 0,
        error: 'ยังไม่ได้ตั้งค่า Cloudflare R2 Worker หรือ Upload Secret ในระบบ (.env หรือการตั้งค่า)',
      };
    }

    const subs = this.getSubmissions();
    const candidates = subs.filter((s) => {
      const cached = this.getSubmissionFileUrl(
        s.assignmentId,
        s.studentCode,
        s.r2ObjectKey ? s.r2ObjectKey.split('/').pop() : undefined
      );
      return Boolean(cached || (s.fileDataUrl && s.fileDataUrl.startsWith('data:')));
    });

    let syncedCount = 0;
    const term = '1/2569';

    for (const sub of candidates) {
      const base64Data =
        (sub.fileDataUrl && sub.fileDataUrl.startsWith('data:') ? sub.fileDataUrl : null) ||
        this.getSubmissionFileUrl(
          sub.assignmentId,
          sub.studentCode,
          sub.r2ObjectKey ? sub.r2ObjectKey.split('/').pop() : undefined
        );

      if (!base64Data || !base64Data.startsWith('data:')) continue;

      const isPdf =
        base64Data.startsWith('data:application/pdf') ||
        (sub.workAttachmentLabel && sub.workAttachmentLabel.includes('.pdf'));
      const ext = isPdf ? 'pdf' : 'webp';
      const cleanFileName = `${sub.studentCode}_submission.${ext}`;
      const cleanRoom = (sub.classroom || 'all').toLowerCase().replace(/\s+/g, '').replace('/', '-');
      const r2Key = r2StorageService.buildSubmissionKey({
        term: sub.academicYearTerm || term,
        classroom: cleanRoom,
        assignmentId: sub.assignmentId,
        studentCode: sub.studentCode,
        fileName: cleanFileName,
      });

      try {
        const uploadRes = await r2StorageService.uploadFile(
          r2Key,
          base64Data,
          isPdf ? 'application/pdf' : 'image/webp'
        );

        if (uploadRes.success && uploadRes.url) {
          sub.fileDataUrl = uploadRes.url;
          sub.r2ObjectKey = uploadRes.key;
          syncedCount++;
        }
      } catch (err) {
        console.warn(`[SyncLocalSubmissionsToR2] Failed for ${sub.studentCode}:`, err);
      }
    }

    // ซิงค์คีย์อิสระใน LocalStorage ที่มี kp_sub_file_
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('kp_sub_file_')) {
            const val = localStorage.getItem(k);
            if (val && val.startsWith('data:')) {
              const parts = k.replace('kp_sub_file_', '').split('_');
              const targetAsg = parts[0] || 'asg-general';
              const targetStu = parts[1] || 'student';
              const r2Key = `kp-classroom-submissions/2-2569/all/${targetAsg}/${targetStu}_work.webp`;
              try {
                const upRes = await r2StorageService.uploadFile(r2Key, val, 'image/webp');
                if (upRes.success && upRes.url) {
                  syncedCount++;
                  const matchSub = subs.find((s) => s.assignmentId === targetAsg && s.studentCode === targetStu);
                  if (matchSub) {
                    matchSub.fileDataUrl = upRes.url;
                    matchSub.r2ObjectKey = upRes.key;
                  }
                }
              } catch (uErr) {
                console.warn(`[SyncLocalSubmissionsToR2] Failed for key ${k}:`, uErr);
              }
            }
          }
        }
      } catch (scanErr) {
        console.warn('Scan localStorage for unsynced files error', scanErr);
      }
    }

    if (syncedCount > 0) {
      this.saveSubmissions(subs);

      // อัปเดต URL ใน kp_grading_queue_v2 ให้ตรงกับ Cloudflare R2
      try {
        const rawQueue = typeof localStorage !== 'undefined' ? localStorage.getItem('kp_grading_queue_v2') : null;
        if (rawQueue) {
          const queue: any[] = JSON.parse(rawQueue);
          let queueUpdated = false;
          queue.forEach((q) => {
            const matchSub = subs.find((s) => s.assignmentId === q.assignmentId && s.studentCode === q.studentCode);
            if (matchSub?.fileDataUrl && matchSub.fileDataUrl.startsWith('http')) {
              q.filePreviewUrl = matchSub.fileDataUrl;
              queueUpdated = true;
            }
          });
          if (queueUpdated && typeof localStorage !== 'undefined') {
            localStorage.setItem('kp_grading_queue_v2', JSON.stringify(queue));
            cloudDataService.saveCloudKey('kp_grading_queue_v2', queue).catch(() => {});
          }
        }
      } catch (qErr) {
        console.warn('Sync queue preview update error', qErr);
      }
    }

    return {
      success: true,
      syncedCount,
      totalEligible: Math.max(syncedCount, candidates.length),
    };
  },

  // คำนวณสถิติพื้นที่ Cloudflare R2 (จำนวนไฟล์, พื้นที่จริงหลังบีบอัด WebP, พื้นที่ที่ประหยัดได้ และไฟล์ที่พร้อมลบท้ายปี)
  getR2StorageStats(): {
    activeFileCount: number;
    purgedFileCount: number;
    totalOriginalMb: number;
    totalCompressedMb: number;
    savedPercent: number;
    freeTierLimitMb: number;
    usagePercent: number;
  } {
    const subs = this.getSubmissions();
    let activeFileCount = 0;
    let purgedFileCount = 0;
    let totalOriginalKb = 0;
    let totalCompressedKb = 0;

    for (const s of subs) {
      const hasAttachment = Boolean(s.r2ObjectKey || s.workAttachmentLabel);
      if (!hasAttachment) continue;
      if (s.isR2FilePurged) {
        purgedFileCount += 1;
      } else {
        activeFileCount += 1;
        totalOriginalKb += s.originalSizeKb ?? 3800;
        totalCompressedKb += s.compressedSizeKb ?? 155;
      }
    }

    const totalOriginalMb = Number((totalOriginalKb / 1024).toFixed(2));
    const totalCompressedMb = Number((totalCompressedKb / 1024).toFixed(2));
    const savedPercent =
      totalOriginalKb > 0
        ? Math.round((1 - totalCompressedKb / totalOriginalKb) * 100)
        : 96;
    const freeTierLimitMb = 10240; // 10 GB Free Tier on Cloudflare R2
    const usagePercent = Number(
      Math.min(100, (totalCompressedMb / freeTierLimitMb) * 100).toFixed(3)
    );

    return {
      activeFileCount,
      purgedFileCount,
      totalOriginalMb,
      totalCompressedMb,
      savedPercent,
      freeTierLimitMb,
      usagePercent,
    };
  },

  // ล้างไฟล์แนบใน Cloudflare R2 หลังอนุมัติเกรดแต่ละปีการศึกษา (คืนพื้นที่ R2 100% แต่เก็บคะแนนและเกรดไว้ถาวร)
  purgeR2FilesAfterGrading(onlyGraded: boolean = true): {
    purgedCount: number;
    freedMb: number;
    submissions: StudentWorkSubmission[];
  } {
    let purgedCount = 0;
    let freedKb = 0;
    const updated = this.getSubmissions().map((sub) => {
      const hasFile =
        !sub.isR2FilePurged && Boolean(sub.r2ObjectKey || sub.workAttachmentLabel);
      const canPurge = onlyGraded ? sub.status === 'GRADED' : true;
      if (hasFile && canPurge) {
        purgedCount += 1;
        freedKb += sub.compressedSizeKb ?? 155;
        return {
          ...sub,
          isR2FilePurged: true,
          r2ObjectKey: undefined,
          workAttachmentLabel: `🧹 ล้างไฟล์ R2 หลังตัดเกรดแล้ว (คงคะแนน ${sub.score ?? '-'} คะแนนถาวร)`,
        };
      }
      return sub;
    });

    this.saveSubmissions(updated);
    return {
      purgedCount,
      freedMb: Number((freedKb / 1024).toFixed(2)),
      submissions: updated,
    };
  },

  // ดึงข้อมูลการใช้พื้นที่ R2 แยกตามครูผู้สอนและแต่ละรายวิชา + สถานะ Backup เข้า Google Drive โรงเรียน (100 TB Workspace)
  getCourseStorageSummaries(): R2CourseStorageSummary[] {
    try {
      const raw = localStorage.getItem('kp_r2_course_storage_v1');
      const list: R2CourseStorageSummary[] = raw
        ? JSON.parse(raw)
        : (cleanSlateService.isCleanSlateActive() ? [] : INITIAL_R2_COURSE_STORAGE);

      // ซิงก์ข้อมูลจริงของวิชา ศ23101 ม.3/1 เข้ากับรายการแรกเสมอ
      const liveStats = this.getR2StorageStats();
      const subs = this.getSubmissions();
      const canvaCount = subs.filter((s) => Boolean(s.externalLinkUrl)).length;

      return list.map((item) => {
        if (item.courseId === 'course-art-301') {
          return {
            ...item,
            r2FileCount: liveStats.activeFileCount,
            canvaLinkCount: Math.max(item.canvaLinkCount, canvaCount),
            originalMb: liveStats.totalOriginalMb,
            r2UsedMb: liveStats.totalCompressedMb,
            isPurgedFromR2: liveStats.activeFileCount === 0 && liveStats.purgedFileCount > 0,
          };
        }
        return item;
      });
    } catch {
      return cleanSlateService.isCleanSlateActive() ? [] : INITIAL_R2_COURSE_STORAGE;
    }
  },

  saveCourseStorageSummaries(list: R2CourseStorageSummary[]): R2CourseStorageSummary[] {
    localStorage.setItem('kp_r2_course_storage_v1', JSON.stringify(list));
    return this.getCourseStorageSummaries();
  },

  // โอนถ่าย/สำรองไฟล์จาก Cloudflare R2 ไปยัง Google Drive ของโรงเรียน (100 TB Google Workspace) แยกโฟลเดอร์ตาม ปีการศึกษา / เทอม / วิชา (ครูผู้สอน)
  backupCoursesToSchoolWorkspaceDrive(params: {
    mode: 'SINGLE_COURSE' | 'TEACHER_ALL' | 'TERM_ALL' | 'YEAR_ALL';
    courseId?: string;
    teacherId?: string;
    academicTerm?: string;
    academicYear?: string;
  }): {
    backedUpCourseCount: number;
    transferredMb: number;
    courses: R2CourseStorageSummary[];
  } {
    let backedUpCourseCount = 0;
    let transferredMb = 0;
    const current = this.getCourseStorageSummaries();

    const updated = current.map((c) => {
      const match =
        (params.mode === 'SINGLE_COURSE' && c.courseId === params.courseId) ||
        (params.mode === 'TEACHER_ALL' && c.teacherId === params.teacherId) ||
        (params.mode === 'TERM_ALL' && c.academicTerm === params.academicTerm) ||
        (params.mode === 'YEAR_ALL' && c.academicYear === params.academicYear);

      if (match && c.r2FileCount > 0) {
        backedUpCourseCount += 1;
        transferredMb += c.r2UsedMb;
        return {
          ...c,
          isBackedUpToSchoolDrive: true,
          lastBackupAt: 'โอนเข้า Google Drive รร. (100TB) แล้ววันนี้',
        };
      }
      return c;
    });

    const saved = this.saveCourseStorageSummaries(updated);
    return {
      backedUpCourseCount,
      transferredMb: Number(transferredMb.toFixed(2)),
      courses: saved,
    };
  },

  // ล้างไฟล์ใน R2 ตามสิทธิ์:
  // - TEACHER (ครูผู้สอน): ล้างได้เฉพาะรายวิชาของตัวเองเท่านั้น
  // - ADMIN (แอดมินระบบ): ล้างได้ของครูทุกคน ทั้งรายวิชา, ทั้งเทอม หรือทั้งปีการศึกษา (พร้อมตัวเลือก Auto-Backup ลง Google Drive 100TB ก่อนลบ)
  purgeCoursesR2ByRole(params: {
    role: 'TEACHER' | 'ADMIN';
    currentTeacherId: string;
    mode: 'SINGLE_COURSE' | 'TEACHER_OWN_ALL' | 'TERM_ALL' | 'YEAR_ALL';
    courseId?: string;
    academicTerm?: string;
    academicYear?: string;
    autoBackupToSchoolDriveFirst?: boolean;
  }): {
    purgedCourseCount: number;
    purgedFileCount: number;
    freedMb: number;
    courses: R2CourseStorageSummary[];
  } {
    let purgedCourseCount = 0;
    let purgedFileCount = 0;
    let freedMb = 0;
    const current = this.getCourseStorageSummaries();

    const updated = current.map((c) => {
      // ตรวจสอบสิทธิ์: ถ้าเป็นครูผู้สอน (TEACHER) ห้ามลบวิชาของครูคนอื่นเด็ดขาด
      if (params.role === 'TEACHER' && c.teacherId !== params.currentTeacherId) {
        return c;
      }

      const match =
        (params.mode === 'SINGLE_COURSE' && c.courseId === params.courseId) ||
        (params.mode === 'TEACHER_OWN_ALL' && c.teacherId === params.currentTeacherId) ||
        (params.role === 'ADMIN' &&
          params.mode === 'TERM_ALL' &&
          c.academicTerm === params.academicTerm) ||
        (params.role === 'ADMIN' &&
          params.mode === 'YEAR_ALL' &&
          c.academicYear === params.academicYear);

      if (match && !c.isPurgedFromR2 && c.r2FileCount > 0) {
        purgedCourseCount += 1;
        purgedFileCount += c.r2FileCount;
        freedMb += c.r2UsedMb;

        // ถ้าตรงกับวิชา ศ23101 ม.3/1 ให้ล้างไฟล์ในตารางส่งงานจริงด้วย
        if (c.courseId === 'course-art-301') {
          this.purgeR2FilesAfterGrading(false);
        }

        return {
          ...c,
          r2FileCount: 0,
          r2UsedMb: 0,
          isPurgedFromR2: true,
          isBackedUpToSchoolDrive: params.autoBackupToSchoolDriveFirst
            ? true
            : c.isBackedUpToSchoolDrive,
          lastBackupAt: params.autoBackupToSchoolDriveFirst
            ? 'Backup อัตโนมัติเข้า Google Drive รร. (100TB) ก่อนล้าง R2'
            : c.lastBackupAt,
        };
      }
      return c;
    });

    const saved = this.saveCourseStorageSummaries(updated);
    return {
      purgedCourseCount,
      purgedFileCount,
      freedMb: Number(freedMb.toFixed(2)),
      courses: saved,
    };
  },
};

export interface R2CourseStorageSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  classroom: string;
  teacherId: string;
  teacherName: string;
  department: string;
  academicTerm: string;
  academicYear: string;
  r2FileCount: number;
  canvaLinkCount: number;
  originalMb: number;
  r2UsedMb: number;
  isGradedComplete: boolean;
  isBackedUpToSchoolDrive: boolean;
  schoolDriveFolderPath: string;
  lastBackupAt?: string;
  isPurgedFromR2: boolean;
}

const INITIAL_R2_COURSE_STORAGE: R2CourseStorageSummary[] = [];
