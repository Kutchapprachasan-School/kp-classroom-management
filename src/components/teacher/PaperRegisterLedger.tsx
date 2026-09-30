import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Check,
  ExternalLink,
  Plus,
  Save,
  CheckCircle2,
  X,
  Eye,
} from 'lucide-react';

export type PaperLedgerMode =
  | 'MORNING_ASSEMBLY'
  | 'CLASS_ATTENDANCE'
  | 'HOMEWORK_CHECK'
  | 'SCORE_GRADEBOOK';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

interface HomeworkSubmissionCell {
  submitted: boolean;
  score: number | '';
  attachmentType?: 'R2_IMAGE' | 'CANVA_LINK' | 'NONE';
  attachmentLabel?: string;
  attachmentUrl?: string;
}

interface StudentPaperRow {
  no: number;
  studentId: string;
  fullName: string;
  morningStatus: AttendanceStatus;
  classPeriods: AttendanceStatus[]; // คาบที่ 1-5
  homeworks: Record<string, HomeworkSubmissionCell>;
  midtermScore: number | '';
  finalScore: number | '';
}

interface AssignmentColumnDef {
  id: string;
  shortTitle: string;
  fullTitle: string;
  maxScore: number;
  dueDate: string;
}

interface PeriodDef {
  index: number;
  label: string;
  date: string;
}

const DEFAULT_PERIODS: PeriodDef[] = [
  { index: 0, label: 'คาบ 1', date: '1 ก.ย.' },
  { index: 1, label: 'คาบ 2', date: '8 ก.ย.' },
  { index: 2, label: 'คาบ 3', date: '15 ก.ย.' },
  { index: 3, label: 'คาบ 4', date: '22 ก.ย.' },
  { index: 4, label: 'คาบ 5 (วันนี้)', date: '28 ก.ย.' },
];

const DEFAULT_ASSIGNMENTS: AssignmentColumnDef[] = [
  {
    id: 'hw-1',
    shortTitle: 'งาน 1',
    fullTitle: 'ใบงานที่ 1: ทัศนธาตุและหลักการวาดเส้น',
    maxScore: 15,
    dueDate: '10 ก.ย.',
  },
  {
    id: 'hw-2',
    shortTitle: 'งาน 2',
    fullTitle: 'ชิ้นงานที่ 2: ออกแบบโปสเตอร์ (Canva / รูป R2)',
    maxScore: 15,
    dueDate: '17 ก.ย.',
  },
  {
    id: 'hw-3',
    shortTitle: 'งาน 3',
    fullTitle: 'ใบงานที่ 3: ทฤษฎีสีและการระบายสีน้ำ',
    maxScore: 15,
    dueDate: '24 ก.ย.',
  },
  {
    id: 'hw-4',
    shortTitle: 'งาน 4',
    fullTitle: 'แฟ้มสะสมงานศิลปะ (Portfolio)',
    maxScore: 15,
    dueDate: '28 ก.ย.',
  },
];

const INITIAL_STUDENT_NAMES = [
  { id: '45101', name: 'เด็กชายกันต์ริศย์ ทวีเศรษฐกร' },
  { id: '45102', name: 'เด็กชายกิตติรัตน์ แสนสะกุล' },
  { id: '45103', name: 'เด็กชายเขมินทรา วงศ์ประทุม' },
  { id: '45104', name: 'เด็กชายเจษฎาภรณ์ แก้วมณี' },
  { id: '45105', name: 'เด็กชายชยพล พงศ์พิพัฒน์' },
  { id: '45106', name: 'เด็กชายณัฐพงศ์ ศรีสุวรรณ' },
  { id: '45107', name: 'เด็กชายธนกฤต วงศ์สว่าง' },
  { id: '45108', name: 'เด็กชายธีรภัทร อินทร์แปลง' },
  { id: '45109', name: 'เด็กชายนภัสกร จันทร์เพ็ญ' },
  { id: '45110', name: 'เด็กชายปุณณวิชญ์ โคตรสมบัติ' },
  { id: '45111', name: 'เด็กหญิงกมลชนก ทองดี' },
  { id: '45112', name: 'เด็กหญิงกัญญาณัฐ พรมราช' },
  { id: '45113', name: 'เด็กหญิงจิดาภา แสงสุวรรณ' },
  { id: '45114', name: 'เด็กหญิงชนากานต์ วงศ์คำ' },
  { id: '45115', name: 'เด็กหญิงชลธิชา นามวงศ์' },
  { id: '45116', name: 'เด็กหญิงณัฐณิชา ศรีบุญเรือง' },
  { id: '45117', name: 'เด็กหญิงธัญญารัตน์ คำภีระ' },
  { id: '45118', name: 'เด็กหญิงนันท์นภัส สุขเกษม' },
  { id: '45119', name: 'เด็กหญิงปภาวรินท์ ไชยราช' },
  { id: '45120', name: 'เด็กหญิงพิมลพรรณ วงศ์สะอาด' },
];

function buildInitialRows(): StudentPaperRow[] {
  return INITIAL_STUDENT_NAMES.map((st, idx) => {
    const isMissingSome = idx === 2 || idx === 6 || idx === 13;
    return {
      no: idx + 1,
      studentId: st.id,
      fullName: st.name,
      morningStatus: idx === 2 ? 'ABSENT' : idx === 6 ? 'LATE' : idx === 13 ? 'LEAVE' : 'PRESENT',
      classPeriods: [
        'PRESENT',
        idx === 6 ? 'LATE' : 'PRESENT',
        idx === 2 ? 'ABSENT' : 'PRESENT',
        idx === 13 ? 'LEAVE' : 'PRESENT',
        idx === 2 ? 'ABSENT' : idx === 6 ? 'LATE' : 'PRESENT',
      ],
      homeworks: {
        'hw-1': {
          submitted: true,
          score: 14 - (idx % 3),
          attachmentType: 'R2_IMAGE',
          attachmentLabel: 'ใบงาน_1.webp',
          attachmentUrl: 'https://r2.kutchap.ac.th/art/hw1-sample.webp',
        },
        'hw-2': {
          submitted: !isMissingSome,
          score: isMissingSome ? '' : 15 - (idx % 2),
          attachmentType: isMissingSome ? 'NONE' : 'CANVA_LINK',
          attachmentLabel: isMissingSome ? '' : 'Canva โปสเตอร์',
          attachmentUrl: 'https://www.canva.com/design/DAFkutchap/view',
        },
        'hw-3': {
          submitted: idx !== 2,
          score: idx === 2 ? '' : 13 + (idx % 3),
          attachmentType: idx === 2 ? 'NONE' : 'R2_IMAGE',
          attachmentLabel: idx === 2 ? '' : 'สีน้ำ_3.webp',
          attachmentUrl: 'https://r2.kutchap.ac.th/art/hw3-sample.webp',
        },
        'hw-4': {
          submitted: !isMissingSome && idx !== 10,
          score: isMissingSome || idx === 10 ? '' : 14,
          attachmentType: isMissingSome || idx === 10 ? 'NONE' : 'CANVA_LINK',
          attachmentLabel: 'Portfolio',
          attachmentUrl: 'https://www.canva.com/design/DAFportfolio/view',
        },
      },
      midtermScore: idx === 2 ? 11 : 15 + (idx % 4),
      finalScore: idx === 2 ? 12 : 16 + (idx % 4),
    };
  });
}

function computeThaiGrade(total: number, hasMissingWork: boolean): string {
  if (hasMissingWork) return 'ร';
  if (total >= 80) return '4';
  if (total >= 75) return '3.5';
  if (total >= 70) return '3';
  if (total >= 65) return '2.5';
  if (total >= 60) return '2';
  if (total >= 55) return '1.5';
  if (total >= 50) return '1';
  return '0';
}

const NEXT_STATUS: Record<AttendanceStatus, AttendanceStatus> = {
  PRESENT: 'ABSENT',
  ABSENT: 'LATE',
  LATE: 'LEAVE',
  LEAVE: 'PRESENT',
};

interface PaperRegisterLedgerProps {
  initialMode?: PaperLedgerMode;
  defaultRoom?: string;
  subjectLabel?: string;
  hideModeSwitcher?: boolean;
  onModeChange?: (mode: PaperLedgerMode) => void;
}

export const PaperRegisterLedger: React.FC<PaperRegisterLedgerProps> = ({
  initialMode = 'HOMEWORK_CHECK',
  defaultRoom = 'ม.2/1',
  subjectLabel = 'ศ23101 ศิลปะ',
  hideModeSwitcher = false,
  onModeChange,
}) => {
  const [mode, setMode] = useState<PaperLedgerMode>(initialMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom);
  const [attendanceViewType, setAttendanceViewType] = useState<'MULTI_PERIOD' | 'TODAY_SINGLE'>('MULTI_PERIOD');
  const [assignments, setAssignments] = useState<AssignmentColumnDef[]>(DEFAULT_ASSIGNMENTS);
  const [rows, setRows] = useState<StudentPaperRow[]>(() => buildInitialRows());
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    studentName: string;
    hwTitle: string;
    type: 'R2_IMAGE' | 'CANVA_LINK';
    label: string;
    url: string;
  } | null>(null);
  const [isNewHwOpen, setIsNewHwOpen] = useState(false);
  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwMax, setNewHwMax] = useState(15);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: PaperLedgerMode) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const switchAttendanceViewType = (viewType: 'MULTI_PERIOD' | 'TODAY_SINGLE') => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setAttendanceViewType(viewType);
  };

  const triggerToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2400);
  };

  // Keyboard navigation for score columns: Enter / ArrowDown moves down, ArrowUp moves up
  const handleScoreKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    colKey: string,
    rowIndex: number,
    totalRows: number
  ) => {
    if (e.nativeEvent?.isComposing || e.key === 'Process') return;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        const nextInput = containerRef.current
          ? containerRef.current.querySelector<HTMLInputElement>(
              `input[data-nav="${mode}-${colKey}-${nextRow}"]`
            )
          : document.querySelector<HTMLInputElement>(
              `input[data-nav="${mode}-${colKey}-${nextRow}"]`
            );
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        const prevInput = containerRef.current
          ? containerRef.current.querySelector<HTMLInputElement>(
              `input[data-nav="${mode}-${colKey}-${prevRow}"]`
            )
          : document.querySelector<HTMLInputElement>(
              `input[data-nav="${mode}-${colKey}-${prevRow}"]`
            );
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  // 1-Tap Select All for Morning Assembly or Today's Single Period
  const handleMarkAllAttendance = (status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => {
        if (mode === 'MORNING_ASSEMBLY') {
          return { ...r, morningStatus: status };
        }
        const updatedPeriods = [...r.classPeriods];
        updatedPeriods[4] = status;
        return { ...r, classPeriods: updatedPeriods };
      })
    );
  };

  // 1-Tap Mark All Present for a specific Period column
  const handleMarkPeriodAllPresent = (periodIndex: number) => {
    setRows((prev) =>
      prev.map((r) => {
        const updatedPeriods = [...r.classPeriods];
        updatedPeriods[periodIndex] = 'PRESENT';
        return { ...r, classPeriods: updatedPeriods };
      })
    );
    triggerToast(`เช็ค "มา" คาบที่ ${periodIndex + 1} ครบทั้งห้องเรียบร้อย`);
  };

  // 1-Click Cycle Attendance Status in Multi-Period Cell
  const handleCyclePeriodStatus = (studentNo: number, periodIndex: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.no !== studentNo) return r;
        const updatedPeriods = [...r.classPeriods];
        const curr = updatedPeriods[periodIndex] || 'PRESENT';
        updatedPeriods[periodIndex] = NEXT_STATUS[curr];
        return { ...r, classPeriods: updatedPeriods };
      })
    );
  };

  // 1-Tap Toggle Homework Submission Checkbox
  const handleToggleHomework = (studentNo: number, hwId: string, maxScore: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.no !== studentNo) return r;
        const curr = r.homeworks[hwId] || { submitted: false, score: '' };
        const nextSubmitted = !curr.submitted;
        return {
          ...r,
          homeworks: {
            ...r.homeworks,
            [hwId]: {
              ...curr,
              submitted: nextSubmitted,
              score: nextSubmitted ? (curr.score === '' ? maxScore : curr.score) : '',
            },
          },
        };
      })
    );
  };

  const handleChangeHomeworkScore = (
    studentNo: number,
    hwId: string,
    val: string,
    maxScore: number
  ) => {
    if (val === '') {
      setRows((prev) =>
        prev.map((r) => {
          if (r.no !== studentNo) return r;
          const curr = r.homeworks[hwId] || { submitted: false, score: '' };
          return {
            ...r,
            homeworks: {
              ...r.homeworks,
              [hwId]: {
                ...curr,
                submitted: false,
                score: '',
              },
            },
          };
        })
      );
      return;
    }
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.round(Math.max(0, Math.min(maxScore, parsed)) * 100) / 100;
    setRows((prev) =>
      prev.map((r) => {
        if (r.no !== studentNo) return r;
        const curr = r.homeworks[hwId] || { submitted: false, score: '' };
        return {
          ...r,
          homeworks: {
            ...r.homeworks,
            [hwId]: {
              ...curr,
              submitted: true,
              score: clamped,
            },
          },
        };
      })
    );
  };

  const handleChangeMidtermScore = (studentNo: number, val: string) => {
    if (val === '') {
      setRows((prev) =>
        prev.map((item) =>
          item.no === studentNo ? { ...item, midtermScore: '' } : item
        )
      );
      return;
    }
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.round(Math.max(0, Math.min(20, parsed)) * 100) / 100;
    setRows((prev) =>
      prev.map((item) =>
        item.no === studentNo ? { ...item, midtermScore: clamped } : item
      )
    );
  };

  const handleChangeFinalScore = (studentNo: number, val: string) => {
    if (val === '') {
      setRows((prev) =>
        prev.map((item) =>
          item.no === studentNo ? { ...item, finalScore: '' } : item
        )
      );
      return;
    }
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.round(Math.max(0, Math.min(20, parsed)) * 100) / 100;
    setRows((prev) =>
      prev.map((item) =>
        item.no === studentNo ? { ...item, finalScore: clamped } : item
      )
    );
  };

  // 1-Tap Give Full Score to Entire Class for an Assignment Column
  const handleMarkColumnAllSubmitted = (hwId: string, maxScore: number) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        homeworks: {
          ...r.homeworks,
          [hwId]: {
            ...(r.homeworks[hwId] || {}),
            submitted: true,
            score: r.homeworks[hwId]?.score === '' ? maxScore : r.homeworks[hwId].score,
          },
        },
      }))
    );
    triggerToast(`ติ๊กส่งครบทั้งห้อง (${maxScore} คะแนน) เรียบร้อย`);
  };

  const handleAddNewAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwTitle.trim()) return;
    const newId = `hw-${assignments.length + 1}`;
    const newCol: AssignmentColumnDef = {
      id: newId,
      shortTitle: `งาน ${assignments.length + 1}`,
      fullTitle: newHwTitle.trim(),
      maxScore: newHwMax,
      dueDate: 'วันนี้',
    };
    setAssignments((prev) => [...prev, newCol]);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        homeworks: {
          ...r.homeworks,
          [newId]: { submitted: false, score: '', attachmentType: 'NONE' },
        },
      }))
    );
    setNewHwTitle('');
    setIsNewHwOpen(false);
    triggerToast(`เพิ่มคอลัมน์ "${newCol.shortTitle}" ลงในสมุดเรียบร้อย`);
  };

  const attendanceCounts = useMemo(() => {
    const getStatus = (r: StudentPaperRow) =>
      mode === 'MORNING_ASSEMBLY' ? r.morningStatus : r.classPeriods[4];
    return {
      present: rows.filter((r) => getStatus(r) === 'PRESENT').length,
      absent: rows.filter((r) => getStatus(r) === 'ABSENT').length,
      late: rows.filter((r) => getStatus(r) === 'LATE').length,
      leave: rows.filter((r) => getStatus(r) === 'LEAVE').length,
    };
  }, [rows, mode]);

  return (
    <div ref={containerRef} className="bg-[#FDFDFB] border border-slate-300 rounded-xl shadow-xs overflow-hidden select-none font-sans">
      {/* แถบหัวสมุด ปพ.5 แบบกระดาษ (บรรทัดเดียว กระชับ ไม่รก) */}
      <div className="bg-[#D9F7FA] border-b border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
            สมุด ปพ.5 • ชั้น {selectedRoom} ({rows.length} คน)
          </span>
          <div className="inline-flex rounded-lg bg-white/90 p-0.5 border border-cyan-300">
            {['ม.2/1', 'ม.3/1', 'ม.1/8'].map((rm) => (
              <button
                key={rm}
                type="button"
                onClick={() => setSelectedRoom(rm)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedRoom === rm
                    ? 'bg-[#1967D2] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {rm}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">
            • {mode === 'MORNING_ASSEMBLY' ? 'กิจกรรมหน้าเสาธง 07:45 น.' : subjectLabel}
          </span>
        </div>

        {/* ปุ่มสลับหน้ากระดาษ (4 งานหลักของครู) */}
        {!hideModeSwitcher && (
          <div className="flex flex-wrap items-center gap-1 bg-white/90 p-0.5 rounded-xl border border-cyan-300">
            <button
              type="button"
              onClick={() => switchMode('MORNING_ASSEMBLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'MORNING_ASSEMBLY'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              1. เช็คแถวเช้า
            </button>
            <button
              type="button"
              onClick={() => switchMode('CLASS_ATTENDANCE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'CLASS_ATTENDANCE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              2. เช็คชื่อเรียน
            </button>
            <button
              type="button"
              onClick={() => switchMode('HOMEWORK_CHECK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'HOMEWORK_CHECK'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              3. ตรวจงาน (1–4)
            </button>
            <button
              type="button"
              onClick={() => switchMode('SCORE_GRADEBOOK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'SCORE_GRADEBOOK'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              4. คะแนน ปพ.5 (100)
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {mode === 'CLASS_ATTENDANCE' && (
            <div className="inline-flex rounded-lg bg-white border border-slate-300 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => switchAttendanceViewType('MULTI_PERIOD')}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  attendanceViewType === 'MULTI_PERIOD'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                รวมหลายคาบ
              </button>
              <button
                type="button"
                onClick={() => switchAttendanceViewType('TODAY_SINGLE')}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  attendanceViewType === 'TODAY_SINGLE'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                เฉพาะวันนี้
              </button>
            </div>
          )}

          {(mode === 'HOMEWORK_CHECK' || mode === 'SCORE_GRADEBOOK') && (
            <button
              type="button"
              onClick={() => setIsNewHwOpen((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>สั่งงานเพิ่ม</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => triggerToast('บันทึกข้อมูลลงสมุด ปพ.5 เรียบร้อยแล้ว')}
            className="px-3 py-1 rounded-lg bg-[#1967D2] hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึก</span>
          </button>
        </div>
      </div>

      {/* แถบเพิ่มคอลัมน์งานใหม่แบบ Inline */}
      {isNewHwOpen && (
        <form
          onSubmit={handleAddNewAssignment}
          className="bg-amber-50/80 border-b border-amber-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="font-bold text-slate-800">เพิ่มช่องตรวจงานใหม่:</span>
          <input
            type="text"
            required
            placeholder="ชื่อชิ้นงาน/การบ้าน เช่น ใบงานที่ 5"
            value={newHwTitle}
            onChange={(e) => setNewHwTitle(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold w-56"
          />
          <label className="inline-flex items-center gap-1 font-bold text-slate-700">
            <span>คะแนนเต็ม:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={newHwMax}
              onChange={(e) => setNewHwMax(Number(e.target.value) || 15)}
              className="w-14 px-2 py-1 rounded-lg border border-slate-300 bg-white text-center font-bold"
            />
          </label>
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold cursor-pointer"
          >
            เพิ่มลงสมุด
          </button>
          <button
            type="button"
            onClick={() => setIsNewHwOpen(false)}
            className="px-2 py-1 text-slate-500 hover:text-slate-800"
          >
            ยกเลิก
          </button>
        </form>
      )}

      {/* ============================================================================
          MODE 1: กระดาษเช็คแถวเช้า (4 คอลัมน์ชัดเจน พร้อมปุ่มติ๊กครบทั้งห้องด้านบน)
      ============================================================================ */}
      {mode === 'MORNING_ASSEMBLY' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-xs sm:text-sm font-bold">
                <th className="py-2 px-2 border-r border-slate-300 w-10 text-center">ที่</th>
                <th className="py-2 px-3 border-r border-slate-300 text-left">ชื่อ - สกุล</th>
                {(
                  [
                    { key: 'PRESENT', label: 'มาเรียน', count: attendanceCounts.present },
                    { key: 'ABSENT', label: 'ขาด', count: attendanceCounts.absent },
                    { key: 'LATE', label: 'มาสาย', count: attendanceCounts.late },
                    { key: 'LEAVE', label: 'ลาป่วย', count: attendanceCounts.leave },
                  ] as const
                ).map((col) => {
                  const allChecked = rows.every((r) => r.morningStatus === col.key);
                  return (
                    <th
                      key={col.key}
                      className="py-1.5 px-1.5 border-r last:border-r-0 border-slate-300 w-16 sm:w-24 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleMarkAllAttendance(col.key)}
                        className="flex flex-col items-center justify-center w-full gap-0.5 cursor-pointer"
                        title={`เลือก ${col.label} ทั้งห้อง`}
                      >
                        <span className="text-[11px] sm:text-xs font-bold leading-tight">
                          {col.label} ({col.count})
                        </span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            allChecked
                              ? 'bg-[#1967D2] border-[#1967D2] text-white'
                              : 'bg-white border-slate-400'
                          }`}
                        >
                          {allChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = r.morningStatus;
                const rowBg =
                  st === 'ABSENT'
                    ? 'bg-[#FADADD]'
                    : st === 'LATE'
                    ? 'bg-amber-50/90'
                    : st === 'LEAVE'
                    ? 'bg-sky-50/90'
                    : 'bg-white hover:bg-slate-50';
                return (
                  <tr
                    key={r.studentId}
                    className={`${rowBg} border-b border-slate-200 transition-colors`}
                  >
                    <td className="py-2 px-1.5 border-r border-slate-300 text-center text-xs font-semibold text-slate-700">
                      {r.no}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-sm font-medium text-slate-900">
                      {r.fullName}
                    </td>
                    {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((statusKey) => {
                      const selected = st === statusKey;
                      return (
                        <td
                          key={statusKey}
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((item) =>
                                item.no === r.no
                                  ? { ...item, morningStatus: statusKey }
                                  : item
                              )
                            )
                          }
                          className="py-2 px-1 border-r last:border-r-0 border-slate-200 text-center cursor-pointer"
                        >
                          <div className="flex items-center justify-center">
                            <span
                              className={`w-5 h-5 rounded-full inline-block ${
                                selected
                                  ? 'border-[6px] border-[#1967D2] bg-white'
                                  : 'border-2 border-slate-400 bg-white'
                              }`}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================================
          MODE 2: กระดาษเช็คชื่อเข้าเรียน (แบบรวมหลายคาบ Multi-Period เหมือนสมุด ปพ.5 กระดาษจริง)
      ============================================================================ */}
      {mode === 'CLASS_ATTENDANCE' && attendanceViewType === 'MULTI_PERIOD' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-xs font-bold">
                <th className="py-2 px-2 border-r border-slate-300 w-10 text-center sticky left-0 bg-slate-100 z-10">
                  ที่
                </th>
                <th className="py-2 px-2 border-r border-slate-300 w-16 text-center text-slate-500">
                  รหัส
                </th>
                <th className="py-2 px-3 border-r border-slate-300 text-left min-w-[190px] sticky left-10 bg-slate-100 z-10">
                  ชื่อ - สกุล
                </th>
                {DEFAULT_PERIODS.map((period) => {
                  const presentCount = rows.filter(
                    (r) => r.classPeriods[period.index] === 'PRESENT'
                  ).length;
                  return (
                    <th
                      key={period.index}
                      className="py-1.5 px-2 border-r border-slate-300 w-24 text-center bg-slate-50"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-extrabold text-slate-900">
                          {period.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {period.date}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMarkPeriodAllPresent(period.index)}
                          className="mt-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:bg-teal-50 hover:border-teal-400 text-[10px] font-bold text-teal-800 cursor-pointer"
                          title="คลิกเพื่อให้ทุกคนในคาบนี้เป็น 'มา'"
                        >
                          ✓ มาครบ ({presentCount})
                        </button>
                      </div>
                    </th>
                  );
                })}
                <th className="py-2 px-2 border-r border-slate-300 w-18 text-center bg-teal-50/70 text-teal-950">
                  มา (ครั้ง)
                </th>
                <th className="py-2 px-2 border-r border-slate-300 w-16 text-center bg-blue-50/70 text-blue-950">
                  ร้อยละ
                </th>
                <th className="py-2 px-2 w-18 text-center bg-slate-100 text-slate-800">
                  ผล มส.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const attendedPeriods = r.classPeriods.filter((p) => p === 'PRESENT').length;
                const percent = Math.round((attendedPeriods / DEFAULT_PERIODS.length) * 100);
                const isRiskMs = percent < 80;

                return (
                  <tr
                    key={r.studentId}
                    className={`border-b border-slate-200 hover:bg-slate-50/80 transition-colors ${
                      isRiskMs ? 'bg-rose-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center text-xs font-bold text-slate-600 sticky left-0 bg-inherit z-10">
                      {r.no}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center text-xs font-mono text-slate-500">
                      {r.studentId}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-sm font-medium text-slate-900 sticky left-10 bg-inherit z-10">
                      {r.fullName}
                    </td>

                    {DEFAULT_PERIODS.map((period) => {
                      const st = r.classPeriods[period.index] || 'PRESENT';
                      const badgeCls =
                        st === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : st === 'ABSENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : st === 'LATE'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300';
                      const label =
                        st === 'PRESENT'
                          ? '✓ มา'
                          : st === 'ABSENT'
                          ? '✗ ขาด'
                          : st === 'LATE'
                          ? 'สาย'
                          : 'ลา';

                      return (
                        <td
                          key={period.index}
                          className="py-1.5 px-1 border-r border-slate-200 text-center"
                        >
                          <button
                            type="button"
                            onClick={() => handleCyclePeriodStatus(r.no, period.index)}
                            className={`w-full py-1 rounded text-xs font-bold border transition-transform active:scale-95 cursor-pointer ${badgeCls}`}
                            title="คลิกเพื่อสลับ: มา → ขาด → สาย → ลา"
                          >
                            {label}
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-xs font-extrabold text-teal-900 bg-teal-50/30">
                      {attendedPeriods}/{DEFAULT_PERIODS.length}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-xs font-extrabold text-slate-900">
                      {percent}%
                    </td>
                    <td className="py-1.5 px-2 text-center text-xs font-bold">
                      {isRiskMs ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                          เสี่ยง มส.
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                          ปกติ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODE 2: กระดาษเช็คชื่อเข้าเรียน (แบบเฉพาะคาบวันนี้ Single-Period Roll-Call) */}
      {mode === 'CLASS_ATTENDANCE' && attendanceViewType === 'TODAY_SINGLE' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-xs sm:text-sm font-bold">
                <th className="py-2 px-2 border-r border-slate-300 w-10 text-center">ที่</th>
                <th className="py-2 px-3 border-r border-slate-300 text-left">ชื่อ - สกุล</th>
                {(
                  [
                    { key: 'PRESENT', label: 'มาเรียน', count: attendanceCounts.present },
                    { key: 'ABSENT', label: 'ขาด', count: attendanceCounts.absent },
                    { key: 'LATE', label: 'มาสาย', count: attendanceCounts.late },
                    { key: 'LEAVE', label: 'ลาป่วย', count: attendanceCounts.leave },
                  ] as const
                ).map((col) => {
                  const allChecked = rows.every((r) => r.classPeriods[4] === col.key);
                  return (
                    <th
                      key={col.key}
                      className="py-1.5 px-1.5 border-r last:border-r-0 border-slate-300 w-16 sm:w-24 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleMarkAllAttendance(col.key)}
                        className="flex flex-col items-center justify-center w-full gap-0.5 cursor-pointer"
                        title={`เลือก ${col.label} ทั้งห้อง`}
                      >
                        <span className="text-[11px] sm:text-xs font-bold leading-tight">
                          {col.label} ({col.count})
                        </span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            allChecked
                              ? 'bg-[#1967D2] border-[#1967D2] text-white'
                              : 'bg-white border-slate-400'
                          }`}
                        >
                          {allChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = r.classPeriods[4];
                const rowBg =
                  st === 'ABSENT'
                    ? 'bg-[#FADADD]'
                    : st === 'LATE'
                    ? 'bg-amber-50/90'
                    : st === 'LEAVE'
                    ? 'bg-sky-50/90'
                    : 'bg-white hover:bg-slate-50';
                return (
                  <tr
                    key={r.studentId}
                    className={`${rowBg} border-b border-slate-200 transition-colors`}
                  >
                    <td className="py-2 px-1.5 border-r border-slate-300 text-center text-xs font-semibold text-slate-700">
                      {r.no}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-sm font-medium text-slate-900">
                      {r.fullName}
                    </td>
                    {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((statusKey) => {
                      const selected = st === statusKey;
                      return (
                        <td
                          key={statusKey}
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((item) => {
                                if (item.no !== r.no) return item;
                                const nextP = [...item.classPeriods];
                                nextP[4] = statusKey;
                                return { ...item, classPeriods: nextP };
                              })
                            )
                          }
                          className="py-2 px-1 border-r last:border-r-0 border-slate-200 text-center cursor-pointer"
                        >
                          <div className="flex items-center justify-center">
                            <span
                              className={`w-5 h-5 rounded-full inline-block ${
                                selected
                                  ? 'border-[6px] border-[#1967D2] bg-white'
                                  : 'border-2 border-slate-400 bg-white'
                              }`}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================================
          MODE 3: กระดาษตรวจการบ้าน / งาน 1–4 (ติ๊ก 1-คลิก, กรอกคะแนนเลื่อนลูกศร/Enter, ดูงาน R2/Canva)
      ============================================================================ */}
      {mode === 'HOMEWORK_CHECK' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-xs font-bold">
                <th className="py-2.5 px-2 border-r border-slate-300 w-10 text-center sticky left-0 bg-slate-100 z-10">
                  ที่
                </th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-left min-w-[210px] sticky left-10 bg-slate-100 z-10">
                  ชื่อ - สกุล
                </th>
                {assignments.map((hw) => {
                  const submittedCount = rows.filter(
                    (r) => r.homeworks[hw.id]?.submitted
                  ).length;
                  return (
                    <th
                      key={hw.id}
                      className="py-2 px-2 border-r border-slate-300 min-w-[125px] text-center bg-slate-50"
                      title={hw.fullTitle}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-extrabold text-slate-900">
                          {hw.shortTitle}{' '}
                          <span className="text-slate-500 font-semibold">
                            (เต็ม {hw.maxScore})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[115px]">
                          {hw.fullTitle.replace(/^ใบงานที่ \d+: |^ชิ้นงานที่ \d+: /, '')}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMarkColumnAllSubmitted(hw.id, hw.maxScore)}
                          className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-teal-50 hover:border-teal-400 text-[10px] font-bold text-teal-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>ติ๊กครบ ({submittedCount}/{rows.length})</span>
                        </button>
                      </div>
                    </th>
                  );
                })}
                <th className="py-2 px-2.5 border-r border-slate-300 w-20 text-center bg-teal-50/70 text-teal-950">
                  ส่งแล้ว
                </th>
                <th className="py-2 px-2.5 w-20 text-center bg-amber-50/70 text-amber-950">
                  รวมเก็บ
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rowIdx) => {
                const submittedTotal = assignments.filter(
                  (hw) => r.homeworks[hw.id]?.submitted
                ).length;
                const isAllSubmitted = submittedTotal === assignments.length;
                const sumHwScore = Math.round(
                  assignments.reduce((acc, hw) => {
                    const sc = r.homeworks[hw.id]?.score;
                    return acc + (typeof sc === 'number' ? sc : 0);
                  }, 0) * 100
                ) / 100;

                return (
                  <tr
                    key={r.studentId}
                    className={`border-b border-slate-200 transition-colors ${
                      !isAllSubmitted ? 'bg-[#FFF9FA]' : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2 px-2 border-r border-slate-300 text-center text-xs font-bold text-slate-600 sticky left-0 bg-inherit z-10">
                      {r.no}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-[14px] sm:text-[15px] font-medium text-slate-900 sticky left-10 bg-inherit z-10">
                      {r.fullName}
                    </td>

                    {assignments.map((hw) => {
                      const cell = r.homeworks[hw.id] || {
                        submitted: false,
                        score: '',
                        attachmentType: 'NONE',
                      };
                      return (
                        <td
                          key={hw.id}
                          className={`py-1.5 px-2 border-r border-slate-200 text-center ${
                            cell.submitted ? 'bg-emerald-50/35' : 'bg-rose-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {/* ปุ่มติ๊ก ✓ ส่งแล้ว / ✗ ค้างส่ง เหมือนติ๊กบนกระดาษ */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleHomework(r.no, hw.id, hw.maxScore)
                              }
                              className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                                cell.submitted
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
                                  : 'bg-white border-rose-300 text-rose-500 hover:bg-rose-50'
                              }`}
                              title={
                                cell.submitted
                                  ? 'ส่งแล้ว (คลิกเพื่อเปลี่ยนเป็นค้างส่ง)'
                                  : 'ยังไม่ส่ง (คลิกเพื่อติ๊กว่าส่งแล้ว)'
                              }
                            >
                              {cell.submitted ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                '—'
                              )}
                            </button>

                            {/* ช่องกรอกคะแนนบนกระดาษ รองรับคีย์บอร์ด Enter / ArrowDown / ArrowUp เพื่อเลื่อนลงคอลัมน์ */}
                            <input
                              type="number"
                              step="any"
                              min={0}
                              max={hw.maxScore}
                              placeholder="-"
                              value={cell.score}
                              data-nav={`HOMEWORK_CHECK-${hw.id}-${rowIdx}`}
                              onKeyDown={(e) =>
                                handleScoreKeyDown(e, hw.id, rowIdx, rows.length)
                              }
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleChangeHomeworkScore(
                                  r.no,
                                  hw.id,
                                  e.target.value,
                                  hw.maxScore
                                )
                              }
                              className={`w-12 h-6 rounded border text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                cell.submitted
                                  ? 'border-slate-300 bg-white text-slate-900'
                                  : 'border-rose-200 bg-white/80 text-rose-500'
                              }`}
                            />

                            {/* ปุ่มเปิดดูไฟล์งานแนบ R2 / Canva ใน 1 คลิก */}
                            {cell.submitted &&
                              cell.attachmentType &&
                              cell.attachmentType !== 'NONE' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewAttachment({
                                      studentName: r.fullName,
                                      hwTitle: hw.fullTitle,
                                      type: cell.attachmentType as
                                        | 'R2_IMAGE'
                                        | 'CANVA_LINK',
                                      label: cell.attachmentLabel || 'ไฟล์งาน',
                                      url:
                                        cell.attachmentUrl ||
                                        (cell.attachmentType === 'CANVA_LINK'
                                          ? 'https://www.canva.com'
                                          : 'https://r2.kutchap.ac.th'),
                                    })
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 cursor-pointer"
                                  title={`ดูงานที่ส่ง: ${cell.attachmentLabel}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-xs font-extrabold">
                      <span
                        className={
                          isAllSubmitted ? 'text-emerald-700' : 'text-rose-600'
                        }
                      >
                        {submittedTotal}/{assignments.length}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center text-sm font-extrabold text-slate-900 bg-amber-50/30">
                      {sumHwScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================================
          MODE 4: กระดาษลงคะแนน ปพ.5 (เก็บ 60 | กลางภาค 20 | ปลายภาค 20 | รวม 100 | เกรด)
      ============================================================================ */}
      {mode === 'SCORE_GRADEBOOK' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-xs font-bold">
                <th className="py-2.5 px-2 border-r border-slate-300 w-10 text-center sticky left-0 bg-slate-100 z-10">
                  ที่
                </th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-left min-w-[210px] sticky left-10 bg-slate-100 z-10">
                  ชื่อ - สกุล
                </th>
                {assignments.map((hw) => (
                  <th
                    key={hw.id}
                    className="py-2 px-1.5 border-r border-slate-300 w-16 text-center"
                  >
                    <div>{hw.shortTitle}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">({hw.maxScore})</div>
                  </th>
                ))}
                <th className="py-2 px-2 border-r border-slate-300 w-20 text-center bg-teal-50 text-teal-900">
                  รวมเก็บ
                  <div className="text-[10px] font-semibold">(60)</div>
                </th>
                <th className="py-2 px-2 border-r border-slate-300 w-20 text-center bg-blue-50 text-blue-900">
                  กลางภาค
                  <div className="text-[10px] font-semibold">(20)</div>
                </th>
                <th className="py-2 px-2 border-r border-slate-300 w-20 text-center bg-indigo-50 text-indigo-900">
                  ปลายภาค
                  <div className="text-[10px] font-semibold">(20)</div>
                </th>
                <th className="py-2 px-2 border-r border-slate-300 w-20 text-center bg-amber-50 text-amber-950">
                  รวม
                  <div className="text-[10px] font-semibold">(100)</div>
                </th>
                <th className="py-2 px-2 w-16 text-center bg-slate-200 text-slate-900">
                  เกรด
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rowIdx) => {
                const accum = Math.round(
                  assignments.reduce((acc, hw) => {
                    const sc = r.homeworks[hw.id]?.score;
                    return acc + (typeof sc === 'number' ? sc : 0);
                  }, 0) * 100
                ) / 100;
                const hasMissingHw = assignments.some(
                  (hw) => !r.homeworks[hw.id]?.submitted
                );
                const hasMissingExam = r.midtermScore === '' || r.finalScore === '';
                const hasMissing = hasMissingHw || hasMissingExam;
                const midterm = typeof r.midtermScore === 'number' ? r.midtermScore : 0;
                const final = typeof r.finalScore === 'number' ? r.finalScore : 0;
                const totalScore = Math.round((accum + midterm + final) * 100) / 100;
                const grade = computeThaiGrade(totalScore, hasMissing);

                return (
                  <tr
                    key={r.studentId}
                    className={`border-b border-slate-200 ${
                      grade === 'ร' ? 'bg-rose-50/50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center text-xs font-bold text-slate-600 sticky left-0 bg-inherit z-10">
                      {r.no}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-[14px] sm:text-[15px] font-medium text-slate-900 sticky left-10 bg-inherit z-10">
                      {r.fullName}
                    </td>
                    {assignments.map((hw) => {
                      const sc = r.homeworks[hw.id]?.score ?? '';
                      return (
                        <td
                          key={hw.id}
                          className="py-1 px-1 border-r border-slate-200 text-center"
                        >
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={hw.maxScore}
                            placeholder="-"
                            value={sc}
                            data-nav={`SCORE_GRADEBOOK-${hw.id}-${rowIdx}`}
                            onKeyDown={(e) =>
                              handleScoreKeyDown(e, hw.id, rowIdx, rows.length)
                            }
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              handleChangeHomeworkScore(
                                r.no,
                                hw.id,
                                e.target.value,
                                hw.maxScore
                              )
                            }
                            className="w-12 h-7 rounded border border-slate-300 bg-white text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-sm font-extrabold text-teal-900 bg-teal-50/40">
                      {accum}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center bg-blue-50/20">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        max={20}
                        placeholder="-"
                        value={r.midtermScore}
                        data-nav={`SCORE_GRADEBOOK-midterm-${rowIdx}`}
                        onKeyDown={(e) =>
                          handleScoreKeyDown(e, 'midterm', rowIdx, rows.length)
                        }
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleChangeMidtermScore(r.no, e.target.value)}
                        className="w-12 h-7 rounded border border-slate-300 bg-white text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center bg-indigo-50/20">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        max={20}
                        placeholder="-"
                        value={r.finalScore}
                        data-nav={`SCORE_GRADEBOOK-final-${rowIdx}`}
                        onKeyDown={(e) =>
                          handleScoreKeyDown(e, 'final', rowIdx, rows.length)
                        }
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleChangeFinalScore(r.no, e.target.value)}
                        className="w-12 h-7 rounded border border-slate-300 bg-white text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-sm font-extrabold text-slate-900 bg-amber-50/40">
                      {totalScore}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-xs font-extrabold ${
                          grade === 'ร'
                            ? 'bg-rose-600 text-white'
                            : Number(grade) >= 3
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-800'
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
        </div>
      )}

      {/* หน้าต่างดูชิ้นงานนักเรียนอย่างไวเมื่อกดไอคอนรูปดวงตา (ไม่บังตาราง) */}
      {previewAttachment && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-white rounded-2xl border border-slate-300 shadow-xl p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
            <div>
              <div className="text-xs font-extrabold text-slate-900">
                {previewAttachment.studentName}
              </div>
              <div className="text-[11px] text-slate-500">
                {previewAttachment.hwTitle}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewAttachment(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">
                {previewAttachment.type === 'CANVA_LINK'
                  ? '🔗 ลิงก์ชิ้นงาน Canva'
                  : '🖼️ รูปถ่ายใบงาน (Cloudflare R2)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ส่งตรงเวลา
              </span>
            </div>
            <div className="text-slate-600 truncate">
              ไฟล์: <strong>{previewAttachment.label}</strong>
            </div>
            <a
              href="https://www.canva.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 rounded-lg bg-[#1967D2] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-blue-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดูชิ้นงานเต็มจอ</span>
            </a>
          </div>
        </div>
      )}

      {/* แจ้งเตือนบันทึกสั้นๆ มุมขวาล่าง */}
      {savedToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedToast}</span>
        </div>
      )}
    </div>
  );
};
