import type {
  AtRiskStudent,
  IncompleteGradingItem,
  LowestAssignmentItem,
  GradeDistributionItem,
  StudentProfileDetail,
  StudentQuestItem,
  SarCourseSummary,
  SarGradeMatrixRow,
  TeachingClassSummary,
  ExamItem,
  TeacherAssignment,
  ReadinessCheckItem,
  CourseCurriculumItem,
  ClassroomRosterItem,
  TimetableSlot,
  SoftDeletedItem,
} from '../types/viewModels';

// ----------------------------------------------------
// SCREEN 1: แดชบอร์ดชั้นเรียน ศ23101 ศิลปะ ม.3/1
// ----------------------------------------------------

export const atRiskStudentsData: AtRiskStudent[] = [
  {
    enrollmentId: 'enr-10',
    studentNo: 10,
    name: 'ด.ช. อัศวิน วนเกษตรกุล',
    tags: [
      { text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' },
      { text: 'ค้าง 3 ชิ้น', type: 'warning' },
    ],
    attendanceRatio: '0 / 8',
    totalScore: 34.3,
  },
  {
    enrollmentId: 'enr-12',
    studentNo: 12,
    name: 'ด.ช. ชัยมงคล วงศ์บุตร',
    tags: [
      { text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' },
      { text: 'ค้าง 3 ชิ้น', type: 'warning' },
    ],
    attendanceRatio: '0 / 8',
    totalScore: 35.0,
  },
  {
    enrollmentId: 'enr-7',
    studentNo: 7,
    name: 'ด.ช. ภูรินท์ บัณฑิต',
    tags: [{ text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' }],
    attendanceRatio: '4 / 8',
    totalScore: 28.3,
  },
  {
    enrollmentId: 'enr-22',
    studentNo: 22,
    name: 'ด.ญ. อคิราห์ วิรากร',
    tags: [{ text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' }],
    attendanceRatio: '2 / 8',
    totalScore: 39.0,
  },
];

export const incompleteGradingData: IncompleteGradingItem[] = [
  {
    id: 'inc-1',
    missingCount: 23,
    title: 'วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ',
    type: 'video',
    subtitle: 'ยังไม่มีคะแนน',
  },
  {
    id: 'inc-2',
    missingCount: 20,
    title: 'สอบอ่านโน้ตเพลงล่องแม่ปิง',
    type: 'exam',
    subtitle: 'ยังไม่มีคะแนน',
  },
  {
    id: 'inc-3',
    missingCount: 2,
    title: 'เพลงแบบเพลง',
    type: 'music',
    subtitle: 'ยังไม่มีคะแนน',
  },
];

export const lowestAssignmentsData: LowestAssignmentItem[] = [
  {
    id: 'low-1',
    title: 'สอบกลางภาค ศ23101',
    averagePercent: 81,
    type: 'exam',
  },
  {
    id: 'low-2',
    title: 'My Soundtrack',
    averagePercent: 83,
    type: 'audio',
  },
  {
    id: 'low-3',
    title: 'เพลงแบบเพลง',
    averagePercent: 88,
    type: 'audio',
  },
  {
    id: 'low-4',
    title: 'อินโฟกราฟิก องค์ประกอบทางดนตรี',
    averagePercent: 98,
    type: 'infographic',
  },
  {
    id: 'low-5',
    title: 'สอบอ่านโน้ตเพลงล่องแม่ปิง พร้อมปรบมือ',
    averagePercent: 100,
    type: 'exam',
  },
];

export const gradeDistributionData: GradeDistributionItem[] = [
  { grade: '4', count: 0, percent: 0 },
  { grade: '3.5', count: 0, percent: 0 },
  { grade: '3', count: 0, percent: 0 },
  { grade: '2.5', count: 0, percent: 0 },
  { grade: '2', count: 1, percent: 4 },
  { grade: '1.5', count: 1, percent: 4 },
  { grade: '1', count: 3, percent: 11 },
  { grade: '0', count: 21, percent: 81 },
];

// ----------------------------------------------------
// SCREEN 2: วิเคราะห์นักเรียนรายบุคคล ด.ช. ทัตธน คำฝั้น
// ----------------------------------------------------

export const studentTatthanProfile: StudentProfileDetail = {
  id: 'stu-tatthan',
  name: 'ด.ช. ทัตธน คำฝั้น',
  studentNo: 15,
  classroomName: 'ม.3/1',
  subjectCode: 'ศ20221',
  subjectName: 'ดนตรีปฏิบัติตามความถนัด 1',
  peerCount: 26,
  radarMetrics: [
    { dimension: 'คะแนนเก็บ', studentScore: 67, classAverage: 70, diff: -3 },
    { dimension: 'คะแนนสอบ', studentScore: 60, classAverage: 62, diff: -2 },
    { dimension: 'ส่งงานตรงเวลา', studentScore: 100, classAverage: 85, diff: 15 },
    { dimension: 'เวลาเรียน', studentScore: 90, classAverage: 94, diff: -4 },
    { dimension: 'พฤติกรรม', studentScore: 100, classAverage: 99, diff: 1 },
  ],
  weakestPoint: { dimension: 'เวลาเรียน', diff: -4 },
  strongestPoint: { dimension: 'ส่งงานตรงเวลา', diff: 15 },
  specialNotes: [],
};

// ----------------------------------------------------
// SCREEN 3: ห้องเรียนผจญภัย (มุมมองนักเรียน ด.ช. จิรายุ)
// ----------------------------------------------------

export const studentAdventureQuests: StudentQuestItem[] = [
  {
    id: 'quest-1',
    subjectTitle: 'ศิลปะ · ศ23101',
    title: 'วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ',
    dueDateText: 'ส่งภายใน ไม่กำหนด',
    maxScore: 10,
    xpReward: 30,
    status: 'PENDING',
    statusLabel: 'รอส่งงาน',
  },
  {
    id: 'quest-2',
    subjectTitle: 'ศิลปะ · ศ23101',
    title: 'My Soundtrack: บันทึกเสียงดนตรีประกอบภาพยนตร์',
    dueDateText: 'ส่งภายใน 30 ก.ย. 2569',
    maxScore: 15,
    xpReward: 50,
    status: 'SUBMITTED',
    statusLabel: 'ส่งแล้ว (รอตรวจ)',
  },
  {
    id: 'quest-3',
    subjectTitle: 'ดนตรีปฏิบัติตามความถนัด · ศ20221',
    title: 'สอบอ่านโน้ตเพลงล่องแม่ปิง พร้อมปรบมือ',
    dueDateText: 'สอบในคาบเรียน',
    maxScore: 20,
    xpReward: 60,
    status: 'ALL',
    statusLabel: 'ตรวจแล้ว (ได้ 20/20)',
  },
];

// ----------------------------------------------------
// SCREEN 4: เทียบผลข้ามห้อง & รายงาน SAR / วPA
// ----------------------------------------------------

export const sarCourseSummaries: SarCourseSummary[] = [
  {
    id: 'sar-1',
    subjectCode: 'ศ20221',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 1',
    level: 'ม.1',
    rooms: 'ม.1/8',
    studentCount: 27,
    gradedRatio: '-%',
    averageScore: 71.1,
    passedThresholdCount: 19,
    passedThresholdPercent: 70.4,
  },
  {
    id: 'sar-2',
    subjectCode: 'ศ20223',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 3',
    level: 'ม.2',
    rooms: 'ม.2/8',
    studentCount: 35,
    gradedRatio: '-%',
    averageScore: 87.2,
    passedThresholdCount: 31,
    passedThresholdPercent: 88.6,
  },
  {
    id: 'sar-3',
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ',
    level: 'ม.3',
    rooms: 'ม.3/1, ม.3/2, ม.3/5, ม.3/6, ม.3/7, ม.3/8',
    studentCount: 182,
    gradedRatio: '-%',
    averageScore: 80.5,
    passedThresholdCount: 152,
    passedThresholdPercent: 83.5,
  },
  {
    id: 'sar-4',
    subjectCode: 'ศ23265',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 5',
    level: 'ม.3',
    rooms: 'ม.3/8',
    studentCount: 32,
    gradedRatio: '-%',
    averageScore: 92.4,
    passedThresholdCount: 32,
    passedThresholdPercent: 100.0,
  },
];

export const sarGradeMatrixRows: SarGradeMatrixRow[] = [
  {
    id: 'gm-1',
    subjectLabel: 'ศ20221 ม.1',
    grades: {
      g4: { count: 9, percent: 33 },
      g3_5: { count: 5, percent: 19 },
      g3: { count: 5, percent: 19 },
      g2_5: { count: 5, percent: 19 },
      g2: { count: 0, percent: 0 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 1, percent: 4 },
      g0: { count: 2, percent: 7 },
    },
  },
  {
    id: 'gm-2',
    subjectLabel: 'ศ20223 ม.2',
    grades: {
      g4: { count: 30, percent: 86 },
      g3_5: { count: 1, percent: 3 },
      g3: { count: 0, percent: 0 },
      g2_5: { count: 0, percent: 0 },
      g2: { count: 2, percent: 6 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 0, percent: 0 },
      g0: { count: 2, percent: 6 },
    },
  },
  {
    id: 'gm-3',
    subjectLabel: 'ศ23101 ม.3',
    grades: {
      g4: { count: 114, percent: 63 },
      g3_5: { count: 25, percent: 14 },
      g3: { count: 13, percent: 7 },
      g2_5: { count: 11, percent: 6 },
      g2: { count: 6, percent: 3 },
      g1_5: { count: 4, percent: 2 },
      g1: { count: 1, percent: 1 },
      g0: { count: 8, percent: 4 },
    },
  },
  {
    id: 'gm-4',
    subjectLabel: 'ศ23265 ม.3',
    grades: {
      g4: { count: 31, percent: 97 },
      g3_5: { count: 0, percent: 0 },
      g3: { count: 1, percent: 3 },
      g2_5: { count: 0, percent: 0 },
      g2: { count: 0, percent: 0 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 0, percent: 0 },
      g0: { count: 0, percent: 0 },
    },
  },
];

// ----------------------------------------------------
// Extended Data for All Other Pages Across System
// ----------------------------------------------------

export const teachingClassesData: TeachingClassSummary[] = [
  {
    id: 'cls-1',
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ',
    roomName: 'ม.3/1',
    studentCount: 26,
    gradedPercentage: 74,
    averageScore: 78.5,
    atRiskCount: 4,
  },
  {
    id: 'cls-2',
    subjectCode: 'ศ23101',
    subjectName: 'ศิลปะ',
    roomName: 'ม.3/2',
    studentCount: 30,
    gradedPercentage: 88,
    averageScore: 82.1,
    atRiskCount: 1,
  },
  {
    id: 'cls-3',
    subjectCode: 'ศ20221',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 1',
    roomName: 'ม.1/8',
    studentCount: 27,
    gradedPercentage: 65,
    averageScore: 71.1,
    atRiskCount: 3,
  },
  {
    id: 'cls-4',
    subjectCode: 'ศ20223',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 3',
    roomName: 'ม.2/8',
    studentCount: 35,
    gradedPercentage: 92,
    averageScore: 87.2,
    atRiskCount: 0,
  },
  {
    id: 'cls-5',
    subjectCode: 'ศ23265',
    subjectName: 'ดนตรีปฏิบัติตามความถนัด 5',
    roomName: 'ม.3/8',
    studentCount: 32,
    gradedPercentage: 95,
    averageScore: 92.4,
    atRiskCount: 0,
  },
];

export const examsData: ExamItem[] = [
  {
    id: 'ex-1',
    title: 'สอบกลางภาค ภาคเรียนที่ 1/2569',
    subjectCode: 'ศ23101 ศิลปะ',
    roomName: 'ม.3/1 - ม.3/8',
    sgsUnitName: 'สอบกลางภาค (หน่วยที่ 3)',
    maxScore: 20,
    date: '15 ส.ค. 2569',
    status: 'LOCKED',
    averageScore: 16.4,
    highestScore: 20,
    lowestScore: 8.5,
  },
  {
    id: 'ex-2',
    title: 'สอบอ่านโน้ตเพลงไทยและสากล',
    subjectCode: 'ศ20221 ดนตรีปฏิบัติ 1',
    roomName: 'ม.1/8',
    sgsUnitName: 'ทักษะการปฏิบัติ 1',
    maxScore: 15,
    date: '28 ส.ค. 2569',
    status: 'GRADING',
    averageScore: 12.8,
    highestScore: 15,
    lowestScore: 6,
  },
  {
    id: 'ex-3',
    title: 'สอบปลายภาค ภาคเรียนที่ 1/2569',
    subjectCode: 'ศ23101 ศิลปะ',
    roomName: 'ม.3/1 - ม.3/8',
    sgsUnitName: 'สอบปลายภาค',
    maxScore: 30,
    date: '4 ต.ค. 2569',
    status: 'UPCOMING',
  },
];

export const teacherAssignmentsData: TeacherAssignment[] = [
  {
    id: 'asg-1',
    title: 'วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ',
    subjectCode: 'ศ23101 ศิลปะ',
    roomName: 'ม.3/1',
    sgsUnit: 'ประวัติดนตรีไทย',
    maxScore: 10,
    dueDate: '25 ก.ย. 2569',
    submittedCount: 22,
    totalStudents: 26,
    gradedCount: 3,
    xpReward: 30,
    status: 'ACTIVE',
  },
  {
    id: 'asg-2',
    title: 'My Soundtrack: บันทึกเสียงดนตรีประกอบภาพยนตร์',
    subjectCode: 'ศ23101 ศิลปะ',
    roomName: 'ม.3/1',
    sgsUnit: 'ความคิดสร้างสรรค์ทางดนตรี',
    maxScore: 15,
    dueDate: '10 ก.ย. 2569',
    submittedCount: 26,
    totalStudents: 26,
    gradedCount: 26,
    xpReward: 50,
    status: 'GRADED',
  },
  {
    id: 'asg-3',
    title: 'อินโฟกราฟิก องค์ประกอบทางดนตรี',
    subjectCode: 'ศ20221 ดนตรีปฏิบัติ 1',
    roomName: 'ม.1/8',
    sgsUnit: 'ทฤษฎีดนตรีพื้นฐาน',
    maxScore: 10,
    dueDate: '20 ส.ค. 2569',
    submittedCount: 25,
    totalStudents: 27,
    gradedCount: 25,
    xpReward: 30,
    status: 'GRADED',
  },
];

export const readinessChecklistData: ReadinessCheckItem[] = [
  {
    id: 'rc-1',
    task: 'โครงสร้างสัดส่วนคะแนนเก็บครบ 100 คะแนน',
    category: 'SGS',
    isComplete: true,
    actionLabel: 'ตรวจสอบแล้ว',
    details: 'วิชา ศ23101 กำหนด 15 + 20 + 20 + 15 + 30 = 100 คะแนนครบถ้วน',
  },
  {
    id: 'rc-2',
    task: 'ไม่มีคะแนนค้างกรอกในระบบ',
    category: 'SCORES',
    isComplete: false,
    actionLabel: 'ตรวจงานค้าง',
    details: 'ยังเหลืองาน 3 ชิ้นที่กรอกคะแนนไม่ครบ (เช่น วิดีโอนำเสนอดนตรีไทย ค้าง 23 คน)',
  },
  {
    id: 'rc-3',
    task: 'ตรวจสอบเกณฑ์เวลาเรียน (ไม่ต่ำกว่า 80%)',
    category: 'ATTENDANCE',
    isComplete: false,
    actionLabel: 'ดูผู้เสี่ยง มส.',
    details: 'มีนักเรียน 1 คนขาดเรียน 4 คาบจาก 8 คาบ (เสี่ยงติด มส.)',
  },
  {
    id: 'rc-4',
    task: 'ตัดเกรดจำลองและตรวจสอบนักเรียนต่ำกว่าเกณฑ์',
    category: 'SCORES',
    isComplete: true,
    actionLabel: 'ดูตารางแจกแจงเกรด',
    details: 'ระบบประเมินเบื้องต้น: เกรด 3 ขึ้นไป 84.8%, มีนักเรียนที่ต้องดูแล 4 คน',
  },
];

export const coursesCurriculumData: CourseCurriculumItem[] = [
  {
    id: 'c-1',
    code: 'ศ23101',
    name: 'ศิลปะ (ทัศนศิลป์ ดนตรี นาฏศิลป์)',
    level: 'มัธยมศึกษาปีที่ 3',
    credits: 1.5,
    periodsPerWeek: 3,
    units: [
      { name: 'หน่วยที่ 1: ทัศนศิลป์กับวัฒนธรรม', maxScore: 15, sgsRef: 'หน่วยที่ 1' },
      { name: 'หน่วยที่ 2: ดนตรีไทยและสากล', maxScore: 20, sgsRef: 'หน่วยที่ 2' },
      { name: 'หน่วยที่ 3: สอบกลางภาค', maxScore: 20, sgsRef: 'กลางภาค' },
      { name: 'หน่วยที่ 4: นาฏศิลป์และการละคร', maxScore: 15, sgsRef: 'หน่วยที่ 3' },
      { name: 'หน่วยที่ 5: สอบปลายภาค', maxScore: 30, sgsRef: 'ปลายภาค' },
    ],
  },
  {
    id: 'c-2',
    code: 'ศ20221',
    name: 'ดนตรีปฏิบัติตามความถนัด 1',
    level: 'มัธยมศึกษาปีที่ 1',
    credits: 1.0,
    periodsPerWeek: 2,
    units: [
      { name: 'หน่วยที่ 1: ทฤษฎีโน้ตและโสตทักษะ', maxScore: 25, sgsRef: 'หน่วยที่ 1' },
      { name: 'หน่วยที่ 2: เทคนิคเครื่องดนตรีเบื้องต้น', maxScore: 25, sgsRef: 'หน่วยที่ 2' },
      { name: 'หน่วยที่ 3: สอบกลางภาคปฏิบัติ', maxScore: 20, sgsRef: 'กลางภาค' },
      { name: 'หน่วยที่ 4: สอบรวมวงปลายภาค', maxScore: 30, sgsRef: 'ปลายภาค' },
    ],
  },
];

export const classroomsListData: ClassroomRosterItem[] = [
  {
    id: 'room-3-1',
    name: 'มัธยมศึกษาปีที่ 3/1',
    level: 'ม.3',
    roomNumber: 'ม.3/1',
    adviser: 'ครูภาสภูมิ เรืองปราชญ์',
    studentCount: 26,
  },
  {
    id: 'room-3-2',
    name: 'มัธยมศึกษาปีที่ 3/2',
    level: 'ม.3',
    roomNumber: 'ม.3/2',
    adviser: 'ครูวิภาดา สมบูรณ์',
    studentCount: 30,
  },
  {
    id: 'room-1-8',
    name: 'มัธยมศึกษาปีที่ 1/8',
    level: 'ม.1',
    roomNumber: 'ม.1/8',
    adviser: 'ครูเอกชัย มิ่งขวัญ',
    studentCount: 27,
  },
  {
    id: 'room-2-8',
    name: 'มัธยมศึกษาปีที่ 2/8',
    level: 'ม.2',
    roomNumber: 'ม.2/8',
    adviser: 'ครูชนิกา ทรัพย์สุข',
    studentCount: 35,
  },
];

export const timetableScheduleData: TimetableSlot[] = [
  {
    day: 'จันทร์',
    period: 1,
    time: '08:30 - 09:20',
    subjectCode: 'ศ23101 ศิลปะ',
    subjectName: 'ศิลปะ',
    room: 'ม.3/1',
    classroomId: 'cls-1',
    isConducted: true,
  },
  {
    day: 'จันทร์',
    period: 2,
    time: '09:20 - 10:10',
    subjectCode: 'ศ23101 ศิลปะ',
    subjectName: 'ศิลปะ',
    room: 'ม.3/2',
    classroomId: 'cls-2',
    isConducted: true,
  },
  {
    day: 'อังคาร',
    period: 3,
    time: '10:20 - 11:10',
    subjectCode: 'ศ20221 ดนตรีปฏิบัติ 1',
    subjectName: 'ดนตรีปฏิบัติ 1',
    room: 'ม.1/8',
    classroomId: 'cls-3',
    isConducted: true,
  },
  {
    day: 'พุธ',
    period: 4,
    time: '11:10 - 12:00',
    subjectCode: 'ศ20223 ดนตรีปฏิบัติ 3',
    subjectName: 'ดนตรีปฏิบัติ 3',
    room: 'ม.2/8',
    classroomId: 'cls-4',
    isConducted: false,
  },
  {
    day: 'พฤหัสบดี',
    period: 2,
    time: '09:20 - 10:10',
    subjectCode: 'ศ23265 ดนตรีปฏิบัติ 5',
    subjectName: 'ดนตรีปฏิบัติ 5',
    room: 'ม.3/8',
    classroomId: 'cls-5',
    isConducted: false,
  },
];

export const softDeletedData: SoftDeletedItem[] = [
  {
    id: 'del-1',
    entityType: 'งาน/การบ้าน',
    name: 'แบบฝึกหัดเรื่อง โน้ตสากลเบื้องต้น (ร่างเดิม)',
    deletedAt: '20 ก.ย. 2569 14:22',
    deletedBy: 'ครูภาสภูมิ',
    daysRemaining: 27,
  },
  {
    id: 'del-2',
    entityType: 'ชุดข้อสอบ',
    name: 'ควิซเก็บคะแนนย่อยบทที่ 1 (ซ้ำซ้อน)',
    deletedAt: '12 ก.ย. 2569 09:15',
    deletedBy: 'ครูภาสภูมิ',
    daysRemaining: 19,
  },
];
