import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { studentService } from './studentService.ts';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  username?: string;
  studentCode?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  position?: string;
  subjectGroup?: string;
  level?: string;
  classroomId?: string;
  avatarUrl?: string;
}

const STORAGE_KEY_AUTH_USER = 'cls_current_auth_user';

export async function verifyScryptPassword(storedHash: string, plainPassword: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derived = await scryptAsync(plainPassword.normalize('NFKC'), salt, {
      N: 16384,
      r: 16,
      p: 1,
      dkLen: 64,
      maxmem: 128 * 16384 * 16 * 2,
    });
    return bytesToHex(derived) === key;
  } catch (err) {
    console.error('Error verifying scrypt password:', err);
    return false;
  }
}

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
  // TEACHER LOGIN: Real Supabase (User & Account) with scrypt password verification
  async loginTeacher(usernameOrEmail: string, passwordInput: string): Promise<AuthUser> {
    const trimmedInput = usernameOrEmail?.trim();
    const trimmedPass = passwordInput?.trim();

    if (!trimmedInput) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    if (!trimmedPass) throw new Error('กรุณากรอกรหัสผ่าน');

    if (isSupabaseConfigured) {
      logDbOperation(`AUTH: Search teacher ${trimmedInput}`);
      try {
        const { data: users, error: uErr } = await supabase
          .from('User')
          .select('*')
          .or(`username.ilike.${trimmedInput},email.ilike.${trimmedInput}`);

        if (!uErr && users && users.length > 0) {
          const user = users[0];
          // ดึงข้อมูล Account ที่ผูกกับ User เพื่อตรวจรหัสผ่าน scrypt
          const { data: accounts, error: aErr } = await supabase
            .from('Account')
            .select('password')
            .eq('userId', user.id);

          if (!aErr && accounts && accounts.length > 0 && accounts[0].password) {
            const isValid = await verifyScryptPassword(accounts[0].password, trimmedPass);
            if (!isValid) {
              throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง');
            }

            const authUser: AuthUser = {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role === 'ADMIN' ? 'ADMIN' : 'TEACHER',
              position: user.position || 'ครู',
              subjectGroup: user.subjectGroup || '',
              level: user.level || '',
              avatarUrl: user.image || undefined,
            };
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
            }
            return authUser;
          } else {
            throw new Error('ไม่พบข้อมูลการตั้งรหัสผ่านของบัญชีนี้');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('รหัสผ่าน')) {
          throw err;
        }
        if (err.message && err.message.includes('ไม่พบ')) {
          throw err;
        }
        console.warn('Supabase query error:', err);
      }
    }

    throw new Error('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล');
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    }
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
    let found = studentService.findStudentByCode(trimmedCode);
    let student = found?.student;
    let classroomId = found?.classroomId || 'room-3-1';

    // 2. หากไม่พบใน LocalStorage ให้ตรวจสอบใน Supabase students / Student ทันที
    if (!student && isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM students/Student WHERE studentCode = ${trimmedCode}`);
      try {
        const { data: stuRows } = await supabase
          .from('students')
          .select('*')
          .or(`studentCode.eq.${trimmedCode},code.eq.${trimmedCode},id.eq.stu-${trimmedCode}`)
          .limit(1);

        let row = stuRows && stuRows[0];
        if (!row) {
          const { data: rawRows } = await supabase
            .from('Student')
            .select('*')
            .or(`studentCode.eq.${trimmedCode},id.eq.stu-${trimmedCode}`)
            .limit(1);
          if (rawRows && rawRows[0]) {
            const raw = rawRows[0];
            row = {
              id: raw.id,
              studentCode: raw.studentCode,
              code: raw.studentCode,
              name: `${raw.title || ''} ${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
              gender: raw.gender,
              status: raw.status,
              classroom_id: 'room-3-1',
              seat_no: 1,
            };
          }
        }

        if (row) {
          classroomId = row.classroom_id || 'room-3-1';
          const syncedStudent = {
            id: row.id,
            no: row.seat_no || 1,
            code: row.studentCode || row.code || trimmedCode,
            name: row.name || `นักเรียน ${trimmedCode}`,
            attendance: '8/8',
            score: 85,
            status: (row.status === 'AT_RISK' ? 'AT_RISK' : 'NORMAL') as 'NORMAL' | 'AT_RISK',
            gender: (row.gender === 'FEMALE' ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE',
            avatarUrl:
              row.gender === 'FEMALE'
                ? '/images/banners/student-avatar-girl.png'
                : '/images/banners/student-avatar.png',
            classroomId,
          };
          // แคชลง LocalStorage เพื่อให้ studentService และมุมมองอื่นๆ ทราบข้อมูล
          const localList = studentService.getLocalStudents(classroomId);
          if (!localList.some((s) => s.code === syncedStudent.code || s.id === syncedStudent.id)) {
            studentService.saveLocalStudents(classroomId, [...localList, syncedStudent]);
          }
          student = syncedStudent;
        }
      } catch (err) {
        console.warn('Supabase student login lookup error:', err);
      }
    }

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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      }
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

    if (nameMap[trimmedCode]) {
      const studentName = nameMap[trimmedCode];
      const user: AuthUser = {
        id: `stu-${trimmedCode}`,
        name: studentName,
        studentCode: trimmedCode,
        role: 'STUDENT',
        classroomId: 'room-3-1',
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      }
      return user;
    }

    throw new Error(`ไม่พบข้อมูลนักเรียนรหัส ${trimmedCode} ในระบบ กรุณาตรวจสอบรหัสประจำตัว หรือติดต่อคุณครูผู้สอน`);
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
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return null;
  },

  // LOGOUT
  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
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
