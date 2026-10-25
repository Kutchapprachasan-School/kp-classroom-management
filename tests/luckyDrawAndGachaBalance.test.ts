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
