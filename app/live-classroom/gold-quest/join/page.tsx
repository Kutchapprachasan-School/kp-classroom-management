// app/live-classroom/gold-quest/join/page.tsx
// หน้าจอต้อนรับบนมือถือของนักเรียน (Gold Quest Join Screen)
// ออกแบบมาเพื่อสมาร์ทโฟนโดยเฉพาะ (Mobile-First):
// - กรอกรหัส PIN 6 หลัก (inputMode="numeric")
// - ระบบค้นหาและเลือกรายชื่อนักเรียนในห้องอัตโนมัติ
// - เชื่อมต่อไปยังหน้าทำข้อสอบ /live-classroom/gold-quest/play

'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  Smartphone,
  KeyRound,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { goldQuestService } from '../../../../src/services/goldQuestService';

interface ClassroomStudentOption {
  id: string;
  number: number;
  name: string;
}

// Navigation Hooks ที่ทำงานได้ 100% ทั้งใน Next.js และ Single-Page Application (Vite)
function useSafeSearchParams() {
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

function useSafeRouter() {
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

export default function StudentJoinPage() {
  const router = useSafeRouter();
  const searchParams = useSafeSearchParams();

  // ดึงค่า PIN หรือ RoomId จาก URL Query Params หากสแกนผ่าน QR Code มา
  const urlRoom = searchParams.get('room') || searchParams.get('roomId') || '';
  const urlPin = searchParams.get('pin') || '';

  const [pinCode, setPinCode] = useState<string>(urlPin);
  const [roomId, setRoomId] = useState<string>(urlRoom);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentList, setStudentList] = useState<ClassroomStudentOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // อัปเดตเมื่อ URL Query เปลี่ยน
  useEffect(() => {
    if (urlPin) setPinCode(urlPin);
    if (urlRoom) setRoomId(urlRoom);
  }, [urlPin, urlRoom]);

  // เมื่อกรอก PIN ครบ 6 หลัก ให้ดึงรายชื่อนักเรียนในห้องนั้นมาแสดงใน Dropdown อัตโนมัติ
  useEffect(() => {
    if (pinCode.length === 6) {
      async function fetchRoomRoster() {
        try {
          setIsLoadingStudents(true);
          setErrorMessage(null);

          let fetched = false;

          // 1. ลองดึงจาก API Endpoint
          try {
            const res = await fetch(`/api/live-classroom/gold-quest/join?pin=${pinCode}`);
            if (res.ok) {
              const data = await res.json();
              if (data.roomId) setRoomId(data.roomId);
              if (data.students && data.students.length > 0) {
                setStudentList(data.students);
                setSelectedStudentId(data.students[0].id);
                fetched = true;
              }
            }
          } catch {
            // fallback
          }

          // 2. ถ้า API ยังไม่พร้อมหรือออฟไลน์ ให้ดึงจาก goldQuestService ในเครื่อง
          if (!fetched) {
            const localRoom = goldQuestService.findRoom(roomId, pinCode);
            if (localRoom && localRoom.isActive) {
              setRoomId(localRoom.roomId);
              const mappedStudents = localRoom.students.map((st, idx) => ({
                id: st.id,
                number: idx + 1,
                name: st.name,
              }));
              setStudentList(mappedStudents);
              if (mappedStudents.length > 0) {
                setSelectedStudentId(mappedStudents[0].id);
              }
              fetched = true;
            }
          }

          if (!fetched && !studentList.length) {
            setErrorMessage('ไม่พบห้องสอบที่ตรงกับรหัส PIN นี้ กรุณาตรวจสอบรหัสอีกครั้ง');
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
          setErrorMessage(message);
          setStudentList([]);
        } finally {
          setIsLoadingStudents(false);
        }
      }

      fetchRoomRoster();
    } else {
      setStudentList([]);
      setSelectedStudentId('');
      setErrorMessage(null);
    }
  }, [pinCode, roomId]);

  // เมื่อนักเรียนกดปุ่มยืนยันเข้าสู่สนามสอบ
  const handleJoinExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length !== 6) {
      setErrorMessage('กรุณากรอกรหัส PIN 6 หลักให้ถูกต้อง');
      return;
    }
    if (!selectedStudentId) {
      setErrorMessage('กรุณาเลือกชื่อนักเรียนของคุณ');
      return;
    }

    const selectedStudent = studentList.find((s) => s.id === selectedStudentId);

    // ซิงค์เข้าระบบ goldQuestService
    goldQuestService.joinRoom({
      roomId,
      pin: pinCode,
      student: {
        id: selectedStudentId,
        name: selectedStudent?.name || 'ผู้เล่น',
        avatar: '⚔️',
      },
    });

    // บันทึกลง sessionStorage สำหรับหน้าเล่นเกม
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'gold_quest_player',
        JSON.stringify({
          studentId: selectedStudentId,
          name: selectedStudent?.name || 'ผู้เล่น',
          avatar: '⚔️',
          roomId,
          pin: pinCode,
        })
      );
    }

    startTransition(() => {
      // พาไปหน้าเกม Gold Quest บนมือถือ พร้อมส่งรหัสห้องและรหัสประจำตัวนักเรียนติดไปด้วย
      router.push(
        `/live-classroom/gold-quest/play?roomId=${encodeURIComponent(
          roomId
        )}&studentId=${encodeURIComponent(selectedStudentId)}&pin=${encodeURIComponent(pinCode)}`
      );
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Glow Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gold Quest Arena
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            สแกนหรือกรอกรหัส PIN เพื่อเข้าสู่สนามสอบและแย่งชิงทองคำแบบ Real-time
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-rose-300 relative z-10">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Join Form */}
        <form onSubmit={handleJoinExam} className="space-y-5 relative z-10">
          {/* PIN Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              <span>รหัส PIN ห้องสอบ 6 หลัก</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="เช่น 849201"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-center font-mono font-black text-2xl tracking-widest text-amber-400 placeholder-slate-600 outline-none transition"
            />
          </div>

          {/* Student Roster Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>เลือกชื่อของคุณในห้องเรียน</span>
            </label>

            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={isLoadingStudents || studentList.length === 0}
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3.5 font-bold text-sm text-white outline-none transition disabled:opacity-50 appearance-none cursor-pointer"
              >
                {isLoadingStudents ? (
                  <option value="">กำลังค้นหารายชื่อห้องเรียน...</option>
                ) : studentList.length === 0 ? (
                  <option value="">(กรุณากรอกรหัส PIN 6 หลักด้านบนก่อน)</option>
                ) : (
                  studentList.map((st) => (
                    <option key={st.id} value={st.id}>
                      เลขที่ {st.number} — {st.name}
                    </option>
                  ))
                )}
              </select>

              {isLoadingStudents && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !selectedStudentId || studentList.length === 0}
            className="w-full mt-3 flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/25 transition transform active:scale-95 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>เข้าสู่ห้องสอบ Gold Quest</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center relative z-10">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>KP Classroom Management • Secure Exam Gateway</span>
          </p>
        </div>
      </div>
    </main>
  );
}
