import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { StudentCreateSchema, type StudentCreateInput } from './types.ts';
import { cleanSlateService } from './cleanSlateService.ts';

export interface StudentRecord {
  id: string;
  no: number;
  code: string;
  name: string;
  attendance: string;
  score: number;
  status: 'NORMAL' | 'AT_RISK';
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  classroomId?: string;
  studentCode?: string;
  passwordHash?: string | null;
  isPasswordChanged?: boolean;
  lastLoginAt?: string;
}

const STORAGE_PREFIX = 'cls_students_';

export const defaultStudents: StudentRecord[] = [];


export const mockStudentsByRoom: Record<string, StudentRecord[]> = {};

const inMemoryStudentCache: Record<string, StudentRecord[]> = {};

const getLocalStudents = (classroomId: string): StudentRecord[] => {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${classroomId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
  }
  if (inMemoryStudentCache[classroomId]) {
    return inMemoryStudentCache[classroomId];
  }
  // คืนค่ารายการว่าง [] เสมอ หากยังไม่มีการเพิ่มหรือนำเข้ารายชื่อจริง
  // เพื่อความสะอาดของระบบจริง (Zero Mock Data)
  if (cleanSlateService.isCleanSlateActive()) {
    return [];
  }
  return [];
};

const saveLocalStudents = (classroomId: string, items: StudentRecord[]) => {
  inMemoryStudentCache[classroomId] = items;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${classroomId}`, JSON.stringify(items));
  }
};

export function parseThaiStudentName(fullName: string): {
  title: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
} {
  const trimmed = (fullName || '').trim();
  let title = 'ด.ช.';
  let firstName = trimmed;
  let lastName = '';
  const parts = trimmed.split(/\s+/);

  if (parts[0].startsWith('ด.ช.') || parts[0].startsWith('เด็กชาย')) {
    title = 'ด.ช.';
    firstName = parts[0].replace(/^(ด\.ช\.|เด็กชาย)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('ด.ญ.') || parts[0].startsWith('เด็กหญิง')) {
    title = 'ด.ญ.';
    firstName = parts[0].replace(/^(ด\.ญ\.|เด็กหญิง)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('นาย')) {
    title = 'นาย';
    firstName = parts[0].replace(/^นาย/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts[0].startsWith('น.ส.') || parts[0].startsWith('นางสาว')) {
    title = 'นางสาว';
    firstName = parts[0].replace(/^(น\.ส\.|นางสาว)/, '') || parts[1] || '';
    lastName = parts.slice(1).join(' ').replace(firstName, '').trim();
  } else if (parts.length >= 2) {
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  const gender: 'MALE' | 'FEMALE' = (title === 'ด.ญ.' || title === 'นางสาว') ? 'FEMALE' : 'MALE';
  return { title, firstName: firstName || trimmed, lastName, gender };
}

export const studentService = {
  getLocalStudents,
  saveLocalStudents,
  mockStudentsByRoom,
  parseThaiStudentName,

  // ดึงรายชื่อนักเรียนในห้อง
  getStudents(classroomId: string): StudentRecord[] {
    return getLocalStudents(classroomId);
  },

  getStudentsByClassroom(classroomId: string): StudentRecord[] {
    return getLocalStudents(classroomId);
  },

  // ค้นหานักเรียนและห้องเรียนปัจจุบันจากรหัส
  findStudentByCode(code: string): { student: StudentRecord; classroomId: string } | null {
    // 1. ตรวจสอบ keys ทั้งหมดใน localStorage ก่อน
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const match = list.find((s: StudentRecord) => s.code === code || s.id === code);
                if (match) {
                  return { student: match, classroomId: k.slice(STORAGE_PREFIX.length) };
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Check in-memory cache
    for (const [room, list] of Object.entries(inMemoryStudentCache)) {
      const match = list.find((s) => s.code === code || s.id === code);
      if (match) {
        return { student: match, classroomId: room };
      }
    }

    // 3. Fallback ค้นหาจากห้องที่มีข้อมูล mock
    for (const key of Object.keys(mockStudentsByRoom)) {
      const list = getLocalStudents(key);
      const match = list.find((s) => s.code === code || s.id === code);
      if (match) {
        return { student: match, classroomId: key };
      }
    }
    return null;
  },

  // อัปเดตรหัสผ่านนักเรียน (บันทึกลง local storage ประจำห้องเรียน)
  updateStudentPassword(code: string, passwordHash: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash, isPasswordChanged: true, lastLoginAt: new Date().toISOString() }
        : s
    );
    saveLocalStudents(classroomId, updated);
    return true;
  },

  // รีเซ็ตรหัสผ่านนักเรียนกลับเป็นค่าเริ่มต้น (5 หลัก) โดยครูที่ปรึกษา / แอดมิน
  resetStudentPassword(code: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash: null, isPasswordChanged: false }
        : s
    );
    saveLocalStudents(classroomId, updated);
    return true;
  },

  // READ: List students in classroom
  async getByClassroom(classroomId: string): Promise<StudentRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Enrollment/students WHERE classroomId = ${classroomId}`);
      try {
        const { data: vData, error: vErr } = await supabase
          .from('students')
          .select('*')
          .eq('classroom_id', classroomId)
          .order('seat_no', { ascending: true });

        if (!vErr && vData && vData.length > 0) {
          return vData.map((s, idx) => ({
            id: s.id,
            no: s.seat_no || idx + 1,
            code: s.studentCode || s.code || `4510${idx + 1}`,
            name: s.name,
            attendance: '8/8',
            score: 80,
            status: s.status === 'AT_RISK' ? 'AT_RISK' : 'NORMAL',
            gender: s.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
            avatarUrl: s.gender === 'FEMALE' ? '/images/banners/student-avatar-girl.png' : '/images/banners/student-avatar.png',
            classroomId,
          }));
        }
      } catch (err) {
        console.warn('Error fetching students from Supabase view:', err);
      }

      try {
        const { data, error } = await supabase
          .from('Enrollment')
          .select('*, membership:SchoolMembership(*)')
          .eq('classroomId', classroomId)
          .eq('status', 'ACTIVE')
          .order('studentNo', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            no: item.studentNo,
            code: item.membership?.studentCode || 'N/A',
            name: item.membership?.user?.name || `นักเรียนเลขที่ ${item.studentNo}`,
            attendance: '8/8',
            score: 80,
            status: 'NORMAL',
          }));
        }
      } catch (err) {
        console.warn('Error fetching Enrollment from Supabase:', err);
      }
    }
    return getLocalStudents(classroomId);
  },

  // CREATE: Add new student
  async create(classroomId: string, input: StudentCreateInput): Promise<StudentRecord> {
    const validated = StudentCreateSchema.parse(input);
    const parsedName = parseThaiStudentName(validated.name);
    const studentId = `stu-${validated.studentCode}`;

    const newStudent: StudentRecord = {
      id: studentId,
      no: validated.studentNo,
      code: validated.studentCode,
      name: validated.name,
      attendance: '0/0',
      score: 0,
      status: validated.status,
      gender: parsedName.gender,
      avatarUrl: parsedName.gender === 'FEMALE' ? '/images/banners/student-avatar-girl.png' : '/images/banners/student-avatar.png',
      classroomId,
    };

    if (isSupabaseConfigured) {
      logDbOperation('UPSERT INTO Student & Enrollment', { classroomId, ...newStudent });
      try {
        await supabase.from('Student').upsert({
          id: studentId,
          studentCode: validated.studentCode,
          title: parsedName.title,
          firstName: parsedName.firstName,
          lastName: parsedName.lastName,
          gender: parsedName.gender,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to upsert Student in Supabase:', err);
      }

      try {
        await supabase.from('StudentEnrollment').upsert({
          id: `enr-${studentId}`,
          studentId: studentId,
          academicYear: 2569,
          term: 1,
          classRoomId: classroomId,
          rollNumber: newStudent.no,
          status: 'ENROLLED',
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Failed to upsert StudentEnrollment in Supabase:', err);
      }
    }

    const current = getLocalStudents(classroomId);
    const updated = [
      ...current.filter((s) => s.code !== newStudent.code && s.id !== newStudent.id),
      newStudent,
    ].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, updated);

    return newStudent;
  },

  // UPDATE: Update student info
  async update(classroomId: string, id: string, updates: Partial<StudentRecord>): Promise<StudentRecord> {
    const current = getLocalStudents(classroomId);
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('ไม่พบข้อมูลนักเรียน');

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    saveLocalStudents(classroomId, current);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Student WHERE id = ${id}`, updates);
      try {
        const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (updates.name) {
          const parsed = parseThaiStudentName(updates.name);
          payload.title = parsed.title;
          payload.firstName = parsed.firstName;
          payload.lastName = parsed.lastName;
        }
        if (updates.code) payload.studentCode = updates.code;
        if (updates.gender) payload.gender = updates.gender;
        await supabase.from('Student').update(payload).eq('id', id);

        if (updates.no !== undefined) {
          await supabase
            .from('StudentEnrollment')
            .update({ rollNumber: updates.no, updatedAt: new Date().toISOString() })
            .eq('studentId', id)
            .eq('classRoomId', classroomId);
        }
      } catch (err) {
        console.warn('Error updating student in Supabase:', err);
      }
    }

    return updated;
  },

  // REORDER STUDENTS: Move up / Move down with Save Confirmation
  async reorderStudents(classroomId: string, orderedStudentIds: string[]): Promise<StudentRecord[]> {
    const current = getLocalStudents(classroomId);
    const reordered: StudentRecord[] = [];

    for (let i = 0; i < orderedStudentIds.length; i++) {
      const id = orderedStudentIds[i];
      const found = current.find((s) => s.id === id || s.code === id);
      if (found) {
        reordered.push({ ...found, no: i + 1 });
      }
    }

    saveLocalStudents(classroomId, reordered);

    if (isSupabaseConfigured) {
      logDbOperation('REORDER STUDENTS in StudentEnrollment', { count: orderedStudentIds.length });
      try {
        for (let i = 0; i < orderedStudentIds.length; i++) {
          const id = orderedStudentIds[i];
          await supabase
            .from('StudentEnrollment')
            .update({ rollNumber: i + 1, updatedAt: new Date().toISOString() })
            .eq('studentId', id)
            .eq('classRoomId', classroomId);
        }
      } catch (err) {
        console.warn('Failed to update rollNumbers in Supabase:', err);
      }
    }

    return reordered;
  },

  // UPDATE PERSONAL INFO: Edit personal details (Name, Code, Gender, etc.)
  async updateStudentPersonalInfo(
    classroomId: string,
    studentId: string,
    info: {
      title?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      code?: string;
      gender?: 'MALE' | 'FEMALE';
    }
  ): Promise<StudentRecord> {
    let title = info.title;
    let firstName = info.firstName;
    let lastName = info.lastName;
    let gender = info.gender;
    if (info.name && (!firstName || !lastName)) {
      const parsed = parseThaiStudentName(info.name);
      if (!title) title = parsed.title;
      if (!firstName) firstName = parsed.firstName;
      if (!lastName) lastName = parsed.lastName;
      if (!gender) gender = parsed.gender;
    }

    const fullName = info.name || `${title || ''} ${firstName || ''} ${lastName || ''}`.trim();
    return this.update(classroomId, studentId, {
      name: fullName,
      code: info.code,
      gender,
      avatarUrl: gender === 'FEMALE'
        ? '/images/banners/student-avatar-girl.png'
        : '/images/banners/student-avatar.png',
    });
  },

  // DELETE: Soft delete student (Retain historical record until official dismissal)
  async delete(classroomId: string, id: string): Promise<boolean> {
    const current = getLocalStudents(classroomId);
    const target = current.find((s) => s.id === id);
    if (!target) return false;

    const filtered = current.filter((s) => s.id !== id);
    saveLocalStudents(classroomId, filtered);

    if (isSupabaseConfigured) {
      logDbOperation(`SOFT DELETE Student/StudentEnrollment: ${id}`);
      try {
        await supabase
          .from('StudentEnrollment')
          .update({ status: 'DROPPED', updatedAt: new Date().toISOString() })
          .eq('studentId', id)
          .eq('classRoomId', classroomId);

        await supabase
          .from('Student')
          .update({
            status: 'SUSPENDED',
            deletedAt: new Date().toISOString(),
            deletionReason: 'DISMISSED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Soft-delete in Supabase failed:', err);
      }
    }

    return true;
  },

  // BATCH IMPORT: Import from SGS Excel
  async batchImport(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    const current = getLocalStudents(classroomId);
    const newItems: StudentRecord[] = students.map((s, idx) => {
      const parsed = parseThaiStudentName(s.name);
      const studentCode = s.code || `${Date.now()}-${idx}`;
      return {
        ...s,
        id: `stu-${studentCode}`,
        code: studentCode,
        gender: s.gender || parsed.gender,
        avatarUrl:
          s.avatarUrl ||
          (parsed.gender === 'FEMALE'
            ? '/images/banners/student-avatar-girl.png'
            : '/images/banners/student-avatar.png'),
        classroomId,
      };
    });

    const combined = [
      ...current.filter((c) => !newItems.some((n) => n.code === c.code)),
      ...newItems,
    ].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, combined);

    if (isSupabaseConfigured) {
      logDbOperation('BATCH UPSERT INTO Student', { count: newItems.length });
      for (const item of newItems) {
        const parsed = parseThaiStudentName(item.name);
        try {
          await supabase.from('Student').upsert(
            {
              id: item.id,
              studentCode: item.code,
              title: parsed.title,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              gender: item.gender || parsed.gender,
              status: item.status || 'ACTIVE',
              updatedAt: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          await supabase.from('StudentEnrollment').upsert(
            {
              id: `enr-${item.id}`,
              studentId: item.id,
              academicYear: 2569,
              term: 1,
              classRoomId: classroomId,
              rollNumber: item.no,
              status: 'ENROLLED',
              updatedAt: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch {
          // continue
        }
      }
    }

    return newItems.length;
  },

  // Alias for compatibility
  async importBatch(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    return this.batchImport(classroomId, students);
  },
};

