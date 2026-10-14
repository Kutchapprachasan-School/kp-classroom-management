import React from 'react';
import {
  X,
  CheckCircle,
} from 'lucide-react';
import type { StaffLeaveRequest } from '../../services/schoolStaffLeaveService';

interface LeaveDetailModalProps {
  isOpen: boolean;
  leave: StaffLeaveRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  isOpen,
  leave,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!isOpen || !leave) return null;

  const isPending = leave.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {leave.staffName.slice(0, 1)}
            </div>
            <div>
              <h3 className="font-bold text-[#163A66] text-sm sm:text-base">
                รายละเอียดคำขอลา • {leave.staffName}
              </h3>
              <p className="text-xs text-slate-500">
                รหัสคำขอ: {leave.id} • ยื่นเมื่อ {leave.createdAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">สถานะคำขอ:</span>
              {isPending ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  รอผู้อำนวยการพิจารณา
                </span>
              ) : leave.status === 'APPROVED' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  อนุมัติแล้ว โดย {leave.approvedBy} ({leave.approvedAt})
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  ไม่อนุมัติ ({leave.rejectionReason})
                </span>
              )}
            </div>

            <div className="font-bold text-blue-600">
              {leave.leaveTypeLabel} ({leave.daysCount} วัน)
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 font-medium">สังกัดกลุ่มสาระ</span>
              <p className="font-bold text-slate-800 text-[13px]">{leave.department}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 font-medium">ตำแหน่ง / วิทยฐานะ</span>
              <p className="font-bold text-slate-800 text-[13px]">{leave.position}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 font-medium">ระยะเวลาที่ขอลา</span>
              <p className="font-bold text-slate-800 text-[13px]">
                {leave.startDate} ถึง {leave.endDate} ({leave.daysCount} วันทำการ)
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 font-medium">เบอร์โทรศัพท์ติดต่อเร่งด่วน</span>
              <p className="font-bold text-slate-800 text-[13px]">{leave.contactPhone}</p>
            </div>
          </div>

          {/* Reason Section */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <span className="text-slate-500 font-bold">เหตุผลความจำเป็น:</span>
            <p className="text-slate-700 leading-relaxed text-[13px]">{leave.reason}</p>
            {leave.hasMedicalCertificate && (
              <div className="pt-2 text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>แนบใบรับรองแพทย์จากสถานพยาบาลแล้ว</span>
              </div>
            )}
          </div>

          {/* Proxy Teaching Table (จัดครูสอนแทน) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800">
                การจัดครูสอนแทนประจำคาบ ({leave.substitutes.length} คาบ)
              </h4>
              <span className="text-[11px] text-emerald-600 font-semibold">
                ✓ ได้รับการยืนยันจากผู้สอนแทนแล้ว
              </span>
            </div>

            {leave.substitutes.length === 0 ? (
              <p className="text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                ไม่มีคาบสอนที่ตรงกับช่วงเวลาที่ขอลา
              </p>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">คาบ</th>
                      <th className="p-2.5">ห้องเรียน</th>
                      <th className="p-2.5">วิชา</th>
                      <th className="p-2.5">ครูผู้สอนแทน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leave.substitutes.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-blue-600">คาบที่ {sub.periodNo}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{sub.classroom}</td>
                        <td className="p-2.5 text-slate-600">
                          {sub.courseCode} ({sub.courseName})
                        </td>
                        <td className="p-2.5 font-bold text-slate-700">
                          {sub.substituteTeacherName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-600 text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReject(leave.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
              >
                ไม่อนุมัติ / ตีกลับ
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove(leave.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs transition-all hover:scale-102 cursor-pointer"
              >
                อนุมัติคำขอลา
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
