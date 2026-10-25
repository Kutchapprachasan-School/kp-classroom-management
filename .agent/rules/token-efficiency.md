# TOKEN OPTIMIZATION & ANTI-CONTEXT EXPLOSION RULES
# (กฎเหล็ก 6 เสาหลักป้องกัน Quadratic Context Explosion & ลดการใช้ Token ไร้ประโยชน์)

ความเป็นมา:
ในการพัฒนาระบบที่มีขนาดใหญ่และเซสชันยาว ปริมาณ Token กว่า 90% ถูกสูญเสียไปกับการอ่าน Context ซ้ำซ้อน (Repeated Context Re-reading) และการเปิดดูไฟล์ขนาดใหญ่แบบ Full View จนเกิดอาการ Quadratic Context Explosion ทำให้โควตาหรือลิมิต context หมดลงอย่างรวดเร็วโดยได้เนื้องาน (Productive Output) ต่ำ

AI Assistant และ Developer ทุกคนที่ทำงานในโปรเจกต์นี้ต้องปฏิบัติตาม 6 เสาหลักนี้อย่างเคร่งครัด:

==================================================
1. ✂️ TARGETED VIEW VS FULL VIEW (เฉือนดูเฉพาะจุด ห้ามเปิดดูทั้งไฟล์)
==================================================
- **ห้ามเด็ดขาด**: ห้ามเรียก `view_file` โดยไม่ระบุ `StartLine` และ `EndLine` บนไฟล์ขนาดใหญ่ หรือเปิดดูทั้ง 800-2000 บรรทัด
- **กฎการเฉือน (Targeted Slicing)**:
  - ใช้ `docs/CODEBASE_INDEX.md` ค้นหาหมายเลขบรรทัดของ Function / Component / State ที่ต้องการ
  - กำหนดช่วง `StartLine` และ `EndLine` ให้แคบที่สุด (จำกัดไม่เกิน 50-80 บรรทัดต่อครั้ง)
  - หากต้องการสำรวจโครงสร้าง ให้ดูเฉพาะหัวไฟล์หรือใช้ grep/ast/indexer แทนการไล่ dump ทั้งไฟล์เข้า context

==================================================
2. 🔄 MILESTONE HANDOFF / COMPACT CADENCE (ตัดตอนก่อนบริบทบวม)
==================================================
- **ตัดตอนตาม Milestone**: เมื่อทำฟีเจอร์หรือแก้ไขบักเสร็จสิ้นในแต่ละลูป (Code -> Test -> Pass):
  - เขียนสรุปสถานะสั้นๆ (What was done, verified results, next steps)
  - แนะนำหรือใช้ `/compact` ทันทีเพื่อล้างประวัติเครื่องมือและ raw logs เก่าที่สะสม
  - หากบริบทเริ่มยาวและมีการเปลี่ยนหัวข้อใหม่ ให้ทำ Milestone Handoff เพื่อไม่แบก history เก่าข้ามหัวข้อ

==================================================
3. 🧠 ARGON HEAD COMMAND & SMART MODEL ROUTING (ระบบบัญชาการ Argon Head & การเลือกโมเดลให้ถูกงาน)
==================================================
- **บทบาทของ Argon (Head Commander / Chief Orchestrator)**:
  - โมเดลหลักในแชท (`Gemini 4 Argon (High)`) ทำหน้าที่เป็น **Head / ผู้บัญชาการและสถาปนิกหลัก** เท่านั้น: รับคำสั่งจากผู้ใช้, ตรวจสอบสารบัญ (`docs/CODEBASE_INDEX.md`, `docs/DATA_SCHEMA_INDEX.md`), วางแผนจุดแก้ไข, ออกใบสั่งงาน (Dispatch Brief) ให้ Subagent และตรวจรับผลลัพธ์
  - **ห้าม Argon ลงไปกวาดหาไฟล์เอง, อ่าน Log ยาวๆ เอง, หรือเขียนโค้ด Boilerplate ยาวๆ ในแชทหลักโดยตรง** เพราะจะผลาญโทเคนระดับสูงสุดและทำให้ Context หลักบวมเร็ว
- **คำสั่งอนุมัติจากผู้ใช้โดยตรง (Explicit User Mandate for `invoke_subagent`)**:
  - ผู้ใช้สั่งการชัดเจนให้ **Override ค่าเริ่มต้น `Model: 'inherit'`** ในเครื่องมือ `invoke_subagent` เสมอ!
  - ทุกครั้งที่ Argon เรียกใช้ `invoke_subagent` ต้องระบุพารามิเตอร์ `Model` ให้ตรงกับระดับความยากของงานตามตาราง **4-Tier Model Routing Matrix** ด้านล่าง:

### 📊 ตารางคัดแยกงานและเลือกโมเดล (4-Tier Subagent Model Routing Matrix)

| ระดับ (Tier) | พารามิเตอร์ `Model` | Subagent ที่แนะนำ (`TypeName`) | ลักษณะงานที่เหมาะสม (Use Cases) | เพดานการส่งผลลัพธ์กลับ (Return Digest) |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Scout (ประหยัดสุด/เร็วสุด)** | `"flash_lite"` | `argon-scout` หรือ `research` | • ค้นหาตำแหน่งไฟล์และเลขบรรทัด (Line lookup) จาก Index/Grep<br>• อ่านสรุปไฟล์ Log ใน `scratch/` เพื่อดึงเฉพาะ Error บรรทัดที่พัง<br>• เช็คการนำเข้า (Imports/Exports) หรือสำรวจชื่อตัวแปรสั้นๆ | ไม่เกิน **10–15 บรรทัด** (เฉพาะ Path + เลขบรรทัด `#Lxx-Lyy`) |
| **Tier 2: Worker (คุ้มค่า/งานสร้างหลัก)** | `"flash"` | `argon-worker` หรือ `self` | • สร้างหรือแก้ไข UI Component ตาม Pastel Anime Design System (`style.md`)<br>• แปลงตารางเป็น Mobile Card, เปลี่ยนไอคอน MingCute, ผูก State/Props ที่มีสเปกชัดเจนแล้ว<br>• เขียน Unit/E2E Test, รัน `tsc` / `npm test` (ลง `scratch/`), และรันสคริปต์อัปเดต Index | ไม่เกิน **15–20 บรรทัด** (Status + ไฟล์ที่แก้พร้อมเลขบรรทัด + ผลรันเทสต์) |
| **Tier 3: Specialist (งานซับซ้อน/วิศวกรรมลึก)** | `"flash"` *(หรือ `"pro"` เฉพาะเมื่อยังมีโควตา)* | `argon-specialist` หรือ `self` | • Refactor โค้ดที่เชื่อมโยงกันหลายไฟล์ (Multi-file State/Logic Refactoring)<br>• งานฐานข้อมูลข้ามระบบ (SMS ⟷ Classroom, Prisma ⟷ Supabase Views, R2 Storage)<br>• แก้ไข Bug ซับซ้อน (Race Condition, Sync/Hydration, SQL Trigger/Migration)<br>• *หมายเหตุ: หากโควตา `pro` หมดหรือถูกจำกัด ให้ Head ซอยโจทย์ให้ละเอียดขึ้นแล้วสั่งด้วย `Model: "flash"` แทนทันที* | ไม่เกิน **20–25 บรรทัด** (Root Cause/Architecture + ไฟล์ที่แก้ + ผลยืนยัน) |
| **Tier 4: Head (สมองกลสูงสุด)** | `"inherit"` *(เฉพาะแชทหลัก)* | แชทหลักของ Head | • วิเคราะห์ความต้องการของผู้ใช้, ตัดสินใจเลือกแนวทางสถาปัตยกรรม, ถามคำถามเมื่อความต้องการไม่ชัดเจน<br>• แตกงานใหญ่เป็นใบสั่งงานย่อย (Dispatch Brief) ส่งให้ Tier 1–3 (ขนานกันได้หากไฟล์ไม่ชนกัน)<br>• **ห้ามส่ง `Model: "inherit"` ให้ Subagent เด็ดขาด** (โดยเฉพาะเมื่อ Head คือ Argon, Sonnet หรือ Opus เพราะจะสูบโควตาหมดทันที) | สรุปกระชับส่งตรงถึงผู้ใช้ พร้อมลิงก์ไฟล์คลิกได้ |

### 🛡️ แผนสำรองเมื่อโควตาหมด & กฎ Sniper Mode (Quota Fallback & Succession Protocol)
1. **เมื่อโควตา `Pro` หมดหรือถูกถอดจากเมนูหลัก**:
   - เครื่องมือ `invoke_subagent` ยังมีพารามิเตอร์ `Model: "pro"` ค้างอยู่ใน API Schema แต่หากโควตาฝั่ง Pro หมด ให้ใช้ **`"flash_lite"` (สำหรับงานค้นหา)** และ **`"flash"` (สำหรับงานเขียนโค้ด/แก้บั๊กทุกประเภท)** เป็นกำลังหลัก 100% โดยให้ Head เป็นคนคิดแผนและชี้เลขบรรทัดให้ชัดเจน
2. **เมื่อโควตา `Argon (High)` หมด (Head Succession)**:
   - ให้สลับโมเดลหลักในช่องแชทเป็น **`Gemini Flash`** เพื่อทำหน้าที่รักษาการ Head แทนได้ทันที (เพราะมี `docs/CODEBASE_INDEX.md`, `docs/DATA_SCHEMA_INDEX.md` และกฎใน `GEMINI.md` คุมทิศทางไว้แล้ว)
3. **การใช้ `Claude Sonnet` และ `Claude Opus` (Sniper Mode เท่านั้น — ห้ามเปิดแชทยาวค้างไว้)**:
   - **ห้ามเด็ดขาด**: ห้ามใช้ Sonnet/Opus กวาดหาไฟล์, อ่าน Log, รันเทสต์, หรือสั่ง Subagent ด้วย `Model: "inherit"`
   - **บังคับ `/compact` ก่อนสลับมาใช้**: ก่อนเปลี่ยน Dropdown เป็น Sonnet หรือ Opus ต้องรัน `/compact` (หรือให้ `argon-scout` หาพิกัดไฟล์+บรรทัดเตรียมไว้ให้เสร็จก่อน)
   - **`Claude Sonnet` (Surgical Coder)**: สลับมาใช้เฉพาะจังหวะต้องการเกลา UI/UX ขั้นสูง หรือแก้ลอจิก React/TypeScript ที่ซับซ้อนใน 1–2 เทิร์นจบ แล้วสลับกลับเป็น Argon/Flash
   - **`Claude Opus` (Nuclear Troubleshooter)**: เก็บไว้เป็นไม้ตายสุดท้ายเฉพาะตอนติด Deadlock, ออกแบบ SQL Migration ข้ามระบบที่ซับซ้อนมาก หรือบั๊กที่ Argon/Flash แก้ไม่ตก ใช้เพียง 1 เทิร์นเพื่อผ่าตัดจุดตาย แล้วสลับกลับทันที!

==================================================
4. 🗄️ SCRATCHPAD OUTPUT REDIRECT (ซ่อน LOG ยาวไว้ในไฟล์ ไม่พ่นลงแชท)
==================================================
- **ห้ามรันคำสั่งที่พ่น stdout/stderr หลายร้อยบรรทัดลงในแชทโดยตรง**:
  - เช่น การรัน `npm test`, `git log`, หรือการค้นหาไฟล์ทั่วทั้งไดเรกทอรี
  - ให้ redirect output ลงไฟล์ชั่วคราวใน scratchpad เสมอ เช่น:
    `npm test > scratch/test.log 2>&1` หรือบันทึกผลการทดสอบเฉพาะส่วนสรุป Exit code / Failed tests
  - อ่านเฉพาะ 10-20 บรรทัดสุดท้าย (Tail) หรือสรุปผลว่า Passed กี่ตัว Failed กี่ตัว แทนการดูทั้งหมด

==================================================
5. 🐝 EPHEMERAL SUBAGENT SWARM & 4-PART DISPATCH PROTOCOL (ใบสั่งงานมาตรฐาน 4 ช่อง)
==================================================
- **การลงทะเบียนหน่วยรบย่อย (`define_subagent`)**:
  - หากในเซสชันยังไม่ได้สร้าง Subagent เฉพาะทาง สามารถใช้ `define_subagent` สร้าง `argon-scout` (Read-only, คู่กับ `flash_lite`), `argon-worker` (Write+Cmd, คู่กับ `flash`), และ `argon-specialist` (Full engineer, คู่กับ `pro`) หรือใช้ `research` / `self` โดยระบุ `Model` ให้ตรง Tier
- **โครงสร้างใบสั่งงานมาตรฐาน 4 ช่อง (4-Part Dispatch Order)** ที่ Argon ต้องส่งให้ Subagent ทุกครั้งเพื่อไม่ให้ Subagent เปลืองโทเคนไปกับการงมทางเอง:
  1. 🎯 **[1. OBJECTIVE]**: สั่งชัดเจน 1–2 ประโยคว่าต้องทำอะไรให้สำเร็จ
  2. 📍 **[2. TARGET COORDINATES]**: ระบุ Path ไฟล์และช่วงบรรทัด (`StartLine–EndLine`) ที่ Argon เช็คจาก `docs/CODEBASE_INDEX.md` หรือให้ `argon-scout` หามาให้ก่อนแล้ว
  3. 🛡️ **[3. GUARDRAILS]**: ย้ำกฎเหล็กที่เกี่ยวข้องกับงานนั้น (เช่น ห้ามอ่านไฟล์โดยไม่ระบุ `StartLine`/`EndLine` เกิน 80 บรรทัด, ห้ามใส่ Mock Data, ใช้ Token สีตาม `style.md`, รัน `node scripts/index_codebase.mjs` หลังแก้เสร็จ)
  4. 📦 **[4. RETURN DIGEST CONTRACT]**: สั่งห้ามเทโค้ดทั้งไฟล์กลับมา ให้ส่งกลับเฉพาะสรุปสั้นๆ ตามเพดานบรรทัดของแต่ละ Tier เท่านั้น

==================================================
6. 📑 CODEBASE INDEX & SYMBOL MAP (สารบัญตำแหน่งไฟล์และฟังก์ชัน)
==================================================
- อ้างอิงไฟล์ `docs/CODEBASE_INDEX.md` เป็นแผนที่นำทางหลักของโปรเจกต์
- **ข้อบังคับการบำรุงรักษา (Mandatory Update)**:
  - ทุกครั้งที่มีการสร้างไฟล์ใหม่, ลบไฟล์, หรือย้ายฟังก์ชันสำคัญ ให้รัน `node scripts/index_codebase.mjs` ทันที
  - ห้ามปล่อยให้สารบัญล้าสมัย เพราะจะทำให้การเฉือนดู (Targeted View) ผิดตำแหน่ง
