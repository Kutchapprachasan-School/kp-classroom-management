// app/api/live-classroom/gold-quest/route.ts
// API Route สำหรับระบบห้องสอบสด Gold Quest Arena
// รองรับทั้ง Next.js App Router และ Web Standard Request/Response
// ครอบคลุมคำสั่ง START_ROOM, JOIN_ROOM, SUBMIT_ANSWER, STEAL_OR_SWAP_GOLD, END_ROOM

export interface GoldQuestStudent {
  id: string;
  name: string;
  studentId?: string;
  avatar: string;
  gold: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  isJoined: boolean;
  joinedAt?: string;
}

export interface GoldQuestQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  category?: string;
}

export interface GoldQuestLog {
  id: string;
  message: string;
  type: "join" | "answer" | "chest" | "steal" | "system";
  timestamp: string;
}

export interface GoldQuestRoomState {
  roomId: string;
  pin: string; // รหัส PIN 6 หลัก เช่น "849201"
  classroomId?: string;
  examTitle: string;
  isActive: boolean;
  status: "waiting" | "active" | "ended";
  students: GoldQuestStudent[];
  questions: GoldQuestQuestion[];
  logs: GoldQuestLog[];
  startedAt: string;
  updatedAt: string;
}

// Web Standard Response polyfill for standalone/Next environments
class StandardNextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  }
}

// ใช้ NextResponse จากสภาพแวดล้อม หรือ Fallback เป็น Standard Response
const NextResponse = StandardNextResponse;
type NextRequest = Request;

// เก็บข้อมูลห้องสอบไว้ใน globalThis เพื่อป้องกันข้อมูลหายเมื่อ Next.js ทำ Hot Reload
const globalForGoldQuest = globalThis as unknown as {
  goldQuestRooms?: Map<string, GoldQuestRoomState>;
};

const roomsMap =
  globalForGoldQuest.goldQuestRooms ?? new Map<string, GoldQuestRoomState>();

if (!globalForGoldQuest.goldQuestRooms) {
  globalForGoldQuest.goldQuestRooms = roomsMap;
}

// ฟังก์ชันช่วยค้นหาห้องสอบจาก roomId หรือ รหัส PIN 6 หลัก
export function findRoom(roomId?: string | null, pin?: string | null): GoldQuestRoomState | undefined {
  // 1. ถ้าระบุ roomId มาชัดเจน และไม่ใช่ค่าชั่วคราว ให้ค้นหาจาก roomId ก่อน
  if (roomId && roomId !== "default-room" && roomsMap.has(roomId)) {
    const room = roomsMap.get(roomId)!;
    // ถ้าระบุ pin มาด้วย ต้องตรวจสอบว่า pin ตรงกันหรือไม่
    if (pin && room.pin !== pin) {
      return undefined;
    }
    return room;
  }

  // 2. ถ้าไม่ได้ส่ง roomId มา (เช่น นักเรียนพิมพ์รหัส PIN 6 หลักเองบนมือถือ) ให้ค้นหาจาก PIN ที่กำลังเปิดอยู่
  if (pin) {
    for (const room of roomsMap.values()) {
      if (room.pin === pin && room.isActive) {
        return room;
      }
    }
  }

  // 3. Fallback: ถ้ามีห้องที่ตรงกับ roomId แม้จะเป็น default-room
  if (roomId && roomsMap.has(roomId)) {
    return roomsMap.get(roomId);
  }

  return undefined;
}

// ฟังก์ชันเพิ่มข้อความแจ้งเตือน (Activity Log) บนหน้าจอโปรเจกเตอร์ของคุณครู
export function addRoomLog(
  room: GoldQuestRoomState,
  message: string,
  type: GoldQuestLog["type"] = "system"
) {
  room.logs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    message,
    type,
    timestamp: new Date().toISOString(),
  });
  // เก็บสูงสุด 30 รายการล่าสุด
  if (room.logs.length > 30) {
    room.logs = room.logs.slice(0, 30);
  }
  room.updatedAt = new Date().toISOString();
}

/**
 * GET /api/live-classroom/gold-quest?roomId=...&pin=...
 * ใช้ทั้งฝั่งคุณครู (ดึงข้อมูล Real-time) และฝั่งนักเรียน (ตรวจสอบรหัส PIN 6 หลักก่อนเข้าห้อง)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || searchParams.get("room");
  const pin = searchParams.get("pin");

  const room = findRoom(roomId, pin);

  if (!room) {
    return NextResponse.json(
      {
        isActive: false,
        error: "ไม่พบห้องสอบ หรือรหัส PIN 6 หลักไม่ถูกต้อง",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    roomId: room.roomId,
    pin: room.pin,
    classroomId: room.classroomId,
    examTitle: room.examTitle,
    isActive: room.isActive,
    status: room.status,
    students: room.students,
    questions: room.questions,
    logs: room.logs,
    startedAt: room.startedAt,
    updatedAt: room.updatedAt,
  });
}

/**
 * POST /api/live-classroom/gold-quest
 * รองรับคำสั่ง START_ROOM, JOIN_ROOM, SUBMIT_ANSWER, APPLY_CHEST, END_ROOM
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // =========================================================================
    // 1. START_ROOM: คุณครูกดเปิดห้องสอบและสร้างรหัส PIN 6 หลัก
    // =========================================================================
    if (action === "START_ROOM") {
      const {
        roomId = "default-room",
        pin,
        classroomId,
        examTitle = "สอบเก็บคะแนน (Gold Quest Arena)",
        students = [],
        questions = [],
      } = body;

      // หากไม่ได้ส่ง pin มา ให้สุ่มเลข 6 หลักให้อัตโนมัติ
      const generatedPin =
        pin && /^\d{6}$/.test(String(pin))
          ? String(pin)
          : String(Math.floor(100000 + Math.random() * 900000));

      const initialStudents: GoldQuestStudent[] = Array.isArray(students)
        ? students.map((s: Partial<GoldQuestStudent>, idx: number) => ({
            id: s.id || `std_${idx + 1}`,
            name: s.name || `นักเรียนคนที่ ${idx + 1}`,
            studentId: s.studentId,
            avatar: s.avatar || "⚔️",
            gold: typeof s.gold === "number" ? s.gold : 0,
            correctCount: s.correctCount || 0,
            wrongCount: s.wrongCount || 0,
            streak: s.streak || 0,
            isJoined: Boolean(s.isJoined),
          }))
        : [];

      const newRoom: GoldQuestRoomState = {
        roomId,
        pin: generatedPin,
        classroomId,
        examTitle,
        isActive: true,
        status: "active",
        students: initialStudents,
        questions: Array.isArray(questions) ? questions : [],
        logs: [
          {
            id: `log_${Date.now()}`,
            message: `เปิดห้องสอบ "${examTitle}" ด้วยรหัส PIN: ${generatedPin}`,
            type: "system",
            timestamp: new Date().toISOString(),
          },
        ],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      roomsMap.set(roomId, newRoom);

      return NextResponse.json({
        success: true,
        room: newRoom,
      });
    }

    // =========================================================================
    // 2. JOIN_ROOM: นักเรียนสแกน QR Code หรือกรอกรหัส PIN 6 หลักจากมือถือ
    // =========================================================================
    if (action === "JOIN_ROOM") {
      const { roomId, pin, student } = body;

      if (!pin || !/^\d{6}$/.test(String(pin))) {
        return NextResponse.json(
          { error: "กรุณากรอกรหัส PIN ห้องสอบเป็นตัวเลข 6 หลัก" },
          { status: 400 }
        );
      }

      if (!student || !student.name || !String(student.name).trim()) {
        return NextResponse.json(
          { error: "กรุณาระบุชื่อของคุณก่อนเข้าห้องสอบ" },
          { status: 400 }
        );
      }

      const room = findRoom(roomId, String(pin));

      if (!room || !room.isActive || room.status === "ended") {
        return NextResponse.json(
          {
            error:
              "ไม่พบห้องสอบที่ตรงกับรหัส PIN นี้ หรือคุณครูปิดห้องสอบไปแล้ว",
          },
          { status: 404 }
        );
      }

      // ตรวจสอบรหัส PIN ให้ตรงกับห้องสอบอีกครั้งเพื่อความปลอดภัย
      if (room.pin !== String(pin)) {
        return NextResponse.json(
          { error: "รหัส PIN 6 หลักไม่ถูกต้อง กรุณาตรวจสอบบนจอโปรเจกเตอร์อีกครั้ง" },
          { status: 403 }
        );
      }

      const cleanName = String(student.name).trim();
      const chosenAvatar = student.avatar || "⚔️";

      // ค้นหาว่านักเรียนคนนี้มีชื่ออยู่ในรายชื่อห้องเรียนแล้วหรือไม่ (เช็กจาก id หรือชื่อตรงกัน)
      let targetStudent = room.students.find(
        (s) =>
          s.id === student.id ||
          s.name.trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (targetStudent) {
        // อัปเดตสถานะนักเรียนที่มีรายชื่อในห้องอยู่แล้ว
        targetStudent.avatar = chosenAvatar;
        targetStudent.isJoined = true;
        targetStudent.joinedAt = new Date().toISOString();
      } else {
        // กรณีนักเรียนพิมพ์ชื่อใหม่เข้ามาเอง ให้เพิ่มเข้าสู่ห้องสอบทันที
        targetStudent = {
          id: student.id || `std_${Date.now()}`,
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

      addRoomLog(
        room,
        `${targetStudent.avatar} ${targetStudent.name} เข้าร่วมสนามสอบแล้ว!`,
        "join"
      );

      return NextResponse.json({
        success: true,
        roomId: room.roomId,
        pin: room.pin,
        examTitle: room.examTitle,
        student: targetStudent,
        questions: room.questions,
      });
    }

    // =========================================================================
    // 3. SUBMIT_ANSWER & APPLY_CHEST: นักเรียนส่งคำตอบและเปิดหีบทองคำจากมือถือ
    // =========================================================================
    if (action === "SUBMIT_ANSWER") {
      const { roomId, pin, studentId, isCorrect, goldDelta = 0, chestLog } = body;
      const room = findRoom(roomId, pin);

      if (!room || !room.isActive) {
        return NextResponse.json(
          { error: "ห้องสอบปิดแล้ว ไม่สามารถส่งคำตอบได้" },
          { status: 400 }
        );
      }

      const student = room.students.find((s) => s.id === studentId);
      if (!student) {
        return NextResponse.json(
          { error: "ไม่พบข้อมูลผู้เล่นในห้องสอบนี้" },
          { status: 404 }
        );
      }

      if (isCorrect) {
        student.correctCount += 1;
        student.streak += 1;
        student.gold = Math.max(0, student.gold + Number(goldDelta));
      } else {
        student.wrongCount += 1;
        student.streak = 0;
      }

      if (chestLog) {
        addRoomLog(room, chestLog, "chest");
      }

      room.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        student,
        leaderboard: [...room.students].sort((a, b) => b.gold - a.gold),
      });
    }

    // =========================================================================
    // 4. STEAL_OR_SWAP_GOLD: เอฟเฟกต์หีบขโมยทองหรือสลับทองกับเพื่อนในห้อง
    // =========================================================================
    if (action === "STEAL_OR_SWAP_GOLD") {
      const { roomId, pin, actorId, targetId, effectType, amount = 0 } = body;
      const room = findRoom(roomId, pin);

      if (!room || !room.isActive) {
        return NextResponse.json({ error: "ห้องสอบปิดแล้ว" }, { status: 400 });
      }

      const actor = room.students.find((s) => s.id === actorId);
      const target = room.students.find((s) => s.id === targetId);

      if (!actor || !target) {
        return NextResponse.json(
          { error: "ไม่พบผู้เล่นเป้าหมาย" },
          { status: 404 }
        );
      }

      if (effectType === "STEAL") {
        const stolen = Math.min(target.gold, Number(amount));
        target.gold -= stolen;
        actor.gold += stolen;
        addRoomLog(
          room,
          `🦊 ${actor.name} ขโมยทองคำ ${stolen} G จาก ${target.name}!`,
          "steal"
        );
      } else if (effectType === "SWAP") {
        const tempGold = actor.gold;
        actor.gold = target.gold;
        target.gold = tempGold;
        addRoomLog(
          room,
          `⚡ ${actor.name} สลับกระเป๋าทองคำกับ ${target.name}!`,
          "steal"
        );
      }

      return NextResponse.json({
        success: true,
        actor,
        target,
        students: room.students,
      });
    }

    // =========================================================================
    // 5. END_ROOM: คุณครูกดจบการสอบ
    // =========================================================================
    if (action === "END_ROOM") {
      const { roomId, pin } = body;
      const room = findRoom(roomId, pin);

      if (room) {
        room.isActive = false;
        room.status = "ended";
        addRoomLog(room, "🏁 คุณครูประกาศจบการสอบแล้ว!", "system");
      }

      return NextResponse.json({
        success: true,
        room,
      });
    }

    return NextResponse.json(
      { error: `ไม่รองรับคำสั่ง action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gold Quest API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
