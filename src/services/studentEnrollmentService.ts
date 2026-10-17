/**
 * Student Enrollment Service
 * 
 * Manages the immutable historical ledger of student-classroom enrollments
 * across academic years and semesters.
 */

export type EnrollmentStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'REPEAT_GRADE'
  | 'SUSPENDED'
  | 'TRANSFERRED_OUT'
  | 'GRADUATED';

export interface StudentEnrollmentRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  academicYear: number;
  semesterNo: number;
  seatNo: number;
  status: EnrollmentStatus;
  startDate: string;
  endDate?: string;
  gpa?: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'kp_student_enrollments';

class StudentEnrollmentService {
  private cache: Map<string, StudentEnrollmentRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: StudentEnrollmentRecord[] = JSON.parse(raw);
        this.cache.clear();
        for (const item of list) {
          this.cache.set(item.id, item);
        }
      }
    } catch (e) {
      console.warn('Failed to load student enrollments from localStorage:', e);
    }
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = Array.from(this.cache.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist student enrollments to localStorage:', e);
    }
  }

  /**
   * Reset local state for testing
   */
  public _resetForTesting(): void {
    this.cache.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Get all active enrollments for a specific classroom
   */
  public getActiveEnrollments(classroomId: string): StudentEnrollmentRecord[] {
    const results: StudentEnrollmentRecord[] = [];
    for (const enr of this.cache.values()) {
      if (enr.classroomId === classroomId && enr.status === 'ACTIVE') {
        results.push(enr);
      }
    }
    return results.sort((a, b) => a.seatNo - b.seatNo);
  }

  /**
   * Get all historical enrollments for a student across all years, sorted chronologically
   */
  public getStudentEnrollmentHistory(studentId: string): StudentEnrollmentRecord[] {
    const results: StudentEnrollmentRecord[] = [];
    for (const enr of this.cache.values()) {
      if (enr.studentId === studentId) {
        results.push(enr);
      }
    }
    return results.sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return a.academicYear - b.academicYear;
      }
      return a.semesterNo - b.semesterNo;
    });
  }

  /**
   * Create a new enrollment record
   */
  public createEnrollment(
    data: Omit<StudentEnrollmentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): StudentEnrollmentRecord {
    const id = `enr_${data.studentId}_${data.academicYear}_${data.semesterNo}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const record: StudentEnrollmentRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.cache.set(record.id, record);
    this.persistToStorage();
    return record;
  }

  /**
   * Close a student's active enrollment (mark as COMPLETED, GRADUATED, etc.)
   */
  public closeActiveEnrollment(
    studentId: string,
    status: EnrollmentStatus,
    endDate?: string
  ): boolean {
    let closed = false;
    const now = new Date().toISOString();
    const closeDate = endDate || now.split('T')[0];

    for (const enr of this.cache.values()) {
      if (enr.studentId === studentId && enr.status === 'ACTIVE') {
        enr.status = status;
        enr.endDate = closeDate;
        enr.updatedAt = now;
        closed = true;
      }
    }

    if (closed) {
      this.persistToStorage();
    }
    return closed;
  }

  /**
   * Get all graduated students (for Alumni Directory)
   */
  public getGraduatedAlumni(academicYear?: number): StudentEnrollmentRecord[] {
    const results: StudentEnrollmentRecord[] = [];
    for (const enr of this.cache.values()) {
      if (enr.status === 'GRADUATED') {
        if (!academicYear || enr.academicYear === academicYear) {
          results.push(enr);
        }
      }
    }
    return results.sort((a, b) => (b.academicYear - a.academicYear) || a.studentCode.localeCompare(b.studentCode));
  }
}

export const studentEnrollmentService = new StudentEnrollmentService();
