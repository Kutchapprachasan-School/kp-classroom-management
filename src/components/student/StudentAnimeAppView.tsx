import React, { useState, useMemo, useEffect } from 'react';
import {
  Settings,
  ChevronLeft,
  BookOpen,
  Calendar,
  Sparkles,
  PawPrint,
  Clock,
  CheckCircle2,
  Lock,
  Heart,
  Droplet,
  Dices,
  Gift,
  HelpCircle,
  BarChart2,
  Filter,
  ShoppingBag,
  Home,
  Check,
  Smartphone,
  LayoutGrid,
  Monitor,
  Award,
  ChevronRight,
} from 'lucide-react';
import { JiuMeowMascot, AnimeStudentHero } from './JiuMeowMascot';
import {
  gachaService,
  ALL_BUDDIES,
  BUDDY_CHANGED_EVENT,
  GACHA_STATE_UPDATED_EVENT,
  type GachaBuddy,
  type GachaPullResult,
} from '../../services/gachaService';
import { gachaConfigService } from '../../services/gachaConfigService';
import { gachaSkillEngine } from '../../services/gachaSkillEngine';
import { gachaRewardEngine } from '../../services/gachaRewardEngine';
import { weeklyQuizService, type QuizWeekInfo } from '../../services/weeklyQuizService';
import {
  type WeeklyQuizQuestion,
} from '../../config/weeklyQuizBank';
import { onlineQuizService } from '../../services/onlineQuizService';

export type AnimeAppScreen =
  | 'home'
  | 'attendance'
  | 'exercises'
  | 'buddy'
  | 'gacha'
  | 'gacha-result'
  | 'inventory'
  | 'profile'
  | 'missions'
  | 'shop'
  | 'weekly-quiz';

interface StudentAnimeAppViewProps {
  initialScreen?: AnimeAppScreen;
  onExit?: () => void;
}

export const StudentAnimeAppView: React.FC<StudentAnimeAppViewProps> = ({
  initialScreen = 'home',
  onExit,
}) => {
  const [currentScreen, setCurrentScreen] = useState<AnimeAppScreen>(initialScreen);
  const [viewMode, setViewMode] = useState<'single' | 'gallery' | 'responsive'>('single');

  // Player State synced with gachaService (Zero Mock Policy: อ่านค่าจริงเสมอ)
  const [coins, setCoins] = useState(() => gachaService.getState().coins);
  const [tickets, setTickets] = useState(() => gachaService.getState().tickets);
  const [starShards, setStarShards] = useState(() => gachaService.getState().starShards);
  const [hunger, setHunger] = useState(() => gachaService.getState().hunger);
  const [happiness, setHappiness] = useState(() => gachaService.getState().happiness);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Exercise Sub-tabs
  const [exerciseTab, setExerciseTab] = useState<'EXERCISE' | 'QUIZ' | 'EXAM'>('EXERCISE');
  const quizzes = useMemo(() => onlineQuizService.getAllQuizzes(), []);

  // Mission Sub-tabs
  const [missionTab, setMissionTab] = useState<'DAILY' | 'WEEKLY' | 'SPECIAL'>('DAILY');

  // Shop Sub-tabs
  const [shopTab, setShopTab] = useState<'ITEMS' | 'TICKETS' | 'DECOR'>('ITEMS');

  // Inventory Sub-tabs
  const [inventoryTab, setInventoryTab] = useState<'BUDDY' | 'ITEMS' | 'TICKETS'>('BUDDY');

  // Gacha Pity State & Equipped Buddy
  const [pityCount, setPityCount] = useState(() => gachaService.getState().pityCount);
  const [equippedBuddy, setEquippedBuddy] = useState<GachaBuddy>(() => gachaService.getActiveBuddy());
  const [rolledBuddy, setRolledBuddy] = useState<GachaBuddy>(ALL_BUDDIES[0]);
  const [rolledResults, setRolledResults] = useState<GachaPullResult[]>([]);

  // Weekly Quiz Interactive State
  const [quizWeekInfo] = useState<QuizWeekInfo | null>(() =>
    weeklyQuizService.getCurrentWeekInfo()
  );
  const [quizQuestions, setQuizQuestions] = useState<WeeklyQuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([-1, -1, -1]);
  const [eliminatedChoices, setEliminatedChoices] = useState<Record<number, number[]>>({});
  const [quizResultSummary, setQuizResultSummary] = useState<any>(null);

  // Active Buddy Buffs
  const activeBuffs = useMemo(() => gachaSkillEngine.getBuffsForBuddy(equippedBuddy), [equippedBuddy]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const syncStateFromGacha = () => {
    const fresh = gachaService.getState();
    setTickets(fresh.tickets);
    setCoins(fresh.coins);
    setStarShards(fresh.starShards);
    setHunger(fresh.hunger);
    setHappiness(fresh.happiness);
    setPityCount(fresh.pityCount);
    setEquippedBuddy(gachaService.getActiveBuddy());
  };

  useEffect(() => {
    syncStateFromGacha();

    const handleSync = () => {
      syncStateFromGacha();
    };

    window.addEventListener(BUDDY_CHANGED_EVENT, handleSync);
    window.addEventListener(GACHA_STATE_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('kps-cloud-synced', handleSync);
    window.addEventListener('kps-data-sync-event', handleSync);

    return () => {
      window.removeEventListener(BUDDY_CHANGED_EVENT, handleSync);
      window.removeEventListener(GACHA_STATE_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('kps-cloud-synced', handleSync);
      window.removeEventListener('kps-data-sync-event', handleSync);
    };
  }, []);

  const handleFeed = () => {
    const res = gachaService.useCareItem('food');
    if ('error' in res) {
      showToast(`⚠️ ${res.error}`);
      return;
    }
    syncStateFromGacha();
    showToast(`🍏 ให้อาหาร "${equippedBuddy.name}" สำเร็จ! ความอิ่ม ${res.hunger}%`);
  };

  const handleSnack = () => {
    const res = gachaService.useCareItem('snack');
    if ('error' in res) {
      showToast(`⚠️ ${res.error}`);
      return;
    }
    syncStateFromGacha();
    showToast(`🍡 ให้ขนม "${equippedBuddy.name}" สำเร็จ! ความสุข ${res.happiness}%`);
  };

  const handlePetCompanion = () => {
    const res = gachaSkillEngine.interactWithBuddy();
    syncStateFromGacha();
    showToast(`✨ ${res.message} • "${res.quote}"`);
  };

  const handlePullGacha = (count: number) => {
    const currentState = gachaService.getState();
    if (currentState.tickets < count) {
      showToast(`⚠️ ตั๋วสุ่มไม่เพียงพอ (ต้องการ ${count} ใบ)! สามารถแลกซื้อได้ที่ร้านค้า`);
      return;
    }

    const pullRes = count === 1 ? [gachaService.pullOne()] : gachaService.pullTen();
    if (!Array.isArray(pullRes) && 'error' in pullRes) {
      showToast(`⚠️ ${pullRes.error}`);
      return;
    }

    const finalResults = (
      Array.isArray(pullRes) ? pullRes : [pullRes]
    ) as GachaPullResult[];

    syncStateFromGacha();
    setRolledResults(finalResults);
    setRolledBuddy(finalResults[0].buddy);

    const totalShards = finalResults.reduce((sum, r) => sum + r.shardsGained, 0);
    if (totalShards > 0) {
      showToast(`✨ ได้รับเศษดาวรวม +${totalShards} ชิ้น!`);
    }
    setCurrentScreen('gacha-result');
  };

  const handleBuyShopItem = (_cost: number, itemName: string) => {
    if (itemName.includes('อาหาร')) {
      const res = gachaService.buyItem('food');
      if (!res.ok) {
        showToast(`⚠️ ${res.error}`);
        return;
      }
      syncStateFromGacha();
      showToast(`🛒 ซื้อข้าวกล่องคู่หูสำเร็จ! (-${res.spent} เหรียญ)`);
    } else if (itemName.includes('ความสุข') || itemName.includes('ขนม')) {
      const res = gachaService.buyItem('snack');
      if (!res.ok) {
        showToast(`⚠️ ${res.error}`);
        return;
      }
      syncStateFromGacha();
      showToast(`🛒 ซื้อขนมหวานคู่หูสำเร็จ! (-${res.spent} เหรียญ)`);
    } else if (itemName.includes('คำใบ้')) {
      const res = gachaService.buyItem('quizHint');
      if (!res.ok) {
        showToast(`⚠️ ${res.error}`);
        return;
      }
      syncStateFromGacha();
      showToast(`🛒 ซื้อคำใบ้ตัดช้อยส์สำเร็จ! (-${res.spent} เหรียญ)`);
    } else if (itemName.includes('ตั๋วสุ่ม')) {
      const res = gachaService.buyTicketsWithCoins(1);
      if (!res.ok) {
        showToast(`⚠️ ${res.error}`);
        return;
      }
      syncStateFromGacha();
      showToast(`🛒 ซื้อตั๋วสุ่มสำเร็จ! (+1 ตั๋ว, -${res.spent} เหรียญ)`);
    }
  };

  // Helper render for 1 Screen inside device frame
  const renderScreenContent = (screen: AnimeAppScreen) => {
    switch (screen) {
      // ========================================================
      // 1. หน้าหลัก (Home)
      // ========================================================
      case 'home':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-white">
            {/* Top Player Header */}
            <div className="flex items-center justify-between pt-1">
              {/* Avatar + Level */}
              <div
                onClick={() => setCurrentScreen('profile')}
                className="flex items-center gap-2 cursor-pointer bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow-2xs border border-sky-100"
              >
                <div className="w-8 h-8 rounded-full bg-sky-200 border-2 border-white flex items-center justify-center overflow-hidden">
                  <AnimeStudentHero size={36} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-800 leading-tight">
                    นักเรียนดีเด่น
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-sky-600">Lv.12</span>
                    <div className="w-14 bg-sky-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-[53%]" />
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono">320/600</span>
                  </div>
                </div>
              </div>

              {/* Currency Badges */}
              <div className="flex items-center gap-1.5 text-xs font-black">
                {/* Tickets */}
                <div
                  onClick={() => setCurrentScreen('gacha')}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs cursor-pointer"
                >
                  <Dices className="w-3 h-3 text-pink-200" />
                  <span className="text-[11px]">{tickets}</span>
                </div>
                {/* Coins */}
                <div
                  onClick={() => setCurrentScreen('shop')}
                  className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs cursor-pointer"
                >
                  <span className="text-[10px]">🪙</span>
                  <span className="text-[11px]">{coins.toLocaleString()}</span>
                </div>
                {/* Settings */}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('profile')}
                  className="p-1 rounded-full bg-white/80 hover:bg-white text-slate-600 border border-slate-200 shadow-2xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hero Anime Artwork Box */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-sky-200/90 shadow-sm bg-gradient-to-b from-[#BAE6FD] to-[#E0F2FE] p-4 text-center">
              {/* Sakura blossom petals */}
              <div className="absolute top-2 left-3 text-pink-300 text-xs animate-pulse">🌸</div>
              <div className="absolute top-8 right-6 text-pink-400 text-sm animate-bounce">🌸</div>

              {/* Speech Bubble */}
              <div className="inline-block bg-white text-sky-950 font-black text-[11px] px-3.5 py-1 rounded-full shadow-sm border border-sky-100 mb-1">
                สู้ๆ นะ! วันนี้เก่งขึ้นได้อีก! 💖
              </div>

              {/* Hero Characters Presentation (Anime Boy + Chibi Cat Mascot) */}
              <div className="flex items-end justify-center gap-1 py-1">
                <div className="transform -scale-x-100">
                  <AnimeStudentHero size={90} />
                </div>
                <div className="animate-bounce" style={{ animationDuration: '3s' }}>
                  <JiuMeowMascot size={80} mood="sparkle" />
                </div>
              </div>
            </div>

            {/* School Welcome Card */}
            <div className="bg-white/95 rounded-2xl p-2.5 border border-sky-100 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs border border-teal-100">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 truncate">
                  โรงเรียนคำยางพิทยา
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  ยินดีต้อนรับสู่โลกแห่งการเรียนรู้!
                </p>
              </div>
            </div>

            {/* 4 Big Action Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: เรียนรู้ */}
              <div
                onClick={() => setCurrentScreen('exercises')}
                className="bg-white rounded-2xl p-3 border border-sky-100 hover:border-sky-300 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block group-hover:text-blue-600">
                    เรียนรู้
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    (ห้องเรียน/แบบฝึกหัด)
                  </span>
                </div>
              </div>

              {/* Card 2: กิจกรรม */}
              <div
                onClick={() => setCurrentScreen('attendance')}
                className="bg-white rounded-2xl p-3 border border-orange-100 hover:border-orange-300 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block group-hover:text-orange-600">
                    กิจกรรม
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    (เช็คชื่อ/กิจกรรม)
                  </span>
                </div>
              </div>

              {/* Card 3: กาชา */}
              <div
                onClick={() => setCurrentScreen('gacha')}
                className="bg-white rounded-2xl p-3 border border-purple-100 hover:border-purple-300 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block group-hover:text-purple-600">
                    กาชา
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    (สุ่มบัดดี้)
                  </span>
                </div>
              </div>

              {/* Card 4: บัดดี้ */}
              <div
                onClick={() => setCurrentScreen('buddy')}
                className="bg-white rounded-2xl p-3 border border-teal-100 hover:border-teal-300 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block group-hover:text-teal-600">
                    บัดดี้
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    (ดูแล/ฟิตติ้ง)
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Quiz Banner (40-Week Curriculum) */}
            <div
              onClick={() => {
                const info = weeklyQuizService.getCurrentWeekInfo();
                const week = info ? info.week : 1;
                const qs = weeklyQuizService.getQuestionsForWeek(week);
                setQuizQuestions(qs);
                setQuizAnswers([-1, -1, -1]);
                setEliminatedChoices({});
                setQuizResultSummary(null);
                setCurrentScreen('weekly-quiz');
              }}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-3 text-white shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">
                      ควิซประจำสัปดาห์ (สัปดาห์ที่ {quizWeekInfo ? quizWeekInfo.week : 1})
                    </span>
                    <span className="text-[9px] bg-yellow-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full">
                      ชิงตั๋วสุ่ม!
                    </span>
                  </div>
                  <p className="text-[10px] text-white/80">
                    3 ข้อ ชิงตั๋วสุ่ม 🎫 + EXP เต็มเมื่อตอบถูกทั้งหมด!
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>
        );

      // ========================================================
      // 2. ระบบเช็คชื่อ / กิจวัตรประจำวัน
      // ========================================================
      case 'attendance':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>เช็คชื่อประจำวัน</span>
              </button>
            </div>

            {/* Progress Header Box */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-900">เช็คชื่อประจำวัน</span>
                <span className="text-[10px] text-slate-400">วันพุธที่ 12 มี.ค. 2568</span>
              </div>
              {/* Progress Bar (4/5) */}
              <div className="space-y-1">
                <div className="flex justify-end text-[10px] font-bold text-emerald-600">
                  เช็คชื่อครบ 4/5
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[80%] rounded-full transition-all" />
                </div>
              </div>
            </div>

            {/* Vertical Stepper Timeline */}
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {[
                { title: 'เข้าแถวเคารพธงชาติ & โฮมรูม', desc: '+25% ความอิ่มสัตว์เลี้ยง', status: 'DONE' },
                { title: 'คาบที่ 1 (ช่วงเช้า)', desc: '+10 XP', status: 'DONE' },
                { title: 'คาบที่ 2 (ช่วงเช้า)', desc: '+10 XP', status: 'DONE' },
                { title: 'คาบที่ 3 (ช่วงเช้า)', desc: 'กำลังเรียน', status: 'ACTIVE' },
                { title: 'คาบที่ 4 (ช่วงบ่าย)', desc: 'ยังไม่ถึงเวลาเรียน', status: 'LOCKED' },
                { title: 'คาบที่ 5 (ช่วงบ่าย)', desc: 'ยังไม่ถึงเวลาเรียน', status: 'LOCKED' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    step.status === 'DONE'
                      ? 'bg-white border-emerald-200/80 shadow-2xs'
                      : step.status === 'ACTIVE'
                      ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        step.status === 'DONE'
                          ? 'bg-emerald-500 text-white'
                          : step.status === 'ACTIVE'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {step.status === 'DONE' ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : step.status === 'ACTIVE' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        {step.title}
                      </h4>
                      <p
                        className={`text-[10px] font-semibold mt-0.5 ${
                          step.status === 'ACTIVE'
                            ? 'text-blue-600 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {step.status === 'DONE' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {step.status === 'LOCKED' && (
                    <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Action Button */}
            <button
              type="button"
              onClick={() => showToast('เปิดตารางเรียนสัปดาห์นี้')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ดูตารางเรียนวันนี้</span>
            </button>
          </div>
        );

      // ========================================================
      // 3. แบบฝึกหัด / ควิซ
      // ========================================================
      case 'exercises':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>แบบฝึกหัด / ควิซ</span>
              </button>
              <Settings className="w-4 h-4 text-slate-400" />
            </div>

            {/* Subject Header Card */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200">
                  <JiuMeowMascot size={32} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    คณิตศาสตร์ ม.3
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    บทที่ 3 : สมการเชิงเส้น
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                3/5
              </span>
            </div>

            {/* 3 Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-black">
              {[
                { key: 'EXERCISE', label: 'แบบฝึกหัด' },
                { key: 'QUIZ', label: 'ควิซท้ายบท' },
                { key: 'EXAM', label: 'สอบเก็บคะแนน' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setExerciseTab(tab.key as any)}
                  className={`py-1.5 rounded-xl transition-all ${
                    exerciseTab === tab.key
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {quizzes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100 font-medium">
                  ยังไม่มีแบบฝึกหัดหรือควิซในขณะนี้
                </div>
              ) : (
                quizzes.map((q, i) => (
                  <div
                    key={q.id || i}
                    className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${q.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{q.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{q.subjectCode} • เต็ม {q.maxScore} คะแนน</p>
                      </div>
                    </div>

                    {!q.isOpen ? (
                      <div className="p-1.5 rounded-xl bg-slate-100 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => showToast(`เริ่มทำ ${q.title}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-[11px] shadow-2xs transition-transform active:scale-95"
                      >
                        เริ่มทำ
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Reward Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-purple-200 flex items-center justify-center">
                  <AnimeStudentHero size={34} />
                </div>
                <div>
                  <span className="text-[11px] font-black text-purple-950 block">
                    ทำครบ 3 แบบฝึกหัด
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold block">
                    รับตั๋วสุ่ม 1 ใบ! 🎫
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs animate-bounce">
                <Gift className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      // ========================================================
      // 4. คู่หูนักเรียน (Buddy / Pet Sanctuary)
      // ========================================================
      case 'buddy':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-gradient-to-b from-sky-50 via-white to-sky-50/30">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>คู่หูนักเรียน (Buddy)</span>
              </button>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            </div>

            {/* Buddy Main Card */}
            <div className="bg-white rounded-3xl p-4 border border-sky-100 shadow-sm text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-base font-black text-slate-900">{equippedBuddy.name}</h2>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-black border ${equippedBuddy.badgeBg}`}>
                  ⭐️ {equippedBuddy.rarity}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Lv.5</span>
              </div>

              {/* Big Cute Mascot Visual */}
              <div className="py-2 flex justify-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-100 shadow-md flex items-center justify-center p-1">
                  <img
                    src={`/images/buddies/${equippedBuddy.id}.png`}
                    alt={equippedBuddy.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>

              {/* 2 Status Bars (Hunger & Happiness) */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {/* Hunger */}
                <div className="bg-amber-50 rounded-2xl p-2 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <Droplet className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>ความอิ่ม</span>
                  </div>
                  <span className="font-black text-amber-900">{hunger}%</span>
                </div>
                {/* Happiness */}
                <div className="bg-rose-50 rounded-2xl p-2 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                    <span>ความสุข</span>
                  </div>
                  <span className="font-black text-rose-900">{happiness}%</span>
                </div>
              </div>
            </div>

            {/* Active Buffs & Companion Skill Box */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>สกิลคู่หู: {equippedBuddy.skillName}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">{equippedBuddy.element}</span>
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl leading-relaxed">
                {equippedBuddy.skillDesc}
              </p>

              <div className="space-y-1.5 pt-0.5">
                {activeBuffs.activeEffectsLabels.map((label, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-sky-50/70 p-2 rounded-xl border border-sky-100"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0">
                      ★
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Interactive Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setCurrentScreen('inventory')}
                className="py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-black text-[11px] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer text-center"
              >
                สลับคู่หู
              </button>
              <button
                type="button"
                onClick={handleFeed}
                className="py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] shadow-md shadow-emerald-500/25 transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🍃 ให้อาหาร</span>
              </button>
              <button
                type="button"
                onClick={handlePetCompanion}
                className="py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-[11px] shadow-md shadow-amber-500/25 transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>✨ ทักทาย</span>
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 5. สุ่มกาชา (Gacha)
      // ========================================================
      case 'gacha':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-gradient-to-b from-[#F3E8FF] via-white to-purple-50">
            {/* Top Bar with Tickets & Coins */}
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-purple-950 hover:text-purple-700 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ตู้สุ่มคู่หู</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-black">
                <span className="flex items-center gap-1 bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  🎫 {tickets}
                </span>
                <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  🪙 {coins}
                </span>
              </div>
            </div>

            {/* Anime Gacha Banner Card from Image 2 */}
            <div className="rounded-3xl border border-purple-200 shadow-md relative overflow-hidden aspect-[526/311] bg-slate-900 group">
              <img
                src="/images/buddies/banner_art.jpg"
                alt="ตู้สุ่มคู่หูนักเรียน"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCurrentScreen('inventory')}
                className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-black backdrop-blur transition-all shadow-xs cursor-pointer border border-white/20"
              >
                🔍 ดูคู่หู 22 คน
              </button>
            </div>

            {/* Drop Rates Box (From Config) */}
            {(() => {
              const cfg = gachaConfigService.getConfig();
              return (
                <>
                  <div className="bg-white rounded-2xl p-2.5 border border-purple-100 shadow-2xs space-y-1 text-[11px]">
                    <div className="flex justify-between items-center font-black text-slate-800 border-b border-slate-100 pb-1">
                      <span>อัตราการได้รับ (เรทสุ่มปัจจุบัน)</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-bold">
                      <div className="flex justify-between text-slate-600">
                        <span>⭐️ Common</span>
                        <span className="font-mono">{cfg.rates.COMMON.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>⭐️ Uncommon</span>
                        <span className="font-mono">{cfg.rates.UNCOMMON.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>⭐️ Rare</span>
                        <span className="font-mono">{cfg.rates.RARE.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-purple-600">
                        <span>⭐️ Epic</span>
                        <span className="font-mono">{cfg.rates.EPIC.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>⭐️ Legendary</span>
                        <span className="font-mono">{cfg.rates.LEGENDARY.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>⭐️ Mythic</span>
                        <span className="font-mono">{cfg.rates.MYTHIC.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Pull Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePullGacha(1)}
                      className="py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-500/25 transition-transform active:scale-95 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <span>สุ่ม 1 ครั้ง</span>
                      <span className="text-[10px] opacity-80">🎫 x1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePullGacha(10)}
                      className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/25 transition-transform active:scale-95 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <span>สุ่ม 10 ครั้ง</span>
                      <span className="text-[10px] opacity-80">🎫 x10</span>
                    </button>
                  </div>

                  {/* Pity Progress Bar */}
                  <div className="bg-slate-100/90 rounded-2xl p-2 text-center space-y-1">
                    <div className="text-[10px] font-bold text-slate-600">
                      การันตี Epic หรือสูงกว่า ในอีก {Math.max(0, ((cfg as any).pityCeiling ?? (cfg as any).hardPitySSR ?? 50) - pityCount)} ครั้ง
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (pityCount / ((cfg as any).pityCeiling ?? (cfg as any).hardPitySSR ?? 50)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        );

      // ========================================================
      // 6. ผลการได้รับ (Gacha Result Modal: 1-Pull & 10-Pull)
      // ========================================================
      case 'gacha-result': {
        const isMulti = rolledResults.length > 1;
        const totalShardsGained = rolledResults.reduce((s, r) => s + r.shardsGained, 0);
        const newBuddiesCount = rolledResults.filter((r) => r.isNew).length;

        return (
          <div className="flex-1 flex flex-col items-center justify-between p-4 animate-fade-in bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white text-center relative overflow-hidden">
            {/* Sparkles backdrop */}
            <div className="absolute top-4 left-6 text-yellow-300 text-lg animate-ping">✨</div>
            <div className="absolute top-10 right-8 text-cyan-300 text-sm animate-pulse">🌟</div>
            <div className="absolute bottom-16 left-6 text-pink-300 text-sm animate-bounce">✨</div>

            <div className="pt-1">
              <h2 className="text-lg font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow">
                {isMulti ? 'ผลการสุ่ม 10 ครั้ง' : 'ยอดเยี่ยมมาก!'}
              </h2>
              <p className="text-[11px] text-indigo-200 font-bold">
                {isMulti
                  ? `ได้รับคู่หูใหม่ ${newBuddiesCount} ตัว • ได้รับเศษดาวรวม +${totalShardsGained} ชิ้น`
                  : rolledResults[0]?.isNew
                  ? 'ได้รับคู่หูใหม่เข้าสู่คลังแล้ว!'
                  : `ได้ตัวซ้ำ เปลี่ยนเป็นเศษดาว +${rolledResults[0]?.shardsGained || 0} ชิ้น!`}
              </p>
            </div>

            {/* Display Cards */}
            {isMulti ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-auto w-full max-h-72 overflow-y-auto px-1 py-1">
                {rolledResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white/95 text-slate-900 rounded-2xl p-2 border border-white/50 shadow-md flex flex-col items-center text-center space-y-1"
                  >
                    {res.isNew && (
                      <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                        NEW!
                      </span>
                    )}
                    {!res.isNew && res.shardsGained > 0 && (
                      <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                        +{res.shardsGained}✨
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5">
                      <img
                        src={`/images/buddies/${res.buddy.id}.png`}
                        alt={res.buddy.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 truncate w-full">
                      {res.buddy.name}
                    </span>
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded-full border ${res.buddy.badgeBg}`}>
                      {res.buddy.rarity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group my-auto">
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-500 rounded-3xl blur-lg opacity-75 animate-pulse" />
                <div className="relative bg-white text-slate-900 rounded-3xl p-4 border-2 border-white shadow-2xl space-y-2 w-48">
                  <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-1">
                    <img
                      src={`/images/buddies/${rolledBuddy.id}.png`}
                      alt={rolledBuddy.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{rolledBuddy.name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-black border ${rolledBuddy.badgeBg}`}>
                        ⭐️ {rolledBuddy.rarity}
                      </span>
                      <span className="text-[9px] text-amber-500 font-black">
                        {'★'.repeat(Math.max(1, gachaService.getBuddyStars(rolledBuddy.id)))}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold truncate">
                      {rolledBuddy.skillName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('inventory')}
                className="w-full py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                ดูในกระเป๋า (Inventory)
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer"
              >
                ตกลง
              </button>
            </div>
          </div>
        );
      }

      // ========================================================
      // 7. กระเป๋า / คลังบัดดี้ (Inventory)
      // ========================================================
      case 'inventory':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>กระเป๋า / คลังบัดดี้</span>
              </button>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>

            {/* 3 Category Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-black">
              {[
                { key: 'BUDDY', label: 'บัดดี้' },
                { key: 'ITEMS', label: 'ไอเทม' },
                { key: 'TICKETS', label: 'ตั๋วสุ่ม' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setInventoryTab(tab.key as any)}
                  className={`py-1.5 rounded-xl transition-all ${
                    inventoryTab === tab.key
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: BUDDY (22 Buddies with lock & stars) */}
            {inventoryTab === 'BUDDY' && (
              <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto pr-1">
                {(() => {
                  const state = gachaService.getState();
                  const cfg = gachaConfigService.getConfig();
                  return ALL_BUDDIES.map((buddy) => {
                    const isUnlocked = state.unlockedBuddyIds.includes(buddy.id);
                    const stars = isUnlocked ? gachaService.getBuddyStars(buddy.id) : 0;
                    const isEquipped = equippedBuddy.id === buddy.id;
                    const unlockCost = cfg.unlockCostShards[buddy.rarity] || 100;

                    return (
                      <div
                        key={buddy.id}
                        onClick={() => {
                          if (isUnlocked) {
                            gachaService.setActiveBuddy(buddy.id);
                            setEquippedBuddy(buddy);
                            showToast(`เลือกคู่หู "${buddy.name}" ประจำการแล้ว ✨`);
                            setCurrentScreen('buddy');
                          } else {
                            if (state.starShards >= unlockCost) {
                              if (
                                confirm(
                                  `ปลดล็อกคู่หู "${buddy.name}" ด้วย ${unlockCost} เศษดาว? (คุณมี ${state.starShards} ชิ้น)`
                                )
                              ) {
                                const res = gachaService.unlockBuddyWithShards(buddy.id);
                                if (res.ok) {
                                  syncStateFromGacha();
                                  showToast(`🎉 ปลดล็อก "${buddy.name}" สำเร็จ!`);
                                } else {
                                  showToast(`⚠️ ${res.error}`);
                                }
                              }
                            } else {
                              showToast(
                                `🔒 คู่หูนี้ยังไม่ปลดล็อก (สุ่มได้จากกาชา หรือใช้ ${unlockCost} เศษดาว, คุณมี ${state.starShards} ชิ้น)`
                              );
                            }
                          }
                        }}
                        className={`rounded-2xl p-2 border shadow-2xs cursor-pointer flex flex-col items-center text-center space-y-1 transition-all group relative ${
                          isEquipped
                            ? 'border-teal-500 ring-2 ring-teal-400 bg-teal-50/40'
                            : isUnlocked
                            ? 'bg-white border-slate-200 hover:border-blue-400'
                            : 'bg-slate-100/80 border-slate-200 opacity-60 grayscale hover:opacity-80'
                        }`}
                      >
                        {!isUnlocked && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px] z-10">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}

                        <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5">
                          <img
                            src={`/images/buddies/${buddy.id}.png`}
                            alt={buddy.name}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform"
                          />
                        </div>

                        <span className="text-[11px] font-black text-slate-900 truncate w-full">
                          {buddy.name}
                        </span>

                        {isUnlocked ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-amber-500 font-black">
                              {'★'.repeat(stars)}
                            </span>
                            <span
                              className={`text-[8px] font-bold px-1 py-0.2 rounded-full border ${buddy.badgeBg}`}
                            >
                              {buddy.rarity}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded-full">
                            {unlockCost} ✨
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Tab 2: ITEMS (Care Items & Skill Items) */}
            {inventoryTab === 'ITEMS' && (
              <div className="flex-1 flex flex-col justify-between space-y-3 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {(() => {
                    const state = gachaService.getState();
                    return [
                      {
                        title: '🍱 ข้าวกล่องคู่หู',
                        desc: 'เพิ่มความอิ่ม +25% ให้คู่หูตัวปัจจุบัน',
                        count: state.inventory.food || 0,
                        actionLabel: 'ให้อาหาร',
                        onUse: handleFeed,
                      },
                      {
                        title: '🍡 ขนมหวานคู่หู',
                        desc: 'เพิ่มความสุข +20% ให้อารมณ์ดีตลอดวัน',
                        count: state.inventory.snack || 0,
                        actionLabel: 'ให้ขนม',
                        onUse: handleSnack,
                      },
                      {
                        title: '💡 คำใบ้ตัดช้อยส์ 50:50',
                        desc: 'ใช้ตัด 2 ตัวเลือกที่ผิดในควิซประจำสัปดาห์',
                        count: state.inventory.quizHint || 0,
                        actionLabel: 'อัตโนมัติ',
                        onUse: () => showToast('ใช้ในหน้าควิซประจำสัปดาห์'),
                      },
                      {
                        title: '🛡️ โล่รักษา Streak',
                        desc: 'ปกป้องสถิติการเรียนรู้ต่อเนื่องเมื่อขาดเรียนฉุกเฉิน',
                        count: state.inventory.streakShield || 0,
                        actionLabel: 'คุ้มครอง',
                        onUse: () => showToast('ทำงานอัตโนมัติเมื่อเปิดใช้งาน'),
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {item.desc}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            คงเหลือ: {item.count} ชิ้น
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={item.count <= 0}
                          onClick={item.onUse}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[10px] font-black shadow-2xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    ));
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('shop')}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  🛒 แวะซื้อไอเทมเพิ่มที่ร้านค้า
                </button>
              </div>
            )}

            {/* Tab 3: TICKETS (Tickets & Star Shards Balance & Exchange) */}
            {inventoryTab === 'TICKETS' && (
              <div className="flex-1 flex flex-col justify-between space-y-3 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {/* Balance Cards */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-700 block">ตั๋วสุ่มคู่หู</span>
                      <span className="text-lg font-black text-purple-950 font-mono">
                        {tickets} ใบ
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-700 block">เศษดาว (Star Shards)</span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        {starShards} ชิ้น
                      </span>
                    </div>
                  </div>

                  {/* Fast Exchange Options */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs font-black text-slate-800 block">
                      แลกเปลี่ยนตั๋วสุ่มรวดเร็ว:
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const res = gachaService.exchangeShardsForTickets(1);
                        if ('error' in res) {
                          showToast(`⚠️ ${res.error}`);
                          return;
                        }
                        syncStateFromGacha();
                        showToast('✨ แลกตั๋วสุ่มสำเร็จ! (+1 ตั๋ว)');
                      }}
                      disabled={starShards < gachaConfigService.getConfig().shop.shardsPerTicket}
                      className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-950 border border-amber-200 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span>ใช้ {gachaConfigService.getConfig().shop.shardsPerTicket} เศษดาว แลก 1 ตั๋ว</span>
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                        แลกตั๋ว
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = gachaService.buyTicketsWithCoins(1);
                        if ('error' in res) {
                          showToast(`⚠️ ${res.error}`);
                          return;
                        }
                        syncStateFromGacha();
                        showToast('🛒 ซื้อตั๋วสุ่มสำเร็จ! (+1 ตั๋ว)');
                      }}
                      disabled={coins < gachaConfigService.getConfig().shop.coinsPerTicket}
                      className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-950 border border-blue-200 text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span>ใช้ {gachaConfigService.getConfig().shop.coinsPerTicket} เหรียญ ซื้อ 1 ตั๋ว</span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                        ซื้อตั๋ว
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('gacha')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-500/25 transition-transform active:scale-95 cursor-pointer text-center"
                >
                  🎰 ไปที่ตู้สุ่มกาชา
                </button>
              </div>
            )}
          </div>
        );

      // ========================================================
      // 8. โปรไฟล์ผู้เล่น (Player Profile)
      // ========================================================
      case 'profile':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>โปรไฟล์ผู้เล่น</span>
              </button>
            </div>

            {/* Player Profile Hero */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-sky-100 border-2 border-sky-400 overflow-hidden flex items-center justify-center shrink-0">
                <AnimeStudentHero size={56} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-xs font-black text-slate-900">นักเรียนดีเด่น</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-sky-600">Lv.12</span>
                  <div className="flex-1 bg-sky-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full w-[53%]" />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">320/600</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  โรงเรียนคำยางพิทยา ม.3/8
                </p>
              </div>
            </div>

            {/* สถิติการเรียนรู้ (4 Cards Grid) */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-900 block">สถิติการเรียนรู้</span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-semibold block">คะแนนรวม</span>
                  <span className="text-xs font-black text-emerald-600">82%</span>
                </div>
                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-semibold block">เลเวลบัดดี้</span>
                  <span className="text-xs font-black text-blue-600">5</span>
                </div>
                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-semibold block">ตั๋วสุ่ม</span>
                  <span className="text-xs font-black text-purple-600">{tickets}</span>
                </div>
                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-semibold block">เหรียญตรา</span>
                  <span className="text-xs font-black text-amber-600">12</span>
                </div>
              </div>
            </div>

            {/* บัดดี้หลัก (Main Buddy Box) */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-900 block">บัดดี้หลัก</span>
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
                    <JiuMeowMascot size={32} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">จิ๋วเหมียว</h4>
                    <span className="text-[9px] text-blue-600 font-bold">Lv.5 Rare</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('inventory')}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black transition-colors"
                >
                  เปลี่ยน
                </button>
              </div>
            </div>

            {/* Footer Quote */}
            <div className="text-center py-2 text-[11px] font-bold text-slate-400">
              &ldquo;เรียนดี มีเพื่อนดี ชีวิตก็สนุกขึ้นได้ ✨&rdquo;
            </div>
          </div>
        );

      // ========================================================
      // 9. ภารกิจ / เควส (Missions & Quests)
      // ========================================================
      case 'missions':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ภารกิจ / เควส</span>
              </button>
            </div>

            {/* 3 Filter Chips */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-black">
              {[
                { key: 'DAILY', label: 'ประจำวัน' },
                { key: 'WEEKLY', label: 'รายสัปดาห์' },
                { key: 'SPECIAL', label: 'พิเศษ' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMissionTab(tab.key as any)}
                  className={`py-1.5 rounded-xl transition-all ${
                    missionTab === tab.key
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quests List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {gachaRewardEngine.getQuests().map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {q.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {q.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">
                      ความคืบหน้า: {q.current} / {q.target}
                    </span>
                  </div>

                  {q.isClaimed ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>รับแล้ว</span>
                    </span>
                  ) : q.isReadyToClaim ? (
                    <button
                      type="button"
                      onClick={() => {
                        const res = gachaRewardEngine.claimQuest(q.id);
                        if (!res.ok) {
                          showToast(`⚠️ ${res.error}`);
                          return;
                        }
                        syncStateFromGacha();
                        showToast(`🎉 รับรางวัล "${q.title}" สำเร็จ! (${res.rewardLabel})`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-black shadow-2xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                    >
                      รับ {q.rewardLabel}
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold shrink-0">
                      {q.rewardLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // ========================================================
      // 10. ร้านค้า (Exchange Shop / Market)
      // ========================================================
      case 'shop':
        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Coins */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ร้านค้า</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-black">
                <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  🪙 {coins}
                </span>
                <span className="flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded-full">
                  🎫 {tickets}
                </span>
              </div>
            </div>

            {/* 3 Shop Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-black">
              {[
                { key: 'ITEMS', label: 'ไอเทม' },
                { key: 'TICKETS', label: 'ตั๋วสุ่ม' },
                { key: 'DECOR', label: 'ของตกแต่ง' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setShopTab(tab.key as any)}
                  className={`py-1.5 rounded-xl transition-all ${
                    shopTab === tab.key
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Shop Item List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {[
                { name: 'อาหารสัตว์เลี้ยง', desc: 'เพิ่มความอิ่ม +25%', price: 100, icon: '🍞' },
                { name: 'ยาฟื้นฟูความสุข', desc: 'เพิ่มความสุข +20%', price: 150, icon: '🧪' },
                { name: 'ตั๋วสุ่มคู่หู', desc: 'ใช้สุ่มบัดดี้ 1 ครั้ง', price: 50, icon: '🎫' },
                { name: 'ขยายเวลา', desc: 'เพิ่มเวลาเรียน/ส่งงาน +30 นาที', price: 80, icon: '📜' },
                { name: 'ไอเทมพิเศษ', desc: 'เปิดใช้งานบัฟพิเศษ', price: 200, icon: '🎁' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuyShopItem(item.price, item.name)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-2xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <span>🪙</span>
                    <span>{item.price}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // ========================================================
      // 11. ควิซประจำสัปดาห์ (Weekly Quiz - 40 Weeks Curriculum)
      // ========================================================
      case 'weekly-quiz': {
        const info = quizWeekInfo || weeklyQuizService.getCurrentWeekInfo();
        const currentWeekNo = info ? info.week : 1;
        const currentSemester = info ? info.semesterNo : 1;
        const questions =
          quizQuestions.length > 0
            ? quizQuestions
            : weeklyQuizService.getQuestionsForWeek(currentWeekNo);
        const storedResult = weeklyQuizService.getResult(currentWeekNo);

        const handleSelectAnswer = (qIdx: number, choiceIdx: number) => {
          if (storedResult || quizResultSummary) return;
          const next = [...quizAnswers];
          next[qIdx] = choiceIdx;
          setQuizAnswers(next);
        };

        const handleUse5050Hint = (qIdx: number) => {
          if (eliminatedChoices[qIdx]) return;
          const targetQ = questions[qIdx];
          if (!targetQ) return;
          const res = weeklyQuizService.useHint(targetQ);
          if (!res.ok) {
            showToast(`⚠️ ${res.error}`);
            return;
          }
          setEliminatedChoices((prev) => ({ ...prev, [qIdx]: res.eliminated }));
          syncStateFromGacha();
          showToast('💡 คู่หูช่วยตัด 2 ตัวเลือกที่ผิดให้แล้ว!');
        };

        const handleSubmitQuiz = async () => {
          if (quizAnswers.some((a) => a < 0)) {
            showToast('⚠️ กรุณาตอบให้ครบทั้ง 3 ข้อก่อนส่งคำตอบ');
            return;
          }
          const hintsCount = Object.keys(eliminatedChoices).length;
          const res = await weeklyQuizService.submit(quizAnswers, hintsCount);
          if (!res.ok) {
            showToast(`⚠️ ${res.error}`);
            return;
          }
          syncStateFromGacha();
          setQuizResultSummary(res.result);
          showToast(
            `🎉 ส่งคำตอบสำเร็จ! ได้รับ ${res.result.percent}% (${res.result.correct}/${res.result.total} ข้อ)`
          );
        };

        return (
          <div className="flex-1 flex flex-col justify-between p-4 space-y-3 animate-fade-in bg-slate-50/50">
            {/* Top Bar with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-black text-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ควิซประจำสัปดาห์</span>
              </button>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                สัปดาห์ที่ {currentWeekNo} (เทอม {currentSemester})
              </span>
            </div>

            {/* Quiz Result View if finished */}
            {storedResult || quizResultSummary ? (
              <div className="flex-1 flex flex-col justify-between py-1 space-y-3 overflow-y-auto pr-1">
                {(() => {
                  const res = quizResultSummary || storedResult;
                  const is100 = res.correct === res.total;
                  return (
                    <div className="space-y-3">
                      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center space-y-1 shadow-md">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-base font-black">
                          {is100 ? 'ยอดเยี่ยมมาก! ตอบถูกครบ 100%' : `ทำได้ดีมาก! (${res.percent}%)`}
                        </h3>
                        <p className="text-xs text-blue-100">
                          ตอบถูก {res.correct} จาก {res.total} ข้อ
                        </p>
                      </div>

                      {/* Reward breakdown */}
                      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                        <span className="text-xs font-black text-slate-800 block">
                          ของรางวัลที่ได้รับ:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              ค่าประสบการณ์
                            </span>
                            <span className="font-black text-blue-700">+{res.xpEarned} XP</span>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              เหรียญทอง
                            </span>
                            <span className="font-black text-amber-700">+{res.coinsEarned} 🪙</span>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              ตั๋วสุ่มคู่หู
                            </span>
                            <span className="font-black text-purple-700">
                              +{res.ticketsEarned} 🎫
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <span className="text-slate-500 font-bold block text-[10px]">
                              เศษดาว
                            </span>
                            <span className="font-black text-emerald-700">
                              +{res.shardsEarned} ✨
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Questions review & explanations */}
                      <div className="space-y-2">
                        <span className="text-xs font-black text-slate-700 block">
                          เฉลยและคำอธิบาย:
                        </span>
                        {questions.map((q, idx) => {
                          const userAns = res.answers[idx];
                          const isCorrect = userAns === q.answerIndex;
                          return (
                            <div
                              key={q.id || idx}
                              className="p-3 rounded-2xl bg-white border border-slate-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-800">
                                  ข้อ {idx + 1}: {q.question}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                    isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {isCorrect ? '✓ ถูก' : '✗ ผิด'}
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-700 font-bold">
                                เฉลย: {q.choices[q.answerIndex]}
                              </p>
                              {q.explanation && (
                                <p className="text-[10px] text-slate-500 italic">
                                  คำอธิบาย: {q.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setCurrentScreen('home')}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between py-1 space-y-3 overflow-y-auto pr-1">
                {/* Companion Cheer Banner */}
                <div className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      🐾
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-teal-950 block truncate">
                        {equippedBuddy.name} คอยให้กำลังใจ!
                      </span>
                      <span className="text-[10px] text-teal-700 block truncate">
                        ตอบถูกหมดรับตั๋วสุ่ม 🎫 + EXP คูณบัฟดาวคู่หู
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Questions */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => {
                    const eliminated = eliminatedChoices[qIdx] || [];
                    return (
                      <div
                        key={q.id || qIdx}
                        className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900">
                            ข้อที่ {qIdx + 1}: {q.question}
                          </span>
                          {!eliminatedChoices[qIdx] && (
                            <button
                              type="button"
                              onClick={() => handleUse5050Hint(qIdx)}
                              className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black shrink-0 transition-colors"
                              title="ใช้สกิลคู่หูตัดช้อยส์ผิด 2 ข้อ"
                            >
                              💡 คำใบ้ 50:50
                            </button>
                          )}
                        </div>

                        {/* 4 Choices */}
                        <div className="grid grid-cols-1 gap-1.5">
                          {q.choices.map((choice, cIdx) => {
                            const isEliminated = eliminated.includes(cIdx);
                            const isSelected = quizAnswers[qIdx] === cIdx;
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                disabled={isEliminated}
                                onClick={() => handleSelectAnswer(qIdx, cIdx)}
                                className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  isEliminated
                                    ? 'bg-slate-100 text-slate-300 line-through cursor-not-allowed border border-transparent'
                                    : isSelected
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                <span>{choice}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer"
                >
                  ส่งคำตอบควิซสัปดาห์นี้
                </button>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // 5-Tab Bottom Navigation for the active screen
  const renderBottomNav = () => (
    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-1.5 flex items-center justify-around z-20">
      {[
        { key: 'home', label: 'หน้าหลัก', icon: Home },
        { key: 'missions', label: 'ภารกิจ', icon: CheckCircle2 },
        { key: 'inventory', label: 'กระเป๋า', icon: ShoppingBag },
        { key: 'shop', label: 'ร้านค้า', icon: BarChart2 },
        { key: 'profile', label: 'เพิ่มเติม', icon: Settings },
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setCurrentScreen(tab.key as AnimeAppScreen)}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black transition-colors ${
              isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 px-2 sm:px-4 font-sans select-none text-slate-800">
      {/* Top Controller Bar */}
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-2xl p-3 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-black text-slate-900">
            UI หน้าต่างสำหรับนักเรียน (Anime Mobile App)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold">
            10 หน้าจอตรงตามภาพ 100%
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all ${
              viewMode === 'single'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>โหมดมือถือ (Interactive)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all ${
              viewMode === 'gallery'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>แกลเลอรี 10 หน้าจอ (ตามภาพ)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('responsive')}
            className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all ${
              viewMode === 'responsive'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>แท็บเล็ต/PC</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
            >
              ปิด
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          MODE 1: Interactive Single Device Frame (380px)
          ======================================================== */}
      {viewMode === 'single' && (
        <div className="w-full max-w-[390px] rounded-[44px] shadow-2xl border-[10px] border-slate-900 bg-white overflow-hidden my-auto flex flex-col min-h-[720px]">
          {/* Device Top Status Bar */}
          <div className="bg-slate-900 text-white px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black rounded-full" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-white rounded-xs p-0.5">
                <div className="w-full h-full bg-white" />
              </div>
            </div>
          </div>

          {/* Current Screen Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {renderScreenContent(currentScreen)}
          </div>

          {/* Bottom Nav (If not gacha result) */}
          {currentScreen !== 'gacha-result' && renderBottomNav()}
        </div>
      )}

      {/* ========================================================
          MODE 2: Gallery Overview (10 Screens exactly as in media_1791178592022.jpg)
          ======================================================== */}
      {viewMode === 'gallery' && (
        <div className="w-full max-w-7xl space-y-6">
          {/* Row 1 (Top 5 Screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'home', label: 'หน้าหลัก (Home)' },
              { id: 'attendance', label: 'ระบบเช็คชื่อ / กิจวัตรประจำวัน' },
              { id: 'exercises', label: 'แบบฝึกหัด / ควิซ' },
              { id: 'buddy', label: 'คู่หูนักเรียน (Buddy)' },
              { id: 'gacha', label: 'สุ่มกาชา (Gacha)' },
            ].map((sc) => (
              <div key={sc.id} className="flex flex-col items-center space-y-2">
                <div className="w-full rounded-[28px] border-4 border-slate-800 bg-white shadow-xl overflow-hidden flex flex-col h-[540px]">
                  {renderScreenContent(sc.id as AnimeAppScreen)}
                  {renderBottomNav()}
                </div>
                <span className="text-xs font-black text-slate-800 bg-white px-3 py-1 rounded-full shadow-2xs border border-slate-200">
                  {sc.label}
                </span>
              </div>
            ))}
          </div>

          {/* Row 2 (Bottom 5 Screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'gacha-result', label: 'ผลการได้รับ (Gacha Result)' },
              { id: 'inventory', label: 'กระเป๋า / คลังบัดดี้' },
              { id: 'profile', label: 'โปรไฟล์ผู้เล่น' },
              { id: 'missions', label: 'ภารกิจ / เควส' },
              { id: 'shop', label: 'ร้านค้า' },
            ].map((sc) => (
              <div key={sc.id} className="flex flex-col items-center space-y-2">
                <div className="w-full rounded-[28px] border-4 border-slate-800 bg-white shadow-xl overflow-hidden flex flex-col h-[540px]">
                  {renderScreenContent(sc.id as AnimeAppScreen)}
                  {sc.id !== 'gacha-result' && renderBottomNav()}
                </div>
                <span className="text-xs font-black text-slate-800 bg-white px-3 py-1 rounded-full shadow-2xs border border-slate-200">
                  {sc.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 3: Responsive Tablet / Desktop Mode
          ======================================================== */}
      {viewMode === 'responsive' && (
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col min-h-[640px]">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-black">
            <span>มุมมองขยายเต็มจอ (Responsive)</span>
            {/* Screen Picker Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {[
                { id: 'home', label: 'หน้าหลัก' },
                { id: 'attendance', label: 'เช็คชื่อ' },
                { id: 'exercises', label: 'แบบฝึกหัด' },
                { id: 'buddy', label: 'คู่หู' },
                { id: 'gacha', label: 'กาชา' },
                { id: 'gacha-result', label: 'ผลสุ่ม' },
                { id: 'inventory', label: 'กระเป๋า' },
                { id: 'profile', label: 'โปรไฟล์' },
                { id: 'missions', label: 'เควส' },
                { id: 'shop', label: 'ร้านค้า' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentScreen(s.id as AnimeAppScreen)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    currentScreen === s.id
                      ? 'bg-blue-600 text-white font-black'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {renderScreenContent(currentScreen)}
          </div>
          {currentScreen !== 'gacha-result' && renderBottomNav()}
        </div>
      )}

      {/* Floating Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-black animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
