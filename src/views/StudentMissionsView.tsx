import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Link,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import { sgsRosterAndSubmissionService } from '../services/sgsRosterAndSubmissionService';
import type { StudentQuestItem } from '../types/viewModels';

export const StudentMissionsView: React.FC = () => {
  const [quests, setQuests] = useState<StudentQuestItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');
  const [selectedQuest, setSelectedQuest] = useState<StudentQuestItem | null>(null);
  const [submitLink, setSubmitLink] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('perspective_2point_45102.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadQuests = async () => {
    const data = await gamificationService.getQuests();
    setQuests(data);
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const filteredQuests = quests.filter((q) => {
    if (filter === 'ALL') return true;
    return q.status === filter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuest) return;

    setIsSubmitting(true);
    try {
      await gamificationService.submitQuest(selectedQuest.id, submitLink, 'stu-2');
      // ซิงก์ไฟล์งานนักเรียนขึ้น Cloudflare R2 พร้อมบีบอัด WebP ทันที เพื่อให้ครูเห็นในตารางส่งงาน ปพ.5 ทันที
      sgsRosterAndSubmissionService.submitStudentWorkToR2({
        assignmentId: 'asg-3',
        studentCode: '45102',
        workTitle: selectedQuest.title,
        fileName: selectedFileName || 'student_work_45102.jpg',
        originalSizeKb: 4250,
        compressedSizeKb: 148,
        externalLinkUrl: submitLink.trim() || undefined,
        academicYearTerm: '1/2569',
      });
      await loadQuests();
      setToastMsg(
        `☁️ อัปโหลด "${selectedFileName.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" (บีบอัดเหลือ 148 KB) เข้า Cloudflare R2 สำเร็จ! (+${selectedQuest.xpReward} XP)`
      );
      setTimeout(() => setToastMsg(null), 3500);
      setSelectedQuest(null);
      setSubmitLink('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ภารกิจ / การบ้าน (Student Missions)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ทำการบ้าน ส่งไฟล์งานสะสมแต้ม XP เพื่ออัปเลเวลคู่หูสัตว์เลี้ยงโมจิ
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'ALL' ? 'bg-[#0f2e5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({quests.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'PENDING' ? 'bg-[#0f2e5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รอส่งงาน
          </button>
          <button
            onClick={() => setFilter('SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'SUBMITTED' ? 'bg-[#0f2e5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ส่งแล้ว
          </button>
        </div>
      </div>

      {/* Quest Cards List */}
      <div className="space-y-3">
        {filteredQuests.map((quest) => (
          <div
            key={quest.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                  {quest.subjectTitle}
                </span>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  {quest.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {quest.dueDateText}
                  </span>
                  <span>•</span>
                  <span>เต็ม {quest.maxScore} คะแนน</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end w-full sm:w-auto gap-2">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  {quest.statusLabel}
                </span>

                <button
                  onClick={() => setSelectedQuest(quest)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0e3c88] hover:bg-[#0b3272] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <span>{quest.status === 'PENDING' ? 'ส่งงานทันที' : 'ดูรายละเอียด'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />
                <span>+{quest.xpReward} XP เมื่อตรวจผ่าน</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Homework Submission Drawer */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600">{selectedQuest.subjectTitle}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedQuest.title}</h3>
              </div>
              <button
                onClick={() => setSelectedQuest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                {/* เลือกรูปแบบการส่งงานแยกชัดเจน ไม่ซ้ำซ้อน */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSubmitLink('')}
                    className={`py-2 px-3 rounded-lg transition-colors ${
                      !submitLink
                        ? 'bg-white text-teal-800 shadow-2xs border border-teal-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🖼️ 1. อัปโหลดรูป / PDF (ขึ้น R2)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSubmitLink('https://www.canva.com/design/DAFxArtwork45102/view')
                    }
                    className={`py-2 px-3 rounded-lg transition-colors ${
                      submitLink
                        ? 'bg-white text-indigo-800 shadow-2xs border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎨 2. ส่งลิงก์ Canva / ลิงก์วิดีโอ
                  </button>
                </div>

                {!submitLink ? (
                  <label className="block p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 cursor-pointer hover:bg-blue-50/30 transition-colors">
                    <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                    <p className="font-bold text-slate-700">
                      อัปโหลดเฉพาะไฟล์รูปภาพ (.webp) หรือเอกสาร PDF เข้า Cloudflare R2
                    </p>
                    <p className="text-[11px] text-teal-700 font-semibold">
                      ไฟล์ที่เลือก: {selectedFileName} → บีบอัดเหลือ ~148 KB (.webp) ประหยัดพื้นที่ 96%
                    </p>
                    <p className="text-[11px] text-rose-600 font-medium">
                      🚫 ห้ามอัปโหลดไฟล์วิดีโอขนาดใหญ่! หากเป็นวิดีโอหรืองานออกแบบใน Canva ต้องกดเลือกแท็บ &ldquo;ส่งลิงก์ Canva / ลิงก์วิดีโอ&rdquo; เท่านั้น
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (/\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)) {
                          setToastMsg(
                            '🚫 ระบบไม่อนุญาตให้อัปโหลดไฟล์วิดีโอเข้า R2 กรุณาส่งเป็นลิงก์ Canva หรือลิงก์วิดีโอแทนครับ'
                          );
                          setTimeout(() => setToastMsg(null), 4000);
                          setSubmitLink('https://www.canva.com/design/DAFxArtwork45102/view');
                          return;
                        }
                        setSelectedFileName(f.name);
                      }}
                    />
                  </label>
                ) : (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2">
                    <label className="block font-bold text-indigo-950 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-indigo-600" />
                      <span>วางลิงก์ชิ้นงานที่นักเรียนทำไว้ใน Canva หรือลิงก์วิดีโอขนาดใหญ่</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.canva.com/design/..."
                      value={submitLink}
                      onChange={(e) => setSubmitLink(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-none"
                    />
                    <p className="text-[11px] text-indigo-700">
                      ✓ ส่งเฉพาะลิงก์โดยตรง ไม่ซ้ำซ้อน และไม่ใช้พื้นที่เก็บไฟล์ Cloudflare R2 ของโรงเรียน (0 KB)
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ส่งไฟล์ตรงเข้า Cloudflare R2 โดยไม่ต้องล็อกอิน Google Drive และได้รับ +{selectedQuest.xpReward} XP</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuest(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0e3c88] hover:bg-[#0b3272] text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'กำลังอัปโหลดขึ้น R2...' : '☁️ อัปโหลดขึ้น R2 & ส่งงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
