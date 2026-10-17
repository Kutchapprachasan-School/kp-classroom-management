import React, { useState, useMemo, useEffect } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { studentService } from '../../services/studentService';

export type RollCallStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'SICK_LEAVE';

export interface RollCallStudentItem {
  no: number;
  studentId: string;
  fullName: string;
}

export const KUTCHAP_CLASS_ROSTERS: Record<string, RollCallStudentItem[]> = {};

interface MobileVerticalAttendanceSheetProps {
  defaultRoom?: string;
  availableRooms?: string[];
  activityLine: string;
  dateLine?: string;
  defaultStatus?: RollCallStatus;
  onSaveSuccess?: (summary: {
    room: string;
    present: number;
    absent: number;
    late: number;
    sick: number;
  }) => void;
}

export const MobileVerticalAttendanceSheet: React.FC<
  MobileVerticalAttendanceSheetProps
> = ({
  defaultRoom = 'ม.2/1',
  availableRooms = ['ม.2/1', 'ม.3/1', 'ม.1/8'],
  activityLine,
  dateLine = 'ประจำวันจันทร์ ที่ 28 กันยายน 2569',
  defaultStatus = 'PRESENT',
  onSaveSuccess,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom);
  const students = useMemo<RollCallStudentItem[]>(() => {
    const list = studentService.getStudents(selectedRoom);
    return list.map((s, idx) => ({
      no: s.no || idx + 1,
      studentId: s.code || s.id,
      fullName: s.name,
    }));
  }, [selectedRoom]);

  // สถานะรายคน
  const [statusMap, setStatusMap] = useState<Record<string, RollCallStatus>>({});

  useEffect(() => {
    if (students.length === 0) return;
    setStatusMap((prev) => {
      const next = { ...prev };
      let changed = false;
      students.forEach((s) => {
        if (!next[s.studentId]) {
          next[s.studentId] = defaultStatus;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [students, defaultStatus]);

  const [savedToast, setSavedToast] = useState<string | null>(null);

  const handleSetStudentStatus = (studentId: string, status: RollCallStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  };

  // กดติ๊กช่องสี่เหลี่ยมด้านบนคอลัมน์ เพื่อเลือกทั้งหมดในคอลัมน์นั้นใน 1 คลิก (เหมือนในรูปตัวอย่างเป๊ะ)
  const handleSelectAllColumn = (status: RollCallStatus) => {
    setStatusMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        next[s.studentId] = status;
      });
      return next;
    });
  };

  // เช็คว่าทุกคนในห้องถูกเลือกเป็นสถานะเดียวกันหรือไม่ (เพื่อแสดงเครื่องหมายถูกบนหัวตาราง)
  const isAllColumnSelected = (status: RollCallStatus): boolean => {
    return (
      students.length > 0 &&
      students.every((s) => (statusMap[s.studentId] || 'PRESENT') === status)
    );
  };

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let sick = 0;
    students.forEach((s) => {
      const st = statusMap[s.studentId] || 'PRESENT';
      if (st === 'PRESENT') present += 1;
      else if (st === 'ABSENT') absent += 1;
      else if (st === 'LATE') late += 1;
      else if (st === 'SICK_LEAVE') sick += 1;
    });
    return { present, absent, late, sick };
  }, [students, statusMap]);

  const handleSave = () => {
    const msg = `บันทึกเช็คชื่อ ชั้น ${selectedRoom} เรียบร้อย (มา ${counts.present} • ขาด ${counts.absent} • สาย ${counts.late} • ลา ${counts.sick})`;
    setSavedToast(msg);
    onSaveSuccess?.({
      room: selectedRoom,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      sick: counts.sick,
    });
    setTimeout(() => setSavedToast(null), 3000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden select-none">
      {/* 1. ป้ายหัวตารางสีฟ้าอ่อน 3 บรรทัด กระชับ ชัดเจน แบบในรูปตัวอย่าง */}
      <div className="bg-[#D9F7FA] border-b border-[#BCE8EE] px-3 py-3 text-center space-y-1">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-slate-900">
            รายชื่อนักเรียน ชั้น
          </span>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-2.5 py-0.5 rounded-lg bg-white border border-teal-400 text-base sm:text-lg font-bold text-teal-900 focus:outline-none cursor-pointer"
          >
            {availableRooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="text-base sm:text-lg font-bold text-slate-900">
            จำนวน {students.length} คน
          </span>
        </div>

        <div className="text-sm sm:text-base font-bold text-slate-800">
          {activityLine}
        </div>

        <div className="text-xs sm:text-sm font-semibold text-slate-700">
          {dateLine}
        </div>
      </div>

      {/* 2. ตารางเช็คชื่อแนวตั้ง (ที่ | ชื่อ-สกุล | มาเรียน | ขาด | มาสาย | ลาป่วย) ไม่ต้องเลื่อนซ้าย-ขวา */}
      <div className="w-full">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#CEDDF7] text-slate-900 border-b border-[#B2C6EA]">
              <th className="w-9 py-2 px-1 text-center text-sm font-bold border-r border-[#B2C6EA]">
                ที่
              </th>
              <th className="py-2 px-2.5 text-center text-sm sm:text-base font-bold border-r border-[#B2C6EA]">
                ชื่อ-สกุล
              </th>

              {/* คอลัมน์: มาเรียน */}
              <th className="w-12 sm:w-14 py-1.5 px-0.5 text-center border-r border-[#B2C6EA] align-top">
                <button
                  type="button"
                  onClick={() => handleSelectAllColumn('PRESENT')}
                  className="mx-auto mb-1 w-6 h-6 rounded-md flex items-center justify-center border transition-colors cursor-pointer bg-white border-slate-300"
                  title="เลือก มาเรียน ทั้งห้อง"
                >
                  {isAllColumnSelected('PRESENT') && (
                    <span className="w-full h-full rounded-md bg-[#1967D2] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
                <div className="text-xs sm:text-sm font-bold leading-tight">
                  มา
                  <br />
                  เรียน
                </div>
              </th>

              {/* คอลัมน์: ขาด */}
              <th className="w-11 sm:w-13 py-1.5 px-0.5 text-center border-r border-[#B2C6EA] align-top">
                <button
                  type="button"
                  onClick={() => handleSelectAllColumn('ABSENT')}
                  className="mx-auto mb-1 w-6 h-6 rounded-md flex items-center justify-center border transition-colors cursor-pointer bg-white border-slate-300"
                  title="เลือก ขาด ทั้งห้อง"
                >
                  {isAllColumnSelected('ABSENT') && (
                    <span className="w-full h-full rounded-md bg-[#1967D2] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
                <div className="text-xs sm:text-sm font-bold leading-tight">
                  ขาด
                </div>
              </th>

              {/* คอลัมน์: มาสาย */}
              <th className="w-11 sm:w-13 py-1.5 px-0.5 text-center border-r border-[#B2C6EA] align-top">
                <button
                  type="button"
                  onClick={() => handleSelectAllColumn('LATE')}
                  className="mx-auto mb-1 w-6 h-6 rounded-md flex items-center justify-center border transition-colors cursor-pointer bg-white border-slate-300"
                  title="เลือก มาสาย ทั้งห้อง"
                >
                  {isAllColumnSelected('LATE') && (
                    <span className="w-full h-full rounded-md bg-[#1967D2] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
                <div className="text-xs sm:text-sm font-bold leading-tight">
                  มา
                  <br />
                  สาย
                </div>
              </th>

              {/* คอลัมน์: ลาป่วย */}
              <th className="w-11 sm:w-13 py-1.5 px-0.5 text-center align-top">
                <button
                  type="button"
                  onClick={() => handleSelectAllColumn('SICK_LEAVE')}
                  className="mx-auto mb-1 w-6 h-6 rounded-md flex items-center justify-center border transition-colors cursor-pointer bg-white border-slate-300"
                  title="เลือก ลาป่วย ทั้งห้อง"
                >
                  {isAllColumnSelected('SICK_LEAVE') && (
                    <span className="w-full h-full rounded-md bg-[#1967D2] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
                <div className="text-xs sm:text-sm font-bold leading-tight">
                  ลา
                  <br />
                  ป่วย
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EBC4CC]">
            {students.map((stu) => {
              const current = statusMap[stu.studentId] || 'PRESENT';
              const rowBg =
                current === 'ABSENT'
                  ? 'bg-[#FADADD]'
                  : current === 'LATE'
                  ? 'bg-[#FEF3C7]/75'
                  : current === 'SICK_LEAVE'
                  ? 'bg-[#E0F2FE]/80'
                  : 'bg-[#F0FDF4]/60';

              return (
                <tr
                  key={stu.studentId}
                  className={`${rowBg} transition-colors`}
                >
                  {/* เลขที่ */}
                  <td className="py-2.5 px-1 text-center text-sm sm:text-base font-semibold text-slate-800">
                    {stu.no}
                  </td>

                  {/* ชื่อ-สกุล ชัดเจน ตัวใหญ่ อ่านง่าย ไม่มีข้อความรก */}
                  <td className="py-2.5 px-2 text-left text-[15px] sm:text-base font-medium text-slate-900 truncate">
                    {stu.fullName}
                  </td>

                  {/* ปุ่มวงกลม: มาเรียน */}
                  <td className="py-2 px-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(stu.studentId, 'PRESENT')}
                      className="w-7 h-7 mx-auto flex items-center justify-center cursor-pointer"
                      aria-label={`${stu.fullName} มาเรียน`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full transition-all ${
                          current === 'PRESENT'
                            ? 'bg-white border-[6px] border-[#1967D2] shadow-2xs'
                            : 'bg-white border border-slate-300/80'
                        }`}
                      />
                    </button>
                  </td>

                  {/* ปุ่มวงกลม: ขาด */}
                  <td className="py-2 px-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(stu.studentId, 'ABSENT')}
                      className="w-7 h-7 mx-auto flex items-center justify-center cursor-pointer"
                      aria-label={`${stu.fullName} ขาด`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full transition-all ${
                          current === 'ABSENT'
                            ? 'bg-white border-[6px] border-[#1967D2] shadow-2xs'
                            : 'bg-white border border-slate-300/80'
                        }`}
                      />
                    </button>
                  </td>

                  {/* ปุ่มวงกลม: มาสาย */}
                  <td className="py-2 px-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(stu.studentId, 'LATE')}
                      className="w-7 h-7 mx-auto flex items-center justify-center cursor-pointer"
                      aria-label={`${stu.fullName} มาสาย`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full transition-all ${
                          current === 'LATE'
                            ? 'bg-white border-[6px] border-[#1967D2] shadow-2xs'
                            : 'bg-white border border-slate-300/80'
                        }`}
                      />
                    </button>
                  </td>

                  {/* ปุ่มวงกลม: ลาป่วย */}
                  <td className="py-2 px-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(stu.studentId, 'SICK_LEAVE')}
                      className="w-7 h-7 mx-auto flex items-center justify-center cursor-pointer"
                      aria-label={`${stu.fullName} ลาป่วย`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full transition-all ${
                          current === 'SICK_LEAVE'
                            ? 'bg-white border-[6px] border-[#1967D2] shadow-2xs'
                            : 'bg-white border border-slate-300/80'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. แถบบันทึกด้านล่าง (ติดขอบจอ/การ์ด กดง่ายด้วยมือเดียว) */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex flex-col gap-2">
        {savedToast && (
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
            <span className="text-emerald-700">มา {counts.present}</span>
            <span>•</span>
            <span className="text-rose-600">ขาด {counts.absent}</span>
            <span>•</span>
            <span className="text-amber-600">สาย {counts.late}</span>
            <span>•</span>
            <span className="text-blue-600">ลา {counts.sick}</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            บันทึกเช็คชื่อ
          </button>
        </div>
      </div>
    </div>
  );
};
