import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type { StudentLeaveRequest } from '../../services/studentAffairsCouncilService';

interface StudentLeaveOverviewCardProps {
  studentLeaves: StudentLeaveRequest[];
  onOpenAffairsView?: () => void;
  onApproveStudentLeave?: (id: string) => void;
}

export const StudentLeaveOverviewCard: React.FC<StudentLeaveOverviewCardProps> = ({
  studentLeaves,
  onOpenAffairsView,
  onApproveStudentLeave,
}) => {
  const pendingLeaves = studentLeaves.filter((l) => l.status === 'PENDING');
  const todaySickLeaves = studentLeaves.filter((l) => l.leaveType === 'ลาป่วย').length;
  const todayPersonalLeaves = studentLeaves.filter((l) => l.leaveType === 'ลากิจ').length;

  return (
    <div className="bg-white rounded-2xl border border-[#E6EEF7] shadow-[0_4px_16px_rgba(40,90,140,0.06)] p-4 sm:p-5 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#163A66] text-sm sm:text-base">
                การลานักเรียน (กิจการนักเรียน)
              </h3>
              <p className="text-[11px] text-slate-400">
                ซิงค์แบบเรียลไทม์กับการเช็คแถวและเช็คชื่อเข้าเรียน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAffairsView}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>จัดการใบลา</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2 Stat Boxes: Sick vs Personal */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-[11px] text-rose-800 font-semibold">ลาป่วยวันนี้</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {todaySickLeaves} <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium">มีหลักฐานผู้ปกครอง</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] text-amber-800 font-semibold">ลากิจวันนี้</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {todayPersonalLeaves} <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <span className="text-[10px] text-amber-600 font-medium">อนุมัติล่วงหน้า</span>
          </div>
        </div>

        {/* Pending Approval Stream for Students */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>คำขอนักเรียนรอดำเนินการ:</span>
            <span className="text-amber-600 font-bold">{pendingLeaves.length} รายการ</span>
          </div>

          {pendingLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
              ไม่มีใบลานักเรียนค้างตรวจ
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {pendingLeaves.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 truncate">
                      {l.studentName} ({l.classroom})
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {l.leaveType} • {l.reason}
                    </div>
                  </div>

                  {onApproveStudentLeave && (
                    <button
                      type="button"
                      onClick={() => onApproveStudentLeave(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-2xs"
                    >
                      อนุมัติ
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sync Banner Bottom */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ซิงค์ตรงสู่ ปพ.5 & คาบสอน</span>
        </span>
        <span className="font-semibold text-slate-700">อัปเดตอัตโนมัติ</span>
      </div>
    </div>
  );
};
