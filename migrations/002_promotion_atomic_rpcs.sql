-- ============================================================================
-- Migration: 002_promotion_atomic_rpcs.sql
-- รายละเอียด: Atomic RPC สำหรับเลื่อนชั้น, Rollback (เช็คคะแนนจริง), และลบเด็กทดสอบ
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RPC: เลื่อนชั้นนักเรียนแบบ All-or-Nothing (execute_student_promotion_batch)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_student_promotion_batch(
  p_from_academic_year INTEGER,
  p_from_semester INTEGER,
  p_to_academic_year INTEGER,
  p_to_semester INTEGER,
  p_executed_by TEXT,
  p_transitions JSONB -- Array ของ [{ "student_id", "from_classroom_id", "to_classroom_id", "action": "PROMOTE"|"REPEAT"|"GRADUATE", "roll_number", "grade_level", "remarks" }]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_id TEXT := 'promo_' || gen_random_uuid()::text;
  v_item JSONB;
  v_student_id TEXT;
  v_from_classroom TEXT;
  v_to_classroom TEXT;
  v_action TEXT;
  v_roll_number INTEGER;
  v_grade_level TEXT;
  v_remarks TEXT;
  v_prev_enr_id TEXT;
  v_new_enr_id TEXT;
  v_snapshot JSONB := '[]'::jsonb;
  v_promoted_count INTEGER := 0;
  v_repeated_count INTEGER := 0;
  v_graduated_count INTEGER := 0;
BEGIN
  -- 1. ตรวจสอบข้อมูลนำเข้า
  IF jsonb_typeof(p_transitions) <> 'array' OR jsonb_array_length(p_transitions) = 0 THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD: รายการเลื่อนชั้นต้องไม่ว่างเปล่า';
  END IF;

  IF p_from_academic_year = p_to_academic_year AND p_from_semester = p_to_semester THEN
    RAISE EXCEPTION 'INVALID_TERM: ปีการศึกษาและภาคเรียนปลายทางต้องไม่ซ้ำกับต้นทาง';
  END IF;

  -- 2. สร้างหัวตาราง Batch ก่อนเพื่อใช้ผูก Foreign Key
  INSERT INTO public.promotion_batches (
    id, from_academic_year, from_semester, to_academic_year, to_semester, status, executed_by
  ) VALUES (
    v_batch_id, p_from_academic_year, p_from_semester, p_to_academic_year, p_to_semester, 'COMPLETED', COALESCE(p_executed_by, 'SYSTEM')
  );

  -- 3. วนลูปจัดการนักเรียนทีละคนภายใต้ Transaction เดียวกัน
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_transitions)
  LOOP
    v_student_id    := v_item->>'student_id';
    v_from_classroom := v_item->>'from_classroom_id';
    v_to_classroom  := v_item->>'to_classroom_id';
    v_action        := COALESCE(v_item->>'action', 'PROMOTE');
    v_roll_number   := NULLIF(v_item->>'roll_number', '')::integer;
    v_grade_level   := v_item->>'grade_level';
    v_remarks       := v_item->>'remarks';

    -- ล็อกแถว Enrollment ปัจจุบันของนักเรียนคนนี้ (ป้องกัน Race Condition)
    SELECT id INTO v_prev_enr_id
    FROM public.student_enrollments
    WHERE student_id = v_student_id AND status = 'ACTIVE'
    FOR UPDATE;

    -- ปิดสถานะเทอมเดิม (เก็บประวัติเดิมไว้ 100%)
    IF v_prev_enr_id IS NOT NULL THEN
      UPDATE public.student_enrollments
      SET
        status = CASE
          WHEN v_action = 'REPEAT' THEN 'REPEATED'
          WHEN v_action = 'GRADUATE' THEN 'GRADUATED'
          ELSE 'COMPLETED'
        END,
        updated_at = NOW()
      WHERE id = v_prev_enr_id;
    END IF;

    v_new_enr_id := NULL;

    -- แยกการทำงานตาม Action
    IF v_action IN ('PROMOTE', 'REPEAT') THEN
      IF v_to_classroom IS NULL OR v_to_classroom = '' THEN
        RAISE EXCEPTION 'MISSING_TARGET_CLASSROOM: นักเรียนรหัส % ไม่มีห้องเรียนปลายทาง', v_student_id;
      END IF;

      v_new_enr_id := 'enr_' || gen_random_uuid()::text;

      -- เปิด Enrollment ใหม่ในเทอมปลายทาง
      INSERT INTO public.student_enrollments (
        id, student_id, classroom_id, grade_level, academic_year, semester,
        roll_number, status, promotion_batch_id, remarks
      ) VALUES (
        v_new_enr_id, v_student_id, v_to_classroom, v_grade_level, p_to_academic_year, p_to_semester,
        v_roll_number, 'ACTIVE', v_batch_id, v_remarks
      );

      -- อัปเดต Pointer ห้องปัจจุบันในตาราง students
      UPDATE public.students
      SET
        classroom_id = v_to_classroom,
        academic_status = 'STUDYING'
      WHERE id::text = v_student_id;

      IF v_action = 'PROMOTE' THEN
        v_promoted_count := v_promoted_count + 1;
      ELSE
        v_repeated_count := v_repeated_count + 1;
      END IF;

    ELSIF v_action = 'GRADUATE' THEN
      -- กรณีจบการศึกษา (ม.3 หรือ ม.6) ย้ายเข้าทำเนียบศิษย์เก่า
      UPDATE public.students
      SET
        classroom_id = NULL,
        academic_status = 'GRADUATED',
        graduated_academic_year = p_from_academic_year
      WHERE id::text = v_student_id;

      v_graduated_count := v_graduated_count + 1;
    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: ไม่รู้จักคำสั่ง % สำหรับนักเรียน %', v_action, v_student_id;
    END IF;

    -- บันทึก Snapshot สำหรับใช้ Rollback แบบแม่นยำ 100%
    v_snapshot := v_snapshot || jsonb_build_object(
      'student_id', v_student_id,
      'prev_enrollment_id', v_prev_enr_id,
      'new_enrollment_id', v_new_enr_id,
      'from_classroom_id', v_from_classroom,
      'to_classroom_id', v_to_classroom,
      'action', v_action
    );
  END LOOP;

  -- 4. อัปเดต Snapshot และสรุปผลลงใน promotion_batches
  UPDATE public.promotion_batches
  SET
    snapshot_payload = v_snapshot,
    summary_json = jsonb_build_object(
      'total_processed', jsonb_array_length(p_transitions),
      'promoted_count', v_promoted_count,
      'repeated_count', v_repeated_count,
      'graduated_count', v_graduated_count
    )
  WHERE id = v_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'promoted_count', v_promoted_count,
    'repeated_count', v_repeated_count,
    'graduated_count', v_graduated_count
  );
END;
$$;


-- ============================================================================
-- 2. RPC: ย้อนกลับการเลื่อนชั้นพร้อมตรวจจับคะแนนใหม่ (rollback_student_promotion_batch)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rollback_student_promotion_batch(
  p_batch_id TEXT,
  p_executed_by TEXT DEFAULT 'SYSTEM',
  p_force_override BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch RECORD;
  v_conflict_scores INTEGER := 0;
  v_item JSONB;
BEGIN
  -- 1. ล็อกแถว Batch ที่ต้องการย้อนกลับ
  SELECT * INTO v_batch
  FROM public.promotion_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BATCH_NOT_FOUND: ไม่พบรหัสรอบการเลื่อนชั้น %', p_batch_id;
  END IF;

  IF v_batch.status = 'ROLLED_BACK' THEN
    RAISE EXCEPTION 'ALREADY_ROLLED_BACK: รอบการเลื่อนชั้นนี้ถูกย้อนกลับไปแล้ว';
  END IF;

  -- 2. [P0 Conflict Guard] ตรวจเช็คว่ามีครูกรอกคะแนนในเทอมใหม่ (StudentScore + AssessmentColumn) ไปแล้วหรือยัง!
  SELECT COUNT(ss.id) INTO v_conflict_scores
  FROM "StudentScore" ss
  INNER JOIN "AssessmentColumn" ac ON ac.id = ss."assignmentId"
  INNER JOIN public.student_enrollments se ON se.student_id = ss."studentId"
  WHERE se.promotion_batch_id = p_batch_id
    AND ac."academicYear" = v_batch.to_academic_year
    AND ac."semester" = v_batch.to_semester
    AND ss.score IS NOT NULL; -- นับเฉพาะช่องที่มีการกรอกตัวเลขคะแนนจริง

  IF v_conflict_scores > 0 AND NOT p_force_override THEN
    RETURN jsonb_build_object(
      'success', false,
      'conflict_detected', true,
      'conflict_score_count', v_conflict_scores,
      'message', format('ไม่สามารถย้อนกลับอัตโนมัติได้ เนื่องจากพบการกรอกคะแนนในภาคเรียนใหม่แล้วจำนวน %s รายการ', v_conflict_scores)
    );
  END IF;

  -- 3. ดำเนินการย้อนกลับข้อมูลตาม Snapshot
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_batch.snapshot_payload)
  LOOP
    -- 3.1 เปลี่ยนสถานะ Enrollment เทอมใหม่ให้เป็น ROLLED_BACK
    IF (v_item->>'new_enrollment_id') IS NOT NULL THEN
      UPDATE public.student_enrollments
      SET status = 'ROLLED_BACK', updated_at = NOW()
      WHERE id = (v_item->>'new_enrollment_id');
    END IF;

    -- 3.2 คืนสถานะ ACTIVE ให้ Enrollment เทอมเดิม
    IF (v_item->>'prev_enrollment_id') IS NOT NULL THEN
      UPDATE public.student_enrollments
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE id = (v_item->>'prev_enrollment_id');
    END IF;

    -- 3.3 คืนค่า Pointer ห้องเรียนเดิมในตาราง students
    UPDATE public.students
    SET
      classroom_id = NULLIF(v_item->>'from_classroom_id', ''),
      academic_status = 'STUDYING',
      graduated_academic_year = NULL
    WHERE id::text = (v_item->>'student_id');
  END LOOP;

  -- 4. บันทึกสถานะว่า Batch นี้ถูกย้อนกลับแล้ว
  UPDATE public.promotion_batches
  SET
    status = 'ROLLED_BACK',
    rolled_back_at = NOW()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'conflict_detected', false,
    'batch_id', p_batch_id,
    'restored_count', jsonb_array_length(v_batch.snapshot_payload)
  );
END;
$$;


-- ============================================================================
-- 3. RPC: ลบนักเรียนทดสอบอย่างปลอดภัย (purge_test_student_safely)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.purge_test_student_safely(
  p_student_id TEXT,
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_scores INTEGER := 0;
  v_completed_terms INTEGER := 0;
BEGIN
  -- 1. นับจำนวนคะแนนจริงที่มีการกรอกไว้ใน StudentScore (ไม่นับช่องว่าง null)
  SELECT COUNT(*) INTO v_active_scores
  FROM "StudentScore"
  WHERE "studentId" = p_student_id
    AND score IS NOT NULL;

  -- 2. นับจำนวนเทอมที่เรียนจบไปแล้วในประวัติ student_enrollments
  SELECT COUNT(*) INTO v_completed_terms
  FROM public.student_enrollments
  WHERE student_id = p_student_id
    AND status IN ('COMPLETED', 'GRADUATED', 'REPEATED');

  -- 3. ถ้ามีคะแนนจริงหรือมีประวัติข้ามเทอม และไม่ได้สั่ง Force จะบล็อกทันที
  IF (v_active_scores > 0 OR v_completed_terms > 0) AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'blocked_by_guard', true,
      'active_score_count', v_active_scores,
      'completed_term_count', v_completed_terms,
      'message', format('ระบบป้องกันการลบทำงาน: นักเรียนรหัส %s มีประวัติคะแนนจริง %s ช่อง และประวัติผ่านชั้นเรียน %s เทอม', p_student_id, v_active_scores, v_completed_terms)
    );
  END IF;

  -- 4. ลบข้อมูลที่เกี่ยวข้องทั้งหมดอย่างสะอาดใน Transaction เดียว
  DELETE FROM "StudentScore" WHERE "studentId" = p_student_id;
  DELETE FROM public.student_enrollments WHERE student_id = p_student_id;
  DELETE FROM public.students WHERE id::text = p_student_id;

  RETURN jsonb_build_object(
    'success', true,
    'blocked_by_guard', false,
    'purged_student_id', p_student_id
  );
END;
$$;

COMMIT;
