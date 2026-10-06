import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const AdminStaffEvaluationCard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('ปีการศึกษา 2568');

  const ratingList = [
    { label: 'ดีเด่น', count: 42, percent: '34.1%', dotColor: 'bg-emerald-500' },
    { label: 'ดีมาก', count: 68, percent: '55.0%', dotColor: 'bg-blue-500' },
    { label: 'ดี', count: 12, percent: '9.7%', dotColor: 'bg-cyan-500' },
    { label: 'ปานกลาง', count: 2, percent: '1.6%', dotColor: 'bg-amber-500' },
    { label: 'ปรับปรุง', count: 0, percent: '0%', dotColor: 'bg-rose-400' },
  ];

  const averageScore = 87.5;
  // Calculate circular circumference
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averageScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          ผลประเมินบุคลากร
        </h3>

        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
          >
            <option value="ปีการศึกษา 2568">ปีการศึกษา 2568</option>
            <option value="ปีการศึกษา 2567">ปีการศึกษา 2567</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Gauge and Breakdown List */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2 flex-1">
        {/* Circular Progress Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#10B981"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              87.5%
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              คะแนนเฉลี่ย
            </span>
          </div>
        </div>

        {/* Rating Breakdown List */}
        <div className="w-full sm:flex-1 space-y-2">
          {ratingList.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                <span className="text-slate-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <span className="font-bold">{item.count} คน</span>
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
