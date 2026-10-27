import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  console.log('--- Running Migration 011 (Enrolling 16329 into room-5-4 Seat 29) ---');
  const sql = fs.readFileSync('migrations/011_enroll_student_16329_into_room_5_4.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migration 011 applied successfully!');

  console.log('\n--- Verifying Student 16329 in public.students View ---');
  const stu = await client.query(`
    SELECT id, code, name, classroom_id, seat_no, status
    FROM public.students
    WHERE code = '16329'
  `);
  console.table(stu.rows);

  console.log('\n--- Verifying Room 5-4 in public.classrooms View ---');
  const cr = await client.query(`
    SELECT id, name, grade_level, room_number, student_count
    FROM public.classrooms
    WHERE id = 'room-5-4'
  `);
  console.table(cr.rows);

  console.log('\n--- Checking for ANY unenrolled students remaining across entire DB ---');
  const unenrolled = await client.query(`
    SELECT s.id, s."studentCode", s.title, s."firstName", s."lastName"
    FROM public."Student" s
    LEFT JOIN public."StudentEnrollment" se 
      ON se."studentId" = s.id AND se.status = 'ENROLLED' AND se."academicYear" = 2569 AND se.term = 2
    WHERE se.id IS NULL;
  `);
  console.log(`Unenrolled students in DB: ${unenrolled.rows.length}`);
  if (unenrolled.rows.length > 0) {
    console.table(unenrolled.rows);
  } else {
    console.log('🎉 100% OF ALL STUDENTS IN THE DATABASE ARE NOW ENROLLED IN A CLASSROOM!');
  }

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
