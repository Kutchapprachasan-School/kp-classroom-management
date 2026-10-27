import fs from 'node:fs';
import pg from 'pg';

const csvContent = fs.readFileSync('scratch/official_roster_user.csv', 'utf8');
const lines = csvContent.split('\n');

const parsedStudents = [];
let currentGrade = 0;
let currentRoom = 0;

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
    const name = studentMatch[3].trim().replace(/\s+/g, ' ');

    parsedStudents.push({
      grade: currentGrade,
      room: currentRoom,
      roomName: `ม.${currentGrade}/${currentRoom}`,
      roomId: `room-${currentGrade}-${currentRoom}`,
      seatNo,
      studentCode,
      name
    });
  }
}

console.log(`Parsed total ${parsedStudents.length} students from official CSV.`);

// Group by room
const byRoom = new Map();
for (const s of parsedStudents) {
  if (!byRoom.has(s.roomName)) byRoom.set(s.roomName, []);
  byRoom.get(s.roomName).push(s);
}

console.log('\n--- Official CSV Counts by Room ---');
let totalCsv = 0;
for (const [rName, list] of byRoom.entries()) {
  console.log(`${rName}: ${list.length} students`);
  totalCsv += list.length;
}
console.log(`Total in CSV: ${totalCsv}`);

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_mHKSdpe5IM7i@ep-fancy-pine-aom5dqmg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function compareWithDb() {
  await client.connect();

  console.log('\n--- Comparing Official CSV with PostgreSQL Database (Batch Mode) ---');

  // Check the 7 previously unenrolled students:
  const targetUnenrolled = ['16028', '16038', '16045', '16300', '16308', '16323', '16329'];
  console.log('\nChecking location of the 7 previously unenrolled students in CSV:');
  for (const code of targetUnenrolled) {
    const found = parsedStudents.find(s => s.studentCode === code);
    if (found) {
      console.log(`  - Code ${code}: Found in ${found.roomName} (Seat ${found.seatNo}) - ${found.name}`);
    } else {
      console.log(`  - Code ${code}: NOT found in provided CSV (M.1 - M.5)`);
    }
  }

  // Fetch all students and active enrollments in ONE query
  // Note: Canonical schema per DATA_SCHEMA_INDEX.md:
  // "Student" s
  // "StudentEnrollment" se (academicYear = '2569', term = '1', status = 'ENROLLED')
  // student_enrollments sle (academic_year = '2569', term = '1', status = 'ACTIVE')
  const allDbStudents = await client.query(`
    SELECT 
      s.id, 
      s."studentCode", 
      s."title",
      s."firstName", 
      s."lastName", 
      se."classRoomId" as se_room_id, 
      se."rollNumber" as se_roll_no, 
      se.status as se_status,
      sle.classroom_id as sle_room_id,
      sle.roll_number as sle_seat_no,
      sle.status as sle_status,
      cr.name as room_name
    FROM public."Student" s
    LEFT JOIN public."StudentEnrollment" se 
      ON se."studentId" = s.id AND se.status = 'ENROLLED' AND se."academicYear" = 2569 AND se.term = 1
    LEFT JOIN public.student_enrollments sle 
      ON sle.student_id = s.id AND sle.status = 'ACTIVE' AND sle.academic_year = 2569 AND sle.semester = 1
    LEFT JOIN public."ClassRoom" cr 
      ON cr.id = COALESCE(se."classRoomId", sle.classroom_id);
  `);

  const dbMap = new Map();
  for (const row of allDbStudents.rows) {
    dbMap.set(row.studentCode, row);
  }

  const missingFromDb = [];
  const roomMismatches = [];
  const seatMismatches = [];
  const perfectMatches = [];

  for (const s of parsedStudents) {
    const dbRow = dbMap.get(s.studentCode);
    if (!dbRow) {
      missingFromDb.push(s);
    } else {
      const dbRoom = dbRow.se_room_id || dbRow.sle_room_id;
      const dbSeat = dbRow.se_roll_no || dbRow.sle_seat_no;

      if (!dbRoom) {
        roomMismatches.push({
          type: 'UNENROLLED_IN_DB',
          csv: s,
          dbRoom: 'NONE',
          dbRoomName: 'ไม่มีห้อง',
          dbSeat: null
        });
      } else if (dbRoom !== s.roomId) {
        roomMismatches.push({
          type: 'ROOM_DIFFERENT',
          csv: s,
          dbRoom,
          dbRoomName: dbRow.room_name || dbRoom,
          dbSeat
        });
      } else if (dbSeat !== s.seatNo) {
        seatMismatches.push({
          csv: s,
          dbRoom,
          dbRoomName: dbRow.room_name || dbRoom,
          dbSeat: dbSeat
        });
      } else {
        perfectMatches.push(s);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`COMPARISON SUMMARY FOR OFFICIAL CSV (${parsedStudents.length} students):`);
  console.log(`======================================================`);
  console.log(`✅ Perfectly matched (Room & Seat): ${perfectMatches.length}`);
  console.log(`❌ Missing from "Student" table: ${missingFromDb.length}`);
  console.log(`⚠️ Room mismatches (Wrong room or unenrolled): ${roomMismatches.length}`);
  console.log(`⚠️ Seat number mismatches (Right room, wrong seat): ${seatMismatches.length}`);

  if (missingFromDb.length > 0) {
    console.log('\n--- Missing from Database "Student" table ---');
    missingFromDb.forEach(s => console.log(`  Code ${s.studentCode}: ${s.name} (${s.roomName} เลขที่ ${s.seatNo})`));
  }

  if (roomMismatches.length > 0) {
    console.log('\n--- Room Mismatches ---');
    roomMismatches.forEach(m => {
      console.log(`  [${m.type}] Code ${m.csv.studentCode} (${m.csv.name}): Official=${m.csv.roomName} (#${m.csv.seatNo}) vs DB=${m.dbRoomName} (${m.dbRoom} #${m.dbSeat})`);
    });
  }

  if (seatMismatches.length > 0) {
    console.log(`\n--- Seat Mismatches (${seatMismatches.length} students) ---`);
    const seatByRoom = {};
    seatMismatches.forEach(m => {
      seatByRoom[m.csv.roomName] = (seatByRoom[m.csv.roomName] || 0) + 1;
    });
    console.log('Seat mismatches grouped by room:');
    console.log(seatByRoom);
  }

  // Check students currently active in DB for M.1 - M.5 who are NOT in CSV
  const csvCodes = new Set(parsedStudents.map(s => s.studentCode));
  const inDbNotInCsv = allDbStudents.rows.filter(r => {
    const roomId = r.se_room_id || r.sle_room_id;
    return roomId && roomId.match(/^room-[1-5]-/) && !csvCodes.has(r.studentCode);
  });
  console.log(`\nStudents active in DB (M.1 - M.5) NOT in official CSV: ${inDbNotInCsv.length}`);
  if (inDbNotInCsv.length > 0) {
    console.log(inDbNotInCsv.map(r => ({ code: r.studentCode, name: `${r.firstName} ${r.lastName}`.trim(), room: r.room_name, seat: r.se_roll_no || r.sle_seat_no })));
  }

  await client.end();
}

compareWithDb();
