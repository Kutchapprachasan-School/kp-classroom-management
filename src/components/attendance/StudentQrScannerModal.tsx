// src/components/attendance/StudentQrScannerModal.tsx
// หน้าต่างสำหรับนักเรียนใช้กล้องมือถือสแกน Dynamic QR Code จากจอครู
// มีระบบตรวจสอบความสดใหม่ของโทเคน (Anti-Cheat 15 วินาที)

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import {
  qrAttendanceService,
  type DynamicQrPayload,
} from '../../services/qrAttendanceService';

export interface StudentQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedRoomId: string;
  expectedType: 'MORNING_ASSEMBLY' | 'CLASSROOM_PERIOD';
  expectedCourseCode?: string;
  currentStudentCode?: string;
  currentStudentName?: string;
  onSuccessCheckIn: (studentCode: string, studentName: string) => void;
}

export const StudentQrScannerModal: React.FC<StudentQrScannerModalProps> = ({
  isOpen,
  onClose,
  expectedRoomId,
  expectedType,
  expectedCourseCode,
  currentStudentCode = '47001',
  currentStudentName = 'ด.ช. ชนะภัย ยอดสิงห์',
  onSuccessCheckIn,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setIsSuccess(false);
      setStatusMessage(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Handle successful scan of Teacher's Dynamic QR Code
  const handleScannedPayload = (payloadString: string) => {
    const result = qrAttendanceService.verifyDynamicScan(payloadString, expectedRoomId, expectedType);

    if (result.valid) {
      qrAttendanceService.playSuccessSound();
      setIsSuccess(true);
      setStatusMessage(`✓ เช็คชื่อสำเร็จ: ${currentStudentName} บันทึกเวลาเข้าเรียนเรียบร้อยแล้ว`);
      onSuccessCheckIn(currentStudentCode, currentStudentName);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      qrAttendanceService.playErrorSound();
      setIsSuccess(false);
      setStatusMessage(result.message);
    }
  };

  // Test Simulation: Scan current live token from Teacher screen
  const handleSimulateScanTeacherQr = () => {
    const payload = qrAttendanceService.generateDynamicPayload({
      type: expectedType,
      roomId: expectedRoomId,
      courseCode: expectedCourseCode,
      date: new Date().toISOString().split('T')[0],
    });
    handleScannedPayload(JSON.stringify(payload));
  };

  // Test Simulation: Scan EXPIRED token (> 15 seconds) to demonstrate anti-cheating
  const handleSimulateExpiredScan = () => {
    const expiredPayload: DynamicQrPayload = {
      action: 'KPS_ATTENDANCE_CHECKIN',
      type: expectedType,
      roomId: expectedRoomId,
      courseCode: expectedCourseCode,
      date: new Date().toISOString().split('T')[0],
      timeWindow: qrAttendanceService.getCurrentTimeWindow() - 5, // 5 windows ago (~75s)
      token: 'expired99',
      otp: '9999',
      expiresAt: Date.now() - 60000,
    };
    handleScannedPayload(JSON.stringify(expiredPayload));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-fade-in select-none">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                สแกน QR Code จากจอครู
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentStudentName} (รหัส {currentStudentCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="p-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

            {/* Target Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
              <div className="relative w-44 h-44 border-2 border-blue-400/80 rounded-2xl">
                <div className="absolute inset-x-2 top-0 h-0.5 bg-cyan-400 shadow-md animate-pulse" />
              </div>
            </div>

            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                <p className="text-xs font-bold">หันกล้องไปที่หน้าจอโปรเจกเตอร์หรือแท็บเล็ตของคุณครู</p>
              </div>
            )}
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-slide-up ${
                isSuccess
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage}</span>
            </div>
          )}

          {/* Quick Simulation Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-400 font-semibold text-center">
              ทดสอบการทำงานของระบบ Anti-Cheating:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulateScanTeacherQr}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓ สแกน QR ครูสด (ผ่าน)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateExpiredScan}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="ทดสอบกรณีแคปภาพส่งต่อแล้วหมดอายุ"
              >
                <span>⚠️ ทดสอบภาพแคปเจอร์ (ไม่ผ่าน)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
