// src/services/studentEnrollmentService.ts
import { supabase } from '../lib/supabaseClient.ts';
import { gradeService, type AssessmentColumn, type StudentScore } from './gradeService.ts';

export type EnrollmentStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'REPEATED'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'ROLLED_BACK';

export interface StudentEnrollmentRecord {
  id: string;
  student_id: string;
  classroom_id: string;
  grade_level: string | null;
  academic_year: number;
  semester: number;
  roll_number: number | null;
  status: EnrollmentStatus;
  final_gpa: number | null;
  promotion_batch_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseTranscriptItem {
  courseId: string;
  totalScore: number;
  grade: string;
  isIncomplete: boolean;
}

export interface TermTranscript {
  enrollmentId: string;
  academicYear: number;
  semester: number;
  classroomId: string;
  gradeLevel: string | null;
  status: EnrollmentStatus;
  termGpa: number;
  hasAcademicIssue: boolean;
  courses: CourseTranscriptItem[];
}

export interface AlumniStudentSummary {
  id: string;
  student_code?: string;
  prefix?: string;
  first_name?: string;
  last_name?: string;
  academic_status: string;
  graduated_academic_year: number | null;
}

const ENROLLMENT_COLUMNS =
  'id, student_id, classroom_id, grade_level, academic_year, semester, roll_number, status, final_gpa, promotion_batch_id, remarks, created_at, updated_at';

export const studentEnrollmentService = {
  /**
   * 1. ดึงรายชื่อการลงทะเบียนเรียนของห้องเรียนในเทอมที่ระบุ
   */
  async getClassroomEnrollments(
    classroomId: string,
    academicYear: number,
    semester: number
  ): Promise<StudentEnrollmentRecord[]> {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select(ENROLLMENT_COLUMNS)
      .eq('classroom_id', classroomId)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .neq('status', 'ROLLED_BACK')
      .order('roll_number', { ascending: true });

    if (error) throw error;
    return (data as StudentEnrollmentRecord[]) || [];
  },

  /**
   * 2. ดึงประวัติการเรียนทุกปีการศึกษาของนักเรียน 1 คน (เรียงจากปีล่าสุดย้อนกลับ)
   */
  async getStudentEnrollmentHistory(studentId: string): Promise<StudentEnrollmentRecord[]> {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select(ENROLLMENT_COLUMNS)
      .eq('student_id', studentId)
      .neq('status', 'ROLLED_BACK')
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) throw error;
    return (data as StudentEnrollmentRecord[]) || [];
  },

  /**
   * 3. สร้างใบแสดงผลการเรียน (Transcript) ย้อนหลังทุกเทอมของนักเรียน
   * เชื่อมตาราง student_enrollments + AssessmentColumn + StudentScore
   */
  async getStudentFullTranscript(studentId: string): Promise<TermTranscript[]> {
    // บังคับซิงค์คะแนนในเครื่องให้เรียบร้อยก่อนดึง Transcript
    await gradeService.flushOutbox();

    const enrollments = await this.getStudentEnrollmentHistory(studentId);
    if (enrollments.length === 0) return [];

    // ดึงคะแนนทั้งหมดของนักเรียนคนนี้ในครั้งเดียว
    const { data: rawScores, error: scoreErr } = await supabase
      .from('StudentScore')
      .select('id, studentId, assignmentId, score, updatedAt')
      .eq('studentId', studentId);

    if (scoreErr) throw scoreErr;

    const studentScores = (rawScores as StudentScore[]) || [];
    const scoresMap = new Map<string, StudentScore>(studentScores.map((s) => [s.id, s]));

    // ดึงโครงสร้างช่องคะแนนของปีการศึกษาที่นักเรียนเคยเรียนทั้งหมด
    const years = Array.from(new Set(enrollments.map((e) => e.academic_year)));
    const { data: rawColumns, error: colErr } = await supabase
      .from('AssessmentColumn')
      .select('id, courseId, classroomId, academicYear, semester, title, maxScore, weight, category, updatedAt')
      .in('academicYear', years);

    if (colErr) throw colErr;

    const allColumns = (rawColumns as (AssessmentColumn & {
      classroomId?: string | null;
      academicYear: number;
      semester: number;
    })[]) || [];

    return enrollments.map((enr) => {
      // กรองเฉพาะช่องคะแนนของปีการศึกษา เทอม และห้องเรียนนั้น
      const termColumns = allColumns.filter(
        (c) =>
          c.academicYear === enr.academic_year &&
          c.semester === enr.semester &&
          (!c.classroomId || c.classroomId === enr.classroom_id)
      );

      // จัดกลุ่มตามรายวิชา (courseId)
      const courseGroupMap = new Map<string, AssessmentColumn[]>();
      for (const col of termColumns) {
        const list = courseGroupMap.get(col.courseId) || [];
        list.push(col);
        courseGroupMap.set(col.courseId, list);
      }

      const courses: CourseTranscriptItem[] = [];
      let gpaSum = 0;
      let numericGradeCount = 0;
      let hasAcademicIssue = false;

      for (const [courseId, cols] of courseGroupMap.entries()) {
        const calc = gradeService.calculateFinalGrade(studentId, cols, scoresMap);
        courses.push({
          courseId,
          totalScore: calc.totalScore,
          grade: calc.grade,
          isIncomplete: calc.isIncomplete,
        });

        if (calc.grade === '0' || calc.isIncomplete) {
          hasAcademicIssue = true;
        }

        if (!calc.isIncomplete) {
          const numericGrade = parseFloat(calc.grade);
          if (!Number.isNaN(numericGrade)) {
            gpaSum += numericGrade;
            numericGradeCount += 1;
          }
        }
      }

      const computedGpa =
        numericGradeCount > 0
          ? Number((gpaSum / numericGradeCount).toFixed(2))
          : enr.final_gpa ?? 0;

      return {
        enrollmentId: enr.id,
        academicYear: enr.academic_year,
        semester: enr.semester,
        classroomId: enr.classroom_id,
        gradeLevel: enr.grade_level,
        status: enr.status,
        termGpa: computedGpa,
        hasAcademicIssue,
        courses,
      };
    });
  },

  /**
   * 4. ดึงรายชื่อทำเนียบศิษย์เก่า (Alumni Directory) กรองตามปีที่จบการศึกษาและคำค้นหา
   */
  async getAlumniDirectory(params?: {
    graduatedYear?: number;
    searchQuery?: string;
  }): Promise<AlumniStudentSummary[]> {
    let query = supabase
      .from('students')
      .select('id, student_code, prefix, first_name, last_name, academic_status, graduated_academic_year')
      .eq('academic_status', 'GRADUATED');

    if (params?.graduatedYear) {
      query = query.eq('graduated_academic_year', params.graduatedYear);
    }

    query = query.order('graduated_academic_year', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const list = (data as AlumniStudentSummary[]) || [];
    if (!params?.searchQuery?.trim()) return list;

    const q = params.searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      const fullName = `${item.prefix ?? ''}${item.first_name ?? ''} ${item.last_name ?? ''}`.toLowerCase();
      const code = (item.student_code ?? item.id).toLowerCase();
      return fullName.includes(q) || code.includes(q);
    });
  },
};
