# Backend UX & UI Integration System Design Specification

> Date: 2026-10-07  
> Author: Pair Programming AI Assistant & User  
> Target System: Thai Secondary School Management SaaS (Pastel Anime Education Dashboard)  
> Repository Working Directory: `c:\dev\09 ระบบจัดการชั้นเรียน`

---

## 1. Executive Summary & Goals

### 1.1 Objective
Connect all established frontend user interfaces across the school platform—including Teacher Overview, Timetable & 4-Lock Attendance, SGS Grading & Matrix Reviews, Exam Management, 6-Unit Lesson Plans & Media, Messaging Groups, and School System Settings—to a systematic, resilient, and reactive Backend Data Architecture.

### 1.2 Core Architectural Principles
1. **Dual-Mode Adapter Pattern (Cloud ↔ Offline)**:
   - **Cloud Mode**: Supabase (PostgreSQL 15+, Supabase Realtime, Row Level Security, Auth, Storage).
   - **Offline / Standalone Fallback**: LocalStorage + In-Memory Caching with identical TypeScript service signatures, guaranteeing the application operates seamlessly with zero configuration or during network downtime.
2. **Backend UX & Reactive State**:
   - UI views never block on raw network queries.
   - Optimistic updates with automatic rollback on error.
   - Uniform event bus (`kps-data-sync-event`) ensuring changes made in one view (e.g. attendance check in period 1) instantly reflect across the Timetable, Today's Task Card, and Executive Dashboard.
3. **Strict Data Integrity Locks**:
   - Maintain the 4 Integrity Locks (Provenance Shield, Truancy Candidate Promotion, Decoupled Morning Late Promotion, Unified 80% Rule on Elapsed Days) at the data layer.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND UI LAYER (React 19 + Tailwind)                           │
│  [Teacher Dashboard] [Timetable & 4-Locks] [SGS Grading] [Lesson Plans] [Chat] [Settings]       │
└─────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                  │ Typed Hooks & Service Calls
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             UNIVERSAL SERVICE ADAPTER LAYER (TypeScript)                         │
│  - Academic & Roles Adapter        - Attendance & 4-Locks Engine Adapter                         │
│  - Grading & SGS Matrix Adapter    - Lesson Plans & Storage Adapter                              │
│  - Messaging & Transfer Adapter    - School Bell & Calendar Adapter                              │
└───────────────────────┬──────────────────────────────────────────────────┬───────────────────────┘
                        │ isSupabaseConfigured === true                    │ Offline / Dev Fallback
                        ▼                                                  ▼
┌──────────────────────────────────────────────────┐  ┌────────────────────────────────────────────┐
│              SUPABASE CLOUD BACKEND              │  │        LOCAL STORAGE & CACHE ENGINE        │
│  - PostgreSQL 15+ (Migrations & RLS)             │  │  - JSON Schema-Validated Storage Keys      │
│  - Realtime WebSockets Subscriptions             │  │  - In-Memory SSR / Node Fallback Cache     │
│  - Cloudflare R2 / Supabase Storage Buckets      │  │  - Instant Deterministic Seed Fixtures     │
└──────────────────────────────────────────────────┘  └────────────────────────────────────────────┘
```

---

## 3. Phased Implementation Plan

### Phase 1: Core Academic Identity, Bell Schedule & 4-Lock Attendance Engine
1. **Schema & Tables**:
   - `school_profiles` (Branding, address, logo, nameTh, nameEn)
   - `academic_terms` (Year, semester 1/2, holiday ranges, elapsed teaching days)
   - `bell_schedules` (Assembly time, period duration, lunch break mode: Numbered vs Skipped)
   - `users` & `teacher_profiles` (5 roles: Teacher, Homeroom Advisor, Student Council, Director, Admin)
   - `classrooms` & `students` (Roster, room assignment, student code, attendance statistics)
   - `morning_assembly_records` & `period_attendance_records` (Tracking provenance, overrides, and timestamps)
2. **Engine Implementation**:
   - Bind `attendanceCorrelationService.ts` to universal persistence.
   - Calculate attendance % strictly on elapsed conducted days (no fixed 20-week divisor distortion).

### Phase 2: Assessment, Grading & SGS Matrix Systems
1. **Schema & Tables**:
   - `assignments` (Unit, title, max score, due date, category)
   - `submissions` (Student ID, score, feedback stickers, status: on-time, late, missing)
   - `exams` (Exam type: formative, midterm, final, lock status, max score)
   - `exam_scores` (Inline score grid entries, item analysis discrimination/difficulty)
2. **Engine Implementation**:
   - Fast 1-tap grading workspace sync.
   - 0.5 auto-rounding rules and 3-color matrix indicators (Green/Amber/Rose).
   - SGS official score export serialization.

### Phase 3: 6-Unit Lesson Plans, Curriculum & Storage Layer
1. **Schema & Tables**:
   - `course_curriculums` (Course code, name, strand, weekly hours)
   - `unit_plans` (Unit number 1-6, Japanese/Thai title, periods, week schedule, status)
   - `unit_objectives` & `unit_evaluations` (Indicators, evaluation weight %, criteria)
   - `lesson_materials` (File metadata, mime type, size, storage path)
   - `post_teaching_reflections` (Conducted date, summary, obstacles, solutions, signature)
2. **Engine Implementation**:
   - Cloudflare R2 / Supabase Storage signed upload URLs.
   - Client-side Canvas Image Resizer & Compressor guard (< 150KB for banners).

### Phase 4: Automated Messaging & Student Classroom Transfer Engine
1. **Schema & Tables**:
   - `chat_groups` (Homeroom advisory groups, course subject groups, school announcements)
   - `chat_members` (Student and teacher enrollments)
   - `chat_messages` (Sender, body, attachments, timestamp)
2. **Engine Implementation**:
   - Automatic room transfer re-indexing: When a student moves (e.g. ม.1/1 ➔ ม.1/2), update group memberships automatically with system notices while keeping all grades and attendance records completely intact.

---

## 4. Verification & Testing Strategy

A programmatic verification suite (`test_backend_ux_integration.mjs`) will test:
1. Schema integrity & TypeScript contract compilation (`npm run build`).
2. Dual-mode failover: Verify operations succeed seamlessly in both online Supabase and offline LocalStorage modes.
3. 4-Lock Attendance enforcement under automated correlation runs.
4. Grading calculation and auto-rounding accuracy.
5. Student transfer automated group synchronization and grade retention.
