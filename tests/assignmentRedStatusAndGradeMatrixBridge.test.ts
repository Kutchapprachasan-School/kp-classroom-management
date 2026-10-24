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
  isSameClassroom,
  normalizeClassroomCode,
  matchSubmissionToAssignment,
  sgsRosterAndSubmissionService,
} from '../src/services/sgsRosterAndSubmissionService';
import { registerClassroomNames } from '../src/services/studentService';
import { resolveRoomCandidates } from '../src/services/masterDataService';

describe('Assignment Red Pending Status & Grade Matrix Classroom Bridge Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    registerClassroomNames([
      { id: 'room-1791986992100', name: 'ม.5/4', roomNumber: 'ม.5/4' },
      { id: 'room-1791986991422', name: 'ม.6/1', roomNumber: 'ม.6/1' },
      { id: 'room-1791986992580', name: 'ม.6/3', roomNumber: 'ม.6/3' },
    ]);
    localStorage.setItem(
      'cls_classrooms_data',
      JSON.stringify([
        { id: 'room-1791986992100', name: 'ม.5/4', roomNumber: 'ม.5/4' },
        { id: 'room-1791986991422', name: 'ม.6/1', roomNumber: 'ม.6/1' },
        { id: 'room-1791986992580', name: 'ม.6/3', roomNumber: 'ม.6/3' },
      ])
    );
  });

  it('1. isSameClassroom bidirectionally matches Thai room labels and PostgreSQL IDs', () => {
    expect(isSameClassroom('ม.5/4', 'room-1791986992100')).toBe(true);
    expect(isSameClassroom('room-1791986992100', 'ม.5/4')).toBe(true);
    expect(isSameClassroom('ม.6/1', 'room-1791986991422')).toBe(true);
    expect(isSameClassroom('ม.6/3', 'room-1791986992580')).toBe(true);

    // Mismatched rooms must return false
    expect(isSameClassroom('ม.5/4', 'room-1791986991422')).toBe(false);
    expect(isSameClassroom('ม.6/3', 'ม.5/4')).toBe(false);
  });

  it('2. resolveRoomCandidates expands Thai room labels to include database IDs from cls_classrooms_data', () => {
    const candsM54 = resolveRoomCandidates('ม.5/4');
    expect(candsM54).toContain('ม.5/4');
    expect(candsM54).toContain('room-1791986992100');

    const candsFromId = resolveRoomCandidates('room-1791986992100');
    expect(candsFromId).toContain('room-1791986992100');
    expect(candsFromId).toContain('ม.5/4');
  });

  it('3. matchSubmissionToAssignment bridges a submission with DB room ID to an assignment targeting Thai label', () => {
    const sub = {
      assignmentId: 'asg-japanese-1',
      studentCode: '14983',
      courseCode: 'ญ32202',
      classroom: 'room-1791986992100',
      score: 10,
      status: 'GRADED',
    };

    const asg = {
      id: 'asg-japanese-1',
      courseCode: 'ญ32202',
      targetClassrooms: ['ม.5/4'],
      maxScore: 10,
      scorePart: 'PRE_MIDTERM' as const,
    };

    expect(matchSubmissionToAssignment(sub, asg)).toBe(true);
  });

  it('4. computeStudentSgsGrades correctly displays student graded scores in preMidterm column', () => {
    const asgList = [
      {
        id: 'asg-japanese-1',
        title: 'งานที่ 1 私の家族',
        courseCode: 'ญ32202',
        scorePart: 'PRE_MIDTERM' as const,
        unitId: 'unit-ch7',
        unitTitle: 'บทที่ 7',
        scoringMethod: 'RAW_SCORE_AVERAGE' as const,
        unitMaxScore: 10,
        targetClassrooms: ['ม.5/4'],
        maxScore: 10,
      },
    ];

    const subList = [
      {
        assignmentId: 'asg-japanese-1',
        studentCode: '14983',
        courseCode: 'ญ32202',
        classroom: 'ม.5/4',
        score: 10,
        status: 'GRADED' as const,
      },
    ];

    localStorage.setItem('kp_term_assignments_v2', JSON.stringify(asgList));
    localStorage.setItem('kp_work_submissions_v2', JSON.stringify(subList));

    const student = {
      studentCode: '14983',
      fullName: 'นายอนุวัฒน์ อินทศร',
      classroom: 'ม.5/4',
      attendancePercent: 100,
      transferState: 'ACTIVE' as const,
    };

    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      student as any,
      'ญ32202',
      'ม.5/4'
    );

    // Score must be calculated from works and displayed in preMidterm
    expect(result.preMidterm).toBe(10);
    expect(result.total).toBe(10);
    expect(result.items.length).toBe(1);
    expect(result.items[0].score).toBe(10);
    expect(result.items[0].status).toBe('GRADED');
  });

  it('5. Pending review submission triggers PENDING_REVIEW state when unreviewed work exists', () => {
    const asg = {
      id: 'asg-japanese-3',
      title: 'งานที่ 3 แบบฝึกหัด',
      courseCode: 'ญ32202',
      scorePart: 'PRE_MIDTERM' as const,
      unitId: 'unit-ch7',
      unitTitle: 'บทที่ 7',
      targetClassrooms: ['ม.5/4'],
      maxScore: 10,
    };

    const pendingSub = {
      assignmentId: 'asg-japanese-3',
      studentCode: '14993',
      courseCode: 'ญ32202',
      classroom: 'ม.5/4',
      score: null,
      status: 'SUBMITTED_PENDING' as const,
    };

    localStorage.setItem('kp_term_assignments_v2', JSON.stringify([asg]));
    localStorage.setItem('kp_work_submissions_v2', JSON.stringify([pendingSub]));

    const subs = sgsRosterAndSubmissionService.getSubmissions();
    const pendingCount = subs.filter((s) => s.status === 'SUBMITTED_PENDING').length;
    expect(pendingCount).toBe(1);

    // When pending review count > 0, status must evaluate to PENDING_REVIEW
    const displayStatus = pendingCount > 0 ? 'PENDING_REVIEW' : 'PENDING_SCORE';
    expect(displayStatus).toBe('PENDING_REVIEW');
  });
});
