// src/components/promotion/AcademicRolloverControlCenter.tsx
import React, { useState } from 'react';
import { PromotionWizardModal, type ClassroomOption } from './PromotionWizardModal';
import { PromotionRollbackModal } from './PromotionRollbackModal';
import { AlumniDirectoryView } from './AlumniDirectoryView';
import { StudentPurgeModal } from './StudentPurgeModal';
import {
  Rocket,
  RotateCcw,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';

export interface AcademicRolloverControlCenterProps {
  classrooms: ClassroomOption[];
  currentUserId: string;
}

export const AcademicRolloverControlCenter: React.FC<AcademicRolloverControlCenterProps> = ({
  classrooms,
  currentUserId,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* แบนเนอร์แจ้งผลการทำงานล่าสุด */}
      {lastNotification && (
        <div className="rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 text-sm font-semibold text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{lastNotification}</span>
          </div>
          <button
            onClick={() => setLastNotification(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 p-1"
            aria-label="ปิดแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* แผงปุ่มควบคุมหลัก 3 การ์ด */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl bg-pink-50/70 border border-pink-200/80 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-pink-300 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white border border-pink-200 flex items-center justify-center text-pink-600 shadow-2xs">
              <Rocket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-pink-950 text-base">1. เลื่อนชั้นนักเรียน & ปิดปีการศึกษา</h3>
            <p className="text-xs text-pink-800 leading-relaxed">
              4-Step Wizard พร้อมระบบตรวจเด็กติด 0/ร และบันทึกประวัติการเรียนแบบ Two-Tier Enrollment
            </p>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 hover:bg-pink-600 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>เปิด Promotion Wizard</span>
          </button>
        </div>

        <div className="rounded-3xl bg-purple-50/70 border border-purple-200/80 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-purple-300 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-purple-950 text-base">2. ประวัติการเลื่อนชั้น & Rollback</h3>
            <p className="text-xs text-purple-800 leading-relaxed">
              ย้อนกลับการเลื่อนชั้นได้ใน 1 คลิก พร้อมระบบตรวจจับคะแนนใหม่ในตาราง StudentScore (2-Stage Conflict Guard)
            </p>
          </div>
          <button
            onClick={() => setIsRollbackOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>จัดการ Rollback</span>
          </button>
        </div>

        <div className="rounded-3xl bg-rose-50/70 border border-rose-200/80 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-rose-300 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-rose-950 text-base">3. ลบข้อมูลนักเรียนทดสอบ</h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              ล้างข้อมูลนักเรียนที่ใช้ทดสอบระบบรายบุคคล โดยไม่กระทบข้อมูลนักเรียนจริงในห้อง
            </p>
          </div>
          <button
            onClick={() => setIsPurgeOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>เปิดเครื่องมือลบเด็กทดสอบ</span>
          </button>
        </div>
      </div>

      {/* ส่วนแสดงทำเนียบศิษย์เก่าและ Transcript */}
      <AlumniDirectoryView />

      {/* Modals ทั้ง 3 ตัว */}
      <PromotionWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        classrooms={classrooms}
        currentUserId={currentUserId}
        onPromotionSuccess={(batchId) =>
          setLastNotification(`ดำเนินการเลื่อนชั้นสำเร็จเรียบร้อย (รหัสรอบ: ${batchId})`)
        }
      />

      <PromotionRollbackModal
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        currentUserId={currentUserId}
        onRollbackSuccess={(batchId) =>
          setLastNotification(`ย้อนกลับข้อมูลรอบการเลื่อนชั้น ${batchId} คืนค่าเดิมสำเร็จ`)
        }
      />

      <StudentPurgeModal
        isOpen={isPurgeOpen}
        onClose={() => setIsPurgeOpen(false)}
        onPurgeSuccess={(purgedId) =>
          setLastNotification(`ลบข้อมูลนักเรียนทดสอบรหัส ${purgedId} ออกจากระบบเรียบร้อยแล้ว`)
        }
      />
    </div>
  );
};
