import React, { useState } from 'react';
import {
  ArrowLeft,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

export interface MobileStudentSubmissionItem {
  id: string;
  orderNumber: number;
  name: string;
  timeSubmitted?: string;
  status: 'GRADED' | 'UNCHECKED' | 'NOT_SUBMITTED';
  statusLabel: string;
  scoreText?: string;
  avatarUrl: string;
}

interface TeacherMobileClassSubmissionsScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
  onSelectStudent?: (student: MobileStudentSubmissionItem) => void;
}

export const INITIAL_STUDENT_SUBMISSIONS: MobileStudentSubmissionItem[] = [
  {
    id: 'sub-1',
    orderNumber: 1,
    name: 'ด.ญ.กมลวรรณ แก้วใส',
    timeSubmitted: '10:24 น.',
    status: 'GRADED',
    statusLabel: 'ตรวจแล้ว',
    scoreText: '18/20',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'sub-2',
    orderNumber: 2,
    name: 'ด.ช.ธนภัทร ศรีสุข',
    timeSubmitted: '10:31 น.',
    status: 'GRADED',
    statusLabel: 'ตรวจแล้ว',
    scoreText: '16/20',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'sub-3',
    orderNumber: 3,
    name: 'ด.ญ.ณัฐริกา ใจดี',
    status: 'UNCHECKED',
    statusLabel: 'ยังไม่ตรวจ',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'sub-4',
    orderNumber: 4,
    name: 'ด.ช.ชยพล พรหมมาศ',
    status: 'UNCHECKED',
    statusLabel: 'ยังไม่ตรวจ',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'sub-5',
    orderNumber: 5,
    name: 'ด.ญ.ปภาวรินทร์ จันทร์สว่าง',
    timeSubmitted: '11:12 น.',
    status: 'GRADED',
    statusLabel: 'ตรวจแล้ว',
    scoreText: '19/20',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'sub-6',
    orderNumber: 6,
    name: 'ด.ช.กิตติพงษ์ ไชยวงศ์',
    status: 'UNCHECKED',
    statusLabel: 'ยังไม่ตรวจ',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
  },
];

export const TeacherMobileClassSubmissionsScreen: React.FC<
  TeacherMobileClassSubmissionsScreenProps
> = ({ onBack, onNavigate, onSelectStudent }) => {
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'ASSIGNMENTS' | 'SCORES'>('ROSTER');

  const handleStudentClick = (student: MobileStudentSubmissionItem) => {
    if (onSelectStudent) {
      onSelectStudent(student);
    }
    onNavigate('mobile-submission-detail');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3 pb-28 font-sans select-none text-slate-800">
      {/* 1. Header with Course Identity matching Screen 3 */}
      <div className="flex items-start gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('mobile-grading-list');
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200 mt-0.5">
          あ
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-slate-900 leading-tight">
              ม.3/1
            </h1>
            <span className="text-xs font-extrabold text-blue-600">
              ญ31201 ภาษาญี่ปุ่น
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            หน่วยที่ 5: ศิลปะร่วมสมัยไทย (กิจกรรมสีฟ้า)
          </p>
        </div>
      </div>

      {/* 2. Top Three Tabs: [รายชื่อนักเรียน (20)], [งานที่มอบหมาย], [คะแนน] */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('ROSTER')}
          className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'ROSTER'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          รายชื่อนักเรียน (20)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'ASSIGNMENTS'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          งานที่มอบหมาย
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SCORES')}
          className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'SCORES'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          คะแนน
        </button>
      </div>

      {/* 3. Three KPI Status Badges matching Screen 3 */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-800">ตรวจแล้ว</span>
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
            12
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-800">ยังไม่ตรวจ</span>
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
            8
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600">ขาดส่ง</span>
          <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-black flex items-center justify-center">
            0
          </span>
        </div>
      </div>

      {/* 4. Student Submission Rows matching Screen 3 */}
      <div className="space-y-2 pt-1">
        {INITIAL_STUDENT_SUBMISSIONS.map((st) => (
          <div
            key={st.id}
            onClick={() => handleStudentClick(st)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">
                {st.orderNumber}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shrink-0 bg-blue-50">
                <img
                  src={st.avatarUrl}
                  alt={st.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {st.name}
                </h4>
                {st.timeSubmitted && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    {st.timeSubmitted}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {st.status === 'GRADED' ? (
                <>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    ตรวจแล้ว
                  </span>
                  {st.scoreText && (
                    <span className="text-xs font-extrabold text-slate-800">
                      {st.scoreText}
                    </span>
                  )}
                </>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  ยังไม่ตรวจ
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Sticky Bottom Action Button matching Screen 3 */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent z-30">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              if (onSelectStudent) {
                onSelectStudent(INITIAL_STUDENT_SUBMISSIONS[0]);
              }
              onNavigate('mobile-submission-detail');
            }}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ตรวจงานทั้งหมด (8 รายการ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
