import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Check,
  ExternalLink,
  Plus,
  Save,
  CheckCircle2,
  X,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import {
  attendanceCorrelationService,
  normalizeClassroomId,
  normalizeCourseCode,
  type PeriodAttendanceRecord,
  type MorningAssemblyRecord,
  type AttendanceStatusCode,
} from '../../services/attendanceCorrelationService';
import { cleanSlateService } from '../../services/cleanSlateService';
import { studentService, formatClassroomLabel } from '../../services/studentService';
import { sgsRosterAndSubmissionService } from '../../services/sgsRosterAndSubmissionService';
import { isGrade1SgsStudentCode } from '../../config/m1SgsLookup';

export type PaperLedgerMode =
  | 'MORNING_ASSEMBLY'
  | 'CLASS_ATTENDANCE'
  | 'HOMEWORK_CHECK'
  | 'SCORE_GRADEBOOK';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | '';

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
  classPeriods: AttendanceStatus[];
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
  isoDate?: string;
  periodNo?: number;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function formatDisplayDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
  } catch {
    return iso;
  }
}

function computeDynamicPeriods(selectedRoom?: string, subjectLabel?: string): PeriodDef[] {
  if (!selectedRoom) return [];
  const normalizedRoom = normalizeClassroomId(selectedRoom);
  const normalizedCourse = normalizeCourseCode(subjectLabel?.split(' ')[0] || '');

  // Read actual saved records for this room & subject (filter out legacy test mock IDs)
  const allRecords = attendanceCorrelationService
    .getAllPeriodRecords()
    .filter(
      (r) =>
        normalizeClassroomId(r.classroomId) === normalizedRoom &&
        (!normalizedCourse || normalizeCourseCode(r.courseCode) === normalizedCourse) &&
        !r.id.startsWith('t-p') &&
        !['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].includes(r.date)
    );

  const dateMap = new Map<string, number>();
  allRecords.forEach((r) => {
    dateMap.set(r.date, r.periodNo || 1);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  if (sortedDates.length > 0) {
    return sortedDates.map((d, idx) => ({
      index: idx,
      label: `คาบ ${dateMap.get(d) || (idx + 1)}`,
      date: formatDisplayDate(d),
      isoDate: d,
      periodNo: dateMap.get(d) || (idx + 1),
    }));
  }

  // If no periods have been recorded yet, provide 1 blank slot for today
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  return [
    {
      index: 0,
      label: 'คาบ 1 (วันนี้)',
      date: formatDisplayDate(todayIso),
      isoDate: todayIso,
      periodNo: 1,
    },
  ];
}

const DEFAULT_ASSIGNMENTS: AssignmentColumnDef[] = [];

function buildInitialRows(selectedRoom?: string, periods: PeriodDef[] = []): StudentPaperRow[] {
  if (!selectedRoom) {
    return [];
  }
  const isNonGrade1 = !selectedRoom.includes('1-') && !selectedRoom.includes('1/');
  const students = studentService.getStudents(selectedRoom);
  const normalizedRoom = normalizeClassroomId(selectedRoom);
  const allRecords = attendanceCorrelationService.getAllPeriodRecords();
  const todayIso = new Date().toISOString().split('T')[0];
  const morningRecords = attendanceCorrelationService.getMorningRecords(normalizedRoom, todayIso);

  const rawList =
    students && students.length > 0
      ? students
      : sgsRosterAndSubmissionService.getSgsRoster(selectedRoom);

  const baseList = isNonGrade1
    ? rawList.filter((st: any) => !isGrade1SgsStudentCode(st.code || st.studentCode || st.id || ''))
    : rawList;

  return baseList.map((st: any, idx: number) => {
    const studentCode = st.code || st.studentCode || st.id;
    const mRec = morningRecords.find(
      (m) => (m.studentCode === studentCode || m.studentId === st.id) && !m.id.startsWith('t-m')
    );
    const morningStatus: AttendanceStatus = (mRec ? mRec.status : '') as AttendanceStatus;

    const classPeriods: AttendanceStatus[] = periods.map((p) => {
      if (!p.isoDate) return '';
      const pRec = allRecords.find(
        (r) =>
          r.studentCode === studentCode &&
          r.date === p.isoDate &&
          normalizeClassroomId(r.classroomId) === normalizedRoom &&
          !r.id.startsWith('t-p')
      );
      return (pRec ? pRec.status : '') as AttendanceStatus;
    });

    return {
      no: st.no || st.sgsSeatNo || idx + 1,
      studentId: studentCode,
      fullName: st.name || st.studentName,
      morningStatus,
      classPeriods,
      homeworks: {},
      midtermScore: typeof st.midtermScore === 'number' ? st.midtermScore : '',
      finalScore: typeof st.finalScore === 'number' ? st.finalScore : '',
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

const NEXT_STATUS: Record<string, AttendanceStatus> = {
  '': 'PRESENT',
  PRESENT: 'ABSENT',
  ABSENT: 'LATE',
  LATE: 'LEAVE',
  LEAVE: '',
};

interface PaperRegisterLedgerProps {
  initialMode?: PaperLedgerMode;
  defaultRoom?: string;
  availableRooms?: string[];
  subjectLabel?: string;
  hideModeSwitcher?: boolean;
  hideMorningAssembly?: boolean;
  onModeChange?: (mode: PaperLedgerMode) => void;
  onNavigateToMorningAssembly?: () => void;
}

export const PaperRegisterLedger: React.FC<PaperRegisterLedgerProps> = ({
  initialMode = 'HOMEWORK_CHECK',
  defaultRoom = '',
  availableRooms = [],
  subjectLabel = '',
  hideModeSwitcher = false,
  hideMorningAssembly = false,
  onModeChange,
  onNavigateToMorningAssembly,
}) => {
  const [mode, setMode] = useState<PaperLedgerMode>(() => {
    if (hideMorningAssembly && initialMode === 'MORNING_ASSEMBLY') {
      return 'CLASS_ATTENDANCE';
    }
    return initialMode;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>(defaultRoom || availableRooms[0] || '');
  const [attendanceViewType, setAttendanceViewType] = useState<'MULTI_PERIOD' | 'TODAY_SINGLE'>('MULTI_PERIOD');
  const [assignments, setAssignments] = useState<AssignmentColumnDef[]>(() =>
    cleanSlateService.isCleanSlateActive() ? [] : DEFAULT_ASSIGNMENTS
  );
  const [morningSyncMode, setMorningSyncMode] = useState<'AUTO_PREFILL' | 'MANUAL_FRESH'>(() => {
    try {
      const raw = window.localStorage.getItem('kps_school_branding_settings_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.morningToClassSyncMode === 'MANUAL_FRESH') return 'MANUAL_FRESH';
      }
    } catch {
      // ignore
    }
    return 'AUTO_PREFILL';
  });

  const [periods, setPeriods] = useState<PeriodDef[]>(() =>
    computeDynamicPeriods(defaultRoom || availableRooms[0] || '', subjectLabel)
  );

  const [rows, setRows] = useState<StudentPaperRow[]>(() => {
    const initPeriods = computeDynamicPeriods(defaultRoom || availableRooms[0] || '', subjectLabel);
    return buildInitialRows(defaultRoom || availableRooms[0] || '', initPeriods);
  });

  useEffect(() => {
    if (defaultRoom) {
      setSelectedRoom(defaultRoom);
    } else if (availableRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(availableRooms[0]);
    }
  }, [defaultRoom, availableRooms]);

  useEffect(() => {
    const nextPeriods = computeDynamicPeriods(selectedRoom, subjectLabel);
    setPeriods(nextPeriods);
    setRows(buildInitialRows(selectedRoom, nextPeriods));
  }, [selectedRoom, subjectLabel]);

  useEffect(() => {
    const handleUpdate = () => {
      const nextPeriods = computeDynamicPeriods(selectedRoom, subjectLabel);
      setPeriods(nextPeriods);
      setRows(buildInitialRows(selectedRoom, nextPeriods));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('kps-students-updated', handleUpdate);
      window.addEventListener('kp-sgs-roster-updated', handleUpdate);
      window.addEventListener('kps-data-sync-event', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('kps-students-updated', handleUpdate);
        window.removeEventListener('kp-sgs-roster-updated', handleUpdate);
        window.removeEventListener('kps-data-sync-event', handleUpdate);
      }
    };
  }, [selectedRoom, subjectLabel]);
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

  const applyMorningSyncModeToRows = (nextSyncMode: 'AUTO_PREFILL' | 'MANUAL_FRESH') => {
    setMorningSyncMode(nextSyncMode);
    try {
      const raw = window.localStorage.getItem('kps_school_branding_settings_v1');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.morningToClassSyncMode = nextSyncMode;
      window.localStorage.setItem('kps_school_branding_settings_v1', JSON.stringify(parsed));
      window.dispatchEvent(new Event('kps-school-settings-updated'));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const syncFromSettings = () => {
      try {
        const raw = window.localStorage.getItem('kps_school_branding_settings_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          const nextMode =
            parsed.morningToClassSyncMode === 'MANUAL_FRESH' ? 'MANUAL_FRESH' : 'AUTO_PREFILL';
          setMorningSyncMode(nextMode);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('kps-school-settings-updated', syncFromSettings);
    return () => window.removeEventListener('kps-school-settings-updated', syncFromSettings);
  }, []);

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

  const syncAttendanceToCorrelation = (updatedRows: StudentPaperRow[]) => {
    try {
      const normalizedRoom = normalizeClassroomId(selectedRoom);
      const courseCode = subjectLabel.split(' ')[0] || 'ศ23101';
      const todayIso = new Date().toISOString().split('T')[0];

      if (mode === 'MORNING_ASSEMBLY') {
        const morningRecords: MorningAssemblyRecord[] = updatedRows
          .filter((r) => r.morningStatus)
          .map((r) => ({
            id: `morn-${todayIso.replace(/-/g, '')}-${r.studentId}`,
            date: todayIso,
            classroomId: normalizedRoom,
            studentId: r.studentId,
            studentCode: r.studentId.startsWith('stu-') ? r.studentId.replace('stu-', '4510') : r.studentId,
            studentName: r.fullName,
            status: r.morningStatus as AttendanceStatusCode,
            source: 'MANUAL',
            isOverridden: false,
            markedAt: new Date().toISOString(),
          }));
        attendanceCorrelationService.saveMorningRecords(morningRecords);
        attendanceCorrelationService.runCorrelation(normalizedRoom, todayIso);
      } else if (mode === 'CLASS_ATTENDANCE') {
        const periodRecords: PeriodAttendanceRecord[] = updatedRows
          .filter((r) => r.classPeriods[0])
          .map((r) => ({
            id: `per-${todayIso.replace(/-/g, '')}-p1-${r.studentId}`,
            date: todayIso,
            classroomId: normalizedRoom,
            courseCode: normalizeCourseCode(courseCode),
            courseName: subjectLabel,
            periodNo: 1,
            studentId: r.studentId,
            studentCode: r.studentId.startsWith('stu-') ? r.studentId.replace('stu-', '4510') : r.studentId,
            studentName: r.fullName,
            status: r.classPeriods[0] as AttendanceStatusCode,
            source: 'MANUAL',
            isOverridden: false,
            markedAt: new Date().toISOString(),
          }));
        attendanceCorrelationService.savePeriodRecords(periodRecords);
        attendanceCorrelationService.runCorrelation(normalizedRoom, todayIso);
      }
    } catch {
      // ignore
    }
  };

  // 1-Tap Select All for Morning Assembly or Today's Single Period
  const handleMarkAllAttendance = (status: AttendanceStatus) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        if (mode === 'MORNING_ASSEMBLY') {
          return { ...r, morningStatus: status };
        }
        const updatedPeriods = [...r.classPeriods];
        if (updatedPeriods.length > 0) {
          updatedPeriods[0] = status;
        } else {
          updatedPeriods.push(status);
        }
        return { ...r, classPeriods: updatedPeriods };
      });
      syncAttendanceToCorrelation(next);
      return next;
    });
  };

  // 1-Tap Mark All Present for a specific Period column
  const handleMarkPeriodAllPresent = (periodIndex: number) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        const updatedPeriods = [...r.classPeriods];
        updatedPeriods[periodIndex] = 'PRESENT';
        return { ...r, classPeriods: updatedPeriods };
      });
      syncAttendanceToCorrelation(next);
      return next;
    });
    triggerToast(`เช็ค "มา" คาบที่ ${periodIndex + 1} ครบทั้งห้องเรียบร้อย`);
  };

  // 1-Click Cycle Attendance Status in Multi-Period Cell
  const handleCyclePeriodStatus = (studentNo: number, periodIndex: number) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.no !== studentNo) return r;
        const updatedPeriods = [...r.classPeriods];
        const curr = updatedPeriods[periodIndex] || 'PRESENT';
        updatedPeriods[periodIndex] = NEXT_STATUS[curr];
        return { ...r, classPeriods: updatedPeriods };
      });
      syncAttendanceToCorrelation(next);
      return next;
    });
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
      mode === 'MORNING_ASSEMBLY' ? r.morningStatus : (r.classPeriods[0] || '');
    return {
      present: rows.filter((r) => getStatus(r) === 'PRESENT').length,
      absent: rows.filter((r) => getStatus(r) === 'ABSENT').length,
      late: rows.filter((r) => getStatus(r) === 'LATE').length,
      leave: rows.filter((r) => getStatus(r) === 'LEAVE').length,
    };
  }, [rows, mode]);

  return (
    <div ref={containerRef} className="bg-white border border-[#E6EEF7] rounded-[18px] shadow-[0_4px_16px_rgba(40,90,140,0.06)] overflow-hidden select-none font-sans">
      {/* แถบหัวสมุด ปพ.5 สไตล์ Pastel Anime Education Dashboard */}
      <div className="bg-linear-to-r from-blue-50/70 via-white to-indigo-50/50 border-b border-[#E6EEF7] px-3.5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-[#163A66]">
              สมุด ปพ.5 • ชั้น {formatClassroomLabel(selectedRoom)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              {rows.length} คน
            </span>
            <div className="inline-flex rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 shadow-2xs">
              {(availableRooms && availableRooms.length > 0 ? availableRooms : selectedRoom ? [selectedRoom] : []).map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => setSelectedRoom(rm)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedRoom === rm
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {formatClassroomLabel(rm)}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              • {mode === 'MORNING_ASSEMBLY' ? 'กิจกรรมหน้าเสาธง 07:45 น.' : subjectLabel}
            </span>
          </div>
        </div>

        {/* ปุ่มสลับหน้ากระดาษ (งานของครู) */}
        {!hideModeSwitcher && (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              {!hideMorningAssembly && (
                <button
                  type="button"
                  onClick={() => switchMode('MORNING_ASSEMBLY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'MORNING_ASSEMBLY'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  1. เช็คแถวเช้า
                </button>
              )}
              <button
                type="button"
                onClick={() => switchMode('CLASS_ATTENDANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'CLASS_ATTENDANCE'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {hideMorningAssembly ? '1. เช็คชื่อเรียน (รายคาบ)' : '2. เช็คชื่อเรียน'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('HOMEWORK_CHECK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'HOMEWORK_CHECK'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {hideMorningAssembly ? '2. ตรวจงาน (1–4)' : '3. ตรวจงาน (1–4)'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('SCORE_GRADEBOOK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'SCORE_GRADEBOOK'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {hideMorningAssembly ? '3. คะแนน ปพ.5 (100)' : '4. คะแนน ปพ.5 (100)'}
              </button>
            </div>

            {/* ทางลัดไปเช็คแถวเช้าห้องที่ปรึกษา */}
            {hideMorningAssembly && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToMorningAssembly) {
                    onNavigateToMorningAssembly();
                  } else {
                    switchMode('MORNING_ASSEMBLY');
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="สลับไปหน้าเช็คแถวเช้า 07:45 น. (ห้องที่ปรึกษา)"
              >
                <span>☀️ ไปเช็คแถวเช้า (ห้องที่ปรึกษา) ↗</span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {mode === 'CLASS_ATTENDANCE' && (
            <>
              <div className="inline-flex rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    applyMorningSyncModeToRows('AUTO_PREFILL');
                    triggerToast('ดึงสถานะเช็คชื่อแถวเช้ามาใส่คาบเรียนให้อัตโนมัติ (แก้ทับได้)');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    morningSyncMode === 'AUTO_PREFILL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ดึงแถวเช้า
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyMorningSyncModeToRows('MANUAL_FRESH');
                    triggerToast('ตั้งค่าเป็นกรอกเช็คชื่อใหม่ในคาบเรียน');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    morningSyncMode === 'MANUAL_FRESH'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กรอกใหม่
                </button>
              </div>

              <div className="inline-flex rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => switchAttendanceViewType('MULTI_PERIOD')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    attendanceViewType === 'MULTI_PERIOD'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รวมหลายคาบ
                </button>
                <button
                  type="button"
                  onClick={() => switchAttendanceViewType('TODAY_SINGLE')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    attendanceViewType === 'TODAY_SINGLE'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เฉพาะวันนี้
                </button>
              </div>
            </>
          )}

          {(mode === 'HOMEWORK_CHECK' || mode === 'SCORE_GRADEBOOK') && (
            <button
              type="button"
              onClick={() => setIsNewHwOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>สั่งงานเพิ่ม</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => triggerToast('บันทึกข้อมูลลงสมุด ปพ.5 เรียบร้อยแล้ว')}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
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
              }))}
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
                {periods.map((period) => {
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                const attendedPeriods = r.classPeriods.filter((p) => p === 'PRESENT').length;
                const markedPeriods = r.classPeriods.filter(Boolean).length;
                const hasRecords = markedPeriods > 0;
                const percent = hasRecords ? Math.round((attendedPeriods / markedPeriods) * 100) : 0;
                const isRiskMs = hasRecords && percent < 80;

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

                    {periods.map((period) => {
                      const st = r.classPeriods[period.index] || '';
                      const badgeCls =
                        st === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : st === 'ABSENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : st === 'LATE'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : st === 'LEAVE'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200';
                      const label =
                        st === 'PRESENT'
                          ? '✓ มา'
                          : st === 'ABSENT'
                          ? '✗ ขาด'
                          : st === 'LATE'
                          ? 'สาย'
                          : st === 'LEAVE'
                          ? 'ลา'
                          : '—';

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
                      {attendedPeriods}/{hasRecords ? periods.length : 0}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center text-xs font-extrabold text-slate-900">
                      {hasRecords ? `${percent}%` : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center text-xs font-bold">
                      {!hasRecords ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                          —
                        </span>
                      ) : isRiskMs ? (
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
              }))}
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
                  const allChecked = rows.every((r) => r.classPeriods[0] === col.key);
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                const st = r.classPeriods[0] || '';
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
                          onClick={() => {
                            setRows((prev) => {
                              const next = prev.map((item) => {
                                if (item.no !== r.no) return item;
                                const nextP = [...item.classPeriods];
                                nextP[0] = statusKey;
                                return { ...item, classPeriods: nextP };
                              });
                              syncAttendanceToCorrelation(next);
                              return next;
                            });
                          }}
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
              }))}
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(4, assignments.length + 3)} className="py-12 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                  </td>
                </tr>
              ) : (
                rows.map((r, rowIdx) => {
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
              }))}
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
                  </td>
                </tr>
              ) : (
                rows.map((r, rowIdx) => {
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
              }))}
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
