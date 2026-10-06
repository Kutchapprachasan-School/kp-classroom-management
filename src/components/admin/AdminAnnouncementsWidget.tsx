import React from 'react';
import {
  Calendar,
  Heart,
  Wifi,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

interface AdminAnnouncementsWidgetProps {
  onViewAll?: () => void;
  onSelectItem?: (item: AnnouncementItem) => void;
}

export const AdminAnnouncementsWidget: React.FC<AdminAnnouncementsWidgetProps> = ({
  onViewAll,
  onSelectItem,
}) => {
  const items: AnnouncementItem[] = [
    {
      id: '1',
      title: 'ประกาศปิดภาคเรียนที่ 1/2568',
      date: '25 ส.ค. 2568',
      icon: Calendar,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      iconColor: 'text-rose-600',
    },
    {
      id: '2',
      title: 'กิจกรรมวันแม่แห่งชาติ',
      date: '12 ส.ค. 2568',
      icon: Heart,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: '3',
      title: 'แจ้งซ่อมระบบอินเทอร์เน็ตชั่วคราว',
      date: '10 ส.ค. 2568',
      icon: Wifi,
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      id: '4',
      title: 'เปิดรับสมัครนักเรียน ม.1 และ ม.4',
      date: '5 ส.ค. 2568',
      icon: GraduationCap,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          ข่าวประชาสัมพันธ์
        </h3>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem?.(item)}
              className="flex items-start gap-3 p-1.5 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <div
                className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
              >
                <IconComp className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {item.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
