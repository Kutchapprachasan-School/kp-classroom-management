import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getSchoolSettings,
  SCHOOL_ROLE_PROFILES,
  type SchoolUserRole,
  type SmsUserAccount,
  type SchoolBrandingSettings,
} from '../config/schoolRoles';
import { authService } from '../services/authService';

export type TeacherLoginChannel = 'E_LEAVE' | 'DIRECT_CLASSROOM';

interface SchoolPortalViewProps {
  onEnterClassroomPortal: (
    targetView?: string,
    channel?: TeacherLoginChannel,
    role?: SchoolUserRole,
    smsUser?: SmsUserAccount
  ) => void;
  onEnterStudentPortal: (
    role?: 'STUDENT_GENERAL' | 'STUDENT_COUNCIL',
    smsUser?: SmsUserAccount
  ) => void;
}

export const SchoolPortalView: React.FC<SchoolPortalViewProps> = ({
  onEnterClassroomPortal,
  onEnterStudentPortal,
}) => {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [forgotResetSuccess, setForgotResetSuccess] = useState(false);

  // ซิงค์ชื่อโรงเรียนและโลโก้จากหน้าการตั้งค่าอัตโนมัติ
  useEffect(() => {
    const syncSettings = () => setSchoolSettings(getSchoolSettings());
    window.addEventListener('kps-school-settings-updated', syncSettings);
    return () => window.removeEventListener('kps-school-settings-updated', syncSettings);
  }, []);

  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMessage(lang === 'th' ? 'กรุณากรอกชื่อผู้ใช้ รหัสประจำตัว หรืออีเมล' : 'Please enter username or email');
      return;
    }
    if (!cleanPass) {
      setErrorMessage(lang === 'th' ? 'กรุณากรอกรหัสผ่าน' : 'Please enter password');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. ถ้ารหัสผู้ใช้เป็นตัวเลข 5 หลัก -> ตรวจสอบการเข้าสู่ระบบของนักเรียน
      if (/^\d{5}$/.test(cleanUser)) {
        const studentUser = await authService.loginStudentWithHashedPassword(cleanUser, cleanPass);
        onEnterStudentPortal('STUDENT_GENERAL', {
          id: studentUser.id,
          smsId: studentUser.studentCode || cleanUser,
          username: studentUser.studentCode || cleanUser,
          loginAliases: [cleanUser],
          passwordOrPin: cleanPass,
          fullName: studentUser.name,
          role: 'STUDENT_GENERAL',
          departmentOrClass: studentUser.classroomId || 'นักเรียน',
          positionTitle: 'นักเรียน',
          smsGroup: 'STUDENT',
          smsSynced: true,
        });
        return;
      }

      // 2. ถ้าเป็นครู / บุคลากร -> ตรวจสอบกับฐานข้อมูล Supabase ตาราง User & Account จริง
      const teacherUser = await authService.loginTeacher(cleanUser, cleanPass);
      const appRole: SchoolUserRole =
        teacherUser.role === 'ADMIN'
          ? 'ACADEMIC_ADMIN'
          : teacherUser.position?.includes('กิจการ')
          ? 'STUDENT_AFFAIRS'
          : 'TEACHER_GENERAL';

      const targetView = SCHOOL_ROLE_PROFILES[appRole].defaultView;
      onEnterClassroomPortal(targetView, 'DIRECT_CLASSROOM', appRole, {
        id: teacherUser.id,
        smsId: teacherUser.username || teacherUser.id,
        username: teacherUser.username || teacherUser.email || cleanUser,
        loginAliases: [cleanUser],
        passwordOrPin: '',
        fullName: teacherUser.name,
        role: appRole,
        departmentOrClass: teacherUser.subjectGroup || 'กลุ่มสาระการเรียนรู้',
        positionTitle: teacherUser.position || 'ครูผู้สอน',
        smsGroup: 'PERSONNEL',
        smsSynced: true,
      });
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' : 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'GOOGLE' | 'FACEBOOK' | 'LINE') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (provider === 'GOOGLE') {
        const teacherUser = await authService.loginTeacherGoogle();
        const appRole: SchoolUserRole =
          teacherUser.role === 'ADMIN'
            ? 'ACADEMIC_ADMIN'
            : teacherUser.position?.includes('กิจการ')
            ? 'STUDENT_AFFAIRS'
            : 'TEACHER_GENERAL';
        const targetView = SCHOOL_ROLE_PROFILES[appRole].defaultView;
        onEnterClassroomPortal(targetView, 'DIRECT_CLASSROOM', appRole, {
          id: teacherUser.id,
          smsId: teacherUser.username || teacherUser.id,
          username: teacherUser.username || teacherUser.email || 'google_user',
          loginAliases: ['google'],
          passwordOrPin: '',
          fullName: teacherUser.name,
          role: appRole,
          departmentOrClass: teacherUser.subjectGroup || 'กลุ่มสาระการเรียนรู้',
          positionTitle: teacherUser.position || 'ครูผู้สอน',
          smsGroup: 'PERSONNEL',
          smsSynced: true,
        });
      } else {
        setErrorMessage(
          lang === 'th'
            ? `ระบบกำลังพัฒนาการเชื่อมต่อบัญชี ${provider} กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้/อีเมล หรือ Google Workspace`
            : `${provider} login is in development. Please use username/password or Google.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Social login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotResetSuccess(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#EDEBF8] via-[#F5F5FB] to-[#EFEFF9] relative overflow-hidden px-4 py-8 font-sans select-none">
      {/* Top-Right TH / EN Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="flex items-center justify-center px-4 py-2 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-slate-800 hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer"
        >
          TH / EN
        </button>
      </div>

      {/* Clean SMS Login Card */}
      <div className="w-full max-w-[400px] bg-white rounded-[32px] shadow-[0_12px_42px_rgba(0,0,0,0.04)] px-6 py-8 sm:px-8 sm:py-9 relative z-10">
        {/* School Logo & Name from Settings */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-center p-1.5 mb-4 overflow-hidden">
            <img
              src={schoolSettings.logoUrl}
              alt={schoolSettings.nameTh}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[22px] font-bold text-slate-900 text-center tracking-tight">
            {lang === 'th' ? schoolSettings.nameTh : schoolSettings.nameEn}
          </h1>
          <p className="text-[13px] text-slate-400 font-medium mt-1 text-center">
            {schoolSettings.smsSystemName || 'School Management System'}
          </p>
        </div>

        {/* Segmented Toggle: เข้าสู่ระบบ | สมัครสมาชิก */}
        {!isForgotPassword && (
          <div className="flex bg-[#F1F4F9] rounded-2xl p-1.5 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 font-semibold'
              }`}
            >
              {lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 font-semibold'
              }`}
            >
              {lang === 'th' ? 'สมัครสมาชิก' : 'Register'}
            </button>
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'th' ? 'ลืมรหัสผ่าน' : 'Forgot Password'}
              </h2>
            </div>

            {forgotResetSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ส่งลิงก์ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</span>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="w-full h-[52px] pl-[44px] pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                placeholder={lang === 'th' ? 'ชื่อผู้ใช้ หรือ อีเมล' : 'Username or Email'}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-[#A838FF] via-[#7C3AED] to-[#4F46E5] text-white text-[15px] font-bold hover:opacity-95 shadow-[0_8px_22px_rgba(124,58,237,0.32)] transition-all cursor-pointer"
            >
              {lang === 'th' ? 'ส่งลิงก์รีเซ็ตรหัสผ่าน' : 'Send Reset Link'}
            </button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotResetSuccess(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {lang === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUnifiedLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {authMode === 'REGISTER' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-[20px] w-[20px] text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full h-[52px] pl-[44px] pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                  placeholder={lang === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'}
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>
            )}

            {/* ชื่อผู้ใช้ หรือ อีเมล (รองรับทั้งครูและนักเรียนในช่องเดียว) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full h-[52px] pl-[44px] pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                placeholder={lang === 'th' ? 'ชื่อผู้ใช้ หรือ อีเมล' : 'Username or Email'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* รหัสผ่าน */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[20px] w-[20px] text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full h-[52px] pl-[44px] pr-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                placeholder={lang === 'th' ? 'รหัสผ่าน' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* ลืมรหัสผ่าน? */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-[13px] font-bold text-[#9333EA] hover:text-[#7E22CE] transition-colors cursor-pointer"
              >
                {lang === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
              </button>
            </div>

            {/* ปุ่มเข้าสู่ระบบ (Gradient ม่วง-น้ำเงิน ตามหน้า SMS) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-[#A838FF] via-[#7C3AED] to-[#4F46E5] text-white text-[16px] font-bold hover:opacity-95 shadow-[0_10px_25px_rgba(124,58,237,0.32)] transition-all duration-200 cursor-pointer mt-1"
            >
              {loading
                ? lang === 'th'
                  ? 'กำลังเข้าสู่ระบบ...'
                  : 'Signing in...'
                : authMode === 'LOGIN'
                ? lang === 'th'
                  ? 'เข้าสู่ระบบ'
                  : 'Sign In'
                : lang === 'th'
                ? 'สมัครสมาชิก'
                : 'Register'}
            </button>

            {/* เส้นคั่น หรือเข้าสู่ระบบด้วย */}
            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 whitespace-nowrap">
                {lang === 'th' ? 'หรือเข้าสู่ระบบด้วย' : 'Or continue with'}
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Social Login Buttons: Google | Facebook | LINE */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin('GOOGLE')}
                className="h-[48px] rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.31 0 3.25 2.69 1.28 6.61l3.67 2.84C5.82 6.84 8.66 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.56 2.77c2.08-1.92 3.86-4.74 3.86-8.59z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.95 14.55A7.01 7.01 0 0 1 4.58 12c0-.89.16-1.75.44-2.55L1.28 6.61A11.96 11.96 0 0 0 0 12c0 1.93.46 3.75 1.28 5.39l3.67-2.84z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.56-2.77c-1.08.72-2.45 1.16-4.37 1.16-3.34 0-6.18-1.84-7.05-4.45l-3.67 2.84C3.25 21.31 7.31 24 12 24z"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-700">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('FACEBOOK')}
                className="h-[48px] rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white font-black text-xs flex items-center justify-center shrink-0">
                  f
                </span>
                <span className="text-xs font-bold text-slate-700">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('LINE')}
                className="h-[48px] rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#06C755] text-white font-black text-[8px] flex items-center justify-center shrink-0">
                  LINE
                </span>
                <span className="text-xs font-bold text-slate-700">LINE</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Credit */}
        <div className="mt-7 text-center text-xs text-slate-400">
          ©2026 developer Panchapon KP-school
        </div>
      </div>
    </div>
  );
};
