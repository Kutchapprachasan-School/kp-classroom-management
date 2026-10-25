// app/live-classroom/gold-quest/play/page.tsx
// หน้าจอทำข้อสอบและเปิดหีบทองคำบนมือถือสำหรับนักเรียน (Gold Quest Play Screen)
// ออกแบบสำหรับหน้าจอมือถือโดยเฉพาะ (Mobile-First):
// - ตอบคำถาม 4 ตัวเลือก พร้อมปุ่มแตะขนาดใหญ่
// - เปิดหีบสมบัติ 1 ใน 3 ใบ (+30 G, +60 G, +100 G, x2, กับดัก -25%, ขโมยทอง, สลับกระเป๋าทอง)
// - ซิงค์ยอดทองคำแบบ Real-time และแจ้งเตือนเมื่อถูกโจมตี

'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import {
  Coins,
  Flame,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  Gift,
  Swords,
  ArrowRightLeft,
  ArrowRight,
  Loader2,
  Crown,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

interface GoldQuestStudent {
  id: string;
  name: string;
  avatar: string;
  gold: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  isJoined: boolean;
}

interface GoldQuestQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  category?: string;
}

type ChestRewardType =
  | 'GOLD_30'
  | 'GOLD_60'
  | 'GOLD_100'
  | 'DOUBLE'
  | 'LOSE_25'
  | 'STEAL'
  | 'SWAP';

interface ChestOption {
  type: ChestRewardType;
  label: string;
  description: string;
  emoji: string;
}

// ชุดข้อสอบสำรอง กรณีเปิดทดสอบหน้าเว็บโดยตรงหรือ API ไม่ได้ส่งคำถามมา
const FALLBACK_QUESTIONS: GoldQuestQuestion[] = [
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
];

// สุ่มผลลัพธ์หีบสมบัติ 3 ใบในแต่ละรอบที่ตอบถูก
function generateThreeChests(): ChestOption[] {
  const pool: ChestOption[] = [
    { type: 'GOLD_30', label: '+30 Gold', description: 'รับเหรียญทองคำ 30 G', emoji: '🪙' },
    { type: 'GOLD_60', label: '+60 Gold', description: 'รับถุงทองคำ 60 G', emoji: '💰' },
    { type: 'GOLD_100', label: '+100 Gold', description: 'แจ็คพอต! หีบทองคำ 100 G', emoji: '👑' },
    { type: 'DOUBLE', label: 'x2 ทองคำ!', description: 'ทองคำที่มีอยู่เพิ่มขึ้นเป็น 2 เท่า', emoji: '✨' },
    { type: 'LOSE_25', label: 'กับดัก! -25%', description: 'โดนกับดักระเบิด เสียทอง 25%', emoji: '💣' },
    { type: 'STEAL', label: 'ขโมยทองเพื่อน!', description: 'ขโมยทองคำ 50 G จากเพื่อน 1 คน', emoji: '🦊' },
    { type: 'SWAP', label: 'สลับกระเป๋าทอง!', description: 'สลับจำนวนทองทั้งหมดกับเพื่อน 1 คน', emoji: '⚡' },
  ];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// Navigation Hooks ที่ทำงานได้ 100% ทั้งใน Next.js และ Single-Page Application (Vite)
function useSafeSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(() => {
    return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  });

  useEffect(() => {
    const handlePopState = () => {
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return params;
}

function useSafeRouter() {
  return useMemo(
    () => ({
      push: (url: string) => {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
      replace: (url: string) => {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
    }),
    []
  );
}

export function GoldQuestPlayContent() {
  const searchParams = useSafeSearchParams();
  const router = useSafeRouter();

  const urlRoom = searchParams.get('room') || searchParams.get('roomId') || 'default-room';
  const urlPin = searchParams.get('pin') || '';
  const urlStudentId = searchParams.get('studentId') || '';

  // ข้อมูลผู้เล่น
  const [roomId, setRoomId] = useState<string>(urlRoom);
  const [pin, setPin] = useState<string>(urlPin);
  const [studentId, setStudentId] = useState<string>(urlStudentId);
  const [studentName, setStudentName] = useState<string>('ผู้กล้านิรนาม');
  const [avatar, setAvatar] = useState<string>('⚔️');

  // สถานะคะแนนและห้องสอบ
  const [examTitle, setExamTitle] = useState<string>('Gold Quest Arena');
  const [gold, setGold] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [classmates, setClassmates] = useState<GoldQuestStudent[]>([]);
  const [questions, setQuestions] = useState<GoldQuestQuestion[]>(FALLBACK_QUESTIONS);
  const [isRoomEnded, setIsRoomEnded] = useState<boolean>(false);

  // สถานะการเล่นในแต่ละข้อ: "QUESTION" | "WRONG_FEEDBACK" | "CHEST_SELECT" | "TARGET_SELECT" | "CHEST_RESULT"
  const [phase, setPhase] = useState<
    'QUESTION' | 'WRONG_FEEDBACK' | 'CHEST_SELECT' | 'TARGET_SELECT' | 'CHEST_RESULT'
  >('QUESTION');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // สถานะหีบสมบัติ
  const [chests, setChests] = useState<ChestOption[]>([]);
  const [pickedChestIndex, setPickedChestIndex] = useState<number | null>(null);
  const [activeReward, setActiveReward] = useState<ChestOption | null>(null);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // แจ้งเตือนเมื่อถูกเพื่อนขโมยหรือสลับทอง
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  // 1. โหลดข้อมูลผู้เล่นจาก sessionStorage ตอนเปิดหน้าเว็บ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('gold_quest_player');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.studentId && !urlStudentId) setStudentId(parsed.studentId);
          if (parsed.name) setStudentName(parsed.name);
          if (parsed.avatar) setAvatar(parsed.avatar);
          if (parsed.roomId && urlRoom === 'default-room') setRoomId(parsed.roomId);
          if (parsed.pin && !urlPin) setPin(parsed.pin);
        } catch {
          // กรณี JSON ผิดพลาด ใช้ค่าจาก URL แทน
        }
      }
    }
  }, [urlRoom, urlPin, urlStudentId]);

  // 2. ดึงข้อมูลห้องสอบและซิงค์ยอดทองคำแบบ Real-time ทุก 3 วินาที
  const fetchRoomState = useCallback(async () => {
    if (!pin && !roomId) return;
    try {
      const query = new URLSearchParams({
        ...(roomId ? { roomId } : {}),
        ...(pin ? { pin } : {}),
      });
      const res = await fetch(`/api/live-classroom/gold-quest?${query.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.examTitle) setExamTitle(data.examTitle);

      if (data.status === 'ended' || data.isActive === false) {
        setIsRoomEnded(true);
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      }

      if (Array.isArray(data.students)) {
        setClassmates(data.students);
        const me = data.students.find((s: GoldQuestStudent) => s.id === studentId);
        if (me) {
          setStudentName(me.name);
          setAvatar(me.avatar || '⚔️');
          // ซิงค์ยอดทองคำกรณีถูกเพื่อนขโมยหรือสลับกระเป๋าทอง
          setGold((prevGold) => {
            if (prevGold !== me.gold && phase === 'QUESTION') {
              const diff = me.gold - prevGold;
              if (diff < 0) {
                setToastAlert(`ระวัง! คุณเสียทองคำ ${Math.abs(diff)} G จากการโจมตีของเพื่อน!`);
                setTimeout(() => setToastAlert(null), 3500);
              }
            }
            return me.gold;
          });
        }
      }
    } catch {
      // กรณีออฟไลน์ ให้เล่นต่อด้วย State ปัจจุบันได้
    }
  }, [roomId, pin, studentId, phase]);

  useEffect(() => {
    fetchRoomState();
    const timer = setInterval(fetchRoomState, 3000);
    return () => clearInterval(timer);
  }, [fetchRoomState]);

  const currentQuestion = questions[currentQIndex % questions.length];

  // คำนวณอันดับปัจจุบันของผู้เล่น
  const sortedLeaderboard = [...classmates].sort((a, b) => b.gold - a.gold);
  const myRankIndex = sortedLeaderboard.findIndex((s) => s.id === studentId);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 1;

  // รายชื่อเพื่อนคนอื่นในห้อง (สำหรับขโมยทองหรือสลับทอง)
  const otherStudents = classmates.filter((s) => s.id !== studentId);

  // 3. เมื่อนักเรียนกดเลือกคำตอบ
  const handleSelectAnswer = async (optionIdx: number) => {
    if (selectedOption !== null || isSubmitting) return;
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQuestion.correctIndex;

    if (isCorrect) {
      // ตอบถูก -> สุ่มหีบ 3 ใบให้เลือกเปิด
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setChests(generateThreeChests());
      setPickedChestIndex(null);
      setActiveReward(null);

      setTimeout(() => {
        setPhase('CHEST_SELECT');
      }, 450);
    } else {
      // ตอบผิด -> ส่งผลลัพธ์ไปที่ API ทันทีและแสดงเฉลย
      setWrongCount((prev) => prev + 1);
      setStreak(0);
      setPhase('WRONG_FEEDBACK');

      try {
        await fetch('/api/live-classroom/gold-quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT_ANSWER',
            roomId,
            pin,
            studentId,
            isCorrect: false,
            goldDelta: 0,
          }),
        });
      } catch {
        // ออฟไลน์โหมด
      }
    }
  };

  // 4. เมื่อนักเรียนแตะเลือกหีบทองคำ 1 ใน 3 ใบ
  const handlePickChest = async (chestIdx: number) => {
    if (pickedChestIndex !== null || isSubmitting) return;
    setPickedChestIndex(chestIdx);
    const chosen = chests[chestIdx];
    setActiveReward(chosen);

    // กรณีได้หีบขโมยทอง (STEAL) หรือสลับทอง (SWAP) และมีเพื่อนในห้อง
    if ((chosen.type === 'STEAL' || chosen.type === 'SWAP') && otherStudents.length > 0) {
      setIsSubmitting(true);
      try {
        // บันทึกคะแนนข้อที่ตอบถูกก่อน (+20 G พื้นฐาน)
        const baseBonus = 20;
        const res = await fetch('/api/live-classroom/gold-quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT_ANSWER',
            roomId,
            pin,
            studentId,
            isCorrect: true,
            goldDelta: baseBonus,
            chestLog: `${avatar} ${studentName} เปิดได้หีบพิเศษ [${chosen.label}] (+${baseBonus} G)`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.student) setGold(data.student.gold);
        } else {
          setGold((prev) => prev + baseBonus);
        }
      } catch {
        setGold((prev) => prev + 20);
      } finally {
        setIsSubmitting(false);
      }

      setTimeout(() => {
        setPhase('TARGET_SELECT');
      }, 700);
      return;
    }

    // คำนวณจำนวนทองที่ได้/เสีย สำหรับหีบทั่วไป
    let goldDelta = 0;
    let chestLogMessage = '';

    if (chosen.type === 'GOLD_30') {
      goldDelta = 30;
      setResultMessage('คุณได้รับทองคำ +30 G!');
      chestLogMessage = `${avatar} ${studentName} เปิดหีบรับทองคำ +30 G`;
    } else if (chosen.type === 'GOLD_60') {
      goldDelta = 60;
      setResultMessage('คุณได้รับถุงทองคำ +60 G!');
      chestLogMessage = `${avatar} ${studentName} เปิดหีบรับทองคำ +60 G`;
    } else if (chosen.type === 'GOLD_100') {
      goldDelta = 100;
      setResultMessage('แจ็คพอตแตก! รับหีบทองคำ +100 G!');
      chestLogMessage = `👑 ${studentName} เปิดได้แจ็คพอต +100 G!`;
    } else if (chosen.type === 'DOUBLE') {
      goldDelta = Math.max(40, gold);
      setResultMessage(`ทองคำคูณสอง! ได้รับเพิ่ม +${goldDelta} G!`);
      chestLogMessage = `✨ ${studentName} เปิดได้หีบคูณสอง (+${goldDelta} G)!`;
    } else if (chosen.type === 'LOSE_25') {
      goldDelta = -Math.floor(gold * 0.25);
      setResultMessage(`โดนกับดักระเบิด! เสียทองคำ ${Math.abs(goldDelta)} G`);
      chestLogMessage = `💣 ${studentName} เปิดเจอกับดัก เสียทอง ${Math.abs(goldDelta)} G`;
    } else {
      // กรณีได้ STEAL หรือ SWAP แต่ยังไม่มีเพื่อนคนอื่นในห้อง ให้โบนัส +50 G แทน
      goldDelta = 50;
      setResultMessage('ยังไม่มีคู่ต่อสู้ในห้อง รับโบนัสทองคำ +50 G แทน!');
      chestLogMessage = `${avatar} ${studentName} เปิดหีบพิเศษรับโบนัส +50 G`;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/live-classroom/gold-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_ANSWER',
          roomId,
          pin,
          studentId,
          isCorrect: true,
          goldDelta,
          chestLog: chestLogMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          setGold(data.student.gold);
        } else {
          setGold((prev) => Math.max(0, prev + goldDelta));
        }
      } else {
        setGold((prev) => Math.max(0, prev + goldDelta));
      }
    } catch {
      setGold((prev) => Math.max(0, prev + goldDelta));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setPhase('CHEST_RESULT');
      }, 650);
    }
  };

  // 5. เมื่อเลือกเพื่อนเป้าหมายที่จะขโมยทอง (STEAL) หรือสลับทอง (SWAP)
  const handleExecuteStealOrSwap = async (target: GoldQuestStudent) => {
    if (!activeReward || isSubmitting) return;
    setIsSubmitting(true);

    const effectType = activeReward.type === 'SWAP' ? 'SWAP' : 'STEAL';
    const stealAmount = 50;

    try {
      const res = await fetch('/api/live-classroom/gold-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STEAL_OR_SWAP_GOLD',
          roomId,
          pin,
          actorId: studentId,
          targetId: target.id,
          effectType,
          amount: stealAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.actor) setGold(data.actor.gold);
        if (Array.isArray(data.students)) setClassmates(data.students);
      }

      if (effectType === 'STEAL') {
        const stolen = Math.min(target.gold, stealAmount);
        setResultMessage(`สำเร็จ! ขโมยทองคำ ${stolen} G จาก ${target.name} เรียบร้อยแล้ว!`);
      } else {
        setResultMessage(`สลับกระเป๋าทองคำกับ ${target.name} สำเร็จ!`);
      }
    } catch {
      setResultMessage(`ใช้สกิลกับ ${target.name} สำเร็จ!`);
    } finally {
      setIsSubmitting(false);
      setPhase('CHEST_RESULT');
    }
  };

  // 6. ไปยังข้อถัดไป
  const handleNextQuestion = () => {
    setSelectedOption(null);
    setPickedChestIndex(null);
    setActiveReward(null);
    setResultMessage('');
    setCurrentQIndex((prev) => prev + 1);
    setPhase('QUESTION');
  };

  // กรณีคุณครูกดจบการสอบแล้ว
  if (isRoomEnded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl">
            🏆
          </div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              จบการแข่งขันแล้ว
            </span>
            <h1 className="text-2xl font-black text-white">{examTitle}</h1>
            <p className="text-xs text-slate-400">
              ผู้เล่น: {avatar} {studentName}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-[11px] text-slate-400">อันดับที่ได้</div>
              <div className="text-2xl font-black text-indigo-400">#{myRank}</div>
            </div>
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3">
              <div className="text-[11px] text-amber-300">ทองคำสะสม</div>
              <div className="text-2xl font-black text-amber-400">{gold} G</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-[11px] text-slate-400">ตอบถูก / ผิด</div>
              <div className="text-xl font-black text-emerald-400">
                {correctCount}{' '}
                <span className="text-xs text-slate-400">/</span>{' '}
                <span className="text-rose-400">{wrongCount}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/live-classroom/gold-quest/join')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-5 rounded-2xl text-sm transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>กลับสู่หน้าเข้าห้องสอบ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 max-w-md mx-auto relative">
      {/* แจ้งเตือนเมื่อโดนเพื่อนขโมยทอง */}
      {toastAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{toastAlert}</span>
        </div>
      )}

      {/* Top HUD: ข้อมูลผู้เล่น อันดับ และทองคำสะสม */}
      <header className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl shrink-0">
              {avatar}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-white truncate">
                {studentName}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                PIN: <span className="font-mono text-indigo-300">{pin || '------'}</span>
              </div>
            </div>
          </div>

          {/* ป้ายทองคำสะสม */}
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-3.5 py-1.5 rounded-2xl">
            <Coins className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-lg font-mono font-black text-amber-300">
              {gold.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-400">G</span>
          </div>
        </div>

        {/* แถบสถิติย่อย */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>อันดับ:</span>
            <span className="font-black text-white">#{myRank}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>คอมโบ:</span>
            <span className="font-black text-orange-400">x{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 justify-end">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ถูก:</span>
            <span className="font-black text-emerald-400">{correctCount}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: สลับตาม Phase ของเกม */}
      <main className="my-auto py-4">
        {/* PHASE 1: หน้าจอแสดงคำถาม 4 ตัวเลือก */}
        {phase === 'QUESTION' && currentQuestion && (
          <div className="space-y-4">
            <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-0.5 rounded-full">
                  {currentQuestion.category || 'คำถามชิงทอง'}
                </span>
                <span className="text-slate-400 font-semibold">
                  ข้อที่ {currentQIndex + 1}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed py-2">
                {currentQuestion.prompt}
              </h2>
            </div>

            {/* ปุ่มตัวเลือก 4 ข้อขนาดใหญ่สำหรับนิ้วแตะบนมือถือ */}
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((option, idx) => {
                const colors = [
                  'from-indigo-600/90 to-indigo-700 border-indigo-400/50',
                  'from-emerald-600/90 to-emerald-700 border-emerald-400/50',
                  'from-amber-600/90 to-amber-700 border-amber-400/50',
                  'from-rose-600/90 to-rose-700 border-rose-400/50',
                ];
                const badges = ['A', 'B', 'C', 'D'];
                const isSelected = selectedOption === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`w-full flex items-center gap-3.5 bg-gradient-to-r ${
                      colors[idx % 4]
                    } border-2 p-4 rounded-2xl text-left font-bold text-white shadow-lg transition active:scale-[0.98] cursor-pointer ${
                      isSelected ? 'ring-4 ring-white/50 scale-[1.01]' : ''
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-slate-950/40 flex items-center justify-center font-black text-sm shrink-0">
                      {badges[idx]}
                    </span>
                    <span className="text-sm sm:text-base leading-snug">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 2: ตอบผิด -> แสดงเฉลยก่อนไปข้อต่อไป */}
        {phase === 'WRONG_FEEDBACK' && currentQuestion && (
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-rose-300">
                พลาดไปแล้ว! ไม่ได้เปิดหีบทองคำ
              </h2>
              <p className="text-xs text-slate-400">
                คำตอบที่ถูกต้องคือ:
              </p>
            </div>
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 font-black text-base">
              {currentQuestion.options[currentQuestion.correctIndex]}
            </div>
            <button
              onClick={handleNextQuestion}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 px-6 rounded-2xl text-sm transition cursor-pointer"
            >
              <span>ลุยข้อต่อไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PHASE 3: ตอบถูก -> เลือกเปิดหีบทองคำปริศนา 1 ใน 3 ใบ */}
        {phase === 'CHEST_SELECT' && (
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 text-center space-y-5 shadow-2xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ตอบถูกต้อง!</span>
              </div>
              <h2 className="text-xl font-black text-amber-400">
                เลือกเปิดหีบสมบัติ 1 ใบ!
              </h2>
              <p className="text-xs text-slate-400">
                แตะที่หีบทองคำเพื่อลุ้นรับเหรียญทอง คูณสอง หรือขโมยทองเพื่อน
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-2">
              {chests.map((chest, idx) => {
                const isPicked = pickedChestIndex === idx;
                const isRevealed = pickedChestIndex !== null;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isRevealed || isSubmitting}
                    onClick={() => handlePickChest(idx)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition min-h-[135px] cursor-pointer ${
                      isPicked
                        ? 'bg-amber-500/25 border-amber-400 scale-105 shadow-xl shadow-amber-500/20'
                        : isRevealed
                        ? 'bg-slate-950/60 border-slate-800 opacity-50'
                        : 'bg-gradient-to-b from-slate-800 to-slate-950 border-amber-500/40 hover:border-amber-400 active:scale-95'
                    }`}
                  >
                    {!isRevealed ? (
                      <>
                        <Gift className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
                        <span className="text-xs font-black text-white">
                          หีบที่ {idx + 1}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl mb-1">{chest.emoji}</span>
                        <span className="text-xs font-black text-amber-300 leading-tight">
                          {chest.label}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเปิดหีบสมบัติ...</span>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4: เลือกเป้าหมายเมื่อเปิดได้หีบ STEAL หรือ SWAP */}
        {phase === 'TARGET_SELECT' && activeReward && (
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="text-4xl">{activeReward.emoji}</div>
              <h2 className="text-xl font-black text-white">
                {activeReward.type === 'STEAL'
                  ? 'เลือกเพื่อนที่จะขโมยทองคำ 50 G!'
                  : 'เลือกเพื่อนที่จะสลับกระเป๋าทองคำ!'}
              </h2>
              <p className="text-xs text-slate-400">
                แตะที่รายชื่อเพื่อนด้านล่างเพื่อใช้เอฟเฟกต์หีบทันที
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {otherStudents
                .sort((a, b) => b.gold - a.gold)
                .map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleExecuteStealOrSwap(target)}
                    className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 p-3.5 rounded-2xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{target.avatar || '⚔️'}</span>
                      <span className="text-sm font-bold text-white">
                        {target.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-xl">
                        {target.gold} G
                      </span>
                      {activeReward.type === 'STEAL' ? (
                        <Swords className="w-4 h-4 text-rose-400" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* PHASE 5: สรุปผลหีบทองคำก่อนไปข้อต่อไป */}
        {phase === 'CHEST_RESULT' && activeReward && (
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-5xl">
              {activeReward.emoji}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                {activeReward.label}
              </span>
              <h2 className="text-lg font-black text-white">{resultMessage}</h2>
              <p className="text-xs text-slate-400">
                ยอดทองคำสะสมของคุณตอนนี้คือ{' '}
                <span className="text-amber-300 font-bold">{gold} G</span>
              </p>
            </div>
            <button
              onClick={handleNextQuestion}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>ลุยคำถามข้อต่อไป!</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Footer: แสดงผู้นำอันดับ 1 ของห้องแบบย่อ */}
      <footer className="bg-slate-900/70 border border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>ผู้นำตอนนี้:</span>
          <span className="font-bold text-slate-200 truncate">
            {sortedLeaderboard[0]
              ? `${sortedLeaderboard[0].avatar} ${sortedLeaderboard[0].name} (${sortedLeaderboard[0].gold} G)`
              : `${avatar} ${studentName} (${gold} G)`}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0 ml-2">
          ผู้เล่น {Math.max(1, classmates.length)} คน
        </span>
      </footer>
    </div>
  );
}

export default function GoldQuestPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span>กำลังเข้าสู่สนามสอบ Gold Quest...</span>
        </div>
      }
    >
      <GoldQuestPlayContent />
    </Suspense>
  );
}
