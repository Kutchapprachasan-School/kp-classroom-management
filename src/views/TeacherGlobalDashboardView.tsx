import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Plus,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface TeacherGlobalDashboardViewProps {
  onNavigateToClass: (classId: string) => void;
  onNavigateToAttendance: () => void;
  onNavigateToReadiness: () => void;
  onNavigateToAcademicYear?: () => void;
  onNavigateToCourses?: () => void;
}

export const TeacherGlobalDashboardView: React.FC<TeacherGlobalDashboardViewProps> = ({
  onNavigateToClass,
  onNavigateToAttendance,
  onNavigateToReadiness,
  onNavigateToAcademicYear,
  onNavigateToCourses,
}) => {
  const [activePeriodTab, setActivePeriodTab] = useState<'today' | 'week' | 'month'>('today');
  const [todos, setTodos] = useState([
    { id: 'todo-1', text: 'ส่งคะแนนหน่วย 1–2 เข้า SGS', done: true },
    { id: 'todo-2', text: 'ตามงานค้าง ม.3/1 (2 คน)', done: false },
    { id: 'todo-3', text: 'ประเมินคุณลักษณะ ม.1/8', done: false },
    { id: 'todo-4', text: 'ตรวจรายชื่อเสี่ยง มส. (7 คน)', done: false },
  ]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  const todayScheduleRows = [
    {
      period: 'คาบ 2',
      time: '09:20–10:10',
      courseCode: 'ศ23101',
      subject: 'ศิลปะพื้นฐาน 5',
      classroom: 'ม.3/1',
      room: 'ห้องศิลปะ 2',
      status: 'CHECKED',
      attendanceSummary: 'มา 22 · ลา 1',
    },
    {
      period: 'คาบ 7',
      time: '13:30–14:20',
      courseCode: 'ก23901',
      subject: 'แนะแนว',
      classroom: 'ม.3/1',
      room: 'ห้อง 304',
      status: 'PENDING',
      attendanceSummary: 'รอเช็คชื่อ (23 คน)',
    },
    {
      period: 'คาบ 8',
      time: '14:20–15:10',
      courseCode: 'ก20905',
      subject: 'ชุมนุมดนตรีไทย',
      classroom: 'ม.1–ม.3',
      room: 'หอประชุมดนตรี',
      status: 'PENDING',
      attendanceSummary: 'รอเช็คชื่อ (30 คน)',
    },
  ];

  const classroomTaskRows = [
    {
      id: 'task-1',
      category: 'เช็คชื่อรายคาบที่ค้าง',
      affectedClasses: 9,
      totalVolume: '65 คาบ',
      priority: 'HIGH',
      actionLabel: 'เช็คชื่อ',
      onClick: onNavigateToAttendance,
    },
    {
      id: 'task-2',
      category: 'กรอกคะแนนเก็บระหว่างภาค',
      affectedClasses: 8,
      totalVolume: '375 ช่อง',
      priority: 'HIGH',
      actionLabel: 'กรอกคะแนน',
      onClick: () => onNavigateToClass('cls-1'),
    },
    {
      id: 'task-3',
      category: 'ประเมินคุณลักษณะ & อ่านคิดวิเคราะห์',
      affectedClasses: 9,
      totalVolume: '276 คน',
      priority: 'MEDIUM',
      actionLabel: 'ประเมิน',
      onClick: onNavigateToReadiness,
    },
    {
      id: 'task-4',
      category: 'ตรวจความครบก่อนส่งเกรด (ปพ.5)',
      affectedClasses: 9,
      totalVolume: '9 ห้อง',
      priority: 'MEDIUM',
      actionLabel: 'ตรวจสอบ',
      onClick: onNavigateToReadiness,
    },
    {
      id: 'task-5',
      category: 'ผูกหน่วยการเรียนรู้',
      affectedClasses: 0,
      totalVolume: 'ครบ 100%',
      priority: 'DONE',
      actionLabel: 'ดูหลักสูตร',
      onClick: () => onNavigateToCourses?.(),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 select-none">
      {/* 1. Top Identity & Semester Progress Header (60% White Surface, 30% Slate Ink, 10% Teal Accent) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="นายภาสภูมิ เรืองปราชญ์"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                นายภาสภูมิ เรืองปราชญ์
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ครูประจำกลุ่มสาระการเรียนรู้ศิลปะ • วันอังคารที่ 22 กันยายน พ.ศ. 2569
              </p>
            </div>
          </div>

          {/* Semester Progress Compact Control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:w-[420px] pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">
                  ภาคเรียนที่ 1/2569 (สัปดาห์ 19/20)
                </span>
                <span className="font-bold text-teal-700 tabular-nums">
                  93% · เหลือ 10 วัน
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: '93%' }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (onNavigateToAcademicYear) onNavigateToAcademicYear();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0 transition-colors self-start sm:self-center"
            >
              ตั้งค่าภาคเรียน
            </button>
          </div>
        </div>
      </div>

      {/* 2. Rule of Thirds (กฎสามส่วน): 3 Balanced Summary Zones (1/3 : 1/3 : 1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Zone 1/3: ภาระงานสอน */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              นักเรียนที่ดูแลรับผิดชอบ
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                525
              </span>
              <span className="text-xs font-medium text-slate-500">
                คน (12 ชั้นเรียน)
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 tabular-nums">
            <div>ประถม/มัธยมต้น</div>
            <div className="font-semibold text-slate-700 mt-0.5">ครบทุกห้อง</div>
          </div>
        </div>

        {/* Zone 2/3: สถิติเวลาเรียนและคะแนนเฉลี่ย */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              อัตราการมาเรียนเฉลี่ยทั้งภาคเรียน
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-700 tabular-nums">
                95.0%
              </span>
              <span className="text-xs font-medium text-slate-500">
                คะแนนเฉลี่ย 82%
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            <Check className="w-3.5 h-3.5" /> เกณฑ์ดีเยี่ยม
          </span>
        </div>

        {/* Zone 3/3: นักเรียนกลุ่มเสี่ยง มส. */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              กลุ่มเสี่ยงเวลาเรียนไม่ถึงเกณฑ์ (มส.)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600 tabular-nums">
                7
              </span>
              <span className="text-xs font-medium text-slate-500">
                คน ที่ต้องซ่อมเวลาเรียน
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToReadiness}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            ดูรายชื่อ
          </button>
        </div>
      </div>

      {/* 3. Rule of Thirds Workspace Grid: 2/3 Data Tables (8 cols) + 1/3 Action Checklist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 2/3 Column (8 cols): Structured Data Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Concise 1-Line Action Banner */}
          <div className="bg-teal-50/90 border border-teal-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-teal-950">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>รอเช็คชื่อวันนี้ 2 คาบ</strong> · ระบบติ๊ก “มาเรียน” ให้ครบแล้ว กดแก้เฉพาะ สาย/ลา/ขาด
              </span>
            </div>
            <button
              onClick={onNavigateToAttendance}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors self-start sm:self-center"
            >
              เช็คชื่อทันที
            </button>
          </div>

          {/* Table 1: ตารางสอนและเช็คชื่อประจำวัน */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  ตารางสอนวันนี้
                </h2>
              </div>

              {/* Period Switcher */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs self-start sm:self-auto">
                {[
                  { key: 'today', label: 'วันนี้' },
                  { key: 'week', label: 'สัปดาห์นี้' },
                  { key: 'month', label: 'เดือนนี้' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActivePeriodTab(tab.key as 'today' | 'week' | 'month')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      activePeriodTab === tab.key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                    <th className="py-3 px-4">คาบ / เวลา</th>
                    <th className="py-3 px-4">รายวิชา</th>
                    <th className="py-3 px-4">ชั้นเรียน</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayScheduleRows.map((row) => (
                    <tr key={row.period} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{row.period}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          <span>{row.time}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.subject}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{row.courseCode}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {row.classroom}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5">{row.room}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.status === 'CHECKED' ? (
                          <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span>{row.attendanceSummary}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>{row.attendanceSummary}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={onNavigateToAttendance}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            row.status === 'CHECKED'
                              ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                          }`}
                        >
                          {row.status === 'CHECKED' ? 'แก้ไข' : 'เช็คชื่อ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: ตารางงานวัดผลและ ปพ.5 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                งานวัดผลและสมุดพก (ปพ.5)
              </h2>
              <button
                onClick={onNavigateToReadiness}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                    <th className="py-3 px-4">รายการ</th>
                    <th className="py-3 px-4 text-right">ห้องที่ค้าง</th>
                    <th className="py-3 px-4 text-right">จำนวน</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroomTaskRows.map((item) => (
                    <tr
                      key={item.id}
                      onClick={item.onClick}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900 whitespace-nowrap">
                        {item.affectedClasses > 0 ? `${item.affectedClasses} ห้อง` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-slate-600 whitespace-nowrap">
                        {item.totalVolume}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.priority === 'DONE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
                            <Check className="w-3 h-3" /> เรียบร้อย
                          </span>
                        ) : item.priority === 'HIGH' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>รอดำเนินการ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>ตามกำหนดการ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline">
                          <span>{item.actionLabel}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1/3 Column (4 cols): Focused Personal Checklist */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  บันทึกช่วยจำของครู ({todos.filter((t) => !t.done).length})
                </h2>
              </div>

              <button
                onClick={() => setIsAddingTodo(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>

            {isAddingTodo && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="ระบุสิ่งที่ต้องทำ..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddingTodo(false);
                      setNewTodoText('');
                    }}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      if (newTodoText.trim()) {
                        setTodos([
                          ...todos,
                          { id: `todo-${Date.now()}`, text: newTodoText.trim(), done: false },
                        ]);
                        setNewTodoText('');
                        setIsAddingTodo(false);
                      }
                    }}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start justify-between gap-2 py-2.5 text-xs group"
                >
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() =>
                        setTodos(
                          todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))
                        )
                      }
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-0"
                    />
                    <span
                      className={`${
                        todo.done
                          ? 'line-through text-slate-400'
                          : 'text-slate-700 font-medium leading-relaxed'
                      }`}
                    >
                      {todo.text}
                    </span>
                  </label>
                  <button
                    onClick={() => setTodos(todos.filter((t) => t.id !== todo.id))}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1"
                    aria-label="ลบรายการ"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
