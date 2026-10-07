# Production MVP Transition, Student Auth, Homeroom Advisor Settings, & Online Quiz Engine Specification

> Date: 2026-10-07  
> Author: Pair Programming AI Assistant & User  
> Target System: Thai Secondary School Management SaaS (Pastel Anime Education Dashboard)  
> Repository Working Directory: `c:\dev\09 ระบบจัดการชั้นเรียน`

---

## 1. Executive Summary & Core Requirements

This specification formalizes the transformation of the Classroom Management System into a **production-ready MVP (Minimum Viable Product)** for immediate deployment in schools, strictly obeying the requirement:
**"เริ่มใช้งานจริง เอา Mock data ออกให้หมดจะเริ่มแล้ว เน้น MVP แล้วค่อยปรับปรุงการใช้หลังการใช้งาน แต่ทำไม่ให้กระทบกับระบบหลักด้วยนะ"**

### Four Core Pillars:
1. **Clean Slate & Production Baseline Initialization**:
   - Clear all transactional mock data (daily attendance entries, student submission scores, exam records, dummy chat messages).
   - Preserve foundational school infrastructure (School Profile, Academic Year 2569 Term 1, Bell Schedule, and Classrooms ม.1/1 – ม.6/8).
   - Provide an Admin/Teacher Clean Slate reset toggle while keeping Supabase Auth and the staff leave system 100% untouched.
2. **Student Self-Contained Authentication & Password Management**:
   - Isolate students from the Supabase Auth user quota (`auth.users`), avoiding any interference with teachers or staff.
   - Student credentials reside in `public.students` (`password_hash`, `is_password_changed`, `student_code`).
   - Default initial password = 5-digit Student Code (`student_code`).
   - Students can change their password upon login, persisting across devices.
   - Homeroom Advisors and Admins have a **1-Click Password Reset** button in `ClassroomsRosterView.tsx` to instantly revert a student's password back to their 5-digit code.
3. **Homeroom Advisor Configuration in System Settings**:
   - In `SettingsBackupView.tsx` (`classrooms` modal), enable Student Affairs teachers (`STUDENT_AFFAIRS`) and Academic Admins (`ACADEMIC_ADMIN`, `ADMIN`) to assign Primary and Co-Advisors per classroom.
   - Saves persistently and synchronizes with `classroomService`, advisory chat groups (`messagingService`), and student rosters.
4. **Online Quiz Engine with Remedial Retake & Anti-Cheating Focus Guard**:
   - **Quiz Builder & Policy**: Teachers create chapter-end quizzes with passing score criteria (`passing_score`), retake policy (`allow_retake`), and active status toggle (`is_open`).
   - **Anti-Cheating Guard**: Student Quiz Player listens to `document.visibilitychange` and `window.blur`, blocks right-click/copy, tracks warnings, and triggers auto-submit if warnings exceed `max_blur_warnings`.
   - **Auto-Grading & SGS Sync**: Automatically scores answers on submit, immediately writes grades to the grade ledger (`scoreService.upsertScore`), and enables continuous remedial retakes until the student passes.

---

## 2. Architecture & Data Contracts

### 2.1 Database Schema Extensions (Supabase / Offline Invariant)

```sql
-- Students table enhancements
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Classrooms table co-adviser extension
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS co_adviser_name TEXT,
ADD COLUMN IF NOT EXISTS co_adviser_id TEXT;

-- Exams table online quiz extensions
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS is_online_quiz BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS passing_score NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS max_retake_attempts INT NOT NULL DEFAULT 0, -- 0 = unlimited
ADD COLUMN IF NOT EXISTS max_blur_warnings INT NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Student Quiz Attempts table
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    attempt_no INT NOT NULL DEFAULT 1,
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    is_passed BOOLEAN NOT NULL,
    violation_count INT NOT NULL DEFAULT 0,
    is_auto_submitted BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

### 2.2 TypeScript Type Definitions

```typescript
export interface QuizQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
}

export interface StudentQuizAttemptRecord {
  id: string;
  examId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  attemptNo: number;
  score: number;
  maxScore: number;
  isPassed: boolean;
  violationCount: number;
  isAutoSubmitted: boolean;
  answers: Record<string, string>; // questionId -> optionKey
  submittedAt: string;
}
```

---

## 3. Detailed Component Specifications

### 3.1 Clean Slate Data Transition
- Default clean initial state:
  - If localStorage contains legacy mock entries, offer a one-click **"ล้างข้อมูลจำลองเพื่อเริ่มใช้งานจริง (Clean Slate MVP)"** in Settings or prompt.
  - Keeps classrooms (`room-1-1` through `room-6-8`), academic calendar, and bell schedule intact.
  - Clears `scores`, `morning_assembly_records`, `period_attendance_records`, and `messages`.

### 3.2 Student Authentication & 1-Click Reset
- Hash algorithm: SHA-256 with salt in client & backend adapter.
- Login check:
  1. Retrieve student record by `student_code`.
  2. If `!is_password_changed`: verify `pinOrPassword === student_code`.
  3. If `is_password_changed`: verify `hash(pinOrPassword) === student.password_hash`.
- Advisor Reset Action:
  - Inside `ClassroomsRosterView.tsx` action menu:
    - Button: `[🔑 รีเซ็ตรหัสผ่านนักเรียน]`
    - Resets `password_hash = null`, `is_password_changed = false`.
    - Toast: `รีเซ็ตรหัสผ่านของ [ชื่อนักเรียน] เป็นรหัส 5 หลัก (${stu.code}) เรียบร้อยแล้ว`.

### 3.3 Homeroom Advisor Settings
- View: `SettingsBackupView.tsx` -> Modal `classrooms`.
- Permissions: Allowed for roles `STUDENT_AFFAIRS`, `ACADEMIC_ADMIN`, and `ADMIN`.
- Interface:
  - Lists each classroom with dropdown selectors for Primary Advisor and Co-Advisor.
  - Saves updates to `classroomService` (`cls_classrooms_data`) and triggers `messagingService` to re-sync homeroom advisory chat group names and owners.

### 3.4 Online Quiz & Anti-Cheat Engine
- **Teacher View** (`ExamManagementView.tsx`):
  - Form fields when creating or editing exam:
    - Toggle: "เปิดระบบสอบออนไลน์ (Online Quiz)"
    - Input: "เกณฑ์คะแนนผ่าน (Passing Score)"
    - Toggle: "อนุญาตให้นักเรียนสอบซ่อมได้เรื่อยๆ จนกว่าจะผ่าน (Allow Remedial Retake)"
    - Input: "จำนวนครั้งที่เตือนการสลับหน้าจอสูงสุด (Max Screen Switch Warnings)" (Default 3)
    - Question Editor: Add multiple choice questions (A, B, C, D) with correct answer radio.
    - Status toggle: "เปิดการสอบ (Open)" / "ปิดการสอบ (Closed)".
- **Student Quiz Player Modal** (`StudentExamPlayerModal.tsx`):
  - Fullscreen focus modal.
  - Anti-cheat listeners:
    - `document.addEventListener('visibilitychange')`
    - `window.addEventListener('blur')`
    - `window.addEventListener('contextmenu', e => e.preventDefault())`
    - `window.addEventListener('copy', e => e.preventDefault())`
  - Warning Dialog: Prompts student on tab blur with red countdown. If count > max, auto-submits.
  - Auto-grading: Computes score, records attempt, and calls `scoreService.upsertScore` to update student's score in the inline grid and SGS matrix.
  - Remedial Retake: If not passed and retake allowed, renders `[🔄 สอบซ่อม (ทำใหม่อีกครั้ง)]`.

---

## 4. Quality & Compliance Checklist
- **UI/UX Design System**: Pastel Anime Education Dashboard (`.agent/rules/style.md` / `GEMINI.md`), Prompt font, MingCute icons, soft blue `#3B82F6`, rounded cards `18px`.
- **Zero Impact on Main System**: No changes to staff Supabase Auth or leave system tables.
- **Automated Verification**: Comprehensive regression tests in `test_backend_ux_integration.mjs` verifying:
  1. Clean slate initialization.
  2. Student authentication & password change / 1-click reset.
  3. Homeroom advisor settings & chat group synchronization.
  4. Online quiz creation, anti-cheat detection, auto-grading, and remedial retakes.
