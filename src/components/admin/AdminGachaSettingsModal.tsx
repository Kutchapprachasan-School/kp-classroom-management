// src/components/admin/AdminGachaSettingsModal.tsx
// หน้าต่างตั้งค่าระบบกาชา & ควิซ 40 สัปดาห์ สำหรับผู้ดูแลระบบ
// ตามกฎ Master Rule 11 (Settings UI Architecture) & Pastel Anime Education Dashboard
// รองรับ:
// 1. อัตราสุ่มและการันตี (Rates & Pity)
// 2. เศรษฐกิจและร้านค้า (Economy & Shop Prices)
// 3. กฎการแจกรางวัล (Weekly Free Ticket Cap & Quests)
// 4. แอดมินแจกของ (Admin Grant Tools: ตั๋ว, เศษดาว, คู่หู)
// 5. รีเซ็ตและคืนค่าข้อมูล (Reset Student / Classroom / All + Snapshot Rollback)
// 6. จัดการคลังคำถาม 40 สัปดาห์ (40-Week Quiz Manager)

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  ShoppingBag,
  Gift,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  History,
  Trash2,
  User,
  Users,
  RefreshCw,
} from 'lucide-react';
import { SettingsSubModal } from '../settings/SettingsSubModal';
import { gachaConfigService, type GachaAdminConfig } from '../../services/gachaConfigService';
import { gachaAdminService, type GachaSnapshot, type GachaAdminAuditLog } from '../../services/gachaAdminService';
import { ALL_BUDDIES, type GachaRarity } from '../../services/gachaService';
import { weeklyQuizService } from '../../services/weeklyQuizService';
import {
  TOTAL_QUIZ_WEEKS,
  WEEKS_PER_TERM,
  type WeeklyQuizQuestion,
} from '../../config/weeklyQuizBank';
import { classroomService } from '../../services/classroomService';
import { studentService } from '../../services/studentService';

interface AdminGachaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'RATES' | 'ECONOMY' | 'REWARDS' | 'GRANT' | 'RESET_ROLLBACK' | 'QUIZ_40W';

export const AdminGachaSettingsModal: React.FC<AdminGachaSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('RATES');
  const [config, setConfig] = useState<GachaAdminConfig>(() => gachaConfigService.getConfig());
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Grant Form State
  const [grantMode, setGrantMode] = useState<'single' | 'classroom'>('single');
  const [grantStudentId, setGrantStudentId] = useState('');
  const [grantClassroomId, setGrantClassroomId] = useState('');
  const [grantTickets, setGrantTickets] = useState(1);
  const [grantShards, setGrantShards] = useState(0);
  const [grantBuddyId, setGrantBuddyId] = useState('');
  const [grantReason, setGrantReason] = useState('รางวัลกิจกรรมการเรียนรู้');

  // Reset & Rollback State
  const [resetTargetMode, setResetTargetMode] = useState<'single' | 'classroom' | 'all'>('single');
  const [resetStudentId, setResetStudentId] = useState('');
  const [resetClassroomId, setResetClassroomId] = useState('');
  const [resetReason, setResetReason] = useState('รีเซ็ตตามคำขอ');
  const [snapshots, setSnapshots] = useState<GachaSnapshot[]>(() => gachaAdminService.listSnapshots());
  const [, setAuditLogs] = useState<GachaAdminAuditLog[]>(() => gachaAdminService.listAuditLogs());

  // 40-Week Quiz Manager State
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [quizQuestions, setQuizQuestions] = useState<WeeklyQuizQuestion[]>([]);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<WeeklyQuizQuestion | null>(null);

  // Classrooms list
  const classrooms: any[] = useMemo(() => classroomService.getClassroomsSync?.() || (classroomService as any).getAllClassrooms?.() || [], []);

  // Reload config and questions
  useEffect(() => {
    if (isOpen) {
      const freshCfg = gachaConfigService.getConfig();
      setConfig(freshCfg);
      setSnapshots(gachaAdminService.listSnapshots());
      setAuditLogs(gachaAdminService.listAuditLogs());
    }
  }, [isOpen]);

  useEffect(() => {
    const qs = weeklyQuizService.getQuestionsForWeek(selectedWeek);
    setQuizQuestions(qs);
    setSelectedQuestionIdx(0);
    setEditingQuestion(qs[0] ? { ...qs[0] } : null);
  }, [selectedWeek]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveConfig = () => {
    // Validate rates sum to 100
    const { rates } = config;
    const sum =
      rates.COMMON +
      rates.UNCOMMON +
      rates.RARE +
      rates.EPIC +
      rates.LEGENDARY +
      rates.MYTHIC;

    if (Math.abs(sum - 100) > 0.01) {
      showToast('error', `ผลรวมอัตราสุ่มต้องเท่ากับ 100% (ปัจจุบัน: ${sum.toFixed(1)}%)`);
      return;
    }

    gachaConfigService.saveConfig(config);
    showToast('success', 'บันทึกการตั้งค่าระบบกาชาเรียบร้อยแล้ว');
  };

  // Grant Handler
  const handleExecuteGrant = () => {
    if (grantMode === 'single') {
      const sid = grantStudentId.trim();
      if (!sid) {
        showToast('error', 'กรุณาระบุรหัสนักเรียน');
        return;
      }
      const foundStudent = studentService.findStudentByCode(sid);
      const studentLabel = foundStudent?.student?.name ? `${foundStudent.student.name} (${sid})` : sid;

      if (grantTickets > 0) gachaAdminService.grantTickets(sid, grantTickets, grantReason);
      if (grantShards > 0) gachaAdminService.grantShards(sid, grantShards, grantReason);
      if (grantBuddyId) gachaAdminService.grantBuddy(sid, grantBuddyId, grantReason);

      showToast('success', `แจกของรางวัลให้นักเรียน ${studentLabel} สำเร็จ`);
      setAuditLogs(gachaAdminService.listAuditLogs());
    } else {
      if (!grantClassroomId) {
        showToast('error', 'กรุณาเลือกห้องเรียน');
        return;
      }
      const targetClassroom = classrooms.find((c: any) => c.id === grantClassroomId || c.name === grantClassroomId);
      let studentsInClass: any[] = studentService.getStudents(grantClassroomId);
      if (studentsInClass.length === 0 && targetClassroom?.name) {
        studentsInClass = studentService.getStudents(targetClassroom.name);
      }
      if (studentsInClass.length === 0 && targetClassroom?.id) {
        studentsInClass = studentService.getStudents(targetClassroom.id);
      }
      const sids = studentsInClass.map((s: any) => s.code || s.studentCode || s.id);
      if (sids.length === 0) {
        showToast('error', 'ไม่พบนักเรียนในห้องเรียนนี้');
        return;
      }

      const res = gachaAdminService.grantClassroom(
        sids,
        {
          tickets: grantTickets > 0 ? grantTickets : undefined,
          shards: grantShards > 0 ? grantShards : undefined,
          buddyId: grantBuddyId || undefined,
        },
        grantReason
      );

      showToast('success', `แจกของรางวัลให้นักเรียน ${res.count} คนสำเร็จ (บันทึก Snapshot แล้ว)`);
      setSnapshots(gachaAdminService.listSnapshots());
      setAuditLogs(gachaAdminService.listAuditLogs());
    }
  };

  // Reset Handler
  const handleExecuteReset = () => {
    if (resetTargetMode === 'single') {
      const sid = resetStudentId.trim();
      if (!sid) {
        showToast('error', 'กรุณาระบุรหัสนักเรียนที่ต้องการรีเซ็ต');
        return;
      }
      if (!confirm(`ยืนยันการรีเซ็ตข้อมูลกาชาของนักเรียน "${sid}"? (ระบบจะบันทึก Snapshot ก่อนรีเซ็ต)`)) {
        return;
      }
      gachaAdminService.resetStudent(sid, resetReason, { autoSnapshot: true });
      showToast('success', `รีเซ็ตข้อมูลนักเรียน ${sid} สำเร็จ`);
    } else if (resetTargetMode === 'classroom') {
      if (!resetClassroomId) {
        showToast('error', 'กรุณาเลือกห้องเรียนที่ต้องการรีเซ็ต');
        return;
      }
      const targetClassroom = classrooms.find((c: any) => c.id === resetClassroomId || c.name === resetClassroomId);
      let students: any[] = studentService.getStudents(resetClassroomId);
      if (students.length === 0 && targetClassroom?.name) {
        students = studentService.getStudents(targetClassroom.name);
      }
      if (students.length === 0 && targetClassroom?.id) {
        students = studentService.getStudents(targetClassroom.id);
      }
      const sids = students.map((s: any) => s.code || s.studentCode || s.id);
      if (sids.length === 0) {
        showToast('error', 'ไม่พบนักเรียนในห้องนี้');
        return;
      }
      const cname = targetClassroom ? targetClassroom.name : resetClassroomId;

      if (
        !confirm(
          `ยืนยันการรีเซ็ตข้อมูลกาชานักเรียนทั้งห้อง "${cname}" จำนวน ${sids.length} คน? (ระบบจะบันทึก Snapshot ก่อนรีเซ็ต)`
        )
      ) {
        return;
      }

      const res = gachaAdminService.resetClassroom(sids, cname, resetReason, { autoSnapshot: true });
      showToast('success', `รีเซ็ตข้อมูลนักเรียนห้อง ${cname} (${res.count} คน) สำเร็จ`);
    } else {
      // RESET ALL
      if (
        !confirm(
          '⚠️ คำเตือนสำคัญ: คุณกำลังจะรีเซ็ตข้อมูลกาชานักเรียนทุกคนทั้งระบบ!\nระบบจะสร้างจุดสำรองข้อมูล (Snapshot) ให้ก่อนเสมอ\n\nต้องการดำเนินการต่อหรือไม่?'
        )
      ) {
        return;
      }
      const res = gachaAdminService.resetAll(resetReason, { autoSnapshot: true });
      showToast('success', `รีเซ็ตข้อมูลนักเรียนทั้งหมด ${res.count} คนเรียบร้อยแล้ว`);
    }

    setSnapshots(gachaAdminService.listSnapshots());
    setAuditLogs(gachaAdminService.listAuditLogs());
  };

  // Rollback Handler
  const handleRollback = (snapId: string) => {
    const snap = snapshots.find((s) => s.id === snapId);
    if (!snap) return;
    if (!confirm(`ยืนยันการกู้คืนข้อมูล (Rollback) จากจุดสำรอง "${snap.name}"?`)) return;

    const res = gachaAdminService.rollbackSnapshot(snapId);
    if (res.ok) {
      showToast('success', `คืนค่าข้อมูลสำเร็จ (${res.restoredCount} คน)`);
      setAuditLogs(gachaAdminService.listAuditLogs());
    } else {
      showToast('error', res.error || 'ไม่สามารถกู้คืนข้อมูลได้');
    }
  };

  // Delete Snapshot
  const handleDeleteSnapshot = (snapId: string) => {
    if (!confirm('ยืนยันลบจุดสำรองข้อมูลนี้?')) return;
    gachaAdminService.deleteSnapshot(snapId);
    setSnapshots(gachaAdminService.listSnapshots());
    showToast('success', 'ลบจุดสำรองข้อมูลเรียบร้อยแล้ว');
  };

  // Save Question Override
  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.question.trim()) {
      showToast('error', 'กรุณากรอกโจทย์คำถาม');
      return;
    }
    if (editingQuestion.choices.some((c) => !c.trim())) {
      showToast('error', 'กรุณากรอกตัวเลือกทั้ง 4 ข้อให้ครบถ้วน');
      return;
    }

    const currentOverrides = config.quiz.questionOverrides || {};
    const updatedCfg: GachaAdminConfig = {
      ...config,
      quiz: {
        ...config.quiz,
        questionOverrides: {
          ...currentOverrides,
          [editingQuestion.id]: { ...editingQuestion },
        },
      },
    };

    gachaConfigService.saveConfig(updatedCfg);
    setConfig(updatedCfg);

    // Refresh current week's questions
    const qs = weeklyQuizService.getQuestionsForWeek(selectedWeek);
    setQuizQuestions(qs);
    showToast('success', `บันทึกโจทย์ข้อที่ ${selectedQuestionIdx + 1} เรียบร้อยแล้ว`);
  };

  // Reset Question to Default
  const handleResetQuestionToDefault = (qid: string) => {
    const currentOverrides = { ...(config.quiz.questionOverrides || {}) };
    delete currentOverrides[qid];

    const updatedCfg: GachaAdminConfig = {
      ...config,
      quiz: {
        ...config.quiz,
        questionOverrides: currentOverrides,
      },
    };

    gachaConfigService.saveConfig(updatedCfg);
    setConfig(updatedCfg);

    const qs = weeklyQuizService.getQuestionsForWeek(selectedWeek);
    setQuizQuestions(qs);
    const reverted = qs[selectedQuestionIdx];
    if (reverted) setEditingQuestion({ ...reverted });
    showToast('success', 'คืนค่าโจทย์ตามคลังคำถามมาตรฐานเรียบร้อยแล้ว');
  };

  if (!isOpen) return null;

  return (
    <SettingsSubModal
      isOpen={isOpen}
      onClose={onClose}
      title="ระบบสุ่มคู่หู & ควิซประจำสัปดาห์ (40 สัปดาห์)"
      subtitle="จัดการอัตราสุ่ม, กฎการันตี, ร้านค้าเศษดาว, แจกของรางวัล, รีเซ็ต/คืนค่า และคลังคำถามตลอดปีการศึกษา"
      icon={<Sparkles className="w-5 h-5" />}
      iconBgClass="bg-purple-50"
      iconColorClass="text-purple-600"
      categoryPath="หมวด 5: นวัตกรรมการเรียนรู้และกิจกรรมนักเรียน"
      showSaveButton={false}
    >
      <div className="space-y-4">
        {/* Toast Feedback */}
        {toastMsg && (
          <div
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{toastMsg.text}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* 6 Category Tabs Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs flex flex-wrap gap-1">
          {[
            { key: 'RATES', label: 'อัตราสุ่ม & การันตี', icon: Sliders },
            { key: 'ECONOMY', label: 'ร้านค้า & เศษดาว', icon: ShoppingBag },
            { key: 'REWARDS', label: 'กฎแจกรางวัล', icon: Gift },
            { key: 'GRANT', label: 'แอดมินแจกของ', icon: Users },
            { key: 'RESET_ROLLBACK', label: 'รีเซ็ต & ย้อนกลับ', icon: RotateCcw },
            { key: 'QUIZ_40W', label: 'คลังควิซ 40 สัปดาห์', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: อัตราสุ่ม & การันตี (Rates & Pity) */}
        {/* ========================================================================= */}
        {activeTab === 'RATES' && (
          <div className="space-y-4 animate-fade-in">
            {/* System Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">สถานะเปิดใช้งานระบบกาชา</h4>
                <p className="text-xs text-slate-500">
                  เมื่อปิดการใช้งาน นักเรียนจะไม่สามารถกดสุ่มคู่หูได้
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Rarity Rates */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-900">
                  อัตราการสุ่มตามระดับความหายาก (รวม = 100%)
                </h4>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                    Math.abs(
                      config.rates.COMMON +
                        config.rates.UNCOMMON +
                        config.rates.RARE +
                        config.rates.EPIC +
                        config.rates.LEGENDARY +
                        config.rates.MYTHIC -
                        100
                    ) < 0.01
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  รวม:{' '}
                  {(
                    config.rates.COMMON +
                    config.rates.UNCOMMON +
                    config.rates.RARE +
                    config.rates.EPIC +
                    config.rates.LEGENDARY +
                    config.rates.MYTHIC
                  ).toFixed(1)}
                  %
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'COMMON', label: 'Common (ทั่วไป)', color: 'text-slate-700' },
                  { key: 'UNCOMMON', label: 'Uncommon (พิเศษ)', color: 'text-emerald-700' },
                  { key: 'RARE', label: 'Rare (หายาก)', color: 'text-blue-700' },
                  { key: 'EPIC', label: 'Epic (มหากาพย์)', color: 'text-purple-700' },
                  { key: 'LEGENDARY', label: 'Legendary (ตำนาน)', color: 'text-amber-700' },
                  { key: 'MYTHIC', label: 'Mythic (มายา)', color: 'text-rose-700' },
                ].map((item) => (
                  <div key={item.key} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className={`text-xs font-black block mb-1 ${item.color}`}>
                      {item.label}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={config.rates[item.key as GachaRarity]}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            rates: {
                              ...config.rates,
                              [item.key]: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pity System & Shards on Duplicate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <h4 className="text-sm font-black text-slate-900">ระบบการันตี (Pity Ceiling)</h4>
                <p className="text-xs text-slate-500">
                  จำนวนครั้งสุ่มสูงสุดก่อนรับประกันได้รับคู่หูระดับ Epic หรือสูงกว่า
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={(config as any).pityCeiling ?? config.pityMax ?? 80}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pityCeiling: parseInt(e.target.value, 10) || 90,
                        pityMax: parseInt(e.target.value, 10) || 90,
                      } as any)
                    }
                    className="w-32 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600">ครั้ง</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <h4 className="text-sm font-black text-slate-900">เศษดาวเมื่อสุ่มได้ตัวซ้ำ</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as GachaRarity[]).map(
                    (rarity) => (
                      <div key={rarity} className="text-[11px]">
                        <span className="block text-slate-500 font-bold">{rarity}</span>
                        <input
                          type="number"
                          min="1"
                          value={(config as any).duplicateShards?.[rarity] ?? config.shardsOnDuplicate?.[rarity] ?? 10}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setConfig({
                              ...config,
                              duplicateShards: {
                                ...((config as any).duplicateShards || config.shardsOnDuplicate),
                                [rarity]: val,
                              },
                              shardsOnDuplicate: {
                                ...config.shardsOnDuplicate,
                                [rarity]: val,
                              },
                            } as any);
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                💾 บันทึกการตั้งค่าอัตราสุ่ม
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ร้านค้า & เศรษฐกิจ (Economy & Shop) */}
        {/* ========================================================================= */}
        {activeTab === 'ECONOMY' && (
          <div className="space-y-4 animate-fade-in">
            {/* Direct Unlock Costs with Star Shards */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h4 className="text-sm font-black text-slate-900">
                ราคาปลดล็อกคู่หูด้วยเศษดาว (Star Shards)
              </h4>
              <p className="text-xs text-slate-500">
                นักเรียนสามารถนำเศษดาวจากการสุ่มตัวซ้ำมาแลกปลดล็อกคู่หูที่ยังไม่มีได้โดยตรง
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as GachaRarity[]).map(
                  (rarity) => (
                    <div key={rarity} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="block text-xs font-black text-slate-800 mb-1">{rarity}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          value={config.unlockCostShards[rarity]}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              unlockCostShards: {
                                ...config.unlockCostShards,
                                [rarity]: parseInt(e.target.value, 10) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                        />
                        <span className="text-[10px] text-slate-400">ชิ้น</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Shop Exchange Rates */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <h4 className="text-sm font-black text-slate-900">ราคาสินค้าในร้านค้า (Shop Pricing)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    เศษดาวแลกตั๋วสุ่ม (ชิ้น / 1 ตั๋ว)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.shop.shardsPerTicket}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        shop: {
                          ...config.shop,
                          shardsPerTicket: parseInt(e.target.value, 10) || 1,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    เหรียญซื้อตั๋วสุ่ม (เหรียญ / 1 ตั๋ว)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={config.shop.coinsPerTicket}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        shop: {
                          ...config.shop,
                          coinsPerTicket: parseInt(e.target.value, 10) || 10,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    ราคาข้าวกล่องคู่หู (เหรียญ)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={config.shop.foodPriceCoins}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        shop: {
                          ...config.shop,
                          foodPriceCoins: parseInt(e.target.value, 10) || 5,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    ราคาขนมหวานคู่หู (เหรียญ)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={config.shop.snackPriceCoins}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        shop: {
                          ...config.shop,
                          snackPriceCoins: parseInt(e.target.value, 10) || 5,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                💾 บันทึกการตั้งค่าร้านค้า
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: กฎแจกรางวัล (Rewards & Quests) */}
        {/* ========================================================================= */}
        {activeTab === 'REWARDS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Weekly Free Ticket Cap */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-black text-slate-900">
                  เพดานตั๋วฟรีรายสัปดาห์ (Weekly Free Ticket Cap)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                จำนวนตั๋วสุ่มสูงสุดที่นักเรียนแต่ละคนสามารถกดรับฟรีจากภารกิจ/กิจกรรมในแต่ละสัปดาห์
                เพื่อป้องกันการปั๊มตั๋วไม่จำกัด
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.rewards.weeklyFreeTicketCap}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rewards: {
                        ...config.rewards,
                        weeklyFreeTicketCap: parseInt(e.target.value, 10) || 3,
                      },
                    })
                  }
                  className="w-32 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
                <span className="text-xs font-bold text-slate-600">ใบ / สัปดาห์</span>
              </div>
            </div>

            {/* Quiz Base Rewards */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h4 className="text-sm font-black text-slate-900">รางวัลฐานจากควิซประจำสัปดาห์</h4>
              <p className="text-xs text-slate-500">
                เมื่อตอบถูกครบ 100% จะได้รับเต็ม หากถูกบางส่วนจะได้รับตามสัดส่วน
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">XP สูงสุด (เมื่อถูกหมด)</label>
                  <input
                    type="number"
                    min="10"
                    value={(config.quiz as any)?.baseXpPerQuiz ?? config.quiz.baseXpPerWeek}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        quiz: {
                          ...config.quiz,
                          baseXpPerWeek: parseInt(e.target.value, 10) || 100,
                          baseXpPerQuiz: parseInt(e.target.value, 10) || 100,
                        } as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">เหรียญทองสูงสุด</label>
                  <input
                    type="number"
                    min="5"
                    value={(config.quiz as any)?.baseCoinsPerQuiz ?? config.quiz.baseCoinsPerWeek}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        quiz: {
                          ...config.quiz,
                          baseCoinsPerWeek: parseInt(e.target.value, 10) || 50,
                          baseCoinsPerQuiz: parseInt(e.target.value, 10) || 50,
                        } as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-black text-slate-800 block mb-1">ตั๋วสุ่มเมื่อถูกครบทุกข้อ</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={(config.quiz as any)?.ticketsOnPerfect ?? config.rewards.quizPerfectTickets}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setConfig({
                        ...config,
                        rewards: {
                          ...config.rewards,
                          quizPerfectTickets: val,
                        },
                        quiz: {
                          ...config.quiz,
                          ticketsOnPerfect: val,
                        } as any,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                💾 บันทึกกฎการแจกรางวัล
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: แอดมินแจกของ (Admin Grant Tools) */}
        {/* ========================================================================= */}
        {activeTab === 'GRANT' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">มอบของรางวัลให้นักเรียน</h4>
                  <p className="text-xs text-slate-500">
                    แจกตั๋วสุ่ม, เศษดาว หรือคู่หูพิเศษให้รายบุคคลหรือทั้งห้องเรียน
                  </p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setGrantMode('single')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      grantMode === 'single' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    รายบุคคล
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantMode('classroom')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      grantMode === 'classroom' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    ยกห้องเรียน
                  </button>
                </div>
              </div>

              {/* Target selector */}
              {grantMode === 'single' ? (
                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    รหัสนักเรียน (Student ID):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 1001 หรือ STU001"
                    value={grantStudentId}
                    onChange={(e) => setGrantStudentId(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    เลือกห้องเรียนเป้าหมาย:
                  </label>
                  <select
                    value={grantClassroomId}
                    onChange={(e) => setGrantClassroomId(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="">-- กรุณาเลือกห้องเรียน --</option>
                    {classrooms.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Items to grant */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <label className="text-xs font-black text-purple-900 block mb-1">
                    🎟️ ตั๋วสุ่มคู่หู (ใบ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={grantTickets}
                    onChange={(e) => setGrantTickets(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <label className="text-xs font-black text-amber-900 block mb-1">
                    ✨ เศษดาว (Star Shards)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={grantShards}
                    onChange={(e) => setGrantShards(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200">
                  <label className="text-xs font-black text-teal-900 block mb-1">
                    🐾 ปลดล็อกคู่หูพิเศษ (ถ้าต้องการ)
                  </label>
                  <select
                    value={grantBuddyId}
                    onChange={(e) => setGrantBuddyId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-teal-300 text-xs font-bold bg-white"
                  >
                    <option value="">-- ไม่มอบคู่หู --</option>
                    {ALL_BUDDIES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.rarity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  เหตุผล / บันทึกการแจก (Audit Log):
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="เช่น รางวัลตอบคำถามยอดเยี่ยม"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExecuteGrant}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  🎁 ยืนยันการแจกของรางวัล
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: รีเซ็ต & คืนค่า (Reset & Rollback) */}
        {/* ========================================================================= */}
        {activeTab === 'RESET_ROLLBACK' && (
          <div className="space-y-4 animate-fade-in">
            {/* Reset Form */}
            <div className="bg-white rounded-2xl border border-red-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-red-600 border-b border-red-100 pb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-black text-slate-900">
                  รีเซ็ตข้อมูลกาชา (Reset Gacha Data)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                ระบบจะสร้างจุดสำรองข้อมูล (Snapshot) ให้อัตโนมัติทุกครั้งก่อนดำเนินการ
                เพื่อให้สามารถ Rollback คืนค่าได้ตลอดเวลา
              </p>

              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'single', label: 'รีเซ็ตรายคน', icon: User },
                  { key: 'classroom', label: 'รีเซ็ตยกห้อง', icon: Users },
                  { key: 'all', label: 'รีเซ็ตทุกคนทั้งระบบ', icon: RotateCcw },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setResetTargetMode(item.key as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      resetTargetMode === item.key
                        ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mb-1 text-slate-600" />
                    <span className="text-xs font-black text-slate-900 block">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Target Details */}
              {resetTargetMode === 'single' && (
                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    รหัสนักเรียนที่ต้องการรีเซ็ต:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 1001"
                    value={resetStudentId}
                    onChange={(e) => setResetStudentId(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              )}

              {resetTargetMode === 'classroom' && (
                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">
                    เลือกห้องเรียนที่ต้องการรีเซ็ต:
                  </label>
                  <select
                    value={resetClassroomId}
                    onChange={(e) => setResetClassroomId(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="">-- กรุณาเลือกห้องเรียน --</option>
                    {classrooms.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  เหตุผลในการรีเซ็ต:
                </label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="เช่น ขึ้นปีการศึกษาใหม่ หรือรีเซ็ตตามคำขอนักเรียน"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  ⚠️ ยืนยันการรีเซ็ตข้อมูล
                </button>
              </div>
            </div>

            {/* Snapshots & Rollback Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-black text-slate-900">
                    จุดย้อนกลับข้อมูล (Snapshots สำหรับ Rollback)
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-bold">
                  เก็บย้อนหลัง {snapshots.length} จุด
                </span>
              </div>

              {snapshots.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  ยังไม่มีจุดบันทึกย้อนกลับในระบบ
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 block truncate">{snap.name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(snap.createdAt).toLocaleString('th-TH')} • ครอบคลุม{' '}
                          {Object.keys(snap.studentStates).length} คน ({snap.description})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRollback(snap.id)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-2xs transition-colors"
                        >
                          คืนค่า (Rollback)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                          title="ลบจุดสำรอง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: คลังควิซ 40 สัปดาห์ (40-Week Quiz Manager) */}
        {/* ========================================================================= */}
        {activeTab === 'QUIZ_40W' && (
          <div className="space-y-4 animate-fade-in">
            {/* Week Selector Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    คลังคำถามประจำสัปดาห์ตลอดปีการศึกษา (40 สัปดาห์)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ภาคเรียนที่ 1: สัปดาห์ที่ 1–20 • ภาคเรียนที่ 2: สัปดาห์ที่ 21–40 (สัปดาห์ละ 3 ข้อ รวม 120 ข้อ)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      selectedWeek <= WEEKS_PER_TERM
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {selectedWeek <= WEEKS_PER_TERM
                      ? `ภาคเรียนที่ 1 (สัปดาห์ที่ ${selectedWeek})`
                      : `ภาคเรียนที่ 2 (สัปดาห์ที่ ${selectedWeek - WEEKS_PER_TERM})`}
                  </span>
                </div>
              </div>

              {/* 40-Week Button Grid */}
              <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 pt-1">
                {Array.from({ length: TOTAL_QUIZ_WEEKS }, (_, i) => i + 1).map((w) => {
                  const isTerm1 = w <= WEEKS_PER_TERM;
                  const active = selectedWeek === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeek(w)}
                      className={`h-8 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-400'
                          : isTerm1
                          ? 'bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-100'
                          : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-100'
                      }`}
                      title={`สัปดาห์ที่ ${w} (เทอม ${isTerm1 ? '1' : '2'})`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions of Selected Week */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Question list for week (3 cols) */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-xs font-black text-slate-700 block">
                  โจทย์สัปดาห์ที่ {selectedWeek} (3 ข้อ):
                </span>
                {quizQuestions.map((q, idx) => {
                  const active = selectedQuestionIdx === idx;
                  const isOverridden = !!config.quiz.questionOverrides?.[q.id];
                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => {
                        setSelectedQuestionIdx(idx);
                        setEditingQuestion({ ...q });
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900">ข้อที่ {idx + 1}</span>
                        <div className="flex items-center gap-1">
                          {isOverridden && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              แก้ไขแล้ว
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                            {q.subject || 'ทั่วไป'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{q.question}</p>
                    </div>
                  );
                })}
              </div>

              {/* Question Editor (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                {editingQuestion ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h5 className="text-xs font-black text-slate-900">
                        แก้ไขโจทย์ข้อที่ {selectedQuestionIdx + 1} (รหัส {editingQuestion.id})
                      </h5>
                      {config.quiz.questionOverrides?.[editingQuestion.id] && (
                        <button
                          type="button"
                          onClick={() => handleResetQuestionToDefault(editingQuestion.id)}
                          className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>คืนค่าโจทย์มาตรฐาน</span>
                        </button>
                      )}
                    </div>

                    {/* Question text */}
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1">
                        คำถาม (Question):
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuestion.question}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, question: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 4 Choices */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-800 block">
                        ตัวเลือก 4 ข้อ (คลิกเลือกวงกลมสีเขียวที่ข้อที่ถูกต้อง):
                      </label>
                      {editingQuestion.choices.map((choice, cidx) => {
                        const isCorrect = editingQuestion.answerIndex === cidx;
                        return (
                          <div
                            key={cidx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isCorrect ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={isCorrect}
                              onChange={() =>
                                setEditingQuestion({ ...editingQuestion, answerIndex: cidx })
                              }
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-slate-500 w-4">
                              {cidx + 1}.
                            </span>
                            <input
                              type="text"
                              value={choice}
                              onChange={(e) => {
                                const newChoices = [...editingQuestion.choices];
                                newChoices[cidx] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, choices: newChoices });
                              }}
                              className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                            />
                            {isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-100">
                                ข้อที่ถูก
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1">
                        คำอธิบายเฉลย (Explanation):
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.explanation || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                        }
                        placeholder="คำอธิบายสั้นๆ ที่แสดงหลังนักเรียนตอบ"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveQuestion}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        💾 บันทึกโจทย์ข้อนี้
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    กรุณาเลือกข้อคำถามที่ต้องการแก้ไข
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsSubModal>
  );
};
