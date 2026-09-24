import { z } from 'zod';

// ================= CLASSROOM & ROSTER SCHEMAS =================
export const ClassroomCreateSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อชั้นเรียน เช่น ม.3/1'),
  level: z.string().min(1, 'ต้องระบุระดับชั้น เช่น ม.3'),
  subjectCode: z.string().min(1, 'ต้องระบุรหัสวิชา เช่น ศ23101'),
  subjectName: z.string().min(1, 'ต้องระบุชื่อวิชา เช่น ศิลปะ'),
  adviser: z.string().optional(),
  termId: z.string().default('term-1-2569'),
});
export type ClassroomCreateInput = z.infer<typeof ClassroomCreateSchema>;

export const StudentCreateSchema = z.object({
  studentNo: z.number().int().min(1, 'เลขที่ต้องมากกว่า 0'),
  studentCode: z.string().min(1, 'ต้องระบุรหัสนักเรียน'),
  name: z.string().min(1, 'ต้องระบุชื่อ-นามสกุล'),
  status: z.enum(['NORMAL', 'AT_RISK']).default('NORMAL'),
});
export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;

// ================= ASSIGNMENT & EXAM SCHEMAS =================
export const AssignmentCreateSchema = z.object({
  title: z.string().min(1, 'ต้องระบุชื่องาน'),
  category: z.string().default('เก็บก่อนกลางภาค'),
  sgsUnit: z.string().default('หน่วยที่ 1'),
  maxScore: z.number().positive('คะแนนเต็มต้องมากกว่า 0').max(100, 'คะแนนเต็มสูงสุด 100'),
  dueDate: z.string().optional(),
  sharedTag: z.string().optional(),
});
export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>;

// ================= SCORE & AUDIT LOG SCHEMAS =================
export const ScoreUpdateSchema = z.object({
  assignmentId: z.string().min(1),
  enrollmentId: z.string().min(1),
  classroomId: z.string().min(1),
  value: z.number().min(0, 'คะแนนต้องไม่ติดลบ').nullable(),
  maxScore: z.number().positive(),
  isExempt: z.boolean().default(false),
  state: z.enum(['DRAFT', 'SUBMITTED', 'LOCKED']).default('DRAFT'),
  reason: z.string().optional(), // Required if state is SUBMITTED or LOCKED (ADR-001)
  changedBy: z.string().default('ครูภาสภูมิ'),
  expectedVersion: z.number().int().optional(), // ADR-003 Optimistic Concurrency Control
}).refine((data) => {
  if (data.value !== null && data.value > data.maxScore) {
    return false;
  }
  return true;
}, {
  message: 'คะแนนที่กรอกต้องไม่เกินคะแนนเต็มของชิ้นงาน',
  path: ['value'],
}).refine((data) => {
  // Enforce ADR-001 Invariant: If updating SUBMITTED or LOCKED score, reason is mandatory
  if ((data.state === 'SUBMITTED' || data.state === 'LOCKED') && (!data.reason || data.reason.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'จำเป็นต้องระบุเหตุผลในการแก้ไขคะแนนที่อยู่ในสถานะส่งแล้ว/ล็อกแล้ว (ตาม ADR-001)',
  path: ['reason'],
});
export type ScoreUpdateInput = z.infer<typeof ScoreUpdateSchema>;

// ================= ATTENDANCE SCHEMAS =================
export const AttendanceRecordSchema = z.object({
  enrollmentId: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
});

export const RollCallBatchSchema = z.object({
  scheduleId: z.string().min(1),
  classroomId: z.string().min(1),
  schoolDate: z.string().min(1),
  records: z.array(AttendanceRecordSchema),
});
export type RollCallBatchInput = z.infer<typeof RollCallBatchSchema>;

// ================= BEHAVIOR & XP SCHEMAS =================
export const BehaviorLogCreateSchema = z.object({
  studentName: z.string().min(1, 'ต้องระบุชื่อนักเรียน'),
  type: z.enum(['POSITIVE', 'NEGATIVE']),
  text: z.string().min(1, 'ต้องระบุรายละเอียดพฤติกรรม'),
  points: z.string().min(1, 'ต้องระบุแต้ม เช่น +5 XP หรือ -2 คะแนน'),
});
export type BehaviorLogCreateInput = z.infer<typeof BehaviorLogCreateSchema>;

// ================= REFLECTION SCHEMAS =================
export const ReflectionCreateSchema = z.object({
  period: z.string().min(1, 'ต้องระบุคาบและวันที่'),
  topic: z.string().min(1, 'ต้องระบุเรื่องที่สอน'),
  success: z.string().min(1, 'ต้องระบุผลการจัดกิจกรรม'),
  obstacle: z.string().default('-'),
  solution: z.string().default('-'),
});
export type ReflectionCreateInput = z.infer<typeof ReflectionCreateSchema>;

// ================= TRASH MANAGEMENT SCHEMAS =================
export const TrashActionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['CLASSROOM', 'ASSIGNMENT', 'STUDENT']),
});
export type TrashActionInput = z.infer<typeof TrashActionSchema>;

// ================= GAMIFICATION SCHEMAS =================
export const QuestSubmitSchema = z.object({
  studentId: z.string().min(1),
  questId: z.string().min(1),
  proofText: z.string().optional(),
  proofUrl: z.string().optional(),
});
export type QuestSubmitInput = z.infer<typeof QuestSubmitSchema>;

