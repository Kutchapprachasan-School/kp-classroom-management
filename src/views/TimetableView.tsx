import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Check,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { timetableScheduleData } from '../data/mockData';
import type { TimetableSlot } from '../types/viewModels';

export const TimetableView: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>>({
    1: 'PRESENT',
    2: 'PRESENT',
    3: 'ABSENT',
    4: 'PRESENT',
    5: 'LATE',
    6: 'LEAVE',
    7: 'PRESENT',
  });

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

  const handleMarkAllPresent = () => {
    const updated: Record<number, 'PRESENT'> = {};
    for (let i = 1; i <= 7; i++) {
      updated[i] = 'PRESENT';
    }
    setAttendanceRecords(updated);
  };

  const studentsList = [
    { no: 1, name: 'ด.ช. กฤษณะ ศรีสมบูรณ์' },
    { no: 2, name: 'ด.ช. จิรายุ เดชปันคำ' },
    { no: 3, name: 'ด.ช. ภูรินท์ บัณฑิต' },
    { no: 4, name: 'ด.ช. อัศวิน วนเกษตรกุล' },
    { no: 5, name: 'ด.ช. ชัยมงคล วงศ์บุตร' },
    { no: 6, name: 'ด.ช. ทัตธน คำฝั้น' },
    { no: 7, name: 'ด.ญ. อคิราห์ วิรากร' },
  ];

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
                        onClick={() => setSelectedSlot(slot)}
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

      {/* Modal: Roll-Call Interface */}
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
                  วัน{selectedSlot.day} คาบที่ {selectedSlot.period} • {selectedSlot.time}
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
                <span>จำนวนนักเรียน 7 คน</span>
              </span>

              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                ✓ มาครบทุกคน
              </button>
            </div>

            {/* Attendance Roster Radio list */}
            <div className="space-y-2">
              {studentsList.map((stu) => {
                const currentStatus = attendanceRecords[stu.no] || 'PRESENT';

                return (
                  <div
                    key={stu.no}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800 w-48">
                      {stu.no}. {stu.name}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((status) => {
                        const isSelected = currentStatus === status;
                        const labelMap = {
                          PRESENT: 'มา',
                          ABSENT: 'ขาด',
                          LATE: 'สาย',
                          LEAVE: 'ลา',
                        };

                        const colorMap = {
                          PRESENT: isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          ABSENT: isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          LATE: isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          LEAVE: isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        };

                        return (
                          <button
                            key={status}
                            onClick={() =>
                              setAttendanceRecords({ ...attendanceRecords, [stu.no]: status })
                            }
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

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              📌 การบันทึกเช็คชื่อจะตั้งค่า <code>isConducted = true</code> ซึ่งใช้เป็นฐานตัวหาร (Denominator) ที่แท้จริงในการคำนวณสถิติ มส. ตาม Blueprint
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  alert('บันทึกการเช็คชื่อเข้าชั้นเรียนและปรับปรุงฐานเวลาเรียนเรียบร้อย!');
                  setSelectedSlot(null);
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
