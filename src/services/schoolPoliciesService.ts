// src/services/schoolPoliciesService.ts
// ระบบจัดการนโยบายโรงเรียน: เกณฑ์เวลาเรียน (80%), เกณฑ์การตัดเกรด SGS (70:15:15), และการแจ้งเตือน
// ออกแบบให้ยืดหยุ่นต่อบริบทโรงเรียนแต่ละแห่ง และซิงค์ตรงกับฐานข้อมูล Supabase

export interface SchoolAttendancePolicyConfig {
  minAttendancePercent: number; // e.g. 80.0 (% เวลาเรียนขั้นต่ำเพื่อมีสิทธิ์สอบ สพฐ.)
  lateGraceMinutes: number; // e.g. 15 (นาทียืดหยุ่นหลังเวลาเข้าแถว)
  morningAssemblyMandatory: boolean; // นับการเข้าแถวเป็นเกณฑ์สำคัญ
  truancyDetectionEnabled: boolean; // ตรวจจับการโดดเรียน (Lock 2)
  decoupledLatePromotionEnabled: boolean; // ปรับสถานะมาสายอัตโนมัติเมื่อเข้าคาบ 1 (Lock 3)
  consecutiveAbsentAlertDays: number; // แจ้งเตือนเมื่อขาดเรียนติดต่อกัน N วัน (default: 3)
}

export interface SchoolGradingPolicyConfig {
  formativeRatio: number; // คะแนนเก็บระหว่างภาค (default: 70)
  midtermRatio: number; // สอบกลางภาค (default: 15)
  finalRatio: number; // สอบปลายภาค (default: 15)
  passingScoreMin: number; // เกณฑ์คะแนนผ่านขั้นต่ำ (default: 50.0)
  gradeScaleType: 'OBEC_8_LEVELS' | 'CUSTOM';
  retestMaxScore: number; // คะแนนสูงสุดจากการสอบแก้ตัว (default: 50.0 / เกรด 1)
  allowHalfStepRounding: boolean; // ปัดคะแนนทีละ 0.5 คะแนน
}

export interface SchoolNotificationConfig {
  lineNotifyToken: string;
  lineOaChannelId?: string;
  smsSenderName: string;
  notifyParentOnAbsent: boolean;
  notifyParentOnLate: boolean;
  notifyParentOnTruancy: boolean;
  notifyTeacherOnGradingDue: boolean;
}

export const DEFAULT_ATTENDANCE_POLICY: SchoolAttendancePolicyConfig = {
  minAttendancePercent: 80.0,
  lateGraceMinutes: 15,
  morningAssemblyMandatory: true,
  truancyDetectionEnabled: true,
  decoupledLatePromotionEnabled: true,
  consecutiveAbsentAlertDays: 3,
};

export const DEFAULT_GRADING_POLICY: SchoolGradingPolicyConfig = {
  formativeRatio: 70,
  midtermRatio: 15,
  finalRatio: 15,
  passingScoreMin: 50.0,
  gradeScaleType: 'OBEC_8_LEVELS',
  retestMaxScore: 50.0,
  allowHalfStepRounding: true,
};

export const DEFAULT_NOTIFICATION_CONFIG: SchoolNotificationConfig = {
  lineNotifyToken: '',
  smsSenderName: 'KPS_SCHOOL',
  notifyParentOnAbsent: true,
  notifyParentOnLate: true,
  notifyParentOnTruancy: true,
  notifyTeacherOnGradingDue: true,
};

const ATTENDANCE_POLICY_KEY = 'kps_school_attendance_policy_v1';
const GRADING_POLICY_KEY = 'kps_school_grading_policy_v1';
const NOTIFICATION_CONFIG_KEY = 'kps_school_notification_config_v1';

export const SCHOOL_POLICY_SYNC_EVENT = 'kps-school-policy-updated';

class SchoolPoliciesService {
  getAttendancePolicy(): SchoolAttendancePolicyConfig {
    if (typeof window === 'undefined') return DEFAULT_ATTENDANCE_POLICY;
    try {
      const raw = localStorage.getItem(ATTENDANCE_POLICY_KEY);
      if (!raw) return DEFAULT_ATTENDANCE_POLICY;
      return { ...DEFAULT_ATTENDANCE_POLICY, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_ATTENDANCE_POLICY;
    }
  }

  saveAttendancePolicy(next: Partial<SchoolAttendancePolicyConfig>): SchoolAttendancePolicyConfig {
    const current = this.getAttendancePolicy();
    const updated: SchoolAttendancePolicyConfig = {
      ...current,
      ...next,
      minAttendancePercent: Math.min(100, Math.max(50, next.minAttendancePercent ?? current.minAttendancePercent)),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(ATTENDANCE_POLICY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(SCHOOL_POLICY_SYNC_EVENT, { detail: { type: 'ATTENDANCE', data: updated } }));
    }
    return updated;
  }

  getGradingPolicy(): SchoolGradingPolicyConfig {
    if (typeof window === 'undefined') return DEFAULT_GRADING_POLICY;
    try {
      const raw = localStorage.getItem(GRADING_POLICY_KEY);
      if (!raw) return DEFAULT_GRADING_POLICY;
      return { ...DEFAULT_GRADING_POLICY, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_GRADING_POLICY;
    }
  }

  saveGradingPolicy(next: Partial<SchoolGradingPolicyConfig>): SchoolGradingPolicyConfig {
    const current = this.getGradingPolicy();
    const updated: SchoolGradingPolicyConfig = {
      ...current,
      ...next,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(GRADING_POLICY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(SCHOOL_POLICY_SYNC_EVENT, { detail: { type: 'GRADING', data: updated } }));
    }
    return updated;
  }

  getNotificationConfig(): SchoolNotificationConfig {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_CONFIG;
    try {
      const raw = localStorage.getItem(NOTIFICATION_CONFIG_KEY);
      if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
      return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_NOTIFICATION_CONFIG;
    }
  }

  saveNotificationConfig(next: Partial<SchoolNotificationConfig>): SchoolNotificationConfig {
    const current = this.getNotificationConfig();
    const updated: SchoolNotificationConfig = {
      ...current,
      ...next,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATION_CONFIG_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(SCHOOL_POLICY_SYNC_EVENT, { detail: { type: 'NOTIFICATION', data: updated } }));
    }
    return updated;
  }
}

export const schoolPoliciesService = new SchoolPoliciesService();
