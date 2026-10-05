import React from 'react';
import {
  Home,
  CheckSquare,
  Zap,
  BarChart2,
  Award,
  LogOut,
  MapPin,
  Vote,
  FileCheck2,
  X,
  ShieldCheck,
  Megaphone,
  ClipboardCheck,
  Lock,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  KUTCHAP_SCHOOL_INFO,
  SCHOOL_ROLE_PROFILES,
  type SchoolUserRole,
} from '../../config/schoolRoles';

export type StudentTabKey =
  | 'home'
  | 'gacha'
  | 'mobile-care'
  | 'missions'
  | 'arena'
  | 'gradebook'
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
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  studentRole = 'STUDENT_GENERAL',
  onChangeStudentRole,
  onSwitchToTeacherRole,
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const activeProfile = SCHOOL_ROLE_PROFILES[studentRole];

  const handleTabClick = (tab: StudentTabKey) => {
    onSelectTab(tab);
    onClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand Header: โรงเรียนกุดจับประชาสรรค์ + Role Switcher */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-[11px] shadow-xs shrink-0 ${
                studentRole === 'STUDENT_COUNCIL' ? 'bg-purple-600' : 'bg-emerald-600'
              }`}
            >
              ก.ป.ส.
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs truncate">
                {KUTCHAP_SCHOOL_INFO.nameTh}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold truncate">
                {studentRole === 'STUDENT_COUNCIL'
                  ? 'พอร์ทัลคณะกรรมการสภานักเรียน'
                  : 'พอร์ทัลนักเรียน • สพม.อุดรธานี'}
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="ปิดเมนู"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        {/* หมวดที่ 1: เมนูสำหรับนักเรียนทุกคน */}
        <div>
          <div className="px-2.5 pb-1.5 text-[11px] font-bold text-slate-400">
            เมนูใช้งานของนักเรียน
          </div>
          <div className="space-y-1 text-xs">
            <button
              onClick={() => handleTabClick('home')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">หน้าแรกของฉัน</span>
            </button>

            <button
              onClick={() => handleTabClick('gacha')}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                activeTab === 'gacha'
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-900 font-bold border border-purple-300 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Sparkles
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'gacha' ? 'text-purple-600' : 'text-purple-400'
                  }`}
                />
                <span className="truncate font-semibold">สุ่มคู่หู (Gacha)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-black shrink-0 shadow-2xs">
                ใหม่!
              </span>
            </button>

            {/* ระบบดูแลช่วยเหลือนักเรียน (คำยางพิทยา 9 หน้าจอ Mobile First) */}
            <button
              onClick={() => handleTabClick('mobile-care')}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'mobile-care'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Smartphone
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'mobile-care' ? 'text-[#0C6D5B]' : 'text-teal-600'
                  }`}
                />
                <span className="truncate font-semibold">ดูแลนักเรียน (คำยาง 9 หน้า)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0C6D5B] text-white text-[9px] font-black shrink-0 shadow-2xs">
                9 หน้าจอ
              </span>
            </button>

            <button
              onClick={() => handleTabClick('missions')}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'missions'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <CheckSquare
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'missions' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">ส่งการบ้าน (R2 / Canva)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[9px] font-bold shrink-0">
                R2
              </span>
            </button>

            <button
              onClick={() => handleTabClick('gradebook')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'gradebook'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'gradebook' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">สมุดพกคะแนน & เวลาเรียน</span>
            </button>

            <button
              onClick={() => handleTabClick('student-leave')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'student-leave'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileCheck2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'student-leave' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">ยื่นใบลา & คะแนนความประพฤติ</span>
            </button>

            <button
              onClick={() => handleTabClick('home-visit')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home-visit'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'home-visit' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">กรอกข้อมูลเยี่ยมบ้าน นร.01</span>
            </button>

            <button
              onClick={() => handleTabClick('student-council')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'student-council'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Vote
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'student-council' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">ใช้สิทธิ์เลือกตั้ง & เสนอแนะ</span>
            </button>

            <button
              onClick={() => handleTabClick('arena')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'arena'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'arena' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">สนามท้าทายควิซ</span>
            </button>

            <button
              onClick={() => handleTabClick('trophy')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'trophy'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'trophy' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">ตู้รางวัลสะสม</span>
            </button>
          </div>
        </div>

        {/* หมวดที่ 2: โซนปฏิบัติงานคณะกรรมการสภานักเรียน (แยกสิทธิ์เฉพาะ STUDENT_COUNCIL) */}
        <div className="pt-2 border-t border-slate-200/80">
          <div className="px-2.5 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700">
              🗳️ โซนคณะกรรมการสภานักเรียน
            </span>
          </div>

          {studentRole === 'STUDENT_COUNCIL' ? (
            <div className="space-y-1 text-xs">
              <button
                onClick={() => handleTabClick('council-affairs')}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${
                  activeTab === 'council-affairs'
                    ? 'bg-purple-50 text-purple-950 font-bold border border-purple-300'
                    : 'bg-purple-50/40 text-purple-900 hover:bg-purple-100/60 font-semibold border border-purple-200/70'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ClipboardCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="truncate">ร่วมตรวจแถวเช้า (07:45)</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold shrink-0">
                  สภาฯ
                </span>
              </button>

              <button
                onClick={() => handleTabClick('student-council')}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-purple-900 hover:bg-purple-50 font-medium transition-colors"
              >
                <Megaphone className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">ตอบข้อเสนอแนะเพื่อนนักเรียน</span>
              </button>

              <button
                onClick={() => handleTabClick('student-council')}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-purple-900 hover:bg-purple-50 font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">จัดการเลือกตั้ง & กิจกรรม รร.</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>เฉพาะคณะกรรมการสภานักเรียน</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                นักเรียนทั่วไปใช้สิทธิ์โหวตและส่งเรื่องร้องเรียนได้ หากเป็นกรรมการสภาฯ กดสลับด้านบนเพื่อเปิดเมนูตรวจแถวเช้าและรับเรื่องร้องเรียน
              </p>
              {onChangeStudentRole && (
                <button
                  type="button"
                  onClick={() => onChangeStudentRole('STUDENT_COUNCIL')}
                  className="w-full py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-colors"
                >
                  ทดลองเปิดสิทธิ์สภานักเรียน
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Student Profile */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <div className="px-2 py-1.5 mb-2 rounded-xl bg-white border border-slate-200/90">
          <div className="flex items-center justify-between gap-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {activeProfile.userName}
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${activeProfile.badgeColor}`}
            >
              {activeProfile.shortLabel}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            {activeProfile.userPosition}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onSwitchToTeacherRole && (
            <button
              type="button"
              onClick={() => onSwitchToTeacherRole('TEACHER_GENERAL')}
              className="flex-1 px-2 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold transition-colors truncate"
            >
              สลับโหมดครู
            </button>
          )}
          <button
            onClick={() => {
              onLogout();
              onClose?.();
            }}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 font-semibold transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-56 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen text-xs text-slate-600 font-sans select-none">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] bg-white h-full shadow-2xl flex flex-col text-xs text-slate-600 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
