// test_cloud_sync_persistence.mjs
// Automated verification of Remote Cloud Persistence & Cross-Device Sync
// Confirms that data is saved in Supabase PostgreSQL (public.kps_cloud_store)
// and is restored when switching devices (Device B gets Device A's data).

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';

// Auto-spawn under tsx if run with plain node
const isTsx = process.execArgv.some((a) => a.includes('tsx')) || process.env.TSX_RUNNER === '1';
if (!isTsx) {
  const result = spawnSync('npx', ['tsx', './test_cloud_sync_persistence.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, TSX_RUNNER: '1' },
    shell: true,
  });
  process.exit(result.status ?? 0);
}

// 1. Setup Mock DOM Environment for Device A
const deviceAStore = new Map();
const customEventListeners = new Map();

global.window = {
  localStorage: {
    getItem: (key) => deviceAStore.get(key) ?? null,
    setItem: (key, val) => deviceAStore.set(key, String(val)),
    removeItem: (key) => deviceAStore.delete(key),
    clear: () => deviceAStore.clear(),
  },
  dispatchEvent: (event) => {
    const list = customEventListeners.get(event.type) || [];
    list.forEach((cb) => cb(event));
    return true;
  },
  addEventListener: (type, cb) => {
    if (!customEventListeners.has(type)) customEventListeners.set(type, []);
    customEventListeners.get(type).push(cb);
  },
  removeEventListener: (type, cb) => {
    const list = customEventListeners.get(type) || [];
    customEventListeners.set(type, list.filter((f) => f !== cb));
  },
};
global.localStorage = global.window.localStorage;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTING CLOUD PERSISTENCE & CROSS-DEVICE SYNC');
  console.log('======================================================\n');

  const { supabase, isSupabaseConfigured } = await import('./src/lib/supabase.ts');
  const { cloudDataService } = await import('./src/services/cloudDataService.ts');
  const { createUniversalAdapter } = await import('./src/lib/universalAdapter.ts');

  assert.ok(isSupabaseConfigured, 'Supabase MUST be configured for cloud persistence');
  console.log('✅ Supabase Client is configured and connected to remote PostgreSQL');

  // Test 1: Direct Save on Device A
  console.log('\n--- Test 1: Device A saves key to Cloud ---');
  const testKey = 'kp_test_multidevice_sync_record';
  const testPayload = {
    schoolName: 'โรงเรียนกุดจับประชาสรรค์',
    term: '1/2569',
    updatedBy: 'ครูปัญจพล',
    timestamp: new Date().toISOString(),
    items: [
      { id: 1, title: 'ส่งผลการเรียน ปพ.5' },
      { id: 2, title: 'บันทึกเวลาเรียนรายวิชา' },
    ],
  };

  await cloudDataService.saveCloudKey(testKey, testPayload);
  console.log('✅ Device A successfully executed saveCloudKey');

  // Verify in local cache of Device A
  assert.strictEqual(
    deviceAStore.has(testKey),
    true,
    'Device A local storage should have the saved key'
  );

  // Test 2: Directly inspect Supabase PostgreSQL database
  console.log('\n--- Test 2: Verify Supabase remote PostgreSQL database directly ---');
  const { data: remoteData, error: remoteError } = await supabase
    .from('kps_cloud_store')
    .select('*')
    .eq('key', testKey)
    .maybeSingle();

  assert.ifError(remoteError);
  assert.ok(remoteData, 'Record must exist in Supabase remote table kps_cloud_store');
  assert.strictEqual(remoteData.key, testKey);
  assert.deepStrictEqual(remoteData.data.schoolName, testPayload.schoolName);
  assert.strictEqual(remoteData.data.items.length, 2);
  console.log('✅ Remote Supabase PostgreSQL verified! Record is safely stored in cloud database:');
  console.log(`   Key: ${remoteData.key}`);
  console.log(`   Updated At: ${remoteData.updated_at}`);
  console.log(`   Data School: ${remoteData.data.schoolName}`);

  // Test 3: Simulate Device B (Switching devices!)
  console.log('\n--- Test 3: Simulate Device B (New phone / iPad with 0 local data) ---');
  const deviceBStore = new Map();
  // Switch global.window to Device B
  global.window.localStorage = {
    getItem: (key) => deviceBStore.get(key) ?? null,
    setItem: (key, val) => deviceBStore.set(key, String(val)),
    removeItem: (key) => deviceBStore.delete(key),
    clear: () => deviceBStore.clear(),
  };
  global.localStorage = global.window.localStorage;

  assert.strictEqual(deviceBStore.size, 0, 'Device B must start completely blank with 0 local items');

  // Device B fetches all cloud data from Supabase
  const hydrated = await cloudDataService.fetchAllCloudData();
  assert.ok(hydrated[testKey], 'Device B must receive the cloud data stored by Device A');
  assert.strictEqual(hydrated[testKey].schoolName, testPayload.schoolName);
  assert.strictEqual(
    deviceBStore.has(testKey),
    true,
    'Device B local storage must be automatically hydrated from Cloud'
  );
  console.log('✅ Switching Devices Verified! Device B successfully restored all data from Cloud:');
  console.log(`   Total Cloud Records Hydrated: ${Object.keys(hydrated).length}`);
  console.log(`   Device B Local Key Restored: ${testKey}`);

  // Test 4: Universal Adapter Cloud Fallback
  console.log('\n--- Test 4: Verify Universal Adapter Cloud Fallback for non-table models ---');
  const courseAdapter = createUniversalAdapter({
    entityName: 'DummyCourse',
    storageKey: 'kp_test_dummy_courses_cloud',
    tableName: 'non_existent_table_dummy_courses', // Will fallback to kps_cloud_store
    defaultData: [],
  });

  const created = await courseAdapter.upsert({
    id: 'course-101',
    name: 'ภาษาญี่ปุ่น ม.3',
  });
  assert.strictEqual(created.id, 'course-101');

  // Verify it reached kps_cloud_store
  const { data: cloudAdapterRow } = await supabase
    .from('kps_cloud_store')
    .select('*')
    .eq('key', 'kp_test_dummy_courses_cloud')
    .maybeSingle();

  assert.ok(cloudAdapterRow, 'Universal adapter must persist array to kps_cloud_store when dedicated table does not exist');
  console.log('✅ Universal Adapter correctly falls back to kps_cloud_store in Supabase');

  // Clean up test keys from cloud
  console.log('\n--- Cleaning up test records ---');
  await supabase.from('kps_cloud_store').delete().in('key', [testKey, 'kp_test_dummy_courses_cloud']);
  console.log('✅ Test keys cleaned up from Supabase');

  console.log('\n======================================================');
  console.log('🎉 ALL CLOUD PERSISTENCE & CROSS-DEVICE TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
