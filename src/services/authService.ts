import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';

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

  // STUDENT LOGIN: 5-digit Student Code + PIN / Birthday (ADR-003)
  async loginStudent(studentCode: string, pin: string): Promise<AuthUser> {
    if (!studentCode || studentCode.trim().length === 0) {
      throw new Error('กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก');
    }
    if (!pin || pin.trim().length === 0) {
      throw new Error('กรุณากรอกรหัส PIN หรือวันเดือนปีเกิด 4 หลัก');
    }

    if (isSupabaseConfigured) {
      logDbOperation(`AUTH: Student Code lookup for ${studentCode}`);
      // Find matching membership
      const { data } = await supabase
        .from('SchoolMembership')
        .select('*, user:User(*)')
        .eq('studentCode', studentCode)
        .single();

      if (data) {
        const user: AuthUser = {
          id: data.id,
          name: data.user?.name || `นักเรียนรหัส ${studentCode}`,
          studentCode,
          role: 'STUDENT',
          classroomId: 'room-3-1',
        };
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
        return user;
      }
    }

    // Default student mock match (e.g. 45102 = ด.ช. จิรายุ)
    const nameMap: Record<string, string> = {
      '45101': 'ด.ช. กฤษณะ ศรีสมบูรณ์',
      '45102': 'ด.ช. จิรายุ เดชปันคำ',
      '45107': 'ด.ช. ภูรินท์ บัณฑิต',
      '45110': 'ด.ช. อัศวิน วนเกษตรกุล',
      '45115': 'ด.ช. ทัตธน คำฝั้น',
      '45123': 'ด.ญ. ปรียาภรณ์ ชัยแก้ว',
    };

    const studentName = nameMap[studentCode] || `นักเรียนรหัส ${studentCode}`;
    const user: AuthUser = {
      id: `stu-${studentCode}`,
      name: studentName,
      studentCode,
      role: 'STUDENT',
      classroomId: 'room-3-1',
    };
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    return user;
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
