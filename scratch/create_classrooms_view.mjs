import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Creating view public.classrooms...');
  await client.query(`
    CREATE OR REPLACE VIEW public.classrooms AS
    SELECT
      cr.id,
      cr.name,
      'ม.' || cr."gradeLevel"::text AS level,
      cr."gradeLevel" AS grade_level,
      cr."roomNumber" AS room_number,
      cr.name AS room_name,
      COALESCE(cr.adviser, 'ครูประจำชั้น') AS adviser,
      COALESCE(cr.status, 'ACTIVE') AS status,
      COUNT(se.id)::int AS student_count,
      cr."createdAt" AS created_at,
      cr."updatedAt" AS updated_at
    FROM public."ClassRoom" cr
    LEFT JOIN public."StudentEnrollment" se ON se."classRoomId" = cr.id AND se.status = 'ENROLLED'
    GROUP BY cr.id, cr.name, cr."gradeLevel", cr."roomNumber", cr.adviser, cr.status, cr."createdAt", cr."updatedAt"
    ORDER BY cr."gradeLevel" ASC, cr."roomNumber" ASC;

    GRANT ALL ON public.classrooms TO anon, authenticated, service_role;
    GRANT ALL ON public."ClassRoom" TO anon, authenticated, service_role;
    NOTIFY pgrst, 'reload schema';
  `);
  console.log('View public.classrooms created successfully!');
  await client.end();
}

main().catch(console.error);
