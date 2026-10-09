// src/components/layout/TeacherSidebar.tsx
// แถบเมนูด้านข้าง (Sidebar) ตามภาพต้นแบบ Mockup Image 1
// ประกอบด้วย 10 เมนูหลัก, แบนเนอร์ข้าง (Sidebar Banner) ปรับแต่งได้โดย Admin, และปุ่มออกจากระบบ

import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  BookOpen,
  Users,
  BarChart2,
  Folder,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
  Sparkles,
  UserCheck,
  ClipboardCheck,
  Award,
  Layers,
} from 'lucide-react';
import {
  getSchoolSettings,
  DEFAULT_KUTCHAP_LOGO_SVG,
  type SchoolUserRole,
  type SchoolBrandingSettings,
} from '../../config/schoolRoles';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';
import { AdminTeacherBannerModal } from '../teacher/AdminTeacherBannerModal';

export type TeacherViewKey =
  | 'school-login'
  | 'home'
  | 'admin-dashboard'
  | 'class-overview'
  | 'morning-assembly'
  | 'classroom-attendance'
  | 'exams'
  | 'assignments'
  | 'readiness'
  | 'sar'
  | 'home-visit'
  | 'student-affairs'
  | 'student-council'
  | 'courses'
  | 'lessons'
  | 'classrooms'
  | 'roster'
  | 'student'
  | 'timetable'
  | 'academic-year'
  | 'messages'
  | 'settings'
  | 'trash'
  | 'accounts'
  | 'student-portal'
  | 'mobile-calendar'
  | 'mobile-all-tasks'
  | 'mobile-more';

interface TeacherSidebarProps {
  currentView: TeacherViewKey;
  onNavigate: (view: TeacherViewKey) => void;
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
  loginChannel?: 'E_LEAVE' | 'DIRECT_CLASSROOM';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavMenuItem {
  key: TeacherViewKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeStyle?: string;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentView,
  onNavigate,
  activeRole = 'TEACHER_GENERAL',
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [sidebarBanner, setSidebarBanner] = useState<TeacherBannerItem>(() =>
    teacherBannerService.getEffectiveBanner('sidebar')
  );
  const [isAdminBannerModalOpen, setIsAdminBannerModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setSidebarBanner(teacherBannerService.getEffectiveBanner('sidebar'));
    };
    window.addEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, handleUpdate);
  }, []);

  const handleSelect = (view: TeacherViewKey) => {
    onNavigate(view);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const isAdmin = teacherBannerService.canManageBanners(activeRole);
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSchoolSettings(getSchoolSettings());
    };
    window.addEventListener('kps-school-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('kps-school-settings-updated', handleSettingsUpdate);
  }, []);

  // เมนูหลักของครูตามแบบ Pastel Anime Education Dashboard
  const menuItems: NavMenuItem[] = [
    {
      key: 'home',
      label: 'หน้าหลัก',
      icon: Home,
    },
    ...(isAdmin
      ? [
          {
            key: 'admin-dashboard' as TeacherViewKey,
            label: 'Dashboard ผู้บริหาร',
            icon: Sparkles,
            badge: 'Admin',
            badgeStyle: 'bg-indigo-600 text-white font-black',
          },
        ]
      : []),
    {
      key: 'timetable',
      label: 'ตารางสอน',
      icon: Calendar,
    },
    {
      key: 'morning-assembly',
      label: 'เช็คแถวเช้า',
      icon: UserCheck,
    },
    {
      key: 'classroom-attendance',
      label: 'เช็คชื่อเข้าเรียน',
      icon: ClipboardCheck,
    },
    {
      key: 'assignments',
      label: 'ตรวจงาน',
      icon: BookOpen,
      badge: '3',
      badgeStyle: 'bg-rose-500 text-white font-extrabold',
    },
    {
      key: 'class-overview',
      label: 'คะแนนนักเรียน (ปพ.5)',
      icon: Award,
    },
    {
      key: 'classrooms',
      label: 'ห้องเรียน',
      icon: Layers,
    },
    {
      key: 'roster',
      label: 'รายชื่อนักเรียน',
      icon: Users,
    },
    {
      key: 'sar',
      label: 'ผลการเรียน',
      icon: BarChart2,
    },
    {
      key: 'courses',
      label: 'หลักสูตร/แผนการสอน',
      icon: Folder,
    },
    {
      key: 'exams',
      label: 'จัดการสอบ / เก็บคะแนน',
      icon: ClipboardList,
    },
    {
      key: 'academic-year',
      label: 'ปฏิทินกิจกรรม',
      icon: CalendarDays,
      badge: '5',
      badgeStyle: 'bg-rose-500 text-white font-extrabold',
    },
    {
      key: 'messages',
      label: 'ข้อความ & แชท',
      icon: MessageSquare,
      badge: '5',
      badgeStyle: 'bg-blue-500 text-white font-extrabold',
    },
    ...(activeRole === 'STUDENT_AFFAIRS'
      ? [
          {
            key: 'student-affairs' as TeacherViewKey,
            label: 'กิจการนักเรียน',
            icon: Users,
          },
        ]
      : []),
    {
      key: 'settings',
      label: 'ตั้งค่า',
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none font-sans">
      {/* 1. Header: School Logo & Title matching Image 1 */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xs bg-white border border-slate-100 p-0.5">
            <img
              src={schoolSettings.logoUrl || '/images/teacher/school_logo.png'}
              alt={schoolSettings.nameTh}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_KUTCHAP_LOGO_SVG;
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate">
              {schoolSettings.nameTh}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {schoolSettings.districtProvince || `${schoolSettings.district ? 'อ.' + schoolSettings.district : ''} ${schoolSettings.province ? 'จ.' + schoolSettings.province : ''}`.trim() || 'อ.กุดจับ จ.อุดรธานี'}
            </p>
          </div>
        </div>

        {(onClose || onToggleCollapse) && (
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                onClose?.();
              } else if (onToggleCollapse) {
                onToggleCollapse();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title="พับเก็บเมนูข้าง (Ctrl+B)"
            aria-label="พับเก็บเมนูข้าง"
          >
            <PanelLeftClose className="w-4 h-4 hidden lg:block" />
            <X className="w-4 h-4 lg:hidden" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items & Mascot Banner directly beneath Settings */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          const isActive =
            currentView === item.key ||
            (item.key === 'timetable' && currentView === 'timetable') ||
            (item.key === 'morning-assembly' && currentView === 'morning-assembly') ||
            (item.key === 'classroom-attendance' && currentView === 'classroom-attendance') ||
            (item.key === 'settings' &&
              ['settings', 'accounts', 'trash'].includes(currentView));

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelect(item.key)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconComp
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`min-w-4 h-4 px-1 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white text-blue-600 font-black' : item.badgeStyle
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* 3. Mascot Banner placed directly below Settings */}
        <div className="pt-2 px-0.5">
          <div className="relative rounded-2xl overflow-hidden border border-blue-100 shadow-2xs group bg-gradient-to-b from-sky-50 to-blue-50">
            <img
              src={
                currentView === 'messages'
                  ? '/images/banners/sidebar-banner.png'
                  : (sidebarBanner.customUrl || sidebarBanner.defaultUrl)
              }
              alt={sidebarBanner.name}
              className="w-full h-auto object-cover max-h-32"
            />

            {/* Text Overlay if custom image without text */}
            {sidebarBanner.customUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                <span className="font-extrabold text-xs leading-tight drop-shadow-xs">
                  {sidebarBanner.quoteText || 'สอนภาษาญี่ปุ่น'}
                </span>
                {sidebarBanner.subText && (
                  <span className="text-[10px] text-blue-100 font-medium drop-shadow-2xs mt-0.5">
                    {sidebarBanner.subText}
                  </span>
                )}
              </div>
            )}

            {/* Quick Admin Customize Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminBannerModalOpen(true)}
                className="absolute top-1.5 right-1.5 opacity-80 hover:opacity-100 p-1 rounded-lg bg-slate-900/80 hover:bg-blue-600 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs transition-opacity cursor-pointer shadow-xs"
                title="ปรับแต่งแบนเนอร์เมนูข้าง (เฉพาะแอดมิน)"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span className="hidden sm:inline">แก้ไข</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Logout Button matching Image 1 & Image 2 (Bottom contains only LogOut) */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('school-login')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-blue-200/90 bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4 text-blue-600 shrink-0" />
          <span>ออกจากระบบ</span>
        </button>
      </div>

      {/* Admin Banner Customization Modal */}
      <AdminTeacherBannerModal
        isOpen={isAdminBannerModalOpen}
        onClose={() => setIsAdminBannerModalOpen(false)}
        activeRole={activeRole}
        initialBannerKey="sidebar"
      />
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 min-h-screen bg-white border-r border-slate-200/80 text-xs text-slate-700 font-sans select-none transition-all duration-300 ease-in-out ${
          isCollapsed
            ? 'w-0 opacity-0 -translate-x-full overflow-hidden border-r-0 pointer-events-none'
            : 'w-60 lg:w-64 opacity-100 translate-x-0'
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="w-60 lg:w-64 h-full flex flex-col shrink-0">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-68 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col text-xs text-slate-700 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
