import React, { useState } from 'react';
import { KeyRound, Plus, Search, Shield, User, Printer, X, QrCode, Mail } from 'lucide-react';
import { authService } from '../services/authService';

interface UserAccountRow {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  schoolCode: string;
  authType: string;
  classesCount: number;
}

export const UserAccountsView: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Add user form state
  const [newRole, setNewRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [newName, setNewName] = useState('');
  const [newEmailOrCode, setNewEmailOrCode] = useState('');
  const [newPasswordOrPin, setNewPasswordOrPin] = useState('');

  const [users, setUsers] = useState<UserAccountRow[]>([
    { id: 'u-1', name: 'นายภาสภูมิ เรืองปราชญ์', email: 'pasphum@school.ac.th', role: 'TEACHER', schoolCode: 'T-0104', authType: 'Email/Password + Google SSO', classesCount: 5 },
    { id: 'u-2', name: 'นางสาววิภาดา สมบูรณ์', email: 'wiphada@school.ac.th', role: 'TEACHER', schoolCode: 'T-0105', authType: 'Email/Password + Google SSO', classesCount: 4 },
    { id: 'u-3', name: 'นายเอกชัย มิ่งขวัญ (หัวหน้ากลุ่มสาระ)', email: 'ekkachai@school.ac.th', role: 'ADMIN', schoolCode: 'A-0002', authType: 'Email/Password + Google SSO', classesCount: 2 },
    { id: 'u-4', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', email: 'รหัส 45101 (PIN วันเกิด)', role: 'STUDENT', schoolCode: '45101', authType: 'รหัสนักเรียน 5 หลัก + PIN', classesCount: 1 },
    { id: 'u-5', name: 'ด.ช. จิรายุ เดชปันคำ', email: 'รหัส 45102 (PIN วันเกิด)', role: 'STUDENT', schoolCode: '45102', authType: 'รหัสนักเรียน 5 หลัก + PIN', classesCount: 1 },
    { id: 'u-6', name: 'ด.ช. ทัตธน คำฝั้น', email: 'รหัส 45115 (PIN วันเกิด)', role: 'STUDENT', schoolCode: '45115', authType: 'รหัสนักเรียน 5 หลัก + PIN', classesCount: 1 },
  ]);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.schoolCode.includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmailOrCode) return;

    if (newRole === 'TEACHER') {
      await authService.loginTeacher(newEmailOrCode, newPasswordOrPin || 'password123');
    } else {
      await authService.loginStudent(newEmailOrCode, newPasswordOrPin || '2510');
    }

    const newItem: UserAccountRow = {
      id: `u-${Date.now()}`,
      name: newName,
      email: newRole === 'TEACHER' ? newEmailOrCode : `รหัส ${newEmailOrCode} (PIN: ${newPasswordOrPin || '2510'})`,
      role: newRole,
      schoolCode: newRole === 'TEACHER' ? `T-${Math.floor(Math.random() * 900 + 100)}` : newEmailOrCode,
      authType: newRole === 'TEACHER' ? 'Email/Password + Google SSO' : 'รหัสนักเรียน 5 หลัก + PIN',
      classesCount: 1,
    };

    setUsers([newItem, ...users]);
    setIsAddUserOpen(false);
    setNewName('');
    setNewEmailOrCode('');
    setNewPasswordOrPin('');
    alert(`สร้างบัญชีผู้ใช้งาน "${newName}" (${newRole}) ตามมาตรฐาน Hybrid Auth (ADR-003) สำเร็จ!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                บัญชีและรหัสผ่าน (Hybrid Auth & RBAC - ADR-003)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ครูใช้ Email/Password หรือ Google SSO • นักเรียนใช้รหัสนักเรียน 5 หลัก + PIN วันเกิด / QR Code
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setIsSlipModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์สลิปรหัสนักเรียน & QR</span>
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้างบัญชีใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center gap-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('TEACHER')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              roleFilter === 'TEACHER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ครูผู้สอน (Email/Password + SSO)
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              roleFilter === 'STUDENT' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            นักเรียน (รหัส 5 หลัก + PIN)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ อีเมล หรือรหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-2.5 px-3">รหัสประจำตัว</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                <th className="py-2.5 px-3">ข้อมูลเข้าสู่ระบบ</th>
                <th className="py-2.5 px-3">รูปแบบการยืนยันตัวตน</th>
                <th className="py-2.5 px-3 text-center">บทบาท (Role)</th>
                <th className="py-2.5 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-600">{u.schoolCode}</td>
                  <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                      {u.authType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {u.role === 'ADMIN' && (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" /> ADMIN
                      </span>
                    )}
                    {u.role === 'TEACHER' && (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold text-[11px]">
                        TEACHER
                      </span>
                    )}
                    {u.role === 'STUDENT' && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium text-[11px]">
                        STUDENT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          alert(
                            u.role === 'STUDENT'
                              ? `รีเซ็ตรหัส PIN ของ ${u.name} กลับเป็นค่าเริ่มต้น (${u.schoolCode.slice(1)}) เรียบร้อย`
                              : `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล ${u.email} เรียบร้อย`
                          )
                        }
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {u.role === 'STUDENT' ? 'รีเซ็ต PIN' : 'ตั้งรหัสผ่านใหม่'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  สลิปรหัสผ่านและ QR Code สำหรับแจกนักเรียน (ม.3/1)
                </h3>
              </div>
              <button onClick={() => setIsSlipModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {users
                .filter((u) => u.role === 'STUDENT')
                .map((stu) => (
                  <div
                    key={stu.id}
                    className="p-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-between bg-slate-50/60"
                  >
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-slate-800">{stu.name}</div>
                      <div className="text-slate-500">
                        รหัสประจำตัว: <span className="font-mono font-bold text-blue-700">{stu.schoolCode}</span> • รหัส PIN เริ่มต้น:{' '}
                        <span className="font-mono font-bold text-emerald-700">{stu.schoolCode.slice(1)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">สแกน QR เพื่อเข้าสู่ห้องเรียนผจญภัยบนมือถือได้ทันที</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-center">
                      <QrCode className="w-8 h-8 text-slate-700 mx-auto" />
                      <span className="text-[9px] font-mono text-slate-400">{stu.schoolCode}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>สั่งพิมพ์สลิปทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Account (Hybrid Auth) */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">สร้างบัญชีผู้ใช้งานใหม่ (Hybrid Auth)</h3>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ประเภทผู้ใช้งาน</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('TEACHER')}
                    className={`py-2 rounded-xl font-bold border ${
                      newRole === 'TEACHER'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    ครูผู้สอน (Email/Pass + SSO)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('STUDENT')}
                    className={`py-2 rounded-xl font-bold border ${
                      newRole === 'STUDENT'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    นักเรียน (รหัส 5 หลัก + PIN)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder={newRole === 'TEACHER' ? 'เช่น ครูสมชาย ใจดี' : 'เช่น ด.ช. ปัญญา มีสุข'}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newRole === 'TEACHER' ? 'อีเมลผู้ใช้งาน (Username / Email)' : 'รหัสประจำตัวนักเรียน (5 หลัก)'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={newRole === 'TEACHER' ? 'teacher@school.ac.th' : 'เช่น 45128'}
                    value={newEmailOrCode}
                    onChange={(e) => setNewEmailOrCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newRole === 'TEACHER' ? 'รหัสผ่าน (Password)' : 'รหัส PIN 4 หลัก (เช่น วันเดือนเกิด)'}
                </label>
                <input
                  type="password"
                  required
                  placeholder={newRole === 'TEACHER' ? 'รหัสผ่านอย่างน้อย 8 ตัวอักษร' : 'เช่น 2510'}
                  value={newPasswordOrPin}
                  onChange={(e) => setNewPasswordOrPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                บันทึกบัญชีผู้ใช้งาน
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
