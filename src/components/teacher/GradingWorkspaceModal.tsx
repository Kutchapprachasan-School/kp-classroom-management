import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileText,
  Sparkles,
  MessageSquare,
  Plus,
  Layers,
} from 'lucide-react';
import type { GradingQueueItem } from '../../services/teacherCourseAssignmentService';
import { studentService, formatClassroomLabel } from '../../services/studentService';
import {
  sgsRosterAndSubmissionService,
  RETURN_SUBMISSION_REASONS,
} from '../../services/sgsRosterAndSubmissionService';
import {
  FEEDBACK_STRAND_CATALOG,
  detectFeedbackStrand,
  getTeacherPreferredStrand,
  setTeacherPreferredStrand,
  getAllStickersForStrand,
  addCustomFeedbackSticker,
  removeCustomFeedbackSticker,
  getCustomFeedbackStickers,
} from '../../config/feedbackStickersCatalog';
import type { FeedbackStrandId } from '../../config/feedbackStickersCatalog';

interface GradingWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: GradingQueueItem | null;
  allItems: GradingQueueItem[];
  onSaveGrade: (itemId: string, score: number, feedback: string) => void;
  onReturnSubmission?: (itemId: string, reason: string, note: string) => void;
  onSelectQueueItem: (item: GradingQueueItem) => void;
}

export const GradingWorkspaceModal: React.FC<GradingWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentItem,
  allItems,
  onSaveGrade,
  onReturnSubmission,
  onSelectQueueItem,
}) => {
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [imgError, setImgError] = useState<boolean>(false);
  const [isReturningWork, setIsReturningWork] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>(RETURN_SUBMISSION_REASONS[0]);
  const [customReturnNote, setCustomReturnNote] = useState<string>('');

  // Feedback Stickers Catalog State
  const [selectedStrand, setSelectedStrand] = useState<FeedbackStrandId>(() => {
    return getTeacherPreferredStrand() || 'GENERAL';
  });
  const [isAddingCustomSticker, setIsAddingCustomSticker] = useState<boolean>(false);
  const [newStickerText, setNewStickerText] = useState<string>('');
  const [customStickersVersion, setCustomStickersVersion] = useState<number>(0);

  // Compute stickers for selected strand and invalidate on custom sticker updates
  const currentStickers = React.useMemo(() => {
    void customStickersVersion;
    return getAllStickersForStrand(selectedStrand);
  }, [selectedStrand, customStickersVersion]);

  const customList = React.useMemo(() => {
    void customStickersVersion;
    return getCustomFeedbackStickers(selectedStrand);
  }, [selectedStrand, customStickersVersion]);

  // Sync inputs when item changes
  useEffect(() => {
    if (currentItem) {
      if (currentItem.status === 'GRADED' && currentItem.score !== undefined && currentItem.score !== null) {
        setScoreInput(String(currentItem.score));
      } else {
        setScoreInput(String(currentItem.maxScore)); // default to full score
      }
      setFeedbackInput(currentItem.teacherFeedback || '');
      setZoomLevel(100);
      setImgError(false);

      // Auto-detect strand or restore preferred strand for teacher's major subject
      const preferred = getTeacherPreferredStrand();
      if (preferred) {
        setSelectedStrand(preferred);
      } else {
        const detected = detectFeedbackStrand(currentItem.subjectCode, currentItem.subjectName);
        setSelectedStrand(detected);
      }
    }
  }, [currentItem]);

  if (!isOpen || !currentItem) return null;

  const currentIndex = allItems.findIndex((i) => i.id === currentItem.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allItems.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectQueueItem(allItems[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectQueueItem(allItems[currentIndex + 1]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(scoreInput);
    if (isNaN(num) || num < 0) return;
    onSaveGrade(currentItem.id, num, feedbackInput);
  };

  const cachedFile = currentItem
    ? sgsRosterAndSubmissionService.getSubmissionFileUrl(currentItem.assignmentId, currentItem.studentCode)
    : undefined;
  const cleanPreview =
    currentItem?.filePreviewUrl &&
    !currentItem.filePreviewUrl.includes('storage.kps.ac.th') &&
    !currentItem.filePreviewUrl.startsWith('r2://')
      ? currentItem.filePreviewUrl
      : undefined;
  const effectiveFileUrl = cachedFile || cleanPreview;

  const isImage = Boolean(
    effectiveFileUrl?.startsWith('data:image/') ||
    currentItem.submissionChannel === 'IMAGE_UPLOAD' ||
    (currentItem.fileName || '').match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
  );
  const isPdf = Boolean(
    currentItem.submissionChannel === 'PDF_UPLOAD' ||
    (currentItem.fileName || '').endsWith('.pdf') ||
    (effectiveFileUrl && effectiveFileUrl.toLowerCase().includes('.pdf'))
  );

  // ตรวจสอบและดึงชื่อจริง ชั้น เลขที่ของนักเรียน
  const resolvedStu = currentItem ? studentService.findStudentByCode(currentItem.studentCode) : null;
  const resolvedName =
    currentItem?.studentName && currentItem.studentName !== currentItem.studentCode
      ? currentItem.studentName
      : resolvedStu?.student.name || `นักเรียน (${currentItem?.studentCode})`;
  const resolvedRoom =
    currentItem?.classroom ||
    (resolvedStu?.classroomId ? formatClassroomLabel(resolvedStu.classroomId) : 'ม.3/1');
  const resolvedSeat = currentItem?.seatNo ?? resolvedStu?.student.no ?? '-';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/90 via-white to-sky-50/70 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs">
              คิวที่ #{currentItem.queueNo} (FIFO)
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {resolvedName}
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  เลขที่ {resolvedSeat} • ห้อง {resolvedRoom} • รหัส {currentItem.studentCode}
                </span>
                {currentItem.status === 'GRADED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ ตรวจแล้ว ({currentItem.score}/{currentItem.maxScore})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ⏳ รอตรวจ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                วิชา {currentItem.subjectCode} {currentItem.subjectName} • {currentItem.assignmentTitle} • ส่งเมื่อ {currentItem.submittedAtText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next queue navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="นักเรียนคนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-600 px-1.5 tabular-nums">
                {currentIndex + 1} / {allItems.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="นักเรียนคนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดหน้าต่างตรวจงาน"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual-Pane Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-100/50">
          {/* Left Pane (7/12 on desktop): Work Viewer */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col overflow-y-auto border-r border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-700">ไฟล์ผลงาน:</span>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-xs">
                  {currentItem.fileName || 'ผลงานนักเรียน'}
                </span>
                {currentItem.externalLinkUrl && (
                  <a
                    href={currentItem.externalLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold hover:bg-teal-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-teal-600" />
                    <span>เปิดลิงก์แนบ ↗</span>
                  </a>
                )}
              </div>

              {isImage && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    title="ย่อขนาด"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-bold w-10 text-center">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    title="ขยายขนาด"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Viewer Display */}
            <div className="flex-1 mt-3 rounded-2xl border border-slate-200 bg-slate-900/5 flex items-center justify-center overflow-auto p-2 min-h-[280px]">
              {isImage ? (
                !imgError && effectiveFileUrl ? (
                  <img
                    src={effectiveFileUrl}
                    alt={currentItem.assignmentTitle}
                    onError={() => setImgError(true)}
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                    className="max-h-[55vh] w-auto object-contain rounded-xl transition-transform duration-150 shadow-md"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3 bg-blue-50/50 rounded-2xl w-full">
                    <span className="text-4xl">📁</span>
                    <h4 className="text-sm font-bold text-slate-800">
                      {currentItem.fileName || 'ไฟล์ผลงานนักเรียน'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ชิ้นงานที่ส่งของ {resolvedName}
                    </p>
                  </div>
                )
              ) : isPdf ? (
                !imgError && effectiveFileUrl ? (
                  effectiveFileUrl.toLowerCase().includes('.pdf') ? (
                    <iframe
                      src={`${effectiveFileUrl}#toolbar=0`}
                      title={currentItem.fileName}
                      onError={() => setImgError(true)}
                      className="w-full h-[52vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                    />
                  ) : (
                    <img
                      src={effectiveFileUrl}
                      alt={currentItem.assignmentTitle}
                      onError={() => setImgError(true)}
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                      className="max-h-[55vh] w-auto object-contain rounded-xl transition-transform duration-150 shadow-md"
                    />
                  )
                ) : (
                  <div className="p-6 text-center space-y-4 bg-rose-50/40 border border-rose-200 rounded-2xl w-full max-w-md">
                    <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px]">
                        เอกสาร PDF
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {currentItem.fileName || 'เอกสารแนบของนักเรียน'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        เอกสารผลงานของ {resolvedName}
                      </p>
                    </div>
                    {effectiveFileUrl && (
                      <a
                        href={effectiveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                        <span>เปิดดูเอกสาร PDF เต็มหน้าต่าง ↗</span>
                      </a>
                    )}
                  </div>
                )
              ) : (
                <div className="p-6 text-center space-y-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl w-full max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00C4CC] to-indigo-600 text-white font-black text-[11px]">
                      {currentItem.externalPlatform || 'CANVA'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      {currentItem.fileName || 'งานออกแบบออนไลน์'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      คลิกปุ่มด้านล่างเพื่อเปิดดูผลงานบน {currentItem.externalPlatform || 'Canva'}
                    </p>
                  </div>
                  {currentItem.externalLinkUrl && (
                    <a
                      href={currentItem.externalLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>เปิดดูผลงาน {currentItem.externalPlatform || 'Canva'} ↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane (5/12 on desktop): Grading & Feedback Form */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-white overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Assignment Meta */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-blue-600 block">
                  {currentItem.sgsUnit}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {currentItem.assignmentTitle}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>เกณฑ์คะแนนเต็ม:</span>
                  <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {currentItem.maxScore} คะแนน
                  </span>
                </div>
              </div>

              {/* Score Input & Quick Buttons */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-score-input" className="text-xs font-bold text-slate-900">
                    ให้คะแนน (Score):
                  </label>
                  <span className="text-xs text-slate-500">
                    เต็ม {currentItem.maxScore} คะแนน
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(scoreInput) || 0;
                      setScoreInput(String(Math.max(0, cur - 0.5)));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    -
                  </button>

                  <input
                    id="modal-score-input"
                    type="number"
                    step="0.5"
                    min="0"
                    max={currentItem.maxScore}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="flex-1 h-10 text-center font-extrabold text-xl rounded-xl border-2 border-blue-500 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xs"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(scoreInput) || 0;
                      setScoreInput(String(Math.min(currentItem.maxScore, cur + 0.5)));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>

                {/* Quick Score Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(currentItem.maxScore))}
                    className="py-1.5 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    เต็ม ({currentItem.maxScore})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.max(0, currentItem.maxScore - 1)))}
                    className="py-1.5 px-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {Math.max(0, currentItem.maxScore - 1)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.round(currentItem.maxScore * 0.8)))}
                    className="py-1.5 px-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    80% ({Math.round(currentItem.maxScore * 0.8)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.round(currentItem.maxScore * 0.7)))}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    70% ({Math.round(currentItem.maxScore * 0.7)})
                  </button>
                </div>
              </div>

              {/* Feedback Input & Multi-Strand Stickers Catalog */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>คำแนะนำ & ข้อเสนอแนะถึงนักเรียน:</span>
                  </label>
                  {feedbackInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setFeedbackInput('')}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      ล้างข้อความ
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="พิมพ์ข้อเสนอแนะ หรือคลิกสติกเกอร์ 1-Tap ด้านล่างเพื่อเพิ่มคำติชมทันที..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                {/* Catalog Strand Selector Header */}
                <div className="pt-1 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>แคตตาล็อคสติกเกอร์ (รายวิชาเอก)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      คลิกเพื่อเพิ่มคำติชมทันที
                    </span>
                  </div>

                  {/* Horizontal Scrollable Strand Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
                    {FEEDBACK_STRAND_CATALOG.map((cat) => {
                      const isActive = selectedStrand === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedStrand(cat.id);
                            setTeacherPreferredStrand(cat.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            isActive
                              ? `${cat.activePillClass} shadow-xs scale-102`
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title={cat.name}
                        >
                          <span>{cat.iconSymbol}</span>
                          <span>{cat.shortName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Strand Stickers List & Custom Sticker Manager */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {currentStickers.map((stamp) => {
                        const isCustom = customList.includes(stamp);
                        return (
                          <div
                            key={stamp}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-medium border border-transparent hover:border-blue-200 transition-colors px-2 py-1"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!feedbackInput.trim()) {
                                  setFeedbackInput(stamp);
                                } else if (!feedbackInput.includes(stamp)) {
                                  setFeedbackInput(`${feedbackInput.trim()} ${stamp}`);
                                }
                              }}
                              className="cursor-pointer text-left"
                            >
                              + {stamp}
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomFeedbackSticker(selectedStrand, stamp);
                                  setCustomStickersVersion((v) => v + 1);
                                }}
                                className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                                title="ลบสติกเกอร์ที่สร้างเองนี้"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Custom Sticker Toggle Button */}
                      {!isAddingCustomSticker ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomSticker(true)}
                          className="px-2 py-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>เพิ่มสติกเกอร์ของฉัน</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center gap-1.5 mt-1 p-1.5 bg-indigo-50/80 border border-indigo-200 rounded-xl">
                          <input
                            type="text"
                            placeholder="พิมพ์ข้อความสติกเกอร์คำติชมใหม่..."
                            value={newStickerText}
                            onChange={(e) => setNewStickerText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newStickerText.trim()) {
                                  addCustomFeedbackSticker(selectedStrand, newStickerText.trim());
                                  setNewStickerText('');
                                  setIsAddingCustomSticker(false);
                                  setCustomStickersVersion((v) => v + 1);
                                }
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newStickerText.trim()) {
                                addCustomFeedbackSticker(selectedStrand, newStickerText.trim());
                                setNewStickerText('');
                                setIsAddingCustomSticker(false);
                                setCustomStickersVersion((v) => v + 1);
                              }
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCustomSticker(false);
                              setNewStickerText('');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel: ส่งงานกลับเนื่องจาก... (Request Revision) */}
              {isReturningWork ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-2.5 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <span>↩️</span>
                      <span>ส่งงานกลับให้นักเรียนแก้ไข (Request Resubmission)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReturningWork(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ส่งงานกลับ เนื่องจาก: *
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {RETURN_SUBMISSION_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      คำแนะนำเพิ่มเติมถึงนักเรียน (ถ้ามี):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ช่วยเพิ่มข้อ 3-5 หรือแนบรูปที่สว่างกว่านี้..."
                      value={customReturnNote}
                      onChange={(e) => setCustomReturnNote(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentItem) return;
                        if (onReturnSubmission) {
                          onReturnSubmission(currentItem.id, returnReason, customReturnNote);
                        } else {
                          sgsRosterAndSubmissionService.returnSubmissionForRevision(
                            currentItem.assignmentId,
                            currentItem.studentCode,
                            returnReason,
                            customReturnNote
                          );
                        }
                        setIsReturningWork(false);
                        setCustomReturnNote('');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                    >
                      ยืนยันส่งงานกลับ ↩️
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReturningWork(false)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Check className="w-5 h-5" />
                  <span>บันทึกคะแนน & ตรวจคนถัดไป ➔</span>
                </button>

                {!isReturningWork && (
                  <button
                    type="button"
                    onClick={() => setIsReturningWork(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>↩️</span>
                    <span>ส่งงานกลับให้นักเรียนแก้ไข</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
