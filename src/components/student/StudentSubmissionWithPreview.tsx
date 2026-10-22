import React, { useState, useEffect, useRef } from 'react';
import {
  validateSubmissionFile,
  uploadToR2WithProgress,
  type UploadProgressInfo,
} from '../../services/cloudDataService';
import { Upload, CheckCircle2, AlertCircle, FileText, ExternalLink, RefreshCw } from 'lucide-react';

// ฟังก์ชันแปลงขนาดไฟล์เป็น MB ที่อ่านง่าย
export function formatFileSizeMB(bytes: number): string {
  if (bytes === 0) return '0.00 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export interface StudentSubmissionWithPreviewProps {
  onUploadSuccess?: (url: string) => void;
  assignmentId?: string;
  classroom?: string;
  academicYearTerm?: string;
}

export const StudentSubmissionWithPreview: React.FC<StudentSubmissionWithPreviewProps> = ({
  onUploadSuccess,
  assignmentId = 'asg-001',
  classroom = 'm3-1',
  academicYearTerm = 'ภาคเรียนที่-2-2569',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cleanFileName, setCleanFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileTypeCategory, setFileTypeCategory] = useState<'image' | 'pdf' | 'doc' | 'other'>('other');

  const [isUploading, setIsUploading] = useState(false);
  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo>({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
  });

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // คืนค่าหน่วยความจำ (Memory Cleanup) ทุกครั้งที่เปลี่ยนไฟล์หรือปิดหน้าเว็บ เพื่อไม่ให้กินแรมมือถือ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ล้างไฟล์ที่เลือกไว้เพื่อให้นักเรียนเลือกไฟล์ใหม่
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCleanFileName('');
    setFileTypeCategory('other');
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // เมื่อนักเรียนเลือกไฟล์จากมือถือหรือคอมพิวเตอร์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedUrl(null);
    setErrorMsg(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // 1. ตรวจสอบขนาดและนามสกุลไฟล์ก่อนสร้าง Preview
    const validation = validateSubmissionFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'ไฟล์ไม่ผ่านเกณฑ์ที่กำหนด');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    // 2. แยกประเภทไฟล์เพื่อเลือกวิธีแสดง Preview (ไม่เปลืองแรมด้วย Object URL)
    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isImage = validation.category === 'image' || file.type.startsWith('image/');

    if (isImage) {
      setFileTypeCategory('image');
      setPreviewUrl(URL.createObjectURL(file));
    } else if (isPdf) {
      setFileTypeCategory('pdf');
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFileTypeCategory('doc');
      setPreviewUrl(null);
    }

    setSelectedFile(file);
    setCleanFileName(validation.sanitizedName || file.name);
  };

  // เปิดดูไฟล์ตัวอย่างแบบเต็มจอในแท็บใหม่
  const handleOpenFullscreenPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // กดยืนยันส่งงานขึ้น Cloudflare R2
  const handleConfirmUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setErrorMsg(null);
    setProgressInfo({ percent: 0, loadedBytes: 0, totalBytes: selectedFile.size });

    try {
      const r2Key = `${academicYearTerm}/${classroom}/${assignmentId}/${Date.now()}_${cleanFileName}`;
      const finalUrl = await uploadToR2WithProgress(r2Key, selectedFile, (info) => {
        setProgressInfo(info);
      });

      setUploadedUrl(finalUrl);
      if (onUploadSuccess) {
        onUploadSuccess(finalUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md rounded-2xl border border-[#E6EEF7] bg-white p-5 shadow-sm font-['Prompt',sans-serif]">
      <div className="mb-3">
        <label className="block text-sm font-semibold text-[#163A66]">
          แนบไฟล์ผลงานนักเรียน
        </label>
        <p className="text-xs text-[#6B7C93] mt-0.5">
          รองรับรูปภาพ (.jpg, .png, .webp ไม่เกิน 5 MB) และเอกสาร (.pdf, .docx ไม่เกิน 15 MB)
        </p>
      </div>

      {/* ช่องเลือกไฟล์ (ซ่อนเมื่อเลือกไฟล์แล้ว เพื่อให้หน้าต่าง Preview ดูสะอาดตา) */}
      {!selectedFile && (
        <label className="block p-5 bg-[#F7FAFF] border-2 border-dashed border-[#BFDBFE] hover:border-[#3B82F6] rounded-2xl text-center space-y-2 cursor-pointer transition-colors group">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3B82F6] group-hover:scale-110 flex items-center justify-center mx-auto transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#163A66] block text-xs sm:text-sm">
              📷 ถ่ายภาพ หรือ 📁 คลิกเพื่อเลือกไฟล์
            </span>
            <span className="text-[11px] text-[#6B7C93] mt-0.5 block">
              ระบบจะแสดงตัวอย่างผลงานก่อนส่งจริง
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,.doc,.docx"
            disabled={isUploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* ส่วนแสดงตัวอย่างไฟล์ (Preview Box) ก่อนกดยืนยันส่งงาน */}
      {selectedFile && (
        <div className="mt-2 rounded-2xl border border-[#E6EEF7] bg-[#F7FAFF] p-3.5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#163A66] flex items-center gap-1.5">
              <span>🖼️ ตรวจสอบตัวอย่างไฟล์ก่อนส่ง</span>
            </span>
            {!isUploading && !uploadedUrl && (
              <button
                type="button"
                onClick={handleClearFile}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>เปลี่ยนไฟล์ / ลบออก</span>
              </button>
            )}
          </div>

          {/* 1. กรณีเป็นไฟล์รูปภาพ: แสดง Image Preview */}
          {fileTypeCategory === 'image' && previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
              <img
                src={previewUrl}
                alt="ตัวอย่างผลงานนักเรียน"
                className="mx-auto max-h-64 w-full object-contain p-1.5 bg-slate-900/5"
              />
              <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">ภาพไม่เบลอ ไม่กลับหัว</span>
                <button
                  type="button"
                  onClick={handleOpenFullscreenPreview}
                  className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ขยายดูภาพขนาดเต็ม</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. กรณีเป็นไฟล์ PDF: แสดง PDF Preview ใน iframe พร้อมปุ่มเปิดเต็มจอ */}
          {fileTypeCategory === 'pdf' && previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
              <iframe
                src={previewUrl}
                title="ตัวอย่างไฟล์ PDF"
                className="h-64 w-full border-0"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-[11px] text-slate-500">
                  หากมือถือไม่แสดงพรีวิว กดปุ่มเปิดดูได้ครับ
                </span>
                <button
                  type="button"
                  onClick={handleOpenFullscreenPreview}
                  className="shrink-0 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#3B82F6] hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📄 เปิดดู PDF เต็มจอ</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. กรณีเป็นไฟล์ Word (.doc, .docx): แสดงการ์ดข้อมูลเอกสาร */}
          {fileTypeCategory === 'doc' && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3.5 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-lg font-black text-[#3B82F6]">
                W
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#163A66]">
                  ไฟล์เอกสาร Microsoft Word
                </p>
                <p className="text-[11px] text-[#6B7C93]">
                  พร้อมสำหรับอัปโหลดขึ้น Cloudflare R2
                </p>
              </div>
            </div>
          )}

          {/* แถบแสดงชื่อไฟล์และขนาดไฟล์ */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
            <span className="truncate font-semibold text-[#163A66] max-w-[70%]">{cleanFileName}</span>
            <span className="shrink-0 font-mono text-slate-400 text-[11px]">{formatFileSizeMB(selectedFile.size)}</span>
          </div>
        </div>
      )}

      {/* หลอด Progress Bar ขณะกำลังอัปโหลดขึ้น R2 */}
      {isUploading && (
        <div className="mt-4 space-y-1.5 animate-fade-in">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-[#163A66]">
              <Upload className="w-3.5 h-3.5 text-[#3B82F6] animate-bounce" />
              <span>กำลังส่งงานขึ้นระบบคลาวด์...</span>
            </span>
            <span className="font-bold text-[#3B82F6]">{progressInfo.percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-150 ease-out ${
                progressInfo.percent === 100 ? 'bg-emerald-500' : 'bg-[#3B82F6]'
              }`}
              style={{ width: `${progressInfo.percent}%` }}
            />
          </div>
          <div className="text-right text-[11px] font-mono text-[#94A3B8]">
            {formatFileSizeMB(progressInfo.loadedBytes)} / {formatFileSizeMB(progressInfo.totalBytes)}
          </div>
        </div>
      )}

      {/* กล่องข้อความแจ้งเตือนเมื่อไฟล์ไม่ผ่านเกณฑ์ หรืออัปโหลดไม่สำเร็จ */}
      {errorMsg && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* กล่องแจ้งเตือนเมื่อส่งงานเสร็จสมบูรณ์ */}
      {uploadedUrl && !isUploading && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ส่งงานสำเร็จครบ 100% คุณครูสามารถเปิดตรวจผลงานได้ทันทีครับ</span>
        </div>
      )}

      {/* ปุ่มยืนยันการส่งงาน */}
      <button
        type="button"
        onClick={handleConfirmUpload}
        disabled={!selectedFile || isUploading || Boolean(uploadedUrl)}
        className="mt-4 w-full rounded-xl bg-[#3B82F6] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer"
      >
        {isUploading
          ? `กำลังอัปโหลด (${progressInfo.percent}%)...`
          : uploadedUrl
          ? 'ส่งงานเรียบร้อยแล้ว'
          : 'ยืนยันการส่งงาน'}
      </button>
    </div>
  );
};
