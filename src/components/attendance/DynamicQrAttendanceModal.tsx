// src/components/attendance/DynamicQrAttendanceModal.tsx
// หน้าต่างระบบเช็คชื่อด้วย QR Code อัจฉริยะ (Pastel Anime Education Dashboard)
// รองรับ 2 โหมดสมบูรณ์:
// 1. [นักเรียนสแกนจากจอครู]: Dynamic Rotating QR Code หมุนเวียนทุก 15 วินาที พร้อม OTP ป้องกันนักเรียนแคปภาพส่งต่อ
// 2. [ครูสแกนบัตรนักเรียน]: Continuous Scanner สแกนรหัสบัตรนักเรียนต่อเนื่องด้วยกล้อง พร้อมเสียง Beep 🎵 ทันที

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  QrCode,
  Scan,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Camera,
  Sparkles,
  Volume2,
  Smartphone,
  Search,
} from 'lucide-react';
import {
  qrAttendanceService,
  QR_ROTATION_INTERVAL_SECONDS,
  type DynamicQrPayload,
} from '../../services/qrAttendanceService';

export interface DynamicQrAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceType: 'MORNING_ASSEMBLY' | 'CLASSROOM_PERIOD';
  classroomId: string;
  classroomLabel: string;
  courseCode?: string;
  courseName?: string;
  periodNo?: number;
  date: string;
  students: Array<{ studentCode: string; studentName: string; status?: string }>;
  onStudentCheckIn: (studentCode: string, studentName: string) => void;
}

export const DynamicQrAttendanceModal: React.FC<DynamicQrAttendanceModalProps> = ({
  isOpen,
  onClose,
  attendanceType,
  classroomId,
  classroomLabel,
  courseCode,
  courseName,
  periodNo = 1,
  date,
  students,
  onStudentCheckIn,
}) => {
  // Mode selection: 'PROJECTOR_QR' vs 'TEACHER_SCANNER'
  const [activeTab, setActiveTab] = useState<'PROJECTOR_QR' | 'TEACHER_SCANNER'>('PROJECTOR_QR');

  // --- TAB 1: Dynamic Projector QR States ---
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentPayload, setCurrentPayload] = useState<DynamicQrPayload | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(QR_ROTATION_INTERVAL_SECONDS);
  const [recentScans, setRecentScans] = useState<Array<{ code: string; name: string; time: string }>>([]);

  // --- TAB 2: Teacher Scanner Camera States ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannerSearchQuery, setScannerSearchQuery] = useState<string>('');
  const [lastScannedStudent, setLastScannedStudent] = useState<{ code: string; name: string } | null>(null);
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);

  // ----------------------------------------------------
  // Dynamic QR Generation & Countdown Timer (15 Seconds)
  // ----------------------------------------------------
  const updateDynamicQr = async () => {
    const payload = qrAttendanceService.generateDynamicPayload({
      type: attendanceType,
      roomId: classroomId,
      courseCode,
      date,
      periodNo,
    });
    setCurrentPayload(payload);
    const dataUrl = await qrAttendanceService.generateQrDataUrl(payload);
    setQrDataUrl(dataUrl);
  };

  useEffect(() => {
    if (!isOpen) return;

    // First load
    updateDynamicQr();

    // Timer interval update every 1 second
    const timer = setInterval(() => {
      const remaining = qrAttendanceService.getSecondsRemainingInWindow();
      setSecondsRemaining(remaining);

      // When window rolls over (remaining hits max interval), regenerate QR
      if (remaining === QR_ROTATION_INTERVAL_SECONDS) {
        updateDynamicQr();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, attendanceType, classroomId, courseCode, date, periodNo]);

  // ----------------------------------------------------
  // Camera Scanner Logic (Tab 2)
  // ----------------------------------------------------
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('เบราว์เซอร์ไม่รองรับการเปิดกล้อง สามารถใช้โหมดแตะสแกนบัตรนักเรียนด้านล่างได้ทันที');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ (โปรดตรวจสอบสิทธิ์การใช้งานกล้อง) คุณสามารถแตะเลือกบัตรนักเรียนด้านล่างเพื่อสแกนได้');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'TEACHER_SCANNER') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, facingMode]);

  // ----------------------------------------------------
  // Handle Student Check-in (Sound + Animation + Callback)
  // ----------------------------------------------------
  const handleProcessCheckIn = (studentCode: string, studentName: string) => {
    // 1. Play Positive Chime
    qrAttendanceService.playSuccessSound();

    // 2. Trigger Flash
    setFlashSuccess(true);
    setTimeout(() => setFlashSuccess(false), 800);

    // 3. Set Last Scanned
    setLastScannedStudent({ code: studentCode, name: studentName });

    // 4. Record to Recent Scans List
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
    setRecentScans((prev) => [
      { code: studentCode, name: studentName, time: timeStr },
      ...prev.filter((item) => item.code !== studentCode),
    ]);

    // 5. Update Parent View
    onStudentCheckIn(studentCode, studentName);
  };

  // Simulation: Student scans Teacher QR
  const handleSimulateStudentScan = () => {
    const unscanned = students.filter(
      (s) => !recentScans.some((rs) => rs.code === s.studentCode) && s.status !== 'PRESENT'
    );
    const target = unscanned[0] || students[0];
    if (target) {
      handleProcessCheckIn(target.studentCode, target.studentName);
    }
  };

  // Filter students for manual barcode search in Tab 2
  const filteredStudents = useMemo(() => {
    if (!scannerSearchQuery.trim()) return students;
    const q = scannerSearchQuery.toLowerCase();
    return students.filter(
      (s) => s.studentName.toLowerCase().includes(q) || s.studentCode.includes(q)
    );
  }, [students, scannerSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs font-sans animate-fade-in select-none">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  ระบบเช็คชื่อ QR Code อัจฉริยะ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {attendanceType === 'MORNING_ASSEMBLY' ? 'แถวเช้า (โฮมรูม)' : 'เช็คชื่อรายคาบ'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ห้อง {classroomLabel} {courseName ? `• ${courseName} (คาบที่ ${periodNo})` : ''} • วันที่ {date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Mode Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 bg-slate-50/50 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('PROJECTOR_QR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PROJECTOR_QR'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. นักเรียนสแกนจากจอครู (หมุนเวียน 15s)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEACHER_SCANNER')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'TEACHER_SCANNER'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>2. ครูสแกนบัตรนักเรียน (Continuous Scanner)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ========================================================
              TAB 1: PROJECTOR / SCREEN DYNAMIC ROTATING QR CODE
              ======================================================== */}
          {activeTab === 'PROJECTOR_QR' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Big Rotating QR Display */}
              <div className="lg:col-span-7 flex flex-col items-center text-center space-y-4 bg-slate-50/70 p-5 sm:p-6 rounded-3xl border border-slate-200/80">
                {/* Security Anti-Cheat Alert Banner */}
                <div className="w-full bg-blue-50/90 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5 text-left text-xs text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold block">ระบบป้องกันนักเรียนแคปภาพส่งต่อ (Anti-Proxy Check-In)</span>
                    <span className="text-[11px] text-blue-700 leading-relaxed block">
                      QR Code และรหัสความปลอดภัยจะเปลี่ยนใหม่ทุก 15 วินาที หากส่งต่อภาพแคปเจอร์ ระบบจะปฏิเสธการเช็คชื่ออัตโนมัติ
                    </span>
                  </div>
                </div>

                {/* QR Code Container with Anime Frame */}
                <div className="relative p-4 bg-white rounded-3xl border-2 border-blue-200/90 shadow-xl shadow-blue-500/5 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Dynamic Rotating Attendance QR"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl transition-all duration-300"
                    />
                  ) : (
                    <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  )}

                  {/* Rolling Seed & OTP Pill */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono text-xs font-black shadow-xs">
                      OTP: {currentPayload?.otp || '----'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                      TOKEN #{currentPayload?.token || '--------'}
                    </span>
                  </div>
                </div>

                {/* Countdown Timer Indicator */}
                <div className="w-full max-w-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>รีเฟรช QR Code อัตโนมัติใน:</span>
                    </span>
                    <span
                      className={`font-mono text-sm font-black ${
                        secondsRemaining <= 4 ? 'text-rose-600 animate-pulse' : 'text-blue-700'
                      }`}
                    >
                      {secondsRemaining} วินาที
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        secondsRemaining <= 4 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${(secondsRemaining / QR_ROTATION_INTERVAL_SECONDS) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Simulation Action Buttons for Demo/Testing */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateStudentScan}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 shadow-2xs"
                    title="ทดสอบจำลองนักเรียนใช้มือถือสแกน QR หน้านี้"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>📱 จำลองนักเรียน 1 คนสแกน QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateDynamicQr();
                      qrAttendanceService.playSuccessSound();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="สร้างรหัสใหม่ทันที"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>หมุนเวียน QR ทันที</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Scanned Feed */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        สถิติสแกนเข้าเรียน (Live Feed)
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      สแกนแล้ว {recentScans.length} / {students.length} คน
                    </span>
                  </div>

                  {recentScans.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Scan className="w-6 h-6 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-600">รอนักเรียนเริ่มสแกน QR Code...</p>
                      <p className="text-[11px] text-slate-400">
                        เมื่อนักเรียนสแกนสำเร็จ รายชื่อจะแสดงและบันทึกเป็น &quot;มา&quot; ในทันที
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {recentScans.map((item, idx) => (
                        <div
                          key={item.code}
                          className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-3 animate-slide-up"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                รหัส {item.code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{item.time}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: TEACHER CONTINUOUS STUDENT ID CARD SCANNER
              ======================================================== */}
          {activeTab === 'TEACHER_SCANNER' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Camera Viewfinder with Scanner Beam */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className={`relative rounded-3xl overflow-hidden border-2 bg-slate-950 aspect-video sm:aspect-4/3 flex items-center justify-center transition-all ${
                    flashSuccess ? 'ring-4 ring-emerald-400 border-emerald-500' : 'border-slate-800 shadow-xl'
                  }`}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Scanner Overlay Sight Box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="relative w-48 h-48 sm:w-60 sm:h-60 border-2 border-blue-400/80 rounded-3xl">
                      {/* Corner Target Markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/80 animate-pulse" />
                    </div>
                  </div>

                  {/* Fallback Warning if Camera is blocked or inactive */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-5 text-center text-white space-y-3">
                      <Camera className="w-10 h-10 text-slate-400 animate-bounce" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold">กล้องยังไม่พร้อมใช้งาน</p>
                        <p className="text-xs text-slate-400 max-w-xs">
                          {cameraError || 'กำลังเชื่อมต่ออุปกรณ์กล้อง หรือแตะบัตรนักเรียนทางขวาเพื่อสแกน'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        เปิดกล้องอีกครั้ง
                      </button>
                    </div>
                  )}

                  {/* Last Scanned Pop-Up Banner */}
                  {lastScannedStudent && (
                    <div className="absolute bottom-3 inset-x-3 bg-emerald-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-xl animate-slide-up">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-xs font-extrabold">{lastScannedStudent.name}</p>
                          <p className="text-[10px] text-emerald-100 font-mono">
                            รหัส {lastScannedStudent.code} • เช็คชื่อสำเร็จ (มา)
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                        ✓ สำเร็จ
                      </span>
                    </div>
                  )}
                </div>

                {/* Camera Control Toolbar */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>เสียงยืนยัน: เปิดใช้งาน (Beep 🎵)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      สลับกล้อง ({facingMode === 'environment' ? 'หลัง' : 'หน้า'})
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Tap-to-Scan Student ID Badges (Super Fast Backup) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      แตะบัตรนักเรียนเพื่อสแกน ({filteredStudents.length} คน)
                    </h3>
                    <span className="text-[11px] font-bold text-blue-600">
                      สแกนแล้ว {recentScans.length}
                    </span>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ หรือเลขประจำตัว..."
                      value={scannerSearchQuery}
                      onChange={(e) => setScannerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Student Badges List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredStudents.map((stu) => {
                      const isScanned = recentScans.some((rs) => rs.code === stu.studentCode) || stu.status === 'PRESENT';

                      return (
                        <div
                          key={stu.studentCode}
                          onClick={() => handleProcessCheckIn(stu.studentCode, stu.studentName)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isScanned
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                                isScanned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {stu.studentCode.slice(-2)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {stu.studentName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                เลขประจำตัว {stu.studentCode}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 shrink-0 ${
                              isScanned
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                            }`}
                          >
                            {isScanned ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>สแกนแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Scan className="w-3.5 h-3.5" />
                                <span>สแกนบัตร</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>สถิติรวม: มาแล้ว {recentScans.length} คน จากทั้งหมด {students.length} คน</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            ✓ เสร็จสิ้น / บันทึกผล
          </button>
        </div>
      </div>
    </div>
  );
};
