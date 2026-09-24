import React, { useState } from 'react';
import {
  Building2,
  GraduationCap,
  BookOpen,
  LogIn,
  KeyRound,
  QrCode,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { authService } from '../services/authService';

export type TeacherLoginChannel = 'E_LEAVE' | 'DIRECT_CLASSROOM';

interface SchoolPortalViewProps {
  onEnterClassroomPortal: (targetView?: string, channel?: TeacherLoginChannel) => void;
  onEnterStudentPortal: () => void;
}

export const SchoolPortalView: React.FC<SchoolPortalViewProps> = ({
  onEnterClassroomPortal,
  onEnterStudentPortal,
}) => {
  // Primary Role Tab: 'TEACHER' vs 'STUDENT'
  const [roleTab, setRoleTab] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  // Teacher's 2 Login Methods: 'E_LEAVE' (ผ่านระบบการลา E-Leave) vs 'DIRECT_CLASSROOM' (จากระบบจัดการชั้นเรียนโดยตรง)
  const [teacherMethod, setTeacherMethod] = useState<TeacherLoginChannel>('E_LEAVE');

  // Form states for Teacher
  const [teacherUsername, setTeacherUsername] = useState('pasphum@school.ac.th');
  const [teacherPassword, setTeacherPassword] = useState('••••••••');

  // Form states for Student (Classroom Management only)
  const [studentCode, setStudentCode] = useState('45102');
  const [studentPin, setStudentPin] = useState('2510');

  // Handle Teacher Login -> Goes DIRECTLY to Classroom Management System ('home')
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.loginTeacher(teacherUsername, teacherPassword);
    onEnterClassroomPortal('home', teacherMethod);
  };

  // Handle Quick E-Leave Token Pass-through -> Goes DIRECTLY to Classroom Management System ('home')
  const handleELeaveSsoClick = async () => {
    await authService.loginTeacher(teacherUsername, 'e-leave-sso-token');
    onEnterClassroomPortal('home', 'E_LEAVE');
  };

  // Handle Student Login -> Goes DIRECTLY to Classroom Management Student Portal
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.loginStudent(studentCode, studentPin);
      onEnterStudentPortal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง';
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1f42] via-[#0f2e5c] to-[#1e3a8a] flex items-center justify-center p-4 font-sans select-none">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/20 animate-fade-in">
        {/* Left Side: Classroom Management System Branding */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0f2a59] to-[#163d7a] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-300/30 rounded-full text-xs font-semibold text-amber-200">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Classroom Management System</span>
            </div>

            <h1 className="text-2xl font-bold leading-snug">
              ระบบจัดการชั้นเรียนและวัดผลการศึกษา
            </h1>
            <p className="text-xs text-blue-100/85 leading-relaxed">
              โรงเรียนหางดงรัฐราษฎร์อุปถัมภ์ • บริหารจัดการเวลาเรียน เช็คชื่อรายคาบ มอบหมายงาน ตัดเกรด 8 ระดับ (SGS) และรายงานผลสัมฤทธิ์ SAR
            </p>
          </div>

          {/* Dynamic Info Box based on Role Tab */}
          {roleTab === 'TEACHER' ? (
            <div className="space-y-3 my-8 relative z-10 text-xs">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                สำหรับครูผู้สอน (รองรับ 2 ช่องทาง)
              </div>
              <div
                onClick={() => setTeacherMethod('E_LEAVE')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  teacherMethod === 'E_LEAVE'
                    ? 'bg-white/20 border-amber-300 shadow-sm'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>1. เข้าผ่านระบบการลา (E-Leave)</span>
                    {teacherMethod === 'E_LEAVE' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </div>
                  <div className="text-[11px] text-blue-100/80 mt-0.5">
                    เชื่อมสิทธิ์ Portal จากระบบการลาออนไลน์ (รองรับการขยายเป็น School Management)
                  </div>
                </div>
              </div>

              <div
                onClick={() => setTeacherMethod('DIRECT_CLASSROOM')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  teacherMethod === 'DIRECT_CLASSROOM'
                    ? 'bg-white/20 border-blue-300 shadow-sm'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <KeyRound className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>2. เข้าจากระบบจัดการชั้นเรียนโดยตรง</span>
                    {teacherMethod === 'DIRECT_CLASSROOM' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </div>
                  <div className="text-[11px] text-blue-100/80 mt-0.5">
                    ล็อกอินด้วยชื่อผู้ใช้และรหัสผ่านของระบบจัดการชั้นเรียนโดยตรง
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 my-8 relative z-10 text-xs">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                สำหรับนักเรียน (เฉพาะระบบจัดการชั้นเรียน)
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-200 text-sm">
                  <GraduationCap className="w-5 h-5" />
                  <span>พอร์ทัลนักเรียน • ห้องเรียนผจญภัย</span>
                </div>
                <p className="text-[11px] text-blue-100/90 leading-relaxed">
                  นักเรียนสามารถเข้าใช้งานเฉพาะส่วนของระบบจัดการชั้นเรียน เพื่อส่งการบ้าน ตรวจสอบคะแนน เวลาเรียน และทำภารกิจสะสมแต้ม XP
                </p>
              </div>
            </div>
          )}

          <div className="text-[11px] text-blue-200/70 relative z-10">
            © 2569 โรงเรียนหางดงรัฐราษฎร์อุปถัมภ์ • สพม.เชียงใหม่
          </div>
        </div>

        {/* Right Side: Login Form -> Enters Classroom Management Directly */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                เข้าสู่ระบบจัดการชั้นเรียน
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อเข้าสู่ระบบแล้วจะเข้าถึงหน้าจัดการชั้นเรียนทันทีโดยไม่มีหน้าคั่น
              </p>
            </div>

            {/* Primary Role Switcher: ครูผู้สอน vs นักเรียน */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setRoleTab('TEACHER')}
                className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  roleTab === 'TEACHER'
                    ? 'bg-[#0f2a59] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>สำหรับครูผู้สอน (2 ช่องทาง)</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('STUDENT')}
                className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  roleTab === 'STUDENT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>สำหรับนักเรียน (ชั้นเรียนเท่านั้น)</span>
              </button>
            </div>

            {/* ==============================================================
                ROLE 1: TEACHER LOGIN (2 METHODS: E-LEAVE vs DIRECT CLASSROOM)
               ============================================================== */}
            {roleTab === 'TEACHER' ? (
              <div className="space-y-5">
                {/* Method Selector Sub-Tabs for Teacher */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setTeacherMethod('E_LEAVE')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      teacherMethod === 'E_LEAVE'
                        ? 'bg-amber-50/80 border-amber-400 text-slate-900 ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0f2a59] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>แบบที่ 1: เข้าผ่านระบบการลา</span>
                      </span>
                      {teacherMethod === 'E_LEAVE' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Portal จากระบบ E-Leave (School Management)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeacherMethod('DIRECT_CLASSROOM')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      teacherMethod === 'DIRECT_CLASSROOM'
                        ? 'bg-blue-50/80 border-blue-500 text-slate-900 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0f2a59] flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>แบบที่ 2: เข้าจากระบบชั้นเรียน</span>
                      </span>
                      {teacherMethod === 'DIRECT_CLASSROOM' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ล็อกอินเข้าจัดการชั้นเรียนโดยตรง
                    </span>
                  </button>
                </div>

                {/* Method 1 Content: E-Leave Portal Login */}
                {teacherMethod === 'E_LEAVE' ? (
                  <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs">
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-950">
                          เชื่อมต่อในฐานะ Portal ของระบบการลา (E-Leave / School Management)
                        </div>
                        <p className="text-[11px] text-amber-800">
                          ใช้รหัสผู้ใช้งานเดียวกับระบบการลาออนไลน์ เมื่อเข้าสู่ระบบจะเปิดหน้าจัดการชั้นเรียนพร้อมซิงก์วันลา/คาบสอนแทนอัตโนมัติ
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        ชื่อผู้ใช้งานระบบการลา E-Leave (Username / Email)
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherUsername}
                        onChange={(e) => setTeacherUsername(e.target.value)}
                        placeholder="pasphum@school.ac.th"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-500 text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        รหัสผ่านระบบการลา (E-Leave Password)
                      </label>
                      <input
                        type="password"
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-500 text-slate-800 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#0f2a59] hover:bg-[#163d7a] text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      <Building2 className="w-4 h-4 text-amber-300" />
                      <span>เข้าสู่ระบบจัดการชั้นเรียน (ผ่านระบบการลา E-Leave)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleELeaveSsoClick}
                      className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>⚡ คลิกเดียว: ดึง Session จากระบบการลา E-Leave เข้าชั้นเรียนทันที</span>
                    </button>
                  </form>
                ) : (
                  /* Method 2 Content: Direct Classroom Management Login */
                  <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-blue-950">
                          เข้าสู่ระบบจากระบบจัดการชั้นเรียนโดยตรง (Direct Classroom Login)
                        </div>
                        <p className="text-[11px] text-blue-800">
                          สำหรับครูผู้สอนที่ต้องการล็อกอินเข้าใช้งานระบบจัดการชั้นเรียนโดยตรงด้วย Username และ Password
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        ชื่อผู้ใช้งาน / อีเมลครูผู้สอน (Username / Email)
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherUsername}
                        onChange={(e) => setTeacherUsername(e.target.value)}
                        placeholder="pasphum@school.ac.th"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        รหัสผ่าน (Password)
                      </label>
                      <input
                        type="password"
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 text-slate-800 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบจัดการชั้นเรียนโดยตรง</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ==============================================================
                 ROLE 2: STUDENT LOGIN (STRICTLY CLASSROOM MANAGEMENT ONLY)
                 ============================================================== */
              <form onSubmit={handleStudentLogin} className="space-y-4 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>เข้าสู่ระบบจัดการชั้นเรียน (เฉพาะนักเรียน)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    นักเรียนเข้าใช้งานได้เฉพาะระบบจัดการชั้นเรียน (ไม่สามารถเข้าถึงระบบการลาของครูได้) กรอกรหัสประจำตัว 5 หลักเพื่อเข้าสู่ห้องเรียนทันที
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    รหัสประจำตัวนักเรียน (5 หลัก)
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="เช่น 45102"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-800 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    รหัสผ่าน / PIN 4 หลัก (วันเดือนเกิด)
                  </label>
                  <input
                    type="password"
                    required
                    value={studentPin}
                    onChange={(e) => setStudentPin(e.target.value)}
                    placeholder="เช่น 2510"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-800 font-mono font-bold text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>เข้าสู่ระบบจัดการชั้นเรียน (สำหรับนักเรียน)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleStudentLogin}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>สแกน QR Code ประจำตัวนักเรียนเพื่อเข้าชั้นเรียนทันที</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {roleTab === 'TEACHER'
                ? `โหมดที่เลือก: ${
                    teacherMethod === 'E_LEAVE'
                      ? 'เข้าผ่าน Portal ระบบการลา (E-Leave)'
                      : 'เข้าจากระบบจัดการชั้นเรียนโดยตรง'
                  }`
                : 'โหมดที่เลือก: นักเรียน (เฉพาะระบบจัดการชั้นเรียน)'}
            </span>
            <span className="text-emerald-600 font-semibold">✓ เข้าสู่ชั้นเรียนโดยตรง ไม่มีหน้าคั่น</span>
          </div>
        </div>
      </div>
    </div>
  );
};
