# Test Infrastructure & 4-Tier Integration Testing Architecture

> **Target Project:** โรงเรียนกุดจับประชาสรรค์ (Kutchapprachasan School Management SaaS)  
> **Repository:** `c:\dev\09 ระบบจัดการชั้นเรียน`  
> **Specification Reference:** `docs/superpowers/specs/2026-10-07-backend-ux-architecture-design.md`  
> **Authoritative User Request:** `.agents/teamwork/ORIGINAL_REQUEST.md`  
> **Status:** Authoritative Test Architecture & Operational Manual

---

## 1. Executive Testing Strategy & Principles

The E2E testing framework ensures total data integrity, reactive state synchronization, and zero-downtime dual-mode fallback across all school management modules.

### Core Testing Invariants
1. **Zero Facade Guarantee**: Tests exercise real business logic, domain services, storage persistence layers, and mathematical invariant formulas.
2. **Dual-Mode Parity**: Operations must succeed with identical behavior whether running against cloud PostgreSQL/Supabase or offline browser storage/Node memory caches.
3. **Data Loss Prohibition**: Roster mutations and student classroom transfers must preserve 100% of historical scores, work submissions, attendance logs, and student XP.
4. **Idempotence & Complete Isolation**: Every test run resets its fixture state deterministically. Test suites run independently without reliance on execution order or external state.

---

## 2. The 4-Tier Integration Testing Methodology

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TIER 4: REAL-WORLD SCENARIOS                      │
│   Full Academic Term Lifecycle: Calendar -> Assembly -> Period        │
│   -> 4 Locks -> Grading -> Transfer -> Reflections -> SGS Snapshot     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  TIER 3: CROSS-FEATURE COMBINATIONS                    │
│   Transfer + Attendance Engine | Transfer + Grade Ledger + SGS Matrix  │
│   Bell Schedule Modes + Timetable | 4-Tier Weights + SGS Invariants    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  TIER 2: BOUNDARY & CORNER CASES                       │
│   Network Failover & Timeouts | Empty Data Stores | 0 & 100 Scores     │
│   Elapsed Days Denominators (Day 1/4) | > 150KB Image Buffer Guard     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    TIER 1: CORE FEATURE COVERAGE                       │
│   R1: Dual-Mode Adapter & Event Bus  |  R2: 4-Lock Attendance Engine   │
│   R3: 0.5 Grading & SGS Export       |  R4: 6-Unit Plans & Compression │
│   R5: Chat Groups & Classroom Transfer Sync                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (>= 5 cases per feature)
- Validates the primary happy path and core contracts of all 5 architectural requirements (R1–R5).
- Each requirement contains $\ge 5$ distinct test scenarios with strict assertions against expected outputs.

### Tier 2: Boundary, Edge & Corner Cases (>= 5 cases per feature)
- Stress-tests limits, edge inputs, empty states, and abnormal execution paths.
- Verifies graceful error recovery without unhandled promise rejections, crashes, or NaN calculations.

### Tier 3: Cross-Feature Combinations
- Validates interactions between independent subsystems.
- Ensures that actions performed in one domain (e.g., student transfer) automatically trigger correct cascade updates in dependent domains (attendance engine, chat groups, grade ledgers, SGS exports).

### Tier 4: Real-World Workload Scenarios
- End-to-end multi-step simulation mirroring a full term of teacher and administrative usage.
- Steps executed in chronological sequence: school term and bell configuration, morning roll call, period class check, automated lock promotions, manual overrides, grading with 0.5 increments, classroom transfer mid-term, and official SGS end-term snapshot generation.

---

## 3. Coverage Thresholds & Requirements Mapping

| Req | Domain Feature | Tier 1 Tests | Tier 2 Tests | Tier 3 Cross-Cutting | Tier 4 E2E Flow | Minimum Threshold |
|---|---|---|---|---|---|---|
| **R1** | Universal Service Adapter & Dual-Mode Fallback | $\ge 5$ | $\ge 5$ | Adapter + Event Bus Cascade | Adapter config in full term | 100% Pass |
| **R2** | Core Academic Identity & 4-Lock Attendance Engine | $\ge 6$ | $\ge 5$ | Transfer + Attendance Correlation | Locks 1–4 sequential triggers | 100% Pass |
| **R3** | Assessment, SGS Grading & Exam Management | $\ge 6$ | $\ge 5$ | Transfer + Grade Ledger & SGS | Grading & SGS Snapshot | 100% Pass |
| **R4** | 6-Unit Lesson Plans, Curriculum & Managed Storage | $\ge 5$ | $\ge 5$ | 4-Tier Weight + SGS Invariant | 6 Units & Compressor in flow | 100% Pass |
| **R5** | Real-Time Messaging & Classroom Transfer Sync | $\ge 5$ | $\ge 5$ | Transfer + Chat + Grades + Attendance | Mid-term transfer execution | 100% Pass |

---

## 4. Test Runner Architecture & Execution Protocol

### Single Execution Command
The programmatic test suite is completely self-contained and executed via:

```bash
node test_backend_ux_integration.mjs
```

### Environment Agility
- Seamlessly runs in Node.js 24+ with TypeScript ESM execution via `npx tsx` spawning if needed.
- Mocks browser runtime APIs (`window`, `localStorage`, `CustomEvent`) to enable dual-mode testing in pure Node environments without requiring headless browsers.
- Automatically handles test fixtures and resets state after each test suite execution.

### Diagnostic Reporting
- Tests output formatted hierarchical test reports with clear pass (`✓`) or fail (`✗`) symbols.
- Upon any invariant failure, `assert` emits full mismatch diffs and descriptive failure messages indicating the exact invariant violated.
- Exits with status `0` upon full completion, or non-zero status on any defect.

---

## 5. Directory & File Reference

- **Test Architecture Specification**: `TEST_INFRA.md` (this file)
- **Programmatic Integration Test Suite**: `test_backend_ux_integration.mjs`
- **Readiness Declaration & Coverage Summary**: `TEST_READY.md`
- **Domain Services Tested**:
  - `src/lib/supabase.ts`
  - `src/services/attendanceCorrelationService.ts`
  - `src/services/sgsExportService.ts`
  - `src/services/scoreService.ts`
  - `src/services/messagingService.ts`
  - `src/services/bellScheduleService.ts`
  - `src/services/academicCalendarService.ts`
  - `src/services/sgsRosterAndSubmissionService.ts`
  - `src/services/studentService.ts`
  - `src/utils/imageCompressor.ts`
  - `src/views/LessonPlansView.tsx`
