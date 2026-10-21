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
import { coursesCurriculumService } from './coursesCurriculumService.ts';
import { studentService, formatClassroomLabel } from './studentService.ts';
import { classroomService } from './classroomService.ts';
import { authService } from './authService.ts';
import { sgsRosterAndSubmissionService, formatSubmissionTimestamp } from './sgsRosterAndSubmissionService.ts';
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
    return curriculumCourses.map((c, idx) => ({
      code: c.code,
      name: c.name,
      courseCode: c.code,
      courseName: c.name,
      termLabel: `${c.term || '2'}/${c.academicYear || '2569'}`,
      shortName: c.name.length > 15 ? `${c.name.slice(0, 15)}...` : c.name,
      classrooms:
        c.assignedClassrooms && c.assignedClassrooms.length > 0
          ? c.assignedClassrooms
          : fallbackRooms,
      credits: Number(c.credits) || 1.0,
      colorBadge: colorMap[idx % 5] || 'bg-blue-100 text-blue-800 border-blue-300',
    }));
  }

  // หากไม่มีวิชาในหลักสูตร ให้ส่งค่าว่าง [] เพื่อไม่ให้มี fake mock subjects
  return [];
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
export type SubmissionChannelType = 'IMAGE_UPLOAD' | 'PDF_UPLOAD' | 'LINK_URL';

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
  status: 'PENDING_REVIEW' | 'GRADED';
  score?: number | null;
  teacherFeedback?: string;
  gradedAtText?: string;
  studentAvatarUrl?: string;
  academicYearTerm?: string;
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
        const pairKey = `${sub.assignmentId}_${sub.studentCode}`;
        handledKeys.add(pairKey);
        handledKeys.add(sub.assignmentId);

        const savedMatch = savedMap.get(pairKey) || savedMap.get(`q_${pairKey}`);
        const asg = termAssignments.find((a) => a.id === sub.assignmentId);
        const subCode = sub.studentCode.trim();
        const stu = studentMap.get(subCode);
        const foundInService = studentService.findStudentByCode(subCode);

        const isGraded = sub.status === 'GRADED' || (savedMatch && savedMatch.status === 'GRADED');
        const score = sub.score !== null && sub.score !== undefined ? sub.score : savedMatch?.score ?? null;
        const feedback = sub.teacherFeedback || savedMatch?.teacherFeedback || '';

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

        const realClassroom =
          foundInService?.classroomId
            ? formatClassroomLabel(foundInService.classroomId)
            : stu?.classroom
              ? formatClassroomLabel(stu.classroom)
              : savedMatch?.classroom || 'ม.3/1';

        const realSeatNo =
          foundInService?.student.no ?? stu?.sgsSeatNo ?? stu?.no ?? savedMatch?.seatNo ?? (idx + 1);

        const cleanSavedUrl = resolveFileUrl(savedMatch?.filePreviewUrl);

        const effectiveFileName = savedMatch?.fileName || cleanFileName || sub.workAttachmentLabel;

        const cachedDirectUrl = sgsRosterAndSubmissionService.getSubmissionFileUrl(
          sub.assignmentId,
          subCode,
          effectiveFileName
        );

        const realFileUrl =
          resolveFileUrl(sub.fileDataUrl) ||
          cachedDirectUrl ||
          cleanSavedUrl ||
          undefined;

        const subTimestamp =
          sub.submittedAt && !isNaN(new Date(sub.submittedAt).getTime())
            ? new Date(sub.submittedAt).getTime()
            : savedMatch?.submittedTimestamp || (Date.now() - idx * 60000);

        const queueItem: GradingQueueItem = {
          id: savedMatch?.id || `q_${pairKey}`,
          queueNo: savedMatch?.queueNo || idx + 1,
          subjectCode: asg?.courseCode || savedMatch?.subjectCode || 'ท23102',
          subjectName: asg?.courseName || savedMatch?.subjectName || 'รายวิชา',
          classroom: realClassroom,
          seatNo: realSeatNo,
          studentCode: subCode,
          studentName: realStudentName,
          assignmentId: sub.assignmentId,
          assignmentTitle: asg?.title || sub.workTitle || savedMatch?.assignmentTitle || 'ชิ้นงานที่มอบหมาย',
          sgsUnit: asg?.sgsUnitLabel || asg?.unitTitle || savedMatch?.sgsUnit || 'คะแนนเก็บระหว่างภาค',
          maxScore: asg?.maxScore || savedMatch?.maxScore || 10,
          submittedAtText: formatSubmissionTimestamp(sub.submittedAt || subTimestamp),
          submittedTimestamp: subTimestamp,
          submissionChannel: savedMatch?.submissionChannel || channel,
          filePreviewUrl: realFileUrl,
          fileName: savedMatch?.fileName || cleanFileName,
          externalLinkUrl: sub.externalLinkUrl || savedMatch?.externalLinkUrl,
          externalPlatform: platform || savedMatch?.externalPlatform,
          status: isGraded ? 'GRADED' : 'PENDING_REVIEW',
          score,
          teacherFeedback: feedback,
          gradedAtText: savedMatch?.gradedAtText,
          studentAvatarUrl: savedMatch?.studentAvatarUrl || (stu as any)?.avatarUrl || (foundInService?.student as any)?.avatarUrl,
          academicYearTerm: sub.academicYearTerm || '1/2569',
        };

        mergedQueue.push(queueItem);
      });

      // 2. นำงานที่อยู่ใน savedItems แต่ไม่ได้อยู่ใน realSubs (ถ้ามี) เข้ามา (กรอง ghost queue items ที่ไม่มีใน termAssignments ออก)
      savedItems.forEach((it) => {
        const pairKey = `${it.assignmentId}_${it.studentCode}`;
        if (!handledKeys.has(pairKey) && !handledKeys.has(it.id)) {
          if (termAssignments.length > 0 && it.assignmentId) {
            const exists = termAssignments.some((a) => a.id === it.assignmentId);
            if (!exists) return;
          }
          // Rehydrate filePreviewUrl if missing or contains storage.kps.ac.th
          let previewUrl = resolveFileUrl(it.filePreviewUrl);
          if (!previewUrl) {
            previewUrl = sgsRosterAndSubmissionService.getSubmissionFileUrl(it.assignmentId, it.studentCode, it.fileName);
          }
          mergedQueue.push({
            ...it,
            filePreviewUrl: previewUrl,
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
    feedback: string
  ): { updatedQueue: GradingQueueItem[]; nextPendingItem: GradingQueueItem | null } {
    const list = this.getGradingQueue();
    let targetItem: GradingQueueItem | null = null;
    const updated = list.map((item) => {
      if (item.id === queueId || item.id === `q_${queueId}`) {
        targetItem = {
          ...item,
          status: 'GRADED' as const,
          score,
          teacherFeedback: feedback.trim(),
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
        'GRADED'
      );
    }

    // หางานถัดไปที่ยังรอตรวจ (FIFO)
    const nextPending = updated.find((it) => it.status === 'PENDING_REVIEW') || null;

    return { updatedQueue: updated, nextPendingItem: nextPending };
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
      if (item.id === queueId || item.id === `q_${queueId}`) {
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

  resetAllDemoData(): void {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
    localStorage.removeItem(STORAGE_KEY_BUNDLE);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      window.dispatchEvent(new CustomEvent('kp-bundle-updated'));
    }
  },
};
