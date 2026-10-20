import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Phone,
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  Building,
} from 'lucide-react';
import {
  homeVisitService,
  type HomeVisitRecord,
  type SdqLevel,
} from '../services/homeVisitService';
import { authService, type AuthUser } from '../services/authService';
import { type SchoolSettingsConfig } from '../config/schoolSettings';
import { studentService } from '../services/studentService';

interface StudentHomeVisitFormViewProps {
  onAwardXp?: (xp: number) => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentHomeVisitFormView: React.FC<StudentHomeVisitFormViewProps> = ({
  onAwardXp,
  currentUser,
  schoolSettings,
}) => {
  const effectiveUser = currentUser || authService.getCurrentUser();
  const studentCode = effectiveUser?.studentCode || '45102';
  const existing = homeVisitService.getByStudentCode(studentCode);

  const draftRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(`kp_home_visit_draft_${studentCode}`) : null;
  const draft = draftRaw ? JSON.parse(draftRaw) : null;
  const realStudent: any = ((studentService as any).getStudents?.() || []).find((s: any) => s.studentCode === studentCode || s.id === effectiveUser?.id);

  // Stepper State (1, 2, 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: ข้อมูลผู้ปกครองและที่อยู่
  const [guardianName, setGuardianName] = useState(
    draft?.guardianName || existing?.guardianName || realStudent?.parentName || ''
  );
  const [guardianRelation, setGuardianRelation] = useState(
    draft?.guardianRelation || existing?.guardianRelation || 'มารดา'
  );
  const [guardianPhone, setGuardianPhone] = useState(
    draft?.guardianPhone || existing?.guardianPhone || realStudent?.parentPhone || ''
  );
  const [addressLine, setAddressLine] = useState(
    draft?.addressLine || existing?.address || realStudent?.address || ''
  );
  const [province, setProvince] = useState(
    draft?.province || (schoolSettings?.districtProvince?.includes('จ.')
      ? schoolSettings.districtProvince.split('จ.')[1].trim()
      : 'อุดรธานี')
  );
  const [district, setDistrict] = useState(
    draft?.district || (schoolSettings?.districtProvince?.includes('อ.')
      ? schoolSettings.districtProvince.split('อ.')[1].split(' ')[0]
      : 'กุดจับ')
  );
  const [subdistrict, setSubdistrict] = useState(draft?.subdistrict || '');
  const [postalCode, setPostalCode] = useState(draft?.postalCode || '');

  // Step 2: สภาพครอบครัวและการเรียน
  const [familyMembersCount, setFamilyMembersCount] = useState(draft?.familyMembersCount || '4 คน');
  const [familyIncomeRange, setFamilyIncomeRange] = useState<string>(
    draft?.familyIncomeRange || '10,001 - 20,000 บาท'
  );
  const [guardianOccupation, setGuardianOccupation] = useState(
    draft?.guardianOccupation || existing?.guardianOccupation || ''
  );
  const [housingType, setHousingType] = useState(draft?.housingType || 'บ้านของตนเอง');
  const travelMethod = 'รถโดยสารประจำทาง/รับจ้าง';
  const [familyNotes, setFamilyNotes] = useState(
    draft?.familyNotes || existing?.sdqEmotionalNote || ''
  );

  // Step 3: สรุปผลการเยี่ยมบ้าน & GPS
  const [gpsLat, setGpsLat] = useState<number>(draft?.gpsLat || existing?.gpsLat || 0);
  const [gpsLng, setGpsLng] = useState<number>(draft?.gpsLng || existing?.gpsLng || 0);
  const [isLocating, setIsLocating] = useState(false);
  const teacherSummary = existing?.teacherSummaryNote || 'อยู่ระหว่างรอการลงพื้นที่เยี่ยมบ้านโดยครูที่ปรึกษา';

  // SDQ Self Assessment (5 dimensions, 0-8 each = 0-40)
  const sdqEmotion = 4;
  const sdqConduct = 2;
  const sdqHyper = 3;
  const sdqPeer = 3;

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const totalSdqScore = sdqEmotion + sdqConduct + sdqHyper + sdqPeer;
  const computedSdqStatus: SdqLevel =
    totalSdqScore >= 17 ? 'PROBLEM' : totalSdqScore >= 14 ? 'RISK' : 'NORMAL';

  const handlePinCurrentGps = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLat(pos.coords.latitude);
          setGpsLng(pos.coords.longitude);
          setIsLocating(false);
          setToastMsg('📍 ปักหมุดพิกัด GPS ปัจจุบันสำเร็จ!');
          setTimeout(() => setToastMsg(null), 3000);
        },
        () => {
          setIsLocating(false);
          setToastMsg('⚠️ ไม่สามารถดึงพิกัด GPS ได้ กรุณาเปิดสิทธิ์เข้าถึงตำแหน่งที่ตั้ง');
          setTimeout(() => setToastMsg(null), 3500);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setToastMsg('⚠️ อุปกรณ์ของคุณไม่รองรับการดึงพิกัด GPS');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleSaveDraft = () => {
    const draftPayload = {
      guardianName,
      guardianRelation,
      guardianPhone,
      addressLine,
      province,
      district,
      subdistrict,
      postalCode,
      familyMembersCount,
      familyIncomeRange,
      guardianOccupation,
      housingType,
      familyNotes,
      gpsLat,
      gpsLng,
      updatedAt: new Date().toISOString(),
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`kp_home_visit_draft_${studentCode}`, JSON.stringify(draftPayload));
    }
    setToastMsg('💾 บันทึกแบบร่างข้อมูลเยี่ยมบ้านเรียบร้อยแล้ว');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveFinal = () => {
    const parts = [
      addressLine,
      subdistrict ? `ต.${subdistrict}` : '',
      district ? `อ.${district}` : '',
      province ? `จ.${province}` : '',
      postalCode,
    ].filter(Boolean);
    const fullAddress = parts.join(' ');

    homeVisitService.submitStudentHomeInfo(studentCode, {
      address: fullAddress,
      landmarkNote: '',
      gpsLat,
      gpsLng,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianOccupation,
      familyIncomeRange: familyIncomeRange as HomeVisitRecord['familyIncomeRange'],
      housingType: housingType as any,
      travelMethod: travelMethod as any,
      travelDistanceKm: 0,
      sdqStudentScore: totalSdqScore,
      sdqStudentStatus: computedSdqStatus,
      sdqEmotionalNote: familyNotes,
    });

    onAwardXp?.(150);
    setToastMsg('🎉 บันทึกข้อมูลการเยี่ยมบ้านเรียบร้อยแล้ว (+150 XP)');
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header matching Mockup Screen 3 */}
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>ข้อมูลการเยี่ยมบ้านนักเรียน</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          กรอกข้อมูลให้ครบถ้วน เพื่อใช้ในการดูแลช่วยเหลือนักเรียน
        </p>
      </div>

      {/* 2. Stepper 3 Steps (ตาม Mockup 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
              currentStep === 1
                ? 'bg-orange-50 border border-orange-200 text-orange-950 font-bold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 1
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </div>
            <div className="min-w-0">
              <span className="text-xs block font-bold truncate">ข้อมูลผู้ปกครองและที่อยู่</span>
              <span className="text-[10px] text-slate-400 hidden sm:block">ขั้นตอนที่ 1</span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
              currentStep === 2
                ? 'bg-orange-50 border border-orange-200 text-orange-950 font-bold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 2
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <div className="min-w-0">
              <span className="text-xs block font-bold truncate">สภาพครอบครัวและการเรียน</span>
              <span className="text-[10px] text-slate-400 hidden sm:block">ขั้นตอนที่ 2</span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
              currentStep === 3
                ? 'bg-orange-50 border border-orange-200 text-orange-950 font-bold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 3
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <div className="min-w-0">
              <span className="text-xs block font-bold truncate">สรุปผลการเยี่ยมบ้าน</span>
              <span className="text-[10px] text-slate-400 hidden sm:block">ขั้นตอนที่ 3</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* ================= STEP 1: ข้อมูลผู้ปกครองและที่อยู่ ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-slate-900 text-base">
                1. ข้อมูลผู้ปกครองและที่อยู่ปัจจุบัน
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อ-สกุลผู้ปกครอง</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  placeholder="เช่น นายสมชาย ใจดี"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ความเกี่ยวข้อง</label>
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="บิดา">บิดา</option>
                  <option value="มารดา">มารดา</option>
                  <option value="ปู่/ย่า/ตา/ยาย">ปู่/ย่า/ตา/ยาย</option>
                  <option value="ญาติผู้ใหญ่">ญาติผู้ใหญ่</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>เบอร์โทรศัพท์ติดต่อ</span>
                </label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  placeholder="081-452-9918"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ที่อยู่ปัจจุบัน (บ้านเลขที่ / หมู่)</label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  placeholder="142/8 หมู่ 4"
                />
              </div>
            </div>

            {/* Address Location Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">จังหวัด</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                  placeholder="ระบุจังหวัด"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">อำเภอ / เขต</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                  placeholder="ระบุอำเภอ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ตำบล / แขวง</label>
                <input
                  type="text"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                  placeholder="ระบุตำบล"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">รหัสไปรษณีย์</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  placeholder="รหัสไปรษณีย์"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: สภาพครอบครัวและการเรียน ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-slate-900 text-base">
                2. สภาพครอบครัวและการเรียนรู้
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">จำนวนสมาชิกในครอบครัว</label>
                <select
                  value={familyMembersCount}
                  onChange={(e) => setFamilyMembersCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="2-3 คน">2-3 คน</option>
                  <option value="4 คน">4 คน</option>
                  <option value="5 คนขึ้นไป">5 คนขึ้นไป</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">รายได้เฉลี่ยต่อเดือน</label>
                <select
                  value={familyIncomeRange}
                  onChange={(e) => setFamilyIncomeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="< 10,000 บ./เดือน">&lt; 10,000 บ./เดือน</option>
                  <option value="10,001 - 20,000 บาท">10,001 - 20,000 บาท</option>
                  <option value="20,001 - 35,000 บาท">20,001 - 35,000 บาท</option>
                  <option value="> 35,000 บาท">&gt; 35,000 บาท</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">อาชีพผู้ปกครอง</label>
                <input
                  type="text"
                  value={guardianOccupation}
                  onChange={(e) => setGuardianOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  placeholder="รับจ้างทั่วไป / ค้าขาย"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">สถานะที่อยู่อาศัย</label>
                <select
                  value={housingType}
                  onChange={(e) => setHousingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none bg-white"
                >
                  <option value="บ้านของตนเอง">บ้านของตนเอง</option>
                  <option value="บ้านเช่า">บ้านเช่า</option>
                  <option value="อาศัยอยู่กับญาติ">อาศัยอยู่กับญาติ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">
                ปัญหาหรือข้อเสนอแนะเพิ่มเติมในการเรียนและการใช้ชีวิต
              </label>
              <textarea
                rows={3}
                value={familyNotes}
                onChange={(e) => setFamilyNotes(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:border-orange-500 focus:outline-none leading-relaxed"
                placeholder="ระบุข้อสังเกตเพิ่มเติม เช่น ภาระงานที่บ้าน หรือสิ่งที่ต้องการให้โรงเรียนสนับสนุน..."
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: สรุปผลการเยี่ยมบ้าน & พิกัด GPS ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-slate-900 text-base">
                3. สรุปผลการเยี่ยมบ้านและตำแหน่งที่ตั้ง (GPS)
              </h3>
            </div>

            {/* GPS Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>พิกัด GPS บ้านนักเรียน</span>
                </span>
                <p className="text-xs text-slate-500 font-mono">
                  {gpsLat !== 0 || gpsLng !== 0
                    ? `${gpsLat.toFixed(5)}, ${gpsLng.toFixed(5)}${subdistrict && province ? ` (${subdistrict} ${province})` : ''}`
                    : 'ยังไม่ได้ระบุพิกัด (กดปุ่มเพื่อบันทึกพิกัดปัจจุบัน)'}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePinCurrentGps}
                disabled={isLocating}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-orange-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'กำลังค้นหาพิกัด...' : 'บันทึกพิกัด GPS อัตโนมัติ'}</span>
              </button>
            </div>

            {/* Teacher Assessment Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  สรุปความเห็นของครูประจำชั้น / แผนการดูแลช่วยเหลือ
                </label>
                <span className="text-[11px] text-slate-400 font-medium">(ครูประจำชั้นเป็นผู้บันทึก)</span>
              </div>
              <textarea
                rows={3}
                value={teacherSummary}
                readOnly
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-slate-600 text-xs focus:outline-none leading-relaxed cursor-default"
                placeholder="ส่วนนี้สำหรับครูประจำชั้นบันทึกสรุปผลและข้อเสนอแนะเมื่อลงพื้นที่จริง..."
              />
            </div>
          </div>
        )}

        {/* 4. Action Buttons (ตาม Mockup: บันทึกฉบับร่าง + ถัดไป/บันทึก) */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              บันทึกฉบับร่าง
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveFinal}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกข้อมูลเยี่ยมบ้าน (+150 XP)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Slogan Footer Bar (ตรงตาม Mockup 3 เป๊ะ) */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-center text-xs font-bold text-emerald-900 shadow-2xs">
        🌱 เรียนดี มีวินัย เติบโตอย่างมีคุณภาพ | โรงเรียนตัวอย่างพัฒนา
      </div>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
