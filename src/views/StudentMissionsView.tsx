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
  Check,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Paperclip,
  Eye,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import {
  sgsRosterAndSubmissionService,
  matchSubmissionToAssignment,
  type FourScorePart,
  type AssignmentAttachment,
} from '../services/sgsRosterAndSubmissionService';
import { coursesCurriculumService } from '../services/coursesCurriculumService';
import { behaviorService } from '../services/behaviorService';
import { r2StorageService } from '../services/r2StorageService';
import { validateGoogleDriveUrl } from '../utils/googleDriveUtils';
import type { StudentQuestItem, StudentLeaderboardEntry } from '../types/viewModels';
import { authService, type AuthUser } from '../services/authService';
import { getSchoolSettings } from '../config/schoolRoles';
import { weeklyQuizService } from '../services/weeklyQuizService';
import { calculateStudentExp } from '../services/studentExpService';
import { formatClassroomLabel } from '../services/studentService';
import { resolveStudentIdentity } from '../utils/studentIdentityUtils';
import { type UploadProgressInfo, validateSubmissionFile, compressImageToWebP } from '../services/cloudDataService';
import { formatBytes } from '../components/student/StudentSubmissionUploader';

export interface ExtendedStudentQuestItem extends StudentQuestItem {
  courseCode?: string;
  unitId?: string;
  scorePart?: FourScorePart;
  scorePartLabel?: string;
  isRequiredForPass?: boolean;
  description?: string;
  attachments?: AssignmentAttachment[];
  isReturnedForRevision?: boolean;
  returnReason?: string;
  teacherFeedback?: string;
}

interface StudentMissionsViewProps {
  currentUser?: AuthUser | null;
}

export const StudentMissionsView: React.FC<StudentMissionsViewProps> = ({ currentUser: propUser }) => {
  const currentUser = propUser || authService.getCurrentUser();
  const identity = React.useMemo(() => {
    if (!currentUser) return null;
    return resolveStudentIdentity(currentUser);
  }, [currentUser]);

  const studentCode = identity?.studentCode || currentUser?.studentCode || '';
  const studentId = identity?.studentId || currentUser?.id || '';
  const studentRoom =
    formatClassroomLabel(
      currentUser?.classroomName ||
        currentUser?.classroomId ||
        identity?.student?.classroom ||
        identity?.student?.classroomId
    ) || 'ม.3/1';
  const schoolSettings = getSchoolSettings();
  const academicYearTerm = schoolSettings.academicTerm || '1/2569';
  const [quests, setQuests] = useState<ExtendedStudentQuestItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');
  const [selectedQuest, setSelectedQuest] = useState<ExtendedStudentQuestItem | null>(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [submitLink, setSubmitLink] = useState('');
  const [submitText, setSubmitText] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [selectedRawFile, setSelectedRawFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileTypeCategory, setFileTypeCategory] = useState<'image' | 'pdf' | 'doc' | 'other'>('other');
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [compressionNotice, setCompressionNotice] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingR2, setIsUploadingR2] = useState(false);
  const [uploadProgressInfo, setUploadProgressInfo] = useState<UploadProgressInfo>({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // คืนค่าหน่วยความจำ (Memory Cleanup) ทุกครั้งที่เปลี่ยนไฟล์หรือปิดหน้าเว็บ เพื่อไม่ให้กินแรมมือถือ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenFullscreenPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFileName('');
    setSelectedFileDataUrl(null);
    setSelectedRawFile(null);
    setFileTypeCategory('other');
    setFileValidationError(null);
    setCompressionNotice(null);
    setIsCompressingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadProgressInfo({ percent: 0, loadedBytes: 0, totalBytes: 0 });
  };

  // Real Weekly Quiz State (connected to 40-week bank)
  const weekInfo = weeklyQuizService.getCurrentWeekInfo();
  const currentWeek = weekInfo?.week || 1;
  const weeklyQuestions = React.useMemo(() => {
    return weeklyQuizService.getQuestionsForWeek(currentWeek);
  }, [currentWeek]);

  const [isWeeklyQuizOpen, setIsWeeklyQuizOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [hasCompletedWeekly, setHasCompletedWeekly] = useState(false);

  const existingQuizResult = React.useMemo(() => {
    return weeklyQuizService.getResult(currentWeek, currentUser?.id);
  }, [currentWeek, currentUser?.id, quizFinished]);

  useEffect(() => {
    if (existingQuizResult) {
      setHasCompletedWeekly(true);
    }
  }, [existingQuizResult]);

  useEffect(() => {
    // ซิงค์ไฟล์งานที่เคยส่งไว้ในเครื่องนี้ขึ้น Cloudflare R2 อัตโนมัติเมื่อเปิดหน้ารายการงาน
    if (r2StorageService.isConfigured()) {
      sgsRosterAndSubmissionService.syncLocalSubmissionsToR2().catch(() => {});
    }
  }, []);

  // Real student XP calculation
  const myExp = React.useMemo(() => {
    return calculateStudentExp(studentId, studentCode);
  }, [studentId, studentCode, quests]);

  // Real classroom leaderboard
  const classroomLeaderboard = React.useMemo(() => {
    const roster = sgsRosterAndSubmissionService.getSgsRoster(studentRoom);
    if (roster.length === 0) return leaderboard;
    const entries: Array<StudentLeaderboardEntry & { studentCode?: string; id?: string }> = roster.map((s) => {
      const expCalc = calculateStudentExp(s.studentCode, s.studentCode);
      return {
        rank: 0,
        studentCode: s.studentCode,
        id: (s as any).id || `stu-${s.studentCode}`,
        name: s.studentName,
        classroom: studentRoom,
        xp: expCalc.totalXp,
        avatarText: s.gender === 'FEMALE' ? '👧' : '👦',
        streakDays: 0,
      };
    });
    entries.sort((a, b) => b.xp - a.xp);
    return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }, [studentRoom, leaderboard, myExp]);

  const myRank = React.useMemo(() => {
    if (!studentCode && !studentId) return null;
    const foundIdx = classroomLeaderboard.findIndex(
      (e: any) =>
        (studentCode && e.studentCode === studentCode) ||
        (studentId && e.id === studentId) ||
        (currentUser?.name && e.name === currentUser.name)
    );
    return foundIdx !== -1 ? foundIdx + 1 : null;
  }, [classroomLeaderboard, studentCode, studentId, currentUser?.name]);

  const getScorePartLabel = (part?: FourScorePart, unit?: string): string => {
    if (part === 'PRE_MIDTERM') return 'ก่อนกลางภาค';
    if (part === 'MIDTERM') return 'กลางภาค';
    if (part === 'POST_MIDTERM') return 'หลังกลางภาค';
    if (part === 'FINAL') return 'ปลายภาค';
    if (unit === 'u1') return 'ก่อนกลางภาค';
    if (unit === 'u2' || unit === 'u3') return 'หลังกลางภาค';
    return 'ก่อนกลางภาค';
  };

  const loadQuests = async () => {
    try {
      // Pass the student's classroom to show assignments targeted to all rooms or specifically to the student's room
      const termAssignments = sgsRosterAndSubmissionService.getTermAssignments(undefined, studentRoom);
      const allCourses = coursesCurriculumService.getCourses();
      const allSubmissions = sgsRosterAndSubmissionService.getSubmissions();

      const sgsQuests: ExtendedStudentQuestItem[] = termAssignments.map((asg) => {
        const sub = allSubmissions.find((s) => s.studentCode === studentCode && matchSubmissionToAssignment(s, asg));
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
        const partLabel = getScorePartLabel(asg.scorePart, asg.sgsUnit);

        return {
          id: asg.id,
          unitId: asg.unitId,
          courseCode: asg.courseCode,
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
          scorePart: asg.scorePart,
          scorePartLabel: partLabel,
          isRequiredForPass: asg.isRequiredForPass,
          description: asg.description,
          attachments: asg.attachments,
          isReturnedForRevision,
          returnReason: sub?.returnReason,
          teacherFeedback: sub?.teacherFeedback,
        };
      });

      if (sgsQuests.length > 0) {
        setQuests(sgsQuests);
      } else {
        const data = await gamificationService.getQuests();
        setQuests(data);
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
      const data = await gamificationService.getQuests();
      setQuests(data);
    }

    const lb = await gamificationService.getLeaderboard();
    setLeaderboard(lb);
  };

  useEffect(() => {
    loadQuests();
    const handleUpdate = () => {
      loadQuests();
    };
    window.addEventListener('kp-sgs-roster-updated', handleUpdate);
    window.addEventListener('kp-copilot-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
      window.removeEventListener('kp-copilot-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [studentRoom, studentCode]);

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

    if (!studentCode) {
      setToastMsg('⚠️ ไม่พบข้อมูลรหัสประจำตัวนักเรียน กรุณาตรวจสอบหรือเข้าสู่ระบบใหม่อีกครั้ง');
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    const trimmedLink = submitLink.trim();
    const trimmedText = submitText.trim();
    const hasFile = Boolean(selectedFileDataUrl || selectedFileName);
    const hasLink = Boolean(trimmedLink);
    const hasText = Boolean(trimmedText);

    if (!hasFile && !hasLink && !hasText) {
      setToastMsg('⚠️ กรุณาแนบไฟล์, วางลิงก์ผลงาน หรือพิมพ์ข้อความตอบกลับอย่างน้อย 1 อย่าง');
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (hasLink && (trimmedLink.includes('drive.google.com') || trimmedLink.includes('docs.google.com'))) {
      const driveValidation = validateGoogleDriveUrl(trimmedLink);
      if (!driveValidation.isValidFormat) {
        setToastMsg(`⚠️ ${driveValidation.permissionWarningNotice}`);
        setTimeout(() => setToastMsg(null), 3500);
        return;
      }
    }

    setIsSubmitting(true);
    if (hasFile) {
      setIsUploadingR2(true);
      setUploadProgressInfo({
        percent: 0,
        loadedBytes: 0,
        totalBytes: selectedRawFile ? selectedRawFile.size : (selectedFileDataUrl ? Math.round(selectedFileDataUrl.length * 0.75) : 0),
      });
    }

    try {
      try {
        await gamificationService.submitQuest(selectedQuest.id, trimmedLink, studentId);
      } catch {
        // If quest was an SGS term assignment, award XP directly
        await behaviorService.awardXp(
          studentId,
          selectedQuest.xpReward,
          `ส่งภารกิจ: ${selectedQuest.title}`,
          `quest-sub-${selectedQuest.id}-${studentId}`
        );
      }

      await sgsRosterAndSubmissionService.submitStudentWorkToR2Async({
        assignmentId: selectedQuest.id,
        unitId: selectedQuest.unitId,
        courseCode: selectedQuest.courseCode,
        studentCode,
        workTitle: selectedQuest.title,
        fileName: selectedFileName || (selectedFileDataUrl ? `work_${studentCode}.webp` : undefined),
        originalSizeKb: selectedFileDataUrl ? Math.round(selectedFileDataUrl.length / 1024) : 0,
        compressedSizeKb: selectedFileDataUrl ? Math.round(selectedFileDataUrl.length / 1365) : 0,
        fileDataUrl: selectedFileDataUrl || undefined,
        fileBlob: selectedRawFile || undefined,
        externalLinkUrl: hasLink ? trimmedLink : undefined,
        textContent: hasText ? trimmedText : undefined,
        academicYearTerm,
        classroom: studentRoom,
        onProgress: (info) => {
          setUploadProgressInfo(info);
        },
      });

      if (hasFile && hasLink) {
        setToastMsg(`🎉 อัปโหลดไฟล์และแนบลิงก์ผลงานสำเร็จ! (+${selectedQuest.xpReward} XP)`);
      } else if (hasFile) {
        setToastMsg(`☁️ อัปโหลดไฟล์ผลงานเข้าสู่ระบบสำเร็จ! (+${selectedQuest.xpReward} XP)`);
      } else if (hasLink) {
        setToastMsg(`🔗 แนบลิงก์ผลงานสำเร็จ! (+${selectedQuest.xpReward} XP)`);
      } else {
        setToastMsg(`📝 ส่งข้อความตอบกลับสำเร็จ! (+${selectedQuest.xpReward} XP)`);
      }

      await loadQuests();
      setTimeout(() => setToastMsg(null), 3500);
      setSelectedQuest(null);
      setSubmitLink('');
      setSubmitText('');
      setSelectedFileName('');
      setSelectedFileDataUrl(null);
      setSelectedRawFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setFileTypeCategory('other');
      setFileValidationError(null);
      setCompressionNotice(null);
      setIsCompressingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgressInfo({ percent: 0, loadedBytes: 0, totalBytes: 0 });
      setIsEditingSubmission(false);
    } finally {
      setIsSubmitting(false);
      setIsUploadingR2(false);
    }
  };

  const handleFinishQuiz = async () => {
    if (weeklyQuestions.length === 0) return;
    const answerArr = weeklyQuestions.map((_, i) => quizAnswers[i] ?? -1);
    if (answerArr.some((a) => a < 0)) {
      setToastMsg('⚠️ กรุณาตอบคำถามให้ครบทุกข้อก่อนส่งคำตอบ');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    const res = await weeklyQuizService.submit(answerArr, 0, currentUser?.id);
    if (res.ok) {
      setQuizFinished(true);
      setHasCompletedWeekly(true);
      setToastMsg(
        `🎉 ยินดีด้วย! ตอบถูก ${res.result.correct}/${res.result.total} ข้อ ได้รับ +${res.result.xpEarned} XP และ +${res.result.coinsEarned} เหรียญ!`
      );
      setTimeout(() => {
        setIsWeeklyQuizOpen(false);
        setToastMsg(null);
      }, 2500);
    } else {
      setToastMsg(`⚠️ ${res.error}`);
      setTimeout(() => setToastMsg(null), 3500);
    }
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
                สัปดาห์ที่ {currentWeek}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] flex items-center gap-1">
                ⭐ สูงสุด 200 XP
              </span>
            </div>
            <p className="text-xs text-[#6B7C93] mt-0.5 truncate sm:whitespace-normal">
              {hasCompletedWeekly
                ? `ทำแบบฝึกหัดสัปดาห์นี้แล้ว ได้คะแนน ${existingQuizResult?.correct ?? weeklyQuestions.length}/${existingQuizResult?.total ?? weeklyQuestions.length} ข้อ (+${existingQuizResult?.xpEarned ?? 200} XP)`
                : `ตอบคำถามวัดความรู้ ${weeklyQuestions.length} ข้อ เพื่อรับ XP และเหรียญรางวัล`}
            </p>
          </div>
        </div>

        {hasCompletedWeekly ? (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ทำแล้ว ({existingQuizResult?.correct ?? weeklyQuestions.length}/{existingQuizResult?.total ?? weeklyQuestions.length})</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setQuizAnswers({});
              setIsWeeklyQuizOpen(true);
            }}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#0D9488] uppercase tracking-wide">
                      {quest.subjectTitle}
                    </span>
                    {/* 4-part score category badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        quest.scorePartLabel === 'ก่อนกลางภาค'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : quest.scorePartLabel === 'กลางภาค'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : quest.scorePartLabel === 'หลังกลางภาค'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : quest.scorePartLabel === 'ปลายภาค'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {quest.scorePartLabel || 'ก่อนกลางภาค'}
                    </span>
                    {quest.isRequiredForPass && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        ⭐ งานบังคับ (ไม่ส่งติด ร)
                      </span>
                    )}
                    {quest.isReturnedForRevision ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-850 border border-amber-300 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>ขอให้แก้ไข: {quest.returnReason || 'โปรดปรับปรุงผลงาน'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                        {quest.statusLabel}
                      </span>
                    )}
                    {quest.attachments && quest.attachments.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-blue-500" />
                        <span>มีสื่อการสอน ({quest.attachments.length})</span>
                      </span>
                    )}
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
                  onClick={() => {
                    setSelectedQuest(quest);
                    setIsEditingSubmission(false);
                    const sub = sgsRosterAndSubmissionService
                      .getSubmissions()
                      .find((s) => s.assignmentId === quest.id && s.studentCode === studentCode);
                    if (sub) {
                      setSubmitLink(sub.externalLinkUrl || '');
                      setSelectedFileName(sub.workAttachmentLabel ? sub.workAttachmentLabel.replace('☁️ R2: ', '').split(' ')[0] : '');
                      setSelectedFileDataUrl(sub.fileDataUrl || sgsRosterAndSubmissionService.getSubmissionFileUrl(quest.id, studentCode) || null);
                    } else {
                      setSubmitLink('');
                      setSelectedFileName('');
                      setSelectedFileDataUrl(null);
                    }
                  }}
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{quest.isReturnedForRevision ? 'แก้ไขและส่งใหม่' : quest.status === 'PENDING' ? 'ส่งงาน' : 'ดูงาน'}</span>
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
              {classroomLeaderboard.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">เริ่มต้นการเก็บคะแนนสัปดาห์นี้</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ส่งงานเป็นคนแรกเพื่อขึ้นแท่นอันดับ 1 ของห้องเรียน! ✨
                  </p>
                </div>
              ) : (
                classroomLeaderboard.slice(0, 5).map((user) => (
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
                          {user.classroom || studentRoom}
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
                  #{myRank}
                </span>
                <span className="text-lg">🦊</span>
                <div>
                  <p className="text-xs font-bold text-[#163A66]">
                    คุณ ({currentUser?.name || 'นักเรียน'})
                  </p>
                  <p className="text-[10px] text-[#6B7C93]">
                    {myRank === 1 ? '🌟 ครองอันดับ 1 ของห้องเรียน!' : `อันดับที่ ${myRank} ของห้อง ${studentRoom}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#163A66]">
                  {myExp.totalXp.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-0.5">XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Weekly Quiz (แบบฝึกหัดประจำสัปดาห์ 40 สัปดาห์) */}
      {isWeeklyQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-orange-600">แบบฝึกหัดสัปดาห์ที่ {currentWeek}</span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  แบบทดสอบวัดความรู้ประจำสัปดาห์ ({weeklyQuestions.length} ข้อ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyQuizOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Questions list from 40-week bank */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {weeklyQuestions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                      {q.subject}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 flex items-start gap-1.5">
                    <HelpCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <span>ข้อ {qIdx + 1}: {q.question}</span>
                  </p>
                  <div className="space-y-1.5 pt-1 text-xs">
                    {q.choices.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: i }))}
                        className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          quizAnswers[qIdx] === i
                            ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {i + 1}. {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                ตอบแล้ว {Object.keys(quizAnswers).length}/{weeklyQuestions.length} ข้อ
              </span>
              <button
                type="button"
                disabled={Object.keys(quizAnswers).length < weeklyQuestions.length || quizFinished}
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>ส่งคำตอบ & รับ XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Homework Submission Drawer */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-bold text-[#0C6D5B]">{selectedQuest.subjectTitle}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      selectedQuest.scorePartLabel === 'ก่อนกลางภาค'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : selectedQuest.scorePartLabel === 'กลางภาค'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : selectedQuest.scorePartLabel === 'หลังกลางภาค'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : selectedQuest.scorePartLabel === 'ปลายภาค'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {selectedQuest.scorePartLabel || 'ก่อนกลางภาค'}
                  </span>
                  {selectedQuest.isRequiredForPass && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      ⭐ งานบังคับ (ไม่ส่งติด ร)
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base">{selectedQuest.title}</h3>
                {selectedQuest.description && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 mt-2">
                    <span className="text-[11px] font-bold text-[#163A66] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>รายละเอียดงาน / คำชี้แจง:</span>
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedQuest.description}
                    </p>
                  </div>
                )}

                {selectedQuest.attachments && selectedQuest.attachments.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>สื่อการสอนและเอกสารสำหรับศึกษา ({selectedQuest.attachments.length} ไฟล์)</span>
                      </span>
                      <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                        เปิดดู / ดาวน์โหลด
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedQuest.attachments.map((att) => {
                        const fileUrl = att.fileDataUrl || att.url;
                        return (
                          <div
                            key={att.id}
                            className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between gap-2 shadow-2xs hover:border-[#3B82F6] transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {att.type === 'PDF' ? (
                                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : att.type === 'IMAGE' ? (
                                <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  {att.size && <span>{att.size}</span>}
                                  {att.source === 'LESSON_PLAN' ? (
                                    <span className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">จากแผนการสอน</span>
                                  ) : (
                                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">ไฟล์ตัวอย่าง</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={att.source === 'UPLOAD' ? att.name : undefined}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B82F6] hover:text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] shrink-0 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>เปิดดู</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">ไม่มีลิงก์</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuest(null);
                  setIsEditingSubmission(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>

            {selectedQuest.status === 'SUBMITTED' && !isEditingSubmission ? (
              <div className="space-y-4 py-2">
                {(() => {
                  const submission = sgsRosterAndSubmissionService
                    .getSubmissions()
                    .find((s) => s.assignmentId === selectedQuest.id && s.studentCode === studentCode);
                  const filePreview =
                    submission?.fileDataUrl ||
                    sgsRosterAndSubmissionService.getSubmissionFileUrl(selectedQuest.id, studentCode);

                  return (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>สถานะ: ส่งงานเรียบร้อยแล้ว</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          {submission?.status === 'GRADED' ? 'ตรวจและประเมินแล้ว' : 'รอคุณครูตรวจ'}
                        </span>
                      </div>

                      {/* Display Image Thumbnail Preview if student attached an image */}
                      {filePreview && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 block">🖼️ ไฟล์ภาพผลงานที่ส่ง:</span>
                          <div className="flex items-center gap-3">
                            <img
                              src={filePreview}
                              alt="ผลงานที่ส่ง"
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                            />
                            <div className="space-y-1 text-xs min-w-0">
                              <p className="font-bold text-slate-800 truncate">
                                {submission?.workAttachmentLabel || selectedQuest.title}
                              </p>
                              <a
                                href={filePreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>เปิดดูรูปภาพขนาดเต็ม ↗</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display External Link Preview if student attached a link */}
                      {submission?.externalLinkUrl && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-slate-700 block">🔗 ลิงก์ชิ้นงานที่แนบ:</span>
                            <span className="font-mono text-xs text-blue-700 truncate block max-w-xs sm:max-w-md">
                              {submission.externalLinkUrl}
                            </span>
                          </div>
                          <a
                            href={submission.externalLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>เปิดลิงก์ ↗</span>
                          </a>
                        </div>
                      )}

                      {/* Display Text Answer Preview if student attached text */}
                      {submission?.textContent && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                          <span className="text-[11px] font-bold text-slate-700 block flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ข้อความคำตอบที่ส่ง:</span>
                          </span>
                          <p className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-100 text-slate-800 whitespace-pre-line leading-relaxed">
                            {submission.textContent}
                          </p>
                        </div>
                      )}

                      <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">ประเภทการส่ง:</span>
                          <span className="font-bold text-[#163A66]">
                            {filePreview && submission?.externalLinkUrl
                              ? '☁️ รูปภาพ/PDF + 🔗 ลิงก์แนบ'
                              : filePreview
                              ? '☁️ Cloudflare R2 (รูปภาพ/PDF)'
                              : submission?.externalLinkUrl
                              ? submission.externalLinkUrl.includes('canva.com')
                                ? '🎨 Canva Project'
                                : '📁 Google Drive'
                              : submission?.textContent
                              ? '📝 พิมพ์ข้อความคำตอบ'
                              : 'ส่งงานออนไลน์'}
                          </span>
                        </div>
                        {submission?.submittedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">วันที่ส่งงาน:</span>
                            <span className="text-slate-600">
                              {new Date(submission.submittedAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Teacher Feedback & Score */}
                      {submission?.status === 'GRADED' ? (
                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-600" />
                              <span>ผลการประเมินจากคุณครู:</span>
                            </span>
                            <span className="text-xs font-black text-amber-700">
                              {submission.score ?? '-'} / {selectedQuest.maxScore} คะแนน
                            </span>
                          </div>
                          {(submission.teacherFeedback || (submission as any).feedback) && (
                            <p className="text-xs text-amber-800 bg-white p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                              &ldquo;{submission.teacherFeedback || (submission as any).feedback}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>คุณครูประจำวิชากำลังตรวจและประเมินผลคะแนน</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSubmission(true);
                      const submission = sgsRosterAndSubmissionService
                        .getSubmissions()
                        .find((s) => s.assignmentId === selectedQuest.id && s.studentCode === studentCode);
                      if (submission) {
                        if (submission.textContent) setSubmitText(submission.textContent);
                        if (submission.externalLinkUrl) setSubmitLink(submission.externalLinkUrl);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    ✏️ แก้ไขหรือส่งงานใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuest(null);
                      setIsEditingSubmission(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {selectedQuest.isReturnedForRevision && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>คุณครูส่งงานกลับมาให้แก้ไข: {selectedQuest.returnReason || 'ขอให้ปรับปรุงผลงาน'}</span>
                  </div>
                  {selectedQuest.teacherFeedback && (
                    <p className="text-xs bg-white/90 p-2.5 rounded-xl border border-amber-200 text-amber-800 font-medium">
                      คำแนะนำจากคุณครู: &ldquo;{selectedQuest.teacherFeedback}&rdquo;
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-4">
                {/* 1. File Upload Section */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#163A66] flex items-center gap-1.5 text-xs sm:text-sm">
                      <Upload className="w-4 h-4 text-[#3B82F6]" />
                      <span>1. แนบไฟล์รูปภาพ หรือเอกสาร PDF (Cloudflare R2)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      บีบอัดอัตโนมัติ
                    </span>
                  </div>

                  {selectedRawFile || previewUrl || selectedFileDataUrl ? (
                    /* Display Selected File Preview (RAM optimized via ObjectURL) */
                    <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                          <span>🖼️ ตรวจสอบตัวอย่างไฟล์ก่อนส่ง</span>
                        </span>
                        {!isSubmitting && !isUploadingR2 && (
                          <button
                            type="button"
                            onClick={handleClearFile}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors p-1 rounded-lg hover:bg-rose-50"
                            title="ลบไฟล์และเลือกใหม่"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>เปลี่ยนไฟล์ / ลบออก</span>
                          </button>
                        )}
                      </div>

                      {/* 1. กรณีเป็นไฟล์รูปภาพ: แสดง Image Preview */}
                      {fileTypeCategory === 'image' && (previewUrl || selectedFileDataUrl) && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 shadow-2xs">
                          <img
                            src={previewUrl || selectedFileDataUrl || ''}
                            alt="ตัวอย่างผลงานนักเรียน"
                            className="mx-auto max-h-64 w-full object-contain p-1.5"
                          />
                          <div className="border-t border-slate-200/80 bg-slate-50 px-3 py-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-medium">ภาพไม่เบลอ ไม่กลับหัว พร้อมส่ง</span>
                            {previewUrl && (
                              <button
                                type="button"
                                onClick={handleOpenFullscreenPreview}
                                className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>ขยายดูภาพขนาดเต็ม</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. กรณีเป็นไฟล์ PDF: แสดง PDF Preview ใน iframe พร้อมปุ่มเปิดเต็มจอ */}
                      {fileTypeCategory === 'pdf' && previewUrl && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                          <iframe
                            src={previewUrl}
                            title="ตัวอย่างไฟล์ PDF"
                            className="h-64 w-full border-0"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50 px-3 py-2">
                            <span className="text-[11px] text-slate-500">
                              หากมือถือไม่แสดงพรีวิว กดปุ่มเปิดดูได้ครับ
                            </span>
                            <button
                              type="button"
                              onClick={handleOpenFullscreenPreview}
                              className="shrink-0 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#3B82F6] hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>📄 เปิดดู PDF เต็มจอ</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. กรณีเป็นไฟล์ Word (.doc, .docx): แสดงการ์ดข้อมูลเอกสาร */}
                      {fileTypeCategory === 'doc' && (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-lg font-black text-[#3B82F6]">
                            W
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#163A66]">
                              ไฟล์เอกสาร Microsoft Word
                            </p>
                            <p className="text-[11px] text-[#6B7C93]">
                              พร้อมสำหรับอัปโหลดขึ้น Cloudflare R2
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ป้ายแสดงข้อมูลการบีบอัด WebP */}
                      {compressionNotice && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold animate-fade-in">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{compressionNotice}</span>
                        </div>
                      )}

                      {/* แถบสรุปชื่อไฟล์และขนาด */}
                      <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1 border-t border-slate-100">
                        <span className="truncate font-semibold text-[#163A66] max-w-[70%]">{selectedFileName || 'ไฟล์ผลงาน'}</span>
                        <span className="shrink-0 font-mono text-slate-400 text-[11px]">
                          {selectedRawFile ? formatBytes(selectedRawFile.size) : (selectedFileDataUrl ? `~${Math.round(selectedFileDataUrl.length / 1365)} KB` : '')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* File Upload Dropzone */
                    <label className={`block p-5 bg-white border-2 border-dashed border-slate-300 hover:border-[#3B82F6] rounded-2xl text-center space-y-2 cursor-pointer transition-colors group ${isSubmitting || isUploadingR2 ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3B82F6] group-hover:scale-110 flex items-center justify-center mx-auto transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                          📷 ถ่ายภาพ หรือ 📁 คลิกเพื่อเลือกไฟล์จากเครื่อง
                        </span>
                        <span className="text-[11px] text-[#6B7C93] mt-0.5 block">
                          รองรับรูปภาพ (บีบอัด WebP อัตโนมัติ) และเอกสาร (PDF, Word ไม่เกิน 15 MB)
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,.doc,.docx"
                        disabled={isSubmitting || isUploadingR2}
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setFileValidationError(null);
                          setCompressionNotice(null);

                          try {
                            setIsCompressingImage(true);

                            // 1. ถ้านักเรียนเลือกรูปภาพ ให้บีบอัดและแปลงเป็น WebP อัตโนมัติก่อน
                            // (แม้ภาพถ่ายกล้องสดจากมือถือจะใหญ่ 6-12 MB ก็จะถูกย่อเหลือ ~200-400 KB ทันที)
                            const { file: processedFile, originalSize, compressedSize, wasCompressed } =
                              await compressImageToWebP(f, {
                                maxWidthOrHeight: 1920,
                                quality: 0.82,
                              });

                            if (wasCompressed) {
                              const savedPercent = Math.max(1, Math.round(((originalSize - compressedSize) / originalSize) * 100));
                              setCompressionNotice(
                                `⚡ บีบอัด WebP ลดขนาดจาก ${formatBytes(originalSize)} เหลือ ${formatBytes(compressedSize)} (ประหยัด ${savedPercent}%)`
                              );
                            }

                            // 2. ตรวจสอบไฟล์ที่ผ่านการบีบอัดแล้ว (Client-side File Validation)
                            const validation = validateSubmissionFile(processedFile);
                            if (!validation.valid) {
                              setFileValidationError(validation.error || 'ไฟล์ไม่ถูกต้องตามเกณฑ์');
                              handleClearFile();
                              return;
                            }

                            const cleanName = validation.sanitizedName || processedFile.name;
                            setSelectedRawFile(processedFile);
                            setSelectedFileName(cleanName);
                            setUploadProgressInfo({ percent: 0, loadedBytes: 0, totalBytes: processedFile.size });

                            // จัดการ Memory Preview ด้วย URL.createObjectURL(processedFile) (ไม่เปลืองแรมมือถือ)
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                            }

                            const lowerName = processedFile.name.toLowerCase();
                            const isImage = validation.category === 'image' || processedFile.type.startsWith('image/');
                            const isPdf = processedFile.type === 'application/pdf' || lowerName.endsWith('.pdf');

                            if (isImage) {
                              setFileTypeCategory('image');
                              setPreviewUrl(URL.createObjectURL(processedFile));
                            } else if (isPdf) {
                              setFileTypeCategory('pdf');
                              setPreviewUrl(URL.createObjectURL(processedFile));
                            } else {
                              setFileTypeCategory('doc');
                              setPreviewUrl(null);
                            }

                            // DataUrl สำรองสำหรับการทำงานแบบออฟไลน์
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const resultStr = event.target?.result as string;
                              if (resultStr) setSelectedFileDataUrl(resultStr);
                            };
                            reader.readAsDataURL(processedFile);
                          } catch {
                            setFileValidationError('เกิดข้อผิดพลาดในการประมวลผลไฟล์รูปภาพ');
                            handleClearFile();
                          } finally {
                            setIsCompressingImage(false);
                          }
                        }}
                      />
                    </label>
                  )}

                  {/* ป้ายแสดงสถานะกำลังบีบอัดภาพ */}
                  {isCompressingImage && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-pulse">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                      <span className="font-semibold">กำลังบีบอัดรูปภาพเป็น WebP คุณภาพสูง...</span>
                    </div>
                  )}

                  {/* กล่องแจ้งเตือนเมื่อไฟล์ไม่ผ่านเกณฑ์การตรวจสอบ */}
                  {fileValidationError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{fileValidationError}</span>
                    </div>
                  )}
                </div>

                {/* 2. External Link Section */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#163A66] flex items-center gap-1.5 text-xs sm:text-sm">
                      <Link className="w-4 h-4 text-[#8B5CF6]" />
                      <span>2. แนบลิงก์ผลงาน (ถ้ามี เช่น Canva, Google Drive, Docs, YouTube)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">ไม่บังคับ</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="วางลิงก์ เช่น https://www.canva.com/design/... หรือ Google Drive"
                        value={submitLink}
                        onChange={(e) => setSubmitLink(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#3B82F6] rounded-xl focus:outline-none text-xs text-slate-800 placeholder:text-slate-400"
                      />
                      {submitLink.trim() && (
                        <button
                          type="button"
                          onClick={() => setSubmitLink('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Detected Platform Badge & Google Drive Validation */}
                    {submitLink.trim() && (() => {
                      const lowerLink = submitLink.toLowerCase();
                      const isCanva = lowerLink.includes('canva.com');
                      const isDrive = lowerLink.includes('drive.google.com') || lowerLink.includes('docs.google.com');
                      const isYoutube = lowerLink.includes('youtube.com') || lowerLink.includes('youtu.be');

                      if (isDrive) {
                        const driveValidation = validateGoogleDriveUrl(submitLink);
                        return (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                📁 Google Drive Link
                              </span>
                              {driveValidation.isValidFormat && (
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  ✓ รูปแบบลิงก์ถูกต้อง
                                </span>
                              )}
                            </div>
                            {driveValidation.permissionWarningNotice && (
                              <div className="p-2.5 bg-white border border-emerald-300 rounded-xl text-[11px] text-emerald-900 space-y-1 shadow-2xs">
                                <p className="font-bold flex items-center gap-1 text-emerald-800">
                                  <span>ℹ️ คำแนะนำการแชร์:</span>
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                  {driveValidation.permissionWarningNotice}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (isCanva) {
                        return (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#00C4CC]/10 text-[#00C4CC] border border-[#00C4CC]/30 text-[10px] font-black uppercase">
                              🎨 Canva Project Link
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              คุณครูสามารถกดเปิดดูชิ้นงานใน Canva ต้นฉบับได้โดยตรง
                            </span>
                          </div>
                        );
                      }

                      if (isYoutube) {
                        return (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              🎥 YouTube Video Link
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>

                {/* 3. Text Answer Section (พิมพ์ข้อความตอบกลับ) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#163A66] flex items-center gap-1.5 text-xs sm:text-sm">
                      <FileText className="w-4 h-4 text-[#10B981]" />
                      <span>3. พิมพ์ข้อความตอบกลับ / บันทึกคำตอบ (ถ้ามี)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">ไม่บังคับ</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="พิมพ์คำตอบ คำอธิบายผลงาน หรือข้อความที่ต้องการส่งถึงคุณครูที่นี่..."
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#3B82F6] rounded-xl focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 resize-y leading-relaxed"
                  />
                  {submitText.trim() && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ความยาว: {submitText.trim().length} ตัวอักษร</span>
                      <button
                        type="button"
                        onClick={() => setSubmitText('')}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ล้างข้อความ
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time R2 Upload Progress Bar */}
                {isUploadingR2 && (
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-[#163A66]">
                        <Upload className="w-3.5 h-3.5 text-[#3B82F6] animate-bounce" />
                        <span>กำลังส่งงานขึ้น Cloudflare R2...</span>
                      </span>
                      <span className="font-bold text-[#3B82F6]">{uploadProgressInfo.percent}%</span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ease-out ${
                          uploadProgressInfo.percent === 100 ? 'bg-emerald-500' : 'bg-[#3B82F6]'
                        }`}
                        style={{ width: `${uploadProgressInfo.percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-[#94A3B8]">
                      <span className="truncate max-w-[200px] text-slate-500">{selectedFileName || 'ไฟล์ผลงาน'}</span>
                      <span className="font-mono">
                        {formatBytes(uploadProgressInfo.loadedBytes)} / {formatBytes(uploadProgressInfo.totalBytes)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Notice */}
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 text-blue-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold">
                      ส่งงานนี้จะได้รับ <span className="text-blue-700 font-black">+{selectedQuest.xpReward} XP</span> เข้าสู่ระบบทันที
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {selectedFileDataUrl && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        ✓ แนบไฟล์
                      </span>
                    )}
                    {submitLink.trim() && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        ✓ แนบลิงก์
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting || isUploadingR2}
                  onClick={() => {
                    setSelectedQuest(null);
                    setIsEditingSubmission(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingR2 || Boolean(fileValidationError) || (!selectedFileDataUrl && !submitLink.trim())}
                  className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingR2 ? (
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังอัปโหลด ({uploadProgressInfo.percent}%)...</span>
                    </span>
                  ) : isSubmitting ? (
                    <span>กำลังส่งงาน...</span>
                  ) : (
                    <>
                      <span>🚀 ยืนยันการส่งงาน</span>
                      <span>(+{selectedQuest.xpReward} XP)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
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
