import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const csvContent = fs.readFileSync('scratch/official_roster_user.csv', 'utf8');
const lines = csvContent.split('\n');

let currentGrade = 0;
let currentRoom = 0;
const parsedStudents = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const gradeMatch = line.match(/ชั้น\s*ม\.?\s*(\d+)/);
  if (gradeMatch && !line.includes('รวม')) {
    currentGrade = parseInt(gradeMatch[1], 10);
    currentRoom = 1;
    continue;
  }

  const summaryMatch = line.match(/ห้องที่\s*(\d+)\s*รวม\s*(\d+)\s*คน/);
  if (summaryMatch) {
    const sumRoom = parseInt(summaryMatch[1], 10);
    if (sumRoom !== 0) {
      currentRoom = sumRoom + 1;
    }
    continue;
  }

  const studentMatch = line.match(/^,(\d+),,,(\d+),,,([^,]+),/);
  if (studentMatch && currentGrade > 0 && currentRoom > 0) {
    const seatNo = parseInt(studentMatch[1], 10);
    const studentCode = studentMatch[2].trim();
    const fullName = studentMatch[3].trim().replace(/\s+/g, ' ');

    // Extract title, first name, last name
    let title = '';
    let nameWithoutTitle = fullName;
    const titleMatch = fullName.match(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว|ด\.ช\.|ด\.ญ\.|น\.ส\.)\s*(.*)/);
    if (titleMatch) {
      title = titleMatch[1];
      nameWithoutTitle = titleMatch[2].trim();
    }
    const parts = nameWithoutTitle.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    let gender = 'MALE';
    if (['เด็กหญิง', 'นางสาว', 'ด.ญ.', 'น.ส.'].includes(title)) {
      gender = 'FEMALE';
    }

    parsedStudents.push({
      grade: currentGrade,
      room: currentRoom,
      roomName: `ม.${currentGrade}/${currentRoom}`,
      roomId: `room-${currentGrade}-${currentRoom}`,
      seatNo,
      studentCode,
      fullName,
      title,
      firstName,
      lastName,
      gender
    });
  }
}

async function prepare() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  const allDbStudents = await client.query('SELECT id, "studentCode" FROM public."Student"');
  const dbCodes = new Set(allDbStudents.rows.map(s => s.studentCode));

  const missing98 = parsedStudents.filter(s => !dbCodes.has(s.studentCode));
  console.log(`Found ${missing98.length} students missing from DB.`);

  let sql = `-- Migration 009 (Optional / Ready on User Consent): Import 98 New/Transfer Students from Official Roster
BEGIN;

`;

  for (const s of missing98) {
    const stuId = `stu-${s.studentCode}`;
    const sleId2 = `sle-${stuId}-2569-2`;
    const sleId1 = `sle-${stuId}-2569-1`;

    sql += `
-- ${s.studentCode}: ${s.fullName} (${s.roomName} เลขที่ ${s.seatNo})
INSERT INTO public."Student" (
  id, "studentCode", title, "firstName", "lastName", gender, status, academic_status, "createdAt", "updatedAt"
) VALUES (
  '${stuId}', '${s.studentCode}', '${s.title}', '${s.firstName}', '${s.lastName}', '${s.gender}', 'ACTIVE', 'STUDYING', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "updatedAt" = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  '${sleId2}', '${stuId}', '${s.roomId}', 2569, 2, ${s.seatNo}, 'ACTIVE', '${s.grade}', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  classroom_id = EXCLUDED.classroom_id, roll_number = EXCLUDED.roll_number, status = 'ACTIVE', updated_at = NOW();

INSERT INTO public.student_enrollments (
  id, student_id, classroom_id, academic_year, semester, roll_number, status, grade_level, created_at, updated_at
) VALUES (
  '${sleId1}', '${stuId}', '${s.roomId}', 2569, 1, ${s.seatNo}, 'COMPLETED', '${s.grade}', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
`;
  }

  sql += `
COMMIT;
`;

  fs.writeFileSync('migrations/009_import_98_new_students.sql', sql, 'utf8');
  console.log('✅ Generated migrations/009_import_98_new_students.sql');

  // Generate Room Breakdown table for reporting
  const roomBreakdown = {};
  for (const s of parsedStudents) {
    if (!roomBreakdown[s.roomName]) {
      roomBreakdown[s.roomName] = { totalOfficial: 0, inDb: 0, missingFromDb: 0 };
    }
    roomBreakdown[s.roomName].totalOfficial++;
    if (dbCodes.has(s.studentCode)) {
      roomBreakdown[s.roomName].inDb++;
    } else {
      roomBreakdown[s.roomName].missingFromDb++;
    }
  }

  // Account for 16038 who is now enrolled in room-5-4
  if (dbCodes.has('16038')) {
    // Already in dbCodes
  }

  console.log('\n--- Complete Room-by-Room Breakdown ---');
  console.table(roomBreakdown);

  await client.end();
}

prepare();
