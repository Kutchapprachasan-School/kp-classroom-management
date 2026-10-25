// components/GoldQuestArena.tsx
// หน้าจอควบคุมและโปรเจกเตอร์ฝั่งคุณครู (Teacher Live Arena & Projector Dashboard)
// พร้อมแผงตั้งค่าก่อนเริ่มห้องสอบ (Pre-Exam Setup Panel): เลือกชุดข้อสอบ 3 ชุด, เวลาสอบ 3-15 นาที, สลับลำดับข้อสอบ
// และ Modal สร้างข้อสอบเองหน้าเว็บ (Custom Question Creator Modal) พร้อมเพิ่มเข้าชุด Custom อัตโนมัติ
// เชื่อมต่อกับ RoomQRCodeModal.tsx และดึงข้อมูลจาก API /api/live-classroom/gold-quest แบบเรียลไทม์ทุกๆ 2 วินาที

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  QrCode,
  Trophy,
  Flame,
  Users,
  Sparkles,
  Play,
  Square,
  Clock,
  Activity,
  Crown,
  Swords,
  Gift,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  Settings2,
  BookOpen,
  Timer,
  Shuffle,
  Eye,
  PlusCircle,
  X,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import RoomQRCodeModal from './RoomQRCodeModal';
import { soundFX } from '../src/services/soundFXEngine';
import { goldQuestService } from '../src/services/goldQuestService';

export interface ArenaStudent {
  id: string;
  name: string;
  studentId?: string;
  avatar: string;
  gold: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  isJoined: boolean;
  joinedAt?: string;
}

export interface ArenaLog {
  id: string;
  message: string;
  type: 'join' | 'answer' | 'chest' | 'steal' | 'system';
  timestamp: string;
}

export interface ArenaQuestion {
  id: string;
  category?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface QuestionBankSet {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ท้าทาย' | 'กำหนดเอง';
  questions: ArenaQuestion[];
}

export interface GoldQuestArenaProps {
  roomId?: string;
  initialPin?: string;
  classroomId?: string;
  classroomName?: string;
  examTitle?: string;
  presentStudents?: Array<{ id: string; name: string; studentId?: string }>;
  students?: Array<{ id: string; name: string; studentId?: string; studentCode?: string; number?: number }>;
  isProjectorMode?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleProjector?: () => void;
  onClose?: () => void;
  onAwardSessionRewards?: (awards: { studentId: string; coins: number; tickets: number }[]) => void;
}

// ============================================================================
// คลังชุดข้อสอบเริ่มต้น (Question Bank Sets)
// ============================================================================
export const QUESTION_BANK_SETS: QuestionBankSet[] = [
  {
    id: 'jp-midterm-n5',
    title: 'ชุดที่ 1: สอบกลางภาคภาษาญี่ปุ่นพื้นฐาน (JLPT N5)',
    subtitle: 'คำทักทาย คำศัพท์ในห้องเรียน ตัวเลข และไวยากรณ์พื้นฐาน',
    badge: 'ยอดนิยม',
    difficulty: 'ง่าย',
    questions: [
      {
        id: 'q1',
        category: 'คำทักทายภาษาญี่ปุ่น',
        prompt: 'คำว่า 「おはようございます」 (Ohayou gozaimasu) ใช้ทักทายในเวลาใด?',
        options: ['ตอนเช้า', 'ตอนกลางวัน', 'ตอนเย็น', 'ก่อนนอน'],
        correctIndex: 0,
      },
      {
        id: 'q2',
        category: 'คำศัพท์พื้นฐาน',
        prompt: 'คำว่า 「せんせい」 (Sensei) มีความหมายตรงกับข้อใด?',
        options: ['นักเรียน', 'คุณครู', 'เพื่อนร่วมชั้น', 'ผู้อำนวยการ'],
        correctIndex: 1,
      },
      {
        id: 'q3',
        category: 'ตัวเลขภาษาญี่ปุ่น',
        prompt: 'ข้อใดคือคำอ่านของตัวเลข 「7」 ในภาษาญี่ปุ่น?',
        options: ['Roku (ろく)', 'Hachi (はち)', 'Nana (なな)', 'Kyuu (きゅう)'],
        correctIndex: 2,
      },
      {
        id: 'q4',
        category: 'ไวยากรณ์ N5',
        prompt: 'わたし ___ がくせい です。 คำช่วยในช่องว่างคือข้อใด?',
        options: ['は (wa)', 'を (wo)', 'に (ni)', 'で (de)'],
        correctIndex: 0,
      },
      {
        id: 'q5',
        category: 'คำศัพท์อาหาร',
        prompt: 'คำว่า 「みず」 (Mizu) หมายถึงข้อใด?',
        options: ['ชาเขียว', 'นมสด', 'น้ำเปล่า', 'น้ำผลไม้'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'jp-hiragana-katakana',
    title: 'ชุดที่ 2: ทดสอบตัวอักษร ฮิรางะนะ & คะตะคะนะ',
    subtitle: 'การอ่านออกเสียงตัวอักษรและคำทับศัพท์ภาษาต่างประเทศ',
    badge: 'ฝึกความไว',
    difficulty: 'ปานกลาง',
    questions: [
      {
        id: 'hk1',
        category: 'ตัวอักษรฮิรางะนะ',
        prompt: 'คำว่า 「さくら」 (Sakura) หมายถึงดอกไม้ชนิดใด?',
        options: ['ดอกทานตะวัน', 'ดอกซากุระ', 'ดอกกุหลาบ', 'ดอกทิวลิป'],
        correctIndex: 1,
      },
      {
        id: 'hk2',
        category: 'ตัวอักษรคะตะคะนะ',
        prompt: 'คำว่า 「テレビ」 (Terebi) แปลว่าอะไร?',
        options: ['วิทยุ', 'คอมพิวเตอร์', 'โทรทัศน์', 'โทรศัพท์มือถือ'],
        correctIndex: 2,
      },
      {
        id: 'hk3',
        category: 'คำทับศัพท์อาหาร',
        prompt: 'คำว่า 「パン」 (Pan) ในภาษาญี่ปุ่นหมายถึงข้อใด?',
        options: ['ขนมปัง', 'ข้าวสวย', 'ราเม็ง', 'แกงกะหรี่'],
        correctIndex: 0,
      },
      {
        id: 'hk4',
        category: 'ตัวอักษรฮิรางะนะ',
        prompt: 'ตัวอักษร 「ねこ」 อ่านออกเสียงและมีความหมายว่าอย่างไร?',
        options: ['Inu - สุนัข', 'Neko - แมว', 'Tori - นก', 'Sakana - ปลา'],
        correctIndex: 1,
      },
      {
        id: 'hk5',
        category: 'ตัวอักษรคะตะคะนะ',
        prompt: 'ข้อใดเขียนคำว่า 「Coffee (กาแฟ)」 ด้วยคะตะคะนะได้ถูกต้อง?',
        options: ['コーラ', 'コーヒー', 'ジュース', 'ミルク'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'jp-kanji-daily',
    title: 'ชุดที่ 3: คันจิในชีวิตประจำวัน & วันเวลา',
    subtitle: 'คันจิหมวดวันทั้ง 7 ตัวเลขราคา และสถานที่สำคัญ',
    badge: 'เก็บคะแนน',
    difficulty: 'ท้าทาย',
    questions: [
      {
        id: 'kj1',
        category: 'คันจิหมวดธรรมชาติ',
        prompt: 'คันจิตัวใดมีความหมายว่า 「ไฟ (Hi / Ka)」?',
        options: ['水', '火', '木', '金'],
        correctIndex: 1,
      },
      {
        id: 'kj2',
        category: 'คันจิวันในสัปดาห์',
        prompt: 'คำว่า 「日曜日」 (Nichiyoubi) คือวันใดในสัปดาห์?',
        options: ['วันจันทร์', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'],
        correctIndex: 3,
      },
      {
        id: 'kj3',
        category: 'คันจิสถานที่',
        prompt: 'คำว่า 「学校」 (Gakkou) มีความหมายว่าอย่างไร?',
        options: ['โรงเรียน', 'โรงพยาบาล', 'สถานีรถไฟ', 'ห้องสมุด'],
        correctIndex: 0,
      },
      {
        id: 'kj4',
        category: 'คันจิตัวเลข',
        prompt: 'ป้ายราคา 「百円」 (Hyaku-en) หมายถึงราคากี่เยน?',
        options: ['10 เยน', '100 เยน', '1,000 เยน', '10,000 เยน'],
        correctIndex: 1,
      },
      {
        id: 'kj5',
        category: 'คันจิทิศทาง',
        prompt: 'คำว่า 「出口」 (Deguchi) ตามสถานีรถไฟหมายถึงอะไร?',
        options: ['ทางเข้า', 'ทางออก', 'ห้องน้ำ', 'จุดจำหน่ายตั๋ว'],
        correctIndex: 1,
      },
    ],
  },
];

export const INITIAL_QUESTION_BANK_SETS = QUESTION_BANK_SETS;

// ตัวเลือกเวลาสอบ (นาที)
export const DURATION_OPTIONS = [
  { minutes: 3, label: '3 นาที', desc: 'โหมดสายฟ้าแลบ (Speed Run)' },
  { minutes: 5, label: '5 นาที', desc: 'มาตรฐาน (แนะนำสำหรับ 5-10 ข้อ)' },
  { minutes: 10, label: '10 นาที', desc: 'โหมดชิงไหวพริบเต็มรูปแบบ' },
  { minutes: 15, label: '15 นาที', desc: 'สอบเก็บคะแนนท้ายบท' },
];

// รายชื่อนักเรียนตัวอย่าง
const DEFAULT_PRESENT_STUDENTS = [
  { id: 'std_1', name: 'น้องมินท์ เลขที่ 1' },
  { id: 'std_2', name: 'น้องภูมิ เลขที่ 2' },
  { id: 'std_3', name: 'น้องฟ้า เลขที่ 3' },
  { id: 'std_4', name: 'น้องก้อง เลขที่ 4' },
  { id: 'std_5', name: 'น้องแพรว เลขที่ 5' },
];

// สุ่มรหัส PIN 6 หลักแบบปลอดภัย
function generateSecurePin(): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return String(100000 + (array[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function GoldQuestArena({
  roomId = 'room-jp-101',
  initialPin = '849201',
  classroomId = 'class-m4-1',
  classroomName: _classroomName = 'ห้องเรียน',
  examTitle,
  presentStudents,
  students: propStudents,
  isProjectorMode: _initialProjectorMode = false,
  soundEnabled: initialSoundEnabled = true,
  onToggleSound,
  onToggleProjector: _onToggleProjector,
  onClose,
  onAwardSessionRewards,
}: GoldQuestArenaProps) {
  // ==========================================================================
  // State สำหรับการตั้งค่าก่อนเปิดห้องสอบ (Pre-Exam Settings & Custom Questions)
  // ==========================================================================
  const [questionSets, setQuestionSets] = useState<QuestionBankSet[]>(QUESTION_BANK_SETS);
  const [selectedSetId, setSelectedSetId] = useState<string>(QUESTION_BANK_SETS[0].id);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(5);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [showQuestionPreview, setShowQuestionPreview] = useState<boolean>(false);

  // สถานะ Modal สำหรับสร้างข้อสอบใหม่
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('คำถามทั่วไป');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // ดึงชุดข้อสอบที่ครูเลือกในปัจจุบัน
  const currentQuestionSet =
    questionSets.find((s) => s.id === selectedSetId) || questionSets[0];
  const activeExamTitle = examTitle || currentQuestionSet.title;

  // สถานะห้องสอบและ QR Code Modal
  const [isRoomActive, setIsRoomActive] = useState<boolean>(false);
  const [examStatus, setExamStatus] = useState<'waiting' | 'active' | 'ended'>('waiting');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [roomPinCode, setRoomPinCode] = useState<string>(initialPin);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(initialSoundEnabled);
  const [isRewardsAwarded, setIsRewardsAwarded] = useState<boolean>(false);

  // คำนวณรายชื่อนักเรียนเริ่มต้นจาก props
  const defaultStudentsList = useMemo(() => {
    const source = presentStudents || propStudents;
    if (source && source.length > 0) {
      return source.map((s) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId || (s as { studentCode?: string }).studentCode,
        avatar: '⚔️',
        gold: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        isJoined: false,
      }));
    }
    return DEFAULT_PRESENT_STUDENTS.map((s) => ({
      id: s.id,
      name: s.name,
      avatar: '⚔️',
      gold: 0,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      isJoined: false,
    }));
  }, [presentStudents, propStudents]);

  // ข้อมูลผู้เล่นและ Activity Logs ที่ซิงค์จาก API
  const [students, setStudents] = useState<ArenaStudent[]>(defaultStudentsList);
  const [logs, setLogs] = useState<ArenaLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ระบบจับเวลาถอยหลังหน้าห้องเรียน (คำนวณจากนาทีที่ครูเลือก)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(selectedDurationMinutes * 60);

  // เล่นเสียงประกอบ
  const playSfx = useCallback(
    (type: 'tick' | 'coin' | 'fanfare' | 'buzzer' | 'whistle') => {
      if (!isSoundOn) return;
      try {
        if (type === 'tick') soundFX.playTick();
        if (type === 'coin') soundFX.playCoin();
        if (type === 'fanfare') soundFX.playFanfare();
        if (type === 'buzzer') soundFX.playBuzzer();
        if (type === 'whistle') soundFX.playWhistle();
      } catch {
        // ignore
      }
    },
    [isSoundOn]
  );

  // อัปเดตเวลาแสดงผลเมื่อครูเปลี่ยนตัวเลือกเวลาในหน้า Waiting
  useEffect(() => {
    if (examStatus !== 'active') {
      setTimeLeftSeconds(selectedDurationMinutes * 60);
    }
  }, [selectedDurationMinutes, examStatus]);

  // 1. ฟังก์ชันดึงข้อมูล Leaderboard & Activity Logs แบบเรียลไทม์จาก API
  const fetchLiveArenaState = useCallback(async () => {
    if (!isRoomActive) return;

    try {
      setIsSyncing(true);
      const query = new URLSearchParams({
        roomId,
        pin: roomPinCode,
      });

      const res = await fetch(`/api/live-classroom/gold-quest?${query.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        // Fallback Local goldQuestService
        const localRoom = goldQuestService.findRoom(roomId, roomPinCode);
        if (localRoom) {
          if (Array.isArray(localRoom.students)) setStudents(localRoom.students);
          if (Array.isArray(localRoom.logs)) setLogs(localRoom.logs);
        }
        return;
      }

      const data = await res.json();

      if (Array.isArray(data.students)) {
        setStudents(data.students);
      }
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }

      if (data.status === 'ended' || data.isActive === false) {
        setIsRoomActive(false);
        setExamStatus('ended');
        playSfx('whistle');
      }
    } catch (error) {
      console.error('ไม่สามารถซิงค์ข้อมูลห้องสอบได้:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isRoomActive, roomId, roomPinCode, playSfx]);

  // 2. Realtime Polling ทุกๆ 2 วินาทีเมื่อห้องสอบกำลังทำงาน
  useEffect(() => {
    if (!isRoomActive || examStatus !== 'active') return;

    fetchLiveArenaState();
    const interval = setInterval(fetchLiveArenaState, 2000);
    return () => clearInterval(interval);
  }, [isRoomActive, examStatus, fetchLiveArenaState]);

  // 3. ฟังก์ชันบันทึกข้อสอบใหม่ที่ครูสร้าง
  const handleSaveCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError(null);

    if (!newPrompt.trim()) {
      setAddModalError('กรุณากรอกโจทย์คำถาม');
      return;
    }

    if (newOptions.some((opt) => !opt.trim())) {
      setAddModalError('กรุณากรอกตัวเลือกให้ครบทั้ง 4 ข้อ');
      return;
    }

    const newQ: ArenaQuestion = {
      id: `custom_q_${Date.now()}`,
      category: newCategory.trim() || 'คำถามทั่วไป',
      prompt: newPrompt.trim(),
      options: [...newOptions],
      correctIndex: newCorrectIndex,
    };

    // ค้นหาหรือสร้าง "ชุดข้อสอบที่คุณครูสร้างเอง" (custom-teacher-set)
    setQuestionSets((prevSets) => {
      const existingCustomSet = prevSets.find((s) => s.id === 'custom-teacher-set');
      if (existingCustomSet) {
        return prevSets.map((s) =>
          s.id === 'custom-teacher-set'
            ? { ...s, questions: [...s.questions, newQ] }
            : s
        );
      } else {
        const newCustomSet: QuestionBankSet = {
          id: 'custom-teacher-set',
          title: 'ชุดที่ 4: ชุดข้อสอบที่คุณครูสร้างเอง (Custom)',
          subtitle: 'คำถามและแบบทดสอบที่สร้างและเพิ่มเข้ามาโดยคุณครู',
          badge: 'สร้างเอง',
          difficulty: 'กำหนดเอง',
          questions: [newQ],
        };
        return [...prevSets, newCustomSet];
      }
    });

    // เลือกชุดข้อสอบที่คุณครูสร้างให้อัตโนมัติทันที
    setSelectedSetId('custom-teacher-set');
    setShowQuestionPreview(true);
    playSfx('coin');

    // ล้างค่าในฟอร์มและปิด Modal
    setNewPrompt('');
    setNewOptions(['', '', '', '']);
    setNewCorrectIndex(0);
    setIsAddModalOpen(false);
  };

  // ฟังก์ชันลบข้อสอบในชุดที่ครูสร้าง
  const handleDeleteCustomQuestion = (questionId: string) => {
    setQuestionSets((prevSets) =>
      prevSets.map((s) => {
        if (s.id !== 'custom-teacher-set') return s;
        return {
          ...s,
          questions: s.questions.filter((q) => q.id !== questionId),
        };
      })
    );
  };

  // 4. ฟังก์ชันเปิดห้องสอบสด (Start Room)
  const handleStartExamRoom = async () => {
    const generatedPin = generateSecurePin();
    const totalSeconds = selectedDurationMinutes * 60;

    setRoomPinCode(generatedPin);
    setTimeLeftSeconds(totalSeconds);
    setIsRewardsAwarded(false);

    // เตรียมชุดข้อสอบที่เลือก (ถ้าเปิด Shuffle ให้สุ่มข้อ)
    const preparedQuestions = shuffleQuestions
      ? [...currentQuestionSet.questions].sort(() => Math.random() - 0.5)
      : currentQuestionSet.questions;

    // เริ่มต้นห้องใน Memory Service
    goldQuestService.startRoom({
      roomId,
      pin: generatedPin,
      examTitle: activeExamTitle,
      students: defaultStudentsList,
      questions: preparedQuestions,
    });

    try {
      const res = await fetch('/api/live-classroom/gold-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'START_ROOM',
          roomId,
          pin: generatedPin,
          classroomId,
          examTitle: activeExamTitle,
          durationMinutes: selectedDurationMinutes,
          students: defaultStudentsList,
          questions: preparedQuestions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.room?.students) setStudents(data.room.students);
        if (data.room?.logs) setLogs(data.room.logs);
      }
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการเปิดห้องสอบ:', err);
    }

    playSfx('fanfare');
    setIsRoomActive(true);
    setExamStatus('active');
    setIsQrModalOpen(true);
  };

  // 5. ฟังก์ชันปิดหรือจบการสอบ (End Room)
  const handleEndExamRoom = useCallback(async () => {
    playSfx('whistle');
    goldQuestService.endRoom(roomId, roomPinCode);

    try {
      await fetch('/api/live-classroom/gold-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'END_ROOM',
          roomId,
          pin: roomPinCode,
        }),
      });
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการปิดห้องสอบ:', err);
    }

    setIsRoomActive(false);
    setExamStatus('ended');
    setIsQrModalOpen(false);
  }, [roomId, roomPinCode, playSfx]);

  // 6. นับเวลาถอยหลัง 1 วินาที
  useEffect(() => {
    if (!isRoomActive || examStatus !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndExamRoom();
          return 0;
        }
        if (prev === 61 || prev === 31 || prev === 11) {
          playSfx('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoomActive, examStatus, handleEndExamRoom, playSfx]);

  // ฟังก์ชันแปลงทองเป็นเหรียญจริงมอบให้นักเรียนในคาบ
  const handleAwardSessionRewards = () => {
    if (!onAwardSessionRewards || isRewardsAwarded) return;

    const awards = students
      .filter((s) => s.gold > 0)
      .map((s) => {
        const coinsAwarded = Math.max(1, Math.floor(s.gold / 50));
        const ticketsAwarded = s.streak >= 3 ? 1 : 0;
        return {
          studentId: s.studentId || s.id,
          coins: coinsAwarded,
          tickets: ticketsAwarded,
        };
      });

    if (awards.length > 0) {
      onAwardSessionRewards(awards);
      setIsRewardsAwarded(true);
      playSfx('coin');
    }
  };

  // สรุปผลจัดอันดับ Leaderboard
  const sortedLeaderboard = useMemo(() => {
    return [...students].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.wrongCount - b.wrongCount;
    });
  }, [students]);

  const joinedCount = students.filter((s) => s.isJoined).length;
  const totalRoomGold = students.reduce((sum, s) => sum + s.gold, 0);
  const totalCorrectAnswers = students.reduce((sum, s) => sum + s.correctCount, 0);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* ================================================================= */}
      {/* 1. แถบหัวข้อและเมนูควบคุมด้านบน (Teacher Header Bar)               */}
      {/* ================================================================= */}
      <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* ข้อมูลประจำห้องและชื่อข้อสอบ */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Coins className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                {activeExamTitle}
              </h1>
              {examStatus === 'active' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  LIVE ARENA
                </span>
              )}
              {examStatus === 'waiting' && (
                <span className="text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-0.5 rounded-full">
                  พร้อมเปิดห้อง
                </span>
              )}
              {examStatus === 'ended' && (
                <span className="text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full">
                  จบการแข่งขันแล้ว
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>รหัสห้อง: {roomId}</span>
              <span>•</span>
              <span>ชุดข้อสอบ: {currentQuestionSet.title}</span>
              <span>•</span>
              <span>จำนวน {currentQuestionSet.questions.length} ข้อ</span>
              <span>•</span>
              <span>เวลาสอบ {selectedDurationMinutes} นาที</span>
            </p>
          </div>
        </div>

        {/* แถบปุ่ม Action หลัก */}
        <div className="flex flex-wrap items-center gap-3">
          {/* ปุ่มเปิด/ปิดเสียง */}
          <button
            onClick={() => {
              setIsSoundOn((prev) => !prev);
              if (onToggleSound) onToggleSound();
            }}
            title={isSoundOn ? 'ปิดเสียงเกม' : 'เปิดเสียงเกม'}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {examStatus === 'active' && (
            <>
              {/* แสดงรหัส PIN 6 หลักขนาดใหญ่ */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center gap-2.5 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase">PIN:</span>
                <span className="text-xl font-mono font-black tracking-widest text-amber-400">
                  {roomPinCode}
                </span>
              </div>

              {/* นาฬิกานับถอยหลัง */}
              <div
                className={`bg-slate-950 border rounded-2xl px-4 py-2 flex items-center gap-2 ${
                  timeLeftSeconds <= 60
                    ? 'border-rose-500/60 text-rose-400 animate-pulse'
                    : 'border-indigo-500/40 text-white'
                }`}
              >
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xl font-mono font-black">
                  {formatTime(timeLeftSeconds)}
                </span>
              </div>

              {/* ปุ่มเปิด Modal แสดง QR Code บนจอโปรเจกเตอร์ */}
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>📷 แสดง QR Code / PIN (6 หลัก)</span>
              </button>

              {/* ปุ่มจบการสอบ */}
              <button
                onClick={handleEndExamRoom}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-rose-600/25 transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>จบการสอบ</span>
              </button>
            </>
          )}

          {examStatus !== 'active' && (
            <button
              onClick={handleStartExamRoom}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {examStatus === 'ended'
                  ? 'เปิดห้องสอบรอบใหม่ (ตามที่ตั้งค่า)'
                  : `เปิดห้องสอบ (${selectedDurationMinutes} นาที) & แสดง QR Code`}
              </span>
            </button>
          )}

          {/* ปุ่มมอบเหรียญจริงเข้ากระเป๋าเมื่อจบการสอบ */}
          {examStatus === 'ended' && onAwardSessionRewards && (
            <button
              onClick={handleAwardSessionRewards}
              disabled={isRewardsAwarded}
              className={`flex items-center gap-2 font-black px-5 py-3 rounded-2xl text-sm shadow-xl transition cursor-pointer ${
                isRewardsAwarded
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Coins className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isRewardsAwarded ? '✓ มอบเหรียญเข้ากระเป๋าแล้ว' : '🪙 มอบรางวัลเข้าสมุดคะแนนในคาบ'}
              </span>
            </button>
          )}

          {/* Close overlay button */}
          {onClose && (
            <button
              onClick={onClose}
              title="ปิดหน้าจอ"
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. แผงตั้งค่าก่อนเริ่มห้องสอบ (แสดงเฉพาะตอนยังไม่เริ่มหรือจบเกมแล้ว) */}
      {/* ================================================================= */}
      {examStatus !== 'active' && (
        <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  ตั้งค่าห้องสอบก่อนเริ่มแข่งขัน (Exam Room Setup)
                </h2>
                <p className="text-xs text-slate-400">
                  เลือกชุดข้อสอบ หรือสร้างข้อสอบใหม่เองได้ทันทีหน้าเว็บ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>สร้างข้อสอบใหม่เอง</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQuestionPreview((prev) => !prev)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {showQuestionPreview
                    ? 'ซ่อนตัวอย่างข้อสอบ'
                    : `ดูโจทย์ (${currentQuestionSet.questions.length} ข้อ)`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ฝั่งซ้าย (7 คอลัมน์): เลือกชุดข้อสอบ */}
            <div className="lg:col-span-7 space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>1. เลือกชุดข้อสอบ (Question Set)</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {questionSets.map((setItem) => {
                  const isSelected = setItem.id === selectedSetId;
                  return (
                    <button
                      key={setItem.id}
                      type="button"
                      onClick={() => setSelectedSetId(setItem.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-white">
                            {setItem.title}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            {setItem.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{setItem.subtitle}</p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="inline-block text-xs font-mono font-black text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-xl">
                          {setItem.questions.length} ข้อ
                        </span>
                        <div className="text-[10px] text-slate-400">
                          ระดับ: {setItem.difficulty}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ฝั่งขวา (5 คอลัมน์): เลือกเวลาสอบ & ออปชันเสริม */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span>2. เลือกเวลาสอบ (Time Limit)</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {DURATION_OPTIONS.map((item) => {
                    const isSelected = selectedDurationMinutes === item.minutes;
                    return (
                      <button
                        key={item.minutes}
                        type="button"
                        onClick={() => setSelectedDurationMinutes(item.minutes)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-mono font-black text-amber-400">
                            {item.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ตัวเลือกสลับลำดับข้อสอบ */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shuffle className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      สลับลำดับข้อสอบอัตโนมัติ (Shuffle)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ป้องกันการลอกคำตอบระหว่างทำข้อสอบ
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffleQuestions((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    shuffleQuestions
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {shuffleQuestions ? 'เปิดใช้งาน' : 'ปิด'}
                </button>
              </div>
            </div>
          </div>

          {/* กล่องแสดงตัวอย่างข้อสอบในชุดที่เลือก (เมื่อกดปุ่มดูโจทย์) */}
          {showQuestionPreview && (
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>ตัวอย่างคำถามใน &ldquo;{currentQuestionSet.title}&rdquo; ({currentQuestionSet.questions.length} ข้อ):</span>
                {currentQuestionSet.id === 'custom-teacher-set' && (
                  <span className="text-[11px] text-slate-400">ชุดที่คุณครูสร้างเอง</span>
                )}
              </div>
              {currentQuestionSet.questions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                  ยังไม่มีข้อสอบในชุดนี้ กดปุ่ม &ldquo;สร้างข้อสอบใหม่เอง&rdquo; ด้านบนเพื่อเพิ่มข้อสอบ
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {currentQuestionSet.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5 relative group"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-indigo-300">
                          ข้อที่ {idx + 1} ({q.category})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-semibold">
                            เฉลย: {q.options[q.correctIndex]}
                          </span>
                          {currentQuestionSet.id === 'custom-teacher-set' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              title="ลบข้อนี้"
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-white">{q.prompt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. การ์ดสรุปสถิติภาพรวมทั้งห้องเรียน (4 กล่อง)                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* กล่องที่ 1: นักเรียนที่เข้าร่วม */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">นักเรียนที่สแกนเข้าห้อง</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {joinedCount} <span className="text-sm text-slate-400">/ {students.length} คน</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* กล่องที่ 2: ยอดทองคำสะสมรวม */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-300/80 font-semibold">ทองคำสะสมรวมทั้งห้อง</p>
            <p className="text-2xl font-mono font-black text-amber-400 mt-1">
              {totalRoomGold.toLocaleString()} G
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* กล่องที่ 3: จำนวนข้อที่ตอบถูกรวม */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">จำนวนข้อที่ตอบถูกรวม</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {totalCorrectAnswers} <span className="text-sm text-slate-400">ครั้ง</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* กล่องที่ 4: ผู้นำอันดับ 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">ผู้นำอันดับ 1 ตอนนี้</p>
            <p className="text-lg font-black text-white truncate max-w-[160px] mt-1">
              {sortedLeaderboard[0]
                ? `${sortedLeaderboard[0].avatar} ${sortedLeaderboard[0].name}`
                : 'ยังไม่มีข้อมูล'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. พื้นที่หลัก: กระดานผู้นำ (ซ้าย 8 คอลัมน์) + Activity Logs (ขวา 4) */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ฝั่งซ้าย: แท่นรางวัล Top 3 & ตาราง Leaderboard ทั้งห้อง */}
        <div className="lg:col-span-8 space-y-6">
          {/* แท่นรางวัล Top 3 (Podium) */}
          {sortedLeaderboard.length >= 3 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>แท่นผู้นำสูงสุด 3 อันดับแรก (Top 3 Gold Hunters)</span>
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end pt-2">
                {/* อันดับ 2 (เงิน) */}
                <div className="bg-slate-950/90 border border-slate-700 rounded-2xl p-4 text-center space-y-2">
                  <div className="text-xs font-extrabold text-slate-300">🥈 อันดับ 2</div>
                  <div className="text-3xl">{sortedLeaderboard[1].avatar || '⚔️'}</div>
                  <div className="text-sm font-black text-white truncate">
                    {sortedLeaderboard[1].name}
                  </div>
                  <div className="text-lg font-mono font-black text-slate-200">
                    {sortedLeaderboard[1].gold.toLocaleString()} G
                  </div>
                </div>

                {/* อันดับ 1 (ทองคำ) */}
                <div className="bg-gradient-to-b from-amber-500/20 to-slate-950 border-2 border-amber-400 rounded-2xl p-5 text-center space-y-2 shadow-xl shadow-amber-500/10">
                  <div className="inline-flex items-center gap-1 text-xs font-black bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full">
                    <Crown className="w-3.5 h-3.5" /> อันดับ 1
                  </div>
                  <div className="text-4xl">{sortedLeaderboard[0].avatar || '👑'}</div>
                  <div className="text-base font-black text-white truncate">
                    {sortedLeaderboard[0].name}
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-400">
                    {sortedLeaderboard[0].gold.toLocaleString()} G
                  </div>
                </div>

                {/* อันดับ 3 (ทองแดง) */}
                <div className="bg-slate-950/90 border border-amber-700/50 rounded-2xl p-4 text-center space-y-2">
                  <div className="text-xs font-extrabold text-amber-500">🥉 อันดับ 3</div>
                  <div className="text-3xl">{sortedLeaderboard[2].avatar || '⚔️'}</div>
                  <div className="text-sm font-black text-white truncate">
                    {sortedLeaderboard[2].name}
                  </div>
                  <div className="text-lg font-mono font-black text-amber-400/90">
                    {sortedLeaderboard[2].gold.toLocaleString()} G
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ตารางแสดงคะแนนนักเรียนทุกคน (Leaderboard List) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>กระดานคะแนนเรียลไทม์ (Live Leaderboard)</span>
              </h2>
              <span className="text-xs text-slate-400">เรียงตามทองคำสูงสุด</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {sortedLeaderboard.map((student, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                      rank === 1
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : student.isJoined
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    {/* ข้อมูลประจำตัว */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{rank}
                      </span>
                      <span className="text-2xl shrink-0">{student.avatar || '⚔️'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white truncate">
                            {student.name}
                          </span>
                          {student.isJoined ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                              เข้าห้องแล้ว
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                              รอสแกน QR
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>ตอบถูก {student.correctCount} ข้อ</span>
                          <span>•</span>
                          <span>ผิด {student.wrongCount} ข้อ</span>
                        </div>
                      </div>
                    </div>

                    {/* แต้มทองคำและ Streak Combo */}
                    <div className="flex items-center gap-4 shrink-0">
                      {student.streak > 1 && (
                        <div className="hidden sm:flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-xl text-xs font-black">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>x{student.streak}</span>
                        </div>
                      )}
                      <div className="text-right min-w-[90px]">
                        <span className="text-lg font-mono font-black text-amber-400">
                          {student.gold.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-amber-300 ml-1">G</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: กิจกรรมสดในสนามสอบ (Real-Time Live Logs) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>เหตุการณ์สดในสนามสอบ</span>
                </h2>
                <div className="flex items-center gap-2">
                  {isSyncing && (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  )}
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Real-time
                  </span>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs">
                    เลือกชุดข้อสอบและกดปุ่ม &ldquo;เปิดห้องสอบ&rdquo; เพื่อเริ่มเกม
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {logs.map((log) => {
                    const badgeStyle =
                      log.type === 'steal'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                        : log.type === 'chest'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                        : log.type === 'join'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300';

                    const IconComponent =
                      log.type === 'steal'
                        ? Swords
                        : log.type === 'chest'
                        ? Gift
                        : log.type === 'join'
                        ? UserPlus
                        : Sparkles;

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${badgeStyle}`}
                      >
                        <IconComponent className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-relaxed break-words">{log.message}</p>
                          <span className="text-[10px] opacity-60 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>อัปเดตทุก 2 วินาที</span>
              <span>{logs.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Modal สร้างข้อสอบใหม่เองหน้าเว็บ (Add Custom Question Modal)     */}
      {/* ================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    สร้างคำถามข้อสอบใหม่
                  </h2>
                  <p className="text-xs text-slate-400">
                    เพิ่มคำถามเข้าสู่ชุดข้อสอบที่คุณครูสร้างเองทันที
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-indigo-300">
                    หมวดหมู่คำถาม (Category)
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="เช่น คำศัพท์ N5"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300">
                    เลือกข้อที่ถูกต้อง (Correct Option)
                  </label>
                  <select
                    value={newCorrectIndex}
                    onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 px-3.5 text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>ตัวเลือก A (ข้อที่ 1)</option>
                    <option value={1}>ตัวเลือก B (ข้อที่ 2)</option>
                    <option value={2}>ตัวเลือก C (ข้อที่ 3)</option>
                    <option value={3}>ตัวเลือก D (ข้อที่ 4)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300">
                  โจทย์คำถาม (Prompt)
                </label>
                <textarea
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="พิมพ์โจทย์คำถามที่นี่..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold text-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-300">
                  ตัวเลือกคำตอบ 4 ข้อ (A, B, C, D)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {newOptions.map((opt, idx) => {
                    const isCorrect = newCorrectIndex === idx;
                    const labels = ['A', 'B', 'C', 'D'];
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {labels[idx]}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[idx] = e.target.value;
                            setNewOptions(updated);
                          }}
                          placeholder={`ตัวเลือก ${labels[idx]}...`}
                          className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none ${
                            isCorrect
                              ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                              : 'border-slate-800 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {addModalError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                  {addModalError}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  บันทึกข้อสอบและเลือกใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. Modal แสดง QR Code และรหัส PIN 6 หลักสำหรับฉายขึ้นโปรเจกเตอร์   */}
      {/* ================================================================= */}
      <RoomQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomId={roomId}
        roomPin={roomPinCode}
        examTitle={activeExamTitle}
        studentCount={joinedCount}
        onPlaySound={playSfx}
      />
    </div>
  );
}
