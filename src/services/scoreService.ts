import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import { ScoreUpdateSchema, type ScoreUpdateInput } from './types';

export interface ScoreRecord {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  classroomId: string;
  score: number | null;
  maxScore: number;
  isExempt: boolean;
  state: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
  version?: number;
  updatedAt: string;
}

export interface ScoreAuditLogRecord {
  id: string;
  scoreId: string;
  assignmentId: string;
  enrollmentId: string;
  oldValue: number | null;
  newValue: number | null;
  reason: string;
  changedBy: string;
  timestamp: string;
}

const STORAGE_KEY_SCORES = 'cls_scores_data';
const STORAGE_KEY_AUDIT = 'cls_score_audit_data';

// Initial default score records
const defaultScores: ScoreRecord[] = [
  { id: 'sc-1', assignmentId: 'asg-1', enrollmentId: 'stu-1', classroomId: 'room-3-1', score: 10, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-20T10:00:00Z' },
  { id: 'sc-2', assignmentId: 'asg-1', enrollmentId: 'stu-2', classroomId: 'room-3-1', score: 9.5, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-20T10:05:00Z' },
  { id: 'sc-3', assignmentId: 'asg-1', enrollmentId: 'stu-7', classroomId: 'room-3-1', score: 3.0, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-20T10:10:00Z' },
  { id: 'sc-4', assignmentId: 'asg-1', enrollmentId: 'stu-10', classroomId: 'room-3-1', score: 4.0, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-20T10:15:00Z' },
  { id: 'sc-5', assignmentId: 'asg-2', enrollmentId: 'stu-1', classroomId: 'room-3-1', score: 10, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-10T10:00:00Z' },
  { id: 'sc-6', assignmentId: 'asg-2', enrollmentId: 'stu-2', classroomId: 'room-3-1', score: 10, maxScore: 10, isExempt: false, state: 'SUBMITTED', updatedAt: '2026-08-10T10:05:00Z' },
  { id: 'sc-7', assignmentId: 'asg-3', enrollmentId: 'stu-1', classroomId: 'room-3-1', score: 9.0, maxScore: 10, isExempt: false, state: 'DRAFT', updatedAt: '2026-08-05T10:00:00Z' },
  { id: 'sc-8', assignmentId: 'asg-3', enrollmentId: 'stu-7', classroomId: 'room-3-1', score: null, maxScore: 10, isExempt: false, state: 'DRAFT', updatedAt: '2026-08-05T10:00:00Z' },
];

const getLocalScores = (): ScoreRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY_SCORES);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return defaultScores;
};

const saveLocalScores = (items: ScoreRecord[]) => {
  localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(items));
};

const getLocalAuditLogs = (): ScoreAuditLogRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [
    {
      id: 'audit-init-1',
      scoreId: 'sc-3',
      assignmentId: 'asg-1',
      enrollmentId: 'stu-7',
      oldValue: 0,
      newValue: 3.0,
      reason: 'นักเรียนส่งงานแก้รอบสอง ตรวจให้คะแนนผ่านเกณฑ์ขั้นต่ำ',
      changedBy: 'ครูภาสภูมิ เรืองปราชญ์',
      timestamp: '2026-08-21T09:30:00.000Z',
    },
  ];
};

const saveLocalAuditLogs = (items: ScoreAuditLogRecord[]) => {
  localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(items));
};

export const scoreService = {
  // READ: Get all scores for an assignment
  async getByAssignment(assignmentId: string): Promise<ScoreRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Score WHERE assignmentId = ${assignmentId}`);
      const { data, error } = await supabase
        .from('Score')
        .select('*')
        .eq('assignmentId', assignmentId);

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          assignmentId: item.assignmentId,
          enrollmentId: item.enrollmentId,
          classroomId: item.classroomId,
          score: item.value,
          maxScore: item.maxScore || 10,
          isExempt: item.isExempt || false,
          state: item.state || 'DRAFT',
          updatedAt: item.updatedAt,
        }));
      }
    }
    const all = getLocalScores();
    return all.filter((s) => s.assignmentId === assignmentId);
  },

  // READ: Get all scores for a student
  async getByStudent(enrollmentId: string): Promise<ScoreRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Score WHERE enrollmentId = ${enrollmentId}`);
      const { data, error } = await supabase
        .from('Score')
        .select('*')
        .eq('enrollmentId', enrollmentId);

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          assignmentId: item.assignmentId,
          enrollmentId: item.enrollmentId,
          classroomId: item.classroomId,
          score: item.value,
          maxScore: item.maxScore || 10,
          isExempt: item.isExempt || false,
          state: item.state || 'DRAFT',
          updatedAt: item.updatedAt,
        }));
      }
    }
    const all = getLocalScores();
    return all.filter((s) => s.enrollmentId === enrollmentId);
  },

  // READ: Get audit logs (optionally filtered by assignment or student)
  async getAuditLogs(assignmentId?: string, enrollmentId?: string): Promise<ScoreAuditLogRecord[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from('ScoreAuditLog').select('*').order('created_at', { ascending: false });
      if (assignmentId) query = query.eq('assignmentId', assignmentId);
      if (enrollmentId) query = query.eq('enrollmentId', enrollmentId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((log) => ({
          id: log.id,
          scoreId: log.scoreId,
          assignmentId: log.assignmentId,
          enrollmentId: log.enrollmentId,
          oldValue: log.oldValue,
          newValue: log.newValue,
          reason: log.reason,
          changedBy: log.changedBy,
          timestamp: log.created_at,
        }));
      }
    }
    const logs = getLocalAuditLogs();
    return logs.filter((l) => {
      if (assignmentId && l.assignmentId !== assignmentId) return false;
      if (enrollmentId && l.enrollmentId !== enrollmentId) return false;
      return true;
    });
  },

  // CREATE / UPDATE: Upsert a single score with ADR-001 Invariant validation & Audit Log
  async upsertScore(input: ScoreUpdateInput): Promise<ScoreRecord> {
    const validated = ScoreUpdateSchema.parse(input);
    const allScores = getLocalScores();
    const existingIndex = allScores.findIndex(
      (s) => s.assignmentId === validated.assignmentId && s.enrollmentId === validated.enrollmentId
    );

    const now = new Date().toISOString();
    let scoreRecord: ScoreRecord;
    const oldScoreValue = existingIndex >= 0 ? allScores[existingIndex].score : null;

    if (existingIndex >= 0) {
      const currentRecord = allScores[existingIndex];
      const currentVersion = currentRecord.version ?? 1;
      if (validated.expectedVersion !== undefined && validated.expectedVersion !== currentVersion) {
        throw new Error(
          'เกิดข้อขัดแย้งในการบันทึกคะแนน (Concurrency Conflict): มีผู้ใช้อื่นแก้ไขคะแนนนี้ไปก่อนหน้า กรุณารีเฟรชหน้าจอเพื่อโหลดข้อมูลล่าสุด'
        );
      }
      scoreRecord = {
        ...currentRecord,
        score: validated.value,
        maxScore: validated.maxScore,
        isExempt: validated.isExempt ?? false,
        state: validated.state,
        version: currentVersion + 1,
        updatedAt: now,
      };
      allScores[existingIndex] = scoreRecord;
    } else {
      scoreRecord = {
        id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assignmentId: validated.assignmentId,
        enrollmentId: validated.enrollmentId,
        classroomId: validated.classroomId,
        score: validated.value,
        maxScore: validated.maxScore,
        isExempt: validated.isExempt ?? false,
        state: validated.state,
        version: 1,
        updatedAt: now,
      };
      allScores.push(scoreRecord);
    }
    saveLocalScores(allScores);

    // If score changed and reason is provided (or mandatory for SUBMITTED/LOCKED), log to audit
    if (oldScoreValue !== validated.value && (validated.reason || validated.state !== 'DRAFT')) {
      const auditLog: ScoreAuditLogRecord = {
        id: `audit-${Date.now()}`,
        scoreId: scoreRecord.id,
        assignmentId: validated.assignmentId,
        enrollmentId: validated.enrollmentId,
        oldValue: oldScoreValue,
        newValue: validated.value,
        reason: validated.reason || 'อัปเดตคะแนนผ่านระบบด่วน',
        changedBy: validated.changedBy || 'ครูผู้สอน',
        timestamp: now,
      };
      const logs = getLocalAuditLogs();
      logs.unshift(auditLog);
      saveLocalAuditLogs(logs);

      if (isSupabaseConfigured) {
        logDbOperation('INSERT INTO ScoreAuditLog', auditLog);
        await supabase.from('ScoreAuditLog').insert({
          id: auditLog.id,
          scoreId: auditLog.scoreId,
          assignmentId: auditLog.assignmentId,
          enrollmentId: auditLog.enrollmentId,
          oldValue: auditLog.oldValue,
          newValue: auditLog.newValue,
          reason: auditLog.reason,
          changedBy: auditLog.changedBy,
        });
      }
    }

    if (isSupabaseConfigured) {
      logDbOperation('UPSERT Score', scoreRecord);
      await supabase.from('Score').upsert({
        id: scoreRecord.id,
        assignmentId: scoreRecord.assignmentId,
        enrollmentId: scoreRecord.enrollmentId,
        classroomId: scoreRecord.classroomId,
        value: scoreRecord.score,
        maxScore: scoreRecord.maxScore,
        isExempt: scoreRecord.isExempt,
        state: scoreRecord.state,
        updatedAt: scoreRecord.updatedAt,
      });
    }

    return scoreRecord;
  },

  // BATCH UPDATE: Fast grade multiple students
  async batchUpsertScores(
    assignmentId: string,
    classroomId: string,
    maxScore: number,
    updates: Array<{ enrollmentId: string; value: number | null; reason?: string; isExempt?: boolean }>
  ): Promise<ScoreRecord[]> {
    const results: ScoreRecord[] = [];
    for (const item of updates) {
      const saved = await this.upsertScore({
        assignmentId,
        enrollmentId: item.enrollmentId,
        classroomId,
        value: item.value,
        maxScore,
        isExempt: item.isExempt ?? false,
        state: 'DRAFT',
        reason: item.reason,
        changedBy: 'ครูภาสภูมิ เรืองปราชญ์',
      });
      results.push(saved);
    }
    return results;
  },

  // LOCK: Lock all scores for an assignment before exporting to SGS
  async lockScores(assignmentId: string): Promise<void> {
    const scores = getLocalScores();
    const updated = scores.map((s) => {
      if (s.assignmentId === assignmentId) {
        return { ...s, state: 'LOCKED' as const, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveLocalScores(updated);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Score SET state = 'LOCKED' WHERE assignmentId = ${assignmentId}`);
      await supabase.from('Score').update({ state: 'LOCKED' }).eq('assignmentId', assignmentId);
    }
  },

  // AUTO-ZERO: Fill 0 for students who didn't submit
  async autoZeroMissing(assignmentId: string, classroomId: string, studentIds: string[]): Promise<number> {
    const scores = await this.getByAssignment(assignmentId);
    let affected = 0;

    for (const sid of studentIds) {
      const existing = scores.find((s) => s.enrollmentId === sid);
      if (!existing || existing.score === null) {
        await this.upsertScore({
          assignmentId,
          enrollmentId: sid,
          classroomId,
          value: 0,
          maxScore: 10,
          isExempt: false,
          state: 'SUBMITTED',
          reason: 'ตัดเกรดอัตโนมัติ: ไม่ส่งงานภายในกำหนด (เติม 0 คะแนน)',
          changedBy: 'ระบบอัตโนมัติ (ปิดงาน)',
        });
        affected++;
      }
    }
    return affected;
  },
};
