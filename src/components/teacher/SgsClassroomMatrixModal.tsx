import React, { useState, useMemo, useEffect } from 'react';
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
  isSameClassroom,
  matchSubmissionToAssignment,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../../services/sgsRosterAndSubmissionService';
import { getDynamicTeachingSubjects } from '../../services/teacherCourseAssignmentService';

interface SgsClassroomMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectCode?: string;
  defaultRoom?: string;
}

export const SgsClassroomMatrixModal: React.FC<SgsClassroomMatrixModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectCode = '',
  defaultRoom = '',
}) => {
  const [version, setVersion] = useState<number>(0);

  const teachingSubjects = useMemo(() => {
    return getDynamicTeachingSubjects();
  }, [isOpen, version]);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(() => {
    if (defaultSubjectCode && teachingSubjects.some((s) => s.code === defaultSubjectCode)) {
      return defaultSubjectCode;
    }
    return teachingSubjects[0]?.code || '';
  });

  const currentSubject = useMemo(() => {
    const found = teachingSubjects.find((s) => s.code === selectedSubjectCode);
    if (found) return found;
    return {
      code: selectedSubjectCode,
      name: selectedSubjectCode,
      classrooms: defaultRoom && defaultRoom !== 'ALL' ? [defaultRoom] : ['ม.1/1'],
    };
  }, [selectedSubjectCode, teachingSubjects, defaultRoom]);

  const [selectedRoom, setSelectedRoom] = useState<string>(() => {
    if (defaultRoom && defaultRoom !== 'ALL') return defaultRoom;
    return currentSubject?.classrooms?.[0] || 'ม.1/1';
  });

  const availableRooms = useMemo(() => {
    const set = new Set<string>();
    if (currentSubject?.classrooms) {
      currentSubject.classrooms.forEach((r) => {
        if (r && r !== 'ALL') set.add(r);
      });
    }
    if (defaultRoom && defaultRoom !== 'ALL') set.add(defaultRoom);
    if (selectedRoom && selectedRoom !== 'ALL') set.add(selectedRoom);
    return Array.from(set);
  }, [currentSubject, defaultRoom, selectedRoom]);

  React.useEffect(() => {
    if (defaultSubjectCode) setSelectedSubjectCode(defaultSubjectCode);
    if (defaultRoom && defaultRoom !== 'ALL') setSelectedRoom(defaultRoom);
  }, [defaultSubjectCode, defaultRoom, isOpen]);

  React.useEffect(() => {
    const validClassrooms = (currentSubject?.classrooms || []).filter((r) => r && r !== 'ALL');
    if (validClassrooms.length > 0 && (!selectedRoom || selectedRoom === 'ALL' || !validClassrooms.includes(selectedRoom))) {
      setSelectedRoom(validClassrooms[0]);
    }
  }, [selectedSubjectCode, currentSubject, selectedRoom]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('kp-sgs-roster-updated', handleUpdate);
    window.addEventListener('kp-grading-queue-updated', handleUpdate);
    window.addEventListener('kp:sgs-score-bridged', handleUpdate);
    return () => {
      window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
      window.removeEventListener('kp-grading-queue-updated', handleUpdate);
      window.removeEventListener('kp:sgs-score-bridged', handleUpdate);
    };
  }, [isOpen]);

  const roster: SgsStudentRecord[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getSgsRoster(selectedRoom);
  }, [selectedRoom, isOpen, version]);

  const termAssignments: TermAssignmentItem[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getTermAssignments(
      selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode,
      selectedRoom
    );
  }, [selectedSubjectCode, selectedRoom, isOpen, version]);

  const submissions: StudentWorkSubmission[] = useMemo(() => {
    return sgsRosterAndSubmissionService.getSubmissions();
  }, [isOpen, version]);

  const filteredStudents = useMemo(() => {
    return roster
      .filter((stu) => {
        if (stu.transferState === 'TRANSFERRED_OUT') return false;
        if (selectedRoom && !isSameClassroom(stu.classroom, selectedRoom)) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          return (
            stu.studentName.toLowerCase().includes(q) ||
            stu.studentCode.includes(q) ||
            String(stu.sgsSeatNo) === q
          );
        }
        return true;
      })
      .sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999));
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
                {teachingSubjects.map((subj) => (
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
                {availableRooms.map((rm) => (
                  <option key={rm} value={rm}>
                    ห้อง {rm}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Room Buttons */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-bold">
              {availableRooms.map((rm) => (
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
                          const cleanStuCode = String(stu.studentCode).trim();
                          const sub = submissions.find(
                            (s) =>
                              String(s.studentCode).trim() === cleanStuCode &&
                              matchSubmissionToAssignment(s, asg)
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

                        {/* Approximate Grade (สพฐ. 8 ระดับ) */}
                        <td className="py-2.5 px-3 text-center">
                          {(() => {
                            const roundedPercent = Math.round((studentTotalScore / (totalMaxScore || 1)) * 100);
                            let gradeLabel = '0';
                            let badgeStyle = 'bg-rose-100 text-rose-800';

                            if (roundedPercent >= 80) {
                              gradeLabel = '4';
                              badgeStyle = 'bg-emerald-100 text-emerald-800';
                            } else if (roundedPercent >= 75) {
                              gradeLabel = '3.5';
                              badgeStyle = 'bg-emerald-50 text-emerald-700';
                            } else if (roundedPercent >= 70) {
                              gradeLabel = '3';
                              badgeStyle = 'bg-blue-100 text-blue-800';
                            } else if (roundedPercent >= 65) {
                              gradeLabel = '2.5';
                              badgeStyle = 'bg-teal-100 text-teal-800';
                            } else if (roundedPercent >= 60) {
                              gradeLabel = '2';
                              badgeStyle = 'bg-cyan-100 text-cyan-800';
                            } else if (roundedPercent >= 55) {
                              gradeLabel = '1.5';
                              badgeStyle = 'bg-amber-100 text-amber-800';
                            } else if (roundedPercent >= 50) {
                              gradeLabel = '1';
                              badgeStyle = 'bg-orange-100 text-orange-800';
                            } else {
                              gradeLabel = '0';
                              badgeStyle = 'bg-rose-100 text-rose-800';
                            }

                            return (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeStyle}`}>
                                {gradeLabel}
                              </span>
                            );
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
