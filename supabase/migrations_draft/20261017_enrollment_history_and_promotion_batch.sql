-- ==============================================================================
-- Migration Draft: 20261017_enrollment_history_and_promotion_batch.sql
-- Status: DRAFT / PENDING SENIOR BACKEND REVIEW (DO NOT APPLY DIRECTLY TO PROD)
-- Target Project: โรงเรียนกุดจับประชาสรรค์ (Kutchapprachasan School Management SaaS)
-- Purpose:
--   1. Schema for student_enrollments (immutable historical lifecycle)
--   2. Schema for promotion_batches and promotion_batch_items
--   3. Backfill script from existing students.classroom_id
--   4. Atomic RPC execute_student_promotion_batch (Idempotent, Row-locked, Security Definer)
--   5. Atomic RPC rollback_student_promotion_batch (Conflict-aware, Audit-logged)
-- ==============================================================================

-- ==============================================================================
-- 1. ENUM & STATUS TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE enrollment_status_type AS ENUM (
        'ACTIVE', 
        'COMPLETED', 
        'REPEAT_GRADE', 
        'SUSPENDED', 
        'TRANSFERRED_OUT', 
        'GRADUATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_action_type AS ENUM (
        'PROMOTED', 
        'REPEAT_GRADE', 
        'SUSPENDED', 
        'TRANSFERRED_OUT', 
        'GRADUATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_batch_status_type AS ENUM (
        'COMMITTED', 
        'ROLLED_BACK', 
        'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 2. TABLE: student_enrollments (Authoritative Student Historical Lifecycle)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    term_id TEXT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
    academic_year INT NOT NULL,
    semester_no INT NOT NULL CHECK (semester_no IN (1, 2)),
    seat_no INT,
    status enrollment_status_type NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    gpa NUMERIC(3, 2) CHECK (gpa IS NULL OR (gpa >= 0.00 AND gpa <= 4.00)),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_student_term_enrollment UNIQUE (student_id, term_id)
);

-- Partial index: A student can have at most ONE ACTIVE enrollment across the school
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_single_active_enrollment 
ON student_enrollments(student_id) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_enrollments_classroom_term 
ON student_enrollments(classroom_id, term_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_school_year_sem 
ON student_enrollments(school_id, academic_year, semester_no);

-- ==============================================================================
-- 3. TABLE: promotion_batches (Batch Record & Idempotency Guard)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS promotion_batches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL REFERENCES school_profiles(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL UNIQUE,
    from_term_id TEXT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
    to_term_id TEXT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
    from_year INT NOT NULL,
    to_year INT NOT NULL,
    status promotion_batch_status_type NOT NULL DEFAULT 'COMMITTED',
    executed_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    rollback_at TIMESTAMPTZ,
    rollback_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
    rollback_reason TEXT,
    total_evaluated INT NOT NULL DEFAULT 0,
    promoted_count INT NOT NULL DEFAULT 0,
    graduated_count INT NOT NULL DEFAULT 0,
    exception_count INT NOT NULL DEFAULT 0,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_promotion_batches_school_year 
ON promotion_batches(school_id, from_year, to_year);

-- ==============================================================================
-- 4. TABLE: promotion_batch_items (Granular Audit & Rollback Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS promotion_batch_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    batch_id TEXT NOT NULL REFERENCES promotion_batches(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    previous_enrollment_id TEXT NOT NULL REFERENCES student_enrollments(id) ON DELETE RESTRICT,
    previous_classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    previous_status enrollment_status_type NOT NULL,
    action promotion_action_type NOT NULL,
    new_enrollment_id TEXT REFERENCES student_enrollments(id) ON DELETE SET NULL,
    new_classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
    new_status enrollment_status_type NOT NULL,
    graduation_approved BOOLEAN NOT NULL DEFAULT false,
    graduation_approved_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
    graduation_approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_batch_student_item UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_items_student 
ON promotion_batch_items(student_id);

-- ==============================================================================
-- 5. BACKFILL PLAN & SCRIPT (Draft: To be run before activating RPC)
-- ==============================================================================
-- Populates initial student_enrollments from existing students and active term
-- Only inserts if student is currently linked to an active classroom and has no enrollment.
DO $$
DECLARE
    v_default_term_id TEXT;
    v_default_year INT := 2569;
    v_default_sem INT := 1;
BEGIN
    SELECT id, year, semester_no 
    INTO v_default_term_id, v_default_year, v_default_sem
    FROM academic_terms 
    WHERE is_active = true 
    LIMIT 1;

    IF v_default_term_id IS NOT NULL THEN
        INSERT INTO student_enrollments (
            id,
            school_id,
            student_id,
            classroom_id,
            term_id,
            academic_year,
            semester_no,
            seat_no,
            status,
            start_date
        )
        SELECT 
            'enr_' || s.id || '_' || v_default_term_id,
            s.school_id,
            s.id,
            s.classroom_id,
            v_default_term_id,
            v_default_year,
            v_default_sem,
            s.seat_no,
            'ACTIVE'::enrollment_status_type,
            CURRENT_DATE
        FROM students s
        WHERE s.classroom_id IS NOT NULL
        ON CONFLICT (student_id, term_id) DO NOTHING;
    END IF;
END $$;

-- ==============================================================================
-- 6. RPC: execute_student_promotion_batch
-- ==============================================================================
CREATE OR REPLACE FUNCTION execute_student_promotion_batch(
    p_idempotency_key TEXT,
    p_from_term_id TEXT,
    p_to_term_id TEXT,
    p_items JSONB, -- Array of item objects
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id TEXT;
    v_caller_role user_role_type;
    v_caller_school_id TEXT;
    v_existing_batch_id TEXT;
    v_new_batch_id TEXT;
    v_from_year INT;
    v_from_sem INT;
    v_to_year INT;
    v_to_sem INT;
    v_item JSONB;
    v_student_id TEXT;
    v_student_code TEXT;
    v_student_name TEXT;
    v_action promotion_action_type;
    v_target_room_id TEXT;
    v_prev_enr_id TEXT;
    v_prev_room_id TEXT;
    v_new_enr_id TEXT;
    v_new_status enrollment_status_type;
    v_grad_approved BOOLEAN;
    v_grad_approver TEXT;
    v_total INT := 0;
    v_promoted INT := 0;
    v_graduated INT := 0;
    v_exceptions INT := 0;
BEGIN
    -- 1. Security & Identity Check (Zero Trust on Client Payload)
    v_caller_id := auth.uid()::TEXT;
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: User authentication session required';
    END IF;

    SELECT role INTO v_caller_role FROM users WHERE id = v_caller_id;
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('ADMIN', 'DIRECTOR') THEN
        RAISE EXCEPTION 'FORBIDDEN: Only ADMINISTRATOR or DIRECTOR can execute promotion batch';
    END IF;

    -- 2. Idempotency Guard (Check if already executed)
    SELECT id INTO v_existing_batch_id 
    FROM promotion_batches 
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_batch_id IS NOT NULL THEN
        -- Return already executed batch information cleanly
        RETURN jsonb_build_object(
            'success', true,
            'isIdempotentReplay', true,
            'batchId', v_existing_batch_id,
            'message', 'Batch already executed with this idempotency key'
        );
    END IF;

    -- 3. Validate Term Boundaries
    SELECT school_id, year, semester_no INTO v_caller_school_id, v_from_year, v_from_sem 
    FROM academic_terms WHERE id = p_from_term_id;
    
    SELECT year, semester_no INTO v_to_year, v_to_sem 
    FROM academic_terms WHERE id = p_to_term_id;

    IF v_caller_school_id IS NULL OR v_to_year IS NULL THEN
        RAISE EXCEPTION 'INVALID_TERM: Source or Target academic term not found';
    END IF;

    IF v_to_year < v_from_year THEN
        RAISE EXCEPTION 'INVALID_YEAR: Target year (%) cannot be earlier than source year (%)', v_to_year, v_from_year;
    END IF;

    -- 4. Create Batch Record
    v_new_batch_id := gen_random_uuid()::TEXT;
    INSERT INTO promotion_batches (
        id, school_id, idempotency_key, from_term_id, to_term_id,
        from_year, to_year, status, executed_by, executed_at, notes
    ) VALUES (
        v_new_batch_id, v_caller_school_id, p_idempotency_key, p_from_term_id, p_to_term_id,
        v_from_year, v_to_year, 'COMMITTED', v_caller_id, timezone('utc', now()), p_notes
    );

    -- 5. Iterate and Process Items atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_student_id := v_item->>'studentId';
        v_action := (v_item->>'action')::promotion_action_type;
        v_target_room_id := v_item->>'targetRoomId';
        v_grad_approved := COALESCE((v_item->>'graduationApproved')::BOOLEAN, false);
        v_grad_approver := v_item->>'graduationApprovedBy';

        -- Row Lock Student Record
        SELECT student_code, name INTO v_student_code, v_student_name
        FROM students 
        WHERE id = v_student_id AND school_id = v_caller_school_id
        FOR UPDATE;

        IF v_student_code IS NULL THEN
            RAISE EXCEPTION 'STUDENT_NOT_FOUND: Student % does not exist in school', v_student_id;
        END IF;

        -- Find and Lock Current Active Enrollment
        SELECT id, classroom_id INTO v_prev_enr_id, v_prev_room_id
        FROM student_enrollments
        WHERE student_id = v_student_id AND status = 'ACTIVE'
        FOR UPDATE;

        IF v_prev_enr_id IS NULL THEN
            RAISE EXCEPTION 'ACTIVE_ENROLLMENT_NOT_FOUND: Student % (%) has no active enrollment to promote', v_student_code, v_student_name;
        END IF;

        -- Step 5.1: Close Old Enrollment
        UPDATE student_enrollments
        SET status = 'COMPLETED',
            end_date = CURRENT_DATE,
            updated_at = timezone('utc', now())
        WHERE id = v_prev_enr_id;

        -- Step 5.2: Process by Action
        IF v_action = 'GRADUATED' THEN
            IF NOT v_grad_approved THEN
                RAISE EXCEPTION 'GRADUATION_NOT_APPROVED: Student % requires formal graduation approval before graduating', v_student_code;
            END IF;

            v_new_enr_id := NULL;
            v_new_status := 'GRADUATED';
            
            -- Student active classroom becomes NULL upon graduation
            UPDATE students 
            SET status = 'NORMAL',
                classroom_id = NULL,
                updated_at = timezone('utc', now())
            WHERE id = v_student_id;

            v_graduated := v_graduated + 1;

        ELSIF v_action = 'PROMOTED' OR v_action = 'REPEAT_GRADE' THEN
            IF v_target_room_id IS NULL THEN
                RAISE EXCEPTION 'TARGET_ROOM_REQUIRED: Student % has action % but no targetRoomId provided', v_student_code, v_action;
            END IF;

            v_new_status := 'ACTIVE';
            v_new_enr_id := gen_random_uuid()::TEXT;

            -- Create New Active Enrollment for Next Academic Term
            INSERT INTO student_enrollments (
                id, school_id, student_id, classroom_id, term_id,
                academic_year, semester_no, status, start_date
            ) VALUES (
                v_new_enr_id, v_caller_school_id, v_student_id, v_target_room_id, p_to_term_id,
                v_to_year, v_to_sem, 'ACTIVE', CURRENT_DATE
            );

            -- Synchronize students.classroom_id pointer
            UPDATE students 
            SET classroom_id = v_target_room_id,
                updated_at = timezone('utc', now())
            WHERE id = v_student_id;

            IF v_action = 'PROMOTED' THEN
                v_promoted := v_promoted + 1;
            ELSE
                v_exceptions := v_exceptions + 1;
            END IF;

        ELSIF v_action = 'SUSPENDED' THEN
            v_new_enr_id := NULL;
            v_new_status := 'SUSPENDED';

            UPDATE students 
            SET classroom_id = NULL,
                updated_at = timezone('utc', now())
            WHERE id = v_student_id;

            v_exceptions := v_exceptions + 1;

        ELSIF v_action = 'TRANSFERRED_OUT' THEN
            v_new_enr_id := NULL;
            v_new_status := 'TRANSFERRED_OUT';

            UPDATE students 
            SET status = 'TRANSFERRED',
                classroom_id = NULL,
                updated_at = timezone('utc', now())
            WHERE id = v_student_id;

            v_exceptions := v_exceptions + 1;
        END IF;

        -- Record Granular Batch Item Audit Trail
        INSERT INTO promotion_batch_items (
            batch_id, student_id, student_code, student_name,
            previous_enrollment_id, previous_classroom_id, previous_status,
            action, new_enrollment_id, new_classroom_id, new_status,
            graduation_approved, graduation_approved_by, graduation_approved_at, notes
        ) VALUES (
            v_new_batch_id, v_student_id, v_student_code, v_student_name,
            v_prev_enr_id, v_prev_room_id, 'ACTIVE',
            v_action, v_new_enr_id, v_target_room_id, v_new_status,
            v_grad_approved, 
            CASE WHEN v_grad_approved THEN COALESCE(v_grad_approver, v_caller_id) ELSE NULL END,
            CASE WHEN v_grad_approved THEN timezone('utc', now()) ELSE NULL END,
            v_item->>'notes'
        );

        v_total := v_total + 1;
    END LOOP;

    -- 6. Update Batch Summary
    UPDATE promotion_batches
    SET total_evaluated = v_total,
        promoted_count = v_promoted,
        graduated_count = v_graduated,
        exception_count = v_exceptions,
        summary = jsonb_build_object(
            'total', v_total,
            'promoted', v_promoted,
            'graduated', v_graduated,
            'exceptions', v_exceptions
        )
    WHERE id = v_new_batch_id;

    RETURN jsonb_build_object(
        'success', true,
        'batchId', v_new_batch_id,
        'promotedCount', v_promoted,
        'graduatedCount', v_graduated,
        'exceptionCount', v_exceptions,
        'totalEvaluated', v_total
    );
END;
$$;

-- ==============================================================================
-- 7. RPC: rollback_student_promotion_batch (Conflict-Aware Safe Rollback)
-- ==============================================================================
CREATE OR REPLACE FUNCTION rollback_student_promotion_batch(
    p_batch_id TEXT,
    p_rollback_reason TEXT DEFAULT 'Administrative rollback'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id TEXT;
    v_caller_role user_role_type;
    v_batch promotion_batches%ROWTYPE;
    v_item promotion_batch_items%ROWTYPE;
    v_conflict_count INT := 0;
    v_rolled_back_count INT := 0;
BEGIN
    -- 1. Security Check
    v_caller_id := auth.uid()::TEXT;
    SELECT role INTO v_caller_role FROM users WHERE id = v_caller_id;
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('ADMIN', 'DIRECTOR') THEN
        RAISE EXCEPTION 'FORBIDDEN: Only ADMINISTRATOR or DIRECTOR can rollback promotion batch';
    END IF;

    -- 2. Verify Batch Status
    SELECT * INTO v_batch FROM promotion_batches WHERE id = p_batch_id FOR UPDATE;
    IF v_batch.id IS NULL THEN
        RAISE EXCEPTION 'BATCH_NOT_FOUND: Promotion batch % does not exist', p_batch_id;
    END IF;

    IF v_batch.status = 'ROLLED_BACK' THEN
        RAISE EXCEPTION 'ALREADY_ROLLED_BACK: Promotion batch % was already rolled back at %', p_batch_id, v_batch.rollback_at;
    END IF;

    -- 3. Conflict Detection: Ensure NO scores or attendance were logged on new enrollments
    SELECT count(*) INTO v_conflict_count
    FROM scores s
    JOIN promotion_batch_items pbi ON pbi.batch_id = p_batch_id 
    WHERE s.enrollment_id = pbi.new_enrollment_id;

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'CONFLICT_DETECTED: % score records have been recorded on destination enrollments. Rollback aborted to prevent grade corruption.', v_conflict_count;
    END IF;

    -- 4. Rollback each item: Delete new enrollment, reactivate previous enrollment
    FOR v_item IN SELECT * FROM promotion_batch_items WHERE batch_id = p_batch_id
    LOOP
        -- Delete new enrollment if created
        IF v_item.new_enrollment_id IS NOT NULL THEN
            DELETE FROM student_enrollments WHERE id = v_item.new_enrollment_id;
        END IF;

        -- Reactivate previous enrollment
        UPDATE student_enrollments
        SET status = 'ACTIVE',
            end_date = NULL,
            updated_at = timezone('utc', now())
        WHERE id = v_item.previous_enrollment_id;

        -- Restore students.classroom_id
        UPDATE students
        SET classroom_id = v_item.previous_classroom_id,
            status = 'NORMAL',
            updated_at = timezone('utc', now())
        WHERE id = v_item.student_id;

        v_rolled_back_count := v_rolled_back_count + 1;
    END LOOP;

    -- 5. Mark Batch as ROLLED_BACK
    UPDATE promotion_batches
    SET status = 'ROLLED_BACK',
        rollback_at = timezone('utc', now()),
        rollback_by = v_caller_id,
        rollback_reason = p_rollback_reason
    WHERE id = p_batch_id;

    RETURN jsonb_build_object(
        'success', true,
        'batchId', p_batch_id,
        'rolledBackCount', v_rolled_back_count
    );
END;
$$;
