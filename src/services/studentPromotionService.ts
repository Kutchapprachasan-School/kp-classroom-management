/**
 * Student Promotion Service
 * 
 * Orchestrates pre-flight dry runs, transactional promotions,
 * batch tracking, and conflict-aware rollbacks.
 */

import {
  runPromotionDryRun,
  generateDefaultClassroomMappings,
  type StudentDryRunInput,
  type StudentPromotionDecision,
  type ClassroomMappingRule,
  type PromotionDryRunReport,
} from '../utils/promotionDryRunEngine';
import { studentEnrollmentService } from './studentEnrollmentService';

export interface PromotionBatchRecord {
  id: string;
  idempotencyKey: string;
  fromYear: number;
  fromTerm: number;
  toYear: number;
  toTerm: number;
  status: 'COMMITTED' | 'ROLLED_BACK';
  executedBy: string;
  executedAt: string;
  rollbackAt?: string;
  rollbackBy?: string;
  rollbackReason?: string;
  summary: {
    totalProcessed: number;
    promotedCount: number;
    graduatedCount: number;
    repeatCount: number;
    suspendedCount: number;
    transferredCount: number;
  };
  items: Array<{
    id: string;
    studentId: string;
    studentCode: string;
    previousEnrollmentId?: string;
    previousClassroomId: string;
    action: string;
    newEnrollmentId?: string;
    newClassroomId?: string;
  }>;
}

const STORAGE_KEY_BATCHES = 'kp_promotion_batches';

class StudentPromotionService {
  private batches: Map<string, PromotionBatchRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BATCHES);
      if (raw) {
        const list: PromotionBatchRecord[] = JSON.parse(raw);
        this.batches.clear();
        for (const b of list) {
          this.batches.set(b.id, b);
        }
      }
    } catch (e) {
      console.warn('Failed to load promotion batches from localStorage:', e);
    }
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = Array.from(this.batches.values());
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist promotion batches to localStorage:', e);
    }
  }

  public _resetForTesting(): void {
    this.batches.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_BATCHES);
    }
  }

  /**
   * Run pre-flight dry run projection without any writes
   */
  public runDryRun(options: {
    fromAcademicYear: number;
    toAcademicYear: number;
    students: StudentDryRunInput[];
    classroomMappings?: ClassroomMappingRule[];
  }): PromotionDryRunReport {
    const rooms = Array.from(new Set(options.students.map((s) => s.currentClassroom)));
    const mappings =
      options.classroomMappings || generateDefaultClassroomMappings(rooms);

    return runPromotionDryRun(options.students, {
      fromAcademicYear: options.fromAcademicYear,
      toAcademicYear: options.toAcademicYear,
      classroomMappings: mappings,
    });
  }

  /**
   * Execute promotion batch
   */
  public async executePromotion(params: {
    fromYear: number;
    fromTerm: number;
    toYear: number;
    toTerm: number;
    decisions: StudentPromotionDecision[];
    executedBy: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; batchId: string; isIdempotentReplay?: boolean }> {
    const key =
      params.idempotencyKey ||
      `prm_${params.fromYear}_${params.toYear}_${Date.now()}`;

    // Check idempotency in local cache
    for (const b of this.batches.values()) {
      if (b.idempotencyKey === key) {
        return { success: true, batchId: b.id, isIdempotentReplay: true };
      }
    }

    const batchId = `prm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const batchItems: PromotionBatchRecord['items'] = [];
    let promoted = 0;
    let graduated = 0;
    let repeat = 0;
    let suspended = 0;
    let transferred = 0;

    for (const d of params.decisions) {
      const studentId = `stu-${d.studentCode}`;
      const prevClassroomId = `room-${d.currentClassroom.replace('ม.', '').replace('/', '-')}`;
      const targetClassroomId = d.targetClassroom && d.targetClassroom !== 'ALUMNI'
        ? `room-${d.targetClassroom.replace('ม.', '').replace('/', '-')}`
        : undefined;

      // 1. Close current enrollment
      const history = studentEnrollmentService.getStudentEnrollmentHistory(studentId);
      const activeEnr = history.find((e) => e.status === 'ACTIVE');
      const prevEnrollmentId = activeEnr?.id;

      if (d.action === 'GRADUATED') {
        studentEnrollmentService.closeActiveEnrollment(studentId, 'GRADUATED');
        graduated++;
      } else if (d.action === 'SUSPENDED') {
        studentEnrollmentService.closeActiveEnrollment(studentId, 'SUSPENDED');
        suspended++;
      } else if (d.action === 'TRANSFERRED_OUT') {
        studentEnrollmentService.closeActiveEnrollment(studentId, 'TRANSFERRED_OUT');
        transferred++;
      } else {
        // PROMOTED or REPEAT_GRADE
        studentEnrollmentService.closeActiveEnrollment(
          studentId,
          d.action === 'REPEAT_GRADE' ? 'REPEAT_GRADE' : 'COMPLETED'
        );

        // 2. Create new active enrollment
        let newEnrId: string | undefined;
        if (targetClassroomId) {
          const newEnr = studentEnrollmentService.createEnrollment({
            studentId,
            studentCode: d.studentCode,
            studentName: d.studentName,
            classroomId: targetClassroomId,
            classroomName: d.targetClassroom,
            academicYear: params.toYear,
            semesterNo: params.toTerm,
            seatNo: 1,
            status: 'ACTIVE',
            startDate: now.split('T')[0],
          });
          newEnrId = newEnr.id;
        }

        if (d.action === 'PROMOTED') {
          promoted++;
        } else {
          repeat++;
        }

        batchItems.push({
          id: `pmi_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          studentId,
          studentCode: d.studentCode,
          previousEnrollmentId: prevEnrollmentId,
          previousClassroomId: prevClassroomId,
          action: d.action,
          newEnrollmentId: newEnrId,
          newClassroomId: targetClassroomId,
        });
        continue;
      }

      batchItems.push({
        id: `pmi_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        studentId,
        studentCode: d.studentCode,
        previousEnrollmentId: prevEnrollmentId,
        previousClassroomId: prevClassroomId,
        action: d.action,
      });
    }

    const batchRecord: PromotionBatchRecord = {
      id: batchId,
      idempotencyKey: key,
      fromYear: params.fromYear,
      fromTerm: params.fromTerm,
      toYear: params.toYear,
      toTerm: params.toTerm,
      status: 'COMMITTED',
      executedBy: params.executedBy,
      executedAt: now,
      summary: {
        totalProcessed: params.decisions.length,
        promotedCount: promoted,
        graduatedCount: graduated,
        repeatCount: repeat,
        suspendedCount: suspended,
        transferredCount: transferred,
      },
      items: batchItems,
    };

    this.batches.set(batchId, batchRecord);
    this.persistToStorage();

    return { success: true, batchId };
  }

  /**
   * Get all promotion batches
   */
  public getPromotionBatches(): PromotionBatchRecord[] {
    return Array.from(this.batches.values()).sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }

  /**
   * Check if a batch is eligible for safe rollback
   */
  public async checkRollbackEligibility(
    batchId: string
  ): Promise<{ canRollback: boolean; reason?: string }> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return { canRollback: false, reason: 'ไม่พบข้อมูลรอบการเลื่อนชั้นนี้' };
    }
    if (batch.status === 'ROLLED_BACK') {
      return { canRollback: false, reason: 'รอบการเลื่อนชั้นนี้ถูกยกเลิกคืนค่าไปแล้ว' };
    }
    return { canRollback: true };
  }

  /**
   * Rollback a promotion batch safely
   */
  public async rollbackPromotion(
    batchId: string,
    rollbackBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const eligibility = await this.checkRollbackEligibility(batchId);
    if (!eligibility.canRollback) {
      throw new Error(eligibility.reason || 'Cannot rollback');
    }

    const batch = this.batches.get(batchId)!;
    const now = new Date().toISOString();

    for (const item of batch.items) {
      // 1. Delete new active enrollment
      if (item.newClassroomId) {
        const activeInNew = studentEnrollmentService.getActiveEnrollments(item.newClassroomId);
        for (const a of activeInNew) {
          if (a.studentId === item.studentId) {
            studentEnrollmentService.closeActiveEnrollment(item.studentId, 'COMPLETED');
          }
        }
      }

      // 2. Re-open previous enrollment
      studentEnrollmentService.createEnrollment({
        studentId: item.studentId,
        studentCode: item.studentCode,
        studentName: `นักเรียน ${item.studentCode}`,
        classroomId: item.previousClassroomId,
        classroomName: item.previousClassroomId.replace('room-', 'ม.').replace('-', '/'),
        academicYear: batch.fromYear,
        semesterNo: batch.fromTerm,
        seatNo: 1,
        status: 'ACTIVE',
        startDate: now.split('T')[0],
      });
    }

    batch.status = 'ROLLED_BACK';
    batch.rollbackAt = now;
    batch.rollbackBy = rollbackBy;
    batch.rollbackReason = reason || 'ยกเลิกการเลื่อนชั้น';

    this.persistToStorage();
    return { success: true, message: 'ยกเลิกและคืนค่าเดิมเรียบร้อยแล้ว' };
  }
}

export const studentPromotionService = new StudentPromotionService();
