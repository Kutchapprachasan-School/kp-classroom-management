// src/hooks/useOptimisticRewards.ts
// Hook จัดการการแจกรางวัล (เหรียญ/ตั๋วกาชา) แบบ Optimistic UI พร้อม Offline Retry Queue และ Smart Offline Undo
// รองรับการซิงค์ข้อมูล FIFO อัตโนมัติเมื่อ Wi-Fi กลับมา และผสานเข้ากับกระเป๋ากาชาจริงของนักเรียนใน gachaService

import { useState, useEffect, useRef, useCallback } from 'react';

export type SyncStatus = 'syncing' | 'synced' | 'queued' | 'error';

export interface RewardBatch {
  id: string;
  classroomId: string;
  teacherId?: string;
  rewardType: 'coin' | 'ticket';
  amount: number;
  description: string;
  targetStudentIds: string[];
  isRevoked: boolean;
  createdAt: string;
  revokedAt?: string | null;
  syncStatus: SyncStatus;
}

export interface OfflineQueueItem {
  queueId: string;
  action: 'GIVE' | 'UNDO';
  clientTempId: string;
  batch: RewardBatch;
  enqueuedAt: string;
}

const OFFLINE_QUEUE_STORAGE_KEY = 'live_classroom_reward_queue_v1';
const getSessionLedgerKey = (classId: string) => `kp_live_class_session_${classId}`;

// เชื่อมต่อกระเป๋ากาชาจริงใน localStorage และส่ง CustomEvent ให้ระบบทราบทันที
export function applyDirectGachaStateUpdate(
  studentIds: string[],
  type: 'coin' | 'ticket',
  delta: number
): void {
  if (typeof window === 'undefined') return;
  studentIds.forEach((studentId) => {
    const key = `kp_gacha_state:${studentId}`;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : { coins: 0, tickets: 0 };
      if (type === 'coin') {
        parsed.coins = Math.max(0, Number(parsed.coins || 0) + delta);
      } else {
        parsed.tickets = Math.max(0, Number(parsed.tickets || 0) + delta);
      }
      parsed.updatedAt = new Date().toISOString();
      window.localStorage.setItem(key, JSON.stringify(parsed));
      window.dispatchEvent(
        new CustomEvent('kp-gacha-state-updated', {
          detail: { studentId, type, delta, state: parsed },
        })
      );
    } catch {
      // Ignore storage errors in restricted contexts
    }
  });
}

function readOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage write errors
  }
}

export function useOptimisticRewards(props: {
  classroomId: string;
  onUpdateBalances: (studentIds: string[], type: 'coin' | 'ticket', delta: number) => void;
  onPlaySound?: (type: 'coin' | 'buzzer') => void;
  syncGiveToServer?: (batch: RewardBatch, clientTempId: string) => Promise<{ id?: string }>;
  syncUndoToServer?: (batchId: string) => Promise<void>;
}) {
  const {
    classroomId,
    onUpdateBalances,
    onPlaySound,
    syncGiveToServer,
    syncUndoToServer,
  } = props;

  const [ledger, setLedger] = useState<RewardBatch[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    variant?: 'success' | 'warning' | 'error';
  } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() =>
    readOfflineQueue().length
  );
  const [isFlushingQueue, setIsFlushingQueue] = useState<boolean>(false);

  const isFlushingRef = useRef<boolean>(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: 'success' | 'warning' | 'error' = 'success') => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => setToast(null), 3200);
    },
    []
  );

  // เมื่อห้องเรียนเปลี่ยน โหลดประวัติรางวัลเฉพาะของห้องเรียนนั้นจาก sessionStorage ทันที
  useEffect(() => {
    if (typeof window === 'undefined' || !classroomId) return;
    try {
      const stored = window.sessionStorage.getItem(getSessionLedgerKey(classroomId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLedger(parsed);
          return;
        }
      }
    } catch {
      // Ignore
    }
    setLedger([]);
  }, [classroomId]);

  // บันทึก Session Ledger ลง sessionStorage เพื่อกู้คืนกรณี Refresh หน้าจอ (พร้อม Consistency Guard ป้องกัน Data Bleeding ข้ามห้อง)
  useEffect(() => {
    if (typeof window === 'undefined' || !classroomId) return;
    const isConsistent = ledger.length === 0 || ledger.every((b) => b.classroomId === classroomId);
    if (!isConsistent) return;

    try {
      window.sessionStorage.setItem(getSessionLedgerKey(classroomId), JSON.stringify(ledger));
    } catch {
      // Ignore
    }
  }, [classroomId, ledger]);

  const setInitialLedger = useCallback(
    (serverLedger: RewardBatch[]) => {
      const queue = readOfflineQueue().filter((q) => q.batch.classroomId === classroomId);
      setPendingQueueCount(readOfflineQueue().length);

      const mergedMap = new Map<string, RewardBatch>();
      serverLedger.forEach((item) => mergedMap.set(item.id, item));

      // ผสานรายการที่ค้างอยู่ในคิวออฟไลน์กลับเข้าหน้าจอ (Refresh Resilience)
      queue.forEach((qItem) => {
        if (qItem.action === 'GIVE') {
          mergedMap.set(qItem.batch.id, { ...qItem.batch, syncStatus: 'queued' });
        } else if (qItem.action === 'UNDO') {
          const existing = mergedMap.get(qItem.batch.id);
          if (existing) {
            mergedMap.set(qItem.batch.id, {
              ...existing,
              isRevoked: true,
              revokedAt: qItem.enqueuedAt,
              syncStatus: 'queued',
            });
          }
        }
      });

      const sorted = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLedger(sorted);
    },
    [classroomId]
  );

  const flushOfflineQueue = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const currentQueue = readOfflineQueue();
    if (currentQueue.length === 0) {
      setPendingQueueCount(0);
      return;
    }

    isFlushingRef.current = true;
    setIsFlushingQueue(true);

    const remainingQueue = [...currentQueue];

    while (remainingQueue.length > 0) {
      const item = remainingQueue[0];
      try {
        if (item.action === 'GIVE') {
          if (syncGiveToServer) {
            await syncGiveToServer(item.batch, item.clientTempId);
          }
          setLedger((prev) =>
            prev.map((b) => (b.id === item.batch.id ? { ...b, syncStatus: 'synced' } : b))
          );
        } else if (item.action === 'UNDO') {
          if (syncUndoToServer) {
            await syncUndoToServer(item.batch.id);
          }
          setLedger((prev) =>
            prev.map((b) =>
              b.id === item.batch.id ? { ...b, isRevoked: true, syncStatus: 'synced' } : b
            )
          );
        }
        remainingQueue.shift();
        writeOfflineQueue(remainingQueue);
        setPendingQueueCount(remainingQueue.length);
      } catch {
        // หยุดพักหากเครือข่ายยังไม่พร้อม
        break;
      }
    }

    isFlushingRef.current = false;
    setIsFlushingQueue(false);
  }, [syncGiveToServer, syncUndoToServer]);

  // ตรวจจับสถานะเครือข่ายและตั้งเวลา Auto FIFO Flush ทุก 12 วินาที
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        flushOfflineQueue();
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [flushOfflineQueue]);

  const giveReward = useCallback(
    async (
      studentIds: string[],
      type: 'coin' | 'ticket',
      amount: number,
      desc: string
    ): Promise<void> => {
      if (!studentIds.length || amount <= 0) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const newBatch: RewardBatch = {
        id: tempId,
        classroomId,
        rewardType: type,
        amount,
        description: desc,
        targetStudentIds: studentIds,
        isRevoked: false,
        createdAt: new Date().toISOString(),
        syncStatus: currentlyOnline ? 'syncing' : 'queued',
      };

      // 1. Optimistic UI + เสียงเอฟเฟกต์ + อัปเดตกระเป๋ากาชาจริงทันที
      onUpdateBalances(studentIds, type, amount);
      applyDirectGachaStateUpdate(studentIds, type, amount);
      onPlaySound?.('coin');
      setLedger((prev) => [newBatch, ...prev]);

      const unitLabel = type === 'coin' ? '🪙 เหรียญ' : '🎟️ ตั๋วสุ่ม';
      showToast(
        `แจก +${amount} ${unitLabel} (${desc}) สำเร็จ${!currentlyOnline ? ' [บันทึกในคิวออฟไลน์]' : ''}`,
        currentlyOnline ? 'success' : 'warning'
      );

      // 2. ถ้าออฟไลน์อยู่ ให้ต่อท้ายคิวใน localStorage ทันทีโดยไม่ Rollback
      if (!currentlyOnline) {
        const queue = readOfflineQueue();
        queue.push({
          queueId: `q-${Date.now()}`,
          action: 'GIVE',
          clientTempId: tempId,
          batch: newBatch,
          enqueuedAt: new Date().toISOString(),
        });
        writeOfflineQueue(queue);
        setPendingQueueCount(queue.length);
        return;
      }

      // 3. ออนไลน์: ส่งซิงค์
      try {
        if (syncGiveToServer) {
          const res = await syncGiveToServer(newBatch, tempId);
          setLedger((prev) =>
            prev.map((b) =>
              b.id === tempId ? { ...b, id: res?.id || tempId, syncStatus: 'synced' } : b
            )
          );
        } else {
          setLedger((prev) =>
            prev.map((b) => (b.id === tempId ? { ...b, syncStatus: 'synced' } : b))
          );
        }
      } catch {
        // หากส่งไม่สำเร็จ ให้เปลี่ยนเป็น queued แทนการดึงคะแนนกลับ
        const fallbackBatch: RewardBatch = { ...newBatch, syncStatus: 'queued' };
        setLedger((prev) => prev.map((b) => (b.id === tempId ? fallbackBatch : b)));
        const queue = readOfflineQueue();
        queue.push({
          queueId: `q-${Date.now()}`,
          action: 'GIVE',
          clientTempId: tempId,
          batch: fallbackBatch,
          enqueuedAt: new Date().toISOString(),
        });
        writeOfflineQueue(queue);
        setPendingQueueCount(queue.length);
        showToast('สัญญาณเน็ตขัดข้อง บันทึกรายการไว้ในคิวออฟไลน์แล้ว', 'warning');
      }
    },
    [classroomId, onUpdateBalances, onPlaySound, showToast, syncGiveToServer]
  );

  const undoReward = useCallback(
    async (batch: RewardBatch): Promise<void> => {
      if (batch.isRevoked || batch.syncStatus === 'syncing') return;

      const revokedAt = new Date().toISOString();

      // หักแต้มคืนแบบ Optimistic ทันที
      onUpdateBalances(batch.targetStudentIds, batch.rewardType, -batch.amount);
      applyDirectGachaStateUpdate(batch.targetStudentIds, batch.rewardType, -batch.amount);

      const queue = readOfflineQueue();
      const queuedGiveIndex = queue.findIndex(
        (q) => q.action === 'GIVE' && q.batch.id === batch.id
      );

      // Smart Offline Undo: รายการยังอยู่ในคิวเครื่อง ตัดออกจากคิวทันทีโดยไม่ต้องส่งไป Server
      if (queuedGiveIndex !== -1) {
        queue.splice(queuedGiveIndex, 1);
        writeOfflineQueue(queue);
        setPendingQueueCount(queue.length);
        setLedger((prev) =>
          prev.map((b) =>
            b.id === batch.id
              ? { ...b, isRevoked: true, revokedAt, syncStatus: 'synced' }
              : b
          )
        );
        showToast(`ยกเลิกรายการ "${batch.description}" จากคิวเครื่องเรียบร้อย`, 'warning');
        return;
      }

      const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!currentlyOnline) {
        // รายการซิงค์ขึ้น Server ไปแล้ว แต่กด Undo ตอนเน็ตหลุด -> เก็บเข้าคิว UNDO
        queue.push({
          queueId: `q-undo-${Date.now()}`,
          action: 'UNDO',
          clientTempId: batch.id,
          batch: { ...batch, isRevoked: true, revokedAt },
          enqueuedAt: revokedAt,
        });
        writeOfflineQueue(queue);
        setPendingQueueCount(queue.length);
        setLedger((prev) =>
          prev.map((b) =>
            b.id === batch.id
              ? { ...b, isRevoked: true, revokedAt, syncStatus: 'queued' }
              : b
          )
        );
        showToast(`ยกเลิกรายการ "${batch.description}" (รอซิงค์เมื่อออนไลน์)`, 'warning');
        return;
      }

      setLedger((prev) =>
        prev.map((b) =>
          b.id === batch.id
            ? { ...b, isRevoked: true, revokedAt, syncStatus: 'syncing' }
            : b
        )
      );

      try {
        if (syncUndoToServer) {
          await syncUndoToServer(batch.id);
        }
        setLedger((prev) =>
          prev.map((b) =>
            b.id === batch.id ? { ...b, isRevoked: true, syncStatus: 'synced' } : b
          )
        );
        showToast(`ยกเลิกรายการ "${batch.description}" สำเร็จ`, 'warning');
      } catch {
        // Rollback เมื่อเซิร์ฟเวอร์ปฏิเสธการยกเลิก
        onUpdateBalances(batch.targetStudentIds, batch.rewardType, batch.amount);
        applyDirectGachaStateUpdate(batch.targetStudentIds, batch.rewardType, batch.amount);
        onPlaySound?.('buzzer');
        setLedger((prev) =>
          prev.map((b) =>
            b.id === batch.id
              ? { ...b, isRevoked: false, revokedAt: null, syncStatus: 'error' }
              : b
          )
        );
        showToast('ไม่สามารถยกเลิกรายการได้ ระบบได้คืนค่าเดิมแล้ว', 'error');
      }
    },
    [onUpdateBalances, onPlaySound, showToast, syncUndoToServer]
  );

  const consumeTicket = useCallback(
    (studentId: string): void => {
      onUpdateBalances([studentId], 'ticket', -1);
      applyDirectGachaStateUpdate([studentId], 'ticket', -1);
    },
    [onUpdateBalances]
  );

  return {
    ledger,
    setInitialLedger,
    toast,
    isOnline,
    pendingQueueCount,
    isFlushingQueue,
    flushOfflineQueue,
    giveReward,
    undoReward,
    consumeTicket,
    showToast,
  };
}
