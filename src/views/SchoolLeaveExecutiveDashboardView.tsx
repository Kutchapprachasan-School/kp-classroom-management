import React, { useState, useEffect } from 'react';
import {
  getSchoolSettings,
  type SchoolBrandingSettings,
  type SchoolUserRole,
} from '../config/schoolRoles';
import type { AuthUser } from '../services/authService';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeroBanner } from '../components/admin/AdminHeroBanner';
import { LeaveStatCards } from '../components/admin/LeaveStatCards';
import { LeaveApprovalQueueTable } from '../components/admin/LeaveApprovalQueueTable';
import { LeaveDetailModal } from '../components/admin/LeaveDetailModal';
import { LeaveDistributionChartsCard } from '../components/admin/LeaveDistributionChartsCard';
import { StudentLeaveOverviewCard } from '../components/admin/StudentLeaveOverviewCard';
import { AdminFooter } from '../components/admin/AdminFooter';
import { QuickSearchModal } from '../components/common/QuickSearchModal';
import {
  schoolStaffLeaveService,
  STAFF_LEAVE_EVENT,
  type StaffLeaveRequest,
} from '../services/schoolStaffLeaveService';
import {
  studentAffairsCouncilService,
  type StudentLeaveRequest,
} from '../services/studentAffairsCouncilService';
import {
  Settings,
  FileCheck,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface SchoolLeaveExecutiveDashboardViewProps {
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
  onNavigateToView?: (viewKey: string) => void;
  onLogout?: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolBrandingSettings;
}

export const SchoolLeaveExecutiveDashboardView: React.FC<
  SchoolLeaveExecutiveDashboardViewProps
> = ({
  activeRole = 'ACADEMIC_ADMIN',
  onChangeRole,
  onNavigateToView,
  onLogout,
  currentUser,
  schoolSettings,
}) => {
  const [branding, setBranding] = useState(() => schoolSettings || getSchoolSettings());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Leave State
  const [staffLeaves, setStaffLeaves] = useState<StaffLeaveRequest[]>(() =>
    schoolStaffLeaveService.getAllLeaves()
  );
  const [studentLeaves, setStudentLeaves] = useState<StudentLeaveRequest[]>(() =>
    studentAffairsCouncilService.getStudentLeaves()
  );
  const [selectedLeaveForModal, setSelectedLeaveForModal] =
    useState<StaffLeaveRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setStaffLeaves(schoolStaffLeaveService.getAllLeaves());
      setBranding(getSchoolSettings());
    };
    window.addEventListener(STAFF_LEAVE_EVENT, handleUpdate);
    window.addEventListener('kps-school-settings-updated', handleUpdate);
    return () => {
      window.removeEventListener(STAFF_LEAVE_EVENT, handleUpdate);
      window.removeEventListener('kps-school-settings-updated', handleUpdate);
    };
  }, []);

  const handleApproveStaffLeave = (id: string) => {
    const updated = schoolStaffLeaveService.updateLeaveStatus(
      id,
      'APPROVED',
      currentUser?.name || 'ผู้อำนวยการโรงเรียน'
    );
    setStaffLeaves(updated);
    showToast('อนุมัติคำขอลาและบันทึกตารางครูสอนแทนเรียบร้อยแล้ว');
  };

  const handleRejectStaffLeave = (id: string, reason?: string) => {
    const updated = schoolStaffLeaveService.updateLeaveStatus(
      id,
      'REJECTED',
      currentUser?.name || 'ผู้อำนวยการโรงเรียน',
      reason
    );
    setStaffLeaves(updated);
    showToast('ส่งคำขอลาเพื่อปรับปรุงแก้ไขเรียบร้อยแล้ว');
  };

  const handleApproveStudentLeave = (id: string) => {
    const updated = studentAffairsCouncilService.updateStudentLeaveStatus(
      id,
      'APPROVED'
    );
    setStudentLeaves(updated);
    showToast('อนุมัติใบลานักเรียนเรียบร้อยแล้ว (ซิงค์สู่การเช็คชื่ออัตโนมัติ)');
  };

  const pendingLeaves = staffLeaves.filter((l) => l.status === 'PENDING');
  const staffOnLeaveToday = staffLeaves.filter(
    (l) => l.status === 'APPROVED' && l.startDate <= '2026-10-10' && l.endDate >= '2026-10-10'
  );
  const proxyTeachingAssignedCount = staffLeaves.reduce(
    (sum, l) => sum + (l.status === 'APPROVED' ? l.substitutes.length : 0),
    2 // รวมคาบสอนแทนของวันนี้
  );

  const typeData = schoolStaffLeaveService.getLeaveTypeSummary();
  const deptData = schoolStaffLeaveService.getDepartmentLeaveBreakdown();

  return (
    <div className="min-h-screen bg-[#F7FAFF] font-['Prompt',sans-serif] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <AdminHeader
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarOpen((prev) => !prev);
          } else {
            setIsCollapsed((prev) => !prev);
          }
        }}
        activeRole={activeRole}
        onChangeRole={onChangeRole}
        onLogout={onLogout}
        currentUser={currentUser}
        schoolName={branding.nameTh}
        onNavigateToView={onNavigateToView}
      />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <AdminSidebar
          currentMenu="personnel-hr"
          onSelectMenu={(key) => {
            if (key === 'home') onNavigateToView?.('home');
            else if (key === 'system-settings') onNavigateToView?.('settings');
            else if (key === 'attendance') onNavigateToView?.('student-affairs');
            else if (key === 'academic-results') onNavigateToView?.('readiness');
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          schoolSettings={branding}
        />

        {/* Main Content View Container */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out p-3.5 sm:p-6 lg:p-8 space-y-5 max-w-[1720px] mx-auto min-w-0 ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Executive Breadcrumb & Quick Switch Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E6EEF7] shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#163A66] leading-tight">
                  แดชบอร์ดบริหารระบบการลา & จัดการบุคลากร (Leave Executive Hub)
                </h2>
                <p className="text-xs text-slate-500">
                  {branding.nameTh} • ติดตามคำขอลา จัดครูสอนแทน และสถิติการมาปฏิบัติงานแบบองค์รวม
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToView?.('home')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>กลับสู่หน้าหลัก</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToView?.('settings')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="ตั้งค่านโยบายและโควตาวันลา"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>เกณฑ์ & โควตาวันลา</span>
              </button>
            </div>
          </div>

          {/* Hero Banner: Customized for Leave Management */}
          <AdminHeroBanner
            schoolName={branding.nameTh}
            quote="การบริหารเวลาและบุคลากรที่มีประสิทธิภาพ นำไปสู่คุณภาพการเรียนการสอนที่ดีที่สุด"
          />

          {/* 1. Leave KPI Stat Cards */}
          <LeaveStatCards
            pendingCount={pendingLeaves.length}
            staffOnLeaveTodayCount={staffOnLeaveToday.length}
            studentsOnLeaveTodayCount={studentLeaves.filter((l) => l.status === 'APPROVED').length}
            proxyTeachingAssignedCount={proxyTeachingAssignedCount}
            onFilterPending={() => {
              const el = document.getElementById('approval-queue');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* 2. Middle Row: Analytics (Donut + Student Affairs Overview) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeaveDistributionChartsCard typeData={typeData} deptData={deptData} />
            <StudentLeaveOverviewCard
              studentLeaves={studentLeaves}
              onOpenAffairsView={() => onNavigateToView?.('student-affairs')}
              onApproveStudentLeave={handleApproveStudentLeave}
            />
          </div>

          {/* 3. Bottom Row: Approval Queue Table (Primary Workflow) */}
          <div id="approval-queue">
            <LeaveApprovalQueueTable
              leaves={staffLeaves}
              onApprove={handleApproveStaffLeave}
              onReject={handleRejectStaffLeave}
              onViewDetails={(leave) => setSelectedLeaveForModal(leave)}
            />
          </div>
        </main>
      </div>

      {/* Footer */}
      <AdminFooter schoolName={branding.nameTh} />

      {/* Drill-down Leave Details Modal */}
      <LeaveDetailModal
        isOpen={Boolean(selectedLeaveForModal)}
        leave={selectedLeaveForModal}
        onClose={() => setSelectedLeaveForModal(null)}
        onApprove={handleAppStaffLeaveDirect}
        onReject={handleRejectStaffLeaveDirect}
      />

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectAction={(target) => {
          setIsSearchModalOpen(false);
          if (target === 'overview') onNavigateToView?.('class-overview');
          else if (target === 'student') onNavigateToView?.('student');
          else if (target === 'sar') onNavigateToView?.('sar');
          else if (target === 'student-portal') onNavigateToView?.('student-portal');
        }}
      />
    </div>
  );

  function handleAppStaffLeaveDirect(id: string) {
    handleApproveStaffLeave(id);
  }

  function handleRejectStaffLeaveDirect(id: string, reason?: string) {
    handleRejectStaffLeave(id, reason);
  }
};
