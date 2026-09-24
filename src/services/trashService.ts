import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { softDeletedData } from '../data/mockData';
import type { SoftDeletedItem } from '../types/viewModels';

const STORAGE_KEY_TRASH = 'cls_trash_data';

const getLocalTrash = (): SoftDeletedItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_TRASH);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return softDeletedData;
};

const saveLocalTrash = (items: SoftDeletedItem[]) => {
  localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(items));
};

export const trashService = {
  // READ: Get all items in trash
  async getAll(): Promise<SoftDeletedItem[]> {
    if (isSupabaseConfigured) {
      logDbOperation("SELECT * FROM TrashLog WHERE status = 'DELETED'");
      const { data, error } = await supabase
        .from('TrashLog')
        .select('*')
        .eq('status', 'DELETED')
        .order('deleted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          entityType: d.entity_type,
          name: d.name,
          deletedAt: d.deleted_at,
          deletedBy: d.deleted_by || 'ครูผู้สอน',
          daysRemaining: d.days_remaining ?? 30,
        }));
      }
    }
    return getLocalTrash();
  },

  // CREATE: Send item to trash
  async moveToTrash(
    id: string,
    entityType: 'ชั้นเรียน' | 'งาน/การบ้าน' | 'ชุดข้อสอบ' | 'นักเรียน',
    name: string,
    deletedBy = 'ครูภาสภูมิ'
  ): Promise<SoftDeletedItem> {
    const newItem: SoftDeletedItem = {
      id,
      entityType,
      name,
      deletedAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      deletedBy,
      daysRemaining: 30,
    };

    const current = getLocalTrash();
    const updated = [newItem, ...current];
    saveLocalTrash(updated);

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO TrashLog', newItem);
      await supabase.from('TrashLog').insert({
        id: newItem.id,
        entity_type: newItem.entityType,
        name: newItem.name,
        deleted_by: newItem.deletedBy,
        status: 'DELETED',
      });
    }

    return newItem;
  },

  // RESTORE: Restore item back to active
  async restore(id: string): Promise<void> {
    const current = getLocalTrash();
    const updated = current.filter((i) => i.id !== id);
    saveLocalTrash(updated);

    if (isSupabaseConfigured) {
      logDbOperation(`RESTORE Trash item id = ${id}`);
      await supabase.from('TrashLog').delete().eq('id', id);
    }
  },

  // PERMANENT DELETE: Remove irrevocably
  async permanentDelete(id: string): Promise<void> {
    const current = getLocalTrash();
    const updated = current.filter((i) => i.id !== id);
    saveLocalTrash(updated);

    if (isSupabaseConfigured) {
      logDbOperation(`PERMANENT DELETE FROM TrashLog WHERE id = ${id}`);
      await supabase.from('TrashLog').delete().eq('id', id);
    }
  },

  // EMPTY TRASH: Purge everything in trash
  async emptyTrash(): Promise<void> {
    saveLocalTrash([]);

    if (isSupabaseConfigured) {
      logDbOperation('EMPTY TRASH (DELETE FROM TrashLog)');
      await supabase.from('TrashLog').delete().neq('id', 'null');
    }
  },
};
