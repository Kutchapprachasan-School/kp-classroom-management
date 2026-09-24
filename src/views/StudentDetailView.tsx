import React, { useState, useEffect } from 'react';
import { StudentRadarChart } from '../components/teacher/StudentRadarChart';
import { StudentNotesCard } from '../components/teacher/StudentNotesCard';
import { studentTatthanProfile } from '../data/mockData';
import { homeVisitService, type HomeVisitRecord } from '../services/homeVisitService';
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
} from 'lucide-react';

interface StudentDetailViewProps {
  onOpenHomeVisit?: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ onOpenHomeVisit }) => {
  const [visitRecord, setVisitRecord] = useState<HomeVisitRecord | null>(null);

  useEffect(() => {
    const records = homeVisitService.getAll();
    const match = records.find((r) => r.studentCode === '45102') || records[0] || null;
    setVisitRecord(match);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
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
    </div>
  );
};
