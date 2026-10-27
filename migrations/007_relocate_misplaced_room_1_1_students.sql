-- ==============================================================================
-- Migration: 007_relocate_misplaced_room_1_1_students.sql
-- Purpose: ย้ายแถวประวัติที่เคยตกค้างในห้อง ม.1/1 ให้กลับเข้าสู่ห้องเรียนจริง
--          และลบประวัติหลงของนักเรียนที่ไม่มีห้องเรียนจริงออกจาก ม.1/1
-- Date: 2026-10-27
-- ==============================================================================

BEGIN;

-- 1. ย้ายประวัตินักเรียน ม.2 และ ม.6 (253 คน) ให้ตรงกับห้องเรียนปัจจุบันของตนเอง
WITH active_rooms AS (
  SELECT "studentId", "classRoomId", "gradeLevel", "roomNumber"
  FROM public."StudentEnrollment"
  WHERE status = 'ENROLLED' AND "classRoomId" <> 'room-1-1'
)
UPDATE public."StudentEnrollment" se
SET 
  "classRoomId" = ar."classRoomId",
  "gradeLevel" = ar."gradeLevel",
  "roomNumber" = ar."roomNumber",
  "updatedAt" = NOW()
FROM active_rooms ar
WHERE se."studentId" = ar."studentId"
  AND se."classRoomId" = 'room-1-1'
  AND se.status = 'COMPLETED';

-- อัปเดตในตาราง student_enrollments ด้วย
WITH active_rooms AS (
  SELECT "studentId", "classRoomId"
  FROM public."StudentEnrollment"
  WHERE status = 'ENROLLED' AND "classRoomId" <> 'room-1-1'
)
UPDATE public.student_enrollments se2
SET 
  classroom_id = ar."classRoomId",
  updated_at = NOW()
FROM active_rooms ar
WHERE se2.student_id = ar."studentId"
  AND se2.classroom_id = 'room-1-1'
  AND se2.status = 'COMPLETED';

-- 2. นำแถวประวัติที่ไม่ถูกต้องของนักเรียน ม.ปลาย ที่ไม่มีห้องเรียนจริง ออกจากห้อง ม.1/1
DELETE FROM public."StudentEnrollment"
WHERE "classRoomId" = 'room-1-1'
  AND "studentId" IN (
    SELECT id FROM public."Student" 
    WHERE "studentCode" IN ('16028', '16045', '16300', '16308', '16323')
  );

DELETE FROM public.student_enrollments
WHERE classroom_id = 'room-1-1'
  AND student_id IN (
    SELECT id FROM public."Student" 
    WHERE "studentCode" IN ('16028', '16045', '16300', '16308', '16323')
  );

COMMIT;
