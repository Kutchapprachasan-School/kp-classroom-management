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

      {/* Top Module Switcher: กิจการนักเรียน vs สภานักเรียน E-Voting */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-1.5">
            <span>
              ย้ายจากโปรเจกต์ระบบการลา มาอยู่ในระบบจัดการชั้นเรียนครบวงจร
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            ระบบบริหารงานกิจการนักเรียน & สภานักเรียนออนไลน์ (E-Voting)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            เช็คชื่อแถวหน้าเสาธง (Exception-Only) • บันทึกวินัย/พฤติกรรม • อนุมัติใบลานักเรียน • เลือกตั้งสภานักเรียน E-Voting • ตู้รับฟังความคิดเห็น
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setMainSection('AFFAIRS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              mainSection === 'AFFAIRS'
                ? 'bg-[#0f2a59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>1. ฝ่ายกิจการนักเรียน & ใบลานักเรียน</span>
          </button>

          <button
            onClick={() => setMainSection('COUNCIL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              mainSection === 'COUNCIL'
                ? 'bg-[#0f2a59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Vote className="w-4 h-4 text-amber-300" />
            <span>2. สภานักเรียน & เลือกตั้ง E-Voting</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: ระบบบริหารงานกิจการนักเรียน (Student Affairs)
         ===================================================================== */}
      {mainSection === 'AFFAIRS' && (
        <div className="space-y-5">
          {/* Sub-navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAffairsTab('ASSEMBLY')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                  affairsTab === 'ASSEMBLY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>เช็คชื่อแถวหน้าเสาธง (Exception-Only)</span>
              </button>

              <button
                onClick={() => setAffairsTab('DISCIPLINE')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                  affairsTab === 'DISCIPLINE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>บันทึกวินัย & คะแนนพฤติกรรม</span>
              </button>

              <button
                onClick={() => setAffairsTab('STUDENT_LEAVE')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                  affairsTab === 'STUDENT_LEAVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>
                  ใบลานักเรียน ลาป่วย/ลากิจ ({leaveRequests.length})
                </span>
              </button>
            </div>

            {onOpenHomeVisit && (
              <button
                onClick={onOpenHomeVisit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>เปิดระบบเยี่ยมบ้าน นร.01 / กสศ. (CCT) &rarr;</span>
              </button>
            )}
          </div>

          {/* Tab 1.1: เช็คชื่อแถวหน้าเสาธง */}
          {affairsTab === 'ASSEMBLY' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    เช็คชื่อเข้าแถวเคารพธงชาติรายวัน — ชั้น ม.3/1
                  </h2>
                  <p className="text-xs text-slate-500">
                    ใช้เทคนิค Exception-Only: ค่าเริ่มต้นทุกคนคือ "มาเข้าแถว" บันทึกลงฐานข้อมูลเฉพาะคนที่ สาย / ลา / ขาด (และคุ้มครองเด็กย้ายเข้าใหม่ตามวัน enrolled_at)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  ประหยัดโควตา Database 90%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="p-3">รหัสนักเรียน</th>
                      <th className="p-3">ชื่อ - นามสกุล</th>
                      <th className="p-3">วันที่ย้ายเข้าเรียน (enrolled_at)</th>
                      <th className="p-3">สถานะเข้าแถววันนี้</th>
                      <th className="p-3">หมายเหตุ</th>
                      <th className="p-3 text-right">กดเปลี่ยนสถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assemblyList.map((stu) => (
                      <tr key={stu.studentCode}>
                        <td className="p-3 font-mono font-semibold">
                          {stu.studentCode}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {stu.studentName}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            เริ่มนับคาบตั้งแต่: {stu.enrolledAt}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              stu.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : stu.status === 'LATE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : stu.status === 'SICK_LEAVE' ||
                                  stu.status === 'PERSONAL_LEAVE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {stu.status === 'PRESENT'
                              ? 'มาเข้าแถวปกติ (Default)'
                              : stu.status === 'LATE'
                              ? 'มาสาย'
                              : stu.status === 'SICK_LEAVE'
                              ? 'ลาป่วย'
                              : stu.status === 'PERSONAL_LEAVE'
                              ? 'ลากิจ'
                              : 'ขาดเข้าแถว'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {stu.note || '-'}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {[
                            { key: 'PRESENT', label: 'มา' },
                            { key: 'LATE', label: 'สาย' },
                            { key: 'SICK_LEAVE', label: 'ลาป่วย' },
                            { key: 'ABSENT', label: 'ขาด' },
                          ].map((btn) => (
                            <button
                              key={btn.key}
                              onClick={() =>
                                handleUpdateAssembly(
                                  stu.studentCode,
                                  btn.key as any
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                stu.status === btn.key
                                  ? 'bg-[#0f2a59] text-white border-[#0f2a59]'
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

          {/* Tab 1.2: บันทึกวินัยและคะแนนพฤติกรรม */}
          {affairsTab === 'DISCIPLINE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddDiscipline}
                className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs"
              >
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-rose-600" />
                  <span>บันทึกคะแนนความประพฤติ / จิตอาสา</span>
                </h3>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เลือกนักเรียน
                  </label>
                  <select
                    value={newDiscStudent}
                    onChange={(e) => setNewDiscStudent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                      ประเภท
                    </label>
                    <select
                      value={newDiscType}
                      onChange={(e) => setNewDiscType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    >
                      <option value="BONUS">+ เพิ่มคะแนนความดี/จิตอาสา</option>
                      <option value="DEDUCT">- หักคะแนนระเบียบวินัย</option>
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0f2a59] hover:bg-[#163d7a] text-white font-bold"
                >
                  บันทึกคะแนนพฤติกรรม
                </button>
              </form>

              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  ประวัติการบันทึกวินัยและคะแนนความประพฤติล่าสุด (คะแนนตั้งต้น 100 คะแนน)
                </h3>
                <div className="space-y-2.5 text-xs">
                  {disciplineLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {log.studentName} ({log.classroom})
                        </div>
                        <div className="text-slate-600 mt-0.5">{log.reason}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ผู้บันทึก: {log.reporter} • วันที่ {log.date}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-bold text-xs shrink-0 ${
                          log.type === 'BONUS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.type === 'BONUS' ? `+${log.points}` : `-${log.points}`}{' '}
                        คะแนน
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 1.3: ใบลานักเรียน (แยกจาก E-Leave ของครู) */}
          {affairsTab === 'STUDENT_LEAVE' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    รายการขออนุมัติใบลานักเรียน (ลาป่วย / ลากิจ จากพอร์ทัลนักเรียน)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เมื่อครูอนุมัติ ระบบจะซิงก์เข้าตารางเช็คชื่อรายคาบและคำนวณตามการตั้งค่าเวลามาเรียนโดยอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {req.leaveType} ({req.daysCount} วัน)
                        </span>
                        <span className="font-bold text-slate-900">
                          {req.studentName} (รหัส {req.studentCode} • ชั้น{' '}
                          {req.classroom})
                        </span>
                      </div>
                      <div className="text-slate-700 mt-1">
                        เหตุผลการลา: {req.reason}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        วันที่ลา: {req.startDate} ถึง {req.endDate} • เบอร์ผู้ปกครอง:{' '}
                        {req.guardianPhone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'APPROVED' ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          ✓ อนุมัติใบลาแล้ว
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApproveLeave(req.id, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            อนุมัติใบลา
                          </button>
                          <button
                            onClick={() => handleApproveLeave(req.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                          >
                            ไม่อนุมัติ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 2: ระบบสภานักเรียน & เลือกตั้งออนไลน์ E-Voting
         ===================================================================== */}
      {mainSection === 'COUNCIL' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 bg-white p-3.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setCouncilTab('EVOTING')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                councilTab === 'EVOTING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>เลือกตั้งสภานักเรียนออนไลน์ (E-Voting Real-time)</span>
            </button>

            <button
              onClick={() => setCouncilTab('SUGGESTIONS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                councilTab === 'SUGGESTIONS'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>ตู้รับความคิดเห็นและข้อเสนอแนะ ({suggestions.length})</span>
            </button>

            <button
              onClick={() => setCouncilTab('ACTIVITIES')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                councilTab === 'ACTIVITIES'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>โครงการและปฏิทินกิจกรรมสภานักเรียน</span>
            </button>
          </div>

          {/* Tab 2.1: เลือกตั้งสภานักเรียน E-Voting */}
          {councilTab === 'EVOTING' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {parties.map((party) => {
                const pct = Math.round(
                  (party.voteCount / Math.max(totalVotes, 1)) * 100
                );
                return (
                  <div
                    key={party.id}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className={`p-4 bg-gradient-to-r ${party.colorClass} text-white flex items-center justify-between`}
                      >
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20">
                          เบอร์ {party.partyNumber}
                        </span>
                        <span className="text-lg font-black">
                          {party.voteCount.toLocaleString()} คะแนน ({pct}%)
                        </span>
                      </div>
                      <div className="p-5 space-y-3 text-xs">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {party.partyName}
                          </h3>
                          <div className="text-slate-500 mt-0.5">
                            หัวหน้าพรรค: {party.leaderName} ({party.classroom})
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 italic">
                          "{party.slogan}"
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800">
                            นโยบายหลัก:
                          </div>
                          {party.policies.map((pol, idx) => (
                            <div
                              key={idx}
                              className="text-slate-600 flex items-start gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{pol}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2.2: ตู้รับความคิดเห็นนักเรียน */}
          {councilTab === 'SUGGESTIONS' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                ตู้รับความคิดเห็นและข้อเสนอแนะจากพอร์ทัลนักเรียน
              </h3>
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-4 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        [{sug.category}] {sug.topic}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {sug.status}
                      </span>
                    </div>
                    <div className="text-slate-600">{sug.detail}</div>
                    <div className="text-[11px] text-slate-400">
                      ผู้เสนอ: {sug.studentName} • {sug.createdAt}
                    </div>
                    {sug.councilReply && (
                      <div className="p-3 rounded-lg bg-blue-50 text-blue-900 font-medium">
                        คำตอบจากสภานักเรียน/ครู: {sug.councilReply}
                      </div>
                    )}
                    <div className="pt-1">
                      <button
                        onClick={() => handleReplySuggestion(sug.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        ตอบกลับข้อเสนอแนะ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2.3: กิจกรรมสภานักเรียน */}
          {councilTab === 'ACTIVITIES' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                ปฏิทินโครงการและกิจกรรมสภานักเรียน
              </h3>
              {studentAffairsCouncilService.getActivities().map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">{act.title}</div>
                    <div className="text-slate-500 mt-0.5">
                      วันที่ {act.date} • สถานที่: {act.location} • ผู้จัด:{' '}
                      {act.organizer}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                    งบประมาณ {act.budgetBaht.toLocaleString()} บาท
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
