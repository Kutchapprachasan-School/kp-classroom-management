// src/views/StudentPortalView.tsx
// พอร์ทัลนักเรียน โรงเรียน เชื่อมต่อระบบผู้ใช้จริงและ Clean Slate พร้อมฟอนต์ Prompt
// รองรับการปรับแต่งแบนเนอร์ทั้ง 3 ส่วนโดย Admin

import React, { useState, useEffect } from 'react';
import { StudentSidebar, type StudentTabKey } from '../components/student/StudentSidebar';
import { StudentHeader } from '../components/student/StudentHeader';
import { StudentHomeDashboard } from '../components/student/StudentHomeDashboard';
import { StudentCoursesView } from '../components/student/StudentCoursesView';
import { StudentTimetableView } from '../components/student/StudentTimetableView';
import { StudentAnnouncementsView } from '../components/student/StudentAnnouncementsView';
import { StudentProfileView } from '../components/student/StudentProfileView';
import { StudentContactTeacherView } from '../components/student/StudentContactTeacherView';
import { AdminBannerManageModal } from '../components/student/AdminBannerManageModal';

import { StudentMissionsView } from './StudentMissionsView';
import { StudentArenaView } from './StudentArenaView';
import { StudentGradebookView } from './StudentGradebookView';
import { StudentTrophyView } from './StudentTrophyView';
import { StudentHomeVisitFormView } from './StudentHomeVisitFormView';
import { StudentCouncilAffairsPortalView } from './StudentCouncilAffairsPortalView';
import { StudentGachaView } from './StudentGachaView';
import { StudentMobileCareView } from '../components/student/StudentMobileCareView';
import { StudentAnimeAppView } from '../components/student/StudentAnimeAppView';
import { StudentAffairsCouncilView } from './StudentAffairsCouncilView';

import { gamificationService } from '../services/gamificationService';
import { studentBannerService } from '../services/studentBannerService';
import { authService, type AuthUser } from '../services/authService';
import { getSchoolSettings, type SchoolSettingsConfig } from '../config/schoolSettings';
import { cleanSlateService } from '../services/cleanSlateService';
import { type SchoolUserRole } from '../config/schoolRoles';

interface StudentPortalViewProps {
  onExit: () => void;
  studentRole?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL';
  activeRole?: SchoolUserRole;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
  onChangeStudentRole?: (role: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL') => void;
  onSwitchToTeacherRole?: (role: SchoolUserRole) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  onExit,
  studentRole = 'STUDENT_GENERAL',
  activeRole,
  currentUser,
  schoolSettings,
  onChangeStudentRole,
  onSwitchToTeacherRole,
}) => {
  const effectiveUser = currentUser || authService.getCurrentUser();
  const effectiveSettings = schoolSettings || getSchoolSettings();
  const studentName = effectiveUser?.name || 'นักเรียน';
  const studentClassroom = effectiveUser?.classroomId || 'ม.3/1';

  const [activeTab, setActiveTab] = useState<StudentTabKey>('home');
  const [currentXp, setCurrentXp] = useState<number>(() =>
    cleanSlateService.isCleanSlateActive() ? 0 : 670
  );
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kp_student_sidebar_open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdminBannerModalOpen, setIsAdminBannerModalOpen] = useState(false);

  const isAdmin = studentBannerService.canManageBanners(activeRole);

  // Toggle sidebar for both mobile drawer and desktop collapsible panel
  const handleToggleSidebar = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarOpen((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem('kp_student_sidebar_open', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

  useEffect(() => {
    const studentId = effectiveUser?.id || 'stu-2';
    gamificationService.claimDailyCheckin(studentId).then((res) => {
      if (res.isFirstToday) {
        setCurrentXp((prev) => prev + res.xpAwarded);
      }
    });
  }, [effectiveUser?.id]);

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC] font-['Prompt',sans-serif]"
      style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Student Specific Sidebar */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        studentRole={studentRole}
        onChangeStudentRole={onChangeStudentRole}
        onSwitchToTeacherRole={onSwitchToTeacherRole}
        onLogout={onExit}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={!isDesktopSidebarOpen}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <StudentHeader
          onExit={onExit}
          totalXp={currentXp}
          studentName={studentName}
          classroomName={studentClassroom}
          currentUser={effectiveUser}
          studentRole={studentRole}
          activeRole={activeRole}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isSidebarOpen={isDesktopSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenAdminBannerModal={() => setIsAdminBannerModalOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1360px] mx-auto">
            {/* 1. หน้าแรก (Home) */}
            {activeTab === 'home' && (
              <StudentHomeDashboard
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAssignment={(_id) => setActiveTab('missions')}
              />
            )}

            {/* 2. รายวิชาของฉัน */}
            {activeTab === 'courses' && (
              <StudentCoursesView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onBack={() => setActiveTab('home')}
                onSelectCourse={(_code) => setActiveTab('missions')}
              />
            )}

            {/* 3. ตารางเรียน */}
            {activeTab === 'timetable' && (
              <StudentTimetableView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onBack={() => setActiveTab('home')}
              />
            )}

            {/* 4. กิจกรรม / ประกาศ */}
            {activeTab === 'announcements' && (
              <StudentAnnouncementsView onBack={() => setActiveTab('home')} />
            )}

            {/* 5. ข้อมูลส่วนตัว */}
            {activeTab === 'profile' && (
              <StudentProfileView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onBack={() => setActiveTab('home')}
              />
            )}

            {/* 6. ติดต่อครู */}
            {activeTab === 'contact' && (
              <StudentContactTeacherView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onBack={() => setActiveTab('home')}
              />
            )}

            {/* 7. งานที่ได้รับมอบหมาย */}
            {activeTab === 'missions' && (
              <StudentMissionsView currentUser={effectiveUser} />
            )}

            {/* 8. ผลการเรียน */}
            {activeTab === 'gradebook' && (
              <StudentGradebookView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
              />
            )}

            {/* 9. สุ่มคู่หู (Gacha) */}
            {activeTab === 'gacha' && (
              <StudentGachaView
                onBack={() => setActiveTab('home')}
                onSelectBuddy={() => setActiveTab('home')}
              />
            )}

            {/* 10. ตู้รางวัล */}
            {activeTab === 'trophy' && (
              <StudentTrophyView
                currentUser={effectiveUser}
                onNavigateToGacha={() => setActiveTab('gacha')}
                onNavigateToMissions={() => setActiveTab('missions')}
              />
            )}

            {/* 11. ดูแลนักเรียน */}
            {activeTab === 'mobile-care' && (
              <StudentMobileCareView onExit={() => setActiveTab('home')} />
            )}

            {/* 12. 10 หน้าจออนิเมะ */}
            {activeTab === 'anime-app' && (
              <StudentAnimeAppView onExit={() => setActiveTab('home')} />
            )}

            {/* 13. สนามประลอง Arena */}
            {activeTab === 'arena' && <StudentArenaView currentUser={effectiveUser} />}

            {/* 14. เยี่ยมบ้าน */}
            {activeTab === 'home-visit' && (
              <StudentHomeVisitFormView
                currentUser={effectiveUser}
                schoolSettings={effectiveSettings}
                onAwardXp={(xp) => setCurrentXp((prev) => prev + xp)}
              />
            )}

            {/* 15. เลือกตั้งสภานักเรียน */}
            {activeTab === 'student-council' && (
              <StudentCouncilAffairsPortalView
                section="COUNCIL"
                currentUser={effectiveUser}
              />
            )}

            {/* 16. ปฏิบัติงานสภานักเรียน */}
            {activeTab === 'council-affairs' && (
              <StudentAffairsCouncilView initialSection="COUNCIL" />
            )}
          </div>
        </main>
      </div>

      {/* Admin Banner Management Modal (เฉพาะเมื่อผู้ใช้เป็น Admin) */}
      <AdminBannerManageModal
        isOpen={isAdminBannerModalOpen}
        onClose={() => setIsAdminBannerModalOpen(false)}
        userRole={activeRole || (isAdmin ? 'ACADEMIC_ADMIN' : 'STUDENT_GENERAL')}
      />
    </div>
  );
};
