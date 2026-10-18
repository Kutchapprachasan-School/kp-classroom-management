// src/components/promotion/StudentPurgeModal.tsx
import React, { useState } from 'react';
import {
  studentPurgeService,
  type PurgeStudentRpcResponse,
} from '../../services/studentPurgeService';
import {
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';

export interface StudentPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialStudentName?: string;
  onPurgeSuccess: (purgedStudentId: string) => void;
}

export const StudentPurgeModal: React.FC<StudentPurgeModalProps> = ({
  isOpen,
  onClose,
  initialStudentId = '',
  initialStudentName = '',
  onPurgeSuccess,
}) => {
  const [studentId, setStudentId] = useState<string>(initialStudentId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [guardResult, setGuardResult] = useState<PurgeStudentRpcResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecutePurge = async (forceOverride: boolean) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await studentPurgeService.purgeTestStudent(studentId.trim(), forceOverride);

      if (res.blocked_by_guard) {
        setGuardResult(res);
        return;
      }

      if (res.success && res.purged_student_id) {
        setGuardResult(null);
        onPurgeSuccess(res.purged_student_id);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการลบข้อมูลนักเรียน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-rose-100 overflow-hidden flex flex-col">
        {/* Header โทน Pastel Anime Rose */}
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 px-6 py-4 flex items-center justify-between border-b border-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#163A66]">
                เครื่องมือลบข้อมูลนักเรียนทดสอบ (Single-Student Purge Guard)
              </h2>
              <p className="text-xs text-[#6B7C93]">
                ตรวจสอบประวัติคะแนนจริงก่อนลบ เพื่อป้องกันการเผลอลบข้อมูลนักเรียนจริง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 hover:bg-white p-2 text-slate-600 shadow-sm transition-colors border border-slate-100"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#163A66] mb-1">
              รหัสนักเรียน (Student ID) ที่ต้องการล้างข้อมูลทดสอบ
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setGuardResult(null);
              }}
              placeholder="เช่น std-test-001"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono text-[#163A66] focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            {initialStudentName && (
              <p className="text-xs text-[#6B7C93] mt-1">ชื่อนักเรียน: {initialStudentName}</p>
            )}
          </div>

          {/* แจ้งเตือนเมื่อ Guard ตรวจพบคะแนนจริงหรือประวัติข้ามเทอม */}
          {guardResult?.blocked_by_guard && (
            <div className="rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] p-4 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ระบบป้องกันทำงาน: พบประวัติการศึกษาจริงของนักเรียนคนนี้!</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">{guardResult.message}</p>
              <ul className="text-xs text-amber-900 list-disc list-inside font-semibold space-y-0.5">
                <li>จำนวนช่องคะแนนที่มีการกรอกจริง: {guardResult.active_score_count ?? 0} ช่อง</li>
                <li>จำนวนภาคเรียนที่เรียนจบแล้ว: {guardResult.completed_term_count ?? 0} เทอม</li>
              </ul>
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => setGuardResult(null)}
                  className="rounded-xl bg-white border border-amber-300 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 shadow-sm transition-colors"
                >
                  ยกเลิกการลบ (ปลอดภัย)
                </button>
                <button
                  disabled={isLoading}
                  onClick={() => void handleExecutePurge(true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  ยืนยันลบถาวรทั้งหมด (Force Purge)
                </button>
              </div>
            </div>
          )}

          {!guardResult?.blocked_by_guard && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                disabled={isLoading || !studentId.trim()}
                onClick={() => void handleExecutePurge(false)}
                className="rounded-xl bg-rose-500 hover:bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'กำลังตรวจสอบ Dependency...' : 'ตรวจสอบและลบนักเรียนทดสอบ'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
