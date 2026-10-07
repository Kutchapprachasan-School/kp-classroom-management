import React, { useState } from 'react';
import {
  getSchoolSettings,
  type SchoolBrandingSettings,
  type SchoolUserRole,
} from '../config/schoolRoles';
import type { AuthUser } from '../services/authService';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminSidebar, type AdminMenuKey } from '../components/admin/AdminSidebar';
import { AdminHeroBanner } from '../components/admin/AdminHeroBanner';
import { AdminStatCards } from '../components/admin/AdminStatCards';
import { AdminAcademicSummaryCard } from '../components/admin/AdminAcademicSummaryCard';
import { AdminAttendanceChartCard } from '../components/admin/AdminAttendanceChartCard';
import { AdminStaffEvaluationCard } from '../components/admin/AdminStaffEvaluationCard';
import { AdminStaffRecentTable } from '../components/admin/AdminStaffRecentTable';
import { AdminSubjectAchievementCard } from '../components/admin/AdminSubjectAchievementCard';
import { AdminStudentStatusDonutCard } from '../components/admin/AdminStudentStatusDonutCard';
import { AdminAnnouncementsWidget } from '../components/admin/AdminAnnouncementsWidget';
import { AdminActivityCalendarWidget } from '../components/admin/AdminActivityCalendarWidget';
import { AdminAiCopilotWidget } from '../components/admin/AdminAiCopilotWidget';
import { AdminOperationalCards } from '../components/admin/AdminOperationalCards';
import { AdminFooter } from '../components/admin/AdminFooter';
import {
  FinancialDetailsModal,
  RepairsDetailsModal,
  BaseModal,
} from '../components/admin/AdminDetailModals';
import { QuickSearchModal } from '../components/common/QuickSearchModal';

interface AdminExecutiveDashboardViewProps {
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
  onNavigateToView?: (viewKey: string) => void;
  onLogout?: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolBrandingSettings;
}

export const AdminExecutiveDashboardView: React.FC<
  AdminExecutiveDashboardViewProps
> = ({
  activeRole = 'ACADEMIC_ADMIN',
  onChangeRole,
  onNavigateToView,
  onLogout,
  currentUser,
  schoolSettings,
}) => {
  const branding = schoolSettings || getSchoolSettings();
  const [currentMenu, setCurrentMenu] = useState<AdminMenuKey>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Detail Modals
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isRepairsModalOpen, setIsRepairsModalOpen] = useState(false);
  const [activeGenericModal, setActiveGenericModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({ isOpen: false, title: '', content: '' });

  const handleSelectMenu = (key: AdminMenuKey) => {
    setCurrentMenu(key);
    // Link menu keys to corresponding specialized views if applicable
    switch (key) {
      case 'home':
        // stay on executive dashboard
        break;
      case 'academic-results':
        onNavigateToView?.('readiness');
        break;
      case 'personnel-hr':
        onNavigateToView?.('roster');
        break;
      case 'system-settings':
        onNavigateToView?.('settings');
        break;
      case 'users-permissions':
        onNavigateToView?.('accounts');
        break;
      case 'attendance':
        onNavigateToView?.('student-affairs');
        break;
      case 'reports-dashboard':
        onNavigateToView?.('sar');
        break;
      default:
        setActiveGenericModal({
          isOpen: true,
          title: `ระบบงาน: ${getMenuLabel(key)}`,
          content: `ระบบบริหารส่วนกลาง "${getMenuLabel(
            key
          )}" ${branding.nameTh} กำลังเชื่อมต่อข้อมูลแบบเรียลไทม์กับฐานข้อมูลกลาง`,
        });
        break;
    }
  };

  const getMenuLabel = (key: AdminMenuKey): string => {
    const labels: Record<AdminMenuKey, string> = {
      home: 'หน้าหลัก',
      'personnel-hr': 'บุคลากร & HR',
      evaluation: 'ระบบประเมินบุคลากร',
      'students-parents': 'นักเรียน & ผู้ปกครอง',
      'academic-results': 'วิชาการ & ผลการเรียน',
      attendance: 'การเข้าเรียน',
      'finance-procurement': 'การเงิน & พัสดุ',
      'buildings-repairs': 'อาคาร & งานซ่อม',
      'documents-admin': 'เอกสาร & งานธุรการ',
      'school-comm': 'สื่อสารโรงเรียน',
      'reports-dashboard': 'รายงาน & Dashboard',
      'users-permissions': 'ผู้ใช้งาน / สิทธิ์การใช้งาน',
      'system-settings': 'ตั้งค่าระบบ',
      'backup-restore': 'สำรองข้อมูล',
      'import-export': 'Import / Export',
      'api-integration': 'API & Integration',
    };
    return labels[key] || key;
  };

  const handleOperationalSection = (section: string) => {
    if (section === 'finance') {
      setIsFinanceModalOpen(true);
    } else if (section === 'repairs') {
      setIsRepairsModalOpen(true);
    } else if (section === 'documents') {
      setActiveGenericModal({
        isOpen: true,
        title: 'ระบบงานสารบรรณ & ธุรการอิเล็กทรอนิกส์ (E-Document)',
        content:
          'มีหนังสือเข้าทั้งหมด 12 รายการ, หนังสือออก 8 รายการ, คำสั่งโรงเรียน 5 รายการ และประกาศ 7 รายการ ดำเนินการออกเลขและลงนามดิจิทัลครบถ้วน',
      });
    } else if (section === 'communication') {
      setActiveGenericModal({
        isOpen: true,
        title: `ช่องทางสื่อสาร${branding.nameTh}`,
        content:
          'LINE Official Account ผู้ติดตาม 8,420 คน, ส่งข้อความแจ้งเตือนผู้ปกครองแล้ว 342 ครั้ง และระบบ Broadcast SMS ส่งแล้ว 1,256 ข้อความ อัตราการเปิดอ่าน 98.4%',
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Prompt',sans-serif] select-none"
      style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentMenu={currentMenu}
        onSelectMenu={handleSelectMenu}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        schoolSettings={branding}
      />

      {/* Main Content Shell (Padded Left for Desktop Sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <AdminHeader
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsSidebarOpen((prev: boolean) => !prev);
            } else {
              setIsCollapsed((prev: boolean) => !prev);
            }
          }}
          termLabel="ภาคเรียนที่ 1/2569"
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onNavigateToView={onNavigateToView}
          onChangeRole={onChangeRole}
          onLogout={onLogout}
          activeRole={activeRole}
          currentUser={currentUser}
          schoolName={branding.nameTh}
        />

        {/* Dashboard Main Workspace matching media_1791209295254.jpg */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-5">
          {/* Main Top Grid: Left Area (Hero, Stats, Row A, Row B) + Right Column (Announcements, Calendar, AI Copilot) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Left Primary Section (lg:col-span-8 xl:col-span-9 2xl:col-span-9) */}
            <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-9 space-y-4 sm:space-y-5 min-w-0">
              {/* 1. Hero Greeting Banner */}
              <AdminHeroBanner
                schoolName={branding.nameTh}
                quote="การศึกษา คือ รากฐาน ของอนาคตที่มั่นคง"
              />

              {/* 2. 4 Stat KPI Cards */}
              <AdminStatCards />

              {/* 3. Row A: Card A (สรุปผลการเรียน) + Card B (สถิติการเข้าเรียน) + Card C (ผลประเมินบุคลากร) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr] gap-4 sm:gap-5 items-stretch">
                <AdminAcademicSummaryCard />
                <AdminAttendanceChartCard />
                <AdminStaffEvaluationCard />
              </div>

              {/* 4. Row B: Card D (การประเมินบุคลากร ล่าสุด) + Card E (ผลสัมฤทธิ์ตามกลุ่มสาระ) + Card F (สถิตินักเรียน) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr] gap-4 sm:gap-5 items-stretch">
                <AdminStaffRecentTable
                  onViewAll={() =>
                    setActiveGenericModal({
                      isOpen: true,
                      title: 'รายชื่อและการประเมินบุคลากรทั้งหมด 124 คน',
                      content:
                        'การประเมินผลการปฏิบัติงานข้าราชการครูและบุคลากรทางการศึกษา ประจำปีการศึกษา 2568 ผ่านเกณฑ์ประเมินระดับดีเด่นและดีมากรวม 89.1%',
                    })
                  }
                />
                <AdminSubjectAchievementCard />
                <AdminStudentStatusDonutCard />
              </div>
            </div>

            {/* Right Column: Announcements + Activity Calendar + AI Copilot */}
            <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 space-y-4 sm:space-y-5 min-w-0">
              {/* Widget 1: ข่าวประชาสัมพันธ์ */}
              <AdminAnnouncementsWidget
                onViewAll={() =>
                  setActiveGenericModal({
                    isOpen: true,
                    title: 'ข่าวประชาสัมพันธ์ทั้งหมดของโรงเรียน',
                    content:
                      '1. ประกาศปิดภาคเรียนที่ 1/2568 วันที่ 25 ส.ค. 2568\n2. กิจกรรมวันแม่แห่งชาติ วันที่ 12 ส.ค. 2568\n3. แจ้งซ่อมบำรุงระบบอินเทอร์เน็ต วันที่ 10 ส.ค. 2568\n4. เปิดรับสมัครนักเรียน ม.1 และ ม.4 วันที่ 5 ส.ค. 2568',
                  })
                }
              />

              {/* Widget 2: ปฏิทินกิจกรรม */}
              <AdminActivityCalendarWidget
                onViewAll={() => onNavigateToView?.('timetable')}
              />

              {/* Widget 3: AI ผู้ช่วยผู้บริหาร */}
              <AdminAiCopilotWidget />
            </div>
          </div>

          {/* 5. Bottom Row: 4 Operational Cards across all 4 zones */}
          <AdminOperationalCards onOpenSection={handleOperationalSection} />

          {/* 6. Footer */}
          <AdminFooter
            schoolName={branding.nameTh}
            version="v1.0.0"
            yearTh="2569"
          />
        </main>
      </div>

      {/* Modals */}
      <FinancialDetailsModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
      />

      <RepairsDetailsModal
        isOpen={isRepairsModalOpen}
        onClose={() => setIsRepairsModalOpen(false)}
      />

      <BaseModal
        isOpen={activeGenericModal.isOpen}
        onClose={() =>
          setActiveGenericModal({ isOpen: false, title: '', content: '' })
        }
        title={activeGenericModal.title}
      >
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {activeGenericModal.content}
        </div>
      </BaseModal>

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectAction={(target) => {
          setIsSearchModalOpen(false);
          if (target === 'overview') {
            onNavigateToView?.('class-overview');
          } else if (target === 'student') {
            onNavigateToView?.('student');
          } else if (target === 'sar') {
            onNavigateToView?.('sar');
          } else if (target === 'student-portal') {
            onNavigateToView?.('student-portal');
          }
        }}
      />
    </div>
  );
};
