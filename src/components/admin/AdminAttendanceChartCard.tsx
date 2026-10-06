import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';

export const AdminAttendanceChartCard: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState('วันนี้');

  const attendanceData = [
    { grade: 'ม.1', present: 96.5, absent: 2.1, leave: 1.4 },
    { grade: 'ม.2', present: 95.8, absent: 2.8, leave: 1.4 },
    { grade: 'ม.3', present: 94.2, absent: 3.5, leave: 2.3 },
    { grade: 'ม.4', present: 96.9, absent: 1.8, leave: 1.3 },
    { grade: 'ม.5', present: 95.1, absent: 2.9, leave: 2.0 },
    { grade: 'ม.6', present: 97.2, absent: 1.5, leave: 1.3 },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            สถิติการเข้าเรียน
          </h3>

        <div className="relative">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
          >
            <option value="วันนี้">วันนี้</option>
            <option value="สัปดาห์นี้">สัปดาห์นี้</option>
            <option value="เดือนนี้">เดือนนี้</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 my-2.5 text-[11px] font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>มาเรียน</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>ขาดเรียน</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>ลา</span>
        </div>
      </div>
      </div>

      {/* Bar Chart */}
      <div className="h-52 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={attendanceData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            barGap={2}
          >
            <XAxis
              dataKey="grade"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <Tooltip
              formatter={(val, name) => {
                const label = name === 'present' ? 'มาเรียน' : name === 'absent' ? 'ขาดเรียน' : 'ลา';
                return [`${val}%`, label];
              }}
              contentStyle={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '11px',
                border: 'none',
              }}
            />
            <Bar dataKey="present" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="absent" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="leave" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
