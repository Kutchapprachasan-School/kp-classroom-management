// src/views/LiveClassroomView.tsx
// หน้าจอหลักเครื่องมือตอนสอน (Live Classroom Teaching Companion)
// รวม 4 แท็บย่อย: 🎯 สุ่มชื่อ, ⏱️ ตอบคำถามจับเวลา, 👥 จัดกลุ่มกิจกรรม, 🏆 บอร์ดรางวัล & Lucky Draw
// โหลดข้อมูลห้องเรียนและนักเรียนจริง 100% (Strict Zero Mock Data Policy)

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, Dices } from 'lucide-react';
import { soundFX } from '../services/soundFXEngine';
import {
  liveClassroomService,
  type LiveClassroomData,
  type LiveStudent,
} from '../services/liveClassroomService';
import { useOptimisticRewards } from '../hooks/useOptimisticRewards';
import { LiveClassroomHeader, type SubTab } from '../components/live-classroom/LiveClassroomHeader';
import { RandomPickerSubTab } from '../components/live-classroom/RandomPickerSubTab';
import { LiveTimerSubTab } from '../components/live-classroom/LiveTimerSubTab';
import { GroupGeneratorSubTab } from '../components/live-classroom/GroupGeneratorSubTab';
import { RewardBoardSubTab } from '../components/live-classroom/RewardBoardSubTab';
import { LuckyTicketDrawModal } from '../components/live-classroom/LuckyTicketDrawModal';
import type { StudentGroup } from '../utils/liveClassroomAlgorithms';

export interface LiveClassroomViewProps {
  initialClassroomId?: string;
}

export const LiveClassroomView: React.FC<LiveClassroomViewProps> = ({
  initialClassroomId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [classrooms, setClassrooms] = useState<LiveClassroomData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassroomId || '');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<SubTab>('picker');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !soundFX.getMuted());
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState<boolean>(false);

  // SubTab States
  const [selectedStudent, setSelectedStudent] = useState<LiveStudent | null>(null);
  const [rollingStudent, setRollingStudent] = useState<LiveStudent | null>(null);
  const [challengers, setChallengers] = useState<LiveStudent[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [syncingAttendanceIds, setSyncingAttendanceIds] = useState<string[]>([]);

  // Current Classroom Derived Data
  const currentClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId) || classrooms[0];
  }, [classrooms, selectedClassId]);

  const students = useMemo(() => {
    return currentClassroom?.students || [];
  }, [currentClassroom]);

  const presentStudents = useMemo(() => {
    return students.filter((s) => s.present);
  }, [students]);

  // Sound triggering helper
  const triggerSound = useCallback(
    (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => {
      if (!soundEnabled) return;
      if (type === 'tick') soundFX.playTick(freq);
      if (type === 'coin') soundFX.playCoin();
      if (type === 'fanfare') soundFX.playFanfare();
      if (type === 'buzzer') soundFX.playBuzzer();
    },
    [soundEnabled]
  );

  // Update student balances in state
  const handleUpdateStudentBalances = useCallback(
    (studentIds: string[], type: 'coin' | 'ticket', delta: number) => {
      setClassrooms((prev) =>
        prev.map((cls) => {
          if (cls.id !== selectedClassId) return cls;
          return {
            ...cls,
            students: cls.students.map((st) => {
              if (!studentIds.includes(st.id)) return st;
              return {
                ...st,
                sessionCoins:
                  type === 'coin'
                    ? Math.max(0, st.sessionCoins + delta)
                    : st.sessionCoins,
                sessionTickets:
                  type === 'ticket'
                    ? Math.max(0, st.sessionTickets + delta)
                    : st.sessionTickets,
                totalCoins:
                  type === 'coin'
                    ? Math.max(0, st.totalCoins + delta)
                    : st.totalCoins,
                totalTickets:
                  type === 'ticket'
                    ? Math.max(0, st.totalTickets + delta)
                    : st.totalTickets,
              };
            }),
          };
        })
      );
    },
    [selectedClassId]
  );

  // Optimistic Rewards Hook with Offline Queue
  const {
    ledger,
    setInitialLedger,
    toast,
    isOnline,
    pendingQueueCount,
    isFlushingQueue,
    flushOfflineQueue,
    giveReward,
    undoReward,
    consumeTicket,
  } = useOptimisticRewards({
    classroomId: selectedClassId,
    onUpdateBalances: handleUpdateStudentBalances,
    onPlaySound: (type) => triggerSound(type),
  });

  // โหลดข้อมูลห้องเรียนและนักเรียนจริง 100% (Strict Zero Mock Data Policy)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const loaded = await liveClassroomService.loadClassroomsData();
        if (isMounted) {
          setClassrooms(loaded);
          if (loaded.length > 0) {
            const initialId =
              loaded.find((c) => c.id === initialClassroomId)?.id || loaded[0].id;
            setSelectedClassId(initialId);
            const found = loaded.find((c) => c.id === initialId);
            if (found && found.initialLedger) {
              setInitialLedger(found.initialLedger);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load live classroom data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialClassroomId, setInitialLedger]);

  // เมื่อครูเปลี่ยนห้องเรียน
  const handleSelectClassroom = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const target = classrooms.find((c) => c.id === newClassId);
    if (target && target.initialLedger) {
      setInitialLedger(target.initialLedger);
    }
    setSelectedStudent(null);
    setRollingStudent(null);
    setChallengers([]);
    setGroups([]);
  };

  // Fullscreen Projector Toggle & Fullscreen Change Listener
  const toggleProjectorMode = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsProjectorMode(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsProjectorMode(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsProjectorMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sound FX Toggle
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.setMuted(!next);
      return next;
    });
  }, []);

  // สลับสถานะมาเรียน/ขาดเรียน แบบ Optimistic UI พร้อม First-Toggle Init & Auto-Clear Safeguard
  const handleToggleAttendance = useCallback(
    async (studentId: string) => {
      if (syncingAttendanceIds.includes(studentId)) return;

      const target = students.find((s) => s.id === studentId);
      if (!target) return;

      const nextPresent = !target.present;
      triggerSound('tick', nextPresent ? 700 : 400);
      setSyncingAttendanceIds((prev) => [...prev, studentId]);

      // Optimistic update
      setClassrooms((prev) =>
        prev.map((cls) => {
          if (cls.id !== selectedClassId) return cls;
          return {
            ...cls,
            students: cls.students.map((st) =>
              st.id === studentId ? { ...st, present: nextPresent } : st
            ),
          };
        })
      );

      // Auto-Clear Safeguard: หากสลับเป็นขาดเรียน ให้ลบออกจากแท่นสุ่มและเวทีดวลทันที
      if (!nextPresent) {
        if (selectedStudent?.id === studentId) setSelectedStudent(null);
        if (rollingStudent?.id === studentId) setRollingStudent(null);
        setChallengers((prev) => prev.filter((c) => c.id !== studentId));
      }

      try {
        const allIds = students.map((s) => s.id);
        await liveClassroomService.toggleAttendance(
          selectedClassId,
          studentId,
          nextPresent,
          allIds
        );
      } catch (err) {
        console.error('Attendance toggle failed:', err);
        triggerSound('buzzer');
        // Rollback
        setClassrooms((prev) =>
          prev.map((cls) => {
            if (cls.id !== selectedClassId) return cls;
            return {
              ...cls,
              students: cls.students.map((st) =>
                st.id === studentId ? { ...st, present: target.present } : st
              ),
            };
          })
        );
      } finally {
        setSyncingAttendanceIds((prev) => prev.filter((id) => id !== studentId));
      }
    },
    [
      syncingAttendanceIds,
      students,
      selectedClassId,
      selectedStudent,
      rollingStudent,
      triggerSound,
    ]
  );

  // Global Hotkeys (Spacebar, F, M) พร้อม Input Field Guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeTab === 'timer') {
          setIsTimerRunning((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleProjectorMode();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, toggleProjectorMode, toggleSound]);

  // Totals
  const sessionTotalCoins = useMemo(() => {
    return students.reduce((sum, s) => sum + s.sessionCoins, 0);
  }, [students]);

  const sessionTotalTickets = useMemo(() => {
    return students.reduce((sum, s) => sum + s.sessionTickets, 0);
  }, [students]);

  // Consume ticket handler for Lucky Ticket Draw (Optimistic + LocalStorage Gacha State)
  const handleConsumeTicket = useCallback(
    (studentId: string) => {
      consumeTicket(studentId);
    },
    [consumeTicket]
  );

  // Class-wide bonus handler
  const handleGiveClassBonus = useCallback(() => {
    triggerSound('fanfare');
    giveReward(
      presentStudents.map((s) => s.id),
      'coin',
      1,
      '🎉 โบนัสตั้งใจเรียนทั้งห้อง'
    );
  }, [presentStudents, triggerSound, giveReward]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-[#163A66] text-sm">
          กำลังเตรียมห้องเรียนและข้อมูลนักเรียนจริง...
        </p>
      </div>
    );
  }

  if (classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
          <Dices className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#163A66]">ยังไม่พบห้องเรียนในระบบ</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          กรุณาเพิ่มห้องเรียนหรือนำเข้ารายชื่อนักเรียนในหน้ารายวิชาก่อนเริ่มใช้งานเครื่องมือตอนสอนค่ะ
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isProjectorMode
          ? 'bg-slate-950 text-slate-100 p-6 text-base'
          : 'bg-[#F7FAFF] text-[#163A66] p-4 md:p-6 text-sm'
      }`}
    >
      {/* Toast Notification (Polished: Smooth Ease-Out & Harmonious Contrast Tokens) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold transition-all duration-300 ease-out border backdrop-blur-sm ${
            toast.variant === 'warning'
              ? 'bg-amber-400 border-amber-500/50 text-amber-950 font-black shadow-amber-500/20'
              : toast.variant === 'error'
              ? 'bg-rose-600 border-rose-500/50 text-white font-extrabold shadow-rose-600/20'
              : 'bg-emerald-600 border-emerald-500/50 text-white font-extrabold shadow-emerald-600/20'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Control Bar */}
      <LiveClassroomHeader
        classrooms={classrooms.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
        }))}
        selectedClassId={selectedClassId}
        onSelectClassId={handleSelectClassroom}
        presentCount={presentStudents.length}
        totalCount={students.length}
        sessionCoins={sessionTotalCoins}
        sessionTickets={sessionTotalTickets}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isProjectorMode={isProjectorMode}
        onToggleProjector={toggleProjectorMode}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isOnline={isOnline}
        pendingQueueCount={pendingQueueCount}
        isFlushingQueue={isFlushingQueue}
        onFlushQueue={flushOfflineQueue}
        onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
      />

      {/* Main Sub-tool Workspace (Persistent Tab Containers to preserve Background Timer & Random Pool) */}
      <main className="flex-1 mt-5 flex flex-col">
        {/* Tab 1: Random Picker */}
        <div className={activeTab === 'picker' ? 'flex-1 flex flex-col' : 'hidden'}>
          <RandomPickerSubTab
            students={students}
            classroomId={selectedClassId}
            isProjectorMode={isProjectorMode}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            rollingStudent={rollingStudent}
            setRollingStudent={setRollingStudent}
            onGiveReward={giveReward}
            onPlaySound={triggerSound}
            onToggleAttendance={handleToggleAttendance}
            syncingAttendanceIds={syncingAttendanceIds}
          />
        </div>

        {/* Tab 2: Live Timer & Versus */}
        <div className={activeTab === 'timer' ? 'flex-1 flex flex-col' : 'hidden'}>
          <LiveTimerSubTab
            students={students}
            isProjectorMode={isProjectorMode}
            challengers={challengers}
            setChallengers={setChallengers}
            isTimerRunning={isTimerRunning}
            setIsTimerRunning={setIsTimerRunning}
            onGiveReward={giveReward}
            onPlaySound={triggerSound}
          />
        </div>

        {/* Tab 3: Group Generator */}
        <div className={activeTab === 'groups' ? 'flex-1 flex flex-col' : 'hidden'}>
          <GroupGeneratorSubTab
            students={students}
            classroomId={selectedClassId}
            isProjectorMode={isProjectorMode}
            groups={groups}
            setGroups={setGroups}
            onGiveRewardGroup={(ids, name) =>
              giveReward(ids, 'coin', 1, `รางวัลยกกลุ่ม ${name}`)
            }
            onPlaySound={triggerSound}
          />
        </div>

        {/* Tab 4: Reward Board */}
        <div className={activeTab === 'rewards' ? 'flex-1 flex flex-col' : 'hidden'}>
          <RewardBoardSubTab
            students={students}
            ledger={ledger}
            sessionTotalTickets={sessionTotalTickets}
            isProjectorMode={isProjectorMode}
            onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
            onUndo={undoReward}
            onGiveClassBonus={handleGiveClassBonus}
          />
        </div>
      </main>

      {/* Lucky Ticket Draw Modal */}
      <LuckyTicketDrawModal
        isOpen={isLuckyDrawOpen}
        onClose={() => setIsLuckyDrawOpen(false)}
        students={students}
        onGiveReward={giveReward}
        onConsumeTicket={handleConsumeTicket}
        onPlaySound={triggerSound}
      />
    </div>
  );
};

export default LiveClassroomView;
