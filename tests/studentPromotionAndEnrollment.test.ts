import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  studentEnrollmentService,
  type StudentEnrollmentRecord,
} from '../src/services/studentEnrollmentService.ts';
import {
  studentPromotionService,
  type ClassroomMappingRule,
} from '../src/services/studentPromotionService.ts';
import { studentPurgeService } from '../src/services/studentPurgeService.ts';
import { gradeService } from '../src/services/gradeService.ts';
import { supabase } from '../src/lib/supabaseClient.ts';

describe('Task 3 & 4: Student Enrollment Ledger, Promotion Engine & Purge Guard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    gradeService._resetMemoryStoreForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. studentEnrollmentService - Ledger & Full Transcript', () => {
    it('flushes outbox and computes full multi-term transcript with GPA and academic issue detection', async () => {
      const flushSpy = vi.spyOn(gradeService, 'flushOutbox');

      // Mock enrollment history
      const mockEnrollments: StudentEnrollmentRecord[] = [
        {
          id: 'enr-1',
          student_id: 'stu-001',
          classroom_id: 'room-1-1',
          grade_level: 'ม.1',
          academic_year: 2569,
          semester: 1,
          roll_number: 1,
          status: 'ACTIVE',
          final_gpa: null,
          promotion_batch_id: null,
          remarks: null,
          created_at: '2026-10-18T00:00:00Z',
          updated_at: '2026-10-18T00:00:00Z',
        },
      ];

      vi.spyOn(studentEnrollmentService, 'getStudentEnrollmentHistory').mockResolvedValue(mockEnrollments);

      // Mock StudentScore
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'StudentScore') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  { id: 'stu-001_col-hw', studentId: 'stu-001', assignmentId: 'col-hw', score: 10, updatedAt: '' },
                  // col-final is missing -> status 'ร'
                ],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === 'AssessmentColumn') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: [
                  {
                    id: 'col-hw',
                    courseId: 'math101',
                    classroomId: 'room-1-1',
                    academicYear: 2569,
                    semester: 1,
                    title: 'HW',
                    maxScore: 10,
                    weight: 10,
                    category: 'HW',
                    updatedAt: '',
                  },
                  {
                    id: 'col-final',
                    courseId: 'math101',
                    classroomId: 'room-1-1',
                    academicYear: 2569,
                    semester: 1,
                    title: 'Final Exam',
                    maxScore: 90,
                    weight: 90,
                    category: 'FINAL',
                    updatedAt: '',
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) } as any;
      });

      const transcripts = await studentEnrollmentService.getStudentFullTranscript('stu-001');

      // 1. Guard check: flushOutbox must be called
      expect(flushSpy).toHaveBeenCalled();

      // 2. Transcript structure check
      expect(transcripts.length).toBe(1);
      const term1 = transcripts[0];
      expect(term1.academicYear).toBe(2569);
      expect(term1.semester).toBe(1);
      expect(term1.courses.length).toBe(1);

      // 3. Academic issue detection: missing final exam produces 'ร' and flags hasAcademicIssue = true
      expect(term1.courses[0].grade).toBe('ร');
      expect(term1.courses[0].isIncomplete).toBe(true);
      expect(term1.hasAcademicIssue).toBe(true);
    });

    it('filters alumni directory by query and graduated academic year', async () => {
      const builder: any = {
        eq: () => builder,
        order: () => builder,
        then: (onfulfilled: any) =>
          Promise.resolve({
            data: [
              {
                id: 'stu-alumni-1',
                student_code: '45001',
                prefix: 'นาย',
                first_name: 'กฤษณะ',
                last_name: 'บุญมี',
                academic_status: 'GRADUATED',
                graduated_academic_year: 2568,
              },
              {
                id: 'stu-alumni-2',
                student_code: '45002',
                prefix: 'น.ส.',
                first_name: 'รัตนา',
                last_name: 'วงษ์สุวรรณ',
                academic_status: 'GRADUATED',
                graduated_academic_year: 2568,
              },
            ],
            error: null,
          }).then(onfulfilled),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => builder,
      } as any);


      const alumni = await studentEnrollmentService.getAlumniDirectory({
        graduatedYear: 2568,
        searchQuery: 'กฤษณะ',
      });

      expect(alumni.length).toBe(1);
      expect(alumni[0].first_name).toBe('กฤษณะ');
    });
  });

  describe('2. studentPromotionService - Dry Run & Atomic Promotion / Rollback', () => {
    const mappings: ClassroomMappingRule[] = [
      {
        fromClassroomId: 'room-1-1',
        fromGradeLevel: 'ม.1',
        toClassroomId: 'room-2-1',
        toGradeLevel: 'ม.2',
        isGraduationLevel: false,
      },
      {
        fromClassroomId: 'room-3-1',
        fromGradeLevel: 'ม.3',
        toClassroomId: null,
        toGradeLevel: null,
        isGraduationLevel: true,
      },
    ];

    it('simulatePromotionDryRun detects academic issues and flags them in transitions', async () => {
      const flushSpy = vi.spyOn(gradeService, 'flushOutbox');

      // Mock active students in room-3-1
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => ({
          in: () => ({
            eq: () => Promise.resolve({
              data: [
                {
                  id: 'stu-m3-01',
                  prefix: 'นาย',
                  first_name: 'อนุชา',
                  last_name: 'สมบูรณ์',
                  classroom_id: 'room-3-1',
                  academic_status: 'STUDYING',
                },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      // Student has academic issue in 2569/1
      vi.spyOn(studentEnrollmentService, 'getStudentFullTranscript').mockResolvedValue([
        {
          enrollmentId: 'enr-1',
          academicYear: 2569,
          semester: 1,
          classroomId: 'room-3-1',
          gradeLevel: 'ม.3',
          status: 'ACTIVE',
          termGpa: 1.5,
          hasAcademicIssue: true,
          courses: [{ courseId: 'math103', totalScore: 35, grade: '0', isIncomplete: false }],
        },
      ]);

      const result = await studentPromotionService.simulatePromotionDryRun({
        fromAcademicYear: 2569,
        fromSemester: 1,
        toAcademicYear: 2570,
        toSemester: 1,
        mappings,
      });

      expect(flushSpy).toHaveBeenCalled();
      expect(result.totalStudents).toBe(1);
      expect(result.flaggedIssueCount).toBe(1);
      expect(result.transitions[0].has_academic_issue).toBe(true);
      // Because terminal grade student has academic issue, default action changes to REPEAT (stays in current room)
      expect(result.transitions[0].action).toBe('REPEAT');
      expect(result.transitions[0].to_classroom_id).toBe('room-3-1');
    });

    it('executePromotionBatch flushes outbox and calls execute_student_promotion_batch RPC', async () => {
      const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          success: true,
          batch_id: 'promo_test_123',
          promoted_count: 35,
          repeated_count: 1,
          graduated_count: 0,
        },
        error: null,
      } as any);

      const res = await studentPromotionService.executePromotionBatch({
        fromAcademicYear: 2569,
        fromSemester: 1,
        toAcademicYear: 2569,
        toSemester: 2,
        executedBy: 'teacher-admin',
        transitions: [
          {
            student_id: 'stu-101',
            from_classroom_id: 'room-1-1',
            to_classroom_id: 'room-1-1',
            action: 'PROMOTE',
            roll_number: 1,
          },
        ],
      });

      expect(flushSpy).toHaveBeenCalled();
      expect(rpcSpy).toHaveBeenCalledWith('execute_student_promotion_batch', expect.any(Object));
      expect(res.success).toBe(true);
      expect(res.batch_id).toBe('promo_test_123');
    });

    it('rollbackPromotionBatch handles conflict detection response when new scores exist', async () => {
      const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          success: false,
          conflict_detected: true,
          conflict_score_count: 12,
          message: 'ไม่สามารถย้อนกลับอัตโนมัติได้ เนื่องจากพบการกรอกคะแนนในภาคเรียนใหม่แล้วจำนวน 12 รายการ',
        },
        error: null,
      } as any);

      const res = await studentPromotionService.rollbackPromotionBatch({
        batchId: 'promo_test_123',
        executedBy: 'teacher-admin',
        forceOverride: false,
      });

      expect(flushSpy).toHaveBeenCalled();
      expect(res.conflict_detected).toBe(true);
      expect(res.conflict_score_count).toBe(12);
      expect(res.success).toBe(false);
    });
  });

  describe('3. studentPurgeService - Single-Student Purge Guard', () => {
    it('throws error when studentId is empty or whitespace', async () => {
      await expect(studentPurgeService.purgeTestStudent('   ')).rejects.toThrow('กรุณาระบุรหัสนักเรียนที่ต้องการลบ');
    });

    it('flushes outbox and calls purge_test_student_safely RPC returning guard response', async () => {
      const flushSpy = vi.spyOn(gradeService, 'flushOutbox');
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          success: false,
          blocked_by_guard: true,
          active_score_count: 5,
          completed_term_count: 2,
          message: 'ระบบป้องกันการลบทำงาน: นักเรียนมีประวัติคะแนนจริง 5 ช่อง และประวัติผ่านชั้นเรียน 2 เทอม',
        },
        error: null,
      } as any);

      const res = await studentPurgeService.purgeTestStudent('stu-real-student', false);

      expect(flushSpy).toHaveBeenCalled();
      expect(res.blocked_by_guard).toBe(true);
      expect(res.active_score_count).toBe(5);
    });
  });
});
