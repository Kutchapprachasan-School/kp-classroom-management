import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Vote,
  UserCheck,
  CheckCircle2,
  Plus,
  MessageSquare,
  Calendar,
  FileCheck2,
  Award,
} from 'lucide-react';
import {
  studentAffairsCouncilService,
  type DisciplineRecord,
  type StudentLeaveRequest,
  type CouncilCandidateParty,
  type StudentSuggestion,
} from '../services/studentAffairsCouncilService';
import {
  teacherCopilotService,
  type CrossViewNavigationPayload,
} from '../services/teacherCopilotService';
import { MobileVerticalAttendanceSheet } from '../components/teacher/MobileVerticalAttendanceSheet';
import { PaperRegisterLedger } from '../components/teacher/PaperRegisterLedger';

interface StudentAffairsCouncilViewProps {
  initialSection?: 'AFFAIRS' | 'COUNCIL';
  initialAffairsTab?: 'ASSEMBLY' | 'DISCIPLINE' | 'STUDENT_LEAVE';
  initialHighlightBanner?: string | null;
  onOpenHomeVisit?: () => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

export const StudentAffairsCouncilView: React.FC<
  StudentAffairsCouncilViewProps
> = ({
  initialSection = 'AFFAIRS',
  initialAffairsTab = 'ASSEMBLY',
  onOpenHomeVisit: _onOpenHomeVisit,
}) => {
  const mainSection = initialSection;
  const [affairsTab, setAffairsTab] = useState<
    'ASSEMBLY' | 'DISCIPLINE' | 'STUDENT_LEAVE'
  >(initialAffairsTab);
  const [councilTab, setCouncilTab] = useState<
    'EVOTING' | 'SUGGESTIONS' | 'ACTIVITIES'
  >('EVOTING');
  const [assemblyViewMode, setAssemblyViewMode] = useState<
    'PAPER_LEDGER' | 'MOBILE_VERTICAL'
  >('PAPER_LEDGER');

  const [selectedLeaveRoom, setSelectedLeaveRoom] = useState<string>('ALL');
  const [disciplineLogs, setDisciplineLogs] = useState<DisciplineRecord[]>(() =>
    studentAffairsCouncilService.getDisciplineLogs()
  );
  const [leaveRequests, setLeaveRequests] = useState<StudentLeaveRequest[]>(
    () => studentAffairsCouncilService.getStudentLeaves()
  );
  const [parties] = useState<CouncilCandidateParty[]>(() =>
    studentAffairsCouncilService.getCandidateParties()
  );
  const [abstainCount] = useState<number>(() =>
    studentAffairsCouncilService.getAbstainCount()
  );
  const [suggestions, setSuggestions] = useState<StudentSuggestion[]>(() =>
    studentAffairsCouncilService.getSuggestions()
  );

  const filteredLeaves =
    selectedLeaveRoom === 'ALL'
      ? leaveRequests
      : leaveRequests.filter((l) => l.classroom === selectedLeaveRoom);

  // Form state for adding discipline point
  const [newDiscStudent, setNewDiscStudent] = useState('ด.ช. ทัตธน คำฝั้น');
  const [newDiscType, setNewDiscType] = useState<'BONUS' | 'DEDUCT'>('BONUS');
  const [newDiscPoints, setNewDiscPoints] = useState(5);
  const [newDiscReason, setNewDiscReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscReason.trim()) return;
    const updated = studentAffairsCouncilService.addDisciplineLog({
      studentCode: newDiscStudent.includes('ทัตธน') ? '45102' : '45105',
      studentName: newDiscStudent,
      classroom: 'ม.3/1',
      type: newDiscType,
      points: Number(newDiscPoints),
      reason: newDiscReason.trim(),
      reporter: 'อ.ภาสภูมิ เรืองปราชญ์',
      parentNotified: true,
    });
    setDisciplineLogs(updated);
    setNewDiscReason('');
    showToast('บันทึกคะแนนพฤติกรรมและส่งแจ้งเตือนผู้ปกครองเรียบร้อยแล้ว');
  };

  const handleApproveLeave = (
    id: string,
    status: StudentLeaveRequest['status']
  ) => {
    const updated = studentAffairsCouncilService.updateStudentLeaveStatus(
      id,
      status
    );
    setLeaveRequests(updated);
    showToast(
      `อัปเดตสถานะใบลานักเรียนเป็น ${
        status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'
      }`
    );
  };

  const [replyingSuggestionId, setReplyingSuggestionId] = useState<string | null>(
    null
  );
  const [replyDraft, setReplyDraft] = useState(
    'รับเรื่องและประสานงานดำเนินการเรียบร้อยแล้วครับ'
  );

  const handleSaveReplySuggestion = (id: string) => {
    if (!replyDraft.trim()) return;
    const updated = studentAffairsCouncilService.replySuggestion(
      id,
      'RESOLVED',
      replyDraft.trim()
    );
    setSuggestions(updated);
    setReplyingSuggestionId(null);
    showToast('ตอบกลับข้อเสนอแนะนักเรียนเรียบร้อยแล้ว');
  };

  useEffect(() => {
    setAffairsTab(initialAffairsTab);
  }, [initialAffairsTab]);

  useEffect(() => {
    const handler = () => {
      setLeaveRequests([...studentAffairsCouncilService.getStudentLeaves()]);
    };
    window.addEventListener('kp-copilot-updated', handler);
    return () => window.removeEventListener('kp-copilot-updated', handler);
  }, []);

  const pendingLeavesCount = leaveRequests.filter(
    (l) => l.status === 'PENDING'
  ).length;

  const totalVotes = parties.reduce((s, p) => s + p.voteCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {mainSection === 'COUNCIL' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-xs">
            <h1 className="text-sm sm:text-base font-bold text-slate-900">
              สภานักเรียน & เลือกตั้งออนไลน์ (E-Voting)
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  ผู้ใช้สิทธิ์เลือกตั้งรวม (รวมไม่ประสงค์ลงคะแนน)
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-teal-700 tabular-nums">
                    {(totalVotes + abstainCount).toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    คน (ไม่ประสงค์ลงคะแนน {abstainCount} คน)
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                นับผลเรียลไทม์
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  พรรคผู้สมัครสภานักเรียน
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {parties.length}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    พรรค (ปีการศึกษา 2569)
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                ปิดผลคะแนนฝั่งเด็กก่อนโหวต
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  ข้อเสนอแนะถึงสภานักเรียน
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {suggestions.length}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    เรื่องที่เสนอเข้ามา
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                รับฟังเสียงนักเรียน
              </span>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          SECTION 1: ระบบบริหารงานกิจการนักเรียน (ออกแบบเน้นมือถือแนวตั้ง ตัดข้อความรกออกทั้งหมด)
         ===================================================================== */}
      {mainSection === 'AFFAIRS' && (
        <div className="space-y-3">
          {/* แถบไอคอนสลับงาน 3 ปุ่มสั้นๆ เข้าใจทันที (เช็คแถวเช้า | ใบลา | ความประพฤติ) */}
          <div className="max-w-xl mx-auto grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setAffairsTab('ASSEMBLY')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                affairsTab === 'ASSEMBLY'
                  ? 'bg-[#1967D2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">เช็คแถวเช้า</span>
            </button>

            <button
              onClick={() => setAffairsTab('STUDENT_LEAVE')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                affairsTab === 'STUDENT_LEAVE'
                  ? 'bg-[#1967D2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span className="truncate">ใบลา ({pendingLeavesCount})</span>
            </button>

            <button
              onClick={() => setAffairsTab('DISCIPLINE')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                affairsTab === 'DISCIPLINE'
                  ? 'bg-[#1967D2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="truncate">ความประพฤติ</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Tab 1.1: เช็คชื่อแถวหน้าเสาธง (สมุด ปพ.5 แบบกระดาษ พร้อมสลับโหมดการ์ดมือถือ) */}
            {affairsTab === 'ASSEMBLY' && (
              <div className="p-2 sm:p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-bold text-slate-700">
                    เช็คแถวเช้า: {assemblyViewMode === 'PAPER_LEDGER' ? 'สมุด ปพ.5 แบบกระดาษ' : 'การ์ดแนวตั้งสำหรับมือถือ'}
                  </span>
                  <div className="inline-flex rounded-lg bg-white border border-slate-300 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setAssemblyViewMode('PAPER_LEDGER')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        assemblyViewMode === 'PAPER_LEDGER'
                          ? 'bg-[#1967D2] text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      สมุด ปพ.5 (แนวนอน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssemblyViewMode('MOBILE_VERTICAL')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        assemblyViewMode === 'MOBILE_VERTICAL'
                          ? 'bg-[#1967D2] text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      การ์ดมือถือ (แนวตั้ง)
                    </button>
                  </div>
                </div>

                {assemblyViewMode === 'PAPER_LEDGER' ? (
                  <PaperRegisterLedger
                    initialMode="MORNING_ASSEMBLY"
                    defaultRoom="ม.2/1"
                    subjectLabel="กิจกรรมหน้าเสาธง 07:45 น."
                  />
                ) : (
                  <MobileVerticalAttendanceSheet
                    defaultRoom="ม.2/1"
                    availableRooms={['ม.2/1', 'ม.3/1', 'ม.1/8']}
                    activityLine="การเช็คชื่อตอนเช้า กิจกรรมหน้าเสาธง"
                    dateLine="ประจำวันจันทร์ ที่ 28 กันยายน 2569"
                    defaultStatus="ABSENT"
                    onSaveSuccess={(summary) => {
                      teacherCopilotService.completeMorningAssemblyOneClick();
                      showToast(
                        `บันทึกเช็คชื่อแถวเช้า ${summary.room} สำเร็จ (มา ${summary.present} • ขาด ${summary.absent} • สาย ${summary.late} • ลา ${summary.sick})`
                      );
                    }}
                  />
                )}
              </div>
            )}

            {/* Tab 1.2: บันทึกวินัยและคะแนนพฤติกรรม (Rule of Thirds 4:8 Form + Data Table) */}
            {affairsTab === 'DISCIPLINE' && (
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleAddDiscipline}
                  className="lg:col-span-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 space-y-4 text-xs"
                >
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-600" />
                    <span>บันทึกคะแนนความประพฤติ / จิตอาสา</span>
                  </h3>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      เลือกนักเรียน
                    </label>
                    <select
                      value={newDiscStudent}
                      onChange={(e) => setNewDiscStudent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="ด.ช. ทัตธน คำฝั้น">
                        ด.ช. ทัตธน คำฝั้น (ม.3/1)
                      </option>
                      <option value="ด.ญ. กมลชนก เลิศวิไล">
                        ด.ญ. กมลชนก เลิศวิไล (ม.3/1)
                      </option>
                      <option value="ด.ช. ณัฐวุฒิ สายทอง">
                        ด.ช. ณัฐวุฒิ สายทอง (ม.3/1)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ประเภทคะแนน
                      </label>
                      <select
                        value={newDiscType}
                        onChange={(e) => setNewDiscType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="BONUS">+ เพิ่มคะแนนความดี</option>
                        <option value="DEDUCT">- หักคะแนนวินัย</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        จำนวนคะแนน
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={newDiscPoints}
                        onChange={(e) => setNewDiscPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      สาเหตุ / รายละเอียดพฤติกรรม
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newDiscReason}
                      onChange={(e) => setNewDiscReason(e.target.value)}
                      placeholder="เช่น ช่วยงานสภานักเรียน, มาสายเกินกำหนด..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
                  >
                    บันทึกคะแนนพฤติกรรม
                  </button>
                </form>

                {/* Data Table instead of stacked cards */}
                <div className="lg:col-span-8 border border-slate-200/80 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">
                      ตารางประวัติคะแนนความประพฤติและจิตอาสา (คะแนนตั้งต้น 100 คะแนน)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200/80 text-slate-500 font-semibold">
                          <th>วันที่</th>
                          <th>นักเรียน (ห้อง)</th>
                          <th>รายการพฤติกรรม</th>
                          <th>ผู้บันทึก</th>
                          <th className="text-right">คะแนน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {disciplineLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="text-slate-500 whitespace-nowrap tabular-nums">
                              {log.date}
                            </td>
                            <td className="whitespace-nowrap">
                              <span className="font-bold text-slate-900">{log.studentName}</span>{' '}
                              <span className="text-[11px] text-slate-400">({log.classroom})</span>
                            </td>
                            <td className="text-slate-700">
                              {log.reason}
                            </td>
                            <td className="text-slate-500 whitespace-nowrap">
                              {log.reporter}
                            </td>
                            <td className="text-right whitespace-nowrap font-bold tabular-nums">
                              <span
                                className={
                                  log.type === 'BONUS' ? 'text-teal-700' : 'text-rose-600'
                                }
                              >
                                {log.type === 'BONUS' ? `+${log.points}` : `-${log.points}`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1.3: ตารางอนุมัติใบลานักเรียน (Single-line compact rows) */}
            {affairsTab === 'STUDENT_LEAVE' && (
              <div>
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    รายการขออนุมัติใบลานักเรียน (ลาป่วย / ลากิจ) —{' '}
                    {selectedLeaveRoom === 'ALL'
                      ? 'ทุกห้องเรียน'
                      : `ชั้น ${selectedLeaveRoom}`}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">ห้อง:</span>
                    <select
                      value={selectedLeaveRoom}
                      onChange={(e) => setSelectedLeaveRoom(e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="ALL">ทุกห้องเรียน</option>
                      <option value="ม.1/8">ม.1/8</option>
                      <option value="ม.2/1">ม.2/1</option>
                      <option value="ม.3/1">ม.3/1</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                        <th>นักเรียน (รหัส · ห้อง)</th>
                        <th>ประเภทการลา</th>
                        <th>ช่วงวันที่ลา</th>
                        <th>เหตุผล & เบอร์ผู้ปกครอง</th>
                        <th>สถานะ</th>
                        <th className="text-right">การพิจารณา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeaves.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="whitespace-nowrap">
                            <span className="font-bold text-slate-900">{req.studentName}</span>{' '}
                            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                              ({req.studentCode} · {req.classroom})
                            </span>
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-800 font-semibold">
                              {req.leaveType} ({req.daysCount} วัน)
                            </span>
                          </td>
                          <td className="text-slate-600 whitespace-nowrap tabular-nums">
                            {req.startDate} - {req.endDate}
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="text-slate-800 font-medium">{req.reason}</span>{' '}
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              (โทร. {req.guardianPhone})
                            </span>
                          </td>
                          <td className="whitespace-nowrap">
                            {req.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
                              </span>
                            ) : req.status === 'REJECTED' ? (
                              <span className="text-rose-600 font-semibold">ไม่อนุมัติ</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                รออนุมัติ
                              </span>
                            )}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            {req.status === 'APPROVED' ? (
                              <span className="text-slate-400 text-[11px]">ดำเนินการแล้ว</span>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleApproveLeave(req.id, 'APPROVED')}
                                  className="px-2.5 py-0.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  onClick={() => handleApproveLeave(req.id, 'REJECTED')}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                                >
                                  ไม่อนุมัติ
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: ระบบสภานักเรียน & เลือกตั้งออนไลน์ E-Voting
         ===================================================================== */}
      {mainSection === 'COUNCIL' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-1 bg-slate-50/50">
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCouncilTab('EVOTING')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  councilTab === 'EVOTING'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Vote className="w-3.5 h-3.5" />
                <span>ตารางผลเลือกตั้งสภานักเรียน (E-Voting)</span>
              </button>

              <button
                onClick={() => setCouncilTab('SUGGESTIONS')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  councilTab === 'SUGGESTIONS'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>ตารางข้อเสนอแนะนักเรียน ({suggestions.length})</span>
              </button>

              <button
                onClick={() => setCouncilTab('ACTIVITIES')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  councilTab === 'ACTIVITIES'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>ตารางโครงการและงบประมาณสภาฯ</span>
              </button>
            </div>
          </div>

          {/* Tab 2.1: เลือกตั้งสภานักเรียน E-Voting (Clean Comparison Data Table + Rule of Thirds) */}
          {councilTab === 'EVOTING' && (
            <div>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    สรุปผลคะแนนเลือกตั้งสภานักเรียนออนไลน์ (Real-time)
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                      <th className="py-3 px-4">หมายเลข</th>
                      <th className="py-3 px-4">ชื่อพรรค & สโลแกน</th>
                      <th className="py-3 px-4">หัวหน้าพรรค</th>
                      <th className="py-3 px-4">นโยบายหลัก</th>
                      <th className="py-3 px-4 text-right">คะแนนเสียงที่ได้</th>
                      <th className="py-3 px-4 w-44">สัดส่วนคะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parties.map((party) => {
                      const pct = Math.round(
                        (party.voteCount / Math.max(totalVotes, 1)) * 100
                      );
                      return (
                        <tr key={party.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold">
                              เบอร์ {party.partyNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-slate-900 text-sm">
                              {party.partyName}
                            </div>
                            <div className="text-slate-500 italic mt-0.5">
                              "{party.slogan}"
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{party.leaderName}</div>
                            <div className="text-[11px] text-slate-400">ชั้น {party.classroom}</div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <ul className="space-y-1 text-slate-600">
                              {party.policies.map((pol, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <Award className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                  <span>{pol}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="text-base font-bold text-slate-900 tabular-nums">
                              {party.voteCount.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-teal-700 font-semibold tabular-nums">
                              {pct}% ของผู้ลงคะแนน
                            </div>
                          </td>
                          <td className="py-4 px-4 align-middle">
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2.2: ตารางตู้รับความคิดเห็นนักเรียน (Data Table) */}
          {councilTab === 'SUGGESTIONS' && (
            <div>
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  ตารางข้อเสนอแนะและความคิดเห็นจากนักเรียน
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                      <th className="py-3 px-4">วันที่</th>
                      <th className="py-3 px-4">หมวดหมู่ / หัวข้อ</th>
                      <th className="py-3 px-4">ผู้เสนอ</th>
                      <th className="py-3 px-4">การตอบกลับจากสภานักเรียน</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suggestions.map((sug) => (
                      <tr key={sug.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                          {sug.createdAt}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {sug.category}
                          </span>
                          <div className="font-bold text-slate-900 mt-1">{sug.topic}</div>
                          <div className="text-slate-600 mt-0.5">{sug.detail}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {sug.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {replyingSuggestionId === sug.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={replyDraft}
                                onChange={(e) => setReplyDraft(e.target.value)}
                                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs w-56"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveReplySuggestion(sug.id)}
                                className="px-2.5 py-1 rounded-md bg-teal-600 text-white text-xs font-semibold"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingSuggestionId(null)}
                                className="px-2 py-1 rounded-md border border-slate-200 text-slate-500 text-xs"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : sug.councilReply ? (
                            <span className="text-teal-800 font-medium">{sug.councilReply}</span>
                          ) : (
                            <span className="text-slate-400">รอการตอบกลับ</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
                            {sug.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyDraft(
                                sug.councilReply ||
                                  'รับเรื่องและประสานงานดำเนินการเรียบร้อยแล้วครับ'
                              );
                              setReplyingSuggestionId(sug.id);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                          >
                            ตอบกลับ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2.3: ตารางโครงการและกิจกรรมสภานักเรียน (Data Table) */}
          {councilTab === 'ACTIVITIES' && (
            <div>
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  ตารางโครงการและงบประมาณกิจกรรมสภานักเรียน
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                      <th className="py-3 px-4">วันที่จัดกิจกรรม</th>
                      <th className="py-3 px-4">ชื่อโครงการ / กิจกรรม</th>
                      <th className="py-3 px-4">สถานที่</th>
                      <th className="py-3 px-4">หน่วยงานรับผิดชอบ</th>
                      <th className="py-3 px-4 text-right">งบประมาณ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentAffairsCouncilService.getActivities().map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap tabular-nums">
                          {act.date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {act.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {act.location}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {act.organizer}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {act.budgetBaht.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
