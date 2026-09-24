import React from 'react';
import { Target, PenTool, Music, FileText } from 'lucide-react';
import type { LowestAssignmentItem } from '../../types/viewModels';

interface LowestAssignmentsCardProps {
  items: LowestAssignmentItem[];
}

export const LowestAssignmentsCard: React.FC<LowestAssignmentsCardProps> = ({ items }) => {
  const getIcon = (type: LowestAssignmentItem['type']) => {
    switch (type) {
      case 'exam':
        return <PenTool className="w-3.5 h-3.5 text-slate-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-slate-400" />;
      case 'infographic':
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-[14px]">
            ชิ้นงานที่ห้องนี้ทำได้ต่ำที่สุด
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          ทุกชิ้นเฉลี่ยเกิน 70% แล้ว รายการนี้เรียงจากต่ำสุดไว้ดูเทียบ
        </p>

        <div className="space-y-3.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 w-48 sm:w-56 shrink-0 text-slate-700">
                {getIcon(item.type)}
                <span className="truncate font-normal" title={item.title}>
                  {item.title}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${item.averagePercent}%` }}
                />
              </div>

              <div className="w-10 text-right font-medium text-slate-600 shrink-0">
                {item.averagePercent}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
