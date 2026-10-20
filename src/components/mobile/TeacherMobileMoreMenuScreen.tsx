import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  BarChart2,
  Folder,
  ClipboardCheck,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  School,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileMoreMenuScreenProps {
  onNavigate: (view: TeacherViewKey) => void;
  onLogout?: () => void;
  teacherName?: string;
  department?: string;
  avatarUrl?: string;
  currentActiveItem?: string;
}

export const TeacherMobileMoreMenuScreen: React.FC<TeacherMobileMoreMenuScreenProps> = ({
  onNavigate,
  onLogout,
  teacherName = 'ครูผู้สอน',
  department = 'ครู',
  avatarUrl = '/images/teacher/teacher_avatar.png',
  currentActiveItem = 'grading',
}) => {
  interface MenuItem {
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    viewKey: TeacherViewKey;
    badge?: number | string;
    isActive?: boolean;
  }

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'หน้าหลัก',
      icon: Home,
      viewKey: 'home',
      isActive: currentActiveItem === 'home',
    },
    {
      id: 'grading',
      label: 'ตรวจงาน / สอน',
      icon: BookOpen,
      viewKey: 'mobile-grading-list',
      isActive: currentActiveItem === 'grading' || currentActiveItem === 'assignments', // Matching screenshot active blue highlight!
    },
    {
      id: 'students',
      label: 'นักเรียน',
      icon: Users,
      viewKey: 'roster',
    },
    {
      id: 'scores',
      label: 'ผลการเรียน',
      icon: BarChart2,
      viewKey: 'mobile-room-scores',
    },
    {
      id: 'lessons',
      label: 'สื่อการสอน / ไฟล์',
      icon: Folder,
      viewKey: 'lessons',
    },
    {
      id: 'evaluations',
      label: 'ประเมิน / แบบฟอร์ม',
      icon: ClipboardCheck,
      viewKey: 'exams',
    },
    {
      id: 'calendar',
      label: 'ปฏิทินกิจกรรม',
      icon: CalendarDays,
      viewKey: 'mobile-calendar',
    },
    {
      id: 'messages',
      label: 'ข้อความ',
      icon: MessageSquare,
      viewKey: 'messages',
      badge: 3,
    },
    {
      id: 'school-info',
      label: 'ข้อมูลโรงเรียน',
      icon: School,
      viewKey: 'mobile-school-info',
    },
    {
      id: 'settings',
      label: 'ตั้งค่า',
      icon: Settings,
      viewKey: 'settings',
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-3 pb-24 font-sans select-none text-slate-800">
      {/* 1. TOP TEACHER PROFILE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-blue-100 bg-blue-50 shadow-2xs flex items-center justify-center">
          <img
            src={avatarUrl}
            alt={teacherName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/teacher/teacher_avatar.png';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-slate-900 truncate">
            {teacherName}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {department}
          </p>
        </div>
      </div>

      {/* 2. MENU ITEMS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-1.5 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.viewKey)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-semibold'
              }`}
            >
              {/* Left: Icon + Label */}
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span className="text-xs truncate tracking-tight">
                  {item.label}
                </span>
              </div>

              {/* Right: Badge or Arrow Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {item.badge !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 ${
                    isActive ? 'text-white/80' : 'text-slate-400'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. LOGOUT BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            else onNavigate('school-login');
          }}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-rose-50 border border-slate-200/90 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};
