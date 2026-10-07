# Design System Master File: Pastel Anime Education Dashboard
## KP Classroom Management

> **LOGIC:** This is the Master Design System file for KP Classroom Management.
> Every page and component must follow these guidelines by default.
> Master specification is permanently loaded via `GEMINI.md`, `.agents/rules/style.md`, and `.agent/rules/style.md`.

---

**Project:** KP Classroom Management
**Category:** Modern Educational SaaS (Pastel Anime Style)
**Core Aesthetic:** Clean first, cute second. Friendly, approachable, professional school SaaS.

---

## 01. Brand & Visual Direction
- **Direction:** Soft Pastel, Bright, Educational Modern SaaS, Clean visual hierarchy.
- **Tone:** Professional yet welcoming school management platform with anime accent illustrations.
- **Rule:** ความสะอาดและการใช้งานจริงต้องมาก่อน ความน่ารักเป็นองค์ประกอบสนับสนุน (Clean first, cute second).

---

## 02. Color Tokens (Exact Values)

| Token Role | Hex Code | Purpose / Usage |
|---|---|---|
| Primary | `#3B82F6` | Navigation active, Primary buttons, Active tabs |
| Primary Hover | `#2563EB` | Button hover state, focus state |
| Primary Soft | `#EFF6FF` | Background active items, soft badges, selected rows |
| Primary Border | `#BFDBFE` | Active element borders, input focus ring |
| Background Canvas | `#F7FAFF` / `#F2F7FC` | Main application backdrop |
| Surface / Card | `#FFFFFF` | Content containers, modal windows |
| Card Border | `#E6EEF7` (1px solid) | Subtle dividers, card containers |
| Text Primary | `#163A66` | Page titles, section headings, key data |
| Text Secondary | `#6B7C93` | Subtitles, table headers, supporting labels |
| Text Muted | `#94A3B8` | Timestamps, placeholders, inactive states |
| Success (มา/ผ่าน/ตรวจแล้ว) | `#10B981` (Soft: `#ECFDF5`, Border: `#A7F3D0`) | Present attendance, completed, approved |
| Warning (สาย/รอตรวจ) | `#F59E0B` (Soft: `#FFFBEB`, Border: `#FDE68A`) | Late attendance, pending submissions |
| Danger (ขาด/โดด/เลยกำหนด) | `#EF4444` (Soft: `#FEF2F2`, Border: `#FECACA`) | Absent attendance, overdue, errors |
| Special / Club (ลา/กิจกรรม) | `#8B5CF6` (Soft: `#F5F3FF`, Border: `#DDD6FE`) | Approved leaves, student council, advisory |

---

## 03. Typography (Thai-First)
- **Primary Fonts:** Prompt, Noto Sans Thai, LINE Seed Sans Thai, Anuphan
- **Scale:**
  - Page Title: 24–32px / Bold (700)
  - Section Title: 18–22px / SemiBold (600)
  - Card Title: 15–18px / SemiBold (600)
  - Body Text: 14–16px / Regular (400) or Medium (500)
  - Caption / Helper: 12–14px / Regular (400)
  - Badge / Label: 10–12px / SemiBold (600)

---

## 04. Spacing, Radius & Shadows
- **8px Grid:** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`
- **Border Radius:**
  - Small (Pill, Badge): `8-10px` or `rounded-full`
  - Button & Input: `10-14px` (Default: `12px`)
  - Cards & Containers: `16-20px` (Default: `18px`)
  - Hero Banners & Modals: `20-24px`
- **Card Styling:**
  ```css
  .card {
    background: #FFFFFF;
    border: 1px solid #E6EEF7;
    border-radius: 18px;
    box-shadow: 0 4px 16px rgba(40, 90, 140, 0.06);
    padding: 20px;
  }
  ```

---

## 05. Components & Icon System
- **Icon Set:** **MingCute Icons** (`@mingcute/react`)
  - Rounded, cute, soft stroke width, highly readable.
  - Subpath import: `import Home1Regular from '@mingcute/react/core-regular/home-1'`
- **Fallback:** `lucide-react` for niche utility symbols.
- **Buttons:**
  - Primary: `#3B82F6` (White text, rounded-xl, 12px radius, medium/bold)
  - Secondary: White background, 1px solid `#E2E8F0`, `#163A66` text
  - Ghost: Borderless, hover tint

---

## 06. Information Architecture
Every screen must answer immediately:
1. **ตอนนี้ฉันอยู่ที่ไหน?** (Where am I?)
2. **หน้านี้ใช้ทำอะไร?** (What is this page for?)
3. **ฉันควรกดอะไรเป็นอันดับแรก?** (What is my primary action?)

- **ONE clear primary task per page.**
- Visual hierarchy: Primary Action is dominant. Secondary actions are outline/ghost.
- Admin / Advanced tools tucked into dropdowns or secondary panels.
- Flow: **Category → List → Detail → Action**

---

## 07. Standard Page Structure
1. **Header**: Icon + Title + Short 1-line subtitle + Primary Action on right
2. **Context / Filters**: Term, classroom, date picker, search
3. **Summary Stats (When useful)**: 2–4 concise stat cards
4. **Main Content**: Roster, cards, table, or calendar
5. **Secondary Info**: Sub-tabs, history logs
6. **Quick Actions**: Export or help

*Rule:* Never display walls of explanatory text at the top. Use tooltips, collapsible accordions, or modal help.

---

## 08. Data-Heavy Pages (Tables & Rosters)
- Priority: **Identity → Status → Primary Action → Metadata**
- Desktop: Clean row spacing, muted header, hover state.
- Mobile: Convert rows into stacked cards. Primary action visible immediately.
- Never force horizontal scroll for essential flows.

---

## 09. Mobile-First Interaction
- Touch target minimum: **44 x 44 px**
- Large tap targets for repetitive teacher actions (e.g., Attendance buttons `[มา] [สาย] [ขาด] [ลา]`).
- Thumb-friendly bottom sticky action bars for confirmations.
- Use bottom drawers/sheets for multi-field filters.

---

## 10. School Domain Rules
- **Attendance:**
  - Green (`#10B981`): มา (Present)
  - Yellow (`#F59E0B`): สาย (Late)
  - Red (`#EF4444`): ขาด / โดด (Absent / Truancy)
  - Purple (`#8B5CF6`): ลา / กิจกรรม (Leave / Activity)
- **Assignments:**
  - Green: ส่งแล้ว / ตรวจแล้ว
  - Yellow: รอตรวจ / ส่งช้า
  - Red: ยังไม่ส่ง / เลยกำหนด
- Rule: Never communicate status by color alone; always pair with icon and text.

---

## 11. Calendar & Date Interaction
- Today: Blue highlight (`#3B82F6`)
- Complete: Green indicator
- Missing / Incomplete: Red indicator
- Holiday: Muted gray
- Selected: Clear primary border
- Status must be visible on the calendar view before drilling down.

---

## 12. Settings Architecture
Settings must be organized into 5 domain groups:
1. **ข้อมูลพื้นฐาน:** โรงเรียน, ผู้ใช้งาน, ห้องเรียน, รายวิชา
2. **การเรียนการสอน:** ตารางสอน, แผนการสอน, การบ้าน, การสอบ, แบบประเมิน
3. **การจัดการนักเรียน:** ทะเบียนนักเรียน, เช็คชื่อ, พฤติกรรม, ผู้ปกครอง
4. **ผลการเรียน & รายงาน:** ปพ.5, เกรด, สถิติ, การสำรองข้อมูล (Backup)
5. **ระบบทั่วไป:** การแจ้งเตือน, Theme, ความปลอดภัย, Storage

*Rule:* Group items as `[Icon] + [Title] + [Short description] + [➔]`. Complex forms open in sub-pages or modals, never on the settings root.

---

## 13. Anime Illustration Rules
- Anime mascots are supporting visuals, **never functional blockers**.
- Allowed: Hero banners, empty states, sidebar motivation cards, achievements.
- **Forbidden:** Behind tables, behind form inputs, obscuring critical buttons, or replacing data labels.

---

## 14. Accessibility
- WCAG AA contrast ratio compliance.
- Interactive keyboard support (Tab / Enter / Space).
- Smooth skeleton loading with exact component border radius.

---

## 15. Anti-Patterns (Forbidden)
- ❌ Dark black themes
- ❌ Heavy gradients or gaming UI
- ❌ Sharp square corners (`rounded-none`)
- ❌ Walls of text at the top of pages
- ❌ Giant horizontal scrolling tables on mobile
- ❌ Random non-token hex colors
- ❌ Distracting cartoon characters all over data screens

---

## 16. Implementation Verification for AI
Before submitting code:
1. Verify 1 Primary Action dominance
2. Verify Exact Tokens used
3. Verify MingCute Icons used
4. Verify Mobile Card conversion for tables
5. Verify Thai typography spacing and readability
