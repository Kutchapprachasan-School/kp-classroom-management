import React, { useEffect, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Upload,
} from 'lucide-react';
import { sgsRosterAndSubmissionService } from '../../services/sgsRosterAndSubmissionService';
import { r2StorageService } from '../../services/r2StorageService';
import {
  resolveSubmissionMedia,
  getOfficeViewerUrls,
} from '../../utils/submissionPreviewUtils';

export interface ArtworkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  studentName: string;
  studentCode?: string;
  assignmentId?: string;
  classroom?: string;
  seatNo?: number;
  type: 'IMAGE' | 'PDF' | 'LINK' | 'TEXT';
  url?: string;
  externalLinkUrl?: string;
  textContent?: string;
  fileName?: string;
  platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'FIGMA' | 'YOUTUBE' | 'OTHER';
}

export const ArtworkPreviewModal: React.FC<ArtworkPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  studentName,
  studentCode = '-',
  assignmentId,
  classroom = 'ม.3/1',
  seatNo = 1,
  type,
  url,
  externalLinkUrl,
  textContent,
  fileName,
  platform,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [reminderSent, setReminderSent] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const [localFallbackUrl, setLocalFallbackUrl] = useState<string | null>(null);
  const [isUploadingReplacement, setIsUploadingReplacement] = useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FILE' | 'LINK' | 'TEXT'>('FILE');
  const [officeViewerEngine, setOfficeViewerEngine] = useState<'OFFICE' | 'GOOGLE'>('GOOGLE');
  const [showLinkEmbed, setShowLinkEmbed] = useState<boolean>(true);

  const targetAsgId = assignmentId || (url?.startsWith('asg-') ? url : undefined);
  const targetStuCode = studentCode !== '-' ? studentCode : undefined;

  const media = resolveSubmissionMedia({
    url,
    externalLinkUrl,
    assignmentId: targetAsgId,
    studentCode: targetStuCode,
    fileName,
    textContent,
    typeHint: type,
    platformHint: platform,
    localOverrideUrl: localFallbackUrl,
  });

  const {
    effectiveFileUrl,
    effectiveLinkUrl,
    inferredFileName,
    fileExtension,
    fileCategory,
    externalLinkInfo,
    hasFile,
    hasLink,
    hasText,
  } = media;

  // รีเซ็ตสถานะทุกครั้งที่เปลี่ยนชิ้นงานหรือนักเรียน
  useEffect(() => {
    setImgLoadError(false);
    setLocalFallbackUrl(null);
    setUploadSuccessToast(null);
    setZoomLevel(100);
    setRotation(0);
    setShowLinkEmbed(true);

    if (hasFile) {
      setActiveTab('FILE');
    } else if (hasLink) {
      setActiveTab('LINK');
    } else if (hasText) {
      setActiveTab('TEXT');
    } else {
      setActiveTab('FILE');
    }
  }, [url, externalLinkUrl, targetAsgId, targetStuCode, fileName, hasFile, hasLink, hasText]);

  if (!isOpen) return null;

  const handleImageError = () => {
    if (!localFallbackUrl) {
      const localDirect = sgsRosterAndSubmissionService.getSubmissionFileUrl(
        targetAsgId,
        targetStuCode,
        fileName || inferredFileName
      );
      if (localDirect && localDirect !== effectiveFileUrl) {
        setLocalFallbackUrl(localDirect);
        setImgLoadError(false);
        return;
      }
    }
    setImgLoadError(true);
  };

  const handleTeacherUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReplacement(true);
    try {
      const effectiveAsg = targetAsgId || 'asg-general';
      const effectiveStu = targetStuCode || 'student';
      const r2Key = r2StorageService.buildSubmissionKey({
        term: '2/2569',
        classroom: classroom || 'all',
        assignmentId: effectiveAsg,
        studentCode: effectiveStu,
        fileName: file.name,
      });

      const uploadRes = await r2StorageService.uploadFile(
        r2Key,
        file,
        file.type || 'application/octet-stream'
      );
      if (uploadRes.success && uploadRes.url) {
        setLocalFallbackUrl(uploadRes.url);
        setImgLoadError(false);
        setUploadSuccessToast('🎉 อัปโหลดไฟล์ผลงานขึ้น Cloudflare R2 เรียบร้อยแล้ว!');
        setTimeout(() => setUploadSuccessToast(null), 4000);

        sgsRosterAndSubmissionService.submitStudentWorkToR2({
          assignmentId: effectiveAsg,
          studentCode: effectiveStu,
          workTitle: title,
          fileName: file.name,
          fileDataUrl: uploadRes.url,
          classroom,
        });
      } else {
        alert('อัปโหลดไม่สำเร็จ: ' + (uploadRes.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message);
    } finally {
      setIsUploadingReplacement(false);
    }
  };

  const handleSendPermissionReminder = () => {
    setReminderSent(true);
    const reminderText = `แจ้งเตือนการส่งงาน: คุณครูไม่สามารถเข้าถึงไฟล์งาน '${title}' ได้ กรุณาเปิดสิทธิ์แชร์ใน Google Drive ให้คุณครูด้วยครับ`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reminderText).catch(() => {});
    }
    if (assignmentId && studentCode && studentCode !== '-') {
      sgsRosterAndSubmissionService.returnSubmissionForRevision(
        assignmentId,
        studentCode,
        'LINK_ACCESS_DENIED',
        `คุณครูเปิดดูลิงก์ Google Drive ของนักเรียนไม่ได้ (ติดสิทธิ์ Access Denied) กรุณาตั้งค่าการแชร์โฟลเดอร์เป็น "ทุกคนที่มีลิงก์ (Anyone with the link)" แล้วกดส่งงานอีกครั้งครับ`
      );
    }
    setTimeout(() => setReminderSent(false), 4500);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetView = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  const getFormatBadge = () => {
    if (activeTab === 'LINK' && externalLinkInfo) {
      return {
        label: externalLinkInfo.platformLabel.toUpperCase(),
        color: 'bg-teal-500 text-white',
        icon: <Link2 className="w-3.5 h-3.5" />,
      };
    }
    if (activeTab === 'TEXT') {
      return {
        label: 'TEXT RESPONSE',
        color: 'bg-blue-600 text-white',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    }
    if (fileCategory === 'PDF') {
      return {
        label: 'PDF DOCUMENT',
        color: 'bg-rose-600 text-white',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    }
    if (fileCategory === 'OFFICE') {
      return {
        label: `OFFICE (${(fileExtension || '.DOCX').replace('.', '').toUpperCase()})`,
        color: 'bg-blue-600 text-white',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    }
    if (fileCategory === 'VIDEO') {
      return {
        label: `VIDEO (${(fileExtension || '.MP4').replace('.', '').toUpperCase()})`,
        color: 'bg-purple-600 text-white',
        icon: <Sparkles className="w-3.5 h-3.5" />,
      };
    }
    if (fileCategory === 'AUDIO') {
      return {
        label: `AUDIO (${(fileExtension || '.MP3').replace('.', '').toUpperCase()})`,
        color: 'bg-amber-600 text-white',
        icon: <Sparkles className="w-3.5 h-3.5" />,
      };
    }
    if (fileCategory === 'ARCHIVE' || fileCategory === 'TEXT') {
      return {
        label: `FILE (${(fileExtension || 'ATTACHMENT').replace('.', '').toUpperCase()})`,
        color: 'bg-indigo-600 text-white',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: `${(fileExtension || '.WEBP').replace('.', '').toUpperCase()} IMAGE`,
      color: 'bg-teal-600 text-white',
      icon: <ImageIcon className="w-3.5 h-3.5" />,
    };
  };

  const badge = getFormatBadge();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 md:p-6 animate-fade-in font-sans text-white">
      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col bg-slate-900 rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl">
        {/* Top Bar: Student & Format Info + Quick Controls */}
        <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide flex items-center gap-1.5 shadow-sm shrink-0 ${badge.color}`}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {title}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-teal-300 border border-slate-700 shrink-0">
                  {inferredFileName}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                ผู้ส่ง: <span className="text-slate-200 font-bold">{studentName}</span> • เลขที่{' '}
                {seatNo} • ชั้น {classroom} • รหัส {studentCode}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {(effectiveFileUrl || effectiveLinkUrl) && (
              <a
                href={activeTab === 'LINK' ? effectiveLinkUrl || effectiveFileUrl : effectiveFileUrl || effectiveLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={activeTab === 'FILE' && effectiveFileUrl ? inferredFileName : undefined}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="เปิดหรือดาวน์โหลดไฟล์ในแท็บใหม่"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เปิด/ดาวน์โหลด ↗</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดหน้าต่าง Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: Multi-Channel Switcher + Zoom / Rotate / Viewer Engine */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Left: Multi-Channel Tabs (ไฟล์แนบ R2 / ลิงก์ภายนอก / ข้อความคำตอบ) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(hasFile || (!hasLink && !hasText)) && (
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'FILE'
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>📎 ไฟล์ผลงาน ({fileCategory === 'NONE' ? 'R2' : fileCategory})</span>
              </button>
            )}
            {hasLink && (
              <button
                type="button"
                onClick={() => setActiveTab('LINK')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'LINK'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-900/70 text-teal-300 hover:bg-slate-700 border border-teal-500/30'
                }`}
              >
                <span>{externalLinkInfo?.iconEmoji || '🔗'}</span>
                <span>ลิงก์แนบ ({externalLinkInfo?.platformLabel || 'External Link'})</span>
              </button>
            )}
            {hasText && (
              <button
                type="button"
                onClick={() => setActiveTab('TEXT')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'TEXT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/70 text-indigo-300 hover:bg-slate-700 border border-indigo-500/30'
                }`}
              >
                <span>✍️ ข้อความคำตอบ</span>
              </button>
            )}
          </div>

          {/* Right: Contextual Controls (Zoom/Rotate for Image, Viewer Toggle for Office/Link) */}
          <div className="flex items-center gap-2">
            {activeTab === 'FILE' && fileCategory === 'IMAGE' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="ย่อ (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-teal-300 px-2 min-w-[52px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="ขยาย (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="หมุนภาพ 90 องศา"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>หมุนภาพ ({rotation}°)</span>
                </button>
                {(zoomLevel !== 100 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>รีเซ็ต</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === 'FILE' && fileCategory === 'OFFICE' && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setOfficeViewerEngine('GOOGLE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    officeViewerEngine === 'GOOGLE'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google Docs Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setOfficeViewerEngine('OFFICE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    officeViewerEngine === 'OFFICE'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MS Office Viewer
                </button>
              </div>
            )}

            {activeTab === 'LINK' && externalLinkInfo?.canEmbed && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowLinkEmbed(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    showLinkEmbed ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🖥️ แสดงสดในหน้านี้ (Embed)
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkEmbed(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    !showLinkEmbed ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔗 ข้อมูลลิงก์ & ตั้งค่าสิทธิ์
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* PREVIEW CANVAS AREA                                                */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/95 relative select-none">
          {/* ================================================================ */}
          {/* TAB 1: TEXT CONTENT VIEWER                                       */}
          {/* ================================================================ */}
          {activeTab === 'TEXT' && hasText ? (
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                    ✍️ ข้อความคำตอบของนักเรียน
                  </span>
                  <span className="text-xs text-slate-400">({studentName})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(textContent || '');
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">คัดลอกข้อความแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>คัดลอกข้อความ</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto select-text">
                {textContent}
              </div>
            </div>
          ) : activeTab === 'LINK' && externalLinkInfo ? (
            /* ================================================================ */
            /* TAB 2: EXTERNAL LINK PREVIEW (YouTube, Drive, Docs, Canva, etc.) */
            /* ================================================================ */
            <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-4">
              {externalLinkInfo.canEmbed && showLinkEmbed && externalLinkInfo.embedUrl ? (
                <div className="w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                  <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{externalLinkInfo.iconEmoji}</span>
                      <span className="font-bold text-teal-300">{externalLinkInfo.platformLabel}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 truncate max-w-xs sm:max-w-md font-mono">
                        {externalLinkInfo.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {externalLinkInfo.platform === 'GOOGLE_DRIVE' && (
                        <button
                          type="button"
                          onClick={handleSendPermissionReminder}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-[11px] cursor-pointer"
                        >
                          {reminderSent ? '✓ แจ้งเตือนขอสิทธิ์แล้ว' : '⚠️ ติดสิทธิ์? แจ้งนักเรียน'}
                        </button>
                      )}
                      <a
                        href={externalLinkInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>เปิดต้นฉบับในแท็บใหม่ ↗</span>
                      </a>
                    </div>
                  </div>
                  <iframe
                    src={externalLinkInfo.embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-[68vh] bg-white border-0"
                  />
                </div>
              ) : (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-6 sm:p-8 max-w-xl w-full mx-auto text-white space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center text-2xl shadow-lg">
                      {externalLinkInfo.iconEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base sm:text-lg text-white">
                          {externalLinkInfo.platformLabel}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {externalLinkInfo.platform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ผลงานของ {studentName} (เลขที่ {seatNo} • ชั้น {classroom})
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      ลิงก์ชิ้นงานที่นักเรียนส่ง:
                    </span>
                    <a
                      href={externalLinkInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-teal-300 hover:underline break-all select-all block"
                    >
                      {externalLinkInfo.url}
                    </a>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <a
                      href={externalLinkInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>เปิดดูชิ้นงานบน {externalLinkInfo.platformLabel} ในแท็บใหม่ ↗</span>
                    </a>

                    {(externalLinkInfo.platform === 'GOOGLE_DRIVE' ||
                      externalLinkInfo.platform === 'GOOGLE_DOCS') && (
                      <button
                        type="button"
                        onClick={handleSendPermissionReminder}
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          reminderSent
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <span>⚠️</span>
                        <span>
                          {reminderSent
                            ? '✓ ส่งแจ้งเตือนขอสิทธิ์แชร์ให้นักเรียนเรียบร้อยแล้ว'
                            : 'ติดปัญหาเปิดไม่ได้ (Access Denied)? กดแจ้งเตือนขอสิทธิ์แชร์'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================================================================ */
            /* TAB 3: UPLOADED FILE PREVIEW (IMAGE, PDF, OFFICE, VIDEO, AUDIO)  */
            /* ================================================================ */
            <div className="w-full max-w-5xl flex flex-col items-center justify-center">
              {effectiveFileUrl && !imgLoadError ? (
                fileCategory === 'PDF' ? (
                  <div className="w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                    <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold truncate">📄 {inferredFileName}</span>
                      <a
                        href={effectiveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>เปิด PDF เต็มหน้าต่าง ↗</span>
                      </a>
                    </div>
                    <iframe
                      src={effectiveFileUrl}
                      title={inferredFileName}
                      className="w-full h-[72vh] bg-white border-0"
                    />
                  </div>
                ) : fileCategory === 'OFFICE' ? (
                  (() => {
                    const { officeEmbedUrl, googleEmbedUrl } = getOfficeViewerUrls(effectiveFileUrl);
                    const activeEmbed =
                      officeViewerEngine === 'OFFICE' ? officeEmbedUrl : googleEmbedUrl;
                    return (
                      <div className="w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-200 font-bold truncate">
                            📘 เอกสาร Office: {inferredFileName}
                          </span>
                          <a
                            href={effectiveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={inferredFileName}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ดาวน์โหลดไฟล์ต้นฉบับ ⬇</span>
                          </a>
                        </div>
                        <iframe
                          src={activeEmbed}
                          title={inferredFileName}
                          className="w-full h-[70vh] bg-white border-0"
                        />
                      </div>
                    );
                  })()
                ) : fileCategory === 'VIDEO' ? (
                  <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl p-4 space-y-3">
                    <video
                      src={effectiveFileUrl}
                      controls
                      playsInline
                      preload="metadata"
                      onError={handleImageError}
                      className="w-full max-h-[68vh] rounded-xl bg-black"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                      <span className="font-bold truncate">🎬 {inferredFileName}</span>
                      <a
                        href={effectiveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-300 hover:underline font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดวิดีโอในแท็บใหม่ ↗</span>
                      </a>
                    </div>
                  </div>
                ) : fileCategory === 'AUDIO' ? (
                  <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center text-3xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white break-all">{inferredFileName}</h3>
                      <p className="text-xs text-slate-400 mt-1">ไฟล์เสียงผลงานของ {studentName}</p>
                    </div>
                    <audio
                      src={effectiveFileUrl}
                      controls
                      preload="metadata"
                      onError={handleImageError}
                      className="w-full"
                    />
                  </div>
                ) : fileCategory === 'ARCHIVE' || fileCategory === 'TEXT' ? (
                  <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 mx-auto flex items-center justify-center text-3xl">
                      📦
                    </div>
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                        ไฟล์แนบ {(fileExtension || '').toUpperCase() || 'ATTACHMENT'}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white break-all pt-1">
                        {inferredFileName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        อัปโหลดบน Cloudflare R2 เรียบร้อยแล้ว • พร้อมเปิดหรือดาวน์โหลด
                      </p>
                    </div>
                    <a
                      href={effectiveFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={inferredFileName}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg w-full"
                    >
                      <Download className="w-4 h-4" />
                      <span>เปิดดู / ดาวน์โหลดไฟล์ ({inferredFileName}) ⬇</span>
                    </a>
                  </div>
                ) : (
                  <div
                    className="transition-transform duration-200 origin-center max-w-4xl max-h-[75vh] flex items-center justify-center"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={effectiveFileUrl}
                      alt={inferredFileName}
                      onError={handleImageError}
                      className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-slate-700/60 bg-slate-900"
                    />
                  </div>
                )
              ) : (
                /* Clean file status card conforming to Strict Zero Mock Policy */
                <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-2xl text-white max-w-lg w-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-inner">
                    🖼️
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                      ไฟล์ชิ้นงานนักเรียน
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white break-all">
                      {inferredFileName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ผลงานของ: <span className="text-teal-300 font-semibold">{studentName}</span> (เลขที่{' '}
                      {seatNo} • ชั้น {classroom} • รหัส {studentCode})
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs">
                    {uploadSuccessToast ? (
                      <div className="text-emerald-400 flex items-start gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{uploadSuccessToast}</span>
                      </div>
                    ) : (
                      <div className="text-amber-300 flex items-start gap-2">
                        <span className="shrink-0 text-base">⚠️</span>
                        <div className="space-y-1">
                          <p className="font-bold text-amber-200">
                            ไม่พบไฟล์ต้นฉบับบน Cloudflare R2
                          </p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            นักเรียนอาจส่งงานนี้ไว้ในเครื่องก่อนเชื่อมระบบคลาวด์ หรือยังไม่ได้แนบไฟล์ คุณครูสามารถอัปโหลดไฟล์ผลงานแทนนักเรียน (รองรับรูปภาพ, PDF, Word, Excel, PowerPoint, วิดีโอ) ได้ทันทีด้านล่างครับ
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md w-full cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>
                        {isUploadingReplacement
                          ? '⏳ กำลังอัปโหลดขึ้น Cloudflare R2...'
                          : '📤 อัปโหลดไฟล์ผลงานแทนนักเรียน (ขึ้น Cloudflare R2)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                        disabled={isUploadingReplacement}
                        onChange={handleTeacherUploadFile}
                        className="hidden"
                      />
                    </label>

                    {effectiveFileUrl && !effectiveFileUrl.startsWith('data:') && (
                      <a
                        href={effectiveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors w-full border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ลองเปิดลิงก์ไฟล์โดยตรงในแท็บใหม่ ↗</span>
                      </a>
                    )}

                    {effectiveLinkUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('LINK')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md w-full cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>สลับไปดูลิงก์ผลงานที่นักเรียนแนบ ↗</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="font-semibold text-slate-300">
              รองรับการพรีวิวทุกประเภทไฟล์ (รูปภาพ, PDF, Word/Excel/PPT, วิดีโอ/เสียง) และลิงก์ภายนอก (Drive, Canva, YouTube, Figma)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md"
            >
              ปิดหน้าต่าง Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
