import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { GradeDistributionItem } from '../../types/viewModels';

interface GradeDistributionBarProps {
  items: GradeDistributionItem[];
}

export const GradeDistributionBar: React.FC<GradeDistributionBarProps> = ({ items }) => {
  const getBarColor = (grade: string) => {
    switch (grade) {
      case '4':
      case '3.5':
        return 'bg-emerald-500';
      case '3':
      case '2.5':
        return 'bg-blue-500';
      case '2':
        return 'bg-blue-600';
      case '1.5':
        return 'bg-amber-500';
      case '1':
        return 'bg-orange-500';
      case '0':
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-800 text-[14px]">
          การกระจายเกรด
        </h2>
        <span className="text-xs text-slate-400 font-normal">
          (ถ้าตัดเกรดด้วยคะแนนที่มีตอนนี้)
        </span>
      </div>

      <div className="space-y-2 mt-4">
        {items.map((item) => (
          <div key={item.grade} className="flex items-center gap-3 text-xs">
            <div className="w-14 text-slate-500 font-medium shrink-0">
              เกรด {item.grade}
            </div>

            {/* Horizontal Bar */}
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              {item.percent > 0 ? (
                <div
                  className={`h-2.5 rounded-full ${getBarColor(
                    item.grade
                  )} transition-all duration-500`}
                  style={{ width: `${Math.max(item.percent, 3)}%` }}
                />
              ) : null}
            </div>

            <div className="w-12 text-right text-slate-600 font-medium shrink-0">
              {item.count} คน
            </div>

            <div className="w-10 text-right text-slate-400 shrink-0">
              {item.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
