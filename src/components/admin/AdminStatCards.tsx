import React from 'react';
import {
  Users,
  Briefcase,
  CalendarCheck,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface StatItem {
  id: string;
  title: string;
  value: string;
  unit?: string;
  trend: string;
  isTrendPositive: boolean;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
}

export const AdminStatCards: React.FC = () => {
  const stats: StatItem[] = [
    {
      id: 'students',
      title: 'นักเรียนทั้งหมด',
      value: '1,248',
      unit: 'คน',
      trend: '+12 จากเดือนที่แล้ว',
      isTrendPositive: true,
      icon: Users,
      iconBg: 'bg-blue-600',
      iconColor: 'text-white',
      badgeBg: 'bg-blue-50',
    },
    {
      id: 'staff',
      title: 'บุคลากรทั้งหมด',
      value: '124',
      unit: 'คน',
      trend: '+2 จากเดือนที่แล้ว',
      isTrendPositive: true,
      icon: Briefcase,
      iconBg: 'bg-indigo-600',
      iconColor: 'text-white',
      badgeBg: 'bg-indigo-50',
    },
    {
      id: 'attendance',
      title: 'การเข้าเรียนวันนี้',
      value: '95.6%',
      trend: '+2.3% จากเมื่อวาน',
      isTrendPositive: true,
      icon: CalendarCheck,
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      badgeBg: 'bg-emerald-50',
    },
    {
      id: 'tasks',
      title: 'งานรอดำเนินการ',
      value: '28',
      unit: 'รายการ',
      trend: '-15% จากสัปดาห์ที่แล้ว',
      isTrendPositive: false,
      icon: FileText,
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      badgeBg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 select-none">
      {stats.map((stat) => {
        const IconComp = stat.icon;
        return (
          <div
            key={stat.id}
            className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between"
          >
            {/* Faint outline icon pill on top-right */}
            <div className="absolute right-3.5 top-3.5 p-1.5 rounded-xl bg-slate-50 border border-slate-100/80 text-slate-400/80 pointer-events-none">
              <IconComp className="w-4 h-4 stroke-[1.5]" />
            </div>

            <div className="flex items-center gap-3.5 relative z-10">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
              >
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-[13px] font-medium text-slate-500 block truncate">
                  {stat.title}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-xs font-medium text-slate-500">
                      {stat.unit}
                    </span>
                  )}
                </div>

                {/* Trend Indicator directly under value */}
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                  {stat.isTrendPositive ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{stat.trend}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-rose-500">
                      <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{stat.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
