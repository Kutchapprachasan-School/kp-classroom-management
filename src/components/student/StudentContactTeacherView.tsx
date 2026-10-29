import React, { useState } from 'react';
import { MessageCircle, Mail, MapPin, User, Building, ShieldCheck, Phone } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { getSchoolSettings } from '../../config/schoolSettings';
import { classroomService } from '../../services/classroomService';
import { formatClassroomLabel } from '../../services/studentService';
import { MessagesView } from '../../views/MessagesView';

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
  const [activeTab, setActiveTab] = useState<'CHAT' | 'DIRECTORY'>('CHAT');
  const settings = schoolSettings || getSchoolSettings();
  const studentRoom = formatClassroomLabel(currentUser?.classroomName || currentUser?.classroomId) || 'ไม่ระบุห้อง';

  // Find homeroom advisor
  const rooms = classroomService.getClassroomsSync();
  const matchedRoom = rooms.find(
    (c) => c.id === studentRoom || c.roomNumber === studentRoom || c.name === studentRoom || c.name.includes(studentRoom)
  );
  const advisorName = matchedRoom?.adviser || 'ครูที่ปรึกษาประจำชั้น';

  const contacts = [
    {
      name: advisorName,
      role: `ครูที่ปรึกษาประจำชั้น ${matchedRoom?.roomNumber || matchedRoom?.name || studentRoom}`,
      subject: 'ให้คำปรึกษาด้านการเรียน การดูแลช่วยเหลือนักเรียน และกิจกรรมโฮมรูม',
      room: 'ห้องพักครูประจำสายชั้น / ประจำห้องเรียน',
      email: `advisor.${studentRoom.replace('ม.', '').replace('/', '_')}@${settings.domain || 'school.ac.th'}`,
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
    <div className="font-['Prompt',sans-serif] space-y-4 animate-fade-in select-none">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <span>ติดต่อครู & แชทกลุ่มห้องเรียน</span>
          </h2>
          <p className="text-xs text-slate-500">
            ช่องทางการสื่อสารกับครูที่ปรึกษาและครูประจำวิชาสำหรับนักเรียน {settings.nameTh}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('CHAT')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CHAT'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>แชทห้องเรียน & กลุ่มวิชา</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DIRECTORY'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>ข้อมูลติดต่อฝ่ายต่างๆ</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live Classroom & Course Chat */}
      {activeTab === 'CHAT' && (
        <div className="animate-fade-in pt-1">
          <MessagesView activeRole="STUDENT_GENERAL" embedded={true} currentUser={currentUser} />
        </div>
      )}

      {/* Tab 2: Contact Directory */}
      {activeTab === 'DIRECTORY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in pt-1">
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
      )}
    </div>
  );
};
