// ============================================================================
// Student Affairs (กิจการนักเรียน) & Student Council (สภานักเรียน E-Voting) Service
// ย้ายมาจากโปรเจกต์ระบบการลา (808ff74f-7eb0-4ab2-b2cd-8def57e558fb)
// เชื่อมข้อมูล 2 ฝั่ง: ครูบริหารจัดการ <-> นักเรียนเข้าโหวต E-Voting / ยื่นใบลา / ส่งข้อเสนอแนะ
// ============================================================================

export interface AssemblyExceptionRecord {
  studentCode: string;
  studentName: string;
  classroom: string;
  enrolledAt: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'SICK_LEAVE' | 'PERSONAL_LEAVE';
  note?: string;
}

export interface DisciplineRecord {
  id: string;
  studentCode: string;
  studentName: string;
  classroom: string;
  date: string;
  type: 'DEDUCT' | 'BONUS';
  points: number;
  reason: string;
  reporter: string;
  parentNotified: boolean;
}

export interface StudentLeaveRequest {
  id: string;
  studentCode: string;
  studentName: string;
  classroom: string;
  leaveType: 'ลาป่วย' | 'ลากิจ';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  guardianPhone: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface CouncilCandidateParty {
  id: string;
  partyNumber: number;
  partyName: string;
  leaderName: string;
  classroom: string;
  slogan: string;
  policies: string[];
  voteCount: number;
  colorClass: string;
}

export interface CouncilActivity {
  id: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  budgetBaht: number;
}

export interface StudentSuggestion {
  id: string;
  studentCode: string;
  studentName: string;
  category: 'อาคารสถานที่/สิ่งแวดล้อม' | 'อาหารกลางวัน/โรงอาหาร' | 'กิจกรรม/กีฬา' | 'การเรียนการสอน';
  topic: string;
  detail: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  councilReply?: string;
  createdAt: string;
}

export type AffairsTeacherRole = 'HOMEROOM' | 'DUTY' | 'AFFAIRS' | 'ALL_TEACHERS';

export interface AffairsRolePermission {
  role: AffairsTeacherRole;
  label: string;
  description: string;
  canViewAllRooms: boolean;
  canCheckFlagpoleAllRooms: boolean;
  canApproveLeaveAllRooms: boolean;
  canManageDiscipline: boolean;
}

const STORAGE_KEY_ASSEMBLY = 'cms_affairs_assembly_v2';
const STORAGE_KEY_DISCIPLINE = 'cms_affairs_discipline_v1';
const STORAGE_KEY_LEAVES = 'cms_affairs_student_leaves_v2';
const STORAGE_KEY_PARTIES = 'cms_council_parties_v1';
const STORAGE_KEY_VOTED_STUDENTS = 'cms_council_voted_students_v1';
const STORAGE_KEY_ABSTAIN_COUNT = 'cms_council_abstain_count_v1';
const STORAGE_KEY_ACTIVITIES = 'cms_council_activities_v1';
const STORAGE_KEY_SUGGESTIONS = 'cms_council_suggestions_v1';
const STORAGE_KEY_ROLE_MATRIX = 'cms_affairs_role_matrix_v1';
const STORAGE_KEY_ACTIVE_ROLE = 'cms_affairs_active_role_v1';

export const DEFAULT_ROLE_PERMISSIONS: AffairsRolePermission[] = [
  {
    role: 'HOMEROOM',
    label: 'ครูที่ปรึกษา (ม.3/1)',
    description: 'เห็นเฉพาะห้องที่ปรึกษาของตนเอง เช็คชื่อเสาธงและอนุมัติใบลาในห้องตนเอง',
    canViewAllRooms: false,
    canCheckFlagpoleAllRooms: false,
    canApproveLeaveAllRooms: false,
    canManageDiscipline: true,
  },
  {
    role: 'DUTY',
    label: 'ครูเวรประจำวัน',
    description: 'เห็นทุกห้องเรียนเพื่อเช็คชื่อหน้าเสาธงและตรวจสอบใบลาประจำวัน',
    canViewAllRooms: true,
    canCheckFlagpoleAllRooms: true,
    canApproveLeaveAllRooms: false,
    canManageDiscipline: true,
  },
  {
    role: 'AFFAIRS',
    label: 'ครูกิจการนักเรียน (ฝ่ายปกครอง)',
    description: 'เห็นทุกห้องเรียน อนุมัติใบลาทุกห้อง บันทึกความประพฤติ และตั้งค่าสิทธิ์ระบบ',
    canViewAllRooms: true,
    canCheckFlagpoleAllRooms: true,
    canApproveLeaveAllRooms: true,
    canManageDiscipline: true,
  },
  {
    role: 'ALL_TEACHERS',
    label: 'ครูทุกคน (ครูประจำวิชา)',
    description: 'ดูผลมาเข้าแถวและสถานะใบลาเพื่อใช้ประกอบการเช็คเวลาเรียนรายคาบ',
    canViewAllRooms: true,
    canCheckFlagpoleAllRooms: false,
    canApproveLeaveAllRooms: false,
    canManageDiscipline: false,
  },
];

const INITIAL_ASSEMBLY: AssemblyExceptionRecord[] = [
  {
    studentCode: '45101',
    studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    status: 'PRESENT',
  },
  {
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    status: 'PRESENT',
  },
  {
    studentCode: '45105',
    studentName: 'ด.ญ. กมลชนก เลิศวิไล',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    status: 'PRESENT',
  },
  {
    studentCode: '45109',
    studentName: 'ด.ช. ณัฐวุฒิ สายทอง',
    classroom: 'ม.3/1',
    enrolledAt: '2026-07-01', // นักเรียนย้ายเข้าใหม่กลางเทอม
    status: 'LATE',
    note: 'รถโดยสารมาช้า 10 นาที',
  },
  {
    studentCode: '45112',
    studentName: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์',
    classroom: 'ม.3/1',
    enrolledAt: '2026-05-16',
    status: 'SICK_LEAVE',
    note: 'ผู้ปกครองแจ้งลาป่วยผ่านพอร์ทัลนักเรียน (อนุมัติแล้ว)',
  },
  {
    studentCode: '45201',
    studentName: 'ด.ช. ภานุพงศ์ เจริญสุข',
    classroom: 'ม.3/2',
    enrolledAt: '2026-05-16',
    status: 'PRESENT',
  },
  {
    studentCode: '45204',
    studentName: 'ด.ญ. ชนากานต์ รัตนโชติ',
    classroom: 'ม.3/2',
    enrolledAt: '2026-05-16',
    status: 'PERSONAL_LEAVE',
    note: 'ลากิจไปทำพาสปอร์ตกับผู้ปกครอง',
  },
  {
    studentCode: '45302',
    studentName: 'ด.ช. ธนดล ยิ่งเจริญ',
    classroom: 'ม.3/3',
    enrolledAt: '2026-05-16',
    status: 'ABSENT',
    note: 'ยังไม่แจ้งสาเหตุ',
  },
];

const INITIAL_DISCIPLINE: DisciplineRecord[] = [
  {
    id: 'd-1',
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    classroom: 'ม.3/1',
    date: '2026-09-20',
    type: 'BONUS',
    points: 10,
    reason: 'ช่วยครูจัดนิทรรศการศิลปะและทำความสะอาดห้องเรียน',
    reporter: 'อ.ภาสภูมิ เรืองปราชญ์',
    parentNotified: true,
  },
  {
    id: 'd-2',
    studentCode: '45109',
    studentName: 'ด.ช. ณัฐวุฒิ สายทอง',
    classroom: 'ม.3/1',
    date: '2026-09-22',
    type: 'DEDUCT',
    points: 5,
    reason: 'มาเข้าแถวหน้าเสาธงสายเกินเวลาที่กำหนด',
    reporter: 'ครูเวรฝ่ายกิจการนักเรียน',
    parentNotified: true,
  },
  {
    id: 'd-3',
    studentCode: '45105',
    studentName: 'ด.ญ. กมลชนก เลิศวิไล',
    classroom: 'ม.3/1',
    date: '2026-09-23',
    type: 'BONUS',
    points: 15,
    reason: 'ตัวแทนสภานักเรียนจัดกิจกรรมรณรงค์คัดแยกขยะ',
    reporter: 'ฝ่ายกิจการนักเรียน',
    parentNotified: true,
  },
];

const INITIAL_LEAVES: StudentLeaveRequest[] = [
  {
    id: 'sl-1',
    studentCode: '45112',
    studentName: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์',
    classroom: 'ม.3/1',
    leaveType: 'ลาป่วย',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    daysCount: 1,
    reason: 'มีไข้หวัดและปวดศีรษะ มีใบรับรองแพทย์คลินิก',
    guardianPhone: '082-119-5621',
    status: 'APPROVED',
    createdAt: '25 ก.ย. 2569 07:15 น.',
  },
  {
    id: 'sl-2',
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    classroom: 'ม.3/1',
    leaveType: 'ลากิจ',
    startDate: '2026-09-28',
    endDate: '2026-09-28',
    daysCount: 1,
    reason: 'เดินทางไปทำบัตรประชาชนใหม่และติดต่อเอกสารทุน กสศ. กับมารดา',
    guardianPhone: '081-452-9918',
    status: 'PENDING',
    createdAt: '25 ก.ย. 2569 08:10 น.',
  },
  {
    id: 'sl-3',
    studentCode: '45204',
    studentName: 'ด.ญ. ชนากานต์ รัตนโชติ',
    classroom: 'ม.3/2',
    leaveType: 'ลากิจ',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    daysCount: 1,
    reason: 'เดินทางไปทำหนังสือเดินทางราชการกับผู้ปกครอง',
    guardianPhone: '089-774-1120',
    status: 'PENDING',
    createdAt: '25 ก.ย. 2569 07:40 น.',
  },
];

const INITIAL_PARTIES: CouncilCandidateParty[] = [
  {
    id: 'party-1',
    partyNumber: 1,
    partyName: 'พรรคก้าวใหม่วัยเรียน (NextGen Student)',
    leaderName: 'นายธนกร วงศ์สุวรรณ',
    classroom: 'ม.5/1',
    slogan: 'สภานักเรียนโปร่งใส รับฟังทุกเสียง พัฒนาโรงเรียนน่าอยู่',
    policies: [
      'เพิ่มจุดบริการน้ำดื่มสะอาดและปลั๊กไฟโซนโรงอาหาร',
      'จัดแข่งขัน E-Sports และดนตรีสดทุกวันศุกร์สิ้นเดือน',
      'ระบบยืมอุปกรณ์กีฬาด้วยรหัสนักเรียน',
    ],
    voteCount: 342,
    colorClass: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'party-2',
    partyNumber: 2,
    partyName: 'พรรคพลังลูกม่วง-ขาว (Purple Unity)',
    leaderName: 'นางสาวณัฐณิชา ศรีสวัสดิ์',
    classroom: 'ม.5/2',
    slogan: 'ใส่ใจสวัสดิการนักเรียน ส่งเสริมวิชาการควบคู่กิจกรรม',
    policies: [
      'ธนาคารอุปกรณ์การเรียนและผ้าอนามัยฟรีห้องพยาบาล',
      'ติวเข้มพี่สอนน้องก่อนสอบกลางภาคและปลายภาค',
      'ปรับปรุงห้องน้ำนักเรียนพร้อมกระจกและสบู่ล้างมือทุกชั้น',
    ],
    voteCount: 318,
    colorClass: 'from-purple-600 to-pink-600',
  },
  {
    id: 'party-3',
    partyNumber: 3,
    partyName: 'พรรครักษ์โรงเรียนสีเขียว (Eco Smart School)',
    leaderName: 'นายศุภณัฐ ใจดี',
    classroom: 'ม.5/3',
    slogan: 'โรงเรียนสีเขียว ทันสมัย ใส่ใจสิ่งแวดล้อมและสุขภาพ',
    policies: [
      'โครงการขยะแลกแต้มแลกซื้อขนมสหกรณ์โรงเรียน',
      'เพิ่มพื้นที่ร่มเงาและม้านั่งพักผ่อนใต้ต้นไม้',
      'ตู้รับฟังความคิดเห็นออนไลน์ตอบกลับภายใน 48 ชั่วโมง',
    ],
    voteCount: 215,
    colorClass: 'from-emerald-600 to-teal-700',
  },
];

const INITIAL_ACTIVITIES: CouncilActivity[] = [
  {
    id: 'act-1',
    title: 'การเลือกตั้งสภานักเรียนออนไลน์ ประจำปีการศึกษา 2569 (E-Voting)',
    date: '2569-09-24',
    location: 'ลงคะแนนผ่านพอร์ทัลนักเรียน (Classroom Portal)',
    organizer: 'คณะกรรมการการเลือกตั้งสภานักเรียน',
    status: 'ONGOING',
    budgetBaht: 2500,
  },
  {
    id: 'act-2',
    title: 'กิจกรรมดนตรีในสวน & ตลาดนัดชมรม (Friday Music & Club Fair)',
    date: '2569-10-02',
    location: 'ลานอเนกประสงค์หน้าอาคาร 2',
    organizer: 'ฝ่ายกิจกรรมสภานักเรียน',
    status: 'UPCOMING',
    budgetBaht: 5000,
  },
];

const INITIAL_SUGGESTIONS: StudentSuggestion[] = [
  {
    id: 'sug-1',
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น (ม.3/1)',
    category: 'อาคารสถานที่/สิ่งแวดล้อม',
    topic: 'ขอให้ซ่อมก๊อกน้ำดื่มหน้าอาคาร 3 ชั้น 2',
    detail: 'ก๊อกน้ำดื่มตัวที่ 2 น้ำไหลเบาและมีน้ำรั่วซึม อยากให้สภานักเรียนช่วยประสานงานซ่อมบำรุงครับ',
    status: 'RESOLVED',
    councilReply: 'สภานักเรียนประสานงานครูฝ่ายอาคารสถานที่เปลี่ยนหัวก๊อกน้ำใหม่เรียบร้อยแล้วครับ ขอบคุณที่แจ้งเข้ามาครับ!',
    createdAt: '22 ก.ย. 2569',
  },
  {
    id: 'sug-2',
    studentCode: '45105',
    studentName: 'ด.ญ. กมลชนก เลิศวิไล (ม.3/1)',
    category: 'กิจกรรม/กีฬา',
    topic: 'เสนอให้มีชมรมวาดภาพดิจิทัล (Digital Art Club)',
    detail: 'อยากให้มีกิจกรรมประกวดวาดภาพด้วยแท็บเล็ตหรือมือถือในงานสัปดาห์วิชาการ',
    status: 'IN_PROGRESS',
    councilReply: 'บรรจุเข้าวาระการประชุมสภานักเรียนเดือนตุลาคมร่วมกับหมวดวิชาศิลปะแล้วค่ะ',
    createdAt: '23 ก.ย. 2569',
  },
];

export const studentAffairsCouncilService = {
  // 1. เช็คชื่อแถวหน้าเสาธง
  getAssemblyRecords(): AssemblyExceptionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSEMBLY);
      return raw ? JSON.parse(raw) : INITIAL_ASSEMBLY;
    } catch {
      return INITIAL_ASSEMBLY;
    }
  },

  updateAssemblyStatus(
    studentCode: string,
    status: AssemblyExceptionRecord['status'],
    note?: string
  ): AssemblyExceptionRecord[] {
    const list = this.getAssemblyRecords().map((r) =>
      r.studentCode === studentCode ? { ...r, status, note: note ?? r.note } : r
    );
    localStorage.setItem(STORAGE_KEY_ASSEMBLY, JSON.stringify(list));
    return list;
  },

  // 2. วินัยและคะแนนพฤติกรรม
  getDisciplineLogs(): DisciplineRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DISCIPLINE);
      return raw ? JSON.parse(raw) : INITIAL_DISCIPLINE;
    } catch {
      return INITIAL_DISCIPLINE;
    }
  },

  addDisciplineLog(
    entry: Omit<DisciplineRecord, 'id' | 'date'>
  ): DisciplineRecord[] {
    const list = this.getDisciplineLogs();
    const newItem: DisciplineRecord = {
      ...entry,
      id: `d-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY_DISCIPLINE, JSON.stringify(updated));
    return updated;
  },

  // 3. ใบลานักเรียน (แยกจาก E-Leave ครู)
  getStudentLeaves(): StudentLeaveRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEAVES);
      return raw ? JSON.parse(raw) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  },

  submitStudentLeave(
    payload: Omit<StudentLeaveRequest, 'id' | 'status' | 'createdAt'>
  ): StudentLeaveRequest[] {
    const list = this.getStudentLeaves();
    const newItem: StudentLeaveRequest = {
      ...payload,
      id: `sl-${Date.now()}`,
      status: 'PENDING',
      createdAt: 'เมื่อสักครู่',
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(updated));
    return updated;
  },

  updateStudentLeaveStatus(
    id: string,
    status: StudentLeaveRequest['status']
  ): StudentLeaveRequest[] {
    const leaves = this.getStudentLeaves();
    const target = leaves.find((l) => l.id === id);
    const updated = leaves.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(updated));

    // Invariant 1: เมื่ออนุมัติใบลา ให้ซิงค์สถานะเข้าแถวเสาธงเป็น ลาป่วย/ลากิจ อัตโนมัติ
    if (target && status === 'APPROVED') {
      const assemblyStatus: AssemblyExceptionRecord['status'] =
        target.leaveType === 'ลาป่วย' ? 'SICK_LEAVE' : 'PERSONAL_LEAVE';
      const currentAssembly = this.getAssemblyRecords();
      const exists = currentAssembly.some((a) => a.studentCode === target.studentCode);
      if (exists) {
        this.updateAssemblyStatus(
          target.studentCode,
          assemblyStatus,
          `อนุมัติ${target.leaveType}: ${target.reason}`
        );
      } else {
        const nextAssembly: AssemblyExceptionRecord[] = [
          ...currentAssembly,
          {
            studentCode: target.studentCode,
            studentName: target.studentName,
            classroom: target.classroom,
            enrolledAt: '2026-05-16',
            status: assemblyStatus,
            note: `อนุมัติ${target.leaveType}: ${target.reason}`,
          },
        ];
        localStorage.setItem(STORAGE_KEY_ASSEMBLY, JSON.stringify(nextAssembly));
      }
    }
    return updated;
  },

  // 4. เลือกตั้งสภานักเรียน E-Voting (รองรับ ไม่ประสงค์ลงคะแนน ABSTAIN)
  getCandidateParties(): CouncilCandidateParty[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PARTIES);
      return raw ? JSON.parse(raw) : INITIAL_PARTIES;
    } catch {
      return INITIAL_PARTIES;
    }
  },

  getAbstainCount(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ABSTAIN_COUNT);
      return raw ? Number(raw) : 19;
    } catch {
      return 19;
    }
  },

  hasStudentVoted(studentCode: string): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_VOTED_STUDENTS);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      return map[studentCode] || null;
    } catch {
      return null;
    }
  },

  castStudentVote(
    studentCode: string,
    partyId: string
  ): { parties: CouncilCandidateParty[]; abstainCount: number; alreadyVoted: boolean } {
    const existingVote = this.hasStudentVoted(studentCode);
    if (existingVote) {
      return {
        parties: this.getCandidateParties(),
        abstainCount: this.getAbstainCount(),
        alreadyVoted: true,
      };
    }

    let parties = this.getCandidateParties();
    let abstainCount = this.getAbstainCount();

    if (partyId === 'ABSTAIN') {
      abstainCount += 1;
      localStorage.setItem(STORAGE_KEY_ABSTAIN_COUNT, String(abstainCount));
    } else {
      parties = parties.map((p) =>
        p.id === partyId ? { ...p, voteCount: p.voteCount + 1 } : p
      );
      localStorage.setItem(STORAGE_KEY_PARTIES, JSON.stringify(parties));
    }

    const rawMap = localStorage.getItem(STORAGE_KEY_VOTED_STUDENTS);
    const map: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
    map[studentCode] = partyId;
    localStorage.setItem(STORAGE_KEY_VOTED_STUDENTS, JSON.stringify(map));

    return { parties, abstainCount, alreadyVoted: false };
  },

  // 5. กิจกรรมสภานักเรียน & ตู้รับความคิดเห็น
  getActivities(): CouncilActivity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      return raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  },

  getSuggestions(): StudentSuggestion[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUGGESTIONS);
      return raw ? JSON.parse(raw) : INITIAL_SUGGESTIONS;
    } catch {
      return INITIAL_SUGGESTIONS;
    }
  },

  submitSuggestion(
    payload: Omit<StudentSuggestion, 'id' | 'status' | 'createdAt'>
  ): StudentSuggestion[] {
    const list = this.getSuggestions();
    const newItem: StudentSuggestion = {
      ...payload,
      id: `sug-${Date.now()}`,
      status: 'PENDING',
      createdAt: 'วันนี้',
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(updated));
    return updated;
  },

  replySuggestion(
    id: string,
    status: StudentSuggestion['status'],
    councilReply: string
  ): StudentSuggestion[] {
    const updated = this.getSuggestions().map((s) =>
      s.id === id ? { ...s, status, councilReply } : s
    );
    localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(updated));
    return updated;
  },

  // 6. การตั้งค่าสิทธิ์การเข้าถึง (Flexible 4-Role Access Matrix)
  getRolePermissions(): AffairsRolePermission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROLE_MATRIX);
      return raw ? JSON.parse(raw) : DEFAULT_ROLE_PERMISSIONS;
    } catch {
      return DEFAULT_ROLE_PERMISSIONS;
    }
  },

  saveRolePermissions(matrix: AffairsRolePermission[]): AffairsRolePermission[] {
    localStorage.setItem(STORAGE_KEY_ROLE_MATRIX, JSON.stringify(matrix));
    return matrix;
  },

  getActiveTeacherRole(): AffairsTeacherRole {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ROLE);
    if (
      saved === 'HOMEROOM' ||
      saved === 'DUTY' ||
      saved === 'AFFAIRS' ||
      saved === 'ALL_TEACHERS'
    ) {
      return saved;
    }
    return 'HOMEROOM';
  },

  setActiveTeacherRole(role: AffairsTeacherRole): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, role);
  },

  // 7. ดึงสถานะมาเข้าแถวหน้าเสาธง + ใบลาที่อนุมัติแล้ว เพื่อส่งต่อให้ครูประจำวิชาเช็คชื่อรายคาบ
  getMorningStatusForStudent(studentName: string, studentCode?: string): {
    assemblyStatus: AssemblyExceptionRecord['status'];
    assemblyLabel: string;
    hasApprovedLeave: boolean;
    leaveReason?: string;
    recommendedClassStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  } {
    const assemblyList = this.getAssemblyRecords();
    const leaves = this.getStudentLeaves();

    const approvedLeave = leaves.find(
      (l) =>
        l.status === 'APPROVED' &&
        ((studentCode && l.studentCode === studentCode) ||
          l.studentName.includes(studentName) ||
          studentName.includes(l.studentName))
    );

    const assemblyRecord = assemblyList.find(
      (a) =>
        (studentCode && a.studentCode === studentCode) ||
        a.studentName.includes(studentName) ||
        studentName.includes(a.studentName)
    );

    if (approvedLeave) {
      return {
        assemblyStatus:
          approvedLeave.leaveType === 'ลาป่วย' ? 'SICK_LEAVE' : 'PERSONAL_LEAVE',
        assemblyLabel: `อนุมัติ${approvedLeave.leaveType}แล้ว (${approvedLeave.reason})`,
        hasApprovedLeave: true,
        leaveReason: `${approvedLeave.leaveType}: ${approvedLeave.reason}`,
        recommendedClassStatus: 'LEAVE',
      };
    }

    if (assemblyRecord) {
      if (
        assemblyRecord.status === 'SICK_LEAVE' ||
        assemblyRecord.status === 'PERSONAL_LEAVE'
      ) {
        const label =
          assemblyRecord.status === 'SICK_LEAVE' ? 'ลาป่วยหน้าเสาธง' : 'ลากิจหน้าเสาธง';
        return {
          assemblyStatus: assemblyRecord.status,
          assemblyLabel: `${label}${assemblyRecord.note ? ` (${assemblyRecord.note})` : ''}`,
          hasApprovedLeave: true,
          leaveReason: assemblyRecord.note || label,
          recommendedClassStatus: 'LEAVE',
        };
      }
      if (assemblyRecord.status === 'LATE') {
        return {
          assemblyStatus: 'LATE',
          assemblyLabel: `เข้าแถวสาย${assemblyRecord.note ? ` (${assemblyRecord.note})` : ''}`,
          hasApprovedLeave: false,
          recommendedClassStatus: 'PRESENT',
        };
      }
      if (assemblyRecord.status === 'ABSENT') {
        return {
          assemblyStatus: 'ABSENT',
          assemblyLabel: 'ขาดเข้าแถวหน้าเสาธง',
          hasApprovedLeave: false,
          recommendedClassStatus: 'ABSENT',
        };
      }
    }

    return {
      assemblyStatus: 'PRESENT',
      assemblyLabel: 'มาเข้าแถวปกติ',
      hasApprovedLeave: false,
      recommendedClassStatus: 'PRESENT',
    };
  },
};
