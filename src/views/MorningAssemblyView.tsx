// src/views/MorningAssemblyView.tsx
// หน้าเช็คแถวเช้า (Morning Assembly & Homeroom)
// ปรับปรุงตามภาพ Mockup (media_1791314921886.png) และระบบ Pastel Anime Education Dashboard
// คุณสมบัติเด่น:
// 1. ล็อกเฉพาะห้องที่ปรึกษา (ม.3/1 ห้องประจำชั้น) สำหรับครูที่ปรึกษา
// 2. เน้นเช็คชื่อของวันนี้ (Today) เป็นค่าเริ่มต้น พร้อมปุ่มกลับสู่วันนี้
// 3. ปฏิทินย่อขยายได้ (Expandable Mini-Calendar) เช็คประวัติย้อนหลัง: วันที่เช็คแล้ว = สีเขียว (🟢), วันที่ยังไม่เช็ค = สีแดง (🔴)
// 4. หน้าต่างดูสถิติรวมทั้งห้อง (Classroom Term Stats Modal) คำนวณวันมาทัน สาย ขาด ลา ร้อยละ และสถานะ
// 5. โหมดมือถือออกแบบใหม่ (Fast-Check Mobile Cards) แตะเช็คง่ายด้วยมือเดียว ปรับตามความกว้างจอโดยไม่มีการเลื่อนข้าง

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Award,
  Sparkles,
  ShieldCheck,
  Calendar,
  Users,
  Search,
  Check,
  RefreshCw,
  Info,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Table as TableIcon,
  ChevronDown,
  CalendarDays,
  Printer,
  ClipboardCheck,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type MorningAssemblyRecord,
  type AttendanceStatusCode,
  type MorningAssemblyStats,
  type ClassroomTermStatsSummary,
  type AssemblyCalendarDayInfo,
} from '../services/attendanceCorrelationService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';

export interface MorningAssemblyViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

const DEFAULT_TODAY = '2026-10-02';
const ADVISORY_ROOM = 'room-3-1';
const ADVISORY_LABEL = 'ม.3/1 (ห้องประจำชั้น)';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const MorningAssemblyView: React.FC<MorningAssemblyViewProps> = ({ onDeepNavigate }) => {
  // ----------------------------------------------------
  // Core States
  // ----------------------------------------------------
  const [selectedClassroom] = useState<string>(ADVISORY_ROOM);
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_TODAY);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [records, setRecords] = useState<MorningAssemblyRecord[]>([]);
  const [stats, setStats] = useState<MorningAssemblyStats | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile View Switcher (CARDS: Ergonomic Thumb tap vs TABLE: Full Grid)
  const [mobileMode, setMobileMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Mini-Calendar Popover State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(10); // 10 = ตุลาคม

  // Classroom Cumulative Stats Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [classroomStats, setClassroomStats] = useState<ClassroomTermStatsSummary | null>(null);
  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');

  // ----------------------------------------------------
  // Data Loading & Correlation
  // ----------------------------------------------------
  const loadData = () => {
    // Run Lock 3 Correlation cycle to auto-promote period-1 attendance to morning late
    attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    const list = attendanceCorrelationService.getMorningRecords(selectedClassroom, selectedDate);
    const summary = attendanceCorrelationService.getMorningAssemblyStats(selectedClassroom, selectedDate);
    setRecords(list);
    setStats(summary);
  };

  useEffect(() => {
    loadData();
  }, [selectedClassroom, selectedDate]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------
  const handleStatusChange = (
    studentCode: string,
    studentName: string,
    newStatus: AttendanceStatusCode
  ) => {
    const existing = records.find((r) => r.studentCode === studentCode);

    if (existing && existing.source === 'SYSTEM_CORRELATION') {
      attendanceCorrelationService.overrideMorningRecord({
        id: existing.id,
        newStatus,
        overrideBy: 'ครูปัญจพล เกษรัตน์',
        overrideReason: `ครูปรับสถานะเป็น ${newStatus} ด้วยตนเอง`,
      });
    } else {
      attendanceCorrelationService.markMorningRecord({
        classroomId: selectedClassroom,
        studentCode,
        studentName,
        date: selectedDate,
        status: newStatus,
        source: 'MANUAL',
      });
    }

    loadData();
    showToast(`อัปเดตสถานะของ ${studentName} เป็น "${getStatusLabel(newStatus)}" สำเร็จ`);
  };

  const handleBatchMarkAllPresent = () => {
    attendanceCorrelationService.batchMarkMorningAssembly(
      selectedClassroom,
      selectedDate,
      'PRESENT',
      'ครูปัญจพล เกษรัตน์'
    );
    loadData();
    showToast('✓ เช็คแถวครบทุกคนเป็น "มา" เรียบร้อยแล้ว');
  };

  const handleRunCorrelation = () => {
    const result = attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    loadData();
    if (result.changes.length > 0) {
      showToast(
        `ประมวลผลเสร็จสิ้น: ปรับเป็นสาย ${result.totalLatePromotions} รายการ, โดดเรียน ${result.totalTruanciesDetected} รายการ`
      );
    } else {
      showToast('ข้อมูลสอดคล้องสมบูรณ์ ไม่มีการเปลี่ยนแปลง');
    }
  };

  const handleOpenStatsModal = () => {
    const cumulative = attendanceCorrelationService.getClassroomCumulativeStats(selectedClassroom);
    setClassroomStats(cumulative);
    setIsStatsModalOpen(true);
  };

  const getStatusLabel = (status: AttendanceStatusCode) => {
    switch (status) {
      case 'PRESENT':
        return 'มา';
      case 'LATE':
        return 'สาย';
      case 'ABSENT':
        return 'ขาด';
      case 'LEAVE':
        return 'ลา';
      case 'ACTIVITY':
        return 'กิจกรรม';
      case 'TRUANCY':
        return 'โดดเรียน';
      default:
        return status;
    }
  };

  // ----------------------------------------------------
  // Filtered Records
  // ----------------------------------------------------
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery);
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Mini-Calendar Month Days Computation
  const calendarDays: AssemblyCalendarDayInfo[] = useMemo(() => {
    return attendanceCorrelationService.getAssemblyCalendarMonthStatus(
      selectedClassroom,
      calendarYear,
      calendarMonth,
      DEFAULT_TODAY
    );
  }, [selectedClassroom, calendarYear, calendarMonth, records]);

  // Format date display for top toolbar (e.g. 10/02/2026 matching mockup)
  const formattedDatePill = useMemo(() => {
    const [y, m, d] = selectedDate.split('-');
    return `${m}/${d}/${y}`;
  }, [selectedDate]);

  const isSelectedDateToday = selectedDate === DEFAULT_TODAY;

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-24 sm:pb-20 select-none font-sans text-slate-800">
      {/* ========================================================
          TOAST NOTIFICATION
          ======================================================== */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. HEADER PANEL matching Mockup
          ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>เช็คแถวเช้า (Morning Assembly)</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shadow-2xs">
                โฮมรูม
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              บันทึกการเข้าแถวเคารพธงชาติและกิจกรรมยามเช้า เชื่อมโยงความสอดคล้องกับคาบเรียนอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleBatchMarkAllPresent}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            title="เช็คทุกคนในห้อง ม.3/1 เป็น มา"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>✓ มาแถวครบทุกคน</span>
          </button>

          <button
            type="button"
            onClick={handleRunCorrelation}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 active:scale-95 text-blue-600 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            title="รันระบบตรวจสอบความสอดคล้องระหว่างแถวเช้าและคาบเรียน"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ตรวจความสอดคล้อง</span>
          </button>

          {onDeepNavigate && (
            <button
              type="button"
              onClick={() => onDeepNavigate({ view: 'classroom-attendance' })}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              title="สลับไปยังหน้าเช็คชื่อเข้าเรียนรายคาบ"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>ไปเช็คชื่อเข้าเรียน →</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FILTERS & SELECTION CONTROLS BAR matching Mockup
          ======================================================== */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Advisory Classroom Lock & Date Selector with Mini-Calendar Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Homeroom Advisory Classroom Lock Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold shadow-2xs"
            title="การเช็คแถวตอนเช้ากำหนดให้เช็คได้เฉพาะห้องที่ปรึกษาเท่านั้น"
          >
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{ADVISORY_LABEL}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Date Selector Button (opens Expandable Mini-Calendar) */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                isCalendarOpen
                  ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300'
              }`}
              title="คลิกเพื่อเปิดปฏิทินย่อ เช็คแถวย้อนหลัง"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{formattedDatePill}</span>
              <CalendarDays className="w-3.5 h-3.5 text-blue-600 ml-1" />
            </button>

            {/* Quick return to Today chip if viewing retroactive date */}
            {!isSelectedDateToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(DEFAULT_TODAY)}
                className="ml-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                title="กลับมาเช็คชื่อของวันนี้ทันที"
              >
                <span>📅 วันนี้</span>
              </button>
            )}

            {/* ----------------------------------------------------
                EXPANDABLE MINI-CALENDAR POPOVER
                ---------------------------------------------------- */}
            {isCalendarOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                {/* Calendar Header with Month Navigation */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 1) {
                          setCalendarMonth(12);
                          setCalendarYear((y) => y - 1);
                        } else {
                          setCalendarMonth((m) => m - 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                      title="เดือนก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-extrabold text-slate-900">
                      {THAI_MONTH_NAMES[calendarMonth - 1]} {calendarYear + 543}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 12) {
                          setCalendarMonth(1);
                          setCalendarYear((y) => y + 1);
                        } else {
                          setCalendarMonth((m) => m + 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                      title="เดือนถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(DEFAULT_TODAY);
                      setCalendarMonth(10);
                      setCalendarYear(2026);
                      setIsCalendarOpen(false);
                      showToast('เลือกวันที่ 2 ต.ค. 2569 (วันนี้)');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    วันนี้
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                  <span>อา</span>
                  <span>จ</span>
                  <span>อ</span>
                  <span>พ</span>
                  <span>พฤ</span>
                  <span>ศ</span>
                  <span>ส</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding cells for first day offset */}
                  {Array.from({
                    length: new Date(calendarYear, calendarMonth - 1, 1).getDay(),
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}

                  {/* Month Day Cells */}
                  {calendarDays.map((d) => {
                    const isSelected = d.date === selectedDate;

                    // Color assignment based on user specifications:
                    // - Days checked: Green (🟢)
                    // - Weekdays not checked up to today: Red (🔴)
                    // - Weekend / Future: Gray / Neutral
                    let cellBg = 'text-slate-700 hover:bg-slate-100';
                    let dotColor = null;

                    if (d.isWeekday && d.isPastOrToday) {
                      if (d.isChecked) {
                        cellBg = 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100';
                        dotColor = 'bg-emerald-500';
                      } else {
                        cellBg = 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-bold';
                        dotColor = 'bg-rose-500';
                      }
                    } else if (!d.isWeekday) {
                      cellBg = 'text-slate-300 select-none';
                    }

                    if (isSelected) {
                      cellBg += ' ring-2 ring-blue-600 font-black';
                    }

                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          if (d.isWeekday && d.isPastOrToday) {
                            setSelectedDate(d.date);
                            setIsCalendarOpen(false);
                            showToast(
                              `เลือกวันที่ ${d.dayOfMonth} ${THAI_MONTH_NAMES[calendarMonth - 1]} ${calendarYear + 543}`
                            );
                          }
                        }}
                        disabled={!d.isWeekday || !d.isPastOrToday}
                        className={`h-8 rounded-lg text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer disabled:cursor-not-allowed ${cellBg}`}
                        title={`${d.date}: ${
                          d.isChecked
                            ? 'เช็คแล้ว'
                            : d.isWeekday && d.isPastOrToday
                            ? 'ยังไม่เช็ค (คลิกเพื่อเช็คย้อนหลัง)'
                            : 'วันหยุด/อนาคต'
                        }`}
                      >
                        <span className="leading-none">{d.dayOfMonth}</span>
                        {dotColor && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${dotColor} absolute bottom-1`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>เช็คแล้ว</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>ยังไม่เช็ค</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full border border-blue-600 bg-blue-50" />
                    <span>เลือกอยู่</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Search Input & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
            />
          </div>

          {/* Status Filter matching Mockup: 'ทั้งหมด' is blue rounded-full pill */}
          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((st) => {
              const isActive = statusFilter === st;
              const label = st === 'ALL' ? 'ทั้งหมด' : getStatusLabel(st as AttendanceStatusCode);

              if (isActive) {
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className="px-3.5 py-1 rounded-full font-bold text-xs bg-blue-600 text-white shadow-2xs transition-all cursor-pointer"
                  >
                    {label}
                  </button>
                );
              }

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. 5-METRIC SUMMARY CARDS matching Mockup
          ======================================================== */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: นักเรียนทั้งหมด */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">นักเรียนทั้งหมด</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {stats.totalStudents} คน
              </h3>
            </div>
          </div>

          {/* Card 2: มาแถว (87.5%) */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                มาแถว ({stats.attendanceRate}%)
              </p>
              <h3 className="text-xl font-extrabold text-emerald-800 mt-0.5">
                {stats.presentCount} คน
              </h3>
            </div>
          </div>

          {/* Card 3: สาย */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">สาย</p>
              <h3 className="text-xl font-extrabold text-amber-800 mt-0.5">
                {stats.lateCount} คน
              </h3>
            </div>
          </div>

          {/* Card 4: ขาด */}
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">ขาด</p>
              <h3 className="text-xl font-extrabold text-rose-800 mt-0.5">
                {stats.absentCount} คน
              </h3>
            </div>
          </div>

          {/* Card 5: ลา / กิจกรรม */}
          <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">ลา / กิจกรรม</p>
              <h3 className="text-xl font-extrabold text-indigo-800 mt-0.5">
                {stats.leaveCount + stats.activityCount} คน
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. LOCK 3 - SMART CORRELATION BANNER matching Mockup
          ======================================================== */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-blue-900">
            ระบบตรวจสอบความสอดคล้องอัตโนมัติ (Lock 3 - Decoupled Morning Late Rule)
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            หากนักเรียนถูกเช็ค &quot;ขาด&quot; ในแถวเช้า แต่นักเรียนเข้าเรียนในคาบที่ 1 ระบบจะปรับสถานะแถวเช้าเป็น &quot;สาย&quot; ให้อัตโนมัติ พร้อมบันทึกที่มาเป็นระบบอนุมาน โดยไม่ทับเวลาเข้าเรียนจริง
          </p>
        </div>
      </div>

      {/* ========================================================
          5. ROSTER ATTENDANCE CONTAINER (Desktop Table + Mobile Cards)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Table/List Toolbar Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              รายชื่อนักเรียนและสถานะเข้าแถว
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({filteredRecords.length} คน)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher on Mobile/Tablet */}
            <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMobileMode('CARDS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mobileMode === 'CARDS'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="โหมดการ์ดสำหรับมือถือ แตะเช็คง่าย"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>แตะเร็ว</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('TABLE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mobileMode === 'TABLE'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="โหมดตารางเต็ม"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>ตาราง</span>
              </button>
            </div>

            {/* Button: ดูสถิติรวมทั้งห้อง (Cumulative Attendance Term Summary) */}
            <button
              type="button"
              onClick={handleOpenStatsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="ดูสถิติเวลาเข้าแถวรวมทั้งเทอมของนักเรียนทุกคนในห้อง"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>ดูสถิติรวมทั้งห้อง</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------
            5.1 DESKTOP TABLE VIEW (matching media_1791314921886.png)
            Hidden on mobile when in 'CARDS' mode
            ------------------------------------------------------ */}
        <div className={`overflow-x-auto ${mobileMode === 'CARDS' ? 'hidden md:block' : 'block'}`}>
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 text-center">สถานะเช็คแถว</th>
                <th className="py-3.5 px-4">ที่มาของข้อมูล</th>
                <th className="py-3.5 px-4 text-right">ปรับเปลี่ยนสถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, index) => {
                const isSystemInferred = record.source === 'SYSTEM_CORRELATION';
                const isOverridden = record.isOverridden;

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. # */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                      {index + 1}
                    </td>

                    {/* 2. Student Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {record.studentCode}
                    </td>

                    {/* 3. Student Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{record.studentName}</span>
                        {isOverridden && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] border border-amber-200"
                            title={`ครูบันทึกทับ: ${record.overrideReason || ''}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            <span>ครูบันทึกทับ</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Status Badge matching Mockup */}
                    <td className="py-3.5 px-4 text-center">
                      {record.status === 'PRESENT' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>มา</span>
                        </span>
                      )}
                      {record.status === 'LATE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>สาย</span>
                        </span>
                      )}
                      {record.status === 'ABSENT' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ขาด</span>
                        </span>
                      )}
                      {record.status === 'LEAVE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs">
                          <FileText className="w-3.5 h-3.5" />
                          <span>ลา</span>
                        </span>
                      )}
                      {record.status === 'ACTIVITY' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs">
                          <Award className="w-3.5 h-3.5" />
                          <span>กิจกรรม</span>
                        </span>
                      )}
                    </td>

                    {/* 5. Data Source matching Mockup */}
                    <td className="py-3.5 px-4">
                      {isSystemInferred ? (
                        <div className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span
                            className="truncate max-w-[260px] sm:max-w-xs"
                            title={record.correlationNote}
                          >
                            {record.correlationNote ||
                              'ปรับเป็นสายอัตโนมัติ: พบนับนักเรียนเข้าเรียนในคาบที่ 1 (มิได้ขาดจริง)'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          บันทึกโดยคุณครู
                        </span>
                      )}
                    </td>

                    {/* 6. Quick Action Buttons matching Mockup */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 bg-slate-50/70 p-1 rounded-xl border border-slate-200">
                        {/* มา */}
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(record.studentCode, record.studentName, 'PRESENT')
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            record.status === 'PRESENT'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          มา
                        </button>

                        {/* สาย */}
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(record.studentCode, record.studentName, 'LATE')
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            record.status === 'LATE'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          สาย
                        </button>

                        {/* ขาด */}
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(record.studentCode, record.studentName, 'ABSENT')
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            record.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          ขาด
                        </button>

                        {/* ลา */}
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(record.studentCode, record.studentName, 'LEAVE')
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            record.status === 'LEAVE'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          ลา
                        </button>

                        {/* กิจกรรม */}
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(record.studentCode, record.studentName, 'ACTIVITY')
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            record.status === 'ACTIVITY'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          กิจกรรม
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------
            5.2 MOBILE ERGONOMIC CARD VIEW (Super-Easy One-Thumb Tap)
            Rendered on mobile screens when in 'CARDS' mode
            ------------------------------------------------------ */}
        <div className={`p-3 space-y-3 md:hidden ${mobileMode === 'CARDS' ? 'block' : 'hidden'}`}>
          {filteredRecords.map((record, index) => {
            const isSystemInferred = record.source === 'SYSTEM_CORRELATION';

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3"
              >
                {/* Student Info Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 leading-tight">
                        {record.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        รหัส {record.studentCode}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <div>
                    {record.status === 'PRESENT' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>มา</span>
                      </span>
                    )}
                    {record.status === 'LATE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>สาย</span>
                      </span>
                    )}
                    {record.status === 'ABSENT' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ขาด</span>
                      </span>
                    )}
                    {record.status === 'LEAVE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <FileText className="w-3.5 h-3.5" />
                        <span>ลา</span>
                      </span>
                    )}
                    {record.status === 'ACTIVITY' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Award className="w-3.5 h-3.5" />
                        <span>กิจกรรม</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* System Inferred Hint for Lock 3 on Mobile */}
                {isSystemInferred && (
                  <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200 text-[11px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{record.correlationNote || 'ปรับเป็นสายอัตโนมัติ'}</span>
                  </div>
                )}

                {/* Big Thumb Touch Buttons Grid (Min-Height 44px for Ergonomics) */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {/* มา */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(record.studentCode, record.studentName, 'PRESENT')
                    }
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      record.status === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 active:scale-95'
                    }`}
                  >
                    <span>มา</span>
                  </button>

                  {/* สาย */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(record.studentCode, record.studentName, 'LATE')
                    }
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      record.status === 'LATE'
                        ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-amber-50 active:scale-95'
                    }`}
                  >
                    <span>สาย</span>
                  </button>

                  {/* ขาด */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(record.studentCode, record.studentName, 'ABSENT')
                    }
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      record.status === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-rose-50 active:scale-95'
                    }`}
                  >
                    <span>ขาด</span>
                  </button>

                  {/* ลา */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(record.studentCode, record.studentName, 'LEAVE')
                    }
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      record.status === 'LEAVE'
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 active:scale-95'
                    }`}
                  >
                    <span>ลา</span>
                  </button>

                  {/* กิจกรรม */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(record.studentCode, record.studentName, 'ACTIVITY')
                    }
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      record.status === 'ACTIVITY'
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-purple-50 active:scale-95'
                    }`}
                  >
                    <span>กิจกรรม</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl">
              ไม่พบข้อมูลนักเรียน
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          STICKY MOBILE QUICK ACTION BAR (Floating at bottom on mobile)
          ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl flex items-center justify-between gap-3 md:hidden">
        <div className="text-[11px] font-bold text-slate-700">
          {stats ? (
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-700">มา {stats.presentCount}</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">สาย {stats.lateCount}</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-700">ขาด {stats.absentCount}</span>
            </span>
          ) : (
            'แถวเช้า'
          )}
        </div>

        <button
          type="button"
          onClick={handleBatchMarkAllPresent}
          className="flex-1 max-w-[200px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>✓ มาครบทุกคน</span>
        </button>
      </div>

      {/* ========================================================
          6. MODAL: CLASSROOM CUMULATIVE TERM STATS (สถิติรวมทั้งห้อง)
          ======================================================== */}
      {isStatsModalOpen && classroomStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    สถิติการเข้าแถวเคารพธงชาติ (ภาคเรียนที่ 1/2569)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    ห้อง {ADVISORY_LABEL} • รวม {classroomStats.totalAssemblyDays} วันเช็คแถวจริงถึงปัจจุบัน (ไม่นับ 20 สัปดาห์ล่วงหน้า)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] text-blue-700 font-semibold">วันเช็คแถวทั้งหมด</div>
                <div className="text-xl font-extrabold text-blue-900 mt-0.5">
                  {classroomStats.totalAssemblyDays} วัน
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[11px] text-emerald-700 font-semibold">อัตราเข้าแถวเฉลี่ย</div>
                <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
                  {classroomStats.averageRate}%
                </div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="text-[11px] text-indigo-700 font-semibold">นักเรียนทั้งหมด</div>
                <div className="text-xl font-extrabold text-indigo-900 mt-0.5">
                  {classroomStats.totalStudents} คน
                </div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="text-[11px] text-rose-700 font-semibold">กลุ่มเสี่ยง (&lt;80%)</div>
                <div className="text-xl font-extrabold text-rose-900 mt-0.5">
                  {classroomStats.students.filter((s) => s.attendanceRate < 80).length} คน
                </div>
              </div>
            </div>

            {/* Filter Input */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                  value={statsSearchQuery}
                  onChange={(e) => setStatsSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                เกณฑ์ผ่าน: ได้เวลาแถว $\ge$ 80%
              </div>
            </div>

            {/* Comprehensive Students Cumulative Stats Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-24">รหัส</th>
                    <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-2 text-center text-emerald-700">มาทัน</th>
                    <th className="py-2.5 px-2 text-center text-amber-700">สาย</th>
                    <th className="py-2.5 px-2 text-center text-rose-700">ขาด</th>
                    <th className="py-2.5 px-2 text-center text-blue-700">ลา</th>
                    <th className="py-2.5 px-2 text-center text-purple-700">กิจกรรม</th>
                    <th className="py-2.5 px-3 text-center">รวมได้เวลา</th>
                    <th className="py-2.5 px-3 text-center">ร้อยละ (%)</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroomStats.students
                    .filter(
                      (s) =>
                        s.studentName.toLowerCase().includes(statsSearchQuery.toLowerCase()) ||
                        s.studentCode.includes(statsSearchQuery)
                    )
                    .map((s, idx) => {
                      const isAtRisk = s.attendanceRate < 80;

                      return (
                        <tr
                          key={s.studentCode}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isAtRisk ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                            {s.studentCode}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {s.studentName}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                            {s.presentDays} วัน
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                            {s.lateDays} วัน
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-rose-700">
                            {s.absentDays} วัน
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                            {s.leaveDays} วัน
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-purple-700">
                            {s.activityDays} วัน
                          </td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">
                            {s.earnedDays} / {s.totalDays}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                s.attendanceRate >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {s.attendanceRate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {s.attendanceRate >= 80 ? (
                              <span className="text-[11px] font-bold text-emerald-700">
                                ✓ ปกติ
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-rose-700">
                                ⚠️ เสี่ยง มส.
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                ข้อมูลสรุปคำนวณจากระบบอัตโนมัติ (Lock 4 - Unified 80% Denominator Rule)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('กำลังเตรียมพิมพ์รายงานสถิติ...');
                    window.print?.();
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>พิมพ์รายงาน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStatsModalOpen(false)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
