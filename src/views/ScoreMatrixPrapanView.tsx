import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Layers,
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  matchSubmissionToAssignment,
  type TermAssignmentConfig,
  type SgsStudentRecord,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';
import {
  getDynamicTeachingSubjects,
  getAllAvailableClassroomLabels,
} from '../services/teacherCourseAssignmentService';
import type { TeacherViewKey } from '../components/layout/TeacherSidebar';

interface ScoreMatrixPrapanViewProps {
  onNavigate?: (view: TeacherViewKey) => void;
  initialSubjectCode?: string;
  initialRoom?: string;
}

export const ScoreMatrixPrapanView: React.FC<ScoreMatrixPrapanViewProps> = ({
  onNavigate,
  initialSubjectCode,
  initialRoom,
}) => {
  const subjectsList = useMemo(() => getDynamicTeachingSubjects(), []);
  const availableFilterRooms = useMemo(() => getAllAvailableClassroomLabels(), []);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    initialSubjectCode || subjectsList[0]?.courseCode || 'ALL'
  );
  const [selectedRoom, setSelectedRoom] = useState<string>(
    initialRoom || availableFilterRooms[0] || 'ม.3/1'
  );
  const [matrixPartFilter, setMatrixPartFilter] = useState<'ALL' | 'PRE_MIDTERM' | 'POST_MIDTERM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedStudentCodes, setExpandedStudentCodes] = useState<Set<string>>(new Set());

  const toggleStudentExpand = (code: string) => {
    setExpandedStudentCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const matrixClassroom = useMemo(() => {
    if (selectedRoom !== 'ALL') return selectedRoom;
    return availableFilterRooms[0] || 'ม.3/1';
  }, [selectedRoom, availableFilterRooms]);

  // Students in class
  const [matrixStudents, setMatrixStudents] = useState<SgsStudentRecord[]>([]);

  const refreshMatrixStudents = useCallback(() => {
    const list = sgsRosterAndSubmissionService.getSgsRoster(matrixClassroom);
    setMatrixStudents(
      list
        .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
        .sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999))
    );
  }, [matrixClassroom]);

  useEffect(() => {
    refreshMatrixStudents();
  }, [refreshMatrixStudents]);

  // Course Weights
  const matrixCourseWeights = useMemo(
    () =>
      sgsRosterAndSubmissionService.getCourseWeights(
        selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode
      ),
    [selectedSubjectCode]
  );

  // Term Assignments
  const [termAssignments, setTermAssignments] = useState<TermAssignmentConfig[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );

  const refreshTermAssignments = useCallback(() => {
    setTermAssignments(sgsRosterAndSubmissionService.getTermAssignments());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refreshTermAssignments();
      refreshMatrixStudents();
    };
    window.addEventListener('kp-sgs-roster-updated', handleUpdate);
    window.addEventListener('kp-grading-queue-updated', handleUpdate);
    window.addEventListener('kps-data-sync-event', handleUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
      window.removeEventListener('kp-grading-queue-updated', handleUpdate);
      window.removeEventListener('kps-data-sync-event', handleUpdate);
    };
  }, [refreshTermAssignments, refreshMatrixStudents]);

  const matrixAssignmentsRaw = useMemo(() => {
    const code = selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode;
    return sgsRosterAndSubmissionService.getTermAssignments(code, matrixClassroom);
  }, [selectedSubjectCode, matrixClassroom, termAssignments]);

  const matrixAssignments = useMemo(() => {
    if (matrixPartFilter === 'ALL') return matrixAssignmentsRaw;
    if (matrixPartFilter === 'PRE_MIDTERM') {
      return matrixAssignmentsRaw.filter(
        (a) => !a.scorePart || a.scorePart === 'PRE_MIDTERM'
      );
    }
    if (matrixPartFilter === 'POST_MIDTERM') {
      return matrixAssignmentsRaw.filter(
        (a) => a.scorePart === 'POST_MIDTERM' || a.scorePart === 'FINAL'
      );
    }
    return matrixAssignmentsRaw;
  }, [matrixAssignmentsRaw, matrixPartFilter]);

  const allSubmissions = useMemo(() => {
    return sgsRosterAndSubmissionService.getSubmissions();
  }, [termAssignments]);

  // Group into units & standalone
  const matrixUnits = useMemo(() => {
    const unitMap = new Map<
      string,
      {
        id: string;
        title: string;
        maxScore: number;
        totalTasks: number;
        scoringMethod: string;
        assignments: TermAssignmentConfig[];
      }
    >();

    const independentList: TermAssignmentConfig[] = [];

    matrixAssignments.forEach((assign) => {
      const isUnit = Boolean(
        assign.unitTitle ||
          (assign.scoringMethod && assign.scoringMethod !== 'DIRECT_SCORE')
      );

      if (isUnit && assign.unitTitle) {
        const uKey = assign.unitId || assign.unitTitle;
        const existing = unitMap.get(uKey) || {
          id: uKey,
          title: assign.unitTitle,
          maxScore: assign.unitMaxScore ?? 10,
          totalTasks: assign.totalTasksInUnit ?? 1,
          scoringMethod: assign.scoringMethod || 'DIRECT_SCORE',
          assignments: [],
        };
        existing.assignments.push(assign);
        unitMap.set(uKey, existing);
      } else {
        independentList.push(assign);
      }
    });

    return {
      unitList: Array.from(unitMap.values()),
      independentList,
    };
  }, [matrixAssignments]);

  // Filtered Students (Search)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return matrixStudents;
    const q = searchQuery.toLowerCase();
    return matrixStudents.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentCode.includes(q) ||
        String(s.sgsSeatNo ?? s.no ?? '').includes(q)
    );
  }, [matrixStudents, searchQuery]);

  // Inline Cell Editing
  const [editingCell, setEditingCell] = useState<{
    studentCode: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    maxScore: number;
    currentScore: number | null;
  } | null>(null);

  const [inlineScoreInput, setInlineScoreInput] = useState<string>('');

  const handleOpenInlineEdit = (
    studentCode: string,
    studentName: string,
    assign: TermAssignmentConfig,
    currentScore: number | null
  ) => {
    setEditingCell({
      studentCode,
      studentName,
      assignmentId: assign.id,
      assignmentTitle: assign.title,
      maxScore: assign.maxScore,
      currentScore,
    });
    setInlineScoreInput(currentScore !== null ? String(currentScore) : '');
  };

  const handleSaveInlineScore = () => {
    if (!editingCell) return;
    const num = inlineScoreInput.trim() === '' ? null : Number(inlineScoreInput);
    if (num !== null && (isNaN(num) || num < 0 || num > editingCell.maxScore)) {
      showToast(`⚠️ กรุณาระบุคะแนนระหว่าง 0 ถึง ${editingCell.maxScore}`);
      return;
    }

    sgsRosterAndSubmissionService.gradeSubmission(
      editingCell.assignmentId,
      editingCell.studentCode,
      num,
      num === null ? 'MISSING' : 'GRADED'
    );

    showToast(`✓ บันทึกคะแนนของ ${editingCell.studentName} เรียบร้อยแล้ว`);
    setEditingCell(null);
  };

  const matchSubmissionForStudent = (
    stuSubs: StudentWorkSubmission[],
    assign: TermAssignmentConfig
  ) => {
    return (
      stuSubs.find((s) => s.assignmentId === assign.id) ||
      stuSubs.find((s) => matchSubmissionToAssignment(s, assign))
    );
  };

  // Helper สำหรับคำนวณคะแนนนักเรียนรายคนอย่างถูกต้อง ไม่บวกซ้ำซ้อน
  const calculateStudentMatrixScores = (stuSubs: StudentWorkSubmission[]) => {
    let preMidtermEarned = 0;
    let grandTotalEarned = 0;
    const unitScoreMap = new Map<string, number>();

    // 1. คำนวณคะแนนรายหน่วย (ตามสัดส่วน unitMaxScore ไม่ใช่บวกผลรวมดิบทุกงานย่อยให้พุ่งเกินจริง)
    matrixUnits.unitList.forEach((u) => {
      let submittedInUnit = 0;
      let rawEarnedInUnit = 0;
      let rawMaxInUnit = 0;
      const seenSubmissionKeys = new Set<string>();

      u.assignments.forEach((assign) => {
        const sub = matchSubmissionForStudent(stuSubs, assign);
        if (sub && sub.status !== 'MISSING') {
          const subKey = sub.id || `${sub.assignmentId}_${sub.studentCode}`;
          if (!seenSubmissionKeys.has(subKey)) {
            seenSubmissionKeys.add(subKey);
            submittedInUnit += 1;
            if (typeof sub.score === 'number') {
              rawEarnedInUnit += sub.score;
            }
          }
        }
        rawMaxInUnit += assign.maxScore || 10;
      });

      let calculatedScore = 0;
      if (u.scoringMethod === 'SUBMISSION_COUNT_RATIO') {
        const totalTasks = u.totalTasks > 0 ? u.totalTasks : u.assignments.length;
        const clamped = Math.min(totalTasks, Math.max(0, submittedInUnit));
        const raw = totalTasks > 0 ? (clamped / totalTasks) * u.maxScore : 0;
        calculatedScore = Math.round(raw * 10) / 10;
      } else if (u.scoringMethod === 'RAW_SCORE_AVERAGE') {
        const ratio = rawMaxInUnit > 0 ? rawEarnedInUnit / rawMaxInUnit : 0;
        calculatedScore = Math.round(ratio * u.maxScore * 10) / 10;
      } else {
        calculatedScore = Math.min(u.maxScore, rawEarnedInUnit);
      }

      unitScoreMap.set(u.id, calculatedScore);
      grandTotalEarned += calculatedScore;

      // ตรวจสอบว่าหน่วยนี้จัดอยู่ในช่วงคะแนนก่อนกลางภาคหรือไม่
      const firstTask = u.assignments[0];
      const part = firstTask?.scorePart || (firstTask?.sgsUnit === 'u1' ? 'PRE_MIDTERM' : 'POST_MIDTERM');
      if (part === 'PRE_MIDTERM') {
        preMidtermEarned += calculatedScore;
      }
    });

    // 2. คำนวณชิ้นงานเดี่ยวปกติ
    matrixUnits.independentList.forEach((assign) => {
      const sub = matchSubmissionForStudent(stuSubs, assign);
      if (sub && typeof sub.score === 'number') {
        grandTotalEarned += sub.score;
        if (!assign.scorePart || assign.scorePart === 'PRE_MIDTERM') {
          preMidtermEarned += sub.score;
        }
      }
    });

    return {
      preMidtermEarned: Math.round(preMidtermEarned * 10) / 10,
      allEarned: Math.round(grandTotalEarned * 10) / 10,
      unitScoreMap,
    };
  };

  const handleBulkGradeClassroom = () => {
    if (
      !confirm(
        `คุณต้องการให้คะแนนเต็มกับนักเรียนทุกคนที่ส่งงานแล้วในห้อง ${matrixClassroom} ใช่หรือไม่?`
      )
    ) {
      return;
    }

    let count = 0;
    const updated = allSubmissions.map((s) => {
      const matchStu = matrixStudents.some((st) => st.studentCode === s.studentCode);
      const matchAsg = matrixAssignments.find((a) => a.id === s.assignmentId);
      if (matchStu && matchAsg && (s.status === 'SUBMITTED_PENDING' || s.score === null)) {
        count++;
        return {
          ...s,
          score: matchAsg.maxScore,
          status: 'GRADED' as const,
        };
      }
      return s;
    });

    sgsRosterAndSubmissionService.saveSubmissions(updated);
    showToast(`🎉 ให้คะแนนเต็มเรียบร้อยแล้ว ${count} รายการ`);
  };

  const handleExportMatrixCsv = () => {
    const headers = [
      'เลขที่',
      'รหัสประจำตัว',
      'ชื่อ-นามสกุล',
      ...matrixAssignments.map((a) => `${a.title} (เต็ม ${a.maxScore})`),
      `คะแนนรวมก่อนกลางภาค (เต็ม ${matrixCourseWeights.preMidterm})`,
      'คะแนนรวมทุกงาน',
    ];

    const rows = matrixStudents.map((stu) => {
      const stuSubs = allSubmissions.filter((s) => s.studentCode === stu.studentCode);
      const assignScores = matrixAssignments.map((a) => {
        const sub = stuSubs.find((s) => s.assignmentId === a.id);
        return sub && typeof sub.score === 'number' ? sub.score : 0;
      });

      const { preMidtermEarned, allEarned } = calculateStudentMatrixScores(stuSubs);

      return [
        stu.sgsSeatNo ?? stu.no ?? '',
        stu.studentCode,
        stu.studentName,
        ...assignScores,
        preMidtermEarned,
        allEarned,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `ตารางแจกแจงคะแนน_ปพ5_${selectedSubjectCode}_ห้อง${matrixClassroom}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ ดาวน์โหลดไฟล์ตารางแจกแจงคะแนนสำเร็จ');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 font-sans animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#163A66] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slide-in">
          <Sparkles className="w-4 h-4 text-[#BFDBFE]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Page Header with Quick View Switchers */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#163A66] tracking-tight">
                สมุดบันทึกคะแนน ปพ.5 (Gradebook Matrix)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                ห้อง {matrixClassroom} • {filteredStudents.length} นักเรียน
              </span>
            </div>
            <p className="text-xs text-[#6B7C93] mt-0.5">
              ตารางแจกแจงคะแนนตามงานและตัวชี้วัด เชื่อมต่อ SGS และระบบปลด "ร" อัตโนมัติเมื่อส่งงานครบ
            </p>
          </div>
        </div>

        {/* Quick View Switcher Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('grading-queue')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-blue-50 text-[#163A66] hover:text-[#3B82F6] border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
                <span>คิวตรวจงาน</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-blue-50 text-[#163A66] hover:text-[#3B82F6] border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#3B82F6]" />
                <span>การสั่งงาน / ภาระงาน</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportMatrixCsv}
            className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกตาราง (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Context & Filters Bar */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Filter 1: รายวิชา */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">รายวิชา</label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกรายวิชา</option>
              {subjectsList.map((s) => (
                <option key={s.courseCode} value={s.courseCode}>
                  {s.courseCode} {s.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: ห้องเรียน */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">ห้องเรียน</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {availableFilterRooms.map((r) => (
                <option key={r} value={r}>
                  ห้อง {r}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">ค้นหานักเรียน</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, เลขที่ หรือรหัสนักเรียน..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          </div>
        </div>

        {/* Sub-Filter: ส่วนคะแนน 4 ส่วน */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#163A66] px-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>แสดงหมวดคะแนน:</span>
            </span>
            <button
              type="button"
              onClick={() => setMatrixPartFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixPartFilter === 'ALL'
                  ? 'bg-white text-[#163A66] shadow-xs border border-slate-200'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              ทุกหมวดงาน ({matrixAssignmentsRaw.length})
            </button>
            <button
              type="button"
              onClick={() => setMatrixPartFilter('PRE_MIDTERM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                matrixPartFilter === 'PRE_MIDTERM'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#3B82F6] bg-blue-50/70 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span>📘 เจาะจงคะแนนก่อนกลางภาค</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  matrixPartFilter === 'PRE_MIDTERM' ? 'bg-white/25 text-white' : 'bg-blue-200 text-blue-900'
                }`}
              >
                เต็ม {matrixCourseWeights.preMidterm}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMatrixPartFilter('POST_MIDTERM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixPartFilter === 'POST_MIDTERM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[#6B7C93] hover:text-indigo-700'
              }`}
            >
              หลังกลางภาค
            </button>
          </div>

          <button
            type="button"
            onClick={handleBulkGradeClassroom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ให้คะแนนเต็มทุกคนที่ส่งงานแล้ว</span>
          </button>
        </div>
      </div>

      {/* 3. The Score Breakdown Matrix Table */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-2">
            <BookOpen className="w-8 h-8 text-[#3B82F6] mx-auto opacity-70" />
            <p className="text-sm font-bold text-[#163A66]">ไม่พบรายชื่อนักเรียนในห้อง {matrixClassroom}</p>
            <p className="text-xs text-[#6B7C93]">กรุณาเลือกห้องเรียนอื่นในตัวกรองด้านบน</p>
          </div>
        ) : matrixAssignments.length === 0 ? (
          <div className="py-12 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-2">
            <BookOpen className="w-8 h-8 text-[#3B82F6] mx-auto opacity-70" />
            <p className="text-sm font-bold text-[#163A66]">ยังไม่มีชิ้นงานที่มอบหมายในห้อง {matrixClassroom}</p>
            <p className="text-xs text-[#6B7C93]">กดปุ่มด้านล่างเพื่อสั่งงานหรือสร้างหน่วยการเรียนรู้</p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>ไปหน้าสั่งงานใหม่</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Stacked Card View (Pillar 8 & 9 - Zero Horizontal Scroll) */}
            <div className="block md:hidden space-y-3">
              {filteredStudents.map((stu, sIdx) => {
                const stuSubs = allSubmissions.filter((s) => s.studentCode === stu.studentCode);
                const { preMidtermEarned, allEarned } = calculateStudentMatrixScores(stuSubs);

                const isExpanded = expandedStudentCodes.has(stu.studentCode);

                return (
                  <div
                    key={`mobile-stu-${stu.studentCode}`}
                    className="bg-white rounded-2xl border border-[#E6EEF7] shadow-2xs p-3.5 space-y-2.5 transition-all"
                  >
                    {/* Header: Identity + Total Chips */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          {stu.sgsSeatNo ?? stu.no ?? sIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#163A66] truncate">
                            {stu.studentName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {stu.studentCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-medium">รวมทุกงาน</div>
                          <div className="text-xs font-extrabold text-[#92400E] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {allEarned}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-midterm score badge */}
                    <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-2.5 py-1.5 text-[11px]">
                      <span className="text-[#6B7C93] font-medium">
                        ก่อนกลางภาค (เต็ม {matrixCourseWeights.preMidterm}):
                      </span>
                      <span className="font-bold text-blue-700">
                        {preMidtermEarned} คะแนน
                      </span>
                    </div>

                    {/* Expand/Collapse Toggle Button (min 44px touch target) */}
                    <button
                      type="button"
                      onClick={() => toggleStudentExpand(stu.studentCode)}
                      className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
                    >
                      <span>
                        {isExpanded
                          ? 'ซ่อนคะแนนรายชิ้น'
                          : `ดูคะแนนรายชิ้น (${matrixAssignments.length} ชิ้น)`}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Expandable Assignment List with Tap-to-Edit */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-2 animate-fade-in">
                        <p className="text-[10px] text-slate-400 font-medium">
                          แตะที่แถบชิ้นงานเพื่อบันทึกหรือแก้ไขคะแนน:
                        </p>
                        {matrixAssignments.map((assign) => {
                          const sub = matchSubmissionForStudent(stuSubs, assign);
                          const hasScore =
                            sub && sub.score !== null && sub.score !== undefined;

                          return (
                            <button
                              key={`mob-asg-${assign.id}`}
                              type="button"
                              onClick={() =>
                                handleOpenInlineEdit(
                                  stu.studentCode,
                                  stu.studentName,
                                  assign,
                                  hasScore && typeof sub.score === 'number' ? sub.score : null
                                )
                              }
                              className={`w-full min-h-[44px] p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                                hasScore
                                  ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                                  : sub?.status === 'SUBMITTED_PENDING'
                                  ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="text-xs font-bold text-[#163A66] truncate">
                                  {assign.title}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {assign.sgsUnitLabel || 'ก่อนกลางภาค'} • เต็ม {assign.maxScore} คะแนน
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                {hasScore ? (
                                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                                    {sub.score} / {assign.maxScore}
                                  </span>
                                ) : sub?.status === 'SUBMITTED_PENDING' ? (
                                  <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1">
                                    ⏳ รอตรวจ
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-500 font-bold text-xs">
                                    ยังไม่มีคะแนน
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-[#E6EEF7] rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                {/* Header Row 1: Groups */}
                <tr className="bg-[#F2F7FC] text-[#163A66] border-b border-[#E6EEF7]">
                  <th className="p-2.5 font-bold sticky left-0 bg-[#F2F7FC] z-20 w-12 text-center border-r border-[#E6EEF7]">
                    เลขที่
                  </th>
                  <th className="p-2.5 font-bold sticky left-12 bg-[#F2F7FC] z-20 w-24 border-r border-[#E6EEF7]">
                    รหัส
                  </th>
                  <th className="p-2.5 font-bold sticky left-36 bg-[#F2F7FC] z-20 w-48 border-r border-[#E6EEF7]">
                    ชื่อ-สกุล
                  </th>

                  {/* Units Groups */}
                  {matrixUnits.unitList.map((u) => (
                    <th
                      key={u.id}
                      colSpan={u.assignments.length + 1}
                      className="p-2.5 font-bold text-center border-r border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>{u.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#1D4ED8] border border-[#BFDBFE]">
                          เต็ม {u.maxScore} คะแนน • {u.totalTasks} งาน
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Independent Tasks */}
                  {matrixUnits.independentList.length > 0 && (
                    <th
                      colSpan={matrixUnits.independentList.length}
                      className="p-2.5 font-bold text-center border-r border-[#E6EEF7] bg-slate-100 text-[#163A66]"
                    >
                      ชิ้นงานเดี่ยวปกติ ({matrixUnits.independentList.length} ชิ้น)
                    </th>
                  )}

                  {/* Pre-Midterm Column Header */}
                  <th className="p-2.5 font-bold text-center bg-blue-100 text-blue-900 border-r border-blue-200 w-28">
                    <div className="flex flex-col items-center justify-center">
                      <span>รวมก่อนกลางภาค</span>
                      <span className="text-[10px] text-blue-700 font-semibold">
                        (เต็ม {matrixCourseWeights.preMidterm})
                      </span>
                    </div>
                  </th>

                  {/* Grand Total */}
                  <th className="p-2.5 font-bold text-center bg-[#FEF3C7] text-[#92400E] w-24">
                    รวมทุกงาน
                  </th>
                </tr>

                {/* Header Row 2: Columns */}
                <tr className="bg-[#F8FAFC] text-[#6B7C93] border-b border-[#E6EEF7] text-[11px]">
                  <th className="p-2 sticky left-0 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7] text-center">-</th>
                  <th className="p-2 sticky left-12 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7] text-center">-</th>
                  <th className="p-2 sticky left-36 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7]">นักเรียน</th>

                  {/* Unit assignments + unit summary */}
                  {matrixUnits.unitList.map((u) => (
                    <React.Fragment key={`sub-${u.id}`}>
                      {u.assignments.map((assign) => (
                        <th
                          key={assign.id}
                          className="p-2 text-center border-r border-slate-200 min-w-[90px] font-medium"
                          title={assign.title}
                        >
                          <div className="truncate max-w-[120px] mx-auto font-bold text-[#163A66]">
                            {assign.title}
                          </div>
                          <span className="text-[10px] text-slate-400">เต็ม {assign.maxScore}</span>
                        </th>
                      ))}
                      <th className="p-2 text-center border-r border-[#BFDBFE] bg-blue-50/80 text-blue-800 min-w-[85px] font-bold">
                        รวมหน่วย
                      </th>
                    </React.Fragment>
                  ))}

                  {/* Independent columns */}
                  {matrixUnits.independentList.map((assign) => (
                    <th
                      key={assign.id}
                      className="p-2 text-center border-r border-slate-200 min-w-[90px] font-medium"
                      title={assign.title}
                    >
                      <div className="truncate max-w-[120px] mx-auto font-bold text-[#163A66]">
                        {assign.title}
                      </div>
                      <span className="text-[10px] text-slate-400">เต็ม {assign.maxScore}</span>
                    </th>
                  ))}

                  <th className="p-2 text-center bg-blue-50 text-blue-900 border-r border-blue-200 font-bold">-</th>
                  <th className="p-2 text-center bg-amber-50 text-amber-900 font-bold">-</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu, sIdx) => {
                  const stuSubs = allSubmissions.filter((s) => s.studentCode === stu.studentCode);
                  const { preMidtermEarned, allEarned, unitScoreMap } = calculateStudentMatrixScores(stuSubs);

                  return (
                    <tr key={stu.studentCode} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {stu.sgsSeatNo ?? stu.no ?? sIdx + 1}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 sticky left-12 bg-white z-10 border-r border-slate-100">
                        {stu.studentCode}
                      </td>
                      <td className="p-2.5 font-bold text-[#163A66] sticky left-36 bg-white z-10 border-r border-slate-100 truncate max-w-[180px]">
                        {stu.studentName}
                      </td>

                      {/* Units */}
                      {matrixUnits.unitList.map((u) => {
                        const unitCalculatedScore = unitScoreMap.get(u.id) ?? 0;
                        return (
                          <React.Fragment key={`cell-u-${u.id}`}>
                            {u.assignments.map((assign) => {
                              const sub = matchSubmissionForStudent(stuSubs, assign);
                              const hasScore = sub && sub.score !== null && sub.score !== undefined;

                              return (
                                <td
                                  key={assign.id}
                                  onClick={() =>
                                    handleOpenInlineEdit(
                                      stu.studentCode,
                                      stu.studentName,
                                      assign,
                                      hasScore && typeof sub.score === 'number' ? sub.score : null
                                    )
                                  }
                                  className={`p-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                                    hasScore
                                      ? 'text-emerald-700 font-bold bg-emerald-50/30'
                                      : sub?.status === 'SUBMITTED_PENDING'
                                      ? 'text-amber-700 font-bold bg-amber-50/40'
                                      : 'text-slate-300'
                                  }`}
                                  title="คลิกเพื่อตรวจ/แก้ไขคะแนน"
                                >
                                  {hasScore ? sub.score : sub?.status === 'SUBMITTED_PENDING' ? '⏳' : '-'}
                                </td>
                              );
                            })}
                            <td className="p-2 text-center border-r border-[#BFDBFE] bg-blue-50/40 font-bold text-blue-900">
                              {unitCalculatedScore}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Independent Tasks */}
                      {matrixUnits.independentList.map((assign) => {
                        const sub = matchSubmissionForStudent(stuSubs, assign);
                        const hasScore = sub && sub.score !== null && sub.score !== undefined;

                        return (
                          <td
                            key={assign.id}
                            onClick={() =>
                              handleOpenInlineEdit(
                                stu.studentCode,
                                stu.studentName,
                                assign,
                                hasScore && typeof sub.score === 'number' ? sub.score : null
                              )
                            }
                            className={`p-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                              hasScore
                                ? 'text-emerald-700 font-bold bg-emerald-50/30'
                                : sub?.status === 'SUBMITTED_PENDING'
                                ? 'text-amber-700 font-bold bg-amber-50/40'
                                : 'text-slate-300'
                            }`}
                            title="คลิกเพื่อตรวจ/แก้ไขคะแนน"
                          >
                            {hasScore ? sub.score : sub?.status === 'SUBMITTED_PENDING' ? '⏳' : '-'}
                          </td>
                        );
                      })}

                      {/* Pre-Midterm Summary */}
                      <td className="p-2.5 text-center font-extrabold text-blue-800 bg-blue-50/50 border-r border-blue-200">
                        {preMidtermEarned}
                      </td>

                      {/* Grand Total */}
                      <td className="p-2.5 text-center font-extrabold text-amber-900 bg-amber-50/40">
                        {allEarned}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>

      {/* 4. Quick Inline Score Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div>
              <h3 className="text-sm font-bold text-[#163A66]">บันทึกคะแนนรายคน (Quick Grade)</h3>
              <p className="text-xs text-[#6B7C93] mt-0.5">
                {editingCell.studentName} ({editingCell.studentCode})
              </p>
              <p className="text-xs font-semibold text-[#3B82F6] mt-1 truncate">
                {editingCell.assignmentTitle} (คะแนนเต็ม {editingCell.maxScore})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คะแนนที่ได้ (0 - {editingCell.maxScore}):
              </label>
              <input
                type="number"
                min={0}
                max={editingCell.maxScore}
                step="any"
                autoFocus
                value={inlineScoreInput}
                onChange={(e) => setInlineScoreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveInlineScore();
                  if (e.key === 'Escape') setEditingCell(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                placeholder="เว้นว่าง = ยังไม่ส่ง"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveInlineScore}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                บันทึกคะแนน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
