import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Check,
  BookOpen,
  CheckSquare,
  Search,
  Layers,
  FileSpreadsheet,
  Play,
  RotateCcw,
  Plus,
  HelpCircle,
  Trash2,
  X,
  ClipboardList,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type FourScorePart,
  type TermAssignmentConfig,
} from '../services/sgsRosterAndSubmissionService';
import {
  teacherCourseAssignmentService,
  getDynamicTeachingSubjects,
  getAllAvailableClassroomLabels,
  type GradingQueueItem,
} from '../services/teacherCourseAssignmentService';
import { ArtworkPreviewModal } from '../components/teacher/ArtworkPreviewModal';
import { SgsClassroomMatrixModal } from '../components/teacher/SgsClassroomMatrixModal';
import { Submission3ColorMatrixModal } from '../components/teacher/Submission3ColorMatrixModal';
import { AssignmentBundlesModal } from '../components/teacher/AssignmentBundlesModal';
import { GradingWorkspaceModal } from '../components/teacher/GradingWorkspaceModal';
import { getBangkokTodayString } from '../utils/timetableDateUtils';

export type QuickFilterMode = 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';

interface AssignmentManagementViewProps {
  initialQuickFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
}

const SCORE_PART_LABELS: Record<FourScorePart, { label: string; cls: string }> = {
  PRE_MIDTERM: { label: 'ก่อนกลางภาค', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  MIDTERM: { label: 'กลางภาค', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  POST_MIDTERM: { label: 'หลังกลางภาค', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FINAL: { label: 'ปลายภาค', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const AssignmentManagementView: React.FC<AssignmentManagementViewProps> = ({
  initialQuickFilter: _initialQuickFilter = 'ALL',
  initialHighlightBanner: _initialHighlightBanner = null,
}) => {
  // 1. Dynamic Subjects & Real Classrooms
  const subjectsList = useMemo(() => getDynamicTeachingSubjects(), []);
  const allSystemClassrooms = useMemo(() => getAllAvailableClassroomLabels(), []);

  // 2. Queue & Filtering State
  const [queueItems, setQueueItems] = useState<GradingQueueItem[]>(() =>
    teacherCourseAssignmentService.getGradingQueue()
  );

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionTab, setActiveSectionTab] = useState<'SUBMISSIONS' | 'ASSIGNED_LIST'>(
    'ASSIGNED_LIST'
  );

  // Classrooms available for the selected subject filter
  const availableFilterRooms = useMemo(() => {
    if (selectedSubjectCode === 'ALL') return allSystemClassrooms;
    const matched = subjectsList.find((s) => s.courseCode === selectedSubjectCode);
    return matched?.classrooms && matched.classrooms.length > 0
      ? matched.classrooms
      : allSystemClassrooms;
  }, [selectedSubjectCode, subjectsList, allSystemClassrooms]);

  // Term Assignments List (Linked to ปพ.5)
  const [termAssignments, setTermAssignments] = useState<TermAssignmentConfig[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );

  const refreshTermAssignments = useCallback(() => {
    const code = selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode;
    const room = selectedRoom === 'ALL' ? undefined : selectedRoom;
    setTermAssignments(sgsRosterAndSubmissionService.getTermAssignments(code, room));
  }, [selectedSubjectCode, selectedRoom]);

  useEffect(() => {
    refreshTermAssignments();
  }, [refreshTermAssignments]);

  // 3. Create New Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formCourseCode, setFormCourseCode] = useState<string>(
    () => subjectsList[0]?.courseCode || 'ท23102'
  );
  const [formTitle, setFormTitle] = useState('');
  const [formScorePart, setFormScorePart] = useState<FourScorePart>('PRE_MIDTERM');
  const [formMaxScore, setFormMaxScore] = useState<number>(10);
  const [formDueDate, setFormDueDate] = useState<string>(() => getBangkokTodayString());
  const [formScopeMode, setFormScopeMode] = useState<'ALL_SUBJECT_ROOMS' | 'SELECTED_ROOMS'>(
    'ALL_SUBJECT_ROOMS'
  );
  const [formSelectedRooms, setFormSelectedRooms] = useState<string[]>([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const currentFormSubject = useMemo(
    () =>
      subjectsList.find((s) => s.courseCode === formCourseCode) ||
      subjectsList[0] || {
        courseCode: formCourseCode || 'ท23102',
        courseName: 'รายวิชาหลัก',
        classrooms: allSystemClassrooms,
      },
    [subjectsList, formCourseCode, allSystemClassrooms]
  );

  const currentFormSubjectRooms = useMemo(() => {
    return currentFormSubject.classrooms && currentFormSubject.classrooms.length > 0
      ? currentFormSubject.classrooms
      : allSystemClassrooms;
  }, [currentFormSubject, allSystemClassrooms]);

  const currentFormCourseWeights = useMemo(
    () => sgsRosterAndSubmissionService.getCourseWeights(currentFormSubject.courseCode),
    [currentFormSubject.courseCode]
  );

  const handleOpenCreateModal = () => {
    const initialCourse =
      selectedSubjectCode !== 'ALL'
        ? selectedSubjectCode
        : subjectsList[0]?.courseCode || 'ท23102';
    setFormCourseCode(initialCourse);
    setFormTitle('');
    setFormScorePart('PRE_MIDTERM');
    setFormMaxScore(10);
    setFormDueDate(getBangkokTodayString());
    setFormScopeMode('ALL_SUBJECT_ROOMS');
    setFormSelectedRooms(
      selectedRoom !== 'ALL'
        ? [selectedRoom]
        : currentFormSubjectRooms[0]
          ? [currentFormSubjectRooms[0]]
          : []
    );
    setIsCreateModalOpen(true);
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const targetRooms =
      formScopeMode === 'ALL_SUBJECT_ROOMS'
        ? currentFormSubjectRooms
        : formSelectedRooms.length > 0
          ? formSelectedRooms
          : currentFormSubjectRooms.slice(0, 1);

    const partToUnitMap: Record<FourScorePart, 'U1' | 'U2' | 'U3' | 'MIDTERM' | 'FINAL'> = {
      PRE_MIDTERM: 'U1',
      MIDTERM: 'MIDTERM',
      POST_MIDTERM: 'U2',
      FINAL: 'FINAL',
    };

    sgsRosterAndSubmissionService.addTermAssignment({
      title: formTitle.trim(),
      unitKey: partToUnitMap[formScorePart],
      scorePart: formScorePart,
      maxScore: Math.max(1, Number(formMaxScore) || 10),
      indicatorCode: SCORE_PART_LABELS[formScorePart].label,
      dueDate: formDueDate || getBangkokTodayString(),
      courseCode: currentFormSubject.courseCode,
      courseName: currentFormSubject.courseName,
      targetClassrooms: targetRooms,
    });

    refreshTermAssignments();
    setIsCreateModalOpen(false);
    setActiveSectionTab('ASSIGNED_LIST');
    showToast(
      `✓ สั่งงาน "${formTitle.trim()}" (${SCORE_PART_LABELS[formScorePart].label}) ให้ ${
        targetRooms.length > 1 ? `ทุกห้อง (${targetRooms.length} ห้อง)` : targetRooms[0] || 'ห้องเรียน'
      } เรียบร้อยแล้ว`
    );
  };

  // 4. Secondary Modals State
  const [gradingModalItem, setGradingModalItem] = useState<GradingQueueItem | null>(null);
  const [isSgsMatrixOpen, setIsSgsMatrixOpen] = useState<boolean>(false);
  const [is3ColorMatrixOpen, setIs3ColorMatrixOpen] = useState<boolean>(false);
  const [isBundlesModalOpen, setIsBundlesModalOpen] = useState<boolean>(false);

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

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  useEffect(() => {
    const handleQueueUpdate = () => {
      setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
    };
    window.addEventListener('kp-grading-queue-updated', handleQueueUpdate);
    return () => {
      window.removeEventListener('kp-grading-queue-updated', handleQueueUpdate);
    };
  }, []);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return queueItems.filter((item) => {
      if (selectedSubjectCode !== 'ALL' && item.subjectCode !== selectedSubjectCode) {
        return false;
      }
      if (selectedRoom !== 'ALL' && item.classroom !== selectedRoom) {
        return false;
      }
      if (selectedStatus === 'PENDING' && item.status !== 'PENDING_REVIEW') {
        return false;
      }
      if (selectedStatus === 'GRADED' && item.status !== 'GRADED') {
        return false;
      }
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

  const stats = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter((i) => i.status === 'PENDING_REVIEW').length;
    const graded = queueItems.filter((i) => i.status === 'GRADED').length;
    return { total, pending, graded };
  }, [queueItems]);

  const handleSaveGrade = (itemId: string, score: number, feedback: string) => {
    const targetItem = queueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    const { nextPendingItem } = teacherCourseAssignmentService.submitGrade(itemId, score, feedback);

    sgsRosterAndSubmissionService.gradeSubmission(
      targetItem.assignmentId,
      targetItem.studentCode,
      score,
      'GRADED'
    );

    showToast(
      `✓ บันทึกคะแนน ${targetItem.studentName} (${score}/${targetItem.maxScore} คะแนน) เรียบร้อยแล้ว`
    );

    if (nextPendingItem) {
      const nextFiltered = filteredSubmissions.find((i) => i.id === nextPendingItem.id);
      if (nextFiltered) {
        setGradingModalItem(nextFiltered);
        return;
      }
    }

    const nextInFilter = filteredSubmissions.find(
      (i) => i.id !== itemId && i.status === 'PENDING_REVIEW'
    );
    if (nextInFilter) {
      setGradingModalItem(nextInFilter);
    } else {
      setGradingModalItem(null);
      showToast('🎉 ตรวจครบทุกชิ้นในคิวนี้เรียบร้อยแล้ว!');
    }
  };

  const handleStartFirstPending = () => {
    const firstPending =
      filteredSubmissions.find((i) => i.status === 'PENDING_REVIEW') || filteredSubmissions[0];
    if (firstPending) {
      setGradingModalItem(firstPending);
    } else {
      showToast('ไม่มีงานรอตรวจในเงื่อนไขตัวกรองนี้');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-['Prompt',sans-serif] text-[#163A66] pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#163A66] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-blue-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ====================================================================
          1. COMPACT HEADER + PROMINENT "+ สั่งงานใหม่" CTA (ไม่มีข้อความรกตา)
         ==================================================================== */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#3B82F6] shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#163A66]">
              การสั่งงานและตรวจงาน (เชื่อมสมุดคะแนน ปพ.5)
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7C93]">
              สั่งงานรายห้องหรือทุกห้องในรายวิชา และตรวจให้คะแนนเข้า 4 ส่วนของ ปพ.5 อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#6B7C93] hover:text-[#163A66] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
            <span>วิธีใช้งาน</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สั่งงานใหม่</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. FILTER BAR + MODE SWITCHER (ชิ้นงานที่สั่งไว้ vs คิวตรวจงานที่นักเรียนส่ง)
         ==================================================================== */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 2 Mode Tabs */}
          <div className="flex items-center bg-[#F2F7FC] p-1 rounded-2xl border border-[#E6EEF7] self-start">
            <button
              type="button"
              onClick={() => setActiveSectionTab('ASSIGNED_LIST')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSectionTab === 'ASSIGNED_LIST'
                  ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              1. ชิ้นงานที่สั่งไว้ ({termAssignments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionTab('SUBMISSIONS')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSectionTab === 'SUBMISSIONS'
                  ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              2. คิวตรวจงานที่ส่งเข้ามา ({stats.pending} รอตรวจ)
            </button>
          </div>

          {/* Secondary Quick Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSgsMatrixOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#163A66] cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>ตารางคะแนนรายห้อง</span>
            </button>
            <button
              type="button"
              onClick={() => setIs3ColorMatrixOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#163A66] cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>เช็คการส่งงาน 3 สี</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBundlesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#163A66] cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>รวมคะแนน/หารเฉลี่ย</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
          {/* Subject Filter */}
          <div className="lg:col-span-4">
            <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
              กรองตามรายวิชา:
            </label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => {
                setSelectedSubjectCode(e.target.value);
                setSelectedRoom('ALL');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกรายวิชา ({subjectsList.length} วิชา)</option>
              {subjectsList.map((subj) => (
                <option key={subj.courseCode} value={subj.courseCode}>
                  {subj.courseCode} — {subj.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Real Classroom Filter (No hardcoded ม.3/1!) */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
              กรองตามห้องเรียน:
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกห้องเรียน ({availableFilterRooms.length} ห้อง)</option>
              {availableFilterRooms.map((room) => (
                <option key={room} value={room}>
                  ห้อง {room}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
              ค้นหาชื่องาน / ชื่อนักเรียน:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์คำค้นหา..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Reset */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectCode('ALL');
                setSelectedRoom('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#6B7C93] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION A: รายการชิ้นงานที่ครูสั่งไว้ (เชื่อม 4 ส่วนของ ปพ.5)
         ==================================================================== */}
      {activeSectionTab === 'ASSIGNED_LIST' && (
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#163A66]">
                ชิ้นงานที่สั่งไว้แล้ว ({termAssignments.length} รายการ)
              </h2>
              <p className="text-xs text-[#6B7C93]">
                แสดงหมวดคะแนน 4 ส่วน (ก่อนกลางภาค / กลางภาค / หลังกลางภาค / ปลายภาค) และห้องเรียนที่ได้รับมอบหมาย
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สั่งงานเพิ่ม</span>
            </button>
          </div>

          {termAssignments.length === 0 ? (
            <div className="py-12 px-4 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#163A66]">ยังไม่มีชิ้นงานที่สั่งในหมวดนี้</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  กดปุ่ม "สั่งงานใหม่" เพื่อมอบหมายงานให้ทุกห้องในรายวิชา หรือเฉพาะห้องที่เลือก
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>สั่งงานใหม่ทันที</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {termAssignments
                .filter((a) => {
                  if (!searchQuery.trim()) return true;
                  return a.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
                })
                .map((assign) => {
                  const partKey: FourScorePart =
                    assign.scorePart ||
                    (assign.unitKey === 'MIDTERM'
                      ? 'MIDTERM'
                      : assign.unitKey === 'FINAL'
                        ? 'FINAL'
                        : assign.unitKey === 'U2' || assign.unitKey === 'U3'
                          ? 'POST_MIDTERM'
                          : 'PRE_MIDTERM');
                  const partMeta = SCORE_PART_LABELS[partKey];
                  const roomsText =
                    assign.targetClassrooms && assign.targetClassrooms.length > 0
                      ? assign.targetClassrooms.length > 4
                        ? `ทุกห้องที่เลือก (${assign.targetClassrooms.length} ห้อง: ${assign.targetClassrooms.slice(0, 3).join(', ')}...)`
                        : `ห้อง ${assign.targetClassrooms.join(', ')}`
                      : 'ทุกห้องในรายวิชา';

                  return (
                    <div
                      key={assign.id}
                      className="p-4 rounded-2xl border border-[#E6EEF7] bg-[#F7FAFF]/60 hover:bg-white hover:border-[#BFDBFE] transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${partMeta.cls}`}
                          >
                            {partMeta.label}
                          </span>
                          <span className="text-xs font-bold text-[#163A66]">
                            เต็ม {assign.maxScore} คะแนน
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#163A66]">{assign.title}</h3>

                        <div className="text-xs text-[#6B7C93] space-y-0.5">
                          <p>
                            วิชา:{' '}
                            <span className="font-semibold text-[#163A66]">
                              {assign.courseCode || 'ทุกวิชา'} {assign.courseName || ''}
                            </span>
                          </p>
                          <p>
                            กลุ่มเป้าหมาย:{' '}
                            <span className="font-semibold text-[#3B82F6]">{roomsText}</span>
                          </p>
                          <p>กำหนดส่ง: {assign.dueDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => {
                            if (assign.courseCode) setSelectedSubjectCode(assign.courseCode);
                            setIs3ColorMatrixOpen(true);
                          }}
                          className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                        >
                          เช็คส่งงาน / ให้คะแนน →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sgsRosterAndSubmissionService.deleteTermAssignment(assign.id);
                            refreshTermAssignments();
                            showToast(`ลบชิ้นงาน "${assign.title}" เรียบร้อยแล้ว`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="ลบชิ้นงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          SECTION B: คิวตรวจงานที่นักเรียนส่งเข้ามา (FIFO Submissions Queue)
         ==================================================================== */}
      {activeSectionTab === 'SUBMISSIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartFirstPending}
                disabled={stats.pending === 0}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เริ่มตรวจงานทันที ({stats.pending} งานรอตรวจ)</span>
              </button>
              <div className="flex items-center gap-1.5">
                {(['ALL', 'PENDING', 'GRADED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]'
                        : 'bg-slate-50 text-[#6B7C93]'
                    }`}
                  >
                    {st === 'ALL'
                      ? `ทั้งหมด (${stats.total})`
                      : st === 'PENDING'
                        ? `รอตรวจ (${stats.pending})`
                        : `ตรวจแล้ว (${stats.graded})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#E6EEF7] overflow-hidden shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-[#163A66]">
                  ยังไม่มีผลงานที่นักเรียนส่งเข้ามาในเงื่อนไขนี้
                </h4>
                <p className="text-xs text-[#6B7C93]">
                  เมื่อนักเรียนส่งงานออนไลน์ รายการจะปรากฏที่นี่ตามลำดับเวลาส่งจริง
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSubmissions.map((item) => {
                  const isGraded = item.status === 'GRADED';
                  const isPdf =
                    item.submissionChannel === 'PDF_UPLOAD' ||
                    (item.fileName || '').endsWith('.pdf');
                  const isDrive = Boolean(
                    item.externalLinkUrl?.includes('drive.google.com') ||
                      item.externalLinkUrl?.includes('docs.google.com') ||
                      item.externalPlatform === 'GOOGLE_DRIVE'
                  );
                  const isLink =
                    item.submissionChannel === 'LINK_URL' || item.externalLinkUrl || isDrive;

                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-[#6B7C93] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.queueNo}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#163A66]">
                              {item.studentName}
                            </span>
                            <span className="text-xs text-[#6B7C93]">
                              (เลขที่ {item.seatNo} • ห้อง {item.classroom} • รหัส {item.studentCode})
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#3B82F6] mt-0.5">
                            {item.subjectCode} • {item.assignmentTitle}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            ส่งเมื่อ {item.submittedAtText}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewItem({
                              title: item.assignmentTitle,
                              studentName: item.studentName,
                              studentCode: item.studentCode,
                              classroom: item.classroom,
                              seatNo: item.seatNo,
                              type: isPdf ? 'PDF' : isLink ? 'LINK' : 'IMAGE',
                              url: item.filePreviewUrl || item.externalLinkUrl,
                              fileName: item.fileName,
                              platform: isDrive ? 'GOOGLE_DRIVE' : item.externalPlatform,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>ดูไฟล์ที่ส่ง</span>
                        </button>

                        {isGraded ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            ✓ {item.score}/{item.maxScore}
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอตรวจ</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setGradingModalItem(item)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            isGraded
                              ? 'bg-slate-100 text-[#163A66] hover:bg-slate-200'
                              : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                          }`}
                        >
                          {isGraded ? 'แก้ไขคะแนน' : 'ให้คะแนน'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: สั่งงานใหม่ (เลือกได้ทั้ง "ทุกห้องในรายวิชา" หรือ "เฉพาะห้องที่เลือก")
         ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssignmentSubmit}
            className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#163A66]">
                  สั่งงาน / มอบหมายภาระงานใหม่
                </h3>
                <p className="text-xs text-[#6B7C93]">
                  เชื่อมคะแนนเข้ากับสมุดคะแนน ปพ.5 อัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. เลือกรายวิชา */}
            <div>
              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                1. รายวิชาที่ต้องการสั่งงาน *
              </label>
              <select
                value={formCourseCode}
                onChange={(e) => {
                  setFormCourseCode(e.target.value);
                  setFormSelectedRooms([]);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66]"
              >
                {subjectsList.map((subj) => (
                  <option key={subj.courseCode} value={subj.courseCode}>
                    {subj.courseCode} — {subj.courseName}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. ชื่องาน */}
            <div>
              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                2. ชื่อชิ้นงาน / การบ้าน / การสอบย่อย *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="เช่น ใบงานที่ 1, สอบเก็บคะแนนก่อนกลางภาค"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* 3. ส่วนคะแนน 4 ส่วน + คะแนนเต็ม + กำหนดส่ง */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  3. เก็บเข้าส่วนคะแนนใดของ ปพ.5 *
                </label>
                <select
                  value={formScorePart}
                  onChange={(e) => setFormScorePart(e.target.value as FourScorePart)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66]"
                >
                  <option value="PRE_MIDTERM">
                    ก่อนกลางภาค (เต็ม {currentFormCourseWeights.preMidterm})
                  </option>
                  <option value="MIDTERM">
                    กลางภาค (เต็ม {currentFormCourseWeights.midterm})
                  </option>
                  <option value="POST_MIDTERM">
                    หลังกลางภาค (เต็ม {currentFormCourseWeights.postMidterm})
                  </option>
                  <option value="FINAL">
                    ปลายภาค (เต็ม {currentFormCourseWeights.final})
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#163A66] mb-1">
                    คะแนนเต็ม
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#163A66] mb-1">
                    กำหนดส่ง
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66]"
                  />
                </div>
              </div>
            </div>

            {/* 4. เลือกห้องเรียน: ทุกห้องในรายวิชา หรือ เฉพาะห้องที่เลือก */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-[#163A66]">
                4. ห้องเรียนที่ได้รับมอบหมาย:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormScopeMode('ALL_SUBJECT_ROOMS')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formScopeMode === 'ALL_SUBJECT_ROOMS'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                      : 'border-slate-200 bg-white text-[#6B7C93]'
                  }`}
                >
                  <p className="text-xs font-bold">
                    สั่งทุกห้องในรายวิชานี้ ({currentFormSubjectRooms.length} ห้อง)
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    สั่งครั้งเดียวใช้กับทุกห้องที่เรียนวิชานี้
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormScopeMode('SELECTED_ROOMS');
                    if (formSelectedRooms.length === 0 && currentFormSubjectRooms[0]) {
                      setFormSelectedRooms([currentFormSubjectRooms[0]]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formScopeMode === 'SELECTED_ROOMS'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                      : 'border-slate-200 bg-white text-[#6B7C93]'
                  }`}
                >
                  <p className="text-xs font-bold">เลือกเฉพาะห้องเรียน</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    ติ๊กเลือกเฉพาะห้องที่ต้องการสั่งงาน
                  </p>
                </button>
              </div>

              {formScopeMode === 'SELECTED_ROOMS' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {currentFormSubjectRooms.map((room) => {
                    const checked = formSelectedRooms.includes(room);
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => {
                          setFormSelectedRooms((prev) =>
                            checked ? prev.filter((r) => r !== room) : [...prev, room]
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                          checked
                            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                            : 'bg-white text-[#6B7C93] border-slate-200'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{room}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#6B7C93] hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                บันทึกและสั่งงาน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: วิธีใช้งาน (ซ่อนคำอธิบายไว้ในปุ่ม ⓘ)
         ==================================================================== */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="text-base font-bold text-[#163A66]">วิธีสั่งงานและตรวจงาน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#163A66]">
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">1. กดปุ่ม "+ สั่งงานใหม่"</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  เลือกรายวิชา และเลือกส่วนคะแนนที่จะเก็บ (ก่อนกลางภาค / กลางภาค / หลังกลางภาค / ปลายภาค)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">2. เลือกสั่งทุกห้อง หรือ เฉพาะห้อง</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  สามารถสั่งครั้งเดียวให้ทุกห้องที่เรียนรายวิชานี้ หรือติ๊กเลือกเฉพาะห้องที่ต้องการได้ทันที
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">3. คะแนนซิงก์เข้า ปพ.5 อัตโนมัติ</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  เมื่อตรวจให้คะแนนแล้ว ระบบจะคำนวณสัดส่วนเข้าสมุดคะแนน ปพ.5 ให้โดยอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
      <GradingWorkspaceModal
        isOpen={Boolean(gradingModalItem)}
        onClose={() => setGradingModalItem(null)}
        currentItem={gradingModalItem}
        allItems={filteredSubmissions}
        onSaveGrade={handleSaveGrade}
        onSelectQueueItem={(item) => setGradingModalItem(item)}
      />

      <SgsClassroomMatrixModal
        isOpen={isSgsMatrixOpen}
        onClose={() => setIsSgsMatrixOpen(false)}
        defaultSubjectCode={
          selectedSubjectCode === 'ALL' ? subjectsList[0]?.courseCode || 'ท23102' : selectedSubjectCode
        }
        defaultRoom={selectedRoom === 'ALL' ? availableFilterRooms[0] || 'ม.1/1' : selectedRoom}
      />

      <Submission3ColorMatrixModal
        isOpen={is3ColorMatrixOpen}
        onClose={() => setIs3ColorMatrixOpen(false)}
        defaultSubjectCode={
          selectedSubjectCode === 'ALL' ? subjectsList[0]?.courseCode || 'ท23102' : selectedSubjectCode
        }
        defaultRoom={selectedRoom === 'ALL' ? availableFilterRooms[0] || 'ม.1/1' : selectedRoom}
        onOpenPreview={(preview) => setPreviewItem(preview)}
        onGradeQuick={(_asgId, _stuCode, _max) => {
          showToast('✓ บันทึกสถานะส่งงานเรียบร้อยแล้ว');
        }}
      />

      <AssignmentBundlesModal
        isOpen={isBundlesModalOpen}
        onClose={() => setIsBundlesModalOpen(false)}
        onShowToast={showToast}
      />

      <ArtworkPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'ผลงานนักเรียน'}
        studentName={previewItem?.studentName || ''}
        studentCode={previewItem?.studentCode}
        classroom={previewItem?.classroom || availableFilterRooms[0] || 'ม.1/1'}
        seatNo={previewItem?.seatNo}
        type={previewItem?.type || 'IMAGE'}
        url={previewItem?.url}
        fileName={previewItem?.fileName}
        platform={previewItem?.platform}
      />
    </div>
  );
};
