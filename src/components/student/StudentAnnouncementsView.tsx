// src/components/student/StudentAnnouncementsView.tsx
// หน้ารวมประกาศและข่าวกิจกรรมโรงเรียน

import React from 'react';
import { Megaphone, Calendar } from 'lucide-react';

interface StudentAnnouncementsViewProps {
  onBack: () => void;
}

export const StudentAnnouncementsView: React.FC<StudentAnnouncementsViewProps> = ({ onBack }) => {
  const announcements = [
    {
      id: 'ann-1',
      title: 'กำหนดการสอบกลางภาค ภาคเรียนที่ 1 ปีการศึกษา 2569',
      date: '1 ต.ค. 2569',
      category: 'วิชาการ',
      categoryColor: 'bg-blue-100 text-blue-700',
      summary:
        'งานวัดและประเมินผลแจ้งตารางสอบกลางภาคเรียนที่ 1/2569 เริ่มวันที่ 14-16 ตุลาคม 2569 ขอให้นักเรียนเตรียมตัวทบทวนบทเรียนและตรวจสอบคะแนนเก็บ',
    },
    {
      id: 'ann-2',
      title: 'กิจกรรมสัปดาห์วิทยาศาสตร์และนวัตกรรม AI โรงเรียนคำยางพิทยา',
      date: '28 ก.ย. 2569',
      category: 'กิจกรรม',
      categoryColor: 'bg-emerald-100 text-emerald-700',
      summary:
        'เชิญชวนนักเรียนร่วมส่งผลงานประกวดนวัตกรรม Canva & Generative AI ในชีวิตประจำวัน ชิงเกียรติบัตรและ XP พิเศษ +100 แต้ม',
    },
    {
      id: 'ann-3',
      title: 'การเลือกตั้งคณะกรรมการสภานักเรียนประจำปีการศึกษา 2569',
      date: '25 ก.ย. 2569',
      category: 'สภานักเรียน',
      categoryColor: 'bg-purple-100 text-purple-700',
      summary:
        'เปิดรับสมัครพรรคผู้สมัครรับเลือกตั้งประธานและคณะกรรมการสภานักเรียน ผ่านระบบออนไลน์ในพอร์ทัลนักเรียน',
    },
  ];

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1 flex items-center gap-1 cursor-pointer"
        >
          ← กลับหน้าหลัก
        </button>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-rose-500" />
          <span>กิจกรรม / ประกาศโรงเรียน</span>
        </h2>
        <p className="text-xs text-slate-500">
          ข่าวสารประชาสัมพันธ์จากฝ่ายวิชาการและกิจการนักเรียน
        </p>
      </div>

      <div className="space-y-3.5">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-2"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${a.categoryColor}`}>
                {a.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {a.date}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{a.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
