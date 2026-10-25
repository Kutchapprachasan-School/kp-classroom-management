// src/views/GoldQuestJoinView.tsx
// หน้าจอเข้าห้องสอบฝั่งนักเรียน (Gold Quest Join Screen)
// ออกแบบสำหรับหน้าจอมือถือ (Mobile-First): รองรับทั้งการสแกนผ่าน QR Code และพิมพ์รหัส PIN 6 หลัก
// บังคับแป้นพิมพ์ตัวเลข (inputMode="numeric") พร้อมเลือกอวตารและรายชื่อนักเรียนในห้อง

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Coins,
  Sparkles,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gamepad2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { goldQuestService } from '../services/goldQuestService';

export interface RoomStudent {
  id: string;
  name: string;
  studentId?: string;
}

export const AVATAR_OPTIONS = [
  { id: 'knight', emoji: '⚔️', label: 'อัศวินทองคำ' },
  { id: 'mage', emoji: '🧙‍♂️', label: 'จอมเวทปราชญ์' },
  { id: 'ninja', emoji: '🥷', label: 'นินจาเงา' },
  { id: 'fox', emoji: '🦊', label: 'จิ้งจอกสายฟ้า' },
  { id: 'dragon', emoji: '🐉', label: 'มังกรเพลิง' },
  { id: 'crown', emoji: '👑', label: 'ราชาโจรสลัด' },
];

// Helper Hooks สำหรับการทำงานบน Vite SPA (ไม่ต้องพึ่งพา next/navigation)
function useSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(() => {
    return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  });

  useEffect(() => {
    const handlePopState = () => {
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return params;
}

function useRouter() {
  return useMemo(
    () => ({
      push: (url: string) => {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
      replace: (url: string) => {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
    }),
    []
  );
}

function GoldQuestJoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ดึงค่า room และ pin จาก QR Code URL (ถ้ามี)
  const urlRoomId = searchParams.get('room') || '';
  const urlPin = searchParams.get('pin') || '';

  const [roomId, setRoomId] = useState<string>(urlRoomId);
  const [pin, setPin] = useState<string>(urlPin);
  const [studentName, setStudentName] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('⚔️');

  // ข้อมูลห้องสอบที่ดึงมาจาก API (เมื่อกรอก PIN ครบ 6 หลัก)
  const [examTitle, setExamTitle] = useState<string>('');
  const [availableStudents, setAvailableStudents] = useState<RoomStudent[]>([]);
  const [isCheckingRoom, setIsCheckingRoom] = useState<boolean>(false);
  const [isRoomVerified, setIsRoomVerified] = useState<boolean>(false);

  // สถานะการกดเข้าร่วมเกม
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState<boolean>(false);

  // อัปเดตค่าหาก URL เปลี่ยน
  useEffect(() => {
    if (urlRoomId) setRoomId(urlRoomId);
    if (urlPin && /^\d{6}$/.test(urlPin)) {
      setPin(urlPin);
    }
  }, [urlRoomId, urlPin]);

  // ตรวจสอบห้องสอบอัตโนมัติเมื่อกรอก PIN ครบ 6 หลัก
  useEffect(() => {
    const verifyPinAndFetchRoom = async () => {
      if (pin.length !== 6) {
        setIsRoomVerified(false);
        setAvailableStudents([]);
        setExamTitle('');
        return;
      }

      setIsCheckingRoom(true);
      setErrorMsg(null);

      try {
        const query = new URLSearchParams({
          pin,
          ...(roomId ? { roomId } : {}),
        });
        const res = await fetch(`/api/live-classroom/gold-quest?${query.toString()}`);

        if (res.ok) {
          const data = await res.json();
          if (data && data.isActive !== false) {
            setIsRoomVerified(true);
            if (data.roomId) setRoomId(data.roomId);
            if (data.examTitle) setExamTitle(data.examTitle);
            if (Array.isArray(data.students)) {
              setAvailableStudents(data.students);
            }
          } else {
            setIsRoomVerified(false);
          }
        } else {
          // หากไม่มี endpoint API ให้ตรวจสอบห้องจาก goldQuestService
          const localRoom = goldQuestService.findRoom(roomId, pin);
          if (localRoom && localRoom.isActive) {
            setIsRoomVerified(true);
            if (localRoom.roomId) setRoomId(localRoom.roomId);
            if (localRoom.examTitle) setExamTitle(localRoom.examTitle);
            if (Array.isArray(localRoom.students)) setAvailableStudents(localRoom.students);
          } else {
            setIsRoomVerified(true);
          }
        }
      } catch {
        // กรณี API ยังไม่ได้สร้างหรือออฟไลน์ ให้ยังสามารถกรอกชื่อเข้าเล่นได้ตามปกติ
        const localRoom = goldQuestService.findRoom(roomId, pin);
        if (localRoom && localRoom.isActive) {
          if (localRoom.roomId) setRoomId(localRoom.roomId);
          if (localRoom.examTitle) setExamTitle(localRoom.examTitle);
          if (Array.isArray(localRoom.students)) setAvailableStudents(localRoom.students);
        }
        setIsRoomVerified(true);
      } finally {
        setIsCheckingRoom(false);
      }
    };

    verifyPinAndFetchRoom();
  }, [pin, roomId]);

  // บังคับรับเฉพาะตัวเลขสูงสุด 6 หลัก
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    setErrorMsg(null);
  };

  // เมื่อเลือกชื่อจากรายการนักเรียนในห้อง
  const handleSelectRosterStudent = (student: RoomStudent) => {
    setSelectedStudentId(student.id);
    setStudentName(student.name);
    setErrorMsg(null);
  };

  // กดปุ่มเข้าสู่เกม Gold Quest
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (pin.length !== 6) {
      setErrorMsg('กรุณากรอกรหัส PIN ห้องสอบให้ครบ 6 หลัก');
      return;
    }

    if (!studentName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล หรือเลือกชื่อของคุณก่อนเข้าห้องสอบ');
      return;
    }

    setIsJoining(true);

    try {
      const generatedStudentId =
        selectedStudentId || `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      let data: { roomId?: string; error?: string } = {};

      try {
        const res = await fetch('/api/live-classroom/gold-quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'JOIN_ROOM',
            roomId: roomId || 'default-room',
            pin,
            student: {
              id: generatedStudentId,
              name: studentName.trim(),
              avatar: selectedAvatar,
            },
          }),
        });
        data = await res.json().catch(() => ({}));

        if (!res.ok && data?.error) {
          setErrorMsg(data.error);
          setIsJoining(false);
          return;
        }
      } catch {
        // Fallback Client Storage เมื่อไม่มี API Server
      }

      // Sync ไปยัง local goldQuestService ด้วยเสมอ เพื่อให้ข้ามแท็บผ่าน BroadcastChannel / localStorage ทำงานทันที
      goldQuestService.joinRoom({
        roomId: data?.roomId || roomId || 'default-room',
        pin,
        student: {
          id: generatedStudentId,
          name: studentName.trim(),
          avatar: selectedAvatar,
        },
      });

      // บันทึกข้อมูลผู้เล่นลง sessionStorage สำหรับหน้าทำข้อสอบ
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'gold_quest_player',
          JSON.stringify({
            studentId: generatedStudentId,
            name: studentName.trim(),
            avatar: selectedAvatar,
            roomId: data?.roomId || roomId || 'default-room',
            pin,
          })
        );
      }

      setJoinedSuccess(true);

      // พาไปยังหน้าเล่นเกมฝั่งนักเรียน
      setTimeout(() => {
        const targetRoom = data?.roomId || roomId || 'default-room';
        router.push(
          `/live-classroom/gold-quest/play?room=${encodeURIComponent(
            targetRoom
          )}&pin=${encodeURIComponent(pin)}&studentId=${encodeURIComponent(generatedStudentId)}`
        );
      }, 1200);
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อห้องสอบได้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ต');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* แสงพื้นหลังตกแต่งธีม Gold Quest */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10 space-y-5 my-auto">
        {/* ส่วนหัวโลโก้เกม Gold Quest */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/25 mb-1">
            <Coins className="w-9 h-9 stroke-[2.5]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full">
              Live Classroom Arena
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            GOLD <span className="text-amber-400">QUEST</span>
          </h1>
          <p className="text-xs text-slate-400">
            {examTitle ? examTitle : 'ทำข้อสอบชิงไหวพริบและสะสมทองคำหน้าห้องเรียน'}
          </p>
        </div>

        {/* การ์ดหลัก */}
        <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          {/* แจ้งเตือนเมื่อสแกนมาจาก QR Code สำเร็จ */}
          {urlPin && (
            <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-2xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>สแกน QR Code สำเร็จ! กรอกรหัส PIN 6 หลักให้อัตโนมัติแล้ว</span>
            </div>
          )}

          {/* แจ้งเตือนเมื่อเข้าห้องสำเร็จ */}
          {joinedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-3xl animate-bounce">
                {selectedAvatar}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">
                  ยินดีต้อนรับ {studentName}!
                </h2>
                <p className="text-xs text-emerald-300 font-semibold">
                  กำลังพาเข้าสู่สนามสอบ Gold Quest...
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinGame} className="space-y-5">
              {/* 1. ช่องกรอกรหัส PIN 6 หลัก */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>รหัส PIN ห้องสอบ (6 หลัก)</span>
                  </label>
                  {isCheckingRoom && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> ตรวจสอบห้อง...
                    </span>
                  )}
                  {!isCheckingRoom && isRoomVerified && pin.length === 6 && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> พบห้องสอบแล้ว
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="000000"
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 focus:outline-none rounded-2xl py-3.5 px-4 text-center text-3xl sm:text-4xl font-mono font-black tracking-[0.35em] text-amber-400 placeholder:text-slate-800 transition"
                />
              </div>

              {/* 2. รายชื่อนักเรียนในห้อง (แสดงเมื่อมีรายชื่อนักเรียนที่เช็กชื่อมาเรียนแล้ว) */}
              {availableStudents.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>แตะเลือกชื่อของคุณจากในห้องเรียน</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    {availableStudents.map((std) => {
                      const isSelected = selectedStudentId === std.id;
                      return (
                        <button
                          key={std.id}
                          type="button"
                          onClick={() => handleSelectRosterStudent(std)}
                          className={`text-left px-3 py-2 rounded-xl text-xs font-bold truncate transition border ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {std.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. ช่องกรอกชื่อเล่น / ชื่อ-นามสกุล */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ชื่อของคุณ (แสดงบนกระดานคะแนน)</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setSelectedStudentId('');
                    setErrorMsg(null);
                  }}
                  placeholder="เช่น น้องมินท์ เลขที่ 12"
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 focus:outline-none rounded-2xl py-3 px-4 text-sm font-bold text-white placeholder:text-slate-600 transition"
                />
              </div>

              {/* 4. เลือกอวตารประจำตัว */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>เลือกตัวละครประจำตัว</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((item) => {
                    const isActive = selectedAvatar === item.emoji;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAvatar(item.emoji)}
                        title={item.label}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-2xl text-xl border transition ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* แสดงข้อความแจ้งเตือนข้อผิดพลาด */}
              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ปุ่มกดเข้าสู่เกม */}
              <button
                type="submit"
                disabled={isJoining || pin.length !== 6 || !studentName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-base shadow-xl shadow-amber-500/20 transition active:scale-[0.99]"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังเข้าสู่ห้องสอบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>เข้าสู่สนามสอบ Gold Quest</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* คำแนะนำด้านล่าง */}
        <p className="text-center text-[11px] text-slate-500">
          สแกน QR Code บนจอโปรเจกเตอร์หน้าห้องเรียน หรือดูรหัส PIN 6 หลักจากคุณครู
        </p>
      </div>
    </div>
  );
}

// หุ้มด้วย Suspense
export const GoldQuestJoinView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span>กำลังโหลดหน้าจอเข้าห้องสอบ...</span>
        </div>
      }
    >
      <GoldQuestJoinContent />
    </Suspense>
  );
};

export default GoldQuestJoinView;
