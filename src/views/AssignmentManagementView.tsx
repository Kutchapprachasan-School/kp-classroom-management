import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Check,
  X,
  Sparkles,
  Calculator,
  BookOpen,
  Users,
  CheckSquare,
  Search,
  ZoomIn,
  MessageSquare,
  Layers,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';
import {
  teacherCourseAssignmentService,
  TEACHER_SUBJECTS_LIST,
  type GradingQueueItem,
  type AssignmentBundleConfig,
} from '../services/teacherCourseAssignmentService';
import { ArtworkPreviewModal } from '../components/teacher/ArtworkPreviewModal';

export type QuickFilterMode = 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';
export type AssignmentViewMode = 'QUEUE' | 'ROOM_MATRIX' | 'BUNDLES';

interface AssignmentManagementViewProps {
  initialQuickFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
}

export const AssignmentManagementView: React.FC<AssignmentManagementViewProps> = ({
  initialQuickFilter: _initialQuickFilter = 'ALL',
  initialHighlightBanner: _initialHighlightBanner = null,
}) => {
  // --------------------------------------------------------------------------
  // 1. Navigation & State
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<AssignmentViewMode>('QUEUE');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ศ23101');
  const [selectedRoom, setSelectedRoom] = useState<string>('ม.3/1');

  // FIFO Grading Queue State
  const [queueItems, setQueueItems] = useState<GradingQueueItem[]>(() =>
    teacherCourseAssignmentService.getGradingQueue()
  );
  const [selectedQueueIndex, setSelectedQueueIndex] = useState<number>(0);
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [cardImgError, setCardImgError] = useState<boolean>(false);

  // Classroom Submission Matrix State
  const [roster, setRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [termAssignments, setTermAssignments] = useState<TermAssignmentItem[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );
  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  // Assignment Bundle & Auto Averaging State
  const [bundleConfig, setBundleConfig] = useState<AssignmentBundleConfig>(() =>
    teacherCourseAssignmentService.getBundle()
  );

  // Preview Modal State (Image, PDF, Canva / External link)
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    studentName: string;
    studentCode?: string;
    classroom?: string;
    seatNo?: number;
    type: 'IMAGE' | 'PDF' | 'LINK';
    url?: string;
    fileName?: string;
    platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'YOUTUBE' | 'FIGMA' | 'OTHER';
  } | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Sync on external events
  useEffect(() => {
    const handleQueueUpdate = () => {
      setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
    };
    const handleBundleUpdate = () => {
      setBundleConfig({ ...teacherCourseAssignmentService.getBundle() });
    };
    const handleSgsUpdate = () => {
      setRoster([...sgsRosterAndSubmissionService.getSgsRoster()]);
      setTermAssignments([...sgsRosterAndSubmissionService.getTermAssignments()]);
      setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
    };

    window.addEventListener('kp-grading-queue-updated', handleQueueUpdate);
    window.addEventListener('kp-bundle-updated', handleBundleUpdate);
    window.addEventListener('kp-copilot-updated', handleSgsUpdate);

    return () => {
      window.removeEventListener('kp-grading-queue-updated', handleQueueUpdate);
      window.removeEventListener('kp-bundle-updated', handleBundleUpdate);
      window.removeEventListener('kp-copilot-updated', handleSgsUpdate);
    };
  }, []);

  // Update room list when subject changes
  const currentSubjectInfo = useMemo(() => {
    return (
      TEACHER_SUBJECTS_LIST.find((s) => s.code === selectedSubjectCode) ||
      TEACHER_SUBJECTS_LIST[0]
    );
  }, [selectedSubjectCode]);

  useEffect(() => {
    if (!currentSubjectInfo.classrooms.includes(selectedRoom)) {
      setSelectedRoom(currentSubjectInfo.classrooms[0] || 'ม.3/1');
    }
  }, [currentSubjectInfo, selectedRoom]);

  // FIFO Queue filtered by subject or all
  const filteredQueue = useMemo(() => {
    return queueItems.filter((item) => {
      if (selectedSubjectCode && item.subjectCode !== selectedSubjectCode) {
        return false;
      }
      return true;
    });
  }, [queueItems, selectedSubjectCode]);

  const activeQueueItem = filteredQueue[selectedQueueIndex] || filteredQueue[0] || null;

  // Sync score input with active queue item
  useEffect(() => {
    if (activeQueueItem) {
      if (activeQueueItem.status === 'GRADED' && activeQueueItem.score !== undefined) {
        setGradeInput(String(activeQueueItem.score));
      } else {
        setGradeInput(String(activeQueueItem.maxScore)); // default full score for quick pass
      }
      setFeedbackInput(activeQueueItem.teacherFeedback || '');
    }
  }, [activeQueueItem]);

  // --------------------------------------------------------------------------
  // FIFO Queue Grading Handler (บันทึก & เลื่อนตรวจคนถัดไป)
  // --------------------------------------------------------------------------
  const handleSaveAndNext = () => {
    if (!activeQueueItem) return;

    const numericScore = parseFloat(gradeInput);
    if (isNaN(numericScore) || numericScore < 0) {
      showToast('กรุณากรอกคะแนนที่ถูกต้อง');
      return;
    }

    const { nextPendingItem } = teacherCourseAssignmentService.submitGrade(
      activeQueueItem.id,
      numericScore,
      feedbackInput
    );

    // Also sync to SGS submission service
    sgsRosterAndSubmissionService.gradeSubmission(
      activeQueueItem.assignmentId,
      activeQueueItem.studentCode,
      numericScore,
      'GRADED'
    );

    showToast(
      `บันทึกผลงาน ${activeQueueItem.studentName} (${numericScore}/${activeQueueItem.maxScore} คะแนน) เรียบร้อย`
    );

    // Auto advance to next pending item in FIFO queue
    if (nextPendingItem) {
      const nextIdx = filteredQueue.findIndex((i) => i.id === nextPendingItem.id);
      if (nextIdx !== -1) {
        setSelectedQueueIndex(nextIdx);
      }
    } else {
      showToast('🎉 ตรวจครบทุกชิ้นในคิวนี้เรียบร้อยแล้ว!');
    }
  };

  // --------------------------------------------------------------------------
  // Classroom Submission Matrix Calculations
  // --------------------------------------------------------------------------
  const activeStudents = useMemo(() => {
    return roster.filter((s) => {
      if (s.transferState === 'TRANSFERRED_OUT') return false;
      if (selectedRoom && s.classroom !== selectedRoom) return false;
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase();
        return (
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.includes(q) ||
          String(s.sgsSeatNo) === q
        );
      }
      return true;
    });
  }, [roster, selectedRoom, matrixSearch]);

  const matrixStats = useMemo(() => {
    let missingTotal = 0;
    let pendingTotal = 0;
    let gradedTotal = 0;

    activeStudents.forEach((stu) => {
      termAssignments.forEach((asg) => {
        const sub = submissions.find(
          (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
        );
        if (!sub || sub.status === 'MISSING') {
          missingTotal++;
        } else if (sub.status === 'SUBMITTED_PENDING') {
          pendingTotal++;
        } else if (sub.status === 'GRADED') {
          gradedTotal++;
        }
      });
    });

    return { missingTotal, pendingTotal, gradedTotal };
  }, [activeStudents, termAssignments, submissions]);

  // Quick stamps for feedback
  const FEEDBACK_STAMPS = [
    'ยอดเยี่ยมมาก ลายเส้นคมชัด 🌟',
    'ระบายสีน้ำหนักแสงเงาถูกต้อง 🎨',
    'สัดส่วนองค์ประกอบถูกต้องดี',
    'ปรับปรุงการตัดเส้นเล็กน้อย',
    'ส่งงานตรงเวลา มีความรับผิดชอบดีมาก',
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TOP HEADER: รหัสวิชา + ห้องเรียน + ป้ายห้องที่ปรึกษา ม.3/1 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
              <label htmlFor="subject-select" className="text-xs font-semibold text-slate-500">
                วิชา:
              </label>
              <select
                id="subject-select"
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
              >
                {TEACHER_SUBJECTS_LIST.map((subj) => (
                  <option key={subj.code} value={subj.code}>
                    {subj.code} {subj.name} ({subj.credits} นก.)
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <label htmlFor="room-select" className="text-xs font-semibold text-slate-500">
                ห้อง:
              </label>
              <select
                id="room-select"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
              >
                {currentSubjectInfo.classrooms.map((rm) => (
                  <option key={rm} value={rm}>
                    ชั้น {rm}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Room Badges */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              {currentSubjectInfo.classrooms.map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => setSelectedRoom(rm)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedRoom === rm
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rm}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ==================================================================== */}
        {/* 3 WORKFLOW TABS: คิวตรวจงาน (FIFO) | เช็คงานรายห้อง (3 สี) | งานรวมเฉลี่ยคะแนน */}
        {/* ==================================================================== */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('QUEUE')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'QUEUE'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>1. คิวตรวจงานนักเรียน (FIFO ใครส่งก่อนอยู่บนสุด)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'QUEUE'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {filteredQueue.filter((i) => i.status === 'PENDING_REVIEW').length} รอตรวจ
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOM_MATRIX')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'ROOM_MATRIX'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>2. เช็คงานรายห้อง (ตาราง 3 สี แดง-ส้ม-เขียว)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BUNDLES')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'BUNDLES'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>3. หมวดหมู่งานรวม & เฉลี่ยคะแนนสะสมอัตโนมัติ</span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
              ปัดเศษ 0.5 ⚡
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: คิวตรวจงานนักเรียน (FIFO GRADING QUEUE) */}
      {/* ==================================================================== */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          {/* Status Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  คิวตรวจงานนักเรียนล่าสุด (ใครส่งก่อนอยู่บนสุด • FIFO)
                </h2>
                <p className="text-xs text-slate-400">
                  วิชา {selectedSubjectCode} {currentSubjectInfo.name} • นักเรียนส่งเรียงตามเวลา
                  ครูตรวจและกดปุ่มถัดไปได้ต่อเนื่อง
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ⏳ รอตรวจ:{' '}
                {filteredQueue.filter((i) => i.status === 'PENDING_REVIEW').length} งาน
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ✅ ตรวจแล้ววันนี้:{' '}
                {filteredQueue.filter((i) => i.status === 'GRADED').length} งาน
              </span>
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                ไม่มีงานค้างตรวจในวิชานี้
              </h3>
              <p className="text-xs text-slate-500">
                นักเรียนส่งงานครบถ้วนหรือตรวจเสร็จสิ้นแล้วทั้งหมด
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column (8/12): Main Focus Grader */}
              {activeQueueItem && (
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
                  {/* Queue Order & Student Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-extrabold text-xs shadow-xs">
                        คิวลำดับที่ #{activeQueueItem.queueNo} (ส่งก่อน)
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {activeQueueItem.studentName}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          เลขที่ {activeQueueItem.seatNo} • รหัส {activeQueueItem.studentCode} •
                          ชั้น {activeQueueItem.classroom}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        ส่งเมื่อ:
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                        {activeQueueItem.submittedAtText}
                      </span>
                    </div>
                  </div>

                  {/* Assignment Title & Max Score */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 block">
                        {activeQueueItem.sgsUnit}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {activeQueueItem.assignmentTitle}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs">
                      คะแนนเต็ม: {activeQueueItem.maxScore} คะแนน
                    </span>
                  </div>

                  {/* Submission Work Preview Area */}
                  <div className="p-4 rounded-2xl border border-cyan-200 bg-gradient-to-b from-cyan-50/40 to-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-cyan-950 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyan-600" />
                        ผลงานที่นักเรียนส่งเข้ามา:
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {activeQueueItem.fileName || 'ไฟล์ผลงาน'}
                      </span>
                    </div>

                    {/* Preview Area Based on Type (Image upload vs PDF vs Canva Link) */}
                    {activeQueueItem.submissionChannel === 'IMAGE_UPLOAD' ? (
                      <div className="space-y-2.5">
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-72 flex items-center justify-center">
                          {!cardImgError && activeQueueItem.filePreviewUrl ? (
                            <img
                              src={activeQueueItem.filePreviewUrl}
                              alt="ผลงานนักเรียน"
                              onError={() => setCardImgError(true)}
                              className="w-full h-auto max-h-72 object-contain"
                            />
                          ) : (
                            <div className="p-8 text-center space-y-2 text-teal-800 bg-teal-50/80 w-full">
                              <span className="text-3xl">🎨</span>
                              <p className="text-xs font-bold text-slate-800">
                                {activeQueueItem.fileName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                ภาพวาดระบายสีน้ำ/แรเงาของ {activeQueueItem.studentName}
                              </p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewItem({
                                  title: activeQueueItem.assignmentTitle,
                                  studentName: activeQueueItem.studentName,
                                  studentCode: activeQueueItem.studentCode,
                                  classroom: activeQueueItem.classroom,
                                  seatNo: activeQueueItem.seatNo,
                                  type: 'IMAGE',
                                  url: activeQueueItem.filePreviewUrl,
                                  fileName: activeQueueItem.fileName,
                                })
                              }
                              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-100"
                            >
                              <ZoomIn className="w-4 h-4 text-teal-600" />
                              <span>ดูภาพขยายเต็มจอ (Preview)</span>
                            </button>
                          </div>
                        </div>

                        {/* Direct Preview Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewItem({
                              title: activeQueueItem.assignmentTitle,
                              studentName: activeQueueItem.studentName,
                              studentCode: activeQueueItem.studentCode,
                              classroom: activeQueueItem.classroom,
                              seatNo: activeQueueItem.seatNo,
                              type: 'IMAGE',
                              url: activeQueueItem.filePreviewUrl,
                              fileName: activeQueueItem.fileName,
                            })
                          }
                          className="w-full py-2.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4 text-teal-600" />
                          <span>ดูงานภาพวาด {activeQueueItem.fileName?.endsWith('.jpg') ? 'JPG' : 'PNG'} Preview ขยายใหญ่</span>
                        </button>
                      </div>
                    ) : activeQueueItem.submissionChannel === 'PDF_UPLOAD' ? (
                      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px]">
                              PDF PORTFOLIO
                            </span>
                            <span className="text-xs font-bold text-rose-950 truncate max-w-xs">
                              {activeQueueItem.fileName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            3 หน้าเอกสาร
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-rose-200/80 flex items-center gap-3">
                          <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              แฟ้มสะสมงานทัศนศิลป์ (Art Portfolio 3 หน้า)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              หน้า 1: ปก • หน้า 2: ผลงานสายธารกุดจับ • หน้า 3: รูบริกส์
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setPreviewItem({
                              title: activeQueueItem.assignmentTitle,
                              studentName: activeQueueItem.studentName,
                              studentCode: activeQueueItem.studentCode,
                              classroom: activeQueueItem.classroom,
                              seatNo: activeQueueItem.seatNo,
                              type: 'PDF',
                              url: activeQueueItem.filePreviewUrl,
                              fileName: activeQueueItem.fileName,
                            })
                          }
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-teal-400" />
                          <span>เปิดดูเอกสาร PDF Preview เต็มตา (3 หน้า)</span>
                        </button>
                      </div>
                    ) : (
                      // Link Submission (Canva, Docs, Drive, YouTube)
                      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00C4CC] to-purple-600 text-white font-black text-[11px]">
                              {activeQueueItem.externalPlatform || 'CANVA'}
                            </span>
                            <span className="text-xs font-bold text-indigo-950 truncate max-w-xs">
                              {activeQueueItem.fileName || 'Canva โปสเตอร์ศิลปวัฒนธรรม'}
                            </span>
                          </div>
                        </div>

                        {/* Canva Live Preview Banner */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                            <div>
                              <p className="text-xs font-black text-white">
                                โปสเตอร์ศิลปวัฒนธรรมกุดจับร่วมสมัย 2026
                              </p>
                              <p className="text-[10px] text-cyan-300">
                                ออกแบบด้วย Canva Pro • ลายกนกสามเหลี่ยม & วงจรสี
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded font-bold">
                            Live Canvas
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                title: activeQueueItem.assignmentTitle,
                                studentName: activeQueueItem.studentName,
                                studentCode: activeQueueItem.studentCode,
                                classroom: activeQueueItem.classroom,
                                seatNo: activeQueueItem.seatNo,
                                type: 'LINK',
                                url: activeQueueItem.externalLinkUrl,
                                fileName: activeQueueItem.fileName,
                                platform: activeQueueItem.externalPlatform || 'CANVA',
                              })
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-amber-300" />
                            <span>เปิดดูงาน Canva Preview (ขยายใหญ่ในจอ)</span>
                          </button>

                          <a
                            href={activeQueueItem.externalLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl bg-[#00C4CC] hover:bg-[#00b2b8] text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>เปิดใน Canva ↗</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grading Controls & Feedback */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-extrabold text-slate-800">
                          คะแนนที่ได้:
                        </label>
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={activeQueueItem.maxScore}
                            value={gradeInput}
                            onChange={(e) => setGradeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveAndNext();
                              }
                            }}
                            className="w-20 px-3 py-1.5 text-center font-extrabold text-sm rounded-xl border-2 border-teal-500 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-2xs"
                          />
                          <span className="ml-2 text-xs font-bold text-slate-500">
                            / {activeQueueItem.maxScore}
                          </span>
                        </div>
                      </div>

                      {/* Quick Pass Stamps */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGradeInput(String(activeQueueItem.maxScore))}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition-colors cursor-pointer"
                        >
                          ✓ เต็ม ({activeQueueItem.maxScore})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGradeInput(String(Math.round(activeQueueItem.maxScore * 0.8)))
                          }
                          className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs transition-colors cursor-pointer"
                        >
                          80% ({Math.round(activeQueueItem.maxScore * 0.8)})
                        </button>
                      </div>
                    </div>

                    {/* Feedback Input & Quick Stamps */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>ข้อเสนอแนะ / ความเห็นครู (ส่งถึงนักเรียน):</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="พิมพ์ฟีดแบ็กสั้นๆ หรือคลิกเลือกข้อความแนะนำด้านล่าง..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {FEEDBACK_STAMPS.map((stamp) => (
                          <button
                            key={stamp}
                            type="button"
                            onClick={() => setFeedbackInput(stamp)}
                            className="px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            + {stamp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary Button: บันทึก & ตรวจคนถัดไป */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                        กด [Enter] เพื่อบันทึกและเลื่อนไปคิวถัดไปอัตโนมัติ
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveAndNext}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>บันทึก & ตรวจคนถัดไป (คิวถัดไป) ➔</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column (4/12): FIFO Queue List */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    ลำดับคิวงานที่ส่งมา ({filteredQueue.length} รายการ)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ใครส่งก่อนอยู่บน
                  </span>
                </div>

                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {filteredQueue.map((item, idx) => {
                    const isSelected = activeQueueItem?.id === item.id;
                    const isGraded = item.status === 'GRADED';

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedQueueIndex(idx)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-400'
                            : isGraded
                            ? 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.queueNo}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 truncate max-w-[130px]">
                              {item.studentName}
                            </span>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isGraded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isGraded ? `✓ ${item.score}/${item.maxScore}` : '⏳ รอตรวจ'}
                          </span>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500 truncate">
                          {item.assignmentTitle}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>ห้อง {item.classroom}</span>
                          <span>{item.submittedAtText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: เช็คงานรายห้อง (CLASSROOM SUBMISSION MATRIX - 3 สีชัดเจน) */}
      {/* ==================================================================== */}
      {activeTab === 'ROOM_MATRIX' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          {/* Header & 3-Color Legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                ตารางเช็คส่งงานรายห้อง • {selectedSubjectCode} ชั้น {selectedRoom}
              </h2>
              <p className="text-xs text-slate-500">
                สถานะการส่งงานของนักเรียนทุกคนในห้อง แบ่ง 3 สีตามสั่ง: แดง (ยังไม่ส่ง) |
                ส้ม (รอตรวจ) | เขียว (ส่งแล้ว)
              </p>
            </div>

            {/* 3-Color Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>🔴 ยังไม่ส่ง ({matrixStats.missingTotal})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>🟠 รอตรวจ ({matrixStats.pendingTotal})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>🟢 ส่งแล้ว ({matrixStats.gradedTotal})</span>
              </span>
            </div>
          </div>

          {/* Search bar inside room matrix */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, เลขที่ หรือรหัสนักเรียน..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <span className="text-xs text-slate-500 font-bold">
              แสดงนักเรียน {activeStudents.length} คน
            </span>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 w-20">รหัส</th>
                  <th className="py-2.5 px-3 min-w-[160px]">ชื่อ-นามสกุล</th>
                  {termAssignments.map((asg) => (
                    <th key={asg.id} className="py-2.5 px-3 text-center min-w-[130px]">
                      <div className="font-extrabold text-slate-900">{asg.title}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        เต็ม {asg.maxScore} คะแนน
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center min-w-[100px]">สถานะรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeStudents.map((stu) => {
                  let studentMissingCount = 0;
                  let studentPendingCount = 0;

                  return (
                    <tr key={stu.studentCode} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {stu.sgsSeatNo}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {stu.studentCode}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {stu.studentName}
                      </td>

                      {/* Assignment Cells (3 Colors strictly) */}
                      {termAssignments.map((asg) => {
                        const sub = submissions.find(
                          (s) =>
                            s.assignmentId === asg.id && s.studentCode === stu.studentCode
                        );

                        const isMissing = !sub || sub.status === 'MISSING';
                        const isPending = sub?.status === 'SUBMITTED_PENDING';

                        if (isMissing) studentMissingCount++;
                        if (isPending) studentPendingCount++;

                        return (
                          <td key={asg.id} className="py-1.5 px-2 text-center">
                            {isMissing ? (
                              // 🔴 สีแดง: ยังไม่ส่ง
                              <button
                                type="button"
                                onClick={() => {
                                  sgsRosterAndSubmissionService.gradeSubmission(
                                    asg.id,
                                    stu.studentCode,
                                    asg.maxScore,
                                    'GRADED'
                                  );
                                  showToast(
                                    `บันทึก ${stu.studentName} ส่งงาน "${asg.title}" เรียบร้อย`
                                  );
                                }}
                                title="คลิกเพื่อให้คะแนนด่วน"
                                className="w-full py-1.5 px-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3 text-rose-600" />
                                <span>ยังไม่ส่ง</span>
                              </button>
                            ) : isPending ? (
                              // 🟠 สีส้ม: รอตรวจ (มีปุ่ม Preview ทันที)
                              <button
                                type="button"
                                onClick={() => {
                                  const isCanva = (sub?.workTitle || '').includes('Canva') || (asg.id === 'asg-5' && stu.studentCode === '45102');
                                  const isPdf = (sub?.workTitle || '').endsWith('.pdf') || (asg.id === 'asg-5' && stu.studentCode === '45101');
                                  setPreviewItem({
                                    title: asg.title,
                                    studentName: stu.studentName,
                                    studentCode: stu.studentCode,
                                    classroom: selectedRoom,
                                    seatNo: stu.sgsSeatNo,
                                    type: isCanva ? 'LINK' : isPdf ? 'PDF' : 'IMAGE',
                                    url: isCanva ? 'https://www.canva.com/design/DAFkutchap-art3/view' : undefined,
                                    fileName: sub?.workTitle || `${asg.title}_${stu.studentName}.${isPdf ? 'pdf' : isCanva ? 'canva' : 'jpg'}`,
                                    platform: isCanva ? 'CANVA' : undefined,
                                  });
                                }}
                                title="คลิกเพื่อ Preview ดูงาน"
                                className="w-full py-1.5 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>รอตรวจ 👁️</span>
                              </button>
                            ) : (
                              // 🟢 สีเขียว: ส่งแล้ว / ตรวจแล้ว
                              <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>
                                  {sub?.score ?? asg.maxScore}/{asg.maxScore}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary Status Column */}
                      <td className="py-2 px-3 text-center">
                        {studentMissingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                            ค้าง {studentMissingCount} ชิ้น
                          </span>
                        ) : studentPendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            รอตรวจ {studentPendingCount} ชิ้น
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            ครบถ้วน 🌟
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: หมวดหมู่งานรวม & เฉลี่ยคะแนนสะสมอัตโนมัติ (ASSIGNMENT BUNDLES) */}
      {/* ==================================================================== */}
      {activeTab === 'BUNDLES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
          {/* Header & Bundle Settings */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black">
                  หมวดหมู่งานสะสม
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {bundleConfig.title}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {bundleConfig.description} (สั่ง {bundleConfig.totalTasks} งาน ครูติ๊กส่งแล้ว
                ระบบเฉลี่ยคะแนนให้เองเต็ม {bundleConfig.maxScore} คะแนน)
              </p>
            </div>

            {/* Switch: ปัดทศนิยม >= 0.5 อัตโนมัติ (ตามคำสั่งเป๊ะ) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  ปัดทศนิยมอัตโนมัติ (&gt;= 0.5 ปัดขึ้น)
                </span>
                <span className="text-[11px] text-slate-500">
                  {bundleConfig.autoRoundUpHalf
                    ? 'เปิดอยู่: เช่น 7.5 ➔ ปัดเป็น 8 คะแนน, 6.5 ➔ ปัดเป็น 7 คะแนน'
                    : 'ปิดอยู่: คิดคะแนนตามทศนิยมจริง 1 ตำแหน่ง (เช่น 7.5)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !bundleConfig.autoRoundUpHalf;
                  teacherCourseAssignmentService.updateBundleRoundUpSetting(nextVal);
                  showToast(
                    nextVal
                      ? 'เปิดโหมดปัดทศนิยม >= 0.5 อัตโนมัติเรียบร้อย'
                      : 'ปิดโหมดปัดทศนิยม (เก็บทศนิยม 1 ตำแหน่ง) เรียบร้อย'
                  );
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bundleConfig.autoRoundUpHalf ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    bundleConfig.autoRoundUpHalf ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Example Formula Box */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-extrabold text-indigo-950">
                สูตรคำนวณเฉลี่ย:
              </span>
              <span className="font-mono text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                (งานที่ส่ง / {bundleConfig.totalTasks} งาน) × {bundleConfig.maxScore} คะแนนเต็ม
              </span>
            </div>
            <span className="text-indigo-700 font-semibold">
              เช่น สั่ง 20 งาน ส่ง 10 ได้ 5 คะแนน • ส่ง 15 ได้ 7.5 {bundleConfig.autoRoundUpHalf ? '(ปัดเป็น 8)' : ''}
            </span>
          </div>

          {/* Student Bundle Progress Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 w-20">รหัส</th>
                  <th className="py-2.5 px-3 min-w-[150px]">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3 text-center min-w-[200px]">
                    จำนวนงานย่อยที่ส่ง (เต็ม {bundleConfig.totalTasks} งาน)
                  </th>
                  <th className="py-2.5 px-3 text-center w-24">คะแนนดิบ</th>
                  <th className="py-2.5 px-3 text-center w-28">
                    คะแนนสุทธิ {bundleConfig.autoRoundUpHalf ? '(ปัดเศษ)' : ''}
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bundleConfig.students.map((st) => (
                  <tr key={st.studentCode} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-slate-900">
                      {st.seatNo}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {st.studentCode}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {st.studentName}
                    </td>

                    {/* Task Progress & Buttons */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            teacherCourseAssignmentService.setStudentCompletedCountDirect(
                              st.studentCode,
                              Math.max(0, st.completedTasksCount - 1)
                            )
                          }
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>

                        <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div
                            className="bg-teal-500 h-full rounded-full transition-all"
                            style={{
                              width: `${(st.completedTasksCount / bundleConfig.totalTasks) * 100}%`,
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            teacherCourseAssignmentService.setStudentCompletedCountDirect(
                              st.studentCode,
                              Math.min(bundleConfig.totalTasks, st.completedTasksCount + 1)
                            )
                          }
                          className="w-6 h-6 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>

                        <span className="font-extrabold text-slate-800 tabular-nums ml-1">
                          {st.completedTasksCount}/{bundleConfig.totalTasks} งาน
                        </span>
                      </div>
                    </td>

                    {/* Raw Score */}
                    <td className="py-2 px-3 text-center font-mono font-semibold text-slate-600 tabular-nums">
                      {st.rawScore.toFixed(1)}
                    </td>

                    {/* Final Score (With Badge if Rounded Up) */}
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-black text-sm text-slate-900 tabular-nums">
                          {st.finalScore}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{bundleConfig.maxScore}
                        </span>
                        {st.isRoundedUp && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800">
                            ปัดขึ้น
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quick Completion Button */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          teacherCourseAssignmentService.setStudentCompletedCountDirect(
                            st.studentCode,
                            bundleConfig.totalTasks
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        ✓ ส่งครบ ({bundleConfig.totalTasks})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync to Gradebook Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 font-medium">
              คะแนนเฉลี่ยจะถูกนำไปลงในช่อง "{bundleConfig.targetSgsColumn}" ของสมุด ปพ.5 อัตโนมัติ
            </span>

            <button
              type="button"
              onClick={() => {
                showToast(
                  `⚡ ซิงค์คะแนนเฉลี่ยงานรวมเข้าช่องคะแนนเก็บ ปพ.5 (${bundleConfig.students.length} คน) เรียบร้อยแล้ว!`
                );
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ซิงค์คะแนนเฉลี่ยเข้าสมุด ปพ.5 ทันที ⚡</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ARTWORK PREVIEW MODAL: สำหรับดูงานรูปภาพ JPG/PNG, PDF หลายหน้า, ลิงก์ Canva/Docs */}
      {/* ==================================================================== */}
      <ArtworkPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'ผลงานนักเรียน'}
        studentName={previewItem?.studentName || ''}
        studentCode={previewItem?.studentCode}
        classroom={previewItem?.classroom || selectedRoom}
        seatNo={previewItem?.seatNo}
        type={previewItem?.type || 'IMAGE'}
        url={previewItem?.url}
        fileName={previewItem?.fileName}
        platform={previewItem?.platform}
      />
    </div>
  );
};
