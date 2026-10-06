// src/views/ClassroomAttendanceView.tsx
// หน้าเช็คชื่อนักเรียนรายวิชา / รายคาบ (Classroom Period Attendance)
// ตามแนวทางการออกแบบ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// เชื่อมต่อโดยตรงกับ attendanceCorrelationService และปฏิบัติตาม 4 Integrity Locks

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Award,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Calendar,
  BookOpen,
  Users,
  Search,
  Check,
  Gauge,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type PeriodAttendanceRecord,
  type AttendanceStatusCode,
  type MorningAssemblyRecord,
} from '../services/attendanceCorrelationService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';

export interface ClassroomAttendanceViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

const COURSES_OPTIONS = [
  { code: 'ศ23101', name: 'ศิลปะ 3 (ทัศนศิลป์)', room: 'room-3-1' },
  { code: 'ญ31201', name: 'ภาษาญี่ปุ่น 1', room: 'room-3-1' },
  { code: 'ว23101', name: 'วิทยาศาสตร์และเทคโนโลยี 5', room: 'room-3-1' },
  { code: 'ค23101', name: 'คณิตศาสตร์พื้นฐาน 5', room: 'room-3-1' },
];

const PERIOD_OPTIONS = [
  { no: 1, label: 'คาบที่ 1 (08:30 - 09:20 น.)' },
  { no: 2, label: 'คาบที่ 2 (09:20 - 10:10 น.)' },
  { no: 3, label: 'คาบที่ 3 (10:20 - 11:10 น.)' },
  { no: 4, label: 'คาบที่ 4 (11:10 - 12:00 น.)' },
  { no: 5, label: 'คาบที่ 5 (13:00 - 13:50 น.)' },
  { no: 6, label: 'คาบที่ 6 (13:50 - 14:40 น.)' },
  { no: 7, label: 'คาบที่ 7 (14:40 - 15:30 น.)' },
];

export const ClassroomAttendanceView: React.FC<ClassroomAttendanceViewProps> = ({
  onDeepNavigate: _onDeepNavigate,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('ศ23101');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('room-3-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-02');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [periodRecords, setPeriodRecords] = useState<PeriodAttendanceRecord[]>([]);
  const [morningRecords, setMorningRecords] = useState<MorningAssemblyRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load data for selected period and morning assembly
  const loadData = () => {
    const pRecords = attendanceCorrelationService.getPeriodRecords(
      selectedCourse,
      selectedClassroom,
      selectedDate,
      selectedPeriod
    );
    const mRecords = attendanceCorrelationService.getMorningRecords(
      selectedClassroom,
      selectedDate
    );
    setPeriodRecords(pRecords);
    setMorningRecords(mRecords);
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedClassroom, selectedDate, selectedPeriod]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Change single status
  const handleStatusChange = (
    studentCode: string,
    studentName: string,
    newStatus: AttendanceStatusCode
  ) => {
    const existing = periodRecords.find((r) => r.studentCode === studentCode);

    if (existing && (existing.source === 'SYSTEM_CORRELATION' || existing.isOverridden)) {
      // Use Lock 1 Override Shield
      attendanceCorrelationService.overridePeriodRecord({
        id: existing.id,
        newStatus,
        overrideBy: 'ครูปัญจพล เกษรัตน์',
        overrideReason: `ครูปรับสถานะเป็น ${getStatusLabel(newStatus)} ด้วยตนเอง`,
      });
    } else {
      attendanceCorrelationService.markPeriodRecord({
        classroomId: selectedClassroom,
        courseCode: selectedCourse,
        courseName: COURSES_OPTIONS.find((c) => c.code === selectedCourse)?.name || '',
        periodNo: selectedPeriod,
        date: selectedDate,
        studentCode,
        studentName,
        status: newStatus,
        source: 'MANUAL',
      });
    }

    loadData();
    showToast(`อัปเดตสถานะของ ${studentName} เป็น "${getStatusLabel(newStatus)}" เรียบร้อย`);
  };

  // Batch mark all students present
  const handleBatchMarkAllPresent = () => {
    const updated = periodRecords.map((r) => ({
      ...r,
      status: 'PRESENT' as AttendanceStatusCode,
      source: 'MANUAL' as const,
      markedAt: new Date().toISOString(),
    }));
    attendanceCorrelationService.savePeriodRecords(updated);
    loadData();
    showToast('เช็คชื่อทั้งห้องเป็น "มาเรียน" ครบทุกคนเรียบร้อย');
  };

  // Trigger correlation engine
  const handleRunCorrelation = () => {
    const result = attendanceCorrelationService.runCorrelation(selectedClassroom, selectedDate);
    loadData();
    if (result.changes.length > 0) {
      showToast(
        `ประมวลผลระบบ 4 Locks: โดดเรียน ${result.totalTruanciesDetected} คน, ปรับสาย ${result.totalLatePromotions} คน`
      );
    } else {
      showToast('ระบบตรวจสอบแล้ว ข้อมูลสอดคล้องสมบูรณ์');
    }
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

  // Check truancy discrepancy count (morning was present/late, period is absent or truancy)
  const truancyCount = useMemo(() => {
    return periodRecords.filter((r) => r.status === 'TRUANCY').length;
  }, [periodRecords]);

  // Metric counts
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    let activity = 0;
    let truancy = 0;

    for (const r of periodRecords) {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LEAVE') leave++;
      else if (r.status === 'ACTIVITY') activity++;
      else if (r.status === 'TRUANCY') truancy++;
    }

    const total = periodRecords.length;
    const earned = present + late + activity;
    const rate = total > 0 ? Number(((earned / total) * 100).toFixed(1)) : 100;

    return { total, present, late, absent, leave, activity, truancy, rate };
  }, [periodRecords]);

  const filteredRecords = useMemo(() => {
    return periodRecords.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery);
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periodRecords, searchQuery, statusFilter]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-20 select-none font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>เช็คชื่อนักเรียน (Classroom Attendance)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  รายคาบเรียน
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                บันทึกเวลาเรียนรายวิชา คาบเรียน พร้อมระบบ 4 Integrity Locks และคำนวณเกณฑ์ 80% ปลายภาค
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>✓ มาครบทุกคน</span>
          </button>

          <button
            type="button"
            onClick={handleRunCorrelation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
            title="รันระบบตรวจสอบความสอดคล้องระหว่างแถวเช้าและคาบเรียน"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ตรวจจับโดดเรียน / อัปเดต</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {COURSES_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Classroom Selector */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="room-3-1">ม.3/1 (ประจำชั้น)</option>
              <option value="room-3-2">ม.3/2</option>
              <option value="room-1-8">ม.1/8</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.no} value={p.no}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px]">
            {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'TRUANCY'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'ทั้งหมด' : getStatusLabel(st as AttendanceStatusCode)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Truancy Warning Banner (Lock 2) */}
      {truancyCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-800 animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 text-sm">
              ตรวจพบข้อสังเกตนักเรียนโดดเรียน ({truancyCount} คน) - Lock 2 Truancy Protection
            </h4>
            <p className="text-rose-700 leading-relaxed text-[11px]">
              นักเรียนมีสถานะเข้าแถวเช้า (มา หรือ สาย) แต่ไม่เข้าเรียนในคาบนี้ และไม่มีใบลาหรือกิจกรรมโรงเรียนที่ได้รับอนุมัติ ระบบจึงอนุมานสถานะเป็น "โดดเรียน" (TRUANCY) หากมีความจำเป็นอื่น ครูสามารถกดเปลี่ยนสถานะเพื่อบันทึกทับได้
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards & 80% Gauge Rule */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">ในชั้นเรียน</p>
            <h3 className="text-lg font-extrabold text-slate-900">{stats.total} คน</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">มาเรียน ({stats.rate}%)</p>
            <h3 className="text-lg font-extrabold text-emerald-700">{stats.present} คน</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">สาย</p>
            <h3 className="text-lg font-extrabold text-amber-700">{stats.late} คน</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">ขาดเรียน</p>
            <h3 className="text-lg font-extrabold text-rose-700">{stats.absent} คน</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">โดดเรียน</p>
            <h3 className="text-lg font-extrabold text-red-700">{stats.truancy} คน</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">ลา / กิจกรรม</p>
            <h3 className="text-lg font-extrabold text-indigo-700">
              {stats.leave + stats.activity} คน
            </h3>
          </div>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>รายชื่อนักเรียนในคาบเรียน</span>
            <span className="text-xs text-slate-400">({filteredRecords.length} คน)</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            <span>เกณฑ์เวลาเรียน 80% ปลายภาค (Lock 4)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 text-center">แถวเช้า</th>
                <th className="py-3 px-4 text-center">สถานะคาบนี้</th>
                <th className="py-3 px-4 text-center">สะสม 80%</th>
                <th className="py-3 px-4">ที่มาข้อมูล</th>
                <th className="py-3 px-4 text-right">ปรับสถานะคาบเรียน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, index) => {
                const isSystemInferred = record.source === 'SYSTEM_CORRELATION';
                const isOverridden = record.isOverridden;
                const morning = morningRecords.find((m) => m.studentCode === record.studentCode);

                // Compute student's 80% summary
                const allCourseRecords = attendanceCorrelationService
                  .getAllPeriodRecords()
                  .filter(
                    (p) =>
                      p.studentCode === record.studentCode &&
                      p.courseCode === record.courseCode
                  );
                const summary80 = attendanceCorrelationService.compute80RuleFromRecords(
                  record.studentCode,
                  record.courseCode,
                  allCourseRecords.length > 0 ? allCourseRecords : [record],
                  40
                );

                return (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {record.studentCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{record.studentName}</span>
                        {isOverridden && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] border border-amber-200"
                            title={`คุณครูบันทึกทับ: ${record.overrideReason || ''}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            <span>ครูบันทึกทับ</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {morning ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            morning.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : morning.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {morning.status === 'PRESENT'
                            ? 'มาแถว'
                            : morning.status === 'LATE'
                            ? 'สาย'
                            : 'ขาดแถว'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : record.status === 'ABSENT'
                            ? 'bg-rose-100 text-rose-800'
                            : record.status === 'TRUANCY'
                            ? 'bg-red-100 text-red-800'
                            : record.status === 'LEAVE'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {record.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                        {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        {record.status === 'TRUANCY' && <AlertTriangle className="w-3 h-3" />}
                        {record.status === 'LEAVE' && <FileText className="w-3 h-3" />}
                        {record.status === 'ACTIVITY' && <Award className="w-3 h-3" />}
                        <span>{getStatusLabel(record.status)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          summary80.isEligibleForExam
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                        title={`เวลาเรียนสะสม ${summary80.earnedPeriods}/${summary80.totalScheduledPeriods} คาบ (${summary80.attendanceRate}%)`}
                      >
                        {summary80.attendanceRate}% {summary80.isEligibleForExam ? 'มีสิทธิ์สอบ' : 'เสี่ยง มส.'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isSystemInferred ? (
                        <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 w-fit text-[11px]">
                          <Sparkles className="w-3 h-3 shrink-0 text-rose-600" />
                          <span className="font-semibold truncate max-w-xs" title={record.correlationNote}>
                            {record.correlationNote || 'ระบบอนุมานโดดเรียน'}
                          </span>
                        </div>
                      ) : record.source === 'APPROVED_ACTIVITY' ? (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 text-[11px] font-bold">
                          🏅 กิจกรรมโรงเรียน
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">คุณครูบันทึก</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'PRESENT')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            record.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          มา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'LATE')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            record.status === 'LATE'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          สาย
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'ABSENT')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            record.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          ขาด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'TRUANCY')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            record.status === 'TRUANCY'
                              ? 'bg-red-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
                          }`}
                        >
                          โดด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'LEAVE')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            record.status === 'LEAVE'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          ลา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentCode, record.studentName, 'ACTIVITY')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
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
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูลนักเรียนในคาบนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
