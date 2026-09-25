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
import { studentAdventureQuests } from '../data/mockData';
import type { StudentQuestItem } from '../types/viewModels';
import { gamificationService } from '../services/gamificationService';
import { MapPin, ArrowRight, Vote, FileCheck2 } from 'lucide-react';

interface StudentPortalViewProps {
  onExit: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<StudentTabKey>('home');
  const [currentXp, setCurrentXp] = useState(650);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
              {/* Greeting Header & Quick Callouts */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                      สวัสดี ด.ช. ทัตธน คำฝั้น 👋
                    </h1>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium">
                      ม.3/1 (รหัส 45102)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    วันนี้มาเก่งขึ้นอีกนิด ไปด้วยกันนะ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    onChangeCompanion={() => setActiveTab('trophy')}
                  />

                  {/* 5. Milestone Badges */}
                  <div onClick={() => setActiveTab('trophy')} className="cursor-pointer">
                    <MilestoneBadgesCard />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'missions' && <StudentMissionsView />}

          {activeTab === 'arena' && <StudentArenaView />}

          {activeTab === 'gradebook' && <StudentGradebookView />}

          {activeTab === 'trophy' && <StudentTrophyView />}

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
