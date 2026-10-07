// ============================================================================
// Teacher Multi-Subject, Classroom Matrix, FIFO Grading Queue, & Assignment Bundle Service
// รองรับ:
// 1. ครูสอนหลายรายวิชา หลายห้อง (สลับวิชาและห้องได้อิสระ)
// 2. แยกเช็คแถวเช้าเฉพาะห้องที่ปรึกษา (ม.3/1) ออกจากเช็คชื่อเข้าเรียนรายวิชา
// 3. หน้าคิวตรวจงานนักเรียน (FIFO ใครส่งก่อนอยู่บนสุด) พร้อมปุ่ม Preview รูปภาพ/PDF และลิงก์ Canva/Docs
// 4. ตารางเช็คงานรายห้อง 3 สีชัดเจน: 🔴 แดง (ยังไม่ส่ง) | 🟠 ส้ม (รอตรวจ) | 🟢 เขียว (ส่งแล้ว/ตรวจแล้ว)
// 5. ระบบหมวดหมู่งานรวม สั่ง 20 งาน ส่ง 10 ได้ 5 คะแนน พร้อมสูตรเฉลี่ยและสวิตช์ปัดทศนิยม >= 0.5 อัตโนมัติ
// ============================================================================

export interface TeachingSubjectInfo {
  code: string;
  name: string;
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

export const TEACHER_SUBJECTS_LIST: TeachingSubjectInfo[] = [
  {
    code: 'ญ31201',
    name: 'ภาษาญี่ปุ่น 1',
    shortName: 'ภาษาญี่ปุ่น ม.3',
    classrooms: ['ม.3/1', 'ม.3/2'],
    credits: 1.5,
    colorBadge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    code: 'ศ23101',
    name: 'ศิลปะ 3 (ทัศนศิลป์)',
    shortName: 'ศิลปะ ม.3',
    classrooms: ['ม.3/1', 'ม.3/2'],
    credits: 1.5,
    colorBadge: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    code: 'ศ20223',
    name: 'ดนตรีสากลปฏิบัติ',
    shortName: 'ดนตรี ม.2',
    classrooms: ['ม.2/1', 'ม.2/2'],
    credits: 1.0,
    colorBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    code: 'ศ20221',
    name: 'ดนตรี-นาฏศิลป์ไทย',
    shortName: 'นาฏศิลป์ ม.1',
    classrooms: ['ม.1/8', 'ม.1/2'],
    credits: 1.0,
    colorBadge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'อ23101',
    name: 'ภาษาอังกฤษเพื่อการสื่อสาร 5',
    shortName: 'ภาษาอังกฤษ ม.3',
    classrooms: ['ม.3/1', 'ม.3/2'],
    credits: 1.5,
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
];

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
// INITIAL MOCK DATA
// ============================================================================

const INITIAL_QUEUE_ITEMS: GradingQueueItem[] = [
  {
    id: 'queue-1',
    queueNo: 1,
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    classroom: 'ม.3/1',
    seatNo: 1,
    studentCode: '45101',
    studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    assignmentId: 'asg-5',
    assignmentTitle: 'ชิ้นงานที่ 5: ศิลปะร่วมสมัยไทย (จิตรกรรมสีน้ำ)',
    sgsUnit: 'หน่วยที่ 3',
    maxScore: 15,
    submittedAtText: '24 ก.ย. 15:30 น.',
    submittedTimestamp: 1727166600000,
    submissionChannel: 'IMAGE_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&q=80',
    fileName: 'ลายไทยประยุกต์ร่วมสมัย_กฤษณะ.jpg',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-2',
    queueNo: 2,
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    classroom: 'ม.3/1',
    seatNo: 2,
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    assignmentId: 'asg-5',
    assignmentTitle: 'ชิ้นงานที่ 5: ศิลปะร่วมสมัยไทย (Canva โปสเตอร์)',
    sgsUnit: 'หน่วยที่ 3',
    maxScore: 15,
    submittedAtText: '25 ก.ย. 08:15 น.',
    submittedTimestamp: 1727226900000,
    submissionChannel: 'LINK_URL',
    externalLinkUrl: 'https://www.canva.com/design/DAFkutchap-art3/view',
    externalPlatform: 'CANVA',
    fileName: 'Canva โปสเตอร์ศิลปวัฒนธรรมกุดจับ',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-3',
    queueNo: 3,
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    classroom: 'ม.3/1',
    seatNo: 6,
    studentCode: '45112',
    studentName: 'ด.ญ. พิมพ์ชนก วงศ์ใหญ่',
    assignmentId: 'asg-4',
    assignmentTitle: 'ชิ้นงานที่ 4: ออกแบบโปสเตอร์รักษ์สิ่งแวดล้อม',
    sgsUnit: 'หน่วยที่ 2',
    maxScore: 10,
    submittedAtText: '25 ก.ย. 09:40 น.',
    submittedTimestamp: 1727232000000,
    submissionChannel: 'IMAGE_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
    fileName: 'Poster_SaveWorld_Green.png',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-4',
    queueNo: 4,
    subjectCode: 'ศ20223',
    subjectName: 'ดนตรีสากลปฏิบัติ',
    classroom: 'ม.2/1',
    seatNo: 4,
    studentCode: '46204',
    studentName: 'ด.ช. ภัทรพล สิทธิกร',
    assignmentId: 'asg-m2-1',
    assignmentTitle: 'บันทึกวิดีโอปฏิบัติคีย์บอร์ดเพลงพระราชนิพนธ์',
    sgsUnit: 'หน่วยที่ 2',
    maxScore: 10,
    submittedAtText: '25 ก.ย. 11:20 น.',
    submittedTimestamp: 1727238000000,
    submissionChannel: 'LINK_URL',
    externalLinkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    externalPlatform: 'YOUTUBE',
    fileName: 'คลิปสอบปฏิบัติเปียโน_ภัทรพล_ม2_1.mp4',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-5',
    queueNo: 5,
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ 3 (ทัศนศิลป์)',
    classroom: 'ม.3/2',
    seatNo: 5,
    studentCode: '45205',
    studentName: 'ด.ญ. กัญญารัตน์ โสภา',
    assignmentId: 'asg-5',
    assignmentTitle: 'ชิ้นงานที่ 5: ศิลปะร่วมสมัยไทย (PDF Portfolio)',
    sgsUnit: 'หน่วยที่ 3',
    maxScore: 15,
    submittedAtText: '25 ก.ย. 13:00 น.',
    submittedTimestamp: 1727244000000,
    submissionChannel: 'PDF_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80',
    fileName: 'ThaiContemporary_Art_Kanyarat.pdf',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-6',
    queueNo: 6,
    subjectCode: 'อ23101',
    subjectName: 'ภาษาอังกฤษเพื่อการสื่อสาร 5',
    classroom: 'ม.3/1',
    seatNo: 8,
    studentCode: '45118',
    studentName: 'ด.ญ. อคิราห์ วิรากร',
    assignmentId: 'asg-eng-3',
    assignmentTitle: 'Google Docs Essay: My Future Career in ASEAN',
    sgsUnit: 'หน่วยที่ 2',
    maxScore: 10,
    submittedAtText: '25 ก.ย. 14:15 น.',
    submittedTimestamp: 1727248500000,
    submissionChannel: 'LINK_URL',
    externalLinkUrl: 'https://docs.google.com/document/d/1sampleDocIdAkirah/edit',
    externalPlatform: 'GOOGLE_DOCS',
    fileName: 'MyFutureCareer_Akirah.gdoc',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-jp-1',
    queueNo: 7,
    subjectCode: 'ญ31201',
    subjectName: 'ภาษาญี่ปุ่น 1',
    classroom: 'ม.3/1',
    seatNo: 1,
    studentCode: '45101',
    studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    assignmentId: 'asg-jp-1',
    assignmentTitle: 'การบ้านบทที่ 1: คัดอักษรฮิรางานะ 46 ตัว (ไฟล์ PDF/รูปภาพ)',
    sgsUnit: 'หน่วยที่ 1',
    maxScore: 10,
    submittedAtText: '26 ก.ย. 08:30 น.',
    submittedTimestamp: 1727314200000,
    submissionChannel: 'IMAGE_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80',
    fileName: 'คัดฮิรางานะ_กฤษณะ.jpg',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-jp-2',
    queueNo: 8,
    subjectCode: 'ญ31201',
    subjectName: 'ภาษาญี่ปุ่น 1',
    classroom: 'ม.3/1',
    seatNo: 3,
    studentCode: '45103',
    studentName: 'ด.ช. ภูรินท์ บัณฑิต',
    assignmentId: 'asg-jp-2',
    assignmentTitle: 'ใบงานที่ 2: บทสนทนาทักทายภาษาญี่ปุ่นในชีวิตประจำวัน',
    sgsUnit: 'หน่วยที่ 1',
    maxScore: 10,
    submittedAtText: '26 ก.ย. 09:15 น.',
    submittedTimestamp: 1727316900000,
    submissionChannel: 'IMAGE_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&q=80',
    fileName: 'ใบงานทักทาย_ภูรินท์.png',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'queue-jp-3',
    queueNo: 9,
    subjectCode: 'ญ31201',
    subjectName: 'ภาษาญี่ปุ่น 1',
    classroom: 'ม.3/1',
    seatNo: 7,
    studentCode: '45107',
    studentName: 'ด.ช. ปรียาภรณ์ ชัยแก้ว',
    assignmentId: 'asg-jp-1',
    assignmentTitle: 'การบ้านบทที่ 1: คัดอักษรฮิรางานะ 46 ตัว',
    sgsUnit: 'หน่วยที่ 1',
    maxScore: 10,
    submittedAtText: '26 ก.ย. 10:00 น.',
    submittedTimestamp: 1727319600000,
    submissionChannel: 'IMAGE_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
    fileName: 'Hiragana_Preeyaporn.jpg',
    status: 'GRADED',
    score: 9.5,
    teacherFeedback: 'เขียนลายเส้นตัวอักษรสวยงามถูกต้องมาก 🌟',
    gradedAtText: '26 ก.ย. 11:30 น.',
  },
  {
    id: 'queue-jp-4',
    queueNo: 10,
    subjectCode: 'ญ31201',
    subjectName: 'ภาษาญี่ปุ่น 1',
    classroom: 'ม.3/2',
    seatNo: 2,
    studentCode: '45202',
    studentName: 'ด.ช. ภัทรดนัย บุญยัง',
    assignmentId: 'asg-jp-1',
    assignmentTitle: 'การบ้านบทที่ 1: คัดอักษรฮิรางานะ 46 ตัว',
    sgsUnit: 'หน่วยที่ 1',
    maxScore: 10,
    submittedAtText: '26 ก.ย. 11:45 น.',
    submittedTimestamp: 1727325900000,
    submissionChannel: 'PDF_UPLOAD',
    filePreviewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80',
    fileName: 'Hiragana_Pattaradanai_M32.pdf',
    status: 'PENDING_REVIEW',
  },
];

// นักเรียน ม.3/1 (เริ่มต้น 8 คนตัวอย่าง)
const STUDENTS_M31 = [
  { seatNo: 1, studentCode: '45101', studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์' },
  { seatNo: 2, studentCode: '45102', studentName: 'ด.ช. ทัตธน คำฝั้น' },
  { seatNo: 3, studentCode: '45107', studentName: 'ด.ช. ชัยมงคล วงศ์บุตร' },
  { seatNo: 4, studentCode: '45115', studentName: 'ด.ช. อัศวิน วนเกษตรกุล' },
  { seatNo: 5, studentCode: '45109', studentName: 'ด.ช. ณัฐวุฒิ สิทธิโชค' },
  { seatNo: 6, studentCode: '45105', studentName: 'ด.ญ. กมลชนก บุญสุข' },
  { seatNo: 7, studentCode: '45112', studentName: 'ด.ญ. พิมพ์ชนก วงศ์ใหญ่' },
  { seatNo: 8, studentCode: '45118', studentName: 'ด.ญ. อคิราห์ วิรากร' },
];

function buildInitialBundle(): AssignmentBundleConfig {
  const totalTasks = 20;
  const maxScore = 10;
  const autoRoundUp = true;

  // จำลองจำนวนงานที่ส่ง:
  // กฤษณะ: 20 งาน -> 10 คะแนน
  // ทัตธน: 18 งาน -> (18/20)*10 = 9 คะแนน
  // ชัยมงคล: 6 งาน -> (6/20)*10 = 3 คะแนน
  // อัศวิน: 10 งาน -> (10/20)*10 = 5 คะแนน
  // ณัฐวุฒิ: 15 งาน -> (15/20)*10 = 7.5 -> ปัดเป็น 8 คะแนน
  // กมลชนก: 19 งาน -> (19/20)*10 = 9.5 -> ปัดเป็น 10 คะแนน
  // พิมพ์ชนก: 13 งาน -> (13/20)*10 = 6.5 -> ปัดเป็น 7 คะแนน
  // อคิราห์: 11 งาน -> (11/20)*10 = 5.5 -> ปัดเป็น 6 คะแนน
  const completedSamples = [20, 18, 6, 10, 15, 19, 13, 11];

  const students: StudentBundleProgress[] = STUDENTS_M31.map((st, idx) => {
    const doneCount = completedSamples[idx % completedSamples.length];
    const calc = calculateBundleScore(doneCount, totalTasks, maxScore, autoRoundUp);
    const checklist = Array.from({ length: totalTasks }, (_, i) => i < doneCount);

    return {
      seatNo: st.seatNo,
      studentCode: st.studentCode,
      studentName: st.studentName,
      completedTasksCount: doneCount,
      rawScore: calc.rawScore,
      finalScore: calc.finalScore,
      isRoundedUp: calc.isRoundedUp,
      tasksChecklist: checklist,
      lastUpdated: '25 ก.ย. 69',
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
      if (raw) {
        const parsed: GradingQueueItem[] = JSON.parse(raw);
        // เรียง FIFO (เก่าสุด / ส่งก่อน อยู่บนสุด)
        return parsed.sort((a, b) => a.submittedTimestamp - b.submittedTimestamp);
      }
    } catch {
      // fallback
    }
    return INITIAL_QUEUE_ITEMS.sort((a, b) => a.submittedTimestamp - b.submittedTimestamp);
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
    const updated = list.map((item) => {
      if (item.id === queueId) {
        return {
          ...item,
          status: 'GRADED' as const,
          score,
          teacherFeedback: feedback.trim(),
          gradedAtText: 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return item;
    });

    this.saveGradingQueue(updated);

    // หางานถัดไปที่ยังรอตรวจ (FIFO)
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
    return buildInitialBundle();
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

  resetAllDemoData(): void {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
    localStorage.removeItem(STORAGE_KEY_BUNDLE);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
      window.dispatchEvent(new CustomEvent('kp-bundle-updated'));
    }
  },
};
