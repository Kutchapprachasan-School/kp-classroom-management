import React, { useState, useMemo } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

export type RollCallStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'SICK_LEAVE';

export interface RollCallStudentItem {
  no: number;
  studentId: string;
  fullName: string;
}

export const KUTCHAP_CLASS_ROSTERS: Record<string, RollCallStudentItem[]> = {
  'ม.2/1': [
    { no: 1, studentId: '21001', fullName: 'เด็กชายกันต์ริศย์ ทวีเศรษฐกร' },
    { no: 2, studentId: '21002', fullName: 'เด็กชายกิตติรัตน์ แสนสะกุล' },
    { no: 3, studentId: '21003', fullName: 'เด็กชายชนกานต์ ดอนหนองบัว' },
    { no: 4, studentId: '21004', fullName: 'เด็กชายชนาภัทร ครุฑนิตย์' },
    { no: 5, studentId: '21005', fullName: 'เด็กชายธนภัทร ไชยชนะ' },
    { no: 6, studentId: '21006', fullName: 'เด็กชายธนวัฒน์ ฐานะ' },
    { no: 7, studentId: '21007', fullName: 'เด็กชายธีรธร ไชยวงษา' },
    { no: 8, studentId: '21008', fullName: 'เด็กชายปกรณ์ นาจรูญ' },
    { no: 9, studentId: '21009', fullName: 'เด็กชายปรมินทร์ ลีกุล' },
    { no: 10, studentId: '21010', fullName: 'เด็กชายพิชิต ประทุมลัย' },
    { no: 11, studentId: '21011', fullName: 'เด็กชายพิธิวัฒน์ ประหยัดทรัพย์' },
    { no: 12, studentId: '21012', fullName: 'เด็กชายภัคพงษ์ อดทน' },
    { no: 13, studentId: '21013', fullName: 'เด็กชายภัทรพงษ์ สำแดงชัย' },
    { no: 14, studentId: '21014', fullName: 'เด็กชายอัมรินทร์ ไชยนาน' },
    { no: 15, studentId: '21015', fullName: 'เด็กหญิงกัญญาภัค แก้วสว่าง' },
    { no: 16, studentId: '21016', fullName: 'เด็กหญิงจุฑามาศ มูลทอง' },
    { no: 17, studentId: '21017', fullName: 'เด็กหญิงณัฐกานต์ ชินละวงษ์' },
    { no: 18, studentId: '21018', fullName: 'เด็กหญิงธัญญารัตน์ ศรีสุวรรณ' },
    { no: 19, studentId: '21019', fullName: 'เด็กหญิงนภัสสร พรมมา' },
    { no: 20, studentId: '21020', fullName: 'เด็กหญิงปภาวรินท์ วงศ์ชมภู' },
  ],
  'ม.3/1': [
    { no: 1, studentId: '45101', fullName: 'เด็กชายกฤษณะ ศรีสมบูรณ์' },
    { no: 2, studentId: '45102', fullName: 'เด็กชายจิรายุ เดชปันคำ' },
    { no: 3, studentId: '45103', fullName: 'เด็กชายชญานนท์ วงศ์สุวรรณ' },
    { no: 4, studentId: '45104', fullName: 'เด็กชายณัฐพงศ์ พรมราช' },
    { no: 5, studentId: '45105', fullName: 'เด็กชายธนกร พลเยี่ยม' },
    { no: 6, studentId: '45106', fullName: 'เด็กชายธีรภัทร โคตรสมบัติ' },
    { no: 7, studentId: '45107', fullName: 'เด็กชายนพดล แสนทวีสุข' },
    { no: 8, studentId: '45108', fullName: 'เด็กชายปิยะพงษ์ จันทร์เพ็ญ' },
    { no: 9, studentId: '45109', fullName: 'เด็กชายพงศกร แก้วมณี' },
    { no: 10, studentId: '45110', fullName: 'เด็กชายภัทรพล ศรีบุญเรือง' },
    { no: 11, studentId: '45111', fullName: 'เด็กชายศุภณัฐ อินทร์แปลง' },
    { no: 12, studentId: '45112', fullName: 'เด็กชายสิรวิชญ์ ทองคำ' },
    { no: 13, studentId: '45113', fullName: 'เด็กชายอนุชา บุญมา' },
    { no: 14, studentId: '45114', fullName: 'เด็กชายอิทธิพล คำจันทร์' },
    { no: 15, studentId: '45115', fullName: 'เด็กชายทัตธน คำฝั้น' },
    { no: 16, studentId: '45116', fullName: 'เด็กหญิงกมลชนก สุขสวัสดิ์' },
    { no: 17, studentId: '45117', fullName: 'เด็กหญิงขวัญข้าว พิมพ์เสน' },
    { no: 18, studentId: '45118', fullName: 'เด็กหญิงชลธิชา วงศ์คำ' },
    { no: 19, studentId: '45119', fullName: 'เด็กหญิงณัฐธิดา แสงทอง' },
    { no: 20, studentId: '45120', fullName: 'เด็กหญิงปนัดดา ศรีวิไล' },
  ],
  'ม.1/8': [
    { no: 1, studentId: '18001', fullName: 'เด็กชายกิตติภพ นามวงศ์' },
    { no: 2, studentId: '18002', fullName: 'เด็กชายเจษฎา โพธิ์ศรี' },
    { no: 3, studentId: '18003', fullName: 'เด็กชายชานนท์ ศรีอุดร' },
    { no: 4, studentId: '18004', fullName: 'เด็กชายณัฐวุฒิ คำสิงห์' },
    { no: 5, studentId: '18005', fullName: 'เด็กชายธนดล บุญช่วย' },
    { no: 6, studentId: '18006', fullName: 'เด็กหญิงกัญญารัตน์ ใจดี' },
    { no: 7, studentId: '18007', fullName: 'เด็กหญิงจิราพร วงศ์ษา' },
    { no: 8, studentId: '18008', fullName: 'เด็กหญิงชนากานต์ ทองดี' },
    { no: 9, studentId: '18009', fullName: 'เด็กหญิงณิชาภัทร แสนสุข' },
    { no: 10, studentId: '18010', fullName: 'เด็กหญิงธัญชนก พลศรี' },
  ],
};

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
  const students = useMemo(
    () => KUTCHAP_CLASS_ROSTERS[selectedRoom] || KUTCHAP_CLASS_ROSTERS['ม.2/1'],
    [selectedRoom]
  );

  // สถานะรายคน
  const [statusMap, setStatusMap] = useState<Record<string, RollCallStatus>>(() => {
    const init: Record<string, RollCallStatus> = {};
    Object.values(KUTCHAP_CLASS_ROSTERS)
      .flat()
      .forEach((s) => {
        init[s.studentId] = defaultStatus;
      });
    return init;
  });

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
