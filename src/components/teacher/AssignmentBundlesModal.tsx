import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Calculator,
  Sparkles,
} from 'lucide-react';
import {
  teacherCourseAssignmentService,
  type AssignmentBundleConfig,
} from '../../services/teacherCourseAssignmentService';

interface AssignmentBundlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AssignmentBundlesModal: React.FC<AssignmentBundlesModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [bundleConfig, setBundleConfig] = useState<AssignmentBundleConfig>(() =>
    teacherCourseAssignmentService.getBundle()
  );

  useEffect(() => {
    const handleBundleUpdate = () => {
      setBundleConfig({ ...teacherCourseAssignmentService.getBundle() });
    };
    window.addEventListener('kp-bundle-updated', handleBundleUpdate);
    return () => {
      window.removeEventListener('kp-bundle-updated', handleBundleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  หมวดหมู่งานรวม & เฉลี่ยคะแนนสะสมอัตโนมัติ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Auto-Average Bundles
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                สั่ง {bundleConfig.totalTasks} งานย่อย ครูติ๊กนับจำนวนงาน ระบบคำนวณและเฉลี่ยคะแนนสุทธิให้อัตโนมัติเต็ม {bundleConfig.maxScore} คะแนน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings & Rounding Toggle */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              ระบบปัดทศนิยมอัตโนมัติ (&gt;= 0.5 ปัดขึ้นเป็นคะแนนเต็มถัดไป)
            </span>
            <span className="text-[11px] text-slate-500">
              {bundleConfig.autoRoundUpHalf
                ? 'เปิดใช้งาน: เช่น ได้ 7.5 คะแนน ➔ ปัดเป็น 8 คะแนน, ได้ 6.5 คะแนน ➔ ปัดเป็น 7 คะแนน'
                : 'ปิดใช้งาน: เก็บคะแนนตามทศนิยม 1 ตำแหน่ง (เช่น 7.5 คะแนน)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextVal = !bundleConfig.autoRoundUpHalf;
              teacherCourseAssignmentService.updateBundleRoundUpSetting(nextVal);
              onShowToast(
                nextVal
                  ? 'เปิดโหมดปัดทศนิยม >= 0.5 อัตโนมัติเรียบร้อย'
                  : 'ปิดโหมดปัดทศนิยม (เก็บทศนิยม 1 ตำแหน่ง) เรียบร้อย'
              );
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              bundleConfig.autoRoundUpHalf ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                bundleConfig.autoRoundUpHalf ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Formula Explainer */}
        <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-indigo-950">สูตรการคำนวณ:</span>
            <span className="font-mono text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
              (จำนวนงานที่ส่ง / {bundleConfig.totalTasks} งาน) × {bundleConfig.maxScore} คะแนน
            </span>
          </div>
          <span className="text-indigo-700 font-medium">
            ช่องปลายทาง: <strong>"{bundleConfig.targetSgsColumn}"</strong>
          </span>
        </div>

        {/* Student Checklist Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 w-20">รหัส</th>
                  <th className="py-2.5 px-3 min-w-[150px]">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3 text-center min-w-[200px]">
                    จำนวนงานย่อยที่ส่ง (เต็ม {bundleConfig.totalTasks} งาน)
                  </th>
                  <th className="py-2.5 px-3 text-center w-24">คะแนนดิบ</th>
                  <th className="py-2.5 px-3 text-center w-28">
                    คะแนนสุทธิ {bundleConfig.autoRoundUpHalf ? '(ปัดเศษ)' : ''}
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {bundleConfig.students.map((st) => (
                  <tr key={st.studentCode} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {st.seatNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {st.studentCode}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {st.studentName}
                    </td>

                    {/* Task Progress & Buttons */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            teacherCourseAssignmentService.setStudentCompletedCountDirect(
                              st.studentCode,
                              Math.max(0, st.completedTasksCount - 1)
                            )
                          }
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>

                        <div className="w-28 sm:w-32 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{
                              width: `${(st.completedTasksCount / bundleConfig.totalTasks) * 100}%`,
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            teacherCourseAssignmentService.setStudentCompletedCountDirect(
                              st.studentCode,
                              Math.min(bundleConfig.totalTasks, st.completedTasksCount + 1)
                            )
                          }
                          className="w-6 h-6 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>

                        <span className="font-extrabold text-slate-800 tabular-nums ml-1">
                          {st.completedTasksCount}/{bundleConfig.totalTasks}
                        </span>
                      </div>
                    </td>

                    {/* Raw Score */}
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600 tabular-nums">
                      {st.rawScore.toFixed(1)}
                    </td>

                    {/* Final Score (With Badge if Rounded Up) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-black text-sm text-slate-900 tabular-nums">
                          {st.finalScore}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{bundleConfig.maxScore}
                        </span>
                        {st.isRoundedUp && (
                          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                            ปัดขึ้น
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quick Completion Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          teacherCourseAssignmentService.setStudentCompletedCountDirect(
                            st.studentCode,
                            bundleConfig.totalTasks
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        ✓ ส่งครบ ({bundleConfig.totalTasks})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              onShowToast(
                `⚡ ซิงค์คะแนนเฉลี่ยงานรวมเข้าช่องคะแนนเก็บ ปพ.5 (${bundleConfig.students.length} คน) เรียบร้อยแล้ว!`
              );
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ซิงค์คะแนนเฉลี่ยเข้าสมุด ปพ.5 ทันที ⚡</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
