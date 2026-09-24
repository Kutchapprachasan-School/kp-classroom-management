import React, { useState } from 'react';
import { FileText, ArrowRight, ChevronDown } from 'lucide-react';
import type { StudentQuestItem } from '../../types/viewModels';

interface QuestBoardProps {
  quests: StudentQuestItem[];
  onOpenQuest: (quest: StudentQuestItem) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ quests, onOpenQuest }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'all'>('pending');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card space-y-4">
      {/* Title & Subject Filter */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
          ภารกิจของฉัน
        </h3>

        <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <span>ทุกวิชา</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-[#0f2e5c] text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          รอดำเนินการ
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'submitted'
              ? 'bg-[#0f2e5c] text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          ส่งแล้ว
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-[#0f2e5c] text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          ทั้งหมด
        </button>
      </div>

      {/* Quest Items List */}
      <div className="space-y-3 pt-1">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            {/* Left: Icon & Description */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {quest.subjectTitle}
                </div>
                <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {quest.title}
                </h4>
                <div className="text-[11px] text-slate-400">
                  {quest.dueDateText} · {quest.maxScore} คะแนน
                </div>
              </div>
            </div>

            {/* Right: Status, Button & XP indicator */}
            <div className="flex flex-col sm:items-end w-full sm:w-auto gap-2">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
                  {quest.statusLabel}
                </span>

                <button
                  onClick={() => onOpenQuest(quest)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e3c88] hover:bg-[#0b3272] text-white text-xs font-medium rounded-xl shadow-xs transition-colors"
                >
                  <span>เปิดภารกิจ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] font-medium text-emerald-700 sm:text-right">
                +{quest.xpReward} XP เมื่อครูตรวจผ่าน
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
