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

import { sgsRosterAndSubmissionService } from '../src/services/sgsRosterAndSubmissionService';
import { teacherCourseAssignmentService } from '../src/services/teacherCourseAssignmentService';

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

    // Verify getSubmissions automatically re-hydrates fileDataUrl
    const allSubs = sgsRosterAndSubmissionService.getSubmissions();
    const hydrated = allSubs.find(
      (s) => s.assignmentId === 'asg-test-1' && s.studentCode === '45101'
    );
    expect(hydrated?.fileDataUrl).toBe(sampleDataUrl);
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
    expect(item?.filePreviewUrl).toBe(sampleDataUrl);
    // Must NOT contain fake unreachable domain
    expect(item?.filePreviewUrl).not.toContain('storage.kps.ac.th');
  });
});
