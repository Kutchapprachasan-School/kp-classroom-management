// tests/assignmentClassroomIsolation.test.ts
// ทดสอบความถูกต้องในการแยกขอบเขตชิ้นงานระหว่างห้องเรียน (เช่น ม.6/1 vs ม.6/3)
// เพื่อไม่ให้ชื่องานหรือการตรวจงานของห้องหนึ่งไปปะปนกับอีกห้องหนึ่ง

import { describe, it, expect, beforeEach } from 'vitest';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    length: 0,
    key: () => null,
  };
}

import {
  matchSubmissionToAssignment,
  sgsRosterAndSubmissionService,
  type TermAssignmentItem,
} from '../src/services/sgsRosterAndSubmissionService';
import {
  teacherCourseAssignmentService,
  getTeacherTaughtClassrooms,
} from '../src/services/teacherCourseAssignmentService';
import { coursesCurriculumService } from '../src/services/coursesCurriculumService';
import { studentService } from '../src/services/studentService';

describe('Assignment Classroom Isolation Tests (6/1 vs 6/3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects matchSubmissionToAssignment when assignment is targeted to a different classroom', () => {
    const asgRoom63 = {
      id: 'asg-room-6-3-math-unit1',
      unitId: 'unit-calculus',
      title: 'ใบงานที่ 1 แคลคูลัส (ม.6/3)',
      courseCode: 'MA33101',
      targetClassrooms: ['ม.6/3'],
    };

    const subStudent61 = {
      id: 'sub-61-001',
      assignmentId: 'unit-calculus',
      courseCode: 'MA33101',
      studentCode: '61001',
      classroom: 'ม.6/1',
      workTitle: 'ใบงานที่ 1 แคลคูลัส (ม.6/1)',
    };

    // Since student is in 6/1 and asg is only for 6/3, matching MUST return false
    const isMatched = matchSubmissionToAssignment(subStudent61, asgRoom63);
    expect(isMatched).toBe(false);
  });

  it('allows matchSubmissionToAssignment when assignment is targeted to the matching classroom or ALL', () => {
    const asgRoom61 = {
      id: 'asg-room-6-1-math-unit1',
      unitId: 'unit-calculus-61',
      title: 'ใบงานที่ 1 แคลคูลัส (ม.6/1)',
      courseCode: 'MA33101',
      targetClassrooms: ['ม.6/1'],
    };

    const subStudent61 = {
      id: 'sub-61-001',
      assignmentId: 'asg-room-6-1-math-unit1',
      courseCode: 'MA33101',
      studentCode: '61001',
      classroom: 'ม.6/1',
      workTitle: 'ใบงานที่ 1 แคลคูลัส (ม.6/1)',
    };

    expect(matchSubmissionToAssignment(subStudent61, asgRoom61)).toBe(true);

    // Also true if assignment is for ALL rooms
    const asgAllRooms = {
      id: 'asg-all-math-unit1',
      title: 'ใบงานกลาง',
      courseCode: 'MA33101',
      targetClassrooms: ['ALL'],
    };
    const subForAll = {
      id: 'sub-all-001',
      assignmentId: 'asg-all-math-unit1',
      courseCode: 'MA33101',
      studentCode: '61001',
      classroom: 'ม.6/1',
      workTitle: 'ใบงานกลาง',
    };
    expect(matchSubmissionToAssignment(subForAll, asgAllRooms)).toBe(true);
  });

  it('preserves 6/1 assignment title in getGradingQueue without cross-contamination from 6/3', () => {
    // 1. Setup assignments: one for 6/3 and one for 6/1
    const assignments: TermAssignmentItem[] = [
      {
        id: 'asg-6-3',
        title: 'โครงงานวิทยาศาสตร์ ห้อง 6/3',
        courseCode: 'SC33101',
        scorePart: 'PRE_MIDTERM',
        maxScore: 10,
        indicatorCode: 'ว1.1',
        dueDate: '2026-10-30',
        targetClassrooms: ['ม.6/3'],
        unitId: 'unit-sc-shared',
      },
      {
        id: 'asg-6-1',
        title: 'โครงงานวิทยาศาสตร์ ห้อง 6/1',
        courseCode: 'SC33101',
        scorePart: 'PRE_MIDTERM',
        maxScore: 10,
        indicatorCode: 'ว1.1',
        dueDate: '2026-10-30',
        targetClassrooms: ['ม.6/1'],
        unitId: 'unit-sc-shared',
      },
    ];
    localStorage.setItem('kp_term_assignments', JSON.stringify(assignments));

    // 2. Setup 6/1 student
    studentService.saveLocalStudents('ม.6/1', [
      {
        id: 'stu-61-01',
        code: '61001',
        no: 1,
        name: 'สมชาย รักเรียน',
        classroomId: 'ม.6/1',
        attendance: '10/10',
        score: 80,
        status: 'NORMAL',
        gender: 'MALE',
      },
    ]);

    // 3. Student submits under unit-sc-shared
    sgsRosterAndSubmissionService.saveSubmissions([
      {
        id: 'sub-somchai-1',
        assignmentId: 'unit-sc-shared',
        studentCode: '61001',
        courseCode: 'SC33101',
        classroom: 'ม.6/1',
        workTitle: 'โครงงานวิทยาศาสตร์ ห้อง 6/1',
        status: 'SUBMITTED_PENDING',
        submittedAt: new Date().toISOString(),
      },
    ]);

    // 4. Query grading queue
    const queue = teacherCourseAssignmentService.getGradingQueue();
    expect(queue.length).toBe(1);

    const item = queue[0];
    expect(item.studentCode).toBe('61001');
    // Crucial check: assignmentTitle MUST NOT be 6/3's title!
    expect(item.assignmentTitle).toBe('โครงงานวิทยาศาสตร์ ห้อง 6/1');
    expect(item.assignmentTitle).not.toContain('6/3');
  });

  it('filters gradebook matrix classroom dropdown to only classrooms taught for the selected subject', () => {
    // Setup 2 courses with specific taught classrooms
    coursesCurriculumService.createCourse({
      code: 'ส30206',
      name: 'ต้านทุจริตศึกษา',
      strand: 'สังคมศึกษา',
      level: 'ม.6',
      credits: 1,
      periodsPerWeek: 2,
      academicYear: '2569',
      term: '1',
      assignedClassrooms: ['ม.6/1', 'ม.6/3'],
    });

    coursesCurriculumService.createCourse({
      code: 'ค21101',
      name: 'คณิตศาสตร์พื้นฐาน',
      strand: 'คณิตศาสตร์',
      level: 'ม.1',
      credits: 1.5,
      periodsPerWeek: 3,
      academicYear: '2569',
      term: '1',
      assignedClassrooms: ['ม.1/1', 'ม.1/2'],
    });

    // 1. For ส30206, dropdown MUST ONLY contain ม.6/1 and ม.6/3, NEVER ม.1/1
    const roomsAntiCorruption = getTeacherTaughtClassrooms('ส30206');
    expect(roomsAntiCorruption).toContain('ม.6/1');
    expect(roomsAntiCorruption).toContain('ม.6/3');
    expect(roomsAntiCorruption).not.toContain('ม.1/1');
    expect(roomsAntiCorruption).not.toContain('ม.1/2');

    // 2. For ค21101, dropdown MUST ONLY contain ม.1/1 and ม.1/2, NEVER ม.6/1 or ม.6/3
    const roomsMath = getTeacherTaughtClassrooms('ค21101');
    expect(roomsMath).toContain('ม.1/1');
    expect(roomsMath).toContain('ม.1/2');
    expect(roomsMath).not.toContain('ม.6/1');
    expect(roomsMath).not.toContain('ม.6/3');

    // 3. For ALL subjects, returns only taught rooms across these courses
    const allTaughtRooms = getTeacherTaughtClassrooms('ALL');
    expect(allTaughtRooms).toContain('ม.6/1');
    expect(allTaughtRooms).toContain('ม.6/3');
    expect(allTaughtRooms).toContain('ม.1/1');
    expect(allTaughtRooms).toContain('ม.1/2');
    // Random unassigned room must not be in taught list
    expect(allTaughtRooms).not.toContain('ม.5/5');
  });
});
