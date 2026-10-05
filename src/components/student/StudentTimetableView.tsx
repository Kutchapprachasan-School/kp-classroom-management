// src/components/student/StudentTimetableView.tsx
// หน้าตารางเรียนของนักเรียน (ตรงตาม "วันนี้มี 4 คาบ" ในแดชบอร์ด)

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface StudentTimetableViewProps {
  onBack: () => void;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({ onBack }) => {
  const [selectedDay, setSelectedDay] = useState<'TUE' | 'MON' | 'WED' | 'THU' | 'FRI'>('TUE');

  const scheduleDays = [
    { key: 'MON' as const, label: 'จันทร์', count: '4 คาบ' },
    { key: 'TUE' as const, label: 'อังคาร (วันนี้)', count: '4 คาบ', isToday: true },
    { key: 'WED' as const, label: 'พุธ', count: '5 คาบ' },
    { key: 'THU' as const, label: 'พฤหัสบดี', count: '4 คาบ' },
    { key: 'FRI' as const, label: 'ศุกร์', count: '4 คาบ' },
  ];

  const todayPeriods = [
    {
      period: 1,
      time: '08:30 - 09:20 น.',
      code: 'ญ31201',
      name: 'ภาษาญี่ปุ่น 1',
      room: 'ห้อง 412',
      teacher: 'ครูวิภาดา ชัยชนะ',
      status: 'COMPLETED',
      statusText: 'เรียนแล้ว',
    },
    {
      period: 2,
      time: '09:20 - 10:10 น.',
      code: 'ว31103',
      name: 'วิทยาการคำนวณและปัญญาประดิษฐ์ AI',
      room: 'ห้องปฏิบัติการคอมพิวเตอร์ 2',
      teacher: 'ครูพัสกร ปัญญา',
      status: 'COMPLETED',
      statusText: 'เรียนแล้ว',
    },
    {
      period: 3,
      time: '10:20 - 11:10 น.',
      code: 'ค31101',
      name: 'คณิตศาสตร์พื้นฐาน 1',
      room: 'ห้อง 412',
      teacher: 'ครูสมบัติ แก้วมณี',
      status: 'UPCOMING',
      statusText: 'คาบถัดไป',
    },
    {
      period: 4,
      time: '11:10 - 12:00 น.',
      code: 'อ31101',
      name: 'ภาษาอังกฤษเพื่อการสื่อสาร',
      room: 'Sound Lab',
      teacher: 'Teacher David Wilson',
      status: 'PENDING',
      statusText: 'รอเรียน',
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
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>ตารางเรียน • ม.4/1</span>
        </h2>
        <p className="text-xs text-slate-500">
          ภาคเรียนที่ 1/2569 • วันนี้มี 4 คาบเรียน
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {scheduleDays.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setSelectedDay(d.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedDay === d.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{d.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedDay === d.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {d.count}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Periods */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-sm font-bold text-slate-800">
            {selectedDay === 'TUE' ? '📅 วันนี้: วันอังคาร (4 คาบ)' : '📅 ตารางเรียนประจำวัน'}
          </span>
          <span className="text-xs text-slate-400">เข้าแถวเคารพธงชาติ 07:45 น.</span>
        </div>

        <div className="space-y-3">
          {todayPeriods.map((p) => (
            <div
              key={p.period}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                p.status === 'UPCOMING'
                  ? 'border-blue-400 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200/80 bg-slate-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    p.status === 'UPCOMING'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  คาบ {p.period}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.2 rounded">
                      {p.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {p.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {p.teacher}
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-center">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600'
                      : p.status === 'UPCOMING'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {p.statusText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
