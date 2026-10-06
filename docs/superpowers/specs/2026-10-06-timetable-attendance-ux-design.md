# Design Specification: Smart Attendance Correlation Engine & Teacher Timetable UX Overhaul

**Document ID:** `2026-10-06-timetable-attendance-ux-design`  
**Status:** Approved for Implementation Planning  
**Target Project:** Kutchapprachasan School Classroom Management (`c:\dev\09 ระบบจัดการชั้นเรียน`)  
**Design System:** Pastel Anime Education Dashboard (Prompt typography, #163A66, #1D75D8, #10B981)

---

## 1. Executive Summary & Goals

This specification formalizes the UX/UI simplification and architecture overhaul requested by the user, covering 12 UX enhancement items and a centralized **Smart Attendance Correlation Engine** equipped with 4 strict data integrity locks:
1. **Separation of Manual vs. System Correlation** (`source`, `isOverridden`, `overrideBy`, `overrideReason`).
2. **Truancy Candidate & Conditional Promotion** (no unconditional destruction of attendance records).
3. **Morning Assembly Late Promotion from Period 1 Attendance** (business status driven, decoupled from click timestamps).
4. **Authorized Activity Model & Unified 80% Attendance Denominator**.

---

## 2. Centralized Architecture: Smart Attendance Correlation Engine

### 2.1 Data Models & Types (`src/services/attendanceCorrelationService.ts`)

```typescript
export type AttendanceStatusCode =
  | 'PRESENT'   // มาเรียน / มาแถวปกติ (ได้เวลาเรียน 100%)
  | 'LATE'      // มาสาย (ได้เวลาเรียน 100%)
  | 'ABSENT'    // ขาดเรียน (ไม่ได้เวลาเรียน 0%)
  | 'LEAVE'     // ลาป่วย / ลากิจ (ไม่ได้เวลาเรียน แต่แยกสถิติไว้พิจารณา มส.)
  | 'ACTIVITY'  // กิจกรรมโรงเรียนที่ได้รับอนุมัติ (ได้เวลาเรียน 100%)
  | 'TRUANCY';  // โดดเรียน / อยู่ในโรงเรียนแต่ไม่เข้าคาบ (ไม่ได้เวลาเรียน 0%)

export type AttendanceRecordSource =
  | 'MANUAL'              // ครูประจำวิชา / ครูที่ปรึกษาบันทึกเอง
  | 'SYSTEM_CORRELATION'  // ระบบอนุมานจากความสัมพันธ์แถวเช้า-คาบเรียน
  | 'APPROVED_ACTIVITY';  // ระบบดึงมาจากคำสั่ง/กิจกรรมที่ได้รับอนุมัติ

export interface AttendanceAuditLog {
  timestamp: string;
  actorId: string;
  actorName: string;
  previousStatus?: AttendanceStatusCode;
  newStatus: AttendanceStatusCode;
  reason?: string;
  source: AttendanceRecordSource;
}

export interface MorningAssemblyRecord {
  id: string;
  date: string;              // YYYY-MM-DD
  classroomId: string;       // e.g. 'room-3-1'
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatusCode;
  source: AttendanceRecordSource;
  isOverridden: boolean;
  overrideBy?: string;
  overrideAt?: string;
  overrideReason?: string;
  correlationNote?: string;
  markedAt: string;
}

export interface PeriodAttendanceRecord {
  id: string;
  date: string;              // YYYY-MM-DD
  classroomId: string;
  courseCode: string;        // e.g. 'ญ31201'
  courseName: string;
  periodNo: number;          // 1, 2, 3, ...
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatusCode;
  source: AttendanceRecordSource;
  isOverridden: boolean;
  overrideBy?: string;
  overrideAt?: string;
  overrideReason?: string;
  correlationNote?: string;
  isTruancyCandidate?: boolean;
  markedAt: string;
}

export interface ApprovedSchoolActivity {
  id: string;
  title: string;
  date: string;
  startPeriod: number;
  endPeriod: number;
  approverName: string;
  participatingStudentCodes: string[];
}
```

### 2.2 The 4 Integrity Locks & Correlation Logic

#### Lock 1: Separation of Teacher-Marked vs. System-Inferred Records
- Every attendance record carries `source: 'MANUAL' | 'SYSTEM_CORRELATION' | 'APPROVED_ACTIVITY'`.
- UI badges display distinct visual cues:
  - `MANUAL`: Solid indicator badge (e.g. `[✓ มา]`, `[◷ สาย]`).
  - `SYSTEM_CORRELATION`: Pill badge with robot / spark icon (e.g. `[🤖 โดดเรียน (ระบบอนุมาน)]` or `[⚠️ โดดเรียน]`).
  - Clicking a record displays the audit tooltip/modal with full provenance.

#### Lock 2: Truancy Promotion & Override Shield
```text
IF MorningAssembly.status IN ('PRESENT', 'LATE')
AND PeriodAttendance.status == 'ABSENT'
AND Student NOT IN ApprovedSchoolActivity(date, periodNo)
AND Student NOT IN ApprovedLeave(date, periodNo)
AND PeriodAttendance.isOverridden != true
THEN:
  PeriodAttendance.status = 'TRUANCY'
  PeriodAttendance.source = 'SYSTEM_CORRELATION'
  PeriodAttendance.isTruancyCandidate = true
  PeriodAttendance.correlationNote = 'อนุมานจากระบบ: นักเรียนเข้าแถวเช้าแล้ว แต่ไม่เข้าเรียนในคาบนี้'
```
- **Override Shield:** If a teacher manually modifies this status (e.g., changes `TRUANCY` to `PRESENT` because student was with the counselor), `isOverridden` is set to `true`, and future correlation cycles will **NEVER** overwrite it.

#### Lock 3: Absent Morning Assembly + Period 1 Present = Late Assembly (Decoupled from Click Timestamps)
```text
IF MorningAssembly.status == 'ABSENT'
AND MorningAssembly.isOverridden != true
AND Period_1_Attendance.status IN ('PRESENT', 'LATE')
THEN:
  MorningAssembly.status = 'LATE'
  MorningAssembly.source = 'SYSTEM_CORRELATION'
  MorningAssembly.correlationNote = 'ปรับเป็นสายอัตโนมัติ: พบนักเรียนเข้าเรียนในคาบที่ 1 (มิได้ขาดเรียนทั้งวัน)'
```
- **Timestamp Decoupling:** Even if the Period 1 teacher submits attendance at 10:30 AM, the system updates the **business attendance status** to `LATE`, without misattributing `10:30 AM` as the student's physical arrival gate time.

#### Lock 4: Approved Activity & Centralized 80% Calculation Rule
- Status `ACTIVITY` requires an approved school activity record or explicit activity pass.
- **Unified Denominator Rule:**
  $$\text{Total Scheduled Periods} = \text{All regular periods conducted in the term}$$
  $$\text{Earned Attendance Periods} = \text{Count}(\text{PRESENT}) + \text{Count}(\text{LATE}) + \text{Count}(\text{ACTIVITY})$$
  $$\text{Attendance Rate (\%)} = \left( \frac{\text{Earned Attendance Periods}}{\text{Total Scheduled Periods}} \right) \times 100$$
  - `LEAVE`, `ABSENT`, and `TRUANCY` do **not** contribute to earned attendance hours.
  - If $\text{Attendance Rate} \ge 80\%$, the student maintains regular exam eligibility (`ELIGIBLE`).
  - If $< 80\%$, the student is flagged as `AT_RISK_NO_EXAM` (เสี่ยง มส.).

---

## 3. UI/UX Specifications for the 12 Requested Features

### 3.1 Sidebar Navigation Structure (`TeacherSidebar.tsx`)
- **Menu order:**
  1. หน้าหลัก (`home`)
  2. ตารางสอน/วันนี้ (`timetable`)
  3. **เช็คแถวเช้า** (`morning-assembly`) 🆕 (Icon: `UserCheck`)
  4. **เช็คชื่อนักเรียน** (`classroom-attendance`) 🆕 (Icon: `ClipboardCheck`)
  5. ภาระงาน / สอน (`assignments`, badge: 3)
  6. นักเรียน (`roster`)
  7. ผลการเรียน (`sar`)
  8. สื่อการสอน / ไฟล์ (`lessons`)
  9. จัดการสอบ / เก็บคะแนน (`exams`)
  10. ปฏิทินกิจกรรม (`academic-year`)
  11. ข้อความ (`messages`, badge: 5)
  12. ตั้งค่า (`settings`)
  13. **แบนเนอร์ข้าง (Sidebar Mascot Banner):** Placed **directly below Settings** (no longer at the absolute bottom).
  14. ปุ่มออกจากระบบ (`LogOut`) at the bottom.

### 3.2 Teacher Custom Subject Banner with Automatic Client-Side Compression
- In course/classroom detail or lesson plans: Teachers can upload custom banners.
- **Client-Side Canvas Compression:**
  - Auto-resizes image to $\le 1200\text{px}$ width maintaining aspect ratio.
  - Encodes to WebP/JPEG at quality 0.82–0.85.
  - Ensures payload size remains under $150\text{KB}$, avoiding localStorage saturation while preserving crisp resolution.

### 3.3 Today's Timetable Card (`TeacherTodayTimetableCard.tsx`)
- **Period 0 (First Item):** `เช็คแถวเช้า (07:45 - 08:15 น.)` with quick button `[เช็คแถว]`.
- **Highlight Next Action Period:** Highlight the current/next upcoming period with bold blue border and badge `📌 คาบถัดไป`.
- **Completed Periods:** Display green checkmark `✓ เช็คแล้ว` and dim completed cards ($70\%$ opacity).
- **Toggle Control:** Add quick toggle `[ ✓ ซ่อนคาบที่เสร็จแล้ว ]`.
- **Removal of Orange Strip:** Completely delete the banner `☀️ ครูที่ปรึกษาประจำชั้น ม.3/1 (เช็คแถวเช้า 07:45 แยกต่างหาก)`.

### 3.4 Subject Icon System (`src/config/subjectIcons.ts`)
- Rich, diverse iconography covering all Thai school learning strands and specific subjects:
  - **Foreign Languages:** Japanese (`あ` red circle), Chinese (`中` deep red), Korean (`한` blue), English (`EN` / `A`), French (`FR`).
  - **Thai Language:** Thai letter `ก` (orange circle).
  - **Sciences & Tech:** Physics (⚡/Magnet), Chemistry (🧪 Flask), Biology (🧬 DNA/Leaf), General Science (🔬 Microscope), Computer/IT (💻 Code/Terminal).
  - **Mathematics:** `∑` / `📐` (sky blue circle).
  - **Social Studies & History:** Globe 🌍, Ancient Columns 🏛️.
  - **Health & P.E.:** Whistle / Soccer Ball ⚽.
  - **Arts & Music:** Palette 🎨, Musical Notes 🎵 / Traditional Ranat.
  - **Vocational:** Sprout / Wrench 🌱.
  - **Guidance & Scouts:** Compass 🧭.
- **Interactive Icon Picker:** Integrated into subject creation/editing with smart auto-detection (e.g. typing "เคมี" automatically selects 🧪).

### 3.5 Morning Assembly View (`MorningAssemblyView.tsx`)
- Dedicated full-page view for daily morning homeroom & assembly attendance.
- **Date & Classroom Selector:** Default to today and teacher's homeroom (`ม.3/1`).
- **4-Metric Stat Cards:** นักเรียนทั้งหมด, มาแถว (%), ขาด (คน), สาย (คน), ลา/กิจกรรม (คน).
- **Roster Table:** One-click attendance buttons (`มา`, `สาย`, `ขาด`, `ลา`, `กิจกรรม`).
- **Batch Action:** `[✓ มาแถวครบทุกคน]` for fast check-in.
- **Correlation indicator:** Displays smart system badges when records correlate with period attendance.

### 3.6 Classroom Attendance View (`ClassroomAttendanceView.tsx`)
- Dedicated full-page view for subject-period attendance.
- Select course, classroom, date, and period.
- Inline status buttons: `มา`, `สาย`, `ขาด`, `ลา`, `กิจกรรม`, `โดดเรียน`.
- **Correlation Banner & Alerts:** Warns when morning attendance indicates student was present at assembly but marked absent in class.
- **80% Attendance Gauge:** Real-time calculation showing earned hours vs total required hours.

### 3.7 Full Timetable Simplification (`TimetableView.tsx`)
- **Full Width Grid:** Remove right sidebar cards (*สรุปการเช็คในช่วงนี้*, *งานที่ต้องทำวันนี้*, *ปฏิทินกิจกรรมใกล้ตัว*). Timetable expands to $100\%$ width.
- **20-Week Term Boundary:** Replace arbitrary week 29 with 20-week selector:
  `< [📅 29 ก.ย. – 5 ต.ค. 2569] [สัปดาห์ที่ 16 / 20 สัปดาห์] >`
- **Uniform Cell Grid Matrix:** Every period slot across Monday–Friday has identical dimensions (`h-32 min-h-[128px] w-full p-2.5 rounded-xl border flex flex-col justify-between`).
- **Information Hierarchy per Slot:**
  1. Course Code (e.g. `ญ31201`) + Subject Icon badge
  2. Course Name (line-clamp-2)
  3. Class & Room (e.g. `ม.3/1` • `ห้อง 324`)
  4. Status pill

### 3.8 Bell Schedule & Lunch Break Settings (`SettingsBackupView.tsx`)
- New settings section: **"เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)"**
  - Morning assembly start/end time (e.g. 07:45 – 08:15).
  - Periods per day (6, 7, 8, 9).
  - Period duration (e.g. 50 mins) and start time.
  - **Lunch Break Mode (โหมดนับคาบพักเที่ยง):**
    - **Mode A (Numbered Period):** Lunch is counted as a numbered period (e.g. Period 4 Class, Period 5 Lunch, Period 6 Afternoon Class).
    - **Mode B (Skipped Period):** Lunch is a break slot between periods (e.g. Period 4 Morning Class, [Lunch Break], Period 5 Afternoon Class).

### 3.9 Classroom Roster Simplification (`ClassroomsRosterView.tsx`)
- Consolidate multiple filter dropdowns into **a single concise Classroom Dropdown** (`[ 🏫 ม.3/1 ˇ ]`).
- Clean, focused interface with quick search bar and student table.

---

## 4. Verification & Testing Strategy

1. **Automated Test Suite (`test_attendance_correlation_engine.mjs`):**
   - Verify Lock 1: `source` tagging and manual override persistence.
   - Verify Lock 2: Truancy candidate inference without destructive overwrite.
   - Verify Lock 3: Absent morning assembly promoted to Late when Period 1 is attended, independent of click timestamps.
   - Verify Lock 4: Approved activity attendance and standardized 80% calculation denominator.
   - Verify 20-week term limit and bell schedule lunch mode calculations.
2. **Regression Verification:**
   - Run all existing 5 test suites (96 assertions) to ensure zero regressions across Calendar, Admin Dashboard, Teacher Dashboard, Exam Management, and Messages View.
   - Run `tsc -b && vite build` and `oxlint` to guarantee 0 errors.

---

## 5. Review & Approval

This specification is ready for review. Following user confirmation, we will transition directly into the implementation plan.
