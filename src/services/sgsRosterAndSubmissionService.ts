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

export interface TermAssignmentItem {
  id: string;
  orderNo: number;
  title: string;
  description?: string;
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

  // รองรับการสั่งงานรายหน่วย / รายจุดประสงค์ และเฉลี่ยคะแนนสะสม (Auto-division / Unit Score)
  unitId?: string;               // รหัสกลุ่มหน่วย เช่น 'unit-1', 'obj-1'
  unitTitle?: string;            // ชื่อหน่วย/จุดประสงค์ เช่น 'หน่วยที่ 1: ทัศนธาตุและการออกแบบ'
  unitMaxScore?: number;         // คะแนนเต็มของหน่วย เช่น 10 คะแนน
  scoringMethod?: ScoringMethodType; // วิธีคำนวณคะแนนหน่วย
  totalTasksInUnit?: number;     // จำนวนงานทั้งหมดในหน่วย (เช่น 5 งาน หรือ 10 งาน)
  autoRoundUp?: boolean;         // สวิตช์ปัดเศษทศนิยม >= 0.5 ขึ้นอัตโนมัติ
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
  | 'EXEMPT_TRANSFERRED';

export interface StudentWorkSubmission {
  assignmentId: string;
  studentCode: string;
  status: SubmissionCellStatus;
  score: number | null;
  submittedAt?: string;
  workTitle?: string;
  workAttachmentLabel?: string;
  teacherFeedback?: string;
  // Cloudflare R2 Storage & Lifecycle fields
  r2ObjectKey?: string;
  originalSizeKb?: number;
  compressedSizeKb?: number;
  externalLinkUrl?: string;
  fileDataUrl?: string;
  academicYearTerm?: string;
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
        });
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
          return filtered.map((s, idx) => enrichRecord(s, idx));
        }
        return savedList.map((s, idx) => enrichRecord(s, idx));
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

  getTermAssignments(courseCode?: string, classroomId?: string): TermAssignmentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TERM_ASSIGNMENTS);
      const list: TermAssignmentItem[] = raw ? JSON.parse(raw) : [];
      return list.filter((item) => {
        if (courseCode && courseCode !== 'ALL' && item.courseCode && item.courseCode !== courseCode) {
          return false;
        }
        if (
          classroomId &&
          classroomId !== 'ALL' &&
          item.targetClassrooms &&
          item.targetClassrooms.length > 0 &&
          !item.targetClassrooms.includes('ALL')
        ) {
          const formattedTarget = formatClassroomLabel(classroomId);
          const matchRoom = item.targetClassrooms.some(
            (r) => r === classroomId || r === formattedTarget || formatClassroomLabel(r) === formattedTarget
          );
          if (!matchRoom) return false;
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
    const list = this.getTermAssignments().filter((item) => item.id !== assignmentId);
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kp-sgs-roster-updated'));
    }
    return list;
  },

  addTermAssignment(payload: {
    title: string;
    description?: string;
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
      id: `asg-${Date.now()}`,
      orderNo: list.length + 1,
      title: payload.title.trim(),
      description: payload.description?.trim(),
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
      const raw = localStorage.getItem(STORAGE_KEY_WORK_SUBMISSIONS);
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  },

  saveSubmissions(list: StudentWorkSubmission[]): StudentWorkSubmission[] {
    localStorage.setItem(STORAGE_KEY_WORK_SUBMISSIONS, JSON.stringify(list));
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

  // อัปเดตคะแนนรายชิ้น (Inline Matrix หรือ SpeedGrader) -> ถ้าเป็นงานบังคับ เมื่อตรวจปุ๊บจะปลด "ร" อัตโนมัติทันที
  gradeSubmission(
    assignmentId: string,
    studentCode: string,
    score: number | null,
    status: SubmissionCellStatus = 'GRADED'
  ): StudentWorkSubmission[] {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(
      (s) => s.assignmentId === assignmentId && s.studentCode === studentCode
    );
    const nextItem: StudentWorkSubmission =
      idx !== -1
        ? {
            ...subs[idx],
            score,
            status: score === null ? 'MISSING' : status,
            submittedAt: subs[idx].submittedAt || 'ครูตรวจบันทึกคะแนน',
          }
        : {
            assignmentId,
            studentCode,
            score,
            status: score === null ? 'MISSING' : status,
            submittedAt: 'ครูตรวจบันทึกคะแนน',
            workTitle: 'ส่งงานหน้าชั้นเรียน / ส่งซ่อมแก้ ร',
          };

    const updated =
      idx !== -1
        ? subs.map((item, i) => (i === idx ? nextItem : item))
        : [...subs, nextItem];

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
    student: SgsStudentRecord,
    courseCode?: string,
    classroomId?: string
  ): {
    u1: number;
    u2: number;
    u3: number;
    preMidterm: number | '';
    postMidterm: number | '';
    isPreMidtermManual: boolean;
    isPostMidtermManual: boolean;
    weights: CourseScoreWeights;
    calculatedAccumulated: number;
    effectiveAccumulated: number;
    isManualOverride: boolean;
    midterm: number | '';
    final: number | '';
    total: number;
    gradeLabel: string;
    numericGrade: number;
    autoLevelFromGrade: 0 | 1 | 2 | 3;
    analyticalThinkingLevel: 0 | 1 | 2 | 3;
    desiredCharacteristicsLevel: 0 | 1 | 2 | 3;
    submittedCount: number;
    totalAssignedCount: number;
    missingCount: number;
    pendingReviewCount: number;
    missingMandatoryTitles: string[];
    rReasonLabel?: string;
  } {
    const weights = this.getCourseWeights(courseCode);
    const assignments = this.getTermAssignments(courseCode, classroomId || student.classroom);
    const subs = this.getSubmissions().filter(
      (s) => s.studentCode === student.studentCode
    );

    if (student.transferState === 'TRANSFERRED_OUT') {
      return {
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
        numericGrade: 0,
        autoLevelFromGrade: 0,
        analyticalThinkingLevel: 0,
        desiredCharacteristicsLevel: 0,
        submittedCount: 0,
        totalAssignedCount: assignments.length,
        missingCount: 0,
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
      const sub = subs.find((s) => s.assignmentId === asg.id);
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
        const sub = subs.find((s) => s.assignmentId === asg.id);
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
        : typeof student.midtermScore === 'number'
        ? student.midtermScore
        : null;
    const manualFinal =
      courseOverride?.final !== undefined
        ? courseOverride.final
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

    if (hasRealAttendance && student.attendancePercent < 80) {
      gradeLabel = 'มส.';
    } else if (missingMandatoryTitles.length > 0) {
      gradeLabel = 'ร';
      rReasonLabel = `ค้างงานสำคัญ (${missingMandatoryTitles.join(', ')})`;
    } else if (!hasAnyAssessment && total === 0) {
      gradeLabel = '—';
    } else if (total >= 80) {
      gradeLabel = '4.0';
    } else if (total >= 75) {
      gradeLabel = '3.5';
    } else if (total >= 70) {
      gradeLabel = '3.0';
    } else if (total >= 65) {
      gradeLabel = '2.5';
    } else if (total >= 60) {
      gradeLabel = '2.0';
    } else if (total >= 55) {
      gradeLabel = '1.5';
    } else if (total >= 50) {
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

    return {
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

  // ดึง Data URL ไฟล์ชิ้นงานจริงที่นักเรียนอัปโหลดไว้ (ถ้ามี)
  getSubmissionFileUrl(assignmentId: string, studentCode: string): string | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    try {
      return localStorage.getItem(`kp_sub_file_${assignmentId}_${studentCode}`) || undefined;
    } catch {
      return undefined;
    }
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
      ? `r2://kp-classroom-submissions/${term.replace('/', '-')}/m3-1/${payload.assignmentId}/${payload.studentCode}_${cleanFileName}`
      : undefined;
    const origKb = payload.originalSizeKb ?? (cleanFileName ? 4250 : 0);
    const compKb = payload.compressedSizeKb ?? (cleanFileName ? 148 : 0);

    // เก็บไฟล์ภาพจริงเข้า LocalStorage แยกคีย์เพื่อไม่ให้ล้นโควต้าอาร์เรย์หลัก
    if (payload.fileDataUrl && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `kp_sub_file_${payload.assignmentId}_${payload.studentCode}`,
          payload.fileDataUrl
        );
      } catch (e) {
        console.warn('Could not cache submission file preview URL', e);
      }
    }

    const attachmentLabel = cleanFileName
      ? `☁️ R2: ${cleanFileName} (บีบอัดเหลือ ${compKb} KB จาก ${(origKb / 1024).toFixed(1)} MB)`
      : payload.externalLinkUrl
      ? `🔗 ลิงก์แนบ: ${payload.externalLinkUrl}`
      : 'ส่งงานออนไลน์';

    const existingScore = idx !== -1 ? subs[idx].score : null;
    const existingSubmittedAt = idx !== -1 ? subs[idx].submittedAt : undefined;
    const nowIso = new Date().toISOString();
    // ถ้าเคยมี submittedAt ที่ถูกต้องแล้วให้ใช้เดิม ถ้าไม่มีหรือเป็นข้อความเดิมให้ใส่เวลาจริงปัจจุบัน
    const finalSubmittedAt =
      existingSubmittedAt && !existingSubmittedAt.includes('เพิ่งส่งเมื่อสักครู่')
        ? existingSubmittedAt
        : nowIso;

    const nextItem: StudentWorkSubmission = {
      ...(idx !== -1 ? subs[idx] : {}),
      assignmentId: payload.assignmentId,
      studentCode: payload.studentCode,
      status:
        existingScore !== null && existingScore !== undefined
          ? 'GRADED'
          : 'SUBMITTED_PENDING',
      score: existingScore,
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
    };

    const updated =
      idx !== -1
        ? subs.map((item, i) => (i === idx ? nextItem : item))
        : [...subs, nextItem];

    return this.saveSubmissions(updated);
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
