import {
  FileCheck,
  UserCheck,
  GraduationCap,
  Clock,
} from 'lucide-react';

interface LeaveStatCardsProps {
  pendingCount: number;
  staffOnLeaveTodayCount: number;
  studentsOnLeaveTodayCount: number;
  proxyTeachingAssignedCount: number;
  onFilterPending?: () => void;
}

export const LeaveStatCards: React.FC<LeaveStatCardsProps> = ({
  pendingCount,
  staffOnLeaveTodayCount,
  studentsOnLeaveTodayCount,
  proxyTeachingAssignedCount,
  onFilterPending,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 select-none">
      {/* 1. คำขอรอดำเนินการ (Pending Approval) - Higher Visual Priority ตาม Master Rule */}
      <div
        onClick={onFilterPending}
        className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer shadow-[0_4px_16px_rgba(40,90,140,0.06)] ${
          pendingCount > 0
            ? 'border-amber-300 ring-2 ring-amber-400/20 hover:border-amber-400'
            : 'border-[#E6EEF7]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">คำขอรอพิจารณา</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                  เร่งด่วน
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#163A66]">
                {pendingCount}
              </span>
              <span className="text-xs font-medium text-slate-500">ฉบับ</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-amber-700 font-medium">รอผู้บริหารอนุมัติ</span>
          <span className="font-semibold text-blue-600 hover:underline">คลิกเพื่อดูคิว ➔</span>
        </div>
      </div>

      {/* 2. บุคลากรลาวันนี้ */}
      <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-600">ครู/บุคลากรลาวันนี้</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#163A66]">
                {staffOnLeaveTodayCount}
              </span>
              <span className="text-xs font-medium text-slate-500">คน (จาก 124 คน)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>อัตราการมาปฏิบัติงาน</span>
          <span className="font-bold text-emerald-600">97.6%</span>
        </div>
      </div>

      {/* 3. ครูสอนแทนวันนี้ (จัดสอนแทนครบถ้วน) */}
      <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-600">จัดครูสอนแทน (วันนี้)</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#163A66]">
                {proxyTeachingAssignedCount}
              </span>
              <span className="text-xs font-medium text-slate-500">คาบเรียน</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>ความพร้อมห้องเรียน</span>
          <span className="font-bold text-emerald-600">100% มีครูดูแล</span>
        </div>
      </div>

      {/* 4. นักเรียนลาเรียนวันนี้ */}
      <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-600">นักเรียนลาเรียนวันนี้</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#163A66]">
                {studentsOnLeaveTodayCount}
              </span>
              <span className="text-xs font-medium text-slate-500">คน (ทั้งโรงเรียน)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>สัดส่วนการมาเรียน</span>
          <span className="font-bold text-blue-600">96.8% (มาปกติ)</span>
        </div>
      </div>
    </div>
  );
};
