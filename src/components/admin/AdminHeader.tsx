import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Calendar,
  Bell,
  MessageSquare,
  ChevronDown,
  Settings,
  LogOut,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  termLabel?: string;
  onOpenSearchModal?: () => void;
  onNavigateToView?: (viewKey: string) => void;
  onChangeRole?: (role: SchoolUserRole) => void;
  onLogout?: () => void;
  activeRole?: SchoolUserRole;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  termLabel = 'ภาคเรียนที่ 1/2569',
  onOpenSearchModal,
  onNavigateToView,
  onChangeRole,
  onLogout,
  activeRole = 'ACADEMIC_ADMIN',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(termLabel);

  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(target)) {
        setIsMessagesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (termRef.current && !termRef.current.contains(target)) {
        setIsTermDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onOpenSearchModal?.();
    }
  };

  const termsList = [
    'ภาคเรียนที่ 1/2569',
    'ภาคเรียนที่ 2/2568',
    'ภาคเรียนที่ 1/2568',
  ];

  return (
    <header
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 sm:px-6 py-2.5 transition-all font-['Prompt',sans-serif] select-none"
      style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Sidebar Toggle + Wide Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="เปิด/ปิดแถบเมนูด้านข้าง"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={onOpenSearchModal}
              placeholder="ค้นหา ชื่อนักเรียน, บุคลากร, เลขที่, หรือเมนูต่างๆ..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50/90 hover:bg-slate-100/90 focus:bg-white text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs cursor-pointer"
            />
          </div>
        </div>

        {/* Right Side: Term Selector + Notifications + Messages + Director Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Term Selector Pill */}
          <div className="relative hidden md:block" ref={termRef}>
            <button
              type="button"
              onClick={() => setIsTermDropdownOpen(!isTermDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{selectedTerm}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isTermDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 text-xs">
                {termsList.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTerm(t);
                      setIsTermDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                      selectedTerm === t ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{t}</span>
                    {selectedTerm === t && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="การแจ้งเตือนสำคัญ (3 รายการ)"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-xs">
                3
              </span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="font-bold text-slate-800">ศูนย์แจ้งเตือนผู้บริหาร</div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                    3 ใหม่
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">อนุมัติคำขอจัดซื้ออุปกรณ์วิทย์</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ฝ่ายการเงิน & พัสดุ ส่งคำขอเร่งด่วน</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 10 นาทีที่แล้ว
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">นักเรียนกลุ่มเสี่ยงขาดเรียน ม.3/2</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ระบบตรวจพบคลิกรายงานติดตามพิเศษ 6 คน</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 45 นาทีที่แล้ว
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">ส่งเกรด SGS ครบ 100% กลุ่มสาระคณิต</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ครูผู้สอนส่งครบทุกห้องแล้ว</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 2 ชั่วโมงที่แล้ว
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messages Bubble */}
          <div className="relative" ref={msgRef}>
            <button
              type="button"
              onClick={() => setIsMessagesOpen(!isMessagesOpen)}
              className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="ข้อความและการสื่อสาร"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {isMessagesOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="font-bold text-slate-800">กล่องข้อความโรงเรียน</div>
                  <button
                    type="button"
                    onClick={() => onNavigateToView?.('student-affairs')}
                    className="text-blue-600 text-[11px] font-semibold hover:underline"
                  >
                    ดูทั้งหมด
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-slate-800 block">งานสารบรรณ</span>
                    หนังสือเวียนจาก สพฐ. เรื่องการประเมินวิทยฐานะ...
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-slate-800 block">ฝ่ายบริหารงานทั่วไป</span>
                    รายงานความคืบหน้าปรับปรุงอาคารเรียน 3...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Director Profile Badge */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-1 sm:pl-2 pr-1.5 py-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-blue-200 shadow-2xs shrink-0 bg-blue-50 flex items-center justify-center">
                <img
                  src="/images/admin/director_avatar.png"
                  alt="นายสมชาย ใจดี"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/teacher/teacher_avatar.png';
                  }}
                />
              </div>

              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  นายสมชาย ใจดี
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  ผู้อำนวยการโรงเรียน
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-50 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-blue-200 shrink-0">
                    <img
                      src="/images/admin/director_avatar.png"
                      alt="นายสมชาย ใจดี"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      นายสมชาย ใจดี
                    </div>
                    <div className="text-slate-500 text-[11px] truncate">
                      ผู้อำนวยการโรงเรียนศึกษาวิทยา
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      ผู้บริหารสูงสุด (Director)
                    </span>
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="py-2 border-b border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    สลับบทบาทการใช้งาน
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeRole?.('ACADEMIC_ADMIN');
                        setIsProfileOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer ${
                        activeRole === 'ACADEMIC_ADMIN'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ผู้บริหาร/Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeRole?.('TEACHER_GENERAL');
                        setIsProfileOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer ${
                        activeRole === 'TEACHER_GENERAL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ครูผู้สอน
                    </button>
                  </div>
                </div>

                {/* Settings & Logout */}
                <div className="pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigateToView?.('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>ตั้งค่าระบบโรงเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
