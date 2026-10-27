import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  console.log('--- Running Migration 008 ---');
  const sql = fs.readFileSync('migrations/008_enroll_student_16038_and_sync_seats.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migration 008 applied successfully!');

  console.log('\n--- Verifying Student 16038 in public.students View ---');
  const v16038 = await client.query(`
    SELECT id, code, name, classroom_id, seat_no, status
    FROM public.students
    WHERE code = '16038'
  `);
  console.log('Student 16038 View record:', v16038.rows[0]);

  console.log('\n--- Verifying Room 5-4 in public.classrooms View ---');
  const cr54 = await client.query(`
    SELECT id, name, grade_level, room_number, student_count
    FROM public.classrooms
    WHERE id = 'room-5-4'
  `);
  console.log('Room 5-4 View record:', cr54.rows[0]);

  console.log('\n--- Verifying Room 4-4 Seats in public.students View ---');
  const m44Students = await client.query(`
    SELECT code, name, classroom_id, seat_no
    FROM public.students
    WHERE classroom_id = 'room-4-4'
    ORDER BY seat_no
  `);
  console.log(`Room 4-4 now has ${m44Students.rows.length} students:`);
  m44Students.rows.forEach(r => console.log(`  Seat ${r.seat_no}: ${r.code} ${r.name}`));

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
