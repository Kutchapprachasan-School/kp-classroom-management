import React from 'react';
import type { SarCourseSummary } from '../../types/viewModels';

interface SarCoursesTableProps {
  courses: SarCourseSummary[];
  totalStudents: number;
  totalPassedCount: number;
  overallPassPercentage: number;
}

export const SarCoursesTable: React.FC<SarCoursesTableProps> = ({
  courses,
  totalStudents,
  totalPassedCount,
  overallPassPercentage,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
              </th>
              <th className="py-2.5 px-3 font-medium">รหัสวิชา</th>
              <th className="py-2.5 px-3 font-medium">รายวิชา</th>
              <th className="py-2.5 px-3 font-medium text-center">ระดับ</th>
              <th className="py-2.5 px-3 font-medium">ห้อง</th>
              <th className="py-2.5 px-3 text-center font-medium">นักเรียน</th>
              <th className="py-2.5 px-3 text-center font-medium">กรอกแล้ว</th>
              <th className="py-2.5 px-3 text-right font-medium">
                เฉลี่ย (เต็ม 100)
              </th>
              <th className="py-2.5 px-3 text-right font-medium text-emerald-700">
                ได้เกรด 3 ขึ้นไป
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800">
                  {course.subjectCode}
                </td>
                <td className="py-3 px-3 font-medium text-slate-700">
                  {course.subjectName}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium border border-blue-100">
                    {course.level}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500 font-normal max-w-xs truncate">
                  {course.rooms}
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-700">
                  {course.studentCount}
                </td>
                <td className="py-3 px-3 text-center text-slate-400">
                  {course.gradedRatio}
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-700">
                  {course.averageScore.toFixed(1)}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                  {course.passedThresholdPercent.toFixed(1)}% ({course.passedThresholdCount}/{course.studentCount} คน)
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-slate-50/80 font-semibold text-slate-800 border-t-2 border-slate-200">
              <td className="py-3 px-3">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
              </td>
              <td colSpan={4} className="py-3 px-3 text-slate-800">
                รวมทุกรายวิชา
              </td>
              <td className="py-3 px-3 text-center font-bold">{totalStudents}</td>
              <td className="py-3 px-3 text-center text-slate-400">-</td>
              <td className="py-3 px-3 text-right text-slate-400">-</td>
              <td className="py-3 px-3 text-right text-emerald-800 font-bold">
                {overallPassPercentage.toFixed(1)}% ({totalPassedCount}/{totalStudents} คน)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
