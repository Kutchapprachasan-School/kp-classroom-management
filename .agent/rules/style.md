---
name: Style
description: Pastel Anime Education Dashboard – Master UI/UX & Information Architecture Design System Rule for KP Classroom Management
trigger: always_on
---

# UI & UX MASTER DESIGN SYSTEM
# Pastel Anime Education Dashboard (KP Classroom Management)

ระบบบริหารจัดการโรงเรียน / Learning Platform & Classroom Management
สไตล์: Modern Educational SaaS ผสม Soft Pastel Anime
หลักการแกนกลาง: สะอาด อ่านง่าย ใช้งานจริงได้ เป็นมิตรกับนักเรียนและครู (Clean first, cute second)

==================================================
01. BRAND & VISUAL DIRECTION
==================================================

- Visual Direction: Pastel, Soft, Bright, Friendly, Anime-inspired, Educational Modern SaaS
- Mood & Tone: "โรงเรียนยุคใหม่ + แอปการเรียนรู้ + Anime Character เสริมความอบอุ่น"
- Clean first, cute second: ความน่ารักต้องไม่บดบังความชัดเจนของการทำงาน
- Visual Hierarchy ต้องชัดเจน ลด cognitive load ของครูและนักเรียน
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

ไม่ใช้หลายเฉดสับสนใน Token เดียว กำหนดค่ารหัสสีมาตรฐานที่แน่นอน:

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
- Text Muted: `#94A3B8` (Placeholder, เวลา, ข้อความที่ถูกปิดใช้งาน)

### Semantic Colors
- Success (ผ่าน / บันทึกแล้ว / มาเรียน):
  - Base: `#10B981` (Emerald 500)
  - Soft: `#ECFDF5` (Emerald 50)
  - Border: `#A7F3D0` (Emerald 200)
  - Text: `#065F46` (Emerald 800)
- Warning (รอดำเนินการ / สาย / แจ้งเตือน):
  - Base: `#F59E0B` (Amber 500)
  - Soft: `#FFFBEB` (Amber 50)
  - Border: `#FDE68A` (Amber 200)
  - Text: `#92400E` (Amber 800)
- Danger (ขาด / เลยกำหนด / ข้อผิดพลาด / ลบ):
  - Base: `#EF4444` (Red 500)
  - Soft: `#FEF2F2` (Red 50)
  - Border: `#FECACA` (Red 200)
  - Text: `#991B1B` (Red 800)
- Special / Advisory / Club (ลา / งานสภา / กิจกรรมพิเศษ):
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
1. Primary Button: พื้นหลัง `#3B82F6`, ตัวอักษรสีขาว, Radius 12px, มี hover/active state
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
06. INFORMATION ARCHITECTURE
==================================================

ทุกหน้าต้องตอบคำถาม 3 ข้อทันทีที่ผู้ใช้เปิดขึ้นมา:
1. ตอนนี้ฉันอยู่ที่ไหน? (Where am I?)
2. หน้านี้ใช้ทำอะไร? (What is this page for?)
3. ฉันควรกดอะไรเป็นอันดับแรก? (What is my primary action?)

กฎสำคัญ:
- แต่ละหน้าต้องมี **ONE clear primary task**
- ห้ามวาง Action ใหญ่ที่มีน้ำหนักสายตาเท่ากันหลายปุ่มในระดับสายตาเดียวกัน
- Primary Action: ต้องเด่นที่สุดทางสายตา (สีทึบ มีเงาเบาๆ) มักมีเพียง 1 จุดต่อ 1 ส่วนงาน
- Secondary Actions: ใช้ปุ่ม Outline หรือ Ghost เพื่อไม่แย่งความสนใจ
- Administrative / Advanced Actions: ซ่อนใน Dropdown, Action Menu (`...`), หรือ Secondary Panel
- Navigation Flow: ต้องไล่ตามลำดับ **Category → List → Detail → Action**

==================================================
07. STANDARD PAGE STRUCTURE
==================================================

โครงสร้างหน้ามาตรฐาน (เรียงลำดับจากบนลงล่าง):
1. **Page Header**: Icon ประจำหน้า + Title ชัดเจน + Subtitle สั้นๆ (1 บรรทัด) + Primary Action ด้านขวา
2. **Context / Filters**: ตัวเลือกปีการศึกษา, เทอม, ห้องเรียน, วันที่ หรือช่อง Search
3. **Summary Stats (เฉพาะเมื่อมีประโยชน์จริง)**: Stat cards ขนาดเล็ก 2-4 ใบ (เช่น มา/ขาด/สาย/ยอดรวม)
4. **Main Content**: ส่วนแสดงข้อมูลหลัก (Cards, List, หรือ Table)
5. **Secondary Information**: แท็บเสริม, สถิติย่อย หรือประวัติย้อนหลัง
6. **Quick Actions**: การส่งออกรายงาน หรือคำสั่งช่วยเหลือ

ข้อห้ามเด็ดขาด:
- **ห้ามใส่ข้อความอธิบายยืดยาวที่ส่วนบนของหน้า**
- คำอธิบายยาวให้ใช้:
  - Collapsible ("ดูรายละเอียดเพิ่มเติม")
  - Tooltip บน Icon ข้อมูล (ⓘ)
  - Modal แสดงวิธีใช้งานเมื่อต้องการดู

==================================================
08. DATA-HEAVY PAGES (TABLES & ROSTERS)
==================================================

สำหรับหน้าที่มีข้อมูลจำนวนมาก เช่น การเช็คชื่อ, การตรวจการบ้าน, ตารางคะแนน, ทะเบียนนักเรียน:

ลำดับความสำคัญของคอลัมน์:
1. **Identity**: รูปภาพ/Avatar + เลขประจำตัว + ชื่อ-นามสกุล
2. **Status**: Badge สถานะชัดเจน (พร้อมสีที่ถูกหลัก)
3. **Primary Action**: ปุ่ม Action สำคัญ (เช่น ปุ่มเช็คชื่อ, ปุ่มให้คะแนน)
4. **Metadata**: หมายเหตุ, เวลา, รายละเอียดรอง

กฎการแสดงผล:
- **Desktop**: ใช้ Table ได้, Header สีอ่อน (`bg-slate-50`), จัดระยะ Row spacing ไม่อึดอัด, มี Hover state
- **Mobile**:
  - เปลี่ยนแถวในตารางเป็น Card หรือ Stacked List อัตโนมัติ
  - Primary Action ต้องมองเห็นและกดได้ทันทีโดยไม่ต้องเลื่อนซ้ายขวา
  - รายละเอียดรองย้ายเข้าไปอยู่ใน Accordion / Expandable Detail
- **หลีกเลี่ยง Horizontal Scrolling สำหรับ Flow การทำงานหลัก**

==================================================
09. MOBILE-FIRST INTERACTION
==================================================

Mobile ไม่ใช่การย่อส่วน Desktop แต่คือการออกแบบประสบการณ์สัมผัสใหม่:

- **ห้ามบังคับผู้ใช้เลื่อนหน้าจอแนวนอน (No Horizontal Scroll)** เพื่อกดปุ่มสำคัญ
- แปลงตารางหลายคอลัมน์เป็น Stacked Cards
- Primary Action ต้องอยู่ในตำแหน่งที่นิ้วโป้งกดง่าย (Thumb-friendly zone)
- ใช้ Bottom Sheet / Drawer สำหรับชุดตัวกรอง (Filters)
- ใช้ Sticky Bottom Action Bar สำหรับขั้นตอนการทำงานที่ต้องยืนยัน (เช่น "บันทึกการเช็คชื่อ")
- สำหรับงานที่ทำซ้ำๆ (Repetitive tasks):
  - ปุ่มกดขนาดใหญ่ ไม่ใช้ปุ่มไอคอนจิ๋ว
  - Touch Target ขั้นต่ำ **44 x 44 px**
  - ตัวอย่างหน้าเช็คชื่อบนมือถือ:
    ```text
    ด.ช. กฤษณะ ศรีสมบูรณ์ (เลขที่ 1)
    [ มา ] [ สาย ] [ ขาด ] [ ลา ]
    ```
    กดเลือกสถานะได้ทันทีด้วยปุ่มใหญ่ แทนการเปิด Dropdown

==================================================
10. SCHOOL DOMAIN RULES
==================================================

ใช้ Semantic Visual Language เดียวกันทั้งระบบโรงเรียน:

### 10.1 Attendance (การเช็คชื่อ / เข้าแถว / คาบเรียน)
- Green (`#10B981`): **มา** (Present) - ได้เวลาเรียน 100%
- Yellow (`#F59E0B`): **สาย** (Late) - ได้เวลาเรียน 100% (นับสถิติสาย)
- Red (`#EF4444`): **ขาด** (Absent) / **โดดเรียน** (Truancy) - ไม่ได้เวลาเรียน 0%
- Purple (`#8B5CF6`): **ลา** (Leave - ป่วย/กิจ) / **กิจกรรม** (Activity) - มีหลักฐานรองรับ

### 10.2 Assignments & Submissions (การส่งงาน / การบ้าน)
- Green: **ส่งแล้ว / ตรวจแล้ว** (Submitted / Graded)
- Yellow: **รอตรวจ / ส่งช้า** (Pending / Late)
- Red: **ยังไม่ส่ง / เลยกำหนด** (Missing / Overdue)
- Blue: **มอบหมายแล้ว / กำลังทำ** (Assigned / In Progress)

### 10.3 Learning & Course Status (วิชาและแผนการเรียน)
- Blue: **Active / ภาคเรียนปัจจุบัน**
- Slate / Gray: **Draft / ยังไม่เปิดสอน**
- Green: **Completed / สำเร็จการศึกษา**

ข้อกำหนด: ห้ามสื่อสารสถานะด้วยสีเพียงอย่างเดียว ต้องมี Icon + ข้อความกำกับเสมอ

==================================================
11. CALENDAR & DATE INTERACTION
==================================================

- **วันที่ปัจจุบัน (Today)**: วงกลมเน้นสีฟ้า Primary (`#3B82F6`)
- **วันที่บันทึกครบถ้วน (Completed)**: จุดหรือตัวเลขเน้นสีเขียว
- **วันที่ยังไม่ได้บันทึก / ขาดส่ง (Missing)**: สัญลักษณ์สีแดงเตือน
- **วันหยุด / ปิดภาคเรียน (Holiday)**: สีเทาอ่อน (Muted)
- **วันที่ถูกเลือก (Selected Date)**: ขอบ Primary ล้อมรอบชัดเจน
- ปฏิทินต้องแสดงสถานะสรุปเบื้องต้นได้ทันทีโดยไม่ต้องคลิกเปิดดูทีละวัน
- การเลือกดูประวัติย้อนหลังต้องเข้าถึงได้รวดเร็วผ่าน Date Picker หรือปุ่มปฏิทินกะทัดรัด

==================================================
12. SETTINGS ARCHITECTURE
==================================================

หน้าการตั้งค่าต้องจัดกลุ่มตาม Domain เสมอ (ห้ามวาง Form ตั้งค่ายาวเหยียดปะปนกันบนหน้าแรก):

### หมวดหมู่หลัก 5 ด้าน:
1. **ข้อมูลพื้นฐาน (Foundation)**
   - ข้อมูลโรงเรียน
   - บัญชีผู้ใช้งาน / สิทธิ์
   - จัดการห้องเรียน
   - รายวิชาและกลุ่มสาระ
2. **การเรียนการสอน (Academics)**
   - ตารางสอน & คาบเรียน
   - แผนการสอน
   - การมอบหมายงาน / แบบฝึกหัด
   - การสอบและคลังข้อสอบ
   - แบบฟอร์ม & การประเมิน
3. **การจัดการนักเรียน (Student Affairs)**
   - ทะเบียนนักเรียน
   - การเช็คชื่อแถวเช้า / คาบเรียน
   - บันทึกพฤติกรรม & เยี่ยมบ้าน
   - ข้อมูลผู้ปกครอง
4. **ผลการเรียน & รายงาน (Evaluation & Reports)**
   - ปพ.5 / ตัดเกรด
   - รายงานสถิติ & กราฟ
   - สำรองข้อมูล (Backup & Restore)
5. **ระบบทั่วไป (System & Preferences)**
   - การแจ้งเตือน
   - ปรับแต่งหน้าตา (Theme & Banners)
   - ความปลอดภัย
   - ข้อมูลจัดเก็บในเครื่อง (Storage Quota)

การนำเสนอในหน้า Settings Hub:
- แต่ละหมวดหมู่แสดงเป็นการ์ด: `[Icon] + [Title] + [คำอธิบายสั้น 1 บรรทัด] + [ลูกศร ➔]`
- ฟอร์มการตั้งค่าแบบละเอียดต้องเปิดในหน้าย่อย (Sub-page) หรือ Slide-over Drawer / Modal
- ห้ามวางฟอร์มบันทึกขนาดยักษ์บนหน้ารวมการตั้งค่า

==================================================
13. ANIME ILLUSTRATION RULE
==================================================

ภาพ Anime Mascot / Student Illustrations เป็น **"Supporting Visuals"** ไม่ใช่เนื้อหาหลัก:

พื้นที่ที่อนุญาตให้ใช้:
- Hero Banner ประจำหน้า
- Empty State (เมื่อยังไม่มีข้อมูล)
- Sidebar Promo Card / กำลังใจ
- Welcome Section / Achievement Badge

ข้อห้ามเด็ดขาด:
- ❌ ห้ามวางภาพ Anime เป็นพื้นหลังตารางข้อมูล (Tables)
- ❌ ห้ามวางภาพ Anime หลังฟอร์มกรอกข้อมูล
- ❌ ห้ามวางภาพ Anime บดบังปุ่ม Action สำคัญ
- ❌ ห้ามใช้ตัวละครเป็นตัวสื่อสารข้อมูลหลักแทนตัวหนังสือ
- ภาพการ์ตูนต้องไม่ทำลาย Visual Hierarchy และความชัดเจนของระบบโรงเรียน

==================================================
14. ACCESSIBILITY & PERFORMANCE
==================================================

- อัตราส่วนความต่างสี (Contrast Ratio): ตัวหนังสือกับพื้นหลังต้องอ่านออกชัดเจน (WCAG AA)
- Touch Target: ทุกปุ่มบนจอมือถือต้องมีขนาดอย่างน้อย `44 x 44 px`
- Keyboard Navigation: รองรับ Tab / Enter สำหรับ Interactive Elements
- Skeleton Loading: เมื่อโหลดข้อมูลให้ใช้ Skeleton สีอ่อนที่มี Radius เท่ากับคอมโพเนนต์จริง แทน Spinner โดดๆ

==================================================
15. ANTI-PATTERNS (FORBIDDEN)
==================================================

- ❌ ไม่ใช้ Dark Theme ดำล้วน
- ❌ ไม่ใช้ Gradient ฉูดฉาดสไตล์เว็บบริษัทคริปโตหรือเกม
- ❌ ไม่ใช้มุมเหลี่ยมแข็งกระด้าง (`rounded-none`)
- ❌ ไม่ใช้คำอธิบายยาวเหยียดทับถมกันด้านบนสุดของหน้า
- ❌ ไม่ใช้ Table แนวนอนยักษ์บนหน้าจอมือถือ
- ❌ ไม่สุ่มใช้สีหลากหลายนอกเหนือจาก Design Tokens
- ❌ ไม่ใส่ภาพตัวละครจนรกสายตา

==================================================
16. IMPLEMENTATION RULES FOR AI ASSISTANT
==================================================

เมื่อสร้างหน้าใหม่หรือแก้ไขโค้ด UI:
1. **ตรวจ Hierarchy**: มี 1 Primary Action เด่นชัดเจนหรือไม่
2. **ตรวจ Spacing & Radius**: ใช้ Card Radius 18px, Padding 16-24px, Spacing 8px grid
3. **ตรวจ Icons**: ใช้ MingCute Icons (`@mingcute/react`) เป็นตัวเลือกแรก
4. **ตรวจ Mobile UX**: หน้านี้แสดงผลบนมือถือแล้วยังกดง่าย ไม่ล้นจอ และแปลง Table เป็น Card หรือไม่
5. **ตรวจคำอธิบาย**: หน้าเว็บกระชับ ไม่พร่ำเพรื่อ ไม่รก
6. **ภาษาไทย**: จัดคำอ่านง่าย ไม่ตัดคำหรือตกบรรทัดแปลกตา
