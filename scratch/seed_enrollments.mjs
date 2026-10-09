import { createClient } from '@supabase/supabase-js';

const url = 'https://ngzflajpifmsvhldhviu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';
const sb = createClient(url, key);

async function main() {
  const { data: students, error: sErr } = await sb.from('Student').select('*').order('studentCode', { ascending: true });
  if (sErr) throw sErr;
  console.log(`Found ${students.length} students in Supabase.`);

  const enrollments = [];
  for (const s of students) {
    const code = s.studentCode || '';
    let roomId = 'room-3-1';
    let grade = 3;
    let roomNo = 1;
    let rollNo = parseInt(code.slice(-2), 10) || 1;

    if (code.startsWith('451')) {
      roomId = 'room-3-1'; grade = 3; roomNo = 1;
    } else if (code.startsWith('452')) {
      roomId = 'room-3-2'; grade = 3; roomNo = 2;
    } else if (code.startsWith('471')) {
      roomId = 'room-1-8'; grade = 1; roomNo = 8;
    } else if (code.startsWith('462')) {
      roomId = 'room-2-8'; grade = 2; roomNo = 8;
    } else if (code.startsWith('458')) {
      roomId = 'room-3-8'; grade = 3; roomNo = 8;
    } else if (code.startsWith('470')) {
      roomId = 'room-1-1'; grade = 1; roomNo = 1;
    } else if (code.startsWith('456')) {
      roomId = 'room-3-6'; grade = 3; roomNo = 6;
    } else if (code.startsWith('457')) {
      roomId = 'room-3-7'; grade = 3; roomNo = 7;
    }

    enrollments.push({
      id: `enr-${s.id}`,
      studentId: s.id,
      academicYear: 2569,
      term: 1,
      classRoomId: roomId,
      gradeLevel: grade,
      roomNumber: roomNo,
      rollNumber: rollNo,
      status: 'ENROLLED',
      updatedAt: new Date().toISOString(),
    });
  }

  const { error: insErr } = await sb.from('StudentEnrollment').upsert(enrollments, { onConflict: 'id' });
  if (insErr) {
    console.error('Enrollment upsert error:', insErr);
  } else {
    console.log(`Upserted ${enrollments.length} enrollments successfully!`);
  }

  // Verify classrooms view
  const { data: rooms } = await sb.from('classrooms').select('name, student_count').gt('student_count', 0);
  console.log('Classrooms with students:', rooms);

  // Verify students view for room-3-1
  const { data: stus31 } = await sb.from('students').select('id, name, code, seat_no, classroom_id').eq('classroom_id', 'room-3-1').order('seat_no');
  console.log('Students in room-3-1:', stus31?.length, stus31?.slice(0, 3));
}

main().catch(console.error);
