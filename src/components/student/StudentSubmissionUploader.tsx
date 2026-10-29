import React, { useState, useRef } from 'react';
import {
  uploadToR2WithProgress,
  validateSubmissionFile,
  type UploadProgressInfo,
} from '../../services/cloudDataService';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

// ฟังก์ชันช่วยแปลงขนาดไฟล์เป็น KB / MB อ่านง่ายๆ
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${Math.round(kb)} KB`;
};

export interface StudentSubmissionUploaderProps {
  onUploadSuccess?: (url: string) => void;
  assignmentId?: string;
  classroom?: string;
}

export const StudentSubmissionUploader: React.FC<StudentSubmissionUploaderProps> = ({
  onUploadSuccess,
  assignmentId = 'asg-001',
  classroom = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cleanFileName, setCleanFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo>({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
  });
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ตรวจสอบไฟล์ทันทีที่นักเรียนเลือกไฟล์จากเครื่อง (Client-side Validation)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setUploadedUrl(null);

    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setCleanFileName('');
      return;
    }

    const validation = validateSubmissionFile(file);

    if (!validation.valid) {
      // หากไม่ผ่านเกณฑ์ ให้แสดงข้อความแจ้งเตือนและล้างค่าในช่อง input ทันที
      setErrorMsg(validation.error || 'ไฟล์ไม่ถูกต้อง');
      setSelectedFile(null);
      setCleanFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setCleanFileName(validation.sanitizedName || file.name);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadedUrl(null);
    setProgressInfo({ percent: 0, loadedBytes: 0, totalBytes: selectedFile.size });

    try {
      const r2Key = `ภาคเรียนที่-2-2569/${classroom}/${assignmentId}/${Date.now()}_${cleanFileName || selectedFile.name}`;

      const finalUrl = await uploadToR2WithProgress(r2Key, selectedFile, (info) => {
        setProgressInfo(info);
      });

      setUploadedUrl(finalUrl);
      if (onUploadSuccess) {
        onUploadSuccess(finalUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งงาน');
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
          รองรับรูปภาพ, PDF, Word, Excel, PowerPoint, วิดีโอ (MP4), เสียง (MP3) และไฟล์ ZIP
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv,.rtf,.md,.json,.zip,.rar,.7z"
        disabled={isUploading}
        onChange={handleFileChange}
        className="block w-full text-xs text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#3B82F6] hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
      />

      {/* แสดงข้อมูลไฟล์เมื่อผ่านการตรวจสอบแล้ว */}
      {selectedFile && !errorMsg && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-700 border border-slate-200">
          <span className="truncate font-medium max-w-[70%]">{cleanFileName}</span>
          <span className="text-[#6B7C93] font-mono text-[11px]">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      )}

      {/* แถบ Progress Bar แสดงขณะกำลังอัปโหลด */}
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

          <div className="text-right text-[11px] text-[#94A3B8]">
            {formatBytes(progressInfo.loadedBytes)} / {formatBytes(progressInfo.totalBytes)}
          </div>
        </div>
      )}

      {/* แจ้งเตือนเมื่ออัปโหลดสำเร็จ */}
      {uploadedUrl && !isUploading && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ส่งงานสำเร็จครบ 100% คุณครูสามารถเปิดตรวจได้ทันที</span>
        </div>
      )}

      {/* แจ้งเตือนเมื่อเกิดข้อผิดพลาด หรือไฟล์ไม่ผ่านเกณฑ์ */}
      {errorMsg && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="mt-4 w-full rounded-xl bg-[#3B82F6] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer"
      >
        {isUploading ? `กำลังอัปโหลด (${progressInfo.percent}%)...` : 'ส่งงาน'}
      </button>
    </div>
  );
};

export const ValidatedStudentUploader = StudentSubmissionUploader;
export { StudentSubmissionWithPreview } from './StudentSubmissionWithPreview';

