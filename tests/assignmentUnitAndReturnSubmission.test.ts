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
  RETURN_SUBMISSION_REASONS,
  type TermAssignmentItem,
} from '../src/services/sgsRosterAndSubmissionService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';

describe('Assignment Unit Grouping, Dynamic Tasks & Return Submission', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides comprehensive preset reasons for returning submission', () => {
    expect(RETURN_SUBMISSION_REASONS.length).toBeGreaterThan(3);
    expect(RETURN_SUBMISSION_REASONS).toContain('ไฟล์แนบไม่สมบูรณ์ / ไม่สามารถเปิดไฟล์ได้');
    expect(RETURN_SUBMISSION_REASONS).toContain('งานยังไม่ครบถ้วนตามข้อกำหนดของชิ้นงาน');
    expect(RETURN_SUBMISSION_REASONS).toContain('รูปภาพหรือเอกสารไม่ชัดเจน / ข้อมูลตกหล่น');
  });

  it('returns a submission for revision with status, reason, and feedback', () => {
    // 1. Submit work first
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-test-1',
      studentCode: '50001',
      studentName: 'เด็กชายสมชาย มั่นคง',
      workAttachmentLabel: 'ใบงานที่ 1.pdf',
      academicYearTerm: '1/2569',
    });

    const subBefore = sgsRosterAndSubmissionService.getSubmissions().find(
      (s) => s.assignmentId === 'asg-test-1' && s.studentCode === '50001'
    );
    expect(subBefore).toBeDefined();
    expect(subBefore?.status).toBe('SUBMITTED_PENDING');

    // 2. Return submission
    const updatedList = sgsRosterAndSubmissionService.returnSubmissionForRevision(
      'asg-test-1',
      '50001',
      'รูปภาพหรือเอกสารไม่ชัดเจน / ข้อมูลตกหล่น',
      'กรุณาถ่ายรูปใหม่ให้ชัดเจนและเปิดไฟสว่างขึ้นครับ'
    );

    const updated = updatedList.find(
      (s) => s.assignmentId === 'asg-test-1' && s.studentCode === '50001'
    );

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('RETURNED_REVISION');
    expect(updated?.returnReason).toBe('รูปภาพหรือเอกสารไม่ชัดเจน / ข้อมูลตกหล่น');
    expect(updated?.teacherFeedback).toContain('กรุณาถ่ายรูปใหม่ให้ชัดเจนและเปิดไฟสว่างขึ้นครับ');
    expect(updated?.returnedAt).toBeDefined();

    // 3. Queue item also returns properly
    const queue = teacherCourseAssignmentService.getGradingQueue();
    const firstItem = queue[0];
    if (firstItem) {
      const { updatedQueue } = teacherCourseAssignmentService.returnSubmission(
        firstItem.id,
        'รูปภาพหรือเอกสารไม่ชัดเจน / ข้อมูลตกหล่น',
        'ขอให้ถ่ายใหม่'
      );
      const returned = updatedQueue.find((i) => i.id === firstItem.id);
      expect(returned?.status).toBe('RETURNED');
      expect(returned?.teacherFeedback).toContain('ขอให้ถ่ายใหม่');
    }
  });

  it('updates assignment and synchronizes unit-level properties across tasks in the same unit', () => {
    // Add 2 tasks belonging to the same unit
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'ชิ้นงานที่ 1: พื้นฐานการวาดภาพ',
      unitId: 'unit-art-1',
      unitTitle: 'หน่วยที่ 1: ศิลปะสร้างสรรค์',
      unitMaxScore: 10,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 0, // dynamic
      courseCode: 'ศ23101',
      targetClassrooms: ['ม.3/1'],
    });

    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'ชิ้นงานที่ 2: การลงสีน้ำ',
      unitId: 'unit-art-1',
      unitTitle: 'หน่วยที่ 1: ศิลปะสร้างสรรค์',
      unitMaxScore: 10,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 0,
      courseCode: 'ศ23101',
      targetClassrooms: ['ม.3/1'],
    });

    const tasks = sgsRosterAndSubmissionService.getTermAssignments('ศ23101');
    expect(tasks.length).toBe(2);

    // Update the first task's unit title and max score
    sgsRosterAndSubmissionService.updateTermAssignment(tasks[0].id, {
      unitTitle: 'หน่วยที่ 1: วิจิตรศิลป์เบื้องต้น',
      unitMaxScore: 15,
      scoringMethod: 'RAW_SCORE_AVERAGE',
    });

    const refreshed = sgsRosterAndSubmissionService.getTermAssignments('ศ23101');
    // Both tasks in the same unit must have synchronized unitTitle, unitMaxScore, scoringMethod
    expect(refreshed[0].unitTitle).toBe('หน่วยที่ 1: วิจิตรศิลป์เบื้องต้น');
    expect(refreshed[0].unitMaxScore).toBe(15);
    expect(refreshed[0].scoringMethod).toBe('RAW_SCORE_AVERAGE');

    expect(refreshed[1].unitTitle).toBe('หน่วยที่ 1: วิจิตรศิลป์เบื้องต้น');
    expect(refreshed[1].unitMaxScore).toBe(15);
    expect(refreshed[1].scoringMethod).toBe('RAW_SCORE_AVERAGE');
  });

  it('calculates dynamic unit scores automatically without pre-defined task count', () => {
    // Add 3 tasks in dynamic unit (totalTasksInUnit = 0)
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานที่ 1',
      unitId: 'unit-sci-1',
      unitTitle: 'หน่วยเคมีเบื้องต้น',
      unitMaxScore: 10,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 0, // dynamic
      courseCode: 'ว23101',
      targetClassrooms: ['ม.3/1'],
    });

    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานที่ 2',
      unitId: 'unit-sci-1',
      unitTitle: 'หน่วยเคมีเบื้องต้น',
      unitMaxScore: 10,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 0, // dynamic
      courseCode: 'ว23101',
      targetClassrooms: ['ม.3/1'],
    });

    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานที่ 3',
      unitId: 'unit-sci-1',
      unitTitle: 'หน่วยเคมีเบื้องต้น',
      unitMaxScore: 10,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      totalTasksInUnit: 0, // dynamic
      courseCode: 'ว23101',
      targetClassrooms: ['ม.3/1'],
    });

    const tasks = sgsRosterAndSubmissionService.getTermAssignments('ว23101');
    expect(tasks.length).toBe(3);

    // Student submits 2 out of 3 tasks
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: tasks[0].id,
      studentCode: '50002',
      studentName: 'สมหญิง',
      workAttachmentLabel: 'งาน1',
    });
    sgsRosterAndSubmissionService.gradeSubmission(tasks[0].id, '50002', 10, 'GRADED');

    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: tasks[1].id,
      studentCode: '50002',
      studentName: 'สมหญิง',
      workAttachmentLabel: 'งาน2',
    });
    sgsRosterAndSubmissionService.gradeSubmission(tasks[1].id, '50002', 10, 'GRADED');

    // 2 out of 3 tasks submitted: (2 / 3) * 10 = 6.67 => rounds up to 7
    const result = sgsRosterAndSubmissionService.computeStudentSgsGrades(
      {
        studentCode: '50002',
        studentName: 'สมหญิง',
        classroom: 'ม.3/1',
      } as any,
      'ว23101'
    );

    expect(result.u1).toBe(7);
    expect(result.submittedCount).toBe(2);
  });

  it('preserves target classroom correctly without reverting to hardcoded default room', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานวิชาภาษาญี่ปุ่น ภาระงานที่ 1',
      courseCode: 'ญ32202',
      courseName: 'ภาษาญี่ปุ่น 4',
      targetClassrooms: ['ม.5/4'],
      maxScore: 10,
      dueDate: '2026-10-31',
    });

    const tasksM54 = sgsRosterAndSubmissionService.getTermAssignments('ญ32202', 'ม.5/4');
    expect(tasksM54.length).toBe(1);
    expect(tasksM54[0].targetClassrooms).toContain('ม.5/4');

    // Querying for other rooms must not return this assignment
    const tasksM11 = sgsRosterAndSubmissionService.getTermAssignments('ญ32202', 'ม.1/1');
    expect(tasksM11.length).toBe(0);
  });

  it('persists assignment description and study material attachments properly', () => {
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'ใบงานที่ 3: สารประกอบอินทรีย์',
      description: 'ให้นักเรียนศึกษาโครงสร้างเคมีจากเอกสารแนบ และตอบคำถามท้ายบทข้อ 1-5',
      courseCode: 'ว32201',
      courseName: 'เคมี 2',
      targetClassrooms: ['ม.5/1'],
      attachments: [
        {
          id: 'lp-chem-1',
          name: 'เอกสารประกอบการสอน_เคมีอินทรีย์.pdf',
          type: 'PDF',
          url: 'https://cdn.school.ac.th/chem-lp-1.pdf',
          size: '1.2 MB',
          source: 'LESSON_PLAN',
          lessonPlanTitle: 'แผนการจัดการเรียนรู้ที่ 5 สารประกอบไฮโดรคาร์บอน',
        },
        {
          id: 'upload-img-1',
          name: 'ตัวอย่างโครงสร้างลิวอิส.png',
          type: 'IMAGE',
          fileDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          size: '45 KB',
          source: 'UPLOAD',
        },
      ],
      maxScore: 10,
    });

    const tasks = sgsRosterAndSubmissionService.getTermAssignments('ว32201');
    expect(tasks.length).toBe(1);
    expect(tasks[0].description).toContain('ให้นักเรียนศึกษาโครงสร้างเคมี');
    expect(tasks[0].attachments).toBeDefined();
    expect(tasks[0].attachments?.length).toBe(2);
    expect(tasks[0].attachments?.[0].source).toBe('LESSON_PLAN');
    expect(tasks[0].attachments?.[0].type).toBe('PDF');
    expect(tasks[0].attachments?.[1].source).toBe('UPLOAD');
    expect(tasks[0].attachments?.[1].fileDataUrl).toContain('data:image/png');

    // Test update attachments and description
    sgsRosterAndSubmissionService.updateTermAssignment(tasks[0].id, {
      description: 'แก้ไขคำชี้แจง: ให้ทำเฉพาะข้อ 1-3 เท่านั้น',
      attachments: [
        tasks[0].attachments![0], // Keep PDF only
      ],
    });

    const updated = sgsRosterAndSubmissionService.getTermAssignments('ว32201');
    expect(updated[0].description).toBe('แก้ไขคำชี้แจง: ให้ทำเฉพาะข้อ 1-3 เท่านั้น');
    expect(updated[0].attachments?.length).toBe(1);
    expect(updated[0].attachments?.[0].name).toBe('เอกสารประกอบการสอน_เคมีอินทรีย์.pdf');
  });
});
