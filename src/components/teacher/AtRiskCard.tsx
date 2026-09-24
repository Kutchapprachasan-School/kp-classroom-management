import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { AtRiskStudent } from '../../types/viewModels';

interface AtRiskCardProps {
  students: AtRiskStudent[];
  onSelectStudent: (student: AtRiskStudent) => void;
  onViewFullTable: () => void;
}

export const AtRiskCard: React.FC<AtRiskCardProps> = ({
  students,
  onSelectStudent,
  onViewFullTable,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 border-l-[5px] border-l-amber-500 p-5 transition-shadow hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-500 stroke-[2.2]" />
          </div>
          <h2 className="font-semibold text-slate-800 text-[14px]">
            ต้องดูแล {students.length} คน
          </h2>
        </div>

        <button
          onClick={onViewFullTable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>ดูคะแนนเต็มตาราง</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-16">เลขที่</th>
              <th className="py-2.5 px-3">ชื่อ-สกุล</th>
              <th className="py-2.5 px-3">เรื่องที่ต้องดู</th>
              <th className="py-2.5 px-3 text-center w-24">ขาด/ลา</th>
              <th className="py-2.5 px-3 text-right w-28">คะแนนรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {students.map((student) => (
              <tr
                key={student.enrollmentId}
                onClick={() => onSelectStudent(student)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                title="คลิกเพื่อดูรายละเอียดและ Radar Chart ของนักเรียน"
              >
                <td className="py-3 px-3 text-slate-600 font-medium">
                  {student.studentNo}
                </td>
                <td className="py-3 px-3 font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                  {student.name}
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {student.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-normal ${
                          tag.type === 'danger'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {tag.text}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-600">
                  {student.attendanceRatio}
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-700">
                  {student.totalScore.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
