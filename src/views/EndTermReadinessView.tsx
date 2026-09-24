import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  PenTool,
  Compass,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { assignmentService } from '../services/assignmentService';
import { scoreService } from '../services/scoreService';

interface ReadinessTask {
  id: string;
  title: string;
  type: string;
  emptyCount: number;
  hasCloseBtn: boolean;
}

export const EndTermReadinessView: React.FC = () => {
  const [tasks, setTasks] = useState<ReadinessTask[]>([
    {
      id: 't-1',
      title: 'โน้ตล่องแม่ปิง',
      type: 'box',
      emptyCount: 6,
      hasCloseBtn: true,
    },
    {
      id: 't-2',
      title: 'สอบอ่านโน้ตล่องแม่ปิง 1 บรรทัด',
      type: 'pencil',
      emptyCount: 6,
      hasCloseBtn: false,
    },
    {
      id: 't-3',
      title: 'ร้องโน้ตพื้นฐาน',
      type: 'pencil',
      emptyCount: 3,
      hasCloseBtn: false,
    },
    {
      id: 't-4',
      title: 'โน้ตเพลงของตนเอง',
      type: 'box',
      emptyCount: 2,
      hasCloseBtn: true,
    },
  ]);

  const [studentsList, setStudentsList] = useState([
    { no: 1, name: 'สุภคม -', score: '' },
    { no: 2, name: 'ด.ช. ทัตธน คำฝั้น', score: '3' },
    { no: 3, name: 'ด.ช. ทานต์ธีรา -', score: '' },
    { no: 4, name: 'ด.ช. จตุภัทร โนแก้ว', score: '3' },
    { no: 5, name: 'ด.ช. จิรโชติ มะนาว', score: '2' },
    { no: 6, name: 'ด.ช. เด่นภูมิ แจ้งประเสริฐ', score: '3' },
    { no: 7, name: 'ด.ช. ธนภัทร เขอหมือ', score: '' },
  ]);

  // Modal states
  const [gradingTask, setGradingTask] = useState<ReadinessTask | null>(null);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);

  const totalEmptyScores = tasks.reduce((sum, t) => sum + t.emptyCount, 0);

  const handleCloseTask = async (taskId: string, taskTitle: string) => {
    await assignmentService.closeAssignment(taskId);
    await scoreService.autoZeroMissing(
      taskId,
      'room-3-1',
      studentsList.map((s) => `stu-${s.no}`)
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, emptyCount: 0 } : t))
    );
    alert(`ปิดรับงาน "${taskTitle}": บันทึกนักเรียนที่ยังไม่ส่งเป็น 0 (ไม่ส่ง) เรียบร้อยแล้ว (อัปเดตลง Audit Log อัตโนมัติ)`);
  };

  const handleSaveGrading = async (taskId: string) => {
    await scoreService.batchUpsertScores(
      taskId,
      'room-3-1',
      10,
      studentsList.map((s) => ({
        enrollmentId: `stu-${s.no}`,
        value: s.score ? Number(s.score) : 5,
        reason: 'กรอกคะแนนเตรียมความพร้อมก่อนปิดภาคเรียน',
      }))
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, emptyCount: 0 } : t))
    );
    setGradingTask(null);
    alert('บันทึกคะแนนเรียบร้อย! ช่องคะแนนว่างลดลงแล้ว');
  };

  const handleAutoFillTraits = () => {
    setStudentsList((prev) => prev.map((s) => ({ ...s, score: '3' })));
    alert('ใส่ผลการประเมินระดับ 3 (ดีเยี่ยม) ให้นักเรียนทั้งหมดเรียบร้อย');
  };

  const handleSaveTraits = () => {
    alert('บันทึกผลการประเมินคุณลักษณะอันพึงประสงค์และอ่านคิดวิเคราะห์เข้าสู่ระบบ SGS สำเร็จ!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 select-none">
      {/* 1. Clean Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            ตรวจสอบความพร้อมก่อนส่งเกรดปลายภาคเรียน 1/2569
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            รายวิชา ศ20221 ดนตรีปฏิบัติตามความถนัด 1 — ชั้น ม.1/8 (นักเรียน 27 คน)
          </p>
        </div>

        <button
          onClick={() => setIsOverviewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          <span>ดูตารางสรุปคะแนนทั้งห้อง</span>
        </button>
      </div>

      {/* 2. Rule of Thirds (กฎสามส่วน): 3 Balanced Summary Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              เกณฑ์ความพร้อมของรายวิชา
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {totalEmptyScores === 0 ? '5/5' : '3/5'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                เงื่อนไขผ่านเกณฑ์
              </span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              totalEmptyScores === 0
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {totalEmptyScores === 0 ? 'พร้อมส่ง SGS' : 'รอกรอกข้อมูล'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              ช่องคะแนนงาน/สอบที่ยังว่าง
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  totalEmptyScores === 0 ? 'text-teal-700' : 'text-slate-900'
                }`}
              >
                {totalEmptyScores}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ช่องคะแนน (จาก {tasks.length} ชิ้นงาน)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            คะแนนเต็ม 100
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">
              ประเมินคุณลักษณะฯ & อ่านคิดวิเคราะห์
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-700 tabular-nums">
                {studentsList.filter((s) => s.score !== '').length}/{studentsList.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                คนที่ประเมินแล้ว
              </span>
            </div>
          </div>
          <button
            onClick={handleAutoFillTraits}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
          >
            ให้ระดับ 3 ทั้งห้อง
          </button>
        </div>
      </div>

      {/* 3. Two Structured Data Tables (Left 7 Cols: ช่องคะแนนว่าง | Right 5 Cols: ประเมินคุณลักษณะฯ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table 1: ตารางรายการชิ้นงานที่ยังมีช่องคะแนนว่าง */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  ตารางตรวจสอบช่องคะแนนรายชิ้นงาน
                </h2>
                <p className="text-[11px] text-slate-500">
                  หากนักเรียนไม่ส่งงานจริง สามารถกด “ปิดรับงาน” เพื่อบันทึกเป็น 0 ครั้งเดียวทั้งห้อง
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">ชื่อชิ้นงาน / การสอบ</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4 text-right">ช่องที่ยังว่าง</th>
                  <th className="py-3 px-4 text-right">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {task.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {task.type === 'pencil' ? (
                          <PenTool className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{task.type === 'pencil' ? 'สอบปฏิบัติ' : 'ชิ้นงาน/การบ้าน'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums">
                      {task.emptyCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>ว่าง {task.emptyCount} ช่อง</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ครบถ้วน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {task.emptyCount > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setGradingTask(task)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            กรอกคะแนน
                          </button>
                          {task.hasCloseBtn && (
                            <button
                              onClick={() => handleCloseTask(task.id, task.title)}
                              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors"
                            >
                              ปิดรับงาน
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">เรียบร้อย</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: ตารางประเมินคุณลักษณะอันพึงประสงค์ & อ่านคิดวิเคราะห์ */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                ตารางประเมินคุณลักษณะฯ (0–3)
              </h2>
            </div>

            <button
              onClick={handleSaveTraits}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              บันทึกผล
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">เลขที่</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 text-center">ระดับ (0–3)</th>
                  <th className="py-3 px-4 text-right">แปลผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList.map((stu, idx) => (
                  <tr key={stu.no} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                      {stu.no}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {stu.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="text"
                        placeholder="0-3"
                        value={stu.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentsList((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, score: val } : s))
                          );
                        }}
                        className="w-14 px-2 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600 font-bold tabular-nums"
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {stu.score === '3' ? (
                        <span className="text-teal-700 font-semibold">ดีเยี่ยม</span>
                      ) : stu.score === '2' ? (
                        <span className="text-slate-700 font-medium">ดี</span>
                      ) : stu.score === '1' ? (
                        <span className="text-amber-700 font-medium">ผ่าน</span>
                      ) : (
                        <span className="text-slate-400">รอประเมิน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Fast Grading for Incomplete Task */}
      {gradingTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  กรอกคะแนน: {gradingTask.title}
                </h3>
                <p className="text-xs text-slate-400">ห้อง ศ20221 ม.1/8 (ค้าง {gradingTask.emptyCount} ช่อง)</p>
              </div>
              <button onClick={() => setGradingTask(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {studentsList.slice(0, gradingTask.emptyCount).map((stu) => (
                <div key={stu.no} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">{stu.no}. {stu.name}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      defaultValue={8}
                      min="0"
                      max="10"
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setGradingTask(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSaveGrading(gradingTask.id)}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl font-bold"
              >
                บันทึกคะแนน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Classroom Score Overview */}
      {isOverviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  ภาพรวมคะแนนห้อง ศ20221 ดนตรีปฏิบัติ 1 ม.1/8
                </h3>
              </div>
              <button onClick={() => setIsOverviewModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-2xl font-bold">
                <div>
                  <div className="text-slate-400 text-[10px]">นักเรียนทั้งหมด</div>
                  <div className="text-base text-slate-800">27 คน</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">คะแนนเฉลี่ย</div>
                  <div className="text-base text-emerald-600">71.1</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ผ่านเกณฑ์ (70%+)</div>
                  <div className="text-base text-blue-600">19 คน (70.4%)</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">เสี่ยง มส.</div>
                  <div className="text-base text-rose-600">3 คน</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800">
                <span className="font-bold">สถานะความพร้อม: </span>
                <span>เมื่อกรอกคะแนนครบ 17 ช่องและประเมินคุณลักษณะเสร็จสิ้น ระบบจะอนุญาตให้ส่งออกคะแนนเข้าสู่ OBEC SGS ได้ทันที</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end text-xs">
              <button
                onClick={() => setIsOverviewModalOpen(false)}
                className="px-5 py-2 bg-[#0f2a59] text-white rounded-xl font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
