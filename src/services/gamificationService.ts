import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase';
import type { StudentQuestItem, StudentLeaderboardEntry, BadgeItem } from '../types/viewModels';
import { behaviorService } from './behaviorService';
import { cleanSlateService } from './cleanSlateService';

const STORAGE_KEY_QUESTS = 'cls_student_quests';
const STORAGE_KEY_STREAK = 'cls_student_streak';

const defaultLeaderboard: StudentLeaderboardEntry[] = [];

const defaultBadges: BadgeItem[] = [
  {
    id: 'badge-1',
    title: 'จอมยุทธตรงต่อเวลา',
    description: 'ส่งงานตรงเวลาติดต่อกันครบ 5 ชิ้นงาน',
    iconType: 'clock',
    isUnlocked: false,
    progressPercent: 0,
    tier: 'GOLD',
  },
  {
    id: 'badge-2',
    title: 'ผู้พิชิตคะแนนเต็ม',
    description: 'สอบได้คะแนนเต็ม 100% ในชิ้นงานใดก็ได้',
    iconType: 'star',
    isUnlocked: false,
    progressPercent: 0,
    tier: 'SILVER',
  },
  {
    id: 'badge-3',
    title: 'มิตรแท้ห้องเรียน',
    description: 'ช่วยเพื่อนและได้รับคำชมเชยจากครู',
    iconType: 'heart',
    isUnlocked: false,
    progressPercent: 0,
    tier: 'BRONZE',
  },
  {
    id: 'badge-4',
    title: 'ปรมาจารย์แห่งดนตรี',
    description: 'สะสม XP ครบ 2,000 แต้มในหมวดวิชาศิลปะ-ดนตรี',
    iconType: 'trophy',
    isUnlocked: false,
    progressPercent: 0,
    tier: 'SPECIAL',
  },
];

const getLocalQuests = (): StudentQuestItem[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_QUESTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalQuests = (items: StudentQuestItem[]) => {
  localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(items));
};

export const gamificationService = {
  // READ: List all student quests
  async getQuests(): Promise<StudentQuestItem[]> {
    if (isSupabaseConfigured) {
      try {
        logDbOperation('SELECT * FROM Quest ORDER BY dueDateText DESC');
        const { data, error } = await supabase.from('Quest').select('*');
        if (!error && data && data.length > 0) {
          return data as StudentQuestItem[];
        }
      } catch (err) {
        console.warn('[gamificationService] Remote quest query fallback:', err);
      }
    }
    return getLocalQuests();
  },

  // SUBMIT: Turn in a quest submission
  async submitQuest(
    questId: string,
    proofUrl: string,
    studentId = 'stu-2'
  ): Promise<StudentQuestItem> {
    const list = getLocalQuests();
    const idx = list.findIndex((q) => q.id === questId);
    if (idx === -1) throw new Error('ไม่พบภารกิจที่ระบุ');

    const quest = list[idx];
    const updated: StudentQuestItem = {
      ...quest,
      status: 'SUBMITTED',
      statusLabel: 'ส่งแล้ว (รอตรวจ)',
    };
    list[idx] = updated;
    saveLocalQuests(list);

    // Credit XP using behaviorService with Idempotency Key
    const idempotencyKey = `quest-sub-${questId}-${studentId}`;
    await behaviorService.awardXp(
      studentId,
      quest.xpReward,
      `ส่งภารกิจ: ${quest.title}`,
      idempotencyKey
    );

    if (isSupabaseConfigured) {
      try {
        logDbOperation(`UPDATE Quest SET status='SUBMITTED' WHERE id=${questId}`, { proofUrl });
        await supabase
          .from('QuestSubmission')
          .insert({
            quest_id: questId,
            student_id: studentId,
            proof_url: proofUrl,
            status: 'SUBMITTED',
          });
      } catch (err) {
        console.warn('[gamificationService] Remote submission fallback:', err);
      }
    }

    return updated;
  },

  // READ: Get leaderboard
  async getLeaderboard(): Promise<StudentLeaderboardEntry[]> {
    if (cleanSlateService.isCleanSlateActive()) {
      return [];
    }
    return defaultLeaderboard;
  },

  // READ: Get badges / trophies
  async getTrophies(): Promise<BadgeItem[]> {
    if (cleanSlateService.isCleanSlateActive()) {
      return defaultBadges.map((b) => ({
        ...b,
        isUnlocked: false,
        unlockedAt: undefined,
        progressPercent: 0,
      }));
    }
    return defaultBadges;
  },

  // STREAK: Daily check-in
  async claimDailyCheckin(studentId = 'stu-2'): Promise<{ streak: number; xpAwarded: number; isFirstToday: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = localStorage.getItem(`${STORAGE_KEY_STREAK}_${studentId}_date`);
    const defaultInitialStreak = '0';
    const currentStreak = parseInt(localStorage.getItem(`${STORAGE_KEY_STREAK}_${studentId}_count`) || defaultInitialStreak, 10);

    if (lastCheckin === today) {
      return { streak: currentStreak, xpAwarded: 0, isFirstToday: false };
    }

    const newStreak = currentStreak + 1;
    localStorage.setItem(`${STORAGE_KEY_STREAK}_${studentId}_date`, today);
    localStorage.setItem(`${STORAGE_KEY_STREAK}_${studentId}_count`, newStreak.toString());

    const xp = 20;
    const idempotencyKey = `checkin-${studentId}-${today}`;
    await behaviorService.awardXp(studentId, xp, `เช็คชื่อประจำวันต่อเนื่อง (${newStreak} วัน)`, idempotencyKey);

    return { streak: newStreak, xpAwarded: xp, isFirstToday: true };
  },

  getStreak(studentId = 'stu-2'): number {
    const defaultInitialStreak = '0';
    return parseInt(localStorage.getItem(`${STORAGE_KEY_STREAK}_${studentId}_count`) || defaultInitialStreak, 10);
  },
};
