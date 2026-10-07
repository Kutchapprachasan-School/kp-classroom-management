# Workspace Guidelines & Rules (Master Rule)

## Project Design System: Pastel Anime Education Dashboard
All UI development, information architecture, mobile layouts, and components in this project must strictly comply with the **Pastel Anime Education Dashboard** master design system:
- Specifications: [`.agents/rules/style.md`](.agents/rules/style.md) (or [`.agent/rules/style.md`](.agent/rules/style.md))
- Design System Catalog: [`design-system/kp-classroom-management/MASTER.md`](design-system/kp-classroom-management/MASTER.md)

### Core Rules Architecture (15 Visual & UX Pillars)
1. **Brand & Visual Direction**: Modern Educational SaaS with Soft Pastel Anime aesthetics. **Clean first, cute second.**
2. **Exact Color Tokens**:
   - Primary: `#3B82F6` (Hover: `#2563EB`, Soft: `#EFF6FF`, Border: `#BFDBFE`)
   - Surface / Card: `#FFFFFF`, Card Border: 1px solid `#E6EEF7`, Background: `#F7FAFF` / `#F2F7FC`
   - Text: Primary `#163A66`, Secondary `#6B7C93`, Muted `#94A3B8`
   - Semantic: Success `#10B981` (`#ECFDF5`), Warning `#F59E0B` (`#FFFBEB`), Danger `#EF4444` (`#FEF2F2`), Special `#8B5CF6` (`#F5F3FF`)
3. **Typography**: Thai-first (Prompt, Noto Sans Thai, LINE Seed Sans Thai, Anuphan). Never use heavy bold everywhere.
4. **Spacing & Radius**: 8px grid, Card padding 16-24px, Card Radius `18px` (`16-20px`), Button/Input `12px`, Hero `20-24px`. Soft subtle shadow `0 4px 16px rgba(40,90,140,0.06)`.
5. **Components & Icon System**: **MingCute Icons** (`@mingcute/react`), cute, rounded, soft stroke. Fallback: `lucide-react`. Buttons: Primary `#3B82F6`, Secondary Outline, Ghost.
6. **Layout & Information Hierarchy**:
   - **"Visual hierarchy should reflect importance, not business status."**
   - Every screen must have **ONE clear primary task**. Answer immediately: (1) Where am I? (2) What is this page for? (3) What do I click first?
   - Standard structure: Header → Context/Filters → Summary stats → Main content → Secondary info → Quick actions. No long walls of text at page top (use collapsible, tooltips, or modals).
7. **UX Visual State Rules**:
   - **Incomplete / Pending**: Higher visual emphasis, stronger typography, stronger CTA, prominent action buttons.
   - **Completed**: Lower visual emphasis, softer text/muted metadata, optional check icon / soft green, without hiding the item.
8. **Data & List Presentation**: Identity → Status/Priority → Primary Action → Metadata. Never force horizontal scroll for primary flows. On mobile, convert table rows into cards.
9. **Mobile-First Interaction**: Touch targets ≥ 44x44px. Large tap targets for repetitive tasks. Thumb-friendly bottom action bars and drawers. No table pinching or horizontal scrolling.
10. **Forms & Interaction**: Labels above inputs, focus rings `#3B82F6`, clear inline validation errors, progressive disclosure for complex inputs.
11. **Settings UI Architecture**: Domain-grouped cards: `[Icon] + [Title] + [Short description] + [➔]`. Detailed forms live inside sub-pages/modals, never on settings root.
12. **Anime Illustration Rule**: Supporting visuals only. Allowed in hero banners, empty states, and promo cards. **Forbidden** behind dense tables, forms, or obscuring buttons.
13. **Accessibility**: Contrast ratio WCAG AA, keyboard navigation, smooth skeleton loading.
14. **Anti-patterns**: No pure black dark themes, no neon crypto gradients, no sharp square cards, no bloated top text, no horizontal scroll tables on mobile.
15. **Implementation for AI**: Always verify hierarchy (Importance-driven), tokens, MingCute icons, mobile card conversion, and Thai readability before finishing.
