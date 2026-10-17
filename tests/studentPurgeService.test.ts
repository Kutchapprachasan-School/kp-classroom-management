import { describe, it, expect, beforeEach } from 'vitest';
import { studentPurgeService } from '../src/services/studentPurgeService';

describe('studentPurgeService - Single Student Test Data Purge & Safety Guard', () => {
  beforeEach(() => {
    studentPurgeService._resetForTesting();
  });

  it('inspects student dependencies and identifies orphan/test attendance records', () => {
    // Mock a test student with 1 day test attendance
    const inspection = studentPurgeService.inspectStudentDependencies({
      studentCode: '99999',
      studentName: 'เด็กทดสอบ ระบบ',
      hasOfficialGrades: false,
      hasGraduationApproval: false,
      attendanceDaysCount: 1,
      historicalEnrollmentYearsCount: 0,
    });

    expect(inspection.canPurgeSafely).toBe(true);
    expect(inspection.isTestStudentCandidate).toBe(true);
    expect(inspection.warnings).toHaveLength(0);
  });

  it('blocks deletion if student has committed official grades or historical transcript', () => {
    const inspection = studentPurgeService.inspectStudentDependencies({
      studentCode: '45001',
      studentName: 'นักเรียนตัวจริง มีผลการเรียนแล้ว',
      hasOfficialGrades: true,
      hasGraduationApproval: false,
      attendanceDaysCount: 80,
      historicalEnrollmentYearsCount: 2,
    });

    expect(inspection.canPurgeSafely).toBe(false);
    expect(inspection.blockingReasons).toContain(
      'พบผลการเรียนที่บันทึกแล้วในระบบ ไม่อนุญาตให้ลบถาวร (ให้ใช้การย้ายสถานศึกษาหรือจำหน่ายออกแทน)'
    );
  });

  it('purges a verified test student and cleans up orphan attendance records completely', async () => {
    const result = await studentPurgeService.purgeSingleTestStudent({
      studentCode: '99999',
      classroomId: 'room-3-1',
      adminConfirmed: true,
      reason: 'ลบข้อมูลนักเรียนทดสอบ',
    });

    expect(result.success).toBe(true);
    expect(result.purgedStudentCode).toBe('99999');
    expect(result.orphanAttendanceCleaned).toBe(true);
  });
});
