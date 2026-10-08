import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Check,
  Calculator,
  BookOpen,
  CheckSquare,
  Search,
  Layers,
  FileSpreadsheet,
  Edit3,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
} from '../services/sgsRosterAndSubmissionService';
import {
  teacherCourseAssignmentService,
  TEACHER_SUBJECTS_LIST,
  type GradingQueueItem,
} from '../services/teacherCourseAssignmentService';
import { ArtworkPreviewModal } from '../components/teacher/ArtworkPreviewModal';
import { SgsClassroomMatrixModal } from '../components/teacher/SgsClassroomMatrixModal';
import { Submission3ColorMatrixModal } from '../components/teacher/Submission3ColorMatrixModal';
import { AssignmentBundlesModal } from '../components/teacher/AssignmentBundlesModal';
import { GradingWorkspaceModal } from '../components/teacher/GradingWorkspaceModal';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

export type QuickFilterMode = 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';

interface AssignmentManagementViewProps {
  initialQuickFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
}

export const AssignmentManagementView: React.FC<AssignmentManagementViewProps> = ({
  initialQuickFilter: _initialQuickFilter = 'ALL',
  initialHighlightBanner: _initialHighlightBanner = null,
}) => {
  // --------------------------------------------------------------------------
  // 1. Queue & Filtering State
  // --------------------------------------------------------------------------
  const [queueItems, setQueueItems] = useState<GradingQueueItem[]>(() =>
    teacherCourseAssignmentService.getGradingQueue()
  );

  // Filters
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --------------------------------------------------------------------------
  // 2. Modals State
  // --------------------------------------------------------------------------
  // Focused Grading Workspace Modal
  const [gradingModalItem, setGradingModalItem] = useState<GradingQueueItem | null>(null);

  // Small Icon Triggered Modals
  const [isSgsMatrixOpen, setIsSgsMatrixOpen] = useState<boolean>(false);
  const [is3ColorMatrixOpen, setIs3ColorMatrixOpen] = useState<boolean>(false);
  const [isBundlesModalOpen, setIsBundlesModalOpen] = useState<boolean>(false);

  // Artwork Preview Modal
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
    window.addEventListener('kp-grading-queue-updated', handleQueueUpdate);
    return () => {
      window.removeEventListener('kp-grading-queue-updated', handleQueueUpdate);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. Filtered Queue Submissions (FIFO order)
  // --------------------------------------------------------------------------
  const filteredSubmissions = useMemo(() => {
    return queueItems.filter((item) => {
      // Filter by subject
      if (selectedSubjectCode !== 'ALL' && item.subjectCode !== selectedSubjectCode) {
        return false;
      }
      // Filter by classroom
      if (selectedRoom !== 'ALL' && item.classroom !== selectedRoom) {
        return false;
      }
      // Filter by status
      if (selectedStatus === 'PENDING' && item.status !== 'PENDING_REVIEW') {
        return false;
      }
      if (selectedStatus === 'GRADED' && item.status !== 'GRADED') {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesCode = item.studentCode.includes(q);
        const matchesTitle = item.assignmentTitle.toLowerCase().includes(q);
        const matchesSeat = String(item.seatNo) === q;
        if (!matchesName && !matchesCode && !matchesTitle && !matchesSeat) {
          return false;
        }
      }
      return true;
    });
  }, [queueItems, selectedSubjectCode, selectedRoom, selectedStatus, searchQuery]);

  // Overall statistics for KPI cards
  const stats = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter((i) => i.status === 'PENDING_REVIEW').length;
    const graded = queueItems.filter((i) => i.status === 'GRADED').length;
    // Items submitted with delay or pending review count
    const late = queueItems.filter((i) => i.submittedAtText.includes('14:') || i.submittedAtText.includes('15:')).length;

    const gradedItems = queueItems.filter((i) => i.status === 'GRADED' && i.score !== undefined && i.score !== null);
    const avgScore =
      gradedItems.length > 0
        ? (gradedItems.reduce((sum, i) => sum + (i.score || 0), 0) / gradedItems.length).toFixed(1)
        : '-';

    return { total, pending, graded, late, avgScore };
  }, [queueItems]);

  // Handle grade submission
  const handleSaveGrade = (itemId: string, score: number, feedback: string) => {
    const targetItem = queueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    const { nextPendingItem } = teacherCourseAssignmentService.submitGrade(itemId, score, feedback);

    // Sync to SGS submission service
    sgsRosterAndSubmissionService.gradeSubmission(
      targetItem.assignmentId,
      targetItem.studentCode,
      score,
      'GRADED'
    );

    showToast(`✓ บันทึกคะแนน ${targetItem.studentName} (${score}/${targetItem.maxScore} คะแนน) เรียบร้อยแล้ว`);

    // Auto advance to next pending submission in the current filtered list
    if (nextPendingItem) {
      const nextFiltered = filteredSubmissions.find((i) => i.id === nextPendingItem.id);
      if (nextFiltered) {
        setGradingModalItem(nextFiltered);
        return;
      }
    }

    // Look for any other pending item in filtered list
    const nextInFilter = filteredSubmissions.find((i) => i.id !== itemId && i.status === 'PENDING_REVIEW');
    if (nextInFilter) {
      setGradingModalItem(nextInFilter);
    } else {
      setGradingModalItem(null);
      showToast('🎉 ตรวจครบทุกชิ้นในคิวนี้เรียบร้อยแล้ว!');
    }
  };

  // Launch grading on first pending item
  const handleStartFirstPending = () => {
    const firstPending = filteredSubmissions.find((i) => i.status === 'PENDING_REVIEW') || filteredSubmissions[0];
    if (firstPending) {
      setGradingModalItem(firstPending);
    } else {
      showToast('ไม่มีงานรอตรวจในเงื่อนไขตัวกรองนี้');
    }
  };

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
      {/* 1. TOP HEADER & SECONDARY ACTIONS (SMALL ICONS ONLY) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ตรวจงาน & ให้คะแนน (Assignment Grading)
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ⚡ FIFO คิวตรวจงาน
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ศูนย์รวมผลงานที่นักเรียนส่งเข้ามา ตรวจงานและบันทึกคะแนนสะดวกรวดเร็วตามลำดับเวลา
              </p>
            </div>
          </div>

          {/* Secondary Actions as SMALL ICONS ONLY (ตามคำสั่ง: เอาเป็นไอคอนเล็กๆก็พอ) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* 1. ดูคะแนนรายชั้น Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsSgsMatrixOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="ดูคะแนนรายชั้น และสมุด ปพ.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">ดูคะแนนรายชั้น</span>
            </button>

            {/* 2. ตารางการส่งงาน 3 สี Modal Trigger */}
            <button
              type="button"
              onClick={() => setIs3ColorMatrixOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="ตารางเช็คส่งงาน 3 สี เขียว-ส้ม-แดง"
            >
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span className="hidden md:inline">ตารางส่งงาน 3 สี</span>
            </button>

            {/* 3. งานรวมเฉลี่ยคะแนน Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsBundlesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="ตั้งค่าหมวดหมู่งานรวมและปัดเศษทศนิยม 0.5"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">งานรวมเฉลี่ย</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. HERO BANNER: Master PageHeroBanner Design                        */}
      {/* ==================================================================== */}
      <PageHeroBanner
        title="คิวตรวจงานนักเรียนรวม (FIFO)"
        subtitle="ตรวจงานและให้คะแนนสะดวกรวดเร็ว ไม่พลาดทุกความพยายามของนักเรียน"
        icon={<BookOpen className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="FIFO Queue"
        tagText="📝 งานทั้งหมด • รอตรวจ • ตรวจแล้ว • ส่งล่าช้า • ระบบคะแนน SGS"
        quoteLines={[
          'ตรวจงานตรงเวลา',
          'สะท้อนผลการเรียนรู้',
          'สู่การพัฒนาที่ยั่งยืน',
        ]}
        actions={
          <button
            type="button"
            onClick={handleStartFirstPending}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>เริ่มตรวจคิวแรกทันที ({stats.pending} งานรอตรวจ)</span>
          </button>
        }
      />

      {/* ==================================================================== */}
      {/* 3. 5 KPI SUMMARY STAT CARDS (ตรงตามสไตล์ใน Mockup) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">งานที่ส่งทั้งหมด</span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
              {stats.total} <span className="text-xs font-semibold text-slate-500">งาน</span>
            </span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl border border-amber-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 block">⏳ รอตรวจ</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-900 tabular-nums">
              {stats.pending} <span className="text-xs font-semibold text-amber-700">งาน</span>
            </span>
          </div>
        </div>

        {/* Graded */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 block">✅ ตรวจแล้ว</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-900 tabular-nums">
              {stats.graded} <span className="text-xs font-semibold text-emerald-700">งาน</span>
            </span>
          </div>
        </div>

        {/* Late Submissions */}
        <div className="bg-white rounded-2xl border border-rose-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-700 block">⚠️ ส่งล่าช้า</span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-900 tabular-nums">
              {stats.late} <span className="text-xs font-semibold text-rose-700">งาน</span>
            </span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">⭐ คะแนนเฉลี่ย</span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
              {stats.avgScore} <span className="text-xs font-semibold text-slate-500">คะแนน</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. FILTER TOOLBAR: รายวิชา | ชั้น | สถานะ | ค้นหา */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Filter 1: Subject Dropdown */}
          <div className="lg:col-span-3">
            <label htmlFor="filter-subject" className="text-[11px] font-bold text-slate-500 block mb-1">
              รายวิชาที่สอน:
            </label>
            <div className="relative">
              <select
                id="filter-subject"
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">ทุกรายวิชาที่สอน (ทั้งหมด)</option>
                {TEACHER_SUBJECTS_LIST.map((subj) => (
                  <option key={subj.code} value={subj.code}>
                    {subj.code} {subj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter 2: Classroom Dropdown */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-room" className="text-[11px] font-bold text-slate-500 block mb-1">
              ชั้น / ห้องเรียน:
            </label>
            <div className="relative">
              <select
                id="filter-room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">ทุกห้องเรียน (ทั้งหมด)</option>
                <option value="ม.3/1">ห้อง ม.3/1 (ห้องประจำชั้น)</option>
                <option value="ม.3/2">ห้อง ม.3/2</option>
                <option value="ม.2/1">ห้อง ม.2/1</option>
                <option value="ม.1/8">ห้อง ม.1/8</option>
              </select>
            </div>
          </div>

          {/* Filter 3: Status Dropdown */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-status" className="text-[11px] font-bold text-slate-500 block mb-1">
              สถานะตรวจงาน:
            </label>
            <div className="relative">
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'PENDING' | 'GRADED')}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">ทั้งหมด ({queueItems.length})</option>
                <option value="PENDING">⏳ รอตรวจ ({stats.pending})</option>
                <option value="GRADED">✅ ตรวจแล้ว ({stats.graded})</option>
              </select>
            </div>
          </div>

          {/* Filter 4: Search input */}
          <div className="lg:col-span-3">
            <label htmlFor="filter-search" className="text-[11px] font-bold text-slate-500 block mb-1">
              ค้นหาข้อมูล:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="filter-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อนักเรียน, รหัส, ชื่องาน..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="lg:col-span-2 flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectCode('ALL');
                setSelectedRoom('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. CENTRAL VIEW: UNIFIED SUBMISSIONS TABLE (DESKTOP) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              รายการผลงานนักเรียนที่ส่งเข้ามา ({filteredSubmissions.length} รายการ)
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              • เรียงตามเวลาที่ส่งจริง (FIFO ใครส่งก่อนอยู่บนสุด)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>แสดง {filteredSubmissions.length} จาก {queueItems.length} งาน</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              ไม่พบผลงานที่ตรงกับเงื่อนไขการค้นหา
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ลองเปลี่ยนรายวิชา ห้องเรียน หรือล้างคำค้นหาเพื่อดูรายการส่งงานอื่น
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[200px]">ข้อมูลนักเรียน</th>
                    <th className="py-3 px-4 min-w-[220px]">รายวิชา & ชื่องาน</th>
                    <th className="py-3 px-4 min-w-[160px]">ไฟล์/สื่อที่ส่ง</th>
                    <th className="py-3 px-4 min-w-[130px]">เวลาที่ส่ง</th>
                    <th className="py-3 px-4 text-center min-w-[100px]">คะแนน</th>
                    <th className="py-3 px-4 text-center min-w-[110px]">สถานะ</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">ตรวจงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-1">
                            ยังไม่มีภาระงานหรือการบ้านในขณะนี้
                          </h3>
                          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                            เริ่มต้นสร้างภาระงาน กำหนดคะแนน และมอบหมายให้นักเรียนส่งงานในรายวิชาของคุณ
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsBundlesModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>+ สร้างภาระงานใหม่</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((item) => {
                      const isGraded = item.status === 'GRADED';
                      const isPdf = item.submissionChannel === 'PDF_UPLOAD' || (item.fileName || '').endsWith('.pdf');
                      const isLink = item.submissionChannel === 'LINK_URL' || item.externalLinkUrl;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                        {/* Queue No */}
                        <td className="py-3 px-4 text-center font-bold text-slate-500 tabular-nums">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center mx-auto text-[11px]">
                            {item.queueNo}
                          </span>
                        </td>

                        {/* Student Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                              <img
                                src={
                                  item.studentName.includes('ด.ญ.')
                                    ? '/images/banners/student-avatar-girl.png'
                                    : '/images/banners/student-avatar.png'
                                }
                                alt={item.studentName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 leading-tight">
                                {item.studentName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                เลขที่ {item.seatNo} • ห้อง {item.classroom} • รหัส {item.studentCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Course & Assignment */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {item.subjectCode}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold truncate">
                                {item.sgsUnit}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 line-clamp-1" title={item.assignmentTitle}>
                              {item.assignmentTitle}
                            </div>
                          </div>
                        </td>

                        {/* Attachment Preview Badge */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewItem({
                                  title: item.assignmentTitle,
                                  studentName: item.studentName,
                                  studentCode: item.studentCode,
                                  classroom: item.classroom,
                                  seatNo: item.seatNo,
                                  type: isPdf ? 'PDF' : isLink ? 'LINK' : 'IMAGE',
                                  url: item.filePreviewUrl || item.externalLinkUrl,
                                  fileName: item.fileName,
                                  platform: item.externalPlatform,
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="คลิกเพื่อพรีวิวผลงานเต็มตา"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate max-w-[100px]">
                                {isPdf ? 'PDF' : isLink ? (item.externalPlatform || 'Link') : 'รูปภาพ'}
                              </span>
                            </button>
                            <span className="text-[11px] text-slate-500 truncate max-w-[90px]" title={item.fileName}>
                              {item.fileName || 'ไฟล์ผลงาน'}
                            </span>
                          </div>
                        </td>

                        {/* Submitted Timestamp */}
                        <td className="py-3 px-4">
                          <div className="text-[11px] font-bold text-slate-800">
                            {item.submittedAtText}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ ตรงเวลา
                          </span>
                        </td>

                        {/* Score Column */}
                        <td className="py-3 px-4 text-center">
                          {isGraded ? (
                            <div className="font-extrabold text-sm text-emerald-700 tabular-nums">
                              {item.score}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                / {item.maxScore}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">
                              - / {item.maxScore}
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-4 text-center">
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>ตรวจแล้ว</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>รอตรวจ</span>
                            </span>
                          )}
                        </td>

                        {/* Action Column: Big Focus Grading Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setGradingModalItem(item)}
                            className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                              isGraded
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isGraded ? 'แก้ไขคะแนน' : 'ตรวจและให้คะแนน'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>

            {/* ================================================================ */}
            {/* 6. MOBILE FIRST RESPONSIVE VIEW (NO HORIZONTAL SCROLL) */}
            {/* ================================================================ */}
            <div className="block lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredSubmissions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    ยังไม่มีภาระงานหรือการบ้านในขณะนี้
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed max-w-xs">
                    เริ่มต้นสร้างภาระงาน กำหนดคะแนน และมอบหมายให้นักเรียนส่งงานในรายวิชาของคุณ
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBundlesModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>+ สร้างภาระงานใหม่</span>
                  </button>
                </div>
              ) : (
                filteredSubmissions.map((item) => {
                const isGraded = item.status === 'GRADED';
                const isPdf = item.submissionChannel === 'PDF_UPLOAD' || (item.fileName || '').endsWith('.pdf');
                const isLink = item.submissionChannel === 'LINK_URL' || item.externalLinkUrl;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs"
                  >
                    {/* Header: Student & Queue & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                          <img
                            src={
                              item.studentName.includes('ด.ญ.')
                                ? '/images/banners/student-avatar-girl.png'
                                : '/images/banners/student-avatar.png'
                            }
                            alt={item.studentName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {item.studentName}
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            เลขที่ {item.seatNo} • ห้อง {item.classroom} (คิว #{item.queueNo})
                          </div>
                        </div>
                      </div>

                      {/* Status Pill */}
                      {isGraded ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                          ✓ {item.score}/{item.maxScore}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                          ⏳ รอตรวจ
                        </span>
                      )}
                    </div>

                    {/* Assignment Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                        <span>{item.subjectCode}</span>
                        <span>•</span>
                        <span>{item.sgsUnit}</span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {item.assignmentTitle}
                      </div>
                    </div>

                    {/* Attachment preview row */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewItem({
                            title: item.assignmentTitle,
                            studentName: item.studentName,
                            studentCode: item.studentCode,
                            classroom: item.classroom,
                            seatNo: item.seatNo,
                            type: isPdf ? 'PDF' : isLink ? 'LINK' : 'IMAGE',
                            url: item.filePreviewUrl || item.externalLinkUrl,
                            fileName: item.fileName,
                            platform: item.externalPlatform,
                          });
                        }}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>ดูผลงาน ({isPdf ? 'PDF' : isLink ? 'Link' : 'รูปภาพ'})</span>
                      </button>

                      <span className="text-[11px] text-slate-500">
                        ส่งเมื่อ {item.submittedAtText}
                      </span>
                    </div>

                    {/* Big Touch Action Button (min-height 44px) */}
                    <button
                      type="button"
                      onClick={() => setGradingModalItem(item)}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        isGraded
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isGraded ? 'แก้ไขคะแนน' : `ตรวจและให้คะแนน (${item.maxScore} คะแนน)`}</span>
                    </button>
                  </div>
                );
              })
            )}
            </div>
          </>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 7. STICKY MOBILE BOTTOM REVIEW BAR */}
      {/* ==================================================================== */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <button
          type="button"
          onClick={handleStartFirstPending}
          className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>🚀 ตรวจงานถัดไปทันที ({stats.pending} งานค้าง)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 8. MODALS (FOCUSED WORKSPACE & SECONDARY VIEWS) */}
      {/* ==================================================================== */}
      {/* Dedicated Dual-Pane Grading Workspace Modal */}
      <GradingWorkspaceModal
        isOpen={Boolean(gradingModalItem)}
        onClose={() => setGradingModalItem(null)}
        currentItem={gradingModalItem}
        allItems={filteredSubmissions}
        onSaveGrade={handleSaveGrade}
        onSelectQueueItem={(item) => setGradingModalItem(item)}
      />

      {/* Classroom Score Matrix Modal (Icon triggered) */}
      <SgsClassroomMatrixModal
        isOpen={isSgsMatrixOpen}
        onClose={() => setIsSgsMatrixOpen(false)}
        defaultSubjectCode={selectedSubjectCode === 'ALL' ? 'ศ23101' : selectedSubjectCode}
        defaultRoom={selectedRoom === 'ALL' ? 'ม.3/1' : selectedRoom}
      />

      {/* 3-Color Submission Matrix Modal (Icon triggered) */}
      <Submission3ColorMatrixModal
        isOpen={is3ColorMatrixOpen}
        onClose={() => setIs3ColorMatrixOpen(false)}
        defaultSubjectCode={selectedSubjectCode === 'ALL' ? 'ศ23101' : selectedSubjectCode}
        defaultRoom={selectedRoom === 'ALL' ? 'ม.3/1' : selectedRoom}
        onOpenPreview={(preview) => setPreviewItem(preview)}
        onGradeQuick={(_asgId, _stuCode, _max) => {
          showToast('✓ บันทึกสถานะส่งงานเรียบร้อยแล้ว');
        }}
      />

      {/* Assignment Bundles Modal (Icon triggered) */}
      <AssignmentBundlesModal
        isOpen={isBundlesModalOpen}
        onClose={() => setIsBundlesModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Artwork Preview Modal */}
      <ArtworkPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'ผลงานนักเรียน'}
        studentName={previewItem?.studentName || ''}
        studentCode={previewItem?.studentCode}
        classroom={previewItem?.classroom || 'ม.3/1'}
        seatNo={previewItem?.seatNo}
        type={previewItem?.type || 'IMAGE'}
        url={previewItem?.url}
        fileName={previewItem?.fileName}
        platform={previewItem?.platform}
      />
    </div>
  );
};
