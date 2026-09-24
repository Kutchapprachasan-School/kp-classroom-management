import React from 'react';
import { Award, ChevronDown } from 'lucide-react';

interface SarSummaryBannerProps {
  passPercentage?: number;
  passedCount?: number;
  totalStudents?: number;
  courseCount?: number;
  selectedThreshold?: string;
  onThresholdChange?: (val: string) => void;
}

export const SarSummaryBanner: React.FC<SarSummaryBannerProps> = ({
  passPercentage = 84.8,
  passedCount = 234,
  totalStudents = 276,
  courseCount = 4,
  selectedThreshold = 'เกรด 3 ขึ้นไป',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-card space-y-5">
      {/* Header with Title and Dropdown Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 flex items-center justify-center text-slate-500">
            <Award className="w-5 h-5 text-slate-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-[15px]">
            ผลการสอนรายวิชา (สำหรับ SAR / PA)
          </h2>
        </div>

        {/* Filter Criterion */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">เกณฑ์ที่ต้องการ</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors">
            <span>{selectedThreshold}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Hero Stats Card */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Big Highlight Percentage */}
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
            {passPercentage}%
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            ของนักเรียนทั้งหมดได้{selectedThreshold}
          </div>
        </div>

        {/* Right Metric Counters */}
        <div className="flex items-center gap-8 sm:gap-12 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-10">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {passedCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">คนที่ถึงเกณฑ์</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {totalStudents}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">คนทั้งหมด</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">
              {courseCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">รายวิชา × ระดับชั้น</div>
          </div>
        </div>
      </div>
    </div>
  );
};
