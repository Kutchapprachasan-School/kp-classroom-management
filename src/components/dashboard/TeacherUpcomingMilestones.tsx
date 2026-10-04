import React, { useState } from 'react';
import {
  CalendarDays,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  BookCheck,
  ChevronRight,
  Clock,
} from 'lucide-react';
import {
  teacherCalendarTodoService,
  type UpcomingMilestone,
} from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherUpcomingMilestonesProps {
  onActionClick: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherUpcomingMilestones: React.FC<TeacherUpcomingMilestonesProps> = ({
  onActionClick,
}) => {
  const [activeTab, setActiveTab] = useState<'THIS_WEEK' | 'THIS_MONTH' | 'THIS_TERM'>(
    'THIS_WEEK'
  );

  const milestones = teacherCalendarTodoService.getUpcomingMilestones();

  const weekMilestones = milestones.filter((m) => m.horizon === 'THIS_WEEK');
  const monthMilestones = milestones.filter((m) => m.horizon === 'THIS_MONTH');
  const termMilestones = milestones.filter((m) => m.horizon === 'THIS_TERM');

  const currentList =
    activeTab === 'THIS_WEEK'
      ? weekMilestones
      : activeTab === 'THIS_MONTH'
      ? monthMilestones
      : termMilestones;

  const getCategoryIcon = (category: UpcomingMilestone['category']) => {
    switch (category) {
      case 'SGS':
        return <GraduationCap className="w-4 h-4 text-teal-600" />;
      case 'EXAM':
        return <FileCheck2 className="w-4 h-4 text-indigo-600" />;
      case 'AFFAIRS':
        return <HeartHandshake className="w-4 h-4 text-amber-600" />;
      default:
        return <BookCheck className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header and Horizon Tab Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-teal-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              งานสำคัญที่กำลังจะมาถึง (Upcoming Horizon)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            เดดไลน์ส่งเกรด SGS, ตรวจการบ้าน, ประเมินเยี่ยมบ้าน CCT และงานวิชาการ
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl gap-1 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'THIS_WEEK'
                ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>สัปดาห์นี้</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'THIS_WEEK'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {weekMilestones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'THIS_MONTH'
                ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>เดือนนี้</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'THIS_MONTH'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {monthMilestones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('THIS_TERM')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'THIS_TERM'
                ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>เทอมนี้</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'THIS_TERM'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {termMilestones.length}
            </span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentList.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              item.isUrgent
                ? 'bg-rose-50/30 border-rose-200/90 shadow-2xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-slate-100">{getCategoryIcon(item.category)}</div>
                  <span className="text-[11px] font-bold text-slate-500">{item.category}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      item.isUrgent
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {item.daysRemainingText}
                  </span>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                กำหนด: <strong className="text-slate-600">{item.dueDate}</strong>
              </span>

              <button
                type="button"
                onClick={() => onActionClick(item.targetPayload)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>เปิดดูงาน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
