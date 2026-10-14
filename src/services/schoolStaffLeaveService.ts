// src/services/schoolStaffLeaveService.ts
// บริการจัดการข้อมูลการลาของครูและบุคลากร (Staff Leave Management & Substitute Teaching Service)
// รองรับระบบบริหารจัดการโรงเรียนส่วนกลาง และ Executive Leave Dashboard

import { cleanSlateService } from './cleanSlateService.ts';

export type StaffLeaveType =
  | 'SICK' // ลาป่วย
  | 'PERSONAL' // ลากิจส่วนตัว
  | 'OFFICIAL' // ไปราชการ / อบรม
  | 'VACATION' // ลาพักผ่อน
  | 'MATERNITY' // ลาคลอดบุตร
  | 'OTHER'; // อื่นๆ

export type StaffLeaveStatus =
  | 'PENDING' // รอผู้อำนวยการ/หัวหน้างานอนุมัติ (Visual Priority สูง)
  | 'APPROVED' // อนุมัติแล้ว
  | 'REJECTED'; // ไม่อนุมัติ / ตีกลับ

export interface SubstituteAssignment {
  periodNo: number; // คาบเรียนที่
  classroom: string; // เช่น ม.3/1
  courseCode: string; // เช่น ศ23101
  courseName: string; // เช่น ทัศนศิลป์
  substituteTeacherName: string; // ครูที่สอนแทน
  substituteTeacherId: string;
  isConfirmed: boolean;
}

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  position: string; // เช่น ครู คศ.2, ครูผู้ช่วย
  department: string; // กลุ่มสาระฯ เช่น ศิลปะ, วิทยาศาสตร์
  avatarUrl?: string;
  leaveType: StaffLeaveType;
  leaveTypeLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  hasMedicalCertificate: boolean;
  contactPhone: string;
  status: StaffLeaveStatus;
  substitutes: SubstituteAssignment[];
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface StaffLeaveQuotaStats {
  staffId: string;
  staffName: string;
  position: string;
  department: string;
  sickLeaveUsed: number;
  sickLeaveTotal: number;
  personalLeaveUsed: number;
  personalLeaveTotal: number;
  vacationLeaveUsed: number;
  vacationLeaveTotal: number;
  officialDutyCount: number;
}

const STORAGE_KEY = 'kps_staff_leave_requests_v1';
export const STAFF_LEAVE_EVENT = 'kps-staff-leave-updated';

const INITIAL_STAFF_LEAVES: StaffLeaveRequest[] = [
  {
    id: 'leave-101',
    staffId: 'teacher-somchai',
    staffName: 'นายสมชาย รักเรียน',
    position: 'ครู คศ.2',
    department: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    leaveType: 'SICK',
    leaveTypeLabel: 'ลาป่วย',
    startDate: '2026-10-10',
    endDate: '2026-10-11',
    daysCount: 2,
    reason: 'มีไข้หวัดใหญ่ แพทย์สั่งพักฟื้น 2 วัน มีใบรับรองแพทย์จาก รพ.กุดจับ',
    hasMedicalCertificate: true,
    contactPhone: '081-234-5678',
    status: 'PENDING',
    createdAt: '10 ต.ค. 2569 07:30 น.',
    substitutes: [
      {
        periodNo: 2,
        classroom: 'ม.2/1',
        courseCode: 'ว22101',
        courseName: 'วิทยาศาสตร์ 3',
        substituteTeacherName: 'นางสาววิไลลักษณ์ กุลพงษ์',
        substituteTeacherId: 'teacher-wilai',
        isConfirmed: true,
      },
      {
        periodNo: 4,
        classroom: 'ม.2/2',
        courseCode: 'ว22101',
        courseName: 'วิทยาศาสตร์ 3',
        substituteTeacherName: 'นายธวัชชัย บำรุงจิต',
        substituteTeacherId: 'teacher-thawat',
        isConfirmed: true,
      },
    ],
  },
  {
    id: 'leave-102',
    staffId: 'teacher-kamonwan',
    staffName: 'นางสาวกมลวรรณ ศรีสุข',
    position: 'ครู คศ.1',
    department: 'กลุ่มสาระฯ ภาษาต่างประเทศ',
    leaveType: 'OFFICIAL',
    leaveTypeLabel: 'ไปราชการ / พัฒนาวิชาชีพ',
    startDate: '2026-10-10',
    endDate: '2026-10-10',
    daysCount: 1,
    reason: 'นำนักเรียนเข้าร่วมแข่งขันทักษะภาษาอังกฤษระดับเขตพื้นที่การศึกษา สพม.อุดรธานี',
    hasMedicalCertificate: false,
    contactPhone: '089-876-5432',
    status: 'PENDING',
    createdAt: '09 ต.ค. 2569 16:45 น.',
    substitutes: [
      {
        periodNo: 1,
        classroom: 'ม.3/1',
        courseCode: 'อ23101',
        courseName: 'ภาษาอังกฤษพื้นฐาน 5',
        substituteTeacherName: 'นางกาญจนา นพรัตน์',
        substituteTeacherId: 'teacher-kanchana',
        isConfirmed: true,
      },
    ],
  },
  {
    id: 'leave-103',
    staffId: 'teacher-narong',
    staffName: 'นายณรงค์ศักดิ์ สุวรรณฉวี',
    position: 'ครูชำนาญการพิเศษ (คศ.3)',
    department: 'กลุ่มสาระฯ คณิตศาสตร์',
    leaveType: 'PERSONAL',
    leaveTypeLabel: 'ลากิจส่วนตัว',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    daysCount: 1,
    reason: 'พาบิดาไปตรวจสุขภาพตามนัดแพทย์เฉพาะทางที่โรงพยาบาลศูนย์อุดรธานี',
    hasMedicalCertificate: false,
    contactPhone: '085-555-4321',
    status: 'PENDING',
    createdAt: '09 ต.ค. 2569 14:10 น.',
    substitutes: [
      {
        periodNo: 3,
        classroom: 'ม.1/1',
        courseCode: 'ค21101',
        courseName: 'คณิตศาสตร์พื้นฐาน 1',
        substituteTeacherName: 'นางสาวอรทัย บูรณะ',
        substituteTeacherId: 'teacher-orathai',
        isConfirmed: true,
      },
    ],
  },
  {
    id: 'leave-104',
    staffId: 'teacher-phasphum',
    staffName: 'นายภาสภูมิ เรืองปราชญ์',
    position: 'ครู คศ.2',
    department: 'กลุ่มสาระฯ ศิลปะ',
    leaveType: 'OFFICIAL',
    leaveTypeLabel: 'ไปราชการ / อบรม',
    startDate: '2026-10-08',
    endDate: '2026-10-09',
    daysCount: 2,
    reason: 'อบรมเชิงปฏิบัติการการใช้เทคโนโลยี AI ในการจัดการเรียนรู้ร่วมสมัย',
    hasMedicalCertificate: false,
    contactPhone: '084-333-2211',
    status: 'APPROVED',
    approvedBy: 'ผู้อำนวยการโรงเรียน',
    approvedAt: '07 ต.ค. 2569 11:20 น.',
    createdAt: '06 ต.ค. 2569 09:00 น.',
    substitutes: [],
  },
  {
    id: 'leave-105',
    staffId: 'teacher-chutima',
    staffName: 'นางสาวชุติมา ดอนแก้ว',
    position: 'ครูผู้ช่วย',
    department: 'กลุ่มสาระฯ สังคมศึกษา ศาสนาและวัฒนธรรม',
    leaveType: 'VACATION',
    leaveTypeLabel: 'ลาพักผ่อน',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    daysCount: 2,
    reason: 'ลากิจพักผ่อนช่วงปิดภาคเรียนย่อยและธุระครอบครัว',
    hasMedicalCertificate: false,
    contactPhone: '086-123-9988',
    status: 'APPROVED',
    approvedBy: 'ผู้อำนวยการโรงเรียน',
    approvedAt: '04 ต.ค. 2569 15:30 น.',
    createdAt: '03 ต.ค. 2569 10:15 น.',
    substitutes: [],
  },
];

export const schoolStaffLeaveService = {
  getAllLeaves(): StaffLeaveRequest[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (!cleanSlateService.isCleanSlateActive()) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STAFF_LEAVES));
          return INITIAL_STAFF_LEAVES;
        }
        return [];
      }
      return JSON.parse(raw) as StaffLeaveRequest[];
    } catch {
      return [];
    }
  },

  getPendingLeaves(): StaffLeaveRequest[] {
    return this.getAllLeaves().filter((l) => l.status === 'PENDING');
  },

  getTodayOnLeaveStaff(): StaffLeaveRequest[] {
    const today = '2026-10-10'; // วันที่ระบบปัจจุบัน
    return this.getAllLeaves().filter(
      (l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today
    );
  },

  updateLeaveStatus(
    id: string,
    status: StaffLeaveStatus,
    approvedBy = 'ผู้อำนวยการโรงเรียน',
    rejectionReason?: string
  ): StaffLeaveRequest[] {
    const leaves = this.getAllLeaves();
    const updated = leaves.map((item) => {
      if (item.id === id) {
        const now = `${new Date().toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
        return {
          ...item,
          status,
          approvedBy: status === 'APPROVED' ? approvedBy : undefined,
          approvedAt: status === 'APPROVED' ? now : undefined,
          rejectionReason: status === 'REJECTED' ? rejectionReason || 'ข้อมูลไม่ครบถ้วน' : undefined,
        };
      }
      return item;
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(STAFF_LEAVE_EVENT));
    }
    return updated;
  },

  getDepartmentLeaveBreakdown(): Array<{ department: string; count: number; percentage: number }> {
    const leaves = this.getAllLeaves();
    const total = leaves.length || 1;
    const map = new Map<string, number>();

    leaves.forEach((l) => {
      const current = map.get(l.department) || 0;
      map.set(l.department, current + 1);
    });

    return Array.from(map.entries()).map(([department, count]) => ({
      department: department.replace('กลุ่มสาระฯ ', ''),
      count,
      percentage: Math.round((count / total) * 100),
    }));
  },

  getLeaveTypeSummary(): Array<{ type: StaffLeaveType; label: string; count: number; color: string }> {
    const leaves = this.getAllLeaves();
    return [
      {
        type: 'SICK',
        label: 'ลาป่วย',
        count: leaves.filter((l) => l.leaveType === 'SICK').length,
        color: '#EF4444',
      },
      {
        type: 'PERSONAL',
        label: 'ลากิจส่วนตัว',
        count: leaves.filter((l) => l.leaveType === 'PERSONAL').length,
        color: '#F59E0B',
      },
      {
        type: 'OFFICIAL',
        label: 'ไปราชการ/อบรม',
        count: leaves.filter((l) => l.leaveType === 'OFFICIAL').length,
        color: '#3B82F6',
      },
      {
        type: 'VACATION',
        label: 'ลาพักผ่อน',
        count: leaves.filter((l) => l.leaveType === 'VACATION').length,
        color: '#10B981',
      },
    ];
  },

  resetToDefault(): StaffLeaveRequest[] {
    if (typeof window !== 'undefined') {
      const resetItems = cleanSlateService.isCleanSlateActive() ? [] : INITIAL_STAFF_LEAVES;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resetItems));
      window.dispatchEvent(new Event(STAFF_LEAVE_EVENT));
      return resetItems;
    }
    return [];
  },
};
