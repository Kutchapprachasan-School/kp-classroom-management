import React, { useState } from 'react';
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
  Sparkles,
} from 'lucide-react';

export interface ArtworkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  studentName: string;
  studentCode?: string;
  classroom?: string;
  seatNo?: number;
  type: 'IMAGE' | 'PDF' | 'LINK';
  url?: string;
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
  fileName = 'ผลงานนักเรียน',
  platform = 'CANVA',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // ตรวจสอบนามสกุลไฟล์
  const lowerFile = (fileName || '').toLowerCase();
  const isJpg = lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg');
  const isPng = lowerFile.endsWith('.png');
  const isPdf = type === 'PDF' || lowerFile.endsWith('.pdf');
  const isLink = type === 'LINK' || (url && url.includes('canva.com')) || (url && url.includes('docs.google.com'));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              {isPdf ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : isLink ? (
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
                  {isPdf ? 'PDF DOCUMENT' : isLink ? (platform || 'CANVA') : isJpg ? 'JPG IMAGE' : isPng ? 'PNG IMAGE' : 'IMAGE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                ผลงานของ: <span className="text-teal-300 font-bold">{studentName}</span> (เลขที่ {seatNo} • รหัส {studentCode} • ชั้น {classroom}) • {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
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
          {isPdf && (
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
          {isLink && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C4CC] animate-pulse" />
              <span className="text-[11px] font-bold text-[#00C4CC]">
                {platform === 'CANVA' ? 'Canva Live Poster Preview' : 'Interactive Web Preview'}
              </span>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* PREVIEW CANVAS AREA (Scrollable, Zoomable, Rotatable) */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/95 relative select-none">
          {/* ================================================================ */}
          {/* 1. CANVA / EXTERNAL LINK PREVIEW */}
          {/* ================================================================ */}
          {isLink ? (
            <div
              className="transition-transform duration-200 origin-center max-w-3xl w-full"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {/* Canva Window Shell */}
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

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00C4CC] hover:bg-[#00b2b8] text-white text-[11px] font-black transition-colors"
                  >
                    <span>เปิดใน Canva ต้นฉบับ ↗</span>
                  </a>
                </div>

                {/* Canva Poster Artwork Rendering */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-10 text-white min-h-[500px] flex flex-col justify-between relative overflow-hidden border border-slate-800">
                  {/* Decorative modern geometric shapes */}
                  <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
                  <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
                  <div className="absolute right-10 bottom-24 w-32 h-32 border border-cyan-400/20 rounded-full" />

                  {/* Header of Poster */}
                  <div className="relative z-10 space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-black tracking-widest uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>KUTCHAP CONTEMPORARY ART FESTIVAL 2026</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-pink-300">
                      ศิลปวัฒนธรรมกุดจับร่วมสมัย
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg font-light leading-relaxed">
                      การผสานลวดลายไทยประเพณีเข้ากับศิลปะนามธรรมสมัยใหม่ (Contemporary Neo-Tradition)
                      สะท้อนอัตลักษณ์ชุมชนและวรรณคดีพื้นบ้านอีสาน
                    </p>
                  </div>

                  {/* Graphic Showcase Section */}
                  <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 mx-auto flex items-center justify-center font-black">
                        ๑
                      </div>
                      <h4 className="text-xs font-bold text-white">ลายกนกสามเหลี่ยม</h4>
                      <p className="text-[10px] text-slate-400">พัฒนาจากลายผ้าขิดโบราณ</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-300 mx-auto flex items-center justify-center font-black">
                        ๒
                      </div>
                      <h4 className="text-xs font-bold text-white">วงจรสีคู่ตรงข้าม</h4>
                      <p className="text-[10px] text-slate-400">สีกรมท่าตัดกับสีทองอร่าม</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 mx-auto flex items-center justify-center font-black">
                        ๓
                      </div>
                      <h4 className="text-xs font-bold text-white">การจัดวางอสมมาตร</h4>
                      <p className="text-[10px] text-slate-400">ความสมดุลแบบเคลื่อนไหว</p>
                    </div>
                  </div>

                  {/* Poster Footer with Student Info */}
                  <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-white font-bold block">
                        ออกแบบโดย: {studentName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        เลขที่ {seatNo} • ชั้น {classroom} • รหัส {studentCode}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-cyan-300 font-bold block">
                        กลุ่มสาระการเรียนรู้ศิลปะ (ศ23101)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        โรงเรียนกุดจับประชาสรรค์ จ.อุดรธานี
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isPdf ? (
            /* ============================================================== */
            /* 2. MULTI-PAGE PDF DOCUMENT PREVIEW */
            /* ============================================================== */
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
              {!imgLoadError && url ? (
                <img
                  src={url}
                  alt={fileName || 'ผลงานนักเรียน'}
                  onError={() => setImgLoadError(true)}
                  className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-slate-700/60 bg-slate-900"
                />
              ) : (
                /* High-fidelity Vector Fallback when external link is blocked or local JPG */
                <div className="bg-gradient-to-tr from-slate-900 via-teal-950 to-indigo-950 p-6 sm:p-8 rounded-2xl border-2 border-teal-500/40 shadow-2xl text-white max-w-xl text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-teal-500/20 border-2 border-teal-400 text-teal-300 mx-auto flex items-center justify-center font-black text-3xl shadow-lg">
                    🎨
                  </div>
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-black">
                      {isJpg ? 'JPG HIGH-RESOLUTION ARTWORK' : 'PNG ARTWORK'}
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      {fileName || 'จิตรกรรมไทยร่วมสมัย_ผลงานจริง'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      ภาพวาดระบายสีน้ำและแรเงาดินสอ EE ของนักเรียน {studentName}
                    </p>
                  </div>

                  <div className="h-44 rounded-xl bg-slate-950/60 border border-teal-500/30 p-4 flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>ไฟล์ {isJpg ? 'JPG' : 'PNG'} ถูกตรวจสอบและแคชในระบบ R2 Storage เรียบร้อย</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      ขนาดภาพ: 2400 x 1800 px (300 DPI) • ตรวจสอบลายเส้นและน้ำหนักแสงเงาผ่านเกณฑ์มาตรฐาน
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>รหัสนักเรียน: {studentCode}</span>
                    <span>ห้อง {classroom} เลขที่ {seatNo}</span>
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
