// src/services/gachaAdminService.ts
// บริการสำหรับผู้ดูแลระบบ (Admin) ในการจัดการระบบกาชา:
// - การรีเซ็ตข้อมูลกาชารายคน, รายห้อง, หรือทั้งโรงเรียน
// - การสร้างจุดบันทึกย้อนกลับ (Snapshot) และการ Rollback คืนค่า
// - การแจกตั๋วสุ่ม, เศษดาว (Star Shards), หรือปลดล็อกคู่หูเป็นรายบุคคลหรือยกห้อง
// - ปฏิบัติตาม Zero Mock Data (ไม่แต่งข้อมูลหลอก) และ Zero-Egress (บันทึกลง kp_gacha_snapshots ซิงค์ผ่าน cloudDataService)

import {
  gachaService,
  type GachaState,
  ALL_BUDDIES,
} from './gachaService';

export interface GachaSnapshot {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  targetType: 'single' | 'classroom' | 'all';
  targetId?: string;
  studentStates: Record<string, GachaState>;
}

export interface GachaAdminAuditLog {
  id: string;
  timestamp: string;
  action: 'RESET_STUDENT' | 'RESET_CLASSROOM' | 'RESET_ALL' | 'ROLLBACK' | 'GRANT';
  targetType: 'single' | 'classroom' | 'all';
  targetId?: string;
  details: string;
  snapshotId?: string;
}

const SNAPSHOTS_STORAGE_KEY = 'kp_gacha_snapshots';
const AUDIT_LOGS_STORAGE_KEY = 'kp_gacha_admin_audit_logs';
const MAX_SNAPSHOTS = 15;
const MAX_AUDIT_LOGS = 50;

const nowIso = () => new Date().toISOString();

const loadSnapshotsFromStorage = (): GachaSnapshot[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSnapshotsToStorage = (snapshots: GachaSnapshot[]): void => {
  if (typeof localStorage === 'undefined') return;
  const pruned = snapshots.slice(0, MAX_SNAPSHOTS);
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(pruned));
};

const loadAuditLogsFromStorage = (): GachaAdminAuditLog[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const recordAuditLog = (log: Omit<GachaAdminAuditLog, 'id' | 'timestamp'>): void => {
  if (typeof localStorage === 'undefined') return;
  const current = loadAuditLogsFromStorage();
  const entry: GachaAdminAuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso(),
  };
  const updated = [entry, ...current].slice(0, MAX_AUDIT_LOGS);
  localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
};

export const gachaAdminService = {
  // ===================== Snapshots & Rollback =====================

  listSnapshots(): GachaSnapshot[] {
    return loadSnapshotsFromStorage();
  },

  getSnapshot(snapshotId: string): GachaSnapshot | null {
    const all = loadSnapshotsFromStorage();
    return all.find((s) => s.id === snapshotId) || null;
  },

  createSnapshot(
    name: string,
    description: string,
    targetType: 'single' | 'classroom' | 'all',
    studentIds: string[],
    targetId?: string
  ): GachaSnapshot {
    const statesMap: Record<string, GachaState> = {};
    for (const sid of studentIds) {
      if (gachaService.hasStoredState(sid)) {
        statesMap[sid] = gachaService.getState(sid);
      }
    }

    const snapshot: GachaSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name || `Snapshot ${new Date().toLocaleString('th-TH')}`,
      description: description || 'สำรองข้อมูลก่อนทำรายการผู้ดูแลระบบ',
      createdAt: nowIso(),
      targetType,
      targetId,
      studentStates: statesMap,
    };

    const current = loadSnapshotsFromStorage();
    saveSnapshotsToStorage([snapshot, ...current]);
    return snapshot;
  },

  rollbackSnapshot(snapshotId: string): { ok: boolean; restoredCount: number; error?: string } {
    const snap = this.getSnapshot(snapshotId);
    if (!snap) return { ok: false, restoredCount: 0, error: 'ไม่พบจุดย้อนกลับนี้' };

    let count = 0;
    for (const [sid, state] of Object.entries(snap.studentStates)) {
      if (state && sid) {
        gachaService.saveState(state);
        count++;
      }
    }

    recordAuditLog({
      action: 'ROLLBACK',
      targetType: snap.targetType,
      targetId: snap.targetId,
      details: `ย้อนกลับข้อมูลจาก Snapshot "${snap.name}" (${count} คน)`,
      snapshotId: snap.id,
    });

    return { ok: true, restoredCount: count };
  },

  deleteSnapshot(snapshotId: string): boolean {
    const all = loadSnapshotsFromStorage();
    const filtered = all.filter((s) => s.id !== snapshotId);
    if (filtered.length === all.length) return false;
    saveSnapshotsToStorage(filtered);
    return true;
  },

  // ===================== Granting Operations =====================

  grantTickets(
    studentId: string,
    amount: number,
    reason = 'แอดมินมอบตั๋วสุ่ม'
  ): { ok: boolean; newTotal: number } {
    const count = Math.floor(amount);
    if (count <= 0) return { ok: false, newTotal: 0 };
    const state = gachaService.getState(studentId);
    state.tickets = Math.max(0, state.tickets + count);
    gachaService.saveState(state);

    recordAuditLog({
      action: 'GRANT',
      targetType: 'single',
      targetId: studentId,
      details: `มอบตั๋วสุ่ม +${count} ใบ (${reason})`,
    });

    return { ok: true, newTotal: state.tickets };
  },

  grantShards(
    studentId: string,
    amount: number,
    reason = 'แอดมินมอบเศษดาว'
  ): { ok: boolean; newTotal: number } {
    const count = Math.floor(amount);
    if (count <= 0) return { ok: false, newTotal: 0 };
    const state = gachaService.getState(studentId);
    state.starShards = Math.max(0, state.starShards + count);
    gachaService.saveState(state);

    recordAuditLog({
      action: 'GRANT',
      targetType: 'single',
      targetId: studentId,
      details: `มอบเศษดาว +${count} ชิ้น (${reason})`,
    });

    return { ok: true, newTotal: state.starShards };
  },

  grantBuddy(
    studentId: string,
    buddyId: string,
    reason = 'แอดมินมอบคู่หูพิเศษ'
  ): { ok: boolean; alreadyOwned?: boolean } {
    const buddy = ALL_BUDDIES.find((b) => b.id === buddyId);
    if (!buddy) return { ok: false };
    const state = gachaService.getState(studentId);

    if (state.unlockedBuddyIds.includes(buddyId)) {
      return { ok: true, alreadyOwned: true };
    }

    state.unlockedBuddyIds.push(buddyId);
    state.buddyStars[buddyId] = Math.max(1, state.buddyStars[buddyId] || 1);
    gachaService.saveState(state);

    recordAuditLog({
      action: 'GRANT',
      targetType: 'single',
      targetId: studentId,
      details: `มอบคู่หู ${buddy.name} (${reason})`,
    });

    return { ok: true, alreadyOwned: false };
  },

  grantClassroom(
    studentIds: string[],
    grant: { tickets?: number; shards?: number; buddyId?: string },
    reason = 'มอบรางวัลระดับห้องเรียน'
  ): { count: number; snapshotId?: string } {
    if (studentIds.length === 0) return { count: 0 };

    const snap = this.createSnapshot(
      `ก่อนแจกรางวัลระดับห้องเรียน (${studentIds.length} คน)`,
      reason,
      'classroom',
      studentIds
    );

    let count = 0;
    for (const sid of studentIds) {
      const state = gachaService.getState(sid);
      let changed = false;

      if (grant.tickets && grant.tickets > 0) {
        state.tickets += Math.floor(grant.tickets);
        changed = true;
      }
      if (grant.shards && grant.shards > 0) {
        state.starShards += Math.floor(grant.shards);
        changed = true;
      }
      if (grant.buddyId) {
        if (!state.unlockedBuddyIds.includes(grant.buddyId)) {
          state.unlockedBuddyIds.push(grant.buddyId);
          state.buddyStars[grant.buddyId] = 1;
          changed = true;
        }
      }

      if (changed) {
        gachaService.saveState(state);
        count++;
      }
    }

    recordAuditLog({
      action: 'GRANT',
      targetType: 'classroom',
      details: `แจกของรางวัลให้นักเรียน ${count} คน (${reason})`,
      snapshotId: snap.id,
    });

    return { count, snapshotId: snap.id };
  },

  // ===================== Reset Operations =====================

  resetStudent(
    studentId: string,
    reason = 'รีเซ็ตข้อมูลกาชารายบุคคล',
    options: { autoSnapshot?: boolean } = { autoSnapshot: true }
  ): { ok: boolean; snapshotId?: string } {
    let snapshotId: string | undefined;
    if (options.autoSnapshot) {
      const snap = this.createSnapshot(
        `ก่อนรีเซ็ตนักเรียน ${studentId}`,
        reason,
        'single',
        [studentId],
        studentId
      );
      snapshotId = snap.id;
    }

    gachaService.removeState(studentId);

    recordAuditLog({
      action: 'RESET_STUDENT',
      targetType: 'single',
      targetId: studentId,
      details: `รีเซ็ตข้อมูลกาชาของนักเรียน ${studentId} (${reason})`,
      snapshotId,
    });

    return { ok: true, snapshotId };
  },

  resetClassroom(
    studentIds: string[],
    classroomName = 'ห้องเรียน',
    reason = 'รีเซ็ตข้อมูลกาชาระดับห้อง',
    options: { autoSnapshot?: boolean } = { autoSnapshot: true }
  ): { ok: boolean; count: number; snapshotId?: string } {
    if (studentIds.length === 0) return { ok: true, count: 0 };

    let snapshotId: string | undefined;
    if (options.autoSnapshot) {
      const snap = this.createSnapshot(
        `ก่อนรีเซ็ตห้อง ${classroomName} (${studentIds.length} คน)`,
        reason,
        'classroom',
        studentIds
      );
      snapshotId = snap.id;
    }

    let count = 0;
    for (const sid of studentIds) {
      gachaService.removeState(sid);
      count++;
    }

    recordAuditLog({
      action: 'RESET_CLASSROOM',
      targetType: 'classroom',
      details: `รีเซ็ตข้อมูลกาชาห้อง ${classroomName} (${count} คน - ${reason})`,
      snapshotId,
    });

    return { ok: true, count, snapshotId };
  },

  resetAll(
    reason = 'รีเซ็ตข้อมูลกาชานักเรียนทุกคนทั้งระบบ',
    options: { autoSnapshot?: boolean } = { autoSnapshot: true }
  ): { ok: boolean; count: number; snapshotId?: string } {
    const studentIds = gachaService.listStoredStudentIds();

    let snapshotId: string | undefined;
    if (options.autoSnapshot && studentIds.length > 0) {
      const snap = this.createSnapshot(
        `ก่อนรีเซ็ตนักเรียนทุกคนทั้งระบบ (${studentIds.length} คน)`,
        reason,
        'all',
        studentIds
      );
      snapshotId = snap.id;
    }

    let count = 0;
    for (const sid of studentIds) {
      gachaService.removeState(sid);
      count++;
    }

    recordAuditLog({
      action: 'RESET_ALL',
      targetType: 'all',
      details: `รีเซ็ตข้อมูลกาชานักเรียนทุกคน ${count} คน (${reason})`,
      snapshotId,
    });

    return { ok: true, count, snapshotId };
  },

  // ===================== Audit Logs =====================

  listAuditLogs(): GachaAdminAuditLog[] {
    return loadAuditLogsFromStorage();
  },
};
