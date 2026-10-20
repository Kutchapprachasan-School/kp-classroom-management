// src/services/weeklyQuizService.ts
// ระบบตอบคำถามประจำสัปดาห์ 40 สัปดาห์ (ภาคเรียน 1 = สัปดาห์ 1–20, ภาคเรียน 2 = สัปดาห์ 21–40)
// - สัปดาห์ปัจจุบันคำนวณจากวันเริ่มภาคเรียนที่เปิดใช้งานอยู่ (academicCalendarService)
// - ตอบได้ 1 ครั้งต่อสัปดาห์ รางวัลลดหลั่นตามจำนวนข้อที่ถูก (ตั้งค่าได้ที่หน้าแอดมิน)
// - รางวัล: XP (คูณบัฟดาวคู่หู), เหรียญ, ตั๋วสุ่ม (เมื่อถูกทุกข้อ, ติดเพดานตั๋วรายสัปดาห์)

import {
  WEEKLY_QUIZ_BANK,
  TOTAL_QUIZ_WEEKS,
  WEEKS_PER_TERM,
  QUESTIONS_PER_WEEK,
  getTermForQuizWeek,
  type WeeklyQuizQuestion,
} from '../config/weeklyQuizBank';
import { getBuddyStarTier, type BuddyStarTier } from '../config/gachaStarTable';
import { gachaConfigService, type GachaAdminConfig } from './gachaConfigService';
import {
  gachaService,
  getBuddyStarsFromState,
  PREVIEW_STUDENT_ID,
  type WeeklyQuizResult,
} from './gachaService';
import { gachaSkillEngine } from './gachaSkillEngine';
import { academicCalendarService } from './academicCalendarService';
import { behaviorService } from './behaviorService';

const THAI_MONTHS: Record<string, number> = {
  'ม.ค.': 1, 'มกราคม': 1, 'ก.พ.': 2, 'กุมภาพันธ์': 2, 'มี.ค.': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมษายน': 4, 'พ.ค.': 5, 'พฤษภาคม': 5, 'มิ.ย.': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎาคม': 7, 'ส.ค.': 8, 'สิงหาคม': 8, 'ก.ย.': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลาคม': 10, 'พ.ย.': 11, 'พฤศจิกายน': 11, 'ธ.ค.': 12, 'ธันวาคม': 12,
};

/** แปลงวันที่ไทยเช่น "15 พ.ค. 2569" เป็นเวลา UTC เที่ยงคืนของวันนั้น (null ถ้าอ่านไม่ได้) */
export const parseThaiTermDate = (text: string): number | null => {
  const parts = (text || '').trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const month = THAI_MONTHS[parts[1]];
  let year = parseInt(parts[2], 10);
  if (!day || !month || !year) return null;
  if (year > 2400) year -= 543;
  return Date.UTC(year, month - 1, day);
};

export interface QuizWeekInfo {
  /** สัปดาห์ 1–40 */
  week: number;
  /** สัปดาห์ภายในภาคเรียน 1–20 */
  termWeek: number;
  semesterNo: 1 | 2;
  /** วันนี้ยังไม่ถึงวันเริ่มภาคเรียน */
  notStarted: boolean;
  /** ผ่านสัปดาห์ที่ 20 ของภาคเรียนไปแล้ว (ยังคงแสดงสัปดาห์สุดท้าย) */
  beyondTermEnd: boolean;
}

/** คำนวณสัปดาห์ควิซจากวันเริ่มภาคเรียน (ฟังก์ชันบริสุทธิ์ เพื่อทดสอบได้) */
export const computeQuizWeek = (
  term: { semesterNo: 1 | 2; startDate: string },
  today: Date = new Date()
): QuizWeekInfo | null => {
  const start = parseThaiTermDate(term.startDate);
  if (start === null) return null;
  const bangkok = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(today)
    .split('-')
    .map((n) => parseInt(n, 10));
  const todayUtc = Date.UTC(bangkok[0], bangkok[1] - 1, bangkok[2]);
  const diffDays = Math.floor((todayUtc - start) / 86400000);
  const rawIdx = Math.floor(diffDays / 7) + 1;
  const termWeek = Math.min(WEEKS_PER_TERM, Math.max(1, rawIdx));
  return {
    week: (term.semesterNo === 2 ? WEEKS_PER_TERM : 0) + termWeek,
    termWeek,
    semesterNo: term.semesterNo,
    notStarted: diffDays < 0,
    beyondTermEnd: rawIdx > WEEKS_PER_TERM,
  };
};

const isValidQuestion = (q: Partial<WeeklyQuizQuestion> | undefined): q is WeeklyQuizQuestion =>
  !!q &&
  typeof q.id === 'string' &&
  typeof q.question === 'string' &&
  q.question.trim().length > 0 &&
  Array.isArray(q.choices) &&
  q.choices.length === 4 &&
  q.choices.every((c) => typeof c === 'string' && c.trim().length > 0) &&
  Number.isInteger(q.answerIndex) &&
  (q.answerIndex as number) >= 0 &&
  (q.answerIndex as number) <= 3;

export interface QuizScoreInput {
  questions: WeeklyQuizQuestion[];
  answers: number[];
  config: GachaAdminConfig;
  tier: BuddyStarTier;
  /** จำนวนครั้งที่ทำควิซรายสัปดาห์สำเร็จหลังรวมครั้งนี้ */
  completedCountAfter: number;
  rng?: () => number;
}

export interface QuizScoreOutput {
  correct: number;
  effectiveCorrect: number;
  total: number;
  percent: number;
  xp: number;
  coins: number;
  ticketsWanted: number;
  shards: number;
  isPerfect: boolean;
  doubled: boolean;
}

const toMult = (percent: number): number => 1 + percent / 100;

/** คำนวณคะแนนและรางวัลของควิซ (ฟังก์ชันบริสุทธิ์) */
export const scoreWeeklyQuiz = (input: QuizScoreInput): QuizScoreOutput => {
  const { questions, answers, config, tier, completedCountAfter } = input;
  const rng = input.rng || Math.random;
  const total = questions.length;
  const correct = questions.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);
  const effectiveCorrect = Math.min(total, correct + (tier.freeQuizCorrect || 0));
  const table = config.quiz.rewardPercentByCorrect;
  const tableIdx = total === table.length - 1 ? effectiveCorrect : Math.round((effectiveCorrect / total) * (table.length - 1));
  const percent = table[Math.min(table.length - 1, Math.max(0, tableIdx))];
  const isPerfect = total > 0 && effectiveCorrect === total;

  const xpPercent = tier.xp + (isPerfect ? tier.perfectXpBonus || 0 : 0);
  let xp = config.quiz.baseXpPerWeek * (percent / 100) * toMult(xpPercent);
  const doubled = effectiveCorrect > 0 && !!tier.quizDoubleXpChance && rng() * 100 < tier.quizDoubleXpChance;
  if (doubled) xp *= 2;

  const coins = config.quiz.baseCoinsPerWeek * (percent / 100) * toMult(tier.coin);
  let ticketsWanted = isPerfect ? config.rewards.quizPerfectTickets : 0;
  if (tier.ticketEveryFourQuizzes && completedCountAfter > 0 && completedCountAfter % 4 === 0) ticketsWanted += 1;

  return {
    correct,
    effectiveCorrect,
    total,
    percent,
    xp: Math.round(xp),
    coins: Math.round(coins),
    ticketsWanted,
    shards: isPerfect ? tier.shardsOnPerfect || 0 : 0,
    isPerfect,
    doubled,
  };
};

export const weeklyQuizService = {
  /** โจทย์ของสัปดาห์ (คลังมาตรฐาน + โจทย์ที่แอดมินแก้ไข) */
  getQuestionsForWeek(week: number): WeeklyQuizQuestion[] {
    const overrides = gachaConfigService.getConfig().quiz.questionOverrides;
    return WEEKLY_QUIZ_BANK.filter((q) => q.week === week).map((q) => {
      const o = overrides[q.id];
      return isValidQuestion(o) ? { ...o, week: q.week, id: q.id } : q;
    });
  },

  getAllQuestions(): WeeklyQuizQuestion[] {
    const all: WeeklyQuizQuestion[] = [];
    for (let w = 1; w <= TOTAL_QUIZ_WEEKS; w++) all.push(...this.getQuestionsForWeek(w));
    return all;
  },

  /** สัปดาห์ควิซปัจจุบัน (null = ยังไม่ได้ตั้งภาคเรียนที่เปิดใช้งานหรืออ่านวันเริ่มภาคเรียนไม่ได้) */
  getCurrentWeekInfo(today: Date = new Date()): QuizWeekInfo | null {
    const term = academicCalendarService.getActiveTerm();
    if (!term) return null;
    return computeQuizWeek({ semesterNo: term.semesterNo, startDate: term.startDate }, today);
  },

  getResult(week: number, studentId?: string): WeeklyQuizResult | null {
    return gachaService.getState(studentId).weeklyQuiz[week] || null;
  },

  getHistory(studentId?: string): WeeklyQuizResult[] {
    return Object.values(gachaService.getState(studentId).weeklyQuiz).sort((a, b) => a.week - b.week);
  },

  /** ใช้สกิลคู่หูตัดช้อยส์ผิด 2 ตัวเลือก (หักสิทธิ์จริง) */
  useHint(
    question: WeeklyQuizQuestion,
    studentId?: string
  ): { ok: true; eliminated: number[] } | { ok: false; error: string } {
    if (!gachaSkillEngine.consumeQuizHint(studentId)) {
      return { ok: false, error: 'คู่หูตัวนี้ไม่มีสิทธิ์ตัดช้อยส์เหลืออยู่ในสัปดาห์นี้' };
    }
    const wrongs = [0, 1, 2, 3].filter((i) => i !== question.answerIndex);
    const seed = Array.from(question.id).reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const start = seed % wrongs.length;
    const eliminated = [wrongs[start], wrongs[(start + 1) % wrongs.length]];
    return { ok: true, eliminated };
  },

  /** ส่งคำตอบของสัปดาห์ปัจจุบัน */
  async submit(
    answers: number[],
    hintsUsed = 0,
    studentId: string = gachaService.getCurrentStudentId()
  ): Promise<{ ok: true; result: WeeklyQuizResult; doubled: boolean } | { ok: false; error: string }> {
    const info = this.getCurrentWeekInfo();
    if (!info) return { ok: false, error: 'ยังไม่ได้ตั้งค่าภาคเรียนที่เปิดใช้งาน จึงยังไม่ทราบสัปดาห์ปัจจุบัน' };
    if (info.notStarted) return { ok: false, error: 'ยังไม่ถึงวันเริ่มภาคเรียน' };

    const questions = this.getQuestionsForWeek(info.week);
    if (questions.length !== QUESTIONS_PER_WEEK) return { ok: false, error: 'โจทย์ของสัปดาห์นี้ไม่ครบ' };
    if (answers.length !== questions.length || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)) {
      return { ok: false, error: 'กรุณาตอบให้ครบทุกข้อก่อนส่งคำตอบ' };
    }

    const state = gachaService.getState(studentId);
    if (state.weeklyQuiz[info.week]) return { ok: false, error: 'สัปดาห์นี้ทำควิซไปแล้ว' };

    const cfg = gachaConfigService.getConfig();
    const stars = Math.max(1, getBuddyStarsFromState(state, state.activeBuddyId));
    const tier = getBuddyStarTier(state.activeBuddyId, stars);
    const completedAfter = Object.keys(state.weeklyQuiz).length + 1;
    const score = scoreWeeklyQuiz({
      questions,
      answers,
      config: cfg,
      tier,
      completedCountAfter: completedAfter,
      rng: () => gachaService.rng(),
    });

    const ticketsGranted = score.ticketsWanted > 0 ? score.ticketsWanted : 0;
    state.tickets += ticketsGranted;
    state.coins += score.coins;
    state.starShards += score.shards;
    const result: WeeklyQuizResult = {
      week: info.week,
      correct: score.correct,
      total: score.total,
      answers: [...answers],
      percent: score.percent,
      xpEarned: score.xp,
      coinsEarned: score.coins,
      ticketsEarned: ticketsGranted,
      shardsEarned: score.shards,
      hintsUsed,
      completedAt: new Date().toISOString(),
    };
    state.weeklyQuiz[info.week] = result;
    gachaService.saveState(state);

    if (studentId !== PREVIEW_STUDENT_ID && score.xp > 0) {
      try {
        await behaviorService.awardXp(
          studentId,
          score.xp,
          `ควิซประจำสัปดาห์ที่ ${info.week} (ถูก ${score.correct}/${score.total})`,
          `weekly-quiz-${studentId}-w${info.week}`
        );
      } catch {
        // บันทึกผลควิซสำเร็จแล้ว หากบันทึก XP ล้มเหลวจะไม่ทำให้ผลควิซหาย
      }
    }
    return { ok: true, result, doubled: score.doubled };
  },

  getTermLabel(week: number): string {
    return `ภาคเรียนที่ ${getTermForQuizWeek(week)} สัปดาห์ที่ ${week > WEEKS_PER_TERM ? week - WEEKS_PER_TERM : week}`;
  },
};
