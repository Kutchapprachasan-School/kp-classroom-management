import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const enums = await client.query(`
    SELECT t.typname, e.enumlabel 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname IN ('EnrollmentStatus', 'StudentStatus')
    ORDER BY t.typname, e.enumsortorder;
  `);
  console.log('Enums:', enums.rows);
  await client.end();
}

run().catch(console.error);
