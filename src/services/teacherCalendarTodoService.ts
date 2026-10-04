import type { CrossViewNavigationPayload } from './teacherCopilotService';

export type DayWorkStatus = 'COMPLETED' | 'MISSED' | 'IN_PROGRESS' | 'EMPTY';

export interface DayTaskDetail {
  id: string;
  time: string;
  title: string;
  classroom: string;
  subjectCode: string;
  status: 'DONE' | 'MISSED' | 'PENDING';
  statusLabel: string;
  note?: string;
  targetPayload: CrossViewNavigationPayload;
}

export interface CalendarDayStatus {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  status: DayWorkStatus;
  tasks: DayTaskDetail[];
}

export interface DailyTodoItem {
  id: string;
  time: string;
  periodLabel: string;
  title: string;
  classroom: string;
  subjectCode: string;
  subjectName: string;
  status: 'COMPLETED' | 'ACTION_REQUIRED' | 'UPCOMING';
  statusBadge: string;
  summaryText?: string;
  actionLabel: string;
  targetPayload: CrossViewNavigationPayload;
}

export interface UpcomingMilestone {
  id: string;
  horizon: 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_TERM';
  category: 'SGS' | 'ACADEMIC' | 'AFFAIRS' | 'EXAM';
  title: string;
  description: string;
  dueDate: string;
  daysRemainingText: string;
  isUrgent: boolean;
  targetPayload: CrossViewNavigationPayload;
}

const STORAGE_KEY_TODO_STATE = 'kp_teacher_todo_state_v1';

interface PersistedTodoState {
  completedIds: string[];
  resolvedMissedDates: string[];
}

function loadState(): PersistedTodoState {
  if (typeof window === 'undefined') return { completedIds: [], resolvedMissedDates: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TODO_STATE);
    if (!raw) return { completedIds: ['todo-morning-assembly'], resolvedMissedDates: [] };
    return JSON.parse(raw);
  } catch {
    return { completedIds: ['todo-morning-assembly'], resolvedMissedDates: [] };
  }
}

function saveState(state: PersistedTodoState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_TODO_STATE, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('kp-todo-updated'));
  } catch {
    // ignore
  }
}

export const teacherCalendarTodoService = {
  getTodayTodos(): DailyTodoItem[] {
    const st = loadState();

    const items: DailyTodoItem[] = [
      {
        id: 'todo-morning-assembly',
        time: '07:45 - 08:30',
        periodLabel: 'แถวเช้า',
        title: 'เช็คชื่อแถวหน้าเสาธง & ใบลาออนไลน์',
        classroom: 'ม.3/1',
        subjectCode: 'ครูที่ปรึกษา',
        subjectName: 'กิจกรรมหน้าเสาธง',
        status: st.completedIds.includes('todo-morning-assembly')
          ? 'COMPLETED'
          : 'ACTION_REQUIRED',
        statusBadge: st.completedIds.includes('todo-morning-assembly')
          ? 'เช็คแล้ว (มา 38 · ลา 2)'
          : 'ยังไม่เช็คชื่อ',
        summaryText: st.completedIds.includes('todo-morning-assembly')
          ? 'ซิงก์สถานะใบลาไปยังคาบเรียน 1-8 เรียบร้อยแล้ว'
          : 'มีนักเรียนยื่นใบลาป่วย 2 คน รอรับรอง',
        actionLabel: st.completedIds.includes('todo-morning-assembly')
          ? 'ดูสรุปแถวเช้า'
          : 'เช็คแถวเช้าทันที',
        targetPayload: {
          view: 'student-affairs',
          affairsSubTab: 'ASSEMBLY',
          highlightBanner: 'เช็คชื่อแถวเช้า ม.3/1',
        },
      },
      {
        id: 'todo-period-2',
        time: '09:20 - 10:10',
        periodLabel: 'คาบ 2',
        title: 'เข้าสอนวิชาทัศนศิลป์ (ศ23101)',
        classroom: 'ม.3/1 (ห้องศิลปะ 1)',
        subjectCode: 'ศ23101',
        subjectName: 'ทัศนศิลป์ 3',
        status: st.completedIds.includes('todo-period-2')
          ? 'COMPLETED'
          : 'ACTION_REQUIRED',
        statusBadge: st.completedIds.includes('todo-period-2')
          ? 'เช็คชื่อแล้ว (มา 38 คน)'
          : 'ถึงเวลาสอนแล้ว',
        summaryText: 'ดึงข้อมูลการมาแถวเช้าอัตโนมัติ ไม่ต้องขานชื่อซ้ำ',
        actionLabel: st.completedIds.includes('todo-period-2')
          ? 'ดูใบเช็คชื่อ'
          : 'เช็คชื่อคาบ 2',
        targetPayload: {
          view: 'class-overview',
          classSubTab: 'attendance',
          highlightBanner: 'เช็คชื่อสอนคาบ 2 ศ23101 ม.3/1',
        },
      },
      {
        id: 'todo-period-4',
        time: '11:10 - 12:00',
        periodLabel: 'คาบ 4',
        title: 'เข้าสอนวิชาทัศนศิลป์ (ศ23101)',
        classroom: 'ม.3/2 (ห้อง 302)',
        subjectCode: 'ศ23101',
        subjectName: 'ทัศนศิลป์ 3',
        status: st.completedIds.includes('todo-period-4')
          ? 'COMPLETED'
          : 'UPCOMING',
        statusBadge: st.completedIds.includes('todo-period-4')
          ? 'เช็คชื่อแล้ว (มา 40 คน)'
          : 'เริ่มสอน 11:10 น.',
        summaryText: 'หัวข้อ: ทฤษฎีสีและวงจรสีสากล',
        actionLabel: 'เช็คชื่อคาบ 4',
        targetPayload: {
          view: 'class-overview',
          classSubTab: 'attendance',
          highlightBanner: 'เช็คชื่อสอนคาบ 4 ศ23101 ม.3/2',
        },
      },
      {
        id: 'todo-homework-grading',
        time: '14:00 - 15:30',
        periodLabel: 'ตรวจงาน',
        title: 'ตรวจชิ้นงานที่ 2: ออกแบบโปสเตอร์ (R2 / Canva)',
        classroom: 'ม.3/1',
        subjectCode: 'ศ23101',
        subjectName: 'ทัศนศิลป์ 3',
        status: st.completedIds.includes('todo-homework-grading')
          ? 'COMPLETED'
          : 'ACTION_REQUIRED',
        statusBadge: st.completedIds.includes('todo-homework-grading')
          ? 'ตรวจครบแล้ว (40/40 คน)'
          : 'ส่งแล้ว 32/40 คน (ค้างตรวจ 12 คน)',
        summaryText: 'นักเรียนส่งไฟล์ภาพเข้า R2 และลิงก์ Canva รอให้คะแนน',
        actionLabel: 'ตรวจงานทันที',
        targetPayload: {
          view: 'assignments',
          assignmentQuickFilter: 'PENDING_REVIEW',
          highlightBanner: 'ตรวจชิ้นงานที่ 2 ม.3/1 เพื่อคำนวณเกรดอัตโนมัติ',
        },
      },
    ];

    return items;
  },

  toggleTodoComplete(id: string): void {
    const st = loadState();
    const isCompleted = st.completedIds.includes(id);
    const updated = isCompleted
      ? st.completedIds.filter((x) => x !== id)
      : [...st.completedIds, id];
    saveState({ ...st, completedIds: updated });
  },

  resolveMissedDate(dateString: string): void {
    const st = loadState();
    if (!st.resolvedMissedDates.includes(dateString)) {
      saveState({
        ...st,
        resolvedMissedDates: [...st.resolvedMissedDates, dateString],
      });
    }
  },

  getMonthDays(year: number, monthIndex: number): CalendarDayStatus[] {
    const st = loadState();
    const today = new Date();
    const isCurrentYearMonth =
      today.getFullYear() === year && today.getMonth() === monthIndex;
    const todayDateNum = today.getDate();

    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun

    const result: CalendarDayStatus[] = [];

    // Preceding padding days
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      result.push({
        dateString: `${year}-${String(monthIndex).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
        dayNumber: dNum,
        dayOfWeek: (startDayOfWeek - 1 - i) % 7,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: (startDayOfWeek - 1 - i) % 7 === 0 || (startDayOfWeek - 1 - i) % 7 === 6,
        isHoliday: false,
        status: 'EMPTY',
        tasks: [],
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentYearMonth && d === todayDateNum;
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Simulate realistic school history
      let status: DayWorkStatus = 'EMPTY';
      let tasks: DayTaskDetail[] = [];
      let isHoliday = false;
      let holidayName: string | undefined;

      // Thai holidays in October (for example: 13 Oct, 23 Oct)
      if (monthIndex === 9) {
        if (d === 13) {
          isHoliday = true;
          holidayName = 'วันคล้ายวันสวรรคต ร.9';
        } else if (d === 23) {
          isHoliday = true;
          holidayName = 'วันปิยมหาราช';
        }
      }

      if (isHoliday || isWeekend) {
        status = 'EMPTY';
      } else if (isToday) {
        status = 'IN_PROGRESS';
        tasks = [
          {
            id: 't-today-1',
            time: '07:45',
            title: 'เช็คชื่อแถวเช้า ม.3/1',
            classroom: 'ม.3/1',
            subjectCode: 'แถวเช้า',
            status: st.completedIds.includes('todo-morning-assembly') ? 'DONE' : 'PENDING',
            statusLabel: st.completedIds.includes('todo-morning-assembly') ? 'ครบถ้วน' : 'รอดำเนินการ',
            targetPayload: { view: 'student-affairs', affairsSubTab: 'ASSEMBLY' },
          },
          {
            id: 't-today-2',
            time: '09:20',
            title: 'เช็คชื่อคาบ 2 (ศ23101)',
            classroom: 'ม.3/1',
            subjectCode: 'ศ23101',
            status: st.completedIds.includes('todo-period-2') ? 'DONE' : 'PENDING',
            statusLabel: st.completedIds.includes('todo-period-2') ? 'ครบถ้วน' : 'รอดำเนินการ',
            targetPayload: { view: 'class-overview', classSubTab: 'attendance' },
          },
        ];
      } else if (isCurrentYearMonth && d < todayDateNum) {
        // Past school days
        const isResolved = st.resolvedMissedDates.includes(dateString);
        // Let's create an intentional missed day on 6th of October to demonstrate accountability
        if (d === 6 && !isResolved) {
          status = 'MISSED';
          tasks = [
            {
              id: 't-past-6-1',
              time: '07:45',
              title: 'เช็คชื่อแถวเช้า ม.3/1',
              classroom: 'ม.3/1',
              subjectCode: 'แถวเช้า',
              status: 'DONE',
              statusLabel: 'บันทึกเรียบร้อย (มา 39 ขาด 1)',
              targetPayload: { view: 'student-affairs', affairsSubTab: 'ASSEMBLY' },
            },
            {
              id: 't-past-6-2',
              time: '10:20',
              title: 'เช็คชื่อคาบ 3 วิชา ศ23101 ม.3/1',
              classroom: 'ม.3/1',
              subjectCode: 'ศ23101',
              status: 'MISSED',
              statusLabel: '⚠️ ยังไม่ได้บันทึกการสอน/เช็คชื่อ',
              note: 'คาบนี้ยังไม่มีข้อมูลบันทึกในสมุด ปพ.5',
              targetPayload: {
                view: 'class-overview',
                classSubTab: 'attendance',
                highlightBanner: 'บันทึกเช็คชื่อย้อนหลัง: 6 ต.ค. คาบ 3 (ศ23101 ม.3/1)',
              },
            },
          ];
        } else {
          status = 'COMPLETED';
          tasks = [
            {
              id: `t-past-${d}-1`,
              time: '07:45',
              title: 'เช็คแถวเช้า ม.3/1',
              classroom: 'ม.3/1',
              subjectCode: 'แถวเช้า',
              status: 'DONE',
              statusLabel: 'บันทึกเรียบร้อย',
              targetPayload: { view: 'student-affairs', affairsSubTab: 'ASSEMBLY' },
            },
            {
              id: `t-past-${d}-2`,
              time: '09:20',
              title: 'เช็คชื่อคาบสอน & ลงคะแนน',
              classroom: 'ม.3/1',
              subjectCode: 'ศ23101',
              status: 'DONE',
              statusLabel: 'บันทึกครบถ้วน',
              targetPayload: { view: 'class-overview', classSubTab: 'attendance' },
            },
          ];
        }
      } else {
        // Future days
        status = 'EMPTY';
      }

      result.push({
        dateString,
        dayNumber: d,
        dayOfWeek,
        isCurrentMonth: true,
        isToday,
        isWeekend,
        isHoliday,
        holidayName,
        status,
        tasks,
      });
    }

    // Trailing padding days to fill 35 or 42 grid cells
    const totalCells = result.length <= 35 ? 35 : 42;
    const remaining = totalCells - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({
        dateString: `${year}-${String(monthIndex + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNumber: i,
        dayOfWeek: (result[result.length - 1].dayOfWeek + 1) % 7,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
        isHoliday: false,
        status: 'EMPTY',
        tasks: [],
      });
    }

    return result;
  },

  getUpcomingMilestones(): UpcomingMilestone[] {
    return [
      // 1. สัปดาห์นี้
      {
        id: 'milestone-week-1',
        horizon: 'THIS_WEEK',
        category: 'AFFAIRS',
        title: 'ส่งสรุปสถิติการมาแถวเช้า & มส. ประจำสัปดาห์',
        description: 'ฝ่ายกิจการนักเรียนรวบรวมข้อมูลยอด นร. เสี่ยงเวลาเรียนไม่ถึง 80%',
        dueDate: 'ศุกร์ที่ 9 ต.ค. 2569 (16:30 น.)',
        daysRemainingText: 'อีก 1 วัน',
        isUrgent: true,
        targetPayload: {
          view: 'student-affairs',
          affairsSubTab: 'DISCIPLINE',
          highlightBanner: 'ตรวจสอบรายชื่อ นร. ขาดแถวเกินเกณฑ์ ม.3/1',
        },
      },
      {
        id: 'milestone-week-2',
        horizon: 'THIS_WEEK',
        category: 'ACADEMIC',
        title: 'บันทึกคะแนนเก็บชิ้นงานที่ 2 ลง ปพ.5',
        description: 'ตรวจผลงานโปสเตอร์ Canva / ภาพวาด R2 ของ ม.3/1 และ ม.3/2 ให้ครบ',
        dueDate: 'เสาร์ที่ 10 ต.ค. 2569',
        daysRemainingText: 'อีก 2 วัน',
        isUrgent: false,
        targetPayload: {
          view: 'assignments',
          assignmentQuickFilter: 'PENDING_REVIEW',
          highlightBanner: 'ตรวจและลงคะแนนชิ้นงานที่ 2',
        },
      },
      // 2. เดือนนี้
      {
        id: 'milestone-month-1',
        horizon: 'THIS_MONTH',
        category: 'EXAM',
        title: 'สอบประเมินกลางภาคเรียนที่ 1/2569',
        description: 'จัดเตรียมชุดข้อสอบและตารางคุมสอบวิชาทัศนศิลป์ ม.3',
        dueDate: '19 - 21 ต.ค. 2569',
        daysRemainingText: 'อีก 11 วัน',
        isUrgent: false,
        targetPayload: {
          view: 'exams',
          highlightBanner: 'จัดการข้อสอบกลางภาค 1/2569',
        },
      },
      {
        id: 'milestone-month-2',
        horizon: 'THIS_MONTH',
        category: 'AFFAIRS',
        title: 'ส่งแบบบันทึกเยี่ยมบ้าน นร.01 (CCT) งวดที่ 1',
        description: 'บันทึกข้อมูลพิกัด GPS ภาพถ่ายบ้าน และแบบประเมิน นร.01 กลุ่มเปราะบาง 5 คน',
        dueDate: '25 ต.ค. 2569',
        daysRemainingText: 'อีก 17 วัน',
        isUrgent: false,
        targetPayload: {
          view: 'home-visit',
          highlightBanner: 'เยี่ยมบ้าน นร.01 กุดจับประชาสรรค์',
        },
      },
      // 3. เทอมนี้
      {
        id: 'milestone-term-1',
        horizon: 'THIS_TERM',
        category: 'SGS',
        title: 'ตรวจความพร้อมและส่งออกคะแนนเข้าสู่ระบบ SGS',
        description: 'ตรวจสอบ 3 ด่าน: ขาด-ลา-มาสาย, คะแนนเก็บครบ 100%, ปลด ร/มส. ทั้งหมด',
        dueDate: '5 พ.ย. 2569 (ปิดภาคเรียน)',
        daysRemainingText: 'อีก 28 วัน',
        isUrgent: false,
        targetPayload: {
          view: 'readiness',
          highlightBanner: 'ความพร้อมส่งเกรด SGS สพม.อุดรธานี',
        },
      },
      {
        id: 'milestone-term-2',
        horizon: 'THIS_TERM',
        category: 'ACADEMIC',
        title: 'จัดทำรายงานผลสัมฤทธิ์ทางการเรียน SAR / วPA',
        description: 'ส่งออกสถิติ GPA รายวิชาและการเปรียบเทียบผลข้ามห้องให้ฝ่ายวิชาการ',
        dueDate: '10 พ.ย. 2569',
        daysRemainingText: 'อีก 33 วัน',
        isUrgent: false,
        targetPayload: {
          view: 'sar',
          highlightBanner: 'รายงานผลสัมฤทธิ์ SAR',
        },
      },
    ];
  },
};
