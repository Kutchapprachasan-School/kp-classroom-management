---
name: Style
description: Pastel Anime Education Dashboard – Clean, Friendly, Modern School SaaS UI Design Rule
trigger: always_on
---

# UI DESIGN RULE
# Pastel Anime Education Dashboard

ออกแบบ UI สำหรับระบบบริหารจัดการโรงเรียน / Learning Platform
โดยใช้สไตล์ Modern Educational SaaS ผสม Pastel Anime
เน้นความสะอาด อ่านง่าย ใช้งานจริงได้ และเป็นมิตรกับนักเรียน/ครู

==================================================
1. DESIGN PRINCIPLE
==================================================

- Clean first, cute second
- UI ต้องดูทันสมัยและเป็นระบบ ไม่เหมือนเกมจนเกินไป
- ใช้ Visual Hierarchy ที่ชัดเจน
- ลดความหนาแน่นของข้อมูลด้วย Card, Section และ Spacing
- ทุก Action สำคัญต้องมองเห็นและเข้าใจได้ทันที
- ใช้ Icon + Label เพื่อช่วยให้ผู้ใช้เข้าใจ Function
- ใช้สีเพื่อสื่อความหมาย ไม่ใช่ใช้ตกแต่งอย่างเดียว
- Interface ต้อง Friendly, Approachable และ Professional
- รองรับการใช้งานภาษาไทยเป็นหลัก

==================================================
2. OVERALL VISUAL STYLE
==================================================

Visual direction:
- Pastel
- Soft
- Bright
- Friendly
- Anime-inspired
- Educational
- Modern SaaS
- Minimal but expressive

UI ต้องให้ความรู้สึก:
"โรงเรียนยุคใหม่ + แอปการเรียนรู้ + Anime Character"

หลีกเลี่ยง:
- Dark UI
- Neon มากเกินไป
- Gradient จัดจ้าน
- Glassmorphism หนักเกินไป
- Shadow หนัก
- Border หนา
- UI ที่ดูเหมือน Gaming Dashboard
- สีมากเกินไปในหน้าเดียว

==================================================
3. COLOR SYSTEM
==================================================

Primary:
- Soft Blue / Sky Blue
- ใช้เป็นสีหลักของ Navigation, Button, Active State

Secondary:
- Mint Green
- Light Cyan
- Soft Purple
- Soft Yellow
- Soft Orange

Background:
- #F7FAFF
- #F2F7FC
- White

Text:
- Primary: #163A66
- Secondary: #6B7C93
- Muted: #94A3B8

Semantic Colors:
- Success = Mint / Green
- Warning = Yellow / Orange
- Error = Soft Red
- Info = Blue

ใช้สี Accent ประมาณ 1 สีหลัก + 2-3 สีรองต่อหน้า
อย่าใช้ทุกสีพร้อมกัน

==================================================
4. TYPOGRAPHY
==================================================

ใช้ฟอนต์ภาษาไทยที่อ่านง่าย เช่น:
- Noto Sans Thai
- IBM Plex Sans Thai
- Anuphan
- LINE Seed Sans Thai

Typography:
- Page Title: 24-32px / Bold
- Section Title: 18-22px / 600-700
- Card Title: 15-18px / 600
- Body: 14-16px
- Caption: 12-14px

หัวข้อใช้ตัวหนา
เนื้อหาต้องอ่านง่าย
อย่าใช้ Font Weight หนักทุกข้อความ

==================================================
5. LAYOUT
==================================================

Desktop Layout:
- Left Sidebar
- Top Header
- Main Content
- Optional Right Sidebar / Information Panel

โครงสร้างหลัก:

┌─────────────────────────────────────────────┐
│ Sidebar │ Header                           │
│         ├───────────────────────────────────┤
│         │ Main Content                      │
│         │                                   │
│         │ Cards / Tables / Dashboard        │
└─────────────────────────────────────────────┘

Sidebar:
- Width ประมาณ 240-280px
- Fixed
- Background สีขาวหรือฟ้าอ่อน
- Menu เป็น Icon + Label
- Active menu ใช้ Blue Background
- Border Radius 12-16px
- มี Badge สำหรับ Notification

Header:
- สูงประมาณ 64-80px
- แสดง Avatar + ชื่อ
- วัน/ภาคเรียน
- Search
- Notification
- User Menu

==================================================
6. CARD SYSTEM
==================================================

ใช้ Card เป็น Component หลัก

Card:
- Background: White
- Border: 1px solid #E6EEF7
- Radius: 16-20px
- Shadow: Soft / subtle
- Padding: 16-24px

ตัวอย่าง:

.card {
  background: white;
  border: 1px solid #E6EEF7;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(40, 90, 140, 0.06);
}

ไม่ใช้ Shadow หนาและดำ

==================================================
7. BUTTON
==================================================

Primary Button:
- Blue
- Rounded 12-14px
- Medium/Bold text
- มี Icon เมื่อเหมาะสม

Secondary:
- White / Light Blue
- มี Border

Success:
- Mint Green

Warning:
- Orange

Danger:
- Soft Red

ปุ่มต้องมี State:
- hover
- active
- disabled
- loading

หลีกเลี่ยงปุ่มสี่เหลี่ยมแข็ง ๆ

==================================================
8. ICON SYSTEM
==================================================

ใช้ Icon เพื่อช่วยให้ผู้ใช้เข้าใจ Function

แนะนำ:
- Lucide
- Phosphor
- Tabler Icons

Style:
- Rounded
- Simple
- Consistent stroke width

Icon ต้องมีขนาดและน้ำหนักใกล้เคียงกันทั้งระบบ

ตัวอย่าง Mapping:

Dashboard = Home
Schedule = Calendar
Assignment = Clipboard
Message = MessageSquare
Student = Users
Teacher Group = UserRoundCheck
Class Group = School / UsersRound
Report = BarChart3
Settings = Settings
File = Folder
Notification = Bell

==================================================
9. IMPORTANT:
   GROUP / CATEGORY VISUALIZATION
==================================================

ในหน้าที่มีหลายประเภทข้อมูล
ต้องแยก Category ด้วย Icon + Color + Label

ตัวอย่าง:

กลุ่มครูที่ปรึกษา
Icon = UserRoundCheck
Color = Blue / Green

กลุ่มห้องเรียน
Icon = School / Users
Color = Purple / Cyan

อย่าใช้ Icon เดียวกันกับทุกประเภท Group

ตัวอย่าง:

[ 👥 ] กลุ่มครูที่ปรึกษา
     สื่อสารกับนักเรียนในที่ปรึกษา

[ 🏫 ] กลุ่มห้องเรียน
     พูดคุยกับนักเรียนในแต่ละห้อง

ผู้ใช้ต้องสามารถเข้าใจประเภทของข้อมูลได้
โดยไม่จำเป็นต้องอ่านรายละเอียดทั้งหมด

==================================================
10. AVATAR & CHARACTER
==================================================

ใช้ Anime Character / Student Mascot เป็น Visual Accent

ใช้ใน:
- Header
- Empty State
- Welcome Banner
- Sidebar Illustration
- Achievement
- User Profile

Character ต้องเป็น:
- Friendly
- School Uniform
- Soft Anime Style
- ไม่ควรครอบพื้นที่ UI มากเกินไป

Character เป็น "Supporting Visual"
ไม่ใช่จุดสนใจมากกว่า Content

==================================================
11. HERO / BANNER
==================================================

ใช้ Illustration Banner ในหน้า Dashboard สำคัญ

ลักษณะ:
- โรงเรียน
- ท้องฟ้า
- ต้นไม้
- นักเรียน Anime
- Soft Pastel

Overlay:
- Title
- Description
- CTA

Banner มี Radius 20-24px

ไม่ควรใส่ข้อความเยอะเกินไป

==================================================
12. INFORMATION HIERARCHY
==================================================

ทุก Section ต้องมี:

1. Icon
2. Title
3. Description / Context
4. Main Content
5. Action

ตัวอย่าง:

[📅]
การตั้งค่าปีการศึกษา
กำหนดวันเปิด-ปิดภาคเรียน

                    [+ สร้างปีการศึกษา]

------------------------------------------------

ใช้ Heading และ Subheading
อย่าวางข้อมูลทุกอย่างในระดับความสำคัญเท่ากัน

==================================================
13. STATUS SYSTEM
==================================================

ใช้ Badge สำหรับสถานะ

ตัวอย่าง:

ACTIVE
✓ Active

SUCCESS
✓ เปิดใช้งาน

PENDING
◷ รอตรวจ

WARNING
! ต้องดำเนินการ

ERROR
× ผิดพลาด

Badge:
- Pill
- Small
- Soft Background
- Text สีเข้ม

==================================================
14. TABLE
==================================================

Table ต้องอ่านง่าย
ใช้ Header สีอ่อน
Row spacing สูงพอ
ใช้ Badge ใน Column ที่เป็น Status
ใช้ Icon ใน Action

Avoid:
- เส้น Grid เยอะ
- Border หนาทุก Cell

แนะนำ:
- Minimal border
- Hover row
- Alternate background แบบอ่อนมาก

==================================================
15. DASHBOARD CARDS
==================================================

สำหรับ Summary:
ใช้ Card ขนาดเล็ก

ตัวอย่าง:

[📚]
วิชาที่เรียน
6 วิชา

[✅]
งานที่ต้องทำ
3 งาน

[🏆]
คะแนนรวม
88.5%

แต่ละ Card ควรมี:
Icon + Label + Value + Optional Trend

==================================================
16. SPACING
==================================================

ใช้ระบบ 8px spacing

4
8
12
16
24
32
40
48

Main content:
- Padding 24-32px
- Section gap 24px
- Card gap 16px

ไม่ให้ UI แน่นเกินไป

==================================================
17. BORDER RADIUS
==================================================

Small:
8-10px

Button:
10-14px

Input:
10-14px

Card:
16-20px

Hero:
20-24px

ใช้ Rounded Corner อย่างสม่ำเสมอทั้งระบบ

==================================================
18. INPUT / SEARCH
==================================================

Input:
- White background
- Soft border
- Radius 12px
- Icon ด้านซ้าย
- Focus state เป็น Blue

Search bar:
[ 🔍 ค้นหากลุ่ม ห้องเรียน หรือชื่อ... ]

Placeholder ต้องเป็นสีเทาอ่อน

==================================================
19. RESPONSIVE
==================================================

Desktop:
Sidebar เต็มรูปแบบ

Tablet:
Sidebar ย่อเหลือ Icon

Mobile:
ใช้ Bottom Navigation หรือ Drawer

Card:
Desktop = Multi-column
Tablet = 2 columns
Mobile = 1 column

Table บนมือถือให้เปลี่ยนเป็น Card/List
ไม่บังคับผู้ใช้เลื่อนตารางขนาดใหญ่ถ้าไม่จำเป็น

==================================================
20. UX RULE
==================================================

ทุกหน้าให้ตอบคำถาม 3 ข้อ:

1. ตอนนี้ฉันอยู่ที่ไหน?
2. ฉันกำลังดูอะไร?
3. ฉันสามารถทำอะไรต่อ?

Primary Action ต้องเด่นที่สุด
Secondary Action ต้องไม่แย่งความสนใจ

ถ้าเป็นหน้าที่มีข้อมูลจำนวนมาก
ต้องมี:
- Search
- Filter
- Category
- Status
- Clear hierarchy

==================================================
21. EMPTY STATE
==================================================

เมื่อไม่มีข้อมูล
อย่าแสดงแค่ "ไม่พบข้อมูล"

ให้ใช้:

[Illustration / Icon]

ยังไม่มีข้อมูล
ลองสร้างรายการใหม่ หรือเปลี่ยนตัวกรอง

[ + สร้างข้อมูล ]

==================================================
22. LOADING STATE
==================================================

ใช้ Skeleton Loading
แทน Spinner อย่างเดียว

Skeleton ต้องใช้สีอ่อน
และมี Radius เหมือน Component จริง

==================================================
23. ANIMATION
==================================================

Animation ต้อง subtle

แนะนำ:
- 150-250ms
- ease-out
- fade
- slight slide
- soft scale

ห้ามใช้ Animation รุนแรง
ห้ามกระพริบ
ห้ามเด้งมากเกินไป

==================================================
24. ACCESSIBILITY
==================================================

- Contrast ต้องอ่านได้ชัด
- Icon สำคัญต้องมี Tooltip / Label
- ห้ามใช้สีอย่างเดียวเพื่อบอกสถานะ
- Button ต้องมี Keyboard Focus
- Font ต้องไม่เล็กเกินไป
- Touch target อย่างน้อยประมาณ 44px

==================================================
25. COMPONENT ARCHITECTURE
==================================================

สร้าง UI แบบ Reusable Components

เช่น:

Layout
├── Sidebar
├── Header
└── MainContent

Components
├── Card
├── Button
├── Badge
├── Avatar
├── SearchInput
├── Tabs
├── StatCard
├── GroupCard
├── Table
├── EmptyState
├── Modal
└── Toast

ห้ามสร้าง Style ซ้ำโดยไม่จำเป็น
ควรใช้ Design Tokens / CSS Variables

==================================================
26. DESIGN TOKENS
==================================================

สร้าง Token กลาง เช่น:

--color-primary
--color-primary-soft
--color-success
--color-warning
--color-danger
--color-background
--color-surface
--color-text
--color-text-secondary

--radius-sm
--radius-md
--radius-lg
--radius-xl

--shadow-card
--shadow-floating

--space-1
--space-2
--space-3
--space-4
--space-6
--space-8

ทุกหน้าใช้ Token เหล่านี้
เพื่อให้ Design Consistency

==================================================
27. FINAL VISUAL CHECK
==================================================

ก่อนส่ง UI ให้ตรวจว่า:

- ดูเป็นระบบโรงเรียนสมัยใหม่หรือไม่
- อ่านง่ายหรือไม่
- Color hierarchy ชัดหรือไม่
- Primary action เด่นหรือไม่
- Icon สื่อความหมายหรือไม่
- Category ต่าง ๆ แยกกันชัดหรือไม่
- Card มี spacing เพียงพอหรือไม่
- UI ดูน่ารักแต่ยัง Professional หรือไม่
- ภาษาไทยไม่ล้น / ไม่ชน / ไม่ตัดข้อความ
- Responsive แล้วไม่เสีย hierarchy

--------------------------------------------------
Prompt Guidance for AI Assistant:
When creating or modifying new pages/components, follow the project's "Pastel Anime Education Dashboard" design system.

Use:
- pastel blue + mint + soft accent colors
- white rounded cards
- soft shadows
- 16-20px border radius
- Thai-first typography
- Lucide/Phosphor rounded icons
- clear icon + label hierarchy
- anime school illustrations as supporting visuals
- modern SaaS layout
- generous spacing
- strong visual hierarchy
- accessible contrast
- reusable components
- responsive design

Avoid:
- dark themes
- heavy gradients
- excessive shadows
- overly colorful UI
- gaming UI
- sharp square cards
- tiny text
- ambiguous icons
- dense information without grouping
