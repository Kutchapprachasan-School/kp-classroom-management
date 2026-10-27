-- ==============================================================================
-- Migration 008: Enroll Student 16038 and Sync M.4/4 Seat Numbers with Official Roster
-- Academic Year 2569
-- ==============================================================================

BEGIN;

-- 1. Enroll student 16038 (นายกิตติศักดิ์ รักษากิจ) into room-5-4 (ม.5/4), Seat 13
-- Insert into student_enrollments (Active in Term 2)
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
  'sle-stu-16038-2569-2',
  'stu-16038',
  'room-5-4',
  2569,
  2,
  13,
  'ACTIVE',
  '5',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  classroom_id = 'room-5-4',
  roll_number = 13,
  status = 'ACTIVE',
  grade_level = '5',
  updated_at = NOW();

-- Also ensure term 1 completed record exists for continuity:
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
  'sle-stu-16038-2569-1',
  'stu-16038',
  'room-5-4',
  2569,
  1,
  13,
  'COMPLETED',
  '5',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Explicitly ensure "StudentEnrollment" base table for SMS is in sync
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
  'sle-stu-16038-2569-2',
  'stu-16038',
  2569,
  2,
  'room-5-4',
  5,
  4,
  13,
  'ENROLLED'::"EnrollmentStatus",
  NOW(),
  NOW()
)
ON CONFLICT ("studentId", "academicYear", term) DO UPDATE SET
  "classRoomId" = 'room-5-4',
  "gradeLevel" = 5,
  "roomNumber" = 4,
  "rollNumber" = 13,
  status = 'ENROLLED'::"EnrollmentStatus",
  "updatedAt" = NOW();

-- 2. Update seat numbers for the 15 female students in room-4-4 to align with official roster (seats 19-33)
UPDATE public.student_enrollments
SET roll_number = CASE s."studentCode"
  WHEN '15146' THEN 19
  WHEN '15171' THEN 20
  WHEN '15285' THEN 21
  WHEN '15293' THEN 22
  WHEN '15314' THEN 23
  WHEN '15318' THEN 24
  WHEN '15319' THEN 25
  WHEN '15328' THEN 26
  WHEN '15346' THEN 27
  WHEN '15354' THEN 28
  WHEN '15355' THEN 29
  WHEN '15356' THEN 30
  WHEN '15359' THEN 31
  WHEN '15362' THEN 32
  WHEN '15434' THEN 33
  ELSE roll_number
END,
updated_at = NOW()
FROM public."Student" s
WHERE s.id = student_enrollments.student_id
  AND student_enrollments.classroom_id = 'room-4-4'
  AND s."studentCode" IN (
    '15146','15171','15285','15293','15314',
    '15318','15319','15328','15346','15354',
    '15355','15356','15359','15362','15434'
  );

UPDATE public."StudentEnrollment"
SET "rollNumber" = CASE s."studentCode"
  WHEN '15146' THEN 19
  WHEN '15171' THEN 20
  WHEN '15285' THEN 21
  WHEN '15293' THEN 22
  WHEN '15314' THEN 23
  WHEN '15318' THEN 24
  WHEN '15319' THEN 25
  WHEN '15328' THEN 26
  WHEN '15346' THEN 27
  WHEN '15354' THEN 28
  WHEN '15355' THEN 29
  WHEN '15356' THEN 30
  WHEN '15359' THEN 31
  WHEN '15362' THEN 32
  WHEN '15434' THEN 33
  ELSE "rollNumber"
END,
"updatedAt" = NOW()
FROM public."Student" s
WHERE s.id = "StudentEnrollment"."studentId"
  AND "StudentEnrollment"."classRoomId" = 'room-4-4'
  AND s."studentCode" IN (
    '15146','15171','15285','15293','15314',
    '15318','15319','15328','15346','15354',
    '15355','15356','15359','15362','15434'
  );

COMMIT;
