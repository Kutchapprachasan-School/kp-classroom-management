import React, { useState } from 'react';
import {
  Home,
  Users,
  PenTool,
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
  X,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Award,
  Vote,
  FolderOpen,
  Lock,
} from 'lucide-react';
import {
  getSchoolSettings,
  type SchoolUserRole,
} from '../../config/schoolRoles';

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
  | 'student-portal'
  | 'mobile-calendar'
  | 'mobile-all-tasks'
  | 'mobile-more';

interface TeacherSidebarProps {
  currentView: TeacherViewKey;
  onNavigate: (view: TeacherViewKey) => void;
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
  loginChannel?: 'E_LEAVE' | 'DIRECT_CLASSROOM';
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavMenuItem {
  key: TeacherViewKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeStyle?: string;
  highlightStyle?: boolean;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentView,
  onNavigate,
  activeRole = 'TEACHER_GENERAL',
  onChangeRole,
  isOpen = false,
  onClose,
}) => {
  const [showMoreOperational, setShowMoreOperational] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(
    ['settings', 'academic-year', 'accounts', 'trash'].includes(currentView)
  );

  const handleSelect = (view: TeacherViewKey) => {
    onNavigate(view);
    onClose?.();
  };

  // ============================================================================
  // 1. เมนูหน้าการใช้งานปฏิบัติงานรายวัน (Operational Workflows — แยกตาม 3 บทบาทฝั่งครู/บุคลากร)
  // ============================================================================
  const getPrimaryOperationalMenus = (): NavMenuItem[] => {
    if (activeRole === 'STUDENT_AFFAIRS') {
      return [
        {
          key: 'student-affairs',
          label: 'เช็คชื่อแถวเช้า & ใบลา',
          icon: ShieldAlert,
          badge: '07:45',
          badgeStyle: 'bg-amber-100 text-amber-800',
          highlightStyle: true,
        },
        {
          key: 'home-visit',
          label: 'เยี่ยมบ้าน นร.01 & SDQ',
          icon: HeartHandshake,
          badge: 'กสศ.',
          badgeStyle: 'bg-emerald-100 text-emerald-800',
        },
        {
          key: 'student-council',
          label: 'สภานักเรียน & เลือกตั้ง',
          icon: Vote,
          badge: 'สภาฯ',
          badgeStyle: 'bg-purple-100 text-purple-800',
        },
        {
          key: 'roster',
          label: 'ทะเบียนนักเรียน & ผู้ปกครอง',
          icon: School,
        },
        {
          key: 'home',
          label: 'สถิติการมาเรียนวันนี้',
          icon: Home,
        },
      ];
    }

    if (activeRole === 'ACADEMIC_ADMIN') {
      return [
        {
          key: 'readiness',
          label: 'ตรวจอนุมัติเกรด SGS',
          icon: CheckCircle2,
          badge: 'SGS',
          badgeStyle: 'bg-indigo-100 text-indigo-800',
          highlightStyle: true,
        },
        {
          key: 'sar',
          label: 'รายงานผลสัมฤทธิ์ (SAR)',
          icon: FileSpreadsheet,
          badge: 'SAR',
          badgeStyle: 'bg-blue-100 text-blue-800',
        },
        {
          key: 'courses',
          label: 'รายวิชา & หลักสูตร',
          icon: BookMarked,
        },
        {
          key: 'timetable',
          label: 'ตารางสอนรวมโรงเรียน',
          icon: CalendarDays,
        },
        {
          key: 'roster',
          label: 'ทะเบียนนักเรียนกลาง',
          icon: School,
        },
        {
          key: 'exams',
          label: 'จัดการสอบกลาง/ปลายภาค',
          icon: PenTool,
        },
        {
          key: 'home',
          label: 'ภาพรวมงานวิชาการ',
          icon: Home,
        },
      ];
    }

    // Default: TEACHER_GENERAL (ตรงกับแบบ Mockup เป๊ะๆ 9 รายการ)
    return [
      {
        key: 'home',
        label: 'หน้าหลัก',
        icon: Home,
      },
      {
        key: 'timetable',
        label: 'ตารางสอน',
        icon: CalendarDays,
      },
      {
        key: 'class-overview',
        label: 'เช็คชื่อ / เข้าเรียน',
        icon: CheckSquare,
      },
      {
        key: 'assignments',
        label: 'งาน/มอบหมาย',
        icon: FileText,
      },
      {
        key: 'readiness',
        label: 'ผลการเรียน',
        icon: Award,
      },
      {
        key: 'academic-year',
        label: 'ปฏิทินงาน',
        icon: Calendar,
      },
      {
        key: 'roster',
        label: 'ข้อมูลนักเรียน',
        icon: Users,
      },
      {
        key: 'sar',
        label: 'รายงาน',
        icon: FileSpreadsheet,
      },
      {
        key: 'settings',
        label: 'ตั้งค่า',
        icon: Settings,
      },
    ];
  };

  // เมนูเสริมสำหรับการปฏิบัติงาน (ไม่มีเมนูตั้งค่าระบบปะปน)
  const getSecondaryOperationalMenus = (): NavMenuItem[] => {
    if (activeRole === 'TEACHER_GENERAL') {
      return [
        { key: 'exams', label: 'ข้อสอบกลางภาค / ปลายภาค', icon: PenTool },
        { key: 'lessons', label: 'แผนการสอนของฉัน', icon: FileText },
        { key: 'timetable', label: 'ตารางสอนของฉัน', icon: CalendarDays },
        { key: 'roster', label: 'รายชื่อนักเรียนห้องที่ปรึกษา', icon: School },
      ];
    }
    if (activeRole === 'STUDENT_AFFAIRS') {
      return [
        { key: 'class-overview', label: 'ดูเวลาเรียนรายคาบ (ม.1–ม.6)', icon: Users },
        { key: 'timetable', label: 'ตารางเรียนรวมแต่ละห้อง', icon: CalendarDays },
      ];
    }
    // ACADEMIC_ADMIN
    return [
      { key: 'class-overview', label: 'ตรวจสอบสมุด ปพ.5 รายวิชา', icon: Users },
      { key: 'assignments', label: 'ติดตามการสั่งงาน/ส่งงานรวม', icon: PenTool },
      { key: 'lessons', label: 'คลังแผนการสอนทั้งโรงเรียน', icon: FileText },
      { key: 'student-affairs', label: 'สถิติเวลาเรียน & ใบลาหน้าเสาธง', icon: ShieldAlert },
    ];
  };

  const primaryMenus = getPrimaryOperationalMenus();
  const secondaryMenus = getSecondaryOperationalMenus();
  const isSettingsViewActive = [
    'settings',
    'academic-year',
    'accounts',
    'trash',
  ].includes(currentView);

  const schoolSettings = getSchoolSettings();

  const sidebarContent = (
    <>
      {/* ZONE A: ข้อมูลโรงเรียนกุดจับประชาสรรค์ */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={schoolSettings.logoUrl}
            alt={schoolSettings.nameTh}
            className="w-10 h-10 rounded-xl bg-white object-contain shadow-2xs shrink-0"
          />
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate">
              {schoolSettings.nameTh}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {schoolSettings.districtProvince || 'ต.ผาสุก อ.วังสามหมอ จ.อุดรธานี'}
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

      {/* ============================================================================
          ZONE B: หน้าการใช้งานปฏิบัติงานรายวัน (Operational Pages — ไม่มีเมนูตั้งค่าปน)
      ============================================================================ */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        <div>
          <div className="px-2.5 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {activeRole === 'STUDENT_AFFAIRS'
                ? 'หน้าใช้งาน: ฝ่ายกิจการนักเรียน'
                : activeRole === 'ACADEMIC_ADMIN'
                ? 'หน้าใช้งาน: ฝ่ายวิชาการ & ทะเบียน'
                : 'หน้าใช้งาน: งานสอนประจำวัน'}
            </span>
          </div>

          <div className="space-y-1">
            {primaryMenus.map((item) => {
              const IconComp = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0C6D5B] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeStyle || 'bg-slate-100 text-slate-700'
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

        {/* หมวดเครื่องมือปฏิบัติงานเสริมตามบทบาท (พับเก็บได้ และไม่มีการตั้งค่าปะปน) */}
        <div className="pt-2 border-t border-slate-200/70">
          <button
            onClick={() => setShowMoreOperational((prev) => !prev)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">เครื่องมือปฏิบัติงานเพิ่มเติม</span>
            </span>
            {showMoreOperational ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {showMoreOperational && (
            <div className="mt-1 space-y-0.5 pl-1 text-xs">
              {secondaryMenus.map((item) => {
                const IconComp = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              <a
                href="http://localhost:3001/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">ระบบการลาครู (E-Leave)</span>
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================================
          ZONE C: โซนการตั้งค่าระบบ (System Settings Zone — แยกขาดจากหน้าใช้งานอยู่ด้านล่างสุด)
      ============================================================================ */}
      <div className="border-t-2 border-slate-200 bg-slate-100/80 p-2.5 shrink-0 space-y-1.5">
        <button
          type="button"
          onClick={() => setShowSettingsDrawer((prev) => !prev)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            isSettingsViewActive
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Settings
              className={`w-3.5 h-3.5 shrink-0 ${
                isSettingsViewActive ? 'text-teal-400' : 'text-slate-600'
              }`}
            />
            <span className="truncate">
              {activeRole === 'ACADEMIC_ADMIN'
                ? '⚙️ การตั้งค่าระบบ & แอดมิน'
                : '⚙️ การตั้งค่า (แยกจากหน้าใช้งาน)'}
            </span>
          </span>
          {showSettingsDrawer || isSettingsViewActive ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
        </button>

        {(showSettingsDrawer || isSettingsViewActive) && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-1.5 space-y-0.5 text-xs shadow-2xs">
            {/* 1. ตั้งค่าพื้นที่จัดเก็บไฟล์ R2 / สำรองข้อมูล (ครูเห็นเฉพาะวิชาตัวเอง / วิชาการเห็นทั้ง รร.) */}
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                currentView === 'settings'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {activeRole === 'TEACHER_GENERAL'
                    ? 'ตั้งค่าวิชา & พื้นที่ R2 ของฉัน'
                    : 'พื้นที่ R2 & Google Drive 100TB'}
                </span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-bold shrink-0">
                R2
              </span>
            </button>

            {/* 2. เมนูตั้งค่าระดับโรงเรียน (เฉพาะฝ่ายวิชาการ / แอดมิน เท่านั้น) */}
            {activeRole === 'ACADEMIC_ADMIN' ? (
              <>
                <button
                  onClick={() => handleSelect('academic-year')}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    currentView === 'academic-year'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">ตั้งค่าปีการศึกษา / ภาคเรียน</span>
                </button>

                <button
                  onClick={() => handleSelect('accounts')}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    currentView === 'accounts'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">จัดการบัญชี & สิทธิ์ 5 บทบาท</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold shrink-0">
                    RBAC
                  </span>
                </button>

                <button
                  onClick={() => handleSelect('trash')}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    currentView === 'trash'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">ถังขยะและกู้คืนข้อมูลระบบ</span>
                </button>
              </>
            ) : (
              <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-1.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5 truncate">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">ตั้งค่าระบบ/สิทธิ์ผู้ใช้ (เฉพาะวิชาการ)</span>
                </span>
                {onChangeRole && (
                  <button
                    type="button"
                    onClick={() => onChangeRole('ACADEMIC_ADMIN')}
                    className="text-indigo-700 font-bold hover:underline shrink-0"
                  >
                    สลับดู
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ปุ่มสลับบัญชี / ออกจากระบบ */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <button
            onClick={() => handleSelect('student-portal')}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">พอร์ทัลนักเรียน</span>
          </button>
          <button
            onClick={() => handleSelect('school-login')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
            title="กลับหน้าเข้าสู่ระบบ รร.กุดจับประชาสรรค์"
          >
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>ออก</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen text-xs text-slate-700 font-sans select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-68 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col text-xs text-slate-700 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
