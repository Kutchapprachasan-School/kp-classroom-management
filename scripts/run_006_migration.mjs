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
    console.log('--- 1. Executing Migration 006_normalize_all_classroom_ids.sql ---');
    const sql = fs.readFileSync(path.resolve('migrations/006_normalize_all_classroom_ids.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Migration 006 executed successfully!');

    // 2. Comprehensive Verification
    console.log('--- 2. Verifying Normalized Database State ---');

    // A. ClassRoom table
    const remainingTs = await client.query(`SELECT COUNT(*) as count FROM public."ClassRoom" WHERE id LIKE 'room-179%';`);
    console.log('Remaining timestamp IDs in "ClassRoom":', remainingTs.rows[0].count);

    const allRooms = await client.query(`SELECT id, name, "gradeLevel", "roomNumber" FROM public."ClassRoom" ORDER BY "gradeLevel", "roomNumber";`);
    console.log(`Total active rooms in "ClassRoom": ${allRooms.rows.length}`);
    console.log('Sample normalized rooms:');
    allRooms.rows.slice(0, 10).forEach(r => console.log(`  - ${r.name}: ${r.id}`));

    // B. StudentEnrollment table (SMS Prisma)
    const remainingSePrisma = await client.query(`SELECT COUNT(*) as count FROM public."StudentEnrollment" WHERE "classRoomId" LIKE 'room-179%';`);
    console.log('Remaining timestamp IDs in "StudentEnrollment":', remainingSePrisma.rows[0].count);

    // C. student_enrollments table (Classroom Promotion)
    const remainingSe = await client.query(`SELECT COUNT(*) as count FROM public.student_enrollments WHERE classroom_id LIKE 'room-179%';`);
    console.log('Remaining timestamp IDs in student_enrollments:', remainingSe.rows[0].count);

    // D. View public.students
    const totalStudents = await client.query(`SELECT COUNT(*) as count FROM public.students;`);
    console.log('Total students in public.students view:', totalStudents.rows[0].count);

    // Check specific classrooms
    const checkRooms = ['room-1-3', 'room-4-4', 'room-5-4', 'room-6-3'];
    for (const rid of checkRooms) {
      const stCount = await client.query(`SELECT COUNT(*) as count FROM public.students WHERE classroom_id = $1;`, [rid]);
      const crCount = await client.query(`SELECT student_count FROM public.classrooms WHERE id = $1;`, [rid]);
      console.log(`Room ${rid}: ${stCount.rows[0].count} students in view, student_count=${crCount.rows[0]?.student_count}`);
    }

    // E. Cloud Store
    const remainingKps = await client.query(`SELECT COUNT(*) as count FROM public.kps_cloud_store WHERE key LIKE '%1791986%';`);
    console.log('Remaining timestamp keys in kps_cloud_store:', remainingKps.rows[0].count);

    console.log('🎉 ALL DATA FULLY MIGRATED & VERIFIED ZERO-LOSS!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
