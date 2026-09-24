import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  CheckCircle2,
  Calendar,
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
    { id: 'todo-1', text: 'ส่งคะแนนเก็บหน่วยที่ 1-2 เข้าสู่ระบบ SGS', done: true },
    { id: 'todo-2', text: 'ติดตามงาน My Soundtrack ของนักเรียน ม.3/1 ที่ยังค้าง 2 คน', done: false },
    { id: 'todo-3', text: 'ประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ ห้อง ม.1/8', done: false },
    { id: 'todo-4', text: 'ตรวจเช็ครายชื่อนักเรียนกลุ่มเสี่ยง มส. 7 คน', done: false },
  ]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Hero Profile & Term Progress Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[6px] border-l-rose-600 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          {/* Profile Left */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm shrink-0 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="นายภาสภูมิ เรืองปราชญ์"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-normal">สวัสดีตอนเช้า</span>
              <h1 className="text-xl font-bold text-slate-800 leading-snug">
                นายภาสภูมิ เรืองปราชญ์
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                โรงเรียนหางดงรัฐราษฎร์อุปถัมภ์
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="self-start md:self-auto">
            <div className="px-4 py-2.5 bg-[#e8f8f0] border border-[#c3eed7] rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>ไม่มีงานรอตรวจ</span>
            </div>
          </div>
        </div>

        {/* Term Date & Progress Bar */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                วันอังคารที่ 22 กันยายน พ.ศ. 2569
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                ภาคเรียนที่ 1/2569 • สัปดาห์ที่ 19 จาก 20 •{' '}
                <span className="text-slate-600 font-medium">เหลืออีก 10 วัน</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onNavigateToAcademicYear) onNavigateToAcademicYear();
                else alert('ตั้งค่าวันเปิด-ปิดภาคเรียน');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
            >
              ตั้งค่าวันเปิด-ปิด
            </button>
          </div>

          {/* Red Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                style={{ width: '93%' }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>15 พ.ค. 2569</span>
              <span className="text-rose-700 font-bold">93%</span>
              <span>2 ต.ค. 2569</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Grid: Today's Schedule & Pending Tasks (Left) vs Overview Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: วันนี้ — อ. 22 ก.ย. 2569 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  วันนี้ — อ. 22 ก.ย. 2569
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setActivePeriodTab('today')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activePeriodTab === 'today'
                      ? 'bg-[#0f2a59] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => setActivePeriodTab('week')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activePeriodTab === 'week'
                      ? 'bg-[#0f2a59] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  สัปดาห์
                </button>
                <button
                  onClick={() => setActivePeriodTab('month')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activePeriodTab === 'month'
                      ? 'bg-[#0f2a59] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เดือน
                </button>
              </div>
            </div>

            {/* Timetable Period Rows */}
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="border border-slate-200 rounded-xl p-3.5 border-l-4 border-l-amber-400 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-xs text-slate-800">คาบ 7</div>
                    <div className="text-[11px] text-slate-400">13:30–14:20</div>
                  </div>
                  <span className="px-3 py-1 bg-[#fef7e6] text-[#8a6100] border border-[#f5e6be] rounded-md text-xs font-semibold">
                    แนะแนว
                  </span>
                </div>

                <button
                  onClick={onNavigateToAttendance}
                  className="px-4 py-1.5 bg-[#0f2a59] hover:bg-[#0b1f42] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  เช็คชื่อ
                </button>
              </div>

              {/* Row 2 */}
              <div className="border border-slate-200 rounded-xl p-3.5 border-l-4 border-l-amber-400 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-xs text-slate-800">คาบ 8</div>
                    <div className="text-[11px] text-slate-400">14:20–15:10</div>
                  </div>
                  <span className="px-3 py-1 bg-[#fef7e6] text-[#8a6100] border border-[#f5e6be] rounded-md text-xs font-semibold">
                    ชุมนุมดนตรีไทย-พื้นเมือง
                  </span>
                </div>

                <button
                  onClick={onNavigateToAttendance}
                  className="px-4 py-1.5 bg-[#0f2a59] hover:bg-[#0b1f42] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  เช็คชื่อ
                </button>
              </div>
            </div>
          </div>

          {/* Card: งานที่ต้องทำ (นับเป็นจำนวนห้องที่ต้องเข้าไปทำ) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <h3 className="font-bold text-slate-800 text-sm">
                  งานที่ต้องทำ <span className="font-normal text-xs text-slate-500">(นับเป็นจำนวนห้องที่ต้องเข้าไปทำ)</span>
                </h3>
              </div>

              <button
                onClick={onNavigateToReadiness}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <span>ดูรายละเอียดรายห้อง</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid of Actionable Task Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1 */}
              <div
                onClick={onNavigateToAttendance}
                className="border border-slate-200 rounded-xl p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-xl font-extrabold text-[#c25e00]">
                  9 <span className="text-xs font-normal text-slate-500">ห้อง</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  ยังมีคาบไม่เช็คชื่อ
                </div>
                <div className="text-[11px] text-slate-400">รวม 65 คาบ</div>
              </div>

              {/* Card 2 */}
              <div
                onClick={() => onNavigateToClass('cls-1')}
                className="border border-slate-200 rounded-xl p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-xl font-extrabold text-[#c25e00]">
                  8 <span className="text-xs font-normal text-slate-500">ห้อง</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  คะแนนยังกรอกไม่ครบ
                </div>
                <div className="text-[11px] text-slate-400">รวม 375 ช่อง</div>
              </div>

              {/* Card 3 */}
              <div
                onClick={onNavigateToReadiness}
                className="border border-slate-200 rounded-xl p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-xl font-extrabold text-[#c25e00]">
                  9 <span className="text-xs font-normal text-slate-500">ห้อง</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  คุณลักษณะฯ / อ่านคิดฯ
                </div>
                <div className="text-[11px] text-slate-400">รวม 276 คน</div>
              </div>

              {/* Card 4 (Complete) */}
              <div
                onClick={onNavigateToCourses}
                className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col justify-center items-start space-y-1 cursor-pointer hover:bg-slate-50 transition-colors"
                title="คลิกเพื่อดูโครงสร้างหน่วยการเรียนรู้และหลักสูตร"
              >
                <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <div className="text-xs font-semibold text-slate-700">
                  มีงานยังไม่ผูกหน่วย
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="w-full sm:w-1/4">
              <div
                onClick={onNavigateToReadiness}
                className="border border-slate-200 rounded-xl p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-xl font-extrabold text-[#c25e00]">
                  9 <span className="text-xs font-normal text-slate-500">ห้อง</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  ยังไม่พร้อมปิดเทอม
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): ภาพรวมตอนนี้ & สิ่งที่ต้องทำ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: ภาพรวมตอนนี้ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-slate-500 flex items-center justify-center font-bold">
                  📊
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  ภาพรวมตอนนี้
                </h3>
              </div>

              <button
                onClick={onNavigateToReadiness}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <span>ความพร้อม</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x2 Grid + 1 Bottom Row */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Box 1: 525 นักเรียนที่ดูแล */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                  <div className="text-2xl font-extrabold text-slate-800">525</div>
                  <div className="text-xs font-bold text-slate-700">นักเรียนที่ดูแล</div>
                  <div className="text-[11px] text-slate-400">12 ชั้นเรียน</div>
                </div>

                {/* Box 2: 82% ทำได้เฉลี่ย (Mint green) */}
                <div className="border border-[#c6edd9] bg-[#eefaf3] rounded-xl p-3 space-y-1">
                  <div className="text-2xl font-extrabold text-[#11844b]">82%</div>
                  <div className="text-xs font-bold text-[#11844b]">ทำได้เฉลี่ย</div>
                  <div className="text-[11px] text-slate-500">ของคะแนนที่กรอกแล้ว</div>
                </div>

                {/* Box 3: 95% เข้าเรียนเฉลี่ย (Mint green) */}
                <div className="border border-[#c6edd9] bg-[#eefaf3] rounded-xl p-3 space-y-1">
                  <div className="text-2xl font-extrabold text-[#11844b]">95%</div>
                  <div className="text-xs font-bold text-[#11844b]">เข้าเรียนเฉลี่ย</div>
                  <div className="text-[11px] text-slate-500">ทั้งภาคเรียน</div>
                </div>

                {/* Box 4: 7 เกินเกณฑ์ มส (Soft Red/Pink) */}
                <div className="border border-[#fed0d0] bg-[#fef2f2] rounded-xl p-3 space-y-1">
                  <div className="text-2xl font-extrabold text-rose-700">7</div>
                  <div className="text-xs font-bold text-rose-700">เกินเกณฑ์ มส</div>
                  <div className="text-[11px] text-slate-500">ต้องซ่อมเวลาเรียน</div>
                </div>
              </div>

              {/* Bottom Box: 0 ช่องคะแนนว่าง */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                <div className="text-2xl font-extrabold text-slate-800">0</div>
                <div className="text-xs font-bold text-slate-700">ช่องคะแนนว่าง</div>
                <div className="text-[11px] text-slate-400">รวมทุกชั้นเรียน</div>
              </div>
            </div>
          </div>

          {/* Card: สิ่งที่ต้องทำ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  สิ่งที่ต้องทำ ({todos.filter((t) => !t.done).length})
                </h3>
              </div>

              <button
                onClick={() => setIsAddingTodo(true)}
                className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                + เพิ่ม
              </button>
            </div>

            {isAddingTodo && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="กรอกรายการที่ต้องทำ..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                        setTodos([...todos, { id: `todo-${Date.now()}`, text: newTodoText.trim(), done: false }]);
                        setNewTodoText('');
                        setIsAddingTodo(false);
                      }
                    }}
                    className="px-3 py-1 bg-[#0f2a59] text-white rounded-lg text-xs font-semibold"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 rounded-lg text-xs group"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() =>
                        setTodos(
                          todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))
                        )
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span
                      className={`${
                        todo.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                      } truncate`}
                    >
                      {todo.text}
                    </span>
                  </label>
                  <button
                    onClick={() => setTodos(todos.filter((t) => t.id !== todo.id))}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
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
