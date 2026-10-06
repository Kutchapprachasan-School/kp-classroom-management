import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const AdminSubjectAchievementCard: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState('ม.ปลาย');

  const subjects = [
    { name: 'ภาษาไทย', percent: 86.2, gradient: 'from-blue-500 to-indigo-500' },
    { name: 'คณิตศาสตร์', percent: 78.4, gradient: 'from-sky-400 to-blue-500' },
    { name: 'วิทยาศาสตร์', percent: 82.7, gradient: 'from-cyan-400 to-teal-500' },
    { name: 'สังคมศึกษา', percent: 80.1, gradient: 'from-amber-400 to-orange-500' },
    { name: 'ภาษาอังกฤษ', percent: 88.6, gradient: 'from-indigo-400 to-purple-500' },
    { name: 'สุขศึกษา', percent: 95.2, gradient: 'from-teal-400 to-emerald-500' },
    { name: 'ศิลปะ', percent: 90.3, gradient: 'from-fuchsia-400 to-pink-500' },
    { name: 'การงานอาชีพ', percent: 87.6, gradient: 'from-emerald-400 to-green-500' },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          ผลสัมฤทธิ์ทางการเรียน <span className="text-xs font-normal text-slate-500">(แยกตามกลุ่มสาระ)</span>
        </h3>

        <div className="relative">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
          >
            <option value="ม.ปลาย">ม.ปลาย</option>
            <option value="ม.ต้น">ม.ต้น</option>
            <option value="ทั้งหมด">ทั้งหมด (ม.1 - ม.6)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="mt-3 space-y-2.5">
        {subjects.map((subj) => (
          <div key={subj.name} className="flex items-center gap-3 text-xs">
            {/* Subject Label */}
            <span className="w-20 sm:w-24 font-medium text-slate-700 truncate shrink-0">
              {subj.name}
            </span>

            {/* Progress Bar Track */}
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${subj.gradient} transition-all duration-500`}
                style={{ width: `${subj.percent}%` }}
              />
            </div>

            {/* Percentage */}
            <span className="w-12 text-right font-bold text-slate-900 text-[11px] shrink-0">
              {subj.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Axis Scale Markers (0, 25%, 50%, 75%, 100%) */}
      <div className="flex justify-between pl-20 sm:pl-24 pr-12 mt-3 pt-2 border-t border-slate-100 text-[9.5px] font-semibold text-slate-400">
        <span>0</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};
