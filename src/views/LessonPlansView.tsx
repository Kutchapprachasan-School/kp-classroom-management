import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, Printer } from 'lucide-react';

export const LessonPlansView: React.FC = () => {
  const [activeWeek, setActiveWeek] = useState(1);

  const plans = [
    {
      week: 1,
      title: 'ปฐมนิเทศ และวิวัฒนาการดนตรีไทยสมัยสุโขทัย',
      standard: 'ศ 2.1 ม.3/1, ม.3/2',
      objective: 'นักเรียนสามารถเปรียบเทียบลักษณะเด่นของเครื่องดนตรีสมัยสุโขทัยได้',
      reflection: 'นักเรียนให้ความสนใจและร่วมตอบคำถามได้ดี มีสมาธิในการรับชมคลิปตัวอย่างเครื่องดนตรีโบราณ',
      problem: 'เวลาท้ายคาบไม่พอให้นักเรียนฝึกเขียนสรุปลงสมุด จึงให้ทำเป็นการบ้านแบบสั้นแทน',
      solution: 'ปรับลดเวลาการบรรยายลง 10 นาทีในคาบถัดไปเพื่อให้มีเวลาปฏิบัติมากขึ้น',
      status: 'CONDUCTED',
    },
    {
      week: 2,
      title: 'วงดนตรีไทยสมัยอยุธยา และธนบุรี',
      standard: 'ศ 2.1 ม.3/2',
      objective: 'นักเรียนสามารถจำแนกประเภทวงปี่พาทย์และวงมโหรีได้',
      reflection: 'นักเรียนสามารถจำแนกเครื่องดนตรีในวงมโหรีได้ถูกต้อง 85% ของห้อง',
      problem: 'นักเรียนบางคนสับสนระหว่างซอด้วงกับซออู้',
      solution: 'นำคลิปเปรียบเทียบเสียงสูง-ทุ้ม มาเปิดให้นักเรียนฟังซ้ำ',
      status: 'CONDUCTED',
    },
    {
      week: 3,
      title: 'ดนตรีไทยในสมัยรัตนโกสินทร์ และบทร้องเพลงล่องแม่ปิง',
      standard: 'ศ 2.2 ม.3/1',
      objective: 'นักเรียนสามารถอ่านโน้ตเพลงไทยอัตราจังหวะ 2 ชั้นได้',
      reflection: 'ยังไม่ได้สอน (กำหนดสอนสัปดาห์หน้า)',
      problem: '-',
      solution: '-',
      status: 'PLANNING',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                แผนการสอนและบันทึกหลังสอน (Lesson Plans)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                จัดทำแผนการจัดการเรียนรู้ มาตรฐานตัวชี้วัด และบันทึกผลหลังสอน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานวิชาการ</span>
          </button>
          <button
            onClick={() => alert('เปิดฟอร์มสร้างแผนการสอนใหม่')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้างแผนใหม่</span>
          </button>
        </div>
      </div>

      {/* Week Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((w) => (
          <button
            key={w}
            onClick={() => setActiveWeek(w)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              activeWeek === w
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            สัปดาห์ที่ {w}
          </button>
        ))}
      </div>

      {/* Lesson Plan Details Card */}
      {(() => {
        const plan = plans.find((p) => p.week === activeWeek) || plans[0];
        return (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600">
                  สัปดาห์ที่ {plan.week} • วิชา ศ23101 ศิลปะ
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1">
                  {plan.title}
                </h2>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                สอนแล้ว
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-700 mb-1">มาตรฐาน / ตัวชี้วัด</h3>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                    {plan.standard}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 mb-1">จุดประสงค์การเรียนรู้</h3>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                    {plan.objective}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-700 mb-1">ผลการจัดกิจกรรมการเรียนรู้</h3>
                  <p className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-slate-700">
                    {plan.reflection}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-bold text-rose-700 mb-1">ปัญหา / อุปสรรค</h4>
                    <p className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-slate-700">
                      {plan.problem}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-700 mb-1">แนวทางแก้ไข</h4>
                    <p className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700">
                      {plan.solution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
