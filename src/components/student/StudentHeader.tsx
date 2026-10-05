// src/components/student/StudentHeader.tsx
// แถบด้านบนของนักเรียน (ตรงตามภาพอ้างอิง media_1791203662191.png พร้อมฟอนต์ Prompt)

import React from 'react';
import {
  Bell,
  LogOut,
  Menu,
  Calendar,
  Sparkles,
  Settings,
} from 'lucide-react';
import { studentBannerService } from '../../services/studentBannerService';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface StudentHeaderProps {
  onExit: () => void;
  totalXp?: number;
  studentName?: string;
  studentRole?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL';
  activeRole?: SchoolUserRole;
  onOpenMobileMenu?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenAdminBannerModal?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExit,
  totalXp = 670,
  studentName = 'ด.ช. ทัศธน คำปั้น',
  activeRole,
  onOpenMobileMenu,
  onToggleSidebar: _onToggleSidebar,
  onOpenAdminBannerModal,
}) => {
  const isAdmin = studentBannerService.canManageBanners(activeRole);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 font-['Prompt',sans-serif] select-none">
      {/* Left: Mobile Toggle + Student Greeting with Anime Avatar */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="เปิดเมนู"
            aria-label="เปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Student Avatar (Circular Anime Profile from Screenshot) */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-sky-100 overflow-hidden shadow-2xs bg-sky-50 flex items-center justify-center">
            <img
              src="/images/banners/student-avatar.png"
              alt={studentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://api.dicebear.com/7.x/bottts/svg?seed=student'
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
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
            ตั้งใจเรียน พัฒนาตัวเอง สู่อนาคตที่ดีกว่า ✨
          </p>
        </div>
      </div>

      {/* Right: Admin Shortcut (if Admin), Notifications Bell, Date, XP Pill, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Admin Banner Management Trigger (Only visible to Admin) */}
        {isAdmin && onOpenAdminBannerModal && (
          <button
            type="button"
            onClick={onOpenAdminBannerModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
            title="จัดการแบนเนอร์หน้านักเรียนทั้ง 3 ส่วน (สิทธิ์ Admin)"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>ปรับแต่ง Banner (Admin)</span>
          </button>
        )}

        {/* Notification Bell with Badge '3' */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-600 flex items-center justify-center transition-colors cursor-pointer border border-sky-100/60"
          title="การแจ้งเตือน (3 รายการ)"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
            3
          </span>
        </button>

        {/* Date Chip */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 text-xs font-medium text-slate-700 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>อังคารที่ 1 ตุลาคม 2569</span>
        </div>

        {/* XP Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{totalXp} XP</span>
        </div>

        {/* Logout Square Icon Button */}
        <button
          type="button"
          onClick={onExit}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="ออกจากระบบ"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
};
