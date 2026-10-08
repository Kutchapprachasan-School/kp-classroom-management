-- ==============================================================================
-- Migration: 20261008_comprehensive_school_settings_schema.sql
-- Target Project: ระบบจัดการชั้นเรียน โรงเรียนกุดจับประชาสรรค์ (Kutchapprachasan School Management SaaS)
-- Purpose: ผังตาราง Supabase ครอบคลุมการตั้งค่าระบบโรงเรียนทั้งหมด เชื่อมโยงทุกมิติ ยืดหยุ่น ไร้ Pop-up
-- ==============================================================================

-- Enable UUID & Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUM TYPES FOR SETTINGS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE school_type_enum AS ENUM ('HIGH_SCHOOL', 'EXPANSION', 'PRIMARY', 'VOCATIONAL', 'SPECIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE grade_scale_type_enum AS ENUM ('OBEC_8_LEVELS', 'PERCENTAGE', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE holiday_type_enum AS ENUM ('SCHOOL_SPECIFIC', 'LOCAL_TRADITION', 'EMERGENCY', 'SPECIAL_GOV');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE backup_frequency_enum AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 2. TABLE DEFINITIONS: SETTINGS ARCHITECTURE (12 DOMAINS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE 1: school_profiles (ข้อมูลพื้นฐาน อัตลักษณ์ คำขวัญ และข้อมูลผู้บริหาร)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name_th TEXT NOT NULL DEFAULT 'โรงเรียนกุดจับประชาสรรค์',
    name_en TEXT NOT NULL DEFAULT 'Kutchapprachasan School',
    code TEXT NOT NULL UNIQUE DEFAULT 'KPS',
    school_code_10_digit TEXT DEFAULT '1041680123',
    affiliation TEXT DEFAULT 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี (สพฐ.)',
    school_type school_type_enum NOT NULL DEFAULT 'HIGH_SCHOOL',
    logo_url TEXT,
    motto TEXT DEFAULT 'การศึกษา คือ รากฐาน ของอนาคตที่มั่นคง',
    identity TEXT DEFAULT 'มารยาทดี มีคุณธรรม นำวิชาการ',
    uniqueness TEXT DEFAULT 'โรงเรียนสิ่งแวดล้อมดี มีทักษะชีวิต',
    philosophy TEXT DEFAULT 'ประพฤติดี มีวิชา กีฬาเด่น เน้นคุณธรรม',
    vision TEXT DEFAULT 'มุ่งมั่นพัฒนาผู้เรียนสู่มาตรฐานสากล บนพื้นฐานความเป็นไทยและหลักปรัชญาของเศรษฐกิจพอเพียง',
    mission TEXT DEFAULT '1. จัดการศึกษาขั้นพื้นฐานอย่างมีคุณภาพและเสมอภาค\n2. ส่งเสริมการใช้เทคโนโลยีดิจิทัลเพื่อการเรียนรู้\n3. พัฒนาทักษะและศักยภาพผู้เรียนในศตวรรษที่ 21',
    director_name TEXT DEFAULT 'นายสมชาย ใจดี',
    director_position TEXT DEFAULT 'ผู้อำนวยการโรงเรียนกุดจับประชาสรรค์',
    director_signature_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#10B981',
    school_colors_text TEXT DEFAULT 'น้ำเงิน - ขาว',
    address_line TEXT DEFAULT 'เลขที่ 199 หมู่ 1 ถนนกุดจับ-เชียงพิณ',
    subdistrict TEXT DEFAULT 'เมืองเพีย',
    district TEXT DEFAULT 'กุดจับ',
    province TEXT DEFAULT 'อุดรธานี',
    postal_code TEXT DEFAULT '41250',
    phone_number TEXT DEFAULT '042-261-023',
    email TEXT DEFAULT 'info@kutchap.ac.th',
    website_url TEXT DEFAULT 'https://kutchap.ac.th',
    font_family TEXT DEFAULT 'Prompt',
    base_font_size_px INT DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 2: bell_schedules (เวลาเข้าแถวเคารพธงชาติ, คาบเรียน, และโหมดพักเที่ยง)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bell_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    morning_assembly_start TEXT NOT NULL DEFAULT '07:45',
    morning_assembly_end TEXT NOT NULL DEFAULT '08:15',
    first_period_start TEXT NOT NULL DEFAULT '08:30',
    period_duration_minutes INT NOT NULL DEFAULT 50 CHECK (period_duration_minutes BETWEEN 30 AND 90),
    total_periods_per_day INT NOT NULL DEFAULT 7 CHECK (total_periods_per_day BETWEEN 5 AND 12),
    lunch_break_mode TEXT NOT NULL DEFAULT 'NUMBERED_PERIOD' CHECK (lunch_break_mode IN ('NUMBERED_PERIOD', 'SKIPPED_BREAK_SLOT')),
    lunch_break_slot INT NOT NULL DEFAULT 4,
    lunch_duration_minutes INT NOT NULL DEFAULT 50 CHECK (lunch_duration_minutes BETWEEN 30 AND 90),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 3: academic_terms (ปีการศึกษา, ภาคเรียน, วันเปิด-ปิดเทอม, สัปดาห์สอบ)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_terms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    year INT NOT NULL DEFAULT 2569,
    semester_no INT NOT NULL CHECK (semester_no IN (1, 2)),
    term_name TEXT NOT NULL DEFAULT 'ภาคเรียนที่ 1/2569',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    midterm_start_date DATE,
    midterm_end_date DATE,
    final_start_date DATE,
    final_end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    elapsed_teaching_days INT NOT NULL DEFAULT 0,
    total_teaching_weeks INT NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_academic_term_year_sem_2026 UNIQUE (school_id, year, semester_no)
);

-- ------------------------------------------------------------------------------
-- TABLE 4: school_special_holidays (วันหยุดพิเศษเฉพาะโรงเรียน เช่น วันสถาปนา)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_special_holidays (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    term_id TEXT REFERENCES academic_terms(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    holiday_type holiday_type_enum NOT NULL DEFAULT 'SCHOOL_SPECIFIC',
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 5: school_weekend_makeup_days (วันมาเรียนชดเชย เสาร์-อาทิตย์ พร้อมเลือกระดับชั้น)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_weekend_makeup_days (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    term_id TEXT REFERENCES academic_terms(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    target_grades TEXT[] NOT NULL DEFAULT '{"ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"}',
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    timetable_day_mapped TEXT DEFAULT 'MONDAY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 6: classrooms (โครงสร้างห้องเรียน ระดับชั้น และครูที่ปรึกษา)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    term_id TEXT REFERENCES academic_terms(id) ON DELETE SET NULL,
    name TEXT NOT NULL, -- e.g. 'ม.3/1'
    grade_level TEXT NOT NULL, -- e.g. 'ม.3'
    building TEXT,
    room_number TEXT,
    track_curriculum TEXT DEFAULT 'ทั่วไป',
    adviser_id TEXT,
    co_adviser_id TEXT,
    capacity INT NOT NULL DEFAULT 40,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 7: school_attendance_policies (เกณฑ์เวลาเรียน 80%, กฎตัดสิทธิ์สอบ มส, โดดเรียน)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_attendance_policies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE UNIQUE,
    min_attendance_percent NUMERIC(4, 1) NOT NULL DEFAULT 80.0 CHECK (min_attendance_percent BETWEEN 50 AND 100),
    late_grace_minutes INT NOT NULL DEFAULT 15 CHECK (late_grace_minutes >= 0),
    morning_assembly_mandatory BOOLEAN NOT NULL DEFAULT true,
    late_to_absent_ratio INT NOT NULL DEFAULT 3,
    truancy_detection_enabled BOOLEAN NOT NULL DEFAULT true,
    decoupled_late_promotion_enabled BOOLEAN NOT NULL DEFAULT true,
    consecutive_absent_alert_days INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 8: school_grading_policies (เกณฑ์การวัดผล สัดส่วนคะแนน SGS 70:15:15 และการสอบแก้ตัว)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_grading_policies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE UNIQUE,
    formative_ratio INT NOT NULL DEFAULT 70 CHECK (formative_ratio BETWEEN 0 AND 100),
    midterm_ratio INT NOT NULL DEFAULT 15 CHECK (midterm_ratio BETWEEN 0 AND 100),
    final_ratio INT NOT NULL DEFAULT 15 CHECK (final_ratio BETWEEN 0 AND 100),
    passing_score_min NUMERIC(5, 2) NOT NULL DEFAULT 50.0 CHECK (passing_score_min BETWEEN 0 AND 100),
    grade_scale_type grade_scale_type_enum NOT NULL DEFAULT 'OBEC_8_LEVELS',
    retest_max_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    allow_half_step_rounding BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_total_ratios CHECK (formative_ratio + midterm_ratio + final_ratio = 100)
);

-- ------------------------------------------------------------------------------
-- TABLE 9: school_leave_settings (โควตาวันลาครูและนักเรียน และสายการอนุมัติ)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_leave_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE UNIQUE,
    teacher_sick_leave_quota INT NOT NULL DEFAULT 60,
    teacher_personal_leave_quota INT NOT NULL DEFAULT 45,
    teacher_vacation_quota INT NOT NULL DEFAULT 10,
    student_leave_quota INT NOT NULL DEFAULT 15,
    require_doctor_cert_days INT NOT NULL DEFAULT 3,
    approval_levels INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 10: system_storage_configs (คลาวด์สตอเรจ R2, Google Drive, สำรองข้อมูล)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_storage_configs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE UNIQUE,
    provider TEXT NOT NULL DEFAULT 'R2_AND_SUPABASE',
    r2_bucket_name TEXT DEFAULT 'kps-classroom-storage',
    r2_public_url TEXT,
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_backup_frequency backup_frequency_enum NOT NULL DEFAULT 'DAILY',
    retention_days INT NOT NULL DEFAULT 90,
    clean_slate_mode BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 11: notification_settings (การแจ้งเตือน Line, SMS, และกระดิ่งเตือนระบบ)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE UNIQUE,
    line_notify_token TEXT,
    line_oa_channel_id TEXT,
    sms_sender_name TEXT DEFAULT 'KPS_SCHOOL',
    notify_parent_on_absent BOOLEAN NOT NULL DEFAULT true,
    notify_parent_on_late BOOLEAN NOT NULL DEFAULT true,
    notify_parent_on_truancy BOOLEAN NOT NULL DEFAULT true,
    notify_teacher_on_grading_due BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 12: school_banner_configs (แบนเนอร์ 3 ส่วน Hero, Sidebar Mascot, Bottom Quote)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_banner_configs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    banner_type TEXT NOT NULL CHECK (banner_type IN ('TEACHER_HERO', 'TEACHER_SIDEBAR', 'TEACHER_BOTTOM', 'STUDENT_HERO')),
    preset_id TEXT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    quote_th TEXT,
    sub_text TEXT,
    opacity_percent INT NOT NULL DEFAULT 100,
    zoom_percent INT NOT NULL DEFAULT 100,
    pos_x INT NOT NULL DEFAULT 0,
    pos_y INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_school_banner_type UNIQUE (school_id, banner_type)
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bell_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_special_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_weekend_makeup_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_grading_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_leave_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_storage_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_banner_configs ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'school_profiles', 'bell_schedules', 'academic_terms', 'school_special_holidays',
            'school_weekend_makeup_days', 'classrooms', 'school_attendance_policies',
            'school_grading_policies', 'school_leave_settings', 'system_storage_configs',
            'notification_settings', 'school_banner_configs'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS p_%s_select ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY p_%s_select ON %I FOR SELECT USING (true)', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS p_%s_modify ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY p_%s_modify ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_bell_schedules_school ON bell_schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_terms_active ON academic_terms(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON school_special_holidays(date);
CREATE INDEX IF NOT EXISTS idx_makeup_days_date ON school_weekend_makeup_days(date);
CREATE INDEX IF NOT EXISTS idx_classrooms_grade ON classrooms(school_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_banner_school_type ON school_banner_configs(school_id, banner_type);
