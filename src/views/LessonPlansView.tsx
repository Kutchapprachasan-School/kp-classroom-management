import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit3,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Video,
  Eye,
  Copy,
  Printer,
  Sparkles,
  X,
  Download,
  Layers,
  FolderOpen,
  ClipboardList,
  Check,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { cleanSlateService } from '../services/cleanSlateService';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

// ==========================================
// DATA TYPES
// ==========================================
export type UnitStatus = 'DONE' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface EvaluationItem {
  id: string;
  title: string;
  weightPercent: number;
  criteria: string;
}

export interface UnitPlanItem {
  id: string;
  unitNumber: number;
  titleJa: string;
  titleTh: string;
  displayTitle: string;
  periods: number;
  periodDurationText: string;
  weekNumber: number;
  dateRange: string;
  status: UnitStatus;
  statusLabel: string;
  statusBadgeClass: string;
  circleColorClass: string;
  indicatorsSummary: string;
  courseCode: string;
  courseName: string;
  classroom: string;
  objectives: string[];
  evaluations: EvaluationItem[];
  files: {
    id: string;
    name: string;
    type: 'PDF' | 'PPTX' | 'DOCX' | 'MP4' | 'LINK';
    size: string;
    updatedAt: string;
    url?: string;
  }[];
  worksheets: {
    id: string;
    name: string;
    fullScore: number;
    submittedCount: number;
    totalCount: number;
    dueDate: string;
  }[];
  reflection: {
    conductedDate: string;
    summary: string;
    problem: string;
    solution: string;
    recordedBy: string;
  };
}

export interface CourseFilterOption {
  code: string;
  name: string;
  classroom: string;
  semester: string;
}

// ==========================================
// INITIAL MOCK DATA (Matching Mockup 100%)
// ==========================================
const INITIAL_COURSES: CourseFilterOption[] = [
  {
    code: 'ญ23101',
    name: 'ภาษาญี่ปุ่น ม.3/1',
    classroom: 'ม.3/1',
    semester: 'ภาคเรียนที่ 1/2569',
  },
  {
    code: 'ญ32101',
    name: 'ภาษาญี่ปุ่น ม.4/1',
    classroom: 'ม.4/1',
    semester: 'ภาคเรียนที่ 1/2569',
  },
  {
    code: 'ญ33101',
    name: 'ภาษาญี่ปุ่น ม.5/1',
    classroom: 'ม.5/1',
    semester: 'ภาคเรียนที่ 1/2569',
  },
];

const INITIAL_UNITS: UnitPlanItem[] = [
  {
    id: 'unit-1',
    unitNumber: 1,
    titleJa: '日常のあいさつ',
    titleTh: 'การทักทายประจำวัน',
    displayTitle: '日常のあいさつ (การทักทายประจำวัน)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 1,
    dateRange: 'สัปดาห์ที่ 1 (2 – 6 ต.ค. 2569)',
    status: 'DONE',
    statusLabel: 'เสร็จสิ้น',
    statusBadgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    circleColorClass: 'bg-blue-500',
    indicatorsSummary: '1.1 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. อธิบายและใช้คำทักทายพื้นฐานในชีวิตประจำวันได้ (ต 1.1 ม.3/1)',
      '2. ฟังและพูดโต้ตอบในการทักทายได้อย่างเหมาะสม (ต 2.1 ม.3/1)',
    ],
    evaluations: [
      { id: 'ev1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [
      {
        id: 'f1',
        name: 'แผนการสอน_หน่วยที่1_การทักทายประจำวัน.pdf',
        type: 'PDF',
        size: '1.4 MB',
        updatedAt: '2 ต.ค. 2569',
      },
      {
        id: 'f2',
        name: 'สไลด์ประกอบการสอน_คำทักทายและวัฒนธรรม.pptx',
        type: 'PPTX',
        size: '6.8 MB',
        updatedAt: '2 ต.ค. 2569',
      },
    ],
    worksheets: [
      {
        id: 'ws1',
        name: 'ใบงานที่ 1.1: ฝึกเขียนบทสนทนาทักทายยามเช้าและเย็น',
        fullScore: 10,
        submittedCount: 32,
        totalCount: 32,
        dueDate: '4 ต.ค. 2569',
      },
      {
        id: 'ws2',
        name: 'ใบงานที่ 1.2: คัดคำศัพท์ฮิรางานะหมวดการทักทาย',
        fullScore: 10,
        submittedCount: 31,
        totalCount: 32,
        dueDate: '6 ต.ค. 2569',
      },
    ],
    reflection: {
      conductedDate: '6 ต.ค. 2569',
      summary:
        'นักเรียนระดับชั้น ม.3/1 จำนวน 32 คน มีความกระตือรือร้นในการฝึกออกเสียงคำทักทาย สามารถใช้คำว่า "Konnichiwa" และ "Arigatou gozaimasu" ได้ถูกต้องตามสถานการณ์คิดเป็น 93% ของผู้เรียน',
      problem: 'นักเรียนบางคนยังสับสนระหว่างคำทักทายทางการกับคำทักทายเพื่อนสนิท',
      solution: 'จัดกิจกรรมบทบาทสมมติ (Role-play) โดยแบ่งสถานการณ์ระหว่างครูกับนักเรียน และเพื่อนกับเพื่อน',
      recordedBy: 'นายปัญจพล เกษรัตน์ (ครูผู้สอน)',
    },
  },
  {
    id: 'unit-2',
    unitNumber: 2,
    titleJa: '家族と友達',
    titleTh: 'ครอบครัวและเพื่อน',
    displayTitle: '家族と友達 (ครอบครัวและเพื่อน)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 2,
    dateRange: 'สัปดาห์ที่ 2 (9 – 13 ต.ค. 2569)',
    status: 'IN_PROGRESS',
    statusLabel: 'กำลังดำเนินการ',
    statusBadgeClass: 'bg-blue-50 text-blue-600 border-blue-200',
    circleColorClass: 'bg-purple-500',
    indicatorsSummary: '1.1 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. แนะนำสมาชิกในครอบครัวและเพื่อนสนิทเป็นภาษาญี่ปุ่นได้ (ต 1.1 ม.3/1)',
      '2. ใช้คำสรรพนามและคำแสดงความเป็นเจ้าของได้อย่างถูกต้อง (ต 2.1 ม.3/1)',
    ],
    evaluations: [
      { id: 'ev2-1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev2-2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev2-3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev2-4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [
      {
        id: 'f2-1',
        name: 'แผนการสอน_หน่วยที่2_ครอบครัวและเพื่อน.pdf',
        type: 'PDF',
        size: '1.2 MB',
        updatedAt: '8 ต.ค. 2569',
      },
    ],
    worksheets: [
      {
        id: 'ws2-1',
        name: 'ใบงานผังครอบครัว (Kazoku)',
        fullScore: 10,
        submittedCount: 28,
        totalCount: 32,
        dueDate: '12 ต.ค. 2569',
      },
    ],
    reflection: {
      conductedDate: 'กำลังดำเนินการสอน',
      summary: 'กำลังจัดการเรียนรู้ในหัวข้อคำเรียกบุคคลในครอบครัวของตนเองและผู้อื่น',
      problem: 'ยังไม่พบปัญหาที่เด่นชัด',
      solution: 'เน้นย้ำความแตกต่างระหว่าง ちち (พ่อฉัน) กับ おとうさん (พ่อคนอื่น)',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    id: 'unit-3',
    unitNumber: 3,
    titleJa: '学校生活',
    titleTh: 'ชีวิตในโรงเรียน',
    displayTitle: '学校生活 (ชีวิตในโรงเรียน)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 3,
    dateRange: 'สัปดาห์ที่ 3 (16 – 20 ต.ค. 2569)',
    status: 'NOT_STARTED',
    statusLabel: 'ยังไม่เริ่ม',
    statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    circleColorClass: 'bg-emerald-500',
    indicatorsSummary: '1.2 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. บอกชื่อวิชา สถานที่ และอุปกรณ์ในโรงเรียนได้ (ต 1.2 ม.3/1)',
      '2. ถามและบอกตารางเรียนประจำวันได้ (ต 2.1 ม.3/2)',
    ],
    evaluations: [
      { id: 'ev3-1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev3-2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev3-3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev3-4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [],
    worksheets: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน (กำหนดสัปดาห์ที่ 3)',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    id: 'unit-4',
    unitNumber: 4,
    titleJa: '食べ物と飲み物',
    titleTh: 'อาหารและเครื่องดื่ม',
    displayTitle: '食べ物と飲み物 (อาหารและเครื่องดื่ม)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 4,
    dateRange: 'สัปดาห์ที่ 4 (23 – 27 ต.ค. 2569)',
    status: 'NOT_STARTED',
    statusLabel: 'ยังไม่เริ่ม',
    statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    circleColorClass: 'bg-amber-500',
    indicatorsSummary: '1.1 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. สั่งอาหารและเครื่องดื่มในร้านอาหารญี่ปุ่นได้ (ต 1.1 ม.3/1)',
      '2. บอกความชอบและรสชาติของอาหารได้ (ต 1.3 ม.3/1)',
    ],
    evaluations: [
      { id: 'ev4-1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev4-2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev4-3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev4-4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [],
    worksheets: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    id: 'unit-5',
    unitNumber: 5,
    titleJa: '旅行',
    titleTh: 'การท่องเที่ยว',
    displayTitle: '旅行 (การท่องเที่ยว)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 5,
    dateRange: 'สัปดาห์ที่ 5 (30 ต.ค. – 3 พ.ย. 2569)',
    status: 'NOT_STARTED',
    statusLabel: 'ยังไม่เริ่ม',
    statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    circleColorClass: 'bg-rose-500',
    indicatorsSummary: '1.1 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. ถามทางและบอกทิศทางสถานที่ท่องเที่ยวในญี่ปุ่นได้ (ต 1.1 ม.3/1)',
      '2. ซื้อตั๋วรถไฟและสอบถามข้อมูลยานพาหนะได้ (ต 2.1 ม.3/1)',
    ],
    evaluations: [
      { id: 'ev5-1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev5-2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev5-3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev5-4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [],
    worksheets: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
  {
    id: 'unit-6',
    unitNumber: 6,
    titleJa: '文化と行事',
    titleTh: 'วัฒนธรรมและเทศกาล',
    displayTitle: '文化と行事 (วัฒนธรรมและเทศกาล)',
    periods: 4,
    periodDurationText: '4 คาบ (50 นาที/คาบ)',
    weekNumber: 6,
    dateRange: 'สัปดาห์ที่ 6 (6 – 10 พ.ย. 2569)',
    status: 'NOT_STARTED',
    statusLabel: 'ยังไม่เริ่ม',
    statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    circleColorClass: 'bg-teal-500',
    indicatorsSummary: '1.1 ตัวชี้วัด',
    courseCode: 'ญ23101',
    courseName: 'ภาษาญี่ปุ่น',
    classroom: 'ม.3/1',
    objectives: [
      '1. อธิบายประเพณีและเทศกาลสำคัญของญี่ปุ่นได้ (ต 2.1 ม.3/1)',
      '2. เปรียบเทียบวัฒนธรรมไทยกับวัฒนธรรมญี่ปุ่นได้อย่างถูกต้อง (ต 2.2 ม.3/1)',
    ],
    evaluations: [
      { id: 'ev6-1', title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
      { id: 'ev6-2', title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev6-3', title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
      { id: 'ev6-4', title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
    ],
    files: [],
    worksheets: [],
    reflection: {
      conductedDate: '-',
      summary: 'ยังไม่ได้ดำเนินการสอน',
      problem: '-',
      solution: '-',
      recordedBy: 'นายปัญจพล เกษรัตน์',
    },
  },
];

// ==========================================
// COMPONENT
// ==========================================
export const LessonPlansView: React.FC = () => {
  // Navigation & Selection States
  const [courses] = useState<CourseFilterOption[]>(INITIAL_COURSES);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState('ม.3/1');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('ภาคเรียนที่ 1/2569');
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Units list state
  const [units, setUnits] = useState<UnitPlanItem[]>(() => {
    return cleanSlateService.isCleanSlateActive() ? [] : INITIAL_UNITS;
  });
  const [selectedUnitId, setSelectedUnitId] = useState<string>('unit-1');
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'media' | 'worksheets' | 'reflection'>('info');

  // Mobile View Switcher Tab (units | detail | widgets)
  const [mobileTab, setMobileTab] = useState<'units' | 'detail' | 'widgets'>('detail');

  // Interactive Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditBasicInfoModalOpen, setIsEditBasicInfoModalOpen] = useState(false);
  const [isEditObjectivesModalOpen, setIsEditObjectivesModalOpen] = useState(false);
  const [isEditEvaluationsModalOpen, setIsEditEvaluationsModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isClassStatsModalOpen, setIsClassStatsModalOpen] = useState(false);
  const [isRelatedFilesModalOpen, setIsRelatedFilesModalOpen] = useState(false);

  // Forms State for Create Modal
  const [newUnitNumber, setNewUnitNumber] = useState(1);
  const [newTitleJa, setNewTitleJa] = useState('');
  const [newTitleTh, setNewTitleTh] = useState('');
  const [newPeriods, setNewPeriods] = useState(4);
  const [newDateRange, setNewDateRange] = useState('สัปดาห์ที่ 1');

  // Form State for Edit Basic Info
  const currentUnit = units.find((u) => u.id === selectedUnitId) || units[0] || null;
  const [editDisplayTitle, setEditDisplayTitle] = useState(currentUnit?.displayTitle || '');
  const [editPeriods, setEditPeriods] = useState(currentUnit?.periods || 4);
  const [editDateRange, setEditDateRange] = useState(currentUnit?.dateRange || '');

  // Form State for Edit Objectives
  const [editObjectives, setEditObjectives] = useState<string[]>(currentUnit?.objectives || []);

  // Form State for Edit Evaluations
  const [editEvaluations, setEditEvaluations] = useState<EvaluationItem[]>(currentUnit?.evaluations || []);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentCourse = courses[selectedCourseIndex] || courses[0];

  // Filtered units based on search
  const filteredUnits = units.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayTitle.toLowerCase().includes(q) ||
      u.titleJa.toLowerCase().includes(q) ||
      u.titleTh.toLowerCase().includes(q) ||
      `หน่วยที่ ${u.unitNumber}`.includes(q)
    );
  });

  // Calculate total evaluation weight
  const totalWeight = currentUnit.evaluations.reduce((sum, item) => sum + item.weightPercent, 0);

  // Synchronize edit form when currentUnit changes
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    const target = units.find((u) => u.id === unitId);
    if (target) {
      setEditDisplayTitle(target.displayTitle);
      setEditPeriods(target.periods);
      setEditDateRange(target.dateRange);
      setEditObjectives([...target.objectives]);
      setEditEvaluations([...target.evaluations]);
      // On mobile, switch to detail tab
      setMobileTab('detail');
    }
  };

  // Save Basic Info changes
  const handleSaveBasicInfo = () => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === currentUnit.id
          ? {
              ...u,
              displayTitle: editDisplayTitle,
              periods: editPeriods,
              periodDurationText: `${editPeriods} คาบ (50 นาที/คาบ)`,
              dateRange: editDateRange,
            }
          : u
      )
    );
    setIsEditBasicInfoModalOpen(false);
    showToast('✓ บันทึกข้อมูลพื้นฐานหน่วยการเรียนรู้เรียบร้อยแล้ว');
  };

  // Save Objectives changes
  const handleSaveObjectives = () => {
    setUnits((prev) =>
      prev.map((u) => (u.id === currentUnit.id ? { ...u, objectives: editObjectives } : u))
    );
    setIsEditObjectivesModalOpen(false);
    showToast('✓ อัปเดตตัวชี้วัด / ผลการเรียนรู้เรียบร้อยแล้ว');
  };

  // Save Evaluations changes
  const handleSaveEvaluations = () => {
    setUnits((prev) =>
      prev.map((u) => (u.id === currentUnit.id ? { ...u, evaluations: editEvaluations } : u))
    );
    setIsEditEvaluationsModalOpen(false);
    showToast('✓ อัปเดตโครงสร้างการประเมินผลเรียบร้อยแล้ว');
  };

  // Create New Unit
  const handleCreateNewUnit = () => {
    if (!newTitleTh.trim()) {
      alert('กรุณากรอกชื่อหน่วยการเรียนรู้ (ภาษาไทย)');
      return;
    }
    const newDisplayTitle = newTitleJa.trim()
      ? `${newTitleJa.trim()} (${newTitleTh.trim()})`
      : newTitleTh.trim();

    const newUnit: UnitPlanItem = {
      id: `unit-${Date.now()}`,
      unitNumber: newUnitNumber,
      titleJa: newTitleJa,
      titleTh: newTitleTh,
      displayTitle: newDisplayTitle,
      periods: newPeriods,
      periodDurationText: `${newPeriods} คาบ (50 นาที/คาบ)`,
      weekNumber: newUnitNumber,
      dateRange: newDateRange,
      status: 'NOT_STARTED',
      statusLabel: 'ยังไม่เริ่ม',
      statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      circleColorClass: 'bg-indigo-500',
      indicatorsSummary: '1.1 ตัวชี้วัด',
      courseCode: currentCourse.code,
      courseName: currentCourse.name,
      classroom: selectedClassroom,
      objectives: [
        `1. เข้าใจเนื้อหาและคำศัพท์ประจำหน่วยที่ ${newUnitNumber} ได้อย่างถูกต้อง`,
        '2. สามารถนำไปประยุกต์ใช้ในการสื่อสารได้',
      ],
      evaluations: [
        { id: `ev-${Date.now()}-1`, title: 'การมีส่วนร่วม', weightPercent: 20, criteria: 'สังเกตพฤติกรรม' },
        { id: `ev-${Date.now()}-2`, title: 'งาน/ใบงาน', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
        { id: `ev-${Date.now()}-3`, title: 'สอบย่อย', weightPercent: 30, criteria: 'ผ่านเกณฑ์ 70%' },
        { id: `ev-${Date.now()}-4`, title: 'สอบปลายหน่วย', weightPercent: 20, criteria: 'ผ่านเกณฑ์ 70%' },
      ],
      files: [],
      worksheets: [],
      reflection: {
        conductedDate: '-',
        summary: 'ยังไม่ได้ดำเนินการสอน',
        problem: '-',
        solution: '-',
        recordedBy: 'นายปัญจพล เกษรัตน์',
      },
    };

    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitId(newUnit.id);
    setIsCreateModalOpen(false);
    setNewTitleJa('');
    setNewTitleTh('');
    setNewUnitNumber((prev) => prev + 1);
    showToast(`✓ สร้างแผนการสอนหน่วยที่ ${newUnitNumber} สำเร็จ`);
  };

  // Copy unit handler
  const handleCopyUnit = () => {
    if (!currentUnit) {
      showToast('ยังไม่มีหน่วยการเรียนรู้ที่เลือก');
      return;
    }
    const clonedTitle = `${currentUnit.displayTitle} (สำเนา)`;
    const clonedUnit: UnitPlanItem = {
      ...currentUnit,
      id: `unit-copy-${Date.now()}`,
      unitNumber: units.length + 1,
      displayTitle: clonedTitle,
      status: 'NOT_STARTED',
      statusLabel: 'ยังไม่เริ่ม',
      statusBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    setUnits((prev) => [...prev, clonedUnit]);
    setIsCopyModalOpen(false);
    showToast(`✓ คัดลอกหน่วยการเรียนรู้ไปยังหน่วยที่ ${clonedUnit.unitNumber} เรียบร้อยแล้ว`);
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto pb-16 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up text-sm font-medium">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP HERO BANNER: Master PageHeroBanner Design       */}
      {/* ======================================================== */}
      <PageHeroBanner
        title="แผนการสอนและบันทึกหลังสอน (Lesson Plans)"
        subtitle="สร้างและจัดการแผนการสอนรายวิชา แบบหน่วยการเรียนรู้ พร้อมสื่อการสอนและประเมินผล"
        icon={<BookOpen className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="หลักสูตร 2569"
        tagText="📚 16 สัปดาห์ • ไฟล์เอกสาร • สื่อกิจกรรม • บันทึกหลังสอน"
        quoteLines={[
          'การสอนที่ดี',
          'คือการเปิดโลกแห่งโอกาส',
          'ให้กับนักเรียนทุกคน',
        ]}
      />

      {/* ======================================================== */}
      {/* 2. TOP FILTER & ACTION BAR                              */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* Action Button & Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* + สร้างแผนการสอนใหม่ */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างแผนการสอนใหม่</span>
            </button>

            {/* Dropdown 1: รหัสวิชา */}
            <div className="relative">
              <div className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">รหัสวิชา</div>
              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 min-w-[200px] transition-all cursor-pointer"
              >
                <span className="truncate">
                  {currentCourse.code} - {currentCourse.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {isCourseDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in">
                  {courses.map((c, idx) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCourseIndex(idx);
                        setIsCourseDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        idx === selectedCourseIndex ? 'text-blue-600 bg-blue-50/60 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>
                        {c.code} - {c.name}
                      </span>
                      {idx === selectedCourseIndex && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown 2: ห้องเรียน */}
            <div className="relative">
              <div className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">ห้องเรียน</div>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 min-w-[95px] transition-all cursor-pointer"
              >
                <span>{selectedClassroom}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isClassDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in">
                  {['ม.3/1', 'ม.3/2', 'ม.4/1'].map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => {
                        setSelectedClassroom(rm);
                        setIsClassDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 ${
                        selectedClassroom === rm ? 'text-blue-600 bg-blue-50/60 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {rm}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown 3: ภาคเรียน */}
            <div className="relative">
              <div className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">ภาคเรียน</div>
              <button
                type="button"
                onClick={() => setIsSemesterDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 min-w-[130px] transition-all cursor-pointer"
              >
                <span>{selectedSemester}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isSemesterDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in">
                  {['ภาคเรียนที่ 1/2569', 'ภาคเรียนที่ 2/2568'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => {
                        setSelectedSemester(sem);
                        setIsSemesterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 ${
                        selectedSemester === sem ? 'text-blue-600 bg-blue-50/60 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Box on Right */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาแผนการสอน / หน่วย..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MOBILE COLUMN SWITCHER TABS (Clean Ergonomics)           */}
      {/* ======================================================== */}
      <div className="flex lg:hidden items-center justify-between gap-1 bg-white p-1 rounded-xl border border-slate-200 mb-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('units')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'units'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📚 หน่วยการเรียนรู้ ({units.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('detail')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'detail'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📑 รายละเอียดหน่วย
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('widgets')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'widgets'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📊 ข้อมูลห้อง & สื่อ
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN THREE-COLUMN LAYOUT                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ====================================================== */}
        {/* COLUMN 1: หน่วยการเรียนรู้ (6 หน่วย)                   */}
        {/* ====================================================== */}
        <div
          className={`lg:col-span-3 space-y-3 ${
            mobileTab === 'units' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>หน่วยการเรียนรู้</span>
              <span className="text-xs font-semibold text-slate-500">({units.length} หน่วย)</span>
            </h2>
          </div>

          {/* 6 Unit Cards */}
          <div className="space-y-2.5">
            {filteredUnits.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">ยังไม่มีหน่วยการเรียนรู้</p>
                <p className="text-[11px] text-slate-400 mt-1">กดปุ่มสร้างแผนการสอนเพื่อเริ่มต้น</p>
              </div>
            ) : (
              filteredUnits.map((unit) => {
              const isSelected = unit.id === selectedUnitId;
              return (
                <div
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-100/80 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Colored Circle Number */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${unit.circleColorClass} text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      {unit.unitNumber}
                    </div>

                    {/* Unit Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-500">
                        หน่วยที่ {unit.unitNumber}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                        {unit.displayTitle}
                      </h3>

                      {/* Meta & Status Badge */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {unit.periods} คาบ • {unit.indicatorsSummary}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${unit.statusBadgeClass}`}
                        >
                          {unit.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <div className="shrink-0 self-center text-slate-400">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* ====================================================== */}
        {/* COLUMN 2: CENTER UNIT DETAILS (ข้อมูลหน่วย & แท็บย่อย) */}
        {/* ====================================================== */}
        <div
          className={`lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs ${
            mobileTab === 'detail' ? 'block' : 'hidden lg:block'
          }`}
        >
          {!currentUnit ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                ยังไม่มีแผนการสอนในรายวิชานี้
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-sm">
                เริ่มต้นสร้างแผนการสอน กำหนดหน่วยการเรียนรู้ วัตถุประสงค์ และแนบสื่อการสอนสำหรับนักเรียน
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ สร้างแผนการสอน</span>
              </button>
            </div>
          ) : (
            <>
              {/* Unit Top Header */}
              <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#163A66] truncate">
                    หน่วยที่ {currentUnit.unitNumber} : {currentUnit.displayTitle}
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${currentUnit.statusBadgeClass}`}
                >
                  🌱 {currentUnit.statusLabel}
                </span>
              </div>

          {/* 4 Sub-Tabs */}
          <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-200/80 pt-2 pb-0 overflow-x-auto no-scrollbar">
            {[
              { key: 'info', label: 'ข้อมูลหน่วย', icon: BookOpen },
              { key: 'media', label: 'สื่อการสอน / ไฟล์', icon: FolderOpen },
              { key: 'worksheets', label: 'ใบงาน', icon: FileSpreadsheet },
              { key: 'reflection', label: 'บันทึกหลังสอน', icon: FileCheck },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSubTab(tab.key as any)}
                  className={`flex items-center gap-1.5 py-2.5 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ข้อมูลหน่วย (Matching Mockup Column 2 100%) */}
          {activeSubTab === 'info' && (
            <div className="mt-4 space-y-4">
              {/* Section 1: ข้อมูลพื้นฐาน */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>ข้อมูลพื้นฐาน</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDisplayTitle(currentUnit.displayTitle);
                      setEditPeriods(currentUnit.periods);
                      setEditDateRange(currentUnit.dateRange);
                      setIsEditBasicInfoModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">รหัสวิชา:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.courseCode}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">รายวิชา:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.courseName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">ห้องเรียน:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.classroom}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">หน่วยที่:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.unitNumber}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium">ชื่อหน่วย:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{currentUnit.displayTitle}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">เวลาเรียน:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.periodDurationText}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium">ช่วงเวลา:</span>
                    <div className="font-bold text-slate-800 mt-0.5">{currentUnit.dateRange}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: ตัวชี้วัด / ผลการเรียนรู้ */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>ตัวชี้วัด / ผลการเรียนรู้</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditObjectives([...currentUnit.objectives]);
                      setIsEditObjectivesModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {currentUnit.objectives.map((obj, i) => (
                    <div key={i} className="text-xs text-slate-700 font-medium leading-relaxed">
                      {obj}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: การประเมินผล */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>การประเมินผล</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditEvaluations([...currentUnit.evaluations]);
                      setIsEditEvaluationsModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">รายการ</th>
                        <th className="py-2.5 px-3">น้ำหนักคะแนน</th>
                        <th className="py-2.5 px-3">เกณฑ์การประเมิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {currentUnit.evaluations.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{ev.title}</td>
                          <td className="py-2.5 px-3 font-bold text-blue-600">{ev.weightPercent}%</td>
                          <td className="py-2.5 px-3 text-slate-600">{ev.criteria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Score Bar */}
                <div className="mt-3 py-2 px-4 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center gap-2 text-xs font-extrabold text-blue-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>คะแนนรวม {totalWeight}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: สื่อการสอน / ไฟล์ */}
          {activeSubTab === 'media' && (
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  ไฟล์เอกสารและสื่อของหน่วยนี้ ({currentUnit.files.length} รายการ)
                </span>
                <button
                  type="button"
                  onClick={() => showToast('เปิดแบบฟอร์มอัปโหลดสื่อการสอน')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มไฟล์สื่อ</span>
                </button>
              </div>

              {currentUnit.files.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">ยังไม่มีไฟล์สื่อในหน่วยนี้</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUnit.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {file.type} • {file.size} • อัปเดต {file.updatedAt}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast(`กำลังดาวน์โหลด ${file.name}`)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ใบงาน */}
          {activeSubTab === 'worksheets' && (
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  รายการใบงานและภาระงาน ({currentUnit.worksheets.length} งาน)
                </span>
                <button
                  type="button"
                  onClick={() => showToast('สร้างใบงานใหม่สำหรับหน่วยนี้')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างใบงาน</span>
                </button>
              </div>

              {currentUnit.worksheets.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">ยังไม่มีใบงานในหน่วยนี้</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUnit.worksheets.map((ws) => (
                    <div
                      key={ws.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{ws.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          คะแนนเต็ม {ws.fullScore} • ส่งแล้ว {ws.submittedCount}/{ws.totalCount} คน • ครบกำหนด {ws.dueDate}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                        ตรวจแล้ว {ws.submittedCount} คน
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: บันทึกหลังสอน */}
          {activeSubTab === 'reflection' && (
            <div className="mt-4 space-y-3 animate-fade-in text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div>
                  <span className="text-slate-400 font-bold">วันที่ดำเนินการสอน:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{currentUnit.reflection.conductedDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">ผลการจัดการเรียนรู้:</span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{currentUnit.reflection.summary}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">ปัญหาและอุปสรรค:</span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{currentUnit.reflection.problem}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">แนวทางแก้ไขและข้อเสนอแนะ:</span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{currentUnit.reflection.solution}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 text-right text-slate-500 font-semibold">
                  ลงชื่อ: {currentUnit.reflection.recordedBy}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => showToast('เปิดหน้าต่างแก้ไขบันทึกหลังสอน')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  แก้ไขบันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์บันทึกหลังสอน</span>
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* ====================================================== */}
        {/* COLUMN 3: RIGHT SIDE WIDGETS (ห้องเรียน, สื่อ, Quick)  */}
        {/* ====================================================== */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileTab === 'widgets' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Widget 1: จัดการห้องเรียน (Matching Mockup 100%) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">จัดการห้องเรียน</h3>
              <button
                type="button"
                onClick={() => setIsClassStatsModalOpen(true)}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                ดูข้อมูลห้องทั้งหมด &gt;
              </button>
            </div>

            {/* Room Selector Dropdown */}
            <div className="mt-2.5 mb-3">
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
              >
                <span>{selectedClassroom}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* ข้อมูลรวมห้อง */}
            <div className="text-xs">
              <div className="text-[11px] font-bold text-slate-500 mb-2">ข้อมูลรวมห้อง</div>
              <div className="space-y-2 font-medium">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>นักเรียนทั้งหมด</span>
                  </div>
                  <span className="font-extrabold text-slate-900">32 คน</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>เข้าเรียนเฉลี่ย</span>
                  </div>
                  <span className="font-extrabold text-emerald-600">93%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>ขาดเรียน</span>
                  </div>
                  <span className="font-extrabold text-amber-600">2 คน</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>ลากิจ/ลาป่วย</span>
                  </div>
                  <span className="font-extrabold text-rose-600">1 คน</span>
                </div>
              </div>
            </div>

            {/* Action: ดูสถิติรายชั้น */}
            <button
              type="button"
              onClick={() => setIsClassStatsModalOpen(true)}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 border border-blue-200/80 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>ดูสถิติรายชั้น</span>
            </button>
          </div>

          {/* Widget 2: ไฟล์และสื่อที่เกี่ยวข้อง (Matching Mockup 100%) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3">
              ไฟล์และสื่อที่เกี่ยวข้อง
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Row 1: สื่อการสอน (PDF) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">สื่อการสอน (PDF)</div>
                    <div className="text-[10px] text-slate-400">2 ไฟล์</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRelatedFilesModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-bold cursor-pointer"
                >
                  ดูทั้งหมด
                </button>
              </div>

              {/* Row 2: ใบงาน (Word/PDF) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">ใบงาน (Word/PDF)</div>
                    <div className="text-[10px] text-slate-400">3 ไฟล์</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRelatedFilesModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-bold cursor-pointer"
                >
                  ดูทั้งหมด
                </button>
              </div>

              {/* Row 3: สื่อวิดีโอ (YouTube) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">สื่อวิดีโอ (YouTube)</div>
                    <div className="text-[10px] text-slate-400">1 ลิงก์</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRelatedFilesModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-bold cursor-pointer"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>
          </div>

          {/* Widget 3: Quick Actions (Matching Mockup 100%) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Quick Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsViewAllModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 text-slate-800 hover:text-blue-700 text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>ดูแผนการสอนทั้งหมด</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 text-slate-800 hover:text-blue-700 text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4 text-purple-600" />
                <span>คัดลอกหน่วยการเรียนรู้</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 text-slate-800 hover:text-blue-700 text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>พิมพ์แผนการสอน</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM STEPPER FLOW (รายการหน่วยการเรียนรู้ 6 หน่วย)   */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mt-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>รายการหน่วยการเรียนรู้ ({units.length} หน่วย)</span>
          </h3>
        </div>

        {/* Horizontal Flow Stepper */}
        {units.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            ยังไม่มีหน่วยการเรียนรู้ในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-2 min-w-[760px]">
              {units.slice(0, 6).map((unit, idx) => {
                const isSelected = unit.id === selectedUnitId;
                return (
                  <React.Fragment key={unit.id}>
                    <div
                      onClick={() => handleSelectUnit(unit.id)}
                      className={`flex-1 min-w-[110px] p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full ${unit.circleColorClass} text-white font-extrabold text-xs flex items-center justify-center shrink-0`}
                        >
                          {unit.unitNumber}
                        </div>
                        <div className="truncate">
                          <div className="text-[11px] font-bold text-slate-800 truncate">
                            หน่วยที่ {unit.unitNumber}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              unit.status === 'DONE'
                                ? 'text-emerald-600'
                                : unit.status === 'IN_PROGRESS'
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {unit.statusLabel}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-medium pl-8">
                        {unit.periods} คาบ
                      </div>
                    </div>

                    {idx < 5 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE MODALS                                    */}
      {/* ======================================================== */}

      {/* MODAL 1: สร้างแผนการสอนใหม่ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>สร้างแผนการสอน / หน่วยการเรียนรู้ใหม่</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">หน่วยที่</label>
                  <input
                    type="number"
                    min={1}
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">จำนวนคาบเรียน</label>
                  <input
                    type="number"
                    min={1}
                    value={newPeriods}
                    onChange={(e) => setNewPeriods(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ชื่อหน่วย (ภาษาญี่ปุ่น หรือคำอ่าน)</label>
                <input
                  type="text"
                  placeholder="เช่น 日常のあいさつ"
                  value={newTitleJa}
                  onChange={(e) => setNewTitleJa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ชื่อหน่วย (ภาษาไทย) *</label>
                <input
                  type="text"
                  placeholder="เช่น การทักทายประจำวัน"
                  value={newTitleTh}
                  onChange={(e) => setNewTitleTh(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ช่วงเวลาที่สอน</label>
                <input
                  type="text"
                  value={newDateRange}
                  onChange={(e) => setNewDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateNewUnit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                บันทึกสร้างหน่วย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: แก้ไขข้อมูลพื้นฐาน */}
      {isEditBasicInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>แก้ไขข้อมูลพื้นฐาน (หน่วยที่ {currentUnit.unitNumber})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditBasicInfoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">ชื่อหน่วย</label>
                <input
                  type="text"
                  value={editDisplayTitle}
                  onChange={(e) => setEditDisplayTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">เวลาเรียน (คาบ)</label>
                <input
                  type="number"
                  min={1}
                  value={editPeriods}
                  onChange={(e) => setEditPeriods(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ช่วงเวลา</label>
                <input
                  type="text"
                  value={editDateRange}
                  onChange={(e) => setEditDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditBasicInfoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveBasicInfo}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: แก้ไขตัวชี้วัด / ผลการเรียนรู้ */}
      {isEditObjectivesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>แก้ไขตัวชี้วัด / ผลการเรียนรู้</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditObjectivesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {editObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={obj}
                    onChange={(e) => {
                      const updated = [...editObjectives];
                      updated[idx] = e.target.value;
                      setEditObjectives(updated);
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditObjectives(editObjectives.filter((_, i) => i !== idx));
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setEditObjectives([...editObjectives, `${editObjectives.length + 1}. ตัวชี้วัดใหม่ (ต 1.1 ม.3/1)`]);
                }}
                className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-blue-600 hover:bg-blue-50 font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มตัวชี้วัด</span>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditObjectivesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveObjectives}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                บันทึกตัวชี้วัด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: แก้ไขการประเมินผล */}
      {isEditEvaluationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>แก้ไขโครงสร้างการประเมินผล</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditEvaluationsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {editEvaluations.map((ev, idx) => (
                <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold">รายการ</label>
                      <input
                        type="text"
                        value={ev.title}
                        onChange={(e) => {
                          const updated = [...editEvaluations];
                          updated[idx].title = e.target.value;
                          setEditEvaluations(updated);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">น้ำหนัก (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ev.weightPercent}
                        onChange={(e) => {
                          const updated = [...editEvaluations];
                          updated[idx].weightPercent = parseInt(e.target.value) || 0;
                          setEditEvaluations(updated);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold">เกณฑ์การประเมิน</label>
                    <input
                      type="text"
                      value={ev.criteria}
                      onChange={(e) => {
                        const updated = [...editEvaluations];
                        updated[idx].criteria = e.target.value;
                        setEditEvaluations(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs font-bold text-blue-700">
              คะแนนรวมทั้งหมด:{' '}
              {editEvaluations.reduce((acc, curr) => acc + curr.weightPercent, 0)}%
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditEvaluationsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEvaluations}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                บันทึกการประเมิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ดูแผนการสอนทั้งหมด */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span>ภาพรวมแผนการสอนรายวิชา {currentCourse.code} ({units.length} หน่วย)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ห้อง {selectedClassroom} • {selectedSemester}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewAllModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto space-y-3 pr-1 flex-1">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${unit.circleColorClass} text-white font-extrabold text-xs flex items-center justify-center shrink-0`}
                    >
                      {unit.unitNumber}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {unit.displayTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {unit.periods} คาบ • {unit.dateRange} • {unit.objectives.length} ตัวชี้วัด
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${unit.statusBadgeClass}`}
                  >
                    {unit.statusLabel}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsViewAllModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: คัดลอกหน่วยการเรียนรู้ */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Copy className="w-5 h-5 text-purple-600" />
                <span>คัดลอกหน่วยการเรียนรู้</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-xs space-y-3">
              <p className="text-slate-600">
                คุณกำลังจะคัดลอกโครงสร้างแผนการสอนของ:
              </p>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 font-bold text-purple-900">
                หน่วยที่ {currentUnit.unitNumber} : {currentUnit.displayTitle}
              </div>
              <p className="text-slate-500 leading-relaxed">
                ระบบจะสร้างหน่วยการเรียนรู้ใหม่ลำดับถัดไปพร้อมตัวชี้วัดและโครงสร้างประเมินผลให้ทันที
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCopyUnit}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                ยืนยันการคัดลอก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: พิมพ์แผนการสอน */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <span>พิมพ์แผนการจัดการเรียนรู้</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="text-center font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                แผนการจัดการเรียนรู้รายวิชา {currentCourse.name} ({currentCourse.code})<br />
                ระดับชั้นมัธยมศึกษาปีที่ 3 • {selectedSemester}
              </div>
              <div>
                <strong>หน่วยการเรียนรู้ที่ {currentUnit.unitNumber}:</strong> {currentUnit.displayTitle}
              </div>
              <div>
                <strong>เวลาเรียน:</strong> {currentUnit.periodDurationText} • {currentUnit.dateRange}
              </div>
              <div>
                <strong>ตัวชี้วัด / ผลการเรียนรู้:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {currentUnit.objectives.map((o, idx) => (
                    <li key={idx}>{o}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>การวัดและประเมินผล:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {currentUnit.evaluations.map((e) => (
                    <li key={e.id}>
                      {e.title} ({e.weightPercent}%) - {e.criteria}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: ดูสถิติรายชั้น */}
      {isClassStatsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>สถิติชั้นเรียน ห้อง {selectedClassroom}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClassStatsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-slate-500 font-medium">นักเรียนทั้งหมด</span>
                <div className="text-lg font-extrabold text-blue-700 mt-1">32 คน</div>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-slate-500 font-medium">เข้าเรียนเฉลี่ย</span>
                <div className="text-lg font-extrabold text-emerald-700 mt-1">93.2%</div>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                <span className="text-slate-500 font-medium">ขาดเรียนสะสม</span>
                <div className="text-lg font-extrabold text-amber-700 mt-1">2 คน</div>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                <span className="text-slate-500 font-medium">การส่งใบงานเฉลี่ย</span>
                <div className="text-lg font-extrabold text-rose-700 mt-1">96.8%</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClassStatsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: ดูไฟล์และสื่อทั้งหมด */}
      {isRelatedFilesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span>คลังไฟล์และสื่อการสอนทั้งหมด</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRelatedFilesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {[
                { name: 'แผนการสอน_หน่วยที่1_ทักทาย.pdf', type: 'PDF', size: '1.4 MB' },
                { name: 'สไลด์_คำทักทายประจำวัน.pptx', type: 'PPTX', size: '6.8 MB' },
                { name: 'ใบงานที่1.1_บทสนทนา.docx', type: 'DOCX', size: '820 KB' },
                { name: 'วิดีโอ_การทักทายภาษาญี่ปุ่น_YouTube', type: 'VIDEO', size: 'ลิงก์ภายนอก' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="font-bold text-slate-800 truncate">{f.name}</div>
                    <div className="text-[10px] text-slate-400">{f.type} • {f.size}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`เปิด ${f.name}`)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold shrink-0"
                  >
                    เปิดดู
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRelatedFilesModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlansView;
