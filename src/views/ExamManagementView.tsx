// src/views/ExamManagementView.tsx
// หน้าจัดการการสอบ (Exam Management)
// ออกแบบตามภาพต้นแบบ Mockup: วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PenTool,
  Lock,
  Unlock,
  BarChart2,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Printer,
  Download,
  Sparkles,
  Award,
} from 'lucide-react';
import { examsData } from '../data/mockData';
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

export const ExamManagementView: React.FC = () => {
  // 1. Exams State
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const saved = localStorage.getItem(EXAMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore parse error
    }
    return examsData;
  });

  const [filter, setFilter] = useState<'ALL' | 'GRADING' | 'LOCKED' | 'UPCOMING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Interactive Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scoreGridExam, setScoreGridExam] = useState<ExamItem | null>(null);
  const [analysisExam, setAnalysisExam] = useState<ExamItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const saveExamsToStorage = (updatedExams: ExamItem[]) => {
    setExams(updatedExams);
    try {
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(updatedExams));
    } catch {
      // ignore storage error
    }
  };

  // Filtered exams according to active tab and search query
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesFilter = filter === 'ALL' || exam.status === filter;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.subjectCode.toLowerCase().includes(q) ||
        exam.sgsUnitName.toLowerCase().includes(q) ||
        exam.roomName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [exams, filter, searchTerm]);

  // ----------------------------------------------------
  // Form State for "สร้างชุดข้อสอบใหม่" (Modal 1)
  // ----------------------------------------------------
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('ศ23101 ศิลปะ');
  const [newRoomName, setNewRoomName] = useState('ม.3/1 - ม.3/8');
  const [newSgsUnitName, setNewSgsUnitName] = useState('สอบเก็บคะแนนหน่วยที่ 1');
  const [newMaxScore, setNewMaxScore] = useState<number>(20);
  const [newDate, setNewDate] = useState('18 ต.ค. 2569');
  const [newStatus, setNewStatus] = useState<'UPCOMING' | 'GRADING'>('GRADING');

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newExam: ExamItem = {
      id: `ex-${Date.now()}`,
      title: newTitle.trim(),
      subjectCode: newSubjectCode.trim() || 'ศ23101 ศิลปะ',
      roomName: newRoomName.trim() || 'ม.3/1 - ม.3/8',
      sgsUnitName: newSgsUnitName.trim() || 'สอบเก็บคะแนนหน่วยการเรียนรู้',
      maxScore: Number(newMaxScore) || 20,
      date: newDate.trim() || '18 ต.ค. 2569',
      status: newStatus,
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
        setNewSgsUnitName('สอบกลางภาค (หน่วยที่ 3)');
        setNewMaxScore(20);
        setNewSubjectCode('ศ23101 ศิลปะ');
        setNewRoomName('ม.3/1 - ม.3/8');
        break;
      case 'FINAL':
        setNewTitle('สอบปลายภาค ภาคเรียนที่ 1/2569');
        setNewSgsUnitName('สอบปลายภาค');
        setNewMaxScore(30);
        setNewSubjectCode('ศ23101 ศิลปะ');
        setNewRoomName('ม.3/1 - ม.3/8');
        break;
      case 'QUIZ':
        setNewTitle('สอบเก็บคะแนนย่อย ทฤษฎีศิลปวัฒนธรรม');
        setNewSgsUnitName('ความรู้พื้นฐานศิลปะ (หน่วยที่ 1)');
        setNewMaxScore(10);
        setNewSubjectCode('ศ23101 ศิลปะ');
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
      // Pre-fill realistic scores reflecting the exam's status
      DEFAULT_STUDENTS_LIST.forEach((stu) => {
        if (scoreGridExam.id === 'ex-1') {
          // Locked exam: all students scored with realistic values matching avg 16.4
          const preScore = [18, 19.5, 15, 17, 20, 16.5, 14, 8.5, 17.5, 18][stu.studentNo - 1] ?? 16;
          loadedScores[stu.id] = preScore;
        } else if (scoreGridExam.id === 'ex-2') {
          // Grading exam: some scored, some pending
          const preScore = [15, 13.5, null, 12, null, 14, 6, null, 14.5, 13][stu.studentNo - 1] ?? null;
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

  const handleToggleLockStatus = () => {
    if (!scoreGridExam) return;
    const nextStatus = scoreGridExam.status === 'LOCKED' ? 'GRADING' : 'LOCKED';
    const updatedExam: ExamItem = {
      ...scoreGridExam,
      status: nextStatus,
    };
    setScoreGridExam(updatedExam);
    const nextList = exams.map((ex) => (ex.id === updatedExam.id ? updatedExam : ex));
    saveExamsToStorage(nextList);
    showToast(
      nextStatus === 'LOCKED'
        ? '🔒 ล็อกคะแนนสอบเรียบร้อยแล้ว (คะแนนถูกป้องกันการแก้ไข)'
        : '🔓 ปลดล็อกคะแนนสอบเรียบร้อยแล้ว (สามารถแก้ไขคะแนนได้ตามปกติ)'
    );
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

      {/* 1. Header & Create Exam Action matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <PenTool className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                จัดการการสอบ (Exam Management)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>+ สร้างชุดข้อสอบใหม่</span>
        </button>
      </div>

      {/* 2. Filter Tabs and Search Bar matching Screenshot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({exams.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('GRADING')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'GRADING'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กำลังกรอกคะแนน
          </button>
          <button
            type="button"
            onClick={() => setFilter('LOCKED')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'LOCKED'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ล็อคคะแนนแล้ว (Locked)
          </button>
          <button
            type="button"
            onClick={() => setFilter('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'UPCOMING'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เร็วๆ นี้
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อการสอบหรือรหัสวิชา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200/90 rounded-full focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* 3. Exam List Grid matching Screenshot (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded">
                  {exam.subjectCode}
                </span>

                {exam.status === 'LOCKED' && (
                  <span className="px-2.5 py-0.5 bg-white text-slate-500 border border-slate-200 rounded-full text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>LOCKED</span>
                  </span>
                )}
                {exam.status === 'GRADING' && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[11px] font-medium">
                    กำลังกรอกคะแนน
                  </span>
                )}
                {exam.status === 'UPCOMING' && (
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-500 border border-sky-100 rounded text-[11px] font-medium">
                    เร็วๆ นี้
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {exam.title}
              </h3>

              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>หน่วย SGS: {exam.sgsUnitName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    วันที่สอบ: {exam.date} • {exam.roomName}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Stats if Graded */}
            <div className="my-3.5">
              {exam.averageScore !== undefined ? (
                <div className="p-3 bg-slate-50/80 rounded-xl text-xs grid grid-cols-3 text-center border border-slate-100/60">
                  <div>
                    <div className="text-[10px] text-slate-400">เฉลี่ย</div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{exam.averageScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">สูงสุด</div>
                    <div className="font-bold text-emerald-600 text-sm mt-0.5">{exam.highestScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">ต่ำสุด</div>
                    <div className="font-bold text-rose-500 text-sm mt-0.5">{exam.lowestScore}</div>
                  </div>
                </div>
              ) : (
                <div className="h-[58px]" />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setScoreGridExam(exam)}
                className="flex-1 py-2 px-3 bg-blue-50/80 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition-colors text-center cursor-pointer"
              >
                {exam.status === 'LOCKED' ? 'ดูผลการสอบ' : 'เปิดตารางกรอกคะแนน'}
              </button>
              <button
                type="button"
                onClick={() => setAnalysisExam(exam)}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="วิเคราะห์คุณภาพข้อสอบ (Item Analysis)"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
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
