// tests/gachaEcosystem.test.ts
// ชุดทดสอบครอบคลุมระบบกาชาคู่หู, การเลื่อนขั้นดาว 1★–5★, คลังควิซ 40 สัปดาห์,
// การคิดคะแนนตามสัดส่วน, การป้องกันการปั๊มตั๋วสุ่ม และระบบ Reset/Rollback

import { describe, it, expect, beforeEach } from 'vitest';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    length: 0,
    key: () => null,
  };
}

import {
  BUDDY_STAR_TABLE,
  getBuddyStarTier,
  MAX_BUDDY_STARS,
} from '../src/config/gachaStarTable';
import {
  WEEKLY_QUIZ_BANK,
  TOTAL_QUIZ_WEEKS,
  WEEKS_PER_TERM,
  QUESTIONS_PER_WEEK,
  getTermForQuizWeek,
} from '../src/config/weeklyQuizBank';
import { gachaConfigService } from '../src/services/gachaConfigService';
import { gachaService, ALL_BUDDIES } from '../src/services/gachaService';
import { gachaAdminService } from '../src/services/gachaAdminService';
import { gachaRewardEngine } from '../src/services/gachaRewardEngine';
import {
  weeklyQuizService,
  scoreWeeklyQuiz,
  computeQuizWeek,
} from '../src/services/weeklyQuizService';

describe('Gacha Ecosystem Comprehensive Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    gachaConfigService.resetToDefaults();
  });

  // =========================================================================
  // 1. Buddy Star Scaling & Skill Progression (1★ - 5★)
  // =========================================================================
  describe('Buddy Star Progression Table (All 22 Buddies)', () => {
    it('contains all 22 buddies with 5 complete star tiers each', () => {
      expect(ALL_BUDDIES.length).toBe(22);
      for (const buddy of ALL_BUDDIES) {
        const table = BUDDY_STAR_TABLE[buddy.id];
        expect(table, `Missing table for ${buddy.id}`).toBeDefined();
        for (let star = 1; star <= MAX_BUDDY_STARS; star++) {
          const tier = getBuddyStarTier(buddy.id, star);
          expect(tier.xp).toBeGreaterThanOrEqual(0);
          expect(tier.coin).toBeGreaterThanOrEqual(0);
          expect(tier.graceHours).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('ensures multipliers increase or stay optimal as star level scales up', () => {
      for (const buddy of ALL_BUDDIES) {
        let prevXp = 0;
        let prevCoin = 0;
        for (let star = 1; star <= MAX_BUDDY_STARS; star++) {
          const tier = getBuddyStarTier(buddy.id, star);
          expect(tier.xp).toBeGreaterThanOrEqual(prevXp);
          expect(tier.coin).toBeGreaterThanOrEqual(prevCoin);
          prevXp = tier.xp;
          prevCoin = tier.coin;
        }
      }
    });

    it('upgrades buddy star using Star Shards correctly and caps at 5 stars', () => {
      const studentId = 'test-stu-star';
      const state = gachaService.getState(studentId);
      // Give enough shards for upgrades
      state.starShards = 1000;
      gachaService.saveState(state);

      // Starter buddy buddy-c1 starts at 1 star
      expect(gachaService.getBuddyStars('buddy-c1', studentId)).toBe(1);

      // Upgrade 1 -> 2
      const up1 = gachaService.upgradeBuddyStar('buddy-c1', studentId);
      expect(up1.ok).toBe(true);
      if (up1.ok) {
        expect(up1.stars).toBe(2);
        expect(up1.spent).toBeGreaterThan(0);
      }
      expect(gachaService.getBuddyStars('buddy-c1', studentId)).toBe(2);

      // Upgrade 2 -> 3 -> 4 -> 5
      gachaService.upgradeBuddyStar('buddy-c1', studentId);
      gachaService.upgradeBuddyStar('buddy-c1', studentId);
      const up4 = gachaService.upgradeBuddyStar('buddy-c1', studentId);
      expect(up4.ok).toBe(true);
      if (up4.ok) expect(up4.stars).toBe(5);
      expect(gachaService.getBuddyStars('buddy-c1', studentId)).toBe(5);

      // Try upgrade beyond 5
      const upMax = gachaService.upgradeBuddyStar('buddy-c1', studentId);
      expect(upMax.ok).toBe(false);
      if (!upMax.ok) {
        expect(upMax.error).toContain('สูงสุด');
      }
    });

    it('fails star upgrade if insufficient star shards', () => {
      const studentId = 'test-stu-noshards';
      const state = gachaService.getState(studentId);
      state.starShards = 0;
      gachaService.saveState(state);

      const res = gachaService.upgradeBuddyStar('buddy-c1', studentId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toContain('ไม่เพียงพอ');
      }
    });
  });

  // =========================================================================
  // 2. 40-Week Quiz Curriculum & Proportional Scoring
  // =========================================================================
  describe('40-Week Quiz Curriculum (Term 1: 1–20, Term 2: 21–40)', () => {
    it('contains exactly 120 questions (40 weeks * 3 questions)', () => {
      expect(TOTAL_QUIZ_WEEKS).toBe(40);
      expect(WEEKS_PER_TERM).toBe(20);
      expect(QUESTIONS_PER_WEEK).toBe(3);
      expect(WEEKLY_QUIZ_BANK.length).toBe(120);

      for (let w = 1; w <= 40; w++) {
        const qs = WEEKLY_QUIZ_BANK.filter((q) => q.week === w);
        expect(qs.length).toBe(3);
        const term = getTermForQuizWeek(w);
        if (w <= 20) {
          expect(term).toBe(1);
        } else {
          expect(term).toBe(2);
        }
        for (const q of qs) {
          expect(q.choices.length).toBe(4);
          expect(q.answerIndex).toBeGreaterThanOrEqual(0);
          expect(q.answerIndex).toBeLessThanOrEqual(3);
          expect(q.explanation).toBeDefined();
        }
      }
    });

    it('calculates quiz week from term start date correctly', () => {
      // Semester 1 starts 15 พ.ค. 2569
      const term1 = { semesterNo: 1 as const, startDate: '15 พ.ค. 2569' };
      // On start day
      const info1 = computeQuizWeek(term1, new Date('2026-05-15T09:00:00Z'));
      expect(info1).not.toBeNull();
      expect(info1?.week).toBe(1);
      expect(info1?.termWeek).toBe(1);
      expect(info1?.semesterNo).toBe(1);

      // Week 3
      const info3 = computeQuizWeek(term1, new Date('2026-05-29T09:00:00Z'));
      expect(info3?.week).toBe(3);

      // Semester 2 starts 1 พ.ย. 2569
      const term2 = { semesterNo: 2 as const, startDate: '1 พ.ย. 2569' };
      const infoTerm2W1 = computeQuizWeek(term2, new Date('2026-11-01T09:00:00Z'));
      expect(infoTerm2W1?.week).toBe(21);
      expect(infoTerm2W1?.termWeek).toBe(1);
      expect(infoTerm2W1?.semesterNo).toBe(2);
    });

    it('scores proportionally: 100% full XP and tickets, partial score gives partial XP', () => {
      const cfg = gachaConfigService.getConfig();
      const tier = getBuddyStarTier('buddy-c1', 1);
      const qs = weeklyQuizService.getQuestionsForWeek(1);

      // 1. All 3 correct (100%)
      const perfectAnswers = qs.map((q) => q.answerIndex);
      const scorePerfect = scoreWeeklyQuiz({
        questions: qs,
        answers: perfectAnswers,
        config: cfg,
        tier,
        completedCountAfter: 1,
        rng: () => 0.5,
      });

      expect(scorePerfect.correct).toBe(3);
      expect(scorePerfect.percent).toBe(100);
      expect(scorePerfect.isPerfect).toBe(true);
      expect(scorePerfect.xp).toBeGreaterThanOrEqual(cfg.quiz.baseXpPerWeek);
      expect(scorePerfect.ticketsWanted).toBe(cfg.rewards.quizPerfectTickets);

      // 2. 2 of 3 correct
      const partialAnswers = [qs[0].answerIndex, qs[1].answerIndex, (qs[2].answerIndex + 1) % 4];
      const scorePartial = scoreWeeklyQuiz({
        questions: qs,
        answers: partialAnswers,
        config: cfg,
        tier,
        completedCountAfter: 1,
        rng: () => 0.5,
      });

      expect(scorePartial.correct).toBe(2);
      expect(scorePartial.percent).toBe(cfg.quiz.rewardPercentByCorrect[2]);
      expect(scorePartial.isPerfect).toBe(false);
      expect(scorePartial.xp).toBeLessThan(scorePerfect.xp);
      expect(scorePartial.ticketsWanted).toBe(0); // No ticket on imperfect

      // 3. 0 of 3 correct
      const zeroAnswers = qs.map((q) => (q.answerIndex + 1) % 4);
      const scoreZero = scoreWeeklyQuiz({
        questions: qs,
        answers: zeroAnswers,
        config: cfg,
        tier,
        completedCountAfter: 1,
        rng: () => 0.5,
      });

      expect(scoreZero.correct).toBe(0);
      expect(scoreZero.percent).toBe(cfg.quiz.rewardPercentByCorrect[0]);
      expect(scoreZero.xp).toBeLessThan(scorePartial.xp);
      expect(scoreZero.ticketsWanted).toBe(0);
    });

    it('supports admin question overrides seamlessly', () => {
      const defaultQ = weeklyQuizService.getQuestionsForWeek(1)[0];
      const cfg = gachaConfigService.getConfig();

      // Override question 1
      cfg.quiz.questionOverrides[defaultQ.id] = {
        ...defaultQ,
        question: 'คำถามที่ครูปรับแต่งเองสำหรับการสอบปลายภาค',
        choices: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
        answerIndex: 2,
        explanation: 'คำอธิบายที่คุณครูเขียนเอง',
      };
      gachaConfigService.saveConfig(cfg);

      const overriddenQs = weeklyQuizService.getQuestionsForWeek(1);
      expect(overriddenQs[0].question).toBe('คำถามที่ครูปรับแต่งเองสำหรับการสอบปลายภาค');
      expect(overriddenQs[0].answerIndex).toBe(2);
    });
  });

  // =========================================================================
  // 3. Anti-Exploit Protections
  // =========================================================================
  describe('Anti-Exploit Protections (Weekly Free Ticket Cap & Quests)', () => {
    it('enforces 1 ticket per day and max 5 tickets per week strictly', () => {
      const studentId = 'test-stu-cap';
      const state = gachaService.getState(studentId);
      const initialTickets = state.tickets;
      const cap = gachaConfigService.getConfig().rewards.weeklyFreeTicketCap; // default 5

      // 1. Day 1: First claim of the day -> SUCCESS (+1 ticket)
      const res1 = gachaService.applyFreeTickets(state);
      expect(res1.status).toBe('SUCCESS');
      expect(res1.allowed).toBe(1);
      expect(res1.claimedThisWeek).toBe(1);
      expect(state.tickets).toBe(initialTickets + 1);

      // 2. Day 1: Immediate second claim on the same day -> Blocked with DAILY_LIMIT_REACHED
      const res2 = gachaService.applyFreeTickets(state);
      expect(res2.status).toBe('DAILY_LIMIT_REACHED');
      expect(res2.allowed).toBe(0);
      expect(res2.claimedThisWeek).toBe(1);
      expect(state.tickets).toBe(initialTickets + 1); // Not incremented

      // 3. Day 2..5: Simulate claiming on consecutive days in the same week
      for (let day = 2; day <= cap; day++) {
        // Mock that the previous claim was on an earlier date
        state.lastFreeTicketClaimDate = `2026-10-0${day - 1}`;
        const res = gachaService.applyFreeTickets(state);
        expect(res.status).toBe('SUCCESS');
        expect(res.allowed).toBe(1);
        expect(res.claimedThisWeek).toBe(day);
      }
      expect(state.tickets).toBe(initialTickets + cap); // Claimed all 5 days (5 tickets total)

      // 4. Day 6: Simulate another day in the same week after reaching 5/5 -> WEEKLY_CAP_REACHED
      state.lastFreeTicketClaimDate = '2026-10-06';
      const resAfterCap = gachaService.applyFreeTickets(state);
      expect(resAfterCap.status).toBe('WEEKLY_CAP_REACHED');
      expect(resAfterCap.allowed).toBe(0);
      expect(resAfterCap.claimedThisWeek).toBe(cap);
      expect(state.tickets).toBe(initialTickets + cap); // Still capped at initial + 5
    });

    it('prevents repeated claims on the same quest (idempotent)', () => {
      const studentId = 'test-stu-quests';
      const quests = gachaRewardEngine.getQuests(studentId);
      const firstQuest = quests[0];

      // First claim should succeed
      const claim1 = gachaRewardEngine.claimQuest(firstQuest.id, studentId);
      expect(claim1.ok).toBe(true);

      // Second claim of the same quest MUST fail
      const claim2 = gachaRewardEngine.claimQuest(firstQuest.id, studentId);
      expect(claim2.ok).toBe(false);
      expect(claim2.error).toContain('ไปแล้ว');
    });
  });

  // =========================================================================
  // 4. Admin Reset & Rollback Engine
  // =========================================================================
  describe('Admin Reset, Grant, and Snapshot Rollback Engine', () => {
    it('grants tickets, shards, and buddies to student and audits the action', () => {
      const studentId = 'test-stu-grant';
      const initialTickets = gachaService.getState(studentId).tickets;

      const grantRes = gachaAdminService.grantTickets(studentId, 5, 'รางวัลทดสอบ');
      expect(grantRes.ok).toBe(true);
      expect(grantRes.newTotal).toBe(initialTickets + 5);

      const shardRes = gachaAdminService.grantShards(studentId, 50, 'มอบเศษดาว');
      expect(shardRes.ok).toBe(true);
      expect(shardRes.newTotal).toBe(50);

      const buddyRes = gachaAdminService.grantBuddy(studentId, 'buddy-c2', 'มอบบัดดี้ใหม่');
      expect(buddyRes.ok).toBe(true);
      expect(gachaService.getState(studentId).unlockedBuddyIds).toContain('buddy-c2');

      const logs = gachaAdminService.listAuditLogs();
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it('creates auto-snapshots on reset and supports full rollback restoration', () => {
      const s1 = 'stu-1';
      const s2 = 'stu-2';

      // Set custom state for student 1 and 2
      const st1 = gachaService.getState(s1);
      st1.tickets = 15;
      st1.starShards = 200;
      st1.unlockedBuddyIds = ['buddy-c1', 'buddy-r1'];
      gachaService.saveState(st1);

      const st2 = gachaService.getState(s2);
      st2.tickets = 25;
      st2.starShards = 350;
      gachaService.saveState(st2);

      // Reset student 1 with auto-snapshot
      const resetRes = gachaAdminService.resetStudent(s1, 'รีเซ็ตทดสอบ', { autoSnapshot: true });
      expect(resetRes.ok).toBe(true);
      expect(resetRes.snapshotId).toBeDefined();

      // Student 1 should now be reset to initial state
      const freshSt1 = gachaService.getState(s1);
      const cfg = gachaConfigService.getConfig();
      expect(freshSt1.tickets).toBe(cfg.starterTickets);
      expect(freshSt1.starShards).toBe(0);

      // Now Rollback using the snapshot!
      const rollbackRes = gachaAdminService.rollbackSnapshot(resetRes.snapshotId!);
      expect(rollbackRes.ok).toBe(true);
      expect(rollbackRes.restoredCount).toBe(1);

      // Student 1 state must be completely restored!
      const restoredSt1 = gachaService.getState(s1);
      expect(restoredSt1.tickets).toBe(15);
      expect(restoredSt1.starShards).toBe(200);
      expect(restoredSt1.unlockedBuddyIds).toContain('buddy-r1');
    });

    it('resets classroom students and rolls back accurately', () => {
      const classStudents = ['stu-cls-1', 'stu-cls-2', 'stu-cls-3'];
      for (const sid of classStudents) {
        const st = gachaService.getState(sid);
        st.tickets = 10;
        st.starShards = 80;
        gachaService.saveState(st);
      }

      // Reset classroom
      const resetCls = gachaAdminService.resetClassroom(classStudents, 'ม.3/1', 'ขึ้นเทอมใหม่');
      expect(resetCls.ok).toBe(true);
      expect(resetCls.count).toBe(3);

      const cfg = gachaConfigService.getConfig();
      for (const sid of classStudents) {
        expect(gachaService.getState(sid).tickets).toBe(cfg.starterTickets);
      }

      // Rollback classroom
      const rollbackCls = gachaAdminService.rollbackSnapshot(resetCls.snapshotId!);
      expect(rollbackCls.ok).toBe(true);
      expect(rollbackCls.restoredCount).toBe(3);

      for (const sid of classStudents) {
        expect(gachaService.getState(sid).tickets).toBe(10);
        expect(gachaService.getState(sid).starShards).toBe(80);
      }
    });
  });
});
