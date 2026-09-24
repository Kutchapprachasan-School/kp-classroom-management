import React from 'react';
import type { SarGradeMatrixRow } from '../../types/viewModels';

interface SarGradeMatrixTableProps {
  rows: SarGradeMatrixRow[];
}

export const SarGradeMatrixTable: React.FC<SarGradeMatrixTableProps> = ({ rows }) => {
  const formatCell = (item: { count: number; percent: number }) => {
    if (item.count === 0) return <span className="text-slate-300">—</span>;
    return (
      <span className="font-medium text-slate-700">
        {item.count}{' '}
        <span className="text-[11px] text-slate-400 font-normal">
          ({item.percent}%)
        </span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card space-y-4">
      <h3 className="font-bold text-slate-800 text-sm">
        การกระจายเกรดโดยประมาณ
      </h3>

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
              <th className="py-2.5 px-3 min-w-32">รายวิชา / ระดับ</th>
              <th className="py-2.5 px-3 text-center">4</th>
              <th className="py-2.5 px-3 text-center">3.5</th>
              <th className="py-2.5 px-3 text-center">3</th>
              <th className="py-2.5 px-3 text-center">2.5</th>
              <th className="py-2.5 px-3 text-center">2</th>
              <th className="py-2.5 px-3 text-center">1.5</th>
              <th className="py-2.5 px-3 text-center">1</th>
              <th className="py-2.5 px-3 text-center">0</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800">
                  {row.subjectLabel}
                </td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g4)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g3_5)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g3)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g2_5)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g2)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g1_5)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g1)}</td>
                <td className="py-3 px-3 text-center">{formatCell(row.grades.g0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
