import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://ngzflajpifmsvhldhviu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const LOCAL_STORAGE_BACKUP = path.resolve('backups/storage_data1');

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
        const subFiles = await getAllFiles(bucket, fullPath);
        all.push(...subFiles);
      } else {
        all.push({
          path: fullPath,
          size: item.metadata?.size || 0,
        });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  console.log('=== SUPABASE STORAGE FULL BACKUP ===');
  console.log(`Destination folder: ${LOCAL_STORAGE_BACKUP}`);
  if (!fs.existsSync(LOCAL_STORAGE_BACKUP)) {
    fs.mkdirSync(LOCAL_STORAGE_BACKUP, { recursive: true });
  }

  const allFiles = await getAllFiles('data1');
  console.log(`Found ${allFiles.length} files in bucket "data1". Downloading...`);

  let downloadedCount = 0;
  let totalBytesDownloaded = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const targetFilePath = path.join(LOCAL_STORAGE_BACKUP, file.path);
    const targetDir = path.dirname(targetFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    process.stdout.write(`[${i + 1}/${allFiles.length}] Downloading "${file.path}"... `);

    const { data: blob, error } = await supabase.storage.from('data1').download(file.path);
    if (error) {
      console.log(`FAILED: ${error.message}`);
      continue;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetFilePath, buffer);
    downloadedCount++;
    totalBytesDownloaded += buffer.length;
    console.log(`✅ (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\n🎉 STORAGE BACKUP COMPLETED!`);
  console.log(`Total Files Downloaded: ${downloadedCount}/${allFiles.length}`);
  console.log(`Total Size: ${(totalBytesDownloaded / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved locally at: ${LOCAL_STORAGE_BACKUP}`);
}

main().catch(console.error);
