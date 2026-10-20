import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Download,
  Zap,
  HelpCircle,
  X,
  Search,
  AlertTriangle,
  Users,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { studentService, formatClassroomLabel } from '../services/studentService';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type CourseScoreWeights,
} from '../services/sgsRosterAndSubmissionService';
import {
  getDynamicTeachingSubjects,
  getAllAvailableClassroomLabels,
  type TeachingSubjectInfo,
} from '../services/teacherCourseAssignmentService';
import { cleanSlateService } from '../services/cleanSlateService';
import { teacherCopilotService } from '../services/teacherCopilotService';

export interface EndTermReadinessViewProps {
  onNavigateToAssignments?: () => void;
}

export interface StudentWithGrades {
  stu: SgsStudentRecord;
  classroomLabel: string;
  weights: CourseScoreWeights;
  preMidterm: number | '';
  midterm: number | '';
  postMidterm: number | '';
  final: number | '';
  total: number;
  gradeLabel: string;
  numericGrade: number;
  analyticalThinkingLevel: 0 | 1 | 2 | 3;
  desiredCharacteristicsLevel: 0 | 1 | 2 | 3;
  missingParts: string[];
  isAtRisk: boolean;
  isReady: boolean;
}

function downloadCsvBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const EndTermReadinessView: React.FC<EndTermReadinessViewProps> = ({
  onNavigateToAssignments,
}) => {
  // 1. Dynamic subjects from curriculum service
  const subjects = useMemo(() => getDynamicTeachingSubjects(), []);
  const allClassroomLabels = useMemo(() => getAllAvailableClassroomLabels(), []);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(() => {
    return subjects[0]?.code || '';
  });

  const currentSubject: TeachingSubjectInfo | undefined = useMemo(() => {
    return subjects.find((s) => s.code === selectedSubjectCode) || subjects[0];
  }, [subjects, selectedSubjectCode]);

  const availableClassrooms = useMemo(() => {
    if (currentSubject?.classrooms && currentSubject.classrooms.length > 0) {
      return currentSubject.classrooms;
    }
    return allClassroomLabels;
  }, [currentSubject, allClassroomLabels]);

  const [selectedClassroom, setSelectedClassroom] = useState<string>('ALL');

  // If subject changes and selected classroom is not available, reset to 'ALL'
  useEffect(() => {
    if (selectedClassroom !== 'ALL' && !availableClassrooms.includes(selectedClassroom)) {
      setSelectedClassroom(availableClassrooms[0] || 'ALL');
    }
  }, [selectedSubjectCode, availableClassrooms, selectedClassroom]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'MISSING_SCORES' | 'AT_RISK' | 'READY'>('ALL');

  // UI state
  const [savedBannerMessage, setSavedBannerMessage] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentWithGrades | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showSuccessBanner = (msg: string) => {
    setSavedBannerMessage(msg);
  };

  // Fetch real students from studentService and sync with sgsRosterAndSubmissionService
  const [studentsData, setStudentsData] = useState<StudentWithGrades[]>([]);

  const loadData = useCallback(async () => {
    if (cleanSlateService.isCleanSlateActive()) {
      setStudentsData([]);
      return;
    }

    setIsLoading(true);
    try {
      const targetRooms =
        selectedClassroom === 'ALL'
          ? availableClassrooms.length > 0
            ? availableClassrooms
            : ['']
          : [selectedClassroom];

      // Fetch students for target classrooms in parallel
      await Promise.all(
        targetRooms.map(async (room) => {
          if (!room) return;
          try {
            if (typeof (studentService as any).fetchByClassroom === 'function') {
              await (studentService as any).fetchByClassroom(room);
            } else {
              await studentService.getByClassroom(room);
            }
          } catch (err) {
            console.warn(`Could not fetch classroom ${room}:`, err);
          }
        })
      );

      // Collect real SgsStudentRecord for all target rooms
      const allRecords: Array<{ stu: SgsStudentRecord; room: string }> = [];
      targetRooms.forEach((room) => {
        const roster = sgsRosterAndSubmissionService.getSgsRoster(room);
        roster.forEach((stu) => {
          allRecords.push({ stu, room });
        });
      });

      // Compute readiness metrics for each student
      const computed: StudentWithGrades[] = allRecords.map(({ stu, room }) => {
        const grades = sgsRosterAndSubmissionService.computeStudentSgsGrades(
          stu,
          selectedSubjectCode,
          room || stu.classroom
        );

        const missingParts: string[] = [];
        if (grades.preMidterm === '' || grades.preMidterm === 0) missingParts.push('ก่อนกลางภาค');
        if (grades.midterm === '' || grades.midterm === 0) missingParts.push('กลางภาค');
        if (grades.postMidterm === '' || grades.postMidterm === 0) missingParts.push('หลังกลางภาค');
        if (grades.final === '' || grades.final === 0) missingParts.push('ปลายภาค');

        const isAtRisk =
          grades.gradeLabel === '0' ||
          grades.gradeLabel === 'ร' ||
          grades.gradeLabel === 'มส';

        const isReady =
          missingParts.length === 0 &&
          !isAtRisk &&
          grades.analyticalThinkingLevel !== undefined &&
          grades.desiredCharacteristicsLevel !== undefined;

        return {
          stu,
          classroomLabel: formatClassroomLabel(room || stu.classroom) || room || stu.classroom,
          weights: grades.weights,
          preMidterm: grades.preMidterm,
          midterm: grades.midterm,
          postMidterm: grades.postMidterm,
          final: grades.final,
          total: grades.total,
          gradeLabel: grades.gradeLabel,
          numericGrade: grades.numericGrade,
          analyticalThinkingLevel: grades.analyticalThinkingLevel,
          desiredCharacteristicsLevel: grades.desiredCharacteristicsLevel,
          missingParts,
          isAtRisk,
          isReady,
        };
      });

      setStudentsData(computed);
    } catch (error) {
      console.error('Error loading readiness data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [availableClassrooms, selectedClassroom, selectedSubjectCode]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Overall Statistics
  const totalStudents = studentsData.length;
  const studentsWithMissingScores = useMemo(
    () => studentsData.filter((s) => s.missingParts.length > 0).length,
    [studentsData]
  );
  const totalMissingPartsCount = useMemo(
    () => studentsData.reduce((sum, s) => sum + s.missingParts.length, 0),
    [studentsData]
  );
  const studentsAtRiskCount = useMemo(
    () => studentsData.filter((s) => s.isAtRisk).length,
    [studentsData]
  );
  const studentsReadyCount = useMemo(
    () => studentsData.filter((s) => s.isReady).length,
    [studentsData]
  );
  const isAllReadyForSgs = totalStudents > 0 && studentsReadyCount === totalStudents;
  const readinessPercent = totalStudents > 0 ? Math.round((studentsReadyCount / totalStudents) * 100) : 0;

  // 1-Click Action: Auto calculate desirable characteristics & critical thinking
  const handleAutoCalculateAttributes = () => {
    try {
      const targetRooms =
        selectedClassroom === 'ALL'
          ? availableClassrooms.length > 0
            ? availableClassrooms
            : ['']
          : [selectedClassroom];

      targetRooms.forEach((room) => {
        try {
          sgsRosterAndSubmissionService.calculateAttributesFromGrades(
            undefined,
            room,
            selectedSubjectCode
          );
        } catch {
          (sgsRosterAndSubmissionService as any).calculateAttributesFromGrades(
            room,
            selectedSubjectCode
          );
        }
      });

      teacherCopilotService.resolveUrgentItem('urgent-sgs-readiness');
      setRefreshTrigger((prev) => prev + 1);
      showSuccessBanner(
        '✓ ดึงผลคุณลักษณะอันพึงประสงค์ & อ่านคิดวิเคราะห์ (ระดับ 0–3) ตามเกรดวิชาอัตโนมัติครบทั้งห้องเรียบร้อยแล้ว'
      );
    } catch (err) {
      console.error('Error auto-calculating attributes:', err);
    }
  };

  // CSV Export for SGS
  const handleExportSgsCsv = () => {
    const roomLabel = selectedClassroom === 'ALL' ? 'ทุกห้อง' : selectedClassroom;
    const sanitizedRoom = roomLabel.replace(/[/\\]/g, '-');
    const filename = `SGS_${selectedSubjectCode}_${sanitizedRoom}.csv`;

    // Try service method if available
    if (typeof (sgsRosterAndSubmissionService as any).exportSgsGradebookCsv === 'function') {
      try {
        const csv = (sgsRosterAndSubmissionService as any).exportSgsGradebookCsv(
          selectedSubjectCode,
          currentSubject?.name || selectedSubjectCode,
          selectedClassroom
        );
        downloadCsvBlob(csv, filename);
        showSuccessBanner(`ส่งออกไฟล์ CSV สำหรับ SGS เรียบร้อยแล้ว: ${filename}`);
        return;
      } catch (e) {
        console.warn('Fallback to standard CSV generator:', e);
      }
    }

    // Standard SGS-compliant CSV generation with UTF-8 BOM
    const headers = [
      'ลำดับ',
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-สกุล',
      'ห้องเรียน',
      'คะแนนก่อนกลางภาค',
      'คะแนนกลางภาค',
      'คะแนนหลังกลางภาค',
      'คะแนนปลายภาค',
      'คะแนนรวม',
      'เกรด',
      'คุณลักษณะอันพึงประสงค์(0-3)',
      'อ่านคิดวิเคราะห์(0-3)',
      'สถานะ',
    ];

    const rows = filteredStudents.map((item, idx) => [
      idx + 1,
      item.stu.sgsSeatNo,
      item.stu.studentCode,
      `"${item.stu.studentName}"`,
      `"${item.classroomLabel}"`,
      item.preMidterm === '' ? 0 : item.preMidterm,
      item.midterm === '' ? 0 : item.midterm,
      item.postMidterm === '' ? 0 : item.postMidterm,
      item.final === '' ? 0 : item.final,
      item.total,
      item.gradeLabel,
      item.desiredCharacteristicsLevel,
      item.analyticalThinkingLevel,
      item.isReady ? 'พร้อมส่ง SGS' : 'รอดำเนินการ',
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    downloadCsvBlob(csvContent, filename);
    showSuccessBanner(`ส่งออกไฟล์ CSV สำหรับ SGS เรียบร้อยแล้ว: ${filename}`);
  };

  // Filter students by search and quick filter
  const filteredStudents = useMemo(() => {
    return studentsData.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.stu.studentName.toLowerCase().includes(q);
        const matchesCode = item.stu.studentCode.toLowerCase().includes(q);
        const matchesRoom = item.classroomLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesRoom) return false;
      }

      // Quick filter
      if (quickFilter === 'MISSING_SCORES') {
        return item.missingParts.length > 0;
      }
      if (quickFilter === 'AT_RISK') {
        return item.isAtRisk;
      }
      if (quickFilter === 'READY') {
        return item.isReady;
      }
      return true;
    });
  }, [studentsData, searchQuery, quickFilter]);

  // Per-room summary if 'ALL' is selected
  const roomSummaries = useMemo(() => {
    if (selectedClassroom !== 'ALL') return [];
    const map = new Map<
      string,
      {
        room: string;
        total: number;
        ready: number;
        missingScores: number;
        atRisk: number;
      }
    >();

    studentsData.forEach((s) => {
      const r = s.classroomLabel || 'ไม่ระบุ';
      if (!map.has(r)) {
        map.set(r, { room: r, total: 0, ready: 0, missingScores: 0, atRisk: 0 });
      }
      const entry = map.get(r)!;
      entry.total += 1;
      if (s.isReady) entry.ready += 1;
      if (s.missingParts.length > 0) entry.missingScores += 1;
      if (s.isAtRisk) entry.atRisk += 1;
    });

    return Array.from(map.values());
  }, [selectedClassroom, studentsData]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 font-['Prompt',sans-serif] text-slate-800 select-none">
      {/* Toast Notification Banner */}
      {savedBannerMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-emerald-950 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{savedBannerMessage}</span>
          </div>
          <button
            onClick={() => setSavedBannerMessage(null)}
            className="px-3 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
          >
            รับทราบ
          </button>
        </div>
      )}

      {/* Master Hero Banner */}
      <PageHeroBanner
        title="ความพร้อมก่อนปิดภาคเรียน & ส่งเกรด SGS"
        subtitle={
          totalStudents === 0
            ? 'เลือกรายวิชาและห้องเรียนเพื่อตรวจสอบความพร้อมของคะแนน 4 ส่วนและเกรด SGS'
            : isAllReadyForSgs
            ? `✓ ข้อมูลคะแนน 4 ส่วนและผลประเมินคุณลักษณะฯ ครบถ้วน 100% (${totalStudents} คน) พร้อมส่งออกไฟล์ SGS ทันที`
            : `ตรวจพบงานค้าง: ${totalMissingPartsCount} ช่องคะแนนว่าง/เป็น 0 และมีนักเรียนติด 0, ร, มส ${studentsAtRiskCount} คน`
        }
        icon={<Zap className="w-7 h-7 text-blue-600" />}
        badgeText={isAllReadyForSgs ? '100% READY' : `${readinessPercent}% READY`}
        badgeClass={
          isAllReadyForSgs
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }
        quoteText="เตรียมพร้อมทุกมิติ ปิดเทอมอย่างมั่นใจ ไร้งานค้าง"
      />

      {/* Context, Subject & Classroom Filters Bar */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Subject & Classroom Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B7C93] whitespace-nowrap">
                รายวิชา:
              </span>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="px-3 py-1.5 bg-[#F7FAFF] border border-[#BFDBFE] hover:border-blue-400 rounded-xl text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} {sub.shortName || sub.name} ({sub.credits} นก.)
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Pills / Dropdown */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#6B7C93] ml-1">ห้องเรียน:</span>
              <button
                type="button"
                onClick={() => setSelectedClassroom('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedClassroom === 'ALL'
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'bg-[#F2F7FC] hover:bg-slate-200 text-[#163A66]'
                }`}
              >
                ทุกห้องเรียน
              </button>
              {availableClassrooms.map((room) => {
                const label = formatClassroomLabel(room) || room;
                const isSelected = selectedClassroom === room;
                return (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setSelectedClassroom(room)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3B82F6] text-white shadow-xs'
                        : 'bg-[#F2F7FC] hover:bg-slate-200 text-[#163A66]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTAs: Auto Traits & SGS CSV & Help Modal */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ดูคำอธิบายขั้นตอนการเตรียมความพร้อมก่อนส่งเกรด SGS"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>วิธีใช้งาน</span>
            </button>

            <button
              type="button"
              onClick={handleAutoCalculateAttributes}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="ดึงผลการประเมินคุณลักษณะอันพึงประสงค์ & อ่านคิดวิเคราะห์ตามเกรดวิชาให้อัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>ดึงคุณลักษณะฯ อัตโนมัติ</span>
            </button>

            <button
              type="button"
              onClick={handleExportSgsCsv}
              disabled={totalStudents === 0}
              className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกไฟล์ CSV (SGS)</span>
            </button>
          </div>
        </div>

        {/* Search & Quick Filter Chips */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#94A3B8] mr-1">กรองข้อมูล:</span>
            <button
              type="button"
              onClick={() => setQuickFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                quickFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              ทั้งหมด ({totalStudents})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('MISSING_SCORES')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                quickFilter === 'MISSING_SCORES'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              ช่องคะแนนว่าง ({studentsWithMissingScores})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('AT_RISK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                quickFilter === 'AT_RISK'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              ติด 0, ร, มส ({studentsAtRiskCount})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('READY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                quickFilter === 'READY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              พร้อมส่ง SGS ({studentsReadyCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เลขที่ หรือรหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F7FAFF] border border-slate-200 rounded-xl text-xs text-[#163A66] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards (Rule of Thirds / 4-Col Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Readiness Ratio */}
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7C93]">ความพร้อมส่งเกรด SGS</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#163A66] tabular-nums">
                {studentsReadyCount}/{totalStudents}
              </span>
              <span className="text-xs font-semibold text-emerald-600">({readinessPercent}%)</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              isAllReadyForSgs
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isAllReadyForSgs ? 'พร้อม 100%' : 'รอดำเนินการ'}
          </span>
        </div>

        {/* Card 2: Empty/Missing Scores */}
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7C93]">ช่องคะแนนว่าง / เป็น 0</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  totalMissingPartsCount === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {totalMissingPartsCount}
              </span>
              <span className="text-xs font-medium text-[#6B7C93]">
                ช่อง (จาก {studentsWithMissingScores} คน)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            คะแนน 4 ส่วน
          </span>
        </div>

        {/* Card 3: At-Risk Grades (0, ร, มส) */}
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7C93]">นักเรียนติดเกรด 0, ร, มส</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  studentsAtRiskCount === 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {studentsAtRiskCount}
              </span>
              <span className="text-xs font-medium text-[#6B7C93]">คน</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              studentsAtRiskCount === 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {studentsAtRiskCount === 0 ? 'ไม่มีกลุ่มเสี่ยง' : 'ต้องแก้ไขก่อนตัดเกรด'}
          </span>
        </div>

        {/* Card 4: Attributes Evaluation */}
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7C93]">คุณลักษณะฯ & อ่านคิดฯ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700 tabular-nums">
                {
                  studentsData.filter(
                    (s) =>
                      s.analyticalThinkingLevel !== undefined &&
                      s.desiredCharacteristicsLevel !== undefined
                  ).length
                }
                /{totalStudents}
              </span>
              <span className="text-xs font-medium text-[#6B7C93]">ประเมินแล้ว</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoCalculateAttributes}
            className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            ประเมินทั้งห้อง
          </button>
        </div>
      </div>

      {/* Overview Across All Rooms (Show only when 'ALL' is selected and multiple rooms exist) */}
      {selectedClassroom === 'ALL' && roomSummaries.length > 1 && (
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-[#163A66] text-sm">
                สรุปความพร้อมแยกตามห้องเรียน ({currentSubject?.shortName || currentSubject?.name})
              </h3>
            </div>
            <span className="text-xs text-[#6B7C93]">คลิกเลือกห้องเพื่อดูรายชื่อ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {roomSummaries.map((item) => {
              const pct = item.total > 0 ? Math.round((item.ready / item.total) * 100) : 0;
              const isRoomReady = item.total > 0 && item.ready === item.total;
              return (
                <button
                  key={item.room}
                  type="button"
                  onClick={() => setSelectedClassroom(item.room)}
                  className="text-left p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-[#F7FAFF] hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {item.room}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isRoomReady
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[#6B7C93]">
                    <div className="flex justify-between">
                      <span>นักเรียนทั้งหมด:</span>
                      <span className="font-semibold text-slate-800">{item.total} คน</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ช่องว่าง/ค้าง:</span>
                      <span
                        className={`font-semibold ${
                          item.missingScores > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.missingScores} คน
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ติด 0/ร/มส:</span>
                      <span
                        className={`font-semibold ${
                          item.atRisk > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.atRisk} คน
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Students Table (4-Part Scores & SGS Readiness) */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] shadow-xs overflow-hidden">
        {/* Table Header Action Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-[#163A66] text-sm">
              ตารางคะแนน 4 ส่วน & คุณลักษณะอันพึงประสงค์ (สมุดพก ปพ.5 / SGS)
            </h3>
            <span className="text-xs text-[#94A3B8] font-normal">
              ({filteredStudents.length} รายการ)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToAssignments && (
              <button
                type="button"
                onClick={onNavigateToAssignments}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>ตรวจงาน/มอบหมาย</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setRefreshTrigger((p) => p + 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#163A66] text-sm">
                {searchQuery ? 'ไม่พบข้อมูลนักเรียนที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้'}
              </h4>
              <p className="text-xs text-[#6B7C93]">
                {searchQuery
                  ? 'ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "ทั้งหมด" ในตัวกรองด้านบน'
                  : 'กรุณาตรวจสอบรายชื่อนักเรียนในเมนู "ข้อมูลนักเรียน" หรือเลือกห้องเรียนอื่น'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7FAFF] border-b border-[#E6EEF7] text-[#6B7C93] font-semibold">
                  <th className="py-3 px-3 text-center w-12">เลขที่</th>
                  <th className="py-3 px-3 w-24">รหัส</th>
                  <th className="py-3 px-3 min-w-[160px]">ชื่อ - นามสกุล</th>
                  {selectedClassroom === 'ALL' && <th className="py-3 px-3">ห้อง</th>}
                  <th className="py-3 px-3 text-center whitespace-nowrap bg-blue-50/50">
                    ก่อนกลางภาค ({filteredStudents[0]?.weights.preMidterm ?? 25})
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap bg-teal-50/40">
                    กลางภาค ({filteredStudents[0]?.weights.midterm ?? 20})
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap bg-indigo-50/40">
                    หลังกลางภาค ({filteredStudents[0]?.weights.postMidterm ?? 25})
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap bg-purple-50/40">
                    ปลายภาค ({filteredStudents[0]?.weights.final ?? 30})
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold text-[#163A66]">
                    รวม (100)
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold">เกรด</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">คุณลักษณะฯ (0–3)</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">อ่านคิดฯ (0–3)</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((item) => {
                  const preEmpty = item.preMidterm === '' || item.preMidterm === 0;
                  const midEmpty = item.midterm === '' || item.midterm === 0;
                  const postEmpty = item.postMidterm === '' || item.postMidterm === 0;
                  const finalEmpty = item.final === '' || item.final === 0;

                  return (
                    <tr
                      key={`${item.classroomLabel}-${item.stu.studentCode}`}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedStudentForDetail(item)}
                    >
                      {/* Seat No */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 tabular-nums">
                        {item.stu.sgsSeatNo}
                      </td>

                      {/* Student Code */}
                      <td className="py-3 px-3 font-mono text-slate-500 tabular-nums">
                        {item.stu.studentCode}
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-3 font-semibold text-[#163A66]">
                        <div className="flex items-center gap-1.5">
                          <span>{item.stu.studentName}</span>
                          {item.stu.gender === 'FEMALE' ? (
                            <span className="text-[10px] text-rose-500">♀</span>
                          ) : (
                            <span className="text-[10px] text-blue-500">♂</span>
                          )}
                        </div>
                      </td>

                      {/* Classroom (if ALL) */}
                      {selectedClassroom === 'ALL' && (
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium">
                            {item.classroomLabel}
                          </span>
                        </td>
                      )}

                      {/* Score: Pre Midterm */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {preEmpty ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                            {item.preMidterm === 0 ? '0' : 'ว่าง'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">{item.preMidterm}</span>
                        )}
                      </td>

                      {/* Score: Midterm */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {midEmpty ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                            {item.midterm === 0 ? '0' : 'ว่าง'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">{item.midterm}</span>
                        )}
                      </td>

                      {/* Score: Post Midterm */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {postEmpty ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                            {item.postMidterm === 0 ? '0' : 'ว่าง'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">{item.postMidterm}</span>
                        )}
                      </td>

                      {/* Score: Final */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {finalEmpty ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                            {item.final === 0 ? '0' : 'ว่าง'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">{item.final}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-center tabular-nums font-bold text-[#163A66]">
                        {item.total}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.gradeLabel === '4' || item.gradeLabel === '3.5'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.gradeLabel === '3' || item.gradeLabel === '2.5'
                              ? 'bg-blue-100 text-blue-800'
                              : item.gradeLabel === '2' || item.gradeLabel === '1.5'
                              ? 'bg-amber-100 text-amber-800'
                              : item.gradeLabel === '1'
                              ? 'bg-orange-100 text-orange-800'
                              : item.gradeLabel === 'ร'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse font-bold'
                              : 'bg-rose-100 text-rose-800 font-bold'
                          }`}
                        >
                          {item.gradeLabel}
                        </span>
                      </td>

                      {/* Desirable Characteristics */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            item.desiredCharacteristicsLevel === 3
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.desiredCharacteristicsLevel === 2
                              ? 'bg-blue-50 text-blue-700'
                              : item.desiredCharacteristicsLevel === 1
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.desiredCharacteristicsLevel === 3
                            ? 'ดีเยี่ยม (3)'
                            : item.desiredCharacteristicsLevel === 2
                            ? 'ดี (2)'
                            : item.desiredCharacteristicsLevel === 1
                            ? 'ผ่าน (1)'
                            : 'ไม่ผ่าน (0)'}
                        </span>
                      </td>

                      {/* Analytical Thinking */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            item.analyticalThinkingLevel === 3
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.analyticalThinkingLevel === 2
                              ? 'bg-blue-50 text-blue-700'
                              : item.analyticalThinkingLevel === 1
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.analyticalThinkingLevel === 3
                            ? 'ดีเยี่ยม (3)'
                            : item.analyticalThinkingLevel === 2
                            ? 'ดี (2)'
                            : item.analyticalThinkingLevel === 1
                            ? 'ผ่าน (1)'
                            : 'ไม่ผ่าน (0)'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.isReady ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมส่ง
                          </span>
                        ) : item.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> ติด {item.gradeLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> ค้าง {item.missingParts.length} ส่วน
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
      </div>

      {/* COMPACT MODAL: ⓘ วิธีใช้งาน (Clean Pastel Guide) */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-[#163A66] text-base">
                  วิธีเตรียมความพร้อมก่อนส่งเกรด SGS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#6B7C93]">
              <div className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-[#163A66] text-xs">ตรวจสอบคะแนน 4 ส่วน (เต็ม 100)</h4>
                  <p className="mt-0.5">
                    ตรวจเช็คคะแนนก่อนกลางภาค, กลางภาค, หลังกลางภาค และปลายภาค ให้ครบทุกช่อง ไม่มีช่องว่างหรือ 0
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-[#163A66] text-xs">จัดการนักเรียนกลุ่มเสี่ยง (0, ร, มส)</h4>
                  <p className="mt-0.5">
                    นักเรียนที่ค้างส่งงานสำคัญจะติด &quot;ร&quot; อัตโนมัติ ให้ติดตามส่งงานหรือแก้ตัวก่อนตัดเกรดรอบสุดท้าย
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-[#163A66] text-xs">ดึงผลคุณลักษณะฯ & อ่านคิดวิเคราะห์ 1 คลิก</h4>
                  <p className="mt-0.5">
                    กดปุ่ม &quot;ดึงคุณลักษณะฯ อัตโนมัติ&quot; เพื่อประเมินระดับ 0–3 จากเกรดและเวลาเรียนให้อัตโนมัติทั้งห้อง
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-[#163A66] text-xs">ส่งออกไฟล์ CSV นำเข้าสู่ระบบ SGS</h4>
                  <p className="mt-0.5">
                    เมื่อทุกช่องคะแนนครบถ้วนและพร้อม 100% กดปุ่ม &quot;ส่งออกไฟล์ CSV (SGS)&quot; เพื่อนำเข้าสู่ระบบ สพฐ. ได้ทันที
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: Student Score Breakdown */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-[#163A66] text-base">
                  {selectedStudentForDetail.stu.studentName}
                </h3>
                <p className="text-xs text-[#6B7C93]">
                  เลขที่ {selectedStudentForDetail.stu.sgsSeatNo} • รหัส {selectedStudentForDetail.stu.studentCode} • ห้อง {selectedStudentForDetail.classroomLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#F7FAFF] rounded-xl border border-slate-100">
                  <span className="text-[#6B7C93] text-[11px]">ก่อนกลางภาค</span>
                  <div className="text-lg font-bold text-[#163A66] mt-0.5">
                    {selectedStudentForDetail.preMidterm !== '' ? selectedStudentForDetail.preMidterm : '-'}
                    <span className="text-xs font-normal text-slate-400"> / {selectedStudentForDetail.weights.preMidterm}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7FAFF] rounded-xl border border-slate-100">
                  <span className="text-[#6B7C93] text-[11px]">กลางภาค</span>
                  <div className="text-lg font-bold text-[#163A66] mt-0.5">
                    {selectedStudentForDetail.midterm !== '' ? selectedStudentForDetail.midterm : '-'}
                    <span className="text-xs font-normal text-slate-400"> / {selectedStudentForDetail.weights.midterm}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7FAFF] rounded-xl border border-slate-100">
                  <span className="text-[#6B7C93] text-[11px]">หลังกลางภาค</span>
                  <div className="text-lg font-bold text-[#163A66] mt-0.5">
                    {selectedStudentForDetail.postMidterm !== '' ? selectedStudentForDetail.postMidterm : '-'}
                    <span className="text-xs font-normal text-slate-400"> / {selectedStudentForDetail.weights.postMidterm}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7FAFF] rounded-xl border border-slate-100">
                  <span className="text-[#6B7C93] text-[11px]">ปลายภาค</span>
                  <div className="text-lg font-bold text-[#163A66] mt-0.5">
                    {selectedStudentForDetail.final !== '' ? selectedStudentForDetail.final : '-'}
                    <span className="text-xs font-normal text-slate-400"> / {selectedStudentForDetail.weights.final}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-900">คะแนนรวมสุทธิ</span>
                  <div className="text-xl font-bold text-blue-900">{selectedStudentForDetail.total} / 100</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-900">เกรดที่ได้</span>
                  <div className="text-xl font-bold text-blue-900">{selectedStudentForDetail.gradeLabel}</div>
                </div>
              </div>

              {selectedStudentForDetail.missingParts.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                  <span className="font-bold">ช่องคะแนนที่ยังค้าง: </span>
                  <span>{selectedStudentForDetail.missingParts.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
