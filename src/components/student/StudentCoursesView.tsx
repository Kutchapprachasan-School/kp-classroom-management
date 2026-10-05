// src/components/student/StudentCoursesView.tsx
// หน้ารายวิชาของฉัน (6 วิชาที่เรียน)

import React from 'react';
import { BookOpen, User, Clock, ArrowRight } from 'lucide-react';

interface StudentCoursesViewProps {
  onBack: () => void;
  onSelectCourse?: (courseCode: string) => void;
}

export const StudentCoursesView: React.FC<StudentCoursesViewProps> = ({
  onBack,
  onSelectCourse,
}) => {
  const courses = [
    {
      code: 'ญ31201',
      name: 'ภาษาญี่ปุ่น 1',
      classroom: 'ม.4/1',
      teacher: 'ครูวิภาดา ชัยชนะ',
      room: 'ห้อง 412',
      period: 'จันทร์ 08:30 - 10:10 น.',
      completedAssignments: '5/6 งาน',
      currentScore: '89/100',
      color: 'border-purple-200 bg-purple-50/30 text-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800',
    },
    {
      code: 'ญ33201',
      name: 'วัฒนธรรมอาหารญี่ปุ่นยุคใหม่',
      classroom: 'ม.4/1',
      teacher: 'ครูวิภาดา ชัยชนะ',
      room: 'ห้อง 412',
      period: 'อังคาร 10:20 - 12:00 น.',
      completedAssignments: '4/5 งาน',
      currentScore: '92/100',
      color: 'border-emerald-200 bg-emerald-50/30 text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      code: 'ญ21202',
      name: 'ภาษาญี่ปุ่นเพื่อการสื่อสารเบื้องต้น',
      classroom: 'ม.1/1 (เทียบโอน)',
      teacher: 'ครูวิภาดา ชัยชนะ',
      room: 'ห้อง 412',
      period: 'พุธ 13:00 - 14:40 น.',
      completedAssignments: '6/7 งาน',
      currentScore: '86/100',
      color: 'border-sky-200 bg-sky-50/30 text-sky-700',
      badgeBg: 'bg-sky-100 text-sky-800',
    },
    {
      code: 'ว31103',
      name: 'วิทยาการคำนวณและปัญญาประดิษฐ์ AI',
      classroom: 'ม.4/1',
      teacher: 'ครูพัสกร ปัญญา',
      room: 'ห้องปฏิบัติการคอมพิวเตอร์ 2',
      period: 'พฤหัสบดี 08:30 - 10:10 น.',
      completedAssignments: '8/8 งาน (ครบ)',
      currentScore: '95/100',
      color: 'border-blue-200 bg-blue-50/30 text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
    },
    {
      code: 'ค31101',
      name: 'คณิตศาสตร์พื้นฐาน 1',
      classroom: 'ม.4/1',
      teacher: 'ครูสมบัติ แก้วมณี',
      room: 'ห้อง 305',
      period: 'ศุกร์ 09:20 - 11:10 น.',
      completedAssignments: '7/8 งาน',
      currentScore: '84/100',
      color: 'border-amber-200 bg-amber-50/30 text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    {
      code: 'อ31101',
      name: 'ภาษาอังกฤษเพื่อการสื่อสาร',
      classroom: 'ม.4/1',
      teacher: 'Teacher David Wilson',
      room: 'ห้อง Sound Lab',
      period: 'อังคาร 13:00 - 14:40 น.',
      completedAssignments: '5/5 งาน (ครบ)',
      currentScore: '88/100',
      color: 'border-teal-200 bg-teal-50/30 text-teal-700',
      badgeBg: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1 flex items-center gap-1 cursor-pointer"
          >
            ← กลับหน้าหลัก
          </button>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>รายวิชาของฉัน (6 รายวิชา)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ภาคเรียนที่ 1/2569 • ชั้นมัธยมศึกษาปีที่ 4/1
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <div
            key={c.code}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${c.badgeBg}`}>
                  {c.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">{c.classroom}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>

              <div className="space-y-1 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.teacher}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.period} ({c.room})</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">งานที่ส่งแล้ว</span>
                <span className="font-bold text-slate-700">{c.completedAssignments}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">คะแนนสะสม</span>
                <span className="font-bold text-blue-600">{c.currentScore}</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectCourse?.(c.code)}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer transition-colors"
                title="ดูรายละเอียดรายวิชา"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
