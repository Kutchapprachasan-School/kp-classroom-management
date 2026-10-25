// tests/goldQuestArena.test.ts
// Unit Tests สำหรับระบบ Gold Quest Arena และ goldQuestService
// ตรวจสอบความถูกต้องของการเปิดห้อง, รหัส PIN 6 หลัก, การเข้าร่วม, ตอบคำถาม, ขโมยทอง, สลับทอง และจบการสอบ

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { goldQuestService } from '../src/services/goldQuestService';

describe('Gold Quest Arena & Service Suite', () => {
  const testRoomId = `test_room_${Date.now()}`;
  const testPin = '849201';
  const testTitle = 'ทดสอบข้อสอบปลายภาคภาษาญี่ปุ่น';

  it('1. ควรเปิดห้องสอบสดและสร้างรหัส PIN 6 หลักอย่างถูกต้อง', () => {
    const room = goldQuestService.startRoom({
      roomId: testRoomId,
      pin: testPin,
      examTitle: testTitle,
      students: [
        { id: 'stu-1', name: 'สมชาย ใจกล้า', avatar: '⚔️' },
        { id: 'stu-2', name: 'สมหญิง จริงใจ', avatar: '🧙‍♂️' },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'あ อ่านว่าอะไร?',
          options: ['อะ', 'อิ', 'อุ', 'เอะ'],
          correctIndex: 0,
        },
      ],
    });

    assert.strictEqual(room.roomId, testRoomId);
    assert.strictEqual(room.pin, testPin);
    assert.strictEqual(room.isActive, true);
    assert.strictEqual(room.status, 'active');
    assert.strictEqual(room.students.length, 2);
    assert.strictEqual(room.questions.length, 1);
  });

  it('2. ควรค้นหาห้องสอบด้วย roomId หรือ PIN ได้ถูกต้อง', () => {
    const roomByPin = goldQuestService.findRoom(undefined, testPin);
    assert.ok(roomByPin, 'ต้องค้นหาห้องด้วย PIN ได้');
    assert.strictEqual(roomByPin?.roomId, testRoomId);

    const roomById = goldQuestService.findRoom(testRoomId);
    assert.ok(roomById, 'ต้องค้นหาห้องด้วย roomId ได้');
    assert.strictEqual(roomById?.pin, testPin);
  });

  it('3. นักเรียนสามารถเข้าร่วมห้องสอบด้วย PIN และเปลี่ยนอวตารได้', () => {
    // 3.1 นักเรียนเดิมที่อยู่ในห้อง
    const joinResult1 = goldQuestService.joinRoom({
      roomId: testRoomId,
      pin: testPin,
      student: { id: 'stu-1', name: 'สมชาย ใจกล้า', avatar: '🦊' },
    });

    assert.strictEqual(joinResult1.success, true);
    assert.strictEqual(joinResult1.student?.avatar, '🦊');
    assert.strictEqual(joinResult1.student?.isJoined, true);

    // 3.2 นักเรียนใหม่ที่ไม่ได้มีในรายชื่อเริ่มต้น
    const joinResult2 = goldQuestService.joinRoom({
      roomId: testRoomId,
      pin: testPin,
      student: { id: 'stu-3', name: 'มานะ อดทน', avatar: '🐉' },
    });

    assert.strictEqual(joinResult2.success, true);
    assert.strictEqual(joinResult2.student?.name, 'มานะ อดทน');
    assert.strictEqual(joinResult2.room?.students.length, 3);
  });

  it('4. การส่งคำตอบที่ถูกต้องควรเพิ่ม streak และบวกคะแนนทองคำ', () => {
    const ansResult = goldQuestService.submitAnswer({
      roomId: testRoomId,
      pin: testPin,
      studentId: 'stu-1',
      isCorrect: true,
      goldDelta: 150,
      chestLog: '🎁 สมชาย ใจกล้า เปิดหีบสมบัติ ได้รับ +150 ทองคำ!',
    });

    assert.strictEqual(ansResult.success, true);
    assert.strictEqual(ansResult.student?.gold, 150);
    assert.strictEqual(ansResult.student?.correctCount, 1);
    assert.strictEqual(ansResult.student?.streak, 1);
  });

  it('5. การตอบผิดควรหยุด streak เป็น 0 และไม่เพิ่มทองคำ', () => {
    const ansResult = goldQuestService.submitAnswer({
      roomId: testRoomId,
      pin: testPin,
      studentId: 'stu-1',
      isCorrect: false,
    });

    assert.strictEqual(ansResult.success, true);
    assert.strictEqual(ansResult.student?.gold, 150, 'ทองคำต้องเท่าเดิม');
    assert.strictEqual(ansResult.student?.wrongCount, 1);
    assert.strictEqual(ansResult.student?.streak, 0, 'Streak ต้องถูกรีเซ็ตเป็น 0');
  });

  it('6. สกิลขโมยทอง (Steal) และสลับทอง (Swap) ทำงานได้อย่างถูกต้อง', () => {
    // ให้ stu-2 มีทองก่อน 200 G
    goldQuestService.submitAnswer({
      roomId: testRoomId,
      pin: testPin,
      studentId: 'stu-2',
      isCorrect: true,
      goldDelta: 200,
    });

    // stu-1 ขโมยทองจาก stu-2 จำนวน 50 G
    const stealResult = goldQuestService.stealOrSwap({
      roomId: testRoomId,
      pin: testPin,
      actorId: 'stu-1',
      targetId: 'stu-2',
      effectType: 'STEAL',
      amount: 50,
    });

    assert.strictEqual(stealResult.success, true);
    const stu1 = stealResult.room?.students.find((s) => s.id === 'stu-1');
    const stu2 = stealResult.room?.students.find((s) => s.id === 'stu-2');

    assert.strictEqual(stu1?.gold, 200, 'stu-1 เดิม 150 ขโมยมา 50 ต้องเป็น 200 G');
    assert.strictEqual(stu2?.gold, 150, 'stu-2 เดิม 200 ถูกขโมย 50 ต้องเหลือ 150 G');

    // stu-3 มีทอง 0 G สลับกระเป๋าทองกับ stu-1 ที่มี 200 G
    const swapResult = goldQuestService.stealOrSwap({
      roomId: testRoomId,
      pin: testPin,
      actorId: 'stu-3',
      targetId: 'stu-1',
      effectType: 'SWAP',
    });

    assert.strictEqual(swapResult.success, true);
    const stu3After = swapResult.room?.students.find((s) => s.id === 'stu-3');
    const stu1After = swapResult.room?.students.find((s) => s.id === 'stu-1');

    assert.strictEqual(stu3After?.gold, 200, 'stu-3 สลับทองกับ stu-1 ต้องได้ 200 G');
    assert.strictEqual(stu1After?.gold, 0, 'stu-1 สลับทองกับ stu-3 ต้องเหลือ 0 G');
  });

  it('7. การจบการแข่งขัน (End Room) ต้องเปลี่ยนสถานะเป็น ended และบันทึกประวัติ', () => {
    const endedRoom = goldQuestService.endRoom(testRoomId, testPin);

    assert.ok(endedRoom);
    assert.strictEqual(endedRoom?.isActive, false);
    assert.strictEqual(endedRoom?.status, 'ended');
    assert.ok(endedRoom?.logs[0].message.includes('จบการสอบ'));

    // ไม่อนุญาตให้นักเรียนใหม่เข้าห้องที่จบไปแล้ว
    const rejectJoin = goldQuestService.joinRoom({
      roomId: testRoomId,
      pin: testPin,
      student: { name: 'ใครบางคน' },
    });
    assert.strictEqual(rejectJoin.success, false);
  });

  it('8. API Route /api/live-classroom/gold-quest/join ค้นหาห้องด้วย PIN และคืนค่ารายชื่อนักเรียน', async () => {
    const { GET } = await import('../app/api/live-classroom/gold-quest/join/route');

    const globalForGoldQuest = globalThis as unknown as {
      goldQuestRooms?: Map<string, any>;
    };
    if (!globalForGoldQuest.goldQuestRooms) {
      globalForGoldQuest.goldQuestRooms = new Map();
    }
    const apiPin = '918273';
    globalForGoldQuest.goldQuestRooms.set('room-api-test', {
      roomId: 'room-api-test',
      pin: apiPin,
      examTitle: 'ควิซภาษาญี่ปุ่นรายคาบ',
      isActive: true,
      status: 'active',
      students: [
        { id: 'st-1', name: 'กิตติพงษ์' },
        { id: 'st-2', name: 'กานดา' },
      ],
    });

    const req = new Request(`https://localhost/api/live-classroom/gold-quest/join?pin=${apiPin}`);
    const res = await GET(req);
    assert.strictEqual(res.status, 200);

    const json = (await res.json()) as any;
    assert.strictEqual(json.roomId, 'room-api-test');
    assert.strictEqual(json.pin, apiPin);
    assert.strictEqual(json.students.length, 2);
    assert.strictEqual(json.students[0].number, 1);
    assert.strictEqual(json.students[0].name, 'กิตติพงษ์');
  });
});
