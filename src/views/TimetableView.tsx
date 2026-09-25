import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Check,
  CheckCircle2,
  Users,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { timetableScheduleData } from '../data/mockData';
import type { TimetableSlot } from '../types/viewModels';
import { studentAffairsCouncilService } from '../services/studentAffairsCouncilService';

export const TimetableView: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [overrideConfirmConflicts, setOverrideConfirmConflicts] = useState<
    Array<{ no: number; name: string; leaveReason: string; chosenStatus: string }>
  >([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const studentsList = [
    { no: 1, code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์' },
    { no: 2, code: '45102', name: 'ด.ช. ทัตธน คำฝั้น' },
    { no: 3, code: '45105', name: 'ด.ญ. กมลชนก เลิศวิไล' },
    { no: 4, code: '45109', name: 'ด.ช. ณัฐวุฒิ สายทอง' },
    { no: 5, code: '45112', name: 'ด.ญ. พิมพ์ชนก วงศ์สวัสดิ์' },
    { no: 6, code: '45115', name: 'ด.ช. อัศวิน วนเกษตรกุล' },
    { no: 7, code: '45118', name: 'ด.ญ. อคิราห์ วิรากร' },
  ];

  const buildInitialAttendance = (): Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> => {
    const initial: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(
        stu.name,
        stu.code
      );
      initial[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    return initial;
  };

  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>
  >(buildInitialAttendance);

  const days: Array<'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์'> = [
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
  ];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSlot = (day: string, period: number) => {
    return timetableScheduleData.find((s) => s.day === day && s.period === period);
  };

  const handleOpenSlot = (slot: TimetableSlot) => {
    setAttendanceRecords(buildInitialAttendance());
    setOverrideConfirmConflicts([]);
    setSelectedSlot(slot);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = {};
    for (const stu of studentsList) {
      const morning = studentAffairsCouncilService.getMorningStatusForStudent(
        stu.name,
        stu.code
      );
      updated[stu.no] = morning.hasApprovedLeave ? 'LEAVE' : 'PRESENT';
    }
    setAttendanceRecords(updated);
    setOverrideConfirmConflicts([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ตารางสอน / คาบเรียน (Teaching Timetable)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ตารางสอนรายสัปดาห์ คลิกที่คาบเรียนเพื่อทำการเช็คชื่อเข้าชั้นเรียนแบบทันที
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>สอนแล้วสัปดาห์นี้ 3/5 คาบ</span>
          </span>
        </div>
      </div>

      {/* Timetable Weekly Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            ตารางสอนประจำสัปดาห์ ภาคเรียนที่ 1/2569
          </h2>
          <span className="text-xs text-slate-400">
            * คาบเรียนที่เช็คชื่อแล้วจะมีป้ายกำกับสีเขียว
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-3 w-24 text-left border-r border-slate-200">วัน / คาบ</th>
                {periods.map((p) => (
                  <th key={p} className="py-3 px-2 border-r border-slate-200 last:border-r-0 min-w-28">
                    <div>คาบที่ {p}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {p === 1 && '08:30-09:20'}
                      {p === 2 && '09:20-10:10'}
                      {p === 3 && '10:20-11:10'}
                      {p === 4 && '11:10-12:00'}
                      {p === 5 && '12:00-13:00 (พัก)'}
                      {p === 6 && '13:00-13:50'}
                      {p === 7 && '13:50-14:40'}
                      {p === 8 && '14:40-15:30'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {days.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-3 font-bold text-slate-700 text-left bg-slate-50/60 border-r border-slate-200">
                    {day}
                  </td>
                  {periods.map((period) => {
                    const slot = getSlot(day, period);
                    if (!slot) {
                      return (
                        <td
                          key={period}
                          className="p-2 border-r border-slate-200 last:border-r-0 text-slate-300"
                        >
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={period}
                        onClick={() => handleOpenSlot(slot)}
                        className="p-1.5 border-r border-slate-200 last:border-r-0 cursor-pointer group"
                      >
                        <div
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            slot.isConducted
                              ? 'bg-[#e8f8f0] border-emerald-300 text-emerald-900 shadow-xs'
                              : 'bg-blue-50/70 border-blue-200 hover:border-blue-400 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] truncate">{slot.subjectName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{slot.room}</div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px] font-semibold">
                            {slot.isConducted ? (
                              <span className="text-emerald-700 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> สอนแล้ว
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-100/70 px-1 py-0.5 rounded">
                                รอเช็คชื่อ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal: Roll-Call Interface with Morning Flagpole & Approved Leave Sync */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>เช็คชื่อเข้าชั้นเรียน: {selectedSlot.subjectName} ({selectedSlot.room})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  วัน{selectedSlot.day} คาบที่ {selectedSlot.period} • {selectedSlot.time} • ซิงค์ข้อมูลเข้าแถวเสาธง & ใบลาอัตโนมัติ
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>จำนวนนักเรียน {studentsList.length} คน (ดึงสถานะลาจากใบลาที่อนุมัติแล้วอัตโนมัติ)</span>
              </span>

              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                ✓ มาครบทุกคน (คงสถานะผู้ที่ลา)
              </button>
            </div>

            {/* Attendance Roster Radio list with Morning Assembly Badge */}
            <div className="space-y-2">
              {studentsList.map((stu) => {
                const currentStatus = attendanceRecords[stu.no] || 'PRESENT';
                const morning = studentAffairsCouncilService.getMorningStatusForStudent(
                  stu.name,
                  stu.code
                );
                const isOverridingLeave =
                  morning.hasApprovedLeave && currentStatus !== 'LEAVE';

                return (
                  <div
                    key={stu.no}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                      isOverridingLeave
                        ? 'bg-amber-50/70 border-amber-300'
                        : morning.hasApprovedLeave
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>
                          {stu.no}. {stu.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({stu.code})
                        </span>
                      </div>

                      {/* แสดงผลมาเข้าแถวหน้าเสาธง / ใบลาอนุมัติแล้ว เพื่อประกอบการเช็คเวลาเรียนของครู */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            morning.hasApprovedLeave
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : morning.assemblyStatus === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : morning.assemblyStatus === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>เสาธง: {morning.assemblyLabel}</span>
                        </span>

                        {isOverridingLeave && (
                          <span className="text-[11px] font-bold text-amber-800">
                            ⚠️ เปลี่ยนจากสถานะ "ลา"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((status) => {
                        const isSelected = currentStatus === status;
                        const labelMap = {
                          PRESENT: 'มา',
                          ABSENT: 'ขาด',
                          LATE: 'สาย',
                          LEAVE: 'ลา',
                        };

                        const colorMap = {
                          PRESENT: isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          ABSENT: isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          LATE: isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          LEAVE: isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        };

                        return (
                          <button
                            key={status}
                            onClick={() => {
                              setAttendanceRecords({
                                ...attendanceRecords,
                                [stu.no]: status,
                              });
                              setOverrideConfirmConflicts([]);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${colorMap[status]}`}
                          >
                            {labelMap[status]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* แจ้งเตือนเมื่อกดบันทึกแต่มีการเปลี่ยนสถานะของนักเรียนที่ลาแล้ว */}
            {overrideConfirmConflicts.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-300 space-y-2.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    แจ้งเตือนก่อนบันทึก: พบนักเรียนที่แจ้งลา/อนุมัติใบลาแล้วถูกเปลี่ยนสถานะ ({overrideConfirmConflicts.length} คน)
                  </span>
                </div>
                <ul className="space-y-1 text-amber-800 pl-5 list-disc">
                  {overrideConfirmConflicts.map((c) => (
                    <li key={c.no}>
                      <span className="font-bold">{c.name}</span> — แจ้ง{' '}
                      <span className="underline">{c.leaveReason}</span> แต่ถูกเปลี่ยนเป็นสถานะ{' '}
                      <span className="font-bold text-rose-700">"{c.chosenStatus}"</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      const reverted = { ...attendanceRecords };
                      for (const c of overrideConfirmConflicts) {
                        reverted[c.no] = 'LEAVE';
                      }
                      setAttendanceRecords(reverted);
                      setOverrideConfirmConflicts([]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100"
                  >
                    คืนค่าเป็น "ลา" ตามใบลา
                  </button>
                  <button
                    onClick={() => {
                      setOverrideConfirmConflicts([]);
                      setSelectedSlot(null);
                      setToastMsg(
                        'ยืนยันการเปลี่ยนสถานะและบันทึกการเช็คชื่อเข้าชั้นเรียนเรียบร้อยแล้ว'
                      );
                      setTimeout(() => setToastMsg(null), 3500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                  >
                    ยืนยันการบันทึกตามที่เปลี่ยน
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  const statusLabelMap = {
                    PRESENT: 'มาเรียน',
                    ABSENT: 'ขาดเรียน',
                    LATE: 'มาสาย',
                    LEAVE: 'ลา',
                  };
                  const conflicts: Array<{
                    no: number;
                    name: string;
                    leaveReason: string;
                    chosenStatus: string;
                  }> = [];

                  for (const stu of studentsList) {
                    const morning =
                      studentAffairsCouncilService.getMorningStatusForStudent(
                        stu.name,
                        stu.code
                      );
                    const chosen = attendanceRecords[stu.no] || 'PRESENT';
                    if (morning.hasApprovedLeave && chosen !== 'LEAVE') {
                      conflicts.push({
                        no: stu.no,
                        name: stu.name,
                        leaveReason: morning.leaveReason || 'อนุมัติใบลาแล้ว',
                        chosenStatus: statusLabelMap[chosen],
                      });
                    }
                  }

                  if (conflicts.length > 0) {
                    setOverrideConfirmConflicts(conflicts);
                    return;
                  }

                  setSelectedSlot(null);
                  setToastMsg('บันทึกการเช็คชื่อเข้าชั้นเรียนและซิงค์เวลาเรียนเรียบร้อยแล้ว');
                  setTimeout(() => setToastMsg(null), 3500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                บันทึกการเช็คชื่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
