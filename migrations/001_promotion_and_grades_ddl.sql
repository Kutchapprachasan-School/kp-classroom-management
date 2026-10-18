-- ============================================================================
-- Migration: 001_promotion_and_grades_ddl.sql
-- รายละเอียด: สร้างตารางประวัติการลงทะเบียนเรียน, ประวัติการเลื่อนชั้น และเชื่อมโยงตารางคะแนน
-- ============================================================================

BEGIN;

-- 1. อัปเกรดตาราง AssessmentColumn ให้รองรับการแยกปีการศึกษาและภาคเรียน
ALTER TABLE "AssessmentColumn"
  ADD COLUMN IF NOT EXISTS "classroomId" TEXT,
  ADD COLUMN IF NOT EXISTS "academicYear" INTEGER NOT NULL DEFAULT 2569,
  ADD COLUMN IF NOT EXISTS "semester" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_assessment_col_year_sem
  ON "AssessmentColumn" ("academicYear", "semester", "classroomId");

CREATE INDEX IF NOT EXISTS idx_student_score_student_id
  ON "StudentScore" ("studentId");

-- 2. ตารางเก็บประวัติการรันเลื่อนชั้น (Promotion Batches) สำหรับตรวจสอบและ Rollback
CREATE TABLE IF NOT EXISTS public.promotion_batches (
  id TEXT PRIMARY KEY DEFAULT ('promo_' || gen_random_uuid()::text),
  from_academic_year INTEGER NOT NULL,
  from_semester INTEGER NOT NULL,
  to_academic_year INTEGER NOT NULL,
  to_semester INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED'
    CHECK (status IN ('COMPLETED', 'ROLLED_BACK')),
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_payload JSONB NOT NULL DEFAULT '[]'::jsonb, -- เก็บสถานะก่อนเลื่อนชั้นทั้งหมดเพื่อใช้ Rollback
  executed_by TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rolled_back_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promotion_batches_years
  ON public.promotion_batches (from_academic_year, to_academic_year, status);

-- 3. ตารางเก็บประวัติการเรียนรายปี/รายเทอมของนักเรียนแต่ละคน (Two-Tier Enrollment)
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id TEXT PRIMARY KEY DEFAULT ('enr_' || gen_random_uuid()::text),
  student_id TEXT NOT NULL,
  classroom_id TEXT NOT NULL,
  grade_level TEXT,                      -- เช่น 'ป.1', 'ม.3', 'ม.6'
  academic_year INTEGER NOT NULL,        -- เช่น 2569
  semester INTEGER NOT NULL DEFAULT 1,   -- เช่น 1 หรือ 2
  roll_number INTEGER,                   -- เลขที่ในห้องเรียน ณ เทอมนั้น
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'REPEATED', 'GRADUATED', 'TRANSFERRED', 'ROLLED_BACK')),
  final_gpa NUMERIC(4, 2),               -- เกรดเฉลี่ยสะสมประจำเทอม (ถ้ามี)
  promotion_batch_id TEXT REFERENCES public.promotion_batches(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- กฎเหล็กข้อที่ 1: นักเรียน 1 คน ลงทะเบียนใน (ปีการศึกษา + เทอม) เดียวกันได้เพียง 1 แถว (ยกเว้นแถวที่ถูก Rollback)
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_enrollment_term
  ON public.student_enrollments (student_id, academic_year, semester)
  WHERE status <> 'ROLLED_BACK';

-- กฎเหล็กข้อที่ 2: นักเรียน 1 คน มีสถานะ 'ACTIVE' ในปัจจุบันได้เพียง 1 ห้องเท่านั้น
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_single_active_enrollment
  ON public.student_enrollments (student_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_enrollments_classroom_term
  ON public.student_enrollments (classroom_id, academic_year, semester, status);

-- 4. เพิ่มคอลัมน์สถานะศิษย์เก่าในตารางนักเรียนหลัก (รองรับทั้งชื่อตาราง students หรือ "Student")
DO $$
BEGIN
  -- 4.1 ถ้าเป็น Base Table "Student" (โครงสร้างหลักของระบบ)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Student' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public."Student"
      ADD COLUMN IF NOT EXISTS "academic_status" TEXT NOT NULL DEFAULT 'STUDYING',
      ADD COLUMN IF NOT EXISTS "graduated_academic_year" INTEGER;
  END IF;

  -- 4.2 ถ้าเป็น Base Table students
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.students
      ADD COLUMN IF NOT EXISTS academic_status TEXT NOT NULL DEFAULT 'STUDYING'
      CHECK (academic_status IN ('STUDYING', 'GRADUATED', 'TRANSFERRED', 'DROPPED')),
      ADD COLUMN IF NOT EXISTS graduated_academic_year INTEGER;
  END IF;
END $$;

-- 4.3 ถ้า public.students เป็น VIEW ให้อัปเดต View พร้อม INSTEAD OF Triggers เพื่อให้ RPC Update/Delete ได้โปร่งใส
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
        s."graduated_academic_year" AS graduated_academic_year
       FROM ("Student" s
         LEFT JOIN "StudentEnrollment" se ON ((se."studentId" = s.id)));

    CREATE OR REPLACE FUNCTION public.students_view_update_trigger()
    RETURNS TRIGGER AS $trg$
    BEGIN
      UPDATE public."Student"
      SET
        "academic_status" = COALESCE(NEW.academic_status, OLD.academic_status),
        "graduated_academic_year" = NEW.graduated_academic_year
      WHERE id = OLD.id;
      RETURN NEW;
    END;
    $trg$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_students_view_update ON public.students;
    CREATE TRIGGER trg_students_view_update
    INSTEAD OF UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.students_view_update_trigger();

    CREATE OR REPLACE FUNCTION public.students_view_delete_trigger()
    RETURNS TRIGGER AS $trg$
    BEGIN
      DELETE FROM public."Student" WHERE id = OLD.id;
      RETURN OLD;
    END;
    $trg$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_students_view_delete ON public.students;
    CREATE TRIGGER trg_students_view_delete
    INSTEAD OF DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.students_view_delete_trigger();
  END IF;
END $$;

-- 4.4 Backfill นักเรียนปัจจุบันเข้าสู่ student_enrollments (ปีการศึกษา 2569 เทอม 1)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, status
)
SELECT
  'enr_init_' || s.id::text,
  s.id::text,
  COALESCE(s.classroom_id::text, 'UNASSIGNED'),
  2569,
  1,
  'ACTIVE'
FROM public.students s
WHERE s.classroom_id IS NOT NULL
ON CONFLICT DO NOTHING;


COMMIT;
