// src/components/student/StudentMobileBottomNav.tsx
// แถบนำทางด้านล่างสำหรับนักเรียนบนจอมือถือ (ตรงตาม Mockup Image media_1792039984527_e4e6c262.png)

import React from 'react';
import { Home, BookOpen, MessageSquare, MoreHorizontal } from 'lucide-react';
import type { StudentTabKey } from './StudentSidebar';

interface StudentMobileBottomNavProps {
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  onOpenMoreMenu: () => void;
}

export const StudentMobileBottomNav: React.FC<StudentMobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMoreMenu,
}) => {
  const isHomeActive = activeTab === 'home';
  const isMissionsActive = activeTab === 'missions';
  const isMessagesActive = activeTab === 'contact';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-1.5 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)] font-sans">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-items-center">
        {/* 1. หน้าหลัก */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            isHomeActive
              ? 'text-blue-600 bg-blue-50/70 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home
            className={`w-5 h-5 mb-0.5 ${
              isHomeActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'
            }`}
          />
          <span>หน้าหลัก</span>
        </button>

        {/* 2. งาน (Active mint/teal pill in screenshot) */}
        <button
          type="button"
          onClick={() => onSelectTab('missions')}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
            isMissionsActive
              ? 'text-[#0D9488] bg-[#E6F4F1] font-extrabold shadow-2xs px-3'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen
            className={`w-5 h-5 mb-0.5 ${
              isMissionsActive ? 'text-[#0D9488] stroke-[2.5]' : 'text-slate-500'
            }`}
          />
          <span>งาน</span>
        </button>

        {/* 3. ข้อความ */}
        <button
          type="button"
          onClick={() => onSelectTab('contact')}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer relative ${
            isMessagesActive
              ? 'text-blue-600 bg-blue-50/70 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <MessageSquare
              className={`w-5 h-5 mb-0.5 ${
                isMessagesActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'
              }`}
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          </div>
          <span>ข้อความ</span>
        </button>

        {/* 4. เพิ่มเติม */}
        <button
          type="button"
          onClick={onOpenMoreMenu}
          className="w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-500" />
          <span>เพิ่มเติม</span>
        </button>
      </div>
    </nav>
  );
};
