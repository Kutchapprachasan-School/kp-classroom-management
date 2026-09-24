// ============================================================================
// Home Visit & Student Care (SDQ) CRUD Service
// เชื่อมโยงข้อมูล 2 ฝั่ง (นักเรียนกรอกข้อมูล/ปักหมุด GPS <-> ครูบันทึกผลเยี่ยมบ้าน/SDQ)
// ============================================================================

export type VisitStatus = 'VISITED' | 'SCHEDULED' | 'PENDING';
export type SdqLevel = 'NORMAL' | 'RISK' | 'PROBLEM' | 'PENDING';

export interface HomeVisitRecord {
  id: string;
  studentCode: string;
  studentNumber: number;
  studentName: string;
  classroom: string;

  // ส่วนที่ 1: ข้อมูลที่นักเรียน/ผู้ปกครองกรอกผ่านระบบจัดการชั้นเรียน
  studentSelfSubmitStatus: 'SUBMITTED' | 'PENDING';
  submittedAt?: string;
  address: string;
  landmarkNote: string;
  gpsLat: number;
  gpsLng: number;
  gpsPinned: boolean;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianOccupation: string;
  familyIncomeRange: '< 10,000 บ./เดือน' | '10,000 - 25,000 บ./เดือน' | '> 25,000 บ./เดือน';
  housingType: 'บ้านตนเอง' | 'บ้านเช่า/หอพัก' | 'อาศัยอยู่กับญาติ';
  travelMethod: 'ผู้ปกครองรับ-ส่ง' | 'รถรับ-ส่งนักเรียน' | 'รถจักรยานยนต์' | 'เดินเท้า/รถโดยสาร';
  travelDistanceKm: number;

  // ส่วนที่ 2: ผลประเมิน SDQ (ฉบับนักเรียนประเมินตนเอง & ฉบับครูประเมิน)
  sdqStudentStatus: SdqLevel;
  sdqStudentScore: number; // คะแนนปัญหา 0-40 (0-14 ปกติ, 15-16 เสี่ยง, 17+ มีปัญหา)
  sdqTeacherStatus: SdqLevel;
  sdqEmotionalNote: string;

  // ส่วนที่ 3: ข้อมูลที่ครูที่ปรึกษาบันทึกจากการเยี่ยมบ้าน
  visitStatus: VisitStatus;
  visitDate?: string;
  visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง' | 'เยี่ยมบ้านออนไลน์ (Video Call)' | 'สัมภาษณ์ผู้ปกครองที่โรงเรียน';
  riskFactors: string[];
  scholarshipRecommended: boolean;
  teacherSummaryNote: string;
  visitPhotos: string[];
}

const STORAGE_KEY = 'cms_home_visit_sdq_records_v1';

const INITIAL_RECORDS: HomeVisitRecord[] = [
  {
    id: 'hv-1',
    studentCode: '45102',
    studentNumber: 1,
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    classroom: 'ม.3/1',
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '10 ก.ย. 2569 19:20 น.',
    address: '142/8 หมู่ 4 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
    landmarkNote: 'ซอยข้างวัดป่าแดง บ้านรั้วไม้สีน้ำตาล หลังที่ 3 ซ้ายมือ',
    gpsLat: 18.7883,
    gpsLng: 98.9542,
    gpsPinned: true,
    guardianName: 'นางสมพร คำฝั้น',
    guardianRelation: 'มารดา',
    guardianPhone: '081-452-9918',
    guardianOccupation: 'รับจ้างทั่วไป / ค้าขายรายวัน',
    familyIncomeRange: '< 10,000 บ./เดือน',
    housingType: 'บ้านเช่า/หอพัก',
    travelMethod: 'รถโดยสารประจำทาง' as any,
    travelDistanceKm: 11.5,
    sdqStudentStatus: 'RISK',
    sdqStudentScore: 16,
    sdqTeacherStatus: 'RISK',
    sdqEmotionalNote: 'มีความกังวลเรื่องค่าใช้จ่ายทางบ้านและต้องช่วยแม่ขายของช่วงเย็น ทำให้ส่งงานช้าบางวิชา',
    visitStatus: 'VISITED',
    visitDate: '2026-09-12',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: ['รายได้ครอบครัวต่ำ', 'เดินทางไกล', 'ต้องทำงานช่วยครอบครัวหลังเลิกเรียน'],
    scholarshipRecommended: true,
    teacherSummaryNote:
      'ลงพื้นที่เยี่ยมบ้านพบมารดา นักเรียนมีความรับผิดชอบดีแต่ช่วยมารดาขายของทำให้กลับบ้านดึก เสนอชื่อรับทุนปัจจัยพื้นฐานและปรับเวลาส่งงานยืดหยุ่น',
    visitPhotos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&auto=format&fit=crop&q=60'],
  },
  {
    id: 'hv-2',
    studentCode: '45105',
    studentNumber: 2,
    studentName: 'ด.ญ. กมลชนก เลิศวิไล',
    classroom: 'ม.3/1',
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '11 ก.ย. 2569 16:45 น.',
    address: '88/19 หมู่บ้านสิริการ์เด้น ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300',
    landmarkNote: 'ซอย 3 บ้านเลขที่ 88/19 ประตูรั้วสีขาว',
    gpsLat: 18.8124,
    gpsLng: 98.9715,
    gpsPinned: true,
    guardianName: 'นายวิชัย เลิศวิไล',
    guardianRelation: 'บิดา',
    guardianPhone: '089-231-7740',
    guardianOccupation: 'ข้าราชการ',
    familyIncomeRange: '> 25,000 บ./เดือน',
    housingType: 'บ้านตนเอง',
    travelMethod: 'ผู้ปกครองรับ-ส่ง',
    travelDistanceKm: 4.2,
    sdqStudentStatus: 'NORMAL',
    sdqStudentScore: 7,
    sdqTeacherStatus: 'NORMAL',
    sdqEmotionalNote: 'อารมณ์แจ่มใส มีมนุษยสัมพันธ์ดีมาก ช่วยเพื่อนในห้องเรียน',
    visitStatus: 'VISITED',
    visitDate: '2026-09-14',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: [],
    scholarshipRecommended: false,
    teacherSummaryNote: 'ครอบครัวอบอุ่น ผู้ปกครองดูแลเอาใจใส่การเรียนอย่างใกล้ชิด ส่งเสริมความสามารถพิเศษด้านศิลปะ',
    visitPhotos: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&auto=format&fit=crop&q=60'],
  },
  {
    id: 'hv-3',
    studentCode: '45109',
    studentNumber: 3,
    studentName: 'ด.ช. ณัฐวุฒิ สายทอง',
    classroom: 'ม.3/1',
    studentSelfSubmitStatus: 'SUBMITTED',
    submittedAt: '12 ก.ย. 2569 20:10 น.',
    address: '54 หมู่ 2 ต.แม่เหียะ อ.เมือง จ.เชียงใหม่ 50100',
    landmarkNote: 'ใกล้ตลาดสดแม่เหียะ ซอยข้างร้านขายยา',
    gpsLat: 18.7451,
    gpsLng: 98.9411,
    gpsPinned: true,
    guardianName: 'นางบัวลอย สายทอง',
    guardianRelation: 'ย่า',
    guardianPhone: '086-912-3304',
    guardianOccupation: 'เกษตรกร',
    familyIncomeRange: '< 10,000 บ./เดือน',
    housingType: 'อาศัยอยู่กับญาติ',
    travelMethod: 'รถจักรยานยนต์',
    travelDistanceKm: 9.8,
    sdqStudentStatus: 'PROBLEM',
    sdqStudentScore: 19,
    sdqTeacherStatus: 'RISK',
    sdqEmotionalNote: 'ขาดสมาธิในคาบเรียนบ่อย บิดามารดาทำงานต่างจังหวัด อาศัยอยู่กับย่า',
    visitStatus: 'SCHEDULED',
    visitDate: '2026-09-26',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: ['อาศัยอยู่กับปู่ย่าตายาย', 'รายได้ครอบครัวต่ำ', 'เสี่ยงขาดเรียนบ่อย'],
    scholarshipRecommended: true,
    teacherSummaryNote: 'นัดหมายคุณย่าเพื่อเข้าเยี่ยมบ้านวันเสาร์นี้ ติดตามเรื่องการมาเรียนสายและทุนอาหารกลางวัน',
    visitPhotos: [],
  },
  {
    id: 'hv-4',
    studentCode: '45112',
    studentNumber: 4,
    studentName: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์',
    classroom: 'ม.3/1',
    studentSelfSubmitStatus: 'PENDING',
    address: 'รอผู้ปกครอง/นักเรียนกรอกที่อยู่ปัจจุบัน',
    landmarkNote: '-',
    gpsLat: 18.7900,
    gpsLng: 98.9800,
    gpsPinned: false,
    guardianName: 'นางสาวอารยา วงศ์สวัสดิ์',
    guardianRelation: 'มารดา',
    guardianPhone: '082-119-5621',
    guardianOccupation: 'พนักงานบริษัทเอกชน',
    familyIncomeRange: '10,000 - 25,000 บ./เดือน',
    housingType: 'บ้านตนเอง',
    travelMethod: 'รถรับ-ส่งนักเรียน',
    travelDistanceKm: 6.0,
    sdqStudentStatus: 'PENDING',
    sdqStudentScore: 0,
    sdqTeacherStatus: 'NORMAL',
    sdqEmotionalNote: 'รอนักเรียนทำแบบประเมิน SDQ ในพอร์ทัลนักเรียน',
    visitStatus: 'PENDING',
    visitMethod: 'ลงพื้นที่เยี่ยมบ้านจริง',
    riskFactors: [],
    scholarshipRecommended: false,
    teacherSummaryNote: 'แจ้งให้นักเรียนเข้าปักหมุดพิกัดบ้านในระบบจัดการชั้นเรียนภายในสัปดาห์นี้',
    visitPhotos: [],
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

  getByStudentCode(studentCode: string): HomeVisitRecord | undefined {
    return this.getAll().find((r) => r.studentCode === studentCode);
  },

  updateRecord(id: string, patch: Partial<HomeVisitRecord>): HomeVisitRecord[] {
    const current = this.getAll();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
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
      housingType: HomeVisitRecord['housingType'];
      travelMethod: HomeVisitRecord['travelMethod'];
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
