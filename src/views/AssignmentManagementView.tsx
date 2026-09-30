import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';
import { PaperRegisterLedger } from '../components/teacher/PaperRegisterLedger';

export type QuickFilterMode = 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';

interface AssignmentManagementViewProps {
  initialQuickFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
}

export const AssignmentManagementView: React.FC<AssignmentManagementViewProps> = ({
  initialQuickFilter = 'ALL',
  initialHighlightBanner: _initialHighlightBanner = null,
}) => {
  const [roster, setRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [assignments, setAssignments] = useState<TermAssignmentItem[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );
  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );

  const [viewMode, setViewMode] = useState<'MATRIX_TABLE' | 'SPEED_GRADER'>(
    'MATRIX_TABLE'
  );
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<QuickFilterMode>(initialQuickFilter);

  useEffect(() => {
    setQuickFilter(initialQuickFilter);
  }, [initialQuickFilter]);

  useEffect(() => {
    const handler = () => {
      setRoster([...sgsRosterAndSubmissionService.getSgsRoster()]);
      setAssignments([...sgsRosterAndSubmissionService.getTermAssignments()]);
      setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
    };
    window.addEventListener('kp-copilot-updated', handler);
    return () => window.removeEventListener('kp-copilot-updated', handler);
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTransferredOut, setShowTransferredOut] = useState<boolean>(true);

  // SpeedGrader state
  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState<string>('asg-3');
  const [activeStudentIndex, setActiveStudentIndex] = useState<number>(0);

  // Modal create assignment & R2 Storage / Student Upload drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUnit, setNewUnit] = useState<'u1' | 'u2' | 'u3'>('u2');
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newDueDate, setNewDueDate] = useState('28 ก.ย. 69');
  const [newIsMandatory, setNewIsMandatory] = useState(false);

  const [isR2PanelOpen, setIsR2PanelOpen] = useState(false);
  const [isStudentSubmitOpen, setIsStudentSubmitOpen] = useState(false);
  const [submitChannel, setSubmitChannel] = useState<'R2_FILE' | 'CANVA_LINK'>('R2_FILE');
  const [videoBlockedError, setVideoBlockedError] = useState<string | null>(null);
  const [r2RoleMode, setR2RoleMode] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [courseStorages, setCourseStorages] = useState(() =>
    sgsRosterAndSubmissionService.getCourseStorageSummaries()
  );
  const [uploadStudentCode, setUploadStudentCode] = useState('45102');
  const [uploadAssignmentId, setUploadAssignmentId] = useState('asg-3');
  const [uploadWorkTitle] = useState('ส่งงานภาพวาดทัศนียภาพ 2 จุด');
  const [uploadFileName, setUploadFileName] = useState('perspective_2point_45102.jpg');
  const [uploadExternalLink, setUploadExternalLink] = useState('https://www.canva.com/design/DAFxArtwork45102/view');

  const r2Stats = useMemo(
    () => sgsRosterAndSubmissionService.getR2StorageStats(),
    [submissions]
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const filteredAssignments = useMemo(() => {
    if (selectedUnitFilter === 'ALL') return assignments;
    return assignments.filter((a) => a.sgsUnit === selectedUnitFilter);
  }, [assignments, selectedUnitFilter]);

  const problemStats = useMemo(() => {
    const activeStudents = roster.filter(
      (s) => s.transferState !== 'TRANSFERRED_OUT'
    );
    let missingOrRCount = 0;
    let pendingStudentCount = 0;

    activeStudents.forEach((stu) => {
      const g = sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
      if (g.missingCount > 0 || g.gradeLabel === 'ร') {
        missingOrRCount++;
      }
      const hasPending = submissions.some(
        (c) =>
          c.studentCode === stu.studentCode && c.status === 'SUBMITTED_PENDING'
      );
      if (hasPending) pendingStudentCount++;
    });

    return { missingOrRCount, pendingStudentCount };
  }, [roster, submissions]);

  const visibleRoster = useMemo(() => {
    return roster.filter((s) => {
      if (!showTransferredOut && s.transferState === 'TRANSFERRED_OUT') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.includes(q) ||
          String(s.sgsSeatNo) === q;
        if (!match) return false;
      }
      if (quickFilter === 'MISSING_OR_R') {
        if (s.transferState === 'TRANSFERRED_OUT') return false;
        const g = sgsRosterAndSubmissionService.computeStudentSgsGrades(s);
        return g.missingCount > 0 || g.gradeLabel === 'ร';
      }
      if (quickFilter === 'PENDING_REVIEW') {
        if (s.transferState === 'TRANSFERRED_OUT') return false;
        return submissions.some(
          (c) =>
            c.studentCode === s.studentCode && c.status === 'SUBMITTED_PENDING'
        );
      }
      return true;
    });
  }, [roster, showTransferredOut, searchQuery, quickFilter, submissions]);

  const getCell = (
    studentCode: string,
    assignmentId: string
  ): StudentWorkSubmission => {
    const found = submissions.find(
      (c) => c.studentCode === studentCode && c.assignmentId === assignmentId
    );
    return (
      found || {
        studentCode,
        assignmentId,
        status: 'MISSING',
        score: null,
      }
    );
  };

  const handleScoreInput = (
    studentCode: string,
    assignmentId: string,
    valStr: string,
    maxScore: number
  ) => {
    if (valStr.trim() === '') {
      const updated = sgsRosterAndSubmissionService.gradeSubmission(
        assignmentId,
        studentCode,
        null,
        'MISSING'
      );
      setSubmissions([...updated]);
      return;
    }
    const num = Math.min(maxScore, Math.max(0, Number(valStr)));
    if (Number.isNaN(num)) return;
    const updated = sgsRosterAndSubmissionService.gradeSubmission(
      assignmentId,
      studentCode,
      num,
      'GRADED'
    );
    setSubmissions([...updated]);
  };

  // Spreadsheet Keyboard Navigation (Enter / ArrowDown / ArrowUp)
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(
        `input[data-grid-col="${colKey}"][data-grid-row="${rowIndex + 1}"]`
      );
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[data-grid-col="${colKey}"][data-grid-row="${rowIndex - 1}"]`
      );
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const handleBatchGradePending = (assignmentId: string, maxScore: number) => {
    const updated =
      sgsRosterAndSubmissionService.bulkGradeAllSubmitted(assignmentId);
    setSubmissions([...updated]);
    showToast(`ให้คะแนนเต็ม (${maxScore}) นักเรียนที่ส่งงานแล้วเรียบร้อย`);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = sgsRosterAndSubmissionService.addTermAssignment({
      title: newTitle.trim(),
      sgsUnit: newUnit,
      maxScore: Number(newMaxScore) || 10,
      dueDate: newDueDate,
      isRequiredForPass: newIsMandatory,
    });
    setAssignments([...updated]);
    setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
    setNewTitle('');
    setNewIsMandatory(false);
    setIsNewModalOpen(false);
    showToast(`เพิ่มงาน "${newTitle.trim()}" เรียบร้อยแล้ว`);
  };

  const pendingTotalCount = useMemo(
    () => submissions.filter((c) => c.status === 'SUBMITTED_PENDING').length,
    [submissions]
  );

  const selectedAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  const activeRosterOnly = visibleRoster.filter(
    (s) => s.transferState !== 'TRANSFERRED_OUT'
  );
  const currentStudent =
    activeRosterOnly[activeStudentIndex] || activeRosterOnly[0];

  // Ordered row counter for keyboard navigation
  let activeRowCounter = -1;

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ตารางสมุดตรวจการบ้าน & เช็คงานส่งแบบกระดาษ (เห็นทั้งห้อง + ทุกชิ้นงานในหน้าเดียว ไม่มีคำอธิบายรกตา) */}
      <PaperRegisterLedger initialMode="HOMEWORK_CHECK" />

      {/* Clean Single-Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Compact Top Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode('MATRIX_TABLE')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'MATRIX_TABLE'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตารางส่งงาน ({assignments.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('SPEED_GRADER')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'SPEED_GRADER'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตรวจรายชิ้น
              </button>
            </div>

            {viewMode === 'MATRIX_TABLE' && (
              <>
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-teal-600"
                >
                  <option value="ALL">ทุกหน่วยการเรียนรู้</option>
                  <option value="u1">หน่วยที่ 1 (เต็ม 15)</option>
                  <option value="u2">หน่วยที่ 2 (เต็ม 20)</option>
                  <option value="u3">หน่วยที่ 3 (เต็ม 15)</option>
                </select>

                {/* 1-Click Quick Filter Chips */}
                <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setQuickFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      quickFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickFilter(
                        quickFilter === 'MISSING_OR_R' ? 'ALL' : 'MISSING_OR_R'
                      )
                    }
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      quickFilter === 'MISSING_OR_R'
                        ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    ค้างงาน / ติด ร ({problemStats.missingOrRCount})
                  </button>
                  {problemStats.pendingStudentCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuickFilter(
                          quickFilter === 'PENDING_REVIEW'
                            ? 'ALL'
                            : 'PENDING_REVIEW'
                        )
                      }
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        quickFilter === 'PENDING_REVIEW'
                          ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      รอตรวจ ({problemStats.pendingStudentCount})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ/เลขที่..."
                    className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white w-36 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTransferredOut}
                    onChange={() => setShowTransferredOut((v) => !v)}
                    className="w-3.5 h-3.5 accent-teal-600 rounded"
                  />
                  <span>แสดงคนย้ายออก</span>
                </label>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pendingTotalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const updated =
                    sgsRosterAndSubmissionService.bulkGradeAllSubmitted();
                  setSubmissions([...updated]);
                  showToast(
                    `ตรวจให้คะแนนเต็มงานที่ส่งแล้วทั้งหมด ${pendingTotalCount} ช่องเรียบร้อย`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>ตรวจให้เต็มที่ส่งแล้ว ({pendingTotalCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsStudentSubmitOpen((v) => !v);
                setIsR2PanelOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isStudentSubmitOpen
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-900 border-teal-200'
              }`}
            >
              <span>📤 นักเรียนส่งไฟล์งาน (R2)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsR2PanelOpen((v) => !v);
                setIsStudentSubmitOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isR2PanelOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span>☁️ พื้นที่ R2 ({r2Stats.totalCompressedMb} MB) · ล้างไฟล์ท้ายปี</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สั่งงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Drawer 1: นักเรียนส่งงานออนไลน์ (แยกชัดเจน 2 รูปแบบไม่ซ้ำซ้อน: 1. อัปโหลดรูป/PDF ขึ้น R2 หรือ 2. ส่งเป็นลิงก์ Canva / ลิงก์วิดีโอที่นักเรียนอัปโหลดเอง) */}
        {isStudentSubmitOpen && (
          <div className="px-4 py-3.5 bg-teal-50/50 border-b border-teal-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-teal-950">
                  📤 ส่งงานออนไลน์ (รูป/PDF เข้า R2 · ลิงก์ Canva/วิดีโอ 0 KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-white p-0.5 rounded-lg border border-teal-300 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitChannel('R2_FILE');
                      setVideoBlockedError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                      submitChannel === 'R2_FILE'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🖼️ 1. อัปโหลดรูป/PDF เข้า R2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitChannel('CANVA_LINK');
                      setVideoBlockedError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                      submitChannel === 'CANVA_LINK'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎨 2. ส่งลิงก์ Canva / ลิงก์วิดีโอ (0 KB บน R2)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudentSubmitOpen(false)}
                  className="text-slate-500 hover:text-slate-800 font-semibold ml-1"
                >
                  ปิด ✕
                </button>
              </div>
            </div>

            {videoBlockedError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex flex-wrap items-center justify-between gap-2">
                <span>
                  🚫 <strong>ไม่อนุญาตให้อัปโหลดไฟล์วิดีโอขนาดใหญ่เข้า R2:</strong> {videoBlockedError}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitChannel('CANVA_LINK');
                    setVideoBlockedError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                >
                  สลับไปส่งเป็นลิงก์ Canva / ลิงก์วิดีโอทันที →
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (submitChannel === 'R2_FILE') {
                  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(uploadFileName)) {
                    setVideoBlockedError(
                      `ไฟล์ "${uploadFileName}" เป็นไฟล์วิดีโอ ระบบกำหนดให้ไฟล์วิดีโอขนาดใหญ่และงาน Canva ต้องส่งเป็นลิงก์เท่านั้น เพื่อป้องกันพื้นที่ R2 เต็ม`
                    );
                    return;
                  }
                  const updated = sgsRosterAndSubmissionService.submitStudentWorkToR2({
                    assignmentId: uploadAssignmentId,
                    studentCode: uploadStudentCode,
                    workTitle: uploadWorkTitle,
                    fileName: uploadFileName || 'student_work.jpg',
                    originalSizeKb: 4250,
                    compressedSizeKb: 148,
                    academicYearTerm: '1/2569',
                  });
                  setSubmissions([...updated]);
                  setCourseStorages(sgsRosterAndSubmissionService.getCourseStorageSummaries());
                  const stu = roster.find((r) => r.studentCode === uploadStudentCode);
                  showToast(
                    `☁️ อัปโหลดไฟล์รูป/PDF ของ ${stu?.studentName || uploadStudentCode} เข้า R2 (บีบอัดเหลือ 148 KB) เรียบร้อยแล้ว!`
                  );
                } else {
                  const updated = sgsRosterAndSubmissionService.submitStudentWorkToR2({
                    assignmentId: uploadAssignmentId,
                    studentCode: uploadStudentCode,
                    workTitle: 'ส่งลิงก์ผลงาน Canva / วิดีโอออนไลน์',
                    originalSizeKb: 0,
                    compressedSizeKb: 0,
                    externalLinkUrl:
                      uploadExternalLink.trim() ||
                      'https://www.canva.com/design/DAFxArtwork45102/view',
                    academicYearTerm: '1/2569',
                  });
                  setSubmissions([...updated]);
                  setCourseStorages(sgsRosterAndSubmissionService.getCourseStorageSummaries());
                  const stu = roster.find((r) => r.studentCode === uploadStudentCode);
                  showToast(
                    `🎨 บันทึกลิงก์ผลงาน Canva/วิดีโอ ของ ${stu?.studentName || uploadStudentCode} สำเร็จ (ใช้พื้นที่ R2 = 0 KB)!`
                  );
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end pt-1"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  1. เลือกนักเรียนที่ส่งงาน
                </label>
                <select
                  value={uploadStudentCode}
                  onChange={(e) => setUploadStudentCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  {roster
                    .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
                    .map((s) => (
                      <option key={s.studentCode} value={s.studentCode}>
                        เลขที่ {s.sgsSeatNo} · {s.studentName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  2. ชิ้นงานที่ส่ง
                </label>
                <select
                  value={uploadAssignmentId}
                  onChange={(e) => setUploadAssignmentId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      งานที่ {a.orderNo}: {a.title} ({a.maxScore} คะแนน)
                    </option>
                  ))}
                </select>
              </div>

              {submitChannel === 'R2_FILE' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      3. ไฟล์รูปภาพ (.webp) / PDF เท่านั้น
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFileName('project_video_hd.mp4');
                        setVideoBlockedError(
                          'ไฟล์ "project_video_hd.mp4" (85 MB) เป็นไฟล์วิดีโอขนาดใหญ่ ระบบบล็อกการอัปโหลดเข้า R2 อัตโนมัติ กรุณาส่งเป็นลิงก์ Canva / ลิงก์วิดีโอแทน'
                        );
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      ลองทดสอบแนบไฟล์ .mp4
                    </button>
                  </div>
                  <input
                    type="text"
                    value={uploadFileName}
                    onChange={(e) => {
                      setUploadFileName(e.target.value);
                      setVideoBlockedError(null);
                    }}
                    placeholder="ชื่อไฟล์รูป/PDF เช่น work_45102.jpg"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                    3. ลิงก์ที่นักเรียนทำไว้ใน Canva หรือลิงก์วิดีโอขนาดใหญ่
                  </label>
                  <input
                    type="text"
                    value={uploadExternalLink}
                    onChange={(e) => setUploadExternalLink(e.target.value)}
                    placeholder="https://www.canva.com/design/..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white text-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`px-3.5 py-1.5 rounded-lg text-white font-bold shadow-2xs transition-colors ${
                  submitChannel === 'R2_FILE'
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {submitChannel === 'R2_FILE'
                  ? '☁️ อัปโหลดรูป/PDF เข้า R2'
                  : '🎨 ส่งลิงก์ Canva / วิดีโอ (0 KB)'}
              </button>
            </form>
          </div>
        )}

        {/* Drawer 2: จัดการพื้นที่ R2 แยกตามสิทธิ์ (ครูผู้สอน vs แอดมิน) + Backup เข้า Google Drive โรงเรียน (100 TB Workspace) */}
        {isR2PanelOpen && (
          <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900">
                  ☁️ จัดการพื้นที่ Cloudflare R2 & สำรอง Google Drive (100 TB)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* สวิตช์สลับสิทธิ์ ครูผู้สอน vs แอดมิน */}
                <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-300 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setR2RoleMode('TEACHER')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                      r2RoleMode === 'TEACHER'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👤 มุมมองครูผู้สอน (เฉพาะวิชาตัวเอง)
                  </button>
                  <button
                    type="button"
                    onClick={() => setR2RoleMode('ADMIN')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                      r2RoleMode === 'ADMIN'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛡️ มุมมองแอดมิน (ล้างได้ทุกคน/ทั้งเทอม/ทั้งปี)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsR2PanelOpen(false)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Action Bar ตามสิทธิ์ (ครูผู้สอน vs แอดมิน) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
              {r2RoleMode === 'TEACHER' ? (
                <>
                  <div className="text-slate-700">
                    👤 <strong>ครูภาสภูมิ เรืองปราชญ์:</strong> ดูแล 3 ห้องเรียน (ใช้พื้นที่ R2 รวม{' '}
                    <strong>
                      {courseStorages
                        .filter((c) => c.teacherId === 't-pasporm')
                        .reduce((acc, c) => acc + c.r2UsedMb, 0)
                        .toFixed(2)}{' '}
                      MB
                    </strong>
                    ) · ล้างได้เฉพาะวิชาของตัวเอง
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const res = sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                          mode: 'TEACHER_ALL',
                          teacherId: 't-pasporm',
                        });
                        setCourseStorages(res.courses);
                        showToast(
                          `☁️➡️📁 โอนย้ายไฟล์วิชาของครูภาสภูมิ (${res.backedUpCourseCount} วิชา · ${res.transferredMb} MB) เข้า Google Drive โรงเรียน (100 TB Workspace) สำเร็จ!`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                      ☁️➡️📁 1. โอนวิชาของฉันเข้า Google Drive รร. (100TB)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                          role: 'TEACHER',
                          currentTeacherId: 't-pasporm',
                          mode: 'TEACHER_OWN_ALL',
                          autoBackupToSchoolDriveFirst: true,
                        });
                        setCourseStorages(res.courses);
                        setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
                        showToast(
                          `🧹 ล้างไฟล์ R2 เฉพาะวิชาของครูภาสภูมิ (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) พร้อม Backup เข้า Google Drive 100TB เรียบร้อย!`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                    >
                      🧹 2. ล้างไฟล์ R2 เฉพาะวิชาของฉัน (คงคะแนน 100%)
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-slate-800">
                    🛡️ <strong>สิทธิ์แอดมินโรงเรียน:</strong> ใช้พื้นที่ R2 ทั้งโรงเรียนรวม{' '}
                    <strong>
                      {courseStorages.reduce((acc, c) => acc + c.r2UsedMb, 0).toFixed(2)} MB
                    </strong>{' '}
                    · โอนเก็บเข้า <strong>Google Workspace โรงเรียน (ความจุ 100 TB)</strong> แยกตาม ปีการศึกษา / เทอม / วิชา
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const res = sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                          mode: 'TERM_ALL',
                          academicTerm: '1/2569',
                        });
                        setCourseStorages(res.courses);
                        showToast(
                          `☁️➡️📁 แอดมินโอนย้ายไฟล์ทั้งเทอม 1/2569 (${res.backedUpCourseCount} วิชา · ${res.transferredMb} MB) เข้า Google Drive โรงเรียน (100 TB Workspace) สำเร็จ!`
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                      ☁️➡️📁 Backup ทั้งเทอม 1/2569 เข้า Drive รร. (100TB)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                          role: 'ADMIN',
                          currentTeacherId: 'admin',
                          mode: 'TERM_ALL',
                          academicTerm: '1/2569',
                          autoBackupToSchoolDriveFirst: true,
                        });
                        setCourseStorages(res.courses);
                        setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
                        showToast(
                          `🧹 แอดมินล้างไฟล์ R2 ทั้งภาคเรียน 1/2569 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) เรียบร้อย!`
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                    >
                      🧹 ล้าง R2 ทั้งเทอม 1/2569
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                          role: 'ADMIN',
                          currentTeacherId: 'admin',
                          mode: 'YEAR_ALL',
                          academicYear: '2569',
                          autoBackupToSchoolDriveFirst: true,
                        });
                        setCourseStorages(res.courses);
                        setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
                        showToast(
                          `🧹 แอดมินล้างไฟล์ R2 ทั้งปีการศึกษา 2569 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) เรียบร้อย!`
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                    >
                      🧹 ล้าง R2 ทั้งปีการศึกษา 2569
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ตารางแสดงสถานะพื้นที่จัดเก็บรายวิชา & รายครู + ปุ่ม Backup เข้า Google Drive 100TB & ล้างรายวิชา */}
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3">ปี/เทอม</th>
                    <th className="py-2 px-3">รหัส / รายวิชา</th>
                    <th className="py-2 px-3">ครูผู้สอน</th>
                    <th className="py-2 px-3 text-center">ไฟล์ R2 (WebP/PDF)</th>
                    <th className="py-2 px-3 text-center">ลิงก์ Canva/วิดีโอ</th>
                    <th className="py-2 px-3">สถานะ Google Drive รร. (100 TB Workspace)</th>
                    <th className="py-2 px-3 text-right">จัดการ (Backup / ล้าง R2)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseStorages
                    .filter((c) => (r2RoleMode === 'TEACHER' ? c.teacherId === 't-pasporm' : true))
                    .map((c) => (
                      <tr key={c.courseId} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {c.academicTerm}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">
                            {c.courseCode} {c.courseName} ({c.classroom})
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            📁 {c.schoolDriveFolderPath}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {c.teacherName}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {c.isPurgedFromR2 ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[11px]">
                              0 MB (ล้าง R2 แล้ว)
                            </span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {c.r2UsedMb} MB
                              </span>{' '}
                              <span className="text-[11px] text-slate-500">({c.r2FileCount} ไฟล์)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                            🎨 {c.canvaLinkCount} ลิงก์ (0 MB)
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {c.isBackedUpToSchoolDrive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                              ✓ สำรองเข้า Drive 100TB แล้ว ({c.lastBackupAt})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                              รอโอนเข้า Google Drive 100TB
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {!c.isBackedUpToSchoolDrive && !c.isPurgedFromR2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res =
                                    sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                                      mode: 'SINGLE_COURSE',
                                      courseId: c.courseId,
                                    });
                                  setCourseStorages(res.courses);
                                  showToast(
                                    `☁️➡️📁 โอนไฟล์วิชา ${c.courseCode} (${c.classroom}) เข้า Google Drive โรงเรียน (100TB) เรียบร้อยแล้ว`
                                  );
                                }}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px]"
                              >
                                Backup Drive 100TB
                              </button>
                            )}
                            {!c.isPurgedFromR2 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                                    role: r2RoleMode,
                                    currentTeacherId: 't-pasporm',
                                    mode: 'SINGLE_COURSE',
                                    courseId: c.courseId,
                                    autoBackupToSchoolDriveFirst: true,
                                  });
                                  setCourseStorages(res.courses);
                                  setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
                                  showToast(
                                    `🧹 ล้างไฟล์ R2 วิชา ${c.courseCode} (${c.classroom}) คืนพื้นที่ ${res.freedMb} MB เรียบร้อยแล้ว`
                                  );
                                }}
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px]"
                              >
                                ล้างไฟล์วิชานี้
                              </button>
                            ) : (
                              <span className="text-[11px] text-teal-700 font-semibold">
                                ✓ คืนพื้นที่แล้ว
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 1: Clean Spreadsheet Matrix Grid */}
        {viewMode === 'MATRIX_TABLE' && (
          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold shadow-2xs">
                  <th className="w-12 text-center bg-slate-50">เลขที่</th>
                  <th className="w-16 bg-slate-50">รหัส</th>
                  <th className="min-w-[175px] bg-slate-50">ชื่อ - นามสกุล</th>
                  {filteredAssignments.map((asg, idx) => (
                    <th
                      key={asg.id}
                      className="text-center min-w-[96px] border-l border-slate-200/70 bg-slate-50"
                      title={`${asg.title} (${asg.sgsUnitLabel} • กำหนดส่ง ${asg.dueDate})`}
                    >
                      <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                        <span>งาน {idx + 1}</span>
                        {asg.isRequiredForPass && (
                          <span
                            className="text-rose-600 font-bold"
                            title="งานบังคับส่ง (หากขาดส่งติด ร)"
                          >
                            *
                          </span>
                        )}
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({asg.maxScore})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[96px] mx-auto">
                        {asg.title}
                      </div>
                    </th>
                  ))}
                  <th className="text-center w-24 border-l border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    รวมเก็บ (50)
                  </th>
                  <th className="text-center w-16 bg-slate-50 text-slate-700 font-bold">
                    สถานะ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleRoster.map((stu) => {
                  const isTransferredOut =
                    stu.transferState === 'TRANSFERRED_OUT';
                  const isTransferredIn =
                    stu.transferState === 'TRANSFERRED_IN';
                  const g =
                    sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);

                  const currentRowIdx = isTransferredOut
                    ? -1
                    : ++activeRowCounter;

                  return (
                    <tr
                      key={stu.studentCode}
                      className={
                        isTransferredOut
                          ? 'bg-slate-50/70 text-slate-400'
                          : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="text-center font-medium text-slate-500 tabular-nums">
                        {stu.sgsSeatNo}
                      </td>
                      <td className="font-mono text-slate-400 tabular-nums">
                        {stu.studentCode}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-medium ${
                              isTransferredOut
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {stu.studentName}
                          </span>
                          {isTransferredOut && (
                            <span className="text-[10px] text-slate-400">
                              (ย้ายออก)
                            </span>
                          )}
                          {isTransferredIn && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                              title={stu.transferNote}
                            >
                              เข้าใหม่
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assignment Cells */}
                      {filteredAssignments.map((asg) => {
                        if (isTransferredOut) {
                          return (
                            <td
                              key={asg.id}
                              className="text-center text-slate-300 border-l border-slate-100"
                            >
                              —
                            </td>
                          );
                        }

                        const cell = getCell(stu.studentCode, asg.id);
                        const isPending = cell.status === 'SUBMITTED_PENDING';
                        const isMissing =
                          cell.status === 'MISSING' && cell.score === null;
                        const isExcused = cell.status === 'EXEMPT_TRANSFERRED';

                        if (isExcused) {
                          return (
                            <td
                              key={asg.id}
                              className="text-center border-l border-slate-100 text-[11px] text-slate-400"
                              title="ยกเว้นรายชิ้น (เทียบโอน/กรอกคะแนนสุทธิท้ายตาราง)"
                            >
                              ยกเว้น
                            </td>
                          );
                        }

                        return (
                          <td
                            key={asg.id}
                            className="text-center border-l border-slate-100 p-0.5"
                          >
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={asg.maxScore}
                                data-grid-col={asg.id}
                                data-grid-row={currentRowIdx}
                                placeholder={isPending ? 'รอตรวจ' : '—'}
                                value={cell.score === null ? '' : cell.score}
                                onKeyDown={(e) =>
                                  handleCellKeyDown(e, currentRowIdx, asg.id)
                                }
                                onChange={(e) =>
                                  handleScoreInput(
                                    stu.studentCode,
                                    asg.id,
                                    e.target.value,
                                    asg.maxScore
                                  )
                                }
                                className={`w-12 h-6 text-center rounded text-xs tabular-nums transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                  isPending
                                    ? 'bg-amber-50 border border-amber-300 text-amber-900 font-semibold placeholder:text-amber-600 placeholder:text-[10px]'
                                    : isMissing
                                    ? 'bg-transparent hover:bg-slate-100 focus:bg-white text-slate-400 placeholder:text-rose-300'
                                    : 'bg-transparent hover:bg-slate-100 focus:bg-white text-slate-900 font-semibold'
                                }`}
                                title="พิมพ์คะแนนแล้วกด Enter หรือ ↓ เพื่อลงบรรทัดถัดไป"
                              />
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleScoreInput(
                                      stu.studentCode,
                                      asg.id,
                                      String(asg.maxScore),
                                      asg.maxScore
                                    )
                                  }
                                  className="px-1 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold leading-none"
                                  title={`คลิกเพื่อให้คะแนนเต็ม ${asg.maxScore}`}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Net Accumulated Score (50) — Editable Override */}
                      <td className="text-center border-l border-slate-200 bg-slate-50/60">
                        {isTransferredOut ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={50}
                              data-grid-col="net-accumulated"
                              data-grid-row={currentRowIdx}
                              value={g.effectiveAccumulated}
                              onKeyDown={(e) =>
                                handleCellKeyDown(
                                  e,
                                  currentRowIdx,
                                  'net-accumulated'
                                )
                              }
                              onChange={(e) => {
                                const val =
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value);
                                setRoster([
                                  ...sgsRosterAndSubmissionService.updateStudentManualAccumulatedScore(
                                    stu.studentCode,
                                    val
                                  ),
                                ]);
                              }}
                              className={`w-12 h-6 text-center rounded text-xs font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                g.isManualOverride
                                  ? 'bg-amber-50/80 text-amber-900 border border-amber-300'
                                  : 'bg-transparent hover:bg-white text-slate-800 border border-transparent hover:border-slate-200'
                              }`}
                              title="คะแนนเก็บสุทธิ (เต็ม 50) • พิมพ์ทับได้แล้วกด Enter เพื่อเลื่อนลง"
                            />
                            {g.isManualOverride && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRoster([
                                    ...sgsRosterAndSubmissionService.updateStudentManualAccumulatedScore(
                                      stu.studentCode,
                                      null
                                    ),
                                  ])
                                }
                                className="text-[10px] text-slate-400 hover:text-slate-700"
                                title={`คืนค่าตามชิ้นงาน (${g.calculatedAccumulated})`}
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        {isTransferredOut ? (
                          <span className="text-slate-300">—</span>
                        ) : g.gradeLabel === 'ร' ? (
                          <span
                            className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[11px]"
                            title={`ค้างงานสำคัญ: ${g.missingMandatoryTitles.join(', ')}`}
                          >
                            ติด ร
                          </span>
                        ) : g.missingCount > 0 ? (
                          <span className="text-rose-600 font-medium text-[11px]">
                            ค้าง {g.missingCount}
                          </span>
                        ) : (
                          <span className="text-teal-600 font-medium text-[11px]">
                            ครบ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: SpeedGrader (ตรวจรายชิ้น) */}
        {viewMode === 'SPEED_GRADER' && selectedAssignment && currentStudent && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/40">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => {
                    setSelectedAssignmentId(e.target.value);
                    setActiveStudentIndex(0);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900"
                >
                  {assignments.map((a, idx) => (
                    <option key={a.id} value={a.id}>
                      งานที่ {idx + 1}: {a.title} (เต็ม {a.maxScore})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleBatchGradePending(
                    selectedAssignment.id,
                    selectedAssignment.maxScore
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                ให้คะแนนเต็ม ({selectedAssignment.maxScore}) คนที่ส่งแล้วทั้งหมด
              </button>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                {activeRosterOnly.map((stu, idx) => {
                  const cell = getCell(stu.studentCode, selectedAssignment.id);
                  const isSelected = idx === activeStudentIndex;
                  return (
                    <button
                      key={stu.studentCode}
                      type="button"
                      onClick={() => setActiveStudentIndex(idx)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-teal-50 font-bold text-teal-950'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">
                        {stu.sgsSeatNo}. {stu.studentName}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {cell.score !== null ? (
                          <span className="text-teal-700">{cell.score}</span>
                        ) : cell.status === 'SUBMITTED_PENDING' ? (
                          <span className="text-amber-600">รอตรวจ</span>
                        ) : (
                          <span className="text-rose-500">ยังไม่ส่ง</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    เลขที่ {currentStudent.sgsSeatNo} • {currentStudent.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedAssignment.title} (เต็ม {selectedAssignment.maxScore} คะแนน)
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeStudentIndex <= 0}
                    onClick={() =>
                      setActiveStudentIndex((i) => Math.max(0, i - 1))
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500 px-2 tabular-nums">
                    {activeStudentIndex + 1} / {activeRosterOnly.length}
                  </span>
                  <button
                    type="button"
                    disabled={activeStudentIndex >= activeRosterOnly.length - 1}
                    onClick={() =>
                      setActiveStudentIndex((i) =>
                        Math.min(activeRosterOnly.length - 1, i + 1)
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                {(() => {
                  const c = getCell(
                    currentStudent.studentCode,
                    selectedAssignment.id
                  );
                  if (c.status === 'MISSING') {
                    return 'นักเรียนยังไม่ได้ส่งไฟล์ชิ้นงานนี้ (ครูสามารถกรอกคะแนนจากการตรวจสมุดจริงด้านล่างได้ทันที)';
                  }
                  return `ส่งงานเมื่อ ${c.submittedAt || '14 ส.ค. 69'} • ไฟล์แนบ: ${currentStudent.studentCode}_${selectedAssignment.id}.jpg`;
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    selectedAssignment.maxScore,
                    Math.round(selectedAssignment.maxScore * 0.9),
                    Math.round(selectedAssignment.maxScore * 0.8),
                    Math.round(selectedAssignment.maxScore * 0.7),
                    Math.round(selectedAssignment.maxScore * 0.5),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        handleScoreInput(
                          currentStudent.studentCode,
                          selectedAssignment.id,
                          String(preset),
                          selectedAssignment.maxScore
                        );
                        if (activeStudentIndex < activeRosterOnly.length - 1) {
                          setActiveStudentIndex((i) => i + 1);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-800 font-bold text-xs transition-colors"
                    >
                      ให้ {preset} คะแนน ➔
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">กรอกเอง:</span>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment.maxScore}
                    value={
                      getCell(currentStudent.studentCode, selectedAssignment.id)
                        .score ?? ''
                    }
                    onChange={(e) =>
                      handleScoreInput(
                        currentStudent.studentCode,
                        selectedAssignment.id,
                        e.target.value,
                        selectedAssignment.maxScore
                      )
                    }
                    className="w-16 h-8 text-center font-bold rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create New Assignment */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAssignment}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-xl text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">
              สั่งงาน / ชิ้นงานใหม่
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อชิ้นงาน
              </label>
              <input
                type="text"
                required
                placeholder="เช่น วาดภาพทิวทัศน์สีน้ำ"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หน่วยการเรียนรู้ SGS
                </label>
                <select
                  value={newUnit}
                  onChange={(e) =>
                    setNewUnit(e.target.value as 'u1' | 'u2' | 'u3')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="u1">หน่วยที่ 1 (15 คะแนน)</option>
                  <option value="u2">หน่วยที่ 2 (20 คะแนน)</option>
                  <option value="u3">หน่วยที่ 3 (15 คะแนน)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  คะแนนเต็ม
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newMaxScore}
                  onChange={(e) => setNewMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                กำหนดส่ง
              </label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsMandatory}
                onChange={(e) => setNewIsMandatory(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <span className="font-medium text-slate-700">
                เป็นงานบังคับส่ง (หากไม่ส่งจะขึ้นสถานะ ติด ร)
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
