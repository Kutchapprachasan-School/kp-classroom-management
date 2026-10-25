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
3. 🧠 **Argon Head Command & Smart Model Routing (Explicit User Mandate)**:
   - **Argon (`Gemini 4 Argon (High)`) is the Head Orchestrator**: Argon plans architecture, checks `docs/CODEBASE_INDEX.md` / `docs/DATA_SCHEMA_INDEX.md`, dispatches tasks, and verifies final results. Never waste Argon's main context on broad file scanning, log reading, or repetitive boilerplate edits.
   - **Mandatory `Model` Override on `invoke_subagent`**: By explicit user command, ALWAYS override the default `Model: 'inherit'` and explicitly select the lowest sufficient model tier:
     - **`Model: "flash_lite"` (`argon-scout` / `research`)**: File/line lookups, grep/regex scans, error log tailing (`scratch/`), import checks, and index verification. (Return digest ≤ 15 lines).
     - **`Model: "flash"` (`argon-worker` / `argon-specialist` / `self`)**: Primary workhorse for UI building/styling (`style.md`), CRUD/state wiring, writing & running tests (`npm test`, `tsc`), AND multi-file refactoring when guided by Head's exact line coordinates. (Return digest ≤ 20 lines).
     - **`Model: "pro"`**: Use ONLY if Pro quota is available for deep DB/cross-system tasks; if Pro quota is depleted/unavailable, route all Specialist tasks to **`Model: "flash"`** with detailed step-by-step coordinates from Head.
     - **`Model: "inherit"`**: NEVER pass `"inherit"` to subagents (especially when Head is Argon, Sonnet, or Opus, as it drains scarce top-tier quota).
   - **Head Succession & Sniper Mode (`Argon` ➔ `Flash` ➔ `Sonnet` / `Opus`)**:
     - If **Argon** quota runs out, switch main chat to **Gemini Flash** as Acting Head (guided by `CODEBASE_INDEX.md` + `DATA_SCHEMA_INDEX.md`).
     - Reserve **Claude Sonnet** (Surgical UI/Logic Coder) and **Claude Opus** (Nuclear Architecture/Deadlock Solver) strictly for **1–2 turn Sniper Mode** after running `/compact` and after `flash_lite` has already located exact file/line numbers. Switch back to Argon/Flash immediately after the surgical fix.
4. 🗄️ **Scratchpad Output Redirect**:
   - Never dump massive command logs (e.g. `npm test`, large directory trees) directly into chat context.
   - Pipe or redirect verbose outputs to scratch files (e.g. `npm test > scratch/test.log 2>&1`), and read only exit codes or compact failure summaries.
5. 🐝 **Ephemeral Subagent Swarm & 4-Part Dispatch Brief**:
   - Every `invoke_subagent` prompt from Argon must include: **(1) Objective** (1–2 sentences), **(2) Target Coordinates** (exact file paths + `StartLine–EndLine` from `docs/CODEBASE_INDEX.md`), **(3) Guardrails** (30–80 line slice limit, Zero-Mock, Design Tokens, Scratchpad redirect), and **(4) Return Digest Contract** (concise 10–25 line summary only; never dump full files back to Head).
6. 📑 **Living Codebase Index Maintenance**:
   - Maintain [`docs/CODEBASE_INDEX.md`](docs/CODEBASE_INDEX.md) as the single source of truth for file paths and key symbol line numbers.
   - **Mandatory**: Run `node scripts/index_codebase.mjs` every time files are added, removed, or majorly refactored so line references stay synchronized.

Detailed rule specification: [`.agent/rules/token-efficiency.md`](.agent/rules/token-efficiency.md) / [`.agents/rules/token-efficiency.md`](.agents/rules/token-efficiency.md)

## Zero-Egress & Database Workload Optimization Rules (7 Pillars)
To eliminate wasteful database egress and preserve serverless compute hours (Neon 5GB/month & scale-to-zero limits), all AI agents and developers must strictly adhere to the following 7 pillars:

1. 🎯 **Strict Field Whitelisting**: Never use `SELECT *` or `prisma.findMany()` without explicit `select:`. Never include heavy binary/JSONB fields (`faceDescriptor`, `signatureUrl`) in list views.
2. ⏱️ **Timestamp & Fingerprint Guard**: Query `updated_at` or table fingerprints (`count(*)`, `max(updated_at)`) first; download full payloads only when remote timestamp exceeds local storage.
3. ✂️ **Minimal Mutation Return**: Always use `RETURNING "key", "updated_at"` or `RETURNING "id"` on mutations. Never use `RETURNING *` on tables with large JSONB or text payloads.
4. 🧩 **Granular Scope & Key Sharding**: Never store monolithic all-school blobs in a single key. Shard keys by scope (e.g. `attendance:<year>:<term>:<roomId>`).
5. 💤 **Scale-to-Zero & Compute Conservation**: Zero active polling loops (`setInterval`). No indiscriminate `revalidateOnFocus`. Always use `-pooler` connection strings to allow Neon to sleep.
6. 🖼️ **R2-Only Storage for All Assets & Documents**: All documents, medical certificates, leave attachments, assignment files, receipts, scans, and PDFs must be stored in **Cloudflare R2 only**. Never store files as Base64 or Binary Blobs in PostgreSQL. Store only storage keys or R2 URLs in DB.
7. 🛡️ **Schema Drift & Drop Protection**: Always declare all existing database tables (including `kps_cloud_store`) in `schema.prisma` to prevent accidental drops during `prisma db push`.

Detailed rule specification: [`.agent/rules/egress-optimization.md`](.agent/rules/egress-optimization.md) / [`.agents/rules/egress-optimization.md`](.agents/rules/egress-optimization.md)

## Cross-System Data Schema Governance Rules (SMS ⟷ Classroom Management)
Because `09 ระบบจัดการชั้นเรียน` and `ระบบบริหารจัดการโรงเรียน (SMS / SuraLeave)` share the same Neon PostgreSQL database, all AI agents and developers must strictly follow the **Cross-System Data Schema Contract** to prevent Split-Brain dashboards:

1. 🗺️ **Consult the Data Schema Index First**:
   - Always check [`docs/DATA_SCHEMA_INDEX.md`](docs/DATA_SCHEMA_INDEX.md) before writing or modifying any `.from(...)`, `.rpc(...)`, or `prisma.<model>` query.
2. 🏛️ **Canonical Base Tables vs Read Views vs Config Store**:
   - **Students & Parent Contacts**: Write to `"Student"` (or via `public.students` view `INSTEAD OF` trigger); Read via `public.students` view (Classroom) or `prisma.student` (SMS).
   - **Classroom Enrollment & Promotion**: Keep `"StudentEnrollment"` (`status = 'ENROLLED'`) and `public.student_enrollments` (`status = 'ACTIVE'`) 100% synchronized. Both `public.students`, `public.classrooms` (`student_count`), and SMS Dashboard read active enrollments from `"StudentEnrollment"`.
   - **Classrooms**: Write to `"ClassRoom"`; Read via `public.classrooms` view (`student_count` from DB must never be overwritten by `localStorage` zero/stale counts).
   - **Attendance**: Student morning attendance (`period = 0` in `"Attendance"`) must sync with `"StudentMorningAttendance"` for the SMS Dashboard, while staff attendance in `"Attendance"` uses `userId IS NOT NULL`.
   - **Forbidden in `kps_cloud_store`**: `kps_cloud_store` is strictly for UI/app settings (`kp_school_bell_schedule`, `kps_school_branding_settings_v1`, etc.). Never use `kps_cloud_store` as the source of truth for students, classrooms, enrollments, attendance, or grades.
3. 🔄 **Living Data Schema Index Maintenance**:
   - **Mandatory**: Run `node scripts/index_data_schema.mjs` every time database queries, services, or migrations are modified so both systems stay synchronized.

Detailed rule specification: [`.agent/rules/data-schema-governance.md`](.agent/rules/data-schema-governance.md) / [`.agents/rules/data-schema-governance.md`](.agents/rules/data-schema-governance.md)

## Zero-Token Multi-Agent File Conflict Guard Rules (ป้องกันหลาย Agent แก้ไฟล์ชนกัน)
To prevent code corruption when multiple conversations or subagents run concurrently while consuming near-zero tokens:

1. 🚫 **Never Read Raw Transcripts Directly**: Never use `view_file` on another conversation's `transcript.jsonl` to check for conflicts (wastes 3,000–10,000 tokens).
2. 📡 **Use the Conflict Radar CLI (~30 Tokens)**: Before editing shared or multi-file scopes, run:
   - `node scripts/check_agent_conflicts.mjs --self=<conversation-id> <file1> <file2> ...`
   - Optionally lock scope upfront: `node scripts/check_agent_conflicts.mjs --lock <conversation-id> <file1> <file2> ...`
3. 🛡️ **Respect Automatic `PreToolUse` Hook Blocks (0 Tokens)**: `.agents/hooks.json` automatically runs `scripts/check_agent_conflicts.mjs --hook` before every `replace_file_content` / `write_to_file`. If blocked (`⛔ [Multi-Agent Conflict Guard]`), do not force-overwrite; wait or work on non-conflicting files first.

Detailed rule specification: [`.agent/rules/multi-agent-conflict-guard.md`](.agent/rules/multi-agent-conflict-guard.md) / [`.agents/rules/multi-agent-conflict-guard.md`](.agents/rules/multi-agent-conflict-guard.md)


