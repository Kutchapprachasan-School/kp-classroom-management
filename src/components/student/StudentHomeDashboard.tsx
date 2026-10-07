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
} from 'lucide-react';
import {
  studentBannerService,
  STUDENT_BANNERS_EVENT,
} from '../../services/studentBannerService';
import { gamificationService } from '../../services/gamificationService';
import { cleanSlateService } from '../../services/cleanSlateService';
import { bellScheduleService } from '../../services/bellScheduleService';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';
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
  const isClean = cleanSlateService.isCleanSlateActive();
  const studentRoom = currentUser?.classroomId || 'ม.3/1';
  const bellConfig = bellScheduleService.getConfig();

  const [quests, setQuests] = useState<StudentQuestItem[]>([]);
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(() =>
    studentBannerService.getEffectiveBannerUrl('hero')
  );
  const [bottomBannerUrl, setBottomBannerUrl] = useState<string>(() =>
    studentBannerService.getEffectiveBannerUrl('bottom')
  );

  useEffect(() => {
    gamificationService.getQuests().then(setQuests);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setHeroBannerUrl(studentBannerService.getEffectiveBannerUrl('hero'));
      setBottomBannerUrl(studentBannerService.getEffectiveBannerUrl('bottom'));
    };
    window.addEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
    return () => window.removeEventListener(STUDENT_BANNERS_EVENT, handleUpdate);
  }, []);

  const pendingQuests = quests.filter((q) => q.status === 'PENDING');
  const enrolledSubjects = TEACHER_SUBJECTS_LIST.filter((s) =>
    s.classrooms.some((c) => c === studentRoom || c.includes(studentRoom))
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
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                ระดับของฉัน
              </h3>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isClean ? 'Lv.1' : 'Lv.2'}
              </span>
            </div>

            {/* Mascot Avatar & Details */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-amber-50/40 p-1 flex items-center justify-center relative shadow-2xs overflow-hidden shrink-0">
                <img
                  src="/images/buddies/buddy-l1.png"
                  alt="โมจิ"
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
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm truncate">โมจิ</h4>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {isClean ? 'เริ่มต้นการเรียนรู้และเติบโตไปด้วยกัน!' : 'วิ่งออกไป! เติบโตไปด้วยกัน!'}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{isClean ? 'เลเวล 1' : 'เลเวล 2'}</span>
                <span className="text-slate-500">{isClean ? '0 / 100 XP' : '650 / 1000 XP'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: isClean ? '0%' : '65%' }}
                />
              </div>
              <div className="text-[11px] text-slate-400 text-center">
                {isClean ? 'อีก 100 XP จะถึงเลเวล 2' : 'อีก 350 XP จะถึงเลเวล 3'}
              </div>
            </div>

            {/* Trophy Details Button */}
            <button
              type="button"
              onClick={() => onNavigate('trophy')}
              className="w-full py-2.5 px-3 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-200/60 cursor-pointer shadow-2xs"
            >
              <span>🏆 ดูรายละเอียดรางวัล</span>
            </button>
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
                    {isClean ? 'รอประเมิน' : '88.5%'}
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
                    {isClean ? '0' : '670'}
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
    </div>
  );
};
