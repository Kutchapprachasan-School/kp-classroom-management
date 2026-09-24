import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  School,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

export type TeacherLoginChannel = 'E_LEAVE' | 'DIRECT_CLASSROOM';

interface SchoolPortalViewProps {
  onEnterClassroomPortal: (
    targetView?: string,
    channel?: TeacherLoginChannel
  ) => void;
  onEnterStudentPortal: () => void;
}

export const SchoolPortalView: React.FC<SchoolPortalViewProps> = ({
  onEnterClassroomPortal,
  onEnterStudentPortal,
}) => {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [roleTab, setRoleTab] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [teacherChannel, setTeacherChannel] =
    useState<TeacherLoginChannel>('E_LEAVE');

  const [username, setUsername] = useState('passapoom.r');
  const [password, setPassword] = useState('••••••••••••');
  const [studentCode, setStudentCode] = useState('45102');
  const [studentPin, setStudentPin] = useState('2510');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onEnterClassroomPortal('home', teacherChannel);
    }, 350);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onEnterStudentPortal();
    }, 350);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      lang === 'th'
        ? 'ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว (ใช้ฐานข้อมูลเดียวกับระบบการลา E-Leave)'
        : 'Password reset link has been sent to your email.'
    );
    setIsForgotPassword(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EFF6F5] relative overflow-hidden p-4 font-sans">
      {/* Language Switcher (เหมือนระบบการลาเป๊ะ) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="flex items-center justify-center px-4 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all duration-300 font-bold text-xs shadow-sm cursor-pointer"
        >
          {lang === 'th' ? 'TH / EN' : 'EN / TH'}
        </button>
      </div>

      {/* Decorative Background (เปลี่ยนโทนจากม่วงของระบบการลา เป็นเขียวมรกต-ฟ้าครามของระบบจัดการชั้นเรียน) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-200/50 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-teal-200/50 blur-[80px]" />
      </div>

      {/* Center Login Card (ขนาดและสัดส่วน max-w-[420px] rounded-3xl เหมือนระบบการลาเป๊ะ) */}
      <div className="w-full max-w-[420px] bg-white/85 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 sm:p-8 relative z-10 border border-white/70">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 text-center">
            {lang === 'th'
              ? 'ระบบจัดการชั้นเรียน'
              : 'Classroom Management System'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center">
            {lang === 'th'
              ? 'ชั้นเรียน • กิจการนักเรียน • สภานักเรียน • เยี่ยมบ้าน นร.01'
              : 'Classroom • Student Affairs • Student Council'}
          </p>
        </div>

        {/* Role Tab Toggle (เหมือนปุ่มสลับบนการ์ดระบบการลา) */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setRoleTab('TEACHER');
              setIsForgotPassword(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'TEACHER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang === 'th' ? 'สำหรับครูผู้สอน' : 'Teacher Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('STUDENT');
              setIsForgotPassword(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'STUDENT'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang === 'th' ? 'สำหรับนักเรียน' : 'Student Login'}
          </button>
        </div>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'th' ? 'ลืมรหัสผ่าน' : 'Forgot Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'th'
                  ? 'กรอกชื่อผู้ใช้หรืออีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่'
                  : 'Enter your username or email to reset password'}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="w-full h-[50px] pl-[44px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder={
                  lang === 'th'
                    ? 'ชื่อผู้ใช้ หรือ อีเมลโรงเรียน'
                    : 'Username or Email'
                }
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full h-[50px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[15px] font-semibold hover:opacity-95 shadow-lg shadow-emerald-500/20 transition-all duration-200 mt-2"
            >
              {lang === 'th' ? 'ส่งลิงก์รีเซ็ตรหัสผ่าน' : 'Send Reset Link'}
            </button>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {lang === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Login'}
              </button>
            </div>
          </form>
        ) : roleTab === 'TEACHER' ? (
          /* ================= 1. ฟอร์มล็อกอินสำหรับครูผู้สอน (2 ช่องทาง) ================= */
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            {/* Teacher Channel Selector (เข้าผ่านระบบการลา E-Leave vs เข้าจากระบบจัดการชั้นเรียน) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTeacherChannel('E_LEAVE');
                  setUsername('passapoom.r');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  teacherChannel === 'E_LEAVE'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2
                  className={`w-4 h-4 shrink-0 ${
                    teacherChannel === 'E_LEAVE'
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">
                    1. เข้าผ่าน E-Leave
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    รหัสเดียวกับระบบการลา
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeacherChannel('DIRECT_CLASSROOM');
                  setUsername('passapoom.r@school.ac.th');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  teacherChannel === 'DIRECT_CLASSROOM'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <School
                  className={`w-4 h-4 shrink-0 ${
                    teacherChannel === 'DIRECT_CLASSROOM'
                      ? 'text-teal-600'
                      : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">
                    2. ชั้นเรียนโดยตรง
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    บัญชีระบบชั้นเรียน
                  </div>
                </div>
              </button>
            </div>

            {/* Username Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="w-full h-[50px] pl-[44px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder={
                  teacherChannel === 'E_LEAVE'
                    ? 'ชื่อผู้ใช้ หรือ อีเมล (ระบบการลา E-Leave)'
                    : 'ชื่อผู้ใช้ หรือ อีเมล (ระบบจัดการชั้นเรียน)'
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full h-[50px] pl-[44px] pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder="รหัสผ่าน (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>เชื่อมฐานข้อมูลเดียวกับระบบการลา</span>
              </span>
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {lang === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white text-[15px] font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 shadow-lg shadow-emerald-500/25 transition-all duration-200 mt-2 cursor-pointer"
            >
              {loading
                ? 'กำลังเข้าสู่ระบบ...'
                : teacherChannel === 'E_LEAVE'
                ? 'เข้าสู่ระบบจัดการชั้นเรียน (ผ่าน E-Leave)'
                : 'เข้าสู่ระบบจัดการชั้นเรียนโดยตรง'}
            </button>
          </form>
        ) : (
          /* ================= 2. ฟอร์มล็อกอินสำหรับนักเรียน (เฉพาะระบบชั้นเรียน) ================= */
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
              <span>สำหรับนักเรียนเข้าสู่ห้องเรียนผจญภัย & โหวตสภาฯ</span>
              <span className="px-2 py-0.5 rounded bg-white text-emerald-700 font-bold text-[10px] border border-emerald-200">
                Student Only
              </span>
            </div>

            {/* Student 5-digit Code */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="w-full h-[50px] pl-[44px] pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder="รหัสประจำตัวนักเรียน 5 หลัก (เช่น 45102)"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
              />
            </div>

            {/* Student PIN / Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full h-[50px] pl-[44px] pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                placeholder="รหัส PIN 4 หลัก / รหัสผ่านนักเรียน"
                value={studentPin}
                onChange={(e) => setStudentPin(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white text-[15px] font-semibold hover:opacity-95 shadow-lg shadow-emerald-500/25 transition-all duration-200 mt-2 cursor-pointer"
            >
              {loading
                ? 'กำลังเข้าสู่ห้องเรียน...'
                : 'เข้าสู่ระบบจัดการชั้นเรียน (นักเรียน)'}
            </button>

            <button
              type="button"
              onClick={onEnterStudentPortal}
              className="w-full h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>สแกนบัตร QR Code ประจำตัวนักเรียน</span>
            </button>
          </form>
        )}

        {/* Social & E-Leave Quick Login Bar (เหมือนระบบการลาเป๊ะ) */}
        {!isForgotPassword && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="bg-white/90 px-3 text-slate-400">
                  {roleTab === 'TEACHER'
                    ? 'หรือเข้าสู่ระบบด่วนผ่าน'
                    : 'ทางลัดสำหรับทดสอบ'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <button
                type="button"
                onClick={() =>
                  roleTab === 'TEACHER'
                    ? onEnterClassroomPortal('home', 'E_LEAVE')
                    : onEnterStudentPortal()
                }
                className="flex items-center justify-center gap-1.5 h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-[13px] font-medium text-slate-600">
                  Google
                </span>
              </button>

              <a
                href="https://e-leave-system-kappa.vercel.app"
                className="flex items-center justify-center gap-1.5 h-[44px] rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-colors shadow-xs"
                title="เปิดระบบการลา E-Leave"
              >
                <Building2 className="w-4 h-4 text-purple-600" />
                <span className="text-[12px] font-bold text-purple-700">
                  เว็บการลา
                </span>
              </a>

              <button
                type="button"
                onClick={() =>
                  roleTab === 'TEACHER'
                    ? onEnterClassroomPortal('home', 'E_LEAVE')
                    : onEnterStudentPortal()
                }
                className="flex items-center justify-center gap-1.5 h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 10.304c0-5.369-5.383-9.738-12-9.738S0 4.935 0 10.304c0 4.814 4.27 8.846 10.035 9.608.391.084.922.258 1.057.592.122.302.079.768.038 1.084l-.168 1.02c-.053.303-.243 1.183 1.037.643 1.28-.54 6.91-4.069 9.428-6.967C23.11 14.364 24 12.435 24 10.304z"
                    fill="#00C300"
                  />
                </svg>
                <span className="text-[13px] font-medium text-slate-600">
                  LINE
                </span>
              </button>
            </div>
          </>
        )}

        {/* Footer (เหมือนระบบการลาเป๊ะ) */}
        <div className="text-center mt-5 pt-4 border-t border-slate-100">
          <p className="text-[12px] text-slate-400">
            © 2006 Panchapon Getrat KP-school
          </p>
        </div>
      </div>
    </div>
  );
};
