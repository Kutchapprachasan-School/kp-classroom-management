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
  sgsRosterAndSubmissionService,
  type TermAssignmentItem,
} from '../src/services/sgsRosterAndSubmissionService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';
import { gradeService } from '../src/services/gradeService';

describe('Scoring Pipeline Comprehensive Bug Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('BUG-1: does not award full marks for SUBMITTED_PENDING direct score assignments (prevents score inflation)', () => {
    // Create a DIRECT_SCORE assignment (default)
    const asgs = sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-direct-1',
      title: 'ใบงานที่ 1 (ตรวจให้คะแนนจริง)',
      courseCode: 'ว21101',
      maxScore: 20,
      scorePart: 'PRE_MIDTERM',
      scoringMethod: 'DIRECT_SCORE',
      targetClassrooms: ['ม.1/1'],
    });

    // Student submits work but teacher hasn't graded yet (SUBMITTED_PENDING, score = null)
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-direct-1',
      studentCode: '10001',
      workTitle: 'ใบงานที่ 1 (ตรวจให้คะแนนจริง)',
    });

    const studentRecord = {
      studentCode: '10001',
      studentName: 'เด็กชายสมชาย',
      classroom: 'ม.1/1',
    };

    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      studentRecord as any,
      'ว21101',
      'ม.1/1'
    );

    // Submission is pending review, so earned score must be 0, NOT 20
    expect(result.preMidterm).toBe('');
    expect(result.formativeScore).toBe(0);
    expect(result.pendingReviewCount).toBe(1);
    expect(result.submittedCount).toBe(1);
  });

  it('BUG-1: awards full marks for SUBMISSION_COUNT_RATIO units where submission presence is the score', () => {
    // Create unit tasks using SUBMISSION_COUNT_RATIO
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-ratio-1',
      title: 'ส่งสมุดคาบที่ 1',
      unitId: 'unit-notebook',
      unitTitle: 'การส่งสมุดแบบฝึกหัด',
      unitMaxScore: 10,
      courseCode: 'ค21101',
      scorePart: 'PRE_MIDTERM',
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 1,
      targetClassrooms: ['ม.1/1'],
    });

    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-ratio-1',
      studentCode: '10002',
      workTitle: 'ส่งสมุดคาบที่ 1',
    });

    const studentRecord = {
      studentCode: '10002',
      studentName: 'เด็กหญิงสมหญิง',
      classroom: 'ม.1/1',
    };

    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      studentRecord as any,
      'ค21101',
      'ม.1/1'
    );

    // SUBMISSION_COUNT_RATIO grants 10/10 upon submission
    expect(result.preMidterm).toBe(10);
    expect(result.submittedCount).toBe(1);
  });

  it('BUG-2: bulkGradeAllSubmitted bridges scores to gradeService and updates grading queue in batch', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-bulk-1',
      title: 'งานการบ้าน 1',
      courseCode: 'ท21101',
      maxScore: 10,
      targetClassrooms: ['ม.1/1'],
    });

    // 2 students submit
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-bulk-1',
      studentCode: '10003',
      workTitle: 'งานการบ้าน 1',
    });
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-bulk-1',
      studentCode: '10004',
      workTitle: 'งานการบ้าน 1',
    });

    const subsBefore = sgsRosterAndSubmissionService.getSubmissions();
    expect(subsBefore.filter((s) => s.status === 'SUBMITTED_PENDING').length).toBe(2);

    // Teacher bulk grades all submitted
    const updatedSubs = sgsRosterAndSubmissionService.bulkGradeAllSubmitted('asg-bulk-1');
    const gradedItems = updatedSubs.filter((s) => s.assignmentId === 'asg-bulk-1');
    expect(gradedItems.every((s) => s.status === 'GRADED' && s.score === 10)).toBe(true);

    // Grading queue items must be updated to GRADED
    const queue = teacherCourseAssignmentService.getGradingQueue();
    const queue1 = queue.find((q) => q.studentCode === '10003');
    const queue2 = queue.find((q) => q.studentCode === '10004');
    expect(queue1?.status).toBe('GRADED');
    expect(queue2?.status).toBe('GRADED');
  });

  it('BUG-3: returnSubmissionForRevision correctly matches unit-based assignment and updates in-place', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-unit-item-1',
      unitId: 'unit-science-exp',
      title: 'รายงานการทดลอง',
      courseCode: 'ว21101',
      targetClassrooms: ['ม.1/1'],
    });

    // Student submits with assignmentId = asg-unit-item-1
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-unit-item-1',
      studentCode: '10005',
      workTitle: 'รายงานการทดลอง',
    });

    expect(sgsRosterAndSubmissionService.getSubmissions().length).toBe(1);

    // Teacher returns submission for revision
    const afterReturn = sgsRosterAndSubmissionService.returnSubmissionForRevision(
      'asg-unit-item-1',
      '10005',
      'รูปภาพไม่ชัดเจน',
      'กรุณาถ่ายใหม่'
    );

    // Must update in-place, NOT create duplicate entry
    expect(afterReturn.length).toBe(1);
    expect(afterReturn[0].status).toBe('RETURNED_REVISION');
    expect(afterReturn[0].returnReason).toBe('รูปภาพไม่ชัดเจน');
    expect(afterReturn[0].teacherFeedback).toContain('กรุณาถ่ายใหม่');
  });

  it('BUG-4: submitStudentWorkToR2 persists courseCode and unitId from assignment', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-with-course',
      courseCode: 'อ21101',
      unitId: 'unit-vocab-1',
      title: 'Vocabulary Week 1',
      targetClassrooms: ['ม.1/1'],
    });

    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-with-course',
      studentCode: '10006',
      workTitle: 'Vocabulary Week 1',
    });

    const sub = sgsRosterAndSubmissionService.getSubmissions().find(
      (s) => s.assignmentId === 'asg-with-course' && s.studentCode === '10006'
    );

    expect(sub).toBeDefined();
    expect(sub?.courseCode).toBe('อ21101');
    expect(sub?.unitId).toBe('unit-vocab-1');
  });

  it('BUG-5: caps scores exceeding course weights and returns informative warnings', () => {
    // Add 2 direct assignments for PRE_MIDTERM totaling 30 points (course weight default is 25)
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-weight-1',
      title: 'งานที่ 1',
      courseCode: 'ศ21101',
      maxScore: 15,
      scorePart: 'PRE_MIDTERM',
      targetClassrooms: ['ม.1/1'],
    });
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-weight-2',
      title: 'งานที่ 2',
      courseCode: 'ศ21101',
      maxScore: 15,
      scorePart: 'PRE_MIDTERM',
      targetClassrooms: ['ม.1/1'],
    });

    // Student scores 15 on both = 30 points earned
    sgsRosterAndSubmissionService.gradeSubmission('asg-weight-1', '10007', 15);
    sgsRosterAndSubmissionService.gradeSubmission('asg-weight-2', '10007', 15);

    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      { studentCode: '10007', studentName: 'สมศักดิ์', classroom: 'ม.1/1' } as any,
      'ศ21101',
      'ม.1/1'
    );

    // Default preMidterm weight is 25, so earned 30 is capped at 25
    expect(result.preMidterm).toBe(25);
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('เกินสัดส่วนที่กำหนด');
  });

  it('BUG-6: selects newest submission and ignores stale RETURNED_REVISION when student resubmitted', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      id: 'asg-resub-1',
      title: 'แบบฝึกหัดบทที่ 2',
      courseCode: 'ว21101',
      maxScore: 10,
      scorePart: 'PRE_MIDTERM',
      targetClassrooms: ['ม.1/1'],
    });

    // 1. Initial submission
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-resub-1',
      studentCode: '10008',
      workTitle: 'แบบฝึกหัดบทที่ 2 (ส่งครั้งแรก)',
    });

    // 2. Teacher returns for revision
    sgsRosterAndSubmissionService.returnSubmissionForRevision(
      'asg-resub-1',
      '10008',
      'งานไม่สมบูรณ์'
    );

    // 3. Student resubmits
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-resub-1',
      studentCode: '10008',
      workTitle: 'แบบฝึกหัดบทที่ 2 (ส่งแก้แล้ว)',
    });

    // 4. Teacher grades the resubmission
    sgsRosterAndSubmissionService.gradeSubmission('asg-resub-1', '10008', 9);

    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      { studentCode: '10008', studentName: 'สมปอง', classroom: 'ม.1/1' } as any,
      'ว21101',
      'ม.1/1'
    );

    // Must pick the graded resubmission (9), not treat as returned/missing
    expect(result.preMidterm).toBe(9);
    expect(result.missingCount).toBe(0);
  });
});
