import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { StudentCreateSchema, type StudentCreateInput } from './types';

export interface StudentRecord {
  id: string;
  no: number;
  code: string;
  name: string;
  attendance: string;
  score: number;
  status: 'NORMAL' | 'AT_RISK';
}

const STORAGE_PREFIX = 'cls_students_';

const defaultStudents: StudentRecord[] = [
  { id: 'stu-1', no: 1, code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', attendance: '8/8', score: 88.5, status: 'NORMAL' },
  { id: 'stu-2', no: 2, code: '45102', name: 'ด.ช. จิรายุ เดชปันคำ', attendance: '8/8', score: 92.0, status: 'NORMAL' },
  { id: 'stu-7', no: 7, code: '45107', name: 'ด.ช. ภูรินท์ บัณฑิต', attendance: '4/8', score: 28.3, status: 'AT_RISK' },
  { id: 'stu-10', no: 10, code: '45110', name: 'ด.ช. อัศวิน วนเกษตรกุล', attendance: '8/8', score: 34.3, status: 'AT_RISK' },
  { id: 'stu-12', no: 12, code: '45112', name: 'ด.ช. ชัยมงคล วงศ์บุตร', attendance: '8/8', score: 35.0, status: 'AT_RISK' },
  { id: 'stu-15', no: 15, code: '45115', name: 'ด.ช. ทัตธน คำฝั้น', attendance: '8/8', score: 78.5, status: 'NORMAL' },
  { id: 'stu-22', no: 22, code: '45122', name: 'ด.ญ. อคิราห์ วิรากร', attendance: '6/8', score: 39.0, status: 'AT_RISK' },
  { id: 'stu-23', no: 23, code: '45123', name: 'ด.ญ. ปรียาภรณ์ ชัยแก้ว', attendance: '8/8', score: 95.0, status: 'NORMAL' },
];

const getLocalStudents = (classroomId: string): StudentRecord[] => {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${classroomId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return defaultStudents;
};

const saveLocalStudents = (classroomId: string, items: StudentRecord[]) => {
  localStorage.setItem(`${STORAGE_PREFIX}${classroomId}`, JSON.stringify(items));
};

export const studentService = {
  // READ: List students in classroom
  async getByClassroom(classroomId: string): Promise<StudentRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Enrollment WHERE classroomId = ${classroomId}`);
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
    }
    return getLocalStudents(classroomId);
  },

  // CREATE: Add new student
  async create(classroomId: string, input: StudentCreateInput): Promise<StudentRecord> {
    const validated = StudentCreateSchema.parse(input);
    const newStudent: StudentRecord = {
      id: `stu-${Date.now()}`,
      no: validated.studentNo,
      code: validated.studentCode,
      name: validated.name,
      attendance: '0/0',
      score: 0,
      status: validated.status,
    };

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO Enrollment', { classroomId, ...newStudent });
      await supabase.from('Enrollment').insert({
        id: newStudent.id,
        classroomId,
        studentNo: newStudent.no,
        status: 'ACTIVE',
      });
    }

    const current = getLocalStudents(classroomId);
    const updated = [...current, newStudent].sort((a, b) => a.no - b.no);
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
      logDbOperation(`UPDATE Enrollment WHERE id = ${id}`, updates);
      await supabase.from('Enrollment').update(updates).eq('id', id);
    }

    return updated;
  },

  // DELETE: Soft delete student
  async delete(classroomId: string, id: string): Promise<boolean> {
    const current = getLocalStudents(classroomId);
    const target = current.find((s) => s.id === id);
    if (!target) return false;

    const filtered = current.filter((s) => s.id !== id);
    saveLocalStudents(classroomId, filtered);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Enrollment SET status = DELETED WHERE id = ${id}`);
      await supabase.from('Enrollment').update({ status: 'DELETED' }).eq('id', id);
    }

    return true;
  },

  // BATCH IMPORT: Import from SGS Excel
  async batchImport(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    const current = getLocalStudents(classroomId);
    const newItems: StudentRecord[] = students.map((s, idx) => ({
      ...s,
      id: `stu-${Date.now()}-${idx}`,
    }));

    const combined = [...current, ...newItems].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, combined);

    if (isSupabaseConfigured) {
      logDbOperation('BATCH INSERT INTO Enrollment', { count: newItems.length });
    }

    return newItems.length;
  },

  // Alias for compatibility
  async importBatch(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    return this.batchImport(classroomId, students);
  },
};

