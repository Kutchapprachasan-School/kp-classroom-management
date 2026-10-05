// src/components/student/StudentContactTeacherView.tsx
// หน้าติดต่อครูผู้สอน

import React from 'react';
import { MessageCircle, Mail, Phone, MapPin } from 'lucide-react';

interface StudentContactTeacherViewProps {
  onBack: () => void;
}

export const StudentContactTeacherView: React.FC<StudentContactTeacherViewProps> = ({ onBack }) => {
  const teachers = [
    {
      name: 'ครูพัสกร ปัญญา',
      role: 'ครูที่ปรึกษา ม.4/1 · หัวหน้ากลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
      subject: 'ว31103 วิทยาการคำนวณและปัญญาประดิษฐ์ AI',
      room: 'ห้องพักครูวิทยาศาสตร์ ชั้น 2 (อาคาร 3)',
      email: 'pasporm.pan@khamyang.ac.th',
      phone: '042-xxx-xxx ต่อ 104',
      badgeBg: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'ครูวิภาดา ชัยชนะ',
      role: 'ครูกลุ่มสาระฯ ภาษาต่างประเทศ (ภาษาญี่ปุ่น) · งานกิจการนักเรียน',
      subject: 'ญ31201 ภาษาญี่ปุ่น 1 / ญ33201 วัฒนธรรมอาหารญี่ปุ่น',
      room: 'ห้องพักครูภาษาต่างประเทศ ชั้น 3 (อาคาร 2)',
      email: 'wiphada.c@khamyang.ac.th',
      phone: '042-xxx-xxx ต่อ 108',
      badgeBg: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'ครูสมบัติ แก้วมณี',
      role: 'ครูกลุ่มสาระฯ คณิตศาสตร์',
      subject: 'ค31101 คณิตศาสตร์พื้นฐาน 1',
      room: 'ห้องพักครูคณิตศาสตร์ ชั้น 2 (อาคาร 1)',
      email: 'sombat.k@khamyang.ac.th',
      phone: '042-xxx-xxx ต่อ 102',
      badgeBg: 'bg-amber-100 text-amber-700',
    },
    {
      name: 'Teacher David Wilson',
      role: 'Foreign Language Department (English Teacher)',
      subject: 'อ31101 ภาษาอังกฤษเพื่อการสื่อสาร',
      room: 'Foreign Language Center Room 401',
      email: 'david.w@khamyang.ac.th',
      phone: '042-xxx-xxx ต่อ 110',
      badgeBg: 'bg-teal-100 text-teal-700',
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
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span>ติดต่อครูผู้สอน</span>
        </h2>
        <p className="text-xs text-slate-500">
          ช่องทางการติดต่อและห้องพักครูประจำวิชา
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badgeBg}`}>
                ครูประจำวิชา
              </span>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <strong>สอนวิชา:</strong> {t.subject}
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t.room}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
