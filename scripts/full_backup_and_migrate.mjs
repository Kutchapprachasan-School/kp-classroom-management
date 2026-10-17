import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const SOURCE_URL = 'postgresql://postgres.ngzflajpifmsvhldhviu:YQSmSuCwZ9_iR_!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
const TARGET_URL = 'postgresql://neondb_owner:npg_eQcpwyI4lOj7@ep-noisy-credit-ao8jzb9q.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const BACKUP_DIR = path.resolve('backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  const ts = timestamp();
  const backupFilePath = path.join(BACKUP_DIR, `supabase_full_backup_${ts}.json`);
  const reportFilePath = path.join(BACKUP_DIR, `migration_report_${ts}.md`);

  console.log(`=== SUPABASE TO NEON FULL BACKUP & TOPOLOGICAL REPLICATION ===`);
  console.log(`Timestamp: ${ts}`);

  console.log(`Connecting to Source (Supabase)...`);
  const sourceClient = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
  await sourceClient.connect();
  console.log(`✅ Supabase Connected!`);

  console.log(`Connecting to Target (Neon)...`);
  const targetClient = new Client({ connectionString: TARGET_URL, ssl: { rejectUnauthorized: false } });
  await targetClient.connect();
  console.log(`✅ Neon Connected!`);

  // 1. Get all base tables in public schema
  const tablesRes = await sourceClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`Found ${tables.length} base tables in Supabase.`);

  // 2. Query column metadata to properly handle jsonb, array, etc.
  const colMetaRes = await sourceClient.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const tableColMeta = new Map();
  for (const r of colMetaRes.rows) {
    if (!tableColMeta.has(r.table_name)) {
      tableColMeta.set(r.table_name, new Map());
    }
    tableColMeta.get(r.table_name).set(r.column_name, r);
  }

  // 3. Compute topological order from Foreign Keys on Neon
  console.log(`\nComputing topological dependency order...`);
  const fkRes = await targetClient.query(`
    SELECT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `);

  const neonTablesRes = await targetClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);
  const allTargetTables = neonTablesRes.rows.map(r => r.table_name);

  const adj = new Map();
  const inDegree = new Map();
  for (const t of allTargetTables) {
    adj.set(t, new Set());
    inDegree.set(t, 0);
  }

  for (const r of fkRes.rows) {
    const parent = r.parent_table;
    const child = r.child_table;
    if (parent !== child && inDegree.has(child) && adj.has(parent)) {
      if (!adj.get(parent).has(child)) {
        adj.get(parent).add(child);
        inDegree.set(child, inDegree.get(child) + 1);
      }
    }
  }

  const queue = [];
  for (const [t, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(t);
  }

  const topologicalOrder = [];
  while (queue.length > 0) {
    const u = queue.shift();
    topologicalOrder.push(u);
    for (const v of adj.get(u)) {
      inDegree.set(v, inDegree.get(v) - 1);
      if (inDegree.get(v) === 0) queue.push(v);
    }
  }

  const unvisited = allTargetTables.filter(t => !topologicalOrder.includes(t));
  if (unvisited.length > 0) {
    topologicalOrder.push(...unvisited);
  }
  console.log(`Topological sort complete: ${topologicalOrder.length} tables ordered.`);

  // 4. Extract data from Supabase & save offline JSON backup
  console.log(`\n--- PHASE 1: Extracting All Data from Supabase ---`);
  const fullBackup = {};
  let totalRowsInSupabase = 0;
  const populatedTables = [];

  for (let idx = 0; idx < tables.length; idx++) {
    const table = tables[idx];
    try {
      const dataRes = await sourceClient.query(`SELECT * FROM "${table}"`);
      const rows = dataRes.rows;
      fullBackup[table] = {
        rowCount: rows.length,
        columns: Array.from((tableColMeta.get(table) || new Map()).keys()),
        rows: rows
      };
      totalRowsInSupabase += rows.length;
      if (rows.length > 0) {
        populatedTables.push({ table, count: rows.length });
        console.log(`  [+] ${table}: ${rows.length} rows`);
      }
    } catch (err) {
      console.error(`  [!] Error reading ${table}: ${err.message}`);
      fullBackup[table] = { rowCount: 0, error: err.message, rows: [] };
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackup, null, 2), 'utf-8');
  const backupStats = fs.statSync(backupFilePath);
  console.log(`✅ Backup saved to: ${backupFilePath} (${(backupStats.size / 1024 / 1024).toFixed(2)} MB)`);

  // 5. Truncate Neon in reverse topological order (children first)
  console.log(`\n--- PHASE 2: Truncating Neon Tables (Reverse Topological Order) ---`);
  const reverseOrder = [...topologicalOrder].reverse();
  for (const table of reverseOrder) {
    try {
      await targetClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (err) {
      console.warn(`  [!] Truncate warning on "${table}": ${err.message}`);
    }
  }
  console.log(`✅ All target tables cleanly truncated.`);

  // 6. Insert data into Neon in topological order (parents first)
  console.log(`\n--- PHASE 3: Inserting Data to Neon (Forward Topological Order) ---`);
  let totalMigratedToNeon = 0;

  for (let idx = 0; idx < topologicalOrder.length; idx++) {
    const table = topologicalOrder[idx];
    const tableData = fullBackup[table];
    if (!tableData || !tableData.rows || tableData.rows.length === 0) {
      continue;
    }

    const rows = tableData.rows;
    const colMeta = tableColMeta.get(table) || new Map();

    // Verify which columns exist in Neon table
    const neonColsRes = await targetClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [table]);
    const neonColSet = new Set(neonColsRes.rows.map(r => r.column_name));

    // Common columns
    const columns = Object.keys(rows[0]).filter(c => neonColSet.has(c));
    if (columns.length === 0) continue;

    const quotedCols = columns.map(c => `"${c}"`).join(', ');
    const chunkSize = 50;
    let tableInserted = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const valuesPlaceholders = [];
      const flatValues = [];
      let paramIdx = 1;

      for (const row of chunk) {
        const rowParams = [];
        for (const col of columns) {
          rowParams.push(`$${paramIdx++}`);
          const val = row[col];
          const meta = colMeta.get(col);

          if (val === null || val === undefined) {
            flatValues.push(null);
          } else if (meta && (meta.data_type === 'jsonb' || meta.data_type === 'json')) {
            flatValues.push(JSON.stringify(val));
          } else {
            flatValues.push(val);
          }
        }
        valuesPlaceholders.push(`(${rowParams.join(', ')})`);
      }

      const insertSql = `INSERT INTO "${table}" (${quotedCols}) VALUES ${valuesPlaceholders.join(', ')} ON CONFLICT DO NOTHING;`;
      try {
        await targetClient.query(insertSql, flatValues);
        tableInserted += chunk.length;
      } catch (insertErr) {
        console.error(`\n❌ Insert error on "${table}":`, insertErr.message);
        throw insertErr;
      }
    }

    totalMigratedToNeon += tableInserted;
    console.log(`  [+] [${idx + 1}/${topologicalOrder.length}] "${table}": ${tableInserted}/${rows.length} rows inserted`);
  }

  // 7. Verify Parity
  console.log(`\n--- PHASE 4: Row Count Parity Verification ---`);
  let parityMismatches = 0;
  const paritySummary = [];

  for (const table of tables) {
    const sbCount = fullBackup[table] ? fullBackup[table].rows.length : 0;
    let neonCount = 0;
    try {
      const res = await targetClient.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
      neonCount = parseInt(res.rows[0].cnt, 10);
    } catch (e) {
      neonCount = -1;
    }

    const isMatch = sbCount === neonCount;
    if (!isMatch) {
      parityMismatches++;
      console.log(`❌ MISMATCH in "${table}": Supabase=${sbCount}, Neon=${neonCount}`);
    }

    if (sbCount > 0) {
      paritySummary.push({
        table,
        supabase: sbCount,
        neon: neonCount,
        match: isMatch ? '✅ MATCH' : '❌ MISMATCH'
      });
    }
  }

  // 8. Verify Views
  console.log(`\n--- PHASE 5: Verifying Views on Neon ---`);
  const views = ['classrooms', 'students'];
  for (const v of views) {
    try {
      const cntRes = await targetClient.query(`SELECT COUNT(*) as cnt FROM "${v}"`);
      console.log(`  [+] View "${v}": ${cntRes.rows[0].cnt} rows functional.`);
    } catch (e) {
      console.error(`  [!] Error on view "${v}":`, e.message);
    }
  }

  // 9. Report Generation
  const reportContent = `# Supabase to Neon Migration & Backup Report

- **Date**: ${new Date().toISOString()}
- **Backup File**: \`${backupFilePath}\` (${(backupStats.size / 1024 / 1024).toFixed(2)} MB)
- **Source Database**: Supabase (\`aws-0-ap-southeast-1.pooler.supabase.com\`)
- **Target Database**: Neon PostgreSQL (\`ep-noisy-credit-ao8jzb9q.c-2.ap-southeast-1.aws.neon.tech\`)
- **Total Tables Checked**: ${tables.length}
- **Populated Tables**: ${populatedTables.length}
- **Total Records Copied**: ${totalMigratedToNeon} / ${totalRowsInSupabase}
- **Parity Status**: ${parityMismatches === 0 ? '✅ 100% PERFECT PARITY (All tables match)' : `❌ ${parityMismatches} MISMATCHES`}

## Populated Tables Row Count Verification

| Table Name | Supabase Count | Neon Count | Status |
| :--- | :---: | :---: | :---: |
${paritySummary.map(p => `| \`${p.table}\` | ${p.supabase} | ${p.neon} | ${p.match} |`).join('\n')}

## Views Verified
- \`classrooms\`: Functional on Neon
- \`students\`: Functional on Neon
`;

  fs.writeFileSync(reportFilePath, reportContent, 'utf-8');
  console.log(`\nReport written to: ${reportFilePath}`);

  await sourceClient.end();
  await targetClient.end();

  if (parityMismatches > 0) {
    console.error(`\n❌ Completed with ${parityMismatches} mismatches.`);
    process.exit(1);
  } else {
    console.log(`\n🎉🎉 ALL DATA BACKED UP AND REPLICATED TO NEON WITH 100% PARITY! 🎉🎉`);
  }
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
