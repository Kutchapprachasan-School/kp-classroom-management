// src/services/studentPurgeService.ts
import { supabase } from '../lib/supabaseClient.ts';
import { gradeService } from './gradeService.ts';

export interface PurgeStudentRpcResponse {
  success: boolean;
  blocked_by_guard: boolean;
  active_score_count?: number;
  completed_term_count?: number;
  message?: string;
  purged_student_id?: string;
}

export const studentPurgeService = {
  /**
   * ลบข้อมูลนักเรียนทดสอบ 1 คนอย่างปลอดภัย
   * - หากพบคะแนนจริงใน StudentScore หรือมีประวัติจบเทอมใน student_enrollments และไม่ได้ตั้ง force = true
   *   ระบบจะบล็อกและส่งจำนวนข้อมูลที่ตรวจพบกลับมาให้แสดงคำเตือนบน UI
   */
  async purgeTestStudent(studentId: string, force = false): Promise<PurgeStudentRpcResponse> {
    if (!studentId || !studentId.trim()) {
      throw new Error('กรุณาระบุรหัสนักเรียนที่ต้องการลบ');
    }

    // ซิงค์ Outbox ให้เสร็จสิ้นก่อนตรวจสอบ Dependency บนฐานข้อมูล
    await gradeService.flushOutbox();

    const { data, error } = await supabase.rpc('purge_test_student_safely', {
      p_student_id: studentId,
      p_force: force,
    });

    if (error) throw error;
    return data as PurgeStudentRpcResponse;
  },
};
