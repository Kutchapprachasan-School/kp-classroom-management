import { describe, it, expect } from 'vitest';
import {
  runPromotionDryRun,
  type StudentDryRunInput,
  type PromotionDryRunConfig,
  generateDefaultClassroomMappings,
} from '../src/utils/promotionDryRunEngine';

/**
 * Helper to transform DryRun decisions into the PostgreSQL RPC items payload
 */
function buildRpcPromotionPayload(
  dryRunDecisions: ReturnType<typeof runPromotionDryRun>['decisions'],
  studentIdMap: Record<string, string>, // code -> student_id (UUID)
  roomIdMap: Record<string, string>     // name -> classroom_id (UUID)
) {
  return dryRunDecisions.map((d) => {
    const studentId = studentIdMap[d.studentCode] || `stu_${d.studentCode}`;
    const targetRoomId = d.targetClassroom && roomIdMap[d.targetClassroom] 
      ? roomIdMap[d.targetClassroom] 
      : null;

    return {
      studentId,
      studentCode: d.studentCode,
      action: d.action,
      targetRoomId,
      graduationApproved: d.graduationStatus === 'APPROVED',
      graduationApprovedBy: d.graduationStatus === 'APPROVED' ? 'admin-uid' : null,
      notes: d.reason,
    };
  });
}

describe('PostgreSQL RPC Integration Contract & Payload Validation', () => {
  const rooms = ['ม.1/1', 'ม.2/1', 'ม.3/1'];
  const config: PromotionDryRunConfig = {
    fromAcademicYear: 2568,
    toAcademicYear: 2569,
    classroomMappings: generateDefaultClassroomMappings(rooms),
  };

  const studentIdMap = {
    '47001': 'uuid-student-47001',
    '47002': 'uuid-student-47002',
    '45001': 'uuid-student-45001',
    '45002': 'uuid-student-45002',
  };

  const roomIdMap = {
    'ม.1/1': 'uuid-room-1-1',
    'ม.2/1': 'uuid-room-2-1',
    'ม.3/1': 'uuid-room-3-1',
  };

  it('transforms dry-run decisions into RPC items adhering to PostgreSQL parameter schema', () => {
    const cohort: StudentDryRunInput[] = [
      { studentCode: '47001', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
      { studentCode: '45001', studentName: 'ม.3 อนุมัติแล้ว', currentClassroom: 'ม.3/1', graduationApproved: true },
      { studentCode: '45002', studentName: 'ม.3 ยังไม่อนุมัติ', currentClassroom: 'ม.3/1', graduationApproved: false },
    ];

    const report = runPromotionDryRun(cohort, config);
    expect(report.isValid).toBe(true);

    const rpcItems = buildRpcPromotionPayload(report.decisions, studentIdMap, roomIdMap);

    expect(rpcItems).toHaveLength(3);

    // Item 1: Promoted
    expect(rpcItems[0].studentId).toBe('uuid-student-47001');
    expect(rpcItems[0].action).toBe('PROMOTED');
    expect(rpcItems[0].targetRoomId).toBe('uuid-room-2-1');
    expect(rpcItems[0].graduationApproved).toBe(false);

    // Item 2: Graduated (Approved)
    expect(rpcItems[1].studentId).toBe('uuid-student-45001');
    expect(rpcItems[1].action).toBe('GRADUATED');
    expect(rpcItems[1].targetRoomId).toBeNull();
    expect(rpcItems[1].graduationApproved).toBe(true);
    expect(rpcItems[1].graduationApprovedBy).toBe('admin-uid');

    // Item 3: Graduation Pending (Must NOT be flagged as GRADUATED in RPC)
    expect(rpcItems[2].studentId).toBe('uuid-student-45002');
    expect(rpcItems[2].action).toBe('GRADUATION_PENDING');
    expect(rpcItems[2].graduationApproved).toBe(false);
  });

  it('rejects graduation action if graduation approval is missing in the RPC payload', () => {
    const invalidGraduationItem = {
      studentId: 'uuid-student-45002',
      studentCode: '45002',
      action: 'GRADUATED',
      graduationApproved: false, // Invalid: Cannot be GRADUATED without explicit approval!
    };

    // Client-side pre-validation invariant check
    const validateRpcItem = (item: typeof invalidGraduationItem) => {
      if (item.action === 'GRADUATED' && !item.graduationApproved) {
        throw new Error('GRADUATION_NOT_APPROVED: Terminal students require formal graduation approval');
      }
    };

    expect(() => validateRpcItem(invalidGraduationItem)).toThrow(
      'GRADUATION_NOT_APPROVED: Terminal students require formal graduation approval'
    );
  });

  it('simulates rollback conflict guard detecting downstream score modifications', () => {
    // Simulates the SQL check:
    // SELECT count(*) FROM scores WHERE enrollment_id IN (SELECT new_enrollment_id FROM promotion_batch_items)
    const simulatedBatchItems = [
      { studentId: 'uuid-1', newEnrollmentId: 'enr-new-1' },
      { studentId: 'uuid-2', newEnrollmentId: 'enr-new-2' },
    ];

    const existingScores = [
      { id: 'sc-1', enrollmentId: 'enr-new-1', score: 18 }, // Modified in new academic year!
    ];

    const detectRollbackConflicts = (
      batchItems: typeof simulatedBatchItems,
      scores: typeof existingScores
    ) => {
      const newEnrollmentIds = new Set(batchItems.map((b) => b.newEnrollmentId));
      const conflicts = scores.filter((s) => newEnrollmentIds.has(s.enrollmentId));
      return {
        hasConflict: conflicts.length > 0,
        conflictCount: conflicts.length,
      };
    };

    const conflictReport = detectRollbackConflicts(simulatedBatchItems, existingScores);
    expect(conflictReport.hasConflict).toBe(true);
    expect(conflictReport.conflictCount).toBe(1);
  });
});
