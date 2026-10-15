# Technical Specification: SGS Roster Import & Score Alignment Engine
# ระบบนำเข้ารายชื่อนักเรียนจาก SGS และการรักษาสายสัมพันธ์คะแนน 100%

- **วันที่ (Date)**: 16 ตุลาคม 2569
- **เอกสารอ้างอิงสถาปัตยกรรม (ADR)**: [`docs/adr/ADR-005-sgs-roster-import-and-score-alignment.md`](../adr/ADR-005-sgs-roster-import-and-score-alignment.md)
- **สถานะ (Status)**: Ready for Implementation

---

## 1. วัตถุประสงค์ (Objectives)

1. อำนวยความสะดวกให้ครูผู้สอนและฝ่ายทะเบียนในการนำเข้ารายชื่อนักเรียนจากระบบ **SGS (Secondary Grading System)** ของ สพฐ. ผ่าน 3 ช่องทางหลัก:
   - อัปโหลดไฟล์ Excel / CSV
   - วางข้อความที่คัดลอกมาจากตารางหน้าเว็บ SGS หรือ Excel (Clipboard Paste)
   - รับข้อมูลผ่าน Client-side Script / Extension
2. **รักษาความถูกต้องของลำดับแถวคะแนน 100% (Strict Row-Order Fidelity)** เพื่อป้องกันปัญหาคะแนนสลับคนอย่างเด็ดขาด
3. แยกข้อมูลตัวตนนักเรียน (`Student`) ออกจากการลงทะเบียนเรียนในห้อง (`ClassroomEnrollment`) เพื่อรองรับการย้ายห้องและคงประวัติคะแนนข้ามปีการศึกษา
4. มีหน้าต่างตรวจสอบก่อนบันทึกจริง (Dry-Run Preview) พร้อมจำแนกสถานะ 4 รูปแบบ: `NEW`, `EXISTS`, `CONFLICT`, `INVALID`
5. จัดเตรียมระบบส่งคะแนนกลับ SGS (Reverse Sync) ทั้งแบบไฟล์ Excel ตรงตามแบบฟอร์ม SGS และปุ่มคัดลอกคะแนนรายคอลัมน์เพื่อนำไปวาง (Paste) บนเว็บ SGS ได้ทันที

---

## 2. โครงสร้างข้อมูลและ Data Models (TypeScript Interfaces)

```typescript
// 1. สถานะการตรวจสอบความถูกต้องก่อนนำเข้า
export type SgsImportRowStatus = 'NEW' | 'EXISTS' | 'CONFLICT' | 'INVALID';

// 2. ข้อมูลแถวดิบที่แยกได้จาก Parser
export interface SgsParsedRow {
  rowIndex: number;              // ลำดับแถว 1..N ตามลำดับต้นฉบับในไฟล์หรือข้อความ
  rawSeatNo?: string;            // เลขที่ที่ตรวจพบ
  parsedSeatNo: number | null;   // เลขที่ที่แปลงเป็นตัวเลขได้
  studentCode: string;           // รหัสนักเรียน (เก็บเป็น String ห้ามตัด 0)
  title: string;                 // คำนำหน้า (ด.ช., ด.ญ., นาย, นางสาว)
  firstName: string;             // ชื่อ
  lastName: string;              // นามสกุล
  fullName: string;              // ชื่อ-นามสกุลรวม
  gender: 'MALE' | 'FEMALE';     // เพศที่วิเคราะห์ได้จากคำนำหน้า
  classroom?: string;            // ชั้น/ห้อง เช่น ม.1/1
  status: SgsImportRowStatus;    // สถานะเปรียบเทียบกับฐานข้อมูล
  conflictReason?: string;       // เหตุผลข้อขัดแย้ง (ถ้ามี)
  existingStudentId?: string;    // ไอดีของนักเรียนเดิมในระบบ (กรณีมีอยู่แล้ว)
  selectedAction?: 'IMPORT' | 'SKIP' | 'TRANSFER_ROOM'; // ทางเลือกของครู
}

// 3. ผลสรุปการทำ Dry-Run Preview
export interface SgsImportDryRunSummary {
  totalRows: number;
  newCount: number;
  existsCount: number;
  conflictCount: number;
  invalidCount: number;
  rows: SgsParsedRow[];
  hasBlockingErrors: boolean;
}

// 4. โครงสร้างสำหรับการส่งคะแนนกลับ SGS (Reverse Sync)
export interface SgsScoreExportRow {
  sgsRowIndex: number;
  sgsSeatNo: number;
  studentCode: string;
  studentName: string;
  unit1Score: number;            // คะแนนเก็บหน่วย 1
  unit2Score: number;            // คะแนนเก็บหน่วย 2
  midtermScore: number;          // คะแนนสอบกลางภาค
  finalScore: number;            // คะแนนสอบปลายภาค
  totalScore: number;            // รวม 100
  grade: string;                 // เกรด 0 - 4
}
```

---

## 3. สถาปัตยกรรม Smart Parser Engine

### 3.1 ตัวแยกวิเคราะห์ข้อความจาก Clipboard (Regex & Column Detection)
เมื่อผู้ใช้วางข้อความใน Textarea:
```typescript
export function parseSgsClipboardText(rawText: string): SgsParsedRow[]
```
- **การตัดแถว**: แยกตาม `\r\n` หรือ `\n` โดยข้ามแถวว่าง
- **การแยกคอลัมน์**:
  - หากพบ `\t` (Tab-delimited) $\to$ ตัดคอลัมน์ด้วย Tab (เกิดจากการก๊อปปี้จากหน้าเว็บหรือ Excel)
  - หากพบ `,` (CSV) $\to$ ตัดคอลัมน์ด้วย Comma
  - หากเป็นข้อความเว้นวรรค $\to$ ใช้ Regex วิเคราะห์หาตัวเลข 5 หลัก (`\b\d{5}\b`) เป็นหลักยึดของ `studentCode`
- **การแยกชื่อและคำนำหน้า (Thai Name Tokenizer)**:
  - คำนำหน้าชาย: `เด็กชาย`, `ด.ช.`, `ด.ช`, `นาย` $\to$ เพศ `MALE`
  - คำนำหน้าหญิง: `เด็กหญิง`, `ด.ญ.`, `ด.ญ`, `นางสาว`, `น.ส.` $\to$ เพศ `FEMALE`
  - ตัดคำนำหน้าออกจากชื่อ และแยกคำสุดท้ายเป็นนามสกุล

---

## 4. โครงสร้างส่วนต่อประสานผู้ใช้ (UI / UX Architecture)

### 4.1 หน้าต่างนำเข้ารายชื่อ (Import Modal)
จัดวางในธีม **Pastel Anime Education Dashboard**:
1. **แท็บเลือกวิธีการนำเข้า (3 แท็บ)**:
   - 📁 **ไฟล์ Excel / CSV**: ลากและวางไฟล์ `.xlsx` หรือ `.csv`
   - 📋 **คัดลอกและวางข้อความ (Paste & Parse)**: กล่อง Textarea กว้าง พร้อมปุ่ม "ทดสอบแยกข้อมูล"
   - 🌐 **ส่วนขยาย SGS / สคริปต์อัตโนมัติ**: ตัวเชื่อมต่อเบราว์เซอร์
2. **สรุปภาพรวม 4 สถานะ (Summary KPI Cards)**:
   - 🟢 นักเรียนใหม่ที่จะเพิ่ม (`NEW`)
   - 🔵 มีในห้องนี้อยู่แล้ว (`EXISTS` - ข้ามอัตโนมัติ)
   - 🟠 ข้อขัดแย้ง/ย้ายห้อง (`CONFLICT` - ให้ครูเลือกทางออก)
   - 🔴 ข้อมูลไม่สมบูรณ์ (`INVALID` - ระบุปัญหาชัดเจน)
3. **ตาราง Interactive Live Preview**:
   - คอลัมน์: ลำดับ SGS | เลขที่ | รหัสนักเรียน | ชื่อ-นามสกุล | เพศ | สถานะ | การดำเนินการ
   - อนุญาตให้คลิกแก้ไขข้อความได้โดยตรงในตารางก่อนกดยืนยัน
4. **ปุ่ม Action**:
   - `[❌ ยกเลิก]`
   - `[📥 ยืนยันการนำเข้าข้อมูล (X คน)]` — ทำงานในรูปแบบ Transaction ปลอดภัย

### 4.2 หน้าต่างส่งออกคะแนน (Export Modal)
1. **ปุ่มดาวน์โหลด Excel**: สร้างไฟล์ที่เรียงลำดับแถวตรงกับ SGS 100%
2. **ปุ่มก็อปปี้คะแนนรายคอลัมน์ (1-Click Clipboard Copy)**:
   - `[📋 คัดลอกคะแนนเก็บ (หน่วย 1)]`
   - `[📋 คัดลอกคะแนนกลางภาค]`
   - `[📋 คัดลอกคะแนนปลายภาค]`
   - นำไปคลิกช่องแรกในเว็บ SGS แล้วกด `Ctrl+V` ได้ทันที

---

## 5. แผนการตรวจสอบและทดสอบ (Verification Suite Plan)

1. **Unit Tests (Parser & Tokenizer)**:
   - ทดสอบการตัดชื่อรูปแบบต่างๆ (`ด.ช.สมชาย ใจดี`, `นายสมชาย ใจดี`, `เด็กหญิงสุดา งามดี`)
   - ทดสอบการตรวจจับคอลัมน์ทั้ง Tab-delimited, Comma-delimited และ Mixed-spacing
   - ทดสอบการคงลำดับ `sgsRowIndex` แม้เลขที่จะไม่ต่อเนื่อง (เช่น 1, 2, 4)
2. **Integration Tests (Conflict & Invariant Checks)**:
   - ทดสอบ `studentCode` ที่มีศูนย์นำหน้า (เช่น `"08451"`) ไม่ถูกแปลงเป็น Number จนเสียรูป
   - ทดสอบการไม่สร้างนักเรียนซ้ำเมื่อรหัสตรงกับนักเรียนที่มีอยู่แล้วในระบบ
   - ทดสอบการโอนย้ายห้องเรียน โดยคะแนนงานเก่าและประวัติการเข้าเรียนยังคงอยู่ครบ 100%
3. **E2E Export Alignment Tests**:
   - ตรวจสอบว่าผลลัพธ์การ Export มีลำดับตรงกับลำดับนำเข้าของ SGS ทุกประการ
