// src/components/student/StudentContactTeacherView.tsx
// หน้าติดต่อครูผู้สอนและฝ่ายวิชาการ เชื่อมโยงข้อมูลครูที่ปรึกษาจริงและข้อมูลโรงเรียน

import React from 'react';
import { MessageCircle, Mail, MapPin, User, Building, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { getSchoolSettings } from '../../config/schoolSettings';
import { classroomsListData } from '../../data/mockData';

interface StudentContactTeacherViewProps {
  onBack: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentContactTeacherView: React.FC<StudentContactTeacherViewProps> = ({
  onBack,
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentRoom = currentUser?.classroomId || 'ม.3/1';

  // Find homeroom advisor
  const matchedRoom = classroomsListData.find(
    (c) => c.id === studentRoom || c.roomNumber === studentRoom || c.name.includes(studentRoom)
  );
  const advisorName = matchedRoom?.adviser || 'ครูที่ปรึกษาประจำชั้น';

  const contacts = [
    {
      name: advisorName,
      role: `ครูที่ปรึกษาประจำชั้น ${matchedRoom?.roomNumber || studentRoom}`,
      subject: 'ให้คำปรึกษาด้านการเรียน การดูแลช่วยเหลือนักเรียน และกิจกรรมโฮมรูม',
      room: 'ห้องพักครูประจำสายชั้น / ประจำห้องเรียน',
      email: `advisor.${studentRoom.replace('/', '_')}@${settings.domain || 'school.ac.th'}`,
      badgeBg: 'bg-blue-100 text-blue-700',
      icon: User,
    },
    {
      name: 'ฝ่ายบริหารวิชาการ',
      role: 'งานทะเบียนและวัดผลการศึกษา',
      subject: 'ตรวจสอบผลการเรียน งานทะเบียนนักเรียน และเอกสาร ปพ.',
      room: 'ห้องฝ่ายวิชาการ อาคารอำนวยการ',
      email: `academic@${settings.domain || 'school.ac.th'}`,
      badgeBg: 'bg-emerald-100 text-emerald-700',
      icon: Building,
    },
    {
      name: 'ฝ่ายกิจการนักเรียน',
      role: 'งานส่งเสริมวินัยและสภานักเรียน',
      subject: 'ดูแลความประพฤติ ทุนการศึกษา กิจกรรมพัฒนาผู้เรียน',
      room: 'ห้องกิจการนักเรียน อาคาร 1',
      email: `affairs@${settings.domain || 'school.ac.th'}`,
      badgeBg: 'bg-purple-100 text-purple-700',
      icon: ShieldCheck,
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
          <span>ติดต่อครูที่ปรึกษา & กลุ่มงานโรงเรียน</span>
        </h2>
        <p className="text-xs text-slate-500">
          ช่องทางการติดต่อและขอคำปรึกษาสำหรับนักเรียน {settings.nameTh}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{c.name}</h3>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeBg} mt-0.5 truncate`}>
                      {c.role}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {c.subject}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-blue-600">{c.email}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
