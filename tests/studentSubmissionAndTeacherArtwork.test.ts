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
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
}

import { sgsRosterAndSubmissionService } from '../src/services/sgsRosterAndSubmissionService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';
import { r2StorageService } from '../src/services/r2StorageService';

describe('Student Submission & Teacher Artwork Display Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows students to submit both an image file and an external link together', () => {
    const sampleDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA';
    const sampleLink = 'https://www.canva.com/design/DAFtest123/view';

    const result = sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-test-1',
      studentCode: '45101',
      workTitle: 'ภาพวาดทัศนียภาพ 2 จุด',
      fileName: 'perspective_drawing.jpg',
      fileDataUrl: sampleDataUrl,
      externalLinkUrl: sampleLink,
      originalSizeKb: 2500,
      compressedSizeKb: 120,
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const saved = result.find(
      (s) => s.assignmentId === 'asg-test-1' && s.studentCode === '45101'
    );
    expect(saved).toBeDefined();
    expect(saved?.externalLinkUrl).toBe(sampleLink);
    expect(saved?.workAttachmentLabel).toContain('☁️ R2: perspective_drawing.webp');
    expect(saved?.workAttachmentLabel).toContain('🔗 ลิงก์แนบ');

    // Verify file Data URL is safely cached in separate scoped key to avoid quota overflow
    const cachedFile = sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-test-1', '45101');
    expect(cachedFile).toBe(sampleDataUrl);

    // Verify getSubmissions automatically re-hydrates fileDataUrl (either from local cache or upgraded to R2 URL)
    const allSubs = sgsRosterAndSubmissionService.getSubmissions();
    const hydrated = allSubs.find(
      (s) => s.assignmentId === 'asg-test-1' && s.studentCode === '45101'
    );
    expect(
      hydrated?.fileDataUrl === sampleDataUrl ||
      hydrated?.fileDataUrl?.startsWith('https://kps-r2-storage.kps-school.workers.dev')
    ).toBe(true);
  });

  it('allows students to submit only an external link (Canva / Google Drive) without a file', () => {
    const sampleLink = 'https://drive.google.com/drive/folders/1abcXYZ_drive_folder';

    const result = sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-test-2',
      studentCode: '45102',
      workTitle: 'แฟ้มสะสมงาน Google Drive',
      externalLinkUrl: sampleLink,
      originalSizeKb: 0,
      compressedSizeKb: 0,
    });

    const saved = result.find(
      (s) => s.assignmentId === 'asg-test-2' && s.studentCode === '45102'
    );
    expect(saved).toBeDefined();
    expect(saved?.externalLinkUrl).toBe(sampleLink);
    expect(saved?.workAttachmentLabel).toContain('🔗 ลิงก์แนบ');
  });

  it('allows students to submit only an image file without a link', () => {
    const sampleDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-test-3',
      studentCode: '45103',
      workTitle: 'งานระบายสีน้ำ',
      fileName: 'watercolor_art.png',
      fileDataUrl: sampleDataUrl,
      originalSizeKb: 1800,
      compressedSizeKb: 95,
    });

    const saved = result.find(
      (s) => s.assignmentId === 'asg-test-3' && s.studentCode === '45103'
    );
    expect(saved).toBeDefined();
    expect(saved?.externalLinkUrl).toBeUndefined();
    expect(saved?.workAttachmentLabel).toContain('☁️ R2: watercolor_art.webp');

    const cachedFile = sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-test-3', '45103');
    expect(cachedFile).toBe(sampleDataUrl);
  });

  it('ensures teacherCourseAssignmentService resolves real student file data URL without broken fallback URL', () => {
    const sampleDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQ';
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-art-01',
      studentCode: '45101',
      workTitle: 'จิตรกรรมไทย',
      fileName: 'thai_art.webp',
      fileDataUrl: sampleDataUrl,
    });

    const queue = teacherCourseAssignmentService.getGradingQueue();
    const item = queue.find(
      (q) => q.assignmentId === 'asg-art-01' && q.studentCode === '45101'
    );

    expect(item).toBeDefined();
    expect(
      item?.filePreviewUrl === sampleDataUrl ||
      item?.filePreviewUrl?.startsWith('https://kps-r2-storage.kps-school.workers.dev')
    ).toBe(true);
    // Must NOT contain fake unreachable domain
    expect(item?.filePreviewUrl).not.toContain('storage.kps.ac.th');
  });

  it('sanitizes legacy storage.kps.ac.th or r2:// URLs and recovers real cached WebP base64', () => {
    r2StorageService.configure({ workerUrl: '', uploadSecret: '', publicUrl: '' });
    try {
      const fakeDomainUrl = 'https://storage.kps.ac.th/kp-classroom-submissions/term2/m3-1/asg-legacy-99/45105_art.webp';
      const realBase64 = 'data:image/webp;base64,UklGRtppAABXRUJQVlA4WAoAAAAgAAAAugMAxwMASUNDUMgBAAAAAAHI';

      // Store fake URL in submission list
      localStorage.setItem(
        'kp_work_submissions_v1',
        JSON.stringify([
          {
            assignmentId: 'asg-legacy-99',
            studentCode: '45105',
            status: 'SUBMITTED_PENDING',
            workTitle: 'งานศิลปะ',
            fileDataUrl: fakeDomainUrl,
            r2ObjectKey: 'r2://kp-classroom-submissions/term2/m3-1/asg-legacy-99/45105_art.webp',
          },
        ])
      );

      // Store real base64 in separate scoped key
      localStorage.setItem('kp_sub_file_asg-legacy-99_45105', realBase64);

      // Also simulate legacy item in grading queue
      localStorage.setItem(
        'kp_grading_queue_items',
        JSON.stringify([
          {
            id: 'q_asg-legacy-99_45105',
            assignmentId: 'asg-legacy-99',
            studentCode: '45105',
            status: 'PENDING_REVIEW',
            filePreviewUrl: fakeDomainUrl,
          },
        ])
      );

      // 1. getSubmissions() must filter out fake URL and hydrate with real base64
      const subs = sgsRosterAndSubmissionService.getSubmissions();
      const sub = subs.find((s) => s.assignmentId === 'asg-legacy-99' && s.studentCode === '45105');
      expect(sub?.fileDataUrl).toBe(realBase64);
      expect(sub?.fileDataUrl).not.toContain('storage.kps.ac.th');

      // 2. getSubmissionFileUrl() must return realBase64
      const fetchedFile = sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-legacy-99', '45105');
      expect(fetchedFile).toBe(realBase64);

      // 3. teacherCourseAssignmentService.getGradingQueue() must sanitize filePreviewUrl
      const queue = teacherCourseAssignmentService.getGradingQueue();
      const queueItem = queue.find((q) => q.assignmentId === 'asg-legacy-99' && q.studentCode === '45105');
      expect(queueItem?.filePreviewUrl).toBe(realBase64);
      expect(queueItem?.filePreviewUrl).not.toContain('storage.kps.ac.th');
    } finally {
      r2StorageService.resetConfig();
    }
  });

  it('correctly maps pending assignments for student dashboard according to submission status', () => {
    // Create assignments targeted to ม.3/1
    localStorage.setItem(
      'kp_term_assignments_v2',
      JSON.stringify([
        {
          id: 'asg-dash-1',
          title: 'วาดภาพสีน้ำระบายบรรยากาศ',
          targetClassrooms: ['ม.3/1'],
          maxScore: 10,
          courseCode: 'ศ23101',
          dueDate: '25 ต.ค. 2569',
        },
        {
          id: 'asg-dash-2',
          title: 'การออกแบบตราสัญลักษณ์',
          targetClassrooms: ['ALL'],
          maxScore: 15,
          courseCode: 'ศ23101',
          dueDate: '30 ต.ค. 2569',
        },
      ])
    );

    // Student 45101 submitted asg-dash-2, but asg-dash-1 is still pending
    localStorage.setItem(
      'kp_work_submissions_v2',
      JSON.stringify([
        {
          assignmentId: 'asg-dash-2',
          studentCode: '45101',
          status: 'SUBMITTED_PENDING',
          workTitle: 'การออกแบบตราสัญลักษณ์',
        },
      ])
    );

    const termAsgs = sgsRosterAndSubmissionService.getTermAssignments(undefined, 'ม.3/1');
    expect(termAsgs.length).toBe(2);

    const subs = sgsRosterAndSubmissionService.getSubmissions();
    const mapped = termAsgs.map((asg) => {
      const sub = subs.find((s) => s.assignmentId === asg.id && s.studentCode === '45101');
      const isSubmitted =
        !!sub &&
        sub.status !== 'RETURNED_REVISION' &&
        (sub.status === 'SUBMITTED_PENDING' || sub.status === 'GRADED' || sub.status === 'EXEMPT_TRANSFERRED');
      return {
        id: asg.id,
        title: asg.title,
        status: isSubmitted ? 'SUBMITTED' : 'PENDING',
      };
    });

    const pending = mapped.filter((m) => m.status === 'PENDING');
    const submitted = mapped.filter((m) => m.status === 'SUBMITTED');

    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe('asg-dash-1');
    expect(submitted.length).toBe(1);
    expect(submitted[0].id).toBe('asg-dash-2');
  });

  it('resolves submission file by student code and filename even if assignmentId differs or is missing', () => {
    const sampleWebP = 'data:image/webp;base64,UklGRtppAABXRUJQSample15984';
    // Student submitted under asg-original-101
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-original-101',
      studentCode: '15984',
      workTitle: 'แบบฝึกหัดบทที่ 7',
      fileName: 'Screenshot_20261021_133246_SamsungNotes.png',
      fileDataUrl: sampleWebP,
    });

    // 1. Direct match with original assignment id
    expect(sgsRosterAndSubmissionService.getSubmissionFileUrl('asg-original-101', '15984')).toBe(sampleWebP);

    // 2. Lookup with DIFFERENT assignment id but matching studentCode and fileName
    const resolvedByFile = sgsRosterAndSubmissionService.getSubmissionFileUrl(
      'asg-different-999',
      '15984',
      '15984_Screenshot_20261021_133246_SamsungNotes.webp'
    );
    expect(resolvedByFile).toBe(sampleWebP);

    // 3. Lookup with NO assignment id (undefined) and only studentCode and fileName
    const resolvedNoAsg = sgsRosterAndSubmissionService.getSubmissionFileUrl(
      undefined,
      '15984',
      'Screenshot_20261021_133246_SamsungNotes.webp'
    );
    expect(resolvedNoAsg).toBe(sampleWebP);

    // 4. Lookup by studentCode scan alone when only studentCode is known
    const resolvedByStudent = sgsRosterAndSubmissionService.getSubmissionFileUrl(undefined, '15984');
    expect(resolvedByStudent).toBe(sampleWebP);
  });

  it('verifies r2StorageService key building and public URL resolution', () => {
    const key = r2StorageService.buildSubmissionKey({
      term: '2/2569',
      classroom: 'ม.5/4',
      assignmentId: 'asg-unit-7',
      studentCode: '15984',
      fileName: 'homework.png',
    });

    expect(key).toBe('kp-classroom-submissions/2-2569/ม.5-4/asg-unit-7/15984_homework.webp');

    // Test resolving r2:// scheme
    const resolved = r2StorageService.resolvePublicViewUrl(`r2://${key}`);
    expect(resolved).toBeDefined();
  });

  it('detects local unsynced submissions and syncs them to R2', async () => {
    // Seed a local submission with Base64
    const sampleDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA';
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: 'asg-sync-test',
      studentCode: '99001',
      workTitle: 'งานศิลปะที่ยังไม่ได้ซิงก์',
      fileName: 'drawing.png',
      fileDataUrl: sampleDataUrl,
    });

    const unsyncedCount = sgsRosterAndSubmissionService.getLocalUnsyncedSubmissionsCount();
    expect(unsyncedCount).toBeGreaterThanOrEqual(1);

    // Configure R2 for testing
    const originalFetch = globalThis.fetch;
    r2StorageService.configure({
      workerUrl: 'https://kps-r2-worker.surasit-classroom.workers.dev',
      uploadSecret: 'test-secret',
      publicUrl: 'https://storage.kps.ac.th',
    });

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      return {
        ok: true,
        status: 200,
        text: async () => 'OK',
        json: async () => ({ success: true }),
      } as any;
    }) as any;

    try {
      const syncResult = await sgsRosterAndSubmissionService.syncLocalSubmissionsToR2();
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBeGreaterThanOrEqual(1);

      // Verify the submission now has an HTTP(S) URL
      const subs = sgsRosterAndSubmissionService.getSubmissions();
      const updatedSub = subs.find((s) => s.studentCode === '99001' && s.assignmentId === 'asg-sync-test');
      expect(updatedSub?.fileDataUrl).toContain('https://');
    } finally {
      globalThis.fetch = originalFetch;
      r2StorageService.resetConfig();
    }
  });

  it('cascade deletes related submissions and clears file caches when deleting an assignment', () => {
    // 1. Add an assignment
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานที่ต้องลบ',
      maxScore: 10,
      dueDate: '2026-10-31',
    });
    const assignments = sgsRosterAndSubmissionService.getTermAssignments();
    const asg = assignments[assignments.length - 1];

    // 2. Submit student work
    const sampleDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA';
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: asg.id,
      studentCode: '55001',
      workTitle: 'งานที่ต้องลบ',
      fileDataUrl: sampleDataUrl,
    });

    expect(sgsRosterAndSubmissionService.getSubmissions().some((s) => s.assignmentId === asg.id)).toBe(true);

    // 3. Delete the assignment
    sgsRosterAndSubmissionService.deleteTermAssignment(asg.id);

    // 4. Verify assignment is deleted
    expect(sgsRosterAndSubmissionService.getTermAssignments().some((a) => a.id === asg.id)).toBe(false);

    // 5. Verify submissions are cascade deleted
    expect(sgsRosterAndSubmissionService.getSubmissions().some((s) => s.assignmentId === asg.id)).toBe(false);

    // 6. Verify grading queue has no orphan items for this assignment
    const queue = teacherCourseAssignmentService.getGradingQueue();
    expect(queue.some((q) => q.assignmentId === asg.id)).toBe(false);
  });

  it('normalizes "งานที่ 0" and enriches unit max score in grading queue', () => {
    // 1. Add a unit bundle assignment with maxScore 1 (count ratio) but unitMaxScore 25
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'งานที่ 0',
      unitTitle: 'บทที่ 7 เรื่อง การแนะนำครอบครัว',
      unitMaxScore: 25,
      maxScore: 1,
      scoringMethod: 'SUBMISSION_COUNT_RATIO',
      dueDate: '2026-10-31',
    });
    const assignments = sgsRosterAndSubmissionService.getTermAssignments();
    const asg = assignments[assignments.length - 1];

    // 2. Submit student work
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: asg.id,
      studentCode: '66001',
      workTitle: 'งานที่ 0',
      externalLinkUrl: 'https://canva.com/design/test',
    });

    // 3. Check grading queue item
    const queue = teacherCourseAssignmentService.getGradingQueue();
    const item = queue.find((q) => q.assignmentId === asg.id && q.studentCode === '66001');
    expect(item).toBeDefined();

    // Verify title is not left as 'งานที่ 0'
    expect(item?.assignmentTitle).not.toBe('งานที่ 0');
    expect(item?.assignmentTitle).toContain('บทที่ 7');

    // Verify maxScore uses unitMaxScore (25) rather than 1
    expect(item?.maxScore).toBe(25);
  });

  it('retains student submissions and grading queue items when assignment title or course code is changed', () => {
    // 1. Create an assignment
    sgsRosterAndSubmissionService.addTermAssignment({
      title: 'ใบงานวาดภาพ',
      courseCode: 'ศ21101',
      courseName: 'ทัศนศิลป์ 1',
      targetClassrooms: ['ม.1/1'],
      maxScore: 10,
      dueDate: '2026-11-15',
    });
    const assignments = sgsRosterAndSubmissionService.getTermAssignments('ศ21101', 'ม.1/1');
    const asg = assignments.find((a) => a.title === 'ใบงานวาดภาพ')!;
    expect(asg).toBeDefined();

    // 2. Student submits work
    sgsRosterAndSubmissionService.submitStudentWorkToR2({
      assignmentId: asg.id,
      studentCode: '55001',
      workTitle: 'ใบงานวาดภาพ',
      fileDataUrl: 'data:image/webp;base64,UklGRvAAAABXRUJQVlA4',
      fileName: 'drawing.png',
    });

    // Verify submission exists
    const beforeSubs = sgsRosterAndSubmissionService.getSubmissions();
    expect(beforeSubs.some((s) => s.assignmentId === asg.id && s.studentCode === '55001')).toBe(true);

    // 3. Teacher renames the assignment title
    sgsRosterAndSubmissionService.updateTermAssignment(asg.id, {
      title: 'ใบงานที่ 1: การวาดภาพระบายสีสร้างสรรค์',
      maxScore: 15,
    });

    // 4. Verify assignment has new title
    const updatedAsgs = sgsRosterAndSubmissionService.getTermAssignments('ศ21101', 'ม.1/1');
    const updatedAsg = updatedAsgs.find((a) => a.id === asg.id);
    expect(updatedAsg?.title).toBe('ใบงานที่ 1: การวาดภาพระบายสีสร้างสรรค์');
    expect(updatedAsg?.maxScore).toBe(15);

    // 5. Verify submission STILL exists and workTitle was cascade updated
    const afterSubs = sgsRosterAndSubmissionService.getSubmissions();
    const matchedSub = afterSubs.find((s) => s.assignmentId === asg.id && s.studentCode === '55001');
    expect(matchedSub).toBeDefined();
    expect(matchedSub?.workTitle).toBe('ใบงานที่ 1: การวาดภาพระบายสีสร้างสรรค์');

    // 6. Verify grading queue retains item with new title and new max score
    const queue = teacherCourseAssignmentService.getGradingQueue();
    const queueItem = queue.find((q) => q.assignmentId === asg.id && q.studentCode === '55001');
    expect(queueItem).toBeDefined();
    expect(queueItem?.assignmentTitle).toBe('ใบงานที่ 1: การวาดภาพระบายสีสร้างสรรค์');
    expect(queueItem?.maxScore).toBe(15);

    // 7. Teacher changes course code from ศ21101 to ศ21102
    sgsRosterAndSubmissionService.cascadeCourseUpdate('ศ21101', 'ศ21102', 'ทัศนศิลป์ 2');

    // 8. Verify getTermAssignments with new course code finds the assignment
    const newCourseAsgs = sgsRosterAndSubmissionService.getTermAssignments('ศ21102', 'ม.1/1');
    expect(newCourseAsgs.some((a) => a.id === asg.id)).toBe(true);

    // 9. Verify grading queue reflects the new course code
    const queueAfterCourseChange = teacherCourseAssignmentService.getGradingQueue();
    const updatedQueueItem = queueAfterCourseChange.find((q) => q.assignmentId === asg.id && q.studentCode === '55001');
    expect(updatedQueueItem).toBeDefined();
    expect(updatedQueueItem?.subjectCode).toBe('ศ21102');
  });
});
