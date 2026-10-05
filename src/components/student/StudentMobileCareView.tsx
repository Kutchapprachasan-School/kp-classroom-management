import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Calendar,
  Smile,
  Frown,
  Clock,
  Award,
  AlertTriangle,
  MoreHorizontal,
  Heart,
  Edit3,
  ArrowRight,
  Sparkles,
  Smartphone,
  Monitor,
  Check,
  Megaphone,
  Shield,
  Info,
  LogOut,
  KeyRound,
  CheckCircle2,
  Apple,
} from 'lucide-react';
import { PixelPet } from '../common/PixelPet';

export type MobileScreenKey =
  | 'dashboard'
  | 'roster'
  | 'detail'
  | 'behavior-log'
  | 'trophy'
  | 'mental-health'
  | 'notifications'
  | 'reports'
  | 'settings';

interface StudentRosterItem {
  id: string;
  no: number;
  name: string;
  code: string;
  status: 'NORMAL' | 'RISK' | 'FOLLOWUP';
  statusLabel: string;
  avatar: string;
  gender: 'female' | 'male';
  birthDate: string;
  age: number;
  address: string;
  guardian: string;
  guardianRelation: string;
  phone: string;
}

const MOCK_STUDENTS: StudentRosterItem[] = [
  {
    id: 's-1',
    no: 1,
    name: 'ด.ญ. ปรียากานต์ ชัยแก้ว',
    code: '10321',
    status: 'NORMAL',
    statusLabel: 'ปกติ',
    avatar: '👧',
    gender: 'female',
    birthDate: '12 ม.ค. 2553',
    age: 16,
    address: '142/8 หมู่ 4 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นางสาวจิดาภา ชัยแก้ว',
    guardianRelation: 'มารดา',
    phone: '081-234-5678',
  },
  {
    id: 's-2',
    no: 2,
    name: 'ด.ช. กฤษณะ ศรีสมบูรณ์',
    code: '10322',
    status: 'RISK',
    statusLabel: 'เสี่ยง',
    avatar: '👦',
    gender: 'male',
    birthDate: '05 มี.ค. 2553',
    age: 16,
    address: '88/1 หมู่ 2 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นายสมพร ศรีสมบูรณ์',
    guardianRelation: 'บิดา',
    phone: '089-876-5432',
  },
  {
    id: 's-3',
    no: 3,
    name: 'ด.ญ. กัญญารัตน์ โพธิ์ทอง',
    code: '10323',
    status: 'NORMAL',
    statusLabel: 'ปกติ',
    avatar: '👧',
    gender: 'female',
    birthDate: '19 ก.ย. 2553',
    age: 15,
    address: '56 หมู่ 1 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นางปราณี โพธิ์ทอง',
    guardianRelation: 'มารดา',
    phone: '084-555-1234',
  },
  {
    id: 's-4',
    no: 4,
    name: 'ด.ช. ชัยวัฒน์ บุญมี',
    code: '10324',
    status: 'RISK',
    statusLabel: 'เสี่ยง',
    avatar: '👦',
    gender: 'male',
    birthDate: '11 ก.ค. 2553',
    age: 16,
    address: '12/3 หมู่ 3 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นางสมศรี บุญมี',
    guardianRelation: 'มารดา',
    phone: '082-333-7788',
  },
  {
    id: 's-5',
    no: 5,
    name: 'ด.ญ. ณัฐริกา แสนสุข',
    code: '10325',
    status: 'NORMAL',
    statusLabel: 'ปกติ',
    avatar: '👧',
    gender: 'female',
    birthDate: '28 ต.ค. 2553',
    age: 15,
    address: '99/4 หมู่ 5 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นายสุรชัย แสนสุข',
    guardianRelation: 'บิดา',
    phone: '086-444-9911',
  },
  {
    id: 's-6',
    no: 6,
    name: 'ด.ช. ธนกร วงศ์คำ',
    code: '10326',
    status: 'NORMAL',
    statusLabel: 'ปกติ',
    avatar: '👦',
    gender: 'male',
    birthDate: '14 ธ.ค. 2553',
    age: 15,
    address: '33/2 หมู่ 2 ต.ขุนพร อ.เมือง จ.เชียงใหม่ 50200',
    guardian: 'นางอัมพร วงศ์คำ',
    guardianRelation: 'มารดา',
    phone: '085-777-6655',
  },
];

interface StudentMobileCareViewProps {
  initialScreen?: MobileScreenKey;
  onExit?: () => void;
}

export const StudentMobileCareView: React.FC<StudentMobileCareViewProps> = ({
  initialScreen = 'dashboard',
  onExit,
}) => {
  const [currentScreen, setCurrentScreen] = useState<MobileScreenKey>(initialScreen);
  const [isMobileFrameMode, setIsMobileFrameMode] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterItem>(MOCK_STUDENTS[0]);

  // Screen 3 Detail Tab: GENERAL | BEHAVIOR | ACTIVITIES
  const [detailTab, setDetailTab] = useState<'GENERAL' | 'BEHAVIOR' | 'ACTIVITIES'>('GENERAL');

  // Screen 4 Behavior Logging State
  const [selectedBehaviorStatus, setSelectedBehaviorStatus] = useState<number>(0);
  const [behaviorNote, setBehaviorNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Screen 6 Mental Health State
  const [selectedMood, setSelectedMood] = useState<number>(0); // 0=สุข, 1=เฉย, 2=เครียด, 3=เศร้า, 4=โกรธ
  const [mentalHealthNote, setMentalHealthNote] = useState('');

  // Screen 7 Notification Filter
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'ACTIVITY' | 'STUDENT'>('ALL');

  // Screen 5 Pet Stats
  const [petHappiness, setPetHappiness] = useState(85);
  const [petName, setPetName] = useState('น้องเขียว');
  const [isEditingPetName, setIsEditingPetName] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveBehavior = () => {
    showToast(`✓ บันทึกพฤติกรรม "${selectedStudent.name}" เรียบร้อยแล้ว`);
    setTimeout(() => setCurrentScreen('detail'), 1200);
  };

  const handleSaveMentalHealth = () => {
    showToast('✓ บันทึกการเช็คอินความรู้สึกวันนี้เรียบร้อยแล้ว');
    setTimeout(() => setCurrentScreen('dashboard'), 1200);
  };

  const handleFeedMobilePet = () => {
    setPetHappiness(100);
    showToast('🍏 ป้อนอาหารน้องเขียวเรียบร้อย! ความสุขเต็ม 100%');
  };

  // Navigations
  const goToStudentDetail = (stu: StudentRosterItem) => {
    setSelectedStudent(stu);
    setCurrentScreen('detail');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 px-2 sm:px-4 font-sans select-none text-slate-800">
      {/* Top Helper Controller (สลับพรีวิว 390px Mobile Frame กับ Full Responsive) */}
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-2xl p-3 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C6D5B] animate-pulse" />
          <span className="font-extrabold text-slate-900">
            ระบบดูแลช่วยเหลือนักเรียน (คำยางพิทยา)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#0C6D5B] font-bold">
            9 หน้าจอ Mobile-First
          </span>
        </div>

        {/* Quick Screen Selectors */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
          {[
            { key: 'dashboard', label: '1. หน้าแรก' },
            { key: 'roster', label: '2. รายชื่อ' },
            { key: 'detail', label: '3. ข้อมูล' },
            { key: 'behavior-log', label: '4. พฤติกรรม' },
            { key: 'trophy', label: '5. ห้องรางวัล' },
            { key: 'mental-health', label: '6. สุขภาพจิต' },
            { key: 'notifications', label: '7. แจ้งเตือน' },
            { key: 'reports', label: '8. สถิติ' },
            { key: 'settings', label: '9. ตั้งค่า' },
          ].map((sc) => (
            <button
              key={sc.key}
              onClick={() => setCurrentScreen(sc.key as MobileScreenKey)}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
                currentScreen === sc.key
                  ? 'bg-[#0C6D5B] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Viewport Frame Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMobileFrameMode(!isMobileFrameMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition-colors"
          >
            {isMobileFrameMode ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#0C6D5B]" />
                <span>ขยายเต็มจอ PC/แท็บเล็ต</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#0C6D5B]" />
                <span>กรอบมือถือ 390px</span>
              </>
            )}
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
            >
              ปิดพรีวิว
            </button>
          )}
        </div>
      </div>

      {/* Main Container (Mobile Frame 390px vs Responsive) */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrameMode
            ? 'max-w-[400px] rounded-[44px] shadow-2xl border-[10px] border-slate-800 bg-white overflow-hidden my-auto'
            : 'max-w-4xl rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden'
        }`}
        style={{ minHeight: isMobileFrameMode ? '780px' : 'auto' }}
      >
        {/* Device Notch & Status bar (เฉพาะในโหมดกรอบมือถือ) */}
        {isMobileFrameMode && (
          <div className="bg-slate-900 text-white px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black rounded-full" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-white rounded-xs p-0.5">
                <div className="w-full h-full bg-white" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 1: Dashboard (นางสาวสวยเลิศ ม.3/8)
            ======================================================== */}
        {currentScreen === 'dashboard' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0C6D5B]">
                  ม.ป.ส. โรงเรียนคำยางพิทยา
                </span>
                <h1 className="text-sm font-extrabold text-slate-900">
                  ระบบดูแลช่วยเหลือนักเรียน
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('notifications')}
                  className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                </button>
                <div
                  onClick={() => setCurrentScreen('settings')}
                  className="w-8 h-8 rounded-full bg-[#0C6D5B] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
                >
                  สล
                </div>
              </div>
            </div>

            {/* Hero Green Card */}
            <div className="bg-[#0C6D5B] text-white rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-xs text-teal-100">
                  สวัสดีครับ/ค่ะ
                </span>
                <h2 className="text-lg font-black mt-0.5">
                  นางสาวสวยเลิศ (ครูประจำชั้น)
                </h2>
                <p className="text-xs text-teal-200 mt-1">
                  ภาคเรียนที่ 1/2569
                </p>
              </div>
            </div>

            {/* Summary Card (ม.3/8) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    ชั้นมัธยมศึกษาปีที่ 3/8
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ดูแลนักเรียนในความรับผิดชอบ
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0C6D5B]">ม.3/8</span>
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">นักเรียนทั้งหมด</span>
                  <span className="text-sm font-black text-slate-900">32 คน</span>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-orange-200/80 shadow-2xs">
                  <span className="text-[10px] text-orange-600 font-bold block">เสี่ยง/ต้องติดตาม</span>
                  <span className="text-sm font-black text-orange-600">5 คน</span>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-bold block">ปกติ</span>
                  <span className="text-sm font-black text-emerald-700">27 คน</span>
                </div>
              </div>
            </div>

            {/* 5 Core Menus (Chevron List matching Mockup 1) */}
            <div className="space-y-2 pt-1">
              {[
                { title: 'ข้อมูลนักเรียน', desc: 'รายชื่อและข้อมูลส่วนตัว 32 คน', screen: 'roster' },
                { title: 'กิจกรรม/เช็คอิน', desc: 'เช็คอินความรู้สึกและกิจกรรมพัฒนาผู้เรียน', screen: 'mental-health' },
                { title: 'บันทึกพฤติกรรม', desc: 'บันทึกการมาเรียน ขาด สาย พฤติกรรมเสี่ยง', screen: 'behavior-log' },
                { title: 'รายงาน/สถิติ', desc: 'สรุปภาพรวมพฤติกรรมประจำภาคเรียน', screen: 'reports' },
                { title: 'ตั้งค่า', desc: 'จัดการบัญชีและห้องที่รับผิดชอบ', screen: 'settings' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentScreen(item.screen as MobileScreenKey)}
                  className="bg-white border border-slate-200/80 hover:border-[#0C6D5B] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0C6D5B] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0C6D5B] group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 2: รายชื่อนักเรียน (32 คน)
            ======================================================== */}
        {currentScreen === 'roster' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>รายชื่อนักเรียน</span>
              </button>
              <span className="text-[11px] font-bold text-[#0C6D5B] bg-teal-50 px-2.5 py-0.5 rounded-full">
                32 คน
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="ค้นหานักเรียน / เลขที่ / ห้อง"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0C6D5B]"
              />
            </div>

            {/* Filter Pill */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0C6D5B] text-white text-xs font-bold shadow-2xs">
                <span>ชั้น ม.3/8</span>
                <span className="text-[10px]">▼</span>
              </div>
              <span className="text-[11px] text-slate-400">เรียงตามเลขที่ 1-32</span>
            </div>

            {/* Student List */}
            <div className="space-y-2">
              {MOCK_STUDENTS.map((stu) => (
                <div
                  key={stu.id}
                  onClick={() => goToStudentDetail(stu)}
                  className="bg-white border border-slate-200/80 hover:border-[#0C6D5B] rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stu.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {stu.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                            stu.status === 'RISK'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stu.statusLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        เลขที่ {stu.no} · รหัส {stu.code}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 3: ข้อมูลนักเรียน (Profile Detail)
            ======================================================== */}
        {currentScreen === 'detail' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('roster')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ข้อมูลนักเรียน</span>
              </button>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  selectedStudent.status === 'RISK'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                สถานะ: {selectedStudent.statusLabel}
              </span>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0C6D5B] text-3xl flex items-center justify-center mx-auto shadow-2xs">
                {selectedStudent.avatar}
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  {selectedStudent.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลขที่ {selectedStudent.no} | ชั้น ม.3/8
                </p>
              </div>
            </div>

            {/* 3 Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setDetailTab('GENERAL')}
                className={`py-2 rounded-xl transition-all ${
                  detailTab === 'GENERAL'
                    ? 'bg-white text-[#0C6D5B] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ข้อมูลทั่วไป
              </button>
              <button
                onClick={() => setDetailTab('BEHAVIOR')}
                className={`py-2 rounded-xl transition-all ${
                  detailTab === 'BEHAVIOR'
                    ? 'bg-white text-[#0C6D5B] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                พฤติกรรม
              </button>
              <button
                onClick={() => setDetailTab('ACTIVITIES')}
                className={`py-2 rounded-xl transition-all ${
                  detailTab === 'ACTIVITIES'
                    ? 'bg-white text-[#0C6D5B] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                บันทึก/กิจกรรม
              </button>
            </div>

            {/* Tab 1 Content: ข้อมูลทั่วไป (ตรงตาม Screen 3 เป๊ะ) */}
            {detailTab === 'GENERAL' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">เลขประจำตัว</span>
                  <span className="font-bold text-slate-900">{selectedStudent.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">วันเกิด</span>
                  <span className="font-bold text-slate-900">
                    {selectedStudent.birthDate} (อายุ {selectedStudent.age} ปี)
                  </span>
                </div>
                <div className="space-y-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 block">ที่อยู่</span>
                  <span className="font-bold text-slate-900 leading-relaxed block">
                    {selectedStudent.address}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block">ผู้ปกครอง</span>
                  <span className="font-bold text-slate-900 block">
                    {selectedStudent.guardian} ({selectedStudent.guardianRelation})
                  </span>
                  <span className="text-[#0C6D5B] font-bold block">
                    📞 {selectedStudent.phone}
                  </span>
                </div>
              </div>
            )}

            {detailTab === 'BEHAVIOR' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">ประวัติพฤติกรรมล่าสุด</h4>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-medium">
                  ✓ มาเรียนสม่ำเสมอ ร่วมกิจกรรมตรงเวลา
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600">
                  สถิติการมาเรียน: 94.5% (ขาด 1 วัน, ป่วย 1 วัน)
                </div>
              </div>
            )}

            {detailTab === 'ACTIVITIES' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">กิจกรรมที่เข้าร่วม</h4>
                <p className="text-slate-600">✓ กิจกรรมวันไหว้ครู (ฝ่ายจัดเตรียมสถานที่)</p>
                <p className="text-slate-600">✓ เช็คอินสุขภาพจิต 4 สัปดาห์ต่อเนื่อง</p>
              </div>
            )}

            {/* Bottom 2 Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('behavior-log')}
                className="w-full py-3 rounded-2xl bg-[#0C6D5B] hover:bg-[#095748] text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>บันทึกพฤติกรรม</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('เปิดประวัติทั้งหมดของนักเรียน')}
                className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                ดูประวัติทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 4: บันทึกพฤติกรรม (Behavior Logging)
            ======================================================== */}
        {currentScreen === 'behavior-log' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('detail')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>บันทึกพฤติกรรม</span>
              </button>
              <span className="text-xs font-bold text-slate-700">
                {selectedStudent.name}
              </span>
            </div>

            {/* Date Picker Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#0C6D5B]" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">วันที่บันทึก</span>
                <span className="font-bold text-slate-900">จันทร์ที่ 12 พ.ค. 2569</span>
              </div>
            </div>

            {/* 6 Behavior Status Grid (2x3 Grid matching Mockup 4) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกสถานะพฤติกรรม
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 0, label: 'มาเรียน', icon: Smile, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                  { id: 1, label: 'ขาดเรียน', icon: Frown, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
                  { id: 2, label: 'สาย', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
                  { id: 3, label: 'พฤติกรรมดี', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
                  { id: 4, label: 'พฤติกรรมเสี่ยง', icon: AlertTriangle, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
                  { id: 5, label: 'อื่นๆ', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedBehaviorStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBehaviorStatus(item.id)}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? `${item.bg} ring-2 ring-[#0C6D5B] font-black shadow-2xs`
                          : 'bg-white border-slate-200 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-xs text-slate-800">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note text area (0/200) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">หมายเหตุ (ถ้ามี)</label>
                <span className="text-slate-400 text-[11px]">{behaviorNote.length}/200</span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={behaviorNote}
                onChange={(e) => setBehaviorNote(e.target.value)}
                placeholder="เช่น วันนี้มีอาการเหนื่อย ไม่ค่อยมีสมาธิ"
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-[#0C6D5B] leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSaveBehavior}
              className="w-full py-3.5 rounded-2xl bg-[#0C6D5B] hover:bg-[#095748] text-white font-extrabold text-xs shadow-md shadow-teal-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>บันทึก</span>
            </button>
          </div>
        )}

        {/* ========================================================
            SCREEN 5: ห้องรางวัล & สัตว์เลี้ยง (Mobile Version)
            ======================================================== */}
        {currentScreen === 'trophy' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ห้องรางวัล & สัตว์เลี้ยง</span>
              </button>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                เลเวล 4
              </span>
            </div>

            {/* Pet Card */}
            <div className="bg-gradient-to-b from-emerald-50/80 to-white border border-emerald-200 rounded-3xl p-5 text-center space-y-3 shadow-2xs">
              <div className="p-3 bg-white/90 rounded-2xl border border-emerald-200 w-28 h-28 mx-auto flex items-center justify-center shadow-xs">
                <PixelPet size={84} />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  {isEditingPetName ? (
                    <input
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      onBlur={() => setIsEditingPetName(false)}
                      className="text-base font-black text-slate-900 border-b border-emerald-500 bg-white px-1 text-center"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-base font-extrabold text-slate-900">
                      {petName}
                    </h3>
                  )}
                  <button
                    onClick={() => setIsEditingPetName(!isEditingPetName)}
                    className="p-1 text-slate-400 hover:text-emerald-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  เพื่อนคู่ใจในการเรียนรู้
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>เลเวล 4</span>
                  <span>650 / 1,000 XP</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0C6D5B] h-full rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-4 text-xs font-bold pt-1">
                <span className="flex items-center gap-1 text-rose-600">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  ความสุข {petHappiness}%
                </span>
                <span
                  onClick={handleFeedMobilePet}
                  className="flex items-center gap-1 text-emerald-700 cursor-pointer hover:underline"
                  title="คลิกเพื่อให้อาหาร"
                >
                  <Apple className="w-3.5 h-3.5" />
                  อาหาร: เพียงพอ
                </span>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={() => showToast('เปิดรายการภารกิจสัตว์เลี้ยง')}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>ดูภารกิจสัตว์เลี้ยง</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-extrabold text-slate-900">เหรียญตราความสำเร็จ</h4>
                <button
                  type="button"
                  onClick={() => showToast('ดูเหรียญตราทั้งหมด')}
                  className="text-[#0C6D5B] font-bold"
                >
                  ดูทั้งหมด -&gt;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <p className="font-bold text-slate-900">ส่งงานครบครั้งแรก</p>
                  <p className="text-[10px] text-slate-400">ปลดล็อกแล้ว</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <p className="font-bold text-slate-900">คะแนนเต็มวิชา (คณิต)</p>
                  <p className="text-[10px] text-slate-400">ปลดล็อกแล้ว</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 6: สุขภาพจิตและสังคม (Mental Health Check-in)
            ======================================================== */}
        {currentScreen === 'mental-health' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>สุขภาพจิตและสังคม</span>
              </button>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                เช็คอินอารมณ์
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-slate-900">
                เช็คอินความรู้สึกวันนี้
              </h2>
              <p className="text-xs text-slate-500">
                บอกเล่าความรู้สึกและอารมณ์ของคุณครู/นักเรียนวันนี้ เพื่อการดูแลอย่างเข้าใจ
              </p>
            </div>

            {/* 5 Mood Levels (Horizontal / Grid matching Mockup 6) */}
            <div className="grid grid-cols-5 gap-1.5 pt-2">
              {[
                { id: 0, label: 'มีความสุข', emoji: '😄', bg: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
                { id: 1, label: 'เฉยๆ', emoji: '🙂', bg: 'bg-teal-50 border-teal-300 text-teal-800' },
                { id: 2, label: 'เครียด', emoji: '😓', bg: 'bg-amber-50 border-amber-300 text-amber-800' },
                { id: 3, label: 'เศร้า', emoji: '😢', bg: 'bg-orange-50 border-orange-300 text-orange-800' },
                { id: 4, label: 'โกรธ', emoji: '😡', bg: 'bg-rose-50 border-rose-300 text-rose-800' },
              ].map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(mood.id)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${mood.bg} ring-2 ring-[#0C6D5B] shadow-2xs font-black scale-105`
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-[10px] font-bold whitespace-nowrap">
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Message Area */}
            <div className="space-y-1.5 pt-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">ข้อความถึงครู (ถ้ามี)</label>
                <span className="text-slate-400 text-[11px]">{mentalHealthNote.length}/200</span>
              </div>
              <textarea
                rows={4}
                maxLength={200}
                value={mentalHealthNote}
                onChange={(e) => setMentalHealthNote(e.target.value)}
                placeholder="อยากบอกอะไรครูไหม..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-[#0C6D5B] leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSaveMentalHealth}
              className="w-full py-3.5 rounded-2xl bg-[#0C6D5B] hover:bg-[#095748] text-white font-extrabold text-xs shadow-md shadow-teal-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>บันทึก</span>
            </button>
          </div>
        )}

        {/* ========================================================
            SCREEN 7: แจ้งเตือน (Notifications)
            ======================================================== */}
        {currentScreen === 'notifications' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>แจ้งเตือน</span>
              </button>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                4 รายการ
              </span>
            </div>

            {/* 3 Filter Chips (ตรงตาม Screen 7 เป๊ะ) */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                onClick={() => setNotifFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  notifFilter === 'ALL'
                    ? 'bg-[#0C6D5B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setNotifFilter('ACTIVITY')}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  notifFilter === 'ACTIVITY'
                    ? 'bg-[#0C6D5B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                กิจกรรม
              </button>
              <button
                onClick={() => setNotifFilter('STUDENT')}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  notifFilter === 'STUDENT'
                    ? 'bg-[#0C6D5B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ข้อมูลนักเรียน
              </button>
            </div>

            {/* Notification Cards */}
            <div className="space-y-2.5">
              {/* Notif 1 */}
              <div className="p-3 bg-white border border-rose-100 rounded-2xl flex items-start gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    แจ้งเตือนพฤติกรรมเสี่ยง
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    ด.ช. กฤษณะ ศรีสมบูรณ์ ขาดเรียนติดต่อกัน 3 วัน
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">2 ชม. ที่แล้ว</span>
                </div>
              </div>

              {/* Notif 2 */}
              <div className="p-3 bg-white border border-sky-100 rounded-2xl flex items-start gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    กิจกรรมโรงเรียน
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    เชิญร่วมกิจกรรมวันแม่แห่งชาติ ณ หอประชุมโรงเรียน
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">5 ชม. ที่แล้ว</span>
                </div>
              </div>

              {/* Notif 3 */}
              <div className="p-3 bg-white border border-emerald-100 rounded-2xl flex items-start gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    ได้รับรางวัล
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    ด.ญ. ปรียากานต์ ได้รับเหรียญตรา &ldquo;ความมีน้ำใจ&rdquo;
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">1 วันที่แล้ว</span>
                </div>
              </div>

              {/* Notif 4 */}
              <div className="p-3 bg-white border border-purple-100 rounded-2xl flex items-start gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    ระบบอัปเดต
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    ระบบดูแลช่วยเหลือนักเรียน เวอร์ชัน 1.2.0 พร้อมใช้งาน
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">2 วันที่แล้ว</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 8: รายงานและสถิติ (Reports & Analytics)
            ======================================================== */}
        {currentScreen === 'reports' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>รายงานและสถิติ</span>
              </button>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0C6D5B] bg-teal-50 px-2.5 py-1 rounded-xl">
                <span>ภาคเรียนที่ 1/2569</span>
                <span className="text-[10px]">▼</span>
              </div>
            </div>

            {/* Summary Card (ม.3/8) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">
                สรุปภาพรวมชั้น ม.3/8
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white rounded-2xl p-2.5 border border-emerald-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] block">ปกติ</span>
                  <span className="text-base font-black text-emerald-700">27</span>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-orange-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] block">เสี่ยง</span>
                  <span className="text-base font-black text-orange-600">5</span>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-[10px] block">ต้องติดตาม</span>
                  <span className="text-base font-black text-slate-600">0</span>
                </div>
              </div>
            </div>

            {/* Progress Bars (Popular Behaviors) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-4 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900">
                สถิติพฤติกรรมยอดนิยม
              </h4>

              {/* Bar 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>มาเรียน</span>
                  <span className="text-[#0C6D5B]">84%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#0C6D5B] h-full rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              {/* Bar 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>พฤติกรรมดี</span>
                  <span className="text-emerald-600">72%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }} />
                </div>
              </div>

              {/* Bar 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>พฤติกรรมเสี่ยง</span>
                  <span className="text-orange-500">12%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 9: ตั้งค่า (Settings)
            ======================================================== */}
        {currentScreen === 'settings' && (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
            {/* Header with Back */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ตั้งค่า</span>
              </button>
            </div>

            {/* Settings Menu List (ตรงตาม Screen 9 เป๊ะ) */}
            <div className="space-y-2">
              <div
                onClick={() => showToast('ข้อมูลส่วนตัวครูสวยเลิศ')}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">ข้อมูลส่วนตัว</h4>
                  <p className="text-[11px] text-slate-400">ครู ประจำชั้น (นางสาวสวยเลิศ)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => showToast('ชั้นที่รับผิดชอบ: ม.3/8')}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">ชั้นที่รับผิดชอบ</h4>
                  <p className="text-[11px] text-slate-400">มัธยมศึกษาปีที่ 3/8</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => showToast('การแจ้งเตือน: เปิดใช้งาน')}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">การแจ้งเตือน</h4>
                  <p className="text-[11px] text-emerald-600 font-semibold">เปิดใช้งาน</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => showToast('เปิดหน้าต่างเปลี่ยนรหัสผ่าน')}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  showToast('ออกจากระบบเรียบร้อย');
                  setTimeout(() => onExit?.(), 1000);
                }}
                className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-rose-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-rose-600">ออกจากระบบ</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            BOTTOM NAVIGATION 4 TABS (แสดงตลอดทั้ง 9 หน้าจอ)
            ======================================================== */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2 flex items-center justify-around z-20">
          <button
            type="button"
            onClick={() => setCurrentScreen('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              currentScreen === 'dashboard'
                ? 'text-[#0C6D5B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>หน้าหลัก</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('roster')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              currentScreen === 'roster' || currentScreen === 'detail'
                ? 'text-[#0C6D5B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-base">👥</span>
            <span>นักเรียน</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('reports')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              currentScreen === 'reports' || currentScreen === 'trophy' || currentScreen === 'mental-health'
                ? 'text-[#0C6D5B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-base">📊</span>
            <span>กิจกรรม/รายงาน</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('settings')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              currentScreen === 'settings'
                ? 'text-[#0C6D5B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>ตั้งค่า</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
