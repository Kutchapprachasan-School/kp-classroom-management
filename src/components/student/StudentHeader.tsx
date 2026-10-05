import React from 'react';
import { Sparkles, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react';

interface StudentHeaderProps {
  onExit: () => void;
  totalXp?: number;
  onOpenMobileMenu?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExit,
  totalXp = 0,
  onOpenMobileMenu,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20 select-none">
      {/* Left: Mobile Hamburger / Toggle Sidebar + Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium min-w-0">
        {(onToggleSidebar || onOpenMobileMenu) && (
          <button
            type="button"
            onClick={onToggleSidebar || onOpenMobileMenu}
            className={`px-2.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs ${
              isSidebarOpen
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/90'
                : 'text-white bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-600/20'
            }`}
            title={
              isSidebarOpen
                ? 'พับเก็บเมนูข้าง (ซ่อน Sidebar) - Ctrl+B'
                : 'เปิดเมนูหลัก (แสดง Sidebar) - Ctrl+B'
            }
            aria-label="สลับการแสดงผลเมนูข้าง"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSidebarOpen ? 'ซ่อนเมนู' : 'เปิดเมนู'}
            </span>
            <span className="sm:hidden">เมนู</span>
          </button>
        )}
        <span className="hidden sm:inline">ห้องเรียนของฉัน</span>
        <span className="text-slate-300 hidden sm:inline">/</span>
        <span className="text-slate-800 font-semibold truncate">พื้นที่ของฉัน</span>
      </div>

      {/* Right: Term, XP Badge, Exit */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium shrink-0">
        <span className="text-slate-500 hidden md:inline">ภาคเรียนที่ 1 / 2569</span>

        {/* XP Star Pill */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{totalXp} XP</span>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 sm:px-2.5 py-1 rounded-lg transition-colors"
          title="กลับสู่มุมมองครู"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออก</span>
        </button>
      </div>
    </header>
  );
};
