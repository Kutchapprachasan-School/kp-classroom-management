// src/views/MessagesView.tsx
// หน้าจอระบบข้อความและกลุ่มแชทห้องเรียนอัตโนมัติ (Messaging System)
// ออกแบบตามระบบ Pastel Anime Education Dashboard
// - กลุ่มครูที่ปรึกษา และกลุ่มประจำวิชาดึงสมาชิกเข้าอัตโนมัติตามทะเบียนห้องเรียนจริง
// - เมื่อนักเรียนย้ายห้องเรียน ระบบจะย้ายกลุ่มให้อัตโนมัติทันที พร้อมข้อความระบบแจ้งเตือน
// - งานที่ทำอยู่ คะแนนสะสม และประวัติทุกอย่างติดตัวนักเรียนไปด้วยครบถ้วน 100%
// - เชื่อมต่อข้อมูลจริงผ่าน messagingService และ LocalStorage ไม่ใช้ Mock Data ปลอม

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Plus,
  Smile,
  Image as ImageIcon,
  ChevronRight,
  Megaphone,
  X,
  FileText,
  BookOpen,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  messagingService,
  CHAT_GROUPS_EVENT,
  STUDENT_TRANSFERRED_EVENT,
  type ChatGroup,
  type ChatMember,
} from '../services/messagingService';
import { classroomService } from '../services/classroomService';
import { authService } from '../services/authService';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

interface MessagesViewProps {
  activeRole?: SchoolUserRole;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  activeRole = 'TEACHER_GENERAL',
}) => {
  // ดึงรายการกลุ่มแชทจริงทั้งหมดจาก messagingService
  const [groups, setGroups] = useState<ChatGroup[]>(() => messagingService.getGroups());
  
  // เลือกกลุ่มเริ่มต้น (เลือกกลุ่มแรกที่มี)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    const all = messagingService.getGroups();
    return all[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'ALL' | 'HOMEROOM' | 'COURSE' | 'OFFICIAL'
  >('ALL');

  // Modal ย้ายห้องเรียนอัตโนมัติ
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<ChatMember | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('room-1-2');
  const [transferReason, setTransferReason] = useState<string>('ปรับกลุ่มการเรียนตามแผนวิชาการ');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // ดึงห้องเรียนทั้งหมดในระบบสำหรับเป็นตัวเลือกย้ายห้อง
  const allClassrooms = classroomService.getClassroomsSync();

  // ซิงค์กลุ่มแชทแบบ Real-time เมื่อมีข้อความใหม่ หรือมีการย้ายห้องเรียน
  useEffect(() => {
    const handleSync = () => {
      setGroups(messagingService.getGroups());
    };
    window.addEventListener(CHAT_GROUPS_EVENT, handleSync);
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleSync);
    return () => {
      window.removeEventListener(CHAT_GROUPS_EVENT, handleSync);
      window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleSync);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // เลื่อนลงล่างสุดเสมอเมื่อเปลี่ยนกลุ่มหรือมีข้อความใหม่
  useEffect(() => {
    scrollToBottom();
  }, [selectedGroupId, groups]);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    messagingService.markGroupAsRead(groupId);
  };

  // กลุ่มปัจจุบันที่เปิดอยู่
  const currentGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  // ส่งข้อความจริงผ่าน messagingService
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentGroup) return;

    const currentUser = authService.getCurrentUser();
    const teacherName =
      currentUser?.name ||
      (activeRole === 'ACADEMIC_ADMIN'
        ? 'ฝ่ายบริหารและงานสารบรรณ'
        : activeRole === 'STUDENT_AFFAIRS'
        ? 'ครูกิจการนักเรียน'
        : 'ครูผู้สอน');

    messagingService.sendMessage(currentGroup.id, {
      senderId: currentUser?.id || 'teacher-current',
      senderName: teacherName,
      senderRole: 'TEACHER',
      senderAvatar: currentUser?.avatarUrl || '/images/teacher/teacher_avatar.png',
      content: inputText.trim(),
    });

    setGroups(messagingService.getGroups());
    setInputText('');
    setIsPlusMenuOpen(false);
  };

  // ดำเนินการย้ายห้องเรียนอัตโนมัติ (Student Transfer Sync)
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudent || !currentGroup?.classroomId) return;

    try {
      const res = messagingService.executeStudentTransfer({
        studentCode: transferStudent.code,
        fromClassroomId: currentGroup.classroomId,
        toClassroomId: targetRoomId,
        transferReason: transferReason.trim() || 'ปรับห้องเรียนตามคำสั่งวิชาการ',
        actorLabel: 'ครูผู้สอน / แอดมินวิชาการ',
      });

      showToast(res.message);
      setIsTransferModalOpen(false);
      setTransferStudent(null);
      setGroups(messagingService.getGroups());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการย้ายห้องเรียน';
      alert(msg);
    }
  };

  // ซิงค์สมาชิกทุกกลุ่มกลับเข้าหาทะเบียนห้องเรียน
  const handleResyncAll = () => {
    const updated = messagingService.resyncAllGroupMembers();
    setGroups(updated);
    showToast('ซิงค์สมาชิกทุกกลุ่มแชทตรงกับทะเบียนห้องเรียนล่าสุดเรียบร้อยแล้ว');
  };

  // กรองกลุ่มตามตัวกรองหมวดหมู่และคำค้นหา
  const filteredGroups = groups.filter((g) => {
    if (activeCategoryFilter === 'HOMEROOM' && g.type !== 'HOMEROOM') return false;
    if (activeCategoryFilter === 'COURSE' && g.type !== 'COURSE') return false;
    if (activeCategoryFilter === 'OFFICIAL' && g.type !== 'OFFICIAL' && g.type !== 'DEPARTMENT') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchRoom = (g.classroomName || '').toLowerCase().includes(q);
      const matchTeacher = (g.teacherName || '').toLowerCase().includes(q);
      const matchCourse =
        (g.courseName || '').toLowerCase().includes(q) ||
        (g.courseCode || '').toLowerCase().includes(q);
      if (!matchName && !matchRoom && !matchTeacher && !matchCourse) return false;
    }
    return true;
  });

  const homeroomGroups = filteredGroups.filter((g) => g.type === 'HOMEROOM');
  const courseGroups = filteredGroups.filter((g) => g.type === 'COURSE');
  const officialGroups = filteredGroups.filter(
    (g) => g.type === 'OFFICIAL' || g.type === 'DEPARTMENT'
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans text-slate-800 select-none animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold max-w-md animate-fade-in border border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Master PageHeroBanner Design */}
      <PageHeroBanner
        title="ระบบข้อความ & แชทกลุ่มอัตโนมัติ"
        subtitle="กลุ่มครูที่ปรึกษาและกลุ่มประจำวิชาดึงสมาชิกเข้าอัตโนมัติ ย้ายห้องเรียนระบบจะย้ายกลุ่มและโอนงาน/คะแนนเดิมติดตัวไปด้วย"
        icon={<MessageSquare className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="Auto Sync"
        tagText="💬 กลุ่มที่ปรึกษา • กลุ่มประจำวิชา • ซิงค์สมาชิกอัตโนมัติ • โอนย้ายคะแนน 100%"
        quoteLines={[
          'สื่อสารสะดวกรวดเร็ว',
          'เชื่อมโยงครูและนักเรียน',
          'สร้างสรรค์ชุมชนการเรียนรู้',
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResyncAll}
              className="bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] text-blue-700 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="ซิงค์สมาชิกกลุ่มแชทให้ตรงกับทะเบียนห้องเรียนล่าสุด"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>ซิงค์ทะเบียนห้องเรียน</span>
            </button>
          </div>
        }
      />

      {/* 2. Main Interface: Left Groups List + Right Chat Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Groups Navigation (4 Cols on large screen) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-xs space-y-3.5">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด ({groups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('HOMEROOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                activeCategoryFilter === 'HOMEROOM'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              กลุ่มที่ปรึกษา
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('COURSE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                activeCategoryFilter === 'COURSE'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              กลุ่มประจำวิชา
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('OFFICIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                activeCategoryFilter === 'OFFICIAL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ประกาศทางการ
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหากลุ่ม, รหัสวิชา, ครู หรือห้องเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#163A66] placeholder-[#94A3B8] focus:outline-none focus:border-[#1D75D8] focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {/* 1. กลุ่มครูที่ปรึกษา */}
            {homeroomGroups.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#163A66]">
                      กลุ่มครูที่ปรึกษา
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {homeroomGroups.length} ห้อง
                  </span>
                </div>

                <div className="space-y-2">
                  {homeroomGroups.map((group) => {
                    const isSelected = selectedGroupId === group.id;
                    const studentCount = group.members.filter(
                      (m) => m.role === 'STUDENT'
                    ).length;

                    return (
                      <div
                        key={group.id}
                        onClick={() => handleSelectGroup(group.id)}
                        className={`rounded-2xl border p-3 flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EBFBF5] border-[#A7F3D0] shadow-xs ring-1 ring-emerald-300'
                            : 'bg-white border-[#E6EEF7] hover:bg-[#F0FDF4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                            {group.classroomName || 'ม.3'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#163A66] truncate">
                                {group.name}
                              </span>
                              {group.unreadCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  {group.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B7C93] mt-0.5 truncate">
                              นักเรียน {studentCount} คน • {group.teacherName}
                            </p>
                            {group.lastMessageText && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {group.lastMessageText}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ml-2 ${
                            isSelected ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. กลุ่มประจำวิชา */}
            {courseGroups.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#163A66]">
                      กลุ่มประจำวิชา (Course Groups)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {courseGroups.length} วิชา
                  </span>
                </div>

                <div className="space-y-2">
                  {courseGroups.map((group) => {
                    const isSelected = selectedGroupId === group.id;
                    const studentCount = group.members.filter(
                      (m) => m.role === 'STUDENT'
                    ).length;

                    return (
                      <div
                        key={group.id}
                        onClick={() => handleSelectGroup(group.id)}
                        className={`rounded-2xl border p-3 flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EFF6FF] border-[#BFDBFE] shadow-xs ring-1 ring-blue-300'
                            : 'bg-white border-[#E6EEF7] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[11px]">
                            {group.courseCode?.slice(0, 3) || 'วิชา'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#163A66] truncate">
                                {group.name}
                              </span>
                              {group.unreadCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  {group.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B7C93] mt-0.5 truncate">
                              ห้อง {group.classroomName} • นักเรียน {studentCount} คน
                            </p>
                            {group.lastMessageText && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {group.lastMessageText}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ml-2 ${
                            isSelected ? 'text-blue-600' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ประกาศทางการ & สาระการเรียนรู้ */}
            {officialGroups.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Megaphone className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#163A66]">
                      ประกาศทางการ & ส่วนกลาง
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {officialGroups.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {officialGroups.map((group) => {
                    const isSelected = selectedGroupId === group.id;

                    return (
                      <div
                        key={group.id}
                        onClick={() => handleSelectGroup(group.id)}
                        className={`rounded-2xl border p-3 flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F5F3FF] border-[#DDD6FE] shadow-xs ring-1 ring-purple-300'
                            : 'bg-white border-[#E6EEF7] hover:bg-[#FAF8FF]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-[#163A66] truncate block">
                              {group.name}
                            </span>
                            <p className="text-[11px] text-[#6B7C93] mt-0.5 truncate">
                              {group.teacherName}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ml-2 ${
                            isSelected ? 'text-purple-600' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredGroups.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-semibold">ไม่พบกลุ่มที่ตรงกับเงื่อนไขค้นหา</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Box (8 Cols) */}
        {currentGroup ? (
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-xs flex flex-col justify-between min-h-[640px]">
            <div>
              {/* Header: Group Avatar, Title, Tag & Member Button */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm ${
                      currentGroup.type === 'HOMEROOM'
                        ? 'bg-emerald-500'
                        : currentGroup.type === 'COURSE'
                        ? 'bg-blue-600'
                        : 'bg-purple-600'
                    }`}
                  >
                    {currentGroup.classroomName ||
                      currentGroup.courseCode?.slice(0, 3) || <Users className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-[#163A66] leading-tight truncate">
                        {currentGroup.name}
                      </h2>
                      <span className="bg-[#EFF6FF] text-[#1D75D8] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                        {currentGroup.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7C93] mt-0.5 truncate">
                      {currentGroup.teacherRoleLabel}: <strong>{currentGroup.teacherName}</strong>
                      {currentGroup.description ? ` • ${currentGroup.description}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMembersDrawer(true)}
                    className="rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#163A66] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>สมาชิก ({currentGroup.members.length})</span>
                  </button>
                </div>
              </div>

              {/* Auto-Sync Green Information Banner */}
              <div className="bg-[#EBFBF5] border border-[#C6F2DF] rounded-xl px-3.5 py-2 text-xs text-[#065F46] flex items-center gap-2 mt-4 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                <span>
                  กลุ่มนี้เป็น{currentGroup.typeLabel} {currentGroup.classroomName || ''}{' '}
                  สมาชิกถูกดึงเข้าอัตโนมัติจากทะเบียนรายชื่อ เมื่อย้ายห้องเรียนระบบจะย้ายกลุ่มและโอนคะแนน/งานเดิมให้ทันที
                </span>
              </div>

              {/* Messages Feed */}
              <div className="py-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {currentGroup.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 shadow-2xs">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">ยังไม่มีข้อความในกลุ่มนี้</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      เริ่มต้นการสนทนาโดยพิมพ์ข้อความในช่องด้านล่างเพื่อสื่อสารกับสมาชิกในกลุ่ม
                    </p>
                  </div>
                ) : (
                  currentGroup.messages.map((msg) => {
                  // ข้อความระบบแจ้งย้ายห้อง / ตรวจสอบความถูกต้อง
                  if (msg.isSystemAudit || msg.senderRole === 'SYSTEM') {
                    const isTransferIn = msg.transferAuditMeta?.action === 'TRANSFER_IN';
                    const isTransferOut = msg.transferAuditMeta?.action === 'TRANSFER_OUT';

                    return (
                      <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                        <div
                          className={`rounded-2xl p-4 text-center max-w-xl mx-auto shadow-2xs border ${
                            isTransferIn
                              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                              : isTransferOut
                              ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                              : 'bg-[#F0F7FF] border-[#D0E6FF] text-[#1E40AF]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                            {isTransferIn || isTransferOut ? (
                              <ArrowRightLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Megaphone className="w-4 h-4 text-[#1D75D8] shrink-0" />
                            )}
                            <span>{msg.content}</span>
                          </div>

                          {/* รายละเอียดการรักษาคะแนนและงานที่โอนย้าย */}
                          {msg.transferAuditMeta && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-center gap-2 flex-wrap text-[11px] font-medium">
                              <span className="px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                                📦 งานที่รักษาไว้: {msg.transferAuditMeta.preservedAssignmentsCount} รายการ
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                                ⭐ คะแนนสะสมคงเดิม: {msg.transferAuditMeta.preservedScore} คะแนน
                              </span>
                            </div>
                          )}

                          <span className="text-[11px] text-[#64748B] mt-1.5 block">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start gap-3 animate-fade-in">
                      <img
                        src={msg.senderAvatar || '/images/teacher/teacher_avatar.png'}
                        alt={msg.senderName}
                        className="w-10 h-10 rounded-full border border-sky-200 object-cover shrink-0 mt-0.5 shadow-2xs bg-sky-50"
                      />
                      <div className="max-w-xl space-y-1">
                        <div className="text-xs font-bold text-[#6B7C93] flex items-center gap-2">
                          <span>{msg.senderName}</span>
                          <span className="text-[10px] font-normal text-slate-400">
                            {msg.timestamp}
                          </span>
                          {msg.syncStatus === 'PENDING_SYNC' && (
                            <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-0.5">
                              ⏳ กำลังส่ง...
                            </span>
                          )}
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs sm:text-sm text-[#163A66] shadow-2xs leading-relaxed inline-block">
                          {msg.content}

                          {/* Chat Attachment: 7-Day Expired Media vs Active Media */}
                          {msg.attachment && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              {msg.attachment.isExpired ? (
                                <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl text-xs text-slate-500 flex items-center gap-2.5 shadow-2xs">
                                  <span className="text-xl shrink-0">🖼️</span>
                                  <div>
                                    <p className="font-bold text-slate-600">
                                      รูปภาพหมดอายุการจัดเก็บตามนโยบาย 7 วัน (Expired)
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      ข้อความและบันทึกประวัติการส่งยังคงอยู่ถาวร 100%
                                    </p>
                                  </div>
                                </div>
                              ) : msg.attachment.mimeType?.startsWith('image/') ||
                                msg.attachment.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                <div>
                                  {msg.attachment.url ? (
                                    <img
                                      src={msg.attachment.url}
                                      alt={msg.attachment.fileName || 'รูปภาพ'}
                                      className="max-w-xs max-h-56 rounded-xl object-cover border border-slate-200 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2">
                                      <span>🖼️</span>
                                      <span>{msg.attachment.fileName || 'รูปภาพที่แนบ'}</span>
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                                    <span>📁 {msg.attachment.fileName || 'image.jpg'}</span>
                                    {msg.attachment.fileSizeKb && (
                                      <span>({msg.attachment.fileSizeKb} KB)</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="font-bold text-blue-900 truncate">
                                      {msg.attachment.fileName || 'เอกสารแนบ'}
                                    </span>
                                  </div>
                                  {msg.attachment.url && (
                                    <a
                                      href={msg.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 shrink-0"
                                    >
                                      ดาวน์โหลด
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom Chat Input Bar */}
            <div className="relative pt-4 border-t border-[#F1F5F9] flex items-center gap-2.5 mt-auto">
              {/* Quick Actions Plus Menu */}
              {isPlusMenuOpen && (
                <div className="absolute bottom-16 left-0 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 w-72 text-xs font-bold text-[#163A66] space-y-1 z-20 animate-scale-up">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      showToast('เปิดตัวเลือกแนบไฟล์เอกสาร / แผนการสอน');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-slate-700 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>แนบไฟล์เอกสาร / แผนการสอน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      handleResyncAll();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-slate-700 transition-colors text-left cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span>ซิงค์รายชื่อนักเรียนกับทะเบียนห้อง</span>
                  </button>
                </div>
              )}

              {/* Left Plus Button */}
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-[#E8F2FF] hover:bg-[#D9E9FF] text-[#1D75D8] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors shrink-0 shadow-2xs active:scale-95"
                title="เมนูเพิ่มเติม"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Center Pill Input Wrapper */}
              <form
                onSubmit={handleSendMessage}
                className="flex-1 flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 py-2 hover:bg-white focus-within:bg-white focus-within:border-[#1D75D8] focus-within:ring-2 focus-within:ring-[#E8F2FF] transition-all"
              >
                <input
                  type="text"
                  placeholder={`พิมพ์ข้อความในกลุ่ม ${currentGroup.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#163A66] placeholder-[#94A3B8] outline-none font-sans"
                />

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => `${prev} 😊`)}
                    className="p-1 text-[#94A3B8] hover:text-[#163A66] transition-colors cursor-pointer"
                    title="ใส่อิโมจิ"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('เปิดตัวเลือกแนบรูปภาพประกอบ')}
                    className="p-1 text-[#94A3B8] hover:text-[#163A66] transition-colors cursor-pointer"
                    title="แนบรูปภาพ"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Right Solid Blue Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#1D75D8] hover:bg-[#1560B8] disabled:opacity-40 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors shrink-0 active:scale-95"
                title="ส่งข้อความ"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#E6EEF7] p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">เลือกกลุ่มแชททางด้านซ้ายเพื่อเริ่มการสนทนา</p>
          </div>
        )}
      </div>

      {/* Member Drawer (แสดงสมาชิกจริงจาก currentGroup.members) */}
      {showMembersDrawer && currentGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left border-l border-[#E6EEF7]">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-[#163A66] text-sm">
                    สมาชิกกลุ่ม ({currentGroup.members.length} คน)
                  </h3>
                  <p className="text-[11px] text-[#6B7C93] truncate max-w-[280px]">
                    {currentGroup.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#F1F5F9] bg-white">
              <input
                type="text"
                placeholder="ค้นหาสมาชิกตามชื่อ หรือรหัสประจำตัว..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none font-sans"
              />
            </div>

            <div className="p-2 bg-[#E8F2FF] border-b border-[#D0E6FF] text-[11px] text-[#1D75D8] px-3.5 leading-relaxed">
              💡 <strong>ระบบดึงอัตโนมัติ:</strong> รายชื่อนักเรียนผูกกับทะเบียนห้องเรียนจริง เมื่อย้ายห้อง รายชื่อจะสลับกลุ่มเองอัตโนมัติ และผลงาน/คะแนนเดิมจะติดตัวไปด้วยครบ 100%
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] p-2">
              {/* รายการสมาชิก */}
              {currentGroup.members
                .filter(
                  (m) =>
                    !memberSearch.trim() ||
                    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                    m.code.toLowerCase().includes(memberSearch.toLowerCase())
                )
                .map((m) => {
                  const isTeacher = m.role === 'TEACHER' || m.role === 'ADVISOR';

                  return (
                    <div
                      key={m.id || m.code}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            m.avatarUrl ||
                            (isTeacher
                              ? '/images/teacher/teacher_avatar.png'
                              : '/images/banners/student-avatar.png')
                          }
                          alt={m.name}
                          className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#163A66] text-xs truncate">
                              {m.name}
                            </span>
                            {isTeacher ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                {m.role === 'ADVISOR' ? 'ครูที่ปรึกษา' : 'ครูผู้สอน'}
                              </span>
                            ) : (
                              m.seatNo !== undefined && (
                                <span className="text-[10px] text-[#6B7C93] font-mono">
                                  #{m.seatNo}
                                </span>
                              )
                            )}
                          </div>
                          <span className="text-[10px] text-[#94A3B8] font-mono block">
                            รหัส: {m.code}
                          </span>
                        </div>
                      </div>

                      {/* ปุ่มย้ายห้องเรียน (สำหรับนักเรียน) เพื่อทดสอบฟีเจอร์ซิงค์อัตโนมัติ */}
                      {!isTeacher && currentGroup.classroomId && (
                        <button
                          type="button"
                          onClick={() => {
                            setTransferStudent(m);
                            const nextRoom = allClassrooms.find(
                              (c) =>
                                c.id !== currentGroup.classroomId &&
                                c.roomNumber !== currentGroup.classroomName
                            );
                            if (nextRoom) setTargetRoomId(nextRoom.id);
                            setIsTransferModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="ย้ายห้องเรียน (ทดสอบระบบซิงค์แชทและโอนคะแนนอัตโนมัติ)"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                          <span>ย้ายห้อง</span>
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Modal ย้ายห้องเรียนอัตโนมัติ (Student Transfer Sync Modal) */}
      {isTransferModalOpen && transferStudent && currentGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ย้ายห้องเรียน & ซิงค์กลุ่มแชทอัตโนมัติ
                  </h3>
                  <p className="text-xs text-slate-500">
                    ย้ายนักเรียนพร้อมโอนย้ายกลุ่มแชท งาน และคะแนนสะสม 100%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                <div className="font-bold text-slate-800">
                  นักเรียน: {transferStudent.name} (รหัส {transferStudent.code})
                </div>
                <div className="text-slate-600">
                  ห้องเรียนปัจจุบัน: <strong>{currentGroup.classroomName || currentGroup.classroomId}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกห้องเรียนปลายทาง
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {allClassrooms
                    .filter(
                      (c) =>
                        c.id !== currentGroup.classroomId &&
                        c.roomNumber !== currentGroup.classroomName
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.roomNumber}) • ครูที่ปรึกษา: {c.adviser}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลในการย้ายห้องเรียน
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="เช่น ปรับแผนการเรียน หรือคำสั่งฝ่ายวิชาการ"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>การรับประกันข้อมูล (100% Data Integrity):</span>
                </div>
                <ul className="list-disc list-inside text-emerald-700 pl-1 space-y-0.5">
                  <li>นักเรียนจะออกจากกลุ่มเดิมและเข้ากลุ่มห้องใหม่โดยอัตโนมัติ</li>
                  <li>ระบบจะโพสต์ข้อความแจ้งเตือนการย้ายในกลุ่มแชททั้ง 2 ห้องทันที</li>
                  <li>งานที่ส่งแล้ว คะแนนเก็บ และประวัติการเข้าเรียนทั้งหมดจะติดตัวไปด้วยครบถ้วน</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>ยืนยันการย้ายห้องเรียน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
