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
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<TeacherViewKey>('school-login');
  const [loginChannel, setLoginChannel] = useState<TeacherLoginChannel>('E_LEAVE');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        return 'เยี่ยมบ้านนักเรียน / ดูแลผู้เรียนรายบุคคล (SDQ)';
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Prototype Quick-Switcher Bar (Floating Preview Bar) */}
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-40 select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-amber-400">
            <Eye className="w-3.5 h-3.5" />
            <span>สลับดูหน้าจอ:</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCurrentView('school-login')}
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
            onClick={() => setCurrentView('home')}
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
            onClick={() => setCurrentView('class-overview')}
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
            onClick={() => setCurrentView('home-visit')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              currentView === 'home-visit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700 border border-rose-500/30'
            }`}
          >
            <HeartHandshake className="w-3 h-3" />
            <span>🏡 เยี่ยมบ้าน / SDQ (ครู)</span>
          </button>

          <button
            onClick={() => setCurrentView('readiness')}
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
            onClick={() => setCurrentView('student')}
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
            onClick={() => setCurrentView('sar')}
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
            onClick={() => setCurrentView('timetable')}
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
            onClick={() => setCurrentView('exams')}
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
            onClick={() => setCurrentView('student-portal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'student-portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>6. ห้องเรียนผจญภัย (นักเรียน + ปักหมุดบ้าน)</span>
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
          {/* Left Teacher Navigation Sidebar */}
          <TeacherSidebar
            currentView={currentView}
            loginChannel={loginChannel}
            onNavigate={(view) => setCurrentView(view)}
          />

          {/* Right Main Working Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar */}
            <TeacherHeader
              title={getHeaderTitle()}
              onBack={currentView !== 'home' ? handleBack : undefined}
              onOpenSearch={() => setIsSearchOpen(true)}
              termLabel="ภาคเรียนที่ 1/2569"
            />

            {/* Dynamic View Body */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
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
