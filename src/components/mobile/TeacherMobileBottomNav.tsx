import React from 'react';
import {
  Home,
  ClipboardList,
  Plus,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileBottomNavProps {
  currentView: TeacherViewKey;
  onNavigate: (view: TeacherViewKey) => void;
}

export const TeacherMobileBottomNav: React.FC<TeacherMobileBottomNavProps> = ({
  currentView,
  onNavigate,
}) => {
  const isHomeActive = currentView === 'home';
  const isTasksActive =
    currentView === 'mobile-grading-list' ||
    currentView === 'mobile-all-tasks' ||
    currentView === 'assignments' ||
    currentView === 'mobile-class-submissions' ||
    currentView === 'mobile-submission-detail';
  const isCreateActive = currentView === 'mobile-create-assignment';
  const isMessagesActive = currentView === 'messages';
  const isMoreActive =
    currentView === 'mobile-more' ||
    currentView === 'settings' ||
    currentView === 'mobile-calendar' ||
    currentView === 'mobile-grading-summary' ||
    currentView === 'mobile-room-scores' ||
    currentView === 'mobile-school-info';

  const isSettingsOrMore =
    currentView === 'settings' ||
    currentView === 'mobile-school-info' ||
    currentView === 'mobile-more';

  if (isSettingsOrMore) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-items-center">
          {/* 1. หน้าหลัก */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
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

          {/* 2. งาน */}
          <button
            type="button"
            onClick={() => onNavigate('mobile-grading-list')}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              isTasksActive
                ? 'text-blue-600 bg-blue-50/70 font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList
              className={`w-5 h-5 mb-0.5 ${
                isTasksActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'
              }`}
            />
            <span>งาน</span>
          </button>

          {/* 3. ข้อความ */}
          <button
            type="button"
            onClick={() => onNavigate('messages')}
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
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                3
              </span>
            </div>
            <span>ข้อความ</span>
          </button>

          {/* 4. เพิ่มเติม (Active pill) */}
          <button
            type="button"
            onClick={() => onNavigate('mobile-more')}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
              isMoreActive
                ? 'text-blue-700 bg-blue-100/90 font-extrabold px-3 py-1 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal
              className={`w-5 h-5 mb-0.5 ${
                isMoreActive ? 'text-blue-700 stroke-[2.5]' : 'text-slate-500'
              }`}
            />
            <span>เพิ่มเติม</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-end justify-items-center relative">
        {/* 1. หน้าหลัก */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
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

        {/* 2. งาน */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-grading-list')}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            isTasksActive
              ? 'text-blue-600 bg-blue-50/70 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardList
            className={`w-5 h-5 mb-0.5 ${
              isTasksActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'
            }`}
          />
          <span>งาน</span>
        </button>

        {/* 3. ปุ่มตรงกลาง: (+) มอบหมายงานใหม่ */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => onNavigate('mobile-create-assignment')}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
              isCreateActive
                ? 'bg-blue-700 text-white ring-4 ring-blue-100 scale-105'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
            }`}
            title="มอบหมายงานใหม่"
            aria-label="มอบหมายงานใหม่"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. ข้อความ */}
        <button
          type="button"
          onClick={() => onNavigate('messages')}
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
            <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
              3
            </span>
          </div>
          <span>ข้อความ</span>
        </button>

        {/* 5. เพิ่มเติม */}
        <button
          type="button"
          onClick={() => onNavigate('mobile-more')}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            isMoreActive
              ? 'text-blue-600 bg-blue-50/70 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MoreHorizontal
            className={`w-5 h-5 mb-0.5 ${
              isMoreActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'
            }`}
          />
          <span>เพิ่มเติม</span>
        </button>
      </div>
    </nav>
  );
};
