// src/services/studentExpService.ts
// ระบบคำนวณคะแนนประสบการณ์ (EXP) และเลเวลนักเรียนจากข้อมูลจริง 100% (Zero Mock Data)
// 1. การส่งงานจริง (Assignments from sgsRosterAndSubmissionService)
// 2. การเข้าเรียนจริง (Attendance from attendanceCorrelationService)
// 3. การเช็คชื่อต่อเนื่อง (Streak from gamificationService)
// 4. บันทึกคะแนนพฤติกรรมและแต้มพิเศษ (Behavior & Special XP from behaviorService)

import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService';
import { attendanceCorrelationService } from './attendanceCorrelationService';
import { gamificationService } from './gamificationService';
import { studentService } from './studentService';

export const STUDENT_EXP_EVENT = 'kp_student_exp_updated';

export interface StudentExpBreakdown {
  assignmentsCount: number;
  assignmentsXp: number;
  morningAttendanceCount: number;
  morningAttendanceXp: number;
  periodAttendanceCount: number;
  periodAttendanceXp: number;
  streakCount: number;
  streakXp: number;
  behaviorTransactionsXp: number;
}

export interface StudentExpCalculation {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  breakdown: StudentExpBreakdown;
}

/**
 * คำนวณแต้ม EXP รวมและระดับเลเวลของนักเรียนจากข้อมูลจริงในระบบ
 */
export function calculateStudentExp(studentId = 'stu-2', studentCode?: string): StudentExpCalculation {
  // รวบรวมคีย์ระบุตัวตนทั้งหมดของนักเรียน (Dual-Key: studentId, studentCode, stu-X, UUID)
  const candidateKeys = new Set<string>();
  if (studentId) candidateKeys.add(studentId);
  if (studentCode) candidateKeys.add(studentCode);
  if (studentId && !studentId.startsWith('stu-')) candidateKeys.add(`stu-${studentId}`);
  if (studentCode && !studentCode.startsWith('stu-')) candidateKeys.add(`stu-${studentCode}`);
  if (studentId && studentId.startsWith('stu-')) candidateKeys.add(studentId.replace(/^stu-/, ''));
  if (studentCode && studentCode.startsWith('stu-')) candidateKeys.add(studentCode.replace(/^stu-/, ''));

  try {
    const foundStu = studentService.findStudentByCode(studentCode || studentId);
    if (foundStu?.student?.id) candidateKeys.add(foundStu.student.id);
    if (foundStu?.student?.code) candidateKeys.add(foundStu.student.code);
    if (foundStu?.student?.studentCode) candidateKeys.add(foundStu.student.studentCode);
  } catch {}

  // 1. งานที่ส่งจริง (Submissions)
  let assignmentsCount = 0;
  let assignmentsXp = 0;
  try {
    const submissions = sgsRosterAndSubmissionService.getSubmissions();
    const studentSubs = submissions.filter(
      (s) =>
        candidateKeys.has(s.studentCode) ||
        (s.studentId && candidateKeys.has(s.studentId))
    );

    studentSubs.forEach((sub) => {
      if (sub.status === 'GRADED') {
        assignmentsCount++;
        // ส่งและตรวจแล้วได้ 50 XP + คะแนน x 10
        const score = typeof sub.score === 'number' ? sub.score : 0;
        assignmentsXp += 50 + score * 10;
      } else if (sub.status === 'SUBMITTED_PENDING') {
        assignmentsCount++;
        // ส่งแล้วรอตรวจได้ 50 XP
        assignmentsXp += 50;
      }
    });
  } catch (err) {
    console.warn('[studentExpService] Error reading submissions:', err);
  }

  // 2. การเข้าแถวและการเข้าเรียนจริง (Attendance)
  let morningAttendanceCount = 0;
  let morningAttendanceXp = 0;
  let periodAttendanceCount = 0;
  let periodAttendanceXp = 0;

  try {
    const morningRecords = attendanceCorrelationService.getAllMorningRecords();
    const studentMorning = morningRecords.filter(
      (r) =>
        candidateKeys.has(r.studentCode) ||
        (r.studentId && candidateKeys.has(r.studentId))
    );

    studentMorning.forEach((r) => {
      if (r.status === 'PRESENT') {
        morningAttendanceCount++;
        morningAttendanceXp += 15; // มาเข้าแถวทัน +15 XP
      } else if (r.status === 'LATE') {
        morningAttendanceCount++;
        morningAttendanceXp += 5; // มาสาย +5 XP
      }
    });

    const periodRecords = attendanceCorrelationService.getAllPeriodRecords();
    const studentPeriods = periodRecords.filter(
      (r) =>
        candidateKeys.has(r.studentCode) ||
        (r.studentId && candidateKeys.has(r.studentId))
    );

    studentPeriods.forEach((r) => {
      if (r.status === 'PRESENT') {
        periodAttendanceCount++;
        periodAttendanceXp += 10; // เข้าเรียนรายคาบ +10 XP
      }
    });
  } catch (err) {
    console.warn('[studentExpService] Error reading attendance:', err);
  }

  // 3. สตรีคการเช็คชื่อต่อเนื่อง (Streak)
  let streakCount = 0;
  let streakXp = 0;
  try {
    for (const cid of candidateKeys) {
      const count = gamificationService.getStreak(cid);
      if (count > streakCount) {
        streakCount = count;
      }
    }
    streakXp = streakCount * 20; // 20 XP ต่อวันในสตรีค
  } catch (err) {
    console.warn('[studentExpService] Error reading streak:', err);
  }

  // 4. ธุรกรรม XP และคะแนนพฤติกรรม (Behavior / Special Activities)
  let behaviorTransactionsXp = 0;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('cls_xp_transactions');
      if (raw) {
        const txs = JSON.parse(raw);
        if (Array.isArray(txs)) {
          const studentTxs = txs.filter((tx: any) =>
            candidateKeys.has(tx.studentId) || candidateKeys.has(tx.studentCode)
          );
          behaviorTransactionsXp = studentTxs.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        }
      }
    }
  } catch (err) {
    console.warn('[studentExpService] Error reading behavior XP:', err);
  }

  // รวมแต้มทั้งหมด
  const totalXp = Math.max(
    0,
    assignmentsXp +
      morningAttendanceXp +
      periodAttendanceXp +
      streakXp +
      behaviorTransactionsXp
  );

  // คำนวณ Level (100 XP ต่อระดับ)
  const level = Math.floor(totalXp / 100) + 1;
  const currentLevelXp = totalXp % 100;
  const nextLevelXp = 100;
  const xpToNextLevel = 100 - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / 100) * 100));

  return {
    totalXp,
    level,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel,
    progressPercent,
    breakdown: {
      assignmentsCount,
      assignmentsXp,
      morningAttendanceCount,
      morningAttendanceXp,
      periodAttendanceCount,
      periodAttendanceXp,
      streakCount,
      streakXp,
      behaviorTransactionsXp,
    },
  };
}

/**
 * ส่งสัญญาณแจ้งให้ทุกคอมโพเนนต์ที่แสดง EXP ทราบว่ามีการเปลี่ยนแปลงข้อมูลจริง
 */
export function dispatchStudentExpUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STUDENT_EXP_EVENT));
  }
}
