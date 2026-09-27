import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Zap,
  FileText,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  type SgsStudentRecord,
  type TermAssignmentItem,
  type StudentWorkSubmission,
} from '../services/sgsRosterAndSubmissionService';

export const AssignmentManagementView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'MATRIX' | 'SPEED_GRADER'>('MATRIX');

  const [roster, setRoster] = useState<SgsStudentRecord[]>(() =>
    sgsRosterAndSubmissionService.getSgsRoster()
  );
  const [assignments, setAssignments] = useState<TermAssignmentItem[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );
  const [submissions, setSubmissions] = useState<StudentWorkSubmission[]>(() =>
    sgsRosterAndSubmissionService.getSubmissions()
  );

  useEffect(() => {
    const syncRoster = () => {
      setRoster(sgsRosterAndSubmissionService.getSgsRoster());
    };
    window.addEventListener('kp-sgs-roster-updated', syncRoster);
    return () => window.removeEventListener('kp-sgs-roster-updated', syncRoster);
  }, []);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    () => sgsRosterAndSubmissionService.getTermAssignments()[4]?.id || 'asg-5'
  );
  const [hideTransferredOut, setHideTransferredOut] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUnit, setNewUnit] = useState<'u1' | 'u2' | 'u3'>('u3');
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newDueDate, setNewDueDate] = useState('30 ก.ย. 69');
  const [newIsRequiredForPass, setNewIsRequiredForPass] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
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

  const handleToggleMandatory = (assignmentId: string) => {
    const updated =
      sgsRosterAndSubmissionService.toggleAssignmentRequiredForPass(assignmentId);
    setAssignments(updated);
    const target = updated.find((a) => a.id === assignmentId);
    showToast(
      target?.isRequiredForPass
        ? `ตั้ง "${target.title}" เป็นงานบังคับ (ไม่ส่งติด ร)`
        : `เปลี่ยน "${target?.title}" เป็นงานทั่วไป`
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
    const updated =
      sgsRosterAndSubmissionService.bulkGradeAllSubmitted(assignmentId);
    setSubmissions(updated);
    showToast('ให้คะแนนเต็มงานที่ส่งแล้วเรียบร้อย');
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = sgsRosterAndSubmissionService.addTermAssignment({
      title: `ชิ้นงานที่ ${assignments.length + 1}: ${newTitle.trim()}`,
      sgsUnit: newUnit,
      maxScore: Number(newMaxScore) || 10,
      dueDate: newDueDate,
      isRequiredForPass: newIsRequiredForPass,
    });
    setAssignments(updated);
    setSelectedAssignmentId(updated[updated.length - 1].id);
    setNewTitle('');
    setIsNewModalOpen(false);
    showToast('เพิ่มงานใหม่เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-8 font-sans text-slate-800">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Single Clean Card: Toolbar + Table (No Cluttered Banners or Extra Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-4 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('MATRIX')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  viewMode === 'MATRIX'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตารางส่งงาน ({assignments.length} งาน)
              </button>
              <button
                onClick={() => setViewMode('SPEED_GRADER')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'SPEED_GRADER'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>ตรวจรายชิ้น</span>
                {pendingReviewTotal > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {pendingReviewTotal}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!hideTransferredOut}
                onChange={() => setHideTransferredOut((v) => !v)}
                className="w-3.5 h-3.5 accent-teal-600 rounded"
              />
              <span>แสดงคนย้ายออก</span>
            </label>

            {pendingReviewTotal > 0 && (
              <button
                onClick={() => handleBulkGradeAll()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>ตรวจให้เต็มที่ส่งแล้ว ({pendingReviewTotal})</span>
              </button>
            )}

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สั่งงานใหม่</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            VIEW MODE 1: ตารางส่งงานทั้งเทอม (Clean Spreadsheet Matrix)
           ===================================================================== */}
        {viewMode === 'MATRIX' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="w-12 text-center">เลขที่</th>
                  <th className="w-16">รหัส</th>
                  <th className="min-w-44">ชื่อ - นามสกุล</th>
                  {assignments.map((asg) => (
                    <th
                      key={asg.id}
                      className="text-center min-w-24 border-l border-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleMandatory(asg.id)}
                        className="w-full text-center group"
                        title={`คลิกเพื่อสลับงานบังคับ (ปัจจุบัน: ${
                          asg.isRequiredForPass ? 'งานบังคับ ไม่ส่งติด ร' : 'งานทั่วไป'
                        })`}
                      >
                        <div className="font-bold text-slate-800 group-hover:text-teal-700 flex items-center justify-center gap-1">
                          <span>
                            งาน {asg.orderNo} ({asg.maxScore})
                          </span>
                          {asg.isRequiredForPass && (
                            <span
                              className="text-rose-600 font-bold"
                              title="งานบังคับ (ไม่ส่งติด ร)"
                            >
                              *
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-28 mx-auto">
                          {asg.title.replace(/^.*:\s*/, '')}
                        </div>
                      </button>
                    </th>
                  ))}
                  <th className="w-24 text-center border-l border-slate-200 bg-slate-50 text-slate-800 font-bold">
                    รวม ({totalMaxScore})
                  </th>
                  <th className="w-20 text-center">สถานะ</th>
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
                          ? 'bg-slate-50 text-slate-400'
                          : 'hover:bg-slate-50/70'
                      }
                    >
                      <td className="text-center font-semibold text-slate-600 tabular-nums">
                        {stu.sgsSeatNo}
                      </td>

                      <td className="font-mono text-slate-400 tabular-nums">
                        {stu.studentCode}
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-medium ${
                              isTransferredOut
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {stu.studentName}
                          </span>
                          {isTransferredOut && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 text-[10px]">
                              ย้ายออก
                            </span>
                          )}
                          {isTransferredIn && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                              ย้ายเข้า
                            </span>
                          )}
                        </div>
                      </td>

                      {assignments.map((asg) => {
                        const cell = getSubmissionCell(stu.studentCode, asg.id);

                        if (isTransferredOut) {
                          return (
                            <td
                              key={asg.id}
                              className="text-center border-l border-slate-100 text-slate-300"
                            >
                              —
                            </td>
                          );
                        }

                        return (
                          <td
                            key={asg.id}
                            className="text-center border-l border-slate-100 whitespace-nowrap"
                          >
                            {cell?.status === 'SUBMITTED_PENDING' ? (
                              <button
                                onClick={() =>
                                  handleGradeChange(
                                    asg.id,
                                    stu.studentCode,
                                    asg.maxScore
                                  )
                                }
                                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold text-[11px] transition-colors"
                                title={`ส่งแล้ว (${cell.submittedAt}) — คลิกเพื่อให้ ${asg.maxScore} คะแนน`}
                              >
                                รอตรวจ ({asg.maxScore})
                              </button>
                            ) : cell?.status === 'GRADED' ? (
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
                                className="w-12 h-6 text-center font-semibold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-teal-500 rounded tabular-nums text-xs focus:outline-none"
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  handleGradeChange(
                                    asg.id,
                                    stu.studentCode,
                                    asg.maxScore
                                  )
                                }
                                className="w-12 h-6 rounded text-slate-300 hover:text-teal-700 hover:bg-slate-100 text-[11px] transition-colors"
                                title="ยังไม่ส่ง — คลิกเพื่อให้คะแนน"
                              >
                                —
                              </button>
                            )}
                          </td>
                        );
                      })}

                      <td className="text-center border-l border-slate-200 bg-slate-50/50 font-bold text-slate-900 tabular-nums">
                        {isTransferredOut ? '—' : computed.effectiveAccumulated}
                      </td>

                      <td className="text-center whitespace-nowrap">
                        {isTransferredOut ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : computed.missingMandatoryTitles.length > 0 ? (
                          <span
                            className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[11px]"
                            title={`ค้างงานบังคับ: ${computed.missingMandatoryTitles.join(', ')}`}
                          >
                            ติด ร
                          </span>
                        ) : (
                          <span className="text-teal-700 font-medium text-[11px]">
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

        {/* =====================================================================
            VIEW MODE 2: ตรวจรายชิ้น (Clean SpeedGrader Table)
           ===================================================================== */}
        {viewMode === 'SPEED_GRADER' && (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {assignments.map((asg) => {
                  const isSelected = asg.id === activeAssignment.id;
                  return (
                    <button
                      key={asg.id}
                      onClick={() => setSelectedAssignmentId(asg.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      งาน {asg.orderNo}: {asg.title.replace(/^.*:\s*/, '')}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleBulkGradeAll(activeAssignment.id)}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
              >
                ให้เต็ม ({activeAssignment.maxScore}) ทุกคนที่ส่งแล้ว
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="w-12 text-center">เลขที่</th>
                    <th>ชื่อ - นามสกุล</th>
                    <th>ไฟล์งานที่ส่ง</th>
                    <th className="text-right">ให้คะแนน (เต็ม {activeAssignment.maxScore})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRoster.map((stu) => {
                    const sub = getSubmissionCell(
                      stu.studentCode,
                      activeAssignment.id
                    );
                    const isTransferredOut =
                      stu.transferState === 'TRANSFERRED_OUT';

                    return (
                      <tr
                        key={stu.studentCode}
                        className={
                          isTransferredOut
                            ? 'bg-slate-50 text-slate-400'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="text-center font-semibold text-slate-600 tabular-nums">
                          {stu.sgsSeatNo}
                        </td>
                        <td className="font-medium text-slate-900 whitespace-nowrap">
                          {stu.studentName}
                        </td>
                        <td className="text-slate-500 whitespace-nowrap">
                          {isTransferredOut ? (
                            'ย้ายออก'
                          ) : sub?.workTitle ? (
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              <FileText className="w-3.5 h-3.5 text-teal-600" />
                              <span>{sub.workTitle}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">ยังไม่ส่ง</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {!isTransferredOut && (
                            <div className="inline-flex items-center justify-end gap-1">
                              {[
                                {
                                  label: `เต็ม (${activeAssignment.maxScore})`,
                                  val: activeAssignment.maxScore,
                                },
                                {
                                  label: `${Math.max(1, activeAssignment.maxScore - 1)}`,
                                  val: Math.max(1, activeAssignment.maxScore - 1),
                                },
                                {
                                  label: `${Math.ceil(activeAssignment.maxScore * 0.7)}`,
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
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                    sub?.score === preset.val
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}

                              <input
                                type="number"
                                min={0}
                                max={activeAssignment.maxScore}
                                placeholder="—"
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
                                className="w-12 h-6 px-1 text-center font-semibold border border-slate-200 rounded tabular-nums text-xs"
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal สั่งงานใหม่ */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAssignment}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">สั่งงานใหม่</h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อชิ้นงาน / การบ้าน
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น วาดภาพทัศนียภาพ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หน่วยคะแนน SGS
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="u1">หน่วยที่ 1</option>
                  <option value="u2">หน่วยที่ 2</option>
                  <option value="u3">หน่วยที่ 3</option>
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsRequiredForPass}
                onChange={(e) => setNewIsRequiredForPass(e.target.checked)}
                className="accent-teal-600 w-4 h-4"
              />
              <span className="font-medium text-slate-700">
                ตั้งเป็นงานบังคับ (หากไม่ส่งจะขึ้นสถานะติด &quot;ร&quot;)
              </span>
            </label>

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
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold"
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
