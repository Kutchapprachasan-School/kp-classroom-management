// src/services/activityAuditLogService.ts
// Unified Audit & Activity Logging Engine with Aggregated Digest Reporting

import { phoneNotificationService } from './phoneNotificationService.ts';

export type AuditActionType =
  | 'DELETE'
  | 'UPDATE'
  | 'CREATE'
  | 'RESTORE'
  | 'BATCH_UPDATE'
  | 'BATCH_DELETE'
  | 'BATCH_IMPORT';

export type AuditEntityType =
  | 'ชั้นเรียน'
  | 'นักเรียน'
  | 'หลักสูตร/วิชา'
  | 'คะแนน/การบ้าน'
  | 'การเข้าเรียน'
  | 'ระบบ SMS';

export interface AuditChangeItem {
  field: string;
  label?: string;
  from?: any;
  to?: any;
  studentName?: string;
  studentCode?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  formattedDate: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  title: string;
  summary: string; // รายงานผลสรุปของการกระทำ (Aggregated Digest)
  itemCount: number;
  actor: string;
  targetId?: string;
  targetScope?: string;
  changes?: AuditChangeItem[];
  metadata?: Record<string, any>;
}

const STORAGE_KEY_AUDIT_LOGS = 'cls_activity_audit_logs_v1';
export const AUDIT_LOG_SYNC_EVENT = 'kps-audit-log-updated';
const MAX_LOG_ENTRIES = 200;

class ActivityAuditLogService {
  private getLocalLogs(): AuditLogEntry[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveLocalLogs(logs: AuditLogEntry[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const pruned = logs.slice(0, MAX_LOG_ENTRIES);
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(pruned));
      window.dispatchEvent(new CustomEvent(AUDIT_LOG_SYNC_EVENT, { detail: { logs: pruned } }));
    } catch {
      // ignore
    }
  }

  getLogs(filter?: {
    entityType?: AuditEntityType | 'ALL';
    actionType?: AuditActionType | 'ALL';
    query?: string;
  }): AuditLogEntry[] {
    let logs = this.getLocalLogs();

    if (filter) {
      if (filter.entityType && filter.entityType !== 'ALL') {
        logs = logs.filter((l) => l.entityType === filter.entityType);
      }
      if (filter.actionType && filter.actionType !== 'ALL') {
        logs = logs.filter((l) => l.actionType === filter.actionType);
      }
      if (filter.query && filter.query.trim()) {
        const q = filter.query.toLowerCase().trim();
        logs = logs.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.summary.toLowerCase().includes(q) ||
            l.actor.toLowerCase().includes(q) ||
            (l.targetScope && l.targetScope.toLowerCase().includes(q))
        );
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * บันทึก Log การกระทำ (รองรับทั้งการกระทำเดี่ยว และการรวมกลุ่ม Batch เป็น 1 Log เดียว)
   */
  async recordLog(entry: {
    actionType: AuditActionType;
    entityType: AuditEntityType;
    title: string;
    summary: string;
    itemCount?: number;
    actor?: string;
    targetId?: string;
    targetScope?: string;
    changes?: AuditChangeItem[];
    metadata?: Record<string, any>;
    notifyPhone?: boolean;
  }): Promise<AuditLogEntry> {
    const now = new Date();
    const formattedDate = now.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formattedDate,
      actionType: entry.actionType,
      entityType: entry.entityType,
      title: entry.title,
      summary: entry.summary,
      itemCount: entry.itemCount || 1,
      actor: entry.actor || 'ครูผู้สอน',
      targetId: entry.targetId,
      targetScope: entry.targetScope,
      changes: entry.changes,
      metadata: entry.metadata,
    };

    const current = this.getLocalLogs();
    const updated = [newLog, ...current];
    this.saveLocalLogs(updated);

    // ส่งการแจ้งเตือนเข้าเครื่องโทรศัพท์หากผู้ใช้เปิดใช้งานไว้
    if (entry.notifyPhone || entry.actionType === 'BATCH_UPDATE' || entry.actionType === 'DELETE' || entry.actionType === 'BATCH_DELETE') {
      try {
        phoneNotificationService.sendNativeNotification({
          title: `🔔 [${entry.entityType}] ${entry.title}`,
          body: entry.summary,
          tag: `audit-${entry.actionType.toLowerCase()}`,
        }).catch(() => {});
      } catch {
        // safe
      }
    }

    return newLog;
  }

  /**
   * บันทึก Log การลบ (Delete / Batch Delete)
   */
  async logDelete(
    entityType: AuditEntityType,
    title: string,
    summary: string,
    itemCount = 1,
    actor = 'ครูผู้สอน',
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.recordLog({
      actionType: itemCount > 1 ? 'BATCH_DELETE' : 'DELETE',
      entityType,
      title,
      summary,
      itemCount,
      actor,
      metadata,
      notifyPhone: true,
    });
  }

  /**
   * บันทึก Log การแก้ไข (Update / Batch Update) แบบรวมศูนย์และรายงานผลสรุป
   */
  async logUpdate(
    entityType: AuditEntityType,
    title: string,
    summary: string,
    itemCount = 1,
    changes?: AuditChangeItem[],
    actor = 'ครูผู้สอน',
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    return this.recordLog({
      actionType: itemCount > 1 ? 'BATCH_UPDATE' : 'UPDATE',
      entityType,
      title,
      summary,
      itemCount,
      actor,
      changes,
      metadata,
    });
  }

  /**
   * ล้างประวัติ Log ทั้งหมด
   */
  clearLogs(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
      window.dispatchEvent(new CustomEvent(AUDIT_LOG_SYNC_EVENT, { detail: { logs: [] } }));
    }
  }
}

export const activityAuditLogService = new ActivityAuditLogService();
