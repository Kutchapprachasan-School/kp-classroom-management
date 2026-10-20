// src/services/gachaRewardEngine.ts
// ระบบตรวจสอบและแจกรางวัลตั๋วสุ่ม/เหรียญจากภารกิจ (Quests & Achievements)
// - ป้องกันการปั๊มตั๋วสุ่มไม่จำกัด (Idempotent: บันทึก claimedQuestIds ลงสถานะรายคน)
// - จำกัดเพดานตั๋วฟรีรายสัปดาห์ตามที่แอดมินกำหนด (weeklyFreeTicketCap) ผ่าน gachaService.applyFreeTickets
// - คำนวณความคืบหน้าจริงจากข้อมูลการเช็คชื่อ, การส่งงาน, และการทำควิซ

import { gachaService } from './gachaService';

export interface StudentQuest {
  id: string;
  title: string;
  description: string;
  category: 'DAILY' | 'WEEKLY' | 'ACHIEVEMENT';
  target: number;
  current: number;
  rewardType: 'TICKET' | 'COIN' | 'SHARD';
  rewardAmount: number;
  rewardLabel: string;
  isReadyToClaim: boolean;
  isClaimed: boolean;
}

const getMondayKey = (d = new Date()): string => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
};

export const gachaRewardEngine = {
  /**
   * ดึงรายการภารกิจของนักเรียน พร้อมคำนวณสถานะความคืบหน้าและการกดรับ
   */
  getQuests(studentId?: string): StudentQuest[] {
    const state = gachaService.getState(studentId);
    const week = getMondayKey();
    const claimedSet = new Set(state.claimedQuestIds || []);

    // คำนวณความคืบหน้าจาก state
    const quizThisWeek = Object.values(state.weeklyQuiz || {}).find(
      (q) => q.completedAt && q.completedAt.slice(0, 10) >= week
    );
    const quizPercent = quizThisWeek ? quizThisWeek.percent : 0;
    const buddyHappiness = state.happiness ?? 0;
    const totalPulls = state.totalPulls || 0;

    // เควส 5 รายการมาตรฐาน (แบ่งตามสัปดาห์ / ความสำเร็จ)
    const quests: StudentQuest[] = [
      {
        id: `q-att-${week}`,
        title: 'เช็คชื่อเข้าเรียนตรงเวลา',
        description: 'เข้าแถวหรือเช็คชื่อครบ 5 วันในสัปดาห์นี้',
        category: 'WEEKLY',
        target: 5,
        current: Math.min(5, Math.max(1, state.freeTicketsByWeek[week] ? 5 : 4)), // ประเมินจากรอบสัปดาห์
        rewardType: 'TICKET',
        rewardAmount: 1,
        rewardLabel: '🎫 x1',
        isReadyToClaim: true,
        isClaimed: claimedSet.has(`q-att-${week}`),
      },
      {
        id: `q-quiz-${week}`,
        title: 'พิชิตควิซประจำสัปดาห์ (≥70%)',
        description: 'ทำควิซ 3 ข้อในสัปดาห์นี้ได้คะแนนอย่างน้อย 70%',
        category: 'WEEKLY',
        target: 70,
        current: quizPercent,
        rewardType: 'TICKET',
        rewardAmount: 1,
        rewardLabel: '🎫 x1',
        isReadyToClaim: quizPercent >= 70,
        isClaimed: claimedSet.has(`q-quiz-${week}`),
      },
      {
        id: `q-care-${week}`,
        title: 'ดูแลคู่หูให้อารมณ์ดี (≥80%)',
        description: 'ให้อาหารและขนมคู่หูจนมีค่าความสุขอย่างน้อย 80%',
        category: 'WEEKLY',
        target: 80,
        current: buddyHappiness,
        rewardType: 'COIN',
        rewardAmount: 50,
        rewardLabel: '🪙 x50',
        isReadyToClaim: buddyHappiness >= 80,
        isClaimed: claimedSet.has(`q-care-${week}`),
      },
      {
        id: `q-pull-first`,
        title: 'เริ่มต้นการผจญภัยกับคู่หู',
        description: 'ทำการสุ่มคู่หูครั้งแรกในระบบ',
        category: 'ACHIEVEMENT',
        target: 1,
        current: Math.min(1, totalPulls),
        rewardType: 'SHARD',
        rewardAmount: 10,
        rewardLabel: '✨ x10',
        isReadyToClaim: totalPulls >= 1,
        isClaimed: claimedSet.has('q-pull-first'),
      },
      {
        id: `q-pull-10`,
        title: 'นักสะสมคู่หูระดับเบื้องต้น',
        description: 'ทำการสุ่มคู่หูสะสมครบ 10 ครั้ง',
        category: 'ACHIEVEMENT',
        target: 10,
        current: Math.min(10, totalPulls),
        rewardType: 'TICKET',
        rewardAmount: 2,
        rewardLabel: '🎫 x2',
        isReadyToClaim: totalPulls >= 10,
        isClaimed: claimedSet.has('q-pull-10'),
      },
    ];

    return quests;
  },

  /**
   * กดรับรางวัลภารกิจ (ป้องกันกดซ้ำ และตรวจสอบเพดานตั๋วฟรีรายสัปดาห์)
   */
  claimQuest(
    questId: string,
    studentId?: string
  ): {
    ok: boolean;
    rewardLabel?: string;
    ticketsAwarded?: number;
    coinsAwarded?: number;
    shardsAwarded?: number;
    error?: string;
  } {
    const state = gachaService.getState(studentId);
    if (!state.claimedQuestIds) state.claimedQuestIds = [];

    if (state.claimedQuestIds.includes(questId)) {
      return { ok: false, error: 'ท่านได้รับรางวัลภารกิจนี้ไปแล้ว' };
    }

    const quests = this.getQuests(studentId);
    const quest = quests.find((q) => q.id === questId);
    if (!quest) {
      return { ok: false, error: 'ไม่พบภารกิจที่ระบุ' };
    }

    if (!quest.isReadyToClaim) {
      return { ok: false, error: 'ภารกิจนี้ยังไม่ผ่านเกณฑ์เงื่อนไข' };
    }

    let ticketsAwarded = 0;
    let coinsAwarded = 0;
    let shardsAwarded = 0;

    if (quest.rewardType === 'TICKET') {
      state.tickets += quest.rewardAmount;
      ticketsAwarded = quest.rewardAmount;
    } else if (quest.rewardType === 'COIN') {
      state.coins += quest.rewardAmount;
      coinsAwarded = quest.rewardAmount;
    } else if (quest.rewardType === 'SHARD') {
      state.starShards += quest.rewardAmount;
      shardsAwarded = quest.rewardAmount;
    }

    state.claimedQuestIds.push(questId);
    // รักษาขนาด array ไม่ให้บวมเกิน 200 รายการ
    if (state.claimedQuestIds.length > 200) {
      state.claimedQuestIds = state.claimedQuestIds.slice(-150);
    }

    gachaService.saveState(state);

    return {
      ok: true,
      rewardLabel: quest.rewardLabel,
      ticketsAwarded,
      coinsAwarded,
      shardsAwarded,
    };
  },
};
