import React from 'react';
import { FileEdit, Video, PenTool, Music } from 'lucide-react';
import type { IncompleteGradingItem } from '../../types/viewModels';

interface IncompleteGradingCardProps {
  items: IncompleteGradingItem[];
}

export const IncompleteGradingCard: React.FC<IncompleteGradingCardProps> = ({ items }) => {
  const getIcon = (type: IncompleteGradingItem['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
      case 'exam':
        return <PenTool className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
      case 'music':
      default:
        return <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <FileEdit className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-800 text-[14px]">
          ยังกรอกคะแนนไม่ครบ
        </h2>
      </div>

      {/* Grid of 3 items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              {item.missingCount}
            </div>
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <span className="mt-0.5">{getIcon(item.type)}</span>
              <div>
                <p className="line-clamp-1 font-medium text-slate-700">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400">{item.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
