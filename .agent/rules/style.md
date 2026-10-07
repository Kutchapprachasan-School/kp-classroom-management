---
name: Style
description: Pastel Anime Education Dashboard – Master UI/UX & Visual Architecture Design System Rule for KP Classroom Management
trigger: always_on
---

# UI & UX MASTER DESIGN SYSTEM
# Pastel Anime Education Dashboard (KP Classroom Management)

ระบบบริหารจัดการโรงเรียน / Learning Platform & Classroom Management
สไตล์: Modern Educational SaaS ผสม Soft Pastel Anime
หลักการแกนกลาง: สะอาด อ่านง่าย ใช้งานจริงได้ และลด Cognitive Load ของผู้ใช้งาน (Clean first, cute second)

==================================================
01. BRAND & VISUAL DIRECTION
==================================================

- Visual Direction: Pastel, Soft, Bright, Friendly, Anime-inspired, Educational Modern SaaS
- Mood & Tone: "โรงเรียนยุคใหม่ + แอปการเรียนรู้ + Anime Character เสริมความอบอุ่น"
- Clean first, cute second: ความน่ารักต้องไม่บดบังความชัดเจนของการทำงาน
- Visual Hierarchy ต้องสะท้อนความสำคัญของงาน (Importance) ไม่ใช่ผูกกับสถานะทางธุรกิจ
- รองรับภาษาไทยเป็นหลัก (Thai-First)

หลีกเลี่ยง (Forbidden):
- Dark UI / สีทึบดุดัน
- Neon จัดจ้าน / Gradient รุนแรง
- Glassmorphism หรือ Blur ที่หนักเกินไป
- Shadow หนาและดำ
- เส้นตารางทึบ / Border หนา
- สไตล์ Gaming Dashboard ที่ดูรกตา

==================================================
02. COLOR TOKENS (EXACT TOKENS)
==================================================

ไม่ใช้หลายเฉดสับสนใน Token เดียว กำหนดค่ารหัสสีมาตรฐานที่แน่นอนสำหรับ UI Surface, Text และ Semantic Elements:

### Primary (Action & Active State)
- Primary: `#3B82F6` (Blue 500)
- Primary Hover: `#2563EB` (Blue 600)
- Primary Soft: `#EFF6FF` (Blue 50)
- Primary Border: `#BFDBFE` (Blue 200)

### Background & Surface
- Background Canvas: `#F7FAFF` (หรือ `#F2F7FC`)
- Surface / Card: `#FFFFFF`
- Card Border: `#E6EEF7` (1px solid)

### Neutral & Text
- Text Primary: `#163A66` (หัวข้อ, ข้อมูลสำคัญ, ตัวเลขสรุป)
- Text Secondary: `#6B7C93` (คำอธิบายรอง, Header ตาราง)
- Text Muted: `#94A3B8` (Placeholder, เวลา, รายการที่เสร็จสิ้น/ความสำคัญรอง)

### Semantic & Status Tokens
(ใช้สำหรับสื่อสารประเภทของข้อความหรือฟีดแบ็ก โดยการตีความความหมายทางธุรกิจของแต่ละโมดูลจะกำหนดในระดับหน้างาน)
- Success:
  - Base: `#10B981` (Emerald 500)
  - Soft: `#ECFDF5` (Emerald 50)
  - Border: `#A7F3D0` (Emerald 200)
  - Text: `#065F46` (Emerald 800)
- Warning:
  - Base: `#F59E0B` (Amber 500)
  - Soft: `#FFFBEB` (Amber 50)
  - Border: `#FDE68A` (Amber 200)
  - Text: `#92400E` (Amber 800)
- Danger:
  - Base: `#EF4444` (Red 500)
  - Soft: `#FEF2F2` (Red 50)
  - Border: `#FECACA` (Red 200)
  - Text: `#991B1B` (Red 800)
- Accent / Special:
  - Base: `#8B5CF6` (Purple 500)
  - Soft: `#F5F3FF` (Purple 50)
  - Border: `#DDD6FE` (Purple 200)
  - Text: `#5B21B6` (Purple 800)

กฎการใช้สี:
- ใช้ 1 สีหลัก + ไม่เกิน 2-3 สี Accent ต่อหนึ่งหน้าจอ
- ห้ามใช้สีอย่างเดียวในการสื่อความหมาย (ต้องมี Icon หรือ Text Label กำกับเสมอ)

==================================================
03. TYPOGRAPHY (THAI-FIRST)
==================================================

ฟอนต์หลัก: Prompt, Noto Sans Thai, LINE Seed Sans Thai, Anuphan

ขนาดและความหนา:
- Page Title: 24–32px / Bold (700)
- Section Title: 18–22px / SemiBold (600)
- Card Title: 15–18px / SemiBold (600)
- Body: 14–16px / Regular (400) หรือ Medium (500)
- Caption / Helper: 12–14px / Regular (400)
- Badges / Tag: 10–12px / SemiBold (600)

หัวข้อใช้ตัวหนา เนื้อหาต้องอ่านสบายตา อย่าใส่ Font Weight หนักทุกข้อความ

==================================================
04. SPACING, RADIUS & SHADOW
==================================================

### 8px Spacing Grid
`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`
- Main Content Padding: `24-32px` (Desktop) / `16px` (Mobile)
- Section Gap: `24px`
- Card Gap: `16px`
- Card Padding: `16-24px`

### Border Radius
- Small items (Tags, Badges, Pills): `8-10px` หรือ `rounded-full`
- Button & Form Input: `10-14px` (Default: `12px`)
- Card & Section Container: `16-20px` (Default: `18px`)
- Hero Banner & Modal Dialog: `20-24px`

### Card Shadow
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E6EEF7;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(40, 90, 140, 0.06);
}
```
ห้ามใช้เงาสีดำทึบหรือเบลอหนา

==================================================
05. COMPONENTS (BUTTONS, INPUTS, ICONS)
==================================================

### Button Hierarchy
1. Primary Button: พื้นหลัง `#3B82F6`, ตัวอักษรสีขาว, Radius 12px, เด่นชัดที่สุด
2. Secondary / Outline Button: พื้นหลังขาว, Border 1px solid `#E2E8F0`, ตัวหนังสือ `#163A66`
3. Ghost Button: โปร่งใส, เปลี่ยนสีเมื่อ Hover
4. Destructive Button: สีแดงอ่อน / Text สีแดง ป้องกันการเผลอกดลบ

### Icon System
- Library หลัก: **MingCute Icons** (`@mingcute/react`)
  - Subpath import: `import Home1Regular from '@mingcute/react/core-regular/home-1'`
  - หรือ named import จาก `@mingcute/react/core-regular` หรือ `@mingcute/react/core-filled`
- Library สำรอง: `lucide-react` (เฉพาะกรณีไอคอนเฉพาะทางที่ MingCute ไม่มี)
- สไตล์: มนกลม นุ่มนวล ไม่แข็งกระด้าง สอดคล้องกับขนาดตัวหนังสือ

==================================================
06. LAYOUT & INFORMATION HIERARCHY
==================================================

หลักการสำคัญ:
> **"Visual hierarchy should reflect importance, not business status."**
(ลำดับความสำคัญทางสายตาต้องสะท้อนถึงสิ่งสำคัญที่ต้องทำ ไม่ใช่สีสถานะทางธุรกิจ)

ทุกหน้าต้องตอบคำถาม 3 ข้อทันที:
1. ตอนนี้ฉันอยู่ที่ไหน? (Where am I?)
2. หน้านี้ใช้ทำอะไร? (What is this page for?)
3. ฉันควรกดอะไรเป็นอันดับแรก? (What is my primary action?)

กฎโครงสร้าง:
- แต่ละหน้าต้องมี **ONE clear primary task**
- Navigation Flow: **Category → List → Detail → Action**
- โครงสร้างหน้ามาตรฐาน (บนลงล่าง):
  1. **Page Header**: Icon ประจำหน้า + Title + Subtitle สั้น 1 บรรทัด + Primary Action ขวา
  2. **Context / Filters**: ตัวเลือกขอบเขตข้อมูล หรือช่อง Search
  3. **Summary Stats (เมื่อมีประโยชน์จริง)**: Stat cards กะทัดรัด 2-4 ใบ
  4. **Main Content**: ข้อมูลหลัก
  5. **Secondary Information**: แท็บเสริม / ประวัติย้อนหลัง
  6. **Quick Actions**: การส่งออก / เครื่องมือเสริม
- **ห้ามใส่ข้อความอธิบายยืดยาวที่ส่วนบนของหน้า**: ให้ใช้ Collapsible ("ดูรายละเอียดเพิ่มเติม"), Tooltip (ⓘ) หรือ Modal วิธีใช้แทน

==================================================
07. UX VISUAL STATE RULES
==================================================

ใช้ Visual Pattern ที่เป็นกลางกับทุกโมดูล (To-do, งานตรวจ, แผนการสอน, ประเมิน, ตั้งค่า, เอกสาร, Workflow ต่างๆ):

### 1. Incomplete / Pending (สิ่งที่ต้องทำ / ยังรอดำเนินการ)
งานหรือรายการที่ยังต้องดำเนินการต้องมี **Visual Priority สูงกว่า** รายการที่ยังไม่เสร็จควรถูกวางไว้ก่อน และมี Contrast ที่ชัดเจน

แนวทาง:
- Higher visual emphasis (น้ำหนักสายตาเด่น)
- Stronger typography (ตัวอักษรชัดเจน คมชัด)
- Stronger CTA (ปุ่ม Action หรือ Checkbox ชัดเจนมองเห็นทันที)
- Optional Badge แสดงจำนวนหรือกำหนดเวลา
- หลีกเลี่ยงการทำรายการ Pending ให้ดูเหมือน Disabled

### 2. Completed (เสร็จสิ้น / บันทึกแล้ว)
รายการที่ทำเสร็จแล้วควร **ลด Visual Priority ลง** แต่ยังต้องอ่านข้อมูลและตรวจสอบได้ตามปกติ

แนวทาง:
- Lower visual emphasis (ลดความเด่นลง)
- Text สีอ่อนลงหรือปรับเป็น Text Muted (`#94A3B8`)
- Metadata จางลง
- Optional Check icon (`✓`)
- Optional Success Soft accent (`#ECFDF5`)
- Optional Strikethrough (ขีดฆ่าเฉพาะกรณีที่เป็นเช็คลิสต์ที่เหมาะสม)
- ลดขนาด visual emphasis โดยไม่ทำให้รายการหายไป

ตัวอย่าง Visual Pattern:
```text
[ยังไม่เสร็จ]
[ ] ตรวจแบบฝึกหัดบทที่ 3 (12 รายการ) ──── [ตรวจงาน] (ปุ่มเด่นชัดเจน)

[เสร็จแล้ว]
[✓] ตรวจแบบฝึกหัดบทที่ 2 (ครบแล้ว) ────── สีข้อความอ่อนลง / ดูรายละเอียด
```

==================================================
08. DATA & LIST PRESENTATION
==================================================

สำหรับหน้าที่มีข้อมูลจำนวนมาก เช่น รายชื่อ, ตารางคะแนน, ประวัติ หรือ Roster:

ลำดับความสำคัญของข้อมูลในแถว/การ์ด:
1. **Identity**: รูปภาพ/Avatar + รหัส/เลขประจำตัว + ชื่อหัวข้อ
2. **Status / Priority**: Badge สถานะที่ชัดเจน
3. **Primary Action**: ปุ่ม Action สำคัญที่สุด
4. **Metadata**: หมายเหตุ, เวลา, รายละเอียดรอง

กฎการแสดงผล:
- **Desktop**: ใช้ Table หรือ Multi-column Card ได้, Header สีอ่อน (`bg-slate-50`), จัด Row spacing ไม่อึดอัด, มี Hover state
- **Mobile**: แปลงตารางเป็น Stacked Cards อัตโนมัติ ป้องกันการเลื่อนแนวนอน
- **หลีกเลี่ยง Horizontal Scrolling สำหรับ Flow การทำงานหลัก**

==================================================
09. MOBILE-FIRST INTERACTION
==================================================

Mobile คือการออกแบบประสบการณ์สัมผัสใหม่:
- **ห้ามบังคับผู้ใช้เลื่อนหน้าจอแนวนอน (No Horizontal Scroll)** เพื่อกดปุ่มสำคัญ
- แปลงตารางเป็น Stacked Cards
- Primary Action อยู่ในตำแหน่งที่นิ้วโป้งกดง่าย (Thumb-friendly zone)
- ใช้ Bottom Sheet / Drawer สำหรับชุดตัวกรอง (Filters)
- ใช้ Sticky Bottom Action Bar สำหรับขั้นตอนการทำงานที่ต้องยืนยัน
- สำหรับงานที่ทำซ้ำๆ (Repetitive tasks):
  - ปุ่มกดขนาดใหญ่ ไม่ใช้ปุ่มไอคอนจิ๋ว
  - Touch Target ขั้นต่ำ **44 x 44 px**

==================================================
10. FORMS & INTERACTION
==================================================

- Input Fields: Border 1px solid `#E2E8F0`, Radius 12px, Focus ring สีฟ้า Primary
- Labels: ชัดเจน อยู่เหนือช่องกรอกข้อมูล ไม่พึ่งพา Placeholder เพียงอย่างเดียว
- Error States: กรอบสีแดงอ่อน (`border-red-300`) พร้อมข้อความ Helper ใต้ช่องกรอก
- Progressive Disclosure: ฟอร์มที่มีความซับซ้อนให้แบ่งเป็นขั้นตอน (Multi-step) หรือเปิดใน Drawer/Modal แทนการวางฟอร์มยาวเหยียดบนหน้าเดียว

==================================================
11. SETTINGS UI ARCHITECTURE
==================================================

หน้าการตั้งค่าต้องจัดกลุ่มตาม Domain เสมอ:
- นำเสนอเป็นชุดการ์ดหมวดหมู่: `[Icon] + [Title] + [คำอธิบายสั้น 1 บรรทัด] + [ลูกศร ➔]`
- ฟอร์มการตั้งค่าแบบละเอียดต้องเปิดในหน้าย่อย (Sub-page), Slide-over Drawer หรือ Modal
- **ห้ามวางฟอร์มบันทึกขนาดยักษ์บนหน้ารวมการตั้งค่า**

==================================================
12. ANIME ILLUSTRATION RULE
==================================================

ภาพ Anime Mascot / Student Illustrations เป็น **"Supporting Visuals"** ไม่ใช่เนื้อหาหลัก:

พื้นที่ที่อนุญาตให้ใช้:
- Hero Banner ประจำหน้า
- Empty State (เมื่อยังไม่มีข้อมูล)
- Sidebar Promo Card / ข้อความสร้างกำลังใจ
- Welcome Section / Achievement Badge

ข้อห้ามเด็ดขาด:
- ❌ ห้ามวางภาพ Anime เป็นพื้นหลังตารางข้อมูล (Tables)
- ❌ ห้ามวางภาพ Anime หลังฟอร์มกรอกข้อมูล
- ❌ ห้ามวางภาพ Anime บดบังปุ่ม Action สำคัญ
- ❌ ห้ามใช้ตัวละครเป็นตัวสื่อสารข้อมูลหลักแทนตัวหนังสือ
- ภาพการ์ตูนต้องไม่ทำลาย Visual Hierarchy และความชัดเจนของระบบ

==================================================
13. ACCESSIBILITY & PERFORMANCE
==================================================

- Contrast Ratio: ตัวหนังสือกับพื้นหลังต้องอ่านออกชัดเจน (WCAG AA)
- Touch Target: ทุกปุ่มบนจอมือถือต้องมีขนาดอย่างน้อย `44 x 44 px`
- Keyboard Navigation: รองรับ Tab / Enter สำหรับ Interactive Elements
- Skeleton Loading: เมื่อโหลดข้อมูลให้ใช้ Skeleton สีอ่อนที่มี Radius เท่ากับคอมโพเนนต์จริง แทน Spinner โดดๆ

==================================================
14. ANTI-PATTERNS (FORBIDDEN)
==================================================

- ❌ ไม่ใช้ Dark Theme ดำล้วน
- ❌ ไม่ใช้ Gradient ฉูดฉาดสไตล์เว็บบริษัทคริปโตหรือเกม
- ❌ ไม่ใช้มุมเหลี่ยมแข็งกระด้าง (`rounded-none`)
- ❌ ไม่ใช้คำอธิบายยาวเหยียดทับถมกันด้านบนสุดของหน้า
- ❌ ไม่ใช้ Table แนวนอนยักษ์บนหน้าจอมือถือ
- ❌ ไม่สุ่มใช้สีหลากหลายนอกเหนือจาก Design Tokens
- ❌ ไม่ใส่ภาพตัวละครจนรกสายตา

==================================================
15. IMPLEMENTATION RULES FOR AI ASSISTANT
==================================================

เมื่อสร้างหน้าใหม่หรือแก้ไขโค้ด UI:
1. **ตรวจ Hierarchy**: มี 1 Primary Action เด่นชัดเจน และ Visual Priority สะท้อนความสำคัญของงาน (Pending เด่นกว่า Completed) หรือไม่
2. **ตรวจ Spacing & Radius**: ใช้ Card Radius 18px, Padding 16-24px, Spacing 8px grid
3. **ตรวจ Icons**: ใช้ MingCute Icons (`@mingcute/react`) เป็นตัวเลือกแรก
4. **ตรวจ Mobile UX**: หน้านี้แสดงผลบนมือถือแล้วยังกดง่าย ไม่ล้นจอ และแปลง Table เป็น Card หรือไม่
5. **ตรวจคำอธิบาย**: หน้าเว็บกระชับ ไม่พร่ำเพรื่อ ไม่รก
6. **ภาษาไทย**: จัดคำอ่านง่าย ไม่ตัดคำหรือตกบรรทัดแปลกตา
