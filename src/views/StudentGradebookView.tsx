// src/views/StudentGradebookView.tsx
// สมุดคะแนนและสถิติการเรียนรู้ของนักเรียน เชื่อมโยงกับหลักสูตรสถานศึกษา (Curriculum Connected Gradebook)
// ออกแบบตามระบบ Pastel Anime Education Dashboard (Prompt Font, Primary #3B82F6)

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Calendar,
  MessageSquare,
  Award,
  Layers,
  ChevronDown,
  Check,
  GraduationCap,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { AuthUser } from '../services/authService';
import type { SchoolSettingsConfig } from '../config/schoolSettings';
import { getSchoolSettings } from '../config/schoolSettings';
import { cleanSlateService } from '../services/cleanSlateService';
import {
  coursesCurriculumService,
  type CourseCurriculumRecord,
} from '../services/coursesCurriculumService';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';

interface StudentGradebookViewProps {
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentGradebookView: React.FC<StudentGradebookViewProps> = ({
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentRoom = currentUser?.classroomId || 'ม.3/1';
  const studentName = currentUser?.name || 'ด.ช. กฤษณะ ศรีสมบูรณ์';
  const studentCode =
    (currentUser as any)?.code || (currentUser as any)?.studentCode || '45101';
  const isClean = cleanSlateService.isCleanSlateActive();

  // 1. Load Curriculum Courses
  const [courses, setCourses] = useState<CourseCurriculumRecord[]>(() =>
    coursesCurriculumService.getCourses()
  );

  // Available courses for this student's room
  const availableCourses = useMemo(() => {
    const matched = courses.filter(
      (c) =>
        c.assignedClassrooms?.includes(studentRoom) ||
        c.assignedClassrooms?.includes(studentRoom.replace('ห้อง ', ''))
    );
    return matched.length > 0 ? matched : courses;
  }, [courses, studentRoom]);

  // Selected Course
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return availableCourses[0]?.id || courses[0]?.id || '';
  });

  // Listen to curriculum updates
  useEffect(() => {
    const handleSync = () => {
      const updated = coursesCurriculumService.getCourses();
      setCourses(updated);
    };
    window.addEventListener('kp-courses-curriculum-updated', handleSync);
    return () => window.removeEventListener('kp-courses-curriculum-updated', handleSync);
  }, []);

  const activeCourse: CourseCurriculumRecord | undefined = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || availableCourses[0] || courses[0];
  }, [courses, availableCourses, selectedCourseId]);

  // 2. Load SGS Roster & Submissions
  const [sgsRoster, setSgsRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [assignments, setAssignments] = useState<TermAssignmentItem[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );
  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );

  useEffect(() => {
    const handleRosterUpdate = () => {
      setSgsRoster(sgsRosterAndSubmissionService.getSgsRoster());
      setAssignments(sgsRosterAndSubmissionService.getTermAssignments());
      setSubmissions(sgsRosterAndSubmissionService.getSubmissions());
    };
    window.addEventListener('kp-sgs-roster-updated', handleRosterUpdate);
    window.addEventListener('kp-copilot-updated', handleRosterUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleRosterUpdate);
      window.removeEventListener('kp-copilot-updated', handleRosterUpdate);
    };
  }, []);

  // Student's specific SGS record
  const currentStudentSgs = useMemo(() => {
    return (
      sgsRoster.find((s) => s.studentCode === studentCode) ||
      sgsRoster.find((s) => s.classroom === studentRoom) ||
      sgsRoster[0]
    );
  }, [sgsRoster, studentCode, studentRoom]);

  // 3. Compute Unit Breakdown & Scores
  const unitBreakdown = useMemo(() => {
    if (!activeCourse || !activeCourse.units) return [];

    return activeCourse.units.map((unit) => {
      // Find assignments mapped to this unit (u1, u2, u3)
      const unitKey = `u${unit.unitNo}` as 'u1' | 'u2' | 'u3';
      const unitAssignments = assignments.filter((a) => a.sgsUnit === unitKey);

      let earnedScore = 0;
      let totalAssignmentMax = 0;

      if (unitAssignments.length > 0) {
        unitAssignments.forEach((asg) => {
          totalAssignmentMax += asg.maxScore;
          const sub = submissions.find(
            (s) => s.assignmentId === asg.id && s.studentCode === currentStudentSgs?.studentCode
          );
          if (sub && typeof sub.score === 'number') {
            earnedScore += sub.score;
          }
        });
        // Scale to curriculum unit maxScore
        if (totalAssignmentMax > 0 && totalAssignmentMax !== unit.maxScore) {
          earnedScore = (earnedScore / totalAssignmentMax) * unit.maxScore;
        }
      } else {
        earnedScore = 0;
      }

      earnedScore = Math.min(unit.maxScore, Math.max(0, earnedScore));

      return {
        unit,
        assignments: unitAssignments,
        earnedScore: Math.round(earnedScore * 10) / 10,
        maxScore: unit.maxScore,
        percent: unit.maxScore > 0 ? Math.round((earnedScore / unit.maxScore) * 100) : 0,
      };
    });
  }, [activeCourse, assignments, submissions, currentStudentSgs]);

  // Midterm & Final scores
  const midtermScore =
    currentStudentSgs?.midtermScore !== undefined ? currentStudentSgs.midtermScore : 0;
  const finalScore =
    currentStudentSgs?.finalScore !== undefined ? currentStudentSgs.finalScore : 0;

  // Total Formative (Units) Score
  const totalUnitsScore = unitBreakdown.reduce((sum, u) => sum + u.earnedScore, 0);
  const totalUnitsMax = unitBreakdown.reduce((sum, u) => sum + u.maxScore, 0);

  // Grand Total Score (out of 100)
  const grandTotalScore = Math.min(
    100,
    Math.round((totalUnitsScore + midtermScore + finalScore) * 10) / 10
  );

  // Compute Grade Point (0.0 - 4.0)
  const gradeInfo = useMemo(() => {
    if (grandTotalScore === 0) {
      return { gpa: '-', label: 'รอดำเนินการประเมิน', color: 'text-slate-400', badgeBg: 'bg-slate-100 text-slate-600' };
    }
    if (grandTotalScore >= 80) {
      return { gpa: '4.0', label: 'ผลการเรียนดีเยี่ยม (A)', color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (grandTotalScore >= 75) {
      return { gpa: '3.5', label: 'ผลการเรียนดีมาก (B+)', color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (grandTotalScore >= 70) {
      return { gpa: '3.0', label: 'ผลการเรียนดี (B)', color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (grandTotalScore >= 65) {
      return { gpa: '2.5', label: 'ผลการเรียนค่อนข้างดี (C+)', color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (grandTotalScore >= 60) {
      return { gpa: '2.0', label: 'ผลการเรียนน่าพอใจ (C)', color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (grandTotalScore >= 55) {
      return { gpa: '1.5', label: 'ผลการเรียนพอใช้ (D+)', color: 'text-rose-500', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (grandTotalScore >= 50) {
      return { gpa: '1.0', label: 'ผ่านเกณฑ์ขั้นต่ำ (D)', color: 'text-rose-500', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { gpa: '0.0', label: 'ต่ำกว่าเกณฑ์ (F)', color: 'text-rose-600', badgeBg: 'bg-rose-100 text-rose-800 border-rose-300' };
  }, [grandTotalScore]);

  // Attendance rate
  const attendanceRate =
    currentStudentSgs?.attendancePercent !== undefined
      ? currentStudentSgs.attendancePercent
      : 100;

  // Radar chart data based on student performance
  const radarData = useMemo(() => {
    if (grandTotalScore === 0) {
      return [
        { subject: 'คะแนนเก็บ', student: 0, classAvg: 0 },
        { subject: 'คะแนนสอบ', student: 0, classAvg: 0 },
        { subject: 'ส่งงานตรงเวลา', student: 0, classAvg: 0 },
        { subject: 'เวลาเรียน', student: Math.round(attendanceRate), classAvg: 100 },
        { subject: 'พฤติกรรม', student: 100, classAvg: 100 },
      ];
    }
    const unitsPercent = totalUnitsMax > 0 ? Math.round((totalUnitsScore / totalUnitsMax) * 100) : 0;
    const examPercent = Math.round(((midtermScore + finalScore) / 50) * 100);
    return [
      { subject: 'คะแนนเก็บ', student: unitsPercent, classAvg: 75 },
      { subject: 'คะแนนสอบ', student: examPercent, classAvg: 70 },
      { subject: 'ส่งงานตรงเวลา', student: unitsPercent, classAvg: 75 },
      { subject: 'เวลาเรียน', student: Math.round(attendanceRate), classAvg: 90 },
      { subject: 'พฤติกรรม', student: 100, classAvg: 90 },
    ];
  }, [grandTotalScore, totalUnitsScore, totalUnitsMax, midtermScore, finalScore, attendanceRate]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-['Prompt',sans-serif] text-slate-800 select-none">
      {/* Header & Course Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-2xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                สมุดคะแนนและสถิติการเรียนรู้
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                หลักสูตรสถานศึกษา
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {studentName} (รหัส {studentCode}) · ห้อง {studentRoom} · {settings.nameTh}
            </p>
          </div>
        </div>

        {/* Dynamic Course Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold text-blue-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-2xs"
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  📚 {c.code} {c.name} ({c.credits} นก. • เทอม {c.term}/{c.academicYear})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-blue-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Selected Course Metadata Banner */}
      {activeCourse && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 font-extrabold rounded-lg shadow-2xs text-sm">
              {activeCourse.code}
            </span>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">{activeCourse.name}</div>
              <div className="text-slate-500 text-[11px]">
                กลุ่มสาระการเรียนรู้{activeCourse.strand || 'วิชาการ'} · ผู้สอน: {activeCourse.teacherName || 'ครูปัญจพล แสงทอง'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-white/80 rounded-lg text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
              ⭐ {activeCourse.credits} หน่วยกิต ({activeCourse.periodsPerWeek} คาบ/สัปดาห์)
            </span>
            <span className="px-2.5 py-1 bg-white/80 rounded-lg text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
              📅 ภาคเรียนที่ {activeCourse.term}/{activeCourse.academicYear}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>เวลาเรียน {attendanceRate}% (ผ่านเกณฑ์ มส.)</span>
            </span>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Grade Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">เกรดเฉลี่ยคาดการณ์</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${gradeInfo.color}`}>
              {gradeInfo.gpa}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({grandTotalScore} / 100 คะแนน)
            </span>
          </div>
          <div className="mt-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${gradeInfo.badgeBg}`}>
              {gradeInfo.label}
            </span>
          </div>
        </div>

        {/* 2. Formative Units Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">คะแนนเก็บระหว่างภาค (Units)</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-600">
              {totalUnitsScore}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {totalUnitsMax} คะแนน
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            จากแบบฝึกหัดและการประเมิน {unitBreakdown.length} หน่วยการเรียนรู้
          </div>
        </div>

        {/* 3. Midterm & Final Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">คะแนนสอบกลาง / ปลายภาค</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-600">
              {midtermScore + finalScore}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / 50 คะแนน
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            กลางภาค: {midtermScore}/20 · ปลายภาค: {finalScore}/30
          </div>
        </div>

        {/* 4. Attendance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">สถิติเวลาเรียน</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (เกณฑ์ 80%)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>มีสิทธิ์สอบไล่ปลายภาคเรียบร้อย</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Curriculum Unit Breakdown Table & Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Curriculum Units Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
                <span>โครงสร้างคะแนนตามหลักสูตร (Curriculum Breakdown)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เชื่อมโยงหน่วยการเรียนรู้ ตัวชี้วัด และการเก็บคะแนนจริงในห้องเรียน
              </p>
            </div>
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              รวม 100 คะแนน
            </span>
          </div>

          {/* Unit List */}
          <div className="space-y-3">
            {unitBreakdown.map((item) => (
              <div
                key={item.unit.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/30 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700">
                        หน่วยที่ {item.unit.unitNo}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">
                        {item.unit.title}
                      </h3>
                    </div>
                    {item.unit.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {item.unit.description}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      ตัวชี้วัด SGS: {item.unit.sgsRef || `มฐ. ตัวชี้วัดหน่วยที่ ${item.unit.unitNo}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-blue-600">
                      {item.earnedScore}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {item.maxScore}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.percent}% ของหน่วย
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.percent)}%` }}
                  />
                </div>

                {/* Submissions in this unit if any */}
                {item.assignments.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/40 text-[11px] text-slate-500 space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 block">
                      ชิ้นงาน/แบบทดสอบในหน่วยนี้:
                    </span>
                    {item.assignments.map((asg) => {
                      const sub = submissions.find(
                        (s) =>
                          s.assignmentId === asg.id &&
                          s.studentCode === currentStudentSgs?.studentCode
                      );
                      const isGraded = sub && typeof sub.score === 'number';
                      return (
                        <div
                          key={asg.id}
                          className="flex items-center justify-between py-0.5 pl-2 border-l-2 border-blue-200 text-[10px]"
                        >
                          <span className="truncate max-w-[200px] text-slate-700">
                            • {asg.title}
                          </span>
                          <span
                            className={`font-semibold ${
                              isGraded ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {isGraded ? `${sub.score} / ${asg.maxScore}` : `รอตรวจ (${asg.maxScore} คะแนน)`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Midterm Row */}
            <div className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  กลาง
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    การประเมินผลกลางภาคเรียน (Midterm Examination)
                  </h3>
                  <p className="text-[10px] text-emerald-800">
                    ทดสอบวัดผลสัมฤทธิ์ตามตัวชี้วัดครึ่งภาคเรียนแรก
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-emerald-700">
                  {midtermScore}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 20</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">ประเมินแล้ว</span>
              </div>
            </div>

            {/* Final Exam Row */}
            <div className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  ปลาย
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    การประเมินผลปลายภาคเรียน (Final Examination)
                  </h3>
                  <p className="text-[10px] text-amber-800">
                    ทดสอบวัดผลสัมฤทธิ์รวบยอดปลายภาคเรียน
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-amber-700">
                  {finalScore}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 30</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600">ประเมินแล้ว</span>
              </div>
            </div>

            {/* Total Grand Summary Bar */}
            <div className="p-4 rounded-2xl bg-blue-600 text-white flex items-center justify-between shadow-xs">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-100">
                  คะแนนรวมสุทธิ (Grand Total Score)
                </div>
                <div className="text-xs text-blue-200 mt-0.5">
                  คะแนนเก็บ {totalUnitsScore} + กลางภาค {midtermScore} + ปลายภาค {finalScore}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {grandTotalScore} / 100
                </div>
                <div className="text-xs font-bold text-blue-100">
                  เกรด {gradeInfo.gpa}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Radar Chart & Competencies */}
        <div className="lg:col-span-5 space-y-4">
          {/* Radar Analysis */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                <span>มิติสมรรถนะการเรียนรู้ (Radar Chart)</span>
              </h2>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Radar
                    name="คะแนนเฉลี่ยห้อง"
                    dataKey="classAvg"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="คะแนนของคุณ"
                    dataKey="student"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>การวิเคราะห์สมรรถนะผู้เรียน:</span>
              </span>
              <p className="text-blue-700 leading-relaxed text-[11px]">
                {grandTotalScore >= 75
                  ? `จุดเด่นของ ${studentName} คือการทำคะแนนเก็บในหน่วยการเรียนรู้ และเวลาเรียนสะสมที่สม่ำเสมอ ขอให้รักษามาตรฐานนี้เพื่อเกียรตินิยม!`
                  : `ความตั้งใจเรียนดีมาก ทบทวนเนื้อหาหน่วยที่คะแนนยังไม่เต็มเพื่อพัฒนาเกรดให้ดียิ่งขึ้น ✨`}
              </p>
            </div>
          </div>

          {/* Attendance Stats Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>สถิติการมาเรียน (ภาคเรียนปัจจุบัน)</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-emerald-700 font-bold text-lg">{isClean ? '0' : '36'}</div>
                <div className="text-[10px] text-emerald-600">มาเรียนปกติ</div>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-amber-700 font-bold text-lg">0</div>
                <div className="text-[10px] text-amber-600">มาสาย</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-blue-700 font-bold text-lg">0</div>
                <div className="text-[10px] text-blue-600">ลากิจ/ลาป่วย</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 font-bold text-lg">0</div>
                <div className="text-[10px] text-slate-400">ขาดเรียน</div>
              </div>
            </div>
          </div>

          {/* Teacher Feedback Note */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>บันทึกความเห็นจากคุณครูผู้สอน</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs text-slate-700 italic leading-relaxed">
                {isClean
                  ? `ยินดีต้อนรับ ${studentName} สู่ภาคเรียนใหม่ ขอให้นักเรียนมีความมุ่งมั่น ตั้งใจเรียน และประสบความสำเร็จในการเรียนรู้ทุกรายวิชาครับ ✨`
                  : `"${studentName} มีความตั้งใจและมีระเบียบวินัยดีมากในการเรียนรู้ ส่งงานครบถ้วน และมีส่วนร่วมในชั้นเรียน ขอให้รักษามาตรฐานความตั้งใจนี้ต่อไปครับ"`}
              </p>
              <div className="text-right text-[10px] text-slate-400 font-medium">
                — {activeCourse?.teacherName || 'ครูปัญจพล แสงทอง'} (ครูประจำวิชา {activeCourse?.code})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
