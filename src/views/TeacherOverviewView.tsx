import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckSquare,
  Sparkles,
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
import { AssignmentManagementView } from './AssignmentManagementView';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
} from '../services/sgsRosterAndSubmissionService';


interface TeacherOverviewViewProps {
  onSelectStudent: (student: AtRiskStudent) => void;
  onViewFullTable: () => void;
  onSwitchToAdventure: () => void;
}

export type ClassSubTab =
  | 'overview'
  | 'attendance'
  | 'assignments'
  | 'grades'
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
  onSwitchToAdventure,
}) => {
  const [activeTab, setActiveTab] = useState<ClassSubTab>('overview');
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
      attendedCount: 23,
      leaveCount: null,
    },
    {
      date: 'พฤ. 10 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'ทฤษฎีสีและวงจรสีสากล',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'CHECKED',
      attendedCount: 22,
      leaveCount: 1,
    },
    {
      date: 'พฤ. 3 ก.ย. 2569',
      period: 'คาบ 8-9',
      topic: 'องค์ประกอบศิลป์เบื้องต้น',
      status: 'NORMAL',
      statusLabel: 'สอนปกติ',
      checkStatus: 'CHECKED',
      attendedCount: 21,
      leaveCount: 2,
    },
  ]);

  // Roll-call interactive student states
  const [rollCallList, setRollCallList] = useState([
    { no: 1, name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', status: 'PRESENT' },
    { no: 2, name: 'ด.ช. จิรายุ เดชปันคำ', status: 'PRESENT' },
    { no: 7, name: 'ด.ช. ภูรินท์ บัณฑิต', status: 'LATE' },
    { no: 10, name: 'ด.ช. อัศวิน วนเกษตรกุล', status: 'ABSENT' },
    { no: 12, name: 'ด.ช. ชัยมงคล วงศ์บุตร', status: 'PRESENT' },
    { no: 15, name: 'ด.ช. ทัตธน คำฝั้น', status: 'PRESENT' },
    { no: 22, name: 'ด.ญ. อคิราห์ วิรากร', status: 'LEAVE' },
    { no: 23, name: 'ด.ญ. ปรียาภรณ์ ชัยแก้ว', status: 'PRESENT' },
  ]);

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
    alert(`บันทึกการเช็คชื่อวันที่ ${selectedDateForRollCall} สำเร็จ! มา ${presentCount} คน, ลา ${leaveCount} คน`);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header Card with Course Code & Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>← ชั้นเรียนของฉัน</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              ศ23101 ศิลปะ — ม.3/1
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ศ23101 • 23 นักเรียน • 1 หน่วยกิต • ภาคเรียนที่ 1/2569
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <button
              onClick={() => setIsWeightingModalOpen(true)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5 text-slate-400" />
              <span>สัดส่วนคะแนน</span>
            </button>
            <button
              onClick={() => alert('ย้ายรายวิชานี้ไปยังภาคเรียนอื่น หรือเปลี่ยนกลุ่มสาระฯ')}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-700 transition-colors"
            >
              ย้ายรายวิชา
            </button>
            <button
              onClick={() => {
                if (confirm('คุณต้องการลบชั้นเรียน ศ23101 ม.3/1 หรือไม่? รายการจะถูกย้ายไปถังขยะ 30 วัน')) {
                  alert('ย้ายชั้นเรียนไปยังถังขยะเรียบร้อย');
                }
              }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-xl font-medium transition-colors"
            >
              ลบชั้นเรียน
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            ภาพรวม
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            เช็คชื่อ
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            งาน / คะแนนสอบ
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'grades'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            สรุปคะแนน
          </button>

          <button
            onClick={() => setActiveTab('behavior')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'behavior'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            พฤติกรรม
          </button>

          <button
            onClick={() => setActiveTab('reflection')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reflection'
                ? 'border-[#0f2a59] text-[#0f2a59] font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            บันทึกหลังสอน
          </button>

          <button
            onClick={onSwitchToAdventure}
            className="px-3 py-2 border-b-2 border-transparent text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ห้องเรียนผจญภัย</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: ภาพรวม (Overview) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AtRiskCard
            students={atRiskStudentsData}
            onSelectStudent={onSelectStudent}
            onViewFullTable={onViewFullTable}
          />
          <IncompleteGradingCard items={incompleteGradingData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LowestAssignmentsCard items={lowestAssignmentsData} />
            <GradeDistributionBar items={gradeDistributionData} />
          </div>
        </div>
      )}

      {/* 3. TAB: เช็คชื่อ (Attendance) */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <CheckSquare className="w-4 h-4 text-slate-600" />
              <span>✓ คาบสอนทั้งหมด ({attendanceRows.length} คาบ)</span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <button
                onClick={() => alert('สร้างคาบเรียนทั้งภาคเรียนอัตโนมัติ (สัปดาห์ที่ 1 ถึง 20)')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>สร้างคาบทั้งภาคเรียน</span>
              </button>
              <button
                onClick={() => {
                  const newDate = prompt('กรอกวันที่และคาบสอนใหม่ (เช่น พฤ. 8 ต.ค. 2569 | คาบ 8-9):');
                  if (newDate) {
                    setAttendanceRows([
                      {
                        date: newDate,
                        period: 'คาบ 8-9',
                        topic: 'คาบสอนเพิ่มเติม',
                        status: 'NORMAL',
                        statusLabel: 'สอนปกติ',
                        checkStatus: 'ยังไม่เช็คชื่อ',
                        attendedCount: null,
                        leaveCount: null,
                      },
                      ...attendanceRows,
                    ]);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f2a59] hover:bg-[#0b1f42] text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มคาบสอน</span>
              </button>
            </div>
          </div>

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

      {/* 4. TAB: งาน / คะแนนสอบ (Assignments — ตารางส่งงานทั้งเทอม & โหมดตรวจงานรายชิ้น) */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <AssignmentManagementView />
        </div>
      )}

      {/* 5. TAB: สรุปคะแนน ปพ.5 & ซิงค์รายชื่อตรงบรรทัด SGS (Grades Summary Table) */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ตารางสรุปคะแนนรวม ปพ.5 & เตรียมนำเข้า SGS — ศ23101 ศิลปะ ม.3/1
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ดึงคะแนนเก็บหน่วยที่ 1–3 จากตารางตรวจงานอัตโนมัติ • ล็อกลำดับเลขที่ให้ตรงกับใบรายชื่อ SGS 100% (ป้องกันบรรทัดเลื่อนจากนักเรียนย้ายเข้า/ย้ายออก)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto text-xs">
              <button
                onClick={() => {
                  const sorted =
                    sgsRosterAndSubmissionService.sortRosterMaleFirstSgs();
                  setSgsRoster(sorted);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold transition-colors"
              >
                <span>🔄 จัดเรียง ชาย ➔ หญิง (ผู้ชายต่อท้ายผู้ชาย)</span>
              </button>

              <button
                onClick={() => setIsTransferInModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มนักเรียนย้ายเข้าใหม่ (ต่อท้ายผู้ชาย / เลือกเลขที่ SGS)</span>
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออกไฟล์ CSV/Excel ตรงบรรทัด SGS 100%</span>
              </button>
            </div>
          </div>

          {/* แถบป้องกันบรรทัดเลื่อนเมื่อมีนักเรียนย้ายเข้า-ย้ายออก */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-700">
              🛡️ <strong>รองรับการเรียงรายชื่อแบบโรงเรียนไทย (ชายขึ้นก่อนหญิง):</strong> เมื่อนักเรียนชายย้ายเข้าใหม่ ระบบสามารถ{' '}
              <span className="underline font-bold text-indigo-800">
                แทรกต่อท้ายกลุ่มนักเรียนชาย (เช่น เลขที่ 5 ด.ช. ณัฐวุฒิ)
              </span>{' '}
              และเลื่อนเลขที่กลุ่มนักเรียนหญิงลงไปอัตโนมัติโดยที่คะแนนและประวัติส่งงานไม่สลับคน (หรือกด ▲/▼ เพื่อขยับเลขที่ได้ทันที)
            </div>

            <label className="inline-flex items-center gap-2 font-bold text-teal-800 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={keepTransferredOutRow}
                onChange={() => setKeepTransferredOutRow((v) => !v)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <span>คงบรรทัดนักเรียนย้ายออกตาม SGS (แนะนำ)</span>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-3 text-center">เลขที่ SGS (ปรับลำดับ)</th>
                  <th className="py-3 px-3">รหัส</th>
                  <th className="py-3 px-3 min-w-48">ชื่อ-สกุล / สถานะย้ายเข้า-ออก</th>
                  <th className="py-3 px-3 text-center">เวลาเรียน</th>
                  <th className="py-3 px-3 text-center">ส่งงาน</th>
                  <th className="py-3 px-3 text-center">หน่วย 1 (15)</th>
                  <th className="py-3 px-3 text-center">หน่วย 2 (20)</th>
                  <th className="py-3 px-3 text-center">กลางภาค (20)</th>
                  <th className="py-3 px-3 text-center">หน่วย 3 (15)</th>
                  <th className="py-3 px-3 text-center">ปลายภาค (30)</th>
                  <th className="py-3 px-3 text-center font-bold text-teal-800">รวม (100)</th>
                  <th className="py-3 px-3 text-center font-bold">เกรด</th>
                  <th className="py-3 px-3 text-right">ปรับสถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(keepTransferredOutRow
                  ? sgsRoster
                  : sgsRoster.filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                ).map((stu) => {
                  const g =
                    sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                  const isOut = stu.transferState === 'TRANSFERRED_OUT';
                  const isIn = stu.transferState === 'TRANSFERRED_IN';

                  return (
                    <tr
                      key={stu.studentCode}
                      className={
                        isOut
                          ? 'bg-slate-100/80 text-slate-400'
                          : isIn
                          ? 'bg-indigo-50/30 hover:bg-indigo-50/50'
                          : 'hover:bg-slate-50 transition-colors'
                      }
                    >
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="w-6 text-center">{stu.sgsSeatNo}</span>
                          <div className="flex flex-col gap-0.5">
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
                              title="เลื่อนเลขที่ขึ้น 1 ลำดับ"
                              className="px-1 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-[9px] text-slate-600 leading-none"
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
                              title="เลื่อนเลขที่ลง 1 ลำดับ"
                              className="px-1 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-[9px] text-slate-600 leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 tabular-nums">
                        {stu.studentCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold ${
                              isOut ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {stu.studentName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              stu.gender === 'MALE'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {stu.gender === 'MALE' ? 'ชาย' : 'หญิง'}
                          </span>
                        </div>
                        {isOut && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                            ย้ายออก ({stu.transferDate}) — ล็อกเลขที่ {stu.sgsSeatNo} ตรง SGS
                          </span>
                        )}
                        {isIn && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
                            {stu.transferNote ||
                              `ย้ายเข้าใหม่ (${stu.transferDate}) — ต่อท้ายผู้ชาย`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {isOut ? (
                          '—'
                        ) : (
                          <span
                            className={`font-semibold ${
                              stu.attendancePercent < 80
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {stu.attendancePercent}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          '—'
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              g.missingCount === 0
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {g.submittedCount}/{g.totalAssignedCount} งาน
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold tabular-nums">
                        {isOut ? '—' : g.u1}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold tabular-nums">
                        {isOut ? '—' : g.u2}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {isOut ? '—' : g.midterm}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold tabular-nums">
                        {isOut ? '—' : g.u3}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {isOut ? '—' : g.final}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-teal-700 tabular-nums">
                        {isOut ? '—' : g.total}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${
                            isOut
                              ? 'bg-slate-200 text-slate-600'
                              : g.gradeLabel === 'มส.' || g.gradeLabel === 'ร'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {g.gradeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            const updated =
                              sgsRosterAndSubmissionService.toggleStudentTransferOut(
                                stu.studentCode
                              );
                            setSgsRoster(updated);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-600"
                        >
                          {isOut ? 'คืนสถานะปกติ' : 'แจ้งย้ายออก (คงเลขที่)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                <h3 className="text-base font-bold text-slate-900">
                  + เพิ่มนักเรียนย้ายเข้าใหม่กลางเทอม (แทรกต่อท้ายผู้ชาย / เลือกเลขที่ตาม SGS)
                </h3>
                <p className="text-slate-500">
                  เมื่อแทรกนักเรียนชายต่อท้ายกลุ่มผู้ชาย ระบบจะเลื่อนเลขที่กลุ่มนักเรียนหญิงลงไปอัตโนมัติ โดยที่ <strong>คะแนนและประวัติการส่งงานของนักเรียนหญิงทุกคนยังคงผูกตามรหัสประจำตัว ไม่สลับคน</strong>
                </p>

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
      )}

      {/* 6. TAB: พฤติกรรม (Behavior Ledger) */}
      {activeTab === 'behavior' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                บันทึกพฤติกรรมและแต้มพิเศษ (Behavior & XP Ledger)
              </h3>
              <p className="text-xs text-slate-400">
                บันทึกการทำความดี จิตอาสา และพฤติกรรมในห้องเรียนเพื่อเชื่อมโยงกับคุณลักษณะ 8 ประการ
              </p>
            </div>

            <button
              onClick={async () => {
                const name = prompt('กรอกชื่อนักเรียนที่ต้องการบันทึกพฤติกรรม:');
                if (name) {
                  const reason = prompt('กรอกรายละเอียดพฤติกรรม:') || 'มีวินัยในชั้นเรียน';
                  const created = await behaviorService.create({
                    studentName: name,
                    type: 'POSITIVE',
                    text: reason,
                    points: '+5 XP',
                  });
                  setBehaviorLogs([created, ...behaviorLogs]);
                  alert(`บันทึกพฤติกรรมของ "${name}" สำเร็จ (+5 XP สะสมในสมุดพฤติกรรม)`);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2a59] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#164282] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ บันทึกพฤติกรรม</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {behaviorLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                บันทึกผลหลังการจัดการเรียนรู้ (Post-teaching Reflection)
              </h3>
              <p className="text-xs text-slate-400">
                สรุปผลการจัดกิจกรรม ปัญหาอุปสรรค และแนวทางแก้ไขเพื่อใช้ประกอบ SAR / วPA
              </p>
            </div>

            <button
              onClick={() => setIsAddReflectionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2a59] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#164282] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มบันทึกหลังสอน</span>
            </button>
          </div>

          <div className="space-y-4">
            {reflectionLogs.map((ref, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <span className="text-blue-700">{ref.period}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {ref.topic}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="font-bold text-emerald-800">✓ ผลการจัดกิจกรรม: </span>
                    <span className="text-slate-600">{ref.success}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800">⚠️ ปัญหา / อุปสรรค: </span>
                    <span className="text-slate-600">{ref.obstacle}</span>
                  </div>
                  <div>
                    <span className="font-bold text-blue-800">💡 แนวทางแก้ไข / บันทึกเพิ่มเติม: </span>
                    <span className="text-slate-600">{ref.solution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Roll-Call Modal */}
      {isRollCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  เช็คชื่อเข้าชั้นเรียน: {selectedDateForRollCall}
                </h3>
                <p className="text-xs text-slate-500">ศ23101 ศิลปะ ม.3/1 (คาบ 8-9)</p>
              </div>
              <button
                onClick={() => setIsRollCallOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
              <span className="text-slate-600 font-medium">
                นักเรียนทั้งหมด {rollCallList.length} คน
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setRollCallList(rollCallList.map((s) => ({ ...s, status: 'PRESENT' })))
                  }
                  className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]"
                >
                  มาครบทุกคน
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {rollCallList.map((stu) => (
                <div key={stu.no} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-800">
                    {stu.no}. {stu.name}
                  </span>
                  <div className="flex items-center gap-1">
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
              ))}
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
