import React, { useState } from 'react';
import {
  PenTool,
  Lock,
  Plus,
  BarChart2,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { examsData } from '../data/mockData';
import type { ExamItem } from '../types/viewModels';

export const ExamManagementView: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'GRADING' | 'LOCKED' | 'UPCOMING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  const filteredExams = examsData.filter((exam) => {
    const matchesFilter = filter === 'ALL' || exam.status === filter;
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Header & Create Exam Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                จัดการการสอบ (Exam Management)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => alert('เปิดฟอร์มสร้างชุดข้อสอบใหม่และผูกหน่วย SGS')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ สร้างชุดข้อสอบใหม่</span>
        </button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center gap-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({examsData.length})
          </button>
          <button
            onClick={() => setFilter('GRADING')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'GRADING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            กำลังกรอกคะแนน
          </button>
          <button
            onClick={() => setFilter('LOCKED')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'LOCKED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ล็อกคะแนนแล้ว (Locked)
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'UPCOMING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            เร็วๆ นี้
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อการสอบหรือรหัสวิชา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Exam List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {exam.subjectCode}
                </span>

                {exam.status === 'LOCKED' && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    LOCKED
                  </span>
                )}
                {exam.status === 'GRADING' && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold">
                    กำลังกรอกคะแนน
                  </span>
                )}
                {exam.status === 'UPCOMING' && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-semibold">
                    เร็วๆ นี้
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {exam.title}
              </h3>

              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>หน่วย SGS: {exam.sgsUnitName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>วันที่สอบ: {exam.date} • {exam.roomName}</span>
                </div>
              </div>
            </div>

            {/* Score Stats if Graded */}
            {exam.averageScore !== undefined && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs grid grid-cols-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">เฉลี่ย</div>
                  <div className="font-bold text-slate-700">{exam.averageScore}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">สูงสุด</div>
                  <div className="font-bold text-emerald-600">{exam.highestScore}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">ต่ำสุด</div>
                  <div className="font-bold text-rose-600">{exam.lowestScore}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedExam(exam)}
                className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors text-center"
              >
                {exam.status === 'LOCKED' ? 'ดูผลการสอบ' : 'เปิดตารางกรอกคะแนน'}
              </button>
              <button
                onClick={() =>
                  alert(`วิเคราะห์ข้อสอบ (Item Analysis): ${exam.title}\nค่าความยาก p: 0.62 (ปานกลาง)\nอำนาจจำแนก r: 0.45 (ดีมาก)`)
                }
                className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                title="วิเคราะห์คุณภาพข้อสอบ (Item Analysis)"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Fast Inline Score Grid Preview */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  ตารางกรอกคะแนน: {selectedExam.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedExam.subjectCode} • เต็ม {selectedExam.maxScore} คะแนน (คะแนนเกิน {selectedExam.maxScore} จะถูก DB Trigger บล็อก)
                </p>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2 px-3 w-16">เลขที่</th>
                    <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2 px-3 text-center w-32">คะแนนที่ได้ (เต็ม {selectedExam.maxScore})</th>
                    <th className="py-2 px-3 text-center w-24">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold">1</td>
                    <td className="py-2.5 px-3">ด.ช. กฤษณะ ศรีสมบูรณ์</td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        defaultValue={18}
                        max={selectedExam.maxScore}
                        min={0}
                        className="w-20 text-center py-1 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px]">
                        บันทึกแล้ว
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold">2</td>
                    <td className="py-2.5 px-3">ด.ช. จิรายุ เดชปันคำ</td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        defaultValue={19.5}
                        max={selectedExam.maxScore}
                        min={0}
                        className="w-20 text-center py-1 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px]">
                        บันทึกแล้ว
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold">3</td>
                    <td className="py-2.5 px-3">ด.ช. ชัยมงคล วงศ์บุตร</td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        placeholder="ยังไม่มี"
                        max={selectedExam.maxScore}
                        min={0}
                        className="w-20 text-center py-1 border border-amber-300 bg-amber-50/50 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px]">
                        ค้างกรอก
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                รองรับการใช้แป้นลูกศร ↑ ↓ และ Enter เพื่อเลื่อนช่องกรอกคะแนนอัตโนมัติ
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    alert('บันทึกคะแนนสอบเรียบร้อยแล้ว');
                    setSelectedExam(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  บันทึกคะแนน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
