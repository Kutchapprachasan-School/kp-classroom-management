import React, { useState } from 'react';
import {
  Vote,
  FileCheck2,
  MessageSquare,
  CheckCircle2,
  Award,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  studentAffairsCouncilService,
  type CouncilCandidateParty,
  type StudentLeaveRequest,
  type StudentSuggestion,
} from '../services/studentAffairsCouncilService';

interface StudentCouncilAffairsPortalViewProps {
  section?: 'LEAVE' | 'COUNCIL';
  onAwardXp?: (xp: number) => void;
}

export const StudentCouncilAffairsPortalView: React.FC<
  StudentCouncilAffairsPortalViewProps
> = ({ section = 'LEAVE', onAwardXp }) => {
  const studentCode = '45102';
  const studentName = 'ด.ช. ทัตธน คำฝั้น';
  const classroom = 'ม.3/1';

  const [parties, setParties] = useState<CouncilCandidateParty[]>(() =>
    studentAffairsCouncilService.getCandidateParties()
  );
  const [votedPartyId, setVotedPartyId] = useState<string | null>(() =>
    studentAffairsCouncilService.hasStudentVoted(studentCode)
  );

  // Leave form state
  const [leaveType, setLeaveType] =
    useState<StudentLeaveRequest['leaveType']>('ลาป่วย');
  const [startDate, setStartDate] = useState('2026-09-25');
  const [endDate, setEndDate] = useState('2026-09-25');
  const [leaveReason, setLeaveReason] = useState('');
  const [myLeaves, setMyLeaves] = useState<StudentLeaveRequest[]>(() =>
    studentAffairsCouncilService
      .getStudentLeaves()
      .filter((l) => l.studentCode === studentCode)
  );

  // Suggestion form state
  const [sugCategory, setSugCategory] =
    useState<StudentSuggestion['category']>('อาคารสถานที่/สิ่งแวดล้อม');
  const [sugTopic, setSugTopic] = useState('');
  const [sugDetail, setSugDetail] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleVote = (partyId: string) => {
    const res = studentAffairsCouncilService.castStudentVote(
      studentCode,
      partyId
    );
    if (res.alreadyVoted) {
      showToast('คุณได้ใช้สิทธิ์ลงคะแนนเลือกตั้งสภานักเรียนไปแล้ว');
      return;
    }
    setParties(res.parties);
    setVotedPartyId(partyId);
    if (onAwardXp) onAwardXp(30);
    showToast(
      'ลงคะแนนเลือกตั้งสภานักเรียนออนไลน์ (E-Voting) สำเร็จ! (+30 XP)'
    );
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    const updated = studentAffairsCouncilService.submitStudentLeave({
      studentCode,
      studentName,
      classroom,
      leaveType,
      startDate,
      endDate,
      daysCount: 1,
      reason: leaveReason.trim(),
      guardianPhone: '081-452-9918',
    });
    setMyLeaves(updated.filter((l) => l.studentCode === studentCode));
    setLeaveReason('');
    showToast('ส่งใบลาออนไลน์ให้ครูที่ปรึกษาพิจารณาอนุมัติเรียบร้อยแล้ว');
  };

  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTopic.trim()) return;
    studentAffairsCouncilService.submitSuggestion({
      studentCode,
      studentName: `${studentName} (${classroom})`,
      category: sugCategory,
      topic: sugTopic.trim(),
      detail: sugDetail.trim(),
    });
    setSugTopic('');
    setSugDetail('');
    if (onAwardXp) onAwardXp(20);
    showToast(
      'ส่งข้อเสนอแนะถึงสภานักเรียนและฝ่ายกิจการนักเรียนเรียบร้อยแล้ว (+20 XP)'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {section === 'LEAVE' ? (
        <>
          {/* 1. Header: ยื่นใบลา & ความประพฤติ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                <span>ยื่นใบลาออนไลน์ & คะแนนความประพฤติ</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                ส่งใบลาป่วย/ลากิจถึงครูที่ปรึกษา และตรวจสอบประวัติการลากับคะแนนความประพฤติ
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs shrink-0">
              <div className="text-slate-500">คะแนนความประพฤติของฉัน</div>
              <div className="text-base font-bold text-teal-700 flex items-center gap-1 mt-0.5 tabular-nums">
                <ShieldCheck className="w-4 h-4" />
                <span>110 / 100 คะแนน (ดีเยี่ยม)</span>
              </div>
            </div>
          </div>

          {/* 2. ฟอร์มยื่นใบลานักเรียน + ตารางประวัติใบลา */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <form onSubmit={handleSubmitLeave} className="p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-teal-600" />
                <span>แบบฟอร์มยื่นใบลาออนไลน์ (ส่งตรงถึงครูที่ปรึกษา)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ประเภทการลา
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="ลาป่วย">ลาป่วย</option>
                    <option value="ลากิจ">ลากิจ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ตั้งแต่วันที่
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สาเหตุการลา (ระบุอาการป่วยหรือธุระจำเป็น)
                </label>
                <textarea
                  rows={2}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="เช่น มีไข้หวัดพักรักษาตัวที่บ้าน / เดินทางไปทำธุระกับผู้ปกครอง..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
              >
                ส่งใบลาให้ครูที่ปรึกษาอนุมัติ
              </button>
            </form>

            {myLeaves.length > 0 && (
              <div className="border-t border-slate-100">
                <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 font-bold text-slate-700">
                  ตารางประวัติใบลาของฉัน
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="py-2.5 px-4">ประเภท</th>
                        <th className="py-2.5 px-4">วันที่ลา</th>
                        <th className="py-2.5 px-4">สาเหตุ</th>
                        <th className="py-2.5 px-4 text-right">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myLeaves.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {l.leaveType}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 tabular-nums">
                            {l.startDate}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{l.reason}</td>
                          <td className="py-2.5 px-4 text-right font-semibold text-teal-700">
                            {l.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รอพิจารณา'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 1. Header: สภานักเรียน & เลือกตั้งออนไลน์ (E-Voting) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Vote className="w-5 h-5 text-teal-600" />
                <span>สภานักเรียน & เลือกตั้งออนไลน์ (E-Voting)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                ใช้สิทธิ์เลือกตั้งสภานักเรียนออนไลน์ (1 สิทธิ์ 1 เสียง) และส่งข้อเสนอแนะพัฒนาโรงเรียน
              </p>
            </div>
            {votedPartyId && (
              <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold shrink-0">
                ✓ ใช้สิทธิ์ลงคะแนนเลือกตั้งแล้ว
              </span>
            )}
          </div>

          {/* 2. คูหาเลือกตั้งสภานักเรียนออนไลน์ (Rule of Thirds 3-Column Cards) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  คูหาเลือกตั้งสภานักเรียนออนไลน์ (E-Voting)
                </h2>
                <p className="text-xs text-slate-500">
                  เลือกพรรคที่ชื่นชอบเพื่อพัฒนาโรงเรียนของเรา (รับ +30 XP เมื่อใช้สิทธิ์)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {parties.map((party) => {
                const isSelected = votedPartyId === party.id;
                return (
                  <div
                    key={party.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-colors ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/30'
                        : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold">
                          เบอร์ {party.partyNumber}
                        </span>
                        <span className="font-bold text-slate-500 tabular-nums">
                          {votedPartyId
                            ? `${party.voteCount.toLocaleString()} คะแนน`
                            : '🔒 ปิดผลคะแนนก่อนโหวต'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {party.partyName}
                      </div>
                      <div className="text-slate-500">
                        หัวหน้าพรรค: {party.leaderName} ({party.classroom})
                      </div>
                      <div className="space-y-1 pt-1">
                        {party.policies.map((pol, i) => (
                          <div key={i} className="text-slate-600 flex gap-1.5">
                            <Award className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{pol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={Boolean(votedPartyId)}
                      onClick={() => handleVote(party.id)}
                      className={`w-full py-2 rounded-xl font-semibold transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : votedPartyId
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isSelected
                        ? '✓ พรรคที่คุณลงคะแนน'
                        : votedPartyId
                        ? 'ใช้สิทธิ์แล้ว'
                        : `ลงคะแนนเบอร์ ${party.partyNumber}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ตัวเลือก ไม่ประสงค์ลงคะแนน (Abstain / Vote No) ตามระเบียบการเลือกตั้ง */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                ตามระเบียบการเลือกตั้งสภานักเรียน นักเรียนสามารถเลือกใช้สิทธิ์{' '}
                <span className="font-semibold text-slate-700">"ไม่ประสงค์ลงคะแนน"</span> ได้ (รับ +30 XP เช่นกัน)
              </div>
              <button
                disabled={Boolean(votedPartyId)}
                onClick={() => handleVote('ABSTAIN')}
                className={`px-4 py-2 rounded-xl font-semibold border transition-colors shrink-0 ${
                  votedPartyId === 'ABSTAIN'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : votedPartyId
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                {votedPartyId === 'ABSTAIN'
                  ? '✓ ใช้สิทธิ์ไม่ประสงค์ลงคะแนนแล้ว'
                  : 'ไม่ประสงค์ลงคะแนน (Vote No)'}
              </button>
            </div>
          </div>

          {/* 3. ฟอร์มส่งข้อเสนอแนะถึงสภานักเรียน */}
          <form
            onSubmit={handleSubmitSuggestion}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>ตู้รับฟังความคิดเห็น & ข้อเสนอแนะถึงสภานักเรียน (+20 XP)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมวดหมู่เรื่องที่ต้องการเสนอแนะ
                </label>
                <select
                  value={sugCategory}
                  onChange={(e) => setSugCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="อาคารสถานที่/สิ่งแวดล้อม">
                    อาคารสถานที่ / สิ่งแวดล้อม
                  </option>
                  <option value="อาหารกลางวัน/โรงอาหาร">อาหารกลางวัน / โรงอาหาร</option>
                  <option value="กิจกรรม/กีฬา">กิจกรรมนักเรียน / กีฬา</option>
                  <option value="การเรียนการสอน">การเรียนการสอน</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หัวข้อเรื่อง
                </label>
                <input
                  type="text"
                  required
                  value={sugTopic}
                  onChange={(e) => setSugTopic(e.target.value)}
                  placeholder="เช่น ขอเพิ่มจุดเติมน้ำดื่ม, เสนอกิจกรรมชมรม..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={3}
                required
                value={sugDetail}
                onChange={(e) => setSugDetail(e.target.value)}
                placeholder="อธิบายรายละเอียดและสถานที่เพื่อให้สภานักเรียนประสานงานต่อ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งข้อเสนอแนะถึงสภานักเรียน</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
