# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **ครูผู้สอน (Primary User):** ใช้งานในห้องเรียนจริงผ่านคอมพิวเตอร์พกพา, แท็บเล็ต หรือฉายขึ้นจอโปรเจกเตอร์ขนาดใหญ่ จัดการการสอนสด (Live Classroom), สุ่มชื่อนักเรียน, จับเวลากิจกรรม, แบ่งกลุ่มสมดุล, เช็กชื่อรายวัน, บันทึกคะแนน ปพ.5, ตรวจการบ้าน และแจกเหรียญ/ตั๋วกิจกรรม
- **นักเรียน (Secondary User):** ใช้งานผ่านสมาร์ตโฟนหรือแท็บเล็ตส่วนตัวในพอร์ทัลนักเรียน (Gamified Adventure Portal) ดูภาระงาน ส่งการบ้าน ตรวจสอบสถานะการมาเรียน และสะสมเหรียญ/ตั๋วกาชา
- **ผู้บริหารและงานทะเบียน (Admin User):** ดูรายงานภาพรวมสถิติการมาเรียน ปพ.5 และจัดการข้อมูลสารสนเทศโรงเรียน

## Product Purpose

เป็นระบบบริหารจัดการชั้นเรียนยุคใหม่ (Modern Educational SaaS) ผสมผสาน Soft Pastel Anime ที่ช่วยลดภาระงานธุรการของครู ยกระดับการมีส่วนร่วมในห้องเรียนด้วยเครื่องมือสอนสดแบบอินเทอร์แอ็กทีฟ (Live Classroom Teaching Companion) และจูงใจนักเรียนผ่านระบบ Gamification โดยเชื่อมโยงฐานข้อมูลกับระบบบริหารสถานศึกษาอย่างสมบูรณ์

## Positioning

ระบบจัดการชั้นเรียนที่รวมทั้งงานวัดผลทางการ (ปพ.5 / SGS / เช็กชื่อทางการ) และเครื่องมือช่วยสอนสดในห้องเรียน (Interactive Live Teaching + Gamified Rewards) ไว้ในแพลตฟอร์มเดียว ทำงานแบบ Offline-Resilient รองรับสภาพเน็ตหลุดในห้องเรียน และยึดหลัก Strict Zero-Mock Data 100%

## Workflows

1. **Live Teaching Companion:** ครูเปิดจอสอนสด ➔ สุ่มชื่อนักเรียน / จับเวลาประลองตอบคำถาม / แบ่งกลุ่มกิจกรรม ➔ แจกเหรียญ/ตั๋วรางวัลแบบ Realtime ➔ หมุนวงล้อจับรางวัลตั๋วสุ่มท้ายคาบ
2. **Attendance & Roll Call:** สลับสถานะมาเรียน/ขาดเรียนแบบฉับพลัน (Optimistic UI) พร้อมซิงค์เข้าสู่ฐานข้อมูลโรงเรียน
3. **Academic Evaluation (ปพ.5):** บันทึกคะแนนเก็บ ตรวจภาระงาน และตัดเกรดอัตโนมัติตามเกณฑ์กระทรวงศึกษาธิการ
4. **Student Gamification:** นักเรียนส่งงาน ➔ ได้รับเหรียญและตั๋วสุ่ม ➔ ร่วมกิจกรรมสุ่มและหมุนวงล้อในคาบเรียน

## Operating Context

- ห้องเรียนจริงที่มีจอโปรเจกเตอร์หรือสมาร์ททีวี (Projector High-Contrast Mode)
- อุปกรณ์แท็บเล็ตและโน้ตบุ๊กของครูผู้สอน
- เครือข่าย Wi-Fi โรงเรียนที่อาจมีความไม่เสถียร (Offline-First Queue Resilience)

## Constraints & Principles

- **Strict Zero Mock Policy:** ห้ามใช้ Mock Data ในหน้าจอจริงเด็ดขาด หากไม่มีข้อมูลให้แสดงเป็น Empty State
- **Zero-Egress & Neon DB Optimization:** ไม่ใช้ Polling ลูป เพื่อประหยัด Serverless Compute
- **Design System:** Pastel Anime Education Dashboard สไตล์ Modern SaaS สะอาด อ่านง่าย Thai-First ฟอนต์ Prompt/Noto Sans Thai
