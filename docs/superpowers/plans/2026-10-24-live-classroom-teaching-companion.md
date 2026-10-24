# Live Classroom Teaching Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างหน้าเครื่องมือตอนสอนสดในชั้นเรียน (`LiveClassroomView.tsx`) ครบทั้ง 4 แท็บย่อย (สุ่มชื่อ, ตอบคำถามจับเวลา, แบ่งกลุ่มสมดุล, บอร์ดรางวัลกาชา) พร้อมระบบ Optimistic Rewards, Web Audio API, โหมดฉายจอโปรเจกเตอร์, และปุ่มลัด Spacebar/F/M โดยดึงข้อมูลห้องเรียนและนักเรียนจริง 100% (Zero Mock)

**Architecture:** Vite React SPA Architecture เชื่อมต่อข้อมูลจริงผ่าน `classroomService`, `sgsRosterAndSubmissionService`, และ `gachaService` ขับเคลื่อน UI ด้วยระบบ Optimistic UI Hook (`useOptimisticRewards`) และแยกคอมโพเนนต์ย่อยเป็น 5 ส่วนตามหลัก Single Responsibility

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `@mingcute/react` / `lucide-react`, Web Audio API, Vite

## Global Constraints

- **Strict Zero Mock Policy**: ห้ามมี Hardcoded Dummy Arrays หรือชื่อนักเรียนสมมุติในโค้ด ต้องดึงจาก `classroomService` / `sgsRosterAndSubmissionService` เท่านั้น หากไม่มีข้อมูลให้แสดงเป็น Empty State
- **Zero-Egress Optimization**: จัดเก็บประวัติคาบเรียน (Session Ledger) ไว้ใน `sessionStorage` และ Local State โดยไม่ยิง Polling เข้า Neon Database
- **Audio Reliability**: สังเคราะห์เสียงผ่าน Web Audio API เท่านั้น ห้ามพึ่งพาไฟล์เสียง MP3/WAV ภายนอก
- **Design System**: สไตล์ Pastel Anime Education Dashboard (Prompt, Border Radius 18px, Primary `#3B82F6`, Background `#F7FAFF`) พร้อมโหมดฉายโปรเจกเตอร์ความคมชัดสูง
- **Platform**: Vite React SPA (ห้ามใช้ Next.js router หรือ `"use client"`)

---

### Task 1: Web Audio Sound Engine (`WebAudioSoundEngine.ts`)

**Files:**
- Create: `src/services/soundFXEngine.ts`
- Test: `tests/liveClassroomEcosystem.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export class SoundFXEngine {
    playTick(freq?: number, duration?: number): void;
    playCoin(): void;
    playFanfare(): void;
    playBuzzer(): void;
  }
  export const soundFX: SoundFXEngine;
  ```

- [ ] **Step 1: เขียน Unit Test สำหรับ SoundFXEngine**
  ทดสอบการสร้าง AudioContext, การเรียกเสียง tick, coin, fanfare, buzzer และการทำงานใน Node/Browser environment fallback
- [ ] **Step 2: รันเทสต์เพื่อยืนยันว่า fail**
  `npx tsx tests/liveClassroomEcosystem.test.ts`
- [ ] **Step 3: พัฒนา `src/services/soundFXEngine.ts`**
  พัฒนา SoundFXEngine ด้วย Web Audio API ที่ปลอดภัยต่อ SSR/Headless (ตรวจสอบ `typeof window !== 'undefined'`)
- [ ] **Step 4: รันเทสต์และยืนยันว่า pass**
  `npx tsx tests/liveClassroomEcosystem.test.ts`
- [ ] **Step 5: Commit**
  `git add src/services/soundFXEngine.ts tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add soundFXEngine using Web Audio API"`

---

### Task 2: Optimistic Rewards & Offline Retry Queue Hook (`useOptimisticRewards.ts`)

**Files:**
- Create: `src/hooks/useOptimisticRewards.ts`
- Modify: `src/services/gachaService.ts` (ตรวจสอบและเชื่อมโยง event sync)
- Test: `tests/liveClassroomEcosystem.test.ts`

**Interfaces:**
- Consumes: `gachaService.addCoins`, `gachaService.addTickets`, `soundFX`
- Produces:
  ```typescript
  export type SyncStatus = 'syncing' | 'synced' | 'queued' | 'error';
  export interface RewardBatch {
    id: string;
    classroomId: string;
    rewardType: 'coin' | 'ticket';
    amount: number;
    description: string;
    targetStudentIds: string[];
    isRevoked: boolean;
    createdAt: string;
    syncStatus: SyncStatus;
  }
  export function useOptimisticRewards(props: {
    classroomId: string;
    onUpdateBalances: (studentIds: string[], type: 'coin' | 'ticket', delta: number) => void;
    onPlaySound?: (type: 'coin' | 'buzzer') => void;
  }): {
    ledger: RewardBatch[];
    setInitialLedger: (serverLedger: RewardBatch[]) => void;
    toast: { message: string; variant?: 'success' | 'warning' | 'error' } | null;
    isOnline: boolean;
    pendingQueueCount: number;
    isFlushingQueue: boolean;
    flushOfflineQueue: () => Promise<void>;
    giveReward: (studentIds: string[], type: 'coin' | 'ticket', amount: number, desc: string) => Promise<void>;
    undoReward: (batch: RewardBatch) => Promise<void>;
  };
  ```

- [ ] **Step 1: เขียน Unit Test สำหรับ Offline Queue, Smart Offline Undo, และ FIFO Flush**
  ทดสอบการนำเข้ารายการเมื่อเน็ตหลุด (syncStatus: queued), การตัดรายการออกจากคิวทันทีเมื่อกด Undo ตอนออฟไลน์, และการ flush คิวตามลำดับ FIFO
- [ ] **Step 2: รันเทสต์เพื่อยืนยันผล**
- [ ] **Step 3: พัฒนา `src/hooks/useOptimisticRewards.ts`**
  สร้าง hook รองรับ Optimistic Update, ตรวจจับ `navigator.onLine`, คิว `localStorage`, การกู้คืนยอดเมื่อ refresh, FIFO queue worker, และระบบ Smart Offline Undo
- [ ] **Step 4: ตรวจสอบเทสต์ให้ผ่านทั้งหมด**
- [ ] **Step 5: Commit**
  `git add src/hooks/useOptimisticRewards.ts tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add useOptimisticRewards hook with offline retry queue and smart undo"`

---

### Task 2.5: Live Classroom Data Service & Tier Engine (`liveClassroomService.ts`)

**Files:**
- Create: `src/services/liveClassroomService.ts`
- Test: `tests/liveClassroomEcosystem.test.ts`

**Interfaces:**
- Consumes: `classroomService`, `sgsRosterAndSubmissionService`, `gachaService`, `attendanceService`
- Produces:
  ```typescript
  export function getThailandTodayRange(): { startOfDayUTC: Date; endOfDayUTC: Date };
  export function calculateStudentTierMap(
    students: { id: string; totalCoins: number; totalTickets: number }[]
  ): Record<string, 'high' | 'mid' | 'low'>;
  export const liveClassroomService: {
    loadClassroomsData: () => Promise<LiveClassroomData[]>;
    toggleAttendance: (classroomId: string, studentId: string, nextPresent: boolean) => Promise<{ success: boolean; present: boolean }>;
  };
  ```

- [ ] **Step 1: เขียน Unit Test สำหรับ `calculateStudentTierMap`, `getThailandTodayRange` และ First-Toggle Initialization**
  ทดสอบการจัด Tier แบ่งตามเปอร์เซ็นไทล์ 33%/34%/33%, การเกลี่ยสลับเมื่อคะแนน 0 เท่ากันทั้งหมด, การกู้คืน session ledger, และการป้องกันบั๊กนักเรียนคนอื่นกลายเป็นขาดเรียนเมื่อกดสลับคนแรก
- [ ] **Step 2: พัฒนา `src/services/liveClassroomService.ts`**
  สร้างฟังก์ชันคำนวณ Tier อัตโนมัติ, ตรวจสอบสถานะมาเรียน (Fallback: present=true ถ้ายังไม่ได้เช็ก), ระบบ `toggleAttendance` ที่มี First-Toggle Initialization, และการรวบรวมข้อมูลห้องเรียนจริง
- [ ] **Step 3: ตรวจสอบเทสต์ให้ผ่าน**
- [ ] **Step 4: Commit**
  `git add src/services/liveClassroomService.ts tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add liveClassroomService with auto-tier percentile, first-toggle init, and session recovery"`

---

### Task 3: คอมโพเนนต์ส่วนหัวและเครื่องมือควบคุม (`LiveClassroomHeader.tsx`)

**Files:**
- Create: `src/components/live-classroom/LiveClassroomHeader.tsx`

**Interfaces:**
- Consumes: MingCute & Lucide icons, `SoundFXEngine`
- Produces:
  ```typescript
  export interface LiveClassroomHeaderProps {
    classrooms: { id: string; name: string; subject: string }[];
    selectedClassId: string;
    onSelectClassId: (id: string) => void;
    presentCount: number;
    totalCount: number;
    sessionCoins: number;
    sessionTickets: number;
    soundEnabled: boolean;
    onToggleSound: () => void;
    isProjectorMode: boolean;
    onToggleProjector: () => void;
    activeTab: 'picker' | 'timer' | 'groups' | 'rewards';
    onChangeTab: (tab: 'picker' | 'timer' | 'groups' | 'rewards') => void;
  }
  ```

- [ ] **Step 1: สร้าง `src/components/live-classroom/LiveClassroomHeader.tsx`**
  ประกอบด้วย Brand Header, Dropdown เลือกห้องเรียน, Badges สถิติมาเรียน, Ledger Counter, สวิตช์เสียง Mute, ปุ่ม Fullscreen Toggle, และ Navigation Tabs ทั้ง 4 แท็บ
- [ ] **Step 2: ตรวจสอบการรองรับธีมปกติและธีมฉายโปรเจกเตอร์**
- [ ] **Step 3: Commit**
  `git add src/components/live-classroom/LiveClassroomHeader.tsx && git commit -m "feat: add LiveClassroomHeader component"`

---

### Task 4: แท็บที่ 1 — 🎯 สุ่มชื่อนักเรียน (`RandomPickerSubTab.tsx`)

**Files:**
- Create: `src/components/live-classroom/RandomPickerSubTab.tsx`
- Test: `tests/liveClassroomEcosystem.test.ts` (ทดสอบตรรกะ No-Repeat สุ่มไม่ซ้ำ และการคืนชื่อเมื่อกด Skip)

**Interfaces:**
- Consumes: `Student`, `SoundFXEngine`
- Produces:
  ```typescript
  export interface RandomPickerSubTabProps {
    students: Student[];
    isProjectorMode: boolean;
    onGiveReward: (studentId: string, type: 'coin' | 'ticket', amount: number, desc: string) => void;
    onPlaySound: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  }
  ```

- [ ] **Step 1: เขียนเทสต์ตรรกะ No-Repeat และการคืนชื่อเมื่อกด Skip**
- [ ] **Step 2: พัฒนา `src/components/live-classroom/RandomPickerSubTab.tsx`**
  รองรับโหมด Slot Reel (หมุนชะลอความเร็ว 22 สเต็ป) และ Card Flip, สวิตช์ไม่สุ่มซ้ำในคาบ, ปุ่มข้าม/ไม่อยู่, และ Instant Action Dock (+1🪙, +3🪙, +1🎟️)
- [ ] **Step 3: ตรวจสอบ Empty State กรณีห้องเรียนไม่มีนักเรียน**
- [ ] **Step 4: Commit**
  `git add src/components/live-classroom/RandomPickerSubTab.tsx tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add RandomPickerSubTab component with slot and card modes"`

---

### Task 5: แท็บที่ 2 — ⏱️ ตอบคำถามสด & ท้าดวล (`LiveTimerSubTab.tsx`)

**Files:**
- Create: `src/components/live-classroom/LiveTimerSubTab.tsx`

**Interfaces:**
- Consumes: `Student`, `SoundFXEngine`
- Produces:
  ```typescript
  export interface LiveTimerSubTabProps {
    students: Student[];
    isProjectorMode: boolean;
    onGiveReward: (studentId: string, type: 'coin' | 'ticket', amount: number, desc: string) => void;
    onPlaySound: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  }
  ```

- [ ] **Step 1: พัฒนา `src/components/live-classroom/LiveTimerSubTab.tsx`**
  สร้าง Projector Countdown Timer พร้อมแถบ Progress Bar เปลี่ยนสี (เขียว ➔ ส้ม ➔ แดงกะพริบ 10 วิสุดท้าย), ปุ่มเพิ่มเวลาด่วน (+30วิ, +1น, +3น, +5น), และโหมดท้าดวล (Versus Arena 2-4 คน) พร้อมปุ่มแจกเหรียญผู้ชนะ
- [ ] **Step 2: ตรวจสอบการกด Spacebar เพื่อเริ่ม/พักจับเวลา**
- [ ] **Step 3: Commit**
  `git add src/components/live-classroom/LiveTimerSubTab.tsx && git commit -m "feat: add LiveTimerSubTab with countdown and versus arena"`

---

### Task 6: แท็บที่ 3 — 👥 แบ่งกลุ่มกิจกรรม (`GroupGeneratorSubTab.tsx`)

**Files:**
- Create: `src/components/live-classroom/GroupGeneratorSubTab.tsx`
- Test: `tests/liveClassroomEcosystem.test.ts` (ทดสอบตรรกะการแบ่งกลุ่ม เกลี่ยเศษเท่ากัน, คละระดับ Tiers, และการบันทึก/โหลด Group Presets)

**Interfaces:**
- Consumes: `Student`, `SoundFXEngine`, `liveClassroomService`
- Produces:
  ```typescript
  export interface GroupPresetItem {
    id: string;
    classroomId: string;
    presetName: string;
    groupsData: StudentGroup[];
    createdAt: string;
  }
  export interface GroupGeneratorSubTabProps {
    students: Student[];
    classroomId: string;
    isProjectorMode: boolean;
    onGiveRewardGroup: (studentIds: string[], groupName: string) => void;
    onPlaySound: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
    onNotifyToast?: (message: string) => void;
  }
  ```

- [ ] **Step 1: เขียน Unit Test สำหรับ Grouping Algorithms และ Group Presets**
  ทดสอบการแบ่งตามจำนวนกลุ่ม, แบ่งตามจำนวนคน, การเกลี่ยเศษ, การคละ Tiers (high, mid, low), และการบันทึก/โหลด Preset
- [ ] **Step 2: พัฒนา `src/components/live-classroom/GroupGeneratorSubTab.tsx`**
  รองรับการสุ่มหัวหน้ากลุ่ม 👑, การคลิกสลับสมาชิก 2 คนต่างกลุ่มแบบฉับพลัน (Swap), ปุ่มแจกเหรียญยกกลุ่ม (+1 🪙 ยกกลุ่ม), และแผงควบคุม Group Presets (ช่องตั้งชื่อ + ปุ่มบันทึกกลุ่มไว้ใช้ซ้ำ + เมนูดรอปดาวน์เลือกโหลดกลุ่มเดิม)
- [ ] **Step 3: ตรวจสอบเทสต์ให้ผ่าน**
- [ ] **Step 4: Commit**
  `git add src/components/live-classroom/GroupGeneratorSubTab.tsx tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add GroupGeneratorSubTab with balanced grouping, quick swap, and group presets"`

---

### Task 7: แท็บที่ 4 — 🏆 บอร์ดรางวัลและสรุปผลคาบเรียน (`RewardBoardSubTab.tsx`)

**Files:**
- Create: `src/components/live-classroom/RewardBoardSubTab.tsx`

**Interfaces:**
- Consumes: `Student`, `RewardBatch`
- Produces:
  ```typescript
  export interface RewardBoardSubTabProps {
    students: Student[];
    ledger: RewardBatch[];
    sessionTotalTickets: number;
    onOpenLuckyDraw: () => void;
    onUndo: (batch: RewardBatch) => void;
    onGiveClassBonus: () => void;
  }
  ```

- [ ] **Step 1: พัฒนา `src/components/live-classroom/RewardBoardSubTab.tsx`**
  สร้างกระดานจัดอันดับดาวเด่นประจำคาบ (Top 8 Earners) พร้อมเหรียญรางวัล 🥇🥈🥉, แสดงประวัติการแจกรางวัลในคาบ (Session Log) พร้อมปุ่ม Undo และ Badge สถานะการซิงค์, ปุ่มแจกโบนัสทั้งห้อง (+1 🪙 ทุกคนที่มาเรียน), และปุ่มเปิด "🎰 หมุนวงล้อตั๋วสุ่ม"
- [ ] **Step 2: ตรวจสอบการปิดปุ่ม Undo ขณะสถานะ `syncing`**
- [ ] **Step 3: Commit**
  `git add src/components/live-classroom/RewardBoardSubTab.tsx && git commit -m "feat: add RewardBoardSubTab with top earners, undo ledger, and lucky draw button"`

---

### Task 7.5: วงล้อจับรางวัลตั๋วสุ่มท้ายคาบ (`LuckyTicketDrawModal.tsx`)

**Files:**
- Create: `src/components/live-classroom/LuckyTicketDrawModal.tsx`
- Test: `tests/liveClassroomEcosystem.test.ts` (ทดสอบการคำนวณสัดส่วนองศา Weighted Segments ตามจำนวนตั๋ว และการสุ่มผู้ชนะ)

**Interfaces:**
- Consumes: `Student`, `SoundFXEngine`
- Produces:
  ```typescript
  export interface LuckyTicketDrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onGiveReward: (studentIds: string[], type: 'coin' | 'ticket', amount: number, desc: string) => void;
    onConsumeTicket?: (studentId: string) => void;
    onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  }
  ```

- [ ] **Step 1: เขียน Unit Test สำหรับการคำนวณ Weighted Segments และ Random Target Angle**
  ทดสอบความกว้างของช่อง SVG เป็นสัดส่วนกับจำนวนตั๋ว (ตั๋ว 3 ใบ = พื้นที่ 3 เท่า), โอกาสถูกรางวัล, และการคำนวณองศาหมุนให้ผู้ชนะหยุดตรงเข็มด้านบน
- [ ] **Step 2: พัฒนา `src/components/live-classroom/LuckyTicketDrawModal.tsx`**
  สร้างโมดอลวงล้อ SVG ถ่วงน้ำหนักความน่าจะเป็น, ตัวเลือกระหว่าง sessionTickets vs totalTickets, ตัวเลือกตัดสิทธิ์ผู้ชนะเดิม, แอนิเมชันหมุน 4.5 วินาที พร้อมเสียงติ๊ก Web Audio แบบ Cubic Bezier, และปุ่มมอบรางวัลใหญ่ (+3🪙 หรือ +5🪙 พร้อมหักตั๋ว)
- [ ] **Step 3: ตรวจสอบเทสต์ให้ผ่าน**
- [ ] **Step 4: Commit**
  `git add src/components/live-classroom/LuckyTicketDrawModal.tsx tests/liveClassroomEcosystem.test.ts && git commit -m "feat: add LuckyTicketDrawModal component with proportional weighted SVG wheel"`

---

### Task 8: หน้ารวมหลักและการเชื่อมต่อข้อมูลจริง (`LiveClassroomView.tsx`)

**Files:**
- Create: `src/views/LiveClassroomView.tsx`

**Interfaces:**
- Consumes: `classroomService`, `sgsRosterAndSubmissionService`, `useOptimisticRewards`, `soundFX`, All 4 SubTabs
- Produces:
  ```typescript
  export interface LiveClassroomViewProps {
    initialClassroomId?: string;
    onNavigate?: (view: TeacherViewKey) => void;
  }
  export default function LiveClassroomView(props: LiveClassroomViewProps): React.JSX.Element;
  ```

- [ ] **Step 1: พัฒนา `src/views/LiveClassroomView.tsx`**
  โหลดข้อมูลห้องเรียนและนักเรียนจริง 100% ผ่าน `classroomService.getLocalClassrooms()` และ `sgsRosterAndSubmissionService.getRoster()` (Zero Mock Data), จัดการคีย์ลัดระดับ Global (`Spacebar`, `F`, `M`), และรองรับทั้งโหมดปกติและโหมดฉายจอใหญ่
- [ ] **Step 2: ทดสอบการสลับห้องเรียนและการรีเซ็ต State อย่างถูกต้อง**
- [ ] **Step 3: Commit**
  `git add src/views/LiveClassroomView.tsx && git commit -m "feat: create LiveClassroomView with zero mock data and real student loading"`

---

### Task 9: บูรณาการระบบนำทาง (`TeacherSidebar.tsx`, `App.tsx`, `TeacherOverviewView.tsx`)

**Files:**
- Modify: `src/components/layout/TeacherSidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/views/TeacherOverviewView.tsx`

- [ ] **Step 1: อัปเดต `TeacherViewKey` และเมนูใน `TeacherSidebar.tsx`**
  เพิ่ม `'live-classroom'` เข้าไปใน `TeacherViewKey` และเพิ่มเมนู **"เครื่องมือตอนสอน (Live Classroom)"**
- [ ] **Step 2: อัปเดตการ Render หน้าใน `App.tsx`**
  เพิ่มเงื่อนไข `currentView === 'live-classroom'` เพื่อเปิด `LiveClassroomView`
- [ ] **Step 3: เพิ่มปุ่มทางลัด Quick Action ใน `TeacherOverviewView.tsx`**
  วางปุ่ม **"🚀 เปิดโหมดตอนสอน"** บนส่วนหัวของหน้ารายวิชา
- [ ] **Step 4: Commit**
  `git add src/components/layout/TeacherSidebar.tsx src/App.tsx src/views/TeacherOverviewView.tsx && git commit -m "feat: integrate live-classroom view into sidebar and teacher overview"`

---

### Task 10: Verification, Build & Index Maintenance

**Files:**
- Test: `tests/liveClassroomEcosystem.test.ts`
- Run: `npm run build`
- Run: `npm run index:all`

- [ ] **Step 1: รันเทสต์สวีทของระบบทั้งหมด**
  `npm test` และ `npx tsx tests/liveClassroomEcosystem.test.ts`
- [ ] **Step 2: รัน TypeScript Build เพื่อยืนยันความถูกต้อง Type-Safe 100%**
  `npm run build`
- [ ] **Step 3: อัปเดต Codebase Index และ Schema Index ตามกฎ Master Rule**
  `npm run index:all`
- [ ] **Step 4: Commit สุดท้าย**
  `git add . && git commit -m "chore: verify live classroom companion build and sync indexes"`
