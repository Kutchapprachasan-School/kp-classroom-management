// app/api/live-classroom/gold-quest/join/route.ts
// API สำหรับตรวจสอบรหัส PIN และดึงรายชื่อนักเรียนในห้องสอบ Gold Quest Arena
// รองรับทั้ง Next.js App Router และ Standalone Node.js/Vercel Serverless

export interface GoldQuestJoinStudent {
  id: string;
  number: number;
  name: string;
  studentId?: string;
  avatar?: string;
}

// Polyfill Response สำหรับสภาพแวดล้อมที่ไม่มี next/server
class StandardNextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }
}

const NextResponse = StandardNextResponse;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { error: 'รหัส PIN ต้องเป็นตัวเลข 6 หลัก' },
        { status: 400 }
      );
    }

    // ค้นหาห้องสอบใน Memory (globalThis)
    const globalForGoldQuest = globalThis as unknown as {
      goldQuestRooms?: Map<string, any>;
    };

    const roomsMap = globalForGoldQuest.goldQuestRooms;

    let foundRoom: any = null;
    if (roomsMap) {
      for (const room of roomsMap.values()) {
        if (
          room.pin === pin ||
          room.roomId?.includes(pin) ||
          room.roomId === `quest-${pin}`
        ) {
          foundRoom = room;
          break;
        }
      }
    }

    if (!foundRoom) {
      return NextResponse.json(
        { error: 'ไม่พบห้องสอบที่ตรงกับรหัส PIN นี้ หรือห้องสอบปิดไปแล้ว' },
        { status: 404 }
      );
    }

    const students: GoldQuestJoinStudent[] = (foundRoom.students || []).map(
      (st: any, idx: number) => ({
        id: st.id,
        number: idx + 1,
        name: st.name,
        studentId: st.studentId,
        avatar: st.avatar,
      })
    );

    return NextResponse.json({
      roomId: foundRoom.roomId,
      pin: foundRoom.pin,
      examTitle: foundRoom.examTitle,
      students,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหาห้อง';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
