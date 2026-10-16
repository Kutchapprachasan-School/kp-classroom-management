// src/components/student/StudentSidebar.tsx
// แถบเมนูด้านข้างของนักเรียน (ตรงตามภาพอ้างอิง media_1791203662191.png พร้อมฟอนต์ Prompt)
// มีแบนเนอร์ส่วนที่ 1 (Sidebar Banner) ด้านล่าง ที่ Admin สามารถอัปโหลดปรับเปลี่ยนได้

import React, { useState, useEffect } from 'react';
import Home1Regular from '@mingcute/react/core-regular/home-1';
import Book2Regular from '@mingcute/react/core-regular/book-2';
import ClipboardRegular from '@mingcute/react/core-regular/clipboard';
import ChartBarRegular from '@mingcute/react/core-regular/chart-bar';
import Calendar2Regular from '@mingcute/react/core-regular/calendar-2';
import AnnouncementRegular from '@mingcute/react/core-regular/announcement';
import User3Regular from '@mingcute/react/core-regular/user-3';
import Chat2Regular from '@mingcute/react/core-regular/chat-2';
import ExitDoorRegular from '@mingcute/react/core-regular/exit-door';
import CloseRegular from '@mingcute/react/core-regular/close';
import LayoutLeftbarCloseRegular from '@mingcute/react/core-regular/layout-leftbar-close';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import CellphoneRegular from '@mingcute/react/core-regular/cellphone';
import SafeShieldRegular from '@mingcute/react/core-regular/safe-shield';
import { type SchoolUserRole } from '../../config/schoolRoles';
import { getSchoolSettings } from '../../config/schoolSettings';
import { cleanSlateService } from '../../services/cleanSlateService';
import {
  studentBannerService,
  STUDENT_BANNERS_EVENT,
} from '../../services/studentBannerService';

export type StudentTabKey =
  | 'home'
  | 'courses'
  | 'missions'
  | 'gradebook'
  | 'timetable'
  | 'announcements'
  | 'profile'
  | 'contact'
  | 'anime-app'
  | 'gacha'
  | 'mobile-care'
  | 'arena'
  | 'trophy'
  | 'home-visit'
  | 'student-leave'
  | 'student-council'
  | 'council-affairs';

interface StudentSidebarProps {
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  studentRole?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL';
  onChangeStudentRole?: (role: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL') => void;
  onSwitchToTeacherRole?: (role: SchoolUserRole) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  studentRole = 'STUDENT_GENERAL',
  onChangeStudentRole: _onChangeStudentRole,
  onSwitchToTeacherRole: _onSwitchToTeacherRole,
  onLogout,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [sidebarBannerUrl, setSidebarBannerUrl] = useState<string>(() =>
    studentBannerService.getEffectiveBannerUrl('sidebar')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setSidebarBannerUrl(studentBannerService.getEffectiveBannerUrl('sidebar'));
    };
    window.addEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
  }, []);

  const handleTabClick = (tab: StudentTabKey) => {
    onSelectTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const schoolSettings = getSchoolSettings();

  const studentNavCategories = [
    {
      title: 'การเรียน & ภารกิจ',
      items: [
        { key: 'home' as StudentTabKey, label: 'หน้าหลัก', icon: Home1Regular, badge: null },
        { key: 'courses' as StudentTabKey, label: 'รายวิชาของฉัน', icon: Book2Regular, badge: null },
        {
          key: 'missions' as StudentTabKey,
          label: 'งานที่ได้รับมอบหมาย',
          icon: ClipboardRegular,
          badge: cleanSlateService.isCleanSlateActive() ? null : 3,
        },
        { key: 'timetable' as StudentTabKey, label: 'ตารางเรียน', icon: Calendar2Regular, badge: null },
      ],
    },
    {
      title: 'ผลการเรียน & สถิติ',
      items: [
        { key: 'gradebook' as StudentTabKey, label: 'ผลการเรียน', icon: ChartBarRegular, badge: null },
        { key: 'announcements' as StudentTabKey, label: 'กิจกรรม / ประกาศ', icon: AnnouncementRegular, badge: null },
      ],
    },
    {
      title: 'การสื่อสาร & บัญชี',
      items: [
        { key: 'profile' as StudentTabKey, label: 'ข้อมูลส่วนตัว', icon: User3Regular, badge: null },
        { key: 'contact' as StudentTabKey, label: 'ติดต่อครู', icon: Chat2Regular, badge: null },
      ],
    },
    {
      title: 'กิจกรรม & บัดดี้',
      items: [
        { key: 'gacha' as StudentTabKey, label: 'สุ่มคู่หู (Gacha)', icon: SparklesRegular, badge: 'Lv.2' },
        { key: 'mobile-care' as StudentTabKey, label: 'ดูแลนักเรียน 9 หน้า', icon: CellphoneRegular, badge: null },
        ...(studentRole === 'STUDENT_COUNCIL'
          ? [
              {
                key: 'council-affairs' as StudentTabKey,
                label: 'ตรวจแถวเช้าสภาฯ',
                icon: SafeShieldRegular,
                badge: 'สภา',
              },
            ]
          : []),
      ],
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between font-['Prompt',sans-serif] bg-white border-r border-slate-200/90 text-slate-700">
      {/* Top Header: Logo + School Name matching Image 1 */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xs bg-white border border-slate-100 p-0.5">
              <img
                src={schoolSettings.logoUrl || '/school-logo.png'}
                alt={schoolSettings.nameTh}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    '/school-logo.png'
                  );
                }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate leading-tight">
                {schoolSettings.nameTh}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {schoolSettings.districtProvince || 'อ.กุดจับ จ.อุดรธานี'}
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
                } else {
                  onClose?.();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              title="พับเก็บเมนูข้าง"
            >
              <LayoutLeftbarCloseRegular className="w-4 h-4 hidden lg:block" />
              <CloseRegular className="w-4 h-4 lg:hidden" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links Grouped by Category */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 select-none">
        {studentNavCategories.map((cat, catIdx) => (
          <div key={cat.title} className={catIdx > 0 ? 'pt-2 border-t border-slate-100/80' : ''}>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {cat.title}
            </div>
            <div className="space-y-1">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabClick(item.key)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : item.badge === 'สภา'
                            ? 'bg-purple-100 text-purple-800'
                            : item.badge === 'Lv.2'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-red-500 text-white shadow-2xs'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Area: BANNER 1 (Sidebar Banner) + Logout Button */}
      <div className="p-3 border-t border-slate-100 space-y-2.5 shrink-0 bg-slate-50/40">
        {/* Banner 1: Sidebar Motivational Card */}
        <div className="relative rounded-2xl overflow-hidden border border-sky-100 shadow-2xs group bg-white">
          <img
            src={sidebarBannerUrl}
            alt="แบนเนอร์กำลังใจนักเรียน"
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-102"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute(
                'src',
                '/images/banners/sidebar-banner.png'
              );
            }}
          />
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose?.();
          }}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100/80 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
        >
          <ExitDoorRegular className="w-4 h-4 text-slate-500" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 min-h-screen select-none transition-all duration-300 ease-in-out ${
          isCollapsed
            ? 'w-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none'
            : 'w-60 xl:w-64 opacity-100 translate-x-0'
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="w-60 xl:w-64 h-full fixed top-0 left-0 bottom-0 z-30">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[84vw] bg-white h-full shadow-2xl flex flex-col select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
