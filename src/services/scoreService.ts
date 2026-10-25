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

const getLocalScores = (): ScoreRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_SCORES);
  if (raw) {
    try {
      const parsed: ScoreRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip legacy mock score fixtures
        const legacyMockIds = new Set(['sc-1', 'sc-2', 'sc-3', 'sc-4', 'sc-5', 'sc-6', 'sc-7', 'sc-8']);
        return parsed.filter((s) => !legacyMockIds.has(s.id));
      }
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalScores = (items: ScoreRecord[]) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(items));
  }
};

const getLocalAuditLogs = (): ScoreAuditLogRecord[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
  if (raw) {
    try {
      const parsed: ScoreAuditLogRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((l) => l.id !== 'audit-init-1');
      }
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalAuditLogs = (items: ScoreAuditLogRecord[]) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(items));
  }
};

export const scoreService = {
  // READ: Get all scores for a classroom (or all scores)
  getScores(classroomId?: string): ScoreRecord[] {
    const all = getLocalScores();
    if (classroomId) {
      return all.filter((s) => s.classroomId === classroomId);
    }
    return all;
  },

  // READ: Get all scores
  async getAll(): Promise<ScoreRecord[]> {
    return getLocalScores();
  },

  // READ: Get all scores for an assignment
  async getByAssignment(assignmentId: string): Promise<ScoreRecord[]> {
    if (isSupabaseConfigured) {
      try {
        logDbOperation(`SELECT selective FROM Score WHERE assignmentId = ${assignmentId}`);
        const { data, error } = await supabase
          .from('Score')
          .select('id, assignmentId, enrollmentId, classroomId, value, maxScore, isExempt, state, updatedAt')
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
      } catch (err) {
        console.warn('[scoreService] Remote query fallback:', err);
      }
    }
    const all = getLocalScores();
    return all.filter((s) => s.assignmentId === assignmentId);
  },

  // READ: Get all scores for a student
  async getByStudent(enrollmentId: string): Promise<ScoreRecord[]> {
    if (isSupabaseConfigured) {
      try {
        logDbOperation(`SELECT selective FROM Score WHERE enrollmentId = ${enrollmentId}`);
        const { data, error } = await supabase
          .from('Score')
          .select('id, assignmentId, enrollmentId, classroomId, value, maxScore, isExempt, state, updatedAt')
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
      } catch (err) {
        console.warn('[scoreService] Remote query fallback:', err);
      }
    }
    const all = getLocalScores();
    return all.filter((s) => s.enrollmentId === enrollmentId);
  },

  // READ: Get audit logs (optionally filtered by assignment or student)
  async getAuditLogs(assignmentId?: string, enrollmentId?: string): Promise<ScoreAuditLogRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('ScoreAuditLog')
          .select('id, scoreId, assignmentId, enrollmentId, oldValue, newValue, reason, changedBy, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
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
      } catch (err) {
        console.warn('[scoreService] Remote audit log fallback:', err);
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
  async upsertScore(input: ScoreUpdateInput | any): Promise<ScoreRecord> {
    const rawValue = input.value !== undefined ? input.value : input.score;
    const normalizedInput = {
      ...input,
      value: rawValue,
      state: input.state || 'SUBMITTED',
    };
    const validated = ScoreUpdateSchema.parse(normalizedInput);
    const allScores = getLocalScores();
    const targetScoreId = input.scoreId || input.id;
    const existingIndex = allScores.findIndex(
      (s) =>
        (targetScoreId && s.id === targetScoreId) ||
        (s.assignmentId === validated.assignmentId && s.enrollmentId === validated.enrollmentId)
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
        id: targetScoreId || currentRecord.id,
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
        id: targetScoreId || `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
        try {
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
        } catch (err) {
          console.warn('[scoreService] Remote audit log insert fallback:', err);
        }
      }
    }

    if (isSupabaseConfigured) {
      try {
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
      } catch (err) {
        console.warn('[scoreService] Remote score upsert fallback:', err);
      }
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
      try {
        logDbOperation(`UPDATE Score SET state = 'LOCKED' WHERE assignmentId = ${assignmentId}`);
        await supabase.from('Score').update({ state: 'LOCKED' }).eq('assignmentId', assignmentId);
      } catch (err) {
        console.warn('[scoreService] Remote lock fallback:', err);
      }
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
