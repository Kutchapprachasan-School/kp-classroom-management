# Workspace Guidelines & Rules (Master Rule)

## Project Design System: Pastel Anime Education Dashboard
All UI development, information architecture, mobile layouts, and components in this project must strictly comply with the **Pastel Anime Education Dashboard** master design system:
- Specifications: [`.agents/rules/style.md`](.agents/rules/style.md) (or [`.agent/rules/style.md`](.agent/rules/style.md))
- Design System Catalog: [`design-system/kp-classroom-management/MASTER.md`](design-system/kp-classroom-management/MASTER.md)

### Core Rules Architecture (16 Essential Pillars)
1. **Brand & Visual Direction**: Modern Educational SaaS with Soft Pastel Anime aesthetics. **Clean first, cute second.**
2. **Exact Color Tokens**:
   - Primary: `#3B82F6` (Hover: `#2563EB`, Soft: `#EFF6FF`, Border: `#BFDBFE`)
   - Surface / Card: `#FFFFFF`, Card Border: 1px solid `#E6EEF7`, Background: `#F7FAFF` / `#F2F7FC`
   - Text: Primary `#163A66`, Secondary `#6B7C93`, Muted `#94A3B8`
   - Semantic: Success `#10B981` (`#ECFDF5`), Warning `#F59E0B` (`#FFFBEB`), Danger `#EF4444` (`#FEF2F2`), Special/Club `#8B5CF6` (`#F5F3FF`)
3. **Typography**: Thai-first (Prompt, Noto Sans Thai, LINE Seed Sans Thai, Anuphan). Never use heavy bold everywhere.
4. **Spacing & Radius**: 8px grid, Card padding 16-24px, Card Radius `18px` (`16-20px`), Button/Input `12px`, Hero `20-24px`. Soft subtle shadow `0 4px 16px rgba(40,90,140,0.06)`.
5. **Icon System**: **MingCute Icons** (`@mingcute/react`), cute, rounded, soft stroke. Fallback: `lucide-react`.
6. **Information Architecture**: Every screen must have **ONE clear primary task**. Answer immediately: (1) Where am I? (2) What is this page for? (3) What do I click first? Primary action is visually dominant; secondary actions are outline/ghost. Category → List → Detail → Action.
7. **Standard Page Structure**: (1) Header with title + primary action, (2) Context/Filters, (3) Summary stats (only when useful), (4) Main content, (5) Secondary info, (6) Quick actions. **No excessive long text at page top**; use collapsible, tooltips, or modals.
8. **Data-Heavy Pages (Tables & Rosters)**: Identity → Status → Primary Action → Metadata. Never force horizontal scroll for primary flows. On mobile, convert table rows into cards.
9. **Mobile-First Interaction**: Touch targets ≥ 44x44px. Large tap targets for repetitive tasks (e.g. `[มา] [สาย] [ขาด] [ลา]`). Thumb-friendly bottom action bars and drawers. No table pinching or horizontal scrolling.
10. **School Domain Rules**:
    - Attendance: Green = มา (Present), Yellow = สาย (Late), Red = ขาด/โดด (Absent/Truancy), Purple = ลา/กิจกรรม (Leave/Activity).
    - Submissions: Green = ส่งแล้ว/ตรวจแล้ว, Yellow = รอตรวจ/ส่งช้า, Red = ยังไม่ส่ง/เลยกำหนด, Blue = กำลังทำ.
    - Always include Icon + Text label, never color alone.
11. **Calendar & Date Interaction**: Today = Blue highlight, Complete = Green, Missing = Red, Holiday = Muted gray, Selected = Primary border. Quick status indicator visible on the calendar view before opening.
12. **Settings Architecture**: Domain-grouped cards: (1) ข้อมูลพื้นฐาน, (2) การเรียนการสอน, (3) การจัดการนักเรียน, (4) ผลการเรียน & รายงาน, (5) ระบบทั่วไป. Detailed forms live inside sub-pages/modals, never on settings root.
13. **Anime Illustration Rule**: Supporting visuals only. Allowed in hero banners, empty states, and promo cards. **Forbidden** behind dense tables, forms, or obscuring buttons.
14. **Accessibility**: Contrast ratio WCAG AA, keyboard navigation, smooth skeleton loading.
15. **Anti-patterns**: No pure black dark themes, no neon crypto gradients, no sharp square cards, no bloated top text, no horizontal scroll tables on mobile.
16. **Implementation for AI**: Always verify hierarchy, tokens, MingCute icons, mobile card conversion, and Thai readability before finishing.
