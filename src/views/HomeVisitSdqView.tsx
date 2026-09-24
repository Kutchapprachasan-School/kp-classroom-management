import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Download,
  Home,
  Camera,
  Edit3,
  X,
  Save,
  Award,
  ExternalLink,
  CloudUpload,
  PenTool,
  Settings2,
  RefreshCw,
} from 'lucide-react';
import {
  homeVisitService,
  type HomeVisitRecord,
  type VisitStatus,
  type SdqLevel,
  type StudentAttendanceLeavePolicy,
} from '../services/homeVisitService';

export const HomeVisitSdqView: React.FC = () => {
  const [records, setRecords] = useState<HomeVisitRecord[]>(() =>
    homeVisitService.getAll()
  );
  const [leavePolicy, setLeavePolicy] = useState<StudentAttendanceLeavePolicy>(
    () => homeVisitService.getLeavePolicy()
  );
  const [isLeavePolicyOpen, setIsLeavePolicyOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'VISITED' | 'PENDING' | 'SDQ_RISK' | 'SCHOLARSHIP' | 'CCT_READY'
  >('ALL');
  const [selectedRecord, setSelectedRecord] = useState<HomeVisitRecord | null>(
    null
  );
  const [modalTab, setModalTab] = useState<
    'NOR01_INCOME' | 'NOR01_HOUSE' | 'PHOTOS_SDQ' | 'SIGNATURES_CCT'
  >('NOR01_INCOME');

  // State สำหรับหน้าต่างจำลองการโอนข้อมูลอัตโนมัติเข้าสู่ระบบ CCT กสศ. (https://cct.eef.or.th)
  const [cctSyncModalRecord, setCctSyncModalRecord] =
    useState<HomeVisitRecord | null>(null);
  const [cctSyncStep, setCctSyncStep] = useState<number>(0);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Form State (ครบตามแบบ นร./กสศ.01 ฉบับ 6 มี.ค. 2569)
  const [editFamilyStatus, setEditFamilyStatus] =
    useState<HomeVisitRecord['familyStatus']>('พ่อแม่อยู่ด้วยกัน');
  const [editLivingWith, setEditLivingWith] =
    useState<HomeVisitRecord['livingWith']>('พ่อ/แม่');
  const [editWelfareCard, setEditWelfareCard] = useState(false);
  const [editHousingType, setEditHousingType] =
    useState<HomeVisitRecord['housingType']>('อยู่บ้านตนเอง/เจ้าของบ้าน');
  const [editMonthlyRent, setEditMonthlyRent] = useState(0);
  const [editFloorMaterial, setEditFloorMaterial] = useState('กระเบื้อง/เซรามิค');
  const [editWallMaterial, setEditWallMaterial] = useState('อิฐ/ก้อนปูน/อิฐบล็อก');
  const [editRoofMaterial, setEditRoofMaterial] = useState(
    'โลหะ (เช่น สังกะสี/เหล็ก/อะลูมิเนียม)'
  );
  const [editHasToilet, setEditHasToilet] = useState(true);
  const [editAgriLand, setEditAgriLand] =
    useState<HomeVisitRecord['agriculturalLand']>('ไม่ทำเกษตร');
  const [editWaterSource, setEditWaterSource] = useState('น้ำประปา');
  const [editElectricSource, setEditElectricSource] =
    useState('ไฟบ้านหรือมิเตอร์');
  const [editDependencyFlags, setEditDependencyFlags] = useState<string[]>([]);
  const [editPhotoExterior, setEditPhotoExterior] = useState('');
  const [editPhotoInterior, setEditPhotoInterior] = useState('');
  const [editStudentSig, setEditStudentSig] = useState('');
  const [editGuardianSig, setEditGuardianSig] = useState('');
  const [editTeacherSig, setEditTeacherSig] = useState('');
  const [editOfficialSig, setEditOfficialSig] = useState('');
  const [editOfficialName, setEditOfficialName] = useState('');
  const [editVisitStatus, setEditVisitStatus] = useState<VisitStatus>('VISITED');
  const [editVisitDate, setEditVisitDate] = useState('');
  const [editVisitMethod, setEditVisitMethod] =
    useState<HomeVisitRecord['visitMethod']>('ลงพื้นที่เยี่ยมบ้านจริง');
  const [editSdqTeacher, setEditSdqTeacher] = useState<SdqLevel>('NORMAL');
  const [editScholarship, setEditScholarship] = useState(false);
  const [editRiskFactors, setEditRiskFactors] = useState<string[]>([]);
  const [editTeacherNote, setEditTeacherNote] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openRecordModal = (
    rec: HomeVisitRecord,
    defaultTab:
      | 'NOR01_INCOME'
      | 'NOR01_HOUSE'
      | 'PHOTOS_SDQ'
      | 'SIGNATURES_CCT' = 'NOR01_INCOME'
  ) => {
    setSelectedRecord(rec);
    setModalTab(defaultTab);
    setEditFamilyStatus(rec.familyStatus);
    setEditLivingWith(rec.livingWith);
    setEditWelfareCard(rec.hasStateWelfareCard);
    setEditHousingType(rec.housingType);
    setEditMonthlyRent(rec.monthlyRentBaht);
    setEditFloorMaterial(rec.floorMaterial);
    setEditWallMaterial(rec.wallMaterial);
    setEditRoofMaterial(rec.roofMaterial);
    setEditHasToilet(rec.hasToilet);
    setEditAgriLand(rec.agriculturalLand);
    setEditWaterSource(rec.drinkingWaterSource);
    setEditElectricSource(rec.electricitySource);
    setEditDependencyFlags(rec.dependencyFlags || []);
    setEditPhotoExterior(rec.photoExteriorUrl);
    setEditPhotoInterior(rec.photoInteriorUrl);
    setEditStudentSig(rec.studentSignatureData);
    setEditGuardianSig(rec.guardianSignatureData);
    setEditTeacherSig(rec.teacherSignatureData);
    setEditOfficialSig(rec.officialSignatureData);
    setEditOfficialName(rec.officialCertifierName);
    setEditVisitStatus(rec.visitStatus);
    setEditVisitDate(rec.visitDate || new Date().toISOString().slice(0, 10));
    setEditVisitMethod(rec.visitMethod);
    setEditSdqTeacher(rec.sdqTeacherStatus);
    setEditScholarship(rec.scholarshipRecommended);
    setEditRiskFactors(rec.riskFactors);
    setEditTeacherNote(rec.teacherSummaryNote);
  };

  const handleToggleArrayItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setter(
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
    );
  };

  const handleSaveNor01Visit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const updated = homeVisitService.updateRecord(selectedRecord.id, {
      familyStatus: editFamilyStatus,
      livingWith: editLivingWith,
      hasStateWelfareCard: editWelfareCard,
      housingType: editHousingType,
      monthlyRentBaht: editMonthlyRent,
      floorMaterial: editFloorMaterial,
      wallMaterial: editWallMaterial,
      roofMaterial: editRoofMaterial,
      hasToilet: editHasToilet,
      agriculturalLand: editAgriLand,
      drinkingWaterSource: editWaterSource,
      electricitySource: editElectricSource,
      dependencyFlags: editDependencyFlags,
      photoExteriorUrl: editPhotoExterior,
      photoInteriorUrl: editPhotoInterior,
      studentSignatureData: editStudentSig,
      guardianSignatureData: editGuardianSig,
      teacherSignatureData: editTeacherSig,
      officialSignatureData: editOfficialSig,
      officialCertifierName: editOfficialName,
      visitStatus: editVisitStatus,
      visitDate: editVisitDate,
      visitMethod: editVisitMethod,
      sdqTeacherStatus: editSdqTeacher,
      scholarshipRecommended: editScholarship,
      riskFactors: editRiskFactors,
      teacherSummaryNote: editTeacherNote,
    });

    setRecords(updated);
    setSelectedRecord(null);
    showToast(
      `บันทึกแบบ นร./กสศ.01 รูปถ่าย 2 มุม และลายเซ็นของ ${selectedRecord.studentName} เรียบร้อยแล้ว`
    );
  };

  // จำลองการส่งข้อมูล + รูปภาพ 2 มุม + ลายเซ็น 4 ฝ่าย เข้าสู่ระบบ CCT (https://cct.eef.or.th) อัตโนมัติ
  const handleTriggerSingleCctSync = (rec: HomeVisitRecord) => {
    setCctSyncModalRecord(rec);
    setCctSyncStep(1);
    setTimeout(() => setCctSyncStep(2), 700);
    setTimeout(() => setCctSyncStep(3), 1400);
    setTimeout(() => {
      const updated = homeVisitService.syncToEefCct([rec.id]);
      setRecords(updated);
      setCctSyncStep(4);
      const fresh = updated.find((r) => r.id === rec.id);
      if (fresh) setCctSyncModalRecord(fresh);
    }, 2200);
  };

  const handleBatchSyncToCct = () => {
    setIsBatchSyncing(true);
    const eligibleIds = records
      .filter((r) => r.scholarshipRecommended || r.perCapitaIncome <= 3000)
      .map((r) => r.id);
    setTimeout(() => {
      const updated = homeVisitService.syncToEefCct(eligibleIds);
      setRecords(updated);
      setIsBatchSyncing(false);
      showToast(
        `โอนข้อมูล นร.01 + รูปถ่ายนอกบ้าน/ในบ้าน + ลายเซ็น เข้าสู่ระบบ CCT (cct.eef.or.th) สำเร็จ ${eligibleIds.length} รายการ!`
      );
    }, 1200);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    homeVisitService.saveLeavePolicy(leavePolicy);
    setIsLeavePolicyOpen(false);
    showToast(
      'บันทึกนโยบายการนับเวลาเรียน (ลากิจ/ลาป่วยนักเรียน และเด็กย้ายเข้าใหม่) เรียบร้อยแล้ว'
    );
  };

  const handleExportNor01JsonForCctBot = (rec: HomeVisitRecord) => {
    const payload = {
      targetSystem: 'https://cct.eef.or.th',
      formVersion: 'แบบ นร./กสศ.01 (ฉบับปรับปรุง 6 มีนาคม 2569)',
      academicTerm: '1/2569',
      student: {
        citizenId: rec.citizenId,
        studentCode: rec.studentCode,
        fullName: rec.studentName,
        classroom: rec.classroom,
        familyStatus: rec.familyStatus,
        livingWith: rec.livingWith,
      },
      guardian: {
        fullName: rec.guardianName,
        relation: rec.guardianRelation,
        citizenId: rec.guardianCitizenId,
        phone: rec.guardianPhone,
        occupation: rec.guardianOccupation,
        hasStateWelfareCard: rec.hasStateWelfareCard,
      },
      section2_householdIncome: {
        memberCount: rec.householdMembers.length,
        members: rec.householdMembers,
        totalHouseholdIncomeBaht: rec.totalHouseholdIncome,
        perCapitaMonthlyIncomeBaht: rec.perCapitaIncome,
      },
      section3_livingCondition: {
        dependencyFlags: rec.dependencyFlags,
        housingType: rec.housingType,
        monthlyRentBaht: rec.monthlyRentBaht,
        floorMaterial: rec.floorMaterial,
        wallMaterial: rec.wallMaterial,
        roofMaterial: rec.roofMaterial,
        hasToilet: rec.hasToilet,
        agriculturalLand: rec.agriculturalLand,
        drinkingWaterSource: rec.drinkingWaterSource,
        electricitySource: rec.electricitySource,
        vehicles: rec.vehicles,
        appliances: rec.appliances,
      },
      section5_6_travelAndGps: {
        travelMethod: rec.travelMethod,
        travelDistanceKmRoundTrip: rec.travelDistanceKm,
        travelTimeMinutes: rec.travelTimeMinutes,
        monthlyTravelCostBaht: rec.monthlyTravelCostBaht,
        dailyPocketMoneyBaht: rec.dailyPocketMoneyBaht,
        address: rec.address,
        gpsCoordinates: { lat: rec.gpsLat, lng: rec.gpsLng },
      },
      section7_photos: {
        photoSource: rec.photoSource,
        photo1_exteriorRoofAndWallUrl: rec.photoExteriorUrl,
        photo2_interiorFloorUrl: rec.photoInteriorUrl,
      },
      section8_10_digitalSignatures: {
        studentSignature: rec.studentSignatureData,
        guardianSignature: rec.guardianSignatureData,
        teacherVisitorSignature: rec.teacherSignatureData,
        officialStateCertifier: {
          name: rec.officialCertifierName,
          position: rec.officialCertifierPosition,
          directorSignature: rec.officialSignatureData,
        },
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCT_EEF_Nor01_${rec.studentCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      `ดาวน์โหลดชุดข้อมูล Auto-Fill นร.01 สำหรับระบบ cct.eef.or.th ของ ${rec.studentName} แล้ว`
    );
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchQuery =
      r.studentName.includes(searchQuery) ||
      r.studentCode.includes(searchQuery) ||
      r.citizenId.includes(searchQuery) ||
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
    if (statusFilter === 'SCHOLARSHIP')
      return r.scholarshipRecommended || r.perCapitaIncome <= 3000;
    if (statusFilter === 'CCT_READY') return r.cctSyncStatus === 'SYNCED';
    return true;
  });

  // KPI Metrics
  const totalCount = records.length;
  const visitedCount = records.filter((r) => r.visitStatus === 'VISITED').length;
  const cctEligibleCount = records.filter(
    (r) => r.scholarshipRecommended || r.perCapitaIncome <= 3000
  ).length;
  const cctSyncedCount = records.filter(
    (r) => r.cctSyncStatus === 'SYNCED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Clean Header Bar (60% White Surface, 30% Slate Ink, 10% Teal Primary CTA) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            ระบบเยี่ยมบ้านนักเรียน (แบบ นร./กสศ.01) & โอนข้อมูล CCT กสศ.
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกข้อมูล 10 หมวด รูปถ่ายบ้าน 2 มุม และลายเซ็นอิเล็กทรอนิกส์ 4 ฝ่าย • นโยบายเวลาเรียน:{' '}
            <span className="font-medium text-slate-700">
              ลาป่วย ({leavePolicy.includeApprovedSickLeaveAsAttended ? 'นับรวมเวลาเรียน' : 'แยก'}) · ลากิจ ({leavePolicy.includeApprovedPersonalLeaveAsAttended ? 'นับรวมเวลาเรียน' : 'แยก'}) · คุ้มครองวันย้ายเข้า (enrolled_at)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLeavePolicyOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>ตั้งค่ากติกาเวลาเรียน</span>
          </button>

          <button
            onClick={handleBatchSyncToCct}
            disabled={isBatchSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <CloudUpload className="w-4 h-4" />
            <span>
              {isBatchSyncing
                ? 'กำลังโอนข้อมูลเข้า cct.eef.or.th...'
                : 'โอนข้อมูลเข้า CCT กสศ. ทั้งหมด'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Rule of Thirds (กฎสามส่วน): 3 Balanced Summary Cards (60-30-10 Color Ratio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              สำรวจเยี่ยมบ้านตามแบบ นร.01
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {visitedCount}/{totalCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ครัวเรือน
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            <Home className="w-3.5 h-3.5" /> รูป 2 มุมครบ
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              เข้าเกณฑ์คัดกรองทุน กสศ. (รายได้ &le; 3,000 บ.)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {cctEligibleCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                รายชื่อที่ผ่านเกณฑ์
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-teal-600" /> คำนวณอัตโนมัติ
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              โอนข้อมูลขึ้นระบบ CCT (cct.eef.or.th)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-700 tabular-nums">
                {cctSyncedCount}/{totalCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                รายการสำเร็จ
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            <PenTool className="w-3.5 h-3.5" /> ลายเซ็นครบ 4 ฝ่าย
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar + Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
            {[
              { key: 'ALL', label: `ทั้งหมด (${totalCount})` },
              {
                key: 'SCHOLARSHIP',
                label: `เข้าเกณฑ์ กสศ. (${cctEligibleCount})`,
              },
              {
                key: 'CCT_READY',
                label: `โอนขึ้น CCT แล้ว (${cctSyncedCount})`,
              },
              { key: 'VISITED', label: `เยี่ยมแล้ว (${visitedCount})` },
              { key: 'SDQ_RISK', label: 'กลุ่มเสี่ยง SDQ' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
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
              placeholder="ค้นหาชื่อ, เลขประชาชน 13 หลัก, รหัสนักเรียน..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-4">รหัส / ข้อมูลนักเรียน</th>
                <th className="py-3.5 px-4 text-right">รายได้เฉลี่ย/คน (ข้อ 2)</th>
                <th className="py-3.5 px-4">สภาพบ้าน & รูปถ่าย 2 มุม</th>
                <th className="py-3.5 px-4">ลายเซ็นรับรอง (ข้อ 8–10)</th>
                <th className="py-3.5 px-4">สถานะ CCT กสศ.</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((rec) => {
                const isPoorEligible = rec.perCapitaIncome <= 3000;
                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Col 1: Student Info */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900">
                        {rec.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 tabular-nums">
                        รหัส {rec.studentCode} · ชั้น {rec.classroom} · ปชช. {rec.citizenId}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">
                          {rec.familyStatus}
                        </span>
                        {rec.hasStateWelfareCard && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            บัตรสวัสดิการแห่งรัฐ
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col 2: Income (Right-aligned tabular numerals) */}
                    <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {rec.perCapitaIncome.toLocaleString()} บ./คน
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        รวม {rec.totalHouseholdIncome.toLocaleString()} บ. ({rec.householdMembers.length} คน)
                      </div>
                      {isPoorEligible ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-teal-700 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          เข้าเกณฑ์ยากจน กสศ.
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1 text-slate-400 text-[11px]">
                          เกินเกณฑ์รายได้
                        </span>
                      )}
                    </td>

                    {/* Col 3: House condition & 2 Photos */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 shrink-0">
                          <img
                            src={rec.photoExteriorUrl}
                            alt="นอกบ้าน"
                            className="w-10 h-8 object-cover rounded border border-slate-200"
                            title="รูปที่ 1: ภาพถ่ายนอกบ้าน (เห็นหลังคา)"
                          />
                          <img
                            src={rec.photoInteriorUrl}
                            alt="ในบ้าน"
                            className="w-10 h-8 object-cover rounded border border-slate-200"
                            title="รูปที่ 2: ภาพถ่ายในบ้าน (เห็นพื้น)"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-800 font-medium truncate max-w-[200px]">
                            {rec.housingType}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            พื้น{rec.floorMaterial} · ห่าง {rec.travelDistanceKm} กม.
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 4: Digital Signatures (Concise 1-line summary instead of 3 verbose lines) */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-teal-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>ครบ 4/4 ฝ่าย</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        นร. · ผู้ปกครอง · ครู · ผอ.
                      </div>
                    </td>

                    {/* Col 5: CCT Sync Status */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {rec.cctSyncStatus === 'SYNCED' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> โอนสำเร็จแล้ว
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                            {rec.cctReferenceId}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>รอโอนขึ้น CCT</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ข้อมูลครบพร้อมส่ง
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Col 6: Actions */}
                    <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openRecordModal(rec, 'NOR01_INCOME')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>นร.01</span>
                        </button>

                        <button
                          onClick={() => handleTriggerSingleCctSync(rec)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                        >
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>โอน CCT</span>
                        </button>

                        <button
                          onClick={() => handleExportNor01JsonForCctBot(rec)}
                          title="ดาวน์โหลดไฟล์ JSON Auto-Fill สำหรับ cct.eef.or.th"
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: หน้าต่างจำลองการโอนข้อมูลอัตโนมัติเข้าสู่เว็บ CCT กสศ. (https://cct.eef.or.th) */}
      {cctSyncModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0f2a59] to-emerald-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-bold">
                  ระบบโอนข้อมูลอัตโนมัติ (EEF CCT Auto-Sync Engine)
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  กำลังส่งข้อมูลไปยัง https://cct.eef.or.th
                </h3>
              </div>
              <button
                onClick={() => setCctSyncModalRecord(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">
                  นักเรียน: {cctSyncModalRecord.studentName} (เลข ปชช.{' '}
                  {cctSyncModalRecord.citizenId})
                </div>
                <div className="text-slate-500 mt-0.5">
                  แบบ นร./กสศ.01 ภาคเรียนที่ 1/2569 • รายได้เฉลี่ย{' '}
                  {cctSyncModalRecord.perCapitaIncome.toLocaleString()} บาท/คน/เดือน
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  {cctSyncStep >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-800">
                      1. ส่งข้อมูลแบบ นร./กสศ.01 ข้อ 1 - ข้อ 6 และพิกัด GPS
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ตารางสมาชิกครัวเรือน, รายได้เฉลี่ย, วัสดุพื้น/ฝา/หลังคาบ้าน, การเดินทาง ({cctSyncModalRecord.gpsLat}, {cctSyncModalRecord.gpsLng})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  {cctSyncStep >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-800">
                      2. อัปโหลดภาพถ่ายบ้าน 2 มุมบังคับ (ข้อ 7)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      รูปที่ 1 นอกที่พักอาศัย (เห็นหลังคาและฝาผนังทั้งหลัง) + รูปที่ 2 ภายในที่พักอาศัย (เห็นพื้นบ้าน)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  {cctSyncStep >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-800">
                      3. แนบลายเซ็นรับรองข้อมูลครบ 4 ฝ่าย (ข้อ 8 - ข้อ 10)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ลายเซ็นนักเรียน, ผู้ปกครอง, ครูผู้เยี่ยมบ้าน และเจ้าหน้าที่ของรัฐ/ผอ.โรงเรียน
                    </div>
                  </div>
                </div>
              </div>

              {cctSyncStep >= 4 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>โอนข้อมูลเข้าสู่ระบบ CCT กสศ. เรียบร้อยแล้ว!</span>
                  </div>
                  <div className="text-[11px]">
                    รหัสอ้างอิงธุรกรรม กสศ.:{' '}
                    <span className="font-mono font-bold">
                      {cctSyncModalRecord.cctReferenceId}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <a
                  href="https://cct.eef.or.th"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-700 font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดเว็บ https://cct.eef.or.th</span>
                </a>
                <button
                  onClick={() => setCctSyncModalRecord(null)}
                  className="px-4 py-2 rounded-xl bg-[#0f2a59] text-white font-bold"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: ตั้งค่านโยบายการนับเวลาเรียน (ลากิจ/ลาป่วยนักเรียน & เด็กเข้าใหม่) */}
      {isLeavePolicyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#0f2a59] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-semibold">
                  ตั้งค่าระบบเช็คชื่อและการลานักเรียน (แยกจาก E-Leave ของครู)
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  กติกาการคำนวณเวลามาเรียน (ลากิจ / ลาป่วย & เด็กย้ายเข้าใหม่)
                </h3>
              </div>
              <button
                onClick={() => setIsLeavePolicyOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-4 text-xs">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leavePolicy.includeApprovedSickLeaveAsAttended}
                  onChange={(e) =>
                    setLeavePolicy((prev) => ({
                      ...prev,
                      includeApprovedSickLeaveAsAttended: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 mt-0.5 rounded text-blue-600"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    นับรวม "ลาป่วย (ที่อนุมัติแล้ว)" เป็นเวลามาเรียน
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    หากเปิดใช้งาน นักเรียนที่ลาป่วยมีใบรับรองแพทย์จะไม่ถูกหักเปอร์เซ็นต์เวลาเรียน (ป้องกันการติด มส. จากการเจ็บป่วย)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leavePolicy.includeApprovedPersonalLeaveAsAttended}
                  onChange={(e) =>
                    setLeavePolicy((prev) => ({
                      ...prev,
                      includeApprovedPersonalLeaveAsAttended: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 mt-0.5 rounded text-blue-600"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    นับรวม "ลากิจ (ที่อนุมัติแล้ว)" เป็นเวลามาเรียน
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    เลือกได้ว่าจะให้นับลากิจที่ผู้ปกครองยื่นขออนุญาตล่วงหน้ารวมในเวลาเรียน 80% หรือไม่
                  </div>
                </div>
              </label>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="font-bold">
                  ✓ ระบบป้องกันข้อมูลเพี้ยนสำหรับนักเรียนย้ายเข้าใหม่ (Exception-Only Safe)
                </div>
                <div className="text-[11px] mt-1">
                  ระบบผูกวันย้ายเข้าเรียน (`enrolled_at`) ของนักเรียนแต่ละคนอัตโนมัติ คาบเรียนที่เกิดขึ้นก่อนวันที่เด็กย้ายเข้าจะไม่ถูกนำมาคิดเป็นคาบมาเรียนหรือขาดเรียน
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeavePolicyOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2a59] text-white font-bold"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: ฟอร์มบันทึกข้อมูลเยี่ยมบ้านตามแบบ นร./กสศ.01 ครบ 10 หมวด (5 หน้า) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 bg-[#0f2a59] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-bold">
                  แบบ นร./กสศ.01 (ฉบับปรับปรุง 6 มีนาคม 2569) • แบบขอรับเงินอุดหนุนนักเรียนยากจน
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  {selectedRecord.studentName} (เลข ปชช. {selectedRecord.citizenId} • ชั้น{' '}
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

            {/* Sub-Tabs inside นร.01 Modal */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap gap-2 text-xs">
              {[
                {
                  key: 'NOR01_INCOME',
                  label: 'หน้า 1-2: ข้อมูลนักเรียน & ตารางรายได้สมาชิกครัวเรือน (ข้อ 1-2)',
                },
                {
                  key: 'NOR01_HOUSE',
                  label: 'หน้า 2-4: ลักษณะบ้าน (พื้น/ฝา/หลังคา) & การเดินทาง (ข้อ 3-6)',
                },
                {
                  key: 'PHOTOS_SDQ',
                  label: 'หน้า 4: รูปถ่ายบ้าน 2 มุมบังคับ (นอกบ้าน/ในบ้าน) & SDQ (ข้อ 7)',
                },
                {
                  key: 'SIGNATURES_CCT',
                  label: 'หน้า 5: ลายเซ็นรับรอง 4 ฝ่าย & โอนขึ้น CCT กสศ. (ข้อ 8-10)',
                },
              ].map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setModalTab(t.key as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    modalTab === t.key
                      ? 'bg-[#0f2a59] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSaveNor01Visit}
              className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs"
            >
              {/* TAB 1: ข้อ 1-2 สถานภาพครอบครัวและตารางสมาชิกครัวเรือน */}
              {modalTab === 'NOR01_INCOME' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        1. สถานภาพครอบครัว (ข้อ 1)
                      </label>
                      <select
                        value={editFamilyStatus}
                        onChange={(e) =>
                          setEditFamilyStatus(e.target.value as any)
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="พ่อแม่อยู่ด้วยกัน">พ่อแม่อยู่ด้วยกัน</option>
                        <option value="พ่อแม่แยกกันอยู่">พ่อแม่แยกกันอยู่</option>
                        <option value="พ่อแม่หย่าร้าง">พ่อแม่หย่าร้าง</option>
                        <option value="พ่อเสียชีวิต/สาบสูญ">พ่อเสียชีวิต/สาบสูญ</option>
                        <option value="แม่เสียชีวิต/สาบสูญ">แม่เสียชีวิต/สาบสูญ</option>
                        <option value="เสียชีวิตทั้งคู่/สาบสูญ">
                          เสียชีวิตทั้งคู่/สาบสูญ
                        </option>
                        <option value="พ่อ/แม่ทอดทิ้ง">พ่อ/แม่ทอดทิ้ง</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        นักเรียนอาศัยอยู่กับ
                      </label>
                      <select
                        value={editLivingWith}
                        onChange={(e) => setEditLivingWith(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="พ่อ/แม่">พ่อ/แม่</option>
                        <option value="ญาติ">ญาติ</option>
                        <option value="อยู่ลำพัง">อยู่ลำพัง</option>
                        <option value="ผู้อุปการะ/นายจ้าง">ผู้อุปการะ/นายจ้าง</option>
                        <option value="ครัวเรือนสถาบัน">ครัวเรือนสถาบัน</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 w-full cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editWelfareCard}
                          onChange={(e) => setEditWelfareCard(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600"
                        />
                        <span className="font-bold text-amber-900">
                          ได้สวัสดิการแห่งรัฐ (ทะเบียนคนจน)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ตารางข้อ 2: สมาชิกในครัวเรือนและรายได้เฉลี่ย 5 ช่อง */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        2. ตารางสมาชิกในครัวเรือนและรายได้เฉลี่ยต่อเดือนแยกตามประเภท (ข้อ 2)
                      </span>
                      <span className="font-bold text-emerald-700">
                        รายได้ครัวเรือนเฉลี่ยต่อคน:{' '}
                        {selectedRecord.perCapitaIncome.toLocaleString()} บาท/คน/เดือน
                      </span>
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                          <th className="p-2.5">ชื่อ - นามสกุล</th>
                          <th className="p-2.5">ความสัมพันธ์</th>
                          <th className="p-2.5">อายุ/การศึกษา</th>
                          <th className="p-2.5">พิการ/โรคเรื้อรัง</th>
                          <th className="p-2.5">ค่าจ้าง/เงินเดือน</th>
                          <th className="p-2.5">เกษตร/ธุรกิจ</th>
                          <th className="p-2.5">สวัสดิการรัฐ/อื่นๆ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRecord.householdMembers.map((m) => (
                          <tr key={m.id}>
                            <td className="p-2.5 font-semibold text-slate-800">
                              {m.fullName}
                              <div className="text-[10px] font-mono text-slate-400">
                                {m.citizenId}
                              </div>
                            </td>
                            <td className="p-2.5">{m.relation}</td>
                            <td className="p-2.5">
                              {m.age} ปี ({m.educationLevel})
                            </td>
                            <td className="p-2.5">
                              {m.isDisabled && 'พิการ '}
                              {m.hasChronicDisease && 'โรคเรื้อรัง '}
                              {!m.isDisabled && !m.hasChronicDisease && '-'}
                            </td>
                            <td className="p-2.5">
                              {m.incomeSalary.toLocaleString()} บ.
                            </td>
                            <td className="p-2.5">
                              {(
                                m.incomeAgriculture + m.incomeBusiness
                              ).toLocaleString()}{' '}
                              บ.
                            </td>
                            <td className="p-2.5">
                              {(m.incomeWelfare + m.incomeOther).toLocaleString()}{' '}
                              บ.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: ข้อ 3-6 ลักษณะที่อยู่อาศัย (พื้นบ้าน, ฝาบ้าน, หลังคา, ห้องส้วม, น้ำ, ไฟ) */}
              {modalTab === 'NOR01_HOUSE' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      3.1 ครัวเรือนมีภาระพึ่งพิง (เลือกได้มากกว่า 1 ข้อ)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'มีความพิการทางร่างกาย/สติปัญญา',
                        'มีโรคเรื้อรัง ยกเว้น ความดัน/เบาหวาน',
                        'ผู้สูงอายุตั้งแต่ 60 ปีขึ้นไป',
                        'เป็นพ่อ/แม่เลี้ยงเดี่ยว',
                        'มีคนอายุ 15-65 ปีที่ว่างงาน',
                      ].map((flag) => {
                        const active = editDependencyFlags.includes(flag);
                        return (
                          <button
                            type="button"
                            key={flag}
                            onClick={() =>
                              handleToggleArrayItem(
                                editDependencyFlags,
                                setEditDependencyFlags,
                                flag
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl border font-semibold ${
                              active
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {active ? '✔ ' : '+ '}
                            {flag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        3.2 การอยู่อาศัย
                      </label>
                      <select
                        value={editHousingType}
                        onChange={(e) => setEditHousingType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="อยู่บ้านตนเอง/เจ้าของบ้าน">
                          อยู่บ้านตนเอง/เจ้าของบ้าน
                        </option>
                        <option value="อยู่บ้านเช่า">อยู่บ้านเช่า (เสียค่าเช่า)</option>
                        <option value="อยู่กับผู้อื่น/อยู่ฟรี">
                          อยู่กับผู้อื่น/อยู่ฟรี
                        </option>
                        <option value="หอพัก">หอพัก</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ค่าเช่าบ้าน (บาท/เดือน)
                      </label>
                      <input
                        type="number"
                        value={editMonthlyRent}
                        onChange={(e) =>
                          setEditMonthlyRent(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        3.4 ที่ดินทำการเกษตร (รวมเช่า)
                      </label>
                      <select
                        value={editAgriLand}
                        onChange={(e) => setEditAgriLand(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="ไม่ทำเกษตร">ไม่ทำเกษตร</option>
                        <option value="มีที่ดินน้อยกว่า 1 ไร่">
                          มีที่ดินน้อยกว่า 1 ไร่
                        </option>
                        <option value="มีที่ดิน 1 ถึง 5 ไร่">
                          มีที่ดิน 1 ถึง 5 ไร่
                        </option>
                        <option value="มีที่ดินมากกว่า 5 ไร่">
                          มีที่ดินมากกว่า 5 ไร่
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        3.3 วัสดุที่ใช้ทำพื้นบ้าน (บันทึกสิ่งที่เห็น)
                      </label>
                      <select
                        value={editFloorMaterial}
                        onChange={(e) => setEditFloorMaterial(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="กระเบื้อง/เซรามิค">กระเบื้อง/เซรามิค</option>
                        <option value="ปาเก้/ไม้ขัดเงา">ปาเก้/ไม้ขัดเงา</option>
                        <option value="ซีเมนต์เปลือย">ซีเมนต์เปลือย</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ไวนิล/กระเบื้องยาง/เสื่อน้ำมัน">
                          ไวนิล/กระเบื้องยาง/เสื่อน้ำมัน
                        </option>
                        <option value="ไม้ไผ่">ไม้ไผ่</option>
                        <option value="ดิน/ทราย">ดิน/ทราย</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        วัสดุที่ใช้ทำฝาบ้าน
                      </label>
                      <select
                        value={editWallMaterial}
                        onChange={(e) => setEditWallMaterial(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="ฉาบซีเมนต์">ฉาบซีเมนต์</option>
                        <option value="อิฐ/ก้อนปูน/อิฐบล็อก">
                          อิฐ/ก้อนปูน/อิฐบล็อก
                        </option>
                        <option value="สังกะสี">สังกะสี</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ไม้อัด">ไม้อัด</option>
                        <option value="ไม้ไผ่/ท่อนไม้/เศษไม้">
                          ไม้ไผ่/ท่อนไม้/เศษไม้
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        วัสดุที่ใช้ทำหลังคา
                      </label>
                      <select
                        value={editRoofMaterial}
                        onChange={(e) => setEditRoofMaterial(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="โลหะ (เช่น สังกะสี/เหล็ก/อะลูมิเนียม)">
                          โลหะ (เช่น สังกะสี/เหล็ก/อะลูมิเนียม)
                        </option>
                        <option value="กระเบื้อง/เซรามิค">กระเบื้อง/เซรามิค</option>
                        <option value="ไม้กระดาน">ไม้กระดาน</option>
                        <option value="ใบไม้/วัสดุธรรมชาติ">
                          ใบไม้/วัสดุธรรมชาติ
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ข้อ 7 ภาพถ่ายที่พักอาศัย 2 มุมบังคับ (นอกบ้านเห็นหลังคา / ในบ้านเห็นพื้น) & SDQ */}
              {modalTab === 'PHOTOS_SDQ' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>
                          รูปที่ 1: ภาพถ่ายนอกที่พักอาศัย (เห็นหลังคาและฝาผนังทั้งหลัง)
                        </span>
                      </div>
                      <img
                        src={editPhotoExterior}
                        alt="Exterior"
                        className="w-full h-40 object-cover rounded-lg border border-slate-200"
                      />
                      <input
                        type="text"
                        value={editPhotoExterior}
                        onChange={(e) => setEditPhotoExterior(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        placeholder="URL รูปที่ 1 นอกที่พักอาศัย..."
                      />
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>
                          รูปที่ 2: ภาพถ่ายภายในที่พักอาศัย (เห็นพื้นและบริเวณภายใน)
                        </span>
                      </div>
                      <img
                        src={editPhotoInterior}
                        alt="Interior"
                        className="w-full h-40 object-cover rounded-lg border border-slate-200"
                      />
                      <input
                        type="text"
                        value={editPhotoInterior}
                        onChange={(e) => setEditPhotoInterior(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        placeholder="URL รูปที่ 2 ภายในที่พักอาศัย..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      บันทึกสรุปการเยี่ยมบ้านและคัดกรอง SDQ ของครูที่ปรึกษา
                    </label>
                    <textarea
                      rows={3}
                      value={editTeacherNote}
                      onChange={(e) => setEditTeacherNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: ข้อ 8-10 ลายเซ็นดิจิทัล 4 ฝ่าย และการรับรองข้อมูลส่ง กสศ. */}
              {modalTab === 'SIGNATURES_CCT' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="font-bold">
                      ข้อ 8 - ข้อ 10: การลงนามรับรองข้อมูลอิเล็กทรอนิกส์ (Digital Signature Pad 4 ฝ่าย)
                    </div>
                    <div className="text-[11px] mt-0.5">
                      เมื่อลงนามครบทั้ง 4 ฝ่าย ระบบจะแนบลายเซ็นเข้ากับชุดข้อมูลเพื่อโอนเข้าสู่ระบบ https://cct.eef.or.th โดยอัตโนมัติ
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        1. ลงชื่อนักเรียน (อายุเกิน 10 ปี)
                      </label>
                      <input
                        type="text"
                        value={editStudentSig}
                        onChange={(e) => setEditStudentSig(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-blue-900"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        2. ลงชื่อผู้ปกครอง (ผู้ให้ข้อมูลและรับรอง)
                      </label>
                      <input
                        type="text"
                        value={editGuardianSig}
                        onChange={(e) => setEditGuardianSig(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-blue-900"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        3. ลงชื่อครูผู้เยี่ยมบ้าน/สำรวจข้อมูล
                      </label>
                      <input
                        type="text"
                        value={editTeacherSig}
                        onChange={(e) => setEditTeacherSig(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-blue-900"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800">
                        4. ลงชื่อเจ้าหน้าที่ของรัฐ & ผู้อำนวยการสถานศึกษา (ข้อ 10)
                      </label>
                      <input
                        type="text"
                        value={editOfficialName}
                        onChange={(e) => setEditOfficialName(e.target.value)}
                        placeholder="ชื่อ-สกุล เจ้าหน้าที่ของรัฐ (กำนัน/ผู้ใหญ่บ้าน/อปท.)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 mb-1"
                      />
                      <input
                        type="text"
                        value={editOfficialSig}
                        onChange={(e) => setEditOfficialSig(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-blue-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleTriggerSingleCctSync(selectedRecord)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>บันทึก & โอนเข้าเว็บ CCT กสศ. ทันที</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0f2a59] hover:bg-[#163d7a] text-white font-bold shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลแบบ นร.01</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
