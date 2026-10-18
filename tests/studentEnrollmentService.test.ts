import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  studentEnrollmentService,
  type StudentEnrollmentRecord,
} from '../src/services/studentEnrollmentService';
import { gradeService } from '../src/services/gradeService';
import { supabase } from '../src/lib/supabaseClient';

describe('studentEnrollmentService - Historical Enrollment Ledger & Transcripts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getClassroomEnrollments queries enrollments in active classroom and excludes ROLLED_BACK', async () => {
    const mockData: StudentEnrollmentRecord[] = [
      {
        id: 'enr-1',
        student_id: 'stu-1',
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

    const builder: any = {
      eq: () => builder,
      neq: () => builder,
      order: () => Promise.resolve({ data: mockData, error: null }),
    };

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => builder,
    } as any);

    const list = await studentEnrollmentService.getClassroomEnrollments('room-1-1', 2569, 1);
    expect(list).toHaveLength(1);
    expect(list[0].student_id).toBe('stu-1');
  });

  it('getStudentEnrollmentHistory returns records sorted by year and term', async () => {
    const mockData: StudentEnrollmentRecord[] = [
      {
        id: 'enr-2',
        student_id: 'stu-1',
        classroom_id: 'room-2-1',
        grade_level: 'ม.2',
        academic_year: 2570,
        semester: 1,
        roll_number: 1,
        status: 'ACTIVE',
        final_gpa: null,
        promotion_batch_id: 'promo-1',
        remarks: null,
        created_at: '2026-10-18T00:00:00Z',
        updated_at: '2026-10-18T00:00:00Z',
      },
      {
        id: 'enr-1',
        student_id: 'stu-1',
        classroom_id: 'room-1-1',
        grade_level: 'ม.1',
        academic_year: 2569,
        semester: 1,
        roll_number: 1,
        status: 'COMPLETED',
        final_gpa: 3.5,
        promotion_batch_id: null,
        remarks: null,
        created_at: '2026-10-18T00:00:00Z',
        updated_at: '2026-10-18T00:00:00Z',
      },
    ];

    const builder: any = {
      eq: () => builder,
      neq: () => builder,
      order: () => builder,
      then: (fn: any) => Promise.resolve({ data: mockData, error: null }).then(fn),
    };

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => builder,
    } as any);

    const history = await studentEnrollmentService.getStudentEnrollmentHistory('stu-1');
    expect(history).toHaveLength(2);
    expect(history[0].academic_year).toBe(2570);
  });

  it('getStudentFullTranscript flushes outbox and computes grades for each term', async () => {
    const flushSpy = vi.spyOn(gradeService, 'flushOutbox');

    vi.spyOn(studentEnrollmentService, 'getStudentEnrollmentHistory').mockResolvedValue([
      {
        id: 'enr-1',
        student_id: 'stu-1',
        classroom_id: 'room-1-1',
        grade_level: 'ม.1',
        academic_year: 2569,
        semester: 1,
        roll_number: 1,
        status: 'ACTIVE',
        final_gpa: null,
        promotion_batch_id: null,
        remarks: null,
        created_at: '',
        updated_at: '',
      },
    ]);

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'StudentScore') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                { id: 'stu-1_col-1', studentId: 'stu-1', assignmentId: 'col-1', score: 90, updatedAt: '' },
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
                  id: 'col-1',
                  courseId: 'math101',
                  academicYear: 2569,
                  semester: 1,
                  maxScore: 100,
                  weight: 100,
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

    const transcripts = await studentEnrollmentService.getStudentFullTranscript('stu-1');
    expect(flushSpy).toHaveBeenCalled();
    expect(transcripts).toHaveLength(1);
    expect(transcripts[0].courses[0].grade).toBe('4');
    expect(transcripts[0].termGpa).toBe(4);
    expect(transcripts[0].hasAcademicIssue).toBe(false);
  });
});
