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

const defaultAssignments: AssignmentRecord[] = [
  {
    id: 'asg-1',
    classroomId: 'room-3-1',
    title: 'My Soundtrack',
    sharedTag: 'ใช้ร่วม 5 ห้อง',
    subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
    category: 'เก็บก่อนกลางภาค',
    sgsUnit: 'ช่อง 2 • หน่วยที่ 1',
    dueDate: '20 ส.ค.',
    maxScore: 10,
    submittedCount: 23,
    totalStudents: 23,
    isFull: true,
    status: 'ACTIVE',
  },
  {
    id: 'asg-2',
    classroomId: 'room-3-1',
    title: 'อินโฟกราฟิค องค์ประกอบทางดนตรี',
    sharedTag: 'ใช้ร่วม 6 ห้อง',
    subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
    category: 'เก็บก่อนกลางภาค',
    sgsUnit: 'ช่อง 1 • หน่วยที่ 2',
    dueDate: '10 ส.ค.',
    maxScore: 10,
    submittedCount: 23,
    totalStudents: 23,
    isFull: true,
    status: 'ACTIVE',
  },
  {
    id: 'asg-3',
    classroomId: 'room-3-1',
    title: 'เพลงแบบเพลง',
    sharedTag: 'ใช้ร่วม 6 ห้อง',
    subtext: 'นำเข้าจาก Google Classroom • 16 ก.ค. 2569 11:21:42',
    category: 'เก็บก่อนกลางภาค',
    sgsUnit: 'ช่อง 2 • หน่วยที่ 1',
    dueDate: '5 ส.ค.',
    maxScore: 10,
    submittedCount: 21,
    totalStudents: 23,
    isFull: false,
    status: 'ACTIVE',
  },
  {
    id: 'asg-4',
    classroomId: 'room-3-1',
    title: 'วิดีโอนำเสนอดนตรีไทยในสมัยต่าง ๆ',
    sharedTag: 'ใช้ร่วม 6 ห้อง',
    subtext: 'มอบหมายเมื่อ 1 ก.ย. 2569',
    category: 'เก็บหลังกลางภาค',
    sgsUnit: 'ช่อง 11 • หน่วยที่ 4',
    dueDate: '25 ก.ย.',
    maxScore: 10,
    submittedCount: 0,
    totalStudents: 23,
    isFull: false,
    status: 'ACTIVE',
  },
];

const getLocalAssignments = (): AssignmentRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return defaultAssignments;
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
        .select('*, sgsUnit:SgsUnit(*)')
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
    return all.filter((a) => !a.classroomId || a.classroomId === classroomId || classroomId === 'room-3-1');
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
