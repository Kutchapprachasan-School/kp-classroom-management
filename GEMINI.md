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

## Strict Zero Mock Policy & Explicit Consent Rule (กฎเหล็กห้ามใส่ Mock Data โดยพลการ & ถามก่อนเสมอ)
- Detailed Specification: [`.agents/rules/zero-mock-data.md`](.agents/rules/zero-mock-data.md) (or [`.agent/rules/zero-mock-data.md`](.agent/rules/zero-mock-data.md))
1. **Absolute Ban on Mock Data (ห้ามนำ Mock Data เข้ามาเองโดยเด็ดขาด)**:
   - ห้ามสร้างหรือใส่ข้อมูลจำลอง (Mock Data, Dummy Arrays, Hardcoded Fake Fallbacks, ข้อมูลหลอก) ใน view, component หรือ service เองโดยเด็ดขาด
   - ห้ามแต่งชื่อนักเรียน, ครู, ปฏิทิน, คาบเรียน, หรือคะแนนจำลองขึ้นมาเอง
   - หากระบบยังไม่มีข้อมูล หรือไม่มีข้อมูลในฐานข้อมูล (Neon / Supabase) ให้แสดงเป็น **Empty State** หรือ Array ว่าง `[]` เสมอ
2. **No Unilateral Assumptions (เลิกคิดเองว่ามันต้องมี)**:
   - ห้ามคิดแทนผู้ใช้ว่า "ใส่ข้อมูลจำลองไว้ก่อนเพื่อให้ดูสวยงาม/ไม่โล่ง" หรือ "ระบบจำเป็นต้องมีข้อมูลเหล่านี้"
   - ห้ามใส่ hardcoded fallback เพื่อหลบ error หรือเอาใจการแสดงผลชั่วคราว
3. **Mandatory Pre-Approval for Data Addition/Removal (จะเพิ่มหรือลด ต้องถามก่อนเสมอ)**:
   - หากมีความจำเป็นต้องเพิ่มชุดข้อมูลใหม่, ปรับโครงสร้างข้อมูล (Schema), ลบข้อมูลเก่า, หรือสร้างค่าเริ่มต้น (Seeding): **ต้องถามและขอความเห็นชอบจากผู้ใช้ก่อนดำเนินการทุกครั้ง**
   - ห้ามทำการเพิ่ม ลด หรือดัดแปลงข้อมูลจริงของผู้ใช้โดยพลการเป็นอันขาด

## Token Optimization & Anti-Context Explosion Rules (6 Pillars)
To prevent Quadratic Context Explosion and eliminate wasteful token consumption (90%+ lost to repeated context re-reading in long sessions), all AI agents and developers must strictly adhere to the following 6 pillars:

1. ✂️ **Targeted View vs Full View**:
   - **Strict Prohibition**: Never call `view_file` without specifying `StartLine` and `EndLine` on large files.
   - **Targeted Slicing**: Check [`docs/CODEBASE_INDEX.md`](docs/CODEBASE_INDEX.md) to locate exact line numbers, and view only small slices (30-80 lines maximum).
2. 🔄 **Milestone Handoff / Compact Cadence**:
   - Conclude each development milestone (code change + test verification) with a concise status digest.
   - Proactively recommend or execute `/compact` to clear tool call histories and large logs before switching tasks.
3. 🧠 **Smart Model Routing**:
   - Route tasks by complexity: use light/fast models (`flash` / `flash_lite`) for simple lookups, file indexing, and regex scans.
   - Reserve high-tier models (`inherit` / `pro`) strictly for complex reasoning, architectural refactoring, and multi-file logic.
4. 🗄️ **Scratchpad Output Redirect**:
   - Never dump massive command logs (e.g. `npm test`, large directory trees) directly into chat context.
   - Pipe or redirect verbose outputs to scratch files (e.g. `npm test > scratch/test.log 2>&1`), and read only exit codes or compact failure summaries.
5. 🐝 **Ephemeral Subagent Swarm**:
   - Offload broad explorations and code audits to subagents running in isolated contexts.
   - Subagents must return only concise summaries, dissolving immediately without polluting parent conversation history.
6. 📑 **Living Codebase Index Maintenance**:
   - Maintain [`docs/CODEBASE_INDEX.md`](docs/CODEBASE_INDEX.md) as the single source of truth for file paths and key symbol line numbers.
   - **Mandatory**: Run `node scripts/index_codebase.mjs` every time files are added, removed, or majorly refactored so line references stay synchronized.

Detailed rule specification: [`.agent/rules/token-efficiency.md`](.agent/rules/token-efficiency.md) / [`.agents/rules/token-efficiency.md`](.agents/rules/token-efficiency.md)
