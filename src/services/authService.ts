import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { studentService, formatClassroomLabel, registerClassroomNames } from './studentService.ts';
import { getSchoolSettings } from '../config/schoolSettings.ts';
import { getSmsUsers } from '../config/schoolRoles.ts';
import { scrypt, scryptAsync } from '@noble/hashes/scrypt.js';
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
  classroomName?: string;
  avatarUrl?: string;
  loginAt?: number;
  expiresAt?: number;
}

const STORAGE_KEY_AUTH_USER = 'cls_current_auth_user';

export async function verifyScryptPassword(storedHash: string, plainPassword: string): Promise<boolean> {
  try {
    if (!storedHash) return false;

    // Legacy / Plaintext / SHA-256 fallback if no salt-delimiter present
    if (!storedHash.includes(':')) {
      const sha = await hashPassword(plainPassword);
      return sha === storedHash || plainPassword === storedHash;
    }

    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const opts = {
      N: 16384,
      r: 16,
      p: 1,
      dkLen: 64,
      maxmem: 128 * 16384 * 16 * 2,
    };

    // Fast-path: Synchronous scrypt is immune to scheduler.yield hangs or event-loop freezes (~300ms)
    try {
      const derived = scrypt(plainPassword.normalize('NFKC'), salt, opts);
      return bytesToHex(derived) === key;
    } catch {
      // Async fallback with strict 2500ms timeout
      const derivedPromise = scryptAsync(plainPassword.normalize('NFKC'), salt, opts);
      const timeoutPromise = new Promise<Uint8Array>((_, reject) =>
        setTimeout(() => reject(new Error('Scrypt verification timeout')), 2500)
      );
      const derived = (await Promise.race([derivedPromise, timeoutPromise])) as Uint8Array;
      return bytesToHex(derived) === key;
    }
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
  // TEACHER LOGIN: Real Supabase (User & Account) with scrypt password verification + Fallback & Timeout
  async loginTeacher(usernameOrEmail: string, passwordInput: string): Promise<AuthUser> {
    const trimmedInput = usernameOrEmail?.trim();
    const trimmedPass = passwordInput?.trim();

    if (!trimmedInput) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    if (!trimmedPass) throw new Error('กรุณากรอกรหัสผ่าน');

    const executeTeacherLogin = async (): Promise<AuthUser> => {
      if (isSupabaseConfigured) {
        logDbOperation(`AUTH: Search teacher ${trimmedInput}`);
        try {
          const { data: users, error: uErr } = await supabase
            .from('User')
            .select('id, name, email, username, role, position, subjectGroup, level, image')
            .or(`username.ilike.${trimmedInput},email.ilike.${trimmedInput}`);

          if (!uErr && users && users.length > 0) {
            const user = users[0];
            // ดึงข้อมูล Account ที่ผูกกับ User เพื่อตรวจรหัสผ่าน scrypt จริงจากฐานข้อมูล Neon
            const { data: accounts, error: aErr } = await supabase
              .from('Account')
              .select('password, providerId')
              .eq('userId', user.id);

            const credentialAccount = accounts?.find((a: any) => a.password);
            if (!aErr && credentialAccount && credentialAccount.password) {
              const isValid = await verifyScryptPassword(credentialAccount.password, trimmedPass);
              if (isValid) {
                const now = Date.now();
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
                  loginAt: now,
                  expiresAt: now + 24 * 60 * 60 * 1000,
                };
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
                }
                return authUser;
              }
            }
          }
        } catch (err: any) {
          console.warn('Supabase query error:', err);
        }
      }

      // Fallback: Check local SMS user accounts (DEFAULT_SMS_USERS) in case Neon is down, slow, or offline
      const smsUsers = getSmsUsers();
      const matchedSms = smsUsers.find((u) => {
        const uInput = trimmedInput.toLowerCase();
        return (
          u.username.toLowerCase() === uInput ||
          u.smsId.toLowerCase() === uInput ||
          u.loginAliases.some((alias) => alias.toLowerCase() === uInput)
        );
      });

      if (matchedSms) {
        if (matchedSms.passwordOrPin && matchedSms.passwordOrPin === trimmedPass) {
          const now = Date.now();
          const authUser: AuthUser = {
            id: matchedSms.id,
            name: matchedSms.fullName,
            email: matchedSms.username.includes('@') ? matchedSms.username : undefined,
            username: matchedSms.smsId,
            role: matchedSms.role === 'ACADEMIC_ADMIN' ? 'ADMIN' : 'TEACHER',
            position: matchedSms.positionTitle || 'ครู',
            subjectGroup: matchedSms.departmentOrClass || '',
            level: 'ชำนาญการ',
            loginAt: now,
            expiresAt: now + 24 * 60 * 60 * 1000,
          };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
          }
          return authUser;
        } else {
          throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง');
        }
      }

      throw new Error('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล');
    };

    // Strict 8-second global timeout for teacher login
    const timeoutPromise = new Promise<AuthUser>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'การตรวจสอบข้อมูลเข้าสู่ระบบใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง'
            )
          ),
        8000
      )
    );

    return Promise.race([executeTeacherLogin(), timeoutPromise]);
  },

  // TEACHER LOGIN: Google Workspace SSO (ADR-003)
  async loginTeacherGoogle(): Promise<AuthUser> {
    if (isSupabaseConfigured) {
      logDbOperation('AUTH: signInWithOAuth (Google)');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        throw new Error(`Google SSO error: ${error.message}`);
      }
    }
    throw new Error('ระบบ Google Workspace SSO ต้องเชื่อมต่อกับบัญชีอีเมลสถานศึกษา (@obec.moe.go.th หรือ @kutchap.ac.th) กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน');
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

    const executeStudentLogin = async (): Promise<AuthUser> => {
      // 1. ค้นหานักเรียนใน studentService
      let found = studentService.findStudentByCode(trimmedCode);
      let student = found?.student;
      let classroomId = found?.classroomId || student?.classroomId || 'room-1-1';

      // 2. หากไม่พบใน LocalStorage ให้ตรวจสอบใน Supabase students / Student ทันที
      if (!student && isSupabaseConfigured) {
        logDbOperation(`SELECT * FROM students/Student WHERE studentCode = ${trimmedCode}`);
        try {
          const { data: stuRows } = await supabase
            .from('students')
            .select('id, seat_no, studentCode, code, name, gender, status, classroom_id')
            .or(`studentCode.eq.${trimmedCode},code.eq.${trimmedCode},id.eq.stu-${trimmedCode}`)
            .limit(1);

          let row = stuRows && stuRows[0];
          if (!row) {
            const { data: rawRows } = await supabase
              .from('Student')
              .select('id, studentCode, title, firstName, lastName, gender, status')
              .or(`studentCode.eq.${trimmedCode},id.eq.stu-${trimmedCode}`)
              .limit(1);
            if (rawRows && rawRows[0]) {
              const raw = rawRows[0];
              let resolvedClassroomId = 'room-1-1';
              let resolvedSeatNo = 1;
              try {
                const { data: enrRows } = await supabase
                  .from('StudentEnrollment')
                  .select('classRoomId, rollNumber')
                  .eq('studentId', raw.id)
                  .limit(1);
                if (enrRows && enrRows[0]) {
                  resolvedClassroomId = enrRows[0].classRoomId || 'room-1-1';
                  resolvedSeatNo = enrRows[0].rollNumber || 1;
                }
              } catch {
                // fallback
              }
              row = {
                id: raw.id,
                studentCode: raw.studentCode,
                code: raw.studentCode,
                name: `${raw.title || ''} ${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
                gender: raw.gender,
                status: raw.status,
                classroom_id: resolvedClassroomId,
                seat_no: resolvedSeatNo,
              };
            }
          }

          if (row) {
            classroomId = row.classroom_id || row.classroomId || 'room-1-1';
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

        // แปลง Classroom ID เป็นชื่อห้องภาษาไทย (เช่น ม.3/1 หรือ ม.4/4) เพื่อป้องกันไม่ให้แสดง room-1791986991422
        let resolvedClassroomName = formatClassroomLabel(classroomId);
        if (resolvedClassroomName.startsWith('room-') && isSupabaseConfigured) {
          try {
            const { data: roomRows } = await supabase
              .from('classrooms')
              .select('id, name, grade_level, room_number')
              .eq('id', classroomId)
              .limit(1);
            if (roomRows && roomRows[0]?.name) {
              resolvedClassroomName = formatClassroomLabel(roomRows[0].name);
              registerClassroomNames([{ id: classroomId, name: roomRows[0].name }]);
            }
          } catch {
            // ignore
          }
        }

        // ตรวจสอบรูปภาพโปรไฟล์ที่นักเรียนเคยบันทึกไว้
        let effectiveAvatar = student.avatarUrl;
        if (typeof localStorage !== 'undefined') {
          const savedAvatar = localStorage.getItem(`kp_student_avatar_${trimmedCode}`);
          if (savedAvatar) {
            effectiveAvatar = savedAvatar;
          }
        }

        const now = Date.now();
        const user: AuthUser = {
          id: student.id || `stu-${trimmedCode}`,
          name: student.name,
          studentCode: student.code || trimmedCode,
          role: 'STUDENT',
          classroomId,
          classroomName: resolvedClassroomName,
          avatarUrl: effectiveAvatar,
          loginAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
        }
        return user;
      }

      throw new Error(`ไม่พบข้อมูลนักเรียนรหัส ${trimmedCode} ในระบบ กรุณาตรวจสอบรหัสประจำตัว หรือติดต่อคุณครูผู้สอน`);
    };

    const timeoutPromise = new Promise<AuthUser>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'การตรวจสอบข้อมูลนักเรียนใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง'
            )
          ),
        8000
      )
    );

    return Promise.race([executeStudentLogin(), timeoutPromise]);
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

  // ADVISOR / ADMIN RESET CLASSROOM: รีเซ็ตรหัสผ่านนักเรียนทั้งห้องเรียนกลับเป็นรหัส 5 หลัก
  async resetClassroomPasswords(classroomId: string, advisorName?: string): Promise<{ count: number; studentCodes: string[] }> {
    const res = studentService.resetAllStudentsPasswordInClassroom(classroomId);
    if (res.successCount > 0) {
      try {
        window.dispatchEvent(
          new CustomEvent('kps-data-sync-event', {
            detail: {
              type: 'CLASSROOM_PASSWORDS_RESET',
              classroomId,
              count: res.successCount,
              resetBy: advisorName || 'ครูที่ปรึกษา / แอดมิน',
            },
          })
        );
      } catch {
        // safe SSR
      }
    }
    return { count: res.successCount, studentCodes: res.studentCodes };
  },

  // อัปเดตรูปภาพโปรไฟล์ของผู้ใช้ปัจจุบัน
  updateCurrentUserAvatar(avatarUrl: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (raw) {
        const user = JSON.parse(raw);
        user.avatarUrl = avatarUrl;
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
        if (user.studentCode) {
          localStorage.setItem(`kp_student_avatar_${user.studentCode.trim()}`, avatarUrl);
        }
      }
    } catch {
      // ignore
    }
  },

  // SESSION: Get currently logged in user (with 24-hour expiration check)
  getCurrentUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      try {
        const user = JSON.parse(raw) as AuthUser;
        // Check session expiration (default 24 hours)
        if (user.expiresAt && Date.now() > user.expiresAt) {
          console.warn('[authService] Session expired. Automatically clearing credentials.');
          localStorage.removeItem(STORAGE_KEY_AUTH_USER);
          return null;
        }
        // ตรวจสอบรูปภาพโปรไฟล์ล่าสุดที่นักเรียนบันทึกไว้ในเบราว์เซอร์หรือซิงค์ผ่านคลาวด์
        if (user.role === 'STUDENT' && user.studentCode) {
          const savedAvatar = localStorage.getItem(`kp_student_avatar_${user.studentCode.trim()}`);
          if (savedAvatar) {
            user.avatarUrl = savedAvatar;
          }
        }
        return user;
      } catch {
        // fallback
      }
    }
    return null;
  },

  // LOGOUT: Thoroughly clear session from both localStorage and sessionStorage
  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
    try {
      window.dispatchEvent(new CustomEvent('kps-auth-changed', { detail: { user: null } }));
    } catch {
      // safe SSR
    }
  },

  // SLIP GENERATION: Printable student password slip for classroom teachers
  generateStudentCredentialSlip(students: Array<{ no: number; code: string; name: string }>): string {
    const schoolName = getSchoolSettings()?.nameTh || 'โรงเรียน';
    return students
      .map(
        (s) =>
          `[${schoolName}] เลขที่: ${s.no} | รหัส: ${s.code} | ชื่อ: ${s.name} | รหัสผ่านเริ่มต้น: ${s.code} (PIN: ${s.code.length > 4 ? s.code.substring(1) : s.code})`
      )
      .join('\n');
  },
};
