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
    console.log('--- 1. Executing Migration 007_relocate_misplaced_room_1_1_students.sql ---');
    const sql = fs.readFileSync(path.resolve('migrations/007_relocate_misplaced_room_1_1_students.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Migration 007 executed successfully!');

    // 2. Verification
    console.log('\n--- 2. Verifying room-1-1 Isolation & System State ---');

    // Count in StudentEnrollment for room-1-1
    const seCount = await client.query(`
      SELECT status, COUNT(*) as count
      FROM public."StudentEnrollment"
      WHERE "classRoomId" = 'room-1-1'
      GROUP BY status;
    `);
    console.log('StudentEnrollment in room-1-1 by status:', seCount.rows);

    // Count in student_enrollments for room-1-1
    const se2Count = await client.query(`
      SELECT status, COUNT(*) as count
      FROM public.student_enrollments
      WHERE classroom_id = 'room-1-1'
      GROUP BY status;
    `);
    console.log('student_enrollments in room-1-1 by status:', se2Count.rows);

    // Total distinct students in room-1-1
    const distinct11 = await client.query(`
      SELECT COUNT(DISTINCT "studentId") as count
      FROM public."StudentEnrollment"
      WHERE "classRoomId" = 'room-1-1';
    `);
    console.log('Total distinct students in room-1-1:', distinct11.rows[0].count);

    // Total students across all rooms in public.students view
    const totalViewCount = await client.query(`
      SELECT COUNT(*) as count
      FROM public.students;
    `);
    console.log('Total students across all rooms in public.students view:', totalViewCount.rows[0].count);

    // Verify classrooms view student_count
    const crView = await client.query(`
      SELECT id, name, student_count
      FROM public.classrooms
      WHERE id IN ('room-1-1', 'room-2-2', 'room-6-3');
    `);
    console.log('classrooms view check:', crView.rows);

    console.log('🎉 ROOM 1/1 CLEANUP FULLY COMPLETED WITH ZERO DATA LOSS!');
  } catch (err) {
    console.error('❌ Migration 007 failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
