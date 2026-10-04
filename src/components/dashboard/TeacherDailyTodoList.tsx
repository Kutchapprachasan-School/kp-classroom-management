import React from 'react';
import {
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { DailyTodoItem } from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherDailyTodoListProps {
  todos: DailyTodoItem[];
  onActionClick: (payload: CrossViewNavigationPayload) => void;
  onToggleTodo: (id: string) => void;
}

export const TeacherDailyTodoList: React.FC<TeacherDailyTodoListProps> = ({
  todos,
  onActionClick,
  onToggleTodo,
}) => {
  const completedCount = todos.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              สิ่งที่ต้องทำวันนี้ (To-Do List)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            เรียงลำดับตามคาบเวลาสอนจริง จัดการงานด่วนจบในคลิกเดียว
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
            เสร็จแล้ว {completedCount}/{totalCount} งาน ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div
          className="bg-teal-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* To-Do Items List */}
      <div className="divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
        {todos.map((item) => {
          const isDone = item.status === 'COMPLETED';
          const isAction = item.status === 'ACTION_REQUIRED';

          return (
            <div
              key={item.id}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDone
                  ? 'bg-slate-50/60 border-slate-200/60 opacity-80'
                  : isAction
                  ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTodo(item.id)}
                  title={isDone ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                    isDone
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 bg-white hover:border-teal-500 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.time} ({item.periodLabel})
                    </span>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                      {item.classroom}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAction
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.statusBadge}
                    </span>
                  </div>

                  <h3
                    className={`text-xs sm:text-sm font-bold mt-1 text-slate-900 truncate ${
                      isDone ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {item.title}
                  </h3>

                  {item.summaryText && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">
                      {item.summaryText}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action Button */}
              <div className="flex items-center justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => onActionClick(item.targetPayload)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isDone
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : isAction
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/10'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  <span>{item.actionLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
