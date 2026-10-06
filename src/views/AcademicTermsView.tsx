// src/views/AcademicTermsView.tsx
// ปฏิทินกิจกรรมโรงเรียน (School Activity & Event Calendar)
// มุ่งเน้นการติดตามไทม์ไลน์กิจกรรมโรงเรียน, สัปดาห์สอบ, ค่ายวิชาการ, และนิทรรศการ
// *หมายเหตุ: การตั้งค่าปีการศึกษา/ภาคเรียน/วันเปิด-ปิดเทอม/วันหยุดพิเศษ/วันเรียนพิเศษ ถูกย้ายไปไว้ที่เมนู "ตั้งค่า" (Settings) ทั้งหมดแล้ว*

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Plus,
  Clock,
  Sparkles,
  BookOpen,
  Trophy,
  Users,
  Compass,
  CheckCircle2,
  Settings,
  ChevronRight,
  Info,
  PenTool,
} from 'lucide-react';
import {
  academicCalendarService,
  ACADEMIC_CALENDAR_EVENT,
  type AcademicTermRecord,
} from '../services/academicCalendarService';

export type ActivityCategory = 'ALL' | 'ACADEMIC' | 'DEVELOPMENT' | 'SPORTS' | 'AFFAIRS' | 'EXAM';

export interface SchoolActivityEvent {
  id: string;
  title: string;
  date: string;
  dateRaw: string; // ISO-like for sorting
  endDate?: string;
  category: Exclude<ActivityCategory, 'ALL'>;
  categoryLabel: string;
  location: string;
  organizer: string;
  targetAudience: string;
  description: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  badgeColor: string;
}

const DEFAULT_SCHOOL_ACTIVITIES: SchoolActivityEvent[] = [
  {
    id: 'act-1',
    title: 'นิทรรศการเปิดโลกวิชาการและสัปดาห์วันวิทยาศาสตร์',
    date: '18 ส.ค. 2569',
    dateRaw: '2026-08-18',
    endDate: '19 ส.ค. 2569',
    category: 'ACADEMIC',
    categoryLabel: 'วิชาการ',
    location: 'หอประชุมใหญ่ & ลานกิจกรรม',
    organizer: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    targetAudience: 'นักเรียนทุกระดับชั้น (ม.1 - ม.6)',
    description: 'จัดแสดงผลงานโครงงานวิทยาศาสตร์ นวัตกรรม AI และการแข่งขันตอบปัญหาวิชาการระดับเขตพื้นที่',
    status: 'COMPLETED',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'act-2',
    title: 'ค่ายคุณธรรม นำความรู้ และค่ายลูกเสือสามัญรุ่นใหญ่',
    date: '11 ก.ย. 2569',
    dateRaw: '2026-09-11',
    endDate: '13 ก.ย. 2569',
    category: 'DEVELOPMENT',
    categoryLabel: 'กิจกรรมพัฒนาผู้เรียน',
    location: 'ค่ายลูกเสือชั่วคราว อ่างเก็บน้ำห้วยหลวง',
    organizer: 'งานกิจกรรมพัฒนาผู้เรียนและลูกเสือ',
    targetAudience: 'นักเรียนชั้น ม.1 - ม.3',
    description: 'ฝึกอบรมระเบียบวินัย จิตอาสา การดำรงชีพในป่า และการทดสอบวิชาพิเศษลูกเสือ',
    status: 'COMPLETED',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'act-3',
    title: 'สัปดาห์สอบวัดผลกลางภาคเรียนที่ 1/2569',
    date: '21 ก.ย. 2569',
    dateRaw: '2026-09-21',
    endDate: '25 ก.ย. 2569',
    category: 'EXAM',
    categoryLabel: 'ประเมินและวัดผล',
    location: 'อาคารเรียน 1-3 (ทุกห้องสอบ)',
    organizer: 'ฝ่ายบริหารงานวิชาการและงานทะเบียน',
    targetAudience: 'นักเรียนทุกระดับชั้น',
    description: 'การสอบวัดผลกลางภาคเรียนตามตารางสอบกลางของกลุ่มสาระการเรียนรู้แกนกลาง',
    status: 'COMPLETED',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'act-4',
    title: 'ค่ายติวเข้มยกระดับผลสัมฤทธิ์ O-NET / TGAT-TPAT (เสาร์-อาทิตย์)',
    date: '26 ก.ย. 2569',
    dateRaw: '2026-09-26',
    endDate: '27 ก.ย. 2569',
    category: 'ACADEMIC',
    categoryLabel: 'วิชาการ',
    location: 'ห้องประชุมเกียรติยศ',
    organizer: 'กลุ่มงานแนะแนวและฝ่ายวิชาการ',
    targetAudience: 'นักเรียนชั้น ม.3 และ ม.6',
    description: 'บรรยายพิเศษและฝึกทำข้อสอบเชิงลึกโดยวิทยากรผู้ทรงคุณวุฒิภายนอก',
    status: 'COMPLETED',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'act-5',
    title: 'สัปดาห์สอบปลายภาคเรียนที่ 1/2569 & ส่งผลการเรียน SGS',
    date: '2 ต.ค. 2569',
    dateRaw: '2026-10-02',
    endDate: '6 ต.ค. 2569',
    category: 'EXAM',
    categoryLabel: 'ประเมินและวัดผล',
    location: 'ทุกห้องสอบ & ระบบ SGS',
    organizer: 'ฝ่ายวิชาการและงานวัดผลประเมินผล',
    targetAudience: 'นักเรียนและคุณครูทุกท่าน',
    description: 'สอบปลายภาคและครูผู้สอนบันทึกคะแนนร้อยละ 100 เข้าสู่ระบบ SGS กลาง',
    status: 'ONGOING',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'act-6',
    title: 'การแข่งขันมหกรรมกีฬาสีภายใน "กุดจับเกมส์ 2569"',
    date: '14 ต.ค. 2569',
    dateRaw: '2026-10-14',
    endDate: '16 ต.ค. 2569',
    category: 'SPORTS',
    categoryLabel: 'กีฬาและนันทนาการ',
    location: 'สนามกีฬาใหญ่ โรงเรียนกุดจับประชาสรรค์',
    organizer: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา & สภานักเรียน',
    targetAudience: 'คณะครู บุคลากร และนักเรียนทุกสี',
    description: 'พิธีเปิด ขบวนพาเหรดตระการตา การประกวดกองเชียร์ ลีดเดอร์ และการแข่งขันกีฬา 8 ชนิด',
    status: 'UPCOMING',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'act-7',
    title: 'การประชุมผู้ปกครองชั้นเรียน (Classroom Meeting) ภาคเรียนที่ 2',
    date: '8 พ.ย. 2569',
    dateRaw: '2026-11-08',
    category: 'AFFAIRS',
    categoryLabel: 'กิจการนักเรียน',
    location: 'ห้องเรียนประจำชั้นทุกห้อง',
    organizer: 'กลุ่มบริหารงานกิจการนักเรียน & ครูที่ปรึกษา',
    targetAudience: 'ผู้ปกครองนักเรียน ม.1 - ม.6',
    description: 'รายงานผลการเรียนรายบุคคล ผลการดูแลช่วยเหลือนักเรียน (CCT/SDQ) และมอบเงินอุดหนุน',
    status: 'UPCOMING',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

const STORAGE_KEY_ACTIVITIES = 'kp_school_activity_events_v1';

interface AcademicTermsViewProps {
  onNavigateToSettings?: () => void;
  onNavigateToExams?: () => void;
}

export const AcademicTermsView: React.FC<AcademicTermsViewProps> = ({
  onNavigateToSettings,
  onNavigateToExams,
}) => {
  const [activeTerm, setActiveTerm] = useState<AcademicTermRecord>(() =>
    academicCalendarService.getActiveTerm()
  );
  const [activities, setActivities] = useState<SchoolActivityEvent[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      return raw ? JSON.parse(raw) : DEFAULT_SCHOOL_ACTIVITIES;
    } catch {
      return DEFAULT_SCHOOL_ACTIVITIES;
    }
  });

  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<Exclude<ActivityCategory, 'ALL'>>('ACADEMIC');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventOrganizer, setNewEventOrganizer] = useState('');
  const [newEventTarget, setNewEventTarget] = useState('นักเรียนทุกระดับชั้น');
  const [newEventDesc, setNewEventDesc] = useState('');

  useEffect(() => {
    const handleCalendarUpdate = () => {
      setActiveTerm(academicCalendarService.getActiveTerm());
    };
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    return () => window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
  }, []);

  const saveActivities = (items: SchoolActivityEvent[]) => {
    setActivities(items);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(items));
  };

  const filteredActivities = activities.filter((act) => {
    if (categoryFilter !== 'ALL' && act.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        act.title.toLowerCase().includes(term) ||
        act.location.toLowerCase().includes(term) ||
        act.organizer.toLowerCase().includes(term) ||
        act.description.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim()) return;

    const categoryMap: Record<Exclude<ActivityCategory, 'ALL'>, { label: string; badge: string }> = {
      ACADEMIC: { label: 'วิชาการ', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      DEVELOPMENT: { label: 'กิจกรรมพัฒนาผู้เรียน', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      SPORTS: { label: 'กีฬาและนันทนาการ', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
      AFFAIRS: { label: 'กิจการนักเรียน', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
      EXAM: { label: 'ประเมินและวัดผล', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    };

    const newAct: SchoolActivityEvent = {
      id: `act-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate.trim(),
      dateRaw: newEventDate.trim(),
      endDate: newEventEndDate.trim() || undefined,
      category: newEventCategory,
      categoryLabel: categoryMap[newEventCategory].label,
      location: newEventLocation.trim() || 'โรงเรียนกุดจับประชาสรรค์',
      organizer: newEventOrganizer.trim() || 'ฝ่ายวิชาการ',
      targetAudience: newEventTarget.trim() || 'นักเรียนทุกระดับชั้น',
      description: newEventDesc.trim() || 'กิจกรรมส่งเสริมการเรียนรู้ของโรงเรียน',
      status: 'UPCOMING',
      badgeColor: categoryMap[newEventCategory].badge,
    };

    const updated = [newAct, ...activities];
    saveActivities(updated);
    setIsAddModalOpen(false);

    // Reset Form
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventEndDate('');
    setNewEventLocation('');
    setNewEventOrganizer('');
    setNewEventDesc('');
  };

  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'ACADEMIC':
        return BookOpen;
      case 'DEVELOPMENT':
        return Compass;
      case 'SPORTS':
        return Trophy;
      case 'AFFAIRS':
        return Users;
      case 'EXAM':
        return Clock;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* 1. Notice Banner: Clarifying settings migration */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                ปฏิทินกิจกรรมโรงเรียน (School Activities & Events)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {activeTerm.termName}/{activeTerm.year}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {activeTerm.startDate} – {activeTerm.endDate}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              *การตั้งค่าปีการศึกษา, ภาคเรียน (เปิดเทอม-ปิดเทอม), วันหยุดพิเศษ และวันมาเรียนพิเศษ (เสาร์-อาทิตย์)
              ถูกแยกไปจัดการอย่างเป็นระเบียบในเมนู <strong>"ตั้งค่า" (Settings)</strong> เรียบร้อยแล้ว
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToExams && (
            <button
              type="button"
              onClick={onNavigateToExams}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>จัดการการสอบ & วัดผล (Exams)</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
            </button>
          )}
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>ไปที่ตั้งค่าปีการศึกษา</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ปฏิทินกิจกรรมและไทม์ไลน์โรงเรียน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ตารางนัดหมาย กิจกรรมพัฒนาผู้เรียน สัปดาห์สอบ และมหกรรมวิชาการตลอดภาคเรียน
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มกิจกรรมโรงเรียนใหม่</span>
        </button>
      </div>

      {/* 3. Search and Category Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม, สถานที่ หรือหน่วยงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Statistics Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full md:w-auto justify-between md:justify-end">
            <span>กิจกรรมทั้งหมด: <strong className="text-slate-800">{activities.length}</strong> รายการ</span>
            <span className="hidden sm:inline">•</span>
            <span>ที่กำลังจะมาถึง: <strong className="text-blue-600">{activities.filter(a => a.status === 'UPCOMING').length}</strong></span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
          {[
            { key: 'ALL', label: 'ทั้งหมด', count: activities.length },
            { key: 'ACADEMIC', label: 'วิชาการ', count: activities.filter(a => a.category === 'ACADEMIC').length },
            { key: 'DEVELOPMENT', label: 'พัฒนาผู้เรียน/ลูกเสือ', count: activities.filter(a => a.category === 'DEVELOPMENT').length },
            { key: 'EXAM', label: 'สัปดาห์สอบ/วัดผล', count: activities.filter(a => a.category === 'EXAM').length },
            { key: 'SPORTS', label: 'กีฬาและนันทนาการ', count: activities.filter(a => a.category === 'SPORTS').length },
            { key: 'AFFAIRS', label: 'กิจการนักเรียน', count: activities.filter(a => a.category === 'AFFAIRS').length },
          ].map((cat) => {
            const isSelected = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key as ActivityCategory)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-700/60 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Events Timeline Cards List */}
      {categoryFilter === 'EXAM' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                ตารางชุดข้อสอบและการวัดผล (3 รายการที่ลงทะเบียนไว้)
              </h4>
              <p className="text-xs text-slate-500">
                ศ23101 ศิลปะ (สอบกลางภาค, ปลายภาค) • ศ20221 ดนตรีปฏิบัติ 1 (สอบอ่านโน้ต)
              </p>
            </div>
          </div>
          {onNavigateToExams && (
            <button
              type="button"
              onClick={onNavigateToExams}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              เปิดระบบจัดการการสอบ (Exam Management) →
            </button>
          )}
        </div>
      )}

      <div className="space-y-3.5">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">ไม่พบกิจกรรมที่ตรงกับคำค้นหาหรือตัวกรอง</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่กิจกรรมอื่น</p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const IconComp = getCategoryIcon(act.category);
            const isOngoing = act.status === 'ONGOING';
            const isCompleted = act.status === 'COMPLETED';

            return (
              <div
                key={act.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm ${
                  isOngoing
                    ? 'border-l-4 border-l-blue-600 border-slate-200 bg-blue-50/15'
                    : isCompleted
                    ? 'border-slate-200/70 opacity-85'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                        isOngoing
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {act.title}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${act.badgeColor}`}>
                          {act.categoryLabel}
                        </span>
                        {isOngoing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                            กำลังจัดกิจกรรมสัปดาห์นี้
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            จัดกิจกรรมเรียบร้อยแล้ว
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {act.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                          <span>{act.date} {act.endDate ? `– ${act.endDate}` : ''}</span>
                        </span>
                        <span>•</span>
                        <span>สถานที่: <strong className="text-slate-600">{act.location}</strong></span>
                        <span>•</span>
                        <span>ผู้จัด: <span className="text-slate-600">{act.organizer}</span></span>
                        <span>•</span>
                        <span>กลุ่มเป้าหมาย: <span className="text-slate-600">{act.targetAudience}</span></span>
                      </div>

                      {act.category === 'EXAM' && onNavigateToExams && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={onNavigateToExams}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>เปิดระบบจัดการการสอบ & บันทึกคะแนน (Exam Management)</span>
                            <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2 text-xs">
                    <span
                      className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                        isOngoing
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {act.status === 'ONGOING'
                        ? 'กำลังดำเนินการ'
                        : act.status === 'COMPLETED'
                        ? 'เสร็จสิ้น'
                        : 'เตรียมจัด'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modal: Add New School Activity Event */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    เพิ่มกิจกรรมโรงเรียนใหม่
                  </h3>
                  <p className="text-xs text-slate-400">
                    บันทึกหมายกำหนดการ ค่าย กีฬา หรือนิทรรศการวิชาการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อกิจกรรม / ชื่องาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มหกรรมเปิดโลกวิชาการ, สัปดาห์สอบกลางภาค"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่จัดงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 15 ต.ค. 2569"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ถึงวันที่ (กรณีหลายวัน)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 17 ต.ค. 2569"
                    value={newEventEndDate}
                    onChange={(e) => setNewEventEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หมวดหมู่กิจกรรม
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) =>
                      setNewEventCategory(
                        e.target.value as Exclude<ActivityCategory, 'ALL'>
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  >
                    <option value="ACADEMIC">วิชาการ</option>
                    <option value="DEVELOPMENT">กิจกรรมพัฒนาผู้เรียน</option>
                    <option value="SPORTS">กีฬาและนันทนาการ</option>
                    <option value="AFFAIRS">กิจการนักเรียน</option>
                    <option value="EXAM">ประเมินและวัดผล</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    สถานที่จัดงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น หอประชุมใหญ่, สนามกีฬา"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หน่วยงาน / ผู้รับผิดชอบ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กลุ่มสาระการเรียนรู้..."
                    value={newEventOrganizer}
                    onChange={(e) => setNewEventOrganizer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    กลุ่มเป้าหมาย
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักเรียนทุกระดับชั้น"
                    value={newEventTarget}
                    onChange={(e) => setNewEventTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รายละเอียดกิจกรรม
                </label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดกำหนดการและเป้าหมายกิจกรรม..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
