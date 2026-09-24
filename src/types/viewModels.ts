// ==========================================
// View Models for the Entire Classroom System
// ==========================================

export interface AtRiskStudent {
  enrollmentId: string;
  studentNo: number; // เลขที่ เช่น 10
  name: string; // เช่น ด.ช. อัศวิน วนเกษตรกุล
  tags: Array<{
    text: string;
    type: 'danger' | 'warning' | 'info';
  }>;
  attendanceRatio: string; // เช่น "0 / 8", "4 / 8"
  totalScore: number; // เช่น 34.3
}

export interface IncompleteGradingItem {
  id: string;
  missingCount: number; // เช่น 23, 20, 2
  title: string; // เช่น วิดีโอนำเสนอดนตรีไทยในสมัย...
  type: 'video' | 'exam' | 'music' | 'file';
  subtitle: string; // "ยังไม่มีคะแนน"
}

export interface LowestAssignmentItem {
  id: string;
  title: string;
  averagePercent: number; // เช่น 81, 83, 88, 98, 100
  type: 'exam' | 'audio' | 'infographic';
}

export interface GradeDistributionItem {
  grade: '4' | '3.5' | '3' | '2.5' | '2' | '1.5' | '1' | '0';
  count: number;
  percent: number;
}

export interface RadarDimensionMetric {
  dimension: string; // 'คะแนนเก็บ' | 'คะแนนสอบ' | 'ส่งงานตรงเวลา' | 'เวลาเรียน' | 'พฤติกรรม'
  studentScore: number;
  classAverage: number;
  diff: number; // e.g. +15 or -4
}

export interface StudentProfileDetail {
  id: string;
  name: string;
  studentNo: number;
  classroomName: string; // ม.3/1
  subjectCode: string; // ศ20221
  subjectName: string; // ดนตรีปฏิบัติตามความถนัด 1
  radarMetrics: RadarDimensionMetric[];
  peerCount: number; // 26 คน
  weakestPoint: { dimension: string; diff: number };
  strongestPoint: { dimension: string; diff: number };
  specialNotes: Array<{
    id: string;
    date: string;
    text: string;
    author: string;
  }>;
}

export interface StudentQuestItem {
  id: string;
  subjectTitle: string; // "ศิลปะ · ศ23101"
  title: string; // "วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ"
  dueDateText: string; // "ส่งภายใน ไม่กำหนด"
  maxScore: number; // 10 คะแนน
  xpReward: number; // 30 XP
  status: 'PENDING' | 'SUBMITTED' | 'ALL';
  statusLabel: string; // "รอส่งงาน"
}

export interface SarCourseSummary {
  id: string;
  subjectCode: string; // ศ20221
  subjectName: string; // ดนตรีปฏิบัติตามความถนัด 1
  level: string; // ม.1
  rooms: string; // ม.1/8
  studentCount: number; // 27
  gradedRatio: string; // -%
  averageScore: number; // 71.1
  passedThresholdCount: number; // 19
  passedThresholdPercent: number; // 70.4%
}

export interface SarGradeMatrixRow {
  id: string;
  subjectLabel: string; // "ศ20221 ม.1"
  grades: {
    g4: { count: number; percent: number };
    g3_5: { count: number; percent: number };
    g3: { count: number; percent: number };
    g2_5: { count: number; percent: number };
    g2: { count: number; percent: number };
    g1_5: { count: number; percent: number };
    g1: { count: number; percent: number };
    g0: { count: number; percent: number };
  };
}

// ----------------------------------------------------
// Extended Models for Global Dashboard & All Pages
// ----------------------------------------------------

export interface TeachingClassSummary {
  id: string;
  subjectCode: string;
  subjectName: string;
  roomName: string; // e.g. "ม.3/1"
  studentCount: number;
  gradedPercentage: number;
  averageScore: number;
  atRiskCount: number;
}

export interface ExamItem {
  id: string;
  title: string;
  subjectCode: string;
  roomName: string;
  sgsUnitName: string;
  maxScore: number;
  date: string;
  status: 'UPCOMING' | 'GRADING' | 'LOCKED';
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  subjectCode: string;
  roomName: string;
  sgsUnit: string;
  maxScore: number;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  gradedCount: number;
  xpReward: number;
  status: 'ACTIVE' | 'DUE' | 'GRADED';
}

export interface ReadinessCheckItem {
  id: string;
  task: string;
  category: 'SCORES' | 'ATTENDANCE' | 'SGS';
  isComplete: boolean;
  actionLabel: string;
  details: string;
}

export interface CourseCurriculumItem {
  id: string;
  code: string;
  name: string;
  level: string;
  credits: number;
  periodsPerWeek: number;
  units: Array<{
    name: string;
    maxScore: number;
    sgsRef: string;
  }>;
}

export interface ClassroomRosterItem {
  id: string;
  name: string;
  level: string;
  roomNumber: string;
  adviser: string;
  studentCount: number;
}

export interface TimetableSlot {
  day: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์';
  period: number; // 1 to 8
  time: string; // e.g. "08:30 - 09:20"
  subjectCode: string;
  subjectName: string;
  room: string;
  classroomId: string;
  isConducted: boolean;
}

export interface SoftDeletedItem {
  id: string;
  entityType: 'ชั้นเรียน' | 'งาน/การบ้าน' | 'ชุดข้อสอบ' | 'นักเรียน';
  name: string;
  deletedAt: string;
  deletedBy: string;
  daysRemaining: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudentLeaderboardEntry {
  rank: number;
  name: string;
  classroom: string;
  xp: number;
  streakDays: number;
  avatarText: string;
  isCurrentUser?: boolean;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  iconType: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercent?: number;
  tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'SPECIAL';
}

