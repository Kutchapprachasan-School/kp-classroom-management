// src/components/student/StudentCoursesView.tsx
// หน้ารายวิชาของฉัน เชื่อมโยงข้อมูลห้องเรียนจริงและรองรับ Clean Slate

import React from 'react';
import { BookOpen, ArrowRight, BookCheck } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { TEACHER_SUBJECTS_LIST } from '../../services/teacherCourseAssignmentService';
import { cleanSlateService } from '../../services/cleanSlateService';

interface StudentCoursesViewProps {
  onBack: () => void;
  onSelectCourse?: (courseCode: string) => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentCoursesView: React.FC<StudentCoursesViewProps> = ({
  onBack,
  onSelectCourse,
  currentUser,
}) => {
  const isClean = cleanSlateService.isCleanSlateActive();
  const studentRoom = currentUser?.classroomId || 'ม.3/1';

  // Find courses enrolled for this classroom
  const enrolledSubjects = TEACHER_SUBJECTS_LIST.filter((s) =>
    s.classrooms.some(
      (c) => c === studentRoom || studentRoom.includes(c) || c.includes(studentRoom)
    )
  );

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none">
      {/* Header */}
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
            <span>รายวิชาของฉัน ({enrolledSubjects.length} วิชา)</span>
          </h2>
          <p className="text-xs text-slate-500">
            รายวิชาที่ลงทะเบียนเรียนในภาคเรียนปัจจุบัน · ห้อง {studentRoom}
          </p>
        </div>
      </div>

      {/* Courses List */}
      {enrolledSubjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <BookCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            ยังไม่มีรายวิชาที่ลงทะเบียนในห้องเรียนนี้
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            ระบบเริ่มต้นใช้งานจริงแบบ Clean Slate คุณครูประจำวิชาจะกำหนดรายวิชาและเปิดการเรียนรู้เข้าสู่ห้องเรียน {studentRoom} ในเร็วๆ นี้ ✨
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledSubjects.map((course) => (
            <div
              key={course.code}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {course.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {course.credits} หน่วยกิต
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ห้องเรียน: {studentRoom}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>งานที่ส่งแล้ว:</span>
                  <span className="font-bold text-slate-800">
                    {isClean ? '0 งาน' : '0/0 งาน'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>คะแนนปัจจุบัน:</span>
                  <span className="font-bold text-blue-600">
                    {isClean ? 'รอประเมิน' : '- / 100'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectCourse?.(course.code)}
                className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเนื้อหาและงาน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
