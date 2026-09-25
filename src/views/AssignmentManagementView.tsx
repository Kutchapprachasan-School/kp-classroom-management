import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Table,
  FileCheck,
  Zap,
  FileText,
  ArrowRightLeft,
  UserPlus,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';

export const AssignmentManagementView: React.FC = () => {
  // 2 มุมมองหลักตามที่ครูต้องการ:
  // 1) 'MATRIX': ดูการส่งงานนักเรียนแบบตารางรวมทั้งเทอม (จำได้ว่าสั่งกี่งาน ใครทำไปกี่งาน กรอกคะแนนในตารางได้ทันที)
  // 2) 'SPEED_GRADER': ตรวจงานนักเรียนรายชิ้น (ดูไฟล์งานที่ส่ง + กดปุ่มให้คะแนนด่วน 1 คลิก)
  const [viewMode, setViewMode] = useState<'MATRIX' | 'SPEED_GRADER'>('MATRIX');

  const [roster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [assignments, setAssignments] = useState<TermAssignmentItem[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );
  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    () => sgsRosterAndSubmissionService.getTermAssignments()[4]?.id || 'asg-5'
  );
  const [hideTransferredOut, setHideTransferredOut] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUnit, setNewUnit] = useState<'u1' | 'u2' | 'u3'>('u3');
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newDueDate, setNewDueDate] = useState('30 ก.ย. 69');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const activeAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const totalMaxScore = assignments.reduce((s, a) => s + a.maxScore, 0);
  const pendingReviewTotal = submissions.filter(
    (s) => s.status === 'SUBMITTED_PENDING'
  ).length;

  const visibleRoster = hideTransferredOut
    ? roster.filter((s) => s.transferState !== 'TRANSFERRED_OUT')
    : roster;

  const getSubmissionCell = (studentCode: string, assignmentId: string) => {
    return submissions.find(
      (s) => s.studentCode === studentCode && s.assignmentId === assignmentId
    );
  };

  const handleGradeChange = (
    assignmentId: string,
    studentCode: string,
    scoreValue: number | null
  ) => {
    const asg = assignments.find((a) => a.id === assignmentId);
    const clamped =
      scoreValue === null
        ? null
        : Math.max(0, Math.min(asg ? asg.maxScore : 100, scoreValue));
    const updated = sgsRosterAndSubmissionService.gradeSubmission(
      assignmentId,
      studentCode,
      clamped,
      clamped === null ? 'MISSING' : 'GRADED'
    );
    setSubmissions(updated);
  };

  const handleBulkGradeAll = (assignmentId?: string) => {
    const updated = sgsRosterAndSubmissionService.bulkGradeAllSubmitted(assignmentId);
    setSubmissions(updated);
    showToast(
      assignmentId
        ? 'ให้คะแนนเต็มสำหรับนักเรียนที่ส่งงานชิ้นนี้แล้วทั้งหมดเรียบร้อย!'
        : 'ตรวจให้คะแนนเต็มทุกงานที่นักเรียนส่งเข้ามาแล้วทั้งหมดในคลิกเดียว!'
    );
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = sgsRosterAndSubmissionService.addTermAssignment({
      title: `ชิ้นงานที่ ${assignments.length + 1}: ${newTitle.trim()}`,
      sgsUnit: newUnit,
      maxScore: Number(newMaxScore) || 10,
      dueDate: newDueDate,
    });
    setAssignments(updated);
    setSelectedAssignmentId(updated[updated.length - 1].id);
    setNewTitle('');
    setIsNewModalOpen(false);
    showToast('เพิ่มงานใหม่เข้าตารางส่งงานและผูกช่องคะแนน SGS เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Pain-Point Solution Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                ตารางติดตามการส่งงาน & ระบบตรวจงานนักเรียน (เชื่อมคะแนน ปพ.5 / SGS)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ดูภาพรวมว่าสั่งไปกี่งาน ใครค้างส่งงานไหน และตรวจให้คะแนนแบบตารางหรือรายชิ้นในคลิกเดียว
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {pendingReviewTotal > 0 && (
            <button
              onClick={() => handleBulkGradeAll()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>ตรวจให้คะแนนเต็มงานที่ส่งแล้วทั้งหมด ({pendingReviewTotal} ชิ้น)</span>
            </button>
          )}

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>สั่งงานใหม่ (+ผูกช่อง SGS)</span>
          </button>
        </div>
      </div>

      {/* 2. Rule of Thirds (3 Summary Cards: จำได้ทันทีว่าสั่งกี่งาน รอตรวจกี่ชิ้น ใครค้างส่ง) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              งานที่ครูสั่งแล้วทั้งหมดในเทอมนี้
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {assignments.length} งาน
              </span>
              <span className="text-xs font-semibold text-teal-700">
                (คะแนนเก็บรวม {totalMaxScore} คะแนน)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            ผูกหน่วยที่ 1–3
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              ผลงานนักเรียนที่ส่งแล้วรอครูตรวจ
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 tabular-nums">
                {pendingReviewTotal} ชิ้น
              </span>
              <span className="text-xs text-slate-500">
                กดตรวจรวมในคลิกเดียวได้
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            ไม่ต้องเปิดทีละคน
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              การเรียงรายชื่อเทียบระบบ SGS (ชาย ➔ หญิง)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold text-teal-700">
                ชายต่อท้ายชาย (เลขที่ 5) • ย้ายออกคงเลขที่ 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              คะแนนผูกตามรหัสนักเรียน ไม่สลับคนแม้เลื่อนเลขที่หญิง
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            ตรงบรรทัด 100%
          </span>
        </div>
      </div>

      {/* 3. Mode Switcher Bar: แบบตารางเช็คงานทั้งห้อง vs แบบตรวจงานรายชิ้น */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'MATRIX'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>1. ดูแบบตารางส่งงานทั้งเทอม (เช็คใครส่งกี่งาน / กรอกคะแนนในตาราง)</span>
            </button>

            <button
              onClick={() => setViewMode('SPEED_GRADER')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'SPEED_GRADER'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>2. โหมดตรวจงานนักเรียนรายชิ้น (ดูไฟล์งานที่ส่ง & กดให้คะแนนด่วน)</span>
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!hideTransferredOut}
              onChange={() => setHideTransferredOut((v) => !v)}
              className="w-4 h-4 accent-teal-600 rounded"
            />
            <span>คงแถวนักเรียนย้ายออก (เลขที่ 3) ให้ตรงบรรทัด SGS</span>
          </label>
        </div>

        {/* =====================================================================
            VIEW MODE 1: ตารางภาพรวมการส่งงานทั้งห้อง (Submission Matrix Grid)
           ===================================================================== */}
        {viewMode === 'MATRIX' && (
          <div>
            <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-600">
                💡 <strong>วิธีใช้แบบเร็ว:</strong> พิมพ์ตัวเลขคะแนนลงในช่องตารางได้ทันที หรือคลิกปุ่ม{' '}
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  รอตรวจ (กดให้เต็ม)
                </span>{' '}
                เพื่อให้คะแนนเต็มทันทีโดยไม่ต้องเปิดดูทีละคน
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-teal-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500" /> ตรวจแล้ว
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> ส่งแล้วรอตรวจ
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> ยังไม่ส่ง (ค้าง)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-3 w-16 text-center">เลขที่ SGS</th>
                    <th className="py-3 px-4 min-w-52">ชื่อ - นามสกุล / สถานะย้ายเข้า-ออก</th>
                    <th className="py-3 px-3 text-center">สรุปส่งงาน</th>
                    {assignments.map((asg) => (
                      <th
                        key={asg.id}
                        className="py-3 px-3 text-center min-w-32 border-l border-slate-200/70"
                      >
                        <div className="font-bold text-slate-900">
                          งานที่ {asg.orderNo} ({asg.maxScore} คะแนน)
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-36 mx-auto">
                          {asg.title.replace(/^.*:\s*/, '')}
                        </div>
                        <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                          [{asg.sgsUnit.toUpperCase()}] กำหนดส่ง {asg.dueDate}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center border-l border-slate-200 bg-teal-50/50 text-teal-900 font-bold">
                      รวมเก็บ ({totalMaxScore})
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleRoster.map((stu) => {
                    const computed =
                      sgsRosterAndSubmissionService.computeStudentSgsGrades(stu);
                    const isTransferredOut =
                      stu.transferState === 'TRANSFERRED_OUT';
                    const isTransferredIn =
                      stu.transferState === 'TRANSFERRED_IN';

                    return (
                      <tr
                        key={stu.studentCode}
                        className={
                          isTransferredOut
                            ? 'bg-slate-100/80 text-slate-400'
                            : isTransferredIn
                            ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-3 px-3 text-center font-bold tabular-nums">
                          {stu.sgsSeatNo}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold ${
                                isTransferredOut
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              {stu.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({stu.studentCode})
                            </span>
                          </div>

                          {isTransferredOut && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold">
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>
                                ย้ายออก ({stu.transferDate}) — ล็อกแถวเลขที่ {stu.sgsSeatNo} ไว้ตาม SGS
                              </span>
                            </div>
                          )}

                          {isTransferredIn && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-semibold">
                              <UserPlus className="w-3 h-3" />
                              <span>
                                ย้ายเข้าใหม่ ({stu.transferDate}) — เทียบโอนหน่วยที่ 1 แล้ว
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isTransferredOut ? (
                            <span className="text-[11px] font-semibold text-slate-400">
                              จำหน่าย/ย้ายออก
                            </span>
                          ) : computed.missingCount === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[11px]">
                              ส่งครบ {computed.submittedCount}/{computed.totalAssignedCount}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                              ส่ง {computed.submittedCount}/{computed.totalAssignedCount} (ค้าง{' '}
                              {computed.missingCount})
                            </span>
                          )}
                        </td>

                        {assignments.map((asg) => {
                          const cell = getSubmissionCell(stu.studentCode, asg.id);

                          if (isTransferredOut) {
                            return (
                              <td
                                key={asg.id}
                                className="py-3 px-3 text-center border-l border-slate-200/60 text-slate-400"
                              >
                                — (ย้ายออก)
                              </td>
                            );
                          }

                          return (
                            <td
                              key={asg.id}
                              className="py-2.5 px-3 text-center border-l border-slate-200/60"
                            >
                              {cell?.status === 'SUBMITTED_PENDING' ? (
                                <div className="space-y-1">
                                  <button
                                    onClick={() =>
                                      handleGradeChange(
                                        asg.id,
                                        stu.studentCode,
                                        asg.maxScore
                                      )
                                    }
                                    className="w-full px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors"
                                    title="คลิกเพื่อให้คะแนนเต็มทันที"
                                  >
                                    ส่งแล้ว • กดให้เต็ม ({asg.maxScore})
                                  </button>
                                  <div className="text-[10px] text-slate-400 truncate max-w-28 mx-auto">
                                    {cell.submittedAt}
                                  </div>
                                </div>
                              ) : cell?.status === 'EXEMPT_TRANSFERRED' ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                                    โอนคะแนน: {cell.score ?? 0}/{asg.maxScore}
                                  </span>
                                </div>
                              ) : cell?.status === 'GRADED' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={asg.maxScore}
                                    value={cell.score ?? ''}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        asg.id,
                                        stu.studentCode,
                                        e.target.value === ''
                                          ? null
                                          : Number(e.target.value)
                                      )
                                    }
                                    className="w-14 text-center font-bold text-teal-800 bg-teal-50/70 border border-teal-200 rounded-lg py-1 tabular-nums"
                                  />
                                  <span className="text-slate-400 text-[11px]">
                                    /{asg.maxScore}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[11px] font-bold text-rose-600">
                                    ยังไม่ส่ง
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleGradeChange(
                                        asg.id,
                                        stu.studentCode,
                                        asg.maxScore
                                      )
                                    }
                                    className="text-[10px] text-slate-500 hover:text-teal-700 underline"
                                  >
                                    + รับงาน/ให้คะแนน
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-center border-l border-slate-200 bg-teal-50/30 font-bold text-teal-800 tabular-nums">
                          {isTransferredOut
                            ? '—'
                            : `${computed.u1 + computed.u2 + computed.u3} / ${totalMaxScore}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW MODE 2: โหมดตรวจงานนักเรียนรายชิ้น (SpeedGrader / Assignment Inspector)
           ===================================================================== */}
        {viewMode === 'SPEED_GRADER' && (
          <div className="p-5 space-y-5">
            {/* แถบเลือกงานที่ต้องการตรวจ */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  เลือกชิ้นงานที่ต้องการตรวจ:
                </span>
                {assignments.map((asg) => {
                  const isSelected = asg.id === activeAssignment.id;
                  const pendingInAsg = submissions.filter(
                    (s) =>
                      s.assignmentId === asg.id &&
                      s.status === 'SUBMITTED_PENDING'
                  ).length;
                  return (
                    <button
                      key={asg.id}
                      onClick={() => setSelectedAssignmentId(asg.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>
                        งานที่ {asg.orderNo}: {asg.title.replace(/^.*:\s*/, '')}
                      </span>
                      {pendingInAsg > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                          รอตรวจ {pendingInAsg}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleBulkGradeAll(activeAssignment.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  ให้เต็ม ({activeAssignment.maxScore} คะแนน) ทุกคนที่ส่งงานชิ้นนี้แล้ว
                </span>
              </button>
            </div>

            {/* รายการตรวจผลงานของนักเรียนทีละคนในงานที่เลือก */}
            <div className="space-y-2.5">
              {visibleRoster.map((stu) => {
                const sub = getSubmissionCell(
                  stu.studentCode,
                  activeAssignment.id
                );
                const isTransferredOut =
                  stu.transferState === 'TRANSFERRED_OUT';

                return (
                  <div
                    key={stu.studentCode}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors ${
                      isTransferredOut
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : sub?.status === 'SUBMITTED_PENDING'
                        ? 'bg-amber-50/40 border-amber-300'
                        : sub?.status === 'GRADED'
                        ? 'bg-white border-slate-200'
                        : 'bg-rose-50/20 border-rose-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold tabular-nums">
                          เลขที่ {stu.sgsSeatNo}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {stu.studentName}
                        </span>
                        <span className="text-slate-400 font-mono">
                          ({stu.studentCode})
                        </span>

                        {sub?.status === 'GRADED' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                            ✓ ตรวจแล้ว ({sub.score}/{activeAssignment.maxScore})
                          </span>
                        )}
                        {sub?.status === 'SUBMITTED_PENDING' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                            ⏳ ส่งงานแล้ว รอครูตรวจ
                          </span>
                        )}
                        {(!sub || sub.status === 'MISSING') && !isTransferredOut && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            ⚠️ ยังไม่ส่งงานชิ้นนี้
                          </span>
                        )}
                      </div>

                      {/* แสดงไฟล์ผลงานที่นักเรียนส่งมา */}
                      {!isTransferredOut && (
                        <div className="flex flex-wrap items-center gap-3 text-slate-600 pt-1">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>
                              ไฟล์งานที่ส่ง:{' '}
                              {sub?.workTitle || 'ยังไม่มีไฟล์แนบ (รอส่งหน้าชั้นเรียน)'}
                            </span>
                          </span>
                          {sub?.submittedAt && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>เวลาส่ง: {sub.submittedAt}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ปุ่มให้คะแนนด่วน 1 คลิก (SpeedGrader Quick Score Buttons) */}
                    {!isTransferredOut && (
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="text-slate-500 mr-1 font-semibold">
                          กดให้คะแนนด่วน:
                        </span>
                        {[
                          {
                            label: `เต็ม (${activeAssignment.maxScore})`,
                            val: activeAssignment.maxScore,
                          },
                          {
                            label: `ดีมาก (${Math.max(
                              1,
                              activeAssignment.maxScore - 1
                            )})`,
                            val: Math.max(1, activeAssignment.maxScore - 1),
                          },
                          {
                            label: `ผ่าน (${Math.ceil(
                              activeAssignment.maxScore * 0.7
                            )})`,
                            val: Math.ceil(activeAssignment.maxScore * 0.7),
                          },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() =>
                              handleGradeChange(
                                activeAssignment.id,
                                stu.studentCode,
                                preset.val
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                              sub?.score === preset.val
                                ? 'bg-teal-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}

                        <input
                          type="number"
                          min={0}
                          max={activeAssignment.maxScore}
                          placeholder="คะแนน"
                          value={sub?.score ?? ''}
                          onChange={(e) =>
                            handleGradeChange(
                              activeAssignment.id,
                              stu.studentCode,
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          className="w-16 px-2 py-1.5 text-center font-bold border border-slate-300 rounded-xl tabular-nums"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal สั่งงานใหม่ + ผูกช่องคะแนน SGS */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAssignment}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">
              + สั่งงานใหม่ (ผูกเข้าตารางเช็คงาน & ช่องคะแนน SGS)
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                หัวข้องาน / การบ้าน
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น วาดภาพทัศนียภาพ 1 จุดรวมสายตา"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ผูกเข้าช่องคะแนน SGS
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="u1">หน่วยที่ 1 (ก่อนกลางภาค)</option>
                  <option value="u2">หน่วยที่ 2 (ก่อนกลางภาค)</option>
                  <option value="u3">หน่วยที่ 3 (หลังกลางภาค)</option>
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
              >
                บันทึกและเพิ่มคอลัมน์ในตารางส่งงาน
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
