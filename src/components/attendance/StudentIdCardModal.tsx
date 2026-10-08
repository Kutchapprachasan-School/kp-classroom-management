// src/components/attendance/StudentIdCardModal.tsx
// หน้าต่างแสดงบัตรประจำตัวนักเรียนดิจิทัล พร้อม QR Code สำหรับให้ครูสแกน
// ดีไซน์ Pastel Anime Student Badge น่ารัก สะอาดตา

import React, { useState, useEffect } from 'react';
import { X, QrCode } from 'lucide-react';
import { qrAttendanceService } from '../../services/qrAttendanceService';

export interface StudentIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentCode: string;
  studentName: string;
  classroomLabel: string;
  classroomId: string;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  isOpen,
  onClose,
  studentCode,
  studentName,
  classroomLabel,
  classroomId,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !studentCode) return;

    const payload = qrAttendanceService.generateStudentCardPayload(
      studentCode,
      studentName,
      classroomId,
      classroomLabel
    );

    qrAttendanceService.generateQrDataUrl(payload).then(setQrUrl);
  }, [isOpen, studentCode, studentName, classroomId, classroomLabel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-fade-in select-none">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Card Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/70">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              บัตรประจำตัวนักเรียนดิจิทัล
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Badge Visual */}
        <div className="p-6 text-center space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-50/90 via-white to-sky-50/50 border-2 border-blue-200/90 shadow-md flex flex-col items-center space-y-3">
            {/* School Header */}
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                โรงเรียนกุดจับประชาสรรค์
              </p>
              <p className="text-[9px] text-slate-400 font-semibold">
                STUDENT IDENTIFICATION BADGE
              </p>
            </div>

            {/* Avatar */}
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${studentCode}`}
                alt={studentName}
                className="w-20 h-20 rounded-2xl bg-white border-2 border-blue-300 shadow-xs object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                ✓
              </span>
            </div>

            {/* Info */}
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-slate-900">{studentName}</h4>
              <p className="text-xs font-mono font-bold text-blue-700">รหัส {studentCode}</p>
              <p className="text-[11px] text-slate-500 font-medium">ห้องเรียน {classroomLabel}</p>
            </div>

            {/* Crisp QR Code */}
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-inner">
              {qrUrl ? (
                <img src={qrUrl} alt={`QR Code ${studentCode}`} className="w-36 h-36 object-contain" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR...
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              ใช้สำหรับให้คุณครูสแกนเช็คชื่อแถวเช้าและคาบเรียน
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
