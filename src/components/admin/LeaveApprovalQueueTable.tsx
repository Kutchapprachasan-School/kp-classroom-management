import React, { useState } from 'react';
import {
  Clock,
  Eye,
  Check,
} from 'lucide-react';
import type { StaffLeaveRequest } from '../../services/schoolStaffLeaveService';

interface LeaveApprovalQueueTableProps {
  leaves: StaffLeaveRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onViewDetails: (leave: StaffLeaveRequest) => void;
}

export const LeaveApprovalQueueTable: React.FC<LeaveApprovalQueueTableProps> = ({
  leaves,
  onApprove,
  onReject,
  onViewDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

  const displayedLeaves =
    activeTab === 'PENDING'
      ? leaves.filter((l) => l.status === 'PENDING')
      : leaves;

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div className="bg-white rounded-2xl border border-[#E6EEF7] shadow-[0_4px_16px_rgba(40,90,140,0.06)] p-4 sm:p-6 select-none">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#163A66] text-base sm:text-lg">
              รายการคำขอลาของบุคลากร
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                รออนุมัติ {pendingCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            พิจารณาอนุมัติคำขอลาและตรวจสอบการจัดครูสอนแทนประจำคาบ
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-white text-[#163A66] font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            รอดำเนินการ ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-[#163A66] font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด ({leaves.length})
          </button>
        </div>
      </div>

      {/* Content: Mobile Cards + Desktop Table (Data & List Presentation Rule) */}
      {displayedLeaves.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium">ไม่มีคำขอลาที่รอดำเนินการในขณะนี้</p>
          <p className="text-xs text-slate-400 mt-0.5">ทุกรายการได้รับการพิจารณาเรียบร้อยแล้ว</p>
        </div>
      ) : (
        <>
          {/* 1. Desktop Table */}
          <div className="hidden md:block overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[#6B7C93] font-semibold">
                  <th className="py-3 px-3">ผู้ขอลา & ตำแหน่ง</th>
                  <th className="py-3 px-3">ประเภทการลา</th>
                  <th className="py-3 px-3">ช่วงวันที่ลา</th>
                  <th className="py-3 px-3 text-center">จัดสอนแทน</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedLeaves.map((leave) => {
                  const isPending = leave.status === 'PENDING';
                  return (
                    <tr
                      key={leave.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-amber-50/20 font-medium' : ''
                      }`}
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {leave.staffName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-[#163A66] text-[13px]">
                              {leave.staffName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {leave.position} • {leave.department.replace('กลุ่มสาระฯ ', '')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <span>{leave.leaveTypeLabel}</span>
                          <span className="text-[10px] text-slate-500">({leave.daysCount} วัน)</span>
                        </div>
                        {leave.hasMedicalCertificate && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            ✓ มีใบรับรองแพทย์
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800">
                          {leave.startDate} {leave.startDate !== leave.endDate && `ถึง ${leave.endDate}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {leave.reason}
                        </div>
                      </td>

                      {/* Proxy Teaching */}
                      <td className="py-3.5 px-3 text-center">
                        {leave.substitutes.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            สอนแทน {leave.substitutes.length} คาบ
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">- ไม่ติดคาบสอน -</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>รอพิจารณา</span>
                          </span>
                        ) : leave.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>อนุมัติแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span>ไม่อนุมัติ</span>
                          </span>
                        )}
                      </td>

                      {/* Primary Actions (Importance-Driven) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDetails(leave)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="ดูรายละเอียดใบลา"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApprove(leave.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs transition-all hover:scale-102 cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                              <button
                                type="button"
                                onClick={() => onReject(leave.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                ตีกลับ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Cards (Mobile-First Rule) */}
          <div className="md:hidden space-y-3 mt-3">
            {displayedLeaves.map((leave) => {
              const isPending = leave.status === 'PENDING';
              return (
                <div
                  key={leave.id}
                  className={`p-3.5 rounded-xl border ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-100 bg-white'
                  } space-y-3 shadow-2xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                        {leave.staffName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-[#163A66] text-sm">
                          {leave.staffName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {leave.position}
                        </div>
                      </div>
                    </div>
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        รออนุมัติ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        {leave.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 bg-slate-50/80 p-2.5 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ประเภท:</span>
                      <span className="font-semibold text-slate-800">
                        {leave.leaveTypeLabel} ({leave.daysCount} วัน)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">วันที่:</span>
                      <span>
                        {leave.startDate} {leave.startDate !== leave.endDate && `ถึง ${leave.endDate}`}
                      </span>
                    </div>
                    <div className="pt-1 text-slate-500 text-[11px]">
                      {leave.reason}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onViewDetails(leave)}
                      className="text-xs font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียด</span>
                    </button>

                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onReject(leave.id)}
                          className="px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 text-xs font-semibold"
                        >
                          ตีกลับ
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove(leave.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-bold shadow-xs"
                        >
                          อนุมัติ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
