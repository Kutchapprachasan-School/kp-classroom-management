import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import type { ClassroomRosterItem } from '../types/viewModels';
import { ClassroomCreateSchema, type ClassroomCreateInput } from './types';

const STORAGE_KEY = 'cls_classrooms_data';

// Helper to get local persisted classrooms
const getLocalClassrooms = (): ClassroomRosterItem[] => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
  }
  return INITIAL_SEED_CLASSROOMS;
};

const saveLocalClassrooms = (items: ClassroomRosterItem[]) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
};

export interface TeacherAccountItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  position?: string;
  subjectGroup?: string;
}

export const DEFAULT_TEACHER_ACCOUNTS: TeacherAccountItem[] = [
  {
    id: 'u-panjapol',
    name: 'นายปัญจพล เกษรัตน์',
    username: 'panjapol.k',
    email: 'panjapol.k@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครูประจำวิชา & ที่ปรึกษา ม.3/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (ภาษาญี่ปุ่น)',
  },
  {
    id: 'u-1',
    name: 'ครูภาสภูมิ เรืองปราชญ์',
    username: 'passapoom.r',
    email: 'passapoom.r@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครูชำนาญการ • ที่ปรึกษา ม.3/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้ศิลปะ',
  },
  {
    id: 'u-2',
    name: 'ครูวิภาดา สมบูรณ์',
    username: 'wiphada.s',
    email: 'wiphada.s@kutchap.ac.th',
    role: 'STUDENT_AFFAIRS',
    position: 'หัวหน้างานกิจการนักเรียน • ที่ปรึกษา ม.2/1',
    subjectGroup: 'กลุ่มบริหารงานกิจการนักเรียน',
  },
  {
    id: 'u-3',
    name: 'นายสมชาย ใจดี',
    username: 'somchai.j',
    email: 'somchai.j@kutchap.ac.th',
    role: 'ADMIN',
    position: 'ผู้อำนวยการโรงเรียน',
    subjectGroup: 'ฝ่ายบริหารโรงเรียน',
  },
  {
    id: 'u-4',
    name: 'ครูชูเกียรติ มุ่งมั่น',
    username: 'chookiat.m',
    email: 'chookiat.m@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครูชำนาญการพิเศษ • ที่ปรึกษา ม.1/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
  },
  {
    id: 'u-5',
    name: 'ครูศิริพร บุญรักษา',
    username: 'siriporn.b',
    email: 'siriporn.b@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครู • ที่ปรึกษา ม.1/2',
    subjectGroup: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
  },
  {
    id: 'u-6',
    name: 'ครูนภาพร ศรีสุข',
    username: 'napaporn.s',
    email: 'napaporn.s@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครู • ที่ปรึกษา ม.2/2',
    subjectGroup: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
  },
  {
    id: 'u-7',
    name: 'ครูสุรชัย วิจิตรศิลป์',
    username: 'surachai.w',
    email: 'surachai.w@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครู • ที่ปรึกษา ม.3/2',
    subjectGroup: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
  },
  {
    id: 'u-8',
    name: 'ครูจิราภรณ์ แสนดี',
    username: 'jiraporn.s',
    email: 'jiraporn.s@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครู • ที่ปรึกษา ม.4/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้การงานอาชีพ',
  },
  {
    id: 'u-9',
    name: 'ครูธนกร เกียรติขจร',
    username: 'thanakorn.k',
    email: 'thanakorn.k@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครูชำนาญการ • ที่ปรึกษา ม.5/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
  },
  {
    id: 'u-10',
    name: 'ครูพิมพ์ใจ รักษ์ถิ่น',
    username: 'pimjai.r',
    email: 'pimjai.r@kutchap.ac.th',
    role: 'TEACHER',
    position: 'ครู • ที่ปรึกษา ม.6/1',
    subjectGroup: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
  },
];

export const INITIAL_SEED_CLASSROOMS: ClassroomRosterItem[] = [
  { id: 'room-1-1', name: 'ม.1/1', level: 'ม.1', roomNumber: 'ม.1/1', adviser: 'ครูชูเกียรติ มุ่งมั่น', studentCount: 30 },
  { id: 'room-1-2', name: 'ม.1/2', level: 'ม.1', roomNumber: 'ม.1/2', adviser: 'ครูศิริพร บุญรักษา', studentCount: 28 },
  { id: 'room-1-8', name: 'ม.1/8', level: 'ม.1', roomNumber: 'ม.1/8', adviser: 'ครูเอกชัย มิ่งขวัญ', studentCount: 27 },
  { id: 'room-2-1', name: 'ม.2/1', level: 'ม.2', roomNumber: 'ม.2/1', adviser: 'ครูวิภาดา สมบูรณ์', studentCount: 32 },
  { id: 'room-2-2', name: 'ม.2/2', level: 'ม.2', roomNumber: 'ม.2/2', adviser: 'ครูนภาพร ศรีสุข', studentCount: 31 },
  { id: 'room-2-8', name: 'ม.2/8', level: 'ม.2', roomNumber: 'ม.2/8', adviser: 'ครูชนิกา ทรัพย์สุข', studentCount: 35 },
  { id: 'room-3-1', name: 'ม.3/1', level: 'ม.3', roomNumber: 'ม.3/1', adviser: 'ครูภาสภูมิ เรืองปราชญ์', studentCount: 32 },
  { id: 'room-3-2', name: 'ม.3/2', level: 'ม.3', roomNumber: 'ม.3/2', adviser: 'ครูสุรชัย วิจิตรศิลป์', studentCount: 30 },
  { id: 'room-3-8', name: 'ม.3/8', level: 'ม.3', roomNumber: 'ม.3/8', adviser: 'นายปัญจพล เกษรัตน์', studentCount: 32 },
  { id: 'room-4-1', name: 'ม.4/1', level: 'ม.4', roomNumber: 'ม.4/1', adviser: 'ครูจิราภรณ์ แสนดี', studentCount: 35 },
  { id: 'room-5-1', name: 'ม.5/1', level: 'ม.5', roomNumber: 'ม.5/1', adviser: 'ครูธนกร เกียรติขจร', studentCount: 33 },
  { id: 'room-6-1', name: 'ม.6/1', level: 'ม.6', roomNumber: 'ม.6/1', adviser: 'ครูพิมพ์ใจ รักษ์ถิ่น', studentCount: 34 },
];

const TEACHERS_CACHE_KEY = 'kp_teacher_accounts_cache';

export const classroomService = {
  // READ: List all real teacher accounts directly from Supabase User table
  async getTeacherAccounts(): Promise<TeacherAccountItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, name, username, email, role, position, subjectGroup')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const teachers: TeacherAccountItem[] = data.filter((u: any) =>
            u.role === 'TEACHER' ||
            u.role === 'ADMIN' ||
            u.position?.includes('ครู') ||
            u.position?.includes('ผู้อำนวยการ') ||
            u.position?.includes('รองผู้') ||
            u.subjectGroup
          );
          if (teachers.length > 0) {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify(teachers));
            }
            return teachers;
          }
        }
      } catch (err) {
        console.warn('Error fetching teacher accounts from Supabase:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(TEACHERS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }

    return DEFAULT_TEACHER_ACCOUNTS;
  },
  // READ: List all classrooms directly from Supabase (Zero Mock Data)
  async getAll(): Promise<ClassroomRosterItem[]> {
    if (isSupabaseConfigured) {
      logDbOperation('SELECT * FROM classrooms WHERE status = ACTIVE');
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('grade_level', { ascending: true })
          .order('room_number', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ClassroomRosterItem[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            level: item.level || `ม.${item.grade_level || 1}`,
            roomNumber: item.name,
            adviser: item.adviser || 'ยังไม่ได้กำหนด',
            studentCount: Number(item.student_count || 0),
          }));
          saveLocalClassrooms(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching classrooms view from Supabase:', err);
      }

      // Fallback directly to ClassRoom table if view is unavailable
      try {
        const { data: tData, error: tErr } = await supabase
          .from('ClassRoom')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('gradeLevel', { ascending: true })
          .order('roomNumber', { ascending: true });

        if (!tErr && tData && tData.length > 0) {
          const mapped: ClassroomRosterItem[] = tData.map((item) => ({
            id: item.id,
            name: item.name,
            level: `ม.${item.gradeLevel || 1}`,
            roomNumber: item.name,
            adviser: item.adviser || 'ยังไม่ได้กำหนด',
            studentCount: 0,
          }));
          saveLocalClassrooms(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching ClassRoom table from Supabase:', err);
      }
    }

    return getLocalClassrooms();
  },

  // READ: Get single classroom
  async getById(id: string): Promise<ClassroomRosterItem | undefined> {
    const list = await this.getAll();
    return list.find((c) => c.id === id || c.name === id);
  },

  // CREATE: Add new classroom in Supabase
  async create(input: ClassroomCreateInput): Promise<ClassroomRosterItem> {
    const validated = ClassroomCreateSchema.parse(input);
    const newId = `room-${Date.now()}`;

    // Extract grade level and room number from name (e.g. "ม.1/3" -> grade 1, room 3)
    let gradeLevel = 1;
    let roomNumber = 1;
    const match = validated.name.match(/ม\.?\s*(\d+)\s*\/\s*(\d+)/);
    if (match) {
      gradeLevel = parseInt(match[1], 10);
      roomNumber = parseInt(match[2], 10);
    } else {
      const levelMatch = validated.level.match(/\d+/);
      if (levelMatch) gradeLevel = parseInt(levelMatch[0], 10);
    }

    const newClassroom: ClassroomRosterItem = {
      id: newId,
      name: validated.name,
      level: validated.level,
      roomNumber: validated.name,
      adviser: validated.adviser || 'ยังไม่ได้กำหนด',
      studentCount: 0,
    };

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO ClassRoom', newClassroom);
      try {
        await supabase.from('ClassRoom').insert({
          id: newClassroom.id,
          name: newClassroom.name,
          gradeLevel,
          roomNumber,
          adviser: newClassroom.adviser,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to insert ClassRoom in Supabase:', err);
      }
    }

    const current = getLocalClassrooms();
    const updated = [...current, newClassroom];
    saveLocalClassrooms(updated);

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_CREATED', classroom: newClassroom }
      }));
    } catch {
      // safe SSR
    }

    return newClassroom;
  },

  // UPDATE: Edit classroom details (Name, Adviser, etc.)
  async update(id: string, updates: Partial<ClassroomRosterItem>): Promise<ClassroomRosterItem> {
    const current = getLocalClassrooms();
    const index = current.findIndex((c) => c.id === id || c.name === id);
    const existing = index !== -1 ? current[index] : null;

    const updatedItem: ClassroomRosterItem = {
      id,
      name: updates.name || existing?.name || id,
      level: updates.level || existing?.level || 'ม.1',
      roomNumber: updates.name || existing?.roomNumber || id,
      adviser: updates.adviser !== undefined ? updates.adviser : (existing?.adviser || 'ยังไม่ได้กำหนด'),
      studentCount: updates.studentCount !== undefined ? updates.studentCount : (existing?.studentCount || 0),
    };

    if (index !== -1) {
      current[index] = updatedItem;
      saveLocalClassrooms(current);
    }

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE ClassRoom WHERE id = ${id}`, updates);
      try {
        const payload: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
        if (updates.name) payload.name = updates.name;
        if (updates.adviser !== undefined) payload.adviser = updates.adviser;

        await supabase.from('ClassRoom').update(payload).eq('id', id);
      } catch (err) {
        console.error('Failed to update ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_UPDATED', classroomId: id, updates }
      }));
    } catch {
      // safe SSR
    }

    return updatedItem;
  },

  // UPDATE ADVISERS: Set primary advisor and co-advisor
  async updateAdvisers(id: string, adviser: string, coAdviser?: string): Promise<ClassroomRosterItem> {
    return this.update(id, { adviser, coAdviser });
  },

  // DELETE: Soft delete classroom (mark status = INACTIVE / DELETED in Supabase)
  async delete(id: string): Promise<boolean> {
    const current = getLocalClassrooms();
    const target = current.find((c) => c.id === id || c.name === id);

    // Filter out from local active
    const filtered = current.filter((c) => c.id !== id && c.name !== id);
    saveLocalClassrooms(filtered);

    // Record into trash
    if (typeof localStorage !== 'undefined') {
      const trashKey = 'cls_trash_data';
      const trashItems = JSON.parse(localStorage.getItem(trashKey) || '[]');
      trashItems.unshift({
        id: `del-${Date.now()}`,
        entityType: 'ชั้นเรียน',
        name: target?.name || id,
        deletedAt: new Date().toLocaleDateString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
        deletedBy: 'ผู้ดูแลระบบวิชาการ',
        daysRemaining: 30,
        originalData: target,
      });
      localStorage.setItem(trashKey, JSON.stringify(trashItems));
    }

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE ClassRoom SET status = INACTIVE WHERE id = ${id}`);
      try {
        await supabase
          .from('ClassRoom')
          .update({ status: 'INACTIVE', updatedAt: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to soft-delete ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_DELETED', classroomId: id }
      }));
    } catch {
      // safe SSR
    }

    return true;
  },
};
