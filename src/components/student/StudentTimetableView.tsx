import React, { useState } from 'react';
import { Calendar, Clock, Utensils, Flag } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { bellScheduleService, type BellScheduleTimelineItem } from '../../services/bellScheduleService';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';
import { cleanSlateService } from '../../services/cleanSlateService';

interface StudentTimetableViewProps {
  onBack: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({
  onBack,
  currentUser,
}) => {
  const [selectedDay, setSelectedDay] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'>('MON');
  const studentRoom = currentUser?.classroomId || 'ม.3/1';
  const isClean = cleanSlateService.isCleanSlateActive();

  // Load configured timeline from bell schedule service
  const timeline = bellScheduleService.getPeriodsTimeline();
  const scheduleDays = [
    { key: 'MON' as const, label: 'จันทร์', isToday: new Date().getDay() === 1 },
    { key: 'TUE' as const, label: 'อังคาร', isToday: new Date().getDay() === 2 },
    { key: 'WED' as const, label: 'พุธ', isToday: new Date().getDay() === 3 },
    { key: 'THU' as const, label: 'พฤหัสบดี', isToday: new Date().getDay() === 4 },
    { key: 'FRI' as const, label: 'ศุกร์', isToday: new Date().getDay() === 5 },
  ];

  // Matched subjects for this student's classroom
  const roomSubjects = TEACHER_SUBJECTS_LIST.filter((s) =>
    s.classrooms.some((c) => c === studentRoom || c.includes(studentRoom))
  );

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
          <span>ตารางเรียนประจำสัปดาห์ (ห้อง {studentRoom})</span>
        </h2>
        <p className="text-xs text-slate-500">
          โครงสร้างเวลาเรียนตามระฆังเวลาของโรงเรียน · ภาคเรียนที่ 1
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {scheduleDays.map((day) => {
          const isSelected = selectedDay === day.key;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDay(day.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{day.label}</span>
              {day.isToday && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950">
                  วันนี้
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline Periods List */}
      <div className="space-y-3">
        {timeline.map((slot: BellScheduleTimelineItem, index: number) => {
          if (slot.type === 'ASSEMBLY') {
            return (
              <div
                key={slot.id}
                className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-2xs">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{slot.label}</h3>
                    <p className="text-xs text-sky-700 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.timeRange} น. ({slot.durationMinutes} นาที)</span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-sky-700 border border-sky-200">
                  กิจกรรมหน้าเสาธง
                </span>
              </div>
            );
          }

          if (slot.type === 'LUNCH') {
            return (
              <div
                key={slot.id}
                className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{slot.label}</h3>
                    <p className="text-xs text-amber-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.timeRange} น. ({slot.durationMinutes} นาที)</span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-amber-700 border border-amber-200">
                  พักรับประทานอาหารกลางวัน
                </span>
              </div>
            );
          }

          // Regular period
          const subject = roomSubjects[index % Math.max(1, roomSubjects.length)];
          return (
            <div
              key={slot.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                  {slot.periodNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {subject ? `${subject.code} ${subject.name}` : `คาบเรียนที่ ${slot.periodNumber}`}
                    </span>
                    {subject && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {subject.credits} หน่วยกิต
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.timeRange} น.</span>
                    <span className="text-slate-300">•</span>
                    <span>ห้อง {studentRoom}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                  {isClean ? 'ตามตาราง' : 'รอเข้าเรียน'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
