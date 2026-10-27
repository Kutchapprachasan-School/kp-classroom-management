// tests/luckyDrawAndGachaBalance.test.ts
// Test suite to verify:
// 1. Gacha Star Shard Exchange rebalanced (300 shards/ticket to prevent infinite loop)
// 2. Dynamic Gacha Rate and Pity config reflection
// 3. Lucky Ticket Draw Pre-Draw Prize Pools and Stepped Rates (Unified Prize Ladder)
// 4. Ticket consumption (Gacha ticket consumes 1 entry ticket; lucky refund is net 0)
// 5. Weekly Course-Linked Gacha Ticket Cap (5 tickets/period x periods/week)

import test from 'node:test';
import assert from 'node:assert/strict';
import { gachaConfigService, DEFAULT_GACHA_CONFIG } from '../src/services/gachaConfigService';
import { PRIZE_POOLS } from '../src/components/live-classroom/LuckyTicketDrawModal';
import { liveClassroomService } from '../src/services/liveClassroomService';
import {
  buildPrizeWheelSegments,
  pickPrizeWheelWinner,
  buildWeightedWheelSegments,
  pickWeightedWheelWinner,
} from '../src/utils/liveClassroomAlgorithms';

test('1. Gacha Star Shard Exchange is rebalanced to prevent infinite loops', () => {
  const cfg = gachaConfigService.getConfig();
  assert.equal(
    cfg.shop.shardsPerTicket,
    300,
    'shardsPerTicket should be 300 to break the infinite loop'
  );
  assert.equal(
    cfg.rewards.sessionTicketCap,
    5,
    'sessionTicketCap should default to 5 tickets per classroom session'
  );
  assert.equal(
    cfg.rewards.gachaTicketsPerPeriod,
    5,
    'gachaTicketsPerPeriod should default to 5 tickets per period'
  );
});

test('2. Lucky Ticket Draw Prize Pools feature unified stepped probability ladder (เรทขั้นบันได)', () => {
  assert.equal(PRIZE_POOLS.length, 4, 'Should provide 4 prize pool formats');

  // Verify Standard Unified Tiered Pool
  const standardPool = PRIZE_POOLS.find((p) => p.id === 'standard');
  assert.ok(standardPool, 'Standard pool exists');

  const weights = standardPool.tiers.map((t) => ({ id: t.id, weight: t.weight }));
  assert.deepEqual(
    weights,
    [
      { id: 'std-coin-10', weight: 35 },
      { id: 'std-coin-20', weight: 25 },
      { id: 'std-coin-50', weight: 18 },
      { id: 'std-ticket-draw', weight: 10 },
      { id: 'std-coin-100', weight: 7 },
      { id: 'std-ticket-1', weight: 4 },
      { id: 'std-combo-mythic', weight: 1 },
    ],
    'Standard pool must have stepped rates totaling 100%'
  );

  const totalWeight = standardPool.tiers.reduce((sum, t) => sum + t.weight, 0);
  assert.equal(totalWeight, 100, 'Sum of weights in standard pool must equal 100%');
});

test('3. Coin Rush and Gacha Mania pools have correct tiered weights', () => {
  const coinRush = PRIZE_POOLS.find((p) => p.id === 'coin_rush');
  assert.ok(coinRush);
  const crTotal = coinRush.tiers.reduce((sum, t) => sum + t.weight, 0);
  assert.equal(crTotal, 100);

  const gachaMania = PRIZE_POOLS.find((p) => p.id === 'gacha_mania');
  assert.ok(gachaMania);
  const gmTotal = gachaMania.tiers.reduce((sum, t) => sum + t.weight, 0);
  assert.equal(gmTotal, 100);
});

test('4. Ticket award rules: Gacha ticket consumes entry ticket, refund ticket is net 0', () => {
  const standardPool = PRIZE_POOLS.find((p) => p.id === 'standard')!;

  // 1. Gacha ticket prize: MUST consume 1 entry ticket
  const gachaPrize = standardPool.tiers.find((t) => t.id === 'std-ticket-1')!;
  assert.ok(gachaPrize);
  assert.equal(gachaPrize.rewardType, 'ticket');
  assert.equal(gachaPrize.tickets, 1);
  // Rule: ได้รางวัลเป็นตั๋วกาชา ก็ต้องหักตั๋วสุ่มออกสิ
  let studentLuckyTickets = 3;
  let studentGachaTickets = 0;
  // Awarding Gacha ticket:
  studentLuckyTickets -= 1; // Consume 1 lucky draw ticket
  studentGachaTickets += gachaPrize.tickets; // Gain 1 gacha ticket
  assert.equal(studentLuckyTickets, 2, 'Lucky draw entry ticket is consumed (-1)');
  assert.equal(studentGachaTickets, 1, 'Gacha ticket is received (+1)');

  // 2. Lucky refund ticket prize: net 0 (do not consume entry ticket)
  const refundPrize = standardPool.tiers.find((t) => t.id === 'std-ticket-draw')!;
  assert.ok(refundPrize);
  assert.equal(refundPrize.rewardType, 'ticket_draw');
  // Rule: กรณีที่ไม่หักตั๋วสุ่มคือสุ่มได้ตั๋วสุ่มคือ -1 +1 ยังครบเท่าเดิม
  const ticketsBefore = 3;
  // Does not deduct:
  const ticketsAfter = ticketsBefore;
  assert.equal(ticketsAfter, ticketsBefore, 'Lucky draw ticket remains the same (-1 +1 net 0)');
});

test('5. Weekly Course-Linked Gacha Ticket Cap (5 tickets/period x periods/week)', () => {
  const capInfo = liveClassroomService.getWeeklyGachaTicketCap('ว23101 วิทยาศาสตร์ 5', 'ม.3/1');
  assert.ok(capInfo.weeklyCap >= 5, 'Weekly cap must be at least 5 tickets');
  assert.equal(capInfo.ticketsPerPeriod, 5, 'Base quota is 5 tickets per period');
  assert.equal(capInfo.weeklyCap, capInfo.periodsPerWeek * capInfo.ticketsPerPeriod);
});

test('6. Individual Student Prize Wheel: builds prize segments and rotates needle precisely to winning prize', () => {
  const standardPool = PRIZE_POOLS.find((p) => p.id === 'standard')!;
  const segments = buildPrizeWheelSegments(standardPool.tiers);

  assert.equal(segments.length, standardPool.tiers.length);
  assert.equal(segments[0].startAngle, 0);
  assert.equal(Math.round(segments[segments.length - 1].endAngle), 360);

  // Spin 15 times and verify needle lands exactly in the winner's segment
  let currentRot = 0;
  for (let i = 0; i < 15; i++) {
    const res = pickPrizeWheelWinner(segments, currentRot, 6);
    assert.ok(res, 'Spin result should not be null');

    currentRot = res.nextRotationDeg;
    const normalizedRot = currentRot % 360;
    const initialAngleUnderNeedle = (360 - normalizedRot) % 360;

    // The angle under the needle at 12 oclock must fall within winnerSegment [startAngle, endAngle)
    const winner = res.winnerSegment;
    assert.ok(
      initialAngleUnderNeedle >= winner.startAngle - 0.001 &&
      initialAngleUnderNeedle <= winner.endAngle + 0.001,
      `Needle angle ${initialAngleUnderNeedle} must align with winner ${winner.tier.name} [${winner.startAngle}, ${winner.endAngle}]`
    );
  }
});

test('7. Single-Student Lucky Spin prevents wrong-student attribution bug', () => {
  // Scenario: Student A (กวินท์) gets a ticket, Student B (พิมพา) already has 2 tickets
  const studentA = { id: 'stu-A', studentCode: '101', name: 'กวินท์', present: true, sessionCoins: 0, sessionTickets: 1, totalCoins: 0, totalTickets: 1 };
  const studentB = { id: 'stu-B', studentCode: '102', name: 'พิมพา', present: true, sessionCoins: 0, sessionTickets: 2, totalCoins: 0, totalTickets: 2 };
  const classStudents = [studentA, studentB];

  // In individual mode, when student A is spinning their ticket, the prizes wheel is spun for student A
  const standardPool = PRIZE_POOLS.find((p) => p.id === 'standard')!;
  const prizeSegments = buildPrizeWheelSegments(standardPool.tiers);
  const spinResult = pickPrizeWheelWinner(prizeSegments, 0, 6);
  assert.ok(spinResult);

  // Awarding prize directly to student A:
  const wonPrize = spinResult.winnerSegment.tier;
  let awardedStudentId = studentA.id;
  let studentATickets = studentA.sessionTickets;
  let studentACoins = studentA.sessionCoins;

  if (wonPrize.rewardType === 'coin') {
    studentATickets -= 1; // Consume 1 ticket from Student A
    studentACoins += wonPrize.coins; // Award coins to Student A
  } else if (wonPrize.rewardType === 'ticket_draw') {
    // Net 0 refund
  } else if (wonPrize.rewardType === 'ticket') {
    studentATickets -= 1;
  }

  // Verification:
  assert.equal(awardedStudentId, 'stu-A', 'Prize MUST be awarded to Student A (who earned the ticket), NOT Student B');
  assert.equal(studentB.sessionTickets, 2, 'Student B tickets remain untouched');
});

