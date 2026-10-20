-- ==============================================================================
-- Migration: 004_unify_sms_and_classroom_schema.sql
-- Purpose: เชื่อมประสาน Schema ระหว่าง ระบบจัดการชั้นเรียน (09) ⟷ ระบบ SMS (eLeave)
--          ให้แสดงผลตรงกัน 100% แบบอัตโนมัติ (Zero Split-Brain)
-- ==============================================================================
-- รายการสิ่งที่ทำในไฟล์นี้:
-- 1. ปรับปรุง View `public.students` ให้เชื่อมเฉพาะ `"StudentEnrollment"` ที่ `status = 'ENROLLED'`
--    ป้องกันปัญหานักเรียนซ้ำแถวเมื่อมีประวัติหลายเทอม
-- 2. อัปเกรด Trigger `students_view_update_trigger` ให้ซิงค์การเปลี่ยนห้อง (`classroom_id`)
--    และเลขที่ (`seat_no`) ลงตาราง `"StudentEnrollment"` ทันที
-- 3. สร้าง Trigger ซิงค์อัตโนมัติจาก `public.student_enrollments` (ระบบเลื่อนชั้น)
--    ไปยัง `"StudentEnrollment"` (ตารางหลักของระบบ SMS และ View `classrooms`)
-- 4. สร้าง Trigger ซิงค์อัตโนมัติเมื่อเช็คชื่อหน้าเสาธง (`"Attendance"` period = 0)
--    ไปยัง `"StudentMorningAttendance"` เพื่อให้ Dashboard ฝั่ง SMS แสดงยอดมาเรียนตรงกันทันที
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ปรับปรุง View `public.students` ให้ดึงเฉพาะ Enrollment ปัจจุบัน (`ENROLLED`)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'students') THEN
    CREATE OR REPLACE VIEW public.students AS
     SELECT s.id,
        s."studentCode",
        s."studentCode" AS code,
        TRIM(BOTH FROM concat(COALESCE(s.title, ''::text), ' ', s."firstName", ' ', s."lastName")) AS name,
        s.title,
        s."firstName" AS first_name,
        s."lastName" AS last_name,
        s.gender,
        s.status,
        se."classRoomId" AS classroom_id,
        se."rollNumber" AS seat_no,
        s."createdAt" AS created_at,
        s."updatedAt" AS updated_at,
        COALESCE(s."academic_status", 'STUDYING') AS academic_status,
        s."graduated_academic_year" AS graduated_academic_year,
        s."parentPhone" AS parent_phone,
        s."parentPhone" AS "parentPhone",
        s."parentName" AS parent_name,
        s."parentName" AS "parentName"
       FROM "Student" s
         LEFT JOIN LATERAL (
           SELECT se_inner."classRoomId", se_inner."rollNumber"
           FROM "StudentEnrollment" se_inner
           WHERE se_inner."studentId" = s.id
             AND se_inner.status = 'ENROLLED'::"EnrollmentStatus"
           ORDER BY se_inner."academicYear" DESC, se_inner.term DESC
           LIMIT 1
         ) se ON true;

    -- 2. อัปเกรด INSTEAD OF UPDATE Trigger บน `public.students`
    CREATE OR REPLACE FUNCTION public.students_view_update_trigger()
    RETURNS TRIGGER AS $trg$
    BEGIN
      UPDATE public."Student"
      SET
        "academic_status" = COALESCE(NEW.academic_status, OLD.academic_status),
        "graduated_academic_year" = NEW.graduated_academic_year,
        "status" = CASE
          WHEN NEW.academic_status = 'GRADUATED' THEN 'GRADUATED'::"StudentStatus"
          WHEN NEW.academic_status = 'STUDYING' THEN 'ACTIVE'::"StudentStatus"
          ELSE "status"
        END,
        "parentPhone" = COALESCE(NEW."parentPhone", NEW.parent_phone, OLD."parentPhone"),
        "parentName" = COALESCE(NEW."parentName", NEW.parent_name, OLD."parentName"),
        "updatedAt" = NOW()
      WHERE id = OLD.id;

      -- ถ้ามีการเปลี่ยนห้องเรียน หรือ เลขที่ หรือ จบการศึกษา ให้อัปเดต "StudentEnrollment" ด้วย
      IF NEW.academic_status = 'GRADUATED' THEN
        UPDATE public."StudentEnrollment"
        SET status = 'COMPLETED'::"EnrollmentStatus", "updatedAt" = NOW()
        WHERE "studentId" = OLD.id AND status = 'ENROLLED'::"EnrollmentStatus";
      ELSIF NEW.classroom_id IS DISTINCT FROM OLD.classroom_id OR NEW.seat_no IS DISTINCT FROM OLD.seat_no THEN
        UPDATE public."StudentEnrollment"
        SET
          "classRoomId" = COALESCE(NEW.classroom_id, "classRoomId"),
          "rollNumber" = COALESCE(NEW.seat_no, "rollNumber"),
          "updatedAt" = NOW()
        WHERE "studentId" = OLD.id AND status = 'ENROLLED'::"EnrollmentStatus";
      END IF;

      RETURN NEW;
    END;
    $trg$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_students_view_update ON public.students;
    CREATE TRIGGER trg_students_view_update
    INSTEAD OF UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.students_view_update_trigger();
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Trigger ซิงค์ `public.student_enrollments` ⟷ `"StudentEnrollment"` (Prisma SMS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_student_enrollments_to_prisma_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_grade_int INTEGER := 1;
  v_room_int INTEGER := 1;
BEGIN
  -- ตรวจสอบว่ามีรหัสนักเรียนและห้องเรียนจริงในตารางหลักก่อนซิงค์ (ป้องกัน FK Error กรณีรัน Test จำลอง)
  IF NOT EXISTS (SELECT 1 FROM public."Student" WHERE id = NEW.student_id)
     OR NOT EXISTS (SELECT 1 FROM public."ClassRoom" WHERE id = NEW.classroom_id) THEN
    RETURN NEW;
  END IF;

  -- ดึง gradeLevel และ roomNumber จากตาราง "ClassRoom"
  SELECT COALESCE("gradeLevel", 1), COALESCE("roomNumber", 1)
  INTO v_grade_int, v_room_int
  FROM public."ClassRoom"
  WHERE id = NEW.classroom_id
  LIMIT 1;

  IF NEW.status = 'ACTIVE' THEN
    -- ปิดแถวเก่าที่เคย ENROLLED ของนักเรียนคนนี้ในเทอมก่อนหน้า
    UPDATE public."StudentEnrollment"
    SET status = 'COMPLETED'::"EnrollmentStatus", "updatedAt" = NOW()
    WHERE "studentId" = NEW.student_id
      AND status = 'ENROLLED'::"EnrollmentStatus"
      AND ("academicYear" <> NEW.academic_year OR term <> NEW.semester);

    -- Upsert แถวปัจจุบันเข้าตาราง "StudentEnrollment" ของฝั่ง SMS
    INSERT INTO public."StudentEnrollment" (
      id, "studentId", "academicYear", term, "classRoomId",
      "gradeLevel", "roomNumber", "rollNumber", status, "createdAt", "updatedAt"
    ) VALUES (
      NEW.id,
      NEW.student_id,
      NEW.academic_year,
      NEW.semester,
      NEW.classroom_id,
      v_grade_int,
      v_room_int,
      COALESCE(NEW.roll_number, 1),
      'ENROLLED'::"EnrollmentStatus",
      NOW(),
      NOW()
    )
    ON CONFLICT ("studentId", "academicYear", term)
    DO UPDATE SET
      "classRoomId" = EXCLUDED."classRoomId",
      "gradeLevel" = EXCLUDED."gradeLevel",
      "roomNumber" = EXCLUDED."roomNumber",
      "rollNumber" = EXCLUDED."rollNumber",
      status = 'ENROLLED'::"EnrollmentStatus",
      "updatedAt" = NOW();

  ELSIF NEW.status IN ('COMPLETED', 'GRADUATED', 'REPEATED') THEN
    UPDATE public."StudentEnrollment"
    SET status = 'COMPLETED'::"EnrollmentStatus", "updatedAt" = NOW()
    WHERE "studentId" = NEW.student_id
      AND "academicYear" = NEW.academic_year
      AND term = NEW.semester;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_student_enrollments_to_prisma ON public.student_enrollments;
CREATE TRIGGER trg_sync_student_enrollments_to_prisma
AFTER INSERT OR UPDATE ON public.student_enrollments
FOR EACH ROW EXECUTE FUNCTION public.sync_student_enrollments_to_prisma_fn();

-- ------------------------------------------------------------------------------
-- 4. Trigger ซิงค์เช็คชื่อเช้า `"Attendance"` (period = 0) ➔ `"StudentMorningAttendance"` (SMS Dashboard)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_morning_attendance_to_sms_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_enrollment_id TEXT;
  v_recorded_by TEXT;
  v_mapped_status "StudentAttendanceStatus";
BEGIN
  -- ทำงานเฉพาะแถวเช็คชื่อนักเรียนตอนเช้า (period = 0 และมี studentId)
  IF NEW."studentId" IS NULL OR COALESCE(NEW.period, 0) <> 0 OR NEW.date IS NULL THEN
    RETURN NEW;
  END IF;

  -- ค้นหา enrollmentId ปัจจุบันของนักเรียนคนนี้ (รองรับทั้งรหัส 'stu-xxxxx' และ 'xxxxx')
  SELECT id INTO v_enrollment_id
  FROM public."StudentEnrollment"
  WHERE "studentId" IN (NEW."studentId", 'stu-' || NEW."studentId")
    AND status = 'ENROLLED'::"EnrollmentStatus"
  ORDER BY "academicYear" DESC, term DESC
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ตรวจสอบ recordedById ว่ามีในตาราง "User" หรือไม่ (เนื่องจาก FK บังคับ)
  SELECT id INTO v_recorded_by
  FROM public."User"
  WHERE id = NEW."recordedBy"
  LIMIT 1;

  IF v_recorded_by IS NULL THEN
    SELECT id INTO v_recorded_by FROM public."User" ORDER BY "createdAt" ASC LIMIT 1;
  END IF;

  IF v_recorded_by IS NULL THEN
    RETURN NEW;
  END IF;

  v_mapped_status := CASE UPPER(COALESCE(NEW.status, 'PRESENT'))
    WHEN 'PRESENT' THEN 'PRESENT'::"StudentAttendanceStatus"
    WHEN 'LATE' THEN 'LATE'::"StudentAttendanceStatus"
    WHEN 'ABSENT' THEN 'ABSENT'::"StudentAttendanceStatus"
    WHEN 'LEAVE' THEN 'LEAVE'::"StudentAttendanceStatus"
    WHEN 'SICK' THEN 'LEAVE'::"StudentAttendanceStatus"
    WHEN 'PERSONAL' THEN 'LEAVE'::"StudentAttendanceStatus"
    WHEN 'ACTIVITY' THEN 'ACTIVITY'::"StudentAttendanceStatus"
    ELSE 'PRESENT'::"StudentAttendanceStatus"
  END;

  INSERT INTO public."StudentMorningAttendance" (
    id, "enrollmentId", "businessDate", "recordedAt", status, remarks, "recordedById"
  ) VALUES (
    'sma_' || v_enrollment_id || '_' || NEW.date,
    v_enrollment_id,
    NEW.date::date,
    NOW(),
    v_mapped_status,
    NEW.remark,
    v_recorded_by
  )
  ON CONFLICT ("enrollmentId", "businessDate")
  DO UPDATE SET
    status = EXCLUDED.status,
    remarks = EXCLUDED.remarks,
    "recordedAt" = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_morning_attendance_to_sms ON public."Attendance";
CREATE TRIGGER trg_sync_morning_attendance_to_sms
AFTER INSERT OR UPDATE ON public."Attendance"
FOR EACH ROW EXECUTE FUNCTION public.sync_morning_attendance_to_sms_fn();

COMMIT;
