import React, { useState, useEffect } from 'react';
import { TeacherSidebar, type TeacherViewKey } from './components/layout/TeacherSidebar';
import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherGlobalDashboardView } from './views/TeacherGlobalDashboardView';
import { TeacherOverviewView } from './views/TeacherOverviewView';
import { StudentDetailView } from './views/StudentDetailView';
import { CrossClassSarView } from './views/CrossClassSarView';
import { EndTermReadinessView } from './views/EndTermReadinessView';
import { ExamManagementView } from './views/ExamManagementView';
import { AssignmentManagementView } from './views/AssignmentManagementView';
import { GradingQueueView } from './views/GradingQueueView';
import { ScoreMatrixPrapanView } from './views/ScoreMatrixPrapanView';
import { CoursesCurriculumView } from './views/CoursesCurriculumView';
import { LessonPlansView } from './views/LessonPlansView';
import { ClassroomManagementView } from './views/ClassroomManagementView';
import { StudentRosterView } from './views/StudentRosterView';
import { TimetableView } from './views/TimetableView';
import { AcademicTermsView } from './views/AcademicTermsView';
import { MessagesView } from './views/MessagesView';
import { SettingsBackupView } from './views/SettingsBackupView';
import { TrashManagementView } from './views/TrashManagementView';
import { UserAccountsView } from './views/UserAccountsView';
import { StudentPortalView } from './views/StudentPortalView';
import { SchoolPortalView, type TeacherLoginChannel } from './views/SchoolPortalView';
import { HomeVisitSdqView } from './views/HomeVisitSdqView';
import { StudentAffairsCouncilView } from './views/StudentAffairsCouncilView';
import { SchoolLeaveExecutiveDashboardView } from './views/SchoolLeaveExecutiveDashboardView';
import { MorningAssemblyView } from './views/MorningAssemblyView';
import { ClassroomAttendanceView } from './views/ClassroomAttendanceView';
import { LiveClassroomView } from './views/LiveClassroomView';
import { GoldQuestJoinView } from './views/GoldQuestJoinView';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import type { AtRiskStudent } from './types/viewModels';
import {
  Eye,
  GraduationCap,
  Home,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  CalendarDays,
  PenTool,
  LogIn,
  HeartHandshake,
  FileCheck,
  ShieldAlert,
  Vote,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Folder,
} from 'lucide-react';
import {
  TeacherMobileBottomNav,
  TeacherMobileHomeScreen,
  TeacherMobileGradingListScreen,
  TeacherMobileClassSubmissionsScreen,
  TeacherMobileSubmissionDetailScreen,
  TeacherMobileCreateAssignmentScreen,
  TeacherMobileCalendarScreen,
  TeacherMobileGradingSummaryScreen,
  TeacherMobileRoomScoresScreen,
  TeacherMobileSchoolInfoScreen,
  TeacherMobileMoreMenuScreen,
} from './components/mobile';
import { TeacherTaskDetailModal } from './components/dashboard/TeacherTaskDetailModal';
import type { DailyTodoItem } from './services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from './services/teacherCopilotService';
import type { ClassSubTab } from './views/TeacherOverviewView';
import type { QuickFilterMode } from './views/AssignmentManagementView';
import {
  getSchoolSettings,
  applySchoolBrandingAndTypography,
  fetchAndSyncSchoolSettingsFromSupabase,
  SCHOOL_ROLE_PROFILES,
  type SchoolUserRole,
} from './config/schoolRoles';
import { authService, type AuthUser } from './services/authService';
import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
} from './services/academicCalendarService';
import { AppLoadingScreen } from './components/common/AppLoadingScreen';

export const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(() => getSchoolSettings());

  useEffect(() => {
    // ค้างหน้าโหลดไว้ 1 วินาทีเต็ม (1000ms) เพื่อแสดงตราโรงเรียนอย่างสวยงาม
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  const [activeAcademicTerm, setActiveAcademicTerm] = useState(() =>
    academicCalendarService.getActiveTerm()
  );

  useEffect(() => {
    const handleCalendarUpdate = () => {
      setActiveAcademicTerm(academicCalendarService.getActiveTerm());
    };
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    return () => window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
  }, []);

  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  // Real-time synchronization for Auth session and student avatar changes
  useEffect(() => {
    const handleAuthChanged = () => {
      setCurrentAuthUser(authService.getCurrentUser());
    };
    const handleAvatarUpdated = () => {
      setCurrentAuthUser(authService.getCurrentUser());
    };
    window.addEventListener('kps-auth-changed', handleAuthChanged);
    window.addEventListener('kps-student-avatar-updated', handleAvatarUpdated);
    return () => {
      window.removeEventListener('kps-auth-changed', handleAuthChanged);
      window.removeEventListener('kps-student-avatar-updated', handleAvatarUpdated);
    };
  }, []);

  // Check if current URL is Gold Quest Join (e.g. from QR Code scan)
  const [isGoldQuestRoute, setIsGoldQuestRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    return path.includes('/gold-quest/join') || path.includes('/live-classroom/gold-quest/join');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      setIsGoldQuestRoute(
        path.includes('/gold-quest/join') || path.includes('/live-classroom/gold-quest/join')
      );
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  const [currentView, setCurrentView] = useState<TeacherViewKey>(() => {
    const user = authService.getCurrentUser();
    if (user) {
      if (user.role === 'STUDENT') return 'student-portal';
      return 'home';
    }
    return 'school-login';
  });
  const [activeRole, setActiveRole] = useState<SchoolUserRole>(() => {
    const user = authService.getCurrentUser();
    if (user) {
      if (user.role === 'STUDENT') return 'STUDENT_GENERAL';
      if (user.role === 'ADMIN') return 'ACADEMIC_ADMIN';
      if (user.position?.includes('กิจการ')) return 'STUDENT_AFFAIRS';
      return 'TEACHER_GENERAL';
    }
    return 'TEACHER_GENERAL';
  });
  const [loginChannel, setLoginChannel] = useState<TeacherLoginChannel>('E_LEAVE');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kp_teacher_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickBarOpen, setIsQuickBarOpen] = useState(false);
  const [isDevToolbarVisible, setIsDevToolbarVisible] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<DailyTodoItem | null>(null);
  const [selectedClassroomIdForRoster, setSelectedClassroomIdForRoster] = useState<string | undefined>(undefined);

  // Toggle sidebar for both mobile drawer and desktop collapsible panel
  const handleToggleSidebar = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarOpen((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem('kp_teacher_sidebar_open', String(next));
        } catch {
          // ignore storage error
        }
        return next;
      });
    }
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

  React.useEffect(() => {
    applySchoolBrandingAndTypography(schoolSettings);
  }, [schoolSettings]);

  React.useEffect(() => {
    // ซิงค์ข้อมูลโรงเรียนและโลโก้ล่าสุดจาก Supabase เพื่อให้ตรงกันทุกเครื่อง (รันครั้งเดียวเมื่อเริ่มต้นระบบ)
    fetchAndSyncSchoolSettingsFromSupabase().catch(() => {});

    const handleSettingsChange = () => {
      const next = getSchoolSettings();
      setSchoolSettings((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
        return next;
      });
    };
    window.addEventListener('kps-school-settings-updated', handleSettingsChange);
    window.addEventListener('kps-cloud-synced', handleSettingsChange);
    window.addEventListener('kps-cloud-key-updated', handleSettingsChange);
    return () => {
      window.removeEventListener('kps-school-settings-updated', handleSettingsChange);
      window.removeEventListener('kps-cloud-synced', handleSettingsChange);
      window.removeEventListener('kps-cloud-key-updated', handleSettingsChange);
    };
  }, []);

  // Normalize legacy admin-dashboard view to home
  useEffect(() => {
    if ((currentView as string) === 'admin-dashboard') {
      setCurrentView('home');
    }
  }, [currentView]);

  // =========================================================================
  // STRICT SECURITY GUARD: Authentication & Role-Based Access Control (RBAC)
  // ป้องกันนักเรียนหลุดเข้าหน้าแอดมิน/ครู และบังคับหน้า Login เมื่อหมดอายุเซสชัน
  // =========================================================================
  useEffect(() => {
    // 1. กรณีไม่ได้เข้าสู่ระบบ (Unauthenticated) -> ต้องอยู่ที่ school-login เท่านั้น
    if (!currentAuthUser) {
      if (currentView !== 'school-login') {
        console.warn('[Security Guard] ตรวจพบการพยายามเข้าถึงโดยไม่ได้เข้าสู่ระบบ บังคับกลับหน้า Login');
        setCurrentView('school-login');
      }
      return;
    }

    // 2. กรณีนิสิต/นักเรียน (STUDENT) -> ต้องอยู่เฉพาะในพอร์ทัลนักเรียน (student-portal) เท่านั้น
    if (currentAuthUser.role === 'STUDENT') {
      if (currentView !== 'student-portal') {
        console.warn(
          `[Security Guard] ป้องกันสิทธิ์: นักเรียน ${currentAuthUser.name} (${currentAuthUser.studentCode}) ไม่ได้รับอนุญาตให้เข้าหน้า "${currentView}". บังคับกลับ student-portal`
        );
        setCurrentView('student-portal');
      }
      // บังคับบทบาทนักเรียนให้เป็น STUDENT_GENERAL หรือ STUDENT_COUNCIL เท่านั้น
      if (activeRole !== 'STUDENT_GENERAL' && activeRole !== 'STUDENT_COUNCIL') {
        setActiveRole(
          currentAuthUser.studentCode?.startsWith('42') ? 'STUDENT_COUNCIL' : 'STUDENT_GENERAL'
        );
      }
      return;
    }

    // 3. กรณีครู / แอดมิน (TEACHER / ADMIN)
    if (currentAuthUser.role === 'TEACHER' || currentAuthUser.role === 'ADMIN') {
      // หากเข้าสู่ระบบแล้ว ห้ามค้างอยู่ที่หน้า school-login
      if (currentView === 'school-login') {
        const defaultTarget = (SCHOOL_ROLE_PROFILES[activeRole]?.defaultView as TeacherViewKey) || 'home';
        setCurrentView(defaultTarget);
      }
      // ครูทั่วไปที่ไม่ใช่ ADMIN ห้ามเข้าถึงหน้าจัดการสิทธิ์บัญชี (accounts)
      if (currentAuthUser.role !== 'ADMIN' && activeRole !== 'ACADEMIC_ADMIN' && currentView === 'accounts') {
        console.warn('[Security Guard] เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้าจัดการสิทธิ์ได้');
        setCurrentView('home');
      }
    }
  }, [currentAuthUser, currentView, activeRole]);

  // Context-Aware Deep-Link Navigation States
  const [deepLinkClassTab, setDeepLinkClassTab] = useState<ClassSubTab>('grades');
  const [deepLinkAffairsTab, setDeepLinkAffairsTab] = useState<
    'ASSEMBLY' | 'DISCIPLINE' | 'STUDENT_LEAVE'
  >('ASSEMBLY');
  const [deepLinkGradesFilter, setDeepLinkGradesFilter] = useState<'ALL' | 'AT_RISK'>('ALL');
  const [deepLinkAssignmentFilter, setDeepLinkAssignmentFilter] =
    useState<QuickFilterMode>('ALL');
  const [deepLinkBanner, setDeepLinkBanner] = useState<string | null>(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'OVERVIEW' | 'CALENDAR' | 'BRANDING' | 'STORAGE' | 'BANNERS' | undefined
  >(undefined);

  const handleChangeRole = (nextRole: SchoolUserRole) => {
    // SECURITY GUARD: นักเรียนไม่สามารถยกตนเองขึ้นเป็นครูหรือแอดมินได้เป็นอันขาด!
    if (currentAuthUser?.role === 'STUDENT') {
      if (nextRole === 'STUDENT_GENERAL' || nextRole === 'STUDENT_COUNCIL') {
        setActiveRole(nextRole);
      } else {
        console.warn(`[Security Guard] ปฏิเสธการสลับสิทธิ์: นักเรียนไม่สามารถปรับบทบาทเป็น ${nextRole} ได้`);
      }
      return;
    }

    setActiveRole(nextRole);
    if (nextRole === 'STUDENT_GENERAL' || nextRole === 'STUDENT_COUNCIL') {
      setCurrentView('student-portal');
      return;
    }

    if (nextRole === 'ACADEMIC_ADMIN') {
      if (
        currentView === 'student-portal' ||
        currentView === 'school-login' ||
        (currentView as string) === 'admin-dashboard'
      ) {
        setCurrentView('home');
      }
      return;
    }

    const defaultTarget = SCHOOL_ROLE_PROFILES[nextRole].defaultView as TeacherViewKey;
    if (
      currentView === 'student-portal' ||
      currentView === 'school-login' ||
      (currentView as string) === 'admin-dashboard'
    ) {
      setCurrentView(defaultTarget);
      return;
    }

    // หากสลับออกจากฝ่ายวิชาการขณะที่เปิดหน้าตั้งค่าระบบเฉพาะแอดมิน ให้พากลับหน้าหลักของบทบาทนั้น
    if (['academic-year', 'accounts', 'trash'].includes(currentView)) {
      setCurrentView(defaultTarget);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentAuthUser(null);
    setCurrentView('school-login');
  };

  const handleDeepNavigate = (payload: CrossViewNavigationPayload) => {
    // SECURITY GUARD: นักเรียนไม่สามารถกระโดดข้ามหน้าไปยังหน้าครูได้
    if (currentAuthUser?.role === 'STUDENT') {
      console.warn('[Security Guard] ระงับการ Deep Navigate ของนักเรียนไปยังมุมมองครู');
      return;
    }

    if (payload.classSubTab) {
      setDeepLinkClassTab(payload.classSubTab);
    }
    if (payload.affairsSubTab) {
      setDeepLinkAffairsTab(payload.affairsSubTab);
    }
    if (payload.gradesQuickFilter) {
      setDeepLinkGradesFilter(payload.gradesQuickFilter);
    }
    if (payload.assignmentQuickFilter) {
      setDeepLinkAssignmentFilter(payload.assignmentQuickFilter);
    }
    setDeepLinkBanner(payload.highlightBanner || null);
    if (payload.view === 'settings') {
      setSettingsInitialTab(payload.settingsTab as any || undefined);
    }
    setCurrentView(payload.view as TeacherViewKey);
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home':
      case 'admin-dashboard' as any:
        return 'หน้าแรก';
      case 'live-classroom':
        return 'สอน (Live Classroom Companion)';
      case 'school-leave-dashboard':
        return `แดชบอร์ดบริหารระบบการลา • ${schoolSettings.nameTh}`;
      case 'class-overview':
        return 'คะแนนนักเรียน (ปพ.5)';
      case 'morning-assembly':
        return 'เช็คแถวเช้า (Morning Assembly)';
      case 'classroom-attendance':
        return 'เช็คชื่อเข้าเรียน (Classroom Attendance)';
      case 'exams':
        return 'จัดการสอบ/เก็บคะแนน (Exam Management)';
      case 'grading-queue':
        return 'คิวตรวจงานนักเรียน (SpeedGrader)';
      case 'assignments':
        return 'การสั่งงานและมอบหมายภาระงาน';
      case 'score-matrix':
        return 'สมุดบันทึกคะแนน ปพ.5 (Gradebook Matrix)';
      case 'readiness':
        return 'ส่งเกรด SGS';
      case 'sar':
        return 'สรุปผลการเรียน';
      case 'home-visit':
        return 'เยี่ยมบ้าน นร.01';
      case 'student-affairs':
        return 'เช็คชื่อแถวเช้า';
      case 'student-council':
        return 'สภานักเรียน';
      case 'courses':
        return 'หลักสูตร (Curriculum)';
      case 'lessons':
        return 'แผนการสอน (Lesson Plans)';
      case 'classrooms':
        return 'จัดการห้องเรียน (Classrooms)';
      case 'roster':
        return 'จัดการนักเรียน / นักเรียน (Student Roster)';
      case 'student':
        return 'ข้อมูลนักเรียน';
      case 'timetable':
        return 'ตารางสอน';
      case 'academic-year':
        return 'ปฏิทินกิจกรรมโรงเรียน';
      case 'messages':
        return 'ระบบข้อความ & แชทกลุ่มห้องเรียน';
      case 'settings':
        return 'ตั้งค่า & พื้นที่ R2';
      case 'trash':
        return 'ถังขยะ';
      case 'accounts':
        return 'จัดการสิทธิ์ 5 บทบาท';
      case 'mobile-calendar':
        return 'ปฏิทินงาน';
      case 'mobile-all-tasks':
        return 'งานทั้งหมด';
      case 'mobile-more':
        return 'เมนู & บัญชี';
      case 'mobile-grading-list':
        return 'ตรวจงานนักเรียน';
      case 'mobile-class-submissions':
        return 'ห้อง ม.3/1 รายชื่อนักเรียน & ตรวจงานห้อง';
      case 'mobile-submission-detail':
        return 'รายละเอียดงานนักเรียน';
      case 'mobile-create-assignment':
        return 'มอบหมายงานใหม่';
      case 'mobile-grading-summary':
        return 'สรุปการตรวจงาน';
      case 'mobile-room-scores':
        return 'คะแนนรายห้องเรียน';
      case 'mobile-school-info':
        return 'ข้อมูลโรงเรียน';
      default:
        return `${schoolSettings.classroomSystemTitle} • ${schoolSettings.nameTh}`;
    }
  };

  const handleSelectStudent = (_student: AtRiskStudent) => {
    setCurrentView('student');
  };

  const handleBack = () => {
    if (currentAuthUser?.role === 'STUDENT') {
      setCurrentView('student-portal');
      return;
    }
    if (currentView === 'mobile-submission-detail') {
      setCurrentView('mobile-class-submissions');
    } else if (currentView === 'mobile-class-submissions') {
      setCurrentView('mobile-grading-list');
    } else if (
      currentView === 'mobile-grading-list' ||
      currentView === 'mobile-create-assignment' ||
      currentView === 'mobile-grading-summary' ||
      currentView === 'mobile-room-scores' ||
      currentView === 'mobile-school-info' ||
      currentView === 'mobile-calendar' ||
      currentView === 'mobile-more'
    ) {
      setCurrentView('home');
    } else if (currentView !== 'home') {
      setCurrentView('home');
    }
  };

  if (!isAppReady) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* Top Bar: Dev Tools & 5-Role Switcher (Hidden by default to save vertical space for teachers) */}
      {isDevToolbarVisible && (
        <div className="bg-slate-900 text-slate-200 px-3.5 sm:px-6 py-1.5 text-xs border-b border-slate-800 z-40 select-none animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-bold text-teal-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {schoolSettings.classroomSystemTitle} • {schoolSettings.nameTh}
                </span>
              </span>

              <button
                onClick={() => setIsQuickBarOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 font-medium text-slate-300 hover:text-white transition-colors py-0.5"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                  {isQuickBarOpen ? 'ซ่อนทางลัด' : 'ทางลัด 12 หน้าจอ'}
                  {isQuickBarOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </button>
            </div>

            {/* 5-Role Quick Switcher Bar */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-400 mr-1 hidden md:inline">
                สลับสิทธิ์ 5 บทบาท:
              </span>
              <button
                onClick={() => setCurrentView('school-login')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  currentView === 'school-login'
                    ? 'bg-slate-700 text-white border border-slate-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                หน้า Login
              </button>
              <button
                onClick={() => handleChangeRole('TEACHER_GENERAL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  currentView !== 'school-login' &&
                  currentView !== 'student-portal' &&
                  activeRole === 'TEACHER_GENERAL'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. ครูทั่วไป
              </button>
              <button
                onClick={() => handleChangeRole('STUDENT_AFFAIRS')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  currentView !== 'school-login' &&
                  currentView !== 'student-portal' &&
                  activeRole === 'STUDENT_AFFAIRS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                2. ฝ่ายกิจการ
              </button>
              <button
                onClick={() => {
                  handleChangeRole('ACADEMIC_ADMIN');
                  setCurrentView('home');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  currentView !== 'school-login' &&
                  currentView !== 'student-portal' &&
                  activeRole === 'ACADEMIC_ADMIN'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                3. ผู้บริหาร/แอดมิน
              </button>
              <button
                onClick={() => handleChangeRole('STUDENT_GENERAL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  currentView === 'student-portal' && activeRole === 'STUDENT_GENERAL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                4. นักเรียน
              </button>
              <button
                onClick={() => handleChangeRole('STUDENT_COUNCIL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  currentView === 'student-portal' && activeRole === 'STUDENT_COUNCIL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                5. สภานักเรียน
              </button>

              <button
                type="button"
                onClick={() => setIsDevToolbarVisible(false)}
                className="ml-2 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] border border-slate-700"
                title="ซ่อนแถบทดสอบ"
              >
                ✕ ซ่อน
              </button>
            </div>
          </div>

          {isQuickBarOpen && (
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-slate-800">
              {[
                { key: 'school-login', label: 'หน้า Login', icon: LogIn },
                { key: 'school-leave-dashboard', label: '★ Dashboard ระบบการลา', icon: FileCheck },
                { key: 'home', label: '1. หน้าหลักครู', icon: Home },
                { key: 'class-overview', label: '2. คะแนนนักเรียน (ปพ.5)', icon: Users },
                { key: 'home-visit', label: '3. เยี่ยมบ้าน นร.01 (CCT)', icon: HeartHandshake },
                { key: 'student-affairs', label: '4. กิจการนักเรียน & ใบลา', icon: ShieldAlert },
                { key: 'student-council', label: '5. สภานักเรียน E-Voting', icon: Vote },
                { key: 'readiness', label: '6. ความพร้อมก่อนปิดเทอม', icon: CheckCircle2 },
                { key: 'student', label: '7. วิเคราะห์รายคน', icon: UserCheck },
                { key: 'sar', label: '8. เทียบผลข้ามห้อง (SAR)', icon: FileSpreadsheet },
                { key: 'timetable', label: '9. ตารางสอน/วันนี้', icon: CalendarDays },
                { key: 'courses', label: 'หลักสูตร/แผนการสอน', icon: Folder },
                { key: 'exams', label: '10. จัดการสอบ/เก็บคะแนน', icon: PenTool },
                { key: 'student-portal', label: '11. พอร์ทัลนักเรียน', icon: GraduationCap },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentView(item.key as TeacherViewKey);
                      setIsQuickBarOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <IconComp className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* Gold Quest Live Classroom Student Join Screen */}
      {isGoldQuestRoute ? (
        <GoldQuestJoinView />
      ) : currentView === 'school-login' ? (
        <SchoolPortalView
          onEnterClassroomPortal={(target, channel, role) => {
            if (channel) {
              setLoginChannel(channel);
            }
            if (role) {
              setActiveRole(role);
            }
            setCurrentAuthUser(authService.getCurrentUser());
            setCurrentView((target as TeacherViewKey) || 'home');
          }}
          onEnterStudentPortal={(stuRole) => {
            setActiveRole(stuRole || 'STUDENT_GENERAL');
            setCurrentAuthUser(authService.getCurrentUser());
            setCurrentView('student-portal');
          }}
        />
      ) : currentView === 'student-portal' ? (
        <StudentPortalView
          studentRole={
            activeRole === 'STUDENT_COUNCIL' ? 'STUDENT_COUNCIL' : 'STUDENT_GENERAL'
          }
          activeRole={activeRole}
          currentUser={currentAuthUser}
          schoolSettings={schoolSettings}
          onChangeStudentRole={(stuRole) => setActiveRole(stuRole)}
          onExit={handleLogout}
        />
      ) : currentView === 'school-leave-dashboard' ? (
        <SchoolLeaveExecutiveDashboardView
          activeRole={activeRole}
          onChangeRole={handleChangeRole}
          onNavigateToView={(viewKey) => {
            setCurrentView(viewKey as TeacherViewKey);
          }}
          onLogout={handleLogout}
          currentUser={currentAuthUser}
          schoolSettings={schoolSettings}
        />
      ) : (
        /* Teacher Mode Layout */
        <div className="flex flex-1 min-h-0">
          {/* Left Teacher Navigation Sidebar (Separated Operational vs System Settings + 5 Roles) */}
          <TeacherSidebar
            currentView={currentView}
            activeRole={activeRole}
            onChangeRole={handleChangeRole}
            loginChannel={loginChannel}
            onNavigate={(view) => {
              if (view === 'school-login') {
                handleLogout();
              } else {
                if (view === 'settings') {
                  setSettingsInitialTab(undefined);
                }
                if (view === 'class-overview') {
                  setDeepLinkClassTab('grades');
                }
                setCurrentView(view);
              }
            }}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            isCollapsed={!isDesktopSidebarOpen}
            onToggleCollapse={handleToggleSidebar}
          />

          {/* Right Main Working Area */}
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            {/* Topbar */}
            <TeacherHeader
              title={getHeaderTitle()}
              onBack={currentView !== 'home' ? handleBack : undefined}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
              isSidebarOpen={isDesktopSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              termLabel={`${activeAcademicTerm.termName}/${activeAcademicTerm.year}`}
              activeRole={activeRole}
              onChangeRole={handleChangeRole}
              currentUser={currentAuthUser}
              onLogout={handleLogout}
              onDeepNavigate={handleDeepNavigate}
            />

            {/* Dynamic View Body */}
            <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden">
              {(currentView === 'home' || (currentView as string) === 'admin-dashboard') && (
                <TeacherGlobalDashboardView
                  activeRole={activeRole}
                  onNavigateToClass={() => setCurrentView('class-overview')}
                  onNavigateToAttendance={() => {
                    setCurrentView('classroom-attendance');
                  }}
                  onNavigateToReadiness={() => setCurrentView('readiness')}
                  onNavigateToAcademicYear={() => setCurrentView('academic-year')}
                  onNavigateToCourses={() => setCurrentView('courses')}
                  onNavigateToLessons={() => setCurrentView('lessons')}
                  onNavigateToMorningAssembly={() => setCurrentView('morning-assembly')}
                  onDeepNavigate={handleDeepNavigate}
                  currentUser={currentAuthUser}
                />
              )}

              {currentView === 'mobile-home' && (
                <TeacherMobileHomeScreen
                  onNavigate={(v) => setCurrentView(v)}
                  teacherName={currentAuthUser?.name || 'ครูผู้สอน'}
                  department={
                    currentAuthUser?.subjectGroup
                      ? `กลุ่มสาระฯ${currentAuthUser.subjectGroup}`
                      : currentAuthUser?.position || 'ครูผู้สอน'
                  }
                  avatarUrl={currentAuthUser?.avatarUrl}
                />
              )}

              {currentView === 'live-classroom' && (
                <LiveClassroomView initialClassroomId={selectedClassroomIdForRoster} />
              )}

              {currentView === 'class-overview' && (
                <TeacherOverviewView
                  onSelectStudent={handleSelectStudent}
                  onViewFullTable={() => setCurrentView('sar')}
                  onSwitchToAdventure={() => setCurrentView('student-portal')}
                  initialTab={deepLinkClassTab}
                  initialGradesFilter={deepLinkGradesFilter}
                  initialAssignmentFilter={deepLinkAssignmentFilter}
                  initialHighlightBanner={deepLinkBanner}
                  onDeepNavigate={handleDeepNavigate}
                />
              )}

              {currentView === 'morning-assembly' && (
                <MorningAssemblyView onDeepNavigate={handleDeepNavigate} />
              )}

              {currentView === 'classroom-attendance' && (
                <ClassroomAttendanceView onDeepNavigate={handleDeepNavigate} />
              )}

              {currentView === 'exams' && <ExamManagementView />}

              {currentView === 'grading-queue' && (
                <GradingQueueView
                  onNavigate={(view) => setCurrentView(view)}
                />
              )}

              {currentView === 'assignments' && (
                <AssignmentManagementView
                  initialQuickFilter={deepLinkAssignmentFilter}
                  initialHighlightBanner={deepLinkBanner}
                  onNavigate={(view) => setCurrentView(view)}
                />
              )}

              {currentView === 'score-matrix' && (
                <ScoreMatrixPrapanView
                  onNavigate={(view) => setCurrentView(view)}
                />
              )}

              {currentView === 'readiness' && (
                <EndTermReadinessView
                  onNavigateToAssignments={() => setCurrentView('assignments')}
                />
              )}

              {currentView === 'sar' && (
                <CrossClassSarView
                  activeRole={activeRole}
                  onChangeRole={handleChangeRole}
                />
              )}

              {currentView === 'home-visit' && <HomeVisitSdqView />}

              {currentView === 'student-affairs' && (
                <StudentAffairsCouncilView
                  key="affairs"
                  initialSection="AFFAIRS"
                  initialAffairsTab={deepLinkAffairsTab}
                  initialHighlightBanner={deepLinkBanner}
                  onOpenHomeVisit={() => setCurrentView('home-visit')}
                  onDeepNavigate={handleDeepNavigate}
                />
              )}

              {currentView === 'student-council' && (
                <StudentAffairsCouncilView
                  key="council"
                  initialSection="COUNCIL"
                  onOpenHomeVisit={() => setCurrentView('home-visit')}
                  onDeepNavigate={handleDeepNavigate}
                />
              )}

              {currentView === 'courses' && (
                <CoursesCurriculumView onDeepNavigate={handleDeepNavigate} />
              )}

              {currentView === 'lessons' && <LessonPlansView />}

              {currentView === 'classrooms' && (
                <ClassroomManagementView
                  activeRole={activeRole}
                  onManageStudents={(room) => {
                    setSelectedClassroomIdForRoster(room.id);
                    setCurrentView('roster');
                  }}
                />
              )}

              {currentView === 'roster' && (
                <StudentRosterView
                  initialClassroomId={selectedClassroomIdForRoster}
                  activeRole={activeRole}
                  onSelectStudent={handleSelectStudent}
                  onBackToClassrooms={() => setCurrentView('classrooms')}
                />
              )}

              {currentView === 'student' && (
                <StudentDetailView
                  onOpenHomeVisit={() => setCurrentView('home-visit')}
                  onBack={() => setCurrentView('roster')}
                />
              )}

              {currentView === 'timetable' && (
                <TimetableView
                  onDeepNavigate={handleDeepNavigate}
                  onNavigateToAssignments={() => setCurrentView('assignments')}
                  onNavigateToCalendar={() => setCurrentView('academic-year')}
                />
              )}

              {currentView === 'academic-year' && (
                <AcademicTermsView
                  onNavigateToSettings={() => {
                    setSettingsInitialTab('CALENDAR');
                    setCurrentView('settings');
                  }}
                  onNavigateToExams={() => setCurrentView('exams')}
                />
              )}

              {currentView === 'messages' && (
                <MessagesView activeRole={activeRole} currentUser={currentAuthUser} />
              )}

              {currentView === 'settings' && (
                <SettingsBackupView
                  activeRole={activeRole}
                  initialTab={settingsInitialTab}
                />
              )}

              {currentView === 'trash' && <TrashManagementView />}

               {currentView === 'accounts' && (
                <UserAccountsView
                  activeRole={activeRole}
                  onChangeRole={handleChangeRole}
                />
              )}

              {currentView === 'mobile-calendar' && (
                <TeacherMobileCalendarScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-all-tasks' && (
                <TeacherMobileGradingListScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-grading-list' && (
                <TeacherMobileGradingListScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-class-submissions' && (
                <TeacherMobileClassSubmissionsScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-submission-detail' && (
                <TeacherMobileSubmissionDetailScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-create-assignment' && (
                <TeacherMobileCreateAssignmentScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-grading-summary' && (
                <TeacherMobileGradingSummaryScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-room-scores' && (
                <TeacherMobileRoomScoresScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-school-info' && (
                <TeacherMobileSchoolInfoScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onBack={handleBack}
                />
              )}

              {currentView === 'mobile-more' && (
                <TeacherMobileMoreMenuScreen
                  onNavigate={(v) => setCurrentView(v)}
                  onLogout={handleLogout}
                  teacherName={currentAuthUser?.name || 'ครูผู้สอน'}
                  department={
                    currentAuthUser?.subjectGroup
                      ? `กลุ่มสาระฯ${currentAuthUser.subjectGroup}`
                      : currentAuthUser?.position || 'ครูผู้สอน'
                  }
                  avatarUrl={currentAuthUser?.avatarUrl}
                />
              )}
            </main>

            {/* Mobile Bottom Navigation Bar (ตรงตาม Mockup Image: 5 ปุ่ม หน้าหลัก | งาน | (+) มอบหมายงาน | ข้อความ | เพิ่มเติม) */}
            <TeacherMobileBottomNav
              currentView={currentView}
              onNavigate={(v) => setCurrentView(v)}
            />

            {/* Task Detail Modal (เปิดเมื่อครูกดการ์ดงานจากหน้าปฏิทิน หรือหน้ารวมงาน) */}
            <TeacherTaskDetailModal
              task={selectedTaskForModal}
              isOpen={Boolean(selectedTaskForModal)}
              onClose={() => setSelectedTaskForModal(null)}
              onActionClick={handleDeepNavigate}
            />
          </div>
        </div>
      )}

      {/* Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUser={currentAuthUser}
        onSelectAction={(view) => {
          if (currentAuthUser?.role === 'STUDENT') {
            setCurrentView('student-portal');
            return;
          }
          if (view === 'overview') setCurrentView('class-overview');
          else if (view === 'student') setCurrentView('student');
          else if (view === 'sar') setCurrentView('sar');
          else if (view === 'student-portal') setCurrentView('student-portal');
        }}
      />

      {/* PWA Install Prompt for Mobile and Desktop Browser */}
      <PwaInstallPrompt />
    </div>
  );
};

export default App;
