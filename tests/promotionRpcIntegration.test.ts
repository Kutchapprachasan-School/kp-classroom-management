// tests/promotionRpcIntegration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentPromotionService } from '../src/services/studentPromotionService';
import { studentPurgeService } from '../src/services/studentPurgeService';
import { gradeService } from '../src/services/gradeService';
import { studentEnrollmentService } from '../src/services/studentEnrollmentService';
import { supabase } from '../src/lib/supabaseClient';

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Enterprise Student Promotion & Rollover System (v3 Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gradeService, 'flushOutbox').mockResolvedValue();
  });

  it('1. ควรสั่ง flushOutbox() และตั้งค่าเริ่มต้นให้เด็ก ม.3 ที่ติด ร เป็น REPEAT ใน Dry-Run', async () => {
    // จำลองรายชื่อนักเรียน ม.3 จำนวน 2 คน (คนแรกปกติ, คนที่สองติด ร)
    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: 'std-m3-normal', first_name: 'สมชาย', last_name: 'เรียนดี', classroom_id: 'room-m3-1' },
            { id: 'std-m3-issue', first_name: 'สมหญิง', last_name: 'รอซ่อม', classroom_id: 'room-m3-1' },
          ],
          error: null,
        }),
      }),
    });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    vi.spyOn(studentEnrollmentService, 'getStudentFullTranscript').mockImplementation(async (studentId) => {
      if (studentId === 'std-m3-issue') {
        return [
          {
            enrollmentId: 'enr-2',
            academicYear: 2569,
            semester: 2,
            classroomId: 'room-m3-1',
            gradeLevel: 'ม.3',
            status: 'ACTIVE',
            termGpa: 1.5,
            hasAcademicIssue: true,
            courses: [{ courseId: 'math101', totalScore: 45, grade: 'ร', isIncomplete: true }],
          },
        ];
      }
      return [
        {
          enrollmentId: 'enr-1',
          academicYear: 2569,
          semester: 2,
          classroomId: 'room-m3-1',
          gradeLevel: 'ม.3',
          status: 'ACTIVE',
          termGpa: 3.8,
          hasAcademicIssue: false,
          courses: [{ courseId: 'math101', totalScore: 85, grade: '4', isIncomplete: false }],
        },
      ];
    });

    const dryRun = await studentPromotionService.simulatePromotionDryRun({
      fromAcademicYear: 2569,
      fromSemester: 2,
      toAcademicYear: 2570,
      toSemester: 1,
      mappings: [
        {
          fromClassroomId: 'room-m3-1',
          fromGradeLevel: 'ม.3',
          toClassroomId: null,
          toGradeLevel: 'GRADUATED',
          isGraduationLevel: true,
        },
      ],
    });

    expect(gradeService.flushOutbox).toHaveBeenCalledTimes(1);
    expect(dryRun.totalStudents).toBe(2);
    expect(dryRun.graduateCount).toBe(1);
    expect(dryRun.repeatCount).toBe(1);
    expect(dryRun.flaggedIssueCount).toBe(1);

    const flaggedStudent = dryRun.transitions.find((t) => t.student_id === 'std-m3-issue');
    expect(flaggedStudent?.action).toBe('REPEAT');
    expect(flaggedStudent?.has_academic_issue).toBe(true);
  });

  it('2. ควรส่งข้อมูลเข้า Atomic RPC execute_student_promotion_batch อย่างถูกต้อง', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: {
        success: true,
        batch_id: 'promo_batch_2570',
        promoted_count: 1,
        repeated_count: 0,
        graduated_count: 0,
      },
      error: null,
    });

    const res = await studentPromotionService.executePromotionBatch({
      fromAcademicYear: 2569,
      fromSemester: 2,
      toAcademicYear: 2570,
      toSemester: 1,
      executedBy: 'admin-01',
      transitions: [
        {
          student_id: 'std-001',
          from_classroom_id: 'room-m1-1',
          to_classroom_id: 'room-m2-1',
          action: 'PROMOTE',
          roll_number: 1,
          grade_level: 'ม.2',
        },
      ],
    });

    expect(gradeService.flushOutbox).toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith(
      'execute_student_promotion_batch',
      expect.objectContaining({
        p_from_academic_year: 2569,
        p_to_academic_year: 2570,
        p_executed_by: 'admin-01',
      })
    );
    expect(res.batch_id).toBe('promo_batch_2570');
  });

  it('3. ควรแจ้งเตือน conflict_detected เมื่อสั่ง Rollback แล้วมีคะแนนใหม่ใน StudentScore', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: {
        success: false,
        conflict_detected: true,
        conflict_score_count: 12,
        message: 'พบการกรอกคะแนนในภาคเรียนใหม่แล้วจำนวน 12 รายการ',
      },
      error: null,
    });

    const rollbackRes = await studentPromotionService.rollbackPromotionBatch({
      batchId: 'promo_batch_2570',
      executedBy: 'admin-01',
      forceOverride: false,
    });

    expect(rollbackRes.conflict_detected).toBe(true);
    expect(rollbackRes.conflict_score_count).toBe(12);
  });

  it('4. ควรบล็อกการลบนักเรียนทดสอบหากตรวจพบคะแนนจริงใน StudentScore (Purge Guard)', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: {
        success: false,
        blocked_by_guard: true,
        active_score_count: 8,
        completed_term_count: 1,
        message: 'นักเรียนมีประวัติคะแนนจริง 8 ช่อง',
      },
      error: null,
    });

    const purgeRes = await studentPurgeService.purgeTestStudent('std-real-001', false);
    expect(purgeRes.blocked_by_guard).toBe(true);
    expect(purgeRes.active_score_count).toBe(8);
  });
});
