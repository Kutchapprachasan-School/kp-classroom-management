import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  HeartHandshake,
  CheckCircle2,
  Save,
  Sparkles,
  Home,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  homeVisitService,
  type HomeVisitRecord,
  type SdqLevel,
} from '../services/homeVisitService';

interface StudentHomeVisitFormViewProps {
  onAwardXp?: (xp: number) => void;
}

export const StudentHomeVisitFormView: React.FC<StudentHomeVisitFormViewProps> = ({
  onAwardXp,
}) => {
  const existing = homeVisitService.getByStudentCode('45102');

  const [address, setAddress] = useState(
    existing?.address || '142/8 หมู่ 4 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200'
  );
  const [landmarkNote, setLandmarkNote] = useState(
    existing?.landmarkNote || 'ซอยข้างวัดป่าแดง บ้านรั้วไม้สีน้ำตาล หลังที่ 3 ซ้ายมือ'
  );
  const [gpsLat, setGpsLat] = useState<number>(existing?.gpsLat || 18.7883);
  const [gpsLng, setGpsLng] = useState<number>(existing?.gpsLng || 98.9542);
  const [isLocating, setIsLocating] = useState(false);

  const [guardianName, setGuardianName] = useState(
    existing?.guardianName || 'นางสมพร คำฝั้น'
  );
  const [guardianRelation, setGuardianRelation] = useState(
    existing?.guardianRelation || 'มารดา'
  );
  const [guardianPhone, setGuardianPhone] = useState(
    existing?.guardianPhone || '081-452-9918'
  );
  const [guardianOccupation, setGuardianOccupation] = useState(
    existing?.guardianOccupation || 'รับจ้างทั่วไป / ค้าขายรายวัน'
  );
  const [familyIncomeRange, setFamilyIncomeRange] = useState<
    HomeVisitRecord['familyIncomeRange']
  >(existing?.familyIncomeRange || '< 10,000 บ./เดือน');
  const [housingType, setHousingType] = useState<HomeVisitRecord['housingType']>(
    existing?.housingType || 'บ้านเช่า/หอพัก'
  );
  const [travelMethod, setTravelMethod] = useState<
    HomeVisitRecord['travelMethod']
  >(existing?.travelMethod || 'เดินเท้า/รถโดยสาร');
  const [travelDistanceKm, setTravelDistanceKm] = useState<number>(
    existing?.travelDistanceKm || 11.5
  );

  // SDQ Self Assessment (5 dimensions, 0-8 each = 0-40)
  const [sdqEmotion, setSdqEmotion] = useState(4);
  const [sdqConduct, setSdqConduct] = useState(2);
  const [sdqHyper, setSdqHyper] = useState(3);
  const [sdqPeer, setSdqPeer] = useState(3);
  const [sdqNote, setSdqNote] = useState(
    existing?.sdqEmotionalNote ||
      'ช่วงเย็นต้องช่วยแม่ขายของที่ตลาด บางวันทำการบ้านเสร็จดึก อยากให้คุณครูช่วยแนะนำตารางอ่านหนังสือครับ'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalSdqScore = sdqEmotion + sdqConduct + sdqHyper + sdqPeer;
  const computedSdqStatus: SdqLevel =
    totalSdqScore >= 17 ? 'PROBLEM' : totalSdqScore >= 14 ? 'RISK' : 'NORMAL';

  const handlePinCurrentGps = () => {
    setIsLocating(true);
    setTimeout(() => {
      // จำลองการดึงพิกัด GPS บ้านละเอียดขึ้น
      const newLat = Number((18.7883 + (Math.random() - 0.5) * 0.004).toFixed(5));
      const newLng = Number((98.9542 + (Math.random() - 0.5) * 0.004).toFixed(5));
      setGpsLat(newLat);
      setGpsLng(newLng);
      setIsLocating(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    homeVisitService.submitStudentHomeInfo('45102', {
      address,
      landmarkNote,
      gpsLat,
      gpsLng,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianOccupation,
      familyIncomeRange,
      housingType,
      travelMethod,
      travelDistanceKm,
      sdqStudentScore: totalSdqScore,
      sdqStudentStatus: computedSdqStatus,
      sdqEmotionalNote: sdqNote,
    });

    setSavedSuccess(true);
    if (onAwardXp) {
      onAwardXp(50);
    }
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2a59] via-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ภารกิจพิเศษต้นเทอม (+50 XP)</span>
          </div>
          <h1 className="text-xl font-bold">
            กรอกข้อมูลเยี่ยมบ้าน & ปักหมุดแผนที่บ้าน (SDQ)
          </h1>
          <p className="text-xs text-blue-100 mt-1">
            ข้อมูลและพิกัด GPS ที่นักเรียนบันทึก จะส่งตรงไปยังหน้าจอระบบเยี่ยมบ้านของครูที่ปรึกษาทันที
          </p>
        </div>

        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs shrink-0">
          <div className="text-blue-200">สถานะปัจจุบันของฉัน</div>
          <div className="font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>ซิงก์กับครูที่ปรึกษาแล้ว</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              บันทึกข้อมูลเยี่ยมบ้าน พิกัด GPS และแบบประเมิน SDQ เรียบร้อยแล้ว! (คุณได้รับ +50 XP และข้อมูลอัปเดตไปยังหน้าจอของครูทันที)
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ส่วนที่ 1: ปักหมุดพิกัดบ้าน GPS และที่อยู่ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  1. พิกัดบ้าน (GPS) และจุดสังเกตสำหรับการเยี่ยมบ้าน
                </h2>
                <p className="text-[11px] text-slate-500">
                  กดปุ่มดึงพิกัดปัจจุบันขณะอยู่ที่บ้านเพื่อให้ครูที่ปรึกษาเปิดแผนที่นำทางมาเยี่ยมบ้านได้ถูกต้อง
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePinCurrentGps}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>
                {isLocating ? 'กำลังดึงพิกัด GPS...' : 'ปักหมุดพิกัดบ้านปัจจุบัน'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ละติจูด (Latitude)
              </label>
              <input
                type="number"
                step="0.00001"
                value={gpsLat}
                onChange={(e) => setGpsLat(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ลองจิจูด (Longitude)
              </label>
              <input
                type="number"
                step="0.00001"
                value={gpsLng}
                onChange={(e) => setGpsLng(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ระยะห่างจากโรงเรียน (กม.)
              </label>
              <input
                type="number"
                step="0.1"
                value={travelDistanceKm}
                onChange={(e) => setTravelDistanceKm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ที่อยู่ปัจจุบันที่ติดต่อได้
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จุดสังเกตบ้าน (สีรั้วบ้าน / สถานที่ใกล้เคียง)
              </label>
              <input
                type="text"
                value={landmarkNote}
                onChange={(e) => setLandmarkNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* ส่วนที่ 2: ข้อมูลผู้ปกครองและสภาพครอบครัว */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. ข้อมูลผู้ปกครองและการเดินทางมาโรงเรียน
              </h2>
              <p className="text-[11px] text-slate-500">
                ใช้สำหรับติดต่อประสานงานและพิจารณาทุนการศึกษาของโรงเรียน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุลผู้ปกครอง
              </label>
              <input
                type="text"
                required
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ความสัมพันธ์
              </label>
              <input
                type="text"
                value={guardianRelation}
                onChange={(e) => setGuardianRelation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>เบอร์โทรศัพท์ผู้ปกครอง</span>
              </label>
              <input
                type="text"
                required
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                อาชีพผู้ปกครอง
              </label>
              <input
                type="text"
                value={guardianOccupation}
                onChange={(e) => setGuardianOccupation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                รายได้ครอบครัวเฉลี่ย
              </label>
              <select
                value={familyIncomeRange}
                onChange={(e) => setFamilyIncomeRange(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="< 10,000 บ./เดือน">&lt; 10,000 บ./เดือน</option>
                <option value="10,000 - 25,000 บ./เดือน">
                  10,000 - 25,000 บ./เดือน
                </option>
                <option value="> 25,000 บ./เดือน">&gt; 25,000 บ./เดือน</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ลักษณะที่พักอาศัย
              </label>
              <select
                value={housingType}
                onChange={(e) => setHousingType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="บ้านตนเอง">บ้านตนเอง</option>
                <option value="บ้านเช่า/หอพัก">บ้านเช่า/หอพัก</option>
                <option value="อาศัยอยู่กับญาติ">อาศัยอยู่กับญาติ</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                การเดินทางมาโรงเรียน
              </label>
              <select
                value={travelMethod}
                onChange={(e) => setTravelMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="ผู้ปกครองรับ-ส่ง">ผู้ปกครองรับ-ส่ง</option>
                <option value="รถรับ-ส่งนักเรียน">รถรับ-ส่งนักเรียน</option>
                <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
                <option value="เดินเท้า/รถโดยสาร">เดินเท้า/รถโดยสาร</option>
              </select>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3: แบบประเมินตนเอง SDQ (ฉบับนักเรียน) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  3. แบบประเมินตนเอง (SDQ ฉบับนักเรียน) และสิ่งที่อยากบอกครูที่ปรึกษา
                </h2>
                <p className="text-[11px] text-slate-500">
                  ข้อมูลส่วนนี้เป็นความลับสำหรับครูที่ปรึกษาเพื่อดูแลช่วยเหลือนักเรียน
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400">ผลประเมินเบื้องต้น: </span>
              <span
                className={`font-bold ${
                  computedSdqStatus === 'NORMAL'
                    ? 'text-emerald-600'
                    : computedSdqStatus === 'RISK'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {computedSdqStatus === 'NORMAL'
                  ? 'ปกติ'
                  : computedSdqStatus === 'RISK'
                  ? 'มีเรื่องกังวลเล็กน้อย (ครูพร้อมรับฟัง)'
                  : 'ต้องการคำปรึกษาดูแลพิเศษ'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>1. ความเครียด / ความกังวลใจช่วงนี้</span>
                <span>{sdqEmotion}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={sdqEmotion}
                onChange={(e) => setSdqEmotion(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>2. สมาธิในการเรียนและการส่งงาน</span>
                <span>{sdqHyper}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={sdqHyper}
                onChange={(e) => setSdqHyper(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>3. การปรับตัวกับเพื่อนในห้องเรียน</span>
                <span>{sdqPeer}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={sdqPeer}
                onChange={(e) => setSdqPeer(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>4. อุปสรรคด้านเวลา/ภาระงานทางบ้าน</span>
                <span>{sdqConduct}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={sdqConduct}
                onChange={(e) => setSdqConduct(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              เรื่องที่อยากปรึกษาครูที่ปรึกษา หรือข้อจำกัดทางบ้าน (เช่น ต้องช่วยงานทางบ้าน, ขอรับทุนการศึกษา)
            </label>
            <textarea
              rows={2}
              value={sdqNote}
              onChange={(e) => setSdqNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ข้อมูลจะถูกส่งไปยังครูที่ปรึกษาโดยตรงในระบบจัดการชั้นเรียน
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f2a59] hover:bg-[#163d7a] text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลเยี่ยมบ้าน & รับ +50 XP</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
