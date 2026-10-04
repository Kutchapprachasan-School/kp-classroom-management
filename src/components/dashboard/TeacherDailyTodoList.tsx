import React from 'react';
import {
  Check,
  Clock,
  Play,
  FileText,
  User,
  Users,
} from 'lucide-react';
import type { DailyTodoItem } from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherDailyTodoListProps {
  todos: DailyTodoItem[];
  onActionClick: (payload: CrossViewNavigationPayload) => void;
  onToggleTodo: (id: string) => void;
  onSelectTask?: (task: DailyTodoItem) => void;
}

export const TeacherDailyTodoList: React.FC<TeacherDailyTodoListProps> = ({
  todos,
  onActionClick,
  onToggleTodo,
  onSelectTask,
}) => {
  const completedCount = todos.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
      {/* Header matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0C6D5B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              สิ่งที่ต้องทำวันนี้ (To-Do List)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดลำดับตามเวลาเรียน และงานที่ต้องดำเนินการ
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <span className="text-xs font-semibold text-slate-700">
            เสร็จแล้ว {completedCount}/{totalCount} งาน ({progressPercent}%)
          </span>
          <div className="w-36 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0C6D5B] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Todo items */}
      <div className="divide-y divide-slate-100">
        {todos.map((item) => {
          const isDone = item.status === 'COMPLETED';
          const isGrading = item.periodLabel === 'ตรวจงาน';

          return (
            <div
              key={item.id}
              className="py-4 sm:py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left & Center section */}
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Circle checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTodo(item.id)}
                  title={isDone ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                  className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    isDone
                      ? 'bg-[#0C6D5B] text-white'
                      : 'border-2 border-slate-300 hover:border-[#0C6D5B] bg-white'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Time Box */}
                <div className="w-24 sm:w-28 shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {item.time}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {item.periodLabel}
                  </div>
                </div>

                {/* Task Details */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectTask?.(item)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0C6D5B] transition-colors ${
                        isDone ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {item.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#E6F4F1] text-[#0C6D5B] text-[11px] font-bold">
                      {item.classroom}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.summaryText || (isGrading
                      ? 'ตรวจใบงานที่ 2 : ออกแบบโปสเตอร์ (R2 / Canva)'
                      : 'สอนตามแผนการจัดการเรียนรู้ (PBL)')}
                  </p>

                  {/* Metadata Row matching Mockup */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>ห้อง {item.classroom}</span>
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>38 คน</span>
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {isDone
                          ? 'เช็คชื่อภายใน 08:20'
                          : isGrading
                          ? 'ส่งภายใน 15:30'
                          : `เริ่มสอน ${item.time.split('-')[0].trim()}`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Section */}
              <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0">
                {isDone ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-[#E8F8F0] text-[#0C8050] text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>เสร็จแล้ว</span>
                  </span>
                ) : (
                  <>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FEF6E9] text-[#B87000] text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#B87000]" />
                      <span>รอดำเนินการ</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onActionClick(item.targetPayload)}
                      className="px-4 py-2 rounded-xl bg-[#0C6D5B] hover:bg-[#095748] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      {isGrading ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isGrading ? 'ตรวจงาน' : 'เริ่มสอน'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
