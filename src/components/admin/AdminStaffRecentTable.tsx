import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StaffEvalItem {
  id: string;
  name: string;
  position: string;
  score: number;
  status: 'ดีเด่น' | 'ดีมาก' | 'ดี' | 'ปานกลาง' | 'ปรับปรุง';
  statusStyle: string;
  avatarColor: string;
}

interface AdminStaffRecentTableProps {
  onViewAll?: () => void;
  onSelectStaff?: (staff: StaffEvalItem) => void;
}

export const AdminStaffRecentTable: React.FC<AdminStaffRecentTableProps> = ({
  onViewAll,
  onSelectStaff,
}) => {
  const staffList: StaffEvalItem[] = [
    {
      id: '1',
      name: 'นางสาวกมลวรรณ ศรีสุข',
      position: 'ครู คศ.2',
      score: 92.5,
      status: 'ดีเด่น',
      statusStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      avatarColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: '2',
      name: 'นายธนกร พงษ์ศรี',
      position: 'ครู คศ.1',
      score: 88.0,
      status: 'ดีมาก',
      statusStyle: 'bg-sky-50 text-sky-700 border-sky-200',
      avatarColor: 'bg-sky-100 text-sky-700',
    },
    {
      id: '3',
      name: 'นางสาวปิยะธิดา แก้วใส',
      position: 'ครู คศ.1',
      score: 85.6,
      status: 'ดีมาก',
      statusStyle: 'bg-sky-50 text-sky-700 border-sky-200',
      avatarColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: '4',
      name: 'นายสุรชัย วงศ์ษา',
      position: 'ครู คศ.2',
      score: 78.3,
      status: 'ดี',
      statusStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      avatarColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: '5',
      name: 'นางสาวจิราพร โพธิน',
      position: 'พนักงานราชการ',
      score: 72.1,
      status: 'ปานกลาง',
      statusStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      avatarColor: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          การประเมินบุคลากร <span className="text-xs font-normal text-slate-500">(ล่าสุด)</span>
        </h3>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
              <th className="py-2.5 px-2">ชื่อ - สกุล</th>
              <th className="py-2.5 px-2">ตำแหน่ง</th>
              <th className="py-2.5 px-2 text-center">คะแนน</th>
              <th className="py-2.5 px-2 text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffList.map((staff) => (
              <tr
                key={staff.id}
                onClick={() => onSelectStaff?.(staff)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Name with mini avatar & sub-position */}
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full overflow-hidden ${staff.avatarColor} border border-slate-200/80 flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs`}
                    >
                      <img
                        src={`/images/teacher/teacher_avatar.png`}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span>{staff.name.replace('นางสาว', '').replace('นาย', '').charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {staff.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {staff.position}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Position */}
                <td className="py-2.5 px-2 text-slate-500 font-medium whitespace-nowrap">
                  {staff.position}
                </td>

                {/* Score */}
                <td className="py-2.5 px-2 text-center font-bold text-slate-900 whitespace-nowrap">
                  {staff.score.toFixed(1)}
                </td>

                {/* Status Pill Badge */}
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${staff.statusStyle}`}
                  >
                    {staff.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
