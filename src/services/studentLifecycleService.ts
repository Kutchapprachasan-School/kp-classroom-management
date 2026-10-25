// src/services/studentLifecycleService.ts
// ระบบบริหารจัดการสถานะทะเบียนและบัญชีผู้ใช้งานนักเรียนครบวงจร (Student User & Lifecycle Management)
// ครอบคลุม: กำลังศึกษา, ย้ายเข้า/ย้ายห้อง, ย้ายออกต่างโรงเรียน, จบการศึกษา, ลาออก, พักการเรียน, จำหน่ายออก (พ้นสภาพ), คืนสภาพ และจัดการบัญชี/รหัสผ่าน

import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import {
  studentService,
  formatClassroomLabel,
  type StudentRecord,
} from './studentService.ts';
import { masterDataService, CANONICAL_TIMESTAMP_ROOM_MAP } from './masterDataService.ts';
import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService.ts';
import { messagingService } from './messagingService.ts';
import { activityAuditLogService } from './activityAuditLogService.ts';
import { cloudDataService } from './cloudDataService.ts';
import type { SchoolUserRole } from '../config/schoolRoles.ts';

export type StudentLifecycleStatus =
  | 'STUDYING'        // กำลังศึกษาปกติ
  | 'TRANSFERRED_IN'  // ย้ายเข้าใหม่ / ย้ายห้องเรียนภายใน
  | 'TRANSFERRED_OUT' // ย้ายออกต่างโรงเรียน
  | 'GRADUATED'       // จบการศึกษา / ศิษย์เก่า
  | 'DROPPED_OUT'     // ลาออกตามคำร้อง
  | 'SUSPENDED'       // พักการเรียนชั่วคราว
  | 'DISMISSED'       // จำหน่ายชื่อออก / พ้นสภาพนักเรียน
  | 'REPEATED';       // ซ้ำชั้น / รอซ่อม ร-มส.

export type StudentAccountAccessStatus =
  | 'ACTIVE'    // เข้าสู่ระบบพอร์ทัลนักเรียนได้ปกติ
  | 'SUSPENDED' // ระงับการเข้าสู่ระบบชั่วคราว (เช่น พักการเรียน, ย้ายออก, ลาออก)
  | 'REVOKED';  // ปิดสิทธิ์ถาวร (เช่น จำหน่ายชื่อออก)

export type StudentLifecycleReasonCode =
  | 'NORMAL_ENROLLED'
  | 'NEW_ADMISSION_TRANSFER_IN'
  | 'INTERNAL_ROOM_CHANGE'
  | 'TRANSFER_SCHOOL'
  | 'GRADUATED_M3'
  | 'GRADUATED_M6'
  | 'VOLUNTARY_RESIGN'
  | 'TEMP_SUSPENSION'
  | 'CHRONIC_ABSENCE'
  | 'UNKNOWN_WHEREABOUTS'
  | 'AGE_OR_CURRICULUM_LIMIT'
  | 'DECEASED'
  | 'REINSTATED_RETURN';

export interface StudentLifecycleMeta {
  studentCode: string;
  studentId?: string;
  studentName: string;
  classroom: string;
  previousClassroom?: string;
  seatNo?: number;
  gender?: 'MALE' | 'FEMALE';
  lifecycleStatus: StudentLifecycleStatus;
  accountStatus: StudentAccountAccessStatus;
  reasonCode: StudentLifecycleReasonCode;
  reasonLabel: string;
  documentOrderNo?: string;       // เลขที่คำสั่งโรงเรียน / เลขที่หนังสือส่งตัว ปพ.1
  effectiveDate: string;          // วันที่อนุมัติ / วันที่มีผล
  returnDate?: string;            // วันครบกำหนดกลับเข้าเรียน (กรณีพักการเรียน)
  sourceOrTargetSchool?: string;  // โรงเรียนเดิม (ย้ายเข้า) หรือ โรงเรียนปลายทาง (ย้ายออก)
  graduatedAcademicYear?: number; // ปีการศึกษาที่จบ (เช่น 2569)
  remarks?: string;               // หมายเหตุเพิ่มเติม
  updatedBy: string;
  updatedAt: string;
}

export interface StudentLifecycleTransitionInput {
  studentCode: string;
  studentId?: string;
  studentName: string;
  currentClassroom: string;
  targetClassroom?: string;
  seatNo?: number;
  gender?: 'MALE' | 'FEMALE';
  lifecycleStatus: StudentLifecycleStatus;
  reasonCode: StudentLifecycleReasonCode;
  documentOrderNo?: string;
  effectiveDate?: string;
  returnDate?: string;
  sourceOrTargetSchool?: string;
  graduatedAcademicYear?: number;
  remarks?: string;
  actorName?: string;
  actorRole?: SchoolUserRole;
}

export interface UnifiedStudentUserRecord {
  id: string;
  studentCode: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  classroom: string;
  seatNo: number;
  lifecycleStatus: StudentLifecycleStatus;
  accountStatus: StudentAccountAccessStatus;
  reasonCode: StudentLifecycleReasonCode;
  reasonLabel: string;
  documentOrderNo?: string;
  effectiveDate?: string;
  sourceOrTargetSchool?: string;
  graduatedAcademicYear?: number;
  remarks?: string;
  isPasswordChanged?: boolean;
  lastLoginAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export const LIFECYCLE_STATUS_CONFIG: Record<
  StudentLifecycleStatus,
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    defaultAccountStatus: StudentAccountAccessStatus;
    description: string;
  }
> = {
  STUDYING: {
    label: 'กำลังศึกษา',
    shortLabel: 'กำลังศึกษา',
    badgeBg: 'bg-[#ECFDF5]',
    badgeText: 'text-[#065F46]',
    badgeBorder: 'border-[#A7F3D0]',
    defaultAccountStatus: 'ACTIVE',
    description: 'มีชื่ออยู่ในทะเบียนห้องเรียนปัจจุบัน และเข้าใช้งานพอร์ทัลนักเรียนได้ตามปกติ',
  },
  TRANSFERRED_IN: {
    label: 'ย้ายเข้า / ย้ายห้อง',
    shortLabel: 'ย้ายเข้า',
    badgeBg: 'bg-[#EFF6FF]',
    badgeText: 'text-[#1E40AF]',
    badgeBorder: 'border-[#BFDBFE]',
    defaultAccountStatus: 'ACTIVE',
    description: 'นักเรียนย้ายเข้าใหม่กลางปี หรือย้ายห้องเรียนภายในสถานศึกษา (พกคะแนนสะสมอัตโนมัติ)',
  },
  TRANSFERRED_OUT: {
    label: 'ย้ายออกต่างโรงเรียน',
    shortLabel: 'ย้ายออก',
    badgeBg: 'bg-[#FFFBEB]',
    badgeText: 'text-[#92400E]',
    badgeBorder: 'border-[#FDE68A]',
    defaultAccountStatus: 'SUSPENDED',
    description: 'อนุมัติส่งตัวไปศึกษาต่อสถานศึกษาอื่น (ถอนชื่อออกจากยอดปัจจุบันแต่คงประวัติคะแนนเดิม)',
  },
  GRADUATED: {
    label: 'จบการศึกษา (ศิษย์เก่า)',
    shortLabel: 'จบการศึกษา',
    badgeBg: 'bg-[#F5F3FF]',
    badgeText: 'text-[#5B21B6]',
    badgeBorder: 'border-[#DDD6FE]',
    defaultAccountStatus: 'SUSPENDED',
    description: 'สำเร็จการศึกษาตามหลักสูตร (ม.3 หรือ ม.6) บันทึกในทำเนียบศิษย์เก่าและระเบียนสะสม',
  },
  DROPPED_OUT: {
    label: 'ลาออก',
    shortLabel: 'ลาออก',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    defaultAccountStatus: 'SUSPENDED',
    description: 'ผู้ปกครองยื่นคำร้องขอลาออกและได้รับอนุมัติจากผู้อำนวยการสถานศึกษาแล้ว',
  },
  SUSPENDED: {
    label: 'พักการเรียนชั่วคราว',
    shortLabel: 'พักการเรียน',
    badgeBg: 'bg-[#FFFBEB]',
    badgeText: 'text-[#92400E]',
    badgeBorder: 'border-[#FDE68A]',
    defaultAccountStatus: 'SUSPENDED',
    description: 'พักการเรียนชั่วคราวตามคำร้อง (เช่น ป่วยระยะยาว หรือเหตุจำเป็น) รอกลับเข้าศึกษาต่อ',
  },
  DISMISSED: {
    label: 'จำหน่ายออก (พ้นสภาพ)',
    shortLabel: 'จำหน่ายออก',
    badgeBg: 'bg-[#FEF2F2]',
    badgeText: 'text-[#991B1B]',
    badgeBorder: 'border-[#FECACA]',
    defaultAccountStatus: 'REVOKED',
    description: 'จำหน่ายชื่อออกจากทะเบียนนักเรียนตามระเบียบ สพฐ. (ขาดเรียนเกินกำหนด / ไม่ทราบที่อยู่ / ถึงแก่กรรม)',
  },
  REPEATED: {
    label: 'ซ้ำชั้น / รอซ่อม ร-มส.',
    shortLabel: 'ซ้ำชั้น/รอซ่อม',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    defaultAccountStatus: 'ACTIVE',
    description: 'อยู่ระหว่างซ่อมผลการเรียน (0, ร, มส.) หรือเรียนซ้ำระดับชั้นเดิม',
  },
};

export const LIFECYCLE_REASON_OPTIONS: Array<{
  code: StudentLifecycleReasonCode;
  label: string;
  forStatuses: StudentLifecycleStatus[];
}> = [
  {
    code: 'NORMAL_ENROLLED',
    label: 'กำลังศึกษาตามปกติในภาคเรียนปัจจุบัน',
    forStatuses: ['STUDYING'],
  },
  {
    code: 'REINSTATED_RETURN',
    label: 'อนุมัติคืนสภาพนักเรียน / กลับเข้าศึกษาต่อ',
    forStatuses: ['STUDYING'],
  },
  {
    code: 'NEW_ADMISSION_TRANSFER_IN',
    label: 'รับนักเรียนย้ายเข้าใหม่จากสถานศึกษาอื่น',
    forStatuses: ['TRANSFERRED_IN'],
  },
  {
    code: 'INTERNAL_ROOM_CHANGE',
    label: 'ย้ายห้องเรียนภายในสถานศึกษา (พกคะแนนสะสม)',
    forStatuses: ['TRANSFERRED_IN'],
  },
  {
    code: 'TRANSFER_SCHOOL',
    label: 'ย้ายไปศึกษาต่อสถานศึกษาอื่น (ออกหนังสือส่งตัว ปพ.1)',
    forStatuses: ['TRANSFERRED_OUT'],
  },
  {
    code: 'GRADUATED_M3',
    label: 'สำเร็จการศึกษาชั้นมัธยมศึกษาปีที่ 3 (จบ ม.ต้น)',
    forStatuses: ['GRADUATED'],
  },
  {
    code: 'GRADUATED_M6',
    label: 'สำเร็จการศึกษาชั้นมัธยมศึกษาปีที่ 6 (จบ ม.ปลาย)',
    forStatuses: ['GRADUATED'],
  },
  {
    code: 'VOLUNTARY_RESIGN',
    label: 'ผู้ปกครองยื่นคำร้องขอลาออกตามความประสงค์',
    forStatuses: ['DROPPED_OUT'],
  },
  {
    code: 'TEMP_SUSPENSION',
    label: 'ขอพักการเรียนชั่วคราว (เจ็บป่วยระยะยาว / เหตุจำเป็นทางครอบครัว)',
    forStatuses: ['SUSPENDED'],
  },
  {
    code: 'CHRONIC_ABSENCE',
    label: 'จำหน่ายชื่อออก: ขาดเรียนติดต่อกันเกินกำหนดโดยไม่แจ้งสาเหตุ',
    forStatuses: ['DISMISSED'],
  },
  {
    code: 'UNKNOWN_WHEREABOUTS',
    label: 'จำหน่ายชื่อออก: ย้ายภูมิลำเนาไม่ทราบที่อยู่ / ติดต่อผู้ปกครองไม่ได้',
    forStatuses: ['DISMISSED'],
  },
  {
    code: 'AGE_OR_CURRICULUM_LIMIT',
    label: 'จำหน่ายชื่อออก: พ้นเกณฑ์อายุหรือครบกำหนดเวลาตามหลักสูตร',
    forStatuses: ['DISMISSED'],
  },
  {
    code: 'DECEASED',
    label: 'จำหน่ายชื่อออก: ถึงแก่กรรม',
    forStatuses: ['DISMISSED'],
  },
];

const STORAGE_KEY_LIFECYCLE_REGISTRY = 'kp_student_lifecycle_registry_v1';
export const STUDENT_LIFECYCLE_UPDATED_EVENT = 'kp-student-lifecycle-updated';

// ============================================================================
// RBAC Permission Matrix Helper (แยกสิทธิ์ ครู vs แอดมิน vs นายทะเบียน/กิจการนักเรียน)
// ============================================================================
export function canManageSystemAdminSettings(role?: SchoolUserRole): boolean {
  return role === 'ACADEMIC_ADMIN';
}

export function canManageStudentLifecycle(role?: SchoolUserRole): boolean {
  return role === 'ACADEMIC_ADMIN' || role === 'STUDENT_AFFAIRS';
}

export function canManageHomeroomAdvisors(role?: SchoolUserRole): boolean {
  return role === 'ACADEMIC_ADMIN' || role === 'STUDENT_AFFAIRS';
}

export type SettingPermissionTier = 'TEACHER_OWNED' | 'REGISTRAR_AFFAIRS' | 'ADMIN_SYSTEM';

export function getSettingPermissionTier(settingKey: string): SettingPermissionTier {
  switch (settingKey) {
    // 1. ส่วนของครูผู้สอน (Teacher Owned — ครูทุกคนตั้งค่าวิชาและงานสอนของตนเองได้)
    case 'courses':
    case 'assignments':
    case 'exams':
    case 'forms':
    case 'grades':
    case 'reports':
    case 'analytics':
    case 'notifications':
    case 'security':
      return 'TEACHER_OWNED';

    // 2. ส่วนงานทะเบียนและกิจการนักเรียน (Registrar & Student Affairs — แอดมิน + กิจการนักเรียน/นายทะเบียนแก้ไขได้, ครูดูได้)
    case 'students':
    case 'classrooms':
    case 'attendance':
    case 'behavior':
    case 'parents':
      return 'REGISTRAR_AFFAIRS';

    // 3. ส่วนผู้ดูแลระบบและผู้บริหาร (System Admin Only — เฉพาะแอดมินแก้ไขได้)
    case 'academic_terms':
    case 'school_info':
    case 'users':
    case 'timetable':
    case 'backup':
    case 'theme':
    case 'gacha':
    default:
      return 'ADMIN_SYSTEM';
  }
}

export function canRoleEditSetting(role: SchoolUserRole | undefined, settingKey: string): boolean {
  const effectiveRole = role || 'TEACHER_GENERAL';
  if (effectiveRole === 'ACADEMIC_ADMIN') return true;
  const tier = getSettingPermissionTier(settingKey);
  if (tier === 'TEACHER_OWNED') return true;
  if (tier === 'REGISTRAR_AFFAIRS' && effectiveRole === 'STUDENT_AFFAIRS') return true;
  return false;
}

class StudentLifecycleService {
  private readRegistryMap(): Record<string, StudentLifecycleMeta> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIFECYCLE_REGISTRY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, StudentLifecycleMeta>;
      }
    } catch {
      // ignore
    }
    return {};
  }

  private writeRegistryMap(map: Record<string, StudentLifecycleMeta>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LIFECYCLE_REGISTRY, JSON.stringify(map));
      cloudDataService.saveCloudKey(STORAGE_KEY_LIFECYCLE_REGISTRY, map).catch(() => {});
      window.dispatchEvent(new CustomEvent(STUDENT_LIFECYCLE_UPDATED_EVENT, { detail: map }));
    } catch {
      // ignore
    }
  }

  getStudentLifecycleMeta(studentCode: string): StudentLifecycleMeta | null {
    const cleanCode = String(studentCode || '').trim().replace(/^stu-/, '');
    if (!cleanCode) return null;
    const map = this.readRegistryMap();
    return map[cleanCode] || null;
  }

  getAllLifecycleMeta(): StudentLifecycleMeta[] {
    const map = this.readRegistryMap();
    return Object.values(map).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * ตรวจสอบว่าบัญชีนักเรียนสามารถเข้าสู่ระบบพอร์ทัลนักเรียนได้หรือไม่
   */
  checkStudentLoginEligibility(studentCode: string): {
    allowed: boolean;
    reason?: string;
    meta?: StudentLifecycleMeta;
  } {
    const meta = this.getStudentLifecycleMeta(studentCode);
    if (!meta) return { allowed: true };

    if (meta.accountStatus === 'ACTIVE' && (meta.lifecycleStatus === 'STUDYING' || meta.lifecycleStatus === 'TRANSFERRED_IN' || meta.lifecycleStatus === 'REPEATED')) {
      return { allowed: true, meta };
    }

    const statusInfo = LIFECYCLE_STATUS_CONFIG[meta.lifecycleStatus];
    const label = statusInfo?.label || meta.lifecycleStatus;
    const docNote = meta.documentOrderNo ? ` (อ้างอิง: ${meta.documentOrderNo})` : '';

    if (meta.lifecycleStatus === 'TRANSFERRED_OUT') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} ถูกระงับเนื่องจากมีสถานะ "${label}"${meta.sourceOrTargetSchool ? ` ไปยัง ${meta.sourceOrTargetSchool}` : ''}${docNote} กรุณาติดต่อห้องทะเบียนวัดผล`,
        meta,
      };
    }
    if (meta.lifecycleStatus === 'GRADUATED') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} สำเร็จการศึกษาแล้ว (${label} ปีการศึกษา ${meta.graduatedAcademicYear || 2569})`,
        meta,
      };
    }
    if (meta.lifecycleStatus === 'DROPPED_OUT') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} ถูกระงับเนื่องจากมีสถานะ "ลาออก"${docNote} กรุณาติดต่อฝ่ายทะเบียนหรือครูที่ปรึกษา`,
        meta,
      };
    }
    if (meta.lifecycleStatus === 'SUSPENDED') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} อยู่ระหว่าง "พักการเรียนชั่วคราว"${meta.returnDate ? ` (ถึงวันที่ ${meta.returnDate})` : ''}${docNote}`,
        meta,
      };
    }
    if (meta.lifecycleStatus === 'DISMISSED' || meta.accountStatus === 'REVOKED') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} ถูกจำหน่ายชื่อออกจากทะเบียนนักเรียน (${meta.reasonLabel || label})${docNote} ไม่สามารถเข้าใช้งานได้`,
        meta,
      };
    }
    if (meta.accountStatus === 'SUSPENDED') {
      return {
        allowed: false,
        reason: `บัญชีรหัส ${studentCode} ถูกระงับสิทธิ์ชั่วคราวโดยผู้ดูแลระบบ กรุณาติดต่อครูที่ปรึกษาหรือห้องทะเบียน`,
        meta,
      };
    }

    return { allowed: true, meta };
  }

  /**
   * ดึงรายชื่อนักเรียนทั้งหมดพร้อมสถานะทะเบียนและบัญชี (รวมทั้งที่กำลังศึกษาและย้ายออก/จบ/จำหน่ายออก)
   */
  async loadAllStudentsWithLifecycle(): Promise<UnifiedStudentUserRecord[]> {
    const registryMap = this.readRegistryMap();
    const byCode = new Map<string, UnifiedStudentUserRecord>();

    // 1. ดึงจากฐานข้อมูลจริงผ่าน View `students` ถ้าเชื่อมต่ออยู่
    if (isSupabaseConfigured) {
      try {
        const { data: rows } = await supabase
          .from('students')
          .select('id, code, studentCode, name, title, first_name, last_name, gender, status, classroom_id, seat_no, academic_status, graduated_academic_year')
          .order('classroom_id', { ascending: true })
          .order('seat_no', { ascending: true });

        if (Array.isArray(rows)) {
          for (const r of rows) {
            const code = String(r.studentCode || r.code || '').trim();
            if (!code) continue;
            const rawRoom = r.classroom_id || '';
            const formattedRoom = formatClassroomLabel(rawRoom) || 'ไม่ระบุห้อง';
            const dbAcademicStatus = String(r.academic_status || 'STUDYING').toUpperCase();

            let mappedLifecycle: StudentLifecycleStatus = 'STUDYING';
            if (dbAcademicStatus === 'GRADUATED' || r.status === 'GRADUATED') {
              mappedLifecycle = 'GRADUATED';
            } else if (dbAcademicStatus === 'TRANSFERRED_OUT' || dbAcademicStatus === 'TRANSFERRED') {
              mappedLifecycle = 'TRANSFERRED_OUT';
            } else if (dbAcademicStatus === 'TRANSFERRED_IN') {
              mappedLifecycle = 'TRANSFERRED_IN';
            } else if (dbAcademicStatus === 'DROPPED_OUT' || dbAcademicStatus === 'RESIGNED') {
              mappedLifecycle = 'DROPPED_OUT';
            } else if (dbAcademicStatus === 'SUSPENDED') {
              mappedLifecycle = 'SUSPENDED';
            } else if (dbAcademicStatus === 'DISMISSED') {
              mappedLifecycle = 'DISMISSED';
            } else if (dbAcademicStatus === 'REPEATED') {
              mappedLifecycle = 'REPEATED';
            }

            const localMeta = registryMap[code];
            const finalStatus = localMeta?.lifecycleStatus || mappedLifecycle;
            const statusCfg = LIFECYCLE_STATUS_CONFIG[finalStatus] || LIFECYCLE_STATUS_CONFIG.STUDYING;
            const finalAccountStatus = localMeta?.accountStatus || statusCfg.defaultAccountStatus;

            const fullName =
              r.name ||
              `${r.title || ''}${r.first_name || ''} ${r.last_name || ''}`.trim() ||
              localMeta?.studentName ||
              `นักเรียน ${code}`;

            byCode.set(code, {
              id: r.id || `stu-${code}`,
              studentCode: code,
              name: fullName,
              gender: r.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
              classroom: localMeta?.classroom || formattedRoom,
              seatNo: Number(r.seat_no || localMeta?.seatNo || 1),
              lifecycleStatus: finalStatus,
              accountStatus: finalAccountStatus,
              reasonCode: localMeta?.reasonCode || 'NORMAL_ENROLLED',
              reasonLabel: localMeta?.reasonLabel || statusCfg.label,
              documentOrderNo: localMeta?.documentOrderNo,
              effectiveDate: localMeta?.effectiveDate,
              sourceOrTargetSchool: localMeta?.sourceOrTargetSchool,
              graduatedAcademicYear: localMeta?.graduatedAcademicYear || r.graduated_academic_year || undefined,
              remarks: localMeta?.remarks,
              updatedBy: localMeta?.updatedBy,
              updatedAt: localMeta?.updatedAt,
            });
          }
        }
      } catch (err) {
        console.warn('[StudentLifecycleService] DB query fallback to local:', err);
      }
    }

    // 2. เสริมจาก Local Cache ของทุกห้องเรียน (รวมถึงสถานะรหัสผ่านที่เปลี่ยนแล้ว)
    const allRooms = new Set<string>([
      ...Object.values(CANONICAL_TIMESTAMP_ROOM_MAP),
      'ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1', 'ม.3/2',
      'ม.4/1', 'ม.4/2', 'ม.5/1', 'ม.5/2', 'ม.5/4', 'ม.6/1', 'ม.6/2', 'ม.6/3',
    ]);

    for (const room of allRooms) {
      const localList: StudentRecord[] = studentService.getLocalStudents(room);
      for (const stu of localList) {
        const code = String(stu.code || stu.studentCode || '').trim().replace(/^stu-/, '');
        if (!code) continue;
        const existing = byCode.get(code);
        const localMeta = registryMap[code];
        if (existing) {
          if (stu.isPasswordChanged) existing.isPasswordChanged = true;
          if (stu.lastLoginAt) existing.lastLoginAt = stu.lastLoginAt;
        } else {
          const finalStatus = localMeta?.lifecycleStatus || 'STUDYING';
          const statusCfg = LIFECYCLE_STATUS_CONFIG[finalStatus] || LIFECYCLE_STATUS_CONFIG.STUDYING;
          byCode.set(code, {
            id: stu.id || `stu-${code}`,
            studentCode: code,
            name: stu.name || localMeta?.studentName || `นักเรียน ${code}`,
            gender: stu.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
            classroom: localMeta?.classroom || formatClassroomLabel(stu.classroomId || room),
            seatNo: stu.no || localMeta?.seatNo || 1,
            lifecycleStatus: finalStatus,
            accountStatus: localMeta?.accountStatus || statusCfg.defaultAccountStatus,
            reasonCode: localMeta?.reasonCode || 'NORMAL_ENROLLED',
            reasonLabel: localMeta?.reasonLabel || statusCfg.label,
            documentOrderNo: localMeta?.documentOrderNo,
            effectiveDate: localMeta?.effectiveDate,
            sourceOrTargetSchool: localMeta?.sourceOrTargetSchool,
            graduatedAcademicYear: localMeta?.graduatedAcademicYear,
            remarks: localMeta?.remarks,
            isPasswordChanged: stu.isPasswordChanged,
            lastLoginAt: stu.lastLoginAt,
            updatedBy: localMeta?.updatedBy,
            updatedAt: localMeta?.updatedAt,
          });
        }
      }
    }

    // 3. รวมรายการที่อยู่ใน Registry Map (เช่น เด็กที่ย้ายออกหรือจำหน่ายออกไปแล้วไม่มีใน Active Enrollment)
    for (const [code, meta] of Object.entries(registryMap)) {
      if (!byCode.has(code)) {
        byCode.set(code, {
          id: meta.studentId || `stu-${code}`,
          studentCode: code,
          name: meta.studentName,
          gender: meta.gender || 'MALE',
          classroom: formatClassroomLabel(meta.classroom || meta.previousClassroom || 'ไม่ระบุห้อง'),
          seatNo: meta.seatNo || 1,
          lifecycleStatus: meta.lifecycleStatus,
          accountStatus: meta.accountStatus,
          reasonCode: meta.reasonCode,
          reasonLabel: meta.reasonLabel,
          documentOrderNo: meta.documentOrderNo,
          effectiveDate: meta.effectiveDate,
          sourceOrTargetSchool: meta.sourceOrTargetSchool,
          graduatedAcademicYear: meta.graduatedAcademicYear,
          remarks: meta.remarks,
          updatedBy: meta.updatedBy,
          updatedAt: meta.updatedAt,
        });
      }
    }

    return Array.from(byCode.values()).sort((a, b) => {
      const roomCmp = a.classroom.localeCompare(b.classroom, 'th');
      if (roomCmp !== 0) return roomCmp;
      return a.seatNo - b.seatNo;
    });
  }

  /**
   * ดำเนินการเปลี่ยนสถานะทะเบียนนักเรียน (ย้ายเข้า, ย้ายห้อง, ย้ายออก, จบการศึกษา, ลาออก, พักการเรียน, จำหน่ายออก, คืนสภาพ)
   */
  async executeLifecycleTransition(
    input: StudentLifecycleTransitionInput
  ): Promise<StudentLifecycleMeta> {
    const cleanCode = String(input.studentCode || '').trim().replace(/^stu-/, '');
    if (!cleanCode) {
      throw new Error('กรุณาระบุรหัสประจำตัวนักเรียน');
    }

    const statusCfg = LIFECYCLE_STATUS_CONFIG[input.lifecycleStatus];
    const reasonObj = LIFECYCLE_REASON_OPTIONS.find((r) => r.code === input.reasonCode);
    const reasonLabel = reasonObj?.label || statusCfg.label;
    const effectiveClassroom = formatClassroomLabel(
      input.targetClassroom || input.currentClassroom || 'ม.1/1'
    );
    const nowIso = new Date().toISOString();
    const todayThai =
      input.effectiveDate ||
      new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    const actor = input.actorName || 'ผู้ดูแลระบบทะเบียนนักเรียน';

    const meta: StudentLifecycleMeta = {
      studentCode: cleanCode,
      studentId: input.studentId || `stu-${cleanCode}`,
      studentName: input.studentName.trim(),
      classroom: effectiveClassroom,
      previousClassroom: formatClassroomLabel(input.currentClassroom),
      seatNo: input.seatNo,
      gender: input.gender || 'MALE',
      lifecycleStatus: input.lifecycleStatus,
      accountStatus: statusCfg.defaultAccountStatus,
      reasonCode: input.reasonCode,
      reasonLabel,
      documentOrderNo: input.documentOrderNo?.trim() || undefined,
      effectiveDate: todayThai,
      returnDate: input.returnDate?.trim() || undefined,
      sourceOrTargetSchool: input.sourceOrTargetSchool?.trim() || undefined,
      graduatedAcademicYear: input.graduatedAcademicYear,
      remarks: input.remarks?.trim() || undefined,
      updatedBy: actor,
      updatedAt: nowIso,
    };

    // 1. บันทึกลง Registry Map และซิงค์ Cloud
    const map = this.readRegistryMap();
    const previousMeta = map[cleanCode];
    map[cleanCode] = meta;
    this.writeRegistryMap(map);

    // 2. จัดการข้อมูลในระบบชั้นเรียนและฐานข้อมูลตามประเภทสถานะ
    if (input.lifecycleStatus === 'TRANSFERRED_IN') {
      if (
        input.reasonCode === 'INTERNAL_ROOM_CHANGE' &&
        input.currentClassroom &&
        input.targetClassroom &&
        formatClassroomLabel(input.currentClassroom) !== formatClassroomLabel(input.targetClassroom)
      ) {
        // ย้ายห้องเรียนภายในสถานศึกษา
        try {
          messagingService.executeStudentTransfer({
            studentCode: cleanCode,
            fromClassroomId: input.currentClassroom,
            toClassroomId: input.targetClassroom,
            transferReason: reasonLabel,
          });
        } catch (err) {
          console.warn('[StudentLifecycleService] Internal room transfer warning:', err);
        }
      } else {
        // รับนักเรียนย้ายเข้าใหม่
        try {
          sgsRosterAndSubmissionService.addTransferredInStudent({
            studentCode: cleanCode,
            studentName: input.studentName,
            gender: input.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
            insertPosition: 'AFTER_SAME_GENDER',
            transferDate: todayThai,
            transferredU1Score: 0,
          });
        } catch (err) {
          console.warn('[StudentLifecycleService] SGS transfer in warning:', err);
        }
      }
    } else if (
      input.lifecycleStatus === 'TRANSFERRED_OUT' ||
      input.lifecycleStatus === 'DROPPED_OUT' ||
      input.lifecycleStatus === 'DISMISSED' ||
      input.lifecycleStatus === 'SUSPENDED'
    ) {
      // แจ้งย้ายออก / ลาออก / พักการเรียน / จำหน่ายออก ใน SGS Roster
      try {
        const sgsList = sgsRosterAndSubmissionService.getSgsRoster();
        const found = sgsList.find((s) => s.studentCode === cleanCode);
        if (found && found.transferState !== 'TRANSFERRED_OUT') {
          sgsRosterAndSubmissionService.toggleStudentTransferOut(cleanCode);
        }
      } catch {
        // ignore if not in SGS roster
      }
    }

    // 3. ซิงค์ลงฐานข้อมูลจริง Neon PostgreSQL ("Student" & "StudentEnrollment")
    if (isSupabaseConfigured) {
      try {
        const dbAcademicStatus =
          input.lifecycleStatus === 'GRADUATED'
            ? 'GRADUATED'
            : input.lifecycleStatus === 'STUDYING' || input.lifecycleStatus === 'TRANSFERRED_IN'
              ? 'STUDYING'
              : input.lifecycleStatus;

        await supabase
          .from('students')
          .update({
            academic_status: dbAcademicStatus,
            ...(input.graduatedAcademicYear
              ? { graduated_academic_year: input.graduatedAcademicYear }
              : {}),
          })
          .eq('code', cleanCode);

        // หากย้ายออก ลาออก หรือจำหน่ายออก ให้ปรับสถานะใน StudentEnrollment เพื่อไม่ให้นับเป็นนักเรียนปัจจุบัน
        if (
          input.lifecycleStatus === 'TRANSFERRED_OUT' ||
          input.lifecycleStatus === 'DROPPED_OUT' ||
          input.lifecycleStatus === 'DISMISSED'
        ) {
          const { data: stuRows } = await supabase
            .from('Student')
            .select('id')
            .eq('studentCode', cleanCode)
            .limit(1);
          const realStuId = stuRows?.[0]?.id;
          if (realStuId) {
            await supabase
              .from('StudentEnrollment')
              .update({
                status: 'TRANSFERRED',
                updatedAt: nowIso,
              })
              .eq('studentId', realStuId)
              .eq('status', 'ENROLLED');
          }
        } else if (input.lifecycleStatus === 'STUDYING' && input.reasonCode === 'REINSTATED_RETURN') {
          const { data: stuRows } = await supabase
            .from('Student')
            .select('id')
            .eq('studentCode', cleanCode)
            .limit(1);
          const realStuId = stuRows?.[0]?.id;
          if (realStuId) {
            await supabase
              .from('StudentEnrollment')
              .update({
                status: 'ENROLLED',
                updatedAt: nowIso,
              })
              .eq('studentId', realStuId);
          }
        }
      } catch (err) {
        console.warn('[StudentLifecycleService] DB update non-fatal error:', err);
      }
    }

    if (effectiveClassroom) {
      masterDataService.invalidateRoom(effectiveClassroom);
    }
    if (input.targetClassroom) {
      masterDataService.invalidateRoom(input.targetClassroom);
    }

    // 4. บันทึก Audit Log อย่างละเอียด
    await activityAuditLogService.recordLog({
      actionType: 'UPDATE',
      entityType: 'นักเรียน',
      title: `อัปเดตสถานะทะเบียนนักเรียน: ${statusCfg.label} (${input.studentName})`,
      summary: `รหัส ${cleanCode} (${effectiveClassroom}) ➔ สถานะ "${statusCfg.label}" (${reasonLabel})${
        input.documentOrderNo ? ` • เลขที่คำสั่ง/เอกสาร: ${input.documentOrderNo}` : ''
      }`,
      itemCount: 1,
      actor,
      targetId: cleanCode,
      targetScope: effectiveClassroom,
      changes: [
        {
          field: 'lifecycleStatus',
          label: 'สถานะทะเบียนนักเรียน',
          from: previousMeta ? LIFECYCLE_STATUS_CONFIG[previousMeta.lifecycleStatus]?.label : 'กำลังศึกษา',
          to: statusCfg.label,
          studentName: input.studentName,
          studentCode: cleanCode,
        },
      ],
    });

    return meta;
  }

  /**
   * เปิดหรือระงับสิทธิ์บัญชีเข้าใช้งานของนักเรียนรายบุคคล
   */
  async setStudentAccountAccess(
    studentCode: string,
    studentName: string,
    classroom: string,
    nextAccess: StudentAccountAccessStatus,
    actorName = 'ผู้ดูแลระบบ'
  ): Promise<StudentLifecycleMeta> {
    const cleanCode = String(studentCode || '').trim().replace(/^stu-/, '');
    const map = this.readRegistryMap();
    const existing = map[cleanCode];
    const nowIso = new Date().toISOString();

    const updated: StudentLifecycleMeta = existing
      ? {
          ...existing,
          accountStatus: nextAccess,
          updatedBy: actorName,
          updatedAt: nowIso,
        }
      : {
          studentCode: cleanCode,
          studentId: `stu-${cleanCode}`,
          studentName,
          classroom: formatClassroomLabel(classroom),
          lifecycleStatus: 'STUDYING',
          accountStatus: nextAccess,
          reasonCode: 'NORMAL_ENROLLED',
          reasonLabel: nextAccess === 'ACTIVE' ? 'เปิดสิทธิ์การใช้งานปกติ' : 'ระงับสิทธิ์บัญชีโดยผู้ดูแลระบบ',
          effectiveDate: new Date().toLocaleDateString('th-TH'),
          updatedBy: actorName,
          updatedAt: nowIso,
        };

    map[cleanCode] = updated;
    this.writeRegistryMap(map);

    await activityAuditLogService.recordLog({
      actionType: 'UPDATE',
      entityType: 'นักเรียน',
      title: `${nextAccess === 'ACTIVE' ? 'ปลดล็อกบัญชีนักเรียน' : 'ระงับสิทธิ์บัญชีนักเรียน'}: ${studentName}`,
      summary: `รหัส ${cleanCode} (${formatClassroomLabel(classroom)}) ➔ สถานะบัญชี: ${nextAccess}`,
      itemCount: 1,
      actor: actorName,
      targetId: cleanCode,
      targetScope: formatClassroomLabel(classroom),
    });

    return updated;
  }

  /**
   * รีเซ็ตรหัสผ่านนักเรียนกลับเป็นค่าเริ่มต้น (รหัสประจำตัวนักเรียน 5 หลัก)
   */
  async resetStudentPasswordToDefault(
    studentCode: string,
    studentName: string,
    classroom: string,
    actorName = 'ผู้ดูแลระบบ'
  ): Promise<boolean> {
    const cleanCode = String(studentCode || '').trim().replace(/^stu-/, '');
    const ok = studentService.resetStudentPassword(cleanCode);
    await activityAuditLogService.recordLog({
      actionType: 'UPDATE',
      entityType: 'นักเรียน',
      title: `รีเซ็ตรหัสผ่านนักเรียน: ${studentName} (${cleanCode})`,
      summary: `รีเซ็ตรหัสผ่านของ ${studentName} (${formatClassroomLabel(classroom)}) กลับเป็นรหัสประจำตัว 5 หลัก (${cleanCode})`,
      itemCount: 1,
      actor: actorName,
      targetId: cleanCode,
      targetScope: formatClassroomLabel(classroom),
    });
    return ok;
  }
}

export const studentLifecycleService = new StudentLifecycleService();
