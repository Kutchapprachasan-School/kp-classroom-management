import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('1. Altering ClassRoom table...');
  await client.query(`
    ALTER TABLE public."ClassRoom" ADD COLUMN IF NOT EXISTS adviser TEXT;
    ALTER TABLE public."ClassRoom" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
  `);

  console.log('2. Populating standard classrooms if missing...');
  const rooms = [
    { id: 'room-1-1', gradeLevel: 1, roomNumber: 1, name: 'ม.1/1', adviser: 'ครูประภาส ชัยเดช' },
    { id: 'room-1-2', gradeLevel: 1, roomNumber: 2, name: 'ม.1/2', adviser: 'ครูพิมพ์ใจ บุญรักษ์' },
    { id: 'room-1-8', gradeLevel: 1, roomNumber: 8, name: 'ม.1/8', adviser: 'ครูเอกชัย มงคลรัตน์' },
    { id: 'room-2-1', gradeLevel: 2, roomNumber: 1, name: 'ม.2/1', adviser: 'ครูกานดา สดใส' },
    { id: 'room-2-8', gradeLevel: 2, roomNumber: 8, name: 'ม.2/8', adviser: 'ครูปริยากร วรานนท์' },
    { id: 'room-3-1', gradeLevel: 3, roomNumber: 1, name: 'ม.3/1', adviser: 'ครูภาสภูมิ เรืองปราชญ์' },
    { id: 'room-3-2', gradeLevel: 3, roomNumber: 2, name: 'ม.3/2', adviser: 'ครูวิภาดา พิมพา' },
    { id: 'room-3-5', gradeLevel: 3, roomNumber: 5, name: 'ม.3/5', adviser: 'ครูเกรียงไกร สิทธิโชค' },
    { id: 'room-3-6', gradeLevel: 3, roomNumber: 6, name: 'ม.3/6', adviser: 'ครูพงศ์พิชญ์ วิเศษ' },
    { id: 'room-3-7', gradeLevel: 3, roomNumber: 7, name: 'ม.3/7', adviser: 'ครูสมศักดิ์ สุขใจ' },
    { id: 'room-3-8', gradeLevel: 3, roomNumber: 8, name: 'ม.3/8', adviser: 'ครูปิยพล ธนบดี' },
    { id: 'room-4-1', gradeLevel: 4, roomNumber: 1, name: 'ม.4/1', adviser: 'ครูนิตยา สุขเกษม' },
    { id: 'room-5-1', gradeLevel: 5, roomNumber: 1, name: 'ม.5/1', adviser: 'ครูมานะ มั่งคั่ง' },
    { id: 'room-6-1', gradeLevel: 6, roomNumber: 1, name: 'ม.6/1', adviser: 'ครูสมปอง มีสุข' },
  ];

  for (const r of rooms) {
    await client.query(`
      INSERT INTO public."ClassRoom" (id, "gradeLevel", "roomNumber", name, adviser, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        adviser = EXCLUDED.adviser,
        "gradeLevel" = EXCLUDED."gradeLevel",
        "roomNumber" = EXCLUDED."roomNumber",
        status = 'ACTIVE',
        "updatedAt" = NOW();
    `, [r.id, r.gradeLevel, r.roomNumber, r.name, r.adviser]);
  }

  console.log('3. Creating view public.classrooms...');
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
    LEFT JOIN public."StudentEnrollment" se ON se."classRoomId" = cr.id AND se.status = 'ACTIVE'
    GROUP BY cr.id, cr.name, cr."gradeLevel", cr."roomNumber", cr.adviser, cr.status, cr."createdAt", cr."updatedAt";

    GRANT ALL ON public.classrooms TO anon, authenticated, service_role;
    GRANT ALL ON public."ClassRoom" TO anon, authenticated, service_role;
    NOTIFY pgrst, 'reload schema';
  `);

  console.log('Migration completed successfully!');
  await client.end();
}

main().catch(console.error);
