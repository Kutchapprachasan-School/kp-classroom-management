-- 1. สร้าง Enums สำหรับประเภทห้องและประเภทข้อความ
CREATE TYPE "ChatRoomType" AS ENUM ('HOMEROOM', 'COURSE', 'OFFICIAL', 'DEPARTMENT');
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'TASK', 'ANNOUNCEMENT', 'TRANSFER', 'SYSTEM');

-- 2. ตารางห้องแชท (chat_rooms)
CREATE TABLE "chat_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "type" "ChatRoomType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "classroom_id" TEXT,
    "course_code" TEXT,
    "is_read_only" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" TIMESTAMPTZ,
    "last_message_preview" TEXT,
    "last_message_sender" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- 3. ตารางสมาชิกในห้องแชท (chat_room_members)
CREATE TABLE "chat_room_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL, -- 'TEACHER', 'STUDENT', 'ADVISOR', 'ACADEMIC_ADMIN', 'SCHOOL_ADMIN'
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_room_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_room_members_room_id_fkey" FOREIGN KEY ("room_id")
        REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. ตารางข้อความแชท (chat_messages)
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "message_type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "attachment_meta" JSONB,
    "action_payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id")
        REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. สร้าง Indexes เพื่อรองรับ Zero-Egress Cursor Pagination
CREATE INDEX "chat_rooms_school_year_type_idx" ON "chat_rooms"("school_id", "academic_year", "type");
CREATE INDEX "chat_rooms_classroom_id_idx" ON "chat_rooms"("classroom_id");
CREATE INDEX "chat_rooms_course_code_idx" ON "chat_rooms"("course_code");
CREATE INDEX "chat_rooms_updated_at_idx" ON "chat_rooms"("updated_at" DESC);

CREATE UNIQUE INDEX "chat_room_members_room_user_key" ON "chat_room_members"("room_id", "user_id");
CREATE INDEX "chat_room_members_user_id_idx" ON "chat_room_members"("user_id");

CREATE UNIQUE INDEX "chat_messages_idempotency_key_key" ON "chat_messages"("idempotency_key");
CREATE INDEX "chat_messages_room_created_desc_idx" ON "chat_messages"("room_id", "created_at" DESC);

-- ============================================================================
-- 6. เปิดใช้งาน Row Level Security (RLS) และกำหนดสิทธิ์ระดับ Database
-- ============================================================================
ALTER TABLE "chat_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_room_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;

-- 6.1 นโยบายการอ่านห้องแชท: เห็นเฉพาะห้องที่ตนเองเป็นสมาชิก หรือเป็นผู้ดูแลระบบโรงเรียน
CREATE POLICY "Users can view joined chat rooms" ON "chat_rooms"
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('SCHOOL_ADMIN', 'ACADEMIC_ADMIN')
        OR EXISTS (
            SELECT 1 FROM "chat_room_members" m
            WHERE m.room_id = "chat_rooms".id
              AND m.user_id = current_setting('app.current_user_id', true)
        )
    );

-- 6.2 นโยบายการอ่านรายชื่อสมาชิก: เห็นเฉพาะสมาชิกในห้องที่ตนเองอยู่
CREATE POLICY "Users can view members in their rooms" ON "chat_room_members"
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)
        OR EXISTS (
            SELECT 1 FROM "chat_room_members" m
            WHERE m.room_id = "chat_room_members".room_id
              AND m.user_id = current_setting('app.current_user_id', true)
        )
    );

-- 6.3 นโยบายการอ่านข้อความ: อ่านได้เฉพาะข้อความในห้องที่ตนเองเป็นสมาชิก
CREATE POLICY "Members can read room messages" ON "chat_messages"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "chat_room_members" m
            WHERE m.room_id = "chat_messages".room_id
              AND m.user_id = current_setting('app.current_user_id', true)
        )
    );

-- 6.4 นโยบายการส่งข้อความ (INSERT):
-- ต้องเป็นสมาชิกในห้อง + ไม่ถูก Mute + หากห้องเป็น Read-Only หรือ OFFICIAL ห้ามนักเรียนโพสต์
CREATE POLICY "Authorized members can insert messages" ON "chat_messages"
    FOR INSERT
    WITH CHECK (
        sender_id = current_setting('app.current_user_id', true)
        AND EXISTS (
            SELECT 1 FROM "chat_room_members" m
            JOIN "chat_rooms" r ON r.id = m.room_id
            WHERE m.room_id = "chat_messages".room_id
              AND m.user_id = current_setting('app.current_user_id', true)
              AND m.is_muted = false
              AND (
                  (r.is_read_only = false AND r.type != 'OFFICIAL')
                  OR m.role IN ('TEACHER', 'ADVISOR', 'ACADEMIC_ADMIN', 'SCHOOL_ADMIN')
              )
        )
    );
