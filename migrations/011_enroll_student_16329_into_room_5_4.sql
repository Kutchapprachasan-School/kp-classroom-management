-- ==============================================================================
-- Migration 011: Enroll New Student 16329 into room-5-4 (ม.5/4), Seat 29
-- ==============================================================================

BEGIN;

-- 1. Insert active enrollment into student_enrollments (Semester 2)
INSERT INTO public.student_enrollments (
  id,
  student_id,
  classroom_id,
  academic_year,
  semester,
  roll_number,
  status,
  grade_level,
  created_at,
  updated_at
) VALUES (
  'sle-stu-16329-2569-2',
  'stu-16329',
  'room-5-4',
  2569,
  2,
  29,
  'ACTIVE',
  '5',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-5-4',
  roll_number = 29,
  status = 'ACTIVE',
  grade_level = '5',
  updated_at = NOW();

-- 2. Insert continuity record for Semester 1
INSERT INTO public.student_enrollments (
  id,
  student_id,
  classroom_id,
  academic_year,
  semester,
  roll_number,
  status,
  grade_level,
  created_at,
  updated_at
) VALUES (
  'sle-stu-16329-2569-1',
  'stu-16329',
  'room-5-4',
  2569,
  1,
  29,
  'COMPLETED',
  '5',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Explicitly ensure "StudentEnrollment" base table for SMS is in sync
INSERT INTO public."StudentEnrollment" (
  id,
  "studentId",
  "academicYear",
  term,
  "classRoomId",
  "gradeLevel",
  "roomNumber",
  "rollNumber",
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  'sle-stu-16329-2569-2',
  'stu-16329',
  2569,
  2,
  'room-5-4',
  5,
  4,
  29,
  'ENROLLED'::"EnrollmentStatus",
  NOW(),
  NOW()
) ON CONFLICT ("studentId", "academicYear", term) DO UPDATE SET
  "classRoomId" = 'room-5-4',
  "gradeLevel" = 5,
  "roomNumber" = 4,
  "rollNumber" = 29,
  status = 'ENROLLED'::"EnrollmentStatus",
  "updatedAt" = NOW();

COMMIT;
