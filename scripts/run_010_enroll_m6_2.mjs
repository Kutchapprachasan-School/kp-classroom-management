import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  console.log('--- Running Migration 010 ---');
  const sql = fs.readFileSync('migrations/010_enroll_5_students_into_room_6_2.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migration 010 applied successfully!');

  console.log('\n--- Verifying the 5 students in public.students View ---');
  const codes = ['16028', '16308', '16045', '16300', '16323'];
  const res = await client.query(`
    SELECT id, code, name, classroom_id, seat_no, status
    FROM public.students
    WHERE code = ANY($1)
    ORDER BY seat_no
  `, [codes]);
  console.table(res.rows);

  console.log('\n--- Verifying Room 6-2 in public.classrooms View ---');
  const cr62 = await client.query(`
    SELECT id, name, grade_level, room_number, student_count
    FROM public.classrooms
    WHERE id = 'room-6-2'
  `);
  console.log('Room 6-2 View record:', cr62.rows[0]);

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
