import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  PenTool,
  Compass,
  ArrowRight,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Header Status Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-slate-600" />
          <h1 className="text-base sm:text-lg font-bold text-slate-800">
            ความพร้อมก่อนปิดภาคเรียน 1/2569{' '}
            <span className="font-normal text-slate-500 text-sm">
              (พร้อมส่ง {totalEmptyScores === 0 ? '1' : '0'} จาก 9 ชั้นเรียน)
            </span>
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          ห้องที่ยังไม่ครบจะกางรายการที่ต้องทำออกมาให้ — กดปุ่มในแต่ละข้อเพื่อไปแก้ที่หน้าจอนั้นได้ทันที
        </p>
      </div>

      {/* 2. Classroom Accordion Card: ศ20221 ดนตรีปฏิบัติตามความถนัด 1 — ม.1/8 */}
      <div className="space-y-4">
        {/* Class Header & Status Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            ศ20221 ดนตรีปฏิบัติตามความถนัด 1 — ม.1/8
          </h2>
          <span className={`px-2 py-0.5 font-bold rounded-md text-[11px] ${
            totalEmptyScores === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {totalEmptyScores === 0 ? '5/5 ข้อ' : '2/5 ข้อ'}
          </span>
          <span className="text-slate-500">27 คน</span>

          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <span className={`px-2 py-0.5 border rounded-md text-[11px] font-medium flex items-center gap-1 ${
              totalEmptyScores > 0
                ? 'bg-[#fef2f2] text-rose-700 border-rose-200'
                : 'bg-[#e8f8f0] text-emerald-800 border-emerald-200'
            }`}>
              <span>{totalEmptyScores > 0 ? '⊗' : '✓'}</span> คะแนนยังว่าง {totalEmptyScores} ช่อง
            </span>
            <span className="px-2 py-0.5 bg-[#fef2f2] text-rose-700 border border-rose-200 rounded-md text-[11px] font-medium flex items-center gap-1">
              <span>⊗</span> คุณลักษณะฯ/อ่านคิดฯ 0/27
            </span>
            <span className="px-2 py-0.5 bg-[#fef2f2] text-rose-700 border border-rose-200 rounded-md text-[11px] font-medium flex items-center gap-1">
              <span>⊗</span> เวลาเรียนไม่พอ 3 คน
            </span>
            <span className="px-2 py-0.5 bg-[#e8f8f0] text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium flex items-center gap-1">
              <span>✓</span> คะแนนเต็ม 100
            </span>
            <span className="px-2 py-0.5 bg-[#e8f8f0] text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium flex items-center gap-1">
              <span>✓</span> ผูกหน่วยครบ
            </span>
          </div>
        </div>

        {/* Subcard 1: คะแนนยังว่าง 17 ช่อง */}
        <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-amber-500 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {totalEmptyScores > 0 ? `คะแนนยังว่าง ${totalEmptyScores} ช่อง` : 'คะแนนครบถ้วนแล้วทุกช่อง'}
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  {task.type === 'pencil' ? (
                    <PenTool className="w-4 h-4 text-slate-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 border border-slate-400 rounded-sm" />
                  )}
                  <span className="font-medium text-slate-700">{task.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {task.emptyCount > 0 ? (
                    <span className="px-2.5 py-0.5 bg-[#fef7e6] text-[#8a6100] border border-[#f5e6be] rounded-md text-[11px] font-medium">
                      ว่าง {task.emptyCount} ช่อง
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-medium">
                      ครบถ้วน
                    </span>
                  )}

                  {task.emptyCount > 0 && (
                    <button
                      onClick={() => setGradingTask(task)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>กรอกคะแนน</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  )}

                  {task.hasCloseBtn && task.emptyCount > 0 && (
                    <button
                      onClick={() => handleCloseTask(task.id, task.title)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ปิดรับงาน
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Educational Note */}
          <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
            ช่องว่างจะถูกคิดเป็น 0 ตอนสรุปคะแนน — ถ้าเด็กไม่ส่งจริง ให้กด{' '}
            <span className="font-semibold text-slate-700">ปิดรับงาน</span>{' '}
            เพื่อบันทึกเป็น “ไม่ส่ง” ทั้งห้องในครั้งเดียว จะได้แยกออกจาก
            “ครูยังไม่ตรวจ” และทำให้เกรดคาดการณ์เชื่อถือได้
          </p>

          <button
            onClick={() => setIsOverviewModalOpen(true)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>ดูภาพรวมคะแนนของห้องนี้</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Subcard 2: คุณลักษณะฯ / อ่านคิดวิเคราะห์ฯ ยังไม่ครบ 27 คน */}
        <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-amber-500 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                คุณลักษณะฯ / อ่านคิดวิเคราะห์ฯ ยังไม่ครบ 27 คน
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleAutoFillTraits}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold"
              >
                + ให้ระดับ 3 (ดีเยี่ยม) ทั้งหมด
              </button>
              <button
                onClick={handleSaveTraits}
                className="px-3.5 py-1.5 bg-[#0f2a59] text-white rounded-xl font-bold shadow-xs hover:bg-[#164282]"
              >
                บันทึกการประเมิน
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {studentsList.map((stu, idx) => (
              <div
                key={stu.no}
                className="flex items-center justify-between gap-4 text-xs p-2 rounded-xl hover:bg-slate-50"
              >
                <span className="w-48 font-medium text-slate-700 truncate">
                  {stu.no}. {stu.name}
                </span>

                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="กรอกผลการประเมิน หรือระดับ 0-3..."
                    value={stu.score}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudentsList((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, score: val } : s))
                      );
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[11px] text-slate-400">
                    {stu.score === '3' ? 'ดีเยี่ยม' : stu.score === '2' ? 'ดี' : stu.score === '1' ? 'ผ่าน' : '-'}
                  </span>
                </div>
              </div>
            ))}
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
