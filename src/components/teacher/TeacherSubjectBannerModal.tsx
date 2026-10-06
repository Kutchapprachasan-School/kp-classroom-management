// src/components/teacher/TeacherSubjectBannerModal.tsx
// หน้าต่างอัปโหลดและปรับแต่งแบนเนอร์ประจำวิชาของครู (Teacher Subject Banner Upload Modal)
// สไตล์ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// พร้อมระบบ Canvas Image Resizer & Compressor อัตโนมัติ (< 150 KB, ไม่ทำให้ภาพแตก)

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  compressSubjectBannerImage,
  type CompressedImageResult,
  formatBytes,
} from '../../utils/imageCompressor';

export interface TeacherSubjectBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  courseName: string;
  currentBannerUrl?: string | null;
  onBannerSaved?: (newBannerUrl: string | null) => void;
}

export const getSubjectBannerStorageKey = (code: string) =>
  `kp_subject_banner_${(code || 'general').trim().toLowerCase()}`;

export const getSubjectBannerUrl = (code: string, fallbackUrl?: string): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(getSubjectBannerStorageKey(code));
      if (stored) return stored;
    } catch {
      // ignore
    }
  }
  return fallbackUrl || '/images/teacher/hero_banner.png';
};

export const TeacherSubjectBannerModal: React.FC<TeacherSubjectBannerModalProps> = ({
  isOpen,
  onClose,
  courseCode,
  courseName,
  currentBannerUrl,
  onBannerSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressedImageResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (เช่น JPG, PNG, WEBP)');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setIsCompressing(true);

    try {
      const result = await compressSubjectBannerImage(file, {
        maxWidth: 1200,
        maxHeight: 400,
        maxSizeBytes: 153600, // 150 KB
        initialQuality: 0.85,
      });
      setCompressionResult(result);
    } catch (err) {
      console.error('Compression error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = () => {
    if (!compressionResult) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          getSubjectBannerStorageKey(courseCode),
          compressionResult.dataUrl
        );
        window.dispatchEvent(
          new CustomEvent('kps-subject-banner-updated', {
            detail: { courseCode, bannerUrl: compressionResult.dataUrl },
          })
        );
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }

    onBannerSaved?.(compressionResult.dataUrl);
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('ต้องการคืนค่าแบนเนอร์วิชานี้เป็นภาพเริ่มต้นหรือไม่?')) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(getSubjectBannerStorageKey(courseCode));
        window.dispatchEvent(
          new CustomEvent('kps-subject-banner-updated', {
            detail: { courseCode, bannerUrl: null },
          })
        );
      }
      onBannerSaved?.(null);
      onClose();
    }
  };

  const activePreviewUrl =
    compressionResult?.dataUrl ||
    currentBannerUrl ||
    getSubjectBannerUrl(courseCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-linear-to-r from-blue-50/70 via-white to-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                อัปโหลดแบนเนอร์รายวิชา
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {courseCode} {courseName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Banner Live Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">ภาพตัวอย่างแบนเนอร์</span>
              {compressionResult && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ย่อขนาดสำเร็จ</span>
                </span>
              )}
            </div>

            <div className="w-full h-36 sm:h-44 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100 flex items-center justify-center">
              {activePreviewUrl ? (
                <img
                  src={activePreviewUrl}
                  alt="Subject Banner Preview"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="text-center text-slate-400 p-4">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">ยังไม่มีภาพแบนเนอร์</span>
                </div>
              )}

              {/* Watermark/Overlay tag */}
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold">
                {courseCode} • {courseName}
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/70 transition-all cursor-pointer text-center space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกรูปภาพแบนเนอร์ใหม่
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                รองรับไฟล์ PNG, JPG, WebP (ระบบจะย่อขนาดให้อัตโนมัติเพื่อไม่ให้ภาพแตกและไม่หน่วงระบบ)
              </p>
            </div>
          </div>

          {/* Loading Indicator */}
          {isCompressing && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 animate-pulse">
              <Zap className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="text-xs text-blue-800 font-bold">
                กำลังปรับขนาดและบีบอัดภาพด้วยเทคโนโลยี High Smoothing Canvas...
              </div>
            </div>
          )}

          {/* Compression Stats Card */}
          {compressionResult && selectedFile && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Sparkles className="w-4 h-4" />
                  <span>ผลลัพธ์การปรับแต่งอัจฉริยะ</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                  ลดขนาดลง {compressionResult.compressionRatio}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">ขนาดไฟล์เดิม</span>
                  <span className="font-bold text-slate-700">{formatBytes(selectedFile.size)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">ขนาดหลังบีบอัด</span>
                  <span className="font-extrabold text-emerald-600">
                    {formatBytes(compressionResult.sizeBytes)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  มิติภาพ: {compressionResult.width} × {compressionResult.height} px (คมชัดสูง ไม่แตก และไม่เกิน 150 KB)
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="คืนค่าแบนเนอร์เริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-white cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!compressionResult || isCompressing}
              className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                compressionResult && !isCompressing
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>บันทึกแบนเนอร์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
