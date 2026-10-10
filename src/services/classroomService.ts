import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import type { ClassroomRosterItem } from '../types/viewModels';
import { ClassroomCreateSchema, type ClassroomCreateInput } from './types.ts';
import { cleanSlateService } from './cleanSlateService.ts';

const STORAGE_KEY = 'cls_classrooms_data';
const DELETED_ROOMS_KEY = 'cls_deleted_classrooms_set';

export const getDeletedRoomsSet = (): Set<string> => {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(DELETED_ROOMS_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {
      // ignore
    }
  }
  return new Set();
};

export const saveDeletedRoomsSet = (set: Set<string>) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
};

// Helper to get local persisted classrooms
const getLocalClassrooms = (): ClassroomRosterItem[] => {
  const deletedSet = getDeletedRoomsSet();
  let result: ClassroomRosterItem[] = cleanSlateService.isCleanSlateActive() ? [] : INITIAL_SEED_CLASSROOMS;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          result = parsed;
        }
      } catch {
        // fallback
      }
    }
  }
  return result
    .filter((c) => !deletedSet.has(c.id) && !deletedSet.has(c.name))
    .map((c) => {
      const advisers = c.advisers || [c.adviser, c.coAdviser, c.thirdAdviser].filter(Boolean) as string[];
      return {
        ...c,
        advisers,
      };
    });
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

    if (cleanSlateService.isCleanSlateActive()) {
      return [];
    }

    return DEFAULT_TEACHER_ACCOUNTS;
  },
  // READ: List all classrooms directly from Supabase (Zero Mock Data)
  async getAll(): Promise<ClassroomRosterItem[]> {
    const deletedSet = getDeletedRoomsSet();
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
          const mapped: ClassroomRosterItem[] = data
            .filter((item) => !deletedSet.has(item.id) && !deletedSet.has(item.name))
            .map((item) => {
              const adviser = item.adviser || 'ยังไม่ได้กำหนด';
              const coAdviser = item.co_adviser || item.coAdviser || undefined;
              const thirdAdviser = item.third_adviser || item.thirdAdviser || undefined;
              const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];
              return {
                id: item.id,
                name: item.name,
                level: item.level || `ม.${item.grade_level || 1}`,
                roomNumber: item.name,
                adviser,
                coAdviser,
                thirdAdviser,
                advisers,
                studentCount: Number(item.student_count || 0),
              };
            });
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
          const mapped: ClassroomRosterItem[] = tData
            .filter((item) => !deletedSet.has(item.id) && !deletedSet.has(item.name))
            .map((item) => {
              const adviser = item.adviser || 'ยังไม่ได้กำหนด';
              const coAdviser = item.coAdviser || undefined;
              const thirdAdviser = item.thirdAdviser || undefined;
              const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];
              return {
                id: item.id,
                name: item.name,
                level: `ม.${item.gradeLevel || 1}`,
                roomNumber: item.name,
                adviser,
                coAdviser,
                thirdAdviser,
                advisers,
                studentCount: 0,
              };
            });
          saveLocalClassrooms(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching ClassRoom table from Supabase:', err);
      }
    }

    return getLocalClassrooms();
  },

  // READ: List all classrooms (alias for getClassrooms)
  async getClassrooms(): Promise<ClassroomRosterItem[]> {
    return this.getAll();
  },

  // READ: List all classrooms synchronously from local storage / cache
  getClassroomsSync(): ClassroomRosterItem[] {
    return getLocalClassrooms();
  },

  // READ: Get single classroom
  async getById(id: string): Promise<ClassroomRosterItem | undefined> {
    const list = await this.getAll();
    return list.find((c) => c.id === id || c.name === id);
  },

  // Find advisory classroom for teacher (checks adviser, coAdviser, thirdAdviser)
  async getTeacherAdvisoryClassroom(teacherNameOrId?: string | null): Promise<ClassroomRosterItem | null> {
    if (!teacherNameOrId || !teacherNameOrId.trim()) return null;
    const cleanQuery = teacherNameOrId.trim();
    const all = await this.getAll();
    for (const room of all) {
      const list = [room.adviser, room.coAdviser, room.thirdAdviser, ...(room.advisers || [])].filter(Boolean) as string[];
      for (const adv of list) {
        if (!adv || adv === 'ยังไม่ได้กำหนด') continue;
        if (adv === cleanQuery || adv.includes(cleanQuery) || cleanQuery.includes(adv)) {
          return room;
        }
      }
    }
    return null;
  },

  // CREATE: Add new classroom in Supabase
  async create(input: ClassroomCreateInput): Promise<ClassroomRosterItem> {
    const validated = ClassroomCreateSchema.parse(input);
    const newId = `room-${Date.now()}`;

    // If room was previously in deleted set, remove it
    const deletedSet = getDeletedRoomsSet();
    if (deletedSet.has(validated.name)) {
      deletedSet.delete(validated.name);
      saveDeletedRoomsSet(deletedSet);
    }

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

    const adviser = validated.adviser || 'ยังไม่ได้กำหนด';
    const coAdviser = validated.coAdviser;
    const thirdAdviser = validated.thirdAdviser;
    const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];

    const newClassroom: ClassroomRosterItem = {
      id: newId,
      name: validated.name,
      level: validated.level,
      roomNumber: validated.name,
      adviser,
      coAdviser,
      thirdAdviser,
      advisers,
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

  // UPDATE: Edit classroom details (Name, Advisers, etc.)
  async update(id: string, updates: Partial<ClassroomRosterItem>): Promise<ClassroomRosterItem> {
    const current = getLocalClassrooms();
    const index = current.findIndex((c) => c.id === id || c.name === id);
    const existing = index !== -1 ? current[index] : null;

    const adviser = updates.adviser !== undefined ? updates.adviser : (existing?.adviser || 'ยังไม่ได้กำหนด');
    const coAdviser = updates.coAdviser !== undefined ? updates.coAdviser : existing?.coAdviser;
    const thirdAdviser = updates.thirdAdviser !== undefined ? updates.thirdAdviser : existing?.thirdAdviser;
    const advisers = [adviser, coAdviser, thirdAdviser].filter(Boolean) as string[];

    const updatedItem: ClassroomRosterItem = {
      id,
      name: updates.name || existing?.name || id,
      level: updates.level || existing?.level || 'ม.1',
      roomNumber: updates.name || existing?.roomNumber || id,
      adviser,
      coAdviser,
      thirdAdviser,
      advisers,
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

        await supabase.from('ClassRoom').update(payload).or(`id.eq.${id},name.eq.${existing?.name || id}`);
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

  // UPDATE ADVISERS: Set up to 3 advisors
  async updateAdvisers(
    id: string,
    adviser: string,
    coAdviser?: string,
    thirdAdviser?: string
  ): Promise<ClassroomRosterItem> {
    return this.update(id, { adviser, coAdviser, thirdAdviser });
  },

  // UPSERT: If room already exists, update advisors. If not, create new classroom.
  async upsertClassrooms(
    items: Array<{
      name: string;
      level?: string;
      adviser?: string;
      coAdviser?: string;
      thirdAdviser?: string;
      studentCount?: number;
    }>
  ): Promise<{ updatedCount: number; createdCount: number }> {
    const current = await this.getAll();
    let updatedCount = 0;
    let createdCount = 0;

    for (const item of items) {
      const cleanName = item.name.trim();
      if (!cleanName) continue;
      const existing = current.find((c) => c.name === cleanName || c.roomNumber === cleanName);
      if (existing) {
        await this.update(existing.id, {
          adviser: item.adviser?.trim() || existing.adviser,
          coAdviser: item.coAdviser?.trim() !== undefined ? item.coAdviser.trim() : existing.coAdviser,
          thirdAdviser: item.thirdAdviser?.trim() !== undefined ? item.thirdAdviser.trim() : existing.thirdAdviser,
        });
        updatedCount++;
      } else {
        await this.create({
          name: cleanName,
          level: item.level || 'ม.1',
          adviser: item.adviser?.trim() || 'ยังไม่ได้กำหนด',
          coAdviser: item.coAdviser?.trim(),
          thirdAdviser: item.thirdAdviser?.trim(),
        });
        createdCount++;
      }
    }

    return { updatedCount, createdCount };
  },

  // DELETE: Soft delete classroom (mark status = INACTIVE / DELETED in Supabase & blacklist locally)
  async delete(id: string): Promise<boolean> {
    const current = getLocalClassrooms();
    const target = current.find((c) => c.id === id || c.name === id);
    const targetName = target?.name || id;

    // Record into deleted blacklist so it NEVER resurfaces
    const deletedSet = getDeletedRoomsSet();
    deletedSet.add(id);
    if (target?.name) deletedSet.add(target.name);
    saveDeletedRoomsSet(deletedSet);

    // Filter out from local active
    const filtered = current.filter((c) => c.id !== id && c.name !== id && c.name !== targetName);
    saveLocalClassrooms(filtered);

    // Record into trash
    if (typeof localStorage !== 'undefined') {
      const trashKey = 'cls_trash_data';
      const trashItems = JSON.parse(localStorage.getItem(trashKey) || '[]');
      trashItems.unshift({
        id: `del-${Date.now()}`,
        entityType: 'ชั้นเรียน',
        name: targetName,
        deletedAt: new Date().toLocaleDateString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
        deletedBy: 'ผู้ดูแลระบบวิชาการ',
        daysRemaining: 30,
        originalData: target || { id, name: targetName },
      });
      localStorage.setItem(trashKey, JSON.stringify(trashItems));
    }

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE ClassRoom SET status = INACTIVE WHERE id = ${id}`);
      try {
        await supabase
          .from('ClassRoom')
          .update({ status: 'INACTIVE', updatedAt: new Date().toISOString() })
          .or(`id.eq.${id},name.eq.${targetName}`);
      } catch (err) {
        console.error('Failed to soft-delete ClassRoom in Supabase:', err);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('kps-data-sync-event', {
        detail: { type: 'CLASSROOM_DELETED', classroomId: id, classroomName: targetName }
      }));
    } catch {
      // safe SSR
    }

    return true;
  },
};
