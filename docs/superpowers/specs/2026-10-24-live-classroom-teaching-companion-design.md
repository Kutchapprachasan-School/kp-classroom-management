# เอกสารออกแบบระบบเครื่องมือตอนสอนในชั้นเรียนแบบสด (Live Classroom Teaching Companion Design Spec)

**วันที่:** 24 ตุลาคม 2569  
**สถานะ:** รอตรวจสอบ (Pending Review)  
**สถาปัตยกรรม:** Vite React SPA + Real DB / Real Storage Services + Zero-Egress & Zero-Mock Compliance  

---

## 1. ภาพรวมและวัตถุประสงค์ (Executive Summary & Objectives)

ระบบเครื่องมือตอนสอนในชั้นเรียนแบบสด (**Live Classroom Teaching Companion — `LiveClassroomView.tsx`**) ออกแบบมาเพื่อเป็นเครื่องมือคู่คิดของคุณครูขณะกำลังจัดกิจกรรมการเรียนรู้ในคาบเรียนจริง (In-Class Active Instruction) สามารถฉายขึ้นจอโปรเจกเตอร์หรือสมาร์ทบอร์ดหน้าชั้นเรียนได้อย่างสวยงาม คมชัด มีส่วนร่วมสูง และเชื่อมโยงกับระบบเศรษฐกิจแรงจูงใจ (Gamification) ในระบบกาชา (**KP Gacha Ecosystem**) ที่มีอยู่แล้วในโรงเรียน

### วัตถุประสงค์หลัก
1. **กระตุ้นการมีส่วนร่วมในชั้นเรียน (In-Class Engagement)**: มีเครื่องมือสุ่มชื่อผู้เรียน, ตัวจับเวลานับถอยหลัง, การท้าดวลตอบคำถาม (Quick Versus), และการแบ่งกลุ่มกิจกรรมอัตโนมัติ
2. **เชื่อมโยงผลตอบแทนเข้าสู่ระบบกาชาจริง (Direct Gacha Reward Integration)**: เมื่อนักเรียนตอบคำถามถูกต้องหรือชนะกิจกรรมกลุ่ม คุณครูสามารถกดแจกเหรียญ (Coins 🪙) และตั๋วกาชา (Tickets 🎟️) เข้ากระเป๋าจริงของนักเรียนใน `kp_gacha_state:<studentId>` ได้ทันที
3. **ประสบการณ์จอใหญ่ (Projector / Theater Mode & Hotkeys)**: รองรับการแสดงผล 2 โหมด ทั้งโหมดกลางวันสไตล์ **Pastel Anime Education Dashboard** และโหมดฉายโปรเจกเตอร์ความคมชัดสูง (Dark High-Contrast) พร้อมคีย์ลัดสั่งงานสะดวกรวดเร็ว (`Spacebar`, `F`, `M`)
4. **ความน่าเชื่อถือแบบออฟไลน์ (Zero External Asset Dependency)**: ใช้ Web Audio API สังเคราะห์เสียงเอฟเฟกต์สดในเบราว์เซอร์ ไม่ต้องพึ่งพาไฟล์เสียงภายนอก

---

## 2. สถาปัตยกรรมระบบและการนำทาง (System Architecture & Navigation)

### 2.1 ตำแหน่งเมนูและการเชื่อมต่อในระบบ (Entry Points)
1. **แถบเมนูหลักของครู (`TeacherSidebar.tsx`)**:
   - เพิ่มคีย์เมนูใหม่: `'live-classroom'`
   - ชื่อเมนูภาษาไทย: **"เครื่องมือตอนสอน (Live Classroom)"**
   - หมวดหมู่: กลุ่มจัดการเรียนการสอน (Teaching & Learning)
   - ไอคอน: `@mingcute/react` (`TvRegular` หรือ `SparklesRegular`)
2. **ทางลัดจากหน้ารายวิชา (`TeacherOverviewView.tsx`)**:
   - เพิ่มปุ่ม Quick Action **"🚀 เปิดโหมดตอนสอน"** ที่ส่วนบนของหน้ารายวิชา เพื่อส่งรหัสห้องเรียนที่กำลังดูอยู่ (`selectedClassroomId`) ไปยังหน้าเครื่องมือตอนสอนทันที
3. **การลงทะเบียนใน `App.tsx`**:
   - เพิ่ม `currentView === 'live-classroom'` เรนเดอร์ `<LiveClassroomView initialClassroomId={currentClassroomId} onNavigate={setCurrentView} />`

---

## 3. การปฏิบัติตามกฎเหล็กของระบบ (System Governance & Policies)

### 3.1 กฎห้ามใช้ Mock Data เด็ดขาด (Strict Zero Mock Data Policy)
- **แหล่งข้อมูลนักเรียนและห้องเรียน**:
  - ดึงข้อมูลห้องเรียนจาก `classroomService.getLocalClassrooms()`
  - ดึงรายชื่อนักเรียนจริงจาก `sgsRosterAndSubmissionService` หรือ `studentService`
  - ตรวจสอบสถานะการมาเรียนของวันปัจจุบัน (`present / absent`) จากระบบเช็คชื่อ (`ClassroomAttendanceView` / `attendanceCorrelationService`) หากยังไม่มีการเช็คชื่อในคาบ ให้ตั้งต้นสถานะเป็น "มาเรียน" ทั้งหมด พร้อมปุ่มสลับสถานะด่วนในหน้างาน
  - หากห้องเรียนไม่มีนักเรียน ให้แสดง **Pastel Anime Empty State** ห้ามใส่ Mock Arrays
- **แหล่งข้อมูลกาชา**:
  - แจกรางวัลผ่าน `gachaService.addTickets(amount, studentId)` และ `gachaService.addCoins(amount, studentId)` โดยตรง
  - อัปเดตข้อมูลลง `kp_gacha_state:<studentId>` และส่ง Event `kp-gacha-state-updated` ทันที

### 3.2 กฎประหยัดเน็ตและฐานข้อมูล (Zero-Egress Optimization)
- จัดเก็บข้อมูลประวัติการแจกรางวัลเฉพาะคาบเรียนปัจจุบัน (Session Ledger) ไว้ในหน่วยความจำและ `sessionStorage` (Key: `kp_live_class_session_<classId>`)
- ไม่ยิง Query หนักเข้า Neon Database ระหว่างการสุ่มหรือจับเวลา

---

## 4. รายละเอียดฟังก์ชันทั้ง 4 แท็บย่อย (Core Sub-tools Specifications)

### 4.1 แถบควบคุมด้านบน (Projector Header & Global Bar)
- **ตัวเลือกห้องเรียน (Classroom Selector)**: ดรอปดาวน์เลือกห้องเรียนและวิชาของครู
- **ตัวนับจำนวนผู้เข้าเรียน (Attendance Counter Badge)**: แสดงจำนวนนักเรียนที่มาเรียนจริงในห้อง
- **ปุ่มเปิดประวัติคาบเรียน (Session Ledger Summary)**: แสดงยอดรวมเหรียญและตั๋วที่แจกในคาบนี้ (`sessionTotalCoins`, `sessionTotalTickets`)
- **ปุ่มเปิด-ปิดเสียง (Sound FX Toggle - Key: `M`)**: สลับสถานะเปิด/ปิดเสียง
- **ปุ่มโหมดฉายจอใหญ่ (Projector Mode Toggle - Key: `F`)**: สลับ Fullscreen เพิ่มขนาดฟอนต์และการ์ด

---

### 4.2 แท็บที่ 1: 🎯 สุ่มชื่อนักเรียน (Random Student Picker)
- **โหมดแอนิเมชัน**:
  - `Slot Reel`: หมุนรายชื่อแนวตั้ง 22 สเต็ป ค่อยๆ ชะลอความเร็ว พร้อมเสียงติ๊ก Web Audio
  - `Card Flip`: แสดงการ์ดคว่ำหน้า 8 ใบ ให้ตัวแทนนักเรียนเลือกเปิด
- **ระบบกรองรายชื่อ (Pool Management)**:
  - ตัวเลือก `ไม่สุ่มซ้ำในคาบนี้ (No-Repeat)`: ตัดชื่อคนที่ได้รับเลือกแล้วออกจากกองชั่วคราว
  - แสดงตัวเลขคงเหลือ เช่น "เหลือ 24/30 คน"
  - ปุ่ม `ข้าม / ไม่อยู่ (Skip)`: ดึงชื่อกลับเข้ากองแล้วสุ่มใหม่กรณีนักเรียนไปห้องน้ำ
  - ปุ่ม `รีเซ็ตรายชื่อ (Reset)`: รีเซ็ตสถานะการสุ่มกลับสู่เริ่มต้น
- **แผงให้รางวัลด่วน (Instant Action Dock)**:
  - `+1 🪙 เหรียญ`
  - `+3 🪙 เหรียญ`
  - `+1 🎟️ ตั๋วสุ่ม`
  - กดปุ่มแล้วมีเสียงเหรียญ พร้อมอนิเมชัน Toast เด้งเข้ากระเป๋านักเรียนจริง

---

### 4.3 แท็บที่ 2: ⏱️ ตอบคำถามสดและจับเวลา (Live Timer & Quick Challenge)
- **นาฬิกาจับเวลากิจกรรม (Projector Countdown Timer)**:
  - ตัวเลขดิจิทัลขนาดใหญ่พิเศษ พร้อมแถบ Progress Bar
  - สีเปลี่ยนตามเวลา: เขียว (ปกติ) ➔ ส้ม/เหลือง (ต่ำกว่า 30%) ➔ แดงกะพริบ (10 วินาทีสุดท้าย พร้อมเสียงบี๊บเตือน)
  - ปุ่มเพิ่มเวลาด่วน: `+30 วินาที`, `+1 นาที`, `+3 นาที`, `+5 นาที`
  - ปุ่ม `เริ่ม / พักเวลา (Spacebar)` และปุ่ม `รีเซ็ตเวลา`
- **โหมดท้าดวลตอบคำถาม (Quick Versus Arena)**:
  - ตัวเลือกจำนวนผู้ท้าชิง: 2 คน (ดวลคู่), 3 คน, หรือ 4 คน
  - ปุ่มสุ่มคู่ท้าดวลจากนักเรียนที่มาเรียนจริง
  - ปุ่มตัดสิน `ชนะดวล (+2 🪙)` ประจำตัวผู้ท้าชิงแต่ละคน พร้อมเสียง Fanfare เฉลิมฉลอง

---

### 4.4 แท็บที่ 3: 👥 แบ่งกลุ่มกิจกรรม (Group Generator)
- **เงื่อนไขการแบ่งกลุ่ม**:
  - แบ่งตาม **จำนวนกลุ่ม** (เช่น 4 กลุ่ม, 6 กลุ่ม)
  - แบ่งตาม **จำนวนคนต่อกลุ่ม** (เช่น กลุ่มละ 4 คน)
  - ระบบเกลี่ยเศษนักเรียนที่เหลือให้อย่างสมดุล
- **กลยุทธ์การคละสมาชิก (Balancing Strategy)**:
  - `คละระดับคะแนน (Balanced Tiers)`: คละนักเรียนกลุ่มผลการเรียน High / Mid / Low กระจายเท่าๆ กันในทุกกลุ่ม
  - `สุ่มคละอิสระ (Pure Random)`: สุ่มตามดวง
- **ฟังก์ชันหน้างาน**:
  - `สุ่มหัวหน้ากลุ่มอัตโนมัติ (👑 Auto-Leader)`: ติดสัญลักษณ์มงกุฎให้ตัวแทนกลุ่ม 1 คน
  - `สลับสมาชิกด่วน (Quick Swap)`: คลิกที่นักเรียน 2 คนต่างกลุ่มเพื่อสลับที่กันได้ทันที
  - `แจกรางวัลยกกลุ่ม (+1 🪙 ยกกลุ่ม)`: ปุ่มบนการ์ดแต่ละกลุ่ม มอบรางวัลให้สมาชิกทุกคนในกลุ่มพร้อมกัน

---

### 4.5 แท็บที่ 4: 🏆 บอร์ดรางวัลและสรุปผลคาบเรียน (Reward Board & Session Summary)
- **ดาวเด่นประจำคาบ (Top Earners)**:
  - จัดอันดับ 8 อันดับแรกของนักเรียนที่ได้รับเหรียญและตั๋วสูงสุดในคาบนี้
  - แสดงเหรียญทอง 🥇, เงิน 🥈, ทองแดง 🥉
- **ประวัติการแจกรางวัลและระบบยกเลิก (Session Log & Undo)**:
  - แสดงรายการแจกรางวัลย้อนหลังในคาบนี้ เช่น `[10:25] ด.ช.สมชาย ได้รับ +1 🪙`
  - ปุ่ม `[Undo]` ข้างแต่ละรายการ เพื่อดึงเหรียญหรือตั๋วคืนจาก `gachaService` ทันทีเมื่อครูกดผิด
- **แจกโบนัสทั้งห้อง (Class-wide Bonus)**:
  - ปุ่ม `แจกโบนัสทั้งห้อง (+1 🪙 ทุกคนที่มาเรียน)` แจกเหรียญให้นักเรียนทุกคนที่มีสถานะมาเรียนในคลิกเดียว พร้อมเสียง Fanfare

---

## 4.6 สถาปัตยกรรม Optimistic UI และโมเดล RewardBatch (Optimistic Rewards & Atomic Rollback)

เพื่อตอบสนองการใช้งานหน้าห้องเรียนที่ต้องรวดเร็ว ฉับไว ไม่สะดุดระหว่างสอน (Zero-Latency In-Class UX):
1. **หลักการ Optimistic UI**:
   - เมื่อครูกดแจกเหรียญหรือตั๋ว (ไม่ว่าจะรายบุคคล ยกกลุ่ม หรือทั้งห้อง):
     - ขั้นที่ 1: หน้าจออัปเดตตัวเลขเหรียญ/ตั๋วทันที + เล่นเสียง Web Audio ทันที
     - ขั้นที่ 2: เรียก `gachaService.addCoins` / `gachaService.addTickets` ปรับยอดสะสมใน `kp_gacha_state:<studentId>` ทันที
     - ขั้นที่ 3: บันทึก `RewardBatch` ลงใน Session Ledger ด้วยสถานะ `syncing` แล้วทำการซิงค์ลง Storage/Cloud ในเบื้องหลัง (Background Task)
     - ขั้นที่ 4: เมื่อซิงค์สำเร็จ เปลี่ยนสถานะเป็น `synced`
2. **โมเดลประวัติการแจกแบบกลุ่ม (`RewardBatch`)**:
   ```typescript
   export interface RewardBatch {
     id: string; // temp-... หรือ batch-cuid
     classroomId: string;
     teacherId?: string;
     rewardType: 'coin' | 'ticket';
     amount: number; // จำนวนที่แจกต่อคน เช่น +1, +3
     description: string; // เช่น "ด.ช.สมชาย ตอบคำถาม", "รางวัลยกกลุ่ม กลุ่มที่ 1"
     targetStudentIds: string[]; // รายชื่อนักเรียนทุกคนในชุดนี้
     isRevoked: boolean; // ป้องกันการกด Undo ซ้ำซ้อน
     createdAt: string;
     revokedAt?: string | null;
     syncStatus: 'syncing' | 'synced' | 'error';
   }
   ```
3. **กลไก Optimistic Undo & Atomic Rollback**:
   - ตรวจสอบ `isRevoked === false` หากกำลังซิงค์อยู่จะปิดไม่ให้กดยกเลิกชั่วคราว
   - เมื่อกดยกเลิก: หักแต้มคืนทันที (`-amount`), อัปเดต `isRevoked: true` ใน `RewardBatch` และปรับยอดใน `gachaService` ทันที
   - หากเกิดข้อผิดพลาดในการบันทึก ระบบจะ Rollback คืนค่าเดิมพร้อมเสียงแจ้งเตือนและข้อความ Toast ให้คุณครูทราบทันที
4. **Custom Hook `useOptimisticRewards`**:
   - แยก Logic การจัดการ Ledger, Toast, Give Reward, Undo Reward และ `setInitialLedger` ออกเป็น Hook เฉพาะ เพื่อให้ `LiveClassroomView.tsx` มีโค้ดที่สะอาดและทดสอบได้ง่าย (Decoupled & Testable)

---

## 4.7 ระบบเตรียมข้อมูลห้องเรียนและการจัดระดับ Tier อัตโนมัติ (`liveClassroomService.ts`)

เพื่อความแม่นยำและการกู้คืนข้อมูลกรณีครูกด Refresh หน้าจอ:
1. **Timezone-Safe Thailand Date Range (UTC+7)**:
   - คำนวณขอบเขตวันปัจจุบันตามเวลาประเทศไทย (`Asia/Bangkok` UTC+7) เพื่อความถูกต้องของสถิติและรายการแจกของวันนี้
2. **Smart Attendance Fallback**:
   - ตรวจสอบสถานะการเช็กชื่อของวันนี้ (`attendanceService` / `attendanceCorrelationService`)
   - หากคาบนี้ยังไม่ได้เช็กชื่อในระบบ จะถือว่านักเรียนทุกคน "มาเรียน (present: true)" เป็นค่าเริ่มต้น เพื่อให้ครูเริ่มกิจกรรมสุ่มชื่อได้ทันที แต่หากมีการเช็กชื่อแล้ว จะนับเฉพาะคนที่สถานะเป็น `PRESENT` หรือ `LATE` (มาสายยังอยู่ในห้อง)
3. **Auto-Tier Percentile Calculation (`calculateStudentTierMap`)**:
   - คำนวณคะแนนสะสมถ่วงน้ำหนัก: `score = totalCoins + totalTickets * 3`
   - แบ่งนักเรียนออกเป็น 3 ระดับอย่างสมดุล:
     - `high`: 33% บน
     - `mid`: 34% กลาง
     - `low`: 33% ล่าง
   - กรณีต้นเทอมที่ทุกคนมีคะแนน 0 เท่ากัน จะเกลี่ย Tier สลับวน `high`, `mid`, `low` เพื่อให้ฟีเจอร์จัดกลุ่มคละความสามารถทำงานได้อย่างสมบูรณ์แบบ
4. **Session Recovery**:
   - กู้คืนยอดเหรียญและตั๋วที่ได้รับในคาบนี้ (`sessionCoins`, `sessionTickets`) และประวัติ `ledger` จากประวัติของวันปัจจุบัน ทำให้ครูกด Refresh หน้าจอแล้วคะแนนในคาบไม่หายไป

---

## 4.8 ระบบสลับสถานะเช็กชื่อด่วนและการตั้งต้นข้อมูลแบบ Atomic (First-Toggle Initialization)

เพื่อความถูกต้องของการเช็กชื่อและป้องกันบั๊กนักเรียนคนอื่นกลายเป็นขาดเรียนเมื่อกดสลับคนแรก:
1. **ปัญหา First-Toggle**:
   - เมื่อยังไม่มีการเช็กชื่อของวันนี้ ระบบ Fallback จะแสดงทุกคนว่า "มาเรียน"
   - หากครูกดสลับสถานะนักเรียนคนที่ 1 เป็น "ขาดเรียน" โดยไม่มีการตั้งต้นระเบียนของคนอื่น เมื่อ Refresh หน้าจอ ระบบจะเห็นว่ามีการเช็กชื่อแล้ว และทำให้นักเรียนอีก 29 คนที่ไม่มีข้อมูลกลายเป็น "ขาดเรียน"
2. **วิธีแก้ไข (First-Toggle Initialization Pattern)**:
   - ตรวจสอบว่าห้องนี้มีประวัติเช็กชื่อของวันนี้ (`startOfDayUTC`) หรือยัง
   - หากยังไม่มี: สร้างระเบียนตั้งต้นให้นักเรียนทุกคนในห้องเป็น `PRESENT` อัตโนมัติก่อนใน Transaction เดียวกัน แล้วจึงปรับสถานะของนักเรียนคนที่ถูกสลับเป็นเป้าหมาย
3. **Optimistic Attendance UI & Auto-Clear Safeguard**:
   - สลับสถานะบน UI ทันที + เสียงคลิกติ๊ก (ความถี่ 700Hz เมื่อมาเรียน, 400Hz เมื่อขาดเรียน)
   - **Auto-Clear Safeguard**: หากนักเรียนถูกสลับเป็น "ขาดเรียน" และชื่อของเขากำลังค้างอยู่บนแท่นสุ่มชื่อ (`selectedStudent`, `rollingStudent`) หรือเวทีดวล (`challengers`) ระบบจะเคลียร์ชื่อออกทันที เพื่อป้องกันการเผลอแจกรางวัลให้คนที่ไม่อยู่
   - มี `syncingAttendanceIds` แสดงอนิเมชันหมุนติ้ว (`Loader2`) และ Rollback คืนค่าเดิมทันทีหากการบันทึกล้มเหลว

---

## 5. ระบบเสียงสังเคราะห์ Web Audio API (SoundFXEngine)

ทำงานแบบ Standalone ไม่ต้องโหลดไฟล์ MP3 ภายนอก:
1. `playTick(freq, duration)`: เสียงคลิก/ติ๊กขณะหมุนสล็อตหรือนับถอยหลัง
2. `playCoin()`: เสียงเหรียญกระดิ่งคอร์ดคู่ B5-E6
3. `playFanfare()`: เสียงแตรชัยชนะ คอร์ด C5 - E5 - G5 - C6
4. `playBuzzer()`: เสียงหมดเวลา คลื่น Sawtooth กวาดความถี่ลง

---

## 6. โครงสร้างคอมโพเนนต์และการแยกไฟล์ (Component Breakdown)

เพื่อให้อ่านง่าย แก้ไขสะดวก และเป็นไปตามหลัก Single Responsibility:
```
src/
├── views/
│   └── LiveClassroomView.tsx          # คอนเทนเนอร์หลักและ Global State
├── components/
│   └── live-classroom/
│       ├── LiveClassroomHeader.tsx    # Header, ตัวเลือกห้อง, สวิตช์เสียง และ Projector Toggle
│       ├── RandomPickerSubTab.tsx     # แท็บสุ่มชื่อนักเรียน (Slot & Card)
│       ├── LiveTimerSubTab.tsx        # แท็บจับเวลา & ท้าดวลตอบคำถาม
│       ├── GroupGeneratorSubTab.tsx   # แท็บจัดกลุ่ม & สลับสมาชิก
│       ├── RewardBoardSubTab.tsx      # แท็บบอร์ดรางวัล, ประวัติ & Undo
│       └── WebAudioSoundEngine.ts     # คลาสสังเคราะห์เสียง Web Audio
```

---

## 7. แผนการทดสอบและการตรวจสอบ (Verification & Test Strategy)

1. **Unit & Logic Tests**:
   - ทดสอบการคำนวณแบ่งกลุ่ม (เกลี่ยเศษถูกต้อง, คละ Tiers สมดุล)
   - ทดสอบการแจกรางวัลและ Undo ใน `gachaService` (ยอดเหรียญ/ตั๋วเพิ่มและลดถูกต้อง ไม่ติดลบ)
2. **UI & Accessibility Tests**:
   - ทดสอบปุ่มคีย์ลัด (`Spacebar`, `F`, `M`) ไม่ชนกับช่อง Input
   - ทดสอบ Empty State เมื่อห้องเรียนไม่มีนักเรียน
   - ทดสอบการแสดงผลบนขนาดหน้าจอปกติและโหมดฉายโปรเจกเตอร์
3. **Integration Build & Test Run**:
   - รัน `npm run build` (tsc verification)
   - รันเทสต์สวีทเพื่อยืนยันว่าไม่มีข้อผิดพลาดกระทบหน้าอื่นในระบบ
