-- ==============================================================================
-- Migration: 003_sms_and_parent_contacts_view.sql
-- Purpose: Expose parent contact schema (parentPhone, parentName) in view "students"
--          and ensure zero-loss INSTEAD OF trigger updates for the SMS notification system.
-- ==============================================================================

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
       FROM ("Student" s
         LEFT JOIN "StudentEnrollment" se ON ((se."studentId" = s.id)));

    -- Update trigger to support parentPhone and parentName modifications
    CREATE OR REPLACE FUNCTION public.students_view_update_trigger()
    RETURNS TRIGGER AS $trg$
    BEGIN
      UPDATE public."Student"
      SET
        "academic_status" = COALESCE(NEW.academic_status, OLD.academic_status),
        "graduated_academic_year" = NEW.graduated_academic_year,
        "parentPhone" = COALESCE(NEW."parentPhone", NEW.parent_phone, OLD."parentPhone"),
        "parentName" = COALESCE(NEW."parentName", NEW.parent_name, OLD."parentName"),
        "updatedAt" = NOW()
      WHERE id = OLD.id;
      RETURN NEW;
    END;
    $trg$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_students_view_update ON public.students;
    CREATE TRIGGER trg_students_view_update
    INSTEAD OF UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.students_view_update_trigger();

    DROP TRIGGER IF EXISTS trg_students_view_delete ON public.students;
    CREATE TRIGGER trg_students_view_delete
    INSTEAD OF DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.students_view_delete_trigger();
  END IF;
END $$;
