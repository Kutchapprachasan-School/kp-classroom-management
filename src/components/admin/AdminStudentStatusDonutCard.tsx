import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const AdminStudentStatusDonutCard: React.FC = () => {
  const studentData = [
    { name: 'ปกติ', count: 1176, percent: '94.2%', color: '#2563EB', dotClass: 'bg-blue-600' },
    { name: 'เสี่ยง', count: 48, percent: '3.8%', color: '#F59E0B', dotClass: 'bg-amber-500' },
    { name: 'ต้องติดตาม', count: 24, percent: '1.9%', color: '#EF4444', dotClass: 'bg-rose-500' },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none flex flex-col justify-between">
      {/* Header */}
      <div className="pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          สถิตินักเรียน
        </h3>
      </div>

      {/* Donut and Legend: Centered Donut on Top + Stacked List Below */}
      <div className="flex flex-col items-center justify-center gap-4 my-2 flex-1">
        {/* Donut with Center Count */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={studentData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={58}
                paddingAngle={3}
                dataKey="count"
              >
                {studentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val} คน`, name]}
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
            <span className="text-sm font-black text-slate-800 leading-tight">1,248</span>
            <span className="text-[10px] text-slate-400">คน</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full space-y-2 pt-1 border-t border-slate-50">
          {studentData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.dotClass} shrink-0`} />
                <span className="text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-900">
                <span className="font-bold">{item.count.toLocaleString()} คน</span>
                <span className="text-slate-400 text-[11px] w-12 text-right">
                  {item.percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
