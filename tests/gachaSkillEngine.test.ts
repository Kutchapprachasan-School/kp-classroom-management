// tests/gachaSkillEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

if (typeof global.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    length: 0,
    key: () => null,
  } as any;
}

import { gachaSkillEngine } from '../src/services/gachaSkillEngine';
import { gachaService, ALL_BUDDIES } from '../src/services/gachaService';

describe('GachaSkillEngine Ecosystem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates active buffs with valid multipliers and labels', () => {
    gachaService.setActiveBuddy('buddy-c1');
    const buffs = gachaSkillEngine.getActiveBuffs();

    expect(buffs.buddy.id).toBe('buddy-c1');
    expect(buffs.xpMultiplier).toBeGreaterThanOrEqual(1.05);
    expect(buffs.coinMultiplier).toBeGreaterThanOrEqual(1.0);
    expect(buffs.activeEffectsLabels.length).toBeGreaterThan(0);
  });

  it('scales XP and Coin multipliers based on buddy rarity', () => {
    // Epic buddy
    const epicBuddy = ALL_BUDDIES.find((b) => b.rarity === 'EPIC') || ALL_BUDDIES[0];
    const state = gachaService.getState();
    if (!state.unlockedBuddyIds.includes(epicBuddy.id)) state.unlockedBuddyIds.push(epicBuddy.id);
    gachaService.saveState(state);

    gachaService.setActiveBuddy(epicBuddy.id);
    const epicBuffs = gachaSkillEngine.getActiveBuffs();

    expect(epicBuffs.xpMultiplier).toBe(1.25);
    expect(epicBuffs.coinMultiplier).toBe(1.20);
    expect(gachaSkillEngine.calculateEarnedXp(100)).toBe(125);
    expect(gachaSkillEngine.calculateEarnedCoins(100)).toBe(120);

    // Mythic buddy
    const mythicBuddy = ALL_BUDDIES.find((b) => b.rarity === 'MYTHIC') || ALL_BUDDIES[0];
    const state2 = gachaService.getState();
    if (!state2.unlockedBuddyIds.includes(mythicBuddy.id)) state2.unlockedBuddyIds.push(mythicBuddy.id);
    gachaService.saveState(state2);

    gachaService.setActiveBuddy(mythicBuddy.id);
    const mythicBuffs = gachaSkillEngine.getActiveBuffs();

    expect(mythicBuffs.xpMultiplier).toBe(1.50);
    expect(mythicBuffs.coinMultiplier).toBe(1.40);
    expect(gachaSkillEngine.calculateEarnedXp(100)).toBe(150);
    expect(gachaSkillEngine.calculateEarnedCoins(100)).toBe(140);
  });

  it('handles quiz hints consumption and replenishment', () => {
    const mythicBuddy = ALL_BUDDIES.find((b) => b.rarity === 'MYTHIC') || ALL_BUDDIES[0];
    const state = gachaService.getState();
    if (!state.unlockedBuddyIds.includes(mythicBuddy.id)) state.unlockedBuddyIds.push(mythicBuddy.id);
    gachaService.saveState(state);

    gachaService.setActiveBuddy(mythicBuddy.id);

    const initialBuffs = gachaSkillEngine.getActiveBuffs();
    expect(initialBuffs.quizHintAvailable).toBe(true);

    const consumed = gachaSkillEngine.consumeQuizHint();
    expect(consumed).toBe(true);

    const afterConsume = gachaSkillEngine.getActiveBuffs();
    expect(afterConsume.quizHintCharges).toBe(initialBuffs.quizHintCharges - 1);

    // Adding inventory quiz hint increases available charges
    const s = gachaService.getState();
    s.inventory.quizHint += 1;
    gachaService.saveState(s);
    const afterInventory = gachaSkillEngine.getActiveBuffs();
    expect(afterInventory.quizHintCharges).toBe(initialBuffs.quizHintCharges);
  });

  it('handles streak shield consumption correctly', () => {
    const mythicBuddy = ALL_BUDDIES.find((b) => b.rarity === 'MYTHIC') || ALL_BUDDIES[0];
    const state = gachaService.getState();
    if (!state.unlockedBuddyIds.includes(mythicBuddy.id)) state.unlockedBuddyIds.push(mythicBuddy.id);
    gachaService.saveState(state);

    gachaService.setActiveBuddy(mythicBuddy.id);

    const buffs = gachaSkillEngine.getActiveBuffs();
    expect(buffs.streakShieldActive).toBe(true);

    const consumed = gachaSkillEngine.consumeStreakShield();
    expect(consumed).toBe(true);

    const after = gachaSkillEngine.getActiveBuffs();
    expect(after.streakShieldCharges).toBe(buffs.streakShieldCharges - 1);
  });

  it('supports interactive companion cheer with happiness and bonus coins', () => {
    const res = gachaSkillEngine.interactWithBuddy();
    expect(res.success).toBe(true);
    expect(res.happinessGained).toBe(15);
    expect(res.coinsGained).toBeGreaterThan(0);
    expect(res.quote).toBeDefined();
  });

  it('computes buffs for any specified buddy using getBuffsForBuddy', () => {
    const commonBuddy = ALL_BUDDIES.find((b) => b.rarity === 'COMMON') || ALL_BUDDIES[0];
    const buffs = gachaSkillEngine.getBuffsForBuddy(commonBuddy);
    expect(buffs.buddy.id).toBe(commonBuddy.id);
    expect(buffs.xpMultiplier).toBe(1.05);
    expect(buffs.activeEffectsLabels).toContain('⚡ XP โบนัส +5%');
  });
});
