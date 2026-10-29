// src/components/student/StudentHomeDashboard.tsx
// หน้าแรก Dashboard ของนักเรียน ตรงตามภาพอ้างอิง media_1791203662191.png 100%
// ประกอบด้วยแบนเนอร์ส่วนที่ 2 (Hero) และส่วนที่ 3 (Right Bottom) ที่ Admin สามารถอัปโหลดได้

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ClipboardCheck,
  Calendar,
  BarChart2,
  ChevronRight,
  ArrowRight,
  Target,
  Trophy,
  Star,
  Zap,
  BookOpen,
  Send,
  Megaphone,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import {
  studentBannerService,
  STUDENT_BANNERS_EVENT,
} from '../../services/studentBannerService';
import { gamificationService } from '../../services/gamificationService';
import { bellScheduleService } from '../../services/bellScheduleService';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';
import { sgsRosterAndSubmissionService } from '../../services/sgsRosterAndSubmissionService';
import { coursesCurriculumService } from '../../services/coursesCurriculumService';
import { authService } from '../../services/authService';
import {
  gachaService,
  BUDDY_CHANGED_EVENT,
  ALL_BUDDIES,
  type GachaBuddy,
} from '../../services/gachaService';
import {
  calculateStudentExp,
  STUDENT_EXP_EVENT,
  type StudentExpCalculation,
} from '../../services/studentExpService';
import { formatClassroomLabel } from '../../services/studentService';
import type { StudentTabKey } from './StudentSidebar';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import type { StudentQuestItem } from '../../types/viewModels';

interface StudentHomeDashboardProps {
  onNavigate: (tab: StudentTabKey) => void;
  onOpenAssignment?: (assignmentId: string) => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentHomeDashboard: React.FC<StudentHomeDashboardProps> = ({
  onNavigate,
  onOpenAssignment,
  currentUser,
}) => {
  const effectiveUser = currentUser || authService.getCurrentUser();
  const studentCode = effectiveUser?.studentCode || '45101';
  const studentRoom = formatClassroomLabel(effectiveUser?.classroomName || effectiveUser?.classroomId) || 'ไม่ระบุห้อง';
  const bellConfig = bellScheduleService.getConfig();

  const [quests, setQuests] = useState<StudentQuestItem[]>([]);
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(() =>
    studentBannerService.getEffectiveBannerUrl('hero')
  );
  const [bottomBannerUrl, setBottomBannerUrl] = useState<string>(() =>
    studentBannerService.getEffectiveBannerUrl('bottom')
  );

  const [activeBuddy, setActiveBuddy] = useState<GachaBuddy>(() =>
    gachaService.getActiveBuddy()
  );
  const [expInfo, setExpInfo] = useState<StudentExpCalculation>(() =>
    calculateStudentExp(effectiveUser?.id, effectiveUser?.studentCode)
  );
  const [isBuddySelectorOpen, setIsBuddySelectorOpen] = useState(false);

  const loadRealQuests = async () => {
    try {
      const termAssignments = sgsRosterAndSubmissionService.getTermAssignments(undefined, studentRoom);
      const allCourses = coursesCurriculumService.getCourses();
      const allSubmissions = sgsRosterAndSubmissionService.getSubmissions();

      const realQuests: StudentQuestItem[] = termAssignments.map((asg) => {
        const sub = allSubmissions.find(
          (s) => s.assignmentId === asg.id && s.studentCode === studentCode
        );
        const isReturnedForRevision = sub?.status === 'RETURNED_REVISION';
        const isSubmitted =
          !!sub &&
          !isReturnedForRevision &&
          (sub.status === 'SUBMITTED_PENDING' ||
            sub.status === 'GRADED' ||
            sub.status === 'EXEMPT_TRANSFERRED');

        const course = allCourses.find((c) => c.code === asg.courseCode);
        const subjectTitle = course
          ? `${course.name} · ${course.code}`
          : asg.courseCode || 'วิชาทั่วไป';

        return {
          id: asg.id,
          subjectTitle,
          title: asg.title,
          dueDateText: asg.dueDate ? `ส่งภายใน ${asg.dueDate}` : 'ไม่ระบุกำหนดส่ง',
          maxScore: asg.maxScore || 10,
          xpReward: (asg.maxScore || 10) * 3,
          status: isSubmitted ? ('SUBMITTED' as const) : ('PENDING' as const),
          statusLabel:
            sub?.status === 'GRADED'
              ? 'ตรวจแล้ว'
              : isReturnedForRevision
              ? 'ครูส่งกลับให้แก้ไข'
              : isSubmitted
              ? 'ส่งแล้ว (รอตรวจ)'
              : 'รอส่งงาน',
        };
      });

      if (realQuests.length > 0) {
        setQuests(realQuests);
      } else {
        const data = await gamificationService.getQuests();
        setQuests(data);
      }
    } catch (err) {
      console.warn('Failed to load real student assignments for dashboard', err);
      const data = await gamificationService.getQuests();
      setQuests(data);
    }
  };

  useEffect(() => {
    loadRealQuests();
    const handleUpdate = () => {
      loadRealQuests();
    };
    window.addEventListener('kp-sgs-roster-updated', handleUpdate);
    window.addEventListener('kp-copilot-updated', handleUpdate);
    window.addEventListener('kp-grading-queue-updated', handleUpdate);
    window.addEventListener('kps-data-sync-event', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
      window.removeEventListener('kp-copilot-updated', handleUpdate);
      window.removeEventListener('kp-grading-queue-updated', handleUpdate);
      window.removeEventListener('kps-data-sync-event', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [studentRoom, studentCode]);

  useEffect(() => {
    const handleUpdate = () => {
      setHeroBannerUrl(studentBannerService.getEffectiveBannerUrl('hero'));
      setBottomBannerUrl(studentBannerService.getEffectiveBannerUrl('bottom'));
    };
    window.addEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    const handleBuddyUpdate = () => {
      setActiveBuddy(gachaService.getActiveBuddy());
    };
    const handleExpUpdate = () => {
      setExpInfo(calculateStudentExp(effectiveUser?.id, effectiveUser?.studentCode));
    };
    window.addEventListener(BUDDY_CHANGED_EVENT, handleBuddyUpdate);
    window.addEventListener(STUDENT_EXP_EVENT, handleExpUpdate);
    window.addEventListener('kp-copilot-updated', handleExpUpdate);
    return () => {
      window.removeEventListener(BUDDY_CHANGED_EVENT, handleBuddyUpdate);
      window.removeEventListener(STUDENT_EXP_EVENT, handleExpUpdate);
      window.removeEventListener('kp-copilot-updated', handleExpUpdate);
    };
  }, [effectiveUser?.id, effectiveUser?.studentCode]);

  const pendingQuests = quests.filter((q) => q.status === 'PENDING');
  const enrolledSubjects = TEACHER_SUBJECTS_LIST.filter((s) =>
    s.classrooms.some((c) => {
      const normC = formatClassroomLabel(c);
      const normRoom = formatClassroomLabel(studentRoom);
      return normC === normRoom || normC.includes(normRoom) || normRoom.includes(normC);
    })
  );

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in text-slate-800 select-none pb-8">
      {/* Layout Grid: Center Main Area (8 cols) vs Right Column (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            CENTER MAIN COLUMN (8 cols on lg)
        ========================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* BANNER 2: Main Hero Banner (Admin can upload) */}
          <div className="relative rounded-2xl overflow-hidden border border-sky-100 shadow-2xs group bg-white">
            <img
              src={heroBannerUrl}
              alt="แบนเนอร์หลักการเรียนรู้"
              className="w-full h-auto object-cover max-h-[190px] sm:max-h-[220px] transition-transform duration-300 group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  '/images/banners/hero-banner.png'
                );
              }}
            />
          </div>

          {/* 4 Quick Action Cards (4-column grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: ดูรายวิชาของฉัน (Purple) */}
            <div
              onClick={() => onNavigate('courses')}
              className="bg-white rounded-2xl p-3.5 border border-purple-100/80 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mt-3 group-hover:text-purple-700">
                  <span className="truncate">ดูรายวิชาของฉัน</span>
                  <ChevronRight className="w-4 h-4 text-purple-500 shrink-0" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                เช็กเนื้อหา / งานที่ได้รับ
              </p>
            </div>

            {/* Card 2: งานที่ได้รับมอบหมาย (Sky/Blue) */}
            <div
              onClick={() => onNavigate('missions')}
              className="bg-white rounded-2xl p-3.5 border border-sky-100/80 shadow-2xs hover:shadow-xs hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between relative group"
            >
              {pendingQuests.length > 0 && (
                <span className="absolute top-3.5 right-3.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-2xs">
                  {pendingQuests.length}
                </span>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mt-3 group-hover:text-sky-700">
                  <span className="truncate">งานที่ได้รับมอบหมาย</span>
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {pendingQuests.length > 0 ? `มี ${pendingQuests.length} งานที่ต้องทำ` : 'ไม่มีงานค้าง ✨'}
              </p>
            </div>

            {/* Card 3: ตารางเรียน (Amber) */}
            <div
              onClick={() => onNavigate('timetable')}
              className="bg-white rounded-2xl p-3.5 border border-amber-100/80 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mt-3 group-hover:text-amber-700">
                  <span className="truncate">ตารางเรียน</span>
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                วันนี้มี {bellConfig.totalPeriodsPerDay} คาบ
              </p>
            </div>

            {/* Card 4: ผลการเรียน (Emerald) */}
            <div
              onClick={() => onNavigate('gradebook')}
              className="bg-white rounded-2xl p-3.5 border border-emerald-100/80 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mt-3 group-hover:text-emerald-700">
                  <span className="truncate">ผลการเรียน</span>
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                ดูเกรดและพัฒนาการ
              </p>
            </div>
          </div>

          {/* Section: งานที่ต้องทำ (Assignments List) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  งานที่ต้องทำ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('missions')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Assignment Cards List */}
            <div className="space-y-3">
              {pendingQuests.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    ไม่มีงานค้างในขณะนี้
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    คุณส่งงานครบถ้วนหรือยังไม่มีงานใหม่ที่ได้รับมอบหมาย ยอดเยี่ยมมาก! ✨
                  </p>
                </div>
              ) : (
                pendingQuests.slice(0, 3).map((quest) => (
                  <div
                    key={quest.id}
                    className="rounded-2xl border border-slate-200/80 hover:border-blue-300 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-2xs bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium">
                          {quest.subjectTitle}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {quest.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          กำหนดส่ง: {quest.dueDateText} · เต็ม {quest.maxScore} คะแนน
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenAssignment?.(quest.id);
                        onNavigate('missions');
                      }}
                      className="self-end sm:self-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer hover:scale-102"
                    >
                      <span>ทำงาน</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (4 cols on lg)
        ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: ระดับของฉัน (My Level) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span>ระดับของฉัน</span>
                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[100px]">
                  ({activeBuddy.name})
                </span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Lv.{expInfo.level}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBuddySelectorOpen(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-blue-200/60"
                  title="เปลี่ยนคู่หูบัดดี้"
                >
                  เปลี่ยนคู่หู
                </button>
              </div>
            </div>

            {/* Mascot Avatar & Details */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => setIsBuddySelectorOpen(true)}
                className="w-16 h-16 rounded-2xl border border-slate-200 bg-amber-50/40 p-1 flex items-center justify-center relative shadow-2xs overflow-hidden shrink-0 cursor-pointer hover:border-amber-300 hover:scale-105 transition-all"
                title={`คลิกเพื่อเปลี่ยนคู่หู (ปัจจุบัน: ${activeBuddy.name})`}
              >
                <img
                  src={`/images/buddies/${activeBuddy.id}.png`}
                  alt={activeBuddy.name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute(
                      'src',
                      '/images/buddies/cat_mascot.png'
                    );
                  }}
                />
                <span className="absolute top-1 right-1 text-xs text-amber-400">⭐</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{activeBuddy.name}</h4>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${activeBuddy.badgeBg}`}>
                    {activeBuddy.rarity}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5" title={activeBuddy.title || activeBuddy.quote}>
                  {activeBuddy.title || activeBuddy.quote}
                </p>
                <p className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                  ⚡ บัฟ: {activeBuddy.skillName}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>เลเวล {expInfo.level}</span>
                <span className="text-slate-500 tabular-nums">
                  {expInfo.currentLevelXp} / {expInfo.nextLevelXp} XP (รวม {expInfo.totalXp} XP)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${expInfo.progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 text-center">
                อีก {expInfo.xpToNextLevel} XP จะถึงเลเวล {expInfo.level + 1}
              </div>
            </div>

            {/* Trophy & Gacha Details Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('gacha')}
                className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-purple-200/60 cursor-pointer shadow-2xs"
              >
                <span>🎲 สุ่มบัดดี้</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('trophy')}
                className="py-2 px-3 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/60 cursor-pointer shadow-2xs"
              >
                <span>🏆 ตู้รางวัล</span>
              </button>
            </div>
          </div>

          {/* Card 2: สรุปการเรียนรู้ (Learning Summary) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  สรุปการเรียนรู้
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('gradebook')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4 Stat Boxes (2x2 grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Stat 1: วิชาที่เรียน */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    วิชาที่เรียน
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-blue-600 mt-0.5">
                    {enrolledSubjects.length} วิชา
                  </div>
                </div>
              </div>

              {/* Stat 2: งานที่ต้องทำ */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    งานที่ต้องทำ
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-blue-600 mt-0.5">
                    {pendingQuests.length} งาน
                  </div>
                </div>
              </div>

              {/* Stat 3: คะแนนรวม */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    คะแนนรวม
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                    รอประเมิน
                  </div>
                </div>
              </div>

              {/* Stat 4: XP ทั้งหมด */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    XP ทั้งหมด
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                    {expInfo.totalXp.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: เมนูด่วน (Quick Menu) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                เมนูด่วน
              </h3>
            </div>

            {/* 4 Circular Action Buttons */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Item 1: ดูรายวิชาของฉัน */}
              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-sky-200 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 font-medium mt-1.5 truncate max-w-full group-hover:text-sky-700">
                  ดูรายวิชาของฉัน
                </span>
              </button>

              {/* Item 2: ส่งงาน */}
              <button
                type="button"
                onClick={() => onNavigate('missions')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-purple-200 shadow-2xs">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 font-medium mt-1.5 truncate max-w-full group-hover:text-purple-700">
                  ส่งงาน
                </span>
              </button>

              {/* Item 3: ตารางเรียน */}
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-emerald-200 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 font-medium mt-1.5 truncate max-w-full group-hover:text-emerald-700">
                  ตารางเรียน
                </span>
              </button>

              {/* Item 4: ประกาศ */}
              <button
                type="button"
                onClick={() => onNavigate('announcements')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-rose-200 shadow-2xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 font-medium mt-1.5 truncate max-w-full group-hover:text-rose-700">
                  ประกาศ
                </span>
              </button>
            </div>
          </div>

          {/* BANNER 3: Right Bottom Motivational Quote Banner (Admin can upload) */}
          <div className="relative rounded-2xl overflow-hidden border border-sky-100 shadow-2xs group bg-white">
            <img
              src={bottomBannerUrl}
              alt="แบนเนอร์ข้อคิดกำลังใจ"
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  '/images/banners/bottom-banner.png'
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: QUICK BUDDY SELECTOR (เลือกคู่หูบัดดี้ประจำตัว)
      ========================================================================= */}
      {isBuddySelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>เลือกคู่หูบัดดี้ประจำตัว</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {ALL_BUDDIES.length} คน
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  เลือกคู่หูที่ต้องการให้อยู่เคียงข้างคุณเพื่อรับบัฟและช่วยเตือนการเรียนรู้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBuddySelectorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buddies Grid */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const gachaState = gachaService.getState(currentUser?.id);
                  const unlockedBuddyIds = gachaState.unlockedBuddyIds || ['buddy-1'];
                  return ALL_BUDDIES.map((buddy) => {
                    const isActive = activeBuddy.id === buddy.id;
                    const isUnlocked = unlockedBuddyIds.includes(buddy.id);
                    return (
                      <div
                        key={buddy.id}
                        onClick={() => {
                          if (!isUnlocked) return;
                          gachaService.setActiveBuddy(buddy.id);
                          setActiveBuddy(buddy);
                          setIsBuddySelectorOpen(false);
                        }}
                        className={`p-3 rounded-2xl border transition-all flex items-center gap-3 relative ${
                          isActive
                            ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20 cursor-pointer'
                            : isUnlocked
                            ? 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white cursor-pointer'
                            : 'border-slate-200/60 bg-slate-100/60 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl border border-slate-200/80 bg-amber-50/40 p-1 flex items-center justify-center shrink-0 relative overflow-hidden">
                          <img
                            src={`/images/buddies/${buddy.id}.png`}
                            alt={buddy.name}
                            className={`w-full h-full object-cover rounded-lg ${!isUnlocked ? 'grayscale contrast-75' : ''}`}
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute(
                                'src',
                                '/images/buddies/cat_mascot.png'
                              );
                            }}
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white stroke-[3]" />
                            </div>
                          )}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-xs">
                              🔒
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {buddy.name}
                            </h4>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${buddy.badgeBg}`}
                            >
                              {buddy.rarity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5" title={buddy.title}>
                            {buddy.title}
                          </p>
                          <p className="text-[10px] text-blue-600 font-semibold truncate mt-0.5">
                            ⚡ {buddy.skillName}
                          </p>
                        </div>

                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600 text-white shrink-0">
                            ใช้อยู่
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors shrink-0 cursor-pointer"
                          >
                            เลือก
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-200 text-slate-500 shrink-0">
                            ยังไม่ปลดล็อก
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsBuddySelectorOpen(false);
                  onNavigate('gacha');
                }}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>🎲 ไปที่ตู้สุ่มบัดดี้ (Gacha)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBuddySelectorOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
