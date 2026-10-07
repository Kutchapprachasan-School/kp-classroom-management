-- ==============================================================================
-- Migration: 20261007_backend_ux_schema.sql
-- Target Project: โรงเรียนกุดจับประชาสรรค์ (Kutchapprachasan School Management SaaS)
-- Architecture: docs/superpowers/specs/2026-10-07-backend-ux-architecture-design.md
-- Authoritative Survey: .agents/teamwork/spec_miner_survey_1/survey_spec.md
-- ==============================================================================

-- Enable UUID & Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('TEACHER', 'HOMEROOM_ADVISOR', 'STUDENT_COUNCIL', 'DIRECTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'ACTIVITY', 'TRUANCY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE record_source_type AS ENUM ('MANUAL', 'SYSTEM_CORRELATION', 'APPROVED_ACTIVITY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE bell_lunch_mode_type AS ENUM ('NUMBERED_PERIOD', 'SKIPPED_BREAK_SLOT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE exam_category_type AS ENUM ('QUIZ', 'MIDTERM', 'FINAL', 'PRACTICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE exam_status_type AS ENUM ('UPCOMING', 'GRADING', 'LOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE chat_group_type AS ENUM ('HOMEROOM', 'COURSE', 'OFFICIAL', 'DEPARTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE chat_member_role_type AS ENUM ('TEACHER', 'STUDENT', 'ADVISOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE chat_sender_role_type AS ENUM ('TEACHER', 'STUDENT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- PHASE 1: CORE ACADEMIC IDENTITY, BELL SCHEDULE & ATTENDANCE
-- ==============================================================================

-- 1. School Profiles
CREATE TABLE IF NOT EXISTS school_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name_th TEXT NOT NULL DEFAULT 'โรงเรียนกุดจับประชาสรรค์',
    name_en TEXT NOT NULL DEFAULT 'Kutchapprachasan School',
    code TEXT NOT NULL UNIQUE DEFAULT 'KPS',
    logo_url TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Academic Terms
CREATE TABLE IF NOT EXISTS academic_terms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    year INT NOT NULL DEFAULT 2569,
    term_name TEXT NOT NULL DEFAULT 'ภาคเรียนที่ 1',
    semester_no INT NOT NULL CHECK (semester_no IN (1, 2)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    elapsed_teaching_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_academic_term_year_sem UNIQUE (school_id, year, semester_no)
);

-- 3. Bell Schedules
CREATE TABLE IF NOT EXISTS bell_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    morning_assembly_start TEXT NOT NULL DEFAULT '07:45',
    morning_assembly_end TEXT NOT NULL DEFAULT '08:15',
    first_period_start TEXT NOT NULL DEFAULT '08:30',
    period_duration_minutes INT NOT NULL DEFAULT 50,
    total_periods_per_day INT NOT NULL DEFAULT 7,
    lunch_break_mode bell_lunch_mode_type NOT NULL DEFAULT 'NUMBERED_PERIOD',
    lunch_break_slot INT NOT NULL DEFAULT 4,
    lunch_duration_minutes INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role_type NOT NULL DEFAULT 'TEACHER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Teacher Profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    teacher_code TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_teacher_code UNIQUE (school_id, teacher_code)
);

-- 6. Classrooms
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    term_id TEXT REFERENCES academic_terms(id) ON DELETE SET NULL,
    name TEXT NOT NULL, -- e.g. 'ม.3/1'
    grade_level TEXT NOT NULL, -- e.g. 'ม.3'
    adviser_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Students
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
    classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
    seat_no INT,
    status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'AT_RISK', 'TRANSFERRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_school_student_code UNIQUE (school_id, student_code)
);

-- 8. Morning Assembly Attendance Records
CREATE TABLE IF NOT EXISTS morning_assembly_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    date DATE NOT NULL,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    status attendance_status_type NOT NULL DEFAULT 'PRESENT',
    source record_source_type NOT NULL DEFAULT 'MANUAL',
    is_overridden BOOLEAN NOT NULL DEFAULT false,
    override_by TEXT,
    override_at TIMESTAMPTZ,
    override_reason TEXT,
    correlation_note TEXT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_morning_assembly_entry UNIQUE (date, classroom_id, student_code)
);

-- 9. Period Attendance Records
CREATE TABLE IF NOT EXISTS period_attendance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    date DATE NOT NULL,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    period_no INT NOT NULL CHECK (period_no BETWEEN 1 AND 9),
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    status attendance_status_type NOT NULL DEFAULT 'PRESENT',
    source record_source_type NOT NULL DEFAULT 'MANUAL',
    is_overridden BOOLEAN NOT NULL DEFAULT false,
    override_by TEXT,
    override_at TIMESTAMPTZ,
    override_reason TEXT,
    correlation_note TEXT,
    is_truancy_candidate BOOLEAN NOT NULL DEFAULT false,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_period_attendance_entry UNIQUE (date, classroom_id, course_code, period_no, student_code)
);

-- ==============================================================================
-- PHASE 2: ASSESSMENT, GRADING & SGS MATRIX SYSTEMS
-- ==============================================================================

-- 10. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    sgs_unit_id TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. 'ก่อนกลางภาค', 'หลังกลางภาค'
    max_score NUMERIC(5, 2) NOT NULL CHECK (max_score > 0),
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'LOCKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. Scores / Submissions
CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) CHECK (score >= 0),
    max_score NUMERIC(5, 2) NOT NULL,
    is_exempt BOOLEAN NOT NULL DEFAULT false,
    state TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (state IN ('DRAFT', 'SUBMITTED', 'GRADED', 'LOCKED')),
    teacher_feedback TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_score_assignment_student UNIQUE (assignment_id, student_id),
    CONSTRAINT chk_score_within_bounds CHECK (score IS NULL OR score <= max_score)
);

-- 12. Score Audit Logs
CREATE TABLE IF NOT EXISTS score_audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    score_id TEXT NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    old_value NUMERIC(5, 2),
    new_value NUMERIC(5, 2),
    reason TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. Exams
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    room_name TEXT NOT NULL,
    category exam_category_type NOT NULL DEFAULT 'QUIZ',
    max_score NUMERIC(5, 2) NOT NULL CHECK (max_score > 0),
    date DATE,
    status exam_status_type NOT NULL DEFAULT 'UPCOMING',
    average_score NUMERIC(5, 2),
    highest_score NUMERIC(5, 2),
    lowest_score NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. Exam Scores
CREATE TABLE IF NOT EXISTS exam_scores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    score NUMERIC(5, 2) CHECK (score >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('GRADED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_exam_student UNIQUE (exam_id, student_code)
);

-- 15. SGS Export Logs
CREATE TABLE IF NOT EXISTS sgs_export_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    term_id TEXT NOT NULL,
    classroom_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    student_count INT NOT NULL,
    exported_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('VERIFIED', 'LOCKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- PHASE 3: 6-UNIT LESSON PLANS, CURRICULUM & STORAGE LAYER
-- ==============================================================================

-- 16. Course Curriculums
CREATE TABLE IF NOT EXISTS course_curriculums (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    course_code TEXT NOT NULL UNIQUE,
    course_name TEXT NOT NULL,
    strand TEXT NOT NULL,
    weekly_hours NUMERIC(3, 1) NOT NULL DEFAULT 2.0,
    credit_units NUMERIC(3, 1) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 17. Unit Plans
CREATE TABLE IF NOT EXISTS unit_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    course_code TEXT NOT NULL,
    unit_number INT NOT NULL CHECK (unit_number BETWEEN 1 AND 6),
    title_ja TEXT,
    title_th TEXT NOT NULL,
    display_title TEXT NOT NULL,
    periods INT NOT NULL DEFAULT 4,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 20),
    date_range TEXT,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')),
    indicators_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_unit_plan_course_number UNIQUE (course_code, unit_number)
);

-- 18. Unit Objectives
CREATE TABLE IF NOT EXISTS unit_objectives (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    unit_plan_id TEXT NOT NULL REFERENCES unit_plans(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. 'ต 1.1 ม.3/1'
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 19. Unit Evaluations
CREATE TABLE IF NOT EXISTS unit_evaluations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    unit_plan_id TEXT NOT NULL REFERENCES unit_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    weight_percent INT NOT NULL CHECK (weight_percent > 0 AND weight_percent <= 100),
    criteria TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 20. Lesson Materials
CREATE TABLE IF NOT EXISTS lesson_materials (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    unit_plan_id TEXT NOT NULL REFERENCES unit_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PDF', 'PPTX', 'DOCX', 'MP4', 'LINK')),
    size_bytes BIGINT,
    storage_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 21. Post-Teaching Reflections
CREATE TABLE IF NOT EXISTS post_teaching_reflections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    unit_plan_id TEXT NOT NULL REFERENCES unit_plans(id) ON DELETE CASCADE,
    conducted_date DATE NOT NULL,
    summary TEXT NOT NULL,
    problem TEXT,
    solution TEXT,
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- PHASE 4: AUTOMATED MESSAGING & CLASSROOM TRANSFER ENGINE
-- ==============================================================================

-- 22. Chat Groups
CREATE TABLE IF NOT EXISTS chat_groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    type chat_group_type NOT NULL DEFAULT 'HOMEROOM',
    type_label TEXT NOT NULL DEFAULT 'กลุ่มแชท',
    description TEXT,
    classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
    classroom_name TEXT,
    course_code TEXT,
    course_name TEXT,
    teacher_name TEXT NOT NULL,
    auto_managed BOOLEAN NOT NULL DEFAULT true,
    unread_count INT NOT NULL DEFAULT 0,
    last_message_text TEXT,
    last_message_time TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 23. Chat Members
CREATE TABLE IF NOT EXISTS chat_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    group_id TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    member_code TEXT NOT NULL,
    name TEXT NOT NULL,
    role chat_member_role_type NOT NULL DEFAULT 'STUDENT',
    seat_no INT,
    joined_at TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_chat_member UNIQUE (group_id, member_code)
);

-- 24. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    group_id TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role chat_sender_role_type NOT NULL DEFAULT 'STUDENT',
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    is_system_audit BOOLEAN NOT NULL DEFAULT false,
    transfer_audit_meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- DATABASE CONSTRAINTS & TRIGGERS (INTEGRITY ENFORCEMENT)
-- ==============================================================================

-- Trigger: Prevent updates on locked scores
CREATE OR REPLACE FUNCTION trg_fn_prevent_locked_score_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.state = 'LOCKED' THEN
        RAISE EXCEPTION 'Cannot modify score record % because it is locked by SGS official submission.', OLD.id;
    END IF;
    NEW.version = OLD.version + 1;
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_score_mutation ON scores;
CREATE TRIGGER trg_prevent_locked_score_mutation
BEFORE UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION trg_fn_prevent_locked_score_mutation();

-- Trigger: Enforce 0.5 step rounding on scores
CREATE OR REPLACE FUNCTION trg_fn_round_score_half_step()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.score IS NOT NULL THEN
        NEW.score = ROUND(NEW.score * 2.0) / 2.0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_round_score_half_step ON scores;
CREATE TRIGGER trg_round_score_half_step
BEFORE INSERT OR UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION trg_fn_round_score_half_step();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION trg_fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_classrooms ON classrooms;
CREATE TRIGGER trg_set_updated_at_classrooms
BEFORE UPDATE ON classrooms
FOR EACH ROW
EXECUTE FUNCTION trg_fn_set_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bell_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_assembly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgs_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_teaching_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Default permissive read policies for authenticated users
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'school_profiles', 'academic_terms', 'bell_schedules', 'users', 'teacher_profiles',
            'classrooms', 'students', 'morning_assembly_records', 'period_attendance_records',
            'assignments', 'scores', 'score_audit_logs', 'exams', 'exam_scores', 'sgs_export_logs',
            'course_curriculums', 'unit_plans', 'unit_objectives', 'unit_evaluations',
            'lesson_materials', 'post_teaching_reflections', 'chat_groups', 'chat_members', 'chat_messages'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS p_%s_select ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY p_%s_select ON %I FOR SELECT USING (true)', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS p_%s_modify ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY p_%s_modify ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_morning_assembly_date_room ON morning_assembly_records(date, classroom_id);
CREATE INDEX IF NOT EXISTS idx_period_attendance_date_room ON period_attendance_records(date, classroom_id, course_code, period_no);
CREATE INDEX IF NOT EXISTS idx_scores_assignment_student ON scores(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group ON chat_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_group ON chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_unit_plans_course ON unit_plans(course_code, unit_number);
