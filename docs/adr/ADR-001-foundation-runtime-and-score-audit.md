# ADR-001: สถาปัตยกรรมระบบ Runtime, การบันทึกลง Supabase และ Score Audit Log

## สถานะ
**APPROVED** - 23 กันยายน 2569

## บริบทและปัญหา (Context & Problem Statement)
ระบบจัดการชั้นเรียน (Classroom Management System) จำเป็นต้องมีรากฐานสถาปัตยกรรมที่แข็งแกร่ง รองรับการคำนวณเกรด SGS ตามมาตรฐาน สพฐ. จัดการคะแนนที่มีผลต่อผลสัมฤทธิ์ทางการศึกษา และรองรับระบบ Gamification ("ห้องเรียนผจญภัย") สำหรับนักเรียน โดยคำถามหลักใน Grilling Round 1 มุ่งเน้นไปที่:
1. การเลือก Runtime ระหว่าง Frontend SPA กับ Backend API
2. แหล่งเก็บข้อมูลหลัก (Source of Truth) และการซิงก์ข้อมูลจาก Google Classroom
3. กลไกการล็อกคะแนน (Score State Machine) ที่ยืดหยุ่นแต่ตรวจสอบได้ 100%

## มติการตัดสินใจ (Decisions)

### 1. Next.js Fullstack Monorepo (App Router)
- **การตัดสินใจ:** ย้ายและพัฒนาต่อเนื่องเป็น Next.js (App Router) + Server Actions ในโปรเจกต์เดียว (Fullstack Monorepo)
- **เหตุผล:** ป้องกันการเขียน REST API ซ้ำซ้อน, ทำ Transaction และ RBAC Guard จบที่ Server Actions และ Type-safe ระหว่าง UI กับ Database 100%

### 2. Supabase เป็นฐานข้อมูลหลัก (Primary Database & Source of Truth)
- **การตัดสินใจ:** กำหนดให้ **Supabase (PostgreSQL)** เป็นฐานข้อมูลหลักของระบบ
- **เหตุผล:** คะแนนและประวัติการส่งงานทั้งหมด ทั้งที่กรอกโดยครูและนำเข้าจาก Google Classroom จะถูกบันทึกลงใน Supabase โดยตรงทันที ไม่พึ่งพา Local Storage หรือการเก็บชั่วคราว ทำให้ระบบมีฐานข้อมูลกลางที่เชื่อถือได้

### 3. กลไก Optimistic Audit Log สำหรับคะแนนที่ถูกล็อก
- **การตัดสินใจ:** ไม่บล็อกการแก้ไขด้วย Hard Lock แต่ใช้ตาราง `ScoreAuditLog` บันทึกประวัติทุกครั้งที่มีการแก้ไขคะแนนที่อยู่ในสถานะ `SUBMITTED` หรือ `LOCKED`
- **สิ่งที่บันทึก:**
  - `scoreId`, `assignmentId`, `enrollmentId`
  - `oldScore`, `newScore`
  - `changedByUserId`, `reason`
  - `timestamp`, `ipAddress`
- **เหตุผล:** ยืดหยุ่นต่อสถานการณ์จริงของครูผู้สอนในช่วงสอบแก้ตัว/ซ่อมเสริม แต่คงไว้ซึ่งความโปร่งใสตรวจสอบได้ในรายงาน SAR และการตรวจสอบวิชาการ

## ข้อกำหนดระดับระบบ (Invariants Enforced)
- **Invariant 1:** คะแนนที่ถูกแก้ไขหลังสถานะ `SUBMITTED` หรือ `LOCKED` จะไม่สามารถบันทึกสำเร็จได้หากไม่มี `reason` (เหตุผลในการแก้ไข)
- **Invariant 2:** ข้อมูลที่นำเข้าจาก Google Classroom จะถูกแปลงและบันทึกลง Table ใน Supabase ทันที พร้อมผูก `ExternalMapping` เพื่อป้องกันการสร้าง Record ซ้ำซ้อน
