import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { StaffLeaveType } from '../../services/schoolStaffLeaveService';

interface LeaveDistributionChartsCardProps {
  typeData: Array<{ type: StaffLeaveType; label: string; count: number; color: string }>;
  deptData: Array<{ department: string; count: number; percentage: number }>;
}

export const LeaveDistributionChartsCard: React.FC<LeaveDistributionChartsCardProps> = ({
  typeData,
  deptData,
}) => {
  const totalCount = typeData.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="bg-white rounded-2xl border border-[#E6EEF7] shadow-[0_4px_16px_rgba(40,90,140,0.06)] p-4 sm:p-5 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div>
            <h3 className="font-bold text-[#163A66] text-sm sm:text-base">
              สัดส่วนประเภทการลา (ภาคเรียนนี้)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              แยกตามประเภทการลาและกลุ่มสาระการเรียนรู้
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            รวม {totalCount} ครั้ง
          </span>
        </div>

        {/* Donut Chart & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-3 my-2">
          {/* Donut */}
          <div className="h-40 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, _name, item) => [`${val} ครั้ง`, (item as any)?.payload?.label]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-[#163A66]">{totalCount}</span>
              <span className="text-[9px] text-slate-400 font-medium">รายการ</span>
            </div>
          </div>

          {/* Type Legend list */}
          <div className="space-y-1.5 text-xs">
            {typeData.map((item) => {
              const pct = Math.round((item.count / totalCount) * 100);
              return (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 font-medium truncate max-w-[100px]">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.count}</span>
                    <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Department breakdown progress bars */}
      <div className="pt-3 border-t border-slate-50 space-y-2">
        <span className="text-[11px] font-bold text-slate-700">
          สถิติแยกตามกลุ่มสาระฯ:
        </span>
        <div className="space-y-1.5">
          {deptData.slice(0, 3).map((dept) => (
            <div key={dept.department} className="text-[11px]">
              <div className="flex justify-between text-slate-600 mb-0.5">
                <span className="truncate">{dept.department}</span>
                <span className="font-semibold">{dept.count} ครั้ง ({dept.percentage}%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${dept.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
