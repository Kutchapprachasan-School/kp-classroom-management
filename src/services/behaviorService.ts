import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { BehaviorLogCreateSchema, type BehaviorLogCreateInput } from './types';
import { authService } from './authService';

export interface BehaviorRecord {
  id: string;
  studentName: string;
  studentId?: string;
  type: 'POSITIVE' | 'NEGATIVE';
  text: string;
  points: string;
  date: string;
  author: string;
}

export interface XpTransactionRecord {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
  createdAt: string;
}

const STORAGE_KEY_BEHAVIOR = 'cls_behavior_logs';
const STORAGE_KEY_XP = 'cls_xp_transactions';

const getLocalBehaviors = (): BehaviorRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_BEHAVIOR);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const legacyMockIds = new Set(['beh-1', 'beh-2', 'beh-3']);
        return parsed.filter((b: BehaviorRecord) => !legacyMockIds.has(b.id));
      }
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalBehaviors = (items: BehaviorRecord[]) => {
  localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(items));
};

const getLocalXpTransactions = (): XpTransactionRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_XP);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalXpTransactions = (items: XpTransactionRecord[]) => {
  localStorage.setItem(STORAGE_KEY_XP, JSON.stringify(items));
};

export const behaviorService = {
  // READ: List all behavior records
  async getAll(): Promise<BehaviorRecord[]> {
    if (isSupabaseConfigured) {
      try {
        logDbOperation('SELECT selective FROM BehaviorRecord ORDER BY createdAt DESC LIMIT 100');
        const { data, error } = await supabase
          .from('BehaviorRecord')
          .select('id, studentName, studentId, type, description, text, points, businessDate, createdAt, reportedById, author')
          .order('createdAt', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          return data.map((b: any) => ({
            id: b.id,
            studentName: b.studentName || b.student_name || 'นักเรียน',
            studentId: b.studentId || b.student_id,
            type: b.type === 'MERIT' ? 'POSITIVE' : 'NEGATIVE',
            text: b.description || b.text || '',
            points: b.points || 0,
            date: b.businessDate || (b.createdAt ? new Date(b.createdAt).toLocaleDateString('th-TH') : ''),
            author: b.reportedById || b.author || 'ครูผู้สอน',
          }));
        }
      } catch (err) {
        console.warn('[behaviorService] Query error:', err);
      }
    }
    return getLocalBehaviors();
  },

  // CREATE: Add new behavior record
  async create(input: BehaviorLogCreateInput, author?: string): Promise<BehaviorRecord> {
    const validated = BehaviorLogCreateSchema.parse(input);
    const effectiveAuthor = author || authService.getCurrentUser()?.name || 'ครูผู้สอน';
    const newRecord: BehaviorRecord = {
      id: `beh-${Date.now()}`,
      studentName: validated.studentName,
      studentId: validated.studentId,
      type: validated.type,
      text: validated.text,
      points: validated.points,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      author: effectiveAuthor,
    };

    const current = getLocalBehaviors();
    const updated = [newRecord, ...current];
    saveLocalBehaviors(updated);

    if (isSupabaseConfigured) {
      try {
        logDbOperation('INSERT INTO BehaviorRecord', newRecord);
        await supabase.from('BehaviorRecord').insert({
          id: newRecord.id,
          studentId: newRecord.studentId || undefined,
          academicYear: 2569,
          sequenceNo: Math.floor(Date.now() / 1000),
          type: newRecord.type === 'POSITIVE' ? 'MERIT' : 'DEMERIT',
          category: 'OTHER',
          points: parseInt(String(newRecord.points).replace(/[^0-9-]/g, ''), 10) || 0,
          balanceAfter: 100,
          description: newRecord.text,
          reportedById: authService.getCurrentUser()?.id || 'usr-teacher-1',
          incidentTimestamp: new Date().toISOString(),
          businessDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[behaviorService] Insert error:', err);
      }
    }

    return newRecord;
  },

  // DELETE: Delete behavior record
  async delete(id: string): Promise<void> {
    const current = getLocalBehaviors();
    const updated = current.filter((b) => b.id !== id);
    saveLocalBehaviors(updated);

    if (isSupabaseConfigured) {
      try {
        logDbOperation(`DELETE FROM BehaviorRecord WHERE id = ${id}`);
        await supabase.from('BehaviorRecord').delete().eq('id', id);
      } catch (err) {
        console.warn('[behaviorService] Delete error:', err);
      }
    }
  },

  // XP LEDGER: Idempotent XP crediting to prevent duplicate rewards
  async awardXp(
    studentId: string,
    amount: number,
    reason: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; newTotal: number; message: string }> {
    const txs = getLocalXpTransactions();

    // Check idempotency: if this key already processed, return existing
    const existing = txs.find((tx) => tx.idempotencyKey === idempotencyKey);
    if (existing) {
      const studentTotal = txs
        .filter((tx) => tx.studentId === studentId)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        success: true,
        newTotal: studentTotal,
        message: 'ธุรกรรมนี้ได้รับแต้ม XP ไปแล้ว (Idempotency Safe)',
      };
    }

    const newTx: XpTransactionRecord = {
      id: `xp-${Date.now()}`,
      studentId,
      amount,
      reason,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    txs.push(newTx);
    saveLocalXpTransactions(txs);

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO XpTransaction (Idempotent)', newTx);
      await supabase.from('XpTransaction').insert(newTx);
    }

    const newTotal = txs
      .filter((tx) => tx.studentId === studentId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      success: true,
      newTotal,
      message: `เพิ่ม ${amount > 0 ? '+' : ''}${amount} XP สำเร็จ`,
    };
  },

  // READ: Get XP history for student
  async getXpTransactions(studentId: string): Promise<XpTransactionRecord[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('XpTransaction')
        .select('id, studentId, amount, reason, createdAt')
        .eq('studentId', studentId)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return data as XpTransactionRecord[];
      }
    }
    const all = getLocalXpTransactions();
    return all.filter((tx) => tx.studentId === studentId);
  },
};
