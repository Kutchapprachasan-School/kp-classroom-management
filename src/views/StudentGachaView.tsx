import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Sparkles,
  Search,
  RefreshCw,
  Star,
  Heart,
  Info,
  Zap,
} from 'lucide-react';
import {
  gachaService,
  ALL_BUDDIES,
  type GachaBuddy,
  type GachaPullResult,
  type GachaState,
} from '../services/gachaService';
import { ChibiBuddyAvatar } from '../components/student/ChibiBuddyAvatar';

interface StudentGachaViewProps {
  onBack?: () => void;
  onSelectBuddy?: (buddy: GachaBuddy) => void;
}

export const StudentGachaView: React.FC<StudentGachaViewProps> = ({
  onBack,
  onSelectBuddy,
}) => {
  const [gachaState, setGachaState] = useState<GachaState>(() =>
    gachaService.getState()
  );
  const [activeBuddy, setActiveBuddy] = useState<GachaBuddy>(() =>
    gachaService.getActiveBuddy()
  );

  // Modal states
  const [isPulling, setIsPulling] = useState(false);
  const [pullResults, setPullResults] = useState<GachaPullResult[]>([]);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAllBuddiesOpen, setIsAllBuddiesOpen] = useState(false);
  const [selectedBuddyDetail, setSelectedBuddyDetail] = useState<GachaBuddy | null>(
    null
  );
  const [isAddTicketsOpen, setIsAddTicketsOpen] = useState(false);
  const [filterRarity, setFilterRarity] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadState = () => {
    const s = gachaService.getState();
    setGachaState(s);
    setActiveBuddy(gachaService.getActiveBuddy());
  };

  useEffect(() => {
    reloadState();
  }, []);

  const handlePull1 = () => {
    if (gachaState.tickets < 1) {
      setIsAddTicketsOpen(true);
      return;
    }
    setIsPulling(true);
    setTimeout(() => {
      const res = gachaService.pullOne();
      setIsPulling(false);
      if ('error' in res) {
        showToast(res.error);
      } else {
        setPullResults([res]);
        setIsResultOpen(true);
        reloadState();
      }
    }, 900);
  };

  const handlePull10 = () => {
    if (gachaState.tickets < 10) {
      setIsAddTicketsOpen(true);
      return;
    }
    setIsPulling(true);
    setTimeout(() => {
      const res = gachaService.pullTen();
      setIsPulling(false);
      if ('error' in res) {
        showToast(res.error);
      } else {
        setPullResults(res);
        setIsResultOpen(true);
        reloadState();
      }
    }, 1200);
  };

  const handleSetActive = (buddyId: string) => {
    const success = gachaService.setActiveBuddy(buddyId);
    if (success) {
      const b = gachaService.getBuddyById(buddyId);
      if (b) {
        setActiveBuddy(b);
        onSelectBuddy?.(b);
        showToast(`ตั้ง "${b.name}" เป็นคู่หูหลักเรียบร้อยแล้ว! ✨`);
      }
      reloadState();
    }
  };

  const handleAddFreeTickets = (amount: number) => {
    gachaService.addTickets(amount);
    reloadState();
    setIsAddTicketsOpen(false);
    showToast(`ได้รับตั๋วสุ่ม +${amount} ใบ เรียบร้อยแล้ว! 🎟️`);
  };

  // Group buddies by rarity for the bottom showcase
  const commonBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'COMMON');
  const uncommonBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'UNCOMMON');
  const rareBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'RARE');
  const epicBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'EPIC');
  const legendaryBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'LEGENDARY');
  const mythicBuddies = ALL_BUDDIES.filter((b) => b.rarity === 'MYTHIC');

  const filteredAllBuddies = ALL_BUDDIES.filter((b) => {
    if (filterRarity === 'ALL') return true;
    return b.rarity === filterRarity;
  });

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-800 font-sans pb-16 select-none animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            >
              ← กลับ
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ศูนย์รวมคู่หูนักเรียน (Student Buddy Gacha)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                เวอร์ชัน 2.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              สุ่มเพื่อนร่วมทาง ช่วยเหลือการเรียนรู้ บัฟ XP และทำกิจกรรมโรงเรียน
            </p>
          </div>
        </div>

        {/* Currency Display & Active Buddy Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">คู่หูปัจจุบัน:</span>
            <span className="font-extrabold text-xs text-teal-800">
              {activeBuddy.name}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${activeBuddy.badgeBg}`}>
              {activeBuddy.rarity}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <Ticket className="w-4 h-4 text-purple-600" />
            <span className="font-extrabold text-sm text-slate-900 tabular-nums">
              {gachaState.tickets}
            </span>
            <button
              onClick={() => setIsAddTicketsOpen(true)}
              className="w-5 h-5 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ml-0.5"
              title="รับตั๋วเพิ่ม"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* ============================================================================
            SECTION 1: TOP 3-COLUMN HERO BANNER & RATE SYSTEM (เป๊ะตาม Mockup)
        ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 1.1 MAIN GACHA BANNER (7 Cols) */}
          <div className="lg:col-span-6 xl:col-span-6 rounded-3xl overflow-hidden shadow-md relative bg-gradient-to-br from-[#77B5FE] via-[#A0C4FF] to-[#D0E1FD] flex flex-col justify-between p-6 sm:p-7 min-h-[360px] border border-blue-200">
            {/* Background Graphic / Anime Scene Illustration */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none">
              <img
                src="/images/gacha-banner.jpg"
                alt="Buddy Gacha Banner"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  // Fallback decorative gradient
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {/* Cloud & Light Ray Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-white/40 z-0 pointer-events-none" />

            {/* Top Bar inside Banner */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xs">
                <Ticket className="w-3.5 h-3.5 text-amber-300" />
                <span>Gacha</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold border border-white/40 shadow-xs">
                <Ticket className="w-3.5 h-3.5 text-purple-600" />
                <span className="tabular-nums font-extrabold">{gachaState.tickets}</span>
                <button
                  onClick={() => setIsAddTicketsOpen(true)}
                  className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Main Title & Catchphrase */}
            <div className="relative z-10 my-auto py-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(15,23,42,0.8)] tracking-tight">
                สุ่มคู่หูนักเรียน
              </h1>
              <p className="text-sm sm:text-base font-bold text-white/95 drop-shadow-[0_1px_3px_rgba(15,23,42,0.7)] mt-1.5">
                พบกับเพื่อนร่วมทางคนใหม่ <span className="text-yellow-200">“ทุกการสุ่ม...อาจเจอคนที่ใช่”</span>
              </p>
            </div>

            {/* Bottom Controls: Info Button + 1x & 10x Pull Buttons */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-800 text-xs font-bold backdrop-blur-md border border-white/40 shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>ข้อมูลรายละเอียด</span>
              </button>

              <div className="flex items-center gap-2.5">
                {/* 1x Pull Button (Yellow Gold) */}
                <button
                  type="button"
                  disabled={isPulling}
                  onClick={handlePull1}
                  className="group relative px-5 py-2.5 rounded-2xl bg-gradient-to-b from-[#FFE259] to-[#FFA751] hover:from-[#FFEC70] hover:to-[#FFB266] text-amber-950 font-black text-sm shadow-md border border-amber-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex flex-col items-center justify-center min-w-[120px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-900 group-hover:rotate-12 transition-transform" />
                    <span>สุ่ม 1 ครั้ง</span>
                  </div>
                  <span className="text-[10px] text-amber-900/80 font-bold -mt-0.5">
                    🎟️ x1
                  </span>
                </button>

                {/* 10x Pull Button (Purple Violet) */}
                <button
                  type="button"
                  disabled={isPulling}
                  onClick={handlePull10}
                  className="group relative px-6 py-2.5 rounded-2xl bg-gradient-to-b from-[#A18CD1] to-[#6A11CB] hover:from-[#B19CD9] hover:to-[#7B2CBF] text-white font-black text-sm shadow-md border border-purple-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex flex-col items-center justify-center min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
                    <span>สุ่ม 10 ครั้ง</span>
                  </div>
                  <span className="text-[10px] text-purple-200 font-bold -mt-0.5">
                    🎟️ x10
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 1.2 RATE & PITY SYSTEM CARD (3 Cols) */}
          <div className="lg:col-span-3 xl:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center justify-between">
                <span>อัตราการได้รับ</span>
                <span className="text-[11px] text-slate-400 font-normal">กฏ 100%</span>
              </h2>

              {/* Rarity Rates List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-400 flex items-center justify-center text-[8px] text-white font-bold">
                      ★
                    </span>
                    <span className="font-bold text-slate-700">Common</span>
                  </div>
                  <span className="font-extrabold text-slate-900 tabular-nums">40.0%</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">
                      ★
                    </span>
                    <span className="font-bold text-emerald-800">Uncommon</span>
                  </div>
                  <span className="font-extrabold text-emerald-900 tabular-nums">35.0%</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-blue-50/60 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                      ★
                    </span>
                    <span className="font-bold text-blue-800">Rare</span>
                  </div>
                  <span className="font-extrabold text-blue-900 tabular-nums">18.0%</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-purple-50/60 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white font-bold">
                      ★
                    </span>
                    <span className="font-bold text-purple-800">Epic</span>
                  </div>
                  <span className="font-extrabold text-purple-900 tabular-nums">5.0%</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-amber-50/60 hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">
                      ★
                    </span>
                    <span className="font-bold text-amber-800">Legendary</span>
                  </div>
                  <span className="font-extrabold text-amber-900 tabular-nums">1.8%</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-xl bg-rose-50/70 hover:bg-rose-100 transition-colors border border-rose-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold animate-ping-slow">
                      ✦
                    </span>
                    <span className="font-bold text-rose-700">Mythic</span>
                  </div>
                  <span className="font-extrabold text-rose-900 tabular-nums">0.2%</span>
                </div>
              </div>
            </div>

            {/* Pity System Card */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                  ★
                </div>
                <span className="text-xs font-extrabold text-slate-800">
                  การันตี (Pity System)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                สุ่มครบ <span className="font-bold text-purple-700">80 ครั้ง</span> การันตี Epic หรือ Legendary แน่นอน!
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (gachaState.pityCount / gachaState.pityMax) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1 tabular-nums">
                <span>{gachaState.pityCount} / {gachaState.pityMax}</span>
                <span className="text-purple-600">
                  เหลืออีก {Math.max(0, gachaState.pityMax - gachaState.pityCount)} ครั้ง
                </span>
              </div>
            </div>
          </div>

          {/* 1.3 SIDEBAR INFO & MASCOT BENEFIT CARD (3 Cols) */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col justify-between gap-3">
            {/* Top Search Button */}
            <button
              onClick={() => setIsAllBuddiesOpen(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center justify-between text-xs font-bold text-slate-700 transition-all cursor-pointer group"
            >
              <span>ดูรายชื่อคู่หูทั้งหมด</span>
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Cute Cat Mascot Speech Card */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-3xl p-4 border border-blue-100 shadow-sm flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 shadow-xs flex items-center justify-center shrink-0">
                {/* Cute Cat SVG Icon */}
                <svg viewBox="0 0 60 60" className="w-11 h-11">
                  <circle cx="30" cy="32" r="20" fill="#E0F2FE" />
                  <polygon points="16,20 22,10 26,20" fill="#38BDF8" />
                  <polygon points="44,20 38,10 34,20" fill="#38BDF8" />
                  <ellipse cx="23" cy="30" rx="3" ry="4" fill="#0369A1" />
                  <ellipse cx="37" cy="30" rx="3" ry="4" fill="#0369A1" />
                  <circle cx="22" cy="28.5" r="1.2" fill="#FFFFFF" />
                  <circle cx="36" cy="28.5" r="1.2" fill="#FFFFFF" />
                  <polygon points="30,34 28,37 32,37" fill="#F43F5E" />
                  <path d="M26,38 Q30,41 34,38" stroke="#0369A1" strokeWidth="1.5" fill="none" />
                  <circle cx="17" cy="34" r="2.5" fill="#FDA4AF" opacity="0.6" />
                  <circle cx="43" cy="34" r="2.5" fill="#FDA4AF" opacity="0.6" />
                </svg>
              </div>
              <p className="text-[11px] text-blue-900 font-bold leading-snug">
                “ยิ่งสุ่มมาก ยิ่งมีโอกาสได้เพื่อนพิเศษระดับสูง มาร่วมเดินทางไปด้วยกัน!”
              </p>
            </div>

            {/* 3 Benefit Feature Pills */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">สามารถสลับใช้งานได้</div>
                  <div className="text-[10px] text-slate-400">ตามสถานการณ์</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">มีสกิลเฉพาะตัว</div>
                  <div className="text-[10px] text-slate-400">ช่วยในการเรียนและกิจกรรม</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                <div className="p-1.5 rounded-xl bg-rose-50 text-rose-700 shrink-0">
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">เพิ่มความสนุก</div>
                  <div className="text-[10px] text-slate-400">และความผูกพันในแต่ละวัน</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================
            SECTION 2: CHIBI BUDDIES PREVIEW ROSTER (เป๊ะตาม Mockup ด้านล่าง)
        ============================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                ❖
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ตัวอย่างคู่หูนักเรียน (64bit)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              ปลดล็อกแล้ว {gachaState.unlockedBuddyIds.length} / {ALL_BUDDIES.length} คน
            </span>
          </div>

          {/* 6 Rarity Tier Columns (Scrollable or 6-Column Grid) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-stretch overflow-x-auto pb-2">
            {/* 1. Common (40.0%) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-slate-100 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Common</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-500">40.0%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {commonBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-center text-slate-400 font-medium">
                มีหลายแบบ สลับใช้งานได้บ่อย
              </div>
            </div>

            {/* 2. Uncommon (35.0%) */}
            <div className="bg-white rounded-3xl border border-emerald-200 p-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-emerald-50 flex items-center justify-between mb-3 border border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800">Uncommon</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700">35.0%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {uncommonBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-50 text-[10px] text-center text-emerald-700 font-medium">
                ความสามารถพิเศษเริ่มชัดเจน
              </div>
            </div>

            {/* 3. Rare (18.0%) */}
            <div className="bg-white rounded-3xl border border-blue-200 p-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-blue-50 flex items-center justify-between mb-3 border border-blue-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-blue-800">Rare</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-blue-700">18.0%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {rareBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-50 text-[10px] text-center text-blue-700 font-medium">
                สกิลเฉพาะตัวช่วยเสริมการเรียน
              </div>
            </div>

            {/* 4. Epic (5.0%) */}
            <div className="bg-white rounded-3xl border border-purple-200 p-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-purple-50 flex items-center justify-between mb-3 border border-purple-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-bold text-purple-800">Epic</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-purple-700">5.0%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {epicBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-purple-50 text-[10px] text-center text-purple-700 font-medium">
                สกิลพิเศษและเอฟเฟกต์โดดเด่น
              </div>
            </div>

            {/* 5. Legendary (1.8%) */}
            <div className="bg-white rounded-3xl border border-amber-300 p-3 shadow-xs flex flex-col justify-between bg-gradient-to-b from-amber-50/30 to-white">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-amber-100/70 flex items-center justify-between mb-3 border border-amber-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-900">Legendary</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-800">1.8%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {legendaryBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-100 text-[10px] text-center text-amber-800 font-medium">
                หายากมาก พร้อมสกิลระดับสูง
              </div>
            </div>

            {/* 6. Mythic (0.2%) */}
            <div className="bg-white rounded-3xl border border-rose-300 p-3 shadow-xs flex flex-col justify-between bg-gradient-to-b from-rose-50/40 to-white">
              <div>
                <div className="py-1 px-2.5 rounded-xl bg-rose-100/70 flex items-center justify-between mb-3 border border-rose-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping-slow" />
                    <span className="text-xs font-bold text-rose-900">Mythic</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-800">0.2%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {mythicBuddies.map((b) => (
                    <ChibiBuddyAvatar
                      key={b.id}
                      buddy={b}
                      size="sm"
                      isUnlocked={gachaState.unlockedBuddyIds.includes(b.id)}
                      isAnimated={true}
                      onClick={() => setSelectedBuddyDetail(b)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-100 text-[10px] text-center text-rose-800 font-medium">
                ตำนานที่มีเพียงไม่กี่คน
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================
            SECTION 3: FOOTER BANNER & INSPIRATIONAL QUOTE
        ============================================================================ */}
        <div className="py-3 px-5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-indigo-900 font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              “ไม่ว่าคุณจะได้ใคร... ทุกคนล้วนมีเรื่องราว และพร้อมอยู่เคียงข้างคุณในเส้นทางการเรียนรู้”
            </span>
          </div>
          <span className="font-extrabold text-indigo-800 shrink-0">Buddy Gacha ♡</span>
        </div>
      </div>

      {/* ============================================================================
          MODAL: SUMMONING ANIMATION & REVEAL RESULTS
      ============================================================================ */}
      {isResultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Background Ray Glow */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  🎉 ยินดีด้วย! คุณได้รับคู่หูคนใหม่
                </h3>
                <p className="text-xs text-slate-500">
                  สุ่มได้ {pullResults.length} คน • ระบบบันทึกลงในคลังคู่หูเรียบร้อย
                </p>
              </div>
              <button
                onClick={() => setIsResultOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Results Grid */}
            <div
              className={`grid gap-4 py-2 max-h-[60vh] overflow-y-auto px-1 ${
                pullResults.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-5'
              }`}
            >
              {pullResults.map((res, idx) => {
                const b = res.buddy;
                return (
                  <div
                    key={`${b.id}-${idx}`}
                    className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                      res.isNew
                        ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300 ring-2 ring-amber-300 shadow-md'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="relative mb-2">
                      <ChibiBuddyAvatar buddy={b} size="md" showName={false} />
                      {res.isNew && (
                        <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs animate-bounce">
                          NEW!
                        </span>
                      )}
                    </div>

                    <div className="w-full">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {b.name}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold inline-block my-1 ${b.badgeBg}`}>
                        {b.rarity}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {b.skillName}
                      </p>
                    </div>

                    {res.shardsGained > 0 && (
                      <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        + {res.shardsGained} เศษดาว
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                ตั๋วคงเหลือ: <span className="font-extrabold text-slate-900">{gachaState.tickets}</span> ใบ
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsResultOpen(false);
                    if (pullResults.length === 1) handlePull1();
                    else handlePull10();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  สุ่มอีกครั้ง ({pullResults.length === 1 ? '1x' : '10x'})
                </button>
                <button
                  onClick={() => setIsResultOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: BUDDY DETAIL & SKILL VIEWER
      ============================================================================ */}
      {selectedBuddyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${selectedBuddyDetail.badgeBg}`}>
                {selectedBuddyDetail.rarity}
              </span>
              <button
                onClick={() => setSelectedBuddyDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <ChibiBuddyAvatar buddy={selectedBuddyDetail} size="lg" showName={false} />
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedBuddyDetail.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedBuddyDetail.title}
                </p>
                <div className="mt-1 text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 inline-block">
                  ธาตุ: {selectedBuddyDetail.element}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>สกิลประจำตัว: {selectedBuddyDetail.skillName}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedBuddyDetail.skillDesc}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs italic text-indigo-900">
              “{selectedBuddyDetail.quote}”
            </div>

            <div className="flex items-center gap-2 pt-2">
              {gachaState.unlockedBuddyIds.includes(selectedBuddyDetail.id) ? (
                activeBuddy.id === selectedBuddyDetail.id ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs"
                  >
                    ✓ เป็นคู่หูหลักอยู่แล้ว
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleSetActive(selectedBuddyDetail.id);
                      setSelectedBuddyDetail(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    ตั้งเป็นคู่หูหลัก
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs"
                >
                  🔒 ยังไม่ปลดล็อก (สุ่มได้จากกาชา)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: VIEW ALL 22 BUDDIES
      ============================================================================ */}
      {isAllBuddiesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  สมุดรวมคู่หูนักเรียนทั้งหมด ({ALL_BUDDIES.length} คน)
                </h3>
                <p className="text-xs text-slate-500">
                  ปลดล็อกแล้ว {gachaState.unlockedBuddyIds.length} จาก {ALL_BUDDIES.length} คน
                </p>
              </div>
              <button
                onClick={() => setIsAllBuddiesOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRarity(r)}
                    className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                      filterRarity === r
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 'ALL' ? 'ทั้งหมด' : r}
                  </button>
                )
              )}
            </div>

            {/* Buddies Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-1">
              {filteredAllBuddies.map((b) => {
                const isUnlocked = gachaState.unlockedBuddyIds.includes(b.id);
                const isActive = activeBuddy.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBuddyDetail(b)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center ${
                      isActive
                        ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400 shadow-sm'
                        : isUnlocked
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <ChibiBuddyAvatar
                      buddy={b}
                      size="sm"
                      isUnlocked={isUnlocked}
                      showName={false}
                    />
                    <div className="mt-2 w-full">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {b.name}
                      </div>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-semibold inline-block mt-0.5 ${b.badgeBg}`}>
                        {b.rarity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: ADD TICKETS (FREE OR BONUS)
      ============================================================================ */}
      {isAddTicketsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                <span>รับตั๋วสุ่มคู่หูเพิ่ม</span>
              </h3>
              <button
                onClick={() => setIsAddTicketsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              ตั๋วสุ่มสามารถได้รับจากการทำการบ้าน, เช็คชื่อตรงเวลา, และรางวัลกิจกรรมประจำสัปดาห์
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleAddFreeTickets(10)}
                className="w-full p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>🎁 รับโบนัสตั๋วฟรี (ภารกิจสัปดาห์)</span>
                <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[11px]">
                  +10 ใบ
                </span>
              </button>

              <button
                onClick={() => handleAddFreeTickets(50)}
                className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>⚡ โควตาตั๋วทดสอบระบบ (Dev / Test)</span>
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded-lg text-[11px]">
                  +50 ใบ
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: RATE DETAILS & DISCLOSURE
      ============================================================================ */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                รายละเอียดระบบสุ่มคู่หู (Gacha Policy)
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900 font-semibold">
                📌 <strong>กฏ 100% (Strict 100% Rate):</strong>
                <br />
                อัตราการออกสุ่มคำนวณตามมาตรฐานสากล ผลรวมของทุกระดับรวมกันได้ 100.0% พอดี เพื่อความโปร่งใสและเป็นธรรม
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">ตารางอัตราการสุ่ม (Drop Rates):</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Common (40.0%):</strong> น้องโอม, น้องแป้ง, น้องซัน, น้องมายด์</li>
                  <li><strong>Uncommon (35.0%):</strong> น้องพิมพ์, น้องต้น, น้องเจน, น้องพีค</li>
                  <li><strong>Rare (18.0%):</strong> น้องคิน, น้องโนจิ, น้องฟ้า, น้องเบส</li>
                  <li><strong>Epic (5.0%):</strong> น้องลิน, น้องเซน, น้องมิ้น, น้องคิว</li>
                  <li><strong>Legendary (1.8%):</strong> น้องวาเลน, น้องเรย์, น้องอามิ, น้องไทเกอร์</li>
                  <li><strong>Mythic (0.2%):</strong> น้องเซเรน, น้องไนท์</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">ระบบการันตี (Pity Guarantee System):</h4>
                <p>
                  เพื่อป้องกันไม่ให้ผู้เรียนท้อ หากสุ่มติดต่อกันครบ <strong>80 ครั้ง</strong> ระบบจะการันตีคู่หูระดับ <strong>Epic หรือ Legendary</strong> แน่นอน 100% ทันที และเมื่อได้รับระดับพิเศษ ตัวนับการันตีจะรีเซ็ตกลับเป็น 0 เพื่อเริ่มรอบใหม่
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">กรณีได้คู่หูซ้ำ:</h4>
                <p>
                  จะได้รับ <strong>"เศษดาว (Star Shards)"</strong> ตามระดับความหายาก เพื่อนำไปอัปเกรดสกิลคู่หูหรือแลกเปลี่ยนตั๋วสุ่มในอนาคต
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
