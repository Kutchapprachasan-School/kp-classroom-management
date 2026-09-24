// ==========================================
// Domain Entities matching Prisma Schema
// ==========================================

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type ScoreState = 'DRAFT' | 'SUBMITTED' | 'LOCKED';
export type ScheduleType = 'NORMAL' | 'EXAM' | 'ACTIVITY' | 'CANCELED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
export type TermType = 'SEMESTER_1' | 'SEMESTER_2' | 'SUMMER';
export type RecordStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface School {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface SchoolMembership {
  id: string;
  userId: string;
  schoolId: string;
  role: Role;
  studentCode?: string;
}

export interface AcademicTerm {
  id: string;
  schoolId: string;
  year: number; // e.g. 2569
  term: TermType;
  label: string; // e.g. "ภาคเรียนที่ 1/2569"
}

export interface Classroom {
  id: string;
  schoolId: string;
  termId: string;
  name: string; // e.g. "ม.3/1"
  gradeLevel: string; // e.g. "ม.3"
  subjectCode: string; // e.g. "ศ23101"
  subjectName: string; // e.g. "ศิลปะ"
  status: RecordStatus;
}

export interface Enrollment {
  id: string;
  classroomId: string;
  schoolId: string;
  userId: string;
  studentNo: number; // เลขที่
  studentName: string;
  studentCode?: string;
  status: RecordStatus;
}

export interface SgsUnit {
  id: string;
  classroomId: string;
  name: string;
  maxScore: number;
  sgsColumnRef?: string;
}

export interface Assignment {
  id: string;
  classroomId: string;
  sgsUnitId?: string;
  title: string;
  maxScore: number;
  dueDate?: string;
  category: 'HOMEWORK' | 'EXAM' | 'PROJECT';
  xpReward: number;
}

export interface Score {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  classroomId: string;
  value: number | null; // Decimal(5,2)
  state: ScoreState;
  isExempt: boolean;
}

export interface Attendance {
  id: string;
  scheduleId: string;
  enrollmentId: string;
  classroomId: string;
  status: AttendanceStatus;
}

export interface GamificationProfile {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  companionName: string;
  companionTitle: string;
  companionLevel: number;
  currentXp: number;
  nextLevelXp: number;
}

export interface StudentSpecialNote {
  id: string;
  studentId: string;
  authorName: string;
  createdAt: string;
  content: string;
  tag?: 'HEALTH' | 'FAMILY' | 'BEHAVIOR' | 'ACADEMIC';
}
