-- ==============================================================================
-- Migration 010: Enroll 5 Unenrolled Students into room-6-2 (ม.6/2)
-- Based on Official School Roster for Academic Year 2569
-- ==============================================================================

BEGIN;

-- 1. stu-16028: นายกฤษติธี ชินคำ (Seat 7)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16028-2569-2', 'stu-16028', 'room-6-2', 2569, 2, 7, 'ACTIVE', '6', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-6-2', roll_number = 7, status = 'ACTIVE', grade_level = '6', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16028-2569-1', 'stu-16028', 'room-6-2', 2569, 1, 7, 'COMPLETED', '6', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. stu-16308: นายภาคภูมิ วรรณสนธ์ (Seat 8)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16308-2569-2', 'stu-16308', 'room-6-2', 2569, 2, 8, 'ACTIVE', '6', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-6-2', roll_number = 8, status = 'ACTIVE', grade_level = '6', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16308-2569-1', 'stu-16308', 'room-6-2', 2569, 1, 8, 'COMPLETED', '6', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. stu-16045: นางสาวฐานิยา สุภวิเศษ (Seat 31)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16045-2569-2', 'stu-16045', 'room-6-2', 2569, 2, 31, 'ACTIVE', '6', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-6-2', roll_number = 31, status = 'ACTIVE', grade_level = '6', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16045-2569-1', 'stu-16045', 'room-6-2', 2569, 1, 31, 'COMPLETED', '6', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. stu-16300: นางสาวดีอาน่า ชลดา วิสส์ (Seat 32)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16300-2569-2', 'stu-16300', 'room-6-2', 2569, 2, 32, 'ACTIVE', '6', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-6-2', roll_number = 32, status = 'ACTIVE', grade_level = '6', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16300-2569-1', 'stu-16300', 'room-6-2', 2569, 1, 32, 'COMPLETED', '6', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. stu-16323: นางสาวกันตพร อ่างแก้ว (Seat 33)
INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16323-2569-2', 'stu-16323', 'room-6-2', 2569, 2, 33, 'ACTIVE', '6', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-6-2', roll_number = 33, status = 'ACTIVE', grade_level = '6', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16323-2569-1', 'stu-16323', 'room-6-2', 2569, 1, 33, 'COMPLETED', '6', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Explicitly ensure "StudentEnrollment" base table for SMS is in sync
INSERT INTO public."StudentEnrollment" (
  id, "studentId", "academicYear", term, "classRoomId", "gradeLevel", "roomNumber", "rollNumber", status, "createdAt", "updatedAt"
) VALUES 
  ('sle-stu-16028-2569-2', 'stu-16028', 2569, 2, 'room-6-2', 6, 2, 7, 'ENROLLED'::"EnrollmentStatus", NOW(), NOW()),
  ('sle-stu-16308-2569-2', 'stu-16308', 2569, 2, 'room-6-2', 6, 2, 8, 'ENROLLED'::"EnrollmentStatus", NOW(), NOW()),
  ('sle-stu-16045-2569-2', 'stu-16045', 2569, 2, 'room-6-2', 6, 2, 31, 'ENROLLED'::"EnrollmentStatus", NOW(), NOW()),
  ('sle-stu-16300-2569-2', 'stu-16300', 2569, 2, 'room-6-2', 6, 2, 32, 'ENROLLED'::"EnrollmentStatus", NOW(), NOW()),
  ('sle-stu-16323-2569-2', 'stu-16323', 2569, 2, 'room-6-2', 6, 2, 33, 'ENROLLED'::"EnrollmentStatus", NOW(), NOW())
ON CONFLICT ("studentId", "academicYear", term) DO UPDATE SET
  "classRoomId" = EXCLUDED."classRoomId",
  "gradeLevel" = EXCLUDED."gradeLevel",
  "roomNumber" = EXCLUDED."roomNumber",
  "rollNumber" = EXCLUDED."rollNumber",
  status = 'ENROLLED'::"EnrollmentStatus",
  "updatedAt" = NOW();

COMMIT;
