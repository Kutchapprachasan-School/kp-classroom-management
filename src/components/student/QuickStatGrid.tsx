import React from 'react';

interface QuickStatGridProps {
  pendingCount?: number;
  submittedCount?: number;
  xpRewardedCount?: number;
}

export const QuickStatGrid: React.FC<QuickStatGridProps> = ({
  pendingCount = 1,
  submittedCount = 5,
  xpRewardedCount = 0,
}) => {
  const stats = [
    { value: pendingCount, label: 'ภารกิจที่รอทำ' },
    { value: submittedCount, label: 'งานที่ส่งแล้ว' },
    { value: xpRewardedCount, label: 'ภารกิจที่ได้ XP' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
