import React from 'react';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export interface SettingsCategoryCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  onClick: () => void;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
  badge?: string;
  quickInfo?: string;
}

export const SettingsCategoryCard: React.FC<SettingsCategoryCardProps> = ({
  title,
  subtitle,
  icon,
  iconBgClass,
  iconColorClass,
  onClick,
  isExpanded = false,
  onToggleExpand,
  badge,
  quickInfo,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between select-none ${
        isExpanded
          ? 'border-blue-400 shadow-md ring-2 ring-blue-100'
          : 'border-[#E6EEF7] hover:border-blue-300 hover:shadow-card hover:-translate-y-0.5'
      }`}
    >
      {/* Top Section: Icon, Title/Subtitle, ChevronRight */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Rounded squircle icon */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs ${iconBgClass} ${iconColorClass}`}
          >
            {icon}
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-[#163A66] group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              {badge && (
                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-[#6B7C93] line-clamp-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Arrow > */}
        <div className="p-1 rounded-lg text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Quick info if present */}
      {quickInfo && (
        <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[11px] font-medium text-slate-500 line-clamp-1">
          {quickInfo}
        </div>
      )}

      {/* Bottom Dropdown Trigger Button (ตรงตาม mockup: ดูรายละเอียด ˇ) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            if (onToggleExpand) {
              e.stopPropagation();
              onToggleExpand(e);
            } else {
              onClick();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold text-slate-500 bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-700 border border-slate-200/80 group-hover:border-blue-200 transition-all cursor-pointer"
        >
          <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-semibold transition-colors">
          คลิกเพื่อจัดการ
        </span>
      </div>
    </div>
  );
};
