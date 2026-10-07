# Design System Master File: Pastel Anime Education Dashboard
## KP Classroom Management

> **LOGIC:** This is the Master UI/UX Design System file for KP Classroom Management.
> Every page and component must follow these visual guidelines by default.
> Master specification is permanently loaded via `GEMINI.md`, `.agents/rules/style.md`, and `.agent/rules/style.md`.

---

**Project:** KP Classroom Management
**Category:** Modern Educational SaaS (Pastel Anime Style)
**Core Aesthetic:** Clean first, cute second. Friendly, approachable, professional school SaaS.
**Core Principle:** **"Visual hierarchy should reflect importance, not business status."**

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
| Text Muted | `#94A3B8` | Timestamps, placeholders, inactive / completed states |
| Success Accent | `#10B981` (Soft: `#ECFDF5`, Border: `#A7F3D0`) | Completed items, positive confirmations |
| Warning Accent | `#F59E0B` (Soft: `#FFFBEB`, Border: `#FDE68A`) | Attention items, pending reviews |
| Danger Accent | `#EF4444` (Soft: `#FEF2F2`, Border: `#FECACA`) | Urgent errors, overdue items, destructive |
| Special Accent | `#8B5CF6` (Soft: `#F5F3FF`, Border: `#DDD6FE`) | Special tags, highlights, featured elements |

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
  - Destructive: Soft red background or red text

---

## 06. Layout & Information Hierarchy
Every screen must answer immediately:
1. **ตอนนี้ฉันอยู่ที่ไหน?** (Where am I?)
2. **หน้านี้ใช้ทำอะไร?** (What is this page for?)
3. **ฉันควรกดอะไรเป็นอันดับแรก?** (What is my primary action?)

- **ONE clear primary task per page.**
- Visual hierarchy: Primary Action is dominant. Secondary actions are outline/ghost.
- Admin / Advanced tools tucked into dropdowns or secondary panels.
- Flow: **Category → List → Detail → Action**
- Structure: Header → Context/Filters → Summary Stats → Main Content → Secondary Info → Quick Actions
- *Rule:* Never display walls of explanatory text at the top. Use tooltips, collapsible accordions, or modal help.

---

## 07. UX Visual State Rules
Visual hierarchy must indicate task completion and importance:

### 1. Incomplete / Pending
- **Higher visual emphasis**: Strong typography, high contrast, prominent action buttons.
- Placed first in visual order whenever sorting by workflow.
- Do NOT make pending items look disabled.

### 2. Completed
- **Lower visual emphasis**: Softer typography, muted metadata (`#94A3B8`).
- Optional soft check icon (`✓`) or subtle success soft tint (`#ECFDF5`).
- Remains fully readable and accessible without vanishing.

---

## 08. Data & List Presentation
- Priority: **Identity → Status/Priority → Primary Action → Metadata**
- Desktop: Clean row spacing, muted header, hover state.
- Mobile: Convert rows into stacked cards. Primary action visible immediately.
- Never force horizontal scroll for essential flows.

---

## 09. Mobile-First Interaction
- Touch target minimum: **44 x 44 px**
- Large tap targets for repetitive actions.
- Thumb-friendly bottom sticky action bars for confirmations.
- Use bottom drawers/sheets for multi-field filters.

---

## 10. Forms & Interaction
- Input fields: 1px solid `#E2E8F0`, 12px radius, `#3B82F6` focus ring.
- Labels above inputs (never placeholder-only).
- Inline error styling with descriptive helper text.
- Progressive disclosure for complex multi-step forms.

---

## 11. Settings UI Architecture
Settings organized into domain groups:
- Group items as `[Icon] + [Title] + [Short description] + [➔]`.
- Complex forms open in sub-pages or modals, never on the settings root.

---

## 12. Anime Illustration Rules
- Anime mascots are supporting visuals, **never functional blockers**.
- Allowed: Hero banners, empty states, sidebar motivation cards, achievements.
- **Forbidden:** Behind tables, behind form inputs, obscuring critical buttons, or replacing data labels.

---

## 13. Accessibility
- WCAG AA contrast ratio compliance.
- Interactive keyboard support (Tab / Enter / Space).
- Smooth skeleton loading with exact component border radius.

---

## 14. Anti-Patterns (Forbidden)
- ❌ Dark black themes
- ❌ Heavy gradients or gaming UI
- ❌ Sharp square corners (`rounded-none`)
- ❌ Walls of text at the top of pages
- ❌ Giant horizontal scrolling tables on mobile
- ❌ Random non-token hex colors
- ❌ Distracting cartoon characters all over data screens

---

## 15. Implementation Verification for AI
Before submitting code:
1. Verify 1 Primary Action dominance & Importance-driven hierarchy (Pending > Completed)
2. Verify Exact Tokens used
3. Verify MingCute Icons used
4. Verify Mobile Card conversion for tables
5. Verify Thai typography spacing and readability
