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
  MessageSquare,
  Plus,
  Layers,
  Upload,
  Copy,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { ArtworkPreviewModal } from './ArtworkPreviewModal';
import {
  teacherCourseAssignmentService,
  type GradingQueueItem,
} from '../../services/teacherCourseAssignmentService';
import { studentService, formatClassroomLabel } from '../../services/studentService';
import {
  sgsRosterAndSubmissionService,
  RETURN_SUBMISSION_REASONS,
} from '../../services/sgsRosterAndSubmissionService';
import { r2StorageService } from '../../services/r2StorageService';
import {
  resolveSubmissionMedia,
  getOfficeViewerUrls,
} from '../../utils/submissionPreviewUtils';
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
  const [localOverrideFileUrl, setLocalOverrideFileUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isReturningWork, setIsReturningWork] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>(RETURN_SUBMISSION_REASONS[0]);
  const [customReturnNote, setCustomReturnNote] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

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

  const [copiedText, setCopiedText] = useState(false);

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
      setLocalOverrideFileUrl(null);
      setActiveImageIdx(0);

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

  // แท็บตัวกรองคิวในหน้าต่างตรวจงาน (รองรับ: รอตรวจ, ส่งกลับแก้ไข, ตรวจแล้ว, ทั้งหมด)
  const [modalFilter, setModalFilter] = useState<'PENDING' | 'RETURNED' | 'GRADED' | 'ALL'>('PENDING');

  useEffect(() => {
    if (isOpen) {
      if (currentItem?.status === 'RETURNED' || (currentItem as any)?.status === 'RETURNED_REVISION') {
        setModalFilter('RETURNED');
      } else if (currentItem?.status === 'GRADED') {
        setModalFilter('GRADED');
      } else {
        setModalFilter('PENDING');
      }
    }
  }, [isOpen, currentItem?.id]);

  const filteredModalItems = React.useMemo(() => {
    if (modalFilter === 'PENDING') {
      const p = allItems.filter((i) => i.status === 'PENDING_REVIEW');
      return p.length > 0 ? p : allItems;
    }
    if (modalFilter === 'RETURNED') {
      const r = allItems.filter((i) => i.status === 'RETURNED' || (i as any).status === 'RETURNED_REVISION');
      return r.length > 0 ? r : allItems;
    }
    if (modalFilter === 'GRADED') {
      const g = allItems.filter((i) => i.status === 'GRADED');
      return g.length > 0 ? g : allItems;
    }
    return allItems;
  }, [allItems, modalFilter]);

  if (!isOpen || !currentItem) return null;

  const pendingItemsCount = allItems.filter((i) => i.status === 'PENDING_REVIEW').length;
  const returnedItemsCount = allItems.filter((i) => i.status === 'RETURNED' || (i as any).status === 'RETURNED_REVISION').length;
  const gradedItemsCount = allItems.filter((i) => i.status === 'GRADED').length;

  const currentIndex = filteredModalItems.findIndex((i) => i.id === currentItem.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredModalItems.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectQueueItem(filteredModalItems[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectQueueItem(filteredModalItems[currentIndex + 1]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(scoreInput);
    if (isNaN(num) || num < 0) return;
    onSaveGrade(currentItem.id, num, feedbackInput);
  };

  const imagesList =
    currentItem?.fileUrls && currentItem.fileUrls.length > 0
      ? currentItem.fileUrls
      : (currentItem as any)?.fileUrl
      ? [(currentItem as any).fileUrl]
      : [];

  const currentImageUrl = imagesList[activeImageIdx] || (currentItem as any)?.fileUrl;

  const media = resolveSubmissionMedia({
    filePreviewUrl: currentImageUrl || currentItem?.filePreviewUrl,
    fileUrl: currentImageUrl || (currentItem as any)?.fileUrl,
    externalLinkUrl: currentItem?.externalLinkUrl,
    assignmentId: currentItem?.assignmentId,
    studentCode: currentItem?.studentCode,
    fileName: currentItem?.fileName,
    textContent: currentItem?.textContent,
    typeHint: currentItem?.submissionChannel,
    platformHint: currentItem?.externalPlatform,
    localOverrideUrl: localOverrideFileUrl,
  });

  const {
    effectiveFileUrl,
    inferredFileName,
    fileCategory,
    externalLinkInfo,
    hasFile,
    hasLink,
    hasText,
  } = media;

  const isImage = fileCategory === 'IMAGE';
  const isPdf = fileCategory === 'PDF';
  const isOffice = fileCategory === 'OFFICE';
  const isVideo = fileCategory === 'VIDEO';
  const isAudio = fileCategory === 'AUDIO';

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

  const resolvedSubjectCode = currentItem.subjectCode || (currentItem as any).courseCode || '';
  const resolvedSubjectName = currentItem.subjectName || (currentItem as any).courseName || '';
  const resolvedAssignmentTitle = currentItem.assignmentTitle || (currentItem as any).workTitle || 'ชิ้นงาน';
  const resolvedSubmittedAt = currentItem.submittedAtText || (currentItem as any).submittedAt || '-';

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
                ) : currentItem.status === 'RETURNED' || (currentItem as any).status === 'RETURNED_REVISION' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⚠️ ส่งกลับแก้ไข
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    ⏳ รอตรวจ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {resolvedSubjectCode ? `วิชา ${resolvedSubjectCode}${resolvedSubjectName ? ` ${resolvedSubjectName}` : ''} • ` : ''}
                {resolvedAssignmentTitle} • ส่งเมื่อ {resolvedSubmittedAt}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter pills inside grading workspace */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setModalFilter('PENDING');
                  const firstP = allItems.find((i) => i.status === 'PENDING_REVIEW');
                  if (firstP) onSelectQueueItem(firstP);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  modalFilter === 'PENDING'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏳ รอตรวจ ({pendingItemsCount})
              </button>
              {returnedItemsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setModalFilter('RETURNED');
                    const firstR = allItems.find(
                      (i) => i.status === 'RETURNED' || (i as any).status === 'RETURNED_REVISION'
                    );
                    if (firstR) onSelectQueueItem(firstR);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                    modalFilter === 'RETURNED'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  🔄 ส่งกลับแก้ไข ({returnedItemsCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setModalFilter('GRADED');
                  const firstG = allItems.find((i) => i.status === 'GRADED');
                  if (firstG) onSelectQueueItem(firstG);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  modalFilter === 'GRADED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✓ ตรวจแล้ว ({gradedItemsCount})
              </button>
              <button
                type="button"
                onClick={() => setModalFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  modalFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({allItems.length})
              </button>
            </div>

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
                {currentIndex >= 0 ? currentIndex + 1 : 1} / {filteredModalItems.length}
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
                  {inferredFileName || currentItem.fileName || 'ผลงานนักเรียน'}
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
            {(currentItem.status === 'RETURNED' || (currentItem as any)?.status === 'RETURNED_REVISION') && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">งานนี้ส่งกลับให้นักเรียนแก้ไข:</div>
                  <div className="text-amber-800 mt-0.5">{currentItem.teacherFeedback || 'รอนักเรียนแก้ไขและส่งใหม่'}</div>
                </div>
              </div>
            )}
            <div className="flex-1 mt-3 rounded-2xl border border-slate-200 bg-slate-900/5 flex flex-col items-center justify-center overflow-auto p-3 min-h-[280px]">
              {/* ข้อความคำตอบของนักเรียน (ถ้ามี) */}
              {hasText && (
                <div className="w-full max-w-lg p-4 sm:p-5 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3 text-left mb-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                        ✍️ ข้อความคำตอบของนักเรียน
                      </span>
                      <span className="text-xs text-slate-500">({resolvedName})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentItem.textContent || '');
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอกข้อความ</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed max-h-[35vh] overflow-y-auto select-text">
                    {currentItem.textContent}
                  </div>
                </div>
              )}

              {isImage ? (
                !imgError && effectiveFileUrl ? (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    {imagesList.length > 1 && (
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <span className="text-[11px] font-bold text-slate-600 px-2">ภาพผลงาน:</span>
                        {imagesList.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveImageIdx(idx);
                              setImgError(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              activeImageIdx === idx
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>ภาพที่ {idx + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="relative group max-h-[55vh] flex items-center justify-center">
                      <img
                        src={effectiveFileUrl}
                        alt={currentItem.assignmentTitle}
                        onError={() => setImgError(true)}
                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                        className="max-h-[55vh] w-auto object-contain rounded-xl transition-transform duration-150 shadow-md cursor-pointer"
                        onClick={() => setIsPreviewOpen(true)}
                        title="คลิกเพื่อดูภาพเต็มจอ"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition-opacity cursor-pointer"
                        title="เปิดดูภาพเต็มจอ"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
                        <span>เปิดดูเต็มจอ ↗</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 text-center space-y-3 bg-blue-50/50 rounded-2xl w-full max-w-md border border-blue-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                      🖼️
                    </div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                      {imgError ? '⚠️ ไม่พบไฟล์ภาพบนคลาวด์ R2' : `ไฟล์ผลงานภาพ (${currentItem.submissionChannel || 'รูปภาพ'})`}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 break-all">
                      {currentItem.fileName || 'ไฟล์ผลงานนักเรียน'}
                    </h4>
                    {imgError && (
                      <p className="text-xs text-rose-600 font-medium">
                        (อาจเกิดจากสัญญาณเน็ตหรือสิทธิ์ CORS บนมือถือของนักเรียนขณะส่งงาน)
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      ชิ้นงานที่ส่งของ {resolvedName}
                    </p>
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>เลือกรูปภาพจากเครื่องเพื่อดูพรีวิวและบันทึกแทน</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const res = ev.target?.result as string;
                              if (res) {
                                setImgError(false);
                                setLocalOverrideFileUrl(res);
                                try {
                                  localStorage.setItem(`kp_sub_file_${currentItem.assignmentId}_${currentItem.studentCode}`, res);
                                  if (currentItem.fileName) {
                                    localStorage.setItem(`kp_sub_file_${currentItem.fileName}`, res);
                                  }
                                } catch {}

                                teacherCourseAssignmentService.updateQueueItemFile(currentItem.id, res);

                                // อัปโหลดขึ้น Cloudflare R2 ทันทีหาก R2 พร้อมใช้งาน
                                if (r2StorageService.isConfigured()) {
                                  try {
                                    const cleanFileName = f.name || currentItem.fileName || `${currentItem.studentCode}_submission.webp`;
                                    const r2Key = r2StorageService.buildSubmissionKey({
                                      term: currentItem.academicYearTerm || '1/2569',
                                      classroom: currentItem.classroom,
                                      assignmentId: currentItem.assignmentId,
                                      studentCode: currentItem.studentCode,
                                      fileName: cleanFileName,
                                    });
                                    const uploadRes = await r2StorageService.uploadFile(r2Key, f, f.type);
                                    if (uploadRes.success && uploadRes.url) {
                                      setLocalOverrideFileUrl(uploadRes.url);
                                      teacherCourseAssignmentService.updateQueueItemFile(currentItem.id, uploadRes.url);
                                      const subs = sgsRosterAndSubmissionService.getSubmissions();
                                      const targetIdx = subs.findIndex(
                                        (s) => s.assignmentId === currentItem.assignmentId && s.studentCode === currentItem.studentCode
                                      );
                                      if (targetIdx !== -1) {
                                        subs[targetIdx].fileDataUrl = uploadRes.url;
                                        subs[targetIdx].r2ObjectKey = uploadRes.key;
                                        sgsRosterAndSubmissionService.saveSubmissions(subs);
                                      }
                                    }
                                  } catch (err) {
                                    console.warn('[GradingWorkspaceModal] Direct R2 upload failed:', err);
                                  }
                                }
                              }
                            };
                            reader.readAsDataURL(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )
              ) : isPdf ? (
                !imgError && effectiveFileUrl ? (
                  <div className="w-full space-y-2">
                    <iframe
                      src={effectiveFileUrl}
                      title={inferredFileName}
                      onError={() => setImgError(true)}
                      className="w-full h-[54vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                    />
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-500 font-medium truncate">📄 {inferredFileName}</span>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ขยายดู PDF เต็มจอ ↗</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-4 bg-rose-50/40 border border-rose-200 rounded-2xl w-full max-w-md">
                    <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px]">
                        เอกสาร PDF
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {inferredFileName || 'เอกสารแนบของนักเรียน'}
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
              ) : isOffice && effectiveFileUrl ? (
                <div className="w-full space-y-2">
                  <iframe
                    src={getOfficeViewerUrls(effectiveFileUrl).googleEmbedUrl}
                    title={inferredFileName}
                    className="w-full h-[54vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
                    <span className="text-slate-600 font-bold truncate">📘 {inferredFileName}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold cursor-pointer"
                      >
                        ดูเต็มจอ ↗
                      </button>
                      <a
                        href={effectiveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={inferredFileName}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>ดาวน์โหลดไฟล์</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : isVideo && effectiveFileUrl ? (
                <div className="w-full space-y-2">
                  <video
                    src={effectiveFileUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[52vh] rounded-xl bg-black shadow-md"
                  />
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-700 truncate">🎬 {inferredFileName}</span>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      เปิดดูเต็มจอ ↗
                    </button>
                  </div>
                </div>
              ) : isAudio && effectiveFileUrl ? (
                <div className="p-6 text-center space-y-4 bg-amber-50/50 border border-amber-200 rounded-2xl w-full max-w-md">
                  <div className="text-3xl">🎵</div>
                  <h4 className="text-sm font-bold text-slate-900 break-all">{inferredFileName}</h4>
                  <audio src={effectiveFileUrl} controls preload="metadata" className="w-full" />
                </div>
              ) : hasFile && effectiveFileUrl ? (
                <div className="p-6 text-center space-y-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl w-full max-w-md">
                  <div className="text-3xl">📦</div>
                  <h4 className="text-sm font-bold text-slate-900 break-all">{inferredFileName}</h4>
                  <a
                    href={effectiveFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={inferredFileName}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดดู / ดาวน์โหลดไฟล์แนบ ↗</span>
                  </a>
                </div>
              ) : hasLink && externalLinkInfo ? (
                externalLinkInfo.canEmbed && externalLinkInfo.embedUrl ? (
                  <div className="w-full space-y-2">
                    <iframe
                      src={externalLinkInfo.embedUrl}
                      title={inferredFileName}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full h-[50vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
                      <span className="font-bold text-teal-700">
                        {externalLinkInfo.iconEmoji} {externalLinkInfo.platformLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          ขยายเต็มจอ
                        </button>
                        <a
                          href={externalLinkInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>เปิดในแท็บใหม่ ↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl w-full max-w-md">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm text-xl">
                      {externalLinkInfo.iconEmoji}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00C4CC] to-indigo-600 text-white font-black text-[11px]">
                        {externalLinkInfo.platformLabel}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2 break-all">
                        {externalLinkInfo.url}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        คลิกปุ่มด้านล่างเพื่อเปิดดูผลงานบน {externalLinkInfo.platformLabel}
                      </p>
                    </div>
                    <a
                      href={externalLinkInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>เปิดดูผลงาน {externalLinkInfo.platformLabel} ↗</span>
                    </a>
                  </div>
                )
              ) : !hasText ? (
                <div className="p-8 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">ไม่พบไฟล์ผลงาน</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      นักเรียนอาจยังไม่ได้แนบไฟล์ หรือไฟล์อยู่ในคิวประมวลผล
                    </p>
                  </div>
                </div>
              ) : null}
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
                  <span>
                    {currentItem.status === 'RETURNED' || (currentItem as any).status === 'RETURNED_REVISION'
                      ? 'บันทึกคะแนน (ตรวจซ้ำ)'
                      : 'บันทึกคะแนน & ตรวจคนถัดไป ➔'}
                  </span>
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

      {isPreviewOpen && (
        <ArtworkPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={currentItem.assignmentTitle}
          studentName={resolvedName}
          studentCode={currentItem.studentCode}
          assignmentId={currentItem.assignmentId}
          classroom={resolvedRoom}
          seatNo={typeof resolvedSeat === 'number' ? resolvedSeat : undefined}
          type={isPdf ? 'PDF' : hasFile ? 'IMAGE' : hasLink ? 'LINK' : 'TEXT'}
          url={effectiveFileUrl || currentItem.externalLinkUrl}
          fileUrls={imagesList.length > 0 ? imagesList : undefined}
          initialImageIndex={activeImageIdx}
          externalLinkUrl={currentItem.externalLinkUrl}
          textContent={currentItem.textContent}
          fileName={inferredFileName}
          platform={currentItem.externalPlatform}
        />
      )}
    </div>
  );
};
