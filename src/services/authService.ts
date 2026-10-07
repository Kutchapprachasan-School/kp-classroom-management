import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { studentService } from './studentService';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  studentCode?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  classroomId?: string;
  avatarUrl?: string;
}

const STORAGE_KEY_AUTH_USER = 'cls_current_auth_user';

export async function hashPassword(plainText: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(`kps_salt_${plainText}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Safe deterministic fallback for non-crypto test environments
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    hash = (hash << 5) - hash + plainText.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

export const authService = {
  // TEACHER LOGIN: Traditional Email & Password (ADR-003)
  async loginTeacher(email: string, password: string): Promise<AuthUser> {
    if (isSupabaseConfigured) {
      logDbOperation(`AUTH: signInWithPassword for ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const user: AuthUser = {
          id: data.user.id,
          name: data.user.user_metadata?.name || 'ครูภาสภูมิ เรืองปราชญ์',
          email: data.user.email,
          role: (data.user.user_metadata?.role as 'TEACHER') || 'TEACHER',
        };
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
        return user;
      }
    }

    // Local / Offline fallback authentication
    const user: AuthUser = {
      id: 'usr-teacher-1',
      name: 'ครูภาสภูมิ เรืองปราชญ์',
      email: email || 'pasphum@school.ac.th',
      role: 'TEACHER',
    };
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    return user;
  },

  // TEACHER LOGIN: Google Workspace SSO (ADR-003)
  async loginTeacherGoogle(): Promise<AuthUser> {
    if (isSupabaseConfigured) {
      logDbOperation('AUTH: signInWithOAuth (Google)');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    }

    const user: AuthUser = {
      id: 'usr-teacher-sso',
      name: 'ครูภาสภูมิ เรืองปราชญ์ (Google SSO)',
      email: 'pasphum.r@obec.moe.go.th',
      role: 'TEACHER',
    };
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    return user;
  },

  // STUDENT LOGIN: 5-digit Student Code + Password / Initial 5-digit code
  async loginStudent(studentCode: string, pinOrPassword: string): Promise<AuthUser> {
    return this.loginStudentWithHashedPassword(studentCode, pinOrPassword);
  },

  // STUDENT LOGIN WITH HASHED PASSWORD CHECK
  async loginStudentWithHashedPassword(studentCode: string, passwordInput: string): Promise<AuthUser> {
    const trimmedCode = studentCode?.trim();
    const trimmedPass = passwordInput?.trim();

    if (!trimmedCode) {
      throw new Error('กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก');
    }
    if (!trimmedPass) {
      throw new Error('กรุณากรอกรหัสผ่านเข้าใช้งาน');
    }

    // 1. ค้นหานักเรียนใน studentService
    const found = studentService.findStudentByCode(trimmedCode);
    const student = found?.student;
    const classroomId = found?.classroomId || 'room-3-1';

    if (student) {
      // หากนักเรียนยังไม่เคยเปลี่ยนรหัสผ่าน -> รหัสผ่านเริ่มต้นคือ รหัสนักเรียน 5 หลัก (หรือ PIN 4 หลัก)
      if (!student.isPasswordChanged || !student.passwordHash) {
        const isMatch =
          trimmedPass === trimmedCode ||
          trimmedPass === student.code ||
          (student.code && trimmedPass === student.code.substring(1));
        if (!isMatch) {
          throw new Error('รหัสผ่านไม่ถูกต้อง (สำหรับเข้าใช้งานครั้งแรก กรุณาใช้รหัสนักเรียน 5 หลัก)');
        }
      } else {
        // นักเรียนเคยเปลี่ยนรหัสผ่านแล้ว -> ตรวจสอบกับ passwordHash
        const hashedInput = await hashPassword(trimmedPass);
        if (hashedInput !== student.passwordHash) {
          throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือแจ้งครูที่ปรึกษาเพื่อรีเซ็ตรหัสผ่าน');
        }
      }

      const user: AuthUser = {
        id: student.id || `stu-${trimmedCode}`,
        name: student.name,
        studentCode: student.code || trimmedCode,
        role: 'STUDENT',
        classroomId,
        avatarUrl: student.avatarUrl,
      };
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      return user;
    }

    // Fallback สำหรับกรณี mock code ที่ไม่ได้อยู่ใน roster
    const nameMap: Record<string, string> = {
      '45101': 'ด.ช. กฤษณะ ศรีสมบูรณ์',
      '45102': 'ด.ช. ธีรานุ เดชปันคำ',
      '45107': 'ด.ช. ภูรินท์ บัณฑิต',
      '45110': 'ด.ช. อัศวิน วนเกษตรกุล',
      '45115': 'ด.ช. ทัตธน คำฝั้น',
      '45123': 'ด.ญ. ปริยาภรณ์ ชัยแก้ว',
    };

    const studentName = nameMap[trimmedCode] || `นักเรียนรหัส ${trimmedCode}`;
    const user: AuthUser = {
      id: `stu-${trimmedCode}`,
      name: studentName,
      studentCode: trimmedCode,
      role: 'STUDENT',
      classroomId: 'room-3-1',
    };
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    return user;
  },

  // STUDENT CHANGE PASSWORD: นักเรียนเปลี่ยนรหัสผ่านด้วยตนเอง
  async studentChangePassword(
    studentCode: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const trimmedCode = studentCode?.trim();
    const trimmedCurr = currentPassword?.trim();
    const trimmedNew = newPassword?.trim();

    if (!trimmedCode || !trimmedCurr || !trimmedNew) {
      throw new Error('กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน');
    }
    if (trimmedNew.length < 4) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
    }

    // ตรวจสอบรหัสผ่านปัจจุบันก่อน
    await this.loginStudentWithHashedPassword(trimmedCode, trimmedCurr);

    // สร้าง Hash และบันทึก
    const newHash = await hashPassword(trimmedNew);
    const updated = studentService.updateStudentPassword(trimmedCode, newHash);
    if (!updated) {
      throw new Error('ไม่พบข้อมูลนักเรียนในระบบ');
    }

    try {
      window.dispatchEvent(
        new CustomEvent('kps-data-sync-event', {
          detail: { type: 'STUDENT_PASSWORD_CHANGED', studentCode: trimmedCode },
        })
      );
    } catch {
      // safe SSR
    }

    return true;
  },

  // ADVISOR 1-CLICK RESET: ครูที่ปรึกษารีเซ็ตรหัสผ่านนักเรียนเป็นรหัส 5 หลัก
  async resetStudentPasswordByAdvisor(studentCode: string, advisorName?: string): Promise<boolean> {
    const trimmedCode = studentCode?.trim();
    if (!trimmedCode) {
      throw new Error('กรุณาระบุรหัสประจำตัวนักเรียน');
    }

    const resetSuccess = studentService.resetStudentPassword(trimmedCode);
    if (!resetSuccess) {
      throw new Error('ไม่พบข้อมูลนักเรียนในระบบ');
    }

    try {
      window.dispatchEvent(
        new CustomEvent('kps-data-sync-event', {
          detail: {
            type: 'STUDENT_PASSWORD_RESET_BY_ADVISOR',
            studentCode: trimmedCode,
            resetBy: advisorName || 'ครูที่ปรึกษา',
          },
        })
      );
    } catch {
      // safe SSR
    }

    return true;
  },

  // SESSION: Get currently logged in user
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      id: 'usr-teacher-1',
      name: 'ครูภาสภูมิ เรืองปราชญ์',
      email: 'pasphum@school.ac.th',
      role: 'TEACHER',
    };
  },

  // LOGOUT
  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  },

  // SLIP GENERATION: Printable student password slip for classroom teachers
  generateStudentCredentialSlip(students: Array<{ no: number; code: string; name: string }>): string {
    return students
      .map(
        (s) =>
          `[โรงเรียนหางดงรัฐราษฎร์อุปถัมภ์] เลขที่: ${s.no} | รหัส: ${s.code} | ชื่อ: ${s.name} | รหัสผ่านเริ่มต้น (PIN): ${s.code.substring(1)} | QR Login: https://cls.school.ac.th/login?code=${s.code}`
      )
      .join('\n');
  },
};
