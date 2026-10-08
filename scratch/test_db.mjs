import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  console.log('1. Creating view public.students on public."Student"...');
  await client.query(`
    CREATE OR REPLACE VIEW public.students AS
    SELECT
      s.id,
      s."studentCode",
      s."studentCode" AS code,
      TRIM(CONCAT(COALESCE(s.title, ''), ' ', s."firstName", ' ', s."lastName")) AS name,
      s.title,
      s."firstName" AS first_name,
      s."lastName" AS last_name,
      s.gender,
      s.status,
      se."classRoomId" AS classroom_id,
      se."rollNumber" AS seat_no,
      s."createdAt" AS created_at,
      s."updatedAt" AS updated_at
    FROM public."Student" s
    LEFT JOIN public."StudentEnrollment" se ON se."studentId" = s.id;
  `);

  console.log('2. Creating INSTEAD OF INSERT trigger on public.students...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_insert_student_view()
    RETURNS TRIGGER AS $$
    DECLARE
      v_title TEXT := COALESCE(NEW.title, 'ด.ช.');
      v_first TEXT;
      v_last TEXT;
      v_parts TEXT[];
    BEGIN
      -- Parse name if provided
      IF NEW.name IS NOT NULL AND NEW.name <> '' THEN
        v_parts := regexp_split_to_array(trim(NEW.name), '\\s+');
        IF array_length(v_parts, 1) >= 2 THEN
          v_first := v_parts[1];
          v_last := array_to_string(v_parts[2:], ' ');
        ELSE
          v_first := NEW.name;
          v_last := '';
        END IF;
      ELSE
        v_first := COALESCE(NEW.first_name, 'นักเรียน');
        v_last := COALESCE(NEW.last_name, '');
      END IF;

      INSERT INTO public."Student" (
        id,
        "studentCode",
        title,
        "firstName",
        "lastName",
        gender,
        status,
        "createdAt",
        "updatedAt"
      ) VALUES (
        COALESCE(NEW.id, 'stu-' || COALESCE(NEW."studentCode", NEW.code, gen_random_uuid()::text)),
        COALESCE(NEW."studentCode", NEW.code),
        v_title,
        v_first,
        v_last,
        COALESCE(NEW.gender, 'MALE'),
        COALESCE(NEW.status, 'ACTIVE'),
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "studentCode" = EXCLUDED."studentCode",
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "updatedAt" = NOW();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS tr_insert_students_view ON public.students;
    CREATE TRIGGER tr_insert_students_view
    INSTEAD OF INSERT ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.fn_insert_student_view();
  `);

  console.log('3. Granting permissions on public.students and reloading schema...');
  await client.query(`
    GRANT ALL ON public.students TO anon, authenticated, service_role;
    GRANT ALL ON public."Student" TO anon, authenticated, service_role;
    GRANT ALL ON public."StudentEnrollment" TO anon, authenticated, service_role;
    GRANT ALL ON public."ClassRoom" TO anon, authenticated, service_role;
    NOTIFY pgrst, 'reload schema';
  `);

  console.log('Done!');
  await client.end();
}

main().catch(console.error);
