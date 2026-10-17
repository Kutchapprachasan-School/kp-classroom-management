import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { AssignmentCreateSchema, type AssignmentCreateInput } from './types';

export interface AssignmentRecord {
  id: string;
  classroomId: string;
  title: string;
  sharedTag?: string;
  subtext: string;
  category: string;
  sgsUnit: string;
  dueDate: string;
  maxScore: number;
  submittedCount: number;
  totalStudents: number;
  isFull: boolean;
  status: 'ACTIVE' | 'CLOSED';
}

const STORAGE_KEY = 'cls_assignments_data';

const getLocalAssignments = (): AssignmentRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed: AssignmentRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out legacy mock assignment fixtures
        const legacyMockIds = new Set(['asg-1', 'asg-2', 'asg-3', 'asg-4']);
        return parsed.filter((a) => !legacyMockIds.has(a.id) && a.title !== 'My Soundtrack');
      }
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalAssignments = (items: AssignmentRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const assignmentService = {
  // READ: Get assignments for classroom
  async getByClassroom(classroomId: string): Promise<AssignmentRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Assignment WHERE classroomId = ${classroomId}`);
      const { data, error } = await supabase
        .from('Assignment')
        .select('id, classroomId, title, maxScore, sgsUnit:SgsUnit(name)')
        .eq('classroomId', classroomId);

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          classroomId: item.classroomId,
          title: item.title,
          subtext: `มอบหมายเมื่อ ${new Date().toLocaleDateString('th-TH')}`,
          category: 'คะแนนเก็บ',
          sgsUnit: item.sgsUnit?.name || 'หน่วยที่ 1',
          dueDate: 'ไม่ระบุ',
          maxScore: Number(item.maxScore),
          submittedCount: 0,
          totalStudents: 23,
          isFull: false,
          status: 'ACTIVE',
        }));
      }
    }
    const all = getLocalAssignments();
    return all.filter((a) => !a.classroomId || a.classroomId === classroomId);
  },

  // CREATE: Add assignment
  async create(classroomId: string, input: AssignmentCreateInput): Promise<AssignmentRecord> {
    const validated = AssignmentCreateSchema.parse(input);
    const newId = `asg-${Date.now()}`;

    const newAssignment: AssignmentRecord = {
      id: newId,
      classroomId,
      title: validated.title,
      sharedTag: validated.sharedTag || 'เฉพาะห้องนี้',
      subtext: `มอบหมายเมื่อ ${new Date().toLocaleDateString('th-TH')}`,
      category: validated.category,
      sgsUnit: validated.sgsUnit,
      dueDate: validated.dueDate || 'ไม่ระบุ',
      maxScore: validated.maxScore,
      submittedCount: 0,
      totalStudents: 23,
      isFull: false,
      status: 'ACTIVE',
    };

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO Assignment', newAssignment);
      await supabase.from('Assignment').insert({
        id: newAssignment.id,
        classroomId,
        title: newAssignment.title,
        maxScore: newAssignment.maxScore,
      });
    }

    const current = getLocalAssignments();
    const updated = [newAssignment, ...current];
    saveLocalAssignments(updated);

    return newAssignment;
  },

  // UPDATE: Edit assignment
  async update(id: string, updates: Partial<AssignmentRecord>): Promise<AssignmentRecord> {
    const current = getLocalAssignments();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('ไม่พบงานที่ต้องการแก้ไข');

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    saveLocalAssignments(current);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Assignment WHERE id = ${id}`, updates);
      await supabase.from('Assignment').update(updates).eq('id', id);
    }

    return updated;
  },

  // CLOSE ASSIGNMENT: Mark missing students as 0
  async closeAssignment(id: string): Promise<AssignmentRecord> {
    return this.update(id, {
      isFull: true,
      submittedCount: 23,
      status: 'CLOSED',
    });
  },

  // DELETE: Remove assignment
  async delete(id: string): Promise<boolean> {
    const current = getLocalAssignments();
    const target = current.find((a) => a.id === id);
    if (!target) return false;

    const filtered = current.filter((a) => a.id !== id);
    saveLocalAssignments(filtered);

    if (isSupabaseConfigured) {
      logDbOperation(`DELETE FROM Assignment WHERE id = ${id}`);
      await supabase.from('Assignment').delete().eq('id', id);
    }

    return true;
  },
};
