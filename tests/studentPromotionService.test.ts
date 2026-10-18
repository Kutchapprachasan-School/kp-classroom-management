import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  studentPromotionService,
  type ClassroomMappingRule,
} from '../src/services/studentPromotionService';
import { studentEnrollmentService } from '../src/services/studentEnrollmentService';
import { gradeService } from '../src/services/gradeService';
import { supabase } from '../src/lib/supabaseClient';


describe('studentPromotionService - Promotion Orchestrator & Batch Tracker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mappings: ClassroomMappingRule[] = [
    {
      fromClassroomId: 'room-1-1',
      fromGradeLevel: 'ม.1',
      toClassroomId: 'room-2-1',
      toGradeLevel: 'ม.2',
      isGraduationLevel: false,
    },
  ];

  it('simulatePromotionDryRun maps students and returns statistics', async () => {
    const flushSpy = vi.spyOn(gradeService, 'flushOutbox');

    vi.spyOn(studentEnrollmentService, 'getStudentFullTranscript').mockResolvedValue([]);

    const builder: any = {
      in: () => builder,
      eq: () => builder,
      neq: () => builder,
      order: () => builder,
      then: (fn: any) =>
        Promise.resolve({
          data: [
            {
              id: 'stu-1',
              prefix: 'ด.ช.',
              first_name: 'สมปอง',
              last_name: 'ดีใจ',
              classroom_id: 'room-1-1',
              academic_status: 'STUDYING',
            },
          ],
          error: null,
        }).then(fn),
    };

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => builder,
    } as any);


    const report = await studentPromotionService.simulatePromotionDryRun({
      fromAcademicYear: 2569,
      fromSemester: 1,
      toAcademicYear: 2569,
      toSemester: 2,
      mappings,
    });

    expect(flushSpy).toHaveBeenCalled();
    expect(report.totalStudents).toBe(1);
    expect(report.promoteCount).toBe(1);
    expect(report.transitions[0].to_classroom_id).toBe('room-2-1');
  });

  it('executePromotionBatch calls execute_student_promotion_batch RPC', async () => {
    const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        success: true,
        batch_id: 'promo-01',
        promoted_count: 1,
        repeated_count: 0,
        graduated_count: 0,
      },
      error: null,
    } as any);

    const res = await studentPromotionService.executePromotionBatch({
      fromAcademicYear: 2569,
      fromSemester: 1,
      toAcademicYear: 2570,
      toSemester: 1,
      executedBy: 'teacher-admin',
      transitions: [
        {
          student_id: 'stu-1',
          from_classroom_id: 'room-1-1',
          to_classroom_id: 'room-2-1',
          action: 'PROMOTE',
        },
      ],
    });

    expect(flushSpy).toHaveBeenCalled();
    expect(rpcSpy).toHaveBeenCalledWith('execute_student_promotion_batch', expect.any(Object));
    expect(res.success).toBe(true);
  });

  it('rollbackPromotionBatch invokes rollback_student_promotion_batch RPC', async () => {
    const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        success: true,
        conflict_detected: false,
        batch_id: 'promo-01',
        restored_count: 1,
      },
      error: null,
    } as any);

    const res = await studentPromotionService.rollbackPromotionBatch({
      batchId: 'promo-01',
      executedBy: 'admin',
    });

    expect(flushSpy).toHaveBeenCalled();
    expect(rpcSpy).toHaveBeenCalledWith('rollback_student_promotion_batch', expect.any(Object));
    expect(res.success).toBe(true);
  });
});
