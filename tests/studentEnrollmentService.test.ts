import { describe, it, expect, beforeEach } from 'vitest';
import {
  studentEnrollmentService,
  type StudentEnrollmentRecord,
} from '../src/services/studentEnrollmentService';

describe('studentEnrollmentService - Historical Enrollment Ledger', () => {
  beforeEach(() => {
    studentEnrollmentService._resetForTesting();
  });

  it('records an initial active enrollment for a student', () => {
    const enr = studentEnrollmentService.createEnrollment({
      studentId: 'stu-47001',
      studentCode: '47001',
      studentName: 'เด็กชาย ก สมมุติ',
      classroomId: 'room-1-1',
      classroomName: 'ม.1/1',
      academicYear: 2568,
      semesterNo: 1,
      seatNo: 1,
      status: 'ACTIVE',
      startDate: '2025-05-16',
    });

    expect(enr.id).toBeDefined();
    expect(enr.status).toBe('ACTIVE');
    expect(enr.studentCode).toBe('47001');

    const activeList = studentEnrollmentService.getActiveEnrollments('room-1-1');
    expect(activeList).toHaveLength(1);
    expect(activeList[0].studentId).toBe('stu-47001');
  });

  it('queries historical enrollments across multiple years in chronological order', () => {
    // Year 2567: ม.1
    studentEnrollmentService.createEnrollment({
      studentId: 'stu-45001',
      studentCode: '45001',
      studentName: 'นาย ข นักเรียน',
      classroomId: 'room-1-1',
      classroomName: 'ม.1/1',
      academicYear: 2567,
      semesterNo: 2,
      seatNo: 5,
      status: 'COMPLETED',
      startDate: '2024-11-01',
      endDate: '2025-03-31',
      gpa: 3.45,
    });

    // Year 2568: ม.2
    studentEnrollmentService.createEnrollment({
      studentId: 'stu-45001',
      studentCode: '45001',
      studentName: 'นาย ข นักเรียน',
      classroomId: 'room-2-1',
      classroomName: 'ม.2/1',
      academicYear: 2568,
      semesterNo: 1,
      seatNo: 4,
      status: 'COMPLETED',
      startDate: '2025-05-16',
      endDate: '2025-10-10',
      gpa: 3.60,
    });

    // Year 2568 Term 2: ม.2 (Active)
    studentEnrollmentService.createEnrollment({
      studentId: 'stu-45001',
      studentCode: '45001',
      studentName: 'นาย ข นักเรียน',
      classroomId: 'room-2-1',
      classroomName: 'ม.2/1',
      academicYear: 2568,
      semesterNo: 2,
      seatNo: 4,
      status: 'ACTIVE',
      startDate: '2025-11-01',
    });

    const history = studentEnrollmentService.getStudentEnrollmentHistory('stu-45001');
    expect(history).toHaveLength(3);
    expect(history[0].academicYear).toBe(2567);
    expect(history[0].classroomName).toBe('ม.1/1');
    expect(history[1].academicYear).toBe(2568);
    expect(history[1].semesterNo).toBe(1);
    expect(history[2].status).toBe('ACTIVE');
  });

  it('closes an active enrollment when student is promoted or graduated', () => {
    studentEnrollmentService.createEnrollment({
      studentId: 'stu-grad-1',
      studentCode: '43001',
      studentName: 'นางสาว จบการศึกษา',
      classroomId: 'room-3-1',
      classroomName: 'ม.3/1',
      academicYear: 2568,
      semesterNo: 2,
      seatNo: 12,
      status: 'ACTIVE',
      startDate: '2025-11-01',
    });

    const closed = studentEnrollmentService.closeActiveEnrollment('stu-grad-1', 'GRADUATED', '2026-03-31');
    expect(closed).toBe(true);

    const history = studentEnrollmentService.getStudentEnrollmentHistory('stu-grad-1');
    expect(history[0].status).toBe('GRADUATED');
    expect(history[0].endDate).toBe('2026-03-31');

    const activeList = studentEnrollmentService.getActiveEnrollments('room-3-1');
    expect(activeList).toHaveLength(0);
  });
});
