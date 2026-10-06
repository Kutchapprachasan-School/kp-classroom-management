// src/services/schoolLeaveSettingsService.ts
// บริการจัดการการตั้งค่าระบบการลา & โควตาวันลา (School Leave Management Settings Service)
// แยกการตั้งค่าระบบการลาออกจากข้อมูลพื้นฐานโรงเรียน เพื่อความยืดหยุ่นและปรับแต่งได้อย่างอิสระตามใจ

export interface LeaveTypeQuota {
  id: string;
  name: string;
  quotaDays: number;
  description: string;
  requiresMedicalCertificate: boolean;
  medicalCertMinDays: number; // ลาเกินกี่วันต้องแนบใบรับรองแพทย์
  advanceNoticeDays: number; // ต้องยื่นล่วงหน้าอย่างน้อยกี่วัน
  color: string;
}

export interface SchoolLeaveSettings {
  // 1. นโยบายและเกณฑ์ทั่วไป
  academicYear: string;
  minAttendancePercent: number; // เกณฑ์เวลาเรียนขั้นต่ำ (เช่น 80%) ป้องกันติด มส.
  enableOnlineStudentSubmission: boolean; // อนุญาตให้นักเรียนยื่นลาออนไลน์
  enableGuardianSmsNotification: boolean; // แจ้งเตือนผู้ปกครองผ่าน SMS/Line เมื่ออนุมัติ
  enableAutoRollCallSync: boolean; // ซิงค์สถานะลาเข้าคาบเรียนอัตโนมัติ

  // 2. ลำดับขั้นการอนุมัติ (Approval Workflow)
  approvalWorkflow: 'HOMEROOM_ONLY' | 'HOMEROOM_THEN_AFFAIRS' | 'AFFAIRS_ONLY';

  // 3. โควตาวันลาแต่ละประเภท
  quotas: LeaveTypeQuota[];

  // 4. บันทึกประวัติการปรับปรุง
  lastUpdated: string;
  updatedBy: string;
}

const STORAGE_KEY = 'kps_school_leave_settings_v1';
export const SCHOOL_LEAVE_SETTINGS_EVENT = 'kps-school-leave-settings-updated';

export const DEFAULT_LEAVE_SETTINGS: SchoolLeaveSettings = {
  academicYear: '2569 (ภาคเรียนที่ 1)',
  minAttendancePercent: 80,
  enableOnlineStudentSubmission: true,
  enableGuardianSmsNotification: true,
  enableAutoRollCallSync: true,
  approvalWorkflow: 'HOMEROOM_THEN_AFFAIRS',
  quotas: [
    {
      id: 'sick',
      name: 'ลาป่วย',
      quotaDays: 15,
      description: 'กรณีเจ็บป่วย พักรักษาตัว หรือพบแพทย์',
      requiresMedicalCertificate: true,
      medicalCertMinDays: 3,
      advanceNoticeDays: 0,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'personal',
      name: 'ลากิจส่วนตัว',
      quotaDays: 10,
      description: 'กรณีมีธุระจำเป็นของครอบครัวหรือส่วนตัว',
      requiresMedicalCertificate: false,
      medicalCertMinDays: 0,
      advanceNoticeDays: 1,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'official',
      name: 'ลากิจราชการ / กิจกรรมโรงเรียน',
      quotaDays: 12,
      description: 'ตัวแทนแข่งขันวิชาการ กีฬา หรือกิจกรรมของสถานศึกษา',
      requiresMedicalCertificate: false,
      medicalCertMinDays: 0,
      advanceNoticeDays: 3,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'monkhood',
      name: 'ลาบรรพชา / ศาสนกิจ',
      quotaDays: 7,
      description: 'บรรพชาสามเณรภาคฤดูร้อน หรือพิธีกรรมทางศาสนา',
      requiresMedicalCertificate: false,
      medicalCertMinDays: 0,
      advanceNoticeDays: 7,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ],
  lastUpdated: '2 ต.ค. 2569 • ค่าเริ่มต้นของโรงเรียน',
  updatedBy: 'งานกิจการนักเรียน & แอดมินฝ่ายวิชาการ',
};

export const schoolLeaveSettingsService = {
  getSettings(): SchoolLeaveSettings {
    if (typeof window === 'undefined') return DEFAULT_LEAVE_SETTINGS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_LEAVE_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<SchoolLeaveSettings>;
      return {
        ...DEFAULT_LEAVE_SETTINGS,
        ...parsed,
        quotas: parsed.quotas && parsed.quotas.length > 0 ? parsed.quotas : DEFAULT_LEAVE_SETTINGS.quotas,
      };
    } catch {
      return DEFAULT_LEAVE_SETTINGS;
    }
  },

  saveSettings(next: Partial<SchoolLeaveSettings>, updatedBy = 'แอดมินฝ่ายวิชาการ'): SchoolLeaveSettings {
    const current = this.getSettings();
    const updated: SchoolLeaveSettings = {
      ...current,
      ...next,
      lastUpdated: `${new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} • ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`,
      updatedBy,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(SCHOOL_LEAVE_SETTINGS_EVENT));
    }
    return updated;
  },

  updateQuota(quotaId: string, nextQuotaDays: number, requiresCert?: boolean, certMinDays?: number): SchoolLeaveSettings {
    const current = this.getSettings();
    const nextQuotas = current.quotas.map((q) => {
      if (q.id === quotaId) {
        return {
          ...q,
          quotaDays: Math.max(0, nextQuotaDays),
          requiresMedicalCertificate: requiresCert !== undefined ? requiresCert : q.requiresMedicalCertificate,
          medicalCertMinDays: certMinDays !== undefined ? Math.max(1, certMinDays) : q.medicalCertMinDays,
        };
      }
      return q;
    });

    return this.saveSettings({ quotas: nextQuotas });
  },

  addQuota(newQuota: Omit<LeaveTypeQuota, 'id'>): SchoolLeaveSettings {
    const current = this.getSettings();
    const id = `custom_${Date.now()}`;
    const quotaItem: LeaveTypeQuota = {
      ...newQuota,
      id,
    };
    return this.saveSettings({ quotas: [...current.quotas, quotaItem] });
  },

  deleteQuota(quotaId: string): SchoolLeaveSettings {
    const current = this.getSettings();
    const filtered = current.quotas.filter((q) => q.id !== quotaId);
    return this.saveSettings({ quotas: filtered });
  },

  resetToDefault(): SchoolLeaveSettings {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event(SCHOOL_LEAVE_SETTINGS_EVENT));
    }
    return DEFAULT_LEAVE_SETTINGS;
  },
};

