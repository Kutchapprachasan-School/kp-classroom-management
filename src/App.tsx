import React, { useState } from 'react';
import { TeacherSidebar, type TeacherViewKey } from './components/layout/TeacherSidebar';
import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherGlobalDashboardView } from './views/TeacherGlobalDashboardView';
import { TeacherOverviewView } from './views/TeacherOverviewView';
import { StudentDetailView } from './views/StudentDetailView';
import { CrossClassSarView } from './views/CrossClassSarView';
import { EndTermReadinessView } from './views/EndTermReadinessView';
import { ExamManagementView } from './views/ExamManagementView';
import { AssignmentManagementView } from './views/AssignmentManagementView';
import { CoursesCurriculumView } from './views/CoursesCurriculumView';
import { LessonPlansView } from './views/LessonPlansView';
import { ClassroomsRosterView } from './views/ClassroomsRosterView';
import { TimetableView } from './views/TimetableView';
import { AcademicTermsView } from './views/AcademicTermsView';
import { SettingsBackupView } from './views/SettingsBackupView';
import { TrashManagementView } from './views/TrashManagementView';
import { UserAccountsView } from './views/UserAccountsView';
import { StudentPortalView } from './views/StudentPortalView';
import { SchoolPortalView, type TeacherLoginChannel } from './views/SchoolPortalView';
import { HomeVisitSdqView } from './views/HomeVisitSdqView';
import { StudentAffairsCouncilView } from './views/StudentAffairsCouncilView';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import type { AtRiskStudent } from './types/viewModels';
import {
  Eye,
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  CalendarDays,
  PenTool,
  LogIn,
  HeartHandshake,
  ShieldAlert,
  Vote,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<TeacherViewKey>('school-login');
  const [loginChannel, setLoginChannel] = useState<TeacherLoginChannel>('E_LEAVE');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickBarOpen, setIsQuickBarOpen] = useState(false);

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home':
        return 'หน้าหลัก';
      case 'class-overview':
        return 'ศ23101 ศิลปะ — ม.3/1';
      case 'exams':
        return 'จัดการการสอบ';
      case 'assignments':
        return 'จัดการงาน/การบ้าน';
      case 'readiness':
        return 'ความพร้อมก่อนปิดเทอม';
      case 'sar':
        return 'เทียบผลข้ามห้อง';
      case 'home-visit':
        return 'เยี่ยมบ้านนักเรียน (แบบ นร./กสศ.01) & โอนข้อมูลเข้า CCT (cct.eef.or.th)';
      case 'student-affairs':
        return 'ระบบบริหารงานกิจการนักเรียน (เช็คชื่อเสาธง / วินัย / ใบลานักเรียน)';
      case 'student-council':
        return 'ระบบสภานักเรียน & เลือกตั้งออนไลน์ (E-Voting)';
      case 'courses':
        return 'รายวิชา / หลักสูตร';
      case 'lessons':
        return 'แผนการสอน';
      case 'roster':
        return 'ห้องเรียน / รายชื่อนักเรียน';
      case 'student':
        return 'ด.ช. ทัตธน คำฝั้น (วิเคราะห์รายคน)';
      case 'timetable':
        return 'ตารางสอน / คาบเรียน';
      case 'academic-year':
        return 'ปีการศึกษาและภาคเรียน';
      case 'settings':
        return 'ตั้งค่า / สำรองข้อมูล';
      case 'trash':
        return 'ถังขยะ (รายการที่ถูกลบ)';
      case 'accounts':
        return 'บัญชีผู้ใช้และสิทธิ์การเข้าถึง';
      default:
        return 'ระบบจัดการชั้นเรียน';
    }
  };

  const handleSelectStudent = (_student: AtRiskStudent) => {
    setCurrentView('student');
  };

  const handleBack = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* Prototype Quick-Switcher Bar (Collapsible on Mobile so it doesn't clutter the screen) */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-1.5 text-xs shadow-md z-40 select-none">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIsQuickBarOpen((prev) => !prev)}
            className="flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition-colors py-0.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>สลับดูหน้าจอ (Prototype):</span>
            <span className="lg:hidden inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
              {isQuickBarOpen ? 'ซ่อนเมนู' : 'แตะเพื่อเปิด'}
              {isQuickBarOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>

          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={() => setCurrentView('school-login')}
              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
            >
              หน้า Login
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold"
            >
              หน้าครู
            </button>
            <button
              onClick={() => setCurrentView('student-portal')}
              className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold"
            >
              หน้านักเรียน
            </button>
          </div>
        </div>

        <div
          className={`${
            isQuickBarOpen ? 'flex mt-2 pt-2 border-t border-slate-800' : 'hidden lg:flex mt-1'
          } items-center gap-1.5 flex-wrap`}
        >
          <button
            onClick={() => {
              setCurrentView('school-login');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              currentView === 'school-login'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
            }`}
          >
            <LogIn className="w-3 h-3" />
            <span>🔐 หน้า Login (ครู 2 ช่องทาง / นักเรียน)</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('home');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'home'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>1. หน้าหลัก (จัดการชั้นเรียน)</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('class-overview');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'class-overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>2. ชั้นเรียน (ภาพรวม / เช็คชื่อ / งาน)</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('home-visit');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              currentView === 'home-visit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700 border border-rose-500/30'
            }`}
          >
            <HeartHandshake className="w-3 h-3" />
            <span>🏡 เยี่ยมบ้าน นร.01 / CCT กสศ.</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('student-affairs');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              currentView === 'student-affairs'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>🛡️ กิจการนักเรียน & เช็คชื่อเสาธง</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('student-council');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              currentView === 'student-council'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/30'
            }`}
          >
            <Vote className="w-3 h-3" />
            <span>🗳️ สภานักเรียน & E-Voting</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('readiness');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'readiness'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>3. ความพร้อมก่อนปิดเทอม</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('student');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'student'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>4. วิเคราะห์รายคน (Radar Chart)</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('sar');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'sar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>5. เทียบผลข้ามห้อง (SAR/PA)</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('timetable');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'timetable'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            <span>ตารางสอน</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('exams');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'exams'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>สอบ/งาน</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('student-portal');
              setIsQuickBarOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'student-portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>6. พอร์ทัลนักเรียน (โหวตสภา / ใบลา / เยี่ยมบ้าน)</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering: Direct Login Screen vs Student Portal vs Classroom Management */}
      {currentView === 'school-login' ? (
        <SchoolPortalView
          onEnterClassroomPortal={(target, channel) => {
            if (channel) {
              setLoginChannel(channel);
            }
            setCurrentView((target as TeacherViewKey) || 'home');
          }}
          onEnterStudentPortal={() => setCurrentView('student-portal')}
        />
      ) : currentView === 'student-portal' ? (
        <StudentPortalView onExit={() => setCurrentView('school-login')} />
      ) : (
        /* Teacher Mode Layout */
        <div className="flex flex-1 min-h-0">
          {/* Left Teacher Navigation Sidebar (Desktop permanent + Mobile slide-over drawer) */}
          <TeacherSidebar
            currentView={currentView}
            loginChannel={loginChannel}
            onNavigate={(view) => setCurrentView(view)}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Right Main Working Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar */}
            <TeacherHeader
              title={getHeaderTitle()}
              onBack={currentView !== 'home' ? handleBack : undefined}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
              termLabel="ภาคเรียนที่ 1/2569"
            />

            {/* Dynamic View Body */}
            <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden">
              {currentView === 'home' && (
                <TeacherGlobalDashboardView
                  onNavigateToClass={() => setCurrentView('class-overview')}
                  onNavigateToAttendance={() => setCurrentView('class-overview')}
                  onNavigateToReadiness={() => setCurrentView('readiness')}
                  onNavigateToAcademicYear={() => setCurrentView('academic-year')}
                  onNavigateToCourses={() => setCurrentView('courses')}
                />
              )}

              {currentView === 'class-overview' && (
                <TeacherOverviewView
                  onSelectStudent={handleSelectStudent}
                  onViewFullTable={() =>
                    alert('เปิดตารางคะแนนเต็มของวิชา ศ23101 ศิลปะ ม.3/1')
                  }
                  onSwitchToAdventure={() => setCurrentView('student-portal')}
                />
              )}

              {currentView === 'exams' && <ExamManagementView />}

              {currentView === 'assignments' && <AssignmentManagementView />}

              {currentView === 'readiness' && <EndTermReadinessView />}

              {currentView === 'sar' && <CrossClassSarView />}

              {currentView === 'home-visit' && <HomeVisitSdqView />}

              {currentView === 'student-affairs' && (
                <StudentAffairsCouncilView
                  key="affairs"
                  initialSection="AFFAIRS"
                  onOpenHomeVisit={() => setCurrentView('home-visit')}
                />
              )}

              {currentView === 'student-council' && (
                <StudentAffairsCouncilView
                  key="council"
                  initialSection="COUNCIL"
                  onOpenHomeVisit={() => setCurrentView('home-visit')}
                />
              )}

              {currentView === 'courses' && <CoursesCurriculumView />}

              {currentView === 'lessons' && <LessonPlansView />}

              {currentView === 'roster' && (
                <ClassroomsRosterView
                  onSelectStudent={handleSelectStudent}
                  onSelectClassroom={() => setCurrentView('class-overview')}
                />
              )}

              {currentView === 'student' && (
                <StudentDetailView onOpenHomeVisit={() => setCurrentView('home-visit')} />
              )}

              {currentView === 'timetable' && <TimetableView />}

              {currentView === 'academic-year' && <AcademicTermsView />}

              {currentView === 'settings' && <SettingsBackupView />}

              {currentView === 'trash' && <TrashManagementView />}

              {currentView === 'accounts' && <UserAccountsView />}
            </main>
          </div>
        </div>
      )}

      {/* Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAction={(view) => {
          if (view === 'overview') setCurrentView('class-overview');
          else if (view === 'student') setCurrentView('student');
          else if (view === 'sar') setCurrentView('sar');
          else if (view === 'student-portal') setCurrentView('student-portal');
        }}
      />
    </div>
  );
};

export default App;
