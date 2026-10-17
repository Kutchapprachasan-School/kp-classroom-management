# Specification: Student Enrollment History & Transactional Promotion RPC Engine

**Date:** 2026-10-17  
**Status:** DRAFT (Submitted for Senior Backend Review)  
**Database:** PostgreSQL (Supabase)  
**Compliance Target:** OBEC Ministry of Education Regulations & Acid Guarantees  

---

## 1. Context & Architectural Verdict

Following the Senior Backend Review verdict (Option A: Supabase Postgres RPC), this specification defines the database architecture for:
1. **Enrollment History**: Transitioning from a single ephemeral pointer (`students.classroom_id`) to an immutable historical relation (`student_enrollments`).
2. **Transactional Promotion RPC**: `execute_student_promotion_batch` executing multi-student transitions, closing old enrollments, creating new enrollments, writing batch audit items, and maintaining idempotency within a single ACID transaction.
3. **Conflict-Aware Rollback RPC**: `rollback_student_promotion_batch` validating that target enrollments have not accumulated scores or attendance before restoring prior state.

---

## 2. Relational Schema & Single Source of Truth

### 2.1 The Two-Tier Enrollment Architecture

```
[student_enrollments] (Authoritative Historical Ledger)
  - id (UUID PK)
  - student_id -> students(id)
  - classroom_id -> classrooms(id)
  - term_id -> academic_terms(id)
  - academic_year (INT)
  - semester_no (INT)
  - status (ACTIVE, COMPLETED, REPEAT_GRADE, SUSPENDED, TRANSFERRED_OUT, GRADUATED)
  - start_date / end_date / gpa

[students] (Denormalized Active Pointer)
  - id (UUID PK)
  - student_code (UNIQUE per school)
  - classroom_id -> classrooms(id) [POINTER to current active room; NULL when graduated/suspended]
```

**Single Source of Truth Invariant:**
- `student_enrollments` is the immutable source of truth.
- `students.classroom_id` is a denormalized active pointer for fast queries and backwards compatibility.
- At any point in time, a student has **at most ONE active enrollment**:
  ```sql
  CREATE UNIQUE INDEX idx_student_single_active_enrollment 
  ON student_enrollments(student_id) 
  WHERE status = 'ACTIVE';
  ```

### 2.2 Promotion Batch & Batch Items

```
[promotion_batches]
  - id (UUID PK)
  - idempotency_key (UNIQUE TEXT)
  - from_term_id / to_term_id
  - from_year / to_year
  - status (COMMITTED, ROLLED_BACK, FAILED)
  - executed_by -> users(id)
  - executed_at / rollback_at / rollback_by / rollback_reason
  - summary (JSONB)

[promotion_batch_items]
  - id (UUID PK)
  - batch_id -> promotion_batches(id)
  - student_id -> students(id)
  - previous_enrollment_id -> student_enrollments(id)
  - previous_classroom_id -> classrooms(id)
  - action (PROMOTED, REPEAT_GRADE, SUSPENDED, TRANSFERRED_OUT, GRADUATED)
  - new_enrollment_id -> student_enrollments(id)
  - new_classroom_id -> classrooms(id)
  - graduation_approved (BOOLEAN)
  - graduation_approved_by -> users(id)
  - graduation_approved_at (TIMESTAMPTZ)
```

---

## 3. Backfill Strategy (Pre-requisite to Live Transition)

Before the promotion engine is activated in production, existing students mapped to `students.classroom_id` must be seeded with their initial `ACTIVE` enrollment record:

```sql
INSERT INTO student_enrollments (
    id, school_id, student_id, classroom_id, term_id,
    academic_year, semester_no, seat_no, status, start_date
)
SELECT 
    'enr_' || s.id || '_' || v_default_term_id,
    s.school_id,
    s.id,
    s.classroom_id,
    v_default_term_id,
    v_default_year,
    v_default_sem,
    s.seat_no,
    'ACTIVE'::enrollment_status_type,
    CURRENT_DATE
FROM students s
WHERE s.classroom_id IS NOT NULL
ON CONFLICT (student_id, term_id) DO NOTHING;
```

**Pre-flight Backfill Quality Checks:**
1. Identify students with `classroom_id IS NULL` (unassigned/transferred).
2. Identify duplicate student codes across classrooms.
3. Validate that all classrooms link to a valid `term_id`.

---

## 4. PostgreSQL RPC Specification

### 4.1 `execute_student_promotion_batch`

```sql
execute_student_promotion_batch(
    p_idempotency_key TEXT,
    p_from_term_id TEXT,
    p_to_term_id TEXT,
    p_items JSONB,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB
```

**Transactional Steps:**
1. **Security Definer & Authorization:**
   - Reads `auth.uid()`.
   - Confirms caller role is strictly `ADMIN` or `DIRECTOR` from `users` table. Rejects client-spoofed claims.
2. **Idempotency Verification:**
   - Queries `promotion_batches` by `p_idempotency_key`.
   - If present, returns the existing batch result immediately with `isIdempotentReplay: true`.
3. **Pessimistic Concurrency (Row-Level Locking):**
   - Locks all affected `students` rows with `FOR UPDATE`.
   - Locks active `student_enrollments` rows with `FOR UPDATE`.
4. **State Transition Loop:**
   - Closes previous enrollment (`status = 'COMPLETED'`, `end_date = CURRENT_DATE`).
   - If `action = 'GRADUATED'`: Requires `graduationApproved: true` and approver ID. Updates student pointer `classroom_id = NULL`.
   - If `action = 'PROMOTED' | 'REPEAT_GRADE'`: Inserts new `student_enrollments` record with status `ACTIVE`. Updates `students.classroom_id = target_classroom_id`.
   - If `action = 'SUSPENDED' | 'TRANSFERRED_OUT'`: Updates student pointer `classroom_id = NULL`.
   - Appends detailed item to `promotion_batch_items`.
5. **Atomicity:**
   - If any student is missing, unmapped, or fails a constraint, PostgreSQL rolls back the entire transaction.

---

### 4.2 `rollback_student_promotion_batch`

```sql
rollback_student_promotion_batch(
    p_batch_id TEXT,
    p_rollback_reason TEXT DEFAULT 'Administrative rollback'
) RETURNS JSONB
```

**Conflict Detection Guard:**
- Before reverting, checks:
  ```sql
  SELECT count(*) FROM scores WHERE enrollment_id IN (
      SELECT new_enrollment_id FROM promotion_batch_items WHERE batch_id = p_batch_id
  );
  ```
- If scores or attendance have been created on any new enrollment, **the rollback is rejected** with error `CONFLICT_DETECTED` to prevent silent grade corruption.

---

## 5. Client Integration Architecture

```
[UI Promotion Wizard]
       |
       v (Dry Run Phase)
[promotionDryRunEngine.ts] (Pure Function, Zero Writes)
       |
       v (User Reviews & Confirms)
[Supabase Client] -> supabase.rpc('execute_student_promotion_batch', { ... })
       |
       v (PostgreSQL Atomic Transaction)
[PostgreSQL Database] -> Closes old enrollments -> Creates new enrollments -> Records batch
```
