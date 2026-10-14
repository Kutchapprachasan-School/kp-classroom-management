import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Download,
  Eye,
  Edit3,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileSubmissionDetailScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
  studentName?: string;
  studentRoom?: string;
  seatNumber?: number;
  assignmentTitle?: string;
  subjectCode?: string;
  subjectName?: string;
  submittedAt?: string;
  score?: number;
  fullScore?: number;
  feedbackText?: string;
  fileName?: string;
  fileSize?: string;
}

export const TeacherMobileSubmissionDetailScreen: React.FC<
  TeacherMobileSubmissionDetailScreenProps
> = ({
  onBack,
  onNavigate,
  studentName = 'ด.ญ.กมลวรรณ แก้วใส',
  studentRoom = 'ม.3/1',
  seatNumber = 5,
  assignmentTitle = 'ใบงานที่ 5: ศิลปะร่วมสมัยไทย (กิจกรรมสีฟ้า)',
  subjectCode = 'ญ31201',
  subjectName = 'ภาษาญี่ปุ่น',
  submittedAt = '24 ก.ย. 2569 เวลา 15:30 น.',
  score = 18,
  fullScore = 20,
  feedbackText = 'ดีมากครับ มีความคิดสร้างสรรค์ สื่อสารได้ดีขึ้น ควรเพิ่มเติมคำศัพท์ในส่วนของศิลปะร่วมสมัย',
  fileName = 'งานที่5_กมลวรรณ.pdf',
  fileSize = '2.4 MB',
}) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);
  const [currentScore, setCurrentScore] = useState(score);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3.5 pb-28 font-sans select-none text-slate-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 animate-slide-down">
          {toastMsg}
        </div>
      )}

      {/* 1. Top Header */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('mobile-class-submissions');
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          รายละเอียดงานนักเรียน
        </h1>
      </div>

      {/* 2. Student Profile Card matching Screen 4 */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-blue-200 bg-blue-50 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
            alt={studentName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-slate-900 truncate">
            {studentName}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {studentRoom} เลขที่ {seatNumber}
          </p>
        </div>
      </div>

      {/* 3. Assignment Detail Card matching Screen 4 */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
              {assignmentTitle}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {subjectCode} {subjectName}
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100">
          <span>ส่งเมื่อ</span>
          <span className="font-semibold text-slate-700">{submittedAt}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตรวจแล้ว</span>
          </span>

          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {currentScore}/{fullScore}
            </span>
            <span className="text-xs font-bold text-slate-500">คะแนน</span>
          </div>
        </div>
      </div>

      {/* 4. Feedback / Suggestions Accordion matching Screen 4 */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFeedbackOpen((prev) => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span>ความคิดเห็น / ข้อเสนอแนะ</span>
          {isFeedbackOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isFeedbackOpen && (
          <div className="px-3.5 pb-3.5 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-2.5 bg-slate-50/50">
            {feedbackText}
          </div>
        )}
      </div>

      {/* 5. Attached Files Section matching Screen 4 */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 px-1">
          ไฟล์งานที่ส่ง
        </h4>

        <div
          onClick={() => showToast(`กำลังเปิดดูตัวอย่างไฟล์ ${fileName}`)}
          className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
              PDF
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {fileName}
              </h5>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {fileSize}
              </p>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 6. Score Edit Modal when active */}
      {isEditingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">แก้ไขคะแนน</h3>
              <button
                type="button"
                onClick={() => setIsEditingScore(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">
                คะแนนที่ได้ (เต็ม {fullScore})
              </label>
              <input
                type="number"
                min={0}
                max={fullScore}
                step={0.5}
                value={currentScore}
                onChange={(e) => setCurrentScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-center text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditingScore(false);
                showToast(`✓ บันทึกคะแนนใหม่เป็น ${currentScore}/${fullScore} สำเร็จ`);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
            >
              บันทึกคะแนน
            </button>
          </div>
        </div>
      )}

      {/* 7. Bottom Dual Action Buttons matching Screen 4 */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent z-30">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsEditingScore(true)}
            className="py-3 rounded-2xl bg-white border border-blue-200/90 text-blue-700 hover:bg-blue-50/80 active:scale-98 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>แก้ไขคะแนน</span>
          </button>

          <button
            type="button"
            onClick={() => showToast(`กำลังดาวน์โหลดและเปิดไฟล์ ${fileName}`)}
            className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-white" />
            <span>ดูรายละเอียด</span>
          </button>
        </div>
      </div>
    </div>
  );
};
