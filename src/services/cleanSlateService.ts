// src/services/cleanSlateService.ts
// บริการล้างข้อมูลจำลอง (Clean Slate MVP Initializer)
// สำหรับเริ่มใช้งานจริง โดยไม่กระทบกับข้อมูลพื้นฐานของโรงเรียนและระบบการลาเดิม

export interface CleanSlatePurgeResult {
  success: boolean;
  timestamp: string;
  purgedKeys: string[];
  preservedKeys: string[];
  message: string;
}

const CLEAN_SLATE_FLAG_KEY = 'kp_clean_slate_mvp_activated';

// รายการ Key ข้อมูลจำลองประเภท Transaction (ข้อมูลคะแนน, บันทึกการเข้าเรียน, ข้อสอบ, แชท)
export const TRANSACTIONAL_STORAGE_KEYS = [
  'cls_scores_data',
  'kp_morning_assembly_records',
  'kp_period_attendance_records',
  'cls_chat_messages',
  'kp_exams_management_data_v1',
  'kp_student_quiz_attempts',
  'kp_assignment_submissions_v1',
  'cls_score_audit_logs',
];

// รายการ Key โครงสร้างพื้นฐานของโรงเรียนที่ต้องเก็บรักษาไว้ (Preserved Infrastructure)
export const PRESERVED_INFRASTRUCTURE_KEYS = [
  'cls_classrooms_data',
  'kp_school_bell_schedule',
  'kp_academic_calendar',
  'kp_school_branding',
  'kp_school_leave_settings',
  'cls_current_auth_user',
];

class CleanSlateService {
  /**
   * ตรวจสอบว่าระบบอยู่ในสถานะ Clean Slate MVP หรือไม่
   */
  isCleanSlateActive(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return localStorage.getItem(CLEAN_SLATE_FLAG_KEY) === 'true';
  }

  /**
   * ล้างข้อมูลจำลอง (Transactional Mock Data) ทั้งหมด เพื่อเริ่มใช้งานจริง
   * โดยคงโครงสร้างโรงเรียน, ห้องเรียน ม.1 - ม.6, ตารางเวลา และระบบการลาไว้อย่างสมบูรณ์
   */
  purgeTransactionalMockData(): CleanSlatePurgeResult {
    const purgedKeys: string[] = [];
    const preservedKeys: string[] = [...PRESERVED_INFRASTRUCTURE_KEYS];

    if (typeof window !== 'undefined' && window.localStorage) {
      TRANSACTIONAL_STORAGE_KEYS.forEach((key) => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          purgedKeys.push(key);
        }
      });

      // ตั้งค่าสถานะ Clean Slate Active
      localStorage.setItem(CLEAN_SLATE_FLAG_KEY, 'true');

      // แจ้งเตือน Reactive Event Bus
      try {
        const event = new CustomEvent('kps-data-sync-event', {
          detail: {
            type: 'CLEAN_SLATE_PURGED',
            timestamp: new Date().toISOString(),
            purgedKeys,
          },
        });
        window.dispatchEvent(event);
      } catch {
        // SSR safe fallback
      }
    } else {
      // In-memory fallback for test/node environments
      purgedKeys.push(...TRANSACTIONAL_STORAGE_KEYS);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      purgedKeys,
      preservedKeys,
      message: 'ล้างข้อมูลจำลองเพื่อเริ่มใช้งานจริงเรียบร้อยแล้ว โดยยังคงรักษาข้อมูลโรงเรียนและห้องเรียนไว้ครบถ้วน',
    };
  }

  /**
   * คืนค่าสถานะให้สามารถสลับกลับมาโหมดตัวอย่างได้ (สำหรับโหมดทดสอบ / เดโม่)
   */
  deactivateCleanSlate(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(CLEAN_SLATE_FLAG_KEY);
      try {
        window.dispatchEvent(
          new CustomEvent('kps-data-sync-event', {
            detail: { type: 'CLEAN_SLATE_RESET' },
          })
        );
      } catch {
        // SSR safe fallback
      }
    }
  }
}

export const cleanSlateService = new CleanSlateService();
