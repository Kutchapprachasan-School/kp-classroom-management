/**
 * Pure Calculation Engine for Student Grade Promotion & Rollover Dry Run
 * 
 * IMPORTANT: This module consists exclusively of PURE FUNCTIONS.
 * It does NOT perform database writes, localStorage mutations, or side-effects.
 * Complies with Senior Backend Review architectural constraints.
 */

export type PromotionActionType =
  | 'PROMOTED'
  | 'REPEAT_GRADE'
  | 'SUSPENDED'
  | 'TRANSFERRED_OUT'
  | 'GRADUATION_PENDING'
  | 'GRADUATED';

export type GraduationApprovalStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'NOT_APPLICABLE';

export interface ClassroomMappingRule {
  sourceClassroom: string;     // e.g. 'ม.1/1'
  sourceGradeLevel: number;    // 1 (ม.1) ... 6 (ม.6)
  targetClassroom: string;     // e.g. 'ม.2/1' or 'ALUMNI'
  targetGradeLevel: number;    // 2 (ม.2) or 0 (Alumni)
  isTerminalGrade: boolean;    // true for ม.3 and ม.6
}

export interface StudentDryRunInput {
  studentCode: string;
  studentName: string;
  currentClassroom: string;
  attendancePercent?: number;  // 0 - 100
  gpa?: number;
  hasIncompleteAssignments?: boolean;
  manualExceptionAction?: 'REPEAT_GRADE' | 'SUSPENDED' | 'TRANSFERRED_OUT' | 'CUSTOM_TARGET_ROOM';
  customTargetRoom?: string;
  graduationApproved?: boolean;
  graduationApprover?: string;
  graduationApprovalDate?: string;
}

export interface StudentPromotionDecision {
  studentCode: string;
  studentName: string;
  currentClassroom: string;
  targetClassroom: string;
  targetGradeLevel: number;
  action: PromotionActionType;
  graduationStatus: GraduationApprovalStatus;
  reason: string;
  warnings: string[];
}

export interface PromotionDryRunConfig {
  fromAcademicYear: number;    // e.g. 2568
  toAcademicYear: number;      // e.g. 2569
  minAttendancePercentForGraduation?: number; // default 80
  classroomMappings: ClassroomMappingRule[];
}

export interface PromotionDryRunReport {
  isValid: boolean;
  fromAcademicYear: number;
  toAcademicYear: number;
  summary: {
    totalStudentsEvaluated: number;
    promotedCount: number;
    graduatedCount: number;
    repeatGradeCount: number;
    suspendedCount: number;
    transferredOutCount: number;
    pendingGraduationCount: number;
  };
  errors: string[];
  warnings: string[];
  decisions: StudentPromotionDecision[];
}

/**
 * Parses grade level number from a classroom string (e.g. 'ม.1/1' -> 1, 'ม.6/2' -> 6)
 */
export function parseGradeLevelFromRoom(roomName: string): number {
  const match = roomName.match(/ม\.(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Computes default classroom mappings based on standard progression:
 * ม.1/N -> ม.2/N
 * ม.2/N -> ม.3/N
 * ม.3/N -> ALUMNI (Terminal)
 * ม.4/N -> ม.5/N
 * ม.5/N -> ม.6/N
 * ม.6/N -> ALUMNI (Terminal)
 */
export function generateDefaultClassroomMappings(existingRooms: string[]): ClassroomMappingRule[] {
  return existingRooms.map((room) => {
    const grade = parseGradeLevelFromRoom(room);
    const roomPart = room.includes('/') ? room.split('/')[1] : '';

    if (grade === 3 || grade === 6) {
      return {
        sourceClassroom: room,
        sourceGradeLevel: grade,
        targetClassroom: 'ALUMNI',
        targetGradeLevel: 0,
        isTerminalGrade: true,
      };
    }

    if (grade >= 1 && grade <= 5) {
      const nextGrade = grade + 1;
      const targetRoom = roomPart ? `ม.${nextGrade}/${roomPart}` : `ม.${nextGrade}`;
      return {
        sourceClassroom: room,
        sourceGradeLevel: grade,
        targetClassroom: targetRoom,
        targetGradeLevel: nextGrade,
        isTerminalGrade: false,
      };
    }

    // Fallback for special or unparsed rooms
    return {
      sourceClassroom: room,
      sourceGradeLevel: grade,
      targetClassroom: room,
      targetGradeLevel: grade,
      isTerminalGrade: false,
    };
  });
}

/**
 * Evaluates promotion decision for a single student purely based on rules and inputs
 */
export function evaluateStudentPromotion(
  student: StudentDryRunInput,
  mappingRule: ClassroomMappingRule,
  config: PromotionDryRunConfig
): StudentPromotionDecision {
  const warnings: string[] = [];
  const minAttendance = config.minAttendancePercentForGraduation ?? 80;

  // Case 1: Manual Exception - TRANSFERRED_OUT (ย้ายสถานศึกษา)
  if (student.manualExceptionAction === 'TRANSFERRED_OUT') {
    return {
      studentCode: student.studentCode,
      studentName: student.studentName,
      currentClassroom: student.currentClassroom,
      targetClassroom: 'TRANSFERRED_OUT',
      targetGradeLevel: mappingRule.sourceGradeLevel,
      action: 'TRANSFERRED_OUT',
      graduationStatus: 'NOT_APPLICABLE',
      reason: 'ย้ายสถานศึกษาตามคำร้อง',
      warnings,
    };
  }

  // Case 2: Manual Exception - SUSPENDED (พักการเรียน)
  if (student.manualExceptionAction === 'SUSPENDED') {
    return {
      studentCode: student.studentCode,
      studentName: student.studentName,
      currentClassroom: student.currentClassroom,
      targetClassroom: 'SUSPENDED',
      targetGradeLevel: mappingRule.sourceGradeLevel,
      action: 'SUSPENDED',
      graduationStatus: 'NOT_APPLICABLE',
      reason: 'พักการเรียน (แขวนสถานะเพื่อรอการกลับเข้าเรียน)',
      warnings,
    };
  }

  // Case 3: Manual Exception - REPEAT_GRADE (ซ้ำชั้น)
  if (student.manualExceptionAction === 'REPEAT_GRADE') {
    // In repeater case, destination grade stays at sourceGradeLevel in the new academic year
    return {
      studentCode: student.studentCode,
      studentName: student.studentName,
      currentClassroom: student.currentClassroom,
      targetClassroom: student.customTargetRoom || student.currentClassroom,
      targetGradeLevel: mappingRule.sourceGradeLevel,
      action: 'REPEAT_GRADE',
      graduationStatus: 'NOT_APPLICABLE',
      reason: 'ซ้ำชั้น (ขึ้นทะเบียนระดับเดิมในปีการศึกษาใหม่)',
      warnings,
    };
  }

  // Case 4: Terminal Grades (ม.3 and ม.6) -> Graduation Gating
  if (mappingRule.isTerminalGrade) {
    if (student.hasIncompleteAssignments) {
      warnings.push('มีงานค้างส่งหรือติด ร/0 ที่ยังไม่ได้รับการแก้ไข');
    }

    if (student.attendancePercent !== undefined && student.attendancePercent < minAttendance) {
      warnings.push(`เวลาเรียนไม่ถึง ${minAttendance}% (ปัจจุบัน ${student.attendancePercent}%)`);
    }

    if (student.graduationApproved) {
      return {
        studentCode: student.studentCode,
        studentName: student.studentName,
        currentClassroom: student.currentClassroom,
        targetClassroom: 'ALUMNI',
        targetGradeLevel: 0,
        action: 'GRADUATED',
        graduationStatus: 'APPROVED',
        reason: `สำเร็จการศึกษา (อนุมัติโดย: ${student.graduationApprover || 'ฝ่ายวิชาการ'})`,
        warnings,
      };
    }

    // Not yet approved -> Graduation Pending
    return {
      studentCode: student.studentCode,
      studentName: student.studentName,
      currentClassroom: student.currentClassroom,
      targetClassroom: 'GRADUATION_PENDING',
      targetGradeLevel: mappingRule.sourceGradeLevel,
      action: 'GRADUATION_PENDING',
      graduationStatus: 'PENDING',
      reason: 'รอการอนุมัติจบการศึกษาอย่างเป็นทางการจากฝ่ายวิชาการ',
      warnings: [...warnings, 'ยังไม่ได้รับการอนุมัติจบการศึกษาอย่างเป็นทางการ'],
    };
  }

  // Case 5: Custom target room override
  if (student.manualExceptionAction === 'CUSTOM_TARGET_ROOM' && student.customTargetRoom) {
    return {
      studentCode: student.studentCode,
      studentName: student.studentName,
      currentClassroom: student.currentClassroom,
      targetClassroom: student.customTargetRoom,
      targetGradeLevel: parseGradeLevelFromRoom(student.customTargetRoom) || mappingRule.targetGradeLevel,
      action: 'PROMOTED',
      graduationStatus: 'NOT_APPLICABLE',
      reason: `เลื่อนชั้นสู่ห้องกำหนดเฉพาะ (${student.customTargetRoom})`,
      warnings,
    };
  }

  // Case 6: Standard Promotion
  return {
    studentCode: student.studentCode,
    studentName: student.studentName,
    currentClassroom: student.currentClassroom,
    targetClassroom: mappingRule.targetClassroom,
    targetGradeLevel: mappingRule.targetGradeLevel,
    action: 'PROMOTED',
    graduationStatus: 'NOT_APPLICABLE',
    reason: `เลื่อนชั้นตามปกติจาก ${mappingRule.sourceClassroom} สู่ ${mappingRule.targetClassroom}`,
    warnings,
  };
}

/**
 * Runs a full, non-mutating Dry Run across an entire student cohort and configuration
 */
export function runPromotionDryRun(
  students: StudentDryRunInput[],
  config: PromotionDryRunConfig
): PromotionDryRunReport {
  const errors: string[] = [];
  const globalWarnings: string[] = [];

  // Validation 1: Years must be sequential
  if (config.toAcademicYear <= config.fromAcademicYear) {
    errors.push(`ปีการศึกษาปลายทาง (${config.toAcademicYear}) ต้องมากกว่าปีต้นทาง (${config.fromAcademicYear})`);
  }

  // Validation 2: Check mapping coverage
  const mappingMap = new Map<string, ClassroomMappingRule>();
  for (const m of config.classroomMappings) {
    mappingMap.set(m.sourceClassroom, m);
  }

  const decisions: StudentPromotionDecision[] = [];

  let promotedCount = 0;
  let graduatedCount = 0;
  let repeatGradeCount = 0;
  let suspendedCount = 0;
  let transferredOutCount = 0;
  let pendingGraduationCount = 0;

  for (const student of students) {
    const mapping = mappingMap.get(student.currentClassroom);
    if (!mapping) {
      errors.push(`ไม่พบกฎการเลื่อนชั้นสำหรับห้อง '${student.currentClassroom}' (นักเรียน: ${student.studentName} [${student.studentCode}])`);
      continue;
    }

    const decision = evaluateStudentPromotion(student, mapping, config);
    decisions.push(decision);

    switch (decision.action) {
      case 'PROMOTED':
        promotedCount++;
        break;
      case 'GRADUATED':
        graduatedCount++;
        break;
      case 'REPEAT_GRADE':
        repeatGradeCount++;
        break;
      case 'SUSPENDED':
        suspendedCount++;
        break;
      case 'TRANSFERRED_OUT':
        transferredOutCount++;
        break;
      case 'GRADUATION_PENDING':
        pendingGraduationCount++;
        break;
    }
  }

  if (pendingGraduationCount > 0) {
    globalWarnings.push(`มีนักเรียนชั้น ม.3/ม.6 จำนวน ${pendingGraduationCount} คนที่ยังไม่ได้รับการอนุมัติจบการศึกษา (อยู่ในสถานะ PENDING)`);
  }

  return {
    isValid: errors.length === 0,
    fromAcademicYear: config.fromAcademicYear,
    toAcademicYear: config.toAcademicYear,
    summary: {
      totalStudentsEvaluated: decisions.length,
      promotedCount,
      graduatedCount,
      repeatGradeCount,
      suspendedCount,
      transferredOutCount,
      pendingGraduationCount,
    },
    errors,
    warnings: globalWarnings,
    decisions,
  };
}
