import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { BehaviorLogCreateSchema, type BehaviorLogCreateInput } from './types';

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

const defaultBehaviors: BehaviorRecord[] = [
  {
    id: 'beh-1',
    studentName: 'ด.ช. จิรายุ เดชปันคำ',
    studentId: 'stu-2',
    type: 'POSITIVE',
    text: 'ช่วยจัดเก็บอุปกรณ์เครื่องดนตรีหลังเลิกเรียนอย่างเรียบร้อย',
    points: '+10 XP',
    date: '22 ส.ค. 2569',
    author: 'ครูภาสภูมิ',
  },
  {
    id: 'beh-2',
    studentName: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    studentId: 'stu-1',
    type: 'POSITIVE',
    text: 'แนะนำและสอนเพื่อนร่วมกลุ่มอ่านโน้ตเพลงไทย',
    points: '+5 XP',
    date: '21 ส.ค. 2569',
    author: 'ครูภาสภูมิ',
  },
  {
    id: 'beh-3',
    studentName: 'ด.ช. ภูรินท์ บัณฑิต',
    studentId: 'stu-7',
    type: 'NEGATIVE',
    text: 'ไม่นำสมุดบันทึกโน้ตมาเรียนและพูดคุยส่งเสียงดัง',
    points: '-2 คะแนน',
    date: '18 ส.ค. 2569',
    author: 'ครูภาสภูมิ',
  },
];

const getLocalBehaviors = (): BehaviorRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY_BEHAVIOR);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return defaultBehaviors;
};

const saveLocalBehaviors = (items: BehaviorRecord[]) => {
  localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(items));
};

const getLocalXpTransactions = (): XpTransactionRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY_XP);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [
    {
      id: 'xp-tx-1',
      studentId: 'stu-2',
      amount: 50,
      reason: 'ส่งงานเควสต์ My Soundtrack ตรงเวลา',
      idempotencyKey: 'quest-asg-1-stu-2',
      createdAt: '2026-08-20T10:05:00Z',
    },
    {
      id: 'xp-tx-2',
      studentId: 'stu-1',
      amount: 30,
      reason: 'เข้าเรียนเช็คชื่อตรงเวลา 5 วันรวด (Streak)',
      idempotencyKey: 'streak-week-1-stu-1',
      createdAt: '2026-08-21T08:30:00Z',
    },
  ];
};

const saveLocalXpTransactions = (items: XpTransactionRecord[]) => {
  localStorage.setItem(STORAGE_KEY_XP, JSON.stringify(items));
};

export const behaviorService = {
  // READ: List all behavior records
  async getAll(): Promise<BehaviorRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation('SELECT * FROM BehaviorLog ORDER BY created_at DESC');
      const { data, error } = await supabase
        .from('BehaviorLog')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b) => ({
          id: b.id,
          studentName: b.student_name,
          studentId: b.student_id,
          type: b.type,
          text: b.text,
          points: b.points,
          date: b.date,
          author: b.author || 'ครูผู้สอน',
        }));
      }
    }
    return getLocalBehaviors();
  },

  // CREATE: Add new behavior record
  async create(input: BehaviorLogCreateInput, author = 'ครูภาสภูมิ'): Promise<BehaviorRecord> {
    const validated = BehaviorLogCreateSchema.parse(input);
    const newRecord: BehaviorRecord = {
      id: `beh-${Date.now()}`,
      studentName: validated.studentName,
      type: validated.type,
      text: validated.text,
      points: validated.points,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      author,
    };

    const current = getLocalBehaviors();
    const updated = [newRecord, ...current];
    saveLocalBehaviors(updated);

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO BehaviorLog', newRecord);
      await supabase.from('BehaviorLog').insert({
        id: newRecord.id,
        student_name: newRecord.studentName,
        type: newRecord.type,
        text: newRecord.text,
        points: newRecord.points,
        date: newRecord.date,
        author: newRecord.author,
      });
    }

    return newRecord;
  },

  // DELETE: Delete behavior record
  async delete(id: string): Promise<void> {
    const current = getLocalBehaviors();
    const updated = current.filter((b) => b.id !== id);
    saveLocalBehaviors(updated);

    if (isSupabaseConfigured) {
      logDbOperation(`DELETE FROM BehaviorLog WHERE id = ${id}`);
      await supabase.from('BehaviorLog').delete().eq('id', id);
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
        .select('*')
        .eq('studentId', studentId)
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as XpTransactionRecord[];
      }
    }
    const all = getLocalXpTransactions();
    return all.filter((tx) => tx.studentId === studentId);
  },
};
