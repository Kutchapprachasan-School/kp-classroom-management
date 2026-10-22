// src/utils/studentIdentityUtils.ts
/**
 * Utility functions for resolving student identity and classroom normalization
 * Ensures consistency across StudentCode, StudentId (UUID/Canonical PK), and Classroom representations.
 */
import { studentService, formatClassroomLabel } from '../services/studentService';

export interface StudentIdentityCandidate {
  id?: string;
  studentCode?: string;
  code?: string;
  name?: string;
  classroom?: string;
  classroomId?: string;
}

/**
 * แปลง studentCode <-> studentId และดึงตัวตนที่ถูกต้อง ป้องกันปัญหา Identity Mismatch
 */
export function resolveStudentIdentity(
  userOrCode: { id?: string; studentCode?: string; code?: string } | string | null | undefined,
  roster?: Array<StudentIdentityCandidate>
): { studentId: string; studentCode: string; classroomId?: string } | null {
  if (!userOrCode) return null;
  const targetCode = (typeof userOrCode === 'string' ? userOrCode : (userOrCode.studentCode || userOrCode.code))?.trim();
  const targetId = (typeof userOrCode === 'string' ? undefined : userOrCode.id)?.trim();

  // 1. ค้นหาใน roster ที่ส่งเข้ามา
  if (roster && Array.isArray(roster) && roster.length > 0) {
    const matched = roster.find((s) => {
      const sCode = (s.studentCode || s.code)?.trim();
      const sId = s.id?.trim();
      return (targetCode && sCode === targetCode) || (targetId && sId === targetId);
    });

    if (matched) {
      const resolvedCode = (matched.studentCode || matched.code || targetCode || '').trim();
      const resolvedId = (matched.id || targetId || `stu-${resolvedCode}`).trim();
      return {
        studentId: resolvedId,
        studentCode: resolvedCode,
        classroomId: matched.classroomId || matched.classroom,
      };
    }
  }

  // 2. ค้นหาผ่าน studentService.findStudentByCode
  if (targetCode) {
    const found = studentService.findStudentByCode(targetCode);
    if (found) {
      return {
        studentId: found.student.id || targetId || `stu-${targetCode}`,
        studentCode: targetCode,
        classroomId: found.classroomId,
      };
    }
  }

  // 3. ถ้ามี targetId ให้ลองค้นหาด้วย ID
  if (targetId) {
    const foundById = studentService.findStudentByCode(targetId);
    if (foundById) {
      return {
        studentId: foundById.student.id || targetId,
        studentCode: foundById.student.code || foundById.student.studentCode || targetId.replace(/^stu-/, ''),
        classroomId: foundById.classroomId,
      };
    }
  }

  // 4. Fallback สำหรับ user object ที่มีทั้ง id และ studentCode อยู่แล้ว
  if (targetId && targetCode) {
    return {
      studentId: targetId,
      studentCode: targetCode,
    };
  }

  return null;
}

/**
 * ตรวจสอบและเปรียบเทียบว่ารหัสห้องเรียนหรือชื่อห้องเรียนเป็นห้องเดียวกันหรือไม่
 * รองรับทั้ง room-3-1, ม.3/1, ม. 3/1 และ UUID
 */
export function isSameClassroom(roomA?: string, roomB?: string): boolean {
  if (!roomA || !roomB) return false;
  if (roomA === roomB) return true;
  const normA = formatClassroomLabel(roomA).trim().replace(/\s+/g, '');
  const normB = formatClassroomLabel(roomB).trim().replace(/\s+/g, '');
  return normA === normB;
}
