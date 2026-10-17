import { describe, it, expect, beforeEach } from 'vitest';
import { studentPromotionService } from '../src/services/studentPromotionService';
import { studentEnrollmentService } from '../src/services/studentEnrollmentService';

describe('studentPromotionService - Promotion Orchestrator & Batch Tracker', () => {
  beforeEach(() => {
    studentPromotionService._resetForTesting();
    studentEnrollmentService._resetForTesting();
  });

  it('generates dry-run decision report for a cohort', () => {
    const students = [
      { studentCode: '47001', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
      { studentCode: '45001', studentName: 'ม.3 จบแล้ว', currentClassroom: 'ม.3/1', graduationApproved: true },
      { studentCode: '45002', studentName: 'ม.3 ไม่ผ่าน', currentClassroom: 'ม.3/1', graduationApproved: false },
    ];

    const report = studentPromotionService.runDryRun({
      fromAcademicYear: 2568,
      toAcademicYear: 2569,
      students,
    });

    expect(report.isValid).toBe(true);
    expect(report.summary.totalStudentsEvaluated).toBe(3);
    expect(report.summary.promotedCount).toBe(1);
    expect(report.summary.graduatedCount).toBe(1);
    expect(report.summary.pendingGraduationCount).toBe(1);
  });

  it('executes promotion batch and creates new active enrollments', async () => {
    const students = [
      { studentCode: '47001', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
    ];

    // Seed initial enrollment
    studentEnrollmentService.createEnrollment({
      studentId: 'stu-47001',
      studentCode: '47001',
      studentName: 'เด็ก 1',
      classroomId: 'room-1-1',
      classroomName: 'ม.1/1',
      academicYear: 2568,
      semesterNo: 2,
      seatNo: 1,
      status: 'ACTIVE',
      startDate: '2025-11-01',
    });

    const report = studentPromotionService.runDryRun({
      fromAcademicYear: 2568,
      toAcademicYear: 2569,
      students,
    });

    const result = await studentPromotionService.executePromotion({
      fromYear: 2568,
      fromTerm: 2,
      toYear: 2569,
      toTerm: 1,
      decisions: report.decisions,
      executedBy: 'ครูปัญจพล',
    });

    expect(result.success).toBe(true);
    expect(result.batchId).toBeDefined();

    // Verify batch history
    const batches = studentPromotionService.getPromotionBatches();
    expect(batches).toHaveLength(1);
    expect(batches[0].status).toBe('COMMITTED');

    // Verify enrollment transitioned to target room
    const oldRoomActive = studentEnrollmentService.getActiveEnrollments('room-1-1');
    expect(oldRoomActive).toHaveLength(0); // old closed

    const newRoomActive = studentEnrollmentService.getActiveEnrollments('room-2-1');
    expect(newRoomActive).toHaveLength(1); // promoted to ม.2/1
    expect(newRoomActive[0].studentCode).toBe('47001');
  });

  it('safely rolls back a committed batch when no conflicts exist', async () => {
    const students = [
      { studentCode: '47001', studentName: 'เด็ก 1', currentClassroom: 'ม.1/1' },
    ];

    studentEnrollmentService.createEnrollment({
      studentId: 'stu-47001',
      studentCode: '47001',
      studentName: 'เด็ก 1',
      classroomId: 'room-1-1',
      classroomName: 'ม.1/1',
      academicYear: 2568,
      semesterNo: 2,
      seatNo: 1,
      status: 'ACTIVE',
      startDate: '2025-11-01',
    });

    const report = studentPromotionService.runDryRun({
      fromAcademicYear: 2568,
      toAcademicYear: 2569,
      students,
    });

    const result = await studentPromotionService.executePromotion({
      fromYear: 2568,
      fromTerm: 2,
      toYear: 2569,
      toTerm: 1,
      decisions: report.decisions,
      executedBy: 'ครูปัญจพล',
    });

    const rollbackResult = await studentPromotionService.rollbackPromotion(
      result.batchId,
      'admin',
      'ยกเลิกเพื่อทดสอบการคืนค่าเดิม'
    );

    expect(rollbackResult.success).toBe(true);

    // Verify restored back to room-1-1
    const restoredActive = studentEnrollmentService.getActiveEnrollments('room-1-1');
    expect(restoredActive).toHaveLength(1);
    expect(restoredActive[0].studentCode).toBe('47001');

    const batches = studentPromotionService.getPromotionBatches();
    expect(batches[0].status).toBe('ROLLED_BACK');
  });
});
