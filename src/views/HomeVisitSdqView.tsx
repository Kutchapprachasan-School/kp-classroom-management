import React, { useState } from 'react';
import {
  MapPin,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Phone,
  Home,
  Navigation,
  Camera,
  Edit3,
  X,
  Save,
  Sparkles,
  ShieldAlert,
  Award,
  ExternalLink,
} from 'lucide-react';
import {
  homeVisitService,
  type HomeVisitRecord,
  type VisitStatus,
  type SdqLevel,
} from '../services/homeVisitService';

export const HomeVisitSdqView: React.FC = () => {
  const [records, setRecords] = useState<HomeVisitRecord[]>(() =>
    homeVisitService.getAll()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'VISITED' | 'PENDING' | 'SDQ_RISK' | 'SCHOLARSHIP'
  >('ALL');
  const [selectedRecord, setSelectedRecord] = useState<HomeVisitRecord | null>(
    null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Form State for Teacher
  const [editVisitStatus, setEditVisitStatus] = useState<VisitStatus>('VISITED');
  const [editVisitDate, setEditVisitDate] = useState('');
  const [editVisitMethod, setEditVisitMethod] =
    useState<HomeVisitRecord['visitMethod']>('ลงพื้นที่เยี่ยมบ้านจริง');
  const [editSdqTeacher, setEditSdqTeacher] = useState<SdqLevel>('NORMAL');
  const [editScholarship, setEditScholarship] = useState(false);
  const [editRiskFactors, setEditRiskFactors] = useState<string[]>([]);
  const [editTeacherNote, setEditTeacherNote] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const openRecordModal = (rec: HomeVisitRecord) => {
    setSelectedRecord(rec);
    setEditVisitStatus(rec.visitStatus);
    setEditVisitDate(rec.visitDate || new Date().toISOString().slice(0, 10));
    setEditVisitMethod(rec.visitMethod);
    setEditSdqTeacher(rec.sdqTeacherStatus);
    setEditScholarship(rec.scholarshipRecommended);
    setEditRiskFactors(rec.riskFactors);
    setEditTeacherNote(rec.teacherSummaryNote);
    setEditPhotoUrl(rec.visitPhotos[0] || '');
  };

  const handleToggleRiskFactor = (factor: string) => {
    setEditRiskFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((item) => item !== factor)
        : [...prev, factor]
    );
  };

  const handleSaveTeacherVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const updated = homeVisitService.updateRecord(selectedRecord.id, {
      visitStatus: editVisitStatus,
      visitDate: editVisitDate,
      visitMethod: editVisitMethod,
      sdqTeacherStatus: editSdqTeacher,
      scholarshipRecommended: editScholarship,
      riskFactors: editRiskFactors,
      teacherSummaryNote: editTeacherNote,
      visitPhotos: editPhotoUrl.trim() ? [editPhotoUrl.trim()] : [],
    });

    setRecords(updated);
    setSelectedRecord(null);
    showToast(
      `บันทึกผลเยี่ยมบ้านและ SDQ ของ ${selectedRecord.studentName} เรียบร้อยแล้ว`
    );
  };

  const handleExportCsv = () => {
    const headers = [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-สกุล',
      'ห้อง',
      'สถานะนักเรียนกรอกข้อมูล',
      'พิกัด GPS',
      'ผู้ปกครอง',
      'เบอร์โทร',
      'รายได้ครอบครัว',
      'ผล SDQ (นักเรียน)',
      'ผล SDQ (ครู)',
      'สถานะเยี่ยมบ้าน',
      'ขอรับทุนการศึกษา',
      'สรุปผลเยี่ยมบ้าน',
    ];
    const rows = records.map((r) => [
      r.studentNumber,
      r.studentCode,
      `"${r.studentName}"`,
      r.classroom,
      r.studentSelfSubmitStatus === 'SUBMITTED' ? 'กรอกแล้ว' : 'รอกรอก',
      r.gpsPinned ? `${r.gpsLat},${r.gpsLng}` : 'ยังไม่ปักหมุด',
      `"${r.guardianName} (${r.guardianRelation})"`,
      r.guardianPhone,
      `"${r.familyIncomeRange}"`,
      r.sdqStudentStatus,
      r.sdqTeacherStatus,
      r.visitStatus,
      r.scholarshipRecommended ? 'เสนอรับทุน' : '-',
      `"${r.teacherSummaryNote.replace(/"/g, '""')}"`,
    ]);

    const csv =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'รายงานเยี่ยมบ้านและคัดกรองSDQ_ม3-1.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์รายงานเยี่ยมบ้านและคัดกรอง SDQ (CSV) เรียบร้อยแล้ว');
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchQuery =
      r.studentName.includes(searchQuery) ||
      r.studentCode.includes(searchQuery) ||
      r.address.includes(searchQuery);

    if (!matchQuery) return false;

    if (statusFilter === 'VISITED') return r.visitStatus === 'VISITED';
    if (statusFilter === 'PENDING') return r.visitStatus !== 'VISITED';
    if (statusFilter === 'SDQ_RISK')
      return (
        r.sdqStudentStatus === 'RISK' ||
        r.sdqStudentStatus === 'PROBLEM' ||
        r.sdqTeacherStatus === 'RISK' ||
        r.sdqTeacherStatus === 'PROBLEM'
      );
    if (statusFilter === 'SCHOLARSHIP') return r.scholarshipRecommended;
    return true;
  });

  // KPI Metrics
  const totalCount = records.length;
  const visitedCount = records.filter((r) => r.visitStatus === 'VISITED').length;
  const pinnedCount = records.filter((r) => r.gpsPinned).length;
  const sdqRiskCount = records.filter(
    (r) =>
      r.sdqStudentStatus === 'RISK' ||
      r.sdqStudentStatus === 'PROBLEM' ||
      r.sdqTeacherStatus === 'RISK' ||
      r.sdqTeacherStatus === 'PROBLEM'
  ).length;
  const scholarshipCount = records.filter((r) => r.scholarshipRecommended).length;

  const renderSdqBadge = (level: SdqLevel) => {
    if (level === 'NORMAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ปกติ
        </span>
      );
    }
    if (level === 'RISK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          กลุ่มเสี่ยง
        </span>
      );
    }
    if (level === 'PROBLEM') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          มีปัญหา (ต้องดูแลพิเศษ)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
        รอประเมิน
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>ระบบดูแลช่วยเหลือนักเรียน & เยี่ยมบ้านออนไลน์ (เชื่อมต่อพอร์ทัลนักเรียน)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            เยี่ยมบ้านนักเรียน / คัดกรองผู้เรียนรายบุคคล (SDQ) — ชั้น ม.3/1
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            นักเรียนกรอกข้อมูลครอบครัว ปักหมุดแผนที่บ้าน (GPS) และทำแบบประเมิน SDQ จากหน้าพอร์ทัลนักเรียน ข้อมูลจะซิงก์มาให้ครูที่ปรึกษาบันทึกผลเยี่ยมบ้านในหน้านี้ทันที
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setRecords(homeVisitService.getAll())}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            รีเฟรชข้อมูลล่าสุด
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2a59] hover:bg-[#163d7a] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกรายงานเยี่ยมบ้าน / SDQ</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              ความคืบหน้าการเยี่ยมบ้าน
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {visitedCount}/{totalCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              ({Math.round((visitedCount / Math.max(totalCount, 1)) * 100)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            บันทึกผลและภาพถ่ายเยี่ยมบ้านแล้ว
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              นักเรียนปักหมุด GPS & กรอกข้อมูล
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {pinnedCount}/{totalCount}
            </span>
            <span className="text-xs font-semibold text-blue-600">ครัวเรือน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ซิงก์พิกัดจากพอร์ทัลนักเรียนโดยตรง
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              คัดกรอง SDQ (กลุ่มเสี่ยง/มีปัญหา)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {sdqRiskCount}
            </span>
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ต้องติดตามดูแลและประสานผู้ปกครอง
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              เสนอขอรับทุนการศึกษา/ช่วยเหลือ
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">
              {scholarshipCount}
            </span>
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            คัดกรองจากรายได้ครัวเรือนและสภาพจริง
          </p>
        </div>
      </div>

      {/* Interactive GPS Map Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f2a59] to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Navigation className="w-4 h-4" />
            <span>แผนที่พิกัดบ้านนักเรียน (GPS Route Planner)</span>
          </div>
          <div className="text-sm font-semibold">
            นักเรียนปักหมุดพิกัดบ้านแล้ว {pinnedCount} คน — คำนวณระยะทางเดินทางจากโรงเรียนเฉลี่ย 7.9 กม.
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {records
              .filter((r) => r.gpsPinned)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => openRecordModal(r)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs border border-white/15 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{r.studentName}</span>
                  <span className="text-[10px] text-amber-300">
                    ({r.travelDistanceKm} กม.)
                  </span>
                </button>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs shrink-0">
          <div>
            <div className="text-slate-300 text-[11px]">พิกัดโรงเรียนตั้งต้น</div>
            <div className="font-mono font-bold text-emerald-300">
              18.7883° N, 98.9853° E
            </div>
          </div>
          <a
            href="https://www.google.com/maps?q=18.7883,98.9542"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดแผนที่นำทาง</span>
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: `ทั้งหมด (${totalCount})` },
            { key: 'VISITED', label: `เยี่ยมบ้านแล้ว (${visitedCount})` },
            {
              key: 'PENDING',
              label: `รอเยี่ยม/นัดหมาย (${totalCount - visitedCount})`,
            },
            { key: 'SDQ_RISK', label: `กลุ่มเสี่ยง SDQ (${sdqRiskCount})` },
            { key: 'SCHOLARSHIP', label: `ขอรับทุนฯ (${scholarshipCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === tab.key
                  ? 'bg-[#0f2a59] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักเรียน, รหัส, ที่อยู่..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Student Home Visit & SDQ Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-4">นักเรียน</th>
                <th className="py-3.5 px-4">ข้อมูลจากพอร์ทัลนักเรียน (ที่อยู่ & GPS)</th>
                <th className="py-3.5 px-4">ผู้ปกครอง & รายได้</th>
                <th className="py-3.5 px-4">ผลคัดกรอง SDQ</th>
                <th className="py-3.5 px-4">สถานะเยี่ยมบ้าน</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-900">{rec.studentName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      รหัส {rec.studentCode} • เลขที่ {rec.studentNumber} ({rec.classroom})
                    </div>
                    {rec.scholarshipRecommended && (
                      <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        <Award className="w-3 h-3" /> เสนอรับทุนการศึกษา
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 align-top max-w-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      {rec.studentSelfSubmitStatus === 'SUBMITTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> นักเรียนกรอกแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> รอนักเรียนกรอก
                        </span>
                      )}
                      {rec.gpsPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                          <MapPin className="w-3 h-3" /> GPS ({rec.travelDistanceKm} กม.)
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 line-clamp-2">{rec.address}</div>
                    {rec.landmarkNote && rec.landmarkNote !== '-' && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        จุดสังเกต: {rec.landmarkNote}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 align-top">
                    <div className="font-semibold text-slate-800">
                      {rec.guardianName} ({rec.guardianRelation})
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{rec.guardianPhone}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      รายได้: <span className="font-medium text-slate-700">{rec.familyIncomeRange}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 align-top space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 w-14">นักเรียน:</span>
                      {renderSdqBadge(rec.sdqStudentStatus)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 w-14">ครูประเมิน:</span>
                      {renderSdqBadge(rec.sdqTeacherStatus)}
                    </div>
                  </td>

                  <td className="py-4 px-4 align-top">
                    {rec.visitStatus === 'VISITED' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> เยี่ยมบ้านแล้ว
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {rec.visitMethod} ({rec.visitDate})
                        </div>
                      </div>
                    ) : rec.visitStatus === 'SCHEDULED' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                          นัดหมายแล้ว ({rec.visitDate})
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        รอลงพื้นที่เยี่ยมบ้าน
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 align-top text-right">
                    <button
                      onClick={() => openRecordModal(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>บันทึกเยี่ยมบ้าน / SDQ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: บันทึกผลเยี่ยมบ้าน & ประเมิน SDQ รายบุคคล */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0f2a59] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-semibold">
                  บันทึกผลเยี่ยมบ้านและคัดกรอง SDQ รายบุคคล
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  {selectedRecord.studentName} (รหัส {selectedRecord.studentCode} • ชั้น{' '}
                  {selectedRecord.classroom})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherVisit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Read-Only Summary from Student Portal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    ข้อมูลที่นักเรียนกรอกและปักหมุดจากพอร์ทัลนักเรียน:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    อัปเดตล่าสุด: {selectedRecord.submittedAt || 'รอกรอก'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
                  <div>
                    <span className="text-slate-400">ที่อยู่:</span> {selectedRecord.address}
                  </div>
                  <div>
                    <span className="text-slate-400">พิกัด GPS:</span>{' '}
                    <span className="font-mono font-semibold text-blue-700">
                      {selectedRecord.gpsLat}, {selectedRecord.gpsLng}
                    </span>{' '}
                    ({selectedRecord.travelDistanceKm} กม.)
                  </div>
                  <div>
                    <span className="text-slate-400">ผู้ปกครอง:</span>{' '}
                    {selectedRecord.guardianName} ({selectedRecord.guardianRelation} •{' '}
                    {selectedRecord.guardianPhone})
                  </div>
                  <div>
                    <span className="text-slate-400">รายได้/ที่พัก:</span>{' '}
                    {selectedRecord.familyIncomeRange} ({selectedRecord.housingType})
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                  <span className="text-slate-400">ผล SDQ ฉบับนักเรียนประเมินตนเอง:</span>{' '}
                  <span className="font-bold text-slate-800">
                    คะแนนความเสี่ยง {selectedRecord.sdqStudentScore}/40
                  </span>{' '}
                  — {selectedRecord.sdqEmotionalNote}
                </div>
              </div>

              {/* Teacher Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    สถานะการเยี่ยมบ้าน
                  </label>
                  <select
                    value={editVisitStatus}
                    onChange={(e) => setEditVisitStatus(e.target.value as VisitStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="VISITED">เยี่ยมบ้านเรียบร้อยแล้ว</option>
                    <option value="SCHEDULED">นัดหมายวันเยี่ยมบ้านแล้ว</option>
                    <option value="PENDING">รอเยี่ยมบ้าน</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่เยี่ยมบ้าน
                  </label>
                  <input
                    type="date"
                    value={editVisitDate}
                    onChange={(e) => setEditVisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    รูปแบบการเยี่ยมบ้าน
                  </label>
                  <select
                    value={editVisitMethod}
                    onChange={(e) => setEditVisitMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ลงพื้นที่เยี่ยมบ้านจริง">ลงพื้นที่เยี่ยมบ้านจริง</option>
                    <option value="เยี่ยมบ้านออนไลน์ (Video Call)">
                      เยี่ยมบ้านออนไลน์ (Video Call)
                    </option>
                    <option value="สัมภาษณ์ผู้ปกครองที่โรงเรียน">
                      สัมภาษณ์ผู้ปกครองที่โรงเรียน
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ผลประเมิน SDQ (ฉบับครูที่ปรึกษาประเมิน)
                  </label>
                  <select
                    value={editSdqTeacher}
                    onChange={(e) => setEditSdqTeacher(e.target.value as SdqLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NORMAL">ปกติ (Normal)</option>
                    <option value="RISK">กลุ่มเสี่ยง (Risk - เฝ้าระวัง)</option>
                    <option value="PROBLEM">มีปัญหา (Problem - ต้องส่งต่อดูแลพิเศษ)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={editScholarship}
                      onChange={(e) => setEditScholarship(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                    <span className="font-bold text-purple-900">
                      เสนอชื่อขอรับทุนการศึกษา / ทุนปัจจัยพื้นฐาน
                    </span>
                  </label>
                </div>
              </div>

              {/* Risk Factor Checkboxes */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  ปัจจัยเสี่ยงที่พบ (เลือกได้หลายข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'รายได้ครอบครัวต่ำ',
                    'อาศัยอยู่กับปู่ย่าตายาย',
                    'เดินทางไกล',
                    'ต้องทำงานช่วยครอบครัวหลังเลิกเรียน',
                    'เสี่ยงขาดเรียนบ่อย',
                    'ความเครียดด้านอารมณ์/เพื่อน',
                  ].map((factor) => {
                    const active = editRiskFactors.includes(factor);
                    return (
                      <button
                        type="button"
                        key={factor}
                        onClick={() => handleToggleRiskFactor(factor)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                          active
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {factor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teacher Summary Note */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1">
                  บันทึกสรุปสภาพปัญหาและแนวทางช่วยเหลือของครูที่ปรึกษา
                </label>
                <textarea
                  rows={3}
                  value={editTeacherNote}
                  onChange={(e) => setEditTeacherNote(e.target.value)}
                  placeholder="ระบุสิ่งที่พบจากการเยี่ยมบ้าน ความเห็นผู้ปกครอง และแนวทางดูแลช่วยเหลือ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Visit Photo URL */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>ลิงก์ภาพถ่ายการเยี่ยมบ้าน (แนบหลักฐานรายงานเยี่ยมบ้าน)</span>
                </label>
                <input
                  type="text"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0f2a59] hover:bg-[#163d7a] text-white text-xs font-bold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกผลเยี่ยมบ้าน & SDQ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
