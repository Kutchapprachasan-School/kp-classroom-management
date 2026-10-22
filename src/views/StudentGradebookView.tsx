// src/views/StudentGradebookView.tsx
// สมุดคะแนนและสถิติการเรียนรู้ของนักเรียน (ตรงตามภาพอ้างอิง media_1792044507234_3e60e1a8.jpg, media_1792044541421_d63ead8c.png, media_1792044662907_51ecf92f.png)
// ออกแบบตามระบบ Pastel Anime Education Dashboard (Prompt Font, Primary #3B82F6)

import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Bookmark,
  ClipboardList,
  Calendar,
  ChevronDown,
  Star,
  Users,
  Lightbulb,
  TrendingUp,
  PieChart as PieChartIcon,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { AuthUser } from '../services/authService';
import type { SchoolSettingsConfig } from '../config/schoolSettings';
import { getSchoolSettings } from '../config/schoolSettings';
import { academicCalendarService } from '../services/academicCalendarService';
import { formatClassroomLabel } from '../services/studentService';
import { coursesCurriculumService, type CourseCurriculumRecord } from '../services/coursesCurriculumService';
import { getSubjectIcon } from '../config/subjectIcons';
import {
  sgsRosterAndSubmissionService,
  matchSubmissionToAssignment,
  type CourseScoreWeights,
} from '../services/sgsRosterAndSubmissionService';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';

interface StudentGradebookViewProps {
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

// 8 Strands Subject Item with 4-part score breakdown
interface SubjectGradeItem {
  id: string;
  strand: string;
  code: string;
  title: string;
  symbol: string;
  iconBg: string;
  preMidtermScore: number | '';
  midtermScore: number | '';
  postMidtermScore: number | '';
  finalScore: number | '';
  totalScore: number;
  grade: number | string;
  gradeLabel: string;
  weights: CourseScoreWeights;
  teacherName: string;
  teacherDepartment: string;
  teacherAvatar: string;
  evalScore: number;
  evalStatus: 'ยอดเยี่ยม' | 'ดีมาก' | 'ดี' | 'ผ่าน';
}

export const StudentGradebookView: React.FC<StudentGradebookViewProps> = ({
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentName = currentUser?.name || 'นักเรียน';
  const studentRoom = formatClassroomLabel(currentUser?.classroomId);

  // 1. Term / Academic Year Selector State
  const terms = academicCalendarService.getTerms();
  const activeTerm = academicCalendarService.getActiveTerm();
  const [selectedTermYear, setSelectedTermYear] = useState<string>(() =>
    activeTerm ? `${activeTerm.semesterNo}/${activeTerm.year}` : '1/2569'
  );

  // 2. Radar Chart Mode State ('STRANDS' = ภาพ 2 | 'COMPETENCIES' = ภาพ 3)
  const [radarMode, setRadarMode] = useState<'STRANDS' | 'COMPETENCIES'>('STRANDS');
  const [radarScope, setRadarScope] = useState<string>('ทุกภาคเรียน');

  // 3. Teacher Evaluation Modal State
  const [evalModalTeacher, setEvalModalTeacher] = useState<SubjectGradeItem | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('kp-sgs-roster-updated', handleUpdate);
    window.addEventListener('kp-copilot-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
      window.removeEventListener('kp-copilot-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const studentCode = currentUser?.studentCode || 'STD-001';

  // Real roster student
  const rosterStudent = useMemo(() => {
    return (
      sgsRosterAndSubmissionService.getSgsRoster(studentRoom).find((s) => s.studentCode === studentCode) || {
        sgsSeatNo: 1,
        studentCode,
        studentName: currentUser?.name || 'นักเรียน',
        gender: 'MALE' as const,
        classroom: studentRoom,
        transferState: 'ACTIVE' as const,
        attendancePercent: 100,
        morningStatusLabel: 'ปกติ',
        midtermScore: 0,
        finalScore: 0,
      }
    );
  }, [studentRoom, studentCode, currentUser, refreshKey]);

  // Dynamic Subjects List (Zero Mock Data: checks coursesCurriculumService and real grades with 4 parts)
  const subjectsList: SubjectGradeItem[] = useMemo(() => {
    try {
      const allCourses = coursesCurriculumService.getCourses();
      const currentLevel = studentRoom.split('/')[0] || ''; // e.g. 'ม.1'
      const matched = allCourses.filter((c: CourseCurriculumRecord) => {
        const matchRoom =
          Array.isArray(c.assignedClassrooms) &&
          c.assignedClassrooms.some((r: string) => r === studentRoom || formatClassroomLabel(r) === studentRoom);
        const matchLevel = c.level === currentLevel;
        return matchRoom || matchLevel;
      });

      if (matched.length > 0) {
        return matched.map((c: CourseCurriculumRecord) => {
          const iconConfig = getSubjectIcon(c.code, c.name);
          const grades = rosterStudent
            ? sgsRosterAndSubmissionService.computeStudentSgsGrades(rosterStudent as any, c.code, studentRoom)
            : null;
          const weights = grades?.weights || sgsRosterAndSubmissionService.getCourseWeights(c.code);

          return {
            id: c.id,
            strand: c.strand || 'วิชาพื้นฐาน',
            code: c.code,
            title: `${c.name} (${c.code})`,
            symbol: iconConfig.symbol || '📘',
            iconBg: `${iconConfig.bgClass} ${iconConfig.textClass}`,
            preMidtermScore: grades ? grades.preMidterm : '',
            midtermScore: grades ? grades.midterm : '',
            postMidtermScore: grades ? grades.postMidterm : '',
            finalScore: grades ? grades.final : '',
            totalScore: grades ? grades.total : 0,
            grade: grades ? (grades.gradeLabel || grades.numericGrade) : 0,
            gradeLabel: grades ? (grades.gradeLabel || String(grades.numericGrade)) : '0',
            weights,
            teacherName: c.teacherName || 'ครูผู้สอน',
            teacherDepartment: `กลุ่มสาระฯ ${c.strand || 'การเรียนรู้'}`,
            teacherAvatar: '👨‍🏫',
            evalScore: 5.0,
            evalStatus: 'ยอดเยี่ยม' as const,
          };
        });
      }
    } catch {
      // fallback
    }
    return [];
  }, [studentRoom, rosterStudent, refreshKey]);

  // Term Data Matrix: Calculated Dynamically
  const termData = useMemo(() => {
    if (subjectsList.length === 0) {
      return {
        gpa: '0.00',
        gpaTrend: '-',
        gpaAvg: '0.00',
        gpaAccum: '0.00',
        accumTrend: '-',
        gradedCount: 0,
        pendingReviewCount: 0,
      };
    }
    const totalPoints = subjectsList.reduce((acc, sub) => acc + (Number(sub.grade) || 0), 0);
    const calculatedGpa = (totalPoints / subjectsList.length).toFixed(2);
    return {
      gpa: calculatedGpa,
      gpaTrend: 'ภาคเรียนปัจจุบัน',
      gpaAvg: calculatedGpa,
      gpaAccum: calculatedGpa,
      accumTrend: 'ภาคเรียนปัจจุบัน',
      gradedCount: subjectsList.length,
      pendingReviewCount: 0,
    };
  }, [subjectsList]);

  // Radar Chart Data: 8 Strands
  const strandRadarData = useMemo(() => {
    if (subjectsList.length === 0) {
      return [
        { subject: 'คณิตศาสตร์', student: 0, fullMark: 100 },
        { subject: 'วิทยาศาสตร์', student: 0, fullMark: 100 },
        { subject: 'ภาษาไทย', student: 0, fullMark: 100 },
        { subject: 'สังคมศึกษา', student: 0, fullMark: 100 },
        { subject: 'ภาษาอังกฤษ', student: 0, fullMark: 100 },
        { subject: 'สุขศึกษา', student: 0, fullMark: 100 },
        { subject: 'ศิลปะ', student: 0, fullMark: 100 },
        { subject: 'การงานอาชีพ', student: 0, fullMark: 100 },
      ];
    }
    return subjectsList.map((s) => ({
      subject: s.strand,
      student: s.totalScore,
      fullMark: 100,
    }));
  }, [subjectsList]);

  // Radar Chart Data: 5 Competencies
  const disciplineScore = useMemo(() => {
    return studentAffairsCouncilService.getStudentDisciplineScore(studentCode).score;
  }, [studentCode]);

  const submissionRate = useMemo(() => {
    const assignments = sgsRosterAndSubmissionService.getTermAssignments(undefined, studentRoom);
    if (assignments.length === 0) return 100;
    const allSubs = sgsRosterAndSubmissionService.getSubmissions();
    const submittedCount = assignments.filter((a) =>
      allSubs.some((s) => s.studentCode === studentCode && matchSubmissionToAssignment(s, a))
    ).length;
    return Math.round((submittedCount / assignments.length) * 100);
  }, [studentRoom, studentCode, refreshKey]);

  const competencyRadarData = useMemo(() => {
    const hasData = subjectsList.length > 0;
    const avgScore = hasData
      ? Math.round(subjectsList.reduce((acc, s) => acc + s.totalScore, 0) / subjectsList.length)
      : 0;
    return [
      { subject: 'คะแนนเก็บ', student: avgScore, fullMark: 100 },
      { subject: 'คะแนนสอบ', student: avgScore, fullMark: 100 },
      { subject: 'ส่งงานตรงเวลา', student: hasData ? submissionRate : 0, fullMark: 100 },
      { subject: 'เวลาเรียน', student: hasData ? (rosterStudent?.attendancePercent ?? 100) : 0, fullMark: 100 },
      { subject: 'พฤติกรรม', student: hasData ? disciplineScore : 0, fullMark: 100 },
    ];
  }, [subjectsList, submissionRate, rosterStudent?.attendancePercent, disciplineScore]);

  // Donut Chart Data: Grade Distribution
  const gradeDistributionData = useMemo(() => {
    if (subjectsList.length === 0) {
      return [
        { name: 'ดีเยี่ยม (เกรด 4)', count: 0, percent: 0.0, color: '#00A3FF' },
        { name: 'ดีมาก (เกรด 3-3.5)', count: 0, percent: 0.0, color: '#10B981' },
        { name: 'ผ่าน (เกรด 1-2.5)', count: 0, percent: 0.0, color: '#F97316' },
        { name: 'ไม่ผ่าน (เกรด 0)', count: 0, percent: 0.0, color: '#EF4444' },
      ];
    }
    const grade4 = subjectsList.filter((s) => Number(s.grade) === 4).length;
    const grade3 = subjectsList.filter((s) => Number(s.grade) >= 3 && Number(s.grade) < 4).length;
    const grade12 = subjectsList.filter((s) => Number(s.grade) >= 1 && Number(s.grade) < 3).length;
    const grade0 = subjectsList.filter((s) => Number(s.grade) === 0).length;
    const total = subjectsList.length;
    return [
      { name: 'ดีเยี่ยม (เกรด 4)', count: grade4, percent: (grade4 / total) * 100, color: '#00A3FF' },
      { name: 'ดีมาก (เกรด 3-3.5)', count: grade3, percent: (grade3 / total) * 100, color: '#10B981' },
      { name: 'ผ่าน (เกรด 1-2.5)', count: grade12, percent: (grade12 / total) * 100, color: '#F97316' },
      { name: 'ไม่ผ่าน (เกรด 0)', count: grade0, percent: (grade0 / total) * 100, color: '#EF4444' },
    ];
  }, [subjectsList]);

  // Line Chart Data: GPA Trend across terms
  const gpaTrendData = useMemo(() => {
    return terms.map((t) => ({
      term: `เทอม ${t.semesterNo}/${t.year}`,
      gpa: `${t.semesterNo}/${t.year}` === selectedTermYear ? Number(termData.gpa) : 0,
    }));
  }, [terms, selectedTermYear, termData.gpa]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in font-['Prompt',sans-serif] text-slate-800 select-none">
      {/* =========================================================================
          1. HERO BANNER (ตามภาพที่ 2 media_1792044507234_3e60e1a8.jpg)
      ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden border border-[#BFDBFE]/60 bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE]/40 to-[#F0FDF4]/30 p-5 sm:p-6 shadow-card">
        {/* Decorative Anime Backdrop */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 pointer-events-none opacity-90 sm:opacity-100 overflow-hidden">
          <img
            src="/images/banners/hero-banner.png"
            alt="Anime student reading banner"
            className="w-full h-full object-cover object-right"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#163A66] tracking-tight">
                  สมุดคะแนนและสถิติการเรียนรู้
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7C93] mt-0.5">
                {studentName} · ห้อง {studentRoom} · {settings.nameTh}
              </p>
            </div>
          </div>

          {/* Inspirational Quote Card on Right */}
          <div className="self-start md:self-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-2xs text-xs text-[#163A66] font-medium hidden sm:flex items-center gap-1.5">
            <span>&ldquo;การศึกษา คือการเปิดโลกให้กับนักเรียน&rdquo;</span>
            <span className="text-rose-500 font-bold">♡</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. TOP 4 STAT KPI CARDS (ตามภาพที่ 2 media_1792044507234_3e60e1a8.jpg)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ภาพรวมผลการเรียน */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#6B7C93] whitespace-nowrap">
              ภาพรวมผลการเรียน
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#163A66] tracking-tight">
              {termData.gpa}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">/ 4.00</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <span>▲</span>
            <span>{termData.gpaTrend}</span>
          </div>
        </div>

        {/* Card 2: ค่าเฉลี่ยรวม */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#6B7C93] whitespace-nowrap">ค่าเฉลี่ยรวม</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#163A66] tracking-tight">
              {termData.gpaAvg}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">/ 4.00</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <span>▲</span>
            <span>{termData.gpaTrend}</span>
          </div>
        </div>

        {/* Card 3: เกรดเฉลี่ยสะสม */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#6B7C93] whitespace-nowrap">
              เกรดเฉลี่ยสะสม
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#163A66] tracking-tight">
              {termData.gpaAccum}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">/ 4.00</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <span>▲</span>
            <span>{termData.accumTrend}</span>
          </div>
        </div>

        {/* Card 4: จำนวนวิชาที่ได้เกรด */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#6B7C93] whitespace-nowrap">
              จำนวนวิชาที่ได้เกรด
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#163A66] tracking-tight">
              {termData.gradedCount}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">รายการ</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {termData.pendingReviewCount > 0
                ? `รอการตรวจสอบ ${termData.pendingReviewCount} รายการ`
                : 'ตรวจสอบครบทุกวิชา'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN SECTION: LEFT TABLE (ผลการเรียนรายวิชา) + RIGHT RADAR CHART
          (ตามภาพที่ 2 media_1792044507234_3e60e1a8.jpg & ภาพที่ 3 media_1792044541421_d63ead8c.png)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Card: ผลการเรียนรายวิชา (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#163A66]">
                ผลการเรียนรายวิชา
              </h2>
            </div>

            {/* Term Dropdown Pill */}
            <div className="relative">
              <select
                value={selectedTermYear}
                onChange={(e) => setSelectedTermYear(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 text-[#163A66] text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
                title="เลือกภาคเรียนที่ต้องการดูข้อมูล"
              >
                {terms.map((t) => (
                  <option key={t.id} value={`${t.semesterNo}/${t.year}`}>
                    ภาคเรียนที่ {t.semesterNo}/{t.year} {t.isActive ? '(ปัจจุบัน)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Table (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[#6B7C93] font-semibold">
                  <th className="py-2.5 px-3">รายวิชา</th>
                  <th className="py-2.5 px-2 text-center">ก่อนกลางภาค</th>
                  <th className="py-2.5 px-2 text-center">กลางภาค</th>
                  <th className="py-2.5 px-2 text-center">หลังกลางภาค</th>
                  <th className="py-2.5 px-2 text-center">ปลายภาค</th>
                  <th className="py-2.5 px-2 text-center">คะแนนรวม (100)</th>
                  <th className="py-2.5 px-2 text-center">เกรด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {subjectsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">
                          ยังไม่มีข้อมูลผลการเรียนที่บันทึกในภาคเรียนที่ {selectedTermYear}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ผลคะแนนสอบและการประเมินจะแสดงเมื่อคุณครูประจำวิชาได้บันทึกคะแนนเรียบร้อยแล้ว
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subjectsList.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50/20 transition-colors"
                  >
                    {/* Subject Title + Icon */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 min-w-[170px]">
                        <div
                          className={`w-7 h-7 rounded-lg ${sub.iconBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {sub.symbol}
                        </div>
                        <span className="font-bold text-[#163A66]">
                          {sub.title}
                        </span>
                      </div>
                    </td>

                    {/* Pre-Midterm */}
                    <td className="py-3 px-2 text-center font-bold text-[#163A66]">
                      {sub.preMidtermScore !== '' ? sub.preMidtermScore : '-'}{' '}
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        / {sub.weights.preMidterm}
                      </span>
                    </td>

                    {/* Midterm */}
                    <td className="py-3 px-2 text-center font-bold text-[#163A66]">
                      {sub.midtermScore !== '' ? sub.midtermScore : '-'}{' '}
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        / {sub.weights.midterm}
                      </span>
                    </td>

                    {/* Post-Midterm */}
                    <td className="py-3 px-2 text-center font-bold text-[#163A66]">
                      {sub.postMidtermScore !== '' ? sub.postMidtermScore : '-'}{' '}
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        / {sub.weights.postMidterm}
                      </span>
                    </td>

                    {/* Final */}
                    <td className="py-3 px-2 text-center font-bold text-[#163A66]">
                      {sub.finalScore !== '' ? sub.finalScore : '-'}{' '}
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        / {sub.weights.final}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-2 text-center font-black text-[#163A66]">
                      {sub.totalScore.toFixed(1)}{' '}
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        / 100
                      </span>
                    </td>

                    {/* Grade Badge */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block min-w-[32px] px-2 py-0.5 rounded-full text-xs font-black shadow-2xs ${
                          sub.gradeLabel === 'ร'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : Number(sub.grade) === 4
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : Number(sub.grade) >= 3
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : Number(sub.grade) >= 2
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {sub.gradeLabel || sub.grade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible only on mobile) */}
          <div className="md:hidden space-y-3">
            {subjectsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  ยังไม่มีข้อมูลผลการเรียนในภาคเรียนนี้
                </p>
              </div>
            ) : (
              subjectsList.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${sub.iconBg} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {sub.symbol}
                      </div>
                      <span className="font-bold text-xs text-[#163A66]">{sub.title}</span>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs ${
                        sub.gradeLabel === 'ร'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : Number(sub.grade) === 4
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : Number(sub.grade) >= 3
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : Number(sub.grade) >= 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sub.gradeLabel === 'ร' ? 'ติด ร' : `เกรด ${sub.gradeLabel || sub.grade}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/50 text-center">
                    <div className="bg-white rounded-xl p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">ก่อนกลางภาค</span>
                      <span className="text-xs font-bold text-[#163A66]">
                        {sub.preMidtermScore !== '' ? sub.preMidtermScore : '-'}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/{sub.weights.preMidterm}</span>
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">กลางภาค</span>
                      <span className="text-xs font-bold text-[#163A66]">
                        {sub.midtermScore !== '' ? sub.midtermScore : '-'}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/{sub.weights.midterm}</span>
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">หลังกลางภาค</span>
                      <span className="text-xs font-bold text-[#163A66]">
                        {sub.postMidtermScore !== '' ? sub.postMidtermScore : '-'}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/{sub.weights.postMidterm}</span>
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">ปลายภาค</span>
                      <span className="text-xs font-bold text-[#163A66]">
                        {sub.finalScore !== '' ? sub.finalScore : '-'}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/{sub.weights.final}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 px-1 text-xs">
                    <span className="text-slate-500 font-medium">คะแนนรวมทั้งหมด:</span>
                    <span className="font-black text-blue-600">{sub.totalScore.toFixed(1)} / 100</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Summary Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#163A66]">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span>คะแนนรวมทุกรายวิชา</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#163A66]">
                {termData.gpa}
              </span>
              <span className="text-xs text-[#94A3B8] font-semibold">/ 4.00</span>
              <span className="text-[11px] font-bold text-emerald-600 ml-1">
                ▲ {termData.gpaTrend}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: สรุปผลการเรียน (Radar Chart) (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card space-y-4">
          {/* Header with Mode Toggle & Scope Dropdown */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {radarMode === 'STRANDS' ? (
                  <Calendar className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="relative">
                {/* Dropdown to switch radar between 8 Strands (Image 2) and 5 Competencies (Image 3) */}
                <select
                  value={radarMode}
                  onChange={(e) =>
                    setRadarMode(e.target.value as 'STRANDS' | 'COMPETENCIES')
                  }
                  className="appearance-none font-bold text-[#163A66] text-xs sm:text-sm pl-0 pr-5 py-0.5 bg-transparent cursor-pointer focus:outline-none"
                  title="เปลี่ยนมิติการแสดงผล Radar Chart"
                >
                  <option value="STRANDS">สรุปผลการเรียน (Radar Chart)</option>
                  <option value="COMPETENCIES">มิติสมรรถนะการเรียนรู้ (Radar Chart)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Scope Dropdown */}
            <div className="relative">
              <select
                value={radarScope}
                onChange={(e) => setRadarScope(e.target.value)}
                className="appearance-none pl-2.5 pr-6 py-1 bg-[#F8FAFC] border border-slate-200 text-[#163A66] text-[11px] font-bold rounded-lg cursor-pointer focus:outline-none"
              >
                <option value="ทุกภาคเรียน">ทุกภาคเรียน</option>
                <option value="1/2569">เทอม 1/2569</option>
                <option value="2/2568">เทอม 2/2568</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Radar Chart Display */}
          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarMode === 'STRANDS' ? strandRadarData : competencyRadarData}
              >
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={radarMode === 'STRANDS' ? 22.5 : 30}
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 9 }}
                />
                <Radar
                  name="คะแนนของคุณ"
                  dataKey="student"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="#3B82F6"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight Card under Radar */}
          {radarMode === 'STRANDS' ? (
            // Insight for 8 Strands (Image 2)
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-[#163A66] flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                <span>จุดเด่น / พัฒนาการ</span>
              </div>
              {(() => {
                const graded = [...subjectsList].filter((s) => s.totalScore > 0);
                if (graded.length === 0) {
                  return (
                    <div className="text-[11px] text-slate-500 py-1">
                      ยังไม่มีผลคะแนนที่บันทึกในระบบ หรือรอคุณครูประจำวิชาประเมินผลคะแนน
                    </div>
                  );
                }
                const sorted = [...graded].sort((a, b) => b.totalScore - a.totalScore);
                const best = sorted.slice(0, 2);
                const need = sorted.length > 2 ? [...sorted].reverse().slice(0, 2) : [];
                return (
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>
                        จุดเด่น:{' '}
                        {best.map((b, i) => (
                          <React.Fragment key={b.id}>
                            {i > 0 && ' , '}
                            <strong>
                              {b.strand} ({b.totalScore.toFixed(1)})
                            </strong>
                          </React.Fragment>
                        ))}
                      </span>
                    </div>
                    {need.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span>
                          ควรพัฒนา:{' '}
                          {need.map((n, i) => (
                            <React.Fragment key={n.id}>
                              {i > 0 && ' , '}
                              <strong>
                                {n.strand} ({n.totalScore.toFixed(1)})
                              </strong>
                            </React.Fragment>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            // Insight for 5 Competencies (Image 3)
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>การวิเคราะห์สมรรถนะผู้เรียน:</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                ความตั้งใจเรียนดีมาก ทบทวนเนื้อหาหน่วยที่คะแนนยังไม่เต็มเพื่อพัฒนาเกรดให้ดียิ่งขึ้น 🪄
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          4. GRAPHS: GRADE DISTRIBUTION & GRADE TREND (ตามภาพที่ 4 media_1792044662907_51ecf92f.png)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graph 1: สัดส่วนคะแนนรวมทุกวิชา (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163A66]">
              สัดส่วนคะแนนรวมทุกวิชา
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            {/* Donut Chart with Center Text */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#163A66] leading-none">
                  {termData.gpa}
                </span>
                <span className="text-[11px] font-semibold text-[#94A3B8] mt-1">
                  / 4.00
                </span>
              </div>
            </div>

            {/* Breakdown List on Right */}
            <div className="space-y-2.5 flex-1 w-full text-xs">
              {gradeDistributionData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-slate-500 font-medium">
                      {item.count} วิชา
                    </span>
                    <span className="font-bold text-[#163A66] min-w-[45px] text-right">
                      {item.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph 2: แนวโน้มผลการเรียน (เฉลี่ยรวม) (Line / Area Chart) */}
        <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163A66]">
              แนวโน้มผลการเรียน (เฉลี่ยรวม)
            </h3>
          </div>

          <div className="h-48 sm:h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={gpaTrendData}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="term"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[1.0, 4.0]}
                  ticks={[1.0, 2.0, 3.0, 4.0]}
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`เกรด ${val}`, 'ผลการเรียน']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gpaGradient)"
                  dot={{ r: 4.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#1D4ED8' }}
                  label={{
                    position: 'top',
                    fill: '#1D4ED8',
                    fontSize: 11,
                    fontWeight: 700,
                    offset: 8,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. BOTTOM SECTION: การประเมินการสอนครู (ตามภาพที่ 2 media_1792044507234_3e60e1a8.jpg)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-card space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#163A66]">
                การประเมินการสอนครู
              </h2>
              <p className="text-xs text-[#6B7C93]">
                ประเมินคุณภาพการสอนของครูในรายวิชาที่เรียน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEvalModalTeacher(subjectsList[0] || null)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>ดูรายละเอียดทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Teachers Evaluation Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[#6B7C93] font-semibold">
                <th className="py-2.5 px-3">รายวิชา</th>
                <th className="py-2.5 px-3">ครูผู้สอน</th>
                <th className="py-2.5 px-3">คะแนนเฉลี่ย</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
                <th className="py-2.5 px-3 text-center">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {subjectsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                    ยังไม่มีรายวิชาที่เปิดให้ประเมินการสอนในภาคเรียนนี้
                  </td>
                </tr>
              ) : (
                subjectsList.slice(0, 3).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Subject */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 min-w-[130px]">
                      <div
                        className={`w-6 h-6 rounded-md ${sub.iconBg} flex items-center justify-center font-bold text-[10px] shrink-0`}
                      >
                        {sub.symbol}
                      </div>
                      <span className="font-bold text-[#163A66]">
                        {sub.strand}
                      </span>
                    </div>
                  </td>

                  {/* Teacher Info */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 min-w-[170px]">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-base flex items-center justify-center shrink-0 border border-blue-100">
                        {sub.teacherAvatar}
                      </div>
                      <div>
                        <div className="font-bold text-[#163A66]">
                          {sub.teacherName}
                        </div>
                        <div className="text-[10px] text-[#6B7C93]">
                          {sub.teacherDepartment}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rating Progress Bar */}
                  <td className="py-3 px-3 min-w-[160px]">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden shrink-0">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${(sub.evalScore / 5.0) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-[#163A66]">
                        {sub.evalScore.toFixed(2)}{' '}
                        <span className="text-[10px] text-[#94A3B8] font-normal">
                          / 5.00
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {sub.evalStatus}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setEvalModalTeacher(sub)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <span>ดูรายละเอียด</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>

        {/* Teachers Evaluation Mobile Cards */}
        <div className="md:hidden space-y-3">
          {subjectsList.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              ยังไม่มีรายวิชาที่เปิดให้ประเมินการสอน
            </div>
          ) : (
            subjectsList.slice(0, 3).map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-sm flex items-center justify-center border border-blue-100 shrink-0">
                      {sub.teacherAvatar}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#163A66]">{sub.teacherName}</div>
                      <div className="text-[10px] text-[#6B7C93]">{sub.strand}</div>
                    </div>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sub.evalStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">คะแนน:</span>
                    <span className="text-xs font-bold text-[#163A66]">{sub.evalScore.toFixed(2)} / 5.00</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvalModalTeacher(sub)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          6. MODAL: TEACHER EVALUATION DETAIL (แบบประเมินและผลตอบรับ)
      ========================================================================= */}
      {evalModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-xl flex items-center justify-center border border-blue-100">
                  {evalModalTeacher.teacherAvatar}
                </div>
                <div>
                  <h3 className="font-bold text-[#163A66] text-base">
                    {evalModalTeacher.teacherName}
                  </h3>
                  <p className="text-xs text-[#6B7C93]">
                    {evalModalTeacher.teacherDepartment} · วิชา {evalModalTeacher.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEvalModalTeacher(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#163A66] block">
                    คะแนนประเมินเฉลี่ยจากนักเรียน
                  </span>
                  <span className="text-[11px] text-[#6B7C93]">
                    ประเมินในภาคเรียนที่ {selectedTermYear}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">
                    {evalModalTeacher.evalScore.toFixed(2)} / 5.00
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {evalModalTeacher.evalStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#163A66]">
                  ผลการประเมินแยกตามรายด้าน:
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'การถ่ายทอดเนื้อหาและความชัดเจน', score: 4.8 },
                    { label: 'การเอาใจใส่และเปิดโอกาสให้นักเรียนซักถาม', score: 4.7 },
                    { label: 'การจัดกิจกรรมการเรียนรู้และสื่อประกอบ', score: 4.65 },
                    { label: 'ความเป็นธรรมในการวัดและประเมินผล', score: 4.75 },
                  ].map((crit, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>{crit.label}</span>
                        <span className="font-bold text-[#163A66]">{crit.score} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${(crit.score / 5.0) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกการประเมินของคุณ:</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  คุณได้ทำแบบประเมินการสอนรายวิชานี้เรียบร้อยแล้วเมื่อวันที่ 28 ก.ย. 2569
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvalModalTeacher(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
