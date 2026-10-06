// src/views/MessagesView.tsx
// หน้าจอระบบข้อความและกลุ่มแชทห้องเรียนอัตโนมัติ (Messaging System)
// - กลุ่มครูที่ปรึกษา และกลุ่มประจำวิชา ดึงสมาชิกเข้าอัตโนมัติ ไม่ต้องเพิ่มคนเข้าเอง
// - เมื่อนักเรียนย้ายห้องเรียน (เช่น ม.1/1 -> ม.1/2) ระบบย้ายกลุ่มให้อัตโนมัติทันที พร้อมข้อความระบบแจ้งเตือน
// - งานที่ทำอยู่ คะแนนสะสม และประวัติทุกอย่างติดตัวนักเรียนไปด้วยครบถ้วน 100%

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Shield,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  messagingService,
  CHAT_GROUPS_EVENT,
  STUDENT_TRANSFERRED_EVENT,
  type ChatGroup,
  type ChatGroupType,
  type StudentTransferResult,
} from '../services/messagingService';
import type { SchoolUserRole } from '../config/schoolRoles';

interface MessagesViewProps {
  activeRole?: SchoolUserRole;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  activeRole = 'TEACHER_GENERAL',
}) => {
  const [groups, setGroups] = useState<ChatGroup[]>(() => messagingService.getGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    const list = messagingService.getGroups();
    return list.find((g) => g.type === 'HOMEROOM')?.id || list[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'ALL' | ChatGroupType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentCode, setTransferStudentCode] = useState('');
  const [transferFromRoom, setTransferFromRoom] = useState('room-1-1');
  const [transferToRoom, setTransferToRoom] = useState('room-1-2');
  const [transferReason, setTransferReason] = useState('ปรับแผนการเรียนและจำนวนนักเรียนต่อห้อง');
  const [lastTransferResult, setLastTransferResult] = useState<StudentTransferResult | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setGroups(messagingService.getGroups());
    };
    const handleTransfer = (e: Event) => {
      const customEvent = e as CustomEvent<StudentTransferResult>;
      if (customEvent.detail) {
        setLastTransferResult(customEvent.detail);
        setToastMsg(customEvent.detail.message);
        setTimeout(() => setToastMsg(null), 4500);
      }
      setGroups(messagingService.getGroups());
    };

    window.addEventListener(CHAT_GROUPS_EVENT, handleUpdate);
    window.addEventListener(STUDENT_TRANSFERRED_EVENT, handleTransfer);
    return () => {
      window.removeEventListener(CHAT_GROUPS_EVENT, handleUpdate);
      window.removeEventListener(STUDENT_TRANSFERRED_EVENT, handleTransfer);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const filteredGroups = groups.filter((g) => {
    if (activeTab !== 'ALL' && g.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const match =
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.teacherName.toLowerCase().includes(query) ||
        (g.classroomName && g.classroomName.toLowerCase().includes(query));
      if (!match) return false;
    }
    return true;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedGroup) return;

    const teacherName =
      activeRole === 'ACADEMIC_ADMIN'
        ? 'นายสมชาย ใจดี (ผอ./แอดมิน)'
        : activeRole === 'STUDENT_AFFAIRS'
        ? 'ครูวิภาดา สมบูรณ์'
        : 'ครูภาสภูมิ เรืองปราชญ์';

    messagingService.sendMessage(selectedGroup.id, {
      senderId: 'current-user',
      senderName: teacherName,
      senderRole: 'TEACHER',
      senderAvatar: '/images/teacher/teacher_avatar.png',
      content: inputText.trim(),
    });

    setInputText('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentCode || !transferFromRoom || !transferToRoom) return;

    try {
      const res = messagingService.executeStudentTransfer({
        studentCode: transferStudentCode,
        fromClassroomId: transferFromRoom,
        toClassroomId: transferToRoom,
        transferReason: transferReason.trim() || undefined,
        actorLabel: 'ครูผู้สอน / แอดมินฝ่ายวิชาการ',
      });

      setLastTransferResult(res);
      showToast(res.message);
      setIsTransferModalOpen(false);

      // Select one of the joined groups if available
      const firstJoined = groups.find((g) =>
        res.joinedGroups.some((name) => name === g.name)
      );
      if (firstJoined) {
        setSelectedGroupId(firstJoined.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการย้ายห้องเรียน';
      alert(msg);
    }
  };

  // Open Transfer Modal for specific student
  const openTransferForStudent = (code: string, currentRoomKey?: string) => {
    setTransferStudentCode(code);
    if (currentRoomKey) {
      setTransferFromRoom(currentRoomKey);
      // Auto select a different room
      if (currentRoomKey === 'room-1-1' || currentRoomKey === 'ม.1/1') {
        setTransferToRoom('room-1-2');
      } else if (currentRoomKey === 'room-3-1' || currentRoomKey === 'ม.3/1') {
        setTransferToRoom('room-3-2');
      } else {
        setTransferToRoom('room-3-1');
      }
    }
    setIsTransferModalOpen(true);
  };

  const getTypeBadge = (type: ChatGroupType) => {
    switch (type) {
      case 'HOMEROOM':
        return {
          label: 'ครูที่ปรึกษา',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: UserCheck,
        };
      case 'COURSE':
        return {
          label: 'ประจำวิชา',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: BookOpen,
        };
      case 'OFFICIAL':
        return {
          label: 'ประกาศทางการ',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Shield,
        };
      case 'DEPARTMENT':
        return {
          label: 'กลุ่มสาระฯ',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Users,
        };
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold max-w-md animate-fade-in border border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Transfer Simulator Trigger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-2xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ระบบข้อความ & แชทกลุ่มห้องเรียนอัตโนมัติ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                ดึงสมาชิกอัตโนมัติ 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              กลุ่มครูที่ปรึกษาและกลุ่มประจำวิชาจะดึงนักเรียนเข้าอัตโนมัติ เมื่อมีการย้ายห้องเรียน
              จะสลับกลุ่มและโอนย้ายงาน/คะแนนเดิมติดตัวไปด้วยอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              messagingService.resyncAllGroupMembers();
              showToast('ซิงค์สมาชิกทุกกลุ่มแชทตรงกับทะเบียนรายชื่อห้องเรียนล่าสุดเรียบร้อยแล้ว');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="ซิงค์สมาชิกกลุ่มทั้งหมดจากทะเบียน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ซิงค์สมาชิกอัตโนมัติ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransferStudentCode('47001'); // ด.ช. ชนะภัย ม.1/1
              setTransferFromRoom('room-1-1');
              setTransferToRoom('room-1-2');
              setIsTransferModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>ทดสอบย้ายห้องเรียน (ม.1/1 ➔ ม.1/2)</span>
          </button>
        </div>
      </div>

      {/* Transfer Success Audit Alert Card (if any transfer just happened) */}
      {lastTransferResult && (
        <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-indigo-500/10 border border-blue-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm">
                  ผลการย้ายห้องเรียนสำเร็จ: {lastTransferResult.student.name} ({lastTransferResult.student.code})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {lastTransferResult.fromClassroomName} ➔ {lastTransferResult.toClassroomName}
                </span>
              </div>
              <p className="text-slate-600">
                • <strong>กลุ่มแชทที่ย้ายเข้า:</strong> {lastTransferResult.joinedGroups.join(', ') || 'กลุ่มประจำห้องใหม่'}
                <br />
                • <strong>ความคงอยู่ของงาน & คะแนน:</strong> คงงานที่ส่งแล้ว {lastTransferResult.preservedSubmissionsCount} ชิ้น, คะแนนสะสม {lastTransferResult.preservedScore} คะแนน ติดตัวนักเรียนไปด้วยครบถ้วน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLastTransferResult(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Messaging Interface: Left Groups Sidebar + Center Chat Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Groups List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/40">
          {/* Search & Tabs */}
          <div className="p-3.5 border-b border-slate-200/80 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหากลุ่มแชท, วิชา, หรือห้อง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
              {[
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'HOMEROOM', label: 'ครูที่ปรึกษา' },
                { key: 'COURSE', label: 'ประจำวิชา' },
                { key: 'OFFICIAL', label: 'ทางการ' },
              ].map((tab) => {
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer text-[11px] ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ไม่พบกลุ่มแชทที่ตรงกับการค้นหา
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                const typeInfo = getTypeBadge(group.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setShowMembersDrawer(false);
                    }}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-extrabold text-xs truncate ${
                            isSelected ? 'text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {group.name}
                        </span>
                        {group.lastMessageTime && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {group.lastMessageTime}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${typeInfo.badge}`}
                        >
                          {typeInfo.label}
                        </span>
                        {group.autoManaged && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            ⚡ ดึงเข้าอัตโนมัติ
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          ({group.members.length} สมาชิก)
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {group.lastMessageText || group.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center / Right Column: Active Chat Stream (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                        {selectedGroup.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {selectedGroup.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {selectedGroup.teacherRoleLabel}: <strong>{selectedGroup.teacherName}</strong> • {selectedGroup.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMembersDrawer((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>สมาชิก ({selectedGroup.members.length})</span>
                  </button>
                </div>
              </div>

              {/* Auto Sync Info Banner */}
              {selectedGroup.autoManaged && (
                <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2 flex items-center justify-between gap-2 text-xs text-teal-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    <span>
                      กลุ่มนี้เป็นกลุ่มดึงสมาชิกอัตโนมัติจากห้องเรียน <strong>{selectedGroup.classroomName || 'ประจำชั้น'}</strong> นักเรียนจะถูกเพิ่ม/ย้ายกลุ่มให้อัตโนมัติเมื่อย้ายห้องเรียน
                    </span>
                  </div>
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
                {selectedGroup.messages.map((msg) => {
                  const isSystem = msg.senderRole === 'SYSTEM' || msg.isSystemAudit;
                  const isCurrentUser = msg.senderId === 'current-user';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                        <div className="bg-blue-50/90 border border-blue-200/90 text-blue-900 rounded-2xl px-4 py-2 text-xs max-w-xl text-center shadow-2xs space-y-1">
                          <p className="font-semibold leading-relaxed">
                            {msg.content}
                          </p>
                          {msg.transferAuditMeta && (
                            <div className="pt-1 text-[11px] text-blue-700/80 border-t border-blue-200/60 flex items-center justify-center gap-3">
                              <span>งานที่โอนมา: {msg.transferAuditMeta.preservedAssignmentsCount} ชิ้น</span>
                              <span>•</span>
                              <span>คะแนนสะสม: {msg.transferAuditMeta.preservedScore} คะแนน</span>
                            </div>
                          )}
                          <span className="text-[10px] text-blue-400 block">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${
                        isCurrentUser ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <img
                        src={msg.senderAvatar || '/images/teacher/teacher_avatar.png'}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0 mt-0.5 shadow-2xs"
                      />
                      <div
                        className={`max-w-md space-y-1 ${
                          isCurrentUser ? 'items-end text-right' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-800">{msg.senderName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความสื่อสารถึงทุกคนในกลุ่มนี้..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่ง</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
              <span>เลือกกลุ่มแชทที่ต้องการสนทนา</span>
            </div>
          )}
        </div>
      </div>

      {/* Member Drawer / Modal */}
      {showMembersDrawer && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left border-l border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    สมาชิกกลุ่ม ({selectedGroup.members.length} คน)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedGroup.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 bg-white">
              <input
                type="text"
                placeholder="ค้นหาสมาชิกตามชื่อ หรือรหัส..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="p-2 bg-blue-50/70 border-b border-blue-100 text-[11px] text-blue-800 px-3.5 leading-relaxed">
              💡 <strong>ระบบดึงอัตโนมัติ:</strong> รายชื่อนักเรียนผูกกับห้องเรียน เมื่อย้ายห้อง รายชื่อจะสลับกลุ่มเองอัตโนมัติ และผลงาน/คะแนนเดิมจะติดตัวไปด้วย
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
              {selectedGroup.members
                .filter((m) => {
                  if (!memberSearch.trim()) return true;
                  const q = memberSearch.toLowerCase();
                  return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
                })
                .map((mem) => (
                  <div
                    key={mem.id}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={mem.avatarUrl || '/images/banners/student-avatar.png'}
                        alt={mem.name}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {mem.name}
                          </span>
                          {mem.role === 'TEACHER' || mem.role === 'ADVISOR' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                              ครู
                            </span>
                          ) : (
                            mem.seatNo && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{mem.seatNo}
                              </span>
                            )
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          รหัส: {mem.code}
                        </span>
                      </div>
                    </div>

                    {mem.role === 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMembersDrawer(false);
                          openTransferForStudent(mem.code, selectedGroup.classroomId);
                        }}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                        title="ย้ายห้องเรียนนักเรียนคนนี้"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>ย้ายห้อง</span>
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Student Transfer Dialog (Modal) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    ย้ายห้องเรียน & ซิงค์กลุ่มแชทอัตโนมัติ
                  </h3>
                  <p className="text-xs text-slate-400">
                    ย้ายกลุ่มให้อัตโนมัติ พร้อมนำงานและคะแนนสะสมติดตัวไปด้วย 100%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              {/* Select Student Code */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รหัสนักเรียนที่ต้องการย้าย <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="เช่น 47001 (ชนะภัย ม.1/1) หรือ 45101 (กฤษณะ ม.3/1)"
                    value={transferStudentCode}
                    onChange={(e) => setTransferStudentCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTransferStudentCode('47001');
                      setTransferFromRoom('room-1-1');
                      setTransferToRoom('room-1-2');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                  >
                    ตัวอย่าง ม.1/1
                  </button>
                </div>
              </div>

              {/* Classroom Selection: From -> To */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ห้องเรียนต้นทาง (เดิม) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={transferFromRoom}
                    onChange={(e) => setTransferFromRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="room-1-1">ม.1/1 (ห้องครูประภาส)</option>
                    <option value="room-1-2">ม.1/2 (ห้องครูพิมพ์ใจ)</option>
                    <option value="room-3-1">ม.3/1 (ห้องครูภาสภูมิ)</option>
                    <option value="room-3-2">ม.3/2 (ห้องครูวิภาดา)</option>
                    <option value="room-1-8">ม.1/8 (ห้องครูเอกชัย)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ห้องเรียนปลายทาง (ใหม่) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={transferToRoom}
                    onChange={(e) => setTransferToRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-400 rounded-xl font-bold text-blue-700"
                  >
                    <option value="room-1-2">ม.1/2 (ห้องครูพิมพ์ใจ)</option>
                    <option value="room-1-1">ม.1/1 (ห้องครูประภาส)</option>
                    <option value="room-3-2">ม.3/2 (ห้องครูวิภาดา)</option>
                    <option value="room-3-1">ม.3/1 (ห้องครูภาสภูมิ)</option>
                    <option value="room-3-8">ม.3/8 (ห้องครูปิยพล)</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เหตุผลการย้ายห้องเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ปรับแผนการเรียน หรือคำร้องของผู้ปกครอง"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Data Preservation Highlight Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>รับประกันความคงอยู่ของข้อมูล (Data Preservation):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1">
                  <li>
                    <strong>ย้ายกลุ่มแชทอัตโนมัติ:</strong> ออกจากกลุ่มห้องเดิม และเข้าร่วมกลุ่มห้องใหม่ทันที พร้อมข้อความระบบต้อนรับ
                  </li>
                  <li>
                    <strong>งานและคะแนนติดตัวไปด้วย 100%:</strong> ผลงานที่ส่งแล้ว การตรวจให้คะแนน การเช็คชื่อ และแต้ม XP จะผูกติดตัวนักเรียนไปห้องใหม่ครบถ้วน
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
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
