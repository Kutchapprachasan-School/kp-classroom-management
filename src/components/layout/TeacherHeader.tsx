import React from 'react';
import {
  ArrowLeft,
  Home,
  Calendar,
  Search,
  HelpCircle,
  Bell,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface TeacherHeaderProps {
  title: string;
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  termLabel?: string;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  title,
  onBack,
  onOpenSearch,
  onOpenMobileMenu,
  termLabel = 'ภาคเรียนที่ 1/2569',
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20 select-none">
      {/* Left: Hamburger Menu (Mobile), Back Arrow, and Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="เปิดเมนูหลัก"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded border border-slate-300 hidden sm:block shrink-0" />
          <h1 className="font-semibold text-slate-800 text-sm sm:text-[15px] truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 text-slate-500 shrink-0">
        <button
          className="hidden md:inline-flex p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="หน้าหลัก"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          className="hidden md:inline-flex p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="ปฏิทิน"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ค้นหา</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          className="hidden sm:inline-flex p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="วิธีใช้งาน / ช่วยเหลือ"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notification Bell with Badge 6 */}
        <div className="relative">
          <button
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="การแจ้งเตือน"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-medium shadow-sm">
            6
          </span>
        </div>

        {/* Term Selector Dropdown */}
        <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 text-xs">
          <span className="text-slate-400 hidden xl:inline">ภาคเรียน</span>
          <button className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors">
            <span className="truncate max-w-[90px] sm:max-w-none">{termLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
