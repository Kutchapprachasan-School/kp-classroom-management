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

const INITIAL_RECORDS: HomeVisitRecord[] = [
  {
    id: 'hv-1',
    studentCode: '45102',
    citizenId: '1-5099-02145-88-1',
    studentNumber: 1,
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    familyStatus: 'พ่อแม่แยกกันอยู่',
    livingWith: 'พ่อ/แม่',
    guardianName: 'นางสมพร คำฝั้น',
    guardianRelation: 'มารดา',
    guardianEducation: 'ประถมศึกษาปีที่ 6',
    guardianOccupation: 'รับจ้างทั่วไป / ค้าขายรายวัน',
    guardianPhone: '081-452-9918',
    guardianCitizenId: '3-5001-00481-22-4',
    hasStateWelfareCard: true,
    householdMembers: [
      {
        id: 'm-1',
        fullName: 'นางสมพร คำฝั้น',
        relation: 'มารดา',
        citizenId: '3-5001-00481-22-4',
        educationLevel: 'ป.6',
        age: 42,
        isDisabled: false,
        hasChronicDisease: false,
        incomeSalary: 3500,
        incomeAgriculture: 0,
        incomeBusiness: 1200,
        incomeWelfare: 300,
        incomeOther: 0,
      },
      {
        id: 'm-2',
        fullName: 'นางคำปัน คำฝั้น',
        relation: 'ยาย',
        citizenId: '3-5001-00112-09-1',
        educationLevel: 'ป.4',
        age: 68,
        isDisabled: false,
        hasChronicDisease: true,
        incomeSalary: 0,
        incomeAgriculture: 0,
        incomeBusiness: 0,
        incomeWelfare: 600,
        incomeOther: 0,
      },
      {
        id: 'm-3',
        fullName: 'ด.ช. ทัตธน คำฝั้น',
        relation: 'ตัวนักเรียน',
        citizenId: '1-5099-02145-88-1',
        educationLevel: 'ม.3',
        age: 14,
        isDisabled: false,
        hasChronicDisease: false,
        incomeSalary: 0,
        incomeAgriculture: 0,
        incomeBusiness: 0,
        incomeWelfare: 0,
        incomeOther: 0,
      },
    ],
    totalHouseholdIncome: 5600,
    perCapitaIncome: 1867, // 5600 / 3 = 1,867 บาท/คน/เดือน (ผ่านเกณฑ์ยากจนพิเศษ กสศ. <= 3,000 บาท)
    familyIncomeRange: '< 10,000 บ./เดือน',
    dependencyFlags: [
      'เป็นพ่อ/แม่เลี้ยงเดี่ยว',
      'ผู้สูงอายุตั้งแต่ 60 ปีขึ้นไป',
      'มีโรคเรื้อรัง ยกเว้น ความดัน/เบาหวาน',
    ],
    housingType: 'อยู่บ้านเช่า',
    monthlyRentBaht: 1500,
    floorMaterial: 'ไม้กระดาน',
    wallMaterial: 'สังกะสี',
    roofMaterial: 'โลหะ (เช่น สังกะสี/เหล็ก/อะลูมิเนียม)',
    hasToilet: true,
    agriculturalLand: 'ไม่ทำเกษตร',
    drinkingWaterSource: 'น้ำดื่มบรรจุขวด/ตู้หยอดน้ำ',
    electricitySource: 'ไฟบ้านหรือมิเตอร์',
    vehicles: ['รถมอเตอร์ไซค์/เรือประมงพื้นบ้าน (ขนาดเล็ก)'],
    appliances: ['ตู้เย็น'],
    travelMethod: 'รถโดยสารประจำทาง/รับจ้าง',
    travelDistanceKm: 11.5,
    travelTimeMinutes: 45,
    monthlyTravelCostBaht: 600,
    dailyPocketMoneyBaht: 40,
    address: '142/8 หมู่ 4 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
    landmarkNote: 'ซอยข้างวัดป่าแดง บ้านรั้วไม้สีน้ำตาล หลังที่ 3 ซ้ายมือ',
    gpsLat: 18.7883,
    gpsLng: 98.9542,
    gpsPinned: true,
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '10 ก.ย. 2569 19:20 น.',
    photoSource: 'คุณครูลงเยี่ยมบ้านด้วยตนเอง',
    photoExteriorUrl:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=60',
    photoInteriorUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60',
    visitPhotos: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=60',
    ],
    studentSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: ด.ช. ทัตธน คำฝั้น',
    guardianSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นางสมพร คำฝั้น (มารดา)',
    teacherSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายภาสภูมิ เรืองปราชญ์ (ครูผู้เยี่ยมบ้าน)',
    officialSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายสมศักดิ์ เกียรติเจริญ (ผอ.สถานศึกษา)',
    officialCertifierName: 'นายกำพล ยศยิ่ง (กำนันตำบลสุเทพ)',
    officialCertifierPosition: 'เจ้าหน้าที่ของรัฐ / กำนัน',
    sdqStudentStatus: 'RISK',
    sdqStudentScore: 16,
    sdqTeacherStatus: 'RISK',
    sdqEmotionalNote:
      'มีความกังวลเรื่องค่าใช้จ่ายทางบ้านและต้องช่วยแม่ขายของช่วงเย็น ทำให้ส่งงานช้าบางวิชา',
    visitStatus: 'VISITED',
    visitDate: '2026-09-12',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: ['รายได้ครอบครัวต่ำ', 'เดินทางไกล', 'ต้องทำงานช่วยครอบครัวหลังเลิกเรียน'],
    scholarshipRecommended: true,
    teacherSummaryNote:
      'ลงพื้นที่เยี่ยมบ้านตามแบบ นร.01 พบมารดาและยาย รายได้เฉลี่ยต่อคน 1,867 บ./เดือน เข้าเกณฑ์ทุนเสมอภาค กสศ. บันทึกรูปถ่ายนอกบ้าน/ในบ้านและลายเซ็นครบ 4 ฝ่ายแล้ว',
    cctSyncStatus: 'READY_TO_SYNC',
  },
  {
    id: 'hv-2',
    studentCode: '45105',
    citizenId: '1-5099-02149-11-3',
    studentNumber: 2,
    studentName: 'ด.ญ. กมลชนก เลิศวิไล',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    familyStatus: 'พ่อแม่อยู่ด้วยกัน',
    livingWith: 'พ่อ/แม่',
    guardianName: 'นายวิชัย เลิศวิไล',
    guardianRelation: 'บิดา',
    guardianEducation: 'ปริญญาตรี',
    guardianOccupation: 'ข้าราชการ',
    guardianPhone: '089-231-7740',
    guardianCitizenId: '3-5001-00891-44-2',
    hasStateWelfareCard: false,
    householdMembers: [
      {
        id: 'm-21',
        fullName: 'นายวิชัย เลิศวิไล',
        relation: 'บิดา',
        citizenId: '3-5001-00891-44-2',
        educationLevel: 'ปริญญาตรี',
        age: 45,
        isDisabled: false,
        hasChronicDisease: false,
        incomeSalary: 28000,
        incomeAgriculture: 0,
        incomeBusiness: 0,
        incomeWelfare: 0,
        incomeOther: 0,
      },
      {
        id: 'm-22',
        fullName: 'ด.ญ. กมลชนก เลิศวิไล',
        relation: 'ตัวนักเรียน',
        citizenId: '1-5099-02149-11-3',
        educationLevel: 'ม.3',
        age: 14,
        isDisabled: false,
        hasChronicDisease: false,
        incomeSalary: 0,
        incomeAgriculture: 0,
        incomeBusiness: 0,
        incomeWelfare: 0,
        incomeOther: 0,
      },
    ],
    totalHouseholdIncome: 28000,
    perCapitaIncome: 14000,
    familyIncomeRange: '> 25,000 บ./เดือน',
    dependencyFlags: [],
    housingType: 'อยู่บ้านตนเอง/เจ้าของบ้าน',
    monthlyRentBaht: 0,
    floorMaterial: 'กระเบื้อง/เซรามิค',
    wallMaterial: 'อิฐ/ก้อนปูน/อิฐบล็อก',
    roofMaterial: 'กระเบื้อง/เซรามิค',
    hasToilet: true,
    agriculturalLand: 'ไม่ทำเกษตร',
    drinkingWaterSource: 'น้ำดื่มบรรจุขวด/ตู้หยอดน้ำ',
    electricitySource: 'ไฟบ้านหรือมิเตอร์',
    vehicles: ['รถยนต์นั่งส่วนบุคคล (ไม่เกิน 15 ปี)'],
    appliances: ['คอมพิวเตอร์', 'แอร์', 'ทีวีจอแบน', 'เครื่องซักผ้า', 'ตู้เย็น'],
    travelMethod: 'รถส่วนตัว',
    travelDistanceKm: 4.2,
    travelTimeMinutes: 15,
    monthlyTravelCostBaht: 1200,
    dailyPocketMoneyBaht: 100,
    address: '88/19 หมู่บ้านสิริการ์เด้น ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300',
    landmarkNote: 'ซอย 3 บ้านเลขที่ 88/19 ประตูรั้วสีขาว',
    gpsLat: 18.8124,
    gpsLng: 98.9715,
    gpsPinned: true,
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '11 ก.ย. 2569 16:45 น.',
    photoSource: 'คุณครูลงเยี่ยมบ้านด้วยตนเอง',
    photoExteriorUrl:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop&q=60',
    photoInteriorUrl:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=60',
    visitPhotos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop&q=60',
    ],
    studentSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: ด.ญ. กมลชนก เลิศวิไล',
    guardianSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายวิชัย เลิศวิไล',
    teacherSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายภาสภูมิ เรืองปราชญ์',
    officialSignatureData: '-',
    officialCertifierName: '-',
    officialCertifierPosition: '-',
    sdqStudentStatus: 'NORMAL',
    sdqStudentScore: 7,
    sdqTeacherStatus: 'NORMAL',
    sdqEmotionalNote: 'อารมณ์แจ่มใส มีมนุษยสัมพันธ์ดีมาก ช่วยเพื่อนในห้องเรียน',
    visitStatus: 'VISITED',
    visitDate: '2026-09-14',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: [],
    scholarshipRecommended: false,
    teacherSummaryNote: 'ครอบครัวอบอุ่น ผู้ปกครองดูแลเอาใจใส่การเรียนอย่างใกล้ชิด',
    cctSyncStatus: 'SYNCED',
    cctLastSyncedAt: '15 ก.ย. 2569 10:30 น.',
    cctReferenceId: 'EEF-2569-CM-00412',
  },
  {
    id: 'hv-3',
    studentCode: '45109',
    citizenId: '1-5099-02152-07-8',
    studentNumber: 3,
    studentName: 'ด.ช. ณัฐวุฒิ สายทอง',
    classroom: 'ม.3/1',
    enrolledAt: '2026-07-01', // ย้ายเข้ากลางเทอม 1 ก.ค. 2569
    familyStatus: 'พ่อแม่หย่าร้าง',
    livingWith: 'ญาติ',
    guardianName: 'นางบัวลอย สายทอง',
    guardianRelation: 'ย่า',
    guardianEducation: 'ประถมศึกษาปีที่ 4',
    guardianOccupation: 'เกษตรกรรายย่อย',
    guardianPhone: '086-912-3304',
    guardianCitizenId: '3-5001-00219-88-0',
    hasStateWelfareCard: true,
    householdMembers: [
      {
        id: 'm-31',
        fullName: 'นางบัวลอย สายทอง',
        relation: 'ย่า',
        citizenId: '3-5001-00219-88-0',
        educationLevel: 'ป.4',
        age: 66,
        isDisabled: false,
        hasChronicDisease: true,
        incomeSalary: 0,
        incomeAgriculture: 2200,
        incomeBusiness: 0,
        incomeWelfare: 600,
        incomeOther: 1000,
      },
      {
        id: 'm-32',
        fullName: 'ด.ช. ณัฐวุฒิ สายทอง',
        relation: 'ตัวนักเรียน',
        citizenId: '1-5099-02152-07-8',
        educationLevel: 'ม.3',
        age: 14,
        isDisabled: false,
        hasChronicDisease: false,
        incomeSalary: 0,
        incomeAgriculture: 0,
        incomeBusiness: 0,
        incomeWelfare: 0,
        incomeOther: 0,
      },
    ],
    totalHouseholdIncome: 3800,
    perCapitaIncome: 1900, // 3800 / 2 = 1,900 บาท/คน/เดือน (ผ่านเกณฑ์ กสศ.)
    familyIncomeRange: '< 10,000 บ./เดือน',
    dependencyFlags: ['ผู้สูงอายุตั้งแต่ 60 ปีขึ้นไป', 'มีโรคเรื้อรัง ยกเว้น ความดัน/เบาหวาน'],
    housingType: 'อยู่กับผู้อื่น/อยู่ฟรี',
    monthlyRentBaht: 0,
    floorMaterial: 'ซีเมนต์เปลือย',
    wallMaterial: 'ไม้กระดาน',
    roofMaterial: 'โลหะ (เช่น สังกะสี/เหล็ก/อะลูมิเนียม)',
    hasToilet: true,
    agriculturalLand: 'มีที่ดินน้อยกว่า 1 ไร่',
    drinkingWaterSource: 'น้ำประปา',
    electricitySource: 'ไฟต่อพ่วง/แบตเตอรี่',
    vehicles: ['รถมอเตอร์ไซค์/เรือประมงพื้นบ้าน (ขนาดเล็ก)'],
    appliances: ['ตู้เย็น'],
    travelMethod: 'จักรยานยนต์ส่วนตัว',
    travelDistanceKm: 9.8,
    travelTimeMinutes: 35,
    monthlyTravelCostBaht: 500,
    dailyPocketMoneyBaht: 35,
    address: '54 หมู่ 2 ต.แม่เหียะ อ.เมือง จ.เชียงใหม่ 50100',
    landmarkNote: 'ใกล้ตลาดสดแม่เหียะ ซอยข้างร้านขายยา',
    gpsLat: 18.7451,
    gpsLng: 98.9411,
    gpsPinned: true,
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '12 ก.ย. 2569 20:10 น.',
    photoSource: 'คุณครูลงเยี่ยมบ้านด้วยตนเอง',
    photoExteriorUrl:
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500&auto=format&fit=crop&q=60',
    photoInteriorUrl:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&auto=format&fit=crop&q=60',
    visitPhotos: [],
    studentSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: ด.ช. ณัฐวุฒิ สายทอง',
    guardianSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นางบัวลอย สายทอง (ย่า)',
    teacherSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายภาสภูมิ เรืองปราชญ์',
    officialSignatureData: 'ลงลายมือชื่อดิจิทัลแล้ว: นายสมศักดิ์ เกียรติเจริญ (ผอ.สถานศึกษา)',
    officialCertifierName: 'นายประเสริฐ มั่นคง (ผู้ใหญ่บ้านหมู่ 2)',
    officialCertifierPosition: 'ผู้ใหญ่บ้าน / เจ้าหน้าที่ของรัฐ',
    sdqStudentStatus: 'PROBLEM',
    sdqStudentScore: 19,
    sdqTeacherStatus: 'RISK',
    sdqEmotionalNote: 'บิดามารดาทำงานต่างจังหวัด อาศัยอยู่กับย่า (นักเรียนย้ายเข้าใหม่ 1 ก.ค. 2569)',
    visitStatus: 'VISITED',
    visitDate: '2026-09-18',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: ['อาศัยอยู่กับปู่ย่าตายาย', 'รายได้ครอบครัวต่ำ', 'เสี่ยงขาดเรียนบ่อย'],
    scholarshipRecommended: true,
    teacherSummaryNote: 'ลงพื้นที่เก็บข้อมูล นร.01 ครบถ้วน รายได้เฉลี่ย 1,900 บ./คน/เดือน เตรียมกดโอนข้อมูลขึ้นระบบ CCT กสศ.',
    cctSyncStatus: 'READY_TO_SYNC',
  },
];

export const homeVisitService = {
  getAll(): HomeVisitRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
        return INITIAL_RECORDS;
      }
      return JSON.parse(raw) as HomeVisitRecord[];
    } catch {
      return INITIAL_RECORDS;
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
