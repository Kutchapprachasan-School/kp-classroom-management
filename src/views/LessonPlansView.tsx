import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  Folder,
  FolderOpen,
  Calendar,
  Clock,
  Zap,
  CloudDownload,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Play,
  ExternalLink,
  MoreVertical,
  X,
  FileCheck,
  Sparkles,
  UploadCloud,
  Share2,
  Printer,
  Check,
  AlertCircle,
  Eye,
  Edit3,
  ArrowRight,
  Camera,
} from 'lucide-react';
import {
  TeacherSubjectBannerModal,
  getSubjectBannerUrl,
} from '../components/teacher/TeacherSubjectBannerModal';

// Data Types
export interface LessonFile {
  id: string;
  name: string;
  type: 'PDF' | 'PPTX' | 'DOCX' | 'MP4' | 'LINK';
  size: string;
  updatedAt: string;
  downloadUrl?: string;
  isOnlineView?: boolean;
}

export interface ExtraStudentFile {
  id: string;
  name: string;
  type: 'PDF' | 'YOUTUBE' | 'LINK';
  sizeOrSource: string;
  actionLabel: string;
  url?: string;
}

export interface ActivityMaterial {
  id: string;
  name: string;
  category: 'ใบงาน' | 'เกมการเรียนรู้' | 'คลิปเสียง' | 'แบบทดสอบ';
  size: string;
  format: string;
}

export interface WeekPlanData {
  week: number;
  unitNumber: number;
  title: string;
  description: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNING';
  statusLabel: string;
  teachingDates: string;
  dateShort: string;
  periods: number;
  objectives: string[];
  evaluations: {
    label: string;
    percentage: number;
    iconType: 'assignment' | 'activity' | 'exam';
  }[];
  files: LessonFile[];
  studentExtraFiles: ExtraStudentFile[];
  activityMaterials: ActivityMaterial[];
  reflection: {
    conductedDate: string;
    summary: string;
    problem: string;
    solution: string;
    recordedBy: string;
  };
}

export interface CourseOption {
  code: string;
  name: string;
  classroom: string;
  semester: string;
  totalWeeks: number;
  hoursPerWeek: number;
}

const COURSES: CourseOption[] = [
  {
    code: 'ญ32101',
    name: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    semester: 'ภาคเรียนที่ 1/2569',
    totalWeeks: 16,
    hoursPerWeek: 1.0,
  },
  {
    code: 'ญ32102',
    name: 'ภาษาญี่ปุ่น 2',
    classroom: 'ม.3/2',
    semester: 'ภาคเรียนที่ 1/2569',
    totalWeeks: 16,
    hoursPerWeek: 1.0,
  },
  {
    code: 'ญ31101',
    name: 'ภาษาญี่ปุ่นพื้นฐาน',
    classroom: 'ม.4/1',
    semester: 'ภาคเรียนที่ 1/2569',
    totalWeeks: 16,
    hoursPerWeek: 2.0,
  },
  {
    code: 'ศ23101',
    name: 'ศิลปะและดนตรี',
    classroom: 'ม.3/1',
    semester: 'ภาคเรียนที่ 1/2569',
    totalWeeks: 16,
    hoursPerWeek: 1.5,
  },
];

const WEEK_PLANS: WeekPlanData[] = [
  {
    week: 1,
    unitNumber: 1,
    title: 'บทที่ 1 : ปฐมนิเทศ และรู้จักภาษาญี่ปุ่น',
    description: 'แนะนำรายวิชา ความสำคัญของภาษาญี่ปุ่น และหลักการออกเสียงเบื้องต้น',
    status: 'DONE',
    statusLabel: 'ดำเนินการแล้ว',
    teachingDates: '13 พ.ค. 2569 – 17 พ.ค. 2569',
    dateShort: '13-17 พ.ค. 69',
    periods: 5,
    objectives: [
      'นักเรียนสามารถทักทายและแนะนำตนเองเป็นภาษาญี่ปุ่นได้',
      'นักเรียนสามารถอ่านและเขียนอักษรฮิรางานะได้',
      'นักเรียนมีความสนใจในการเรียนภาษาญี่ปุ่น',
    ],
    evaluations: [
      { label: 'แบบฝึกหัด / ใบงาน', percentage: 40, iconType: 'assignment' },
      { label: 'กิจกรรมในห้องเรียน', percentage: 30, iconType: 'activity' },
      { label: 'สอบปลายหน่วย', percentage: 30, iconType: 'exam' },
    ],
    files: [
      {
        id: 'f1',
        name: 'แผนการสอน_บทที่1_ปฐมนิเทศ.pdf',
        type: 'PDF',
        size: '1.2 MB',
        updatedAt: '12 พ.ค. 2569',
      },
      {
        id: 'f2',
        name: 'สไลด์ประกอบการสอน_บทที่1.pptx',
        type: 'PPTX',
        size: '8.6 MB',
        updatedAt: '12 พ.ค. 2569',
      },
      {
        id: 'f3',
        name: 'ใบความรู้_การออกเสียงภาษาญี่ปุ่น.docx',
        type: 'DOCX',
        size: '1.8 MB',
        updatedAt: '11 พ.ค. 2569',
      },
      {
        id: 'f4',
        name: 'วิดีโอสอน_การทักทายภาษาญี่ปุ่น.mp4',
        type: 'MP4',
        size: '45.3 MB',
        updatedAt: '11 พ.ค. 2569',
        isOnlineView: true,
      },
    ],
    studentExtraFiles: [
      {
        id: 'ef1',
        name: 'แบบฝึกหัดเพิ่มเติม (PDF)',
        type: 'PDF',
        sizeOrSource: '1.1 MB',
        actionLabel: 'ดาวน์โหลด',
      },
      {
        id: 'ef2',
        name: 'คำศัพท์ภาษาญี่ปุ่น (PDF)',
        type: 'PDF',
        sizeOrSource: '2.4 MB',
        actionLabel: 'ดาวน์โหลด',
      },
      {
        id: 'ef3',
        name: 'ลิงก์วิดีโอการออกเสียง',
        type: 'YOUTUBE',
        sizeOrSource: 'YouTube',
        actionLabel: 'เปิดลิงก์',
        url: 'https://youtube.com',
      },
    ],
    activityMaterials: [
      {
        id: 'act1',
        name: 'ใบงานที่ 1.1_ฝึกคัดอักษรฮิรางานะ 46 ตัว',
        category: 'ใบงาน',
        size: '2.1 MB',
        format: 'PDF',
      },
      {
        id: 'act2',
        name: 'เกมจับคู่คำศัพท์และเสียงอ่าน_Unit1',
        category: 'เกมการเรียนรู้',
        size: '3.4 MB',
        format: 'Interactive HTML',
      },
      {
        id: 'act3',
        name: 'คลิปเสียงบทสนทนาทักทายในชีวิตประจำวัน',
        category: 'คลิปเสียง',
        size: '8.5 MB',
        format: 'MP3 Audio',
      },
      {
        id: 'act4',
        name: 'แบบทดสอบสั้นท้ายคาบปฐมนิเทศ (Quiz)',
        category: 'แบบทดสอบ',
        size: '850 KB',
        format: 'PDF',
      },
    ],
    reflection: {
      conductedDate: '17 พ.ค. 2569',
      summary:
        'นักเรียนระดับชั้น ม.3/1 จำนวน 38 คน ให้ความสนใจในการฝึกออกเสียงคำทักทายภาษาญี่ปุ่นเป็นอย่างดี มีส่วนร่วมในการทำกิจกรรมแนะนำตนเอง สามารถจำและออกเสียงคำว่า "Konnichiwa", "Arigatou gozaimasu" ได้ถูกต้อง 92% ของห้อง',
      problem:
        'นักเรียนบางคนยังสับสนการลากเส้นตัวอักษร "あ" (A) กับ "お" (O) ในสมุดคัดลายมือ และเวลาฝึกพูดรายคนท้ายคาบค่อนข้างจำกัด',
      solution:
        'จัดทำคลิปสั้นแสดงลำดับการตวัดเส้น (Stroke Order) พร้อมภาพเคลื่อนไหวส่งให้นักเรียนใน Google Classroom/Line และเปิดให้ฝึกทบทวน 10 นาทีแรกของคาบถัดไป',
      recordedBy: 'นายปัญจพล เกษรัตน์ (ครูผู้สอน)',
    },
  },
  {
    week: 2,
    unitNumber: 2,
    title: 'บทที่ 2 : อักษรฮิรางานะ หมวดอะ-คะ-สะ',
    description: 'ฝึกจดจำรูปอักษร ลำดับเส้น และการประสมเสียงพื้นฐาน 15 ตัวแรก',
    status: 'IN_PROGRESS',
    statusLabel: 'กำลังดำเนินการ',
    teachingDates: '20 พ.ค. 2569 – 24 พ.ค. 2569',
    dateShort: '20-24 พ.ค. 69',
    periods: 5,
    objectives: [
      'นักเรียนสามารถเขียนอักษรฮิรางานะ หมวด อะ คะ สะ ได้ถูกต้องตามลำดับเส้น',
      'นักเรียนสามารถอ่านออกเสียงคำศัพท์พื้นฐานจากหมวด อะ คะ สะ ได้',
      'นักเรียนส่งสมุดคัดลายมือตามกำหนดเวลา',
    ],
    evaluations: [
      { label: 'สมุดคัดลายมือฮิรางานะ', percentage: 50, iconType: 'assignment' },
      { label: 'การอ่านออกเสียงรายบุคคล', percentage: 30, iconType: 'activity' },
      { label: 'การร่วมกิจกรรมบัตรคำ', percentage: 20, iconType: 'exam' },
    ],
    files: [
      {
        id: 'f2-1',
        name: 'แผนการสอน_บทที่2_ฮิรางานะตอนที่1.pdf',
        type: 'PDF',
        size: '1.4 MB',
        updatedAt: '18 พ.ค. 2569',
      },
      {
        id: 'f2-2',
        name: 'สไลด์ประกอบการสอน_ลำดับเส้นฮิรางานะ.pptx',
        type: 'PPTX',
        size: '12.4 MB',
        updatedAt: '19 พ.ค. 2569',
      },
      {
        id: 'f2-3',
        name: 'ตารางคัดตัวอักษร_อะ_คะ_สะ.docx',
        type: 'DOCX',
        size: '950 KB',
        updatedAt: '19 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [
      {
        id: 'ef2-1',
        name: 'สมุดคัดลายมือฉบับพิมพ์เอง (PDF)',
        type: 'PDF',
        sizeOrSource: '2.0 MB',
        actionLabel: 'ดาวน์โหลด',
      },
      {
        id: 'ef2-2',
        name: 'เพลงช่วยจำฮิรางานะ',
        type: 'YOUTUBE',
        sizeOrSource: 'YouTube',
        actionLabel: 'เปิดลิงก์',
        url: 'https://youtube.com',
      },
    ],
    activityMaterials: [
      {
        id: 'act2-1',
        name: 'เกมหมุนวงล้อสุ่มทายตัวอักษร',
        category: 'เกมการเรียนรู้',
        size: '1.2 MB',
        format: 'Web App',
      },
    ],
    reflection: {
      conductedDate: '24 พ.ค. 2569',
      summary:
        'นักเรียน 88% สามารถจำตัวอักษร 15 ตัวแรกได้แม่นยำขึ้นหลังทำกิจกรรมจับคู่บัตรคำ',
      problem: 'การเขียนตัว "さ" ยังมีนักเรียนลากเส้นติดกันแทนที่จะยกมือ',
      solution: 'แจกชีทลำดับเส้นที่มีลูกศรทิศทางกำกับชัดเจน',
      recordedBy: 'นายปัญจพล เกษรัตน์ (ครูผู้สอน)',
    },
  },
  {
    week: 3,
    unitNumber: 3,
    title: 'บทที่ 3 : อักษรฮิรางานะ หมวดทะ-นะ-ฮะ',
    description: 'ฝึกประสมคำศัพท์ และสนทนาการกล่าวขอบคุณ-ขอโทษ',
    status: 'PLANNING',
    statusLabel: 'วางแผนแล้ว',
    teachingDates: '27 พ.ค. 2569 – 31 พ.ค. 2569',
    dateShort: '27-31 พ.ค. 69',
    periods: 5,
    objectives: [
      'นักเรียนสามารถอ่านและเขียนอักษรหมวด ทะ นะ ฮะ ได้',
      'นักเรียนใช้สำนวน Sumimasen และ Arigatou ได้ถูกต้องตามบริบท',
    ],
    evaluations: [
      { label: 'ใบงานคำศัพท์', percentage: 40, iconType: 'assignment' },
      { label: 'บทสนทนาคู่', percentage: 40, iconType: 'activity' },
      { label: 'แบบทดสอบเขียนตามคำบอก', percentage: 20, iconType: 'exam' },
    ],
    files: [
      {
        id: 'f3-1',
        name: 'แผนการสอน_บทที่3.pdf',
        type: 'PDF',
        size: '1.1 MB',
        updatedAt: '25 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [
      {
        id: 'ef3-1',
        name: 'ชีทคำศัพท์หมวดทะนะฮะ (PDF)',
        type: 'PDF',
        sizeOrSource: '1.5 MB',
        actionLabel: 'ดาวน์โหลด',
      },
    ],
    activityMaterials: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน (กำหนดสอนสัปดาห์หน้า)',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์ (ครูผู้สอน)',
    },
  },
  {
    week: 4,
    unitNumber: 4,
    title: 'บทที่ 4 : อักษรฮิรางานะ หมวดมะ-ยะ-ระ-วะ และตัวสะกด ん',
    description: 'เรียนรู้อักษรจนครบ 46 ตัว พร้อมฝึกอ่านบทความสั้น',
    status: 'PLANNING',
    statusLabel: 'วางแผนแล้ว',
    teachingDates: '3 มิ.ย. 2569 – 7 มิ.ย. 2569',
    dateShort: '3-7 มิ.ย. 69',
    periods: 5,
    objectives: [
      'นักเรียนจดจำอักษรฮิรางานะครบทั้ง 46 ตัว',
      'นักเรียนสามารถอ่านคำศัพท์ที่มีตัวสะกด ん ได้ถูกต้อง',
    ],
    evaluations: [
      { label: 'แบบทดสอบฮิรางานะ 46 ตัว', percentage: 60, iconType: 'exam' },
      { label: 'กิจกรรม Speed Reading', percentage: 40, iconType: 'activity' },
    ],
    files: [
      {
        id: 'f4-1',
        name: 'แผนการสอน_บทที่4.pdf',
        type: 'PDF',
        size: '1.3 MB',
        updatedAt: '25 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [],
    activityMaterials: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    week: 5,
    unitNumber: 5,
    title: 'บทที่ 5 : เสียงขุ่น (Dakuon) และเสียงกึ่งขุ่น (Handakuon)',
    description: 'หลักการเติม Tenten ( ゛) และ Maru ( ゜)',
    status: 'PLANNING',
    statusLabel: 'วางแผนแล้ว',
    teachingDates: '10 มิ.ย. 2569 – 14 มิ.ย. 2569',
    dateShort: '10-14 มิ.ย. 69',
    periods: 5,
    objectives: [
      'นักเรียนเข้าใจการเปลี่ยนเสียงเมื่อเติม Tenten และ Maru',
      'สามารถอ่านออกเสียงเสียงขุ่น กะ สะ ดะ บะ ปะ ได้ถูกต้อง',
    ],
    evaluations: [
      { label: 'แบบฝึกหัดเสียงขุ่น', percentage: 50, iconType: 'assignment' },
      { label: 'การฟังและเขียนตามคำบอก', percentage: 50, iconType: 'exam' },
    ],
    files: [
      {
        id: 'f5-1',
        name: 'แผนการสอน_บทที่5.pdf',
        type: 'PDF',
        size: '1.2 MB',
        updatedAt: '25 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [],
    activityMaterials: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    week: 6,
    unitNumber: 6,
    title: 'บทที่ 6 : เสียงควบ (Yoon) และเสียงกัก (Sokuon)',
    description: 'การผสมอักษรตัวเล็ก ゃ ゅ ょ และ っ ในคำศัพท์ภาษาญี่ปุ่น',
    status: 'PLANNING',
    statusLabel: 'วางแผนแล้ว',
    teachingDates: '17 มิ.ย. 2569 – 21 มิ.ย. 2569',
    dateShort: '17-21 มิ.ย. 69',
    periods: 5,
    objectives: [
      'นักเรียนสามารถอ่านคำศัพท์ที่มีเสียงควบและเสียงกักได้',
    ],
    evaluations: [
      { label: 'แบบฝึกหัดเสียงควบ', percentage: 50, iconType: 'assignment' },
      { label: 'สอบย่อยกลางภาค', percentage: 50, iconType: 'exam' },
    ],
    files: [
      {
        id: 'f6-1',
        name: 'แผนการสอน_บทที่6.pdf',
        type: 'PDF',
        size: '1.2 MB',
        updatedAt: '25 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [],
    activityMaterials: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
];

// Generate remainder weeks 7-16
for (let w = 7; w <= 16; w++) {
  WEEK_PLANS.push({
    week: w,
    unitNumber: w,
    title: `บทที่ ${w} : การสื่อสารภาษาญี่ปุ่นและวัฒนธรรม หน่วยที่ ${w}`,
    description: `เนื้อหาและกิจกรรมการเรียนรู้ประจำสัปดาห์ที่ ${w}`,
    status: 'PLANNING',
    statusLabel: 'วางแผนแล้ว',
    teachingDates: `กำหนดสอนสัปดาห์ที่ ${w}`,
    dateShort: `สัปดาห์ ${w}`,
    periods: 5,
    objectives: [
      `นักเรียนเข้าใจจุดประสงค์การเรียนรู้ประจำสัปดาห์ที่ ${w}`,
      'นักเรียนมีส่วนร่วมในการทำกิจกรรมกลุ่มและฝึกพูด',
    ],
    evaluations: [
      { label: 'ภาระงาน / ใบงาน', percentage: 50, iconType: 'assignment' },
      { label: 'กิจกรรมการเรียนรู้', percentage: 50, iconType: 'activity' },
    ],
    files: [
      {
        id: `f${w}-1`,
        name: `แผนการสอน_สัปดาห์ที่${w}.pdf`,
        type: 'PDF',
        size: '1.2 MB',
        updatedAt: '25 พ.ค. 2569',
      },
    ],
    studentExtraFiles: [],
    activityMaterials: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  });
}

export const LessonPlansView: React.FC = () => {
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<'files' | 'activities' | 'reflection'>('files');
  const [fileFilter, setFileFilter] = useState<'ALL' | 'PDF' | 'PPTX' | 'DOCX' | 'MP4'>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Modals state
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isManageFilesModalOpen, setIsManageFilesModalOpen] = useState(false);
  const [isUnitDetailModalOpen, setIsUnitDetailModalOpen] = useState(false);
  const [isAllWeeksModalOpen, setIsAllWeeksModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<LessonFile | null>(null);

  // New Lesson Plan Form State
  const [newPlanUnit, setNewPlanUnit] = useState('บทที่ 2 : อักษรฮิรางานะ หมวดอะ คะ สะ');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanPeriods, setNewPlanPeriods] = useState(5);
  const [newPlanWeek, setNewPlanWeek] = useState(2);

  // Active Menu Dropdown for file rows
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);

  // Teacher Custom Subject Banner State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    const course = COURSES[selectedCourseIndex];
    if (course) {
      setCustomBannerUrl(getSubjectBannerUrl(course.code));
    }
  }, [selectedCourseIndex]);

  useEffect(() => {
    const handleBannerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ courseCode: string; bannerUrl: string | null }>;
      const currentCode = COURSES[selectedCourseIndex]?.code;
      if (customEvent.detail && customEvent.detail.courseCode.toLowerCase() === currentCode?.toLowerCase()) {
        setCustomBannerUrl(customEvent.detail.bannerUrl);
      }
    };
    window.addEventListener('kps-subject-banner-updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('kps-subject-banner-updated', handleBannerUpdate);
    };
  }, [selectedCourseIndex]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const currentCourse = COURSES[selectedCourseIndex];
  const currentWeekPlan = WEEK_PLANS.find((p) => p.week === activeWeek) || WEEK_PLANS[0];

  const filteredFiles = currentWeekPlan.files.filter((file) => {
    if (fileFilter === 'ALL') return true;
    return file.type === fileFilter;
  });

  // Solid colorful squircle badges matching the reference mockup
  const getFileBadge = (type: LessonFile['type']) => {
    switch (type) {
      case 'PDF':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
            PDF
          </div>
        );
      case 'PPTX':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
            PPT
          </div>
        );
      case 'DOCX':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
            DOC
          </div>
        );
      case 'MP4':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
            <Play className="w-4 h-4 fill-white text-white" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
            FILE
          </div>
        );
    }
  };

  const handleDownloadAll = () => {
    showToast(`กำลังจัดเตรียมไฟล์แผนการสอนทั้งหมด 16 สัปดาห์ (${currentCourse.code}) เป็นไฟล์ ZIP สำเร็จแล้ว!`);
  };

  const handleDownloadFile = (fileName: string, size: string) => {
    showToast(`เริ่มดาวน์โหลด ${fileName} (${size}) เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1440px] mx-auto pb-16 font-sans select-none animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          1. TOP HERO BANNER (Full width spanning across top)
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-blue-100/80 shadow-xs p-4 sm:p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        {/* Left Side: Icon & Title & Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-4 z-10 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              แผนการสอนและบันทึกหลังสอน (Lesson Plans)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 leading-relaxed truncate sm:whitespace-normal">
              จัดการแผนการสอนรายวิชา และไฟล์ประกอบการสอน เพื่อให้นักเรียนสามารถศึกษาเพิ่มเติมได้
            </p>
          </div>
        </div>

        {/* Center/Right Illustration: Anime teacher in classroom with bookshelves */}
        <div className="hidden md:flex items-center justify-end absolute right-52 lg:right-64 top-0 bottom-0 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/images/teacher/lesson_hero_teacher.png"
            alt="Anime Teacher in Classroom"
            className="h-full object-cover object-left opacity-95"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
            }}
          />
        </div>

        {/* Right Side: Action Buttons in Frosted Capsule */}
        <div className="flex items-center gap-2.5 z-10 shrink-0 self-start md:self-center bg-white/80 md:bg-white/90 backdrop-blur-xs p-1 md:p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setIsCreatePlanModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้างแผนการสอน</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManageFilesModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Folder className="w-4 h-4 text-blue-600" />
            <span>จัดการไฟล์</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (lg:grid-cols-12)
          Starting directly below Hero Banner to mirror the mockup!
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* --------------------------------------------------------
            LEFT COLUMN (lg:col-span-8) - Course Header, Week Carousel,
            Unit Details, Document Table, and Bottom Quote Banner
            -------------------------------------------------------- */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5 min-w-0">
          {/* Card 1: Course Header & Week Selector */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-4">
            {/* Course Info & Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              {/* Left: Course Title & Meta Chips */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    แผนการสอนรายวิชา {currentCourse.code} {currentCourse.name} {currentCourse.classroom}
                  </h2>
                </div>

                {/* Meta Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pl-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{currentCourse.semester}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentCourse.totalWeeks} สัปดาห์</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เวลาเรียน {currentCourse.hoursPerWeek.toFixed(1)} ชม./สัปดาห์</span>
                  </span>
                </div>
              </div>

              {/* Right: Course Selector & Download All */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start sm:self-center">
                {/* Course Selector Dropdown */}
                <div className="relative">
                  <div className="text-[10px] text-blue-600 font-bold mb-0.5 pl-1 hidden sm:block">
                    เลือกวิชาที่ต้องการ:
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/90 text-slate-800 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="text-[9px] text-slate-400 font-normal leading-none mb-0.5">
                        รหัสวิชา
                      </div>
                      <div className="leading-tight">
                        {currentCourse.code} : {currentCourse.name} {currentCourse.classroom}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                        isCourseDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCourseDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-40 space-y-1 animate-slide-up">
                      <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">
                        เลือกรายวิชาสอน
                      </div>
                      {COURSES.map((course, idx) => (
                        <button
                          key={course.code + course.classroom}
                          type="button"
                          onClick={() => {
                            setSelectedCourseIndex(idx);
                            setIsCourseDropdownOpen(false);
                            showToast(`สลับไปวิชา ${course.code} ${course.name} เรียบร้อยแล้ว`);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            selectedCourseIndex === idx
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate">
                              {course.code} : {course.name}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                selectedCourseIndex === idx ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              ห้อง {course.classroom} • {course.semester}
                            </div>
                          </div>
                          {selectedCourseIndex === idx && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Change Subject Banner Button */}
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap self-end"
                  title="อัปโหลดและปรับแต่งแบนเนอร์รายวิชา"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>เปลี่ยนแบนเนอร์วิชา</span>
                </button>

                {/* Download All Plan Button */}
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap self-end"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>ดาวน์โหลดแผนการสอนทั้งหมด</span>
                </button>
              </div>
            </div>

            {/* Custom Subject Banner Strip if set */}
            {customBannerUrl && (
              <div className="relative w-full h-32 sm:h-40 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                <img
                  src={customBannerUrl}
                  alt={`Banner for ${currentCourse.name}`}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3.5">
                  <span className="text-xs font-bold text-white drop-shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>แบนเนอร์ประจำรายวิชา {currentCourse.code}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-blue-600" />
                    <span>เปลี่ยนภาพ</span>
                  </button>
                </div>
              </div>
            )}

            {/* Week Timeline Carousel / Cards Row */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                {WEEK_PLANS.slice(0, 6).map((plan) => {
                  const isActive = activeWeek === plan.week;
                  return (
                    <button
                      key={plan.week}
                      type="button"
                      onClick={() => setActiveWeek(plan.week)}
                      className={`min-w-[115px] sm:min-w-[125px] p-2.5 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {plan.week === 1 ? (
                          <Calendar className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                        ) : (
                          <Users className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div className="text-xs font-extrabold leading-tight">
                        สัปดาห์ที่ {plan.week}
                      </div>
                      <div
                        className={`text-[10px] font-medium leading-tight ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {plan.week === 1 ? 'ปัจจุบัน' : plan.dateShort}
                      </div>
                    </button>
                  );
                })}

                {/* 16 Weeks Modal Opener Button */}
                <button
                  type="button"
                  onClick={() => setIsAllWeeksModalOpen(true)}
                  className="min-w-[70px] p-2 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center shadow-2xs shrink-0"
                  title="ดูแผนการสอนทั้งหมด 16 สัปดาห์"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-blue-600 leading-tight">16 สัปดาห์</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Unit Detail Card (Week 1 / Selected Week) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-3.5 transition-all">
            {/* Top row: Badge + Title + Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-2xs">
                  สัปดาห์ที่ {currentWeekPlan.week}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                  {currentWeekPlan.title}
                </h3>
              </div>

              {/* Status Pill */}
              <button
                type="button"
                onClick={() => setIsUnitDetailModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                  currentWeekPlan.status === 'DONE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : currentWeekPlan.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentWeekPlan.statusLabel} &gt;</span>
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              {currentWeekPlan.description}
            </p>

            {/* Chips & Detail Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-700 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>วันที่สอน {currentWeekPlan.teachingDates}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-700 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentWeekPlan.periods} คาบ</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsUnitDetailModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shadow-2xs"
              >
                <span>ดูรายละเอียด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Unit Tabs & File Table Section */}
          <div className="space-y-3">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'files'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ไฟล์ประกอบการสอน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'activities'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>สื่อกิจกรรม / ใบงาน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reflection')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reflection'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>บันทึกหลังสอน</span>
              </button>
            </div>

            {/* TAB 1: ไฟล์ประกอบการสอน (Tabular table matching mockup) */}
            {activeTab === 'files' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-2 transition-all">
                {/* Table Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ไฟล์เอกสารและสื่อการสอน
                  </h4>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <span>
                        {fileFilter === 'ALL'
                          ? 'ดูทั้งหมด'
                          : fileFilter === 'PDF'
                          ? 'เฉพาะ PDF'
                          : fileFilter === 'PPTX'
                          ? 'เฉพาะ PPTX'
                          : fileFilter === 'DOCX'
                          ? 'เฉพาะ DOCX'
                          : 'เฉพาะ MP4'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isFilterDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 z-30 space-y-0.5 text-xs">
                        {(['ALL', 'PDF', 'PPTX', 'DOCX', 'MP4'] as const).map((ft) => (
                          <button
                            key={ft}
                            type="button"
                            onClick={() => {
                              setFileFilter(ft);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              fileFilter === ft
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {ft === 'ALL' ? 'ดูทั้งหมด' : ft}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* File Table Rows */}
                <div className="divide-y divide-slate-100">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-blue-50/20 transition-all"
                    >
                      {/* Left: Badge + File Name */}
                      <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                        {getFileBadge(file.type)}
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="font-bold text-slate-800 text-xs sm:text-sm text-left truncate block hover:text-blue-600 transition-colors cursor-pointer"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                      </div>

                      {/* Desktop Middle Columns: Type, Size, Date */}
                      <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 font-medium shrink-0">
                        <span className="w-12 text-slate-500 font-semibold">{file.type}</span>
                        <span className="w-16 text-slate-500">{file.size}</span>
                        <span className="w-24 text-slate-500">{file.updatedAt}</span>
                      </div>

                      {/* Mobile Meta (if sm/md hidden) */}
                      <div className="flex md:hidden items-center gap-2 text-[10px] text-slate-400 pl-12 -mt-2">
                        <span className="font-semibold text-slate-500">{file.type}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.updatedAt}</span>
                      </div>

                      {/* Right: Action Button & More Menu */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {file.isOnlineView ? (
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>ดูออนไลน์</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file.name, file.size)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ดาวน์โหลด</span>
                          </button>
                        )}

                        {/* More Menu Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveFileMenuId((prev) => (prev === file.id ? null : file.id))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="ตัวเลือกเพิ่มเติม"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeFileMenuId === file.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-30 space-y-0.5 text-xs animate-slide-up">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewFile(file);
                                  setActiveFileMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>ดูตัวอย่างไฟล์</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDownloadFile(file.name, file.size);
                                  setActiveFileMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>ดาวน์โหลดไฟล์</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  showToast('คัดลอกลิงก์แชร์ให้นักเรียนเรียบร้อยแล้ว');
                                  setActiveFileMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>คัดลอกลิงก์แชร์</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  showToast('เปิดแบบฟอร์มแก้ไขชื่อไฟล์');
                                  setActiveFileMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>แก้ไขชื่อไฟล์</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredFiles.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      ไม่พบไฟล์ในหมวดหมู่นี้
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: สื่อกิจกรรม / ใบงาน */}
            {activeTab === 'activities' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-3 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    สื่อการเรียนรู้เชิงกิจกรรมและแบบฝึกปฏิบัติ
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsManageFilesModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มสื่อกิจกรรม</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentWeekPlan.activityMaterials.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-[10px]">
                          {act.category}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs leading-snug">
                          {act.name}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {act.format} • {act.size}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(act.name, act.size)}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>ดาวน์โหลด</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {currentWeekPlan.activityMaterials.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                      ยังไม่มีสื่อกิจกรรมในสัปดาห์นี้
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: บันทึกหลังสอน */}
            {activeTab === 'reflection' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-4 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      บันทึกผลการจัดการเรียนรู้ (บันทึกหลังสอน)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      วันที่บันทึก: {currentWeekPlan.reflection.conductedDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('เปิดฟอร์มแก้ไขบันทึกหลังสอน')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขบันทึก</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  {/* Results */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                    <div className="font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ผลการจัดกิจกรรมการเรียนรู้</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-6">
                      {currentWeekPlan.reflection.summary}
                    </p>
                  </div>

                  {/* Problems & Solutions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1.5">
                      <div className="font-bold text-rose-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>ปัญหา / อุปสรรค</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-6">
                        {currentWeekPlan.reflection.problem}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                      <div className="font-bold text-blue-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>ข้อเสนอแนะ / แนวทางแก้ไข</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-6">
                        {currentWeekPlan.reflection.solution}
                      </p>
                    </div>
                  </div>

                  {/* Sign off */}
                  <div className="pt-1 text-right text-xs text-slate-500 font-medium">
                    ลงชื่อ: <span className="font-bold text-slate-700">{currentWeekPlan.reflection.recordedBy}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Bottom Quote Banner (Inside Left Column below document table) */}
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-blue-100 shadow-2xs select-none">
            <img
              src="/images/teacher/lesson_bottom_quote_banner.png"
              alt="Japanese quote: ภาษาญี่ปุ่น... ไม่ใช่แค่ภาษา แต่คือกุญแจสู่โลกกว้าง"
              className="w-full h-auto object-cover block"
            />
          </div>
        </div>

        {/* --------------------------------------------------------
            RIGHT COLUMN (lg:col-span-4) - Widgets:
            1. สรุปเนื้อหาบทเรียน (Learning Objectives & Evaluations)
            2. ไฟล์เพิ่มเติมสำหรับนักเรียน (Extra Student Resources)
            -------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 min-w-0">
          {/* Widget 1: สรุปเนื้อหาบทเรียน */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                สรุปเนื้อหาบทเรียน
              </h4>
            </div>

            {/* Sub-section: จุดประสงค์การเรียนรู้ */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
                  🎯
                </div>
                <span>จุดประสงค์การเรียนรู้</span>
              </div>

              <div className="space-y-2">
                {currentWeekPlan.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section: การวัดและประเมินผล */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">
                  📋
                </div>
                <span>การวัดและประเมินผล</span>
              </div>

              <div className="space-y-2 text-xs">
                {currentWeekPlan.evaluations.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500">
                        {ev.iconType === 'assignment' ? '📄' : ev.iconType === 'activity' ? '👥' : '📅'}
                      </span>
                      <span className="font-medium text-slate-800">{ev.label}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{ev.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 2: ไฟล์เพิ่มเติมสำหรับนักเรียน */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 space-y-3.5">
            {/* Header */}
            <div className="space-y-0.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  ไฟล์เพิ่มเติมสำหรับนักเรียน
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 font-medium pl-10.5">
                ให้นักเรียนศึกษาเพิ่มเติมหลังเรียน
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-2.5">
              {currentWeekPlan.studentExtraFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/20 transition-all flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  {/* Left: Icon + Text */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {file.type === 'PDF' ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        PDF
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-xs truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {file.sizeOrSource}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (file.url) {
                        window.open(file.url, '_blank');
                      } else {
                        handleDownloadFile(file.name, file.sizeOrSource);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/80 text-[11px] font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    {file.type === 'YOUTUBE' ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{file.actionLabel}</span>
                  </button>
                </div>
              ))}

              {currentWeekPlan.studentExtraFiles.length === 0 && (
                <div className="py-4 text-center text-slate-400 text-xs">
                  ไม่มีไฟล์เพิ่มเติมในสัปดาห์นี้
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. INTERACTIVE MODALS
          ======================================================== */}

      {/* MODAL 1: สร้างแผนการสอนใหม่ */}
      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    สร้างแผนการสอนรายวิชาใหม่
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentCourse.code} : {currentCourse.name} ({currentCourse.classroom})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatePlanModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCreatePlanModalOpen(false);
                showToast(`บันทึกแผนการสอนสัปดาห์ที่ ${newPlanWeek} เรียบร้อยแล้ว!`);
              }}
              className="space-y-3.5 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สัปดาห์ที่สอน
                  </label>
                  <select
                    value={newPlanWeek}
                    onChange={(e) => setNewPlanWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-blue-600 transition-colors"
                  >
                    {[...Array(16)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        สัปดาห์ที่ {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนคาบ
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPlanPeriods}
                    onChange={(e) => setNewPlanPeriods(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหน่วยการเรียนรู้ / บทเรียน
                </label>
                <input
                  type="text"
                  required
                  value={newPlanUnit}
                  onChange={(e) => setNewPlanUnit(e.target.value)}
                  placeholder="เช่น บทที่ 2 : อักษรฮิรางานะ หมวดอะ คะ สะ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบาย / สาระสำคัญของบทเรียน
                </label>
                <textarea
                  rows={3}
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="ระบุภาพรวมและทักษะที่นักเรียนจะได้รับ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-blue-600 transition-colors resize-none"
                />
              </div>

              {/* Upload Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  แนบไฟล์เอกสารประกอบการสอน (PDF, PPTX, DOCX, MP4)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                  <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    รองรับไฟล์ขนาดสูงสุด 100 MB ต่อไฟล์
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  บันทึกแผนการสอน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: จัดการไฟล์ */}
      {isManageFilesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    จัดการคลังไฟล์และสื่อการสอน
                  </h3>
                  <p className="text-xs text-slate-400">
                    พื้นที่จัดเก็บ R2 Cloud Storage (ใช้ไป 56.9 MB / 10 GB)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManageFilesModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Meter */}
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>พื้นที่ R2 Cloud Storage ของวิชา {currentCourse.code}</span>
                <span className="text-blue-600">0.57%</span>
              </div>
              <div className="w-full h-2 bg-blue-200/50 rounded-full overflow-hidden">
                <div className="w-[1%] h-full bg-blue-600 rounded-full" />
              </div>
            </div>

            {/* Quick Upload */}
            <div className="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer hover:bg-blue-50/60 transition-colors">
              <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800">
                อัปโหลดไฟล์สื่อการสอนใหม่
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเบราว์เซอร์ไฟล์จากเครื่อง
              </div>
            </div>

            {/* Current Files List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {currentWeekPlan.files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileBadge(f.type)}
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {f.type} • {f.size} • {f.updatedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(f.name, f.size)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`ลบไฟล์ ${f.name} เรียบร้อยแล้ว`)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="ลบไฟล์"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManageFilesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ดูตัวอย่างไฟล์ (Preview Simulator) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileBadge(previewFile.type)}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg truncate">
                    {previewFile.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewFile.type} • {previewFile.size} • อัปเดตเมื่อ {previewFile.updatedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Viewer */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white min-h-[220px] flex flex-col items-center justify-center p-6 text-center space-y-3">
              {previewFile.type === 'MP4' ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  </div>
                  <div className="font-bold text-sm">วิดีโอสอนการทักทายภาษาญี่ปุ่น</div>
                  <div className="text-xs text-slate-400">ความยาว: 14 นาที 20 วินาที • ความละเอียด 1080p Full HD</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="font-bold text-sm">ตัวอย่างเอกสาร {previewFile.name}</div>
                  <div className="text-xs text-slate-400">
                    เอกสารประกอบการจัดการเรียนการสอน กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => showToast('คัดลอกลิงก์แชร์เรียบร้อยแล้ว')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadFile(previewFile.name, previewFile.size);
                    setPreviewFile(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ดูรายละเอียดโครงสร้างแผนการสอน */}
      {isUnitDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    รายละเอียดโครงสร้างแผนการสอน
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentCourse.code} • สัปดาห์ที่ {currentWeekPlan.week}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUnitDetailModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-slate-800 block text-xs mb-1">
                  ชื่อหน่วยและสาระการเรียนรู้
                </span>
                <p className="text-slate-600 font-medium">{currentWeekPlan.title}</p>
                <p className="text-slate-500 text-xs mt-1">{currentWeekPlan.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-slate-500 font-medium">ช่วงเวลาจัดการเรียนรู้</span>
                  <div className="font-bold text-blue-900 mt-0.5">
                    {currentWeekPlan.teachingDates}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-slate-500 font-medium">ระยะเวลาสอน</span>
                  <div className="font-bold text-blue-900 mt-0.5">
                    {currentWeekPlan.periods} คาบเรียน
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">
                  จุดประสงค์การเรียนรู้ (K, P, A)
                </span>
                <div className="space-y-1.5">
                  {currentWeekPlan.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUnitDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ตาราง 16 สัปดาห์ทั้งหมด */}
      {isAllWeeksModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    โครงสร้างแผนการสอนตลอดภาคเรียน (16 สัปดาห์)
                  </h3>
                  <p className="text-xs text-slate-400">
                    วิชา {currentCourse.code} {currentCourse.name} • {currentCourse.semester}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllWeeksModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
              {WEEK_PLANS.map((plan) => {
                const isSelected = activeWeek === plan.week;
                return (
                  <button
                    key={plan.week}
                    type="button"
                    onClick={() => {
                      setActiveWeek(plan.week);
                      setIsAllWeeksModalOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-blue-600">
                        สัปดาห์ที่ {plan.week}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          plan.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : plan.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {plan.statusLabel}
                      </span>
                    </div>

                    <div className="font-bold text-slate-800 text-xs line-clamp-1">
                      {plan.title}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {plan.periods} คาบ • {plan.files.length} ไฟล์
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAllWeeksModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Subject Banner Modal */}
      <TeacherSubjectBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        courseCode={currentCourse.code}
        courseName={currentCourse.name}
        currentBannerUrl={customBannerUrl}
        onBannerSaved={(newUrl) => {
          setCustomBannerUrl(newUrl);
          showToast(
            newUrl
              ? `บันทึกแบนเนอร์วิชา ${currentCourse.code} เรียบร้อยแล้ว (ขนาดไม่เกิน 150 KB)`
              : `คืนค่าแบนเนอร์วิชา ${currentCourse.code} เป็นค่าเริ่มต้นเรียบร้อย`
          );
        }}
      />
    </div>
  );
};
