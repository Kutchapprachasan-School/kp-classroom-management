// src/components/exam/RoomQRCodeModal.tsx
// หน้าต่างแสดง QR Code และรหัส PIN 6 หลักสำหรับให้นักเรียนเข้าร่วมห้องสอบสด (Gold Quest Arena / Online Quiz)
// รองรับการฉายโปรเจกเตอร์เต็มจอ, คัดลอกรหัส PIN, และดาวน์โหลด QR Code สไตล์ Pastel Anime

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Users,
  Maximize2,
  Minimize2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface RoomQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomPin: string;
  examTitle: string;
  studentCount: number;
  joinUrl?: string;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer') => void;
}

export const RoomQRCodeModal: React.FC<RoomQRCodeModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomPin,
  examTitle,
  studentCount,
  joinUrl: customJoinUrl,
  onPlaySound,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopiedPin, setIsCopiedPin] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // คำนวณลิงก์เข้าร่วมห้องสอบอัตโนมัติ
  const joinUrl = useMemo(() => {
    if (customJoinUrl) return customJoinUrl;
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}/live-classroom/gold-quest/join?room=${encodeURIComponent(roomId)}&pin=${encodeURIComponent(roomPin)}`;
    }
    return `https://kp-classroom-management.vercel.app/live-classroom/gold-quest/join?room=${roomId}&pin=${roomPin}`;
  }, [customJoinUrl, roomId, roomPin]);

  // สร้าง QR Code จาก URL เข้าร่วม
  useEffect(() => {
    if (!isOpen || !joinUrl) return;

    let isMounted = true;
    QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: isFullscreen ? 520 : 360,
      color: {
        dark: '#163A66', // Text Primary Navy Blue (Pastel Anime Master Token)
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate exam room QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, joinUrl, isFullscreen]);

  // คัดลอกรหัส PIN 6 หลัก
  const handleCopyPin = useCallback(() => {
    if (!roomPin) return;
    navigator.clipboard.writeText(roomPin).then(() => {
      setIsCopiedPin(true);
      onPlaySound?.('tick');
      setTimeout(() => setIsCopiedPin(false), 2000);
    });
  }, [roomPin, onPlaySound]);

  // คัดลอกลิงก์ห้องสอบ
  const handleCopyLink = useCallback(() => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setIsCopiedLink(true);
      onPlaySound?.('tick');
      setTimeout(() => setIsCopiedLink(false), 2000);
    });
  }, [joinUrl, onPlaySound]);

  // ดาวน์โหลดรูป QR Code เก็บไว้
  const handleDownloadQr = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Exam-QR-${roomPin || roomId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onPlaySound?.('coin');
  }, [qrDataUrl, roomPin, roomId, onPlaySound]);

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // แยกตัวเลข PIN เป็นรายหลัก (สำหรับแสดงผลกล่องแยก)
  const pinDigits = (roomPin || '000000').slice(0, 6).split('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'max-w-5xl h-[94vh]'
            : 'max-w-2xl max-h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-400/40 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                  <Sparkles className="w-3 h-3" />
                  <span>ห้องสอบสดพร้อมเปิดรับนักเรียน</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-400/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <Users className="w-3 h-3" />
                  <span>เข้าห้องแล้ว {studentCount} คน</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#163A66] dark:text-white truncate mt-0.5">
                {examTitle || 'ห้องสอบเก็บคะแนน'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* ปุ่มสลับโหมดโปรเจกเตอร์จอใหญ่ */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isFullscreen ? 'ย่อขนาดหน้าต่าง' : 'ขยายเต็มจอ (Projector Mode)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* ปุ่มปิด */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col items-center justify-center text-center gap-6">
          {/* ส่วนแสดงรหัส PIN 6 หลัก ขนาดยักษ์ */}
          <div className="w-full flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-[#6B7C93] dark:text-slate-400 uppercase tracking-wider">
              รหัส PIN 6 หลักสำหรับเข้าห้องสอบ
            </span>

            {/* กล่องตัวเลข 6 หลัก แยกช่องเด่นชัด */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
              {pinDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-[#F7FAFF] dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700/80 flex items-center justify-center text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-600/5 select-all"
                >
                  {digit}
                </div>
              ))}
            </div>

            {/* ปุ่มคัดลอก PIN */}
            <button
              onClick={handleCopyPin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-1.5 rounded-xl transition"
            >
              {isCopiedPin ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-extrabold">คัดลอกรหัส PIN แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกรหัส PIN ({roomPin})</span>
                </>
              )}
            </button>
          </div>

          {/* ส่วนแสดง QR Code ขนาดใหญ่ คมชัด */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-200/90 dark:border-slate-700 shadow-xl relative group">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ห้องสอบ ${roomPin}`}
                  className={`block rounded-2xl transition-all ${
                    isFullscreen ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-56 h-56 sm:w-64 sm:h-64'
                  }`}
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">กำลังสร้าง QR Code...</span>
                </div>
              )}
            </div>

            {/* ปุ่มดาวน์โหลด & คัดลอกลิงก์ */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>บันทึกรูป QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์ตรง</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* คำแนะนำสำหรับนักเรียน 3 ขั้นตอน */}
          <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 text-left text-xs space-y-1.5">
            <p className="font-extrabold text-[#163A66] dark:text-white flex items-center gap-1.5">
              <span>📱 วิธีเข้าร่วมสำหรับนักเรียน:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
              <li>ใช้กล้องมือถือสแกน QR Code บนจอ หรือเข้าหน้านักเรียนแล้วเลือกโหมด Arena</li>
              <li>กรอกรหัส PIN 6 หลัก (<strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{roomPin}</strong>)</li>
              <li>ระบบจะดึงชื่อ-เลขที่ของนักเรียนเข้าสู่ห้องสอบอัตโนมัติ</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>ห้องสอบพร้อมเชื่อมต่อแบบ Real-time</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition active:scale-95"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomQRCodeModal;
