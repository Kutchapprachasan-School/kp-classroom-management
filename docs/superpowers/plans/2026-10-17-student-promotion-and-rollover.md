# Student Grade Promotion & Academic Rollover Implementation Plan (Revised v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an enterprise-grade, transactional Student Grade Promotion & Academic Rollover System (ระบบเลื่อนชั้นเรียน & สิ้นปีการศึกษา) with explicit enrollment lifecycle management, multi-step batch tracking with conflict-aware rollback, dedicated graduation approval, outbox event dispatching, and isolated test-data purge controls.

**Architecture:** 
- `StudentEnrollmentRecord` formalizes student-classroom relationships per academic year/term, anchoring `ScoreRecord.enrollmentId` without mutating historical enrollments.
- `PromotionBatch` and `PromotionBatchItem` enforce transactional atomicity, idempotency, and state history.
- Pre-flight validation runs dry-runs before committing.
- Graduating students (ม.3 & ม.6) require explicit academic board approval before moving to `GRADUATED` status in the Alumni Directory.
- External side-effects (chat group sync) are decoupled via an Outbox Event Queue.
- Single-student deletion is strictly decoupled into a dedicated `studentPurgeService` with pre-flight dependency inspection, restricted to uncommitted or test data.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite, Vitest, MingCute Icons (`@mingcute/react`), Lucide React.

## Global Constraints
- Strictly adhere to Pastel Anime Education Dashboard master design system: `#3B82F6` Primary, `#163A66` Text Primary, Card radius `18px`, Button radius `12px`.
- Thai-first typography using `'Prompt'` font.
- Historical scores, submissions, and attendance records MUST NEVER be mutated or deleted during promotion.
- Older enrollments must be closed (`status: 'COMPLETED'`) and new enrollments created for the destination academic year.
- Rollback must detect post-promotion changes in the target classroom and block blind overwrites.
- Single-student purge must be an independent administrative tool with dependency checks.

---

## File Structure

### Data Models & Services Layer
- Create: `src/services/studentEnrollmentService.ts`
  - Defines `StudentEnrollmentRecord`, manages active vs historical enrollments, connects with `ScoreRecord.enrollmentId`.
- Create: `src/services/studentPromotionService.ts`
  - Core transactional promotion engine: batch execution, pre-flight dry run, conflict-aware rollback, outbox event dispatch.
- Create: `src/services/studentPurgeService.ts`
  - Isolated administrative tool for single-student test data purge with full audit trail and dependency safety guard.
- Create: `tests/studentPromotionService.test.ts`
  - Unit tests for batch execution, idempotency, conflict detection on rollback, and graduation gating.
- Create: `tests/studentPurgeService.test.ts`
  - Unit tests for dependency checks (blocks purge if student has locked educational records unless forced by admin).
- Modify: `src/services/cleanSlateService.ts`
  - Register new storage keys: `kp_student_enrollments`, `kp_promotion_batches`, `kp_alumni_directory`, `kp_outbox_events`.

### UI Components & Modals
- Create: `src/components/settings/StudentPromotionModal.tsx`
  - 4-step wizard: (1) Year Setup, (2) Class Mapping, (3) Graduation Approval & Exception Roster, (4) Pre-flight Validation & Transaction Commit.
- Create: `src/components/settings/PromotionRollbackModal.tsx`
  - Rollback manager displaying batch history, conflict status check, and safe rollback trigger.
- Create: `src/components/settings/AlumniDirectoryModal.tsx`
  - Searchable alumni repository by cohort year, graduation status, transcript view, and MoE retention compliance.
- Create: `src/components/settings/SingleStudentPurgeModal.tsx`
  - Controlled administrative dialog for purging test records with explicit impact audit.
- Modify: `src/views/SettingsBackupView.tsx`
  - Connect Promotion Wizard, Rollback Manager, Alumni Directory, and Purge Tool into Category 3.1.
- Modify: `src/views/ClassroomsRosterView.tsx`
  - Link single-student purge dialog to student action menu for authorized roles.

---

## Task Decomposition

### Task 1: Student Enrollment Model & Lifecycle Service (`studentEnrollmentService`)

**Files:**
- Create: `src/services/studentEnrollmentService.ts`
- Create: `tests/studentEnrollmentService.test.ts`
- Modify: `src/services/studentService.ts`

**Interfaces:**
```typescript
export type EnrollmentStatus = 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'REPEAT_GRADE' 
  | 'SUSPENDED' 
  | 'TRANSFERRED_OUT' 
  | 'GRADUATED';

export interface StudentEnrollmentRecord {
  id: string; // e.g. 'enr_47001_2568_2'
  studentCode: string;
  studentId: string;
  studentName: string;
  academicYear: number; // e.g. 2568
  semesterNo: number;   // 1 or 2
  classroomId: string;  // e.g. 'room-1-1'
  classroomName: string;// e.g. 'ม.1/1'
  seatNo: number;
  status: EnrollmentStatus;
  startDate: string;
  endDate?: string;
  gpa?: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 1: Write failing tests for enrollment creation, closing old enrollments, and querying historical enrollments**
- [ ] **Step 2: Implement `studentEnrollmentService.ts` with local storage persistence (`kp_student_enrollments`) and initial seed generation from existing classrooms**
- [ ] **Step 3: Connect `studentService.ts` to query active enrollment for classroom rosters**
- [ ] **Step 4: Run tests and verify 100% pass rate**
- [ ] **Step 5: Commit changes: `feat(enrollment): implement studentEnrollmentService with immutable historical lifecycle`**

---

### Task 2: Transactional Promotion Engine & Conflict-Aware Rollback (`studentPromotionService`)

**Files:**
- Create: `src/services/studentPromotionService.ts`
- Create: `tests/studentPromotionService.test.ts`
- Modify: `src/services/cleanSlateService.ts`

**Interfaces:**
```typescript
export interface PromotionBatchItem {
  id: string;
  studentCode: string;
  studentName: string;
  sourceClassroomId: string;
  sourceClassroomName: string;
  previousEnrollmentId: string;
  action: 'PROMOTED' | 'REPEAT_GRADE' | 'SUSPENDED' | 'TRANSFERRED_OUT' | 'GRADUATED';
  targetClassroomId?: string;
  targetClassroomName?: string;
  newEnrollmentId?: string;
  graduationApproved?: boolean;
  notes?: string;
}

export interface PromotionBatch {
  id: string; // batch_uuid
  idempotencyKey: string;
  fromYear: number;
  fromSemester: number;
  toYear: number;
  toSemester: number;
  status: 'PREVIEW' | 'COMMITTED' | 'ROLLED_BACK';
  executedBy: string;
  executedAt: string;
  items: PromotionBatchItem[];
  outboxDispatched: boolean;
  notes?: string;
}

export interface PromotionDryRunResult {
  isValid: boolean;
  conflicts: string[];
  summary: {
    totalEligible: number;
    promotedCount: number;
    graduatedCount: number;
    repeatCount: number;
    suspendedCount: number;
    transferredCount: number;
  };
  previewItems: PromotionBatchItem[];
}
```

- [ ] **Step 1: Write failing tests for dry run validation, batch commit, idempotency guard, and conflict detection on rollback**
- [ ] **Step 2: Implement `dryRunPromotion()` verifying missing target classrooms and graduation criteria**
- [ ] **Step 3: Implement atomic `executePromotionBatch()`: closes old enrollments, creates new enrollments, writes `PromotionBatch`, and enqueues OutboxEvent**
- [ ] **Step 4: Implement `rollbackPromotionBatch()`: inspects target classrooms for post-batch activity, aborts if conflict detected, or safely restores previous enrollment status**
- [ ] **Step 5: Run tests and verify all test cases pass**
- [ ] **Step 6: Commit changes: `feat(promotion): implement transactional promotion engine with batch tracking and safe rollback`**

---

### Task 3: Outbox Event Queue for Chat and External Sync

**Files:**
- Modify: `src/services/studentPromotionService.ts`
- Modify: `src/services/messagingService.ts`

- [ ] **Step 1: Define `OutboxEvent` schema (`id`, `eventType`, `payload`, `status: 'PENDING' | 'DISPATCHED' | 'FAILED'`, `attempts`, `createdAt`)**
- [ ] **Step 2: Implement `processOutboxEvents()` to update chat groups in the background after the promotion transaction is committed**
- [ ] **Step 3: Add error resilience so chat sync retries without affecting enrollment data**
- [ ] **Step 4: Commit changes: `feat(outbox): implement decoupled outbox worker for chat group synchronization`**

---

### Task 4: Graduation Approval & 4-Step Promotion Wizard Modal (`StudentPromotionModal`)

**Files:**
- Create: `src/components/settings/StudentPromotionModal.tsx`
- Create: `src/components/settings/PromotionRollbackModal.tsx`

- [ ] **Step 1: Step 1 (Academic Year & Semester Selection)**: Source year/term $\to$ Target year/term with auto-detection from `academicCalendarService`.
- [ ] **Step 2: Step 2 (Classroom Mapping Configuration)**: Dynamic room mappings with destination selectors and "Final Grade" detection.
- [ ] **Step 3: Step 3 (Graduation Approval & Exception Triage)**:
  - Table of graduating candidates (ม.3 & ม.6) with status checkboxes: `[✓ อนุมัติจบการศึกษา]` vs `[ไม่อนุมัติ / ติด 0,ร / ซ้ำชั้น]`.
  - Individual exception selector for lower grades: `[เลื่อนชั้นตามปกติ]`, `[ซ้ำชั้น (ขึ้นทะเบียนห้องเดิมในปีการศึกษาใหม่)]`, `[พักการเรียน]`, `[ย้ายออก]`.
- [ ] **Step 4: Step 4 (Pre-flight Validation & Atomic Commit)**:
  - Runs `dryRunPromotion()`. Shows green checklist if valid or red warnings if conflicts exist.
  - Generates Idempotency Key and executes batch.
- [ ] **Step 5: Rollback Modal**: Shows recent promotion batches with "ตรวจสอบ Conflict" and "ย้อนกลับข้อมูลเดิม".
- [ ] **Step 6: Commit changes: `feat(ui): add graduation approval, promotion wizard, and rollback manager modals`**

---

### Task 5: Alumni Directory & Retention Compliance Modal (`AlumniDirectoryModal`)

**Files:**
- Create: `src/components/settings/AlumniDirectoryModal.tsx`

- [ ] **Step 1: Query graduated enrollments (`status: 'GRADUATED'`) without touching active classroom rosters**
- [ ] **Step 2: Filter by graduation year, search by student name/code, display completion GPA and date**
- [ ] **Step 3: Student Academic Transcript Drawer showing all historical enrollments (ม.1, ม.2, ม.3...) and GPA progression**
- [ ] **Step 4: Compliance notice: Educational records are preserved in accordance with Ministry of Education regulations**
- [ ] **Step 5: Commit changes: `feat(alumni): implement alumni directory with historical transcripts and compliance notice`**

---

### Task 6: Isolated Single-Student Test Data Purge Service & Modal (`studentPurgeService`)

**Files:**
- Create: `src/services/studentPurgeService.ts`
- Create: `src/components/settings/SingleStudentPurgeModal.tsx`
- Modify: `src/views/ClassroomsRosterView.tsx`

- [ ] **Step 1: Implement `studentPurgeService.ts` with dependency audit (`inspectStudentDependencies`)**:
  - Checks if student has committed scores, historical enrollments, or attendance.
  - Requires explicit admin role confirmation (`isAdmin: true`) and audit reason.
- [ ] **Step 2: Implement atomic purge for verified test students**:
  - Removes student from current roster, cleans uncommitted test attendance, test submissions, and chat records.
  - Logs action in `cls_score_audit_data` / audit log.
- [ ] **Step 3: Create `SingleStudentPurgeModal.tsx` with clear warnings and confirmation typing requirement ("DELETE")**
- [ ] **Step 4: Connect to `ClassroomsRosterView.tsx` student action menu (`⋮`)**
- [ ] **Step 5: Commit changes: `feat(purge): implement isolated test student purge service and confirmation modal`**

---

### Task 7: Settings Integration, E2E Verification & Deployment

**Files:**
- Modify: `src/views/SettingsBackupView.tsx`

- [ ] **Step 1: Wire all components into `SettingsBackupView.tsx` (Category 3.1 ข้อมูลนักเรียน)**
- [ ] **Step 2: Run all unit tests (`npm test`)**
- [ ] **Step 3: Run TypeScript compiler (`npx tsc -b`)**
- [ ] **Step 4: Run production build (`npm run build`)**
- [ ] **Step 5: Update codebase index (`node scripts/index_codebase.mjs`)**
- [ ] **Step 6: Commit, push to GitHub, and deploy to Vercel production**
