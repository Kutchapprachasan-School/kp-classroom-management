// src/views/MessagesView.tsx
// หน้าจอระบบข้อความและกลุ่มแชทห้องเรียนอัตโนมัติ (Messaging System)
// ออกแบบตามระบบ Pastel Anime Education Dashboard และภาพต้นแบบ media_1791273562793.png
// - กลุ่มครูที่ปรึกษา และกลุ่มห้องเรียนดึงสมาชิกเข้าอัตโนมัติ ไม่ต้องเพิ่มคนเข้าเอง
// - เมื่อนักเรียนย้ายห้องเรียน ระบบจะย้ายกลุ่มให้อัตโนมัติทันที พร้อมข้อความระบบแจ้งเตือน
// - งานที่ทำอยู่ คะแนนสะสม และประวัติทุกอย่างติดตัวนักเรียนไปด้วยครบถ้วน 100%

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
} from 'lucide-react';
import {
  messagingService,
  CHAT_GROUPS_EVENT,
} from '../services/messagingService';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

interface MessagesViewProps {
  activeRole?: SchoolUserRole;
}

interface UiGroupItem {
  id: string;
  category: 'HOMEROOM' | 'CLASSROOM';
  title: string;
  fullTitle: string;
  roomName: string;
  tag: string;
  isActiveBadge?: boolean;
  studentCount: number;
  lastUpdate: string;
  adviser: string;
  colorType: 'blue' | 'amber' | 'emerald' | 'purple';
}

interface UiChatMessage {
  id: string;
  senderName: string;
  senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM';
  timestamp: string;
  senderAvatar?: string;
  content: string;
  isSystemAudit?: boolean;
}

const UI_GROUPS: UiGroupItem[] = [
  // 0. แชทนักเรียนกับโรงเรียน (แจ้งนักเรียนทั้งโรงเรียนส่งตรงไปยังแชทนักเรียนกับโรงเรียนได้เลย)
  {
    id: 'school-broadcast',
    category: 'CLASSROOM',
    title: 'แชทนักเรียนกับโรงเรียน',
    fullTitle: 'แชทนักเรียนกับโรงเรียน (School Broadcast)',
    roomName: 'ทั้งโรงเรียน (ม.1 - ม.6)',
    tag: 'ประกาศโรงเรียน',
    isActiveBadge: true,
    studentCount: 1248,
    lastUpdate: 'วันนี้',
    adviser: 'ฝ่ายวิชาการ & กิจการนักเรียน',
    colorType: 'blue',
  },
  // 1. กลุ่มครูที่ปรึกษา
  {
    id: 'homeroom-3-1',
    category: 'HOMEROOM',
    title: 'ครูที่ปรึกษา ม.3/1',
    fullTitle: 'กลุ่มครูที่ปรึกษา ม.3/1',
    roomName: 'ม.3/1',
    tag: 'กลุ่มครูที่ปรึกษา',
    isActiveBadge: true,
    studentCount: 8,
    lastUpdate: '08:01 น.',
    adviser: 'ครูภาณุวุฒิ เรื่องประเสริฐ',
    colorType: 'emerald',
  },
  // 2. กลุ่มห้องเรียน (4 กลุ่มตามภาพต้นแบบ)
  {
    id: 'class-3-1',
    category: 'CLASSROOM',
    title: 'ม.3/1',
    fullTitle: 'กลุ่มห้องเรียน ม.3/1',
    roomName: 'ม.3/1',
    tag: 'กลุ่มห้องเรียน',
    studentCount: 29,
    lastUpdate: '08:01 น.',
    adviser: 'ครูภาณุวุฒิ เรื่องประเสริฐ',
    colorType: 'blue',
  },
  {
    id: 'class-3-2',
    category: 'CLASSROOM',
    title: 'ม.3/2',
    fullTitle: 'กลุ่มห้องเรียน ม.3/2',
    roomName: 'ม.3/2',
    tag: 'กลุ่มห้องเรียน',
    studentCount: 28,
    lastUpdate: '08:01 น.',
    adviser: 'ครูวิภาดา สมบูรณ์',
    colorType: 'amber',
  },
  {
    id: 'class-1-8',
    category: 'CLASSROOM',
    title: 'ม.1/8',
    fullTitle: 'กลุ่มห้องเรียน ม.1/8',
    roomName: 'ม.1/8',
    tag: 'กลุ่มห้องเรียน',
    studentCount: 25,
    lastUpdate: '08:01 น.',
    adviser: 'ครูเอกชัย มิ่งขวัญ',
    colorType: 'emerald',
  },
  {
    id: 'class-1-9',
    category: 'CLASSROOM',
    title: 'ม.1/9',
    fullTitle: 'กลุ่มห้องเรียน ม.1/9',
    roomName: 'ม.1/9',
    tag: 'กลุ่มห้องเรียน',
    studentCount: 26,
    lastUpdate: '08:01 น.',
    adviser: 'ครูชนิกา ทรัพย์สุข',
    colorType: 'purple',
  },
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  activeRole = 'TEACHER_GENERAL',
}) => {
  // Default to 'class-3-1' (ม.3/1) to match Reference Image media_1791273562793.png
  const [selectedGroupId, setSelectedGroupId] = useState<string>('class-3-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Group Messages Store
  const [messagesMap, setMessagesMap] = useState<Record<string, UiChatMessage[]>>({
    'school-broadcast': [
      {
        id: 'msg-sb-1',
        senderName: 'ผู้อำนวยการโรงเรียน',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 07:30 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'ประกาศจากทางโรงเรียน: ขอให้นักเรียนทุกคนเตรียมตัวเข้าร่วมกิจกรรมหน้าเสาธงในเช้าวันนี้อย่างพร้อมเพรียงครับ',
      },
      {
        id: 'msg-sb-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'วันนี้เวลา 07:31 น.',
        content: '📢 ช่องทางสื่อสารและประกาศแจ้งเตือนตรงไปยังนักเรียนทั้งโรงเรียน (1,248 คน)',
        isSystemAudit: true,
      },
    ],
    'class-3-1': [
      {
        id: 'msg-c31-1',
        senderName: 'ครูภาณุวุฒิ เรื่องประเสริฐ',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 08:00 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'สวัสดีนักเรียนห้อง ม.3/1 ทุกคน วันนี้ต้องรีบส่งคู่ลุ่มห้องเรียนประจำชั้นครับ',
      },
      {
        id: 'msg-c31-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'เมื่อสัปดาห์ 08:01 น.',
        content: 'กลุ่มแชทห้องเรียนประจำชั้น ม.3/1 พร้อมใช้งาน',
        isSystemAudit: true,
      },
    ],
    'homeroom-3-1': [
      {
        id: 'msg-hr31-1',
        senderName: 'ครูภาณุวุฒิ เรื่องประเสริฐ',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 08:00 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'สวัสดีนักเรียนในที่ปรึกษา ม.3/1 ทุกคน ติดตามข่าวสารการเรียนและกิจกรรมได้ที่นี่ครับ',
      },
      {
        id: 'msg-hr31-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'เมื่อสัปดาห์ 08:01 น.',
        content: 'กลุ่มครูที่ปรึกษา ม.3/1 พร้อมใช้งาน',
        isSystemAudit: true,
      },
    ],
    'class-3-2': [
      {
        id: 'msg-c32-1',
        senderName: 'ครูวิภาดา สมบูรณ์',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 08:00 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'ยินดีต้อนรับนักเรียนห้อง ม.3/2 สู่ภาคเรียนที่ 1/2569 ครับ',
      },
      {
        id: 'msg-c32-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'เมื่อสัปดาห์ 08:01 น.',
        content: 'กลุ่มแชทห้องเรียนประจำชั้น ม.3/2 พร้อมใช้งาน',
        isSystemAudit: true,
      },
    ],
    'class-1-8': [
      {
        id: 'msg-c18-1',
        senderName: 'ครูเอกชัย มิ่งขวัญ',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 08:00 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'สวัสดีนักเรียน ม.1/8 ทุกคน อย่าลืมเตรียมสมุดโน้ตวิชาดนตรีนะครับ',
      },
      {
        id: 'msg-c18-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'เมื่อสัปดาห์ 08:01 น.',
        content: 'กลุ่มแชทห้องเรียนประจำชั้น ม.1/8 พร้อมใช้งาน',
        isSystemAudit: true,
      },
    ],
    'class-1-9': [
      {
        id: 'msg-c19-1',
        senderName: 'ครูชนิกา ทรัพย์สุข',
        senderRole: 'TEACHER',
        timestamp: 'วันนี้เวลา 08:00 น.',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: 'สวัสดีนักเรียน ม.1/9 ขอให้นักเรียนทุกคนตั้งใจเรียนและเช็คชื่อตรงเวลาค่ะ',
      },
      {
        id: 'msg-c19-2',
        senderName: 'ระบบจัดการชั้นเรียน',
        senderRole: 'SYSTEM',
        timestamp: 'เมื่อสัปดาห์ 08:01 น.',
        content: 'กลุ่มแชทห้องเรียนประจำชั้น ม.1/9 พร้อมใช้งาน',
        isSystemAudit: true,
      },
    ],
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  useEffect(() => {
    const handleSync = () => {
      // Sync trigger
    };
    window.addEventListener(CHAT_GROUPS_EVENT, handleSync);
    return () => {
      window.removeEventListener(CHAT_GROUPS_EVENT, handleSync);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedGroupId, messagesMap]);

  const currentGroup =
    UI_GROUPS.find((g) => g.id === selectedGroupId) || UI_GROUPS[1];

  const currentMessages = messagesMap[selectedGroupId] || [];

  // Filter groups based on search
  const filteredHomeroom = UI_GROUPS.filter(
    (g) =>
      g.category === 'HOMEROOM' &&
      (!searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.roomName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredClassroom = UI_GROUPS.filter(
    (g) =>
      g.category === 'CLASSROOM' &&
      (!searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.roomName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const teacherName =
      activeRole === 'ACADEMIC_ADMIN'
        ? 'นายสมชาย ใจดี (ผอ./แอดมิน)'
        : activeRole === 'STUDENT_AFFAIRS'
        ? 'ครูวิภาดา สมบูรณ์'
        : 'ครูภาณุวุฒิ เรื่องประเสริฐ';

    const newMsg: UiChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: teacherName,
      senderRole: 'TEACHER',
      timestamp: 'วันนี้เวลา 08:05 น.',
      senderAvatar: '/images/teacher/teacher_avatar.png',
      content: inputText.trim(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedGroupId]: [...(prev[selectedGroupId] || []), newMsg],
    }));

    // Broadcast through service
    try {
      messagingService.sendMessage(selectedGroupId, {
        senderId: 'current-user',
        senderName: teacherName,
        senderRole: 'TEACHER',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: inputText.trim(),
      });
    } catch {
      // ignore
    }

    setInputText('');
    setIsPlusMenuOpen(false);
  };

  // Group Badge Color Helper
  const getBadgeBg = (colorType: UiGroupItem['colorType']) => {
    switch (colorType) {
      case 'blue':
        return 'bg-[#1D75D8]';
      case 'amber':
        return 'bg-[#F59E0B]';
      case 'emerald':
        return 'bg-[#10B981]';
      case 'purple':
        return 'bg-[#8B5CF6]';
    }
  };

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
          <div className="bg-[#EBFBF5] border border-[#C6F2DF] rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shrink-0 shadow-2xs">
            <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              ♪
            </div>
            <div>
              <div className="text-xs font-bold text-[#163A66] flex items-center gap-1">
                <span>จัดกลุ่มการสื่อสารด้วยไอคอนชัดเจน 🌤️</span>
              </div>
              <p className="text-[11px] text-[#6B7C93]">
                เลือกดู{' '}
                <button
                  type="button"
                  onClick={() => setSelectedGroupId('homeroom-3-1')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  กลุ่มที่ปรึกษา
                </button>{' '}
                / {' '}
                <button
                  type="button"
                  onClick={() => setSelectedGroupId('class-3-1')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  กลุ่มห้องเรียน
                </button>
              </p>
            </div>
          </div>
        }
      />

      {/* 2. Main Interface: Left Group List + Right Chat Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Groups Navigation (Width ~ 350px / 4 Cols on large screen) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#E6EEF7] p-4 shadow-xs space-y-3.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหากลุ่ม, ห้องเรียน หรือชื่อห้อง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#163A66] placeholder-[#94A3B8] focus:outline-none focus:border-[#1D75D8] focus:bg-white transition-all font-sans"
            />
          </div>

          {/* Section 1: กลุ่มครูที่ปรึกษา */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1D75D8] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-[#163A66]">
                  กลุ่มครูที่ปรึกษา
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F2FF] text-[#1D75D8]">
                {filteredHomeroom.length}
              </span>
            </div>

            {/* Homeroom List */}
            {filteredHomeroom.map((group) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`rounded-2xl border p-3 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBFBF5] border-[#A7F3D0] shadow-xs'
                      : 'bg-[#F9FCFA] border-[#E2E8F0] hover:bg-[#F0FDF4]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#163A66] truncate">
                          {group.title}
                        </span>
                        {group.isActiveBadge && (
                          <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7C93] mt-0.5 truncate">
                        นักเรียน {group.studentCount} คน • อัปเดตล่าสุด {group.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#10B981] shrink-0 ml-2" />
                </div>
              );
            })}
          </div>

          {/* Section 2: กลุ่มห้องเรียน */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1D75D8] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-[#163A66]">
                  กลุ่มห้องเรียน
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F2FF] text-[#1D75D8]">
                {filteredClassroom.length}
              </span>
            </div>

            {/* Classroom Cards List */}
            <div className="space-y-2">
              {filteredClassroom.map((group) => {
                const isSelected = selectedGroupId === group.id;
                const badgeColor = getBadgeBg(group.colorType);

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`rounded-2xl border p-3 flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F2FF] border-[#BFDBFE] shadow-xs'
                        : 'bg-white border-[#E6EEF7] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${badgeColor} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-[#163A66] truncate block">
                          {group.title}
                        </span>
                        <p className="text-[11px] text-[#6B7C93] mt-0.5 truncate">
                          นักเรียน {group.studentCount} คน • อัปเดตล่าสุด {group.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ml-2 ${
                        isSelected ? 'text-[#1D75D8]' : 'text-[#94A3B8]'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Box matching media_1791273562793.png (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#E6EEF7] p-5 shadow-xs flex flex-col justify-between min-h-[620px]">
          <div>
            {/* Header: Large Blue Group Avatar, Title, Tag & Member Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#1D75D8] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base sm:text-lg text-[#163A66] leading-tight truncate">
                      {currentGroup.fullTitle}
                    </h2>
                    <span className="bg-[#E8F2FF] text-[#1D75D8] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {currentGroup.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7C93] mt-0.5 truncate">
                    ครูที่ปรึกษาประจำชั้น: <strong>{currentGroup.adviser}</strong> • กลุ่มสำหรับติดต่อประสานงาน แจ้งข่าวสาร และดูแลช่วยเหลือนักเรียน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMembersDrawer(true)}
                  className="rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#163A66] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#1D75D8]" />
                  <span>สมาชิก ({currentGroup.studentCount})</span>
                </button>
              </div>
            </div>

            {/* Auto-Sync Green Information Banner */}
            <div className="bg-[#EBFBF5] border border-[#C6F2DF] rounded-xl px-3.5 py-2 text-xs text-[#065F46] flex items-center gap-2 mt-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
              <span>
                กลุ่มนี้เป็น{currentGroup.tag} {currentGroup.roomName} นักเรียนจะถูกเพิ่ม/ย้ายกลุ่มให้อัตโนมัติเมื่อย้ายห้องเรียน
              </span>
            </div>

            {/* Messages Feed */}
            <div className="py-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {currentMessages.map((msg) => {
                if (msg.isSystemAudit || msg.senderRole === 'SYSTEM') {
                  return (
                    <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                      <div className="bg-[#F0F7FF] border border-[#D0E6FF] rounded-2xl p-4 text-center max-w-xl mx-auto shadow-2xs">
                        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#1E40AF]">
                          <Megaphone className="w-4 h-4 text-[#1D75D8]" />
                          <span>{msg.content}</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] mt-1 block">
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
                      <div className="text-xs font-bold text-[#6B7C93]">
                        {msg.senderName} • {msg.timestamp}
                      </div>
                      <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs sm:text-sm text-[#163A66] shadow-2xs leading-relaxed inline-block">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Chat Input Bar matching media_1791273562793.png */}
          <div className="relative pt-4 border-t border-[#F1F5F9] flex items-center gap-2.5 mt-auto">
            {/* Quick Actions Plus Menu */}
            {isPlusMenuOpen && (
              <div className="absolute bottom-16 left-0 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 w-64 text-xs font-bold text-[#163A66] space-y-1 z-20 animate-scale-up">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    showToast('เปิดตัวเลือกแนบไฟล์เอกสาร / แผนการสอน');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-slate-700 transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  <span>แนบไฟล์เอกสาร / ใบงาน</span>
                </button>
              </div>
            )}

            {/* Left Plus Button */}
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-[#E8F2FF] hover:bg-[#D9E9FF] text-[#1D75D8] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors shrink-0 shadow-2xs"
              title="เมนูเพิ่มเติม / ทดสอบย้ายห้อง"
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
                placeholder="พิมพ์ข้อความ..."
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
                  onClick={() => showToast('เปิดตัวเลือกอัปโหลดรูปภาพ')}
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
              className="w-10 h-10 rounded-full bg-[#1D75D8] hover:bg-[#1560B8] disabled:opacity-40 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors shrink-0"
              title="ส่งข้อความ"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Member Drawer / Modal */}
      {showMembersDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left border-l border-[#E6EEF7]">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1D75D8]" />
                <div>
                  <h3 className="font-bold text-[#163A66] text-sm">
                    สมาชิกกลุ่ม ({currentGroup.studentCount} คน)
                  </h3>
                  <p className="text-[11px] text-[#6B7C93]">
                    {currentGroup.fullTitle}
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
                placeholder="ค้นหาสมาชิกตามชื่อ หรือรหัส..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none font-sans"
              />
            </div>

            <div className="p-2 bg-[#E8F2FF] border-b border-[#D0E6FF] text-[11px] text-[#1D75D8] px-3.5 leading-relaxed">
              💡 <strong>ระบบดึงอัตโนมัติ:</strong> รายชื่อนักเรียนผูกกับห้องเรียน เมื่อย้ายห้อง รายชื่อจะสลับกลุ่มเองอัตโนมัติ และผลงาน/คะแนนเดิมจะติดตัวไปด้วย
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] p-2">
              {/* Teacher Adviser Item */}
              <div className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] rounded-xl transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/images/teacher/teacher_avatar.png"
                    alt={currentGroup.adviser}
                    className="w-8 h-8 rounded-full border border-sky-200 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#163A66] text-xs truncate">
                        {currentGroup.adviser}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#E8F2FF] text-[#1D75D8]">
                        ครูที่ปรึกษา
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7C93] block">
                      ผู้ดูแลประจำกลุ่ม
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock Student Members */}
              {[
                { code: '45101', name: 'ด.ช. กฤษณะ มงคลชัย', seat: 1 },
                { code: '45102', name: 'ด.ช. ณภัทร เจริญสุข', seat: 2 },
                { code: '45103', name: 'ด.ช. ธนกร พงศ์ประเสริฐ', seat: 3 },
                { code: '45104', name: 'ด.ช. ปัณณธร ศรีสมพร', seat: 4 },
                { code: '45105', name: 'ด.ญ. กัญญารัตน์ วงศ์สุวรรณ', seat: 5 },
                { code: '45106', name: 'ด.ญ. ชนัญชิดา สิทธิเดช', seat: 6 },
                { code: '45107', name: 'ด.ญ. พิมพ์มาดา อัครเดช', seat: 7 },
                { code: '45108', name: 'ด.ญ. ภัทรวดี บุญชู', seat: 8 },
              ]
                .filter(
                  (s) =>
                    !memberSearch.trim() ||
                    s.name.includes(memberSearch) ||
                    s.code.includes(memberSearch)
                )
                .map((stu) => (
                  <div
                    key={stu.code}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src="/images/banners/student-avatar.png"
                        alt={stu.name}
                        className="w-8 h-8 rounded-full border border-[#E2E8F0] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#163A66] text-xs truncate">
                            {stu.name}
                          </span>
                          <span className="text-[10px] text-[#6B7C93] font-mono">
                            #{stu.seat}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#94A3B8] font-mono block">
                          รหัส: {stu.code}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
