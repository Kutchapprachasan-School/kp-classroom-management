import { describe, it, expect, beforeEach } from 'vitest';
import { academicCalendarService } from '../src/services/academicCalendarService';
import { coursesCurriculumService } from '../src/services/coursesCurriculumService';
import { calendarEventStorageService } from '../src/services/calendarEventStorageService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';
import { attendanceCorrelationService } from '../src/services/attendanceCorrelationService';
import { authService } from '../src/services/authService';

describe('Teacher Curriculum Isolation & Academic Term Break System', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Academic Term Break & Attendance Exclusion', () => {
    it('accurately identifies dates within and outside active term', () => {
      // Default active term: 15 พ.ค. 2569 (2026-05-15) - 10 ต.ค. 2569 (2026-10-10)
      expect(academicCalendarService.isDateInActiveTerm('2026-06-01')).toBe(true);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-10')).toBe(true);
      
      // Dates after 10 ต.ค. 2569 (e.g. 20 ต.ค. 2569) are during school break
      expect(academicCalendarService.isDateInActiveTerm('2026-10-20')).toBe(false);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-25')).toBe(false);
    });

    it('returns 0 teaching periods during school break or non-instructional days', () => {
      // 2026-10-20 is during break, so getTodayTeachingSlots and getTodayTeachingPeriodsCount return 0/[]
      const count = calendarEventStorageService.getTodayTeachingPeriodsCount('อังคาร');
      expect(count).toBe(0);

      const slots = calendarEventStorageService.getTodayTeachingSlots('อังคาร');
      expect(slots).toEqual([]);
    });

    it('excludes records outside active term from 80% attendance calculation', () => {
      // Save period attendance records for student S001 in TH101
      // 1. One valid record during term (2026-06-01): PRESENT
      // 2. One out-of-term record during break (2026-10-20): ABSENT
      attendanceCorrelationService.savePeriodRecords([
        {
          id: 'att-1',
          date: '2026-06-01',
          period: 1,
          courseCode: 'TH101',
          classroomId: 'room-1-1',
          studentId: 'stu-1',
          studentCode: 'S001',
          studentName: 'เด็กชายสมชาย',
          status: 'PRESENT',
          markedBy: 'ครูภาษาไทย',
          markedAt: new Date().toISOString(),
        },
        {
          id: 'att-2',
          date: '2026-10-20', // Out of term / school break date!
          period: 1,
          courseCode: 'TH101',
          classroomId: 'room-1-1',
          studentId: 'stu-1',
          studentCode: 'S001',
          studentName: 'เด็กชายสมชาย',
          status: 'ABSENT',
          markedBy: 'ครูภาษาไทย',
          markedAt: new Date().toISOString(),
        },
      ]);

      const summary = attendanceCorrelationService.calculateAttendance80Rule('S001', 'TH101');
      // Only the in-term record (PRESENT) should be counted: 1/1 = 100%
      expect(summary.totalScheduledPeriods).toBe(1);
      expect(summary.earnedPeriods).toBe(1);
      expect(summary.absentCount).toBe(0); // The out-of-term absent is excluded!
      expect(summary.attendanceRate).toBe(100);
      expect(summary.isEligibleForExam).toBe(true);
    });
  });

  describe('2. Teacher Curriculum & Timetable Isolation (ของใครของมัน)', () => {
    it('stamps teacher identity when creating courses and isolates by teacher', () => {
      // Teacher A creates Thai course
      const courseA = coursesCurriculumService.createCourse({
        code: 'TH101',
        name: 'ภาษาไทยพื้นฐาน 1',
        strand: 'ภาษาไทย',
        level: 'ม.1',
        credits: 1.5,
        periodsPerWeek: 3,
        academicYear: '2569',
        term: '1',
        assignedClassrooms: ['ม.1/1'],
        teacherId: 'T001',
        teacherName: 'ครูสมชาย ภาษาไทย',
        units: [],
      });

      // Teacher B creates Math course
      const courseB = coursesCurriculumService.createCourse({
        code: 'MA101',
        name: 'คณิตศาสตร์พื้นฐาน 1',
        strand: 'คณิตศาสตร์',
        level: 'ม.1',
        credits: 1.5,
        periodsPerWeek: 3,
        academicYear: '2569',
        term: '1',
        assignedClassrooms: ['ม.1/2'],
        teacherId: 'T002',
        teacherName: 'ครูสมศรี คณิตศาสตร์',
        units: [],
      });

      expect(courseA.teacherId).toBe('T001');
      expect(courseB.teacherId).toBe('T002');

      // Query courses for Teacher A
      const coursesForTeacherA = coursesCurriculumService.getCourses(undefined, undefined, 'T001');
      expect(coursesForTeacherA.some((c) => c.code === 'TH101')).toBe(true);
      expect(coursesForTeacherA.some((c) => c.code === 'MA101')).toBe(false);

      // Query courses for Teacher B
      const coursesForTeacherB = coursesCurriculumService.getCourses(undefined, undefined, 'T002');
      expect(coursesForTeacherB.some((c) => c.code === 'MA101')).toBe(true);
      expect(coursesForTeacherB.some((c) => c.code === 'TH101')).toBe(false);
    });

    it('isolates curriculum waiting pool for timetable scheduling per teacher', () => {
      // Waiting pool for Teacher A should only contain TH101
      const poolA = coursesCurriculumService.getCurriculumWaitingPoolSlots([], '2569', '1', 'T001');
      expect(poolA.every((s) => s.subjectCode === 'TH101')).toBe(true);
      expect(poolA.some((s) => s.subjectCode === 'MA101')).toBe(false);

      // Waiting pool for Teacher B should only contain MA101
      const poolB = coursesCurriculumService.getCurriculumWaitingPoolSlots([], '2569', '1', 'T002');
      expect(poolB.every((s) => s.subjectCode === 'MA101')).toBe(true);
      expect(poolB.some((s) => s.subjectCode === 'TH101')).toBe(false);
    });

    it('isolates dynamic teaching subjects per teacher in assignment and grading services', () => {
      const subjectsA = teacherCourseAssignmentService.getDynamicTeachingSubjects('T001');
      expect(subjectsA.some((s) => s.code === 'TH101')).toBe(true);
      expect(subjectsA.some((s) => s.code === 'MA101')).toBe(false);

      const subjectsB = teacherCourseAssignmentService.getDynamicTeachingSubjects('T002');
      expect(subjectsB.some((s) => s.code === 'MA101')).toBe(true);
      expect(subjectsB.some((s) => s.code === 'TH101')).toBe(false);
    });

    it('isolates timetable matrix slots in storage by teacherId', () => {
      // Save Teacher A timetable slot
      calendarEventStorageService.markMatrixSlotChecked('จันทร์', 1, 'T001');

      // The key for T001 exists and has scoped data
      const keyA = calendarEventStorageService.getMatrixStorageKey('T001');
      const keyB = calendarEventStorageService.getMatrixStorageKey('T002');

      expect(keyA).toBe('kp_teacher_matrix_slots_T001');
      expect(keyB).toBe('kp_teacher_matrix_slots_T002');
      expect(keyA).not.toBe(keyB);
    });

    it('accurately identifies term break, holiday, and weekend days in monthly attendance calendar', () => {
      const monthDays = attendanceCorrelationService.getPeriodCalendarMonthStatus(
        'TH101',
        'room-1-1',
        2026,
        10,
        '2026-10-21'
      );

      // October 13 is King Bhumibol Day (isHoliday = true)
      const day13 = monthDays.find((d) => d.dayOfMonth === 13);
      expect(day13?.isHoliday).toBe(true);

      // October 23 is Chulalongkorn Day (isHoliday = true)
      const day23 = monthDays.find((d) => d.dayOfMonth === 23);
      expect(day23?.isHoliday).toBe(true);

      // October 3 is Saturday (isWeekend = true)
      const day3 = monthDays.find((d) => d.dayOfMonth === 3);
      expect(day3?.isWeekend).toBe(true);

      // October 14 is a Wednesday during term break (isTermBreak = true, isWeekend = false)
      const day14 = monthDays.find((d) => d.dayOfMonth === 14);
      expect(day14?.isTermBreak).toBe(true);
      expect(day14?.isWeekend).toBe(false);
    });
  });
});
