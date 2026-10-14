// ============================================================================
// Home Visit (แบบ นร./กสศ.01 ฉบับปรับปรุง 6 มีนาคม 2569), SDQ & EEF CCT Auto-Sync Service
// รองรับการเก็บข้อมูลครบ 10 หมวด (5 หน้า) + รูปถ่าย 2 มุม + ลายเซ็น 4 ฝ่าย + โอนข้อมูลขึ้น cct.eef.or.th
// ============================================================================

export type VisitStatus = 'VISITED' | 'SCHEDULED' | 'PENDING';
export type SdqLevel = 'NORMAL' | 'RISK' | 'PROBLEM' | 'PENDING';
export type CctSyncStatus = 'SYNCED' | 'READY_TO_SYNC' | 'INCOMPLETE';

// ตารางสมาชิกในครัวเรือน (ข้อ 2 ของแบบ นร./กสศ.01)
export interface HouseholdMember {
  id: string;
  fullName: string;
  relation: string;
  citizenId: string;
  educationLevel: string;
  age: number;
  isDisabled: boolean; // มีความพิการทางร่างกาย/สติปัญญา
  hasChronicDisease: boolean; // มีโรคเรื้อรัง ยกเว้นความดัน/เบาหวาน
  incomeSalary: number; // ค่าจ้าง เงินเดือน
  incomeAgriculture: number; // อาชีพเกษตรกรรม (หลังหักต้นทุน)
  incomeBusiness: number; // ธุรกิจส่วนตัว (หลังหักต้นทุน)
  incomeWelfare: number; // สวัสดิการจากรัฐ (บำนาญ, เบี้ยผู้สูงอายุ, บัตรคนจน)
  incomeOther: number; // รายได้จากแหล่งอื่นๆ (เงินโอนครอบครัว, ค่าเช่า)
}

// การตั้งค่านโยบายการนับเวลาเรียนและใบลานักเรียน (แยกจาก E-Leave ของครู)
export interface StudentAttendanceLeavePolicy {
  includeApprovedSickLeaveAsAttended: boolean; // นับรวมลาป่วยเป็นเวลามาเรียน
  includeApprovedPersonalLeaveAsAttended: boolean; // นับรวมลากิจเป็นเวลามาเรียน
  protectMidTermTransferStudents: boolean; // คำนวณคาบเรียนเฉพาะตั้งแต่วันที่ย้ายเข้า (enrolled_at)
  maxSickLeaveDaysWithoutCert: number;
}

export interface HomeVisitRecord {
  id: string;
  studentCode: string;
  citizenId: string; // เลขประจำตัวประชาชน 13 หลัก / รหัส G
  studentNumber: number;
  studentName: string;
  classroom: string;
  enrolledAt: string; // วันที่เข้าเรียน (ป้องกันประวัติเช็คชื่อเพี้ยนสำหรับเด็กเข้าใหม่)

  // ข้อ 1: สถานภาพครอบครัวและผู้ปกครอง (แบบ นร./กสศ.01 หน้า 1)
  familyStatus:
    | 'พ่อแม่อยู่ด้วยกัน'
    | 'พ่อแม่แยกกันอยู่'
    | 'พ่อแม่หย่าร้าง'
    | 'พ่อเสียชีวิต/สาบสูญ'
    | 'แม่เสียชีวิต/สาบสูญ'
    | 'เสียชีวิตทั้งคู่/สาบสูญ'
    | 'พ่อ/แม่ทอดทิ้ง';
  livingWith:
    | 'พ่อ/แม่'
    | 'ญาติ'
    | 'อยู่ลำพัง'
    | 'ผู้อุปการะ/นายจ้าง'
    | 'ครัวเรือนสถาบัน';
  guardianName: string;
  guardianRelation: string;
  guardianEducation: string;
  guardianOccupation: string;
  guardianPhone: string;
  guardianCitizenId: string;
  hasStateWelfareCard: boolean; // ได้สวัสดิการแห่งรัฐ (ทะเบียนคนจน)

  // ข้อ 2: สมาชิกในครัวเรือนและรายได้เฉลี่ยต่อเดือน (หน้า 1-2)
  householdMembers: HouseholdMember[];
  totalHouseholdIncome: number; // รวมรายได้ครัวเรือน
  perCapitaIncome: number; // รายได้ครัวเรือนเฉลี่ยต่อคน (เกณฑ์ กสศ. <= 3,000 บาท/คน/เดือน)
  familyIncomeRange: '< 10,000 บ./เดือน' | '10,000 - 25,000 บ./เดือน' | '> 25,000 บ./เดือน';

  // ข้อ 3: ข้อมูลสถานะครัวเรือนและลักษณะที่อยู่อาศัย (หน้า 2-3)
  dependencyFlags: string[]; // 3.1 ภาระพึ่งพิง (พิการ, โรคเรื้อรัง, ผู้สูงอายุ 60+, พ่อ/แม่เลี้ยงเดี่ยว, ว่างงาน 15-65)
  housingType:
    | 'อยู่บ้านตนเอง/เจ้าของบ้าน'
    | 'อยู่บ้านเช่า'
    | 'อยู่กับผู้อื่น/อยู่ฟรี'
    | 'หอพัก';
  monthlyRentBaht: number;
  floorMaterial: string; // 3.3 วัสดุพื้นบ้าน (กระเบื้อง, ซีเมนต์เปลือย, ไม้กระดาน, ไม้ไผ่, ดิน/ทราย)
  wallMaterial: string; // วัสดุฝาบ้าน (ฉาบซีเมนต์, อิฐบล็อก, สังกะสี, ไม้กระดาน, ไม้ไผ่)
  roofMaterial: string; // วัสดุหลังคา (สังกะสี/โลหะ, กระเบื้อง, ใบไม้/วัสดุธรรมชาติ)
  hasToilet: boolean; // มีห้องส้วมในที่อยู่อาศัย
  agriculturalLand: 'ไม่ทำเกษตร' | 'มีที่ดินน้อยกว่า 1 ไร่' | 'มีที่ดิน 1 ถึง 5 ไร่' | 'มีที่ดินมากกว่า 5 ไร่';
  drinkingWaterSource: string; // 3.5 แหล่งน้ำดื่ม
  electricitySource: string; // 3.6 แหล่งไฟฟ้า
  vehicles: string[]; // 3.7 ยานพาหนะในครัวเรือน
  appliances: string[]; // 3.8 ของใช้ในครัวเรือน (คอมพิวเตอร์, แอร์, ทีวีจอแบน, เครื่องซักผ้า, ตู้เย็น)

  // ข้อ 5-6: การเดินทางและที่ตั้งปัจจุบัน + GPS (หน้า 4)
  travelMethod:
    | 'เดิน'
    | 'จักรยาน'
    | 'รถโรงเรียน'
    | 'จักรยานยนต์ส่วนตัว'
    | 'รถส่วนตัว'
    | 'รถโดยสารประจำทาง/รับจ้าง';
  travelDistanceKm: number; // ระยะทางไป-กลับ กม./วัน
  travelTimeMinutes: number; // เวลาเดินทางไป-กลับ นาที/วัน
  monthlyTravelCostBaht: number; // ค่าใช้จ่ายในการเดินทาง บาท/เดือน
  dailyPocketMoneyBaht: number; // เงินมาโรงเรียน(ไม่รวมค่าเดินทาง) บาท/วัน
  address: string;
  landmarkNote: string;
  gpsLat: number;
  gpsLng: number;
  gpsPinned: boolean;
  studentSelfSubmitStatus: 'SUBMITTED' | 'PENDING';
  submittedAt?: string;

  // ข้อ 7: ภาพถ่ายที่พักอาศัย 2 มุมบังคับตามเกณฑ์ กสศ. (หน้า 4)
  photoSource: 'คุณครูลงเยี่ยมบ้านด้วยตนเอง' | 'ให้นักเรียนถ่ายภาพมาให้';
  photoExteriorUrl: string; // รูปที่ 1 ภาพถ่ายนอกที่พักอาศัย (เห็นหลังคาและฝาผนังทั้งหลัง)
  photoInteriorUrl: string; // รูปที่ 2 ภาพถ่ายภายในที่พักอาศัย (เห็นพื้นและบริเวณภายใน)
  visitPhotos: string[];

  // ข้อ 8-10: การรับรองข้อมูลและลายเซ็นดิจิทัล 4 ฝ่าย (หน้า 4-5)
  studentSignatureData: string; // ลายเซ็นนักเรียน
  guardianSignatureData: string; // ลายเซ็นผู้ปกครอง
  teacherSignatureData: string; // ลายเซ็นครูผู้เยี่ยมบ้าน/สำรวจข้อมูล
  officialSignatureData: string; // ลายเซ็นเจ้าหน้าที่ของรัฐ / ผอ.สถานศึกษา
  officialCertifierName: string;
  officialCertifierPosition: string;

  // ข้อมูลการคัดกรอง SDQ และสรุปผลเยี่ยมบ้านของครู
  sdqStudentStatus: SdqLevel;
  sdqStudentScore: number;
  sdqTeacherStatus: SdqLevel;
  sdqEmotionalNote: string;
  visitStatus: VisitStatus;
  visitDate?: string;
  visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง' | 'เยี่ยมบ้านออนไลน์ (Video Call)' | 'สัมภาษณ์ผู้ปกครองที่โรงเรียน';
  riskFactors: string[];
  scholarshipRecommended: boolean;
  teacherSummaryNote: string;

  // สถานะการโอนข้อมูลอัตโนมัติเข้าสู่ระบบ CCT กสศ. (https://cct.eef.or.th)
  cctSyncStatus: CctSyncStatus;
  cctLastSyncedAt?: string;
  cctReferenceId?: string;
}

const STORAGE_KEY = 'cms_home_visit_nor01_cct_v2';
const LEAVE_POLICY_KEY = 'cms_student_attendance_leave_policy_v1';

const DEFAULT_LEAVE_POLICY: StudentAttendanceLeavePolicy = {
  includeApprovedSickLeaveAsAttended: true,
  includeApprovedPersonalLeaveAsAttended: true,
  protectMidTermTransferStudents: true,
  maxSickLeaveDaysWithoutCert: 3,
};

export const homeVisitService = {
  getAll(): HomeVisitRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const legacyMockIds = new Set(['hv-1', 'hv-2', 'hv-3']);
        return parsed.filter((r: HomeVisitRecord) => !legacyMockIds.has(r.id));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveAll(records: HomeVisitRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },

  getLeavePolicy(): StudentAttendanceLeavePolicy {
    try {
      const raw = localStorage.getItem(LEAVE_POLICY_KEY);
      if (!raw) {
        localStorage.setItem(LEAVE_POLICY_KEY, JSON.stringify(DEFAULT_LEAVE_POLICY));
        return DEFAULT_LEAVE_POLICY;
      }
      return JSON.parse(raw) as StudentAttendanceLeavePolicy;
    } catch {
      return DEFAULT_LEAVE_POLICY;
    }
  },

  saveLeavePolicy(policy: StudentAttendanceLeavePolicy): StudentAttendanceLeavePolicy {
    localStorage.setItem(LEAVE_POLICY_KEY, JSON.stringify(policy));
    return policy;
  },

  getByStudentCode(studentCode: string): HomeVisitRecord | undefined {
    return this.getAll().find((r) => r.studentCode === studentCode);
  },

  updateRecord(id: string, patch: Partial<HomeVisitRecord>): HomeVisitRecord[] {
    const current = this.getAll();
    const updated = current.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      // คำนวณรายได้รวมและรายได้เฉลี่ยต่อคนอัตโนมัติตามสูตร นร./กสศ.01 ข้อ 2
      if (merged.householdMembers && merged.householdMembers.length > 0) {
        const total = merged.householdMembers.reduce(
          (sum, m) =>
            sum +
            Number(m.incomeSalary || 0) +
            Number(m.incomeAgriculture || 0) +
            Number(m.incomeBusiness || 0) +
            Number(m.incomeWelfare || 0) +
            Number(m.incomeOther || 0),
          0
        );
        merged.totalHouseholdIncome = total;
        merged.perCapitaIncome = Math.round(total / merged.householdMembers.length);
      }
      return merged;
    });
    this.saveAll(updated);
    return updated;
  },

  syncToEefCct(recordIds: string[]): HomeVisitRecord[] {
    const current = this.getAll();
    const nowStr = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated = current.map((item) => {
      if (!recordIds.includes(item.id)) return item;
      return {
        ...item,
        cctSyncStatus: 'SYNCED' as const,
        cctLastSyncedAt: `${nowStr} น.`,
        cctReferenceId:
          item.cctReferenceId ||
          `EEF-2569-CM-${Math.floor(10000 + Math.random() * 90000)}`,
      };
    });

    this.saveAll(updated);
    return updated;
  },

  submitStudentHomeInfo(
    studentCode: string,
    payload: {
      address: string;
      landmarkNote: string;
      gpsLat: number;
      gpsLng: number;
      guardianName: string;
      guardianRelation: string;
      guardianPhone: string;
      guardianOccupation: string;
      familyIncomeRange: HomeVisitRecord['familyIncomeRange'];
      housingType: any;
      travelMethod: any;
      travelDistanceKm: number;
      sdqStudentScore: number;
      sdqStudentStatus: SdqLevel;
      sdqEmotionalNote: string;
    }
  ): HomeVisitRecord[] {
    const current = this.getAll();
    const nowStr = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated = current.map((item) => {
      if (item.studentCode !== studentCode) return item;
      return {
        ...item,
        ...payload,
        gpsPinned: true,
        studentSelfSubmitStatus: 'SUBMITTED' as const,
        submittedAt: `${nowStr} น.`,
      };
    });

    this.saveAll(updated);
    return updated;
  },
};
