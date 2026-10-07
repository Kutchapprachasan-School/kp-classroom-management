import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Heart,
  Edit3,
  ArrowRight,
  BookOpen,
  Calendar,
  Zap,
  Dices,
} from 'lucide-react';
import { gachaService } from '../services/gachaService';
import { ChibiBuddyAvatar } from '../components/student/ChibiBuddyAvatar';
import { cleanSlateService } from '../services/cleanSlateService';
import type { AuthUser } from '../services/authService';

export interface TrophyBadgeItem {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  iconName: 'work' | 'score' | 'book' | 'streak' | 'winner' | 'model';
}

const BADGES_SCREEN_2: TrophyBadgeItem[] = [
  {
    id: 'badge-1',
    title: 'ส่งงานครบครั้งแรก',
    description: 'ส่งการบ้านหรือใบงานครบตรงเวลาเป็นชิ้นแรกของเทอม',
    isUnlocked: true,
    unlockedAt: '10 พ.ค. 2569',
    iconName: 'work',
  },
  {
    id: 'badge-2',
    title: 'คะแนนเต็มวิชา (คณิต)',
    description: 'ได้คะแนนเต็ม 100% ในการสอบเก็บคะแนนวิชาคณิตศาสตร์',
    isUnlocked: true,
    unlockedAt: '24 พ.ค. 2569',
    iconName: 'score',
  },
  {
    id: 'badge-3',
    title: 'อ่านหนังสือครบ 5 เล่ม',
    description: 'บันทึกการอ่านวรรณกรรมและหนังสือเรียนครบ 5 เล่ม',
    isUnlocked: true,
    unlockedAt: '02 มิ.ย. 2569',
    iconName: 'book',
  },
  {
    id: 'badge-4',
    title: 'ทำกิจกรรมต่อเนื่อง 7 วัน',
    description: 'ล็อกอินเช็คอินและร่วมกิจกรรมห้องเรียน 7 วันติดต่อกัน',
    isUnlocked: true,
    unlockedAt: '15 มิ.ย. 2569',
    iconName: 'streak',
  },
  {
    id: 'badge-5',
    title: 'ชนะเลิศกิจกรรม ร.ร.',
    description: 'ได้รับรางวัลชนะเลิศอันดับ 1 ในการแข่งขันกิจกรรมของโรงเรียน',
    isUnlocked: false,
    iconName: 'winner',
  },
  {
    id: 'badge-6',
    title: 'นักเรียนตัวอย่าง (ระดับสูง)',
    description: 'ได้รับการยกย่องเป็นนักเรียนประพฤติดีเด่นระดับเหรียญทองประจำปี',
    isUnlocked: false,
    iconName: 'model',
  },
];

interface StudentTrophyViewProps {
  onNavigateToGacha?: () => void;
  onNavigateToMissions?: () => void;
  currentUser?: AuthUser | null;
}

export const StudentTrophyView: React.FC<StudentTrophyViewProps> = ({
  onNavigateToGacha,
  onNavigateToMissions,
  currentUser: _currentUser,
}) => {
  const currentBuddy = gachaService.getActiveBuddy();
  const [buddyCustomName, setBuddyCustomName] = useState(currentBuddy.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [buddyMorale, setBuddyMorale] = useState(100);
  const [buddyQuote, setBuddyQuote] = useState(() => {
    return currentBuddy.id === 'buddy-l1'
      ? 'เพลิงแห่งความมุ่งมั่นลุกโชนแล้ว! ลุยการบ้านกันเลย!'
      : 'พร้อมเรียนรู้และผจญภัยเคียงข้างคุณทุกวันครับ! ✨';
  });
  const [isBuddyJumping, setIsBuddyJumping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleBuddyAction = () => {
    setIsBuddyJumping(true);
    setBuddyMorale((prev) => Math.min(100, prev + 5));
    const quotes = [
      `เย้! วันนี้เราพร้อมลุยไปด้วยกันแล้วครับ! ⚡`,
      `ความพยายามวันนี้ จะพาเราไปสู่ความสำเร็จ! ✨`,
      `บัฟ ${currentBuddy.skillName} พร้อมทำงานเต็มที่แล้ว! 🔥`,
      `สู้ๆ นะครับ! ส่งงานครบแล้วเลเวลอัปแน่นอน! 🎯`,
    ];
    setBuddyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setTimeout(() => {
      setIsBuddyJumping(false);
    }, 600);
  };

  const handleCheerBuddy = () => {
    setBuddyMorale(100);
    setToastMsg(`✨ เสริมพลังใจให้น้อง${currentBuddy.name} เรียบร้อย! กำลังใจเต็ม 100%`);
    setBuddyQuote(`ขอบคุณที่ส่งกำลังใจให้นะครับ! พลังใจพร้อมลุยเต็ม 100% แล้ว! 💖`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isClean = cleanSlateService.isCleanSlateActive();
  const badgesList = isClean
    ? BADGES_SCREEN_2.map((b) => ({ ...b, isUnlocked: false, unlockedAt: undefined }))
    : BADGES_SCREEN_2;
  const unlockedCount = badgesList.filter((b) => b.isUnlocked).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header: หอเกียรติยศและคู่หูบัดดี้ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>หอเกียรติยศและคู่หูบัดดี้ (Trophy Room & Buddy Sanctuary)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            สะสมคะแนนเพื่ออัปเลเวลคู่หูบัดดี้ ปลดล็อกสกิลบัฟ และรับเหรียญตราความสำเร็จ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToGacha && (
            <button
              type="button"
              onClick={onNavigateToGacha}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              <span>สุ่มคู่หู (Gacha) 🎲</span>
            </button>
          )}

          <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>ปลดล็อกแล้ว {unlockedCount}/6 เหรียญ</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md text-center animate-in fade-in slide-in-from-top-2 duration-300">
          {toastMsg}
        </div>
      )}

      {/* 2. Main Buddy Hero Card (คู่หูบัดดี้ประจำตัว) */}
      <div className="bg-gradient-to-b from-emerald-50/70 via-teal-50/40 to-white rounded-3xl border-2 border-emerald-200/90 p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-200/25 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Buddy Sprite & Info */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Interactive Anime Avatar */}
            <div
              onClick={handleBuddyAction}
              className={`p-3 bg-white/90 backdrop-blur rounded-3xl border-2 border-emerald-200 shadow-sm cursor-pointer transition-transform duration-300 select-none relative ${
                isBuddyJumping ? '-translate-y-3 scale-110' : 'hover:scale-105'
              }`}
              title={`คลิกทักทายน้อง${currentBuddy.name}!`}
            >
              <ChibiBuddyAvatar
                buddy={currentBuddy}
                size="lg"
                showName={false}
                isAnimated={true}
              />
              <span
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs tracking-wider z-10 ${currentBuddy.badgeBg}`}
              >
                {currentBuddy.rarity}
              </span>
            </div>

            <div className="space-y-2">
              {/* Buddy Name with Edit Button */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isEditingName ? (
                  <input
                    type="text"
                    value={buddyCustomName}
                    onChange={(e) => setBuddyCustomName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    className="text-lg font-black text-slate-900 border-b-2 border-emerald-500 bg-white px-2 py-0.5 rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {buddyCustomName}
                  </h2>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingName(!isEditingName)}
                  className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                  title="แก้ไขชื่อเรียกคู่หูบัดดี้"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtitle / Quote */}
              <p className="text-xs text-slate-500 font-semibold">
                {currentBuddy.title}
              </p>
              <p className="text-xs sm:text-sm font-medium text-emerald-800">
                &ldquo;{buddyQuote}&rdquo;
              </p>

              {/* Level & XP Progress */}
              <div className="space-y-1.5 pt-1 w-64 sm:w-80">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700 font-extrabold">เลเวล 2</span>
                  <span className="tabular-nums">650 / 1,000 XP (65%)</span>
                </div>
                <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700 shadow-2xs"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>

              {/* Stats: Morale & Active Buff */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 pt-1 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-rose-600 bg-white px-3 py-1 rounded-xl border border-rose-100 shadow-2xs">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>กำลังใจ {buddyMorale}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-100 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-400" />
                  <span className="truncate max-w-[160px] sm:max-w-[200px]" title={currentBuddy.skillDesc}>
                    บัฟ: {currentBuddy.skillName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheerBuddy}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                >
                  ✨ เสริมพลังใจคู่หู
                </button>
              </div>
            </div>
          </div>

          {/* Action Button: ดูภารกิจคู่หูบัดดี้ -> */}
          <div className="shrink-0 flex flex-col items-center sm:items-end gap-2">
            <button
              type="button"
              onClick={onNavigateToMissions}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>ดูภารกิจคู่หูบัดดี้</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              ทำภารกิจเพื่อสะสมแต้ม XP ให้อัปเลเวล
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: เหรียญตราความสำเร็จ 6 ชิ้น (ตรงตาม Screen 2 เป๊ะ) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                เหรียญตราความสำเร็จ
              </h3>
              <p className="text-xs text-slate-400">
                สะสมจากการส่งงาน ทำคะแนนสอบ อ่านหนังสือ และความประพฤติ
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            {unlockedCount} / {BADGES_SCREEN_2.length} ปลดล็อก
          </span>
        </div>

        {/* 6 Badges Grid (3 columns on desktop, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badgesList.map((badge) => {
            const getIcon = () => {
              switch (badge.iconName) {
                case 'work':
                  return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
                case 'score':
                  return <Sparkles className="w-6 h-6 text-amber-500" />;
                case 'book':
                  return <BookOpen className="w-6 h-6 text-blue-600" />;
                case 'streak':
                  return <Calendar className="w-6 h-6 text-orange-500" />;
                case 'winner':
                  return <Trophy className="w-6 h-6 text-slate-400" />;
                case 'model':
                  return <Award className="w-6 h-6 text-slate-400" />;
              }
            };

            return (
              <div
                key={badge.id}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  badge.isUnlocked
                    ? 'border-emerald-200/90 bg-gradient-to-b from-white to-emerald-50/20 shadow-2xs hover:shadow-md'
                    : 'border-slate-100 bg-slate-50/70 opacity-70'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs ${
                        badge.isUnlocked
                          ? 'bg-white border border-emerald-200 text-emerald-600'
                          : 'bg-slate-200/70 border border-slate-300/80 text-slate-400'
                      }`}
                    >
                      {badge.isUnlocked ? getIcon() : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    {badge.isUnlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ได้รับแล้ว
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                        ยังไม่ปลดล็อก
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {badge.isUnlocked && badge.unlockedAt && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-100/70 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                    <span>ปลดล็อกเมื่อ</span>
                    <span>{badge.unlockedAt}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
