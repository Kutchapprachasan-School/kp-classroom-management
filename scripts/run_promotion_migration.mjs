import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const { Client } = pg;

async function run() {
  const migrationPath = path.resolve('migrations/20261018_student_enrollments_and_promotion_rpcs.sql');
  console.log(`Reading migration: ${migrationPath}`);
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  console.log('Connecting to Neon PostgreSQL via pg.Client...');
  const client = new Client({ connectionString: DEFAULT_NEON_URL });
  await client.connect();

  console.log('Executing migration script...');
  await client.query(sqlContent);
  console.log('Migration executed successfully!');

  // Verify created tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('PromotionBatch', 'PromotionBatchItem', 'StudentEnrollment')
    ORDER BY table_name
  `);
  console.log('Verified tables:', tables.rows.map(t => t.table_name));

  // Verify RPC functions
  const rpcs = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name IN ('execute_student_promotion_batch', 'rollback_student_promotion_batch')
    ORDER BY routine_name
  `);
  console.log('Verified RPCs:', rpcs.rows.map(r => r.routine_name));

  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
