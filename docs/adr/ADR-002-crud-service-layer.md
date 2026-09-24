# ADR-002: สถาปัตยกรรม CRUD Service Layer และการรักษาความถูกต้องของข้อมูล (Data Integrity & Resilient Persistence)

## สถานะ (Status)
**ACCEPTED (อนุมัติและปรับใช้แล้ว)**

## บริบท (Context)
ตามข้อกำหนดของผู้ใช้ ("เพิ่ม CRUD ส่วนที่จำเป็นทั้งหมด ด้วย") ระบบจัดการชั้นเรียนจำเป็นต้องรองรับการทำงานแบบ Full CRUD (Create, Read, Update, Delete) ครอบคลุมทุกโมดูลสำคัญของทั้งฝั่งครูผู้สอน (Teacher Portal) และนักเรียน (Student Gamified Portal) โดยต้องคงความเสถียร 100%, ป้องกัน Silent Data Corruption, รองรับการจัดเก็บข้อมูลบน **Supabase (PostgreSQL)** เป็นแกนหลัก และมีระบบ Local Persistence สำรองเพื่อให้ระบบใช้งานออฟไลน์หรือในระหว่างการสาธิตได้อย่างราบรื่น

## การตัดสินใจเชิงสถาปัตยกรรม (Architectural Decisions)

### 1. Dual-Engine Persistence (Supabase + Resilient Local Fallback)
ทุกเซอร์วิสในโฟลเดอร์ `src/services/` ถูกออกแบบด้วยแพทเทิร์น Dual-Engine:
- หากมีการกำหนดค่าตัวแปรสภาพแวดล้อม `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` เซอร์วิสจะดำเนินการ Query, Upsert, Insert และ Soft Delete โดยตรงกับ Supabase PostgreSQL tables
- หากระบบทำงานในโหมด Client Standalone / Offline ระบบจะสลับไปบันทึกลง Persistent Storage (`localStorage`) ทันที พร้อมแสดง Log การทำงานของฐานข้อมูลผ่าน `logDbOperation()` ทำให้มั่นใจได้ว่าระบบจะไม่เกิด Unhandled Exception หรือหน้าขาว

### 2. โมดูล CRUD ที่พัฒนาและเชื่อมต่อครบสมบูรณ์
1. **`classroomService` (จัดการชั้นเรียน):**
   - `getAll()`, `getById()`, `create()`, `update()`, `delete()` (Soft Delete ย้ายเข้าถังขยะ)
2. **`studentService` (จัดการบัญชีรายชื่อนักเรียน):**
   - `getByClassroom()`, `create()`, `update()`, `delete()`, `batchImport()` (รองรับการนำเข้าไฟล์ Excel/CSV รูปแบบ SGS สพฐ.)
3. **`assignmentService` (จัดการการบ้านและข้อสอบ):**
   - `getByClassroom()`, `create()`, `update()`, `delete()`, `closeAssignment()` (ปิดรับงานและตัดเกรดอัตโนมัติ)
4. **`scoreService` (จัดการคะแนนและ Audit Trail):**
   - `getByAssignment()`, `getByStudent()`, `upsertScore()`, `batchUpsertScores()`, `lockScores()`, `autoZeroMissing()`, `getAuditLogs()`
   - **Enforce ADR-001:** บังคับกรอก `reason` เสมอเมื่อมีการแก้ไขคะแนนที่อยู่ในสถานะ `SUBMITTED` หรือ `LOCKED` เพื่อความโปร่งใสตามมาตรฐาน SAR
5. **`attendanceService` (จัดการตารางสอนและการเช็คชื่อ):**
   - `getTimetable()`, `updateSlot()`, `getByDate()`, `saveRollCall()`, `markAllPresent()`, `getSummary()`
6. **`behaviorService` (สมุดพฤติกรรมและแต้มพิเศษ XP):**
   - `getAll()`, `create()`, `delete()`, `awardXp()`, `getXpTransactions()`
   - **XP Idempotency:** ใช้ `idempotencyKey` เพื่อป้องกันบั๊กการแจกแต้ม XP ซ้ำซ้อนจากการกดปุ่มซ้ำหรือเครือข่ายกระตุก
7. **`trashService` (วงจรชีวิตถังขยะและ Soft-delete):**
   - `getAll()`, `moveToTrash()`, `restore()`, `permanentDelete()`, `emptyTrash()` (เก็บประวัติ 30 วันก่อนลบถาวร)
8. **`gamificationService` (ระบบผจญภัยของนักเรียน):**
   - `getQuests()`, `submitQuest()`, `getLeaderboard()`, `getTrophies()`, `claimDailyCheckin()` (เช็คชื่อประจำวันเพื่อรับ Streak และแต้ม XP)

### 3. การเชื่อมต่อกับหน้าจอ UI (View Integration)
- **`ClassroomsRosterView.tsx`:** เชื่อมต่อ `classroomService`, `studentService`, และ `trashService` รองรับการเพิ่มชั้นเรียน, เพิ่มนักเรียนเดี่ยว, นำเข้ารายชื่อนักเรียนแบบกลุ่มจาก SGS, และการลบย้ายเข้าถังขยะ
- **`TeacherOverviewView.tsx`:** เชื่อมต่อ `assignmentService`, `attendanceService`, `scoreService`, และ `behaviorService` ในทุกแท็บและโมดอล (บันทึกงานใหม่, เช็คชื่อ, บันทึกคะแนนด่วน, บันทึกพฤติกรรม, ปิดรับงาน)
- **`EndTermReadinessView.tsx`:** เชื่อมต่อ `assignmentService` และ `scoreService` สำหรับการปิดรับงานอัตโนมัติและการกรอกคะแนนเตรียมความพร้อมก่อนปิดภาคเรียน
- **`TrashManagementView.tsx`:** เชื่อมต่อ `trashService` เพื่อตรวจสอบรายการที่ถูกลบ กู้คืนข้อมูล หรือลบถาวร
- **`StudentMissionsView.tsx` & `StudentPortalView.tsx`:** เชื่อมต่อ `gamificationService` รองรับการส่งภารกิจ, การสะสมแต้ม XP, และการเช็คชื่อประจำวันต่อเนื่อง (Daily Streak)

## ผลลัพธ์และข้อดี (Consequences & Benefits)
- ทุกปุ่มและทุกโมดอลในระบบไม่ได้เป็นเพียง Mock UI แต่มีการทำ Data Mutation ที่คงทนและตรวจสอบได้จริง
- สถาปัตยกรรมมีความยืดหยุ่นสูง รองรับการสลับไปใช้งาน Fullstack Supabase Backend ได้ทันทีโดยไม่ต้องแก้ไขหน้าจอ UI
- ผ่านการตรวจสอบความถูกต้องของ TypeScript (`tsc -b`) และ Bundler (`vite build`) โดยมีข้อผิดพลาดเป็น 0 (Exit Code 0)
