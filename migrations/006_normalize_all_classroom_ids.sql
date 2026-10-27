-- ==============================================================================
-- Migration: 006_normalize_all_classroom_ids.sql
-- Purpose: ปรับมาตรฐานรหัสห้องเรียน (ClassRoom ID) ทั้งหมด 25 ห้องจาก Timestamp
--          ให้เป็นรูปแบบมาตรฐานเดียวกันทั่วทั้งโรงเรียน: room-1-1 ถึง room-6-6
-- Date: 2026-10-27
-- ==============================================================================

BEGIN;

-- 1. อัปเดตตารางหลัก ClassRoom
-- เนื่องจาก StudentEnrollment และ SubjectOffering มี Foreign Key (ON UPDATE CASCADE)
-- การอัปเดต ClassRoom.id จะทำการ Cascade ไปยังสองตารางดังกล่าวโดยอัตโนมัติ

UPDATE public."ClassRoom" SET id = 'room-1-3' WHERE id = 'room-1791986382424';
UPDATE public."ClassRoom" SET id = 'room-1-4' WHERE id = 'room-1791986989206';
UPDATE public."ClassRoom" SET id = 'room-1-5' WHERE id = 'room-1791986989299';
UPDATE public."ClassRoom" SET id = 'room-1-6' WHERE id = 'room-1791986989463';

UPDATE public."ClassRoom" SET id = 'room-2-2' WHERE id = 'room-1791986989821';
UPDATE public."ClassRoom" SET id = 'room-2-3' WHERE id = 'room-1791986989917';
UPDATE public."ClassRoom" SET id = 'room-2-4' WHERE id = 'room-1791986990077';
UPDATE public."ClassRoom" SET id = 'room-2-5' WHERE id = 'room-1791986990215';
UPDATE public."ClassRoom" SET id = 'room-2-6' WHERE id = 'room-1791986990304';

UPDATE public."ClassRoom" SET id = 'room-3-3' WHERE id = 'room-1791986990658';
UPDATE public."ClassRoom" SET id = 'room-3-4' WHERE id = 'room-1791986990739';

UPDATE public."ClassRoom" SET id = 'room-4-2' WHERE id = 'room-1791986991229';
UPDATE public."ClassRoom" SET id = 'room-4-3' WHERE id = 'room-1791986991311';
UPDATE public."ClassRoom" SET id = 'room-4-4' WHERE id = 'room-1791986991422';
UPDATE public."ClassRoom" SET id = 'room-4-5' WHERE id = 'room-1791986991588';
UPDATE public."ClassRoom" SET id = 'room-4-6' WHERE id = 'room-1791986991678';

UPDATE public."ClassRoom" SET id = 'room-5-2' WHERE id = 'room-1791986991897';
UPDATE public."ClassRoom" SET id = 'room-5-3' WHERE id = 'room-1791986991984';
UPDATE public."ClassRoom" SET id = 'room-5-4' WHERE id = 'room-1791986992100';
UPDATE public."ClassRoom" SET id = 'room-5-5' WHERE id = 'room-1791986992175';
UPDATE public."ClassRoom" SET id = 'room-5-6' WHERE id = 'room-1791986992256';

UPDATE public."ClassRoom" SET id = 'room-6-2' WHERE id = 'room-1791986992494';
UPDATE public."ClassRoom" SET id = 'room-6-3' WHERE id = 'room-1791986992580';
UPDATE public."ClassRoom" SET id = 'room-6-4' WHERE id = 'room-1791986992661';
UPDATE public."ClassRoom" SET id = 'room-6-5' WHERE id = 'room-1791986992750';


-- 2. อัปเดตตาราง student_enrollments (ระบบเลื่อนชั้น & ประวัติการเรียน)
UPDATE public.student_enrollments SET classroom_id = 'room-1-3' WHERE classroom_id = 'room-1791986382424';
UPDATE public.student_enrollments SET classroom_id = 'room-1-4' WHERE classroom_id = 'room-1791986989206';
UPDATE public.student_enrollments SET classroom_id = 'room-1-5' WHERE classroom_id = 'room-1791986989299';
UPDATE public.student_enrollments SET classroom_id = 'room-1-6' WHERE classroom_id = 'room-1791986989463';

UPDATE public.student_enrollments SET classroom_id = 'room-2-2' WHERE classroom_id = 'room-1791986989821';
UPDATE public.student_enrollments SET classroom_id = 'room-2-3' WHERE classroom_id = 'room-1791986989917';
UPDATE public.student_enrollments SET classroom_id = 'room-2-4' WHERE classroom_id = 'room-1791986990077';
UPDATE public.student_enrollments SET classroom_id = 'room-2-5' WHERE classroom_id = 'room-1791986990215';
UPDATE public.student_enrollments SET classroom_id = 'room-2-6' WHERE classroom_id = 'room-1791986990304';

UPDATE public.student_enrollments SET classroom_id = 'room-3-3' WHERE classroom_id = 'room-1791986990658';
UPDATE public.student_enrollments SET classroom_id = 'room-3-4' WHERE classroom_id = 'room-1791986990739';

UPDATE public.student_enrollments SET classroom_id = 'room-4-2' WHERE classroom_id = 'room-1791986991229';
UPDATE public.student_enrollments SET classroom_id = 'room-4-3' WHERE classroom_id = 'room-1791986991311';
UPDATE public.student_enrollments SET classroom_id = 'room-4-4' WHERE classroom_id = 'room-1791986991422';
UPDATE public.student_enrollments SET classroom_id = 'room-4-5' WHERE classroom_id = 'room-1791986991588';
UPDATE public.student_enrollments SET classroom_id = 'room-4-6' WHERE classroom_id = 'room-1791986991678';

UPDATE public.student_enrollments SET classroom_id = 'room-5-2' WHERE classroom_id = 'room-1791986991897';
UPDATE public.student_enrollments SET classroom_id = 'room-5-3' WHERE classroom_id = 'room-1791986991984';
UPDATE public.student_enrollments SET classroom_id = 'room-5-4' WHERE classroom_id = 'room-1791986992100';
UPDATE public.student_enrollments SET classroom_id = 'room-5-5' WHERE classroom_id = 'room-1791986992175';
UPDATE public.student_enrollments SET classroom_id = 'room-5-6' WHERE classroom_id = 'room-1791986992256';

UPDATE public.student_enrollments SET classroom_id = 'room-6-2' WHERE classroom_id = 'room-1791986992494';
UPDATE public.student_enrollments SET classroom_id = 'room-6-3' WHERE classroom_id = 'room-1791986992580';
UPDATE public.student_enrollments SET classroom_id = 'room-6-4' WHERE classroom_id = 'room-1791986992661';
UPDATE public.student_enrollments SET classroom_id = 'room-6-5' WHERE classroom_id = 'room-1791986992750';


-- 3. อัปเดตตาราง Attendance, AssessmentColumn, PromotionBatchItem
UPDATE public."Attendance" SET "classroomId" = 'room-1-3' WHERE "classroomId" = 'room-1791986382424';
UPDATE public."Attendance" SET "classroomId" = 'room-1-4' WHERE "classroomId" = 'room-1791986989206';
UPDATE public."Attendance" SET "classroomId" = 'room-1-5' WHERE "classroomId" = 'room-1791986989299';
UPDATE public."Attendance" SET "classroomId" = 'room-1-6' WHERE "classroomId" = 'room-1791986989463';
UPDATE public."Attendance" SET "classroomId" = 'room-2-2' WHERE "classroomId" = 'room-1791986989821';
UPDATE public."Attendance" SET "classroomId" = 'room-2-3' WHERE "classroomId" = 'room-1791986989917';
UPDATE public."Attendance" SET "classroomId" = 'room-2-4' WHERE "classroomId" = 'room-1791986990077';
UPDATE public."Attendance" SET "classroomId" = 'room-2-5' WHERE "classroomId" = 'room-1791986990215';
UPDATE public."Attendance" SET "classroomId" = 'room-2-6' WHERE "classroomId" = 'room-1791986990304';
UPDATE public."Attendance" SET "classroomId" = 'room-3-3' WHERE "classroomId" = 'room-1791986990658';
UPDATE public."Attendance" SET "classroomId" = 'room-3-4' WHERE "classroomId" = 'room-1791986990739';
UPDATE public."Attendance" SET "classroomId" = 'room-4-2' WHERE "classroomId" = 'room-1791986991229';
UPDATE public."Attendance" SET "classroomId" = 'room-4-3' WHERE "classroomId" = 'room-1791986991311';
UPDATE public."Attendance" SET "classroomId" = 'room-4-4' WHERE "classroomId" = 'room-1791986991422';
UPDATE public."Attendance" SET "classroomId" = 'room-4-5' WHERE "classroomId" = 'room-1791986991588';
UPDATE public."Attendance" SET "classroomId" = 'room-4-6' WHERE "classroomId" = 'room-1791986991678';
UPDATE public."Attendance" SET "classroomId" = 'room-5-2' WHERE "classroomId" = 'room-1791986991897';
UPDATE public."Attendance" SET "classroomId" = 'room-5-3' WHERE "classroomId" = 'room-1791986991984';
UPDATE public."Attendance" SET "classroomId" = 'room-5-4' WHERE "classroomId" = 'room-1791986992100';
UPDATE public."Attendance" SET "classroomId" = 'room-5-5' WHERE "classroomId" = 'room-1791986992175';
UPDATE public."Attendance" SET "classroomId" = 'room-5-6' WHERE "classroomId" = 'room-1791986992256';
UPDATE public."Attendance" SET "classroomId" = 'room-6-2' WHERE "classroomId" = 'room-1791986992494';
UPDATE public."Attendance" SET "classroomId" = 'room-6-3' WHERE "classroomId" = 'room-1791986992580';
UPDATE public."Attendance" SET "classroomId" = 'room-6-4' WHERE "classroomId" = 'room-1791986992661';
UPDATE public."Attendance" SET "classroomId" = 'room-6-5' WHERE "classroomId" = 'room-1791986992750';

UPDATE public."AssessmentColumn" SET "classroomId" = 'room-1-3' WHERE "classroomId" = 'room-1791986382424';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-1-4' WHERE "classroomId" = 'room-1791986989206';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-1-5' WHERE "classroomId" = 'room-1791986989299';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-1-6' WHERE "classroomId" = 'room-1791986989463';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-2-2' WHERE "classroomId" = 'room-1791986989821';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-2-3' WHERE "classroomId" = 'room-1791986989917';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-2-4' WHERE "classroomId" = 'room-1791986990077';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-2-5' WHERE "classroomId" = 'room-1791986990215';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-2-6' WHERE "classroomId" = 'room-1791986990304';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-3-3' WHERE "classroomId" = 'room-1791986990658';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-3-4' WHERE "classroomId" = 'room-1791986990739';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-4-2' WHERE "classroomId" = 'room-1791986991229';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-4-3' WHERE "classroomId" = 'room-1791986991311';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-4-4' WHERE "classroomId" = 'room-1791986991422';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-4-5' WHERE "classroomId" = 'room-1791986991588';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-4-6' WHERE "classroomId" = 'room-1791986991678';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-5-2' WHERE "classroomId" = 'room-1791986991897';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-5-3' WHERE "classroomId" = 'room-1791986991984';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-5-4' WHERE "classroomId" = 'room-1791986992100';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-5-5' WHERE "classroomId" = 'room-1791986992175';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-5-6' WHERE "classroomId" = 'room-1791986992256';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-6-2' WHERE "classroomId" = 'room-1791986992494';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-6-3' WHERE "classroomId" = 'room-1791986992580';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-6-4' WHERE "classroomId" = 'room-1791986992661';
UPDATE public."AssessmentColumn" SET "classroomId" = 'room-6-5' WHERE "classroomId" = 'room-1791986992750';


-- 4. จัดการตาราง kps_cloud_store (ลบ Legacy Key และอัปเดต Live Attendance)
DELETE FROM public.kps_cloud_store WHERE key LIKE 'cls_students_room-179%';

UPDATE public.kps_cloud_store
SET key = REPLACE(key, 'room-1791986991422', 'room-4-4')
WHERE key LIKE '%room-1791986991422%';

UPDATE public.kps_cloud_store
SET key = REPLACE(key, 'room-1791986992100', 'room-5-4')
WHERE key LIKE '%room-1791986992100%';

UPDATE public.kps_cloud_store
SET key = REPLACE(key, 'room-1791986992494', 'room-6-2')
WHERE key LIKE '%room-1791986992494%';

UPDATE public.kps_cloud_store
SET key = REPLACE(key, 'room-1791986992580', 'room-6-3')
WHERE key LIKE '%room-1791986992580%';

UPDATE public.kps_cloud_store
SET key = REPLACE(key, 'room-1791986989299', 'room-1-5')
WHERE key LIKE '%room-1791986989299%';

COMMIT;
