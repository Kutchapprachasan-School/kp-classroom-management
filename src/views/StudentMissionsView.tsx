import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Link,
  Sparkles,
  Clock,
  Trophy,
  Zap,
  CheckCircle2,
  HelpCircle,
  Award,
  Folder,
  Copy,
  Check,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import { sgsRosterAndSubmissionService } from '../services/sgsRosterAndSubmissionService';
import { cleanSlateService } from '../services/cleanSlateService';
import { validateGoogleDriveUrl, generateRecommendedFolderPath } from '../utils/googleDriveUtils';
import type { StudentQuestItem, StudentLeaderboardEntry } from '../types/viewModels';
import type { AuthUser } from '../services/authService';

interface StudentMissionsViewProps {
  currentUser?: AuthUser | null;
}

export const StudentMissionsView: React.FC<StudentMissionsViewProps> = ({ currentUser }) => {
  const isClean = cleanSlateService.isCleanSlateActive();
  const [quests, setQuests] = useState<StudentQuestItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');
  const [selectedQuest, setSelectedQuest] = useState<StudentQuestItem | null>(null);
  const [submissionType, setSubmissionType] = useState<'R2_FILE' | 'CANVA_VIDEO' | 'GOOGLE_DRIVE'>('R2_FILE');
  const [submitLink, setSubmitLink] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('perspective_2point_45102.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folderCopied, setFolderCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Weekly Quiz Modal State
  const [isWeeklyQuizOpen, setIsWeeklyQuizOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [hasCompletedWeekly, setHasCompletedWeekly] = useState(false);

  const loadQuests = async () => {
    const data = await gamificationService.getQuests();
    setQuests(data);
    const lb = await gamificationService.getLeaderboard();
    setLeaderboard(lb);
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const allCount = quests.length;
  const pendingCount = quests.filter((q) => q.status === 'PENDING').length;
  const submittedCount = quests.filter((q) => q.status === 'SUBMITTED').length;

  const filteredQuests = quests.filter((q) => {
    if (filter === 'ALL') return true;
    return q.status === filter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuest) return;

    if (submissionType === 'GOOGLE_DRIVE') {
      const driveValidation = validateGoogleDriveUrl(submitLink);
      if (!driveValidation.isValidFormat) {
        setToastMsg(`⚠️ ${driveValidation.permissionWarningNotice}`);
        setTimeout(() => setToastMsg(null), 3500);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await gamificationService.submitQuest(selectedQuest.id, submitLink, 'stu-2');

      if (submissionType === 'GOOGLE_DRIVE') {
        sgsRosterAndSubmissionService.submitStudentWorkToR2({
          assignmentId: 'asg-3',
          studentCode: '45102',
          workTitle: selectedQuest.title,
          externalLinkUrl: submitLink.trim(),
          academicYearTerm: '1/2569',
          originalSizeKb: 0,
          compressedSizeKb: 0,
        });
        setToastMsg(
          `📁 ส่งโฟลเดอร์ Google Drive สำเร็จ! ประหยัดพื้นที่จัดเก็บโรงเรียน 100% (+${selectedQuest.xpReward} XP)`
        );
      } else if (submissionType === 'CANVA_VIDEO') {
        sgsRosterAndSubmissionService.submitStudentWorkToR2({
          assignmentId: 'asg-3',
          studentCode: '45102',
          workTitle: selectedQuest.title,
          externalLinkUrl: submitLink.trim(),
          academicYearTerm: '1/2569',
          originalSizeKb: 0,
          compressedSizeKb: 0,
        });
        setToastMsg(
          `🎨 ส่งลิงก์ชิ้นงาน Canva สำเร็จ! (+${selectedQuest.xpReward} XP)`
        );
      } else {
        sgsRosterAndSubmissionService.submitStudentWorkToR2({
          assignmentId: 'asg-3',
          studentCode: '45102',
          workTitle: selectedQuest.title,
          fileName: selectedFileName || 'student_work_45102.jpg',
          originalSizeKb: 4250,
          compressedSizeKb: 148,
          academicYearTerm: '1/2569',
        });
        setToastMsg(
          `☁️ อัปโหลด "${selectedFileName.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" (บีบอัดเหลือ 148 KB) เข้า Cloudflare R2 สำเร็จ! (+${selectedQuest.xpReward} XP)`
        );
      }

      await loadQuests();
      setTimeout(() => setToastMsg(null), 3500);
      setSelectedQuest(null);
      setSubmitLink('');
      setSubmissionType('R2_FILE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    setHasCompletedWeekly(true);
    setToastMsg('🎉 ยินดีด้วย! ทำแบบฝึกหัดสัปดาห์ที่ 8 ครบ 3 ข้อ ได้รับ +200 XP เรียบร้อย!');
    setTimeout(() => {
      setIsWeeklyQuizOpen(false);
      setToastMsg(null);
    }, 2500);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto sm:max-w-2xl lg:max-w-3xl pb-24 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Active Buff Banner */}
      <div className="bg-[#E8F8F2] border border-[#A7F3D0] rounded-2xl px-4 py-3 flex items-center justify-between text-[#065F46] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse shrink-0" />
          <span>ACTIVE BUFF: มีพลังเพิ่มขึ้น (XP x1.2)</span>
        </div>
        <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
      </div>

      {/* 2. Weekly Event Card (กิจกรรมประจำสัปดาห์) */}
      <div className="bg-[#FFFDF5] border border-[#FDE68A] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-200 via-yellow-100 to-amber-300 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs text-2xl">
            🏆
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[#163A66]">
                กิจกรรมประจำสัปดาห์
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                สัปดาห์ที่ 8
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] flex items-center gap-1">
                ⭐ 200 XP
              </span>
            </div>
            <p className="text-xs text-[#6B7C93] mt-0.5 truncate sm:whitespace-normal">
              ทำแบบฝึกหัดให้ครบ 3 ข้อ เพื่อรับรางวัล
            </p>
          </div>
        </div>

        {hasCompletedWeekly ? (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>สำเร็จแล้ว</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsWeeklyQuizOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>เริ่มทำ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Section: การบ้านและภารกิจ Header & 3 Tabs */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-[#0D9488]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#163A66]">
            การบ้านและภารกิจ
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-[#64748B] hover:text-[#163A66]'
            }`}
          >
            ทั้งหมด {allCount}
          </button>
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              filter === 'PENDING'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-[#64748B] hover:text-[#163A66]'
            }`}
          >
            รอส่ง {pendingCount}
          </button>
          <button
            type="button"
            onClick={() => setFilter('SUBMITTED')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              filter === 'SUBMITTED'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-[#64748B] hover:text-[#163A66]'
            }`}
          >
            ส่งแล้ว {submittedCount}
          </button>
        </div>
      </div>

      {/* 4. Assignments List or Empty State */}
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6EEF7] p-8 sm:p-12 text-center shadow-card space-y-4">
            {/* Custom SVG Illustration: Document Sheet with blue lines, checkmark badge, and sparkles */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 120" className="w-20 h-24 drop-shadow-sm">
                <defs>
                  <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F1F5F9" />
                  </linearGradient>
                </defs>
                <path
                  d="M 15 10 L 65 10 L 85 30 L 85 110 L 15 110 Z"
                  fill="url(#docGrad)"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  rx="4"
                />
                <path
                  d="M 65 10 L 65 30 L 85 30 Z"
                  fill="#E2E8F0"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />
                <line x1="28" y1="42" x2="68" y2="42" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
                <line x1="28" y1="56" x2="60" y2="56" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
                <line x1="28" y1="70" x2="72" y2="70" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
                <line x1="28" y1="84" x2="52" y2="84" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
              </svg>

              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-white">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <div className="absolute -top-1 -right-2 text-amber-400 text-sm">✦</div>
              <div className="absolute top-2 -left-2 text-amber-300 text-xs">✨</div>
              <div className="absolute bottom-2 -left-3 text-emerald-400 text-xs">✦</div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#163A66]">
                ไม่มีงานค้างในขณะนี้
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7C93] mt-2 whitespace-pre-line leading-relaxed">
                เยี่ยมมาก! คุณทำงานครบแล้ว{"\n"}รักษาผลงานดี ๆ แบบนี้ต่อไปนะครับ/ค่ะ
              </p>
            </div>
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className="bg-white rounded-2xl border border-[#E6EEF7] p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0D9488] uppercase tracking-wide">
                      {quest.subjectTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {quest.statusLabel}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#163A66] text-sm">
                    {quest.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#6B7C93]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quest.dueDateText}
                    </span>
                    <span>•</span>
                    <span>เต็ม {quest.maxScore} คะแนน</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  <span>+{quest.xpReward} XP</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuest(quest)}
                  className="px-4 py-2 bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{quest.status === 'PENDING' ? 'ส่งงาน' : 'ดูงาน'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Weekly Leaderboard Bottom Card */}
      <div
        onClick={() => setIsLeaderboardModalOpen(true)}
        className="bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-card hover:shadow-card-hover transition-all flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-lg shadow-2xs group-hover:scale-105 transition-transform">
            🏆
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-[#163A66] flex items-center gap-1.5">
              <span>ชั้นอันดับประจำสัปดาห์</span>
            </h4>
            <p className="text-[11px] text-[#6B7C93] truncate sm:whitespace-normal">
              สู้ต่อไปนะ! ทุกความพยายามของคุณมีค่า และจะนำไปสู่ความสำเร็จในอนาคต
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-bold">
            Top 5
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Modal: Weekly Leaderboard Dialog */}
      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-[#163A66] text-base">
                    ชั้นอันดับประจำสัปดาห์
                  </h3>
                  <p className="text-[11px] text-[#6B7C93]">ห้องเรียน ม.3/1 • Top 5</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">เริ่มต้นการเก็บคะแนนสัปดาห์นี้</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ส่งงานเป็นคนแรกเพื่อขึ้นแท่นอันดับ 1 ของห้องเรียน! ✨
                  </p>
                </div>
              ) : (
                leaderboard.slice(0, 5).map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      user.rank === 1
                        ? 'bg-amber-50/70 border border-amber-200/60'
                        : user.rank === 2
                        ? 'bg-slate-50 border border-slate-200/60'
                        : user.rank === 3
                        ? 'bg-orange-50/40 border border-orange-200/40'
                        : 'bg-white border border-[#E6EEF7]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs font-black text-slate-500">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                      </span>
                      <span className="text-lg">{user.avatarText || '👤'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#163A66] truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-[#6B7C93]">
                          {user.classroom || 'ม.3/1'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-orange-600 tabular-nums">
                        {user.xp.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-0.5">XP</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* My Rank Card */}
            <div className="pt-3 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 text-center text-xs font-black text-slate-600">
                  {isClean ? '-' : '#8'}
                </span>
                <span className="text-lg">🦊</span>
                <div>
                  <p className="text-xs font-bold text-[#163A66]">
                    คุณ ({currentUser?.name || 'นักเรียน'})
                  </p>
                  <p className="text-[10px] text-[#6B7C93]">
                    {isClean ? 'เริ่มต้นสะสมแต้ม XP' : 'อีก 70 XP เพื่อเลื่อนอันดับ'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#163A66]">
                  {isClean ? '0' : '650'}
                </span>
                <span className="text-[10px] text-slate-400 ml-0.5">XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Weekly Quiz (แบบฝึกหัด 3 ข้อ) */}
      {isWeeklyQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-orange-600">แบบฝึกหัดสัปดาห์ที่ 8</span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  วินัยในตนเองและการจัดระเบียบ (3 ข้อ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyQuizOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {/* 3 Questions */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>ข้อ 1: เมื่อได้รับการบ้านมา ควรทำสิ่งใดเป็นลำดับแรก?</span>
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  {['จดบันทึกกำหนดส่งและวางแผนเวลา', 'รอให้ใกล้ถึงวันส่งค่อยเริ่มทำ', 'แชร์ให้เพื่อนทำแทน'].map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, 1: i }))}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                        quizAnswers[1] === i
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {i + 1}. {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>ข้อ 2: พฤติกรรมใดแสดงถึง &ldquo;ความมีวินัยในตนเอง&rdquo; ได้ดีที่สุด?</span>
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  {['ทำการบ้านตรงเวลาแม้ไม่มีใครคอยเตือน', 'ทำเฉพาะวันที่ครูบอกจะตรวจ', 'เล่นเกมก่อนเสมอ'].map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, 2: i }))}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                        quizAnswers[2] === i
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {i + 1}. {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>ข้อ 3: ประโยชน์หลักของการจัดระเบียบโต๊ะเรียนคืออะไร?</span>
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  {['หยิบจับอุปกรณ์ง่าย ไม่เสียเวลาค้นหา และมีสมาธิ', 'เอาไว้โชว์เพื่อน', 'ไม่มีผลอะไร'].map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, 3: i }))}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                        quizAnswers[3] === i
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {i + 1}. {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                ตอบแล้ว {Object.keys(quizAnswers).length}/3 ข้อ
              </span>
              <button
                type="button"
                disabled={Object.keys(quizAnswers).length < 3 || quizFinished}
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>ส่งคำตอบ & รับ 200 XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Homework Submission Drawer */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#0C6D5B]">{selectedQuest.subjectTitle}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedQuest.title}</h3>
              </div>
              <button
                onClick={() => setSelectedQuest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                {/* 3 Submission Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionType('R2_FILE');
                      setSubmitLink('');
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      submissionType === 'R2_FILE'
                        ? 'bg-white text-teal-800 shadow-2xs border border-teal-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>1. รูป/PDF (R2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionType('CANVA_VIDEO');
                      setSubmitLink('https://www.canva.com/design/DAFxArtwork45102/view');
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      submissionType === 'CANVA_VIDEO'
                        ? 'bg-white text-indigo-800 shadow-2xs border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Canva / วิดีโอ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionType('GOOGLE_DRIVE');
                      setSubmitLink('');
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      submissionType === 'GOOGLE_DRIVE'
                        ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Google Drive โฟลเดอร์</span>
                  </button>
                </div>

                {/* Tab 1: R2 Upload */}
                {submissionType === 'R2_FILE' && (
                  <label className="block p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 cursor-pointer hover:bg-teal-50/30 transition-colors">
                    <Upload className="w-6 h-6 text-[#0C6D5B] mx-auto" />
                    <p className="font-bold text-slate-700">
                      อัปโหลดเฉพาะไฟล์รูปภาพ (.webp) หรือเอกสาร PDF เข้า Cloudflare R2
                    </p>
                    <p className="text-[11px] text-teal-700 font-semibold">
                      ไฟล์ที่เลือก: {selectedFileName} → บีบอัดเหลือ ~148 KB (.webp) ประหยัดพื้นที่ 96%
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (/\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)) {
                          setToastMsg(
                            '🚫 ระบบไม่อนุญาตให้อัปโหลดไฟล์วิดีโอเข้า R2 กรุณาส่งเป็นลิงก์ Canva หรือโฟลเดอร์ Google Drive แทนครับ'
                          );
                          setTimeout(() => setToastMsg(null), 4000);
                          setSubmissionType('CANVA_VIDEO');
                          setSubmitLink('https://www.canva.com/design/DAFxArtwork45102/view');
                          return;
                        }
                        setSelectedFileName(f.name);
                      }}
                    />
                  </label>
                )}

                {/* Tab 2: Canva / Video Link */}
                {submissionType === 'CANVA_VIDEO' && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2">
                    <label className="block font-bold text-indigo-950 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-indigo-600" />
                      <span>วางลิงก์ชิ้นงานที่นักเรียนทำไว้ใน Canva หรือลิงก์วิดีโอขนาดใหญ่</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.canva.com/design/..."
                      value={submitLink}
                      onChange={(e) => setSubmitLink(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-none"
                    />
                    <p className="text-[11px] text-indigo-700">
                      ✓ ส่งเฉพาะลิงก์โดยตรง ไม่ซ้ำซ้อน และไม่ใช้พื้นที่เก็บไฟล์ Cloudflare R2 ของโรงเรียน (0 KB)
                    </p>
                  </div>
                )}

                {/* Tab 3: Google Drive Folder */}
                {submissionType === 'GOOGLE_DRIVE' && (() => {
                  const subjectCode = selectedQuest.subjectTitle?.split(' ')[0] || 'ศ23101';
                  const folderTemplate = generateRecommendedFolderPath({
                    schoolName: 'โรงเรียนกุดจับประชาสรรค์',
                    termYear: '2569_1',
                    subjectCode,
                    assignmentTitle: selectedQuest.title,
                  });
                  const driveValidation = validateGoogleDriveUrl(submitLink);

                  return (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <Folder className="w-4 h-4 text-emerald-600" />
                            <span>โครงสร้างโฟลเดอร์ Google Drive ที่แนะนำ:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(folderTemplate.copyableText);
                              setFolderCopied(true);
                              setTimeout(() => setFolderCopied(false), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            {folderCopied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-emerald-700" />}
                            <span>{folderCopied ? 'คัดลอกแล้ว' : 'คัดลอกชื่อ'}</span>
                          </button>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200 font-mono text-[11px] text-emerald-900 select-all">
                          {folderTemplate.copyableText}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-800">
                          วางลิงก์โฟลเดอร์ Google Drive ของคุณ:
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={submitLink}
                          onChange={(e) => setSubmitLink(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none text-xs"
                        />
                      </div>

                      {submitLink.trim() && (
                        <div>
                          {driveValidation.isValidFormat ? (
                            <div className="p-2.5 bg-white border border-emerald-300 rounded-xl space-y-2 text-[11px]">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{driveValidation.permissionWarningNotice}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                                {driveValidation.suggestedPolicies.map((pol) => (
                                  <div key={pol.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="font-bold text-slate-800 flex items-center gap-1">
                                      {pol.isRecommendedForPii ? '🛡️ ' : '🌐 '}
                                      <span>{pol.label}</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] mt-0.5">{pol.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold">
                              ⚠️ {driveValidation.permissionWarningNotice}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ ส่งลิงก์โฟลเดอร์ Google Drive ของตนเอง ช่วยประหยัดพื้นที่ R2 ของโรงเรียน (0 KB)
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {submissionType === 'GOOGLE_DRIVE'
                    ? 'ส่งโฟลเดอร์ Google Drive ของตนเอง ไม่จำกัดขนาดไฟล์ และได้รับ +' + selectedQuest.xpReward + ' XP'
                    : submissionType === 'CANVA_VIDEO'
                    ? 'ส่งลิงก์ Canva หรือวิดีโอภายนอก และได้รับ +' + selectedQuest.xpReward + ' XP'
                    : 'ส่งไฟล์ตรงเข้า Cloudflare R2 โดยไม่ต้องล็อกอิน Google Drive และได้รับ +' + selectedQuest.xpReward + ' XP'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuest(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0C6D5B] hover:bg-[#095748] text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'กำลังส่งงาน...'
                    : submissionType === 'GOOGLE_DRIVE'
                    ? '📁 ส่งโฟลเดอร์ Google Drive'
                    : submissionType === 'CANVA_VIDEO'
                    ? '🎨 ส่งลิงก์ชิ้นงาน'
                    : '☁️ อัปโหลดขึ้น R2 & ส่งงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
