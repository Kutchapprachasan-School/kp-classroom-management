# Smart Attendance Correlation Engine & Teacher Timetable UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a centralized Smart Attendance Correlation Engine with 4 integrity locks, dedicated Morning Assembly and Classroom Attendance views, and comprehensive UX/UI simplifications across Timetable, Sidebar, Bell Schedule Settings, Subject Icons, and Teacher Banners.

**Architecture:** Centralize all morning assembly and period attendance relationship reasoning in `src/services/attendanceCorrelationService.ts` to strictly enforce the 4 integrity locks (provenance tracking, Truancy candidate protection, timestamp-independent late promotion, and standard 80% calculation). Build clean, dedicated React views (`MorningAssemblyView.tsx`, `ClassroomAttendanceView.tsx`) with Prompt typography and Pastel Anime Education Dashboard design tokens, while refactoring the Timetable matrix to a 100% full-width uniform 20-week grid and consolidating settings and roster controls.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, HTML5 Canvas API, Node.js test runner.

## Global Constraints

- Design System: Pastel Anime Education Dashboard (Prompt typography, primary sky blue `#1D75D8`, slate `#163A66`, mint emerald `#10B981`).
- Fonts: Thai-first `'Prompt', sans-serif` across all UI elements.
- Attendance Logic: Automation must never destructively alter attendance records; every record must track `source` ('MANUAL' | 'SYSTEM_CORRELATION' | 'APPROVED_ACTIVITY') and honor manual overrides (`isOverridden`).
- Attendance Rule: $\text{Attendance Rate} = (\text{Earned Periods} / \text{Total Scheduled Periods}) \times 100$, where Earned Periods = PRESENT + LATE + ACTIVITY. LEAVE, ABSENT, TRUANCY do not earn hours.
- Client-Side Banner Compression: Max width 1200px, quality 0.85, payload < 150KB.
- Zero Regressions: All 5 existing verification test suites (96 assertions) must continue to pass 100%.

---

### Task 1: Smart Attendance Correlation Service & 4 Integrity Locks Engine

**Files:**
- Create: `src/services/attendanceCorrelationService.ts`
- Create: `test_attendance_correlation_engine.mjs`

**Interfaces:**
- Consumes: LocalStorage API, student data from `src/services/studentService.ts`.
- Produces: `attendanceCorrelationService` with methods:
  - `getMorningRecords(classroomId: string, date: string): MorningAssemblyRecord[]`
  - `saveMorningRecords(records: MorningAssemblyRecord[]): void`
  - `getPeriodRecords(courseCode: string, classroomId: string, date: string, periodNo: number): PeriodAttendanceRecord[]`
  - `savePeriodRecords(records: PeriodAttendanceRecord[]): void`
  - `runCorrelation(classroomId: string, date: string): CorrelationResult`
  - `calculateAttendance80Rule(studentCode: string, courseCode: string): Attendance80Summary`

- [ ] **Step 1: Write the failing test script `test_attendance_correlation_engine.mjs`**

```javascript
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';

console.log('🧪 Starting Smart Attendance Correlation Engine Verification...');

// Verify service file exists
const servicePath = './src/services/attendanceCorrelationService.ts';
assert.ok(existsSync(servicePath), 'attendanceCorrelationService.ts must exist');

const serviceSource = readFileSync(servicePath, 'utf8');

// Lock 1: Provenance Tracking (MANUAL vs SYSTEM_CORRELATION vs APPROVED_ACTIVITY)
assert.ok(serviceSource.includes("'MANUAL'"), 'Lock 1: must support MANUAL source');
assert.ok(serviceSource.includes("'SYSTEM_CORRELATION'"), 'Lock 1: must support SYSTEM_CORRELATION source');
assert.ok(serviceSource.includes("'APPROVED_ACTIVITY'"), 'Lock 1: must support APPROVED_ACTIVITY source');
assert.ok(serviceSource.includes('isOverridden'), 'Lock 1: must support isOverridden flag');

// Lock 2: Truancy Promotion & Override Shield
assert.ok(serviceSource.includes("'TRUANCY'"), 'Lock 2: must support TRUANCY status');
assert.ok(serviceSource.includes('isTruancyCandidate'), 'Lock 2: must track isTruancyCandidate');
assert.ok(serviceSource.includes('!record.isOverridden'), 'Lock 2: must shield overridden records from auto-update');

// Lock 3: Decoupled Morning Late Promotion
assert.ok(serviceSource.includes("'LATE'"), 'Lock 3: must promote absent morning to LATE when period 1 present');
assert.ok(!serviceSource.includes('markedAt.getTime() < 8'), 'Lock 3: must decouple from click timestamp');

// Lock 4: Unified 80% Denominator Rule
assert.ok(serviceSource.includes('calculateAttendance80Rule') || serviceSource.includes('calculateAttendanceSummary'), 'Lock 4: must include 80% attendance rule calculation');
assert.ok(serviceSource.includes('0.8') || serviceSource.includes('80'), 'Lock 4: must calculate 80% threshold');

console.log('🎉 ALL ATTENDANCE CORRELATION ENGINE UNIT CHECKS PASSED!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test_attendance_correlation_engine.mjs`
Expected: FAIL with "attendanceCorrelationService.ts must exist"

- [ ] **Step 3: Implement `src/services/attendanceCorrelationService.ts`**

Implement complete types, storage, correlation engine, and 4 integrity locks adhering to the design specification.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test_attendance_correlation_engine.mjs`
Expected: PASS with "🎉 ALL ATTENDANCE CORRELATION ENGINE UNIT CHECKS PASSED!"

- [ ] **Step 5: Commit**

```bash
git add src/services/attendanceCorrelationService.ts test_attendance_correlation_engine.mjs
git commit -m "feat(attendance): implement Smart Attendance Correlation Service with 4 integrity locks"
```

---

### Task 2: Subject Icons System & Multi-Strand Icon Config

**Files:**
- Create: `src/config/subjectIcons.ts`

**Interfaces:**
- Consumes: Subject code and subject name strings.
- Produces:
  - `SubjectIconConfig`: type with `id`, `name`, `strand`, `symbol`, `colorClass`, `bgClass`, `textColorClass`.
  - `ALL_SUBJECT_ICONS`: list of icons covering Foreign Languages (ญ あ, 中, 한, EN, FR), Thai (ก), Science (⚡, 🧪, 🧬, 🔬, 💻), Math (∑, 📐), Social (🌍, 🏛️), PE (⚽), Arts (🎨, 🎵), Vocational (🌱), Guidance (🧭).
  - `getSubjectIcon(codeOrName: string, name?: string): SubjectIconConfig`

- [ ] **Step 1: Write test verification in `test_attendance_correlation_engine.mjs`**

Add tests to verify `src/config/subjectIcons.ts` contains Japanese, Chinese, Korean, English, Thai, Physics, Chemistry, Biology, Computing, Math, PE, Arts, Music, Vocational, and Guidance icons.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test_attendance_correlation_engine.mjs`
Expected: FAIL indicating `subjectIcons.ts` does not exist yet.

- [ ] **Step 3: Implement `src/config/subjectIcons.ts`**

Implement full catalog of icons and fuzzy string matcher `getSubjectIcon`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test_attendance_correlation_engine.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/subjectIcons.ts test_attendance_correlation_engine.mjs
git commit -m "feat(icons): add comprehensive subject icon system with auto-detection"
```

---

### Task 3: Client-Side Canvas Image Resizer & Compressor for Teacher Banners

**Files:**
- Create: `src/utils/imageCompressor.ts`

**Interfaces:**
- Consumes: `File` object from file inputs.
- Produces: `compressSubjectBannerImage(file: File, maxWidth?: number, quality?: number): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }>`
  - Auto-resizes to $\le 1200\text{px}$ width.
  - Compresses to JPEG/WebP at $85\%$ quality.
  - Ensures payload is $< 150\text{KB}$.

- [ ] **Step 1: Write test check in test suite**

Verify image compressor utility exists and exports required methods.

- [ ] **Step 2: Implement `src/utils/imageCompressor.ts`**

Implement browser canvas image resizing, aspect ratio maintenance, and size guard.

- [ ] **Step 3: Verify build compiles**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/imageCompressor.ts
git commit -m "feat(banner): add client-side canvas image compressor for teacher banners"
```

---

### Task 4: Teacher Sidebar Reorganization & App Navigation

**Files:**
- Modify: `src/components/layout/TeacherSidebar.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Navigation keys `morning-assembly` and `classroom-attendance`.
- Produces:
  - Sidebar menu with 12 items: Home, Timetable, **เช็คแถวเช้า (Morning Assembly)**, **เช็คชื่อนักเรียน (Classroom Attendance)**, Assignments, Roster, SAR, Lessons, Exams, Academic Calendar, Messages, Settings.
  - Sidebar mascot banner moved **directly beneath Settings** (in natural scroll flow).
  - App.tsx route mappings for `morning-assembly` and `classroom-attendance`.

- [ ] **Step 1: Add new View Keys to `TeacherSidebar.tsx` and `App.tsx`**

Add `'morning-assembly' | 'classroom-attendance'` to `TeacherViewKey`.

- [ ] **Step 2: Reorder navigation items and reposition sidebar banner**

Add the 2 new menus with icons `UserCheck` and `ClipboardCheck`, and position the mascot banner right after the `settings` menu inside the navigation scroll container.

- [ ] **Step 3: Add view rendering stubs in `App.tsx`**

Mount views for `'morning-assembly'` and `'classroom-attendance'`.

- [ ] **Step 4: Verify test suite and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/TeacherSidebar.tsx src/App.tsx
git commit -m "refactor(sidebar): add morning assembly and classroom attendance menus and relocate banner under settings"
```

---

### Task 5: Dedicated Morning Assembly View (`MorningAssemblyView.tsx`)

**Files:**
- Create: `src/views/MorningAssemblyView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `attendanceCorrelationService`, `studentService`, `getSchoolSettings()`.
- Produces:
  - Date and classroom selectors (default today, `ม.3/1`).
  - 4-metric statistics cards (Total, Present %, Absent, Late, Leave/Activity).
  - One-click attendance buttons (`มา`, `สาย`, `ขาด`, `ลา`, `กิจกรรม`).
  - Batch action: `[✓ มาแถวครบทุกคน]` for fast check-in.
  - Correlation indicator chip showing when attendance correlates with period records.

- [ ] **Step 1: Create `src/views/MorningAssemblyView.tsx`**

Implement complete UI matching Pastel Anime Education Dashboard guidelines with Prompt font, statistics cards, responsive roster table, and fast batch check-in.

- [ ] **Step 2: Connect `MorningAssemblyView` in `src/App.tsx`**

Render `<MorningAssemblyView />` when `currentView === 'morning-assembly'`.

- [ ] **Step 3: Verify build and test suite**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/MorningAssemblyView.tsx src/App.tsx
git commit -m "feat(attendance): implement dedicated Morning Assembly view with 4-metric statistics and fast check-in"
```

---

### Task 6: Dedicated Classroom Attendance View (`ClassroomAttendanceView.tsx`)

**Files:**
- Create: `src/views/ClassroomAttendanceView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `attendanceCorrelationService`, `subjectIcons`.
- Produces:
  - Subject, classroom, date, and period selectors.
  - Roster grid with status buttons: `มา`, `สาย`, `ขาด`, `ลา`, `กิจกรรม`, `โดดเรียน`.
  - Smart Correlation Banner: alerts when morning assembly indicates student was present but period attendance is absent (Truancy candidate with non-destructive override shield).
  - 80% Attendance Eligibility Gauge showing real-time hours breakdown and exam qualification status.

- [ ] **Step 1: Create `src/views/ClassroomAttendanceView.tsx`**

Implement complete UI with course selector, period tabs, correlation alert pills, and 80% gauge.

- [ ] **Step 2: Connect `ClassroomAttendanceView` in `src/App.tsx`**

Render `<ClassroomAttendanceView />` when `currentView === 'classroom-attendance'`.

- [ ] **Step 3: Verify build and test suite**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/ClassroomAttendanceView.tsx src/App.tsx
git commit -m "feat(attendance): implement Classroom Attendance view with correlation alert banner and 80% eligibility gauge"
```

---

### Task 7: Today's Timetable Card Overhaul (`TeacherTodayTimetableCard.tsx`)

**Files:**
- Modify: `src/components/dashboard/TeacherTodayTimetableCard.tsx`
- Modify: `src/views/AssignmentManagementView.tsx`
- Modify: `src/views/TeacherOverviewView.tsx`

**Interfaces:**
- Consumes: `attendanceCorrelationService`.
- Produces:
  - Period 0 as the very first item: `เช็คแถวเช้า (07:45 - 08:15 น.)` with quick button `[เช็คแถว]`.
  - Dynamic Next Period Highlight: badges current or next upcoming class with `📌 คาบถัดไป` and distinct blue border.
  - Completed Periods: shows `✓ เช็คแล้ว` with subtle dimming ($70\%$ opacity).
  - Quick Toggle: `[ ✓ ซ่อนคาบที่เสร็จแล้ว ]` to collapse completed classes.
  - Remove orange strip: delete `☀️ ครูที่ปรึกษาประจำชั้น ม.3/1 (เช็คแถวเช้า 07:45 แยกต่างหาก)` from all files.

- [ ] **Step 1: Update `TeacherTodayTimetableCard.tsx` with Period 0 and Next Period Highlight**

Add Period 0 for morning assembly, next period highlight calculation, completed period dimming, and toggle hide completed.

- [ ] **Step 2: Remove orange strip in `AssignmentManagementView.tsx` and `TeacherOverviewView.tsx`**

Remove the banner `☀️ ครูที่ปรึกษาประจำชั้น ม.3/1 (เช็คแถวเช้า 07:45 แยกต่างหาก)`.

- [ ] **Step 3: Run test suite to verify no regressions**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/TeacherTodayTimetableCard.tsx src/views/AssignmentManagementView.tsx src/views/TeacherOverviewView.tsx
git commit -m "refactor(timetable): overhaul today timetable card with morning assembly period 0, next-period highlight, and strip removal"
```

---

### Task 8: Full Timetable Matrix Simplification (`TimetableView.tsx` & `timetableDateUtils.ts`)

**Files:**
- Modify: `src/views/TimetableView.tsx`
- Modify: `src/utils/timetableDateUtils.ts`

**Interfaces:**
- Consumes: `computeWeekInfo(weekOffset)`.
- Produces:
  - Full width $100\%$ grid: remove right sidebar widgets (สรุปการเช็คในช่วงนี้, งานที่ต้องทำวันนี้, ปฏิทินกิจกรรมใกล้ตัว).
  - 20-week term boundary: week selector displays `สัปดาห์ที่ X / 20 สัปดาห์` clamped between week 1 and 20.
  - Uniform cell dimensions: all matrix slots share identical height and width (`min-h-[128px]`, uniform flex layout) displaying Subject Code, Subject Name (line-clamp-2), Class/Room, and Status pill.

- [ ] **Step 1: Update `src/utils/timetableDateUtils.ts` to 20-week term boundary**

Clamp `weekNumber` between 1 and 20 based on instructional weeks.

- [ ] **Step 2: Remove right 3 widgets in `src/views/TimetableView.tsx` and expand table to 100% width**

Refactor grid from `grid-cols-12` to full width `w-full` and unify cell styling.

- [ ] **Step 3: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/TimetableView.tsx src/utils/timetableDateUtils.ts
git commit -m "refactor(timetable): expand timetable to 100% width, 20-week semester boundary, and uniform grid cells"
```

---

### Task 9: Bell Schedule & Lunch Break Settings in Settings View

**Files:**
- Modify: `src/views/SettingsBackupView.tsx`

**Interfaces:**
- Consumes: LocalStorage settings.
- Produces:
  - Settings section: **"เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)"**
  - Settings for morning assembly time (07:45 – 08:15).
  - Number of periods per day (6–9).
  - Period duration (e.g., 50 minutes).
  - **Lunch Break Mode (โหมดนับคาบพักเที่ยง)**:
    - Mode A: นับเป็นคาบที่ (เช่น คาบ 4 เรียน, คาบ 5 พักเที่ยง, คาบ 6 เรียน)
    - Mode B: ข้ามคาบพักเที่ยง ไม่นับเป็นคาบที่ (เช่น คาบ 4 เรียน, [พักเที่ยง], คาบ 5 เรียน)

- [ ] **Step 1: Add Bell Schedule state and controls in `SettingsBackupView.tsx`**

Integrate schedule configuration controls into the Calendar/Schedule tab.

- [ ] **Step 2: Test settings persistence and validation**

Ensure settings persist to `localStorage` under `kp_school_bell_schedule`.

- [ ] **Step 3: Verify build and test suite**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/SettingsBackupView.tsx
git commit -m "feat(settings): add school bell schedule and lunch break mode settings"
```

---

### Task 10: Classroom Roster View Dropdown Consolidation

**Files:**
- Modify: `src/views/ClassroomsRosterView.tsx`

**Interfaces:**
- Consumes: `allClassrooms`, `selectedClass`.
- Produces:
  - Single, consolidated classroom dropdown selector in the header bar.
  - Elimination of duplicate/redundant room selection buttons.

- [ ] **Step 1: Streamline room selection in `ClassroomsRosterView.tsx`**

Unify the room selection trigger into one clean dropdown button (`[ 🏫 ม.3/1 ˇ ]`).

- [ ] **Step 2: Verify component responsiveness and tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/ClassroomsRosterView.tsx
git commit -m "refactor(roster): consolidate classroom roster selector to a single clean dropdown"
```

---

### Task 11: End-to-End Verification & Documentation Handoff

**Files:**
- Modify: `test_attendance_correlation_engine.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: All updated components and services.
- Produces: Complete end-to-end verification passing 100% across all 6 test suites with 0 lint errors and clean production build.

- [ ] **Step 1: Add `test_attendance_correlation_engine.mjs` to `package.json` `test` script**

Ensure `npm test` runs all verification suites automatically.

- [ ] **Step 2: Run all test suites**

Run: `npm test`
Expected: ALL checks passed with 100% success.

- [ ] **Step 3: Run linter and production build**

Run: `npm run lint && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit & Push to main**

```bash
git add package.json test_attendance_correlation_engine.mjs
git commit -m "test: register attendance correlation suite into npm test and verify full build"
```
