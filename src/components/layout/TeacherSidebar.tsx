import React, { useState } from 'react';
import {
  Home,
  Users,
  PenTool,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  BookMarked,
  FileText,
  School,
  Calendar,
  CalendarDays,
  Settings,
  Trash2,
  ExternalLink,
  KeyRound,
  Building2,
  LogOut,
  HeartHandshake,
  ShieldAlert,
  Vote,
  X,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from 'lucide-react';

export type TeacherViewKey =
  | 'school-login'
  | 'home'
  | 'class-overview'
  | 'exams'
  | 'assignments'
  | 'readiness'
  | 'sar'
  | 'home-visit'
  | 'student-affairs'
  | 'student-council'
  | 'courses'
  | 'lessons'
  | 'roster'
  | 'student'
  | 'timetable'
  | 'academic-year'
  | 'settings'
  | 'trash'
  | 'accounts'
  | 'student-portal';

interface TeacherSidebarProps {
  currentView: TeacherViewKey;
  onNavigate: (view: TeacherViewKey) => void;
  loginChannel?: 'E_LEAVE' | 'DIRECT_CLASSROOM';
  isOpen?: boolean;
  onClose?: () => void;
}

const PRIMARY_VIEWS: TeacherViewKey[] = [
  'home',
  'class-overview',
  'home-visit',
  'student-affairs',
  'student-council',
  'readiness',
];

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentView,
  onNavigate,
  isOpen = false,
  onClose,
}) => {
  const isSecondaryViewActive = !PRIMARY_VIEWS.includes(currentView);
  const [showMoreMenus, setShowMoreMenus] = useState<boolean>(isSecondaryViewActive);

  const handleSelect = (view: TeacherViewKey) => {
    onNavigate(view);
    onClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand & User Profile Header (Compact) */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-600 text-white shadow-xs shrink-0 font-bold text-xs">
              ปพ.5
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs truncate">
                ระบบจัดการชั้นเรียน
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                ครูภาสภูมิ เรืองปราชญ์
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0"
              aria-label="ปิดเมนู"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Logout Button */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
            เชื่อมระบบการลา
          </span>
          <button
            onClick={() => handleSelect('school-login')}
            className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold transition-colors shrink-0"
            title="ออกจากระบบ หรือ สลับบัญชี"
          >
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>สลับบัญชี</span>
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        {/* หมวดหลัก (แยกหน้าใบลา กับ หน้าสภานักเรียน ออกจากกันชัดเจน) */}
        <div>
          <div className="px-2.5 pb-1.5 text-[11px] font-bold text-slate-400">
            เมนูหลักประจำวัน
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleSelect('home')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'home'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Home
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'home' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">1. หน้าแรกวันนี้</span>
            </button>

            <button
              onClick={() => handleSelect('class-overview')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'class-overview'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Users
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'class-overview' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">2. เช็คชื่อ & คะแนน (ปพ.5)</span>
            </button>

            <button
              onClick={() => handleSelect('home-visit')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'home-visit'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <HeartHandshake
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'home-visit' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">3. เยี่ยมบ้าน & ทุน กสศ.</span>
            </button>

            <button
              onClick={() => handleSelect('student-affairs')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'student-affairs'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <ShieldAlert
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'student-affairs' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">4. เช็คชื่อเสาธง & ใบลา</span>
            </button>

            <button
              onClick={() => handleSelect('student-council')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'student-council'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Vote
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'student-council' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">5. สภานักเรียน (เลือกตั้ง)</span>
            </button>

            <button
              onClick={() => handleSelect('readiness')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                currentView === 'readiness'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'readiness' ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">6. ตรวจก่อนส่งเกรด (ปพ.5)</span>
            </button>
          </div>
        </div>

        {/* ปุ่มลัดสลับไปหน้าเว็บนักเรียน */}
        <div>
          <button
            onClick={() => handleSelect('student-portal')}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 transition-colors font-semibold border border-teal-200"
            title="เปิดหน้าจอฝั่งนักเรียน"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="truncate">ดูหน้าจอฝั่งนักเรียน</span>
          </button>
        </div>

        {/* หมวดที่ 2: เมนูเพิ่มเติม & ตั้งค่าระบบ (พับเก็บได้ ไม่รกสายตา) */}
        <div className="pt-2 border-t border-slate-200/80">
          <button
            onClick={() => setShowMoreMenus((prev) => !prev)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">เมนูเพิ่มเติม & ตั้งค่า</span>
            </span>
            {showMoreMenus || isSecondaryViewActive ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {(showMoreMenus || isSecondaryViewActive) && (
            <div className="mt-1 space-y-0.5 pl-1 text-xs">
              <button
                onClick={() => handleSelect('exams')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'exams'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">การสอบกลาง/ปลายภาค</span>
              </button>

              <button
                onClick={() => handleSelect('assignments')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'assignments'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">สั่งงาน / การบ้าน</span>
              </button>

              <button
                onClick={() => handleSelect('sar')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'sar'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">เทียบผลข้ามห้อง (SAR)</span>
              </button>

              <button
                onClick={() => handleSelect('roster')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'roster' || currentView === 'student'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ทะเบียนรายชื่อนักเรียน</span>
              </button>

              <button
                onClick={() => handleSelect('timetable')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'timetable'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ตารางสอน / คาบเรียน</span>
              </button>

              <button
                onClick={() => handleSelect('courses')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'courses'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">รายวิชา / หลักสูตร</span>
              </button>

              <button
                onClick={() => handleSelect('lessons')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'lessons'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">แผนการสอน</span>
              </button>

              <button
                onClick={() => handleSelect('academic-year')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'academic-year'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ตั้งค่าปีการศึกษา</span>
              </button>

              <button
                onClick={() => handleSelect('settings')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'settings'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ตั้งค่า / สำรองข้อมูล</span>
              </button>

              <button
                onClick={() => handleSelect('accounts')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'accounts'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">บัญชีและรหัสผ่าน</span>
              </button>

              <button
                onClick={() => handleSelect('trash')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                  currentView === 'trash'
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ถังขยะ</span>
              </button>

              <a
                href="http://localhost:3001/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">เว็บระบบการลา (E-Leave)</span>
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar (Compact w-56 = 224px to give maximum space to data tables) */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen text-xs text-slate-700 font-sans select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] bg-white h-full shadow-2xl flex flex-col text-xs text-slate-700 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
