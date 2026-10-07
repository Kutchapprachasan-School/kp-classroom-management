# Production MVP Transition, Student Auth, Homeroom Advisor Settings, & Online Quiz Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the platform from mock data to a clean production MVP baseline without touching the main leave system or teacher Supabase Auth, while implementing self-contained student authentication (with advisor 1-click reset), homeroom advisor settings for Student Affairs and Academic Admins, and an online chapter-end quiz engine featuring anti-cheating screen focus detection, auto-grading into scores, and remedial retakes.

**Architecture:** 
1. **Clean Slate Manager**: Safely purges transactional demo data (scores, attendance logs, messages) on demand while preserving base school structures (classrooms, term 1/2569, bell schedule).
2. **Student Credential Vault**: Isolates student auth within `students.password_hash` with SHA-256 verification and 5-digit code defaults; enables 1-click password reset by homeroom advisors in `ClassroomsRosterView.tsx`.
3. **Homeroom Advisor RBAC**: Empowers `STUDENT_AFFAIRS` and `ACADEMIC_ADMIN` to configure primary and co-advisors per classroom in `SettingsBackupView.tsx`, auto-syncing with `messagingService` and `classroomService`.
4. **Online Quiz & Anti-Cheat Engine**: Real-time Quiz Builder in `ExamManagementView.tsx` with passing criteria and retake toggles, accompanied by a Student Quiz Player modal enforcing tab-blur detection, auto-submission on violations, and instant auto-grading into `scoreService`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide / MingCute Icons, LocalStorage + Supabase PostgreSQL adapter fallback, Web Crypto API.

## Global Constraints

- Thai-first UI with Prompt typography and Pastel Anime Education Dashboard tokens (`#3B82F6`, rounded `18px`, soft shadows).
- ZERO modifications to existing staff Supabase Auth or leave system tables.
- Keep all Git commits strictly local (`git push origin main` is forbidden).
- All changes must pass `test_backend_ux_integration.mjs` and compile cleanly with `npm run build` (0 TypeScript errors).

---

### Task 1: Clean Slate Data Transition & Zero-Impact MVP Initializer

**Files:**
- Create: `src/services/cleanSlateService.ts`
- Modify: `src/views/SettingsBackupView.tsx`
- Test: `test_backend_ux_integration.mjs`

**Interfaces:**
- Produces: `cleanSlateService.purgeTransactionalMockData(): { purgedCounts: Record<string, number> }`
- Produces: `cleanSlateService.isCleanSlateActive(): boolean`

- [ ] **Step 1: Write test for Clean Slate Service in `test_backend_ux_integration.mjs`**
  - Verify that invoking `cleanSlateService.purgeTransactionalMockData()` clears transactional keys (`cls_scores_data`, `kp_morning_assembly_records`, `kp_period_attendance_records`, `cls_chat_messages`) while keeping foundational records (`cls_classrooms_data`, `kp_school_bell_schedule`, `kp_academic_calendar`) intact.
- [ ] **Step 2: Run test to verify it fails**
  - Run `node test_backend_ux_integration.mjs` and observe module not found for `cleanSlateService`.
- [ ] **Step 3: Implement `src/services/cleanSlateService.ts`**
  - Implement selective purge with audit logging and event dispatch (`kps-data-sync-event`).
- [ ] **Step 4: Integrate Clean Slate UI action into `SettingsBackupView.tsx`**
  - Add a dedicated button/card: "ล้างข้อมูลจำลองเพื่อเริ่มใช้งานจริง (Clean Slate MVP)" with confirmation dialog in the Backup/System tab.
- [ ] **Step 5: Run tests and verify they pass**
  - Run `node test_backend_ux_integration.mjs` and ensure all tests pass.
- [ ] **Step 6: Commit**
  - `git add src/services/cleanSlateService.ts src/views/SettingsBackupView.tsx test_backend_ux_integration.mjs`
  - `git commit -m "feat(clean-slate): add selective transactional data purge for production MVP transition"`

---

### Task 2: Student Isolated Authentication, Password Change, and Advisor 1-Click Reset

**Files:**
- Modify: `src/services/authService.ts`
- Modify: `src/services/studentService.ts`
- Modify: `src/views/ClassroomsRosterView.tsx`
- Test: `test_backend_ux_integration.mjs`

**Interfaces:**
- Produces: `authService.loginStudentWithHashedPassword(studentCode: string, passwordInput: string): Promise<AuthUser>`
- Produces: `authService.studentChangePassword(studentCode: string, currentPassword: string, newPassword: string): Promise<boolean>`
- Produces: `authService.resetStudentPasswordByAdvisor(studentCode: string, advisorName: string): Promise<boolean>`
- Produces: `studentService.resetStudentPassword(studentCode: string): Promise<boolean>`

- [ ] **Step 1: Write tests for Student Hashed Auth and 1-Click Reset in `test_backend_ux_integration.mjs`**
  - Test initial login with 5-digit code.
  - Test student password change and subsequent login with new password (and rejection of old password).
  - Test 1-click advisor reset reverting student password back to 5-digit code.
- [ ] **Step 2: Run test to verify it fails**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 3: Implement crypto hashing and methods in `authService.ts` and `studentService.ts`**
  - Implement SHA-256 hashing utility, password check logic, and advisor reset in `authService.ts`.
  - Add `passwordHash` and `isPasswordChanged` fields to `StudentRecord` in `studentService.ts`.
- [ ] **Step 4: Add 1-Click Advisor Reset Action to `ClassroomsRosterView.tsx`**
  - In student row action menu (`MoreVertical`), add `[🔑 รีเซ็ตรหัสผ่าน (คืนค่า 5 หลัก)]`.
  - Include confirmation modal / prompt and green toast notification upon success.
- [ ] **Step 5: Run tests and verify they pass**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 6: Commit**
  - `git add src/services/authService.ts src/services/studentService.ts src/views/ClassroomsRosterView.tsx test_backend_ux_integration.mjs`
  - `git commit -m "feat(student-auth): implement isolated hashed student login, password change, and 1-click advisor reset"`

---

### Task 3: Homeroom Advisor Assignment Settings (Student Affairs & Academic Admin RBAC)

**Files:**
- Modify: `src/types/viewModels.ts`
- Modify: `src/services/classroomService.ts`
- Modify: `src/views/SettingsBackupView.tsx`
- Test: `test_backend_ux_integration.mjs`

**Interfaces:**
- Consumes: `classroomService.getAll()`, `classroomService.update(id, updates)`
- Produces: `ClassroomRosterItem.coAdviser?: string`
- Produces: `classroomService.updateAdvisers(classroomId: string, adviser: string, coAdviser?: string): Promise<ClassroomRosterItem>`

- [ ] **Step 1: Write test for Homeroom Advisor Settings in `test_backend_ux_integration.mjs`**
  - Test updating classroom primary advisor and co-advisor.
  - Test verifying that updated advisor propagates to `classroomService` and `messagingService` advisory group metadata.
- [ ] **Step 2: Run test to verify it fails**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 3: Extend `classroomService.ts` and `viewModels.ts`**
  - Add `coAdviser?: string` to `ClassroomRosterItem`.
  - Implement `updateAdvisers()` method in `classroomService.ts` persisting to storage and notifying event bus.
- [ ] **Step 4: Upgrade `classrooms` Modal in `SettingsBackupView.tsx`**
  - Replace read-only static mockup cards with an interactive management table.
  - Render room list (ม.1/1 - ม.6/8) with dropdowns for ครูที่ปรึกษาหลัก (Primary Advisor) and ครูที่ปรึกษาร่วม (Co-Advisor).
  - Restrict editing to `STUDENT_AFFAIRS`, `ACADEMIC_ADMIN`, and `ADMIN` roles.
  - Include `[💾 บันทึกการตั้งค่าครูที่ปรึกษา]` with toast feedback.
- [ ] **Step 5: Run tests and verify they pass**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 6: Commit**
  - `git add src/types/viewModels.ts src/services/classroomService.ts src/views/SettingsBackupView.tsx test_backend_ux_integration.mjs`
  - `git commit -m "feat(settings): add homeroom advisor and co-advisor configuration with role-based access"`

---

### Task 4: Online Quiz Management & Question Builder in ExamManagementView

**Files:**
- Modify: `src/types/viewModels.ts`
- Create: `src/services/onlineQuizService.ts`
- Modify: `src/views/ExamManagementView.tsx`
- Test: `test_backend_ux_integration.mjs`

**Interfaces:**
- Produces: `onlineQuizService.createOnlineQuiz(quizData)`
- Produces: `onlineQuizService.getQuizById(examId)`
- Produces: `onlineQuizService.toggleQuizStatus(examId, isOpen)`
- Produces: `ExtendedExamItem.isOnlineQuiz?: boolean`
- Produces: `ExtendedExamItem.isOpen?: boolean`
- Produces: `ExtendedExamItem.passingScore?: number`
- Produces: `ExtendedExamItem.allowRetake?: boolean`
- Produces: `ExtendedExamItem.maxBlurWarnings?: number`
- Produces: `ExtendedExamItem.questions?: QuizQuestionItem[]`

- [ ] **Step 1: Write test for Online Quiz Service in `test_backend_ux_integration.mjs`**
  - Test creating an online quiz with questions, passing criteria, and retake policy.
  - Test toggling quiz open/closed status.
- [ ] **Step 2: Run test to verify it fails**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 3: Implement `src/services/onlineQuizService.ts`**
  - Build persistent service managing online quizzes, questions, and attempt records.
- [ ] **Step 4: Update `ExamManagementView.tsx` Create & Edit Modals**
  - Add Online Quiz toggle, passing score input, allow retake switch, and interactive Question Builder (Add question, choices A-D, correct answer picker, points).
  - Add Quick Open/Close Quiz toggle directly on the exam card.
  - Display badge `[📱 สอบออนไลน์]` and `[🔄 สอบซ่อมได้]` on online quiz cards.
- [ ] **Step 5: Run tests and verify they pass**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 6: Commit**
  - `git add src/types/viewModels.ts src/services/onlineQuizService.ts src/views/ExamManagementView.tsx test_backend_ux_integration.mjs`
  - `git commit -m "feat(quiz): add online quiz builder, passing score threshold, and retake controls to exam management"`

---

### Task 5: Student Exam Player with Anti-Cheat Focus Guard, Auto-Grading & Remedial Retake Engine

**Files:**
- Create: `src/components/exam/StudentExamPlayerModal.tsx`
- Modify: `src/views/ExamManagementView.tsx`
- Test: `test_backend_ux_integration.mjs`

**Interfaces:**
- Consumes: `onlineQuizService.submitQuizAttempt(examId, studentCode, studentName, answers, violationCount, isAutoSubmitted)`
- Consumes: `scoreService.upsertScore(...)`
- Produces: Auto-grading result with `score`, `isPassed`, `canRetake`

- [ ] **Step 1: Write test for Quiz Anti-Cheat and Auto-Grading in `test_backend_ux_integration.mjs`**
  - Test auto-grading calculation: verifies all correct answers result in 100%, passing score comparison marks `isPassed`.
  - Test anti-cheat violation tracking and auto-submit flag when violations exceed `maxBlurWarnings`.
  - Test automatic score sync into `scoreService.upsertScore()` matching the exam's assignment/score ledger.
  - Test remedial retake allowed if `score < passingScore` and `allowRetake === true`.
- [ ] **Step 2: Run test to verify it fails**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 3: Implement `src/components/exam/StudentExamPlayerModal.tsx`**
  - Fullscreen clean modal with Pastel Anime Education Dashboard styling.
  - Event listeners: `visibilitychange`, `blur`, `contextmenu`, `copy`.
  - Live violation counter & warning alert badge.
  - Timer and question navigation.
  - Post-submit review dialog: Shows score, pass/fail badge, and `[🔄 สอบซ่อม (ทำข้อสอบใหม่)]` button if eligible.
- [ ] **Step 4: Connect Quiz Player into `ExamManagementView.tsx`**
  - Add `[📱 ทดสอบทำข้อสอบ (Student View)]` button to each online quiz card to allow instant testing and verification.
- [ ] **Step 5: Run tests and verify they pass**
  - Run `node test_backend_ux_integration.mjs`.
- [ ] **Step 6: Commit**
  - `git add src/components/exam/StudentExamPlayerModal.tsx src/views/ExamManagementView.tsx test_backend_ux_integration.mjs`
  - `git commit -m "feat(quiz-player): implement student exam player with anti-cheat guard, auto-grading, and remedial retakes"`

---

### Task 6: Comprehensive Verification Test Suite & Quality Gate

**Files:**
- Modify: `test_backend_ux_integration.mjs`
- Test: All suites (`npm test`, `node test_backend_ux_integration.mjs`, `npm run build`)

- [ ] **Step 1: Run comprehensive integration verification suite**
  - Execute `node test_backend_ux_integration.mjs` and confirm all tiers (T1-T4 + new R6-R9 tiers) pass 100%.
- [ ] **Step 2: Run standard project test suites**
  - Execute `npm test` and verify all tests pass.
- [ ] **Step 3: Run TypeScript compiler and production build**
  - Execute `npm run build` and ensure exit code 0 with 0 TypeScript errors.
- [ ] **Step 4: Verify Git status**
  - Verify working tree is clean and all commits remain local.
- [ ] **Step 5: Commit any final test harness enhancements**
  - `git commit -m "test: verify production MVP, student auth, advisor settings, and online exam engine"`
