// src/components/promotion/PromotionRollbackModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  studentPromotionService,
  type PromotionBatchHistoryItem,
} from '../../services/studentPromotionService';
import {
  RotateCcw,
  History,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';

export interface PromotionRollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onRollbackSuccess: (batchId: string) => void;
}

export const PromotionRollbackModal: React.FC<PromotionRollbackModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onRollbackSuccess,
}) => {
  const [batches, setBatches] = useState<PromotionBatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingBatchId, setProcessingBatchId] = useState<string | null>(null);

  // เก็บสถานะกรณีตรวจพบคะแนนใหม่ในเทอมปลายทาง (Conflict Guard)
  const [conflictAlert, setConflictAlert] = useState<{
    batchId: string;
    scoreCount: number;
    message: string;
  } | null>(null);

  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await studentPromotionService.getPromotionBatchHistory();
      setBatches(list);
    } catch (err: any) {
      setStatusBanner(err?.message || 'ไม่สามารถดึงประวัติการเลื่อนชั้นได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConflictAlert(null);
      setStatusBanner(null);
      void loadHistory();
    }
  }, [isOpen, loadHistory]);

  if (!isOpen) return null;

  const handleTriggerRollback = async (batchId: string, forceOverride = false) => {
    setProcessingBatchId(batchId);
    setStatusBanner(null);

    try {
      const res = await studentPromotionService.rollbackPromotionBatch({
        batchId,
        executedBy: currentUserId,
        forceOverride,
      });

      if (res.conflict_detected) {
        setConflictAlert({
          batchId,
          scoreCount: res.conflict_score_count ?? 0,
          message:
            res.message ||
            'ตรวจพบการกรอกคะแนนในภาคเรียนใหม่แล้ว ระบบจึงระงับการย้อนกลับอัตโนมัติเพื่อป้องกันข้อมูลสูญหาย',
        });
        return;
      }

      if (res.success) {
        setConflictAlert(null);
        setStatusBanner(`ย้อนกลับรอบการเลื่อนชั้น ${batchId} สำเร็จ (คืนค่า ${res.restored_count ?? 0} รายการ)`);
        await loadHistory();
        onRollbackSuccess(batchId);
      }
    } catch (err: any) {
      setStatusBanner(err?.message || 'เกิดข้อผิดพลาดในการย้อนกลับข้อมูล');
    } finally {
      setProcessingBatchId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-[#E6EEF7] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header โทน Pastel Anime */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 px-6 py-4 flex items-center justify-between border-b border-[#E6EEF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#163A66]">
                ประวัติการเลื่อนชั้น & ระบบย้อนกลับ (Rollback Manager)
              </h2>
              <p className="text-xs text-[#6B7C93]">
                ตรวจสอบสถานะคะแนนในภาคเรียนใหม่ก่อนย้อนกลับอัตโนมัติ (Conflict Guard)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 hover:bg-white p-2 text-[#6B7C93] hover:text-[#163A66] shadow-sm transition-colors border border-slate-100"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {statusBanner && (
            <div className="rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 text-sm text-blue-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{statusBanner}</span>
            </div>
          )}

          {/* กล่องเตือนเมื่อ Conflict Guard ตรวจพบคะแนนใหม่ */}
          {conflictAlert && (
            <div className="rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] p-4 space-y-3 animate-in slide-in-from-top-2">
              <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>ระบบป้องกันข้อมูลทับซ้อนทำงาน (พบคะแนนใหม่ {conflictAlert.scoreCount} ช่อง)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">{conflictAlert.message}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setConflictAlert(null)}
                  className="rounded-xl bg-white border border-amber-300 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50/50 shadow-sm transition-colors"
                >
                  ยกเลิกการย้อนกลับ (แนะนำ)
                </button>
                <button
                  disabled={processingBatchId === conflictAlert.batchId}
                  onClick={() => void handleTriggerRollback(conflictAlert.batchId, true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {processingBatchId === conflictAlert.batchId
                    ? 'กำลังบันทึกบังคับย้อนกลับ...'
                    : 'ยืนยันบังคับย้อนกลับ (Force Override)'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-sm text-[#6B7C93] flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span>กำลังโหลดประวัติการเลื่อนชั้น...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#94A3B8] flex flex-col items-center gap-2">
              <History className="w-10 h-10 text-slate-300" />
              <span>ยังไม่มีประวัติการรันเลื่อนชั้นในระบบ</span>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const isRolledBack = batch.status === 'ROLLED_BACK';
                const summary = batch.summary_json || {};

                return (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-[#E6EEF7] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-200 hover:bg-purple-50/10 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#163A66] text-sm">
                          ปีการศึกษา {batch.from_academic_year}/{batch.from_semester} ➔{' '}
                          {batch.to_academic_year}/{batch.to_semester}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isRolledBack
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isRolledBack ? 'ย้อนกลับแล้ว (ROLLED_BACK)' : 'ใช้งานอยู่ (COMPLETED)'}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7C93] flex flex-wrap items-center gap-x-2">
                        <span>รหัสรอบ: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{batch.id}</code></span>
                        <span>•</span>
                        <span>เลื่อนชั้น {summary.promoted_count ?? 0} คน</span>
                        <span>|</span>
                        <span>ซ้ำชั้น {summary.repeated_count ?? 0} คน</span>
                        <span>|</span>
                        <span>จบการศึกษา {summary.graduated_count ?? 0} คน</span>
                      </div>
                    </div>

                    <div>
                      {!isRolledBack && (
                        <button
                          disabled={processingBatchId === batch.id}
                          onClick={() => void handleTriggerRollback(batch.id, false)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{processingBatchId === batch.id ? 'กำลังตรวจสอบ...' : '1-Click Rollback'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
