import React, { useState } from 'react';
import { BookMarked, Plus, Layers, Edit3, Trash2 } from 'lucide-react';
import { coursesCurriculumData } from '../data/mockData';
import type { CourseCurriculumItem } from '../types/viewModels';

export const CoursesCurriculumView: React.FC = () => {
  const [courses] = useState<CourseCurriculumItem[]>(coursesCurriculumData);
  const [selectedCourse, setSelectedCourse] = useState<CourseCurriculumItem>(courses[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                รายวิชา / หลักสูตร (Courses & Curriculum)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                กำหนดโครงสร้างหน่วยการเรียนรู้ สัดส่วนคะแนน SGS และจำนวนหน่วยกิต
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => alert('เปิดฟอร์มเพิ่มรายวิชาใหม่ตามโครงสร้างหลักสูตรแกนกลาง')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มรายวิชาใหม่</span>
        </button>
      </div>

      {/* Main Grid: Course selector (Left 4) + SGS Unit Structure (Right 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Course Cards List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="font-bold text-slate-800 text-xs sm:text-sm">
            รายวิชาในกลุ่มสาระฯ ({courses.length})
          </h2>

          {courses.map((course) => {
            const isSelected = selectedCourse.id === course.id;
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                    : 'bg-white border-slate-100 shadow-card hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-blue-700">
                    {course.code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {course.credits} หน่วยกิต
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug">
                  {course.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {course.level} • {course.periodsPerWeek} คาบ/สัปดาห์
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Course SGS Structure Details */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-blue-600 font-semibold">{selectedCourse.code}</div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                โครงสร้างหน่วยการเรียนรู้ SGS: {selectedCourse.name}
              </h2>
            </div>

            <button
              onClick={() => alert('เปิดหน้าต่างเพิ่มหน่วยการเรียนรู้ SGS ใหม่')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มหน่วย SGS</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">ชื่อหน่วยการเรียนรู้</th>
                  <th className="py-2.5 px-3 text-center">คอลัมน์ระบบ SGS</th>
                  <th className="py-2.5 px-3 text-right">สัดส่วนคะแนนเต็ม</th>
                  <th className="py-2.5 px-3 text-center w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedCourse.units.map((unit, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>{unit.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-[11px] font-mono">
                        {unit.sgsRef}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-700">
                      {unit.maxScore} คะแนน
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button className="p-1 hover:text-blue-600 rounded">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 hover:text-rose-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td colSpan={2} className="py-3 px-3">
                    รวมคะแนนเต็มทั้งภาคเรียน
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-extrabold text-sm">
                    {selectedCourse.units.reduce((sum, u) => sum + u.maxScore, 0)} คะแนน
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-600 text-[11px]">
                    ✓ สมบูรณ์
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
