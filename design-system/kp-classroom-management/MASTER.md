# Design System Master File: Pastel Anime Education Dashboard
## KP Classroom Management

> **LOGIC:** This is the Master Design System file for KP Classroom Management.
> Every page and component must follow these guidelines by default.
> Design rule specification is also permanently loaded via `GEMINI.md` and `.agents/rules/style.md`.

---

**Project:** KP Classroom Management
**Category:** Modern Educational SaaS (Pastel Anime Style)
**Core Aesthetic:** Clean first, cute second. Friendly, approachable, professional school SaaS.

---

## 1. Color Palette & Design Tokens

| Token Role | Hex Code | Usage |
|---|---|---|
| Primary | `#38BDF8` / `#3B82F6` | Main navigation, active states, primary buttons |
| Primary Soft | `#E0F2FE` / `#EFF6FF` | Hover states, pill badges, selected row highlights |
| Secondary (Mint) | `#34D399` / `#10B981` | Success states, advisory teacher accents |
| Secondary (Cyan) | `#06B6D4` | Class group badges, timetable blocks |
| Secondary (Purple)| `#A78BFA` | Special badges, student highlights, club groups |
| Secondary (Yellow)| `#FBBF24` | Warning badges, pending reviews |
| Secondary (Orange)| `#FB923C` | Alert items, urgent indicators |
| Background Canvas | `#F7FAFF` / `#F2F7FC`| Main app background |
| Surface / Card | `#FFFFFF` | Content containers, modal windows |
| Card Border | `#E6EEF7` (1px solid) | Subtle dividers, container borders |
| Text Primary | `#163A66` | Headings, key labels, important data |
| Text Secondary | `#6B7C93` | Subtitles, helper text, table headers |
| Text Muted | `#94A3B8` | Placeholders, timestamps, disabled items |
| Destructive / Error | `#F87171` | Danger actions, rejected status |

---

## 2. Typography (Thai-First)

- **Primary Thai Fonts:** Noto Sans Thai, IBM Plex Sans Thai, LINE Seed Sans Thai, Prompt
- **Hierarchy:**
  - Page Title: 24-32px / Bold (700)
  - Section Title: 18-22px / SemiBold (600)
  - Card Title: 15-18px / SemiBold (600)
  - Body Text: 14-16px / Regular (400)
  - Caption / Helper: 12-14px / Regular (400)

---

## 3. Spacing & Border Radius

### 8px Spacing Grid
- `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`
- Section gap: `24px`
- Card gap: `16px`
- Card padding: `16-24px`

### Border Radius
- Small items (tags, badges): `8-10px`
- Buttons & Form Inputs: `10-14px`
- Cards & Content Panels: `16-20px` (Default: `18px`)
- Hero Banners & Modals: `20-24px`

---

## 4. Key Component Specs

### Cards
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E6EEF7;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(40, 90, 140, 0.06);
  padding: 20px;
}
```

### Primary Button
```css
.btn-primary {
  background: #3B82F6;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 180ms ease;
}
.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
```

### Icon System
- **Primary Library:** **MingCute Icons** (`@mingcute/react`)
- **Style:** Cute, rounded, soft stroke, friendly aesthetic
- **Import convention:**
  ```tsx
  import { Home1Regular, User3Regular, CalendarRegular } from '@mingcute/react/core-regular';
  // or filled variant:
  import { Home1Filled, User3Filled } from '@mingcute/react/core-filled';
  ```
- **Fallback:** `lucide-react` (for domain-specific utility icons)

---

## 5. Anti-Patterns (Forbidden)
- ❌ Dark mode or heavy black backgrounds
- ❌ Heavy/dark shadows (`box-shadow: 0 10px 30px #000`)
- ❌ Neon gradients and gaming aesthetic
- ❌ Sharp square corners (`rounded-none` or `radius: 0`)
- ❌ Rigid, oversized icons without proper padding

