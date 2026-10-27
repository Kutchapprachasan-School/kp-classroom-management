import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  console.log('--- Checking Counts Before Migration 009 ---');
  const countBeforeStu = await client.query('SELECT count(*) FROM public."Student"');
  const countBeforeSle = await client.query('SELECT count(*) FROM public.student_enrollments WHERE academic_year = 2569 AND semester = 2 AND status = \'ACTIVE\'');
  const countBeforeSe = await client.query('SELECT count(*) FROM public."StudentEnrollment" WHERE "academicYear" = 2569 AND term = 2 AND status = \'ENROLLED\'');

  console.log(`Students: ${countBeforeStu.rows[0].count}`);
  console.log(`Active student_enrollments: ${countBeforeSle.rows[0].count}`);
  console.log(`Active StudentEnrollment (SMS): ${countBeforeSe.rows[0].count}`);

  console.log('\n--- Running Migration 009 (Importing 98 students) ---');
  const sql = fs.readFileSync('migrations/009_import_98_new_students.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migration 009 SQL applied successfully!');

  console.log('\n--- Checking Counts After Migration 009 ---');
  const countAfterStu = await client.query('SELECT count(*) FROM public."Student"');
  const countAfterSle = await client.query('SELECT count(*) FROM public.student_enrollments WHERE academic_year = 2569 AND semester = 2 AND status = \'ACTIVE\'');
  const countAfterSe = await client.query('SELECT count(*) FROM public."StudentEnrollment" WHERE "academicYear" = 2569 AND term = 2 AND status = \'ENROLLED\'');

  console.log(`Students: ${countAfterStu.rows[0].count} (+${countAfterStu.rows[0].count - countBeforeStu.rows[0].count})`);
  console.log(`Active student_enrollments: ${countAfterSle.rows[0].count} (+${countAfterSle.rows[0].count - countBeforeSle.rows[0].count})`);
  console.log(`Active StudentEnrollment (SMS): ${countAfterSe.rows[0].count} (+${countAfterSe.rows[0].count - countBeforeSe.rows[0].count})`);

  // Verify room counts in public.classrooms view
  console.log('\n--- Verifying All Classrooms in public.classrooms View ---');
  const rooms = await client.query(`
    SELECT id, name, grade_level, room_number, student_count
    FROM public.classrooms
    ORDER BY grade_level, room_number
  `);
  console.table(rooms.rows);

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
