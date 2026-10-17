-- Migration: 20261018_student_enrollments_and_promotion_rpcs.sql
-- Description: Student Enrollment Ledger, Promotion Batches, and Transactional RPCs

-- 1. Extend EnrollmentStatus enum if values do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'EnrollmentStatus' AND e.enumlabel = 'GRADUATED') THEN
    ALTER TYPE "EnrollmentStatus" ADD VALUE 'GRADUATED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'EnrollmentStatus' AND e.enumlabel = 'REPEAT_GRADE') THEN
    ALTER TYPE "EnrollmentStatus" ADD VALUE 'REPEAT_GRADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'EnrollmentStatus' AND e.enumlabel = 'SUSPENDED') THEN
    ALTER TYPE "EnrollmentStatus" ADD VALUE 'SUSPENDED';
  END IF;
END $$;

-- 2. Partial unique index on StudentEnrollment: exactly ONE active ('ENROLLED') enrollment per student
CREATE UNIQUE INDEX IF NOT EXISTS "idx_student_single_active_enrollment"
ON "StudentEnrollment"("studentId")
WHERE "status" = 'ENROLLED';

-- 3. Promotion Batches Table
CREATE TABLE IF NOT EXISTS "PromotionBatch" (
  "id" TEXT PRIMARY KEY,
  "idempotencyKey" TEXT UNIQUE NOT NULL,
  "fromYear" INTEGER NOT NULL,
  "fromTerm" INTEGER NOT NULL,
  "toYear" INTEGER NOT NULL,
  "toTerm" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMMITTED', -- 'COMMITTED' | 'ROLLED_BACK'
  "executedBy" TEXT NOT NULL,
  "executedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rollbackAt" TIMESTAMP WITH TIME ZONE,
  "rollbackBy" TEXT,
  "rollbackReason" TEXT,
  "summary" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_promotion_batch_status" ON "PromotionBatch"("status");

-- 4. Promotion Batch Items Table
CREATE TABLE IF NOT EXISTS "PromotionBatchItem" (
  "id" TEXT PRIMARY KEY,
  "batchId" TEXT NOT NULL REFERENCES "PromotionBatch"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL,
  "studentCode" TEXT,
  "previousEnrollmentId" TEXT,
  "previousClassroomId" TEXT,
  "action" TEXT NOT NULL, -- 'PROMOTED', 'REPEAT_GRADE', 'SUSPENDED', 'TRANSFERRED_OUT', 'GRADUATED'
  "newEnrollmentId" TEXT,
  "newClassroomId" TEXT,
  "graduationApproved" BOOLEAN DEFAULT FALSE,
  "graduationApprovedBy" TEXT,
  "graduationApprovedAt" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_promo_item_batch" ON "PromotionBatchItem"("batchId");
CREATE INDEX IF NOT EXISTS "idx_promo_item_student" ON "PromotionBatchItem"("studentId");

-- 5. Transactional Promotion RPC: execute_student_promotion_batch
CREATE OR REPLACE FUNCTION execute_student_promotion_batch(
  p_idempotency_key TEXT,
  p_from_year INT,
  p_from_term INT,
  p_to_year INT,
  p_to_term INT,
  p_items JSONB,
  p_executed_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_batch RECORD;
  v_batch_id TEXT;
  v_item JSONB;
  v_student_id TEXT;
  v_student_code TEXT;
  v_action TEXT;
  v_target_room_id TEXT;
  v_grad_approved BOOLEAN;
  v_prev_enr_id TEXT;
  v_prev_room_id TEXT;
  v_new_enr_id TEXT;
  v_grade_level INT;
  v_room_number INT;
  v_roll_number INT;
  v_item_id TEXT;
  v_promoted_count INT := 0;
  v_graduated_count INT := 0;
  v_repeat_count INT := 0;
  v_suspended_count INT := 0;
  v_transferred_count INT := 0;
  v_summary JSONB;
BEGIN
  -- 1. Idempotency Check
  SELECT * INTO v_existing_batch 
  FROM "PromotionBatch" 
  WHERE "idempotencyKey" = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'batchId', v_existing_batch."id",
      'isIdempotentReplay', true,
      'status', v_existing_batch."status",
      'summary', v_existing_batch."summary"
    );
  END IF;

  -- 2. Create New Promotion Batch
  v_batch_id := 'prm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  -- 3. Process Items Loop
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_student_id := v_item->>'studentId';
    v_student_code := v_item->>'studentCode';
    v_action := v_item->>'action';
    v_target_room_id := v_item->>'targetRoomId';
    v_grad_approved := COALESCE((v_item->>'graduationApproved')::BOOLEAN, false);

    -- Find current active enrollment
    SELECT "id", "classRoomId", "rollNumber"
    INTO v_prev_enr_id, v_prev_room_id, v_roll_number
    FROM "StudentEnrollment"
    WHERE "studentId" = v_student_id AND "status" = 'ENROLLED'
    LIMIT 1;

    -- Close previous enrollment
    IF v_prev_enr_id IS NOT NULL THEN
      UPDATE "StudentEnrollment"
      SET "status" = CASE 
        WHEN v_action = 'TRANSFERRED_OUT' THEN 'TRANSFERRED_OUT'::"EnrollmentStatus"
        WHEN v_action = 'GRADUATED' THEN 'COMPLETED'::"EnrollmentStatus"
        ELSE 'COMPLETED'::"EnrollmentStatus"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = v_prev_enr_id;
    END IF;

    -- Handle New Enrollment
    v_new_enr_id := NULL;
    IF v_action IN ('PROMOTED', 'REPEAT_GRADE') AND v_target_room_id IS NOT NULL THEN
      -- Get classroom details
      SELECT "gradeLevel", "roomNumber"
      INTO v_grade_level, v_room_number
      FROM "ClassRoom"
      WHERE "id" = v_target_room_id;

      v_new_enr_id := 'enr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

      INSERT INTO "StudentEnrollment" (
        "id", "studentId", "academicYear", "term", "classRoomId",
        "gradeLevel", "roomNumber", "rollNumber", "status", "createdAt", "updatedAt"
      ) VALUES (
        v_new_enr_id, v_student_id, p_to_year, p_to_term, v_target_room_id,
        COALESCE(v_grade_level, 1), COALESCE(v_room_number, 1), COALESCE(v_roll_number, 1),
        'ENROLLED'::"EnrollmentStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );

      -- Update student classroom pointer if students/Student table exists
      UPDATE "Student" SET "classroomId" = v_target_room_id, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = v_student_id;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        UPDATE students SET classroom_id = v_target_room_id WHERE id = v_student_id;
      END IF;

      IF v_action = 'PROMOTED' THEN
        v_promoted_count := v_promoted_count + 1;
      ELSE
        v_repeat_count := v_repeat_count + 1;
      END IF;

    ELSIF v_action = 'GRADUATED' THEN
      UPDATE "Student" SET "classroomId" = NULL, "status" = 'GRADUATED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = v_student_id;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        UPDATE students SET classroom_id = NULL, status = 'GRADUATED' WHERE id = v_student_id;
      END IF;
      v_graduated_count := v_graduated_count + 1;

    ELSIF v_action = 'SUSPENDED' THEN
      UPDATE "Student" SET "status" = 'SUSPENDED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = v_student_id;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        UPDATE students SET status = 'SUSPENDED' WHERE id = v_student_id;
      END IF;
      v_suspended_count := v_suspended_count + 1;

    ELSIF v_action = 'TRANSFERRED_OUT' THEN
      UPDATE "Student" SET "classroomId" = NULL, "status" = 'TRANSFERRED_OUT', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = v_student_id;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        UPDATE students SET classroom_id = NULL, status = 'TRANSFERRED_OUT' WHERE id = v_student_id;
      END IF;
      v_transferred_count := v_transferred_count + 1;
    END IF;

    -- Record item in PromotionBatchItem
    v_item_id := 'pmi_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    INSERT INTO "PromotionBatchItem" (
      "id", "batchId", "studentId", "studentCode",
      "previousEnrollmentId", "previousClassroomId", "action",
      "newEnrollmentId", "newClassroomId",
      "graduationApproved", "graduationApprovedBy", "graduationApprovedAt",
      "notes", "createdAt"
    ) VALUES (
      v_item_id, v_batch_id, v_student_id, v_student_code,
      v_prev_enr_id, v_prev_room_id, v_action,
      v_new_enr_id, v_target_room_id,
      v_grad_approved, 
      CASE WHEN v_grad_approved THEN p_executed_by ELSE NULL END,
      CASE WHEN v_grad_approved THEN CURRENT_TIMESTAMP ELSE NULL END,
      v_item->>'notes', CURRENT_TIMESTAMP
    );
  END LOOP;

  -- 4. Build summary and save PromotionBatch
  v_summary := jsonb_build_object(
    'totalProcessed', jsonb_array_length(p_items),
    'promotedCount', v_promoted_count,
    'graduatedCount', v_graduated_count,
    'repeatCount', v_repeat_count,
    'suspendedCount', v_suspended_count,
    'transferredCount', v_transferred_count
  );

  INSERT INTO "PromotionBatch" (
    "id", "idempotencyKey", "fromYear", "fromTerm", "toYear", "toTerm",
    "status", "executedBy", "executedAt", "summary", "createdAt", "updatedAt"
  ) VALUES (
    v_batch_id, p_idempotency_key, p_from_year, p_from_term, p_to_year, p_to_term,
    'COMMITTED', p_executed_by, CURRENT_TIMESTAMP, v_summary, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  RETURN jsonb_build_object(
    'success', true,
    'batchId', v_batch_id,
    'isIdempotentReplay', false,
    'summary', v_summary
  );
END;
$$;

-- 6. Transactional Rollback RPC: rollback_student_promotion_batch
CREATE OR REPLACE FUNCTION rollback_student_promotion_batch(
  p_batch_id TEXT,
  p_rollback_by TEXT,
  p_rollback_reason TEXT DEFAULT 'Administrative rollback'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch RECORD;
  v_item RECORD;
  v_conflict_count INT := 0;
BEGIN
  -- 1. Batch existence check
  SELECT * INTO v_batch
  FROM "PromotionBatch"
  WHERE "id" = p_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BATCH_NOT_FOUND: Promotion batch % does not exist', p_batch_id;
  END IF;

  IF v_batch."status" = 'ROLLED_BACK' THEN
    RETURN jsonb_build_object(
      'success', true,
      'batchId', p_batch_id,
      'alreadyRolledBack', true,
      'message', 'Batch was already rolled back previously'
    );
  END IF;

  -- 2. Pre-flight Conflict Check: check if any student has subsequent attendance recorded in new room
  SELECT COUNT(*) INTO v_conflict_count
  FROM "PromotionBatchItem" pmi
  WHERE pmi."batchId" = p_batch_id
    AND pmi."newEnrollmentId" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "StudentPeriodAttendance" spa 
      WHERE spa."studentId" = pmi."studentId" 
        AND spa."createdAt" > v_batch."executedAt"
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CONFLICT_DETECTED: % students have subsequent attendance records after promotion', v_conflict_count;
  END IF;

  -- 3. Perform Reversion
  FOR v_item IN SELECT * FROM "PromotionBatchItem" WHERE "batchId" = p_batch_id
  LOOP
    -- If a new enrollment was created, delete it
    IF v_item."newEnrollmentId" IS NOT NULL THEN
      DELETE FROM "StudentEnrollment" WHERE "id" = v_item."newEnrollmentId";
    END IF;

    -- If a previous enrollment existed, restore it to ENROLLED
    IF v_item."previousEnrollmentId" IS NOT NULL THEN
      UPDATE "StudentEnrollment"
      SET "status" = 'ENROLLED'::"EnrollmentStatus",
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = v_item."previousEnrollmentId";
    END IF;

    -- Restore student classroom pointer
    IF v_item."previousClassroomId" IS NOT NULL THEN
      UPDATE "Student" SET "classroomId" = v_item."previousClassroomId", "status" = 'STUDYING', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = v_item."studentId";
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        UPDATE students SET classroom_id = v_item."previousClassroomId", status = 'NORMAL' WHERE id = v_item."studentId";
      END IF;
    END IF;
  END LOOP;

  -- 4. Mark batch as ROLLED_BACK
  UPDATE "PromotionBatch"
  SET "status" = 'ROLLED_BACK',
      "rollbackAt" = CURRENT_TIMESTAMP,
      "rollbackBy" = p_rollback_by,
      "rollbackReason" = p_rollback_reason,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'batchId', p_batch_id,
    'status', 'ROLLED_BACK',
    'message', 'Promotion batch successfully rolled back'
  );
END;
$$;
