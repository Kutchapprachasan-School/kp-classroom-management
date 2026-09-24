import React, { useState } from 'react';
import {
  ShieldAlert,
  Vote,
  UserCheck,
  CheckCircle2,
  Plus,
  MessageSquare,
  Calendar,
  FileCheck2,
  HeartHandshake,
  Award,
} from 'lucide-react';
import {
  studentAffairsCouncilService,
  type AssemblyExceptionRecord,
  type DisciplineRecord,
  type StudentLeaveRequest,
  type CouncilCandidateParty,
  type StudentSuggestion,
} from '../services/studentAffairsCouncilService';

interface StudentAffairsCouncilViewProps {
  initialSection?: 'AFFAIRS' | 'COUNCIL';
  onOpenHomeVisit?: () => void;
}

export const StudentAffairsCouncilView: React.FC<
  StudentAffairsCouncilViewProps
> = ({ initialSection = 'AFFAIRS', onOpenHomeVisit }) => {
  const [mainSection, setMainSection] = useState<'AFFAIRS' | 'COUNCIL'>(
    initialSection
  );
  const [affairsTab, setAffairsTab] = useState<
    'ASSEMBLY' | 'DISCIPLINE' | 'STUDENT_LEAVE'
  >('ASSEMBLY');
  const [councilTab, setCouncilTab] = useState<
    'EVOTING' | 'SUGGESTIONS' | 'ACTIVITIES'
  >('EVOTING');

  const [assemblyList, setAssemblyList] = useState<AssemblyExceptionRecord[]>(
    () => studentAffairsCouncilService.getAssemblyRecords()
  );
  const [disciplineLogs, setDisciplineLogs] = useState<DisciplineRecord[]>(() =>
    studentAffairsCouncilService.getDisciplineLogs()
  );
  const [leaveRequests, setLeaveRequests] = useState<StudentLeaveRequest[]>(
    () => studentAffairsCouncilService.getStudentLeaves()
  );
  const [parties] = useState<CouncilCandidateParty[]>(() =>
    studentAffairsCouncilService.getCandidateParties()
  );
  const [suggestions, setSuggestions] = useState<StudentSuggestion[]>(() =>
    studentAffairsCouncilService.getSuggestions()
  );

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

  const handleUpdateAssembly = (
    code: string,
    status: AssemblyExceptionRecord['status']
  ) => {
    const updated = studentAffairsCouncilService.updateAssemblyStatus(
      code,
      status
    );
    setAssemblyList(updated);
    showToast(`อัปเดตสถานะเข้าแถวหน้าเสาธงรหัส ${code} เป็น ${status} แล้ว`);
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

  const handleReplySuggestion = (id: string) => {
    const reply = prompt(
      'ระบุข้อความตอบกลับจากสภานักเรียน/ครูที่ปรึกษา:',
      'รับเรื่องและประสานงานดำเนินการเรียบร้อยแล้วครับ'
    );
    if (!reply) return;
    const updated = studentAffairsCouncilService.replySuggestion(
      id,
      'RESOLVED',
      reply
    );
    setSuggestions(updated);
    showToast('ตอบกลับข้อเสนอแนะนักเรียนเรียบร้อยแล้ว');
  };

  const totalVotes = parties.reduce((s, p) => s + p.voteCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Clean Module Header & Mode Switcher (60% White, 30% Slate, 10% Teal) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            ระบบบริหารงานกิจการนักเรียน & สภานักเรียนออนไลน์ (E-Voting)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เช็คชื่อแถวหน้าเสาธง (Exception-Only) • บันทึกวินัยและคะแนนความประพฤติ • อนุมัติใบลานักเรียน • เลือกตั้งสภานักเรียน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMainSection('AFFAIRS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                mainSection === 'AFFAIRS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
              <span>ฝ่ายกิจการนักเรียน & ใบลา</span>
            </button>

            <button
              onClick={() => setMainSection('COUNCIL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                mainSection === 'COUNCIL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote className="w-3.5 h-3.5 text-teal-400" />
              <span>สภานักเรียน & E-Voting</span>
            </button>
          </div>

          {onOpenHomeVisit && (
            <button
              onClick={onOpenHomeVisit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
              <span>เยี่ยมบ้าน นร.01</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Rule of Thirds (กฎสามส่วน): 3 Balanced Summary Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              เช็คชื่อหน้าเสาธงวันนี้ (ม.3/1)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {assemblyList.filter((s) => s.status === 'PRESENT').length}/{assemblyList.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                มาเข้าแถวปกติ
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            Exception-Only
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              ใบลานักเรียน (ลาป่วย / ลากิจ)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {leaveRequests.filter((r) => r.status === 'PENDING').length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                รอพิจารณา (จากทั้งหมด {leaveRequests.length} ใบ)
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            ซิงก์เวลาเรียนอัตโนมัติ
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              ผู้ใช้สิทธิ์เลือกตั้งสภานักเรียน E-Voting
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-700 tabular-nums">
                {totalVotes.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-500">
                คะแนนเสียง (Real-time)
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            {parties.length} พรรคผู้สมัคร
          </span>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: ระบบบริหารงานกิจการนักเรียน (Student Affairs)
         ===================================================================== */}
      {mainSection === 'AFFAIRS' && (
        <div className="space-y-5">
          {/* Unified Sub-navigation (60-30-10 Rule: No clashing rainbow buttons) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setAffairsTab('ASSEMBLY')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    affairsTab === 'ASSEMBLY'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>เช็คชื่อแถวหน้าเสาธง</span>
                </button>

                <button
                  onClick={() => setAffairsTab('DISCIPLINE')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    affairsTab === 'DISCIPLINE'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>ตารางวินัย & คะแนนพฤติกรรม ({disciplineLogs.length})</span>
                </button>

                <button
                  onClick={() => setAffairsTab('STUDENT_LEAVE')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    affairsTab === 'STUDENT_LEAVE'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>ตารางอนุมัติใบลานักเรียน ({leaveRequests.length})</span>
                </button>
              </div>
            </div>

            {/* Tab 1.1: เช็คชื่อแถวหน้าเสาธง (Data Table) */}
            {affairsTab === 'ASSEMBLY' && (
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      ตารางเช็คชื่อเข้าแถวเคารพธงชาติรายวัน — ชั้น ม.3/1
                    </h2>
                    <p className="text-xs text-slate-500">
                      ค่าเริ่มต้นทุกคนคือ "มาเข้าแถว" บันทึกลงฐานข้อมูลเฉพาะคนที่ สาย / ลา / ขาด (คุ้มครองวันย้ายเข้า enrolled_at)
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                        <th className="py-3 px-4">รหัสนักเรียน</th>
                        <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                        <th className="py-3 px-4">วันเริ่มนับคาบเรียน (enrolled_at)</th>
                        <th className="py-3 px-4">สถานะเข้าแถววันนี้</th>
                        <th className="py-3 px-4">หมายเหตุ</th>
                        <th className="py-3 px-4 text-right">เปลี่ยนสถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assemblyList.map((stu) => (
                        <tr key={stu.studentCode} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 tabular-nums">
                            {stu.studentCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {stu.studentName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                            {stu.enrolledAt}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {stu.status === 'PRESENT' ? (
                              <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-teal-500" />
                                <span>มาเข้าแถวปกติ</span>
                              </span>
                            ) : stu.status === 'LATE' ? (
                              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>มาสาย</span>
                              </span>
                            ) : stu.status === 'SICK_LEAVE' || stu.status === 'PERSONAL_LEAVE' ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-slate-500" />
                                <span>{stu.status === 'SICK_LEAVE' ? 'ลาป่วย' : 'ลากิจ'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span>ขาดเข้าแถว</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {stu.note || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                            {[
                              { key: 'PRESENT', label: 'มา' },
                              { key: 'LATE', label: 'สาย' },
                              { key: 'SICK_LEAVE', label: 'ลาป่วย' },
                              { key: 'ABSENT', label: 'ขาด' },
                            ].map((btn) => (
                              <button
                                key={btn.key}
                                onClick={() =>
                                  handleUpdateAssembly(stu.studentCode, btn.key as any)
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                  stu.status === btn.key
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                          <th className="py-3 px-4">วันที่</th>
                          <th className="py-3 px-4">นักเรียน</th>
                          <th className="py-3 px-4">รายการพฤติกรรม</th>
                          <th className="py-3 px-4">ผู้บันทึก</th>
                          <th className="py-3 px-4 text-right">คะแนน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {disciplineLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                              {log.date}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{log.studentName}</div>
                              <div className="text-[11px] text-slate-400">ชั้น {log.classroom}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {log.reason}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {log.reporter}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
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

            {/* Tab 1.3: ตารางอนุมัติใบลานักเรียน (Converted from stacked cards to Data Table) */}
            {affairsTab === 'STUDENT_LEAVE' && (
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    ตารางรายการขออนุมัติใบลานักเรียน (ลาป่วย / ลากิจ)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เมื่ออนุมัติแล้ว ระบบจะซิงก์เข้าตารางเช็คชื่อรายคาบและคำนวณตามกติกาเวลาเรียนโดยอัตโนมัติ
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                        <th className="py-3 px-4">รหัส / นักเรียน</th>
                        <th className="py-3 px-4">ประเภทการลา</th>
                        <th className="py-3 px-4">ช่วงวันที่ลา</th>
                        <th className="py-3 px-4">เหตุผล & เบอร์ผู้ปกครอง</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4 text-right">การพิจารณา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaveRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{req.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                              รหัส {req.studentCode} · ชั้น {req.classroom}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold">
                              {req.leaveType} ({req.daysCount} วัน)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap tabular-nums">
                            {req.startDate} ถึง {req.endDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">{req.reason}</div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              โทร. {req.guardianPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
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
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {req.status === 'APPROVED' ? (
                              <span className="text-slate-400 text-[11px]">ดำเนินการแล้ว</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveLeave(req.id, 'APPROVED')}
                                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
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
                  <h3 className="text-sm font-bold text-slate-900">
                    ตารางสรุปผลคะแนนเลือกตั้งสภานักเรียนออนไลน์ (Real-time)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เปรียบเทียบคะแนนเสียง สัดส่วนร้อยละ และนโยบายหลักของผู้สมัครทั้ง {parties.length} พรรค
                  </p>
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
                          {sug.councilReply ? (
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
                            onClick={() => handleReplySuggestion(sug.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
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
