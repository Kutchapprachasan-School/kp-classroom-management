# Codebase Index & Symbol Location Map (สารบัญโครงสร้างโค้ด)

> **กฎเหล็กเพื่อประสิทธิภาพ Context และ Token (Rule 6)**:
> สารบัญนี้ทำหน้าที่เป็น Navigation Map เพื่อให้ AI Assistant และผู้พัฒนาสามารถตรวจสอบตำแหน่งไฟล์, สัญลักษณ์หลัก (Components / Functions / Types), และช่วงบรรทัด (Line Ranges) ได้ทันที **โดยไม่ต้องเปิดดูทั้งไฟล์ (ห้าม Full View)**
> **ข้อบังคับ**: ทุกครั้งที่มีการเพิ่มไฟล์ใหม่, ลบไฟล์, หรือปรับแก้โครงสร้างหลัก ต้องรัน `node scripts/index_codebase.mjs` เพื่ออัปเดตสารบัญนี้เสมอ

*อัปเดตล่าสุด: 18/10/2569 08:51:56 | รวมทั้งหมด 183 ไฟล์*

---

## Views (หน้าระบบ)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/views/AcademicTermsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AcademicTermsView.tsx) | 2015 | `ActivityCategory` (L50), `CalendarLegendColor` (L52), `CalendarEventItem` (L54), `parseHolidayDate` (L83), `convertHolidayToCalendarEvent` (L109), `getThaiDayOfWeekName` (L128), `formatThaiFullDate` (L135), `getMingCuteEventIcon` (L169), `AcademicTermsView` (L281) |
| [src/views/AdminExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AdminExecutiveDashboardView.tsx) | 312 | `AdminExecutiveDashboardView` (L39) |
| [src/views/AssignmentManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AssignmentManagementView.tsx) | 839 | `QuickFilterMode` (L31), `AssignmentManagementView` (L38) |
| [src/views/ClassroomAttendanceView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomAttendanceView.tsx) | 1624 | `ClassroomAttendanceViewProps` (L54), `TeacherCourseOption` (L59), `ClassroomAttendanceView` (L81) |
| [src/views/ClassroomManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomManagementView.tsx) | 1523 | `ImportPreviewRow` (L51), `ClassroomManagementView` (L63) |
| [src/views/ClassroomsRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomsRosterView.tsx) | 1949 | `ClassroomsRosterView` (L56) |
| [src/views/CoursesCurriculumView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CoursesCurriculumView.tsx) | 2027 | `CoursesCurriculumViewProps` (L37), `CoursesCurriculumView` (L41) |
| [src/views/CrossClassSarView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CrossClassSarView.tsx) | 1627 | `CrossClassSarView` (L79) |
| [src/views/EndTermReadinessView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/EndTermReadinessView.tsx) | 580 | `EndTermReadinessView` (L72) |
| [src/views/ExamManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ExamManagementView.tsx) | 2974 | `ExtendedExamItem` (L72), `ExamManagementView` (L87) |
| [src/views/HomeVisitSdqView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/HomeVisitSdqView.tsx) | 1355 | `HomeVisitSdqView` (L27) |
| [src/views/LessonPlansView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/LessonPlansView.tsx) | 1775 | `UnitStatus` (L32), `EvaluationItem` (L34), `UnitPlanItem` (L41), `CourseFilterOption` (L86), `LessonPlansView` (L95) |
| [src/views/MessagesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MessagesView.tsx) | 1455 | `MessagesView` (L46) |
| [src/views/MorningAssemblyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MorningAssemblyView.tsx) | 1299 | `MorningAssemblyViewProps` (L54), `MorningAssemblyView` (L90) |
| [src/views/SchoolLeaveExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolLeaveExecutiveDashboardView.tsx) | 292 | `SchoolLeaveExecutiveDashboardView` (L43) |
| [src/views/SchoolPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolPortalView.tsx) | 674 | `TeacherLoginChannel` (L22), `SchoolPortalView` (L37) |
| [src/views/SettingsBackupView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SettingsBackupView.tsx) | 3513 | `SettingsKey` (L121), `SettingsBackupView` (L147) |
| [src/views/StudentAffairsCouncilView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentAffairsCouncilView.tsx) | 875 | `StudentAffairsCouncilView` (L38) |
| [src/views/StudentArenaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentArenaView.tsx) | 447 | `StudentArenaView` (L45) |
| [src/views/StudentCouncilAffairsPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentCouncilAffairsPortalView.tsx) | 445 | `StudentCouncilAffairsPortalView` (L27) |
| [src/views/StudentDetailView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentDetailView.tsx) | 492 | `StudentDetailView` (L31) |
| [src/views/StudentGachaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGachaView.tsx) | 1074 | `StudentGachaView` (L26) |
| [src/views/StudentGradebookView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGradebookView.tsx) | 998 | `StudentGradebookView` (L71) |
| [src/views/StudentHomeVisitFormView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentHomeVisitFormView.tsx) | 555 | `StudentHomeVisitFormView` (L28) |
| [src/views/StudentMissionsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentMissionsView.tsx) | 849 | `StudentMissionsView` (L31) |
| [src/views/StudentPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentPortalView.tsx) | 317 | `StudentPortalView` (L47) |
| [src/views/StudentRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentRosterView.tsx) | 2052 | `StudentRosterView` (L59) |
| [src/views/StudentTrophyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentTrophyView.tsx) | 419 | `TrophyBadgeItem` (L26), `StudentTrophyView` (L86) |
| [src/views/TeacherGlobalDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherGlobalDashboardView.tsx) | 118 | `TeacherGlobalDashboardView` (L31) |
| [src/views/TeacherOverviewView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherOverviewView.tsx) | 2442 | `ClassSubTab` (L89), `TeacherOverviewView` (L99) |
| [src/views/TimetableView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TimetableView.tsx) | 1605 | `TimetableView` (L119) |
| [src/views/TrashManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TrashManagementView.tsx) | 481 | `TrashManagementView` (L21) |
| [src/views/UserAccountsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/UserAccountsView.tsx) | 553 | `UserAccountsView` (L38) |

## Layout Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/layout/PageHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/PageHeroBanner.tsx) | 196 | `PageHeroBannerProps` (L19), `PageHeroBanner` (L50) |
| [src/components/layout/TeacherHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherHeader.tsx) | 1173 | `TeacherHeader` (L76) |
| [src/components/layout/TeacherSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherSidebar.tsx) | 585 | `TeacherViewKey` (L51), `TeacherSidebar` (L110) |

## Dashboard Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/dashboard/TeacherAnnouncementsWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherAnnouncementsWidget.tsx) | 100 | `TeacherAnnouncementsWidget` (L19) |
| [src/components/dashboard/TeacherBottomBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherBottomBanner.tsx) | 74 | `TeacherBottomBanner` (L19) |
| [src/components/dashboard/TeacherCalendarActivityWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherCalendarActivityWidget.tsx) | 555 | `TeacherCalendarActivityWidget` (L39) |
| [src/components/dashboard/TeacherHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherHeroBanner.tsx) | 79 | `TeacherHeroBanner` (L19) |
| [src/components/dashboard/TeacherHomeHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherHomeHeroBanner.tsx) | 131 | `TeacherHomeHeroBannerProps` (L15), `TeacherHomeHeroBanner` (L24) |
| [src/components/dashboard/TeacherMoreAccountMobileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherMoreAccountMobileView.tsx) | 175 | `TeacherMoreAccountMobileView` (L23) |
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
| [src/components/student/StudentAnimeAppView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnimeAppView.tsx) | 1405 | `AnimeAppScreen` (L32), `StudentAnimeAppView` (L49) |
| [src/components/student/StudentAnnouncementsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnnouncementsView.tsx) | 369 | `StudentAnnouncementsView` (L32) |
| [src/components/student/StudentContactTeacherView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentContactTeacherView.tsx) | 165 | `StudentContactTeacherView` (L15) |
| [src/components/student/StudentCoursesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentCoursesView.tsx) | 121 | `StudentCoursesView` (L18) |
| [src/components/student/StudentHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHeader.tsx) | 246 | `StudentHeader` (L36) |
| [src/components/student/StudentHomeDashboard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHomeDashboard.tsx) | 705 | `StudentHomeDashboard` (L54) |
| [src/components/student/StudentMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileBottomNav.tsx) | 96 | `StudentMobileBottomNav` (L14) |
| [src/components/student/StudentMobileCareView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileCareView.tsx) | 1250 | `MobileScreenKey` (L33), `StudentMobileCareView` (L100) |
| [src/components/student/StudentProfileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentProfileView.tsx) | 163 | `StudentProfileView` (L15) |
| [src/components/student/StudentSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentSidebar.tsx) | 310 | `StudentTabKey` (L28), `StudentSidebar` (L60) |
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
| [src/components/admin/AdminSchoolLogo.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminSchoolLogo.tsx) | 31 | `AdminSchoolLogo` (L9) |
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
| [src/components/attendance/StudentIdCardModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/attendance/StudentIdCardModal.tsx) | 127 | `StudentIdCardModalProps` (L10), `StudentIdCardModal` (L19) |
| [src/components/attendance/StudentQrScannerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/attendance/StudentQrScannerModal.tsx) | 222 | `StudentQrScannerModalProps` (L18), `StudentQrScannerModal` (L29) |
| [src/components/common/AppLoadingScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/AppLoadingScreen.tsx) | 115 | `AppLoadingScreen` (L10) |
| [src/components/common/Pagination.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/Pagination.tsx) | 182 | `PageSizeOption` (L8), `PaginationProps` (L10), `Pagination` (L21) |
| [src/components/common/PixelPet.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/PixelPet.tsx) | 69 | `PixelPet` (L8) |
| [src/components/common/QuickSearchModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/QuickSearchModal.tsx) | 135 | `QuickSearchModal` (L15) |
| [src/components/common/ThaiMiniDatePicker.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/ThaiMiniDatePicker.tsx) | 392 | `ThaiMiniDatePickerProps` (L6), `parseThaiDateString` (L37), `formatThaiDate` (L74), `formatIsoDate` (L82), `ThaiMiniDatePicker` (L88) |
| [src/components/exam/StudentExamPlayerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/exam/StudentExamPlayerModal.tsx) | 479 | `StudentExamPlayerModal` (L38) |
| [src/components/mobile/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/index.ts) | 12 | *(Internal / Default Export)* |
| [src/components/mobile/TeacherMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileBottomNav.tsx) | 248 | `TeacherMobileBottomNav` (L17) |
| [src/components/mobile/TeacherMobileCalendarScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCalendarScreen.tsx) | 212 | `TeacherMobileCalendarScreen` (L17) |
| [src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx) | 236 | `MobileStudentSubmissionItem` (L9), `INITIAL_STUDENT_SUBMISSIONS` (L26), `TeacherMobileClassSubmissionsScreen` (L28) |
| [src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx) | 259 | `TeacherMobileCreateAssignmentScreen` (L20) |
| [src/components/mobile/TeacherMobileGradingListScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileGradingListScreen.tsx) | 236 | `MobileGradingAssignmentItem` (L11), `INITIAL_MOBILE_ASSIGNMENTS` (L32), `TeacherMobileGradingListScreen` (L34) |
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
| [src/components/teacher/ArtworkPreviewModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/ArtworkPreviewModal.tsx) | 675 | `ArtworkPreviewModalProps` (L17), `ArtworkPreviewModal` (L31) |
| [src/components/teacher/AssignmentBundlesModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AssignmentBundlesModal.tsx) | 271 | `AssignmentBundlesModal` (L19) |
| [src/components/teacher/AtRiskCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AtRiskCard.tsx) | 105 | `AtRiskCard` (L11) |
| [src/components/teacher/GradeDistributionBar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradeDistributionBar.tsx) | 81 | `GradeDistributionBar` (L9) |
| [src/components/teacher/GradingWorkspaceModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradingWorkspaceModal.tsx) | 615 | `GradingWorkspaceModal` (L38) |
| [src/components/teacher/IncompleteGradingCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/IncompleteGradingCard.tsx) | 64 | `IncompleteGradingCard` (L9) |
| [src/components/teacher/LowestAssignmentsCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/LowestAssignmentsCard.tsx) | 70 | `LowestAssignmentsCard` (L9) |
| [src/components/teacher/MobileVerticalAttendanceSheet.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/MobileVerticalAttendanceSheet.tsx) | 387 | `RollCallStatus` (L5), `RollCallStudentItem` (L7), `KUTCHAP_CLASS_ROSTERS` (L13), `MobileVerticalAttendanceSheet` (L30) |
| [src/components/teacher/PaperRegisterLedger.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/PaperRegisterLedger.tsx) | 1719 | `PaperLedgerMode` (L25), `AttendanceStatus` (L31), `PaperRegisterLedger` (L214) |
| [src/components/teacher/SgsClassroomMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/SgsClassroomMatrixModal.tsx) | 324 | `SgsClassroomMatrixModal` (L25) |
| [src/components/teacher/StudentNotesCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentNotesCard.tsx) | 117 | `StudentNotesCard` (L11) |
| [src/components/teacher/StudentRadarChart.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentRadarChart.tsx) | 173 | `StudentRadarChart` (L17) |
| [src/components/teacher/Submission3ColorMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/Submission3ColorMatrixModal.tsx) | 403 | `Submission3ColorMatrixModal` (L38) |
| [src/components/timetable/AddEditTimetableSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AddEditTimetableSlotModal.tsx) | 596 | `AddEditTimetableSlotModalProps` (L33), `AddEditTimetableSlotModal` (L55) |
| [src/components/timetable/AssignWaitingSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AssignWaitingSlotModal.tsx) | 412 | `AssignWaitingSlotModalProps` (L24), `AssignWaitingSlotModal` (L53) |
| [src/components/timetable/SubjectIconPickerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/SubjectIconPickerModal.tsx) | 280 | `SubjectIconPickerModalProps` (L20), `SubjectIconPickerModal` (L41) |

## Services (Business Logic & Storage)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/services/academicCalendarService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/academicCalendarService.ts) | 552 | `HolidayType` (L7), `DayOfWeek` (L8), `AcademicTermRecord` (L10), `SpecialHolidayRecord` (L24), `WeekendMakeupDayRecord` (L34), `AcademicCalendarConfig` (L46), `ACADEMIC_CALENDAR_EVENT` (L55), `THAI_MONTH_SHORT_MAP` (L57), `parseThaiDateToIso` (L75), `academicCalendarService` (L229) *(+3 รายการ)* |
| [src/services/assignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/assignmentService.ts) | 157 | `AssignmentRecord` (L4), `assignmentService` (L44) |
| [src/services/attendanceCorrelationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceCorrelationService.ts) | 1441 | `AttendanceStatusCode` (L16), `AttendanceRecordSource` (L24), `AttendanceAuditLog` (L29), `MorningAssemblyRecord` (L39), `PeriodAttendanceRecord` (L56), `ApprovedSchoolActivity` (L77), `ApprovedStudentLeave` (L87), `Attendance80Summary` (L99), `CorrelationChange` (L115), `CorrelationResult` (L127) *(+15 รายการ)* |
| [src/services/attendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceService.ts) | 257 | `AttendanceRecordItem` (L11), `attendanceService` (L76) |
| [src/services/authService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/authService.ts) | 366 | `AuthUser` (L6), `authService` (L56) |
| [src/services/behaviorService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/behaviorService.ts) | 218 | `BehaviorRecord` (L4), `XpTransactionRecord` (L15), `behaviorService` (L65) |
| [src/services/bellScheduleService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/bellScheduleService.ts) | 229 | `SchoolBellScheduleConfig` (L6), `BELL_SCHEDULE_STORAGE_KEY` (L17), `BELL_SCHEDULE_UPDATED_EVENT` (L18), `DEFAULT_BELL_SCHEDULE_CONFIG` (L20), `BellScheduleTimelineItem` (L31), `addMinutesToTimeStr` (L43), `calculateMinutesDifference` (L52), `generateBellScheduleTimeline` (L60), `bellScheduleService` (L228) |
| [src/services/calendarEventStorageService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/calendarEventStorageService.ts) | 250 | `CALENDAR_EVENTS_STORAGE_KEY` (L17), `MATRIX_STORAGE_KEY` (L18), `MATRIX_SLOTS_UPDATED_EVENT` (L19), `CalendarLegendColor` (L21), `CalendarEventItem` (L23), `INITIAL_OCTOBER_EVENTS` (L45), `parseThaiDateString` (L47), `convertHolidayToCalendarEvent` (L74), `convertMakeupDayToCalendarEvent` (L95), `calendarEventStorageService` (L117) |
| [src/services/classroomService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/classroomService.ts) | 747 | `getDeletedRoomsSet` (L9), `saveDeletedRoomsSet` (L24), `getLocalClassrooms` (L35), `TeacherAccountItem` (L86), `DEFAULT_TEACHER_ACCOUNTS` (L96), `INITIAL_SEED_CLASSROOMS` (L98), `invalidateClassroomCache` (L121), `classroomService` (L128) |
| [src/services/cleanSlateService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cleanSlateService.ts) | 211 | `CleanSlatePurgeResult` (L5), `TRANSACTIONAL_STORAGE_KEYS` (L16), `PRESERVED_INFRASTRUCTURE_KEYS` (L61), `cleanSlateService` (L210) |
| [src/services/cloudDataService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cloudDataService.ts) | 616 | `CloudStoreRecord` (L8), `CloudSyncState` (L14), `cloudDataService` (L615) |
| [src/services/coursesCurriculumService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/coursesCurriculumService.ts) | 726 | `MediaType` (L9), `UnitMediaItem` (L11), `CurriculumUnit` (L25), `CourseCurriculumRecord` (L37), `TrashMediaItem` (L52), `calculatePeriodsPerWeek` (L71), `coursesCurriculumService` (L724) |
| [src/services/gachaService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaService.ts) | 647 | `GachaRarity` (L9), `GachaBuddy` (L17), `GachaPullResult` (L39), `GachaState` (L46), `BUDDY_CHANGED_EVENT` (L62), `GACHA_RATES` (L64), `ALL_BUDDIES` (L74), `gachaService` (L440) |
| [src/services/gachaSkillEngine.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaSkillEngine.ts) | 271 | `ActiveBuddyBuffs` (L13), `BuddySkillState` (L26), `BUDDY_SKILL_ACTIVATED_EVENT` (L34), `gachaSkillEngine` (L36) |
| [src/services/gamificationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gamificationService.ts) | 172 | `gamificationService` (L68) |
| [src/services/homeVisitService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/homeVisitService.ts) | 292 | `VisitStatus` (L6), `SdqLevel` (L7), `CctSyncStatus` (L8), `HouseholdMember` (L11), `StudentAttendanceLeavePolicy` (L28), `HomeVisitRecord` (L35), `homeVisitService` (L153) |
| [src/services/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/index.ts) | 14 | *(Internal / Default Export)* |
| [src/services/messagingService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/messagingService.ts) | 1546 | `ChatGroupType` (L17), `ChatMember` (L19), `ChatAttachmentMeta` (L30), `ChatMessage` (L40), `ChatGroup` (L67), `StudentTransferPayload` (L87), `StudentTransferResult` (L95), `CHAT_GROUPS_EVENT` (L111), `STUDENT_TRANSFERRED_EVENT` (L112), `CourseClassroomMapping` (L115) *(+2 รายการ)* |
| [src/services/onlineQuizService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/onlineQuizService.ts) | 388 | `QuizOptionItem` (L12), `QuizQuestionItem` (L17), `StudentQuizAttemptRecord` (L27), `OnlineQuizConfig` (L44), `DEFAULT_SAMPLE_QUESTIONS` (L65), `onlineQuizService` (L387) |
| [src/services/qrAttendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/qrAttendanceService.ts) | 306 | `DynamicQrPayload` (L11), `StudentCardQrPayload` (L24), `QrVerificationResult` (L32), `QR_ROTATION_INTERVAL_SECONDS` (L40), `qrAttendanceService` (L305) |
| [src/services/schoolLeaveSettingsService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolLeaveSettingsService.ts) | 170 | `LeaveTypeQuota` (L5), `SchoolLeaveSettings` (L16), `SCHOOL_LEAVE_SETTINGS_EVENT` (L36), `DEFAULT_LEAVE_SETTINGS` (L38), `schoolLeaveSettingsService` (L91) |
| [src/services/schoolPoliciesService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolPoliciesService.ts) | 144 | `SchoolAttendancePolicyConfig` (L5), `SchoolGradingPolicyConfig` (L14), `SchoolNotificationConfig` (L24), `DEFAULT_ATTENDANCE_POLICY` (L34), `DEFAULT_GRADING_POLICY` (L43), `DEFAULT_NOTIFICATION_CONFIG` (L53), `SCHOOL_POLICY_SYNC_EVENT` (L66), `schoolPoliciesService` (L143) |
| [src/services/schoolStaffLeaveService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolStaffLeaveService.ts) | 324 | `StaffLeaveType` (L7), `StaffLeaveStatus` (L15), `SubstituteAssignment` (L20), `StaffLeaveRequest` (L30), `StaffLeaveQuotaStats` (L53), `STAFF_LEAVE_EVENT` (L68), `schoolStaffLeaveService` (L206) |
| [src/services/scoreService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/scoreService.ts) | 355 | `ScoreRecord` (L4), `ScoreAuditLogRecord` (L17), `scoreService` (L78) |
| [src/services/sgsExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsExportService.ts) | 161 | `SgsSnapshotRecord` (L3), `sgsExportService` (L51) |
| [src/services/sgsImportExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsImportExportService.ts) | 482 | `SgsImportRowStatus` (L11), `SgsParsedRow` (L13), `SgsImportDryRunSummary` (L30), `SgsScoreExportRow` (L45), `ExistingStudentLookup` (L58), `ParsedThaiName` (L78), `parseThaiFullName` (L86), `parseSgsClipboardText` (L153), `evaluateSgsImportDryRun` (L292), `generateSgsScoreExportRows` (L390) *(+2 รายการ)* |
| [src/services/sgsRosterAndSubmissionService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsRosterAndSubmissionService.ts) | 1064 | `StudentTransferState` (L12), `StudentGender` (L13), `SgsInsertPosition` (L14), `SgsStudentRecord` (L16), `TermAssignmentItem` (L40), `CentralRosterSyncMeta` (L53), `SubmissionCellStatus` (L59), `StudentWorkSubmission` (L65), `INITIAL_TERM_ASSIGNMENTS` (L91), `INITIAL_SUBMISSIONS` (L93) *(+2 รายการ)* |
| [src/services/studentAffairsCouncilService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentAffairsCouncilService.ts) | 565 | `AssemblyExceptionRecord` (L9), `DisciplineRecord` (L18), `StudentLeaveRequest` (L31), `CouncilCandidateParty` (L46), `CouncilActivity` (L58), `StudentSuggestion` (L68), `AffairsTeacherRole` (L80), `AffairsRolePermission` (L82), `DEFAULT_ROLE_PERMISSIONS` (L103), `studentAffairsCouncilService` (L150) |
| [src/services/studentBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentBannerService.ts) | 258 | `StudentBannerKey` (L7), `StudentBannerItem` (L9), `STUDENT_BANNERS_EVENT` (L24), `DEFAULT_STUDENT_BANNERS` (L26), `studentBannerService` (L65) |
| [src/services/studentEnrollmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentEnrollmentService.ts) | 174 | `EnrollmentStatus` (L8), `StudentEnrollmentRecord` (L16), `studentEnrollmentService` (L173) |
| [src/services/studentExpService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentExpService.ts) | 178 | `STUDENT_EXP_EVENT` (L12), `StudentExpBreakdown` (L14), `StudentExpCalculation` (L26), `calculateStudentExp` (L39), `dispatchStudentExpUpdated` (L173) |
| [src/services/studentPromotionService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentPromotionService.ts) | 326 | `PromotionBatchRecord` (L18), `studentPromotionService` (L325) |
| [src/services/studentPurgeService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentPurgeService.ts) | 181 | `StudentDependencyAudit` (L12), `StudentPurgeInspectionResult` (L21), `PurgeExecutionResult` (L28), `studentPurgeService` (L180) |
| [src/services/studentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentService.ts) | 701 | `StudentRecord` (L7), `defaultStudents` (L26), `mockStudentsByRoom` (L29), `getAlternateRoomKey` (L33), `formatClassroomLabel` (L50), `parseThaiStudentName` (L197), `studentService` (L234) |
| [src/services/teacherBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherBannerService.ts) | 294 | `TeacherBannerKey` (L7), `TeacherBannerItem` (L9), `TEACHER_BANNERS_EVENT` (L29), `DEFAULT_TEACHER_BANNERS` (L31), `teacherBannerService` (L85) |
| [src/services/teacherCalendarTodoService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCalendarTodoService.ts) | 448 | `DayWorkStatus` (L3), `DayTaskDetail` (L5), `CalendarDayStatus` (L17), `DailyTodoItem` (L30), `UpcomingMilestone` (L45), `teacherCalendarTodoService` (L85) |
| [src/services/teacherCopilotService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCopilotService.ts) | 812 | `TimeOfDayScenario` (L19), `UrgentPriorityLevel` (L25), `DeepLinkTargetView` (L27), `CrossViewNavigationPayload` (L46), `UrgentTriageItem` (L57), `DailyStepItem` (L73), `GrillMeRoundRecord` (L85), `GRILL_ME_8_ROUNDS_LOG` (L136), `teacherCopilotService` (L292) |
| [src/services/teacherCourseAssignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCourseAssignmentService.ts) | 415 | `TeachingSubjectInfo` (L15), `TeachingCourseClassroom` (L24), `getDynamicTeachingSubjects` (L34), `TEACHER_SUBJECTS_LIST` (L62), `HOMEROOM_ADVISORY` (L78), `SubmissionChannelType` (L90), `GradingQueueItem` (L92), `StudentBundleProgress` (L122), `AssignmentBundleConfig` (L135), `calculateBundleScore` (L149) *(+1 รายการ)* |
| [src/services/trashService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/trashService.ts) | 197 | `TRASH_SYNC_EVENT` (L7), `trashService` (L27) |
| [src/services/types.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/types.ts) | 117 | 📌 *CLASSROOM & ROSTER SCHEMAS* (L3), `ClassroomCreateSchema` (L4), `ClassroomCreateInput` (L14), `StudentCreateSchema` (L16), `StudentCreateInput` (L23), 📌 *ASSIGNMENT & EXAM SCHEMAS* (L25), `AssignmentCreateSchema` (L26), `AssignmentCreateInput` (L34), 📌 *SCORE & AUDIT LOG SCHEMAS* (L36), `ScoreUpdateSchema` (L37) *(+17 รายการ)* |

## Config & Constants

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/config/feedbackStickersCatalog.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/feedbackStickersCatalog.ts) | 584 | `FeedbackStrandId` (L10), `FeedbackStrandCategory` (L21), `FEEDBACK_STRAND_CATALOG` (L32), `STORAGE_KEYS` (L202), `detectFeedbackStrand` (L214), `getCategoryById` (L342), `getTeacherPreferredStrand` (L350), `setTeacherPreferredStrand` (L367), `getCustomFeedbackStickers` (L381), `addCustomFeedbackSticker` (L405) *(+3 รายการ)* |
| [src/config/m1SgsLookup.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/m1SgsLookup.ts) | 1253 | `M1SgsLookupEntry` (L5), `M1_SGS_STUDENT_LOOKUP` (L12), `getM1SgsStudentInfo` (L1239), `isGrade1SgsStudentCode` (L1244) |
| [src/config/schoolRoles.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/schoolRoles.ts) | 634 | `SchoolUserRole` (L1), `SchoolRoleProfile` (L8), `SchoolFontFamily` (L24), `MorningToClassSyncMode` (L31), `SchoolBrandingSettings` (L33), `SmsUserAccount` (L74), `DEFAULT_KUTCHAP_LOGO` (L89), `DEFAULT_KUTCHAP_LOGO_SVG` (L90), `KUTCHAP_SCHOOL_INFO` (L92), `clampFontSize11To20` (L135) *(+9 รายการ)* |
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
| [src/utils/promotionDryRunEngine.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/promotionDryRunEngine.ts) | 348 | `PromotionActionType` (L9), `GraduationApprovalStatus` (L17), `ClassroomMappingRule` (L23), `StudentDryRunInput` (L31), `StudentPromotionDecision` (L45), `PromotionDryRunConfig` (L57), `PromotionDryRunReport` (L64), `parseGradeLevelFromRoom` (L85), `generateDefaultClassroomMappings` (L102), `evaluateStudentPromotion` (L143) *(+1 รายการ)* |
| [src/utils/timetableDateUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/timetableDateUtils.ts) | 667 | `TimetableColorTheme` (L4), `TimetableMatrixSlot` (L13), `TaskWidgetItem` (L34), `CalendarEventItem` (L43), `THAI_MONTHS_SHORT` (L50), `WeekDayInfo` (L65), `ComputedWeekInfo` (L71), `BANGKOK_TIMEZONE` (L83), `getBangkokNow` (L85), `getBangkokTodayString` (L91) *(+6 รายการ)* |

## Type Definitions

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/types/viewModels.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/types/viewModels.ts) | 237 | `AtRiskStudent` (L5), `IncompleteGradingItem` (L17), `LowestAssignmentItem` (L25), `GradeDistributionItem` (L32), `RadarDimensionMetric` (L38), `StudentProfileDetail` (L45), `StudentQuestItem` (L64), `SarCourseSummary` (L75), `SarGradeMatrixRow` (L88), `TeachingClassSummary` (L107) *(+10 รายการ)* |

## Other

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/App.tsx) | 886 | `App` (L82) |
| [src/lib/neonClient.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/neonClient.ts) | 495 | `neonConnectionString` (L22), `isNeonConfigured` (L25), `neonCacheStats` (L43), `clearNeonCache` (L51), `QueryResult` (L62), `NeonQueryBuilder` (L71), `neonClient` (L493) |
| [src/lib/supabase.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/supabase.ts) | 42 | `isSupabaseConfigured` (L19), `supabase` (L29), `logDbOperation` (L37) |
| [src/lib/universalAdapter.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/universalAdapter.ts) | 575 | `RealtimePayload` (L16), `StorageDriver` (L22), `UniversalAdapterConfig` (L29), `UniversalAdapter` (L43), `getStorageDriver` (L61), `clearMemoryStore` (L87), `getMemoryStore` (L88), `readStorage` (L90), `writeStorage` (L101), `removeStorage` (L110) *(+3 รายการ)* |
| [src/main.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/main.tsx) | 28 | *(Internal / Default Export)* |

