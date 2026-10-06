// src/views/MorningAssemblyView.tsx
// หน้าเช็คแถวเช้า (Morning Assembly & Homeroom)
// ตามแนวทางการออกแบบ Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #163A66, #10B981)
// เชื่อมต่อโดยตรงกับ attendanceCorrelationService และปฏิบัติตาม 4 Integrity Locks

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  attendanceCorrelationService,
  type MorningAssemblyRecord,
  type AttendanceStatusCode,
  type MorningAssemblyStats,
} from '../services/attendanceCorrelationService';
import type { CrossViewNavigationPayload } from '../services/teacherCopilotService';

export interface MorningAssemblyViewProps {
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
}

const CLASSROOM_OPTIONS = [
  { id: 'room-3-1', label: 'ม.3/1 (ห้องประจำชั้น)' },
  { id: 'room-3-2', label: 'ม.3/2' },
  { id: 'room-1-8', label: 'ม.1/8' },
];

export const MorningAssemblyView: React.FC<MorningAssemblyViewProps> = ({ onDeepNavigate: _onDeepNavigate }) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>('room-3-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-02');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [records, setRecords] = useState<MorningAssemblyRecord[]>([]);
  const [stats, setStats] = useState<MorningAssemblyStats | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load records and statistics
  const loadData = () => {
    const list = attendanceCorrelationService.getMorningRecords(selectedClassroom, selectedDate);
    const summary = attendanceCorrelationService.getMorningAssemblyStats(selectedClassroom, selectedDate);
    setRecords(list);
    setStats(summary);
  };

  useEffect(() => {
    loadData();
  }, [selectedClassroom, selectedDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Update single student status
  const handleStatusChange = (
    studentCode: string,
    studentName: string,
    newStatus: AttendanceStatusCode
  ) => {
    const existing = records.find((r) => r.studentCode === studentCode);

    if (existing && existing.source === 'SYSTEM_CORRELATION') {
      // Use Lock 1 override shield
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

  // Batch mark all students as present
  const handleBatchMarkAllPresent = () => {
    attendanceCorrelationService.batchMarkMorningAssembly(
      selectedClassroom,
      selectedDate,
      'PRESENT',
      'ครูปัญจพล เกษรัตน์'
    );
    loadData();
    showToast('เช็คแถวครบทุกคนเป็น "มา" เรียบร้อยแล้ว');
  };

  // Trigger correlation cycle
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

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.studentCode.includes(searchQuery);
      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>เช็คแถวเช้า (Morning Assembly)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  โฮมรูม
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                บันทึกการเข้าแถวเคารพธงชาติและกิจกรรมยามเช้า เชื่อมโยงความสอดคล้องกับคาบเรียนอัตโนมัติ
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
            <span>✓ มาแถวครบทุกคน</span>
          </button>

          <button
            type="button"
            onClick={handleRunCorrelation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
            title="รันระบบตรวจสอบความสอดคล้องระหว่างแถวเช้าและคาบเรียน"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ตรวจความสอดคล้อง</span>
          </button>
        </div>
      </div>

      {/* Filters & Date Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Classroom Selector */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {CLASSROOM_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
            {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((st) => (
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

      {/* 5-Metric Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">นักเรียนทั้งหมด</p>
              <h3 className="text-lg font-extrabold text-slate-900">{stats.totalStudents} คน</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">มาแถว ({stats.attendanceRate}%)</p>
              <h3 className="text-lg font-extrabold text-emerald-700">{stats.presentCount} คน</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">สาย</p>
              <h3 className="text-lg font-extrabold text-amber-700">{stats.lateCount} คน</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">ขาด</p>
              <h3 className="text-lg font-extrabold text-rose-700">{stats.absentCount} คน</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">ลา / กิจกรรม</p>
              <h3 className="text-lg font-extrabold text-indigo-700">
                {stats.leaveCount + stats.activityCount} คน
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Smart Correlation Hint Banner (Lock 3) */}
      <div className="bg-gradient-to-r from-blue-50/80 via-sky-50/60 to-emerald-50/60 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-900">
            ระบบตรวจสอบความสอดคล้องอัตโนมัติ (Lock 3 - Decoupled Morning Late Rule)
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            หากนักเรียนถูกเช็ค "ขาด" ในแถวเช้า แต่นักเรียนเข้าเรียนในคาบที่ 1 ระบบจะปรับสถานะแถวเช้าเป็น "สาย" ให้อัตโนมัติ พร้อมบันทึกที่มาเป็นระบบอนุมาน โดยไม่ทับเวลาเข้าเรียนจริง
          </p>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>รายชื่อนักเรียนและสถานะเข้าแถว</span>
            <span className="text-xs text-slate-400">({filteredRecords.length} คน)</span>
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 text-center">สถานะเช็คแถว</th>
                <th className="py-3 px-4">ที่มาของข้อมูล</th>
                <th className="py-3 px-4 text-right">ปรับเปลี่ยนสถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, index) => {
                const isSystemInferred = record.source === 'SYSTEM_CORRELATION';
                const isOverridden = record.isOverridden;

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
                            title={`ครูบันทึกทับ: ${record.overrideReason || ''}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            <span>ครูบันทึกทับ</span>
                          </span>
                        )}
                      </div>
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
                            : record.status === 'LEAVE'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {record.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                        {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        {record.status === 'LEAVE' && <FileText className="w-3 h-3" />}
                        {record.status === 'ACTIVITY' && <Award className="w-3 h-3" />}
                        <span>{getStatusLabel(record.status)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isSystemInferred ? (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 w-fit text-[11px]">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span className="font-semibold truncate max-w-xs" title={record.correlationNote}>
                            {record.correlationNote || 'ระบบปรับสายอัตโนมัติ'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">บันทึกโดยคุณครู</span>
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
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
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
