import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: DEFAULT_NEON_URL });
  await client.connect();

  try {
    console.log('--- 1. Running Migration 001_promotion_and_grades_ddl.sql ---');
    const sql1 = fs.readFileSync(path.resolve('migrations/001_promotion_and_grades_ddl.sql'), 'utf8');
    await client.query(sql1);
    console.log('✅ Migration 001 executed successfully!');

    console.log('--- 2. Running Migration 002_promotion_atomic_rpcs.sql ---');
    const sql2 = fs.readFileSync(path.resolve('migrations/002_promotion_atomic_rpcs.sql'), 'utf8');
    await client.query(sql2);
    console.log('✅ Migration 002 executed successfully!');

    // Verify columns on AssessmentColumn
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'AssessmentColumn' AND column_name IN ('classroomId', 'academicYear', 'semester')
      ORDER BY column_name;
    `);
    console.log('Verified AssessmentColumn multi-year fields:', cols.rows);

    // Verify backfill count in student_enrollments
    const enrollments = await client.query(`SELECT COUNT(*) as count FROM public.student_enrollments;`);
    console.log('Verified student_enrollments backfill count:', enrollments.rows[0].count);

    // Verify all 3 RPCs
    const rpcs = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name IN ('execute_student_promotion_batch', 'rollback_student_promotion_batch', 'purge_test_student_safely')
      ORDER BY routine_name;
    `);
    console.log('Verified RPCs:', rpcs.rows.map(r => r.routine_name));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
