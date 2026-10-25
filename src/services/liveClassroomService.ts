// src/services/liveClassroomService.ts
// Service รวบรวมข้อมูลห้องเรียนสด, การคำนวณ Auto-Tier Percentile, ระบบ First-Toggle Initialization,
// และการจัดเก็บ Group Presets ตามหลัก Strict Zero Mock Data Policy

import type { RewardBatch } from '../hooks/useOptimisticRewards';
import type { ClassroomRosterItem } from '../types/viewModels';
import { classroomService } from './classroomService';
import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService';
import { gachaService } from './gachaService';
import { registerClassroomNames, formatClassroomLabel, studentService } from './studentService';
import { getTeacherTaughtClassrooms, getDynamicTeachingSubjects } from './teacherCourseAssignmentService';
import { authService } from './authService';

export type StudentTier = 'high' | 'mid' | 'low';

export function detectStudentGender(name?: string, explicitGender?: string): 'MALE' | 'FEMALE' {
  if (explicitGender === 'MALE' || explicitGender === 'FEMALE') {
    return explicitGender;
  }
  const trimmed = (name || '').trim();
  if (
    trimmed.startsWith('เด็กหญิง') ||
    trimmed.startsWith('ด.ญ.') ||
    trimmed.startsWith('ด.ญ') ||
    trimmed.startsWith('นางสาว') ||
    trimmed.startsWith('น.ส.') ||
    trimmed.startsWith('น.ส') ||
    trimmed.startsWith('นาง')
  ) {
    return 'FEMALE';
  }
  return 'MALE';
}

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
  gender?: 'MALE' | 'FEMALE';
}

export interface WordDeckItem {
  id: string;
  name: string;
  words: string[];
  classroomId: string;
  teacherId?: string;
  teacherName?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
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
const WORD_DECKS_STORAGE_PREFIX = 'kp_word_decks_';

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
   * กรองเฉพาะห้องเรียนที่ครูผู้สอนคนปัจจุบันสอนจริง (Taught Classrooms)
   */
  async loadClassroomsData(requestedClassroomId?: string): Promise<LiveClassroomData[]> {
    const rawClassrooms = await classroomService.getAll();
    if (!rawClassrooms || rawClassrooms.length === 0) {
      return [];
    }

    // ลงทะเบียนชื่อห้องเรียนเข้า In-Memory Cache เพื่อให้ resolveRoomCandidates ค้นหาได้ทุกรหัส
    registerClassroomNames(rawClassrooms);

    // กรองเฉพาะห้องเรียนที่ครูคนนี้สอนจริง (Taught Classrooms)
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';
    const taughtClassrooms = getTeacherTaughtClassrooms();
    const taughtNormalized = new Set(
      taughtClassrooms.map((t) => formatClassroomLabel(t).trim().toLowerCase())
    );

    const filteredClassrooms = rawClassrooms.filter((cls) => {
      if (isAdmin) return true;
      if (
        requestedClassroomId &&
        (cls.id === requestedClassroomId ||
          cls.name === requestedClassroomId ||
          formatClassroomLabel(cls.name) === formatClassroomLabel(requestedClassroomId))
      ) {
        return true;
      }
      if (!taughtClassrooms || taughtClassrooms.length === 0) return true;

      const clsNameNorm = formatClassroomLabel(cls.name || '').trim().toLowerCase();
      const clsIdNorm = formatClassroomLabel(cls.id || '').trim().toLowerCase();
      const clsRoomNorm = cls.roomNumber
        ? formatClassroomLabel(cls.roomNumber).trim().toLowerCase()
        : '';

      return (
        taughtNormalized.has(clsNameNorm) ||
        taughtNormalized.has(clsIdNorm) ||
        (clsRoomNorm ? taughtNormalized.has(clsRoomNorm) : false) ||
        taughtClassrooms.includes(cls.name) ||
        taughtClassrooms.includes(cls.id)
      );
    });

    const activeRooms = filteredClassrooms.length > 0 ? filteredClassrooms : rawClassrooms;

    return activeRooms.map((cls: ClassroomRosterItem) => {
      // ดึงรายชื่อนักเรียนจริง โดยค้นหาทั้งจาก cls.id, cls.name และ studentService เพื่อไม่ให้รายชื่อตกหล่น
      let roster = sgsRosterAndSubmissionService.getRoster(cls.id);
      if (!roster || roster.length === 0) {
        roster = sgsRosterAndSubmissionService.getRoster(cls.name);
      }
      if (!roster || (roster.length === 0 && cls.roomNumber)) {
        roster = sgsRosterAndSubmissionService.getRoster(cls.roomNumber);
      }
      if (!roster || roster.length === 0) {
        const directStudents =
          studentService.getStudents(cls.name) ||
          studentService.getStudents(cls.id) ||
          (cls.roomNumber ? studentService.getStudents(cls.roomNumber) : []);
        if (directStudents && directStudents.length > 0) {
          roster = directStudents.map((st) => ({
            id: st.id || `stu-${st.code}`,
            studentCode: st.code || st.id,
            name: st.name || `นักเรียน (${st.code})`,
            classroom: cls.name,
            classroomId: cls.id,
          }));
        }
      }

      const studentIds = roster.map((st) => st.id);
      const attendanceMap = this.getTodayAttendanceMap(cls.id, studentIds);

      const directStudentsList =
        studentService.getStudents(cls.name) ||
        studentService.getStudents(cls.id) ||
        (cls.roomNumber ? studentService.getStudents(cls.roomNumber) : []) ||
        [];
      const directStudentMap = new Map(directStudentsList.map((s) => [s.id, s]));

      // ดึงสถานะกาชาจริงของนักเรียนแต่ละคน
      const initialStudentData = roster.map((st) => {
        const gachaState = gachaService.getState(st.id);
        const directMatch = directStudentMap.get(st.id);
        const gender = detectStudentGender(st.name, directMatch?.gender);
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
          gender,
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

      // ค้นหารายวิชาที่ครูคนนี้สอนในห้องนี้
      const taughtSubjects = getDynamicTeachingSubjects();
      const matchedSubject = taughtSubjects.find((s) =>
        s.classrooms.some(
          (r) =>
            formatClassroomLabel(r) === formatClassroomLabel(cls.name) ||
            r === cls.id ||
            r === cls.name
        )
      );
      const subjectLabel = matchedSubject
        ? `${matchedSubject.code} ${matchedSubject.name}`
        : (cls as any).subjectGroup || 'รายวิชาพื้นฐาน';

      return {
        id: cls.id,
        name: cls.name,
        subject: subjectLabel,
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
   * สร้าง Storage Key สำหรับ Group Preset แยกตามครูผู้สอน, รายวิชา, และห้องเรียน
   * เพื่อความปลอดภัยและความเป็นส่วนตัว 100% ของใครของมันไม่ปนกัน
   */
  getGroupPresetStorageKey(
    classroomId: string,
    teacherId?: string,
    subject?: string
  ): string {
    const safeTeacher = (teacherId || 'default').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
    const safeSubject = (subject || 'default').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
    return `${GROUP_PRESETS_STORAGE_PREFIX}${safeTeacher}_${safeSubject}_${classroomId}`;
  },

  /**
   * บันทึก Group Presets เฉพาะครูผู้สอนและรายวิชานั้นๆ
   */
  saveGroupPreset<T>(
    classroomId: string,
    presetName: string,
    groupsData: T,
    teacherId?: string,
    teacherName?: string,
    subject?: string
  ): void {
    if (typeof window === 'undefined') return;
    const key = this.getGroupPresetStorageKey(classroomId, teacherId, subject);
    const existing = this.getGroupPresets<T>(classroomId, teacherId, subject);
    const newPreset = {
      id: `preset-${Date.now()}`,
      classroomId,
      presetName: presetName.trim() || `กลุ่มกิจกรรมวันที่ ${new Date().toLocaleDateString('th-TH')}`,
      groupsData,
      createdAt: new Date().toISOString(),
      teacherId,
      teacherName,
      subject,
    };
    window.localStorage.setItem(key, JSON.stringify([newPreset, ...existing]));
  },

  getGroupPresets<T>(
    classroomId: string,
    teacherId?: string,
    subject?: string
  ): {
    id: string;
    classroomId: string;
    presetName: string;
    groupsData: T;
    createdAt: string;
    teacherId?: string;
    teacherName?: string;
    subject?: string;
  }[] {
    if (typeof window === 'undefined') return [];
    const key = this.getGroupPresetStorageKey(classroomId, teacherId, subject);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
      // Fallback สำหรับคีย์เก่ากรณีไม่ระบุครูหรือวิชา
      if (!teacherId && !subject) {
        const legacyRaw = window.localStorage.getItem(`${GROUP_PRESETS_STORAGE_PREFIX}${classroomId}`);
        return legacyRaw ? JSON.parse(legacyRaw) : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  deleteGroupPreset(
    classroomId: string,
    presetId: string,
    teacherId?: string,
    subject?: string
  ): void {
    if (typeof window === 'undefined') return;
    const key = this.getGroupPresetStorageKey(classroomId, teacherId, subject);
    const existing = this.getGroupPresets(classroomId, teacherId, subject);
    const filtered = existing.filter((p) => p.id !== presetId);
    window.localStorage.setItem(key, JSON.stringify(filtered));
  },

  /**
   * สร้าง Storage Key สำหรับ Word Decks (คลังคำศัพท์/คำถาม) แยกตามครูผู้สอน, รายวิชา, และห้องเรียน
   */
  getWordDeckStorageKey(
    classroomId: string,
    teacherId?: string,
    subject?: string
  ): string {
    const safeTeacher = (teacherId || 'default').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
    const safeSubject = (subject || 'default').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
    return `${WORD_DECKS_STORAGE_PREFIX}${safeTeacher}_${safeSubject}_${classroomId}`;
  },

  getWordDecks(
    classroomId: string,
    teacherId?: string,
    subject?: string
  ): WordDeckItem[] {
    if (typeof window === 'undefined') return [];
    const key = this.getWordDeckStorageKey(classroomId, teacherId, subject);
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveWordDeck(
    classroomId: string,
    deckName: string,
    words: string[],
    teacherId?: string,
    teacherName?: string,
    subject?: string,
    existingDeckId?: string
  ): WordDeckItem {
    const key = this.getWordDeckStorageKey(classroomId, teacherId, subject);
    const existing = this.getWordDecks(classroomId, teacherId, subject);
    const now = new Date().toISOString();

    const cleanedWords = Array.from(
      new Set(
        words
          .map((w) => w.trim())
          .filter((w) => w.length > 0)
      )
    );

    let updatedDeck: WordDeckItem;

    if (existingDeckId) {
      const foundIdx = existing.findIndex((d) => d.id === existingDeckId);
      if (foundIdx >= 0) {
        updatedDeck = {
          ...existing[foundIdx],
          name: deckName.trim() || existing[foundIdx].name,
          words: cleanedWords,
          updatedAt: now,
        };
        existing[foundIdx] = updatedDeck;
      } else {
        updatedDeck = {
          id: existingDeckId,
          name: deckName.trim() || 'ชุดคำศัพท์',
          words: cleanedWords,
          classroomId,
          teacherId,
          teacherName,
          subject,
          createdAt: now,
          updatedAt: now,
        };
        existing.unshift(updatedDeck);
      }
    } else {
      updatedDeck = {
        id: `deck-${Date.now()}`,
        name: deckName.trim() || `ชุดคำศัพท์ ${new Date().toLocaleDateString('th-TH')}`,
        words: cleanedWords,
        classroomId,
        teacherId,
        teacherName,
        subject,
        createdAt: now,
        updatedAt: now,
      };
      existing.unshift(updatedDeck);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(existing));
    }

    return updatedDeck;
  },

  deleteWordDeck(
    classroomId: string,
    deckId: string,
    teacherId?: string,
    subject?: string
  ): void {
    if (typeof window === 'undefined') return;
    const key = this.getWordDeckStorageKey(classroomId, teacherId, subject);
    const existing = this.getWordDecks(classroomId, teacherId, subject);
    const filtered = existing.filter((d) => d.id !== deckId);
    window.localStorage.setItem(key, JSON.stringify(filtered));
  },
};
