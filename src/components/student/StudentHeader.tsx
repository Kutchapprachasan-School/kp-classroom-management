import React, { useState, useMemo, useEffect } from 'react';
import NotificationRegular from '@mingcute/react/core-regular/notification';
import ExitDoorRegular from '@mingcute/react/core-regular/exit-door';
import MenuRegular from '@mingcute/react/core-regular/menu';
import Calendar2Regular from '@mingcute/react/core-regular/calendar-2';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import Settings3Regular from '@mingcute/react/core-regular/settings-3';
import { Search, ChevronDown, CheckCircle, Bell, X } from 'lucide-react';
import { studentBannerService } from '../../services/studentBannerService';
import { type SchoolUserRole, type SchoolBrandingSettings } from '../../config/schoolRoles';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import type { AuthUser } from '../../services/authService';
import { formatThaiDateFull } from '../../utils/timetableDateUtils';
import { formatClassroomLabel, studentService } from '../../services/studentService';
import { calculateStudentExp } from '../../services/studentExpService';
import { studentAffairsCouncilService } from '../../services/studentAffairsCouncilService';

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
  onOpenSearch?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExit,
  totalXp,
  studentName = 'นักเรียน',
  classroomName,
  currentUser,
  activeRole,
  schoolSettings: _schoolSettings,
  onOpenMobileMenu,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenAdminBannerModal,
  onOpenSearch,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const studentCode = currentUser?.studentCode || 'STD-001';

  const notifications = useMemo(() => {
    const list: Array<{ id: string; title: string; desc: string; type: 'LEAVE' | 'GENERAL' }> = [];
    const leaves = studentAffairsCouncilService.getStudentLeaves().filter((l) => l.studentCode === studentCode);
    leaves.forEach((l) => {
      if (l.status === 'APPROVED') {
        list.push({
          id: `leave-${l.id}`,
          title: `ใบลา ${l.leaveType} ได้รับการอนุมัติแล้ว`,
          desc: `ช่วงวันที่ ${l.startDate} ${l.endDate && l.endDate !== l.startDate ? `ถึง ${l.endDate}` : ''}`,
          type: 'LEAVE',
        });
      } else if (l.status === 'REJECTED') {
        list.push({
          id: `leave-${l.id}`,
          title: `ใบลา ${l.leaveType} ไม่ผ่านการอนุมัติ`,
          desc: l.reason || 'กรุณาติดต่อครูที่ปรึกษา',
          type: 'LEAVE',
        });
      }
    });
    return list;
  }, [studentCode]);

  const unreadCount = notifications.length;

  const isAdmin =
    currentUser?.role !== 'STUDENT' && studentBannerService.canManageBanners(activeRole);
  const displayXp =
    typeof totalXp === 'number'
      ? totalXp
      : calculateStudentExp(currentUser?.id, currentUser?.studentCode).totalXp;

  // Real student record for student number (ลำดับ)
  const studentRecord = useMemo(() => {
    if (currentUser?.studentCode) {
      const found = studentService.findStudentByCode(currentUser.studentCode);
      if (found) return found.student;
    }
    if (currentUser?.id) {
      const found = studentService.findStudentByCode(currentUser.id);
      if (found) return found.student;
    }
    return null;
  }, [currentUser?.studentCode, currentUser?.id]);

  const studentNo = studentRecord?.no || (currentUser as any)?.no || (currentUser as any)?.seatNo || 1;

  // Avatar state in sync with real-time updates
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "/images/banners/student-avatar.png");
  useEffect(() => {
    if (currentUser?.avatarUrl) setAvatarUrl(currentUser.avatarUrl);
  }, [currentUser?.avatarUrl]);

  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
      }
    };
    window.addEventListener('kps-student-avatar-updated', handleAvatarUpdated);
    return () => window.removeEventListener('kps-student-avatar-updated', handleAvatarUpdated);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 font-['Prompt',sans-serif] select-none">
      {/* ========================================================
          1. MOBILE TOP HEADER (< 1024px) - Aligned to Mockup Image
          ======================================================== */}
      <div className="flex lg:hidden items-center justify-between w-full">
        {/* Left: Hamburger + Student Avatar + Student Name + EXP & Rank # */}
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
              src={avatarUrl}
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
              {studentName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-amber-600 font-bold leading-tight">
                ⚡ {displayXp.toLocaleString()} XP
              </span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] text-blue-600 font-bold leading-tight">
                ลำดับ #{studentNo}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 mt-0.5">
              <span>🏠 {formatClassroomLabel(classroomName)}</span>
            </span>
          </div>
        </div>

        {/* Right: Search + Bell + Dropdown Chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border border-slate-200/60"
            title="ค้นหา"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
            title="การแจ้งเตือน"
          >
            <NotificationRegular className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
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
                src={avatarUrl}
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
                  {formatClassroomLabel(classroomName)}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">⚡ {displayXp.toLocaleString()} XP</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-semibold">ลำดับ #{studentNo}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">ตั้งใจเรียน พัฒนาตัวเอง สู่อนาคตที่ดีกว่า ✨</span>
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

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-600 flex items-center justify-center transition-colors cursor-pointer border border-sky-100/60"
            title={`การแจ้งเตือน (${unreadCount} รายการ)`}
          >
            <NotificationRegular className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
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

      {/* Notifications Popover Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-4 top-16 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 z-50 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>การแจ้งเตือน</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 opacity-80" />
                  <p className="font-medium text-slate-600">ไม่มีการแจ้งเตือนใหม่</p>
                  <p className="text-[11px] text-slate-400">คุณอัปเดตข้อมูลทุกอย่างเป็นปัจจุบันแล้ว</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-2 hover:bg-blue-50/50 rounded-xl transition-colors space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>{n.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-3.5">{n.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
