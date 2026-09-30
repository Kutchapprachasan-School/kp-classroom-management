import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { KUTCHAP_CLASS_ROSTERS } from './MobileVerticalAttendanceSheet';

interface StudentScoreEntry {
  workScore: number; // คะแนนเก็บ (เต็ม 60)
  midtermScore: number; // กลางภาค (เต็ม 20)
  finalScore: number; // ปลายภาค (เต็ม 20)
}

interface MobileVerticalScoreSheetProps {
  defaultRoom?: string;
  availableRooms?: string[];
  courseLabel?: string;
}

const calculateThaiGrade = (total: number): string => {
  if (total >= 80) return '4';
  if (total >= 75) return '3.5';
  if (total >= 70) return '3';
  if (total >= 65) return '2.5';
  if (total >= 60) return '2';
  if (total >= 55) return '1.5';
  if (total >= 50) return '1';
  return '0';
};

export const MobileVerticalScoreSheet: React.FC<
  MobileVerticalScoreSheetProps
> = ({
  defaultRoom = 'ม.3/1',
  availableRooms = ['ม.3/1', 'ม.2/1', 'ม.1/8'],
  courseLabel = 'บันทึกคะแนน ปพ.5 วิชา ศ23101 ศิลปะ',
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom);
  const students = useMemo(
    () => KUTCHAP_CLASS_ROSTERS[selectedRoom] || KUTCHAP_CLASS_ROSTERS['ม.3/1'],
    [selectedRoom]
  );

  const [scoresMap, setScoresMap] = useState<Record<string, StudentScoreEntry>>(
    () => {
      const init: Record<string, StudentScoreEntry> = {};
      Object.values(KUTCHAP_CLASS_ROSTERS)
        .flat()
        .forEach((s, idx) => {
          init[s.studentId] = {
            workScore: 48 + (idx % 10),
            midtermScore: 14 + (idx % 5),
            finalScore: 15 + (idx % 5),
          };
        });
      return init;
    }
  );

  const [savedToast, setSavedToast] = useState<string | null>(null);

  const handleScoreChange = (
    studentId: string,
    field: keyof StudentScoreEntry,
    maxVal: number,
    raw: string
  ) => {
    const num = Math.max(0, Math.min(maxVal, Number(raw) || 0));
    setScoresMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: num,
      },
    }));
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden select-none">
      {/* หัวตาราง 3 บรรทัด กระชับ ไม่อธิบายเยิ่นเย้อ */}
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
          {courseLabel}
        </div>

        <div className="text-xs sm:text-sm font-semibold text-slate-700">
          ภาคเรียนที่ 1 ปีการศึกษา 2569
        </div>
      </div>

      {/* ตารางคะแนนแนวตั้ง ชื่อชัดเจน ไม่ต้องเลื่อนซ้าย-ขวา */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-[#CEDDF7] text-slate-900 border-b border-[#B2C6EA] text-xs sm:text-sm font-bold">
            <th className="w-8 py-2 px-1 text-center border-r border-[#B2C6EA]">
              ที่
            </th>
            <th className="py-2 px-2 text-center border-r border-[#B2C6EA]">
              ชื่อ-สกุล
            </th>
            <th className="w-12 py-1.5 px-0.5 text-center border-r border-[#B2C6EA]">
              เก็บ
              <div className="text-[10px] font-normal text-slate-600">(60)</div>
            </th>
            <th className="w-11 py-1.5 px-0.5 text-center border-r border-[#B2C6EA]">
              กลาง
              <div className="text-[10px] font-normal text-slate-600">(20)</div>
            </th>
            <th className="w-11 py-1.5 px-0.5 text-center border-r border-[#B2C6EA]">
              ปลาย
              <div className="text-[10px] font-normal text-slate-600">(20)</div>
            </th>
            <th className="w-11 py-1.5 px-0.5 text-center">
              เกรด
              <div className="text-[10px] font-normal text-slate-600">(100)</div>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {students.map((stu, idx) => {
            const sc = scoresMap[stu.studentId] || {
              workScore: 50,
              midtermScore: 15,
              finalScore: 15,
            };
            const total = sc.workScore + sc.midtermScore + sc.finalScore;
            const grade = calculateThaiGrade(total);

            return (
              <tr
                key={stu.studentId}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
              >
                <td className="py-2 px-1 text-center text-sm font-semibold text-slate-700">
                  {stu.no}
                </td>
                <td className="py-2 px-2 text-left text-[15px] sm:text-base font-medium text-slate-900 truncate">
                  {stu.fullName}
                </td>
                <td className="py-1.5 px-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={sc.workScore}
                    onChange={(e) =>
                      handleScoreChange(
                        stu.studentId,
                        'workScore',
                        60,
                        e.target.value
                      )
                    }
                    className="w-10 py-1 text-center rounded border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={sc.midtermScore}
                    onChange={(e) =>
                      handleScoreChange(
                        stu.studentId,
                        'midtermScore',
                        20,
                        e.target.value
                      )
                    }
                    className="w-9 py-1 text-center rounded border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={sc.finalScore}
                    onChange={(e) =>
                      handleScoreChange(
                        stu.studentId,
                        'finalScore',
                        20,
                        e.target.value
                      )
                    }
                    className="w-9 py-1 text-center rounded border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                      grade === '0'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-teal-100 text-teal-900'
                    }`}
                  >
                    {grade}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ปุ่มบันทึกคะแนนด้านล่าง */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex flex-col gap-2">
        {savedToast && (
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-600">
            ชั้น {selectedRoom} ({students.length} คน)
          </span>
          <button
            type="button"
            onClick={() => {
              setSavedToast(`บันทึกคะแนน ปพ.5 ชั้น ${selectedRoom} เรียบร้อยแล้ว`);
              setTimeout(() => setSavedToast(null), 3000);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            บันทึกคะแนน
          </button>
        </div>
      </div>
    </div>
  );
};
