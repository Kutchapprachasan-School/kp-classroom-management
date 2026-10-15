# ADR-005: SGS Roster Ingestion & Score Alignment Engine
# สถาปัตยกรรมนำเข้ารายชื่อนักเรียนจาก SGS และการรักษาความถูกต้องของลำดับคะแนน 100%

## สถานะ (Status)
**APPROVED** — 16 ตุลาคม 2569 (สืบเนื่องจากการ Stress-test ผ่าน `/grill-doc`)

## บริบทและปัญหา (Context & Problem Statement)
การเชื่อมต่อข้อมูลระหว่างระบบบริหารจัดการชั้นเรียนและระบบวัดผล SGS (Secondary Grading System) ของ สพฐ. มีความเสี่ยงร้ายแรงระดับ P0:
1. **ความเสี่ยงคะแนนสลับคน**: หากใช้การจัดเรียง (Sorting) จำลอง เช่น เรียงตามเพศหรือรหัสนักเรียน จะทำให้ลำดับแถวผิดไปจากตารางจริงของ SGS เนื่องจาก SGS มีกรณีเลขที่แหว่ง (นักเรียนย้ายออก) หรือลำดับเฉพาะ
2. **ความเสี่ยงจากการใช้รหัสนักเรียนเป็น PK ร่วม**: รหัสนักเรียน 5 หลักอาจมีเลข 0 นำหน้า หรือมีการเปลี่ยนห้องเรียน/ปีการศึกษา
3. **ความหลากหลายของช่องทางนำเข้า**: SGS ไม่มี Public REST API ให้ยิงโดยตรง ครูมีทั้งการโหลดไฟล์ Excel/CSV, การคัดลอกข้อความจากหน้าเว็บ SGS (Clipboard Copy-Paste), หรือต้องการ Extension ช่วยดึง
4. **ความเสี่ยงข้อมูลสูญหายจากการ Import ซ้ำ**: การนำเข้าทับอาจลบล้างคะแนนเดิมของนักเรียน หรือทำให้ประวัติการย้ายห้องเสียหาย

---

## การตัดสินใจเชิงสถาปัตยกรรม (Architectural Decisions)

### 1. Ingestion Protocol: Multi-Channel Ingestion & Smart Parser
- รองรับ 3 ช่องทางหลัก:
  1. **Excel / CSV File Upload**: ตรวจจับ Sheet และหัวคอลัมน์อัตโนมัติ
  2. **Smart Clipboard Textarea (Paste & Parse)**: ครูสามารถกด `Ctrl+A` / `Ctrl+C` จากตารางหน้าเว็บ SGS หรือโปรแกรมอื่น แล้วกด `Ctrl+V` วางลงในช่อง ระบบจะตัดคำด้วย Intelligent Regex แยก `คำนำหน้า`, `ชื่อ`, `นามสกุล`, `เลขที่`, และ `รหัสประจำตัว`
  3. **Browser Extension / DOM Extraction Hook**: รองรับการรับ JSON Payload จาก Client-side helper
- ทุกช่องทางต้องผ่าน **Dry-Run Preview Modal** เพื่อให้ครูตรวจสอบและปรับ Mapping คอลัมน์ได้ก่อนบันทึกจริง

### 2. Row Order Fidelity Invariant: Strict `sgsRowIndex` Preservation
- ระบบจะบันทึกทั้ง:
  - `sgsSeatNo`: เลขที่ทางการ (อาจแหว่ง เช่น 1, 2, 4)
  - `sgsRowIndex`: ลำดับแถวจริงใน SGS (1..N)
- **กฎเหล็ก (Invariant 1)**: ห้ามทำการ Auto-sort รายชื่อด้วยเพศหรือรหัสนักเรียนเพื่อทดแทนลำดับเดิมจาก SGS โดยเด็ดขาด
- การส่งออกคะแนนกลับไปยัง SGS (Reverse Sync) จะอิงตาม `sgsRowIndex` แบบ 1:1 เพื่อป้องกันคะแนนสลับคน

### 3. Database Architecture: Separation of Student Identity & Enrollment
- **`Student` (Entity หลัก)**:
  - `id`: Internal Primary Key (UUID)
  - `studentCode`: รหัสประจำตัวนักเรียน (String เพื่อรักษาเลข 0 นำหน้า)
  - `title`, `firstName`, `lastName`, `gender`
- **`ClassroomEnrollment` (ความสัมพันธ์การลงทะเบียนในห้อง)**:
  - `id`: UUID (PK)
  - `studentId`: Foreign Key ชี้ไปที่ `Student.id`
  - `classroomId`: รหัสห้องเรียน (เช่น `room-1-1`, `room-3-1`)
  - `academicYear`: ปีการศึกษา (เช่น `2569`)
  - `term`: ภาคเรียน (เช่น `1` หรือ `2`)
  - `sgsSeatNo`: เลขที่ในห้อง
  - `sgsRowIndex`: ลำดับแถวต้นฉบับ SGS
  - `status`: `ACTIVE` | `TRANSFERRED` | `GRADUATED`
- **กฎเหล็ก (Invariant 2)**: Unique Constraint บน `(studentCode)` ในระดับโรงเรียน และ Unique Constraint บน `(studentId, classroomId, academicYear, term)`

### 4. 4-State Dry-Run Preview & Safe Import Classification
ก่อนการยืนยัน Transaction ระบบจะประเมินทุกแถวออกเป็น 4 สถานะ:
1. **`NEW`**: นักเรียนใหม่ที่ไม่เคยมีรหัสในระบบ $\to$ สร้าง Student ใหม่และเพิ่ม Enrollment
2. **`EXISTS`**: นักเรียนอยู่ในห้องนี้อยู่แล้วและข้อมูลตรงกัน $\to$ ข้าม (Skip) ไม่แตะต้องคะแนนเดิม
3. **`CONFLICT`**: นักเรียนมีรหัสในระบบแต่อยู่คนละห้อง หรือชื่อไม่ตรง $\to$ แจ้งเตือนสีส้ม ให้ครูเลือกว่า "โอนย้ายห้องเรียน (คะแนนเดิมติดไปด้วย)" หรือ "ข้ามรายการนี้"
4. **`INVALID`**: ข้อมูลไม่สมบูรณ์ (เช่น ไม่มีรหัสนักเรียน หรือเลขที่ผิดรูปแบบ) $\to$ ปฏิเสธเฉพาะแถวนี้พร้อมแสดงเหตุผล โดยไม่ทำให้แถวอื่นล้มเหลว

### 5. Reverse Sync: Dual Export Pipeline
ระบบรองรับการส่งคะแนนกลับ SGS 2 โหมด:
1. **Excel Template Export**: สร้างไฟล์ `.xlsx` ที่มีโครงสร้างคอลัมน์และลำดับแถวตรงกับฟอร์ม Import ของ SGS 100%
2. **1-Click Column Clipboard Copy**: ปุ่มคลิกเดียวก็อปปี้คะแนนทั้งคอลัมน์ (Tab-separated) ให้ครูคลิกช่องแรกในเว็บ SGS แล้วกด `Ctrl+V` วางทั้งคอลัมน์ได้ทันที

---

## ผลลัพธ์และข้อดี (Consequences)
- **Positive**:
  - ตัดโอกาสการส่งคะแนนผิดคนหรือคะแนนสลับคนโดยสิ้นเชิง
  - ความยืดหยุ่นสูง: ครูจะลากไฟล์ Excel, ก็อปปี้ตารางมาแปะ หรือใช้สคริปต์ ก็ได้ผลลัพธ์ที่แม่นยำเท่ากัน
  - ประวัติคะแนนและการย้ายห้องเรียนไม่สูญหายเมื่อมีการนำเข้ารายชื่อซ้ำ
- **Trade-offs / Negative**:
  - ต้องมีตาราง Preview ที่แสดงทั้งคอลัมน์ต้นฉบับและคอลัมน์ที่ระบบวิเคราะห์ได้ ทำให้หน้าตา UI มีความซับซ้อนเพิ่มขึ้น
  - ระบบต้องจัดเก็บ `sgsRowIndex` เพิ่มเติมในระดับโมเดล
