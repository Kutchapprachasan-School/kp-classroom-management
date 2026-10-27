// ============================================================================
// Teacher Multi-Subject, Classroom Matrix, FIFO Grading Queue, & Assignment Bundle Service
// รองรับ:
// 1. ครูสอนหลายรายวิชา หลายห้อง (สลับวิชาและห้องได้อิสระ)
// 2. แยกเช็คแถวเช้าเฉพาะห้องที่ปรึกษา (ม.3/1) ออกจากเช็คชื่อเข้าเรียนรายวิชา
// 3. หน้าคิวตรวจงานนักเรียน (FIFO ใครส่งก่อนอยู่บนสุด) พร้อมปุ่ม Preview รูปภาพ/PDF และลิงก์ Canva/Docs
// 4. ตารางเช็คงานรายห้อง 3 สีชัดเจน: 🔴 แดง (ยังไม่ส่ง) | 🟠 ส้ม (รอตรวจ) | 🟢 เขียว (ส่งแล้ว/ตรวจแล้ว)
// 5. ระบบหมวดหมู่งานรวม สั่ง 20 งาน ส่ง 10 ได้ 5 คะแนน พร้อมสูตรเฉลี่ยและสวิตช์ปัดทศนิยม >= 0.5 อัตโนมัติ
// ============================================================================

import { cleanSlateService } from './cleanSlateService.ts';
import { coursesCurriculumService, inferGradeLevelFromCourseCode } from './coursesCurriculumService.ts';
import { studentService, formatClassroomLabel } from './studentService.ts';
import { classroomService } from './classroomService.ts';
import { authService } from './authService.ts';
import { sgsRosterAndSubmissionService, formatSubmissionTimestamp, isSameClassroom } from './sgsRosterAndSubmissionService.ts';
import { r2StorageService } from './r2StorageService.ts';

export interface TeachingSubjectInfo {
  code: string;
  name: string;
  courseCode: string;
  courseName: string;
  termLabel?: string;
  shortName: string;
  classrooms: string[];
  credits: number;
  colorBadge: string;
}

export interface TeachingCourseClassroom {
  subjectCode: string;
  classroom: string;
  label: string;
}

export const getAllAvailableClassroomLabels = (): string[] => {
  try {
    const rooms = classroomService.getClassroomsSync();
    if (rooms && rooms.length > 0) {
      return rooms
        .map((r) => r.name || r.roomNumber || r.id)
        .filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
};

/**
 * ดึงรายวิชาที่สอนจริงจากหลักสูตร (Curriculum Service) แบบ Real-time
 * กรองเฉพาะรายวิชาที่เป็นของครูผู้สอนที่ระบุ (หรือครูที่ล็อกอินอยู่ปัจจุบัน) เพื่อไม่ให้วิชาปนกัน
 */
export const getDynamicTeachingSubjects = (teacherIdOrName?: string): TeachingSubjectInfo[] => {
  const currentUser = authService.getCurrentUser();
  const effectiveTeacher =
    teacherIdOrName ||
    (currentUser?.role !== 'ADMIN' ? (currentUser?.id || currentUser?.name) : undefined);
  const curriculumCourses = coursesCurriculumService.getCourses(undefined, undefined, effectiveTeacher);
  const fallbackRooms = getAllAvailableClassroomLabels();
  if (curriculumCourses && curriculumCourses.length > 0) {
    const colorMap: Record<number, string> = {
      0: 'bg-rose-100 text-rose-800 border-rose-300',
      1: 'bg-teal-100 text-teal-800 border-teal-300',
      2: 'bg-blue-100 text-blue-800 border-blue-300',
      3: 'bg-purple-100 text-purple-800 border-purple-300',
      4: 'bg-amber-100 text-amber-800 border-amber-300',
    };
    return curriculumCourses.map((c, idx) => {
      const inferredLevel = inferGradeLevelFromCourseCode(c.code) || c.level;
      let assigned = Array.isArray(c.assignedClassrooms) ? c.assignedClassrooms.filter(Boolean) : [];
      if (inferredLevel) {
        assigned = assigned.filter((r) => r.startsWith(inferredLevel));
      }
      if (assigned.length === 0) {
        // กรอง fallback เฉพาะห้องที่มีระดับชั้นตรงกับวิชา (เช่น ม.6 ไม่เอาห้อง ม.1-ม.5 มาปน)
        assigned = inferredLevel
          ? fallbackRooms.filter((r) => r.startsWith(inferredLevel))
          : fallbackRooms;
      }
      return {
        code: c.code,
        name: c.name,
        courseCode: c.code,
        courseName: c.name,
        termLabel: `${c.term || '2'}/${c.academicYear || '2569'}`,
        shortName: c.name.length > 15 ? `${c.name.slice(0, 15)}...` : c.name,
        classrooms: assigned.map((r) => formatClassroomLabel(r)),
        credits: Number(c.credits) || 1.0,
        colorBadge: colorMap[idx % 5] || 'bg-blue-100 text-blue-800 border-blue-300',
      };
    });
  }

  // หากไม่มีวิชาในหลักสูตร ให้ส่งค่าว่าง [] เพื่อไม่ให้มี fake mock subjects
  return [];
};

/**
 * ดึงรายชื่อห้องเรียนที่ครูผู้สอนสอนจริง (Taught Classrooms)
 * โดยรวบรวมจากรายวิชาทั้งหมดที่ครูได้รับมอบหมายในหลักสูตร
 * หากระบุ subjectCode จะกรองเฉพาะห้องเรียนของวิชานั้นๆ
 */
export const getTeacherTaughtClassrooms = (
  subjectCode?: string,
  teacherIdOrName?: string
): string[] => {
  const subjects = getDynamicTeachingSubjects(teacherIdOrName);

  if (subjectCode && subjectCode !== 'ALL') {
    const cleanCode = subjectCode.trim().toUpperCase();
    const matched = subjects.find(
      (s) => (s.courseCode || s.code)?.trim().toUpperCase() === cleanCode
    );
    if (matched && Array.isArray(matched.classrooms) && matched.classrooms.length > 0) {
      return Array.from(
        new Set(matched.classrooms.map((r) => formatClassroomLabel(r)).filter(Boolean))
      );
    }
    // หากไม่พบในหลักสูตร ลองดูจาก Term Assignments ที่มีการสั่งงานไว้สำหรับวิชานี้
    const asgs = sgsRosterAndSubmissionService.getTermAssignments(subjectCode);
    const asgRooms = new Set<string>();
    asgs.forEach((a) => {
      if (Array.isArray(a.targetClassrooms)) {
        a.targetClassrooms.forEach((r) => {
          if (r && r !== 'ALL') asgRooms.add(formatClassroomLabel(r));
        });
      }
      const rawRoom = (a as any).classroom || (a as any).classroomId;
      if (rawRoom && rawRoom !== 'ALL') {
        asgRooms.add(formatClassroomLabel(rawRoom));
      }
    });
    if (asgRooms.size > 0) {
      return Array.from(asgRooms);
    }
  }

  // รวบรวมทุกห้องเรียนจากทุกรายวิชาที่ครูสอน
  const allTaught = new Set<string>();
  subjects.forEach((s) => {
    if (Array.isArray(s.classrooms)) {
      s.classrooms.forEach((r) => {
        if (r && r !== 'ALL') {
          allTaught.add(formatClassroomLabel(r));
        }
      });
    }
  });

  // รวบรวมห้องเรียนที่ปรึกษา / ประจำชั้น (Homeroom / Advisor) ของครูคนนี้ด้วย
  const currentUser = authService.getCurrentUser();
  if (currentUser?.classroomName) {
    allTaught.add(formatClassroomLabel(currentUser.classroomName));
  }
  if (currentUser?.classroomId) {
    allTaught.add(formatClassroomLabel(currentUser.classroomId));
  }

  if (allTaught.size > 0) {
    return Array.from(allTaught);
  }

  // Fallback สำหรับกรณีที่ยังไม่ได้กำหนดห้องเรียนในหลักสูตรเลย
  return getAllAvailableClassroomLabels();
};

/**
 * Proxy array สำหรับคง backward compatibility กับ import เดิม
 * แต่จะอัปเดตสมาชิกตามหลักสูตรจริงอยู่เสมอ
 */
export const TEACHER_SUBJECTS_LIST: TeachingSubjectInfo[] = new Proxy([] as TeachingSubjectInfo[], {
  get(_target, prop) {
    const list = getDynamicTeachingSubjects();
    if (prop === 'length') return list.length;
    if (typeof prop === 'string' && !Number.isNaN(Number(prop))) {
      return list[Number(prop)];
    }
    const val = Reflect.get(list, prop);
    if (typeof val === 'function') {
      return val.bind(list);
    }
    return val;
  },
});

// ห้องที่ปรึกษาประจำตัวครู (Homeroom Advisory)
export const HOMEROOM_ADVISORY = {
  classroom: 'ม.3/1',
  roomLabel: 'ชั้นมัธยมศึกษาปีที่ 3/1',
  roleTitle: 'ครูที่ปรึกษาประจำชั้น ม.3/1',
  time: '07:45 น.',
  activityName: 'กิจกรรมหน้าเสาธง & โฮมรูมเช้า',
  studentCount: 23,
};

// ============================================================================
// 1. Data Model for FIFO Grading Queue (ใครส่งก่อนอยู่บนสุด)
// ============================================================================
export type SubmissionChannelType = 'IMAGE_UPLOAD' | 'PDF_UPLOAD' | 'LINK_URL' | 'TEXT_RESPONSE';

export interface GradingQueueItem {
  id: string;
  queueNo: number; // ลำดับคิว เช่น 1, 2, 3...
  subjectCode: string;
  subjectName: string;
  classroom: string;
  seatNo: number;
  studentCode: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  sgsUnit: string;
  maxScore: number;
  submittedAtText: string;
  submittedTimestamp: number; // เพื่อ sort FIFO (asc)
  submissionChannel: SubmissionChannelType;
  filePreviewUrl?: string;
  fileName?: string;
  externalLinkUrl?: string;
  externalPlatform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'FIGMA' | 'YOUTUBE' | 'OTHER';
  status: 'PENDING_REVIEW' | 'GRADED' | 'RETURNED' | 'RETURNED_REVISION';
  score?: number | null;
  textContent?: string;
  teacherFeedback?: string;
  gradedAtText?: string;
  studentAvatarUrl?: string;
  academicYearTerm?: string;
  isResubmission?: boolean;
}

// ============================================================================
// 2. Data Model for Assignment Bundles & Auto Averaging (สั่งงานรวม & เฉลี่ยคะแนน)
// ============================================================================
export interface StudentBundleProgress {
  seatNo: number;
  studentCode: string;
  studentName: string;
  completedTasksCount: number; // เช่น ส่ง 10 จาก 20
  rawScore: number; // เช่น 5.0
  finalScore: number; // เช่น 5 หรือ 8 (ถ้าปัดเศษ)
  isRoundedUp: boolean;
  manualScoreOverride?: number | null;
  tasksChecklist: boolean[]; // array of length totalTasks
  lastUpdated: string;
}

export interface AssignmentBundleConfig {
  id: string;
  subjectCode: string;
  classroom: string;
  title: string;
  description: string;
  targetSgsColumn: string; // เช่น 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1)'
  maxScore: number; // เช่น 10 คะแนน
  totalTasks: number; // เช่น 20 งานย่อย
  autoRoundUpHalf: boolean; // ถ้าเศษทศนิยม >= 0.5 ปัดขึ้นอัตโนมัติ (True/False)
  students: StudentBundleProgress[];
}

// ฟังก์ชันคำนวณคะแนนเฉลี่ยงานรวมตามข้อกำหนดเป๊ะๆ
export function calculateBundleScore(
  completedCount: number,
  totalTasks: number,
  maxScore: number,
  autoRoundUp: boolean
): { rawScore: number; finalScore: number; isRoundedUp: boolean; formulaText: string } {
  if (totalTasks <= 0) {
    return { rawScore: 0, finalScore: 0, isRoundedUp: false, formulaText: '0 / 0' };
  }
  const clamped = Math.min(totalTasks, Math.max(0, completedCount));
  const raw = (clamped / totalTasks) * maxScore;
  const rawRounded2 = Math.round(raw * 100) / 100;

  if (autoRoundUp) {
    const floorVal = Math.floor(rawRounded2);
    const decimalPart = Math.round((rawRounded2 - floorVal) * 100) / 100;
    const finalVal = decimalPart >= 0.5 ? Math.ceil(rawRounded2) : floorVal;
    return {
      rawScore: rawRounded2,
      finalScore: finalVal,
      isRoundedUp: finalVal > rawRounded2,
      formulaText: `(${clamped} / ${totalTasks}) × ${maxScore} = ${rawRounded2.toFixed(1)}${
        finalVal > rawRounded2 ? ` ➔ ปัดเป็น ${finalVal}` : ''
      }`,
    };
  }

  // ไม่ปัดเศษ แสดงทศนิยม 1 ตำแหน่ง
  const finalVal = Math.round(rawRounded2 * 10) / 10;
  return {
    rawScore: rawRounded2,
    finalScore: finalVal,
    isRoundedUp: false,
    formulaText: `(${clamped} / ${totalTasks}) × ${maxScore} = ${finalVal.toFixed(1)}`,
  };
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_QUEUE_ITEMS: GradingQueueItem[] = [];

function buildInitialBundle(): AssignmentBundleConfig {
  const totalTasks = 20;
  const maxScore = 10;
  const autoRoundUp = true;

  const realStudents = studentService.getStudents('room-3-1');
  const students: StudentBundleProgress[] = realStudents.map((st, idx) => {
    return {
      seatNo: st.no || idx + 1,
      studentCode: st.code || st.id,
      studentName: st.name,
      completedTasksCount: 0,
      rawScore: 0,
      finalScore: 0,
      isRoundedUp: false,
      tasksChecklist: Array.from({ length: totalTasks }, () => false),
      lastUpdated: '-',
    };
  });

  return {
    id: 'bundle-art-homework',
    subjectCode: 'ศ23101',
    classroom: 'ม.3/1',
    title: 'ชุดการบ้านและแบบฝึกหัดทัศนธาตุสะสม (20 ชิ้น)',
    description: 'ครูสั่งการบ้านสะสม 20 งาน ตรวจเช็คผ่าน/ส่งแล้ว ระบบคำนวณเฉลี่ยอัตโนมัติเต็ม 10 คะแนน',
    targetSgsColumn: 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1 • 10 คะแนน)',
    maxScore,
    totalTasks,
    autoRoundUpHalf: autoRoundUp,
    students,
  };
}

const STORAGE_KEY_QUEUE = 'kp_grading_queue_v2';
const STORAGE_KEY_BUNDLE = 'kp_assignment_bundle_v2';

export const teacherCourseAssignmentService = {
  // ==========================================================================
  // FIFO Grading Queue Methods
  // ==========================================================================
  getGradingQueue(): GradingQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      const savedItems: GradingQueueItem[] = raw ? JSON.parse(raw) : [];
      const savedMap = new Map<string, GradingQueueItem>();
      savedItems.forEach((it) => {
        if (it.id) savedMap.set(it.id, it);
        if (it.assignmentId && it.studentCode) {
          savedMap.set(`${it.assignmentId}_${it.studentCode}`, it);
        }
      });

      // ดึงงานที่ส่งจริงจาก sgsRosterAndSubmissionService (Cloudflare R2 / Online Submissions)
      const realSubs = sgsRosterAndSubmissionService.getSubmissions();
      const termAssignments = sgsRosterAndSubmissionService.getTermAssignments();
      const allRoster = sgsRosterAndSubmissionService.getSgsRoster();
      const studentMap = new Map<string, any>();
      allRoster.forEach((st) => {
        if (st.studentCode) studentMap.set(st.studentCode.trim(), st);
      });

      const mergedQueue: GradingQueueItem[] = [];
      const handledKeys = new Set<string>();

      // ตัวแปลง URL ให้เปิดดูรูปได้จริง (รองรับทั้ง R2 Worker URL และ Local Fallback)
      const resolveFileUrl = (rawUrl?: string): string | undefined => {
        if (!rawUrl) return undefined;
        if (r2StorageService.isConfigured()) {
          return r2StorageService.resolvePublicViewUrl(rawUrl);
        }
        if (rawUrl.includes('storage.kps.ac.th') || rawUrl.startsWith('r2://')) {
          return undefined;
        }
        return rawUrl;
      };

      // 1. นำงานที่นักเรียนส่งจริงเข้ามาในคิว
      realSubs.forEach((sub, idx) => {
        // กรองงานที่ถูกลบออกจากระบบไปแล้ว (Orphan Submissions)
        if (termAssignments.length > 0 && sub.assignmentId) {
          const asgExists = termAssignments.some(
            (a) =>
              a.id === sub.assignmentId ||
              (a.unitId && a.unitId === sub.assignmentId) ||
              (sub.workTitle && a.title && (
                sub.workTitle.trim().toLowerCase() === a.title.trim().toLowerCase() ||
                sub.workTitle.includes(a.title) ||
                a.title.includes(sub.workTitle)
              ))
          );
          if (!asgExists) return;
        }

        const pairKey = `${sub.assignmentId}_${sub.studentCode}`;
        handledKeys.add(pairKey);
        handledKeys.add(sub.assignmentId);

        const savedMatch = savedMap.get(pairKey) || savedMap.get(`q_${pairKey}`);
        const subCode = sub.studentCode.trim();
        const stu = studentMap.get(subCode);
        const foundInService = studentService.findStudentByCode(subCode);
        const studentRoom = stu?.classroom || foundInService?.classroomId || foundInService?.student.classroomId || sub.classroom || '';

        // ค้นหาชิ้นงาน: ให้ความสำคัญกับการจับคู่ตรงด้วย assignmentId ก่อนเสมอ
        // หากไม่ตรงด้วย ID จึงค่อยพิจารณา unitId หรือชื่อชิ้นงานร่วมกับ Classroom guard
        const asg =
          termAssignments.find((a) => a.id === sub.assignmentId) ||
          termAssignments.find((a) => {
            // Classroom guard: ป้องกันงานของห้องอื่น (เช่น 6/3) ไปจับคู่กับนักเรียนห้อง 6/1
            if (studentRoom && a.targetClassrooms && a.targetClassrooms.length > 0 && !a.targetClassrooms.includes('ALL')) {
              const matchRoom = a.targetClassrooms.some((r: string) => isSameClassroom(r, studentRoom));
              if (!matchRoom) return false;
            }
            return (
              (a.unitId && a.unitId === sub.assignmentId) ||
              (sub.workTitle && a.title && (
                sub.workTitle.trim().toLowerCase() === a.title.trim().toLowerCase() ||
                sub.workTitle.includes(a.title) ||
                a.title.includes(sub.workTitle)
              ))
            );
          });

        const isResubmission = Boolean(sub.isResubmission || (savedMatch && savedMatch.isResubmission && sub.status === 'SUBMITTED_PENDING'));
        const isGraded = !isResubmission && (sub.status === 'GRADED' || (savedMatch && savedMatch.status === 'GRADED' && sub.status !== 'SUBMITTED_PENDING'));
        const isReturned = !isResubmission && (sub.status === 'RETURNED_REVISION' || (savedMatch && (savedMatch.status === 'RETURNED' || (savedMatch as any).status === 'RETURNED_REVISION') && sub.status !== 'SUBMITTED_PENDING'));
        const score = isGraded ? (sub.score !== null && sub.score !== undefined ? sub.score : savedMatch?.score ?? null) : null;
        const feedback = sub.teacherFeedback || savedMatch?.teacherFeedback || '';

        // แก้ไขชื่องาน: ป้องกัน 'งานที่ 0' และรวมชื่อหน่วยการเรียนรู้ให้ชัดเจน
        let effectiveAssignmentTitle = asg?.title || sub.workTitle || savedMatch?.assignmentTitle || 'ชิ้นงานที่มอบหมาย';
        if (effectiveAssignmentTitle.trim() === 'งานที่ 0') {
          if (asg?.unitTitle) {
            effectiveAssignmentTitle = asg.unitTitle;
          } else {
            effectiveAssignmentTitle = `งานที่ ${asg?.orderNo && asg.orderNo > 0 ? asg.orderNo : idx + 1}`;
          }
        } else if (asg?.unitTitle && !effectiveAssignmentTitle.includes(asg.unitTitle)) {
          effectiveAssignmentTitle = `${asg.unitTitle} • ${effectiveAssignmentTitle}`;
        }

        // แก้ไขคะแนนเต็ม: กรณีหน่วยคะแนนรวม (Unit Bundle) ให้ใช้ unitMaxScore แทน maxScore 1 ชิ้น
        const effectiveMaxScore =
          asg?.unitMaxScore && asg.unitMaxScore > (asg.maxScore || 1)
            ? asg.unitMaxScore
            : asg?.maxScore || savedMatch?.maxScore || 10;

        // แยก Channel
        let channel: SubmissionChannelType = 'IMAGE_UPLOAD';
        let platform: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'FIGMA' | 'YOUTUBE' | 'OTHER' | undefined = undefined;

        if (sub.externalLinkUrl) {
          channel = 'LINK_URL';
          const urlLower = sub.externalLinkUrl.toLowerCase();
          if (urlLower.includes('canva.com')) platform = 'CANVA';
          else if (urlLower.includes('docs.google.com')) platform = 'GOOGLE_DOCS';
          else if (urlLower.includes('drive.google.com')) platform = 'GOOGLE_DRIVE';
          else if (urlLower.includes('figma.com')) platform = 'FIGMA';
          else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) platform = 'YOUTUBE';
          else platform = 'OTHER';
        } else if (sub.r2ObjectKey?.endsWith('.pdf') || (sub.workAttachmentLabel && sub.workAttachmentLabel.toLowerCase().includes('.pdf'))) {
          channel = 'PDF_UPLOAD';
        } else if (sub.textContent && !sub.fileUrl && !sub.fileDataUrl) {
          channel = 'TEXT_RESPONSE';
        }

        const cleanFileName = sub.r2ObjectKey ? sub.r2ObjectKey.split('/').pop() : undefined;

        // คำนวณชื่อ ชั้น เลขที่จริงของนักเรียน ไม่เอาแค่รหัสนักเรียนมาแสดงซ้ำ
        const realStudentName =
          (foundInService?.student.name && foundInService.student.name !== subCode)
            ? foundInService.student.name
            : (stu?.studentName && stu.studentName !== subCode)
              ? stu.studentName
              : (stu?.fullName && stu.fullName !== subCode)
                ? stu.fullName
                : (savedMatch?.studentName && savedMatch.studentName !== subCode)
                  ? savedMatch.studentName
                  : `นักเรียน (${subCode})`;

        const effectiveCourseCode =
          asg?.courseCode ||
          sub.courseCode ||
          savedMatch?.subjectCode ||
          '';

        const matchedCourse = effectiveCourseCode
          ? coursesCurriculumService.getCourses().find((c) => c.code === effectiveCourseCode)
          : undefined;

        const nonAllAsgRoom = asg?.targetClassrooms?.find((r) => r && r !== 'ALL');
        const courseDefaultRoom = matchedCourse?.assignedClassrooms?.find((r) => r && r !== 'ALL');

        const realClassroom =
          foundInService?.classroomId
            ? formatClassroomLabel(foundInService.classroomId)
            : stu?.classroom
              ? formatClassroomLabel(stu.classroom)
              : sub.classroom
                ? formatClassroomLabel(sub.classroom)
                : nonAllAsgRoom
                  ? formatClassroomLabel(nonAllAsgRoom)
                  : courseDefaultRoom
                    ? formatClassroomLabel(courseDefaultRoom)
                    : savedMatch?.classroom
                      ? formatClassroomLabel(savedMatch.classroom)
                      : 'ม.3/1';

        const realSeatNo =
          foundInService?.student.no ?? stu?.sgsSeatNo ?? stu?.no ?? savedMatch?.seatNo ?? (idx + 1);

        const cleanSavedUrl = resolveFileUrl(savedMatch?.filePreviewUrl);

        const effectiveFileName = savedMatch?.fileName || cleanFileName || sub.workAttachmentLabel;

        const cachedDirectUrl = sgsRosterAndSubmissionService.getSubmissionFileUrl(
          sub.assignmentId,
          subCode,
          effectiveFileName,
          true
        );

        const r2FromKey = sub.r2ObjectKey ? resolveFileUrl(sub.r2ObjectKey) : undefined;
        const r2FromFileUrl = sub.fileUrl ? resolveFileUrl(sub.fileUrl) : undefined;
        const r2FromDataUrl = sub.fileDataUrl ? resolveFileUrl(sub.fileDataUrl) : undefined;
        const isHttpR2 = (u?: string) =>
          Boolean(
            u &&
              (u.startsWith('http://') || u.startsWith('https://')) &&
              !u.startsWith('data:') &&
              !u.includes('storage.kps.ac.th')
          );
        const validR2Url = isHttpR2(r2FromKey)
          ? r2FromKey
          : isHttpR2(r2FromFileUrl)
            ? r2FromFileUrl
            : isHttpR2(r2FromDataUrl)
              ? r2FromDataUrl
              : undefined;

        const realFileUrl =
          validR2Url ||
          cachedDirectUrl ||
          cleanSavedUrl ||
          r2FromFileUrl ||
          r2FromDataUrl ||
          undefined;

        const subTimestamp =
          sub.submittedAt && !isNaN(new Date(sub.submittedAt).getTime())
            ? new Date(sub.submittedAt).getTime()
            : savedMatch?.submittedTimestamp || (Date.now() - idx * 60000);

        const effectiveCourseName =
          (asg?.courseName || matchedCourse?.name || savedMatch?.subjectName || (effectiveCourseCode ? `วิชา ${effectiveCourseCode}` : 'รายวิชา')).replace(/\u200b/g, '');

        const queueItem: GradingQueueItem = {
          id: savedMatch?.id || `q_${pairKey}`,
          queueNo: savedMatch?.queueNo || idx + 1,
          subjectCode: effectiveCourseCode,
          subjectName: effectiveCourseName,
          classroom: realClassroom,
          seatNo: realSeatNo,
          studentCode: subCode,
          studentName: realStudentName,
          assignmentId: sub.assignmentId,
          assignmentTitle: effectiveAssignmentTitle,
          sgsUnit: asg?.sgsUnitLabel || asg?.unitTitle || savedMatch?.sgsUnit || 'คะแนนเก็บระหว่างภาค',
          maxScore: effectiveMaxScore,
          submittedAtText: formatSubmissionTimestamp(sub.submittedAt || subTimestamp),
          submittedTimestamp: subTimestamp,
          submissionChannel: savedMatch?.submissionChannel || channel,
          filePreviewUrl: realFileUrl,
          fileName: savedMatch?.fileName || cleanFileName,
          externalLinkUrl: sub.externalLinkUrl || savedMatch?.externalLinkUrl,
          externalPlatform: platform || savedMatch?.externalPlatform,
          status: isGraded ? 'GRADED' : isReturned ? 'RETURNED' : 'PENDING_REVIEW',
          score,
          textContent: sub.textContent || savedMatch?.textContent,
          teacherFeedback: feedback,
          gradedAtText: savedMatch?.gradedAtText,
          studentAvatarUrl: savedMatch?.studentAvatarUrl || (stu as any)?.avatarUrl || (foundInService?.student as any)?.avatarUrl,
          academicYearTerm: (sub.academicYearTerm || '2/2569').replace(/^ภาคเรียนที่\s*/, '').trim(),
          isResubmission,
        };

        mergedQueue.push(queueItem);
      });

      // 2. นำงานที่อยู่ใน savedItems แต่ไม่ได้อยู่ใน realSubs (ถ้ามี) เข้ามา (กรอง ghost queue items ที่ไม่มีใน termAssignments ออก)
      savedItems.forEach((it) => {
        const pairKey = `${it.assignmentId}_${it.studentCode}`;
        if (!handledKeys.has(pairKey) && !handledKeys.has(it.id)) {
          if (termAssignments.length > 0 && it.assignmentId) {
            const exists = termAssignments.some(
              (a) => a.id === it.assignmentId || (a.unitId && a.unitId === it.assignmentId)
            );
            if (!exists) return;
          }

          const asg = termAssignments.find(
            (a) => a.id === it.assignmentId || (a.unitId && a.unitId === it.assignmentId)
          );
          const subCode = (it.studentCode || '').trim();
          const stu = studentMap.get(subCode);
          const foundInService = studentService.findStudentByCode(subCode);

          const rawFileUrl = it.filePreviewUrl || (it as any).fileUrl || '';
          let previewUrl = resolveFileUrl(rawFileUrl) || rawFileUrl;
          const cleanFileName =
            it.fileName ||
            (rawFileUrl ? decodeURIComponent(rawFileUrl.split('/').pop()?.split('?')[0] || '') : '');
          if (!previewUrl) {
            previewUrl = sgsRosterAndSubmissionService.getSubmissionFileUrl(it.assignmentId, it.studentCode, cleanFileName, true);
          }

          const isImage = Boolean(
            previewUrl?.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i) ||
            cleanFileName.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i) ||
            previewUrl?.startsWith('data:image/')
          );
          const isPdf = Boolean(
            previewUrl?.toLowerCase().includes('.pdf') ||
            cleanFileName.toLowerCase().endsWith('.pdf') ||
            previewUrl?.startsWith('data:application/pdf')
          );
          const channel = isImage ? 'IMAGE_UPLOAD' : isPdf ? 'PDF_UPLOAD' : (it.submissionChannel || 'ONLINE_FORM');

          mergedQueue.push({
            ...it,
            studentName: it.studentName || stu?.name || foundInService?.student?.name || `นักเรียน (${it.studentCode})`,
            classroom: it.classroom || stu?.classroom || (foundInService?.classroomId ? formatClassroomLabel(foundInService.classroomId) : ''),
            seatNo: it.seatNo ?? stu?.seatNo ?? foundInService?.student?.no ?? '-',
            subjectCode: it.subjectCode || (it as any).courseCode || asg?.courseCode || '',
            subjectName: it.subjectName || asg?.courseName || asg?.unitTitle || '',
            assignmentTitle: it.assignmentTitle || (it as any).workTitle || asg?.title || 'ชิ้นงาน',
            sgsUnit: it.sgsUnit || asg?.unitTitle || 'งานระหว่างภาค',
            maxScore: it.maxScore || asg?.maxScore || 10,
            filePreviewUrl: previewUrl,
            fileName: cleanFileName,
            submissionChannel: it.submissionChannel || channel,
            submittedAtText: it.submittedAtText || formatSubmissionTimestamp(it.submittedTimestamp || Date.now()),
          });
        }
      });

      // หาก Clean Slate Active และไม่มีข้อมูลจริง ให้ส่งค่าว่าง []
      if (mergedQueue.length === 0 && cleanSlateService.isCleanSlateActive()) {
        return [];
      }

      // เรียงลำดับ: งานที่ยังไม่ตรวจ (PENDING_REVIEW) มาก่อน เรียง FIFO ตาม submittedTimestamp (เก่าสุดอยู่บน)
      return mergedQueue.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'PENDING_REVIEW' ? -1 : 1;
        }
        return a.submittedTimestamp - b.submittedTimestamp;
      });
    } catch {
      // fallback
    }
    return cleanSlateService.isCleanSlateActive() ? [] : INITIAL_QUEUE_ITEMS;
  },

  saveGradingQueue(items: GradingQueueItem[]): GradingQueueItem[] {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
    }
    return items;
  },

  submitGrade(
    queueId: string,
    score: number,
    feedback: string,
    fromIndex?: number
  ): { updatedQueue: GradingQueueItem[]; nextPendingItem: GradingQueueItem | null } {
    const list = this.getGradingQueue();
    let targetItem: GradingQueueItem | null = null;
    const updated = list.map((item) => {
      const isIdMatch = item.id === queueId || item.id === `q_${queueId}`;
      const isPairMatch =
        (queueId.startsWith('q_') && queueId.slice(2) === `${item.assignmentId}_${item.studentCode}`) ||
        queueId === `${item.assignmentId}_${item.studentCode}`;

      if (isIdMatch || isPairMatch) {
        targetItem = {
          ...item,
          status: 'GRADED' as const,
          score,
          teacherFeedback: feedback.trim(),
          isResubmission: false,
          gradedAtText: 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        };
        return targetItem;
      }
      return item;
    });

    this.saveGradingQueue(updated);

    // ซิงก์คะแนนกลับไปยัง sgsRosterAndSubmissionService แบบสองทาง
    if (targetItem && (targetItem as GradingQueueItem).assignmentId && (targetItem as GradingQueueItem).studentCode) {
      sgsRosterAndSubmissionService.gradeSubmission(
        (targetItem as GradingQueueItem).assignmentId,
        (targetItem as GradingQueueItem).studentCode,
        score,
        'GRADED',
        feedback
      );
    } else {
      // Fallback parsing for direct pair IDs (e.g. q_asg-1_45101)
      let asgId: string | undefined;
      let stuCode: string | undefined;
      if (queueId.startsWith('q_')) {
        const parts = queueId.slice(2).split('_');
        if (parts.length >= 2) {
          stuCode = parts.pop();
          asgId = parts.join('_');
        }
      } else if (queueId.includes('_')) {
        const parts = queueId.split('_');
        if (parts.length >= 2) {
          stuCode = parts.pop();
          asgId = parts.join('_');
        }
      }
      if (asgId && stuCode) {
        sgsRosterAndSubmissionService.gradeSubmission(asgId, stuCode, score, 'GRADED', feedback);
      }
    }

    // หางานถัดไปที่ยังรอตรวจ (ค้นหาเดินหน้า forward ก่อนเสมอ ไม่วนกลับไปข้อ 1 ที่ข้ามมา)
    const targetIdx = list.findIndex(
      (i) =>
        i.id === queueId ||
        i.id === `q_${queueId}` ||
        `${i.assignmentId}_${i.studentCode}` === queueId.replace(/^q_/, '')
    );
    const startIdx = fromIndex !== undefined && fromIndex >= 0 ? fromIndex : targetIdx;
    const forwardList = startIdx >= 0 ? updated.slice(startIdx + 1) : [];
    const nextPending =
      forwardList.find((it) => it.status === 'PENDING_REVIEW') ||
      updated.find((it) => it.status === 'PENDING_REVIEW' && it.id !== queueId) ||
      null;

    return { updatedQueue: updated, nextPendingItem: nextPending };
  },

  updateQueueItemFile(
    queueId: string,
    fileUrl: string
  ): GradingQueueItem | null {
    const list = this.getGradingQueue();
    let updatedItem: GradingQueueItem | null = null;
    const updated: GradingQueueItem[] = list.map((item) => {
      const isIdMatch = item.id === queueId || item.id === `q_${queueId}`;
      const isPairMatch =
        (queueId.startsWith('q_') && queueId.slice(2) === `${item.assignmentId}_${item.studentCode}`) ||
        queueId === `${item.assignmentId}_${item.studentCode}`;

      if (isIdMatch || isPairMatch) {
        const newItem: GradingQueueItem = {
          ...item,
          filePreviewUrl: fileUrl,
        };
        updatedItem = newItem;
        return newItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveGradingQueue(updated);
    }
    return updatedItem;
  },

  returnSubmission(
    queueId: string,
    reason: string,
    feedback?: string
  ): { updatedQueue: GradingQueueItem[]; nextPendingItem: GradingQueueItem | null } {
    const list = this.getGradingQueue();
    let targetItem: GradingQueueItem | null = null;
    const note = `[ส่งงานกลับเนื่องจาก: ${reason}] ${feedback || ''}`.trim();
    const updated = list.map((item) => {
      const isPairMatch =
        (queueId.startsWith('q_') && queueId.slice(2) === `${item.assignmentId}_${item.studentCode}`) ||
        queueId === `${item.assignmentId}_${item.studentCode}`;
      if (item.id === queueId || item.id === `q_${queueId}` || isPairMatch) {
        targetItem = {
          ...item,
          status: 'RETURNED' as any,
          score: null,
          teacherFeedback: note,
        };
        return targetItem;
      }
      return item;
    });

    this.saveGradingQueue(updated);

    if (targetItem && (targetItem as GradingQueueItem).assignmentId && (targetItem as GradingQueueItem).studentCode) {
      sgsRosterAndSubmissionService.returnSubmissionForRevision(
        (targetItem as GradingQueueItem).assignmentId,
        (targetItem as GradingQueueItem).studentCode,
        reason,
        feedback
      );
    } else {
      let asgId: string | undefined;
      let stuCode: string | undefined;
      if (queueId.startsWith('q_')) {
        const parts = queueId.slice(2).split('_');
        if (parts.length >= 2) {
          stuCode = parts.pop();
          asgId = parts.join('_');
        }
      } else if (queueId.includes('_')) {
        const parts = queueId.split('_');
        if (parts.length >= 2) {
          stuCode = parts.pop();
          asgId = parts.join('_');
        }
      }
      if (asgId && stuCode) {
        sgsRosterAndSubmissionService.returnSubmissionForRevision(asgId, stuCode, reason, feedback);
      }
    }

    const nextPending = updated.find((it) => it.status === 'PENDING_REVIEW') || null;
    return { updatedQueue: updated, nextPendingItem: nextPending };
  },

  // ==========================================================================
  // Assignment Bundle Methods (สั่งงานรวม & เฉลี่ยคะแนนอัตโนมัติ)
  // ==========================================================================
  getBundle(): AssignmentBundleConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BUNDLE);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return cleanSlateService.isCleanSlateActive()
      ? {
          id: 'bundle-clean-default',
          subjectCode: '',
          classroom: '',
          title: 'ชุดการบ้านและภาระงานสะสม',
          description: 'ยังไม่มีชุดภาระงานสะสมในขณะนี้ สร้างภาระงานเพื่อเริ่มเก็บคะแนน',
          targetSgsColumn: 'คะแนนเก็บระหว่างภาค',
          maxScore: 10,
          totalTasks: 10,
          autoRoundUpHalf: true,
          students: [],
        }
      : buildInitialBundle();
  },

  saveBundle(bundle: AssignmentBundleConfig): AssignmentBundleConfig {
    localStorage.setItem(STORAGE_KEY_BUNDLE, JSON.stringify(bundle));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-bundle-updated'));
    }
    return bundle;
  },

  updateBundleRoundUpSetting(autoRoundUpHalf: boolean): AssignmentBundleConfig {
    const bundle = this.getBundle();
    const updatedStudents = bundle.students.map((st) => {
      const calc = calculateBundleScore(
        st.completedTasksCount,
        bundle.totalTasks,
        bundle.maxScore,
        autoRoundUpHalf
      );
      return {
        ...st,
        rawScore: calc.rawScore,
        finalScore: calc.finalScore,
        isRoundedUp: calc.isRoundedUp,
      };
    });

    const nextBundle: AssignmentBundleConfig = {
      ...bundle,
      autoRoundUpHalf,
      students: updatedStudents,
    };
    return this.saveBundle(nextBundle);
  },

  updateStudentTaskCompletion(
    studentCode: string,
    taskIndex: number,
    isCompleted: boolean
  ): AssignmentBundleConfig {
    const bundle = this.getBundle();
    const updatedStudents = bundle.students.map((st) => {
      if (st.studentCode !== studentCode) return st;

      const nextChecklist = [...st.tasksChecklist];
      nextChecklist[taskIndex] = isCompleted;
      const doneCount = nextChecklist.filter(Boolean).length;
      const calc = calculateBundleScore(
        doneCount,
        bundle.totalTasks,
        bundle.maxScore,
        bundle.autoRoundUpHalf
      );

      return {
        ...st,
        tasksChecklist: nextChecklist,
        completedTasksCount: doneCount,
        rawScore: calc.rawScore,
        finalScore: calc.finalScore,
        isRoundedUp: calc.isRoundedUp,
        lastUpdated: 'วันนี้',
      };
    });

    return this.saveBundle({ ...bundle, students: updatedStudents });
  },

  setStudentCompletedCountDirect(
    studentCode: string,
    completedCount: number
  ): AssignmentBundleConfig {
    const bundle = this.getBundle();
    const clamped = Math.min(bundle.totalTasks, Math.max(0, completedCount));

    const updatedStudents = bundle.students.map((st) => {
      if (st.studentCode !== studentCode) return st;

      const nextChecklist = Array.from({ length: bundle.totalTasks }, (_, i) => i < clamped);
      const calc = calculateBundleScore(
        clamped,
        bundle.totalTasks,
        bundle.maxScore,
        bundle.autoRoundUpHalf
      );

      return {
        ...st,
        completedTasksCount: clamped,
        tasksChecklist: nextChecklist,
        rawScore: calc.rawScore,
        finalScore: calc.finalScore,
        isRoundedUp: calc.isRoundedUp,
        lastUpdated: 'วันนี้',
      };
    });

    return this.saveBundle({ ...bundle, students: updatedStudents });
  },

  getDynamicTeachingSubjects(teacherIdOrName?: string) {
    return getDynamicTeachingSubjects(teacherIdOrName);
  },

  getTeacherTaughtClassrooms(subjectCode?: string, teacherIdOrName?: string) {
    return getTeacherTaughtClassrooms(subjectCode, teacherIdOrName);
  },

  resetAllDemoData(): void {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
    localStorage.removeItem(STORAGE_KEY_BUNDLE);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      window.dispatchEvent(new CustomEvent('kp-bundle-updated'));
    }
  },
};
