import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckSquare,
  CheckCircle2,
  PenTool,
  Download,
  FileSpreadsheet,
  BookMarked,
  X,
} from 'lucide-react';
import { AtRiskCard } from '../components/teacher/AtRiskCard';
import { IncompleteGradingCard } from '../components/teacher/IncompleteGradingCard';
import { LowestAssignmentsCard } from '../components/teacher/LowestAssignmentsCard';
import { GradeDistributionBar } from '../components/teacher/GradeDistributionBar';
import {
  atRiskStudentsData,
  incompleteGradingData,
  lowestAssignmentsData,
  gradeDistributionData,
} from '../data/mockData';
import type { AtRiskStudent } from '../types/viewModels';
import { assignmentService } from '../services/assignmentService';
import { attendanceService } from '../services/attendanceService';
import { scoreService } from '../services/scoreService';
import { behaviorService } from '../services/behaviorService';
import {
  AssignmentManagementView,
  type QuickFilterMode,
} from './AssignmentManagementView';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
} from '../services/sgsRosterAndSubmissionService';
import { PaperRegisterLedger } from '../components/teacher/PaperRegisterLedger';


interface TeacherOverviewViewProps {
  onSelectStudent: (student: AtRiskStudent) => void;
  onViewFullTable: () => void;
  onSwitchToAdventure: () => void;
  initialTab?: ClassSubTab;
  initialGradesFilter?: 'ALL' | 'AT_RISK';
  initialAssignmentFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
}

export type ClassSubTab =
  | 'attendance'
  | 'assignments'
  | 'grades'
  | 'attributes'
  | 'overview'
  | 'behavior'
  | 'reflection'
  | 'adventure';

interface StudentRosterScore {
  no: number;
  code: string;
  name: string;
  u1: number;
  u2: number;
  midterm: number;
  u3: number;
  final: number;
  total: number;
  grade: string;
}

export const TeacherOverviewView: React.FC<TeacherOverviewViewProps> = ({
  onSelectStudent,
  onViewFullTable,
  onSwitchToAdventure: _onSwitchToAdventure,
  initialTab = 'attendance',
  initialGradesFilter = 'ALL',
  initialAssignmentFilter = 'ALL',
  initialHighlightBanner = null,
}) => {
  // เริ่มต้นที่แท็บ "เช็คชื่อแถวตอนเช้า & เข้าเรียน" เป็นอันดับแรกสุดก่อนเริ่มสอน หรือตาม Deep-Link ที่ส่งมา
  const [activeTab, setActiveTab] = useState<ClassSubTab>(initialTab);
  const [selectedClassroom, _setSelectedClassroom] = useState<'ม.3/1' | 'ม.3/2' | 'ม.1/8'>('ม.3/1');
  const [attendanceSubMode, setAttendanceSubMode] = useState<'MORNING_AND_TODAY' | 'TERM_HISTORY'>('MORNING_AND_TODAY');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Modals state
  const [isRollCallOpen, setIsRollCallOpen] = useState(false);
  const [selectedDateForRollCall, setSelectedDateForRollCall] = useState<string | null>(null);
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const [isClassroomSyncOpen, setIsClassroomSyncOpen] = useState(false);
  const [isGradebookModalOpen, setIsGradebookModalOpen] = useState(false);
  const [selectedAssignmentForGrading] = useState<string | null>(null);
  const [isWeightingModalOpen, setIsWeightingModalOpen] = useState(false);
  const [isAddReflectionOpen, setIsAddReflectionOpen] = useState(false);

  // New assignment form state
  const [newTitle, setNewTitle] = useState('');
  const [newSgsUnit, setNewSgsUnit] = useState('หน่วยที่ 1');
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newDueDate, setNewDueDate] = useState('');

  // SGS Roster Alignment State (แก้ปัญหารายชื่อไม่ตรง SGS เมื่อนักเรียนย้ายเข้า/ย้ายออก)
  const [sgsRoster, setSgsRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [keepTransferredOutRow, setKeepTransferredOutRow] = useState(true);
  const [isRosterEditMode, setIsRosterEditMode] = useState(false);
  const [gradesQuickFilter, setGradesQuickFilter] = useState<'ALL' | 'AT_RISK'>(
    initialGradesFilter
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setGradesQuickFilter(initialGradesFilter);
  }, [initialGradesFilter]);

  useEffect(() => {
    const handler = () => {
      setSgsRoster([...sgsRosterAndSubmissionService.getSgsRoster()]);
    };
    window.addEventListener('kp-copilot-updated', handler);
    return () => window.removeEventListener('kp-copilot-updated', handler);
  }, []);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);
  const [newPeriodDate, setNewPeriodDate] = useState('พฤ. 8 ต.ค. 2569');
  const [newPeriodTopic, setNewPeriodTopic] = useState('');
  const [isAddingBehavior, setIsAddingBehavior] = useState(false);
  const [newBehaviorStudent, setNewBehaviorStudent] = useState('ด.ช. จิรายุ เดชปันคำ');
  const [newBehaviorReason, setNewBehaviorReason] = useState('');
  const [newBehaviorType, setNewBehaviorType] = useState<'POSITIVE' | 'NEGATIVE'>('POSITIVE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleGradesKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.querySelector<HTMLInputElement>(
        `input[data-sgs-grade-row="${rowIndex + 1}"]`
      );
      if (next) {
        next.focus();
        next.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.querySelector<HTMLInputElement>(
        `input[data-sgs-grade-row="${rowIndex - 1}"]`
      );
      if (prev) {
        prev.focus();
        prev.select();
      }
    }
  };

  const [isTransferInModalOpen, setIsTransferInModalOpen] = useState(false);
  const [transferInCode, setTransferInCode] = useState('45129');
  const [transferInName, setTransferInName] = useState('');
  const [transferInGender, setTransferInGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [transferInInsertPosition, setTransferInInsertPosition] = useState<
    'AFTER_SAME_GENDER' | 'END_OF_CLASS' | 'CUSTOM_SEAT'
  >('AFTER_SAME_GENDER');
  const [transferInCustomSeat, setTransferInCustomSeat] = useState(6);
  const [transferInDate, setTransferInDate] = useState('2026-08-15');
  const [transferInU1Score, setTransferInU1Score] = useState(12);

  // Interactive Attendance Rows matching Image 4
  const [attendanceRows, setAttendanceRows] = useState([
    {
      date: 'พฤ. 1 ต.ค. 2569',
      period: 'คาบ 8-9',
      topic: 'สอบปลายภาค',
      status: 'CANCELED',
      statusLabel: 'งดสอน',
      checkStatus: 'ยังไม่เช็คชื่อ',
      attendedCount: null as number | null,
      leaveCount: null as number | null,
    },
    {
      date: 'พฤ. 24 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'การนำเสนอผลงานศิลปะร่วมสมัย',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'ยังไม่เช็คชื่อ',
      attendedCount: null as number | null,
      leaveCount: null as number | null,
    },
    {
      date: 'พฤ. 17 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'เทคนิคการไล่น้ำหนักสีโปสเตอร์',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'CHECKED',
      attendedCount: 14,
      leaveCount: 1,
    },
    {
      date: 'พฤ. 10 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'ทฤษฎีสีและวงจรสีสากล',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'CHECKED',
      attendedCount: 14,
      leaveCount: 1,
    },
    {
      date: 'พฤ. 3 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'องค์ประกอบศิลป์เบื้องต้น',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'CHECKED',
      attendedCount: 13,
      leaveCount: 2,
    },
  ]);

  // Roll-call interactive student states synced with SGS Roster + Morning Assembly & Approved Leave
  const [rollCallList, setRollCallList] = useState(() =>
    sgsRosterAndSubmissionService
      .getSgsRoster()
      .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
      .map((s) => {
        const hasApprovedLeave = s.studentCode === '45109';
        const assemblyLabel =
          s.studentCode === '45109'
            ? 'ลาป่วย (อนุมัติแล้ว)'
            : s.studentCode === '45104'
            ? 'สายเสาธง (08:12)'
            : s.studentCode === '45107'
            ? 'ขาดเข้าแถวเสาธง'
            : 'เข้าแถวปกติ';
        return {
          no: s.sgsSeatNo,
          code: s.studentCode,
          name: s.studentName,
          status: hasApprovedLeave ? 'LEAVE' : s.studentCode === '45107' ? 'ABSENT' : 'PRESENT',
          hasApprovedLeave,
          assemblyLabel,
        };
      })
  );

  // Assignments Data matching Image 3
  const [assignmentRows, setAssignmentRows] = useState([
    {
      id: 'asg-1',
      title: 'My Soundtrack',
      sharedTag: 'ใช้ร่วม 5 ห้อง',
      subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
      category: 'เก็บก่อนกลางภาค',
      sgsUnit: 'ช่อง 2 • หน่วยที่ 1',
      dueDate: '20 ส.ค.',
      maxScore: 10,
      submittedText: '23 / 23',
      isFull: true,
      status: 'ACTIVE',
    },
    {
      id: 'asg-2',
      title: 'อินโฟกราฟิค องค์ประกอบทางดนตรี',
      sharedTag: 'ใช้ร่วม 6 ห้อง',
      subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
      category: 'เก็บก่อนกลางภาค',
      sgsUnit: 'ช่อง 1 • หน่วยที่ 2',
      dueDate: '10 ส.ค.',
      maxScore: 10,
      submittedText: '23 / 23',
      isFull: true,
      status: 'ACTIVE',
    },
    {
      id: 'asg-3',
      title: 'เพลงแบบเพลง',
      sharedTag: 'ใช้ร่วม 6 ห้อง',
      subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
      category: 'เก็บก่อนกลางภาค',
      sgsUnit: 'ช่อง 2 • หน่วยที่ 1',
      dueDate: '5 ส.ค.',
      maxScore: 10,
      submittedText: '21 / 23',
      isFull: false,
      status: 'ACTIVE',
    },
    {
      id: 'asg-4',
      title: 'วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ',
      sharedTag: 'ใช้ร่วม 6 ห้อง',
      subtext: 'มอบหมายเมื่อ 1 ก.ย. 2569',
      category: 'เก็บหลังกลางภาค',
      sgsUnit: 'ช่อง 11 • หน่วยที่ 4',
      dueDate: '25 ก.ย.',
      maxScore: 10,
      submittedText: '0 / 23',
      isFull: false,
      status: 'ACTIVE',
    },
  ]);

  // Full 23 Student Gradebook Data
  const sampleGradesRoster: StudentRosterScore[] = [
    { no: 1, code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', u1: 14.5, u2: 18.0, midterm: 18.0, u3: 13.5, final: 26.0, total: 90.0, grade: '4.0' },
    { no: 2, code: '45102', name: 'ด.ช. จิรายุ เดชปันคำ', u1: 13.5, u2: 16.0, midterm: 17.5, u3: 12.5, final: 23.0, total: 82.5, grade: '3.5' },
    { no: 3, code: '45103', name: 'ด.ช. ชลธี ปัญญาวงศ์', u1: 12.0, u2: 15.0, midterm: 15.0, u3: 11.5, final: 21.0, total: 74.5, grade: '3.0' },
    { no: 4, code: '45104', name: 'ด.ช. ณภัทร ธรรมรักษ์', u1: 13.0, u2: 17.0, midterm: 16.0, u3: 13.0, final: 24.0, total: 83.0, grade: '3.5' },
    { no: 5, code: '45105', name: 'ด.ช. ทิวากร บุญมาก', u1: 11.0, u2: 14.0, midterm: 14.0, u3: 10.5, final: 19.0, total: 68.5, grade: '2.5' },
    { no: 6, code: '45106', name: 'ด.ช. พงศกร มหาวรรณ', u1: 14.0, u2: 17.5, midterm: 17.0, u3: 13.0, final: 25.5, total: 87.0, grade: '4.0' },
    { no: 7, code: '45107', name: 'ด.ช. ภูรินท์ บัณฑิต', u1: 6.0, u2: 7.0, midterm: 6.5, u3: 5.0, final: 3.8, total: 28.3, grade: '0' },
    { no: 8, code: '45108', name: 'ด.ช. มงคลชัย สิทธิผล', u1: 12.5, u2: 15.5, midterm: 16.0, u3: 12.0, final: 22.0, total: 78.0, grade: '3.5' },
    { no: 9, code: '45109', name: 'ด.ช. วรัญญู สุรเดช', u1: 13.0, u2: 16.5, midterm: 17.0, u3: 12.5, final: 24.0, total: 83.0, grade: '3.5' },
    { no: 10, code: '45110', name: 'ด.ช. อัศวิน วนเกษตรกุล', u1: 7.0, u2: 8.5, midterm: 8.0, u3: 6.0, final: 4.8, total: 34.3, grade: '0' },
    { no: 11, code: '45111', name: 'ด.ช. กิตติพงษ์ แก้วเรือง', u1: 13.5, u2: 17.0, midterm: 17.5, u3: 13.0, final: 25.0, total: 86.0, grade: '4.0' },
    { no: 12, code: '45112', name: 'ด.ช. ชัยมงคล วงศ์บุตร', u1: 7.5, u2: 9.0, midterm: 8.5, u3: 6.0, final: 4.0, total: 35.0, grade: '0' },
    { no: 13, code: '45113', name: 'ด.ช. ณัชพล อินทร์จันทร์', u1: 12.0, u2: 15.0, midterm: 15.5, u3: 11.0, final: 21.5, total: 75.0, grade: '3.5' },
    { no: 14, code: '45114', name: 'ด.ช. ธนกร พลอยดี', u1: 13.0, u2: 16.0, midterm: 16.5, u3: 12.5, final: 23.0, total: 81.0, grade: '3.5' },
    { no: 15, code: '45115', name: 'ด.ช. ทัตธน คำฝั้น', u1: 12.5, u2: 15.5, midterm: 16.5, u3: 12.0, final: 22.0, total: 78.5, grade: '3.5' },
    { no: 16, code: '45116', name: 'ด.ช. บารมี สังข์ทอง', u1: 14.0, u2: 18.0, midterm: 18.5, u3: 14.0, final: 27.0, total: 91.5, grade: '4.0' },
    { no: 17, code: '45117', name: 'ด.ช. ภาณุเดช มีสุข', u1: 11.5, u2: 14.0, midterm: 14.5, u3: 11.0, final: 20.0, total: 71.0, grade: '3.0' },
    { no: 18, code: '45118', name: 'ด.ช. ยุทธนา ชัยศรี', u1: 13.5, u2: 16.5, midterm: 17.0, u3: 13.0, final: 24.5, total: 84.5, grade: '3.5' },
    { no: 19, code: '45119', name: 'ด.ช. รัชชานนท์ ทองสุข', u1: 12.0, u2: 15.0, midterm: 15.0, u3: 12.0, final: 21.0, total: 75.0, grade: '3.5' },
    { no: 20, code: '45120', name: 'ด.ช. วรพล ศรีเมือง', u1: 13.0, u2: 16.0, midterm: 16.0, u3: 12.5, final: 23.5, total: 81.0, grade: '3.5' },
    { no: 21, code: '45121', name: 'ด.ช. ศิรชัช ไชยยศ', u1: 11.0, u2: 13.5, midterm: 14.0, u3: 10.5, final: 19.5, total: 68.5, grade: '2.5' },
    { no: 22, code: '45122', name: 'ด.ญ. อคิราห์ วิรากร', u1: 8.0, u2: 9.5, midterm: 9.0, u3: 7.0, final: 5.5, total: 39.0, grade: '0' },
    { no: 23, code: '45123', name: 'ด.ญ. ปรียาภรณ์ ชัยแก้ว', u1: 15.0, u2: 19.0, midterm: 19.5, u3: 14.5, final: 27.0, total: 95.0, grade: '4.0' },
  ];

  // Behavior Ledger
  const [behaviorLogs, setBehaviorLogs] = useState([
    { id: 'b-1', studentName: 'ด.ช. จิรายุ เดชปันคำ', type: 'POSITIVE', text: 'ช่วยจัดเก็บอุปกรณ์สีน้ำส่วนรวมของห้อง', points: '+5 XP', date: '22 ก.ย. 2569' },
    { id: 'b-2', studentName: 'ด.ญ. ปรียาภรณ์ ชัยแก้ว', type: 'POSITIVE', text: 'ให้คำแนะนำเพื่อนร่วมกลุ่มเรื่องการผสมแม่สี', points: '+10 XP', date: '20 ก.ย. 2569' },
    { id: 'b-3', studentName: 'ด.ช. ภูรินท์ บัณฑิต', type: 'NEGATIVE', text: 'ลืมนำสมุดวาดเขียนมาในชั่วโมงเรียน', points: '-2 คะแนน', date: '18 ก.ย. 2569' },
    { id: 'b-4', studentName: 'ด.ช. ชัยมงคล วงศ์บุตร', type: 'POSITIVE', text: 'ส่งงาน My Soundtrack แก้ไขตรงตามคำแนะนำ', points: '+5 XP', date: '15 ก.ย. 2569' },
  ]);

  // Reflection records
  const [reflectionLogs, setReflectionLogs] = useState([
    {
      period: 'คาบ 8-9 (17 ก.ย. 2569)',
      topic: 'เทคนิคการไล่น้ำหนักสีโปสเตอร์',
      success: 'นักเรียนส่วนใหญ่ (90%) ผสมสีไล่น้ำหนัก 5 ระดับได้อย่างถูกต้อง เข้าใจการควบคุมปริมาณน้ำ',
      obstacle: 'นักเรียน 3 คน (เลขที่ 7, 10, 12) ขาดการเตรียมพู่กันเบอร์เล็ก ทำให้ตัดขอบไม่คม',
      solution: 'จัดพู่กันสำรองของห้องให้ยืม พร้อมแนะนำให้ทำแบบฝึกหัดตัดเส้นเพิ่มเติม',
    },
    {
      period: 'คาบ 8-9 (10 ก.ย. 2569)',
      topic: 'ทฤษฎีสีและวงจรสีสากล',
      success: 'สามารถตอบคำถามเรื่องคู่สีตรงข้ามและวรรณะของสีได้อย่างคล่องแคล่ว',
      obstacle: 'เวลาฝึกปฏิบัติในห้องไม่พอเนื่องจากกิจกรรมหน้าเสาธงเลิกช้า',
      solution: 'ปรับการบ้านให้เป็นใบงานระบายสีเติมเต็มช่องวงจรสี 12 สีส่งสัปดาห์ถัดไป',
    },
  ]);

  useEffect(() => {
    assignmentService.getByClassroom('room-3-1').then((asgs) => {
      if (asgs && asgs.length > 0) {
        setAssignmentRows(
          asgs.map((a) => ({
            id: a.id,
            title: a.title,
            sharedTag: a.sharedTag || 'เฉพาะ ม.3/1',
            subtext: a.subtext,
            category: a.category,
            sgsUnit: a.sgsUnit,
            dueDate: a.dueDate,
            maxScore: a.maxScore,
            submittedText: `${a.submittedCount} / ${a.totalStudents}`,
            isFull: a.isFull,
            status: a.status,
          }))
        );
      }
    });

    behaviorService.getAll().then((logs) => {
      if (logs && logs.length > 0) {
        setBehaviorLogs(logs);
      }
    });
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await assignmentService.create('room-3-1', {
        title: newTitle,
        category: 'เก็บหลังกลางภาค',
        sgsUnit: newSgsUnit,
        maxScore: Number(newMaxScore),
        dueDate: newDueDate || 'ไม่ระบุ',
        sharedTag: 'เฉพาะ ม.3/1',
      });

      const newRow = {
        id: created.id,
        title: created.title,
        sharedTag: created.sharedTag || 'เฉพาะ ม.3/1',
        subtext: created.subtext,
        category: created.category,
        sgsUnit: created.sgsUnit,
        dueDate: created.dueDate,
        maxScore: created.maxScore,
        submittedText: `${created.submittedCount} / ${created.totalStudents}`,
        isFull: created.isFull,
        status: created.status,
      };

      setAssignmentRows([newRow, ...assignmentRows]);
      setIsNewAssignmentOpen(false);
      setNewTitle('');
      alert(`สร้างงานใหม่ "${newTitle}" เรียบร้อยแล้ว!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างงาน';
      alert(msg);
    }
  };

  const handleSaveRollCall = async () => {
    const presentCount = rollCallList.filter((s) => s.status === 'PRESENT').length;
    const leaveCount = rollCallList.filter((s) => s.status === 'LEAVE').length;
    const overriddenLeaveStudents = rollCallList.filter(
      (s) => s.hasApprovedLeave && s.status !== 'LEAVE'
    );

    await attendanceService.saveRollCall({
      scheduleId: 'sched-1',
      classroomId: 'room-3-1',
      schoolDate: selectedDateForRollCall || 'วันนี้',
      records: rollCallList.map((s) => ({
        enrollmentId: `stu-${s.no}`,
        status: s.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE',
      })),
    });

    setAttendanceRows((prev) =>
      prev.map((r) => {
        if (r.date === selectedDateForRollCall) {
          return {
            ...r,
            checkStatus: 'CHECKED',
            attendedCount: presentCount,
            leaveCount: leaveCount > 0 ? leaveCount : null,
          };
        }
        return r;
      })
    );

    setIsRollCallOpen(false);
    if (overriddenLeaveStudents.length > 0) {
      const names = overriddenLeaveStudents.map((s) => s.name).join(', ');
      showToast(
        `บันทึกสำเร็จ (มา ${presentCount}, ลา ${leaveCount}) • แจ้งเตือน: เปลี่ยนสถานะผู้มีใบลา (${names})`
      );
    } else {
      showToast(
        `บันทึกเช็คชื่อ ${selectedDateForRollCall} เรียบร้อย (มา ${presentCount} คน, ลา ${leaveCount} คน)`
      );
    }
  };

  const openRollCallModal = (date: string) => {
    setSelectedDateForRollCall(date);
    setIsRollCallOpen(true);
  };

  const filteredAttendance = attendanceRows.filter(
    (row) =>
      row.date.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      row.topic.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      row.statusLabel.toLowerCase().includes(attendanceSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* แถบไอคอน 3 งานหลักของครู (เช็คชื่อเข้าเรียน | คะแนน ปพ.5 | สั่งงาน) เน้นกดง่ายในแนวตั้ง */}
      <div className="max-w-xl mx-auto flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
        {(
          [
            { key: 'attendance', label: 'เช็คชื่อเรียน', icon: CheckCircle2 },
            { key: 'grades', label: 'คะแนน ปพ.5', icon: FileSpreadsheet },
            { key: 'assignments', label: 'สั่งงาน/ตรวจงาน', icon: PenTool },
          ] as const
        ).map((t) => {
          const IconComp = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                isActive
                  ? 'bg-teal-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 hover:bg-white hover:text-slate-900'
              }`}
            >
              <IconComp className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}

        {/* เมนูเสริม (⋯) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCourseMenuOpen((v) => !v)}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              ['attributes', 'overview', 'behavior', 'reflection'].includes(activeTab)
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
            title="เมนูเสริม"
          >
            ⋯
          </button>
          {isCourseMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('attributes');
                  setIsCourseMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold"
              >
                คุณลักษณะฯ & คิดวิเคราะห์
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reflection');
                  setIsCourseMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold"
              >
                บันทึกหลังสอน
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setIsCourseMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold"
              >
                สถิติภาพรวมห้องเรียน
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCourseMenuOpen(false);
                  setIsWeightingModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 border-t border-slate-100 flex items-center gap-2"
              >
                <BookMarked className="w-3.5 h-3.5 text-slate-400" />
                <span>ตั้งค่าสัดส่วนคะแนน</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. TAB: ภาพรวม (Overview) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <AtRiskCard
            students={atRiskStudentsData}
            onSelectStudent={onSelectStudent}
            onViewFullTable={onViewFullTable}
          />
          <IncompleteGradingCard items={incompleteGradingData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LowestAssignmentsCard items={lowestAssignmentsData} />
            <GradeDistributionBar items={gradeDistributionData} />
          </div>
        </div>
      )}

      {/* 2.5 TAB: คุณลักษณะอันพึงประสงค์ & อ่านคิดวิเคราะห์ (คำนวณจากเกรด 1-คลิก) */}
      {activeTab === 'attributes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                ประเมินอ่าน คิดวิเคราะห์ เขียน (0–3) & คุณลักษณะอันพึงประสงค์ (0–3) — {selectedClassroom}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const updated = sgsRosterAndSubmissionService.calculateAttributesFromGrades({
                    minGradeFor3: 3.0,
                    minGradeFor2: 2.0,
                    minGradeFor1: 1.0,
                    fallbackForR: 1,
                  });
                  setSgsRoster(updated);
                  showToast('⚡ คำนวณระดับอ่านคิดวิเคราะห์ & คุณลักษณะฯ (0–3) จากเกรดวิชาครบทุกคนแล้ว');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-colors"
              >
                ⚡ คำนวณระดับ 0–3 จากเกรดวิชา (1-คลิก)
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = sgsRoster.map((stu) =>
                    stu.transferState === 'TRANSFERRED_OUT'
                      ? stu
                      : { ...stu, analyticalThinkingLevel: 3 as const, desiredCharacteristicsLevel: 3 as const }
                  );
                  setSgsRoster(sgsRosterAndSubmissionService.saveSgsRoster(updated, 'ครูผู้สอน'));
                  showToast('ตั้งค่าระดับ 3 (ดีเยี่ยม) ครบทุกคนในห้องเรียบร้อยแล้ว');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                ตั้งค่า 3 (ดีเยี่ยม) ทั้งห้อง
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 w-14">เลขที่</th>
                  <th className="py-2.5 px-3 w-20">รหัส</th>
                  <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3 text-center">เวลาเรียน</th>
                  <th className="py-2.5 px-3 text-center">คะแนนรวม / เกรดวิชา</th>
                  <th className="py-2.5 px-3 text-center">อ่าน คิดวิเคราะห์ เขียน (0–3)</th>
                  <th className="py-2.5 px-3 text-center">คุณลักษณะอันพึงประสงค์ (0–3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sgsRoster
                  .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                  .map((stu) => {
                    const g = sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                    return (
                      <tr key={stu.studentCode} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-bold text-slate-800 tabular-nums">{stu.sgsSeatNo}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{stu.studentCode}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{stu.studentName}</td>
                        <td className="py-2 px-3 text-center tabular-nums text-slate-700">
                          {stu.attendancePercent}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="font-bold text-slate-900 tabular-nums">{g.total}</span>
                          <span className="mx-1 text-slate-300">·</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                              g.gradeLabel === 'ร' || g.gradeLabel === 'มส.'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}
                          >
                            เกรด {g.gradeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                            {([3, 2, 1, 0] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  const next = sgsRosterAndSubmissionService.updateStudentAttributeLevel(
                                    stu.studentCode,
                                    'analyticalThinkingLevel',
                                    lvl
                                  );
                                  setSgsRoster(next);
                                }}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                                  g.analyticalThinkingLevel === lvl
                                    ? 'bg-teal-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                            {([3, 2, 1, 0] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  const next = sgsRosterAndSubmissionService.updateStudentAttributeLevel(
                                    stu.studentCode,
                                    'desiredCharacteristicsLevel',
                                    lvl
                                  );
                                  setSgsRoster(next);
                                }}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                                  g.desiredCharacteristicsLevel === lvl
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB: เช็คชื่อเข้าเรียนรายวิชา (สมุด ปพ.5 แบบกระดาษ หลายคาบ ทันที) */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {attendanceSubMode === 'MORNING_AND_TODAY' && (
            <PaperRegisterLedger
              initialMode="CLASS_ATTENDANCE"
              defaultRoom={selectedClassroom}
              subjectLabel="ศ23101 ศิลปะ"
              hideModeSwitcher={true}
            />
          )}

          <div className="max-w-xl mx-auto flex justify-center">
            <button
              type="button"
              onClick={() =>
                setAttendanceSubMode((prev) =>
                  prev === 'MORNING_AND_TODAY' ? 'TERM_HISTORY' : 'MORNING_AND_TODAY'
                )
              }
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {attendanceSubMode === 'MORNING_AND_TODAY'
                ? `ดูประวัติคาบสอนย้อนหลัง (${attendanceRows.length} คาบ)`
                : 'กลับสมุด ปพ.5 เช็คชื่อเรียน'}
            </button>
          </div>

          {attendanceSubMode === 'TERM_HISTORY' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                  <CheckSquare className="w-4 h-4 text-slate-600" />
                  <span>คาบสอนทั้งหมด ({attendanceRows.length} คาบ)</span>
                </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  showToast('สร้างตารางคาบเรียนอัตโนมัติครบ 20 สัปดาห์เรียบร้อยแล้ว')
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>สร้างคาบทั้งเทอม</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPeriod((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มคาบสอน</span>
              </button>
            </div>
          </div>

          {isAddingPeriod && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPeriodDate.trim()) return;
                setAttendanceRows([
                  {
                    date: newPeriodDate.trim(),
                    period: 'คาบ 8-9',
                    topic: newPeriodTopic.trim() || 'คาบสอนเพิ่มเติม',
                    status: 'NORMAL',
                    statusLabel: 'สอนปกติ',
                    checkStatus: 'ยังไม่เช็คชื่อ',
                    attendedCount: null,
                    leaveCount: null,
                  },
                  ...attendanceRows,
                ]);
                setNewPeriodTopic('');
                setIsAddingPeriod(false);
                showToast(`เพิ่มคาบเรียนวันที่ ${newPeriodDate} เรียบร้อยแล้ว`);
              }}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
            >
              <input
                type="text"
                value={newPeriodDate}
                onChange={(e) => setNewPeriodDate(e.target.value)}
                placeholder="วันที่ เช่น พฤ. 8 ต.ค. 2569"
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white w-44"
              />
              <input
                type="text"
                value={newPeriodTopic}
                onChange={(e) => setNewPeriodTopic(e.target.value)}
                placeholder="เรื่องที่สอน เช่น องค์ประกอบศิลป์"
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white flex-1 min-w-[180px]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-teal-600 text-white font-semibold"
              >
                บันทึกคาบ
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPeriod(false)}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600"
              >
                ยกเลิก
              </button>
            </form>
          )}

          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="กรองรายการ..."
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3">วันที่</th>
                  <th className="py-2.5 px-3">คาบ</th>
                  <th className="py-2.5 px-3">เรื่องที่สอน</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3">การเช็คชื่อ</th>
                  <th className="py-2.5 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {row.date}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{row.period}</td>
                    <td className="py-3 px-3 text-slate-700">{row.topic || '-'}</td>
                    <td className="py-3 px-3">
                      {row.status === 'CANCELED' ? (
                        <span className="px-2 py-0.5 bg-[#fef4ea] text-[#9a4b00] border border-[#fbdcb9] rounded-md text-[11px] font-semibold">
                          {row.statusLabel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#e8f8f0] text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold">
                          {row.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {row.checkStatus === 'CHECKED' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#e8f8f0] text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold">
                            มา {row.attendedCount}
                          </span>
                          {row.leaveCount && (
                            <span className="px-2 py-0.5 bg-[#fef4ea] text-[#9a4b00] border border-[#fbdcb9] rounded-md text-[11px] font-semibold">
                              ลา {row.leaveCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          ยังไม่เช็คชื่อ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-[11px]">
                        {row.checkStatus === 'CHECKED' ? (
                          <button
                            onClick={() => openRollCallModal(row.date)}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold"
                          >
                            แก้เช็คชื่อ
                          </button>
                        ) : (
                          <button
                            onClick={() => openRollCallModal(row.date)}
                            className="px-3 py-1 border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 rounded-lg font-semibold"
                          >
                            เช็คชื่อ
                          </button>
                        )}
                        <button
                          onClick={() => alert(`แก้ไขข้อมูลคาบ ${row.date}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          แก้
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ลบคาบ ${row.date} หรือไม่?`)) {
                              setAttendanceRows(attendanceRows.filter((_, i) => i !== idx));
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          )}
        </div>
      )}

      {/* 4. TAB: งาน / คะแนนสอบ (Assignments — ตารางส่งงานทั้งเทอม & โหมดตรวจงานรายชิ้น) */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <AssignmentManagementView
            initialQuickFilter={initialAssignmentFilter}
            initialHighlightBanner={initialHighlightBanner}
          />
        </div>
      )}

      {/* 5. TAB: สรุปคะแนน ปพ.5 (แสดงตารางกระดาษกรอกคะแนนแบบกว้าง เห็นทั้งห้องพร้อมเกรดทันที) */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <PaperRegisterLedger
            initialMode="SCORE_GRADEBOOK"
            defaultRoom={selectedClassroom}
            subjectLabel="ศ23101 ศิลปะ"
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                สรุปคะแนน ปพ.5 & นำเข้า SGS
              </h3>

              {/* 1-Click Quick Filter Chips */}
              <div className="inline-flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setGradesQuickFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                    gradesQuickFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGradesQuickFilter(
                      gradesQuickFilter === 'AT_RISK' ? 'ALL' : 'AT_RISK'
                    )
                  }
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                    gradesQuickFilter === 'AT_RISK'
                      ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  เฉพาะติด ร / มส. / เวลาเรียน &lt;80%
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer select-none px-2 py-1 rounded hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={keepTransferredOutRow}
                  onChange={() => setKeepTransferredOutRow((v) => !v)}
                  className="w-3.5 h-3.5 accent-slate-800 rounded"
                />
                <span>แสดงคนย้ายออก</span>
              </label>

              <button
                type="button"
                onClick={() => setIsRosterEditMode((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
                  isRosterEditMode
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isRosterEditMode ? 'เสร็จสิ้นการปรับรายชื่อ' : 'ปรับลำดับ / ย้ายเข้า-ออก'}
              </button>

              <button
                onClick={() => {
                  const rows = (keepTransferredOutRow
                    ? sgsRoster
                    : sgsRoster.filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                  ).map((stu) => {
                    const g =
                      sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                    return `${stu.sgsSeatNo},${stu.studentCode},"${stu.studentName}",${g.u1},${g.u2},${g.midterm},${g.u3},${g.final},${g.total},${g.gradeLabel}`;
                  });
                  const csvContent =
                    'เลขที่_SGS,รหัสนักเรียน,ชื่อ_สกุล,หน่วย1(15),หน่วย2(20),กลางภาค(20),หน่วย3(15),ปลายภาค(30),รวม(100),ผลการเรียน\n' +
                    rows.join('\n');
                  const blob = new Blob(['\uFEFF' + csvContent], {
                    type: 'text/csv;charset=utf-8;',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'SGS_Grades_M3_1_Aligned.csv';
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก CSV (SGS)</span>
              </button>
            </div>
          </div>

          {isRosterEditMode && (
            <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                โหมดปรับรายชื่อ: กด ▲/▼ หน้าเลขที่เพื่อสลับลำดับ หรือเพิ่มนักเรียนย้ายเข้าใหม่
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sorted =
                      sgsRosterAndSubmissionService.sortRosterMaleFirstSgs();
                    setSgsRoster(sorted);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-semibold"
                >
                  เรียง ชาย ➔ หญิง อัตโนมัติ
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferInModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มนักเรียนย้ายเข้า</span>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold shadow-2xs">
                  <th className="text-center w-12 bg-slate-50">เลขที่</th>
                  <th className="w-20 bg-slate-50">รหัส</th>
                  <th className="bg-slate-50">ชื่อ-สกุล</th>
                  <th className="text-center w-20 bg-slate-50">เวลาเรียน</th>
                  <th className="text-center w-16 bg-slate-50">งาน</th>
                  <th className="text-center w-16 bg-slate-50">น.1 (15)</th>
                  <th className="text-center w-16 bg-slate-50">น.2 (20)</th>
                  <th className="text-center w-16 bg-slate-50">น.3 (15)</th>
                  <th className="text-center w-24 bg-slate-100 text-slate-800 font-bold border-x border-slate-200">
                    รวมเก็บ (50)
                  </th>
                  <th className="text-center w-16 bg-slate-50">กลาง (20)</th>
                  <th className="text-center w-16 bg-slate-50">ปลาย (30)</th>
                  <th className="text-center w-18 font-bold text-slate-900 bg-slate-50">รวม (100)</th>
                  <th className="text-center w-20 font-bold text-slate-900 bg-slate-50">เกรด</th>
                  {isRosterEditMode && <th className="text-right w-24 bg-slate-50">สถานะ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  let activeRowIdx = -1;
                  return (keepTransferredOutRow
                    ? sgsRoster
                    : sgsRoster.filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                  )
                    .filter((stu) => {
                      if (gradesQuickFilter !== 'AT_RISK') return true;
                      if (stu.transferState === 'TRANSFERRED_OUT') return false;
                      const g =
                        sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                      return (
                        g.gradeLabel === 'ร' ||
                        g.gradeLabel === 'มส.' ||
                        stu.attendancePercent < 80 ||
                        g.missingCount > 0
                      );
                    })
                    .map((stu) => {
                      const g =
                        sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                      const isOut = stu.transferState === 'TRANSFERRED_OUT';
                      const isIn = stu.transferState === 'TRANSFERRED_IN';
                      const rowIdx = isOut ? -1 : ++activeRowIdx;

                      return (
                        <tr
                          key={stu.studentCode}
                          className={
                            isOut
                              ? 'bg-slate-50/80 text-slate-400'
                              : 'hover:bg-slate-50/80 transition-colors'
                          }
                        >
                          <td className="text-center font-medium text-slate-500 tabular-nums whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <span className="w-5 text-center">{stu.sgsSeatNo}</span>
                              {isRosterEditMode && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSgsRoster(
                                        sgsRosterAndSubmissionService.moveStudentSeat(
                                          stu.studentCode,
                                          'UP'
                                        )
                                      )
                                    }
                                    className="px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[9px] text-slate-600 leading-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSgsRoster(
                                        sgsRosterAndSubmissionService.moveStudentSeat(
                                          stu.studentCode,
                                          'DOWN'
                                        )
                                      )
                                    }
                                    className="px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[9px] text-slate-600 leading-none"
                                  >
                                    ▼
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="font-mono text-slate-400 tabular-nums whitespace-nowrap">
                            {stu.studentCode}
                          </td>
                          <td className="whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`font-medium ${
                                  isOut ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {stu.studentName}
                              </span>
                              {isOut && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (ย้ายออก)
                                </span>
                              )}
                              {isIn && (
                                <span
                                  className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                                  title={stu.transferNote}
                                >
                                  เข้าใหม่
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center tabular-nums whitespace-nowrap">
                            {isOut ? (
                              '—'
                            ) : (
                              <span
                                className={
                                  stu.attendancePercent < 80
                                    ? 'text-rose-600 font-semibold'
                                    : 'text-slate-600'
                                }
                              >
                                {stu.attendancePercent}%
                              </span>
                            )}
                          </td>
                          <td className="text-center tabular-nums whitespace-nowrap">
                            {isOut ? (
                              '—'
                            ) : (
                              <span
                                className={
                                  g.missingCount === 0
                                    ? 'text-slate-600'
                                    : 'text-rose-600 font-semibold'
                                }
                              >
                                {g.submittedCount}/{g.totalAssignedCount}
                              </span>
                            )}
                          </td>
                          <td className="text-center text-slate-600 tabular-nums">
                            {isOut ? '—' : g.u1}
                          </td>
                          <td className="text-center text-slate-600 tabular-nums">
                            {isOut ? '—' : g.u2}
                          </td>
                          <td className="text-center text-slate-600 tabular-nums">
                            {isOut ? '—' : g.u3}
                          </td>
                          <td className="text-center bg-slate-50/70 border-x border-slate-200/80 whitespace-nowrap">
                            {isOut ? (
                              '—'
                            ) : (
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  data-sgs-grade-row={rowIdx}
                                  value={g.effectiveAccumulated}
                                  onKeyDown={(e) => handleGradesKeyDown(e, rowIdx)}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ''
                                        ? null
                                        : Number(e.target.value);
                                    setSgsRoster(
                                      sgsRosterAndSubmissionService.updateStudentManualAccumulatedScore(
                                        stu.studentCode,
                                        val
                                      )
                                    );
                                  }}
                                  className={`w-12 h-6 text-center font-bold rounded tabular-nums text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                    g.isManualOverride
                                      ? 'bg-amber-50/80 text-amber-900 border border-amber-300'
                                      : 'bg-transparent hover:bg-white text-slate-900 border border-transparent hover:border-slate-200'
                                  }`}
                                  title="พิมพ์คะแนนแล้วกด Enter หรือ ↓ เพื่อลงบรรทัดถัดไป"
                                />
                                {g.isManualOverride && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSgsRoster(
                                        sgsRosterAndSubmissionService.updateStudentManualAccumulatedScore(
                                          stu.studentCode,
                                          null
                                        )
                                      )
                                    }
                                    className="text-[10px] text-slate-400 hover:text-slate-700"
                                    title={`คืนค่าตามชิ้นงาน (${g.calculatedAccumulated})`}
                                  >
                                    ↺
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                      <td className="text-center text-slate-600 tabular-nums">
                        {isOut ? '—' : g.midterm}
                      </td>
                      <td className="text-center text-slate-600 tabular-nums">
                        {isOut ? '—' : g.final}
                      </td>
                      <td className="text-center font-bold text-slate-900 tabular-nums">
                        {isOut ? '—' : g.total}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="text-slate-400">—</span>
                        ) : g.gradeLabel === 'ร' || g.gradeLabel === 'มส.' ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[11px]"
                            title={
                              g.missingMandatoryTitles.length > 0
                                ? `ค้างงานสำคัญ: ${g.missingMandatoryTitles.join(', ')}`
                                : undefined
                            }
                          >
                            {g.gradeLabel}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-800 tabular-nums">
                            {g.gradeLabel}
                          </span>
                        )}
                      </td>
                      {isRosterEditMode && (
                        <td className="text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              const updated =
                                sgsRosterAndSubmissionService.toggleStudentTransferOut(
                                  stu.studentCode
                                );
                              setSgsRoster(updated);
                            }}
                            className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-[10px] font-medium text-slate-600"
                          >
                            {isOut ? 'คืนสถานะ' : 'แจ้งย้ายออก'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                });
                })()}
              </tbody>
            </table>
          </div>

          {/* Modal เพิ่มนักเรียนย้ายเข้าใหม่กลางเทอม (รองรับการแทรกต่อท้ายผู้ชาย / ต่อท้ายสุด / ระบุเลขที่ SGS) */}
          {isTransferInModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!transferInName.trim()) return;
                  const updated =
                    sgsRosterAndSubmissionService.addTransferredInStudent({
                      studentCode: transferInCode.trim(),
                      studentName: transferInName.trim(),
                      gender: transferInGender,
                      insertPosition: transferInInsertPosition,
                      customSeatNo: Number(transferInCustomSeat) || undefined,
                      transferDate: transferInDate,
                      transferredU1Score: Number(transferInU1Score) || 0,
                    });
                  setSgsRoster(updated);
                  setTransferInName('');
                  setIsTransferInModalOpen(false);
                }}
                className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl text-xs"
              >
                <h3 className="text-sm font-bold text-slate-900">
                  + เพิ่มนักเรียนย้ายเข้าใหม่กลางเทอม (แทรกต่อท้ายผู้ชาย / เลือกเลขที่ตาม SGS)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      เพศของนักเรียน
                    </label>
                    <select
                      value={transferInGender}
                      onChange={(e) => {
                        const g = e.target.value as 'MALE' | 'FEMALE';
                        setTransferInGender(g);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    >
                      <option value="MALE">ชาย (ด.ช. / นาย)</option>
                      <option value="FEMALE">หญิง (ด.ญ. / น.ส.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      รหัสนักเรียน
                    </label>
                    <input
                      type="text"
                      required
                      value={transferInCode}
                      onChange={(e) => setTransferInCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล นักเรียนที่ย้ายเข้าใหม่
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ด.ช. ภูมิพัฒน์ เจริญรุ่งเรือง"
                    value={transferInName}
                    onChange={(e) => setTransferInName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                  <label className="block font-bold text-indigo-950">
                    ตำแหน่งเลขที่ในใบรายชื่อ SGS ของโรงเรียน:
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="insertPos"
                      checked={transferInInsertPosition === 'AFTER_SAME_GENDER'}
                      onChange={() =>
                        setTransferInInsertPosition('AFTER_SAME_GENDER')
                      }
                      className="mt-0.5 accent-indigo-600"
                    />
                    <span>
                      <strong>
                        ต่อท้ายกลุ่มเพศเดียวกัน (ผู้ชายต่อท้ายผู้ชาย / ผู้หญิงต่อท้ายผู้หญิง)
                      </strong>{' '}
                      — แทรกต่อท้ายนักเรียนชายคนสุดท้าย แล้วรันเลขที่นักเรียนหญิงต่อให้อัตโนมัติ
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="insertPos"
                      checked={transferInInsertPosition === 'END_OF_CLASS'}
                      onChange={() => setTransferInInsertPosition('END_OF_CLASS')}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <span>
                      <strong>ต่อท้ายสุดของห้องเรียน</strong> (เป็นเลขที่{' '}
                      {sgsRoster.length + 1} หลังนักเรียนหญิง)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="insertPos"
                      checked={transferInInsertPosition === 'CUSTOM_SEAT'}
                      onChange={() => setTransferInInsertPosition('CUSTOM_SEAT')}
                      className="accent-indigo-600"
                    />
                    <span>
                      <strong>ระบุเลขที่ตาม SGS เอง:</strong> แทรกที่เลขที่
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={sgsRoster.length + 1}
                      value={transferInCustomSeat}
                      onChange={(e) =>
                        setTransferInCustomSeat(Number(e.target.value))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 bg-white text-center font-bold"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      วันที่ย้ายเข้าเรียน
                    </label>
                    <input
                      type="date"
                      value={transferInDate}
                      onChange={(e) => setTransferInDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      คะแนนโอนจาก รร.เดิม (หน่วย 1 เต็ม 15)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={transferInU1Score}
                      onChange={(e) =>
                        setTransferInU1Score(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferInModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                  >
                    บันทึกและจัดลำดับเลขที่ตาม SGS
                  </button>
                </div>
              </form>
            </div>
          )}
          </div>
        </div>
      )}

      {/* 6. TAB: พฤติกรรม (Behavior Ledger) */}
      {activeTab === 'behavior' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                บันทึกพฤติกรรมและแต้มพิเศษ (Behavior & XP Ledger)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingBehavior((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกพฤติกรรม</span>
            </button>
          </div>

          {isAddingBehavior && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newBehaviorReason.trim()) return;
                const created = await behaviorService.create({
                  studentName: newBehaviorStudent,
                  type: newBehaviorType,
                  text: newBehaviorReason.trim(),
                  points: newBehaviorType === 'POSITIVE' ? '+5 XP' : '-2 คะแนน',
                });
                setBehaviorLogs([created, ...behaviorLogs]);
                setNewBehaviorReason('');
                setIsAddingBehavior(false);
                showToast(`บันทึกพฤติกรรมของ "${newBehaviorStudent}" เรียบร้อยแล้ว`);
              }}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
            >
              <select
                value={newBehaviorStudent}
                onChange={(e) => setNewBehaviorStudent(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium"
              >
                {sgsRoster
                  .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                  .map((s) => (
                    <option key={s.studentCode} value={s.studentName}>
                      {s.sgsSeatNo}. {s.studentName}
                    </option>
                  ))}
              </select>
              <select
                value={newBehaviorType}
                onChange={(e) =>
                  setNewBehaviorType(e.target.value as 'POSITIVE' | 'NEGATIVE')
                }
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium"
              >
                <option value="POSITIVE">+ ชื่นชม (+5 XP)</option>
                <option value="NEGATIVE">- ตักเตือน (-2 คะแนน)</option>
              </select>
              <input
                type="text"
                required
                value={newBehaviorReason}
                onChange={(e) => setNewBehaviorReason(e.target.value)}
                placeholder="ระบุรายละเอียดพฤติกรรม..."
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white flex-1 min-w-[200px]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-teal-600 text-white font-semibold"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBehavior(false)}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600"
              >
                ยกเลิก
              </button>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {behaviorLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    log.type === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {log.type === 'POSITIVE' ? '★' : '!'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {log.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.text}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    log.type === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {log.points}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {log.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB: บันทึกหลังสอน (Teaching Reflection) */}
      {activeTab === 'reflection' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                บันทึกผลหลังการจัดการเรียนรู้ (Post-teaching Reflection)
              </h3>
            </div>

            <button
              onClick={() => setIsAddReflectionOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มบันทึกหลังสอน</span>
            </button>
          </div>

          <div className="space-y-3">
            {reflectionLogs.map((ref, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <span className="text-slate-800">{ref.period}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {ref.topic}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <div>
                    <span className="font-bold text-emerald-800">✓ ผลการจัดกิจกรรม: </span>
                    <span className="text-slate-600">{ref.success}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800">ปัญหา / อุปสรรค: </span>
                    <span className="text-slate-600">{ref.obstacle}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">แนวทางแก้ไข: </span>
                    <span className="text-slate-600">{ref.solution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Roll-Call Modal (Synced with SGS Roster + Morning Assembly + Leave Status) */}
      {isRollCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  เช็คชื่อรายคาบ: {selectedDateForRollCall} (ศิลปะ ม.3/1)
                </h3>
              </div>
              <button
                onClick={() => setIsRollCallOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg">
              <span className="text-slate-600 font-medium">
                นักเรียนทั้งหมด {rollCallList.length} คน
              </span>
              <button
                onClick={() =>
                  setRollCallList(
                    rollCallList.map((s) => ({
                      ...s,
                      status: s.hasApprovedLeave ? 'LEAVE' : 'PRESENT',
                    }))
                  )
                }
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold text-[11px]"
              >
                มาครบทุกคน (คงสถานะคนลา)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {rollCallList.map((stu) => {
                const isLeaveOverridden =
                  stu.hasApprovedLeave && stu.status !== 'LEAVE';
                return (
                  <div
                    key={stu.no}
                    className="py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">
                          {stu.no}. {stu.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            stu.hasApprovedLeave
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : stu.assemblyLabel.includes('สาย')
                              ? 'bg-amber-50 text-amber-700'
                              : stu.assemblyLabel.includes('ขาด')
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {stu.assemblyLabel}
                        </span>
                      </div>
                      {isLeaveOverridden && (
                        <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                          ⚠️ นักเรียนส่งใบลาอนุมัติแล้ว (ระบบจะแจ้งเตือนเมื่อกดบันทึก)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(['PRESENT', 'LATE', 'LEAVE', 'ABSENT'] as const).map((st) => {
                        const labels: Record<string, string> = {
                          PRESENT: 'มา',
                          LATE: 'สาย',
                          LEAVE: 'ลา',
                          ABSENT: 'ขาด',
                        };
                        const isActive = stu.status === st;
                        return (
                          <button
                            key={st}
                            onClick={() =>
                              setRollCallList(
                                rollCallList.map((s) =>
                                  s.no === stu.no ? { ...s, status: st } : s
                                )
                              )
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                              isActive
                                ? st === 'PRESENT'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'LATE'
                                  ? 'bg-amber-500 text-white'
                                  : st === 'LEAVE'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {labels[st]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsRollCallOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRollCall}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl text-xs font-bold hover:bg-[#164282]"
              >
                บันทึกการเช็คชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Assignment */}
      {isNewAssignmentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">มอบหมายงานใหม่</h3>
              <button onClick={() => setIsNewAssignmentOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่องาน / ภารกิจ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ภาพวาดสีน้ำทิวทัศน์เมืองเชียงใหม่"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">หน่วยการเรียนรู้ SGS</label>
                  <select
                    value={newSgsUnit}
                    onChange={(e) => setNewSgsUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="หน่วยที่ 1">หน่วยที่ 1 (ทักษะสี)</option>
                    <option value="หน่วยที่ 2">หน่วยที่ 2 (ประวัติศาสตร์)</option>
                    <option value="หน่วยที่ 3">หน่วยที่ 3 (ประยุกต์ศิลป์)</option>
                    <option value="หน่วยที่ 4">หน่วยที่ 4 (สอบปฏิบัติ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">คะแนนเต็ม</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">กำหนดส่ง</label>
                <input
                  type="text"
                  placeholder="เช่น 30 ก.ย. หรือ 5 ต.ค."
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAssignmentOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl font-bold hover:bg-[#164282]"
                >
                  มอบหมายงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Google Classroom Sync Modal */}
      {isClassroomSyncOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  นำเข้าคะแนนจาก Google Classroom
                </h3>
              </div>
              <button onClick={() => setIsClassroomSyncOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
              <span className="font-bold">เชื่อมต่อบัญชี Google Workspace สำเร็จ</span>
              <p className="text-[11px] text-emerald-700">
                ห้องเรียน: ศ23101 ศิลปะ ม.3/1 (Class ID: gc-art-301)
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700">เลือกชิ้นงานที่ต้องการซิงก์คะแนน:</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2">
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>My Soundtrack (ส่งแล้ว 23/23)</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>อินโฟกราฟิค องค์ประกอบทางดนตรี (ส่งแล้ว 23/23)</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>เพลงแบบเพลง (ส่งแล้ว 21/23)</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsClassroomSyncOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setIsClassroomSyncOpen(false);
                  alert('ซิงก์คะแนนจาก Google Classroom เข้าสู่ระบบสำเร็จ 67 รายการ!');
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
              >
                เริ่มซิงก์ข้อมูลทันที
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Gradebook Fast Grading Modal */}
      {isGradebookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  บันทึกคะแนน: {selectedAssignmentForGrading}
                </h3>
                <p className="text-xs text-slate-500">ม.3/1 • คะแนนเต็ม 10 คะแนน</p>
              </div>
              <button onClick={() => setIsGradebookModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {sampleGradesRoster.slice(0, 8).map((stu) => (
                <div key={stu.no} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-800">
                    {stu.no}. {stu.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      max="10"
                      min="0"
                      defaultValue={stu.total > 50 ? (stu.total / 10).toFixed(1) : 4.0}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsGradebookModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  await scoreService.batchUpsertScores(
                    'asg-1',
                    'room-3-1',
                    10,
                    sampleGradesRoster.slice(0, 8).map((stu) => ({
                      enrollmentId: `stu-${stu.no}`,
                      value: stu.total > 50 ? Number((stu.total / 10).toFixed(1)) : 4.0,
                      reason: `บันทึกคะแนน ${selectedAssignmentForGrading || 'ชิ้นงาน'} (ด่วน)`,
                    }))
                  );
                  setIsGradebookModalOpen(false);
                  alert(`บันทึกคะแนน ${selectedAssignmentForGrading} พร้อม Audit Log เรียบร้อยแล้ว!`);
                }}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl font-bold hover:bg-[#164282]"
              >
                บันทึกคะแนนทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SGS Weighting Settings Modal */}
      {isWeightingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                โครงสร้างสัดส่วนคะแนน SGS (100 คะแนน)
              </h3>
              <button onClick={() => setIsWeightingModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>หน่วยที่ 1: ทักษะการวาดภาพและทฤษฎีสี</span>
                <span className="font-bold text-slate-800">15 คะแนน</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>หน่วยที่ 2: ประวัติศาสตร์ศิลป์และภูมิปัญญา</span>
                <span className="font-bold text-slate-800">20 คะแนน</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>สอบวัดผลกลางภาคเรียน</span>
                <span className="font-bold text-slate-800">20 คะแนน</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>หน่วยที่ 3: การสร้างสรรค์ประยุกต์ศิลป์</span>
                <span className="font-bold text-slate-800">15 คะแนน</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>สอบประเมินผลปลายภาคเรียน</span>
                <span className="font-bold text-slate-800">30 คะแนน</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-800">
              <span>ผลรวมสัดส่วนคะแนน</span>
              <span>15 + 20 + 20 + 15 + 30 = 100 คะแนนเต็ม (✓ ถูกต้อง)</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsWeightingModalOpen(false)}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Add Reflection Record Modal */}
      {isAddReflectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                เพิ่มบันทึกผลหลังการสอน
              </h3>
              <button onClick={() => setIsAddReflectionOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">คาบเรียนและวันที่</label>
                <input
                  type="text"
                  defaultValue="คาบ 8-9 (24 ก.ย. 2569)"
                  id="ref-period"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">ผลการจัดกิจกรรม</label>
                <textarea
                  rows={2}
                  id="ref-success"
                  placeholder="นักเรียนมีความเข้าใจและสามารถปฏิบัติงานได้ตามตัวชี้วัด..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">ปัญหา / อุปสรรค</label>
                <textarea
                  rows={2}
                  id="ref-obstacle"
                  placeholder="อุปกรณ์ไม่เพียงพอ หรือนักเรียนบางคนยังผสมสีไม่ได้ตามสัดส่วน..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">แนวทางแก้ไข</label>
                <textarea
                  rows={2}
                  id="ref-solution"
                  placeholder="สาธิตเพิ่มเติมรายกลุ่ม และเปิดคลิปแนะนำตัวอย่าง..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsAddReflectionOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  const p = (document.getElementById('ref-period') as HTMLInputElement)?.value || 'คาบ 8-9';
                  const s = (document.getElementById('ref-success') as HTMLTextAreaElement)?.value || 'นักเรียนปฏิบัติได้ดี';
                  const o = (document.getElementById('ref-obstacle') as HTMLTextAreaElement)?.value || 'ไม่มีปัญหาสำคัญ';
                  const sol = (document.getElementById('ref-solution') as HTMLTextAreaElement)?.value || 'ติดตามผลในคาบถัดไป';

                  setReflectionLogs([
                    { period: p, topic: 'การปฏิบัติงานศิลปะ', success: s, obstacle: o, solution: sol },
                    ...reflectionLogs,
                  ]);
                  setIsAddReflectionOpen(false);
                  alert('บันทึกผลหลังการสอนเรียบร้อย!');
                }}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl font-bold"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
