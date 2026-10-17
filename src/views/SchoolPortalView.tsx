import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
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
  const [portalRole, setPortalRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );

  // ครู / บุคลากร States
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [registerName, setRegisterName] = useState('');

  // นักเรียน States
  const [studentCode, setStudentCode] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

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

  // 1. เข้าสู่ระบบสำหรับครู / บุคลากร (ตรวจสอบกับฐานข้อมูล User & Account)
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = teacherUsername.trim();
    const cleanPass = teacherPassword.trim();

    if (!cleanUser) {
      setErrorMessage(
        lang === 'th'
          ? 'กรุณากรอกชื่อผู้ใช้ หรืออีเมลของครู'
          : 'Please enter teacher username or email'
      );
      return;
    }
    if (!cleanPass) {
      setErrorMessage(
        lang === 'th' ? 'กรุณากรอกรหัสผ่านของคุณ' : 'Please enter your password'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
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
      setErrorMessage(
        err.message ||
          (lang === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' : 'Authentication failed')
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. เข้าสู่ระบบสำหรับนักเรียน (แยกส่วนต่างหากตามที่ผู้ใช้ร้องขอ)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = studentCode.trim();
    const cleanPass = studentPassword.trim();

    if (!cleanCode) {
      setErrorMessage(
        lang === 'th'
          ? 'กรุณากรอกรหัสประจำตัวนักเรียน 5 หลัก'
          : 'Please enter 5-digit student ID'
      );
      return;
    }
    if (!cleanPass) {
      setErrorMessage(
        lang === 'th' ? 'กรุณากรอกรหัสผ่าน / PIN' : 'Please enter your password'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const studentUser = await authService.loginStudentWithHashedPassword(
        cleanCode,
        cleanPass
      );
      onEnterStudentPortal('STUDENT_GENERAL', {
        id: studentUser.id,
        smsId: studentUser.studentCode || cleanCode,
        username: studentUser.studentCode || cleanCode,
        loginAliases: [cleanCode],
        passwordOrPin: cleanPass,
        fullName: studentUser.name,
        role: 'STUDENT_GENERAL',
        departmentOrClass: studentUser.classroomId || 'นักเรียน',
        positionTitle: 'นักเรียน',
        smsGroup: 'STUDENT',
        smsSynced: true,
      });
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'th'
            ? 'รหัสประจำตัวนักเรียนหรือรหัสผ่านไม่ถูกต้อง'
            : 'Invalid student ID or password')
      );
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#EDEBF8] via-[#F5F5FB] to-[#EFEFF9] relative overflow-hidden px-4 py-8 font-['Prompt',sans-serif] select-none">
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
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-[0_12px_42px_rgba(0,0,0,0.06)] border border-[#E6EEF7] px-6 py-8 sm:px-8 sm:py-9 relative z-10">
        {/* School Logo & Name from Settings */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-[0_6px_20px_rgba(40,90,140,0.08)] border border-slate-100 flex items-center justify-center p-1.5 mb-3.5 overflow-hidden">
            <img
              src={schoolSettings.logoUrl || '/school-logo.png'}
              alt={schoolSettings.nameTh}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/school-logo.png';
              }}
            />
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#163A66] text-center tracking-tight">
            {lang === 'th' ? schoolSettings.nameTh : schoolSettings.nameEn}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#6B7C93] font-medium mt-0.5 text-center">
            {schoolSettings.smsSystemName || 'School Management System'}
          </p>
        </div>

        {/* แท็บสลับแยกระหว่าง "ครู / บุคลากร" และ "นักเรียน" อย่างชัดเจน */}
        <div className="flex bg-[#F1F4F9] rounded-2xl p-1.5 mb-5">
          <button
            type="button"
            onClick={() => {
              setPortalRole('TEACHER');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              portalRole === 'TEACHER'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{lang === 'th' ? 'ครู / บุคลากร' : 'Teacher / Staff'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalRole('STUDENT');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              portalRole === 'STUDENT'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{lang === 'th' ? 'นักเรียน' : 'Student'}</span>
          </button>
        </div>

        {/* แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด */}
        {errorMessage && (
          <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =============================================================== */}
        {/* 1. สำหรับครู / บุคลากร (TEACHER PORTAL)                           */}
        {/* =============================================================== */}
        {portalRole === 'TEACHER' && (
          <>
            {/* โหมด เข้าสู่ระบบ | สมัครสมาชิก (เฉพาะครู) */}
            {!isForgotPassword && (
              <div className="flex bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'LOGIN'
                      ? 'bg-white text-[#163A66] shadow-2xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('REGISTER')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'REGISTER'
                      ? 'bg-white text-[#163A66] shadow-2xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
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
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'th'
                      ? 'กรอกชื่อผู้ใช้หรืออีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน'
                      : 'Enter your username or email to receive reset link'}
                  </p>
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
                    className="w-full h-[50px] pl-[44px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#3B82F6] transition-all"
                    placeholder={
                      lang === 'th'
                        ? 'ชื่อผู้ใช้ หรือ อีเมลของครู'
                        : 'Teacher Username or Email'
                    }
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-[50px] rounded-xl bg-[#3B82F6] text-white text-[15px] font-bold hover:bg-[#2563EB] shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                {authMode === 'REGISTER' && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-[20px] w-[20px] text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full h-[50px] pl-[44px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#3B82F6] transition-all"
                      placeholder={lang === 'th' ? 'ชื่อ - นามสกุลครู' : 'Full Name'}
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>
                )}

                {/* ชื่อผู้ใช้ หรือ อีเมลของครู */}
                <div>
                  <label className="block text-xs font-bold text-[#163A66] mb-1.5">
                    {lang === 'th'
                      ? 'ชื่อผู้ใช้ หรือ อีเมลของครู'
                      : 'Teacher Username or Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-[18px] w-[18px] text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full h-[50px] pl-[42px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#3B82F6] transition-all"
                      placeholder={
                        lang === 'th'
                          ? 'เช่น T001, admin, A001 หรืออีเมลโรงเรียน'
                          : 'e.g. T001, admin, A001 or email'
                      }
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* รหัสผ่านครู */}
                <div>
                  <label className="block text-xs font-bold text-[#163A66] mb-1.5">
                    {lang === 'th' ? 'รหัสผ่าน' : 'Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-slate-400" />
                    </div>
                    <input
                      type={showTeacherPassword ? 'text' : 'password'}
                      className="w-full h-[50px] pl-[42px] pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#3B82F6] transition-all"
                      placeholder={lang === 'th' ? 'รหัสผ่าน' : 'Password'}
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showTeacherPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ลืมรหัสผ่าน? */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[12px] font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    {lang === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
                  </button>
                </div>

                {/* ปุ่มเข้าสู่ระบบบุคลากร */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[15px] font-bold shadow-md shadow-blue-500/20 transition-all duration-200 cursor-pointer mt-1"
                >
                  {loading
                    ? lang === 'th'
                      ? 'กำลังตรวจสอบข้อมูล...'
                      : 'Verifying...'
                    : authMode === 'LOGIN'
                    ? lang === 'th'
                      ? 'เข้าสู่ระบบบุคลากร'
                      : 'Sign In as Staff'
                    : lang === 'th'
                    ? 'สมัครสมาชิกครู'
                    : 'Register as Teacher'}
                </button>

                {/* เส้นคั่น หรือเข้าสู่ระบบด้วย */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {lang === 'th' ? 'หรือเข้าสู่ระบบด้วย' : 'Or continue with'}
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                {/* Social Login Buttons: Google | Facebook | LINE */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('GOOGLE')}
                    className="h-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Google Workspace"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    className="h-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      f
                    </span>
                    <span className="text-xs font-bold text-slate-700">Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('LINE')}
                    className="h-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#06C755] text-white font-black text-[7px] flex items-center justify-center shrink-0">
                      LINE
                    </span>
                    <span className="text-xs font-bold text-slate-700">LINE</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* =============================================================== */}
        {/* 2. สำหรับนักเรียน (STUDENT PORTAL - แยกต่างหากตามที่ผู้ใช้ร้องขอ) */}
        {/* =============================================================== */}
        {portalRole === 'STUDENT' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="text-center mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {lang === 'th' ? 'ระบบบริการนักเรียนออนไลน์' : 'Student Learning Portal'}
              </span>
            </div>

            {/* รหัสประจำตัวนักเรียน 5 หลัก */}
            <div>
              <label className="block text-xs font-bold text-[#163A66] mb-1.5">
                {lang === 'th'
                  ? 'รหัสประจำตัวนักเรียน (5 หลัก)'
                  : 'Student ID (5 Digits)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-[18px] w-[18px] text-purple-400" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  className="w-full h-[50px] pl-[42px] pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all font-mono"
                  placeholder={
                    lang === 'th'
                      ? 'เช่น 45101, 47001'
                      : 'e.g. 45101, 47001'
                  }
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* รหัสผ่าน / PIN นักเรียน */}
            <div>
              <label className="block text-xs font-bold text-[#163A66] mb-1.5">
                {lang === 'th' ? 'รหัสผ่าน หรือ PIN' : 'Password / PIN'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-purple-400" />
                </div>
                <input
                  type={showStudentPassword ? 'text' : 'password'}
                  className="w-full h-[50px] pl-[42px] pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all font-mono"
                  placeholder={
                    lang === 'th'
                      ? 'รหัสผ่าน (เริ่มต้นใช้รหัสนักเรียน 5 หลัก)'
                      : 'Initial password is 5-digit ID'
                  }
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showStudentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* คำแนะนำสำหรับนักเรียน (Soft Pastel Anime Card) */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-800">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>คำแนะนำการเข้าใช้งานสำหรับนักเรียน:</span>
              </div>
              <ul className="text-[11px] text-purple-700 leading-relaxed list-disc list-inside space-y-0.5">
                <li>เข้าใช้งานครั้งแรก: ใช้รหัสประจำตัวนักเรียน 5 หลักเป็นรหัสผ่าน</li>
                <li>สามารถเปลี่ยนรหัสผ่านหรือตั้ง PIN ส่วนตัวได้เมื่อเข้าสู่ระบบ</li>
                <li>หากลืมรหัสผ่าน ให้ติดต่อครูที่ปรึกษาประจำชั้นเพื่อรีเซ็ตรหัสผ่าน</li>
              </ul>
            </div>

            {/* ปุ่มเข้าสู่ระบบนักเรียน */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white text-[15px] font-bold shadow-md shadow-purple-500/20 transition-all duration-200 cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loading
                ? lang === 'th'
                  ? 'กำลังตรวจสอบข้อมูล...'
                  : 'Verifying...'
                : lang === 'th'
                ? 'เข้าสู่ระบบนักเรียน →'
                : 'Sign In as Student →'}
            </button>
          </form>
        )}

        {/* Footer Credit */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          ©2026 developer Panchapon KP-school • Pastel Anime Education Dashboard
        </div>
      </div>
    </div>
  );
};
