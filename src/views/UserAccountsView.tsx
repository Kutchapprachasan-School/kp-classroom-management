import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  User,
  Printer,
  X,
  QrCode,
  Mail,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { authService } from '../services/authService';
import {
  getSchoolSettings,
  getSmsUsers,
  saveSmsUsers,
  SCHOOL_ROLE_PROFILES,
  type SchoolUserRole,
} from '../config/schoolRoles';

interface UserAccountRow {
  id: string;
  name: string;
  email: string;
  schoolRole: SchoolUserRole;
  schoolCode: string;
  authType: string;
  departmentOrClass: string;
}

interface UserAccountsViewProps {
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
}

export const UserAccountsView: React.FC<UserAccountsViewProps> = ({
  activeRole = 'ACADEMIC_ADMIN',
  onChangeRole,
}) => {
  const schoolSettings = getSchoolSettings();
  const [roleFilter, setRoleFilter] = useState<'ALL' | SchoolUserRole>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Add user form state
  const [newRole, setNewRole] = useState<SchoolUserRole>('TEACHER_GENERAL');
  const [newName, setNewName] = useState('');
  const [newEmailOrCode, setNewEmailOrCode] = useState('');
  const [newPasswordOrPin, setNewPasswordOrPin] = useState('');

  const [users, setUsers] = useState<UserAccountRow[]>(() =>
    getSmsUsers().map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.username,
      schoolRole: u.role,
      schoolCode: u.smsId,
      authType: 'SMS Unified SSO (ใช้บัญชีเดียวกับระบบ SMS)',
      departmentOrClass: u.departmentOrClass,
    }))
  );

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.schoolRole === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.schoolCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleChangeUserRole = (userId: string, nextRole: SchoolUserRole) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, schoolRole: nextRole } : u
      );
      const currentSms = getSmsUsers().map((su) =>
        su.id === userId ? { ...su, role: nextRole } : su
      );
      saveSmsUsers(currentSms);
      return updated;
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmailOrCode) return;

    const isStudent =
      newRole === 'STUDENT_GENERAL' || newRole === 'STUDENT_COUNCIL';

    if (!isStudent) {
      await authService.loginTeacher(
        newEmailOrCode,
        newPasswordOrPin || 'password123'
      );
    } else {
      await authService.loginStudent(newEmailOrCode, newPasswordOrPin || '2510');
    }

    const generatedId = `u-${Date.now()}`;
    const generatedCode = !isStudent
      ? `KPS-${Math.floor(Math.random() * 900 + 100)}`
      : newEmailOrCode;

    const newItem: UserAccountRow = {
      id: generatedId,
      name: newName,
      email: newEmailOrCode,
      schoolRole: newRole,
      schoolCode: generatedCode,
      authType: 'SMS Unified SSO (ใช้บัญชีเดียวกับระบบ SMS)',
      departmentOrClass: SCHOOL_ROLE_PROFILES[newRole].department,
    };

    const currentSms = getSmsUsers();
    saveSmsUsers([
      {
        id: generatedId,
        smsId: generatedCode,
        username: newEmailOrCode,
        loginAliases: [newEmailOrCode, generatedCode, newName],
        passwordOrPin: newPasswordOrPin || (isStudent ? '2510' : '123456'),
        fullName: newName,
        role: newRole,
        departmentOrClass: SCHOOL_ROLE_PROFILES[newRole].department,
        positionTitle: SCHOOL_ROLE_PROFILES[newRole].title,
        smsGroup: isStudent ? 'STUDENT' : 'PERSONNEL',
        smsSynced: true,
      },
      ...currentSms,
    ]);

    setUsers([newItem, ...users]);
    setIsAddUserOpen(false);
    setNewName('');
    setNewEmailOrCode('');
    setNewPasswordOrPin('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header: โรงเรียนกุดจับประชาสรรค์ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  จัดการบัญชีและสิทธิ์การเข้าถึง 5 บทบาท (RBAC)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                  {schoolSettings.nameTh} ({schoolSettings.shortCode})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                แยกสิทธิ์ชัดเจนระหว่าง 1) ครูผู้ใช้งานทั่วไป • 2) ฝ่ายกิจการนักเรียน • 3) ฝ่ายวิชาการ/แอดมิน • 4) นักเรียนทั่วไป • 5) สภานักเรียน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setIsSlipModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์สลิป QR นักเรียน</span>
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มบัญชีผู้ใช้ใหม่</span>
          </button>
        </div>
      </div>

      {/* ============================================================================
          5-ROLE PERMISSION MATRIX (ตารางสรุปขอบเขตสิทธิ์ทั้ง 5 บทบาทของ รร.กุดจับประชาสรรค์)
      ============================================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>โครงสร้างการแบ่งสิทธิ์ 5 บทบาท — {schoolSettings.nameTh}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกปุ่ม "สลับทดสอบสิทธิ์นี้" เพื่อดูเมนู Sidebar และหน้าจอที่แต่ละบทบาทมองเห็นจริง
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
            กำลังดูในฐานะ: {SCHOOL_ROLE_PROFILES[activeRole].shortLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {(
            [
              'TEACHER_GENERAL',
              'STUDENT_AFFAIRS',
              'ACADEMIC_ADMIN',
              'STUDENT_GENERAL',
              'STUDENT_COUNCIL',
            ] as SchoolUserRole[]
          ).map((roleKey) => {
            const prof = SCHOOL_ROLE_PROFILES[roleKey];
            const isCurrent = activeRole === roleKey;
            return (
              <div
                key={roleKey}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-teal-50/60 border-teal-400 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/90'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${prof.badgeColor}`}
                    >
                      {prof.shortLabel}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-teal-700">
                        ● ใช้งานอยู่
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {prof.userName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {prof.userPosition}
                    </div>
                  </div>

                  <ul className="space-y-1 pt-1 border-t border-slate-200/70">
                    {prof.keyPermissions.map((perm, idx) => (
                      <li
                        key={idx}
                        className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug"
                      >
                        <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/70 space-y-2">
                  <div className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-lg p-1.5 flex items-start gap-1">
                    <Lock className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <span>{prof.restrictedNote}</span>
                  </div>

                  {onChangeRole && (
                    <button
                      type="button"
                      onClick={() => onChangeRole(roleKey)}
                      className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                        isCurrent
                          ? 'bg-teal-700 text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {isCurrent ? '✓ กำลังเปิดดูสิทธิ์นี้' : 'สลับทดสอบสิทธิ์นี้'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด ({users.length})
          </button>
          {(
            [
              'TEACHER_GENERAL',
              'STUDENT_AFFAIRS',
              'ACADEMIC_ADMIN',
              'STUDENT_GENERAL',
              'STUDENT_COUNCIL',
            ] as SchoolUserRole[]
          ).map((rk) => (
            <button
              key={rk}
              onClick={() => setRoleFilter(rk)}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-colors ${
                roleFilter === rk
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {SCHOOL_ROLE_PROFILES[rk].shortLabel}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ อีเมล @kutchap.ac.th หรือรหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">รหัส</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                <th className="py-2.5 px-3">สังกัด / ชั้นเรียน</th>
                <th className="py-2.5 px-3">บัญชีเข้าสู่ระบบ</th>
                <th className="py-2.5 px-3 text-center">บทบาทและสิทธิ์ (ปรับเปลี่ยนได้)</th>
                <th className="py-2.5 px-3 text-right">จัดการรหัสผ่าน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const prof = SCHOOL_ROLE_PROFILES[u.schoolRole];
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      {u.schoolCode}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{u.departmentOrClass}</td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={u.schoolRole}
                        onChange={(e) =>
                          handleChangeUserRole(u.id, e.target.value as SchoolUserRole)
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                      >
                        <option value="TEACHER_GENERAL">ครูผู้สอนทั่วไป ({prof.shortLabel})</option>
                        <option value="STUDENT_AFFAIRS">ฝ่ายกิจการนักเรียน</option>
                        <option value="ACADEMIC_ADMIN">ฝ่ายวิชาการ / แอดมิน</option>
                        <option value="STUDENT_GENERAL">นักเรียนทั่วไป</option>
                        <option value="STUDENT_COUNCIL">คณะกรรมการสภานักเรียน</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() =>
                          alert(
                            `รีเซ็ตรหัสผ่าน/PIN ของ ${u.name} (${schoolSettings.nameTh}) เรียบร้อยแล้ว`
                          )
                        }
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        รีเซ็ตรหัส
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Printable Student Slips */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  สลิป QR Code นักเรียน — {schoolSettings.nameTh}
                </h3>
              </div>
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {users
                .filter(
                  (u) =>
                    u.schoolRole === 'STUDENT_GENERAL' ||
                    u.schoolRole === 'STUDENT_COUNCIL'
                )
                .map((stu) => (
                  <div
                    key={stu.id}
                    className="p-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-between bg-slate-50/60"
                  >
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-slate-800">
                        {stu.name}{' '}
                        <span className="text-[10px] text-teal-700">
                          ({SCHOOL_ROLE_PROFILES[stu.schoolRole].shortLabel})
                        </span>
                      </div>
                      <div className="text-slate-500">
                        รหัสประจำตัว:{' '}
                        <span className="font-mono font-bold text-teal-700">
                          {stu.schoolCode}
                        </span>{' '}
                        • PIN เริ่มต้น:{' '}
                        <span className="font-mono font-bold text-emerald-700">
                          2510
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {schoolSettings.nameTh} • สพม.อุดรธานี
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-700" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  เพิ่มบัญชีผู้ใช้งานใหม่ ({schoolSettings.nameTh})
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เลือกบทบาทและสิทธิ์การเข้าถึง (5 บทบาท)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as SchoolUserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="TEACHER_GENERAL">1. ครูผู้ใช้งานทั่วไป (ครูประจำวิชา/ที่ปรึกษา)</option>
                  <option value="STUDENT_AFFAIRS">2. กลุ่มบริหารงานกิจการนักเรียน</option>
                  <option value="ACADEMIC_ADMIN">3. กลุ่มบริหารงานวิชาการ / แอดมิน</option>
                  <option value="STUDENT_GENERAL">4. นักเรียนทั่วไป</option>
                  <option value="STUDENT_COUNCIL">5. คณะกรรมการสภานักเรียน</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ครูสมชาย ใจดี หรือ ด.ญ. มานี มีตา"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  อีเมล (@kutchap.ac.th) หรือ รหัสนักเรียน 5 หลัก
                </label>
                <input
                  type="text"
                  required
                  value={newEmailOrCode}
                  onChange={(e) => setNewEmailOrCode(e.target.value)}
                  placeholder="เช่น somchai.j@kutchap.ac.th หรือ 45120"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสผ่านเริ่มต้น / PIN 4 หลัก
                </label>
                <input
                  type="text"
                  value={newPasswordOrPin}
                  onChange={(e) => setNewPasswordOrPin(e.target.value)}
                  placeholder="เว้นว่างเพื่อใช้ค่าเริ่มต้นอัตโนมัติ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  บันทึกบัญชีและกำหนดสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
