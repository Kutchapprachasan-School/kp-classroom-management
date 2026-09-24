import React from 'react';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export const StudentGradebookView: React.FC = () => {
  const sgsUnits = [
    { name: 'หน่วยที่ 1: ทักษะการวาดภาพและทฤษฎีสี', maxScore: 15, studentScore: 13.5, sgsRef: 'หน่วยที่ 1', status: 'บันทึกแล้ว' },
    { name: 'หน่วยที่ 2: ประวัติศาสตร์ศิลป์และภูมิปัญญา', maxScore: 20, studentScore: 16.0, sgsRef: 'หน่วยที่ 2', status: 'บันทึกแล้ว' },
    { name: 'หน่วยที่ 3: สอบปฏิบัติและทฤษฎีกลางภาค', maxScore: 20, studentScore: 17.5, sgsRef: 'กลางภาค', status: 'บันทึกแล้ว' },
    { name: 'หน่วยที่ 4: การสร้างสรรค์ประยุกต์ศิลป์', maxScore: 15, studentScore: 12.5, sgsRef: 'หน่วยที่ 3', status: 'บันทึกแล้ว' },
    { name: 'หน่วยที่ 5: สอบประเมินผลปลายภาค', maxScore: 30, studentScore: 23.0, sgsRef: 'ปลายภาค', status: 'รออนุมัติผล' },
  ];

  const totalScore = sgsUnits.reduce((acc, u) => acc + u.studentScore, 0);
  const totalMax = sgsUnits.reduce((acc, u) => acc + u.maxScore, 0);

  // Radar data
  const radarData = [
    { subject: 'คะแนนเก็บ', student: 86, classAvg: 78 },
    { subject: 'คะแนนสอบ', student: 81, classAvg: 72 },
    { subject: 'ส่งงานตรงเวลา', student: 92, classAvg: 80 },
    { subject: 'เวลาเรียน', student: 95, classAvg: 88 },
    { subject: 'พฤติกรรม', student: 88, classAvg: 82 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              สมุดคะแนนและสถิติการเรียนรู้ (My Gradebook)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              วิชา ศ23101 ศิลปะ ภาคเรียนที่ 1/2569 · ม.3/8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ผ่านเกณฑ์เวลาเรียน (มส.)</span>
          </span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Grade Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">เกรดเฉลี่ยคาดการณ์</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">3.5</span>
            <span className="text-xs text-slate-400">({totalScore.toFixed(1)} / {totalMax} คะแนน)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            ต้องการอีก 1.5 คะแนนเพื่อแตะระดับเกรด 4.0
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">เวลาเรียนสะสม</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">95%</span>
            <span className="text-xs text-slate-400">(38 จาก 40 คาบ)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            เกินเกณฑ์ 80% ปลอดภัย ไม่มีสิทธิ์ติด มส.
          </div>
        </div>

        {/* Classroom Rank Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">อันดับคะแนนในห้อง</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">#8</span>
            <span className="text-xs text-slate-400">จากนักเรียน 35 คน</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            อยู่ในกลุ่ม Top 25% ของห้อง ม.3/8
          </div>
        </div>
      </div>

      {/* Two Column Section: SGS Units Table (7 cols) + Radar Chart (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SGS Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                ตารางคะแนนตามโครงสร้าง SGS (100 คะแนนเต็ม)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">กลุ่มสาระฯ ศิลปะ</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sgsUnits.map((u, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-800">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {u.sgsRef}
                    </span>
                    <span>เต็ม {u.maxScore} คะแนน</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-800">
                    {u.studentScore} <span className="text-xs font-normal text-slate-400">/ {u.maxScore}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    u.status === 'บันทึกแล้ว' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer Total */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm bg-slate-50/50 p-3 rounded-2xl">
            <span className="text-slate-700">คะแนนรวมทั้งสิ้น</span>
            <span className="text-blue-600 text-base">
              {totalScore.toFixed(1)} / {totalMax} คะแนน ({((totalScore / totalMax) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 5-Axis Spider Radar Chart */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">
              สมรรถนะการเรียนรู้ 5 ด้าน
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-medium">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                คุณ
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                เฉลี่ยห้อง
              </span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  stroke="#cbd5e1"
                />
                <Radar
                  name="คะแนนเฉลี่ยห้อง"
                  dataKey="classAvg"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <Radar
                  name="คะแนนของคุณ"
                  dataKey="student"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1">
            <span className="font-bold text-blue-900">💡 การวิเคราะห์ตนเอง:</span>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              จุดเด่นของคุณคือ <span className="font-semibold">เวลาเรียน (95%)</span> และ <span className="font-semibold">การส่งงานตรงเวลา (92%)</span> ซึ่งสูงกว่าค่าเฉลี่ยห้อง หากเพิ่มคะแนนสอบทบทวนเนื้อหาปลายภาค โอกาสได้เกรด 4.0 สูงมาก!
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Attendance Detail & Teacher Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>สถิติการมาเรียน (40 คาบทั้งหมด)</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-emerald-700 font-bold text-lg">36</div>
              <div className="text-[10px] text-emerald-600">เข้าเรียนตรงเวลา</div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-amber-700 font-bold text-lg">2</div>
              <div className="text-[10px] text-amber-600">มาสาย</div>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-blue-700 font-bold text-lg">2</div>
              <div className="text-[10px] text-blue-600">ลากิจ/ลาป่วย</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-400 font-bold text-lg">0</div>
              <div className="text-[10px] text-slate-400">ขาดเรียน</div>
            </div>
          </div>
        </div>

        {/* Teacher Feedback Note */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>บันทึกความเห็นจากคุณครูผู้สอน</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "ด.ช. จิรายุ มีความตั้งใจและมีระเบียบวินัยดีมากในการเรียนวิชาศิลปะ ผลงานวาดภาพทฤษฎีสีทำได้ประณีต ส่งงานตรงเวลา ขอให้รักษามาตรฐานความตั้งใจนี้ต่อไปครับ"
            </p>
            <div className="text-right text-[10px] text-slate-400 font-medium">
              — ครูภาสภูมิ เรืองปราชญ์ (18 ก.ย. 2569)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
