# 🏗️ Blueprint: ระบบจัดการชั้นเรียน (Classroom Management System)
> Production-Ready System Architecture & Database Design Specification

## 1. Technology Stack & Infrastructure

* **Frontend Framework:** Next.js (App Router) + React 18+ (ปัจจุบันพัฒนาหน้าจอต้นแบบ Interactive Prototype ด้วย React + TypeScript + Tailwind CSS)
* **UI Components & Styling:** Tailwind CSS + Radix UI / Lucide Icons
* **Data Grid (ตารางคะแนน/เช็คชื่อ):** TanStack Table v8 (เพื่อประสิทธิภาพในการจัดการ State ระดับ Cell)
* **Backend / API:** Next.js Server Actions (ครอบด้วย `zod` สำหรับ Validation)
* **Database:** PostgreSQL (แนะนำ Neon.tech สำหรับ Serverless Pooling)
* **ORM:** Prisma
* **Authentication:** Auth.js (NextAuth) ผสานร่วมกับการทำระบบ Credential และ OAuth
* **Background Jobs (Queue):** Upstash QStash หรือ Inngest (สำหรับจัดการ Google Classroom Sync โดยไม่ติด Timeout)

---

## 2. Database Schema (Prisma)

สคีมาออกแบบภายใต้แนวคิด **True Multi-tenant** และการใช้ **Composite Foreign Keys** เพื่อปิดจุดบอดเรื่อง Cross-Classroom Data Corruption

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ================= ENUMS =================
enum Role { ADMIN, TEACHER, STUDENT }
enum ScoreState { DRAFT, SUBMITTED, LOCKED }
enum ScheduleType { NORMAL, EXAM, ACTIVITY, CANCELED }
enum AttendanceStatus { PRESENT, ABSENT, LATE, LEAVE }
enum TermType { SEMESTER_1, SEMESTER_2, SUMMER }
enum RecordStatus { ACTIVE, ARCHIVED, DELETED }

// ================= MULTI-TENANT & RBAC =================
model School {
  id          String             @id @default(cuid())
  name        String
  memberships SchoolMembership[]
  terms       AcademicTerm[]
  classrooms  Classroom[]
}

model User {
  id               String             @id @default(cuid())
  email            String             @unique
  name             String
  memberships      SchoolMembership[]
  gamification     GamificationProfile?
}

model SchoolMembership {
  id          String   @id @default(cuid())
  userId      String
  schoolId    String
  role        Role
  studentCode String?  

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  enrollments      Enrollment[]
  teachingClasses  ClassroomTeacher[]

  @@unique([userId, schoolId]) 
  @@unique([schoolId, studentCode]) 
}

// ================= ACADEMIC STRUCTURE =================
model AcademicTerm {
  id          String      @id @default(cuid())
  schoolId    String
  school      School      @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  year        Int
  term        TermType
  classrooms  Classroom[]
  
  @@unique([id, schoolId]) 
  @@unique([schoolId, year, term])
}

model Classroom {
  id            String       @id @default(cuid())
  schoolId      String
  termId        String
  name          String       // เช่น "ม.3/1"
  subjectCode   String
  subjectName   String
  
  status        RecordStatus @default(ACTIVE)
  deletedAt     DateTime?    
  deletedBy     String?

  term          AcademicTerm @relation(fields: [termId, schoolId], references: [id, schoolId], onDelete: Restrict)
  school        School       @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  
  teachers      ClassroomTeacher[]
  enrollments   Enrollment[]
  assignments   Assignment[]
  schedules     Schedule[]
  sgsUnits      SgsUnit[]
  
  @@unique([id, schoolId]) 
}

model ClassroomTeacher {
  id          String    @id @default(cuid())
  classroomId String
  schoolId    String    
  userId      String
  
  classroom   Classroom        @relation(fields: [classroomId, schoolId], references: [id, schoolId], onDelete: Restrict)
  membership  SchoolMembership @relation(fields: [userId, schoolId], references: [userId, schoolId], onDelete: Restrict)
  
  @@unique([classroomId, userId])
}

model Enrollment {
  id            String       @id @default(cuid())
  classroomId   String
  schoolId      String       
  userId        String       
  studentNo     Int          

  status        RecordStatus @default(ACTIVE)
  deletedAt     DateTime?
  deletedBy     String?
  
  classroom     Classroom        @relation(fields: [classroomId, schoolId], references: [id, schoolId], onDelete: Restrict)
  membership    SchoolMembership @relation(fields: [userId, schoolId], references: [userId, schoolId], onDelete: Restrict)
  
  scores        Score[]
  attendances   Attendance[]
  xpLedgers     XpLedger[]
  
  @@unique([classroomId, userId])
  @@unique([classroomId, studentNo]) 
  @@unique([id, classroomId]) 
}

// ================= GRADING & SGS =================
model SgsUnit {
  id            String       @id @default(cuid())
  classroomId   String
  name          String
  maxScore      Decimal      @db.Decimal(5, 2)
  sgsColumnRef  String?      
  
  classroom     Classroom    @relation(fields: [classroomId], references: [id], onDelete: Restrict)
  assignments   Assignment[]
  
  @@unique([classroomId, name])
}

model Assignment {
  id              String       @id @default(cuid())
  classroomId     String
  sgsUnitId       String?      
  title           String
  maxScore        Decimal      @db.Decimal(5, 2)
  
  classroom       Classroom    @relation(fields: [classroomId], references: [id], onDelete: Restrict)
  sgsUnit         SgsUnit?     @relation(fields: [sgsUnitId], references: [id], onDelete: SetNull)
  scores          Score[]
  externalMappings ExternalMapping[] 
  
  @@unique([id, classroomId]) 
}

model Score {
  id            String       @id @default(cuid())
  assignmentId  String
  enrollmentId  String
  classroomId   String       

  value         Decimal?     @db.Decimal(5, 2) 
  state         ScoreState   @default(DRAFT)
  isExempt      Boolean      @default(false) 
  
  // Composite FK ป้องกัน Data Corruption ข้ามห้อง
  assignment    Assignment   @relation(fields: [assignmentId, classroomId], references: [id, classroomId], onDelete: Restrict)
  enrollment    Enrollment   @relation(fields: [enrollmentId, classroomId], references: [id, classroomId], onDelete: Restrict)
  
  @@unique([assignmentId, enrollmentId])
}

// ================= ATTENDANCE =================
model Schedule {
  id            String       @id @default(cuid())
  classroomId   String
  schoolDate    DateTime     @db.Date
  periodNo      Int
  type          ScheduleType @default(NORMAL)
  isConducted   Boolean      @default(false) 
  
  classroom     Classroom    @relation(fields: [classroomId], references: [id], onDelete: Restrict)
  attendances   Attendance[]
  
  @@unique([id, classroomId]) 
  @@unique([classroomId, schoolDate, periodNo])
}

model Attendance {
  id            String           @id @default(cuid())
  scheduleId    String
  enrollmentId  String
  classroomId   String           
  status        AttendanceStatus 
  
  schedule      Schedule         @relation(fields: [scheduleId, classroomId], references: [id, classroomId], onDelete: Restrict)
  enrollment    Enrollment       @relation(fields: [enrollmentId, classroomId], references: [id, classroomId], onDelete: Restrict)
  
  @@unique([scheduleId, enrollmentId])
}

// ================= GAMIFICATION & EXTERNAL =================
model GamificationProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  totalXp     Int      @default(0) // อัปเดตผ่าน DB Trigger เท่านั้น
}

model XpLedger {
  id             String     @id @default(cuid())
  enrollmentId   String
  amount         Int
  sourceType     String     
  sourceId       String     
  eventType      String     
  eventVersion   Int        @default(1)
  
  enrollment     Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Restrict)
  
  @@unique([enrollmentId, sourceType, sourceId, eventType, eventVersion])
}

model ExternalMapping {
  id             String     @id @default(cuid())
  assignmentId   String
  provider       String     // e.g., "GOOGLE_CLASSROOM"
  externalId     String     // e.g., courseWorkId
  
  assignment     Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  @@unique([provider, externalId])
}
```

---

## 3. Database Invariants (Custom SQL Migrations)

**3.1 CHECK Constraint: ป้องกันคะแนนผิดปกติ**

```sql
ALTER TABLE "Score" ADD CONSTRAINT "score_value_check" CHECK (value >= 0);

CREATE OR REPLACE FUNCTION check_score_max_value() RETURNS trigger AS $$
BEGIN
  IF NEW.value > (SELECT "maxScore" FROM "Assignment" WHERE id = NEW."assignmentId") THEN
    RAISE EXCEPTION 'Score value % exceeds Assignment maxScore', NEW.value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_score
  BEFORE INSERT OR UPDATE ON "Score"
  FOR EACH ROW EXECUTE FUNCTION check_score_max_value();
```

**3.2 ป้องกันการแก้ไขสถานะ LOCKED**

```sql
CREATE OR REPLACE FUNCTION prevent_locked_score_update() RETURNS trigger AS $$
BEGIN
  IF OLD.state = 'LOCKED' AND NEW.state = 'LOCKED' THEN
    RAISE EXCEPTION 'Cannot modify a locked score (ID: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_locked_score
  BEFORE UPDATE ON "Score"
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_score_update();
```

**3.3 XP Reconciliation (Total XP Cache Sync)**

```sql
CREATE OR REPLACE FUNCTION sync_gamification_xp() RETURNS trigger AS $$
DECLARE
  v_userId TEXT;
BEGIN
  SELECT "userId" INTO v_userId FROM "Enrollment" WHERE id = NEW."enrollmentId";
  UPDATE "GamificationProfile" 
  SET "totalXp" = "totalXp" + NEW.amount 
  WHERE "userId" = v_userId;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_xp_on_ledger_insert
  AFTER INSERT ON "XpLedger"
  FOR EACH ROW EXECUTE FUNCTION sync_gamification_xp();
```

---

## 4. Security & Business Logic Guidelines

**4.1 Resource-Level Authorization (Server Actions)**
1. ตรวจสอบว่า User ปัจจุบันเป็นสมาชิกของ `schoolId` นั้น
2. ตรวจสอบว่า User ปัจจุบันมีรายชื่ออยู่ใน `ClassroomTeacher` ของ `classroomId` นั้น

**4.2 การคำนวณ Dashboard "งานที่ยังตรวจไม่ครบ"**
ใช้ตาราง `Enrollment` เป็นแกนหลักแล้วทำ `LEFT JOIN` กับตาราง `Assignment` กรองเฉพาะนักเรียนที่ `isExempt == false` และ `Score.value IS NULL`

**4.3 กฎการคำนวณการเข้าเรียน (Attendance Threshold)**
* **ตัวฐาน (Denominator):** นับจาก `Schedule` ที่มีเงื่อนไข `type == NORMAL`, `isConducted == true`, และ `schoolDate <= CURRENT_DATE` เท่านั้น
* **ตัวแปรขาดเรียน (Numerator):** นับจาก `Attendance.status == ABSENT` (อาจบวก `LATE * 0.5` ตามนโยบายโรงเรียน)

---

## 5. แผนการพัฒนา (Sprint Timeline)

* **Sprint 0: Foundation & Invariants (สัปดาห์ 1)**
* **Sprint 1: Core Classroom & Roster (สัปดาห์ 2-3)**
* **Sprint 2: Grading Matrix (สัปดาห์ 4-5)**
* **Sprint 3: Gamification & Analytics (สัปดาห์ 6)**
* **Sprint 4: External Integrations (สัปดาห์ 7)**
* **Sprint 5: UAT & SGS Release (สัปดาห์ 8)**
