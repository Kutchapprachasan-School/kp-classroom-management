import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
  Shield,
  Lock,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  CalendarDays,
  Calendar,
  Plus,
  Trash2,
  Clock,
  Sun,
  Edit2,
  School,
  FileCheck,
  AlertCircle,
  Save,
  FileText,
  Users,
  X,
  Bell,
  Utensils,
  RotateCcw,
} from 'lucide-react';
import {
  schoolLeaveSettingsService,
  SCHOOL_LEAVE_SETTINGS_EVENT,
  type SchoolLeaveSettings,
} from '../services/schoolLeaveSettingsService';
import {
  studentAffairsCouncilService,
  type StudentLeaveRequest,
} from '../services/studentAffairsCouncilService';
import { sgsExportService, type SgsSnapshotRecord } from '../services/sgsExportService';
import {
  sgsRosterAndSubmissionService,
  type R2CourseStorageSummary,
} from '../services/sgsRosterAndSubmissionService';
import {
  getSchoolSettings,
  saveSchoolSettings,
  resetSchoolSettingsToDefault,
  type SchoolUserRole,
  type SchoolBrandingSettings,
} from '../config/schoolRoles';
import {
  studentBannerService,
  STUDENT_BANNERS_EVENT,
  type StudentBannerKey,
  type StudentBannerItem,
} from '../services/studentBannerService';
import {
  teacherBannerService,
  TEACHER_BANNERS_EVENT,
  type TeacherBannerKey,
  type TeacherBannerItem,
} from '../services/teacherBannerService';
import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
  type AcademicTermRecord,
  type HolidayType,
  type DayOfWeek,
} from '../services/academicCalendarService';

export interface SchoolBellScheduleConfig {
  morningAssemblyStart: string;     // e.g. '07:45'
  morningAssemblyEnd: string;       // e.g. '08:15'
  firstPeriodStart: string;         // e.g. '08:30'
  periodDurationMinutes: number;    // e.g. 50
  totalPeriodsPerDay: number;       // e.g. 7 (options: 6, 7, 8, 9)
  lunchBreakMode: 'NUMBERED_PERIOD' | 'SKIPPED_BREAK_SLOT'; // Mode A vs Mode B
  lunchBreakSlot: number;           // e.g. 4 (พักหลังคาบ 4) or 5 (คาบ 5 คือพักเที่ยง)
  lunchDurationMinutes: number;     // e.g. 50 (or 60)
}

const BELL_SCHEDULE_STORAGE_KEY = 'kp_school_bell_schedule';

const DEFAULT_BELL_SCHEDULE_CONFIG: SchoolBellScheduleConfig = {
  morningAssemblyStart: '07:45',
  morningAssemblyEnd: '08:15',
  firstPeriodStart: '08:30',
  periodDurationMinutes: 50,
  totalPeriodsPerDay: 7,
  lunchBreakMode: 'NUMBERED_PERIOD',
  lunchBreakSlot: 4,
  lunchDurationMinutes: 50,
};

export interface BellScheduleTimelineItem {
  id: string;
  type: 'ASSEMBLY' | 'PERIOD' | 'LUNCH';
  periodNumber?: number;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isLunch: boolean;
}

const addMinutesToTimeStr = (timeStr: string, minutesToAdd: number): string => {
  const [hStr, mStr] = (timeStr || '08:00').split(':');
  const totalMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + minutesToAdd;
  const wrappedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrappedMinutes / 60);
  const m = wrappedMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const calculateMinutesDifference = (startTime: string, endTime: string): number => {
  const [sh, sm] = (startTime || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  const [eh, em] = (endTime || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 1440;
  return diff;
};

const generateBellScheduleTimeline = (
  config: SchoolBellScheduleConfig
): BellScheduleTimelineItem[] => {
  const items: BellScheduleTimelineItem[] = [];

  const assemblyDuration = calculateMinutesDifference(
    config.morningAssemblyStart,
    config.morningAssemblyEnd
  );
  items.push({
    id: 'slot-assembly',
    type: 'ASSEMBLY',
    label: 'เข้าแถวเคารพธงชาติ & โฮมรูม',
    startTime: config.morningAssemblyStart,
    endTime: config.morningAssemblyEnd,
    durationMinutes: assemblyDuration > 0 ? assemblyDuration : 30,
    isLunch: false,
  });

  let currentTime = config.firstPeriodStart;

  if (config.lunchBreakMode === 'NUMBERED_PERIOD') {
    const lunchPeriodNum = Math.min(config.lunchBreakSlot + 1, config.totalPeriodsPerDay);

    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      if (p === lunchPeriodNum) {
        const endTime = addMinutesToTimeStr(currentTime, config.lunchDurationMinutes);
        items.push({
          id: `slot-period-${p}-lunch`,
          type: 'LUNCH',
          periodNumber: p,
          label: `คาบที่ ${p} (พักกลางวัน)`,
          startTime: currentTime,
          endTime,
          durationMinutes: config.lunchDurationMinutes,
          isLunch: true,
        });
        currentTime = endTime;
      } else {
        const endTime = addMinutesToTimeStr(currentTime, config.periodDurationMinutes);
        items.push({
          id: `slot-period-${p}`,
          type: 'PERIOD',
          periodNumber: p,
          label: `คาบที่ ${p}`,
          startTime: currentTime,
          endTime,
          durationMinutes: config.periodDurationMinutes,
          isLunch: false,
        });
        currentTime = endTime;
      }
    }
  } else {
    const breakAfter = Math.min(config.lunchBreakSlot, config.totalPeriodsPerDay);

    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      const endTime = addMinutesToTimeStr(currentTime, config.periodDurationMinutes);
      items.push({
        id: `slot-period-${p}`,
        type: 'PERIOD',
        periodNumber: p,
        label: `คาบที่ ${p}`,
        startTime: currentTime,
        endTime,
        durationMinutes: config.periodDurationMinutes,
        isLunch: false,
      });
      currentTime = endTime;

      if (p === breakAfter) {
        const lunchEndTime = addMinutesToTimeStr(currentTime, config.lunchDurationMinutes);
        items.push({
          id: 'slot-lunch-break',
          type: 'LUNCH',
          periodNumber: undefined,
          label: 'พักกลางวัน (ไม่นับคาบ)',
          startTime: currentTime,
          endTime: lunchEndTime,
          durationMinutes: config.lunchDurationMinutes,
          isLunch: true,
        });
        currentTime = lunchEndTime;
      }
    }
  }

  return items;
};

interface SettingsBackupViewProps {
  activeRole?: SchoolUserRole;
  initialTab?: 'CALENDAR' | 'BRANDING' | 'STORAGE' | 'BANNERS';
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  activeRole = 'ACADEMIC_ADMIN',
  initialTab = 'CALENDAR',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [snapshots, setSnapshots] = useState<SgsSnapshotRecord[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );
  const [roleMode, setRoleMode] = useState<'ADMIN' | 'TEACHER'>(
    activeRole === 'ACADEMIC_ADMIN' ? 'ADMIN' : 'TEACHER'
  );
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(
    activeRole === 'ACADEMIC_ADMIN' ? 'ALL' : 't-pasporm'
  );
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('ALL');
  const [courseStorages, setCourseStorages] = useState<R2CourseStorageSummary[]>(() =>
    sgsRosterAndSubmissionService.getCourseStorageSummaries()
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [studentBanners, setStudentBanners] = useState<Record<StudentBannerKey, StudentBannerItem>>(() =>
    studentBannerService.getBanners()
  );
  const [bannerUploadingKey, setBannerUploadingKey] = useState<StudentBannerKey | null>(null);

  const [teacherBanners, setTeacherBanners] = useState<Record<TeacherBannerKey, TeacherBannerItem>>(() =>
    teacherBannerService.getBanners()
  );
  const [teacherBannerUploadingKey, setTeacherBannerUploadingKey] = useState<TeacherBannerKey | null>(null);

  // Academic Calendar State
  const [calendarConfig, setCalendarConfig] = useState(() => academicCalendarService.getConfig());
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'CALENDAR' | 'BRANDING' | 'STORAGE' | 'BANNERS'
  >(initialTab);

  // School Bell Schedule State
  const [bellSchedule, setBellSchedule] = useState<SchoolBellScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem(BELL_SCHEDULE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BELL_SCHEDULE_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading bell schedule:', e);
    }
    return DEFAULT_BELL_SCHEDULE_CONFIG;
  });

  const timelineSchedule = useMemo(() => {
    return generateBellScheduleTimeline(bellSchedule);
  }, [bellSchedule]);

  // Sub-tab for Separated School Basic Info vs Leave System
  const [brandingSubTab, setBrandingSubTab] = useState<'SCHOOL_INFO' | 'LEAVE_SYSTEM'>('SCHOOL_INFO');
  const [leaveSettings, setLeaveSettings] = useState<SchoolLeaveSettings>(() =>
    schoolLeaveSettingsService.getSettings()
  );
  const [studentLeaves, setStudentLeaves] = useState<StudentLeaveRequest[]>(() =>
    studentAffairsCouncilService.getStudentLeaves()
  );

  // New Custom Quota Form State
  const [isAddQuotaModalOpen, setIsAddQuotaModalOpen] = useState(false);
  const [newQuotaName, setNewQuotaName] = useState('');
  const [newQuotaDays, setNewQuotaDays] = useState<number>(5);
  const [newQuotaDesc, setNewQuotaDesc] = useState('');
  const [newQuotaRequiresCert, setNewQuotaRequiresCert] = useState(false);
  const [newQuotaCertDays, setNewQuotaCertDays] = useState<number>(3);
  const [newQuotaNoticeDays, setNewQuotaNoticeDays] = useState<number>(1);
  const [newQuotaColor, setNewQuotaColor] = useState('bg-indigo-50 text-indigo-700 border-indigo-200');

  useEffect(() => {
    if (initialTab) {
      if ((initialTab as string) === 'LEAVE' || (initialTab as string) === 'LEAVE_SYSTEM') {
        setActiveSettingsTab('BRANDING');
        setBrandingSubTab('LEAVE_SYSTEM');
      } else {
        setActiveSettingsTab(initialTab);
      }
    }
  }, [initialTab]);

  useEffect(() => {
    const onLeaveChange = () => {
      setLeaveSettings(schoolLeaveSettingsService.getSettings());
      setStudentLeaves(studentAffairsCouncilService.getStudentLeaves());
    };
    window.addEventListener(SCHOOL_LEAVE_SETTINGS_EVENT, onLeaveChange);
    return () => window.removeEventListener(SCHOOL_LEAVE_SETTINGS_EVENT, onLeaveChange);
  }, []);

  // Modals for Term, Holiday, Weekend
  const [isCreateTermModalOpen, setIsCreateTermModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isAddWeekendModalOpen, setIsAddWeekendModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTermRecord | null>(null);

  // New Term Form State
  const [newTermYear, setNewTermYear] = useState<number>(2570);
  const [newTermSemester, setNewTermSemester] = useState<1 | 2>(1);
  const [newTermStartDate, setNewTermStartDate] = useState('15 พ.ค. 2570');
  const [newTermEndDate, setNewTermEndDate] = useState('10 ต.ค. 2570');
  const [newTermNote, setNewTermNote] = useState('');

  // New Holiday Form State
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<HolidayType>('GOVERNMENT');
  const [newHolidayNote, setNewHolidayNote] = useState('');

  // New Weekend Makeup Day Form State
  const [newWeekendTitle, setNewWeekendTitle] = useState('');
  const [newWeekendDate, setNewWeekendDate] = useState('');
  const [newWeekendDayOfWeek, setNewWeekendDayOfWeek] = useState<DayOfWeek>('SATURDAY');
  const [newWeekendReason, setNewWeekendReason] = useState('');
  const [newWeekendTarget, setNewWeekendTarget] = useState('ทุกระดับชั้น (ม.1 - ม.6)');
  const [newWeekendSubDate, setNewWeekendSubDate] = useState('');
  const [newWeekendPeriods, setNewWeekendPeriods] = useState<number>(6);

  useEffect(() => {
    const handleCalendarChange = () => {
      setCalendarConfig(academicCalendarService.getConfig());
    };
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
    return () => window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
  }, []);

  useEffect(() => {
    const onBannersChange = () => setStudentBanners(studentBannerService.getBanners());
    window.addEventListener(STUDENT_BANNERS_EVENT, onBannersChange);
    return () => window.removeEventListener(STUDENT_BANNERS_EVENT, onBannersChange);
  }, []);

  useEffect(() => {
    const onTeacherBannersChange = () => setTeacherBanners(teacherBannerService.getBanners());
    window.addEventListener(TEACHER_BANNERS_EVENT, onTeacherBannersChange);
    return () => window.removeEventListener(TEACHER_BANNERS_EVENT, onTeacherBannersChange);
  }, []);

  const handleBannerUpload = async (key: StudentBannerKey, file: File) => {
    if (activeRole !== 'ACADEMIC_ADMIN') {
      showToast('เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถอัปโหลดแบนเนอร์ได้');
      return;
    }
    setBannerUploadingKey(key);
    try {
      const maxWidth = key === 'hero' ? 1200 : key === 'sidebar' ? 600 : 800;
      const maxHeight = key === 'hero' ? 400 : key === 'sidebar' ? 600 : 250;
      const dataUrl = await studentBannerService.compressImage(file, maxWidth, maxHeight, 0.85);
      const res = studentBannerService.updateBanner(
        key,
        { customUrl: dataUrl },
        activeRole,
        'แอดมินฝ่ายวิชาการ'
      );
      if (res.success) {
        setStudentBanners(studentBannerService.getBanners());
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setBannerUploadingKey(null);
    }
  };

  const handleBannerReset = (key: StudentBannerKey) => {
    if (activeRole !== 'ACADEMIC_ADMIN') return;
    const res = studentBannerService.resetBanner(key, activeRole);
    if (res.success) {
      setStudentBanners(studentBannerService.getBanners());
      showToast(res.message);
    }
  };

  const handleTeacherBannerUpload = async (key: TeacherBannerKey, file: File) => {
    if (activeRole !== 'ACADEMIC_ADMIN') {
      showToast('เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถอัปโหลดแบนเนอร์ได้');
      return;
    }
    setTeacherBannerUploadingKey(key);
    try {
      const maxWidth = key === 'hero' ? 1200 : key === 'sidebar' ? 600 : 1200;
      const maxHeight = key === 'hero' ? 400 : key === 'sidebar' ? 450 : 250;
      const dataUrl = await teacherBannerService.compressImage(file, maxWidth, maxHeight, 0.86);
      const res = teacherBannerService.updateBanner(
        key,
        { customUrl: dataUrl },
        activeRole,
        'แอดมินฝ่ายวิชาการ'
      );
      if (res.success) {
        setTeacherBanners(teacherBannerService.getBanners());
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setTeacherBannerUploadingKey(null);
    }
  };

  const handleTeacherBannerReset = (key: TeacherBannerKey) => {
    if (activeRole !== 'ACADEMIC_ADMIN') return;
    const res = teacherBannerService.resetBanner(key, activeRole);
    if (res.success) {
      setTeacherBanners(teacherBannerService.getBanners());
      showToast(res.message);
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSchoolSettings(schoolSettings);
    setSchoolSettings(updated);
    showToast('บันทึกข้อมูลโรงเรียน โลโก้ และการเชื่อมระบบ SMS เรียบร้อยแล้ว');
  };

  const handleSaveLeaveSettings = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    schoolLeaveSettingsService.saveSettings(leaveSettings);
    showToast('บันทึกการตั้งค่าระบบการลา & โควตาวันลาเรียบร้อยแล้ว');
  };

  const handleAddCustomQuotaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuotaName.trim()) return;
    const updated = schoolLeaveSettingsService.addQuota({
      name: newQuotaName.trim(),
      quotaDays: Math.max(0, Number(newQuotaDays) || 0),
      description: newQuotaDesc.trim() || 'ประเภทการลาเพิ่มเติมที่กำหนดโดยสถานศึกษา',
      requiresMedicalCertificate: newQuotaRequiresCert,
      medicalCertMinDays: Math.max(1, Number(newQuotaCertDays) || 1),
      advanceNoticeDays: Math.max(0, Number(newQuotaNoticeDays) || 0),
      color: newQuotaColor,
    });
    setLeaveSettings(updated);
    setIsAddQuotaModalOpen(false);
    setNewQuotaName('');
    setNewQuotaDesc('');
    showToast(`เพิ่มประเภทโควตาวันลา "${newQuotaName.trim()}" เรียบร้อยแล้ว`);
  };

  const handleResetLeaveSettings = () => {
    if (confirm('คุณต้องการคืนค่าเริ่มต้นระบบการลาและโควตาวันลาใช่หรือไม่?')) {
      const def = schoolLeaveSettingsService.resetToDefault();
      setLeaveSettings(def);
      showToast('คืนค่าเริ่มต้นระบบการลาเรียบร้อยแล้ว');
    }
  };

  const handleApproveStudentLeaveAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const updated = studentAffairsCouncilService.approveStudentLeave(id, status);
    setStudentLeaves(updated);
    showToast(status === 'APPROVED' ? 'อนุมัติใบลาเรียบร้อยแล้ว (ซิงค์สถานะเข้าคาบเรียน)' : 'ปฏิเสธคำขอลาเรียบร้อย');
  };

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = saveSchoolSettings({
          ...schoolSettings,
          logoUrl: reader.result,
        });
        setSchoolSettings(updated);
        showToast('อัปเดตโลโก้โรงเรียนสำหรับหน้า Login เรียบร้อยแล้ว');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeRole === 'ACADEMIC_ADMIN') {
      setRoleMode('ADMIN');
      setSelectedTeacherFilter('ALL');
    } else {
      setRoleMode('TEACHER');
      setSelectedTeacherFilter('t-pasporm');
    }
  }, [activeRole]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSnapshots = async () => {
    const list = await sgsExportService.getSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // สรุปพื้นที่แยกตามครูแต่ละคน (สำหรับแอดมินดูภาพรวมว่าครูท่านไหนใช้พื้นที่ R2 เท่าไร)
  const teacherUsageSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        department: string;
        courseCount: number;
        totalFiles: number;
        totalCanvaLinks: number;
        totalR2Mb: number;
        backedUpCourses: number;
      }
    >();

    courseStorages.forEach((c) => {
      const existing = map.get(c.teacherId) || {
        teacherId: c.teacherId,
        teacherName: c.teacherName,
        department: c.department,
        courseCount: 0,
        totalFiles: 0,
        totalCanvaLinks: 0,
        totalR2Mb: 0,
        backedUpCourses: 0,
      };
      existing.courseCount += 1;
      existing.totalFiles += c.r2FileCount;
      existing.totalCanvaLinks += c.canvaLinkCount;
      existing.totalR2Mb = Number((existing.totalR2Mb + c.r2UsedMb).toFixed(2));
      if (c.isBackedUpToSchoolDrive) existing.backedUpCourses += 1;
      map.set(c.teacherId, existing);
    });

    return Array.from(map.values());
  }, [courseStorages]);

  const filteredCourses = useMemo(() => {
    return courseStorages.filter((c) => {
      if (roleMode === 'TEACHER' && c.teacherId !== 't-pasporm') return false;
      if (selectedTeacherFilter !== 'ALL' && c.teacherId !== selectedTeacherFilter) return false;
      if (selectedTermFilter !== 'ALL' && c.academicTerm !== selectedTermFilter) return false;
      return true;
    });
  }, [courseStorages, roleMode, selectedTeacherFilter, selectedTermFilter]);

  const totalSchoolR2Mb = useMemo(
    () => Number(courseStorages.reduce((acc, c) => acc + c.r2UsedMb, 0).toFixed(2)),
    [courseStorages]
  );

  const handleExportSgs = async () => {
    setIsExporting(true);
    try {
      const created = await sgsExportService.generateSnapshot('room-3-1', 'ศ23101');
      await loadSnapshots();
      showToast(
        `สร้างและอัปโหลดไฟล์ Immutable Snapshot เรียบร้อย (${created.fileName})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง SGS Snapshot';
      showToast(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupDb = async () => {
    setIsBackingUp(true);
    try {
      const created = await sgsExportService.generateSnapshot('all-classrooms', 'FULL-DB');
      await loadSnapshots();
      showToast(`สำรองฐานข้อมูล PostgreSQL Snapshot เรียบร้อย (ID: ${created.id})`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSwitchActiveTerm = (termId: string) => {
    const target = academicCalendarService.setActiveTerm(termId);
    if (target) {
      setCalendarConfig(academicCalendarService.getConfig());
      showToast(`สลับใช้งานเป็น ${target.termName}/${target.year} เรียบร้อยแล้ว`);
    }
  };

  const handleCreateTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermYear || !newTermStartDate.trim() || !newTermEndDate.trim()) return;
    academicCalendarService.createTerm({
      year: newTermYear,
      semesterNo: newTermSemester,
      startDate: newTermStartDate.trim(),
      endDate: newTermEndDate.trim(),
      note: newTermNote.trim() || undefined,
    });
    setCalendarConfig(academicCalendarService.getConfig());
    setIsCreateTermModalOpen(false);
    showToast(`สร้างภาคเรียนที่ ${newTermSemester}/${newTermYear} เรียบร้อยแล้ว`);
  };

  const handleUpdateTermDatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;
    academicCalendarService.updateTerm(editingTerm.id, {
      startDate: editingTerm.startDate,
      endDate: editingTerm.endDate,
      note: editingTerm.note,
    });
    setCalendarConfig(academicCalendarService.getConfig());
    setEditingTerm(null);
    showToast(`อัปเดตวันเปิด-ปิดเทอมของ ${editingTerm.termName}/${editingTerm.year} เรียบร้อยแล้ว`);
  };

  const handleDeleteTerm = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบ ${name} ใช่หรือไม่?`)) {
      const ok = academicCalendarService.deleteTerm(id);
      if (ok) {
        setCalendarConfig(academicCalendarService.getConfig());
        showToast(`ลบ ${name} เรียบร้อยแล้ว`);
      } else {
        showToast('ไม่สามารถลบภาคเรียนที่กำลังเปิดใช้งาน (Active) อยู่ได้');
      }
    }
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate.trim()) return;
    academicCalendarService.addHoliday({
      name: newHolidayName.trim(),
      date: newHolidayDate.trim(),
      type: newHolidayType,
      note: newHolidayNote.trim() || undefined,
    });
    setCalendarConfig(academicCalendarService.getConfig());
    setIsAddHolidayModalOpen(false);
    setNewHolidayName('');
    setNewHolidayDate('');
    setNewHolidayNote('');
    showToast('เพิ่มวันหยุดพิเศษเรียบร้อยแล้ว');
  };

  const handleToggleHoliday = (id: string) => {
    academicCalendarService.toggleHoliday(id);
    setCalendarConfig(academicCalendarService.getConfig());
  };

  const handleDeleteHoliday = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบวันหยุด "${name}" ใช่หรือไม่?`)) {
      academicCalendarService.deleteHoliday(id);
      setCalendarConfig(academicCalendarService.getConfig());
      showToast(`ลบวันหยุด "${name}" เรียบร้อยแล้ว`);
    }
  };

  const handleAddWeekendMakeupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekendTitle.trim() || !newWeekendDate.trim() || !newWeekendReason.trim()) return;
    academicCalendarService.addWeekendMakeupDay({
      title: newWeekendTitle.trim(),
      date: newWeekendDate.trim(),
      dayOfWeek: newWeekendDayOfWeek,
      reason: newWeekendReason.trim(),
      targetClasses: newWeekendTarget.trim(),
      substituteForDate: newWeekendSubDate.trim() || undefined,
      periodCount: newWeekendPeriods,
    });
    setCalendarConfig(academicCalendarService.getConfig());
    setIsAddWeekendModalOpen(false);
    setNewWeekendTitle('');
    setNewWeekendDate('');
    setNewWeekendReason('');
    setNewWeekendSubDate('');
    showToast('เพิ่มวันมาเรียนพิเศษ (เสาร์-อาทิตย์) เรียบร้อยแล้ว');
  };

  const handleToggleWeekendMakeup = (id: string) => {
    academicCalendarService.toggleWeekendMakeupDay(id);
    setCalendarConfig(academicCalendarService.getConfig());
  };

  const handleDeleteWeekendMakeup = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบวันมาเรียนพิเศษ "${name}" ใช่หรือไม่?`)) {
      academicCalendarService.deleteWeekendMakeupDay(id);
      setCalendarConfig(academicCalendarService.getConfig());
      showToast(`ลบวันมาเรียนพิเศษเรียบร้อยแล้ว`);
    }
  };

  const handleSaveBellSchedule = () => {
    try {
      localStorage.setItem(BELL_SCHEDULE_STORAGE_KEY, JSON.stringify(bellSchedule));
      window.dispatchEvent(
        new CustomEvent('kp_school_bell_schedule_updated', { detail: bellSchedule })
      );
      showToast('บันทึกการตั้งค่าโครงสร้างเวลาเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกโครงสร้างเวลา');
    }
  };

  const handleResetBellSchedule = () => {
    if (confirm('คุณต้องการคืนค่าโครงสร้างเวลาเข้าแถวและคาบเรียนเป็นค่าเริ่มต้นมาตรฐานโรงเรียนใช่หรือไม่?')) {
      setBellSchedule(DEFAULT_BELL_SCHEDULE_CONFIG);
      try {
        localStorage.setItem(BELL_SCHEDULE_STORAGE_KEY, JSON.stringify(DEFAULT_BELL_SCHEDULE_CONFIG));
        window.dispatchEvent(
          new CustomEvent('kp_school_bell_schedule_updated', { detail: DEFAULT_BELL_SCHEDULE_CONFIG })
        );
        showToast('คืนค่าเริ่มต้นโครงสร้างเวลาเรียบร้อยแล้ว');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              ตั้งค่าระบบ & พื้นที่จัดเก็บไฟล์ R2 / Google Drive โรงเรียนกุดจับประชาสรรค์ (100 TB Workspace)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              โรงเรียนกุดจับประชาสรรค์ (สพม.อุดรธานี) · แยกสิทธิ์ครูผู้สอนล้างเฉพาะวิชาตัวเอง vs ฝ่ายวิชาการ/แอดมินจัดการทั้งโรงเรียน
            </p>
          </div>
        </div>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setRoleMode('ADMIN');
              setSelectedTeacherFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              roleMode === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ มุมมองแอดมิน (จัดการได้ทุกคน/ทั้งเทอม/ทั้งปี)
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleMode('TEACHER');
              setSelectedTeacherFilter('t-pasporm');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              roleMode === 'TEACHER'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 มุมมองครูผู้สอน (ล้างเฉพาะวิชาตัวเอง)
          </button>
        </div>
      </div>

      {/* 4-Section Settings Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          {
            key: 'CALENDAR',
            label: '1. ปีการศึกษา & ปฏิทินกำหนดการ (เปิด-ปิดเทอม / วันหยุด / เรียนพิเศษ)',
            icon: CalendarDays,
          },
          {
            key: 'BRANDING',
            label: '2. ข้อมูลโรงเรียน & อัตลักษณ์',
            icon: Settings,
          },
          {
            key: 'STORAGE',
            label: '3. พื้นที่ Cloudflare R2 & สำรองข้อมูล',
            icon: Database,
          },
          {
            key: 'BANNERS',
            label: '4. จัดการภาพแบนเนอร์',
            icon: ImageIcon,
          },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeSettingsTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSettingsTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ปีการศึกษา, ภาคเรียน, วันเปิด-ปิดเทอม, วันหยุดพิเศษ, และวันมาเรียนพิเศษ เสาร์-อาทิตย์ */}
      {activeSettingsTab === 'CALENDAR' && (
        <div className="space-y-6">
          {/* Quick Sub-Navigation Pills for Tab 1 */}
          <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
            <a
              href="#terms-section"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>1.1 ปีการศึกษา & ภาคเรียน</span>
            </a>
            <a
              href="#bell-schedule-section"
              className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>1.2 เวลาเข้าแถว & โครงสร้างคาบเรียน (Bell Schedule)</span>
            </a>
            <a
              href="#holidays-section"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>1.3 วันหยุดพิเศษ</span>
            </a>
            <a
              href="#weekends-section"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>1.4 วันมาเรียนพิเศษ ส.-อา.</span>
            </a>
          </div>

          {/* Part 1.1: Academic Year and Terms Management */}
          <div id="terms-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      การตั้งค่าปีการศึกษา & ภาคเรียน (Academic Terms Management)
                    </h2>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      ย้ายมาจากปฏิทินกิจกรรม
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดปี พ.ศ. สลับภาคเรียนปัจจุบัน (Active) และตั้งค่าวันเปิดเทอม - วันปิดเทอมของโรงเรียน
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateTermModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ สร้างปีการศึกษา/ภาคเรียนใหม่</span>
              </button>
            </div>

            {/* Terms List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {calendarConfig.terms.map((term) => (
                <div
                  key={term.id}
                  className={`rounded-2xl border p-4.5 space-y-3 transition-all ${
                    term.isActive
                      ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900">
                          {term.termName}/{term.year}
                        </span>
                        {term.isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {term.id}
                      </span>
                    </div>

                    {!term.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term.id, `${term.termName}/${term.year}`)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="ลบภาคเรียนนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-400">วันเปิดเทอม:</span>
                      <strong className="text-slate-800">{term.startDate}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-400">วันปิดเทอม:</span>
                      <strong className="text-slate-800">{term.endDate}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400">นักเรียน / ห้อง:</span>
                      <span>{term.studentCount} คน • {term.classCount} ห้อง</span>
                    </div>
                  </div>

                  {term.note && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      {term.note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {!term.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchActiveTerm(term.id)}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors text-center cursor-pointer"
                      >
                        สลับเป็นภาคเรียนปัจจุบัน
                      </button>
                    ) : (
                      <span className="flex-1 py-1.5 text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                        กำลังเปิดสอนในระบบ
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingTerm(term)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="แก้ไขวันเปิด-ปิดเทอม"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>แก้ไข</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part 1.2: เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule) */}
          <div id="bell-schedule-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)
                    </h2>
                    <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      มาตรฐานโรงเรียนกุดจับประชาสรรค์
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดเวลาเช็คแถวหน้าเสาธง เวลาเริ่มคาบเรียน และโหมดการนับคาบพักเที่ยง (นับเป็นคาบที่ หรือข้ามคาบ)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetBellSchedule}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="คืนค่ามาตรฐานโรงเรียน"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveBellSchedule}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>💾 บันทึกการตั้งค่าโครงสร้างเวลา</span>
                </button>
              </div>
            </div>

            {/* Grid 1: เวลาเข้าแถวเคารพธงชาติ & โครงสร้างเวลาเรียนรายคาบ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. เวลาเข้าแถวเคารพธงชาติ */}
              <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/50 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    1. เวลาเข้าแถวเคารพธงชาติ (Morning Assembly)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  เวลาสำหรับเช็คแถวหน้าเสาธงและกิจกรรมโฮมรูมประจำชั้น
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาเริ่มเข้าแถว
                    </label>
                    <input
                      type="time"
                      value={bellSchedule.morningAssemblyStart}
                      onChange={(e) =>
                        setBellSchedule((prev) => ({
                          ...prev,
                          morningAssemblyStart: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาสิ้นสุดเข้าแถว
                    </label>
                    <input
                      type="time"
                      value={bellSchedule.morningAssemblyEnd}
                      onChange={(e) =>
                        setBellSchedule((prev) => ({
                          ...prev,
                          morningAssemblyEnd: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. โครงสร้างเวลาเรียนรายคาบ */}
              <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/50 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    2. โครงสร้างเวลาเรียนรายคาบ (Daily Period Structure)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  กำหนดเวลาเริ่มคาบแรก ระยะเวลาต่อคาบ และจำนวนคาบเรียนปกติในหนึ่งวัน
                </p>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เวลาเริ่มคาบที่ 1
                    </label>
                    <input
                      type="time"
                      value={bellSchedule.firstPeriodStart}
                      onChange={(e) =>
                        setBellSchedule((prev) => ({
                          ...prev,
                          firstPeriodStart: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ระยะเวลาเรียนต่อคาบ
                    </label>
                    <select
                      value={bellSchedule.periodDurationMinutes}
                      onChange={(e) =>
                        setBellSchedule((prev) => ({
                          ...prev,
                          periodDurationMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={45}>45 นาที</option>
                      <option value={50}>50 นาที (มาตรฐาน)</option>
                      <option value={60}>60 นาที</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      จำนวนคาบต่อวัน
                    </label>
                    <select
                      value={bellSchedule.totalPeriodsPerDay}
                      onChange={(e) =>
                        setBellSchedule((prev) => ({
                          ...prev,
                          totalPeriodsPerDay: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={6}>6 คาบ</option>
                      <option value={7}>7 คาบ</option>
                      <option value={8}>8 คาบ</option>
                      <option value={9}>9 คาบ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก) */}
            <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      3. โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      เลือกรูปแบบการนับเลขคาบเรียนหลังพักเที่ยงตามระเบียบของโรงเรียน
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  โหมดปัจจุบัน: {bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD' ? 'โหมด A' : 'โหมด B'}
                </span>
              </div>

              {/* Radio Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Mode A */}
                <div
                  onClick={() =>
                    setBellSchedule((prev) => ({
                      ...prev,
                      lunchBreakMode: 'NUMBERED_PERIOD',
                    }))
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD'
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        โหมด A: นับพักเที่ยงเป็นคาบที่ (Numbered Period)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      ยอดนิยมแบบที่ 1
                    </span>
                  </div>

                  <div className="mt-3 bg-white/80 p-2.5 rounded-lg border border-blue-100 text-xs font-mono font-bold text-blue-900">
                    คาบที่ 4 เรียน → คาบที่ 5 พักเที่ยง → คาบที่ 6 เรียนภาคบ่าย
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    เหมาะสำหรับโรงเรียนที่กำหนดให้ช่วงพักรับประทานอาหารกลางวันเป็นคาบที่ในตารางสอน (เช่น คาบ 5 คือพักเที่ยง แล้วบ่ายเรียนคาบ 6)
                  </p>
                </div>

                {/* Mode B */}
                <div
                  onClick={() =>
                    setBellSchedule((prev) => ({
                      ...prev,
                      lunchBreakMode: 'SKIPPED_BREAK_SLOT',
                    }))
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    bellSchedule.lunchBreakMode === 'SKIPPED_BREAK_SLOT'
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          bellSchedule.lunchBreakMode === 'SKIPPED_BREAK_SLOT'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {bellSchedule.lunchBreakMode === 'SKIPPED_BREAK_SLOT' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        โหมด B: ข้ามคาบพักเที่ยง ไม่นับเป็นคาบที่ (Skipped Break Slot)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      ยอดนิยมแบบที่ 2
                    </span>
                  </div>

                  <div className="mt-3 bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-xs font-mono font-bold text-emerald-900">
                    คาบที่ 4 เรียน → [พักเที่ยง] → คาบที่ 5 เรียนภาคบ่าย (คาบต่อไปยังคงเป็นคาบที่ 5)
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    เหมาะสำหรับโรงเรียนที่นับเฉพาะคาบเรียนจริง โดยพักเที่ยงเป็นแถบคั่นเวลา เมื่อเข้าเรียนภาคบ่ายจะเริ่มนับเป็นคาบที่ 5 ต่อทันที
                  </p>
                </div>
              </div>

              {/* Sub-controls for Lunch Position & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    เลือกตำแหน่งพักเที่ยง: พักหลังคาบที่
                  </label>
                  <select
                    value={bellSchedule.lunchBreakSlot}
                    onChange={(e) =>
                      setBellSchedule((prev) => ({
                        ...prev,
                        lunchBreakSlot: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={4}>คาบที่ 4 (พักหลังคาบ 4)</option>
                    <option value={5}>คาบที่ 5 (พักหลังคาบ 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ระยะเวลาพักเที่ยง
                  </label>
                  <select
                    value={bellSchedule.lunchDurationMinutes}
                    onChange={(e) =>
                      setBellSchedule((prev) => ({
                        ...prev,
                        lunchDurationMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={40}>40 นาที</option>
                    <option value={50}>50 นาที (มาตรฐาน)</option>
                    <option value={60}>60 นาที (1 ชั่วโมงเต็ม)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Preview Timeline Schedule (ไทม์ไลน์จำลองตารางเรียนประจำวัน) */}
            <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-100 text-blue-700 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900">
                    ไทม์ไลน์จำลองตารางเรียนประจำวัน (Preview Timeline Schedule)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-slate-500">
                    จำนวนคาบเรียนทั้งหมด: {bellSchedule.totalPeriodsPerDay} คาบ
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-blue-600">
                    {bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD'
                      ? 'โหมด A: นับพักเที่ยงเป็นคาบ'
                      : 'โหมด B: ข้ามคาบพักเที่ยง'}
                  </span>
                </div>
              </div>

              {/* Timeline Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
                {timelineSchedule.map((slot) => {
                  if (slot.type === 'ASSEMBLY') {
                    return (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-center space-y-1 shadow-2xs"
                      >
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 block truncate">
                          ☀️ เข้าแถว
                        </span>
                        <div className="text-[11px] font-mono font-bold text-amber-900 whitespace-nowrap">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <span className="text-[10px] text-amber-700 block">
                          {slot.durationMinutes} นาที
                        </span>
                      </div>
                    );
                  }

                  if (slot.isLunch) {
                    return (
                      <div
                        key={slot.id}
                        className="rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5 text-center space-y-1 shadow-2xs"
                      >
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 block truncate">
                          🍲 {slot.label}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-rose-900 whitespace-nowrap">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <span className="text-[10px] text-rose-700 font-semibold block">
                          พัก {slot.durationMinutes} นาที
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-slate-200 bg-white p-2.5 text-center space-y-1 shadow-2xs hover:border-blue-300 transition-colors"
                    >
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 block truncate">
                        📖 {slot.label}
                      </span>
                      <div className="text-[11px] font-mono font-bold text-slate-800 whitespace-nowrap">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {slot.durationMinutes} นาที
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                * การเปลี่ยนแปลงโครงสร้างคาบเรียนจะมีผลต่อการแสดงตารางสอนและการบันทึกเวลาเรียนของครูผู้สอนทุกคน
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetBellSchedule}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  คืนค่าเริ่มต้น
                </button>
                <button
                  type="button"
                  onClick={handleSaveBellSchedule}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 inline mr-1" />
                  💾 บันทึกการตั้งค่าโครงสร้างเวลา
                </button>
              </div>
            </div>
          </div>

          {/* Part 1.3: Special Holidays Management */}
          <div id="holidays-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    วันหยุดพิเศษ (Special Holidays & School Observance Days)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วันหยุดราชการ วันหยุดกรณีพิเศษของโรงเรียน และวันหยุดชดเชยตามประกาศ สพฐ.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddHolidayModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มวันหยุดพิเศษ</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">ชื่อวันหยุดพิเศษ</th>
                    <th className="py-2.5 px-3 w-32">วันที่</th>
                    <th className="py-2.5 px-3 w-40">ประเภท</th>
                    <th className="py-2.5 px-3">หมายเหตุ / ประกาศ</th>
                    <th className="py-2.5 px-3 w-28 text-center">สถานะ</th>
                    <th className="py-2.5 px-3 w-20 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calendarConfig.holidays.map((hol) => (
                    <tr key={hol.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {hol.name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-600 whitespace-nowrap">
                        {hol.date}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {hol.typeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {hol.note || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHoliday(hol.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            hol.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {hol.isActive ? 'เปิดใช้' : 'ปิดชั่วคราว'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(hol.id, hol.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ลบวันหยุดนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Part 1.4: Weekend Makeup Days Management */}
          <div id="weekends-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    วันมาเรียนพิเศษ เสาร์-อาทิตย์ (Weekend Makeup School Days)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วันเรียนชดเชยเสาร์-อาทิตย์ ค่ายติว O-NET/TGAT และการจัดสอนเสริมตามเกณฑ์เวลาเรียน
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWeekendModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มวันมาเรียนพิเศษ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {calendarConfig.weekendMakeupDays.map((wm) => (
                <div
                  key={wm.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 hover:border-indigo-200 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 text-xs line-clamp-1">
                        {wm.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-mono font-bold text-indigo-600">{wm.date}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {wm.dayOfWeek === 'SATURDAY' ? 'วันเสาร์' : 'วันอาทิตย์'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteWeekendMakeup(wm.id, wm.title)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="ลบวันเรียนพิเศษนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {wm.reason}
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>กลุ่มเป้าหมาย:</span>
                      <strong className="text-slate-700">{wm.targetClasses}</strong>
                    </div>
                    {wm.substituteForDate && (
                      <div className="flex justify-between">
                        <span>ชดเชยสำหรับ:</span>
                        <span className="text-indigo-600 font-medium">{wm.substituteForDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>จำนวนคาบสอน:</span>
                      <strong className="text-slate-700">{wm.periodCount} คาบ</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleWeekendMakeup(wm.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        wm.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {wm.isActive ? '✓ เปิดสอนชดเชย' : 'ระงับชั่วคราว'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ข้อมูลพื้นฐานโรงเรียน & ระบบการลา / วันลา (แยกปรับแต่งได้ตามใจ) */}
      {activeSettingsTab === 'BRANDING' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation Switcher: ข้อมูลพื้นฐานโรงเรียน vs ระบบการลา */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200">
            <button
              type="button"
              onClick={() => setBrandingSubTab('SCHOOL_INFO')}
              className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                brandingSubTab === 'SCHOOL_INFO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60'
              }`}
            >
              <School className="w-4 h-4" />
              <span>1. ข้อมูลพื้นฐานโรงเรียน & อัตลักษณ์ (School Identity)</span>
            </button>
            <button
              type="button"
              onClick={() => setBrandingSubTab('LEAVE_SYSTEM')}
              className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                brandingSubTab === 'LEAVE_SYSTEM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>2. ระบบการลา & โควตาวันลา (แยกปรับแต่งได้ตามใจ)</span>
            </button>
          </div>

          {/* SUB-TAB 1: ข้อมูลพื้นฐานโรงเรียน & อัตลักษณ์ */}
          {brandingSubTab === 'SCHOOL_INFO' && (
            <form
              onSubmit={handleSaveBranding}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={schoolSettings.logoUrl}
                    alt={schoolSettings.nameTh}
                    className="w-12 h-12 rounded-xl border border-slate-200 p-1 object-contain bg-white shadow-2xs"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>ตั้งค่าข้อมูลพื้นฐานโรงเรียน & อัตลักษณ์สถานศึกษา</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        สพม.อุดรธานี
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      กำหนดชื่อโรงเรียน ตราประจำโรงเรียน ที่อยู่ สังกัด คำขวัญ พันธกิจ และฟอนต์ระบบ (แยกอิสระจากระบบการลา)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const def = resetSchoolSettingsToDefault();
                      setSchoolSettings(def);
                      showToast('คืนค่าเริ่มต้นข้อมูลโรงเรียนเรียบร้อยแล้ว');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    คืนค่าเริ่มต้น
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลโรงเรียน</span>
                  </button>
                </div>
              </div>

              {/* ส่วนที่ 1: ข้อมูลทั่วไปของโรงเรียน */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-blue-600" />
                  <span>1.1 ข้อมูลทั่วไป & สังกัดสถานศึกษา</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ชื่อโรงเรียน (ภาษาไทย)
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.nameTh}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          nameTh: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ชื่อโรงเรียน (ภาษาอังกฤษ)
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.nameEn || 'Kutchapprachasan School'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          nameEn: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      รหัสย่อ / สังกัด สพม.
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.shortCode}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          shortCode: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ที่อยู่ / ตำบล อำเภอ จังหวัด
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.districtProvince}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          districtProvince: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      รหัสไปรษณีย์
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.postalCode || '41280'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          postalCode: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      placeholder="เช่น 41280"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      หมายเลขโทรศัพท์โรงเรียน
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.phoneNumber || '042-298-123'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          phoneNumber: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ชื่อระบบจัดการชั้นเรียน
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.classroomSystemTitle}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          classroomSystemTitle: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ชื่อระบบใต้โลโก้หน้า Login (SMS)
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.smsSystemName}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          smsSystemName: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      อัปโหลดตรา / โลโก้โรงเรียน (PNG/SVG)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogoFile}
                      className="w-full text-[11px] text-slate-800 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 2: อัตลักษณ์ คำขวัญ วิสัยทัศน์ และพันธกิจ */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>1.2 อัตลักษณ์ คำขวัญ วิสัยทัศน์ & พันธกิจ</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="md:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      คำขวัญโรงเรียน (Motto)
                    </label>
                    <textarea
                      rows={2}
                      value={schoolSettings.motto || 'ร่วมสร้างโอกาส พัฒนาผู้เรียน สู่อนาคตที่ดีกว่า'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          motto: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      วิสัยทัศน์ (Vision)
                    </label>
                    <textarea
                      rows={2}
                      value={schoolSettings.vision || 'มุ่งมั่นพัฒนาผู้เรียนให้มีความรู้ คู่คุณธรรม ก้าวทันเทคโนโลยี'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          vision: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      พันธกิจ (Mission)
                    </label>
                    <textarea
                      rows={2}
                      value={schoolSettings.mission || 'ส่งเสริมการจัดการเรียนรู้เชิงรุก และพัฒนาระบบดิจิทัลเพื่อการศึกษา'}
                      onChange={(e) => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          mission: e.target.value,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 3: ฟอนต์ระบบ, ขนาดตัวอักษร (11px – 20px), และตัวเลือกการเช็คชื่อ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                {/* 1. เลือกฟอนต์ของระบบ */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block font-bold text-slate-800">
                    ฟอนต์หลักของระบบจัดการชั้นเรียน (Font Family)
                  </label>
                  <select
                    value={schoolSettings.fontFamily}
                    onChange={(e) => {
                      const nextFont = e.target.value as SchoolBrandingSettings['fontFamily'];
                      const updated = saveSchoolSettings({
                        ...schoolSettings,
                        fontFamily: nextFont,
                      });
                      setSchoolSettings(updated);
                      showToast(`เปลี่ยนฟอนต์ระบบเป็น "${nextFont}" เรียบร้อยแล้ว`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="Prompt">Prompt (พร้อมท์ — ทันสมัย คมชัดบนมือถือ / แนะนำ)</option>
                    <option value="Sarabun">Sarabun (สารบรรณ — อ่านง่าย มาตรฐานราชการไทย)</option>
                    <option value="Kanit">Kanit (คณิต — หัวข้อชัดเจน สบายตา)</option>
                    <option value="Noto Sans Thai">Noto Sans Thai (โนโตะ — มาตรฐาน Google)</option>
                    <option value="IBM Plex Sans Thai">IBM Plex Sans Thai (โมเดิร์น อ่านตารางตัวเลขง่าย)</option>
                  </select>
                </div>

                {/* 2. ขนาดตัวอักษร 11px – 20px */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      ขนาดตัวอักษรระบบ (ต่ำสุด 11px – ไม่เกิน 20px)
                    </label>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
                      {schoolSettings.baseFontSizePx}px
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">11px</span>
                    <input
                      type="range"
                      min={11}
                      max={20}
                      step={1}
                      value={schoolSettings.baseFontSizePx}
                      onChange={(e) => {
                        const nextPx = Math.min(20, Math.max(11, Number(e.target.value) || 15));
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          baseFontSizePx: nextPx,
                        });
                        setSchoolSettings(updated);
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-500">20px</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[11, 13, 15, 17, 20].map((px) => (
                      <button
                        key={px}
                        type="button"
                        onClick={() => {
                          const updated = saveSchoolSettings({
                            ...schoolSettings,
                            baseFontSizePx: px,
                          });
                          setSchoolSettings(updated);
                          showToast(`ปรับขนาดตัวอักษรเป็น ${px}px`);
                        }}
                        className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          schoolSettings.baseFontSizePx === px
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {px}px {px === 15 ? '(แนะนำ)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. รูปแบบการดึงเช็คชื่อแถวเช้า */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block font-bold text-slate-800">
                    การเช็คชื่อเข้าเรียนรายคาบ (เชื่อมกับแถวเช้า 07:45 น.)
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          morningToClassSyncMode: 'AUTO_PREFILL',
                        });
                        setSchoolSettings(updated);
                        showToast('ตั้งค่า: ดึงสถานะจากแถวเช้ามากรอกให้อัตโนมัติ (ครูแก้ไขทับได้)');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        schoolSettings.morningToClassSyncMode === 'AUTO_PREFILL'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✓ ดึงต่อจากแถวเช้า (Auto Pre-fill + แก้ทับได้)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = saveSchoolSettings({
                          ...schoolSettings,
                          morningToClassSyncMode: 'MANUAL_FRESH',
                        });
                        setSchoolSettings(updated);
                        showToast('ตั้งค่า: ให้ครูประจำวิชากรอกเช็คชื่อใหม่ทุกคาบเรียน');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        schoolSettings.morningToClassSyncMode === 'MANUAL_FRESH'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✎ กรอกใหม่ทุกคาบเรียน (ไม่ดึงผลแถวเช้า)
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* SUB-TAB 2: ระบบการลา / โควตาวันลา (แยกปรับแต่งได้ตามใจ) */}
          {brandingSubTab === 'LEAVE_SYSTEM' && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">
                        ตั้งค่าระบบการลา & โควตาวันลา (Leave Management System)
                      </h2>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                        แยกปรับแต่งได้ตามใจ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      กำหนดโควตาวันลาของนักเรียน/ครู เกณฑ์เวลาเรียนขั้นต่ำ การอนุมัติใบลา และเชื่อมโยงกับการเช็คชื่อในชั้นเรียน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetLeaveSettings}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    คืนค่าเริ่มต้นโควตาวันลา
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLeaveSettings}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกการตั้งค่าระบบการลา</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards 4 Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {leaveSettings.quotas.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 truncate">{q.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${q.color}`}>
                        โควตา
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{q.quotaDays}</span>
                      <span className="text-xs text-slate-500 font-medium">วัน/เทอม</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{q.description}</p>
                  </div>
                ))}
              </div>

              {/* Section A: ปรับแต่งโควตาวันลาแต่ละประเภท */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>ปรับแต่งโควตาวันลาและข้อกำหนดรายประเภท (Leave Type Quota Configuration)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ปรับเปลี่ยนจำนวนวันโควตา ข้อกำหนดใบรับรองแพทย์ และระยะเวลายื่นล่วงหน้าตามระเบียบของโรงเรียน
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddQuotaModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มประเภทโควตาวันลาใหม่</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaveSettings.quotas.map((quota) => (
                    <div
                      key={quota.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${quota.id === 'sick' ? 'bg-rose-500' : quota.id === 'personal' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <h4 className="font-extrabold text-sm text-slate-800">{quota.name}</h4>
                        </div>
                        {quota.id.startsWith('custom_') ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              ID: {quota.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`คุณต้องการลบประเภทโควตา "${quota.name}" ใช่หรือไม่?`)) {
                                  const updated = schoolLeaveSettingsService.deleteQuota(quota.id);
                                  setLeaveSettings(updated);
                                  showToast(`ลบประเภทโควตา "${quota.name}" เรียบร้อยแล้ว`);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              title="ลบประเภทโควตานี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            ID: {quota.id}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            โควตาสูงสุด (วัน/เทอม)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={quota.quotaDays}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setLeaveSettings((prev) => ({
                                ...prev,
                                quotas: prev.quotas.map((q) => (q.id === quota.id ? { ...q, quotaDays: val } : q)),
                              }));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            ยื่นล่วงหน้าอย่างน้อย (วัน)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={quota.advanceNoticeDays}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setLeaveSettings((prev) => ({
                                ...prev,
                                quotas: prev.quotas.map((q) => (q.id === quota.id ? { ...q, advanceNoticeDays: val } : q)),
                              }));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 text-xs space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={quota.requiresMedicalCertificate}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLeaveSettings((prev) => ({
                                ...prev,
                                quotas: prev.quotas.map((q) => (q.id === quota.id ? { ...q, requiresMedicalCertificate: checked } : q)),
                              }));
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>ต้องแนบใบรับรองแพทย์เมื่อลาติดต่อกัน</span>
                        </label>

                        {quota.requiresMedicalCertificate && (
                          <div className="flex items-center gap-2 pl-5 text-[11px] text-slate-600">
                            <span>หากลาเกินกว่า:</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={quota.medicalCertMinDays}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value) || 3);
                                setLeaveSettings((prev) => ({
                                  ...prev,
                                  quotas: prev.quotas.map((q) => (q.id === quota.id ? { ...q, medicalCertMinDays: val } : q)),
                                }));
                              }}
                              className="w-16 px-2 py-0.5 rounded-lg border border-slate-300 bg-white text-center font-bold"
                            />
                            <span>วันขึ้นไป</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B: นโยบายการอนุมัติและเกณฑ์เวลาเรียน */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>นโยบายการอนุมัติใบลา & เกณฑ์เวลาเรียนขั้นต่ำ (Attendance & Approval Policies)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* เกณฑ์เวลาเรียนขั้นต่ำ */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        เกณฑ์เวลาเรียนขั้นต่ำเพื่อมีสิทธิ์สอบ (%)
                      </label>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                        {leaveSettings.minAttendancePercent}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      นักเรียนที่มีเวลาเรียนต่ำกว่าเกณฑ์จะถูกแจ้งเตือนภาวะเสี่ยงติด มส. (ไม่มีสิทธิ์สอบ) อัตโนมัติ
                    </p>
                    <input
                      type="range"
                      min={60}
                      max={90}
                      step={1}
                      value={leaveSettings.minAttendancePercent}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 80;
                        setLeaveSettings((prev) => ({ ...prev, minAttendancePercent: val }));
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>60% (ผ่อนปรน)</span>
                      <span>80% (มาตรฐาน สพฐ.)</span>
                      <span>90% (เข้มงวด)</span>
                    </div>
                  </div>

                  {/* ลำดับขั้นการอนุมัติ */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-800 block">
                      ลำดับขั้นการอนุมัติใบลาของนักเรียน
                    </label>
                    <select
                      value={leaveSettings.approvalWorkflow}
                      onChange={(e) => {
                        const val = e.target.value as SchoolLeaveSettings['approvalWorkflow'];
                        setLeaveSettings((prev) => ({ ...prev, approvalWorkflow: val }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="HOMEROOM_THEN_AFFAIRS">
                        1) ครูที่ปรึกษาตรวจเบื้องต้น → งานกิจการนักเรียนอนุมัติขั้นสุดท้าย (แนะนำ)
                      </option>
                      <option value="HOMEROOM_ONLY">
                        2) ครูที่ปรึกษาประจำชั้นอนุมัติได้ทันที (Homeroom Only)
                      </option>
                      <option value="AFFAIRS_ONLY">
                        3) งานกิจการนักเรียน/ฝ่ายปกครองเป็นผู้อนุมัติโดยตรง (Affairs Only)
                      </option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      กำหนดบทบาทที่มีสิทธิ์ตัดสินใจและบันทึกผลการลาในระบบ
                    </p>
                  </div>
                </div>

                {/* สวิตช์เปิด/ปิดฟีเจอร์การลา */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <label className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 cursor-pointer hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={leaveSettings.enableOnlineStudentSubmission}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setLeaveSettings((prev) => ({ ...prev, enableOnlineStudentSubmission: val }));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <strong className="block text-slate-800">ยื่นลาออนไลน์</strong>
                      <span className="text-[11px] text-slate-500">นักเรียนส่งใบลาผ่านเว็บ/มือถือได้</span>
                    </div>
                  </label>

                  <label className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 cursor-pointer hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={leaveSettings.enableGuardianSmsNotification}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setLeaveSettings((prev) => ({ ...prev, enableGuardianSmsNotification: val }));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <strong className="block text-slate-800">แจ้งเตือนผู้ปกครอง</strong>
                      <span className="text-[11px] text-slate-500">ส่ง SMS/LINE เมื่อใบลาได้รับการอนุมัติ</span>
                    </div>
                  </label>

                  <label className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 cursor-pointer hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={leaveSettings.enableAutoRollCallSync}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setLeaveSettings((prev) => ({ ...prev, enableAutoRollCallSync: val }));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <strong className="block text-slate-800">ซิงค์เช็คชื่อรายคาบ</strong>
                      <span className="text-[11px] text-slate-500">ใส่สถานะ 'ลา' ในตารางสอนอัตโนมัติ</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section C: สถิติและรายการคำขออนุมัติการลาล่าสุด (Real-time monitoring & Action) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      รายการคำขอยื่นใบลาล่าสุดของนักเรียน ({studentLeaves.length} รายการ)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    เชื่อมต่อฐานข้อมูลงานกิจการนักเรียน & ห้องเรียน
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3 font-semibold">รหัสนักเรียน</th>
                        <th className="py-2.5 px-3 font-semibold">ชื่อ - นามสกุล</th>
                        <th className="py-2.5 px-3 font-semibold">ชั้นเรียน</th>
                        <th className="py-2.5 px-3 font-semibold">ประเภทการลา</th>
                        <th className="py-2.5 px-3 font-semibold">ช่วงวันที่</th>
                        <th className="py-2.5 px-3 font-semibold">เหตุผล</th>
                        <th className="py-2.5 px-3 font-semibold text-center">สถานะ</th>
                        <th className="py-2.5 px-3 font-semibold text-right">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentLeaves.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {req.studentCode}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {req.studentName}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {req.classroom}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              req.leaveType === 'ลาป่วย' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {req.leaveType} ({req.daysCount} วัน)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            {req.startDate} {req.startDate !== req.endDate ? `ถึง ${req.endDate}` : ''}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {req.status === 'APPROVED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ อนุมัติแล้ว
                              </span>
                            )}
                            {req.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                ⏳ รออนุมัติ
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                ✕ ไม่อนุมัติ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {req.status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveStudentLeaveAction(req.id, 'APPROVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                >
                                  อนุมัติ
                                </button>
                              )}
                              {req.status !== 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveStudentLeaveAction(req.id, 'REJECTED')}
                                  className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-medium cursor-pointer transition-colors"
                                >
                                  ปฏิเสธ
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: จัดการแบนเนอร์หน้านักเรียน & ครู 3 ส่วน (สิทธิ์ Admin เป็นผู้อัปโหลดเท่านั้น) */}
      {activeSettingsTab === 'BANNERS' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  จัดการแบนเนอร์หน้านักเรียน 3 ส่วน (Student Dashboard Banners)
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  เฉพาะแอดมินฝ่ายวิชาการ (Admin Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                อัปโหลดรูปภาพ ปรับเปลี่ยน และรีเซ็ตแบนเนอร์ทั้ง 3 จุดในหน้าแดชบอร์ดของนักเรียน เพื่อสร้างแรงบันดาลใจและประชาสัมพันธ์
              </p>
            </div>
          </div>

          {roleMode === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('ต้องการรีเซ็ตแบนเนอร์ทั้ง 3 ส่วนกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                  const res = studentBannerService.resetAllBanners(activeRole);
                  if (res.success) {
                    setStudentBanners(studentBannerService.getBanners());
                    showToast(res.message);
                  }
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              รีเซ็ตทั้ง 3 แบนเนอร์กลับค่าเริ่มต้น
            </button>
          )}
        </div>

        {roleMode !== 'ADMIN' ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <span>🔒 ส่วนนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้น ครูผู้สอนทั่วไปไม่สามารถแก้ไขหรืออัปโหลดแบนเนอร์ได้</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Banner 1: Hero Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    1. แบนเนอร์หลักกึ่งกลาง (Hero)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {studentBanners.hero.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {studentBanners.hero.locationLabel}
                </p>

                {/* Preview Image */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={studentBannerService.getEffectiveBannerUrl('hero')}
                    alt="Hero Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {studentBanners.hero.updatedAt}</span>
                  <span>{studentBanners.hero.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{bannerUploadingKey === 'hero' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={bannerUploadingKey === 'hero'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerUpload('hero', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {studentBanners.hero.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleBannerReset('hero')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>

            {/* Banner 2: Sidebar Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    2. แบนเนอร์เมนูข้าง (Sidebar)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {studentBanners.sidebar.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {studentBanners.sidebar.locationLabel}
                </p>

                {/* Preview Image */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={studentBannerService.getEffectiveBannerUrl('sidebar')}
                    alt="Sidebar Banner"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {studentBanners.sidebar.updatedAt}</span>
                  <span>{studentBanners.sidebar.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{bannerUploadingKey === 'sidebar' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={bannerUploadingKey === 'sidebar'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerUpload('sidebar', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {studentBanners.sidebar.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleBannerReset('sidebar')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>

            {/* Banner 3: Bottom Motivational Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    3. แบนเนอร์มุมขวาล่าง (Motivational)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {studentBanners.bottom.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {studentBanners.bottom.locationLabel}
                </p>

                {/* Preview Image */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={studentBannerService.getEffectiveBannerUrl('bottom')}
                    alt="Bottom Banner"
                    className="w-full h-auto max-h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {studentBanners.bottom.updatedAt}</span>
                  <span>{studentBanners.bottom.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{bannerUploadingKey === 'bottom' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={bannerUploadingKey === 'bottom'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerUpload('bottom', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {studentBanners.bottom.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleBannerReset('bottom')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section: จัดการแบนเนอร์หน้าครู 3 ส่วน (Teacher Dashboard Banners) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  จัดการแบนเนอร์หน้าครู 3 ส่วน (Teacher Dashboard Banners)
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  เฉพาะแอดมินฝ่ายวิชาการ (Admin Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                อัปโหลดรูปภาพ ปรับเปลี่ยน และรีเซ็ตแบนเนอร์ทั้ง 3 จุดในหน้าแดชบอร์ดของครู (แบนเนอร์หลัก Hero, เมนูข้าง Sidebar, และแนวนอนล่าง Bottom)
              </p>
            </div>
          </div>

          {roleMode === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('ต้องการรีเซ็ตแบนเนอร์หน้าครูทั้ง 3 ส่วนกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                  const res = teacherBannerService.resetAllBanners(activeRole);
                  if (res.success) {
                    setTeacherBanners(teacherBannerService.getBanners());
                    showToast(res.message);
                  }
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              รีเซ็ตทั้ง 3 แบนเนอร์หน้าครูกลับค่าเริ่มต้น
            </button>
          )}
        </div>

        {roleMode !== 'ADMIN' ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <span>🔒 ส่วนนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้น ครูผู้สอนทั่วไปไม่สามารถแก้ไขหรืออัปโหลดแบนเนอร์ได้</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Banner 1: Hero Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    1. แบนเนอร์หลักด้านบน (Hero Banner)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {teacherBanners.hero.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {teacherBanners.hero.locationLabel}
                </p>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={teacherBannerService.getEffectiveBannerUrl('hero')}
                    alt="Teacher Hero Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {teacherBanners.hero.updatedAt}</span>
                  <span>{teacherBanners.hero.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{teacherBannerUploadingKey === 'hero' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={teacherBannerUploadingKey === 'hero'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTeacherBannerUpload('hero', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {teacherBanners.hero.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleTeacherBannerReset('hero')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>

            {/* Banner 2: Sidebar Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    2. แบนเนอร์เมนูข้าง (Sidebar Banner)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {teacherBanners.sidebar.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {teacherBanners.sidebar.locationLabel}
                </p>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={teacherBannerService.getEffectiveBannerUrl('sidebar')}
                    alt="Teacher Sidebar Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {teacherBanners.sidebar.updatedAt}</span>
                  <span>{teacherBanners.sidebar.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{teacherBannerUploadingKey === 'sidebar' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={teacherBannerUploadingKey === 'sidebar'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTeacherBannerUpload('sidebar', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {teacherBanners.sidebar.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleTeacherBannerReset('sidebar')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>

            {/* Banner 3: Bottom Banner */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    3. แบนเนอร์แนวนอนล่าง (Bottom Banner)
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-500">
                    {teacherBanners.bottom.dimensionGuide}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {teacherBanners.bottom.locationLabel}
                </p>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center shadow-2xs">
                  <img
                    src={teacherBannerService.getEffectiveBannerUrl('bottom')}
                    alt="Teacher Bottom Banner"
                    className="w-full h-auto max-h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>🕒 {teacherBanners.bottom.updatedAt}</span>
                  <span>{teacherBanners.bottom.customUrl ? 'รูปภาพคัสตอม' : 'รูปเริ่มต้น'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{teacherBannerUploadingKey === 'bottom' ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={teacherBannerUploadingKey === 'bottom'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTeacherBannerUpload('bottom', file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {teacherBanners.bottom.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleTeacherBannerReset('bottom')}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    title="รีเซ็ตกลับเป็นภาพเริ่มต้น"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* TAB 3: พื้นที่จัดเก็บไฟล์ Cloudflare R2 & สำรองข้อมูลฐานข้อมูล / SGS Snapshot */}
      {activeSettingsTab === 'STORAGE' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              1. สถานะการใช้พื้นที่ Cloudflare R2 ของครูแต่ละคน & การโอนเก็บเข้า Google Drive โรงเรียน (100 TB Workspace)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พื้นที่ R2 ทั้งโรงเรียนใช้จริงรวม <strong>{totalSchoolR2Mb} MB</strong> (จากโควตาฟรี 10,240 MB) · คลิปวิดีโอขนาดใหญ่และงาน Canva ส่งเป็นลิงก์ (ใช้พื้นที่ 0 MB)
            </p>
          </div>

          {roleMode === 'ADMIN' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                    mode: 'TERM_ALL',
                    academicTerm: '1/2569',
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `☁️➡️📁 แอดมินโอนย้ายไฟล์ทั้งภาคเรียน 1/2569 (${res.backedUpCourseCount} วิชา · ${res.transferredMb} MB) เข้า Google Drive โรงเรียน (100 TB Workspace) แยกตามวิชาเรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs transition-colors"
              >
                ☁️➡️📁 Backup ทั้งเทอม 1/2569 เข้า Google Drive รร. (100TB)
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                    role: 'ADMIN',
                    currentTeacherId: 'admin',
                    mode: 'TERM_ALL',
                    academicTerm: '1/2569',
                    autoBackupToSchoolDriveFirst: true,
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `🧹 แอดมินล้างไฟล์ R2 ทั้งภาคเรียน 1/2569 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) พร้อม Backup เข้า Google Drive 100TB เรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-2xs transition-colors"
              >
                🧹 ล้างไฟล์ R2 ทั้งเทอม 1/2569
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                    role: 'ADMIN',
                    currentTeacherId: 'admin',
                    mode: 'YEAR_ALL',
                    academicYear: '2568',
                    autoBackupToSchoolDriveFirst: true,
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `🧹 แอดมินล้างไฟล์ R2 ปีการศึกษาเก่า 2568 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) เรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs transition-colors"
              >
                🧹 ล้างไฟล์ R2 ทั้งปีการศึกษา 2568
              </button>
            </div>
          )}
        </div>

        {/* การ์ดสรุปการใช้พื้นที่ของครูแต่ละคน */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teacherUsageSummaries
            .filter((t) => (roleMode === 'TEACHER' ? t.teacherId === 't-pasporm' : true))
            .map((t) => (
              <div
                key={t.teacherId}
                onClick={() =>
                  setSelectedTeacherFilter(
                    selectedTeacherFilter === t.teacherId ? 'ALL' : t.teacherId
                  )
                }
                className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1.5 ${
                  selectedTeacherFilter === t.teacherId
                    ? 'bg-teal-50/70 border-teal-400 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.teacherName}</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    {t.department}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-base font-bold text-teal-800 tabular-nums">
                      {t.totalR2Mb} MB
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1">
                      ({t.totalFiles} ไฟล์ R2)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700">
                    🎨 {t.totalCanvaLinks} ลิงก์ Canva
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span>จำนวน {t.courseCount} รายวิชา</span>
                  <span className="text-emerald-700 font-semibold">
                    Backup Drive รร. แล้ว {t.backedUpCourses}/{t.courseCount} วิชา
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* ตัวกรองและตารางรายวิชาทั้งหมด */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-bold text-slate-700">กรองตามภาคเรียน/ปีการศึกษา:</span>
            {(['ALL', '1/2569', '2/2568'] as const).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSelectedTermFilter(term)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedTermFilter === term
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {term === 'ALL' ? 'ทุกภาคเรียน' : `ภาคเรียน ${term}`}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            คลิกปุ่ม <strong>Backup Drive 100TB</strong> เพื่อโอนไฟล์เข้าโฟลเดอร์ Google Workspace โรงเรียนก่อนกดล้าง R2
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">ปี/เทอม</th>
                <th className="py-2.5 px-3">รหัส / รายวิชา / ชั้นเรียน</th>
                <th className="py-2.5 px-3">ครูผู้สอน</th>
                <th className="py-2.5 px-3 text-center">พื้นที่ R2 (รูป WebP/PDF)</th>
                <th className="py-2.5 px-3 text-center">ลิงก์ Canva / วิดีโอ</th>
                <th className="py-2.5 px-3">โฟลเดอร์สำรองใน Google Drive โรงเรียน (100 TB Workspace)</th>
                <th className="py-2.5 px-3 text-right">จัดการ (Backup / ล้าง R2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((c) => (
                <tr key={c.courseId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {c.academicTerm}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">
                      {c.courseCode} {c.courseName} ({c.classroom})
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                    {c.teacherName}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {c.isPurgedFromR2 ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[11px]">
                        0 MB (ล้าง R2 แล้ว)
                      </span>
                    ) : (
                      <div>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {c.r2UsedMb} MB
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">({c.r2FileCount} ไฟล์)</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                      🎨 {c.canvaLinkCount} ลิงก์ (0 MB)
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[11px] font-mono text-slate-600">
                      📁 {c.schoolDriveFolderPath}
                    </div>
                    {c.isBackedUpToSchoolDrive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                        ✓ สำรองเข้า Google Workspace 100TB แล้ว ({c.lastBackupAt})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-0.5">
                        • ยังไม่ได้โอนเข้า Google Drive โรงเรียน
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {!c.isBackedUpToSchoolDrive && !c.isPurgedFromR2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const res =
                              sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                                mode: 'SINGLE_COURSE',
                                courseId: c.courseId,
                              });
                            setCourseStorages(res.courses);
                            showToast(
                              `☁️➡️📁 โอนย้ายไฟล์วิชา ${c.courseCode} (${c.classroom}) เข้า Google Drive โรงเรียน (100TB) เรียบร้อยแล้ว`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px]"
                        >
                          Backup Drive 100TB
                        </button>
                      )}
                      {!c.isPurgedFromR2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                              role: roleMode,
                              currentTeacherId: 't-pasporm',
                              mode: 'SINGLE_COURSE',
                              courseId: c.courseId,
                              autoBackupToSchoolDriveFirst: true,
                            });
                            setCourseStorages(res.courses);
                            showToast(
                              `🧹 ล้างไฟล์ R2 วิชา ${c.courseCode} (${c.classroom}) คืนพื้นที่ ${res.freedMb} MB (พร้อม Backup เข้า Drive 100TB) เรียบร้อยแล้ว`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px]"
                        >
                          ล้างไฟล์วิชานี้
                        </button>
                      ) : (
                        <span className="text-[11px] text-teal-700 font-semibold">
                          ✓ คืนพื้นที่ R2 แล้ว
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: 3 Main Cards (SGS Snapshot & DB Backup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              ส่งออกข้อมูลคะแนน SGS (สพฐ.)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              สร้างไฟล์ Excel ส่งออกคะแนนเข้า SGS พร้อมจัดเก็บ Immutable Snapshot และลายเซ็น SHA-256
            </p>
          </div>

          <button
            onClick={handleExportSgs}
            disabled={isExporting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'กำลังสร้าง Snapshot...' : 'สร้างและดาวน์โหลด SGS Snapshot'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              สำรองฐานข้อมูลคะแนน (Database Snapshot)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              สำรองฐานข้อมูลคะแนนและเกรดใน PostgreSQL ถาวร แม้ล้างไฟล์รูปใน R2 ออกแล้ว คะแนนยังคงอยู่ครบ 100%
            </p>
          </div>

          <button
            onClick={handleBackupDb}
            disabled={isBackingUp}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สร้างจุดสำรองฐานข้อมูล'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              Google Workspace โรงเรียน (100 TB Shared Drive)
            </h2>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>เชื่อมต่อ Google Drive โรงเรียน (100 TB) สำเร็จ</span>
              </div>
              <p className="text-slate-500">
                จัดโฟลเดอร์อัตโนมัติ: ปีการศึกษา / เทอม / รหัสวิชา (ชื่อครู)
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              showToast('ตรวจสอบการเชื่อมต่อ Google Workspace Shared Drive (100 TB) ปกติ พร้อมรับไฟล์ Backup')
            }
            className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>ตรวจสอบสถานะ Google Drive 100TB</span>
          </button>
        </div>
      </div>

      {/* Immutable Snapshot Registry (ADR-003) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              คลังประวัติการส่งออก SGS & SAR Immutable Snapshots
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
            SHA-256 Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-2 px-3">Snapshot ID</th>
                <th className="py-2 px-3">ชื่อไฟล์</th>
                <th className="py-2 px-3">Cloud Storage Path</th>
                <th className="py-2 px-3">Checksum (SHA-256)</th>
                <th className="py-2 px-3">ผู้ส่งออก</th>
                <th className="py-2 px-3">วันเวลา</th>
                <th className="py-2 px-3 text-right">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{snap.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{snap.fileName}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{snap.storagePath}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{snap.checksumSha256.slice(0, 22)}...</td>
                  <td className="py-2.5 px-3 text-slate-600">{snap.exportedBy}</td>
                  <td className="py-2.5 px-3 text-slate-400">{snap.createdAt}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => showToast(`ดาวน์โหลด Snapshot: ${snap.fileName}`)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px]"
                    >
                      ดาวน์โหลด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Modal 1: สร้างปีการศึกษา / ภาคเรียนใหม่ */}
      {isCreateTermModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    สร้างปีการศึกษา / ภาคเรียนใหม่
                  </h3>
                  <p className="text-xs text-slate-400">
                    กำหนดปี พ.ศ. ภาคเรียน และวันเปิด-ปิดเทอม
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTermModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTermSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ปีการศึกษา (พ.ศ.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={2560}
                    max={2590}
                    value={newTermYear}
                    onChange={(e) => setNewTermYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ภาคเรียน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTermSemester}
                    onChange={(e) => setNewTermSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันเปิดเทอม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 15 พ.ค. 2570"
                    value={newTermStartDate}
                    onChange={(e) => setNewTermStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันปิดเทอม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 10 ต.ค. 2570"
                    value={newTermEndDate}
                    onChange={(e) => setNewTermEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หมายเหตุ / คำอธิบายเพิ่มเติม
                </label>
                <input
                  type="text"
                  placeholder="เช่น กำหนดการตามประกาศ สพฐ."
                  value={newTermNote}
                  onChange={(e) => setNewTermNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTermModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกภาคเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: แก้ไขวันเปิด-ปิดเทอม */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    แก้ไขวันเปิด-ปิดเทอม ({editingTerm.termName}/{editingTerm.year})
                  </h3>
                  <p className="text-xs text-slate-400">
                    ปรับเปลี่ยนช่วงเวลาทำการเรียนการสอนของภาคเรียนนี้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTerm(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTermDatesSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันเปิดเทอม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTerm.startDate}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันปิดเทอม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTerm.endDate}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  value={editingTerm.note || ''}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, note: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTerm(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: เพิ่มวันหยุดพิเศษ */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    เพิ่มวันหยุดพิเศษ
                  </h3>
                  <p className="text-xs text-slate-400">
                    วันหยุดราชการ วันหยุดพิเศษโรงเรียน และวันหยุดชดเชย
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHolidaySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อวันหยุด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วันหยุดพิเศษประจำโรงเรียน"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 15 ส.ค. 2569"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ประเภทวันหยุด
                  </label>
                  <select
                    value={newHolidayType}
                    onChange={(e) => setNewHolidayType(e.target.value as HolidayType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="GOVERNMENT">วันหยุดราชการ</option>
                    <option value="SCHOOL_SPECIAL">วันหยุดกรณีพิเศษโรงเรียน</option>
                    <option value="BRIDGE_DAY">วันหยุดชดเชย/กรณีพิเศษ</option>
                    <option value="RELIGIOUS">วันสำคัญทางศาสนา</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หมายเหตุ / คำสั่งโรงเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ประกาศวันหยุดตามมติคณะกรรมการบริหารสถานศึกษา"
                  value={newHolidayNote}
                  onChange={(e) => setNewHolidayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกวันหยุด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: เพิ่มวันมาเรียนพิเศษ เสาร์-อาทิตย์ */}
      {isAddWeekendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    เพิ่มวันมาเรียนพิเศษ (เสาร์-อาทิตย์)
                  </h3>
                  <p className="text-xs text-slate-400">
                    กำหนดวันเรียนชดเชย ค่ายติว หรือกิจกรรมเสริมหลักสูตร
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWeekendModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWeekendMakeupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หัวข้อวันเรียนพิเศษ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เรียนชดเชยวันเสาร์ (ชดเชยวันหยุดกิจกรรม)"
                  value={newWeekendTitle}
                  onChange={(e) => setNewWeekendTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 19 ก.ย. 2569"
                    value={newWeekendDate}
                    onChange={(e) => setNewWeekendDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันในสัปดาห์
                  </label>
                  <select
                    value={newWeekendDayOfWeek}
                    onChange={(e) => setNewWeekendDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="SATURDAY">วันเสาร์</option>
                    <option value="SUNDAY">วันอาทิตย์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผล / วัตถุประสงค์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เรียนชดเชยตามตารางวันศุกร์"
                  value={newWeekendReason}
                  onChange={(e) => setNewWeekendReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    กลุ่มเป้าหมาย / ระดับชั้น
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ทุกระดับชั้น (ม.1 - ม.6)"
                    value={newWeekendTarget}
                    onChange={(e) => setNewWeekendTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    จำนวนคาบเรียน
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newWeekendPeriods}
                    onChange={(e) => setNewWeekendPeriods(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชดเชยสำหรับวันที่ (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น วันหยุด 4 ก.ย. 2569"
                  value={newWeekendSubDate}
                  onChange={(e) => setNewWeekendSubDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWeekendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกวันเรียนพิเศษ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: เพิ่มประเภทโควตาวันลาใหม่ (Custom Leave Quota Type) */}
      {isAddQuotaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  เพิ่มประเภทโควตาวันลาใหม่
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddQuotaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomQuotaSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อประเภทการลา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ลาเข้าร่วมกิจกรรมภายนอก, ลาอบรมวิชาการ"
                  value={newQuotaName}
                  onChange={(e) => setNewQuotaName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    โควตาสูงสุด (วัน/เทอม) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={newQuotaDays}
                    onChange={(e) => setNewQuotaDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ยื่นล่วงหน้าอย่างน้อย (วัน)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={newQuotaNoticeDays}
                    onChange={(e) => setNewQuotaNoticeDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  คำอธิบาย / วัตถุประสงค์
                </label>
                <input
                  type="text"
                  placeholder="เช่น กรณีได้รับคัดเลือกเป็นตัวแทน หรือกรณีพิเศษ"
                  value={newQuotaDesc}
                  onChange={(e) => setNewQuotaDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  สีป้ายกำกับ
                </label>
                <select
                  value={newQuotaColor}
                  onChange={(e) => setNewQuotaColor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="bg-indigo-50 text-indigo-700 border-indigo-200">คราม (Indigo)</option>
                  <option value="bg-cyan-50 text-cyan-700 border-cyan-200">ฟ้าคราม (Cyan)</option>
                  <option value="bg-emerald-50 text-emerald-700 border-emerald-200">เขียว (Emerald)</option>
                  <option value="bg-amber-50 text-amber-700 border-amber-200">ส้ม (Amber)</option>
                  <option value="bg-rose-50 text-rose-700 border-rose-200">ชมพู/แดง (Rose)</option>
                  <option value="bg-purple-50 text-purple-700 border-purple-200">ม่วง (Purple)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newQuotaRequiresCert}
                    onChange={(e) => setNewQuotaRequiresCert(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>ต้องแนบเอกสารรับรอง / ใบรับรองแพทย์</span>
                </label>

                {newQuotaRequiresCert && (
                  <div className="flex items-center gap-2 pl-5 text-[11px] text-slate-600">
                    <span>หากลาติดต่อกันเกินกว่า:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newQuotaCertDays}
                      onChange={(e) => setNewQuotaCertDays(Number(e.target.value))}
                      className="w-16 px-2 py-0.5 rounded-lg border border-slate-300 bg-white text-center font-bold"
                    />
                    <span>วันขึ้นไป</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddQuotaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกโควตาใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
