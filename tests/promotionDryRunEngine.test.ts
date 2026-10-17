import { describe, it, expect } from 'vitest';
import {
  generateDefaultClassroomMappings,
  evaluateStudentPromotion,
  runPromotionDryRun,
  type StudentDryRunInput,
  type ClassroomMappingRule,
  type PromotionDryRunConfig,
} from '../src/utils/promotionDryRunEngine';

describe('PromotionDryRunEngine (Pure Calculation & Validation)', () => {
  const sampleRooms = ['ม.1/1', 'ม.2/1', 'ม.3/1', 'ม.4/1', 'ม.5/1', 'ม.6/1'];

  describe('generateDefaultClassroomMappings', () => {
    it('correctly maps lower secondary and upper secondary grade levels', () => {
      const mappings = generateDefaultClassroomMappings(sampleRooms);

      expect(mappings).toHaveLength(6);

      const m1 = mappings.find((m) => m.sourceClassroom === 'ม.1/1');
      expect(m1?.targetClassroom).toBe('ม.2/1');
      expect(m1?.targetGradeLevel).toBe(2);
      expect(m1?.isTerminalGrade).toBe(false);

      const m2 = mappings.find((m) => m.sourceClassroom === 'ม.2/1');
      expect(m2?.targetClassroom).toBe('ม.3/1');
      expect(m2?.isTerminalGrade).toBe(false);

      const m3 = mappings.find((m) => m.sourceClassroom === 'ม.3/1');
      expect(m3?.targetClassroom).toBe('ALUMNI');
      expect(m3?.targetGradeLevel).toBe(0);
      expect(m3?.isTerminalGrade).toBe(true);

      const m6 = mappings.find((m) => m.sourceClassroom === 'ม.6/1');
      expect(m6?.targetClassroom).toBe('ALUMNI');
      expect(m6?.isTerminalGrade).toBe(true);
    });
  });

  describe('evaluateStudentPromotion', () => {
    const config: PromotionDryRunConfig = {
      fromAcademicYear: 2568,
      toAcademicYear: 2569,
      minAttendancePercentForGraduation: 80,
      classroomMappings: generateDefaultClassroomMappings(sampleRooms),
    };

    it('promotes regular student from ม.1/1 to ม.2/1', () => {
      const student: StudentDryRunInput = {
        studentCode: '47001',
        studentName: 'ด.ช. ชนะภัย ยอดสิงห์',
        currentClassroom: 'ม.1/1',
        attendancePercent: 95,
      };

      const mapping: ClassroomMappingRule = {
        sourceClassroom: 'ม.1/1',
        sourceGradeLevel: 1,
        targetClassroom: 'ม.2/1',
        targetGradeLevel: 2,
        isTerminalGrade: false,
      };

      const decision = evaluateStudentPromotion(student, mapping, config);

      expect(decision.action).toBe('PROMOTED');
      expect(decision.targetClassroom).toBe('ม.2/1');
      expect(decision.targetGradeLevel).toBe(2);
      expect(decision.graduationStatus).toBe('NOT_APPLICABLE');
      expect(decision.warnings).toHaveLength(0);
    });

    it('handles REPEAT_GRADE exception by retaining grade level for the new year', () => {
      const student: StudentDryRunInput = {
        studentCode: '47002',
        studentName: 'ด.ช. สมศักดิ์ สุขใจ',
        currentClassroom: 'ม.1/1',
        manualExceptionAction: 'REPEAT_GRADE',
      };

      const mapping: ClassroomMappingRule = {
        sourceClassroom: 'ม.1/1',
        sourceGradeLevel: 1,
        targetClassroom: 'ม.2/1',
        targetGradeLevel: 2,
        isTerminalGrade: false,
      };

      const decision = evaluateStudentPromotion(student, mapping, config);

      expect(decision.action).toBe('REPEAT_GRADE');
      expect(decision.targetClassroom).toBe('ม.1/1');
      expect(decision.targetGradeLevel).toBe(1);
      expect(decision.reason).toContain('ซ้ำชั้น');
    });

    it('handles SUSPENDED and TRANSFERRED_OUT exceptions', () => {
      const mapping: ClassroomMappingRule = {
        sourceClassroom: 'ม.2/1',
        sourceGradeLevel: 2,
        targetClassroom: 'ม.3/1',
        targetGradeLevel: 3,
        isTerminalGrade: false,
      };

      const suspendedStudent: StudentDryRunInput = {
        studentCode: '47003',
        studentName: 'ด.ช. วินัย ขยันเรียน',
        currentClassroom: 'ม.2/1',
        manualExceptionAction: 'SUSPENDED',
      };

      const suspendedDecision = evaluateStudentPromotion(suspendedStudent, mapping, config);
      expect(suspendedDecision.action).toBe('SUSPENDED');
      expect(suspendedDecision.targetClassroom).toBe('SUSPENDED');

      const transferredStudent: StudentDryRunInput = {
        studentCode: '47004',
        studentName: 'ด.ญ. มาลี มีสุข',
        currentClassroom: 'ม.2/1',
        manualExceptionAction: 'TRANSFERRED_OUT',
      };

      const transferredDecision = evaluateStudentPromotion(transferredStudent, mapping, config);
      expect(transferredDecision.action).toBe('TRANSFERRED_OUT');
      expect(transferredDecision.targetClassroom).toBe('TRANSFERRED_OUT');
    });

    it('gates terminal grades (ม.3): requires explicit approval to graduate', () => {
      const mappingM3: ClassroomMappingRule = {
        sourceClassroom: 'ม.3/1',
        sourceGradeLevel: 3,
        targetClassroom: 'ALUMNI',
        targetGradeLevel: 0,
        isTerminalGrade: true,
      };

      // Case A: Not yet approved
      const unapprovedStudent: StudentDryRunInput = {
        studentCode: '45001',
        studentName: 'นายประสิทธิ์ ศรีวิชัย',
        currentClassroom: 'ม.3/1',
        attendancePercent: 88,
        graduationApproved: false,
      };

      const unapprovedDecision = evaluateStudentPromotion(unapprovedStudent, mappingM3, config);
      expect(unapprovedDecision.action).toBe('GRADUATION_PENDING');
      expect(unapprovedDecision.graduationStatus).toBe('PENDING');
      expect(unapprovedDecision.warnings).toContain('ยังไม่ได้รับการอนุมัติจบการศึกษาอย่างเป็นทางการ');

      // Case B: Officially approved
      const approvedStudent: StudentDryRunInput = {
        studentCode: '45002',
        studentName: 'น.ส. ศิริพร พรหมมา',
        currentClassroom: 'ม.3/1',
        attendancePercent: 92,
        graduationApproved: true,
        graduationApprover: 'นายสมชาย ใจดี (ผู้อำนวยการ)',
        graduationApprovalDate: '2026-03-20',
      };

      const approvedDecision = evaluateStudentPromotion(approvedStudent, mappingM3, config);
      expect(approvedDecision.action).toBe('GRADUATED');
      expect(approvedDecision.graduationStatus).toBe('APPROVED');
      expect(approvedDecision.targetClassroom).toBe('ALUMNI');
      expect(approvedDecision.reason).toContain('อนุมัติโดย: นายสมชาย ใจดี');
    });

    it('warns about low attendance or incomplete assignments for graduating students', () => {
      const mappingM3: ClassroomMappingRule = {
        sourceClassroom: 'ม.3/1',
        sourceGradeLevel: 3,
        targetClassroom: 'ALUMNI',
        targetGradeLevel: 0,
        isTerminalGrade: true,
      };

      const atRiskStudent: StudentDryRunInput = {
        studentCode: '45003',
        studentName: 'นายมานพ เสี่ยงตก',
        currentClassroom: 'ม.3/1',
        attendancePercent: 72, // Below 80%
        hasIncompleteAssignments: true,
        graduationApproved: false,
      };

      const decision = evaluateStudentPromotion(atRiskStudent, mappingM3, config);
      expect(decision.warnings.some((w) => w.includes('เวลาเรียนไม่ถึง 80%'))).toBe(true);
      expect(decision.warnings.some((w) => w.includes('มีงานค้างส่งหรือติด ร/0'))).toBe(true);
    });
  });

  describe('runPromotionDryRun (Batch Preview & Validation)', () => {
    it('executes a complete cohort dry run and outputs summary without modifying state', () => {
      const config: PromotionDryRunConfig = {
        fromAcademicYear: 2568,
        toAcademicYear: 2569,
        classroomMappings: generateDefaultClassroomMappings(sampleRooms),
      };

      const cohort: StudentDryRunInput[] = [
        { studentCode: '101', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
        { studentCode: '102', studentName: 'เด็ก 2', currentClassroom: 'ม.1/1', manualExceptionAction: 'REPEAT_GRADE' },
        { studentCode: '201', studentName: 'เด็ก 3', currentClassroom: 'ม.2/1' },
        { studentCode: '301', studentName: 'เด็ก 4', currentClassroom: 'ม.3/1', graduationApproved: true, graduationApprover: 'ผอ.' },
        { studentCode: '302', studentName: 'เด็ก 5', currentClassroom: 'ม.3/1', graduationApproved: false },
      ];

      const report = runPromotionDryRun(cohort, config);

      expect(report.isValid).toBe(true);
      expect(report.summary.totalStudentsEvaluated).toBe(5);
      expect(report.summary.promotedCount).toBe(2); // 101 -> ม.2/1, 201 -> ม.3/1
      expect(report.summary.repeatGradeCount).toBe(1); // 102
      expect(report.summary.graduatedCount).toBe(1); // 301
      expect(report.summary.pendingGraduationCount).toBe(1); // 302
      expect(report.warnings).toHaveLength(1);
      expect(report.errors).toHaveLength(0);
    });

    it('detects invalid configuration when target year is not sequential', () => {
      const invalidConfig: PromotionDryRunConfig = {
        fromAcademicYear: 2569,
        toAcademicYear: 2568, // Invalid!
        classroomMappings: generateDefaultClassroomMappings(sampleRooms),
      };

      const report = runPromotionDryRun([], invalidConfig);
      expect(report.isValid).toBe(false);
      expect(report.errors[0]).toContain('ปีการศึกษาปลายทาง (2568) ต้องมากกว่าปีต้นทาง (2569)');
    });

    it('detects unmapped classroom errors', () => {
      const config: PromotionDryRunConfig = {
        fromAcademicYear: 2568,
        toAcademicYear: 2569,
        classroomMappings: [], // Empty mappings!
      };

      const cohort: StudentDryRunInput[] = [
        { studentCode: '101', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
      ];

      const report = runPromotionDryRun(cohort, config);
      expect(report.isValid).toBe(false);
      expect(report.errors[0]).toContain('ไม่พบกฎการเลื่อนชั้นสำหรับห้อง \'ม.1/1\'');
    });
  });
});
