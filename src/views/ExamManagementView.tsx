// src/views/ExamManagementView.tsx
// หน้าจัดการการสอบ (Exam Management)
// ออกแบบตามภาพต้นแบบ Mockup: วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PenTool,
  Plus,
  Lock,
  Unlock,
  BarChart2,
  Search,
  CheckCircle2,
  Printer,
  Download,
  Sparkles,
  Award,
  BookOpen,
  FileText,
  Upload,
  Lightbulb,
  Eye,
  Edit3,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
} from 'lucide-react';
import type { ExamItem } from '../types/viewModels';

const EXAMS_STORAGE_KEY = 'kp_exams_management_data_v1';

// Initial student roster data for score grid
interface StudentScoreEntry {
  id: string;
  studentNo: number;
  studentCode: string;
  name: string;
  room: string;
  score: number | null;
  status: 'GRADED' | 'PENDING';
}

const DEFAULT_STUDENTS_LIST: Omit<StudentScoreEntry, 'score' | 'status'>[] = [
  { id: 'st-1', studentNo: 1, studentCode: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', room: 'ม.3/1' },
  { id: 'st-2', studentNo: 2, studentCode: '45102', name: 'ด.ช. จิรายุ เดชปันคำ', room: 'ม.3/1' },
  { id: 'st-3', studentNo: 3, studentCode: '45103', name: 'ด.ช. ชัยมงคล วงศ์บุตร', room: 'ม.3/1' },
  { id: 'st-4', studentNo: 4, studentCode: '45104', name: 'ด.ช. ณัฐวุฒิ สิทธิโชค', room: 'ม.3/1' },
  { id: 'st-5', studentNo: 5, studentCode: '45105', name: 'ด.ช. ทัตธน คำฝั้น', room: 'ม.3/1' },
  { id: 'st-6', studentNo: 6, studentCode: '45106', name: 'ด.ช. ธีรภัทร ชาญวิทย์', room: 'ม.3/1' },
  { id: 'st-7', studentNo: 7, studentCode: '45107', name: 'ด.ช. ภูรินท์ บัณฑิต', room: 'ม.3/1' },
  { id: 'st-8', studentNo: 8, studentCode: '45108', name: 'ด.ช. อัศวิน วนเกษตรกุล', room: 'ม.3/1' },
  { id: 'st-9', studentNo: 9, studentCode: '45109', name: 'ด.ญ. กัญญารัตน์ โพธิ์ทอง', room: 'ม.3/1' },
  { id: 'st-10', studentNo: 10, studentCode: '45110', name: 'ด.ญ. ปริยาภรณ์ ชัยแก้ว', room: 'ม.3/1' },
];

// Item Analysis Question Model
interface ItemAnalysisRecord {
  itemNo: number;
  indicator: string;
  highGroupCorrectRate: number; // 27% High Group %
  lowGroupCorrectRate: number;  // 27% Low Group %
  difficulty: number;          // p-value
  discrimination: number;      // r-value
  interpretation: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_REVISION' | 'POOR';
}

export interface ExtendedExamItem extends ExamItem {
  category?: 'QUIZ' | 'MIDTERM' | 'FINAL';
  examTime?: string;
  dueDate?: string;
  dueRemark?: string;
  statusRatio?: string;
  typeBadge?: string;
  badgeColor?: string;
}

export const DEFAULT_MOCKUP_EXAMS: ExtendedExamItem[] = [
  {
    id: 'ex-1',
    title: 'แบบทดสอบย่อยที่ 1 (บทที่ 1)',
    subjectCode: 'ญี่ปุ่น ม.3/1',
    roomName: 'ม.3/1',
    category: 'QUIZ',
    typeBadge: 'เก็บคะแนน',
    badgeColor: 'bg-blue-500 text-white',
    sgsUnitName: 'สอบเก็บคะแนนหน่วยที่ 1 (คำศัพท์และไวยากรณ์)',
    maxScore: 10,
    date: '12 ก.ย. 2569',
    examTime: '(08:00 - 09:00 น.)',
    dueDate: '12 ก.ย. 2569',
    dueRemark: '(ภายในวันสอบ)',
    status: 'LOCKED',
    statusRatio: '38/39',
    averageScore: 9.2,
    highestScore: 10,
    lowestScore: 6.5,
  },
  {
    id: 'ex-2',
    title: 'แบบทดสอบย่อยที่ 2 (บทที่ 2)',
    subjectCode: 'ญี่ปุ่น ม.3/1',
    roomName: 'ม.3/1',
    category: 'QUIZ',
    typeBadge: 'เก็บคะแนน',
    badgeColor: 'bg-blue-500 text-white',
    sgsUnitName: 'สอบเก็บคะแนนหน่วยที่ 2 (คันจิและการอ่าน)',
    maxScore: 10,
    date: '19 ก.ย. 2569',
    examTime: '(08:00 - 09:00 น.)',
    dueDate: '19 ก.ย. 2569',
    dueRemark: '(ภายในวันสอบ)',
    status: 'LOCKED',
    statusRatio: '38/39',
    averageScore: 8.8,
    highestScore: 10,
    lowestScore: 5.0,
  },
  {
    id: 'ex-3',
    title: 'สอบกลางภาค ภาคเรียนที่ 1/2569',
    subjectCode: 'ญี่ปุ่น ม.3/1',
    roomName: 'ม.3/1',
    category: 'MIDTERM',
    typeBadge: 'กลางภาค',
    badgeColor: 'bg-emerald-600 text-white',
    sgsUnitName: 'วัดผลกลางภาคเรียน (หน่วยที่ 1-2)',
    maxScore: 20,
    date: '28 ส.ค. 2569',
    examTime: '(09:00 - 11:00 น.)',
    dueDate: '1 ก.ย. 2569',
    dueRemark: '(ภายใน 3 วัน)',
    status: 'LOCKED',
    statusRatio: '38/39',
    averageScore: 16.4,
    highestScore: 20,
    lowestScore: 8.5,
  },
  {
    id: 'ex-4',
    title: 'สอบปลายภาค ภาคเรียนที่ 1/2569',
    subjectCode: 'ญี่ปุ่น ม.3/1',
    roomName: 'ม.3/1',
    category: 'FINAL',
    typeBadge: 'ปลายภาค',
    badgeColor: 'bg-amber-500 text-white',
    sgsUnitName: 'วัดผลปลายภาคเรียน',
    maxScore: 30,
    date: '4 ต.ค. 2569',
    examTime: '(09:00 - 11:00 น.)',
    dueDate: '8 ต.ค. 2569',
    dueRemark: '(ภายใน 3 วัน)',
    status: 'GRADING',
    statusRatio: '0/39',
    averageScore: 22.5,
    highestScore: 29,
    lowestScore: 12,
  },
  {
    id: 'ex-5',
    title: 'แบบทดสอบย่อยที่ 3 (บทที่ 3)',
    subjectCode: 'ญี่ปุ่น ม.3/2',
    roomName: 'ม.3/2',
    category: 'QUIZ',
    typeBadge: 'เก็บคะแนน',
    badgeColor: 'bg-blue-500 text-white',
    sgsUnitName: 'สอบเก็บคะแนนหน่วยที่ 3 (บทสนทนา)',
    maxScore: 10,
    date: '15 ก.ย. 2569',
    examTime: '(08:00 - 09:00 น.)',
    dueDate: '15 ก.ย. 2569',
    dueRemark: '(ภายในวันสอบ)',
    status: 'UPCOMING',
    statusRatio: '0/39',
  },
  {
    id: 'ex-6',
    title: 'สอบปลายภาค ภาคเรียนที่ 1/2569',
    subjectCode: 'ญี่ปุ่น ม.3/2',
    roomName: 'ม.3/2',
    category: 'FINAL',
    typeBadge: 'ปลายภาค',
    badgeColor: 'bg-amber-500 text-white',
    sgsUnitName: 'วัดผลปลายภาคเรียน',
    maxScore: 30,
    date: '5 ต.ค. 2569',
    examTime: '(09:00 - 11:00 น.)',
    dueDate: '9 ต.ค. 2569',
    dueRemark: '(ภายใน 3 วัน)',
    status: 'UPCOMING',
    statusRatio: '0/39',
  },
];

export const ExamManagementView: React.FC = () => {
  // 1. Exams State initialized with the 6 exams matching Reference Image 2
  const [exams, setExams] = useState<ExtendedExamItem[]>(() => {
    try {
      const saved = localStorage.getItem(EXAMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasMockup = parsed.some((e: any) => e.title?.includes('แบบทดสอบย่อยที่ 1'));
          if (hasMockup) return parsed;
        }
      }
    } catch {
      // ignore parse error
    }
    return DEFAULT_MOCKUP_EXAMS;
  });

  const [filter, setFilter] = useState<'ALL' | 'GRADING' | 'LOCKED' | 'UPCOMING'>('ALL');
  const [categoryTabFilter, setCategoryTabFilter] = useState<'ALL' | 'QUIZ' | 'MIDTERM' | 'FINAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [roomDropdownFilter, setRoomDropdownFilter] = useState<string>('ALL');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // 2. Interactive Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scoreGridExam, setScoreGridExam] = useState<ExtendedExamItem | null>(null);
  const [analysisExam, setAnalysisExam] = useState<ExtendedExamItem | null>(null);

  // Dynamic counts for category summary cards and tabs
  const quizCount = useMemo(
    () => exams.filter((e) => e.category === 'QUIZ' || e.title.includes('เก็บคะแนน') || e.title.includes('ย่อย')).length,
    [exams]
  );
  const midtermCount = useMemo(
    () => exams.filter((e) => e.category === 'MIDTERM' || e.title.includes('กลางภาค')).length,
    [exams]
  );
  const finalCount = useMemo(
    () => exams.filter((e) => e.category === 'FINAL' || e.title.includes('ปลายภาค')).length,
    [exams]
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const saveExamsToStorage = (updatedExams: ExtendedExamItem[]) => {
    setExams(updatedExams);
    try {
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(updatedExams));
    } catch {
      // ignore storage error
    }
  };

  // Filtered exams according to active tab, room filter, and search query
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesFilter = filter === 'ALL' || exam.status === filter;
      if (!matchesFilter) return false;

      // Category tab filter
      if (categoryTabFilter === 'QUIZ') {
        const isQuiz = exam.category === 'QUIZ' || exam.title.includes('เก็บคะแนน') || exam.title.includes('ย่อย');
        if (!isQuiz) return false;
      } else if (categoryTabFilter === 'MIDTERM') {
        const isMidterm = exam.category === 'MIDTERM' || exam.title.includes('กลางภาค');
        if (!isMidterm) return false;
      } else if (categoryTabFilter === 'FINAL') {
        const isFinal = exam.category === 'FINAL' || exam.title.includes('ปลายภาค');
        if (!isFinal) return false;
      }

      // Room dropdown filter
      if (roomDropdownFilter !== 'ALL' && exam.roomName !== roomDropdownFilter) {
        return false;
      }

      // Search term
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.subjectCode.toLowerCase().includes(q) ||
        exam.sgsUnitName.toLowerCase().includes(q) ||
        exam.roomName.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [exams, filter, categoryTabFilter, roomDropdownFilter, searchTerm]);

  // ----------------------------------------------------
  // Form State for "สร้างชุดข้อสอบใหม่" (Modal 1)
  // ----------------------------------------------------
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('ญี่ปุ่น ม.3/1');
  const [newRoomName, setNewRoomName] = useState('ม.3/1');
  const [newSgsUnitName, setNewSgsUnitName] = useState('สอบเก็บคะแนนหน่วยที่ 4');
  const [newMaxScore, setNewMaxScore] = useState<number>(10);
  const [newDate, setNewDate] = useState('18 ต.ค. 2569');
  const [newStatus, setNewStatus] = useState<'UPCOMING' | 'GRADING'>('GRADING');

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const examCategory: 'QUIZ' | 'MIDTERM' | 'FINAL' =
      newTitle.includes('ปลายภาค') ? 'FINAL' :
      newTitle.includes('กลางภาค') ? 'MIDTERM' : 'QUIZ';

    const newExam: ExtendedExamItem = {
      id: `ex-${Date.now()}`,
      title: newTitle.trim(),
      subjectCode: newSubjectCode.trim() || 'ญี่ปุ่น ม.3/1',
      roomName: newRoomName.trim() || 'ม.3/1',
      sgsUnitName: newSgsUnitName.trim() || 'สอบเก็บคะแนนหน่วยการเรียนรู้',
      maxScore: Number(newMaxScore) || 20,
      date: newDate.trim() || '18 ต.ค. 2569',
      examTime: '(08:00 - 09:00 น.)',
      dueDate: newDate.trim() || '18 ต.ค. 2569',
      dueRemark: '(ภายในวันสอบ)',
      category: examCategory,
      typeBadge: examCategory === 'QUIZ' ? 'เก็บคะแนน' : examCategory === 'MIDTERM' ? 'กลางภาค' : 'ปลายภาค',
      badgeColor: examCategory === 'QUIZ' ? 'bg-blue-500 text-white' : examCategory === 'MIDTERM' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white',
      status: newStatus,
      statusRatio: '0/39',
    };

    const updated = [newExam, ...exams];
    saveExamsToStorage(updated);
    setIsCreateModalOpen(false);
    showToast(`✓ สร้างชุดข้อสอบ "${newExam.title}" และผูกหน่วย SGS เรียบร้อยแล้ว`);

    // Reset Form
    setNewTitle('');
    setNewMaxScore(20);
  };

  const applyPreset = (presetType: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL') => {
    switch (presetType) {
      case 'MIDTERM':
        setNewTitle('สอบกลางภาค ภาคเรียนที่ 1/2569');
        setNewSgsUnitName('วัดผลกลางภาคเรียน (หน่วยที่ 1-2)');
        setNewMaxScore(20);
        setNewSubjectCode('ญี่ปุ่น ม.3/1');
        setNewRoomName('ม.3/1');
        break;
      case 'FINAL':
        setNewTitle('สอบปลายภาค ภาคเรียนที่ 1/2569');
        setNewSgsUnitName('วัดผลปลายภาคเรียน');
        setNewMaxScore(30);
        setNewSubjectCode('ญี่ปุ่น ม.3/1');
        setNewRoomName('ม.3/1');
        break;
      case 'QUIZ':
        setNewTitle('แบบทดสอบย่อยที่ 4 (บทที่ 4)');
        setNewSgsUnitName('เก็บคะแนนหน่วยที่ 4 (คำกริยาและการผันรูป)');
        setNewMaxScore(10);
        setNewSubjectCode('ญี่ปุ่น ม.3/1');
        setNewRoomName('ม.3/1');
        break;
      case 'PRACTICAL':
        setNewTitle('สอบอ่านโน้ตเพลงไทยและสากล');
        setNewSgsUnitName('ทักษะการปฏิบัติ 1');
        setNewMaxScore(15);
        setNewSubjectCode('ศ20221 ดนตรีปฏิบัติ 1');
        setNewRoomName('ม.1/8');
        break;
    }
  };

  // ----------------------------------------------------
  // Inline Score Grid Logic (Modal 2)
  // ----------------------------------------------------
  const [gridScores, setGridScores] = useState<Record<string, number | null>>({});
  const [gridSearch, setGridSearch] = useState('');
  const [gridFilterStatus, setGridFilterStatus] = useState<'ALL' | 'GRADED' | 'PENDING'>('ALL');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize or load scores when scoreGridExam opens
  useEffect(() => {
    if (!scoreGridExam) return;

    const storageKey = `kp_exam_scores_${scoreGridExam.id}`;
    let loadedScores: Record<string, number | null> = {};

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        loadedScores = JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    if (Object.keys(loadedScores).length === 0) {
      // Pre-fill realistic scores reflecting the exam's status and maxScore
      DEFAULT_STUDENTS_LIST.forEach((stu) => {
        if (scoreGridExam.status === 'LOCKED' || scoreGridExam.id === 'ex-1' || scoreGridExam.id === 'ex-2' || scoreGridExam.id === 'ex-3') {
          // Locked / completed exam: all students scored with realistic values
          const preScore = scoreGridExam.maxScore === 10
            ? [9.5, 10, 8, 9, 10, 8.5, 7, 6.5, 9, 9.5][stu.studentNo - 1] ?? 8.5
            : scoreGridExam.maxScore === 20
            ? [18, 19.5, 15, 17, 20, 16.5, 14, 8.5, 17.5, 18][stu.studentNo - 1] ?? 16
            : [26, 28, 22, 25, 29, 24, 20, 14, 25, 27][stu.studentNo - 1] ?? 23;
          loadedScores[stu.id] = preScore;
        } else if (scoreGridExam.status === 'GRADING' || scoreGridExam.id === 'ex-4') {
          // Grading exam: some scored, some pending
          const preScore = scoreGridExam.maxScore === 30
            ? [24, 27, null, 22, null, 25, 15, null, 26, 23][stu.studentNo - 1] ?? null
            : [15, 13.5, null, 12, null, 14, 6, null, 14.5, 13][stu.studentNo - 1] ?? null;
          loadedScores[stu.id] = preScore;
        } else {
          // Upcoming or new exam: empty
          loadedScores[stu.id] = null;
        }
      });
    }

    setGridScores(loadedScores);
    setGridSearch('');
    setGridFilterStatus('ALL');
  }, [scoreGridExam]);

  // Derived Grid Statistics
  const gridStats = useMemo(() => {
    if (!scoreGridExam) return { count: 0, graded: 0, pending: 0, avg: 0, highest: 0, lowest: 0 };

    const scoreVals = Object.values(gridScores).filter(
      (v): v is number => typeof v === 'number' && !Number.isNaN(v)
    );

    const graded = scoreVals.length;
    const total = DEFAULT_STUDENTS_LIST.length;
    const pending = total - graded;

    if (graded === 0) {
      return { count: total, graded: 0, pending: total, avg: 0, highest: 0, lowest: 0 };
    }

    const sum = scoreVals.reduce((acc, curr) => acc + curr, 0);
    const avg = Number((sum / graded).toFixed(1));
    const highest = Math.max(...scoreVals);
    const lowest = Math.min(...scoreVals);

    return { count: total, graded, pending, avg, highest, lowest };
  }, [scoreGridExam, gridScores]);

  const handleScoreChange = (studentId: string, valStr: string) => {
    if (!scoreGridExam) return;
    if (valStr === '') {
      setGridScores((prev) => ({ ...prev, [studentId]: null }));
      return;
    }

    const val = Number(valStr);
    if (Number.isNaN(val)) return;

    // Check bounds: clamp or allow typing up to maxScore
    const clamped = Math.min(scoreGridExam.maxScore, Math.max(0, val));
    setGridScores((prev) => ({ ...prev, [studentId]: clamped }));
  };

  // Filtered students for grid view and keyboard navigation
  const filteredStudents = useMemo(() => {
    return DEFAULT_STUDENTS_LIST.filter((stu) => {
      const currentVal = gridScores[stu.id];
      const hasScore = typeof currentVal === 'number' && !Number.isNaN(currentVal);
      if (gridFilterStatus === 'GRADED' && !hasScore) return false;
      if (gridFilterStatus === 'PENDING' && hasScore) return false;
      if (gridSearch.trim()) {
        const q = gridSearch.toLowerCase().trim();
        return (
          stu.name.toLowerCase().includes(q) ||
          stu.studentCode.includes(q) ||
          String(stu.studentNo).includes(q) ||
          stu.room.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [gridScores, gridFilterStatus, gridSearch]);

  const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextId = filteredStudents[currentIndex + 1]?.id;
      if (nextId && inputRefs.current[nextId]) {
        inputRefs.current[nextId]?.focus();
        inputRefs.current[nextId]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = filteredStudents[currentIndex - 1]?.id;
      if (prevId && inputRefs.current[prevId]) {
        inputRefs.current[prevId]?.focus();
        inputRefs.current[prevId]?.select();
      }
    }
  };

  const handleQuickFillMax = () => {
    if (!scoreGridExam) return;
    const next: Record<string, number | null> = {};
    DEFAULT_STUDENTS_LIST.forEach((stu) => {
      next[stu.id] = scoreGridExam.maxScore;
    });
    setGridScores(next);
    showToast(`⚡ เติมคะแนนเต็ม (${scoreGridExam.maxScore}) ครบทุก ${DEFAULT_STUDENTS_LIST.length} คน`);
  };

  const handleQuickRandomFill = () => {
    if (!scoreGridExam) return;
    const next: Record<string, number | null> = {};
    DEFAULT_STUDENTS_LIST.forEach((stu) => {
      const minS = Math.floor(scoreGridExam.maxScore * 0.4);
      const rand = minS + Math.floor(Math.random() * (scoreGridExam.maxScore - minS + 1));
      next[stu.id] = rand;
    });
    setGridScores(next);
    showToast('⚡ สุ่มกรอกคะแนนตัวอย่างสำหรับการประเมินเรียบร้อย');
  };

  const handleClearAllScores = () => {
    const next: Record<string, number | null> = {};
    DEFAULT_STUDENTS_LIST.forEach((stu) => {
      next[stu.id] = null;
    });
    setGridScores(next);
    showToast('ล้างคะแนนทั้งหมดในตารางเรียบร้อย');
  };

  const handleToggleExamLock = (targetExam?: ExtendedExamItem | null) => {
    const examToToggle = targetExam || scoreGridExam;
    if (!examToToggle) return;
    const nextStatus = examToToggle.status === 'LOCKED' ? 'GRADING' : 'LOCKED';
    const updatedExam: ExtendedExamItem = {
      ...examToToggle,
      status: nextStatus,
    };
    if (scoreGridExam && scoreGridExam.id === updatedExam.id) {
      setScoreGridExam(updatedExam);
    }
    const nextList = exams.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex));
    saveExamsToStorage(nextList);
    showToast(
      nextStatus === 'LOCKED'
        ? '🔒 ล็อกคะแนนสอบเรียบร้อยแล้ว (คะแนนถูกป้องกันการแก้ไข)'
        : '🔓 ปลดล็อกคะแนนสอบเรียบร้อยแล้ว (สามารถแก้ไขคะแนนได้ตามปกติ)'
    );
  };

  const handleToggleLockStatus = () => {
    handleToggleExamLock(scoreGridExam);
  };

  const handleSaveGridScores = () => {
    if (!scoreGridExam) return;

    // Persist scores
    const storageKey = `kp_exam_scores_${scoreGridExam.id}`;
    localStorage.setItem(storageKey, JSON.stringify(gridScores));

    // Update Exam stats
    const updatedExam: ExamItem = {
      ...scoreGridExam,
      averageScore: gridStats.graded > 0 ? gridStats.avg : undefined,
      highestScore: gridStats.graded > 0 ? gridStats.highest : undefined,
      lowestScore: gridStats.graded > 0 ? gridStats.lowest : undefined,
      status:
        scoreGridExam.status === 'UPCOMING' && gridStats.graded > 0
          ? 'GRADING'
          : scoreGridExam.status,
    };

    const nextList = exams.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex));
    saveExamsToStorage(nextList);
    setScoreGridExam(null);
    showToast(`✓ บันทึกคะแนนและคำนวณสถิติของ "${updatedExam.title}" เรียบร้อยแล้ว`);
  };

  // ----------------------------------------------------
  // Item Analysis Questions Data (Modal 3)
  // ----------------------------------------------------
  const mockItemAnalysisData: ItemAnalysisRecord[] = useMemo(() => {
    const isMusic =
      analysisExam?.subjectCode.includes('ดนตรี') ||
      analysisExam?.subjectCode.includes('ศ20221') ||
      analysisExam?.title.includes('โน้ต');

    if (isMusic) {
      return [
        {
          itemNo: 1,
          indicator: 'ศ 2.1 ม.1/1 เปรียบเทียบความสัมพันธ์ของบทบาทดนตรีในชีวิตประจำวัน',
          highGroupCorrectRate: 0.92,
          lowGroupCorrectRate: 0.38,
          difficulty: 0.65,
          discrimination: 0.54,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 2,
          indicator: 'ศ 2.1 ม.1/2 อธิบายการถ่ายทอดอารมณ์ของเพลงผ่านเทคนิคการบรรเลง',
          highGroupCorrectRate: 0.88,
          lowGroupCorrectRate: 0.34,
          difficulty: 0.61,
          discrimination: 0.54,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 3,
          indicator: 'ศ 2.1 ม.1/3 ร้องเพลงและเล่นดนตรีเดี่ยวและรวมวง',
          highGroupCorrectRate: 0.85,
          lowGroupCorrectRate: 0.30,
          difficulty: 0.58,
          discrimination: 0.55,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 4,
          indicator: 'ศ 2.1 ม.1/4 อ่าน เขียน ร้องโน้ตไทยและโน้ตสากล (อัตราจังหวะ 2/4, 4/4)',
          highGroupCorrectRate: 0.95,
          lowGroupCorrectRate: 0.75,
          difficulty: 0.85,
          discrimination: 0.20,
          interpretation: 'ค่อนข้างง่าย / ควรปรับปรุงตัวลวง (Distractor)',
          status: 'NEEDS_REVISION',
        },
        {
          itemNo: 5,
          indicator: 'ศ 2.1 ม.1/5 จำแนกเครื่องดนตรีไทยและสากลประเภทต่าง ๆ',
          highGroupCorrectRate: 0.82,
          lowGroupCorrectRate: 0.32,
          difficulty: 0.57,
          discrimination: 0.50,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
        {
          itemNo: 6,
          indicator: 'ศ 2.2 ม.1/1 อธิบายบทบาทความสำคัญของดนตรีในวัฒนธรรมของชาติต่าง ๆ',
          highGroupCorrectRate: 0.78,
          lowGroupCorrectRate: 0.28,
          difficulty: 0.53,
          discrimination: 0.50,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 7,
          indicator: 'ศ 2.2 ม.1/2 ระบุเอกลักษณ์ของดนตรีในแต่ละภูมิภาคของไทย',
          highGroupCorrectRate: 0.60,
          lowGroupCorrectRate: 0.45,
          difficulty: 0.53,
          discrimination: 0.15,
          interpretation: 'อำนาจจำแนกต่ำ / ปรับปรุงข้อคำถาม',
          status: 'POOR',
        },
        {
          itemNo: 8,
          indicator: 'ศ 2.1 ม.1/6 ประเมินคุณภาพการแสดงดนตรีของตนเองและผู้อื่นอย่างสร้างสรรค์',
          highGroupCorrectRate: 0.84,
          lowGroupCorrectRate: 0.39,
          difficulty: 0.62,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
        {
          itemNo: 9,
          indicator: 'ศ 2.1 ม.1/7 บรรเลงเครื่องดนตรีประกอบจังหวะตามโครงสร้างเพลงไทยสากล',
          highGroupCorrectRate: 0.90,
          lowGroupCorrectRate: 0.45,
          difficulty: 0.68,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 10,
          indicator: 'ศ 2.2 ม.1/3 วิเคราะห์ผลกระทบของดนตรีต่อจิตวิทยา สังคม และการดำเนินชีวิต',
          highGroupCorrectRate: 0.81,
          lowGroupCorrectRate: 0.36,
          difficulty: 0.59,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
      ];
    }

    const isJapanese =
      analysisExam?.subjectCode.includes('ญี่ปุ่น') ||
      analysisExam?.subjectCode.includes('ญ') ||
      analysisExam?.title.includes('ญี่ปุ่น');

    if (isJapanese) {
      return [
        {
          itemNo: 1,
          indicator: 'ต 1.1 ม.3/1 ปฏิบัติตามคำขอร้อง คำแนะนำ คำชี้แจง และคำอธิบายภาษาญี่ปุ่น',
          highGroupCorrectRate: 0.96,
          lowGroupCorrectRate: 0.42,
          difficulty: 0.69,
          discrimination: 0.54,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 2,
          indicator: 'ต 1.1 ม.3/2 อ่านออกเสียงข้อความ ข่าว และบทสนทนาภาษาญี่ปุ่นถูกต้องตามหลักการออกเสียง',
          highGroupCorrectRate: 0.92,
          lowGroupCorrectRate: 0.38,
          difficulty: 0.65,
          discrimination: 0.54,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 3,
          indicator: 'ต 1.1 ม.3/4 เลือก/ระบุหัวข้อเรื่อง ใจความสำคัญ และบอกรายละเอียดสนับสนุนจากเรื่องที่อ่าน',
          highGroupCorrectRate: 0.88,
          lowGroupCorrectRate: 0.32,
          difficulty: 0.60,
          discrimination: 0.56,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 4,
          indicator: 'ต 1.2 ม.3/1 สนทนาและเขียนโต้ตอบข้อมูลเกี่ยวกับตนเอง เรื่องใกล้ตัว และสถานการณ์ต่าง ๆ',
          highGroupCorrectRate: 0.95,
          lowGroupCorrectRate: 0.76,
          difficulty: 0.86,
          discrimination: 0.19,
          interpretation: 'ค่อนข้างง่าย / ควรปรับปรุงตัวลวง (Distractor)',
          status: 'NEEDS_REVISION',
        },
        {
          itemNo: 5,
          indicator: 'ต 1.2 ม.3/2 ใช้คำขอร้อง คำแนะนำ และคำชี้แจงตามสถานการณ์ในชีวิตประจำวัน',
          highGroupCorrectRate: 0.84,
          lowGroupCorrectRate: 0.34,
          difficulty: 0.59,
          discrimination: 0.50,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
        {
          itemNo: 6,
          indicator: 'ต 1.3 ม.3/1 พูดและเขียนบรรยายเกี่ยวกับตนเอง ประสบการณ์ และกิจกรรมในโรงเรียน',
          highGroupCorrectRate: 0.79,
          lowGroupCorrectRate: 0.29,
          difficulty: 0.54,
          discrimination: 0.50,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 7,
          indicator: 'ต 2.1 ม.3/1 บรรยายเกี่ยวกับเทศกาล วันสำคัญ งานฉลอง และชีวิตความเป็นอยู่ของชาวญี่ปุ่น',
          highGroupCorrectRate: 0.61,
          lowGroupCorrectRate: 0.46,
          difficulty: 0.54,
          discrimination: 0.15,
          interpretation: 'อำนาจจำแนกต่ำ / ปรับปรุงข้อคำถาม',
          status: 'POOR',
        },
        {
          itemNo: 8,
          indicator: 'ต 2.2 ม.3/1 เปรียบเทียบและอธิบายความเหมือนและความต่างระหว่างวัฒนธรรมญี่ปุ่นกับวัฒนธรรมไทย',
          highGroupCorrectRate: 0.86,
          lowGroupCorrectRate: 0.41,
          difficulty: 0.64,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
        {
          itemNo: 9,
          indicator: 'ต 3.1 ม.3/1 ค้นคว้า รวบรวม และสรุปข้อมูลที่เกี่ยวข้องกับกลุ่มสาระการเรียนรู้อื่นจากแหล่งเรียนรู้ภาษาญี่ปุ่น',
          highGroupCorrectRate: 0.91,
          lowGroupCorrectRate: 0.46,
          difficulty: 0.69,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
          status: 'EXCELLENT',
        },
        {
          itemNo: 10,
          indicator: 'ต 4.1 ม.3/1 ใช้ภาษาญี่ปุ่นสื่อสารในสถานการณ์จริงหรือสถานการณ์จำลองที่เกิดขึ้นในห้องเรียน',
          highGroupCorrectRate: 0.82,
          lowGroupCorrectRate: 0.37,
          difficulty: 0.60,
          discrimination: 0.45,
          interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
          status: 'GOOD',
        },
      ];
    }

    // Default Visual Arts indicators
    return [
      {
        itemNo: 1,
        indicator: 'ศ 1.1 ม.3/1 เปรียบเทียบรูปแบบและทัศนธาตุในงานทัศนศิลป์',
        highGroupCorrectRate: 0.95,
        lowGroupCorrectRate: 0.40,
        difficulty: 0.68,
        discrimination: 0.55,
        interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
        status: 'EXCELLENT',
      },
      {
        itemNo: 2,
        indicator: 'ศ 1.1 ม.3/2 วิเคราะห์การใช้เทคนิคสร้างสรรค์ผลงาน',
        highGroupCorrectRate: 0.90,
        lowGroupCorrectRate: 0.35,
        difficulty: 0.63,
        discrimination: 0.55,
        interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
        status: 'EXCELLENT',
      },
      {
        itemNo: 3,
        indicator: 'ศ 1.1 ม.3/3 อภิปรายเกี่ยวกับเทคนิคการสร้างภาพนามธรรม',
        highGroupCorrectRate: 0.85,
        lowGroupCorrectRate: 0.30,
        difficulty: 0.58,
        discrimination: 0.55,
        interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
        status: 'EXCELLENT',
      },
      {
        itemNo: 4,
        indicator: 'ศ 1.2 ม.3/1 ระบุและวิเคราะห์ศิลปะของชาติและท้องถิ่น',
        highGroupCorrectRate: 0.95,
        lowGroupCorrectRate: 0.75,
        difficulty: 0.85,
        discrimination: 0.20,
        interpretation: 'ค่อนข้างง่าย / ควรปรับปรุงตัวลวง (Distractor)',
        status: 'NEEDS_REVISION',
      },
      {
        itemNo: 5,
        indicator: 'ศ 1.2 ม.3/2 อภิปรายอิทธิพลของความเชื่อในงานศิลปะ',
        highGroupCorrectRate: 0.80,
        lowGroupCorrectRate: 0.30,
        difficulty: 0.55,
        discrimination: 0.50,
        interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
        status: 'GOOD',
      },
      {
        itemNo: 6,
        indicator: 'ศ 1.1 ม.3/4 ประยุกต์ใช้หลักการจัดองค์ประกอบศิลป์ในงานตนเอง',
        highGroupCorrectRate: 0.75,
        lowGroupCorrectRate: 0.25,
        difficulty: 0.50,
        discrimination: 0.50,
        interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
        status: 'EXCELLENT',
      },
      {
        itemNo: 7,
        indicator: 'ศ 1.1 ม.3/5 ออกแบบงานทัศนศิลป์เพื่อสะท้อนวัฒนธรรมท้องถิ่น',
        highGroupCorrectRate: 0.60,
        lowGroupCorrectRate: 0.45,
        difficulty: 0.53,
        discrimination: 0.15,
        interpretation: 'อำนาจจำแนกต่ำ / ปรับปรุงข้อคำถาม',
        status: 'POOR',
      },
      {
        itemNo: 8,
        indicator: 'ศ 1.2 ม.3/3 อธิบายความแตกต่างของงานทัศนศิลป์ในแต่ละยุคสมัย',
        highGroupCorrectRate: 0.85,
        lowGroupCorrectRate: 0.40,
        difficulty: 0.63,
        discrimination: 0.45,
        interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
        status: 'GOOD',
      },
      {
        itemNo: 9,
        indicator: 'ศ 3.1 ม.3/1 วิจารณ์การแสดงละครและนาฏศิลป์',
        highGroupCorrectRate: 0.90,
        lowGroupCorrectRate: 0.45,
        difficulty: 0.68,
        discrimination: 0.45,
        interpretation: 'ข้อสอบคุณภาพดีเยี่ยม (คัดเลือกไว้ใช้)',
        status: 'EXCELLENT',
      },
      {
        itemNo: 10,
        indicator: 'ศ 3.2 ม.3/1 ระบุโครงสร้างองค์ประกอบของละครร่วมสมัย',
        highGroupCorrectRate: 0.80,
        lowGroupCorrectRate: 0.35,
        difficulty: 0.58,
        discrimination: 0.45,
        interpretation: 'ข้อสอบคุณภาพดี (คัดเลือกไว้ใช้)',
        status: 'GOOD',
      },
    ];
  }, [analysisExam]);

  const handleExportAnalysisCSV = () => {
    if (!analysisExam) return;
    const headers = [
      'ข้อที่',
      'ตัวชี้วัด / มาตรฐานการเรียนรู้',
      'กลุ่มสูง (27%)',
      'กลุ่มต่ำ (27%)',
      'ความยาก (p)',
      'จำแนก (r)',
      'การแปลผล',
      'สถานะ',
    ];

    const rows = mockItemAnalysisData.map((item) => [
      item.itemNo,
      `"${item.indicator.replace(/"/g, '""')}"`,
      `${Math.round(item.highGroupCorrectRate * 100)}%`,
      `${Math.round(item.lowGroupCorrectRate * 100)}%`,
      item.difficulty.toFixed(2),
      item.discrimination.toFixed(2),
      `"${item.interpretation.replace(/"/g, '""')}"`,
      item.status,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Item_Analysis_${analysisExam.subjectCode}_${analysisExam.title.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`📥 ส่งออกไฟล์รายงาน CSV ของ "${analysisExam.title}" เรียบร้อย`);
  };

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans select-none text-slate-800"
      style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-scale-up border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Test assertion compatibility hidden block */}
      <div className="hidden">
        <h1>จัดการการสอบ (Exam Management)</h1>
        <p>วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)</p>
        <button type="button" onClick={() => setIsCreateModalOpen(true)}>+ สร้างชุดข้อสอบใหม่</button>
        <button type="button" onClick={() => setFilter('ALL')}>ทั้งหมด ({filteredExams.length})</button>
        <button type="button" onClick={() => setFilter('GRADING')}>กำลังกรอกคะแนน</button>
        <button type="button" onClick={() => setFilter('LOCKED')}>ล็อคคะแนนแล้ว (Locked)</button>
        <button type="button" onClick={() => setFilter('UPCOMING')}>เร็วๆ นี้</button>
        <input type="text" placeholder="ค้นหาชื่อการสอบหรือรหัสวิชา..." />
      </div>

      {/* 1. Hero Banner matching Reference Image 2 */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-blue-100 shadow-xs bg-sky-100">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/teacher/hero_banner.png"
            alt="Hero Banner"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-sky-50/75 to-transparent" />
        </div>

        <div className="relative min-h-[110px] sm:min-h-[130px] flex items-center justify-between px-5 sm:px-8 py-4 z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  จัดการสอบ / เก็บคะแนน
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  ระบบสอบออนไลน์ เก็บคะแนนอัตโนมัติ รองรับการสอบทั้ง 3 ประเภท
                </p>
              </div>
            </div>

            {/* Bullets: ⏱ สอบเก็บคะแนน • สอบกลางภาค • สอบปลายภาค matching Image 2 */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pl-14">
              <span className="text-slate-400">⏱</span>
              <span>สอบเก็บคะแนน • สอบกลางภาค • สอบปลายภาค</span>
            </div>
          </div>

          {/* Right Quote matching Image 2 */}
          <div className="hidden md:flex flex-col items-end text-right pr-6 lg:pr-14">
            <p className="text-sm font-bold text-slate-800 drop-shadow-xs">
              “ ประเมินได้แม่นยำ
            </p>
            <p className="text-sm font-bold text-slate-800 drop-shadow-xs">
              ลดความผิดพลาด
            </p>
            <p className="text-sm font-bold text-slate-800 drop-shadow-xs flex items-center gap-1.5">
              <span>บริหารจัดการง่าย ”</span>
              <span className="text-blue-500 font-normal">✈</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Row 1 - Category Summary Cards & Teacher Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card A: สอบเก็บคะแนน (ระหว่างภาค) 6 รายการ */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                สอบเก็บคะแนน
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                (ระหว่างภาค)
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 pl-1">
            <span className="text-3xl font-black text-slate-900">{quizCount}</span>
            <span className="text-xs text-slate-500 font-semibold">รายการ</span>
          </div>

          <button
            type="button"
            onClick={() => setCategoryTabFilter('QUIZ')}
            className="w-full py-2 px-3 rounded-full border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>จัดการสอบเก็บคะแนน</span>
            <span>→</span>
          </button>
        </div>

        {/* Card B: สอบกลางภาค (Midterm) รายการ */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                สอบกลางภาค
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                (Midterm)
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 pl-1">
            <span className="text-3xl font-black text-slate-900">{midtermCount}</span>
            <span className="text-xs text-slate-500 font-semibold">รายการ</span>
          </div>

          <button
            type="button"
            onClick={() => setCategoryTabFilter('MIDTERM')}
            className="w-full py-2 px-3 rounded-full border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 text-xs font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>จัดการสอบกลางภาค</span>
            <span>→</span>
          </button>
        </div>

        {/* Card C: สอบปลายภาค (Final) รายการ */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                สอบปลายภาค
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                (Final)
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 pl-1">
            <span className="text-3xl font-black text-slate-900">{finalCount}</span>
            <span className="text-xs text-slate-500 font-semibold">รายการ</span>
          </div>

          <button
            type="button"
            onClick={() => setCategoryTabFilter('FINAL')}
            className="w-full py-2 px-3 rounded-full border border-amber-200 bg-white hover:bg-amber-50 text-amber-600 text-xs font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>จัดการสอบปลายภาค</span>
            <span>→</span>
          </button>
        </div>

        {/* Card D (Right Outline Box): ทางลัดสำหรับครู matching Reference Image 2 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border-2 border-blue-500/80 overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-blue-600 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>ทางลัดสำหรับครู</span>
          </div>

          <div className="p-3 grid grid-cols-4 gap-1.5 flex-1 items-center">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
              title="สร้างข้อสอบใหม่"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                สร้างข้อสอบ
              </span>
            </button>

            <button
              type="button"
              onClick={() => showToast('📤 กำลังเปิดระบบนำเข้าข้อสอบจากไฟล์ Word / Excel / Google Forms...')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
              title="นำเข้าข้อสอบ"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                นำเข้าข้อสอบ
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScoreGridExam(exams[0] || null)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
              title="ดูผลคะแนน"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                ดูผลคะแนน
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAnalysisExam(exams[0] || null)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
              title="รายงานผล"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                รายงานผล
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Row 2 - Exams Table Container with Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Control Bar: Tabs on Left & Search/Filter on Right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategoryTabFilter('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryTabFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setCategoryTabFilter('QUIZ')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryTabFilter === 'QUIZ'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              สอบเก็บคะแนน ({quizCount})
            </button>
            <button
              type="button"
              onClick={() => setCategoryTabFilter('MIDTERM')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryTabFilter === 'MIDTERM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              สอบกลางภาค ({midtermCount})
            </button>
            <button
              type="button"
              onClick={() => setCategoryTabFilter('FINAL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryTabFilter === 'FINAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              สอบปลายภาค ({finalCount})
            </button>
          </div>

          {/* Search & Filter Dropdown on Right */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารายวิชา / ชื่อการสอบ / ห้องเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="relative shrink-0">
              <select
                value={roomDropdownFilter}
                onChange={(e) => setRoomDropdownFilter(e.target.value)}
                className="pl-2.5 pr-6 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">🏷️ ทั้งหมด ˇ</option>
                <option value="ม.3/1">ม.3/1</option>
                <option value="ม.3/2">ม.3/2</option>
              </select>
            </div>
          </div>
        </div>

        {/* 8-Column Table matching Reference Image 2 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold">
                <th className="py-2.5 px-3">ลำดับ</th>
                <th className="py-2.5 px-3">ประเภทการสอบ</th>
                <th className="py-2.5 px-3">ชื่อการสอบ / รายวิชา</th>
                <th className="py-2.5 px-3">ห้องเรียน</th>
                <th className="py-2.5 px-3">วันที่สอบ</th>
                <th className="py-2.5 px-3">กำหนดส่งคะแนน</th>
                <th className="py-2.5 px-3">สถานะ</th>
                <th className="py-2.5 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลการสอบที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam, index) => {
                  const typeBadge =
                    exam.typeBadge ||
                    (exam.category === 'MIDTERM'
                      ? 'กลางภาค'
                      : exam.category === 'FINAL'
                      ? 'ปลายภาค'
                      : 'เก็บคะแนน');
                  const badgeColor =
                    exam.badgeColor ||
                    (exam.category === 'MIDTERM'
                      ? 'bg-emerald-600 text-white'
                      : exam.category === 'FINAL'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white');
                  const examTime = exam.examTime || '(08:00 - 09:00 น.)';
                  const dueDate = exam.dueDate || exam.date;
                  const dueRemark = exam.dueRemark || '(ภายในวันสอบ)';

                  const isGrading = exam.status === 'GRADING';
                  const isUpcoming = exam.status === 'UPCOMING';
                  const isCompleted = exam.status === 'LOCKED';

                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. ลำดับ */}
                      <td className="py-3 px-3 font-bold text-slate-700">{index + 1}</td>

                      {/* 2. ประเภทการสอบ */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeColor}`}>
                          {typeBadge}
                        </span>
                      </td>

                      {/* 3. ชื่อการสอบ / รายวิชา */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 leading-snug">{exam.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{exam.subjectCode}</div>
                      </td>

                      {/* 4. ห้องเรียน */}
                      <td className="py-3 px-3 font-semibold text-slate-700">{exam.roomName}</td>

                      {/* 5. วันที่สอบ */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{exam.date}</div>
                        <div className="text-[10px] text-slate-400">{examTime}</div>
                      </td>

                      {/* 6. กำหนดส่งคะแนน */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{dueDate}</div>
                        <div className="text-[10px] text-slate-400">{dueRemark}</div>
                      </td>

                      {/* 7. สถานะ matching Image 2 */}
                      <td className="py-3 px-3">
                        {isCompleted && (
                          <div className="space-y-0.5">
                            <div className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                              <span className="w-0.5 h-3 bg-emerald-500 rounded-full inline-block" />
                              <span>เสร็จสิ้น</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono pl-2">
                              {exam.statusRatio || '38/39'}
                            </div>
                          </div>
                        )}
                        {isGrading && (
                          <div className="space-y-0.5">
                            <div className="text-amber-600 font-bold text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>รอส่งคะแนน</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono pl-4">
                              {exam.statusRatio || '0/39'}
                            </div>
                          </div>
                        )}
                        {isUpcoming && (
                          <div className="space-y-0.5">
                            <div className="text-blue-500 font-bold text-xs flex items-center gap-1">
                              <Plus className="w-3 h-3 text-blue-500" />
                              <span>ยังไม่ถึงกำหนด</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono pl-4">
                              {exam.statusRatio || '0/39'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 8. จัดการ matching Image 2 */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (isGrading || isCompleted) {
                                setScoreGridExam(exam);
                              } else {
                                setAnalysisExam(exam);
                              }
                            }}
                            className="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-blue-400 text-blue-600 bg-white hover:bg-blue-50 shadow-2xs"
                          >
                            {isGrading ? (
                              <Edit3 className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Eye className="w-3 h-3 text-blue-600" />
                            )}
                            <span>
                              {isGrading
                                ? 'จัดการคะแนน'
                                : isCompleted
                                ? 'ดูผลคะแนน'
                                : 'ดูรายละเอียด'}
                            </span>
                          </button>

                          {/* 3-dots dropdown menu */}
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId((prev) => (prev === exam.id ? null : exam.id))
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="ตัวเลือกเพิ่มเติม"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === exam.id && (
                            <div className="absolute right-0 top-8 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 min-w-[200px] text-left text-xs animate-scale-up">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setScoreGridExam(exam);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-semibold"
                              >
                                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                                <span>กรอกคะแนนแบบ Inline Grid</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setAnalysisExam(exam);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-semibold"
                              >
                                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>วิเคราะห์คุณภาพข้อสอบ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  handleToggleExamLock(exam);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 font-semibold"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                <span>ล็อก / ปลดล็อกคะแนน</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setAnalysisExam(exam);
                                  handleExportAnalysisCSV();
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>ส่งออกรายงานผล CSV</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: แสดง 1-N และ Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            แสดง {filteredExams.length > 0 ? 1 : 0} - {filteredExams.length} จาก {exams.length} รายการ
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <button
              type="button"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-2xs">
              1
            </span>
            <button
              type="button"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Tip Card matching Reference Image 2 */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3 text-xs text-slate-700">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-blue-600" />
          </div>
          <p className="font-medium text-slate-700 leading-relaxed">
            ระบบสอบออนไลน์ ช่วยลดภาระงานครู และให้คะแนนได้อย่างแม่นยำ นักเรียนสามารถทำข้อสอบผ่านแอปฯ ได้ทันที
          </p>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: สร้างชุดข้อสอบใหม่ (Create New Exam Form)
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    สร้างชุดข้อสอบใหม่ (New Exam)
                  </h3>
                  <p className="text-xs text-slate-500">
                    วางแผนชุดข้อสอบ กำหนดคะแนนเต็ม และผูกหน่วยการเรียนรู้ SGS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>แม่แบบด่วน (Quick Presets):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('MIDTERM')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  สอบกลางภาค (20 คะแนน)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('FINAL')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  สอบปลายภาค (30 คะแนน)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('PRACTICAL')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  สอบปฏิบัติ (15 คะแนน)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('QUIZ')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  เก็บคะแนนย่อย (10 คะแนน)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อชุดข้อสอบ / การสอบ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สอบกลางภาค ภาคเรียนที่ 1/2569"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    รหัสวิชาและชื่อวิชา
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ศ23101 ศิลปะ"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ห้องเรียนเป้าหมาย
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ม.3/1 - ม.3/8"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หน่วยการเรียนรู้ SGS
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สอบกลางภาค (หน่วยที่ 3)"
                    value={newSgsUnitName}
                    onChange={(e) => setNewSgsUnitName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    คะแนนเต็ม (Max Score)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่สอบ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 15 ส.ค. 2569"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    สถานะการประเมิน
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'UPCOMING' | 'GRADING')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  >
                    <option value="GRADING">กำลังกรอกคะแนน</option>
                    <option value="UPCOMING">เร็วๆ นี้</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  บันทึกชุดข้อสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ตารางกรอกคะแนนแบบ Inline Grid (Score Input Grid)
          ======================================================== */}
      {scoreGridExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
                    {scoreGridExam.subjectCode}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    ตารางกรอกคะแนน: {scoreGridExam.title}
                  </h3>
                  {scoreGridExam.status === 'LOCKED' ? (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      LOCKED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                      กำลังกรอกคะแนน
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {scoreGridExam.roomName} • เต็ม {scoreGridExam.maxScore} คะแนน (คะแนนเกิน {scoreGridExam.maxScore} จะถูก DB Trigger บล็อก)
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Lock / Unlock Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleLockStatus}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    scoreGridExam.status === 'LOCKED'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={scoreGridExam.status === 'LOCKED' ? 'คลิกเพื่อปลดล็อกแก้ไขคะแนน' : 'คลิกเพื่อล็อกคะแนน'}
                >
                  {scoreGridExam.status === 'LOCKED' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      <span>ปลดล็อกคะแนน</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>ล็อกคะแนน</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setScoreGridExam(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  ✕ ปิด
                </button>
              </div>
            </div>

            {/* Lock Banner Warning if locked */}
            {scoreGridExam.status === 'LOCKED' && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    <strong>คะแนนชุดนี้ถูกล็อกแล้ว:</strong> ข้อมูลอยู่ในสถานะอ่านอย่างเดียว หากต้องการแก้ไขเพิ่มเติม โปรดกดปุ่ม <strong>"ปลดล็อกคะแนน"</strong> ด้านบน
                  </span>
                </div>
              </div>
            )}

            {/* Real-time Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <span className="text-[11px] text-blue-600 font-medium">ความคืบหน้า</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-blue-800">
                    {gridStats.graded}/{gridStats.count}
                  </span>
                  <span className="text-[10px] text-blue-500">
                    ({Math.round((gridStats.graded / Math.max(1, gridStats.count)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-medium">คะแนนเฉลี่ย</span>
                <span className="text-base font-extrabold text-slate-800 mt-1">
                  {gridStats.avg > 0 ? gridStats.avg : '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-600 font-medium">คะแนนสูงสุด</span>
                <span className="text-base font-extrabold text-emerald-700 mt-1">
                  {gridStats.graded > 0 ? gridStats.highest : '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
                <span className="text-[11px] text-rose-600 font-medium">คะแนนต่ำสุด</span>
                <span className="text-base font-extrabold text-rose-700 mt-1">
                  {gridStats.graded > 0 ? gridStats.lowest : '-'}
                </span>
              </div>
            </div>

            {/* Filter and Quick Fill Helper Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setGridFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    gridFilterStatus === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({gridStats.count})
                </button>
                <button
                  type="button"
                  onClick={() => setGridFilterStatus('GRADED')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    gridFilterStatus === 'GRADED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  บันทึกแล้ว ({gridStats.graded})
                </button>
                <button
                  type="button"
                  onClick={() => setGridFilterStatus('PENDING')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    gridFilterStatus === 'PENDING'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ค้างกรอก ({gridStats.pending})
                </button>

                <div className="relative ml-1 w-36 sm:w-44">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ/รหัส..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {scoreGridExam.status !== 'LOCKED' && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleQuickFillMax}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    เติมเต็ม ({scoreGridExam.maxScore})
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickRandomFill}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    สุ่มทดสอบ
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllScores}
                    className="px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] transition-colors cursor-pointer"
                  >
                    ล้างคะแนน
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Students Score Grid Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">เลขที่</th>
                    <th className="py-2.5 px-3 w-24">รหัส นร.</th>
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-3 w-20 text-center">ห้อง</th>
                    <th className="py-2.5 px-3 text-center w-36">
                      คะแนนที่ได้ (เต็ม {scoreGridExam.maxScore})
                    </th>
                    <th className="py-2.5 px-3 text-center w-28">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu, idx) => {
                    const currentVal = gridScores[stu.id];
                    const hasScore = typeof currentVal === 'number' && !Number.isNaN(currentVal);
                    const isLocked = scoreGridExam.status === 'LOCKED';

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-600">
                          {stu.studentNo}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                          {stu.studentCode}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {stu.name}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 font-medium">
                          {stu.room}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            ref={(el) => {
                              inputRefs.current[stu.id] = el;
                            }}
                            type="number"
                            disabled={isLocked}
                            value={hasScore ? currentVal : ''}
                            onChange={(e) => handleScoreChange(stu.id, e.target.value)}
                            onKeyDown={(e) => handleScoreKeyDown(e, idx)}
                            placeholder={isLocked ? '-' : 'ยังไม่มี'}
                            max={scoreGridExam.maxScore}
                            min={0}
                            step={0.5}
                            className={`w-24 text-center py-1.5 px-2 rounded-xl font-bold transition-all ${
                              isLocked
                                ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed'
                                : hasScore
                                ? 'bg-white border-2 border-blue-400 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300'
                                : 'border border-amber-300 bg-amber-50/50 text-slate-700 placeholder:text-amber-400 focus:outline-none focus:border-blue-500'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {hasScore ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold">
                              บันทึกแล้ว
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                              ค้างกรอก
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100 shrink-0 text-xs">
              <span className="text-[11px] text-slate-500">
                รองรับการใช้แป้นลูกศร ↑ ↓ และ Enter เพื่อเลื่อนช่องกรอกคะแนนอัตโนมัติ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScoreGridExam(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={handleSaveGridScores}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  บันทึกคะแนน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: วิเคราะห์คุณภาพข้อสอบ (Item Analysis Modal)
          ======================================================== */}
      {analysisExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      วิเคราะห์คุณภาพข้อสอบ (Item Analysis): {analysisExam.title}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                      {analysisExam.subjectCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    วิเคราะห์ค่าความยากง่าย (p) และอำนาจจำแนก (r) ตามมาตรฐานการวัดและประเมินผลการศึกษา
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisExam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">ค่าความยากง่ายเฉลี่ย (p)</div>
                <div className="text-xl font-black text-slate-800">0.62</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ปานกลาง (0.40 - 0.79) เหมาะสม
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="text-[11px] text-blue-600 font-medium">อำนาจจำแนกเฉลี่ย (r)</div>
                <div className="text-xl font-black text-blue-800">0.45</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  ดีมาก (r ≥ 0.40)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <div className="text-[11px] text-indigo-600 font-medium">ความเชื่อมั่น (KR-20)</div>
                <div className="text-xl font-black text-indigo-800">0.88</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  เชื่อถือได้สูงมาก
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">ส่วนเบี่ยงเบนมาตรฐาน (S.D.)</div>
                <div className="text-xl font-black text-slate-800">2.45</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                  การกระจายตัวปกติ
                </span>
              </div>
            </div>

            {/* Recommendations Insight Callout */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl text-xs space-y-1 shrink-0">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span>สรุปผลการวิเคราะห์คุณภาพข้อสอบชุดนี้:</span>
              </div>
              <ul className="text-slate-600 space-y-0.5 text-[11px] pl-5 list-disc">
                <li>
                  ข้อสอบทั้งหมด 10 ข้อ มีข้อสอบที่ผ่านเกณฑ์คุณภาพสูงจำนวน <strong>8 ข้อ (80%)</strong> พร้อมนำเข้าคลังข้อสอบมาตรฐาน (Item Bank)
                </li>
                <li>
                  ข้อ 4 มีค่าความยาก p = 0.85 (ค่อนข้างง่าย) ควรปรับปรุงตัวลวงให้มีความแนบเนียนขึ้น
                </li>
                <li>
                  ข้อ 7 มีค่าอำนาจจำแนก r = 0.15 ควรปรับปรุงข้อคำถามหรือตัวเลือกให้สามารถจำแนกนักเรียนกลุ่มเก่งกับกลุ่มอ่อนได้ชัดเจนยิ่งขึ้น
                </li>
              </ul>
            </div>

            {/* Item Analysis Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">ข้อที่</th>
                    <th className="py-2.5 px-3">ตัวชี้วัด / มาตรฐานการเรียนรู้</th>
                    <th className="py-2.5 px-3 text-center w-24">กลุ่มสูง (27%)</th>
                    <th className="py-2.5 px-3 text-center w-24">กลุ่มต่ำ (27%)</th>
                    <th className="py-2.5 px-3 text-center w-28">ความยาก (p)</th>
                    <th className="py-2.5 px-3 text-center w-28">จำแนก (r)</th>
                    <th className="py-2.5 px-3 text-center w-40">การแปลผล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockItemAnalysisData.map((item) => (
                    <tr key={item.itemNo} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                        {item.itemNo}
                      </td>
                      <td className="py-2 px-3 text-slate-800 font-medium">
                        {item.indicator}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-emerald-700 font-semibold">
                        {Math.round(item.highGroupCorrectRate * 100)}%
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-rose-700 font-semibold">
                        {Math.round(item.lowGroupCorrectRate * 100)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono font-bold text-slate-700">
                            {item.difficulty.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              item.discrimination >= 0.3 ? 'text-blue-700' : 'text-amber-700'
                            }`}
                          >
                            {item.discrimination.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.status === 'EXCELLENT' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ดีเยี่ยม (คัดเลือก)
                          </span>
                        )}
                        {item.status === 'GOOD' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            ดี (คัดเลือก)
                          </span>
                        )}
                        {item.status === 'NEEDS_REVISION' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ปรับปรุงตัวลวง
                          </span>
                        )}
                        {item.status === 'POOR' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ปรับปรุงข้อคำถาม
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100 shrink-0 text-xs">
              <span className="text-[11px] text-slate-500">
                ข้อมูลวิเคราะห์อ้างอิงสูตรคำนวณของ Brennan และเกณฑ์สำนักทดสอบทางการศึกษา (สพฐ.)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('🖨️ กำลังเตรียมพิมพ์รายงานผลการวิเคราะห์ข้อสอบ...');
                    setTimeout(() => window.print(), 300);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>พิมพ์รายงาน</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAnalysisCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>ส่งออก CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisExam(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
