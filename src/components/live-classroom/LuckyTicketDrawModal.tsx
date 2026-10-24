// src/components/live-classroom/LuckyTicketDrawModal.tsx
// วงล้อจับรางวัลท้ายคาบด้วยตั๋วสุ่ม (🎟️) ถ่วงน้ำหนักความกว้างของช่องตามจำนวนตั๋วจริง
// มีเสียงติ๊กชะลอความเร็วตามสมการ Cubic Bezier และปุ่มมอบรางวัลใหญ่ (+3🪙 หรือ +5🪙 พร้อมหักตั๋ว)

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Ticket,
  Sparkles,
  Trophy,
  X,
  RotateCcw,
  Coins,
  CheckCircle2,
  Gift,
  Users,
} from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import {
  buildWeightedWheelSegments,
  pickWeightedWheelWinner,
} from '../../utils/liveClassroomAlgorithms';

export interface LuckyTicketDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: LiveStudent[];
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
  onGiveReward,
  onConsumeTicket,
  onPlaySound,
}) => {
  const [ticketSource, setTicketSource] = useState<'session' | 'total'>('session');
  const [spinDurationSec, setSpinDurationSec] = useState<number>(4.5);
  const [excludeWinners, setExcludeWinners] = useState<boolean>(true);
  const [pastWinnerIds, setPastWinnerIds] = useState<string[]>([]);

  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<LiveStudent | null>(null);
  const [prizeClaimed, setPrizeClaimed] = useState<boolean>(false);

  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelActiveSpin = useCallback(() => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
    tickTimersRef.current.forEach(clearTimeout);
    tickTimersRef.current = [];
    setIsSpinning(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cancelActiveSpin();
    }
    return () => {
      cancelActiveSpin();
    };
  }, [isOpen, cancelActiveSpin]);

  // คำนวณช่องวงล้อถ่วงน้ำหนักตามจำนวนตั๋ว
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

  const handleSpinWheel = useCallback(() => {
    if (isSpinning || segments.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setPrizeClaimed(false);

    const spinResult = pickWeightedWheelWinner(segments, rotation, 6);
    if (!spinResult) {
      setIsSpinning(false);
      return;
    }

    setRotation(spinResult.nextRotationDeg);

    // เสียงติ๊กจำลองเข็มดีดผ่านหมุดวงล้อ ค่อยๆ ชะลอความเร็วตามสมการ Cubic Bezier
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
  }, [isSpinning, segments, rotation, spinDurationSec, onPlaySound]);

  const handleAwardWinner = (coinAmount: number, consumeOneTicket: boolean) => {
    if (!winner || prizeClaimed) return;

    onGiveReward(
      [winner.id],
      'coin',
      coinAmount,
      `🎉 รางวัลใหญ่ท้ายคาบ (${winner.name})`
    );

    if (consumeOneTicket && onConsumeTicket) {
      onConsumeTicket(winner.id);
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
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>วงล้อจับรางวัลตั๋วสุ่มท้ายคาบ</span>
                <span className="text-xs font-bold bg-pink-500/20 border border-pink-500/40 text-pink-300 px-3 py-1 rounded-full">
                  รวม {totalTicketsInPool} 🎟️ ในกองสุ่ม
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ยิ่งสะสมตั๋วสุ่มได้มาก ช่องบนวงล้อและโอกาสถูกรางวัลยิ่งกว้างขึ้นตามสัดส่วนจริง
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 border-b border-slate-800/80 text-xs">
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
              <span className="text-slate-400 font-medium">ความเร็วการหมุน:</span>
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
                ตัดสิทธิ์ผู้ชนะออกในการหมุนรอบถัดไป ({pastWinnerIds.length} คนได้รับแล้ว)
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
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนสิทธิ์ผู้ชนะทั้งหมด</span>
            </button>
          )}
        </div>

        {/* Main Content Grid: Left Wheel / Right Odds Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-center">
          {/* Left: SVG Wheel */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            {segments.length > 0 ? (
              <>
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] flex items-center justify-center">
                  {/* Top Pointer Arrow */}
                  <div className="absolute -top-3 z-20 flex flex-col items-center drop-shadow-xl">
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
                    {segments.length === 1 ? (
                      /* Edge Case: นักเรียนถือตั๋วเพียง 1 คน (เต็ม 360 องศา) วาดวงกลมเต็มวง */
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
                      strokeWidth="4"
                    />
                  </svg>
                </div>

                <button
                  onClick={handleSpinWheel}
                  disabled={isSpinning}
                  className="mt-6 flex items-center gap-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-base px-9 py-3 rounded-2xl shadow-xl shadow-pink-600/25 transition transform active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isSpinning ? 'กำลังหมุนวงล้อ...' : '🎲 หมุนวงล้อจับรางวัล!'}</span>
                </button>
              </>
            ) : (
              <div className="py-14 px-6 text-center bg-slate-950/50 border border-slate-800 rounded-3xl w-full space-y-2">
                <Ticket className="w-14 h-14 mx-auto text-slate-600" />
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
                  <Trophy className="w-4 h-4" />
                  <span>ผู้โชคดีได้รับรางวัลท้ายคาบ!</span>
                </div>

                <div>
                  <p className="text-xs text-amber-300 font-semibold">#{winner.studentCode}</p>
                  <h3 className="text-2xl font-black text-white mt-0.5">{winner.name}</h3>
                </div>

                {!prizeClaimed ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-300 font-medium">
                      เลือกรางวัลที่ต้องการมอบให้ผู้โชคดี:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAwardWinner(3, false)}
                        className="flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-2 px-3 rounded-xl text-xs transition active:scale-95 shadow-sm"
                      >
                        <Coins className="w-4 h-4" />
                        <span>มอบ +3 🪙</span>
                      </button>

                      <button
                        onClick={() => handleAwardWinner(5, true)}
                        className="flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-400 text-white font-extrabold py-2 px-3 rounded-xl text-xs transition"
                      >
                        <Gift className="w-4 h-4" />
                        <span>+5 🪙 (หัก 1 🎟️)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>มอบรางวัลและบันทึกเข้า Session Log เรียบร้อย!</span>
                  </div>
                )}
              </div>
            )}

            {/* Ticket Holders & Odds List */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
