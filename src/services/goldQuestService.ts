// src/services/goldQuestService.ts
// Service กลางสำหรับจัดการสถานะห้องสอบสด Gold Quest Arena
// รองรับ Real-time Synchronization ข้ามแท็บและข้ามหน้าต่างด้วย BroadcastChannel + LocalStorage
// ทำงานได้ 100% ทั้งแบบมี Backend API และโหมด Offline / Single-Page Application

import type {
  GoldQuestStudent,
  GoldQuestQuestion,
  GoldQuestLog,
  GoldQuestRoomState,
} from '../../app/api/live-classroom/gold-quest/route';

export type {
  GoldQuestStudent,
  GoldQuestQuestion,
  GoldQuestLog,
  GoldQuestRoomState,
};

const STORAGE_PREFIX = 'kp_gold_quest_room_';
const CHANNEL_NAME = 'kp_gold_quest_bus';

class GoldQuestService {
  private channel: BroadcastChannel | null = null;
  private memoryRooms: Map<string, GoldQuestRoomState> = new Map();
  private listeners: Set<(room: GoldQuestRoomState) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'ROOM_UPDATED' && event.data?.room) {
            const updatedRoom: GoldQuestRoomState = event.data.room;
            this.memoryRooms.set(updatedRoom.roomId, updatedRoom);
            this.notifyListeners(updatedRoom);
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      // Storage event fallback สำหรับแท็บข้ามหน้าต่าง
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(STORAGE_PREFIX) && e.newValue) {
          try {
            const updatedRoom = JSON.parse(e.newValue);
            this.memoryRooms.set(updatedRoom.roomId, updatedRoom);
            this.notifyListeners(updatedRoom);
          } catch {
            // ignore JSON parse error
          }
        }
      });
    }
  }

  private notifyListeners(room: GoldQuestRoomState) {
    this.listeners.forEach((listener) => {
      try {
        listener(room);
      } catch (err) {
        console.error('GoldQuest listener error:', err);
      }
    });
  }

  public subscribe(listener: (room: GoldQuestRoomState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private persistRoom(room: GoldQuestRoomState) {
    this.memoryRooms.set(room.roomId, room);
    if (typeof window !== 'undefined') {
      try {
        const serialized = JSON.stringify(room);
        localStorage.setItem(`${STORAGE_PREFIX}${room.roomId}`, serialized);
        localStorage.setItem(`${STORAGE_PREFIX}pin_${room.pin}`, serialized);
      } catch (e) {
        console.warn('Failed to persist GoldQuest room to localStorage:', e);
      }

      try {
        this.channel?.postMessage({ type: 'ROOM_UPDATED', room });
      } catch {
        // ignore broadcast error
      }
    }
    this.notifyListeners(room);
  }

  public findRoom(roomId?: string | null, pin?: string | null): GoldQuestRoomState | undefined {
    // 1. ค้นหาจาก Memory
    if (roomId && this.memoryRooms.has(roomId)) {
      const room = this.memoryRooms.get(roomId)!;
      if (!pin || room.pin === pin) return room;
    }

    if (pin) {
      for (const room of this.memoryRooms.values()) {
        if (room.pin === pin && room.isActive) return room;
      }
    }

    // 2. ค้นหาจาก LocalStorage
    if (typeof window !== 'undefined') {
      if (pin) {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}pin_${pin}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this.memoryRooms.set(parsed.roomId, parsed);
            return parsed;
          } catch {
            // ignore
          }
        }
      }

      if (roomId) {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this.memoryRooms.set(parsed.roomId, parsed);
            return parsed;
          } catch {
            // ignore
          }
        }
      }
    }

    return undefined;
  }

  public startRoom(params: {
    roomId: string;
    pin?: string;
    classroomId?: string;
    examTitle: string;
    students?: Partial<GoldQuestStudent>[];
    questions?: GoldQuestQuestion[];
  }): GoldQuestRoomState {
    const generatedPin =
      params.pin && /^\d{6}$/.test(params.pin)
        ? params.pin
        : String(Math.floor(100000 + Math.random() * 900000));

    const initialStudents: GoldQuestStudent[] = (params.students || []).map((s, idx) => ({
      id: s.id || `std_${idx + 1}`,
      name: s.name || `นักเรียนคนที่ ${idx + 1}`,
      studentId: s.studentId,
      avatar: s.avatar || '⚔️',
      gold: typeof s.gold === 'number' ? s.gold : 0,
      correctCount: s.correctCount || 0,
      wrongCount: s.wrongCount || 0,
      streak: s.streak || 0,
      isJoined: Boolean(s.isJoined),
    }));

    const newRoom: GoldQuestRoomState = {
      roomId: params.roomId,
      pin: generatedPin,
      classroomId: params.classroomId,
      examTitle: params.examTitle,
      isActive: true,
      status: 'active',
      students: initialStudents,
      questions: params.questions || [],
      logs: [
        {
          id: `log_${Date.now()}`,
          message: `เปิดห้องสอบ "${params.examTitle}" ด้วยรหัส PIN: ${generatedPin}`,
          type: 'system',
          timestamp: new Date().toISOString(),
        },
      ],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.persistRoom(newRoom);
    return newRoom;
  }

  public joinRoom(params: {
    roomId?: string;
    pin: string;
    student: { id?: string; name: string; avatar?: string };
  }): { success: boolean; room?: GoldQuestRoomState; student?: GoldQuestStudent; error?: string } {
    const room = this.findRoom(params.roomId, params.pin);
    if (!room || !room.isActive || room.status === 'ended') {
      return { success: false, error: 'ไม่พบห้องสอบที่ตรงกับรหัส PIN นี้ หรือห้องสอบปิดไปแล้ว' };
    }

    const cleanName = params.student.name.trim();
    const chosenAvatar = params.student.avatar || '⚔️';

    let targetStudent = room.students.find(
      (s) => s.id === params.student.id || s.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (targetStudent) {
      targetStudent.avatar = chosenAvatar;
      targetStudent.isJoined = true;
      targetStudent.joinedAt = new Date().toISOString();
    } else {
      targetStudent = {
        id: params.student.id || `std_${Date.now()}`,
        name: cleanName,
        avatar: chosenAvatar,
        gold: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        isJoined: true,
        joinedAt: new Date().toISOString(),
      };
      room.students.push(targetStudent);
    }

    room.logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      message: `${targetStudent.avatar} ${targetStudent.name} เข้าร่วมสนามสอบแล้ว!`,
      type: 'join',
      timestamp: new Date().toISOString(),
    });
    if (room.logs.length > 30) room.logs = room.logs.slice(0, 30);
    room.updatedAt = new Date().toISOString();

    this.persistRoom(room);
    return { success: true, room, student: targetStudent };
  }

  public submitAnswer(params: {
    roomId?: string;
    pin: string;
    studentId: string;
    isCorrect: boolean;
    goldDelta?: number;
    chestLog?: string;
  }): { success: boolean; room?: GoldQuestRoomState; student?: GoldQuestStudent } {
    const room = this.findRoom(params.roomId, params.pin);
    if (!room || !room.isActive) return { success: false };

    const student = room.students.find((s) => s.id === params.studentId);
    if (!student) return { success: false };

    if (params.isCorrect) {
      student.correctCount += 1;
      student.streak += 1;
      student.gold = Math.max(0, student.gold + Number(params.goldDelta || 0));
    } else {
      student.wrongCount += 1;
      student.streak = 0;
    }

    if (params.chestLog) {
      room.logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        message: params.chestLog,
        type: 'chest',
        timestamp: new Date().toISOString(),
      });
      if (room.logs.length > 30) room.logs = room.logs.slice(0, 30);
    }

    room.updatedAt = new Date().toISOString();
    this.persistRoom(room);
    return { success: true, room, student };
  }

  public stealOrSwap(params: {
    roomId?: string;
    pin: string;
    actorId: string;
    targetId: string;
    effectType: 'STEAL' | 'SWAP';
    amount?: number;
  }): { success: boolean; room?: GoldQuestRoomState } {
    const room = this.findRoom(params.roomId, params.pin);
    if (!room || !room.isActive) return { success: false };

    const actor = room.students.find((s) => s.id === params.actorId);
    const target = room.students.find((s) => s.id === params.targetId);
    if (!actor || !target) return { success: false };

    if (params.effectType === 'STEAL') {
      const stolen = Math.min(target.gold, Number(params.amount || 0));
      target.gold -= stolen;
      actor.gold += stolen;
      room.logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        message: `🦊 ${actor.name} ขโมยทองคำ ${stolen} G จาก ${target.name}!`,
        type: 'steal',
        timestamp: new Date().toISOString(),
      });
    } else if (params.effectType === 'SWAP') {
      const temp = actor.gold;
      actor.gold = target.gold;
      target.gold = temp;
      room.logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        message: `⚡ ${actor.name} สลับกระเป๋าทองคำกับ ${target.name}!`,
        type: 'steal',
        timestamp: new Date().toISOString(),
      });
    }

    if (room.logs.length > 30) room.logs = room.logs.slice(0, 30);
    room.updatedAt = new Date().toISOString();
    this.persistRoom(room);
    return { success: true, room };
  }

  public endRoom(roomId?: string, pin?: string): GoldQuestRoomState | undefined {
    const room = this.findRoom(roomId, pin);
    if (room) {
      room.isActive = false;
      room.status = 'ended';
      room.logs.unshift({
        id: `log_${Date.now()}`,
        message: '🏁 คุณครูประกาศจบการสอบแล้ว!',
        type: 'system',
        timestamp: new Date().toISOString(),
      });
      room.updatedAt = new Date().toISOString();
      this.persistRoom(room);
    }
    return room;
  }
}

export const goldQuestService = new GoldQuestService();
