import React, { useState, useEffect } from 'react';
import { StudentRadarChart } from '../components/teacher/StudentRadarChart';
import { StudentNotesCard } from '../components/teacher/StudentNotesCard';
import { studentTatthanProfile, classroomsListData } from '../data/mockData';
import { homeVisitService, type HomeVisitRecord } from '../services/homeVisitService';
import { messagingService, STUDENT_TRANSFERRED_EVENT } from '../services/messagingService';
import { studentService } from '../services/studentService';
import type { ClassroomRosterItem } from '../types/viewModels';
import {
  HeartHandshake,
  MapPin,
  Phone,
  Home,
  AlertTriangle,
  CheckCircle2,
  Award,
  ExternalLink,
  Navigation,
  ShieldAlert,
  ArrowRightLeft,
  X,
} from 'lucide-react';

interface StudentDetailViewProps {
  onOpenHomeVisit?: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ onOpenHomeVisit }) => {
  const [visitRecord, setVisitRecord] = useState<HomeVisitRecord | null>(null);

  const resolveCurrentRoom = (): ClassroomRosterItem => {
    const found = studentService.findStudentByCode('45102');
    if (found) {
      const match = classroomsListData.find(
        (c) => c.id === found.classroomId || c.roomNumber === found.classroomId
      );
      if (match) return match;
    }
    return classroomsListData.find((c) => c.roomNumber === 'ม.3/1') || classroomsListData[0];
  };

  const [currentRoom, setCurrentRoom] = useState<ClassroomRosterItem>(() => resolveCurrentRoom());
  const currentRoomName = currentRoom.roomNumber || currentRoom.name;

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState(() => {
    const defaultTarget = classroomsListData.find(
      (c) => c.id !== resolveCurrentRoom().id && c.roomNumber !== resolveCurrentRoom().roomNumber
    );
    return defaultTarget ? defaultTarget.id : 'room-3-2';
  });
  const [transferReason, setTransferReason] = useState('');
  const [transferSuccessNotice, setTransferSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const records = homeVisitService.getAll();
    const match = records.find((r) => r.studentCode === '45102') || records[0] || null;
    setVisitRecord(match);
  }, []);

  // ซิงค์การย้ายห้องเรียนอัตโนมัติจากทุกหน้าจอ
  useEffect(() => {
    const handleTransferred = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail && customEvent.detail.student.code === '45102') {
        const nextRoom = classroomsListData.find(
          (c) =>
            c.id === customEvent.detail.toClassroomId ||
            c.roomNumber === customEvent.detail.toClassroomName
        );
        if (nextRoom) {
          setCurrentRoom(nextRoom);
        }
      }
    };
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
    return () => window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleTransferred);
  }, []);

  const handleOpenTransferModal = () => {
    const nextRoom = classroomsListData.find(
      (c) => c.id !== currentRoom.id && c.roomNumber !== currentRoom.roomNumber
    );
    if (nextRoom) {
      setTargetRoomId(nextRoom.id);
    }
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = messagingService.executeStudentTransfer({
        studentCode: '45102',
        fromClassroomId: currentRoom.id,
        toClassroomId: targetRoomId,
        transferReason: transferReason.trim() || undefined,
        actorLabel: 'ครูผู้สอน / แอดมินวิชาการ',
      });
      const targetRoom = classroomsListData.find((c) => c.id === targetRoomId);
      if (targetRoom) {
        setCurrentRoom(targetRoom);
      }
      setTransferSuccessNotice(res.message);
      setIsTransferModalOpen(false);
      setTimeout(() => setTransferSuccessNotice(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการย้ายห้องเรียน';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Student Profile Quick Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
            #{studentTatthanProfile.studentNo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {studentTatthanProfile.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                ห้อง {currentRoomName}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              รหัสนักเรียน: 45102 • รายวิชา: {studentTatthanProfile.subjectCode} {studentTatthanProfile.subjectName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenTransferModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          <span>ย้ายห้องเรียน (ซิงค์กลุ่มแชท)</span>
        </button>
      </div>

      {transferSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{transferSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setTransferSuccessNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Radar Chart with 5 dimensions & Comparison metrics */}
      <StudentRadarChart profile={studentTatthanProfile} />

      {/* 2. Integrated Home Visit & SDQ Student Care Card (เชื่อมข้อมูลทางบ้านคู่กับผลการเรียน) */}
      {visitRecord && (
        <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 via-amber-50/50 to-white px-6 py-4 border-b border-rose-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    ข้อมูลเยี่ยมบ้าน & ระบบดูแลช่วยเหลือผู้เรียน (SDQ)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {visitRecord.visitStatus === 'VISITED' ? 'เยี่ยมบ้านแล้ว' : 'รอเยี่ยมบ้าน'}
                  </span>
                  {visitRecord.scholarshipRecommended && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      เสนอรับทุนการศึกษา
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ข้อมูลเชื่อมโยงอัตโนมัติจากที่นักเรียนกรอกและผลบันทึกของครูที่ปรึกษา (ช่วยวิเคราะห์สาเหตุการเรียน/ส่งงานช้า)
                </p>
              </div>
            </div>

            {onOpenHomeVisit && (
              <button
                onClick={onOpenHomeVisit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>ดูข้อมูลเยี่ยมบ้าน / SDQ เต็มรูปแบบ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Family & Living Condition */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-blue-600" />
                <span>สภาพครอบครัวและการเดินทาง</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">ผู้ปกครอง:</span>
                  <span className="font-semibold text-slate-800">
                    {visitRecord.guardianName} ({visitRecord.guardianRelation})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">เบอร์ติดต่อ:</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {visitRecord.guardianPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">อาชีพ / รายได้:</span>
                  <span className="font-semibold text-slate-800">
                    {visitRecord.guardianOccupation} ({visitRecord.familyIncomeRange})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ที่อยู่อาศัย / เดินทาง:</span>
                  <span className="font-semibold text-slate-800">
                    {visitRecord.housingType} • {visitRecord.travelDistanceKm} กม.
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      พิกัดบ้านที่นักเรียนปักหมุด:
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${visitRecord.gpsLat},${visitRecord.gpsLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      <Navigation className="w-3 h-3" />
                      นำทาง Google Maps
                    </a>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{visitRecord.address}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">จุดสังเกต: {visitRecord.landmarkNote}</p>
                </div>
              </div>
            </div>

            {/* Column 2: SDQ & Risk Screening */}
            <div className="space-y-3 bg-rose-50/40 p-4 rounded-xl border border-rose-200/60">
              <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>ผลประเมิน SDQ & ปัจจัยเสี่ยง</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  SDQ: กลุ่มเสี่ยง ({visitRecord.sdqStudentScore}/40 คะแนน)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-rose-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-rose-700 block mb-1">บันทึกภาวะอารมณ์/พฤติกรรม (SDQ):</span>
                {visitRecord.sdqEmotionalNote}
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  ปัจจัยเสี่ยงที่พบจากการคัดกรอง:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {visitRecord.riskFactors.map((rf, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-800 text-[11px] font-semibold border border-rose-200"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {rf}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Teacher Visit Summary & Evidence Photo */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>สรุปผลเยี่ยมบ้านของครูที่ปรึกษา</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {visitRecord.visitDate}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/60">
                  “{visitRecord.teacherSummaryNote}”
                </p>
              </div>

              {visitRecord.visitPhotos && visitRecord.visitPhotos.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={visitRecord.visitPhotos[0]}
                    alt="ภาพเยี่ยมบ้าน"
                    className="w-20 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="text-[11px] text-slate-500">
                    <div className="font-semibold text-slate-700">ภาพถ่ายหลักฐานการเยี่ยมบ้าน</div>
                    <div>รูปแบบ: {visitRecord.visitMethod}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Qualitative Notes & Context Card */}
      <StudentNotesCard />

      {/* Modal: ย้ายห้องเรียน & ซิงค์กลุ่มแชทอัตโนมัติ */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <span>ย้ายห้องเรียน & ซิงค์กลุ่มแชท ({studentTatthanProfile.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                #{studentTatthanProfile.studentNo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">
                  {studentTatthanProfile.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  รหัส 45102 • ห้องเดิม: {currentRoomName}
                </div>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลือกห้องเรียนปลายทาง (ใหม่) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                >
                  {classroomsListData
                    .filter((c) => c.id !== currentRoom.id && c.roomNumber !== currentRoom.roomNumber)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.roomNumber}) - {c.adviser}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผลการย้ายห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ปรับแผนการเรียน หรือคำร้องขอย้ายห้องจากผู้ปกครอง"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Data Preservation Highlight Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>รับประกันความคงอยู่ของข้อมูล (Data Preservation):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1">
                  <li>
                    <strong>ซิงค์กลุ่มแชทอัตโนมัติ:</strong> ย้ายออกจากกลุ่มแชทครูที่ปรึกษาเดิม และเข้ากลุ่มห้องใหม่ทันที
                  </li>
                  <li>
                    <strong>คะแนนและงานที่ส่งคงอยู่ 100%:</strong> คะแนนเก็บ, ไฟล์งาน, ประวัติเวลาเรียน และแต้ม XP จะไม่สูญหาย
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>ยืนยันการย้ายห้องเรียน & ซิงค์กลุ่มแชท</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
