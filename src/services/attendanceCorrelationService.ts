/**
 * Smart Attendance Correlation Service & 4 Integrity Locks Engine
 *
 * Implements centralized correlation logic between Morning Assembly and Period Attendance
 * under 4 strict architectural integrity locks:
 * 1. Provenance Tracking & Override Shield (source: MANUAL | SYSTEM_CORRELATION | APPROVED_ACTIVITY, isOverridden)
 * 2. Truancy Candidate & Conditional Promotion (PRESENT morning + ABSENT period => TRUANCY)
 * 3. Decoupled Morning Late Promotion (ABSENT morning + Period 1 PRESENT/LATE => LATE morning)
 * 4. Unified 80% Attendance Denominator Rule (Earned = PRESENT + LATE + ACTIVITY / Total)
 *
 * Design System: Pastel Anime Education Dashboard (Prompt typography, #163A66, #1D75D8, #10B981)
 */

export type AttendanceStatusCode =
  | 'PRESENT'   // มาเรียน / มาแถวปกติ (ได้เวลาเรียน 100%)
  | 'LATE'      // มาสาย (ได้เวลาเรียน 100%)
  | 'ABSENT'    // ขาดเรียน (ไม่ได้เวลาเรียน 0%)
  | 'LEAVE'     // ลาป่วย / ลากิจ (ไม่ได้เวลาเรียน แต่แยกสถิติ)
  | 'ACTIVITY'  // กิจกรรมโรงเรียนที่ได้รับอนุมัติ (ได้เวลาเรียน 100%)
  | 'TRUANCY';  // โดดเรียน / อยู่ในโรงเรียนแต่ไม่เข้าคาบ (ไม่ได้เวลาเรียน 0%)

export type AttendanceRecordSource =
  | 'MANUAL'              // ครูประจำวิชา / ครูที่ปรึกษาบันทึกเอง
  | 'SYSTEM_CORRELATION'  // ระบบอนุมานจากความสัมพันธ์แถวเช้า-คาบเรียน
  | 'APPROVED_ACTIVITY';  // ระบบดึงมาจากกิจกรรมหรือคำสั่งโรงเรียนที่ได้รับอนุมัติ

export interface AttendanceAuditLog {
  timestamp: string;
  actorId: string;
  actorName: string;
  previousStatus?: AttendanceStatusCode;
  newStatus: AttendanceStatusCode;
  reason?: string;
  source: AttendanceRecordSource;
}

export interface MorningAssemblyRecord {
  id: string;
  date: string;              // YYYY-MM-DD
  classroomId: string;       // e.g. 'room-3-1'
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatusCode;
  source: AttendanceRecordSource;
  isOverridden: boolean;
  overrideBy?: string;
  overrideAt?: string;
  overrideReason?: string;
  correlationNote?: string;
  markedAt: string;
}

export interface PeriodAttendanceRecord {
  id: string;
  date: string;              // YYYY-MM-DD
  classroomId: string;       // e.g. 'room-3-1'
  courseCode: string;        // e.g. 'ศ23101'
  courseName: string;
  periodNo: number;          // 1, 2, 3, ...
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatusCode;
  source: AttendanceRecordSource;
  isOverridden: boolean;
  overrideBy?: string;
  overrideAt?: string;
  overrideReason?: string;
  correlationNote?: string;
  isTruancyCandidate?: boolean;
  markedAt: string;
}

export interface ApprovedSchoolActivity {
  id: string;
  title: string;
  date: string;              // YYYY-MM-DD
  startPeriod: number;
  endPeriod: number;
  approverName: string;
  participatingStudentCodes: string[];
}

export interface ApprovedStudentLeave {
  id: string;
  studentCode: string;
  studentName?: string;
  date: string;              // YYYY-MM-DD
  startPeriod?: number;
  endPeriod?: number;
  leaveType: 'SICK' | 'PERSONAL' | 'OFFICIAL';
  reason?: string;
  approvedBy: string;
}

export interface Attendance80Summary {
  studentCode: string;
  courseCode: string;
  totalScheduledPeriods: number;
  earnedPeriods: number;
  presentCount: number;
  lateCount: number;
  activityCount: number;
  leaveCount: number;
  absentCount: number;
  truancyCount: number;
  attendanceRate: number;    // 0 - 100 percentage
  isEligibleForExam: boolean; // attendanceRate >= 80%
}

export interface CorrelationChange {
  type: 'MORNING_LATE_PROMOTION' | 'PERIOD_TRUANCY_PROMOTION';
  recordId: string;
  studentCode: string;
  studentName: string;
  periodNo?: number;
  courseCode?: string;
  oldStatus: AttendanceStatusCode;
  newStatus: AttendanceStatusCode;
  reason: string;
}

export interface CorrelationResult {
  classroomId: string;
  date: string;
  changes: CorrelationChange[];
  totalTruanciesDetected: number;
  totalLatePromotions: number;
  updatedMorningRecords: MorningAssemblyRecord[];
  updatedPeriodRecords: PeriodAttendanceRecord[];
}

export interface MorningAssemblyStats {
  classroomId: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  activityCount: number;
  attendanceRate: number;
}

// ----------------------------------------------------
// Storage Keys & Universal Storage Adapter
// ----------------------------------------------------
export const STORAGE_KEYS = {
  MORNING_ASSEMBLY: 'kp_morning_assembly_records',
  PERIOD_ATTENDANCE: 'kp_period_attendance_records',
  APPROVED_ACTIVITIES: 'kp_approved_school_activities',
  APPROVED_LEAVES: 'kp_approved_student_leaves',
} as const;

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStore = new Map<string, string>();

const getStorage = (): StorageAdapter => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  };
};

const readStorage = <T>(key: string, fallback: T): T => {
  const raw = getStorage().getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, value: T): void => {
  getStorage().setItem(key, JSON.stringify(value));
};

// ----------------------------------------------------
// Classroom & Course Code Normalization
// ----------------------------------------------------
export const normalizeClassroomId = (id: string): string => {
  if (!id) return '';
  const trimmed = id.trim();
  if (trimmed === 'ม.3/1' || trimmed === 'room-3-1') return 'room-3-1';
  if (trimmed === 'ม.3/2' || trimmed === 'room-3-2') return 'room-3-2';
  if (trimmed === 'ม.1/8' || trimmed === 'room-1-8') return 'room-1-8';
  if (trimmed === 'ม.2/8' || trimmed === 'room-2-8') return 'room-2-8';
  if (trimmed === 'ม.3/8' || trimmed === 'room-3-8') return 'room-3-8';
  return trimmed;
};

export const normalizeCourseCode = (code: string): string => {
  if (!code) return '';
  const match = code.trim().match(/^([ก-๙a-zA-Z0-9]+)/);
  return match ? match[1] : code.trim();
};

// ----------------------------------------------------
// Mock Data Baseline (Matching room-3-1 / defaultStudents)
// ----------------------------------------------------
const ROOM_3_1_STUDENTS = [
  { id: 'stu-1', code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์' },
  { id: 'stu-2', code: '45102', name: 'ด.ช. ธีรานุ เดชปันคำ' },
  { id: 'stu-7', code: '45107', name: 'ด.ช. ภูรินท์ บัณฑิต' },
  { id: 'stu-10', code: '45110', name: 'ด.ช. อัศวิน วนเกษตรกุล' },
  { id: 'stu-12', code: '45112', name: 'ด.ช. ชัยมงคล วงศ์บุตร' },
  { id: 'stu-15', code: '45115', name: 'ด.ช. หัตเธน คำฝั้น' },
  { id: 'stu-22', code: '45122', name: 'ด.ญ. อดาราน์ จิรากร' },
  { id: 'stu-23', code: '45123', name: 'ด.ญ. ปริยาภรณ์ ชัยแก้ว' },
];

export const generateMockMorningRecords = (): MorningAssemblyRecord[] => {
  const dates = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'];
  const records: MorningAssemblyRecord[] = [];

  for (const date of dates) {
    const isToday = date === '2026-10-02';
    for (const stu of ROOM_3_1_STUDENTS) {
      let status: AttendanceStatusCode = 'PRESENT';
      if (isToday) {
        if (stu.code === '45107') status = 'ABSENT';
        else if (stu.code === '45112') status = 'LATE';
        else if (stu.code === '45122') status = 'LEAVE';
        else status = 'PRESENT';
      } else {
        if (stu.code === '45107' && date === '2026-09-30') status = 'ABSENT';
        else if (stu.code === '45112' && date === '2026-10-01') status = 'LATE';
      }

      records.push({
        id: `morning-${date}-${stu.code}`,
        date,
        classroomId: 'room-3-1',
        studentId: stu.id,
        studentCode: stu.code,
        studentName: stu.name,
        status,
        source: 'MANUAL',
        isOverridden: false,
        markedAt: `${date}T07:55:00.000Z`,
      });
    }
  }

  return records;
};

export const generateMockPeriodRecords = (): PeriodAttendanceRecord[] => {
  const records: PeriodAttendanceRecord[] = [];

  // 1. Today 2026-10-02: Period 1 (ศ23101 ศิลปะ ม.3/1)
  for (const stu of ROOM_3_1_STUDENTS) {
    let status: AttendanceStatusCode = 'PRESENT';
    let source: AttendanceRecordSource = 'MANUAL';

    if (stu.code === '45110') {
      status = 'ABSENT'; // Morning PRESENT + Period ABSENT => Candidate for Lock 2 Truancy
    } else if (stu.code === '45115') {
      status = 'ACTIVITY';
      source = 'APPROVED_ACTIVITY';
    } else if (stu.code === '45122') {
      status = 'LEAVE';
    } else if (stu.code === '45112') {
      status = 'LATE';
    }

    records.push({
      id: `per-20261002-p1-${stu.code}`,
      date: '2026-10-02',
      classroomId: 'room-3-1',
      courseCode: 'ศ23101',
      courseName: 'ศิลปะ',
      periodNo: 1,
      studentId: stu.id,
      studentCode: stu.code,
      studentName: stu.name,
      status,
      source,
      isOverridden: false,
      markedAt: '2026-10-02T08:35:00.000Z',
    });
  }

  // 2. Historical term records for course ศ23101 to build realistic 80% rule profiles
  const historicalDates = [
    '2026-09-01', '2026-09-03', '2026-09-08', '2026-09-10',
    '2026-09-15', '2026-09-17', '2026-09-22', '2026-09-24',
    '2026-09-29', '2026-10-01',
  ];

  historicalDates.forEach((hDate, idx) => {
    for (const stu of ROOM_3_1_STUDENTS) {
      let hStatus: AttendanceStatusCode = 'PRESENT';
      if (stu.code === '45107' && idx % 3 === 0) {
        hStatus = 'ABSENT'; // 45107 at risk
      } else if (stu.code === '45110' && idx % 4 === 0) {
        hStatus = 'ABSENT';
      } else if (stu.code === '45112' && idx % 5 === 0) {
        hStatus = 'LATE';
      }

      records.push({
        id: `per-hist-${hDate}-p1-${stu.code}`,
        date: hDate,
        classroomId: 'room-3-1',
        courseCode: 'ศ23101',
        courseName: 'ศิลปะ',
        periodNo: 1,
        studentId: stu.id,
        studentCode: stu.code,
        studentName: stu.name,
        status: hStatus,
        source: 'MANUAL',
        isOverridden: false,
        markedAt: `${hDate}T08:35:00.000Z`,
      });
    }
  });

  return records;
};

export const defaultMockActivities: ApprovedSchoolActivity[] = [
  {
    id: 'act-music-district',
    title: 'การแข่งขันวงดนตรีไทยและสากลระดับเขตพื้นที่',
    date: '2026-10-02',
    startPeriod: 1,
    endPeriod: 4,
    approverName: 'ผอ. สมศักดิ์ เกียรติเจริญ',
    participatingStudentCodes: ['45115'],
  },
];

export const defaultMockLeaves: ApprovedStudentLeave[] = [
  {
    id: 'leave-45122-today',
    studentCode: '45122',
    studentName: 'ด.ญ. อดาราน์ จิรากร',
    date: '2026-10-02',
    leaveType: 'SICK',
    reason: 'มีไข้สูงและเจ็บคอ แพทย์สั่งหยุดพัก 1 วัน',
    approvedBy: 'ครูภาสภูมิ เรืองปราชญ์',
  },
];

// ----------------------------------------------------
// Smart Attendance Correlation Engine Service
// ----------------------------------------------------
export const attendanceCorrelationService = {
  /**
   * Reset all storage to pristine realistic mock state
   */
  resetToMockData(): void {
    writeStorage(STORAGE_KEYS.MORNING_ASSEMBLY, generateMockMorningRecords());
    writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, generateMockPeriodRecords());
    writeStorage(STORAGE_KEYS.APPROVED_ACTIVITIES, defaultMockActivities);
    writeStorage(STORAGE_KEYS.APPROVED_LEAVES, defaultMockLeaves);
  },

  // ====================================================
  // Morning Assembly Records
  // ====================================================
  getMorningRecords(classroomId: string, date: string): MorningAssemblyRecord[] {
    const list = readStorage<MorningAssemblyRecord[]>(STORAGE_KEYS.MORNING_ASSEMBLY, []);
    const targetRoom = normalizeClassroomId(classroomId);

    const filtered = list.filter(
      (r) => r.date === date && normalizeClassroomId(r.classroomId) === targetRoom
    );

    if (filtered.length > 0) {
      return filtered;
    }

    // If storage is completely empty, initialize default mock baseline
    if (list.length === 0) {
      const initial = generateMockMorningRecords();
      writeStorage(STORAGE_KEYS.MORNING_ASSEMBLY, initial);
      return initial.filter(
        (r) => r.date === date && normalizeClassroomId(r.classroomId) === targetRoom
      );
    }

    return [];
  },

  getAllMorningRecords(): MorningAssemblyRecord[] {
    return readStorage<MorningAssemblyRecord[]>(STORAGE_KEYS.MORNING_ASSEMBLY, []);
  },

  saveMorningRecords(records: MorningAssemblyRecord[]): void {
    const existing = readStorage<MorningAssemblyRecord[]>(STORAGE_KEYS.MORNING_ASSEMBLY, []);
    const recordMap = new Map(existing.map((r) => [r.id, r]));

    for (const rec of records) {
      recordMap.set(rec.id, rec);
    }

    writeStorage(STORAGE_KEYS.MORNING_ASSEMBLY, Array.from(recordMap.values()));
  },

  markMorningRecord(
    params: Partial<MorningAssemblyRecord> & {
      classroomId: string;
      studentCode: string;
      date: string;
      status: AttendanceStatusCode;
    }
  ): MorningAssemblyRecord {
    const targetRoom = normalizeClassroomId(params.classroomId);
    const existingList = readStorage<MorningAssemblyRecord[]>(STORAGE_KEYS.MORNING_ASSEMBLY, []);
    const existingIndex = existingList.findIndex(
      (r) => r.date === params.date && r.studentCode === params.studentCode
    );

    const updatedRecord: MorningAssemblyRecord = {
      id: params.id || (existingIndex >= 0 ? existingList[existingIndex].id : `morning-${params.date}-${params.studentCode}`),
      date: params.date,
      classroomId: targetRoom,
      studentId: params.studentId || (existingIndex >= 0 ? existingList[existingIndex].studentId : `stu-${params.studentCode}`),
      studentCode: params.studentCode,
      studentName: params.studentName || (existingIndex >= 0 ? existingList[existingIndex].studentName : ''),
      status: params.status,
      source: params.source || 'MANUAL',
      isOverridden: params.isOverridden ?? false,
      overrideBy: params.overrideBy,
      overrideAt: params.overrideAt,
      overrideReason: params.overrideReason,
      correlationNote: params.correlationNote,
      markedAt: params.markedAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      existingList[existingIndex] = updatedRecord;
    } else {
      existingList.push(updatedRecord);
    }

    writeStorage(STORAGE_KEYS.MORNING_ASSEMBLY, existingList);
    return updatedRecord;
  },

  batchMarkMorningAssembly(
    classroomId: string,
    date: string,
    status: AttendanceStatusCode,
    _actorName = 'ครูที่ปรึกษา'
  ): MorningAssemblyRecord[] {
    const records = this.getMorningRecords(classroomId, date);
    const now = new Date().toISOString();

    const updated = records.map((record) => {
      // Respect Lock 1: Shield manual overrides from batch resets unless explicitly intended
      if (record.isOverridden) {
        return record;
      }
      return {
        ...record,
        status,
        source: 'MANUAL' as AttendanceRecordSource,
        markedAt: now,
      };
    });

    this.saveMorningRecords(updated);
    return updated;
  },

  overrideMorningRecord(params: {
    id: string;
    newStatus: AttendanceStatusCode;
    overrideBy: string;
    overrideReason?: string;
  }): MorningAssemblyRecord {
    const list = readStorage<MorningAssemblyRecord[]>(STORAGE_KEYS.MORNING_ASSEMBLY, []);
    const idx = list.findIndex((r) => r.id === params.id);
    if (idx === -1) {
      throw new Error(`Morning assembly record not found: ${params.id}`);
    }

    const updated: MorningAssemblyRecord = {
      ...list[idx],
      status: params.newStatus,
      source: 'MANUAL',
      isOverridden: true,
      overrideBy: params.overrideBy,
      overrideAt: new Date().toISOString(),
      overrideReason: params.overrideReason || 'คุณครูแก้ไขด้วยตนเอง',
    };

    list[idx] = updated;
    writeStorage(STORAGE_KEYS.MORNING_ASSEMBLY, list);
    return updated;
  },

  getMorningAssemblyStats(classroomId: string, date: string): MorningAssemblyStats {
    const records = this.getMorningRecords(classroomId, date);
    const totalStudents = records.length;

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let activityCount = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'LATE') lateCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'LEAVE') leaveCount++;
      else if (r.status === 'ACTIVITY') activityCount++;
    }

    const earned = presentCount + lateCount + activityCount;
    const attendanceRate = totalStudents > 0 ? Number(((earned / totalStudents) * 100).toFixed(1)) : 100;

    return {
      classroomId,
      date,
      totalStudents,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      activityCount,
      attendanceRate,
    };
  },

  // ====================================================
  // Period Attendance Records
  // ====================================================
  getPeriodRecords(
    courseCode: string,
    classroomId: string,
    date: string,
    periodNo: number
  ): PeriodAttendanceRecord[] {
    const list = readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
    const targetRoom = normalizeClassroomId(classroomId);
    const targetCourse = normalizeCourseCode(courseCode);

    const filtered = list.filter(
      (r) =>
        r.date === date &&
        r.periodNo === periodNo &&
        normalizeClassroomId(r.classroomId) === targetRoom &&
        normalizeCourseCode(r.courseCode) === targetCourse
    );

    if (filtered.length > 0) {
      return filtered;
    }

    if (list.length === 0) {
      const initial = generateMockPeriodRecords();
      writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, initial);
      return initial.filter(
        (r) =>
          r.date === date &&
          r.periodNo === periodNo &&
          normalizeClassroomId(r.classroomId) === targetRoom &&
          normalizeCourseCode(r.courseCode) === targetCourse
      );
    }

    return [];
  },

  getPeriodRecordsByDateAndRoom(classroomId: string, date: string): PeriodAttendanceRecord[] {
    let list = readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
    if (list.length === 0) {
      list = generateMockPeriodRecords();
      writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, list);
    }
    const targetRoom = normalizeClassroomId(classroomId);
    return list.filter((r) => r.date === date && normalizeClassroomId(r.classroomId) === targetRoom);
  },

  getAllPeriodRecords(): PeriodAttendanceRecord[] {
    return readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
  },

  savePeriodRecords(records: PeriodAttendanceRecord[]): void {
    const existing = readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
    const recordMap = new Map(existing.map((r) => [r.id, r]));

    for (const rec of records) {
      recordMap.set(rec.id, rec);
    }

    writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, Array.from(recordMap.values()));
  },

  markPeriodRecord(
    params: Partial<PeriodAttendanceRecord> & {
      classroomId: string;
      courseCode: string;
      periodNo: number;
      studentCode: string;
      date: string;
      status: AttendanceStatusCode;
    }
  ): PeriodAttendanceRecord {
    const targetRoom = normalizeClassroomId(params.classroomId);
    const existingList = readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
    const existingIndex = existingList.findIndex(
      (r) =>
        r.date === params.date &&
        r.periodNo === params.periodNo &&
        r.studentCode === params.studentCode &&
        normalizeCourseCode(r.courseCode) === normalizeCourseCode(params.courseCode)
    );

    const updatedRecord: PeriodAttendanceRecord = {
      id:
        params.id ||
        (existingIndex >= 0
          ? existingList[existingIndex].id
          : `per-${params.date}-p${params.periodNo}-${params.studentCode}`),
      date: params.date,
      classroomId: targetRoom,
      courseCode: params.courseCode,
      courseName: params.courseName || (existingIndex >= 0 ? existingList[existingIndex].courseName : ''),
      periodNo: params.periodNo,
      studentId: params.studentId || (existingIndex >= 0 ? existingList[existingIndex].studentId : `stu-${params.studentCode}`),
      studentCode: params.studentCode,
      studentName: params.studentName || (existingIndex >= 0 ? existingList[existingIndex].studentName : ''),
      status: params.status,
      source: params.source || 'MANUAL',
      isOverridden: params.isOverridden ?? false,
      overrideBy: params.overrideBy,
      overrideAt: params.overrideAt,
      overrideReason: params.overrideReason,
      correlationNote: params.correlationNote,
      isTruancyCandidate: params.isTruancyCandidate ?? false,
      markedAt: params.markedAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      existingList[existingIndex] = updatedRecord;
    } else {
      existingList.push(updatedRecord);
    }

    writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, existingList);
    return updatedRecord;
  },

  overridePeriodRecord(params: {
    id: string;
    newStatus: AttendanceStatusCode;
    overrideBy: string;
    overrideReason?: string;
  }): PeriodAttendanceRecord {
    const list = readStorage<PeriodAttendanceRecord[]>(STORAGE_KEYS.PERIOD_ATTENDANCE, []);
    const idx = list.findIndex((r) => r.id === params.id);
    if (idx === -1) {
      throw new Error(`Period attendance record not found: ${params.id}`);
    }

    const updated: PeriodAttendanceRecord = {
      ...list[idx],
      status: params.newStatus,
      source: 'MANUAL',
      isOverridden: true,
      overrideBy: params.overrideBy,
      overrideAt: new Date().toISOString(),
      overrideReason: params.overrideReason || 'คุณครูแก้ไขด้วยตนเอง',
      isTruancyCandidate: false,
    };

    list[idx] = updated;
    writeStorage(STORAGE_KEYS.PERIOD_ATTENDANCE, list);
    return updated;
  },

  batchMarkPeriodAttendance(
    courseCode: string,
    classroomId: string,
    date: string,
    periodNo: number,
    status: AttendanceStatusCode,
    _actorName = 'ครูประจำวิชา'
  ): PeriodAttendanceRecord[] {
    const records = this.getPeriodRecords(courseCode, classroomId, date, periodNo);
    const now = new Date().toISOString();

    const updated = records.map((record) => {
      // Respect Lock 1: Shield manual overrides from batch resets
      if (record.isOverridden) {
        return record;
      }
      return {
        ...record,
        status,
        source: 'MANUAL' as AttendanceRecordSource,
        markedAt: now,
      };
    });

    this.savePeriodRecords(updated);
    return updated;
  },

  // ====================================================
  // Approved Activities & Leaves
  // ====================================================
  getApprovedActivities(date?: string): ApprovedSchoolActivity[] {
    const list = readStorage<ApprovedSchoolActivity[]>(STORAGE_KEYS.APPROVED_ACTIVITIES, defaultMockActivities);
    return date ? list.filter((a) => a.date === date) : list;
  },

  saveApprovedActivity(activity: ApprovedSchoolActivity): void {
    const list = readStorage<ApprovedSchoolActivity[]>(STORAGE_KEYS.APPROVED_ACTIVITIES, defaultMockActivities);
    const idx = list.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      list[idx] = activity;
    } else {
      list.push(activity);
    }
    writeStorage(STORAGE_KEYS.APPROVED_ACTIVITIES, list);
  },

  getApprovedLeaves(studentCode?: string, date?: string): ApprovedStudentLeave[] {
    const list = readStorage<ApprovedStudentLeave[]>(STORAGE_KEYS.APPROVED_LEAVES, defaultMockLeaves);
    return list.filter((l) => {
      if (studentCode && l.studentCode !== studentCode) return false;
      if (date && l.date !== date) return false;
      return true;
    });
  },

  saveApprovedLeave(leave: ApprovedStudentLeave): void {
    const list = readStorage<ApprovedStudentLeave[]>(STORAGE_KEYS.APPROVED_LEAVES, defaultMockLeaves);
    const idx = list.findIndex((l) => l.id === leave.id);
    if (idx >= 0) {
      list[idx] = leave;
    } else {
      list.push(leave);
    }
    writeStorage(STORAGE_KEYS.APPROVED_LEAVES, list);
  },

  // ====================================================
  // 4 Integrity Locks: Central Correlation Execution
  // ====================================================
  /**
   * Run bidirectional correlation between Morning Assembly and Period Attendance
   * strictly enforcing the 4 Integrity Locks:
   * - Lock 1: Never touch records where isOverridden === true
   * - Lock 2: Promote ABSENT period to TRUANCY if student was PRESENT/LATE at morning assembly
   * - Lock 3: Promote ABSENT morning to LATE if student attended Period 1 (decoupled from timestamp)
   */
  runCorrelation(classroomId: string, date: string): CorrelationResult {
    const normalizedRoom = normalizeClassroomId(classroomId);
    const morningRecords = this.getMorningRecords(normalizedRoom, date);
    const periodRecords = this.getPeriodRecordsByDateAndRoom(normalizedRoom, date);
    const activities = this.getApprovedActivities(date);
    const leaves = this.getApprovedLeaves(undefined, date);

    const changes: CorrelationChange[] = [];
    let morningChanged = false;
    let periodChanged = false;

    // --------------------------------------------------
    // Lock 3: Decoupled Morning Late Promotion (Evaluated First for Single-Pass Correlation)
    // --------------------------------------------------
    for (const record of morningRecords) {
      // Must obey Lock 1: shield overridden records from auto-update
      if (!record.isOverridden && record.status === 'ABSENT') {
        // Find Period 1 attendance for this student
        const p1Record = periodRecords.find(
          (p) => p.studentCode === record.studentCode && p.periodNo === 1
        );

        if (p1Record && (p1Record.status === 'PRESENT' || p1Record.status === 'LATE')) {
          const oldStatus = record.status;
          record.status = 'LATE';
          record.source = 'SYSTEM_CORRELATION';
          record.correlationNote =
            'ปรับเป็นสายอัตโนมัติ: พบนักเรียนเข้าเรียนในคาบที่ 1 (มิได้ขาดเรียนทั้งวัน)';

          changes.push({
            type: 'MORNING_LATE_PROMOTION',
            recordId: record.id,
            studentCode: record.studentCode,
            studentName: record.studentName,
            oldStatus,
            newStatus: 'LATE',
            reason: 'พบนักเรียนเข้าเรียนในคาบที่ 1 ปรับสถานะแถวเช้าเป็นมาสายโดยอัตโนมัติ',
          });
          morningChanged = true;
        }
      }
    }

    // --------------------------------------------------
    // Lock 2: Truancy Candidate & Promotion
    // --------------------------------------------------
    for (const record of periodRecords) {
      // Must obey Lock 1: shield overridden records from auto-update
      if (!record.isOverridden && record.status === 'ABSENT') {
        const morningRec = morningRecords.find((m) => m.studentCode === record.studentCode);

        // Student attended morning assembly (PRESENT or LATE)
        if (morningRec && (morningRec.status === 'PRESENT' || morningRec.status === 'LATE')) {
          // Check if student is participating in an approved school activity
          const inApprovedActivity = activities.some(
            (act) =>
              record.periodNo >= act.startPeriod &&
              record.periodNo <= act.endPeriod &&
              act.participatingStudentCodes.includes(record.studentCode)
          );

          // Check if student is on approved official leave
          const onApprovedLeave = leaves.some(
            (leave) =>
              leave.studentCode === record.studentCode &&
              (leave.startPeriod === undefined || record.periodNo >= leave.startPeriod) &&
              (leave.endPeriod === undefined || record.periodNo <= leave.endPeriod)
          );

          if (!inApprovedActivity && !onApprovedLeave) {
            const oldStatus = record.status;
            record.status = 'TRUANCY';
            record.source = 'SYSTEM_CORRELATION';
            record.isTruancyCandidate = true;
            record.correlationNote =
              'อนุมานจากระบบ: นักเรียนเข้าแถวเช้าแล้ว แต่ไม่เข้าเรียนในคาบนี้ (อาจโดดเรียนหรือติดภารกิจอื่น)';

            changes.push({
              type: 'PERIOD_TRUANCY_PROMOTION',
              recordId: record.id,
              studentCode: record.studentCode,
              studentName: record.studentName,
              periodNo: record.periodNo,
              courseCode: record.courseCode,
              oldStatus,
              newStatus: 'TRUANCY',
              reason: 'นักเรียนเข้าแถวเช้าแล้ว แต่ไม่เข้าเรียนในคาบนี้ โดยไม่มีใบลาหรือกิจกรรมอนุมัติ',
            });
            periodChanged = true;
          }
        }
      }
    }

    // Persist modifications back to storage
    if (morningChanged) {
      this.saveMorningRecords(morningRecords);
    }
    if (periodChanged) {
      this.savePeriodRecords(periodRecords);
    }

    return {
      classroomId: normalizedRoom,
      date,
      changes,
      totalTruanciesDetected: changes.filter((c) => c.type === 'PERIOD_TRUANCY_PROMOTION').length,
      totalLatePromotions: changes.filter((c) => c.type === 'MORNING_LATE_PROMOTION').length,
      updatedMorningRecords: morningRecords,
      updatedPeriodRecords: periodRecords,
    };
  },

  // ====================================================
  // Lock 4: Unified 80% Attendance Denominator Rule
  // ====================================================
  /**
   * Pure calculation engine for the standardized Thai MoE 80% attendance rule
   * Earned Periods = PRESENT + LATE + ACTIVITY
   * Rate = (Earned Periods / Total Scheduled Periods) * 100
   * Rate >= 80% => Eligible for Exam
   */
  compute80RuleFromRecords(
    studentCode: string,
    courseCode: string,
    records: Array<{ status: AttendanceStatusCode }>,
    totalScheduledPeriodsParam?: number
  ): Attendance80Summary {
    let presentCount = 0;
    let lateCount = 0;
    let activityCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let truancyCount = 0;

    for (const r of records) {
      switch (r.status) {
        case 'PRESENT':
          presentCount++;
          break;
        case 'LATE':
          lateCount++;
          break;
        case 'ACTIVITY':
          activityCount++;
          break;
        case 'LEAVE':
          leaveCount++;
          break;
        case 'ABSENT':
          absentCount++;
          break;
        case 'TRUANCY':
          truancyCount++;
          break;
      }
    }

    const earnedPeriods = presentCount + lateCount + activityCount;
    const totalScheduledPeriods = totalScheduledPeriodsParam ?? records.length;

    // Rate calculation strictly adhering to 0.8 / 80% threshold
    const attendanceRate =
      totalScheduledPeriods > 0
        ? Number(((earnedPeriods / totalScheduledPeriods) * 100).toFixed(1))
        : 100.0;

    const isEligibleForExam = attendanceRate >= 80.0;

    return {
      studentCode,
      courseCode: normalizeCourseCode(courseCode),
      totalScheduledPeriods,
      earnedPeriods,
      presentCount,
      lateCount,
      activityCount,
      leaveCount,
      absentCount,
      truancyCount,
      attendanceRate,
      isEligibleForExam,
    };
  },

  /**
   * Calculate 80% attendance summary from storage for a student in a course
   */
  calculateAttendance80Rule(
    studentCode: string,
    courseCode: string,
    totalScheduledPeriodsParam?: number
  ): Attendance80Summary {
    const allPeriodRecords = this.getAllPeriodRecords();
    const targetCourse = normalizeCourseCode(courseCode);

    const studentCourseRecords = allPeriodRecords.filter(
      (r) => r.studentCode === studentCode && normalizeCourseCode(r.courseCode) === targetCourse
    );

    return this.compute80RuleFromRecords(
      studentCode,
      courseCode,
      studentCourseRecords,
      totalScheduledPeriodsParam
    );
  },
};

// Export shorthand alias
export const attendanceCorrelationEngine = attendanceCorrelationService;
