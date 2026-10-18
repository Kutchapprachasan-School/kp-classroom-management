// src/services/studentPromotionService.ts
import { supabase } from '../lib/supabaseClient.ts';
import { gradeService } from './gradeService.ts';
import { studentEnrollmentService } from './studentEnrollmentService.ts';

export type PromotionAction = 'PROMOTE' | 'REPEAT' | 'GRADUATE';

export interface StudentPromotionTransition {
  student_id: string;
  student_name?: string;
  from_classroom_id: string;
  to_classroom_id: string | null;
  action: PromotionAction;
  roll_number?: number | null;
  grade_level?: string | null;
  remarks?: string | null;
  // ข้อมูลช่วยตัดสินใจสำหรับ UI (Graduation Board Step 3)
  has_academic_issue?: boolean;
  academic_issue_detail?: string;
}

export interface ClassroomMappingRule {
  fromClassroomId: string;
  fromGradeLevel: string; // เช่น 'ม.1', 'ม.3', 'ม.6'
  toClassroomId: string | null; // null กรณีชั้นปีสุดท้ายที่จบการศึกษา ('ม.3' หรือ 'ม.6')
  toGradeLevel: string | null;
  isGraduationLevel: boolean;
}

export interface PromotionDryRunResult {
  fromAcademicYear: number;
  fromSemester: number;
  toAcademicYear: number;
  toSemester: number;
  totalStudents: number;
  promoteCount: number;
  repeatCount: number;
  graduateCount: number;
  flaggedIssueCount: number;
  transitions: StudentPromotionTransition[];
}

export interface ExecutePromotionRpcResponse {
  success: boolean;
  batch_id: string;
  promoted_count: number;
  repeated_count: number;
  graduated_count: number;
}

export interface RollbackPromotionRpcResponse {
  success: boolean;
  conflict_detected: boolean;
  conflict_score_count?: number;
  message?: string;
  batch_id?: string;
  restored_count?: number;
}

export interface PromotionBatchHistoryItem {
  id: string;
  from_academic_year: number;
  from_semester: number;
  to_academic_year: number;
  to_semester: number;
  status: 'COMPLETED' | 'ROLLED_BACK';
  summary_json: {
    total_processed?: number;
    promoted_count?: number;
    repeated_count?: number;
    graduated_count?: number;
  };
  executed_by: string;
  created_at: string;
  rolled_back_at: string | null;
}

export const studentPromotionService = {
  /**
   * 1. คำนวณจำลองการเลื่อนชั้นล่วงหน้า (Zero-Write Dry Run)
   * พร้อมตรวจสอบว่ามีนักเรียนคนใดติด '0' หรือ 'ร' ในปีการศึกษาปัจจุบันหรือไม่
   */
  async simulatePromotionDryRun(params: {
    fromAcademicYear: number;
    fromSemester: number;
    toAcademicYear: number;
    toSemester: number;
    mappings: ClassroomMappingRule[];
    manualOverrides?: Map<string, { action: PromotionAction; toClassroomId?: string | null; remarks?: string }>;
  }): Promise<PromotionDryRunResult> {
    // บังคับส่งคะแนนที่ค้างในเครื่องครูขึ้น Server ก่อนประมวลผล
    await gradeService.flushOutbox();

    const fromClassroomIds = params.mappings.map((m) => m.fromClassroomId);
    if (fromClassroomIds.length === 0) {
      return {
        fromAcademicYear: params.fromAcademicYear,
        fromSemester: params.fromSemester,
        toAcademicYear: params.toAcademicYear,
        toSemester: params.toSemester,
        totalStudents: 0,
        promoteCount: 0,
        repeatCount: 0,
        graduateCount: 0,
        flaggedIssueCount: 0,
        transitions: [],
      };
    }

    // ดึงรายชื่อนักเรียนที่กำลังศึกษาอยู่ในห้องต้นทาง
    const { data: students, error: stdError } = await supabase
      .from('students')
      .select('id, prefix, first_name, last_name, classroom_id, academic_status')
      .in('classroom_id', fromClassroomIds)
      .eq('academic_status', 'STUDYING');

    if (stdError) throw stdError;

    const activeStudents = (students as Array<{
      id: string;
      prefix?: string;
      first_name?: string;
      last_name?: string;
      classroom_id: string;
    }>) || [];

    const mappingByRoom = new Map<string, ClassroomMappingRule>(
      params.mappings.map((m) => [m.fromClassroomId, m])
    );

    const transitions: StudentPromotionTransition[] = [];
    let promoteCount = 0;
    let repeatCount = 0;
    let graduateCount = 0;
    let flaggedIssueCount = 0;

    for (let idx = 0; idx < activeStudents.length; idx += 1) {
      const std = activeStudents[idx];
      const rule = mappingByRoom.get(std.classroom_id);
      if (!rule) continue;

      // ตรวจสอบผลการเรียนของเทอมต้นทางว่ามีติด 0 หรือ ร หรือไม่
      const transcripts = await studentEnrollmentService.getStudentFullTranscript(std.id);
      const currentTermTranscript = transcripts.find(
        (t) => t.academicYear === params.fromAcademicYear && t.semester === params.fromSemester
      );

      const hasIssue = currentTermTranscript?.hasAcademicIssue ?? false;
      const issueCourses =
        currentTermTranscript?.courses
          .filter((c) => c.grade === '0' || c.isIncomplete)
          .map((c) => `${c.courseId} (${c.grade})`)
          .join(', ') || '';

      if (hasIssue) {
        flaggedIssueCount += 1;
      }

      // ตั้งค่า Action เริ่มต้นตามระดับชั้น (ถ้าติด 0/ร ในชั้น ม.3 หรือ ม.6 จะยังไม่ให้จบอัตโนมัติ ให้เป็น REPEAT รอครูอนุมัติ)
      let defaultAction: PromotionAction = rule.isGraduationLevel ? 'GRADUATE' : 'PROMOTE';
      let defaultTargetRoom: string | null = rule.isGraduationLevel ? null : rule.toClassroomId;

      if (rule.isGraduationLevel && hasIssue) {
        defaultAction = 'REPEAT';
        defaultTargetRoom = rule.fromClassroomId;
      }

      // หากครูมีการตั้งค่าข้อยกเว้นรายบุคคล (Manual Override ใน Step 3) ให้ใช้ค่าที่ครูเลือก
      const override = params.manualOverrides?.get(std.id);
      const finalAction = override?.action ?? defaultAction;
      const finalTargetRoom =
        finalAction === 'GRADUATE'
          ? null
          : override?.toClassroomId !== undefined
          ? override.toClassroomId
          : finalAction === 'REPEAT'
          ? std.classroom_id
          : defaultTargetRoom;

      if (finalAction === 'PROMOTE') promoteCount += 1;
      else if (finalAction === 'REPEAT') repeatCount += 1;
      else if (finalAction === 'GRADUATE') graduateCount += 1;

      transitions.push({
        student_id: std.id,
        student_name: `${std.prefix ?? ''}${std.first_name ?? ''} ${std.last_name ?? ''}`.trim(),
        from_classroom_id: std.classroom_id,
        to_classroom_id: finalTargetRoom,
        action: finalAction,
        roll_number: idx + 1,
        grade_level: finalAction === 'REPEAT' ? rule.fromGradeLevel : rule.toGradeLevel,
        remarks: override?.remarks ?? (hasIssue ? `พบผลการเรียนต้องติดตาม: ${issueCourses}` : null),
        has_academic_issue: hasIssue,
        academic_issue_detail: issueCourses || undefined,
      });
    }

    return {
      fromAcademicYear: params.fromAcademicYear,
      fromSemester: params.fromSemester,
      toAcademicYear: params.toAcademicYear,
      toSemester: params.toSemester,
      totalStudents: transitions.length,
      promoteCount,
      repeatCount,
      graduateCount,
      flaggedIssueCount,
      transitions,
    };
  },

  /**
   * 2. สั่งรันการเลื่อนชั้นจริงแบบ Atomic All-or-Nothing ผ่าน PostgreSQL RPC
   */
  async executePromotionBatch(params: {
    fromAcademicYear: number;
    fromSemester: number;
    toAcademicYear: number;
    toSemester: number;
    executedBy: string;
    transitions: StudentPromotionTransition[];
  }): Promise<ExecutePromotionRpcResponse> {
    if (params.transitions.length === 0) {
      throw new Error('ไม่มีรายชื่อนักเรียนในรายการเลื่อนชั้น');
    }

    // 1. บังคับ Flush คะแนนใน Outbox ทั้งหมดก่อนเข้าสู่ Transaction เลื่อนชั้น
    await gradeService.flushOutbox();

    // 2. เตรียม Payload สำหรับส่งเข้า RPC execute_student_promotion_batch
    const rpcPayload = params.transitions.map((t) => ({
      student_id: t.student_id,
      from_classroom_id: t.from_classroom_id,
      to_classroom_id: t.to_classroom_id ?? '',
      action: t.action,
      roll_number: t.roll_number ?? null,
      grade_level: t.grade_level ?? null,
      remarks: t.remarks ?? null,
    }));

    const { data, error } = await supabase.rpc('execute_student_promotion_batch', {
      p_from_academic_year: params.fromAcademicYear,
      p_from_semester: params.fromSemester,
      p_to_academic_year: params.toAcademicYear,
      p_to_semester: params.toSemester,
      p_executed_by: params.executedBy,
      p_transitions: rpcPayload,
    });

    if (error) throw error;
    return data as ExecutePromotionRpcResponse;
  },

  /**
   * 3. ดึงประวัติการรันเลื่อนชั้นทั้งหมดสำหรับหน้า Rollback Manager UI
   */
  async getPromotionBatchHistory(): Promise<PromotionBatchHistoryItem[]> {
    const { data, error } = await supabase
      .from('promotion_batches')
      .select(
        'id, from_academic_year, from_semester, to_academic_year, to_semester, status, summary_json, executed_by, created_at, rolled_back_at'
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as PromotionBatchHistoryItem[]) || [];
  },

  /**
   * 4. ย้อนกลับการเลื่อนชั้น (Conflict-Aware Rollback)
   * หากมีครูกรอกคะแนนในเทอมใหม่แล้วและ forceOverride = false ระบบจะคืนค่า conflict_detected = true
   */
  async rollbackPromotionBatch(params: {
    batchId: string;
    executedBy: string;
    forceOverride?: boolean;
  }): Promise<RollbackPromotionRpcResponse> {
    await gradeService.flushOutbox();

    const { data, error } = await supabase.rpc('rollback_student_promotion_batch', {
      p_batch_id: params.batchId,
      p_executed_by: params.executedBy,
      p_force_override: params.forceOverride ?? false,
    });

    if (error) throw error;
    return data as RollbackPromotionRpcResponse;
  },
};
