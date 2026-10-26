import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { StudentCreateSchema, type StudentCreateInput } from './types.ts';
import { attendanceCorrelationService } from './attendanceCorrelationService.ts';
import { activityAuditLogService } from './activityAuditLogService.ts';
import { masterDataService, resolveRoomCandidates, CANONICAL_TIMESTAMP_ROOM_MAP } from './masterDataService.ts';
import { localCacheDb } from './localCacheDb.ts';

import { isGrade1SgsStudentCode, getM1SgsStudentInfo } from '../config/m1SgsLookup.ts';

export interface StudentRecord {
  id: string;
  no: number;
  code: string;
  name: string;
  attendance: string;
  score: number;
  status: 'NORMAL' | 'AT_RISK';
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  classroomId?: string;
  studentCode?: string;
  passwordHash?: string | null;
  isPasswordChanged?: boolean;
  lastLoginAt?: string;
}

const STORAGE_PREFIX = 'cls_students_';

export const defaultStudents: StudentRecord[] = [];

// Zero mock students: ข้อมูลนักเรียนทั้งหมดต้องมาจากระบบจริง/ฐานข้อมูลจริงเท่านั้น
export const mockStudentsByRoom: Record<string, StudentRecord[]> = {};

const inMemoryStudentCache: Record<string, StudentRecord[]> = {};

export function getAlternateRoomKey(classroomId: string): string | null {
  if (!classroomId) return null;
  const trimmed = classroomId.trim();
  const matchRoom = trimmed.match(/^room-(\d+)-(\d+)$/);
  if (matchRoom) {
    return `ม.${matchRoom[1]}/${matchRoom[2]}`;
  }
  const matchThai = trimmed.match(/^ม\.?\s*(\d+)\/(\d+)$/);
  if (matchThai) {
    return `room-${matchThai[1]}-${matchThai[2]}`;
  }
  const label = formatClassroomLabel(trimmed);
  if (label && label !== trimmed) {
    return label;
  }
  return null;
}

const classroomNameCache = new Map<string, string>();

/**
 * ลงทะเบียนชื่อห้องเรียนเข้า In-Memory Cache เพื่อให้ formatClassroomLabel แปลงรหัสภายใน (เช่น room-1791986991422) เป็นชื่อห้องจริงได้ทันที
 */
export function registerClassroomNames(
  classrooms: Array<{ id?: string; name?: string; roomNumber?: string }>
): void {
  for (const c of classrooms) {
    const name = c.name || c.roomNumber;
    if (c.id && name) {
      classroomNameCache.set(c.id.trim(), name.trim());
    }
    if (name) {
      classroomNameCache.set(name.trim(), name.trim());
    }
  }
}

/**
 * แปลงรหัสห้องเรียนหรือไอดี (เช่น room-1-1, room-3-1, room-1791986991422) เป็นชื่อห้องภาษาไทยที่สวยงาม (เช่น ม.1/1, ม.3/1)
 */
export function formatClassroomLabel(classroomId?: string): string {
  if (!classroomId) return 'ม.1/1';
  const trimmed = classroomId.trim();

  // 1. Direct match in in-memory cache or canonical timestamp room map
  if (CANONICAL_TIMESTAMP_ROOM_MAP[trimmed]) {
    return CANONICAL_TIMESTAMP_ROOM_MAP[trimmed];
  }
  if (classroomNameCache.has(trimmed)) {
    const cachedName = classroomNameCache.get(trimmed)!;
    const matchThai = cachedName.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
    if (matchThai) return `ม.${matchThai[1]}/${matchThai[2]}`;
    return cachedName;
  }

  // 2. Direct Thai pattern match: ม.3/1, ม. 3/1
  const matchThai = trimmed.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
  if (matchThai) {
    return `ม.${matchThai[1]}/${matchThai[2]}`;
  }

  // 3. Simple room-grade-number pattern: room-3-1 -> ม.3/1
  const matchRoom = trimmed.match(/^room-(\d+)-(\d+)$/);
  if (matchRoom) {
    return `ม.${matchRoom[1]}/${matchRoom[2]}`;
  }

  // 4. Resolve from cached classroom roster in localStorage (cls_classrooms_data)
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('cls_classrooms_data');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const found = list.find(
            (c: any) =>
              c.id === trimmed ||
              c.name === trimmed ||
              c.roomNumber === trimmed ||
              (c.id && trimmed.includes(c.id))
          );
          if (found && (found.name || found.roomNumber)) {
            const rawName = (found.name || found.roomNumber).trim();
            classroomNameCache.set(trimmed, rawName);
            if (found.id) classroomNameCache.set(found.id, rawName);
            const mThai = rawName.match(/^ม\.?\s*(\d+)\s*\/\s*(\d+)$/);
            return mThai ? `ม.${mThai[1]}/${mThai[2]}` : rawName;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback for plain digit slash pattern e.g. "3/1" -> "ม.3/1"
  const plainSlashMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (plainSlashMatch) {
    return `ม.${plainSlashMatch[1]}/${plainSlashMatch[2]}`;
  }

  return trimmed;
}

function relocateMisplacedM1Students(misplaced: StudentRecord[]): void {
  if (typeof localStorage === 'undefined' || !misplaced || misplaced.length === 0) return;
  const byRoom: Record<string, StudentRecord[]> = {};

  misplaced.forEach((st) => {
    const info = getM1SgsStudentInfo(st.code || st.id);
    if (!info) return; // ป้องกันการดึงนักเรียนที่ไม่ใช่ ม.1 เข้ามาใน ม.1/1 โดยเด็ดขาด
    const targetThaiRoom = info.room;
    const match = targetThaiRoom.match(/(\d+)\/(\d+)/);
    const targetRoomId = match ? `room-${match[1]}-${match[2]}` : 'room-1-1';

    if (!byRoom[targetRoomId]) byRoom[targetRoomId] = [];
    byRoom[targetRoomId].push({
      ...st,
      no: info.seatNo || st.no,
      classroomId: targetRoomId,
    });
  });

  Object.entries(byRoom).forEach(([roomId, newStudents]) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
      let existing: StudentRecord[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) existing = [];

      const existingCodes = new Set(existing.map((s) => s.code || s.id));
      const toAdd = newStudents.filter((s) => !existingCodes.has(s.code || s.id));
      if (toAdd.length > 0) {
        const merged = [...existing, ...toAdd].sort((a, b) => a.no - b.no);
        localStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(merged));
        inMemoryStudentCache[roomId] = merged;
        const alt = getAlternateRoomKey(roomId);
        if (alt) {
          localStorage.setItem(`${STORAGE_PREFIX}${alt}`, JSON.stringify(merged));
          inMemoryStudentCache[alt] = merged;
        }
      }
    } catch {
      // ignore
    }
  });
}

/**
 * ตรวจสอบและดึงระดับชั้น (gradeLevel) และห้อง (roomNumber) เป็นตัวเลขอัตโนมัติ
 * เพื่อใช้กับตาราง StudentEnrollment ในฐานข้อมูล Neon / PostgreSQL
 */
export function parseGradeAndRoom(classroomId: string): { gradeLevel: number; roomNumber: number } {
  if (!classroomId) return { gradeLevel: 1, roomNumber: 1 };
  const label = formatClassroomLabel(classroomId);
  const matchThai = label.match(/ม\.?\s*(\d+)\s*\/\s*(\d+)/);
  if (matchThai) {
    return {
      gradeLevel: parseInt(matchThai[1], 10),
      roomNumber: parseInt(matchThai[2], 10),
    };
  }
  const matchRoom = classroomId.match(/room-(\d+)-(\d+)/i);
  if (matchRoom) {
    return {
      gradeLevel: parseInt(matchRoom[1], 10),
      roomNumber: parseInt(matchRoom[2], 10),
    };
  }
  return { gradeLevel: 1, roomNumber: 1 };
}

/**
 * ตรวจจับและจัดเรียงเลขที่นักเรียนใหม่ (1..N) อัตโนมัติเมื่อพบเลขที่ซ้ำซ้อน (Duplicate Roll Numbers)
 * หรือเลขที่ผิดปกติ (<=0, NaN) โดยไม่ลบหรือไม่ทำให้นักเรียนสูญหายเด็ดขาด
 * ยึดรหัสนักเรียน (code/studentCode/id) เป็น Identity หลักเสมอ (Zero-Mock & Zero-Loss)
 */
export function normalizeRoomRollNumbers(students: StudentRecord[]): {
  students: StudentRecord[];
  hasRepaired: boolean;
} {
  if (!Array.isArray(students) || students.length === 0) {
    return { students: [], hasRepaired: false };
  }

  // 1. Deduplicate by unique identity: studentCode / code / id
  const uniqueStudents: StudentRecord[] = [];
  const seenKeys = new Set<string>();

  for (const stu of students) {
    const key = (stu.code || stu.studentCode || stu.id || '').trim();
    if (!key) {
      uniqueStudents.push(stu);
      continue;
    }
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueStudents.push(stu);
    }
  }

  // 2. Check for duplicate roll numbers, non-positive, or NaN
  const seenNos = new Set<number>();
  let hasCollisionOrInvalid = false;

  for (const stu of uniqueStudents) {
    const num = Number(stu.no);
    if (!Number.isFinite(num) || num <= 0 || seenNos.has(num)) {
      hasCollisionOrInvalid = true;
      break;
    }
    seenNos.add(num);
  }

  if (!hasCollisionOrInvalid && uniqueStudents.length === students.length) {
    const sorted = [...uniqueStudents].sort(
      (a, b) => Number(a.no || 999999) - Number(b.no || 999999)
    );
    return { students: sorted, hasRepaired: false };
  }

  // 3. ซ่อมแซมและจัดเรียงเลขที่ใหม่ 1..N อย่างแม่นยำ
  const sorted = [...uniqueStudents].sort((a, b) => {
    const diff = Number(a.no || 999999) - Number(b.no || 999999);
    if (diff !== 0) return diff;
    const aKey = String(a.code || a.id || '');
    const bKey = String(b.code || b.id || '');
    return aKey.localeCompare(bKey, 'th');
  });

  const normalized = sorted.map((stu, index) => ({
    ...stu,
    no: index + 1,
  }));

  return { students: normalized, hasRepaired: true };
}

const getLocalStudents = (classroomId: string): StudentRecord[] => {
  if (!classroomId) return [];
  const candidates = resolveRoomCandidates(classroomId);
  const isGrade1Room = candidates.some((c) => c.includes('1-') || c.includes('1/'));

  // 1. ตรวจสอบใน localStorage ตามรหัสแทนกันทุกตัว โดยรวมข้อมูลจากทุก candidate (ป้องกัน Candidate-Split)
  if (typeof localStorage !== 'undefined') {
    const candidateArrays: StudentRecord[][] = [];
    for (const c of candidates) {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${c}`);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidateArrays.push(parsed);
          }
        } catch {
          // ignore
        }
      }
    }

    if (candidateArrays.length > 0) {
      // รวมนักเรียนจากทุก candidate เข้าด้วยกันโดยใช้ Identity (code || studentCode || id)
      const mergedMap = new Map<string, StudentRecord>();
      for (const arr of candidateArrays) {
        for (const s of arr) {
          const key = (s.code || s.studentCode || s.id || '').trim();
          if (key) {
            if (!mergedMap.has(key)) {
              mergedMap.set(key, s);
            } else {
              const existing = mergedMap.get(key)!;
              mergedMap.set(key, { ...existing, ...s });
            }
          }
        }
      }

      let parsed = Array.from(mergedMap.values());

      // หากเป็นห้องที่ไม่ใช่ ม.1 แต่มีนักเรียน ม.1 ปะปนอยู่ ให้ทำการ sanitize
      if (!isGrade1Room && parsed.some((s: StudentRecord) => isGrade1SgsStudentCode(s.code || s.id))) {
        const misplaced = parsed.filter((s: StudentRecord) => isGrade1SgsStudentCode(s.code || s.id));
        parsed = parsed.filter((s: StudentRecord) => !isGrade1SgsStudentCode(s.code || s.id));
        relocateMisplacedM1Students(misplaced);
      } else if (isGrade1Room) {
        // กรองนักเรียนที่ไม่ใช่ ม.1 ออก (เช่น คำนำหน้า ม.ปลาย 'นาย', 'นางสาว' หรือรหัสนักเรียนรุ่นก่อน)
        parsed = parsed.filter((s: StudentRecord) => {
          const name = (s.name || '').trim();
          const code = (s.code || s.id || '').trim();
          if (name.startsWith('นาย') || name.startsWith('นางสาว') || name.startsWith('น.ส.')) return false;
          if (/^(12|13|14|15)\d{3}$/.test(code)) return false;
          if (/^16\d{3}$/.test(code) && !isGrade1SgsStudentCode(code)) return false;
          return true;
        });
      }

      const { students: normalized, hasRepaired } = normalizeRoomRollNumbers(parsed);

      // ตรวจสอบว่ามีความจำเป็นต้อง sync กลับไปบันทึกยัง candidates ทั้งหมดหรือไม่
      const needsSync = hasRepaired || candidateArrays.some((arr) => arr.length !== normalized.length);
      if (needsSync) {
        for (const cand of candidates) {
          localStorage.setItem(`${STORAGE_PREFIX}${cand}`, JSON.stringify(normalized));
          inMemoryStudentCache[cand] = normalized;
        }
      }

      return normalized;
    }
  }

  // 2. ตรวจสอบใน inMemoryStudentCache รวบรวมจากทุก candidate (ป้องกัน Candidate-Split)
  const memoryCandidates: StudentRecord[][] = [];
  for (const c of candidates) {
    if (c in inMemoryStudentCache && inMemoryStudentCache[c]?.length > 0) {
      memoryCandidates.push(inMemoryStudentCache[c]);
    }
  }
  if (memoryCandidates.length > 0) {
    const memMap = new Map<string, StudentRecord>();
    for (const arr of memoryCandidates) {
      for (const s of arr) {
        const key = (s.code || s.studentCode || s.id || '').trim();
        if (key) {
          if (!memMap.has(key)) memMap.set(key, s);
          else memMap.set(key, { ...memMap.get(key)!, ...s });
        }
      }
    }
    let cached = Array.from(memMap.values());
    if (!isGrade1Room && cached.some((s) => isGrade1SgsStudentCode(s.code || s.id))) {
      cached = cached.filter((s) => !isGrade1SgsStudentCode(s.code || s.id));
    }
    const { students: normalized } = normalizeRoomRollNumbers(cached);
    for (const c of candidates) {
      inMemoryStudentCache[c] = normalized;
    }
    return normalized;
  }

  // 3. ตรวจสอบใน L1 memory masterDataService
  for (const c of candidates) {
    const masterL1 = masterDataService.getCachedStudentsSync(c);
    if (masterL1 && masterL1.length > 0) {
      return masterL1 as StudentRecord[];
    }
  }

  // 4. หากยังไม่มีข้อมูลใน local cache (เช่น เพิ่งล้างแคชแล้วล็อกอินใหม่) ให้ดึงจาก Neon DB / IndexedDB เบื้องหลังแบบไม่บล็อก UI
  if (
    classroomId !== 'ALL' &&
    typeof window !== 'undefined' &&
    !pendingRoomHydrationSet.has(classroomId)
  ) {
    pendingRoomHydrationSet.add(classroomId);
    masterDataService
      .getStudentsByRoom(classroomId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          saveLocalStudents(classroomId, rows as StudentRecord[]);
          try {
            window.dispatchEvent(new CustomEvent('kp-sgs-roster-updated'));
            window.dispatchEvent(new CustomEvent('kp-grading-queue-updated'));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => pendingRoomHydrationSet.delete(classroomId), 15000);
      });
  }

  return [];
};

const pendingRoomHydrationSet = new Set<string>();

const saveLocalStudents = (classroomId: string, items: StudentRecord[]) => {
  if (!classroomId) return;
  const { students: normalizedItems } = normalizeRoomRollNumbers(items);
  const candidates = resolveRoomCandidates(classroomId);

  for (const c of candidates) {
    inMemoryStudentCache[c] = normalizedItems;
  }
  // L2 IndexedDB persistence
  localCacheDb.putStudents(normalizedItems as any).catch(() => {});

  if (typeof localStorage !== 'undefined') {
    for (const c of candidates) {
      localStorage.setItem(`${STORAGE_PREFIX}${c}`, JSON.stringify(normalizedItems));
    }
    try {
      window.dispatchEvent(new CustomEvent('kps-students-updated', { detail: { classroomId } }));
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', { detail: { type: 'students', classroomId } }));
    } catch {
      // ignore
    }
  }
};

export function parseThaiStudentName(fullName: string): {
  title: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
} {
  const trimmed = (fullName || '').trim();
  let title = 'ด.ช.';
  let firstName = trimmed;
  let lastName = '';
  const parts = trimmed.split(/\s+/);

  if (parts[0].startsWith('ด.ช.') || parts[0].startsWith('เด็กชาย')) {
    title = 'ด.ช.';
    firstName = parts[0].replace(/^(ด\.ช\.|เด็กชาย)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('ด.ญ.') || parts[0].startsWith('เด็กหญิง')) {
    title = 'ด.ญ.';
    firstName = parts[0].replace(/^(ด\.ญ\.|เด็กหญิง)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('นาย')) {
    title = 'นาย';
    firstName = parts[0].replace(/^นาย/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('น.ส.') || parts[0].startsWith('นางสาว')) {
    title = 'นางสาว';
    firstName = parts[0].replace(/^(น\.ส\.|นางสาว)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts.length >= 2) {
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  const gender: 'MALE' | 'FEMALE' = (title === 'ด.ญ.' || title === 'นางสาว') ? 'FEMALE' : 'MALE';
  return { title, firstName: firstName || trimmed, lastName, gender };
}

export interface BatchImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentStudentName?: string;
  roomName?: string;
}

export interface BatchImportOptions {
  term?: number;
  academicYear?: number;
  roomName?: string;
  onProgress?: (progress: BatchImportProgress) => void;
}

export const studentService = {
  getLocalStudents,
  saveLocalStudents,
  mockStudentsByRoom,
  parseThaiStudentName,

  // ดึงรายชื่อนักเรียนในห้อง
  getStudents(classroomId: string): StudentRecord[] {
    return getLocalStudents(classroomId);
  },

  getStudentsByClassroom(classroomId: string): StudentRecord[] {
    return getLocalStudents(classroomId);
  },

  // ดึงจำนวนนักเรียนในห้องเรียน
  countStudents(classroomId: string): number {
    return getLocalStudents(classroomId).length;
  },

  // ค้นหานักเรียนและห้องเรียนปัจจุบันจากรหัส
  findStudentByCode(code: string): { student: StudentRecord; classroomId: string } | null {
    const cleanCode = String(code || '').trim().replace(/^stu-/, '');
    if (!cleanCode) return null;

    const isStudentMatch = (s: StudentRecord) =>
      s &&
      (String(s.code || '').trim() === cleanCode ||
        String(s.studentCode || '').trim() === cleanCode ||
        String(s.id || '').trim() === cleanCode ||
        String(s.id || '').trim() === `stu-${cleanCode}`);

    // 1. ตรวจสอบ keys ทั้งหมดใน localStorage ก่อน
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const match = list.find(isStudentMatch);
                if (match) {
                  const rawRoom = k.slice(STORAGE_PREFIX.length);
                  return {
                    student: match,
                    classroomId: match.classroomId || rawRoom,
                  };
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Check in-memory cache
    for (const [room, list] of Object.entries(inMemoryStudentCache)) {
      const match = list.find(isStudentMatch);
      if (match) {
        return {
          student: match,
          classroomId: match.classroomId || room,
        };
      }
    }

    return null;
  },

  // อัปเดตรหัสผ่านนักเรียน (บันทึกลง local storage ประจำห้องเรียน)
  updateStudentPassword(code: string, passwordHash: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash, isPasswordChanged: true, lastLoginAt: new Date().toISOString() }
        : s
    );
    saveLocalStudents(classroomId, updated);
    inMemoryStudentCache[classroomId] = updated;
    return true;
  },

  // รีเซ็ตรหัสผ่านนักเรียนกลับเป็นค่าเริ่มต้น (5 หลัก) โดยครูที่ปรึกษา / แอดมิน
  resetStudentPassword(code: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash: null, isPasswordChanged: false }
        : s
    );
    saveLocalStudents(classroomId, updated);
    inMemoryStudentCache[classroomId] = updated;
    return true;
  },

  // รีเซ็ตรหัสผ่านนักเรียนทั้งห้องเรียนกลับเป็นค่าเริ่มต้น
  resetAllStudentsPasswordInClassroom(classroomId: string): { successCount: number; studentCodes: string[] } {
    const list = getLocalStudents(classroomId);
    if (list.length === 0) return { successCount: 0, studentCodes: [] };
    const updated = list.map((s) => ({
      ...s,
      passwordHash: null,
      isPasswordChanged: false,
    }));
    saveLocalStudents(classroomId, updated);
    inMemoryStudentCache[classroomId] = updated;
    return {
      successCount: updated.length,
      studentCodes: updated.map((s) => s.code),
    };
  },

  // ดึงรูปโปรไฟล์นักเรียน (รองรับทั้งรูปที่อัปโหลดเองและรูปเริ่มต้น)
  getStudentAvatar(code?: string, fallback?: string): string {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) return fallback || '/images/banners/student-avatar.png';
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`kp_student_avatar_${cleanCode}`);
      if (saved) return saved;
    }
    const found = this.findStudentByCode(cleanCode);
    if (found?.student?.avatarUrl) return found.student.avatarUrl;
    return fallback || '/images/banners/student-avatar.png';
  },

  // อัปเดตรูปภาพโปรไฟล์นักเรียน
  updateStudentAvatar(code: string, avatarUrl: string): boolean {
    const cleanCode = String(code || '').trim();
    if (!cleanCode || !avatarUrl) return false;

    // 1. บันทึกรูปลงคีย์ประจำตัวนักเรียนเดี่ยวเสมอ (จะถูก Cloud Sync ไปยัง Supabase อัตโนมัติและไม่หายเมื่อรีเฟรช)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`kp_student_avatar_${cleanCode}`, avatarUrl);
      } catch {
        // ignore quota
      }
    }

    // 2. อัปเดตข้อมูลในบัญชีนักเรียนห้องเรียน (cls_students_<classroomId>) หากมีอยู่ในแคช
    const found = this.findStudentByCode(cleanCode);
    if (found) {
      const { student, classroomId } = found;
      const list = getLocalStudents(classroomId);
      const updated = list.map((s) =>
        s.code === student.code || s.id === student.id
          ? { ...s, avatarUrl }
          : s
      );
      saveLocalStudents(classroomId, updated);
      inMemoryStudentCache[classroomId] = updated;
    }

    // 3. หากบัญชีที่ล็อกอินอยู่คือผู้ใช้นี้ ให้ปรับปรุง Auth Session (cls_current_auth_user) ทันที
    let updatedAuthUser: any = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const rawAuth = localStorage.getItem('cls_current_auth_user');
        if (rawAuth) {
          const authUser = JSON.parse(rawAuth);
          if (
            authUser?.studentCode === cleanCode ||
            authUser?.id === cleanCode ||
            String(authUser?.studentCode).trim() === cleanCode
          ) {
            authUser.avatarUrl = avatarUrl;
            localStorage.setItem('cls_current_auth_user', JSON.stringify(authUser));
            updatedAuthUser = authUser;
          }
        }
      } catch {
        // ignore
      }
    }

    // 4. ส่ง Event แจ้งเตือนทุก View และ Component ให้แสดงภาพใหม่ทันที
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kps-student-avatar-updated', {
          detail: { studentCode: cleanCode, avatarUrl },
        })
      );
      if (updatedAuthUser) {
        window.dispatchEvent(
          new CustomEvent('kps-auth-changed', {
            detail: { user: updatedAuthUser },
          })
        );
      }
    }
    return true;
  },

  // READ: List students in classroom (3-Tier Cache + Watermark Delta Sync + Candidate Merge)
  async getByClassroom(classroomId: string, forceRefresh?: boolean): Promise<StudentRecord[]> {
    const local = getLocalStudents(classroomId);
    try {
      const remote = await masterDataService.getStudentsByRoom(classroomId, forceRefresh);
      if (remote && remote.length > 0) {
        // รวมนักเรียนจาก Remote กับ Local โดยไม่ทำให้นักเรียนสูญหาย (Zero Student Loss)
        const mergedMap = new Map<string, StudentRecord>();
        for (const loc of local) {
          const key = (loc.code || loc.studentCode || loc.id || '').trim();
          if (key) mergedMap.set(key, loc);
        }
        for (const rem of remote as StudentRecord[]) {
          const key = (rem.code || rem.studentCode || rem.id || '').trim();
          if (key) {
            const existing = mergedMap.get(key);
            mergedMap.set(key, existing ? { ...existing, ...rem } : rem);
          }
        }

        const { students: normalized } = normalizeRoomRollNumbers(Array.from(mergedMap.values()));
        saveLocalStudents(classroomId, normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('[studentService] masterDataService fallback to local students:', err);
    }
    return local;
  },

  // CREATE: Add new student
  async create(classroomId: string, input: StudentCreateInput): Promise<StudentRecord> {
    const validated = StudentCreateSchema.parse(input);
    const parsedName = parseThaiStudentName(validated.name);
    const studentId = `stu-${validated.studentCode}`;

    const current = getLocalStudents(classroomId);
    let finalStudentNo = validated.studentNo;
    const existingNos = new Set(
      current.filter((s) => s.code !== validated.studentCode && s.id !== studentId).map((s) => s.no)
    );
    if (existingNos.has(finalStudentNo)) {
      finalStudentNo = Math.max(0, ...current.map((s) => s.no)) + 1;
    }

    const newStudent: StudentRecord = {
      id: studentId,
      no: finalStudentNo,
      code: validated.studentCode,
      name: validated.name,
      attendance: '0/0',
      score: 0,
      status: validated.status,
      gender: parsedName.gender,
      avatarUrl: parsedName.gender === 'FEMALE' ? '/images/banners/student-avatar-girl.png' : '/images/banners/student-avatar.png',
      classroomId,
    };

    if (isSupabaseConfigured) {
      logDbOperation('UPSERT INTO Student & Enrollment', { classroomId, ...newStudent });
      try {
        await supabase.from('Student').upsert({
          id: studentId,
          studentCode: validated.studentCode,
          title: parsedName.title,
          firstName: parsedName.firstName,
          lastName: parsedName.lastName,
          gender: parsedName.gender,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to upsert Student in Supabase:', err);
      }

      try {
        const { gradeLevel, roomNumber } = parseGradeAndRoom(classroomId);
        await supabase.from('StudentEnrollment').upsert({
          id: `enr-${studentId}`,
          studentId: studentId,
          academicYear: 2569,
          term: 1,
          classRoomId: classroomId,
          rollNumber: newStudent.no,
          gradeLevel,
          roomNumber,
          status: 'ENROLLED',
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to upsert StudentEnrollment in Supabase:', err);
      }
    }

    const updated = [
      ...current.filter((s) => s.code !== newStudent.code && s.id !== newStudent.id),
      newStudent,
    ].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, updated);
    masterDataService.invalidateRoom(classroomId);

    return newStudent;
  },

  // UPDATE: Update student info
  async update(classroomId: string, id: string, updates: Partial<StudentRecord>): Promise<StudentRecord> {
    const current = getLocalStudents(classroomId);
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('ไม่พบข้อมูลนักเรียน');

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    saveLocalStudents(classroomId, current);
    masterDataService.invalidateRoom(classroomId);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Student WHERE id = ${id}`, updates);
      try {
        const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (updates.name) {
          const parsed = parseThaiStudentName(updates.name);
          payload.title = parsed.title;
          payload.firstName = parsed.firstName;
          payload.lastName = parsed.lastName;
        }
        if (updates.code) payload.studentCode = updates.code;
        if (updates.gender) payload.gender = updates.gender;
        await supabase.from('Student').update(payload).eq('id', id);

        if (updates.no !== undefined) {
          await supabase
            .from('StudentEnrollment')
            .update({ rollNumber: updates.no, updatedAt: new Date().toISOString() })
            .eq('studentId', id)
            .eq('classRoomId', classroomId);
        }
      } catch (err) {
        console.warn('Error updating student in Supabase:', err);
      }
    }

    activityAuditLogService.logUpdate(
      'นักเรียน',
      `แก้ไขข้อมูลนักเรียน "${updated.name}"`,
      `อัปเดตข้อมูลนักเรียน ${updated.name} (เลขที่ ${updated.no}) ในห้อง ${classroomId}`,
      1,
      undefined,
      'ครูผู้สอน',
      { studentId: id, classroomId }
    ).catch(() => {});

    return updated;
  },

  // REORDER STUDENTS: Move up / Move down with Save Confirmation & Zero Student Loss
  async reorderStudents(classroomId: string, orderedStudentIds: string[]): Promise<StudentRecord[]> {
    const current = getLocalStudents(classroomId);
    const reordered: StudentRecord[] = [];
    const usedKeys = new Set<string>();

    for (let i = 0; i < orderedStudentIds.length; i++) {
      const id = orderedStudentIds[i];
      const found = current.find((s) => s.id === id || s.code === id);
      if (found) {
        const key = (found.code || found.id).trim();
        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          reordered.push({ ...found, no: reordered.length + 1 });
        }
      }
    }

    // ป้องกันนักเรียนตกหล่น (Zero Student Loss): รวมนักเรียนที่ไม่อยู่ใน orderedStudentIds ต่อท้าย
    for (const stu of current) {
      const key = (stu.code || stu.id).trim();
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        reordered.push({ ...stu, no: reordered.length + 1 });
      }
    }

    const { students: finalStudents } = normalizeRoomRollNumbers(reordered);
    saveLocalStudents(classroomId, finalStudents);

    activityAuditLogService.recordLog({
      actionType: 'BATCH_UPDATE',
      entityType: 'นักเรียน',
      title: `จัดเรียงลำดับเลขที่นักเรียนห้อง ${classroomId}`,
      summary: `จัดเรียงเลขที่ใหม่ 1 ถึง ${finalStudents.length} สำเร็จเรียบร้อย ในห้อง ${classroomId}`,
      itemCount: finalStudents.length,
      targetScope: classroomId,
      actor: 'ครูผู้สอน',
    }).catch(() => {});

    if (isSupabaseConfigured) {
      logDbOperation('REORDER STUDENTS in StudentEnrollment', { count: finalStudents.length });
      try {
        const { gradeLevel, roomNumber } = parseGradeAndRoom(classroomId);
        for (let i = 0; i < finalStudents.length; i++) {
          const stu = finalStudents[i];
          await supabase
            .from('StudentEnrollment')
            .update({
              rollNumber: i + 1,
              gradeLevel,
              roomNumber,
              updatedAt: new Date().toISOString(),
            })
            .eq('studentId', stu.id)
            .eq('classRoomId', classroomId);
        }
      } catch (err) {
        console.warn('Failed to update rollNumbers in Supabase:', err);
      }
    }

    return finalStudents;
  },

  // UPDATE PERSONAL INFO: Edit personal details (Name, Code, Gender, etc.)
  async updateStudentPersonalInfo(
    classroomId: string,
    studentId: string,
    info: {
      title?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      code?: string;
      gender?: 'MALE' | 'FEMALE';
    }
  ): Promise<StudentRecord> {
    let title = info.title;
    let firstName = info.firstName;
    let lastName = info.lastName;
    let gender = info.gender;
    if (info.name && (!firstName || !lastName)) {
      const parsed = parseThaiStudentName(info.name);
      if (!title) title = parsed.title;
      if (!firstName) firstName = parsed.firstName;
      if (!lastName) lastName = parsed.lastName;
      if (!gender) gender = parsed.gender;
    }

    const fullName = info.name || `${title || ''} ${firstName || ''} ${lastName || ''}`.trim();
    return this.update(classroomId, studentId, {
      name: fullName,
      code: info.code,
      gender,
      avatarUrl: gender === 'FEMALE'
        ? '/images/banners/student-avatar-girl.png'
        : '/images/banners/student-avatar.png',
    });
  },

  // DELETE: Soft delete student (Retain historical record until official dismissal)
  async delete(classroomId: string, id: string): Promise<boolean> {
    const current = getLocalStudents(classroomId);
    const target = current.find((s) => s.id === id);
    if (!target) return false;

    const filtered = current.filter((s) => s.id !== id);
    saveLocalStudents(classroomId, filtered);
    masterDataService.invalidateRoom(classroomId);

    // ล้างประวัติการเช็คชื่อของนักเรียนคนนี้ออกจากระบบเช็คชื่อด้วย
    try {
      attendanceCorrelationService.deleteStudentAttendance(
        target.code || target.studentCode || target.id,
        classroomId
      );
    } catch (err) {
      console.warn('Failed to delete student attendance records:', err);
    }

    if (isSupabaseConfigured) {
      logDbOperation(`SOFT DELETE Student/StudentEnrollment: ${id}`);
      try {
        await supabase
          .from('StudentEnrollment')
          .update({ status: 'DROPPED', updatedAt: new Date().toISOString() })
          .eq('studentId', id)
          .eq('classRoomId', classroomId);

        await supabase
          .from('Student')
          .update({
            status: 'SUSPENDED',
            deletedAt: new Date().toISOString(),
            deletionReason: 'DISMISSED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Soft-delete in Supabase failed:', err);
      }
    }

    activityAuditLogService.logDelete(
      'นักเรียน',
      `ลบข้อมูลนักเรียน "${target.name}"`,
      `ลบนักเรียนเลขที่ ${target.no} (${target.code || target.id}) ออกจากห้อง ${classroomId}`,
      1,
      'ครูผู้สอน',
      { studentId: id, classroomId, code: target.code }
    ).catch(() => {});

    return true;
  },

  // BATCH IMPORT: Import from SGS Excel with Real-time Progress Tracking
  async batchImport(
    classroomId: string,
    students: Array<Omit<StudentRecord, 'id'>>,
    options?: BatchImportOptions
  ): Promise<number> {
    const term = options?.term ?? 2;
    const academicYear = options?.academicYear ?? 2569;
    const roomName = options?.roomName;
    const onProgress = options?.onProgress;

    const current = getLocalStudents(classroomId);
    const newItems: StudentRecord[] = students.map((s, idx) => {
      const parsed = parseThaiStudentName(s.name);
      const studentCode = s.code || `${Date.now()}-${idx}`;
      return {
        ...s,
        id: (s as any).id || `stu-${studentCode}`,
        code: studentCode,
        gender: s.gender || parsed.gender,
        avatarUrl:
          s.avatarUrl ||
          (parsed.gender === 'FEMALE'
            ? '/images/banners/student-avatar-girl.png'
            : '/images/banners/student-avatar.png'),
        classroomId,
      };
    });

    // หากเป็นการนำเข้าบัญชีรายชื่อห้องเรียนขนาดเต็ม (เช่น ไฟล์ SGS >= 15 คน)
    // ให้แทนที่รายชื่อห้องเรียนด้วยชุดข้อมูลใหม่ที่ถูกต้อง แทนที่จะนำเข้าต่อท้ายขยะข้อมูลเก่า
    const isFullRosterImport = newItems.length >= 15;
    const combined = isFullRosterImport
      ? newItems
      : [
          ...current.filter((c) => !newItems.some((n) => n.code === c.code || n.id === c.id)),
          ...newItems,
        ];
    const { students: normalizedCombined } = normalizeRoomRollNumbers(combined);
    saveLocalStudents(classroomId, normalizedCombined);

    if (isSupabaseConfigured) {
      logDbOperation('BATCH UPSERT INTO Student', { count: normalizedCombined.length });
      let processed = 0;
      const CHUNK_SIZE = 15;
      const { gradeLevel, roomNumber } = parseGradeAndRoom(classroomId);

      for (let i = 0; i < normalizedCombined.length; i += CHUNK_SIZE) {
        const chunk = normalizedCombined.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (item) => {
            const parsed = parseThaiStudentName(item.name);
            try {
              await supabase.from('Student').upsert(
                {
                  id: item.id,
                  studentCode: item.code,
                  title: parsed.title,
                  firstName: parsed.firstName,
                  lastName: parsed.lastName,
                  gender: item.gender || parsed.gender,
                  status: item.status || 'ACTIVE',
                  updatedAt: new Date().toISOString(),
                },
                { onConflict: 'studentCode' }
              );

              await supabase.from('StudentEnrollment').upsert(
                {
                  id: `enr-${academicYear}-${term}-${item.code}`,
                  studentId: item.id,
                  academicYear,
                  term,
                  classRoomId: classroomId,
                  rollNumber: item.no,
                  gradeLevel,
                  roomNumber,
                  status: 'ENROLLED',
                  updatedAt: new Date().toISOString(),
                },
                { onConflict: 'studentId,academicYear,term' }
              );
            } catch (err) {
              console.warn('[studentService] batchImport upsert error:', err);
            }
          })
        );

        processed += chunk.length;
        if (onProgress) {
          const lastItem = chunk[chunk.length - 1];
          onProgress({
            current: Math.min(processed, newItems.length),
            total: newItems.length,
            percentage: Math.min(100, Math.round((processed / newItems.length) * 100)),
            currentStudentName: lastItem?.name,
            roomName,
          });
        }
      }
    } else if (onProgress) {
      // Local mode instant progress completion
      onProgress({
        current: newItems.length,
        total: newItems.length,
        percentage: 100,
        roomName,
      });
    }

    return newItems.length;
  },

  // Alias for compatibility
  async importBatch(
    classroomId: string,
    students: Array<Omit<StudentRecord, 'id'>>,
    options?: BatchImportOptions
  ): Promise<number> {
    return this.batchImport(classroomId, students, options);
  },
};

