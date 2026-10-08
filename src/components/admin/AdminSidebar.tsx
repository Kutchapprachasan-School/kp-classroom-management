import React from 'react';
import Home1Regular from '@mingcute/react/core-regular/home-1';
import User3Regular from '@mingcute/react/core-regular/user-3';
import AwardRegular from '@mingcute/react/core-regular/award';
import CertificateRegular from '@mingcute/react/core-regular/certificate';
import Book2Regular from '@mingcute/react/core-regular/book-2';
import CalendarDayRegular from '@mingcute/react/core-regular/calendar-day';
import WalletRegular from '@mingcute/react/core-regular/wallet';
import Building1Regular from '@mingcute/react/core-regular/building-1';
import Document2Regular from '@mingcute/react/core-regular/document-2';
import Message1Regular from '@mingcute/react/core-regular/message-1';
import ChartBarRegular from '@mingcute/react/core-regular/chart-bar';
import ShieldRegular from '@mingcute/react/core-regular/shield';
import Settings3Regular from '@mingcute/react/core-regular/settings-3';
import ServerRegular from '@mingcute/react/core-regular/server';
import Transfer2Regular from '@mingcute/react/core-regular/transfer-2';
import ChipRegular from '@mingcute/react/core-regular/chip';
import RightSmallRegular from '@mingcute/react/core-regular/right-small';
import CloseRegular from '@mingcute/react/core-regular/close';
import { AdminSchoolLogo } from './AdminSchoolLogo';

import type { SchoolBrandingSettings } from '../../config/schoolRoles';
import { getSchoolSettings } from '../../config/schoolRoles';

export type AdminMenuKey =
  | 'home'
  | 'personnel-hr'
  | 'evaluation'
  | 'students-parents'
  | 'academic-results'
  | 'attendance'
  | 'finance-procurement'
  | 'buildings-repairs'
  | 'documents-admin'
  | 'school-comm'
  | 'reports-dashboard'
  | 'users-permissions'
  | 'system-settings'
  | 'backup-restore'
  | 'import-export'
  | 'api-integration';

interface AdminSidebarProps {
  currentMenu?: AdminMenuKey;
  onSelectMenu: (key: AdminMenuKey) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  schoolSettings?: SchoolBrandingSettings;
}

interface NavItemDef {
  key: AdminMenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  badge?: string;
  badgeColor?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentMenu = 'home',
  onSelectMenu,
  isOpen = false,
  onClose,
  isCollapsed = false,
  schoolSettings,
}) => {
  const branding = schoolSettings || getSchoolSettings();
  const mainNavItems: NavItemDef[] = [
    { key: 'home', label: 'หน้าหลัก', icon: Home1Regular },
    { key: 'personnel-hr', label: 'บุคลากร & HR', icon: User3Regular },
    { key: 'evaluation', label: 'ระบบประเมินบุคลากร', icon: AwardRegular },
    { key: 'students-parents', label: 'นักเรียน & ผู้ปกครอง', icon: CertificateRegular },
    { key: 'academic-results', label: 'วิชาการ & ผลการเรียน', icon: Book2Regular },
    { key: 'attendance', label: 'การเข้าเรียน', icon: CalendarDayRegular },
    { key: 'finance-procurement', label: 'การเงิน & พัสดุ', icon: WalletRegular },
    { key: 'buildings-repairs', label: 'อาคาร & งานซ่อม', icon: Building1Regular },
    { key: 'documents-admin', label: 'เอกสาร & งานธุรการ', icon: Document2Regular },
    { key: 'school-comm', label: 'สื่อสารโรงเรียน', icon: Message1Regular },
    { key: 'reports-dashboard', label: 'รายงาน & Dashboard', icon: ChartBarRegular },
  ];

  const systemNavItems: NavItemDef[] = [
    { key: 'users-permissions', label: 'ผู้ใช้งาน / สิทธิ์การใช้งาน', icon: ShieldRegular },
    { key: 'system-settings', label: 'ตั้งค่าระบบ', icon: Settings3Regular },
    { key: 'backup-restore', label: 'สำรองข้อมูล', icon: ServerRegular },
    { key: 'import-export', label: 'Import / Export', icon: Transfer2Regular },
    { key: 'api-integration', label: 'API & Integration', icon: ChipRegular },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-100 flex flex-col transition-all duration-300 font-['Prompt',sans-serif] select-none
    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
    ${isCollapsed ? 'lg:w-20' : 'w-64 lg:w-64'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={sidebarClasses}
        style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <AdminSchoolLogo size={38} logoUrl={branding.logoUrl} />
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                  {branding.nameTh}
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  {branding.nameEn}
                </div>
                <div className="text-[9.5px] text-amber-600 font-semibold truncate mt-0.5">
                  "{branding.districtProvince || 'โรงเรียนคุณภาพ สพฐ.'}"
                </div>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {isOpen && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <CloseRegular className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentMenu === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectMenu(item.key);
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <RightSmallRegular
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white/80' : 'text-slate-300 group-hover:text-slate-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* System Section ("ระบบกลาง") */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ระบบกลาง
              </div>
            )}
            {systemNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentMenu === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectMenu(item.key);
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Feature Card: "Smart School Better Future" */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 shrink-0">
            <div className="rounded-2xl p-3 bg-gradient-to-b from-sky-50/80 via-blue-50/60 to-white border border-blue-100/80 shadow-2xs relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[11px] font-extrabold text-blue-900 leading-tight">
                  Smart School
                </div>
                <div className="text-[10px] font-semibold text-blue-600">
                  Better Future
                </div>
              </div>
              <div className="mt-2 w-full h-24 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/images/admin/smart_school_campus.png"
                  alt="Smart School Campus"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
