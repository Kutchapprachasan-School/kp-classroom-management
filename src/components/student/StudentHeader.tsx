// src/components/student/StudentHeader.tsx
// แถบด้านบนของนักเรียน (ตรงตามภาพอ้างอิง media_1791203662191.png พร้อมฟอนต์ Prompt)

import React, { useState } from 'react';
import NotificationRegular from '@mingcute/react/core-regular/notification';
import ExitDoorRegular from '@mingcute/react/core-regular/exit-door';
import MenuRegular from '@mingcute/react/core-regular/menu';
import Calendar2Regular from '@mingcute/react/core-regular/calendar-2';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import Settings3Regular from '@mingcute/react/core-regular/settings-3';
import { Search, ChevronDown } from 'lucide-react';
import { studentBannerService } from '../../services/studentBannerService';
import { getSchoolSettings, type SchoolUserRole, type SchoolBrandingSettings } from '../../config/schoolRoles';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import type { AuthUser } from '../../services/authService';
import { formatThaiDateFull } from '../../utils/timetableDateUtils';

import { calculateStudentExp } from '../../services/studentExpService';

interface StudentHeaderProps {
  onExit: () => void;
  totalXp?: number;
  studentName?: string;
  classroomName?: string;
  studentRole?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL';
  activeRole?: SchoolUserRole;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig | SchoolBrandingSettings;
  onOpenMobileMenu?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenAdminBannerModal?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExit,
  totalXp,
  studentName = 'นักเรียน',
  classroomName,
  currentUser,
  activeRole,
  schoolSettings,
  onOpenMobileMenu,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenAdminBannerModal,
}) => {
  const [defaultSettings] = useState(() => getSchoolSettings());
  const effectiveSettings = schoolSettings || defaultSettings;

  const isAdmin = studentBannerService.canManageBanners(activeRole);
  const displayXp =
    typeof totalXp === 'number'
      ? totalXp
      : calculateStudentExp(currentUser?.id, currentUser?.studentCode).totalXp;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 font-['Prompt',sans-serif] select-none">
      {/* ========================================================
          1. MOBILE TOP HEADER (< 1024px) - Aligned to Mockup Image
          ======================================================== */}
      <div className="flex lg:hidden items-center justify-between w-full">
        {/* Left: Hamburger + Student Avatar + School info & Class badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {(onToggleSidebar || onOpenMobileMenu) && (
            <button
              type="button"
              onClick={onToggleSidebar || onOpenMobileMenu}
              className="p-1.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer min-w-[36px] min-h-[36px]"
              title="เปิดเมนูข้าง"
              aria-label="เปิดเมนูข้าง"
            >
              <MenuRegular className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-full border-2 border-sky-200 overflow-hidden shadow-2xs bg-sky-50 flex items-center justify-center shrink-0">
            <img
              src={currentUser?.avatarUrl || "/images/banners/student-avatar.png"}
              alt={studentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(studentName)
                );
              }}
            />
          </div>

          <div className="min-w-0">
            <span className="font-extrabold text-[#163A66] text-xs sm:text-sm leading-tight block truncate">
              {effectiveSettings?.nameTh || 'โรงเรียนกุดจับประชาสรรค์'}
            </span>
            <span className="text-[10px] text-[#6B7C93] font-medium leading-tight block truncate mt-0.5">
              {effectiveSettings?.districtProvince || 'ต.กุดจับ อ.กุดจับ จ.อุดรธานี'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 mt-0.5">
              <span>🏠 {classroomName || 'ม.3/1'}</span>
            </span>
          </div>
        </div>

        {/* Right: Search + Bell (3) + Dropdown Chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border border-slate-200/60"
            title="ค้นหา"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            type="button"
            className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
            title="การแจ้งเตือน"
          >
            <NotificationRegular className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSidebar || onOpenMobileMenu}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            title="เมนูเพิ่มเติม"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ========================================================
          2. DESKTOP TOP HEADER (>= 1024px)
          ======================================================== */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Left: Desktop Toggle + Student Greeting with Anime Avatar */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] ${
                !isSidebarOpen
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={!isSidebarOpen ? 'เปิดแถบเมนูข้าง (Ctrl+B)' : 'พับแถบเมนูข้าง (Ctrl+B)'}
              aria-label={!isSidebarOpen ? 'เปิดแถบเมนูข้าง' : 'พับแถบเมนูข้าง'}
            >
              <MenuRegular className="w-5 h-5" />
            </button>
          )}

          {/* Student Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-sky-100 overflow-hidden shadow-2xs bg-sky-50 flex items-center justify-center">
              <img
                src={currentUser?.avatarUrl || "/images/banners/student-avatar.png"}
                alt={studentName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(studentName)
                  );
                }}
              />
            </div>
          </div>

          {/* Greeting & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">
                สวัสดีครับ {studentName} 👋
              </h2>
              {classroomName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {classroomName}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
              ตั้งใจเรียน พัฒนาตัวเอง สู่อนาคตที่ดีกว่า ✨
            </p>
          </div>
        </div>

        {/* Right: Admin Shortcut (if Admin), Notifications Bell, Date, XP Pill, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAdmin && onOpenAdminBannerModal && (
            <button
              type="button"
              onClick={onOpenAdminBannerModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
              title="จัดการแบนเนอร์หน้านักเรียนทั้ง 3 ส่วน (สิทธิ์ Admin)"
            >
              <Settings3Regular className="w-3.5 h-3.5" />
              <span>ปรับแต่ง Banner (Admin)</span>
            </button>
          )}

          {/* Notification Bell with Badge '3' */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-600 flex items-center justify-center transition-colors cursor-pointer border border-sky-100/60"
            title="การแจ้งเตือน (3 รายการ)"
          >
            <NotificationRegular className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Date Chip */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 text-xs font-medium text-slate-700 shadow-2xs">
            <Calendar2Regular className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatThaiDateFull(new Date())}</span>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs shadow-2xs">
            <SparklesRegular className="w-3.5 h-3.5 text-amber-500" />
            <span>{displayXp} XP</span>
          </div>

          {/* Logout Square Icon Button */}
          <button
            type="button"
            onClick={onExit}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="ออกจากระบบ"
          >
            <ExitDoorRegular className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
};
