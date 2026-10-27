// src/components/live-classroom/LuckyTicketDrawModal.tsx
// วงล้อจับรางวัลท้ายคาบด้วยตั๋วสุ่ม (🎟️) ถ่วงน้ำหนักความกว้างของช่องตามจำนวนตั๋วจริง
// รองรับการเลือก/สุ่มของรางวัลก่อนหมุนคน (Pre-determined Prize) พร้อมระบบเรทขั้นบันได (Stepped Rates)
// กฎการหักตั๋ว: ได้ตั๋วกาชาหรือเหรียญจะหัก 1 ตั๋วสุ่ม / ได้ตั๋วสุ่มจะเป็นการคืนตั๋ว (-1 +1 ตั๋วเดิมอยู่ครบ)
// พร้อมระบบเพดานตั๋วกาชาผูกกับคาบเรียนรายวิชาประจำสัปดาห์ (โควตา 5 ใบ/คาบ x คาบต่อสัปดาห์)

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import TicketRegular from '@mingcute/react/core-regular/ticket';
import Coin2Regular from '@mingcute/react/core-regular/coin-2';
import TrophyRegular from '@mingcute/react/core-regular/trophy';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import CloseRegular from '@mingcute/react/core-regular/close';
import CheckCircleRegular from '@mingcute/react/core-regular/check-circle';
import Refresh1Regular from '@mingcute/react/core-regular/refresh-1';
import { Users, Dices, Gift, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import {
  liveClassroomService,
  WEEKLY_GACHA_TICKETS_UPDATED_EVENT,
} from '../../services/liveClassroomService';
import {
  buildWeightedWheelSegments,
  pickWeightedWheelWinner,
  buildPrizeWheelSegments,
  pickPrizeWheelWinner,
} from '../../utils/liveClassroomAlgorithms';

export interface PrizeTier {
  id: string;
  name: string;
  rewardType: 'coin' | 'ticket' | 'ticket_draw' | 'combo';
  coins: number;
  tickets: number;
  weight: number; // โอกาสออกเป็นเปอร์เซ็นต์ในพูล (เช่น 35, 25, 18, 10, 7, 4, 1)
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  convertedDueToCap?: boolean;
}

export interface PrizePoolPreset {
  id: string;
  title: string;
  description: string;
  tiers: PrizeTier[];
}

export const PRIZE_POOLS: PrizePoolPreset[] = [
  {
    id: 'standard',
    title: '🏆 สุ่มรวมขั้นบันได (Unified Ladder)',
    description: 'รางวัลกระจายตามน้ำหนัก 10-100 เหรียญ, ตั๋วสุ่ม (+1 คืนตั๋ว), และตั๋วกาชาหายากที่สุด',
    tiers: [
      {
        id: 'std-coin-10',
        name: 'รางวัลทั่วไป 10 เหรียญ',
        rewardType: 'coin',
        coins: 10,
        tickets: 0,
        weight: 35,
        badgeLabel: 'Common (35%)',
        badgeBg: 'bg-slate-700/80',
        badgeText: 'text-slate-200',
        description: 'เหรียญสะสม +10 🪙 (หัก 1 ตั๋วสุ่ม)',
      },
      {
        id: 'std-coin-20',
        name: 'รางวัลพิเศษ 20 เหรียญ',
        rewardType: 'coin',
        coins: 20,
        tickets: 0,
        weight: 25,
        badgeLabel: 'Uncommon (25%)',
        badgeBg: 'bg-emerald-900/60',
        badgeText: 'text-emerald-300',
        description: 'เหรียญสะสม +20 🪙 (หัก 1 ตั๋วสุ่ม)',
      },
      {
        id: 'std-coin-50',
        name: 'รางวัลระดับสูง 50 เหรียญ',
        rewardType: 'coin',
        coins: 50,
        tickets: 0,
        weight: 18,
        badgeLabel: 'Rare (18%)',
        badgeBg: 'bg-blue-900/60',
        badgeText: 'text-blue-300',
        description: 'เหรียญสะสม +50 🪙 (หัก 1 ตั๋วสุ่ม)',
      },
      {
        id: 'std-ticket-draw',
        name: 'ตั๋วสุ่มเพิ่ม (+1 ตั๋วสุ่ม)',
        rewardType: 'ticket_draw',
        coins: 0,
        tickets: 1,
        weight: 10,
        badgeLabel: 'คืนตั๋ว (10%)',
        badgeBg: 'bg-teal-900/70 border border-teal-500/40',
        badgeText: 'text-teal-300',
        description: '🎟️ ได้รับตั๋วสุ่มคืน (-1 +1 ตั๋วสุ่มเท่าเดิม ไม่หักตั๋วสะสม)',
      },
      {
        id: 'std-coin-100',
        name: 'รางวัลใหญ่แจ็กพอต 100 เหรียญ!',
        rewardType: 'coin',
        coins: 100,
        tickets: 0,
        weight: 7,
        badgeLabel: 'Jackpot (7%)',
        badgeBg: 'bg-amber-900/70 border border-amber-500/40',
        badgeText: 'text-amber-300',
        description: 'ขุมทรัพย์ก้อนโต +100 🪙 (หัก 1 ตั๋วสุ่ม)',
      },
      {
        id: 'std-ticket-1',
        name: 'ตั๋วกาชา 1 ใบ (Super Rare)',
        rewardType: 'ticket',
        coins: 0,
        tickets: 1,
        weight: 4,
        badgeLabel: 'Super Rare (4%)',
        badgeBg: 'bg-pink-900/70 border border-pink-500/40',
        badgeText: 'text-pink-300',
        description: '🎫 ตั๋วกาชาสำหรับสุ่มบัดดี้ +1 ใบ (หัก 1 ตั๋วสุ่ม)',
      },
      {
        id: 'std-combo-mythic',
        name: 'มหาโชค: 100 เหรียญ + 1 ตั๋วกาชา!',
        rewardType: 'combo',
        coins: 100,
        tickets: 1,
        weight: 1,
        badgeLabel: 'Mythic (1%)',
        badgeBg: 'bg-purple-900/70 border border-purple-500/40 animate-pulse',
        badgeText: 'text-purple-300',
        description: '👑 แจ็กพอตคู่หู +100🪙 & 🎫 1 ตั๋วกาชา (หัก 1 ตั๋วสุ่ม)',
      },
    ],
  },
  {
    id: 'coin_rush',
    title: '🪙 ล่าขุมทรัพย์เหรียญทอง (Coin Rush)',
    description: 'เน้นสะสมเหรียญไปช้อปปิ้งไอเทมและขนมในร้านค้า',
    tiers: [
      {
        id: 'cr-15',
        name: 'เหรียญทอง 15 เหรียญ',
        rewardType: 'coin',
        coins: 15,
        tickets: 0,
        weight: 40,
        badgeLabel: 'Common (40%)',
        badgeBg: 'bg-slate-700/80',
        badgeText: 'text-slate-200',
        description: 'เหรียญสะสม +15 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'cr-30',
        name: 'เหรียญทอง 30 เหรียญ',
        rewardType: 'coin',
        coins: 30,
        tickets: 0,
        weight: 35,
        badgeLabel: 'Uncommon (35%)',
        badgeBg: 'bg-emerald-900/60',
        badgeText: 'text-emerald-300',
        description: 'เหรียญสะสม +30 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'cr-60',
        name: 'เหรียญทอง 60 เหรียญ',
        rewardType: 'coin',
        coins: 60,
        tickets: 0,
        weight: 18,
        badgeLabel: 'Rare (18%)',
        badgeBg: 'bg-blue-900/60',
        badgeText: 'text-blue-300',
        description: 'เหรียญสะสม +60 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'cr-120',
        name: 'แจ็กพอตทองคำ 120 เหรียญ!',
        rewardType: 'coin',
        coins: 120,
        tickets: 0,
        weight: 7,
        badgeLabel: 'Jackpot (7%)',
        badgeBg: 'bg-amber-900/70 border border-amber-500/40',
        badgeText: 'text-amber-300',
        description: 'ทองคำก้อนโต +120 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
    ],
  },
  {
    id: 'gacha_mania',
    title: '🎟️ กาชามาเนีย (Gacha Mania)',
    description: 'เน้นโอกาสลุ้นตั๋วสุ่มกาชาไปสุ่มหาบัดดี้คู่หู',
    tiers: [
      {
        id: 'gm-20',
        name: 'เหรียญทอง 20 เหรียญ',
        rewardType: 'coin',
        coins: 20,
        tickets: 0,
        weight: 45,
        badgeLabel: 'Common (45%)',
        badgeBg: 'bg-slate-700/80',
        badgeText: 'text-slate-200',
        description: 'เหรียญสะสม +20 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'gm-50',
        name: 'เหรียญทอง 50 เหรียญ',
        rewardType: 'coin',
        coins: 50,
        tickets: 0,
        weight: 30,
        badgeLabel: 'Rare (30%)',
        badgeBg: 'bg-blue-900/60',
        badgeText: 'text-blue-300',
        description: 'เหรียญสะสม +50 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'gm-ticket-1',
        name: 'ตั๋วสุ่มกาชา 1 ใบ',
        rewardType: 'ticket',
        coins: 0,
        tickets: 1,
        weight: 18,
        badgeLabel: 'Special (18%)',
        badgeBg: 'bg-pink-900/70 border border-pink-500/40',
        badgeText: 'text-pink-300',
        description: '🎟️ ตั๋วสุ่มกาชา +1 ใบ (หัก 1 ตั๋ว และคืน +1 ตั๋ว = รอบนี้ +1 และไม่หักตั๋วเดิม)',
      },
      {
        id: 'gm-combo',
        name: 'คอมโบทองคำ + ตั๋ว 2 ใบ!',
        rewardType: 'combo',
        coins: 50,
        tickets: 2,
        weight: 7,
        badgeLabel: 'Jackpot (7%)',
        badgeBg: 'bg-purple-900/70 border border-purple-500/40',
        badgeText: 'text-purple-300',
        description: '🎉 +50🪙 และ +2🎟️ (หัก 1 ตั๋วชิงโชค = ได้กำไรสุทธิ +1 ตั๋ว และ +50 เหรียญ)',
      },
    ],
  },
  {
    id: 'high_stakes',
    title: '🔥 รางวัลใหญ่จัดเต็ม (High Stakes)',
    description: 'รางวัลมูลค่าสูงพิเศษสำหรับรอบปิดคาบเรียนสำคัญ',
    tiers: [
      {
        id: 'hs-30',
        name: 'เหรียญทอง 30 เหรียญ',
        rewardType: 'coin',
        coins: 30,
        tickets: 0,
        weight: 50,
        badgeLabel: 'Tier 1 (50%)',
        badgeBg: 'bg-slate-700/80',
        badgeText: 'text-slate-200',
        description: 'เหรียญสะสม +30 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'hs-70',
        name: 'เหรียญทอง 70 เหรียญ',
        rewardType: 'coin',
        coins: 70,
        tickets: 0,
        weight: 30,
        badgeLabel: 'Tier 2 (30%)',
        badgeBg: 'bg-blue-900/60',
        badgeText: 'text-blue-300',
        description: 'เหรียญสะสม +70 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'hs-100',
        name: 'เหรียญทอง 100 เหรียญ',
        rewardType: 'coin',
        coins: 100,
        tickets: 0,
        weight: 15,
        badgeLabel: 'Tier 3 (15%)',
        badgeBg: 'bg-amber-900/70 border border-amber-500/40',
        badgeText: 'text-amber-300',
        description: 'เหรียญสะสม +100 🪙 (หัก 1 ตั๋วชิงโชค)',
      },
      {
        id: 'hs-jackpot',
        name: 'มหาโชค: ตั๋วสุ่มกาชา + 100 เหรียญ!',
        rewardType: 'combo',
        coins: 100,
        tickets: 1,
        weight: 5,
        badgeLabel: 'Super Jackpot (5%)',
        badgeBg: 'bg-rose-900/70 border border-rose-500/40 animate-pulse',
        badgeText: 'text-rose-300',
        description: '👑 +100🪙 & 🎟️ 1 ตั๋ว (ไม่หักตั๋วเดิม และได้รับ +100 เหรียญ)',
      },
    ],
  },
];

export interface LuckyTicketDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: LiveStudent[];
  initialStudentId?: string | null;
  classroomId?: string;
  classroomName?: string;
  subjectName?: string;
  onGiveReward: (
    studentIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onConsumeTicket?: (studentId: string) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
}

// ฟังก์ชันคำนวณพิกัด SVG Arc สำหรับวาดช่องวงล้อตามสัดส่วนองศา
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

export function createSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

export const describeArcSlice = createSlicePath;

export const LuckyTicketDrawModal: React.FC<LuckyTicketDrawModalProps> = ({
  isOpen,
  onClose,
  students,
  initialStudentId,
  classroomId,
  classroomName,
  subjectName,
  onGiveReward,
  onConsumeTicket,
  onPlaySound,
}) => {
  const [drawMode, setDrawMode] = useState<'individual' | 'class'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [ticketSource, setTicketSource] = useState<'session' | 'total'>('session');
  const [spinDurationSec, setSpinDurationSec] = useState<number>(4.5);
  const [excludeWinners, setExcludeWinners] = useState<boolean>(true);
  const [pastWinnerIds, setPastWinnerIds] = useState<string[]>([]);

  // อัปเดต selectedStudentId เมื่อ initialStudentId ส่งเข้ามา
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setDrawMode('individual');
    }
  }, [initialStudentId, isOpen]);

  // ระบบติดตามเพดานโควตาสูงสุดของตั๋วกาชาประจำสัปดาห์ (ผูกกับคาบเรียน: 5 ใบ/คาบ x คาบต่อสัปดาห์)
  const [weeklyGachaGiven, setWeeklyGachaGiven] = useState<number>(0);

  const weeklyCapInfo = useMemo(() => {
    return liveClassroomService.getWeeklyGachaTicketCap(
      subjectName || 'general',
      classroomName
    );
  }, [subjectName, classroomName]);

  const isWeeklyGachaCapped = useMemo(() => {
    return weeklyGachaGiven >= weeklyCapInfo.weeklyCap;
  }, [weeklyGachaGiven, weeklyCapInfo.weeklyCap]);

  // ซิงค์ยอดตั๋วกาชาประจำสัปดาห์
  const syncWeeklyGachaTickets = useCallback(() => {
    if (!classroomId) return;
    const count = liveClassroomService.getWeeklyGachaTicketsGiven(
      classroomId,
      subjectName || 'general'
    );
    setWeeklyGachaGiven(count);
  }, [classroomId, subjectName]);

  useEffect(() => {
    syncWeeklyGachaTickets();
    const handleSync = () => syncWeeklyGachaTickets();
    window.addEventListener(WEEKLY_GACHA_TICKETS_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(WEEKLY_GACHA_TICKETS_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [syncWeeklyGachaTickets]);

  // ระบบของรางวัลและเรทขั้นบันได
  const [selectedPoolId, setSelectedPoolId] = useState<string>('standard');
  const currentPool = useMemo(() => {
    return PRIZE_POOLS.find((p) => p.id === selectedPoolId) || PRIZE_POOLS[0];
  }, [selectedPoolId]);

  const [activePrize, setActivePrize] = useState<PrizeTier>(() => PRIZE_POOLS[0].tiers[0]);
  const [isRollingPrize, setIsRollingPrize] = useState<boolean>(false);

  // อัปเดต activePrize เมื่อเปลี่ยนพูล
  useEffect(() => {
    setActivePrize(currentPool.tiers[0]);
  }, [currentPool]);

  // วงล้อหมุน
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<LiveStudent | null>(null);
  const [prizeClaimed, setPrizeClaimed] = useState<boolean>(false);

  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prizeRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelActiveSpin = useCallback(() => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
    if (prizeRollTimerRef.current) {
      clearTimeout(prizeRollTimerRef.current);
      prizeRollTimerRef.current = null;
    }
    tickTimersRef.current.forEach(clearTimeout);
    tickTimersRef.current = [];
    setIsSpinning(false);
    setIsRollingPrize(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cancelActiveSpin();
    }
    return () => {
      cancelActiveSpin();
    };
  }, [isOpen, cancelActiveSpin]);

  // นักเรียนเป้าหมายที่เลือกสำหรับโหมดหมุนตั๋วรายคน
  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    // Fallback: หาคนแรกที่มีตั๋วในห้อง
    const withTickets = students.find(
      (s) => s.present && (ticketSource === 'session' ? s.sessionTickets : s.totalTickets) > 0
    );
    if (withTickets) return withTickets;
    return students.find((s) => s.present) || students[0] || null;
  }, [students, selectedStudentId, ticketSource]);

  const selectedStudentTickets = useMemo(() => {
    if (!selectedStudent) return 0;
    return ticketSource === 'session'
      ? selectedStudent.sessionTickets
      : selectedStudent.totalTickets;
  }, [selectedStudent, ticketSource]);

  // รายการรางวัลที่ปรับตามโควตาเพดานกาชารายสัปดาห์
  const effectiveTiers: PrizeTier[] = useMemo(() => {
    return currentPool.tiers.map((t) => {
      if (isWeeklyGachaCapped && t.tickets > 0 && t.rewardType !== 'ticket_draw') {
        return {
          ...t,
          convertedDueToCap: true,
          name: `${t.name} (โควตาสัปดาห์เต็ม ➔ แปลงเป็น 100 เหรียญ)`,
          rewardType: 'coin',
          coins: 100,
          tickets: 0,
          description: `🪙 รางวัลใหญ่ 100 เหรียญแทน (โควตาสัปดาห์นี้เต็ม ${weeklyGachaGiven}/${weeklyCapInfo.weeklyCap} ใบ)`,
        };
      }
      return t;
    });
  }, [currentPool, isWeeklyGachaCapped, weeklyGachaGiven, weeklyCapInfo.weeklyCap]);

  // วงล้อของรางวัลสำหรับโหมดเดี่ยว
  const prizeSegments = useMemo(() => {
    return buildPrizeWheelSegments(effectiveTiers);
  }, [effectiveTiers]);

  // วงล้อรายชื่อนักเรียนสำหรับโหมดจับฉลากรวมทั้งห้อง
  const segments = useMemo(() => {
    return buildWeightedWheelSegments(
      students,
      ticketSource,
      excludeWinners ? pastWinnerIds : []
    );
  }, [students, ticketSource, excludeWinners, pastWinnerIds]);

  const totalTicketsInPool = useMemo(() => {
    return segments.reduce((sum, s) => sum + s.tickets, 0);
  }, [segments]);

  // ฟังก์ชันสุ่มของรางวัลก่อนหมุนคน (Roll Prize First) ตามน้ำหนักเรทขั้นบันได
  const handleRollPrize = useCallback(() => {
    if (isSpinning || isRollingPrize) return;

    setIsRollingPrize(true);
    onPlaySound?.('tick', 600);

    const totalWeight = effectiveTiers.reduce((sum, t) => sum + t.weight, 0);
    const rand = Math.random() * totalWeight;
    let accumulated = 0;
    let chosen = effectiveTiers[0];

    for (const tier of effectiveTiers) {
      accumulated += tier.weight;
      if (rand <= accumulated) {
        chosen = tier;
        break;
      }
    }

    // แอนิเมชันสลับรางวัลจำลองการสุ่ม 1.2 วินาที
    let cycleCount = 0;
    const maxCycles = 12;
    const interval = setInterval(() => {
      cycleCount++;
      const tempIndex = cycleCount % effectiveTiers.length;
      setActivePrize(effectiveTiers[tempIndex]);
      onPlaySound?.('tick', 500 + cycleCount * 25);

      if (cycleCount >= maxCycles) {
        clearInterval(interval);
        setActivePrize(chosen);
        setIsRollingPrize(false);
        onPlaySound?.('coin');
      }
    }, 90);
  }, [
    isSpinning,
    isRollingPrize,
    effectiveTiers,
    onPlaySound,
  ]);

  // ฟังก์ชันหมุนวงล้อชิงรางวัลรายคน (หมุนตั๋วที่นักเรียนถือ)
  const handleSpinIndividual = useCallback(() => {
    if (
      isSpinning ||
      prizeSegments.length === 0 ||
      !selectedStudent ||
      selectedStudentTickets <= 0
    ) {
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    setPrizeClaimed(false);

    const spinResult = pickPrizeWheelWinner(prizeSegments, rotation, 6);
    if (!spinResult) {
      setIsSpinning(false);
      return;
    }

    setRotation(spinResult.nextRotationDeg);

    tickTimersRef.current.forEach(clearTimeout);
    tickTimersRef.current = [];
    const totalTicks = Math.round(spinDurationSec * 6.5);
    const spinDurationMs = spinDurationSec * 1000;

    for (let i = 1; i <= totalTicks; i++) {
      const progress = i / totalTicks;
      const timeOffset = Math.pow(progress, 2.2) * spinDurationMs * 0.96;
      const timer = setTimeout(() => {
        onPlaySound?.('tick', 500 + i * 12);
      }, timeOffset);
      tickTimersRef.current.push(timer);
    }

    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setActivePrize(spinResult.winnerSegment.tier);
      setWinner(selectedStudent);
      onPlaySound?.('fanfare');
    }, spinDurationMs);
  }, [
    isSpinning,
    prizeSegments,
    selectedStudent,
    selectedStudentTickets,
    rotation,
    spinDurationSec,
    onPlaySound,
  ]);

  // ฟังก์ชันหมุนวงล้อหานักเรียนผู้โชคดี (โหมดจับฉลากรวมทั้งห้อง)
  const handleSpinWheel = useCallback(() => {
    if (isSpinning || segments.length === 0 || isRollingPrize) return;

    setIsSpinning(true);
    setWinner(null);
    setPrizeClaimed(false);

    const spinResult = pickWeightedWheelWinner(segments, rotation, 6);
    if (!spinResult) {
      setIsSpinning(false);
      return;
    }

    setRotation(spinResult.nextRotationDeg);

    // เสียงติ๊กจำลองเข็มดีดผ่านหมุดวงล้อ ค่อยๆ ชะลอความเร็วตาม Cubic Bezier
    tickTimersRef.current.forEach(clearTimeout);
    tickTimersRef.current = [];
    const totalTicks = Math.round(spinDurationSec * 6.5);
    const spinDurationMs = spinDurationSec * 1000;

    for (let i = 1; i <= totalTicks; i++) {
      const progress = i / totalTicks;
      const timeOffset = Math.pow(progress, 2.2) * spinDurationMs * 0.96;
      const timer = setTimeout(() => {
        onPlaySound?.('tick', 500 + i * 12);
      }, timeOffset);
      tickTimersRef.current.push(timer);
    }

    // แสดงผลผู้ชนะเมื่อวงล้อหยุดหมุน
    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setWinner(spinResult.winnerSegment.student);
      onPlaySound?.('fanfare');
    }, spinDurationMs);
  }, [isSpinning, segments, rotation, spinDurationSec, isRollingPrize, onPlaySound]);

  // ฟังก์ชันมอบรางวัลและจัดการตั๋วสุ่ม
  const handleConfirmAward = () => {
    if (!winner || prizeClaimed) return;

    if (activePrize.rewardType === 'coin') {
      // 1. รางวัลเป็นเหรียญ: หัก 1 ตั๋วสุ่ม และมอบเหรียญรางวัล
      onConsumeTicket?.(winner.id);
      onGiveReward(
        [winner.id],
        'coin',
        activePrize.coins,
        `🎉 รางวัลใหญ่ท้ายคาบ +${activePrize.coins} เหรียญ (${winner.name}) [หัก 1 ตั๋วสุ่ม]`
      );
    } else if (activePrize.rewardType === 'ticket_draw') {
      // 2. รางวัลเป็นตั๋วสุ่ม (Lucky Draw Ticket): คืนตั๋วสุ่ม (-1 +1 ตั๋วสุ่มเท่าเดิม)
      // ไม่ต้องหักตั๋วสุ่ม (ตั๋วสะสมเดิมอยู่ครบถ้วน)
      onPlaySound?.('fanfare');
    } else if (activePrize.rewardType === 'ticket') {
      // 3. รางวัลเป็นตั๋วกาชา (Gacha Ticket): หัก 1 ตั๋วสุ่ม และมอบตั๋วกาชา +1 ใบ
      onConsumeTicket?.(winner.id);

      if (isWeeklyGachaCapped) {
        // หากโควตารายวิชาเต็มแล้ว ให้แปลงเป็น 100 เหรียญแจ็กพอตแทน
        onGiveReward(
          [winner.id],
          'coin',
          100,
          `🎉 แจ็กพอต 100 เหรียญแทนตั๋วกาชา (โควตาสัปดาห์เต็ม) (${winner.name}) [หัก 1 ตั๋วสุ่ม]`
        );
      } else {
        onGiveReward(
          [winner.id],
          'ticket',
          activePrize.tickets,
          `🎫 รางวัลใหญ่ท้ายคาบ ตั๋วกาชาบัดดี้ +${activePrize.tickets} ใบ (${winner.name}) [หัก 1 ตั๋วสุ่ม]`
        );
        if (classroomId) {
          liveClassroomService.recordWeeklyGachaTicketsGiven(
            classroomId,
            subjectName || 'general',
            activePrize.tickets
          );
          setWeeklyGachaGiven((prev) => prev + activePrize.tickets);
        }
      }
    } else if (activePrize.rewardType === 'combo') {
      // 4. รางวัลคอมโบ (เหรียญ + ตั๋วกาชา): หัก 1 ตั๋วสุ่ม, มอบเหรียญ และมอบตั๋วกาชา
      onConsumeTicket?.(winner.id);

      if (activePrize.coins > 0) {
        onGiveReward(
          [winner.id],
          'coin',
          activePrize.coins,
          `🎉 รางวัลแชมป์ท้ายคาบ +${activePrize.coins} เหรียญ (${winner.name}) [หัก 1 ตั๋วสุ่ม]`
        );
      }

      if (activePrize.tickets > 0) {
        if (isWeeklyGachaCapped) {
          onGiveReward(
            [winner.id],
            'coin',
            100,
            `🎉 โบนัส 100 เหรียญแทนตั๋วกาชา (โควตาสัปดาห์เต็ม) (${winner.name})`
          );
        } else {
          onGiveReward(
            [winner.id],
            'ticket',
            activePrize.tickets,
            `🎫 รางวัลแชมป์ท้ายคาบ ตั๋วกาชาบัดดี้ +${activePrize.tickets} ใบ (${winner.name})`
          );
          if (classroomId) {
            liveClassroomService.recordWeeklyGachaTicketsGiven(
              classroomId,
              subjectName || 'general',
              activePrize.tickets
            );
            setWeeklyGachaGiven((prev) => prev + activePrize.tickets);
          }
        }
      }
    }

    if (excludeWinners) {
      setPastWinnerIds((prev) => (prev.includes(winner.id) ? prev : [...prev, winner.id]));
    }

    setPrizeClaimed(true);
  };

  const handleClose = () => {
    cancelActiveSpin();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 md:p-8 shadow-2xl relative my-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-sm">
              <TicketRegular className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>{drawMode === 'individual' ? 'วงล้อหมุนตั๋วรางวัล (รายคน)' : 'วงล้อจับรางวัลตั๋วสุ่ม (ทั้งห้อง)'}</span>
                <span className="text-xs font-bold bg-pink-500/20 border border-pink-500/40 text-pink-300 px-3 py-1 rounded-full">
                  {drawMode === 'individual'
                    ? selectedStudent
                      ? `ตั๋วของ ${selectedStudent.name}: ${selectedStudentTickets} 🎟️`
                      : 'เลือกนักเรียนเพื่อหมุน'
                    : `รวม ${totalTicketsInPool} 🎟️ ในกองสุ่ม`}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {drawMode === 'individual'
                  ? 'หมุนของรางวัลให้นักเรียนที่ได้รับตั๋วสุ่ม • หัก 1 ตั๋วเมื่อได้รับรางวัล (หากได้ตั๋วสุ่มคืนจะไม่หักตั๋ว)'
                  : 'จับฉลากผู้โชคดีท้ายคาบจากตั๋วสะสมทุกคนในห้อง • สุ่มหรือเลือกของรางวัลก่อนหมุนคน'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Draw Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  if (isSpinning) return;
                  setDrawMode('individual');
                  setWinner(null);
                  setPrizeClaimed(false);
                }}
                disabled={isSpinning}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  drawMode === 'individual'
                    ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>หมุนตั๋วรายคน</span>
              </button>
              <button
                onClick={() => {
                  if (isSpinning) return;
                  setDrawMode('class');
                  setWinner(null);
                  setPrizeClaimed(false);
                }}
                disabled={isSpinning}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  drawMode === 'class'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrophyRegular className="w-3.5 h-3.5" />
                <span>จับฉลากทั้งห้อง</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <CloseRegular className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode-Specific Settings & Bar */}
        {drawMode === 'individual' ? (
          /* Individual Student Selector Bar */
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 mt-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-slate-300 font-bold">นักเรียนที่ใช้ตั๋วหมุน:</span>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setWinner(null);
                    setPrizeClaimed(false);
                  }}
                  disabled={isSpinning}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-bold text-white text-xs max-w-[260px] truncate"
                >
                  {students
                    .filter((s) => s.present)
                    .map((st) => {
                      const tCount =
                        ticketSource === 'session' ? st.sessionTickets : st.totalTickets;
                      return (
                        <option key={st.id} value={st.id}>
                          #{st.studentCode} {st.name} ({tCount} 🎟️)
                        </option>
                      );
                    })}
                </select>
              </div>

              {selectedStudent && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl font-extrabold text-pink-300 bg-pink-500/20 border border-pink-500/40">
                    🎟️ ตั๋วคงเหลือ: {selectedStudentTickets} ใบ
                  </span>
                  {selectedStudentTickets <= 0 && (
                    <span className="text-amber-400 font-semibold">
                      (ไม่มีตั๋วสุ่มในคาบนี้ สามารถแจกเพิ่มที่หน้ากิจกรรมได้ค่ะ)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">ใช้ตั๋วจาก:</span>
              <select
                value={ticketSource}
                onChange={(e) => {
                  setTicketSource(e.target.value as 'session' | 'total');
                  setWinner(null);
                  setPrizeClaimed(false);
                }}
                disabled={isSpinning}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-semibold text-slate-100 text-xs"
              >
                <option value="session">🎟️ ตั๋วในคาบนี้ (Session)</option>
                <option value="total">🏆 ตั๋วสะสมรวมทั้งหมด (Total)</option>
              </select>
            </div>
          </div>
        ) : (
          /* All-Class Settings Bar */
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">ใช้ตั๋วจาก:</span>
                <select
                  value={ticketSource}
                  onChange={(e) => {
                    setTicketSource(e.target.value as 'session' | 'total');
                    setWinner(null);
                  }}
                  disabled={isSpinning}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-semibold text-slate-100 text-xs"
                >
                  <option value="session">🎟️ ตั๋วที่ได้ในคาบนี้ (Session Tickets)</option>
                  <option value="total">🏆 ตั๋วสะสมรวมทั้งหมด (Total Tickets)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">ความเร็ว:</span>
                <select
                  value={spinDurationSec}
                  onChange={(e) => setSpinDurationSec(Number(e.target.value))}
                  disabled={isSpinning}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-semibold text-slate-100 text-xs"
                >
                  <option value={3.0}>⚡ ด่วน (3.0 วินาที)</option>
                  <option value={4.5}>🎲 ปกติ (4.5 วินาที)</option>
                  <option value={6.0}>🎭 ลุ้นระทึก (6.0 วินาที)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeWinners}
                  onChange={(e) => setExcludeWinners(e.target.checked)}
                  disabled={isSpinning}
                  className="w-4 h-4 rounded accent-pink-500"
                />
                <span className="text-slate-300 font-medium">
                  ตัดสิทธิ์ผู้ชนะออกในรอบถัดไป ({pastWinnerIds.length} คนได้รับแล้ว)
                </span>
              </label>
            </div>

            {pastWinnerIds.length > 0 && (
              <button
                onClick={() => {
                  setPastWinnerIds([]);
                  setWinner(null);
                }}
                disabled={isSpinning}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded-xl font-semibold text-slate-300 transition"
              >
                <Refresh1Regular className="w-3.5 h-3.5" />
                <span>คืนสิทธิ์ผู้ชนะ</span>
              </button>
            )}
          </div>
        )}

        {/* Section 2: Stepped Prize Pool Ladder & Pre-Draw Prize Selector */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">รูปแบบของรางวัล (Prize Pool):</span>
              <div className="flex flex-wrap gap-1.5">
                {PRIZE_POOLS.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => {
                      setSelectedPoolId(pool.id);
                      setWinner(null);
                    }}
                    disabled={isSpinning || isRollingPrize}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedPoolId === pool.id
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pool.title.split(' ')[0]} {pool.title.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Gacha Quota Tracker Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <span className="text-pink-400 font-bold">🎫 โควตากาชาวิชานี้สัปดาห์นี้:</span>
              <span className={`font-black ${isWeeklyGachaCapped ? 'text-rose-400' : 'text-emerald-400'}`}>
                {weeklyGachaGiven} / {weeklyCapInfo.weeklyCap} ใบ
              </span>
              <span className="text-slate-500 hidden sm:inline">
                ({weeklyCapInfo.periodsPerWeek} คาบ/สัปดาห์ • เพดาน {weeklyCapInfo.ticketsPerPeriod} ใบ/คาบ)
              </span>
              {isWeeklyGachaCapped && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                  เต็มเพดาน (แปลงเป็น 100🪙)
                </span>
              )}
            </div>

            {drawMode === 'class' && (
              /* Roll Prize Button for All-Class Raffle */
              <button
                onClick={handleRollPrize}
                disabled={isSpinning || isRollingPrize}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <Dices className={`w-3.5 h-3.5 ${isRollingPrize ? 'animate-spin' : ''}`} />
                <span>{isRollingPrize ? 'กำลังสุ่มของรางวัล...' : '🎲 สุ่มของรางวัลรอบนี้'}</span>
              </button>
            )}
          </div>

          {/* Stepped Rate Ladder Tiers List */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {effectiveTiers.map((tier) => {
              const isSelected = activePrize.id === tier.id;
              const isCappedGacha = isWeeklyGachaCapped && tier.tickets > 0 && tier.rewardType !== 'ticket_draw';

              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    if (drawMode === 'class') {
                      setActivePrize(tier);
                      onPlaySound?.('tick', 700);
                    }
                  }}
                  disabled={isSpinning || isRollingPrize}
                  className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    isSelected && drawMode === 'class'
                      ? 'bg-amber-400/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isCappedGacha ? 'bg-rose-950 border border-rose-500/40 text-rose-300' : `${tier.badgeBg} ${tier.badgeText}`
                      }`}
                    >
                      {isCappedGacha ? 'เต็มเพดาน ➔ 100🪙' : tier.badgeLabel}
                    </span>
                    {isSelected && drawMode === 'class' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm animate-ping" />
                    )}
                  </div>
                  <div className="text-xs font-black text-slate-100 flex items-center gap-1 mt-0.5">
                    {tier.rewardType === 'ticket' ? (
                      <TicketRegular className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    ) : tier.rewardType === 'ticket_draw' ? (
                      <TicketRegular className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    ) : tier.rewardType === 'combo' ? (
                      <SparklesRegular className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <Coin2Regular className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">{tier.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {tier.rewardType === 'ticket_draw' && '🎟️ คืนตั๋วสุ่ม (ไม่หัก)'}
                    {tier.rewardType === 'ticket' && (isCappedGacha ? '🪙 +100 เหรียญแทน' : '+1 🎫 ตั๋วกาชา')}
                    {tier.rewardType === 'combo' && (isCappedGacha ? '+200 🪙 แจ็กพอต' : '+100🪙 +1🎫')}
                    {tier.rewardType === 'coin' && `+${tier.coins} 🪙 เหรียญ`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Round Prize Banner (For Class Mode) */}
          {drawMode === 'class' && (
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-pink-500/10 to-indigo-500/20 border border-amber-400/50 px-4 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
                  🎁
                </div>
                <div>
                  <span className="text-[11px] text-amber-300 font-semibold block">
                    ของรางวัลประจำรอบนี้ (พร้อมชิง):
                  </span>
                  <span className="text-sm font-black text-white">
                    {activePrize.name}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    ({activePrize.description})
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-400 text-slate-950">
                โอกาสออก {activePrize.weight}%
              </span>
            </div>
          )}
        </div>

        {/* Main Content Grid: Left Wheel / Right Odds Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-5 items-center">
          {/* Left: SVG Wheel */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            {(drawMode === 'individual' ? prizeSegments.length > 0 : segments.length > 0) ? (
              <>
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] flex items-center justify-center">
                  {/* Top Pointer Arrow (Strict 50% Centering) */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center drop-shadow-xl pointer-events-none">
                    <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400" />
                  </div>

                  {/* Rotating SVG Wheel */}
                  <svg
                    viewBox="0 0 300 300"
                    className="w-full h-full rounded-full border-8 border-slate-800 shadow-2xl"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning
                        ? `transform ${spinDurationSec}s cubic-bezier(0.12, 0.8, 0.18, 1)`
                        : 'none',
                    }}
                  >
                    {drawMode === 'individual' ? (
                      /* Individual Mode: Wheel segments are the PRIZES */
                      prizeSegments.map((seg) => {
                        const pathData = createSlicePath(
                          150,
                          150,
                          145,
                          seg.startAngle,
                          seg.endAngle
                        );
                        const labelPos = polarToCartesian(150, 150, 96, seg.midAngle);
                        const angleDiff = seg.endAngle - seg.startAngle;

                        return (
                          <g key={seg.tier.id}>
                            <path
                              d={pathData}
                              fill={seg.color}
                              stroke="#0f172a"
                              strokeWidth="2.5"
                            />
                            {angleDiff >= 12 && (
                              <text
                                x={labelPos.x}
                                y={labelPos.y}
                                fill="#ffffff"
                                fontSize={angleDiff >= 28 ? '10' : '8'}
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${seg.midAngle - 90}, ${labelPos.x}, ${labelPos.y})`}
                              >
                                {seg.tier.rewardType === 'combo'
                                  ? '👑 100🪙+1🎫'
                                  : seg.tier.rewardType === 'ticket'
                                  ? '🎫 1 ตั๋ว'
                                  : seg.tier.rewardType === 'ticket_draw'
                                  ? '🎟️ คืนตั๋ว'
                                  : `+${seg.tier.coins} 🪙`}
                              </text>
                            )}
                          </g>
                        );
                      })
                    ) : segments.length === 1 ? (
                      /* Class Mode Edge Case: 1 Student */
                      <g>
                        <circle cx="150" cy="150" r="145" fill={segments[0].color} />
                        <text
                          x="150"
                          y="85"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {segments[0].student.name} ({segments[0].tickets} 🎟️)
                        </text>
                      </g>
                    ) : (
                      /* Class Mode: Wheel segments are the STUDENTS */
                      segments.map((seg) => {
                        const pathData = createSlicePath(
                          150,
                          150,
                          145,
                          seg.startAngle,
                          seg.endAngle
                        );
                        const labelPos = polarToCartesian(150, 150, 92, seg.midAngle);
                        const shortName =
                          seg.student.name.length > 10
                            ? seg.student.name.slice(0, 10) + '…'
                            : seg.student.name;

                        return (
                          <g key={seg.student.id}>
                            <path
                              d={pathData}
                              fill={seg.color}
                              stroke="#0f172a"
                              strokeWidth="2"
                            />
                            {seg.endAngle - seg.startAngle >= 14 && (
                              <text
                                x={labelPos.x}
                                y={labelPos.y}
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${seg.midAngle - 90}, ${labelPos.x}, ${labelPos.y})`}
                              >
                                #{seg.student.studentCode} {shortName} ({seg.tickets}🎟️)
                              </text>
                            )}
                          </g>
                        );
                      })
                    )}
                    {/* Center Hub */}
                    <circle
                      cx="150"
                      cy="150"
                      r="24"
                      fill="#0f172a"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                    />
                    <text
                      x="150"
                      y="155"
                      fill="#fbbf24"
                      fontSize="14"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {drawMode === 'individual' ? '🎁' : '👑'}
                    </text>
                  </svg>
                </div>

                {/* Spin Action Button */}
                {drawMode === 'individual' ? (
                  <button
                    onClick={handleSpinIndividual}
                    disabled={isSpinning || !selectedStudent || selectedStudentTickets <= 0}
                    className="mt-6 flex items-center gap-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-base px-8 py-3 rounded-2xl shadow-xl shadow-pink-600/25 transition transform active:scale-95 cursor-pointer"
                  >
                    <SparklesRegular className="w-5 h-5 text-amber-300" />
                    <span>
                      {isSpinning
                        ? 'กำลังหมุนวงล้อชิงรางวัล...'
                        : selectedStudentTickets > 0
                        ? `หมุนวงล้อชิงรางวัลให้ ${selectedStudent?.name || 'นักเรียน'} (ใช้ 1 ตั๋ว)!`
                        : 'ตั๋วสุ่มไม่เพียงพอ (ต้องการ 1 🎟️)'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleSpinWheel}
                    disabled={isSpinning || isRollingPrize || segments.length === 0}
                    className="mt-6 flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 disabled:opacity-40 text-slate-950 font-extrabold text-base px-8 py-3 rounded-2xl shadow-xl shadow-amber-500/25 transition transform active:scale-95 cursor-pointer"
                  >
                    <TrophyRegular className="w-5 h-5" />
                    <span>
                      {isSpinning
                        ? 'กำลังหมุนวงล้อ...'
                        : `หมุนวงล้อชิง [${activePrize.name}]!`}
                    </span>
                  </button>
                )}
              </>
            ) : (
              <div className="py-14 px-6 text-center bg-slate-950/50 border border-slate-800 rounded-3xl w-full space-y-2">
                <TicketRegular className="w-14 h-14 mx-auto text-slate-600" />
                <h3 className="text-lg font-bold text-slate-300">
                  ยังไม่มีนักเรียนที่มีตั๋วสุ่มในกองนี้
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  แจกตั๋วสุ่ม (+1 🎟️) ให้นักเรียนที่ร่วมกิจกรรม หรือสลับตัวเลือกเป็น
                  &ldquo;ตั๋วสะสมรวมทั้งหมด&rdquo; เพื่อเริ่มหมุนวงล้อค่ะ
                </p>
              </div>
            )}
          </div>

          {/* Right: Winner Spotlight & Odds Table */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {winner && (
              <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-400 rounded-2xl p-5 text-center space-y-3 animate-fade-in shadow-xl">
                <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                  <TrophyRegular className="w-4 h-4" />
                  <span>
                    {drawMode === 'individual'
                      ? 'ผลการหมุนตั๋วรางวัล!'
                      : 'ผู้โชคดีได้รับรางวัลท้ายคาบ!'}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-amber-300 font-semibold">#{winner.studentCode}</p>
                  <h3 className="text-2xl font-black text-white mt-0.5">{winner.name}</h3>
                  <div className="mt-2 p-2 rounded-xl bg-slate-950/70 border border-amber-400/40 inline-block text-left text-xs text-amber-200">
                    <span className="font-bold text-white">🎁 ได้รับของรางวัล: </span>
                    {activePrize.name} ({activePrize.description})
                  </div>
                </div>

                {!prizeClaimed ? (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleConfirmAward}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition active:scale-95 shadow-md cursor-pointer"
                    >
                      <SparklesRegular className="w-4 h-4" />
                      <span>
                        {activePrize.rewardType === 'ticket_draw'
                          ? `คืนตั๋วสุ่มให้ ${winner.name} (-1 +1 ตั๋วเท่าเดิม)`
                          : activePrize.rewardType === 'ticket'
                          ? `มอบ 🎫 ${activePrize.name} & หัก 1 ตั๋ว (${winner.name})`
                          : activePrize.rewardType === 'combo'
                          ? `มอบ 👑 ${activePrize.name} & หัก 1 ตั๋ว (${winner.name})`
                          : `มอบ 🪙 ${activePrize.name} & หัก 1 ตั๋ว (${winner.name})`}
                      </span>
                    </button>
                    <p className="text-[11px] text-slate-400">
                      {activePrize.rewardType === 'ticket_draw'
                        ? '🎟️ สุ่มได้ตั๋วสุ่ม: คืนตั๋วเข้าชิงโชค (-1 +1 ตั๋วเดิมอยู่ครบ) ไม่มีการหักตั๋วสะสม'
                        : activePrize.rewardType === 'ticket'
                        ? '🎫 ได้รับตั๋วกาชา: หัก 1 ตั๋วสุ่มชิงโชค และมอบตั๋วกาชาบัดดี้ 1 ใบเข้ากระเป๋า'
                        : activePrize.rewardType === 'combo'
                        ? '👑 รางวัลคอมโบ: หัก 1 ตั๋วสุ่มชิงโชค มอบเหรียญและตั๋วกาชาเข้ากระเป๋า'
                        : '🪙 ระบบจะหัก 1 ตั๋วสุ่มออกจากกระเป๋า และมอบเหรียญรางวัลทันที'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <CheckCircleRegular className="w-4 h-4" />
                      <span>
                        {activePrize.rewardType === 'ticket_draw'
                          ? `คืนตั๋วสุ่มให้ ${winner.name} (-1 +1 ตั๋วเท่าเดิม) เรียบร้อย!`
                          : activePrize.rewardType === 'ticket'
                          ? `มอบ 🎫 ${activePrize.name} & หัก 1 ตั๋ว ให้ ${winner.name} เรียบร้อย!`
                          : activePrize.rewardType === 'combo'
                          ? `มอบ 👑 ${activePrize.name} & หัก 1 ตั๋ว ให้ ${winner.name} เรียบร้อย!`
                          : `มอบ +${activePrize.coins} เหรียญ & หัก 1 ตั๋ว ให้ ${winner.name} เรียบร้อย!`}
                      </span>
                    </div>

                    {drawMode === 'individual' &&
                    selectedStudentTickets - (activePrize.rewardType === 'ticket_draw' ? 0 : 1) > 0 ? (
                      <button
                        onClick={() => {
                          setWinner(null);
                          setPrizeClaimed(false);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <SparklesRegular className="w-4 h-4 text-amber-300" />
                        <span>
                          หมุนตั๋วใบถัดไป (เหลือ{' '}
                          {selectedStudentTickets -
                            (activePrize.rewardType === 'ticket_draw' ? 0 : 1)}{' '}
                          ใบ)
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setWinner(null);
                          setPrizeClaimed(false);
                        }}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{drawMode === 'individual' ? 'เสร็จสิ้น (ใช้ตั๋วครบแล้ว)' : 'เตรียมหมุนรอบถัดไป'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Right Card: Odds Table */}
            {drawMode === 'individual' ? (
              /* Individual Mode: Prize Odds Ladder */
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-72">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-400" />
                    <span>ตารางของรางวัลบนวงล้อ ({effectiveTiers.length} รายการ)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">โอกาสได้รับ (%)</span>
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1">
                  {prizeSegments.map((seg) => (
                    <div
                      key={seg.tier.id}
                      className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="font-bold text-slate-200">{seg.tier.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-400 w-12 text-right text-[11px]">
                          {(seg.weightRatio * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Class Mode: Ticket Holders & Odds List */
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-72">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400" />
                    <span>รายชื่อผู้มีสิทธิ์ลุ้น ({segments.length} คน)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">โอกาสชนะ (%)</span>
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1">
                  {segments.length > 0 ? (
                    [...segments]
                      .sort((a, b) => b.tickets - a.tickets)
                      .map((seg) => (
                        <div
                          key={seg.student.id}
                          className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            <span className="font-bold text-slate-200">
                              #{seg.student.studentCode} {seg.student.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-lg text-[11px]">
                              {seg.tickets} 🎟️
                            </span>
                            <span className="font-mono font-semibold text-slate-400 w-12 text-right text-[11px]">
                              {(seg.weightRatio * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">
                      ไม่มีรายการตั๋วสุ่มในขณะนี้
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
