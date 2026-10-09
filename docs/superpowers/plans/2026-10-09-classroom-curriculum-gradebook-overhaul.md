# Classroom, Curriculum, Attendance & Gradebook Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul classroom management with up to 3 advisors, CSV import/export with database fuzzy verification & upsert, fix classroom deletion, enforce Bangkok timezone dates, connect classroom attendance & student gradebook to curriculum units, move buttons down from hero banner, group curriculum by term/year, and auto-sync exam scores to SGS gradebook columns.

**Architecture:** 
- Enhance `classroomService.ts` and `types/viewModels.ts` to support up to 3 advisors, robust delete persistence, and fuzzy name matching against teacher accounts.
- Create Bangkok timezone date utility in `src/utils/timetableDateUtils.ts` returning real-time Asia/Bangkok `YYYY-MM-DD` and Buddhist calendar strings.
- Connect `ClassroomAttendanceView.tsx` to `coursesCurriculumService.ts` for dynamic curriculum courses and classrooms.
- Move action buttons from `PageHeroBanner` in `CoursesCurriculumView.tsx` into a dedicated toolbar, group courses by academic term/year, and provide a course creation modal.
- Connect `ExamManagementView.tsx` to `sgsRosterAndSubmissionService.ts` to link exams directly to SGS gradebook columns (`u1`, `u2`, `u3`, `midterm`, `final`) and auto-sync scores.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide Icons / MingCute Icons, Supabase client, Vitest.

---

### Task 1: Bangkok Timezone (`Asia/Bangkok`) Date Engine & Current Date Fix

**Files:**
- Modify: `src/utils/timetableDateUtils.ts`
- Modify: `src/views/TeacherOverviewView.tsx`
- Modify: `src/views/MorningAssemblyView.tsx`
- Modify: `src/views/ClassroomAttendanceView.tsx`
- Modify: `src/components/dashboard/TeacherTodayTimetableCard.tsx`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Update `src/utils/timetableDateUtils.ts` with Bangkok timezone helpers**
Add `getBangkokNow()`, `getBangkokTodayString()`, `getBangkokDayName()`, `formatThaiDateFull()`.
- [ ] **Step 2: Replace hardcoded `'2026-10-02'` with dynamic `getBangkokTodayString()` across views**
Update `TeacherOverviewView.tsx`, `MorningAssemblyView.tsx`, `ClassroomAttendanceView.tsx`, and `TeacherTodayTimetableCard.tsx`.
- [ ] **Step 3: Run tests to verify Bangkok date generation**
Run: `node test_attendance_correlation_engine.mjs`
Expected: PASS

---

### Task 2: Advisor Model (Up to 3 Advisors) & Fallback Bug Fix

**Files:**
- Modify: `src/types/viewModels.ts`
- Modify: `src/services/classroomService.ts`
- Modify: `src/components/dashboard/TeacherTodayTimetableCard.tsx`
- Modify: `src/views/MorningAssemblyView.tsx`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Update `ClassroomRosterItem` in `src/types/viewModels.ts`**
Add `coAdviser?: string; thirdAdviser?: string; advisers?: string[];`.
- [ ] **Step 2: Update `classroomService.ts`**
Support `updateAdvisers(id, adviser, coAdviser, thirdAdviser)` and `getTeacherAdvisoryClassroom(teacherNameOrId)`.
- [ ] **Step 3: Fix fallback to ม.3/1 when teacher has no homeroom**
In `TeacherTodayTimetableCard.tsx` and `MorningAssemblyView.tsx`, check if teacher is an advisor of any room; if not, do not default to ม.3/1.
- [ ] **Step 4: Verify with test script**

---

### Task 3: Classroom Deletion Bug Fix & Trash Management

**Files:**
- Modify: `src/services/classroomService.ts`
- Modify: `src/views/ClassroomManagementView.tsx`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Implement robust delete in `classroomService.ts`**
Filter local storage, add to `cls_trash_data`, mark status = 'INACTIVE' in Supabase by matching both `id` and `name`, maintain deleted blacklist in localStorage so rooms never resurrect.
- [ ] **Step 2: Update `ClassroomManagementView.tsx`**
Ensure delete button is accessible to all staff roles managing the page and refreshes local state on delete.
- [ ] **Step 3: Verify deletion flow with test script**

---

### Task 4: Classroom & Advisor Import/Export System with Pre-Import Fuzzy Match

**Files:**
- Create: `src/utils/fuzzyNameMatcher.ts`
- Modify: `src/services/classroomService.ts`
- Modify: `src/views/ClassroomManagementView.tsx`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Create `src/utils/fuzzyNameMatcher.ts`**
Implement whitespace collapse, prefix normalization (นาย, นาง, นางสาว, ครู), and Levenshtein similarity score (0.0 to 1.0).
- [ ] **Step 2: Add CSV Export function in `ClassroomManagementView.tsx`**
Export CSV with columns: `ห้องเรียน,ระดับชั้น,ครูที่ปรึกษา 1,ครูที่ปรึกษา 2,ครูที่ปรึกษา 3,จำนวนนักเรียน` with UTF-8 BOM.
- [ ] **Step 3: Add CSV Import Modal in `ClassroomManagementView.tsx`**
Verify advisor names against `classroomService.getTeacherAccounts()`, show match status / suggestions, and implement upsert (update existing room's advisors, insert only if new).
- [ ] **Step 4: Verify with test script**

---

### Task 5: Move Buttons Down from Banner & Group Curriculum by Term/Academic Year

**Files:**
- Modify: `src/views/CoursesCurriculumView.tsx`
- Modify: `src/views/LessonPlansView.tsx`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Move `[🗑️ ถังขยะสื่อ]` and `[📑 ใช้แผนเดิมข้ามปี]` from `PageHeroBanner`**
Move them down to a clean toolbar right beneath the banner in `CoursesCurriculumView.tsx`.
- [ ] **Step 2: Add `[+ เพิ่มรายวิชาใหม่]` button in toolbar**
Make the course creation button and modal prominent and accessible.
- [ ] **Step 3: Group curriculum courses by Term & Academic Year**
Group courses into sections (e.g. ภาคเรียนที่ 1/2569, ภาคเรียนที่ 2/2569) with tabs or grouped cards.
- [ ] **Step 4: Run build check**

---

### Task 6: Connect Classroom Attendance & Student Grades to Curriculum Units

**Files:**
- Modify: `src/views/ClassroomAttendanceView.tsx`
- Modify: `src/services/sgsRosterAndSubmissionService.ts`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Connect `ClassroomAttendanceView.tsx` to active curriculum courses**
Derive course options from `coursesCurriculumService.getActiveCourses()` and classrooms from `course.assignedClassrooms`.
- [ ] **Step 2: Connect student grades in SGS to curriculum units**
Map units `u1`, `u2`, `u3` to curriculum units.
- [ ] **Step 3: Verify with test script**

---

### Task 7: Link Exam Creation to Gradebook Column & Auto-Sync Scores

**Files:**
- Modify: `src/views/ExamManagementView.tsx`
- Modify: `src/services/sgsRosterAndSubmissionService.ts`
- Test: `test_attendance_correlation_engine.mjs`

- [ ] **Step 1: Add gradebook target column selector in Exam Creation Modal**
Allow selecting `'u1' | 'u2' | 'u3' | 'midterm' | 'final'` in `ExamManagementView.tsx`.
- [ ] **Step 2: Auto-sync scores to chosen gradebook column**
When saving scores or completing online quizzes, sync scores into the chosen column in `sgsRosterAndSubmissionService`.
- [ ] **Step 3: Verify with end-to-end tests**
