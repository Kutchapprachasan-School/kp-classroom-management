/**
 * scripts/index_data_schema.mjs
 * ============================================================================
 * Automated Cross-System Data Schema Indexer & Split-Brain Detector
 * ----------------------------------------------------------------------------
 * สแกนโค้ดจริงของทั้ง 2 ระบบที่ใช้ฐานข้อมูล Neon PostgreSQL ร่วมกัน:
 *   1. ระบบจัดการชั้นเรียน (09 ระบบจัดการชั้นเรียน - src/)
 *   2. ระบบบริหารจัดการโรงเรียน SMS / SuraLeave (C:/dev/eLeave/src - ถ้ามีในเครื่อง)
 *
 * สร้างไฟล์ `docs/DATA_SCHEMA_INDEX.md` (และคัดลอกไปยังโปรเจกต์ SMS อัตโนมัติ)
 * เพื่อให้ทั้งนักพัฒนาและ AI Agent รู้ทันทีว่า:
 *   - ข้อมูลแต่ละชนิด "เก็บที่ตารางไหน (Canonical Write)" และ "ดึงแสดงผลที่ไหน (Read View)"
 *   - ไฟล์ไหนและบรรทัดไหนบ้างในทั้ง 2 ระบบที่อ่าน/เขียนตารางนั้นๆ
 *   - หากแก้ Schema ตารางหนึ่ง ต้องตามไปอัปเดตจุดไหนบ้างเพื่อให้ Dashboard ตรงกัน 100%
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const CLASSROOM_ROOT = process.cwd();
const CLASSROOM_SRC = path.resolve(CLASSROOM_ROOT, 'src');
const OUTPUT_DOC = path.resolve(CLASSROOM_ROOT, 'docs/DATA_SCHEMA_INDEX.md');

// Sibling SMS project path (if available on developer machine)
const SMS_ROOT = path.resolve(CLASSROOM_ROOT, '../eLeave');
const SMS_SRC = path.resolve(SMS_ROOT, 'src');
const SMS_OUTPUT_DOC = path.resolve(SMS_ROOT, 'docs/DATA_SCHEMA_INDEX.md');

function walkFiles(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;
  for (const entry of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, files);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * 1. Scan Classroom Management (`src/`) for `.from('<tableName>')` & `.rpc('<fnName>')`
 */
function scanClassroomCodebase() {
  const files = walkFiles(CLASSROOM_SRC);
  const tableCalls = new Map(); // tableName -> Array<{ relPath, line, op, snippet }>
  const rpcCalls = new Map();   // rpcName -> Array<{ relPath, line, snippet }>

  for (const file of files) {
    const relPath = path.relative(CLASSROOM_ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((rawLine, idx) => {
      const lineNum = idx + 1;
      const windowText = lines.slice(idx, Math.min(lines.length, idx + 5)).join(' ');

      const fromMatch = rawLine.match(/\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (fromMatch) {
        const tableName = fromMatch[1];
        let op = 'READ';
        if (/\.(insert|upsert|update|delete)\s*\(/.test(windowText)) {
          const m = windowText.match(/\.(insert|upsert|update|delete)\s*\(/);
          op = `WRITE:${m[1].toUpperCase()}`;
        } else if (/\.select\s*\(/.test(windowText)) {
          op = 'READ:SELECT';
        }
        if (!tableCalls.has(tableName)) tableCalls.set(tableName, []);
        tableCalls.get(tableName).push({
          relPath,
          line: lineNum,
          op,
          snippet: rawLine.trim(),
        });
      }

      const rpcMatch = rawLine.match(/\.rpc\(\s*['"`]([^'"`]+)['"`]/);
      if (rpcMatch) {
        const rpcName = rpcMatch[1];
        if (!rpcCalls.has(rpcName)) rpcCalls.set(rpcName, []);
        rpcCalls.get(rpcName).push({
          relPath,
          line: lineNum,
          snippet: rawLine.trim(),
        });
      }
    });
  }

  return { tableCalls, rpcCalls };
}

/**
 * 2. Scan Sibling SMS Codebase (`C:/dev/eLeave/src`) for `prisma.<model>.<method>`
 */
function scanSmsCodebase() {
  const modelCalls = new Map(); // prismaModel -> Array<{ relPath, line, op }>
  if (!fs.existsSync(SMS_SRC)) return { available: false, modelCalls };

  const files = walkFiles(SMS_SRC);
  const readOps = new Set(['findMany', 'findUnique', 'findFirst', 'count', 'aggregate', 'groupBy']);

  for (const file of files) {
    const relPath = path.relative(SMS_ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((rawLine, idx) => {
      const lineNum = idx + 1;
      const regex = /(?:prisma|tx)\.([a-zA-Z0-9_]+)\.(findMany|findUnique|findFirst|count|aggregate|groupBy|create|createMany|update|updateMany|upsert|delete|deleteMany)\b/g;
      for (const m of rawLine.matchAll(regex)) {
        const modelName = m[1];
        const method = m[2];
        const opType = readOps.has(method) ? `READ:${method}` : `WRITE:${method}`;
        if (!modelCalls.has(modelName)) modelCalls.set(modelName, []);
        modelCalls.get(modelName).push({
          relPath,
          line: lineNum,
          op: opType,
        });
      }
    });
  }

  return { available: true, modelCalls };
}

/**
 * 3. Canonical Domain Registry (Single Source of Truth Contract)
 */
const CANONICAL_DOMAINS = [
  {
    domain: '1. ข้อมูลประวัตินักเรียน & เบอร์ผู้ปกครอง (Student Identity & Parent Contacts)',
    canonicalWriteTable: '"Student" (Base Table)',
    readViewClassroom: 'public.students (PostgreSQL View + INSTEAD OF Trigger)',
    readModelSms: 'prisma.student ("Student")',
    forbiddenStore: 'kps_cloud_store (ห้ามใช้ cls_students_* เป็น Source of Truth)',
    keyMapping: [
      { concept: 'รหัสอ้างอิงหลัก (PK)', smsField: 'Student.id', classroomViewField: 'students.id' },
      { concept: 'รหัสประจำตัวนักเรียน 5 หลัก', smsField: 'Student.studentCode', classroomViewField: 'students.code / students."studentCode"' },
      { concept: 'คำนำหน้า + ชื่อ-สกุล', smsField: 'Student.title, firstName, lastName', classroomViewField: 'students.name, title, first_name, last_name' },
      { concept: 'ชื่อผู้ปกครอง (SMS)', smsField: 'Student.parentName', classroomViewField: 'students."parentName" / students.parent_name' },
      { concept: 'เบอร์โทรผู้ปกครอง (SMS)', smsField: 'Student.parentPhone', classroomViewField: 'students."parentPhone" / students.parent_phone' },
      { concept: 'สถานะการเรียน/จบการศึกษา', smsField: 'Student.status, academic_status, graduated_academic_year', classroomViewField: 'students.status, academic_status, graduated_academic_year' },
    ],
    syncRule: 'เมื่อแก้ไขชื่อ/เบอร์โทรผู้ปกครอง/สถานะนักเรียน ต้องเขียนลงตาราง `"Student"` เสมอ (หรือผ่าน View `public.students` ซึ่งมี Trigger `students_view_update_trigger` เขียนลง `"Student"` ให้อัตโนมัติ)',
  },
  {
    domain: '2. การสังกัดห้องเรียน, เลขที่ และการเลื่อนชั้น (Class Enrollment & Year-End Promotion)',
    canonicalWriteTable: '"StudentEnrollment" (Base Table) ⟷ public.student_enrollments (Synced)',
    readViewClassroom: 'public.students (classroom_id, seat_no) & public.classrooms (student_count)',
    readModelSms: 'prisma.studentEnrollment ("StudentEnrollment" WHERE status = \'ENROLLED\')',
    forbiddenStore: 'kps_cloud_store (ห้ามใช้จำนวนนักเรียนจาก localStorage ทับ student_count จาก DB)',
    keyMapping: [
      { concept: 'รหัสนักเรียน', smsField: 'StudentEnrollment.studentId', classroomViewField: 'student_enrollments.student_id / students.id' },
      { concept: 'รหัสห้องเรียนปัจจุบัน', smsField: 'StudentEnrollment.classRoomId', classroomViewField: 'student_enrollments.classroom_id / students.classroom_id' },
      { concept: 'เลขที่ในห้องเรียน', smsField: 'StudentEnrollment.rollNumber', classroomViewField: 'student_enrollments.roll_number / students.seat_no' },
      { concept: 'ปีการศึกษา / ภาคเรียน', smsField: 'StudentEnrollment.academicYear, term', classroomViewField: 'student_enrollments.academic_year, semester' },
      { concept: 'สถานะกำลังศึกษาในห้องนี้', smsField: 'status = \'ENROLLED\'::"EnrollmentStatus"', classroomViewField: 'status = \'ACTIVE\' (ใน student_enrollments)' },
    ],
    syncRule: '⚠️ จุดสำคัญที่สุด: ทั้ง View `public.students`, View `public.classrooms (student_count)` และหน้า Dashboard ฝั่ง SMS อ่านห้องเรียนปัจจุบันจาก `"StudentEnrollment"` (status = `ENROLLED`) ดังนั้นทุกการย้ายห้องหรือเลื่อนชั้นใน `student_enrollments` ต้อง Sync กลับไปที่ `"StudentEnrollment"` เสมอ (ผ่าน Trigger ใน `migrations/004_unify_sms_and_classroom_schema.sql`)',
  },
  {
    domain: '3. ข้อมูลห้องเรียนและครูที่ปรึกษา (Classrooms & Homeroom Advisers)',
    canonicalWriteTable: '"ClassRoom" (Base Table)',
    readViewClassroom: 'public.classrooms (PostgreSQL View คำนวณ student_count จาก "StudentEnrollment")',
    readModelSms: 'prisma.classRoom ("ClassRoom")',
    forbiddenStore: 'kps_cloud_store (cls_classrooms_data ใช้เป็นเพียง Local Fallback เมื่อออฟไลน์เท่านั้น)',
    keyMapping: [
      { concept: 'รหัสห้องเรียน', smsField: 'ClassRoom.id', classroomViewField: 'classrooms.id' },
      { concept: 'ชื่อห้อง (เช่น ม.1/1)', smsField: 'ClassRoom.name', classroomViewField: 'classrooms.name / room_name' },
      { concept: 'ระดับชั้น / ห้องที่', smsField: 'ClassRoom.gradeLevel, roomNumber', classroomViewField: 'classrooms.grade_level, room_number, level' },
      { concept: 'ครูที่ปรึกษา', smsField: 'ClassRoom.adviser', classroomViewField: 'classrooms.adviser' },
      { concept: 'จำนวนนักเรียนในห้อง', smsField: 'COUNT(StudentEnrollment WHERE status=ENROLLED)', classroomViewField: 'classrooms.student_count' },
    ],
    syncRule: 'การเพิ่ม/ลบ/แก้ชื่อครูที่ปรึกษาห้องเรียน ต้องเขียนลง `"ClassRoom"` และห้ามนำค่า `localStorage` มาทับ `student_count` ที่คำนวณจากฐานข้อมูลจริง',
  },
  {
    domain: '4. การเช็คชื่อนักเรียน (หน้าเสาธง & รายคาบ) vs การลงเวลาบุคลากร (Attendance)',
    canonicalWriteTable: '"Attendance" (จัดการชั้นเรียน) ⟷ "StudentMorningAttendance" / "StudentPeriodAttendance" (SMS)',
    readViewClassroom: '"Attendance" (ผ่าน attendanceService.ts แยกตาม classroomId, date, period)',
    readModelSms: 'prisma.studentMorningAttendance (เช็คชื่อเช้าของนักเรียน) & prisma.attendance (ลงเวลาครู/บุคลากร)',
    forbiddenStore: 'kps_cloud_store (kp_morning_assembly_records / kp_period_attendance_records)',
    keyMapping: [
      { concept: 'เช็คชื่อหน้าเสาธง (ตอนเช้า)', smsField: 'StudentMorningAttendance (enrollmentId, businessDate, status)', classroomViewField: 'Attendance (studentId, classroomId, date, period = 0, status)' },
      { concept: 'เช็คชื่อรายคาบเรียน', smsField: 'StudentPeriodAttendance (enrollmentId, scheduledSessionId, status)', classroomViewField: 'Attendance (studentId, classroomId, date, period >= 1, status)' },
      { concept: 'ลงเวลาปฏิบัติราชการครู', smsField: 'Attendance (userId, attendanceDate, checkInTime, status)', classroomViewField: 'ไม่ใช้ในฝั่งจัดการชั้นเรียน (ต้องกรอง userId IS NOT NULL ฝั่ง SMS)' },
    ],
    syncRule: '⚠️ ตาราง `"Attendance"` ถูกใช้ร่วมกัน! แถวของครูจะมี `userId IS NOT NULL` ส่วนแถวเช็คชื่อนักเรียนจากระบบจัดการชั้นเรียนจะมี `studentId IS NOT NULL` และเมื่อเช็คชื่อเช้า (`period = 0`) Trigger ใน `004_unify_sms_and_classroom_schema.sql` จะซิงค์เข้า `"StudentMorningAttendance"` เพื่อให้ Dashboard ฝั่ง SMS แสดงยอดมาเรียนวันนี้ตรงกันทันที',
  },
  {
    domain: '5. คะแนนเก็บ, การตัดเกรด และผลการเรียน (Grades, Scores & Transcripts)',
    canonicalWriteTable: '"AssessmentColumn" + "StudentScore" (เกรดรายวิชา) & "Assignment" + "Score" (งานมอบหมาย)',
    readViewClassroom: '"AssessmentColumn", "StudentScore", "Assignment", "Score"',
    readModelSms: 'prisma.examSubmission / "AssessmentColumn" + "StudentScore"',
    forbiddenStore: 'kps_cloud_store (ห้ามเก็บคะแนนใน JSONB รวม)',
    keyMapping: [
      { concept: 'ช่องคะแนนเก็บ/สอบ', smsField: 'AssessmentColumn (id, courseId, classroomId, academicYear, semester, maxScore)', classroomViewField: 'AssessmentColumn (gradeService.ts)' },
      { concept: 'คะแนนรายบุคคล', smsField: 'StudentScore (id, studentId, assignmentId, score)', classroomViewField: 'StudentScore (gradeService.ts & studentEnrollmentService.ts)' },
    ],
    syncRule: 'ก่อนสั่งเลื่อนชั้น (Promotion) หรือดูใบเกรดศิษย์เก่า (Alumni Transcript) ระบบจะเรียก `gradeService.flushOutbox()` เพื่อดันคะแนนจาก IndexedDB ขึ้น `"StudentScore"` เสมอ',
  },
  {
    domain: '6. บัญชีผู้ใช้งานและครูผู้สอน (Users, Teachers & Auth)',
    canonicalWriteTable: '"User" + "Account" (Better-Auth / Prisma)',
    readViewClassroom: '"User" + "Account" (authService.ts, classroomService.ts)',
    readModelSms: 'prisma.user + prisma.account + prisma.userDutyAssignment',
    forbiddenStore: 'kps_cloud_store (kp_teacher_accounts_cache ใช้เป็นเพียงแคชชั่วคราว)',
    keyMapping: [
      { concept: 'บัญชีครู/บุคลากร', smsField: 'User (id, email, name, username, role)', classroomViewField: 'User (id, email, name, username, role)' },
      { concept: 'รหัสผ่านเข้าระบบ', smsField: 'Account (userId, password)', classroomViewField: 'Account (userId, password)' },
    ],
    syncRule: 'ใช้ตาราง `"User"` และ `"Account"` ร่วมกัน 100% ระหว่างระบบ SMS และระบบจัดการชั้นเรียน',
  },
];

function generateMarkdown() {
  const { tableCalls, rpcCalls } = scanClassroomCodebase();
  const smsScan = scanSmsCodebase();

  let md = `# 🗺️ DATA SCHEMA INDEX & CROSS-SYSTEM CONTRACT
> **Single Source of Truth ระหว่าง \`09 ระบบจัดการชั้นเรียน\` ⟷ \`ระบบ SMS (SuraLeave / School-System)\`**
> *อัปเดตอัตโนมัติโดย \`node scripts/index_data_schema.mjs\` — ห้ามแก้ไขส่วน Auto-Generated ด้วยมือ*

---

## 🚨 1. สรุปคำตอบชัดๆ: \`"Student"\` vs \`students\` vs \`kps_cloud_store\` ใช้ตัวไหนกันแน่?

เพื่อให้ทั้ง **ระบบ SMS** และ **ระบบจัดการชั้นเรียน** แสดงผลตรงกัน 100% และไม่เกิดปัญหาข้อมูลตีกัน (Split-Brain) กฎเหล็กของสถาปัตยกรรมคือ:

| ชื่อในฐานข้อมูล | ประเภท (Type) | บทบาทหน้าที่ (Role) | กฎการใช้งาน (Strict Rule) |
| :--- | :--- | :--- | :--- |
| **\`"Student"\`** | **Base Table (ตารางจริง)** | เก็บประวัติส่วนตัวนักเรียน, รหัสประจำตัว, ชื่อ-สกุล, **เบอร์ผู้ปกครอง (\`parentPhone\`)**, สถานะศิษย์เก่า (\`academic_status\`) | ✅ **ตารางหลักสำหรับบันทึก (WRITE)** ข้อมูลตัวตนนักเรียนทั้งจากฝั่ง SMS และระบบจัดการชั้นเรียน |
| **\`"StudentEnrollment"\`** | **Base Table (ตารางจริง)** | เก็บว่านักเรียนคนไหน อยู่ห้องอะไร (\`classRoomId\`), เลขที่เท่าไหร่ (\`rollNumber\`), ปีการศึกษา/เทอมไหน (\`status = 'ENROLLED'\`) | ✅ **ตารางหลักสำหรับบันทึกสังกัดห้องเรียน** ที่ทั้ง **SMS Dashboard** และ **View \`students\` / \`classrooms\`** ใช้ดึงข้อมูล! |
| **\`public.students\`** | **PostgreSQL VIEW (ตารางเสมือน)** | นำ \`"Student"\` + \`"StudentEnrollment"\` มาเชื่อม (JOIN) กันให้อัตโนมัติ พร้อมแปลงชื่อคอลัมน์ให้ระบบจัดการชั้นเรียนใช้งานง่าย | ✅ **ใช้สำหรับดึงข้อมูล (READ)** ในระบบจัดการชั้นเรียน (\`masterDataService\`, \`smsNotificationService\`) และมี \`INSTEAD OF Trigger\` ส่งคำสั่งแก้ไขกลับไปที่ \`"Student"\` และ \`"StudentEnrollment"\` |
| **\`public.classrooms\`** | **PostgreSQL VIEW (ตารางเสมือน)** | นำ \`"ClassRoom"\` + \`COUNT("StudentEnrollment")\` มาคำนวณยอดนักเรียนรายห้อง (\`student_count\`) แบบเรียลไทม์ | ✅ **ใช้สำหรับดึงรายชื่อห้องและจำนวนนักเรียน (READ)** ในระบบจัดการชั้นเรียน (\`classroomService.getAll()\`) |
| **\`public.student_enrollments\`** | **Workflow Table (ประวัติเลื่อนชั้น)** | เก็บประวัติการเลื่อนชั้น/ซ้ำชั้น/เกรดเฉลี่ยสะสมรายเทอม ผูกกับ \`promotion_batches\` | 🔄 **ต้อง Sync อัตโนมัติกับ \`"StudentEnrollment"\`** เสมอผ่าน Trigger ห้ามปล่อยให้ข้อมูลแยกขาดจากกัน |
| **\`public.kps_cloud_store\`** | **Key-Value Config Store** | เก็บเฉพาะ **การตั้งค่าหน้าเว็บ (UI Settings, ตารางเสียงออด, แบนเนอร์, ปฏิทินโรงเรียน)** | ⛔ **ห้ามใช้เก็บรายชื่อนักเรียน, ห้องเรียน, คะแนน หรือการเช็คชื่อเป็นอันขาด!** (คีย์ตระกูล \`cls_students_*\`, \`cls_classrooms_data\` เป็น Legacy Fallback เท่านั้น ห้ามนำไปทับค่าจากตารางจริง) |

---

## 🔗 2. สัญญาการเชื่อมต่อข้อมูลข้ามระบบ (Cross-System Domain Contract)

`;

  for (const item of CANONICAL_DOMAINS) {
    md += `### ${item.domain}\n`;
    md += `- **ตารางบันทึกหลัก (Canonical Write)**: \`${item.canonicalWriteTable}\`\n`;
    md += `- **ฝั่งระบบจัดการชั้นเรียนอ่านจาก (Classroom Read)**: \`${item.readViewClassroom}\`\n`;
    md += `- **ฝั่งระบบ SMS อ่านจาก (SMS Prisma Model)**: \`${item.readModelSms}\`\n`;
    md += `- **สิ่งที่ห้ามทำ (Forbidden)**: ❌ ${item.forbiddenStore}\n`;
    md += `- **กฎการซิงค์ (Sync Rule)**: ${item.syncRule}\n\n`;
    md += `| ความหมายข้อมูล | คอลัมน์ฝั่ง SMS (\`Prisma / Base Table\`) | คอลัมน์ฝั่งจัดการชั้นเรียน (\`View / Service\`) |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const k of item.keyMapping) {
      md += `| ${k.concept} | \`${k.smsField}\` | \`${k.classroomViewField}\` |\n`;
    }
    md += `\n`;
  }

  md += `---

## 🛠️ 3. แผนผังผลกระทบเมื่อแก้ไข Schema (Impact Analysis Checklist)

> **วิธีใช้**: ก่อนที่คุณหรือ AI Agent จะแก้ไขโครงสร้างตารางหรือเปลี่ยนวิธีคำนวณตัวเลขบน Dashboard ให้ดูตารางนี้เพื่อรู้ทันทีว่าต้องตามไปปรับไฟล์ไหนบ้างในทั้ง 2 ระบบ:

| ถ้ามีการแก้ไขเรื่อง... | ตารางที่เกี่ยวข้อง | ไฟล์ใน \`09 ระบบจัดการชั้นเรียน\` ที่ต้องตรวจสอบ | ไฟล์ใน \`ระบบ SMS (eLeave)\` ที่ต้องตรวจสอบ |
| :--- | :--- | :--- | :--- |
| **เพิ่ม/ลบ/ย้ายห้องนักเรียน หรือเลื่อนชั้น** | \`"Student"\`, \`"StudentEnrollment"\`, \`student_enrollments\`, View \`students\`, View \`classrooms\` | [\`masterDataService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/masterDataService.ts), [\`studentService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/studentService.ts), [\`classroomService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/classroomService.ts), [\`studentPromotionService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/studentPromotionService.ts), [\`studentEnrollmentService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/studentEnrollmentService.ts) | \`src/app/actions/dashboard-widgets.ts\` (\`totalActiveStudents\`), \`src/app/actions/academic-planning.ts\` |
| **แก้ไขเบอร์ผู้ปกครอง / ส่งแจ้งเตือน SMS** | \`"Student"\` (\`parentPhone\`, \`parentName\`), View \`students\` | [\`smsNotificationService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/smsNotificationService.ts), [\`masterDataService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/masterDataService.ts), [\`localCacheDb.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/localCacheDb.ts), \`migrations/003_sms_and_parent_contacts_view.sql\` | โมดูลข้อมูลนักเรียน (\`prisma.student\`) |
| **เช็คชื่อนักเรียนตอนเช้า (หน้าเสาธง) & รายคาบ** | \`"Attendance"\` (\`period=0\` / \`period>=1\`), \`"StudentMorningAttendance"\`, \`"StudentPeriodAttendance"\` | [\`attendanceService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/attendanceService.ts), [\`MorningAssemblyView.tsx\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/views/MorningAssemblyView.tsx), [\`AttendanceView.tsx\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/views/AttendanceView.tsx) | \`src/app/actions/dashboard-widgets.ts\` (บรรทัด 365 \`prisma.attendance\` ของครู vs บรรทัด 394 \`prisma.studentMorningAttendance\` ของนักเรียน) |
| **บันทึกคะแนนเก็บ / ตัดเกรด / ใบปพ.** | \`"AssessmentColumn"\`, \`"StudentScore"\`, \`"Assignment"\`, \`"Score"\` | [\`gradeService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/gradeService.ts), [\`scoreService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/scoreService.ts), [\`studentEnrollmentService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/studentEnrollmentService.ts) | \`src/app/actions/dashboard-widgets.ts\` (\`getLearningOutcomeStats\`), \`src/app/actions/omr.ts\` |
| **เพิ่ม/แก้ไขห้องเรียน หรือครูที่ปรึกษา** | \`"ClassRoom"\`, View \`classrooms\` | [\`classroomService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/classroomService.ts), [\`masterDataService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/masterDataService.ts) | \`src/app/actions/dashboard-widgets.ts\`, \`src/app/actions/academic-planning.ts\` |
| **จัดการบัญชีครู / รหัสผ่าน / สิทธิ์การใช้งาน** | \`"User"\`, \`"Account"\`, \`"UserDutyAssignment"\` | [\`authService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/authService.ts), [\`classroomService.ts\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/services/classroomService.ts), [\`UserAccountsView.tsx\`](file:///c:/dev/09%20ระบบจัดการชั้นเรียน/src/views/UserAccountsView.tsx) | \`src/app/actions/admin.ts\`, \`src/app/actions/auth_actions.ts\`, \`src/lib/auth-session.ts\` |

---

## 📍 4. ดัชนีการเรียกใช้ตารางจริงในโค้ด (Auto-Generated Code-to-Schema Map)

### 4.1 ฝั่งระบบจัดการชั้นเรียน (\`09 ระบบจัดการชั้นเรียน/src\`)
`;

  const sortedTables = [...tableCalls.keys()].sort((a, b) => a.localeCompare(b));
  for (const tbl of sortedTables) {
    const calls = tableCalls.get(tbl);
    md += `\n#### 🗂️ ตาราง/View: \`${tbl}\` (${calls.length} จุดเรียกใช้)\n`;
    for (const c of calls) {
      const absUrl = `file:///${path.resolve(CLASSROOM_ROOT, c.relPath).replace(/\\/g, '/')}#L${c.line}`;
      md += `- **[${c.op}]** [\`${c.relPath}:${c.line}\`](${absUrl})\n`;
    }
  }

  md += `\n### 4.2 PostgreSQL RPCs ที่เรียกใช้ในระบบจัดการชั้นเรียน\n`;
  const sortedRpcs = [...rpcCalls.keys()].sort((a, b) => a.localeCompare(b));
  for (const fn of sortedRpcs) {
    const calls = rpcCalls.get(fn);
    md += `- **RPC \`${fn}()\`**:\n`;
    for (const c of calls) {
      const absUrl = `file:///${path.resolve(CLASSROOM_ROOT, c.relPath).replace(/\\/g, '/')}#L${c.line}`;
      md += `  - [\`${c.relPath}:${c.line}\`](${absUrl})\n`;
    }
  }

  if (smsScan.available) {
    md += `\n### 4.3 ฝั่งระบบ SMS (\`C:/dev/eLeave/src\` — ตารางที่ใช้ร่วมกัน)\n`;
    const sharedModels = [
      'student',
      'studentEnrollment',
      'classRoom',
      'attendance',
      'studentMorningAttendance',
      'studentPeriodAttendance',
      'studentMedicalCertificate',
      'studentRiskAssessment',
      'studentHomeVisit',
      'studentSdqEvaluation',
      'behaviorRecord',
      'subject',
      'subjectOffering',
      'timetableSlot',
      'teacher',
      'user',
      'account',
    ];

    for (const model of sharedModels) {
      const calls = smsScan.modelCalls.get(model) || [];
      if (calls.length === 0) {
        md += `- **\`prisma.${model}\`**: *(ยังไม่มีการเรียกใช้โดยตรงใน \`eLeave/src\` — ต้องระวังหากฝั่งจัดการชั้นเรียนเขียนข้อมูลลงตารางอื่น)*\n`;
        continue;
      }
      // Group by file + op
      const uniqueEntries = new Map();
      for (const c of calls) {
        const key = `${c.relPath}:${c.op}`;
        if (!uniqueEntries.has(key)) uniqueEntries.set(key, c);
      }
      md += `- **\`prisma.${model}\`** (${calls.length} calls across ${uniqueEntries.size} file-ops):\n`;
      for (const c of [...uniqueEntries.values()].slice(0, 10)) {
        const absUrl = `file:///${path.resolve(SMS_ROOT, c.relPath).replace(/\\/g, '/')}#L${c.line}`;
        md += `  - **[${c.op}]** [\`eLeave/${c.relPath}:${c.line}\`](${absUrl})\n`;
      }
      if (uniqueEntries.size > 10) {
        md += `  - *...และอีก ${uniqueEntries.size - 10} จุด*\n`;
      }
    }
  }

  md += `\n---

## 🛡️ 5. ขั้นตอนมาตรฐานเมื่อต้องเพิ่มฟิลด์หรือแก้ตารางในอนาคต (Zero-Bug Workflow)

1. **เช็คไฟล์นี้ก่อนเสมอ (\`docs/DATA_SCHEMA_INDEX.md\`)**:
   - ห้ามเดาชื่อตารางเองเด็ดขาด! ดูว่าฟีเจอร์ที่จะแก้ต้องเขียนลง Base Table ตัวไหน และอ่านจาก View ตัวไหน
2. **ห้ามสร้างตารางซ้ำซ้อน (No Duplicate snake_case vs PascalCase Tables)**:
   - หากมีตาราง Prisma อยู่แล้ว (เช่น \`"Student"\`, \`"StudentEnrollment"\`, \`"ClassRoom"\`, \`"AssessmentColumn"\`, \`"StudentScore"\`) ให้ใช้ตารางนั้นเป็นหลัก หรือสร้างเป็น **PostgreSQL View** เท่านั้น ห้าม \`CREATE TABLE\` แยกอีกใบโดยไม่มี Trigger Sync
3. **อัปเดต View และ Trigger ทุกครั้งที่เพิ่มคอลัมน์ใน \`"Student"\` หรือ \`"ClassRoom"\`**:
   - หากเพิ่มฟิลด์ใน \`"Student"\` (เช่น \`parentPhone\`) ต้อง \`CREATE OR REPLACE VIEW public.students\` และอัปเดต \`students_view_update_trigger()\` เพื่อให้ระบบจัดการชั้นเรียนมองเห็นฟิลด์นั้นทันที
4. **รันคำสั่งอัปเดตดัชนีทุกครั้งหลังแก้โค้ด**:
   \`\`\`bash
   node scripts/index_data_schema.mjs
   node scripts/index_codebase.mjs
   \`\`\`
`;

  fs.mkdirSync(path.dirname(OUTPUT_DOC), { recursive: true });
  fs.writeFileSync(OUTPUT_DOC, md, 'utf-8');
  console.log(`✅ Generated ${OUTPUT_DOC} (${md.split('\n').length} lines)`);

  // Also sync to sibling SMS repo if docs folder exists
  if (fs.existsSync(SMS_ROOT)) {
    try {
      fs.mkdirSync(path.dirname(SMS_OUTPUT_DOC), { recursive: true });
      fs.writeFileSync(SMS_OUTPUT_DOC, md, 'utf-8');
      console.log(`✅ Synced shared copy to ${SMS_OUTPUT_DOC}`);

      const ruleSrc = path.resolve(CLASSROOM_ROOT, '.agent/rules/data-schema-governance.md');
      const ruleDest = path.resolve(SMS_ROOT, '.agent/rules/data-schema-governance.md');
      if (fs.existsSync(ruleSrc)) {
        fs.mkdirSync(path.dirname(ruleDest), { recursive: true });
        fs.copyFileSync(ruleSrc, ruleDest);
        console.log(`✅ Synced governance rule to ${ruleDest}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not sync to ${SMS_OUTPUT_DOC}:`, err.message);
    }
  }
}

generateMarkdown();
