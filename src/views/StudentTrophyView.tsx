import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Heart,
  Shirt,
  Crown,
  Star,
  Zap,
  Target,
  Shield,
  Palette,
} from 'lucide-react';
import { PixelPet } from '../components/common/PixelPet';
import type { BadgeItem } from '../types/viewModels';

const badgesData: BadgeItem[] = [
  {
    id: 'b-1',
    title: 'ส่งตรงเวลาไม่เคยเลท',
    description: 'ส่งการบ้านตรงเวลาติดต่อกัน 5 ชิ้นขึ้นไป',
    iconType: 'star',
    isUnlocked: true,
    unlockedAt: '12 ก.ย. 2569',
    tier: 'GOLD',
  },
  {
    id: 'b-2',
    title: 'คะแนนเต็มร้อย (Ace)',
    description: 'ทำคะแนนเต็ม 100% ในการสอบเก็บคะแนนย่อย 1 ครั้ง',
    iconType: 'target',
    isUnlocked: true,
    unlockedAt: '15 ก.ย. 2569',
    tier: 'GOLD',
  },
  {
    id: 'b-3',
    title: 'ไฟแรงเฟร่อ',
    description: 'เช็กชื่อเข้าเรียนตรงเวลาติดต่อกัน 5 วันรวด',
    iconType: 'zap',
    isUnlocked: true,
    unlockedAt: '10 ก.ย. 2569',
    tier: 'SILVER',
  },
  {
    id: 'b-4',
    title: 'ผู้พิทักษ์ห้องเรียน',
    description: 'ได้คะแนนพฤติกรรมและความประพฤติดีเยี่ยม 100%',
    iconType: 'shield',
    isUnlocked: true,
    unlockedAt: '05 ก.ย. 2569',
    tier: 'SILVER',
  },
  {
    id: 'b-5',
    title: 'เจ้าแห่งอารีน่า',
    description: 'ทำคะแนนติด Top 3 ในสนามท้าทายประจำสัปดาห์',
    iconType: 'trophy',
    isUnlocked: true,
    unlockedAt: '18 ก.ย. 2569',
    tier: 'BRONZE',
  },
  {
    id: 'b-6',
    title: 'จิตรกรรุ่นเยาว์',
    description: 'ผลงานวาดภาพทฤษฎีสีได้รับคัดเลือกเป็นผลงานตัวอย่าง',
    iconType: 'palette',
    isUnlocked: true,
    unlockedAt: '19 ก.ย. 2569',
    tier: 'BRONZE',
  },
  {
    id: 'b-7',
    title: 'นักสะสมความรู้',
    description: 'ส่งงานครบทุกชิ้นตลอดภาคเรียน (ความคืบหน้า 80%)',
    iconType: 'star',
    isUnlocked: false,
    progressPercent: 80,
    tier: 'SILVER',
  },
  {
    id: 'b-8',
    title: 'เกียรตินิยมเหรียญทอง',
    description: 'ทำเกรดเฉลี่ยวิชานี้ได้ระดับผลการเรียน 4.0',
    iconType: 'crown',
    isUnlocked: false,
    tier: 'GOLD',
  },
  {
    id: 'b-9',
    title: 'เพื่อนแท้โมจิ',
    description: 'อัปเลเวลคู่หูสัตว์เลี้ยงโมจิถึงเลเวล 10',
    iconType: 'heart',
    isUnlocked: false,
    tier: 'SPECIAL',
  },
];

interface OutfitItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isUnlocked: boolean;
  requiredXp?: number;
}

const petOutfits: OutfitItem[] = [
  { id: 'hat-grad', name: 'หมวกบัณฑิตจิ๋ว', emoji: '🎓', description: 'มอบให้เมื่อเริ่มเข้าสู่ระบบห้องเรียนผจญภัย', isUnlocked: true },
  { id: 'flower', name: 'ดอกไม้ติดหู', emoji: '🌸', description: 'ปลดล็อกเมื่อมีสตรีกต่อเนื่องครบ 5 วัน', isUnlocked: true },
  { id: 'crown-gold', name: 'มงกุฎทองคำ', emoji: '👑', description: 'ปลดล็อกเมื่อโมจิเลเวล 5', isUnlocked: false, requiredXp: 1500 },
  { id: 'guitar', name: 'กีตาร์จิ๋วสะพายหลัง', emoji: '🎸', description: 'ปลดล็อกเมื่อส่งงานดนตรีครบทุกชิ้น', isUnlocked: false },
  { id: 'scarf', name: 'ผ้าพันคอสีแดง', emoji: '🧣', description: 'ปลดล็อกเมื่อได้รับเกรด 4.0', isUnlocked: false },
];

export const StudentTrophyView: React.FC = () => {
  const [activeOutfit, setActiveOutfit] = useState<string>('hat-grad');
  const [petHappiness, setPetHappiness] = useState(85);
  const [petQuote, setPetQuote] = useState<string>('ฮึบๆ วันนี้ส่งการบ้านครบแล้วนะเจ้านาย!');
  const [isPetJumping, setIsPetJumping] = useState(false);

  const quotesList = [
    'ฮึบๆ วันนี้ส่งการบ้านครบแล้วนะเจ้านาย! 🍃',
    'อย่าลืมทบทวนโน้ตดนตรีนะ โมจิเชียร์อยู่!',
    'งั่มๆ ใบโคลเวอร์วันนี้อร่อยจัง ขอบคุณนะ!',
    'เจ้านายอยู่อันดับ 8 ของห้องแล้ว เก่งมากๆ เลย!',
    'อีกนิดเดียวโมจิก็จะเลเวล 3 แล้ว ลุยไปด้วยกันนะ!',
  ];

  const handlePetAction = () => {
    setIsPetJumping(true);
    setPetHappiness((prev) => Math.min(100, prev + 5));
    const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
    setPetQuote(randomQuote);
    setTimeout(() => {
      setIsPetJumping(false);
    }, 600);
  };

  const handleSelectOutfit = (outfit: OutfitItem) => {
    if (!outfit.isUnlocked) {
      alert(`ยังไม่ปลดล็อกชุดนี้: ${outfit.description}`);
      return;
    }
    setActiveOutfit(outfit.id);
  };

  const unlockedCount = badgesData.filter((b) => b.isUnlocked).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              ตู้เกียรติยศและคู่หู (Trophy Room & Sanctuary)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              เหรียญตราความสำเร็จ และศูนย์ดูแลคู่หูสัตว์เลี้ยงโมจิ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>ปลดล็อกแล้ว {unlockedCount} จาก {badgesData.length} เหรียญ</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pet Sanctuary (Left 5 cols) + Milestone Badges (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Companion Pet Sanctuary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-b from-[#e8f8f0] to-white rounded-3xl border border-emerald-200/80 p-6 shadow-sm text-center relative overflow-hidden">
            {/* Background sparkle effects */}
            <div className="absolute top-2 right-2 text-emerald-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            {/* Level Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs mb-3">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>โมจิ · เลเวล 2 (จิ้งจอกฝึกหัด)</span>
            </div>

            {/* Pet Speech Bubble */}
            <div className="relative bg-white border border-emerald-200 p-3 rounded-2xl shadow-xs text-xs text-emerald-900 font-medium my-2 transition-all">
              <p>{petQuote}</p>
              {/* Bubble arrow pointer down */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-200" />
            </div>

            {/* Animated Pet Sprite Container */}
            <div className="py-6 flex flex-col items-center justify-center relative">
              <div
                onClick={handlePetAction}
                className={`cursor-pointer transition-transform duration-300 transform select-none ${
                  isPetJumping ? '-translate-y-4 scale-110' : 'hover:scale-105'
                }`}
                title="คลิกลูบหัวโมจิ!"
              >
                <PixelPet size={128} className="drop-shadow-md mx-auto" />

                {/* Equipped Accessory Overlay Indicator */}
                <div className="absolute top-2 right-1/4 text-2xl animate-bounce">
                  {petOutfits.find((o) => o.id === activeOutfit)?.emoji}
                </div>
              </div>

              {/* Shadow underneath */}
              <div className="w-24 h-3 bg-emerald-900/10 rounded-full blur-xs mt-2" />
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 pt-2 text-left">
              <div className="flex justify-between text-xs text-emerald-800 font-semibold">
                <span>XP ของโมจิ</span>
                <span>650 / 1,000 XP (65%)</span>
              </div>
              <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: '65%' }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-600 pt-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>ความสุข: {petHappiness}%</span>
                </span>
                <span>อีก 350 XP เพื่อเลเวล 3</span>
              </div>
            </div>

            {/* Pet Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-5">
              <button
                onClick={handlePetAction}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>ลูบหัวโมจิ (+5)</span>
              </button>

              <button
                onClick={() => {
                  alert('ป้อนใบโคลเวอร์ทองคำสำเร็จ! โมจิได้รับความสดชื่น +10%');
                  setPetHappiness(100);
                  setPetQuote('งั่มๆ อร่อยจัง! ขอบคุณนะเจ้านาย! 🍀✨');
                }}
                className="py-2.5 px-3 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>🍀 ให้อาหาร</span>
              </button>
            </div>
          </div>

          {/* Wardrobe & Outfits */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shirt className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                ตู้เสื้อผ้าและเครื่องประดับคู่หู
              </h3>
            </div>

            <div className="space-y-2">
              {petOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  onClick={() => handleSelectOutfit(outfit)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    activeOutfit === outfit.id
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20'
                      : outfit.isUnlocked
                      ? 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      : 'border-slate-100 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{outfit.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{outfit.name}</span>
                        {activeOutfit === outfit.id && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-semibold">
                            กำลังสวมใส่
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {outfit.description}
                      </div>
                    </div>
                  </div>

                  {!outfit.isUnlocked && (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Milestone Badges Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  เหรียญตราความสำเร็จ (Milestone Badges)
                </h3>
                <p className="text-[11px] text-slate-400">
                  สะสมเหรียญตราจากการเข้าเรียน ส่งงาน และทำคะแนนสอบยอดเยี่ยม
                </p>
              </div>
            </div>

            {/* Badges Grid (3 columns on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {badgesData.map((badge) => {
                const getTierColor = (tier: string) => {
                  switch (tier) {
                    case 'GOLD':
                      return 'bg-amber-50 border-amber-200 text-amber-700';
                    case 'SILVER':
                      return 'bg-slate-100 border-slate-300 text-slate-700';
                    case 'BRONZE':
                      return 'bg-orange-50 border-orange-200 text-orange-700';
                    default:
                      return 'bg-purple-50 border-purple-200 text-purple-700';
                  }
                };

                const renderBadgeIcon = (type: string) => {
                  switch (type) {
                    case 'target':
                      return <Target className="w-5 h-5 text-amber-500" />;
                    case 'zap':
                      return <Zap className="w-5 h-5 text-yellow-500" />;
                    case 'shield':
                      return <Shield className="w-5 h-5 text-emerald-500" />;
                    case 'trophy':
                      return <Trophy className="w-5 h-5 text-orange-500" />;
                    case 'palette':
                      return <Palette className="w-5 h-5 text-blue-500" />;
                    case 'crown':
                      return <Crown className="w-5 h-5 text-amber-500" />;
                    case 'heart':
                      return <Heart className="w-5 h-5 text-rose-500" />;
                    default:
                      return <Star className="w-5 h-5 text-amber-500" />;
                  }
                };

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all relative ${
                      badge.isUnlocked
                        ? 'border-slate-200/90 bg-white hover:shadow-md'
                        : 'border-slate-100 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${getTierColor(badge.tier)}`}>
                        {badge.isUnlocked ? (
                          renderBadgeIcon(badge.iconType)
                        ) : (
                          <Lock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-800 truncate">
                            {badge.title}
                          </h4>
                          {badge.isUnlocked && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-tight">
                          {badge.description}
                        </p>

                        {badge.isUnlocked && badge.unlockedAt && (
                          <div className="text-[10px] text-emerald-600 font-semibold pt-1">
                            ปลดล็อก: {badge.unlockedAt}
                          </div>
                        )}

                        {!badge.isUnlocked && badge.progressPercent && (
                          <div className="space-y-1 pt-1.5">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>ความคืบหน้า</span>
                              <span>{badge.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${badge.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
