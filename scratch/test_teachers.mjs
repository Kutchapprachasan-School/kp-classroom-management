import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, name, username, email, role, position, "subjectGroup" FROM "User" ORDER BY name');
  console.log('Total users:', res.rows.length);
  const teachers = res.rows.filter(r => r.role === 'TEACHER' || r.role === 'ADMIN' || (r.position && r.position.includes('ครู')));
  console.log('Teachers count:', teachers.length);
  teachers.forEach(t => console.log(`- ${t.name} (${t.username || t.email}) [${t.role}] [${t.subjectGroup || t.position}]`));
  await client.end();
}

run().catch(console.error);
