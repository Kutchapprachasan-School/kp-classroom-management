import React, { useState, useMemo } from 'react';
import {
  X,
  CheckSquare,
  Users,
  BookOpen,
  Search,
  Check,
  Eye,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../../services/sgsRosterAndSubmissionService';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';

interface Submission3ColorMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectCode?: string;
  defaultRoom?: string;
  onOpenPreview?: (preview: {
    title: string;
    studentName: string;
    studentCode?: string;
    classroom?: string;
    seatNo?: number;
    type: 'IMAGE' | 'PDF' | 'LINK';
    url?: string;
    fileName?: string;
    platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'YOUTUBE' | 'FIGMA' | 'OTHER';
  }) => void;
  onGradeQuick?: (assignmentId: string, studentCode: string, maxScore: number) => void;
}

export const Submission3ColorMatrixModal: React.FC<Submission3ColorMatrixModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectCode = 'ศ23101',
  defaultRoom = 'ม.3/1',
  onOpenPreview,
  onGradeQuick,
}) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(defaultSubjectCode);
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom);
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  const currentSubjectInfo = useMemo(() => {
    return (
      TEACHER_SUBJECTS_LIST.find((s) => s.code === selectedSubjectCode) ||
      TEACHER_SUBJECTS_LIST[0]
    );
  }, [selectedSubjectCode]);

  const roster: SgsStudentRecord[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getSgsRoster();
  }, []);

  const termAssignments: TermAssignmentItem[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getTermAssignments();
  }, []);

  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );

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

  const handleMarkSubmitted = (assignmentId: string, studentCode: string, maxScore: number) => {
    sgsRosterAndSubmissionService.gradeSubmission(assignmentId, studentCode, maxScore, 'GRADED');
    setSubmissions([...sgsRosterAndSubmissionService.getSubmissions()]);
    if (onGradeQuick) {
      onGradeQuick(assignmentId, studentCode, maxScore);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-50/80 via-white to-sky-50/50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  ตารางเช็คส่งงานรายห้อง (3 สีชัดเจน)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  3-Color Matrix
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ติดตามการส่งงานแบบภาพรวมรายห้อง: 🔴 สีแดง (ยังไม่ส่ง) | 🟠 สีส้ม (รอตรวจ) | 🟢 สีเขียว (ตรวจแล้ว)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & 3-Color Badges */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
              <label htmlFor="matrix-subj-sel" className="text-xs font-semibold text-slate-500">
                วิชา:
              </label>
              <select
                id="matrix-subj-sel"
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {TEACHER_SUBJECTS_LIST.map((subj) => (
                  <option key={subj.code} value={subj.code}>
                    {subj.code} {subj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <label htmlFor="matrix-room-sel" className="text-xs font-semibold text-slate-500">
                ห้อง:
              </label>
              <select
                id="matrix-room-sel"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {currentSubjectInfo.classrooms.map((rm) => (
                  <option key={rm} value={rm}>
                    ห้อง {rm}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Room Buttons */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-bold">
              {currentSubjectInfo.classrooms.map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => setSelectedRoom(rm)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedRoom === rm
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rm}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Color Legend Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>🔴 ยังไม่ส่ง ({matrixStats.missingTotal})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>🟠 รอตรวจ ({matrixStats.pendingTotal})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>🟢 ส่งแล้ว ({matrixStats.gradedTotal})</span>
            </span>
          </div>
        </div>

        {/* Search inside matrix */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, เลขที่ หรือรหัส..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-bold">
            แสดงนักเรียน {activeStudents.length} คน
          </span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 w-20">รหัส</th>
                  <th className="py-2.5 px-3 min-w-[160px]">ชื่อ-นามสกุล</th>
                  {termAssignments.map((asg) => (
                    <th key={asg.id} className="py-2.5 px-3 text-center min-w-[130px]">
                      <div className="font-bold text-slate-900">{asg.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        เต็ม {asg.maxScore} คะแนน
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center min-w-[100px]">สถานะรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {activeStudents.map((stu) => {
                  let studentMissingCount = 0;
                  let studentPendingCount = 0;

                  return (
                    <tr key={stu.studentCode} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {stu.sgsSeatNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {stu.studentCode}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {stu.studentName}
                      </td>

                      {/* Assignment Cells (3 Colors strictly) */}
                      {termAssignments.map((asg) => {
                        const sub = submissions.find(
                          (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                        );
                        const isMissing = !sub || sub.status === 'MISSING';
                        const isPending = sub?.status === 'SUBMITTED_PENDING';

                        if (isMissing) studentMissingCount++;
                        if (isPending) studentPendingCount++;

                        return (
                          <td key={asg.id} className="py-1.5 px-2 text-center">
                            {isMissing ? (
                              // 🔴 สีแดง: ยังไม่ส่ง (คลิกเพื่อบันทึกส่งด่วนได้)
                              <button
                                type="button"
                                onClick={() => handleMarkSubmitted(asg.id, stu.studentCode, asg.maxScore)}
                                title="คลิกเพื่อให้คะแนนส่งงานด่วน"
                                className="w-full py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3 text-rose-500" />
                                <span>ยังไม่ส่ง</span>
                              </button>
                            ) : isPending ? (
                              // 🟠 สีส้ม: รอตรวจ (มีปุ่ม Preview ทันที)
                              <button
                                type="button"
                                onClick={() => {
                                  const isCanva = (sub?.workTitle || '').includes('Canva');
                                  const isPdf = (sub?.workTitle || '').endsWith('.pdf');
                                  if (onOpenPreview) {
                                    onOpenPreview({
                                      title: asg.title,
                                      studentName: stu.studentName,
                                      studentCode: stu.studentCode,
                                      classroom: selectedRoom,
                                      seatNo: stu.sgsSeatNo,
                                      type: isCanva ? 'LINK' : isPdf ? 'PDF' : 'IMAGE',
                                      url: isCanva ? 'https://www.canva.com/design/DAFkutchap-art3/view' : undefined,
                                      fileName: sub?.workTitle || `${asg.title}_${stu.studentName}`,
                                      platform: isCanva ? 'CANVA' : undefined,
                                    });
                                  }
                                }}
                                title="คลิกเพื่อตรวจดูงาน"
                                className="w-full py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>รอตรวจ 👁️</span>
                              </button>
                            ) : (
                              // 🟢 สีเขียว: ส่งแล้ว / ตรวจแล้ว
                              <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>
                                  {sub?.score ?? asg.maxScore}/{asg.maxScore}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary Status Column */}
                      <td className="py-2.5 px-3 text-center">
                        {studentMissingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            ค้าง {studentMissingCount} ชิ้น
                          </span>
                        ) : studentPendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            รอตรวจ {studentPendingCount} ชิ้น
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>คลิกที่ปุ่ม [ยังไม่ส่ง] เพื่อเช็คส่งงานด่วน หรือคลิก [รอตรวจ] เพื่อดูพรีวิวผลงาน</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
