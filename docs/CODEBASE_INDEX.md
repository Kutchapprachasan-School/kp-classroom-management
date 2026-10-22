# Codebase Index & Symbol Location Map (สารบัญโครงสร้างโค้ด)

> **กฎเหล็กเพื่อประสิทธิภาพ Context และ Token (Rule 6)**:
> สารบัญนี้ทำหน้าที่เป็น Navigation Map เพื่อให้ AI Assistant และผู้พัฒนาสามารถตรวจสอบตำแหน่งไฟล์, สัญลักษณ์หลัก (Components / Functions / Types), และช่วงบรรทัด (Line Ranges) ได้ทันที **โดยไม่ต้องเปิดดูทั้งไฟล์ (ห้าม Full View)**
> **ข้อบังคับ**: ทุกครั้งที่มีการเพิ่มไฟล์ใหม่, ลบไฟล์, หรือปรับแก้โครงสร้างหลัก ต้องรัน `node scripts/index_codebase.mjs` เพื่ออัปเดตสารบัญนี้เสมอ

*อัปเดตล่าสุด: 22/10/2569 20:05:32 | รวมทั้งหมด 210 ไฟล์*

---

## Views (หน้าระบบ)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/views/AcademicTermsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AcademicTermsView.tsx) | 2081 | `ActivityCategory` (L50), `CalendarLegendColor` (L52), `CalendarEventItem` (L54), `AcademicTermsView` (L282) |
| [src/views/AdminExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AdminExecutiveDashboardView.tsx) | 312 | `AdminExecutiveDashboardView` (L39) |
| [src/views/AssignmentManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/AssignmentManagementView.tsx) | 4018 | `QuickFilterMode` (L62), `AssignmentManagementView` (L77) |
| [src/views/ClassroomAttendanceView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomAttendanceView.tsx) | 1885 | `ClassroomAttendanceViewProps` (L56), `TeacherCourseOption` (L61), `ClassroomAttendanceView` (L85) |
| [src/views/ClassroomManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomManagementView.tsx) | 1523 | `ImportPreviewRow` (L51), `ClassroomManagementView` (L63) |
| [src/views/ClassroomsRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ClassroomsRosterView.tsx) | 2088 | `ClassroomsRosterView` (L62) |
| [src/views/CoursesCurriculumView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CoursesCurriculumView.tsx) | 2100 | `CoursesCurriculumViewProps` (L38), `CoursesCurriculumView` (L42) |
| [src/views/CrossClassSarView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/CrossClassSarView.tsx) | 1627 | `CrossClassSarView` (L79) |
| [src/views/EndTermReadinessView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/EndTermReadinessView.tsx) | 1192 | `EndTermReadinessViewProps` (L32), `StudentWithGrades` (L36), `EndTermReadinessView` (L66) |
| [src/views/ExamManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ExamManagementView.tsx) | 3191 | `ExtendedExamItem` (L79), `ExamManagementView` (L97) |
| [src/views/GradingQueueView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/GradingQueueView.tsx) | 543 | `GradingQueueView` (L36) |
| [src/views/HomeVisitSdqView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/HomeVisitSdqView.tsx) | 1355 | `HomeVisitSdqView` (L27) |
| [src/views/LessonPlansView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/LessonPlansView.tsx) | 1776 | `UnitStatus` (L33), `EvaluationItem` (L35), `UnitPlanItem` (L42), `CourseFilterOption` (L87), `LessonPlansView` (L96) |
| [src/views/MessagesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MessagesView.tsx) | 1455 | `MessagesView` (L47) |
| [src/views/MorningAssemblyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/MorningAssemblyView.tsx) | 1323 | `MorningAssemblyViewProps` (L54), `MorningAssemblyView` (L90) |
| [src/views/SchoolLeaveExecutiveDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolLeaveExecutiveDashboardView.tsx) | 292 | `SchoolLeaveExecutiveDashboardView` (L43) |
| [src/views/SchoolPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SchoolPortalView.tsx) | 675 | `TeacherLoginChannel` (L23), `SchoolPortalView` (L38) |
| [src/views/ScoreMatrixPrapanView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/ScoreMatrixPrapanView.tsx) | 962 | `ScoreMatrixPrapanView` (L32) |
| [src/views/SettingsBackupView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/SettingsBackupView.tsx) | 4126 | `SettingsKey` (L121), `SettingsBackupView` (L148) |
| [src/views/StudentAffairsCouncilView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentAffairsCouncilView.tsx) | 875 | `StudentAffairsCouncilView` (L38) |
| [src/views/StudentArenaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentArenaView.tsx) | 457 | `StudentArenaView` (L47) |
| [src/views/StudentCouncilAffairsPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentCouncilAffairsPortalView.tsx) | 505 | `StudentCouncilAffairsPortalView` (L28) |
| [src/views/StudentDetailView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentDetailView.tsx) | 607 | `StudentDetailView` (L33) |
| [src/views/StudentGachaView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGachaView.tsx) | 1253 | `StudentGachaView` (L30) |
| [src/views/StudentGradebookView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentGradebookView.tsx) | 1249 | `StudentGradebookView` (L81) |
| [src/views/StudentHomeVisitFormView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentHomeVisitFormView.tsx) | 584 | `StudentHomeVisitFormView` (L28) |
| [src/views/StudentMissionsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentMissionsView.tsx) | 1574 | `ExtendedStudentQuestItem` (L44), `StudentMissionsView` (L59) |
| [src/views/StudentPortalView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentPortalView.tsx) | 402 | `StudentPortalView` (L50) |
| [src/views/StudentRosterView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentRosterView.tsx) | 2485 | `StudentRosterView` (L64) |
| [src/views/StudentTrophyView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/StudentTrophyView.tsx) | 484 | `TrophyBadgeItem` (L28), `StudentTrophyView` (L88) |
| [src/views/TeacherGlobalDashboardView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherGlobalDashboardView.tsx) | 118 | `TeacherGlobalDashboardView` (L31) |
| [src/views/TeacherOverviewView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TeacherOverviewView.tsx) | 1991 | `ClassSubTab` (L54), `TeacherOverviewView` (L105) |
| [src/views/TimetableView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TimetableView.tsx) | 1850 | `TimetableView` (L110) |
| [src/views/TrashManagementView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/TrashManagementView.tsx) | 1045 | `TrashManagementView` (L34) |
| [src/views/UserAccountsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/views/UserAccountsView.tsx) | 667 | `UserAccountsView` (L42) |

## Layout Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/layout/PageHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/PageHeroBanner.tsx) | 196 | `PageHeroBannerProps` (L19), `PageHeroBanner` (L50) |
| [src/components/layout/TeacherHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherHeader.tsx) | 1173 | `TeacherHeader` (L76) |
| [src/components/layout/TeacherSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/layout/TeacherSidebar.tsx) | 599 | `TeacherViewKey` (L53), `TeacherSidebar` (L114) |

## Dashboard Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/dashboard/TeacherAnnouncementsWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherAnnouncementsWidget.tsx) | 100 | `TeacherAnnouncementsWidget` (L19) |
| [src/components/dashboard/TeacherBottomBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherBottomBanner.tsx) | 74 | `TeacherBottomBanner` (L19) |
| [src/components/dashboard/TeacherCalendarActivityWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherCalendarActivityWidget.tsx) | 565 | `TeacherCalendarActivityWidget` (L39) |
| [src/components/dashboard/TeacherHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherHeroBanner.tsx) | 79 | `TeacherHeroBanner` (L19) |
| [src/components/dashboard/TeacherHomeHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherHomeHeroBanner.tsx) | 131 | `TeacherHomeHeroBannerProps` (L15), `TeacherHomeHeroBanner` (L24) |
| [src/components/dashboard/TeacherMoreAccountMobileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherMoreAccountMobileView.tsx) | 175 | `TeacherMoreAccountMobileView` (L23) |
| [src/components/dashboard/TeacherQuickShortcuts.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherQuickShortcuts.tsx) | 119 | `TeacherQuickShortcuts` (L16) |
| [src/components/dashboard/TeacherTaskDetailModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherTaskDetailModal.tsx) | 228 | `TeacherTaskDetailModal` (L24) |
| [src/components/dashboard/TeacherTodayTimetableCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherTodayTimetableCard.tsx) | 671 | `TodayPeriodItem` (L41), `TeacherTodayTimetableCard` (L66) |
| [src/components/dashboard/TeacherWeeklyTasksWidget.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/dashboard/TeacherWeeklyTasksWidget.tsx) | 239 | `TaskItem` (L19), `TeacherWeeklyTasksWidget` (L65) |

## Student Portal Components

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/components/student/AdminBannerManageModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/AdminBannerManageModal.tsx) | 370 | `AdminBannerManageModal` (L28) |
| [src/components/student/ChibiBuddyAvatar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/ChibiBuddyAvatar.tsx) | 104 | `ChibiBuddyAvatar` (L15) |
| [src/components/student/JiuMeowMascot.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/JiuMeowMascot.tsx) | 330 | `JiuMeowMascot` (L9), `AnimeStudentHero` (L256) |
| [src/components/student/StudentAnimeAppView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnimeAppView.tsx) | 2055 | `AnimeAppScreen` (L44), `StudentAnimeAppView` (L62) |
| [src/components/student/StudentAnnouncementsView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentAnnouncementsView.tsx) | 369 | `StudentAnnouncementsView` (L32) |
| [src/components/student/StudentContactTeacherView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentContactTeacherView.tsx) | 166 | `StudentContactTeacherView` (L16) |
| [src/components/student/StudentCoursesView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentCoursesView.tsx) | 147 | `StudentCoursesView` (L19) |
| [src/components/student/StudentHeader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHeader.tsx) | 374 | `StudentHeader` (L34) |
| [src/components/student/StudentHomeDashboard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentHomeDashboard.tsx) | 802 | `StudentHomeDashboard` (L58) |
| [src/components/student/StudentMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileBottomNav.tsx) | 100 | `StudentMobileBottomNav` (L15) |
| [src/components/student/StudentMobileCareView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentMobileCareView.tsx) | 1250 | `MobileScreenKey` (L33), `StudentMobileCareView` (L100) |
| [src/components/student/StudentProfileView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentProfileView.tsx) | 738 | `StudentProfileView` (L48) |
| [src/components/student/StudentSidebar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentSidebar.tsx) | 313 | `StudentTabKey` (L28), `StudentSidebar` (L60) |
| [src/components/student/StudentSubmissionUploader.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentSubmissionUploader.tsx) | 180 | `formatBytes` (L10), `StudentSubmissionUploaderProps` (L16), `StudentSubmissionUploader` (L22), `ValidatedStudentUploader` (L177) |
| [src/components/student/StudentSubmissionWithPreview.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentSubmissionWithPreview.tsx) | 388 | `formatFileSizeMB` (L11), `StudentSubmissionWithPreviewProps` (L17), `StudentSubmissionWithPreview` (L24) |
| [src/components/student/StudentTimetableView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/student/StudentTimetableView.tsx) | 213 | `StudentTimetableView` (L25) |

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
| [src/components/admin/AdminGachaSettingsModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/admin/AdminGachaSettingsModal.tsx) | 1319 | `AdminGachaSettingsModal` (L47) |
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
| [src/components/common/PwaInstallPrompt.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/PwaInstallPrompt.tsx) | 252 | `PwaInstallPrompt` (L12) |
| [src/components/common/QuickSearchModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/QuickSearchModal.tsx) | 150 | `QuickSearchModal` (L18) |
| [src/components/common/ThaiMiniDatePicker.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/common/ThaiMiniDatePicker.tsx) | 392 | `ThaiMiniDatePickerProps` (L6), `ThaiMiniDatePicker` (L88) |
| [src/components/exam/StudentExamPlayerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/exam/StudentExamPlayerModal.tsx) | 479 | `StudentExamPlayerModal` (L38) |
| [src/components/mobile/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/index.ts) | 12 | *(Internal / Default Export)* |
| [src/components/mobile/TeacherMobileBottomNav.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileBottomNav.tsx) | 250 | `TeacherMobileBottomNav` (L17) |
| [src/components/mobile/TeacherMobileCalendarScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCalendarScreen.tsx) | 212 | `TeacherMobileCalendarScreen` (L17) |
| [src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileClassSubmissionsScreen.tsx) | 234 | `MobileStudentSubmissionItem` (L9), `TeacherMobileClassSubmissionsScreen` (L26) |
| [src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileCreateAssignmentScreen.tsx) | 406 | `TeacherMobileCreateAssignmentScreen` (L29) |
| [src/components/mobile/TeacherMobileGradingListScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileGradingListScreen.tsx) | 236 | `MobileGradingAssignmentItem` (L11), `TeacherMobileGradingListScreen` (L34) |
| [src/components/mobile/TeacherMobileGradingSummaryScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileGradingSummaryScreen.tsx) | 201 | `TeacherMobileGradingSummaryScreen` (L13) |
| [src/components/mobile/TeacherMobileHomeScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileHomeScreen.tsx) | 338 | `TeacherMobileHomeScreen` (L28) |
| [src/components/mobile/TeacherMobileMoreMenuScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileMoreMenuScreen.tsx) | 228 | `TeacherMobileMoreMenuScreen` (L29) |
| [src/components/mobile/TeacherMobileRoomScoresScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileRoomScoresScreen.tsx) | 357 | `TeacherMobileRoomScoresScreen` (L36) |
| [src/components/mobile/TeacherMobileSchoolInfoScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileSchoolInfoScreen.tsx) | 416 | `TeacherMobileSchoolInfoScreen` (L28) |
| [src/components/mobile/TeacherMobileSubmissionDetailScreen.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/mobile/TeacherMobileSubmissionDetailScreen.tsx) | 260 | `TeacherMobileSubmissionDetailScreen` (L31) |
| [src/components/promotion/AcademicRolloverControlCenter.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/AcademicRolloverControlCenter.tsx) | 141 | `AcademicRolloverControlCenterProps` (L15), `AcademicRolloverControlCenter` (L20) |
| [src/components/promotion/AlumniDirectoryView.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/AlumniDirectoryView.tsx) | 255 | `AlumniDirectoryView` (L18) |
| [src/components/promotion/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/index.ts) | 7 | *(Internal / Default Export)* |
| [src/components/promotion/PromotionRollbackModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/PromotionRollbackModal.tsx) | 231 | `PromotionRollbackModalProps` (L15), `PromotionRollbackModal` (L22) |
| [src/components/promotion/PromotionWizardModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/PromotionWizardModal.tsx) | 596 | `ClassroomOption` (L23), `PromotionWizardModalProps` (L29), `ManualOverrideEntry` (L37), `PromotionWizardModal` (L45) |
| [src/components/promotion/StudentPurgeModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/promotion/StudentPurgeModal.tsx) | 166 | `StudentPurgeModalProps` (L14), `StudentPurgeModal` (L22) |
| [src/components/settings/SettingsCategoryCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsCategoryCard.tsx) | 107 | `SettingsCategoryCardProps` (L4), `SettingsCategoryCard` (L18) |
| [src/components/settings/SettingsHeroBanner.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsHeroBanner.tsx) | 28 | `SettingsHeroBanner` (L9) |
| [src/components/settings/SettingsSubModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/settings/SettingsSubModal.tsx) | 162 | `SettingsSubModalProps` (L4), `SettingsSubModal` (L20) |
| [src/components/sgs/SgsRosterImportModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/sgs/SgsRosterImportModal.tsx) | 1094 | `ImportProgressUpdate` (L25), `SgsRosterImportModalProps` (L33), `SgsRosterImportModal` (L44) |
| [src/components/sgs/SgsScoreExportModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/sgs/SgsScoreExportModal.tsx) | 243 | `SgsScoreExportModal` (L36) |
| [src/components/teacher/AdminTeacherBannerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AdminTeacherBannerModal.tsx) | 841 | `AdminTeacherBannerModal` (L39) |
| [src/components/teacher/ArtworkPreviewModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/ArtworkPreviewModal.tsx) | 846 | `ArtworkPreviewModalProps` (L18), `ArtworkPreviewModal` (L34) |
| [src/components/teacher/AssignmentBundlesModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AssignmentBundlesModal.tsx) | 271 | `AssignmentBundlesModal` (L19) |
| [src/components/teacher/AtRiskCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/AtRiskCard.tsx) | 105 | `AtRiskCard` (L11) |
| [src/components/teacher/GradeDistributionBar.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradeDistributionBar.tsx) | 81 | `GradeDistributionBar` (L9) |
| [src/components/teacher/GradingWorkspaceModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/GradingWorkspaceModal.tsx) | 859 | `GradingWorkspaceModal` (L47) |
| [src/components/teacher/IncompleteGradingCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/IncompleteGradingCard.tsx) | 64 | `IncompleteGradingCard` (L9) |
| [src/components/teacher/LowestAssignmentsCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/LowestAssignmentsCard.tsx) | 70 | `LowestAssignmentsCard` (L9) |
| [src/components/teacher/MobileVerticalAttendanceSheet.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/MobileVerticalAttendanceSheet.tsx) | 385 | `RollCallStatus` (L5), `RollCallStudentItem` (L7), `MobileVerticalAttendanceSheet` (L28) |
| [src/components/teacher/PaperRegisterLedger.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/PaperRegisterLedger.tsx) | 1721 | `PaperLedgerMode` (L25), `AttendanceStatus` (L31), `PaperRegisterLedger` (L216) |
| [src/components/teacher/SgsClassroomMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/SgsClassroomMatrixModal.tsx) | 351 | `SgsClassroomMatrixModal` (L25) |
| [src/components/teacher/StudentNotesCard.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentNotesCard.tsx) | 117 | `StudentNotesCard` (L11) |
| [src/components/teacher/StudentRadarChart.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/StudentRadarChart.tsx) | 173 | `StudentRadarChart` (L17) |
| [src/components/teacher/Submission3ColorMatrixModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/teacher/Submission3ColorMatrixModal.tsx) | 478 | `Submission3ColorMatrixModal` (L42) |
| [src/components/timetable/AddEditTimetableSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AddEditTimetableSlotModal.tsx) | 641 | `AddEditTimetableSlotModalProps` (L38), `AddEditTimetableSlotModal` (L60) |
| [src/components/timetable/AssignWaitingSlotModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/AssignWaitingSlotModal.tsx) | 438 | `AssignWaitingSlotModalProps` (L29), `AssignWaitingSlotModal` (L48) |
| [src/components/timetable/SubjectIconPickerModal.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/components/timetable/SubjectIconPickerModal.tsx) | 280 | `SubjectIconPickerModalProps` (L20), `SubjectIconPickerModal` (L41) |

## Services (Business Logic & Storage)

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/services/academicCalendarService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/academicCalendarService.ts) | 612 | `HolidayType` (L7), `DayOfWeek` (L8), `AcademicTermRecord` (L10), `SpecialHolidayRecord` (L24), `WeekendMakeupDayRecord` (L34), `AcademicCalendarConfig` (L46), `ACADEMIC_CALENDAR_EVENT` (L55), `THAI_MONTH_SHORT_MAP` (L57), `parseThaiDateToIso` (L75), `calculate20WeeksEndDate` (L95) *(+4 รายการ)* |
| [src/services/activityAuditLogService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/activityAuditLogService.ts) | 224 | `AuditActionType` (L6), `AuditEntityType` (L15), `AuditChangeItem` (L23), `AuditLogEntry` (L32), `AUDIT_LOG_SYNC_EVENT` (L49), `activityAuditLogService` (L223) |
| [src/services/assignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/assignmentService.ts) | 189 | `AssignmentRecord` (L25), `assignmentService` (L65) |
| [src/services/attendanceCorrelationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceCorrelationService.ts) | 1478 | `AttendanceStatusCode` (L17), `AttendanceRecordSource` (L25), `AttendanceAuditLog` (L30), `MorningAssemblyRecord` (L40), `PeriodAttendanceRecord` (L57), `ApprovedSchoolActivity` (L78), `ApprovedStudentLeave` (L88), `Attendance80Summary` (L100), `CorrelationChange` (L116), `CorrelationResult` (L128) *(+15 รายการ)* |
| [src/services/attendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/attendanceService.ts) | 801 | `AttendanceStatus` (L22), `AttendanceRecord` (L24), `AttendanceSyncMeta` (L37), `localAttendanceDb` (L113), `SyncStatusListener` (L316), `AttendanceRecordItem` (L347), `attendanceService` (L369) |
| [src/services/authService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/authService.ts) | 464 | `AuthUser` (L7), `authService` (L60) |
| [src/services/behaviorService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/behaviorService.ts) | 218 | `BehaviorRecord` (L4), `XpTransactionRecord` (L15), `behaviorService` (L65) |
| [src/services/bellScheduleService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/bellScheduleService.ts) | 345 | `SchoolBellScheduleConfig` (L8), `BELL_SCHEDULE_STORAGE_KEY` (L19), `BELL_SCHEDULE_UPDATED_EVENT` (L20), `DEFAULT_BELL_SCHEDULE_CONFIG` (L22), `BellScheduleTimelineItem` (L33), `addMinutesToTimeStr` (L45), `calculateMinutesDifference` (L54), `generateBellScheduleTimeline` (L62), `bellScheduleService` (L344) |
| [src/services/calendarEventStorageService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/calendarEventStorageService.ts) | 308 | `CALENDAR_EVENTS_STORAGE_KEY` (L19), `MATRIX_STORAGE_KEY` (L20), `MATRIX_SLOTS_UPDATED_EVENT` (L21), `getMatrixStorageKey` (L26), `CalendarLegendColor` (L31), `CalendarEventItem` (L33), `INITIAL_OCTOBER_EVENTS` (L55), `parseThaiDateString` (L57), `convertHolidayToCalendarEvent` (L84), `convertMakeupDayToCalendarEvent` (L105) *(+1 รายการ)* |
| [src/services/classroomService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/classroomService.ts) | 846 | `getDeletedRoomsSet` (L10), `saveDeletedRoomsSet` (L25), `getLocalClassrooms` (L36), `TeacherAccountItem` (L90), `DEFAULT_TEACHER_ACCOUNTS` (L100), `INITIAL_SEED_CLASSROOMS` (L102), `invalidateClassroomCache` (L125), `classroomService` (L132) |
| [src/services/cleanSlateService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cleanSlateService.ts) | 211 | `CleanSlatePurgeResult` (L5), `TRANSACTIONAL_STORAGE_KEYS` (L16), `PRESERVED_INFRASTRUCTURE_KEYS` (L61), `cleanSlateService` (L210) |
| [src/services/cloudDataService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/cloudDataService.ts) | 983 | `CloudStoreRecord` (L8), `CloudSyncState` (L14), `cloudDataService` (L645), `FileValidationResult` (L647), `MAX_IMAGE_SIZE_MB` (L655), `MAX_DOC_SIZE_MB` (L656), `ALLOWED_IMAGE_EXTENSIONS` (L659), `ALLOWED_DOC_EXTENSIONS` (L660), `ALLOWED_MIME_TYPES` (L662), `sanitizeFileName` (L675) *(+5 รายการ)* |
| [src/services/coursesCurriculumService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/coursesCurriculumService.ts) | 813 | `MediaType` (L12), `UnitMediaItem` (L14), `CurriculumUnit` (L28), `CourseCurriculumRecord` (L40), `TrashMediaItem` (L57), `calculatePeriodsPerWeek` (L76), `coursesCurriculumService` (L811) |
| [src/services/gachaAdminService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaAdminService.ts) | 383 | `GachaSnapshot` (L14), `GachaAdminAuditLog` (L24), `gachaAdminService` (L83), 📌 *Snapshots & Rollback* (L84), 📌 *Granting Operations* (L155), 📌 *Reset Operations* (L277), 📌 *Audit Logs* (L377) |
| [src/services/gachaConfigService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaConfigService.ts) | 218 | `GACHA_CONFIG_STORAGE_KEY` (L9), `GACHA_CONFIG_UPDATED_EVENT` (L10), `RARITY_ORDER` (L12), `GachaAdminConfig` (L21), `DEFAULT_GACHA_CONFIG` (L71), `validateGachaConfig` (L160), `gachaConfigService` (L180) |
| [src/services/gachaRewardEngine.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaRewardEngine.ts) | 183 | `StudentQuest` (L9), `gachaRewardEngine` (L31) |
| [src/services/gachaService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaService.ts) | 997 | `GachaBuddy` (L16), `GachaPullResult` (L38), `InventoryItems` (L45), `BuddySkillUsage` (L52), `WeeklyQuizResult` (L61), `GachaState` (L75), `GACHA_STATE_KEY_PREFIX` (L106), `BUDDY_CHANGED_EVENT` (L107), `PREVIEW_STUDENT_ID` (L109), `getGachaRates` (L112) *(+8 รายการ)* |
| [src/services/gachaSkillEngine.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gachaSkillEngine.ts) | 194 | `ActiveBuddyBuffs` (L9), `BuddySkillState` (L24), `BUDDY_SKILL_ACTIVATED_EVENT` (L31), `CHEER_COOLDOWN_MINUTES` (L33), `gachaSkillEngine` (L37) |
| [src/services/gamificationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gamificationService.ts) | 172 | `gamificationService` (L68) |
| [src/services/gradeService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/gradeService.ts) | 599 | `AssessmentColumn` (L16), `StudentScore` (L30), `GradeSyncMeta` (L38), `localGradeDb` (L123), `gradeService` (L359) |
| [src/services/homeVisitService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/homeVisitService.ts) | 292 | `VisitStatus` (L6), `SdqLevel` (L7), `CctSyncStatus` (L8), `HouseholdMember` (L11), `StudentAttendanceLeavePolicy` (L28), `HomeVisitRecord` (L35), `homeVisitService` (L153) |
| [src/services/index.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/index.ts) | 20 | *(Internal / Default Export)* |
| [src/services/localCacheDb.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/localCacheDb.ts) | 292 | `CachedClassroom` (L9), `CachedStudent` (L20), `SyncMeta` (L42), `localCacheDb` (L113) |
| [src/services/masterDataService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/masterDataService.ts) | 464 | `resolveRoomCandidates` (L34), `masterDataService` (L107) |
| [src/services/messagingService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/messagingService.ts) | 1546 | `ChatGroupType` (L17), `ChatMember` (L19), `ChatAttachmentMeta` (L30), `ChatMessage` (L40), `ChatGroup` (L67), `StudentTransferPayload` (L87), `StudentTransferResult` (L95), `CHAT_GROUPS_EVENT` (L111), `STUDENT_TRANSFERRED_EVENT` (L112), `CourseClassroomMapping` (L115) *(+2 รายการ)* |
| [src/services/onlineQuizService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/onlineQuizService.ts) | 388 | `QuizOptionItem` (L12), `QuizQuestionItem` (L17), `StudentQuizAttemptRecord` (L27), `OnlineQuizConfig` (L44), `DEFAULT_SAMPLE_QUESTIONS` (L65), `onlineQuizService` (L387) |
| [src/services/phoneNotificationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/phoneNotificationService.ts) | 165 | `PhoneNotificationPayload` (L4), `PHONE_NOTI_SYNC_EVENT` (L16), `phoneNotificationService` (L164) |
| [src/services/qrAttendanceService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/qrAttendanceService.ts) | 306 | `DynamicQrPayload` (L11), `StudentCardQrPayload` (L24), `QrVerificationResult` (L32), `QR_ROTATION_INTERVAL_SECONDS` (L40), `qrAttendanceService` (L305) |
| [src/services/r2StorageService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/r2StorageService.ts) | 308 | `R2UploadResult` (L21), `r2StorageService` (L29) |
| [src/services/schoolLeaveSettingsService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolLeaveSettingsService.ts) | 170 | `LeaveTypeQuota` (L5), `SchoolLeaveSettings` (L16), `SCHOOL_LEAVE_SETTINGS_EVENT` (L36), `DEFAULT_LEAVE_SETTINGS` (L38), `schoolLeaveSettingsService` (L91) |
| [src/services/schoolPoliciesService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolPoliciesService.ts) | 166 | `SchoolAttendancePolicyConfig` (L5), `SchoolGradingPolicyConfig` (L14), `SmsGatewayProvider` (L24), `SchoolNotificationConfig` (L26), `DEFAULT_ATTENDANCE_POLICY` (L46), `DEFAULT_GRADING_POLICY` (L55), `DEFAULT_NOTIFICATION_CONFIG` (L65), `SCHOOL_POLICY_SYNC_EVENT` (L88), `schoolPoliciesService` (L165) |
| [src/services/schoolStaffLeaveService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/schoolStaffLeaveService.ts) | 324 | `StaffLeaveType` (L7), `StaffLeaveStatus` (L15), `SubstituteAssignment` (L20), `StaffLeaveRequest` (L30), `StaffLeaveQuotaStats` (L53), `STAFF_LEAVE_EVENT` (L68), `schoolStaffLeaveService` (L206) |
| [src/services/scoreService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/scoreService.ts) | 355 | `ScoreRecord` (L4), `ScoreAuditLogRecord` (L17), `scoreService` (L78) |
| [src/services/sgsExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsExportService.ts) | 161 | `SgsSnapshotRecord` (L3), `sgsExportService` (L51) |
| [src/services/sgsImportExportService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsImportExportService.ts) | 499 | `SgsImportRowStatus` (L11), `SgsParsedRow` (L13), `SgsImportDryRunSummary` (L32), `SgsScoreExportRow` (L48), `ExistingStudentLookup` (L61), `ParsedThaiName` (L81), `parseThaiFullName` (L89), `parseSgsClipboardText` (L156), `evaluateSgsImportDryRun` (L295), `generateSgsScoreExportRows` (L407) *(+2 รายการ)* |
| [src/services/sgsRosterAndSubmissionService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/sgsRosterAndSubmissionService.ts) | 2781 | `matchSubmissionToAssignment` (L21), `StudentTransferState` (L46), `StudentGender` (L47), `SgsInsertPosition` (L48), `FourScorePart` (L50), `CourseScoreWeights` (L52), `StudentCourseScoreEntry` (L60), `DESIRABLE_CHARACTERISTICS_LIST` (L70), `CRITICAL_THINKING_LIST` (L81), `SgsStudentRecord` (L89) *(+13 รายการ)* |
| [src/services/smsNotificationService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/smsNotificationService.ts) | 872 | `SmsCategory` (L12), `SmsDeliveryRecord` (L21), `SendSmsPayload` (L39), `StudentContactRecord` (L49), `normalizeThaiPhoneNumber` (L69), `SMS_OUTBOX_SYNC_EVENT` (L114), `smsNotificationService` (L871) |
| [src/services/studentAffairsCouncilService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentAffairsCouncilService.ts) | 585 | `AssemblyExceptionRecord` (L9), `DisciplineRecord` (L18), `StudentLeaveRequest` (L31), `CouncilCandidateParty` (L46), `CouncilActivity` (L58), `StudentSuggestion` (L68), `AffairsTeacherRole` (L80), `AffairsRolePermission` (L82), `DEFAULT_ROLE_PERMISSIONS` (L103), `studentAffairsCouncilService` (L150) |
| [src/services/studentBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentBannerService.ts) | 258 | `StudentBannerKey` (L7), `StudentBannerItem` (L9), `STUDENT_BANNERS_EVENT` (L24), `DEFAULT_STUDENT_BANNERS` (L26), `studentBannerService` (L65) |
| [src/services/studentEnrollmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentEnrollmentService.ts) | 232 | `EnrollmentStatus` (L5), `StudentEnrollmentRecord` (L13), `CourseTranscriptItem` (L29), `TermTranscript` (L36), `AlumniStudentSummary` (L48), `studentEnrollmentService` (L61) |
| [src/services/studentExpService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentExpService.ts) | 178 | `STUDENT_EXP_EVENT` (L12), `StudentExpBreakdown` (L14), `StudentExpCalculation` (L26), `calculateStudentExp` (L39), `dispatchStudentExpUpdated` (L173) |
| [src/services/studentPromotionService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentPromotionService.ts) | 290 | `PromotionAction` (L6), `StudentPromotionTransition` (L8), `ClassroomMappingRule` (L22), `PromotionDryRunResult` (L30), `ExecutePromotionRpcResponse` (L43), `RollbackPromotionRpcResponse` (L51), `PromotionBatchHistoryItem` (L60), `studentPromotionService` (L78) |
| [src/services/studentPurgeService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentPurgeService.ts) | 37 | `PurgeStudentRpcResponse` (L5), `studentPurgeService` (L14) |
| [src/services/studentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/studentService.ts) | 916 | `StudentRecord` (L10), `defaultStudents` (L29), `mockStudentsByRoom` (L32), `getAlternateRoomKey` (L36), `registerClassroomNames` (L59), `formatClassroomLabel` (L76), `parseThaiStudentName` (L285), `BatchImportProgress` (L322), `BatchImportOptions` (L330), `studentService` (L337) |
| [src/services/teacherBannerService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherBannerService.ts) | 294 | `TeacherBannerKey` (L7), `TeacherBannerItem` (L9), `TEACHER_BANNERS_EVENT` (L29), `DEFAULT_TEACHER_BANNERS` (L31), `teacherBannerService` (L85) |
| [src/services/teacherCalendarTodoService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCalendarTodoService.ts) | 448 | `DayWorkStatus` (L3), `DayTaskDetail` (L5), `CalendarDayStatus` (L17), `DailyTodoItem` (L30), `UpcomingMilestone` (L45), `teacherCalendarTodoService` (L85) |
| [src/services/teacherCopilotService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCopilotService.ts) | 810 | `TimeOfDayScenario` (L19), `UrgentPriorityLevel` (L25), `DeepLinkTargetView` (L27), `CrossViewNavigationPayload` (L46), `UrgentTriageItem` (L57), `DailyStepItem` (L73), `GrillMeRoundRecord` (L85), `GRILL_ME_8_ROUNDS_LOG` (L136), `teacherCopilotService` (L292) |
| [src/services/teacherCourseAssignmentService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/teacherCourseAssignmentService.ts) | 740 | `TeachingSubjectInfo` (L19), `TeachingCourseClassroom` (L31), `getAllAvailableClassroomLabels` (L37), `getDynamicTeachingSubjects` (L55), `TEACHER_SUBJECTS_LIST` (L94), `HOMEROOM_ADVISORY` (L110), `SubmissionChannelType` (L122), `GradingQueueItem` (L124), `StudentBundleProgress` (L156), `AssignmentBundleConfig` (L169) *(+2 รายการ)* |
| [src/services/trashService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/trashService.ts) | 197 | `TRASH_SYNC_EVENT` (L7), `trashService` (L27) |
| [src/services/types.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/types.ts) | 117 | 📌 *CLASSROOM & ROSTER SCHEMAS* (L3), `ClassroomCreateSchema` (L4), `ClassroomCreateInput` (L14), `StudentCreateSchema` (L16), `StudentCreateInput` (L23), 📌 *ASSIGNMENT & EXAM SCHEMAS* (L25), `AssignmentCreateSchema` (L26), `AssignmentCreateInput` (L34), 📌 *SCORE & AUDIT LOG SCHEMAS* (L36), `ScoreUpdateSchema` (L37) *(+17 รายการ)* |
| [src/services/weeklyQuizService.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/services/weeklyQuizService.ts) | 276 | `parseThaiTermDate` (L35), `QuizWeekInfo` (L46), `computeQuizWeek` (L59), `QuizScoreInput` (L99), `QuizScoreOutput` (L109), `scoreWeeklyQuiz` (L125), `weeklyQuizService` (L159) |

## Config & Constants

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/config/feedbackStickersCatalog.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/feedbackStickersCatalog.ts) | 584 | `FeedbackStrandId` (L10), `FeedbackStrandCategory` (L21), `FEEDBACK_STRAND_CATALOG` (L32), `STORAGE_KEYS` (L202), `detectFeedbackStrand` (L214), `getCategoryById` (L342), `getTeacherPreferredStrand` (L350), `setTeacherPreferredStrand` (L367), `getCustomFeedbackStickers` (L381), `addCustomFeedbackSticker` (L405) *(+3 รายการ)* |
| [src/config/gachaStarTable.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/gachaStarTable.ts) | 143 | `GachaRarity` (L5), `MAX_BUDDY_STARS` (L13), `BuddyStarTier` (L15), `BUDDY_STAR_TABLE` (L57), 📌 *COMMON* (L58), 📌 *UNCOMMON* (L69), 📌 *RARE* (L80), 📌 *EPIC* (L91), 📌 *LEGENDARY* (L108), 📌 *MYTHIC* (L125) *(+1 รายการ)* |
| [src/config/m1SgsLookup.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/m1SgsLookup.ts) | 1251 | `M1SgsLookupEntry` (L5), `M1_SGS_STUDENT_LOOKUP` (L12), `getM1SgsStudentInfo` (L1239), `isGrade1SgsStudentCode` (L1244) |
| [src/config/schoolRoles.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/schoolRoles.ts) | 634 | `SchoolUserRole` (L1), `SchoolRoleProfile` (L8), `SchoolFontFamily` (L24), `MorningToClassSyncMode` (L31), `SchoolBrandingSettings` (L33), `SmsUserAccount` (L74), `DEFAULT_KUTCHAP_LOGO` (L89), `DEFAULT_KUTCHAP_LOGO_SVG` (L90), `KUTCHAP_SCHOOL_INFO` (L92), `clampFontSize11To20` (L135) *(+9 รายการ)* |
| [src/config/schoolSettings.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/schoolSettings.ts) | 10 | *(Internal / Default Export)* |
| [src/config/subjectIcons.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/subjectIcons.ts) | 642 | `SubjectIconConfig` (L7), `ALL_SUBJECT_ICONS` (L22), `DEFAULT_SUBJECT_ICON` (L360), `getSubjectIcon` (L387), `SubjectBadgeSize` (L562), `getSubjectBadgeClasses` (L564), `SubjectBadgeRenderProps` (L579), `getSubjectBadgeProps` (L590), `renderSubjectIconBadge` (L606), `SubjectIconBadge` (L624) |
| [src/config/weeklyQuizBank.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/config/weeklyQuizBank.ts) | 288 | `WeeklyQuizQuestion` (L6), `WEEKS_PER_TERM` (L16), `TOTAL_QUIZ_WEEKS` (L17), `QUESTIONS_PER_WEEK` (L18), 📌 *ภาคเรียนที่ 1 (สัปดาห์ 1–20)* (L23), 📌 *ภาคเรียนที่ 2 (สัปดาห์ 21–40)* (L145), `WEEKLY_QUIZ_BANK` (L271), `getBankQuestionsForWeek` (L283), `getTermForQuizWeek` (L287) |

## Utilities

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/utils/fuzzyNameMatcher.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/fuzzyNameMatcher.ts) | 168 | `normalizeWhitespace` (L14), `stripHonorificPrefix` (L21), `levenshteinDistance` (L29), `calculateNameSimilarity` (L57), `TeacherMatchResult` (L80), `matchTeacherWithDatabase` (L91) |
| [src/utils/googleDriveUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/googleDriveUtils.ts) | 208 | `GoogleDriveValidationResult` (L9), `RecommendedFolderTemplate` (L25), `validateGoogleDriveUrl` (L40), `FolderPathOptions` (L158), `generateRecommendedFolderPath` (L170) |
| [src/utils/gradeLevelTheme.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/gradeLevelTheme.ts) | 153 | `GradeLevelTheme` (L5), `GRADE_LEVEL_THEMES` (L21), `getGradeLevelTheme` (L133), `GRADE_LEVEL_LIST` (L152) |
| [src/utils/imageCompressor.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/imageCompressor.ts) | 363 | `CompressionOptions` (L5), `CompressedImageResult` (L16), `DEFAULT_BANNER_COMPRESSION_OPTIONS` (L26), `estimateBase64SizeBytes` (L54), `dataUrlToBlob` (L84), `calculateAspectRatioDimensions` (L131), `calculateProportionalDimensions` (L155), `formatBytes` (L160), `isImageFile` (L172), `DEFAULT_LOGO_COMPRESSION_OPTIONS` (L338) |
| [src/utils/indexedDbAdapter.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/indexedDbAdapter.ts) | 392 | `OutboxSyncStatus` (L9), `OutboxItem` (L11), `RetryPolicyConfig` (L23), `DEFAULT_RETRY_CONFIG` (L31), `computeNextBackoffMs` (L42), `canonicalJsonStringify` (L58), `indexedDbAdapter` (L391) |
| [src/utils/promotionDryRunEngine.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/promotionDryRunEngine.ts) | 376 | `PromotionActionType` (L11), `GraduationApprovalStatus` (L19), `ClassroomMappingRule` (L25), `StudentDryRunInput` (L33), `StudentPromotionDecision` (L50), `PromotionDryRunConfig` (L62), `PromotionDryRunReport` (L69), `parseGradeLevelFromRoom` (L90), `generateDefaultClassroomMappings` (L107), `evaluateStudentPromotion` (L148) *(+2 รายการ)* |
| [src/utils/studentIdentityUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/studentIdentityUtils.ts) | 93 | `StudentIdentityCandidate` (L8), `resolveStudentIdentity` (L20), `isSameClassroom` (L86) |
| [src/utils/timetableDateUtils.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/utils/timetableDateUtils.ts) | 797 | `TimetableColorTheme` (L6), `TimetableMatrixSlot` (L15), `TaskWidgetItem` (L38), `CalendarEventItem` (L47), `THAI_MONTHS_SHORT` (L54), `WeekDayInfo` (L69), `ComputedWeekInfo` (L75), `BANGKOK_TIMEZONE` (L87), `getBangkokNow` (L89), `getBangkokTodayString` (L95) *(+8 รายการ)* |

## Type Definitions

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/types/viewModels.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/types/viewModels.ts) | 237 | `AtRiskStudent` (L5), `IncompleteGradingItem` (L17), `LowestAssignmentItem` (L25), `GradeDistributionItem` (L32), `RadarDimensionMetric` (L38), `StudentProfileDetail` (L45), `StudentQuestItem` (L64), `SarCourseSummary` (L75), `SarGradeMatrixRow` (L88), `TeachingClassSummary` (L107) *(+10 รายการ)* |

## Other

| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/App.tsx) | 1014 | `App` (L85) |
| [src/lib/neonClient.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/neonClient.ts) | 569 | `neonConnectionString` (L22), `isNeonConfigured` (L25), `neonCacheStats` (L43), `clearNeonCache` (L51), `QueryResult` (L62), `NeonQueryBuilder` (L71), `neonClient` (L567) |
| [src/lib/supabaseClient.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/supabaseClient.ts) | 2 | *(Internal / Default Export)* |
| [src/lib/supabase.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/supabase.ts) | 44 | `isSupabaseConfigured` (L19), `supabase` (L29), `logDbOperation` (L39) |
| [src/lib/universalAdapter.ts](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/lib/universalAdapter.ts) | 575 | `RealtimePayload` (L16), `StorageDriver` (L22), `UniversalAdapterConfig` (L29), `UniversalAdapter` (L43), `getStorageDriver` (L61), `clearMemoryStore` (L87), `getMemoryStore` (L88), `readStorage` (L90), `writeStorage` (L101), `removeStorage` (L110) *(+3 รายการ)* |
| [src/main.tsx](file:///C:/dev/09 ระบบจัดการชั้นเรียน/src/main.tsx) | 42 | *(Internal / Default Export)* |

