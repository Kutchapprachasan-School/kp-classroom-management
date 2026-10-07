import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Users,
  BookOpen,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../../services/sgsRosterAndSubmissionService';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';

interface SgsClassroomMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectCode?: string;
  defaultRoom?: string;
}

export const SgsClassroomMatrixModal: React.FC<SgsClassroomMatrixModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectCode = 'ศ23101',
  defaultRoom = 'ม.3/1',
}) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(defaultSubjectCode);
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentSubject = useMemo(() => {
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

  const submissions: StudentWorkSubmission[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getSubmissions();
  }, []);

  const filteredStudents = useMemo(() => {
    return roster.filter((stu) => {
      if (stu.transferState === 'TRANSFERRED_OUT') return false;
      if (selectedRoom && stu.classroom !== selectedRoom) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          stu.studentName.toLowerCase().includes(q) ||
          stu.studentCode.includes(q) ||
          String(stu.sgsSeatNo) === q
        );
      }
      return true;
    });
  }, [roster, selectedRoom, searchTerm]);

  // Total max score across all term assignments
  const totalMaxScore = useMemo(() => {
    return termAssignments.reduce((sum, a) => sum + a.maxScore, 0);
  }, [termAssignments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  สมุดคะแนนรายชั้น (Classroom Score Matrix)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  ระบบคะแนน ปพ.5 / SGS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ดูผลคะแนนรวมรายบุคคลและคะแนนเก็บแต่ละหน่วยการเรียนรู้ ชั้น {selectedRoom}
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

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <label htmlFor="sgs-subj-sel" className="text-xs font-semibold text-slate-500">
                วิชา:
              </label>
              <select
                id="sgs-subj-sel"
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
              <label htmlFor="sgs-room-sel" className="text-xs font-semibold text-slate-500">
                ชั้น/ห้อง:
              </label>
              <select
                id="sgs-room-sel"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {currentSubject.classrooms.map((rm) => (
                  <option key={rm} value={rm}>
                    ห้อง {rm}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Room Buttons */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-bold">
              {currentSubject.classrooms.map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => setSelectedRoom(rm)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedRoom === rm
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rm}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, เลขที่ หรือรหัส..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-14">เลขที่</th>
                  <th className="py-3 px-3 w-20">รหัส นร.</th>
                  <th className="py-3 px-4 min-w-[170px]">ชื่อ-สกุล</th>
                  {termAssignments.map((asg) => (
                    <th key={asg.id} className="py-3 px-3 text-center min-w-[110px]">
                      <div className="font-bold text-slate-900 truncate max-w-[120px]" title={asg.title}>
                        {asg.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        เต็ม {asg.maxScore}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[100px] bg-blue-50/70 text-blue-900">
                    <div className="font-extrabold">รวมทั้งหมด</div>
                    <div className="text-[10px] font-medium text-blue-600">เต็ม {totalMaxScore}</div>
                  </th>
                  <th className="py-3 px-3 text-center w-20">เกรดเฉลี่ย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={termAssignments.length + 5} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลนักเรียนในห้อง {selectedRoom}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => {
                    let studentTotalScore = 0;

                    return (
                      <tr key={stu.studentCode} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                          {stu.sgsSeatNo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {stu.studentCode}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {stu.studentName}
                        </td>
                        {termAssignments.map((asg) => {
                          const sub = submissions.find(
                            (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                          );
                          const score = sub?.score ?? (sub?.status === 'GRADED' ? asg.maxScore : null);
                          if (score !== null && score !== undefined) {
                            studentTotalScore += score;
                          }

                          return (
                            <td key={asg.id} className="py-2.5 px-3 text-center">
                              {score !== null && score !== undefined ? (
                                <span className="font-bold text-slate-800 tabular-nums">
                                  {score}
                                </span>
                              ) : sub?.status === 'SUBMITTED_PENDING' ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                  รอตรวจ
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Score Column */}
                        <td className="py-2.5 px-3 text-center bg-blue-50/40 font-extrabold text-blue-900 tabular-nums">
                          {studentTotalScore} / {totalMaxScore}
                        </td>

                        {/* Approximate Grade */}
                        <td className="py-2.5 px-3 text-center">
                          {(() => {
                            const percent = (studentTotalScore / (totalMaxScore || 1)) * 100;
                            if (percent >= 80) {
                              return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">4.0</span>;
                            } else if (percent >= 75) {
                              return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">3.5</span>;
                            } else if (percent >= 70) {
                              return <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">3.0</span>;
                            } else if (percent >= 60) {
                              return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">2.0</span>;
                            } else {
                              return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">1.0</span>;
                            }
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>คะแนนซิงค์กับฐานข้อมูล SGS และระบบผลการเรียน SAR อัตโนมัติ</span>
          </div>
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
