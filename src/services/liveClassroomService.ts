// src/services/liveClassroomService.ts
// Service รวบรวมข้อมูลห้องเรียนสด, การคำนวณ Auto-Tier Percentile, ระบบ First-Toggle Initialization,
// และการจัดเก็บ Group Presets ตามหลัก Strict Zero Mock Data Policy

import type { RewardBatch } from '../hooks/useOptimisticRewards';
import type { ClassroomRosterItem } from '../types/viewModels';
import { classroomService } from './classroomService';
import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService';
import { gachaService } from './gachaService';

export type StudentTier = 'high' | 'mid' | 'low';

export interface LiveStudent {
  id: string;
  studentCode: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  present: boolean;
  totalCoins: number;
  totalTickets: number;
  sessionCoins: number;
  sessionTickets: number;
  tier: StudentTier;
}

export interface LiveClassroomData {
  id: string;
  name: string;
  subject: string;
  students: LiveStudent[];
  initialLedger: RewardBatch[];
}

const ATTENDANCE_STORAGE_PREFIX = 'kp_live_attendance_';
const GROUP_PRESETS_STORAGE_PREFIX = 'kp_group_presets_';

/**
 * คำนวณขอบเขตเวลา 00:00:00.000 ถึง 23:59:59.999 ตามเวลาประเทศไทย (Asia/Bangkok UTC+7)
 */
export function getThailandTodayRange(now: Date = new Date()): {
  startOfDayUTC: Date;
  endOfDayUTC: Date;
  dateKey: string;
} {
  const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
  const thaiTime = new Date(now.getTime() + THAILAND_OFFSET_MS);

  const year = thaiTime.getUTCFullYear();
  const month = thaiTime.getUTCMonth();
  const date = thaiTime.getUTCDate();

  const startOfDayUTC = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - THAILAND_OFFSET_MS);
  const endOfDayUTC = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - THAILAND_OFFSET_MS);
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  return { startOfDayUTC, endOfDayUTC, dateKey };
}

/**
 * จัดระดับนักเรียนเป็น 3 กลุ่ม (High 33%, Mid 34%, Low 33%) จากคะแนนสะสมถ่วงน้ำหนัก (coins + tickets * 3)
 * กรณีต้นเทอมทุกคนมีคะแนน 0 เท่ากัน จะสลับ high, mid, low วนตามลำดับเพื่อความสมดุล
 */
export function calculateStudentTierMap(
  students: { id: string; totalCoins: number; totalTickets: number }[]
): Record<string, StudentTier> {
  const result: Record<string, StudentTier> = {};
  const total = students.length;
  if (total === 0) return result;

  const scored = students.map((s, idx) => ({
    id: s.id,
    originalIndex: idx,
    score: (Number(s.totalCoins) || 0) + (Number(s.totalTickets) || 0) * 3,
  }));

  const allZero = scored.every((s) => s.score === 0);
  if (allZero) {
    const cycle: StudentTier[] = ['high', 'mid', 'low'];
    scored.forEach((s, idx) => {
      result[s.id] = cycle[idx % 3];
    });
    return result;
  }

  scored.sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);

  const highCount = Math.max(1, Math.round(total * 0.33));
  const lowCount = Math.max(1, Math.round(total * 0.33));

  scored.forEach((item, rankIndex) => {
    if (rankIndex < highCount) {
      result[item.id] = 'high';
    } else if (rankIndex >= total - lowCount) {
      result[item.id] = 'low';
    } else {
      result[item.id] = 'mid';
    }
  });

  return result;
}

function getAttendanceStorageKey(classroomId: string, dateKey: string): string {
  return `${ATTENDANCE_STORAGE_PREFIX}${classroomId}_${dateKey}`;
}

export const liveClassroomService = {
  /**
   * โหลดข้อมูลห้องเรียนและนักเรียนจริง 100% (Strict Zero Mock)
   */
  async loadClassroomsData(): Promise<LiveClassroomData[]> {
    const rawClassrooms = await classroomService.getAll();
    if (!rawClassrooms || rawClassrooms.length === 0) {
      return [];
    }

    return rawClassrooms.map((cls: ClassroomRosterItem) => {
      const roster = sgsRosterAndSubmissionService.getRoster(cls.id);
      const studentIds = roster.map((st) => st.id);
      const attendanceMap = this.getTodayAttendanceMap(cls.id, studentIds);

      // ดึงสถานะกาชาจริงของนักเรียนแต่ละคน
      const initialStudentData = roster.map((st) => {
        const gachaState = gachaService.getState(st.id);
        return {
          id: st.id,
          studentCode: st.studentCode || st.id,
          name: st.name || `นักเรียน (${st.studentCode})`,
          nickname: undefined,
          avatarUrl: undefined,
          present: attendanceMap[st.id] !== false,
          totalCoins: gachaState.coins || 0,
          totalTickets: gachaState.tickets || 0,
          sessionCoins: 0,
          sessionTickets: 0,
          tier: 'mid' as StudentTier,
        };
      });

      const tierMap = calculateStudentTierMap(initialStudentData);
      const students: LiveStudent[] = initialStudentData.map((st) => ({
        ...st,
        tier: tierMap[st.id] || 'mid',
      }));

      // ดึง Session Ledger ถ้ามีเก็บไว้ใน sessionStorage
      let initialLedger: RewardBatch[] = [];
      if (typeof window !== 'undefined') {
        try {
          const rawLedger = window.sessionStorage.getItem(`kp_live_class_session_${cls.id}`);
          if (rawLedger) {
            initialLedger = JSON.parse(rawLedger);
            // อัปเดต sessionCoins และ sessionTickets จาก ledger
            initialLedger.forEach((batch) => {
              if (batch.isRevoked) return;
              batch.targetStudentIds.forEach((sid) => {
                const target = students.find((s) => s.id === sid);
                if (target) {
                  if (batch.rewardType === 'coin') {
                    target.sessionCoins += batch.amount;
                  } else {
                    target.sessionTickets += batch.amount;
                  }
                }
              });
            });
          }
        } catch {
          initialLedger = [];
        }
      }

      return {
        id: cls.id,
        name: cls.name,
        subject: cls.level ? `${cls.name} (${cls.level})` : 'วิชาเรียน',
        students,
        initialLedger,
      };
    });
  },

  /**
   * สลับสถานะมาเรียน/ขาดเรียน พร้อมระบบ First-Toggle Initialization
   * ป้องกันไม่ให้นักเรียนคนอื่นกลายเป็นขาดเรียนเมื่อกดสลับคนแรกของวัน
   */
  async toggleAttendance(
    classroomId: string,
    studentId: string,
    nextPresent: boolean,
    allClassroomStudentIds: string[] = []
  ): Promise<{ success: boolean; present: boolean }> {
    if (typeof window === 'undefined') {
      return { success: true, present: nextPresent };
    }

    const { dateKey } = getThailandTodayRange();
    const storageKey = getAttendanceStorageKey(classroomId, dateKey);
    const raw = window.localStorage.getItem(storageKey);

    let attendanceMap: Record<string, 'PRESENT' | 'ABSENT'> = {};

    if (!raw) {
      // First-Toggle Initialization: ตั้งต้นให้นักเรียนทุกคนในห้องเป็น PRESENT ก่อนใน Transaction เดียวกัน
      allClassroomStudentIds.forEach((id) => {
        attendanceMap[id] = 'PRESENT';
      });
    } else {
      try {
        attendanceMap = JSON.parse(raw);
      } catch {
        attendanceMap = {};
      }
    }

    attendanceMap[studentId] = nextPresent ? 'PRESENT' : 'ABSENT';
    window.localStorage.setItem(storageKey, JSON.stringify(attendanceMap));

    return { success: true, present: nextPresent };
  },

  /**
   * อ่านสถานะการมาเรียนของวันปัจจุบัน (Smart Attendance Fallback: ถ้ายังไม่ได้เช็กชื่อ ให้ถือว่ามาเรียนทั้งหมด)
   */
  getTodayAttendanceMap(
    classroomId: string,
    studentIds: string[]
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    if (typeof window === 'undefined') {
      studentIds.forEach((id) => (result[id] = true));
      return result;
    }

    const { dateKey } = getThailandTodayRange();
    const raw = window.localStorage.getItem(getAttendanceStorageKey(classroomId, dateKey));

    if (!raw) {
      // Smart Fallback: คาบนี้ยังไม่ได้เช็กชื่อ ให้ทุกคนมาเรียนเป็นค่าเริ่มต้น
      studentIds.forEach((id) => (result[id] = true));
      return result;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      studentIds.forEach((id) => {
        const status = parsed[id];
        result[id] = !status || status === 'PRESENT' || status === 'LATE';
      });
    } catch {
      studentIds.forEach((id) => (result[id] = true));
    }

    return result;
  },

  /**
   * บันทึกและโหลด Group Presets แยกตามรหัสห้องเรียน
   */
  saveGroupPreset<T>(classroomId: string, presetName: string, groupsData: T): void {
    if (typeof window === 'undefined') return;
    const key = `${GROUP_PRESETS_STORAGE_PREFIX}${classroomId}`;
    const existing = this.getGroupPresets<T>(classroomId);
    const newPreset = {
      id: `preset-${Date.now()}`,
      classroomId,
      presetName: presetName.trim() || `กลุ่มกิจกรรมวันที่ ${new Date().toLocaleDateString('th-TH')}`,
      groupsData,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify([newPreset, ...existing]));
  },

  getGroupPresets<T>(classroomId: string): {
    id: string;
    classroomId: string;
    presetName: string;
    groupsData: T;
    createdAt: string;
  }[] {
    if (typeof window === 'undefined') return [];
    const key = `${GROUP_PRESETS_STORAGE_PREFIX}${classroomId}`;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
