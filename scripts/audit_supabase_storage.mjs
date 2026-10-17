import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ngzflajpifmsvhldhviu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Listing all storage buckets in Supabase...');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error('Error listing buckets:', bErr);
    return;
  }

  console.log(`Found ${buckets.length} bucket(s):`);
  for (const b of buckets) {
    console.log(`\nBucket: "${b.name}" (id: ${b.id}, public: ${b.public})`);
    
    // List files in bucket (root and subdirectories)
    async function listRecursive(folder = '') {
      const { data: files, error: fErr } = await supabase.storage.from(b.name).list(folder, { limit: 100 });
      if (fErr) {
        console.error(`  Error listing folder "${folder}":`, fErr.message);
        return [];
      }
      let allFiles = [];
      for (const item of files || []) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        if (item.id === null) {
          // It's a folder
          const sub = await listRecursive(itemPath);
          allFiles.push(...sub);
        } else {
          allFiles.push({ path: itemPath, size: item.metadata?.size || 0, mimeType: item.metadata?.mimetype });
        }
      }
      return allFiles;
    }

    const files = await listRecursive();
    console.log(`  Total files: ${files.length}`);
    let totalSize = 0;
    for (const f of files) {
      totalSize += f.size;
    }
    console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    if (files.length > 0) {
      console.log(`  Sample files:`);
      for (const f of files.slice(0, 10)) {
        console.log(`    - ${f.path} (${(f.size / 1024).toFixed(1)} KB)`);
      }
    }
  }
}

main().catch(console.error);
