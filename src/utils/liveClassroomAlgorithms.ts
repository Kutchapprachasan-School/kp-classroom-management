// src/utils/liveClassroomAlgorithms.ts
// Pure Functions สำหรับการแบ่งกลุ่มนักเรียนแบบสมดุล (Balanced Tiers)
// และการคำนวณองศาวงล้อถ่วงน้ำหนักตามจำนวนตั๋วสุ่มจริง (Weighted Proportional Wheel Segments)

import type { LiveStudent } from '../services/liveClassroomService';

export interface StudentGroup {
  id: string;
  name: string;
  members: LiveStudent[];
  leaderId: string | null;
}

export interface WeightedWheelSegment {
  student: LiveStudent;
  tickets: number;
  weightRatio: number;
  startAngle: number; // องศาเริ่มต้น (0 - 360)
  endAngle: number;   // องศาสิ้นสุด (0 - 360)
  midAngle: number;   // องศากึ่งกลางช่องสำหรับหยุดเข็มชี้
  color: string;
}

const PASTEL_WHEEL_COLORS = [
  '#3B82F6', '#EC4899', '#10B981', '#F59E0B',
  '#8B5CF6', '#06B6D4', '#F43F5E', '#6366F1',
];

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * แบ่งกลุ่มนักเรียนพร้อมเกลี่ยเศษอย่างสมดุล และรองรับการคละระดับคะแนน (Balanced Tiers)
 */
export function generateBalancedGroups(params: {
  students: LiveStudent[];
  mode: 'byGroupCount' | 'byGroupSize';
  targetValue: number;
  strategy: 'balanced' | 'random';
  autoLeader: boolean;
}): StudentGroup[] {
  const { students, mode, targetValue, strategy, autoLeader } = params;
  const presentStudents = students.filter((s) => s.present);
  if (presentStudents.length === 0 || targetValue <= 0) return [];

  const numGroups =
    mode === 'byGroupCount'
      ? Math.min(presentStudents.length, Math.max(1, targetValue))
      : Math.max(1, Math.ceil(presentStudents.length / targetValue));

  const groups: StudentGroup[] = Array.from({ length: numGroups }, (_, idx) => ({
    id: `group-${idx + 1}`,
    name: `กลุ่มที่ ${idx + 1}`,
    members: [],
    leaderId: null,
  }));

  let orderedPool: LiveStudent[] = [];

  if (strategy === 'balanced') {
    const highs = shuffleArray(presentStudents.filter((s) => s.tier === 'high'));
    const mids = shuffleArray(presentStudents.filter((s) => s.tier === 'mid'));
    const lows = shuffleArray(presentStudents.filter((s) => s.tier === 'low'));
    orderedPool = [...highs, ...mids, ...lows];
  } else {
    orderedPool = shuffleArray(presentStudents);
  }

  // แจกแบบ Round-Robin เพื่อเกลี่ยเศษและระดับคะแนนให้เท่ากันทุกกลุ่ม
  orderedPool.forEach((student, index) => {
    const groupIdx = index % numGroups;
    groups[groupIdx].members.push(student);
  });

  if (autoLeader) {
    groups.forEach((g) => {
      if (g.members.length > 0) {
        const randomLeader = g.members[Math.floor(Math.random() * g.members.length)];
        g.leaderId = randomLeader.id;
      }
    });
  }

  return groups;
}

/**
 * คำนวณช่องวงล้อ SVG ถ่วงน้ำหนักตามจำนวนตั๋วสุ่มจริงของนักเรียนแต่ละคน
 */
export function buildWeightedWheelSegments(
  students: LiveStudent[],
  ticketMode: 'session' | 'total',
  excludedStudentIds: string[] = []
): WeightedWheelSegment[] {
  const eligible = students.filter((s) => {
    if (!s.present || excludedStudentIds.includes(s.id)) return false;
    const count = ticketMode === 'session' ? s.sessionTickets : s.totalTickets;
    return count > 0;
  });

  const totalTicketsSum = eligible.reduce(
    (sum, s) => sum + (ticketMode === 'session' ? s.sessionTickets : s.totalTickets),
    0
  );

  if (totalTicketsSum <= 0) return [];

  let currentAngle = 0;
  return eligible.map((student, idx) => {
    const tickets = ticketMode === 'session' ? student.sessionTickets : student.totalTickets;
    const weightRatio = tickets / totalTicketsSum;
    const angleSpan = weightRatio * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    const midAngle = startAngle + angleSpan / 2;
    currentAngle = endAngle;

    return {
      student,
      tickets,
      weightRatio,
      startAngle,
      endAngle,
      midAngle,
      color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
    };
  });
}

/**
 * สุ่มผู้ชนะตามน้ำหนักตั๋ว และคำนวณองศาการหมุนวงล้อให้หยุดตรงเข็มด้านบน (0 องศา)
 */
export function pickWeightedWheelWinner(
  segments: WeightedWheelSegment[],
  currentRotation: number,
  extraSpins: number = 6
): { winnerSegment: WeightedWheelSegment; nextRotationDeg: number } | null {
  if (segments.length === 0) return null;

  const r = Math.random() * 360;
  const winnerSegment =
    segments.find((seg) => r >= seg.startAngle && r < seg.endAngle) ||
    segments[segments.length - 1];

  // หมุนให้ midAngle ของผู้ชนะมาตกที่ตำแหน่งเข็มชี้ด้านบน (360 - midAngle)
  const targetNormalized = (360 - winnerSegment.midAngle + 360) % 360;
  const baseSpins = Math.ceil(currentRotation / 360) * 360 + extraSpins * 360;
  const nextRotationDeg = baseSpins + targetNormalized;

  return { winnerSegment, nextRotationDeg };
}
