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

import { sgsRosterAndSubmissionService, type StudentWorkSubmission } from '../src/services/sgsRosterAndSubmissionService';
import { r2StorageService } from '../src/services/r2StorageService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';

describe('R2 Storage Submission URL Resolution & Priority Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    r2StorageService.resetConfig();
    r2StorageService.configure({
      workerUrl: 'https://kps-r2-storage.kps-school.workers.dev',
      uploadSecret: 'KP_school',
    });
  });

  it('buildSubmissionKey does not duplicate studentCode prefix if fileName already contains it', () => {
    const key = r2StorageService.buildSubmissionKey({
      term: '2/2569',
      classroom: 'ม.5/4',
      assignmentId: 'asg-test-1',
      studentCode: '14993',
      fileName: '14993_Screenshot_20261022_200331_Samsung_Notes.webp',
    });

    expect(key).toBe(
      'kp-classroom-submissions/2-2569/ม.5-4/asg-test-1/14993_Screenshot_20261022_200331_Samsung_Notes.webp'
    );
    expect(key).not.toContain('14993_14993_');
  });

  it('getSubmissions() resolves r2ObjectKey to R2 URL even when fileDataUrl had a Base64 data URL', () => {
    const mockSubmission: StudentWorkSubmission = {
      id: 'sub_asg-1_14993',
      assignmentId: 'asg-1',
      studentCode: '14993',
      workTitle: 'งานที่ 3 แบบฝึกหัดบทที่ 7 ข้อที่ 4-7',
      status: 'SUBMITTED_PENDING',
      submittedAt: new Date().toISOString(),
      fileDataUrl: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4...',
      r2ObjectKey: 'kp-classroom-submissions/2-2569/m.5-4/asg-1/14993_submission.webp',
    };

    localStorage.setItem('kp_work_submissions_v2', JSON.stringify([mockSubmission]));

    const loaded = sgsRosterAndSubmissionService.getSubmissions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].fileDataUrl).toContain('https://kps-r2-storage.kps-school.workers.dev');
    expect(loaded[0].fileDataUrl).not.toContain('data:image/webp');
  });

  it('getSubmissionFileUrl() returns R2 URL when submission has r2ObjectKey, avoiding stale Base64 in localStorage', () => {
    const asgId = 'asg-test-2';
    const stuCode = '14993';
    const mockR2Key = 'kp-classroom-submissions/2-2569/m.5-4/asg-test-2/14993_work.webp';

    const mockSubmission: StudentWorkSubmission = {
      id: `sub_${asgId}_${stuCode}`,
      assignmentId: asgId,
      studentCode: stuCode,
      workTitle: 'งานแบบฝึกหัด',
      status: 'SUBMITTED_PENDING',
      submittedAt: new Date().toISOString(),
      r2ObjectKey: mockR2Key,
      fileDataUrl: `https://kps-r2-storage.kps-school.workers.dev/${encodeURI(mockR2Key)}`,
    };

    localStorage.setItem('kp_work_submissions_v2', JSON.stringify([mockSubmission]));
    // Stale Base64 stored in individual key from past offline test
    localStorage.setItem(`kp_sub_file_${asgId}_${stuCode}`, 'data:image/webp;base64,STALE_BASE64');

    const fileUrl = sgsRosterAndSubmissionService.getSubmissionFileUrl(asgId, stuCode);
    expect(fileUrl).toContain('https://kps-r2-storage.kps-school.workers.dev');
    expect(fileUrl).not.toContain('STALE_BASE64');
  });

  it('teacherCourseAssignmentService.getGradingQueue() uses the Cloudflare R2 URL for submissions', () => {
    const asgId = 'asg-test-3';
    const stuCode = '14993';
    const mockR2Key = 'kp-classroom-submissions/2-2569/m.5-4/asg-test-3/14993_work.webp';

    const mockSubmission: StudentWorkSubmission = {
      id: `sub_${asgId}_${stuCode}`,
      assignmentId: asgId,
      studentCode: stuCode,
      workTitle: 'งานที่ 3 แบบฝึกหัดบทที่ 7',
      status: 'SUBMITTED_PENDING',
      submittedAt: new Date().toISOString(),
      r2ObjectKey: mockR2Key,
      fileDataUrl: 'data:image/webp;base64,RAW_BASE64',
    };

    localStorage.setItem('kp_work_submissions_v2', JSON.stringify([mockSubmission]));

    const queue = teacherCourseAssignmentService.getGradingQueue();
    const item = queue.find((q) => q.assignmentId === asgId && q.studentCode === stuCode);

    expect(item).toBeDefined();
    expect(item?.filePreviewUrl).toContain('https://kps-r2-storage.kps-school.workers.dev');
    expect(item?.filePreviewUrl).not.toContain('RAW_BASE64');
  });

  it('matches assignment by exact ID and uses real courseCode/courseName instead of hardcoded fallback ท23102', () => {
    const asgId = 'asg-1792562483777-gg22m';
    const stuCode = '14993';

    // Term assignment with courseCode ญ32202 and targeted to ม.5/4
    const mockAssignment = {
      id: asgId,
      title: 'งานที่ 3 แบบฝึกหัดบทที่ 7 ข้อที่ 4-7',
      courseCode: 'ญ32202',
      courseName: 'ภาษาญี่ปุ่น 4',
      targetClassrooms: ['ม.5/4'],
      maxScore: 10,
    };
    localStorage.setItem('kp_term_assignments_v2', JSON.stringify([mockAssignment]));

    // Student submission without classroom or with different room context
    const mockSubmission: StudentWorkSubmission = {
      id: `sub_${asgId}_${stuCode}`,
      assignmentId: asgId,
      studentCode: stuCode,
      workTitle: 'งานที่ 3 แบบฝึกหัดบทที่ 7 ข้อที่ 4-7',
      status: 'SUBMITTED_PENDING',
      submittedAt: new Date().toISOString(),
      r2ObjectKey: 'kp-classroom-submissions/ภาคเรียนที่ 2-2569/ม.5-4/asg-1792562483777-gg22m/14993_Screenshot_20261022_200331_Samsung_Notes.webp',
      fileDataUrl: 'https://kps-r2-storage.kps-school.workers.dev/mock.webp',
    };
    localStorage.setItem('kp_work_submissions_v2', JSON.stringify([mockSubmission]));

    const queue = teacherCourseAssignmentService.getGradingQueue();
    const item = queue.find((q) => q.assignmentId === asgId && q.studentCode === stuCode);

    expect(item).toBeDefined();
    expect(item?.subjectCode).toBe('ญ32202');
    expect(item?.subjectCode).not.toBe('ท23102');
    expect(item?.classroom).toBe('ม.5/4');
  });

  it('prevents getSubmissionFileUrl from leaking another student base64 cache when studentCode differs', () => {
    // Only student 14983 has cached data in localStorage
    localStorage.setItem('kp_sub_file_asg-1_14983', 'data:image/webp;base64,ANUWAT_DATA');

    // Student 14993 requests file for the same assignment
    const resultFor14993 = sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-1', '14993');
    expect(resultFor14993).toBeUndefined();

    // Student 14983 gets their own data
    const resultFor14983 = sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-1', '14983');
    expect(resultFor14983).toBe('data:image/webp;base64,ANUWAT_DATA');
  });
});
