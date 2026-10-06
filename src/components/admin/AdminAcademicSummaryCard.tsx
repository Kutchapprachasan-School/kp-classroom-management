import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronDown, TrendingUp } from 'lucide-react';

export const AdminAcademicSummaryCard: React.FC = () => {
  const [selectedTerm, setSelectedTerm] = useState('ภาคเรียนที่ 1/2568');

  // GPA trend across grades M.1 to M.6 matching media_1791209295254.jpg
  const lineData = [
    { grade: 'ม.1', gpa: 2.85 },
    { grade: 'ม.2', gpa: 3.20 },
    { grade: 'ม.3', gpa: 3.12 },
    { grade: 'ม.4', gpa: 3.38 },
    { grade: 'ม.5', gpa: 3.56 },
    { grade: 'ม.6', gpa: 3.82 },
  ];

  // Grade breakdown distribution donut matching mockup: 28%, 34%, 22%, 11%, 5%
  const donutData = [
    { name: '4.00', value: 28, color: '#2563EB' },
    { name: '3.50 - 3.99', value: 34, color: '#38BDF8' },
    { name: '3.00 - 3.49', value: 22, color: '#FACC15' },
    { name: '2.50 - 2.99', value: 11, color: '#FB923C' },
    { name: 'ต่ำกว่า 2.50', value: 5, color: '#F43F5E' },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            สรุปผลการเรียน <span className="text-xs font-normal text-slate-500">(เฉลี่ยรวมทุกระดับ)</span>
          </h3>

          <div className="relative">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
            >
              <option value="ภาคเรียนที่ 1/2568">ภาคเรียนที่ 1/2568</option>
              <option value="ภาคเรียนที่ 2/2567">ภาคเรียนที่ 2/2567</option>
              <option value="ภาคเรียนที่ 1/2567">ภาคเรียนที่ 1/2567</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Main Score & Sub-trend */}
        <div className="flex items-baseline gap-2.5 my-3">
          <span className="text-3xl font-black text-slate-900 tracking-tight">3.52</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <TrendingUp className="w-3 h-3" />
            +0.18 จากภาคเรียนก่อน
          </span>
        </div>
      </div>

      {/* Visual Charts: Left (Line Chart) + Right (Donut Chart) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-12 gap-3 items-center">
        {/* Left Side: Line Chart */}
        <div className="2xl:col-span-7 h-40 sm:h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="grade"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                domain={[2.0, 4.0]}
                ticks={[2.0, 2.5, 3.0, 3.5, 4.0]}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [`เกรดเฉลี่ย: ${val}`, '']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '11px',
                  border: 'none',
                }}
              />
              <Line
                type="monotone"
                dataKey="gpa"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0EA5E9', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#0284C7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right Side: Donut Chart with Legend */}
        <div className="2xl:col-span-5 flex flex-col items-center justify-center gap-2">
          <div className="text-xs font-bold text-slate-700 self-start">
            ระดับผลการเรียน
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            {/* Donut with Center Text */}
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={46}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val}%`, `เกรด ${name}`]}
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
                <span className="text-[11px] font-black text-slate-800 leading-none">1,248</span>
                <span className="text-[9px] text-slate-400">คน</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium text-slate-600">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate w-16">{item.name}</span>
                  <span className="font-bold text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
