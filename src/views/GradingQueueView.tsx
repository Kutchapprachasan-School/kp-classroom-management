import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Check,
  Search,
  Play,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  formatSubmissionTimestamp,
} from '../services/sgsRosterAndSubmissionService';
import { studentService, formatClassroomLabel } from '../services/studentService';
import {
  teacherCourseAssignmentService,
  getDynamicTeachingSubjects,
  getTeacherTaughtClassrooms,
  type GradingQueueItem,
} from '../services/teacherCourseAssignmentService';
import { r2StorageService } from '../services/r2StorageService';
import { ArtworkPreviewModal } from '../components/teacher/ArtworkPreviewModal';
import { GradingWorkspaceModal } from '../components/teacher/GradingWorkspaceModal';
import type { TeacherViewKey } from '../components/layout/TeacherSidebar';

interface GradingQueueViewProps {
  onNavigate?: (view: TeacherViewKey) => void;
  initialSubjectCode?: string;
  initialRoom?: string;
}

export const GradingQueueView: React.FC<GradingQueueViewProps> = ({
  onNavigate,
  initialSubjectCode,
  initialRoom,
}) => {
  const subjectsList = useMemo(() => getDynamicTeachingSubjects(), []);

  // Filter States
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    initialSubjectCode || 'ALL'
  );

  // กรองเฉพาะห้องเรียนที่สอนจริง
  const availableFilterRooms = useMemo(() => {
    return getTeacherTaughtClassrooms(selectedSubjectCode);
  }, [selectedSubjectCode]);

  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || 'ALL');

  useEffect(() => {
    if (selectedRoom !== 'ALL' && availableFilterRooms.length > 0 && !availableFilterRooms.includes(selectedRoom)) {
      setSelectedRoom('ALL');
    }
  }, [availableFilterRooms, selectedRoom]);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'RETURNED' | 'GRADED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Queue Data
  const [queueItems, setQueueItems] = useState<GradingQueueItem[]>(() =>
    teacherCourseAssignmentService.getGradingQueue()
  );

  const refreshQueue = useCallback(() => {
    setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
  }, []);

  useEffect(() => {
    window.addEventListener('kp-grading-queue-updated', refreshQueue);
    window.addEventListener('kp-sgs-roster-updated', refreshQueue);
    window.addEventListener('kps-data-sync-event', refreshQueue);

    // ซิงค์ไฟล์ที่เคยแคชไว้ในเครื่องขึ้น Cloudflare R2 อัตโนมัติ
    if (r2StorageService.isConfigured()) {
      sgsRosterAndSubmissionService.syncLocalSubmissionsToR2().then((res) => {
        if (res.syncedCount > 0) {
          refreshQueue();
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('kp-grading-queue-updated', refreshQueue);
      window.removeEventListener('kp-sgs-roster-updated', refreshQueue);
      window.removeEventListener('kps-data-sync-event', refreshQueue);
    };
  }, [refreshQueue]);

  // Scoped Queue
  const scopedQueue = useMemo(() => {
    return queueItems.filter((item) => {
      if (selectedSubjectCode !== 'ALL') {
        const cleanItemSubj = item.subjectCode?.trim().toUpperCase();
        const cleanSelectedSubj = selectedSubjectCode?.trim().toUpperCase();
        if (cleanItemSubj !== cleanSelectedSubj) return false;
      }
      if (selectedRoom !== 'ALL') {
        const normItemRoom = formatClassroomLabel(item.classroom);
        const normSelectedRoom = formatClassroomLabel(selectedRoom);
        if (normItemRoom !== normSelectedRoom) return false;
      }
      if (selectedTerm !== 'ALL' && item.academicYearTerm) {
        if (item.academicYearTerm !== selectedTerm) return false;
      }
      return true;
    });
  }, [queueItems, selectedSubjectCode, selectedRoom, selectedTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = scopedQueue.length;
    const pending = scopedQueue.filter((i) => i.status === 'PENDING_REVIEW').length;
    const returned = scopedQueue.filter((i) => i.status === 'RETURNED' || (i as any).status === 'RETURNED_REVISION').length;
    const graded = scopedQueue.filter((i) => i.status === 'GRADED').length;
    return { total, pending, returned, graded };
  }, [scopedQueue]);

  // Filtered Items (by status & search)
  const filteredSubmissions = useMemo(() => {
    return scopedQueue.filter((item) => {
      if (selectedStatus === 'PENDING' && item.status !== 'PENDING_REVIEW') return false;
      if (selectedStatus === 'RETURNED' && item.status !== 'RETURNED' && (item as any).status !== 'RETURNED_REVISION') return false;
      if (selectedStatus === 'GRADED' && item.status !== 'GRADED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesCode = item.studentCode.includes(q);
        const matchesTitle = item.assignmentTitle.toLowerCase().includes(q);
        const matchesSeat = String(item.seatNo) === q;
        if (!matchesName && !matchesCode && !matchesTitle && !matchesSeat) return false;
      }
      return true;
    });
  }, [scopedQueue, selectedStatus, searchQuery]);

  // Modals State
  const [gradingModalItem, setGradingModalItem] = useState<GradingQueueItem | null>(null);
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    studentName: string;
    studentCode?: string;
    assignmentId?: string;
    classroom?: string;
    seatNo?: number;
    type?: 'IMAGE' | 'PDF' | 'LINK';
    url?: string;
    externalLinkUrl?: string;
    fileName?: string;
    platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'YOUTUBE' | 'FIGMA' | 'OTHER';
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleStartFirstPending = () => {
    const first = filteredSubmissions.find((i) => i.status === 'PENDING_REVIEW');
    if (first) {
      setGradingModalItem(first);
    } else {
      showToast('🎉 ไม่มีงานรอตรวจในเงื่อนไขนี้');
    }
  };

  const handleSaveGrade = (itemId: string, score: number, feedback: string) => {
    const { nextPendingItem } = teacherCourseAssignmentService.submitGrade(
      itemId,
      score,
      feedback
    );
    showToast(`✓ บันทึกคะแนน (${score} คะแนน) เรียบร้อยแล้ว`);

    if (nextPendingItem) {
      setGradingModalItem(nextPendingItem);
      return;
    }

    setGradingModalItem(null);
    showToast('🎉 ตรวจครบทุกชิ้นในคิวนี้เรียบร้อยแล้ว!');
  };

  const handleReturnSubmission = (itemId: string, reason: string, note?: string) => {
    const targetItem = queueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    const { nextPendingItem } = teacherCourseAssignmentService.returnSubmission(itemId, reason, note);
    showToast(`✓ ส่งงานกลับให้ ${targetItem.studentName} แก้ไขเรียบร้อยแล้ว (${reason})`);

    if (nextPendingItem) {
      setGradingModalItem(nextPendingItem);
    } else {
      setGradingModalItem(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 font-sans animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#163A66] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slide-in">
          <Sparkles className="w-4 h-4 text-[#BFDBFE]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Page Header with Quick View Switchers */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#163A66] tracking-tight">
                คิวตรวจงานนักเรียน (SpeedGrader)
              </h1>
              {stats.pending > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                  {stats.pending} งานรอตรวจ
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7C93] mt-0.5">
              ตรวจผลงานที่นักเรียนส่งออนไลน์ทีละชิ้นตามลำดับส่งจริง พร้อมดูรูป/ไฟล์ ให้คะแนน และสติ๊กเกอร์ฟีดแบ็ก
            </p>
          </div>
        </div>

        {/* Quick View Switcher Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-blue-50 text-[#163A66] hover:text-[#3B82F6] border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#3B82F6]" />
                <span>การสั่งงาน / ภาระงาน</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('score-matrix')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-[#163A66] hover:text-emerald-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>สมุดคะแนน ปพ.5</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Context & Filters Bar */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Filter 1: รายวิชา */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">รายวิชา</label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกรายวิชา ({subjectsList.length} วิชา)</option>
              {subjectsList.map((s) => (
                <option key={s.courseCode} value={s.courseCode}>
                  {s.courseCode} {s.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: ห้องเรียน */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">ห้องเรียน</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกห้องเรียน</option>
              {availableFilterRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: ภาคเรียน */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">ภาคเรียน</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">ทุกภาคเรียน</option>
              <option value="1/2569">ภาคเรียนที่ 1/2569</option>
              <option value="2/2569">ภาคเรียนที่ 2/2569</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7C93] mb-1">ค้นหานักเรียน / ชิ้นงาน</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, เลขที่ หรือรหัส..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Status Selector */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleStartFirstPending}
            disabled={stats.pending === 0}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>เริ่มตรวจงานทันที ({stats.pending} งานรอตรวจ)</span>
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 self-start sm:self-auto overflow-x-auto">
          {(['ALL', 'PENDING', 'RETURNED', 'GRADED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedStatus === st
                  ? st === 'RETURNED'
                    ? 'bg-amber-100 text-amber-900 shadow-xs'
                    : 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#6B7C93] hover:text-[#163A66]'
              }`}
            >
              {st === 'ALL'
                ? `ทั้งหมด (${stats.total})`
                : st === 'PENDING'
                ? `รอตรวจ (${stats.pending})`
                : st === 'RETURNED'
                ? `ส่งกลับแก้ไข (${stats.returned})`
                : `ตรวจแล้ว (${stats.graded})`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Submissions Queue List */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] overflow-hidden shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-[#163A66]">
              ยังไม่มีผลงานที่นักเรียนส่งเข้ามาในเงื่อนไขนี้
            </h4>
            <p className="text-xs text-[#6B7C93]">
              เมื่อนักเรียนส่งงานออนไลน์ รายการจะปรากฏที่นี่ตามลำดับเวลาส่งจริง
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((item, idx) => {
              const isGraded = item.status === 'GRADED';
              const isPdf =
                item.submissionChannel === 'PDF_UPLOAD' || (item.fileName || '').endsWith('.pdf');
              const isDrive = Boolean(
                item.externalLinkUrl?.includes('drive.google.com') ||
                  item.externalLinkUrl?.includes('docs.google.com') ||
                  item.externalPlatform === 'GOOGLE_DRIVE'
              );
              const isLink = item.submissionChannel === 'LINK_URL' || item.externalLinkUrl || isDrive;

              // Student Info
              const resolvedStu = studentService.findStudentByCode(item.studentCode);
              const displayName =
                item.studentName && item.studentName !== item.studentCode
                  ? item.studentName
                  : resolvedStu?.student.name || `นักเรียน (${item.studentCode})`;
              const displayRoom = item.classroom || (resolvedStu?.classroomId ? formatClassroomLabel(resolvedStu.classroomId) : 'ม.3/1');
              const displaySeat = item.seatNo ?? resolvedStu?.student.no ?? idx + 1;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isGraded ? 'bg-slate-50/40 hover:bg-slate-50' : 'bg-white hover:bg-blue-50/30'
                  }`}
                >
                  {/* Left: Queue Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isGraded
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-700 shadow-2xs'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#163A66]">
                          {displayName}
                        </span>
                        <span className="text-xs text-[#6B7C93] font-medium">
                          (เลขที่ {displaySeat} • ห้อง {displayRoom} • รหัส {item.studentCode})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs font-bold text-[#3B82F6] truncate">
                          {item.subjectCode} • {item.assignmentTitle}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.sgsUnit} (เต็ม {item.maxScore})
                        </span>
                      </div>

                      <p className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>ส่งเมื่อ {formatSubmissionTimestamp(item.submittedAtText || item.submittedTimestamp)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const resolvedR2 = r2StorageService.resolvePublicViewUrl(item.filePreviewUrl);
                        const isR2Available = Boolean(
                          resolvedR2 &&
                            (resolvedR2.startsWith('http://') || resolvedR2.startsWith('https://')) &&
                            !resolvedR2.startsWith('data:')
                        );
                        const cachedFile = sgsRosterAndSubmissionService.getSubmissionFileUrl(
                          item.assignmentId,
                          item.studentCode,
                          item.fileName
                        );
                        const fileUrl = isR2Available ? resolvedR2 : (cachedFile || resolvedR2 || item.filePreviewUrl);
                        setPreviewItem({
                          title: item.assignmentTitle,
                          studentName: displayName,
                          studentCode: item.studentCode,
                          assignmentId: item.assignmentId,
                          classroom: displayRoom,
                          seatNo: typeof displaySeat === 'number' ? displaySeat : item.seatNo,
                          type: isPdf ? 'PDF' : fileUrl ? 'IMAGE' : isLink ? 'LINK' : 'IMAGE',
                          url: fileUrl || item.externalLinkUrl,
                          externalLinkUrl: item.externalLinkUrl,
                          fileName: item.fileName,
                          platform: isDrive ? 'GOOGLE_DRIVE' : item.externalPlatform,
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#163A66] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-4 h-4 text-[#3B82F6]" />
                      <span>ดูไฟล์ที่ส่ง</span>
                    </button>

                    {isGraded ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>ตรวจแล้ว ({item.score}/{item.maxScore})</span>
                      </span>
                    ) : item.status === 'RETURNED' || (item as any).status === 'RETURNED_REVISION' ? (
                      <span className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>ส่งกลับแก้ไขแล้ว</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setGradingModalItem(item)}
                        className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ตรวจงาน</span>
                      </button>
                    )}

                    {isGraded && (
                      <button
                        type="button"
                        onClick={() => setGradingModalItem(item)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#163A66] text-xs font-semibold cursor-pointer"
                        title="แก้ไขคะแนน"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Grading Workspace Modal (SpeedGrader) */}
      <GradingWorkspaceModal
        isOpen={gradingModalItem !== null}
        onClose={() => setGradingModalItem(null)}
        currentItem={gradingModalItem}
        allItems={filteredSubmissions}
        onSaveGrade={handleSaveGrade}
        onReturnSubmission={handleReturnSubmission}
        onSelectQueueItem={(item) => setGradingModalItem(item)}
      />

      {/* 6. Artwork & File Preview Modal */}
      {previewItem && (
        <ArtworkPreviewModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
          studentName={previewItem.studentName}
          studentCode={previewItem.studentCode}
          assignmentId={previewItem.assignmentId}
          classroom={previewItem.classroom}
          seatNo={previewItem.seatNo}
          type={previewItem.type}
          url={previewItem.url}
          externalLinkUrl={previewItem.externalLinkUrl}
          fileName={previewItem.fileName}
          platform={previewItem.platform}
        />
      )}
    </div>
  );
};
