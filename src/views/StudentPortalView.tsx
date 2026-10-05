import React, { useState, useEffect } from 'react';
import { StudentSidebar, type StudentTabKey } from '../components/student/StudentSidebar';
import { StudentHeader } from '../components/student/StudentHeader';
import { AdventureHeroCard } from '../components/student/AdventureHeroCard';
import { QuickStatGrid } from '../components/student/QuickStatGrid';
import { QuestBoard } from '../components/student/QuestBoard';
import { CompanionCard } from '../components/student/CompanionCard';
import { MilestoneBadgesCard } from '../components/student/MilestoneBadgesCard';
import { StudentMissionsView } from './StudentMissionsView';
import { StudentArenaView } from './StudentArenaView';
import { StudentGradebookView } from './StudentGradebookView';
import { StudentTrophyView } from './StudentTrophyView';
import { StudentHomeVisitFormView } from './StudentHomeVisitFormView';
import { StudentCouncilAffairsPortalView } from './StudentCouncilAffairsPortalView';
import { StudentGachaView } from './StudentGachaView';
import { StudentMobileCareView } from '../components/student/StudentMobileCareView';
import { StudentAnimeAppView } from '../components/student/StudentAnimeAppView';
import { studentAdventureQuests } from '../data/mockData';
import type { StudentQuestItem } from '../types/viewModels';
import { gamificationService } from '../services/gamificationService';
import {
  MapPin,
  ArrowRight,
  Vote,
  FileCheck2,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  KUTCHAP_SCHOOL_INFO,
  SCHOOL_ROLE_PROFILES,
  type SchoolUserRole,
} from '../config/schoolRoles';

interface StudentPortalViewProps {
  onExit: () => void;
  studentRole?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL';
  onChangeStudentRole?: (role: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL') => void;
  onSwitchToTeacherRole?: (role: SchoolUserRole) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  onExit,
  studentRole = 'STUDENT_GENERAL',
  onChangeStudentRole,
  onSwitchToTeacherRole,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTabKey>('home');
  const [currentXp, setCurrentXp] = useState(650);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [councilNotice, setCouncilNotice] = useState<string | null>(null);

  const profile = SCHOOL_ROLE_PROFILES[studentRole];

  useEffect(() => {
    gamificationService.claimDailyCheckin('stu-2').then((res) => {
      if (res.isFirstToday) {
        setCurrentXp((prev) => prev + res.xpAwarded);
      }
    });
  }, []);

  const handleOpenQuest = (_quest: StudentQuestItem) => {
    setActiveTab('missions');
  };

  const handleGoToMissions = () => {
    setActiveTab('missions');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Student Specific Sidebar */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        studentRole={studentRole}
        onChangeStudentRole={onChangeStudentRole}
        onSwitchToTeacherRole={onSwitchToTeacherRole}
        onLogout={onExit}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onExit={onExit}
          totalXp={currentXp}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden">
          {activeTab === 'home' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Greeting Header & Role Badge at โรงเรียนกุดจับประชาสรรค์ */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                      สวัสดี {profile.userName} 👋
                    </h1>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${profile.badgeColor}`}
                    >
                      {profile.badgeText}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-semibold">
                      {KUTCHAP_SCHOOL_INFO.nameTh} ({KUTCHAP_SCHOOL_INFO.districtProvince})
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {profile.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('gacha')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black transition-all shadow-sm hover:scale-105 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span>สุ่มคู่หู (Gacha)</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-extrabold">
                      12 ใบ
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('mobile-care')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0C6D5B] hover:bg-[#095748] text-white text-xs font-bold transition-all shadow-sm hover:scale-105 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-300" />
                    <span>ดูแล นร. (9 หน้าจอ)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('anime-app')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:scale-105 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-sky-200" />
                    <span>แอปนักเรียน (10 หน้าจออนิเมะ)</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-black">
                      ใหม่!
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('home-visit')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors shadow-xs"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>เยี่ยมบ้าน นร.01 (+50 XP)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('student-leave')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors shadow-xs"
                  >
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    <span>ยื่นใบลาออนไลน์</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('student-council')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors shadow-xs"
                  >
                    <Vote className="w-4 h-4 text-indigo-600" />
                    <span>เลือกตั้งสภานักเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Special Banner for STUDENT_COUNCIL (คณะกรรมการสภานักเรียน โรงเรียนกุดจับประชาสรรค์) */}
              {studentRole === 'STUDENT_COUNCIL' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md border border-purple-700/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[11px] font-bold mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>สิทธิ์พิเศษ: คณะกรรมการสภานักเรียน โรงเรียนกุดจับประชาสรรค์</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold">
                        ศูนย์ปฏิบัติงานสภานักเรียนประจำวัน (ร่วมกับฝ่ายกิจการนักเรียน)
                      </h2>
                      <p className="text-xs text-purple-200/90 mt-0.5">
                        ช่วยครูเวรตรวจแถวตอนเช้า (07:45 น.) • รับเรื่องร้องเรียนจากเพื่อนนักเรียน • บริหารการเลือกตั้งออนไลน์
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCouncilNotice(
                            'ส่งยอดตรวจแถวตอนเช้า (07:45 น.) สายชั้น ม.ต้น–ม.ปลาย ให้ครูวิภาดา (ฝ่ายกิจการนักเรียน) เรียบร้อยแล้ว!'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>ส่งยอดตรวจแถวเช้า 07:45 น.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('council-affairs')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-colors"
                      >
                        <Megaphone className="w-4 h-4" />
                        <span>เปิดกระดานสภานักเรียน (3 เรื่องใหม่)</span>
                      </button>
                    </div>
                  </div>

                  {councilNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>{councilNotice}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Two-Column Grid: Left (Adventure + Quests) vs Right (Pet + Badges) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* 1. Hero Adventure Banner */}
                  <AdventureHeroCard onGoToMissions={handleGoToMissions} />

                  {/* 2. Three Quick Stats */}
                  <QuickStatGrid
                    pendingCount={1}
                    submittedCount={5}
                    xpRewardedCount={650}
                  />

                  {/* 3. Quest Board */}
                  <div id="quest-board">
                    <QuestBoard
                      quests={studentAdventureQuests}
                      onOpenQuest={handleOpenQuest}
                    />
                  </div>
                </div>

                {/* Right Column (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* 4. Companion Pet Card */}
                  <CompanionCard
                    name="โมจิ"
                    title="จิ้งจอกใบไม้ · เติบโตไปด้วยกัน"
                    level={2}
                    currentXp={650}
                    nextLevelXp={1000}
                    onChangeCompanion={() => setActiveTab('gacha')}
                    onOpenGacha={() => setActiveTab('gacha')}
                  />

                  {/* 5. Milestone Badges */}
                  <div onClick={() => setActiveTab('trophy')} className="cursor-pointer">
                    <MilestoneBadgesCard />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gacha' && (
            <StudentGachaView
              onBack={() => setActiveTab('home')}
              onSelectBuddy={() => {
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'mobile-care' && (
            <StudentMobileCareView onExit={() => setActiveTab('home')} />
          )}

          {activeTab === 'anime-app' && (
            <StudentAnimeAppView onExit={() => setActiveTab('home')} />
          )}

          {activeTab === 'missions' && <StudentMissionsView />}

          {activeTab === 'arena' && <StudentArenaView />}

          {activeTab === 'gradebook' && <StudentGradebookView />}

          {activeTab === 'trophy' && (
            <StudentTrophyView
              onNavigateToGacha={() => setActiveTab('gacha')}
              onNavigateToMissions={() => setActiveTab('missions')}
            />
          )}

          {activeTab === 'home-visit' && (
            <StudentHomeVisitFormView
              onAwardXp={(xp) => setCurrentXp((prev) => prev + xp)}
            />
          )}

          {activeTab === 'student-leave' && (
            <StudentCouncilAffairsPortalView
              section="LEAVE"
              onAwardXp={(xp) => setCurrentXp((prev) => prev + xp)}
            />
          )}

          {(activeTab === 'student-council' || activeTab === 'council-affairs') && (
            <StudentCouncilAffairsPortalView
              section="COUNCIL"
              onAwardXp={(xp) => setCurrentXp((prev) => prev + xp)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
