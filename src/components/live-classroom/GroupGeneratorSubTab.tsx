// src/components/live-classroom/GroupGeneratorSubTab.tsx
// แท็บที่ 3: แบ่งกลุ่มกิจกรรมแบบสมดุล (คละผลการเรียน), สุ่มหัวหน้ากลุ่ม 👑,
// สลับสมาชิกข้ามกลุ่มแบบฉับพลัน, แจกรางวัลยกกลุ่ม, และระบบ Group Presets บันทึก/โหลดกลุ่มเดิม

import React, { useState, useEffect, useCallback } from 'react';
import RandomRegular from '@mingcute/react/core-regular/random';
import {
  Users,
  Crown,
  ArrowLeftRight,
  Save,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import type { LiveStudent } from '../../services/liveClassroomService';
import { liveClassroomService } from '../../services/liveClassroomService';
import {
  generateBalancedGroups,
  type StudentGroup,
} from '../../utils/liveClassroomAlgorithms';

export interface GroupPresetItem {
  id: string;
  classroomId: string;
  presetName: string;
  groupsData: StudentGroup[];
  createdAt: string;
  teacherId?: string;
  teacherName?: string;
  subject?: string;
}

export interface GroupGeneratorSubTabProps {
  students: LiveStudent[];
  classroomId: string;
  isProjectorMode: boolean;
  groups: StudentGroup[];
  setGroups: React.Dispatch<React.SetStateAction<StudentGroup[]>>;
  currentTeacherId?: string;
  currentTeacherName?: string;
  subjectName?: string;
  onGiveRewardGroup: (studentIds: string[], groupName: string) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  onNotifyToast?: (message: string) => void;
}

export function swapStudentsBetweenGroups(
  groups: StudentGroup[],
  studentAId: string,
  studentBId: string
): StudentGroup[] {
  let studentA: LiveStudent | null = null;
  let studentB: LiveStudent | null = null;

  groups.forEach((g) => {
    g.members.forEach((m) => {
      if (m.id === studentAId) studentA = m;
      if (m.id === studentBId) studentB = m;
    });
  });

  if (!studentA || !studentB) return groups;

  return groups.map((g) => {
    let nextLeaderId = g.leaderId;
    if (g.leaderId === studentAId) {
      nextLeaderId = studentBId;
    } else if (g.leaderId === studentBId) {
      nextLeaderId = studentAId;
    }

    return {
      ...g,
      leaderId: nextLeaderId,
      members: g.members.map((m) => {
        if (m.id === studentAId) return studentB!;
        if (m.id === studentBId) return studentA!;
        return m;
      }),
    };
  });
}

export const GroupGeneratorSubTab: React.FC<GroupGeneratorSubTabProps> = ({
  students,
  classroomId,
  isProjectorMode,
  groups,
  setGroups,
  currentTeacherId,
  currentTeacherName,
  subjectName,
  onGiveRewardGroup,
  onPlaySound,
  onNotifyToast,
}) => {
  const [groupMode, setGroupMode] = useState<'byGroupCount' | 'byGroupSize'>('byGroupCount');
  const [groupCountInput, setGroupCountInput] = useState<number>(4);
  const [groupSizeInput, setGroupSizeInput] = useState<number>(4);
  const [strategy, setStrategy] = useState<'balanced' | 'random'>('balanced');
  const [autoLeader, setAutoLeader] = useState<boolean>(true);
  const [balanceGender, setBalanceGender] = useState<boolean>(true);
  const [excludeAbsent, setExcludeAbsent] = useState<boolean>(true);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);

  // Group Presets State (Scoped per Teacher & Subject)
  const [savedPresets, setSavedPresets] = useState<GroupPresetItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  const presentCount = students.filter((s) => s.present).length;
  const absentCount = students.length - presentCount;

  const loadPresets = useCallback(() => {
    if (!classroomId) return;
    const presets = liveClassroomService.getGroupPresets<StudentGroup[]>(
      classroomId,
      currentTeacherId,
      subjectName
    );
    setSavedPresets(presets);
  }, [classroomId, currentTeacherId, subjectName]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleGenerate = () => {
    const result = generateBalancedGroups({
      students,
      mode: groupMode,
      targetValue: groupMode === 'byGroupCount' ? groupCountInput : groupSizeInput,
      strategy,
      autoLeader,
      balanceGender,
      excludeAbsent,
    });
    setGroups(result);
    setSwapSourceId(null);
    onPlaySound?.('fanfare');
  };

  const handleMemberClickForSwap = (studentId: string) => {
    if (!swapSourceId) {
      setSwapSourceId(studentId);
      return;
    }
    if (swapSourceId === studentId) {
      setSwapSourceId(null);
      return;
    }

    // สลับสมาชิก 2 คนระหว่างกลุ่ม
    setGroups((prevGroups) => swapStudentsBetweenGroups(prevGroups, swapSourceId, studentId));

    setSwapSourceId(null);
    onPlaySound?.('tick', 750);
  };

  const handleSavePreset = () => {
    if (groups.length === 0) return;
    const name = presetNameInput.trim() || `กลุ่มกิจกรรมวันที่ ${new Date().toLocaleDateString('th-TH')}`;
    liveClassroomService.saveGroupPreset(
      classroomId,
      name,
      groups,
      currentTeacherId,
      currentTeacherName,
      subjectName
    );
    loadPresets();
    setPresetNameInput('');
    onNotifyToast?.(`💾 บันทึกกลุ่ม "${name}" (เฉพาะรายวิชานี้) เรียบร้อยแล้ว!`);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = savedPresets.find((p) => p.id === presetId);
    if (found) {
      setGroups(found.groupsData);
      onNotifyToast?.(`📂 โหลดกลุ่ม "${found.presetName}" สำเร็จ!`);
      onPlaySound?.('fanfare');
    }
  };

  const handleDeletePreset = (presetId: string) => {
    if (!presetId) return;
    const target = savedPresets.find((p) => p.id === presetId);
    const confirmMsg = target
      ? `คุณต้องการลบชุดกลุ่ม "${target.presetName}" ใช่หรือไม่?`
      : 'คุณต้องการลบชุดกลุ่มนี้ใช่หรือไม่?';
    if (window.confirm(confirmMsg)) {
      liveClassroomService.deleteGroupPreset(classroomId, presetId, currentTeacherId, subjectName);
      setSelectedPresetId('');
      loadPresets();
      onNotifyToast?.('🗑️ ลบชุดกลุ่มเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Top Setting Controls Bar */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as 'byGroupCount' | 'byGroupSize')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              <option value="byGroupCount">แบ่งตามจำนวนกลุ่ม</option>
              <option value="byGroupSize">แบ่งตามจำนวนคนต่อกลุ่ม</option>
            </select>

            {groupMode === 'byGroupCount' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={groupCountInput}
                  onChange={(e) => setGroupCountInput(Math.max(2, Number(e.target.value)))}
                  className={`w-14 rounded-xl px-2 py-1 text-center font-bold text-xs border ${
                    isProjectorMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
                  }`}
                />
                <span className="text-xs text-slate-400 font-medium">กลุ่ม</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={groupSizeInput}
                  onChange={(e) => setGroupSizeInput(Math.max(2, Number(e.target.value)))}
                  className={`w-14 rounded-xl px-2 py-1 text-center font-bold text-xs border ${
                    isProjectorMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
                  }`}
                />
                <span className="text-xs text-slate-400 font-medium">คน/กลุ่ม</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
              }`}
            >
              เงื่อนไข:
            </span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as 'balanced' | 'random')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              <option value="balanced">⚖️ คละระดับคะแนน (Balanced Tiers)</option>
              <option value="random">🎲 สุ่มคละอิสระ (Pure Random)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={autoLeader}
              onChange={(e) => setAutoLeader(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className={isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'}>
              👑 สุ่มหัวหน้ากลุ่ม
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={balanceGender}
              onChange={(e) => setBalanceGender(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className={isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'}>
              👫 คละชาย-หญิง
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={excludeAbsent}
              onChange={(e) => setExcludeAbsent(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className={isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'}>
              🚫 ไม่รวมคนไม่มาเรียน {absentCount > 0 ? `(ขาด ${absentCount} คน)` : ''}
            </span>
          </label>
        </div>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <RandomRegular className="w-4 h-4" />
          <span>สุ่มจัดกลุ่มทันที</span>
        </button>
      </div>

      {/* Group Presets Save & Load Bar (Scoped exclusively to this teacher & subject) */}
      <div
        className={`rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-[#F7FAFF] border-[#E6EEF7]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="ตั้งชื่อกลุ่ม เช่น โครงงานบทที่ 3..."
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isProjectorMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-[#E2E8F0] text-[#163A66] placeholder-slate-400'
            }`}
          />

          <button
            onClick={handleSavePreset}
            disabled={groups.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>💾 บันทึกกลุ่มนี้ไว้ใช้ซ้ำ</span>
          </button>
        </div>

        {/* Load Preset Dropdown with Isolated Scope */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FolderOpen className="w-4 h-4 text-blue-500" />
          <span
            className={`text-xs font-semibold ${
              isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
            }`}
          >
            โหลดกลุ่มเดิม:
          </span>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              if (e.target.value) handleSelectPreset(e.target.value);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
              isProjectorMode
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-white border-[#E2E8F0] text-[#163A66]'
            }`}
          >
            <option value="" disabled>
              {savedPresets.length > 0 ? '-- เลือกกลุ่มที่เคยบันทึก --' : 'ยังไม่มีกลุ่มที่บันทึกไว้'}
            </option>
            {savedPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.presetName} ({new Date(preset.createdAt).toLocaleDateString('th-TH')})
              </option>
            ))}
          </select>

          {selectedPresetId && (
            <button
              onClick={() => handleDeletePreset(selectedPresetId)}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
              title="ลบชุดกลุ่มนี้"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Swap Hint Banner */}
      {groups.length > 0 && (
        <div
          className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs border transition-colors ${
            swapSourceId
              ? 'bg-blue-600 text-white border-blue-500 shadow-md animate-pulse'
              : isProjectorMode
              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
              : 'bg-blue-50 border-blue-200 text-[#163A66]'
          }`}
        >
          <span className="flex items-center gap-2">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {swapSourceId
              ? 'กำลังเลือกสลับที่: คลิกที่ชื่อนักเรียนอีกคนในกลุ่มอื่นเพื่อสลับที่กันทันที'
              : 'เคล็ดลับ: คลิกที่ชื่อนักเรียน 2 คนต่างกลุ่มกัน เพื่อสลับกลุ่มหน้างานได้ทันที'}
          </span>
          {swapSourceId && (
            <button
              onClick={() => setSwapSourceId(null)}
              className="text-xs font-bold underline ml-2"
            >
              ยกเลิก
            </button>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className={`rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                isProjectorMode
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-[#E6EEF7] shadow-sm'
              }`}
            >
              <div>
                <div
                  className={`flex items-start justify-between pb-3 mb-3 border-b ${
                    isProjectorMode ? 'border-slate-800' : 'border-[#E6EEF7]'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-base text-blue-600 flex items-center gap-1.5">
                      <span>{grp.name}</span>
                      <span className="text-xs font-semibold text-slate-400">
                        ({grp.members.length} คน)
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-semibold mt-0.5">
                      <span className="text-blue-500 flex items-center gap-0.5">
                        👦 {grp.members.filter((m) => m.gender !== 'FEMALE').length}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-pink-500 flex items-center gap-0.5">
                        👧 {grp.members.filter((m) => m.gender === 'FEMALE').length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onGiveRewardGroup(
                        grp.members.map((m) => m.id),
                        grp.name
                      )
                    }
                    className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-500 font-bold px-2.5 py-1 rounded-lg transition active:scale-95 shrink-0"
                  >
                    +1 🪙 ยกกลุ่ม
                  </button>
                </div>

                <ul className="space-y-1.5">
                  {grp.members.map((member, mIdx) => {
                    const isLeader = grp.leaderId === member.id;
                    const isSelected = swapSourceId === member.id;
                    return (
                      <li key={member.id}>
                        <button
                          onClick={() => handleMemberClickForSwap(member.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                              : isProjectorMode
                              ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                              : 'bg-[#F7FAFF] hover:bg-blue-50 text-[#163A66]'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isLeader ? (
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <span className="text-slate-400 w-3 text-center shrink-0">{mIdx + 1}.</span>
                            )}
                            <span className="font-bold truncate">{member.name}</span>
                            <span
                              className="text-[11px] shrink-0"
                              title={member.gender === 'FEMALE' ? 'นักเรียนหญิง' : 'นักเรียนชาย'}
                            >
                              {member.gender === 'FEMALE' ? '👧' : '👦'}
                            </span>
                            {!member.present && (
                              <span className="text-[10px] bg-rose-500/10 text-rose-600 border border-rose-300 px-1 py-0.2 rounded font-bold shrink-0">
                                ขาด
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-1">
                            #{member.studentCode}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`flex-1 rounded-3xl p-12 flex flex-col items-center justify-center text-center border transition-colors ${
            isProjectorMode
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-[#E6EEF7] shadow-sm'
          }`}
        >
          <Users className="w-16 h-16 mb-3 opacity-30 text-blue-500" />
          <p
            className={`text-lg font-bold ${
              isProjectorMode ? 'text-slate-300' : 'text-[#163A66]'
            }`}
          >
            ยังไม่ได้จัดกลุ่มกิจกรรม
          </p>
          <p className="text-xs text-slate-400 mt-1">
            เลือกจำนวนกลุ่มและเงื่อนไขด้านบน แล้วกดปุ่ม &ldquo;สุ่มจัดกลุ่มทันที&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};
