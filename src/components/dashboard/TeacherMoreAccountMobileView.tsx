import React from 'react';
import {
  User,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { getSchoolSettings, type SchoolUserRole } from '../../config/schoolRoles';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMoreAccountMobileViewProps {
  onNavigate: (view: TeacherViewKey) => void;
  onLogout: () => void;
  activeRole?: SchoolUserRole;
}

export const TeacherMoreAccountMobileView: React.FC<TeacherMoreAccountMobileViewProps> = ({
  onNavigate,
  onLogout,
}) => {
  const schoolSettings = getSchoolSettings();

  const menuItems = [
    {
      key: 'accounts' as TeacherViewKey,
      icon: User,
      label: 'ข้อมูลส่วนตัว',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'timetable' as TeacherViewKey,
      icon: Calendar,
      label: 'ภาระงาน / สอน',
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      key: 'class-overview' as TeacherViewKey,
      icon: ClipboardList,
      label: 'ประวัติการสอน',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      key: 'sar' as TeacherViewKey,
      icon: FileText,
      label: 'เอกสาร / แบบฟอร์ม',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      key: 'messages' as TeacherViewKey,
      icon: MessageSquare,
      label: 'ข้อความ & แชท',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      key: 'settings' as TeacherViewKey,
      icon: Settings,
      label: 'ตั้งค่า',
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-100',
    },
    {
      key: 'academic-year' as TeacherViewKey,
      icon: HelpCircle,
      label: 'ช่วยเหลือ / ติดต่อ',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Profile Header Card matching Screen 5 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-100 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
              alt="ครูปัญจพล เกษรัตน์"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        <h2 className="text-base font-extrabold text-slate-900 mt-3">
          ปัญจพล เกษรัตน์
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          ครู กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ
        </p>
      </div>

      {/* 2. School Card matching Screen 5 */}
      <div
        onClick={() => onNavigate('settings')}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-[#0C6D5B]/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
            <img
              src={schoolSettings.logoUrl}
              alt={schoolSettings.nameTh}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">
              {schoolSettings.nameTh}
            </h3>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {schoolSettings.districtProvince}
            </p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* 3. Navigation List matching Screen 5 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl ${item.bgColor} ${item.iconColor} flex items-center justify-center shrink-0`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>

      {/* 4. Logout Button matching Screen 5 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 px-4 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};
