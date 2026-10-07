import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Users,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { DailyTodoItem } from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherAllTasksMobileViewProps {
  todos: DailyTodoItem[];
  onSelectTask: (task: DailyTodoItem) => void;
  onActionClick?: (payload: CrossViewNavigationPayload) => void;
  onToggleTodo: (id: string) => void;
}

type FilterChip = 'ALL' | 'TEACHING' | 'GRADING' | 'MEETING';

export const TeacherAllTasksMobileView: React.FC<TeacherAllTasksMobileViewProps> = ({
  todos,
  onSelectTask,
  onToggleTodo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('ALL');

  // Expanded task list for "งานทั้งหมด" showcase matching Screen 4
  const allTasksList: (DailyTodoItem & { category: FilterChip; iconBg: string; iconColor: string })[] = useMemo(() => {
    return [
      ...todos.map((t) => ({
        ...t,
        category: (t.periodLabel === 'ตรวจงาน'
          ? 'GRADING'
          : t.periodLabel === 'แถวเช้า'
          ? 'ALL'
          : 'TEACHING') as FilterChip,
        iconBg:
          t.periodLabel === 'แถวเช้า'
            ? 'bg-blue-100'
            : t.periodLabel === 'ตรวจงาน'
            ? 'bg-emerald-100'
            : 'bg-purple-100',
        iconColor:
          t.periodLabel === 'แถวเช้า'
            ? 'text-blue-700'
            : t.periodLabel === 'ตรวจงาน'
            ? 'text-emerald-700'
            : 'text-purple-700',
      })),
      {
        id: 'task-extra-science',
        time: '10:20 - 11:10',
        periodLabel: 'คาบ 3',
        title: 'เข้าสอนวิชาวิทยาศาสตร์ (ว33201)',
        classroom: 'ม.6/1',
        subjectCode: 'ว33201',
        subjectName: 'วิทยาศาสตร์กายภาพ',
        status: 'UPCOMING' as const,
        statusBadge: 'รอเข้าสอน',
        summaryText: 'ห้องปฏิบัติการเคมี 2',
        actionLabel: 'เริ่มสอน',
        category: 'TEACHING' as const,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-700',
        targetPayload: {
          view: 'classroom-attendance',
          highlightBanner: 'วิชาวิทยาศาสตร์ ม.6/1',
        },
      },
      {
        id: 'task-extra-meeting',
        time: '15:30 - 16:30',
        periodLabel: 'ประชุม',
        title: 'ประชุมกลุ่มสาระการเรียนรู้',
        classroom: 'ห้องประชุม 2',
        subjectCode: 'MEET',
        subjectName: 'ประชุมกลุ่มสาระภาษาต่างประเทศ',
        status: 'UPCOMING' as const,
        statusBadge: 'รอประชุม',
        summaryText: 'วางแผนงานวันภาษาอังกฤษและวัดผลกลางภาค',
        actionLabel: 'ดูวาระ',
        category: 'MEETING' as const,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-700',
        targetPayload: {
          view: 'timetable',
          highlightBanner: 'ประชุมกลุ่มสาระภาษาต่างประเทศ',
        },
      },
      {
        id: 'task-extra-club',
        time: '16:40 - 17:30',
        periodLabel: 'กิจกรรม',
        title: 'จัดกิจกรรมพัฒนาผู้เรียน (ชมรม)',
        classroom: 'ม.5/1',
        subjectCode: 'ACT',
        subjectName: 'ชมรมภาษาอังกฤษเพื่อการสื่อสาร',
        status: 'UPCOMING' as const,
        statusBadge: 'รอดำเนินการ',
        summaryText: 'ฝึกทักษะการนำเสนอภาษาอังกฤษ',
        actionLabel: 'เช็คชื่อ',
        category: 'TEACHING' as const,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-700',
        targetPayload: {
          view: 'classroom-attendance',
          highlightBanner: 'ชมรม ม.5/1',
        },
      },
    ];
  }, [todos]);

  const filteredTasks = useMemo(() => {
    return allTasksList.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.classroom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.time.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'ALL') return true;
      return item.category === activeFilter;
    });
  }, [allTasksList, searchTerm, activeFilter]);

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900">งานทั้งหมด</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหา ตรวจสอบ และติดตามงานสอน/ภาระงานทั้งหมด
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0C6D5B] text-xs font-bold">
          {filteredTasks.length} รายการ
        </span>
      </div>

      {/* Search Bar matching Screen 4 */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหางาน, ห้องเรียน, หรือวิชา..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0C6D5B] focus:ring-1 focus:ring-[#0C6D5B] shadow-2xs"
        />
      </div>

      {/* Filter Chips matching Screen 4 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#0C6D5B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ทั้งหมด
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('TEACHING')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'TEACHING'
              ? 'bg-[#0C6D5B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          สอน
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('GRADING')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'GRADING'
              ? 'bg-[#0C6D5B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ตรวจงาน
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('MEETING')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'MEETING'
              ? 'bg-[#0C6D5B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ประชุม
        </button>
      </div>

      {/* Task List matching Screen 4 in Mockup */}
      <div className="space-y-2.5">
        {filteredTasks.map((item) => {
          const isDone = item.status === 'COMPLETED';

          return (
            <div
              key={item.id}
              onClick={() => onSelectTask(item)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#0C6D5B]/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              {/* Left Section: Icon & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 font-bold`}
                >
                  {item.category === 'GRADING' ? (
                    <FileText className="w-5 h-5" />
                  ) : item.category === 'MEETING' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-bold text-slate-900 group-hover:text-[#0C6D5B] truncate ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{item.classroom}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              {/* Right Section: Checkmark / Radio Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTodo(item.id);
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-[#0C6D5B] text-white'
                    : 'border-2 border-slate-300 hover:border-[#0C6D5B] bg-white'
                }`}
                title={isDone ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}
              >
                {isDone && <CheckCircle2 className="w-4 h-4 fill-current text-white" />}
              </button>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>
    </div>
  );
};
