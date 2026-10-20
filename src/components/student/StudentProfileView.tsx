import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Camera,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Upload,
  Check,
  X,
  Lock,
} from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import { authService } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { getSchoolSettings } from '../../config/schoolSettings';
import { classroomService } from '../../services/classroomService';
import { formatClassroomLabel, studentService } from '../../services/studentService';
import { gachaService, BUDDY_CHANGED_EVENT, type GachaBuddy } from '../../services/gachaService';
import { calculateStudentExp } from '../../services/studentExpService';
import { studentAffairsCouncilService } from '../../services/studentAffairsCouncilService';
import { sgsRosterAndSubmissionService } from '../../services/sgsRosterAndSubmissionService';
import { coursesCurriculumService } from '../../services/coursesCurriculumService';

interface StudentProfileViewProps {
  onBack: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

// Preset Anime Avatars
const PRESET_AVATARS = [
  { id: 'girl-1', label: 'นักเรียนหญิง 1', url: '/images/banners/student-avatar-girl.png' },
  { id: 'boy-1', label: 'นักเรียนชาย 1', url: '/images/banners/student-avatar.png' },
  { id: 'buddy-c1', label: 'น้องโอม (Common)', url: '/images/buddies/buddy-c1.png' },
  { id: 'buddy-c2', label: 'น้องส้ม (Common)', url: '/images/buddies/buddy-c2.png' },
  { id: 'buddy-u1', label: 'น้องฟ้าใส (Uncommon)', url: '/images/buddies/buddy-u1.png' },
  { id: 'buddy-u2', label: 'น้องกวิน (Uncommon)', url: '/images/buddies/buddy-u2.png' },
  { id: 'buddy-r1', label: 'น้องลิน (Rare)', url: '/images/buddies/buddy-r1.png' },
  { id: 'buddy-r2', label: 'น้องอาร์ต (Rare)', url: '/images/buddies/buddy-r2.png' },
  { id: 'dice-som', label: 'DiceBear ส้ม', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=som' },
  { id: 'dice-ohm', label: 'DiceBear โอม', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ohm' },
  { id: 'dice-lin', label: 'DiceBear ลิน', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=lin' },
  { id: 'dice-art', label: 'DiceBear อาร์ต', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=art' },
];

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onBack,
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentName = currentUser?.name || 'นักเรียน';
  const studentCode = currentUser?.studentCode || 'STD-001';
  const classroomId = currentUser?.classroomName || currentUser?.classroomId || 'ม.3/1';

  // Avatar state
  const [currentAvatar, setCurrentAvatar] = useState<string>(
    currentUser?.avatarUrl || '/images/banners/student-avatar.png'
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(currentAvatar);
  const [avatarTab, setAvatarTab] = useState<'PRESET' | 'UPLOAD'>('PRESET');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Check if password was changed
  const studentRecord = useMemo(() => {
    return studentService.findStudentByCode(studentCode)?.student || null;
  }, [studentCode, isSavingPassword]);

  const isPasswordChanged = Boolean(studentRecord?.isPasswordChanged);

  // Active Companion
  const [activeBuddy, setActiveBuddy] = useState<GachaBuddy>(() =>
    gachaService.getActiveBuddy()
  );

  useEffect(() => {
    const handleBuddyUpdate = () => {
      setActiveBuddy(gachaService.getActiveBuddy());
    };
    window.addEventListener(BUDDY_CHANGED_EVENT, handleBuddyUpdate);
    return () => window.removeEventListener(BUDDY_CHANGED_EVENT, handleBuddyUpdate);
  }, []);

  // Classroom & Advisor
  const rooms = classroomService.getClassroomsSync();
  const matchedRoom = rooms.find(
    (c) => c.id === classroomId || c.roomNumber === classroomId || c.name === classroomId || c.name.includes(classroomId)
  );
  const roomName = matchedRoom
    ? `ชั้น ${matchedRoom.roomNumber || matchedRoom.name}`
    : `ชั้น ${formatClassroomLabel(classroomId)}`;
  const adviserName = (matchedRoom as any)?.advisorTeacher || (matchedRoom as any)?.homeroomTeacher || 'ครูที่ปรึกษาประจำชั้น';

  // Stats
  const disciplineInfo = useMemo(() => {
    return studentAffairsCouncilService.getStudentDisciplineScore(studentCode);
  }, [studentCode]);

  const expInfo = useMemo(() => {
    return calculateStudentExp(currentUser?.id, studentCode);
  }, [currentUser?.id, studentCode]);

  const studentRoom = formatClassroomLabel(classroomId);
  const gpax = useMemo(() => {
    const rosterStudent = sgsRosterAndSubmissionService.getSgsRoster(studentRoom).find((s) => s.studentCode === studentCode);
    if (!rosterStudent) return null;
    const allCourses = coursesCurriculumService.getCourses();
    const currentLevel = studentRoom.split('/')[0] || '';
    const matched = allCourses.filter((c) => {
      const matchRoom =
        Array.isArray(c.assignedClassrooms) &&
        c.assignedClassrooms.some((r: string) => r === studentRoom || formatClassroomLabel(r) === studentRoom);
      return matchRoom || c.level === currentLevel;
    });
    if (matched.length === 0) return null;
    const grades = matched.map((c) => sgsRosterAndSubmissionService.calculateStudentFinalGrade(rosterStudent, c.code, studentRoom));
    const validGrades = grades.filter((g) => g.isComplete && typeof g.numericGrade === 'number');
    if (validGrades.length === 0) return null;
    const avg = validGrades.reduce((sum, g) => sum + (Number(g.numericGrade) || 0), 0) / validGrades.length;
    return avg.toFixed(2);
  }, [studentRoom, studentCode]);

  // Handle Avatar Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale to square 256x256 to minimize memory and egress
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatarUrl(dataUrl);
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setIsUploading(false);
        alert('ไม่สามารถอ่านไฟล์รูปภาพได้');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save Avatar Selection
  const handleSaveAvatar = () => {
    if (!selectedAvatarUrl) return;
    setCurrentAvatar(selectedAvatarUrl);
    studentService.updateStudentAvatar(studentCode, selectedAvatarUrl);
    authService.updateCurrentUserAvatar(selectedAvatarUrl);
    setIsAvatarModalOpen(false);
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.studentChangePassword(studentCode, currentPassword, newPassword);
      setPasswordSuccess('เปลี่ยนรหัสผ่านสำเร็จแล้ว! สามารถใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งต่อไป');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess(null);
      }, 2500);
    } catch (err: any) {
      setPasswordError(err?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1 flex items-center gap-1 cursor-pointer"
        >
          ← กลับหน้าหลัก
        </button>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>ข้อมูลส่วนตัวนักเรียน</span>
        </h2>
        <p className="text-xs text-slate-500">
          ข้อมูลทะเบียนประวัติ ผลการเรียนสะสม และการตั้งค่าบัญชี
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 text-center">
          <div className="relative w-24 h-24 mx-auto group">
            <div className="w-24 h-24 rounded-full border-4 border-sky-100 overflow-hidden shadow-sm bg-sky-50 flex items-center justify-center">
              <img
                src={currentAvatar}
                alt={studentName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(studentName)
                  );
                }}
              />
            </div>
            {/* Quick avatar edit button on badge */}
            <button
              type="button"
              onClick={() => {
                setSelectedAvatarUrl(currentAvatar);
                setIsAvatarModalOpen(true);
              }}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform hover:scale-110 cursor-pointer border-2 border-white"
              title="เปลี่ยนภาพโปรไฟล์"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">{studentName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">รหัสนักเรียน: {studentCode}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {roomName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedAvatarUrl(currentAvatar);
              setIsAvatarModalOpen(true);
            }}
            className="w-full py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>เปลี่ยนภาพโปรไฟล์</span>
          </button>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 text-left">
            <div><strong>โรงเรียน:</strong> {settings.nameTh}</div>
            <div><strong>แผนการเรียน:</strong> แผนการเรียนทั่วไปตามหลักสูตรสถานศึกษา</div>
            <div><strong>ครูที่ปรึกษา:</strong> {adviserName}</div>
          </div>
        </div>

        {/* Stats, Security & Academics */}
        <div className="md:col-span-2 space-y-4">
          {/* Summary Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              สรุปข้อมูลการศึกษาและคะแนนสะสม
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] text-slate-500">เกรดเฉลี่ยสะสม (GPAX)</span>
                <div className="text-lg font-bold text-blue-700 mt-0.5">
                  {gpax ?? '-'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {gpax ? 'เกรดเฉลี่ยปัจจุบัน' : 'รอประมวลผลสิ้นภาคเรียน'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] text-slate-500">คะแนนความประพฤติ</span>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{disciplineInfo.score} / 100</div>
                <div className="text-[10px] text-emerald-600 font-medium">ระดับ{disciplineInfo.label}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] text-slate-500">แต้มการเรียนรู้ (XP)</span>
                <div className="text-lg font-bold text-amber-700 mt-0.5">
                  {expInfo.totalXp.toLocaleString()} XP
                </div>
                <div className="text-[10px] text-amber-600 font-medium">
                  ระดับเลเวล {expInfo.level}
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ความปลอดภัยของบัญชี (Account Security)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  จัดการรหัสผ่านสำหรับเข้าสู่ระบบของนักเรียน
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsChangePasswordOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isPasswordChanged ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span className="text-slate-700 font-medium">
                  {isPasswordChanged
                    ? 'คุณได้ตั้งรหัสผ่านส่วนตัวแล้ว'
                    : 'คุณยังใช้รหัสผ่านเริ่มต้น (รหัสนักเรียน 5 หลัก)'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPasswordChanged
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isPasswordChanged ? 'ปลอดภัย' : 'ควรเปลี่ยนรหัสผ่าน'}
              </span>
            </div>
          </div>

          {/* Active Companion */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              คู่หูบัดดี้ประจำตัว (Companion)
            </h4>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0">
                <img
                  src={`/images/buddies/${activeBuddy.id}.png`}
                  alt={activeBuddy.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute(
                      'src',
                      '/images/buddies/cat_mascot.png'
                    );
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{activeBuddy.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${activeBuddy.badgeBg}`}>
                    {activeBuddy.rarity}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {activeBuddy.title || activeBuddy.quote} (บัฟ: {activeBuddy.skillName}) ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          AVATAR SELECTION MODAL
          ========================================================= */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">เปลี่ยนภาพโปรไฟล์นักเรียน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Preset vs Upload */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setAvatarTab('PRESET')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  avatarTab === 'PRESET'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ตัวละครอนิเมะแนะนำ
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('UPLOAD')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  avatarTab === 'UPLOAD'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                อัปโหลดภาพจากอุปกรณ์
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {avatarTab === 'PRESET' ? (
                <div className="grid grid-cols-4 gap-3">
                  {PRESET_AVATARS.map((avatar) => {
                    const isSelected = selectedAvatarUrl === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(avatar.url)}
                        className={`relative rounded-xl p-1.5 border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute(
                                'src',
                                'https://api.dicebear.com/7.x/bottts/svg?seed=' + avatar.id
                              );
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">
                          {avatar.label}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50">
                    {selectedAvatarUrl ? (
                      <img src={selectedAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'กำลังประมวลผลภาพ...' : 'เลือกรูปภาพจากเครื่อง'}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 mt-2">
                      รองรับไฟล์ภาพ JPG, PNG, WEBP (ระบบจะปรับขนาดภาพให้อัตโนมัติ)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                บันทึกภาพโปรไฟล์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CHANGE PASSWORD MODAL
          ========================================================= */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">เปลี่ยนรหัสผ่านนักเรียน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-4 space-y-3.5">
              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านปัจจุบัน
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={isPasswordChanged ? 'กรอกรหัสผ่านปัจจุบัน' : 'รหัสประจำตัว 5 หลัก'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isPasswordChanged && (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    (หากยังไม่เคยเปลี่ยนรหัส ให้ใช้รหัสประจำตัว 5 หลัก: {studentCode})
                  </span>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
