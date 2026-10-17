# Student Grade Promotion & Academic Rollover Implementation Plan (Enterprise RPC v3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an enterprise-grade, transactional Student Grade Promotion & Academic Rollover System (ระบบเลื่อนชั้นเรียน & สิ้นปีการศึกษา) powered by PostgreSQL ACID RPC, explicit immutable enrollment lifecycle history, multi-step batch tracking with conflict-aware rollback, dedicated graduation approval, alumni directory, and isolated test-data purge controls.

**Architecture:** 
- **Two-Tier Enrollment Architecture**: `student_enrollments` serves as the authoritative immutable ledger of student-classroom relationships per academic year/term, while `students.classroom_id` functions as a denormalized active pointer for fast queries and backward compatibility.
- **ACID Transactional RPC**: Database functions `execute_student_promotion_batch` and `rollback_student_promotion_batch` execute all mutations atomically inside PostgreSQL transactions with pessimistic row-locking (`FOR UPDATE`) and idempotency enforcement.
- **Pre-flight Dry Run**: Client utilizes the pure calculation engine (`promotionDryRunEngine.ts`) to validate business rules and calculate projections before requesting any database write.
- **Graduation Gating**: Graduating cohorts (ม.3 & ม.6) require explicit academic board approval before moving to `GRADUATED` status and archiving into the Alumni Directory.
- **Conflict-Aware Rollback**: Rollback inspects destination enrollments for post-promotion activities (new grades or attendance) and strictly blocks blind overwrites if conflicts are detected.
- **Isolated Purge Guard**: Single-student deletion is isolated into `studentPurgeService` with pre-flight dependency inspection, restricted strictly to test/uncommitted data without risking historical records.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, PostgreSQL (Neon / Supabase), Vite, Vitest, MingCute Icons (`@mingcute/react`), Lucide React.

## Global Constraints
- Strictly comply with **Pastel Anime Education Dashboard** design system: `#3B82F6` Primary, `#163A66` Text Primary, Card radius `18px`, Button radius `12px`, soft subtle borders `#E6EEF7`.
- Thai-first typography using `'Prompt'` font.
- Historical scores, SGS submissions, and attendance records MUST NEVER be mutated or deleted during promotion.
- Pre-existing active enrollments must be cleanly closed (`status: 'COMPLETED'`) and new enrollments created for destination rooms.
- All live promotions must be executed in a single atomic PostgreSQL transaction via RPC to prevent partial failure states.
- 1-Click Rollback must verify that target enrollments have zero subsequent attendance or score records before reverting.
- Single-student purge must be an independent administrative utility with dependency audit checks.

---

## File Structure & Responsibilities

```
docs/
├── superpowers/
│   ├── specs/2026-10-17-database-promotion-rpc-spec.md  # Architectural specification
│   └── plans/2026-10-17-student-promotion-and-rollover.md # This implementation plan
migrations/
└── 20261018_student_enrollments_and_promotion_rpcs.sql # PostgreSQL DDL & RPC functions
src/
├── utils/
│   └── promotionDryRunEngine.ts                        # Pure calculation engine (Already built)
├── services/
│   ├── studentEnrollmentService.ts                     # Active & historical enrollment client service
│   ├── studentPromotionService.ts                      # RPC invoker, dry-run orchestrator, batch tracker
│   └── studentPurgeService.ts                          # Test data purge engine with dependency audits
├── components/
│   └── settings/
│       ├── StudentPromotionModal.tsx                   # 4-step wizard for grade promotion & rollover
│       ├── PromotionRollbackModal.tsx                  # Batch history & conflict-aware rollback manager
│       ├── AlumniDirectoryModal.tsx                    # Historical alumni archive & transcript viewer
│       └── SingleStudentPurgeModal.tsx                 # Safe single-student test record purge dialog
└── views/
    ├── SettingsBackupView.tsx                          # Settings entrypoint (Category 3.1)
    └── ClassroomsRosterView.tsx                        # Roster student action menu integration
tests/
├── promotionDryRunEngine.test.ts                       # Unit tests for pure engine (Already passing)
├── promotionRpcIntegration.test.ts                     # RPC payload contracts & integration tests
├── studentEnrollmentService.test.ts                    # Unit tests for enrollment lifecycle
├── studentPromotionService.test.ts                     # Unit tests for promotion orchestrator & rollback
└── studentPurgeService.test.ts                         # Unit tests for dependency checks & purge guard
```

---

## Task Decomposition

### Task 1: PostgreSQL DDL Migration — Enrollment Ledger & Promotion Batches

**Files:**
- Create: `migrations/20261018_student_enrollments_and_promotion_rpcs.sql`
- Modify: `prisma/schema.prisma`
- Test: `tests/promotionRpcIntegration.test.ts`

**Interfaces:**
- Produces Table: `student_enrollments` (id, school_id, student_id, classroom_id, term_id, academic_year, semester_no, seat_no, status, start_date, end_date, gpa)
- Produces Table: `promotion_batches` (id, idempotency_key, from_year, from_semester, to_year, to_semester, status, executed_by, executed_at, rollback_at, rollback_by, rollback_reason, summary)
- Produces Table: `promotion_batch_items` (id, batch_id, student_id, previous_enrollment_id, previous_classroom_id, action, new_enrollment_id, new_classroom_id, graduation_approved, graduation_approved_by, graduation_approved_at, notes)
- Constraints:
  - `idx_student_single_active_enrollment`: Unique partial index on `student_enrollments(student_id)` where `status = 'ACTIVE'`.
  - `uq_batch_idempotency`: Unique on `promotion_batches(idempotency_key)`.

- [ ] **Step 1: Write SQL DDL for `student_enrollments`, `promotion_batches`, and `promotion_batch_items`**
- [ ] **Step 2: Add backfill script to auto-seed initial `ACTIVE` enrollment records from existing `students.classroom_id`**
- [ ] **Step 3: Update `prisma/schema.prisma` with matching models (`StudentEnrollment`, `PromotionBatch`, `PromotionBatchItem`)**
- [ ] **Step 4: Execute migration on Neon PostgreSQL database via migration script**
- [ ] **Step 5: Verify table creation and index validity with automated test assertion**
- [ ] **Step 6: Commit changes: `feat(db): add student enrollment history and promotion batch schema`**

---

### Task 2: PostgreSQL Atomic RPCs — `execute_student_promotion_batch` & `rollback_student_promotion_batch`

**Files:**
- Modify: `migrations/20261018_student_enrollments_and_promotion_rpcs.sql`
- Modify: `tests/promotionRpcIntegration.test.ts`

**Interfaces:**
- Database RPC: `execute_student_promotion_batch(p_idempotency_key, p_from_term_id, p_to_term_id, p_from_year, p_to_year, p_items JSONB, p_executed_by TEXT)`
- Database RPC: `rollback_student_promotion_batch(p_batch_id, p_rollback_by TEXT, p_rollback_reason TEXT)`

- [ ] **Step 1: Write integration tests expecting RPC execution and rollback behaviors in `tests/promotionRpcIntegration.test.ts`**
- [ ] **Step 2: Implement `execute_student_promotion_batch` in PostgreSQL**:
  - Check idempotency key; return existing batch if duplicate.
  - Row-lock all affected students and active enrollments with `FOR UPDATE`.
  - Close previous enrollments (`status = 'COMPLETED'`, `end_date = CURRENT_DATE`).
  - Create new enrollments with status `ACTIVE` for `PROMOTED` and `REPEAT_GRADE`.
  - Update `students.classroom_id` pointer (or set `NULL` for `GRADUATED`/`SUSPENDED`).
  - Write detailed item rows in `promotion_batch_items`.
- [ ] **Step 3: Implement `rollback_student_promotion_batch` in PostgreSQL**:
  - Pre-flight conflict check: query if any `new_enrollment_id` has scores in `scores` or attendance in `StudentPeriodAttendance`.
  - If conflict exists, abort with error `CONFLICT_DETECTED: Target enrollments have active records`.
  - Otherwise, delete new enrollments, restore previous enrollments to `ACTIVE`, restore student `classroom_id`, and mark batch as `ROLLED_BACK`.
- [ ] **Step 4: Execute and verify RPCs in Neon PostgreSQL**
- [ ] **Step 5: Run integration tests and confirm all pass**
- [ ] **Step 6: Commit changes: `feat(rpc): implement transactional promotion and conflict-aware rollback RPCs`**

---

### Task 3: Client Enrollment Lifecycle Service (`studentEnrollmentService.ts`)

**Files:**
- Create: `src/services/studentEnrollmentService.ts`
- Create: `tests/studentEnrollmentService.test.ts`
- Modify: `src/services/studentService.ts`

**Interfaces:**
```typescript
export interface StudentEnrollmentRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  academicYear: number;
  semesterNo: number;
  seatNo: number;
  status: 'ACTIVE' | 'COMPLETED' | 'REPEAT_GRADE' | 'SUSPENDED' | 'TRANSFERRED_OUT' | 'GRADUATED';
  startDate: string;
  endDate?: string;
  gpa?: number;
}
```

- [ ] **Step 1: Write unit tests in `tests/studentEnrollmentService.test.ts` for fetching active enrollments, historical enrollments, and student timeline**
- [ ] **Step 2: Implement `studentEnrollmentService.ts` querying `student_enrollments` via `neonClient` with local memory caching**
- [ ] **Step 3: Update `studentService.ts` to query active enrollment records when resolving classroom rosters**
- [ ] **Step 4: Run tests and verify 100% pass rate**
- [ ] **Step 5: Commit changes: `feat(service): implement studentEnrollmentService with historical ledger queries`**

---

### Task 4: Client Promotion Orchestrator & Outbox Dispatcher (`studentPromotionService.ts`)

**Files:**
- Create: `src/services/studentPromotionService.ts`
- Create: `tests/studentPromotionService.test.ts`
- Modify: `src/services/messagingService.ts`

**Interfaces:**
```typescript
export interface PromotionExecutionResult {
  success: boolean;
  batchId: string;
  isIdempotentReplay: boolean;
  totalProcessed: number;
  promotedCount: number;
  graduatedCount: number;
  repeatCount: number;
  suspendedCount: number;
  transferredCount: number;
}
```

- [ ] **Step 1: Write unit tests for promotion batch execution, dry run binding, and outbox event dispatch**
- [ ] **Step 2: Implement `studentPromotionService.ts`**:
  - `runDryRun(config)`: Wraps `promotionDryRunEngine.ts` with current school roster data.
  - `executePromotion(config, decisions, executedBy)`: Calls PostgreSQL RPC `execute_student_promotion_batch`.
  - `checkRollbackEligibility(batchId)`: Queries database conflict guard before prompting user.
  - `rollbackPromotion(batchId, rollbackBy, reason)`: Calls PostgreSQL RPC `rollback_student_promotion_batch`.
- [ ] **Step 3: Implement Outbox worker for background chat group synchronization (moves students to new room groups without blocking the promotion transaction)**
- [ ] **Step 4: Run tests and verify pass rate**
- [ ] **Step 5: Commit changes: `feat(promotion): implement client promotion orchestrator and outbox worker`**

---

### Task 5: Graduation Approval Board & 4-Step Promotion Wizard Modal (`StudentPromotionModal.tsx`)

**Files:**
- Create: `src/components/settings/StudentPromotionModal.tsx`
- Modify: `src/views/SettingsBackupView.tsx`

**UI Workflow (4 Steps):**
1. **Step 1: ปีการศึกษา & ภาคเรียน (Academic Year Setup)**:
   - Current Year/Semester $\to$ Target Year/Semester (e.g. 2568/2 $\to$ 2569/1).
2. **Step 2: จับคู่ห้องเรียนเลื่อนชั้น (Classroom Mapping)**:
   - Auto-generates mapping rules (ม.1/1 $\to$ ม.2/1, ม.2/1 $\to$ ม.3/1, ม.3/1 $\to$ ม.4/1 หรือ Alumni).
   - Allows teachers/admins to customize target room destinations.
3. **Step 3: คณะกรรมการอนุมัติจบการศึกษา & ข้อยกเว้นรายบุคคล (Graduation & Exceptions)**:
   - Filter candidates for terminal grades (ม.3 และ ม.6).
   - Approval switches: `[✓ อนุมัติจบการศึกษา]` vs `[ไม่อนุมัติ / ติด 0, ร / ให้ซ้ำชั้น]`.
   - Individual exception triage for non-terminal grades: `[เลื่อนชั้นปกติ]`, `[ซ้ำชั้น]`, `[พักการเรียน]`, `[ย้ายสถานศึกษา]`.
4. **Step 4: ตรวจสอบความถูกต้อง (Pre-flight Dry Run) & ยืนยันการเลื่อนชั้น (Atomic Commit)**:
   - Visual KPI summary cards (จำนวนที่จะเลื่อนชั้น, จบการศึกษา, ซ้ำชั้น, พักการเรียน).
   - Warning banner if any student lacks classroom assignment.
   - Confirmation button with Idempotency Key generation triggering atomic database RPC.

- [ ] **Step 1: Build Step 1 (Academic Year selector) & Step 2 (Classroom Mapping matrix)**
- [ ] **Step 2: Build Step 3 (Graduation candidates table with approval toggle & exception overrides)**
- [ ] **Step 3: Build Step 4 (Dry-run review cards & Atomic Commit button with progress state)**
- [ ] **Step 4: Integrate toast notifications and reload trigger upon successful execution**
- [ ] **Step 5: Commit changes: `feat(ui): implement 4-step student promotion wizard modal with graduation gating`**

---

### Task 6: Conflict-Aware Rollback Modal (`PromotionRollbackModal.tsx`)

**Files:**
- Create: `src/components/settings/PromotionRollbackModal.tsx`
- Modify: `src/views/SettingsBackupView.tsx`

**UI Features:**
- Visual list of past promotion batches with execution timestamp, executor name, and summary counts.
- Real-time Conflict Status Check button: calls `checkRollbackEligibility(batchId)`.
- If new attendance/scores exist: shows yellow/red alert `⚠️ ไม่สามารถย้อนกลับได้โดยอัตโนมัติ เนื่องจากพบการบันทึกคะแนน/เวลาเรียนในห้องเรียนปลายทางแล้ว [ดูรายละเอียด]`.
- If clean: shows green shield `✓ ปลอดภัย สามารถย้อนกลับได้ 100%` with confirmation dialog.

- [ ] **Step 1: Build batch history list showing previous promotion operations**
- [ ] **Step 2: Add real-time conflict checking status indicator for each batch**
- [ ] **Step 3: Implement safe rollback execution trigger with explicit confirmation prompt**
- [ ] **Step 4: Commit changes: `feat(ui): implement promotion rollback modal with conflict detection guard`**

---

### Task 7: Alumni Directory & Historical Transcript Viewer (`AlumniDirectoryModal.tsx`)

**Files:**
- Create: `src/components/settings/AlumniDirectoryModal.tsx`
- Modify: `src/views/SettingsBackupView.tsx`

**UI Features:**
- Searchable alumni repository by graduation cohort year (เช่น รุ่นปีการศึกษา 2568, 2567).
- Search by student name or 5-digit student code.
- Transcript Drawer: clicking a student opens their full educational progression timeline (ม.1 $\to$ ม.2 $\to$ ม.3) showing past classroom enrollments and historical GPAs.
- MoE Compliance Badge: "ข้อมูลผลการเรียนและประวัติการศึกษาถูกจัดเก็บรักษาตามระเบียบกระทรวงศึกษาธิการ".

- [ ] **Step 1: Build alumni table querying `student_enrollments` where `status = 'GRADUATED'`**
- [ ] **Step 2: Add cohort year filter and search input**
- [ ] **Step 3: Build Historical Transcript Drawer displaying multi-year enrollment timeline**
- [ ] **Step 4: Add MoE compliance audit label**
- [ ] **Step 5: Commit changes: `feat(ui): implement alumni directory with historical transcript viewer`**

---

### Task 8: Isolated Single-Student Test Data Purge Tool (`SingleStudentPurgeModal.tsx`)

**Files:**
- Create: `src/services/studentPurgeService.ts`
- Create: `src/components/settings/SingleStudentPurgeModal.tsx`
- Create: `tests/studentPurgeService.test.ts`
- Modify: `src/views/ClassroomsRosterView.tsx`
- Modify: `src/views/SettingsBackupView.tsx`

**Core Safety Logic:**
- Solves user's core issue: "มีนักเรียนทดสอบ 1 คน เช็คชื่อไป 1 วัน... แล้วจะลบเด็กคนนี้ออกยังไงจากระบบเลย เพราะไม่ต้องการแล้ว อยากลบแค่คนเดียว".
- **Pre-flight Dependency Audit (`inspectStudentDependencies`)**:
  - Checks if student has committed official grades (`scores`), graduation approvals, or historical enrollments.
  - If official educational records exist: BLOCKS deletion and suggests marking as `TRANSFERRED_OUT` or `SUSPENDED`.
  - If only test/uncommitted attendance or draft submissions exist: permits atomic deletion of the test student, orphan attendance entries, and chat references.
- **Safety Dialog**: Requires typing "DELETE" or confirming admin password.

- [ ] **Step 1: Write unit tests in `tests/studentPurgeService.test.ts` verifying that students with official grades cannot be hard-deleted, while test students are safely purged**
- [ ] **Step 2: Implement `studentPurgeService.ts` with dependency inspection and atomic purge operations**
- [ ] **Step 3: Build `SingleStudentPurgeModal.tsx` with dependency summary and safe confirmation check**
- [ ] **Step 4: Integrate purge modal into `ClassroomsRosterView.tsx` action menu (`⋮`) for authorized administrators**
- [ ] **Step 5: Run tests and verify 100% pass rate**
- [ ] **Step 6: Commit changes: `feat(purge): implement single-student test record purge tool with dependency safety guard`**

---

### Task 9: System Integration, End-to-End Verification & Codebase Index

**Files:**
- Modify: `src/views/SettingsBackupView.tsx`
- Modify: `docs/CODEBASE_INDEX.md`

- [ ] **Step 1: Wire all modals into `SettingsBackupView.tsx` under Category 3.1 (การจัดการนักเรียน & เลื่อนชั้นเรียน)**:
  - Button `[🎓 ระบบเลื่อนชั้นเรียน & สิ้นปีการศึกษา]` $\to$ Opens `StudentPromotionModal`
  - Button `[🔄 ประวัติ & ย้อนกลับการเลื่อนชั้น (Rollback)]` $\to$ Opens `PromotionRollbackModal`
  - Button `[🏛️ ทำเนียบศิษย์เก่า (Alumni Directory)]` $\to$ Opens `AlumniDirectoryModal`
- [ ] **Step 2: Run all test suites: `npm test > scratch/test.log 2>&1`**
- [ ] **Step 3: Run TypeScript compiler: `npx tsc -b > scratch/tsc.log 2>&1`**
- [ ] **Step 4: Run production build: `npm run build > scratch/build.log 2>&1`**
- [ ] **Step 5: Re-index codebase: `node scripts/index_codebase.mjs`**
- [ ] **Step 6: Commit changes: `feat(settings): integrate promotion, rollback, alumni, and purge tools into settings dashboard`**
