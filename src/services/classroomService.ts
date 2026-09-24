import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { classroomsListData } from '../data/mockData';
import type { ClassroomRosterItem } from '../types/viewModels';
import { ClassroomCreateSchema, type ClassroomCreateInput } from './types';

const STORAGE_KEY = 'cls_classrooms_data';

// Helper to get local persisted classrooms
const getLocalClassrooms = (): ClassroomRosterItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return classroomsListData;
};

const saveLocalClassrooms = (items: ClassroomRosterItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const classroomService = {
  // READ: List all classrooms
  async getAll(): Promise<ClassroomRosterItem[]> {
    if (isSupabaseConfigured) {
      logDbOperation('SELECT * FROM Classroom WHERE status = ACTIVE');
      const { data, error } = await supabase
        .from('Classroom')
        .select('*')
        .eq('status', 'ACTIVE');

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          name: item.name,
          level: item.level || 'ม.3',
          roomNumber: item.room_number || item.name,
          adviser: item.adviser || 'ครูภาสภูมิ เรืองปราชญ์',
          studentCount: item.student_count || 26,
        }));
      }
    }
    return getLocalClassrooms();
  },

  // READ: Get single classroom
  async getById(id: string): Promise<ClassroomRosterItem | undefined> {
    const list = await this.getAll();
    return list.find((c) => c.id === id);
  },

  // CREATE: Add new classroom
  async create(input: ClassroomCreateInput): Promise<ClassroomRosterItem> {
    // Validate with Zod
    const validated = ClassroomCreateSchema.parse(input);
    const newId = `room-${Date.now()}`;

    const newClassroom: ClassroomRosterItem = {
      id: newId,
      name: validated.name,
      level: validated.level,
      roomNumber: validated.name,
      adviser: validated.adviser || 'ครูภาสภูมิ เรืองปราชญ์',
      studentCount: 0,
    };

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO Classroom', newClassroom);
      await supabase.from('Classroom').insert({
        id: newClassroom.id,
        name: newClassroom.name,
        subject_code: validated.subjectCode,
        subject_name: validated.subjectName,
        status: 'ACTIVE',
      });
    }

    const current = getLocalClassrooms();
    const updated = [newClassroom, ...current];
    saveLocalClassrooms(updated);

    return newClassroom;
  },

  // UPDATE: Edit classroom details
  async update(id: string, updates: Partial<ClassroomRosterItem>): Promise<ClassroomRosterItem> {
    const current = getLocalClassrooms();
    const index = current.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('ไม่พบชั้นเรียนที่ต้องการแก้ไข');

    const updatedItem = { ...current[index], ...updates };
    current[index] = updatedItem;
    saveLocalClassrooms(current);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Classroom SET ... WHERE id = ${id}`, updates);
      await supabase.from('Classroom').update(updates).eq('id', id);
    }

    return updatedItem;
  },

  // DELETE: Soft delete classroom (Move to Trash)
  async delete(id: string): Promise<boolean> {
    const current = getLocalClassrooms();
    const target = current.find((c) => c.id === id);
    if (!target) return false;

    // Filter out from active
    const filtered = current.filter((c) => c.id !== id);
    saveLocalClassrooms(filtered);

    // Record into trash
    const trashKey = 'cls_trash_data';
    const trashItems = JSON.parse(localStorage.getItem(trashKey) || '[]');
    trashItems.unshift({
      id: `del-${Date.now()}`,
      entityType: 'ชั้นเรียน',
      name: target.name,
      deletedAt: new Date().toLocaleDateString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
      deletedBy: 'ครูภาสภูมิ',
      daysRemaining: 30,
      originalData: target,
    });
    localStorage.setItem(trashKey, JSON.stringify(trashItems));

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Classroom SET status = DELETED, deletedAt = NOW() WHERE id = ${id}`);
      await supabase
        .from('Classroom')
        .update({ status: 'DELETED', deletedAt: new Date().toISOString() })
        .eq('id', id);
    }

    return true;
  },
};
