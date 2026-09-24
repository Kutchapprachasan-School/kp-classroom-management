import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { Target } from 'lucide-react';
import type { StudentProfileDetail } from '../../types/viewModels';

interface StudentRadarChartProps {
  profile: StudentProfileDetail;
}

export const StudentRadarChart: React.FC<StudentRadarChartProps> = ({ profile }) => {
  // Transform data for Recharts Radar
  const chartData = profile.radarMetrics.map((item) => ({
    subject: item.dimension,
    student: item.studentScore,
    classAvg: item.classAverage,
    fullMark: 100,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-[15px]">
            ภาพรวมของ {profile.name}
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 self-start sm:self-auto">
          {profile.subjectCode} {profile.subjectName}
        </div>
      </div>

      {/* Main Content: Radar Chart (Left) + Table & Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 items-center">
        {/* Radar Chart (Left 5 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  stroke="#cbd5e1"
                />

                {/* Class Average (Dashed Line) */}
                <Radar
                  name="ค่าเฉลี่ยของห้อง"
                  dataKey="classAvg"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  fill="#94a3b8"
                  fillOpacity={0.08}
                />

                {/* Student (Solid Blue Line with Fill) */}
                <Radar
                  name={profile.name}
                  dataKey="student"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-600 mt-2 select-none">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
              <span className="text-slate-500">ค่าเฉลี่ยของห้อง</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="font-medium text-slate-700">{profile.name}</span>
            </div>
          </div>
        </div>

        {/* Comparison Table & Insights (Right 6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2 px-3 text-left">ด้าน</th>
                  <th className="py-2 px-3 text-center">คนนี้</th>
                  <th className="py-2 px-3 text-center">เฉลี่ยห้อง</th>
                  <th className="py-2 px-3 text-center">ต่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profile.radarMetrics.map((row) => {
                  const isPositive = row.diff > 0;
                  const isZero = row.diff === 0;

                  return (
                    <tr key={row.dimension} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {row.dimension}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                        {row.studentScore}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {row.classAverage}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold min-w-9 ${
                            isZero
                              ? 'bg-slate-100 text-slate-600'
                              : isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {isPositive ? `+${row.diff}` : row.diff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Narrative Summary Box */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600 leading-relaxed">
            <p className="text-[11px] text-slate-400">
              ทุกด้านคิดเป็น 0-100 เทียบกับเพื่อนร่วมห้อง {profile.peerCount} คน ·
              คะแนนคิดจากส่วนที่กรอกไปแล้ว ไม่ใช่คะแนนเต็มทั้งเทอม
            </p>
            <div className="pt-1 flex flex-col gap-1 text-[12px]">
              <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>
                  จุดที่ตามเพื่อนมากที่สุดคือ {profile.weakestPoint.dimension} (
                  {profile.weakestPoint.diff})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  จุดแข็งคือ {profile.strongestPoint.dimension} (+
                  {profile.strongestPoint.diff})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
