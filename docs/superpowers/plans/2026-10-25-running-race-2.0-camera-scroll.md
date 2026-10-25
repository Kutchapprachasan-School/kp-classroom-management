# Running Race 2.0 (Dynamic Camera & Layout Overhaul) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the running race random picker to eliminate name tag occlusion, expand the track to a 2,400px virtual 100m world, and implement smooth 60 FPS camera tracking and parallax track scrolling.

**Architecture:** Separate student identity from the runner sprite by introducing a fixed left roster dock, define a virtual world coordinate system with distance markers (10m–100m), and implement a 3-phase smooth lerp camera that tracks the leading pack with backward-scrolling scenery.

**Tech Stack:** HTML5 Canvas, React 19, TypeScript, Web Audio API, Web Speech TTS, Tailwind CSS.

---

### Task 1: Separate Identity into Left Roster Column & Remove Occluding Floating Name Tag
**Files:**
- Modify: `src/components/live-classroom/RunningTrackArena.tsx`

- [ ] **Step 1:** Create fixed left roster column displaying lane numbers, team pastel badge, student roll number, and student name.
- [ ] **Step 2:** Remove `roundRect(-tagW/2, -44, tagW, tagH)` from Canvas runner sprite, keeping characters 100% visible and unblocked.
- [ ] **Step 3:** Enforce min lane height (50px) to prevent vertical squash on 10-lane mobile views.

---

### Task 2: Implement 2,400px Virtual World & Smooth Lerp Camera Engine
**Files:**
- Modify: `src/utils/racePhysicsEngine.ts`
- Modify: `src/components/live-classroom/RunningTrackArena.tsx`
- Test: `tests/runningRaceEngine.test.ts`

- [ ] **Step 1:** Update `racePhysicsEngine.ts` to compute world coordinates `worldX` and emit leader coordinates.
- [ ] **Step 2:** Implement 3-phase camera in `RunningTrackArena.tsx`:
  - Phase 1 (0–15%): Anchored at start line blocks.
  - Phase 2 (15–85%): Smooth Lerp tracking leader at ~45% viewport width with scrolling background.
  - Phase 3 (85–100%): Decelerate into finish line and ribbon break.
- [ ] **Step 3:** Draw distance markers (`10m`, `20m`, `30m` ... `100m FINISH`) and scrolling track lines.

---

### Task 3: Verification, Mobile Responsiveness, and Deployment
**Files:**
- Test: `tests/runningRaceEngine.test.ts`
- Test: `tests/liveClassroomEcosystem.test.ts`

- [ ] **Step 1:** Run unit tests with `npx tsx tests/runningRaceEngine.test.ts`.
- [ ] **Step 2:** Run `npx tsc -b` and `npm run build`.
- [ ] **Step 3:** Deploy to Vercel production and verify on mobile view.
