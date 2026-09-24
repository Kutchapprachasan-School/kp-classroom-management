import React from 'react';
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
  School as SchoolIcon,
  HeartHandshake,
  ShieldAlert,
  Vote,
  X,
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

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentView,
  onNavigate,
  loginChannel = 'E_LEAVE',
  isOpen = false,
  onClose,
}) => {
  const handleSelect = (view: TeacherViewKey) => {
    onNavigate(view);
    onClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand & User Profile Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* School Emblem (Garuda / Golden Crest) */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 border border-amber-200 shadow-sm shrink-0 overflow-hidden">
              <svg viewBox="0 0 40 40" className="w-8 h-8 text-amber-600">
                <path
                  fill="currentColor"
                  d="M20 3L23 10L30 11L25 16L27 23L20 19L13 23L15 16L10 11L17 10Z"
                />
                <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-sm truncate">
                ระบบจัดการชั้นเรียน
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                  ภ
                </div>
                <span className="text-xs text-slate-500 truncate max-w-[140px]">
                  นายภาสภูมิ เรืองปราชญ์
                </span>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Active Login Channel Status & Logout/Switch Login Button */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">ช่องทางที่เข้าใช้งาน:</span>
            {loginChannel === 'E_LEAVE' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0f2a59] font-bold border border-blue-200">
                <Building2 className="w-3 h-3 text-blue-600" />
                ระบบการลา E-Leave
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                <SchoolIcon className="w-3 h-3 text-indigo-600" />
                จัดการชั้นเรียนโดยตรง
              </span>
            )}
          </div>
          <button
            onClick={() => handleSelect('school-login')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
            title="กลับไปยังหน้า Login (สลับช่องทาง E-Leave / ระบบจัดการชั้นเรียน / นักเรียน)"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>สลับบัญชี / หน้า Login</span>
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* หน้าหลัก & ลิงก์กลับระบบบริหารจัดการโรงเรียน */}
        <div className="space-y-1.5">
          <button
            onClick={() => handleSelect('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
              currentView === 'home'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Home className={`w-4 h-4 ${currentView === 'home' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>หน้าหลัก</span>
          </button>

          <a
            href="http://localhost:3001/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            title="กลับสู่ระบบบริหารจัดการโรงเรียน (School Management / E-Leave)"
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-transparent hover:from-indigo-500/20 hover:via-blue-500/20 border border-indigo-500/20 text-indigo-800 hover:text-indigo-950"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">ระบบบริหารโรงเรียน</div>
                <div className="text-[10px] text-indigo-600/80 truncate">School Management</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </a>
        </div>

        {/* หมวด: การจัดการชั้นเรียน */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-medium text-slate-400">
            การจัดการชั้นเรียน
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleSelect('class-overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'class-overview'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users
                className={`w-4 h-4 ${
                  currentView === 'class-overview' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span>ชั้นเรียนของฉัน</span>
            </button>

            <button
              onClick={() => handleSelect('exams')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'exams'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PenTool className={`w-4 h-4 ${currentView === 'exams' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>จัดการการสอบ</span>
            </button>

            <button
              onClick={() => handleSelect('assignments')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'assignments'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${currentView === 'assignments' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>จัดการงาน/การบ้าน</span>
            </button>

            <button
              onClick={() => handleSelect('readiness')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'readiness'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${currentView === 'readiness' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ความพร้อมก่อนปิดเทอม</span>
            </button>

            <button
              onClick={() => handleSelect('sar')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'sar'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet
                className={`w-4 h-4 ${
                  currentView === 'sar' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span>เทียบผลข้ามห้อง</span>
            </button>

            <button
              onClick={() => handleSelect('home-visit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'home-visit'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <HeartHandshake
                  className={`w-4 h-4 ${
                    currentView === 'home-visit' ? 'text-blue-600' : 'text-rose-500'
                  }`}
                />
                <span>เยี่ยมบ้าน นร.01 / กสศ. (CCT)</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">
                CCT
              </span>
            </button>

            <button
              onClick={() => handleSelect('student-affairs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'student-affairs'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldAlert
                  className={`w-4 h-4 ${
                    currentView === 'student-affairs'
                      ? 'text-blue-600'
                      : 'text-amber-600'
                  }`}
                />
                <span>กิจการนักเรียน & เช็คชื่อเสาธง</span>
              </span>
            </button>

            <button
              onClick={() => handleSelect('student-council')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'student-council'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Vote
                  className={`w-4 h-4 ${
                    currentView === 'student-council'
                      ? 'text-blue-600'
                      : 'text-indigo-600'
                  }`}
                />
                <span>สภานักเรียน & E-Voting</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold border border-indigo-200">
                Vote
              </span>
            </button>
          </div>
        </div>

        {/* หมวด: ข้อมูลหลัก */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-medium text-slate-400">
            ข้อมูลหลัก
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleSelect('courses')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'courses'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookMarked className={`w-4 h-4 ${currentView === 'courses' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>รายวิชา / หลักสูตร</span>
            </button>

            <button
              onClick={() => handleSelect('lessons')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'lessons'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className={`w-4 h-4 ${currentView === 'lessons' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>แผนการสอน</span>
            </button>

            <button
              onClick={() => handleSelect('roster')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'roster' || currentView === 'student'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <School
                className={`w-4 h-4 ${
                  currentView === 'roster' || currentView === 'student' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span>ห้องเรียน / นักเรียน</span>
            </button>

            <button
              onClick={() => handleSelect('timetable')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'timetable'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className={`w-4 h-4 ${currentView === 'timetable' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ตารางสอน / คาบเรียน</span>
            </button>

            <button
              onClick={() => handleSelect('academic-year')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'academic-year'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className={`w-4 h-4 ${currentView === 'academic-year' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ปีการศึกษา</span>
            </button>
          </div>
        </div>

        {/* หมวด: ระบบ */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-medium text-slate-400">
            ระบบ
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings className={`w-4 h-4 ${currentView === 'settings' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ตั้งค่า / สำรองข้อมูล</span>
            </button>

            <button
              onClick={() => handleSelect('trash')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'trash'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Trash2 className={`w-4 h-4 ${currentView === 'trash' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ถังขยะ</span>
            </button>

            {/* Portal Link to Student View */}
            <button
              onClick={() => handleSelect('student-portal')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors font-medium border border-emerald-200/50"
              title="สลับมุมมองไปยังพอร์ทัลนักเรียน ห้องเรียนผจญภัย"
            >
              <ExternalLink className="w-4 h-4 text-emerald-600" />
              <span>ลิงก์สำหรับนักเรียน</span>
            </button>

            <button
              onClick={() => handleSelect('accounts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                currentView === 'accounts'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <KeyRound className={`w-4 h-4 ${currentView === 'accounts' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>บัญชีและรหัสผ่าน</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen text-[13px] text-slate-600 font-sans select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col text-[13px] text-slate-600 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
