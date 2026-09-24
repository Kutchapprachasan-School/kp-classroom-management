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
import type { StudentQuestItem } from '../types/viewModels';

export const StudentMissionsView: React.FC = () => {
  const [quests, setQuests] = useState<StudentQuestItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');
  const [selectedQuest, setSelectedQuest] = useState<StudentQuestItem | null>(null);
  const [submitLink, setSubmitLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await loadQuests();
      alert(`ส่งภารกิจ "${selectedQuest.title}" สำเร็จ! บันทึกส่งงานเรียบร้อยและได้รับ +${selectedQuest.xpReward} XP แล้ว!`);
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
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 cursor-pointer hover:bg-blue-50/30 transition-colors">
                <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                <p className="font-bold text-slate-700">แนบไฟล์การบ้าน (PDF, รูปภาพ, วิดีโอ)</p>
                <p className="text-[11px] text-slate-400">ขนาดไม่เกิน 50 MB</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  <span>หรือแนบลิงก์งาน (Google Drive / YouTube / Canva)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>คู่หูโมจิของคุณจะได้รับ +{selectedQuest.xpReward} XP เมื่อครูตรวจงานนี้เสร็จ</span>
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
                  {isSubmitting ? 'กำลังส่งงาน...' : 'ยืนยันการส่งงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
