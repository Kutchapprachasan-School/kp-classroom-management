// components/GoldQuestArena.tsx
// หน้าจอควบคุมและโปรเจกเตอร์ฝั่งคุณครู (Teacher Live Arena & Projector Dashboard)
// พร้อมแผงตั้งค่าก่อนเริ่มห้องสอบ (Pre-Exam Setup Panel): เลือกชุดข้อสอบ 3 ชุด, เวลาสอบ 3-15 นาที, สลับลำดับข้อสอบ
// เชื่อมต่อกับ RoomQRCodeModal.tsx และดึงข้อมูลจาก API /api/live-classroom/gold-quest แบบเรียลไทม์ทุกๆ 2 วินาที

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  X,
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
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ท้าทาย';
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
// คลังชุดข้อสอบให้คุณครูเลือกก่อนเปิดห้องสอบ (Question Bank Sets)
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
  classroomName = 'ห้องเรียน',
  examTitle,
  presentStudents,
  students: propStudents,
  isProjectorMode: initialProjectorMode = false,
  soundEnabled: initialSoundEnabled = true,
  onToggleSound,
  onToggleProjector: _onToggleProjector,
  onClose,
  onAwardSessionRewards,
}: GoldQuestArenaProps) {
  // ==========================================================================
  // State สำหรับการตั้งค่าก่อนเปิดห้องสอบ (Pre-Exam Settings)
  // ==========================================================================
  const [selectedSetId, setSelectedSetId] = useState<string>(QUESTION_BANK_SETS[0].id);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(5);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [showQuestionPreview, setShowQuestionPreview] = useState<boolean>(false);

  // ดึงชุดข้อสอบที่ครูเลือกในปัจจุบัน
  const currentQuestionSet =
    QUESTION_BANK_SETS.find((s) => s.id === selectedSetId) || QUESTION_BANK_SETS[0];
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
      }
    } catch {
      // Fallback Local goldQuestService
      const localRoom = goldQuestService.findRoom(roomId, roomPinCode);
      if (localRoom) {
        if (Array.isArray(localRoom.students)) setStudents(localRoom.students);
        if (Array.isArray(localRoom.logs)) setLogs(localRoom.logs);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isRoomActive, roomId, roomPinCode]);

  // ตั้งเวลา Polling ดึงข้อมูลทุกๆ 2 วินาทีเมื่อห้องสอบเปิดอยู่
  useEffect(() => {
    if (!isRoomActive || examStatus !== 'active') return;

    fetchLiveArenaState();
    const interval = setInterval(fetchLiveArenaState, 2000);
    return () => clearInterval(interval);
  }, [isRoomActive, examStatus, fetchLiveArenaState]);

  // ซิงค์ผ่าน goldQuestService bus เมื่อมีอัปเดตแบบเรียลไทม์ทันที
  useEffect(() => {
    const unsubscribe = goldQuestService.subscribe((updatedRoom) => {
      if (updatedRoom.roomId === roomId || updatedRoom.pin === roomPinCode) {
        if (Array.isArray(updatedRoom.students)) setStudents(updatedRoom.students);
        if (Array.isArray(updatedRoom.logs)) setLogs(updatedRoom.logs);
        if (updatedRoom.status === 'ended' || !updatedRoom.isActive) {
          setIsRoomActive(false);
          setExamStatus('ended');
        }
      }
    });
    return () => unsubscribe();
  }, [roomId, roomPinCode]);

  // 2. ฟังก์ชันเปิดห้องสอบตามเวลาและชุดข้อสอบที่ครูเลือก
  const handleStartExamRoom = async () => {
    const generatedPin = generateSecurePin();
    const totalSeconds = selectedDurationMinutes * 60;

    setRoomPinCode(generatedPin);
    setTimeLeftSeconds(totalSeconds);
    setIsRewardsAwarded(false);

    // จัดเตรียมชุดข้อสอบ (สลับลำดับข้อหากคุณครูเปิดใช้งาน Shuffle)
    const preparedQuestions = shuffleQuestions
      ? [...currentQuestionSet.questions].sort(() => Math.random() - 0.5)
      : currentQuestionSet.questions;

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
    } catch {
      // Local fallback
    }

    // ซิงค์ Local goldQuestService ด้วยเสมอ
    goldQuestService.startRoom({
      roomId,
      pin: generatedPin,
      classroomId,
      examTitle: activeExamTitle,
      students: defaultStudentsList,
      questions: preparedQuestions,
    });

    setIsRoomActive(true);
    setExamStatus('active');
    setIsQrModalOpen(true); // เปิด Modal QR Code ขึ้นจอโปรเจกเตอร์ทันที
    playSfx('fanfare');
  };

  // 3. ฟังก์ชันประกาศจบการสอบ
  const handleEndExamRoom = useCallback(async () => {
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
    } catch {
      // Local fallback
    }

    goldQuestService.endRoom(roomId, roomPinCode);
    setIsRoomActive(false);
    setExamStatus('ended');
    setIsQrModalOpen(false);
    playSfx('fanfare');
  }, [roomId, roomPinCode, playSfx]);

  // นับถอยหลังเวลาสอบทุก 1 วินาที
  useEffect(() => {
    if (!isRoomActive || examStatus !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndExamRoom();
          return 0;
        }
        if (prev <= 11) {
          playSfx('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoomActive, examStatus, handleEndExamRoom, playSfx]);

  // จัดเรียงนักเรียนตามจำนวนทองคำจากมากไปน้อย
  const sortedLeaderboard = [...students].sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    return b.correctCount - a.correctCount;
  });

  // สถิติรวมในห้องสอบ
  const joinedCount = students.filter((s) => s.isJoined).length;
  const totalRoomGold = students.reduce((sum, s) => sum + s.gold, 0);
  const totalCorrectAnswers = students.reduce((sum, s) => sum + s.correctCount, 0);

  // แปลงวินาทีเป็นรูปแบบ MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  };

  // มอบเหรียญ/ตั๋วจริงเข้ากระเป๋าในคาบเรียน
  const handleAwardSessionRewards = () => {
    if (!onAwardSessionRewards || isRewardsAwarded) return;

    const awards = sortedLeaderboard.map((st, idx) => {
      let coins = 5;
      let tickets = 0;
      if (idx === 0) {
        coins = 30;
        tickets = 2;
      } else if (idx === 1) {
        coins = 20;
        tickets = 1;
      } else if (idx === 2) {
        coins = 15;
        tickets = 1;
      } else if (idx < 10) {
        coins = 10;
        tickets = 0;
      }
      return {
        studentId: st.id,
        coins,
        tickets,
      };
    });

    onAwardSessionRewards(awards);
    setIsRewardsAwarded(true);
    playSfx('coin');
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6 ${
        initialProjectorMode ? 'text-lg' : 'text-base'
      }`}
    >
      {/* ================================================================= */}
      {/* 1. แถบควบคุมด้านบน (Header Control Bar สำหรับจอโปรเจกเตอร์)       */}
      {/* ================================================================= */}
      <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Coins className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">
                {activeExamTitle}
              </h1>
              {examStatus === 'active' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  LIVE ARENA
                </span>
              )}
              {examStatus === 'ended' && (
                <span className="text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full">
                  จบการแข่งขันแล้ว
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>{classroomName} • รหัสห้อง: {roomId}</span>
              <span>•</span>
              <span>จำนวน {currentQuestionSet.questions.length} ข้อ</span>
              <span>•</span>
              <span>เวลาสอบ {selectedDurationMinutes} นาที</span>
              {examStatus === 'active' && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-300">
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    ซิงค์ข้อมูลอัตโนมัติ
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ปุ่มควบคุมฝั่งคุณครู */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setIsSoundOn(!isSoundOn);
              onToggleSound?.();
            }}
            title={isSoundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {examStatus === 'active' && (
            <>
              {/* ป้ายแสดงรหัส PIN 6 หลักขนาดย่อบนแถบ Header */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center gap-2.5">
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

              {/* ปุ่มเรียก QR Code ขึ้นจอโปรเจกเตอร์ */}
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
                  เลือกชุดข้อสอบและกำหนดเวลาสอบก่อนกดเปิด QR Code ให้นักเรียนสแกน
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuestionPreview((prev) => !prev)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {showQuestionPreview
                  ? 'ซ่อนตัวอย่างข้อสอบ'
                  : `ดูโจทย์ในชุดนี้ (${currentQuestionSet.questions.length} ข้อ)`}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ฝั่งซ้าย (7 คอลัมน์): เลือกชุดข้อสอบ */}
            <div className="lg:col-span-7 space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>1. เลือกชุดข้อสอบ (Question Set)</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {QUESTION_BANK_SETS.map((setItem) => {
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
                      ป้องกันการลอกคำตอบระหว่างทำข้อสอบในห้องเรียน
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
              <div className="text-xs font-bold text-amber-300">
                ตัวอย่างคำถามใน &ldquo;{currentQuestionSet.title}&rdquo;:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {currentQuestionSet.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-indigo-300">
                        ข้อที่ {idx + 1} ({q.category})
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        เฉลย: {q.options[q.correctIndex]}
                      </span>
                    </div>
                    <p className="font-bold text-white">{q.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. การ์ดสรุปสถิติภาพรวมทั้งห้องเรียน (4 กล่อง)                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          {/* แท่นรางวัล Top 3 Podium */}
          {sortedLeaderboard.length >= 3 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>แท่นผู้นำสูงสุด 3 อันดับแรก (Top 3 Gold Hunters)</span>
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end pt-2">
                {/* อันดับ 2 */}
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

                {/* อันดับ 1 */}
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

                {/* อันดับ 3 */}
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

          {/* รายชื่อนักเรียนและอันดับทั้งหมด */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>กระดานคะแนนเรียลไทม์ (Live Leaderboard)</span>
              </h2>
              <span className="text-xs text-slate-400">
                เรียงตามจำนวนทองคำสูงสุด
              </span>
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

        {/* ฝั่งขวา: แถบเหตุการณ์สด (Real-time Activity Feed) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>เหตุการณ์สดในสนามสอบ</span>
                </h2>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs">
                    เลือกชุดข้อสอบและเวลาสอบด้านบน จากนั้นกดปุ่ม &ldquo;เปิดห้องสอบ&rdquo;
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
              <span>อัปเดตข้อมูลทุก 2 วินาที</span>
              <span>รายการล่าสุด {logs.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. Modal แสดง QR Code และรหัส PIN 6 หลักสำหรับฉายขึ้นโปรเจกเตอร์   */}
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
