// src/components/promotion/PromotionWizardModal.tsx
import React, { useState, useEffect } from 'react';
import {
  studentPromotionService,
  type ClassroomMappingRule,
  type PromotionAction,
  type PromotionDryRunResult,
} from '../../services/studentPromotionService';
import {
  Calendar,
  Layers,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export interface ClassroomOption {
  id: string;
  name: string;       // เช่น "ม.1/1", "ม.3/1", "ม.6/1"
  gradeLevel: string; // เช่น "ม.1", "ม.3", "ม.6"
}

export interface PromotionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: ClassroomOption[];
  currentUserId: string;
  onPromotionSuccess: (batchId: string) => void;
}

export type ManualOverrideEntry = {
  action: PromotionAction;
  toClassroomId?: string | null;
  remarks?: string;
};

const GRADUATION_LEVELS = new Set(['ม.3', 'ม.6', 'ป.6']);

export const PromotionWizardModal: React.FC<PromotionWizardModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  currentUserId,
  onPromotionSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: ตั้งค่าปีการศึกษาและภาคเรียน
  const [fromYear, setFromYear] = useState<number>(2569);
  const [fromSemester, setFromSemester] = useState<number>(2);
  const [toYear, setToYear] = useState<number>(2570);
  const [toSemester, setToSemester] = useState<number>(1);

  // Step 2: กฎการแมปห้องเรียน
  const [mappings, setMappings] = useState<ClassroomMappingRule[]>(() =>
    classrooms.map((room) => {
      const isGrad = GRADUATION_LEVELS.has(room.gradeLevel);
      return {
        fromClassroomId: room.id,
        fromGradeLevel: room.gradeLevel,
        toClassroomId: null,
        toGradeLevel: isGrad ? 'GRADUATED' : '',
        isGraduationLevel: isGrad,
      };
    })
  );

  // Step 3 & 4: ข้อยกเว้นรายบุคคลและผลลัพธ์ Dry Run
  const [manualOverrides, setManualOverrides] = useState<Map<string, ManualOverrideEntry>>(new Map());
  const [dryRunResult, setDryRunResult] = useState<PromotionDryRunResult | null>(null);
  const [onlyShowFlagged, setOnlyShowFlagged] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ซิงค์ mappings เมื่อ classrooms มีการเปลี่ยนแปลง
  useEffect(() => {
    if (classrooms.length > 0 && mappings.length === 0) {
      setMappings(
        classrooms.map((room) => {
          const isGrad = GRADUATION_LEVELS.has(room.gradeLevel);
          return {
            fromClassroomId: room.id,
            fromGradeLevel: room.gradeLevel,
            toClassroomId: null,
            toGradeLevel: isGrad ? 'GRADUATED' : '',
            isGraduationLevel: isGrad,
          };
        })
      );
    }
  }, [classrooms, mappings.length]);

  if (!isOpen) return null;

  const classroomNameMap = new Map(classrooms.map((c) => [c.id, c.name]));

  // อัปเดตการแมปห้องเรียนใน Step 2
  const handleMappingChange = (
    fromClassroomId: string,
    field: 'toClassroomId' | 'isGraduationLevel',
    value: string | boolean
  ) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.fromClassroomId !== fromClassroomId) return m;
        if (field === 'isGraduationLevel') {
          const isGrad = Boolean(value);
          return {
            ...m,
            isGraduationLevel: isGrad,
            toClassroomId: isGrad ? null : m.toClassroomId,
            toGradeLevel: isGrad ? 'GRADUATED' : m.toGradeLevel,
          };
        }
        const targetRoom = classrooms.find((c) => c.id === value);
        return {
          ...m,
          toClassroomId: value ? String(value) : null,
          toGradeLevel: targetRoom?.gradeLevel ?? null,
        };
      })
    );
  };

  // สั่งรัน Dry-Run เพื่อเข้าสู่ Step 3 หรืออัปเดตตัวเลขใน Step 4
  const runDryRunSimulation = async (targetStep: 3 | 4, customOverrides = manualOverrides) => {
    setErrorMessage(null);

    // ตรวจสอบว่าห้องที่ไม่ใช่ชั้นจบการศึกษาต้องระบุห้องปลายทางครบ
    const invalidRoom = mappings.find((m) => !m.isGraduationLevel && !m.toClassroomId);
    if (invalidRoom) {
      const roomName = classroomNameMap.get(invalidRoom.fromClassroomId) ?? invalidRoom.fromClassroomId;
      setErrorMessage(`กรุณาเลือกห้องเรียนปลายทางสำหรับห้อง ${roomName}`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await studentPromotionService.simulatePromotionDryRun({
        fromAcademicYear: fromYear,
        fromSemester,
        toAcademicYear: toYear,
        toSemester,
        mappings,
        manualOverrides: customOverrides,
      });
      setDryRunResult(result);
      setStep(targetStep);
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการจำลองการเลื่อนชั้น');
    } finally {
      setIsLoading(false);
    }
  };

  // เปลี่ยนสถานะนักเรียนรายคนใน Step 3 (Graduation Board & Exceptions)
  const handleOverrideAction = (studentId: string, action: PromotionAction, defaultRoomId: string) => {
    const nextMap = new Map(manualOverrides);
    nextMap.set(studentId, {
      action,
      toClassroomId: action === 'GRADUATE' ? null : defaultRoomId,
      remarks:
        action === 'REPEAT'
          ? 'คณะกรรมการอนุมัติให้ซ้ำชั้น/รอซ่อม'
          : action === 'GRADUATE'
          ? 'คณะกรรมการอนุมัติจบการศึกษา'
          : 'อนุมัติเลื่อนชั้นปกติ',
    });
    setManualOverrides(nextMap);
  };

  // สั่งรัน Atomic RPC จริงใน Step 4
  const handleExecuteConfirmed = async () => {
    if (!dryRunResult) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await studentPromotionService.executePromotionBatch({
        fromAcademicYear: fromYear,
        fromSemester,
        toAcademicYear: toYear,
        toSemester,
        executedBy: currentUserId,
        transitions: dryRunResult.transitions,
      });

      onPromotionSuccess(res.batch_id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถดำเนินการเลื่อนชั้นได้ ระบบได้ทำการ Rollback คืนค่าเดิมแล้ว');
    } finally {
      setIsLoading(false);
    }
  };

  const displayedTransitions =
    dryRunResult?.transitions.filter((t) => (onlyShowFlagged ? t.has_academic_issue : true)) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-[#E6EEF7] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header โทน Pastel Anime */}
        <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-pink-50 px-6 py-4 flex items-center justify-between border-b border-[#E6EEF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#163A66]">
                ระบบเลื่อนชั้นนักเรียนและปิดปีการศึกษา
              </h2>
              <p className="text-xs text-[#6B7C93] mt-0.5">
                ปลอดภัยด้วยสถาปัตยกรรม Two-Tier Enrollment และ PostgreSQL Atomic RPC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 hover:bg-white p-2 text-[#6B7C93] hover:text-[#163A66] shadow-sm transition-colors border border-slate-100"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#F7FAFF] px-6 py-3 border-b border-[#E6EEF7] text-xs font-semibold">
          <div
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
              step === 1
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-[#6B7C93] border border-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. ตั้งค่าปีการศึกษา</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
              step === 2
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-[#6B7C93] border border-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. แมปห้องเรียน</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
              step === 3
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-[#6B7C93] border border-slate-200/60'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>3. อนุมัติจบ/ข้อยกเว้น</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
              step === 4
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-[#6B7C93] border border-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. ตรวจสอบ & ยืนยัน</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: ตั้งค่าปีการศึกษา */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#EFF6FF]/60 border border-[#BFDBFE] p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h3>ภาคเรียนต้นทาง (ที่ต้องการปิดเทอม)</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#163A66] mb-1">ปีการศึกษาต้นทาง (พ.ศ.)</label>
                  <input
                    type="number"
                    value={fromYear}
                    onChange={(e) => setFromYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#163A66] mb-1">ภาคเรียนต้นทาง</label>
                  <select
                    value={fromSemester}
                    onChange={(e) => setFromSemester(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F5F3FF]/70 border border-[#DDD6FE] p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h3>ภาคเรียนปลายทาง (ที่ต้องการเปิดใหม่)</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#163A66] mb-1">ปีการศึกษาปลายทาง (พ.ศ.)</label>
                  <input
                    type="number"
                    value={toYear}
                    onChange={(e) => setToYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#DDD6FE] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#163A66] mb-1">ภาคเรียนปลายทาง</label>
                  <select
                    value={toSemester}
                    onChange={(e) => setToSemester(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#DDD6FE] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: แมปห้องเรียน */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-[#6B7C93]">
                กำหนดห้องเรียนปลายทางสำหรับแต่ละห้อง หรือติ๊กเลือก <b className="text-[#163A66]">ชั้นปีจบการศึกษา</b> สำหรับห้อง ม.3 และ ม.6
              </p>
              <div className="overflow-x-auto rounded-2xl border border-[#E6EEF7]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F7FAFF] text-[#163A66] border-b border-[#E6EEF7]">
                    <tr>
                      <th className="p-3 text-left font-semibold">ห้องเรียนต้นทาง</th>
                      <th className="p-3 text-left font-semibold">ระดับชั้น</th>
                      <th className="p-3 text-center font-semibold">เป็นชั้นจบการศึกษา (ม.3/ม.6)</th>
                      <th className="p-3 text-left font-semibold">ห้องเรียนปลายทาง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EEF7]">
                    {mappings.map((rule) => (
                      <tr key={rule.fromClassroomId} className="hover:bg-blue-50/20 transition-colors">
                        <td className="p-3 font-semibold text-[#163A66]">
                          {classroomNameMap.get(rule.fromClassroomId) ?? rule.fromClassroomId}
                        </td>
                        <td className="p-3 text-[#6B7C93]">{rule.fromGradeLevel}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={rule.isGraduationLevel}
                            onChange={(e) =>
                              handleMappingChange(rule.fromClassroomId, 'isGraduationLevel', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                          />
                        </td>
                        <td className="p-3">
                          {rule.isGraduationLevel ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                              <GraduationCap className="w-3.5 h-3.5" />
                              ย้ายเข้าทำเนียบศิษย์เก่า (เมื่ออนุมัติจบ)
                            </span>
                          ) : (
                            <select
                              value={rule.toClassroomId ?? ''}
                              onChange={(e) =>
                                handleMappingChange(rule.fromClassroomId, 'toClassroomId', e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            >
                              <option value="">-- เลือกห้องเรียนปลายทาง --</option>
                              {classrooms.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.gradeLevel})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: คณะกรรมการอนุมัติจบ ม.3/ม.6 และข้อยกเว้นซ้ำชั้น */}
          {step === 3 && dryRunResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    กระดานตรวจสอบผลการเรียนและอนุมัติจบการศึกษา (พบติด 0/ร จำนวน {dryRunResult.flaggedIssueCount} คน)
                  </h4>
                  <p className="text-xs text-amber-800">
                    นักเรียนชั้นจบการศึกษาที่ติด 0 หรือ ร จะถูกตั้งค่าเริ่มต้นเป็น &quot;ซ้ำชั้น/รอซ่อม&quot; อัตโนมัติ
                    คุณครูสามารถปรับเปลี่ยนรายบุคคลได้ด้านล่าง
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer bg-white/70 px-3 py-1.5 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    checked={onlyShowFlagged}
                    onChange={(e) => setOnlyShowFlagged(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-400"
                  />
                  แสดงเฉพาะนักเรียนที่ติด 0 / ร
                </label>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#E6EEF7] max-h-80">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F7FAFF] text-[#163A66] sticky top-0 border-b border-[#E6EEF7] z-10">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">ชื่อ-นามสกุล</th>
                      <th className="p-2.5 text-left font-semibold">ห้องเดิม</th>
                      <th className="p-2.5 text-left font-semibold">แจ้งเตือนผลการเรียน</th>
                      <th className="p-2.5 text-left font-semibold">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EEF7]">
                    {displayedTransitions.map((item) => {
                      const currentOverride = manualOverrides.get(item.student_id);
                      const effectiveAction = currentOverride?.action ?? item.action;

                      return (
                        <tr
                          key={item.student_id}
                          className={item.has_academic_issue ? 'bg-rose-50/50' : 'hover:bg-slate-50/50 transition-colors'}
                        >
                          <td className="p-2.5 font-medium text-[#163A66]">{item.student_name || item.student_id}</td>
                          <td className="p-2.5 text-[#6B7C93]">
                            {classroomNameMap.get(item.from_classroom_id) ?? item.from_classroom_id}
                          </td>
                          <td className="p-2.5">
                            {item.has_academic_issue ? (
                              <span className="inline-block rounded-lg bg-rose-100 border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                ติด 0/ร: {item.academic_issue_detail}
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ปกติ
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <select
                              value={effectiveAction}
                              onChange={(e) =>
                                handleOverrideAction(
                                  item.student_id,
                                  e.target.value as PromotionAction,
                                  item.to_classroom_id || item.from_classroom_id
                                )
                              }
                              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="PROMOTE">เลื่อนชั้นปกติ (PROMOTE)</option>
                              <option value="REPEAT">ซ้ำชั้นในห้องเดิม (REPEAT)</option>
                              <option value="GRADUATE">อนุมัติจบการศึกษา (GRADUATE)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: สรุปผล Dry-Run และยืนยัน */}
          {step === 4 && dryRunResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
                  <div className="text-xs text-[#6B7C93]">นักเรียนทั้งหมด</div>
                  <div className="text-2xl font-extrabold text-[#163A66]">{dryRunResult.totalStudents} คน</div>
                </div>
                <div className="rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-4 text-center">
                  <div className="text-xs text-emerald-800">เลื่อนชั้นปกติ</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{dryRunResult.promoteCount} คน</div>
                </div>
                <div className="rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4 text-center">
                  <div className="text-xs text-amber-800">ซ้ำชั้น / รอซ่อม</div>
                  <div className="text-2xl font-extrabold text-amber-700">{dryRunResult.repeatCount} คน</div>
                </div>
                <div className="rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] p-4 text-center">
                  <div className="text-xs text-purple-800">จบการศึกษา (ศิษย์เก่า)</div>
                  <div className="text-2xl font-extrabold text-purple-700">{dryRunResult.graduateCount} คน</div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] p-4 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  การรับประกันความปลอดภัยของข้อมูล (P0 Safety Guarantees):
                </div>
                <div>• ประวัติการเรียนและคะแนนสอบในปีการศึกษา {fromYear}/{fromSemester} จะถูกเก็บรักษาไว้อย่างสมบูรณ์</div>
                <div>• ทำงานด้วย PostgreSQL Atomic RPC หากเกิดข้อผิดพลาดแม้แต่คนเดียว ระบบจะย้อนคืนทั้งหมดทันที</div>
                <div>• สามารถกดย้อนกลับ (1-Click Rollback) ได้ในภายหลังหากยังไม่มีการกรอกคะแนนเทอมใหม่</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#F7FAFF] px-6 py-4 border-t border-[#E6EEF7] flex items-center justify-between">
          <div>
            {step !== 1 && (
              <button
                disabled={isLoading}
                onClick={() => setStep((prev) => (prev === 4 ? 3 : prev === 3 ? 2 : 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#163A66] hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors"
              >
                <span>ถัดไป: แมปห้องเรียน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                disabled={isLoading}
                onClick={() => void runDryRunSimulation(3)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <span>{isLoading ? 'กำลังคำนวณ Dry-Run...' : 'ถัดไป: ตรวจผลการเรียน (Dry-Run)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={isLoading}
                onClick={() => void runDryRunSimulation(4)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <span>{isLoading ? 'กำลังอัปเดตยอดรวม...' : 'ถัดไป: สรุปผลก่อนยืนยัน'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                disabled={isLoading}
                onClick={() => void handleExecuteConfirmed()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-sm font-bold text-white shadow-md transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'กำลังบันทึกข้อมูลแบบ Atomic...' : 'ยืนยันการเลื่อนชั้นทั้งโรงเรียน'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
