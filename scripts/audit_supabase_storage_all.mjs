import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ngzflajpifmsvhldhviu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllFiles(bucket, prefix = '') {
  let all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error || !data || data.length === 0) break;
    
    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // folder
        const subFiles = await getAllFiles(bucket, fullPath);
        all.push(...subFiles);
      } else {
        all.push({
          path: fullPath,
          size: item.metadata?.size || 0,
          updated_at: item.updated_at
        });
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  const rootItems = await supabase.storage.from('data1').list('', { limit: 100 });
  console.log('Root folders/items in data1:', rootItems.data?.map(i => `${i.name} (isFolder: ${i.id === null})`));

  const allFiles = await getAllFiles('data1');
  console.log(`\nTotal all files across all folders in data1: ${allFiles.length}`);
  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
  console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  // Group by root directory
  const byFolder = {};
  for (const f of allFiles) {
    const root = f.path.split('/')[0];
    byFolder[root] = (byFolder[root] || 0) + 1;
  }
  console.log('Files by top folder:', byFolder);
}

main().catch(console.error);
