// src/views/TeacherGlobalDashboardView.tsx
// หน้า Dashboard หลักของครู ตามภาพต้นแบบ Mockup Image 1 (Desktop) และ Image 2 (Mobile First)

import React, { useState } from 'react';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import type { SchoolUserRole } from '../config/schoolRoles';
import { TeacherHeroBanner } from '../components/dashboard/TeacherHeroBanner';
import { TeacherBottomBanner } from '../components/dashboard/TeacherBottomBanner';
import { TeacherTodayTimetableCard } from '../components/dashboard/TeacherTodayTimetableCard';
import { TeacherQuickShortcuts } from '../components/dashboard/TeacherQuickShortcuts';
import { TeacherCalendarActivityWidget } from '../components/dashboard/TeacherCalendarActivityWidget';
import { TeacherWeeklyTasksWidget } from '../components/dashboard/TeacherWeeklyTasksWidget';
import { TeacherAnnouncementsWidget } from '../components/dashboard/TeacherAnnouncementsWidget';
import { TeacherMobileHomeHero } from '../components/dashboard/TeacherMobileHomeHero';
import { AdminTeacherBannerModal } from '../components/teacher/AdminTeacherBannerModal';
import type { TeacherBannerKey } from '../services/teacherBannerService';

interface TeacherGlobalDashboardViewProps {
  activeRole?: SchoolUserRole;
  onNavigateToClass?: (classId: string) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToReadiness?: () => void;
  onNavigateToAcademicYear?: () => void;
  onNavigateToCourses?: () => void;
  onNavigateToMorningAssembly?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherGlobalDashboardView: React.FC<
  TeacherGlobalDashboardViewProps
> = ({
  activeRole = 'TEACHER_GENERAL',
  onNavigateToAttendance,
  onNavigateToAcademicYear,
  onNavigateToCourses,
  onDeepNavigate,
}) => {
  const [isAdminBannerModalOpen, setIsAdminBannerModalOpen] = useState(false);
  const [bannerModalInitialKey, setBannerModalInitialKey] = useState<TeacherBannerKey>('hero');

  const handleOpenBannerModal = (key: TeacherBannerKey = 'hero') => {
    setBannerModalInitialKey(key);
    setIsAdminBannerModalOpen(true);
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-4 sm:space-y-5 pb-20 select-none font-sans">
      {/* 1. Mobile Greeting Hero (เฉพาะบนหน้าจอมือถือ < 768px ตามภาพต้นแบบ Screen 1 Mobile First) */}
      <div className="md:hidden">
        <TeacherMobileHomeHero
          teacherName="นายปัญจพล เกษรัตน์"
          department="กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาญี่ปุ่น)"
          avatarUrl="/images/teacher/teacher_avatar.png"
        />
      </div>

      {/* 2. สองคอลัมน์หลักซ้าย-ขวา ตามภาพต้นแบบ Mockup Image 1 (Desktop Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ฝั่งซ้าย (Main Stream Column ~65-68% / lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5 min-w-0">
          {/* 2.1 Hero Banner (ส่วนที่ 1 ของแบนเนอร์ครู) */}
          <TeacherHeroBanner
            activeRole={activeRole}
            onOpenAdminModal={() => handleOpenBannerModal('hero')}
          />

          {/* 2.2 ตารางสอนวันนี้ 5 คาบ พร้อมปุ่ม [เช็คชื่อ], [ให้คะแนน], [รายละเอียด >] */}
          <TeacherTodayTimetableCard
            onNavigateToFullTimetable={() => {
              if (onDeepNavigate) {
                onDeepNavigate({
                  view: 'timetable',
                  highlightBanner: 'ตารางสอนรวมทุกภาคเรียน',
                });
              }
            }}
            onDeepNavigate={onDeepNavigate}
          />

          {/* 2.3 Bottom Banner (ส่วนที่ 3 ของแบนเนอร์ครู แนวนอนด้านล่าง) */}
          <TeacherBottomBanner
            activeRole={activeRole}
            onOpenAdminModal={() => handleOpenBannerModal('bottom')}
          />
        </div>

        {/* ฝั่งขวา (Side Stream Column ~32-35% / lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 min-w-0">
          {/* 2.4 ทางลัดสำหรับครู (สร้างแผนการสอน, เช็คชื่อนักเรียน, ให้คะแนน, อัปโหลดสื่อ/ไฟล์) */}
          <TeacherQuickShortcuts
            onDeepNavigate={onDeepNavigate}
            onNavigateToLessons={onNavigateToCourses}
            onNavigateToAttendance={onNavigateToAttendance}
          />

          {/* 2.5 ปฏิทินการสอน / กิจกรรม (ตุลาคม 2569 & สรุปวันนี้ 5 คาบ) */}
          <TeacherCalendarActivityWidget
            onNavigateToCalendar={onNavigateToAcademicYear}
            onDeepNavigate={onDeepNavigate}
          />

          {/* 2.6 งานที่ต้องทำ (สัปดาห์นี้) [ด่วน], [ปกติ] */}
          <TeacherWeeklyTasksWidget onDeepNavigate={onDeepNavigate} />

          {/* 2.7 ข่าวสาร / ประกาศ (2 รายการ) */}
          <TeacherAnnouncementsWidget
            onViewAll={() => {
              onDeepNavigate?.({
                view: 'home',
                highlightBanner: 'ข่าวสารและประกาศทั้งหมดของโรงเรียน',
              });
            }}
          />
        </div>
      </div>

      {/* Admin Banner Customization Modal (สิทธิ์เฉพาะ ACADEMIC_ADMIN / ADMIN) */}
      <AdminTeacherBannerModal
        isOpen={isAdminBannerModalOpen}
        onClose={() => setIsAdminBannerModalOpen(false)}
        activeRole={activeRole}
        initialBannerKey={bannerModalInitialKey}
      />
    </div>
  );
};
