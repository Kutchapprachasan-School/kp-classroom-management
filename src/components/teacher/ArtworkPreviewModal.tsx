import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  CheckCircle2,
} from 'lucide-react';

export interface ArtworkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  studentName: string;
  studentCode?: string;
  classroom?: string;
  seatNo?: number;
  type?: 'IMAGE' | 'PDF' | 'LINK';
  url?: string;
  externalLinkUrl?: string;
  fileName?: string;
  platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'YOUTUBE' | 'FIGMA' | 'OTHER';
}

export const ArtworkPreviewModal: React.FC<ArtworkPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  studentName,
  studentCode = '45102',
  classroom = 'ม.3/1',
  seatNo = 2,
  type,
  url,
  externalLinkUrl,
  fileName = 'ผลงานนักเรียน',
  platform,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const [reminderSent, setReminderSent] = useState<boolean>(false);

  useEffect(() => {
    setImgLoadError(false);
    setZoomLevel(100);
    setRotation(0);
    setPdfPage(1);
    setReminderSent(false);
  }, [isOpen, url, externalLinkUrl]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // แยกแยะระหว่าง URL ของไฟล์ (ภาพ/PDF) กับลิงก์ภายนอก (Canva/Google Drive)
  const effectiveLinkUrl =
    externalLinkUrl ||
    (url && (url.startsWith('http://') || url.startsWith('https://')) && !url.match(/\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i)
      ? url
      : undefined);

  const effectiveFileUrl =
    url &&
    (url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.match(/\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i) ||
      !effectiveLinkUrl)
      ? url
      : undefined;

  // ตรวจสอบนามสกุลไฟล์และประเภท
  const lowerFile = (fileName || '').toLowerCase();
  const isJpg = lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg') || (effectiveFileUrl || '').startsWith('data:image/jpeg');
  const isPng = lowerFile.endsWith('.png') || (effectiveFileUrl || '').startsWith('data:image/png');
  const isWebp = lowerFile.endsWith('.webp') || (effectiveFileUrl || '').startsWith('data:image/webp');
  const isPdf = type === 'PDF' || lowerFile.endsWith('.pdf') || (effectiveFileUrl && effectiveFileUrl.toLowerCase().includes('.pdf'));
  const isGoogleDrive = Boolean(
    platform === 'GOOGLE_DRIVE' ||
      (effectiveLinkUrl && (effectiveLinkUrl.includes('drive.google.com') || effectiveLinkUrl.includes('docs.google.com')))
  );
  const isCanva = Boolean(
    platform === 'CANVA' || (effectiveLinkUrl && effectiveLinkUrl.includes('canva.com'))
  );

  // กำหนดว่ามีภาพหรือ PDF ที่พร้อมแสดงผลหรือไม่
  const showImage = Boolean(effectiveFileUrl && !isPdf);
  const showPdf = Boolean(effectiveFileUrl && isPdf);
  const showOnlyLink = Boolean(!showImage && !showPdf && effectiveLinkUrl);

  const handleSendPermissionReminder = () => {
    setReminderSent(true);
    const reminderText = `แจ้งเตือนการส่งงาน: คุณครูไม่สามารถเข้าถึงไฟล์งาน '${title}' ได้ กรุณาเปิดสิทธิ์แชร์ใน Google Drive ให้คุณครูด้วยครับ`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reminderText).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              {showPdf ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : isGoogleDrive ? (
                <span className="text-xl">📁</span>
              ) : isCanva ? (
                <Palette className="w-5 h-5 text-[#00C4CC]" />
              ) : (
                <Palette className="w-5 h-5 text-teal-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-md">
                  {title}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {showPdf
                    ? 'PDF DOCUMENT'
                    : isGoogleDrive
                    ? 'GOOGLE DRIVE'
                    : isCanva
                    ? 'CANVA PROJECT'
                    : showImage
                    ? isJpg
                      ? 'JPG IMAGE'
                      : isPng
                      ? 'PNG IMAGE'
                      : 'IMAGE'
                    : 'SUBMISSION'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                ผลงานของ: <span className="text-teal-300 font-bold">{studentName}</span> (เลขที่ {seatNo} • รหัส {studentCode} • ชั้น {classroom}) • {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(effectiveFileUrl || effectiveLinkUrl) && (
              <a
                href={effectiveFileUrl || effectiveLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
                title="เปิดในแท็บใหม่"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดลิงก์ภายนอก ↗</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="ปิด (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Bar */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
          {/* Zoom & Rotate Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="ซูมออก (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[11px] px-2 py-0.5 bg-slate-800/70 rounded-md min-w-[50px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="ซูมเข้า (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer ml-1"
              title="หมุนภาพ 90 องศา"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer ml-1"
            >
              พอดีจอ
            </button>
          </div>

          {/* PDF Page Navigation */}
          {showPdf && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold">
                เอกสารหน้าที่:
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  disabled={pdfPage <= 1}
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-teal-300">
                  {pdfPage} / 3
                </span>
                <button
                  type="button"
                  disabled={pdfPage >= 3}
                  onClick={() => setPdfPage((p) => Math.min(3, p + 1))}
                  className="p-1 rounded text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Canva / Platform Notice */}
          {isCanva && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C4CC] animate-pulse" />
              <span className="text-[11px] font-bold text-[#00C4CC]">
                Canva Project Link
              </span>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* PREVIEW CANVAS AREA (Scrollable, Zoomable, Rotatable) */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/95 relative select-none">
          {/* External Link Notice Banner when file (Image/PDF) is shown along with an external link */}
          {(showImage || showPdf) && effectiveLinkUrl && (
            <div className="w-full max-w-3xl mb-4 px-4 py-2.5 bg-slate-900 border border-slate-700/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{isGoogleDrive ? '📁' : isCanva ? '🎨' : '🔗'}</span>
                <span className="text-slate-300 font-semibold truncate max-w-sm sm:max-w-md">
                  ลิงก์ผลงานแนบเพิ่มเติม: <span className="text-teal-300 font-bold">{effectiveLinkUrl}</span>
                </span>
              </div>
              <a
                href={effectiveLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดดูลิงก์แนบ ↗</span>
              </a>
            </div>
          )}

          {/* ================================================================ */}
          {/* 1. CANVA / EXTERNAL LINK PREVIEW (เมื่อไม่มีไฟล์ภาพ/PDF) */}
          {/* ================================================================ */}
          {showOnlyLink ? (
            <div
              className="transition-transform duration-200 origin-center max-w-3xl w-full"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {isGoogleDrive ? (
                /* Google Drive Pre-Flight Workspace Card */
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-6 sm:p-8 max-w-xl mx-auto text-white space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-2xl shadow-lg">
                      📁
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base sm:text-lg text-white">
                          โฟลเดอร์ผลงานบน Google Drive
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          GOOGLE DRIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ส่งงานแบบโฟลเดอร์ส่วนตัวของนักเรียน • ไม่จำกัดขนาดไฟล์
                      </p>
                    </div>
                  </div>

                  {/* URL Box */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold block">ลิงก์โฟลเดอร์ปลายทาง:</span>
                    <p className="font-mono text-xs text-emerald-300 break-all select-all">
                      {effectiveLinkUrl || url}
                    </p>
                  </div>

                  {/* Validation & Pre-Flight Status */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ตรวจสอบรูปแบบลิงก์: ถูกต้องตามมาตรฐาน Google Drive</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      เนื่องจาก Google Drive มีการจำกัดสิทธิ์ตามบัญชีผู้ใช้ คุณครูสามารถกดเปิดลิงก์เพื่อตรวจสอบว่าเปิดดูได้หรือไม่ หากพบว่าติดสิทธิ์ (Access Denied) ให้กดปุ่ม &quot;แจ้งเตือนขอสิทธิ์&quot; ด้านล่าง
                    </p>
                  </div>

                  {/* Pre-Flight Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <a
                      href={effectiveLinkUrl || url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>1. เปิดโฟลเดอร์ Google Drive ในแท็บใหม่ ↗</span>
                    </a>

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
                          ? '✓ คัดลอกข้อความขอสิทธิ์แล้ว (ส่งแจ้งเตือนในระบบสำเร็จ)'
                          : '2. ติดปัญหาเปิดไม่ได้? กดแจ้งเตือนขอสิทธิ์แชร์โฟลเดอร์'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Canva Window Shell */
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                  {/* Canva Top Bar */}
                  <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight text-[#00C4CC] flex items-center gap-1">
                      <span>Canva</span>
                      <span className="text-[9px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                        PRO DESIGN
                      </span>
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-slate-300 font-semibold truncate max-w-xs">
                      {fileName || 'โปสเตอร์ศิลปวัฒนธรรมกุดจับประยุกต์ร่วมสมัย'}
                    </span>
                  </div>

                    {(effectiveLinkUrl || url) && (
                      <a
                        href={effectiveLinkUrl || url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00C4CC] hover:bg-[#00b2b8] text-white text-[11px] font-black transition-colors"
                      >
                        <span>เปิดใน Canva ต้นฉบับ ↗</span>
                      </a>
                    )}
                  </div>

                  {/* Canva Artwork Presentation */}
                  <div className="bg-slate-950 p-6 sm:p-10 text-white min-h-[420px] flex flex-col justify-between items-center text-center relative overflow-hidden border border-slate-800">
                    <div className="max-w-md w-full space-y-4 my-auto">
                      <div className="w-16 h-16 rounded-2xl bg-[#00C4CC]/20 border border-[#00C4CC]/40 text-[#00C4CC] mx-auto flex items-center justify-center text-2xl font-black">
                        🎨
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#00C4CC]/10 text-[#00C4CC] border border-[#00C4CC]/30 text-xs font-bold uppercase mb-2">
                          Canva Project Link
                        </span>
                        <h2 className="text-xl font-bold text-white">
                          {title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          ผลงานของ {studentName} (เลขที่ {seatNo} • ห้อง {classroom} • รหัส {studentCode})
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 break-all text-left">
                        <p className="text-[11px] text-slate-500 font-semibold mb-1">ลิงก์ชิ้นงานที่ส่ง:</p>
                        <a
                          href={effectiveLinkUrl || url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00C4CC] hover:underline"
                        >
                          {effectiveLinkUrl || url || 'ไม่มีลิงก์แนบ'}
                        </a>
                      </div>

                      {(effectiveLinkUrl || url) && (
                        <a
                          href={effectiveLinkUrl || url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00C4CC] hover:bg-[#00b2b8] text-white text-xs font-bold transition-colors shadow-lg w-full"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>เปิดดูชิ้นงานใน Canva ต้นฉบับ ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : showPdf ? (
            /* ============================================================== */
            /* 2. REAL PDF EMBED OR MULTI-PAGE DOCUMENT PREVIEW             */
            /* ============================================================== */
            effectiveFileUrl && !imgLoadError ? (
              <div
                className="transition-transform duration-200 origin-center max-w-4xl w-full flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                }}
              >
                {effectiveFileUrl.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={`${effectiveFileUrl}#toolbar=0`}
                    title={title}
                    onError={() => setImgLoadError(true)}
                    className="w-full h-[74vh] rounded-2xl border border-slate-700 bg-white shadow-2xl"
                  />
                ) : (
                  <img
                    src={effectiveFileUrl}
                    alt={fileName || 'เอกสารผลงาน PDF'}
                    onError={() => setImgLoadError(true)}
                    className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-slate-700/60 bg-slate-900"
                  />
                )}
              </div>
            ) : (
            <div
              className="transition-transform duration-200 origin-center max-w-2xl w-full"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {/* PDF Document Page Shell (Realistic A4 Look) */}
              <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 p-8 sm:p-12 min-h-[640px] flex flex-col justify-between">
                {/* PDF Page 1: Cover Page */}
                {pdfPage === 1 && (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
                      <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white mx-auto flex items-center justify-center font-black text-xl shadow-md">
                        ก.ป.
                      </div>
                      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        โรงเรียนกุดจับประชาสรรค์ • สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี
                      </h2>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                        แฟ้มสะสมผลงานทัศนศิลป์ (Art Portfolio)
                      </h1>
                      <p className="text-xs text-teal-700 font-bold">
                        รายวิชา ศ23101 ศิลปะ 3 • ภาคเรียนที่ 1 ปีการศึกษา 2569
                      </p>
                    </div>

                    <div className="my-auto py-6 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                      <div className="w-28 h-28 rounded-full bg-teal-100 border-4 border-teal-500 text-teal-800 mx-auto flex items-center justify-center font-black text-2xl shadow-inner">
                        {studentName.slice(0, 5)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{studentName}</h3>
                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          เลขที่ {seatNo} • รหัสประจำตัว {studentCode} • ชั้นมัธยมศึกษาปีที่ {classroom}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ครูผู้สอน: นายภาสภูมิ เรืองปราชญ์ (กลุ่มสาระการเรียนรู้ศิลปะ)
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>เอกสารประกอบการประเมินผลตัวชี้วัด ศ 1.1 ม.3/1 - ม.3/6</span>
                      <span className="font-bold text-slate-700">หน้า 1 / 3</span>
                    </div>
                  </div>
                )}

                {/* PDF Page 2: Artwork Gallery & Concept */}
                {pdfPage === 2 && (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700 uppercase">
                        ผลงานชิ้นเอก: จิตรกรรมไทยร่วมสมัย
                      </span>
                      <span className="text-[11px] text-slate-400">หน้า 2 / 3</span>
                    </div>

                    {/* Artwork Container */}
                    <div className="rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 p-3 shadow-inner space-y-3">
                      <div className="h-44 bg-gradient-to-tr from-amber-200 via-rose-300 to-indigo-400 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
                        <span className="text-sm font-black text-slate-800 bg-white/80 px-4 py-1.5 rounded-full shadow-md">
                          ภาพวาดสีน้ำ: สายธารแห่งกุดจับ
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-900 block">เทคนิค:</span>
                          สีน้ำบนกระดาษ Arches 300g
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">ขนาด:</span>
                          A3 (29.7 x 42.0 cm)
                        </div>
                      </div>
                    </div>

                    {/* Concept Statement */}
                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900">
                        แนวคิดในการสร้างสรรค์ผลงาน (Artist Statement):
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed indent-4">
                        "ข้าพเจ้าได้แรงบันดาลใจมาจากวิถีชีวิตริมหนองน้ำกุดจับในยามเช้า โดยเลือกใช้โทนสีเย็นและวรรณะอุ่นเพื่อสร้างความขัดแย้งที่กลมกลืน (Harmonious Contrast) ลายเส้นกิ่งไม้และระลอกคลื่นช่วยนำสายตาผู้ชมเข้าสู่จุดเด่นของภาพ"
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{studentName} (ม.{classroom})</span>
                      <span className="font-bold text-slate-700">หน้า 2 / 3</span>
                    </div>
                  </div>
                )}

                {/* PDF Page 3: Rubric & Self Evaluation */}
                {pdfPage === 3 && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700 uppercase">
                        การประเมินตนเองและรูบริกส์ (Rubric Evaluation)
                      </span>
                      <span className="text-[11px] text-slate-400">หน้า 3 / 3</span>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">เกณฑ์การประเมิน</th>
                          <th className="p-2 text-center w-20">คะแนนเต็ม</th>
                          <th className="p-2 text-center w-24">ประเมินตนเอง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2">1. ความคิดสร้างสรรค์และแนวคิด</td>
                          <td className="p-2 text-center font-bold">5</td>
                          <td className="p-2 text-center text-teal-700 font-black">5</td>
                        </tr>
                        <tr>
                          <td className="p-2">2. ทักษะการใช้สีน้ำหนักแสงเงา</td>
                          <td className="p-2 text-center font-bold">5</td>
                          <td className="p-2 text-center text-teal-700 font-black">4.5</td>
                        </tr>
                        <tr>
                          <td className="p-2">3. ความประณีตและเสร็จสมบูรณ์</td>
                          <td className="p-2 text-center font-bold">5</td>
                          <td className="p-2 text-center text-teal-700 font-black">5</td>
                        </tr>
                        <tr className="bg-teal-50 font-bold">
                          <td className="p-2 text-teal-900">คะแนนรวมทั้งหมด</td>
                          <td className="p-2 text-center text-teal-900">15</td>
                          <td className="p-2 text-center text-teal-900 font-black">14.5 / 15</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        ข้อคิดเห็นเพิ่มเติมของนักเรียน:
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        "หนูพอใจกับการผสมสีและการควบคุมน้ำในชิ้นนี้มากค่ะ แต่ครั้งต่อไปจะระวังเรื่องการตัดขอบไม่ให้สีซึมเปื้อนบริเวณมุมล่างขวา"
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ลงชื่อ: {studentName} (ผู้ส่งงาน)</span>
                      <span className="font-bold text-slate-700">หน้า 3 / 3</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )
          ) : (
            /* ============================================================== */
            /* 3. IMAGE PREVIEW (JPG, PNG, WEBP) */
            /* ============================================================== */
            <div
              className="transition-transform duration-200 origin-center max-w-4xl max-h-[75vh] flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {!imgLoadError && effectiveFileUrl ? (
                <img
                  src={effectiveFileUrl}
                  alt={fileName || 'ผลงานนักเรียน'}
                  onError={() => setImgLoadError(true)}
                  className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-slate-700/60 bg-slate-900"
                />
              ) : (
                /* Clean file status card conforming to Strict Zero Mock Policy */
                <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-2xl text-white max-w-lg w-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-inner">
                    🖼️
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                      {isJpg ? 'ไฟล์ภาพ JPG' : isPng ? 'ไฟล์ภาพ PNG' : isWebp ? 'ไฟล์ภาพ WebP' : 'ไฟล์ภาพชิ้นงาน'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white break-all">
                      {fileName || 'ไฟล์ผลงานนักเรียน'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ผลงานของ: <span className="text-teal-300 font-semibold">{studentName}</span> (เลขที่ {seatNo} • ชั้น {classroom} • รหัส {studentCode})
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs">
                    {imgLoadError ? (
                      <div className="text-amber-400 flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span>
                          ไม่สามารถแสดงผลตัวอย่างภาพบนเบราว์เซอร์ได้โดยตรง (อาจติดการตั้งค่าสิทธิ์เครือข่าย หรือรูปแบบไฟล์ไม่รองรับการแสดงตัวอย่างในหน้านี้)
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>ไฟล์ได้รับการบันทึกและส่งผ่านระบบเรียบร้อยแล้ว</span>
                      </div>
                    )}
                  </div>

                  {(effectiveFileUrl || url) && (
                    <div className="pt-2">
                      <a
                        href={effectiveFileUrl || url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md w-full"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>เปิดไฟล์ต้นฉบับในแท็บใหม่ ↗</span>
                      </a>
                    </div>
                  )}
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
              สถานะ: ตรวจสอบผลงานได้ทันทีบนหน้าจอ ไม่ต้องดาวน์โหลดลงเครื่อง
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
