---
trigger: always_on
description: Zero-Token Multi-Agent File Conflict Guard & Lock Protocol to prevent concurrent agents from overwriting each other's files.
---

# Zero-Token Multi-Agent File Conflict Guard Rules (กฎป้องกัน Agent แก้ไฟล์ชนกันแบบประหยัดโทเคนสูงสุด)

เมื่อมีการเปิดใช้งานหลาย Conversation หรือหลาย Subagent พร้อมกันในโปรเจกต์เดียว AI Agent ทุกตัวต้องปฏิบัติตามกฎ **3 ชั้นป้องกัน (Zero-Token Conflict Radar & Lock Guard)** อย่างเคร่งครัด เพื่อไม่ให้โค้ดพังกลางทางและไม่ผลาญโทเคนไปกับการเปิดอ่านไฟล์ Log ขนาดใหญ่:

## 1. 🚫 ห้ามใช้ `view_file` เปิดอ่าน `transcript.jsonl` ของห้องอื่นโดยตรง
- **ข้อห้ามเด็ดขาด**: ห้ามใช้ `view_file` เปิดอ่านไฟล์ `.system_generated/logs/transcript.jsonl` หรือ `transcript_full.jsonl` ของ Conversation อื่นเพื่อเช็คสถานะงาน เพราะไฟล์มีขนาดหลาย MB และทำให้เสียโทเคนครั้งละ 3,000–10,000 โทเคนโดยไม่จำเป็น
- **วิธีที่ถูกต้อง (ใช้ไม่เกิน 30 โทเคน)**: ให้รันคำสั่งสคริปต์เรดาร์ตรวจจับไฟล์ชนกันแทนเสมอ:
  ```bash
  node scripts/check_agent_conflicts.mjs --self=<conversation-id> <file1> <file2> ...
  ```

## 2. 📡 เช็คเรดาร์และจองไฟล์ (Lock) ก่อนเริ่มแก้ไขไฟล์หลายจุด
1. **ก่อนเริ่มลงมือแก้โค้ด (Pre-Flight Check)**:
   - รัน `node scripts/check_agent_conflicts.mjs --self=<conversation-id> [รายชื่อไฟล์ที่จะแก้]`
   - สคริปต์จะสแกนเฉพาะท้ายไฟล์ของห้องที่มีการเคลื่อนไหวใน 10 นาทีล่าสุด และสรุปออกมาใน 1–3 บรรทัดว่ามีห้องไหนกำลัง `🟢 RUNNING` หรือแก้ไฟล์อะไรอยู่บ้าง พร้อมบอกทันทีว่า `✅ SAFE TO EDIT` หรือ `⛔ CONFLICT`
2. **การจองขอบเขตไฟล์ล่วงหน้า (Explicit Scope Lock)**:
   - หากได้รับมอบหมายงานที่มีขอบเขตชัดเจน (เช่น ฝั่งครู vs ฝั่งนักเรียน) สามารถประกาศจองไฟล์ล่วงหน้าไว้ใน `.agent/active_locks.json` (หมดอายุอัตโนมัติใน 10 นาที) ด้วยคำสั่ง:
     ```bash
     node scripts/check_agent_conflicts.mjs --lock <conversation-id> src/views/TeacherOverviewView.tsx src/views/AssignmentManagementView.tsx
     ```
   - เมื่อทำงานเสร็จสมบูรณ์แล้ว สามารถปลดล็อกได้ด้วย:
     ```bash
     node scripts/check_agent_conflicts.mjs --unlock <conversation-id>
     ```

## 3. 🛡️ ระบบเบรกอัตโนมัติระดับ Engine (`PreToolUse` Hook — ใช้ 0 โทเคน)
- โปรเจกต์นี้ติดตั้ง **Lifecycle Hook (`.agents/hooks.json` และ `.agent/hooks.json`)** ซึ่งดักหน้าเครื่องมือ `replace_file_content`, `write_to_file`, และ `multi_replace_file_content` ทุกครั้งก่อนเขียนลงดิสก์โดยไม่เสียโทเคนของ AI
- หาก Hook ตอบกลับเป็น `⛔ [Multi-Agent Conflict Guard] ไฟล์ "..." เพิ่งถูกแก้ไขโดย Conversation อื่น`:
  1. **ห้ามพยายามฝืนเขียนทับซ้ำทันที**
  2. ให้ข้ามไปทำไฟล์อื่นที่ไม่ชนกันก่อน หรือแจ้งผู้ใช้สั้นๆ ว่าไฟล์ดังกล่าวกำลังถูกแก้ไขโดยอีก Conversation หนึ่ง เพื่อรอให้ห้องนั้นทำงานเสร็จก่อน
