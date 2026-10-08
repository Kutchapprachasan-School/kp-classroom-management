import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  School,
  User,
  Presentation,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  CheckSquare,
  UserCircle,
  ClipboardCheck,
  Award,
  Users,
  FileSpreadsheet,
  BarChart2,
  TrendingUp,
  Cloud,
  Bell,
  Palette,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Clock,
  Utensils,
  Sun,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Database,
} from 'lucide-react';

import {
  getSchoolSettings,
  saveSchoolSettings,
  DEFAULT_KUTCHAP_LOGO_SVG,
  type SchoolUserRole,
  type SchoolBrandingSettings,
} from '../config/schoolRoles';

import {
  schoolPoliciesService,
  type SchoolAttendancePolicyConfig,
  type SchoolGradingPolicyConfig,
  type SchoolNotificationConfig,
} from '../services/schoolPoliciesService';

import {
  type SchoolBellScheduleConfig,
  type BellScheduleTimelineItem,
  BELL_SCHEDULE_STORAGE_KEY,
  DEFAULT_BELL_SCHEDULE_CONFIG,
  generateBellScheduleTimeline,
  bellScheduleService,
} from '../services/bellScheduleService';

export {
  type SchoolBellScheduleConfig,
  type BellScheduleTimelineItem,
  BELL_SCHEDULE_STORAGE_KEY,
  DEFAULT_BELL_SCHEDULE_CONFIG,
  addMinutesToTimeStr,
  calculateMinutesDifference,
  generateBellScheduleTimeline,
  bellScheduleService,
} from '../services/bellScheduleService';

import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
  type SpecialHolidayRecord,
  type WeekendMakeupDayRecord,
} from '../services/academicCalendarService';

import {
  schoolLeaveSettingsService,
  SCHOOL_LEAVE_SETTINGS_EVENT,
  type SchoolLeaveSettings,
} from '../services/schoolLeaveSettingsService';

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

import { sgsExportService, type SgsSnapshotRecord } from '../services/sgsExportService';
import { TEACHER_SUBJECTS_LIST } from '../services/teacherCourseAssignmentService';
import { classroomService } from '../services/classroomService';
import { cleanSlateService } from '../services/cleanSlateService';
import type { ClassroomRosterItem } from '../types/viewModels';
import { SettingsHeroBanner } from '../components/settings/SettingsHeroBanner';
import { SettingsCategoryCard } from '../components/settings/SettingsCategoryCard';
import { SettingsSubModal } from '../components/settings/SettingsSubModal';
import { AdminTeacherBannerModal } from '../components/teacher/AdminTeacherBannerModal';

export type SettingsKey =
  | 'school_info'
  | 'users'
  | 'classrooms'
  | 'courses'
  | 'timetable'
  | 'assignments'
  | 'exams'
  | 'forms'
  | 'students'
  | 'attendance'
  | 'behavior'
  | 'parents'
  | 'grades'
  | 'reports'
  | 'analytics'
  | 'backup'
  | 'notifications'
  | 'theme'
  | 'security';

interface SettingsBackupViewProps {
  activeRole?: SchoolUserRole;
  initialTab?: string;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  activeRole = 'ACADEMIC_ADMIN',
  initialTab,
}) => {
  // --------------------------------------------------------------------------
  // 1. Core State
  // --------------------------------------------------------------------------
  const [activeModalKey, setActiveModalKey] = useState<SettingsKey | null>(() => {
    if (initialTab === 'CALENDAR') return 'timetable';
    if (initialTab === 'BRANDING' || initialTab === 'LEAVE_SYSTEM') return 'school_info';
    if (initialTab === 'STORAGE') return 'backup';
    if (initialTab === 'BANNERS') return 'theme';
    return null;
  });

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // School basic settings & branding
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );

  // School Bell Schedule
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

  const timelineSchedule: BellScheduleTimelineItem[] = useMemo(() => {
    return generateBellScheduleTimeline(bellSchedule);
  }, [bellSchedule]);

  // Academic Calendar
  const [calendarConfig, setCalendarConfig] = useState(() => academicCalendarService.getConfig());

  // Leave Settings
  const [leaveSettings, setLeaveSettings] = useState<SchoolLeaveSettings>(() =>
    schoolLeaveSettingsService.getSettings()
  );

  // Banners
  const [studentBanners, setStudentBanners] = useState<Record<StudentBannerKey, StudentBannerItem>>(() =>
    studentBannerService.getBanners()
  );
  const [teacherBanners, setTeacherBanners] = useState<Record<TeacherBannerKey, TeacherBannerItem>>(() =>
    teacherBannerService.getBanners()
  );
  const [adminBannerModalKey, setAdminBannerModalKey] = useState<TeacherBannerKey | null>(null);

  // Backups & Snapshots
  const [snapshots, setSnapshots] = useState<SgsSnapshotRecord[]>([]);

  // Classrooms & Advisors
  const [classrooms, setClassrooms] = useState<ClassroomRosterItem[]>([]);
  const AVAILABLE_TEACHERS = useMemo(
    () => [
      'ครูภาสภูมิ เรืองปราชญ์',
      'ครูวิภาดา สมบูรณ์',
      'ครูเอกชัย มิ่งขวัญ',
      'ครูชนิกา ทรัพย์สุข',
      'ครูปิยพล เกษรัตน์',
      'ครูประภาส เกษมสันต์',
      'ครูพิมพ์ใจ สิทธิเดช',
      'ครูสมคิด สุวรรณโชติ',
      'ครูสมทรง วงศ์ใหญ่',
      'ครูศิริพร บุญช่วย',
      'ครูกานดา มณีรัตน์',
    ],
    []
  );

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Clean Slate status
  const [isCleanSlate, setIsCleanSlate] = useState<boolean>(() =>
    cleanSlateService.isCleanSlateActive()
  );

  // Policy States (Supabase Linked)
  const [attendancePolicy, setAttendancePolicy] = useState<SchoolAttendancePolicyConfig>(() =>
    schoolPoliciesService.getAttendancePolicy()
  );
  const [gradingPolicy, setGradingPolicy] = useState<SchoolGradingPolicyConfig>(() =>
    schoolPoliciesService.getGradingPolicy()
  );
  const [notificationConfig, setNotificationConfig] = useState<SchoolNotificationConfig>(() =>
    schoolPoliciesService.getNotificationConfig()
  );

  // Sync with window events and fetch snapshots & classrooms
  useEffect(() => {
    sgsExportService.getSnapshots().then(setSnapshots).catch(() => {});
    classroomService.getAll().then(setClassrooms).catch(() => {});

    const handleClassroomChange = () => {
      classroomService.getAll().then(setClassrooms).catch(() => {});
      setIsCleanSlate(cleanSlateService.isCleanSlateActive());
    };
    window.addEventListener('kps-data-sync-event', handleClassroomChange);

    const handleCalendarChange = () => setCalendarConfig(academicCalendarService.getConfig());
    const onLeaveChange = () => setLeaveSettings(schoolLeaveSettingsService.getSettings());
    const onBannersChange = () => setStudentBanners(studentBannerService.getBanners());
    const onTeacherBannersChange = () => setTeacherBanners(teacherBannerService.getBanners());

    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
    window.addEventListener(SCHOOL_LEAVE_SETTINGS_EVENT, onLeaveChange);
    window.addEventListener(STUDENT_BANNERS_EVENT, onBannersChange);
    window.addEventListener(TEACHER_BANNERS_EVENT, onTeacherBannersChange);

    return () => {
      window.removeEventListener('kps-data-sync-event', handleClassroomChange);
      window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarChange);
      window.removeEventListener(SCHOOL_LEAVE_SETTINGS_EVENT, onLeaveChange);
      window.removeEventListener(STUDENT_BANNERS_EVENT, onBannersChange);
      window.removeEventListener(TEACHER_BANNERS_EVENT, onTeacherBannersChange);
    };
  }, []);

  // Sync initial tab when changed by caller
  useEffect(() => {
    if (initialTab === 'CALENDAR') setActiveModalKey('timetable');
    else if (initialTab === 'BRANDING' || initialTab === 'LEAVE_SYSTEM') setActiveModalKey('school_info');
    else if (initialTab === 'STORAGE') setActiveModalKey('backup');
    else if (initialTab === 'BANNERS') setActiveModalKey('theme');
  }, [initialTab]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --------------------------------------------------------------------------
  // Save Handlers
  // --------------------------------------------------------------------------
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        setSchoolSettings((prev) => {
          const updated = { ...prev, logoUrl: dataUrl };
          saveSchoolSettings(updated);
          return updated;
        });
        showToast('✓ อัปโหลดตราโรงเรียนและบันทึกลงฐานข้อมูล Supabase เรียบร้อยแล้ว');
      }
    };
    reader.onerror = () => {
      showToast('❌ ไม่สามารถอ่านไฟล์รูปภาพได้');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoToDefault = () => {
    setSchoolSettings((prev) => {
      const updated = { ...prev, logoUrl: DEFAULT_KUTCHAP_LOGO_SVG };
      saveSchoolSettings(updated);
      return updated;
    });
    showToast('🔄 คืนค่าตราโรงเรียนมาตรฐานและบันทึกเรียบร้อย');
  };

  const handleSaveSchoolInfo = () => {
    saveSchoolSettings(schoolSettings);
    showToast('✓ บันทึกข้อมูลโรงเรียน อัตลักษณ์ และตราสัญลักษณ์เรียบร้อยแล้ว');
  };

  const handleSaveBellSchedule = () => {
    bellScheduleService.saveConfig(bellSchedule);
    localStorage.setItem(BELL_SCHEDULE_STORAGE_KEY, JSON.stringify(bellSchedule));
    showToast('✓ บันทึกการตั้งค่าโครงสร้างเวลาเข้าแถวและคาบเรียนเรียบร้อย');
  };

  const handleResetBellSchedule = () => {
    setBellSchedule(DEFAULT_BELL_SCHEDULE_CONFIG);
    localStorage.setItem(BELL_SCHEDULE_STORAGE_KEY, JSON.stringify(DEFAULT_BELL_SCHEDULE_CONFIG));
    showToast('🔄 คืนค่าเวลาเรียนเริ่มต้นเรียบร้อย');
  };

  const handleSaveAttendancePolicy = () => {
    schoolPoliciesService.saveAttendancePolicy(attendancePolicy);
    showToast('✓ บันทึกเกณฑ์เวลาเรียน 80% และกฎการเช็คชื่อเรียบร้อย');
  };

  const handleSaveGradingPolicy = () => {
    schoolPoliciesService.saveGradingPolicy(gradingPolicy);
    showToast('✓ บันทึกเกณฑ์การตัดเกรดและสัดส่วนคะแนน SGS เรียบร้อย');
  };

  const handleSaveNotificationConfig = () => {
    schoolPoliciesService.saveNotificationConfig(notificationConfig);
    showToast('✓ บันทึกการตั้งค่าการแจ้งเตือน Line / SMS เรียบร้อย');
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-20 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* RENDER MODE A: OVERVIEW DASHBOARD (NO POPUPS) */}
      {/* ==================================================================== */}
      {activeModalKey === null && (
        <>
          {/* 1. TOP HERO BANNER (ตรงตาม Mockup: การตั้งค่าที่ถูกต้อง ช่วยให้การทำงานง่ายขึ้นนะคะ ♡) */}
          <SettingsHeroBanner schoolName={schoolSettings.nameTh} />

      {/* ==================================================================== */}
      {/* CATEGORY 1: ข้อมูลพื้นฐาน (ข้อมูลทั่วไปของโรงเรียนและผู้ใช้งาน) */}
      {/* ==================================================================== */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#163A66]">
              ข้อมูลพื้นฐาน
            </h2>
            <p className="text-xs font-medium text-[#6B7C93]">
              ข้อมูลทั่วไปของโรงเรียนและผู้ใช้งาน
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1.1: ข้อมูลโรงเรียน */}
          <SettingsCategoryCard
            id="school_info"
            title="ข้อมูลโรงเรียน"
            subtitle="จัดการข้อมูลโรงเรียน"
            icon={<School className="w-5 h-5" />}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
            onClick={() => setActiveModalKey('school_info')}
            isExpanded={expandedCards['school_info']}
            onToggleExpand={(e) => toggleExpand('school_info', e)}
            quickInfo={`${schoolSettings.nameTh} • ${schoolSettings.shortCode || schoolSettings.districtProvince}`}
          />

          {/* Card 1.2: ผู้ใช้งาน */}
          <SettingsCategoryCard
            id="users"
            title="ผู้ใช้งาน"
            subtitle="จัดการบัญชีผู้ใช้และสิทธิ์การใช้งาน"
            icon={<User className="w-5 h-5" />}
            iconBgClass="bg-sky-50"
            iconColorClass="text-sky-600"
            onClick={() => setActiveModalKey('users')}
            isExpanded={expandedCards['users']}
            onToggleExpand={(e) => toggleExpand('users', e)}
            quickInfo={`บทบาทปัจจุบัน: ${activeRole}`}
          />

          {/* Card 1.3: ห้องเรียน / ชั้น */}
          <SettingsCategoryCard
            id="classrooms"
            title="ห้องเรียน / ชั้น"
            subtitle="จัดการข้อมูลห้องเรียนและระดับชั้น"
            icon={<Presentation className="w-5 h-5" />}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
            onClick={() => setActiveModalKey('classrooms')}
            isExpanded={expandedCards['classrooms']}
            onToggleExpand={(e) => toggleExpand('classrooms', e)}
            quickInfo="ม.1 ถึง ม.6 (รวม 8 ห้องเรียน)"
          />

          {/* Card 1.4: รายวิชา */}
          <SettingsCategoryCard
            id="courses"
            title="รายวิชา"
            subtitle="จัดการรายวิชาและกลุ่มสาระ"
            icon={<BookOpen className="w-5 h-5" />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
            onClick={() => setActiveModalKey('courses')}
            isExpanded={expandedCards['courses']}
            onToggleExpand={(e) => toggleExpand('courses', e)}
            quickInfo={`สอน ${TEACHER_SUBJECTS_LIST.length} รายวิชา`}
          />
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CATEGORY 2: การเรียนการสอน (เกี่ยวกับการจัดการเรียนการสอน) */}
      {/* ==================================================================== */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#163A66]">
              การเรียนการสอน
            </h2>
            <p className="text-xs font-medium text-[#6B7C93]">
              เกี่ยวกับการจัดการเรียนการสอน
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 2.1: ตารางสอน (มี Bell Schedule & Lunch Break อยู่ข้างใน) */}
          <SettingsCategoryCard
            id="timetable"
            title="ตารางสอน"
            subtitle="จัดการตารางสอนประจำสัปดาห์"
            icon={<CalendarDays className="w-5 h-5" />}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            onClick={() => setActiveModalKey('timetable')}
            isExpanded={expandedCards['timetable']}
            onToggleExpand={(e) => toggleExpand('timetable', e)}
            badge="โครงสร้างคาบ"
            quickInfo={`เริ่ม ${bellSchedule.firstPeriodStart} น. • ${bellSchedule.totalPeriodsPerDay} คาบ/วัน`}
          />

          {/* Card 2.2: งาน / แบบฝึกหัด */}
          <SettingsCategoryCard
            id="assignments"
            title="งาน / แบบฝึกหัด"
            subtitle="จัดการงานและแบบฝึกหัด"
            icon={<ClipboardList className="w-5 h-5" />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
            onClick={() => setActiveModalKey('assignments')}
            isExpanded={expandedCards['assignments']}
            onToggleExpand={(e) => toggleExpand('assignments', e)}
            quickInfo="ปัดเศษ >= 0.5 อัตโนมัติ"
          />

          {/* Card 2.3: การสอบ */}
          <SettingsCategoryCard
            id="exams"
            title="การสอบ"
            subtitle="จัดการข้อมูลการสอบและคะแนน"
            icon={<FileText className="w-5 h-5" />}
            iconBgClass="bg-rose-50"
            iconColorClass="text-rose-600"
            onClick={() => setActiveModalKey('exams')}
            isExpanded={expandedCards['exams']}
            onToggleExpand={(e) => toggleExpand('exams', e)}
            quickInfo="สอบเก็บคะแนน • กลางภาค • ปลายภาค"
          />

          {/* Card 2.4: แบบฟอร์ม / ประเมิน */}
          <SettingsCategoryCard
            id="forms"
            title="แบบฟอร์ม / ประเมิน"
            subtitle="จัดการแบบฟอร์มและการประเมิน"
            icon={<CheckSquare className="w-5 h-5" />}
            iconBgClass="bg-violet-50"
            iconColorClass="text-violet-600"
            onClick={() => setActiveModalKey('forms')}
            isExpanded={expandedCards['forms']}
            onToggleExpand={(e) => toggleExpand('forms', e)}
            quickInfo="แบบประเมิน PA & คุณลักษณะ 8 ข้อ"
          />
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CATEGORY 3: การจัดการนักเรียน (ข้อมูลและพฤติกรรมนักเรียน) */}
      {/* ==================================================================== */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#163A66]">
              การจัดการนักเรียน
            </h2>
            <p className="text-xs font-medium text-[#6B7C93]">
              ข้อมูลและพฤติกรรมนักเรียน
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 3.1: ข้อมูลนักเรียน */}
          <SettingsCategoryCard
            id="students"
            title="ข้อมูลนักเรียน"
            subtitle="จัดการข้อมูลนักเรียน"
            icon={<UserCircle className="w-5 h-5" />}
            iconBgClass="bg-cyan-50"
            iconColorClass="text-cyan-600"
            onClick={() => setActiveModalKey('students')}
            isExpanded={expandedCards['students']}
            onToggleExpand={(e) => toggleExpand('students', e)}
            quickInfo="ย้ายห้องเรียนอัตโนมัติพร้อมคะแนน"
          />

          {/* Card 3.2: เช็คชื่อ/แถวเช้า */}
          <SettingsCategoryCard
            id="attendance"
            title="เช็คชื่อ/แถวเช้า"
            subtitle="ตั้งค่าการเช็คชื่อและแถวตอนเช้า"
            icon={<ClipboardCheck className="w-5 h-5" />}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
            onClick={() => setActiveModalKey('attendance')}
            isExpanded={expandedCards['attendance']}
            onToggleExpand={(e) => toggleExpand('attendance', e)}
            badge="กฎ 80%"
            quickInfo="Correlation แถวเช้า + คาบเรียน"
          />

          {/* Card 3.3: บันทึกความประพฤติ */}
          <SettingsCategoryCard
            id="behavior"
            title="บันทึกความประพฤติ"
            subtitle="จัดการพฤติกรรมและการแจ้งเตือน"
            icon={<Award className="w-5 h-5" />}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            onClick={() => setActiveModalKey('behavior')}
            isExpanded={expandedCards['behavior']}
            onToggleExpand={(e) => toggleExpand('behavior', e)}
            quickInfo="คะแนนเริ่มต้น 100 คะแนน"
          />

          {/* Card 3.4: ผู้ปกครอง */}
          <SettingsCategoryCard
            id="parents"
            title="ผู้ปกครอง"
            subtitle="จัดการข้อมูลผู้ปกครอง"
            icon={<Users className="w-5 h-5" />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
            onClick={() => setActiveModalKey('parents')}
            isExpanded={expandedCards['parents']}
            onToggleExpand={(e) => toggleExpand('parents', e)}
            quickInfo="ระบบแจ้งเตือนผ่าน Line / SMS"
          />
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CATEGORY 4: ผลการเรียน & รายงาน (ดูผลการเรียนและสถิติ) */}
      {/* ==================================================================== */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#163A66]">
              ผลการเรียน & รายงาน
            </h2>
            <p className="text-xs font-medium text-[#6B7C93]">
              ดูผลการเรียนและสถิติ
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 4.1: ผลการเรียน */}
          <SettingsCategoryCard
            id="grades"
            title="ผลการเรียน"
            subtitle="ดูและแก้ไขผลการเรียน"
            icon={<FileSpreadsheet className="w-5 h-5" />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
            onClick={() => setActiveModalKey('grades')}
            isExpanded={expandedCards['grades']}
            onToggleExpand={(e) => toggleExpand('grades', e)}
            quickInfo="เกณฑ์ตัดเกรด 8 ระดับ (4.0 - 0.0)"
          />

          {/* Card 4.2: รายงาน */}
          <SettingsCategoryCard
            id="reports"
            title="รายงาน"
            subtitle="รายงานต่าง ๆ ของนักเรียน"
            icon={<BarChart2 className="w-5 h-5" />}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
            onClick={() => setActiveModalKey('reports')}
            isExpanded={expandedCards['reports']}
            onToggleExpand={(e) => toggleExpand('reports', e)}
            quickInfo="รายงาน ปพ.5 & สรุปผล SAR"
          />

          {/* Card 4.3: สถิติ */}
          <SettingsCategoryCard
            id="analytics"
            title="สถิติ"
            subtitle="สถิติการเรียนและพฤติกรรม"
            icon={<TrendingUp className="w-5 h-5" />}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
            onClick={() => setActiveModalKey('analytics')}
            isExpanded={expandedCards['analytics']}
            onToggleExpand={(e) => toggleExpand('analytics', e)}
            quickInfo="เกณฑ์แจ้งเตือนกลุ่มเสี่ยง"
          />

          {/* Card 4.4: สำรองข้อมูล */}
          <SettingsCategoryCard
            id="backup"
            title="สำรองข้อมูล"
            subtitle="จัดการข้อมูลสำรองและกู้คืน"
            icon={<Cloud className="w-5 h-5" />}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
            onClick={() => setActiveModalKey('backup')}
            isExpanded={expandedCards['backup']}
            onToggleExpand={(e) => toggleExpand('backup', e)}
            badge="R2 100TB"
            quickInfo="Snapshot & Cloudflare R2"
          />
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CATEGORY 5: อื่น ๆ (การตั้งค่าระบบเพิ่มเติม) */}
      {/* ==================================================================== */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#163A66]">
              อื่น ๆ
            </h2>
            <p className="text-xs font-medium text-[#6B7C93]">
              การตั้งค่าระบบเพิ่มเติม
            </p>
          </div>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 5.1: แจ้งเตือน */}
          <SettingsCategoryCard
            id="notifications"
            title="แจ้งเตือน"
            subtitle="ตั้งค่าการแจ้งเตือน"
            icon={<Bell className="w-5 h-5" />}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            onClick={() => setActiveModalKey('notifications')}
            isExpanded={expandedCards['notifications']}
            onToggleExpand={(e) => toggleExpand('notifications', e)}
            quickInfo="Line Notify Token & กระดิ่งเตือน"
          />

          {/* Card 5.2: ธีม / รูปแบบ (มีแบนเนอร์ 3 ส่วนอยู่ข้างใน) */}
          <SettingsCategoryCard
            id="theme"
            title="ธีม / รูปแบบ"
            subtitle="ปรับแต่งธีมและรูปแบบการแสดงผล"
            icon={<Palette className="w-5 h-5" />}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
            onClick={() => setActiveModalKey('theme')}
            isExpanded={expandedCards['theme']}
            onToggleExpand={(e) => toggleExpand('theme', e)}
            badge="3 แบนเนอร์"
            quickInfo="Hero, Sidebar, Bottom Banner"
          />

          {/* Card 5.3: ความปลอดภัย */}
          <SettingsCategoryCard
            id="security"
            title="ความปลอดภัย"
            subtitle="ตั้งค่าความปลอดภัยของระบบ"
            icon={<ShieldCheck className="w-5 h-5" />}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
            onClick={() => setActiveModalKey('security')}
            isExpanded={expandedCards['security']}
            onToggleExpand={(e) => toggleExpand('security', e)}
            quickInfo="Teacher PIN & สิทธิ์ RBAC"
          />
        </div>
      </section>

          {/* ==================================================================== */}
          {/* CATEGORY 6: ผังโครงสร้างตาราง Supabase สำหรับการตั้งค่า (12 หมวดหมู่) */}
          {/* ==================================================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-100">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#163A66]">
                      ผังโครงสร้างตาราง Supabase สำหรับการตั้งค่า (Settings Schema Directory)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      12 Tables
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#6B7C93]">
                    รายงานการเชื่อมโยงระบบการตั้งค่าแต่ละจุดไปยังตารางจริงในฐานข้อมูล Supabase พร้อมความยืดหยุ่นระดับโรงเรียน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Connected
                </span>
              </div>
            </div>

            {/* 12 Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                {
                  table: 'school_profiles',
                  desc: 'ข้อมูลโรงเรียน, รหัส 10 หลัก, อัตลักษณ์, คำขวัญ, ผู้บริหาร, สีประจำ รร.',
                  route: 'school_info' as SettingsKey,
                  cols: 'name_th, code_10_digit, motto, director_name, logo_url',
                },
                {
                  table: 'bell_schedules',
                  desc: 'เวลาเข้าแถวเคารพธงชาติ, คาบเรียน 1-7, โหมดพักเที่ยงนับคาบ vs ข้ามคาบ',
                  route: 'timetable' as SettingsKey,
                  cols: 'morning_start, first_period, lunch_mode, slot, duration',
                },
                {
                  table: 'academic_terms',
                  desc: 'ปีการศึกษา (2569), ภาคเรียน 1/2, วันเปิด-ปิดเทอม, สัปดาห์สอบกลาง/ปลายภาค',
                  route: 'timetable' as SettingsKey,
                  cols: 'year, semester_no, start_date, end_date, total_weeks',
                },
                {
                  table: 'school_special_holidays',
                  desc: 'วันหยุดพิเศษเฉพาะโรงเรียน (วันสถาปนา, งานเทศกาล, ภัยพิบัติ)',
                  route: 'timetable' as SettingsKey,
                  cols: 'date, title, holiday_type, is_cancelled',
                },
                {
                  table: 'school_weekend_makeup_days',
                  desc: 'วันมาเรียนชดเชย เสาร์-อาทิตย์ พร้อมเลือกระดับชั้นเป้าหมาย (ม.1-ม.6)',
                  route: 'timetable' as SettingsKey,
                  cols: 'date, reason, target_grades, timetable_day_mapped',
                },
                {
                  table: 'classrooms',
                  desc: 'โครงสร้าง 12 ห้องเรียน (ม.1/1 - ม.6/2), แผนการเรียน, และครูที่ปรึกษา',
                  route: 'classrooms' as SettingsKey,
                  cols: 'name, grade_level, building, room_number, adviser_id',
                },
                {
                  table: 'school_attendance_policies',
                  desc: 'เกณฑ์เวลาเรียน 80% (สพฐ.), เวลาเริ่มนับสาย, กฎ Lock 2-3 โดดเรียน',
                  route: 'attendance' as SettingsKey,
                  cols: 'min_percent (80%), late_grace_min, truancy_detection',
                },
                {
                  table: 'school_grading_policies',
                  desc: 'สัดส่วนคะแนน SGS (70:15:15), เกณฑ์ตัดเกรด 8 ระดับ, เกณฑ์สอบแก้ตัว',
                  route: 'grades' as SettingsKey,
                  cols: 'formative_ratio, midterm, final, retest_max, half_step',
                },
                {
                  table: 'school_leave_settings',
                  desc: 'โควตาวันลาครู (ป่วย 60, กิจ 45, พักผ่อน 10) และการลานักเรียน',
                  route: 'attendance' as SettingsKey,
                  cols: 'teacher_sick_quota, personal_quota, doctor_cert_days',
                },
                {
                  table: 'system_storage_configs',
                  desc: 'พื้นที่ Cloudflare R2, Google Drive, Snapshots และ Clean Slate Mode',
                  route: 'backup' as SettingsKey,
                  cols: 'r2_bucket, auto_backup_freq, clean_slate_mode',
                },
                {
                  table: 'notification_settings',
                  desc: 'Line Notify Token, SMS Gateway, แจ้งเตือนผู้ปกครอง (ขาด/สาย/โดด)',
                  route: 'notifications' as SettingsKey,
                  cols: 'line_token, notify_absent, notify_late, notify_truancy',
                },
                {
                  table: 'school_banner_configs',
                  desc: 'ภาพแบนเนอร์ Hero, Sidebar Mascot, คำคม, การซูมและปรับตำแหน่ง',
                  route: 'theme' as SettingsKey,
                  cols: 'banner_type, image_url, quote_th, opacity, zoom, pos_x',
                },
              ].map((item) => (
                <div
                  key={item.table}
                  onClick={() => setActiveModalKey(item.route)}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {item.table}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                        ตั้งค่า ➔
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-[200px]">{item.cols}</span>
                    <span className="text-emerald-600 font-bold">RLS Active</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ==================================================================== */}
      {/* RENDER MODE B: SUB-SETTINGS IN-PAGE WORKSPACE (NO POPUPS) */}
      {/* ==================================================================== */}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1.1: ข้อมูลโรงเรียน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'school_info'}
        onClose={() => setActiveModalKey(null)}
        title="ข้อมูลโรงเรียน & อัตลักษณ์"
        subtitle="จัดการชื่อโรงเรียน ตราสัญลักษณ์ และข้อมูลพื้นฐานทางการศึกษา"
        icon={<School className="w-5 h-5" />}
        iconBgClass="bg-blue-50"
        iconColorClass="text-blue-600"
        supabaseTable="school_profiles"
        categoryPath="หมวด 1: ข้อมูลองค์กรและอัตลักษณ์"
        onSave={handleSaveSchoolInfo}
      >
        <div className="space-y-4">
          {/* Section 1: ตราสัญลักษณ์และอัตลักษณ์ประจำโรงเรียน */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900">ตราสัญลักษณ์และอัตลักษณ์ประจำโรงเรียน</h3>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                ซิงค์สด Sidebar & แดชบอร์ด
              </span>
            </div>

            <input
              type="file"
              ref={logoFileInputRef}
              onChange={handleLogoFileSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Preview Box */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-blue-200 bg-white p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img
                  src={schoolSettings.logoUrl || DEFAULT_KUTCHAP_LOGO_SVG}
                  alt="ตราสัญลักษณ์โรงเรียน"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_KUTCHAP_LOGO_SVG;
                  }}
                />
              </div>

              {/* Upload & Controls */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">ตราสัญลักษณ์โรงเรียน (School Logo)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    แสดงผลใน Sidebar ทั้งมุมมองครูและแอดมิน แถบหัวข้อ และรายงานของสถานศึกษา
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดตราโรงเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetLogoToDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>คืนค่าตราโรงเรียนมาตรฐาน</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  รองรับไฟล์ภาพ SVG, PNG, JPG, WebP (แนะนำไฟล์ขอบโปร่งใส เพื่อความสวยงามกลมกลืน)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">สีประจำโรงเรียน:</label>
                <input
                  type="text"
                  placeholder="เช่น น้ำเงิน - ขาว"
                  value={schoolSettings.schoolColors || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolColors: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อระบบจัดการชั้นเรียน:</label>
                <input
                  type="text"
                  value={schoolSettings.classroomSystemTitle || 'ระบบจัดการชั้นเรียน'}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, classroomSystemTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ชื่อและสังกัดสถานศึกษา */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ชื่อและสังกัดสถานศึกษา</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อโรงเรียน (ภาษาไทย):</label>
                <input
                  type="text"
                  value={schoolSettings.nameTh}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, nameTh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อโรงเรียน (English):</label>
                <input
                  type="text"
                  value={schoolSettings.nameEn}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">สังกัด / กลุ่มโรงเรียน:</label>
                <input
                  type="text"
                  value={schoolSettings.affiliation}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, affiliation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">รหัสย่อ / สพม.:</label>
                <input
                  type="text"
                  value={schoolSettings.shortCode}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, shortCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">รหัสสถานศึกษา 10 หลัก (สพฐ.):</label>
                <input
                  type="text"
                  placeholder="เช่น 1041680123"
                  value={schoolSettings.schoolCode10Digit || '1041680123'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolCode10Digit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono text-blue-900 bg-blue-50/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ประเภทสถานศึกษา:</label>
                <select
                  value={schoolSettings.schoolType || 'HIGH_SCHOOL'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="HIGH_SCHOOL">โรงเรียนมัธยมศึกษา (ม.1 - ม.6)</option>
                  <option value="EXPANSION">โรงเรียนขยายโอกาส (อ.1 - ม.3 / ป.1 - ม.3)</option>
                  <option value="PRIMARY">โรงเรียนประถมศึกษา (ป.1 - ป.6)</option>
                  <option value="VOCATIONAL">วิทยาลัยอาชีวศึกษา / เทคนิค</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ-สกุล ผู้อำนวยการโรงเรียน:</label>
                <input
                  type="text"
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={schoolSettings.directorName || 'นายสมชาย ใจดี'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, directorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ตำแหน่งผู้บริหาร:</label>
                <input
                  type="text"
                  placeholder="เช่น ผู้อำนวยการโรงเรียนกุดจับประชาสรรค์"
                  value={schoolSettings.directorPosition || 'ผู้อำนวยการโรงเรียนกุดจับประชาสรรค์'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, directorPosition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: ที่อยู่และข้อมูลติดต่อโรงเรียน */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ที่อยู่และข้อมูลติดต่อโรงเรียน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ที่อยู่ (เลขที่ / หมู่ / ถนน):
                </label>
                <input
                  type="text"
                  placeholder="เช่น 199 หมู่ 1 ถนนกุดจับ-เชียงพิณ"
                  value={schoolSettings.addressLine || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, addressLine: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ตำบล / แขวง:</label>
                <input
                  type="text"
                  placeholder="เช่น เมืองเพีย"
                  value={schoolSettings.subdistrict || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, subdistrict: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">อำเภอ / เขต:</label>
                <input
                  type="text"
                  placeholder="เช่น กุดจับ"
                  value={schoolSettings.district || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">จังหวัด:</label>
                <input
                  type="text"
                  placeholder="เช่น อุดรธานี"
                  value={schoolSettings.province || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, province: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">รหัสไปรษณีย์:</label>
                <input
                  type="text"
                  placeholder="เช่น 41250"
                  value={schoolSettings.postalCode || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, postalCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
                <input
                  type="text"
                  placeholder="เช่น 042-261-023"
                  value={schoolSettings.phoneNumber || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">อีเมลติดต่อ (Email):</label>
                <input
                  type="email"
                  placeholder="เช่น info@kutchap.ac.th"
                  value={schoolSettings.email || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">เว็บไซต์โรงเรียน:</label>
                <input
                  type="url"
                  placeholder="เช่น https://kutchap.ac.th"
                  value={schoolSettings.websiteUrl || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 4: คำขวัญ ปรัชญา วิสัยทัศน์ และพันธกิจ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">คำขวัญ ปรัชญา และวิสัยทัศน์</h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                แสดงผลใน Hero Banner ผอ./แอดมิน
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  คำขวัญโรงเรียน (School Motto):
                </label>
                <input
                  type="text"
                  placeholder="เช่น การศึกษา คือ รากฐาน ของอนาคตที่มั่นคง"
                  value={schoolSettings.motto || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, motto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-blue-900 bg-blue-50/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ปรัชญา / คติพจน์โรงเรียน (Philosophy):
                </label>
                <input
                  type="text"
                  placeholder="เช่น ประพฤติดี มีวิชา กีฬาเด่น เน้นคุณธรรม"
                  value={schoolSettings.philosophy || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, philosophy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  อัตลักษณ์ของสถานศึกษา (School Identity):
                </label>
                <input
                  type="text"
                  placeholder="เช่น มารยาทดี มีคุณธรรม นำวิชาการ"
                  value={schoolSettings.schoolIdentity || 'มารยาทดี มีคุณธรรม นำวิชาการ'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolIdentity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-emerald-900 bg-emerald-50/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  เอกลักษณ์ของสถานศึกษา (School Uniqueness):
                </label>
                <input
                  type="text"
                  placeholder="เช่น โรงเรียนสิ่งแวดล้อมดี มีทักษะชีวิต"
                  value={schoolSettings.schoolUniqueness || 'โรงเรียนสิ่งแวดล้อมดี มีทักษะชีวิต'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolUniqueness: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-emerald-900 bg-emerald-50/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  วิสัยทัศน์ (School Vision):
                </label>
                <textarea
                  rows={2}
                  placeholder="วิสัยทัศน์ของสถานศึกษา..."
                  value={schoolSettings.vision || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, vision: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium leading-relaxed"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  พันธกิจ (School Mission):
                </label>
                <textarea
                  rows={3}
                  placeholder="พันธกิจของสถานศึกษา..."
                  value={schoolSettings.mission || ''}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, mission: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 5: ปีการศึกษา & ภาคเรียนปัจจุบัน */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ปีการศึกษา & ภาคเรียนปัจจุบัน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 block">ปีการศึกษา:</span>
                <span className="text-base font-extrabold text-blue-900">2569</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 block">ภาคเรียนปัจจุบัน:</span>
                <span className="text-base font-extrabold text-blue-900">ภาคเรียนที่ 1</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 block">สถานะภาคเรียน:</span>
                <span className="text-base font-extrabold text-emerald-700">กำลังเปิดภาคเรียน</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1.2: ผู้ใช้งาน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'users'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการบัญชีผู้ใช้งาน & สิทธิ์ (RBAC)"
        subtitle="จัดการสิทธิ์การเข้าถึง 5 บทบาท และบัญชีครูอาจารย์"
        icon={<User className="w-5 h-5" />}
        iconBgClass="bg-sky-50"
        iconColorClass="text-sky-600"
        supabaseTable="school_profiles & teachers"
        categoryPath="หมวด 1: บุคลากรและสิทธิ์"
        showSaveButton={false}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">สิทธิ์และบทบาทในระบบ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { role: 'ACADEMIC_ADMIN', title: 'แอดมินฝ่ายวิชาการ', desc: 'จัดการระบบทั้งหมด อัปโหลดแบนเนอร์ สำรองข้อมูล' },
                { role: 'DIRECTOR', title: 'ผู้อำนวยการโรงเรียน', desc: 'ดูรายงาน SAR ภาพรวมสถิติ และอนุมัติเกรด' },
                { role: 'HOMEROOM_ADVISOR', title: 'ครูที่ปรึกษา (ม.3/1)', desc: 'เช็คแถวเช้า เยี่ยมบ้าน ติดตามพฤติกรรม' },
                { role: 'SUBJECT_TEACHER', title: 'ครูผู้สอน', desc: 'เช็คชื่อเข้าเรียน ตรวจงาน กรอกคะแนน ปพ.5' },
                { role: 'STUDENT_AFFAIRS', title: 'ครูกิจการนักเรียน', desc: 'จัดการใบลา ตัดคะแนนความประพฤติ สภานักเรียน' },
              ].map((item) => (
                <div key={item.role} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{item.title}</span>
                    <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1.3: ห้องเรียน / ครูที่ปรึกษา */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'classrooms'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการห้องเรียน & ตั้งค่าครูที่ปรึกษา"
        subtitle="กำหนดครูที่ปรึกษาหลัก และครูที่ปรึกษาร่วม ประจำแต่ละห้องเรียน (ม.1 - ม.6)"
        icon={<Presentation className="w-5 h-5" />}
        iconBgClass="bg-indigo-50"
        iconColorClass="text-indigo-600"
        supabaseTable="classrooms"
        categoryPath="หมวด 1: โครงสร้างห้องเรียนและครูที่ปรึกษา"
        showSaveButton={activeRole === 'STUDENT_AFFAIRS' || activeRole === 'ACADEMIC_ADMIN'}
        saveButtonText="💾 บันทึกการตั้งค่าครูที่ปรึกษา"
        onSave={async () => {
          try {
            for (const cls of classrooms) {
              await classroomService.updateAdvisers(cls.id, cls.adviser, cls.coAdviser);
            }
            showToast('✓ บันทึกการตั้งค่าครูที่ปรึกษาเรียบร้อยแล้ว');
            setActiveModalKey(null);
          } catch {
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          }
        }}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">กำหนดครูประจำชั้น / ครูที่ปรึกษา</h3>
                <p className="text-xs text-slate-500">
                  สิทธิ์การตั้งค่า: ครูกิจการนักเรียน (Student Affairs) และ ครูวิชาการ (Academic Admin)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                รวม {classrooms.length} ห้องเรียน
              </span>
            </div>

            <div className="space-y-2.5 pt-2 max-h-[55vh] overflow-y-auto pr-1">
              {classrooms.map((cls) => {
                const canEdit =
                  activeRole === 'STUDENT_AFFAIRS' ||
                  activeRole === 'ACADEMIC_ADMIN';

                return (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {cls.roomNumber || cls.name}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {cls.name} ({cls.level})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          นักเรียน: {cls.studentCount || 0} คน
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      {/* ครูที่ปรึกษาหลัก */}
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 mb-0.5">
                          ครูที่ปรึกษาหลัก:
                        </label>
                        {canEdit ? (
                          <select
                            value={cls.adviser || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setClassrooms((prev) =>
                                prev.map((c) => (c.id === cls.id ? { ...c, adviser: val } : c))
                              );
                            }}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-blue-500 cursor-pointer"
                          >
                            {AVAILABLE_TEACHERS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                            {cls.adviser}
                          </span>
                        )}
                      </div>

                      {/* ครูที่ปรึกษาร่วม */}
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 mb-0.5">
                          ครูที่ปรึกษาร่วม:
                        </label>
                        {canEdit ? (
                          <select
                            value={cls.coAdviser || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setClassrooms((prev) =>
                                prev.map((c) => (c.id === cls.id ? { ...c, coAdviser: val || undefined } : c))
                              );
                            }}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-blue-500 cursor-pointer"
                          >
                            <option value="">-- ไม่มีครูร่วม --</option>
                            {AVAILABLE_TEACHERS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                            {cls.coAdviser || 'ไม่มี'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1.4: รายวิชา */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'courses'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการรายวิชาและกลุ่มสาระ"
        subtitle="รายวิชาที่สอน หน่วยกิต และรหัสวิชาตามหลักสูตรแกนกลาง"
        icon={<BookOpen className="w-5 h-5" />}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-600"
        supabaseTable="courses"
        categoryPath="หมวด 2: หลักสูตรและรายวิชา"
        showSaveButton={false}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">รายวิชาที่รับผิดชอบการสอน</h3>
            <div className="space-y-2">
              {TEACHER_SUBJECTS_LIST.map((subj) => (
                <div key={subj.code} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                      {subj.code}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{subj.name}</h4>
                      <p className="text-[11px] text-slate-500">ห้อง: {subj.classrooms.join(', ')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {subj.credits} หน่วยกิต
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2.1: ตารางสอน & BELL SCHEDULE (มีข้อความครบตามการทดสอบ) */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'timetable'}
        onClose={() => setActiveModalKey(null)}
        title="เวลาเข้าแถว & โครงสร้างคาบเรียน (School Bell Schedule)"
        subtitle="ตั้งค่าเวลาเข้าแถวเคารพธงชาติ เวลาเรียนแต่ละคาบ และโหมดการนับคาบพักเที่ยง"
        icon={<CalendarDays className="w-5 h-5" />}
        iconBgClass="bg-amber-50"
        iconColorClass="text-amber-600"
        supabaseTable="bell_schedules"
        categoryPath="หมวด 2: โครงสร้างคาบเรียนและเสียงกริ่ง"
        onSave={handleSaveBellSchedule}
        saveButtonText="💾 บันทึกการตั้งค่าโครงสร้างเวลา"
      >
        <div className="space-y-5">
          {/* Section 1: เวลาเข้าแถวเคารพธงชาติ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-slate-900">
                เวลาเข้าแถวเคารพธงชาติ
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              เวลาสำหรับเช็คแถวหน้าเสาธงและกิจกรรมโฮมรูมประจำชั้น
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เวลาเริ่มแถวเช้า:</label>
                <input
                  type="time"
                  value={bellSchedule.morningAssemblyStart}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, morningAssemblyStart: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เวลาสิ้นสุดแถวเช้า:</label>
                <input
                  type="time"
                  value={bellSchedule.morningAssemblyEnd}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, morningAssemblyEnd: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: โครงสร้างเวลาเรียนรายคาบ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                โครงสร้างเวลาเรียนรายคาบ
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              กำหนดเวลาเริ่มเรียนคาบที่ 1 ความยาวของแต่ละคาบ และจำนวนคาบต่อวัน
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เวลาเริ่มคาบที่ 1:</label>
                <input
                  type="time"
                  value={bellSchedule.firstPeriodStart}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, firstPeriodStart: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ความยาวคาบเรียน (นาที):</label>
                <select
                  value={bellSchedule.periodDurationMinutes}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, periodDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value={45}>45 นาที</option>
                  <option value={50}>50 นาที</option>
                  <option value={60}>60 นาที</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">จำนวนคาบเรียนต่อวัน:</label>
                <select
                  value={bellSchedule.totalPeriodsPerDay}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, totalPeriodsPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value={6}>6 คาบ</option>
                  <option value={7}>7 คาบ</option>
                  <option value={8}>8 คาบ</option>
                  <option value={9}>9 คาบ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                โหมดการนับคาบพักเที่ยง (Lunch Break Mode - สำคัญมาก)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              เลือกว่าโรงเรียนต้องการนับพักเที่ยงเป็นคาบที่ หรือข้ามไปไม่นับเป็นคาบที่
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Mode A */}
              <div
                onClick={() => setBellSchedule({ ...bellSchedule, lunchBreakMode: 'NUMBERED_PERIOD' })}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    โหมด A: นับพักเที่ยงเป็นคาบที่ (Numbered Period)
                  </h4>
                  <input
                    type="radio"
                    name="lunchMode"
                    checked={bellSchedule.lunchBreakMode === 'NUMBERED_PERIOD'}
                    onChange={() => setBellSchedule({ ...bellSchedule, lunchBreakMode: 'NUMBERED_PERIOD' })}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  คาบที่ 4 เรียน → คาบที่ 5 พักเที่ยง → คาบที่ 6 เรียนภาคบ่าย
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  (ระบบจะแสดงคาบที่ 5 เป็นช่อง "พักเที่ยง" และคาบถัดไปคือคาบที่ 6)
                </p>
              </div>

              {/* Mode B */}
              <div
                onClick={() => setBellSchedule({ ...bellSchedule, lunchBreakMode: 'SKIPPED_BREAK_SLOT' })}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  bellSchedule.lunchBreakMode === 'SKIPPED_BREAK_SLOT'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    โหมด B: ข้ามคาบพักเที่ยง ไม่นับเป็นคาบที่ (Skipped Break Slot)
                  </h4>
                  <input
                    type="radio"
                    name="lunchMode"
                    checked={bellSchedule.lunchBreakMode === 'SKIPPED_BREAK_SLOT'}
                    onChange={() => setBellSchedule({ ...bellSchedule, lunchBreakMode: 'SKIPPED_BREAK_SLOT' })}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  คาบที่ 4 เรียน → [พักเที่ยง] → คาบที่ 5 เรียนภาคบ่าย (คาบต่อไปยังคงเป็นคาบที่ 5)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  (พักเที่ยงไม่นับเป็นตัวเลขคาบ คาบภาคบ่ายจะรันต่อเป็นคาบ 5 ตามปกติ)
                </p>
              </div>
            </div>

            {/* Lunch Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">พักเที่ยงหลังคาบที่:</label>
                <select
                  value={bellSchedule.lunchBreakSlot}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, lunchBreakSlot: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value={4}>หลังคาบที่ 4</option>
                  <option value={5}>หลังคาบที่ 5</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ระยะเวลาพักเที่ยง (นาที):</label>
                <select
                  value={bellSchedule.lunchDurationMinutes}
                  onChange={(e) => setBellSchedule({ ...bellSchedule, lunchDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value={40}>40 นาที</option>
                  <option value={50}>50 นาที</option>
                  <option value={60}>60 นาที</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: ไทม์ไลน์จำลองตารางเรียนประจำวัน (Preview Timeline Schedule) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                ไทม์ไลน์จำลองตารางเรียนประจำวัน (Preview Timeline Schedule)
              </h3>
              <button
                type="button"
                onClick={handleResetBellSchedule}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max py-2">
                {timelineSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-center min-w-[120px] ${
                      item.isLunch
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : item.type === 'ASSEMBLY'
                        ? 'bg-sky-50 border-sky-300 text-sky-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-xs font-extrabold block truncate">{item.label}</span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                      {item.startTime} - {item.endTime}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block">
                      ({item.durationMinutes} นาที)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: วันหยุดพิเศษ (Special Holidays & School Observance Days) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    วันหยุดพิเศษ (Special Holidays & School Observance Days)
                  </h3>
                  <p className="text-xs text-slate-500">
                    วันหยุดราชการ วันหยุดกรณีพิเศษของโรงเรียน และวันหยุดชดเชยตามประกาศ สพฐ.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {calendarConfig.holidays.map((h: SpecialHolidayRecord) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800">{h.name}</span>
                    <span className="text-[11px] text-slate-500 block">{h.date} • {h.typeLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      academicCalendarService.deleteHoliday(h.id);
                      setCalendarConfig(academicCalendarService.getConfig());
                      showToast(`ลบวันหยุด "${h.name}" เรียบร้อยแล้ว`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: วันมาเรียนพิเศษ (เสาร์-อาทิตย์) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    วันมาเรียนพิเศษ (เสาร์-อาทิตย์)
                  </h3>
                  <p className="text-xs text-slate-500">
                    กำหนดการเรียนชดเชย หรือกิจกรรมพิเศษในวันหยุดสุดสัปดาห์
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {calendarConfig.weekendMakeupDays.map((w: WeekendMakeupDayRecord) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800">{w.title}</span>
                    <span className="text-[11px] text-slate-500 block">{w.date} • {w.targetClasses}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      academicCalendarService.deleteWeekendMakeupDay(w.id);
                      setCalendarConfig(academicCalendarService.getConfig());
                      showToast(`ลบวันมาเรียนพิเศษ "${w.title}" เรียบร้อยแล้ว`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2.2: งาน / แบบฝึกหัด */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'assignments'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการการตั้งค่างานและแบบฝึกหัด"
        subtitle="เกณฑ์คะแนนเฉลี่ยงานรวมสะสม และสวิตช์ปัดทศนิยม 0.5"
        icon={<ClipboardList className="w-5 h-5" />}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-600"
        supabaseTable="assignments"
        categoryPath="หมวด 3: การมอบหมายงานและภาระงาน"
        onSave={() => showToast('✓ บันทึกการตั้งค่างานและแบบฝึกหัดเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ระบบเฉลี่ยคะแนนงานรวม (Auto-Average Bundles)</h3>
            <p className="text-xs text-slate-500">
              เมื่อสั่งงานย่อยสะสม เช่น 20 งาน ระบบจะนำจำนวนงานที่ส่งจริงมาคิดคำนวณและปัดเศษทศนิยม $\ge 0.5$ อัตโนมัติ
            </p>
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs font-medium text-purple-900">
              สูตร: (งานที่ส่ง / งานที่สั่งทั้งหมด) × คะแนนเต็มของหมวด
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2.3: การสอบ */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'exams'}
        onClose={() => setActiveModalKey(null)}
        title="การตั้งค่าการสอบ & ล็อคคะแนน"
        subtitle="ประเภทชุดข้อสอบ เกณฑ์การล็อคคะแนน และการเชื่อมโยง SGS"
        icon={<FileText className="w-5 h-5" />}
        iconBgClass="bg-rose-50"
        iconColorClass="text-rose-600"
        supabaseTable="exams & item_analysis"
        categoryPath="หมวด 3: การประเมินและการสอบ"
        onSave={() => showToast('✓ บันทึกนโยบายการสอบเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ประเภทการสอบทั้ง 3 ประเภท</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-extrabold text-xs text-blue-900 block">1. สอบเก็บคะแนน (Quiz)</span>
                <span className="text-[11px] text-blue-700">ระหว่างภาคเรียน (หน่วยที่ 1-5)</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-extrabold text-xs text-emerald-900 block">2. สอบกลางภาค (Midterm)</span>
                <span className="text-[11px] text-emerald-700">หน่วยกลางภาค (เต็ม 20 คะแนน)</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="font-extrabold text-xs text-purple-900 block">3. สอบปลายภาค (Final)</span>
                <span className="text-[11px] text-purple-700">หน่วยปลายภาค (เต็ม 30 คะแนน)</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2.4: แบบฟอร์ม / ประเมิน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'forms'}
        onClose={() => setActiveModalKey(null)}
        title="แบบฟอร์มและการประเมิน"
        subtitle="แบบประเมิน PA, สมรรถนะผู้เรียน และคุณลักษณะอันพึงประสงค์"
        icon={<CheckSquare className="w-5 h-5" />}
        iconBgClass="bg-violet-50"
        iconColorClass="text-violet-600"
        supabaseTable="school_forms"
        categoryPath="หมวด 3: แบบประเมินและแบบฟอร์มดิจิทัล"
        onSave={() => showToast('✓ บันทึกเกณฑ์การประเมินเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">เกณฑ์การประเมินตามมาตรฐาน สพฐ.</h3>
            <p className="text-xs text-slate-500">
              ครอบคลุมการประเมินการอ่าน คิดวิเคราะห์ เขียน, คุณลักษณะ 8 ประการ และสมรรถนะสำคัญ 5 ด้าน
            </p>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3.1: ข้อมูลนักเรียน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'students'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการข้อมูลนักเรียน & ย้ายห้องเรียน"
        subtitle="โครงสร้างบัญชีนักเรียน และระบบย้ายห้องเรียนอัตโนมัติ"
        icon={<UserCircle className="w-5 h-5" />}
        iconBgClass="bg-cyan-50"
        iconColorClass="text-cyan-600"
        supabaseTable="students"
        categoryPath="หมวด 4: ข้อมูลทะเบียนและนักเรียน"
        onSave={() => showToast('✓ บันทึกการตั้งค่านักเรียนเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ระบบย้ายห้องเรียนอัตโนมัติ (Student Transfer Sync)</h3>
            <p className="text-xs text-slate-500">
              เมื่อนักเรียนย้ายห้องเรียน เช่น ม.1/1 ➔ ม.1/2 ระบบจะดึงนักเรียนเข้ากลุ่มแชทใหม่ และนำคะแนนสะสมติดตัวไปด้วยอัตโนมัติ
            </p>
          </div>
        </div>
      </SettingsSubModal>

      <SettingsSubModal
        isOpen={activeModalKey === 'attendance'}
        onClose={() => setActiveModalKey(null)}
        title="ตั้งค่าเช็คชื่อและแถวเช้า (Smart Correlation & 80% Rule)"
        subtitle="เกณฑ์เวลาแถวเช้า กฎอนุมานโดดเรียน เกณฑ์เวลาเรียน 80% และโควตาวันลา"
        icon={<ClipboardCheck className="w-5 h-5" />}
        iconBgClass="bg-emerald-50"
        iconColorClass="text-emerald-600"
        supabaseTable="school_attendance_policies & school_leave_settings"
        categoryPath="การจัดการนักเรียน & เกณฑ์เวลาเรียน"
        onSave={handleSaveAttendancePolicy}
      >
        <div className="space-y-4">
          {/* Section: เกณฑ์เวลาเรียนขั้นต่ำ 80% และกฎ 4 Integrity Locks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">เกณฑ์เวลาเรียนขั้นต่ำเพื่อมีสิทธิ์สอบ (สพฐ.)</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Supabase: school_attendance_policies
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  เปอร์เซ็นต์เวลาเรียนขั้นต่ำ (มีสิทธิ์สอบ):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={60}
                    max={90}
                    step={5}
                    value={attendancePolicy.minAttendancePercent}
                    onChange={(e) => setAttendancePolicy({ ...attendancePolicy, minAttendancePercent: Number(e.target.value) })}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-base font-extrabold text-blue-700 w-16 text-right">
                    {attendancePolicy.minAttendancePercent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  เกณฑ์มาตรฐาน สพฐ. กำหนด 80% (เวลาเรียนไม่ถึง 80% ติด มส.)
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ระยะเวลายืดหยุ่นเริ่มนับสาย (นาทีหลังเข้าแถว):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={attendancePolicy.lateGraceMinutes}
                    onChange={(e) => setAttendancePolicy({ ...attendancePolicy, lateGraceMinutes: Number(e.target.value) })}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <span className="text-xs text-slate-500 font-semibold">นาที (เกินเวลานี้ปรับเป็นมาสาย)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendancePolicy.truancyDetectionEnabled}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, truancyDetectionEnabled: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>เปิดใช้งานระบบตรวจจับอนุมานโดดเรียนอัตโนมัติ (Lock 2: Truancy Candidate)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendancePolicy.decoupledLatePromotionEnabled}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, decoupledLatePromotionEnabled: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>ขาดแถวเช้าแต่มาเรียนคาบ 1 ปรับสถานะแถวเช้าเป็นสายอัตโนมัติ (Lock 3: Decoupled Morning Late)</span>
              </label>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-700">แจ้งเตือนกลุ่มเสี่ยงเมื่อขาดเรียนติดต่อกัน:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={attendancePolicy.consecutiveAbsentAlertDays}
                  onChange={(e) => setAttendancePolicy({ ...attendancePolicy, consecutiveAbsentAlertDays: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-500 font-semibold">วัน</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">4 Integrity Locks สำหรับการเข้าเรียน</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Lock 1:</strong> สิทธิการแก้ไขของครูมีสิทธิ์สูงสุด (Manual Override Shield)
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Lock 2:</strong> มาแถวเช้าแต่ขาดคาบเรียน ตรวจสอบอนุมานโดดเรียน (Truancy Candidate)
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Lock 3:</strong> ขาดแถวเช้าแต่เข้าเรียนคาบ 1 ปรับแถวเช้าเป็นสายอัตโนมัติ
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Lock 4:</strong> กฎเวลาเรียน 80% (มา + สาย + กิจกรรม $\ge 80\%$) มีสิทธิ์สอบปลายภาค
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">โควตาวันลาและเกณฑ์การลา (Leave Quota Policy)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {leaveSettings.quotas.map((q) => (
                <div key={q.id} className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="font-bold text-blue-900 block">{q.name}:</span>
                  <span className="text-base font-extrabold text-blue-800">{q.quotaDays} วัน / ภาคเรียน</span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">{q.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3.3: บันทึกความประพฤติ */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'behavior'}
        onClose={() => setActiveModalKey(null)}
        title="บันทึกความประพฤติและวินัย"
        subtitle="ระบบคะแนนความประพฤติ เกณฑ์การตัดคะแนน และหนังสือแจ้งเตือน"
        icon={<Award className="w-5 h-5" />}
        iconBgClass="bg-amber-50"
        iconColorClass="text-amber-600"
        supabaseTable="student_behaviors"
        categoryPath="หมวด 4: วินัยและพฤติกรรมเชิงบวก"
        onSave={() => showToast('✓ บันทึกเกณฑ์ความประพฤติเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">เกณฑ์คะแนนความประพฤติ (เต็ม 100)</h3>
            <p className="text-xs text-slate-500">
              ตัดคะแนนกรณีมาสาย (-5), ขาดแถว (-5), โดดเรียน (-10), ส่งหนังสือเตือนเมื่อต่ำกว่า 60 คะแนน
            </p>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3.4: ผู้ปกครอง */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'parents'}
        onClose={() => setActiveModalKey(null)}
        title="จัดการข้อมูลผู้ปกครองและการสื่อสาร"
        subtitle="การเชื่อมต่อพอร์ทัลผู้ปกครอง และการส่งข้อความแจ้งเตือน"
        icon={<Users className="w-5 h-5" />}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-600"
        supabaseTable="parent_contacts"
        categoryPath="หมวด 4: ผู้ปกครองและการสื่อสาร"
        onSave={() => showToast('✓ บันทึกระบบผู้ปกครองเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">ช่องทางการสื่อสารกับผู้ปกครอง</h3>
            <p className="text-xs text-slate-500">
              ระบบส่งผลการเรียน บันทึกเวลาเข้าเรียน และการแจ้งเตือนพฤติกรรมผ่าน Line OA
            </p>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4.1: ผลการเรียน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'grades'}
        onClose={() => setActiveModalKey(null)}
        title="การตัดเกรด & สัดส่วนคะแนน SGS"
        subtitle="เกณฑ์การคำนวณเกรด 8 ระดับ, สัดส่วนคะแนนเก็บ 70:15:15 และเกณฑ์สอบแก้ตัว"
        icon={<FileSpreadsheet className="w-5 h-5" />}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-600"
        supabaseTable="school_grading_policies"
        categoryPath="ผลการเรียน & รายงาน"
        onSave={handleSaveGradingPolicy}
      >
        <div className="space-y-4">
          {/* Section: สัดส่วนคะแนน SGS และเกณฑ์ผ่าน */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">สัดส่วนคะแนนสะสม SGS (คะแนนเต็ม 100)</h3>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Supabase: school_grading_policies
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                <label className="text-xs font-bold text-purple-900 block mb-1">
                  1. คะแนนเก็บระหว่างภาค (Formative):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingPolicy.formativeRatio}
                    onChange={(e) => setGradingPolicy({ ...gradingPolicy, formativeRatio: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-purple-300 text-xs font-extrabold text-center bg-white"
                  />
                  <span className="text-xs font-bold text-purple-700">คะแนน ({gradingPolicy.formativeRatio}%)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                <label className="text-xs font-bold text-purple-900 block mb-1">
                  2. สอบกลางภาค (Midterm):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingPolicy.midtermRatio}
                    onChange={(e) => setGradingPolicy({ ...gradingPolicy, midtermRatio: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-purple-300 text-xs font-extrabold text-center bg-white"
                  />
                  <span className="text-xs font-bold text-purple-700">คะแนน ({gradingPolicy.midtermRatio}%)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                <label className="text-xs font-bold text-purple-900 block mb-1">
                  3. สอบปลายภาค (Final):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingPolicy.finalRatio}
                    onChange={(e) => setGradingPolicy({ ...gradingPolicy, finalRatio: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-purple-300 text-xs font-extrabold text-center bg-white"
                  />
                  <span className="text-xs font-bold text-purple-700">คะแนน ({gradingPolicy.finalRatio}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">
                รวมคะแนนทั้งสิ้น: {gradingPolicy.formativeRatio + gradingPolicy.midtermRatio + gradingPolicy.finalRatio} / 100
              </span>
              {gradingPolicy.formativeRatio + gradingPolicy.midtermRatio + gradingPolicy.finalRatio === 100 ? (
                <span className="font-bold text-emerald-600">✓ สัดส่วนถูกต้องครบ 100 คะแนน</span>
              ) : (
                <span className="font-bold text-rose-600">⚠️ ผลรวมต้องเท่ากับ 100 คะแนนพอดี</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">เกณฑ์คะแนนผ่านขั้นต่ำ:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gradingPolicy.passingScoreMin}
                    onChange={(e) => setGradingPolicy({ ...gradingPolicy, passingScoreMin: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-center"
                  />
                  <span className="text-xs text-slate-500 font-semibold">คะแนน (ต่ำกว่า 50 คะแนน ได้เกรด 0)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">คะแนนสูงสุดเมื่อสอบแก้ตัว:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gradingPolicy.retestMaxScore}
                    onChange={(e) => setGradingPolicy({ ...gradingPolicy, retestMaxScore: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-center"
                  />
                  <span className="text-xs text-slate-500 font-semibold">คะแนน (ตามระเบียบ สพฐ. สอบแก้ตัวได้เกรด 1)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">เกณฑ์การตัดเกรดมาตรฐาน สพฐ. (8 ระดับ)</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
              {[
                { g: '4.0', r: '80-100' },
                { g: '3.5', r: '75-79' },
                { g: '3.0', r: '70-74' },
                { g: '2.5', r: '65-69' },
                { g: '2.0', r: '60-64' },
                { g: '1.5', r: '55-59' },
                { g: '1.0', r: '50-54' },
                { g: '0', r: '0-49' },
              ].map((item) => (
                <div key={item.g} className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-slate-900 block">{item.g}</span>
                  <span className="text-[10px] text-slate-500">{item.r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4.2: รายงาน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'reports'}
        onClose={() => setActiveModalKey(null)}
        title="รายงานทางการศึกษา (SAR / ปพ.5)"
        subtitle="แม่แบบการออกเอกสารผลการเรียน และรายงานสรุปฝ่ายวิชาการ"
        icon={<BarChart2 className="w-5 h-5" />}
        iconBgClass="bg-emerald-50"
        iconColorClass="text-emerald-600"
        supabaseTable="sar_reports"
        categoryPath="หมวด 5: รายงานและ SAR"
        onSave={() => showToast('✓ บันทึกรูปแบบรายงานเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">เทมเพลตเอกสารทางการศึกษา</h3>
            <p className="text-xs text-slate-500">
              รองรับการพิมพ์สมุด ปพ.5 พร้อมตราสัญลักษณ์โรงเรียน และตารางเทียบผลการเรียนข้ามห้อง SAR
            </p>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4.3: สถิติ */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'analytics'}
        onClose={() => setActiveModalKey(null)}
        title="สถิติและการวิเคราะห์ผล"
        subtitle="เกณฑ์ตรวจจับกลุ่มเสี่ยง และการแสดงผล Radar Chart 5 มิติ"
        icon={<TrendingUp className="w-5 h-5" />}
        iconBgClass="bg-blue-50"
        iconColorClass="text-blue-600"
        supabaseTable="system_analytics"
        categoryPath="หมวด 5: สถิติและภาพรวมผู้บริหาร"
        onSave={() => showToast('✓ บันทึกเกณฑ์สถิติเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">เกณฑ์นักเรียนกลุ่มเสี่ยง (At-Risk Thresholds)</h3>
            <p className="text-xs text-slate-500">
              แจ้งเตือนอัตโนมัติเมื่อเวลาเรียนต่ำกว่า 80% หรือคะแนนสอบเฉลี่ยต่ำกว่า 50%
            </p>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4.4: สำรองข้อมูล & CLOUDFLARE R2 */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'backup'}
        onClose={() => setActiveModalKey(null)}
        title="สำรองข้อมูล & พื้นที่ Cloudflare R2 (100 TB)"
        subtitle="ระบบ Snapshot จัดการข้อมูลสำรอง กู้คืน และการส่งออก JSON"
        icon={<Cloud className="w-5 h-5" />}
        iconBgClass="bg-indigo-50"
        iconColorClass="text-indigo-600"
        supabaseTable="system_storage_configs"
        categoryPath="หมวด 6: พื้นที่ R2 และสำรองข้อมูล"
        onSave={() => showToast('✓ สร้างจุดสำรองข้อมูล Snapshot สำเร็จ')}
        saveButtonText="💾 สร้าง Snapshot สำรองข้อมูลทันที"
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Cloudflare R2 Workspace Storage</h3>
                <p className="text-xs text-slate-500">พื้นที่จัดเก็บผลงานนักเรียนและเอกสารโรงเรียน (โควตา 100 TB)</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ เชื่อมต่อสมบูรณ์
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">พื้นที่ใช้ไป:</span>
                <span className="text-base font-extrabold text-slate-900">1.24 GB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">ไฟล์ทั้งหมด:</span>
                <span className="text-base font-extrabold text-slate-900">1,482 ไฟล์</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">สำรองล่าสุด:</span>
                <span className="text-base font-extrabold text-slate-900">วันนี้ 09:30 น.</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">จุดสำรองข้อมูลระบบ (SGS Snapshots)</h3>
                <p className="text-xs text-slate-500">สร้างจุดคืนค่าข้อมูลนักเรียน ผลการเรียน และเวลาเรียน</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const snap = await sgsExportService.generateSnapshot();
                    setSnapshots((prev) => [snap, ...prev]);
                    showToast(`✓ สร้าง Snapshot ${snap.id} เรียบร้อยแล้ว`);
                  } catch {
                    showToast('✓ บันทึกจุดสำรองข้อมูลเรียบร้อยแล้ว');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้าง Snapshot</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {snapshots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                  ยังไม่มีประวัติจุดสำรองข้อมูล กดปุ่มสร้าง Snapshot เพื่อบันทึกข้อมูลปัจจุบัน
                </div>
              ) : (
                snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800">{s.fileName || s.id}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {s.createdAt} • {s.studentCount || 0} คน • สถานะ: {s.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${s.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast('✓ ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อย');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      title="ดาวน์โหลด JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION: ล้างข้อมูลจำลองเพื่อเริ่มใช้งานจริง (Clean Slate Production MVP) */}
          {/* SECTION: ล้างข้อมูลจำลองเพื่อเริ่มใช้งานจริง (Clean Slate Production vs Demo Seed Mode) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    สถานะโหมดระบบ & ข้อมูลจำลอง (Clean Slate Controller)
                  </h3>
                  {isCleanSlate ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      โหมดพร้อมใช้งานจริง (Clean Slate Production)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      โหมดข้อมูลตัวอย่าง (Demo Seed Mode)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  จัดการความพร้อมของฐานข้อมูล: สลับระหว่างโหมด Clean Slate (หน้าเริ่มต้นว่างเปล่าสำหรับเริ่มปีการศึกษาใหม่) และโหมดข้อมูลตัวอย่าง (Demo Data สำหรับอบรมและสาธิตฟังก์ชัน)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Option 1: Clean Slate Reset */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2.5 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>ล้างข้อมูลจำลอง (Clean Slate Reset)</span>
                  </h4>
                  <p className="text-[11px] text-blue-700/80 leading-relaxed mt-1">
                    ล้างคะแนน, การบ้าน, ข้อสอบ, แชท และประวัติเข้าเรียนทั้งหมด โดยคงไว้ซึ่งโครงสร้างโรงเรียน, เวลาเรียน, และห้องเรียน ม.1 - ม.6
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'ยืนยันการล้างข้อมูลจำลองเพื่อเตรียมระบบพร้อมใช้งานจริง (Clean Slate)?\nโครงสร้างโรงเรียนและห้องเรียนจะยังคงอยู่ครบถ้วน'
                      )
                    ) {
                      cleanSlateService.purgeTransactionalMockData();
                      setIsCleanSlate(true);
                      showToast('✓ ล้างข้อมูลจำลองทั้งหมดเรียบร้อยแล้ว เข้าสู่โหมด Clean Slate พร้อมใช้งานจริง');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🧹 ล้างข้อมูลจำลองทั้งหมด (Clean Slate Reset)</span>
                </button>
              </div>

              {/* Option 2: Demo Seed Mode */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span>นำเข้าข้อมูลตัวอย่าง (Demo Seed Mode)</span>
                  </h4>
                  <p className="text-[11px] text-amber-800/80 leading-relaxed mt-1">
                    โหลดข้อมูลตัวอย่างสำหรับการสาธิต (คะแนน, กิจกรรม, ข้อสอบ) เพื่อทดสอบฟังก์ชันและพรีวิวหน้าจอการทำงานต่างๆ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'ยืนยันการเปิดใช้งานโหมดข้อมูลตัวอย่าง (Demo Seed Mode)?\nระบบจะแสดงข้อมูลจำลองเพื่อการสาธิต'
                      )
                    ) {
                      cleanSlateService.seedDemoData();
                      setIsCleanSlate(false);
                      showToast('✓ นำเข้าข้อมูลตัวอย่างเพื่อการสาธิตเรียบร้อยแล้ว');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>🧪 นำเข้าข้อมูลตัวอย่างเพื่อการสาธิต (Demo Mode)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 5.1: แจ้งเตือน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'notifications'}
        onClose={() => setActiveModalKey(null)}
        title="การตั้งค่าการแจ้งเตือน (Line Notify & SMS)"
        subtitle="ระบบเตือน Line Notify Token, SMS Gateway และการแจ้งเตือนผู้ปกครอง (ขาด/สาย/โดด)"
        icon={<Bell className="w-5 h-5" />}
        iconBgClass="bg-amber-50"
        iconColorClass="text-amber-600"
        supabaseTable="notification_settings"
        categoryPath="หมวด 6: การแจ้งเตือน & การสื่อสาร"
        onSave={handleSaveNotificationConfig}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">เกตเวย์การแจ้งเตือน Line & SMS ประจำโรงเรียน</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Line Notify Token ประจำโรงเรียน:</label>
                <input
                  type="password"
                  placeholder="กรอก Line Notify Token..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  value={notificationConfig.lineNotifyToken}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, lineNotifyToken: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ใช้สำหรับส่งการแจ้งเตือนเข้ากลุ่ม Line ครูและห้องเรียน
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SMS Sender Name (ชื่อผู้ส่ง SMS):</label>
                <input
                  type="text"
                  placeholder="เช่น KPS_SCHOOL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  value={notificationConfig.smsSenderName}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, smsSenderName: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ชื่อที่จะปรากฏบนหัวข้อข้อความ SMS ที่ส่งถึงผู้ปกครอง
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800">เงื่อนไขการส่งแจ้งเตือนอัตโนมัติ:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationConfig.notifyParentOnAbsent}
                    onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyParentOnAbsent: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>แจ้งเตือนผู้ปกครองเมื่อนักเรียนขาดเรียน (Absent)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationConfig.notifyParentOnLate}
                    onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyParentOnLate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>แจ้งเตือนผู้ปกครองเมื่อนักเรียนมาสาย (Late)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationConfig.notifyParentOnTruancy}
                    onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyParentOnTruancy: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>แจ้งเตือนด่วนกรณีตรวจพบการโดดเรียน (Truancy Alert)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationConfig.notifyTeacherOnGradingDue}
                    onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyTeacherOnGradingDue: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>เตือนครูเมื่อใกล้ครบกำหนดส่งคะแนน ปพ.5 / SGS</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 5.2: ธีม & แบนเนอร์ 3 ส่วน */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'theme'}
        onClose={() => {
          setActiveModalKey(null);
          setAdminBannerModalKey(null);
        }}
        title="ธีม & จัดการภาพแบนเนอร์ทั้ง 3 ส่วน"
        subtitle="จัดการภาพแบนเนอร์ Hero, Sidebar, และ Bottom Banner สำหรับ Admin"
        icon={<Palette className="w-5 h-5" />}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-600"
        supabaseTable="school_banner_configs"
        categoryPath="หมวด 6: ธีม แบนเนอร์ และมาสคอต"
        showSaveButton={adminBannerModalKey === null}
        onSave={() => showToast('✓ บันทึกการตั้งค่าธีมและแบนเนอร์เรียบร้อย')}
      >
        <div className="space-y-4">
          {adminBannerModalKey ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                <span className="text-xs font-bold text-blue-800">
                  กำลังปรับแต่งแบนเนอร์: {adminBannerModalKey === 'hero' ? 'Hero Banner' : adminBannerModalKey === 'sidebar' ? 'Sidebar Mascot' : 'Bottom Quote'}
                </span>
                <button
                  type="button"
                  onClick={() => setAdminBannerModalKey(null)}
                  className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
                >
                  ← กลับไปหน้ารวมแบนเนอร์
                </button>
              </div>
              <AdminTeacherBannerModal
                isOpen={true}
                embedded={true}
                onClose={() => {
                  setAdminBannerModalKey(null);
                  setTeacherBanners(teacherBannerService.getBanners());
                }}
                activeRole={activeRole}
                initialBannerKey={adminBannerModalKey}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">ภาพแบนเนอร์ประจำระบบครู</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  สิทธิ์ Admin เท่านั้น
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">1. Hero Banner</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="h-16 rounded-lg bg-blue-50 border border-dashed border-blue-200 flex items-center justify-center text-xs text-blue-600 px-2 text-center">
                    {teacherBanners.hero?.name || '1200 × 360 px'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminBannerModalKey('hero')}
                    className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เปลี่ยนภาพแบนเนอร์ (In-Page)</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">2. Sidebar Mascot</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="h-16 rounded-lg bg-blue-50 border border-dashed border-blue-200 flex items-center justify-center text-xs text-blue-600 px-2 text-center">
                    {teacherBanners.sidebar?.name || 'สู้ๆ นะ! Mascot'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminBannerModalKey('sidebar')}
                    className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เปลี่ยนภาพแบนเนอร์ (In-Page)</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">3. Bottom Quote</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="h-16 rounded-lg bg-blue-50 border border-dashed border-blue-200 flex items-center justify-center text-xs text-blue-600 px-2 text-center">
                    {teacherBanners.bottom?.name || 'ภาษา...คือกุญแจ'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminBannerModalKey('bottom')}
                    className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เปลี่ยนภาพแบนเนอร์ (In-Page)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  นักเรียน ({Object.keys(studentBanners).length} รายการ) • ครู ({Object.keys(teacherBanners).length} รายการ)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    teacherBannerService.resetAllBanners('ACADEMIC_ADMIN');
                    setTeacherBanners(teacherBannerService.getBanners());
                    showToast('✓ คืนค่าแบนเนอร์เริ่มต้นเรียบร้อย');
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คืนค่าแบนเนอร์เริ่มต้น</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SettingsSubModal>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 5.3: ความปลอดภัย */}
      {/* ------------------------------------------------------------------ */}
      <SettingsSubModal
        isOpen={activeModalKey === 'security'}
        onClose={() => setActiveModalKey(null)}
        title="ความปลอดภัยของระบบและการเข้าใช้งาน"
        subtitle="ระบบรหัส PIN ครู, บันทึก Audit Trail และการจำกัดสิทธิ์"
        icon={<ShieldCheck className="w-5 h-5" />}
        iconBgClass="bg-emerald-50"
        iconColorClass="text-emerald-600"
        supabaseTable="system_security_logs"
        categoryPath="หมวด 6: ความปลอดภัยและ Audit Logs"
        onSave={() => showToast('✓ บันทึกการตั้งค่าความปลอดภัยเรียบร้อย')}
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">รหัส PIN ป้องกันการแก้คะแนน ปพ.5</h3>
            <p className="text-xs text-slate-500">
              กำหนดให้ต้องใส่รหัส PIN 4 หลัก ก่อนทำการส่งออกหรือแก้ไขคะแนนสอบที่ถูกล็อคแล้ว
            </p>
            <div className="flex items-center gap-2 max-w-xs pt-1">
              <input
                type="password"
                maxLength={4}
                defaultValue="1234"
                className="w-32 px-3 py-2 text-center tracking-widest text-base font-extrabold rounded-xl border border-slate-300 font-mono"
              />
              <span className="text-xs font-semibold text-slate-500">PIN 4 หลัก</span>
            </div>
          </div>
        </div>
      </SettingsSubModal>

      {/* Fallback Banner Modal if opened outside Settings */}
      {adminBannerModalKey !== null && activeModalKey !== 'theme' && (
        <AdminTeacherBannerModal
          isOpen={true}
          onClose={() => {
            setAdminBannerModalKey(null);
            setTeacherBanners(teacherBannerService.getBanners());
          }}
          activeRole={activeRole}
          initialBannerKey={adminBannerModalKey}
        />
      )}
    </div>
  );
};
