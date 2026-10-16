# Codebase Index & Symbol Location Map (สารบัญโครงสร้างโค้ด)

> **กฎเหล็กเพื่อประสิทธิภาพ Context และ Token (Rule 6)**:
> สารบัญนี้ทำหน้าที่เป็น Navigation Map เพื่อให้ AI Assistant และผู้พัฒนาสามารถตรวจสอบตำแหน่งไฟล์, สัญลักษณ์หลัก (Components / Functions / Types), และช่วงบรรทัด (Line Ranges) ได้ทันที **โดยไม่ต้องเปิดดูทั้งไฟล์ (ห้าม Full View)**
> **ข้อบังคับ**: ทุกครั้งที่มีการเพิ่มไฟล์ใหม่, ลบไฟล์, หรือปรับแก้โครงสร้างหลัก ต้องรัน `node scripts/index_codebase.mjs` เพื่ออัปเดตสารบัญนี้เสมอ

*อัปเดตล่าสุด: 16/10/2569 13:19:20 | รวมทั้งหมด 174 ไฟล์*

---

## Views (หน้าระบบ)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/views/AcademicTermsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AcademicTermsView.tsx) | 2019 | `ActivityCategory` (L48), `CalendarLegendColor` (L50), `CalendarEventItem` (L52), `parseHolidayDate` (L81), `convertHolidayToCalendarEvent` (L107), `getThaiDayOfWeekName` (L126), `formatThaiFullDate` (L133), `getMingCuteEventIcon` (L167), `AcademicTermsView` (L279) |
| [src/views/AdminExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AdminExecutiveDashboardView.tsx) | 312 | `AdminExecutiveDashboardView` (L39) |
| [src/views/AssignmentManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AssignmentManagementView.tsx) | 839 | `QuickFilterMode` (L31), `AssignmentManagementView` (L38) |
| [src/views/ClassroomAttendanceView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomAttendanceView.tsx) | 1561 | `ClassroomAttendanceViewProps` (L51), `TeacherCourseOption` (L56), `TEACHER_COURSES` (L65), `TAUGHT_CLASSROOMS` (L100), `ClassroomAttendanceView` (L119) |
| [src/views/ClassroomManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomManagementView.tsx) | 1487 | `ImportPreviewRow` (L50), `ClassroomManagementView` (L62) |
| [src/views/ClassroomsRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomsRosterView.tsx) | 1919 | `ClassroomsRosterView` (L56) |
| [src/views/CoursesCurriculumView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CoursesCurriculumView.tsx) | 2027 | `CoursesCurriculumViewProps` (L37), `CoursesCurriculumView` (L41) |
| [src/views/CrossClassSarView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CrossClassSarView.tsx) | 1632 | `CrossClassSarView` (L80) |
| [src/views/EndTermReadinessView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/EndTermReadinessView.tsx) | 601 | `EndTermReadinessView` (L70) |
| [src/views/ExamManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ExamManagementView.tsx) | 2980 | `ExtendedExamItem` (L72), `ExamManagementView` (L87) |
| [src/views/HomeVisitSdqView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/HomeVisitSdqView.tsx) | 1362 | `HomeVisitSdqView` (L27) |
| [src/views/LessonPlansView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/LessonPlansView.tsx) | 1779 | `UnitStatus` (L31), `EvaluationItem` (L33), `UnitPlanItem` (L40), `CourseFilterOption` (L85), `LessonPlansView` (L94) |
| [src/views/MessagesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MessagesView.tsx) | 1215 | `MessagesView` (L45) |
| [src/views/MorningAssemblyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MorningAssemblyView.tsx) | 1183 | `MorningAssemblyViewProps` (L52), `MorningAssemblyView` (L88) |
| [src/views/SchoolLeaveExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolLeaveExecutiveDashboardView.tsx) | 292 | `SchoolLeaveExecutiveDashboardView` (L43) |
| [src/views/SchoolPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolPortalView.tsx) | 437 | `TeacherLoginChannel` (L12), `SchoolPortalView` (L27) |
| [src/views/SettingsBackupView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SettingsBackupView.tsx) | 3464 | `SettingsKey` (L120), `SettingsBackupView` (L146) |
| [src/views/StudentAffairsCouncilView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentAffairsCouncilView.tsx) | 871 | `StudentAffairsCouncilView` (L36) |
| [src/views/StudentArenaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentArenaView.tsx) | 447 | `StudentArenaView` (L45) |
| [src/views/StudentCouncilAffairsPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentCouncilAffairsPortalView.tsx) | 445 | `StudentCouncilAffairsPortalView` (L27) |
| [src/views/StudentDetailView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentDetailView.tsx) | 492 | `StudentDetailView` (L31) |
| [src/views/StudentGachaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGachaView.tsx) | 1049 | `StudentGachaView` (L25) |
| [src/views/StudentGradebookView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGradebookView.tsx) | 998 | `StudentGradebookView` (L71) |
| [src/views/StudentHomeVisitFormView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentHomeVisitFormView.tsx) | 555 | `StudentHomeVisitFormView` (L28) |
| [src/views/StudentMissionsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentMissionsView.tsx) | 843 | `StudentMissionsView` (L30) |
| [src/views/StudentPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentPortalView.tsx) | 317 | `StudentPortalView` (L47) |
| [src/views/StudentRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentRosterView.tsx) | 2035 | `StudentRosterView` (L59) |
| [src/views/StudentTrophyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentTrophyView.tsx) | 419 | `TrophyBadgeItem` (L26), `StudentTrophyView` (L86) |
| [src/views/TeacherGlobalDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherGlobalDashboardView.tsx) | 125 | `TeacherGlobalDashboardView` (L32) |
| [src/views/TeacherOverviewView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherOverviewView.tsx) | 2526 | `ClassSubTab` (L90), `TeacherOverviewView` (L100) |
| [src/views/TimetableView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TimetableView.tsx) | 1533 | `TimetableView` (L109) |
| [src/views/TrashManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TrashManagementView.tsx) | 481 | `TrashManagementView` (L21) |
| [src/views/UserAccountsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/UserAccountsView.tsx) | 563 | `UserAccountsView` (L39) |

## Layout Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/layout/PageHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/PageHeroBanner.tsx) | 211 | `PageHeroBannerProps` (L17), `PageHeroBanner` (L50) |
| [src/components/layout/TeacherHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherHeader.tsx) | 944 | `TeacherHeader` (L72) |
| [src/components/layout/TeacherSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherSidebar.tsx) | 581 | `TeacherViewKey` (L48), `TeacherSidebar` (L107) |

## Dashboard Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/dashboard/TeacherAnnouncementsWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherAnnouncementsWidget.tsx) | 100 | `TeacherAnnouncementsWidget` (L19) |
| [src/components/dashboard/TeacherBottomBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherBottomBanner.tsx) | 74 | `TeacherBottomBanner` (L19) |
| [src/components/dashboard/TeacherCalendarActivityWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherCalendarActivityWidget.tsx) | 555 | `TeacherCalendarActivityWidget` (L39) |
| [src/components/dashboard/TeacherHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherHeroBanner.tsx) | 79 | `TeacherHeroBanner` (L19) |
| [src/components/dashboard/TeacherMoreAccountMobileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherMoreAccountMobileView.tsx) | 172 | `TeacherMoreAccountMobileView` (L23) |
| [src/components/dashboard/TeacherQuickShortcuts.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherQuickShortcuts.tsx) | 119 | `TeacherQuickShortcuts` (L16) |
| [src/components/dashboard/TeacherTaskDetailModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherTaskDetailModal.tsx) | 228 | `TeacherTaskDetailModal` (L24) |
| [src/components/dashboard/TeacherTodayTimetableCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherTodayTimetableCard.tsx) | 566 | `TodayPeriodItem` (L32), `TeacherTodayTimetableCard` (L57) |
| [src/components/dashboard/TeacherWeeklyTasksWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherWeeklyTasksWidget.tsx) | 239 | `TaskItem` (L19), `TeacherWeeklyTasksWidget` (L65) |

## Student Portal Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/student/AdminBannerManageModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/AdminBannerManageModal.tsx) | 370 | `AdminBannerManageModal` (L28) |
| [src/components/student/ChibiBuddyAvatar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/ChibiBuddyAvatar.tsx) | 104 | `ChibiBuddyAvatar` (L15) |
| [src/components/student/JiuMeowMascot.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/JiuMeowMascot.tsx) | 330 | `JiuMeowMascot` (L9), `AnimeStudentHero` (L256) |
| [src/components/student/StudentAnimeAppView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnimeAppView.tsx) | 1359 | `AnimeAppScreen` (L30), `StudentAnimeAppView` (L47) |
| [src/components/student/StudentAnnouncementsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnnouncementsView.tsx) | 369 | `StudentAnnouncementsView` (L32) |
| [src/components/student/StudentContactTeacherView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentContactTeacherView.tsx) | 165 | `StudentContactTeacherView` (L15) |
| [src/components/student/StudentCoursesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentCoursesView.tsx) | 121 | `StudentCoursesView` (L18) |
| [src/components/student/StudentHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHeader.tsx) | 246 | `StudentHeader` (L36) |
| [src/components/student/StudentHomeDashboard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHomeDashboard.tsx) | 705 | `StudentHomeDashboard` (L54) |
| [src/components/student/StudentMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileBottomNav.tsx) | 96 | `StudentMobileBottomNav` (L14) |
| [src/components/student/StudentMobileCareView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileCareView.tsx) | 1250 | `MobileScreenKey` (L33), `StudentMobileCareView` (L100) |
| [src/components/student/StudentProfileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentProfileView.tsx) | 163 | `StudentProfileView` (L15) |
| [src/components/student/StudentSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentSidebar.tsx) | 313 | `StudentTabKey` (L31), `StudentSidebar` (L63) |
| [src/components/student/StudentTimetableView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentTimetableView.tsx) | 179 | `StudentTimetableView` (L15) |

## General Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/admin/AdminAcademicSummaryCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminAcademicSummaryCard.tsx) | 172 | `AdminAcademicSummaryCard` (L15) |
| [src/components/admin/AdminActivityCalendarWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminActivityCalendarWidget.tsx) | 120 | `AdminActivityCalendarWidget` (L9) |
| [src/components/admin/AdminAiCopilotWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminAiCopilotWidget.tsx) | 213 | `AdminAiCopilotWidget` (L23) |
| [src/components/admin/AdminAnnouncementsWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminAnnouncementsWidget.tsx) | 112 | `AdminAnnouncementsWidget` (L24) |
| [src/components/admin/AdminAttendanceChartCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminAttendanceChartCard.tsx) | 108 | `AdminAttendanceChartCard` (L12) |
| [src/components/admin/AdminDetailModals.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminDetailModals.tsx) | 141 | `BaseModal` (L11), `FinancialDetailsModal` (L52), `RepairsDetailsModal` (L98) |
| [src/components/admin/AdminFooter.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminFooter.tsx) | 33 | `AdminFooter` (L10) |
| [src/components/admin/AdminHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminHeader.tsx) | 375 | `AdminHeader` (L27) |
| [src/components/admin/AdminHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminHeroBanner.tsx) | 57 | `AdminHeroBanner` (L10) |
| [src/components/admin/AdminOperationalCards.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminOperationalCards.tsx) | 327 | `AdminOperationalCards` (L21) |
| [src/components/admin/AdminSchoolLogo.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminSchoolLogo.tsx) | 134 | `AdminSchoolLogo` (L9) |
| [src/components/admin/AdminSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminSidebar.tsx) | 253 | `AdminMenuKey` (L25), `AdminSidebar` (L60) |
| [src/components/admin/AdminStaffEvaluationCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminStaffEvaluationCard.tsx) | 104 | `AdminStaffEvaluationCard` (L4) |
| [src/components/admin/AdminStaffRecentTable.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminStaffRecentTable.tsx) | 160 | `AdminStaffRecentTable` (L19) |
| [src/components/admin/AdminStatCards.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminStatCards.tsx) | 133 | `AdminStatCards` (L24) |
| [src/components/admin/AdminStudentStatusDonutCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminStudentStatusDonutCard.tsx) | 81 | `AdminStudentStatusDonutCard` (L4) |
| [src/components/admin/AdminSubjectAchievementCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminSubjectAchievementCard.tsx) | 76 | `AdminSubjectAchievementCard` (L4) |
| [src/components/admin/LeaveApprovalQueueTable.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/LeaveApprovalQueueTable.tsx) | 315 | `LeaveApprovalQueueTable` (L16) |
| [src/components/admin/LeaveDetailModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/LeaveDetailModal.tsx) | 200 | `LeaveDetailModal` (L16) |
| [src/components/admin/LeaveDistributionChartsCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/LeaveDistributionChartsCard.tsx) | 122 | `LeaveDistributionChartsCard` (L10) |
| [src/components/admin/LeaveStatCards.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/LeaveStatCards.tsx) | 133 | `LeaveStatCards` (L16) |
| [src/components/admin/StudentLeaveOverviewCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/StudentLeaveOverviewCard.tsx) | 126 | `StudentLeaveOverviewCard` (L15) |
| [src/components/attendance/DynamicQrAttendanceModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/attendance/DynamicQrAttendanceModal.tsx) | 621 | `DynamicQrAttendanceModalProps` (L29), `DynamicQrAttendanceModal` (L43) |
| [src/components/attendance/StudentIdCardModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/attendance/StudentIdCardModal.tsx) | 126 | `StudentIdCardModalProps` (L9), `StudentIdCardModal` (L18) |
| [src/components/attendance/StudentQrScannerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/attendance/StudentQrScannerModal.tsx) | 222 | `StudentQrScannerModalProps` (L18), `StudentQrScannerModal` (L29) |
| [src/components/common/Pagination.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/Pagination.tsx) | 182 | `PageSizeOption` (L8), `PaginationProps` (L10), `Pagination` (L21) |
| [src/components/common/PixelPet.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/PixelPet.tsx) | 69 | `PixelPet` (L8) |
| [src/components/common/QuickSearchModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/QuickSearchModal.tsx) | 135 | `QuickSearchModal` (L15) |
| [src/components/exam/StudentExamPlayerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/exam/StudentExamPlayerModal.tsx) | 479 | `StudentExamPlayerModal` (L38) |
| [src/components/mobile/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/index.ts) | 12 | *(Internal / Default Export)* |
| [src/components/mobile/TeacherMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileBottomNav.tsx) | 227 | `TeacherMobileBottomNav` (L16) |
| [src/components/mobile/TeacherMobileCalendarScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCalendarScreen.tsx) | 212 | `TeacherMobileCalendarScreen` (L17) |
| [src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx) | 270 | `MobileStudentSubmissionItem` (L8), `INITIAL_STUDENT_SUBMISSIONS` (L25), `TeacherMobileClassSubmissionsScreen` (L82) |
| [src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx) | 259 | `TeacherMobileCreateAssignmentScreen` (L20) |
| [src/components/mobile/TeacherMobileGradingListScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileGradingListScreen.tsx) | 293 | `MobileGradingAssignmentItem` (L11), `INITIAL_MOBILE_ASSIGNMENTS` (L32), `TeacherMobileGradingListScreen` (L91) |
| [src/components/mobile/TeacherMobileGradingSummaryScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileGradingSummaryScreen.tsx) | 201 | `TeacherMobileGradingSummaryScreen` (L13) |
| [src/components/mobile/TeacherMobileHomeScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileHomeScreen.tsx) | 222 | `TeacherMobileHomeScreen` (L21) |
| [src/components/mobile/TeacherMobileMoreMenuScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileMoreMenuScreen.tsx) | 198 | `TeacherMobileMoreMenuScreen` (L27) |
| [src/components/mobile/TeacherMobileRoomScoresScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileRoomScoresScreen.tsx) | 357 | `TeacherMobileRoomScoresScreen` (L33) |
| [src/components/mobile/TeacherMobileSchoolInfoScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileSchoolInfoScreen.tsx) | 416 | `TeacherMobileSchoolInfoScreen` (L28) |
| [src/components/mobile/TeacherMobileSubmissionDetailScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileSubmissionDetailScreen.tsx) | 260 | `TeacherMobileSubmissionDetailScreen` (L31) |
| [src/components/settings/SettingsCategoryCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsCategoryCard.tsx) | 107 | `SettingsCategoryCardProps` (L4), `SettingsCategoryCard` (L18) |
| [src/components/settings/SettingsHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsHeroBanner.tsx) | 28 | `SettingsHeroBanner` (L9) |
| [src/components/settings/SettingsSubModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsSubModal.tsx) | 162 | `SettingsSubModalProps` (L4), `SettingsSubModal` (L20) |
| [src/components/sgs/SgsRosterImportModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/sgs/SgsRosterImportModal.tsx) | 726 | `SgsRosterImportModal` (L33) |
| [src/components/sgs/SgsScoreExportModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/sgs/SgsScoreExportModal.tsx) | 243 | `SgsScoreExportModal` (L36) |
| [src/components/teacher/AdminTeacherBannerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AdminTeacherBannerModal.tsx) | 841 | `AdminTeacherBannerModal` (L39) |
| [src/components/teacher/ArtworkPreviewModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/ArtworkPreviewModal.tsx) | 674 | `ArtworkPreviewModalProps` (L16), `ArtworkPreviewModal` (L30) |
| [src/components/teacher/AssignmentBundlesModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AssignmentBundlesModal.tsx) | 271 | `AssignmentBundlesModal` (L19) |
| [src/components/teacher/AtRiskCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AtRiskCard.tsx) | 105 | `AtRiskCard` (L11) |
| [src/components/teacher/GradeDistributionBar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradeDistributionBar.tsx) | 81 | `GradeDistributionBar` (L9) |
| [src/components/teacher/GradingWorkspaceModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradingWorkspaceModal.tsx) | 615 | `GradingWorkspaceModal` (L38) |
| [src/components/teacher/IncompleteGradingCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/IncompleteGradingCard.tsx) | 64 | `IncompleteGradingCard` (L9) |
| [src/components/teacher/LowestAssignmentsCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/LowestAssignmentsCard.tsx) | 70 | `LowestAssignmentsCard` (L9) |
| [src/components/teacher/MobileVerticalAttendanceSheet.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/MobileVerticalAttendanceSheet.tsx) | 432 | `RollCallStatus` (L4), `RollCallStudentItem` (L6), `KUTCHAP_CLASS_ROSTERS` (L12), `MobileVerticalAttendanceSheet` (L86) |
| [src/components/teacher/PaperRegisterLedger.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/PaperRegisterLedger.tsx) | 1586 | `PaperLedgerMode` (L21), `AttendanceStatus` (L27), `PaperRegisterLedger` (L122) |
| [src/components/teacher/SgsClassroomMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/SgsClassroomMatrixModal.tsx) | 324 | `SgsClassroomMatrixModal` (L25) |
| [src/components/teacher/StudentNotesCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentNotesCard.tsx) | 117 | `StudentNotesCard` (L11) |
| [src/components/teacher/StudentRadarChart.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentRadarChart.tsx) | 173 | `StudentRadarChart` (L17) |
| [src/components/teacher/Submission3ColorMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/Submission3ColorMatrixModal.tsx) | 403 | `Submission3ColorMatrixModal` (L38) |
| [src/components/timetable/AddEditTimetableSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AddEditTimetableSlotModal.tsx) | 596 | `AddEditTimetableSlotModalProps` (L33), `AddEditTimetableSlotModal` (L55) |
| [src/components/timetable/AssignWaitingSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AssignWaitingSlotModal.tsx) | 289 | `AssignWaitingSlotModalProps` (L16), `AssignWaitingSlotModal` (L39) |
| [src/components/timetable/SubjectIconPickerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/SubjectIconPickerModal.tsx) | 280 | `SubjectIconPickerModalProps` (L20), `SubjectIconPickerModal` (L41) |

## Services (Business Logic & Storage)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/services/academicCalendarService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/academicCalendarService.ts) | 552 | `HolidayType` (L7), `DayOfWeek` (L8), `AcademicTermRecord` (L10), `SpecialHolidayRecord` (L24), `WeekendMakeupDayRecord` (L34), `AcademicCalendarConfig` (L46), `ACADEMIC_CALENDAR_EVENT` (L55), `THAI_MONTH_SHORT_MAP` (L57), `parseThaiDateToIso` (L75), `academicCalendarService` (L229) *(+3 รายการ)* |
| [src/services/assignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/assignmentService.ts) | 157 | `AssignmentRecord` (L4), `assignmentService` (L44) |
| [src/services/attendanceCorrelationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceCorrelationService.ts) | 1357 | `AttendanceStatusCode` (L16), `AttendanceRecordSource` (L24), `AttendanceAuditLog` (L29), `MorningAssemblyRecord` (L39), `PeriodAttendanceRecord` (L56), `ApprovedSchoolActivity` (L77), `ApprovedStudentLeave` (L87), `Attendance80Summary` (L99), `CorrelationChange` (L115), `CorrelationResult` (L127) *(+15 รายการ)* |
| [src/services/attendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceService.ts) | 257 | `AttendanceRecordItem` (L11), `attendanceService` (L76) |
| [src/services/authService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/authService.ts) | 390 | `AuthUser` (L6), `authService` (L56) |
| [src/services/behaviorService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/behaviorService.ts) | 216 | `BehaviorRecord` (L4), `XpTransactionRecord` (L15), `behaviorService` (L65) |
| [src/services/bellScheduleService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/bellScheduleService.ts) | 229 | `SchoolBellScheduleConfig` (L6), `BELL_SCHEDULE_STORAGE_KEY` (L17), `BELL_SCHEDULE_UPDATED_EVENT` (L18), `DEFAULT_BELL_SCHEDULE_CONFIG` (L20), `BellScheduleTimelineItem` (L31), `addMinutesToTimeStr` (L43), `calculateMinutesDifference` (L52), `generateBellScheduleTimeline` (L60), `bellScheduleService` (L228) |
| [src/services/calendarEventStorageService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/calendarEventStorageService.ts) | 572 | `CALENDAR_EVENTS_STORAGE_KEY` (L17), `MATRIX_STORAGE_KEY` (L18), `MATRIX_SLOTS_UPDATED_EVENT` (L19), `CalendarLegendColor` (L21), `CalendarEventItem` (L23), `INITIAL_OCTOBER_EVENTS` (L45), `parseThaiDateString` (L365), `convertHolidayToCalendarEvent` (L392), `convertMakeupDayToCalendarEvent` (L413), `calendarEventStorageService` (L435) |
| [src/services/classroomService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/classroomService.ts) | 686 | `getDeletedRoomsSet` (L9), `saveDeletedRoomsSet` (L24), `getLocalClassrooms` (L35), `TeacherAccountItem` (L84), `DEFAULT_TEACHER_ACCOUNTS` (L94), `INITIAL_SEED_CLASSROOMS` (L96), `classroomService` (L112) |
| [src/services/cleanSlateService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cleanSlateService.ts) | 220 | `CleanSlatePurgeResult` (L5), `TRANSACTIONAL_STORAGE_KEYS` (L16), `PRESERVED_INFRASTRUCTURE_KEYS` (L61), `cleanSlateService` (L219) |
| [src/services/cloudDataService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cloudDataService.ts) | 445 | `CloudStoreRecord` (L8), `CloudSyncState` (L14), `cloudDataService` (L444) |
| [src/services/coursesCurriculumService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/coursesCurriculumService.ts) | 704 | `MediaType` (L7), `UnitMediaItem` (L9), `CurriculumUnit` (L23), `CourseCurriculumRecord` (L35), `TrashMediaItem` (L50), `calculatePeriodsPerWeek` (L69), `coursesCurriculumService` (L702) |
| [src/services/gachaService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaService.ts) | 647 | `GachaRarity` (L9), `GachaBuddy` (L17), `GachaPullResult` (L39), `GachaState` (L46), `BUDDY_CHANGED_EVENT` (L62), `GACHA_RATES` (L64), `ALL_BUDDIES` (L74), `gachaService` (L440) |
| [src/services/gamificationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gamificationService.ts) | 172 | `gamificationService` (L68) |
| [src/services/homeVisitService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/homeVisitService.ts) | 292 | `VisitStatus` (L6), `SdqLevel` (L7), `CctSyncStatus` (L8), `HouseholdMember` (L11), `StudentAttendanceLeavePolicy` (L28), `HomeVisitRecord` (L35), `homeVisitService` (L153) |
| [src/services/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/index.ts) | 14 | *(Internal / Default Export)* |
| [src/services/messagingService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/messagingService.ts) | 1435 | `ChatGroupType` (L14), `ChatMember` (L16), `ChatAttachmentMeta` (L27), `ChatMessage` (L37), `ChatGroup` (L64), `StudentTransferPayload` (L84), `StudentTransferResult` (L92), `CHAT_GROUPS_EVENT` (L108), `STUDENT_TRANSFERRED_EVENT` (L109), `CourseClassroomMapping` (L112) *(+2 รายการ)* |
| [src/services/onlineQuizService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/onlineQuizService.ts) | 388 | `QuizOptionItem` (L12), `QuizQuestionItem` (L17), `StudentQuizAttemptRecord` (L27), `OnlineQuizConfig` (L44), `DEFAULT_SAMPLE_QUESTIONS` (L65), `onlineQuizService` (L387) |
| [src/services/qrAttendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/qrAttendanceService.ts) | 306 | `DynamicQrPayload` (L11), `StudentCardQrPayload` (L24), `QrVerificationResult` (L32), `QR_ROTATION_INTERVAL_SECONDS` (L40), `qrAttendanceService` (L305) |
| [src/services/schoolLeaveSettingsService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolLeaveSettingsService.ts) | 170 | `LeaveTypeQuota` (L5), `SchoolLeaveSettings` (L16), `SCHOOL_LEAVE_SETTINGS_EVENT` (L36), `DEFAULT_LEAVE_SETTINGS` (L38), `schoolLeaveSettingsService` (L91) |
| [src/services/schoolPoliciesService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolPoliciesService.ts) | 144 | `SchoolAttendancePolicyConfig` (L5), `SchoolGradingPolicyConfig` (L14), `SchoolNotificationConfig` (L24), `DEFAULT_ATTENDANCE_POLICY` (L34), `DEFAULT_GRADING_POLICY` (L43), `DEFAULT_NOTIFICATION_CONFIG` (L53), `SCHOOL_POLICY_SYNC_EVENT` (L66), `schoolPoliciesService` (L143) |
| [src/services/schoolStaffLeaveService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolStaffLeaveService.ts) | 324 | `StaffLeaveType` (L7), `StaffLeaveStatus` (L15), `SubstituteAssignment` (L20), `StaffLeaveRequest` (L30), `StaffLeaveQuotaStats` (L53), `STAFF_LEAVE_EVENT` (L68), `schoolStaffLeaveService` (L206) |
| [src/services/scoreService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/scoreService.ts) | 351 | `ScoreRecord` (L4), `ScoreAuditLogRecord` (L17), `scoreService` (L78) |
| [src/services/sgsExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsExportService.ts) | 161 | `SgsSnapshotRecord` (L3), `sgsExportService` (L51) |
| [src/services/sgsImportExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsImportExportService.ts) | 482 | `SgsImportRowStatus` (L11), `SgsParsedRow` (L13), `SgsImportDryRunSummary` (L30), `SgsScoreExportRow` (L45), `ExistingStudentLookup` (L58), `ParsedThaiName` (L78), `parseThaiFullName` (L86), `parseSgsClipboardText` (L153), `evaluateSgsImportDryRun` (L292), `generateSgsScoreExportRows` (L390) *(+2 รายการ)* |
| [src/services/sgsRosterAndSubmissionService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsRosterAndSubmissionService.ts) | 1075 | `StudentTransferState` (L10), `StudentGender` (L11), `SgsInsertPosition` (L12), `SgsStudentRecord` (L14), `TermAssignmentItem` (L38), `CentralRosterSyncMeta` (L51), `SubmissionCellStatus` (L57), `StudentWorkSubmission` (L63), `sgsRosterAndSubmissionService` (L150), `R2CourseStorageSummary` (L1053) |
| [src/services/studentAffairsCouncilService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentAffairsCouncilService.ts) | 798 | `AssemblyExceptionRecord` (L9), `DisciplineRecord` (L18), `StudentLeaveRequest` (L31), `CouncilCandidateParty` (L46), `CouncilActivity` (L58), `StudentSuggestion` (L68), `AffairsTeacherRole` (L80), `AffairsRolePermission` (L82), `DEFAULT_ROLE_PERMISSIONS` (L103), `studentAffairsCouncilService` (L383) |
| [src/services/studentBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentBannerService.ts) | 258 | `StudentBannerKey` (L7), `StudentBannerItem` (L9), `STUDENT_BANNERS_EVENT` (L24), `DEFAULT_STUDENT_BANNERS` (L26), `studentBannerService` (L65) |
| [src/services/studentExpService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentExpService.ts) | 178 | `STUDENT_EXP_EVENT` (L12), `StudentExpBreakdown` (L14), `StudentExpCalculation` (L26), `calculateStudentExp` (L39), `dispatchStudentExpUpdated` (L173) |
| [src/services/studentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentService.ts) | 579 | `StudentRecord` (L4), `defaultStudents` (L23), `mockStudentsByRoom` (L25), `getAlternateRoomKey` (L29), `formatClassroomLabel` (L46), `parseThaiStudentName` (L116), `studentService` (L153) |
| [src/services/teacherBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherBannerService.ts) | 294 | `TeacherBannerKey` (L7), `TeacherBannerItem` (L9), `TEACHER_BANNERS_EVENT` (L29), `DEFAULT_TEACHER_BANNERS` (L31), `teacherBannerService` (L85) |
| [src/services/teacherCalendarTodoService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCalendarTodoService.ts) | 481 | `DayWorkStatus` (L3), `DayTaskDetail` (L5), `CalendarDayStatus` (L17), `DailyTodoItem` (L30), `UpcomingMilestone` (L45), `teacherCalendarTodoService` (L85) |
| [src/services/teacherCopilotService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCopilotService.ts) | 759 | `TimeOfDayScenario` (L16), `UrgentPriorityLevel` (L22), `DeepLinkTargetView` (L24), `CrossViewNavigationPayload` (L43), `UrgentTriageItem` (L54), `DailyStepItem` (L70), `GrillMeRoundRecord` (L82), `GRILL_ME_8_ROUNDS_LOG` (L133), `teacherCopilotService` (L289) |
| [src/services/teacherCourseAssignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCourseAssignmentService.ts) | 647 | `TeachingSubjectInfo` (L14), `TeachingCourseClassroom` (L23), `getDynamicTeachingSubjects` (L33), `TEACHER_SUBJECTS_LIST` (L61), `HOMEROOM_ADVISORY` (L77), `SubmissionChannelType` (L89), `GradingQueueItem` (L91), `StudentBundleProgress` (L121), `AssignmentBundleConfig` (L134), `calculateBundleScore` (L148) *(+1 รายการ)* |
| [src/services/trashService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/trashService.ts) | 159 | `TRASH_SYNC_EVENT` (L6), `trashService` (L26) |
| [src/services/types.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/types.ts) | 117 | 📌 *CLASSROOM & ROSTER SCHEMAS* (L3), `ClassroomCreateSchema` (L4), `ClassroomCreateInput` (L14), `StudentCreateSchema` (L16), `StudentCreateInput` (L23), 📌 *ASSIGNMENT & EXAM SCHEMAS* (L25), `AssignmentCreateSchema` (L26), `AssignmentCreateInput` (L34), 📌 *SCORE & AUDIT LOG SCHEMAS* (L36), `ScoreUpdateSchema` (L37) *(+17 รายการ)* |

## Config & Constants

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/config/feedbackStickersCatalog.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/feedbackStickersCatalog.ts) | 584 | `FeedbackStrandId` (L10), `FeedbackStrandCategory` (L21), `FEEDBACK_STRAND_CATALOG` (L32), `STORAGE_KEYS` (L202), `detectFeedbackStrand` (L214), `getCategoryById` (L342), `getTeacherPreferredStrand` (L350), `setTeacherPreferredStrand` (L367), `getCustomFeedbackStickers` (L381), `addCustomFeedbackSticker` (L405) *(+3 รายการ)* |
| [src/config/m1SgsLookup.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/m1SgsLookup.ts) | 1253 | `M1SgsLookupEntry` (L5), `M1_SGS_STUDENT_LOOKUP` (L12), `getM1SgsStudentInfo` (L1239), `isGrade1SgsStudentCode` (L1244) |
| [src/config/schoolRoles.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/schoolRoles.ts) | 641 | `SchoolUserRole` (L1), `SchoolRoleProfile` (L8), `SchoolFontFamily` (L24), `MorningToClassSyncMode` (L31), `SchoolBrandingSettings` (L33), `SmsUserAccount` (L74), `DEFAULT_KUTCHAP_LOGO_SVG` (L89), `KUTCHAP_SCHOOL_INFO` (L127), `clampFontSize11To20` (L170), `applySchoolBrandingAndTypography` (L175) *(+8 รายการ)* |
| [src/config/schoolSettings.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/schoolSettings.ts) | 10 | *(Internal / Default Export)* |
| [src/config/subjectIcons.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/subjectIcons.ts) | 642 | `SubjectIconConfig` (L7), `ALL_SUBJECT_ICONS` (L22), `DEFAULT_SUBJECT_ICON` (L360), `getSubjectIcon` (L387), `SubjectBadgeSize` (L562), `getSubjectBadgeClasses` (L564), `SubjectBadgeRenderProps` (L579), `getSubjectBadgeProps` (L590), `renderSubjectIconBadge` (L606), `SubjectIconBadge` (L624) |

## Utilities

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/utils/fuzzyNameMatcher.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/fuzzyNameMatcher.ts) | 168 | `normalizeWhitespace` (L14), `stripHonorificPrefix` (L21), `levenshteinDistance` (L29), `calculateNameSimilarity` (L57), `TeacherMatchResult` (L80), `matchTeacherWithDatabase` (L91) |
| [src/utils/googleDriveUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/googleDriveUtils.ts) | 208 | `GoogleDriveValidationResult` (L9), `RecommendedFolderTemplate` (L25), `validateGoogleDriveUrl` (L40), `FolderPathOptions` (L158), `generateRecommendedFolderPath` (L170) |
| [src/utils/gradeLevelTheme.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/gradeLevelTheme.ts) | 153 | `GradeLevelTheme` (L5), `GRADE_LEVEL_THEMES` (L21), `getGradeLevelTheme` (L133), `GRADE_LEVEL_LIST` (L152) |
| [src/utils/imageCompressor.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/imageCompressor.ts) | 363 | `CompressionOptions` (L5), `CompressedImageResult` (L16), `DEFAULT_BANNER_COMPRESSION_OPTIONS` (L26), `estimateBase64SizeBytes` (L54), `dataUrlToBlob` (L84), `calculateAspectRatioDimensions` (L131), `calculateProportionalDimensions` (L155), `formatBytes` (L160), `isImageFile` (L172), `DEFAULT_LOGO_COMPRESSION_OPTIONS` (L338) |
| [src/utils/indexedDbAdapter.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/indexedDbAdapter.ts) | 392 | `OutboxSyncStatus` (L9), `OutboxItem` (L11), `RetryPolicyConfig` (L23), `DEFAULT_RETRY_CONFIG` (L31), `computeNextBackoffMs` (L42), `canonicalJsonStringify` (L58), `indexedDbAdapter` (L391) |
| [src/utils/timetableDateUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/timetableDateUtils.ts) | 666 | `TimetableColorTheme` (L4), `TimetableMatrixSlot` (L13), `TaskWidgetItem` (L33), `CalendarEventItem` (L42), `THAI_MONTHS_SHORT` (L49), `WeekDayInfo` (L64), `ComputedWeekInfo` (L70), `BANGKOK_TIMEZONE` (L82), `getBangkokNow` (L84), `getBangkokTodayString` (L90) *(+6 รายการ)* |

## Type Definitions

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/types/viewModels.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/types/viewModels.ts) | 237 | `AtRiskStudent` (L5), `IncompleteGradingItem` (L17), `LowestAssignmentItem` (L25), `GradeDistributionItem` (L32), `RadarDimensionMetric` (L38), `StudentProfileDetail` (L45), `StudentQuestItem` (L64), `SarCourseSummary` (L75), `SarGradeMatrixRow` (L88), `TeachingClassSummary` (L107) *(+10 รายการ)* |

## Other

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/App.tsx) | 872 | `App` (L81) |
| [src/lib/supabase.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/supabase.ts) | 33 | `isSupabaseConfigured` (L16), `supabase` (L20), `logDbOperation` (L28) |
| [src/lib/universalAdapter.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/universalAdapter.ts) | 567 | `RealtimePayload` (L16), `StorageDriver` (L22), `UniversalAdapterConfig` (L29), `UniversalAdapter` (L43), `getStorageDriver` (L61), `clearMemoryStore` (L87), `getMemoryStore` (L88), `readStorage` (L90), `writeStorage` (L101), `removeStorage` (L110) *(+3 รายการ)* |
| [src/main.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/main.tsx) | 28 | *(Internal / Default Export)* |

