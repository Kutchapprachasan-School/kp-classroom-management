-- Migration 009 (Optional / Ready on User Consent): Import 98 New/Transfer Students from Official Roster
BEGIN;


-- 16297: เด็กชายกฤษฎา ตะกาล (ม.2/2 เลขที่ 16)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16297', '16297', 'เด็กชาย', 'กฤษฎา', 'ตะกาล', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16297-2569-2', 'stu-16297', 'room-2-2', 2569, 2, 16, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16297-2569-1', 'stu-16297', 'room-2-2', 2569, 1, 16, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16301: เด็กชายกฤษฌากร อระมาลี (ม.2/2 เลขที่ 17)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16301', '16301', 'เด็กชาย', 'กฤษฌากร', 'อระมาลี', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16301-2569-2', 'stu-16301', 'room-2-2', 2569, 2, 17, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16301-2569-1', 'stu-16301', 'room-2-2', 2569, 1, 17, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16327: เด็กชายอภิวัฒน์ รุ่งแสง (ม.2/2 เลขที่ 18)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16327', '16327', 'เด็กชาย', 'อภิวัฒน์', 'รุ่งแสง', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16327-2569-2', 'stu-16327', 'room-2-2', 2569, 2, 18, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16327-2569-1', 'stu-16327', 'room-2-2', 2569, 1, 18, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16015: เด็กหญิงภัชกร ลุนอุดม (ม.2/2 เลขที่ 35)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16015', '16015', 'เด็กหญิง', 'ภัชกร', 'ลุนอุดม', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16015-2569-2', 'stu-16015', 'room-2-2', 2569, 2, 35, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16015-2569-1', 'stu-16015', 'room-2-2', 2569, 1, 35, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16048: เด็กหญิงอธิชา สีสุข (ม.2/2 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16048', '16048', 'เด็กหญิง', 'อธิชา', 'สีสุข', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16048-2569-2', 'stu-16048', 'room-2-2', 2569, 2, 36, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16048-2569-1', 'stu-16048', 'room-2-2', 2569, 1, 36, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16049: เด็กหญิงขวัญกมล การแก้ว (ม.2/2 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16049', '16049', 'เด็กหญิง', 'ขวัญกมล', 'การแก้ว', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16049-2569-2', 'stu-16049', 'room-2-2', 2569, 2, 37, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16049-2569-1', 'stu-16049', 'room-2-2', 2569, 1, 37, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16311: เด็กหญิงธัญจิรา แก้วกรด (ม.2/2 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16311', '16311', 'เด็กหญิง', 'ธัญจิรา', 'แก้วกรด', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16311-2569-2', 'stu-16311', 'room-2-2', 2569, 2, 38, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16311-2569-1', 'stu-16311', 'room-2-2', 2569, 1, 38, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 15841: เด็กหญิงธีรกาณต์ หล้าวิชา (ม.2/3 เลขที่ 25)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-15841', '15841', 'เด็กหญิง', 'ธีรกาณต์', 'หล้าวิชา', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-15841-2569-2', 'stu-15841', 'room-2-3', 2569, 2, 25, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-15841-2569-1', 'stu-15841', 'room-2-3', 2569, 1, 25, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16313: เด็กหญิงกัญญาณัฐ เสนอกลาง (ม.2/3 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16313', '16313', 'เด็กหญิง', 'กัญญาณัฐ', 'เสนอกลาง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16313-2569-2', 'stu-16313', 'room-2-3', 2569, 2, 36, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16313-2569-1', 'stu-16313', 'room-2-3', 2569, 1, 36, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16321: เด็กหญิงปภาดา จันดาหาร (ม.2/3 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16321', '16321', 'เด็กหญิง', 'ปภาดา', 'จันดาหาร', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16321-2569-2', 'stu-16321', 'room-2-3', 2569, 2, 37, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16321-2569-1', 'stu-16321', 'room-2-3', 2569, 1, 37, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16002: เด็กชายเมธาวิชย์ หาสุข (ม.2/4 เลขที่ 17)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16002', '16002', 'เด็กชาย', 'เมธาวิชย์', 'หาสุข', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16002-2569-2', 'stu-16002', 'room-2-4', 2569, 2, 17, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16002-2569-1', 'stu-16002', 'room-2-4', 2569, 1, 17, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16003: เด็กหญิงเนตรกมล ปั้นสง่า (ม.2/4 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16003', '16003', 'เด็กหญิง', 'เนตรกมล', 'ปั้นสง่า', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16003-2569-2', 'stu-16003', 'room-2-4', 2569, 2, 36, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16003-2569-1', 'stu-16003', 'room-2-4', 2569, 1, 36, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16014: เด็กหญิงศิชฏาเมขลา อ่ำนวล (ม.2/4 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16014', '16014', 'เด็กหญิง', 'ศิชฏาเมขลา', 'อ่ำนวล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16014-2569-2', 'stu-16014', 'room-2-4', 2569, 2, 37, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16014-2569-1', 'stu-16014', 'room-2-4', 2569, 1, 37, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16041: เด็กหญิงนันทนิชชา พิลากุล (ม.2/4 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16041', '16041', 'เด็กหญิง', 'นันทนิชชา', 'พิลากุล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16041-2569-2', 'stu-16041', 'room-2-4', 2569, 2, 38, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16041-2569-1', 'stu-16041', 'room-2-4', 2569, 1, 38, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16315: เด็กหญิงยิ่งลักษณ์ น้อยคำมูล (ม.2/4 เลขที่ 39)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16315', '16315', 'เด็กหญิง', 'ยิ่งลักษณ์', 'น้อยคำมูล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16315-2569-2', 'stu-16315', 'room-2-4', 2569, 2, 39, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16315-2569-1', 'stu-16315', 'room-2-4', 2569, 1, 39, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16324: เด็กหญิงอรอินทุ์ ไชยวงษ์ศา (ม.2/4 เลขที่ 40)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16324', '16324', 'เด็กหญิง', 'อรอินทุ์', 'ไชยวงษ์ศา', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16324-2569-2', 'stu-16324', 'room-2-4', 2569, 2, 40, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16324-2569-1', 'stu-16324', 'room-2-4', 2569, 1, 40, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16004: เด็กชายธนวัฒน์ ชาวเชียงยืน (ม.2/5 เลขที่ 18)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16004', '16004', 'เด็กชาย', 'ธนวัฒน์', 'ชาวเชียงยืน', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16004-2569-2', 'stu-16004', 'room-2-5', 2569, 2, 18, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16004-2569-1', 'stu-16004', 'room-2-5', 2569, 1, 18, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16042: เด็กชายก้องภพ แสวงศรี (ม.2/5 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16042', '16042', 'เด็กชาย', 'ก้องภพ', 'แสวงศรี', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16042-2569-2', 'stu-16042', 'room-2-5', 2569, 2, 19, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16042-2569-1', 'stu-16042', 'room-2-5', 2569, 1, 19, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16018: เด็กหญิงปิ่นอนงค์ สารีบุญ (ม.2/5 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16018', '16018', 'เด็กหญิง', 'ปิ่นอนงค์', 'สารีบุญ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16018-2569-2', 'stu-16018', 'room-2-5', 2569, 2, 36, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16018-2569-1', 'stu-16018', 'room-2-5', 2569, 1, 36, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16055: เด็กหญิงกมลวรรณ ยุพิน (ม.2/5 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16055', '16055', 'เด็กหญิง', 'กมลวรรณ', 'ยุพิน', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16055-2569-2', 'stu-16055', 'room-2-5', 2569, 2, 37, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16055-2569-1', 'stu-16055', 'room-2-5', 2569, 1, 37, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16304: เด็กหญิงโนร์ไอริน อูเซ็ง (ม.2/5 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16304', '16304', 'เด็กหญิง', 'โนร์ไอริน', 'อูเซ็ง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16304-2569-2', 'stu-16304', 'room-2-5', 2569, 2, 38, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16304-2569-1', 'stu-16304', 'room-2-5', 2569, 1, 38, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16309: เด็กหญิงอินทิรา รักษากิจ (ม.2/5 เลขที่ 39)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16309', '16309', 'เด็กหญิง', 'อินทิรา', 'รักษากิจ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16309-2569-2', 'stu-16309', 'room-2-5', 2569, 2, 39, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16309-2569-1', 'stu-16309', 'room-2-5', 2569, 1, 39, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16320: เด็กหญิงเบญจพร ภูคองทุ่ง (ม.2/5 เลขที่ 40)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16320', '16320', 'เด็กหญิง', 'เบญจพร', 'ภูคองทุ่ง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16320-2569-2', 'stu-16320', 'room-2-5', 2569, 2, 40, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16320-2569-1', 'stu-16320', 'room-2-5', 2569, 1, 40, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16027: เด็กชายศักดิ์ชัย ชินคำ (ม.2/6 เลขที่ 13)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16027', '16027', 'เด็กชาย', 'ศักดิ์ชัย', 'ชินคำ', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16027-2569-2', 'stu-16027', 'room-2-6', 2569, 2, 13, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16027-2569-1', 'stu-16027', 'room-2-6', 2569, 1, 13, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16037: เด็กชายณิกร พลกล้า (ม.2/6 เลขที่ 14)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16037', '16037', 'เด็กชาย', 'ณิกร', 'พลกล้า', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16037-2569-2', 'stu-16037', 'room-2-6', 2569, 2, 14, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16037-2569-1', 'stu-16037', 'room-2-6', 2569, 1, 14, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16007: เด็กหญิงเจตสุดา ทาวงษ์ (ม.2/6 เลขที่ 33)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16007', '16007', 'เด็กหญิง', 'เจตสุดา', 'ทาวงษ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16007-2569-2', 'stu-16007', 'room-2-6', 2569, 2, 33, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16007-2569-1', 'stu-16007', 'room-2-6', 2569, 1, 33, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16008: เด็กหญิงฐิติรัตน์ พิพิธศาลา (ม.2/6 เลขที่ 34)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16008', '16008', 'เด็กหญิง', 'ฐิติรัตน์', 'พิพิธศาลา', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16008-2569-2', 'stu-16008', 'room-2-6', 2569, 2, 34, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16008-2569-1', 'stu-16008', 'room-2-6', 2569, 1, 34, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16046: เด็กหญิงตรีนัส ไขแดง (ม.2/6 เลขที่ 35)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16046', '16046', 'เด็กหญิง', 'ตรีนัส', 'ไขแดง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16046-2569-2', 'stu-16046', 'room-2-6', 2569, 2, 35, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16046-2569-1', 'stu-16046', 'room-2-6', 2569, 1, 35, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16291: เด็กหญิงธนัญญา ศิริ (ม.2/6 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16291', '16291', 'เด็กหญิง', 'ธนัญญา', 'ศิริ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16291-2569-2', 'stu-16291', 'room-2-6', 2569, 2, 36, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16291-2569-1', 'stu-16291', 'room-2-6', 2569, 1, 36, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16312: เด็กหญิงณัฐริตา อ้อมนอก (ม.2/6 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16312', '16312', 'เด็กหญิง', 'ณัฐริตา', 'อ้อมนอก', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16312-2569-2', 'stu-16312', 'room-2-6', 2569, 2, 37, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16312-2569-1', 'stu-16312', 'room-2-6', 2569, 1, 37, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16316: เด็กหญิงปรีดาพร สุทธิสินธุ์ (ม.2/6 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16316', '16316', 'เด็กหญิง', 'ปรีดาพร', 'สุทธิสินธุ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16316-2569-2', 'stu-16316', 'room-2-6', 2569, 2, 38, 'ACTIVE', '2', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16316-2569-1', 'stu-16316', 'room-2-6', 2569, 1, 38, 'COMPLETED', '2', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 15524: นางสาวสุวิชาดา บุตรภู (ม.3/2 เลขที่ 30)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-15524', '15524', 'นางสาว', 'สุวิชาดา', 'บุตรภู', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-15524-2569-2', 'stu-15524', 'room-3-2', 2569, 2, 30, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-15524-2569-1', 'stu-15524', 'room-3-2', 2569, 1, 30, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16009: นางสาวอริษา สิทธิกุล (ม.3/2 เลขที่ 33)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16009', '16009', 'นางสาว', 'อริษา', 'สิทธิกุล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16009-2569-2', 'stu-16009', 'room-3-2', 2569, 2, 33, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16009-2569-1', 'stu-16009', 'room-3-2', 2569, 1, 33, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16010: นางสาวพรรณวิลา ทองบุตร (ม.3/2 เลขที่ 34)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16010', '16010', 'นางสาว', 'พรรณวิลา', 'ทองบุตร', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16010-2569-2', 'stu-16010', 'room-3-2', 2569, 2, 34, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16010-2569-1', 'stu-16010', 'room-3-2', 2569, 1, 34, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16022: นางสาวอมลธิรา มะธิโต (ม.3/2 เลขที่ 35)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16022', '16022', 'นางสาว', 'อมลธิรา', 'มะธิโต', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16022-2569-2', 'stu-16022', 'room-3-2', 2569, 2, 35, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16022-2569-1', 'stu-16022', 'room-3-2', 2569, 1, 35, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16040: นายเดชปภัช อัฐมาลา (ม.3/3 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16040', '16040', 'นาย', 'เดชปภัช', 'อัฐมาลา', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16040-2569-2', 'stu-16040', 'room-3-3', 2569, 2, 19, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16040-2569-1', 'stu-16040', 'room-3-3', 2569, 1, 19, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16053: เด็กชายพันธุ์พิพัฒน์ ประทุมวัน (ม.3/4 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16053', '16053', 'เด็กชาย', 'พันธุ์พิพัฒน์', 'ประทุมวัน', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16053-2569-2', 'stu-16053', 'room-3-4', 2569, 2, 19, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16053-2569-1', 'stu-16053', 'room-3-4', 2569, 1, 19, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16296: เด็กชายธนกฤต เหมืองทอง (ม.3/4 เลขที่ 20)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16296', '16296', 'เด็กชาย', 'ธนกฤต', 'เหมืองทอง', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16296-2569-2', 'stu-16296', 'room-3-4', 2569, 2, 20, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16296-2569-1', 'stu-16296', 'room-3-4', 2569, 1, 20, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16303: เด็กชายวีรภัทร บรรพต (ม.3/4 เลขที่ 21)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16303', '16303', 'เด็กชาย', 'วีรภัทร', 'บรรพต', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16303-2569-2', 'stu-16303', 'room-3-4', 2569, 2, 21, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16303-2569-1', 'stu-16303', 'room-3-4', 2569, 1, 21, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16307: นายกิตติพศ พิจารโชติ (ม.3/4 เลขที่ 22)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16307', '16307', 'นาย', 'กิตติพศ', 'พิจารโชติ', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16307-2569-2', 'stu-16307', 'room-3-4', 2569, 2, 22, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16307-2569-1', 'stu-16307', 'room-3-4', 2569, 1, 22, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16314: นายรัฐภูมิ ปลัดศรีช่วย (ม.3/4 เลขที่ 23)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16314', '16314', 'นาย', 'รัฐภูมิ', 'ปลัดศรีช่วย', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16314-2569-2', 'stu-16314', 'room-3-4', 2569, 2, 23, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16314-2569-1', 'stu-16314', 'room-3-4', 2569, 1, 23, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16016: เด็กหญิงสิรินันท์ จิรพัฒน์ไพลิน (ม.3/4 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16016', '16016', 'เด็กหญิง', 'สิรินันท์', 'จิรพัฒน์ไพลิน', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16016-2569-2', 'stu-16016', 'room-3-4', 2569, 2, 38, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16016-2569-1', 'stu-16016', 'room-3-4', 2569, 1, 38, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16050: เด็กหญิงวิยะดา สีดาห้าว (ม.3/4 เลขที่ 39)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16050', '16050', 'เด็กหญิง', 'วิยะดา', 'สีดาห้าว', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16050-2569-2', 'stu-16050', 'room-3-4', 2569, 2, 39, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16050-2569-1', 'stu-16050', 'room-3-4', 2569, 1, 39, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16030: เด็กชายธนทรัพย์ ท้าวมะลิ (ม.3/5 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16030', '16030', 'เด็กชาย', 'ธนทรัพย์', 'ท้าวมะลิ', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16030-2569-2', 'stu-16030', 'room-3-5', 2569, 2, 19, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16030-2569-1', 'stu-16030', 'room-3-5', 2569, 1, 19, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16032: เด็กหญิงอริยา ช่วยแสง (ม.3/5 เลขที่ 35)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16032', '16032', 'เด็กหญิง', 'อริยา', 'ช่วยแสง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16032-2569-2', 'stu-16032', 'room-3-5', 2569, 2, 35, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16032-2569-1', 'stu-16032', 'room-3-5', 2569, 1, 35, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16328: นางสาวพิมพัตรา เกิดไก่แก้ว (ม.3/5 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16328', '16328', 'นางสาว', 'พิมพัตรา', 'เกิดไก่แก้ว', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16328-2569-2', 'stu-16328', 'room-3-5', 2569, 2, 36, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16328-2569-1', 'stu-16328', 'room-3-5', 2569, 1, 36, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16033: นางสาวพลอยปภัส สาระพันธ์ (ม.3/6 เลขที่ 32)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16033', '16033', 'นางสาว', 'พลอยปภัส', 'สาระพันธ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16033-2569-2', 'stu-16033', 'room-3-6', 2569, 2, 32, 'ACTIVE', '3', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16033-2569-1', 'stu-16033', 'room-3-6', 2569, 1, 32, 'COMPLETED', '3', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16253: นายวุฒิภัทร โม้ภักดี (ม.4/2 เลขที่ 6)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16253', '16253', 'นาย', 'วุฒิภัทร', 'โม้ภักดี', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16253-2569-2', 'stu-16253', 'room-4-2', 2569, 2, 6, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16253-2569-1', 'stu-16253', 'room-4-2', 2569, 1, 6, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16011: นางสาวนภัสสร พฤกษาสิทธิ์ (ม.4/2 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16011', '16011', 'นางสาว', 'นภัสสร', 'พฤกษาสิทธิ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16011-2569-2', 'stu-16011', 'room-4-2', 2569, 2, 19, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16011-2569-1', 'stu-16011', 'room-4-2', 2569, 1, 19, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16052: นางสาวปภาวรินทร์ โพธิ์เพชรเล็บ (ม.4/2 เลขที่ 20)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16052', '16052', 'นางสาว', 'ปภาวรินทร์', 'โพธิ์เพชรเล็บ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16052-2569-2', 'stu-16052', 'room-4-2', 2569, 2, 20, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16052-2569-1', 'stu-16052', 'room-4-2', 2569, 1, 20, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16254: นางสาวกมลทิพย์ ทิพย์รักษา (ม.4/2 เลขที่ 21)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16254', '16254', 'นางสาว', 'กมลทิพย์', 'ทิพย์รักษา', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16254-2569-2', 'stu-16254', 'room-4-2', 2569, 2, 21, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16254-2569-1', 'stu-16254', 'room-4-2', 2569, 1, 21, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16255: นางสาวชลธิชา กิ่งพิลา (ม.4/2 เลขที่ 22)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16255', '16255', 'นางสาว', 'ชลธิชา', 'กิ่งพิลา', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16255-2569-2', 'stu-16255', 'room-4-2', 2569, 2, 22, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16255-2569-1', 'stu-16255', 'room-4-2', 2569, 1, 22, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16256: นางสาวณิชานาฎ เสนอกลาง (ม.4/2 เลขที่ 23)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16256', '16256', 'นางสาว', 'ณิชานาฎ', 'เสนอกลาง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16256-2569-2', 'stu-16256', 'room-4-2', 2569, 2, 23, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16256-2569-1', 'stu-16256', 'room-4-2', 2569, 1, 23, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16258: นางสาวธนาภา อาตสามารถ (ม.4/2 เลขที่ 24)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16258', '16258', 'นางสาว', 'ธนาภา', 'อาตสามารถ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16258-2569-2', 'stu-16258', 'room-4-2', 2569, 2, 24, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16258-2569-1', 'stu-16258', 'room-4-2', 2569, 1, 24, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16259: นางสาวเนตรนภา เคนกิจ (ม.4/2 เลขที่ 25)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16259', '16259', 'นางสาว', 'เนตรนภา', 'เคนกิจ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16259-2569-2', 'stu-16259', 'room-4-2', 2569, 2, 25, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16259-2569-1', 'stu-16259', 'room-4-2', 2569, 1, 25, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16305: นางสาวณัฐมน กงเวียน (ม.4/2 เลขที่ 26)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16305', '16305', 'นางสาว', 'ณัฐมน', 'กงเวียน', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16305-2569-2', 'stu-16305', 'room-4-2', 2569, 2, 26, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16305-2569-1', 'stu-16305', 'room-4-2', 2569, 1, 26, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16260: นายเตชิต ธิปแสง (ม.4/3 เลขที่ 4)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16260', '16260', 'นาย', 'เตชิต', 'ธิปแสง', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16260-2569-2', 'stu-16260', 'room-4-3', 2569, 2, 4, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16260-2569-1', 'stu-16260', 'room-4-3', 2569, 1, 4, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16261: นางสาวชุติกาญจน์ ไปล่งูเหลือม (ม.4/3 เลขที่ 14)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16261', '16261', 'นางสาว', 'ชุติกาญจน์', 'ไปล่งูเหลือม', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16261-2569-2', 'stu-16261', 'room-4-3', 2569, 2, 14, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16261-2569-1', 'stu-16261', 'room-4-3', 2569, 1, 14, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16262: นางสาวบุณยานุช นันทะสี (ม.4/3 เลขที่ 15)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16262', '16262', 'นางสาว', 'บุณยานุช', 'นันทะสี', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16262-2569-2', 'stu-16262', 'room-4-3', 2569, 2, 15, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16262-2569-1', 'stu-16262', 'room-4-3', 2569, 1, 15, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16263: นางสาวปนิตา พานิพัตร์ (ม.4/3 เลขที่ 16)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16263', '16263', 'นางสาว', 'ปนิตา', 'พานิพัตร์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16263-2569-2', 'stu-16263', 'room-4-3', 2569, 2, 16, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16263-2569-1', 'stu-16263', 'room-4-3', 2569, 1, 16, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16264: นางสาวพิยะดา แก้วกาน (ม.4/3 เลขที่ 17)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16264', '16264', 'นางสาว', 'พิยะดา', 'แก้วกาน', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16264-2569-2', 'stu-16264', 'room-4-3', 2569, 2, 17, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16264-2569-1', 'stu-16264', 'room-4-3', 2569, 1, 17, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16265: นางสาวเม ศิริแสง (ม.4/3 เลขที่ 18)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16265', '16265', 'นางสาว', 'เม', 'ศิริแสง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16265-2569-2', 'stu-16265', 'room-4-3', 2569, 2, 18, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16265-2569-1', 'stu-16265', 'room-4-3', 2569, 1, 18, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16266: นางสาวอรทัย ยวนใจ (ม.4/3 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16266', '16266', 'นางสาว', 'อรทัย', 'ยวนใจ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16266-2569-2', 'stu-16266', 'room-4-3', 2569, 2, 19, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16266-2569-1', 'stu-16266', 'room-4-3', 2569, 1, 19, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16267: นางสาวอุมาพร เค้าแก้ว (ม.4/3 เลขที่ 20)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16267', '16267', 'นางสาว', 'อุมาพร', 'เค้าแก้ว', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16267-2569-2', 'stu-16267', 'room-4-3', 2569, 2, 20, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16267-2569-1', 'stu-16267', 'room-4-3', 2569, 1, 20, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16290: นางสาวสุนิสา จันทะแสง (ม.4/3 เลขที่ 21)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16290', '16290', 'นางสาว', 'สุนิสา', 'จันทะแสง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16290-2569-2', 'stu-16290', 'room-4-3', 2569, 2, 21, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16290-2569-1', 'stu-16290', 'room-4-3', 2569, 1, 21, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16295: นางสาวชลิตา ตุ่นเฮ้า (ม.4/3 เลขที่ 22)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16295', '16295', 'นางสาว', 'ชลิตา', 'ตุ่นเฮ้า', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16295-2569-2', 'stu-16295', 'room-4-3', 2569, 2, 22, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16295-2569-1', 'stu-16295', 'room-4-3', 2569, 1, 22, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16047: นายฐาปกร สมจิตร (ม.4/4 เลขที่ 11)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16047', '16047', 'นาย', 'ฐาปกร', 'สมจิตร', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16047-2569-2', 'stu-16047', 'room-4-4', 2569, 2, 11, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16047-2569-1', 'stu-16047', 'room-4-4', 2569, 1, 11, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16268: นายณัฏฐกรณ์ เยาวลา (ม.4/4 เลขที่ 12)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16268', '16268', 'นาย', 'ณัฏฐกรณ์', 'เยาวลา', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16268-2569-2', 'stu-16268', 'room-4-4', 2569, 2, 12, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16268-2569-1', 'stu-16268', 'room-4-4', 2569, 1, 12, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16269: นายรัฐภูมิ จันอินทร์ (ม.4/4 เลขที่ 13)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16269', '16269', 'นาย', 'รัฐภูมิ', 'จันอินทร์', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16269-2569-2', 'stu-16269', 'room-4-4', 2569, 2, 13, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16269-2569-1', 'stu-16269', 'room-4-4', 2569, 1, 13, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16270: นายศุภณัฐ สารีวงษ์ (ม.4/4 เลขที่ 14)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16270', '16270', 'นาย', 'ศุภณัฐ', 'สารีวงษ์', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16270-2569-2', 'stu-16270', 'room-4-4', 2569, 2, 14, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16270-2569-1', 'stu-16270', 'room-4-4', 2569, 1, 14, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16271: นายสรวิศิษฏ์ ประเสริฐศรี (ม.4/4 เลขที่ 15)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16271', '16271', 'นาย', 'สรวิศิษฏ์', 'ประเสริฐศรี', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16271-2569-2', 'stu-16271', 'room-4-4', 2569, 2, 15, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16271-2569-1', 'stu-16271', 'room-4-4', 2569, 1, 15, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16272: นายเสรีชัย สิงสุวรรณ (ม.4/4 เลขที่ 16)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16272', '16272', 'นาย', 'เสรีชัย', 'สิงสุวรรณ', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16272-2569-2', 'stu-16272', 'room-4-4', 2569, 2, 16, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16272-2569-1', 'stu-16272', 'room-4-4', 2569, 1, 16, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16292: นายทนุธรรม สิงห์สุข (ม.4/4 เลขที่ 17)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16292', '16292', 'นาย', 'ทนุธรรม', 'สิงห์สุข', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16292-2569-2', 'stu-16292', 'room-4-4', 2569, 2, 17, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16292-2569-1', 'stu-16292', 'room-4-4', 2569, 1, 17, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16325: นายชินวัตร เวียงโสม (ม.4/4 เลขที่ 18)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16325', '16325', 'นาย', 'ชินวัตร', 'เวียงโสม', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16325-2569-2', 'stu-16325', 'room-4-4', 2569, 2, 18, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16325-2569-1', 'stu-16325', 'room-4-4', 2569, 1, 18, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16051: นางสาวกัลยา เสียงแจ่ม (ม.4/4 เลขที่ 34)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16051', '16051', 'นางสาว', 'กัลยา', 'เสียงแจ่ม', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16051-2569-2', 'stu-16051', 'room-4-4', 2569, 2, 34, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16051-2569-1', 'stu-16051', 'room-4-4', 2569, 1, 34, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16273: นางสาวกัลยกร แข็งฤทธิ์ (ม.4/4 เลขที่ 35)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16273', '16273', 'นางสาว', 'กัลยกร', 'แข็งฤทธิ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16273-2569-2', 'stu-16273', 'room-4-4', 2569, 2, 35, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16273-2569-1', 'stu-16273', 'room-4-4', 2569, 1, 35, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16274: นางสาวชนทิชา หนูช้างเผือก (ม.4/4 เลขที่ 36)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16274', '16274', 'นางสาว', 'ชนทิชา', 'หนูช้างเผือก', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16274-2569-2', 'stu-16274', 'room-4-4', 2569, 2, 36, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16274-2569-1', 'stu-16274', 'room-4-4', 2569, 1, 36, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16275: นางสาวทิพวรรณ ลาวงศ์ (ม.4/4 เลขที่ 37)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16275', '16275', 'นางสาว', 'ทิพวรรณ', 'ลาวงศ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16275-2569-2', 'stu-16275', 'room-4-4', 2569, 2, 37, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16275-2569-1', 'stu-16275', 'room-4-4', 2569, 1, 37, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16276: นางสาวธนัญชนก หวังพิทักษ์ (ม.4/4 เลขที่ 38)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16276', '16276', 'นางสาว', 'ธนัญชนก', 'หวังพิทักษ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16276-2569-2', 'stu-16276', 'room-4-4', 2569, 2, 38, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16276-2569-1', 'stu-16276', 'room-4-4', 2569, 1, 38, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16277: นางสาวพรกนก คำภิมูล (ม.4/4 เลขที่ 39)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16277', '16277', 'นางสาว', 'พรกนก', 'คำภิมูล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16277-2569-2', 'stu-16277', 'room-4-4', 2569, 2, 39, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16277-2569-1', 'stu-16277', 'room-4-4', 2569, 1, 39, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16278: นางสาวพรนัชชา สุทธิสินธุ์ (ม.4/4 เลขที่ 40)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16278', '16278', 'นางสาว', 'พรนัชชา', 'สุทธิสินธุ์', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16278-2569-2', 'stu-16278', 'room-4-4', 2569, 2, 40, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16278-2569-1', 'stu-16278', 'room-4-4', 2569, 1, 40, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16289: นางสาวธิติมาพร แซ่กล (ม.4/4 เลขที่ 41)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16289', '16289', 'นางสาว', 'ธิติมาพร', 'แซ่กล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16289-2569-2', 'stu-16289', 'room-4-4', 2569, 2, 41, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16289-2569-1', 'stu-16289', 'room-4-4', 2569, 1, 41, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16306: นางสาวนพิษฐา พันปอปิด (ม.4/4 เลขที่ 42)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16306', '16306', 'นางสาว', 'นพิษฐา', 'พันปอปิด', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16306-2569-2', 'stu-16306', 'room-4-4', 2569, 2, 42, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16306-2569-1', 'stu-16306', 'room-4-4', 2569, 1, 42, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16279: นายเกียรติศักดิ์ ลือคำหาญ (ม.4/5 เลขที่ 19)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16279', '16279', 'นาย', 'เกียรติศักดิ์', 'ลือคำหาญ', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16279-2569-2', 'stu-16279', 'room-4-5', 2569, 2, 19, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16279-2569-1', 'stu-16279', 'room-4-5', 2569, 1, 19, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16280: นายชุติเทพ ชนะมาร (ม.4/5 เลขที่ 20)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16280', '16280', 'นาย', 'ชุติเทพ', 'ชนะมาร', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16280-2569-2', 'stu-16280', 'room-4-5', 2569, 2, 20, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16280-2569-1', 'stu-16280', 'room-4-5', 2569, 1, 20, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16281: นายภาณุวิชญ์ วรรณประภา (ม.4/5 เลขที่ 21)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16281', '16281', 'นาย', 'ภาณุวิชญ์', 'วรรณประภา', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16281-2569-2', 'stu-16281', 'room-4-5', 2569, 2, 21, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16281-2569-1', 'stu-16281', 'room-4-5', 2569, 1, 21, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16282: นายวัชรพล รินทา (ม.4/5 เลขที่ 22)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16282', '16282', 'นาย', 'วัชรพล', 'รินทา', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16282-2569-2', 'stu-16282', 'room-4-5', 2569, 2, 22, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16282-2569-1', 'stu-16282', 'room-4-5', 2569, 1, 22, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16283: นางสาวณิชาภัทร จันเทศ (ม.4/5 เลขที่ 28)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16283', '16283', 'นางสาว', 'ณิชาภัทร', 'จันเทศ', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16283-2569-2', 'stu-16283', 'room-4-5', 2569, 2, 28, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16283-2569-1', 'stu-16283', 'room-4-5', 2569, 1, 28, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16284: นางสาวนิกษ์นิภา เลากลาง (ม.4/5 เลขที่ 29)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16284', '16284', 'นางสาว', 'นิกษ์นิภา', 'เลากลาง', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16284-2569-2', 'stu-16284', 'room-4-5', 2569, 2, 29, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16284-2569-1', 'stu-16284', 'room-4-5', 2569, 1, 29, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16285: นางสาวพรรณปพร สีสม (ม.4/5 เลขที่ 30)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16285', '16285', 'นางสาว', 'พรรณปพร', 'สีสม', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16285-2569-2', 'stu-16285', 'room-4-5', 2569, 2, 30, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16285-2569-1', 'stu-16285', 'room-4-5', 2569, 1, 30, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16299: นางสาวกนกนภา ยงย้อย (ม.4/5 เลขที่ 31)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16299', '16299', 'นางสาว', 'กนกนภา', 'ยงย้อย', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16299-2569-2', 'stu-16299', 'room-4-5', 2569, 2, 31, 'ACTIVE', '4', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16299-2569-1', 'stu-16299', 'room-4-5', 2569, 1, 31, 'COMPLETED', '4', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16044: นางสาวขวัญจิรา บุญวิจิตร (ม.5/2 เลขที่ 32)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16044', '16044', 'นางสาว', 'ขวัญจิรา', 'บุญวิจิตร', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16044-2569-2', 'stu-16044', 'room-5-2', 2569, 2, 32, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16044-2569-1', 'stu-16044', 'room-5-2', 2569, 1, 32, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16019: นายสหวัตร ไชยธรรม (ม.5/3 เลขที่ 7)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16019', '16019', 'นาย', 'สหวัตร', 'ไชยธรรม', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16019-2569-2', 'stu-16019', 'room-5-3', 2569, 2, 7, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16019-2569-1', 'stu-16019', 'room-5-3', 2569, 1, 7, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16025: นางสาวศิริขวัญ วันน้อย (ม.5/3 เลขที่ 33)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16025', '16025', 'นางสาว', 'ศิริขวัญ', 'วันน้อย', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16025-2569-2', 'stu-16025', 'room-5-3', 2569, 2, 33, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16025-2569-1', 'stu-16025', 'room-5-3', 2569, 1, 33, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16026: นายรพีภัทร หาญชัย (ม.5/4 เลขที่ 12)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16026', '16026', 'นาย', 'รพีภัทร', 'หาญชัย', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16026-2569-2', 'stu-16026', 'room-5-4', 2569, 2, 12, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16026-2569-1', 'stu-16026', 'room-5-4', 2569, 1, 12, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16031: นางสาวสายไหม อินทนาม (ม.5/5 เลขที่ 21)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16031', '16031', 'นางสาว', 'สายไหม', 'อินทนาม', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16031-2569-2', 'stu-16031', 'room-5-5', 2569, 2, 21, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16031-2569-1', 'stu-16031', 'room-5-5', 2569, 1, 21, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16036: นางสาวสุฑาสินี การถวิล (ม.5/5 เลขที่ 22)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16036', '16036', 'นางสาว', 'สุฑาสินี', 'การถวิล', 'FEMALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16036-2569-2', 'stu-16036', 'room-5-5', 2569, 2, 22, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16036-2569-1', 'stu-16036', 'room-5-5', 2569, 1, 22, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 16034: นายธวัชชัย ทับไทย (ม.5/6 เลขที่ 20)
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  'stu-16034', '16034', 'นาย', 'ธวัชชัย', 'ทับไทย', 'MALE', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16034-2569-2', 'stu-16034', 'room-5-6', 2569, 2, 20, 'ACTIVE', '5', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  'sle-stu-16034-2569-1', 'stu-16034', 'room-5-6', 2569, 1, 20, 'COMPLETED', '5', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

COMMIT;
