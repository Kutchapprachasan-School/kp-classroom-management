import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Download,
  Sliders,
  HelpCircle,
  Sparkles,
  Edit3,
  Trash2,
  BookOpen,
  Users,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { studentService } from '../services/studentService';
import type { AtRiskStudent } from '../types/viewModels';
import { classroomService } from '../services/classroomService';
import {
  AssignmentManagementView,
  type QuickFilterMode,
} from './AssignmentManagementView';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type FourScorePart,
  type CourseScoreWeights,
  type TermAssignmentConfig,
  DESIRABLE_CHARACTERISTICS_LIST,
  CRITICAL_THINKING_LIST,
} from '../services/sgsRosterAndSubmissionService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';
import {
  getDynamicTeachingSubjects,
  getAllAvailableClassroomLabels,
} from '../services/teacherCourseAssignmentService';
import { getBangkokTodayString } from '../utils/timetableDateUtils';

interface TeacherOverviewViewProps {
  onSelectStudent: (student: AtRiskStudent) => void;
  onViewFullTable: () => void;
  onSwitchToAdventure: () => void;
  initialTab?: ClassSubTab;
  initialGradesFilter?: 'ALL' | 'AT_RISK';
  initialAssignmentFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export type ClassSubTab =
  | 'attendance'
  | 'assignments'
  | 'grades'
  | 'attributes'
  | 'overview'
  | 'behavior'
  | 'reflection'
  | 'adventure';

const SCORE_PART_META: Record<
  FourScorePart,
  { label: string; shortLabel: string; badgeBg: string; badgeText: string; border: string }
> = {
  PRE_MIDTERM: {
    label: 'ก่อนกลางภาค',
    shortLabel: 'ก่อนกลางภาค',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    border: 'border-blue-200',
  },
  MIDTERM: {
    label: 'กลางภาค',
    shortLabel: 'กลางภาค',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
  },
  POST_MIDTERM: {
    label: 'หลังกลางภาค',
    shortLabel: 'หลังกลางภาค',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  FINAL: {
    label: 'ปลายภาค',
    shortLabel: 'ปลายภาค',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    border: 'border-purple-200',
  },
};

const LEVEL_LABELS: Record<0 | 1 | 2 | 3, { text: string; short: string; cls: string }> = {
  3: { text: '3 (ดีเยี่ยม)', short: '3 ดีเยี่ยม', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { text: '2 (ดี)', short: '2 ดี', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  1: { text: '1 (ผ่าน)', short: '1 ผ่าน', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  0: { text: '0 (ไม่ผ่าน)', short: '0 ไม่ผ่าน', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const TeacherOverviewView: React.FC<TeacherOverviewViewProps> = ({
  initialTab = 'grades',
  initialGradesFilter = 'ALL',
  initialAssignmentFilter = 'ALL',
  initialHighlightBanner = null,
}) => {
  // Normalize initial tab so it always lands on a valid visible tab
  const resolveTab = (t?: ClassSubTab): 'grades' | 'attributes' | 'assignments' => {
    if (t === 'attributes') return 'attributes';
    if (t === 'assignments') return 'assignments';
    return 'grades';
  };

  const [activeTab, setActiveTab] = useState<'grades' | 'attributes' | 'assignments'>(() =>
    resolveTab(initialTab)
  );

  useEffect(() => {
    setActiveTab(resolveTab(initialTab));
  }, [initialTab]);

  // 1. Load Dynamic Subjects & Classrooms
  const subjectsList = useMemo(() => getDynamicTeachingSubjects(), []);
  const allSystemClassrooms = useMemo(() => getAllAvailableClassroomLabels(), []);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    () => subjectsList[0]?.courseCode || 'ท23102'
  );

  const currentSubject = useMemo(
    () =>
      subjectsList.find((s) => s.courseCode === selectedSubjectCode) ||
      subjectsList[0] || {
        courseCode: selectedSubjectCode || 'ท23102',
        courseName: 'รายวิชาหลัก',
        credit: 1.5,
        hoursPerWeek: 3,
        termLabel: '2/2569',
        classrooms: allSystemClassrooms,
      },
    [subjectsList, selectedSubjectCode, allSystemClassrooms]
  );

  const availableClassroomsForSubject = useMemo(() => {
    const rooms =
      currentSubject?.classrooms && currentSubject.classrooms.length > 0
        ? currentSubject.classrooms
        : allSystemClassrooms;
    return rooms.length > 0 ? rooms : [];
  }, [currentSubject, allSystemClassrooms]);

  const [selectedClassroom, setSelectedClassroom] = useState<string>(
    () => availableClassroomsForSubject[0] || ''
  );

  // Keep selectedClassroom valid when switching course
  useEffect(() => {
    if (
      availableClassroomsForSubject.length > 0 &&
      (!selectedClassroom || !availableClassroomsForSubject.includes(selectedClassroom))
    ) {
      setSelectedClassroom(availableClassroomsForSubject[0]);
    }
  }, [availableClassroomsForSubject, selectedClassroom]);

  // 2. Roster & Cloud Sync State
  const [sgsRoster, setSgsRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster(selectedClassroom)
  );
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradesFilter, setGradesFilter] = useState<'ALL' | 'AT_RISK'>(initialGradesFilter);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const refreshRoster = useCallback(
    (room = selectedClassroom) => {
      if (!room) {
        setSgsRoster([]);
        return;
      }
      setSgsRoster(sgsRosterAndSubmissionService.getSgsRoster(room));
    },
    [selectedClassroom]
  );

  // Fetch real students from DB whenever classroom changes
  useEffect(() => {
    let cancelled = false;
    async function syncRoomStudents() {
      if (!selectedClassroom) {
        await classroomService.getAll(true);
        const freshRooms = getAllAvailableClassroomLabels();
        if (!cancelled && freshRooms.length > 0) {
          setSelectedClassroom(freshRooms[0]);
        }
        return;
      }
      setIsLoadingRoster(true);
      try {
        await studentService.getByClassroom(selectedClassroom);
      } catch {
        // Fallback to local cache
      } finally {
        if (!cancelled) {
          refreshRoster(selectedClassroom);
          setIsLoadingRoster(false);
        }
      }
    }
    syncRoomStudents();
    return () => {
      cancelled = true;
    };
  }, [selectedClassroom, refreshRoster]);

  // 3. 4-Part Score Weights (Per-Course)
  const [courseWeights, setCourseWeights] = useState<CourseScoreWeights>(() =>
    sgsRosterAndSubmissionService.getCourseWeights(currentSubject.courseCode)
  );
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [draftWeights, setDraftWeights] = useState<CourseScoreWeights>(courseWeights);

  useEffect(() => {
    const w = sgsRosterAndSubmissionService.getCourseWeights(currentSubject.courseCode);
    setCourseWeights(w);
    setDraftWeights(w);
  }, [currentSubject.courseCode]);

  // 4. Term Assignments for this Course & Classroom
  const [termAssignments, setTermAssignments] = useState<TermAssignmentConfig[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments(currentSubject.courseCode, selectedClassroom)
  );
  const [showAssignmentsDrawer, setShowAssignmentsDrawer] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] =
    useState<TermAssignmentConfig | null>(null);

  const refreshAssignments = useCallback(() => {
    setTermAssignments(
      sgsRosterAndSubmissionService.getTermAssignments(currentSubject.courseCode, selectedClassroom)
    );
  }, [currentSubject.courseCode, selectedClassroom]);

  useEffect(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  // 5. Create New Assignment Modal (Supports All Rooms in Subject OR Selected Rooms)
  const [isAddAssignModalOpen, setIsAddAssignModalOpen] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignPart, setNewAssignPart] = useState<FourScorePart>('PRE_MIDTERM');
  const [newAssignMaxScore, setNewAssignMaxScore] = useState<number>(10);
  const [newAssignDueDate, setNewAssignDueDate] = useState<string>(() => getBangkokTodayString());
  const [newAssignScopeMode, setNewAssignScopeMode] = useState<'ALL_SUBJECT_ROOMS' | 'SELECTED_ROOMS'>(
    'ALL_SUBJECT_ROOMS'
  );
  const [newAssignSelectedRooms, setNewAssignSelectedRooms] = useState<string[]>([]);

  const handleOpenAddAssignModal = (defaultPart: FourScorePart = 'PRE_MIDTERM') => {
    setNewAssignTitle('');
    setNewAssignPart(defaultPart);
    setNewAssignMaxScore(10);
    setNewAssignDueDate(getBangkokTodayString());
    setNewAssignScopeMode('ALL_SUBJECT_ROOMS');
    setNewAssignSelectedRooms(selectedClassroom ? [selectedClassroom] : []);
    setIsAddAssignModalOpen(true);
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignTitle.trim()) return;

    const targetRooms =
      newAssignScopeMode === 'ALL_SUBJECT_ROOMS'
        ? availableClassroomsForSubject
        : newAssignSelectedRooms.length > 0
          ? newAssignSelectedRooms
          : selectedClassroom
            ? [selectedClassroom]
            : [];

    const partToUnitMap: Record<FourScorePart, 'U1' | 'U2' | 'U3' | 'MIDTERM' | 'FINAL'> = {
      PRE_MIDTERM: 'U1',
      MIDTERM: 'MIDTERM',
      POST_MIDTERM: 'U2',
      FINAL: 'FINAL',
    };

    sgsRosterAndSubmissionService.addTermAssignment({
      title: newAssignTitle.trim(),
      unitKey: partToUnitMap[newAssignPart],
      scorePart: newAssignPart,
      maxScore: Math.max(1, Number(newAssignMaxScore) || 10),
      indicatorCode: SCORE_PART_META[newAssignPart].label,
      dueDate: newAssignDueDate || getBangkokTodayString(),
      courseCode: currentSubject.courseCode,
      courseName: currentSubject.courseName,
      targetClassrooms: targetRooms,
    });

    refreshAssignments();
    refreshRoster();
    setIsAddAssignModalOpen(false);
    showToast(
      `สั่งงาน "${newAssignTitle.trim()}" (${SCORE_PART_META[newAssignPart].label}) ให้ ${
        targetRooms.length > 1 ? `ทุกห้อง (${targetRooms.length} ห้อง)` : targetRooms[0] || 'ห้องเรียน'
      } เรียบร้อยแล้ว`
    );
  };

  // 6. Help Modal State (ซ่อนคำอธิบายไว้ข้างใน ไม่ให้รกหน้าจอ)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // 7. Attributes Mode State (ตัวเลือกที่ 1: ดึงตามเกรดวิชาอัตโนมัติ vs ตัวเลือกที่ 2: แก้ไขรายบุคคล)
  const [attributeMode, setAttributeMode] = useState<'AUTO_FROM_GRADE' | 'MANUAL_EDIT'>('AUTO_FROM_GRADE');
  const [showDetailedTraitColumns, setShowDetailedTraitColumns] = useState(false);

  // Filtered Students
  const filteredRoster = useMemo(() => {
    return sgsRoster.filter((stu) => {
      const q = searchQuery.trim().toLowerCase();
      if (q && !stu.fullName.toLowerCase().includes(q) && !stu.studentCode.toLowerCase().includes(q)) {
        return false;
      }
      if (gradesFilter === 'AT_RISK') {
        const calc = sgsRosterAndSubmissionService.computeStudentSgsGrades(
          stu,
          currentSubject.courseCode,
          selectedClassroom
        );
        return (
          calc.gradeLabel === '0' ||
          calc.gradeLabel === 'ร' ||
          calc.gradeLabel === 'มส' ||
          calc.total < 50
        );
      }
      return true;
    });
  }, [sgsRoster, searchQuery, gradesFilter, currentSubject.courseCode, selectedClassroom]);

  // Summary Stats for Current Room & Subject
  const roomStats = useMemo(() => {
    let passCount = 0;
    let riskCount = 0;
    let totalSum = 0;
    sgsRoster.forEach((stu) => {
      const calc = sgsRosterAndSubmissionService.computeStudentSgsGrades(
        stu,
        currentSubject.courseCode,
        selectedClassroom
      );
      totalSum += calc.total;
      if (calc.gradeLabel === '0' || calc.gradeLabel === 'ร' || calc.gradeLabel === 'มส' || calc.total < 50) {
        riskCount += 1;
      } else {
        passCount += 1;
      }
    });
    const avgScore = sgsRoster.length > 0 ? Math.round((totalSum / sgsRoster.length) * 10) / 10 : 0;
    return { totalStudents: sgsRoster.length, passCount, riskCount, avgScore };
  }, [sgsRoster, currentSubject.courseCode, selectedClassroom]);

  // Handlers for 4-Part Score Editing
  const handleFourPartScoreChange = (
    studentCode: string,
    part: FourScorePart,
    rawVal: string
  ) => {
    const num = rawVal === '' ? 0 : Number(rawVal);
    if (Number.isNaN(num)) return;
    const updated = sgsRosterAndSubmissionService.updateStudentFourPartScore(
      studentCode,
      part,
      num,
      selectedClassroom,
      currentSubject.courseCode
    );
    setSgsRoster(updated);
  };

  const handleToggleSpecialStatus = (studentCode: string, currentStatus: 'NORMAL' | 'ร' | 'มส') => {
    const nextStatus: 'NORMAL' | 'ร' | 'มส' =
      currentStatus === 'NORMAL' ? 'ร' : currentStatus === 'ร' ? 'มส' : 'NORMAL';
    const updated = sgsRosterAndSubmissionService.updateStudentSpecialStatus(
      studentCode,
      nextStatus,
      selectedClassroom
    );
    setSgsRoster(updated);
    showToast(
      `เปลี่ยนสถานะการประเมินของรหัส ${studentCode} เป็น "${nextStatus === 'NORMAL' ? 'ปกติ' : nextStatus}"`
    );
  };

  // Save Course Weights
  const draftWeightTotal =
    Number(draftWeights.preMidterm || 0) +
    Number(draftWeights.midterm || 0) +
    Number(draftWeights.postMidterm || 0) +
    Number(draftWeights.final || 0);

  const handleSaveWeights = () => {
    if (draftWeightTotal !== 100) return;
    const saved = sgsRosterAndSubmissionService.saveCourseWeights({
      ...draftWeights,
      courseCode: currentSubject.courseCode,
    });
    setCourseWeights(saved);
    setIsWeightModalOpen(false);
    refreshRoster();
    showToast(
      `บันทึกสัดส่วนคะแนนวิชา ${currentSubject.courseCode} (${saved.preMidterm} : ${saved.midterm} : ${saved.postMidterm} : ${saved.final}) เรียบร้อยแล้ว`
    );
  };

  const applyQuickPreset = (pre: number, mid: number, post: number, fin: number) => {
    const next: CourseScoreWeights = {
      courseCode: currentSubject.courseCode,
      preMidterm: pre,
      midterm: mid,
      postMidterm: post,
      final: fin,
    };
    const saved = sgsRosterAndSubmissionService.saveCourseWeights(next);
    setCourseWeights(saved);
    setDraftWeights(saved);
    refreshRoster();
    showToast(`เปลี่ยนสัดส่วนคะแนนเป็น ${pre} : ${mid} : ${post} : ${fin} เรียบร้อยแล้ว`);
  };

  // Attributes Handlers
  const handleAutoCalculateAttributesFromGrades = () => {
    const updated = sgsRosterAndSubmissionService.calculateAttributesFromGrades(
      selectedClassroom,
      currentSubject.courseCode
    );
    setSgsRoster(updated);
    showToast('ดึงระดับคุณลักษณะอันพึงประสงค์ และ อ่าน คิดวิเคราะห์ เขียน จากเกรดวิชาเรียบร้อยแล้ว');
  };

  const handleBulkSetAllAttributes = (level: 0 | 1 | 2 | 3) => {
    const updated = sgsRosterAndSubmissionService.bulkSetAllAttributesToLevel(
      level,
      selectedClassroom
    );
    setSgsRoster(updated);
    showToast(`ตั้งค่าระดับทั้งห้องเป็น "${LEVEL_LABELS[level].short}" เรียบร้อยแล้ว`);
  };

  const handleSetStudentOverallAttribute = (
    studentCode: string,
    category: 'CHAR' | 'CRIT' | 'BOTH',
    level: 0 | 1 | 2 | 3
  ) => {
    let latest = sgsRoster;
    if (category === 'CHAR' || category === 'BOTH') {
      DESIRABLE_CHARACTERISTICS_LIST.forEach((_, idx) => {
        latest = sgsRosterAndSubmissionService.updateStudentAttributeLevel(
          studentCode,
          'CHAR',
          idx,
          level,
          selectedClassroom
        );
      });
    }
    if (category === 'CRIT' || category === 'BOTH') {
      CRITICAL_THINKING_LIST.forEach((_, idx) => {
        latest = sgsRosterAndSubmissionService.updateStudentAttributeLevel(
          studentCode,
          'CRIT',
          idx,
          level,
          selectedClassroom
        );
      });
    }
    setSgsRoster([...latest]);
  };

  const handleExportSgsCsv = () => {
    const csv = sgsRosterAndSubmissionService.exportSgsGradebookCsv(
      currentSubject.courseCode,
      currentSubject.courseName,
      selectedClassroom
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SGS_${currentSubject.courseCode}_${selectedClassroom.replace('/', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ CSV สำหรับนำเข้า SGS เรียบร้อยแล้ว');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 font-['Prompt',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#163A66] text-white px-4 py-3 rounded-2xl shadow-lg border border-blue-400/30 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ====================================================================
          1. COMPACT PAGE HEADER (สะอาด ไม่มีข้อความอธิบายยาวรกหน้าจอ)
         ==================================================================== */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#3B82F6] shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#163A66]">
                สมุดคะแนน ปพ.5 และการประเมินผล
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]">
                ภาคเรียนที่ {currentSubject.termLabel || '2/2569'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6B7C93] mt-0.5">
              {currentSubject.courseCode} {currentSubject.courseName} • ห้อง{' '}
              <span className="font-semibold text-[#163A66]">{selectedClassroom || 'ยังไม่เลือกห้อง'}</span>
            </p>
          </div>
        </div>

        {/* Right Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#6B7C93] hover:text-[#163A66] transition-colors cursor-pointer"
            title="ดูวิธีใช้งานสมุดคะแนน ปพ.5"
          >
            <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
            <span>วิธีใช้งาน</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDraftWeights(courseWeights);
              setIsWeightModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-blue-100/80 text-xs font-semibold text-[#163A66] transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>
              สัดส่วน {courseWeights.preMidterm}:{courseWeights.midterm}:{courseWeights.postMidterm}:
              {courseWeights.final}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddAssignModal('PRE_MIDTERM')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สั่งงานใหม่</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. COURSE & CLASSROOM SELECTOR + 2 MAIN TABS
         ==================================================================== */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Subject Selector + Classroom Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0">
              <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                1. เลือกรายวิชา
              </label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                {subjectsList.map((subj) => (
                  <option key={subj.courseCode} value={subj.courseCode}>
                    {subj.courseCode} — {subj.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                2. เลือกห้องเรียน ({availableClassroomsForSubject.length} ห้อง)
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {availableClassroomsForSubject.length <= 10 ? (
                  availableClassroomsForSubject.map((room) => {
                    const active = room === selectedClassroom;
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => setSelectedClassroom(room)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-xs'
                            : 'bg-slate-50 text-[#163A66] border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {room}
                      </button>
                    );
                  })
                ) : (
                  <select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    {availableClassroomsForSubject.map((room) => (
                      <option key={room} value={room}>
                        ห้อง {room}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Right: 2 Primary Mode Tabs (คะแนน 4 ส่วน ปพ.5 vs คุณลักษณะฯ & อ่านคิดวิเคราะห์) */}
          <div className="flex items-center bg-[#F2F7FC] p-1 rounded-2xl border border-[#E6EEF7] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('grades')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'grades'
                  ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              1. คะแนน 4 ส่วน & เกรด (ปพ.5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attributes')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'attributes'
                  ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              2. คุณลักษณะฯ & อ่านคิดวิเคราะห์
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          TAB 1: สมุดคะแนน 4 ส่วน & เกรด (ปพ.5 ตารางเดียว ไม่ซ้อนกัน)
         ==================================================================== */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          {/* Quick Weight Preset Bar + Search & Filter */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: One-Click Weight Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#6B7C93]">สัดส่วนคะแนน 4 ส่วน:</span>
              <button
                type="button"
                onClick={() => applyQuickPreset(25, 20, 25, 30)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  courseWeights.preMidterm === 25 &&
                  courseWeights.midterm === 20 &&
                  courseWeights.postMidterm === 25 &&
                  courseWeights.final === 30
                    ? 'bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]'
                    : 'bg-slate-50 text-[#6B7C93] border-slate-200 hover:bg-slate-100'
                }`}
              >
                25 : 20 : 25 : 30
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(30, 20, 30, 20)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  courseWeights.preMidterm === 30 &&
                  courseWeights.midterm === 20 &&
                  courseWeights.postMidterm === 30 &&
                  courseWeights.final === 20
                    ? 'bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]'
                    : 'bg-slate-50 text-[#6B7C93] border-slate-200 hover:bg-slate-100'
                }`}
              >
                30 : 20 : 30 : 20
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftWeights(courseWeights);
                  setIsWeightModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#163A66] border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                ปรับสัดส่วนเอง...
              </button>

              <span className="hidden sm:inline-block text-slate-300">|</span>

              {/* Toggle Assignments Linked Drawer */}
              <button
                type="button"
                onClick={() => setShowAssignmentsDrawer((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>ชิ้นงานที่สั่งในวิชานี้ ({termAssignments.length})</span>
                {showAssignmentsDrawer ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Right: Search + Risk Filter + Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <button
                type="button"
                onClick={() => setGradesFilter((f) => (f === 'ALL' ? 'AT_RISK' : 'ALL'))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  gradesFilter === 'AT_RISK'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-[#6B7C93] border-slate-200 hover:bg-slate-100'
                }`}
              >
                {gradesFilter === 'AT_RISK'
                  ? `เฉพาะกลุ่มเสี่ยง (${roomStats.riskCount})`
                  : `ทั้งหมด (${roomStats.totalStudents})`}
              </button>

              <button
                type="button"
                onClick={handleExportSgsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>ส่งออก CSV</span>
              </button>
            </div>
          </div>

          {/* Collapsible Linked Assignments Drawer (ซ่อนไว้ตามปกติ เปิดเมื่อครูอยากดู/ให้คะแนนรายชิ้นงาน) */}
          {showAssignmentsDrawer && (
            <div className="bg-white rounded-[18px] border border-[#BFDBFE] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="text-sm font-bold text-[#163A66]">
                    รายการชิ้นงานที่เชื่อมกับสมุดคะแนน ปพ.5 ({currentSubject.courseCode} • ห้อง {selectedClassroom})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddAssignModal('PRE_MIDTERM')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold hover:bg-[#2563EB] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มชิ้นงานใหม่</span>
                </button>
              </div>

              {termAssignments.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-[#6B7C93]">
                    ยังไม่มีชิ้นงานย่อยในวิชานี้ คุณครูสามารถกรอกคะแนนรวม 4 ส่วนลงในตารางด้านล่างได้โดยตรง หรือกดปุ่ม "+ สั่งงานใหม่"
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {termAssignments.map((assign) => {
                    const partKey: FourScorePart =
                      assign.scorePart ||
                      (assign.unitKey === 'MIDTERM'
                        ? 'MIDTERM'
                        : assign.unitKey === 'FINAL'
                          ? 'FINAL'
                          : assign.unitKey === 'U2' || assign.unitKey === 'U3'
                            ? 'POST_MIDTERM'
                            : 'PRE_MIDTERM');
                    const meta = SCORE_PART_META[partKey];
                    const isGradingThis = selectedAssignmentForGrading?.id === assign.id;

                    return (
                      <div
                        key={assign.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isGradingThis
                            ? 'bg-blue-50/70 border-[#3B82F6]'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.border}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] font-semibold text-[#6B7C93]">
                              เต็ม {assign.maxScore} คะแนน
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#163A66] truncate mt-1">
                            {assign.title}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">กำหนดส่ง: {assign.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAssignmentForGrading(isGradingThis ? null : assign)
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              isGradingThis
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-white border border-slate-200 text-[#163A66] hover:bg-slate-100'
                            }`}
                          >
                            {isGradingThis ? 'ปิดตรวจ' : 'ให้คะแนน'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sgsRosterAndSubmissionService.deleteTermAssignment(assign.id);
                              if (isGradingThis) setSelectedAssignmentForGrading(null);
                              refreshAssignments();
                              showToast(`ลบชิ้นงาน "${assign.title}" เรียบร้อยแล้ว`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="ลบชิ้นงาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Per-Assignment Score Entry Panel */}
              {selectedAssignmentForGrading && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#163A66]">
                      กำลังกรอกคะแนนชิ้นงาน: "{selectedAssignmentForGrading.title}" (เต็ม{' '}
                      {selectedAssignmentForGrading.maxScore} คะแนน)
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedAssignmentForGrading(null)}
                      className="text-xs font-semibold text-[#6B7C93] hover:text-[#163A66] cursor-pointer"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                    {filteredRoster.map((stu) => {
                      const sub = stu.submissions?.[selectedAssignmentForGrading.id];
                      const currentScore = sub?.score ?? '';
                      return (
                        <div
                          key={stu.studentCode}
                          className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                        >
                          <span className="text-xs text-[#163A66] truncate">
                            {stu.no}. {stu.fullName}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={selectedAssignmentForGrading.maxScore}
                            value={currentScore}
                            placeholder="-"
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (Number.isNaN(val)) return;
                              const updated = sgsRosterAndSubmissionService.gradeStudentSubmission(
                                stu.studentCode,
                                selectedAssignmentForGrading.id,
                                Math.min(selectedAssignmentForGrading.maxScore, Math.max(0, val)),
                                '',
                                selectedClassroom
                              );
                              setSgsRoster(updated);
                            }}
                            className="w-16 px-2 py-1 text-right text-xs font-bold rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SINGLE UNIFIED 4-PART GRADEBOOK TABLE (ตารางสมุดคะแนน ปพ.5 เดียว)
             ================================================================ */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] shadow-[0_4px_16px_rgba(40,90,140,0.06)] overflow-hidden">
            {isLoadingRoster ? (
              <div className="p-8 text-center text-sm text-[#6B7C93]">
                กำลังโหลดรายชื่อนักเรียนห้อง {selectedClassroom}...
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-[#163A66]">
                  ไม่พบรายชื่อนักเรียนในห้อง {selectedClassroom || '-'}
                </p>
                <p className="text-xs text-[#6B7C93]">
                  กรุณาเลือกห้องเรียนด้านบน หรือตรวจสอบการนำเข้าข้อมูลนักเรียนประจำภาคเรียน
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F7FAFF] border-b border-[#E6EEF7] text-[12px] font-semibold text-[#6B7C93]">
                        <th className="py-3 px-3 text-center w-14">เลขที่</th>
                        <th className="py-3 px-3 w-24">รหัส</th>
                        <th className="py-3 px-3 min-w-[180px]">ชื่อ - นามสกุล</th>
                        <th className="py-3 px-3 text-center w-24">เวลาเรียน</th>
                        <th className="py-3 px-3 text-center w-32 bg-blue-50/50 text-blue-800">
                          <div>ก่อนกลางภาค</div>
                          <div className="text-[11px] font-normal text-blue-600">
                            (เต็ม {courseWeights.preMidterm})
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-32 bg-amber-50/50 text-amber-800">
                          <div>กลางภาค</div>
                          <div className="text-[11px] font-normal text-amber-600">
                            (เต็ม {courseWeights.midterm})
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-32 bg-indigo-50/50 text-indigo-800">
                          <div>หลังกลางภาค</div>
                          <div className="text-[11px] font-normal text-indigo-600">
                            (เต็ม {courseWeights.postMidterm})
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-32 bg-purple-50/50 text-purple-800">
                          <div>ปลายภาค</div>
                          <div className="text-[11px] font-normal text-purple-600">
                            (เต็ม {courseWeights.final})
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-24 font-bold text-[#163A66]">
                          รวม (100)
                        </th>
                        <th className="py-3 px-3 text-center w-24 font-bold text-[#163A66]">
                          เกรด
                        </th>
                        <th className="py-3 px-3 text-center w-24">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredRoster.map((stu) => {
                        const calc = sgsRosterAndSubmissionService.computeStudentSgsGrades(
                          stu,
                          currentSubject.courseCode,
                          selectedClassroom
                        );
                        const isFailOrRisk =
                          calc.gradeLabel === '0' ||
                          calc.gradeLabel === 'ร' ||
                          calc.gradeLabel === 'มส';

                        return (
                          <tr
                            key={stu.studentCode}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center font-semibold text-[#6B7C93]">
                              {stu.no}
                            </td>
                            <td className="py-2.5 px-3 text-xs font-mono text-[#6B7C93]">
                              {stu.studentCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#163A66]">
                              {stu.fullName}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  (stu.attendanceRate ?? 100) < 80
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {stu.attendanceRate ?? 100}%
                              </span>
                            </td>

                            {/* 1. ก่อนกลางภาค */}
                            <td className="py-2 px-2 text-center bg-blue-50/20">
                              <input
                                type="number"
                                min={0}
                                max={courseWeights.preMidterm}
                                value={calc.preMidterm}
                                onChange={(e) =>
                                  handleFourPartScoreChange(
                                    stu.studentCode,
                                    'PRE_MIDTERM',
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2.5 py-1.5 text-center font-semibold text-[#163A66] bg-white rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                              />
                            </td>

                            {/* 2. กลางภาค */}
                            <td className="py-2 px-2 text-center bg-amber-50/20">
                              <input
                                type="number"
                                min={0}
                                max={courseWeights.midterm}
                                value={calc.midterm}
                                onChange={(e) =>
                                  handleFourPartScoreChange(
                                    stu.studentCode,
                                    'MIDTERM',
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2.5 py-1.5 text-center font-semibold text-[#163A66] bg-white rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                              />
                            </td>

                            {/* 3. หลังกลางภาค */}
                            <td className="py-2 px-2 text-center bg-indigo-50/20">
                              <input
                                type="number"
                                min={0}
                                max={courseWeights.postMidterm}
                                value={calc.postMidterm}
                                onChange={(e) =>
                                  handleFourPartScoreChange(
                                    stu.studentCode,
                                    'POST_MIDTERM',
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2.5 py-1.5 text-center font-semibold text-[#163A66] bg-white rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                              />
                            </td>

                            {/* 4. ปลายภาค */}
                            <td className="py-2 px-2 text-center bg-purple-50/20">
                              <input
                                type="number"
                                min={0}
                                max={courseWeights.final}
                                value={calc.final}
                                onChange={(e) =>
                                  handleFourPartScoreChange(
                                    stu.studentCode,
                                    'FINAL',
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2.5 py-1.5 text-center font-semibold text-[#163A66] bg-white rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                              />
                            </td>

                            {/* รวม 100 */}
                            <td className="py-2.5 px-3 text-center font-bold text-base text-[#163A66]">
                              {calc.total}
                            </td>

                            {/* เกรด */}
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                  isFailOrRisk
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : Number(calc.gradeLabel) >= 3
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {calc.gradeLabel}
                              </span>
                            </td>

                            {/* ปุ่มสลับสถานะ ร / มส */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSpecialStatus(stu.studentCode, stu.specialStatus)
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                  stu.specialStatus === 'NORMAL'
                                    ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                                title="คลิกเพื่อสลับสถานะ ปกติ / ร / มส"
                              >
                                {stu.specialStatus === 'NORMAL' ? 'ปกติ' : stu.specialStatus}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredRoster.map((stu) => {
                    const calc = sgsRosterAndSubmissionService.computeStudentSgsGrades(
                      stu,
                      currentSubject.courseCode,
                      selectedClassroom
                    );
                    const isFailOrRisk =
                      calc.gradeLabel === '0' ||
                      calc.gradeLabel === 'ร' ||
                      calc.gradeLabel === 'มส';

                    return (
                      <div key={stu.studentCode} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[#163A66]">
                              {stu.no}. {stu.fullName}
                            </p>
                            <p className="text-xs text-[#6B7C93]">
                              รหัส {stu.studentCode} • เวลาเรียน {stu.attendanceRate}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-[11px] text-[#6B7C93] block">รวม {calc.total}/100</span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                                  isFailOrRisk
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                เกรด {calc.gradeLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                            <label className="block text-[11px] font-semibold text-blue-800 mb-1">
                              ก่อนกลางภาค ({courseWeights.preMidterm})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={courseWeights.preMidterm}
                              value={calc.preMidterm}
                              onChange={(e) =>
                                handleFourPartScoreChange(
                                  stu.studentCode,
                                  'PRE_MIDTERM',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-sm font-bold text-[#163A66]"
                            />
                          </div>

                          <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                            <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                              กลางภาค ({courseWeights.midterm})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={courseWeights.midterm}
                              value={calc.midterm}
                              onChange={(e) =>
                                handleFourPartScoreChange(stu.studentCode, 'MIDTERM', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-200 text-sm font-bold text-[#163A66]"
                            />
                          </div>

                          <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                            <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                              หลังกลางภาค ({courseWeights.postMidterm})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={courseWeights.postMidterm}
                              value={calc.postMidterm}
                              onChange={(e) =>
                                handleFourPartScoreChange(
                                  stu.studentCode,
                                  'POST_MIDTERM',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-sm font-bold text-[#163A66]"
                            />
                          </div>

                          <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                            <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                              ปลายภาค ({courseWeights.final})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={courseWeights.final}
                              value={calc.final}
                              onChange={(e) =>
                                handleFourPartScoreChange(stu.studentCode, 'FINAL', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-sm font-bold text-[#163A66]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: คุณลักษณะอันพึงประสงค์ และ อ่าน คิดวิเคราะห์ เขียน (2 ตัวเลือกชัดเจน)
         ==================================================================== */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          {/* 2 Clear Mode Options Card */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: ดึงจากเกรดวิชาอัตโนมัติ */}
              <div
                onClick={() => setAttributeMode('AUTO_FROM_GRADE')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  attributeMode === 'AUTO_FROM_GRADE'
                    ? 'border-[#3B82F6] bg-[#EFF6FF]/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm font-bold text-[#163A66]">
                      ตัวเลือกที่ 1: ดึงผลตามเกรดวิชาอัตโนมัติ
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7C93]">
                    คำนวณระดับ 3 (ดีเยี่ยม), 2 (ดี), 1 (ผ่าน), 0 (ไม่ผ่าน) จากเกรดวิชานี้ให้ทั้งห้องในคลิกเดียว
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttributeMode('AUTO_FROM_GRADE');
                    handleAutoCalculateAttributesFromGrades();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shrink-0 shadow-xs cursor-pointer"
                >
                  ดึงจากเกรดทันที
                </button>
              </div>

              {/* Option 2: แก้ไขเองรายบุคคล / ตั้งค่าเอง */}
              <div
                onClick={() => setAttributeMode('MANUAL_EDIT')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  attributeMode === 'MANUAL_EDIT'
                    ? 'border-[#3B82F6] bg-[#EFF6FF]/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm font-bold text-[#163A66]">
                      ตัวเลือกที่ 2: กำหนดเอง / แก้ไขรายบุคคล
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7C93]">
                    คลิกเลือกระดับ 3, 2, 1, 0 ของนักเรียนแต่ละคนในตารางด้านล่าง หรือตั้งค่าเริ่มต้นทั้งห้อง
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttributeMode('MANUAL_EDIT');
                      handleBulkSetAllAttributes(3);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-pointer"
                  >
                    ตั้งทั้งห้องเป็น 3
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-bar: Toggle Compact vs Detailed 8+5 Columns */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDetailedTraitColumns(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    !showDetailedTraitColumns
                      ? 'bg-[#163A66] text-white'
                      : 'bg-slate-100 text-[#6B7C93] hover:text-[#163A66]'
                  }`}
                >
                  มุมมองสรุป (แก้ไขเร็ว)
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailedTraitColumns(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    showDetailedTraitColumns
                      ? 'bg-[#163A66] text-white'
                      : 'bg-slate-100 text-[#6B7C93] hover:text-[#163A66]'
                  }`}
                >
                  แยกตามข้อ (คุณลักษณะฯ 8 ข้อ / อ่านคิดวิเคราะห์ 5 ข้อ)
                </button>
              </div>

              <span className="text-xs text-[#6B7C93]">
                เกณฑ์: 3 = ดีเยี่ยม • 2 = ดี • 1 = ผ่าน • 0 = ไม่ผ่าน
              </span>
            </div>
          </div>

          {/* Attributes Table */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] shadow-[0_4px_16px_rgba(40,90,140,0.06)] overflow-hidden">
            {!showDetailedTraitColumns ? (
              /* COMPACT SUMMARY VIEW (แก้ไขรายคนได้ในคลิกเดียว ไม่ต้องเลื่อนตารางยาว) */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7FAFF] border-b border-[#E6EEF7] text-xs font-semibold text-[#6B7C93]">
                      <th className="py-3 px-3 text-center w-14">เลขที่</th>
                      <th className="py-3 px-3 w-24">รหัส</th>
                      <th className="py-3 px-3 min-w-[180px]">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-3 text-center w-28">เกรดวิชานี้</th>
                      <th className="py-3 px-4 text-center">
                        คุณลักษณะอันพึงประสงค์ (สรุป 8 ข้อ)
                      </th>
                      <th className="py-3 px-4 text-center">
                        อ่าน คิดวิเคราะห์ และเขียน (สรุป 5 ข้อ)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRoster.map((stu) => {
                      const calc = sgsRosterAndSubmissionService.computeStudentSgsGrades(
                        stu,
                        currentSubject.courseCode,
                        selectedClassroom
                      );
                      const charMode = sgsRosterAndSubmissionService.computeOverallAttributeMode(
                        stu.desirableCharacteristics
                      );
                      const critMode = sgsRosterAndSubmissionService.computeOverallAttributeMode(
                        stu.criticalThinking
                      );

                      return (
                        <tr key={stu.studentCode} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center font-semibold text-[#6B7C93]">
                            {stu.no}
                          </td>
                          <td className="py-2.5 px-3 text-xs font-mono text-[#6B7C93]">
                            {stu.studentCode}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#163A66]">
                            {stu.fullName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {calc.gradeLabel} ({calc.total})
                            </span>
                          </td>

                          {/* คุณลักษณะอันพึงประสงค์ Quick Selector */}
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                              {([3, 2, 1, 0] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() =>
                                    handleSetStudentOverallAttribute(stu.studentCode, 'CHAR', lvl)
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    charMode === lvl
                                      ? 'bg-[#3B82F6] text-white shadow-2xs'
                                      : 'text-[#6B7C93] hover:text-[#163A66]'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                              <span
                                className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${LEVEL_LABELS[charMode].cls}`}
                              >
                                {LEVEL_LABELS[charMode].short}
                              </span>
                            </div>
                          </td>

                          {/* อ่าน คิดวิเคราะห์ และเขียน Quick Selector */}
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                              {([3, 2, 1, 0] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() =>
                                    handleSetStudentOverallAttribute(stu.studentCode, 'CRIT', lvl)
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    critMode === lvl
                                      ? 'bg-[#3B82F6] text-white shadow-2xs'
                                      : 'text-[#6B7C93] hover:text-[#163A66]'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                              <span
                                className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${LEVEL_LABELS[critMode].cls}`}
                              >
                                {LEVEL_LABELS[critMode].short}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* DETAILED 8 + 5 TRAIT COLUMNS VIEW */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7FAFF] border-b border-[#E6EEF7] font-semibold text-[#6B7C93]">
                      <th className="py-3 px-2.5 text-center">เลขที่</th>
                      <th className="py-3 px-2.5 min-w-[150px]">ชื่อ - นามสกุล</th>
                      {DESIRABLE_CHARACTERISTICS_LIST.map((label, i) => (
                        <th
                          key={`char-${i}`}
                          className="py-2 px-1.5 text-center bg-blue-50/40 text-blue-800"
                          title={label}
                        >
                          คุณฯ {i + 1}
                        </th>
                      ))}
                      {CRITICAL_THINKING_LIST.map((label, i) => (
                        <th
                          key={`crit-${i}`}
                          className="py-2 px-1.5 text-center bg-purple-50/40 text-purple-800"
                          title={label}
                        >
                          อ่านฯ {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoster.map((stu) => (
                      <tr key={stu.studentCode} className="hover:bg-slate-50/80">
                        <td className="py-2 px-2.5 text-center font-semibold text-[#6B7C93]">
                          {stu.no}
                        </td>
                        <td className="py-2 px-2.5 font-medium text-[#163A66]">{stu.fullName}</td>
                        {(stu.desirableCharacteristics || (Array(8).fill(3) as (0 | 1 | 2 | 3)[])).map((val, idx) => (
                          <td key={`c-${idx}`} className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const next = ((val + 1) % 4) as 0 | 1 | 2 | 3;
                                const updated =
                                  sgsRosterAndSubmissionService.updateStudentAttributeLevel(
                                    stu.studentCode,
                                    'CHAR',
                                    idx,
                                    next,
                                    selectedClassroom
                                  );
                                setSgsRoster([...updated]);
                              }}
                              className={`w-7 h-7 rounded-lg font-bold border cursor-pointer ${LEVEL_LABELS[val].cls}`}
                            >
                              {val}
                            </button>
                          </td>
                        ))}
                        {(stu.criticalThinking || (Array(5).fill(3) as (0 | 1 | 2 | 3)[])).map((val, idx) => (
                          <td key={`r-${idx}`} className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const next = ((val + 1) % 4) as 0 | 1 | 2 | 3;
                                const updated =
                                  sgsRosterAndSubmissionService.updateStudentAttributeLevel(
                                    stu.studentCode,
                                    'CRIT',
                                    idx,
                                    next,
                                    selectedClassroom
                                  );
                                setSgsRoster([...updated]);
                              }}
                              className={`w-7 h-7 rounded-lg font-bold border cursor-pointer ${LEVEL_LABELS[val].cls}`}
                            >
                              {val}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Assignments Deep-Link Tab */}
      {activeTab === 'assignments' && (
        <AssignmentManagementView
          initialQuickFilter={initialAssignmentFilter}
          initialHighlightBanner={initialHighlightBanner}
        />
      )}

      {/* ====================================================================
          MODAL 1: ตั้งค่าสัดส่วนคะแนน 4 ส่วนรายวิชา (25:20:25:30 / 30:20:30:20 / กำหนดเอง)
         ==================================================================== */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#163A66]">
                  ตั้งค่าสัดส่วนคะแนน 4 ส่วน
                </h3>
                <p className="text-xs text-[#6B7C93]">
                  วิชา {currentSubject.courseCode} {currentSubject.courseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWeightModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6B7C93]">
                รูปแบบมาตรฐาน (คลิกเพื่อเลือก):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraftWeights({
                      courseCode: currentSubject.courseCode,
                      preMidterm: 25,
                      midterm: 20,
                      postMidterm: 25,
                      final: 30,
                    })
                  }
                  className="p-2.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-blue-100/70 text-xs font-bold text-[#163A66] cursor-pointer"
                >
                  25 : 20 : 25 : 30 (ปลายภาค 30)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraftWeights({
                      courseCode: currentSubject.courseCode,
                      preMidterm: 30,
                      midterm: 20,
                      postMidterm: 30,
                      final: 20,
                    })
                  }
                  className="p-2.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-blue-100/70 text-xs font-bold text-[#163A66] cursor-pointer"
                >
                  30 : 20 : 30 : 20 (ปลายภาค 20)
                </button>
              </div>
            </div>

            {/* Custom 4 Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  1. ก่อนกลางภาค
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftWeights.preMidterm}
                  onChange={(e) =>
                    setDraftWeights((w) => ({ ...w, preMidterm: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  2. กลางภาค
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftWeights.midterm}
                  onChange={(e) =>
                    setDraftWeights((w) => ({ ...w, midterm: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  3. หลังกลางภาค
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftWeights.postMidterm}
                  onChange={(e) =>
                    setDraftWeights((w) => ({ ...w, postMidterm: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  4. ปลายภาค
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftWeights.final}
                  onChange={(e) =>
                    setDraftWeights((w) => ({ ...w, final: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                draftWeightTotal === 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span>ผลรวมคะแนนทั้งหมดต้องเท่ากับ 100 คะแนน</span>
              <span className="text-sm font-bold">รวม: {draftWeightTotal} / 100</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWeightModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#6B7C93] hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={draftWeightTotal !== 100}
                onClick={handleSaveWeights}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                บันทึกสัดส่วนวิชานี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: สั่งงานใหม่ (เลือกได้ทั้ง "ทุกห้องในรายวิชา" หรือ "เฉพาะห้องที่เลือก")
         ==================================================================== */}
      {isAddAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssignmentSubmit}
            className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#163A66]">
                  สั่งงาน / เก็บคะแนนใหม่
                </h3>
                <p className="text-xs text-[#6B7C93]">
                  วิชา {currentSubject.courseCode} {currentSubject.courseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAssignModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                ชื่อชิ้นงาน / หัวข้อการเก็บคะแนน *
              </label>
              <input
                type="text"
                required
                value={newAssignTitle}
                onChange={(e) => setNewAssignTitle(e.target.value)}
                placeholder="เช่น แบบฝึกหัดบทที่ 1, สอบย่อยก่อนกลางภาค"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                  อยู่ในส่วนคะแนนใดของ ปพ.5 *
                </label>
                <select
                  value={newAssignPart}
                  onChange={(e) => setNewAssignPart(e.target.value as FourScorePart)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66]"
                >
                  <option value="PRE_MIDTERM">1. ก่อนกลางภาค (เต็ม {courseWeights.preMidterm})</option>
                  <option value="MIDTERM">2. กลางภาค (เต็ม {courseWeights.midterm})</option>
                  <option value="POST_MIDTERM">3. หลังกลางภาค (เต็ม {courseWeights.postMidterm})</option>
                  <option value="FINAL">4. ปลายภาค (เต็ม {courseWeights.final})</option>
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
                    value={newAssignMaxScore}
                    onChange={(e) => setNewAssignMaxScore(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#163A66] mb-1">
                    กำหนดส่ง
                  </label>
                  <input
                    type="date"
                    value={newAssignDueDate}
                    onChange={(e) => setNewAssignDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66]"
                  />
                </div>
              </div>
            </div>

            {/* Classroom Scope Selection: All Classrooms in Course vs Selected Classrooms */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-[#163A66]">
                ห้องเรียนที่ต้องการสั่งงาน:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewAssignScopeMode('ALL_SUBJECT_ROOMS')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    newAssignScopeMode === 'ALL_SUBJECT_ROOMS'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                      : 'border-slate-200 bg-white text-[#6B7C93]'
                  }`}
                >
                  <p className="text-xs font-bold">
                    สั่งทุกห้องในรายวิชานี้ ({availableClassroomsForSubject.length} ห้อง)
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    สร้างงานเดียวใช้ร่วมกันทุกห้องที่เรียนวิชานี้
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewAssignScopeMode('SELECTED_ROOMS');
                    if (newAssignSelectedRooms.length === 0 && selectedClassroom) {
                      setNewAssignSelectedRooms([selectedClassroom]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    newAssignScopeMode === 'SELECTED_ROOMS'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                      : 'border-slate-200 bg-white text-[#6B7C93]'
                  }`}
                >
                  <p className="text-xs font-bold">เลือกเฉพาะบางห้อง</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    เลือกสั่งเฉพาะห้องที่ต้องการเก็บคะแนน
                  </p>
                </button>
              </div>

              {newAssignScopeMode === 'SELECTED_ROOMS' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {availableClassroomsForSubject.map((room) => {
                    const checked = newAssignSelectedRooms.includes(room);
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => {
                          setNewAssignSelectedRooms((prev) =>
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
                onClick={() => setIsAddAssignModalOpen(false)}
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
          MODAL 3: วิธีใช้งาน (ซ่อนคำอธิบายไว้ในปุ่ม ⓘ เพื่อไม่ให้หน้าจอรก)
         ==================================================================== */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="text-base font-bold text-[#163A66]">
                  วิธีใช้งานสมุดคะแนน ปพ.5 แบบเข้าใจง่าย
                </h3>
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
                <p className="font-bold text-[#3B82F6]">1. ตั้งสัดส่วนคะแนน 4 ส่วน (รายวิชา)</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  กดเลือกสัดส่วน <strong>25 : 20 : 25 : 30</strong> หรือ{' '}
                  <strong>30 : 20 : 30 : 20</strong> หรือกดปุ่มปรับสัดส่วนเองตามโครงสร้างรายวิชา
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">2. กรอกคะแนน หรือ สั่งงานเชื่อม ปพ.5</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  พิมพ์คะแนนลงในช่อง <strong>ก่อนกลางภาค / กลางภาค / หลังกลางภาค / ปลายภาค</strong>{' '}
                  ในตารางได้ทันที หรือกดปุ่ม <strong>"+ สั่งงานใหม่"</strong> เพื่อสั่งงานรายห้องหรือทุกห้องในรายวิชา
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">
                  3. ประเมินคุณลักษณะฯ & อ่านคิดวิเคราะห์
                </p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  สลับไปที่แท็บที่ 2 แล้วเลือกได้ว่าจะกด <strong>"ดึงจากเกรดทันที"</strong>{' '}
                  ให้ระบบคำนวณอัตโนมัติทั้งห้อง หรือคลิกปรับระดับ 3, 2, 1, 0 รายบุคคล
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
    </div>
  );
};
