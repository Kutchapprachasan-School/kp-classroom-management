// ============================================================================
// SGS Roster Alignment & Term Assignment Submission Matrix Service
// แก้ Pain Point ของครู:
// 1. ครูจำไม่ได้ว่าสั่งกี่งาน นักเรียนทำไปกี่งาน และต้องมาตรวจทีละคนตอนท้ายเทอม
// 2. นักเรียนย้ายเข้าใหม่ / ย้ายออกกลางเทอม ทำให้ลำดับรายชื่อไม่ตรงกับ SGS (บรรทัดเลื่อน)
// ============================================================================

export type StudentTransferState = 'ACTIVE' | 'TRANSFERRED_IN' | 'TRANSFERRED_OUT';
export type StudentGender = 'MALE' | 'FEMALE';
export type SgsInsertPosition = 'AFTER_SAME_GENDER' | 'END_OF_CLASS' | 'CUSTOM_SEAT';

export interface SgsStudentRecord {
  sgsSeatNo: number; // เลขที่ตามใบรายชื่อ SGS
  studentCode: string;
  studentName: string;
  gender: StudentGender; // ชายขึ้นก่อนหญิง (ผู้ชายเข้าใหม่ต่อท้ายผู้ชาย)
  classroom: string;
  transferState: StudentTransferState;
  transferDate?: string;
  transferNote?: string;
  transferredBaseScore?: {
    u1?: number;
    u2?: number;
  };
  attendancePercent: number;
  morningStatusLabel: string;
  midtermScore: number; // เต็ม 20
  finalScore: number; // เต็ม 30
}

export interface TermAssignmentItem {
  id: string;
  orderNo: number;
  title: string;
  sgsUnit: 'u1' | 'u2' | 'u3'; // ผูกเข้าช่องคะแนน SGS (หน่วย 1, 2, 3)
  sgsUnitLabel: string;
  maxScore: number;
  assignedDate: string;
  dueDate: string;
}

export type SubmissionCellStatus =
  | 'GRADED'
  | 'SUBMITTED_PENDING'
  | 'MISSING'
  | 'EXEMPT_TRANSFERRED';

export interface StudentWorkSubmission {
  assignmentId: string;
  studentCode: string;
  status: SubmissionCellStatus;
  score: number | null;
  submittedAt?: string;
  workTitle?: string;
  workAttachmentLabel?: string;
  teacherFeedback?: string;
}

const STORAGE_KEY_SGS_ROSTER = 'kp_sgs_roster_v2';
const STORAGE_KEY_TERM_ASSIGNMENTS = 'kp_term_assignments_v1';
const STORAGE_KEY_WORK_SUBMISSIONS = 'kp_work_submissions_v1';

// เรียงตามมาตรฐานทะเบียนโรงเรียนไทย: นักเรียนชาย (เลขที่ 1-5) -> นักเรียนหญิง (เลขที่ 6-8)
// เมื่อ ด.ช. ณัฐวุฒิ ย้ายเข้าใหม่กลางเทอม จึงแทรกต่อท้ายกลุ่มผู้ชายที่ "เลขที่ 5" (ไม่ได้ไปอยู่เลขที่ 8 ท้ายสุด)
const INITIAL_SGS_ROSTER: SgsStudentRecord[] = [
  {
    sgsSeatNo: 1,
    studentCode: '45101',
    studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    gender: 'MALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 96.5,
    morningStatusLabel: 'มาเข้าแถวปกติ',
    midtermScore: 17,
    finalScore: 26,
  },
  {
    sgsSeatNo: 2,
    studentCode: '45102',
    studentName: 'ด.ช. ทัตธน คำฝั้น',
    gender: 'MALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 95.0,
    morningStatusLabel: 'มาเข้าแถวปกติ',
    midtermScore: 18,
    finalScore: 27,
  },
  {
    sgsSeatNo: 3,
    studentCode: '45107',
    studentName: 'ด.ช. ชัยมงคล วงศ์บุตร',
    gender: 'MALE',
    classroom: 'ม.3/1',
    transferState: 'TRANSFERRED_OUT',
    transferDate: '2026-08-10',
    transferNote: 'ย้ายออก (คงเลขที่ 3 ไว้ในกลุ่มนักเรียนชายตาม SGS เพื่อไม่ให้บรรทัดเลื่อน)',
    attendancePercent: 0,
    morningStatusLabel: 'ย้ายออกแล้ว',
    midtermScore: 0,
    finalScore: 0,
  },
  {
    sgsSeatNo: 4,
    studentCode: '45115',
    studentName: 'ด.ช. อัศวิน วนเกษตรกุล',
    gender: 'MALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 78.5,
    morningStatusLabel: 'มาเข้าแถวปกติ (เสี่ยง มส. < 80%)',
    midtermScore: 12,
    finalScore: 18,
  },
  {
    sgsSeatNo: 5,
    studentCode: '45109',
    studentName: 'ด.ช. ณัฐวุฒิ สายทอง',
    gender: 'MALE',
    classroom: 'ม.3/1',
    transferState: 'TRANSFERRED_IN',
    transferDate: '2026-07-01',
    transferNote: 'ย้ายเข้าใหม่ (แทรกต่อท้ายกลุ่มนักเรียนชายที่เลขที่ 5 ตาม SGS + คะแนนหญิงไม่สลับคน)',
    transferredBaseScore: { u1: 12 },
    attendancePercent: 92.0,
    morningStatusLabel: 'เข้าแถวสาย (รถโดยสารมาช้า)',
    midtermScore: 15,
    finalScore: 23,
  },
  {
    sgsSeatNo: 6,
    studentCode: '45105',
    studentName: 'ด.ญ. กมลชนก เลิศวิไล',
    gender: 'FEMALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 98.0,
    morningStatusLabel: 'มาเข้าแถวปกติ',
    midtermScore: 19,
    finalScore: 28,
  },
  {
    sgsSeatNo: 7,
    studentCode: '45112',
    studentName: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์',
    gender: 'FEMALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 91.0,
    morningStatusLabel: 'อนุมัติลาป่วยแล้ว',
    midtermScore: 16,
    finalScore: 25,
  },
  {
    sgsSeatNo: 8,
    studentCode: '45118',
    studentName: 'ด.ญ. อคิราห์ วิรากร',
    gender: 'FEMALE',
    classroom: 'ม.3/1',
    transferState: 'ACTIVE',
    attendancePercent: 94.0,
    morningStatusLabel: 'มาเข้าแถวปกติ',
    midtermScore: 16,
    finalScore: 24,
  },
];

const INITIAL_TERM_ASSIGNMENTS: TermAssignmentItem[] = [
  {
    id: 'asg-1',
    orderNo: 1,
    title: 'ใบงานที่ 1: วงจรสีธรรมชาติ',
    sgsUnit: 'u1',
    sgsUnitLabel: 'หน่วยที่ 1 (15 คะแนน)',
    maxScore: 10,
    assignedDate: '18 พ.ค. 69',
    dueDate: '25 พ.ค. 69',
  },
  {
    id: 'asg-2',
    orderNo: 2,
    title: 'ชิ้นงานที่ 2: แรงเงาแสงเงาหุ่นนิ่ง',
    sgsUnit: 'u1',
    sgsUnitLabel: 'หน่วยที่ 1 (15 คะแนน)',
    maxScore: 5,
    assignedDate: '1 มิ.ย. 69',
    dueDate: '8 มิ.ย. 69',
  },
  {
    id: 'asg-3',
    orderNo: 3,
    title: 'ชิ้นงานที่ 3: ภาพพิมพ์วัสดุธรรมชาติ',
    sgsUnit: 'u2',
    sgsUnitLabel: 'หน่วยที่ 2 (20 คะแนน)',
    maxScore: 10,
    assignedDate: '10 ก.ค. 69',
    dueDate: '20 ก.ค. 69',
  },
  {
    id: 'asg-4',
    orderNo: 4,
    title: 'ชิ้นงานที่ 4: โปสเตอร์รักษ์สิ่งแวดล้อม',
    sgsUnit: 'u2',
    sgsUnitLabel: 'หน่วยที่ 2 (20 คะแนน)',
    maxScore: 10,
    assignedDate: '5 ส.ค. 69',
    dueDate: '15 ส.ค. 69',
  },
  {
    id: 'asg-5',
    orderNo: 5,
    title: 'ชิ้นงานที่ 5: ศิลปะร่วมสมัยไทย',
    sgsUnit: 'u3',
    sgsUnitLabel: 'หน่วยที่ 3 (15 คะแนน)',
    maxScore: 15,
    assignedDate: '10 ก.ย. 69',
    dueDate: '25 ก.ย. 69',
  },
];

const INITIAL_SUBMISSIONS: StudentWorkSubmission[] = [
  // เลขที่ 1 กฤษณะ (ส่งครบ ตรวจแล้ว 4 รอตรวจ 1)
  { assignmentId: 'asg-1', studentCode: '45101', status: 'GRADED', score: 9, submittedAt: '24 พ.ค. 10:15', workTitle: 'ภาพวาดวงจรสี 12 สี.jpg' },
  { assignmentId: 'asg-2', studentCode: '45101', status: 'GRADED', score: 5, submittedAt: '7 มิ.ย. 14:00', workTitle: 'แรงเงาแจกันและผลไม้.jpg' },
  { assignmentId: 'asg-3', studentCode: '45101', status: 'GRADED', score: 9, submittedAt: '19 ก.ค. 09:20', workTitle: 'ภาพพิมพ์ใบไม้ก้านกล้วย.jpg' },
  { assignmentId: 'asg-4', studentCode: '45101', status: 'GRADED', score: 9, submittedAt: '14 ส.ค. 11:10', workTitle: 'โปสเตอร์ลดโลกร้อน.png' },
  { assignmentId: 'asg-5', studentCode: '45101', status: 'SUBMITTED_PENDING', score: null, submittedAt: '24 ก.ย. 15:30', workTitle: 'ลายไทยประยุกต์ร่วมสมัย.pdf' },

  // เลขที่ 2 ทัตธน (ส่งครบ)
  { assignmentId: 'asg-1', studentCode: '45102', status: 'GRADED', score: 10, submittedAt: '23 พ.ค. 09:00', workTitle: 'วงจรสีโปสเตอร์_ทัตธน.jpg' },
  { assignmentId: 'asg-2', studentCode: '45102', status: 'GRADED', score: 5, submittedAt: '6 มิ.ย. 13:20', workTitle: 'หุ่นนิ่งดินสอEE.jpg' },
  { assignmentId: 'asg-3', studentCode: '45102', status: 'GRADED', score: 9, submittedAt: '18 ก.ค. 16:00', workTitle: 'ภาพพิมพ์ธรรมชาติ.jpg' },
  { assignmentId: 'asg-4', studentCode: '45102', status: 'GRADED', score: 10, submittedAt: '14 ส.ค. 10:40', workTitle: 'โปสเตอร์รักษ์ป่าไม้.png' },
  { assignmentId: 'asg-5', studentCode: '45102', status: 'SUBMITTED_PENDING', score: null, submittedAt: '25 ก.ย. 08:15', workTitle: 'จิตรกรรมไทยร่วมสมัย_ทัตธน.jpg' },

  // เลขที่ 3 กมลชนก (ส่งครบ ตรวจครบ)
  { assignmentId: 'asg-1', studentCode: '45105', status: 'GRADED', score: 10, submittedAt: '22 พ.ค. 11:00', workTitle: 'วงจรสี_กมลชนก.jpg' },
  { assignmentId: 'asg-2', studentCode: '45105', status: 'GRADED', score: 5, submittedAt: '5 มิ.ย. 15:10', workTitle: 'แสงเงาดินสอ_กมลชนก.jpg' },
  { assignmentId: 'asg-3', studentCode: '45105', status: 'GRADED', score: 10, submittedAt: '17 ก.ค. 12:30', workTitle: 'ภาพพิมพ์ใบเฟิร์น.jpg' },
  { assignmentId: 'asg-4', studentCode: '45105', status: 'GRADED', score: 10, submittedAt: '13 ส.ค. 14:20', workTitle: 'SaveEarth_Poster.png' },
  { assignmentId: 'asg-5', studentCode: '45105', status: 'GRADED', score: 15, submittedAt: '22 ก.ย. 16:40', workTitle: 'ศิลปะไทยประยุกต์_กมลชนก.pdf' },

  // เลขที่ 4 ชัยมงคล (ย้ายออกกลางเทอม - ล็อกแถวตาม SGS)
  { assignmentId: 'asg-1', studentCode: '45107', status: 'EXEMPT_TRANSFERRED', score: null },
  { assignmentId: 'asg-2', studentCode: '45107', status: 'EXEMPT_TRANSFERRED', score: null },
  { assignmentId: 'asg-3', studentCode: '45107', status: 'EXEMPT_TRANSFERRED', score: null },
  { assignmentId: 'asg-4', studentCode: '45107', status: 'EXEMPT_TRANSFERRED', score: null },
  { assignmentId: 'asg-5', studentCode: '45107', status: 'EXEMPT_TRANSFERRED', score: null },

  // เลขที่ 5 พิมพ์ชนก (ส่งแล้ว 4 รอตรวจ 2)
  { assignmentId: 'asg-1', studentCode: '45112', status: 'GRADED', score: 9, submittedAt: '25 พ.ค. 08:50', workTitle: 'วงจรสี_พิมพ์ชนก.jpg' },
  { assignmentId: 'asg-2', studentCode: '45112', status: 'GRADED', score: 4, submittedAt: '8 มิ.ย. 10:10', workTitle: 'แรงเงาหุ่นนิ่ง.jpg' },
  { assignmentId: 'asg-3', studentCode: '45112', status: 'GRADED', score: 8, submittedAt: '20 ก.ค. 13:00', workTitle: 'ภาพพิมพ์ดอกไม้.jpg' },
  { assignmentId: 'asg-4', studentCode: '45112', status: 'SUBMITTED_PENDING', score: null, submittedAt: '15 ส.ค. 17:00', workTitle: 'โปสเตอร์คัดแยกขยะ.jpg' },
  { assignmentId: 'asg-5', studentCode: '45112', status: 'SUBMITTED_PENDING', score: null, submittedAt: '24 ก.ย. 19:20', workTitle: 'ศิลปะร่วมสมัย_พิมพ์ชนก.pdf' },

  // เลขที่ 6 อัศวิน (ค้างส่ง 3 งาน เสี่ยงติด ร)
  { assignmentId: 'asg-1', studentCode: '45115', status: 'GRADED', score: 7, submittedAt: '28 พ.ค. (ส่งช้า)', workTitle: 'วงจรสี_อัศวิน.jpg' },
  { assignmentId: 'asg-2', studentCode: '45115', status: 'GRADED', score: 4, submittedAt: '10 มิ.ย. (ส่งช้า)', workTitle: 'แรงเงา_อัศวิน.jpg' },
  { assignmentId: 'asg-3', studentCode: '45115', status: 'MISSING', score: null },
  { assignmentId: 'asg-4', studentCode: '45115', status: 'MISSING', score: null },
  { assignmentId: 'asg-5', studentCode: '45115', status: 'MISSING', score: null },

  // เลขที่ 7 อคิราห์ (ส่งแล้ว รอตรวจ 1 ค้าง 1)
  { assignmentId: 'asg-1', studentCode: '45118', status: 'GRADED', score: 9, submittedAt: '24 พ.ค. 14:10', workTitle: 'วงจรสี_อคิราห์.jpg' },
  { assignmentId: 'asg-2', studentCode: '45118', status: 'GRADED', score: 5, submittedAt: '7 มิ.ย. 11:30', workTitle: 'แรงเงา_อคิราห์.jpg' },
  { assignmentId: 'asg-3', studentCode: '45118', status: 'GRADED', score: 8, submittedAt: '19 ก.ค. 15:45', workTitle: 'ภาพพิมพ์วัสดุธรรมชาติ.jpg' },
  { assignmentId: 'asg-4', studentCode: '45118', status: 'SUBMITTED_PENDING', score: null, submittedAt: '15 ส.ค. 12:15', workTitle: 'โปสเตอร์ลดพลาสติก.png' },
  { assignmentId: 'asg-5', studentCode: '45118', status: 'MISSING', score: null },

  // เลขที่ 8 ณัฐวุฒิ (นักเรียนย้ายเข้าใหม่ 1 ก.ค. - งานที่ 1-2 เทียบโอนคะแนนหน่วย 1 จาก รร.เดิม, เริ่มส่งงานที่ 3-5)
  { assignmentId: 'asg-1', studentCode: '45109', status: 'EXEMPT_TRANSFERRED', score: 8, workTitle: 'เทียบโอนคะแนนจาก รร.เดิม' },
  { assignmentId: 'asg-2', studentCode: '45109', status: 'EXEMPT_TRANSFERRED', score: 4, workTitle: 'เทียบโอนคะแนนจาก รร.เดิม' },
  { assignmentId: 'asg-3', studentCode: '45109', status: 'GRADED', score: 8, submittedAt: '20 ก.ค. 16:00', workTitle: 'ภาพพิมพ์_ณัฐวุฒิ.jpg' },
  { assignmentId: 'asg-4', studentCode: '45109', status: 'GRADED', score: 9, submittedAt: '15 ส.ค. 09:40', workTitle: 'โปสเตอร์สิ่งแวดล้อม_ณัฐวุฒิ.jpg' },
  { assignmentId: 'asg-5', studentCode: '45109', status: 'SUBMITTED_PENDING', score: null, submittedAt: '25 ก.ย. 07:50', workTitle: 'ศิลปะร่วมสมัย_ณัฐวุฒิ.pdf' },
];

export const sgsRosterAndSubmissionService = {
  getSgsRoster(): SgsStudentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SGS_ROSTER);
      return raw ? JSON.parse(raw) : INITIAL_SGS_ROSTER;
    } catch {
      return INITIAL_SGS_ROSTER;
    }
  },

  saveSgsRoster(roster: SgsStudentRecord[]): SgsStudentRecord[] {
    localStorage.setItem(STORAGE_KEY_SGS_ROSTER, JSON.stringify(roster));
    return roster;
  },

  addTransferredInStudent(payload: {
    studentCode: string;
    studentName: string;
    gender: StudentGender;
    insertPosition: SgsInsertPosition;
    customSeatNo?: number;
    transferDate: string;
    transferredU1Score: number;
  }): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()].sort(
      (a, b) => a.sgsSeatNo - b.sgsSeatNo
    );

    let insertIndex = roster.length; // Default: ท้ายสุดของห้อง

    if (payload.insertPosition === 'AFTER_SAME_GENDER') {
      if (payload.gender === 'MALE') {
        // หาตำแหน่งสุดท้ายของนักเรียนชาย แล้วแทรกต่อท้ายผู้ชายทันที (เลื่อนเลขที่นักเรียนหญิงลงไป 1 ลำดับตาม SGS)
        let lastMaleIdx = -1;
        roster.forEach((s, idx) => {
          if (s.gender === 'MALE') lastMaleIdx = idx;
        });
        insertIndex = lastMaleIdx !== -1 ? lastMaleIdx + 1 : 0;
      } else {
        insertIndex = roster.length;
      }
    } else if (
      payload.insertPosition === 'CUSTOM_SEAT' &&
      payload.customSeatNo
    ) {
      insertIndex = Math.max(
        0,
        Math.min(roster.length, payload.customSeatNo - 1)
      );
    }

    const assignedSeatNo = insertIndex + 1;
    const positionLabel =
      payload.insertPosition === 'AFTER_SAME_GENDER' && payload.gender === 'MALE'
        ? `แทรกต่อท้ายกลุ่มนักเรียนชาย (เลขที่ ${assignedSeatNo})`
        : payload.insertPosition === 'CUSTOM_SEAT'
        ? `แทรกที่เลขที่ ${assignedSeatNo} ตามใบรายชื่อ SGS`
        : `ต่อท้ายสุดของห้อง (เลขที่ ${assignedSeatNo})`;

    const newStudent: SgsStudentRecord = {
      sgsSeatNo: assignedSeatNo,
      studentCode: payload.studentCode,
      studentName: payload.studentName,
      gender: payload.gender,
      classroom: 'ม.3/1',
      transferState: 'TRANSFERRED_IN',
      transferDate: payload.transferDate,
      transferNote: `ย้ายเข้าใหม่ (${payload.transferDate}) — ${positionLabel} + โอนคะแนนหน่วย 1 (${payload.transferredU1Score} คะแนน)`,
      transferredBaseScore: { u1: payload.transferredU1Score },
      attendancePercent: 100,
      morningStatusLabel: 'มาเข้าแถวปกติ (นักเรียนย้ายเข้าใหม่)',
      midtermScore: 15,
      finalScore: 22,
    };

    const nextRoster = [
      ...roster.slice(0, insertIndex),
      newStudent,
      ...roster.slice(insertIndex),
    ].map((stu, idx) => ({
      ...stu,
      sgsSeatNo: idx + 1, // รันเลขที่ SGS ใหม่ให้เรียงต่อเนื่องโดยคะแนนยังผูกตามรหัสนักเรียน (studentCode) 100%
    }));

    this.saveSgsRoster(nextRoster);
    return nextRoster;
  },

  // ปรับเลื่อนเลขที่นักเรียนขึ้น-ลง (▲/▼) ให้ตรงกับ SGS โดยที่คะแนนและงานที่ส่งผูกติดไปกับรหัสนักเรียนอัตโนมัติ
  moveStudentSeat(studentCode: string, direction: 'UP' | 'DOWN'): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()].sort(
      (a, b) => a.sgsSeatNo - b.sgsSeatNo
    );
    const idx = roster.findIndex((s) => s.studentCode === studentCode);
    if (idx === -1) return roster;
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= roster.length) return roster;

    const temp = roster[idx];
    roster[idx] = roster[targetIdx];
    roster[targetIdx] = temp;

    const renumbered = roster.map((stu, i) => ({
      ...stu,
      sgsSeatNo: i + 1,
    }));
    return this.saveSgsRoster(renumbered);
  },

  // จัดเรียงลำดับตามมาตรฐานทะเบียน SGS อัตโนมัติ (กลุ่มนักเรียนชายขึ้นก่อน -> ตามด้วยกลุ่มนักเรียนหญิง)
  sortRosterMaleFirstSgs(): SgsStudentRecord[] {
    const roster = [...this.getSgsRoster()];
    const males = roster.filter((s) => s.gender === 'MALE');
    const females = roster.filter((s) => s.gender === 'FEMALE');
    const renumbered = [...males, ...females].map((stu, i) => ({
      ...stu,
      sgsSeatNo: i + 1,
    }));
    return this.saveSgsRoster(renumbered);
  },

  toggleStudentTransferOut(studentCode: string): SgsStudentRecord[] {
    const roster = this.getSgsRoster().map((stu) => {
      if (stu.studentCode !== studentCode) return stu;
      const nextState: StudentTransferState =
        stu.transferState === 'TRANSFERRED_OUT' ? 'ACTIVE' : 'TRANSFERRED_OUT';
      return {
        ...stu,
        transferState: nextState,
        transferDate:
          nextState === 'TRANSFERRED_OUT' ? '2026-09-15' : undefined,
        transferNote:
          nextState === 'TRANSFERRED_OUT'
            ? `ย้ายออก (คงเลขที่ ${stu.sgsSeatNo} ไว้ตาม SGS เพื่อไม่ให้ลำดับถัดไปเลื่อนบรรทัด)`
            : undefined,
      };
    });
    return this.saveSgsRoster(roster);
  },

  getTermAssignments(): TermAssignmentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TERM_ASSIGNMENTS);
      return raw ? JSON.parse(raw) : INITIAL_TERM_ASSIGNMENTS;
    } catch {
      return INITIAL_TERM_ASSIGNMENTS;
    }
  },

  addTermAssignment(payload: {
    title: string;
    sgsUnit: 'u1' | 'u2' | 'u3';
    maxScore: number;
    dueDate: string;
  }): TermAssignmentItem[] {
    const list = this.getTermAssignments();
    const unitLabelMap = {
      u1: 'หน่วยที่ 1 (15 คะแนน)',
      u2: 'หน่วยที่ 2 (20 คะแนน)',
      u3: 'หน่วยที่ 3 (15 คะแนน)',
    };
    const newItem: TermAssignmentItem = {
      id: `asg-${Date.now()}`,
      orderNo: list.length + 1,
      title: payload.title,
      sgsUnit: payload.sgsUnit,
      sgsUnitLabel: unitLabelMap[payload.sgsUnit],
      maxScore: payload.maxScore,
      assignedDate: 'วันนี้',
      dueDate: payload.dueDate || '30 ก.ย. 69',
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEY_TERM_ASSIGNMENTS, JSON.stringify(updated));
    return updated;
  },

  getSubmissions(): StudentWorkSubmission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORK_SUBMISSIONS);
      return raw ? JSON.parse(raw) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  },

  saveSubmissions(list: StudentWorkSubmission[]): StudentWorkSubmission[] {
    localStorage.setItem(STORAGE_KEY_WORK_SUBMISSIONS, JSON.stringify(list));
    return list;
  },

  // อัปเดตคะแนนรายชิ้น (Inline Matrix หรือ SpeedGrader)
  gradeSubmission(
    assignmentId: string,
    studentCode: string,
    score: number | null,
    status: SubmissionCellStatus = 'GRADED'
  ): StudentWorkSubmission[] {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(
      (s) => s.assignmentId === assignmentId && s.studentCode === studentCode
    );
    const nextItem: StudentWorkSubmission =
      idx !== -1
        ? {
            ...subs[idx],
            score,
            status: score === null ? 'MISSING' : status,
            submittedAt: subs[idx].submittedAt || 'ครูตรวจบันทึกคะแนน',
          }
        : {
            assignmentId,
            studentCode,
            score,
            status: score === null ? 'MISSING' : status,
            submittedAt: 'ครูตรวจบันทึกคะแนน',
            workTitle: 'ส่งงานหน้าชั้นเรียน',
          };

    const updated =
      idx !== -1
        ? subs.map((item, i) => (i === idx ? nextItem : item))
        : [...subs, nextItem];

    return this.saveSubmissions(updated);
  },

  // 1-Click Bulk Action: ให้คะแนนเต็มทุกคนที่ส่งงานแล้ว (รอตรวจ -> ตรวจเสร็จทันที)
  bulkGradeAllSubmitted(assignmentId?: string): StudentWorkSubmission[] {
    const assignments = this.getTermAssignments();
    const subs = this.getSubmissions().map((sub) => {
      if (assignmentId && sub.assignmentId !== assignmentId) return sub;
      if (sub.status === 'SUBMITTED_PENDING') {
        const asg = assignments.find((a) => a.id === sub.assignmentId);
        return {
          ...sub,
          status: 'GRADED' as const,
          score: asg ? asg.maxScore : 10,
        };
      }
      return sub;
    });
    return this.saveSubmissions(subs);
  },

  // คำนวณคะแนนเก็บหน่วยที่ 1, 2, 3 ของนักเรียนแต่ละคนจากตารางส่งงานอัตโนมัติ
  computeStudentSgsGrades(student: SgsStudentRecord): {
    u1: number;
    u2: number;
    u3: number;
    midterm: number;
    final: number;
    total: number;
    gradeLabel: string;
    submittedCount: number;
    totalAssignedCount: number;
    missingCount: number;
    pendingReviewCount: number;
  } {
    const assignments = this.getTermAssignments();
    const subs = this.getSubmissions().filter(
      (s) => s.studentCode === student.studentCode
    );

    if (student.transferState === 'TRANSFERRED_OUT') {
      return {
        u1: 0,
        u2: 0,
        u3: 0,
        midterm: 0,
        final: 0,
        total: 0,
        gradeLabel: 'ย้ายออก',
        submittedCount: 0,
        totalAssignedCount: assignments.length,
        missingCount: 0,
        pendingReviewCount: 0,
      };
    }

    let u1 = 0;
    let u2 = 0;
    let u3 = 0;
    let submittedCount = 0;
    let missingCount = 0;
    let pendingReviewCount = 0;

    for (const asg of assignments) {
      const sub = subs.find((s) => s.assignmentId === asg.id);
      if (
        sub &&
        (sub.status === 'GRADED' ||
          sub.status === 'SUBMITTED_PENDING' ||
          sub.status === 'EXEMPT_TRANSFERRED')
      ) {
        submittedCount += 1;
        if (sub.status === 'SUBMITTED_PENDING') {
          pendingReviewCount += 1;
        }
        const earned =
          sub.score !== null && sub.score !== undefined
            ? sub.score
            : sub.status === 'SUBMITTED_PENDING'
            ? asg.maxScore // คาดการณ์คะแนนหรือรอตรวจ
            : 0;
        if (asg.sgsUnit === 'u1') u1 += earned;
        if (asg.sgsUnit === 'u2') u2 += earned;
        if (asg.sgsUnit === 'u3') u3 += earned;
      } else {
        missingCount += 1;
      }
    }

    // ถ้านักเรียนย้ายเข้าใหม่ มีคะแนนโอนหน่วยที่ 1
    if (
      student.transferState === 'TRANSFERRED_IN' &&
      student.transferredBaseScore?.u1 &&
      u1 === 0
    ) {
      u1 = student.transferredBaseScore.u1;
    }

    const total = u1 + u2 + u3 + student.midtermScore + student.finalScore;

    let gradeLabel = '0';
    if (student.attendancePercent < 80) {
      gradeLabel = 'มส.';
    } else if (missingCount >= 2) {
      gradeLabel = 'ร';
    } else if (total >= 80) {
      gradeLabel = '4.0';
    } else if (total >= 75) {
      gradeLabel = '3.5';
    } else if (total >= 70) {
      gradeLabel = '3.0';
    } else if (total >= 65) {
      gradeLabel = '2.5';
    } else if (total >= 60) {
      gradeLabel = '2.0';
    } else if (total >= 55) {
      gradeLabel = '1.5';
    } else if (total >= 50) {
      gradeLabel = '1.0';
    }

    return {
      u1,
      u2,
      u3,
      midterm: student.midtermScore,
      final: student.finalScore,
      total,
      gradeLabel,
      submittedCount,
      totalAssignedCount: assignments.length,
      missingCount,
      pendingReviewCount,
    };
  },
};
