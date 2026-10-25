// tests/runningRaceEngine.test.ts
// Unit Tests สำหรับฟิสิกส์การวิ่งแข่ง 2.0 (Virtual 2,400px World & Dynamic Camera Engine)

import assert from 'node:assert/strict';
import {
  WORLD_TRACK_LENGTH,
  START_WORLD_X,
  FINISH_WORLD_X,
  MIN_LANE_HEIGHT_PX,
  getTrackDistanceMarkers,
  computeRunnerProgress,
  computeRunnerWorldX,
  computeNextCameraX,
  worldToScreenX,
  calculateHarmonicProgress,
} from '../src/utils/racePhysicsEngine';

function runRaceEngineV2Tests() {
  console.log('🏃💨 Running Race 2.0 Physics Engine Tests...');

  // 1. ความยาวสนามโลกเสมือนต้องเท่ากับ 2,400px และความสูงลู่ขั้นต่ำต้องไม่ต่ำกว่า 50px บนมือถือ
  assert.equal(WORLD_TRACK_LENGTH, 2400, 'WORLD_TRACK_LENGTH must be 2400');
  assert.ok(
    FINISH_WORLD_X - START_WORLD_X >= 2000,
    'Sprint distance must be >= 2000px for thrilling 100m experience'
  );
  assert.ok(
    MIN_LANE_HEIGHT_PX >= 50,
    `MIN_LANE_HEIGHT_PX must be >= 50px to prevent squashing (got ${MIN_LANE_HEIGHT_PX})`
  );

  // 2. ป้ายบอกระยะทางต้องครบตั้งแต่ 0m (START) ถึง 100m (FINISH) ทุกๆ 10 เมตร
  const markers = getTrackDistanceMarkers();
  assert.equal(markers.length, 11, 'Must have 11 markers (0m to 100m every 10m)');
  assert.equal(markers[0].meters, 0);
  assert.equal(markers[0].worldX, START_WORLD_X);
  assert.equal(markers[10].meters, 100);
  assert.equal(markers[10].worldX, FINISH_WORLD_X);

  // 3. กล้องระยะที่ 1 (Start Phase) ต้องตรึงอยู่ใกล้จุดสตาร์ต (CameraX = 0) เมื่อเพิ่งปล่อยตัว
  const camX = computeNextCameraX(0, START_WORLD_X + 30, 360);
  assert.equal(camX, 0, 'Camera must stay at 0 during start phase');

  // 4. กล้องระยะที่ 2 (Mid-Sprint) บนจอมือถือ (360px) ต้องเลื่อนตามกลุ่มผู้นำอย่างนุ่มนวล
  const mobileViewportW = 360;
  const leaderWorldX = 1200; // วิ่งมาถึงครึ่งสนาม (50m)
  let cameraX = 0;

  for (let f = 0; f < 30; f++) {
    cameraX = computeNextCameraX(cameraX, leaderWorldX, mobileViewportW);
  }

  // ผู้นำต้องปรากฏอยู่บริเวณกลางหน้าจอมือถือ (~45% ของ 360px = ~162px)
  const leaderScreenX = worldToScreenX(leaderWorldX, cameraX);
  assert.ok(
    leaderScreenX > 140 && leaderScreenX < 185,
    `Leader screen X (${leaderScreenX}) should be around 45% of viewport (~162px)`
  );

  // 5. กล้องระยะที่ 3 (Final Dash) ต้องไม่เลื่อนเลยขอบสนามสูงสุด (WORLD_TRACK_LENGTH - viewportWidth)
  const viewportW = 800;
  const maxAllowedCamX = WORLD_TRACK_LENGTH - viewportW; // 1600px
  const finalCamX = computeNextCameraX(
    maxAllowedCamX,
    FINISH_WORLD_X + 50,
    viewportW,
    WORLD_TRACK_LENGTH,
    1
  );
  assert.ok(
    finalCamX <= maxAllowedCamX,
    `Camera X (${finalCamX}) must not exceed maxAllowedCamX (${maxAllowedCamX})`
  );

  // 6. ผู้ชนะอันดับ 1 ต้องแตะเส้นชัยที่พิกัด 2,250px ก่อนอันดับ 2 เสมอ (No Tie Bug)
  const p1 = computeRunnerProgress(6000, 6000, 0.06, -0.04, 0);
  const p2 = computeRunnerProgress(6000, 6155, 0.06, -0.04, 0.85);

  const worldX1 = computeRunnerWorldX(p1);
  const worldX2 = computeRunnerWorldX(p2);

  assert.ok(
    worldX1 >= FINISH_WORLD_X,
    `Winner worldX (${worldX1}) must reach or exceed finish line (${FINISH_WORLD_X})`
  );
  assert.ok(
    worldX2 < FINISH_WORLD_X,
    `Runner 2 worldX (${worldX2}) must still be before finish line (${FINISH_WORLD_X})`
  );

  // 7. Backward compatibility check
  assert.equal(calculateHarmonicProgress(0, 0, 0.1, 0.05, 1), 0);
  assert.equal(calculateHarmonicProgress(1, 0.9, 0.1, 0.05, 1), 1);

  console.log('✅ All Running Race 2.0 Physics Engine Tests Passed Successfully!\n');
}

runRaceEngineV2Tests();
